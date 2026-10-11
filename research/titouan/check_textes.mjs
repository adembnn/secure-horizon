// Contrôle de U_textes_utilisateur.json (Node 24, zéro dépendance).
// Usage : node check_textes.mjs   (code de sortie 1 s'il y a au moins une erreur)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const doc = JSON.parse(readFileSync(join(dir, 'U_textes_utilisateur.json'), 'utf8'));

const MAX_MOTS = 12;
const MIN_MOTS = 4; // phrases des fiches et énoncés des questions : jamais un libellé seul
const MIN_MOTS_OPTION = 1; // réponses courtes autorisées ("Jamais", "Non") car elles complètent un énoncé complet
const MAX_MOTS_RENDU = 14; // avertissement seulement : ligne avec valeurs d'exemple
const NIVEAUX = ['critical', 'warn', 'info'];

// Mots interdits (jargon, anglicismes techniques, vouvoiement, promesses de sécurité).
const INTERDITS = [
  'spender', 'calldata', 'permit', 'permit2', 'approve', 'approval', 'approbation', 'approuver',
  'allowance', 'typed data', 'typed', 'eip', 'erc', 'siwe', 'seaport', 'delegatecall', 'multicall',
  'multisend', 'nonce', 'slippage', 'hash', 'token', 'tokens', 'wallet', 'blockchain', 'smart contract',
  'contrat', 'proxy', 'module', 'safe', 'owner', 'gas', 'phishing', 'drainer', 'honeypot', 'clipper',
  'ens', 'dapp', 'airdrop', 'bridge', 'swap', 'ok', 'vert', 'protégé', 'protégée', 'bloqué', 'bloquée',
  'vous', 'votre', 'vos', 'tu es sûr',
];
const NUMERO = /\b(7702|4337|2612)\b/;

const FICHES_REQUISES = {
  F01: 'droit illimité (approve)', F02: 'autorisation par signature', F03: 'tous les NFT',
  F04: 'offre NFT à zéro', F05: 'signature aveugle', F06: 'connexion d\'un autre site',
  F07: 'changement de propriétaire', F08: 'module / signataire Safe', F09: 'appel délégué',
  F10: 'mise à jour contrat intermédiaire', F11: 'délégation 7702', F12: 'appel caché dans envoi groupé',
  F13: 'adresse qui ressemble (empoisonnement)', F14: 'valeur nulle', F15: 'faux jeton',
  F16: 'jeton irrevendable', F17: 'destinataire d\'échange', F18: 'glissement de prix',
  F19: 'adresse copiée remplacée', F20: 'site sosie', F21: 'faux support', F22: 'faux remboursement',
  F23: 'faux recruteur', F24: 'pig butchering', F25: 'vérification impossible', F26: 'aucun signal',
};

const erreurs = [];
const avertissements = [];
const err = (id, champ, msg) => erreurs.push(`${id} ${champ}: ${msg}`);
const warn = (id, champ, msg) => avertissements.push(`${id} ${champ}: ${msg}`);

const variablesOk = new Set(Object.keys(doc.variables ?? {}));
const norm = (s) => s.toLowerCase().normalize('NFC');
const lettre = '[\\p{L}\\p{N}_]';
const motsInterdits = INTERDITS.map((m) => ({
  m,
  re: new RegExp(`(?<!${lettre})${m.replace(/ /g, '\\s+')}(?!${lettre})`, 'iu'),
}));

const compterMots = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const rendre = (s) => s.replace(/\{(\w+)\}/g, (_, k) => doc.variables?.[k] ?? `{${k}}`);

