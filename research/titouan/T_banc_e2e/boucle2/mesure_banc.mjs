// boucle2 : le MÊME jeu de paires, mesuré par la chaîne de banc qui a produit les chiffres du jeu aveugle (blind_decalage/run/mesure.mjs :
// moteur + politique + détecteurs, niveaux ok / warn / critical). Sert seulement à comparer avec « fausses alertes rouges 15 % ».
// Aucun cas du jeu aveugle n'est lu : mesurer() reçoit les cas en paramètre.   node mesure_banc.mjs reglage [tag]   |   node mesure_banc.mjs controle final
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const jeu = process.argv[2] || 'reglage', tag = process.argv[3] || 'essai';
if (jeu === 'controle') { if (tag !== 'final') throw new Error('contrôle : une seule mesure, tag final'); const lock = join(HERE, 'CONTROLE_OUVERT_banc.lock'); if (existsSync(lock)) throw new Error('déjà mesuré'); writeFileSync(lock, new Date().toISOString() + '\n', { flag: 'wx' }); }
const M = await import(pathToFileURL(join(HERE, '..', 'blind_decalage', 'run', 'mesure.mjs')).href);
const rows = readFileSync(join(HERE, jeu === 'controle' ? 'CONTROLE.jsonl' : 'REGLAGE.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
const TOK = { 43114: [['USDC', '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e', 6], ['USDT', '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7', 6], ['WAVAX', '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7', 18]],
  1: [['USDC', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 6], ['USDT', '0xdac17f958d2ee523a2206206994597c13d831ec7', 6], ['DAI', '0x6b175474e89094c44da98b954eedeac495271d0f', 18], ['WETH', '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', 18]] };
const PUB = { 43114: ['0xe54ca86531e17ef3616d22ca28b0d458b6c89106', '0xbb00ff08d01d300023c629e8ffffcb65a5a578ce'], 1: ['0x7a250d5630b4cf539739df2c5dacb4c659f2488d', '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45'] };
const cas = rows.filter((r) => r.verite !== 'indecidable').map((r) => { const chain = Number(BigInt(r.chainId));
  return { id: r.id, family: r.scenario, subfamily: r.etiquette, label: r.verite === 'conforme' ? 'benign' : 'malicious', twin_of: null, lang: r.langue, request: r.request,
    context: { chainId: chain, origin: 'app.exemple.org', claimed_site: 'app.exemple.org', victim: r.from, address_book: [], history: [], counterparty_facts: {},
      known_protocols: [...PUB[chain], ...((r.contexte && r.contexte.knownSpenders) || []), '0x000000000022d473030f116ddee9f6b43ac78ba3', '0x0000000000000068f116a894984e2db1123eb395'].map((a) => ({ label: 'Protocole connu', address: a, provenance: 'S' })),
      token_registry: TOK[chain].map(([symbol, address, decimals]) => ({ symbol, address, decimals, canonical: true })) }, intent: { freeText: r.phrase } }; });
const { rows: out } = await M.mesurer(cas, { bras: ['a', 'c'] });
const res = {};
for (const arm of ['a', 'c']) { const c = M.chiffres(out, arm); res[arm] = { rappel: M.fmt(c.signales, c.n_mal), rouge: M.fmt(c.rouges, c.n_mal), fausse_alerte_rouge: M.fmt(c.fa_rouge, c.n_ben), fausse_alerte_warn_rouge: M.fmt(c.fa_warn_rouge, c.n_ben), non_mesures: c.non_mesures }; }
const parFam = {};
for (const r of out) { const f = (parFam[r.family] = parFam[r.family] || { ben: 0, fa_rouge: 0, mal: 0, signales: 0 }); const l = r.a && r.a.level; if (r.label === 'benign') { f.ben++; if (l === 'critical') f.fa_rouge++; } else { f.mal++; if (l === 'warn' || l === 'critical') f.signales++; } }
writeFileSync(join(HERE, 'out', `banc_${jeu}_${tag}.json`), JSON.stringify({ res, parFam, erreurs: out.filter((r) => r.erreurs.length).length }, null, 1));
console.log(JSON.stringify(res, null, 1));
console.log(Object.entries(parFam).filter(([, f]) => f.fa_rouge || f.signales < f.mal).map(([k, f]) => `${k}: faux rouges ${f.fa_rouge}/${f.ben}, signalés ${f.signales}/${f.mal}`).join('\n'));
