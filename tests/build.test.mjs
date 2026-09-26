import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { once } from 'node:events';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { build, projectRoot } from '../scripts/build.mjs';
import { createPreviewServer } from '../scripts/dev.mjs';
import { assertOwnedDirectory } from '../scripts/lib/files.mjs';
import { siteConfig } from '../src/config/site.js';

test('dist serves all deep entries, module imports and release bytes; maintenance paths are absent', async t => {
  const result = await build();
  const server = createPreviewServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/`;
  for (const route of result.routes) {
    const response = await fetch(new URL(route, base)); assert.equal(response.status, 200);
    const html = await response.text();
    const entryBase = new URL(html.match(/<base href="([^"]+)"/)[1], new URL(route, base));
    assert.equal(entryBase.href, base);
    for (const match of html.matchAll(/(?:src|href)="((?:assets|app)\/[^"#]+)"/g)) assert.equal((await fetch(new URL(match[1], entryBase))).status, 200, match[1]);
  }
  for (const route of ['src/index.html', 'art/pixel-ui/README.md', 'qa/task-transitions.jsonl', 'scripts/build.mjs', 'contracts/novel-release-v4/README.md', 'project-task-tree.json', '.git/config', 'novels/test-book/', 'games/test-web/', '../README.md', '%2e%2e%5cREADME.md']) assert.equal((await fetch(new URL(route, base))).status, 404, route);
  const main = await fetch(new URL('app/main.js', base)); assert.match(main.headers.get('content-type'), /javascript/);
  assert.equal((await fetch(new URL('licenses/markdown-it/LICENSE', base))).status, 200);
  const index = await (await fetch(new URL('catalog/projects.json', base))).json();
  const registered = JSON.parse(await fs.readFile(path.join(projectRoot, 'catalog/projects.json'), 'utf8'));
  assert.deepEqual(index.map(project => project.release), registered.map(project => project.release));
  for (const project of index.filter(project => project.reader)) {
    const manifest = JSON.parse(await fs.readFile(path.join(projectRoot, project.release, 'release.json'), 'utf8'));
    const documentIds = [null, ...manifest.volumes.flatMap(volume => [volume.id, ...volume.chapters.map(chapter => `${volume.id}/${chapter.id}`)])];
    assert.deepEqual(project.reader.documents.map(document => document.id), documentIds);
    assert.equal(project.iconPath, project.release + manifest.icon);
    assert.equal((await fetch(new URL(project.iconPath, base))).status, 200);
    assert.deepEqual((await fs.readdir(path.join(projectRoot, 'dist', project.release))).sort(), ['README.md', 'images', 'release.json', 'text']);
    const drive = siteConfig.explorer.drives.find(drive => drive.id === project.driveId);
    const bookRoute = `${siteConfig.applicationRoutes.works}/${drive.slug}/${manifest.id}/`;
    for (const document of project.reader.documents) {
      assert.ok(result.routes.includes(bookRoute + (document.id ? document.id + '/' : '')));
      const response = await fetch(new URL(project.release + document.file, base));
      assert.equal(response.status, 200);
      assert.equal(await response.text(), await fs.readFile(path.join(projectRoot, project.release, document.file), 'utf8'));
    }
  }
  assert.equal((await fetch(new URL('file-explorer', base), { redirect: 'manual' })).status, 301);
  const asset = siteConfig.wallpaper;
  assert.deepEqual(await fs.readFile(path.join(projectRoot, 'dist', asset)), await fs.readFile(path.join(projectRoot, asset)));
});
test('clean input copy builds without art or other projects; invalid input preserves previous dist', async t => {
  const work = await assertOwnedDirectory(projectRoot, '.test-work'); await fs.mkdir(work, { recursive: true });
  const fixture = await fs.mkdtemp(path.join(work, 'site-'));
  t.after(async () => { if (!fixture.startsWith(work + path.sep)) throw Error('Unsafe fixture'); await fs.rm(fixture, { recursive: true, force: true }); });
  for (const directory of ['src', 'catalog', 'content', 'assets', 'scripts', 'node_modules']) await fs.cp(path.join(projectRoot, directory), path.join(fixture, directory), { recursive: true });
  await fs.copyFile(path.join(projectRoot, 'package.json'), path.join(fixture, 'package.json'));
  const run = () => spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: fixture, encoding: 'utf8' });
  assert.equal(run().status, 0);
  await assert.rejects(fs.access(path.join(fixture, 'art')));
  const entry = path.join(fixture, 'dist/index.html'), before = await fs.readFile(entry);
  await fs.writeFile(path.join(fixture, 'catalog/projects.json'), '{invalid');
  assert.notEqual(run().status, 0);
  assert.deepEqual(await fs.readFile(entry), before);
  await assert.rejects(assertOwnedDirectory(fixture, '../art'), /Unsafe/);
});
test('built release receipts match every published package file', async () => {
  const receipts = JSON.parse(await fs.readFile(path.join(projectRoot, 'dist/release-integrity.json'), 'utf8'));
  for (const receipt of receipts) for (const file of receipt.files) {
    const bytes = await fs.readFile(path.join(projectRoot, 'dist', receipt.release, file.path));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256);
    assert.equal(bytes.length, file.bytes);
  }
});
