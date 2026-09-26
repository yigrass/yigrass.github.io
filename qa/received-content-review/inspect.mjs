import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { once } from 'node:events';
import { receiveReleases } from '../../scripts/lib/releases.mjs';
import { assertOwnedDirectory, listFiles, fingerprint } from '../../scripts/lib/files.mjs';
import { receivedProjects } from '../../src/shared/novel/model.js';
import { parseMarkdown } from '../../src/shared/novel/parser.js';
import { mount } from '../../tests/dom-harness.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const output = fileURLToPath(new URL('./', import.meta.url));
const candidate = { category: 'novel', driveId: 'a', release: 'content/cacophony/' };
const directory = path.join(root, candidate.release);
const sourceFiles = await listFiles(directory);
const original = await fingerprint(directory, sourceFiles);
const catalogBytes = await fs.readFile(path.join(root, 'catalog/projects.json'));
const projects = JSON.parse(catalogBytes);
const received = await receiveReleases(root, [candidate]);
const [project] = receivedProjects([candidate], received);
const base = `file-explorer/a-floppy-disk/${project.id}/`;
const documents = [];
for (const document of project.reader.documents) {
  const bytes = await fs.readFile(path.join(directory, document.file));
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  const tokens = parseMarkdown(text);
  documents.push({ id: document.id, title: document.title, file: document.file, bytes: bytes.length, paragraphs: tokens.filter(token => token.type === 'paragraph_open').length, route: base + (document.id ? document.id + '/' : '') });
}
const icon = await fs.readFile(path.join(directory, project.reader.icon));
assert.equal(icon.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
const report = {
  project: { id: project.id, title: project.reader.title, volumeCount: project.reader.volumes.length, chapterCount: documents.length - project.reader.volumes.length - 1, status: project.reader.status },
  rootEntries: (await fs.readdir(directory)).sort(),
  icon: { file: project.reader.icon, width: icon.readUInt32BE(16), height: icon.readUInt32BE(20) },
  registeredInLiveCatalog: projects.some(item => item.release === candidate.release),
  proposedCatalogEntry: candidate,
  received: original,
  documents,
  isolatedBuild: null,
  readerChecks: [],
};
const work = await assertOwnedDirectory(root, '.test-work');
await fs.mkdir(work, { recursive: true });
const fixture = await fs.mkdtemp(path.join(work, 'received-content-review-'));
let server, stopBundle;
try {
  for (const input of ['src', 'catalog', 'content', 'assets', 'scripts', 'node_modules']) await fs.cp(path.join(root, input), path.join(fixture, input), { recursive: true });
  await fs.copyFile(path.join(root, 'package.json'), path.join(fixture, 'package.json'));
  await fs.writeFile(path.join(fixture, 'catalog/projects.json'), JSON.stringify([...projects, candidate], null, 2));
  ({ stop: stopBundle } = await import(pathToFileURL(path.join(fixture, 'node_modules/esbuild/lib/main.js'))));
  const { build } = await import(pathToFileURL(path.join(fixture, 'scripts/build.mjs')));
  const result = await build();
  const { createPreviewServer } = await import(pathToFileURL(path.join(fixture, 'scripts/dev.mjs')));
  server = createPreviewServer(path.join(fixture, 'dist'));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}/`;
  for (const document of documents) {
    assert.ok(result.routes.includes(document.route), document.route);
    assert.equal((await fetch(new URL(document.route, origin))).status, 200);
  }
  for (const file of sourceFiles) {
    const response = await fetch(new URL(candidate.release + file, origin));
    assert.equal(response.status, 200, file);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), await fs.readFile(path.join(directory, file)), file);
  }
  report.isolatedBuild = { passed: true, desktopPages: result.routes.length, receivedProjects: result.releases.length, candidatePages: documents.length, copiedFilesVerified: sourceFiles.length };
  for (const document of documents) {
    const app = await mount('https://example.test/' + document.route, undefined, { projects: [candidate] });
    await app.ready();
    const window = app.win(project.id);
    const prose = window.querySelector('.novel-prose');
    assert.equal(prose.querySelector('h1').textContent, document.title);
    assert.equal(prose.querySelectorAll('p').length, document.paragraphs);
    assert.equal(window.querySelector('.title-icon').src, project.iconPath);
    assert.deepEqual(window.querySelectorAll('.reader-document').map(node => node.title), documents.map(item => item.title));
    report.readerChecks.push({ route: document.route, titleLoaded: true, paragraphsRendered: document.paragraphs, iconPathCorrect: true, manifestOrderPreserved: true });
  }
  assert.deepEqual(await fingerprint(directory, await listFiles(directory)), original);
  assert.deepEqual(await fs.readFile(path.join(root, 'catalog/projects.json')), catalogBytes);
  report.contentAndLiveCatalogUnchanged = true;
  await fs.writeFile(path.join(output, 'results.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ project: report.project, icon: report.icon, registeredInLiveCatalog: report.registeredInLiveCatalog, isolatedBuild: report.isolatedBuild, readerDocumentsChecked: report.readerChecks.length, contentAndLiveCatalogUnchanged: true }, null, 2));
} catch (error) {
  console.error('Review failed:', error);
  throw error;
} finally {
  if (server) await new Promise(resolve => server.close(resolve));
  stopBundle?.();
  if (path.dirname(fixture) !== work || !path.basename(fixture).startsWith('received-content-review-')) throw new Error('Unsafe fixture cleanup');
  await fs.rm(fixture, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
