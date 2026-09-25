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
  for (const route of ['src/index.html', 'art/pixel-ui/README.md', 'qa/task-transitions.jsonl', 'scripts/build.mjs', 'contracts/novel-release-v4/README.md', 'project-task-tree.json', '.git/config', 'novels/story-a/', 'games/game-b/', '../README.md', '%2e%2e%5cREADME.md']) assert.equal((await fetch(new URL(route, base))).status, 404, route);
  const main = await fetch(new URL('app/main.js', base)); assert.match(main.headers.get('content-type'), /javascript/);
  const text = await fetch(new URL('content/sh-tales/text/case-01/ep-01.md', base)); assert.match(await text.text(), /第一章 · 借火/);
  assert.ok(result.routes.includes('file-explorer/a-floppy-disk/sh-tales/case-01/ep-02/'));
  assert.ok(result.routes.includes('file-explorer/a-floppy-disk/sh-tales/case-02/'));
  assert.ok(result.routes.includes('file-explorer/a-floppy-disk/sh-tales/case-01/ep-05/'));
  assert.ok(result.routes.includes('file-explorer/a-floppy-disk/sh-tales/case-02/ep-05/'));
  assert.equal((await fetch(new URL('licenses/markdown-it/LICENSE', base))).status, 200);
  const index = await (await fetch(new URL('catalog/projects.json', base))).json();
  assert.equal(index[0].reader.documents.length, 8);
  assert.equal(index[0].iconPath, 'content/sh-tales/images/book/sword.png');
  assert.equal(index[0].reader.title, '桑海志怪');
  assert.deepEqual((await fs.readdir(path.join(projectRoot, 'dist/content/sh-tales'))).sort(), ['README.md', 'images', 'release.json', 'text']);
  assert.equal(index[0].reader.volumes[0].readme.file, 'text/case-01/README.md');
  assert.equal(index[0].reader.volumes[1].chapters[0].file, 'text/case-02/prologue.md');
  assert.equal((await fetch(new URL('file-explorer', base), { redirect: 'manual' })).status, 301);
  const asset = siteConfig.wallpaper;
  assert.deepEqual(await fs.readFile(path.join(projectRoot, 'dist', asset)), await fs.readFile(path.join(projectRoot, asset)));
});
test('clean input copy builds without art or other projects; invalid release preserves previous dist', async t => {
  const work = await assertOwnedDirectory(projectRoot, '.test-work'); await fs.mkdir(work, { recursive: true });
  const fixture = await fs.mkdtemp(path.join(work, 'site-'));
  t.after(async () => { if (!fixture.startsWith(work + path.sep)) throw Error('Unsafe fixture'); await fs.rm(fixture, { recursive: true, force: true }); });
  for (const directory of ['src', 'catalog', 'content', 'assets', 'scripts', 'node_modules']) await fs.cp(path.join(projectRoot, directory), path.join(fixture, directory), { recursive: true });
  await fs.copyFile(path.join(projectRoot, 'package.json'), path.join(fixture, 'package.json'));
  const run = () => spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: fixture, encoding: 'utf8' });
  assert.equal(run().status, 0);
  await assert.rejects(fs.access(path.join(fixture, 'art')));
  const entry = path.join(fixture, 'dist/index.html'), before = await fs.readFile(entry);
  await fs.unlink(path.join(fixture, 'content/sh-tales/text/case-01/ep-01.md'));
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
