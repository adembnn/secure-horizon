// Serveur statique minimal pour la page d'essai. node serve.mjs [port]  (127.0.0.1 seulement)
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = dirname(fileURLToPath(import.meta.url));
const port = Number(process.argv[2]) || 8810;
const types = { '.html': 'text/html; charset=utf-8', '.zip': 'application/zip', '.js': 'text/javascript' };
http.createServer(async (req, res) => {
  const u = req.url.split('?')[0];
  const p = u === '/' ? '/index.html' : u;
  if (!/^\/[A-Za-z0-9._-]+$/.test(p)) { res.writeHead(404); return res.end(); }
  try {
    const b = await readFile(join(dir, p));
    res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' });
    res.end(b);
  } catch { res.writeHead(404); res.end('absent'); }
}).listen(port, '127.0.0.1', () => console.log("Page d'essai : http://localhost:" + port));
