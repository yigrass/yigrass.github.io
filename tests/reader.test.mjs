import test from 'node:test';
import assert from 'node:assert/strict';
import { mount as mountDesktop } from './dom-harness.mjs';
const mount = (href, baseURI, options = {}) => mountDesktop(href, baseURI, { projects: [{ category: 'novel', driveId: 'a', release: 'releases/story-a/' }], ...options });
import { parseMarkdown, headingTitle } from '../src/shared/novel/parser.js';
import { readingProgress } from '../src/apps/project-viewer/reader-layout.js';
const settle = () => new Promise(resolve => setImmediate(resolve));
const base = '/file-explorer/a-floppy-disk/story-a/';
const manifest = { schemaVersion: 4, kind: 'novel', id: 'story-a', title: '阅读测试', icon: 'images/book/icon.png', volumes: [
  { id: 'volume-a', title: '第一卷', chapters: [
    { id: 'first', title: '第一章' },
    { id: 'second', title: '第二章' }
  ] },
  { id: 'volume-b', title: '第二卷', chapters: [
    { id: 'third', title: '第三章' }
  ] }
] };
const responses = {
  'releases/story-a/release.json': JSON.stringify(manifest),
  'releases/story-a/README.md': '# 书的介绍\n\n从 [第一章](text/volume-a/first.md) 开始。',
  'releases/story-a/text/volume-a/README.md': '# 第一卷序\n\n卷一的介绍。',
  'releases/story-a/text/volume-b/README.md': '# 第二卷序\n\n卷二的介绍。',
  'releases/story-a/text/volume-a/first.md': '# 第一章\n\n第一段**强调**。\n\n![海边](images/volume-a/first/scene.png)\n\n<script>只是文字</script>\n\n[危险](javascript:alert)\n\n[继续](text/volume-a/second.md)',
  'releases/story-a/text/volume-a/second.md': '# 第二章\n\n第二章正文。',
  'releases/story-a/text/volume-b/third.md': '# 第三章\n\n第三章正文。'
};
const doc = (app, id, index = 0) => app.win('story-a').querySelectorAll('.reader-document').filter(item => item.dataset.documentId === (id || ''))[index];
const article = app => app.win('story-a').querySelector('.novel-chapter');
const content = app => app.manager.getWindow('project-story-a').content;

test('book and volume titles open their README while only plus/minus controls fold the tree', async () => {
  const app = await mount('https://example.test' + base, undefined, { responses }); await app.ready();
  const body = app.win('story-a');
  assert.match(article(app).textContent, /书的介绍/);
  assert.deepEqual(body.querySelectorAll('.reader-document').map(node => node.dataset.documentId), ['', 'volume-a', 'volume-a/first', 'volume-a/second', 'volume-b', 'volume-b/third']);
  assert.deepEqual(body.querySelectorAll('.reader-document').map(node => node.title), ['书的介绍', '第一卷序', '第一章', '第二章', '第二卷序', '第三章']);
  app.click(doc(app, 'volume-a')); await settle();
  assert.equal(app.location.pathname, base + 'volume-a/');
  assert.match(article(app).textContent, /第一卷序/);
  assert.equal(app.get('reader-group-story-a-volume-a').hidden, false);
  const volumeToggle = body.querySelectorAll('.tree-expand')[1];
  app.click(volumeToggle);
  assert.equal(app.get('reader-group-story-a-volume-a').hidden, true);
  assert.match(doc(app, 'volume-a').querySelector('img').src, /book-closed/);
  app.click(doc(app, 'volume-a')); await settle();
  assert.equal(app.get('reader-group-story-a-volume-a').hidden, true);
  app.click(volumeToggle);
  assert.equal(app.get('reader-group-story-a-volume-a').hidden, false);
  assert.match(doc(app, 'volume-a').querySelector('img').src, /book-open/);
  const before = app.history.length;
  app.click(doc(app, 'volume-a')); await settle();
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
  assert.equal(app.get('reader-group-story-a-book').hidden, false);
  app.click(body.querySelector('.tree-expand')); assert.equal(app.get('reader-group-story-a-book').hidden, true);
  assert.match(article(app).textContent, /书的介绍/);
});

