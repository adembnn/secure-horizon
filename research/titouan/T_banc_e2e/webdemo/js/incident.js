// Fiche d'incident de la demo : adaptation navigateur de research/demo_reelle/reponse/incident.mjs (Adem, lecture seule).
// Memes principes : construite UNIQUEMENT a partir du journal chaine (ici celui de la page), a la demande de la personne ;
// meme schema 'holdup.incident/1', memes blocs (asked, verdict, timeline, metrics, evidence, proves, does_not_prove) ; meme formule d'empreinte.
// Ecarts, voulus :
//   - pas de fichier, pas de Node : le journal vient de localStorage (js/journal.js) et la fiche se lit dans la page (DOM, textContent seulement) ;
//   - la porte est toujours « extension » ; le journal de la demo n'a pas de ligne « verdict » separee : la ligne de decision porte le niveau, la fiche et le delai ;
//   - un bloc `right` (le droit accorde) et un bloc `revocation` (ce que la personne a demande, ce que le faux portefeuille a repondu) sont ajoutes ;
//   - tout ce qui est simule est marque `simulated: true` et dit comme tel dans le texte.
// Aucune adresse dans le JOURNAL (il ne garde qu'une empreinte de la demande). Les adresses de la fiche viennent de la scene que la personne a sous les yeux.
import { h } from './ui.js';
import { sha256hex } from './sha256.js';
import { hashOf, verify } from './journal.js';
import TEXTS from '../engine/textes.js';

export const recordHash = hashOf; // sha256(prev | seq | ts | JSON(entry)) : meme formule que server.mjs et incident.mjs
export const hashInput = (r) => r.prev + '|' + r.seq + '|' + r.ts + '|' + JSON.stringify(r.entry);
// Rejouer une ligne : on recalcule l'empreinte depuis son contenu, avec ce seul module.
export function replayRecord(r) { const computed = sha256hex(hashInput(r)); return { ok: computed === r.hash, computed, input: hashInput(r) }; }
// Rejouer la chaine entiere a partir de ces lignes.
export function replayChain(rows) { return verify(rows); }

const LEVEL_FR = { info: 'Aucun signal trouvé', unknown: 'Non vérifié', attention: 'Attention', danger: 'Danger', manipulation: 'Manipulation' };
const KIND_FR = {
  erc20_approve: 'Droit de dépenser des jetons', erc20_increaseAllowance: 'Droit de dépenser des jetons (augmenté)', setApprovalForAll: 'Droit sur toute une collection de NFT',
  erc721_approve: 'Droit sur un NFT', eip2612_permit: 'Signature hors chaîne de type Permit', dai_permit: 'Signature hors chaîne de type Permit (DAI)',
  permit2_signature: 'Signature hors chaîne de type Permit2', permit2_batch_signature: 'Signature hors chaîne de type Permit2 (plusieurs jetons)',
  permit2_transfer_signature: 'Signature de transfert Permit2', permit2_approve: 'Droit de dépense auprès de Permit2', unknown_signature: 'Signature hors chaîne'
};
const TOKENS = { '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC' };
const iso = (t) => new Date(t).toISOString();
const short = (a) => (typeof a === 'string' && a.length > 14 ? a.slice(0, 8) + '…' + a.slice(-6) : a || '');
const secs = (ms) => (ms === null || ms === undefined ? null : Math.round(ms / 100) / 10);

function amountText(g) {
  if (g.all) return 'tous les NFT de la collection';
  if (g.unlimited) return 'illimité';
  try { const n = BigInt(g.amount); return n % 1000000n === 0n ? String(n / 1000000n) + ' ' + (TOKENS[g.token] || 'unités') : g.amount + ' (unité brute)'; } catch (_) { return String(g.amount); }
}

/**
 * rows        : lignes du journal de la page (journal.readAll)
 * opt.decisionSeq   : seq de la ligne ou la personne a continue (indispensable)
 * opt.revocationSeq : seq de la derniere ligne « revocation » (null si aucune demande de retrait)
 * opt.scenario      : { id, site, origin, resume, body }   opt.result : sortie de revocationFor()
 */
