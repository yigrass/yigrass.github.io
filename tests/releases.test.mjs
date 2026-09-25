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
  const directory = path.join(site, 'releases/book'); await fs.mkdir(path.join(directory, 'chapters'), { recursive: true });
  await fs.writeFile(path.join(directory, 'README.md'), '# 整书简介');
  await fs.writeFile(path.join(directory, 'volume.md'), '# 卷简介');
  const manifest = { schemaVersion: 3, kind: 'novel', id: 'producer-book', icon: 'icon.png', readme: { file: 'README.md' }, volumes: [{ id: 'case-greedy', readme: { file: 'volume.md' }, chapters: [] }] };
  async function add(number) { const chapter = { id: `ep-${number}`, file: `chapters/text-${number}.md` }; manifest.volumes[0].chapters.push(chapter); await fs.writeFile(path.join(directory, chapter.file), `# 第${number}章\n\n当前正文。`); }
  const save = () => fs.writeFile(path.join(directory, 'release.json'), JSON.stringify(manifest));
  const receive = async () => (await receiveReleases(site, [{ category: 'novel', release: 'releases/book/' }]))[0];
  for (let index = 1; index <= count; index++) await add(index);
  await save(); return { site, directory, manifest, add, save, receive, first: manifest.volumes[0].chapters[0] };
}

test('single current manifest supports chapter additions and source replacements with byte receipts', async t => {
  const f = await fixture(t, 15), before = await f.receive();
  await f.add(16); await f.save();
  const appended = await f.receive(); assert.equal(appended.manifest.volumes[0].chapters.length, 16);
  for (const file of before.files.filter(file => file.path !== 'release.json')) assert.equal(appended.files.find(item => item.path === file.path).sha256, file.sha256);
  await fs.writeFile(path.join(f.directory, 'chapters/text-5.md'), '# 改过的标题\n\n源头重新导出的最终文本。');
  const revised = await f.receive(); assert.equal(revised.files.length, 19); assert.notEqual(revised.digest, appended.digest);
  assert.equal(revised.manifest.volumes[0].chapters[4].title, '改过的标题');
});

test('producer IDs, array order and first Markdown H1 are received without inference', async t => {
  const f = await fixture(t, 2);
  f.manifest.title = '不能覆盖 H1'; f.first.id = 'prologue'; f.manifest.volumes[0].chapters.reverse();
  f.manifest.volumes.push({ id: 'case-01', title: '不能覆盖 H1', readme: { file: 'volume.md' }, chapters: [{ ...f.first }] });
  await f.save();
  const { manifest } = await f.receive();
  assert.equal(manifest.id, 'producer-book'); assert.equal(manifest.title, '整书简介');
  assert.deepEqual(novelDocuments(manifest).map(item => item.id), [null, 'case-greedy', 'case-greedy/ep-2', 'case-greedy/prologue', 'case-01', 'case-01/prologue']);
  assert.deepEqual(manifest.volumes.map(volume => volume.title), ['卷简介', '卷简介']);
  assert.equal(manifest.volumes[0].chapters[0].file, 'chapters/text-2.md');
});

test('receiver does not validate producer metadata, naming, duplicates, unused files or prose', async t => {
  const f = await fixture(t);
  f.manifest.extra = { producer: true }; f.first.id = '没有数字';
  f.manifest.volumes[0].chapters.push({ ...f.first });
  await fs.writeFile(path.join(f.directory, f.first.file), '没有 H1 的正文');
  await fs.writeFile(path.join(f.directory, 'extra.md'), '也会随成品复制'); await f.save();
  const result = await f.receive();
  assert.equal(result.manifest.volumes[0].chapters.length, 2);
  assert.equal(result.manifest.volumes[0].chapters[0].id, '没有数字');
  assert.equal(result.manifest.volumes[0].chapters[0].title, '');
  assert.deepEqual(result.manifest.extra, { producer: true });
  assert.ok(result.files.find(file => file.path === 'extra.md'));
});

test('ordinary read failures and filesystem escapes still stop receiving', async t => {
  const f = await fixture(t);
  assert.throws(() => withinDirectory(f.directory, '../outside.md'), /escapes directory/);
  f.first.file = '../outside.md'; await f.save(); await assert.rejects(f.receive(), /escapes directory/);
  f.first.file = 'absent.md'; await f.save(); await assert.rejects(f.receive(), /ENOENT/);
  await fs.writeFile(path.join(f.directory, 'release.json'), '{invalid'); await assert.rejects(f.receive(), SyntaxError);
});

test('portable v3 contract example carries two volumes, duplicate scoped IDs and Markdown only', async () => {
  const directory = path.join(root, 'contracts/novel-release-v3/example');
  const manifest = await readNovel(directory), documents = novelDocuments(manifest);
  assert.equal(manifest.schemaVersion, 3); assert.equal(manifest.volumes.length, 2);
  assert.equal(documents.filter(item => item.kind === 'chapter').length, 5);
  assert.ok(documents.some(item => item.id === 'case-01/ep-05')); assert.ok(documents.some(item => item.id === 'case-02/ep-05'));
  for (const item of documents) assert.ok(item.file.endsWith('.md'));
  const schema = JSON.parse(await fs.readFile(path.join(directory, '../release.schema.json'), 'utf8'));
  assert.equal(schema.properties.schemaVersion.const, 3);
});