test('direct chapter entry, safe Markdown rendering, shared icon, chapter links and desktop history retain reader state', async () => {
  const app = await mount('https://example.test' + base + 'volume-a/first/', undefined, { responses }); await app.ready();
  const body = app.win('story-a'), text = article(app);
  assert.equal(app.location.pathname, base + 'volume-a/first/');
  assert.equal(text.querySelector('strong').textContent, '强调');
  assert.equal(text.querySelector('img').alt, '海边');
  assert.equal(text.querySelector('img').src, 'https://example.test/releases/story-a/images/volume-a/first/scene.png');
  assert.equal(text.querySelector('script'), null);
  assert.match(text.textContent, /<script>只是文字<\/script>/);
  assert.equal(text.querySelectorAll('a').length, 1);
  assert.equal(body.querySelector('.title-icon').src, doc(app, null).querySelector('img').src);
  assert.equal(body.querySelector('.title-icon').src, 'releases/story-a/images/book/icon.png');
  app.click(text.querySelector('a')); await settle();
  assert.equal(app.location.pathname, base + 'volume-a/second/');
  text.scrollTop = 123;
  app.click(body.querySelector('.control-min')); assert.equal(app.location.pathname, '/');
  app.click(app.tab('project-story-a'));
  assert.equal(app.location.pathname, base + 'volume-a/second/'); assert.equal(article(app), text); assert.equal(text.scrollTop, 123);
  app.history.go(-1); await settle(); assert.equal(app.location.pathname, base + 'volume-a/first/'); assert.match(text.textContent, /第一段/);
  app.history.go(1); await settle(); assert.equal(app.location.pathname, base + 'volume-a/second/'); assert.match(text.textContent, /第二章正文/);
});

test('keyboard and menu-bar buttons skip README across volumes and respect active window, menus and boundaries', async () => {
  const app = await mount('https://example.test' + base + 'volume-a/second/', undefined, { responses }); await app.ready();
  const press = key => app.window.fire('keydown', { key });
  assert.equal(press('ArrowRight').defaultPrevented, true); await settle();
  assert.equal(app.location.pathname, base + 'volume-b/third/');
  assert.equal(app.win('story-a').querySelector('.reader-next').disabled, true);
  assert.equal(press('ArrowRight').defaultPrevented, undefined);
  app.click(app.win('story-a').querySelector('.reader-previous')); await settle();
  assert.equal(app.location.pathname, base + 'volume-a/second/');
  app.click(app.get('start-button')); press('ArrowRight'); assert.equal(app.location.pathname, base + 'volume-a/second/');
  app.click(app.get('start-button')); app.menu('settings'); press('ArrowRight');
  assert.equal(app.location.pathname, '/system-settings/'); assert.equal(content(app).getDocumentId(), 'volume-a/second');
  app.click(app.tab('project-story-a'));
  app.window.fire('keydown', { key: 'ArrowRight', ctrlKey: true }); assert.equal(app.location.pathname, base + 'volume-a/second/');
  await content(app).navigateDocument('volume-a/first'); assert.equal(app.win('story-a').querySelector('.reader-previous').disabled, true);
  assert.ok(Number.parseFloat(article(app).style['--reader-scroll-space']) > 800);
});

test('reader placeholder menus switch without flipping chapters, dismiss predictably and release their listeners', async () => {
  const app = await mount('https://example.test' + base + 'volume-a/second/', undefined, { responses }); await app.ready();
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
  assert.equal(app.location.pathname, base + 'volume-a/second/'); assert.equal(app.history.length, before);
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
  assert.equal(filePopup.hidden, true); assert.equal(app.location.pathname, base + 'volume-b/third/');
  const listeners = app.document.events.pointerdown.length;
  app.click(body.querySelector('.control-close'));
  assert.equal(app.document.events.pointerdown.length, listeners - 1);
  press('ArrowLeft'); assert.equal(app.location.pathname, '/');
});

test('late loads never replace a newer chapter or a closed window; failed chapter can be retried', async () => {
  let resolve;
  const pending = new Promise(done => { resolve = done; });
  const app = await mount('https://example.test' + base + 'volume-a/first/', undefined, { responses: { ...responses, 'releases/story-a/text/volume-a/second.md': () => pending } }); await app.ready();
  const slow = content(app).navigateDocument('volume-a/second');
  await content(app).navigateDocument('volume-b/third');
  resolve({ ok: true, text: async () => '迟到的第二章' }); await slow;
  assert.match(article(app).textContent, /第三章正文/);
  assert.equal(app.location.pathname, base + 'volume-b/third/');
  app.click(app.win('story-a').querySelector('.control-close'));
  assert.equal(app.win('story-a'), null); app.window.fire('keydown', { key: 'ArrowRight' }); assert.equal(app.location.pathname, '/');

  let failed = true;
  const second = await mount('https://example.test' + base + 'volume-a/second/', undefined, { responses: { ...responses, 'releases/story-a/text/volume-a/second.md': () => ({ ok: !failed, text: async () => '# 恢复后的正文' }) } }); await second.ready();
  assert.ok(article(second).querySelector('.project-error')); failed = false;
  await content(second).navigateDocument('volume-a/second'); assert.match(article(second).textContent, /恢复后的正文/);
});

test('two novel windows keep independent chapter URLs and keyboard listeners', async () => {
  const other = structuredClone(manifest); other.id = 'story-c';
  const secondResponses = Object.fromEntries(Object.entries(responses).map(([key, value]) => [key.replace('story-a', 'story-c'), value]));
  secondResponses['releases/story-c/release.json'] = JSON.stringify(other);
  const projects = ['story-a','story-c'].map(id => ({ id, title: id + '.txt', category: 'novel', driveId: 'a', slug: id, release: `releases/${id}/` }));
  const app = await mount('https://example.test' + base + 'volume-a/second/', undefined, { projects, responses: { ...responses, ...secondResponses } }); await app.ready();
  app.manager.openWindow('project-story-c', 'push'); await app.ready();
  app.window.fire('keydown', { key: 'ArrowRight' }); await settle();
  assert.equal(app.location.pathname, '/file-explorer/a-floppy-disk/story-c/volume-a/first/');
  assert.equal(content(app).getDocumentId(), 'volume-a/second');
  app.click(app.tab('project-story-a')); assert.equal(app.location.pathname, base + 'volume-a/second/');
});

