// Hold up Lab - one run = build the request, ask the product, execute the counterfactual on the lab chain, read what moved, roll back.
import { ethers, ABI, lc, isAddr, snapshot, revert, toppedUp } from './chain.mjs';
import { compile, LabError } from './ops.mjs';
import { evaluateBody, evaluatePlus, judgeRaw } from './product.mjs';

// ------------------------------------------------------------------ the outcome rule (stated once, applied everywhere, returned by /api/health)
export const OUTCOME_RULE = {
  niveaux: 'Le produit rend un niveau interne : critical (affiché « danger » ou « manipulation »), warn (affiché « attention » ou « non vérifié »), info (aucun signal).',
  regles: [
    { cas: 'scénario non couvert (covered: false)', resultat: 'non couvert', note: 'le produit ne voit pas la demande par cette porte : aucun verdict' },
    { cas: 'malveillant, et la vérité terrain montre que rien n’est pris ni accordé', resultat: 'attaque inopérante', note: 'l’attaque ne marche pas sur la chaîne : ni un arrêt ni un raté' },
    { cas: 'malveillant + critical', resultat: 'arrêté' },
    { cas: 'malveillant + warn', resultat: 'raté', detail: 'averti seulement' },
    { cas: 'malveillant + info', resultat: 'raté', detail: 'aucune alerte' },
    { cas: 'bénin + critical', resultat: 'fausse alerte' },
    { cas: 'bénin + warn', resultat: 'laissé passer à raison', detail: 'avec avertissement' },
    { cas: 'bénin + info', resultat: 'laissé passer à raison' },
  ],
  note: 'Une transaction que le RPC protecteur refuse de lire compte comme critical (elle ne part pas). La même règle s’applique à la colonne « avec détecteurs ».',
};
export function outcomeOf({ label, covered, niveau, attackWorks }) {
  if (!covered) return { outcome: 'non couvert' };
  const crit = niveau === 'critical';
  if (label === 'malveillant') {
    if (attackWorks === false) return { outcome: 'attaque inopérante' };
    if (crit) return { outcome: 'arrêté' };
    return { outcome: 'raté', detail: niveau === 'warn' ? 'averti seulement' : 'aucune alerte' };
  }
  if (crit) return { outcome: 'fausse alerte' };
  return { outcome: 'laissé passer à raison', ...(niveau === 'warn' ? { detail: 'avec avertissement' } : {}) };
}

// ------------------------------------------------------------------ what the lab watches on the chain
function holders(ctx, extra, attackers) {
  const a = ctx.accounts, c = ctx.c;
  const list = [
    [a.victim, 'victime', 'victim'], [c.vault, 'coffre de la victime (contrat dont elle est propriétaire)', 'victim'], [a.own2, 'second compte de la victime', 'victim'],
    [a.exchange, 'plateforme (avoirs de la victime en dépôt)', 'victim'],
    [a.collector, 'attaquant', 'attacker'], [a.attackerEoa, 'compte de l’attaquant', 'attacker'], [c.drainer, 'contrat de l’attaquant', 'attacker'],
    [c.shady, 'routeur inconnu', 'attacker'], [ctx.lookalikes.contact, 'sosie de l’adresse de Paul', 'attacker'], [ctx.lookalikes.router, 'sosie du routeur connu', 'attacker'],
    [ctx.neverSeen, 'adresse jamais vue', 'attacker'], [ctx.safeVault, '« coffre sécurisé » annoncé par le message', 'attacker'],
    [a.contact, 'Paul (contact)', 'neutral'], [c.router, 'routeur de démo', 'neutral'], [ctx.merchant, 'commerçant payé pour la première fois', 'neutral'],
  ].map(([address, name, side]) => ({ address: lc(address), name, side }));
  const seen = new Set(list.map((h) => h.address));
  for (const x of extra) if (isAddr(x) && !seen.has(lc(x))) { seen.add(lc(x)); list.push({ address: lc(x), name: null, side: attackers.includes(lc(x)) ? 'attacker' : 'other' }); }
  for (const h of list) if (attackers.includes(h.address) && h.side !== 'victim') h.side = 'attacker';
  return list;
}

