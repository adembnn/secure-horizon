// Hold up - demo web. Tout tourne dans cette page : aucun appel reseau, aucun serveur, aucun vrai portefeuille.
import { h, $, clear, renderVerdict } from './ui.js';
import { SCENARIOS, GROUPES, WALLET, LOCAL, INTENTS, intentLabel, localOf } from './scenarios.js';
import { holdRequest } from './holdup.js';
import { check, displayLevel, withIntent, sanitizeLocalContext } from './verdict_model.js';
import { parsePasted, EXEMPLE_TX, EXEMPLE_TYPED } from './paste.js';
import EXEMPLES from './exemples_public.js';
import * as J from './journal.js';

const { storage, persistent } = J.browserStorage();
const logEntry = (e) => { try { J.append(storage, e); } catch (_) { /* le journal ne doit jamais bloquer la demo */ } };

// ------------------------------------------------------------------ navigation
const VIEWS = ['demo', 'colle', 'journal'];
function route() {
  const k = VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'demo';
  for (const v of VIEWS) { $('#view-' + v).hidden = v !== k; const a = $('#nav-' + v); if (a) { if (v === k) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); } }
  if (k === 'journal') renderJournal();
}
addEventListener('hashchange', route);

// ------------------------------------------------------------------ 1) demo : faux site + faux portefeuille
const cfg = { delay: 5, ask: true };
let selected = null;

function ethOf(hex) {
  try { const v = BigInt(hex || '0x0'); const whole = v / 10n ** 18n; const frac = (v % 10n ** 18n).toString().padStart(18, '0').slice(0, 4).replace(/0+$/, ''); return whole + (frac ? ',' + frac : '') + ' ETH'; } catch (_) { return String(hex); }
}
function rawRows(body) {
  const p = body.params[0];
  if (body.method === 'eth_sendTransaction') {
    const data = p.data || '0x';
    const rows = [['Réseau', 'Ethereum (fictif)'], ['À', p.to], ['Montant', ethOf(p.value)], ['Données', data === '0x' ? 'aucune' : data.slice(0, 10) + '… (' + Math.max(0, (data.length - 2) / 2) + ' octets)']];
    if (data.startsWith('0x095ea7b3') && data.length === 2 + 8 + 128) { // approve(spender, montant) : un portefeuille affiche le plafond demandé
      const amt = BigInt('0x' + data.slice(34 + 40, 10 + 128));
      rows.push(['Autorise', '0x' + data.slice(34, 74)], ['Plafond demandé', amt >= 2n ** 255n ? 'illimité' : (amt % 1000000n === 0n ? String(amt / 1000000n) : String(amt)) + (amt % 1000000n === 0n ? ' USDC' : ' (unité brute)')]);
    }
    return rows;
  }
  let td = {}; try { td = JSON.parse(body.params[1]); } catch (_) { /* rien */ }
  return [['Type', 'Message à signer (EIP-712)'], ['Application', (td.domain && td.domain.name) || '—'], ['Contrat', (td.domain && td.domain.verifyingContract) || '—'], ['Contenu', JSON.stringify(td.message || {}).slice(0, 140) + '…']];
}