test('markdown-it supports nested blocks, tables, strikeout and real H1 parsing', async () => {
  const markdown = '```md\n# 代码不是标题\n```\n\n真正的 **标题**\n===========\n\n> - 嵌套列表\n>   - 子条目\n\n| 名称 | 值 |\n| --- | ---: |\n| ~~旧~~ | 新 |';
  assert.equal(headingTitle(markdown), '真正的 标题');
  assert.equal(parseMarkdown(markdown).filter(token => token.type === 'bullet_list_open').length, 2);
  const app = await mount('https://example.test' + base, undefined, { responses: { ...responses, 'releases/story-a/README.md': markdown } }); await app.ready();
  assert.equal(article(app).querySelector('h1').textContent, '真正的 标题');
  assert.equal(article(app).querySelector('table').querySelectorAll('td').length, 2);
  assert.equal(article(app).querySelector('s').textContent, '旧');
  assert.equal(article(app).querySelector('blockquote').querySelectorAll('ul').length, 2);
});

test('directory resizing respects pane minima, consumes arrow keys and resets after reopening', async () => {
  const app = await mount('https://example.test' + base, undefined, { responses }); await app.ready();
  const body = app.win('story-a'), layout = body.querySelector('.reader-layout'), splitter = body.querySelector('.reader-splitter');
  assert.equal(splitter.getAttribute('aria-valuenow'), '220');
  assert.equal(body.style.minWidth, '416px');
  splitter.fire('pointerdown', { pointerId: 1, clientX: 220 });
  splitter.fire('pointermove', { pointerId: 1, clientX: -500 });
  assert.equal(splitter.getAttribute('aria-valuenow'), '160');
  splitter.fire('pointermove', { pointerId: 1, clientX: 5000 });
  assert.equal(splitter.getAttribute('aria-valuenow'), String(layout.clientWidth - 240 - 2));
  splitter.fire('pointerup', { pointerId: 1 });
  const key = splitter.fire('keydown', { key: 'ArrowLeft' });
  assert.equal(key.defaultPrevented, true); assert.equal(key.stopped, true);
  Object.defineProperty(layout, 'clientWidth', { value: 402 }); app.window.fire('resize');
  assert.equal(splitter.getAttribute('aria-valuenow'), '160');
  app.click(body.querySelector('.reader-directory-toggle')); assert.equal(body.style.minWidth, '254px');
  app.click(body.querySelector('.control-close'));
  app.manager.openWindow('project-story-a', 'push'); await app.ready();
  assert.equal(app.win('story-a').querySelector('.reader-splitter').getAttribute('aria-valuenow'), '220');
});

test('progress counts the viewport bottom, ignores overscroll space and only blocks copying in the reader', async () => {
  assert.equal(readingProgress(300, 1000), 30); assert.equal(readingProgress(1800, 1000), 100);
  const app = await mount('https://example.test' + base + 'volume-a/first/', undefined, { responses }); await app.ready();
  const text = article(app), status = app.win('story-a').querySelector('.statusbar');
  assert.match(status.textContent, /书的介绍 \| 第一卷序 \| 第一章 \| 50%/);
  text.scrollTop = 900; text.fire('scroll'); assert.match(status.textContent, /100%/);
  for (const type of ['copy', 'cut', 'selectstart', 'dragstart']) assert.equal(text.fire(type).defaultPrevented, true);
  text.focus(); assert.equal(app.window.fire('keydown', { key: 'c', ctrlKey: true }).defaultPrevented, true);
  app.get('start-button').focus(); assert.equal(app.window.fire('keydown', { key: 'c', ctrlKey: true }).defaultPrevented, undefined);
});

test('identical chapter IDs in separate volumes have distinct content, links and history', async () => {
  const data = structuredClone(manifest); data.volumes[1].chapters[0].id = 'first';
  const app = await mount('https://example.test' + base + 'volume-a/first/', undefined, { responses: { ...responses, 'releases/story-a/release.json': JSON.stringify(data), 'releases/story-a/text/volume-b/first.md': responses['releases/story-a/text/volume-b/third.md'] } }); await app.ready();
  app.click(doc(app, 'volume-b/first')); await settle();
  assert.equal(app.location.pathname, base + 'volume-b/first/'); assert.match(article(app).textContent, /第三章正文/);
  app.history.go(-1); await settle(); assert.equal(app.location.pathname, base + 'volume-a/first/'); assert.match(article(app).textContent, /第一段/);
});
