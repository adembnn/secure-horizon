/* Sentinelle - injecteur (monde MAIN, document_start, toutes frames).
 * Enveloppe les fournisseurs EIP-1193 sur place (Proxy "apply" sur les methodes), retient les
 * demandes sensibles jusqu'a la decision prise par bridge.js (monde isole) via un MessageChannel prive. */
(() => {
  'use strict';
  const W = window;
  // --- references natives capturees avant tout code de la page ---
  const O = Object, R = Reflect, P = Proxy;
  const defProp = O.defineProperty, gopd = O.getOwnPropertyDescriptor, getProto = O.getPrototypeOf;
  const hasOwn = (o, k) => O.prototype.hasOwnProperty.call(o, k);
  const rApply = R.apply, rGet = R.get;
  const JSONs = JSON.stringify, JSONp = JSON.parse;
  const NativePromise = Promise, WM = WeakMap, WS = WeakSet;
  const setT = W.setTimeout.bind(W), clearT = W.clearTimeout.bind(W), setI = W.setInterval.bind(W);
  const postMsg = W.postMessage.bind(W);
  const MC = W.MessageChannel;
  const addL = W.addEventListener.bind(W);
  const origToString = Function.prototype.toString;
  const origDefine = O.defineProperty, origDefineMany = O.defineProperties, origReflectDefine = R.defineProperty;

  // --- masquage : les enveloppes se presentent comme les fonctions d'origine ---
  const masks = new WM();
  const tsProxy = new P(origToString, {
    apply(t, thisArg, args) { const o = masks.get(thisArg); return rApply(t, o !== undefined ? o : thisArg, args); }
  });
  masks.set(tsProxy, origToString);
  const tsDesc = gopd(Function.prototype, 'toString');
  defProp(Function.prototype, 'toString', { value: tsProxy, writable: tsDesc.writable, enumerable: tsDesc.enumerable, configurable: tsDesc.configurable });
  const maskedProxy = (target, handler) => { const p = new P(target, handler); masks.set(p, target); return p; };

  // --- canal prive vers bridge.js ---
  const pending = new Map();
  let port = null, readyResolve, readyFlag = false;
  const ready = new NativePromise((res) => { readyResolve = res; });
  let nextId = 1;
  function connect() {
    let tries = 0;
    const attempt = () => {
      if (readyFlag || tries++ > 60) return;
      const ch = new MC();
      ch.port1.onmessage = (ev) => {
        const d = ev.data;
        if (d && d.t === 'ready') { if (!readyFlag) { readyFlag = true; port = ch.port1; port.onmessage = onPort; readyResolve(); } }
      };
      try { postMsg({ __sentinelle: 'hello' }, '*', [ch.port2]); } catch (_) {}
      setT(attempt, 25);
    };
    attempt();
  }
  function onPort(ev) {
    const d = ev.data; if (!d || !pending.has(d.id)) return;
    const p = pending.get(d.id);
    if (d.t === 'ack') { p.acked = true; return; }
    if (d.t === 'result') { pending.delete(d.id); clearT(p.ackTimer); p.resolve(d); }
  }
  function ask(kind, payload) {
    return new NativePromise((resolve) => {
      const id = nextId++;
      const entry = { resolve, acked: false };
      entry.ackTimer = setT(() => {
        if (!entry.acked && pending.has(id)) { pending.delete(id); resolve({ allow: false, reason: 'bridge-unavailable' }); }
      }, 2500);
      pending.set(id, entry);
      ready.then(() => { try { port.postMessage({ t: kind, id, payload }); } catch (_) { pending.delete(id); resolve({ allow: false, reason: 'bridge-unavailable' }); } });
    });
  }
  function notify(payload) { ready.then(() => { try { port.postMessage({ t: 'notify', id: 0, payload }); } catch (_) {} }); }
  connect();

  // --- methodes surveillees ---
  const GATED = new Set(['eth_sendTransaction', 'eth_signTransaction', 'eth_sign', 'personal_sign',
    'eth_signTypedData', 'eth_signTypedData_v1', 'eth_signTypedData_v3', 'eth_signTypedData_v4',
    'wallet_sendCalls', 'wallet_addEthereumChain', 'wallet_switchEthereumChain',
    'wallet_requestPermissions', 'eth_sendRawTransaction']);
  const JOURNAL = new Set(['eth_requestAccounts']);
  const HEX20 = /^0x[0-9a-fA-F]{40}$/;

  function snap(x) { return JSONp(JSONs(x === undefined ? null : x)); }
  function guessFrom(method, params) {
    try {
      const p = Array.isArray(params) ? params : [];
      if (p[0] && typeof p[0] === 'object' && typeof p[0].from === 'string') return p[0].from;
      for (const v of p) if (typeof v === 'string' && HEX20.test(v)) return v;
    } catch (_) {}
    return null;
  }
  function guessChain(method, params) {
    try {
      const p = Array.isArray(params) ? params : [];
      if (p[0] && typeof p[0] === 'object' && p[0].chainId != null) return String(p[0].chainId);
    } catch (_) {}
    return null;
  }
  async function chainOf(provider, rawRequest, hint) {
    if (hint) return hint;
    try { if (provider && provider.chainId) return String(provider.chainId); } catch (_) {}
    if (typeof rawRequest === 'function') {
      try {
        return await NativePromise.race([rApply(rawRequest, provider, [{ method: 'eth_chainId' }]), new NativePromise((r) => setT(() => r(null), 800))]);
      } catch (_) {}
    }
    return null;
  }
  function rejection(reason) {
    const e = new Error(reason === 'denied' ? 'User rejected the request.' : 'Sentinelle: verification indisponible, demande bloquee (' + reason + ').');
    e.code = reason === 'denied' ? 4001 : 4900; // 4001 = refus utilisateur, 4900 = deconnecte
    return e;
  }
  // Evite la double demande quand un ancien send()/sendAsync() rappelle request() en interne.
  const approvedInflight = new Map();
  const keyOf = (m, p) => { try { return m + '|' + JSONs(p); } catch (_) { return m + '|?'; } };

  async function gate(provider, rawRequest, method, params, entryPoint) {
    const k = keyOf(method, params);
    const n = approvedInflight.get(k) || 0;
    if (n > 0) { approvedInflight.set(k, n - 1); return { allow: true, pass: true }; }
    const chainId = await chainOf(provider, rawRequest, guessChain(method, params));
    let from = guessFrom(method, params);
    if (!from) { try { from = provider.selectedAddress || null; } catch (_) {} }
    const res = await ask('gate', { method, params, chainId, from, entryPoint, topLevel: W === W.top });
    return res;
  }
  function allowOnce(k) { approvedInflight.set(k, (approvedInflight.get(k) || 0) + 1); }
  function fwd(k, fn) {
    let r;
    try { r = fn(); } catch (e) { release(k); throw e; }
    NativePromise.resolve(r).then(() => release(k), () => release(k));
    return r;
  }
  function release(k) { const n = approvedInflight.get(k) || 0; if (n > 0) approvedInflight.set(k, n - 1); }

  // --- enveloppes ---
  function wrapRequest(target) {
    return maskedProxy(target, {
      apply(t, thisArg, args) {
        const a = args[0];
        if (!a || typeof a !== 'object' || typeof a.method !== 'string') return rApply(t, thisArg, args);
        let method, params, full;
        try { method = String(a.method); params = a.params === undefined ? undefined : snap(a.params); full = snap(a); full.method = method; if (params !== undefined) full.params = params; }
        catch (_) { return NativePromise.reject(rejection('params-illisibles')); }
        if (JOURNAL.has(method)) { notify({ method, params, kind: 'journal' }); return rApply(t, thisArg, [full]); }
        if (!GATED.has(method)) return rApply(t, thisArg, args);
        const k = keyOf(method, params);
        return gate(thisArg, t, method, params, 'request').then((r) => {
          if (!r.allow) throw rejection(r.reason || 'denied');
          if (!r.pass) allowOnce(k);
          return fwd(k, () => rApply(t, thisArg, [full]));
        });
      }
    });
  }
  function respErr(id, reason) { return { id, jsonrpc: '2.0', error: { code: reason === 'denied' ? 4001 : 4900, message: rejection(reason).message } }; }

  function wrapSend(target) {
    return maskedProxy(target, {
      apply(t, thisArg, args) {
        const a0 = args[0], a1 = args[1];
        if (typeof a0 === 'string') { // send(method, params) -> Promise
          if (JOURNAL.has(a0)) { notify({ method: a0, kind: 'journal' }); return rApply(t, thisArg, args); }
          if (!GATED.has(a0)) return rApply(t, thisArg, args);
          let params; try { params = a1 === undefined ? undefined : snap(a1); } catch (_) { return NativePromise.reject(rejection('params-illisibles')); }
          const k = keyOf(a0, params);
          return gate(thisArg, null, a0, params, 'send').then((r) => {
            if (!r.allow) throw rejection(r.reason || 'denied');
            if (!r.pass) allowOnce(k);
            return fwd(k, () => rApply(t, thisArg, [a0, params]));
          });
        }
        if (a0 && typeof a0 === 'object' && typeof a1 === 'function') return legacyAsync(t, thisArg, a0, a1, 'send');
        if (a0 && typeof a0 === 'object' && !Array.isArray(a0) && JOURNAL.has(a0.method)) notify({ method: a0.method, kind: 'journal' });
        // send(payload) synchrone sans rappel: impossible a retenir. Les portefeuilles ne le supportent pas pour les signatures.
        if (a0 && typeof a0 === 'object' && !Array.isArray(a0) && GATED.has(a0.method)) {
          const e = new Error('Sentinelle: appel synchrone send(payload) non supporte pour ' + a0.method); e.code = 4900; throw e;
        }
        return rApply(t, thisArg, args);
      }
    });
  }
  function wrapSendAsync(target) {
    return maskedProxy(target, {
      apply(t, thisArg, args) {
        const a0 = args[0], cb = args[1];
        if (a0 && typeof a0 === 'object' && typeof cb === 'function') return legacyAsync(t, thisArg, a0, cb, 'sendAsync');
        return rApply(t, thisArg, args);
      }
    });
  }
  function legacyAsync(t, thisArg, payload, cb, entry) {
    let items, isBatch = Array.isArray(payload);
    try { items = snap(isBatch ? payload : [payload]); } catch (_) { return cb(rejection('params-illisibles'), respErr(null, 'x')); }
    const decisions = items.map((it) => {
      if (!it || typeof it.method !== 'string') return NativePromise.resolve({ allow: true, pass: true, raw: true });
      if (JOURNAL.has(it.method)) { notify({ method: it.method, kind: 'journal' }); return NativePromise.resolve({ allow: true, pass: true, raw: true }); }
      if (!GATED.has(it.method)) return NativePromise.resolve({ allow: true, pass: true, raw: true });
      return gate(thisArg, null, it.method, it.params, entry);
    });
    // decisions sequentielles pour ne pas empiler plusieurs fenetres
    NativePromise.all(decisions).then((rs) => {
      const forward = [], idx = [];
      items.forEach((it, i) => { if (rs[i].allow) { forward.push(it); idx.push(i); } });
      const out = new Array(items.length);
      rs.forEach((r, i) => { if (!r.allow) out[i] = respErr(items[i] && items[i].id, r.reason || 'denied'); });
      if (!forward.length) {
        const firstErr = out.find(Boolean);
        return isBatch ? cb(null, out) : cb(rejection(rs[0].reason || 'denied'), firstErr);
      }
      const keys = forward.map((it) => { const k = keyOf(it.method, it.params); if (!rs[idx[forward.indexOf(it)]].pass) allowOnce(k); return k; });
      const done = (err, resp) => {
        keys.forEach(release);
        if (!isBatch) return cb(err, resp);
        const arr = Array.isArray(resp) ? resp : [];
        idx.forEach((orig, j) => { out[orig] = arr[j] !== undefined ? arr[j] : arr.find((x) => x && forward[j] && x.id === forward[j].id); });
        cb(err, out);
      };
      rApply(t, thisArg, [isBatch ? forward : forward[0], done]);
    });
  }
  function wrapEnable(target) {
    return maskedProxy(target, { apply(t, thisArg, args) { notify({ method: 'eth_requestAccounts', kind: 'journal', via: 'enable' }); return rApply(t, thisArg, args); } });
  }
  const WRAPPERS = { request: wrapRequest, send: wrapSend, sendAsync: wrapSendAsync, enable: wrapEnable };

  // --- patch sur place d'un fournisseur ---
  const wrappedFns = new WS();     // enveloppes deja posees
  const patched = new WM();        // fournisseur brut -> resultat (lui-meme ou proxy de repli)
  const fallbackCache = new WM();
  function patchMethod(provider, name) {
    let owner = provider;
    while (owner && !hasOwn(owner, name)) owner = getProto(owner);
    if (!owner) return true;
    if (owner === O.prototype || owner === Function.prototype) owner = provider;
    const d = gopd(owner, name);
    if (!d) return true;
    if (d.get || d.set) { // accesseur: on enveloppe la valeur retournee
      if (!d.get || !d.configurable) return false;
      const cache = new WM();
      const g = d.get;
      try {
        defProp(owner, name, { get() { const f = rApply(g, this, []); if (typeof f !== 'function') return f; if (wrappedFns.has(f)) return f; let w = cache.get(f); if (!w) { w = WRAPPERS[name](f); wrappedFns.add(w); cache.set(f, w); } return w; }, set: d.set, enumerable: d.enumerable, configurable: true });
        return true;
      } catch (_) { return false; }
    }
    const f = d.value;
    if (typeof f !== 'function' || wrappedFns.has(f)) return true;
    if (!d.writable && !d.configurable) return false;
    const w = WRAPPERS[name](f);
    wrappedFns.add(w);
    try { defProp(owner, name, { value: w, writable: d.writable, enumerable: d.enumerable, configurable: d.configurable }); } catch (_) { return false; }
    return true;
  }
  function fallbackProxy(raw) {
    let px = fallbackCache.get(raw); if (px) return px;
    const cache = new WM();
    const shadow = O.create(raw); // cible vide: evite les invariants des proprietes gelees
    const wrapFn = (k, v) => {
      if (typeof v !== 'function' || !WRAPPERS[k]) return v;
      if (wrappedFns.has(v)) return v;
      let w = cache.get(v); if (!w) { w = WRAPPERS[k](v); cache.set(v, w); } return w;
    };
    px = new P(shadow, {
      get(t, k) { return wrapFn(k, rGet(raw, k, raw)); },
      set(t, k, v) { return R.set(raw, k, v, raw); },
      has(t, k) { return k in raw; },
      ownKeys() { return R.ownKeys(raw); },
      deleteProperty(t, k) { return R.deleteProperty(raw, k); },
      getPrototypeOf() { return getProto(raw); },
      getOwnPropertyDescriptor(t, k) {
        const d = gopd(raw, k); if (!d) return d;
        const c = O.assign({}, d, { configurable: true });
        if ('value' in c) c.value = wrapFn(k, c.value);
        return c;
      }
    });
    fallbackCache.set(raw, px);
    return px;
  }
  function wrapProvider(p) {
    if (!p || (typeof p !== 'object' && typeof p !== 'function')) return p;
    if (patched.has(p)) { try { if (Array.isArray(p.providers)) wrapProviders(p.providers); } catch (_) {} return patched.get(p); }
    let ok = true;
    for (const name of ['request', 'send', 'sendAsync', 'enable']) {
      let has = false; try { has = typeof p[name] === 'function' || name in p; } catch (_) {}
      if (!has) continue;
      let ownerOk = false; try { ownerOk = patchMethod(p, name); } catch (_) { ownerOk = false; }
      if (!ownerOk) ok = false;
    }
    const result = ok ? p : fallbackProxy(p);
    patched.set(p, result);
    try { if (Array.isArray(p.providers)) wrapProviders(p.providers); } catch (_) {}
    return result;
  }
  function wrapProviders(arr) {
    for (let i = 0; i < arr.length; i++) {
      try { const r = wrapProvider(arr[i]); if (r !== arr[i]) arr[i] = r; } catch (_) {}
    }
  }
  function looksLikeProvider(v) {
    return v && (typeof v === 'object' || typeof v === 'function') && (typeof v.request === 'function' || typeof v.send === 'function' || typeof v.sendAsync === 'function');
  }

  // --- window.ethereum : accesseur pour attraper les affectations tardives ---
  let current; let ext = null; let slotInstalled = false;
  const slotGet = function () {
    let v = ext && ext.get ? rApply(ext.get, W, []) : current;
    if (looksLikeProvider(v)) { const r = wrapProvider(v); return r; }
    return v;
  };
  const slotSet = function (v) {
    if (ext && ext.set) { rApply(ext.set, W, [v]); } else current = v;
    if (looksLikeProvider(v)) wrapProvider(v);
  };
  function installSlot() {
    const d = gopd(W, 'ethereum');
    if (d && (d.get === slotGet)) return;
    if (d) { // valeur ou accesseur deja present: on le reprend
      if ('value' in d) current = d.value; else { ext = { get: d.get, set: d.set }; }
      if (!d.configurable) { // impossible de remplacer: on se contente d'envelopper
        try { wrapProvider('value' in d ? d.value : slotGet()); } catch (_) {}
        return;
      }
    }
    try { origDefine(W, 'ethereum', { get: slotGet, set: slotSet, enumerable: true, configurable: true }); slotInstalled = true; } catch (_) {}
    if (looksLikeProvider(current)) wrapProvider(current);
  }
  installSlot();

  // Les portefeuilles qui font Object.defineProperty(window,'ethereum',...) sont rediriges vers notre emplacement.
  function takeOver(desc) {
    if (!desc) return;
    if ('value' in desc) { current = desc.value; ext = null; if (looksLikeProvider(current)) wrapProvider(current); }
    else { ext = { get: desc.get, set: desc.set }; try { const v = slotGet(); void v; } catch (_) {} }
  }
  O.defineProperty = maskedProxy(origDefine, {
    apply(t, thisArg, args) {
      const [o, k, desc] = args;
      if (o === W && k === 'ethereum' && desc && typeof desc === 'object') { installSlot(); takeOver(desc); return o; }
      return rApply(t, thisArg, args);
    }
  });
  R.defineProperty = maskedProxy(origReflectDefine, {
    apply(t, thisArg, args) {
      const [o, k, desc] = args;
      if (o === W && k === 'ethereum' && desc && typeof desc === 'object') { installSlot(); takeOver(desc); return true; }
      return rApply(t, thisArg, args);
    }
  });
  O.defineProperties = maskedProxy(origDefineMany, {
    apply(t, thisArg, args) {
      const [o, props] = args;
      if (o === W && props && typeof props === 'object' && hasOwn(props, 'ethereum')) {
        installSlot(); takeOver(props.ethereum);
        const rest = {}; for (const k of O.keys(props)) if (k !== 'ethereum') rest[k] = props[k];
        return rApply(t, thisArg, [o, rest]);
      }
      return rApply(t, thisArg, args);
    }
  });

  // --- EIP-6963 : on enveloppe chaque fournisseur annonce, avant les ecouteurs de la page ---
  const reannounced = new WS();
  const onAnnounce = (ev) => {
    try {
      if (reannounced.has(ev)) return;
      const d = ev.detail; if (!d || !d.provider) return;
      const r = wrapProvider(d.provider);
      if (r !== d.provider) { // fournisseur non patchable sur place: on remplace l'annonce par un proxy
        ev.stopImmediatePropagation();
        const info = d.info;
        const ne = new CustomEvent('eip6963:announceProvider', { detail: O.freeze({ info, provider: r }) });
        reannounced.add(ne);
        setT(() => W.dispatchEvent(ne), 0);
      }
    } catch (_) {}
  };
  addL('eip6963:announceProvider', onAnnounce, true);

  // --- balayage de rattrapage: delete+reassign, globales proprietaires, web3 legacy ---
  function scan() {
    try {
      addL('eip6963:announceProvider', onAnnounce, true); // document.open() efface les ecouteurs de window: on les repose (sans doublon)
      installSlot();
      const d = gopd(W, 'ethereum');
      if (d && 'value' in d && looksLikeProvider(d.value)) wrapProvider(d.value);
      for (const n of ['okxwallet', 'trustwallet', 'coinbaseWalletExtension', 'rabby', 'BinanceChain', 'tokenpocket', 'bitkeep', 'phantom', 'solflare']) {
        let v; try { v = W[n]; } catch (_) { continue; }
        if (looksLikeProvider(v)) wrapProvider(v);
        else if (v && typeof v === 'object' && looksLikeProvider(v.ethereum)) wrapProvider(v.ethereum);
      }
      let w3; try { w3 = W.web3; } catch (_) {}
      if (w3 && looksLikeProvider(w3.currentProvider)) wrapProvider(w3.currentProvider);
    } catch (_) {}
  }
  let scans = 0;
  const iv = setI(() => { scan(); if (++scans > 200) W.clearInterval(iv); }, 150);
  addL('DOMContentLoaded', scan, true);
  addL('load', scan, true);
})();