async function readState(ctx, hs) {
  const { rpc, c } = ctx;
  const erc = ABI.erc20, V = ctx.accounts.victim;
  const tokens = Object.entries(ctx.tokens).filter(([k, t], i, arr) => arr.findIndex(([, u]) => lc(u.address) === lc(t.address)) === i);
  const spenders = hs.filter((h) => h.side !== 'victim').map((h) => h.address).concat(c.permit2 ? [lc(c.permit2)] : []);
  const calls = [], keys = [];
  const add = (key, to, iface, fn, args) => { keys.push([key, iface, fn]); calls.push(['eth_call', [{ to, data: iface.encodeFunctionData(fn, args) }, 'latest']]); };
  for (const h of hs) {
    keys.push([`bal|AVAX|${h.address}`, null]); calls.push(['eth_getBalance', [h.address, 'latest']]);
    for (const [k, t] of tokens) add(`bal|${k}|${h.address}`, t.address, erc, 'balanceOf', [h.address]);
    add(`bal|DNFT|${h.address}`, c.nft, ABI.nft, 'balanceOf', [h.address]);
  }
  for (const s of spenders) {
    for (const [k, t] of tokens) add(`alw|${k}|${s}`, t.address, erc, 'allowance', [V, s]);
    add(`nfa|DNFT|${s}`, c.nft, ABI.nft, 'isApprovedForAll', [V, s]);
    if (c.permit2 && s !== lc(c.permit2)) for (const [k, t] of tokens) add(`p2|${k}|${s}`, c.permit2, ABI.permit2, 'allowance', [V, t.address, s]);
  }
  add('own|vault', c.vault, ABI.vault, 'owner', []);
  const res = await rpc.batch(calls);
  const st = {};
  keys.forEach(([key, iface, fn], i) => {
    const r = res[i];
    if (typeof r !== 'string' || r === '0x') { st[key] = key.startsWith('own') ? null : 0n; return; }
    if (!iface) { st[key] = BigInt(r); return; }
    try { const d = iface.decodeFunctionResult(fn, r); st[key] = key.startsWith('own') ? d[0] : key.startsWith('nfa') ? (d[0] ? 1n : 0n) : BigInt(d[0]); } catch { st[key] = 0n; }
  });
  return st;
}

const ASSET = (ctx, k) => (k === 'AVAX' ? { symbol: 'AVAX', decimals: 18 } : k === 'DNFT' ? { symbol: 'DNFT', decimals: 0, address: ctx.c.nft } : ctx.tokens[k]);
const UNLIMITED = 2n ** 159n; // "unlimited" for a person: beyond any real supply (covers uint160 and uint256 maxima and "max - 1")
const fmt = (v, d) => ethers.formatUnits(v, d).replace(/\.0$/, '');

