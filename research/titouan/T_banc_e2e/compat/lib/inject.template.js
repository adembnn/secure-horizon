// Injecteur SIMULE pour le harnais de compatibilite. Aucun secret, aucune cle: le "portefeuille" repond avec
// une adresse de test et des valeurs fictives; toute demande de signature/transaction est REJETEE (4001).
// Placeholders remplaces par le pilote: __MODE__ (control | test | hardened) et __BIND__ (nom du binding CDP).
(() => {
  'use strict';
  const MODE = '__MODE__';
  const bind = globalThis['__BIND__'];
  try { delete globalThis['__BIND__']; } catch (_) {}
  const isTop = (() => { try { return window.top === window; } catch (_) { return false; } })();
  const send = (o) => { try { if (bind) { o.top = isTop; o.f = String(location.href).slice(0, 90); bind(JSON.stringify(o)); } } catch (_) {} };
  if (Object.prototype.hasOwnProperty.call(window, '__compat_state')) return;

  const ADDR = '0x1111111111111111111111111111111111111111';
  const state = { mode: MODE, reads: 0, sets: 0, overwritten: false, req6963: 0, calls: [], blockedSign: 0,
                  wcalls: 0, wreads: {}, eth: null, extReads: 0, extReq6963: 0 };
  const fromExt = () => { try { return /chrome-extension:\/\//.test(new Error().stack); } catch (_) { return false; } };   // attribue a l'extension (bras ext) les lectures qu'elle fait elle-meme
  Object.defineProperty(window, '__compat_state', { value: state, enumerable: false, configurable: true });

  // ---------- fournisseur EIP-1193 simule ----------
  const listeners = new Map();
  let connected = false;
  const rpcErr = (code, message) => Object.assign(new Error(message), { code });
  const SIGN = new Set(['personal_sign', 'eth_sign', 'eth_signTypedData', 'eth_signTypedData_v3', 'eth_signTypedData_v4',
    'eth_sendTransaction', 'eth_sendRawTransaction', 'eth_signTransaction', 'wallet_sendCalls']);
  const emit = (ev, ...a) => { for (const f of [...(listeners.get(ev) || [])]) { try { f(...a); } catch (_) {} } };
  function route(method) {
    if (SIGN.has(method)) { state.blockedSign++; throw rpcErr(4001, 'User rejected the request.'); }
    switch (method) {
      case 'eth_chainId': return '0x1';
      case 'net_version': return '1';
      case 'eth_accounts': return connected ? [ADDR] : [];
      case 'eth_requestAccounts':
      case 'wallet_requestPermissions':
        connected = true; P.selectedAddress = ADDR;
        setTimeout(() => { emit('accountsChanged', [ADDR]); emit('connect', { chainId: '0x1' }); }, 0);
        return method === 'eth_requestAccounts' ? [ADDR] : [{ parentCapability: 'eth_accounts' }];
      case 'wallet_getPermissions': return connected ? [{ parentCapability: 'eth_accounts' }] : [];
      case 'eth_getBalance': return '0x0';
      case 'eth_blockNumber': return '0x12a05f2';
      case 'eth_gasPrice': return '0x3b9aca00';
      case 'eth_getTransactionCount': return '0x0';
      case 'web3_clientVersion': return 'MetaMask/v12.0.0';
      case 'wallet_switchEthereumChain': case 'wallet_addEthereumChain': return null;
      case 'eth_call': case 'eth_estimateGas': case 'eth_getCode': return '0x';
      case 'eth_getLogs': return [];
      default: throw rpcErr(-32601, 'The method ' + method + ' does not exist / is not available');
    }
  }
  class MockProvider {
    constructor() {
      this.isMetaMask = true; this.chainId = '0x1'; this.networkVersion = '1'; this.selectedAddress = null;
      this._metamask = { isUnlocked: async () => true };
      // fonction ordinaire (pas bind): un vrai request() de portefeuille a un toString qui montre du source, pas [native code]
      const self = this, impl = MockProvider.prototype.request;
      this.request = function request(args) { return impl.call(self, args); };
    }
    request(args) {
      const method = args && args.method;
      if (state.calls.length < 300) state.calls.push(String(method));
      send({ t: 'req', m: String(method) });
      return new Promise((res, rej) => setTimeout(() => { try { res(route(method)); } catch (e) { rej(e); } }, 5));
    }
    on(ev, f) { if (!listeners.has(ev)) listeners.set(ev, new Set()); listeners.get(ev).add(f); return this; }
    addListener(ev, f) { return this.on(ev, f); }
    once(ev, f) { const g = (...a) => { this.removeListener(ev, g); f(...a); }; return this.on(ev, g); }
    off(ev, f) { const s = listeners.get(ev); if (s) s.delete(f); return this; }
    removeListener(ev, f) { return this.off(ev, f); }
    removeAllListeners(ev) { if (ev) listeners.delete(ev); else listeners.clear(); return this; }
    emit(ev, ...a) { emit(ev, ...a); return true; }
    isConnected() { return true; }
    enable() { return this.request({ method: 'eth_requestAccounts' }); }
    send(m, p) { if (typeof m === 'string') return this.request({ method: m, params: p }); return this.request(m); }
    sendAsync(payload, cb) { this.request(payload).then(r => cb(null, { id: payload.id, jsonrpc: '2.0', result: r }), e => cb(e)); }
  }
  const P = new MockProvider();

  // ---------- enveloppe transparente qui journalise (bras test) ----------
  let ethObj = P;
  if (MODE === 'test' || MODE === 'hardened') {
    const fnCache = new WeakMap();
    const origOf = new WeakMap();
    const wrapFn = (fn, target, key) => {
      if (fnCache.has(fn)) return fnCache.get(fn);
      const pf = new Proxy(fn, {
        apply(f, thisArg, args) {
          state.wcalls++;
          if (key === 'request') send({ t: 'wreq', m: String(args[0] && args[0].method) });
          const r = Reflect.apply(f, thisArg === wrapped ? target : thisArg, args);
          return r === target ? wrapped : r;           // "return this" ne doit pas fuir l'objet brut
        }
      });
      fnCache.set(fn, pf); origOf.set(pf, fn);
      return pf;
    };
    const wrapped = new Proxy(P, {
      get(t, k) {
        if (typeof k === 'string') state.wreads[k] = (state.wreads[k] || 0) + 1;
        const v = Reflect.get(t, k, t);
        return typeof v === 'function' ? wrapFn(v, t, k) : v;
      },
      set(t, k, v) { return Reflect.set(t, k, v, t); }
    });
    ethObj = wrapped;
    if (MODE === 'hardened') {
      // correctif: Function.prototype.toString doit rendre le source de la fonction d'origine pour nos proxys
      const nativeToString = Function.prototype.toString;
      const patched = new Proxy(nativeToString, {
        apply(f, thisArg, args) { return Reflect.apply(f, origOf.get(thisArg) || (thisArg === patched ? nativeToString : thisArg), args); }
      });
      Object.defineProperty(Function.prototype, 'toString', { value: patched, writable: true, configurable: true, enumerable: false });
    }
  }
  state.eth = ethObj;

  // ---------- window.ethereum (accesseur compte-lectures, identique dans les deux bras) ----------
  let holder = ethObj;
  Object.defineProperty(window, 'ethereum', {
    configurable: true, enumerable: true,
    get() { if (fromExt()) { state.extReads++; return holder; } state.reads++; if (state.reads === 1) send({ t: 'read1' }); return holder; },
    set(v) { state.sets++; if (v !== ethObj) state.overwritten = true; holder = v; }
  });

  // ---------- EIP-6963 ----------
  const info = Object.freeze({
    uuid: '350670db-19fa-4704-a166-e52e178b59d2', name: 'MetaMask', rdns: 'io.metamask',
    icon: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#f6851b"/></svg>')
  });
  const announce = () => { try { window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail: Object.freeze({ info, provider: ethObj }) })); } catch (_) {} };
  window.addEventListener('eip6963:requestProvider', () => { if (fromExt()) { state.extReq6963++; announce(); return; } state.req6963++; if (state.req6963 === 1) send({ t: 'req6963' }); announce(); });
  announce();
  try { window.dispatchEvent(new Event('ethereum#initialized')); } catch (_) {}
  send({ t: 'frame' });
})();
