// Capture d'ecran de la fenetre (sans decision automatique) : node tests/screenshot.mjs [lookalike|approve|unknown] > fichier png dans tests/shots/
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { launch } from './cdp.mjs'; import { startMock } from '../mock_engine.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url)); const EXT = path.resolve(HERE, '..');
const web = http.createServer((q, r) => { const u = new URL(q.url, 'http://x').pathname; const f = path.join(HERE, u.startsWith('/lib/') ? u : 'pages' + u); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': f.endsWith('.js') ? 'application/javascript' : 'text/html' }); r.end(fs.readFileSync(f)); }).listen(8899, '127.0.0.1');
const mock = await startMock(8787);
const B = await launch({ browser: 'chrome', extDir: EXT });
fs.mkdirSync(path.join(HERE, 'shots'), { recursive: true });
const ev = async (sid, e) => (await B.cdp.send('Runtime.evaluate', { expression: e, awaitPromise: false, returnByValue: true }, sid)).result.value;
const mk = async (url) => { const { targetId } = await B.cdp.send('Target.createTarget', { url: 'about:blank' }); const { sessionId } = await B.cdp.send('Target.attachToTarget', { targetId, flatten: true }); await B.cdp.send('Page.enable', {}, sessionId); await B.cdp.send('Emulation.setDeviceMetricsOverride', { width: 520, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId); await B.cdp.send('Page.navigate', { url }, sessionId); await new Promise((r) => setTimeout(r, 1200)); return sessionId; };
const opt = await mk(`chrome-extension://${B.extensionId}/options.html`);
const cases = {
  lookalike: { cfg: { arm: 'C', grill: { enabled: false } }, tx: { from: '0xa11ce00000000000000000000000000000000001', to: '0x1234deadbeefdeadbeefdeadbeefdeadbeef5678', value: '0x1' }, host: 'a' },
  approve: { cfg: { arm: 'B', frictionMs: 30000 }, tx: { from: '0xa11ce00000000000000000000000000000000001', to: '0x00000000000000000000000000000000000000aa', data: '0x095ea7b3' + '0'.repeat(24) + 'bad0'.repeat(10) + 'ff'.repeat(32) }, host: 'phish', intent: 'receive' },
  unknown: { cfg: { arm: 'A', timeoutMs: 800 }, tx: { from: '0xa11ce00000000000000000000000000000000001', to: '0x00000000000000000000000000000000000000aa', data: '0x095ea7b3' + '0'.repeat(24) + 'bad0'.repeat(10) + 'ff'.repeat(32) }, host: 'a', mode: { status: 500 } },
  grill: { cfg: { arm: 'A', askIntent: true, grill: { enabled: true, shuffle: false } }, tx: { from: '0xa11ce00000000000000000000000000000000001', to: '0x9999999999999999999999999999999999999999', value: '0x1' }, host: 'a', intentAuto: 'asked' }
};
for (const [name, c] of Object.entries(cases)) {
  await fetch('http://127.0.0.1:8787/_reset', { method: 'POST' }); if (c.mode) await fetch('http://127.0.0.1:8787/_mode', { method: 'POST', body: JSON.stringify(c.mode) });
  const cfg = Object.assign({ testMode: false, auto: null }, c.cfg);
  await ev(opt, `chrome.storage.local.set({cfg:${JSON.stringify(cfg)}, log: []}).then(()=>1)`);
  const p = await mk(`http://${c.host}.localhost:8899/dapp.html`);
  await ev(p, `window.__t.request('eth_sendTransaction', [${JSON.stringify(c.tx)}]); 1`);
  await new Promise((r) => setTimeout(r, name === 'unknown' ? 1800 : 900));
  if (name === 'grill') { /* intention d'abord */ }
  const shot = await B.cdp.send('Page.captureScreenshot', { format: 'png' }, p);
  fs.writeFileSync(path.join(HERE, 'shots', name + '.png'), Buffer.from(shot.data, 'base64'));
  console.log('shot', name);
}
await B.close(); web.close(); await mock.close();
