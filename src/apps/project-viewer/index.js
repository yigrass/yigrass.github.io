import { create } from '../../shared/dom.js';
import { renderNovel } from './novel.js';

export function renderProject(body, project, { setStatus, activate, isActive, initialDocumentId = null, address, onNavigate }) {
  body.classList.add('project-body');
  const controller = new AbortController();
  let cleanup = () => {}, notifyVisibility = () => {}, visible = true;
  let reader, selectedDocumentId = initialDocumentId;
  function navigateDocument(id, mode = 'push') {
    selectedDocumentId = id;
    return reader?.navigate(id, mode);
  }
  const root = new URL(project.release, document.baseURI);
  body.append(create('p', '', '正在加载…'));
  const ready = (async () => {
    try {
      const response = await fetch(new URL('release.json', root), { signal: controller.signal, cache: 'no-store' });
      if (!response.ok) throw new Error('作品文件暂时无法读取');
      const release = await response.json();
      if (controller.signal.aborted) return;
      body.replaceChildren();
      if (release.kind === 'novel') {
        reader = renderNovel(body, release, root, setStatus, controller.signal, {
          icon: project.iconPath, initialDocumentId: selectedDocumentId, isActive, address,
          onNavigate: (id, mode) => { selectedDocumentId = id; if (mode !== 'restore') onNavigate(mode); }
        });
        cleanup = reader.dispose;
        await reader.ready;
      } else if (release.kind === 'web') {
        body.classList.add('web-project-body');
        const frame = create('iframe', 'project-frame');
        frame.title = release.title;
        frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-pointer-lock');
        frame.setAttribute('allow', 'fullscreen');
        frame.src = new URL(release.entry, root).href;
        // Focusing an iframe does not bubble pointer events to the desktop window.
        const focusFrame = () => setTimeout(() => {
          if (!controller.signal.aborted && document.activeElement === frame) activate();
        }, 0);
        window.addEventListener('blur', focusFrame);
        frame.addEventListener('load', () => {
          if (!controller.signal.aborted) { setStatus('就绪'); notifyVisibility(visible); }
        });
        notifyVisibility = visible => frame.contentWindow?.postMessage({ type: 'desktop-visibility', visible }, root.origin);
        cleanup = () => { window.removeEventListener('blur', focusFrame); frame.remove(); };
        body.append(frame);
      } else throw new Error('不支持的作品格式');
    } catch (error) {
      if (controller.signal.aborted) return;
      body.replaceChildren(create('p', 'project-error', `${error.message}。请关闭后重新打开。`));
      setStatus('加载失败');
    }
  })();
  return { ready, navigateDocument, getDocumentId: () => selectedDocumentId, setVisible: value => { visible = value; notifyVisibility(value); }, dispose: () => { controller.abort(); cleanup(); } };
}