function diff(ctx, hs, before, mid, after, gasBy) {
  const byAddr = new Map(hs.map((h) => [h.address, h]));
  const V = lc(ctx.accounts.victim);
  const deltas = [], approvals = [], control = [];
  let attackerGain = false, rightToAttacker = false, stableTaken = 0n, otherTaken = false;
  for (const key of Object.keys(before)) {
    const [kind, k, addr] = key.split('|');
    if (kind === 'bal') {
      let b = before[key], a = after[key];
      if (k === 'AVAX' && gasBy[addr]) a += gasBy[addr]; // network fees are reported apart
      if (a === b) continue;
      const as = ASSET(ctx, k), h = byAddr.get(addr);
      if (k === 'AVAX' && h.side === 'attacker' && a < b) continue; // the attacker's own gas
      if (k === 'AVAX' && toppedUp.has(addr)) continue; // gas money given by the lab to an impersonated address
      deltas.push({ asset: as.address || 'native', symbol: as.symbol, holder: addr === V ? 'victime' : h.side === 'attacker' && addr === lc(ctx.accounts.collector) ? 'attaquant' : ethers.getAddress(addr), name: h.name, side: h.side, before: fmt(b, as.decimals), after: fmt(a, as.decimals), change: (a > b ? '+' : '-') + fmt(a > b ? a - b : b - a, as.decimals) });
      if (h.side === 'attacker' && a > b) { attackerGain = true; if (as.stable) stableTaken += a - b; else otherTaken = true; }
    } else if (kind === 'alw' || kind === 'nfa' || kind === 'p2') {
      const b = before[key], m = mid[key], a = after[key];
      if (b === m && m === a) continue;
      const as = ASSET(ctx, k), h = byAddr.get(addr) || { name: addr === lc(ctx.c.permit2 || '') ? 'Permit2' : null, side: 'neutral' };
      const show = (v) => (kind === 'nfa' ? (v ? 'tous les NFT' : 'aucun') : v >= UNLIMITED ? 'illimité' : fmt(v, as.decimals));
      approvals.push({ token: as.address, symbol: as.symbol, spender: ethers.getAddress(addr), spenderName: h.name, side: h.side, via: kind === 'alw' ? 'erc20' : kind === 'nfa' ? 'setApprovalForAll' : 'permit2', before: show(b), after: show(m), afterAttack: show(a), unlimited: kind === 'nfa' ? m === 1n : m >= UNLIMITED });
      if (h.side === 'attacker' && (m > b || a > b)) rightToAttacker = true;
    } else if (kind === 'own') {
      if (before[key] === after[key] && before[key] === mid[key]) continue;
      control.push({ contract: ctx.c.vault, name: 'coffre de la victime', ownerBefore: before[key], ownerAfter: mid[key] });
    }
  }
  const controlLost = control.some((x) => lc(x.ownerAfter) !== V && lc(x.ownerBefore) === V);
  // what ended up on the attacker's side, in stable demo tokens (1 token = 1 $); null when only other assets were taken
  const lossUsd = stableTaken > 0n ? Number(ethers.formatUnits(stableTaken, 6)) : otherTaken ? null : 0;
  return { deltas, approvals, control, lossUsd, attackWorks: attackerGain || rightToAttacker || controlLost, harm: { assetsTaken: attackerGain, rightGranted: rightToAttacker, controlLost } };
}

// ------------------------------------------------------------------ serialisation: one run at a time, the chain is always restored
let queue = Promise.resolve();
export function exclusive(fn) {
  const p = queue.then(fn, fn);
  queue = p.catch(() => {});
  return p;
}
export async function withSnapshot(ctx, fn) {
  const snap = await snapshot(ctx.rpc);
  try { return await fn(); } finally { await revert(ctx.rpc, snap); }
}

function explain(sc, res) {
  const v = res.verdict, t = res.truth, o = res.outcome;
  const took = t && t.lossUsd ? `${t.lossUsd.toLocaleString('fr-FR')} $ en jetons stables` : t && t.harm && t.harm.assetsTaken ? 'des avoirs' : t && t.harm && t.harm.controlLost ? 'le contrôle du contrat' : t && t.harm && t.harm.rightGranted ? 'un droit sur les avoirs' : null;
  const lvl = v ? `« ${v.level} »` : 'rien';
  if (o === null) return "Vérité terrain impossible à établir pour cette demande et aucune étiquette fournie : le lab montre le verdict sans le juger.";
  switch (o) {
    case 'non couvert': return `Hold up ne voit pas cette demande par cette porte : ${res.coverageNote || 'aucun verdict possible'}`;
    case 'attaque inopérante': return `Exécutée sur la chaîne, cette attaque ne prend rien et n'accorde aucun droit : elle ne compte ni comme arrêt ni comme raté (Hold up a dit ${lvl}).`;
    case 'arrêté': return `Hold up a dit ${lvl} et, sur la chaîne, signer aurait fait perdre ${took || 'ce que montre la colonne de droite'}.`;
    case 'raté': return `Hold up a dit ${lvl} (${res.outcomeDetail}) alors que, sur la chaîne, signer fait perdre ${took || 'ce que montre la colonne de droite'}.`;
    case 'fausse alerte': return `Hold up a dit ${lvl} alors que l'opération, exécutée sur la chaîne, ne fait rien d'autre que ce qui était voulu.`;
    default: return `Opération honnête, exécutée sur la chaîne sans perte inattendue ; Hold up a dit ${lvl}${res.outcomeDetail ? ' (' + res.outcomeDetail + ')' : ''}.`;
  }
}

