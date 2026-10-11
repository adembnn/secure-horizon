/* Hold up - injecteur (monde MAIN, document_start, toutes frames).
 * Enveloppe les fournisseurs EIP-1193 sur place (Proxy "apply" sur les methodes), retient les
 * demandes sensibles jusqu'a la decision prise par bridge.js (monde isole) via un MessageChannel prive.
 *
 * Regle de durcissement (revue de securite n2, S1) : ce fichier partage les prototypes natifs avec la page (Set, Map, Array,
 * Promise, MessagePort, Function, Object...). La page peut les modifier APRES nous. Donc : (1) toute methode native utilisee est
 * capturee ici, au demarrage, sous forme "decurryfiee" (uncurry) ; (2) apres la zone NATIVES, aucun appel de methode d'un objet
 * que la page peut modifier dans les chemins de securite (ni .has/.get/.then/.map/.call, ni for...of, ni destructuration,
 * ni Object.assign, ni Promise.*) ; (3) les objets internes sont a prototype nul ; (4) la decision n'est crue que si le message
 * porte le jeton aleatoire donne par bridge.js dans "ready". Un test statique (securite_s1_*.test.mjs) le verifie. */
(() => {
  'use strict';
  /* NATIVES-BEGIN */
  const W = window;
  const O = Object, R = Reflect, P = Proxy;
  const BigIntC = BigInt, NativePromise = Promise, WM = WeakMap, WS = WeakSet, MapC = Map, SetC = Set, ErrorC = Error, Str = String;
  const fnCall = Function.prototype.call, fnBind = Function.prototype.bind;
  const uncurry = fnBind.bind(fnCall); // uncurry(f)(self, ...args) === f.call(self, ...args), sans jamais relire .call
  const defProp = O.defineProperty, gopd = O.getOwnPropertyDescriptor, getProto = O.getPrototypeOf, objCreate = O.create;
  const keysOf = O.keys, freeze = O.freeze, isArr = Array.isArray;
  const hasOwnU = uncurry(O.prototype.hasOwnProperty);
  const rApply = R.apply, rGet = R.get, rSet = R.set, rOwnKeys = R.ownKeys, rDelete = R.deleteProperty;
  const JSONs = JSON.stringify, JSONp = JSON.parse;
  const mapGet = uncurry(MapC.prototype.get), mapSet = uncurry(MapC.prototype.set), mapHas = uncurry(MapC.prototype.has), mapDel = uncurry(MapC.prototype.delete);
  const setHas = uncurry(SetC.prototype.has);
  const wmGet = uncurry(WM.prototype.get), wmSet = uncurry(WM.prototype.set), wmHas = uncurry(WM.prototype.has), wmDel = uncurry(WM.prototype.delete);
  const wsHas = uncurry(WS.prototype.has), wsAdd = uncurry(WS.prototype.add);
  const thenOf = uncurry(NativePromise.prototype.then);
  const pResolve = NativePromise.resolve; // appele par rApply(pResolve, NativePromise, [x])
  const chCode = uncurry(String.prototype.charCodeAt);
  const setT = W.setTimeout.bind(W), clearT = W.clearTimeout.bind(W), setI = W.setInterval.bind(W), clearI = W.clearInterval.bind(W);
  const postMsg = W.postMessage.bind(W);
  const dispatchEv = typeof W.dispatchEvent === 'function' ? W.dispatchEvent.bind(W) : () => true;
  const MC = W.MessageChannel;
  const CE = W.CustomEvent;
  const addL = W.addEventListener.bind(W);
  const origToString = Function.prototype.toString;
  const origDefine = O.defineProperty, origDefineMany = O.defineProperties, origReflectDefine = R.defineProperty;
  // Lecture de MessageEvent.data par le getter d'origine (la page peut redefinir le getter du prototype).
  const dataDesc = W.MessageEvent && W.MessageEvent.prototype ? gopd(W.MessageEvent.prototype, 'data') : undefined;
  const dataGet = dataDesc && typeof dataDesc.get === 'function' ? dataDesc.get : null;
  const stopImm = W.Event && W.Event.prototype && typeof W.Event.prototype.stopImmediatePropagation === 'function' ? uncurry(W.Event.prototype.stopImmediatePropagation) : (ev) => ev.stopImmediatePropagation(); // repli : environnement de test sans Event
  // MessagePort : methodes lues sur le prototype du PREMIER port cree (avant toute page).
  let portPost = null, portListen = null, portStart = null;
  /* NATIVES-END */

  // --- aides sans appel de methode modifiable ---
  const isObj = (x) => !!x && (typeof x === 'object' || typeof x === 'function');
  // propriete propre en donnee (jamais l'heritage de Object.prototype, que la page peut empoisonner)
  function own(o, k) { if (!isObj(o)) return undefined; const d = gopd(o, k); return d && hasOwnU(d, 'value') ? d.value : undefined; }
  function setOwn(o, k, v) { defProp(o, k, { __proto__: null, value: v, writable: true, enumerable: true, configurable: true }); return o; }
  // copie d'un descripteur lu : prototype nul, sinon get/set/value heritage d'Object.prototype se melangent au descripteur
  function getDesc(o, k) {
    const d = gopd(o, k); if (!d) return d;
    const out = { __proto__: null };
    if (hasOwnU(d, 'get')) out.get = d.get;
    if (hasOwnU(d, 'set')) out.set = d.set;
    if (hasOwnU(d, 'value')) out.value = d.value;
    if (hasOwnU(d, 'writable')) out.writable = d.writable;
    if (hasOwnU(d, 'enumerable')) out.enumerable = d.enumerable;
    if (hasOwnU(d, 'configurable')) out.configurable = d.configurable;
    return out;
  }
  const decision = (allow, reason, params) => ({ __proto__: null, allow, reason, params });
  const rejected = (e) => new NativePromise((_, rj) => { rj(e); });
  const toPromise = (x) => rApply(pResolve, NativePromise, [x]);
  // resolves our outer promise with the wallet's answer WITHOUT looking up .then on it (the page may have replaced Promise.prototype.then)
  const settleWith = (resolve, reject, r) => { thenOf(toPromise(r), resolve, reject); };
  const dataOf = (ev) => { try { return dataGet ? rApply(dataGet, ev, []) : ev.data; } catch (_) { return undefined; } };

  // --- masquage : les enveloppes se presentent comme les fonctions d'origine ---
  const masks = new WM();
  const tsProxy = new P(origToString, {
    __proto__: null,
    apply(t, thisArg, args) { const o = wmGet(masks, thisArg); return rApply(t, o !== undefined ? o : thisArg, args); }
  });
  wmSet(masks, tsProxy, origToString);
  const tsDesc = getDesc(Function.prototype, 'toString');
  defProp(Function.prototype, 'toString', { __proto__: null, value: tsProxy, writable: tsDesc.writable, enumerable: tsDesc.enumerable, configurable: tsDesc.configurable });
  const maskedProxy = (target, handler) => { const p = new P(target, handler); wmSet(masks, p, target); return p; };

  // --- canal prive vers bridge.js ---
  const pending = new MapC();
  const readyQueue = new MapC();
  let port = null, readyFlag = false, token = '', qn = 0, qdone = 0;
  let nextId = 1;
  function whenReady(fn) { if (readyFlag) { fn(); return; } mapSet(readyQueue, qn++, fn); }
  function flushReady() { while (qdone < qn) { const fn = mapGet(readyQueue, qdone); mapDel(readyQueue, qdone); qdone++; try { fn(); } catch (_) {} } }
  // re = true : a new connection after document.open() / write() cleared the window listeners. The old port and token are dead.
  function connect(re) {
    let tries = 0;
    const attempt = () => {
      if (readyFlag || tries++ > 60) return;
      const ch = new MC();
      if (!portPost) {
        const pr = getProto(ch.port1);
        portPost = uncurry(pr.postMessage); portListen = uncurry(pr.addEventListener);
        portStart = typeof pr.start === 'function' ? uncurry(pr.start) : null;
      }
      const p1 = ch.port1;
      portListen(p1, 'message', (ev) => {
        if (readyFlag) return;
        const d = dataOf(ev);
        if (own(d, 't') !== 'ready') return;
        const k = own(d, 'k');
        // le premier "ready" qui porte un jeton gagne ; sans jeton (pont ancien ou forge) : jamais cru, la demande echoue ferme
        if (typeof k !== 'string' || k.length < 16) return;
        readyFlag = true; token = k; port = p1;
        portListen(p1, 'message', onPort);
        if (portStart) portStart(p1);
        flushReady();
      });
      if (portStart) portStart(p1);
      try { postMsg({ __sentinelle: 'hello', re: re === true }, '*', [ch.port2]); } catch (_) {}
      setT(attempt, 25);
    };
    if (re) setT(attempt, 150); else attempt(); // after a document.open(), wait until the bridge has put its listener back
  }
  // S5 : document.open() / write() / writeln() on the page's own document clears the window listeners, and a page listener put there
  // straight after could take the port of the next "hello". The connection is therefore dropped at once : pending requests fail closed,
  // new ones wait for a fresh port and a fresh token (nothing is sent on the old channel).
  function dropConnection() {
    if (!readyFlag) return;
    readyFlag = false; token = ''; port = null;
    for (let id = 1; id < nextId; id++) {
      if (!mapHas(pending, id)) continue;
      const p = mapGet(pending, id); mapDel(pending, id); clearT(p.ackTimer);
      try { p.cb(decision(false, 'bridge-unavailable', undefined)); } catch (_) {}
    }
    connect(true);
  }
  function onPort(ev) {
    const d = dataOf(ev); if (!isObj(d)) return;
    if (own(d, 'k') !== token) return; // message sans le jeton du pont : ignore
    if (own(d, 't') === 'revoke') { runRevoke(d); return; }
    const id = own(d, 'id'); if (typeof id !== 'number' || !mapHas(pending, id)) return;
    const p = mapGet(pending, id), t = own(d, 't');
    if (t === 'ack') { p.acked = true; return; }
    if (t === 'rpc') { serveRead(d, p); return; }
    if (t === 'result') {
      mapDel(pending, id); clearT(p.ackTimer);
      const allow = own(d, 'allow') === true, reason = own(d, 'reason');
      let params; if (allow) { const pp = own(d, 'params'); if (isArr(pp)) { try { params = clone(pp); } catch (_) {} } }
      try { p.cb(decision(allow, typeof reason === 'string' ? reason : '', params)); } catch (_) {}
    }
  }
  // While a request is held, the service worker may ask for READS on the node of the wallet it came through (dry run of that
  // very request : effect_sim.js). Only these two read-only methods, only for a request still waiting, only through its provider.
  const READS = new SetC(['debug_traceCall', 'eth_call']);
  function serveRead(d, p) {
    const nn = own(d, 'n'), rid = own(d, 'id'), method = own(d, 'method');
    const reply = (ok, result) => {
      try { portPost(port, { t: 'rpcResult', id: rid, n: nn, k: token, ok, result }); } catch (_) { try { portPost(port, { t: 'rpcResult', id: rid, n: nn, k: token, ok: false }); } catch (__) {} }
    };
    let call;
    try {
      const c = p.ctx;
      const fn = !c ? null : typeof c.rawRequest === 'function' ? c.rawRequest : c.provider && typeof c.provider.request === 'function' ? c.provider.request : null;
      if (!fn || typeof method !== 'string' || !setHas(READS, method)) return reply(false);
      call = rApply(fn, c.provider, [{ method, params: clone(own(d, 'params')) }]);
    } catch (_) { return reply(false); }
    let pr; try { pr = toPromise(call); } catch (_) { return reply(false); }
    thenOf(pr, (r) => { let out; try { out = snap(r); } catch (_) { return reply(false); } reply(true, out); }, () => reply(false));
  }
  function ask(kind, payload, ctx, cb) {
    const id = nextId++;
    const entry = { cb, acked: false, ctx: ctx || null, ackTimer: 0 };
    entry.ackTimer = setT(() => {
      if (!entry.acked && mapHas(pending, id)) { mapDel(pending, id); try { cb(decision(false, 'bridge-unavailable', undefined)); } catch (_) {} }
    }, 2500);
    mapSet(pending, id, entry);
    whenReady(() => {
      try { portPost(port, { t: kind, id, k: token, payload }); } catch (_) { if (mapHas(pending, id)) { mapDel(pending, id); clearT(entry.ackTimer); try { cb(decision(false, 'bridge-unavailable', undefined)); } catch (__) {} } }
    });
  }
  function notify(payload) { whenReady(() => { try { portPost(port, { t: 'notify', id: 0, k: token, payload }); } catch (_) {} }); }
  connect(false);
  if (W.Document && W.Document.prototype) {
    const DOC_METHODS = ['open', 'write', 'writeln'];
    for (let di = 0; di < DOC_METHODS.length; di++) {
      const name = DOC_METHODS[di];
      const d = getDesc(W.Document.prototype, name);
      if (!d || typeof d.value !== 'function' || !d.configurable) continue;
      const w = maskedProxy(d.value, { __proto__: null, apply(t, thisArg, args) { const r = rApply(t, thisArg, args); if (thisArg === W.document) dropConnection(); return r; } });
      try { defProp(W.Document.prototype, name, { __proto__: null, value: w, writable: d.writable, enumerable: d.enumerable, configurable: true }); } catch (_) {}
    }
  }

  // --- methodes surveillees ---
  const GATED = new SetC(['eth_sendTransaction', 'eth_signTransaction', 'eth_sign', 'personal_sign',
    'eth_signTypedData', 'eth_signTypedData_v1', 'eth_signTypedData_v3', 'eth_signTypedData_v4',
    'wallet_sendCalls', 'eth_sendRawTransaction',
    // connexion (eth_requestAccounts, wallet_requestPermissions), lectures et changement de reseau (wallet_switchEthereumChain)
    // ne deplacent rien (wallet_addEthereumChain, lui, est retenu : un noeud RPC choisi par la page voit et peut falsifier tout le reste) et n'accordent aucun droit de depense : ils passent directement, sans fenetre.
    // droits durables et dechiffrement : non decodes par le moteur, donc ecran "Non verifie" plutot que passage silencieux
    // wallet_requestExecutionPermissions (ERC-7715, the current name of wallet_grantPermissions) asks for a lasting right ; wallet_watchAsset puts a
    // token under a name the SITE chooses into the wallet's list : both are held. wallet_switchEthereumChain passes (the window names the network).
    'wallet_addEthereumChain', 'wallet_grantPermissions', 'wallet_requestExecutionPermissions', 'wallet_watchAsset', 'wallet_requestSnaps', 'eth_decrypt', 'eth_getEncryptionPublicKey', 'eth_sendUserOperation', 'eth_signUserOperation']);
  const JOURNAL = new SetC(['eth_requestAccounts']);
  function isHex20(s) {
    if (typeof s !== 'string' || s.length !== 42 || chCode(s, 0) !== 48 || (chCode(s, 1) | 32) !== 120) return false;
    for (let i = 2; i < 42; i++) { const c = chCode(s, i); if (!((c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102))) return false; }
    return true;
  }

  // Inert deep copy, frozen : what is judged is exactly what is forwarded. The copy is rebuilt structurally (own data properties),
  // never by a second JSON round trip : an inherited toJSON planted on Object.prototype could return another content each time.
  function deepFreeze(x) { if (x && typeof x === 'object') { const ks = keysOf(x); for (let i = 0; i < ks.length; i++) deepFreeze(x[ks[i]]); freeze(x); } return x; }
  function snap(x) { return JSONp(JSONs(x === undefined ? null : x)); }
  function clone(x) {
    if (x === null || typeof x !== 'object') return x;
    if (isArr(x)) { const n = x.length, out = []; for (let i = 0; i < n; i++) setOwn(out, i, clone(own(x, i))); return out; }
    const ks = keysOf(x), out = {};
    for (let i = 0; i < ks.length; i++) setOwn(out, ks[i], clone(own(x, ks[i])));
    return out;
  }
  const thaw = clone; // fresh mutable copy for the wallet (some wallets normalise the object in place)
  // a gated request always carries its own "params" : otherwise the wallet would read it from Object.prototype (page-controlled, may change at each read)
  function pinParams(o) { if (isObj(o) && !isArr(o) && !hasOwnU(o, 'params')) setOwn(o, 'params', undefined); return o; }
  // stable text of a JSON-like value, without toJSON / toString of any object
  function ser(x) {
    if (x === undefined || x === null) return 'null';
    if (typeof x !== 'object') return JSONs(x) === undefined ? 'null' : JSONs(x);
    let s = '';
    if (isArr(x)) { s = '['; for (let i = 0; i < x.length; i++) s = s + (i ? ',' : '') + ser(own(x, i)); return s + ']'; }
    const ks = keysOf(x); s = '{';
    for (let i = 0; i < ks.length; i++) s = s + (i ? ',' : '') + JSONs(ks[i]) + ':' + ser(own(x, ks[i]));
    return s + '}';
  }
  function guessFrom(method, params) {
    try {
      const p = isArr(params) ? params : null; if (!p) return null;
      const p0 = own(p, 0);
      if (isObj(p0) && typeof own(p0, 'from') === 'string') return own(p0, 'from');
      for (let i = 0; i < p.length; i++) { const v = own(p, i); if (isHex20(v)) return v; }
    } catch (_) {}
    return null;
  }
  function guessChain(method, params) {
    try {
      const p = isArr(params) ? params : null; if (!p) return null;
      const p0 = own(p, 0);
      if (isObj(p0)) { const c = own(p0, 'chainId'); if (c != null) return Str(c); }
    } catch (_) {}
    return null;
  }
  // calls cb(chainId | null) exactly once
  function chainOf(provider, rawRequest, hint, cb) {
    if (hint) { cb(hint); return; }
    try { if (provider && provider.chainId) { cb(Str(provider.chainId)); return; } } catch (_) {}
    if (typeof rawRequest !== 'function') { cb(null); return; }
    let settled = false, tm = 0;
    const fin = (v) => { if (settled) return; settled = true; clearT(tm); cb(v); };
    tm = setT(() => fin(null), 800);
    try { thenOf(toPromise(rApply(rawRequest, provider, [{ method: 'eth_chainId' }])), (v) => fin(v), () => fin(null)); } catch (_) { fin(null); }
  }
  function rejection(reason) {
    const e = new ErrorC(reason === 'denied' ? 'User rejected the request.' : 'Hold up: verification indisponible, demande bloquee (' + reason + ').');
    setOwn(e, 'code', reason === 'denied' ? 4001 : 4900); // 4001 = refus utilisateur, 4900 = deconnecte
    return e;
  }
  // Avoids a second window when a wrapped method of a wallet calls another wrapped one (legacy send() -> request(),
  // instance method -> prototype method). A pass is one-shot and bound to the provider, its chain, the content that was
  // approved AND the very objects forwarded to the wallet (fresh copies the page never receives). The same request sent
  // again by the page while the wallet popup is open carries other objects : it is gated again. A pass is honoured only
  // while our own forwarding call is on the stack (synchronous delegation) : an object the page managed to capture later is worthless.
  // A wallet that delegates asynchronously to another wrapped method is simply asked twice (fail closed).
  const passes = new WM(); // provider -> WeakMap(forwarded object -> key)
  // The same pass, whatever the provider object the wallet uses inside. A real wallet reaches its own methods through more than one
  // object (a Proxy in front of the instance, a method bound to the instance) : the inner wrapped method then runs with another `this`
  // than the one the page called, and the request we had just forwarded was asked a second time (seen with MetaMask, 11 Oct.).
  // Nothing else is relaxed : still the very object we forwarded, still the same content and chain, still once, and still only
  // while our own forwarding call is on the stack.
  const passesAny = new WM(); // forwarded object -> { k : key, m : the map of the provider it was granted for }
  const NOPROV = {};
  let forwarding = 0;
  const provKey = (prov) => (isObj(prov) ? prov : NOPROV);
  const chainTag = (prov) => { try { const c = prov && prov.chainId; return c == null ? '' : Str(c); } catch (_) { return ''; } };
  const keyOf = (prov, m, p) => { try { return chainTag(prov) + '|' + m + '|' + ser(p); } catch (_) { return null; } };
  function grant(prov, k, objs) {
    if (k === null) return () => {};
    const o = provKey(prov); let m = wmGet(passes, o); if (!m) { m = new WM(); wmSet(passes, o, m); }
    for (let i = 0; i < objs.length; i++) { const x = objs[i]; if (isObj(x)) { wmSet(m, x, k); wmSet(passesAny, x, { __proto__: null, k, m }); } }
    return () => { for (let i = 0; i < objs.length; i++) { const x = objs[i]; if (isObj(x)) { if (wmGet(m, x) === k) wmDel(m, x); const y = wmGet(passesAny, x); if (y && y.k === k && y.m === m) wmDel(passesAny, x); } } };
  }
  function takePass(prov, obj, k) {
    if (forwarding <= 0 || !isObj(obj) || k === null) return false;
    const m = wmGet(passes, provKey(prov));
    const any = wmGet(passesAny, obj);
    if (m && wmGet(m, obj) === k) { wmDel(m, obj); if (any && any.m === m) wmDel(passesAny, obj); return true; }
    if (!any || any.k !== k) return false; // another `this` inside the wallet : the forwarded object itself is the proof
    wmDel(passesAny, obj); if (wmGet(any.m, obj) === k) wmDel(any.m, obj); // one pass, whichever object of the wallet uses it
    return true;
  }
  // Forwards with a pass that dies as soon as the wallet has answered (or thrown).
  function fwd(prov, k, objs, fn) {
    const revoke = grant(prov, k, objs);
    let r;
    forwarding++;
    try { r = fn(); } catch (e) { revoke(); throw e; } finally { forwarding--; }
    try { thenOf(toPromise(r), revoke, revoke); } catch (_) { revoke(); }
    return r;
  }

  // --- revocation prepared by Hold up (revoke.js) ---
  // Only through the private port (bridge token), only asked by the service worker. The request goes to the ORIGINAL request
  // method of the provider that carried the last allowed request of this frame (never the wrapper : no new hold, no loop).
  // A wallet that re-enters a wrapped method synchronously with the very object we forwarded uses the one-shot pass (fwd).
  // A wallet that re-enters later with a copy is gated again ; its gate message then carries the token of the service worker,
  // only for the exact same content, once, for 8 s. The page never sees the token and cannot add it : the gate payload is built here.
  let lastCtx = null, arm = null;
  function remember(provider, rawRequest) { if (isObj(provider)) lastCtx = { __proto__: null, provider, rawRequest: typeof rawRequest === 'function' ? rawRequest : null }; }
  function armedFor(provider, method, params) {
    const a = arm;
    if (!a || a.prov !== provKey(provider)) return null;
    const k = keyOf(provider, method, params);
    if (k === null || k !== a.key) return null;
    arm = null; // once
    return a.tok;
  }
  function errCode(e) { let c; try { c = own(e, 'code'); if (c === undefined && isObj(e)) c = e.code; } catch (_) {} return typeof c === 'number' ? c : undefined; }
  function runRevoke(d) {
    const n = own(d, 'n'), op = own(d, 'op'), method = own(d, 'method'), tok = own(d, 'tok');
    const reply = (state, code, result) => { try { portPost(port, { t: 'revokeResult', n, k: token, state, code, result }); } catch (_) {} };
    if (!((op === 'send' && method === 'eth_sendTransaction') || (op === 'read' && method === 'eth_call'))) { reply('error', 'refused'); return; }
    const c = lastCtx;
    if (!c || !isObj(c.provider)) { reply('error', 'no_provider'); return; }
    let raw = c.rawRequest;
    if (typeof raw !== 'function') { // the last request came through send / sendAsync : the original request method behind our wrapper
      let f; try { f = c.provider.request; } catch (_) {}
      raw = typeof f === 'function' && wsHas(wrappedFns, f) ? wmGet(masks, f) : null;
    }
    if (typeof raw !== 'function') { reply('error', 'no_provider'); return; }
    let params; try { params = clone(own(d, 'params')); } catch (_) { params = undefined; }
    if (!isArr(params)) { reply('error', 'refused'); return; }
    const out = {}; setOwn(out, 'method', method); setOwn(out, 'params', params);
    const prov = c.provider, k = keyOf(prov, method, params);
    if (op === 'send') { const mine = { __proto__: null, prov: provKey(prov), key: k, tok: typeof tok === 'string' ? tok : '' }; arm = mine; setT(() => { if (arm === mine) arm = null; }, 8000); }
    let r;
    try { r = fwd(prov, k, [out, params], () => rApply(raw, prov, [out])); } catch (e) { reply(errCode(e) === 4001 ? 'rejected' : 'error', errCode(e)); return; }
    let pr; try { pr = toPromise(r); } catch (_) { reply('error', undefined); return; }
    thenOf(pr, (v) => {
      if (op !== 'read') { reply('submitted', undefined); return; }
      let s; try { s = snap(v); } catch (_) { s = null; }
      reply('read', undefined, typeof s === 'string' ? s : null);
    }, (e) => { const code = errCode(e); reply(op === 'send' && code === 4001 ? 'rejected' : 'error', code); });
  }

  // Request limited by Hold up (Q17) : the worker answers with the params to forward, only for a transaction or a batch of calls.
  function limited(r, method) {
    if (!r || !isArr(r.params) || (method !== 'eth_sendTransaction' && method !== 'wallet_sendCalls')) return undefined;
    return r.params; // already a structural copy (onPort)
  }
  const normChain = (x) => { try { return Str(BigIntC(x)); } catch (_) { return Str(x); } };
  function gate(provider, rawRequest, method, params, entryPoint, cb) {
    chainOf(provider, rawRequest, guessChain(method, params), (chainId) => {
      let from = guessFrom(method, params);
      if (!from) { try { from = provider.selectedAddress || null; } catch (_) {} }
      // S11 : after an "allow" (it can come minutes later) the network is read again. If the page switched it meanwhile, the request
      // is refused : the same bytes on another network are another request.
      const payload = { method, params, chainId, from, entryPoint, topLevel: W === W.top };
      const rt = armedFor(provider, method, params);
      if (rt) setOwn(payload, 'revokeToken', rt);
      ask('gate', payload, { provider, rawRequest }, (r) => {
        if (!r.allow || chainId == null) { if (r.allow) remember(provider, rawRequest); cb(r); return; }
        chainOf(provider, rawRequest, null, (now) => {
          const moved = now != null && normChain(now) !== normChain(chainId);
          if (!moved) remember(provider, rawRequest);
          cb(moved ? decision(false, 'reseau-change', undefined) : r);
        });
      });
    });
  }

  // --- enveloppes ---
  function wrapRequest(target) {
    return maskedProxy(target, {
      __proto__: null,
      apply(t, thisArg, args) {
        const a = args[0];
        if (!a || (typeof a !== 'object' && typeof a !== 'function')) return rApply(t, thisArg, args);
        // L'objet de la page n'est lu qu'UNE fois (un getter ou un Proxy sur "method" peut mentir d'une lecture a l'autre) :
        // la decision ET la transmission au portefeuille se font sur la meme copie inerte.
        let full;
        try { full = deepFreeze(snap(a)); } catch (_) { return rejected(rejection('params-illisibles')); }
        if (isArr(full)) { // request([...]) is not EIP-1193 : a batch that carries a gated method is refused, never forwarded blind
          for (let i = 0; i < full.length; i++) { const it = full[i]; if (it && typeof it === 'object' && setHas(GATED, own(it, 'method'))) return rejected(rejection('lot-non-supporte')); }
          return rApply(t, thisArg, [thaw(full)]);
        }
        if (!full || typeof full !== 'object') return rApply(t, thisArg, [thaw(full)]);
        const method = own(full, 'method');
        if (typeof method !== 'string') return rejected(rejection('params-illisibles')); // no own method : the wallet would read one from Object.prototype
        const params = own(full, 'params');
        if (setHas(JOURNAL, method)) { notify({ method, params, kind: 'journal' }); return rApply(t, thisArg, [thaw(full)]); }
        if (!setHas(GATED, method)) return rApply(t, thisArg, [thaw(full)]);
        const k = keyOf(thisArg, method, params);
        // Internal call of the wallet with an object we forwarded ourselves : same content, same provider, once.
        let ap, ap0; try { ap = a.params; ap0 = isArr(ap) ? ap[0] : undefined; } catch (_) {}
        if (takePass(thisArg, a, k) || takePass(thisArg, ap, k) || takePass(thisArg, ap0, k)) return rApply(t, thisArg, [pinParams(thaw(full))]);
        return new NativePromise((resolve, reject) => {
          gate(thisArg, t, method, params, 'request', (r) => {
            try {
              if (!r.allow) { reject(rejection(r.reason || 'denied')); return; }
              const out = pinParams(thaw(full));
              const lim = limited(r, method); if (lim !== undefined) setOwn(out, 'params', lim);
              const op = own(out, 'params');
              settleWith(resolve, reject, fwd(thisArg, keyOf(thisArg, method, op), [out, op], () => rApply(t, thisArg, [out])));
            } catch (e) { reject(e); }
          });
        });
      }
    });
  }
  function respErr(id, reason) { return { id, jsonrpc: '2.0', error: { code: reason === 'denied' ? 4001 : 4900, message: rejection(reason).message } }; }

  function wrapSend(target) {
    return maskedProxy(target, {
      __proto__: null,
      apply(t, thisArg, args) {
        const a0 = args[0], a1 = args[1];
        if (typeof a0 === 'string') { // send(method, params) -> Promise
          if (setHas(JOURNAL, a0)) { notify({ method: a0, kind: 'journal' }); return rApply(t, thisArg, args); }
          if (!setHas(GATED, a0)) return rApply(t, thisArg, args);
          let params; try { params = a1 === undefined ? undefined : snap(a1); } catch (_) { return rejected(rejection('params-illisibles')); }
          return new NativePromise((resolve, reject) => {
            gate(thisArg, null, a0, params, 'send', (r) => {
              try {
                if (!r.allow) { reject(rejection(r.reason || 'denied')); return; }
                const lim = limited(r, a0), p2 = lim !== undefined ? lim : params;
                settleWith(resolve, reject, fwd(thisArg, keyOf(thisArg, a0, p2), [p2], () => rApply(t, thisArg, [a0, p2])));
              } catch (e) { reject(e); }
            });
          });
        }
        if (a0 && typeof a0 === 'object' && typeof a1 === 'function') return legacyAsync(t, thisArg, a0, a1, 'send');
        // send(payload) synchrone sans rappel: impossible a retenir. Les portefeuilles ne le supportent pas pour les signatures.
        // Meme regle que request() : une seule lecture, decision et transmission sur la copie (objet seul ou lot).
        if (a0 && (typeof a0 === 'object' || typeof a0 === 'function')) {
          let s; try { s = snap(a0); } catch (_) { throw rejection('params-illisibles'); }
          const list = isArr(s) ? s : [s];
          for (let i = 0; i < list.length; i++) {
            const it = list[i];
            if (!it || typeof it !== 'object') continue;
            const m = own(it, 'method');
            if (setHas(JOURNAL, m)) notify({ method: m, kind: 'journal' });
            if (setHas(GATED, m)) { const e = new ErrorC('Hold up: appel synchrone send(payload) non supporte pour ' + m); setOwn(e, 'code', 4900); throw e; }
          }
          return rApply(t, thisArg, [s]);
        }
        return rApply(t, thisArg, args);
      }
    });
  }
  function wrapSendAsync(target) {
    return maskedProxy(target, {
      __proto__: null,
      apply(t, thisArg, args) {
        const a0 = args[0], cb = args[1];
        if (a0 && typeof a0 === 'object' && typeof cb === 'function') return legacyAsync(t, thisArg, a0, cb, 'sendAsync');
        return rApply(t, thisArg, args);
      }
    });
  }
  function legacyAsync(t, thisArg, payload, cb, entry) {
    const isBatch = isArr(payload); let items;
    try { items = snap(isBatch ? payload : [payload]); } catch (_) { return cb(rejection('params-illisibles'), respErr(null, 'x')); }
    const n = items.length, rs = { __proto__: null };
    let left = n;
    const settle = (i, r) => { rs[i] = r; if (--left === 0) after(); };
    const after = () => {
      const forward = [], idx = { __proto__: null }; let nf = 0;
      for (let i = 0; i < n; i++) {
        const r = rs[i];
        if (r && r.allow === true) {
          const it = items[i], m = isObj(it) ? own(it, 'method') : undefined;
          let item = it;
          const lim = isObj(it) ? limited(r, m) : undefined;
          if (lim !== undefined) { item = clone(it); setOwn(item, 'params', lim); }
          if (setHas(GATED, m)) pinParams(item);
          setOwn(forward, nf, item); idx[nf] = i; nf++;
        }
      }
      const out = [];
      for (let i = 0; i < n; i++) {
        const r = rs[i];
        setOwn(out, i, r && r.allow === true ? undefined : respErr(isObj(items[i]) ? own(items[i], 'id') : undefined, (r && r.reason) || 'denied'));
      }
      if (!nf) {
        let firstErr; for (let i = 0; i < n; i++) { if (own(out, i)) { firstErr = own(out, i); break; } }
        return isBatch ? cb(null, out) : cb(rejection((rs[0] && rs[0].reason) || 'denied'), firstErr);
      }
      const revokes = { __proto__: null };
      for (let j = 0; j < nf; j++) { const it = forward[j]; revokes[j] = isObj(it) && setHas(GATED, own(it, 'method')) ? grant(thisArg, keyOf(thisArg, own(it, 'method'), own(it, 'params')), [it, own(it, 'params')]) : null; }
      const done = (err, resp) => {
        for (let j = 0; j < nf; j++) { if (revokes[j]) revokes[j](); }
        if (!isBatch) return cb(err, resp);
        const arr = isArr(resp) ? resp : [];
        for (let j = 0; j < nf; j++) {
          let v = arr[j];
          if (v === undefined) { const fid = isObj(forward[j]) ? own(forward[j], 'id') : undefined; for (let q = 0; q < arr.length; q++) { const x = arr[q]; if (x && forward[j] && x.id === fid) { v = x; break; } } }
          setOwn(out, idx[j], v);
        }
        cb(err, out);
      };
      forwarding++;
      try { rApply(t, thisArg, [isBatch ? forward : forward[0], done]); } catch (e) {
        forwarding--; for (let j = 0; j < nf; j++) { if (revokes[j]) revokes[j](); }
        cb(e, respErr(null, 'x')); return;
      }
      forwarding--;
    };
    if (n === 0) { after(); return; }
    for (let i = 0; i < n; i++) {
      const it = items[i];
      const m = isObj(it) ? own(it, 'method') : undefined;
      if (typeof m !== 'string') { settle(i, decision(true, '', undefined)); continue; }
      if (setHas(JOURNAL, m)) { notify({ method: m, kind: 'journal' }); settle(i, decision(true, '', undefined)); continue; }
      if (!setHas(GATED, m)) { settle(i, decision(true, '', undefined)); continue; }
      // internal call of the wallet (send(payload, cb) -> sendAsync(payload, cb)) with an object we forwarded
      let orig, op; try { orig = isBatch ? payload[i] : payload; op = orig && orig.params; } catch (_) {}
      const k = keyOf(thisArg, m, own(it, 'params'));
      if (takePass(thisArg, orig, k) || takePass(thisArg, op, k)) { settle(i, decision(true, '', undefined)); continue; }
      ((idx) => { gate(thisArg, null, m, own(it, 'params'), entry, (r) => settle(idx, r)); })(i);
    }
  }
  // Internal entry points of some wallets (MetaMask style _rpcRequest(payload, cb), _rpcEngine.handle(payload, cb)) : same
  // rules as the public ones, chosen by the shape of the call.
  function wrapInternal(target) {
    return maskedProxy(target, {
      __proto__: null,
      apply(t, thisArg, args) {
        const a0 = args[0], a1 = args[1];
        if (a0 && typeof a0 === 'object' && typeof a1 === 'function') return legacyAsync(t, thisArg, a0, a1, 'internal');
        let m; try { m = isObj(a0) ? a0.method : undefined; } catch (_) {}
        if (typeof m === 'string' && setHas(GATED, m)) { // gated shape that cannot be held : refused, never forwarded blind
          const e = new ErrorC('Hold up: point d entree interne non supporte pour ' + m); setOwn(e, 'code', 4900);
          return rejected(e);
        }
        return rApply(t, thisArg, args);
      }
    });
  }
  // Wallet-specific direct entry points (provider.sendTransaction(tx), provider.signTransaction(tx)) : held as the JSON-RPC method they stand for.
  // When the wallet then calls its own request() with the very transaction object we forwarded, that inner call is not asked twice
  // (same object, same content, once : takePass on params[0]).
  function makeDirect(method) {
    return function (target) {
      return maskedProxy(target, {
        __proto__: null,
        apply(t, thisArg, args) {
          const a0 = args[0];
          if (!isObj(a0)) return rApply(t, thisArg, args);
          let tx; try { tx = snap(a0); } catch (_) { return rejected(rejection('params-illisibles')); }
          return new NativePromise((resolve, reject) => {
            gate(thisArg, null, method, [tx], 'direct', (r) => {
              try {
                if (!r.allow) { reject(rejection(r.reason || 'denied')); return; }
                const lim = limited(r, method), out = clone(lim !== undefined && isObj(lim[0]) ? lim[0] : tx);
                const rest = [out]; for (let i = 1; i < args.length; i++) setOwn(rest, i, args[i]);
                settleWith(resolve, reject, fwd(thisArg, keyOf(thisArg, method, [out]), [out], () => rApply(t, thisArg, rest)));
              } catch (e) { reject(e); }
            });
          });
        }
      });
    };
  }
  function wrapEnable(target) {
    return maskedProxy(target, { __proto__: null, apply(t, thisArg, args) { notify({ method: 'eth_requestAccounts', kind: 'journal', via: 'enable' }); return rApply(t, thisArg, args); } });
  }
  const WRAPPERS = { __proto__: null, request: wrapRequest, send: wrapSend, sendAsync: wrapSendAsync, enable: wrapEnable, _rpcRequest: wrapInternal, handle: wrapInternal, sendTransaction: makeDirect('eth_sendTransaction'), signTransaction: makeDirect('eth_signTransaction') };
  const PROVIDER_METHODS = ['request', 'send', 'sendAsync', 'enable', '_rpcRequest', 'sendTransaction', 'signTransaction'];

  // --- patch sur place d'un fournisseur ---
  const wrappedFns = new WS();     // enveloppes deja posees
  const patchedGetters = new WS(); // accesseurs deja remplaces
  const patched = new WM();        // fournisseur brut -> resultat (lui-meme ou proxy de repli)
  const fallbackCache = new WM();
  // Wraps the method on ONE owner. true = wrapped (or nothing to wrap), false = this owner cannot be patched.
  function patchOwn(owner, name) {
    const d = getDesc(owner, name);
    if (!d) return true;
    if (d.get || d.set) { // accessor : the returned value is wrapped
      if (d.get && wsHas(patchedGetters, d.get)) return true;
      if (!d.get || !d.configurable) return false;
      const cache = new WM();
      const g = d.get;
      const get = function () { const f = rApply(g, this, []); if (typeof f !== 'function') return f; if (wsHas(wrappedFns, f)) return f; let w = wmGet(cache, f); if (!w) { w = WRAPPERS[name](f); wsAdd(wrappedFns, w); wmSet(cache, f, w); } return w; };
      wsAdd(patchedGetters, get);
      try { defProp(owner, name, { __proto__: null, get, set: d.set, enumerable: d.enumerable, configurable: true }); return true; } catch (_) { return false; }
    }
    const f = d.value;
    if (typeof f !== 'function' || wsHas(wrappedFns, f)) return true;
    if (!d.writable && !d.configurable) return false;
    const w = WRAPPERS[name](f);
    wsAdd(wrappedFns, w);
    try { defProp(owner, name, { __proto__: null, value: w, writable: d.writable, enumerable: d.enumerable, configurable: d.configurable }); } catch (_) { return false; }
    return true;
  }
  // Every owner of the method is wrapped, from the instance up the whole prototype chain : a wallet that rebinds
  // request on the instance keeps a second copy on its prototype, reachable with getPrototypeOf(provider).request.call(provider, ...).
  // Idempotent (wrappedFns). The credit of gate() avoids a second window when the outer wrapper calls the inner one.
  function patchMethod(provider, name) {
    let ok = true, depth = 0;
    for (let o = provider; o && o !== O.prototype && o !== Function.prototype && depth < 32; o = getProto(o), depth++) {
      let own_ = false; try { own_ = hasOwnU(o, name); } catch (_) {}
      if (!own_) continue;
      let done = false; try { done = patchOwn(o, name); } catch (_) { done = false; }
      if (!done) ok = false;
    }
    return ok;
  }
  function fallbackProxy(raw) {
    let px = wmGet(fallbackCache, raw); if (px) return px;
    const cache = new WM();
    const shadow = objCreate(raw); // cible vide: evite les invariants des proprietes gelees
    const wrapFn = (k, v) => {
      if (typeof v !== 'function' || typeof k !== 'string' || !WRAPPERS[k] || k === 'handle') return v;
      if (wsHas(wrappedFns, v)) return v;
      let w = wmGet(cache, v); if (!w) { w = WRAPPERS[k](v); wmSet(cache, v, w); } return w;
    };
    px = new P(shadow, {
      __proto__: null,
      get(t, k) { return wrapFn(k, rGet(raw, k, raw)); },
      set(t, k, v) { return rSet(raw, k, v, raw); },
      has(t, k) { return k in raw; },
      ownKeys() { return rOwnKeys(raw); },
      deleteProperty(t, k) { return rDelete(raw, k); },
      getPrototypeOf() { return getProto(raw); },
      getOwnPropertyDescriptor(t, k) {
        const d = getDesc(raw, k); if (!d) return d;
        d.configurable = true;
        if (hasOwnU(d, 'value')) d.value = wrapFn(k, d.value);
        return d;
      }
    });
    wmSet(fallbackCache, raw, px);
    return px;
  }
  function wrapProvider(p) {
    if (!isObj(p)) return p;
    if (wmHas(patched, p)) { try { if (isArr(p.providers)) wrapProviders(p.providers); } catch (_) {} return wmGet(patched, p); }
    let ok = true;
    for (let i = 0; i < PROVIDER_METHODS.length; i++) {
      const name = PROVIDER_METHODS[i];
      let has = false; try { has = typeof p[name] === 'function' || name in p; } catch (_) {}
      if (!has) continue;
      let ownerOk = false; try { ownerOk = patchMethod(p, name); } catch (_) { ownerOk = false; }
      if (!ownerOk && name !== '_rpcRequest' && name !== 'sendTransaction' && name !== 'signTransaction') ok = false;
    }
    // inner JSON-RPC engine of MetaMask-like wallets (best effort : a failure here does not change how the provider is exposed)
    try { const eng = p._rpcEngine; if (isObj(eng) && typeof eng.handle === 'function') patchMethod(eng, 'handle'); } catch (_) {}
    const result = ok ? p : fallbackProxy(p);
    wmSet(patched, p, result);
    try { if (isArr(p.providers)) wrapProviders(p.providers); } catch (_) {}
    return result;
  }
  function wrapProviders(arr) {
    for (let i = 0; i < arr.length; i++) {
      try { const r = wrapProvider(arr[i]); if (r !== arr[i]) setOwn(arr, i, r); } catch (_) {}
    }
  }
  function looksLikeProvider(v) {
    return v && (typeof v === 'object' || typeof v === 'function') && (typeof v.request === 'function' || typeof v.send === 'function' || typeof v.sendAsync === 'function');
  }

  // --- window.ethereum : accesseur pour attraper les affectations tardives ---
  let current; let ext = null;
  const slotGet = function () {
    let v = ext && ext.get ? rApply(ext.get, W, []) : current;
    if (looksLikeProvider(v)) { const r = wrapProvider(v); return r; }
    return v;
  };
  const slotSet = function (v) {
    if (ext && ext.set) { rApply(ext.set, W, [v]); } else current = v;
    if (looksLikeProvider(v)) wrapProvider(v);
  };
  // The page holds a provider we could not patch in place (frozen, not rewritable) behind a non configurable window.ethereum : the journal
  // and the side panel say "interception partielle" instead of pretending. Once per page.
  let partialNoted = false;
  function notePartial() { if (partialNoted) return; partialNoted = true; notify({ method: 'interception_partielle', kind: 'journal' }); }
  function installSlot() {
    const d = getDesc(W, 'ethereum');
    if (d && (d.get === slotGet)) return;
    if (d) { // valeur ou accesseur deja present: on le reprend
      if (hasOwnU(d, 'value')) current = d.value; else { ext = { get: d.get, set: d.set }; }
      if (!d.configurable) {
        // impossible de remplacer l'emplacement : on envelopper en place. Si le fournisseur n'est pas patchable sur place
        // (methode non reinscriptible), la page garde l'objet brut : limite connue, voir RAPPORT_SECURITE_CORRECTIFS.md (S10).
        try { const raw = hasOwnU(d, 'value') ? d.value : slotGet(); if (isObj(raw) && wrapProvider(raw) !== raw) notePartial(); } catch (_) {}
        return;
      }
    }
    try { origDefine(W, 'ethereum', { __proto__: null, get: slotGet, set: slotSet, enumerable: true, configurable: true }); } catch (_) {}
    if (looksLikeProvider(current)) wrapProvider(current);
  }
  installSlot();

  // Les portefeuilles qui font Object.defineProperty(window,'ethereum',...) sont rediriges vers notre emplacement.
  function takeOver(desc) {
    if (!desc) return;
    if ('value' in desc) { current = desc.value; ext = null; if (looksLikeProvider(current)) wrapProvider(current); }
    else { ext = { get: desc.get, set: desc.set }; try { const v = slotGet(); void v; } catch (_) {} }
  }
  const argAt = (args, i) => (args.length > i ? args[i] : undefined);
  O.defineProperty = maskedProxy(origDefine, {
    __proto__: null,
    apply(t, thisArg, args) {
      const o = argAt(args, 0), k = argAt(args, 1), desc = argAt(args, 2);
      if (o === W && k === 'ethereum' && desc && typeof desc === 'object') { installSlot(); takeOver(desc); return o; }
      const r = rApply(t, thisArg, args);
      // other provider globals (window.avalanche of Core, ...) : wrapped in place as soon as they are defined
      if (o === W && typeof k === 'string' && setHas(GLOBALS, k)) { try { scanGlobal(k); } catch (_) {} }
      return r;
    }
  });
  R.defineProperty = maskedProxy(origReflectDefine, {
    __proto__: null,
    apply(t, thisArg, args) {
      const o = argAt(args, 0), k = argAt(args, 1), desc = argAt(args, 2);
      if (o === W && k === 'ethereum' && desc && typeof desc === 'object') { installSlot(); takeOver(desc); return true; }
      const r = rApply(t, thisArg, args);
      if (o === W && typeof k === 'string' && setHas(GLOBALS, k)) { try { scanGlobal(k); } catch (_) {} }
      return r;
    }
  });
  O.defineProperties = maskedProxy(origDefineMany, {
    __proto__: null,
    apply(t, thisArg, args) {
      const o = argAt(args, 0), props = argAt(args, 1);
      if (o === W && props && typeof props === 'object' && hasOwnU(props, 'ethereum')) {
        installSlot(); takeOver(props.ethereum);
        const rest = {}, ks = keysOf(props); for (let i = 0; i < ks.length; i++) if (ks[i] !== 'ethereum') setOwn(rest, ks[i], props[ks[i]]);
        return rApply(t, thisArg, [o, rest]);
      }
      const r = rApply(t, thisArg, args);
      if (o === W && props && typeof props === 'object') { const ks = keysOf(props); for (let i = 0; i < ks.length; i++) if (setHas(GLOBALS, ks[i])) { try { scanGlobal(ks[i]); } catch (_) {} } }
      return r;
    }
  });

  // --- EIP-6963 : on enveloppe chaque fournisseur annonce, avant les ecouteurs de la page ---
  const reannounced = new WS();
  const onAnnounce = (ev) => {
    try {
      if (wsHas(reannounced, ev)) return;
      const d = ev.detail; if (!d || !d.provider) return;
      const r = wrapProvider(d.provider);
      if (r !== d.provider) { // fournisseur non patchable sur place: on remplace l'annonce par un proxy
        stopImm(ev);
        const info = d.info;
        const ne = new CE('eip6963:announceProvider', { detail: freeze({ info, provider: r }) });
        wsAdd(reannounced, ne);
        setT(() => dispatchEv(ne), 0);
      }
    } catch (_) {}
  };
  addL('eip6963:announceProvider', onAnnounce, true);

  // --- provider globals other than window.ethereum. 'avalanche' is Core, the Avalanche wallet. ---
  const GLOBAL_NAMES = ['avalanche', 'core', 'okxwallet', 'trustwallet', 'coinbaseWalletExtension', 'rabby', 'BinanceChain', 'tokenpocket', 'bitkeep', 'phantom', 'solflare', 'evmproviders'];
  const GLOBALS = new SetC(GLOBAL_NAMES);
  // Names that only ever hold an EVM provider : a capture accessor is put on them while they are free (no race with the sweep).
  // 'core', 'phantom', 'solflare' are left to the sweep : dapps test them with "in window" and use non EVM members.
  const TRAP_NAMES = ['avalanche', 'okxwallet', 'trustwallet', 'coinbaseWalletExtension', 'rabby', 'BinanceChain', 'tokenpocket', 'bitkeep'];
  function wrapGlobalValue(v) {
    if (!isObj(v)) return v;
    let r = v;
    if (looksLikeProvider(v)) r = wrapProvider(v);
    try { if (looksLikeProvider(v.ethereum)) wrapProvider(v.ethereum); } catch (_) {}
    return r;
  }
  function scanGlobal(n) {
    let v; try { v = W[n]; } catch (_) { return; }
    if (!isObj(v)) return;
    if (looksLikeProvider(v)) wrapProvider(v);
    try { if (looksLikeProvider(v.ethereum)) wrapProvider(v.ethereum); } catch (_) {}
    if (n === 'evmproviders') { try { const ks = keysOf(v); for (let i = 0; i < ks.length; i++) if (looksLikeProvider(v[ks[i]])) wrapProvider(v[ks[i]]); } catch (_) {} }
  }
  // Late assignment (window.rabby = provider) : caught at once by an accessor, when the name is still free.
  function trapFree() {
    for (let i = 0; i < TRAP_NAMES.length; i++) {
      const n = TRAP_NAMES[i];
      try {
        if (gopd(W, n)) continue;
        let val;
        origDefine(W, n, { __proto__: null, get() { return isObj(val) ? wrapGlobalValue(val) : val; }, set(x) { val = x; try { wrapGlobalValue(x); } catch (_) {} }, enumerable: true, configurable: true });
      } catch (_) {}
    }
  }
  trapFree();

  // --- balayage de rattrapage: delete+reassign, globales proprietaires, web3 legacy ---
  function scan() {
    try {
      addL('eip6963:announceProvider', onAnnounce, true); // document.open() efface les ecouteurs de window: on les repose (sans doublon)
      installSlot();
      const d = getDesc(W, 'ethereum');
      if (d && hasOwnU(d, 'value') && looksLikeProvider(d.value)) wrapProvider(d.value);
      trapFree();
      for (let i = 0; i < GLOBAL_NAMES.length; i++) scanGlobal(GLOBAL_NAMES[i]);
      let w3; try { w3 = W.web3; } catch (_) {}
      if (w3 && looksLikeProvider(w3.currentProvider)) wrapProvider(w3.currentProvider);
    } catch (_) {}
  }
  let scans = 0;
  const iv = setI(() => { scan(); if (++scans > 600) { clearI(iv); setI(scan, 2000); } }, 50);
  addL('DOMContentLoaded', scan, true);
  addL('load', scan, true);
  scan(); // providers already injected by a wallet that ran before this script
})();