function buildDemo() {
  const list = $('#scen-list');
  for (const g of GROUPES) {
    list.append(h('li', { class: 'grp' }, h('h3', {}, g)));
    for (const s of SCENARIOS.filter((x) => x.groupe === g)) {
      list.append(h('li', {}, h('button', { class: 'scen', type: 'button', 'data-id': s.id, 'aria-pressed': 'false', onclick: () => select(s.id) },
        h('span', { class: 'scen-t' }, s.titre), s.synthetique ? h('span', { class: 'scen-syn' }, 'Scène synthétique, adresses factices') : null, h('span', { class: 'scen-s' }, s.resume))));
    }
  }
  $('#cfg-delay').addEventListener('change', (e) => { cfg.delay = Number(e.target.value); });
  $('#cfg-ask').addEventListener('change', (e) => { cfg.ask = e.target.checked; });
  const w = $('#wallet-id');
  w.append(h('strong', {}, WALLET.name), ' ', h('span', { class: 'tag' }, 'FICTIF'), h('br'), h('code', {}, WALLET.address), h('br'),
    h('span', { class: 'muted' }, WALLET.balances.map(([s, a]) => a + ' ' + s).join(' · ')));
  select(null);
}
function select(id) {
  selected = SCENARIOS.find((s) => s.id === id) || null;
  for (const b of document.querySelectorAll('.scen')) b.setAttribute('aria-pressed', String(b.dataset.id === id));
  const box = clear($('#wallet-req')); clear($('#wallet-out'));
  if (!selected) { box.append(h('p', { class: 'muted' }, 'Choisis un scénario à gauche : le faux site demande une signature à ce faux portefeuille.')); return; }
  const s = selected;
  const rows = (list) => h('dl', { class: 'raw' }, list.map(([k, v]) => h('div', {}, h('dt', {}, k), h('dd', {}, h('code', {}, v)))));
  box.append(
    s.synthetique ? h('p', { class: 'syn' }, 'Scène synthétique, adresses factices. Elle montre le décodage, pas une attaque de bout en bout.') : null,
    h('p', { class: 'req-from' }, h('b', {}, s.site), ' · ', h('code', {}, s.origin)),
    h('p', { class: 'req-what' }, 'Ce que le site te dit : ' + s.resume),
    s.affiche ? h('div', { class: 'shown' }, h('h4', {}, 'Ce que l’écran du coffre affiche (fictif)'), rows(s.affiche), h('h4', {}, 'Ce que le portefeuille reçoit')) : null,
    rows(s.brut || rawRows(s.body)),
    h('p', { class: 'muted hint' }, hintOf(s)),
    h('div', { class: 'wallet-actions' },
      h('button', { class: 'btn btn-wallet-no', type: 'button', onclick: () => { $('#wallet-out').textContent = 'Tu as rejeté la demande dans le portefeuille. Rien n’a été signé.'; } }, 'Rejeter'),
      h('button', { class: 'btn btn-wallet-yes', type: 'button', id: 'sign-btn', onclick: () => sign(s) }, 'Signer')));
}
// Phrase d'aide sous la requête : la reponse honnete, et ce que la scene montre en plus.
function hintOf(s) {
  const base = 'Réponse honnête à la question de Hold up : « ' + intentLabel(s.intentHonnete) + ' ». Essaie aussi une autre réponse : elle ne peut que relever l’alerte, jamais la baisser.';
  if (s.id === 'echange_routeur_connu') return base + ' Sans réponse, ce routeur connu passe sans alerte : c’est ta phrase qui fait voir l’écart.';
  if (s.synthetique) return base + ' Le niveau ne dépend pas de ta phrase : décoche la question d’intention et le résultat ne change pas.';
  return base;
}
async function sign(s) {
  const btn = $('#sign-btn'); btn.disabled = true;
  const out = clear($('#wallet-out'));
  const r = await holdRequest({ body: s.body, local: localOf(s), delaySec: cfg.delay, askIntent: cfg.ask, siteLabel: s.site, intentDetails: s.intentDetails || null, ecrit: s.ecrit || '', honnete: s.intentHonnete, corrige: s.corrige || null });
  btn.disabled = false;
  logEntry({ source: 'demo', scenario: s.id, intent: r.intentKey, level: r.level, niveau: r.verdict && r.verdict.niveau, fiche: r.verdict && r.verdict.fiche, decision: r.decision === 'sign' && r.limited ? 'continuer_limite' : r.decision, delay_s: r.delaySec ?? null, ms: r.ms });
  out.textContent = r.decision === 'cancel'
    ? 'Annulé avec Hold up : la demande n’a pas atteint le portefeuille. Rien n’a été signé.'
    : r.limited
      ? 'Tu as choisi de continuer avec ' + s.corrige.label.toLowerCase() + '. Dans cette démo rien n’est signé ni envoyé (faux portefeuille, aucune clé). Avec un vrai portefeuille, c’est la demande limitée qui serait partie ici.'
      : 'Tu as choisi de continuer. Dans cette démo rien n’est signé ni envoyé (faux portefeuille, aucune clé). Avec un vrai portefeuille, la signature serait partie ici.';
}

