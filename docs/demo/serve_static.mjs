// Tiny static file server for local demos. Usage : node docs/demo/serve_static.mjs <dir> [port]
// Écoute sur 127.0.0.1 seulement. Refuse tout chemin qui sort du dossier servi :
// « .. » (en clair ou encodé %2e%2e, avec / ou \), chemin absolu, lettre de lecteur, octet nul,
// et lien symbolique ou jonction dont la cible réelle est hors du dossier.
import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { extname, isAbsolute, join, relative, resolve } from 'node:path';

const root = resolve(process.argv[2] || '.');
const port = Number(process.argv[3] || 8790);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };

// Vrai si `p` est `base` lui-même ou un chemin situé dessous. Exige le séparateur : « banc2 » n'est pas sous « banc ».
function dedans(base, p) {
  const r = relative(base, p);
  return r === '' || (!isAbsolute(r) && r !== '..' && !r.startsWith('..\\') && !r.startsWith('../'));
}

let rootReel = root;
try { rootReel = await realpath(root); } catch { /* dossier absent : chaque requête répondra 404 */ }

http.createServer(async (req, res) => {
  let brut;
  try { brut = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400).end('bad request'); return; }
  // Refus net, avant toute normalisation : octet nul, segment « .. », lettre de lecteur (C:).
  if (brut.includes('\0') || brut.split(/[\\/]+/).includes('..') || /^[\\/]*[a-zA-Z]:/.test(brut)) {
    res.writeHead(403).end(); return;
  }
  const morceau = brut.replace(/^[\\/]+/, '');
  let file = join(root, morceau || 'index.html');
  if (!dedans(root, file)) { res.writeHead(403).end(); return; }
  try {
    if (!extname(file) || (await stat(file)).isDirectory()) file = join(file, 'index.html');
    const reel = await realpath(file); // suit les liens symboliques et les jonctions
    if (!dedans(rootReel, reel)) { res.writeHead(403).end(); return; }
    const body = await readFile(reel);
    res.writeHead(200, { 'content-type': TYPES[extname(reel)] || 'application/octet-stream', 'cache-control': 'no-store' }).end(body);
  } catch { res.writeHead(404).end('not found'); }
}).listen(port, '127.0.0.1', () => console.log(`serving ${root} on http://127.0.0.1:${port}`));
