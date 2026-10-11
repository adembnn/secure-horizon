// Shared by the securite_*.test.mjs files : inject.js (MAIN world) in a node:vm context with a fake bridge.js that speaks the real protocol
// (private MessageChannel, random token in "ready", the token on every message). Not a test file itself.
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIR } from './fake_chrome.mjs';

export const SRC = readFileSync(join(DIR, 'inject.js'), 'utf8');
export const TOKEN = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const cleanups = [];
export const cleanAll = () => { while (cleanups.length) { try { cleanups.pop()(); } catch (_) {} } };

// token : the token the fake bridge gives (null = a "ready" without token, as an old or forged bridge would). decide(payload) -> bool | promise of bool.
export function page({ decide = () => true, bridge = true, before = '', token = TOKEN } = {}) {
  let cur = token; const gates = [], notes = [], listeners = {}, timers = new Set(), ports = [];
  const sb = {
    console,
    setTimeout: (f, ms, ...a) => { const t = setTimeout(f, ms, ...a); timers.add(t); return t; },
    clearTimeout: (t) => clearTimeout(t),
    setInterval: (f, ms) => { const t = setInterval(f, ms); timers.add(t); return t; },
    clearInterval: (t) => clearInterval(t),
    MessageChannel: class { constructor() { const c = new MessageChannel(); ports.push(c.port1, c.port2); this.port1 = c.port1; this.port2 = c.port2; } },
    addEventListener: (type, fn) => { (listeners[type] = listeners[type] || new Set()).add(fn); },
    dispatchEvent: (ev) => { for (const fn of [...(listeners[ev.type] || [])]) { if (ev._stopped) break; fn(ev); } return true; },
    postMessage: (data, origin, transfer) => {
      if (!bridge || !data || data.__sentinelle !== 'hello' || !transfer || !transfer[0]) return;
      const port = transfer[0];
      if (sb._port && !data.re) return;
      if (data.re && token !== null) cur = token + 'r' + ((sb.reconnects || 0) + 1); sb._port = port; sb.reconnects = (sb.reconnects || 0) + (data.re ? 1 : 0);
      port.onmessage = async (ev) => {
        const m = ev.data;
        if (m.t === 'notify') { if (token === null || m.k === cur) notes.push(m.payload); return; }
        if (m.t !== 'gate') return;
        if (token !== null && m.k !== cur) return; // the page side must echo the token
        port.postMessage({ t: 'ack', id: m.id, k: cur });
        gates.push(m.payload);
        let allow = false; try { allow = !!(await decide(m.payload)); } catch (_) {}
        port.postMessage({ t: 'result', id: m.id, k: cur, allow, reason: allow ? '' : 'denied' });
      };
      port.postMessage(token === null ? { t: 'ready' } : { t: 'ready', k: cur });
    }
  };
  sb.window = sb; sb.top = sb; sb.self = sb; sb.globalThis = sb;
  const ctx = vm.createContext(sb);
  vm.runInContext('class CustomEvent { constructor(type, init) { this.type = type; this.detail = init && init.detail; } stopImmediatePropagation() { this._stopped = true; } }; globalThis.CustomEvent = CustomEvent;', ctx);
  if (before) vm.runInContext(before, ctx);
  vm.runInContext(SRC, ctx, { filename: 'inject.js' });
  cleanups.push(() => { for (const t of timers) { clearTimeout(t); clearInterval(t); } for (const p of ports) { try { p.close(); } catch (_) {} } });
  return { gates, notes, ports, run: (code) => vm.runInContext(code, ctx), ctx: sb };
}
export const WALLET = `
  class Wallet {
    constructor() { this.calls = []; this.chainId = '0x7a69'; this.selectedAddress = '0x' + 'a1'.repeat(20); this.request = this.request.bind(this); }
    async request(a) { this.calls.push(a); return a.method === 'eth_chainId' ? this.chainId : 'result:' + a.method; }
    send(m, p) { return typeof m === 'string' ? this.request({ method: m, params: p }) : this.sendAsync(m, p); }
    sendAsync(payload, cb) { this.request(payload).then((r) => cb(null, { id: payload.id, jsonrpc: '2.0', result: r }), (e) => cb(e)); }
    enable() { return this.request({ method: 'eth_requestAccounts' }); }
  }`;
export const TXP = `[{ from: '0x' + 'a1'.repeat(20), to: '0x' + 'b2'.repeat(20), value: '0x1' }]`;
// Runs page code and stores the outcome in the page (the host never awaits a page promise : that would call the page's own Promise.prototype.then).
// Originals are saved BEFORE any pollution by installRunner().
export const RUNNER = `
  globalThis.__out = Object.create(null);
  { const call = Function.prototype.call, T = call.bind(Promise.prototype.then), R = call.bind(Promise.resolve);
    globalThis.__go = (name, fn) => { __out[name] = { pending: true };
      let p; try { p = fn(); } catch (e) { __out[name] = { ok: false, error: e }; return; }
      T(R(Promise, p), (v) => { __out[name] = { ok: true, value: v }; }, (e) => { __out[name] = { ok: false, error: e }; }); }; }`;
export const wallet_calls = `ethereum.calls.filter((c) => c.method !== 'eth_chainId').length`;
