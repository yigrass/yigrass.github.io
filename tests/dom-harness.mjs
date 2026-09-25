import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { siteConfig } from '../src/config/site.js';
import { themes } from '../src/themes/presets.js';
import { receivedProjects } from '../src/shared/novel/model.js';
import { readNovel } from '../scripts/lib/releases.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
export async function mount(href = "https://example.test/", baseURI = "https://example.test/", options = {}) {
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
    get tagName() { return this.tag.toUpperCase(); }
    append(...items) { for (const item of items) { item.remove(); this.children.push(item); item.parentNode = this; } }
    prepend(item) { item.remove(); this.children.unshift(item); item.parentNode = this; }
    remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(child => child !== this); this.parentNode = null; }
    replaceChildren(...items) { for (const child of this.children) child.parentNode = null; this.children = []; this.append(...items); }
    setAttribute(key, value) { this.attributes[key] = String(value); }
    getAttribute(key) { return this.attributes[key] ?? null; }
    removeAttribute(key) { delete this.attributes[key]; }
    addEventListener(type, listener) { (this.events[type] ||= []).push(listener); }
    removeEventListener(type, listener) { this.events[type] = (this.events[type] || []).filter(item => item !== listener); }
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
    get scrollHeight() { return 1800; }
    getClientRects() { return this.hidden ? [] : [{}]; }
    getContext() { return null; }
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
  for (const match of read("src/index.html").matchAll(/<([a-z]+)[^>]*\bid="([^"]+)"[^>]*>/g)) {
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
  const window = { location, history, removeEventListener(type, fn) { windowEvents[type] = (windowEvents[type] || []).filter(item => item !== fn); }, addEventListener(type, fn) { (windowEvents[type] ||= []).push(fn); }, fire(type, options = {}) { const event = { target: document.activeElement, preventDefault() { this.defaultPrevented = true; }, ...options }; for (const listener of windowEvents[type] || []) listener(event); return event; } };
  let stored = options.rawStorage ?? (options.saved ? JSON.stringify(options.saved) : null);
  const localStorage = { getItem() { if (options.storageUnavailable) throw Error("Storage denied"); return stored; }, setItem(key, value) { if (options.storageUnavailable) throw Error("Storage denied"); stored = value; } };
  const fetch = async url => {
    const relative = new URL(url).pathname.slice(new URL(baseURI).pathname.length);
    const override = options.responses?.[relative];
    if (override) return typeof override === 'function' ? override() : { ok: true, json: async () => JSON.parse(override), text: async () => override };
    try { const bytes = await fsp.readFile(path.join(root, relative), 'utf8'); return { ok: true, json: async () => JSON.parse(bytes), text: async () => bytes }; }
    catch { return { ok: false, status: 404 }; }
  };
  const context = vm.createContext({ window, document, URL, localStorage, fetch, AbortController, setTimeout, getComputedStyle: () => ({ lineHeight: '30.4px', paddingBottom: '24px' }), matchMedia: () => ({ matches: false, addEventListener() {} }), requestAnimationFrame: () => 1, cancelAnimationFrame() {}, setInterval() {} });
  const modules = new Map();
  function getModule(file) {
    if (file === path.join(root, 'src/shared/novel/parser.js')) file = path.join(root, 'dist/app/shared/novel/parser.js');
    if (!modules.has(file)) modules.set(file, new vm.SourceTextModule(fs.readFileSync(file, 'utf8'), { context, identifier: file }));
    return modules.get(file);
  }
  const entryModule = getModule(path.join(root, 'src/desktop/bootstrap.js'));
  await entryModule.link((specifier, parent) => getModule(path.resolve(path.dirname(parent.identifier), specifier)));
  await entryModule.evaluate();
  const projects = options.projects || JSON.parse(read('catalog/projects.json'));
  const releases = await Promise.all(projects.filter(project => project.category === 'novel').map(async project => {
    const manifest = JSON.parse(options.responses?.[project.release + 'release.json'] || read(project.release + 'release.json'));
    const manifestDocuments = [manifest.readme, ...manifest.volumes.flatMap(volume => [volume.readme, ...volume.chapters])];
    const received = await readNovel(project.release, async file => {
      const response = options.responses?.[project.release + file];
      if (typeof response === 'string') return response;
      // Delayed/error runtime responses still have a previously built title index.
      if (typeof response === 'function') return '# ' + (manifestDocuments.find(item => item.file === file)?.title || '测试文档');
      return read(project.release + file);
    });
    return { project, manifest: received };
  }));
  const config = structuredClone({ ...siteConfig, works: receivedProjects(projects, releases) });
  const manager = entryModule.namespace.bootDesktop(config);
  const ready = () => Promise.all(config.works.map(project => manager.getWindow('project-' + project.id)?.content?.ready));
  const click = (node, options = {}) => { assert.ok(node, "click target exists"); node.fire("pointerdown", options); node.focus(); return node.fire("click", options); };
  const menu = id => { click(get("start-button")); click(get("menu-items").children.find(node => node.dataset.window === id)); };
  const drive = id => { const select = get("explorer-address"); select.value = id; select.fire("change"); };
  const entry = title => get("window-works").querySelectorAll("a").find(node => node.textContent === title);
  const win = id => get("window-project-" + id);
  const tab = id => get("window-tabs").children.find(node => node.getAttribute("aria-controls") === "window-" + id);
  return { manager, ready, config, themes, window, document, location, history, get, click, menu, drive, entry, win, tab, saved: () => JSON.parse(stored) };
}
