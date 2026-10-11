// Serveur de fichiers statiques minimal, 127.0.0.1 uniquement. Usage : node serveur_statique.mjs <dossier> <port>
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize, resolve } from 'node:path';
const [,, racine, port] = process.argv;
const base = resolve(racine);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
    const f = resolve(join(base, normalize(p)));
    if (!f.startsWith(base)) { res.writeHead(403).end(); return; }
    const buf = await readFile(f);
    res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' }).end(buf);
  } catch { res.writeHead(404).end('introuvable'); }
}).listen(Number(port), '127.0.0.1');
