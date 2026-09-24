import { create } from '../../shared/dom.js';

// Keep menu definitions separate from their interaction so future commands can be added here.
export function createReaderMenu(id) {
  const element = create('nav', 'reader-menubar');
  element.setAttribute('aria-label', '阅读器菜单');
  let opened = null;
  const menus = ['文件', '查看'].map((label, index) => {
    const group = create('div', 'reader-menu-group');
    const button = create('button', 'reader-menu-trigger', label); button.type = 'button';
    const popup = create('div', 'reader-menu-popup'); popup.id = `reader-menu-${id}-${index}`;
    popup.hidden = true; popup.tabIndex = -1;
    popup.setAttribute('role', 'menu'); popup.setAttribute('aria-label', label);
    button.setAttribute('aria-haspopup', 'menu'); button.setAttribute('aria-controls', popup.id);
    button.setAttribute('aria-expanded', 'false');
    const placeholder = create('button', 'reader-menu-item', '功能开发中');
    placeholder.type = 'button'; placeholder.disabled = true;
    placeholder.setAttribute('role', 'menuitem'); placeholder.setAttribute('aria-disabled', 'true');
    popup.append(placeholder); group.append(button, popup); element.append(group);
    const menu = { button, popup };
    button.addEventListener('click', () => opened === menu ? close() : open(menu));
    button.addEventListener('mouseenter', () => { if (opened && opened !== menu) open(menu); });
    return menu;
  });
  function close(restoreFocus = false) {
    const previous = opened; opened = null;
    if (!previous) return;
    previous.popup.hidden = true; previous.button.setAttribute('aria-expanded', 'false');
    if (restoreFocus) previous.button.focus();
  }
  function open(menu) {
    close(); opened = menu;
    menu.popup.hidden = false; menu.button.setAttribute('aria-expanded', 'true'); menu.popup.focus();
  }
  function dismissOutside(event) { if (!element.contains(event.target)) close(); }
  document.addEventListener('pointerdown', dismissOutside);
  document.addEventListener('focusin', dismissOutside);
  return {
    element, close,
    isOpen: () => opened !== null,
    handleKey(event) {
      if (!opened) {
        const menu = menus.find(item => item.button === event.target);
        if (!menu || event.key !== 'ArrowDown') return false;
        event.preventDefault(); open(menu); return true;
      }
      if (event.key === 'Tab') { close(); return true; }
      if (event.key === 'Escape') { event.preventDefault(); close(true); return true; }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        const direction = event.key === 'ArrowLeft' ? -1 : 1;
        open(menus[(menus.indexOf(opened) + direction + menus.length) % menus.length]);
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') event.preventDefault();
      return true;
    },
    dispose() {
      close();
      document.removeEventListener('pointerdown', dismissOutside);
      document.removeEventListener('focusin', dismissOutside);
    }
  };
}
