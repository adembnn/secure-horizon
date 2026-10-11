// Lanceur à usage unique du jeu aveugle « decalage ». Voir LISEZ_MOI.md.
//   node --env-file=C:\Users\detot\Documents\secure-horizon\.env --no-warnings blind_decalage\run\ouvrir_une_fois.mjs
//   ... --dry-run     ne lit PAS CASES.jsonl, ne crée aucun verrou, ne mesure rien d'autre qu'un faux jeu interne : vérifie que tout est prêt.
//   ... --reprise     reprend une mesure interrompue (quota Clef, panne) : verrou présent, mêmes cas, même moteur, même lanceur, pas de résultat complet.
// Il n'existe volontairement PAS d'option --force : un verrou posé ne se lève qu'à la main, par Titouan.
// Options d'essai (réservées au faux jeu) : --cases=<f> --sha=<f> --out=<dir> --cache=<dir> --clef-mock=<module.mjs>
import { createHash } from 'node:crypto';
import { createReadStream, readFileSync, writeFileSync, appendFileSync, existsSync, statSync, readdirSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));      // blind_decalage/run
const BLIND = join(HERE, '..');                             // blind_decalage
const ROOT = join(BLIND, '..');                             // T_banc_e2e
const REPO = join(ROOT, '..', '..', '..');                  // secure-horizon
const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : ''; };

const CASES = resolve(opt('cases') || join(BLIND, 'CASES.jsonl'));
const SHAFILE = resolve(opt('sha') || join(BLIND, 'SHA256.txt'));
const OUT = resolve(opt('out') || HERE);
const CACHE = resolve(opt('cache') || join(OUT, 'cache_clef'));
const ESSAI = Boolean(opt('cases'));
const LOCK = join(OUT, 'OUVERT.lock');
const JOURNAL = join(OUT, 'JOURNAL_OUVERTURE.md');
const sha = (buf) => createHash('sha256').update(buf).digest('hex');
const die = (msg, code = 2) => { console.error(msg); process.exit(code); };

if (flag('force') || args.some((a) => /^--force/.test(a))) die('Il n\'existe pas d\'option --force. Le verrou ne se lève qu\'à la main. Arrêt.');
if (opt('clef-mock') && !ESSAI) die('--clef-mock est réservé au faux jeu (avec --cases). Arrêt.');
if (!flag('dry-run') && !ESSAI && (opt('sha') || opt('out') || opt('cache'))) die('Sur le vrai jeu, aucune option de chemin n\'est admise. Arrêt.');

// ------------------------------------------------------------------ hash du moteur
function walk(dir, { recursif = true, filtre = () => true, saut = [] } = {}) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true }).sort((x, y) => x.name.localeCompare(y.name))) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (recursif && !saut.includes(e.name) && e.name !== 'node_modules') out.push(...walk(p, { recursif, filtre, saut })); } else if (filtre(e.name)) out.push(p);
  }
  return out;
}
function groupes() {
  const R = (p) => join(ROOT, p);
  return {
    moteur: [...walk(R('engine/src')), ...walk(R('engine/vendor')), R('run/policy.mjs'), R('run/arms.mjs'), R('pipeline/evaluate_plus.mjs'), R('pipeline/intent_clef.mjs'), R('pipeline/known_protocols.json'), R('redteam/normalize_v2.mjs'),
      ...walk(R('detectors_adem'), { saut: ['test'] }), ...walk(R('extension'), { recursif: false, filtre: (n) => n.endsWith('.js') })],
    standalone: [...walk(R('extension_standalone/extension')), ...walk(R('dist'), { recursif: false, filtre: (n) => /^hold-up-standalone.*\.zip$/.test(n) })],
    lanceur: [...walk(join(HERE, 'chaine')), join(HERE, 'mesure.mjs'), join(HERE, 'ouvrir_une_fois.mjs')],
  };
}
function hashGroupes() {
  const g = groupes(), res = { fichiers: {}, groupes: {} };
  for (const [nom, files] of Object.entries(g)) {
    const lignes = files.filter((f) => existsSync(f)).map((f) => `${relative(ROOT, f).replace(/\\/g, '/')} ${sha(readFileSync(f))}`).sort();
    res.fichiers[nom] = lignes;
    res.groupes[nom] = sha(lignes.join('\n'));
  }
  res.moteur_total = sha(res.groupes.moteur + res.groupes.standalone); // « moteur » du journal = moteur + build standalone
  return res;
}
function git() {
  const run = (a) => { try { return execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; } };
  const head = run(['rev-parse', 'HEAD']), st = run(['status', '--porcelain']);
  return { head: head || 'inconnu', sale: st === null ? 'inconnu' : st.split('\n').filter(Boolean).length };
}
const hashFichier = (f) => new Promise((ok, ko) => { const h = createHash('sha256'); createReadStream(f).on('data', (d) => h.update(d)).on('end', () => ok(h.digest('hex'))).on('error', ko); });
const journal = (txt) => { mkdirSync(OUT, { recursive: true }); if (!existsSync(JOURNAL)) writeFileSync(JOURNAL, '# Journal d\'ouverture du jeu aveugle decalage\n\nChaque ouverture ajoute une section. Ce fichier n\'est jamais réécrit.\n'); appendFileSync(JOURNAL, '\n' + txt + '\n'); };
const motSha = () => { const t = readFileSync(SHAFILE, 'utf8').split(/\s+/)[0].trim().toLowerCase(); if (!/^[0-9a-f]{64}$/.test(t)) die('SHA256.txt illisible. Arrêt.'); return t; };

