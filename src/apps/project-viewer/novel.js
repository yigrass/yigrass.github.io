import { create, pixelIcon } from '../../shared/dom.js';
import { novelDocuments } from '../../shared/novel/model.js';
import { renderMarkdown } from '../../shared/novel/markdown.js';
import { createReaderMenu } from './reader-menu.js';

export function renderNovel(body, release, root, setStatus, signal, options) {
  body.classList.add('novel-body');
  const menu = createReaderMenu(release.id);
  const documents = novelDocuments(release), chapters = documents.filter(item => item.kind === 'chapter');
  const layout = create('div', 'reader-layout');
  const sidebar = create('nav', 'reader-sidebar');
  sidebar.id = `reader-directory-${release.id}`;
  sidebar.setAttribute('aria-label', `${release.title}目录`);
  const pane = create('div', 'reader-pane');
  const article = create('article', 'novel-chapter');
  article.tabIndex = 0;
  const toggle = create('button', 'reader-directory-toggle');
  toggle.type = 'button'; toggle.setAttribute('aria-controls', sidebar.id);
  const toggleMark = create('span'); toggleMark.setAttribute('aria-hidden', 'true');
  toggle.append(toggleMark);
  function toggleDirectory() {
    sidebar.hidden = !sidebar.hidden;
    layout.classList.toggle('is-directory-hidden', sidebar.hidden);
    toggle.setAttribute('aria-expanded', String(!sidebar.hidden));
    toggle.setAttribute('aria-label', sidebar.hidden ? '显示目录' : '收起目录');
    toggle.title = sidebar.hidden ? '显示目录' : '收起目录';
    toggleMark.textContent = sidebar.hidden ? '>>' : '<<';
  }
  sidebar.hidden = !matchMedia('(max-width:640px)').matches;
  toggleDirectory(); toggle.addEventListener('click', toggleDirectory);
  pane.append(toggle, article); layout.append(sidebar, pane); body.append(menu.element, layout);

  let selected, requestId = 0, disposed = false;
  const buttons = new Map(), branches = new Map();
  function selectedButton(id, button) { if (!buttons.has(id)) buttons.set(id, []); buttons.get(id).push(button); }
  function documentButton(id, title, icon, action) {
    const button = create('button', 'tree-location reader-document');
    button.type = 'button'; button.dataset.documentId = id || ''; button.title = title;
    button.append(pixelIcon(icon), create('span', '', title));
    button.addEventListener('click', action || (() => show(id)));
    selectedButton(id, button); return button;
  }
  function branch(parent, id, title, icon) {
    const li = create('li'), row = create('div', 'reader-tree-row'), children = create('ul', 'reader-tree-group');
    children.id = `reader-group-${release.id}-${id || 'book'}`;
    const expand = create('button', 'tree-expand'); expand.type = 'button'; expand.setAttribute('aria-controls', children.id);
    const label = documentButton(id, title, icon, () => { setExpanded(children.hidden); show(id, 'push', true); });
    function setExpanded(expanded) {
      children.hidden = !expanded; expand.textContent = expanded ? '−' : '+';
      expand.setAttribute('aria-expanded', String(expanded));
      expand.setAttribute('aria-label', `${expanded ? '收起' : '展开'}${title}`);
      if (id) label.querySelector('img').src = `assets/pixel-ui/v1.4.0/book-${expanded ? 'open' : 'closed'}.png`;
    }
    setExpanded(true); expand.addEventListener('click', () => setExpanded(children.hidden));
    row.append(expand, label); li.append(row, children); parent.append(li); branches.set(id, setExpanded);
    const readme = create('li', 'reader-tree-leaf');
    readme.append(documentButton(id, 'README.md', 'v1.4.0/information')); children.append(readme);
    return children;
  }
  const tree = create('ul', 'reader-tree');
  const book = branch(tree, null, release.title, options.icon);
  for (const volume of release.volumes) {
    const group = branch(book, volume.id, volume.title, 'v1.4.0/book-open');
    for (const chapter of volume.chapters) {
      const item = create('li', 'reader-tree-leaf');
      item.append(documentButton(chapter.id, chapter.title, 'v1.2.0/text-file')); group.append(item);
    }
  }
  sidebar.append(tree);

  function neighbor(direction) {
    const position = documents.findIndex(item => item.id === selected);
    for (let index = position + direction; index >= 0 && index < documents.length; index += direction) if (documents[index].kind === 'chapter') return documents[index];
    return null;
  }
  function flip(direction) { const next = neighbor(direction); if (next) show(next.id); }
  const separator = create('span', 'reader-menu-separator'); separator.setAttribute('aria-hidden', 'true');
  menu.element.append(separator);
  const pageButtons = [-1, 1].map(direction => {
    const button = create('button', `classic-button reader-page-arrow reader-${direction < 0 ? 'previous' : 'next'}`); button.type = 'button';
    button.setAttribute('aria-label', direction < 0 ? '上一章' : '下一章');
    button.title = direction < 0 ? '上一章' : '下一章';
    button.append(pixelIcon(`v1.1.0/${direction < 0 ? 'back' : 'forward'}`));
    button.addEventListener('click', () => { menu.close(); flip(direction); }); menu.element.append(button);
    return { button, direction };
  });
  function updateScrollSpace() {
    if (disposed) return;
    const prose = article.querySelector('.novel-prose');
    if (!prose) return;
    const style = getComputedStyle(prose);
    const lineHeight = Number.parseFloat(style.lineHeight) || 30;
    const bottom = Number.parseFloat(style.paddingBottom) || 0;
    article.style.setProperty('--reader-scroll-space', `${Math.max(0, article.clientHeight - lineHeight - bottom)}px`);
  }
  const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(updateScrollSpace) : null;
  resize?.observe(article);
  window.addEventListener('resize', updateScrollSpace);

  async function show(id, mode = 'push', preserveBranches = false) {
    const item = documents.find(document => document.id === id);
    if (!item || disposed || (id === selected && article.getAttribute('aria-busy') !== 'true' && !article.querySelector('.project-error'))) return;
    const request = ++requestId; selected = id;
    if (!preserveBranches) { branches.get(null)(true); if (item.volumeId) branches.get(item.volumeId)(true); }
    for (const [key, entries] of buttons) for (const button of entries) {
      if (key === id) button.setAttribute('aria-current', 'location'); else button.removeAttribute('aria-current');
    }
    menu.close();
    for (const { button, direction } of pageButtons) button.disabled = !neighbor(direction);
    options.onNavigate(id, mode);
    article.setAttribute('aria-label', item.title);
    article.setAttribute('aria-busy', 'true'); article.scrollTop = 0;
    article.replaceChildren(create('p', 'reader-loading', '正在加载…'));
    setStatus(`${release.title} · ${item.title}`);
    try {
      const response = await fetch(new URL(item.file, root), { signal, cache: 'no-store' });
      if (!response.ok) throw new Error('正文暂时无法读取');
      const text = await response.text();
      if (signal.aborted || disposed || request !== requestId) return;
      const prose = renderMarkdown(text, { root, documents, navigate: (target, intent) => intent === 'address' ? options.address(target) : show(target) });
      const space = create('div', 'reader-scroll-space'); space.setAttribute('aria-hidden', 'true');
      article.replaceChildren(prose, space); article.scrollTop = 0;
      updateScrollSpace();
      const number = chapters.findIndex(chapter => chapter.id === id);
      setStatus(`${release.title} · ${number < 0 ? item.volumeId ? `${item.title} · README` : 'README' : `${number + 1} / ${chapters.length} 章 · ${item.title}`}`);
    } catch (error) {
      if (!signal.aborted && !disposed && request === requestId) { article.replaceChildren(create('p', 'project-error reader-loading', `${error.message}。请重新选择此条目。`)); setStatus('正文加载失败'); }
    } finally { if (request === requestId) article.removeAttribute('aria-busy'); }
  }
  function keyboard(event) {
    if (!options.isActive() || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.isComposing || !document.querySelector('#start-menu').hidden) return;
    if (menu.handleKey(event) || menu.isOpen()) return;
    if (event.target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName)) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const direction = event.key === 'ArrowLeft' ? -1 : 1;
    if (neighbor(direction)) { event.preventDefault(); flip(direction); }
  }
  window.addEventListener('keydown', keyboard);
  return {
    ready: show(options.initialDocumentId, 'restore'), navigate: show,
    dispose: () => { disposed = true; requestId++; menu.dispose(); resize?.disconnect(); window.removeEventListener('resize', updateScrollSpace); window.removeEventListener('keydown', keyboard); }
  };
}
