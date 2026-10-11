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
    clamped: (label, s) => label + ' : valeur ramenée à ' + s + ' s.',
    failed: 'Les réglages n’ont pas pu être enregistrés. Rien n’a changé.',
    empty: 'Aucune adresse pour l’instant.',
    remove: 'Retirer'
  };

  // ---- pure helpers (tested in tests/unit/options.test.mjs)
  function networkLines(manifest) {
    const csp = manifest && manifest.content_security_policy && manifest.content_security_policy.extension_pages || '';
    const tokens = 'Pour lire le nom d’un jeton qu’il ne connaît pas, Hold up interroge ton portefeuille, en lecture seule.';
    if (/connect-src\s+'none'/.test(csp)) return ['Cette version n’appelle aucun réseau. Le moteur est dans l’extension et ta phrase est lue par mots-clés, dans le navigateur.', tokens];
    const relay = /127\.0\.0\.1:8789/.test(csp), server = /127\.0\.0\.1:8787/.test(csp);
    const out = [];
    if (server) out.push('Version avec serveur local : le moteur tourne sur ton ordinateur.');
    else out.push('Le moteur est dans l’extension.');
    if (relay) out.push('Une seule chose sort du navigateur : la phrase que tu écris. Elle va au relais local, sur ton ordinateur, qui la transmet au modèle Clef pour la classer. Relais arrêté, elle est lue par mots-clés, dans le navigateur.');
    else if (!server) out.push('Ta phrase est lue par mots-clés, dans le navigateur.');
    out.push(tokens);
    return out;
  }
  // seconds typed -> { ms, clamped }
  function seconds(value, key) {
    const [lo, hi] = LIMITS[key], n = Math.round(Number(String(value).replace(',', '.')) * 1000);
    if (!Number.isFinite(n)) return { ms: PRODUCT[key], clamped: true };
    const ms = Math.min(hi, Math.max(lo, n));
    return { ms, clamped: ms !== n };
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
  global.HoldupOptions = { networkLines, seconds, checkEntry, buildContext, readContext, TEXT };

  // ---- the page
  const doc = global.document;
  if (!doc || !doc.getElementById || !doc.getElementById('save') || !global.chrome) return;
  const $ = (id) => doc.getElementById(id);
  const el = (tag, text, cls) => { const e = doc.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };
  let contacts = [], mine = [], spenders = [], oldContext = null, sayTimer = null;
  function say(text, error) {
    const m = $('msg'); m.textContent = text; m.className = error ? 'error' : '';
    clearTimeout(sayTimer); if (!error) sayTimer = setTimeout(() => { if (m.textContent === text) m.textContent = ''; }, 4000);
  }
  function drawList(id, items, label, onRemove) {
    const box = $(id); while (box.firstChild) box.removeChild(box.firstChild);
    if (!items.length) { box.appendChild(el('li', TEXT.empty, 'hint')); return; }
    items.forEach((it, i) => {
      const li = el('li');
      if (label) li.appendChild(el('span', it.label, 'name'));
      li.appendChild(el('code', label ? it.address : it));
      const b = el('button', TEXT.remove); b.type = 'button'; b.setAttribute('aria-label', TEXT.remove + ' ' + (label ? it.label : it));
      b.addEventListener('click', () => onRemove(i));
      li.appendChild(b); box.appendChild(li);
    });
  }
  function draw() {
    drawList('contacts', contacts, true, (i) => { contacts.splice(i, 1); draw(); });
    drawList('mine', mine, false, (i) => { mine.splice(i, 1); draw(); });
    drawList('spenders', spenders, false, (i) => { spenders.splice(i, 1); draw(); });
  }
  function fill(cfg) {
    $('limitUnlimited').checked = cfg.limitUnlimited !== false;
    $('askIntent').value = cfg.askIntent === true ? 'always' : cfg.askIntent === false ? 'never' : ['never', 'rights_or_funds', 'always'].includes(cfg.askIntent) ? cfg.askIntent : 'always';
    $('dangerWait').value = Math.round((cfg.dangerWaitMs ?? cfg.frictionMs ?? PRODUCT.dangerWaitMs) / 1000);
    $('manipHold').value = Math.round((cfg.manipulationHoldMs ?? PRODUCT.manipulationHoldMs) / 1000);
  }
  async function load() {
    let stored = {};
    try { stored = await global.chrome.storage.local.get(['cfg', 'contexte']); } catch (_) {}
    fill(stored.cfg && typeof stored.cfg === 'object' ? stored.cfg : {});
    oldContext = stored.contexte || null;
    const c = readContext(oldContext); contacts = c.contacts; mine = c.mine; spenders = c.spenders;
    draw();
    let mf = {}; try { mf = global.chrome.runtime.getManifest() || {}; } catch (_) {}
    const net = $('net'); while (net.firstChild) net.removeChild(net.firstChild);
    for (const line of networkLines(mf)) net.appendChild(el('p', line));
  }
  $('addContact').addEventListener('click', () => {
    const r = checkEntry($('contactName').value, $('contactAddress').value, contacts, true);
    if (!r.ok) return say(r.error, true);
    contacts.push(r.entry); $('contactName').value = ''; $('contactAddress').value = ''; say(''); draw();
  });
  $('addMine').addEventListener('click', () => {
    const r = checkEntry('', $('mineAddress').value, mine, false);
    if (!r.ok) return say(r.error, true);
    mine.push(r.entry); $('mineAddress').value = ''; say(''); draw();
  });
  $('addSpender').addEventListener('click', () => {
    const r = checkEntry('', $('spenderAddress').value, spenders, false);
    if (!r.ok) return say(r.error, true);
    spenders.push(r.entry); $('spenderAddress').value = ''; say(''); draw();
  });
  $('save').addEventListener('click', async () => {
    const d = seconds($('dangerWait').value, 'dangerWaitMs'), h = seconds($('manipHold').value, 'manipulationHoldMs');
    const cfg = { askIntent: $('askIntent').value, dangerWaitMs: d.ms, manipulationHoldMs: h.ms, limitUnlimited: $('limitUnlimited').checked };
    try {
      const next = buildContext(oldContext, contacts, mine, spenders);
      await global.chrome.storage.local.set({ cfg, contexte: next });
      oldContext = next; fill(cfg);
      // a value outside the limits is corrected, and said
      const notes = []; if (d.clamped) notes.push(TEXT.clamped('Attente', d.ms / 1000)); if (h.clamped) notes.push(TEXT.clamped('Retenue', h.ms / 1000));
      say([TEXT.saved].concat(notes).join(' '));
    } catch (_) { say(TEXT.failed, true); }
  });
  load();
})(typeof window !== 'undefined' ? window : globalThis);
