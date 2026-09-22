// Focused renderer smoke check. Execute with appSource and siteConfig arguments.
// The minimal DOM and safeURL stand-in isolate navigation and categorization.
const checks = [];
const check = (condition, message) => { if (!condition) throw new Error(message); checks.push(message); };
const document = { activeElement: null };
class Element {
  constructor(tag, className = "", text) { this.tag = tag; this.className = className; this.textContent = text ?? ""; this.children = []; this.attributes = {}; this.events = {}; this.classList = { add: name => { this.className += " " + name; } }; }
  append(...items) { this.children.push(...items); }
  replaceChildren(...items) { this.children = items; }
  setAttribute(name, value) { this.attributes[name] = value; }
  removeAttribute(name) { delete this.attributes[name]; }
  addEventListener(name, listener) { this.events[name] = listener; }
  contains(element) { return this === element || this.children.some(child => child.contains(element)); }
  focus() { document.activeElement = this; }
}
const create = (tag, className, text) => new Element(tag, className, text);
const pixelIcon = (name, className) => { const image = create("img", className); image.src = "assets/pixel-ui/" + name + ".png"; return image; };
const safeURL = value => typeof value === "string" && value.startsWith("https://example.test/") ? value : "";
const titleOf = () => "我的电脑";
const source = appSource.slice(appSource.indexOf("  function worksContent("), appSource.indexOf("  function settingsContent("));
const factory = new Function("config", "document", "create", "pixelIcon", "safeURL", "titleOf", source + "; return worksContent;");
const all = (node, predicate) => [ ...(predicate(node) ? [node] : []), ...node.children.flatMap(child => all(child, predicate)) ];
const withClass = (node, name) => all(node, item => item.className.split(" ").includes(name));
const mount = works => {
  const config = { ...siteConfig, works };
  const body = create("div"); let status = "";
  factory(config, document, create, pixelIcon, safeURL, titleOf)(body, value => { status = value; });
  const address = all(body, element => element.tag === "select")[0];
  return { body, status: () => status, go: id => { address.value = id; address.events.change(); } };
};
check(siteConfig.explorer.drives.map(d => d.letter).join(",") === "A,C,G,H", "Drive order is A,C,G,H");
check(siteConfig.explorer.drives.filter(d => d.type === "hard-disk").map(d => d.letter).join() === "C", "C is the only local disk");
check(siteConfig.works.length === 0, "Production projects remain empty");
const empty = mount(siteConfig.works);
check(withClass(empty.body, "drive-tile").length === 4 && empty.status() === "4 个对象", "Root lists four drives");
check(withClass(empty.body, "drive-purpose").map(el => el.textContent).join(",") === "小说,游戏,实用工具", "Drive purpose labels match categories");
for (const id of ["a", "c", "g", "h"]) {
  empty.go(id);
  check(withClass(empty.body, "explorer-empty").length === 1 && empty.status().startsWith("0 个对象"), "Empty production drive " + id);
}
const full = mount([
  { title: "  海边故事  ", category: "novel", url: "https://example.test/story/" },
  { title: "番外.TXT", category: "novel", url: "https://example.test/extra/" },
  { title: "小游戏", category: "game", url: "https://example.test/game/" },
  { title: "便签", category: "utility", url: "https://example.test/tool/" },
  { title: "错误分类", category: "other", url: "https://example.test/other/" },
  { title: "无效链接", category: "novel", url: "javascript:alert(1)" },
  { title: "", category: "novel", url: "https://example.test/empty/" }, null
]);
const firstTile = withClass(full.body, "drive-tile")[0]; firstTile.focus(); firstTile.events.click();
let entries = withClass(full.body, "project-tile");
check(entries.map(el => el.children[1].textContent).join(",") === "海边故事.txt,番外.TXT", "A shows only novels with a single txt suffix");
check(entries.every(el => el.children[0].src.endsWith("/v1.2.0/text-file.png")), "Novel entries use text-file pixel icons");
check(entries.every(el => el.tag === "a" && el.href.startsWith("https://example.test/") && el.target === "_blank" && el.rel === "noopener noreferrer"), "Project entries carry safe separate-tab links");
check(full.status() === "2 个对象 · A:\\", "Novel count is accurate");
check(document.activeElement === withClass(full.body, "explorer-files")[0], "Opening a focused root tile retains pane focus");
withClass(full.body, "explorer-tool")[0].events.click();
check(withClass(full.body, "drive-tile").length === 4, "Up returns to root");
for (const [id, expected] of [["g", "小游戏"], ["h", "便签"]]) {
  full.go(id); entries = withClass(full.body, "project-tile");
  check(entries.length === 1 && entries[0].children[1].textContent === expected, id + " contains only its assigned category");
}
full.go("c");
check(withClass(full.body, "project-tile").length === 0 && withClass(full.body, "explorer-empty").length === 1, "C stays empty even with populated project fixtures");
const tree = all(full.body, el => el.id === "explorer-drive-tree")[0];
const toggle = withClass(full.body, "tree-expand")[0]; toggle.events.click();
check(tree.hidden === true && toggle.attributes["aria-expanded"] === "false", "Tree collapse remains functional");
tree.children[0].children[0].events.click();
check(withClass(full.body, "project-tile").length === 2, "Tree navigation opens the category");
return { passed: checks.length, checks, limitation: "Minimal DOM renderer test; safeURL is a fixture stand-in. No real browser layout or URL parser test." };

