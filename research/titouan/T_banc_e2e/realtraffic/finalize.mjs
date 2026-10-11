// Applique les étiquettes de la revue MANUELLE (faite à la main par Claude, après lecture de chaque ligne + vérifications RPC en lecture seule) et calcule les chiffres de synthèse.
// F = fausse alerte, U = vraie alerte utile, I = indéterminé.
import fs from 'node:fs';
import path from 'node:path';
const HERE = path.resolve(import.meta.dirname), CACHE = path.join(HERE, 'cache_'), OUT = path.join(HERE, 'out');
const LAB = {
  cchain: {
    // critical 1-19 ; warn 20-50
    1: ['I', 'approve illimité vers contrat inconnu (3 approbateurs distincts) : ni preuve de légitimité ni de malveillance'],
    2: ['I', 'approve illimité vers contrat de 14 ko, 1 approbateur'], 3: ['I', 'approve illimité vers contrat de 18 ko, 1 approbateur'],
    4: ['F', 'approve illimité vers un routeur de type multicall utilisé par 16 portefeuilles distincts dans l\'échantillon'],
    5: ['I', 'approve illimité USDt vers contrat de 2 ko, 1 approbateur'], 6: ['I', 'approve illimité vers contrat de 2 ko, 1 approbateur'],
    7: ['I', 'appel opaque (2,5 ko) contenant un approve, destinataire vu 1 fois'], 8: ['F', 'approve illimité WAVAX vers le routeur 1inch v6 (agrégateur public connu)'],
    9: ['I', 'approve illimité vers contrat de 8,6 ko, 3 approbateurs'], 10: ['I', 'transferOwnership vers un proxy de 171 octets (forme d\'un proxy Safe) : admin légitime plausible, alerte défendable'],
    11: ['I', 'idem 10'], 12: ['I', 'approve illimité vers contrat de 2 ko, 1 approbateur'], 13: ['I', 'idem 9'],
    14: ['U', 'approve illimité USDC vers un compte externe (sans code) : signal classique de risque'], 15: ['I', 'idem 9'],
    16: ['U', 'approve illimité USDt vers un compte externe (sans code)'], 17: ['I', 'approve illimité USDt vers contrat de 24 ko, 1 approbateur'],
    18: ['I', 'idem 10'], 19: ['I', 'approve illimité USDt vers contrat de 2 ko, 1 approbateur'],
    20: ['F', 'swap via le routeur 1inch (agrégateur connu, 8 portefeuilles) : sélecteur non décodé'], 21: ['F', 'approve vers un contrat utilisé par 11 approbateurs et 25 appelants'],
    22: ['I', 'bundler ERC-4337 (EntryPoint), pas un portefeuille utilisateur direct'], 23: ['U', 'swap avec minimum reçu = 0 (risque de sandwich réel)'],
    24: ['U', 'déploiement de contrat : rare pour un utilisateur, code non analysé'], 25: ['F', 'Universal Router : sous-commande non décodée (limite du décodeur)'],
    26: ['F', 'Universal Router : V4_SWAP non décodé (limite du décodeur)'], 27: ['I', 'valeur ~17 AVAX vers un compte externe avec 3 octets de données'],
    28: ['I', 'contrat vu 2 fois, 1 émetteur'], 29: ['I', 'contrat à 1 seul émetteur, 101 appels (robot)'], 30: ['F', 'contrat appelé par 37 portefeuilles distincts, sélecteur non décodé'],
    31: ['I', 'contrat vu par 7 émetteurs'], 32: ['F', 'contrat appelé par 11 portefeuilles distincts, avec valeur'], 33: ['I', 'contrat à 1 seul émetteur (robot)'],
    34: ['I', 'contrat à 4 émetteurs'], 35: ['I', 'contrat vu 1 fois'], 36: ['F', 'idem 30'], 37: ['F', 'idem 30'], 38: ['I', 'contrat à 1 seul émetteur, 124 appels (robot)'],
    39: ['I', 'contrat à 1 seul émetteur, 137 appels (robot)'], 40: ['F', 'contrat appelé par 64 portefeuilles distincts'], 41: ['F', 'idem 30'], 42: ['F', 'idem 40'],
    43: ['I', 'contrat à 1 seul émetteur'], 44: ['F', 'contrat appelé par 56 portefeuilles distincts'], 45: ['F', 'contrat appelé par 25 portefeuilles distincts'],
    46: ['I', 'contrat à 1 seul émetteur, 3 appels'], 47: ['I', 'approve vers contrat à 9 approbateurs'], 48: ['F', 'multicall vers le routeur à 16 portefeuilles (voir 4)'],
    49: ['I', 'contrat à 1 seul émetteur (robot)'], 50: ['F', 'idem 44'],
  },
  eth: {
    1: ['F', 'approve illimité vers un contrat à 18 approbateurs'], 2: ['F', 'Uniswap Universal Router (575 émetteurs) : permit2 vers le routeur lui-même'],
    3: ['F', 'approve illimité USDC vers un contrat de 1 ko à 114 approbateurs'], 4: ['I', 'approve illimité vers contrat de 22 ko, 2 approbateurs'],
    5: ['I', 'appel opaque (3,5 ko) contenant un approve, destinataire vu 1 fois'], 6: ['F', 'idem 2'], 7: ['F', 'idem 3'],
    8: ['U', 'swap avec minimum = 0 ET sortie envoyée à une autre adresse'], 9: ['F', 'idem 2'], 10: ['F', 'idem 3'],
    11: ['U', 'approve illimité USDT vers un compte externe (sans code)'], 12: ['I', 'commande Universal Router vers un contrat à 4 émetteurs'],
    13: ['F', 'routeur de type Universal Router à 348 émetteurs'], 14: ['F', 'approve illimité vers un contrat de 736 octets à 81 approbateurs'],
    15: ['F', 'approve illimité USDT vers un contrat à 106 approbateurs'], 16: ['I', 'approve illimité vers contrat à 4 approbateurs'],
    17: ['F', 'setApprovalForAll vers le conduit OpenSea (opérateur reconnu)'], 18: ['F', 'idem 2'], 19: ['F', 'approve illimité vers un contrat à 106 approbateurs'],
    20: ['I', 'approve illimité vers contrat de 17 ko, 2 approbateurs'], 21: ['F', 'contrat appelé par 99 portefeuilles'], 22: ['F', 'approve vers le proxy 0x Exchange (20 approbateurs)'],
    23: ['U', 'swap avec minimum reçu = 0 (valeur 0,2 ETH)'], 24: ['I', 'bundler ERC-4337'], 25: ['F', 'Universal Router V4_SWAP non décodé (limite du décodeur)'],
    26: ['F', 'droit illimité vers Permit2 (flux standard)'], 27: ['U', 'déploiement de contrat'], 28: ['I', 'transfert avec 3 octets de données vers un compte externe'],
    29: ['I', 'calldata mal formé (offset hors limites), vu 1 fois'], 30: ['I', 'contrat à 10 émetteurs, sélecteur inconnu, avec valeur'],
  },
};
const t6 = (a) => (a ? a.slice(0, 6) + '..' + a.slice(-4) : 'null');
function wilson(k, n, z = 1.96) { if (!n) return [0, 0]; const p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), m = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)]; }
const st = (k, n) => { const [l, h] = wilson(k, n); return { k, n, pct: +(100 * k / n).toFixed(1), wilson95_pct: [+(100 * l).toFixed(1), +(100 * h).toFixed(1)] }; };
const OPAC = /unknown_selector|opaque|short_calldata|decode_error|contract_creation|ur_command_opaque/;
const syn = {};
for (const chain of ['cchain', 'eth']) {
  const rev = JSON.parse(fs.readFileSync(path.join(CACHE, `review_${chain}.json`), 'utf8'));
  const rows = rev.map((r) => ({ n: r.n, niveau: r.level, to: t6(r.to_full), selecteur: r.selector, decode: r.name, raisons: r.codes, label: LAB[chain][r.n][0], pourquoi: LAB[chain][r.n][1] }));
  fs.writeFileSync(path.join(OUT, `revue_manuelle_${chain}.json`), JSON.stringify(rows, null, 1));
  const R = JSON.parse(fs.readFileSync(path.join(OUT, `real_${chain}.json`), 'utf8'));
  const all = JSON.parse(fs.readFileSync(path.join(CACHE, `rows_${chain}.json`), 'utf8'));
  const s = {};
  for (const lv of ['critical', 'warn']) {
    const sub = rows.filter((r) => r.niveau === lv), c = { F: 0, U: 0, I: 0 }; sub.forEach((r) => c[r.label]++);
    s[lv] = { n_revus: sub.length, fausse_alerte: c.F, vraie_alerte_utile: c.U, indetermine: c.I, fausse_alerte_taux_borne_basse: st(c.F, sub.length), fausse_ou_indetermine_borne_haute: st(c.F + c.I, sub.length), utile_taux: st(c.U, sub.length) };
  }
  const A = all.A; const al = A.filter((r) => r.level === 'critical' || r.level === 'warn');
  s.part_alertes_uniquement_opacite = st(al.filter((r) => r.codes.every((c) => OPAC.test(c))).length, al.length);
  s.part_alertes_critical_dans_trafic = R.mode_A_sans_intention_sans_contexte.par_niveau.critical;
  s.critical_faux_confirmes_dans_trafic_borne_basse_estimee_pct = +(100 * (R.mode_A_sans_intention_sans_contexte.par_niveau.critical.k * s.critical.fausse_alerte / s.critical.n_revus) / R.n_tx_analysees).toFixed(3);
  syn[chain] = s;
}
fs.writeFileSync(path.join(OUT, 'synthese.json'), JSON.stringify(syn, null, 1));
console.log(JSON.stringify(syn, null, 1));
