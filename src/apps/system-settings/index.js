import { create, pixelIcon, announce, rgbChannels } from '../../shared/dom.js';
import { themes } from '../../themes/presets.js';
export function createSettings({ preferences, applyPreferences }) {
  function settingsContent(body) {
    body.classList.add("settings-body");
    const heading = create("div", "settings-heading");
    const copy = create("div");
    copy.append(create("h1", "", "桌面外观"), create("p", "", "调整个人空间的显示方式。"));
    heading.append(pixelIcon("v1.1.0/control-panel", "settings-icon"), copy);
    body.append(heading);

    const themeGroup = create("fieldset", "settings-group theme-group");
    themeGroup.append(create("legend", "", "主题"));
    const sections = [];
    function expandThemeSection(id) {
      for (const section of sections) {
        const expanded = section.id === id;
        section.button.setAttribute("aria-expanded", String(expanded));
        section.panel.hidden = !expanded;
      }
    }
    function themeSection(id, title) {
      const button = create("button", "theme-disclosure");
      button.type = "button";
      button.id = `theme-${id}-toggle`;
      button.setAttribute("aria-controls", `theme-${id}-panel`);
      const arrow = pixelIcon("v1.3.0/scrollbar-arrow-up", "theme-disclosure-arrow");
      button.append(arrow, create("span", "", title));
      const panel = create("div", "theme-panel");
      panel.id = `theme-${id}-panel`;
      panel.setAttribute("role", "region");
      panel.setAttribute("aria-labelledby", button.id);
      button.addEventListener("click", () => expandThemeSection(button.getAttribute("aria-expanded") === "true" ? null : id));
      sections.push({ id, button, panel });
      themeGroup.append(button, panel);
      return panel;
    }
    const presets = themeSection("presets", "预设");
    for (const theme of themes) {
      const row = create("label", `theme-option${theme.id === preferences.themeId ? " is-selected" : ""}`);
      row.htmlFor = `theme-choice-${theme.id}`;
      const input = create("input", "theme-radio");
      Object.assign(input, { type: "radio", name: "desktop-theme", id: row.htmlFor, value: theme.id, checked: theme.id === preferences.themeId });
      input.addEventListener("change", () => {
        if (!input.checked) return;
        preferences.themeId = theme.id;
        applyPreferences();
        expandThemeSection("presets");
        announce(`已应用主题：${theme.name}`);
      });
      const details = create("span", "theme-option-details");
      details.append(create("span", "theme-name", theme.name));
      const palette = create("span", "theme-palette");
      for (const [label, token] of [["控件背景", "silver"], ["内容背景", "content"], ["标题栏", "title-active"]]) {
        const color = theme.colors[token];
        const sample = create("span", "theme-color");
        const swatch = create("span", "theme-swatch");
        swatch.style.backgroundColor = color;
        swatch.setAttribute("aria-hidden", "true");
        const text = create("span", "theme-color-copy");
        text.append(create("span", "theme-color-label", label), create("code", "", `RGB(${rgbChannels(color).join(", ")})`));
        sample.append(swatch, text);
        palette.append(sample);
      }
      details.append(palette);
      row.append(input, details);
      presets.append(row);
    }
    const custom = themeSection("custom", "自定义");
    const unavailable = create("div", "theme-unavailable", "功能开发中");
    unavailable.setAttribute("aria-disabled", "true");
    custom.append(unavailable);
    // Every current theme is a preset. Inspecting the placeholder never changes it.
    expandThemeSection("presets");
    body.append(themeGroup);

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

  return settingsContent;
}
