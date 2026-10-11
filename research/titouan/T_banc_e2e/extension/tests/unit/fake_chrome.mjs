// Fake chrome.* for the node-level tests of the service worker (no browser). Storage areas clone what they store,
// like the real ones, so a record only survives through what was actually written.
// A "worker restart" is : drop every listener and every in-memory object, keep the two storage areas and the alarms.
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
// Directory under test : extension/ by default, or a built copy (HOLDUP_DIR=.../extension_standalone/extension).
export const DIR = process.env.HOLDUP_DIR ? resolve(process.env.HOLDUP_DIR) : resolve(HERE, '..', '..');
export const load = (file) => import(pathToFileURL(join(DIR, file)).href);
export const EXT_ID = 'holdupfakeextensionid';
export const EXT_URL = 'chrome-extension://' + EXT_ID + '/';

const clone = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
function area(data) {
  return {
    get: async (k) => {
      if (k == null) return clone(data);
      const out = {};
      for (const key of (Array.isArray(k) ? k : [k])) if (key in data) out[key] = clone(data[key]);
      return out;
    },
    set: async (o) => { for (const key of Object.keys(o)) data[key] = clone(o[key]); },
    remove: async (k) => { for (const key of (Array.isArray(k) ? k : [k])) delete data[key]; }
  };
}

export function makeChrome({ session = true, alarms = true } = {}) {
  const S = { local: {}, session: {}, windows: new Map(), alarms: new Map(), tabMessages: [], runtimeMessages: [], order: [], failWindow: false, nextWindow: 100 };
  let L;
  const reset = () => { L = { message: [], alarm: [], windowRemoved: [], tabRemoved: [], startup: [] }; };
  reset();
  const ev = (name) => ({ addListener: (fn) => { L[name].push(fn); } });
  const chrome = {
    runtime: { id: EXT_ID, getURL: (p) => EXT_URL + p, onMessage: ev('message'), onStartup: ev('startup'), sendMessage: async (m) => { S.runtimeMessages.push(m); } },
    storage: { local: area(S.local) },
    windows: {
      create: async (o) => {
        if (S.failWindow) throw new Error('fenetre refusee (test)');
        const id = S.nextWindow++; S.windows.set(id, clone(o)); S.order.push('window:' + id);
        return { id };
      },
      get: async (id) => { if (!S.windows.has(id)) throw new Error('No window with id: ' + id); return { id, left: 40, top: 20, width: 1200, height: 800 }; },
      remove: async (id) => { if (!S.windows.delete(id)) throw new Error('No window with id: ' + id); for (const fn of L.windowRemoved.slice()) fn(id); },
      onRemoved: ev('windowRemoved')
    },
    tabs: { sendMessage: async (tabId, msg, opts) => { S.tabMessages.push({ tabId, msg, frameId: opts && opts.frameId }); }, onRemoved: ev('tabRemoved') }
  };
  if (session) chrome.storage.session = area(S.session);
  if (alarms) chrome.alarms = { create: (name, o) => { S.alarms.set(name, clone(o)); }, clear: async (name) => S.alarms.delete(name), onAlarm: ev('alarm') };

  // Delivers a runtime message to the worker and resolves with its answer (undefined if nobody answers).
  function send(msg, sender) {
    return new Promise((res) => {
      let async = false;
      for (const fn of L.message) if (fn(clone(msg), sender, res) === true) async = true;
      if (!async) res(undefined);
    });
  }
  const tick = () => new Promise((r) => setTimeout(r, 5));
  return {
    chrome, state: S, send, tick,
    // senders, as the browser builds them
    page: (tabId, origin, frameId = 0, url) => ({ id: EXT_ID, origin, url: url || origin + '/', frameId, tab: { id: tabId, windowId: 1 } }),
    win: (windowId, rid) => ({ id: EXT_ID, origin: EXT_URL.slice(0, -1), url: EXT_URL + 'window.html#' + rid, frameId: 0, tab: { id: 9000 + windowId, windowId } }),
    userClosesWindow: async (id) => { S.windows.delete(id); for (const fn of L.windowRemoved.slice()) fn(id); await tick(); },
    closeTab: async (tabId) => { for (const fn of L.tabRemoved.slice()) fn(tabId); await tick(); },
    fireAlarm: async (name) => { for (const fn of L.alarm.slice()) fn({ name }); await tick(); },
    killWorker: () => { reset(); }
  };
}

// Controllable clock : Date.now() is what the worker code reads.
export function fakeClock(start = 1760000000000) {
  const real = Date.now; let t = start;
  Date.now = () => t;
  return { now: () => t, advance: (ms) => { t += ms; }, restore: () => { Date.now = real; } };
}