let nbLignes = 0;
function verifierLigne(id, champ, texte, min = MIN_MOTS) {
  nbLignes++;
  if (typeof texte !== 'string' || !texte.trim()) return err(id, champ, 'ligne vide ou absente');
  const n = compterMots(texte);
  if (n > MAX_MOTS) err(id, champ, `${n} mots (max ${MAX_MOTS}) : « ${texte} »`);
  if (n < min) err(id, champ, `${n} mots (min ${min}, jamais un libellé seul) : « ${texte} »`);
  for (const { m, re } of motsInterdits) {
    if (re.test(texte)) err(id, champ, `mot interdit « ${m} » dans : « ${texte} »`);
  }
  if (NUMERO.test(texte)) err(id, champ, `numéro technique interdit dans : « ${texte} »`);
  for (const v of texte.matchAll(/\{([^}]*)\}/g)) {
    if (!variablesOk.has(v[1])) err(id, champ, `variable inconnue {${v[1]}}`);
  }
  const accolades = (texte.match(/[{}]/g) ?? []).length;
  const complet = [...texte.matchAll(/\{\w+\}/g)].length * 2;
  if (accolades !== complet) err(id, champ, `accolades mal formées : « ${texte} »`);
  const nr = compterMots(rendre(texte));
  if (nr > MAX_MOTS_RENDU) warn(id, champ, `${nr} mots une fois les valeurs d'exemple posées : « ${rendre(texte)} »`);
}

const ids = new Set();
const repartition = { A: 0, B: 0, C: 0 };
const niveaux = {};
for (const fiche of doc.fiches) {
  const id = fiche.id;
  if (ids.has(id)) err(id, 'id', 'doublon');
  ids.add(id);
  for (const champ of ['menace', 'croit', 'reel', 'danger', 'action', 'gravite_phrase']) {
    verifierLigne(id, champ, fiche[champ]);
  }
  if (fiche.variante_info) {
    const v = fiche.variante_info;
    if (v.gravite !== 'info') err(id, 'variante_info', 'la variante courte doit être de niveau info');
    if (!Array.isArray(v.lignes) || v.lignes.length !== 2) err(id, 'variante_info', '2 lignes attendues');
    else v.lignes.forEach((l, i) => verifierLigne(id, `variante_info.ligne${i + 1}`, l));
  }
  if (typeof fiche.technique !== 'string' || !fiche.technique) err(id, 'technique', 'absent (nom interne)');
  if (!NIVEAUX.includes(fiche.gravite)) err(id, 'gravite', `niveau inconnu « ${fiche.gravite} »`);
  niveaux[fiche.gravite] = (niveaux[fiche.gravite] ?? 0) + 1;
  if (!Array.isArray(fiche.questions) || fiche.questions.length !== 3) {
    err(id, 'questions', 'il en faut exactement 3');
    continue;
  }
  fiche.questions.forEach((qq, i) => {
    const c = `question${i + 1}`;
    verifierLigne(id, `${c}.q`, qq.q);
    const cles = Object.keys(qq.options ?? {}).sort().join('');
    if (cles !== 'ABC') err(id, `${c}.options`, `options A, B, C attendues, reçu « ${cles} »`);
    for (const L of ['A', 'B', 'C']) verifierLigne(id, `${c}.${L}`, qq.options?.[L], MIN_MOTS_OPTION);
    if (!['A', 'B', 'C'].includes(qq.reponse)) err(id, `${c}.reponse`, `réponse invalide « ${qq.reponse} »`);
    else repartition[qq.reponse]++;
    const textes = ['A', 'B', 'C'].map((L) => qq.options?.[L]);
    if (new Set(textes).size !== 3) err(id, `${c}.options`, 'deux options identiques');
  });
}
for (const [id, nom] of Object.entries(FICHES_REQUISES)) {
  if (!ids.has(id)) err(id, 'couverture', `fiche manquante : ${nom}`);
}
const fiche26 = doc.fiches.find((f) => f.id === 'F26');
if (fiche26 && fiche26.gravite !== 'info') err('F26', 'gravite', 'le cas bénin doit rester info');
const fiche25 = doc.fiches.find((f) => f.id === 'F25');
if (fiche25 && fiche25.gravite === 'info') err('F25', 'gravite', 'vérification impossible ne peut pas être info');

console.log(`Fiches : ${doc.fiches.length} | lignes contrôlées : ${nbLignes}`);
console.log(`Gravités : ${JSON.stringify(niveaux)} | bonnes réponses A/B/C : ${repartition.A}/${repartition.B}/${repartition.C}`);
for (const w of avertissements) console.log(`AVERTISSEMENT ${w}`);
for (const e of erreurs) console.log(`ERREUR ${e}`);
console.log(`Résultat : ${erreurs.length} erreur(s), ${avertissements.length} avertissement(s)`);
process.exit(erreurs.length ? 1 : 0);
