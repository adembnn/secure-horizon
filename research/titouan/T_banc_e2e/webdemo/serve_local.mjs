// Serveur statique local, OPTIONNEL (apercu sur ta machine). Les modules ES exigent http:// : double-cliquer index.html (file://) ne marche pas dans Chrome.
// Usage : node serve_local.mjs [port]     puis ouvrir http://127.0.0.1:8080/      Ecoute 127.0.0.1 uniquement. Aucun paquet.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve, extname, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
export function createStaticServer(root = HERE) {
  const base = resolve(root);
  return http.createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
      const f = normalize(join(base, p));
      if (f !== base && !f.startsWith(base + sep)) { res.writeHead(403).end('interdit'); return; }
      if (!(await stat(f)).isFile()) throw new Error('non fichier');
      res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream', 'x-content-type-options': 'nosniff', 'cache-control': 'no-store' });
      res.end(await readFile(f));
    } catch (_) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('introuvable'); }
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2]) || 8080;
  createStaticServer().listen(port, '127.0.0.1', () => console.log(`Hold up demo : http://127.0.0.1:${port}/   (Ctrl+C pour arreter)`));
}
