/* Mini dApp de test : expose window.__t pour que le harnais pilote les appels. */
(function () {
  var qs = new URLSearchParams(location.search);
  function code(e) { return e && (e.code !== undefined ? e.code : null); }
  function wrap(p) {
    return p.then(function (r) { return { ok: true, result: r }; }, function (e) { return { ok: false, code: code(e), message: e && e.message }; });
  }
  var eip = [];
  window.addEventListener('eip6963:announceProvider', function (ev) { eip.push(ev.detail); });
  window.dispatchEvent(new Event('eip6963:requestProvider'));

  function EthersLike(eth) { this.eth = eth; }
  EthersLike.prototype.send = function (method, params) { return this.eth.request({ method: method, params: params }); };
  function legacyCb(eth, kind, payload) {
    return new Promise(function (resolve) {
      var cb = function (err, resp) {
        var e = err || (resp && !Array.isArray(resp) && resp.error);
        resolve({ ok: !e, result: resp && resp.result, code: err ? code(err) : (resp && resp.error && resp.error.code), message: err ? err.message : (resp && resp.error && resp.error.message), resp: resp });
      };
      if (kind === 'sendAsync') eth.sendAsync(payload, cb); else eth.send(payload, cb);
    });
  }
  window.__t = {
    qs: qs.get('w'),
    hasEthereum: function () { return typeof window.ethereum !== 'undefined'; },
    request: function (m, p) { return wrap(window.ethereum.request({ method: m, params: p })); },
    ethersLike: function (m, p) { return wrap(new EthersLike(window.ethereum).send(m, p)); },
    sendAsync: function (payload) { return legacyCb(window.ethereum, 'sendAsync', payload); },
    sendCb: function (payload) { return legacyCb(window.ethereum, 'send', payload); },
    sendLegacyStr: function (m, p) { return wrap(window.ethereum.send(m, p)); },
    enable: function () { return wrap(window.ethereum.enable()); },
    eipInfo: function () { return eip.map(function (d) { return { name: d.info.name, isMetaMask: d.provider.isMetaMask, isRabby: d.provider.isRabby }; }); },
    callEip: function (i, m, p) { return wrap(eip[i].provider.request({ method: m, params: p })); },
    providersList: function () { return (window.ethereum && window.ethereum.providers || []).map(function (x) { return x._wallet; }); },
    callProviderIdx: function (i, m, p) { return wrap(window.ethereum.providers[i].request({ method: m, params: p })); },
    walletCalls: function () { return window.__walletCalls; },
    clearCalls: function () { window.__walletCalls.length = 0; },
    setText: function (s) {
      var d = document.getElementById('txt');
      if (!d) { d = document.createElement('div'); d.id = 'txt'; document.body.appendChild(d); }
      d.textContent = s;
    },
    mutateAfter: function () {
      var tx = { from: '0xa11ce00000000000000000000000000000000001', to: '0x1234567890abcdef1234567890abcdef12345678', value: '0x1' };
      var pr = window.ethereum.request({ method: 'eth_sendTransaction', params: [tx] });
      setTimeout(function () { tx.to = '0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddead'; tx.value = '0xffff'; }, 50);
      return wrap(pr);
    }
  };
  window.addEventListener('message', function (ev) {
    var d = ev.data; if (!d || d.rpc !== 'run') return;
    Promise.resolve(window.__t[d.fn].apply(window.__t, d.args || [])).then(function (r) {
      ev.source.postMessage({ rpc: 'done', id: d.id, r: JSON.parse(JSON.stringify(r === undefined ? null : r)) }, '*');
    });
  });
})();
