// Execute the actual application in a small DOM/history harness, not a browser.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "../..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const checks = [];
const check = (condition, label) => { assert.ok(condition, label); checks.push(label); };

function mount(href = "https://example.test/", baseURI = "https://example.test/") {
  let document;
  class Element {
    constructor(tag) {
      this.tag = tag; this.children = []; this.parentNode = null; this.attributes = {};
      this.events = {}; this.className = ""; this.dataset = {}; this.hidden = false; this._text = "";
      this.style = { setProperty(key, value) { this[key] = value; }, removeProperty(key) { delete this[key]; } };
      this.classList = {
        contains: name => this.className.split(/\s+/).includes(name),
        add: name => { if (!this.classList.contains(name)) this.className += " " + name; },
        remove: name => { this.className = this.className.split(/\s+/).filter(item => item !== name).join(" "); },
        toggle: (name, force) => { const value = force ?? !this.classList.contains(name); this.classList[value ? "add" : "remove"](name); return value; }
      };
    }
    set textContent(value) { this._text = String(value); this.replaceChildren(); }
    get textContent() { return this._text + this.children.map(child => child.textContent).join(""); }
    get childElementCount() { return this.children.length; }
    append(...items) { for (const item of items) { item.remove(); this.children.push(item); item.parentNode = this; } }
    prepend(item) { item.remove(); this.children.unshift(item); item.parentNode = this; }
    remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(child => child !== this); this.parentNode = null; }
    replaceChildren(...items) { for (const child of this.children) child.parentNode = null; this.children = []; this.append(...items); }
    setAttribute(key, value) { this.attributes[key] = String(value); }
    getAttribute(key) { return this.attributes[key] ?? null; }
    removeAttribute(key) { delete this.attributes[key]; }
    addEventListener(type, listener) { (this.events[type] ||= []).push(listener); }
    contains(node) { return this === node || this.children.some(child => child.contains(node)); }
    matches(selector) { return selector.startsWith("#") ? this.id === selector.slice(1) : selector.startsWith(".") ? this.classList.contains(selector.slice(1)) : this.tag === selector; }
    closest(selector) { for (let node = this; node; node = node.parentNode) if (node.matches(selector)) return node; return null; }
    querySelectorAll(selector) {
      const parts = selector.split(/\s+/);
      const matching = node => {
        if (!node.matches(parts.at(-1))) return false;
        let parent = node.parentNode;
        for (let index = parts.length - 2; index >= 0; index--) {
          while (parent && !parent.matches(parts[index])) parent = parent.parentNode;
          if (!parent) return false;
          parent = parent.parentNode;
        }
        return true;
      };
      return this.children.flatMap(child => [...(matching(child) ? [child] : []), ...child.querySelectorAll(selector)]);
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    fire(type, options = {}) {
      const event = { target: this, button: 0, detail: 1, preventDefault() { this.defaultPrevented = true; }, stopPropagation() { this.stopped = true; }, ...options };
      for (let node = this; node; node = node.parentNode) {
        for (const listener of node.events[type] || []) listener(event);
        if (event.stopped) break;
      }
      return event;
    }
    focus() { document.activeElement = this; this.fire("focusin"); }
    get offsetWidth() { return Number.parseFloat(this.style.width) || 650; }
    get offsetHeight() { return Number.parseFloat(this.style.height) || 510; }
    get offsetLeft() { return Number.parseFloat(this.style.left) || 0; }
    get offsetTop() { return Number.parseFloat(this.style.top) || 0; }
    get clientWidth() { return 1440; }
    get clientHeight() { return 900; }
    getClientRects() { return this.hidden ? [] : [{}]; }
    hasPointerCapture() { return false; }
    setPointerCapture() {}
    releasePointerCapture() {}
  }
  document = new Element("document");
  document.createElement = tag => new Element(tag);
  document.documentElement = new Element("html");
  document.head = new Element("head"); document.body = new Element("body");
  document.append(document.documentElement); document.documentElement.append(document.head, document.body);
  document.activeElement = document.body;
  Object.defineProperty(document, "baseURI", { get: () => document.querySelector("base")?.href || baseURI });
  for (const match of read("index.html").matchAll(/<([a-z]+)[^>]*\bid="([^"]+)"[^>]*>/g)) {
    const node = new Element(match[1]); node.id = match[2]; document.body.append(node);
  }
  const get = id => document.querySelector("#" + id);
  get("desktop").append(get("windows"), get("effects"));
  get("start-menu").append(get("menu-items"), get("menu-brand"));
  get("start-button").append(get("start-label"));
  get("start-menu").hidden = true;
  const location = new URL(href);
  const windowEvents = {};
  const stack = [{ href, state: null }]; let cursor = 0;
  const history = {
    get state() { return stack[cursor].state; }, get length() { return stack.length; },
    write(state, url, push) {
      const target = new URL(url, location);
      if (location.protocol === "file:") assert.equal(target.pathname, location.pathname, "file preview must not change file path");
      else assert.equal(target.origin, location.origin, "history must stay same-origin");
      if (push) { stack.splice(cursor + 1); cursor++; }
      stack[cursor] = { href: target.href, state }; location.href = target.href;
    },
    replaceState(state, title, url) { this.write(state, url, false); },
    pushState(state, title, url) { this.write(state, url, true); },
    go(delta) { const next = cursor + delta; if (next < 0 || next >= stack.length) return; cursor = next; location.href = stack[cursor].href; for (const fn of windowEvents.popstate || []) fn({ state: this.state }); }
  };
  const window = { location, history, addEventListener(type, fn) { (windowEvents[type] ||= []).push(fn); } };
  const localStorage = { getItem: () => null, setItem() {} };
  const context = vm.createContext({ window, document, URL, localStorage, matchMedia: () => ({ matches: false, addEventListener() {} }), requestAnimationFrame: () => 1, cancelAnimationFrame() {}, setInterval() {} });
  for (const file of ["assets/site-config.js", "assets/project-routes.js", "assets/app.js"]) vm.runInContext(read(file), context, { filename: file });
  const click = (node, options = {}) => { assert.ok(node, "click target exists"); node.fire("pointerdown", options); node.focus(); return node.fire("click", options); };
  const menu = id => { click(get("start-button")); click(get("menu-items").children.find(node => node.dataset.window === id)); };
  const drive = id => { const select = get("explorer-address"); select.value = id; select.fire("change"); };
  const entry = title => get("window-works").querySelectorAll("a").find(node => node.textContent === title);
  const win = id => get("window-project-" + id);
  const tab = id => get("window-tabs").children.find(node => node.getAttribute("aria-controls") === "window-" + id);
  return { window, document, location, history, get, click, menu, drive, entry, win, tab };
}