export function buildFiche(rows, { decisionSeq, revocationSeq = null, scenario, result, generatedAt = Date.now() }) {
  const d = rows.find((r) => r.seq === decisionSeq);
  if (!d) throw new Error('aucune ligne de decision avec le numero ' + decisionSeq);
  const rv = revocationSeq === null ? null : rows.find((r) => r.seq === revocationSeq) || null;
  const e = d.entry || {}, g = result.grant || {};
  const chain = verify(rows);
  const fiche = e.fiche && TEXTS.fiches.find((f) => f.id === e.fiche);
  const walletAnswer = rv ? rv.entry.wallet : null; // 'signed' | 'rejected' | null
  const removed = walletAnswer === 'signed' && result.status === 'revocable' && result.oneClick;
  const params = scenario.body.params;
  const kindLabel = KIND_FR[result.kind] || 'Droit accordé';
  const timeline = [];
  if (typeof e.ms === 'number') timeline.push({ at: iso(d.ts - e.ms), what: 'alert_shown' });
  timeline.push({ at: iso(d.ts), what: 'decision', decision: 'continue', journal_seq: d.seq });
  if (rv) timeline.push({ at: iso(rv.ts), what: walletAnswer === 'signed' ? 'revocation_signed' : 'revocation_rejected', journal_seq: rv.seq });
  const records = [d, ...(rv ? [rv] : [])];
  return {
    schema: 'holdup.incident/1', id: sha256hex(d.hash + '|' + (rv ? rv.hash : '')).slice(0, 16), generated_at: iso(generatedAt), generated_on: 'user request', demo: true,
    outcome: 'signed', door: 'extension',
    asked: { what: 'wallet request from a web page', site: scenario.origin, site_label: scenario.site, method: scenario.body.method, params_sha256: sha256hex(JSON.stringify(params)), summary: scenario.resume },
    verdict: { level: e.level || null, niveau: e.niveau || null, level_fr: LEVEL_FR[e.level] || String(e.level), fiche: fiche ? { id: fiche.id, threat: fiche.menace, technique: fiche.technique } : (e.fiche ? { id: e.fiche } : null) },
    right: { kind: result.kind, kind_label: kindLabel, token: g.token || null, token_symbol: g.token ? TOKENS[g.token.toLowerCase()] || null : null, spender: g.spender || null, amount: amountText(g), unlimited: !!g.unlimited, off_chain: !!g.offChain, network: 'Ethereum (fictif)' },
    person: { continued: true, waited_s: typeof e.delay_s === 'number' ? e.delay_s : null, time_in_window_s: secs(e.ms), shortcut: !!e.raccourci },
    revocation: rv || result.requests.length ? {
      status: result.status, one_click: result.oneClick, request_prepared: result.requests.length > 0, request_sha256: result.requests.length ? sha256hex(JSON.stringify(result.requests[0].params)) : null,
      wallet_answer: walletAnswer, right_removed: removed, right_after: removed ? 'zéro' : null, simulated: true, journal_seq: rv ? rv.seq : null
    } : null,
    timeline,
    metrics: { time_to_detect_ms: null, time_to_detect_note: 'non journalisé par la démo', time_to_respond_ms: typeof e.ms === 'number' ? e.ms : null, time_to_revoke_ms: rv ? rv.ts - d.ts : null, time_to_revoke_note: rv ? 'de ta décision de continuer à la réponse du portefeuille' : 'aucune demande de retrait' },
    evidence: { journal_records: records, pairing: 'les deux lignes citées, par numéro', chain: { ok: chain.ok, records: rows.length, broken_at: chain.ok ? null : chain.brokenAt, head: rows.length ? rows[rows.length - 1].hash : null } },
    next_steps: nextSteps(removed, result),
    cannot_undo: ['Ce qui a déjà été pris avant le retrait du droit. Un retrait ne ramène rien.', 'Une signature hors chaîne déjà envoyée par quelqu’un d’autre : le droit qu’elle a créé existe, il faut alors le retirer lui aussi.'],
    proves: [
      'Cette page a enregistré, à l’heure de ton ordinateur, une alerte de ce niveau pour cette demande, et ta décision de continuer.',
      removed ? 'Une demande de retrait a été montrée à ton portefeuille simulé, et il l’a acceptée.' : rv ? 'Une demande de retrait a été montrée à ton portefeuille simulé.' : 'Aucune demande de retrait n’a encore été faite.',
      'Les lignes citées sont intactes par rapport à la chaîne d’empreintes du journal, et chacune se rejoue.'
    ],
    does_not_prove: [
      'Qu’une vraie transaction a eu lieu : le portefeuille et le réseau de cette démo sont simulés, aucune transaction n’existe.',
      'Qui était devant l’écran, ni qui est derrière le site ou l’adresse.',
      'Qu’aucune perte n’a eu lieu par un autre chemin.',
      'L’heure exacte : c’est celle de l’ordinateur. Sans ancrage, le détenteur du journal peut le réécrire.'
    ]
  };
}

