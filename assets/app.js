(() => {
  "use strict";
  const config = window.SITE_CONFIG;
  const $ = (selector, root = document) => root.querySelector(selector);
  const desktop = $("#desktop");
  const menu = $("#start-menu");
  const start = $("#start-button");
  const windowsHost = $("#windows");
  const tabsHost = $("#window-tabs");
  const openWindows = new Map();
  const storageKey = "yigrass.desktop.preferences.v1";
  let activeId = null;
  let zIndex = 10;

  const create = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  const safeURL = (value) => {
    if (!value || typeof value !== "string") return "";
    try {
      const url = new URL(value, document.baseURI);
      return ["http:", "https:", "file:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  };
  const announce = (text) => { $("#announcer").textContent = text; };
  const titleOf = (id) => config.menuLabels[id] || (id === "profile" ? "个人信息" : "个人作品");

  document.title = config.siteTitle;
  $("#start-label").textContent = config.startLabel;
  $("#menu-brand").textContent = config.menuBrand;
  document.documentElement.style.setProperty("--desktop", config.themeColor || "#008080");
  const wallpaper = safeURL(config.wallpaper);
  if (wallpaper) desktop.style.backgroundImage = `url(${JSON.stringify(wallpaper)})`;
  desktop.style.backgroundPosition = config.wallpaperPosition || "center center";

  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { /* Preferences are optional. */ }
  const defaultTransparency = Number(config.defaults?.menuTransparency) || 0;
  const savedTransparency = Number(saved.menuTransparency ?? defaultTransparency);
  const preferences = {
    menuTransparency: Number.isFinite(savedTransparency) ? Math.min(100, Math.max(0, savedTransparency)) : 0,
    customCursor: typeof saved.customCursor === "boolean" ? saved.customCursor : Boolean(config.defaults?.customCursor),
    floatingStars: typeof saved.floatingStars === "boolean" ? saved.floatingStars : Boolean(config.defaults?.floatingStars)
  };
  function applyPreferences() {
    document.documentElement.style.setProperty("--menu-alpha", 1 - preferences.menuTransparency / 100);
    $("#menu-transparency").value = preferences.menuTransparency;
    $("#transparency-value").textContent = `${preferences.menuTransparency}%`;
    $("#custom-cursor").checked = preferences.customCursor;
    $("#floating-stars").checked = preferences.floatingStars;
    document.body.classList.toggle("custom-cursor", preferences.customCursor);
    const effects = $("#effects");
    effects.replaceChildren();
    if (preferences.floatingStars) {
      for (let index = 0; index < 16; index++) {
        const star = create("span", "floating-star", index % 3 === 0 ? "✦" : "✧");
        star.style.left = `${(index * 37 + 7) % 100}%`;
        star.style.setProperty("--duration", `${14 + index % 9}s`);
        star.style.setProperty("--delay", `-${index * 2.1}s`);
        effects.append(star);
      }
    }
    try { localStorage.setItem(storageKey, JSON.stringify(preferences)); } catch { /* Site remains usable without storage. */ }
  }
  $("#menu-transparency").addEventListener("input", (event) => {
    preferences.menuTransparency = Number(event.target.value);
    applyPreferences();
  });
  $("#custom-cursor").addEventListener("change", (event) => {
    preferences.customCursor = event.target.checked;
    applyPreferences();
  });
  $("#floating-stars").addEventListener("change", (event) => {
    preferences.floatingStars = event.target.checked;
    applyPreferences();
  });
  applyPreferences();

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
  $("#close-menu").addEventListener("click", () => closeMenu(true));
  document.addEventListener("pointerdown", (event) => {
    if (!menu.hidden && !menu.contains(event.target) && !start.contains(event.target)) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !menu.hidden) { closeMenu(true); event.preventDefault(); }
  });
  menu.addEventListener("keydown", (event) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) || event.target.matches("input")) return;
    const items = [...menu.querySelectorAll("button,summary")].filter((item) => item.getClientRects().length);
    const current = items.indexOf(document.activeElement);
    let next = current;
    if (event.key === "ArrowDown") next = (current + 1) % items.length;
    if (event.key === "ArrowUp") next = (current - 1 + items.length) % items.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = items.length - 1;
    items[next]?.focus();
    event.preventDefault();
  });

  for (const id of ["profile", "works"]) {
    const button = create("button", "menu-item");
    button.type = "button";
    button.dataset.window = id;
    const icon = create("span", `icon icon-${id}`);
    icon.setAttribute("aria-hidden", "true");
    button.append(icon, create("span", "", titleOf(id)));
    button.addEventListener("click", () => { closeMenu(); openWindow(id); });
    $("#menu-items").append(button);
  }

  function updateActive() {
    for (const [id, entry] of openWindows) {
      const active = id === activeId && !entry.minimized;
      entry.element.classList.toggle("is-active", active);
      entry.tab.setAttribute("aria-pressed", String(active));
      entry.tab.setAttribute("aria-label", `${titleOf(id)}${entry.minimized ? "，已最小化，点击还原" : active ? "，当前窗口，点击最小化" : "，点击切换"}`);
    }
  }
  function activate(id, focus = false) {
    const entry = openWindows.get(id);
    if (!entry) return;
    entry.minimized = false;
    entry.element.hidden = false;
    if (!entry.element.classList.contains("is-maximized")) {
      entry.element.style.left = `${Math.max(0, Math.min(entry.element.offsetLeft, desktop.clientWidth - entry.element.offsetWidth))}px`;
      entry.element.style.top = `${Math.max(0, Math.min(entry.element.offsetTop, desktop.clientHeight - entry.element.offsetHeight))}px`;
    }
    if (zIndex > 900) {
      [...openWindows.values()].sort((a, b) => Number(a.element.style.zIndex) - Number(b.element.style.zIndex)).forEach((item, index) => { item.element.style.zIndex = 10 + index; });
      zIndex = 10 + openWindows.size;
    }
    entry.element.style.zIndex = ++zIndex;
    activeId = id;
    updateActive();
    if (focus) $(".window-body", entry.element).focus({ preventScroll: true });
  }
  function activateRemaining() {
    const remaining = [...openWindows.entries()].filter(([, item]) => !item.minimized).sort((a, b) => Number(b[1].element.style.zIndex) - Number(a[1].element.style.zIndex));
    activeId = remaining[0]?.[0] || null;
    updateActive();
  }
  function minimize(id) {
    const entry = openWindows.get(id);
    entry.minimized = true;
    entry.element.hidden = true;
    if (activeId === id) activateRemaining();
    updateActive();
    entry.tab.focus();
    announce(`${titleOf(id)}已最小化`);
  }
  function closeWindow(id) {
    const entry = openWindows.get(id);
    entry.element.remove();
    entry.tab.remove();
    openWindows.delete(id);
    if (activeId === id) activateRemaining();
    if (activeId) activate(activeId, true); else start.focus();
    announce(`${titleOf(id)}已关闭`);
  }
  function toggleMaximize(id) {
    const entry = openWindows.get(id);
    const maximized = entry.element.classList.toggle("is-maximized");
    $(".control-max", entry.element).setAttribute("aria-label", `${maximized ? "还原" : "最大化"}${titleOf(id)}`);
    activate(id);
  }

  function profileContent(body) {
    const profile = config.profile;
    const header = create("div", "profile-header");
    const avatarURL = safeURL(profile.avatar);
    const avatar = avatarURL ? create("img", "avatar") : create("div", "avatar", [...(profile.nickname || "Y")][0].toUpperCase());
    if (avatarURL) { avatar.src = avatarURL; avatar.alt = `${profile.nickname}的头像`; }
    else avatar.setAttribute("aria-hidden", "true");
    const heading = create("div", "profile-heading");
    heading.append(create("h1", "", profile.nickname));
    if (profile.signature) heading.append(create("p", "signature", profile.signature));
    header.append(avatar, heading);
    body.append(header);
    if (profile.introduction) body.append(create("p", "profile-intro", profile.introduction));
    const links = create("div", "profile-links");
    for (const link of profile.links || []) {
      const href = safeURL(link.href);
      if (!href) continue;
      const anchor = create("a", "", link.label);
      anchor.href = href;
      links.append(anchor);
    }
    if (links.childElementCount) body.append(links);
  }
  function worksContent(body) {
    if (!config.works.length) {
      const empty = create("div", "empty-works");
      const icon = create("span", "icon icon-works");
      icon.setAttribute("aria-hidden", "true");
      empty.append(icon, create("h1", "", "这里还没有作品"), create("p", "", "下一段故事，正在路上。"));
      body.append(empty);
      return;
    }
    const list = create("div", "works-list");
    for (const work of config.works) {
      const card = create("article", "work-card");
      const coverURL = safeURL(work.cover);
      if (coverURL) {
        const cover = create("img", "work-cover");
        cover.src = coverURL;
        cover.alt = `${work.title}封面`;
        cover.loading = "lazy";
        card.append(cover);
      }
      card.append(create("span", "work-type", work.type === "game" ? "游戏" : "小说"), create("h2", "", work.title));
      if (work.description) card.append(create("p", "", work.description));
      const href = safeURL(work.href);
      if (href) {
        const link = create("a", "", work.actionLabel || (work.type === "game" ? "开始游戏" : "阅读作品"));
        link.href = href;
        card.append(link);
      }
      list.append(card);
    }
    body.append(list);
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
      element.style.left = `${left}px`;
      element.style.top = `${top}px`;
    });
    const end = () => { drag = null; };
    titlebar.addEventListener("pointerup", end);
    titlebar.addEventListener("pointercancel", end);
    titlebar.addEventListener("lostpointercapture", end);
  }
  function openWindow(id) {
    if (openWindows.has(id)) { activate(id, true); return; }
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
    const titleIcon = create("span", "title-icon", id === "profile" ? "▣" : "▤");
    titleIcon.setAttribute("aria-hidden", "true");
    const label = create("span", "window-label", titleOf(id));
    label.id = `title-${id}`;
    const controls = create("div", "window-controls");
    for (const [type, name, action] of [["min", "最小化", () => minimize(id)], ["max", "最大化", () => toggleMaximize(id)], ["close", "关闭", () => closeWindow(id)]]) {
      const button = create("button", `window-control control-${type}`);
      button.type = "button";
      button.setAttribute("aria-label", `${name}${titleOf(id)}`);
      button.title = name;
      button.addEventListener("click", action);
      controls.append(button);
    }
    titlebar.append(titleIcon, label, controls);
    titlebar.addEventListener("dblclick", (event) => {
      if (!event.target.closest("button") && !matchMedia("(max-width:640px)").matches) toggleMaximize(id);
    });
    const toolbar = create("div", "window-toolbar");
    toolbar.append(create("span", "", titleOf(id)), create("span", "", config.menuBrand));
    const body = create("div", "window-body");
    body.tabIndex = 0;
    body.setAttribute("aria-label", `${titleOf(id)}内容`);
    if (id === "profile") profileContent(body); else worksContent(body);
    const status = create("div", "statusbar");
    status.append(create("span", "", id === "works" ? `${config.works.length} 个作品` : "个人资料"), create("span", "status-grip"));
    element.append(titlebar, toolbar, body, status);
    const tab = create("button", "classic-button window-tab");
    tab.type = "button";
    tab.setAttribute("aria-controls", element.id);
    tab.append(create("span", "title-icon", id === "profile" ? "▣" : "▤"), create("span", "", titleOf(id)));
    tab.addEventListener("click", () => {
      const entry = openWindows.get(id);
      if (activeId === id && !entry.minimized) minimize(id); else activate(id, true);
    });
    windowsHost.append(element);
    tabsHost.append(tab);
    openWindows.set(id, { element, tab, minimized: false });
    element.addEventListener("pointerdown", () => activate(id));
    element.addEventListener("focusin", () => { if (activeId !== id) activate(id); });
    enableDrag(element, titlebar);
    activate(id, true);
    announce(`已打开${titleOf(id)}`);
  }
  window.addEventListener("resize", () => {
    for (const { element } of openWindows.values()) {
      if (element.hidden || element.classList.contains("is-maximized")) continue;
      element.style.left = `${Math.max(0, Math.min(element.offsetLeft, desktop.clientWidth - element.offsetWidth))}px`;
      element.style.top = `${Math.max(0, Math.min(element.offsetTop, desktop.clientHeight - element.offsetHeight))}px`;
    }
  });
  const updateClock = () => {
    const now = new Date();
    $("#clock").textContent = new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now);
    $("#clock").dateTime = now.toISOString();
    $("#clock").title = now.toLocaleDateString("zh-CN");
  };
  updateClock();
  setInterval(updateClock, 15000);
})();
