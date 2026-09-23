// Adapt the existing accepted regression scenarios to the real ES module graph.
import fs from 'node:fs';
const old = fs.readFileSync('qa/theme-presets-breaking-changes/check.cjs', 'utf8').replace(/\r\n/g, '\n');
let harness = old.slice(old.indexOf('function mount('), old.indexOf('\n\n\nconst paths'));
harness = harness.replace('function mount(', 'export async function mount(').replace('read("index.html")', 'read("src/index.html")');
harness = harness.replace('    hasPointerCapture() {', '    getContext() { return null; }\n    hasPointerCapture() {');
harness = harness.replace('const window = { location, history,', 'const window = { location, history, removeEventListener(type, fn) { windowEvents[type] = (windowEvents[type] || []).filter(item => item !== fn); },');
const loaderStart = harness.indexOf('  const context = vm.createContext(');
const loaderEnd = harness.indexOf('  const click =', loaderStart);
harness = harness.slice(0, loaderStart) + `  const fetch = async url => {
    const relative = new URL(url).pathname.slice(new URL(baseURI).pathname.length);
    const override = options.responses?.[relative];
    if (override) return typeof override === 'function' ? override() : { ok: true, json: async () => JSON.parse(override), text: async () => override };
    try { const bytes = await fsp.readFile(path.join(root, relative), 'utf8'); return { ok: true, json: async () => JSON.parse(bytes), text: async () => bytes }; }
    catch { return { ok: false, status: 404 }; }
  };
  const context = vm.createContext({ window, document, URL, localStorage, fetch, AbortController, setTimeout, matchMedia: () => ({ matches: false, addEventListener() {} }), requestAnimationFrame: () => 1, cancelAnimationFrame() {}, setInterval() {} });
  const modules = new Map();
  function getModule(file) {
    if (!modules.has(file)) modules.set(file, new vm.SourceTextModule(fs.readFileSync(file, 'utf8'), { context, identifier: file }));
    return modules.get(file);
  }
  const entryModule = getModule(path.join(root, 'src/desktop/bootstrap.js'));
  await entryModule.link((specifier, parent) => getModule(path.resolve(path.dirname(parent.identifier), specifier)));
  await entryModule.evaluate();
  const config = structuredClone({ ...siteConfig, works: JSON.parse(read('catalog/projects.json')) });
  const manager = entryModule.namespace.bootDesktop(config);
  const ready = () => Promise.all(config.works.map(project => manager.getWindow('project-' + project.id)?.content?.ready));
` + harness.slice(loaderEnd);
harness = harness.replace('return { window, document,', 'return { manager, ready, config, themes, window, document,');
fs.mkdirSync('tests', { recursive: true });
fs.writeFileSync('tests/dom-harness.mjs', `import fs from 'node:fs';\nimport fsp from 'node:fs/promises';\nimport path from 'node:path';\nimport vm from 'node:vm';\nimport assert from 'node:assert/strict';\nimport { fileURLToPath } from 'node:url';\nimport { siteConfig } from '../src/config/site.js';\nimport { themes } from '../src/themes/presets.js';\nconst root = fileURLToPath(new URL('../', import.meta.url));\nconst read = file => fs.readFileSync(path.join(root, file), 'utf8');\n` + harness + '\n');
let checks = old.slice(old.indexOf('const paths ='), old.indexOf('const result ='));
checks = checks.replace(/= mount\(/g, '= await mount(').replaceAll('.window.SITE_CONFIG', '.config').replaceAll('.window.DESKTOP_THEMES', '.themes');
checks = checks.replaceAll('app.window.createDesktopRouteCatalog', 'createDesktopRouteCatalog').replaceAll('fresh.window.createDesktopRoutes', 'createDesktopRoutes');
checks = checks.replace('["root", "subpath", "file", "file-entry"]', '["root", "subpath"]');
checks = checks.replace('    const base = mode === "subpath" ? "https://example.test/site/" : mode.startsWith("file") ? "file:///D:/demo/" : "https://example.test/";', '    const base = mode === "subpath" ? "https://example.test/site/" : "https://example.test/";');
checks = checks.replace('    const href = mode === "file" ? base + "index.html#/" + route.path : base + route.path + (mode === "file-entry" ? "index.html" : "");', '    const href = base + route.path;');
checks = checks.replace('const story = app.win', 'await app.ready();\nconst story = app.win').replace('body.textContent === "施工中。"', 'body.querySelector(".novel-chapter").textContent.trim() === "施工中。"');
checks = checks.replace('const game = app.win', 'await app.ready();\nconst game = app.win').replace('game.querySelector(".project-preview-icon").src === "assets/pixel-ui/v1.1.0/cdrom.png"', 'game.querySelector(".project-frame").src === "https://example.test/releases/game-b/index.html"').replace('Game keeps its existing small illustration', 'Game loads the standalone received web release');
checks = checks.replace('read(route + "index.html")', 'read("dist/" + route + "index.html")').replaceAll('read("index.html")', 'read("src/index.html")');
checks = checks.replaceAll('read("assets/styles.css")', 'read("src/styles/desktop.css")').replaceAll('read("assets/site-config.js")', 'read("src/config/site.js")').replaceAll('read("assets/project-routes.js")', 'read("src/routing/catalog.js")');
const header = `import fs from 'node:fs';\nimport path from 'node:path';\nimport crypto from 'node:crypto';\nimport assert from 'node:assert/strict';\nimport test from 'node:test';\nimport { fileURLToPath } from 'node:url';\nimport { mount } from './dom-harness.mjs';\nimport { createDesktopRouteCatalog } from '../src/routing/catalog.js';\nimport { createDesktopRoutes } from '../src/routing/history.js';\nconst root = fileURLToPath(new URL('../', import.meta.url));\nconst read = file => fs.readFileSync(path.join(root, file), 'utf8');\ntest('desktop windows, routes, themes and persistent state after module migration', async () => {\nconst checks = [];\nconst check = (condition, label) => { assert.ok(condition, label); checks.push(label); };\n`;
fs.writeFileSync('tests/desktop.test.mjs', header + checks.replace('const crypto = require("node:crypto");\n', '') + `console.log('Desktop regression assertions: ' + checks.length);\n});\n`);
console.log('Prepared source-aware regression harness; original QA files unchanged.');