function nextSteps(removed, result) {
  const steps = [];
  if (!removed) steps.push(result.status === 'revocable' ? 'Retirer le droit : la demande de retrait est prête, c’est toi qui la signes.' : 'Annuler ce droit prend plusieurs étapes. Elles sont décrites plus haut.');
  steps.push('Prévenir la plateforme ou le site qui a demandé ce droit, avec cette fiche.');
  steps.push('Vérifier les autres droits de ton compte, et retirer ceux que tu ne reconnais pas.');
  steps.push('Regarder si des fonds sont déjà partis. Si oui, le dire à la plateforme et à ta banque ou à la police.');
  return steps;
}

// ------------------------------------------------------------------ rendu (DOM, textContent seulement)
const WHAT_FR = { alert_shown: 'Alerte affichée', decision: 'Tu as continué malgré l’alerte', revocation_signed: 'Retrait accepté dans le portefeuille simulé', revocation_rejected: 'Retrait rejeté dans le portefeuille simulé' };
const fr = (t) => new Date(t).toLocaleString('fr-FR');

export function renderFiche(inc, { rows = [], onJson = null, onPrint = null } = {}) {
  const row = (k, v) => (v === null || v === undefined || v === '' ? null : h('div', {}, h('dt', {}, k), h('dd', {}, v)));
  const code = (t) => h('code', {}, t);
  const rv = inc.revocation, r = inc.right, p = inc.person;
  const lead = rv && rv.right_removed ? 'Tu as continué malgré l’alerte. Le droit a ensuite été retiré, dans la simulation.'
    : rv && rv.wallet_answer === 'rejected' ? 'Tu as continué malgré l’alerte. Tu as rejeté la demande de retrait : le droit est toujours actif.'
    : 'Tu as continué malgré l’alerte. Le droit est toujours actif.';
  const replayOut = h('p', { class: 'note', role: 'status', 'aria-live': 'polite' });
  const lines = inc.evidence.journal_records.map((rec) => {
    const res = h('p', { class: 'note' });
    return h('div', { class: 'j-line' },
      h('dt', {}, 'Ligne ' + rec.seq),
      h('dd', {}, code(JSON.stringify(rec)),
        h('p', { class: 'note' }, 'Ligne copiée telle quelle. Texte haché : empreinte précédente | numéro | heure | contenu. L’empreinte est son SHA-256.'),
        h('button', { class: 'btn', type: 'button', onclick: () => { const x = replayRecord(rec); res.textContent = x.ok ? 'Recalculé dans cette page : l’empreinte est identique (' + x.computed.slice(0, 16) + '…).' : 'Recalculé dans cette page : l’empreinte est différente. La ligne a changé.'; } }, 'Rejouer le calcul de cette ligne'), res));
  });
  return h('article', { class: 'fiche', 'aria-labelledby': 'fiche-h' },
    h('header', { class: 'fiche-head' }, h('h3', { id: 'fiche-h', class: 'fiche-title' }, 'Fiche d’incident'), h('p', { class: 'note' }, 'N° ' + inc.id + ' · ' + fr(inc.generated_at) + ' · produite à ta demande')),
    h('p', { class: 'fiche-lead' }, lead),
    h('p', { class: 'note' }, 'Démonstration : le portefeuille et le réseau sont simulés. Aucune transaction n’existe.'),
    h('h4', {}, 'Ce qui s’est passé'),
    h('dl', { class: 'raw' },
      row('Quoi', r.kind_label + ' : ' + r.amount + (r.token_symbol ? ' (' + r.token_symbol + ')' : '')),
      row('Quand', fr(inc.timeline[inc.timeline.length > 1 && inc.timeline[0].what === 'alert_shown' ? 1 : 0].at)),
      row('Site', inc.asked.site_label + ' · ' + inc.asked.site),
      row('Ce que le site te disait', inc.asked.summary),
      row('Droit', r.kind_label),
      row('Jeton', r.token ? code(r.token) : null),
      row('Adresse qui reçoit le droit', r.spender ? code(r.spender) : null),
      row('Réseau', r.network),
      row('Niveau d’alerte', inc.verdict.level_fr + (inc.verdict.fiche && inc.verdict.fiche.id ? ' · fiche ' + inc.verdict.fiche.id : '')),
      row('Ce que la demande faisait', inc.verdict.fiche && inc.verdict.fiche.threat ? inc.verdict.fiche.threat : null)),
    h('h4', {}, 'Ce que tu as fait'),
    h('dl', { class: 'raw' },
      row('Alerte', p.shortcut ? 'Raccourci de démonstration : tu n’as pas traversé la fenêtre.' : 'Tu as lu l’alerte pendant ' + (p.time_in_window_s !== null ? p.time_in_window_s + ' s' : 'un temps non mesuré') + (p.waited_s ? ', avec une attente imposée de ' + p.waited_s + ' s.' : '.')),
      row('Décision', 'Continuer quand même'),
      row('Retrait', rv ? (rv.wallet_answer === 'signed' ? 'Demandé, accepté dans le portefeuille simulé' : rv.wallet_answer === 'rejected' ? 'Demandé, rejeté dans le portefeuille simulé' : 'Préparé, pas encore soumis') : 'Pas demandé'),
      row('Demande de retrait', rv && rv.request_sha256 ? code(rv.request_sha256) : null),
      row('Droit relu après le retrait', rv && rv.right_removed ? 'zéro (simulé)' : null)),
    h('h4', {}, 'Ce qui reste à faire'),
    h('ul', {}, inc.next_steps.map((s) => h('li', {}, s))),
    h('h4', {}, 'Ce qui ne peut pas être défait'),
    h('ul', {}, inc.cannot_undo.map((s) => h('li', {}, s))),
    h('h4', {}, 'Preuve du journal'),
    h('dl', { class: 'raw j-proof' }, lines),
    h('p', { class: 'note' }, inc.evidence.chain.ok ? 'Chaîne du journal : intacte, ' + inc.evidence.chain.records + ' lignes, tête ' + short(inc.evidence.chain.head) + '.' : 'Chaîne du journal : cassée à la ligne ' + inc.evidence.chain.broken_at + '. Cette fiche n’a pas de valeur d’intégrité.'),
    replayOut,
    h('div', { class: 'row' },
      h('button', { class: 'btn', type: 'button', onclick: () => { const v = replayChain(rows); replayOut.textContent = v.ok ? 'Chaîne rejouée dans cette page : ' + v.n + ' ligne(s), chaque empreinte dépend de la précédente. Elle est intacte.' : 'Chaîne rejouée : cassée à la ligne ' + v.brokenAt + '.'; } }, 'Rejouer toute la chaîne')),
    h('div', { class: 'cols-2' },
      h('div', {}, h('h4', {}, 'Ce que cette fiche établit'), h('ul', {}, inc.proves.map((s) => h('li', {}, s)))),
      h('div', {}, h('h4', {}, 'Ce qu’elle n’établit pas'), h('ul', {}, inc.does_not_prove.map((s) => h('li', {}, s))))),
    h('div', { class: 'row no-print' },
      onJson ? h('button', { class: 'btn', type: 'button', onclick: onJson }, 'Exporter la fiche (JSON)') : null,
      onPrint ? h('button', { class: 'btn', type: 'button', onclick: onPrint }, 'Imprimer ou enregistrer en PDF') : null),
    h('footer', { class: 'fiche-foot' }, 'Produite par Hold up à ta demande, à partir de ton journal local. Aucun nom, aucun texte saisi, aucune clé. Rien n’est envoyé.'));
}