// ------------------------------------------------------------------ dry-run : ne lit jamais le fichier de cas
if (flag('dry-run')) {
  const M = await import(pathToFileURL(join(HERE, 'mesure.mjs')).href);
  const { fauxCas } = await import(pathToFileURL(join(HERE, 'essai', 'gen_faux.mjs')).href);
  const hg = hashGroupes(), g = git();
  console.log('DRY-RUN : CASES.jsonl n\'est pas lu (seule sa taille est lue au catalogue du système de fichiers).');
  console.log('cas      :', CASES, existsSync(CASES) ? `présent, ${statSync(CASES).size} octets` : 'ABSENT');
  console.log('sha publié:', existsSync(SHAFILE) ? motSha() : 'ABSENT');
  console.log('verrou   :', existsSync(LOCK) ? 'PRÉSENT : un vrai lancement serait refusé' : 'absent : un vrai lancement est possible');
  console.log('clé Clef :', (await import(pathToFileURL(join(ROOT, 'detectors_adem', 'clef_client.mjs')).href)).clefAvailable(process.env) ? 'présente (valeur non affichée)' : 'ABSENTE : le bras (b) ne serait pas mesurable');
  console.log('moteur   :', hg.moteur_total, `(${hg.fichiers.moteur.length} fichiers moteur, ${hg.fichiers.standalone.length} fichiers standalone)`);
  console.log('lanceur  :', hg.groupes.lanceur);
  console.log('git HEAD :', g.head, `(${g.sale} fichiers modifiés)`);
  const faux = fauxCas();
  const r = await M.mesurer(faux, { bras: ['a', 'c'] });
  const okA = r.rows.filter((x) => x.a).length, okC = r.rows.filter((x) => x.c).length;
  console.log(`essai interne sur ${faux.length} faux cas : bras (a) ${okA} mesurés, bras (c) ${okC} mesurés, erreurs ${r.rows.filter((x) => x.erreurs.length).length}`);
  if (okA === 0 || okC === 0) die('DRY-RUN ÉCHEC : la chaîne ne mesure rien.', 1);
  console.log('DRY-RUN OK. Rien n\'a été écrit.');
  process.exit(0);
}

// ------------------------------------------------------------------ vrai lancement
const date = new Date().toISOString();
const reprise = flag('reprise');
let lockPrec = null;
if (existsSync(LOCK)) {
  if (!reprise) { try { journal(`## Refus ${date}\n\nVerrou déjà présent : ${readFileSync(LOCK, 'utf8').replace(/\s+/g, ' ')}. Rien n'a été lu ni mesuré.`); } catch {} die('Le jeu a déjà été ouvert (OUVERT.lock présent). Rien n\'est lu, rien n\'est mesuré. Arrêt.\n' + readFileSync(LOCK, 'utf8')); }
  try { lockPrec = JSON.parse(readFileSync(LOCK, 'utf8')); } catch { die('Verrou illisible : reprise impossible. Arrêt.'); }
} else if (reprise) die('--reprise sans verrou : rien à reprendre. Arrêt.');

