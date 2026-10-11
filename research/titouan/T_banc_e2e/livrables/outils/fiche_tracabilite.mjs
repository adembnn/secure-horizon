/* Hold up - fiche technique de traçabilité. Lit l'EXPORT JSON du journal chaîné (bouton « Exporter le journal » du panneau latéral)
 * et dit QUI a fait QUOI, D'OÙ, QUAND, avec QUELLES RÈGLES, et la PREUVE (chaîne vérifiée par le verifyChain du journal lui-même).
 *
 * Usage :
 *   node livrables/outils/fiche_tracabilite.mjs <export.json>                 résumé de toute la session
 *   node livrables/outils/fiche_tracabilite.mjs <export.json> --n 3           fiche de la ligne n° 3
 *   options : --out fiche.html (page HTML imprimable)  --date 2026-10-11T10:00:00Z (date de la fiche, pour une sortie reproductible)
 * Code de sortie : 0 chaîne cohérente, 1 chaîne ROMPUE (la fiche est quand même produite), 2 fichier illisible ou ligne absente.
 *
 * Règles : tout texte venu du journal est nettoyé (contrôles et inversions de sens retirés, longueur bornée) puis échappé.
 * La page n'a aucun script, aucune ressource externe, une CSP stricte, du CSS en ligne. Jamais une adresse complète, jamais une phrase :
 * seuls les champs connus sont lus. Aucun verdict de sécurité, aucune promesse. Les champs à venir (by, limited, rules, tab, frame)
 * sont affichés s'ils existent, sinon « non enregistré dans cette version ». */
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { verifyChain, sha256, GENESIS, LIMIT_NOTE } from '../../extension/journal_chain.js';

export const SCHEMA = 'holdup.fiche_tracabilite/1';
export const ABSENT = 'non enregistré dans cette version';

