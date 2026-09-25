import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { mount } from './dom-harness.mjs';
import { createDesktopRouteCatalog } from '../src/routing/catalog.js';
import { createDesktopRoutes } from '../src/routing/history.js';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
test('desktop windows, routes, themes and persistent state after module migration', async () => {
const checks = [];
const check = (condition, label) => { assert.ok(condition, label); checks.push(label); };
const paths = {
  profile: "/my-computer/", settings: "/system-settings/", works: "/file-explorer/",
  a: "/file-explorer/a-floppy-disk/", c: "/file-explorer/c-local-disk/",
  g: "/file-explorer/g-cd-rom/", h: "/file-explorer/h-flash-drive/",
  story: "/file-explorer/a-floppy-disk/sh-tales/", game: "/file-explorer/g-cd-rom/game-b/"
};
const app = await mount();
check(app.get("windows").children.length === 0 && app.location.pathname === "/", "Home opens a bare desktop");
app.menu("works");
check(app.location.pathname === paths.works, "Explorer has an application URL");
check(!/小说|游戏|实用工具/.test(app.get("window-works").textContent), "Explorer exposes literal drive names without internal categories");
app.drive("a");
check(app.location.pathname === paths.a && app.entry("桑海志怪.txt").href === "https://example.test" + paths.story, "Drive A and its file have hierarchical addresses");
const event = app.click(app.entry("桑海志怪.txt"));
await app.ready();
const story = app.win("sh-tales"), body = story.querySelector(".window-body");
check(event.defaultPrevented && app.location.pathname === paths.story && body.querySelector(".novel-chapter").textContent.includes("海的另一边"), "Story opens in the same desktop with literal file name");
body.scrollTop = 37; story.style.width = "603px";
app.click(story.querySelector(".control-min"));
check(story.hidden && app.location.pathname === paths.a, "Minimize returns to Explorer's remembered drive");
app.click(app.tab("project-sh-tales"));
check(app.location.pathname === paths.story && app.win("sh-tales") === story && body.scrollTop === 37 && story.style.width === "603px", "Taskbar restore preserves DOM, scroll and dimensions");
let count = app.history.length;
app.click(story.querySelector(".control-max")); app.click(story.querySelector(".control-max"));
check(app.history.length === count && app.location.pathname === paths.story, "Maximize does not navigate");
app.click(app.get("start-button"));
check(app.location.pathname === paths.story, "Start menu overlay does not navigate");
app.click(app.get("menu-items").children.find(node => node.dataset.window === "works"));
check(app.location.pathname === paths.a, "Existing Explorer restores its location");
app.drive("g"); app.click(app.entry("Game-B.exe"));
await app.ready();
const game = app.win("game-b");
check(app.location.pathname === paths.game && app.win("sh-tales") === story && !story.hidden, "Game and story coexist in the same desktop");
check(game.querySelector(".project-frame").src === "https://example.test/content/game-b/index.html", "Game loads the standalone received web release");
count = app.history.length;
app.click(app.tab("project-sh-tales")); app.click(app.tab("project-game-b"));
check(app.history.length === count && app.location.pathname === paths.game && app.win("game-b") === game, "Window focus replaces URL without adding history or reloading");
app.click(game.querySelector(".control-min"));
check(app.location.pathname === paths.story && story.classList.contains("is-active"), "Minimize follows the next foreground project");
app.click(app.tab("project-game-b"));
app.menu("settings");
check(app.location.pathname === paths.settings, "Settings uses its own URL");
app.click(app.get("window-settings").querySelector(".control-close"));
check(app.location.pathname === paths.game && !app.get("window-settings"), "Closing settings restores the active game address");
app.menu("profile");
check(app.location.pathname === paths.profile, "My Computer uses its own URL");
app.click(app.get("window-profile").querySelector(".control-min"));
check(app.location.pathname === paths.game, "Minimizing My Computer restores the game");
app.click(game.querySelector(".control-close"));
check(app.location.pathname === paths.story && !app.win("game-b") && !app.tab("project-game-b"), "Closing game removes only its window");
app.click(story.querySelector(".control-min"));
check(app.location.pathname === paths.g, "Explorer still remembers G after other applications");
app.click(app.get("window-works").querySelector(".control-min"));
check(app.location.pathname === "/" && app.get("windows").children.every(node => node.hidden), "All minimized windows leave the desktop address");
app.click(app.tab("works"));
for (const id of ["c", "h"]) {
  app.drive(id);
  check(app.location.pathname === paths[id] && app.get("window-works").querySelector(".explorer-empty"), "Empty drive has a direct address: " + id);
}
app.drive("a");
check(!app.click(app.entry("桑海志怪.txt"), { ctrlKey: true }).defaultPrevented, "Modified clicks keep native new-tab behavior");
app.click(app.entry("桑海志怪.txt"));
check(app.win("sh-tales") === story && app.get("windows").children.filter(node => node.id === story.id).length === 1, "Opening an existing file reuses one window");
app.click(story.querySelector(".control-close"));
app.click(app.get("window-works").querySelector(".control-close"));
app.menu("works");
check(app.location.pathname === paths.works && app.get("explorer-address").value === "", "Reopening closed Explorer resets to its root");

const historyApp = await mount();
historyApp.menu("works"); historyApp.drive("a"); historyApp.click(historyApp.entry("桑海志怪.txt"));
historyApp.menu("works"); historyApp.drive("g"); historyApp.click(historyApp.entry("Game-B.exe"));
const gameDOM = historyApp.win("game-b");
for (const expected of [paths.g, paths.story, paths.a, paths.works, "/"]) {
  historyApp.history.go(-1);
  check(historyApp.location.pathname === expected, "Back restores deliberate visit: " + expected);
}
check(historyApp.get("windows").children.every(node => node.hidden), "Back to home hides all application windows without destroying them");
for (const expected of [paths.works, paths.a, paths.story, paths.g, paths.game]) {
  historyApp.history.go(1);
  check(historyApp.location.pathname === expected, "Forward restores deliberate visit: " + expected);
}
check(historyApp.win("game-b") === gameDOM, "History navigation reuses existing project DOM");
historyApp.menu("works");
historyApp.click(historyApp.get("window-works").querySelector(".explorer-tool"));
check(historyApp.location.pathname === paths.works && historyApp.get("explorer-address").value === "", "Explorer Up returns to Explorer root");
historyApp.history.go(-1);
check(historyApp.location.pathname === paths.game, "Up preserves the previous deliberate content visit");

const catalog = createDesktopRouteCatalog(app.config);
for (const route of catalog.entries) {
  for (const mode of ["root", "subpath"]) {
    const base = mode === "subpath" ? "https://example.test/site/" : "https://example.test/";
    const href = base + route.path;
    const fresh = await mount(href, base);
    check(fresh.get("windows").children.length === 1 && fresh.get("window-" + route.windowId), "Direct entry opens the requested application only: " + mode + " " + route.path);
    if (route.windowId === "works") check(fresh.get("explorer-address").value === (route.driveId || ""), "Direct Explorer entry selects the requested drive: " + mode + " " + route.path);
    const router = createDesktopRoutes({ config: fresh.config, baseURI: base, location: fresh.location, history: fresh.history });
    fresh.click(fresh.get("window-" + route.windowId).querySelector(".control-min"));
    check(router.current() === null, "Direct-entry minimize reaches desktop: " + mode + " " + route.path);
    fresh.click(fresh.tab(route.windowId));
    check(router.current()?.id === route.id && fresh.document.baseURI === base, "Restore keeps deep route and stable assets: " + mode + " " + route.path);
  }
}
for (const route of ["novels/sh-tales/", "games/game-b/"]) {
  check(!catalog.byPath.has(route) && !fs.existsSync(path.join(root, route + "index.html")), "Old route and entry removed: " + route);
}
const indexEntry = await mount("https://example.test" + paths.a + "index.html");
check(indexEntry.location.pathname === paths.a, "Explicit index.html normalizes to directory URL");
for (const [route, entry] of catalog.byPath) {
  const page = read("dist/" + route + "index.html");
  check(page.includes('<base href="' + "../".repeat(route.split("/").filter(Boolean).length) + '">'), "Static page has correct root depth: " + route);
  check(page.replace(/<head>\s*<!-- Generated[^>]*-->\s*<base[^>]*>/, "<head>").replace(/\r/g, "") === read("src/index.html").replace(/\r/g, ""), "Static entry is the same complete desktop: " + route);
  for (const match of page.matchAll(/(?:src|href)="(assets\/[^"#]+)"/g)) assert.ok(fs.existsSync(path.join(root, match[1])), "Referenced runtime asset exists");
  assert.ok(entry.windowId);
}
for (const mutate of [
  cfg => { cfg.explorer.drives[0].slug = "../outside"; },
  cfg => { cfg.works[0].driveId = "missing"; },
  cfg => { cfg.applicationRoutes.settings = "my-computer"; }
]) {
  const cfg = JSON.parse(JSON.stringify(app.config)); mutate(cfg);
  assert.throws(() => createDesktopRouteCatalog(cfg));
}
checks.push("Catalog rejects traversal, unknown drives and duplicate paths");
const css = read("src/styles/desktop.css");
check(css.includes("--scrollbar-size:20px") && (css.match(/width:var\(--scrollbar-size\);height:var\(--scrollbar-size\)/g) || []).length === 2 && css.includes("--statusbar-size:25px"), "Both scrollbar axes and buttons use 20px; statusbar remains 25px");
check(crypto.createHash("sha256").update(fs.readFileSync(path.join(root, "assets/pixel-ui/v1.3.0/scrollbar-arrow-up.png"))).digest("hex") === "85b23c2251236cbfc477c9682d5951578f4b89ec78c13ca3ec4725aa5caa6028", "Canonical arrow artwork is unchanged");

const themed = await mount();
check(themed.document.documentElement.dataset.theme === "retro-ink", "Default remains 95's（异化）");
check(themed.document.documentElement.style["--title-active"] === "#202020", "Default title bar remains ink black");
themed.menu("works"); themed.drive("a"); themed.click(themed.entry("桑海志怪.txt")); themed.menu("profile"); themed.menu("settings");
const settings = themed.get("window-settings"), storyNode = themed.win("sh-tales");
const initialUrl = themed.location.href, initialHistory = themed.history.length;
const radios = settings.querySelectorAll(".theme-radio");
check(radios.length === 5, "Settings provides exactly five theme presets");
check(settings.querySelectorAll(".theme-name").map(node => node.textContent).join("|") === "95's|95's（异化）|深渊|苔痕|幽涧", "Preset names and order match the request");
check(themed.get("theme-presets-toggle").getAttribute("aria-expanded") === "true" && themed.get("theme-custom-panel").hidden, "Current preset section starts expanded");
check(settings.querySelectorAll(".theme-swatch").length === 15 && settings.textContent.includes("控件背景") && settings.textContent.includes("内容背景") && settings.textContent.includes("RGB(0, 0, 128)"), "Presets show labeled swatches and numeric RGB values including title bar");
const originalFill = themed.document.documentElement.style["--desktop"];
const originalImage = themed.get("desktop").style.backgroundImage;
const style = themed.document.documentElement.style;
for (const theme of themed.themes) {
  const radio = themed.get("theme-choice-" + theme.id);
  radio.checked = true; radio.fire("change");
  check(themed.document.documentElement.dataset.theme === theme.id && themed.document.documentElement.dataset.colorScheme === theme.scheme, "Theme selection applies: " + theme.name);
  for (const [token, value] of Object.entries(theme.colors)) assert.equal(style["--" + token], value, theme.name + " " + token);
  check(radios.filter(input => input.checked).length === 1 && radio.parentNode.classList.contains("is-selected"), "Theme selector stays synchronized: " + theme.name);
  check(themed.saved().themeId === theme.id && themed.location.href === initialUrl && themed.history.length === initialHistory, "Theme persists without navigating: " + theme.name);
  check(themed.win("sh-tales") === storyNode && style["--desktop"] === originalFill && themed.get("desktop").style.backgroundImage === originalImage, "Theme preserves open windows and wallpaper: " + theme.name);
}
themed.click(themed.get("theme-custom-toggle"));
check(themed.get("theme-presets-panel").hidden && !themed.get("theme-custom-panel").hidden && themed.get("theme-custom-panel").textContent === "功能开发中", "Custom disclosure exposes only the unavailable placeholder");
check(themed.get("theme-custom-panel").children[0].getAttribute("aria-disabled") === "true" && themed.saved().themeId === "ravine", "Custom placeholder cannot change or save a theme");
themed.click(settings.querySelector(".control-close")); themed.menu("settings");
check(!themed.get("theme-presets-panel").hidden && themed.get("theme-custom-panel").hidden && themed.get("theme-choice-ravine").checked, "Reopened settings expands the section owning the current theme");
const slider = themed.get("menu-transparency"); slider.value = "65"; slider.fire("input");
check(style["--shell-alpha"] === 0.35 && themed.saved().themeId === "ravine", "Transparency and themes remain independent");
themed.get("theme-choice-retro-blue").checked = true; themed.get("theme-choice-retro-blue").fire("change");
check(style["--title-active"] === "#000080" && style["--shell-alpha"] === 0.35 && themed.saved().menuTransparency === 65, "Blue classic theme keeps the existing transparency value");
for (const theme of themed.themes) {
  const fresh = await mount("https://example.test/system-settings/", "https://example.test/", { saved: { themeId: theme.id, menuTransparency: 25, customCursor: true, floatingStars: false } });
  check(fresh.document.documentElement.dataset.theme === theme.id && fresh.get("theme-choice-" + theme.id).checked && fresh.get("custom-cursor").checked && fresh.document.documentElement.style["--shell-alpha"] === 0.75, "Reload restores theme and other settings: " + theme.name);
}
for (const options of [{ saved: { themeId: "not-a-theme" } }, { rawStorage: "{invalid" }, { storageUnavailable: true }]) {
  const fresh = await mount("https://example.test/system-settings/", "https://example.test/", options);
  const radio = fresh.get("theme-choice-moss");
  check(fresh.document.documentElement.dataset.theme === "retro-ink", "Unavailable or invalid stored theme falls back to configured preset");
  radio.checked = true; radio.fire("change");
  check(fresh.document.documentElement.dataset.theme === "moss", "Theme switching survives unavailable or invalid local storage");
}
const luminance = hex => {
  const channels = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
for (const theme of themed.themes.filter(theme => theme.scheme === "dark")) {
  for (const token of ["silver", "content", "field", "accent", "title-active", "title-inactive"]) assert.ok(contrast(theme.colors.ink, theme.colors[token]) >= 4.5, theme.name + " text contrast on " + token);
  check(true, "Night theme foreground contrast verified: " + theme.name);
}
const defined = new Set([...css.matchAll(/(--[\w-]+):/g)].map(match => match[1]));
for (const match of read('src/apps/project-viewer/reader-layout.js').matchAll(/setProperty\('(--[\w-]+)'/g)) defined.add(match[1]);
for (const match of css.matchAll(/var\((--[\w-]+)\)/g)) assert.ok(defined.has(match[1]) || match[1] === "--resize-cursor", "CSS variable defined: " + match[1]);
check(!/legacyRoutes/.test(read("src/config/site.js") + read("src/routing/catalog.js")), "No legacy route compatibility remains in runtime configuration or router");
check(css.includes("rgb(var(--shell-rgb) / var(--shell-alpha))") && css.includes(".window.is-active .titlebar{background:var(--title-active)}") && css.includes("background:var(--content)") && css.includes("background:var(--field)"), "Theme colors reach shell, titlebars and content surfaces");
console.log('Desktop regression assertions: ' + checks.length);
});
