// Hold up Lab - attack builder. A juror picks a goal, a technique, disguises, a lure and an entry door; the lab turns that into a
// scenario of the same shape as the catalogue ones, runs it through the same verdict + ground-truth path, and keeps every attempt.
// The builder can only aim at the lab victim, with the lab's contracts and tokens, on the lab chain: no address, RPC URL or chain id
// comes from the caller.
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TECHNIQUES, GOALS, DISGUISES, DOORS, INTENT_KINDS, LabError, compile } from './ops.mjs';
import { finalize, familyOfTechnique, available } from './scenarios/index.mjs';
import { MESSAGES } from './scenarios/messages.mjs';
import { runScenario, exclusive, withSnapshot, summarize } from './run.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const JURY_FILE = process.env.LAB_JURY_FILE || join(HERE, 'scenarios', 'jury_attacks.jsonl');

const SPENDERS = { drainer: 'contrat tout neuf de l’attaquant', attacker_eoa: 'simple compte de l’attaquant', lookalike_router: 'sosie de l’adresse du routeur connu' };
const RECIPIENTS = { never_seen: 'adresse jamais vue', safe_vault: '« coffre sécurisé » de l’attaquant', lookalike_contact: 'sosie de l’adresse de Paul', collector: 'compte de l’attaquant' };
const AMOUNTS = ['max', 'max_minus_1', 'balance', 'most'];
const DEADLINES = ['far', 'near'];
const STAGING = {
  site: { brand: 'Site monté par le juré', buttonLabel: 'Valider' },
  message: { brand: 'Site monté par le juré', buttonLabel: 'Valider' },
  wallet_send: { brand: 'Portefeuille Moraine', buttonLabel: 'Envoyer' },
  support_chat: { brand: 'Portefeuille Moraine', buttonLabel: 'Envoyer' },
  exchange_withdraw: { brand: 'Aiguille Exchange', buttonLabel: 'Confirmer le retrait' },
};
const DEFAULT_INTENT = { permit: 'connect_or_accept_offer', permit2: 'connect_or_accept_offer', approve: 'connect_or_accept_offer', increase_allowance: 'connect_or_accept_offer',
  set_approval_for_all: 'connect_or_accept_offer', transfer: 'pay_someone', transfer_ownership: 'connect_or_accept_offer', swap_no_min: 'buy_or_swap' };
const INTENT_TEXT = { pay_someone: 'Je paie quelqu’un', send_to_my_account: 'Je déplace mes fonds vers mon autre compte', buy_or_swap: 'J’échange des jetons',
  connect_or_accept_offer: 'Je me connecte ou je réclame une offre', asked_by_someone: 'On m’a demandé de le faire', other: 'Autre chose' };

const techAvailable = (ctx, t) => (t === 'permit2' && !ctx.c.permit2 ? "Permit2 n'existe pas sur cette chaîne (mode hors ligne)." : null);
const disguiseAvailable = (ctx, d) => (DISGUISES[d].needs === 'multicall3' && !ctx.c.multicall3 ? "Multicall3 n'existe pas sur cette chaîne (mode hors ligne)." : null);
const doorsOf = (t, ds) => DOORS.filter((door) => {
  const sig = TECHNIQUES[t].kind !== 'tx';
  if (door === 'exchange') return t === 'transfer' && !ds.some((d) => DISGUISES[d].group === 'batch');
  if (door === 'wallet' && (sig || ds.includes('personal_sign_calldata'))) return false;
  return ds.every((d) => !DISGUISES[d].doors || DISGUISES[d].doors.includes(door));
});

// every technique x set of at most `max` compatible disguises (one per group)
export function combinations(ctx, max = 2) {
  const out = [];
  for (const [t, def] of Object.entries(TECHNIQUES)) {
    if (!def.attack || techAvailable(ctx, t)) continue;
    const ds = Object.entries(DISGUISES).filter(([d, x]) => x.for.includes(t) && !disguiseAvailable(ctx, d)).map(([d]) => d);
    const sets = [[]];
    for (const d of ds) sets.push([d]);
    if (max >= 2) for (let i = 0; i < ds.length; i++) for (let j = i + 1; j < ds.length; j++) if (DISGUISES[ds[i]].group !== DISGUISES[ds[j]].group) sets.push([ds[i], ds[j]]);
    for (const s of sets) { const doors = doorsOf(t, s); if (doors.length) out.push({ technique: t, disguises: s, doors }); }
  }
  return out;
}

