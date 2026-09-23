import test from 'node:test';
import assert from 'node:assert/strict';
import { mount } from './dom-harness.mjs';
const settle = () => new Promise(resolve => setImmediate(resolve));
const manifest = { schemaVersion: 1, kind: 'novel', id: 'story-a', title: '阅读测试', chapters: [
  { id: 'first', title: '第一章', file: 'chapters/first.txt', illustrations: [{ file: 'images/scene.png', alt: '海边', afterParagraph: 1 }] },
  { id: 'second', title: '第二章', file: 'chapters/second.txt' }
] };
const responses = { 'releases/story-a/release.json': JSON.stringify(manifest), 'releases/story-a/chapters/first.txt': '第一段。\r\n\r\n<script>只是文字</script>', 'releases/story-a/chapters/second.txt': '第二章正文。' };
test('reader uses manifest order, literal text, illustrations and preserves selection on minimize', async () => {
  const app = await mount('https://example.test/file-explorer/a-floppy-disk/story-a/', 'https://example.test/', { responses }); await app.ready();
  const body = app.win('story-a'), article = body.querySelector('.novel-chapter'), select = body.querySelector('.chapter-select');
  assert.equal(article.children[1].tag, 'figure');
  assert.equal(article.querySelector('img').alt, '海边');
  assert.match(article.textContent, /<script>只是文字<\/script>/); assert.equal(article.querySelector('script'), null);
  select.value = '1'; select.fire('change'); await settle();
  assert.equal(article.textContent, '第二章正文。');
  app.click(body.querySelector('.control-min')); app.click(app.tab('project-story-a'));
  assert.equal(select.value, '1'); assert.equal(article.textContent, '第二章正文。');
});
test('slow chapter response cannot replace a newer selection or revive a closed window', async () => {
  let resolve;
  const pending = new Promise(done => { resolve = done; });
  const app = await mount('https://example.test/file-explorer/a-floppy-disk/story-a/', 'https://example.test/', { responses: { ...responses, 'releases/story-a/chapters/second.txt': () => pending } }); await app.ready();
  const body = app.win('story-a'), select = body.querySelector('.chapter-select');
  select.value = '1'; select.fire('change'); select.value = '0'; select.fire('change'); await settle();
  resolve({ ok: true, text: async () => '迟到的第二章' }); await settle();
  assert.match(body.querySelector('.novel-chapter').textContent, /第一段/);
  app.click(body.querySelector('.control-close')); await settle(); assert.equal(app.win('story-a'), null);
});
