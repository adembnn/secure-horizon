// « Après l'alerte » : la personne a continué, un droit existe. Hold up prépare la demande de retrait (js/revoke.js = extension/revoke.js),
// le FAUX portefeuille la montre, la personne signe ou rejette. Hold up ne signe jamais. Puis fiche d'incident (js/incident.js) et ligne de journal rejouable.
// TOUT ce qui touche au portefeuille et au reseau est SIMULE ici : aucune cle, aucune transaction, aucun envoi.
import { h, clear } from './ui.js';
import { revocationFor, buttonLabel } from './revoke.js';
import { buildFiche, renderFiche, replayRecord } from './incident.js';
import { sha256hex } from './sha256.js';
import { check, displayLevel, withIntent, sanitizeLocalContext } from './verdict_model.js';
import { localOf } from './scenarios.js';

const SHORT = (a) => (typeof a === 'string' && a.length > 14 ? a.slice(0, 8) + '…' + a.slice(-6) : a || '');
const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const label = (t) => (t && t.toLowerCase() === USDC ? 'USDC' : 'jetons');

// Le droit grant par une scene : revocationFor lit la meme requete que le moteur. Les scenes de la demo n'ont pas de NFT « approve » : un montant est un montant de jeton.
export const grantOf = (scenario, limited = false) => revocationFor(limited && scenario.corrige ? scenario.corrige.body : scenario.body, { tokenKind: 'erc20' });
export const grants = (scenario) => !!grantOf(scenario).grant;

// Ce que le faux portefeuille affiche pour la demande de retrait (lignes lisibles, comme rawRows de app.js).
export function walletRows(result) {
  const p = result.requests[0].params[0];
  const rows = [['Réseau', 'Ethereum (fictif)'], ['À', p.to], ['Montant', '0 ETH']];
  if (result.kind === 'setApprovalForAll') rows.push(['Fonction', 'setApprovalForAll'], ['Opérateur', result.grant.spender], ['Droit', 'retiré (faux)']);
  else rows.push(['Fonction', 'approve'], ['Autorise', result.grant.spender], ['Plafond demandé', '0 : le droit est retiré']);
  rows.push(['Données', p.data.slice(0, 10) + '… (' + (p.data.length - 2) / 2 + ' octets)']);
  return rows;
}

function whatItDoes(scenario, result) {
  const g = result.grant, who = scenario.site;
  if (g.all) return 'Dans cette simulation, ' + who + ' peut maintenant déplacer tous tes NFT de cette collection.';
  if (g.offChain) return 'Dans cette simulation, ' + who + ' détient une signature qui lui donne ce droit dès qu’il l’envoie sur le réseau.';
  return 'Dans cette simulation, ' + who + ' peut maintenant dépenser tes ' + label(g.token) + (g.unlimited ? ' sans limite.' : ', jusqu’à ' + (BigInt(g.amount) / 1000000n) + ' ' + label(g.token) + '.');
}

/**
 * section : <section id="apres">   box : conteneur du contenu   storage : stockage du journal   log(entry) -> ligne ajoutee ou null
 */