export function options(ctx) {
  const combos = combinations(ctx, 2);
  return {
    goals: Object.entries(GOALS).map(([id, g]) => ({ id, label: g.label, techniques: g.techniques })),
    techniques: Object.entries(TECHNIQUES).filter(([, t]) => t.attack).map(([id, t]) => ({ id, label: t.label, kind: t.kind, available: !techAvailable(ctx, id), ...(techAvailable(ctx, id) ? { why: techAvailable(ctx, id) } : {}),
      disguises: Object.entries(DISGUISES).filter(([, d]) => d.for.includes(id)).map(([d]) => d),
      params: { token: id === 'transfer' ? ['avax', ...Object.keys(ctx.tokens)] : ['permit', 'permit2', 'approve', 'increase_allowance'].includes(id) ? Object.keys(ctx.tokens).filter((k) => id !== 'permit' || ctx.tokens[k].permitName) : [],
        amount: ['permit', 'permit2', 'approve', 'increase_allowance', 'transfer', 'swap_no_min'].includes(id), spender: !!TECHNIQUES[id].grants, recipient: ['transfer', 'swap_no_min'].includes(id), deadline: ['permit', 'permit2'].includes(id) } })),
    disguises: Object.entries(DISGUISES).map(([id, d]) => ({ id, label: d.label, group: d.group, techniques: d.for, doors: d.doors || DOORS, available: !disguiseAvailable(ctx, id) })),
    params: { amount: { choices: AMOUNTS, free: 'nombre décimal en unités du jeton (ex. 250.5)' }, deadline: DEADLINES, spender: SPENDERS, recipient: RECIPIENTS },
    lure: {
      staging: Object.keys(STAGING), intents: INTENT_KINDS.map((k) => ({ kind: k, label: INTENT_TEXT[k] })),
      messages: Object.values(MESSAGES).map((m) => ({ id: m.id, label: m.label, text: m.text, source: m.source })),
      note: 'Les messages proviennent des catalogues existants du dépôt ; le lab n’en écrit aucun.',
    },
    doors: DOORS,
    rules: 'Un seul déguisement par groupe. Cible unique : la victime du lab, ses jetons et les contrats du lab, sur la chaîne du lab.',
    combinations: { n: combos.length, note: 'technique x (aucun, un ou deux déguisements compatibles), toutes portes confondues' },
  };
}