const paths = {
  profile: "/my-computer/", settings: "/system-settings/", works: "/file-explorer/",
  a: "/file-explorer/a-floppy-disk/", c: "/file-explorer/c-local-disk/",
  g: "/file-explorer/g-cd-rom/", h: "/file-explorer/h-flash-drive/",
  story: "/file-explorer/a-floppy-disk/story-a/", game: "/file-explorer/g-cd-rom/game-b/"
};
const app = mount();
check(app.get("windows").children.length === 0 && app.location.pathname === "/", "Home opens a bare desktop");
app.menu("works");
check(app.location.pathname === paths.works, "Explorer has an application URL");
check(!/小说|游戏|实用工具/.test(app.get("window-works").textContent), "Explorer exposes literal drive names without internal categories");
app.drive("a");
check(app.location.pathname === paths.a && app.entry("Story-A.txt").href === "https://example.test" + paths.story, "Drive A and its file have hierarchical addresses");
const event = app.click(app.entry("Story-A.txt"));
const story = app.win("story-a"), body = story.querySelector(".window-body");
check(event.defaultPrevented && app.location.pathname === paths.story && body.textContent === "施工中。", "Story opens in the same desktop with literal file name");
body.scrollTop = 37; story.style.width = "603px";
app.click(story.querySelector(".control-min"));
check(story.hidden && app.location.pathname === paths.a, "Minimize returns to Explorer's remembered drive");
app.click(app.tab("project-story-a"));
check(app.location.pathname === paths.story && app.win("story-a") === story && body.scrollTop === 37 && story.style.width === "603px", "Taskbar restore preserves DOM, scroll and dimensions");
let count = app.history.length;
app.click(story.querySelector(".control-max")); app.click(story.querySelector(".control-max"));
check(app.history.length === count && app.location.pathname === paths.story, "Maximize does not navigate");
app.click(app.get("start-button"));
check(app.location.pathname === paths.story, "Start menu overlay does not navigate");
app.click(app.get("menu-items").children.find(node => node.dataset.window === "works"));
check(app.location.pathname === paths.a, "Existing Explorer restores its location");
app.drive("g"); app.click(app.entry("Game-B.exe"));
const game = app.win("game-b");
check(app.location.pathname === paths.game && app.win("story-a") === story && !story.hidden, "Game and story coexist in the same desktop");
check(game.querySelector(".project-preview-icon").src === "assets/pixel-ui/v1.1.0/cdrom.png", "Game keeps its existing small illustration");
count = app.history.length;
app.click(app.tab("project-story-a")); app.click(app.tab("project-game-b"));
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
check(!app.click(app.entry("Story-A.txt"), { ctrlKey: true }).defaultPrevented, "Modified clicks keep native new-tab behavior");
app.click(app.entry("Story-A.txt"));
check(app.win("story-a") === story && app.get("windows").children.filter(node => node.id === story.id).length === 1, "Opening an existing file reuses one window");
app.click(story.querySelector(".control-close"));
app.click(app.get("window-works").querySelector(".control-close"));
app.menu("works");
check(app.location.pathname === paths.works && app.get("explorer-address").value === "", "Reopening closed Explorer resets to its root");

