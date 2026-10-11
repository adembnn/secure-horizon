// Harnais commun : charge extension/inject.js tel quel dans un contexte vm minimal (fenetre factice) et simule bridge.js par un vrai MessageChannel.
// Aucun navigateur. Le "pont" factice compte les demandes de decision (gate) et repond selon une politique.
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
export const INJECT = join(HERE, '..', '..', 'extension', 'inject.js');

export async function makeWindow({ decide = () => ({ allow: true }), src = INJECT } = {}) {
  const gates = [];
  const sandbox = { console, MessageChannel, setTimeout, clearTimeout, setInterval, clearInterval, CustomEvent: class { constructor(t, o) { this.type = t; this.detail = o && o.detail; } }, queueMicrotask };
  const ctx = vm.createContext(sandbox);
  const listeners = [];
  sandbox.addEventListener = (t, f) => listeners.push([t, f]);
  sandbox.dispatchEvent = () => true;
  sandbox.postMessage = (msg, _target, transfer) => {   // fait office de bridge.js : accepte le "hello" et branche le port
    if (msg && msg.__sentinelle === 'hello' && transfer && transfer[0] && !sandbox.__port) {
      const port = sandbox.__port = transfer[0];
      port.onmessage = (ev) => {
        const m = ev.data;
        if (m.t === 'gate') { port.postMessage({ t: 'ack', id: m.id }); gates.push(m.payload); Promise.resolve(decide(m.payload)).then((r) => port.postMessage({ t: 'result', id: m.id, allow: !!r.allow, reason: r.reason || (r.allow ? '' : 'denied') })); }
      };
      port.postMessage({ t: 'ready' });
    }
  };
  vm.runInContext('globalThis.window = globalThis; globalThis.top = globalThis;', ctx);
  vm.runInContext(readFileSync(src, 'utf8'), ctx, { filename: 'inject.js' });
  await new Promise((r) => setTimeout(r, 120));   // laisse la poignee de main se faire
  const run = (code) => vm.runInContext(code, ctx);
  return { ctx, sandbox, run, gates, close() { try { sandbox.__port.close(); } catch {} } };
}
export const TX = { from: '0x' + 'a'.repeat(40), to: '0x' + 'b'.repeat(40), value: '0x1', data: '0x' };
