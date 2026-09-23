// One-time, task-scoped migration. Kept as execution evidence; not a build dependency.
import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const read = p => fs.readFileSync(path.join(root, p), 'utf8').replace(/\r\n/g, '\n');
const write = (p, text) => { fs.mkdirSync(path.dirname(path.join(root, p)), { recursive: true }); fs.writeFileSync(path.join(root, p), text); };
const app = read('assets/app.js');
const part = (start, end) => {
  const a = app.indexOf(start), b = app.indexOf(end, a + start.length);
  if (a < 0 || b < 0) throw Error(`Missing boundary: ${start}`);
  return app.slice(a, b);
};
const helpers = `import { $, create, safeURL, pixelIcon, announce, rgbChannels } from '../../shared/dom.js';\n`;
write('src/shared/dom.js', `export const $ = (selector, root = document) => root.querySelector(selector);\n` + part('  const create =', '  const titleOf =').replace(/^  /gm, '').replaceAll('const create =', 'export const create =').replaceAll('const safeURL =', 'export const safeURL =').replaceAll('const announce =', 'export const announce =').replace('"http:", "https:", "file:"', '"http:", "https:"') + part('  const pixelIcon =', '  // Freeze asset').replace(/^  /gm, '').replace('const pixelIcon =', 'export const pixelIcon =') + 'export const rgbChannels = color => color.slice(1).match(/../g).map(channel => parseInt(channel, 16));\n');
let config = read('assets/site-config.js').replace('window.SITE_CONFIG =', 'export const siteConfig =');
config = config.slice(0, config.indexOf('  // category')) + '};\n';
write('src/config/site.js', config);
write('catalog/projects.json', JSON.stringify([
  { id: 'story-a', title: 'Story-A.txt', category: 'novel', driveId: 'a', slug: 'story-a', release: 'releases/story-a/' },
  { id: 'game-b', title: 'Game-B.exe', category: 'game', driveId: 'g', slug: 'game-b', release: 'releases/game-b/' }
], null, 2) + '\n');
write('src/themes/presets.js', read('assets/themes.js').replace('(() => {\n  "use strict";\n', '').replace('window.DESKTOP_THEMES =', 'export const themes =').replace(/\n\}\)\(\);\s*$/, '\n').replace(/^  /gm, ''));
const routes = read('assets/project-routes.js');
const split = routes.indexOf('  window.createDesktopRoutes =');
write('src/routing/catalog.js', routes.slice(routes.indexOf('  // Shared'), split).replace('window.createDesktopRouteCatalog =', 'export const createDesktopRouteCatalog =').replace(/^  /gm, ''));
let history = routes.slice(split).replace('window.createDesktopRoutes =', 'export const createDesktopRoutes =').replace('window.createDesktopRouteCatalog(config)', 'createDesktopRouteCatalog(config)').replace(/\n\}\)\(\);\s*$/, '\n').replace(/^  /gm, '');
history = history.replace('  const localFile = location.protocol === "file:";\n', '').replace('new URL(localFile ? location.href : "./", root)', 'new URL("./", root)').replace(/const homeAddress = .*;/, 'const homeAddress = home.href;').replace('localFile ? home.href + "#/" + entry.path : new URL(entry.path, root).href', 'new URL(entry.path, root).href');
history = history.replace('    if (localFile && url.hash.startsWith("#/")) path = url.hash.slice(2);\n    else {', '    {');
write('src/routing/history.js', `import { createDesktopRouteCatalog } from './catalog.js';\n` + history);
write('src/apps/my-computer/index.js', helpers + `export function createProfile({ config, titleOf }) {\n` + part('  function profileContent(', '  function worksContent(') + '  return profileContent;\n}\n');
write('src/apps/file-explorer/index.js', helpers + `import { projectCategories, projectWindowId } from '../registry.js';\nexport function createExplorer({ config, desktopRoutes, titleOf, getActiveId, syncAddress, openProject }) {\n` + part('  function worksContent(', '  function settingsContent(').replace('if (activeId === "works")', 'if (getActiveId() === "works")') + '  return worksContent;\n}\n');
write('src/apps/system-settings/index.js', helpers + `import { themes } from '../../themes/presets.js';\nexport function createSettings({ preferences, applyPreferences }) {\n` + part('  function settingsContent(', '  function fitWindow(').replace('windowTypes.settings.icon', '"v1.1.0/control-panel"') + '  return settingsContent;\n}\n');
write('src/desktop/effects.js', `import { $, pixelIcon } from '../shared/dom.js';\nexport function createEffects(preferences) {\n  const desktop = $('#desktop');\n` + part('  const reducedMotion =', '  function applyPreferences(') + '  return updateStars;\n}\n');
write('src/desktop/preferences.js', `import { $, rgbChannels } from '../shared/dom.js';\nimport { themes } from '../themes/presets.js';\nimport { createEffects } from './effects.js';\nexport function createPreferences(config) {\n  const storageKey = 'yigrass.desktop.preferences.v1';\n  const themeById = new Map(themes.map(theme => [theme.id, theme]));\n` + part('  let saved =', '  const reducedMotion =') + '  const updateStars = createEffects(preferences);\n' + part('  function applyPreferences(', '  function closeMenu(') + '  return { preferences, applyPreferences };\n}\n');
write('src/desktop/start-menu.js', `import { $, create, pixelIcon } from '../shared/dom.js';\nexport function createStartMenu({ windowTypes, titleOf, openWindow, hasWindow }) {\n  const menu = $('#start-menu'), start = $('#start-button');\n` + part('  function closeMenu(', '  function updateActive(').replaceAll('openWindows.has(id)', 'hasWindow(id)') + '  return { closeMenu };\n}\n');
let windowCode = part('  function updateActive(', '  function profileContent(') + part('  function fitWindow(', '  const updateClock =');
windowCode = windowCode.replaceAll('syncAddress(', 'onAddressChange(');
windowCode = windowCode.replace('    entry.element.remove();', '    entry.content?.dispose?.();\n    entry.element.remove();');
windowCode = windowCode.replace('    entry.minimized = false;', '    if (entry.minimized) entry.content?.setVisible?.(true);\n    entry.minimized = false;');
windowCode = windowCode.replace('    entry.minimized = true;', '    entry.content?.setVisible?.(false);\n    entry.minimized = true;');
const tabStart = windowCode.indexOf('    const tab = create("button", "classic-button window-tab");');
const tabEnd = windowCode.indexOf('    windowsHost.append(element);', tabStart);
windowCode = windowCode.slice(0, tabStart) + `    const tab = createWindowTab({ id, element, title: titleOf(id), icon: windowTypes[id].icon, onClick: () => {\n      const entry = openWindows.get(id);\n      if (activeId === id && !entry.minimized) minimize(id); else activate(id, true);\n    } });\n` + windowCode.slice(tabEnd);
write('src/desktop/window-manager.js', `import { $, create, pixelIcon, announce } from '../shared/dom.js';\nimport { createWindowTab } from './taskbar.js';\nexport function createWindowManager({ windowTypes, titleOf, onAddressChange }) {\n  const desktop = $('#desktop'), windowsHost = $('#windows'), tabsHost = $('#window-tabs'), start = $('#start-button');\n  const openWindows = new Map();\n  let activeId = null, zIndex = 10;\n` + windowCode.replace('create("span", "", config.menuBrand)', 'create("span", "", "")') + `  function hideAll() {\n    for (const entry of openWindows.values()) {\n      entry.cancelResize(); entry.content?.setVisible?.(false); entry.minimized = true; entry.element.hidden = true;\n    }\n    activateRemaining(); start.focus();\n  }\n  return { openWindow, activate, hideAll, getActiveId: () => activeId, hasWindow: id => openWindows.has(id), getWindow: id => openWindows.get(id) };\n}\n`);
write('src/desktop/taskbar.js', `import { $, create, pixelIcon } from '../shared/dom.js';\nexport function createWindowTab({ id, element, title, icon, onClick }) {\n  const tab = create('button', 'classic-button window-tab');\n  tab.type = 'button'; tab.setAttribute('aria-controls', element.id);\n  tab.append(pixelIcon(icon, 'title-icon'), create('span', '', title));\n  tab.addEventListener('click', onClick);\n  return tab;\n}\nexport function startClock() {\n` + part('  const updateClock =', '  window.addEventListener("popstate"') + '}\n');
let wallpaper = read('assets/wallpaper-edges.js').replace('(() => {', 'export function initializeWallpaper(config) {').replace(/\n\}\)\(\);\s*$/, '\n}\n').replace('window.SITE_CONFIG.wallpaper', 'config.wallpaper').replace('"http:", "https:", "file:"', '"http:", "https:"');
wallpaper = wallpaper.replace('  const canvas =', `  document.documentElement.style.setProperty('--desktop', config.themeColor || '#2d2f2d');\n  desktop.style.backgroundImage = 'url(' + JSON.stringify(new URL(config.wallpaper, document.baseURI).href) + ')';\n  desktop.style.backgroundPosition = config.wallpaperPosition || 'center center';\n  const canvas =`);
write('src/desktop/wallpaper.js', wallpaper);
write('src/styles/desktop.css', read('assets/styles.css').replaceAll('url("pixel-ui/', 'url("../../assets/pixel-ui/').replaceAll('url("wallpapers/', 'url("../../assets/wallpapers/'));
write('src/index.html', read('index.html').replace('href="assets/styles.css"', 'href="app/styles/desktop.css"').replace(/  <script src="assets\/[^\n]+\n/g, '').replace('</head>', '  <script type="module" src="app/main.js"></script>\n</head>'));
const removed = ['index.html', 'assets/app.js', 'assets/site-config.js', 'assets/themes.js', 'assets/project-routes.js', 'assets/wallpaper-edges.js', 'assets/styles.css', 'scripts/generate-project-pages.cjs'];
for (const route of ['my-computer', 'system-settings', 'file-explorer', 'file-explorer/a-floppy-disk', 'file-explorer/a-floppy-disk/story-a', 'file-explorer/c-local-disk', 'file-explorer/g-cd-rom', 'file-explorer/g-cd-rom/game-b', 'file-explorer/h-flash-drive']) removed.push(route + '/index.html');
for (const relative of removed) {
  const target = path.resolve(root, relative);
  if (!target.startsWith(root + path.sep) || fs.lstatSync(target).isSymbolicLink()) throw Error('Unsafe migration path');
  fs.unlinkSync(target);
}
for (const dir of ['file-explorer/a-floppy-disk/story-a', 'file-explorer/g-cd-rom/game-b', 'file-explorer/a-floppy-disk', 'file-explorer/c-local-disk', 'file-explorer/g-cd-rom', 'file-explorer/h-flash-drive', 'file-explorer', 'my-computer', 'system-settings']) {
  const target = path.resolve(root, dir);
  if (!target.startsWith(root + path.sep)) throw Error('Unsafe directory');
  if (!fs.readdirSync(target).length) fs.rmdirSync(target);
}
console.log('Migrated website source; removed only the listed obsolete files and empty entry directories.');
