import { $, create, pixelIcon } from '../shared/dom.js';
export function createStartMenu({ windowTypes, titleOf, openWindow, hasWindow }) {
  const menu = $('#start-menu'), start = $('#start-button');
  function closeMenu(returnFocus = false) {
    menu.hidden = true;
    start.setAttribute("aria-expanded", "false");
    if (returnFocus) start.focus();
  }
  function openMenu(keyboard = false) {
    menu.hidden = false;
    start.setAttribute("aria-expanded", "true");
    if (keyboard) $("#menu-items button").focus();
  }
  start.addEventListener("click", (event) => menu.hidden ? openMenu(event.detail === 0) : closeMenu());
  document.addEventListener("pointerdown", (event) => {
    if (!menu.hidden && !menu.contains(event.target) && !start.contains(event.target)) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !menu.hidden) { closeMenu(true); event.preventDefault(); }
  });
  menu.addEventListener("keydown", (event) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) || event.target.matches("input")) return;
    const items = [...menu.querySelectorAll("button")].filter((item) => item.getClientRects().length);
    const current = items.indexOf(document.activeElement);
    let next = current;
    if (event.key === "ArrowDown") next = (current + 1) % items.length;
    if (event.key === "ArrowUp") next = (current - 1 + items.length) % items.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = items.length - 1;
    items[next]?.focus();
    event.preventDefault();
  });

  for (const id of ["profile", "works", "settings"]) {
    const button = create("button", "menu-item");
    button.type = "button";
    button.dataset.window = id;
    const icon = pixelIcon(windowTypes[id].icon, "menu-icon");
    if (id === "settings") {
      const divider = create("div", "menu-divider");
      divider.setAttribute("role", "separator");
      $("#menu-items").append(divider);
    }
    button.append(icon, create("span", "", titleOf(id)));
    button.addEventListener("click", () => { closeMenu(); openWindow(id, hasWindow(id) ? "replace" : "push"); });
    $("#menu-items").append(button);
  }

  return { closeMenu };
}
