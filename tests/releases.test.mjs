import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readNovel, receiveReleases } from '../scripts/lib/releases.mjs';
import { assertOwnedDirectory, withinDirectory } from '../scripts/lib/files.mjs';
import { novelDocuments } from '../src/shared/novel/model.js';
const root = fileURLToPath(new URL('../', import.meta.url));
async function fixture(t, count = 1) {
  const work = await assertOwnedDirectory(root, '.test-work'); await fs.mkdir(work, { recursive: true });
  const site = await fs.mkdtemp(path.join(work, 'novel-'));
  t.after(async () => { if (!site.startsWith(work + path.sep)) throw Error('Unsafe fixture'); await fs.rm(site, { recursive: true, force: true }); });
  const directory = path.join(site, 'releases/book');
  await fs.mkdir(path.join(directory, 'text/case-greedy'), { recursive: true });
  await fs.mkdir(path.join(directory, 'images/book'), { recursive: true });
  await fs.copyFile(path.join(root, 'contracts/novel-release-v4/example/images/book/sword.png'), path.join(directory, 'images/book/icon.png'));
  await fs.writeFile(path.join(directory, 'README.md'), '# 整书简介');
  await fs.writeFile(path.join(directory, 'text/case-greedy/README.md'), '# 卷简介');
  const manifest = { schemaVersion: 4, kind: 'novel', id: 'producer-book', icon: 'images/book/icon.png', volumes: [{ id: 'case-greedy', chapters: [] }] };
  async function add(number) { const chapter = { id: number === 1 ? 'prologue' : `ep-${number}` }; manifest.volumes[0].chapters.push(chapter); await fs.writeFile(path.join(directory, 'text/case-greedy', chapter.id + '.md'), `# 第${number}章\n\n当前正文。`); }
  const save = () => fs.writeFile(path.join(directory, 'release.json'), JSON.stringify(manifest));
  const receive = async () => (await receiveReleases(site, [{ category: 'novel', release: 'releases/book/' }]))[0];
  for (let index = 1; index <= count; index++) await add(index);
  await save(); return { site, directory, manifest, add, save, receive, first: manifest.volumes[0].chapters[0] };
}

test('single current manifest supports additions and replacements in the fixed text hierarchy', async t => {
  const f = await fixture(t, 15), before = await f.receive();
  await f.add(16); await f.save();
  const appended = await f.receive(); assert.equal(appended.manifest.volumes[0].chapters.length, 16);
  for (const file of before.files.filter(file => file.path !== 'release.json')) assert.equal(appended.files.find(item => item.path === file.path).sha256, file.sha256);
  await fs.writeFile(path.join(f.directory, 'text/case-greedy/ep-5.md'), '# 改过的标题\n\n源头重新导出的最终文本。');
  const revised = await f.receive(); assert.equal(revised.files.length, 20); assert.notEqual(revised.digest, appended.digest);
  assert.equal(revised.manifest.volumes[0].chapters[4].title, '改过的标题');
});

test('fixed README discovery, producer IDs and H1 titles preserve manifest order over filesystem order', async t => {
  const f = await fixture(t, 2);
  f.manifest.title = '不能覆盖 H1';
  await fs.cp(path.join(f.directory, 'text/case-greedy'), path.join(f.directory, 'text/case-01'), { recursive: true });
  f.manifest.volumes.push({ id: 'case-01', title: '不能覆盖 H1', chapters: [{ ...f.first }] });
  await f.save();
  const { manifest } = await f.receive();
  assert.equal(manifest.id, 'producer-book'); assert.equal(manifest.title, '整书简介');
  assert.deepEqual(novelDocuments(manifest).map(item => item.id), [null, 'case-greedy', 'case-greedy/prologue', 'case-greedy/ep-2', 'case-01', 'case-01/prologue']);
  assert.deepEqual(manifest.volumes.map(volume => volume.title), ['卷简介', '卷简介']);
  assert.equal(manifest.volumes[0].chapters[0].file, 'text/case-greedy/prologue.md');
  assert.equal(manifest.readme.file, 'README.md'); assert.equal(manifest.volumes[1].readme.file, 'text/case-01/README.md');
  assert.equal(Object.hasOwn(f.manifest, 'readme'), false); assert.equal(Object.hasOwn(f.manifest.volumes[0], 'readme'), false);
  f.manifest.volumes.reverse(); f.manifest.volumes[1].chapters.reverse(); await f.save();
  assert.deepEqual(novelDocuments((await f.receive()).manifest).map(item => item.id), [null, 'case-01', 'case-01/prologue', 'case-greedy', 'case-greedy/ep-2', 'case-greedy/prologue']);
});