// body = { goal, technique, disguises, params, lure: { staging, intent, intentText, messageId }, door } -> scenario (catalogue shape)
export async function buildAttack(ctx, body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new LabError('Corps attendu : un objet JSON { goal, technique, disguises, params, lure, door }.');
  const technique = String(body.technique || '');
  const tdef = TECHNIQUES[technique];
  if (!tdef || !tdef.attack) throw new LabError(`Technique inconnue. Choix possibles : ${Object.keys(TECHNIQUES).filter((t) => TECHNIQUES[t].attack).join(', ')}.`);
  const goal = body.goal === undefined ? Object.keys(GOALS).find((g) => GOALS[g].techniques.includes(technique)) : String(body.goal);
  if (!GOALS[goal]) throw new LabError(`But inconnu. Choix possibles : ${Object.keys(GOALS).join(', ')}.`);
  if (!GOALS[goal].techniques.includes(technique)) throw new LabError(`La technique « ${technique} » ne sert pas le but « ${goal} ».`);
  if (techAvailable(ctx, technique)) throw new LabError(techAvailable(ctx, technique));
  const disguises = body.disguises === undefined ? [] : body.disguises;
  if (!Array.isArray(disguises) || disguises.length > 4 || disguises.some((d) => typeof d !== 'string')) throw new LabError('« disguises » : une liste de 4 noms de déguisement au plus.');
  for (const d of disguises) {
    if (!DISGUISES[d]) throw new LabError(`Déguisement inconnu : ${d.slice(0, 40)}.`);
    if (disguiseAvailable(ctx, d)) throw new LabError(disguiseAvailable(ctx, d));
  }
  if (new Set(disguises).size !== disguises.length) throw new LabError('Le même déguisement est cité deux fois.');
  const door = body.door === undefined ? 'site' : String(body.door);
  if (!DOORS.includes(door)) throw new LabError(`Porte inconnue. Choix possibles : ${DOORS.join(', ')}.`);

  const pin = body.params === undefined ? {} : body.params;
  if (!pin || typeof pin !== 'object' || Array.isArray(pin)) throw new LabError('« params » : un objet.');
  const params = {};
  for (const [k, v] of Object.entries(pin)) {
    if (v === null || v === undefined || v === '') continue;
    if (k === 'token') { if (v !== 'avax' && !ctx.tokens[v]) throw new LabError(`Jeton inconnu. Choix possibles : avax, ${Object.keys(ctx.tokens).join(', ')}.`); params.token = v; }
    else if (k === 'amount') { if (!AMOUNTS.includes(v) && !/^\d{1,30}(\.\d{1,18})?$/.test(String(v))) throw new LabError(`Montant invalide : un nombre décimal ou ${AMOUNTS.join(', ')}.`); params.amount = String(v); }
    else if (k === 'deadline') { if (!DEADLINES.includes(v)) throw new LabError(`Échéance invalide : ${DEADLINES.join(' ou ')}.`); params.deadline = v; }
    else if (k === 'spender') { if (!SPENDERS[v]) throw new LabError(`Bénéficiaire refusé : l'attaque ne peut viser que les adresses du lab (${Object.keys(SPENDERS).join(', ')}).`); params.spender = v; }
    else if (k === 'recipient') { if (!RECIPIENTS[v]) throw new LabError(`Destinataire refusé : l'attaque ne peut viser que les adresses du lab (${Object.keys(RECIPIENTS).join(', ')}).`); params.recipient = v; }
    else throw new LabError(`Paramètre inconnu : ${String(k).slice(0, 40)}. Paramètres acceptés : token, amount, deadline, spender, recipient.`);
  }
  const lure = body.lure === undefined ? {} : body.lure;
  if (!lure || typeof lure !== 'object' || Array.isArray(lure)) throw new LabError('« lure » : un objet { staging, intent, intentText, messageId }.');
  const defKind = door === 'exchange' ? 'exchange_withdraw' : door === 'wallet' ? 'wallet_send' : 'site';
  const kind = lure.staging === undefined ? defKind : String(lure.staging);
  if (!STAGING[kind]) throw new LabError(`Mise en scène inconnue. Choix possibles : ${Object.keys(STAGING).join(', ')}.`);
  const intentKind = lure.intent === undefined ? DEFAULT_INTENT[technique] : String(lure.intent);
  if (!INTENT_KINDS.includes(intentKind)) throw new LabError(`Intention inconnue. Choix possibles : ${INTENT_KINDS.join(', ')}.`);
  let messageId = null;
  if (lure.messageId !== undefined && lure.messageId !== null && lure.messageId !== '') {
    if (!MESSAGES[lure.messageId]) throw new LabError(`Message inconnu : le lab n'accepte que les messages déjà présents dans les catalogues du dépôt (${Object.keys(MESSAGES).join(', ')}).`);
    messageId = lure.messageId;
  }
  const intentText = typeof lure.intentText === 'string' && lure.intentText.trim() ? lure.intentText.trim().slice(0, 200) : INTENT_TEXT[intentKind];

  const recipe = { technique, params, disguises: [...disguises] };
  const id = 'jury-' + createHash('sha256').update(JSON.stringify([goal, recipe, door, kind, intentKind, intentText, messageId])).digest('hex').slice(0, 12);
  const names = disguises.map((d) => DISGUISES[d].label.toLowerCase());
  const sc = finalize({
    id, door, family: familyOfTechnique(technique), label: 'malveillant', built: true, goal,
    title: `${tdef.label}${names.length ? ' ; ' + names.join(' ; ') : ''}`,
    story: `Attaque montée dans le lab : ${GOALS[goal].label.toLowerCase()}. La victime pense : « ${intentText} ».`,
    staging: { kind, ...STAGING[kind], origin: kind === 'site' || kind === 'message' ? 'https://site-du-jure.example' : undefined, pitch: '', ...(messageId ? { messageId } : {}) },
    intent: { kind: intentKind, freeText: intentText },
    recipe, editable: ['intentKind', 'pastedMessage'],
  });
  // it must really be executable on the lab chain against the lab victim: compiled once in a throwaway snapshot
  await exclusive(() => withSnapshot(ctx, () => compile(ctx, sc, {})));
  return sc;
}
// a scenario object received from a client is never trusted: it is rebuilt from its recipe
export function rebuild(ctx, s) {
  if (!s || typeof s !== 'object' || Array.isArray(s) || !s.recipe || typeof s.recipe !== 'object') throw new LabError('« scenario » : un scénario produit par /api/attack/build est attendu.');
  const st = s.staging && typeof s.staging === 'object' ? s.staging : {};
  const it = s.intent && typeof s.intent === 'object' ? s.intent : {};
  return buildAttack(ctx, { goal: s.goal, technique: s.recipe.technique, disguises: s.recipe.disguises, params: s.recipe.params, door: s.door, lure: { staging: st.kind, intent: it.kind, intentText: it.freeText, messageId: st.messageId } });
}
const lean = ({ build, truth, ...rest }) => rest;
export const publicBuilt = (ctx, sc) => ({ ...lean(sc), ...available(ctx, sc) });

