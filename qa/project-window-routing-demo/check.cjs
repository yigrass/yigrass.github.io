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

const app = mount();
check(app.get("windows").children.length === 0, "Home boots without windows");
app.menu("works"); app.drive("a");
check(app.entry("Story-A.txt")?.href === "https://example.test/novels/story-a/", "A exposes the Story-A deep link");
const event = app.click(app.entry("Story-A.txt"));
const story = app.win("story-a"); const storyBody = story.querySelector(".window-body");
check(event.defaultPrevented && !app.entry("Story-A.txt").target, "Ordinary click is handled in the same tab");
check(app.location.pathname === "/novels/story-a/" && storyBody.textContent === "施工中。", "Story opens at its own address with placeholder content");
check(app.document.baseURI === "https://example.test/", "Asset base remains the site root after navigation");
check(app.get("menu-items").querySelectorAll("button").length === 3, "Demo projects do not leak into the Start menu");
storyBody.scrollTop = 37; story.style.width = "603px";
app.click(story.querySelector(".control-min"));
check(story.hidden && app.location.pathname === "/" && app.tab("project-story-a"), "Minimize returns to Explorer/home and keeps a taskbar button");
app.click(app.tab("project-story-a"));
check(app.win("story-a") === story && !story.hidden && storyBody.scrollTop === 37 && story.style.width === "603px", "Restore reuses the same DOM and preserves window state");
check(app.location.pathname === "/novels/story-a/", "Taskbar restore restores the project address");
const count = app.history.length;
app.click(story.querySelector(".control-max")); app.click(story.querySelector(".control-max"));
check(app.location.pathname === "/novels/story-a/" && app.history.length === count, "Maximize/restore do not add history or change route");
app.click(app.get("start-button"));
check(app.location.pathname === "/novels/story-a/", "Start menu overlay retains the project URL");
app.click(app.get("menu-items").children.find(node => node.dataset.window === "works")); app.drive("g");
check(app.location.pathname === "/" && app.entry("Game-B.exe"), "Explorer uses home and G contains Game-B.exe");
app.click(app.entry("Game-B.exe"));
const game = app.win("game-b");
check(app.location.pathname === "/games/game-b/" && app.win("story-a") === story, "Game opens alongside the existing story");
check(game.querySelector(".window-body").textContent === "施工中。" && game.querySelector(".project-preview-icon").src === "assets/pixel-ui/v1.1.0/cdrom.png", "Game contains the placeholder sentence and an existing icon");
const visits = app.history.length;
app.click(app.tab("project-story-a")); app.click(app.tab("project-game-b"));
check(app.location.pathname === "/games/game-b/" && app.history.length === visits && app.win("game-b") === game, "Task switching updates URL without reloading or adding history");
app.click(game.querySelector(".control-min"));
check(app.location.pathname === "/novels/story-a/" && story.classList.contains("is-active"), "Minimizing game activates the visible story and its URL");
app.click(app.tab("project-game-b"));
app.history.go(-1);
check(app.location.pathname === "/novels/story-a/" && !story.hidden, "Back reaches the prior content visit despite intervening Explorer focus");
app.history.go(-1);
check(app.location.pathname === "/" && story.hidden && game.hidden, "Back to home hides projects but keeps their DOM");
app.history.go(1); app.history.go(1);
check(app.location.pathname === "/games/game-b/" && app.win("game-b") === game && !game.hidden, "Forward restores the existing game");
app.click(game.querySelector(".control-close"));
check(!app.win("game-b") && !app.tab("project-game-b") && app.location.pathname === "/novels/story-a/", "Closing the foreground game removes only that window and returns to story");
app.click(story.querySelector(".control-close"));
check(!app.win("story-a") && app.location.pathname === "/", "Closing the final project returns to a system window/home");
app.menu("works"); app.drive("a");
check(!app.click(app.entry("Story-A.txt"), { ctrlKey: true }).defaultPrevented, "Modified link clicks retain native browser behavior");
app.click(app.entry("Story-A.txt"));
check(app.win("story-a") !== story, "Reopening a closed project creates a fresh window");
app.menu("works"); app.drive("a"); app.click(app.entry("Story-A.txt"));
check(app.get("windows").children.filter(node => node.id === "window-project-story-a").length === 1, "Repeated project opens never duplicate the window");
app.menu("settings");
check(app.location.pathname === "/" && app.get("window-settings"), "System Settings remains a desktop address");

for (const [url, base, id] of [
  ["https://example.test/novels/story-a/", "https://example.test/", "story-a"],
  ["https://example.test/games/game-b/index.html", "https://example.test/", "game-b"],
  ["https://example.test/site/novels/story-a/", "https://example.test/site/", "story-a"],
  ["file:///D:/demo/index.html#/games/game-b/", "file:///D:/demo/", "game-b"],
  ["file:///D:/demo/novels/story-a/index.html", "file:///D:/demo/", "story-a"]
]) {
  const fresh = mount(url, base);
  check(fresh.win(id) && fresh.get("windows").children.length === 1, "Direct entry/refresh opens exactly its project: " + url);
  fresh.click(fresh.win(id).querySelector(".control-min"));
  check(fresh.win(id).hidden && fresh.window.createProjectRoutes({ works: fresh.window.SITE_CONFIG.works, baseURI: base, location: fresh.location, history: fresh.history }).current() === null, "Direct-entry minimize resolves to desktop: " + url);
  fresh.click(fresh.tab("project-" + id));
  check(!fresh.win(id).hidden, "Direct-entry taskbar restore works: " + url);
}

// Inspect the static artifacts, not just the in-memory router.
for (const route of ["novels/story-a/", "games/game-b/"]) {
  const page = read(route + "index.html");
  check(page.includes('<base href="../../">') && page.includes('src="assets/project-routes.js"'), "Static route has the shared shell and correct asset base: " + route);
  for (const match of page.matchAll(/(?:src|href)="(assets\/[^"#]+)"/g)) check(fs.existsSync(path.join(root, match[1])), "Static asset exists: " + route + match[1]);
}
const css = read("assets/styles.css");
check(css.includes("--statusbar-size:25px") && css.includes("width:var(--statusbar-size);height:16px") && css.includes("min-height:var(--statusbar-size)"), "Vertical scrollbar and statusbar share 25px; horizontal stays 16px");
const result = { passed: checks.length, checks, limitation: "Actual app code executed with a minimal DOM and simulated history; not a browser layout, pixel, pointer-capture or hosting test." };
fs.writeFileSync(path.join(__dirname, "results.json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result, null, 2));