// ------------------------------------------------------------------ 3) colle une transaction
function buildColle() {
  const sel = $('#colle-intent');
  sel.append(h('option', { value: 'none' }, 'Pas de réponse'), ...INTENTS.map(([k, l]) => h('option', { value: k }, l)));
  const ex = $('#colle-ex');
  ex.append(h('option', { value: '' }, 'Exemples du jeu public (synthétiques)…'), ...EXEMPLES.map((e, i) => h('option', { value: String(i) }, e.id + ' · ' + e.family)));
  ex.addEventListener('change', () => {
    if (ex.value === '') return; const e = EXEMPLES[Number(ex.value)];
    $('#colle-text').value = JSON.stringify(e.request, null, 2); $('#colle-origin').value = e.origin; $('#colle-out').hidden = true;
  });
  $('#colle-ex-tx').addEventListener('click', () => { $('#colle-text').value = JSON.stringify(EXEMPLE_TX, null, 2); $('#colle-origin').value = 'https://site-inconnu.example'; ex.value = ''; });
  $('#colle-ex-typed').addEventListener('click', () => { $('#colle-text').value = JSON.stringify(EXEMPLE_TYPED, null, 2); $('#colle-origin').value = 'https://site-inconnu.example'; ex.value = ''; });
  $('#colle-go').addEventListener('click', verifyPasted);
}
function verifyPasted() {
  const out = $('#colle-out'); out.hidden = false; clear(out);
  const r = parsePasted($('#colle-text').value, { origin: $('#colle-origin').value, intent: $('#colle-intent').value });
  if (r.error) { out.append(h('p', { class: 'error', role: 'alert' }, r.error)); return; }
  const ctxLocal = { contacts: [], history: [], protected: [], knownSpenders: [] }; // en mode colle, le moteur ne connait ni tes contacts ni ton historique
  const b = r.body;
  const sendBody = withIntent(b, b.intent === 'other' ? 'none' : b.intent);
  const v = check(sendBody, sanitizeLocalContext(ctxLocal));
  const box = h('div', { class: 'verdict' });
  renderVerdict(box, v, { body: sendBody, local: ctxLocal, intentKey: b.intent && b.intent !== 'none' ? b.intent : null });
  out.append(box, h('p', { class: 'muted' }, 'Verdict calculé dans cette page, sans contacts ni historique. Rien n’a été envoyé nulle part.' + (r.assumedFrom ? ' La requête n’indique pas quel compte signe : Hold up suppose que c’est toi.' : '')));
  logEntry({ source: 'colle', method: String(b.method).slice(0, 40), intent: b.intent || 'none', level: displayLevel(v).key, niveau: v.niveau, fiche: v.fiche, decision: 'verdict_seul' });
}

// ------------------------------------------------------------------ 5) journal local chaine par hachage
const short = (x) => x.slice(0, 8) + '…' + x.slice(-4);
function renderJournal() {
  const rows = J.readAll(storage); const box = clear($('#journal-list'));
  const v = J.verify(rows);
  $('#journal-status').textContent = rows.length ? (v.ok ? `Chaîne intacte : ${v.n} ligne(s) vérifiée(s).` : `Chaîne CASSÉE à la ligne ${v.brokenAt} : ${v.why}.`) : 'Journal vide : fais une démo ou colle une transaction.';
  $('#journal-status').className = v.ok ? 'status' : 'status status-bad';
  $('#journal-store').textContent = persistent ? 'Stocké dans ce navigateur (localStorage), jamais envoyé.' : 'Stockage du navigateur indisponible : journal gardé en mémoire jusqu’à la fermeture de la page.';
  if (!rows.length) return;
  const table = h('table', { class: 'jt' }, h('caption', { class: 'sr-only' }, 'Journal local chaîné'),
    h('thead', {}, h('tr', {}, ['#', 'Heure', 'Source', 'Niveau', 'Décision', 'Empreinte (précédente → cette ligne)'].map((t) => h('th', { scope: 'col' }, t)))),
    h('tbody', {}, rows.slice().reverse().map((r) => {
      const e = r.entry || {};
      return h('tr', {}, h('td', {}, r.seq), h('td', {}, new Date(r.ts).toLocaleTimeString('fr-FR')), h('td', {}, e.source === 'demo' ? (SCENARIOS.find((s) => s.id === e.scenario) || { titre: e.scenario }).titre : (e.method || e.source || '')),
        h('td', {}, e.level || '—'), h('td', {}, (e.decision || '') + (e.retouche ? ' (retouché)' : '')), h('td', {}, h('code', {}, short(r.prev) + ' → ' + short(r.hash))));
    })));
  box.append(table);
}
function buildJournal() {
  $('#j-verify').addEventListener('click', renderJournal);
  $('#j-tamper').addEventListener('click', () => { const s = J.tamper(storage); $('#journal-status').textContent = s ? `Ligne ${s} retouchée à la main (sans recalculer son empreinte). Clique sur « Vérifier » : la chaîne doit se déclarer cassée.` : 'Rien à retoucher : le journal est vide.'; if (s) { const rows = J.readAll(storage); const v = J.verify(rows); renderJournalOnly(rows, v); } });
  $('#j-clear').addEventListener('click', () => { J.clear(storage); renderJournal(); });
  $('#j-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(J.readAll(storage), null, 1)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = h('a', { href: url, download: 'holdup_journal.json' }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}
function renderJournalOnly(rows, v) { // apres une retouche : on affiche le tableau, mais le statut annonce deja la retouche
  const keep = $('#journal-status').textContent; renderJournal(); $('#journal-status').textContent = keep + ' (' + (v.ok ? 'chaîne encore intacte ?!' : 'vérification : chaîne cassée à la ligne ' + v.brokenAt) + ')';
}

buildDemo(); buildColle(); buildJournal(); route();
