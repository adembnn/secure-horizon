// Client CDP brut (WebSocket natif Node) + lancement de Chrome headless=new avec profil temporaire.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import path from 'node:path';

export const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export class Conn {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map(); this.handlers = new Set(); this.closed = false;
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id) { const p = this.pending.get(m.id); if (p) { this.pending.delete(m.id); m.error ? p.rej(new Error(m.error.message + ' (' + p.method + ')')) : p.res(m.result); } }
      else for (const h of this.handlers) { try { h(m); } catch (_) {} }
    });
    ws.addEventListener('close', () => { this.closed = true; for (const p of this.pending.values()) p.rej(new Error('connexion fermee')); this.pending.clear(); });
  }
  static connect(url) {
    return new Promise((res, rej) => { const ws = new WebSocket(url); ws.addEventListener('open', () => res(new Conn(ws))); ws.addEventListener('error', () => rej(new Error('ws error'))); });
  }
  send(method, params = {}, sessionId, timeout = 30000) {
    const id = ++this.id; const msg = { id, method, params }; if (sessionId) msg.sessionId = sessionId;
    return new Promise((res, rej) => {
      const t = setTimeout(() => { this.pending.delete(id); rej(new Error('timeout ' + method)); }, timeout);
      this.pending.set(id, { method, res: (v) => { clearTimeout(t); res(v); }, rej: (e) => { clearTimeout(t); rej(e); } });
      try { this.ws.send(JSON.stringify(msg)); } catch (e) { clearTimeout(t); this.pending.delete(id); rej(e); }
    });
  }
  on(h) { this.handlers.add(h); return () => this.handlers.delete(h); }
}

export class ChromeInstance {
  static async launch(baseTmp) {
    mkdirSync(baseTmp, { recursive: true });
    const dir = mkdtempSync(path.join(baseTmp, 'prof-'));
    const port = 9300 + Math.floor(Math.random() * 600);
    const args = ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check',
      '--disable-extensions', '--disable-background-networking', '--disable-component-update', '--mute-audio', '--window-size=1366,900',
      '--disable-sync', '--disable-default-apps', '--password-store=basic', '--use-mock-keychain', 'about:blank'];
    const proc = spawn(CHROME, args, { stdio: 'ignore', windowsHide: true });
    let info = null;
    for (let i = 0; i < 60 && !info; i++) {
      await sleep(500);
      try { info = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch (_) {}
    }
    if (!info) { proc.kill(); throw new Error('Chrome ne demarre pas'); }
    const conn = await Conn.connect(info.webSocketDebuggerUrl);
    await conn.send('Target.setDiscoverTargets', { discover: true });
    return new ChromeInstance(proc, dir, conn, info);
  }
  constructor(proc, dir, conn, info) { this.proc = proc; this.dir = dir; this.conn = conn; this.info = info; this.visits = 0; }
  async close() {
    try { await this.conn.send('Browser.close', {}, undefined, 4000); } catch (_) {}
    try { this.proc.kill(); } catch (_) {}
    await sleep(800);
    for (let i = 0; i < 5; i++) { try { rmSync(this.dir, { recursive: true, force: true }); break; } catch (_) { await sleep(700); } }
  }
}
