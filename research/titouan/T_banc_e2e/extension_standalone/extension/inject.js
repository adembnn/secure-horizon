/* Hold up - injecteur (monde MAIN, document_start, toutes frames).
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
    if (d.t === 'rpc') { serveRead(d, p); return; }
    if (d.t === 'result') { pending.delete(d.id); clearT(p.ackTimer); p.resolve(d); }
  }
  // While a request is held, the service worker may ask for READS on the node of the wallet it came through (dry run of that
  // very request : effect_sim.js). Only these two read-only methods, only for a request still waiting, only through its provider.
  const READS = new Set(['debug_traceCall', 'eth_call']);
  function serveRead(d, p) {
    const reply = (ok, result) => { try { port.postMessage({ t: 'rpcResult', id: d.id, n: d.n, ok, result }); } catch (_) { try { port.postMessage({ t: 'rpcResult', id: d.id, n: d.n, ok: false }); } catch (__) {} } };
    let call;
    try {
      const c = p.ctx;
      const fn = !c ? null : typeof c.rawRequest === 'function' ? c.rawRequest : c.provider && typeof c.provider.request === 'function' ? c.provider.request : null;
      if (!fn || typeof d.method !== 'string' || !READS.has(d.method)) return reply(false);
      call = rApply(fn, c.provider, [{ method: d.method, params: snap(d.params) }]);
    } catch (_) { return reply(false); }
    NativePromise.resolve(call).then((r) => { let out; try { out = snap(r); } catch (_) { return reply(false); } reply(true, out); }, () => reply(false));
  }
  function ask(kind, payload, ctx) {
    return new NativePromise((resolve) => {
      const id = nextId++;
      const entry = { resolve, acked: false, ctx: ctx || null };
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
    'wallet_sendCalls', 'eth_sendRawTransaction',
    // connexion (eth_requestAccounts, wallet_requestPermissions), lectures et changement de reseau (wallet_switchEthereumChain,
    // wallet_addEthereumChain) ne deplacent rien et n'accordent aucun droit de depense : ils passent directement, sans fenetre.
    // droits durables et dechiffrement : non decodes par le moteur, donc ecran "Non verifie" plutot que passage silencieux
    'wallet_grantPermissions', 'wallet_requestSnaps', 'eth_decrypt', 'eth_getEncryptionPublicKey', 'eth_sendUserOperation', 'eth_signUserOperation']);
  const JOURNAL = new Set(['eth_requestAccounts']);
  const HEX20 = /^0x[0-9a-fA-F]{40}$/;

  // Inert deep copy, frozen : what is judged is exactly what is forwarded.
  const freeze = O.freeze, isArr = Array.isArray, keysOf = O.keys;
  function deepFreeze(x) { if (x && typeof x === 'object') { const ks = keysOf(x); for (let i = 0; i < ks.length; i++) deepFreeze(x[ks[i]]); freeze(x); } return x; }
  function snap(x) { return JSONp(JSONs(x === undefined ? null : x)); }
  function thaw(x) { return JSONp(JSONs(x)); } // fresh mutable copy for the wallet (some wallets normalise the object in place)
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
    const e = new Error(reason === 'denied' ? 'User rejected the request.' : 'Hold up: verification indisponible, demande bloquee (' + reason + ').');
    e.code = reason === 'denied' ? 4001 : 4900; // 4001 = refus utilisateur, 4900 = deconnecte
    return e;
  }
  // Avoids a second window when a wrapped method of a wallet calls another wrapped one (legacy send() -> request(),
  // instance method -> prototype method). A pass is one-shot and bound to the provider, its chain, the content that was
  // approved AND the very objects forwarded to the wallet (fresh copies the page never receives). The same request sent
  // again by the page while the wallet popup is open carries other objects : it is gated again. A pass is honoured only
  // while our own forwarding call is on the stack (synchronous delegation) : an object the page managed to capture later is worthless.
  // A wallet that delegates asynchronously to another wrapped method is simply asked twice (fail closed).
  const passes = new WM(); // provider -> WeakMap(forwarded object -> key)
  const NOPROV = {};
  let forwarding = 0;
  const provKey = (prov) => (prov && (typeof prov === 'object' || typeof prov === 'function') ? prov : NOPROV);
  const chainTag = (prov) => { try { const c = prov && prov.chainId; return c == null ? '' : String(c); } catch (_) { return ''; } };
  const keyOf = (prov, m, p) => { try { return chainTag(prov) + '|' + m + '|' + JSONs(p === undefined ? null : p); } catch (_) { return null; } };
  const isObj = (x) => !!x && (typeof x === 'object' || typeof x === 'function');
  function grant(prov, k, objs) {
    if (k === null) return () => {};
    const o = provKey(prov); let m = passes.get(o); if (!m) { m = new WM(); passes.set(o, m); }
    const mine = []; for (const x of objs) if (isObj(x)) { m.set(x, k); mine.push(x); }
    return () => { for (const x of mine) if (m.get(x) === k) m.delete(x); };
  }
  function takePass(prov, obj, k) {
    if (forwarding <= 0 || !isObj(obj) || k === null) return false;
    const m = passes.get(provKey(prov));
    if (!m || m.get(obj) !== k) return false;
    m.delete(obj);
    return true;
  }
  // Forwards with a pass that dies as soon as the wallet has answered (or thrown).
  function fwd(prov, k, objs, fn) {
    const revoke = grant(prov, k, objs);
    let r;
    forwarding++;
    try { r = fn(); } catch (e) { revoke(); throw e; } finally { forwarding--; }
    NativePromise.resolve(r).then(revoke, revoke);
    return r;
  }

  // Request limited by Hold up (Q17) : the worker answers with the params to forward, only for a transaction or a batch of calls.
  function limited(r, method) {
    if (!r || !isArr(r.params) || (method !== 'eth_sendTransaction' && method !== 'wallet_sendCalls')) return undefined;
    try { return snap(r.params); } catch (_) { return undefined; }
  }
  async function gate(provider, rawRequest, method, params, entryPoint) {
    const chainId = await chainOf(provider, rawRequest, guessChain(method, params));
    let from = guessFrom(method, params);
    if (!from) { try { from = provider.selectedAddress || null; } catch (_) {} }
    return ask('gate', { method, params, chainId, from, entryPoint, topLevel: W === W.top }, { provider, rawRequest });
  }

  // --- enveloppes ---
  function wrapRequest(target) {
    return maskedProxy(target, {
      apply(t, thisArg, args) {
        const a = args[0];
        if (!a || (typeof a !== 'object' && typeof a !== 'function')) return rApply(t, thisArg, args);
        // L'objet de la page n'est lu qu'UNE fois (un getter ou un Proxy sur "method" peut mentir d'une lecture a l'autre) :
        // la decision ET la transmission au portefeuille se font sur la meme copie inerte.
        let full;
        try { full = deepFreeze(snap(a)); } catch (_) { return NativePromise.reject(rejection('params-illisibles')); }
        if (isArr(full)) { // request([...]) is not EIP-1193 : a batch that carries a gated method is refused, never forwarded blind
          for (let i = 0; i < full.length; i++) if (full[i] && typeof full[i] === 'object' && GATED.has(full[i].method)) return NativePromise.reject(rejection('lot-non-supporte'));
          return rApply(t, thisArg, [thaw(full)]);
        }
        if (!full || typeof full !== 'object' || typeof full.method !== 'string') return rApply(t, thisArg, [thaw(full)]);
        const method = full.method, params = full.params;
        if (JOURNAL.has(method)) { notify({ method, params, kind: 'journal' }); return rApply(t, thisArg, [thaw(full)]); }
        if (!GATED.has(method)) return rApply(t, thisArg, [thaw(full)]);
        const k = keyOf(thisArg, method, params);
        // Internal call of the wallet with an object we forwarded ourselves : same content, same provider, once.
        let ap; try { ap = a.params; } catch (_) {}
        if (takePass(thisArg, a, k) || takePass(thisArg, ap, k)) return rApply(t, thisArg, [thaw(full)]);
        return gate(thisArg, t, method, params, 'request').then((r) => {
          if (!r.allow) throw rejection(r.reason || 'denied');
          const out = thaw(full);
          const lim = limited(r, method); if (lim !== undefined) out.params = lim;
          return fwd(thisArg, keyOf(thisArg, method, out.params), [out, out.params], () => rApply(t, thisArg, [out]));
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
          return gate(thisArg, null, a0, params, 'send').then((r) => {
            if (!r.allow) throw rejection(r.reason || 'denied');
            const lim = limited(r, a0), p2 = lim !== undefined ? lim : params;
            return fwd(thisArg, keyOf(thisArg, a0, p2), [p2], () => rApply(t, thisArg, [a0, p2]));
          });
        }
        if (a0 && typeof a0 === 'object' && typeof a1 === 'function') return legacyAsync(t, thisArg, a0, a1, 'send');
        // send(payload) synchrone sans rappel: impossible a retenir. Les portefeuilles ne le supportent pas pour les signatures.
        // Meme regle que request() : une seule lecture, decision et transmission sur la copie (objet seul ou lot).
        if (a0 && (typeof a0 === 'object' || typeof a0 === 'function')) {
          let s; try { s = snap(a0); } catch (_) { throw rejection('params-illisibles'); }
          for (const it of (Array.isArray(s) ? s : [s])) {
            if (!it || typeof it !== 'object') continue;
            if (JOURNAL.has(it.method)) notify({ method: it.method, kind: 'journal' });
            if (GATED.has(it.method)) { const e = new Error('Hold up: appel synchrone send(payload) non supporte pour ' + it.method); e.code = 4900; throw e; }
          }
          return rApply(t, thisArg, [s]);
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
    const decisions = items.map((it, i) => {
      if (!it || typeof it.method !== 'string') return NativePromise.resolve({ allow: true });
      if (JOURNAL.has(it.method)) { notify({ method: it.method, kind: 'journal' }); return NativePromise.resolve({ allow: true }); }
      if (!GATED.has(it.method)) return NativePromise.resolve({ allow: true });
      // internal call of the wallet (send(payload, cb) -> sendAsync(payload, cb)) with an object we forwarded
      let orig, op; try { orig = isBatch ? payload[i] : payload; op = orig && orig.params; } catch (_) {}
      const k = keyOf(thisArg, it.method, it.params);
      if (takePass(thisArg, orig, k) || takePass(thisArg, op, k)) return NativePromise.resolve({ allow: true });
      return gate(thisArg, null, it.method, it.params, entry);
    });
    // decisions sequentielles pour ne pas empiler plusieurs fenetres
    NativePromise.all(decisions).then((rs) => {
      const forward = [], idx = [];
      items.forEach((it, i) => { if (rs[i].allow) { const lim = it && limited(rs[i], it.method); forward.push(lim !== undefined ? Object.assign({}, it, { params: lim }) : it); idx.push(i); } });
      const out = new Array(items.length);
      rs.forEach((r, i) => { if (!r.allow) out[i] = respErr(items[i] && items[i].id, r.reason || 'denied'); });
      if (!forward.length) {
        const firstErr = out.find(Boolean);
        return isBatch ? cb(null, out) : cb(rejection(rs[0].reason || 'denied'), firstErr);
      }
      const revokes = forward.map((it) => (it && GATED.has(it.method) ? grant(thisArg, keyOf(thisArg, it.method, it.params), [it, it.params]) : null));
      const done = (err, resp) => {
        revokes.forEach((rv) => { if (rv) rv(); });
        if (!isBatch) return cb(err, resp);
        const arr = Array.isArray(resp) ? resp : [];
        idx.forEach((orig, j) => { out[orig] = arr[j] !== undefined ? arr[j] : arr.find((x) => x && forward[j] && x.id === forward[j].id); });
        cb(err, out);
      };
      forwarding++;
      try { rApply(t, thisArg, [isBatch ? forward : forward[0], done]); } catch (e) { forwarding--; revokes.forEach((rv) => { if (rv) rv(); }); cb(e, respErr(null, 'x')); return; }
      forwarding--;
    }, () => cb(rejection('bridge-unavailable'), respErr(null, 'x')));
  }
  function wrapEnable(target) {
    return maskedProxy(target, { apply(t, thisArg, args) { notify({ method: 'eth_requestAccounts', kind: 'journal', via: 'enable' }); return rApply(t, thisArg, args); } });
  }
  const WRAPPERS = { request: wrapRequest, send: wrapSend, sendAsync: wrapSendAsync, enable: wrapEnable };

  // --- patch sur place d'un fournisseur ---
  const wrappedFns = new WS();     // enveloppes deja posees
  const patchedGetters = new WS(); // accesseurs deja remplaces
  const patched = new WM();        // fournisseur brut -> resultat (lui-meme ou proxy de repli)
  const fallbackCache = new WM();
  // Wraps the method on ONE owner. true = wrapped (or nothing to wrap), false = this owner cannot be patched.
  function patchOwn(owner, name) {
    const d = gopd(owner, name);
    if (!d) return true;
    if (d.get || d.set) { // accessor : the returned value is wrapped
      if (d.get && patchedGetters.has(d.get)) return true;
      if (!d.get || !d.configurable) return false;
      const cache = new WM();
      const g = d.get;
      const get = function () { const f = rApply(g, this, []); if (typeof f !== 'function') return f; if (wrappedFns.has(f)) return f; let w = cache.get(f); if (!w) { w = WRAPPERS[name](f); wrappedFns.add(w); cache.set(f, w); } return w; };
      patchedGetters.add(get);
      try { defProp(owner, name, { get, set: d.set, enumerable: d.enumerable, configurable: true }); return true; } catch (_) { return false; }
    }
    const f = d.value;
    if (typeof f !== 'function' || wrappedFns.has(f)) return true;
    if (!d.writable && !d.configurable) return false;
    const w = WRAPPERS[name](f);
    wrappedFns.add(w);
    try { defProp(owner, name, { value: w, writable: d.writable, enumerable: d.enumerable, configurable: d.configurable }); } catch (_) { return false; }
    return true;
  }
  // Every owner of the method is wrapped, from the instance up the whole prototype chain : a wallet that rebinds
  // request on the instance keeps a second copy on its prototype, reachable with getPrototypeOf(provider).request.call(provider, ...).
  // Idempotent (wrappedFns). The credit of gate() avoids a second window when the outer wrapper calls the inner one.
  function patchMethod(provider, name) {
    let ok = true, depth = 0;
    for (let o = provider; o && o !== O.prototype && o !== Function.prototype && depth < 32; o = getProto(o), depth++) {
      let own = false; try { own = hasOwn(o, name); } catch (_) {}
      if (!own) continue;
      let done = false; try { done = patchOwn(o, name); } catch (_) { done = false; }
      if (!done) ok = false;
    }
    return ok;
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
      const r = rApply(t, thisArg, args);
      // other provider globals (window.avalanche of Core, ...) : wrapped in place as soon as they are defined
      if (o === W && typeof k === 'string' && GLOBALS.has(k)) { try { scanGlobal(k); } catch (_) {} }
      return r;
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

  // --- provider globals other than window.ethereum. 'avalanche' is Core, the Avalanche wallet. ---
  const GLOBAL_NAMES = ['avalanche', 'core', 'okxwallet', 'trustwallet', 'coinbaseWalletExtension', 'rabby', 'BinanceChain', 'tokenpocket', 'bitkeep', 'phantom', 'solflare', 'evmproviders'];
  const GLOBALS = new Set(GLOBAL_NAMES);
  function scanGlobal(n) {
    let v; try { v = W[n]; } catch (_) { return; }
    if (!v || (typeof v !== 'object' && typeof v !== 'function')) return;
    if (looksLikeProvider(v)) wrapProvider(v);
    try { if (looksLikeProvider(v.ethereum)) wrapProvider(v.ethereum); } catch (_) {}
    if (n === 'evmproviders') { try { for (const k of O.keys(v)) if (looksLikeProvider(v[k])) wrapProvider(v[k]); } catch (_) {} }
  }
  // Late assignment (window.avalanche = provider) : caught at once by an accessor, when the name is still free.
  for (const n of ['avalanche']) {
    try {
      if (gopd(W, n)) continue;
      let val;
      origDefine(W, n, { get() { return val; }, set(x) { val = x; try { if (looksLikeProvider(x)) wrapProvider(x); } catch (_) {} }, enumerable: true, configurable: true });
    } catch (_) {}
  }

  // --- balayage de rattrapage: delete+reassign, globales proprietaires, web3 legacy ---
  function scan() {
    try {
      addL('eip6963:announceProvider', onAnnounce, true); // document.open() efface les ecouteurs de window: on les repose (sans doublon)
      installSlot();
      const d = gopd(W, 'ethereum');
      if (d && 'value' in d && looksLikeProvider(d.value)) wrapProvider(d.value);
      for (const n of GLOBAL_NAMES) scanGlobal(n);
      let w3; try { w3 = W.web3; } catch (_) {}
      if (w3 && looksLikeProvider(w3.currentProvider)) wrapProvider(w3.currentProvider);
    } catch (_) {}
  }
  let scans = 0;
  const iv = setI(() => { scan(); if (++scans > 200) { W.clearInterval(iv); setI(scan, 2000); } }, 150);
  addL('DOMContentLoaded', scan, true);
  addL('load', scan, true);
  scan(); // providers already injected by a wallet that ran before this script
})();