// ------------------------------------------------------------------ append-only log of every attack tried
const append = (rec) => appendFileSync(JURY_FILE, JSON.stringify(rec) + '\n');
export function readLog() {
  if (!existsSync(JURY_FILE)) return [];
  const attacks = new Map();
  for (const line of readFileSync(JURY_FILE, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    let r; try { r = JSON.parse(line); } catch { continue; }
    if (r.type === 'attack' && r.scenario && r.scenario.id) { const prev = attacks.get(r.scenario.id); attacks.set(r.scenario.id, { ...(prev || {}), id: r.scenario.id, scenario: r.scenario, author: r.author, savedAt: prev ? prev.savedAt : r.ts, saves: ((prev && prev.saves) || 0) + 1 }); }
    else if (r.type === 'outcome' && attacks.has(r.id)) attacks.get(r.id).last = { ts: r.ts, outcome: r.outcome, outcomeDetail: r.outcomeDetail, level: r.level, outcomePlus: r.outcomePlus, levelPlus: r.levelPlus, attackWorks: r.attackWorks, lossUsd: r.lossUsd };
  }
  return [...attacks.values()];
}
export function recordOutcome(res) {
  if (!res || !/^jury-/.test(String(res.id)) || !readLog().some((a) => a.id === res.id)) return;
  append({ type: 'outcome', ts: new Date().toISOString(), id: res.id, outcome: res.outcome, outcomeDetail: res.outcomeDetail, level: res.verdict ? res.verdict.level : null, outcomePlus: res.outcomePlus, levelPlus: res.verdictPlus ? res.verdictPlus.level : null, attackWorks: res.truth ? res.truth.attackWorks : null, lossUsd: res.truth ? res.truth.lossUsd : null });
}
export async function saveAttack(ctx, body) {
  if (!body || typeof body !== 'object') throw new LabError('Corps attendu : { scenario, author }.');
  const sc = await rebuild(ctx, body.scenario);
  const author = String(body.author || 'anonyme').replace(/[^\p{L}\p{N} _.@-]/gu, '').slice(0, 60) || 'anonyme';
  append({ type: 'attack', ts: new Date().toISOString(), author, scenario: lean(sc) });
  const res = await runScenario(ctx, sc);
  recordOutcome(res);
  return { saved: true, id: sc.id, author, file: 'lab/server/scenarios/jury_attacks.jsonl', result: res };
}
export async function runSaved(ctx) {
  const results = [];
  for (const a of readLog()) {
    try { const sc = await rebuild(ctx, a.scenario); const r = await runScenario(ctx, sc); recordOutcome(r); const { request, ...rest } = r; results.push({ ...rest, author: a.author }); }
    catch (e) { results.push({ id: a.id, author: a.author, error: true, message: e.message }); }
  }
  return { results, summary: summarize(results.filter((r) => !r.error)) };
}

// ------------------------------------------------------------------ systematic sweep: every buildable technique x disguise set, per door
export async function sweep(ctx, { door, max = 2 } = {}) {
  const rows = [];
  for (const combo of combinations(ctx, max)) {
    for (const d of combo.doors) {
      if (door && d !== door) continue;
      // a direct transfer is tried with the demo stable token and with the native coin (the two behave differently once wrapped)
      for (const params of combo.technique === 'transfer' && d !== 'exchange' ? [{}, { token: 'avax', amount: '20' }] : [{}]) {
      const base = { technique: combo.technique, disguises: combo.disguises, door: d, ...(params.token ? { params } : {}) };
      try {
        const sc = await buildAttack(ctx, base);
        const r = await runScenario(ctx, sc);
        rows.push({ ...base, id: sc.id, covered: r.covered, level: r.verdict ? r.verdict.level : null, outcome: r.outcome, outcomeDetail: r.outcomeDetail, levelPlus: r.verdictPlus ? r.verdictPlus.level : null, outcomePlus: r.outcomePlus, addedBy: r.verdictPlus ? r.verdictPlus.addedBy : [], attackWorks: r.truth.attackWorks, lossUsd: r.truth.lossUsd, label: 'malveillant', verdict: r.verdict ? { ms: r.verdict.ms } : null });
      } catch (e) { rows.push({ ...base, error: true, message: e.message }); }
      }
    }
  }
  const ok = rows.filter((r) => !r.error);
  const tally = (key) => ok.reduce((m, r) => { m[r[key] || 'aucun'] = (m[r[key] || 'aucun'] || 0) + 1; return m; }, {});
  return {
    n: rows.length, construites: ok.length, refusees: rows.length - ok.length,
    produit: tally('outcome'), avec_detecteurs: tally('outcomePlus'),
    rates: ok.filter((r) => r.outcome === 'raté').map((r) => ({ technique: r.technique, disguises: r.disguises, door: r.door, ...(r.params ? { params: r.params } : {}), level: r.level, detail: r.outcomeDetail, lossUsd: r.lossUsd, avec_detecteurs: r.outcomePlus })),
    rows,
  };
}
