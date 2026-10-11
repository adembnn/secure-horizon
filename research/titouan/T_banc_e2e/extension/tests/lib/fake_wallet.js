/* Portefeuille SIMULE (EIP-1193). Aucune cle, aucun reseau. Adresse de test uniquement. */
(function () {
  var script = document.currentScript;
  var qs = new URLSearchParams(location.search);
  var mode = (script && script.dataset.w) || qs.get('w') || 'assign';
  var ADDR = '0xa11ce00000000000000000000000000000000001';
  var calls = (window.__walletCalls = window.__walletCalls || []);
  window.__expect = window.__expect || {}; window.__expectProps = window.__expectProps || {};

  function Emitter() { this._l = {}; }
  Emitter.prototype.on = function on(e, f) { (this._l[e] = this._l[e] || []).push(f); return this; };
  Emitter.prototype.removeListener = function removeListener(e, f) { this._l[e] = (this._l[e] || []).filter(function (x) { return x !== f; }); return this; };
  Emitter.prototype.emit = function emit(e) { var a = [].slice.call(arguments, 1); (this._l[e] || []).forEach(function (f) { f.apply(null, a); }); return (this._l[e] || []).length > 0; };

  function resultFor(m) {
    switch (m) {
      case 'eth_requestAccounts': case 'eth_accounts': return [ADDR];
      case 'eth_chainId': return '0x1';
      case 'eth_sendTransaction': case 'eth_sendRawTransaction': return '0x' + 'ab'.repeat(32);
      case 'eth_signTransaction': return '0x' + 'ee'.repeat(40);
      case 'wallet_sendCalls': return { id: '0x01' };
      case 'personal_sign': case 'eth_sign': return '0x' + 'cd'.repeat(65);
      default:
        if (m && m.indexOf('eth_signTypedData') === 0) return '0x' + 'cd'.repeat(65);
        return null;
    }
  }

  function makeWallet(name, flags) {
    var p = new Emitter();
    Object.keys(flags || {}).forEach(function (k) { p[k] = flags[k]; });
    p.chainId = '0x1'; p.selectedAddress = ADDR; p.networkVersion = '1'; p._wallet = name;
    p.request = function request(args) {
      calls.push({ wallet: name, via: 'request', method: args && args.method, params: JSON.parse(JSON.stringify(args && args.params === undefined ? null : args.params)) });
      return Promise.resolve(resultFor(args && args.method));
    };
    p.send = function send(a, b) {
      var self = this;
      if (typeof a === 'string') return Promise.resolve().then(function () { return Promise.resolve().then(function () { return self.request({ method: a, params: b }); }); }); // rappelle request() en interne, en asynchrone
      if (typeof b === 'function') return this.sendAsync(a, b);
      return { id: a.id, jsonrpc: '2.0', result: resultFor(a.method) };
    };
    p.sendAsync = function sendAsync(payload, cb) {
      if (Array.isArray(payload)) {
        calls.push({ wallet: name, via: 'sendAsync-batch', n: payload.length, methods: payload.map(function (x) { return x.method; }) });
        cb(null, payload.map(function (x) { return { id: x.id, jsonrpc: '2.0', result: resultFor(x.method) }; }));
        return;
      }
      calls.push({ wallet: name, via: 'sendAsync', method: payload.method, params: JSON.parse(JSON.stringify(payload.params === undefined ? null : payload.params)) });
      cb(null, { id: payload.id, jsonrpc: '2.0', result: resultFor(payload.method) });
    };
    p.enable = function enable() { return this.request({ method: 'eth_requestAccounts' }); };
    window.__expect[name] = Function.prototype.toString.call(p.request);
    window.__expectProps[name] = Object.getOwnPropertyNames(p.request).join();
    return p;
  }
  window.__makeWallet = makeWallet;

  var mm = makeWallet('MetaMask', { isMetaMask: true });
  var rabby = makeWallet('Rabby', { isRabby: true, isMetaMask: true });
  var cb = makeWallet('Coinbase', { isCoinbaseWallet: true });
  window.__wallets = { MetaMask: mm, Rabby: rabby, Coinbase: cb };

  function announce(w, info, freeze) {
    var d = { info: info, provider: w };
    window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail: freeze ? Object.freeze(d) : d }));
  }
  var infoMM = { uuid: '11111111-1111-4111-8111-111111111111', name: 'MetaMask', icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>', rdns: 'io.metamask' };
  var infoRb = { uuid: '22222222-2222-4222-8222-222222222222', name: 'Rabby', icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>', rdns: 'io.rabby' };

  switch (mode) {
    case 'assign': window.ethereum = mm; break;
    case 'define': Object.defineProperty(window, 'ethereum', { value: mm, writable: true, configurable: true }); break;
    case 'define-locked': Object.defineProperty(window, 'ethereum', { value: mm, writable: false, configurable: false }); break;
    case 'getter': Object.defineProperty(window, 'ethereum', { get: function () { return mm; }, set: function () {}, configurable: true }); break;
    case 'late': setTimeout(function () { window.ethereum = mm; }, 400); break;
    case 'late-define': setTimeout(function () { Object.defineProperty(window, 'ethereum', { value: mm, configurable: true, writable: true }); }, 400); break;
    case 'late-delete': window.ethereum = { fake: true }; setTimeout(function () { delete window.ethereum; window.ethereum = mm; }, 400); break;
    case 'multi': mm.providers = [cb, mm]; window.ethereum = mm; break;
    case 'multi-sep':
      window.ethereum = Object.assign(new Emitter(), { isMetaMask: true, providers: [rabby, cb] });
      window.ethereum.request = function request(a) { return rabby.request(a); };
      break;
    case 'e6963': case 'e6963-frozen':
      window.addEventListener('eip6963:requestProvider', function () { announce(mm, infoMM, mode === 'e6963-frozen'); announce(rabby, infoRb, mode === 'e6963-frozen'); });
      break;
    case 'frozen-provider': Object.freeze(mm); window.ethereum = mm; break;
    case 'none': break;
  }
})();