const hg = hashGroupes(), g = git();
const want = motSha();
const got = await hashFichier(CASES); // octets seulement : le contenu n'est ni gardé ni analysé
if (got !== want) {
  journal(`## Abandon ${date}\n\nsha256 de ${relative(ROOT, CASES)} = ${got}, publié = ${want}. Fichier modifié. Verrou NON posé, rien lu, rien mesuré. Git HEAD ${g.head}.`);
  die('Le fichier de cas ne correspond pas au sha256 publié. Abandon, rien n\'est mesuré, aucun verrou posé.');
}
if (reprise) {
  const pb = [];
  if (lockPrec.sha256_cas !== got) pb.push('cas');
  if (lockPrec.sha256_moteur !== hg.moteur_total) pb.push('moteur');
  if (lockPrec.sha256_lanceur !== hg.groupes.lanceur) pb.push('lanceur');
  const fres = join(OUT, 'resultat.json');
  if (existsSync(fres)) { try { if (JSON.parse(readFileSync(fres, 'utf8')).complet) pb.push('résultat déjà complet'); } catch {} }
  if (pb.length) { journal(`## Reprise refusée ${date}\n\nRaison : ${pb.join(', ')}.`); die('Reprise refusée : ' + pb.join(', ') + '.'); }
} else {
  // LE VERROU EST POSÉ ICI, AVANT toute lecture du contenu des cas. Écriture exclusive : deux lancements simultanés ne passent pas.
  const contenu = JSON.stringify({ ouvert: date, pid: process.pid, essai: ESSAI, sha256_cas: got, sha256_moteur: hg.moteur_total, sha256_lanceur: hg.groupes.lanceur, git_head: g.head }, null, 1) + '\n';
  try { writeFileSync(LOCK, contenu, { flag: 'wx' }); } catch { die('Verrou déjà posé par un autre lancement. Arrêt.'); }
}
const fmtFichiers = (l) => l.map((x) => '    ' + x).join('\n');
journal(`## ${reprise ? 'Reprise' : 'Ouverture'} ${date}${ESSAI ? ' (MODE ESSAI, faux jeu)' : ''}

- Verrou : ${reprise ? 'déjà présent, reprise autorisée (mêmes cas, même moteur, même lanceur)' : 'posé avant toute lecture du contenu'} (${relative(ROOT, LOCK)})
- Cas : ${relative(ROOT, CASES)}, sha256 ${got} = publié
- Git HEAD : ${g.head}, fichiers modifiés non commités : ${g.sale}
- sha256 du moteur (moteur + build standalone) : ${hg.moteur_total}
  - groupe moteur (engine/src, engine/vendor, run/policy.mjs, run/arms.mjs, pipeline/evaluate_plus.mjs, pipeline/intent_clef.mjs, known_protocols.json, normalize_v2.mjs, detectors_adem/*, extension/*.js) : ${hg.groupes.moteur}
  - groupe standalone (extension_standalone/extension/**, dist/hold-up-standalone*.zip) : ${hg.groupes.standalone}
- sha256 du lanceur (chaine/*, mesure.mjs, ouvrir_une_fois.mjs) : ${hg.groupes.lanceur}
- Critères du verdict : ${JSON.stringify((await import(pathToFileURL(join(HERE, 'mesure.mjs')).href)).CRITERES)}

<details><summary>Fichiers hashés</summary>

\`\`\`
  moteur:
${fmtFichiers(hg.fichiers.moteur)}
  standalone:
${fmtFichiers(hg.fichiers.standalone)}
  lanceur:
${fmtFichiers(hg.fichiers.lanceur)}
\`\`\`
</details>
`);

// ------------------------------------------------------------------ lecture (le verrou existe) et mesure
let resume = '';
try {
  const M = await import(pathToFileURL(join(HERE, 'mesure.mjs')).href);
  const cas = readFileSync(CASES, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  cas.forEach(M.validerCas);
  if (new Set(cas.map((c) => c.id)).size !== cas.length) throw new Error('identifiants en double');
  const CC = await import(pathToFileURL(join(ROOT, 'detectors_adem', 'clef_client.mjs')).href);
  let bras = ['a', 'b', 'c'], clef = null, mock = null;
  if (opt('clef-mock')) mock = (await import(pathToFileURL(resolve(opt('clef-mock'))).href)).default;
  if (mock || CC.clefAvailable(process.env)) clef = M.creerClef({ cacheDir: CACHE, askImpl: mock });
  else { bras = ['a', 'c']; console.log('non mesuré: clé manquante (bras b)'); }
  const { rows, clef: st } = await M.mesurer(cas, { bras, clef });
  const meta = { date, sha256_cas: got, sha256_moteur: hg.moteur_total, sha256_lanceur: hg.groupes.lanceur, git_head: g.head, git_sale: g.sale, essai: ESSAI };
  const { md, json } = M.construireRapport({ rows, clef: st, meta, bras });
  const fmd = join(OUT, 'RESULTAT.md'), fjs = join(OUT, 'resultat.json');
  writeFileSync(fmd, md); writeFileSync(fjs, JSON.stringify(json, null, 1));
  resume = `- Résultat : ${json.complet ? 'complet' : 'INCOMPLET'}. ${Object.entries(json.verdicts).map(([a, v]) => `bras ${a} : ${v}`).join(' ; ')}.\n- Clef : ${st ? `${st.appels_reels} appels réels, ${st.cache} depuis le cache, ${st.erreurs} erreurs, quota ${st.quota ? 'ATTEINT' : 'non atteint'}` : 'non utilisé'}\n- sha256 de RESULTAT.md : ${sha(readFileSync(fmd))}\n- sha256 de resultat.json : ${sha(readFileSync(fjs))}\n- ${M.PHRASE}.`;
  journal(`### Fin ${new Date().toISOString()}\n\n${resume}`);
  console.log(md.split('\n## Matrice')[0]);
  console.log('Écrit :', fmd, 'et', fjs);
  process.exit(json.complet ? 0 : 3);
} catch (e) {
  journal(`### Erreur ${new Date().toISOString()}\n\n${String(e && e.stack ? e.stack : e).slice(0, 1500)}\n\nLe verrou reste posé. ${ESSAI ? '' : 'Aucun réglage n\'est permis ; seule une reprise (--reprise) à l\'identique est possible si le code n\'a pas changé.'}`);
  die('Erreur après pose du verrou : ' + (e && e.message), 1);
}