test('receiver does not validate producer metadata, naming, duplicates, unused files or prose', async t => {
  const f = await fixture(t);
  await fs.rename(path.join(f.directory, 'text/case-greedy/prologue.md'), path.join(f.directory, 'text/case-greedy/没有数字.md'));
  f.manifest.extra = { producer: true }; f.first.id = '没有数字';
  f.manifest.volumes[0].chapters.push({ ...f.first });
  await fs.writeFile(path.join(f.directory, 'text/case-greedy/没有数字.md'), '没有 H1 的正文');
  await fs.writeFile(path.join(f.directory, 'text/extra.md'), '也会随成品复制'); await f.save();
  const result = await f.receive();
  assert.equal(result.manifest.volumes[0].chapters.length, 2);
  assert.equal(result.manifest.volumes[0].chapters[0].id, '没有数字');
  assert.equal(result.manifest.volumes[0].chapters[0].title, '');
  assert.deepEqual(result.manifest.extra, { producer: true });
  assert.ok(result.files.find(file => file.path === 'text/extra.md'));
});

test('multiple chapter images stay scoped and retain their names and bytes', async t => {
  const f = await fixture(t), imageDirectory = path.join(f.directory, 'images/case-greedy/prologue');
  await fs.mkdir(imageDirectory, { recursive: true });
  const png = await fs.readFile(path.join(f.directory, 'images/book/icon.png'));
  const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  await fs.writeFile(path.join(imageDirectory, 'scene.png'), png); await fs.writeFile(path.join(imageDirectory, 'end.gif'), gif);
  const received = await f.receive();
  assert.ok(received.files.find(file => file.path === 'images/case-greedy/prologue/scene.png'));
  assert.ok(received.files.find(file => file.path === 'images/case-greedy/prologue/end.gif'));
  assert.deepEqual(await fs.readFile(path.join(imageDirectory, 'end.gif')), gif);
  assert.deepEqual((await fs.readdir(f.directory)).sort(), ['README.md','images','release.json','text']);
});

test('ordinary missing fixed files and filesystem escapes still stop receiving', async t => {
  const f = await fixture(t);
  assert.throws(() => withinDirectory(f.directory, '../outside.md'), /escapes directory/);
  f.first.id = '../../../outside'; await f.save(); await assert.rejects(f.receive(), /escapes directory/);
  f.first.id = 'absent'; await f.save(); await assert.rejects(f.receive(), /ENOENT/);
  f.first.id = 'prologue'; await f.save();
  await fs.unlink(path.join(f.directory, 'text/case-greedy/README.md')); await assert.rejects(f.receive(), /ENOENT/);
  await fs.writeFile(path.join(f.directory, 'release.json'), '{invalid'); await assert.rejects(f.receive(), SyntaxError);
});

test('portable v4 contract example has exactly four root entries and no configurable document paths', async () => {
  const directory = path.join(root, 'contracts/novel-release-v4/example');
  assert.deepEqual((await fs.readdir(directory)).sort(), ['README.md','images','release.json','text']);
  const raw = JSON.parse(await fs.readFile(path.join(directory, 'release.json'), 'utf8'));
  assert.equal(Object.hasOwn(raw, 'readme'), false);
  for (const volume of raw.volumes) { assert.equal(Object.hasOwn(volume, 'readme'), false); for (const chapter of volume.chapters) assert.deepEqual(Object.keys(chapter), ['id']); }
  const manifest = await readNovel(directory), documents = novelDocuments(manifest);
  assert.equal(manifest.schemaVersion, 4); assert.equal(manifest.volumes.length, 2);
  assert.equal(documents.filter(item => item.kind === 'chapter').length, 5);
  assert.ok(documents.some(item => item.id === 'case-01/ep-05')); assert.ok(documents.some(item => item.id === 'case-02/ep-05'));
  for (const item of documents) assert.ok(item.file.endsWith('.md'));
  const schema = JSON.parse(await fs.readFile(path.join(directory, '../release.schema.json'), 'utf8'));
  assert.equal(schema.properties.schemaVersion.const, 4);
  assert.equal(Object.hasOwn(schema.properties, 'readme'), false);
});
