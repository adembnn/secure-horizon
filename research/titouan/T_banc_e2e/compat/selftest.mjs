// Validation du harnais sur des pages locales a verite terrain connue (controle positif/negatif).
// Usage: node selftest.mjs   -> results-selftest/ + COMPAT_SELFTEST.md
import http from 'node:http';
import { writeFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8777;

const connectJs = `
const out = document.getElementById('out');
document.getElementById('b').addEventListener('click', async () => {
  try { const a = await window.ethereum.request({ method: 'eth_requestAccounts' }); out.textContent = 'Connected 0x1111...1111'; } catch (e) { out.textContent = 'ERR ' + e.message; }
});`;
const btn = '<button id="b" style="padding:12px 24px;font-size:18px">Connect Wallet</button><div id="out"></div>';
const pages = {
  '/ok': { body: `<h1>ok</h1>${btn}<script>${connectJs}</script>` },
  '/csp': { csp: "default-src 'self'; script-src 'self'", body: `<h1>csp</h1>${btn}<script src="/app.js"></script>` },
  '/antiproxy': { body: `<h1>antiproxy</h1>${btn}<script>
    const out = document.getElementById('out');
    document.getElementById('b').addEventListener('click', async () => {
      const s = Function.prototype.toString.call(window.ethereum.request);
      if (/\\[native code\\]/.test(s)) { out.textContent = 'TAMPER DETECTED: provider refused'; return; }
      await window.ethereum.request({ method: 'eth_requestAccounts' }); out.textContent = 'Connected 0x1111...1111'; });</script>` },
  '/wconly': { body: `<h1>walletconnect only</h1><button id="b">Connect Wallet</button><div id="m" role="dialog" style="display:none;position:fixed;top:80px;left:80px;background:#eee;padding:20px">WalletConnect: scan this QR code with your wallet</div>
    <script>document.getElementById('b').onclick=()=>{document.getElementById('m').style.display='block'}</script>` },
  '/eip6963': { body: `<h1>eip6963 only</h1><button id="b">Connect Wallet</button><div id="m" role="dialog" style="display:none;position:fixed;top:80px;left:80px;background:#eee;padding:20px"></div><div id="out"></div>
    <script>const found=[];window.addEventListener('eip6963:announceProvider',e=>{if(!found.find(f=>f.info.uuid===e.detail.info.uuid))found.push(e.detail)});window.dispatchEvent(new Event('eip6963:requestProvider'));
    document.getElementById('b').onclick=()=>{const m=document.getElementById('m');m.style.display='block';m.innerHTML='';for(const f of found){const x=document.createElement('button');x.textContent=f.info.name;x.onclick=async()=>{await f.provider.request({method:'eth_requestAccounts'});document.getElementById('out').textContent='Connected 0x1111...1111'};m.appendChild(x)}}</script>` },
  '/static': { body: '<h1>page statique sans portefeuille</h1><p>rien</p>' },
  '/framehost': { body: '<h1>iframe</h1><iframe src="http://localhost:' + PORT + '/framed" width="400" height="200"></iframe>' },
  '/framed': { body: '<p>frame</p><script>window.ethereum && window.ethereum.request({method:"eth_chainId"})</script>' },
};
const server = http.createServer((req, res) => {
  const u = req.url.split('?')[0];
  if (u === '/app.js') { res.writeHead(200, { 'content-type': 'text/javascript' }); return res.end(connectJs); }
  const p = pages[u]; if (!p) { res.writeHead(404); return res.end('nf'); }
  const h = { 'content-type': 'text/html; charset=utf-8' }; if (p.csp) h['content-security-policy'] = p.csp;
  res.writeHead(200, h); res.end('<!doctype html><meta charset=utf-8><title>' + u + '</title><body style="font-family:sans-serif">' + p.body);
});
await new Promise(r => server.listen(PORT, '127.0.0.1', r));
const sites = ['ok', 'csp', 'antiproxy', 'wconly', 'eip6963', 'static', 'framehost'].map(id => ({ id: 'self-' + id, name: 'selftest ' + id, category: 'Selftest', url: `http://127.0.0.1:${PORT}/${id}` }));
writeFileSync(path.join(HERE, 'selftest-sites.json'), JSON.stringify(sites, null, 1));
const r = await new Promise(res => { const c = spawn(process.execPath, [path.join(HERE, 'run_all.mjs'), '--sites', 'selftest-sites.json', '--out', 'results-selftest', '--rounds', 'A1:control,B:test,A2:control,H:hardened', '--workers', '1', '--gap', '200', '--force'], { stdio: 'inherit' }); c.on('exit', code => res({ status: code })); });
server.close();
const rep = spawnSync(process.execPath, [path.join(HERE, 'report.mjs'), '--sites', 'selftest-sites.json', '--results', 'results-selftest', '--out', 'COMPAT_SELFTEST.md', '--title', 'Auto-test du harnais (pages locales a verite terrain connue)'], { stdio: 'inherit' });
process.exit(r.status || rep.status || 0);
