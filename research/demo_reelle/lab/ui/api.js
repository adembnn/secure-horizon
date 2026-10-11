/* Hold up Lab : accès à l'API. Bascule sur mock.js seulement si /api/health ne répond pas au démarrage.
   Adresse du serveur : ?api=http://127.0.0.1:8800 dans l'URL, sinon http://127.0.0.1:8800
   (ou la même origine quand l'interface est servie par le serveur du Lab lui-même). */
(function (global) {
  'use strict';

  var DEFAULT_BASE = 'http://127.0.0.1:8800';
  var q = new URLSearchParams(global.location.search);
  var base = q.get('api') != null ? q.get('api').replace(/\/+$/, '') : (global.location.port === '8800' ? '' : DEFAULT_BASE);
  var api = { mode: 'pending', base: base, baseLabel: base || global.location.origin, forced: q.get('mock') === '1' };

  function withTimeout(ms) {
    var c = new AbortController();
    var t = setTimeout(function () { c.abort(); }, ms);
    return { signal: c.signal, done: function () { clearTimeout(t); } };
  }

  function call(method, path, body, timeoutMs) {
    if (api.mode === 'mock') return global.Lab.mock.handle(method, path, body);
    var to = withTimeout(timeoutMs || 60000);
    var opts = { method: method, signal: to.signal, headers: {} };
    if (body !== undefined) { opts.headers['content-type'] = 'application/json'; opts.body = JSON.stringify(body); }
    return fetch(base + path, opts).then(function (res) {
      to.done();
      return res.text().then(function (txt) {
        var data = null;
        try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = null; }
        if (!res.ok) {
          var msg = data && (data.message || data.error) ? String(data.message || data.error) : 'Réponse ' + res.status;
          var err = new Error(msg); err.status = res.status; throw err;
        }
        return data;
      });
    }, function (e) {
      to.done();
      var err = new Error(e && e.name === 'AbortError' ? 'Le serveur met trop de temps à répondre.' : 'Le serveur ne répond pas.');
      err.network = true;
      throw err;
    });
  }

  /* Détecte le serveur réel ; sinon passe en exemple. Résout avec { mode, health }. */
  api.detect = function () {
    if (api.forced) { api.mode = 'mock'; return global.Lab.mock.handle('GET', '/api/health').then(function (h) { return { mode: 'mock', health: h }; }); }
    api.mode = 'live';
    var to = withTimeout(1800);
    return fetch(base + '/api/health', { signal: to.signal }).then(function (r) {
      to.done();
      if (!r.ok) throw new Error('health ' + r.status);
      return r.json();
    }).then(function (h) {
      api.mode = 'live';
      return { mode: 'live', health: h };
    }, function () {
      to.done();
      api.mode = 'mock';
      return global.Lab.mock.handle('GET', '/api/health').then(function (h) { return { mode: 'mock', health: h }; });
    });
  };

  api.health = function () { return call('GET', '/api/health', undefined, 4000); };
  api.scenarios = function () { return call('GET', '/api/scenarios'); };
  api.run = function (body) {
    /* une attaque construite par le moteur d'exemple se rejoue par le moteur d'exemple */
    if (api.mode === 'live' && body && body.scenario && body.scenario._mock) return global.Lab.mock.handle('POST', '/api/run', body);
    return call('POST', '/api/run', body);
  };
  api.runAll = function (body) { return call('POST', '/api/run-all', body || {}, 300000); };
  api.custom = function (body) { return call('POST', '/api/custom', body); };
  api.reset = function () { return call('POST', '/api/reset', {}); };

  /* Routes d'attaque : si le serveur réel ne les a pas encore (404 ou injoignable), on bascule sur l'exemple. */
  api.attackMock = false;
  function attack(method, path, body) {
    if (api.mode === 'mock' || api.attackMock) return global.Lab.mock.handle(method, path, body);
    return call(method, path, body).catch(function (e) {
      if (path === '/api/attack/options' && (e.status === 404 || e.status === 405 || e.network)) {
        api.attackMock = true;
        return global.Lab.mock.handle(method, path, body);
      }
      throw e;
    });
  }
  api.attackOptions = function () { return attack('GET', '/api/attack/options'); };
  api.attackBuild = function (body) { return attack('POST', '/api/attack/build', body); };
  api.attackSave = function (body) { return attack('POST', '/api/attack/save', body); };
  api.attackLog = function () { return attack('GET', '/api/attack/log'); };
  api.attackIsSample = function () { return api.mode === 'mock' || api.attackMock; };

  global.Lab = global.Lab || {};
  global.Lab.api = api;
})(window);
