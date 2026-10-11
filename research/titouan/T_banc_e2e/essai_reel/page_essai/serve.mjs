// Mini serveur statique pour la page d'essai reel. Zero dependance, 127.0.0.1 UNIQUEMENT, port 8788.
// Usage : node serve.mjs      (Ctrl+C pour arreter). Sert uniquement index.html.
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.ESSAI_PORT || 8788);
const srv = http.createServer((req, res) => {
  const url = (req.url || '').split('?')[0];
  if (url === '/' || url === '/index.html') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
    return res.end(readFileSync(join(HERE, 'index.html')));
  }
  res.writeHead(404, { 'content-type': 'text/plain' }); res.end('introuvable');
});
srv.on('error', (e) => { console.error(e.code === 'EADDRINUSE' ? 'Le port ' + PORT + ' est deja utilise.' : e.message); process.exit(1); });
srv.listen(PORT, '127.0.0.1', () => console.log('Page d essai : http://127.0.0.1:' + PORT + '/   (Ctrl+C pour arreter)'));