// ------------------------------------------------------------------ nettoyage et échappement
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// contrôles, inversions de sens (U+202A..202E, U+2066..2069), zéro largeur ; adresses complètes masquées ; longueur bornée
export function clean(x, max = 80) {
  let s = typeof x === 'string' ? x : typeof x === 'number' || typeof x === 'boolean' ? String(x) : '';
  s = s.replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩﻿]/g, '');
  s = s.replace(/0x[0-9a-fA-F]{40,}/g, (a) => a.slice(0, 6) + '…' + a.slice(-4));
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}
// Le site, coupé au MILIEU : les derniers labels (le vrai domaine) restent entiers. Même règle que journal_chain.js et le panneau.
export function siteCut(o) {
  let host = clean(o, 400).trimStart().split(/[/?#]/)[0];
  if (!host) return 'site inconnu';
  if (host.length <= 40) return host;
  const labels = host.split('.');
  let tail = labels.slice(-2).join('.');
  for (let i = 3; i <= labels.length; i++) { const t = labels.slice(-i).join('.'); if (t.length > 24) break; tail = t; }
  if (tail.length > 39) tail = tail.slice(-39);
  const room = 40 - tail.length - 1;
  return (room > 0 ? host.slice(0, room) : '') + '…' + tail;
}
export const utc = (t) => (Number.isFinite(t) && t > 0 ? new Date(t).toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC') : 'heure inconnue');

// ------------------------------------------------------------------ vocabulaire
const METHOD = {
  eth_sendTransaction: 'Transaction', eth_signTransaction: 'Transaction signée', eth_sendRawTransaction: 'Transaction signée', wallet_sendCalls: 'Lot de transactions',
  eth_sign: 'Signature', personal_sign: 'Message signé', eth_signTypedData: 'Signature de données', eth_signTypedData_v1: 'Signature de données',
  eth_signTypedData_v3: 'Signature de données', eth_signTypedData_v4: 'Signature de données', wallet_grantPermissions: 'Droit durable',
  wallet_requestExecutionPermissions: 'Droit durable', wallet_requestSnaps: 'Droit durable', wallet_watchAsset: 'Jeton ajouté au portefeuille',
  wallet_addEthereumChain: 'Réseau ajouté', eth_decrypt: 'Déchiffrement', eth_getEncryptionPublicKey: 'Déchiffrement',
  eth_sendUserOperation: 'Opération de compte', eth_signUserOperation: 'Opération de compte', interception_partielle: 'Interception partielle de la page'
};
const LEVEL = {
  attention: 'attention : la demande correspondait à la phrase, avec des points à lire',
  danger: 'danger : la demande ne correspondait pas à la phrase',
  manipulation: 'manipulation : la demande ne correspondait pas à la phrase',
  unknown: 'inconnu : la demande n’a pas pu être vérifiée'
};
const TYPE = {
  verdict: 'Analyse de la demande', decision: 'Décision', revocation: 'Révocation proposée', journal: 'Note technique', partial: 'Interception partielle',
  note: 'Note technique', ui_fallback: 'Fenêtre affichée dans la page', early_continue: 'Continuer trop tôt', hold_elapsed: 'Fin de l’attente imposée'
};
export const CODES = {
  unlimited_allowance: 'droit illimité sur un jeton', external_spender: 'bénéficiaire hors liste connue', approval_to_eoa: 'droit accordé à un compte externe sans code',
  unexpected_approval: 'droit accordé alors que la phrase ne le dit pas', unexpected_approval_connect: 'droit demandé à la connexion', nested_approval: 'droit accordé dans un appel imbriqué',
  unlimited_approval_swap: 'droit illimité pendant un échange', batch_foreign_unlimited_approval: 'droit illimité dans un lot', dai_permit: 'permis DAI signé', dai_permit_no_amount: 'permis DAI sans montant',
  no_expiry: 'droit sans expiration', far_expiry: 'échéance du droit très lointaine', delegatecall: 'exécution déléguée vers un autre contrat',
  delegation_7702: 'délégation du compte (EIP-7702)', delegation_7702_all_chains: 'délégation valable sur toutes les chaînes', delegation_7702_revoke: 'retrait d’une délégation',
  router_payout_to_other: 'le routeur verse à une autre adresse', swap_recipient_not_self: 'sortie de l’échange envoyée à une autre adresse',
  signed_transfer_to_other: 'transfert signé vers une autre adresse', slippage_high: 'minimum reçu bas', slippage_unbounded: 'aucun minimum reçu',
  high_balance_share: 'grande part du solde', opaque: 'une partie de la demande n’est pas lisible', allow_failure_sensitive: 'sous-appel autorisé à échouer',
  droit_limite: 'Hold up a limité le droit avant le portefeuille', geste: 'geste de la personne sur « Continuer »', envoi_automatique: 'envoi automatique après « Ça correspond »'
};
const codeText = (c) => { const k = clean(c, 40); return CODES[k] ? k + ' : ' + CODES[k] : k + ' : code du moteur sans libellé dans cette fiche'; };
const has = (e, k) => e && Object.prototype.hasOwnProperty.call(e, k) && e[k] !== null && e[k] !== undefined;

// ------------------------------------------------------------------ QUI
// -> { actor, action, source }
export function whoOf(e) {
  const d = clean(e.d, 20), codes = Array.isArray(e.c) ? e.c.map((x) => clean(x, 40)) : [];
  const action = d === 'confirm' ? 'continuée' : d === 'cancel' ? (clean(e.by, 20) === 'expired' ? 'retenue puis expirée' : 'annulée') : d || 'sans décision';
  if (e.type === 'revocation') return { actor: 'Hold up a proposé un retrait de droit. La personne le signe ou le rejette dans son portefeuille.', action: 'révocation : ' + (d || 'état inconnu'), source: 'type de ligne « revocation »' };
  if (has(e, 'by')) {
    const by = clean(typeof e.by === 'object' ? JSON.stringify(e.by) : e.by, 30);
    const actor = by === 'human' ? 'La personne (un geste dans la fenêtre)' : by === 'auto' ? 'Automatique : la fenêtre a continué seule après « Ça correspond »'
      : by === 'expired' ? 'Personne : la retenue a expiré sans réponse' : 'Hold up, de lui-même (motif : ' + (by || 'vide') + ')';
    return { actor, action, source: 'champ by' };
  }
  if (e.type === 'decision') {
    if (d === 'confirm' && codes.includes('envoi_automatique')) return { actor: 'Automatique : la fenêtre a continué seule après « Ça correspond »', action, source: 'déduit du code envoi_automatique (champ by ' + ABSENT + ')' };
    if (d === 'confirm' && codes.includes('geste')) return { actor: 'La personne (geste sur « Continuer »)', action, source: 'déduit du code geste (champ by ' + ABSENT + ')' };
    if (d === 'cancel') return { actor: 'La personne, ou l’expiration de la retenue : non distingué', action: 'annulée ou expirée', source: 'champ by ' + ABSENT };
    return { actor: 'La personne ou la fenêtre : non distingué', action, source: 'champ by ' + ABSENT };
  }
  if (e.type === 'verdict') return { actor: 'Hold up (analyse automatique, aucune décision)', action: 'analyse', source: 'type de ligne « verdict »' };
  return { actor: 'Hold up (note automatique)', action: TYPE[e.type] || 'note', source: 'type de ligne' };
}

// ------------------------------------------------------------------ champs à venir et couverture par le hachage
// Un champ est « couvert » si le changer casse le hachage de sa ligne, avec l'algorithme du journal lui-même.
async function covered(e, k) {
  if (!has(e, k) || !Number.isInteger(e.n) || typeof e.prev !== 'string') return null;
  const one = (x) => verifyChain({ anchor: e.n > 1 || e.prev !== GENESIS ? { n: e.n - 1, hash: e.prev } : null, entries: [x] });
  if (!(await one(e)).ok) return null; // la ligne elle-même est déjà rompue : indéterminé
  const x = JSON.parse(JSON.stringify(e)); x[k] = typeof e[k] === 'string' ? e[k] + 'x' : JSON.stringify(e[k]) + 'x';
  return !(await one(x)).ok;
}
function show(v, max = 60) {
  if (v === null || v === undefined) return ABSENT;
  if (typeof v === 'boolean') return v ? 'oui' : 'non';
  if (typeof v === 'object') return clean(JSON.stringify(v), max);
  return clean(v, max) || ABSENT;
}
async function extra(e, k, label, map) {
  if (!has(e, k)) return { label, value: ABSENT, hashed: null };
  const raw = map ? map(e[k]) : show(e[k]);
  const c = await covered(e, k);
  return { label, value: raw, hashed: c === null ? 'indéterminé (ligne rompue)' : c ? 'couvert par le hachage' : 'hors du hachage dans cette version' };
}
const limitedText = (v) => (v === true ? 'oui, Hold up a limité le droit avant le portefeuille' : v === false ? 'non' : typeof v === 'object' && v ? (v.limited === true ? 'oui' + (typeof v.sent === 'string' ? ', envoyé : ' + clean(v.sent, 30) : '') : 'non') : show(v));

// ------------------------------------------------------------------ une ligne -> description
export async function describe(e, index, total) {
  const w = whoOf(e);
  const codes = Array.isArray(e.c) ? e.c.filter((x) => typeof x === 'string').slice(0, 8) : [];
  return {
    n: Number.isInteger(e.n) ? e.n : null, position: index + 1, total,
    type: clean(e.type, 20), type_label: TYPE[e.type] || 'Ligne ' + (clean(e.type, 20) || 'sans type'),
    who: w,
    where: { site: siteCut(e.o), tab: has(e, 'tab') ? show(e.tab, 20) : ABSENT, frame: has(e, 'frame') ? show(e.frame, 20) : ABSENT },
    when: utc(e.t),
    what: { method: clean(e.m, 40) || 'inconnue', method_label: METHOD[e.m] || 'Autre demande', level: clean(e.l, 20) ? (LEVEL[e.l] || clean(e.l, 20)) : 'aucun niveau sur cette ligne',
      decision: clean(e.d, 20) || 'aucune', codes: codes.map(codeText) },
    rules: { version: clean(e.v, 20) || ABSENT },
    extras: [await extra(e, 'by', 'Qui (champ by)'), await extra(e, 'limited', 'Limitation appliquée (champ limited)', limitedText), await extra(e, 'rules', 'Empreinte des règles (champ rules)')],
    hash: typeof e.hash === 'string' ? clean(e.hash, 64) : 'absent', prev: typeof e.prev === 'string' ? clean(e.prev, 64) : 'absent'
  };
}

// JSON canonique (clés triées, sans espace) : c'est le texte haché pour l'empreinte de la fiche.
export function canonicalJson(x) {
  if (x === null || typeof x !== 'object') return JSON.stringify(x === undefined ? null : x);
  if (Array.isArray(x)) return '[' + x.map(canonicalJson).join(',') + ']';
  return '{' + Object.keys(x).sort().filter((k) => x[k] !== undefined).map((k) => JSON.stringify(k) + ':' + canonicalJson(x[k])).join(',') + '}';
}

export const ESTABLISHES = [
  'Si la chaîne est cohérente : aucune ligne n’a été changée, retirée au milieu ou déplacée depuis son écriture.',
  'Le contenu de chaque ligne (site coupé, heure, type de demande, niveau, codes, décision, version) est celui qui a été haché à l’écriture.',
  'Qui a agi, tel que la ligne l’enregistre, et seulement cela.'
];
export const NOT_ESTABLISHES = [
  'Une réécriture complète de la chaîne ou la suppression des dernières lignes ne se détecte pas sans ancrage externe (une copie du dernier hachage gardée ailleurs).',
  'Les champs marqués « hors du hachage » ne sont pas protégés par la chaîne.',
  'Le contenu exact de la demande, la phrase écrite et les adresses : le journal ne les garde pas.',
  'Que la demande était sans risque : Hold up ne le dit jamais. Cette fiche ne promet rien.'
];

// ------------------------------------------------------------------ fiche
// exportObj : l'objet JSON de l'export ({ format, version, anchor, entries }). opts : { n, generatedAt }
export async function buildFiche(exportObj, { n = null, generatedAt = null } = {}) {
  const chain = { anchor: exportObj && exportObj.anchor || null, entries: exportObj && Array.isArray(exportObj.entries) ? exportObj.entries : [] };
  if (!exportObj || typeof exportObj !== 'object' || !Array.isArray(exportObj.entries)) throw new Error('Format inconnu : ce n’est pas un export du journal de Hold up.');
  const check = await verifyChain(chain);
  const total = chain.entries.length;
  let lines;
  if (n !== null) {
    const i = chain.entries.findIndex((e) => e && e.n === n);
    if (i < 0) throw new Error('Ligne n° ' + n + ' absente de cet export.');
    lines = [await describe(chain.entries[i], i, total)];
  } else lines = await Promise.all(chain.entries.map((e, i) => describe(e && typeof e === 'object' ? e : {}, i, total)));
  const head = total ? chain.entries[total - 1] : null;
  const record = {
    schema: SCHEMA, mode: n !== null ? 'ligne' : 'session', generated_at: generatedAt || new Date().toISOString(),
    chain: { ok: check.ok, state: check.ok ? 'COHÉRENTE' : 'ROMPUE', checked: check.checked, problems: check.problems.map((p) => clean(p, 160)), note: LIMIT_NOTE,
      anchor: chain.anchor && typeof chain.anchor.hash === 'string' ? { n: Number.isInteger(chain.anchor.n) ? chain.anchor.n : null, hash: clean(chain.anchor.hash, 64) } : null,
      head: head && typeof head.hash === 'string' ? clean(head.hash, 64) : null, algorithm: 'SHA-256(prev + contenu canonique), verifyChain de extension/journal_chain.js' },
    lines, establishes: ESTABLISHES, does_not_establish: NOT_ESTABLISHES
  };
  const json = canonicalJson(record);
  const digest = await sha256(json);
  return { record, json, sha256: digest, text: renderText(record, digest), html: renderHtml(record, digest) };
}

// ------------------------------------------------------------------ texte
export function renderText(r, digest) {
  const out = ['HOLD UP : FICHE TECHNIQUE DE TRAÇABILITÉ (' + (r.mode === 'ligne' ? 'une ligne' : 'session') + ')', 'Fiche produite le ' + r.generated_at, ''];
  out.push('PREUVE : chaîne ' + r.chain.state + ' (' + r.chain.checked + ' ligne(s) vérifiée(s) avec le verifyChain du journal).');
  for (const p of r.chain.problems) out.push('  ! ' + p);
  out.push('  ' + r.chain.note);
  if (r.chain.head) out.push('  Dernier hachage (à garder ailleurs pour ancrer) : ' + r.chain.head);
  out.push('  Empreinte SHA-256 de la fiche : ' + digest, '');
  for (const l of r.lines) {
    out.push('Ligne n° ' + (l.n ?? '?') + ' (position ' + l.position + ' sur ' + l.total + ') : ' + l.type_label);
    out.push('  QUI    : ' + l.who.actor + ' [' + l.who.action + ' ; source : ' + l.who.source + ']');
    out.push('  D’OÙ   : ' + l.where.site + ' ; onglet : ' + l.where.tab + ' ; frame : ' + l.where.frame);
    out.push('  QUAND  : ' + l.when);
    out.push('  QUOI   : ' + l.what.method_label + ' (' + l.what.method + ') ; niveau ' + l.what.level + ' ; décision : ' + l.what.decision);
    for (const c of l.what.codes) out.push('           - ' + c);
    out.push('  RÈGLES : version du build ' + l.rules.version);
    for (const x of l.extras) out.push('  ' + x.label + ' : ' + x.value + (x.hashed ? ' (' + x.hashed + ')' : ''));
    if (r.mode === 'ligne') out.push('  hachage : ' + l.hash, '  précédent : ' + l.prev);
    out.push('');
  }
  out.push('Ce que la fiche établit :'); for (const s of r.establishes) out.push('  - ' + s);
  out.push('Ce qu’elle n’établit pas :'); for (const s of r.does_not_establish) out.push('  - ' + s);
  return out.join('\n') + '\n';
}

// ------------------------------------------------------------------ HTML (une page A4, aucun script, aucune ressource externe)
const CSS = `@page{size:A4;margin:12mm}*{box-sizing:border-box}body{font:10.5px/1.4 system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#111;background:#fff;margin:0 auto;max-width:190mm;padding:8px}
h1{font-size:16px;margin:0 0 2px}h2{font-size:12px;margin:10px 0 4px;border-bottom:1px solid #999;text-transform:uppercase;letter-spacing:.04em}
.meta{color:#444;font-size:10px}.state{font-weight:700;padding:2px 6px;border:2px solid #111}.broken{color:#b00;border-color:#b00}
dl{display:grid;grid-template-columns:34mm 1fr;gap:2px 8px;margin:0}dt{font-weight:600;color:#333}dd{margin:0;overflow-wrap:anywhere}
code{font:9.5px ui-monospace,Consolas,monospace;overflow-wrap:anywhere}table{border-collapse:collapse;width:100%;font-size:9.5px}th,td{border:1px solid #bbb;padding:2px 4px;text-align:left;vertical-align:top}
th{background:#eee}ul{margin:2px 0 0 16px;padding:0}.two{display:grid;grid-template-columns:1fr 1fr;gap:10px}.note{color:#555;font-size:9.5px}.absent{color:#777;font-style:italic}
@media print{body{padding:0}}`;
const cell = (v) => (v === ABSENT || (typeof v === 'string' && v.endsWith(ABSENT)) ? `<span class="absent">${esc(v)}</span>` : esc(v));
function lineBlock(l) {
  const rows = [
    ['Qui', `${esc(l.who.actor)}<br><span class="note">action : ${esc(l.who.action)} ; source : ${cell(l.who.source)}</span>`],
    ['D’où', `${esc(l.where.site)}<br><span class="note">onglet : ${cell(l.where.tab)} ; frame : ${cell(l.where.frame)}</span>`],
    ['Quand', esc(l.when)],
    ['Quoi', `${esc(l.what.method_label)} <code>${esc(l.what.method)}</code><br>niveau ${esc(l.what.level)}<br>décision : <code>${esc(l.what.decision)}</code>`],
    ['Raisons (codes)', l.what.codes.length ? '<ul>' + l.what.codes.map((c) => `<li>${esc(c)}</li>`).join('') + '</ul>' : '<span class="absent">aucun code</span>'],
    ['Règles', `version du build <code>${cell(l.rules.version)}</code>`],
    ...l.extras.map((x) => [x.label, cell(x.value) + (x.hashed ? ` <span class="note">(${esc(x.hashed)})</span>` : '')]),
    ['Position', `ligne n° ${esc(l.n ?? '?')}, position ${esc(l.position)} sur ${esc(l.total)}`],
    ['Hachage', `<code>${esc(l.hash)}</code>`], ['Précédent', `<code>${esc(l.prev)}</code>`]
  ];
  return '<dl>' + rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join('') + '</dl>';
}
function sessionTable(lines) {
  return `<table><thead><tr><th>n°</th><th>Quand (UTC)</th><th>Qui</th><th>D’où</th><th>Quoi</th><th>Raisons</th><th>Règles</th></tr></thead><tbody>` +
    lines.map((l) => `<tr><td>${esc(l.n ?? '?')}</td><td>${esc(l.when.replace(' UTC', ''))}</td><td>${esc(l.who.actor)}<br><span class="note">${esc(l.who.action)}</span></td><td>${esc(l.where.site)}</td>` +
      `<td>${esc(l.type_label)} : ${esc(l.what.method_label)}${l.what.decision !== 'aucune' ? ' ; ' + esc(l.what.decision) : ''}</td><td>${l.what.codes.map((c) => esc(c.split(' : ')[0])).join('<br>')}</td>` +
      `<td><code>${cell(l.rules.version)}</code><br><span class="note">by : ${cell(l.extras[0].value)}<br>limited : ${cell(l.extras[1].value)}<br>rules : ${cell(l.extras[2].value)}</span></td></tr>`).join('') + '</tbody></table>';
}
export function renderHtml(r, digest) {
  const c = r.chain;
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'none'; script-src 'none'; form-action 'none'; base-uri 'none'">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Fiche de traçabilité</title>
<style>${CSS}</style></head><body>
<h1>Hold up : fiche technique de traçabilité</h1>
<div class="meta">${r.mode === 'ligne' ? 'Une ligne du journal' : 'Session entière : ' + esc(r.lines.length) + ' ligne(s)'} ; fiche produite le ${esc(r.generated_at)} ; ${esc(r.schema)}</div>
<h2>Preuve</h2>
<dl><dt>Chaîne</dt><dd><span class="state${c.ok ? '' : ' broken'}">${esc(c.state)}</span> ${esc(c.checked)} ligne(s) vérifiée(s)</dd>
${c.problems.length ? `<dt>Problèmes</dt><dd><ul>${c.problems.map((p) => `<li class="broken">${esc(p)}</li>`).join('')}</ul></dd>` : ''}
<dt>Algorithme</dt><dd>${esc(c.algorithm)}</dd>
<dt>Ancrage</dt><dd>${c.anchor ? `n° ${esc(c.anchor.n)} <code>${esc(c.anchor.hash)}</code>` : 'départ de la chaîne (aucune ligne retirée par la borne)'}</dd>
<dt>Dernier hachage</dt><dd><code>${esc(c.head || 'aucun')}</code> <span class="note">à garder ailleurs pour ancrer</span></dd>
<dt>Empreinte de la fiche</dt><dd><code>${esc(digest)}</code> <span class="note">SHA-256 du JSON canonique de la fiche</span></dd></dl>
<p class="note">${esc(c.note)}</p>
<h2>${r.mode === 'ligne' ? 'Qui a fait quoi' : 'Qui a fait quoi, ligne par ligne'}</h2>
${r.mode === 'ligne' ? lineBlock(r.lines[0]) : sessionTable(r.lines)}
<div class="two"><div><h2>Ce que la fiche établit</h2><ul>${r.establishes.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>
<div><h2>Ce qu’elle n’établit pas</h2><ul>${r.does_not_establish.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div></div>
<p class="note">Sans phrase écrite ni adresse : le journal ne les garde pas. Sites coupés au milieu, domaine final toujours visible.</p>
</body></html>
`;
}

// ------------------------------------------------------------------ ligne de commande
async function main(argv) {
  const args = argv.slice(2); const file = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
  const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
  if (!file) { console.error('Usage : node fiche_tracabilite.mjs <export.json> [--n N] [--out fiche.html] [--date ISO]'); return 2; }
  let obj;
  // un éditeur Windows ajoute souvent une marque BOM : elle est retirée
  try { obj = JSON.parse(readFileSync(file, 'utf8').trimStart()); } catch (e) { console.error('Fichier illisible : ' + e.message); return 2; }
  const nRaw = opt('--n'); const n = nRaw === null ? null : Number(nRaw);
  if (n !== null && !Number.isInteger(n)) { console.error('--n attend un numéro de ligne.'); return 2; }
  let f;
  try { f = await buildFiche(obj, { n, generatedAt: opt('--date') }); } catch (e) { console.error(e.message); return 2; }
  const out = opt('--out'); if (out) writeFileSync(out, f.html, 'utf8');
  process.stdout.write(f.text + (out ? 'Page HTML : ' + out + '\n' : ''));
  return f.record.chain.ok ? 0 : 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = await main(process.argv);
