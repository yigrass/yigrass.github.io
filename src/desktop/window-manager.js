import { $, create, pixelIcon, announce } from '../shared/dom.js';
import { createWindowTab } from './taskbar.js';
export function createWindowManager({ windowTypes, titleOf, menuBrand, onAddressChange }) {
  const desktop = $('#desktop'), windowsHost = $('#windows'), tabsHost = $('#window-tabs'), start = $('#start-button');
  const openWindows = new Map();
  let activeId = null, zIndex = 10;
  function updateActive() {
    for (const [id, entry] of openWindows) {
      const active = id === activeId && !entry.minimized;
      entry.element.classList.toggle("is-active", active);
      entry.tab.setAttribute("aria-pressed", String(active));
      entry.tab.setAttribute("aria-label", `${titleOf(id)}${entry.minimized ? "，已最小化，点击还原" : active ? "，当前窗口，点击最小化" : "，点击切换"}`);
    }
  }
  function activate(id, focus = false, routeMode = "replace") {
    const entry = openWindows.get(id);
    if (!entry) return;
    if (entry.minimized) entry.content?.setVisible?.(true);
    entry.minimized = false;
    entry.element.hidden = false;
    fitWindow(entry.element);
    if (zIndex > 900) {
      [...openWindows.values()].sort((a, b) => Number(a.element.style.zIndex) - Number(b.element.style.zIndex)).forEach((item, index) => { item.element.style.zIndex = 10 + index; });
      zIndex = 10 + openWindows.size;
    }
    entry.element.style.zIndex = ++zIndex;
    activeId = id;
    updateActive();
    onAddressChange(routeMode);
    if (focus) $(".window-body", entry.element).focus({ preventScroll: true });
  }
  function activateRemaining() {
    const remaining = [...openWindows.entries()].filter(([, item]) => !item.minimized).sort((a, b) => Number(b[1].element.style.zIndex) - Number(a[1].element.style.zIndex));
    activeId = remaining[0]?.[0] || null;
    updateActive();
    onAddressChange();
  }
  function minimize(id) {
    const entry = openWindows.get(id);
    entry.cancelResize();
    entry.content?.setVisible?.(false);
    entry.minimized = true;
    entry.element.hidden = true;
    if (activeId === id) activateRemaining();
    updateActive();
    entry.tab.focus();
    announce(`${titleOf(id)}已最小化`);
  }
  function closeWindow(id) {
    const entry = openWindows.get(id);
    entry.cancelResize();
    entry.content?.dispose?.();
    entry.element.remove();
    entry.tab.remove();
    openWindows.delete(id);
    if (activeId === id) activateRemaining();
    if (activeId) activate(activeId, true); else start.focus();
    announce(`${titleOf(id)}已关闭`);
  }
  function toggleMaximize(id) {
    const entry = openWindows.get(id);
    entry.cancelResize();
    const maximized = entry.element.classList.toggle("is-maximized");
    $(".control-max", entry.element).setAttribute("aria-label", `${maximized ? "还原" : "最大化"}${titleOf(id)}`);
    $(".control-max img", entry.element).src = `assets/pixel-ui/${maximized ? "restore" : "maximize"}.png`;
    $(".control-max", entry.element).title = maximized ? "还原" : "最大化";
    activate(id);
  }

  function fitWindow(element) {
    if (element.classList.contains("is-maximized") || matchMedia("(max-width:640px)").matches) return;
    const width = Math.min(element.offsetWidth, desktop.clientWidth);
    const height = Math.min(element.offsetHeight, desktop.clientHeight);
    if (element.offsetWidth > width) element.style.width = `${width}px`;
    if (element.offsetHeight > height) element.style.height = `${height}px`;
    element.style.left = `${Math.max(0, Math.min(element.offsetLeft, desktop.clientWidth - width))}px`;
    element.style.top = `${Math.max(0, Math.min(element.offsetTop, desktop.clientHeight - height))}px`;
  }
  function resizedBounds(origin, direction, dx, dy, bounds) {
    const clamp = (value, min, max) => Math.max(min, Math.min(value, max));
    const right = origin.left + origin.width;
    const bottom = origin.top + origin.height;
    let { left, top, width, height } = origin;
    if (direction.includes("e")) width = clamp(width + dx, Math.min(380, bounds.width - left), bounds.width - left);
    if (direction.includes("s")) height = clamp(height + dy, Math.min(240, bounds.height - top), bounds.height - top);
    if (direction.includes("w")) {
      left = Math.round(clamp(left + dx, 0, Math.max(0, right - 380)));
      width = right - left;
    }
    if (direction.includes("n")) {
      top = Math.round(clamp(top + dy, 0, Math.max(0, bottom - 240)));
      height = bottom - top;
    }
    return { left: Math.round(left), top: Math.round(top), width: Math.round(width), height: Math.round(height) };
  }
  function enableResize(id, element) {
    let resizing = null;
    const cancel = () => {
      if (!resizing) return;
      const { handle, pointerId } = resizing;
      resizing = null;
      document.body.classList.remove("is-resizing");
      document.body.style.removeProperty("--resize-cursor");
      if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId);
    };
    for (const direction of ["n", "e", "s", "w", "ne", "se", "sw", "nw"]) {
      const handle = create("div", `resize-handle resize-${direction}`);
      handle.setAttribute("aria-hidden", "true");
      handle.addEventListener("pointerdown", (event) => {
        if (event.button !== 0 || document.body.classList.contains("is-resizing") || element.classList.contains("is-maximized") || matchMedia("(max-width:640px)").matches) return;
        activate(id);
        const origin = { left: element.offsetLeft, top: element.offsetTop, width: element.offsetWidth, height: element.offsetHeight };
        resizing = { handle, pointerId: event.pointerId, origin, x: event.clientX, y: event.clientY };
        element.classList.add("is-resized");
        // Freeze the computed size before dragging, including short-screen defaults.
        Object.entries(origin).forEach(([key, value]) => { element.style[key] = `${value}px`; });
        document.body.classList.add("is-resizing");
        document.body.style.setProperty("--resize-cursor", `${direction}-resize`);
        handle.setPointerCapture(event.pointerId);
        event.preventDefault();
        event.stopPropagation();
      });
      handle.addEventListener("pointermove", (event) => {
        if (!resizing || event.pointerId !== resizing.pointerId) return;
        const next = resizedBounds(resizing.origin, direction, event.clientX - resizing.x, event.clientY - resizing.y, { width: desktop.clientWidth, height: desktop.clientHeight });
        Object.entries(next).forEach(([key, value]) => { element.style[key] = `${value}px`; });
      });
      const finish = (event) => { if (event.pointerId === resizing?.pointerId) cancel(); };
      handle.addEventListener("pointerup", finish);
      handle.addEventListener("pointercancel", finish);
      handle.addEventListener("lostpointercapture", finish);
      element.append(handle);
    }
    return cancel;
  }
  function enableDrag(element, titlebar) {
    let drag = null;
    titlebar.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || event.target.closest("button") || element.classList.contains("is-maximized") || matchMedia("(max-width:640px)").matches) return;
      drag = { x: event.clientX, y: event.clientY, left: element.offsetLeft, top: element.offsetTop };
      titlebar.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    titlebar.addEventListener("pointermove", (event) => {
      if (!drag) return;
      const left = Math.min(Math.max(0, drag.left + event.clientX - drag.x), Math.max(0, desktop.clientWidth - element.offsetWidth));
      const top = Math.min(Math.max(0, drag.top + event.clientY - drag.y), Math.max(0, desktop.clientHeight - element.offsetHeight));
      element.style.left = `${Math.round(left)}px`;
      element.style.top = `${Math.round(top)}px`;
    });
    const end = () => { drag = null; };
    titlebar.addEventListener("pointerup", end);
    titlebar.addEventListener("pointercancel", end);
    titlebar.addEventListener("lostpointercapture", end);
  }
  function openWindow(id, routeMode = "replace") {
    if (openWindows.has(id)) { activate(id, true, routeMode); return; }
    const element = create("section", "window");
    element.id = `window-${id}`;
    element.setAttribute("role", "dialog");
    element.setAttribute("aria-labelledby", `title-${id}`);
    // Initial positions leave a little desktop visible while keeping windows inside the viewport.
    const offset = openWindows.size * 28;
    const width = Math.min(650, desktop.clientWidth - 48);
    const height = Math.min(510, desktop.clientHeight - 60);
    element.style.left = `${Math.max(0, Math.min(desktop.clientWidth - width - 16, desktop.clientWidth * .24 + offset))}px`;
    element.style.top = `${Math.max(0, Math.min(desktop.clientHeight - height - 16, desktop.clientHeight * .12 + offset))}px`;
    const titlebar = create("div", "titlebar");
    const titleIcon = pixelIcon(windowTypes[id].icon, "title-icon");
    const label = create("span", "window-label", titleOf(id));
    label.id = `title-${id}`;
    const controls = create("div", "window-controls");
    for (const [type, name, action] of [["min", "最小化", () => minimize(id)], ["max", "最大化", () => toggleMaximize(id)], ["close", "关闭", () => closeWindow(id)]]) {
      const button = create("button", `window-control control-${type}`);
      button.type = "button";
      button.setAttribute("aria-label", `${name}${titleOf(id)}`);
      button.title = name;
      button.append(pixelIcon({ min: "minimize", max: "maximize", close: "close" }[type], "control-icon"));
      button.addEventListener("click", action);
      controls.append(button);
    }
    titlebar.append(titleIcon, label, controls);
    titlebar.addEventListener("dblclick", (event) => {
      if (!event.target.closest("button") && !matchMedia("(max-width:640px)").matches) toggleMaximize(id);
    });
    const toolbar = create("div", "window-toolbar");
    toolbar.append(create("span", "", titleOf(id)), create("span", "", menuBrand));
    const body = create("div", "window-body");
    body.tabIndex = 0;
    body.setAttribute("aria-label", `${titleOf(id)}内容`);
    const status = create("div", "statusbar");
    const statusText = create("span", "", windowTypes[id].status());
    statusText.setAttribute("role", "status");
    status.append(statusText, pixelIcon("grip", "status-grip"));
    const content = windowTypes[id].render(body, (text) => { statusText.textContent = text; });
    element.append(titlebar);
    if (id === "settings") element.append(toolbar);
    element.append(body, status);
    const tab = createWindowTab({ id, element, title: titleOf(id), icon: windowTypes[id].icon, onClick: () => {
      const entry = openWindows.get(id);
      if (activeId === id && !entry.minimized) minimize(id); else activate(id, true);
    } });
    windowsHost.append(element);
    tabsHost.append(tab);
    openWindows.set(id, { element, tab, content, minimized: false, cancelResize: enableResize(id, element) });
    element.addEventListener("pointerdown", () => activate(id));
    element.addEventListener("focusin", () => { if (activeId !== id) activate(id); });
    enableDrag(element, titlebar);
    activate(id, true, routeMode);
    announce(`已打开${titleOf(id)}`);
  }
  window.addEventListener("resize", () => {
    for (const { element, cancelResize } of openWindows.values()) {
      cancelResize();
      if (!element.hidden) fitWindow(element);
    }
  });
  function hideAll() {
    for (const entry of openWindows.values()) {
      entry.cancelResize(); entry.content?.setVisible?.(false); entry.minimized = true; entry.element.hidden = true;
    }
    activateRemaining(); start.focus();
  }
  return { openWindow, activate, hideAll, getActiveId: () => activeId, hasWindow: id => openWindows.has(id), getWindow: id => openWindows.get(id) };
}