// sc = scenario object (catalogue or built), params = overrides of editable fields, intent = { kind, freeText } override
export async function runScenario(ctx, sc, { params = {}, intent, compileWith, from } = {}) {
  return exclusive(() => withSnapshot(ctx, async () => {
    const { pastedMessage: pmOverride, intentKind, ...recipeParams } = params || {};
    const it = { ...(sc.intent || {}), ...(intentKind ? { kind: intentKind } : {}), ...(intent || {}) };
    const staging = sc.staging || {};
    const pasted = typeof pmOverride === 'string' ? pmOverride.slice(0, 4000) : staging.messageText || null;
    const origin = staging.origin || undefined;
    toppedUp.clear();
    const cp = compileWith ? await compileWith() : await compile(ctx, sc, recipeParams);
    const hs = holders(ctx, cp.watch, cp.attackers);
    const T = [performance.now()];
    const before = await readState(ctx, hs);
    T.push(performance.now());

    // 1) what Hold up says
    let verdict = null, relayed = false, pathNote;
    if (cp.path === 'extension') verdict = evaluateBody(ctx, cp.request, { origin, pageText: [staging.pitch, pasted].filter(Boolean).join('\n') || undefined, intent: it, from });
    else if (cp.path === 'paste') verdict = evaluateBody(ctx, cp.checked, { pageText: pasted || undefined, intent: it });
    else if (cp.path === 'rpc') {
      const j = await judgeRaw(ctx, cp.raw);
      relayed = !!j.relayed;
      verdict = j.verdict || (j.refused ? { level: 'refused', niveau: 'critical', croit: null, reel: null, conseil: null, danger: null, reasons: [j.message || 'Transaction refusée par le RPC protecteur.'], codes: [j.refused], fiche: null, ms: j.ms ?? 0 } : null);
      pathNote = j.simulated ? 'RPC protecteur absent : même pipeline appelé sur la transaction brute décodée' : 'transaction signée passée par le vrai RPC protecteur (rpc_garde/proxy.mjs) branché sur la chaîne du lab' + (relayed ? ' ; il l’a relayée' : ' ; il l’a retenue');
    }
    let verdictPlus = null;
    if (cp.covered) {
      // door-faithful: through the RPC the product gets neither the declared intent nor the message, so the second column does not either
      const vp = await evaluatePlus(ctx, cp.checked || cp.request, cp.path === 'rpc' ? {} : { origin, intent: it, pastedMessage: pasted || undefined });
      verdictPlus = { level: vp.level, niveau: vp.niveau, addedBy: vp.addedBy, baseLevel: vp.baseLevel, reasons: vp.reasons, liveFacts: vp.liveFacts, ms: vp.ms };
    }

    // 2) what really happens on the chain if the victim goes through with it
    T.push(performance.now());
    const env = {};
    const txs = [...cp.setupTxs];
    const vs = await cp.victimSteps(env);
    txs.push(...vs);
    const victimFailed = vs.some((x) => x.reverted);
    const mid = await readState(ctx, hs);
    if (cp.exploit && !victimFailed) txs.push(...(await cp.exploit(env)));
    const after = await readState(ctx, hs);
    T.push(performance.now());
    if (process.env.LAB_TIMING) console.error('[timing]', sc.id, T.map((t, i) => (i ? Math.round(t - T[i - 1]) : 0)).join(' '));
    const gasByVictim = vs.filter((x) => x.who === 'victime').reduce((s, x) => s + (x.gas || 0n), 0n);
    const gasPlatform = vs.filter((x) => x.who === 'plateforme').reduce((s, x) => s + (x.gas || 0n), 0n);
    const d = diff(ctx, hs, before, mid, after, { [lc(ctx.accounts.victim)]: gasByVictim, [lc(ctx.accounts.exchange)]: gasPlatform });
    const hashes = txs.map((x) => x.hash).filter(Boolean);
    const ends = {};
    (await ctx.rpc.batch(hashes.map((h) => ['eth_getTransactionByHash', [h]]))).forEach((t, i) => { if (t) ends[hashes[i]] = { from: t.from, to: t.to }; });
    const onlySignature = cp.signatureOnly && !cp.exploit;
    if (!sc.label) { sc = { ...sc, label: d.attackWorks ? 'malveillant' : 'benin', labelInferred: true }; }
    const truth = cp.noTruth ? null : {
      executed: true, reverted: victimFailed, ...(victimFailed ? { error: vs.find((x) => x.reverted).error } : {}),
      txs: txs.map((x) => ({ hash: x.hash, who: x.who, from: (ends[x.hash] || {}).from || null, to: (ends[x.hash] || {}).to || null, what: x.what, ...(x.before ? { before: true } : {}), ...(x.reverted ? { reverted: true, error: x.error } : {}) })),
      deltas: d.deltas, approvals: d.approvals, control: d.control, lossUsd: d.lossUsd, attackWorks: d.attackWorks, harm: d.harm,
      feesAvax: ethers.formatEther(gasByVictim),
      ...(onlySignature ? { note: 'Signature seule : sans transaction qui l’utilise, elle ne déplace rien sur la chaîne du lab.' } : {}),
      ...(cp.path === 'paste' ? { note: 'Le retrait est exécuté par le compte de la plateforme : la victime ne signe rien.' } : {}),
    };

    const niveau = verdict ? verdict.niveau : null;
    const works = cp.noTruth ? null : d.attackWorks;
    const o = cp.noTruth && !cp.labelGiven ? { outcome: null } : outcomeOf({ label: sc.label, covered: cp.covered, niveau, attackWorks: works });
    const op = !cp.covered ? { outcome: 'non couvert' } : verdictPlus && o.outcome ? outcomeOf({ label: sc.label, covered: cp.covered, niveau: verdictPlus.niveau, attackWorks: works }) : null;
    const res = {
      id: sc.id, door: sc.door, family: sc.family, label: sc.label, title: sc.title, path: cp.path, ...(pathNote ? { pathNote } : {}),
      covered: cp.covered, ...(cp.coverageNote ? { coverageNote: cp.coverageNote } : {}),
      request: cp.request, ...(cp.checked ? { checked: cp.checked } : {}), resolved: cp.resolved,
      ...(sc.labelInferred ? { labelInferred: true } : {}), verdict, verdictPlus, truth, ...(cp.noTruth ? { truthReason: cp.noTruth } : {}), outcome: o.outcome, ...(o.detail ? { outcomeDetail: o.detail } : {}),
      ...(op ? { outcomePlus: op.outcome, ...(op.detail ? { outcomePlusDetail: op.detail } : {}) } : {}),
    };
    res.explanation = explain(sc, res);
    return res;
  }));
}