const historyApp = mount();
historyApp.menu("works"); historyApp.drive("a"); historyApp.click(historyApp.entry("Story-A.txt"));
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

const catalog = app.window.createDesktopRouteCatalog(app.window.SITE_CONFIG);
for (const route of catalog.entries) {
  for (const mode of ["root", "subpath", "file", "file-entry"]) {
    const base = mode === "subpath" ? "https://example.test/site/" : mode.startsWith("file") ? "file:///D:/demo/" : "https://example.test/";
    const href = mode === "file" ? base + "index.html#/" + route.path : base + route.path + (mode === "file-entry" ? "index.html" : "");
    const fresh = mount(href, base);
    check(fresh.get("windows").children.length === 1 && fresh.get("window-" + route.windowId), "Direct entry opens the requested application only: " + mode + " " + route.path);
    if (route.windowId === "works") check(fresh.get("explorer-address").value === (route.driveId || ""), "Direct Explorer entry selects the requested drive: " + mode + " " + route.path);
    const router = fresh.window.createDesktopRoutes({ config: fresh.window.SITE_CONFIG, baseURI: base, location: fresh.location, history: fresh.history });
    fresh.click(fresh.get("window-" + route.windowId).querySelector(".control-min"));
    check(router.current() === null, "Direct-entry minimize reaches desktop: " + mode + " " + route.path);
    fresh.click(fresh.tab(route.windowId));
    check(router.current()?.id === route.id && fresh.document.baseURI === base, "Restore keeps deep route and stable assets: " + mode + " " + route.path);
  }
}
for (const [alias, target] of [["novels/story-a/", paths.story], ["games/game-b/", paths.game]]) {
  const fresh = mount("https://example.test/" + alias);
  check(fresh.location.pathname === target, "Legacy links normalize to literal hierarchy: " + alias);
}
const indexEntry = mount("https://example.test" + paths.a + "index.html");
check(indexEntry.location.pathname === paths.a, "Explicit index.html normalizes to directory URL");
for (const [route, entry] of catalog.byPath) {
  const page = read(route + "index.html");
  check(page.includes('<base href="' + "../".repeat(route.split("/").filter(Boolean).length) + '">'), "Static page has correct root depth: " + route);
  check(page.replace(/<head>\s*<!-- Generated[^>]*-->\s*<base[^>]*>/, "<head>").replace(/\r/g, "") === read("index.html").replace(/\r/g, ""), "Static entry is the same complete desktop: " + route);
  for (const match of page.matchAll(/(?:src|href)="(assets\/[^"#]+)"/g)) assert.ok(fs.existsSync(path.join(root, match[1])), "Referenced runtime asset exists");
  assert.ok(entry.windowId);
}
for (const mutate of [
  cfg => { cfg.explorer.drives[0].slug = "../outside"; },
  cfg => { cfg.works[0].driveId = "missing"; },
  cfg => { cfg.works[0].legacyRoutes = ["my-computer/"]; },
  cfg => { cfg.applicationRoutes.settings = "my-computer"; }
]) {
  const cfg = JSON.parse(JSON.stringify(app.window.SITE_CONFIG)); mutate(cfg);
  assert.throws(() => app.window.createDesktopRouteCatalog(cfg));
}
checks.push("Catalog rejects traversal, unknown drives and duplicate paths");
const css = read("assets/styles.css");
check(css.includes("--scrollbar-size:20px") && (css.match(/width:var\(--scrollbar-size\);height:var\(--scrollbar-size\)/g) || []).length === 2 && css.includes("--statusbar-size:25px"), "Both scrollbar axes and buttons use 20px; statusbar remains 25px");
const crypto = require("node:crypto");
check(crypto.createHash("sha256").update(fs.readFileSync(path.join(root, "assets/pixel-ui/v1.3.0/scrollbar-arrow-up.png"))).digest("hex") === "85b23c2251236cbfc477c9682d5951578f4b89ec78c13ca3ec4725aa5caa6028", "Canonical arrow artwork is unchanged");
const result = { passed: checks.length, checks, limitation: "Actual application executed with a minimal DOM and simulated history; not a real-browser rendering or deployment test." };
// Compile the separate conversation preview; it is never loaded by the website.
const previewPath = JSON.parse(read("project-task-tree.json")).tasks.find(task => task.id === "desktop-address-hierarchy-theme-preview").previewPath;
const preview = fs.readFileSync(previewPath, "utf8");
const previewScript = preview.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(previewScript, { filename: "desktop-night-palettes.html" });
assert.ok(Buffer.byteLength(preview) < 1_000_000 && !/<!doctype|<html|<body|fetch\(/i.test(preview));
console.log("Isolated theme preview JavaScript compiled; HTML fragment contract checked.");
fs.writeFileSync(path.join(__dirname, "results.json"), JSON.stringify(result, null, 2) + "\n");
console.log("Passed " + checks.length + " desktop address and regression checks.");
