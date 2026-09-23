// Preset palette authority. Wallpaper, its fill and dithering are intentionally separate.
(() => {
  "use strict";
  const classic = {
    silver: "#c0c0c0", ink: "#111111", accent: "#202020", "accent-text": "#ffffff",
    "title-active": "#202020", "title-inactive": "#808080", "title-text": "#ffffff",
    content: "#fffdf5", field: "#ffffff", hover: "#eeeeee",
    "edge-light": "#ffffff", "edge-mid": "#dfdfdf", "edge-dark": "#808080", "edge-shadow": "#000000",
    muted: "#555555", "muted-strong": "#333333", hint: "#404040", empty: "#666666", disabled: "#737373",
    separator: "#aaaaaa", rule: "#dddddd", link: "#000080", focus: "#202020",
    track: "#dfdfdf", "track-dot": "#ffffff", "task-selected": "#dddddd",
    "scroll-button": "#c0c0c0", "check-field": "#ffffff", brand: "#d9d9d9",
    "lamp-edge": "#333333", lamp: "#008080", "lamp-light": "#70c1bb"
  };
  const night = (frame, pane, text, title, selection, edge, shadow, inactive, mid, muted, hover) => ({
    silver: frame, ink: text, accent: selection, "accent-text": text,
    "title-active": title, "title-inactive": inactive, "title-text": text,
    content: pane, field: pane, hover,
    "edge-light": edge, "edge-mid": mid, "edge-dark": inactive, "edge-shadow": shadow,
    muted, "muted-strong": text, hint: muted, empty: muted, disabled: muted,
    separator: mid, rule: frame, link: text, focus: text,
    track: pane, "track-dot": frame, "task-selected": pane,
    "scroll-button": edge, "check-field": edge, brand: text,
    "lamp-edge": shadow, lamp: selection, "lamp-light": edge
  });
  window.DESKTOP_THEMES = [
    { id: "retro-blue", name: "95's", scheme: "light", colors: { ...classic, accent: "#000080", "title-active": "#000080", focus: "#000080" } },
    { id: "retro-ink", name: "95's（异化）", scheme: "light", colors: { ...classic } },
    { id: "abyss", name: "深渊", scheme: "dark", colors: night("#454746", "#242726", "#e1e2dd", "#181b1a", "#59635d", "#757b76", "#101312", "#353a37", "#565d58", "#b7beb8", "#343c36") },
    { id: "moss", name: "苔痕", scheme: "dark", colors: night("#454e48", "#232b27", "#dce4d6", "#18251e", "#496351", "#7d8c7f", "#101a14", "#354238", "#5d6b60", "#b9c6b7", "#33463a") },
    { id: "ravine", name: "幽涧", scheme: "dark", colors: night("#424b55", "#222a33", "#dde3e8", "#17232f", "#485e73", "#7b8a99", "#10171f", "#333f4c", "#596979", "#b6c3cf", "#324251") }
  ];
})();
