/* Hold up - settings page, ONE source for every build (extension/options.html + this file ; the standalone builds copy both).
 * Only known keys are stored : nothing typed here can add a test or automatic mode. No JSON to write by hand : plain fields.
 * What the page says about the network is read from the manifest of the build that is running, so it cannot say something false :
 *   connect-src 'none'            -> this build calls nothing ;
 *   connect-src with the relay    -> the written sentence goes to the local relay, which hands it to the model ;
 *   connect-src with the engine   -> the engine also runs as a local server. */
(function (global) {
  'use strict';
  const PRODUCT = { dangerWaitMs: 30000, manipulationHoldMs: 600000 };
  const LIMITS = { dangerWaitMs: [5000, 600000], manipulationHoldMs: [30000, 3600000] };
  const HEX20 = /^0x[0-9a-fA-F]{40}$/;
  const TEXT = {
    saved: 'Enregistré.',
    badAddress: 'Cette adresse n’est pas valide. Elle commence par 0x et compte 42 caractères.',
    noName: 'Donne un nom à cette adresse.',
    twice: 'Cette adresse est déjà dans la liste.',
    full: 'La liste est pleine (200 adresses).',
    badSeconds: (lo, hi, kept) => 'Entre ' + lo + ' et ' + hi + ' secondes. J’ai gardé ' + kept + '.',
    badMinutes: (lo, hi, kept) => 'Entre ' + lo + ' et ' + hi + ' minutes. J’ai gardé ' + kept + '.',
    failed: 'Les réglages n’ont pas pu être enregistrés. Rien n’a changé.',
    empty: 'Aucune adresse pour l’instant.',
    remove: 'Retirer'
  };

  // ---- pure helpers (tested in tests/unit/options.test.mjs)
  function networkLines(manifest) {
    const csp = manifest && manifest.content_security_policy && manifest.content_security_policy.extension_pages || '';
    const coins = 'Pour lire le nom d’une monnaie qu’il ne connaît pas, Hold up interroge ton portefeuille, en lecture seule.';
    if (/connect-src\s+'none'/.test(csp)) return ['Cette version n’appelle aucun réseau. Le moteur est dans l’extension et ta phrase est lue par mots-clés, dans le navigateur.', coins];
    const relay = /127\.0\.0\.1:8789/.test(csp), server = /127\.0\.0\.1:8787/.test(csp);
    const out = [];
    if (server) out.push('Version avec serveur local : le moteur tourne sur ton ordinateur.');
    else out.push('Le moteur est dans l’extension.');
    if (relay) out.push('Une seule chose sort du navigateur : la phrase que tu écris. Elle va au relais local, sur ton ordinateur, qui la transmet au modèle Clef pour la classer. Relais arrêté, elle est lue par mots-clés, dans le navigateur.');
    else if (!server) out.push('Ta phrase est lue par mots-clés, dans le navigateur.');
    out.push(coins);
    return out;
  }
  // seconds typed -> { ms, clamped }
  function seconds(value, key) {
    const [lo, hi] = LIMITS[key], n = Math.round(Number(String(value).replace(',', '.')) * 1000);
    if (!Number.isFinite(n)) return { ms: PRODUCT[key], clamped: true };
    const ms = Math.min(hi, Math.max(lo, n));
    return { ms, clamped: ms !== n };
  }
  // minutes typed -> { ok, ms } ; whole minutes from 1 to 60 (the stored value stays in ms)
  function minutes(value) {
    const t = String(value == null ? '' : value).trim().replace(',', '.'), n = Number(t);
    if (t === '' || !Number.isFinite(n) || n !== Math.round(n) || n < 1 || n > 60) return { ok: false };
    return { ok: true, ms: n * 60000 };
  }
  // whole seconds typed -> { ok, ms }
  function wholeSeconds(value, key) {
    const t = String(value == null ? '' : value).trim().replace(',', '.'), n = Number(t), lim = LIMITS[key];
    if (t === '' || !Number.isFinite(n) || n !== Math.round(n) || n * 1000 < lim[0] || n * 1000 > lim[1]) return { ok: false };
    return { ok: true, ms: n * 1000 };
  }
  // -> { ok, error?, entry? } ; `list` : the addresses already there
  function checkEntry(name, address, list, needName) {
    const a = String(address || '').trim(), n = String(name || '').replace(/\s+/g, ' ').trim().slice(0, 40);
    if (!HEX20.test(a)) return { ok: false, error: TEXT.badAddress };
    if (needName && !n) return { ok: false, error: TEXT.noName };
    if ((list || []).some((x) => String(x.address || x).toLowerCase() === a.toLowerCase())) return { ok: false, error: TEXT.twice };
    if ((list || []).length >= 200) return { ok: false, error: TEXT.full };
    return { ok: true, entry: needName ? { label: n, address: a } : a };
  }
  // The stored context, with the lists this page edits replaced. Everything else it holds (history, tokens) is kept as is.
  // `spenders` (undefined : left untouched) : the contracts a right may be given to, beyond the public list (written_check.js).
  function buildContext(old, contacts, mine, spenders) {
    const o = old && typeof old === 'object' && !Array.isArray(old) ? old : {};
    return Object.assign({ history: [], knownSpenders: [] }, o, Array.isArray(spenders) ? { knownSpenders: spenders.filter((a) => HEX20.test(a)) } : {}, {
      contacts: contacts.filter((c) => c && HEX20.test(c.address)).map((c) => ({ label: String(c.label || '').slice(0, 40), address: c.address })),
      protected: mine.filter((a) => HEX20.test(a))
    });
  }
  function readContext(contexte) {
    const c = contexte && typeof contexte === 'object' ? contexte : {};
    return {
      contacts: (Array.isArray(c.contacts) ? c.contacts : []).filter((x) => x && HEX20.test(String(x.address || ''))).map((x) => ({ label: String(x.label || x.name || '').slice(0, 40), address: x.address })),
      mine: (Array.isArray(c.protected) ? c.protected : []).filter((a) => HEX20.test(String(a))),
      spenders: (Array.isArray(c.knownSpenders) ? c.knownSpenders : []).filter((a) => HEX20.test(String(a)))
    };
  }
  global.HoldupOptions = { networkLines, seconds, minutes, wholeSeconds, checkEntry, buildContext, readContext, TEXT };

  // ---- the page
  const doc = global.document;
  if (!doc || !doc.getElementById || !doc.getElementById('askIntent') || !global.chrome) return;
  const $ = (id) => doc.getElementById(id);
  const el = (tag, text, cls) => { const e = doc.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };
  const store = global.chrome.storage.local;
  let contacts = [], mine = [], spenders = [], oldContext = null, cfg = {}, sayTimer = null, confirmClear = 0;
  function say(text) { const m = $('msg'); m.textContent = text; clearTimeout(sayTimer); if (text) sayTimer = setTimeout(() => { if (m.textContent === text) m.textContent = ''; }, 4000); }
  function problem(id, text) { $(id).textContent = text || ''; }
  function drawList(id, items, label, onRemove) {
    const box = $(id); while (box.firstChild) box.removeChild(box.firstChild);
    if (!items.length) { box.appendChild(el('p', TEXT.empty, 'hu-2')); return; }
    items.forEach((it, i) => {
      const row = el('div', null, 'hu-set'), left = el('span');
      if (label) { left.appendChild(el('span', it.label)); left.appendChild(el('span', it.address, 'hu-set-msg hu-2')); } else left.appendChild(el('span', it));
      const b = el('button', TEXT.remove, 'hu-word'); b.type = 'button'; b.setAttribute('aria-label', TEXT.remove + ' ' + (label ? it.label : it));
      b.addEventListener('click', () => onRemove(i));
      row.appendChild(left); row.appendChild(b); box.appendChild(row);
    });
  }
  function draw() {
    drawList('contacts', contacts, true, (i) => { contacts.splice(i, 1); draw(); saveContext(); });
    drawList('mine', mine, false, (i) => { mine.splice(i, 1); draw(); saveContext(); });
    drawList('spenders', spenders, false, (i) => { spenders.splice(i, 1); draw(); saveContext(); });
  }
  const keptSeconds = () => Math.round((cfg.dangerWaitMs ?? cfg.frictionMs ?? PRODUCT.dangerWaitMs) / 1000);
  const keptMinutes = () => Math.round((cfg.manipulationHoldMs ?? PRODUCT.manipulationHoldMs) / 60000);
  function fill() {
    $('limitUnlimited').checked = cfg.limitUnlimited !== false;
    $('askIntent').value = cfg.askIntent === true ? 'always' : cfg.askIntent === false ? 'never' : ['never', 'rights_or_funds', 'always'].includes(cfg.askIntent) ? cfg.askIntent : 'always';
    $('dangerWait').value = keptSeconds();
    $('manipHold').value = Math.min(60, Math.max(1, keptMinutes()));
  }
  function mark(input, errId, bad, text) {
    if (bad) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    const box = $(errId); while (box.firstChild) box.removeChild(box.firstChild);
    if (bad) { box.appendChild(doc.createTextNode(' ')); box.appendChild(el('span', text, 'hu-error')); }
  }
  // read the stored cfg again, assign the four keys, write : any other key already there is kept
  async function saveCfg() {
    const d = wholeSeconds($('dangerWait').value, 'dangerWaitMs'), h = minutes($('manipHold').value);
    const kd = keptSeconds(), kh = Math.min(60, Math.max(1, keptMinutes()));
    mark($('dangerWait'), 'dangerErr', !d.ok, TEXT.badSeconds(5, 600, kd));
    mark($('manipHold'), 'holdErr', !h.ok, TEXT.badMinutes(1, 60, kh));
    try {
      let current = {}; try { const s = await store.get('cfg'); if (s.cfg && typeof s.cfg === 'object') current = s.cfg; } catch (_) {}
      const next = Object.assign({}, current, {
        askIntent: $('askIntent').value, limitUnlimited: $('limitUnlimited').checked,
        dangerWaitMs: d.ok ? d.ms : (current.dangerWaitMs ?? PRODUCT.dangerWaitMs), manipulationHoldMs: h.ok ? h.ms : (current.manipulationHoldMs ?? PRODUCT.manipulationHoldMs)
      });
      await store.set({ cfg: next }); cfg = next;
      if (!d.ok) $('dangerWait').value = kd;
      if (!h.ok) $('manipHold').value = kh;
      say(TEXT.saved);
    } catch (_) { say(TEXT.failed); }
  }
  async function saveContext() {
    try {
      let old = oldContext; try { old = (await store.get('contexte')).contexte || old; } catch (_) {}
      const next = buildContext(old, contacts, mine, spenders);
      await store.set({ contexte: next }); oldContext = next; say(TEXT.saved);
    } catch (_) { say(TEXT.failed); }
  }
  async function load() {
    let stored = {};
    try { stored = await store.get(['cfg', 'contexte']); } catch (_) {}
    cfg = stored.cfg && typeof stored.cfg === 'object' ? stored.cfg : {};
    fill();
    oldContext = stored.contexte || null;
    const c = readContext(oldContext); contacts = c.contacts; mine = c.mine; spenders = c.spenders;
    draw();
    let mf = {}; try { mf = global.chrome.runtime.getManifest() || {}; } catch (_) {}
    const net = $('net'); while (net.firstChild) net.removeChild(net.firstChild);
    for (const line of networkLines(mf)) net.appendChild(el('p', line, 'hu-2'));
  }
  for (const id of ['askIntent', 'limitUnlimited', 'dangerWait', 'manipHold']) $(id).addEventListener('change', saveCfg);
  function adder(btn, errId, read, list, clear) {
    $(btn).addEventListener('click', () => {
      const r = read(); problem(errId, '');
      if (!r.ok) return problem(errId, r.error);
      list().push(r.entry); clear(); draw(); saveContext();
    });
  }
  adder('addContact', 'contactsErr', () => checkEntry($('contactName').value, $('contactAddress').value, contacts, true), () => contacts, () => { $('contactName').value = ''; $('contactAddress').value = ''; });
  adder('addMine', 'mineErr', () => checkEntry('', $('mineAddress').value, mine, false), () => mine, () => { $('mineAddress').value = ''; });
  adder('addSpender', 'spendersErr', () => checkEntry('', $('spenderAddress').value, spenders, false), () => spenders, () => { $('spenderAddress').value = ''; });
  $('exportLog').addEventListener('click', async () => {
    let chain = null; try { chain = (await store.get('chain')).chain; } catch (_) {}
    const body = JSON.stringify({ format: 'holdup-journal', version: 1, anchor: chain && chain.anchor || null, entries: chain && Array.isArray(chain.entries) ? chain.entries : [] }, null, 1);
    const a = doc.createElement('a'); a.href = global.URL.createObjectURL(new global.Blob([body], { type: 'application/json' })); a.download = 'holdup-journal.json'; a.click();
  });
  $('clearLog').addEventListener('click', async () => {
    const b = $('clearLog');
    if (Date.now() - confirmClear >= 5000) {
      confirmClear = Date.now(); b.textContent = 'Effacer pour de bon ?';
      setTimeout(() => { if (Date.now() - confirmClear >= 5000) b.textContent = 'Effacer le journal'; }, 5100);
      return;
    }
    confirmClear = 0; b.textContent = 'Effacer le journal';
    try { await store.remove(['log', 'chain']); say(TEXT.saved); } catch (_) { say(TEXT.failed); }
  });
  load();
})(typeof window !== 'undefined' ? window : globalThis);
