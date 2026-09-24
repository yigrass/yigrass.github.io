import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { validateNovel } from '../contracts/novel-release-v2/validate.mjs';
import { assertOwnedDirectory } from '../scripts/lib/files.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
async function fixture(t, count = 1) {
  const work = await assertOwnedDirectory(root, '.test-work'); await fs.mkdir(work, { recursive: true });
  const directory = await fs.mkdtemp(path.join(work, 'novel-'));
  t.after(async () => { if (!directory.startsWith(work + path.sep)) throw Error('Unsafe fixture'); await fs.rm(directory, { recursive: true, force: true }); });
  for (const dir of ['chapters', 'images']) await fs.mkdir(path.join(directory, dir));
  await fs.copyFile(path.join(root, 'assets/pixel-ui/v1.4.0/sword.png'), path.join(directory, 'images/icon.png'));
  await fs.writeFile(path.join(directory, 'README.md'), '# 整书简介');
  await fs.writeFile(path.join(directory, 'volume.md'), '# 卷简介');
  const manifest = { schemaVersion: 2, kind: 'novel', id: 'test-book', title: '测试小说', status: 'ongoing', icon: 'images/icon.png', readme: { file: 'README.md' }, volumes: [{ id: 'volume-one', title: '第一卷', readme: { file: 'volume.md' }, chapters: [] }] };
  async function add(number) { const chapter = { id: `chapter-${number}`, title: `第${number}章`, file: `chapters/chapter-${number}.md` }; manifest.volumes[0].chapters.push(chapter); await fs.writeFile(path.join(directory, chapter.file), `# ${chapter.title}\n\n第一段。\n\n第二段。`); }
  const save = () => fs.writeFile(path.join(directory, 'release.json'), JSON.stringify(manifest));
  for (let index = 1; index <= count; index++) await add(index);
  await save(); return { directory, manifest, add, save, first: manifest.volumes[0].chapters[0] };
}
test('current release supports 15 to 16 chapters and source revisions without retaining old files', async t => {
  const f = await fixture(t, 15), before = await validateNovel(f.directory);
  await f.add(16); await f.save();
  const appended = await validateNovel(f.directory); assert.equal(appended.manifest.volumes[0].chapters.length, 16);
  for (const file of before.files.filter(file => file.path !== 'release.json')) assert.equal(appended.files.find(item => item.path === file.path).sha256, file.sha256);
  await fs.writeFile(path.join(f.directory, 'chapters/chapter-5.md'), '源头重新导出的最终文本。');
  const revised = await validateNovel(f.directory); assert.equal(revised.files.length, 20); assert.notEqual(revised.digest, appended.digest);
});
for (const [name, mutate, message] of [
  ['missing chapter', async f => fs.unlink(path.join(f.directory, f.first.file)), /ENOENT/],
  ['duplicate chapter route', async f => { f.manifest.volumes[0].chapters.push({ ...f.first }); await f.save(); }, /Duplicate document route/],
  ['volume chapter route collision', async f => { f.first.id = 'volume-one'; await f.save(); }, /Duplicate document route/],
  ['duplicate README file', async f => { f.manifest.readme.file = 'volume.md'; await f.save(); }, /Duplicate document file/],
  ['missing book README', async f => { delete f.manifest.readme; await f.save(); }, /missing readme/],
  ['missing volume README', async f => { delete f.manifest.volumes[0].readme; await f.save(); }, /missing readme/],
  ['private draft', async f => fs.writeFile(path.join(f.directory, 'draft.md'), 'not public'), /Unreferenced/],
  ['path traversal', async f => { f.first.file = 'chapters/sub/../../secret.md'; await f.save(); }, /Unsafe package path/],
  ['TXT chapter', async f => { f.first.file = 'chapters/first.txt'; await f.save(); }, /invalid format/],
  ['TXT README', async f => { f.manifest.readme.file = 'README.txt'; await f.save(); }, /invalid format/],
  ['legacy schema', async f => { f.manifest.schemaVersion = 1; await f.save(); }, /expected 2/],
  ['unsupported configuration', async f => { f.manifest.reader = {}; await f.save(); }, /unknown field/],
  ['no volumes', async f => { f.manifest.volumes = []; await f.save(); }, /at least 1/],
  ['no chapters', async f => { f.manifest.volumes[0].chapters = []; await f.save(); }, /at least 1/],
  ['empty Markdown', async f => fs.writeFile(path.join(f.directory, f.first.file), ' \r\n'), /Empty Markdown/],
  ['invalid UTF-8', async f => fs.writeFile(path.join(f.directory, f.first.file), Buffer.from([0xc3, 0x28])), /Invalid UTF-8/],
  ['unpublished document link', async f => fs.writeFile(path.join(f.directory, f.first.file), '[草稿](chapters/draft.md)'), /published Markdown/],
  ['false PNG icon', async f => fs.writeFile(path.join(f.directory, 'images/icon.png'), 'fake'), /signature/]
]) test(`novel v2 rejects ${name}`, async t => { const f = await fixture(t); await mutate(f); await assert.rejects(validateNovel(f.directory), message); });
test('Markdown images resolve from package root; published document links and reused images validate', async t => {
  const f = await fixture(t);
  await fs.writeFile(path.join(f.directory, f.first.file), '# 图\n\n![宝剑](images/icon.png)\n\n[书](README.md)');
  assert.equal((await validateNovel(f.directory)).files.length, 5);
  await fs.writeFile(path.join(f.directory, f.first.file), '![图](images/missing.png)');
  await assert.rejects(validateNovel(f.directory), /ENOENT/);
});
test('standalone v2 contract works outside website source; bundled two-volume five-chapter example validates', async t => {
  const f = await fixture(t), tool = path.join(f.directory, 'contract');
  await fs.cp(path.join(root, 'contracts/novel-release-v2'), tool, { recursive: true });
  const result = spawnSync(process.execPath, [path.join(tool, 'validate.mjs'), path.join(tool, 'example'), 'example-book'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout); assert.equal(report.volumes, 2); assert.equal(report.chapters, 5); assert.equal(report.files.length, 10);
  await assert.rejects(validateNovel(path.join(tool, 'example'), 'wrong-book'), /Expected novel id/);
});
