import { $, rgbChannels } from '../shared/dom.js';
import { themes } from '../themes/presets.js';
import { createEffects } from './effects.js';
export function createPreferences(config) {
  const storageKey = 'yigrass.desktop.preferences.v1';
  const themeById = new Map(themes.map(theme => [theme.id, theme]));
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { /* Preferences are optional. */ }
  const defaultTransparency = Number(config.defaults?.menuTransparency) || 0;
  const savedTransparency = Number(saved.menuTransparency ?? defaultTransparency);
  const preferences = {
    themeId: themeById.has(saved.themeId) ? saved.themeId : themeById.has(config.defaults?.themeId) ? config.defaults.themeId : themes[0].id,
    menuTransparency: Number.isFinite(savedTransparency) ? Math.min(100, Math.max(0, savedTransparency)) : 0,
    customCursor: typeof saved.customCursor === "boolean" ? saved.customCursor : Boolean(config.defaults?.customCursor),
    floatingStars: typeof saved.floatingStars === "boolean" ? saved.floatingStars : Boolean(config.defaults?.floatingStars)
  };
  const updateStars = createEffects(preferences);
  function applyPreferences() {
    const theme = themeById.get(preferences.themeId);
    const root = document.documentElement;
    root.dataset.theme = theme.id;
    root.dataset.colorScheme = theme.scheme;
    root.style.setProperty("color-scheme", theme.scheme);
    for (const [name, color] of Object.entries(theme.colors)) root.style.setProperty(`--${name}`, color);
    root.style.setProperty("--shell-rgb", rgbChannels(theme.colors.silver).join(" "));
    document.documentElement.style.setProperty("--shell-alpha", 1 - preferences.menuTransparency / 100);
    const settings = $("#window-settings");
    if (settings) {
      $("#menu-transparency", settings).value = preferences.menuTransparency;
      $("#transparency-value", settings).textContent = `${preferences.menuTransparency}%`;
      $("#custom-cursor", settings).checked = preferences.customCursor;
      $("#floating-stars", settings).checked = preferences.floatingStars;
      for (const choice of settings.querySelectorAll(".theme-radio")) {
        choice.checked = choice.value === preferences.themeId;
        choice.parentNode.classList.toggle("is-selected", choice.checked);
      }
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

  return { preferences, applyPreferences };
}
