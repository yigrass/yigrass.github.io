import { create } from '../../shared/dom.js';
export const readerSizes = { directory: 220, directoryMin: 160, readingMin: 240, divider: 2, frame: 14 };
export function createReaderLayout(layout, sidebar, pane, onMinimumWidth) {
  const { directory, directoryMin, readingMin, divider, frame } = readerSizes;
  let preferredWidth = directory, dragging = null;
  const splitter = create('div', 'reader-splitter'); splitter.tabIndex = 0;
  splitter.setAttribute('role', 'separator'); splitter.setAttribute('aria-orientation', 'vertical'); splitter.setAttribute('aria-label', '调整目录宽度');
  layout.style.setProperty('--reader-directory-min', `${directoryMin}px`);
  layout.style.setProperty('--reader-reading-min', `${readingMin}px`);
  layout.style.setProperty('--reader-divider-width', `${divider}px`);
  const maximum = () => Math.max(directoryMin, layout.clientWidth - readingMin - divider);
  function fit() {
    const width = Math.max(directoryMin, Math.min(preferredWidth, maximum()));
    layout.style.setProperty('--reader-directory-width', `${width}px`);
    splitter.setAttribute('aria-valuemin', String(directoryMin)); splitter.setAttribute('aria-valuemax', String(maximum())); splitter.setAttribute('aria-valuenow', String(width));
  }
  function cancel() {
    if (!dragging) return;
    const pointerId = dragging.pointerId; dragging = null;
    layout.classList.remove('is-splitting');
    if (splitter.hasPointerCapture(pointerId)) splitter.releasePointerCapture(pointerId);
  }
  splitter.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    splitter.focus(); event.preventDefault(); event.stopPropagation();
    dragging = { pointerId: event.pointerId, x: event.clientX, width: Number(splitter.getAttribute('aria-valuenow')) };
    splitter.setPointerCapture(event.pointerId); layout.classList.add('is-splitting');
  });
  splitter.addEventListener('pointermove', event => {
    if (!dragging || event.pointerId !== dragging.pointerId) return;
    preferredWidth = Math.max(directoryMin, Math.min(maximum(), dragging.width + event.clientX - dragging.x)); fit();
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) splitter.addEventListener(type, cancel);
  splitter.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation();
    preferredWidth = event.key === 'Home' ? directoryMin : event.key === 'End' ? maximum() : Math.max(directoryMin, Math.min(maximum(), Number(splitter.getAttribute('aria-valuenow')) + (event.key === 'ArrowLeft' ? -10 : 10)));
    fit();
  });
  layout.append(sidebar, splitter, pane);
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null; observer?.observe(layout);
  window.addEventListener('resize', fit);
  return {
    update() {
      cancel(); splitter.hidden = sidebar.hidden; layout.classList.toggle('is-directory-hidden', sidebar.hidden);
      onMinimumWidth?.((sidebar.hidden ? readingMin : directoryMin + divider + readingMin) + frame); fit();
    },
    dispose() { cancel(); observer?.disconnect(); window.removeEventListener('resize', fit); }
  };
}
export const readingProgress = (visibleBottom, contentHeight) => contentHeight > 0 ? Math.max(0, Math.min(100, Math.round(visibleBottom / contentHeight * 100))) : 0;
