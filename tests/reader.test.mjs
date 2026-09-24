import test from 'node:test';
import assert from 'node:assert/strict';
import { mount } from './dom-harness.mjs';
import { parseMarkdown, references } from '../contracts/novel-release-v2/markdown.mjs';
const settle = () => new Promise(resolve => setImmediate(resolve));
const base = '/file-explorer/a-floppy-disk/story-a/';
const manifest = { schemaVersion: 2, kind: 'novel', id: 'story-a', title: '阅读测试', icon: 'images/icon.png', readme: { file: 'README.md' }, volumes: [
  { id: 'volume-a', title: '第一卷', readme: { file: 'volumes/a.md' }, chapters: [
    { id: 'first', title: '第一章', file: 'chapters/first.md' },
    { id: 'second', title: '第二章', file: 'chapters/second.md' }
  ] },
  { id: 'volume-b', title: '第二卷', readme: { file: 'volumes/b.md' }, chapters: [
    { id: 'third', title: '第三章', file: 'chapters/third.md' }
  ] }
] };
const responses = {
  'releases/story-a/release.json': JSON.stringify(manifest),
  'releases/story-a/README.md': '# 书的介绍\n\n从 [第一章](chapters/first.md) 开始。',
  'releases/story-a/volumes/a.md': '# 第一卷序\n\n卷一的介绍。',
  'releases/story-a/volumes/b.md': '# 第二卷序\n\n卷二的介绍。',
  'releases/story-a/chapters/first.md': '# 第一章\n\n第一段**强调**。\n\n![海边](images/scene.png)\n\n<script>只是文字</script>\n\n[危险](javascript:alert)\n\n[继续](chapters/second.md)',
  'releases/story-a/chapters/second.md': '# 第二章\n\n第二章正文。',
  'releases/story-a/chapters/third.md': '# 第三章\n\n第三章正文。'
};
const doc = (app, id, index = 0) => app.win('story-a').querySelectorAll('.reader-document').filter(item => item.dataset.documentId === (id || ''))[index];
const article = app => app.win('story-a').querySelector('.novel-chapter');
const content = app => app.manager.getWindow('project-story-a').content;

test('book/volume README precede chapters; branches and whole directory collapse without changing the reading window', async () => {
  const app = await mount('https://example.test' + base, undefined, { responses }); await app.ready();
  const body = app.win('story-a');
  assert.match(article(app).textContent, /书的介绍/);
  assert.deepEqual(body.querySelectorAll('.reader-document').map(node => node.dataset.documentId), ['', '', 'volume-a', 'volume-a', 'first', 'second', 'volume-b', 'volume-b', 'third']);
  app.click(doc(app, 'volume-a')); await settle();
  assert.equal(app.location.pathname, base + 'volume-a/');
  assert.match(article(app).textContent, /第一卷序/);
  assert.equal(app.get('reader-group-story-a-volume-a').hidden, true);
  assert.match(doc(app, 'volume-a').querySelector('img').src, /book-closed/);
  app.click(doc(app, 'volume-a')); await settle();
  assert.equal(app.get('reader-group-story-a-volume-a').hidden, false);
  assert.match(doc(app, 'volume-a').querySelector('img').src, /book-open/);
  const before = app.history.length;
  app.click(doc(app, 'volume-a', 1)); await settle();
  assert.equal(app.history.length, before);
  const toggle = body.querySelector('.reader-directory-toggle');
  assert.equal(toggle.textContent, '<<'); assert.equal(toggle.querySelector('img'), null);
  article(app).scrollTop = 120;
  app.click(toggle); assert.equal(body.querySelector('.reader-sidebar').hidden, true);
  assert.equal(toggle.textContent, '>>'); assert.equal(toggle.getAttribute('aria-label'), '显示目录');
  assert.equal(article(app).scrollTop, 120);
  assert.match(article(app).textContent, /第一卷序/);
  app.click(toggle); assert.equal(body.querySelector('.reader-sidebar').hidden, false);
  assert.equal(toggle.textContent, '<<'); assert.equal(toggle.getAttribute('aria-label'), '收起目录');
  assert.equal(article(app).scrollTop, 120);
  app.click(doc(app, null)); await settle();
  assert.equal(app.get('reader-group-story-a-book').hidden, true);
  assert.match(article(app).textContent, /书的介绍/);
});

