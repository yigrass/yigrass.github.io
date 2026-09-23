// Read-only loopback preview; serve runtime assets and declared routes only.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "../..");
const context = { window: {} };
for (const file of ["assets/site-config.js", "assets/project-routes.js"]) vm.runInNewContext(fs.readFileSync(path.join(root, file), "utf8"), context);
const { byPath } = context.window.createDesktopRouteCatalog(context.window.SITE_CONFIG);
const pages = new Set(["/", "/index.html", ...[...byPath.keys()].flatMap(route => ["/" + route, "/" + route + "index.html"])]);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };
const server = http.createServer((req, res) => {
  let route;
  try { route = decodeURIComponent(new URL(req.url, "http://localhost").pathname); } catch { res.writeHead(400).end(); return; }
  if (!route.endsWith("/") && pages.has(route + "/")) { res.writeHead(301, { Location: route + "/" }).end(); return; }
  const file = path.resolve(root, "." + route, ...(route.endsWith("/") ? ["index.html"] : []));
  const allowed = pages.has(route) || route.startsWith("/assets/");
  if (!allowed || !file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end("Not found"); return; }
  res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(file).pipe(res);
});
server.listen(0, "127.0.0.1", async () => {
  const url = "http://127.0.0.1:" + server.address().port;
  const results = [];
  try {
    for (const route of ["/", ...[...byPath.keys()].map(route => "/" + route), "/assets/themes.js", "/assets/app.js", "/assets/project-routes.js", "/assets/styles.css", "/assets/pixel-ui/v1.3.0/scrollbar-arrow-up.png"]) {
      const response = await fetch(url + route, { signal: AbortSignal.timeout(5000) });
      const bytes = await response.arrayBuffer();
      if (response.status !== 200 || !bytes.byteLength) throw new Error("Failed runtime route: " + route);
      results.push({ route, status: response.status, bytes: bytes.byteLength });
    }
    for (const route of ["/novels/story-a/", "/games/game-b/", "/art/", "/qa/task-transitions.jsonl", "/project-task-tree.json"]) {
      const response = await fetch(url + route, { signal: AbortSignal.timeout(5000) });
      if (response.status !== 404) throw new Error("Unexpected preview exposure: " + route);
      results.push({ route, status: response.status });
    }
    const report = { url, results, limitation: "Local HTTP entry checks only; not a browser rendering or remote deployment check." };
    fs.writeFileSync(path.join(__dirname, "http-results.json"), JSON.stringify(report, null, 2) + "\n");
    console.log(url + " — " + results.length + " runtime HTTP checks passed; development files excluded from this local preview.");
  } catch (error) { console.error(error); server.close(); process.exitCode = 1; }
});
