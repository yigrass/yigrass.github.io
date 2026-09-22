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
  const windowTypes = {
    profile: { title: "我的电脑", icon: "v1.1.0/computer", render: profileContent, status: () => "个人系统属性" },
    works: { title: "资源管理器", icon: "works", render: worksContent, status: () => `${config.explorer?.drives?.length || 0} 个对象` },
    settings: { title: "系统设置", icon: "v1.1.0/control-panel", render: settingsContent, status: () => "设置即时生效，仅保存于此浏览器" }
  };

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
  const titleOf = (id) => config.menuLabels?.[id] || windowTypes[id].title;
  const pixelIcon = (name, className = "") => {
    const icon = create("img", `pixel-icon ${className}`.trim());
    icon.src = `assets/pixel-ui/${name}.png`;
    icon.alt = "";
    icon.width = 16;
    icon.height = 16;
    icon.draggable = false;
    return icon;
  };

  document.title = config.siteTitle;
  $("#start-label").textContent = config.startLabel;
  $("#menu-brand").textContent = config.menuBrand;
  document.documentElement.style.setProperty("--desktop", config.themeColor || "#2d2f2d");
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
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let starAnimation = 0;
  let starsRunning = false;
  function updateStars() {
    const enabled = preferences.floatingStars && !reducedMotion.matches;
    if (enabled === starsRunning) return;
    starsRunning = enabled;
    cancelAnimationFrame(starAnimation);
    const effects = $("#effects");
    effects.replaceChildren();
    if (!enabled) return;
    const stars = Array.from({ length: 16 }, (_, index) => {
      const star = pixelIcon("star", "floating-star");
      effects.append(star);
      return { element: star, offset: index * 89, speed: 12 + index % 7, x: (index * 37 + 7) % 100 };
    });
    let previousTick = -Infinity;
    const animate = (time) => {
      if (time - previousTick >= 80) {
        const width = desktop.clientWidth;
        const height = desktop.clientHeight + 32;
        for (const star of stars) {
          const x = Math.round((width * star.x / 100) / 2) * 2;
          const y = Math.round(((time / 1000 * star.speed + star.offset) % height - 24) / 2) * 2;
          star.element.style.transform = `translate(${x}px, ${y}px)`;
        }
        previousTick = time;
      }
      starAnimation = requestAnimationFrame(animate);
    };
    starAnimation = requestAnimationFrame(animate);
  }
  reducedMotion.addEventListener("change", updateStars);
  function applyPreferences() {
    document.documentElement.style.setProperty("--shell-alpha", 1 - preferences.menuTransparency / 100);
    const settings = $("#window-settings");
    if (settings) {
      $("#menu-transparency", settings).value = preferences.menuTransparency;
      $("#transparency-value", settings).textContent = `${preferences.menuTransparency}%`;
      $("#custom-cursor", settings).checked = preferences.customCursor;
      $("#floating-stars", settings).checked = preferences.floatingStars;
    }
    document.body.classList.toggle("custom-cursor", preferences.customCursor);
    updateStars();
    let status = "设置已保存，仅对此浏览器生效";
    try { localStorage.setItem(storageKey, JSON.stringify(preferences)); }
    catch { status = "设置已生效；此浏览器未允许保存设置"; }
    const statusText = settings && $(".statusbar span", settings);
    if (statusText) statusText.textContent = status;
  }
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

  for (const id of Object.keys(windowTypes)) {
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
    fitWindow(entry.element);
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
    entry.cancelResize();
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

  function profileContent(body) {
    body.classList.add("properties-body");
    const profile = config.profile || {};
    const tabs = create("div", "property-tabs");
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "个人系统属性");
    const pages = create("div", "property-pages");
    const buttons = [];
    const panels = [];
    const selectTab = (index, focus = false) => {
      buttons.forEach((button, position) => {
        button.setAttribute("aria-selected", String(position === index));
        button.tabIndex = position === index ? 0 : -1;
        panels[position].hidden = position !== index;
      });
      if (focus) buttons[index].focus();
    };
    for (const [index, [key, name]] of [["general", "常规"], ["about", "个人介绍"], ["contact", "联系信息"]].entries()) {
      const tab = create("button", "property-tab", name);
      tab.type = "button";
      tab.id = `property-tab-${key}`;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", `property-panel-${key}`);
      tab.addEventListener("click", () => selectTab(index));
      tab.addEventListener("keydown", (event) => {
        const next = { ArrowRight: (index + 1) % 3, ArrowLeft: (index + 2) % 3, Home: 0, End: 2 }[event.key];
        if (next !== undefined) { event.preventDefault(); selectTab(next, true); }
      });
      const panel = create("section", "property-panel");
      panel.id = `property-panel-${key}`;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tab.id);
      panel.tabIndex = 0;
      tabs.append(tab);
      pages.append(panel);
      buttons.push(tab);
      panels.push(panel);
    }
    const header = create("div", "properties-heading");
    const avatarURL = safeURL(profile.avatar);
    const avatar = avatarURL ? create("img", "property-avatar") : pixelIcon("v1.1.0/computer", "property-computer");
    if (avatarURL) { avatar.src = avatarURL; avatar.alt = `${profile.nickname || "个人"}的头像`; }
    const heading = create("div");
    heading.append(create("h1", "", titleOf("profile")), create("p", "", "个人系统属性"));
    header.append(avatar, heading);
    panels[0].append(header);
    const identity = create("fieldset", "property-group");
    identity.append(create("legend", "", "注册信息"));
    const fields = create("dl", "property-fields");
    for (const [label, value] of [["昵称", profile.nickname], ["个性签名", profile.signature]]) {
      fields.append(create("dt", "", label), create("dd", value ? "" : "property-placeholder", value || "—"));
    }
    identity.append(fields);
    panels[0].append(identity);
    const about = create("fieldset", "property-group");
    about.append(create("legend", "", "个人介绍"), create("p", profile.introduction ? "profile-intro" : "property-placeholder", profile.introduction || "暂未填写"));
    panels[1].append(about);
    const contact = create("fieldset", "property-group");
    contact.append(create("legend", "", "联系方式与个人链接"));
    const links = create("ul", "property-links");
    for (const link of profile.links || []) {
      const href = safeURL(link.href);
      if (!href) continue;
      const item = create("li");
      const anchor = create("a", "", link.label || href);
      anchor.href = href;
      item.append(anchor);
      links.append(item);
    }
    contact.append(links.childElementCount ? links : create("p", "property-placeholder", "暂未填写"));
    panels[2].append(contact);
    body.append(tabs, pages);
    selectTab(0);
  }
  function worksContent(body, setStatus) {
    body.classList.add("explorer-body");
    const drives = config.explorer?.drives || [];
    const rootLabel = titleOf("profile");
    const driveLabel = (drive) => `${drive.label} (${drive.letter}:)`;
    const driveIcon = (drive, className) => pixelIcon(`v1.1.0/${["hard-disk", "floppy", "cdrom"].includes(drive.type) ? drive.type : "hard-disk"}`, className);
    let currentLocation = null;
    const toolbar = create("div", "explorer-toolbar");
    toolbar.setAttribute("role", "group");
    toolbar.setAttribute("aria-label", "资源管理器工具栏");
    function tool(label, icon, action) {
      const button = create("button", "classic-button explorer-tool");
      button.type = "button";
      button.title = label;
      button.append(pixelIcon(icon), create("span", "", label));
      button.addEventListener("click", action);
      toolbar.append(button);
      return button;
    }
    const up = tool("向上", "v1.1.0/up", () => navigate(null));
    const addressRow = create("label", "explorer-address");
    addressRow.htmlFor = "explorer-address";
    const address = create("select");
    address.id = "explorer-address";
    const rootOption = create("option", "", rootLabel);
    rootOption.value = "";
    address.append(rootOption);
    for (const drive of drives) {
      const option = create("option", "", `${drive.letter}:\\ — ${drive.label}`);
      option.value = drive.id;
      address.append(option);
    }
    address.addEventListener("change", () => navigate(address.value || null));
    addressRow.append(create("span", "", "地址"), address);
    const panes = create("div", "explorer-panes");
    const sidebar = create("nav", "explorer-sidebar");
    sidebar.id = "explorer-folders";
    sidebar.setAttribute("aria-label", "文件夹导航");
    sidebar.append(create("div", "explorer-pane-label", "文件夹"));
    const treeRoot = create("div", "explorer-tree-root");
    const expand = create("button", "tree-expand", "−");
    expand.type = "button";
    expand.setAttribute("aria-expanded", "true");
    expand.setAttribute("aria-controls", "explorer-drive-tree");
    expand.setAttribute("aria-label", "收起驱动器列表");
    const rootButton = create("button", "tree-location");
    rootButton.type = "button";
    rootButton.append(pixelIcon("v1.1.0/computer"), create("span", "", rootLabel));
    rootButton.addEventListener("click", () => navigate(null));
    treeRoot.append(expand, rootButton);
    const tree = create("ul", "explorer-drive-tree");
    tree.id = "explorer-drive-tree";
    const locationButtons = new Map([[null, rootButton]]);
    for (const drive of drives) {
      const item = create("li");
      const button = create("button", "tree-location");
      button.type = "button";
      button.title = driveLabel(drive);
      button.append(driveIcon(drive), create("span", "", driveLabel(drive)));
      button.addEventListener("click", () => navigate(drive.id));
      item.append(button);
      tree.append(item);
      locationButtons.set(drive.id, button);
    }
    expand.addEventListener("click", () => {
      tree.hidden = !tree.hidden;
      expand.textContent = tree.hidden ? "+" : "−";
      expand.setAttribute("aria-expanded", String(!tree.hidden));
      expand.setAttribute("aria-label", `${tree.hidden ? "展开" : "收起"}驱动器列表`);
    });
    sidebar.append(treeRoot, tree);
    const content = create("section", "explorer-files");
    content.tabIndex = 0;
    panes.append(sidebar, content);
    body.append(toolbar, addressRow, panes);
    function navigate(id) {
      if (id !== null && !drives.some((drive) => drive.id === id)) return;
      if (currentLocation === id) return;
      currentLocation = id;
      render();
    }
    function render() {
      const id = currentLocation;
      const drive = drives.find((item) => item.id === id);
      const label = drive ? driveLabel(drive) : rootLabel;
      // Moving into a drive removes its root tile; retain keyboard focus in the pane.
      const restoreFocus = content.contains(document.activeElement);
      up.disabled = !drive;
      address.value = id || "";
      for (const [location, button] of locationButtons) {
        if (location === id) button.setAttribute("aria-current", "location");
        else button.removeAttribute("aria-current");
      }
      content.replaceChildren();
      content.setAttribute("aria-label", `${label}内容`);
      const caption = create("div", "explorer-location-heading");
      caption.append(drive ? driveIcon(drive) : pixelIcon("v1.1.0/computer"), create("h1", "", label));
      content.append(caption);
      if (drive) {
        const empty = create("div", "explorer-empty");
        empty.append(create("p", "", "此文件夹为空。"));
        content.append(empty);
      } else {
        const grid = create("div", "drive-grid");
        for (const item of drives) {
          const tile = create("button", "drive-tile");
          tile.type = "button";
          tile.title = `打开${driveLabel(item)}`;
          tile.append(driveIcon(item, "drive-icon"), create("span", "", driveLabel(item)));
          tile.addEventListener("click", () => navigate(item.id));
          grid.append(tile);
        }
        content.append(grid);
      }
      setStatus(`${drive ? "0" : drives.length} 个对象${drive ? ` · ${drive.letter}:\\` : ""}`);
      if (restoreFocus) content.focus({ preventScroll: true });
    }
    render();
  }

  function settingsContent(body) {
    body.classList.add("settings-body");
    const heading = create("div", "settings-heading");
    const copy = create("div");
    copy.append(create("h1", "", "桌面外观"), create("p", "", "调整个人空间的显示方式。"));
    heading.append(pixelIcon(windowTypes.settings.icon, "settings-icon"), copy);
    body.append(heading);

    const menuGroup = create("fieldset", "settings-group");
    menuGroup.append(create("legend", "", "开始菜单与任务栏"));
    const label = create("label", "range-label");
    label.htmlFor = "menu-transparency";
    const output = create("output", "", `${preferences.menuTransparency}%`);
    output.id = "transparency-value";
    output.setAttribute("for", "menu-transparency");
    label.append(create("span", "", "底色透明度"), output);
    const range = create("input");
    Object.assign(range, { type: "range", id: "menu-transparency", min: "0", max: "100", step: "5", value: String(preferences.menuTransparency) });
    range.addEventListener("input", () => { preferences.menuTransparency = Number(range.value); applyPreferences(); });
    const endpoints = create("div", "range-endpoints");
    endpoints.append(create("span", "", "不透明"), create("span", "", "透明"));
    menuGroup.append(label, range, endpoints, create("p", "setting-hint", "同时调整开始菜单和任务栏的底色，文字和图标保持清晰。"));
    body.append(menuGroup);

    const effectsGroup = create("fieldset", "settings-group");
    effectsGroup.append(create("legend", "", "桌面效果"));
    for (const [id, key, title, description, icon] of [
      ["custom-cursor", "customCursor", "自定义光标", "使用经典像素箭头，适用于鼠标操作。", "cursor"],
      ["floating-stars", "floatingStars", "漂浮星星", "在桌面上显示缓缓飘落的像素星星。", "star"]
    ]) {
      const row = create("label", "setting-row");
      row.htmlFor = id;
      const input = create("input", "pixel-checkbox");
      input.type = "checkbox";
      input.id = id;
      input.checked = preferences[key];
      input.addEventListener("change", () => { preferences[key] = input.checked; applyPreferences(); });
      const text = create("span", "setting-copy");
      text.append(create("span", "setting-title", title), create("span", "setting-hint", description));
      row.append(pixelIcon(icon, "setting-icon"), text, input);
      effectsGroup.append(row);
    }
    body.append(effectsGroup);
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
    toolbar.append(create("span", "", titleOf(id)), create("span", "", config.menuBrand));
    const body = create("div", "window-body");
    body.tabIndex = 0;
    body.setAttribute("aria-label", `${titleOf(id)}内容`);
    const status = create("div", "statusbar");
    const statusText = create("span", "", windowTypes[id].status());
    statusText.setAttribute("role", "status");
    status.append(statusText, pixelIcon("grip", "status-grip"));
    windowTypes[id].render(body, (text) => { statusText.textContent = text; });
    element.append(titlebar);
    if (id === "settings") element.append(toolbar);
    element.append(body, status);
    const tab = create("button", "classic-button window-tab");
    tab.type = "button";
    tab.setAttribute("aria-controls", element.id);
    tab.append(pixelIcon(windowTypes[id].icon, "title-icon"), create("span", "", titleOf(id)));
    tab.addEventListener("click", () => {
      const entry = openWindows.get(id);
      if (activeId === id && !entry.minimized) minimize(id); else activate(id, true);
    });
    windowsHost.append(element);
    tabsHost.append(tab);
    openWindows.set(id, { element, tab, minimized: false, cancelResize: enableResize(id, element) });
    element.addEventListener("pointerdown", () => activate(id));
    element.addEventListener("focusin", () => { if (activeId !== id) activate(id); });
    enableDrag(element, titlebar);
    activate(id, true);
    announce(`已打开${titleOf(id)}`);
  }
  window.addEventListener("resize", () => {
    for (const { element, cancelResize } of openWindows.values()) {
      cancelResize();
      if (!element.hidden) fitWindow(element);
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
