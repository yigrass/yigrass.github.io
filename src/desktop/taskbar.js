import { $, create, pixelIcon } from '../shared/dom.js';
export function createWindowTab({ id, element, title, icon, onClick }) {
  const tab = create('button', 'classic-button window-tab');
  tab.type = 'button'; tab.setAttribute('aria-controls', element.id);
  tab.append(pixelIcon(icon, 'title-icon'), create('span', '', title));
  tab.addEventListener('click', onClick);
  return tab;
}
export function startClock() {
  const updateClock = () => {
    const now = new Date();
    $("#clock").textContent = new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now);
    $("#clock").dateTime = now.toISOString();
    $("#clock").title = now.toLocaleDateString("zh-CN");
  };
  updateClock();
  setInterval(updateClock, 15000);
}