export function summarize(results) {
  const ms = results.map((r) => r.verdict && r.verdict.ms).filter((x) => typeof x === 'number').sort((a, b) => a - b);
  const q = (p) => (ms.length ? ms[Math.min(ms.length - 1, Math.ceil(p * ms.length) - 1)] : null);
  const count = (key, f) => results.filter((r) => f(r[key], r)).length;
  const col = (key, det) => ({
    arretes: count(key, (o) => o === 'arrêté'), rates: count(key, (o) => o === 'raté'),
    rates_avertis: count(key, (o, r) => o === 'raté' && r[det] === 'averti seulement'), rates_sans_alerte: count(key, (o, r) => o === 'raté' && r[det] === 'aucune alerte'),
    fausses_alertes: count(key, (o) => o === 'fausse alerte'), laisses_passer: count(key, (o) => o === 'laissé passer à raison'),
    benins_avertis: count(key, (o, r) => o === 'laissé passer à raison' && r[det] === 'avec avertissement'),
    non_couverts: count(key, (o) => o === 'non couvert'), inoperantes: count(key, (o) => o === 'attaque inopérante'),
  });
  return {
    n: results.length, malveillants: results.filter((r) => r.label === 'malveillant').length, benins: results.filter((r) => r.label === 'benin').length,
    ...col('outcome', 'outcomeDetail'), p50_ms: q(0.5), p95_ms: q(0.95),
    avec_detecteurs: col('outcomePlus', 'outcomePlusDetail'),
    erreurs: results.filter((r) => r.error).length,
  };
}

export { LabError };
