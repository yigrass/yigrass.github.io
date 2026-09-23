import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { validateNovel } from '../contracts/novel-release-v1/validate.mjs';
import { assertOwnedDirectory } from '../scripts/lib/files.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
async function fixture(t, count = 1) {
  const work = await assertOwnedDirectory(root, '.test-work');
  await fs.mkdir(work, { recursive: true });
  const directory = await fs.mkdtemp(path.join(work, 'novel-'));
  t.after(async () => { if (!directory.startsWith(work + path.sep)) throw Error('Unsafe fixture cleanup'); await fs.rm(directory, { recursive: true, force: true }); });
  const manifest = { schemaVersion: 1, kind: 'novel', id: 'test-book', title: '连载测试', status: 'ongoing', chapters: [] };
  await fs.mkdir(path.join(directory, 'chapters'));
  for (let index = 1; index <= count; index++) {
    const id = `chapter-${String(index).padStart(3, '0')}`;
    manifest.chapters.push({ id, title: `第 ${index} 章`, file: `chapters/${id}.txt` });
    await fs.writeFile(path.join(directory, `chapters/${id}.txt`), `章节 ${index} 正文。\n\n第二段。\n`);
  }
  const save = () => fs.writeFile(path.join(directory, 'release.json'), JSON.stringify(manifest));
  await save();
  return { directory, manifest, save };
}
test('15 chapters → 16 chapters → revised chapter uses one current manifest and unchanged paths', async t => {
  const f = await fixture(t, 15), before = await validateNovel(f.directory);
  f.manifest.chapters.push({ id: 'chapter-016', title: '第 16 章', file: 'chapters/chapter-016.txt' });
  await fs.writeFile(path.join(f.directory, 'chapters/chapter-016.txt'), '新增正文。'); await f.save();
  const appended = await validateNovel(f.directory);
  assert.equal(appended.manifest.chapters.length, 16);
  for (const file of before.files.filter(file => file.path !== 'release.json')) assert.equal(appended.files.find(item => item.path === file.path).sha256, file.sha256);
  await fs.writeFile(path.join(f.directory, 'chapters/chapter-005.txt'), '在源头修订后重新导出的正文。');
  const revised = await validateNovel(f.directory);
  assert.equal(revised.files.length, 17);
  assert.notEqual(revised.digest, appended.digest);
  assert.equal(revised.manifest.chapters[4].file, 'chapters/chapter-005.txt');
});
for (const [name, mutate, message] of [
  ['missing chapter', async f => fs.unlink(path.join(f.directory, f.manifest.chapters[0].file)), /ENOENT/],
  ['duplicate chapter', async f => { f.manifest.chapters.push({ ...f.manifest.chapters[0] }); await f.save(); }, /Duplicate chapter/],
  ['private draft left in package', async f => fs.writeFile(path.join(f.directory, 'draft.txt'), 'not public'), /Unreferenced/],
  ['removed chapter file left in package', async f => fs.writeFile(path.join(f.directory, 'chapters/old.txt'), 'old'), /Unreferenced/],
  ['path traversal', async f => { f.manifest.chapters[0].file = 'chapters/sub/../../secret.txt'; await f.save(); }, /Unsafe package path/],
  ['wrong schema version', async f => { f.manifest.schemaVersion = 2; await f.save(); }, /expected 1/],
  ['unknown metadata field', async f => { f.manifest.drafts = []; await f.save(); }, /unknown field/],
  ['empty current release', async f => { f.manifest.chapters = []; await f.save(); }, /at least 1/],
  ['empty chapter', async f => fs.writeFile(path.join(f.directory, f.manifest.chapters[0].file), ' \r\n'), /Empty chapter/],
  ['non-UTF-8 chapter', async f => fs.writeFile(path.join(f.directory, f.manifest.chapters[0].file), Buffer.from([0xc3, 0x28])), /Invalid UTF-8/]
]) test(`novel rejects ${name}`, async t => {
  const f = await fixture(t); await mutate(f); await assert.rejects(validateNovel(f.directory), message);
});
test('illustrations support explicit paragraph positions and checked local image files', async t => {
  const f = await fixture(t);
  await fs.mkdir(path.join(f.directory, 'images'));
  await fs.copyFile(path.join(root, 'assets/pixel-ui/settings.png'), path.join(f.directory, 'images/scene.png'));
  f.manifest.chapters[0].illustrations = [{ file: 'images/scene.png', alt: '测试插图', afterParagraph: 1 }]; await f.save();
  assert.equal((await validateNovel(f.directory)).files.length, 3);
  f.manifest.chapters[0].illustrations[0].afterParagraph = 3; await f.save();
  await assert.rejects(validateNovel(f.directory), /paragraph count/);
  f.manifest.chapters[0].illustrations[0].afterParagraph = 0; await f.save();
  await fs.writeFile(path.join(f.directory, 'images/scene.png'), 'not an image');
  await assert.rejects(validateNovel(f.directory), /signature/);
});
test('standalone contract validator runs after copying the contract away from website source', async t => {
  const f = await fixture(t);
  const tool = path.join(path.dirname(f.directory), path.basename(f.directory) + '-contract');
  t.after(() => fs.rm(tool, { recursive: true, force: true }));
  await fs.cp(path.join(root, 'contracts/novel-release-v1'), tool, { recursive: true });
  const result = spawnSync(process.execPath, [path.join(tool, 'validate.mjs'), f.directory, 'test-book'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).chapters, 1);
  await assert.rejects(validateNovel(f.directory, 'another-book'), /Expected novel id/);
});
test('portable contract example is a complete valid two-chapter release with one illustration', async () => {
  const result = await validateNovel(path.join(root, 'contracts/novel-release-v1/example'), 'example-book');
  assert.equal(result.manifest.chapters.length, 2);
  assert.equal(result.files.length, 4);
  assert.equal(result.manifest.chapters[0].illustrations[0].afterParagraph, 1);
});
