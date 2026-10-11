// boucle2 : ce que le moteur serveur répond pour une paire du panel de réglage, sans et avec ce que le produit lui envoie.  node sonde_moteur.mjs P-08113 [intent] [intent_kind]
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, '..', '..', '..', '..');
const { evaluatePlus } = await import(pathToFileURL(join(HERE, '..', 'pipeline', 'evaluate_plus.mjs')).href);
const id = process.argv[2], rows = readFileSync(join(ROOT, 'preuves', 'panel', 'REGLAGE.jsonl'), 'utf8').trim().split('\n').map(JSON.parse), r = rows.find((x) => x.id === id);
const realNow = Date.now; Date.now = () => 1791700000000;
const body = { method: r.request.method, params: r.request.params, chainId: '0x' + Number(r.context.chainId).toString(16), from: r.context.victim, origin: r.context.origin };
const local = { contacts: [], history: [], protected: [], knownSpenders: [], tokens: [] };
const show = (t, v) => console.log(t.padEnd(34), v.level, '|', (v.codes || []).join(','), '|', (v.raisons || []).map((x) => x.code + ':' + (x.severity || '')).join(' '), v.intent_contradiction ? '| contradiction' : '');
console.log(r.phrase, '|', r.effet_lisible);
show('sans intention', await evaluatePlus(body, local, { live: false }));
for (const [intent, kind] of [[undefined, 'buy_or_swap'], ['pay', 'pay_someone'], ['receive', 'connect_or_accept_offer'], ['login', 'connect_or_accept_offer']]) show('intent=' + intent + ' kind=' + kind, await evaluatePlus({ ...body, intent, intent_kind: kind, intent_text: r.phrase, intent_amount: '1000', intent_symbol: 'USDC' }, local, { live: false }));
Date.now = realNow;
