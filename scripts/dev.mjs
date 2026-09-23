import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { build, projectRoot } from './build.mjs';

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
export function createPreviewServer(root = path.join(projectRoot, 'dist')) {
  root = path.resolve(root);
  return http.createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405).end(); return; }
    try {
      const url = new URL(request.url, 'http://localhost');
      const pathname = decodeURIComponent(url.pathname);
      if (pathname.includes('\\') || pathname.includes('\0')) throw new Error('Invalid path');
      let file = path.resolve(root, '.' + pathname);
      if (file !== root && !file.startsWith(root + path.sep)) throw new Error('Outside output');
      if ((await fsp.stat(file)).isDirectory()) {
        if (!pathname.endsWith('/')) { response.writeHead(301, { Location: url.pathname + '/' + url.search }).end(); return; }
        file = path.join(file, 'index.html');
      }
      const real = await fsp.realpath(file);
      if (!real.startsWith(root + path.sep)) throw new Error('Outside output');
      const bytes = await fsp.readFile(real);
      response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Content-Length': bytes.length, 'Cache-Control': 'no-store' });
      response.end(request.method === 'HEAD' ? undefined : bytes);
    } catch { response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found'); }
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await build();
  const portArg = process.argv.indexOf('--port');
  const port = Number(portArg < 0 ? 4173 : process.argv[portArg + 1]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port');
  const server = createPreviewServer();
  server.listen(port, '127.0.0.1', () => console.log(`Preview: http://127.0.0.1:${port}/ (dist only; refresh after rebuild)`));
  let timer, running = false, pending = false;
  async function rebuild() {
    if (running) { pending = true; return; }
    running = true;
    try { await build(); } catch (error) { console.error(`Build failed; previous dist retained: ${error.message}`); }
    finally { running = false; if (pending) { pending = false; await rebuild(); } }
  }
  const watchers = ['src', 'assets', 'catalog', 'releases', 'contracts'].map(dir => fs.watch(path.join(projectRoot, dir), { recursive: true }, () => { clearTimeout(timer); timer = setTimeout(rebuild, 150); }));
  const stop = () => { clearTimeout(timer); watchers.forEach(watcher => watcher.close()); server.close(() => process.exit(0)); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
}