test('direct chapter entry, safe Markdown rendering, shared icon, chapter links and desktop history retain reader state', async () => {
  const app = await mount('https://example.test' + base + 'first/', undefined, { responses }); await app.ready();
  const body = app.win('story-a'), text = article(app);
  assert.equal(app.location.pathname, base + 'first/');
  assert.equal(text.querySelector('strong').textContent, '强调');
  assert.equal(text.querySelector('img').alt, '海边');
  assert.equal(text.querySelector('script'), null);
  assert.match(text.textContent, /<script>只是文字<\/script>/);
  assert.equal(text.querySelectorAll('a').length, 1);
  assert.equal(body.querySelector('.title-icon').src, doc(app, null).querySelector('img').src);
  assert.equal(body.querySelector('.title-icon').src, 'releases/story-a/images/icon.png');
  app.click(text.querySelector('a')); await settle();
  assert.equal(app.location.pathname, base + 'second/');
  text.scrollTop = 123;
  app.click(body.querySelector('.control-min')); assert.equal(app.location.pathname, '/');
  app.click(app.tab('project-story-a'));
  assert.equal(app.location.pathname, base + 'second/'); assert.equal(article(app), text); assert.equal(text.scrollTop, 123);
  app.history.go(-1); await settle(); assert.equal(app.location.pathname, base + 'first/'); assert.match(text.textContent, /第一段/);
  app.history.go(1); await settle(); assert.equal(app.location.pathname, base + 'second/'); assert.match(text.textContent, /第二章正文/);
});

test('keyboard and menu-bar buttons skip README across volumes and respect active window, menus and boundaries', async () => {
  const app = await mount('https://example.test' + base + 'second/', undefined, { responses }); await app.ready();
  const press = key => app.window.fire('keydown', { key });
  assert.equal(press('ArrowRight').defaultPrevented, true); await settle();
  assert.equal(app.location.pathname, base + 'third/');
  assert.equal(app.win('story-a').querySelector('.reader-next').disabled, true);
  assert.equal(press('ArrowRight').defaultPrevented, undefined);
  app.click(app.win('story-a').querySelector('.reader-previous')); await settle();
  assert.equal(app.location.pathname, base + 'second/');
  app.click(app.get('start-button')); press('ArrowRight'); assert.equal(app.location.pathname, base + 'second/');
  app.click(app.get('start-button')); app.menu('settings'); press('ArrowRight');
  assert.equal(app.location.pathname, '/system-settings/'); assert.equal(content(app).getDocumentId(), 'second');
  app.click(app.tab('project-story-a'));
  app.window.fire('keydown', { key: 'ArrowRight', ctrlKey: true }); assert.equal(app.location.pathname, base + 'second/');
  await content(app).navigateDocument('first'); assert.equal(app.win('story-a').querySelector('.reader-previous').disabled, true);
  assert.ok(Number.parseFloat(article(app).style['--reader-scroll-space']) > 800);
});

test('reader placeholder menus switch without flipping chapters, dismiss predictably and release their listeners', async () => {
  const app = await mount('https://example.test' + base + 'second/', undefined, { responses }); await app.ready();
  const body = app.win('story-a'), bar = body.querySelector('.reader-menubar');
  const [file, view] = bar.querySelectorAll('.reader-menu-trigger');
  const [filePopup, viewPopup] = bar.querySelectorAll('.reader-menu-popup');
  const press = key => app.window.fire('keydown', { key });
  const before = app.history.length;
  assert.deepEqual([file.textContent, view.textContent], ['文件', '查看']);
  assert.equal(body.querySelector('.reader-edge'), null);
  assert.equal(bar.querySelectorAll('.reader-page-arrow').length, 2);
  for (const popup of [filePopup, viewPopup]) {
    assert.equal(popup.hidden, true); assert.equal(popup.textContent, '功能开发中');
    assert.equal(popup.querySelector('button').disabled, true);
  }
  app.click(file); assert.equal(filePopup.hidden, false); assert.equal(file.getAttribute('aria-expanded'), 'true');
  assert.equal(press('ArrowRight').defaultPrevented, true); await settle();
  assert.equal(filePopup.hidden, true); assert.equal(viewPopup.hidden, false);
  assert.equal(app.location.pathname, base + 'second/'); assert.equal(app.history.length, before);
  press('ArrowLeft'); assert.equal(filePopup.hidden, false); assert.equal(viewPopup.hidden, true);
  press('Escape'); assert.equal(filePopup.hidden, true); assert.equal(app.document.activeElement, file);
  press('ArrowDown'); assert.equal(filePopup.hidden, false);
  press('Tab'); assert.equal(filePopup.hidden, true);
  app.click(view); assert.equal(viewPopup.hidden, false);
  app.click(view); assert.equal(viewPopup.hidden, true);
  app.click(file); app.click(article(app)); assert.equal(filePopup.hidden, true);
  app.click(view); app.click(app.get('start-button')); assert.equal(viewPopup.hidden, true);
  app.click(app.get('start-button'));
  app.click(file); app.click(bar.querySelector('.reader-next')); await settle();
  assert.equal(filePopup.hidden, true); assert.equal(app.location.pathname, base + 'third/');
  const listeners = app.document.events.pointerdown.length;
  app.click(body.querySelector('.control-close'));
  assert.equal(app.document.events.pointerdown.length, listeners - 1);
  press('ArrowLeft'); assert.equal(app.location.pathname, '/');
});

