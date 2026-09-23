// Local, read-only preview. Only the website runtime is served, on loopback.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };
const server = http.createServer((req, res) => {
  let route;
  try { route = decodeURIComponent(new URL(req.url, "http://localhost").pathname); } catch { res.writeHead(400).end(); return; }
  const allowed = /^\/(?:index\.html)?$/.test(route) || /^\/(?:novels\/story-a|games\/game-b)\/(?:index\.html)?$/.test(route) || route.startsWith("/assets/");
  const file = path.resolve(root, "." + route, ...(route.endsWith("/") ? ["index.html"] : []));
  if (!allowed || !file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end("Not found"); return; }
  res.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(file).pipe(res);
});
server.listen(0, "127.0.0.1", async () => {
  const url = `http://127.0.0.1:${server.address().port}`;
  const results = [];
  try {
    for (const route of ["/", "/novels/story-a/", "/games/game-b/", "/assets/app.js", "/assets/project-routes.js", "/assets/pixel-ui/v1.1.0/cdrom.png"]) {
      const response = await fetch(url + route, { signal: AbortSignal.timeout(5000) });
      const bytes = await response.arrayBuffer();
      if (response.status !== 200 || bytes.byteLength === 0) throw new Error(`Failed runtime URL: ${route}`);
      results.push({ route, status: response.status, bytes: bytes.byteLength });
    }
    const report = { url, results, limitation: "Loopback HTTP checks only; no browser rendering verified." };
    fs.writeFileSync(path.join(__dirname, "http-results.json"), JSON.stringify(report, null, 2) + "\n");
    console.log(JSON.stringify(report, null, 2));
  } catch (error) { console.error(error); server.close(); process.exitCode = 1; }
});