export function mountApres({ section, box, storage, log, readRows, onFiche = null }) {
  let st = null; // { scenario, limited, result, decision, revocation }
  let stepEl = null, ficheEl = null; // references gardees ici : on ne cherche jamais dans le document

  const hide = () => { st = null; stepEl = null; ficheEl = null; section.hidden = true; clear(box); };

  function show(scenario, limited, decisionRow) {
    const result = grantOf(scenario, limited);
    if (!result.grant) { hide(); return null; }
    st = { scenario, limited, result, decision: decisionRow, revocation: null };
    section.hidden = false; draw();
    return result;
  }

  function draw() {
    clear(box); ficheEl = null;
    const { scenario, result } = st, g = result.grant, label_ = buttonLabel(result);
    const detail = h('dl', { class: 'raw' },
      g.token ? h('div', {}, h('dt', {}, 'Jeton'), h('dd', {}, h('code', {}, g.token))) : null,
      h('div', {}, h('dt', {}, 'Adresse qui reçoit le droit'), h('dd', {}, h('code', {}, g.spender))),
      h('div', {}, h('dt', {}, 'Montant'), h('dd', {}, g.all ? 'tous les NFT de la collection' : g.unlimited ? 'illimité' : String(BigInt(g.amount) / 1000000n) + ' ' + label(g.token))));
    box.append(
      h('p', { class: 'apres-lead' }, 'Tu as continué. ' + whatItDoes(scenario, result)),
      detail,
      h('div', { class: 'row' }, label_ ? h('button', { class: 'btn btn-main', type: 'button', id: 'revoke-btn', onclick: () => (result.oneClick ? askWallet() : explain()) }, label_) : null),
      h('p', { class: 'muted small' }, result.oneClick ? 'Hold up prépare la demande de retrait. Ton portefeuille te la montre, c’est toi qui signes. Hold up ne signe jamais.' : result.says),
      (stepEl = h('div', { id: 'apres-step' })));
    if (!label_) box.append(h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', id: 'fiche-btn', onclick: showFiche }, 'Voir la fiche d’incident')));
  }

  // droits qui ne se retirent pas en un clic : on le dit, on ne simule pas
  function explain() {
    const s = clear(stepEl), { result } = st;
    s.append(h('h3', {}, 'Ce droit ne se retire pas en un clic'), h('p', {}, result.says), h('ol', {}, result.steps.map((t) => h('li', {}, t.replace(/^\d\.\s*/, '')))),
      h('ul', { class: 'muted small' }, result.limits.map((t) => h('li', {}, t))), h('p', { class: 'muted small' }, 'Cette démo ne simule pas ces étapes.'),
      h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', id: 'fiche-btn', onclick: showFiche }, 'Voir la fiche d’incident')));
  }

  // le faux portefeuille : la demande de retrait, Rejeter / Signer
  function askWallet() {
    const { scenario, result } = st, req = result.requests[0];
    const body = { origin: 'hold-up (retrait)', method: req.method, params: req.params, chainId: '0x1', from: req.params[0].from };
    let reading = null;
    try { const v = check(withIntent(body, 'none'), sanitizeLocalContext(localOf(scenario))); reading = displayLevel(v); } catch (_) { /* la relecture est un plus, jamais un prerequis */ }
    const s = clear(stepEl);
    const rows = h('dl', { class: 'raw' }, walletRows(result).map(([k, v]) => h('div', {}, h('dt', {}, k), h('dd', {}, h('code', {}, v)))));
    const out = h('p', { id: 'apres-out', role: 'status', 'aria-live': 'polite', class: 'apres-out' });
    const yes = h('button', { class: 'btn btn-wallet-yes', type: 'button', id: 'revoke-sign', onclick: () => answer('signed', yes, no, out) }, 'Signer');
    const no = h('button', { class: 'btn btn-wallet-no', type: 'button', id: 'revoke-reject', onclick: () => answer('rejected', yes, no, out) }, 'Rejeter');
    s.append(h('div', { class: 'card wallet' },
      h('h3', {}, 'Le faux portefeuille reçoit la demande de retrait'),
      h('p', {}, h('b', {}, 'Hold up'), ' · demande préparée, non signée'),
      rows,
      reading ? h('p', { class: 'muted small' }, 'Hold up relit cette demande avec le même moteur : ' + (reading.key === 'info' ? 'aucun signal trouvé. Elle retire un droit, elle n’en donne pas. Ce n’est pas une garantie.' : reading.label + '.')) : null,
      h('div', { class: 'wallet-actions' }, no, yes), out));
    yes.focus && yes.focus();
  }

  function answer(wallet, yes, no, out) {
    yes.disabled = true; no.disabled = true;
    const { scenario, result } = st;
    const entry = { source: 'demo', type: 'revocation', scenario: scenario.id, kind: result.kind, request_sha256: sha256hex(JSON.stringify(result.requests[0].params)), wallet, simulated: true, allowance_after: wallet === 'signed' ? '0' : null };
    const rec = log(entry);
    st.revocation = rec; st.walletAnswer = wallet;
    clear(out);
    if (wallet === 'rejected') {
      out.append('Tu as rejeté la demande de retrait dans le portefeuille. Rien n’a changé : le droit est toujours actif. Tu peux encore signer.');
      yes.disabled = false; no.disabled = false; // la personne peut changer d'avis : chaque reponse est une ligne de journal
    } else {
      out.append(h('span', {}, 'Retrait signé dans le faux portefeuille. Simulation : aucune transaction n’a été envoyée, aucun réseau n’a été touché.'), h('br'),
        h('span', {}, 'Hold up relit le droit : plafond actuel 0 (valeur simulée).'));
    }
    if (rec) {
      const res = h('span', { class: 'note', 'aria-live': 'polite' });
      out.append(h('br'), h('span', { class: 'note' }, 'Ligne de journal n° ' + rec.seq + ', empreinte '), h('code', {}, SHORT(rec.hash)), ' ',
        h('button', { class: 'quiet', type: 'button', onclick: () => { const x = replayRecord(rec); res.textContent = x.ok ? ' Recalculée dans cette page : identique.' : ' Recalculée : différente, la ligne a changé.'; } }, 'Rejouer le calcul'), res);
    }
    out.append(h('div', { class: 'row' }, h('button', { class: 'btn btn-main', type: 'button', id: 'fiche-btn', onclick: showFiche }, 'Voir la fiche d’incident')));
  }

  function showFiche() {
    const { scenario, result, decision, revocation } = st;
    const rows = readRows();
    const inc = buildFiche(rows, { decisionSeq: decision.seq, revocationSeq: revocation ? revocation.seq : null, scenario, result });
    if (ficheEl) ficheEl.remove();
    const slot = (ficheEl = h('div', { id: 'apres-fiche' })); box.append(slot);
    slot.append(renderFiche(inc, {
      rows,
      onJson: () => { const blob = new Blob([JSON.stringify(inc, null, 1)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = h('a', { href: url, download: 'holdup_fiche_' + inc.id + '.json' }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); },
      onPrint: () => { try { globalThis.print(); } catch (_) { /* rien */ } }
    }));
    if (onFiche) onFiche(inc);
    return inc;
  }

  return {
    // la personne a traverse la fenetre et continue : decisionRow = la ligne de journal que app.js vient d'ecrire
    granted(scenario, limited, decisionRow) { if (!decisionRow) return hide(); return show(scenario, limited, decisionRow); },
    // raccourci de demonstration : saute les 10 s de la fenetre. Il ecrit la meme ligne de decision, marquee `raccourci`.
    shortcut(scenario) {
      let level = null, niveau = null, fiche = null;
      try { const b = { ...withIntent(scenario.body, scenario.intentHonnete, scenario.ecrit ? scenario.intentDetails : undefined) }; const v = check(b, sanitizeLocalContext(localOf(scenario))); level = displayLevel(v).key; niveau = v.niveau; fiche = v.fiche; } catch (_) { /* rien */ }
      const rec = log({ source: 'demo', scenario: scenario.id, intent: scenario.intentHonnete, level, niveau, fiche, decision: 'sign', delay_s: null, ms: null, raccourci: true });
      return show(scenario, false, rec);
    },
    reset: hide,
    state: () => st
  };
}
