// Inventaire des jeux de cas, et lecture des jeux AUTORISÉS dans un format commun.
// Les jeux interdits ne sont jamais ouvrables par ce fichier : ils n'ont pas de lecteur, seulement un chemin et une empreinte
// calculée par flux d'octets (lib/stats.mjs, sha256Fichier).
import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync, createReadStream } from 'node:fs';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { RACINE } from './decideur.mjs';
import { sha256Fichier } from './stats.mjs';
import { verite as veritePanel } from '../panel/gen_panel.mjs';

const T = 'research/titouan/T_banc_e2e/';
const hex = (n) => '0x' + Number(n).toString(16);
const originOf = (o) => { let s = String(o || 'site-inconnu.example'); if (/^https?:\/\//.test(s)) return s.replace(/\/+$/, ''); s = s.toLowerCase().replace(/[^a-z0-9.-]/g, '-'); return 'https://' + (s.includes('.') ? s : s + '.example'); };
const chainOf = (c) => { const p = c.request && Array.isArray(c.request.params) && c.request.params[0]; if (p && typeof p === 'object' && typeof p.chainId === 'string' && /^0x[0-9a-f]+$/i.test(p.chainId)) return p.chainId; const n = c.context && c.context.chainId; return Number.isFinite(Number(n)) && n !== null && n !== undefined ? hex(n) : undefined; };
const fromOf = (c) => { const v = c.context && c.context.victim; if (typeof v === 'string') return v; const p = c.request && Array.isArray(c.request.params) && c.request.params[0]; return p && typeof p === 'object' && typeof p.from === 'string' ? p.from : undefined; };
// Contexte local de l'extension (réglage facultatif « contexte ») construit à partir du monde du cas : c'est ce qu'une personne
// aurait dû saisir à la main dans les options. L'installation par défaut n'en a aucun.
export function contexteDuCas(c) {
  const x = c.context || {}; const arr = (a) => (Array.isArray(a) ? a : []);
  return { contacts: arr(x.address_book).filter((b) => b && b.address).map((b) => ({ address: b.address, label: b.label || '' })), history: arr(x.history), protected: [],
    knownSpenders: arr(x.known_protocols).map((p) => p && p.address).filter(Boolean),
    tokens: arr(x.token_registry).filter((t) => t && t.address && Number.isInteger(t.decimals)).map((t) => ({ address: t.address, symbol: t.symbol, decimals: t.decimals })) };
}
const commun = (c) => ({ id: c.id, request: c.request, chainId: chainOf(c), from: fromOf(c), origin: originOf(c.context && c.context.origin), brut: c });
const lire = (rel) => readFileSync(join(RACINE, rel), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));

// ERRATUM E1 (11 oct. 2026, trouvé sur la moitié réglage, après le scellement). Dans gen_panel.mjs, un envoi de monnaie du réseau
// porte le symbole interne « NATIF » alors que la phrase dit « ETH » ou « AVAX » : verite() y voyait un autre jeton et marquait
// « non conforme » des paires conformes (envoi natif sans écart). Les fichiers scellés ne sont pas touchés (leurs empreintes
// tiennent). La vérité est recalculée ici par la MÊME fonction verite(), après remplacement de « NATIF » par le symbole du
// réseau. La règle ne lit aucun résultat du produit ; elle s'applique aux trois parts. Les paires corrigées portent erratum: 'E1'.
const NATIF = { 1: 'ETH', 43114: 'AVAX' };
function erratumE1(c) {
  if (!c.effet || !Array.isArray(c.effet.parts) || !c.effet.parts.some((x) => x.t === 'send' && x.sym === 'NATIF')) return null;
  const effet = Object.assign({}, c.effet, { parts: c.effet.parts.map((x) => (x.t === 'send' && x.sym === 'NATIF' ? Object.assign({}, x, { sym: NATIF[c.context.chainId] }) : x)) });
  const v = veritePanel(c.affirmation, effet);
  return v.v !== c.verite ? v : null;
}
const adapt = {
  panel: (c) => { const e = erratumE1(c); return Object.assign(commun(c), { phrase: c.phrase, verite: e ? e.v : c.verite, raison: e ? e.why + ' [erratum E1 : vérité d\'origine « ' + c.verite + ' »]' : c.raison_verite, erratum: e ? 'E1' : null, effet: c.effet_lisible,
    cases: { nature: c.nature, ecart: c.ecart_construit, style: c.style, langue: c.langue, acte_ecrit: c.acte_ecrit, methode: c.request.method, axe: c.axe, 'nature×ecart': c.nature + ' × ' + c.ecart_construit, 'ecart×style': c.ecart_construit + ' × ' + c.style },
    vues: ['tout', c.dictee ? 'phrases_dictees' : 'hors_dictee', ...(c.axe === 'ecrit' && !c.dictee ? ['ecarts_ecrits_hors_dictee'] : []), ...(c.axe !== 'ecrit' ? ['attentes_par_defaut'] : [])] }); },
  grille: (c) => Object.assign(commun(c), { phrase: c.text, verite: { ne_correspond_pas: 'non_conforme', correspond: 'conforme', inverifiable: 'indecidable' }[c.truth], raison: c.why, effet: JSON.stringify(c.effect),
    cases: { famille: c.family, style: c.style, langue: c.lang, relation: c.relation, methode: c.request.method }, vues: ['tout'] }),
  etiquete: (c) => { const l = String(c.label || '').toLowerCase(); const v = /^malveillant|^malicious/.test(l) ? 'non_conforme' : /^b[eé]nin|^benign/.test(l) ? 'conforme' : 'autre:' + (l || 'sans_etiquette');
    return Object.assign(commun(c), { phrase: c.intent && typeof c.intent.freeText === 'string' ? c.intent.freeText : '', verite: v, raison: 'étiquette du jeu : ' + l, effet: String(c.reason || c.note || c.subfamily || c.technique || '').slice(0, 300),
      cases: { famille: String(c.family || c.technique || c.axis || 'sans_famille').slice(0, 60), methode: c.request && c.request.method }, vues: ['tout'] }); },
};

// Jeux rejoués par le banc. question : 'phrase_demande' (vérité = la demande correspond-elle à la phrase ?) ou
// 'etiquette' (vérité = malveillant / bénin posé par l'auteur du jeu : autre question, tableau séparé).
export const JEUX = [
  { nom: 'panel_controle', chemin: 'preuves/panel/CONTROLE.jsonl', role: 'controle', question: 'phrase_demande', lecteur: 'panel', generateur: 'preuves/panel/gen_panel.mjs', graine: 'holdup-preuves-panel-A-2026-10-11', auteur: 'agent de la mission preuves (auteur différent des règles du produit)', scelle: 'preuves/panel/CONTROLE_SHA256.txt', note: 'moitié contrôle du grand panel, scellée par son empreinte, mesurée une fois par bras' },
  { nom: 'panel_reglage', chemin: 'preuves/panel/REGLAGE.jsonl', role: 'reglage', question: 'phrase_demande', lecteur: 'panel', generateur: 'preuves/panel/gen_panel.mjs', graine: 'holdup-preuves-panel-A-2026-10-11', auteur: 'agent de la mission preuves', scelle: 'preuves/panel/REGLAGE_SHA256.txt', note: 'moitié réglage du grand panel : librement consultable pour corriger le produit ; aucune correction faite dans cette mission' },
  { nom: 'grille_controle', chemin: 'preuves/out/regen/grille/CONTROLE.jsonl', role: 'controle_deja_ouvert', question: 'phrase_demande', lecteur: 'grille', generateur: T + 'pipeline/grille/gen_grille.mjs', graine: 20261013, auteur: 'agent de la grille (même auteur que le repli lexical de la grille)', regen: 'grille',
    note: 'contrôle de la grille, régénéré à l\'identique (empreinte publiée 3644a72c…). Ouvert le 11 oct. 06:15 UTC ; depuis, extension/intent_text.js a reçu la règle GIVE_RIGHT écrite d\'après ses 23 fausses alertes : ce n\'est plus un contrôle propre pour le produit actuel' },
  { nom: 'grille_reglage', chemin: 'preuves/out/regen/grille/REGLAGE.jsonl', role: 'reglage', question: 'phrase_demande', lecteur: 'grille', generateur: T + 'pipeline/grille/gen_grille.mjs', graine: 20261013, auteur: 'agent de la grille', regen: 'grille', note: 'réglage de la grille, régénéré à l\'identique' },
  { nom: 'decalage', chemin: 'preuves/out/regen/decalage/DECALAGE.jsonl', role: 'reglage', question: 'etiquette', lecteur: 'etiquete', generateur: T + 'attacks_decalage/gen_decalage.mjs', graine: 20261011, auteur: 'équipe (cas et règles F31 à F33 écrits ensemble)', regen: 'decalage', note: '410 cas de décalage régénérés (ligne A5 des livrables)' },
  ...['jury_defi', 'jury_fp', 'jury_social', 'jury_fuzz_address', 'jury_fuzz_control', 'jury_fuzz_encoding', 'jury_fuzz_fp', 'jury_fuzz_intent', 'jury_fuzz_sig'].map((n) => ({ nom: n, chemin: T + 'redteam/' + n + '.jsonl', role: 'reglage', question: 'etiquette', lecteur: 'etiquete',
    generateur: { jury_fp: T + 'redteam/gen_jury_fp.mjs', jury_fuzz_address: T + 'redteam/fuzz_address_gen.mjs', jury_fuzz_control: T + 'redteam/gen_fuzz_control.mjs', jury_fuzz_encoding: T + 'redteam/fuzz_encoding.mjs', jury_fuzz_fp: T + 'redteam/fuzz_fp_gen.mjs', jury_fuzz_sig: T + 'redteam/fuzz_sig.mjs' }[n] || 'écrit par un agent juré (pas de générateur dans le dépôt)',
    graine: { jury_fuzz_address: 'argument de ligne de commande (7 par défaut)', jury_fuzz_sig: 'argument de ligne de commande (1 par défaut)' }[n] || 'non consignée', auteur: 'red team interne', note: 'cas retenus PARCE QU\'ILS contournaient le moteur d\'alors : jeu de réglage, biaisé vers l\'échec' })),
  { nom: 'V2_DEV', chemin: T + 'redteam/V2_DEV_norm.jsonl', role: 'reglage', question: 'etiquette', lecteur: 'etiquete', generateur: T + 'blind_adem/v2/*/ (générateurs par famille) puis redteam/normalize_v2.mjs', graine: 'par famille, non consignée ici', auteur: 'agents d\'Adem, sans lire le moteur', note: 'moitié DEV du jeu v2 (70 % par hachage de l\'identifiant) ; les règles ont été écrites en la regardant' },
  { nom: 'attacks_DEV', chemin: T + 'attacks/DEV.jsonl', role: 'reglage', question: 'etiquette', lecteur: 'etiquete', generateur: T + 'attacks/gen.mjs', graine: 20261011, auteur: 'équipe', note: 'catalogue d\'attaques v1, moitié DEV' },
  { nom: 'fork_cases', chemin: T + 'redteam/fork_cases.jsonl', role: 'reglage', question: 'etiquette', lecteur: 'etiquete', generateur: 'écrit à la main', graine: 'sans objet', auteur: 'red team interne', note: '5 cas' },
];
// Réserve scellée du panel : hors de la liste par défaut. Lue seulement par « node preuves/banc.mjs --ouvrir-reserve », une fois,
// après correction du produit (chaque ouverture est écrite dans preuves/panel/OUVERTURES.log).
export const RESERVE = { nom: 'panel_reserve', chemin: 'preuves/panel/RESERVE.jsonl', role: 'reserve_scellee', question: 'phrase_demande', lecteur: 'panel', generateur: 'preuves/panel/gen_panel.mjs', graine: 'holdup-preuves-panel-A-2026-10-11', auteur: 'agent de la mission preuves', scelle: 'preuves/panel/RESERVE_SHA256.txt', note: 'tiers du panel jamais lu par une mesure : à ouvrir une fois, après correction du produit' };
// Jeux enregistrés SANS être lus : chemin et empreinte seulement.
export const NON_LUS = [
  { chemin: 'preuves/panel/RESERVE.jsonl', role: 'reserve_scellee', statut: 'réserve scellée du grand panel : aucune mesure ne l\'a lue. S\'ouvre une fois par « node preuves/banc.mjs --ouvrir-reserve »', generateur: 'preuves/panel/gen_panel.mjs', graine: 'holdup-preuves-panel-A-2026-10-11', empreinte_publiee: 'preuves/panel/RESERVE_SHA256.txt' },
  { chemin: T + 'blind_decalage/CASES.jsonl', role: 'aveugle', statut: 'INTERDIT. Jeu aveugle de 250 cas d\'un autre auteur. Ouvert une seule fois le 2026-10-11T07:10:52Z par blind_decalage/run/ouvrir_une_fois.mjs (verrou OUVERT.lock) ; résultat publié dans blind_decalage/run/RESULTAT.md', generateur: T + 'blind_decalage/gen.mjs', graine: 20261012, empreinte_publiee: T + 'blind_decalage/SHA256.txt' },
  { chemin: T + 'blind_adem/v2/V2_TEST.jsonl', role: 'aveugle', statut: 'INTERDIT. Moitié TEST du jeu v2 (30 % par hachage de l\'identifiant). Jamais passée d\'après redteam/angles_morts/03_chiffres_et_methode.md', generateur: T + 'blind_adem/v2/*/', graine: 'non consignée', empreinte_publiee: T + 'blind_adem/v2/V2_TEST.sha256' },
  { chemin: T + 'attacks/TEST.jsonl', role: 'aveugle_contamine', statut: 'INTERDIT. Moitié TEST du catalogue v1. D\'après livrables/CHIFFRES.md : ouverte avant des correctifs puis utilisée pour les orienter', generateur: T + 'attacks/gen.mjs', graine: 20261011, empreinte_publiee: T + 'attacks/TEST_HASH.txt' },
  { chemin: T + 'attacks/cases.jsonl', role: 'contient_un_jeu_interdit', statut: 'non lu : réunit DEV et TEST du catalogue v1', generateur: T + 'attacks/gen.mjs', graine: 20261011 },
  ...['benign_defi', 'benign_everyday', 'fraud_ambig', 'onchain', 'poison_sites_tokens', 'sig'].map((f) => ({ chemin: T + 'blind_adem/v2/' + f + '/cases.jsonl', role: 'contient_un_jeu_interdit', statut: 'non lu : fichier par famille du jeu v2, contient les cas DEV et TEST mélangés (champ split)', generateur: T + 'blind_adem/v2/' + f + '/', graine: 'non consignée' })),
  { chemin: T + 'blind_adem/BLIND_v1.jsonl', role: 'aveugle', statut: 'non rejoué : jeu aveugle v1 de 150 cas, jamais passé d\'après redteam/angles_morts/03. Écart de procédure de cette mission : pendant l\'inventaire, un script a compté ses lignes, ses étiquettes et ses méthodes, et le début du premier cas a été affiché. Aucun détecteur n\'a été lancé dessus', generateur: T + 'blind_adem/gen_*.mjs', graine: 'non consignée', empreinte_publiee: T + 'blind_adem/BLIND_v1.sha256' },
  ...['malveillants', 'benins', 'fraudes_ambigus'].map((f) => ({ chemin: T + 'blind_adem/' + f + '.jsonl', role: 'contient_un_jeu_aveugle', statut: 'non lu : composant du jeu aveugle v1', generateur: T + 'blind_adem/gen_' + (f === 'fraudes_ambigus' ? 'fraudes' : f) + '.mjs', graine: 'non consignée' })),
  { chemin: T + 'blind_adem/v2/V2_DEV.jsonl', role: 'reglage', statut: 'non rejoué directement : source de redteam/V2_DEV_norm.jsonl, qui est le fichier rejoué', generateur: T + 'blind_adem/v2/*/', graine: 'non consignée' },
  ...['probe', 'probe2', 'probe3', 'exemple'].map((f) => ({ chemin: T + 'redteam/' + f + '.jsonl', role: 'sonde', statut: 'non rejoué : quelques cas d\'essai de la red team, sans étiquette exploitable', generateur: 'écrit à la main', graine: 'sans objet' })),
];

// Régénère dans preuves/out/regen/ les jeux dont le fichier n'existe pas sur le disque (ignorés par git), sans rien écrire ailleurs.
export function regenerer(quoi) {
  const base = pathToFileURL(join(RACINE, T)).href;
  const plan = { grille: { src: T + 'pipeline/grille/gen_grille.mjs', de: "'./snapshot/", vers: `'${base}pipeline/grille/snapshot/`, out: 'preuves/out/regen/grille/gen_grille.mjs' },
    decalage: { src: T + 'attacks_decalage/gen_decalage.mjs', de: "'../engine/", vers: `'${base}engine/`, out: 'preuves/out/regen/decalage/gen_decalage.mjs' } }[quoi];
  const out = join(RACINE, plan.out); mkdirSync(dirname(out), { recursive: true });
  const code = readFileSync(join(RACINE, plan.src), 'utf8');
  if (!code.includes(plan.de)) throw new Error('régénération ' + quoi + ' : import attendu introuvable');
  writeFileSync(out, code.split(plan.de).join(plan.vers)); // seule modification : le chemin d'import de l'encodeur ABI, rendu absolu
  execFileSync(process.execPath, ['--no-warnings', out], { stdio: 'ignore' });
}
export function charger(jeu) { return lire(jeu.chemin).map(adapt[jeu.lecteur]); }

const lignes = (path) => new Promise((res, rej) => { let n = 0; createReadStream(path).on('data', (c) => { for (let i = 0; i < c.length; i++) if (c[i] === 10) n++; }).on('error', rej).on('end', () => res(n)); });
export async function registre(avecReserve = false) {
  const out = [];
  for (const j of avecReserve ? [...JEUX, RESERVE] : JEUX) {
    const p = join(RACINE, j.chemin); if (!existsSync(p)) { out.push({ nom: j.nom, chemin: j.chemin, absent: true }); continue; }
    const e = await sha256Fichier(p);
    const scelle = j.scelle && existsSync(join(RACINE, j.scelle)) ? readFileSync(join(RACINE, j.scelle), 'utf8').split(/\s+/)[0] : null;
    out.push({ nom: j.nom, chemin: j.chemin, lu_par_le_banc: true, sha256: e.sha256, octets: e.octets, cas: await lignes(p), role: j.role, question: j.question, generateur: j.generateur, graine: j.graine, auteur: j.auteur, date_fichier: statSync(p).mtime.toISOString(),
      ...(scelle ? { sha256_scelle: scelle, scelle_respecte: scelle === e.sha256 } : {}), note: j.note });
  }
  for (const j of NON_LUS) {
    const p = join(RACINE, j.chemin); if (!existsSync(p)) { out.push({ chemin: j.chemin, absent: true, role: j.role, statut: j.statut }); continue; }
    const e = await sha256Fichier(p); // flux d'octets : rien n'est décodé
    let pub = null; if (j.empreinte_publiee && existsSync(join(RACINE, j.empreinte_publiee))) { const m = readFileSync(join(RACINE, j.empreinte_publiee), 'utf8').match(/[0-9a-f]{64}/); pub = m ? m[0] : null; }
    out.push({ chemin: j.chemin, lu_par_le_banc: false, sha256: e.sha256, octets: e.octets, cas: null, role: j.role, statut: j.statut, generateur: j.generateur, graine: j.graine, date_fichier: statSync(p).mtime.toISOString(), ...(pub ? { sha256_publie: pub, conforme_au_publie: pub === e.sha256 } : {}) });
  }
  return out;
}
