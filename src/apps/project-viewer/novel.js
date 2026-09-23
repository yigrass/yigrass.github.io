import { create } from '../../shared/dom.js';

export function renderNovel(body, release, root, setStatus, signal) {
  const controls = create('nav', 'reader-controls');
  controls.setAttribute('aria-label', '章节导航');
  const previous = create('button', 'classic-button', '上一章');
  const select = create('select', 'chapter-select');
  select.setAttribute('aria-label', '章节目录');
  const next = create('button', 'classic-button', '下一章');
  previous.type = next.type = 'button';
  for (const [index, chapter] of release.chapters.entries()) {
    const option = create('option', '', chapter.title); option.value = String(index); select.append(option);
  }
  const article = create('article', 'novel-chapter');
  article.tabIndex = 0;
  controls.append(previous, select, next);
  body.append(controls, article);
  let selected = 0, requestId = 0;
  async function show(index) {
    const request = ++requestId;
    selected = index;
    const chapter = release.chapters[index];
    select.value = String(index);
    previous.disabled = index === 0; next.disabled = index === release.chapters.length - 1;
    article.setAttribute('aria-busy', 'true');
    article.replaceChildren(create('p', '', '正在加载…'));
    try {
      const response = await fetch(new URL(chapter.file, root), { signal, cache: 'no-store' });
      if (!response.ok) throw new Error('章节暂时无法读取');
      const text = await response.text();
      if (signal.aborted || request !== requestId) return;
      const paragraphs = text.replace(/\r\n?/g, '\n').trim().split(/\n[\t ]*\n+/);
      article.replaceChildren();
      function illustrations(position) {
        for (const illustration of chapter.illustrations || []) {
          if (illustration.afterParagraph !== position) continue;
          const figure = create('figure');
          const image = create('img', 'chapter-illustration');
          image.src = new URL(illustration.file, root).href;
          image.alt = illustration.alt;
          figure.append(image); article.append(figure);
        }
      }
      illustrations(0);
      paragraphs.forEach((paragraph, index) => { article.append(create('p', '', paragraph)); illustrations(index + 1); });
      article.scrollTop = 0;
      setStatus(`${release.title} · ${selected + 1} / ${release.chapters.length} 章`);
    } catch (error) {
      if (!signal.aborted && request === requestId) { article.replaceChildren(create('p', 'project-error', `${error.message}。请重新选择章节。`)); setStatus('章节加载失败'); }
    } finally {
      if (request === requestId) article.removeAttribute('aria-busy');
    }
  }
  select.addEventListener('change', () => show(Number(select.value)));
  previous.addEventListener('click', () => { if (selected > 0) show(selected - 1); });
  next.addEventListener('click', () => { if (selected < release.chapters.length - 1) show(selected + 1); });
  return { ready: show(0), dispose: () => { requestId++; } };
}