test('late loads never replace a newer chapter or a closed window; failed chapter can be retried', async () => {
  let resolve;
  const pending = new Promise(done => { resolve = done; });
  const app = await mount('https://example.test' + base + 'first/', undefined, { responses: { ...responses, 'releases/story-a/chapters/second.md': () => pending } }); await app.ready();
  const slow = content(app).navigateDocument('second');
  await content(app).navigateDocument('third');
  resolve({ ok: true, text: async () => '迟到的第二章' }); await slow;
  assert.match(article(app).textContent, /第三章正文/);
  assert.equal(app.location.pathname, base + 'third/');
  app.click(app.win('story-a').querySelector('.control-close'));
  assert.equal(app.win('story-a'), null); app.window.fire('keydown', { key: 'ArrowRight' }); assert.equal(app.location.pathname, '/');

  let failed = true;
  const second = await mount('https://example.test' + base + 'second/', undefined, { responses: { ...responses, 'releases/story-a/chapters/second.md': () => ({ ok: !failed, text: async () => '# 恢复后的正文' }) } }); await second.ready();
  assert.ok(article(second).querySelector('.project-error')); failed = false;
  await content(second).navigateDocument('second'); assert.match(article(second).textContent, /恢复后的正文/);
});

test('two novel windows keep independent chapter URLs and keyboard listeners', async () => {
  const other = structuredClone(manifest); other.id = 'story-c';
  const secondResponses = Object.fromEntries(Object.entries(responses).map(([key, value]) => [key.replace('story-a', 'story-c'), value]));
  secondResponses['releases/story-c/release.json'] = JSON.stringify(other);
  const projects = ['story-a','story-c'].map(id => ({ id, title: id + '.txt', category: 'novel', driveId: 'a', slug: id, release: `releases/${id}/` }));
  const app = await mount('https://example.test' + base + 'second/', undefined, { projects, responses: { ...responses, ...secondResponses } }); await app.ready();
  app.manager.openWindow('project-story-c', 'push'); await app.ready();
  app.window.fire('keydown', { key: 'ArrowRight' }); await settle();
  assert.equal(app.location.pathname, '/file-explorer/a-floppy-disk/story-c/first/');
  assert.equal(content(app).getDocumentId(), 'second');
  app.click(app.tab('project-story-a')); assert.equal(app.location.pathname, base + 'second/');
});

test('Markdown profile excludes code-block links and supports documented basic blocks', () => {
  const nodes = parseMarkdown('# 标题\n\n> 引用\n\n- 条目\n- 条目二\n\n3. 第三\n\n---\n\n```\n![不是图片](images/private.png)\n```\n\n**粗体** *斜体* `代码`  \n换行\n\n![图](images/public.png)');
  assert.deepEqual(nodes.map(node => node.type), ['heading', 'quote', 'list', 'list', 'rule', 'pre', 'paragraph', 'paragraph']);
  assert.equal(nodes[3].start, 3);
  assert.equal(nodes[6].children.filter(node => node.type === 'break').length, 1);
  assert.deepEqual(references(nodes).map(ref => ref.value), ['images/public.png']);
});
