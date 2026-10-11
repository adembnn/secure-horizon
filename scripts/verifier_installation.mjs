#!/usr/bin/env node
// Hold up : contrôle de l'installation en une commande.   node scripts/verifier_installation.mjs
// Pensé pour la personne qui clone le dépôt : elle voit en 1 minute ce qui manque et ce que valent les tests rapides.
// Aucune dépendance, aucun réseau, aucune lecture de .env. Tout reste sur 127.0.0.1.
//
// Ce que le script fait, dans l'ordre :
//   1. versions (Node), dépendances installées (blockchain/node_modules)
//   2. fichiers générés requis par les tests : les recrée s'ils manquent (cas d'un clone neuf)
//   3. fichiers de l'extension livrée (manifeste, BUILD_INFO.json, paquets zip)
//   4. ports de la démo (information : un port occupé sera réutilisé par `node scripts/demo.mjs`)
//   5. suites de tests rapides, avec les chiffres réels lus dans leur sortie (rien n'est recopié à la main)
//
// Options : --donnees      ne fait que recréer les fichiers générés requis (étape 2), puis s'arrête
//           --sans-tests   saute l'étape 5
//           --complet      ajoute les tests des contrats Hardhat (environ 2 minutes)
// Code de sortie : 0 si aucune ligne [ECHEC], 1 sinon.
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import net from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BANC = join(ROOT, 'research', 'titouan', 'T_banc_e2e');
const EXT = join(BANC, 'extension_standalone', 'extension');
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);

let echecs = 0;
const say = (s = '') => console.log(s);
const ok = (s) => say(`  [ok]     ${s}`);
const info = (s) => say(`  [info]   ${s}`);
const saute = (s) => say(`  [saute]  ${s}`);
const bad = (s) => { echecs++; say(`  [ECHEC]  ${s}`); };
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const rel = (p) => p.replace(ROOT, '').replace(/^[\\/]/, '').replace(/\\/g, '/');

// ------------------------------------------------------------ 1. versions et dépendances
function etapeVersions() {
  say('1. Versions et dépendances');
  const [maj, min] = process.versions.node.split('.').map(Number);
  const nodeOk = maj >= 24 || (maj === 23 && min >= 6) || (maj === 22 && min >= 18);
  nodeOk ? ok(`Node ${process.versions.node} (il faut 22.18 ou plus)`) : bad(`Node ${process.versions.node} est trop ancien : il faut 22.18 ou plus`);
  if (existsSync(join(ROOT, 'blockchain', 'node_modules', 'hardhat'))) ok('blockchain/node_modules : Hardhat est installé');
  else bad('blockchain/node_modules est absent. Lance : cd blockchain && npm install   (nécessaire pour la chaîne locale et les contrats ; pas pour les tests du moteur ni de l\'extension)');
  info('Chrome ou Edge : non vérifiable d\'ici. Version minimale demandée par le manifeste : voir plus bas.');
  info(existsSync(join(ROOT, '.env')) ? 'fichier .env présent (contenu non lu) : le relais l\'utilisera pour appeler le modèle' : 'pas de fichier .env : le relais classera sans modèle (mots-clés). Pour le modèle : copier .env.example en .env et remplir les deux clés Cloudflare.');
}

// ------------------------------------------------------------ 2. fichiers générés requis par les tests
function lancer(fichier, fargs, cwd) {
  return spawnSync(process.execPath, [fichier, ...fargs], { cwd, encoding: 'utf8', windowsHide: true, timeout: 300000 });
}
function etapeDonnees() {
  say('\n2. Fichiers générés requis par les tests');
  // 2a. attacks_public/PUBLIC.jsonl : 144 cas synthétiques, graine fixe, empreinte attendue dans PUBLIC_HASH.txt
  const dirPub = join(BANC, 'attacks_public');
  const fPub = join(dirPub, 'PUBLIC.jsonl');
  const fHash = join(dirPub, 'PUBLIC_HASH.txt');
  const attendu = existsSync(fHash) ? (readFileSync(fHash, 'utf8').match(/[0-9a-f]{64}/) || [])[0] : null;
  if (existsSync(fPub)) {
    const h = sha256(readFileSync(fPub));
    h === attendu ? ok('attacks_public/PUBLIC.jsonl : présent, empreinte conforme à PUBLIC_HASH.txt') : bad('attacks_public/PUBLIC.jsonl : présent mais son empreinte ne correspond pas à PUBLIC_HASH.txt');
  } else if (!attendu) {
    bad('attacks_public/PUBLIC.jsonl manque et PUBLIC_HASH.txt est illisible : impossible de le recréer sûrement');
  } else {
    const sauve = readFileSync(fHash);
    const r = lancer(join(dirPub, 'gen_public.mjs'), [], dirPub);
    const h = existsSync(fPub) ? sha256(readFileSync(fPub)) : null;
    if (r.status === 0 && h === attendu) ok('attacks_public/PUBLIC.jsonl : manquait, recréé avec la graine fixe, empreinte conforme à PUBLIC_HASH.txt');
    else { writeFileSync(fHash, sauve); bad('attacks_public/PUBLIC.jsonl : la recréation a échoué ou donne une autre empreinte (gen_public.mjs)'); }
  }
  // 2b. redteam/V2_DEV_norm.jsonl : copie normalisée de blind_adem/v2/V2_DEV.jsonl (jeu de réglage, jamais V2_TEST)
  const fNorm = join(BANC, 'redteam', 'V2_DEV_norm.jsonl');
  const fDev = join(BANC, 'blind_adem', 'v2', 'V2_DEV.jsonl');
  if (existsSync(fNorm)) ok('redteam/V2_DEV_norm.jsonl : présent');
  else if (!existsSync(fDev)) bad('redteam/V2_DEV_norm.jsonl manque et sa source blind_adem/v2/V2_DEV.jsonl aussi');
  else {
    const r = lancer(join(BANC, 'redteam', 'normalize_v2.mjs'), [fDev, fNorm], BANC);
    r.status === 0 && existsSync(fNorm) ? ok('redteam/V2_DEV_norm.jsonl : manquait, recréé depuis blind_adem/v2/V2_DEV.jsonl') : bad('redteam/V2_DEV_norm.jsonl : la recréation a échoué (redteam/normalize_v2.mjs)');
  }
  // 2c. échantillon de trafic réel de la C-Chain : ne se recrée qu'avec Internet, jamais ici
  if (existsSync(join(ROOT, 'research', 'titouan', 'bench', 'data', 'cchain_sample.jsonl'))) ok('bench/data/cchain_sample.jsonl : présent');
  else info('research/titouan/bench/data/cchain_sample.jsonl absent (ignoré par git, se recrée avec bench/sample_cchain.mjs et Internet) : les tests du moteur qui le lisent échouent ou sont sautés, sans effet sur la démo');
}

// ------------------------------------------------------------ 3. extension livrée
function etapeExtension() {
  say('\n3. Extension livrée');
  const man = join(EXT, 'manifest.json');
  if (!existsSync(man)) { bad(`${rel(EXT)}/manifest.json manque : le build n'est pas dans le dépôt`); return; }
  try {
    const m = JSON.parse(readFileSync(man, 'utf8'));
    ok(`dossier à charger : ${EXT}`);
    ok(`manifeste : « ${m.name} » version ${m.version}, Chrome ${m.minimum_chrome_version || '?'} ou plus`);
    info(`hôtes autorisés : ${(m.host_permissions || []).join(', ') || 'aucun'} ; politique : ${(m.content_security_policy && m.content_security_policy.extension_pages) || 'non fixée'}`);
  } catch { bad('manifest.json illisible'); }
  existsSync(join(EXT, 'BUILD_INFO.json')) ? ok('BUILD_INFO.json présent (empreintes des sources du build ; les empreintes des zip se calculent, voir INSTALLATION.md)') : bad('BUILD_INFO.json manque');
  for (const z of ['hold-up-standalone.zip', 'hold-up-sans-reseau.zip']) {
    const f = join(BANC, 'dist', z);
    existsSync(f) ? ok(`dist/${z} : présent, ${Math.round(statSync(f).size / 1024)} Ko`) : info(`dist/${z} absent (facultatif : le dossier de l'extension suffit)`);
  }
  existsSync(join(ROOT, 'research', 'demo_reelle', 'chain', 'addresses.local.json')) ? ok('adresses des contrats de démo : présentes (fichier créé par node scripts/demo.mjs)') : info('pas encore d\'adresses de contrats de démo : normal avant le premier node scripts/demo.mjs');
}

// ------------------------------------------------------------ 4. ports
const portBusy = (port) => new Promise((res) => {
  const s = net.connect({ port, host: '127.0.0.1' });
  s.once('connect', () => { s.destroy(); res(true); });
  s.once('error', () => res(false));
});
async function etapePorts() {
  say('\n4. Ports de la démo (information seulement)');
  for (const [p, n] of [[8545, 'chaîne locale'], [8793, 'site Neve'], [8789, 'relais du classifieur'], [8791, 'site Glacier'], [8792, 'console d\'attaque simulée']]) {
    info(`${p} ${n} : ${(await portBusy(p)) ? 'déjà utilisé (node scripts/demo.mjs le réutilisera)' : 'libre (node scripts/demo.mjs le lancera)'}`);
  }
}

// ------------------------------------------------------------ 5. tests rapides
function courir(commande, cargs, cwd, timeoutMs = 600000) {
  return new Promise((res) => {
    const t0 = Date.now();
    const c = spawn(commande, cargs, { cwd, windowsHide: true, env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' } });
    let out = '';
    c.stdout.on('data', (d) => { out += d; });
    c.stderr.on('data', (d) => { out += d; });
    const timer = setTimeout(() => { try { c.kill(); } catch { /* fini */ } }, timeoutMs);
    c.on('close', (code) => { clearTimeout(timer); res({ code, out, s: Math.round((Date.now() - t0) / 1000) }); });
    c.on('error', () => { clearTimeout(timer); res({ code: 1, out, s: 0 }); });
  });
}
const nombre = (out, cle) => { const m = out.match(new RegExp('^ℹ ' + cle + ' (\\d+)', 'm')); return m ? Number(m[1]) : null; };

const SUITES = [
  { nom: 'moteur d\'effets', cmd: 'npm run test:engine', run: () => courir(process.execPath, ['--test', 'research/titouan/T_banc_e2e/engine/test/*.test.mjs'], ROOT), lire: lireNodeTest, restaure: [join(BANC, 'engine', 'out', 'real_results.json')] },
  { nom: 'extension (avec serveur) : tests unitaires', cmd: 'npm run test:extension', run: () => courir(process.execPath, ['--test', 'research/titouan/T_banc_e2e/extension/tests/unit/*.test.mjs'], ROOT), lire: lireNodeTest },
  { nom: 'serveur de vérification et journal chaîné', cmd: 'npm run test:server', run: () => courir(process.execPath, [join(BANC, 'server', 'test', 'server.test.mjs')], ROOT), lire: (r) => { const m = r.out.match(/RESUME\s+(\{.*?"total":\d+)/); if (!m) return null; const p = Number((r.out.match(/"passed":(\d+)/) || [])[1]); const t = Number((r.out.match(/"total":(\d+)/) || [])[1]); return { pass: p, total: t, fail: t - p }; }, restaure: [join(BANC, 'server', 'test', 'results.json')] },
  { nom: 'RPC de garde', cmd: 'npm run test:rpc', run: () => courir(process.execPath, ['--test', 'research/demo_reelle/rpc_garde/test/*.test.mjs'], ROOT), lire: lireNodeTest },
  { nom: 'relais du classifieur (modèle simulé)', cmd: 'node --test research/demo_reelle/classifieur/relay.test.mjs', run: () => courir(process.execPath, ['--test', 'research/demo_reelle/classifieur/relay.test.mjs'], ROOT), lire: lireNodeTest },
  { nom: 'build autonome : contrôle statique', cmd: 'node research/titouan/T_banc_e2e/extension_standalone/tests/static_check.mjs', run: () => courir(process.execPath, [join(BANC, 'extension_standalone', 'tests', 'static_check.mjs')], ROOT), lire: lireLignes },
  { nom: 'build autonome : suite complète', cmd: 'node --no-warnings research/titouan/T_banc_e2e/extension_standalone/tests/run_tests.mjs', run: () => courir(process.execPath, ['--no-warnings', join(BANC, 'extension_standalone', 'tests', 'run_tests.mjs')], ROOT), lire: lireLignes, restaure: [join(BANC, 'extension_standalone', 'out', 'RESULTATS.json'), join(BANC, 'extension_standalone', 'out', 'RESULTATS.md')] },
];
if (flag('--complet')) {
  const cli = join(ROOT, 'blockchain', 'node_modules', 'hardhat', 'internal', 'cli', 'bootstrap.js');
  if (existsSync(cli)) SUITES.push({ nom: 'contrats de démo (Hardhat)', cmd: 'npm run test:contracts', run: () => courir(process.execPath, [cli, 'test'], join(ROOT, 'blockchain'), 900000), lire: (r) => { const p = nombre2(r.out, /(\d+) passing/); const f = nombre2(r.out, /(\d+) failing/) || 0; return p === null ? null : { pass: p, fail: f, total: p + f }; } });
  else SUITES.push({ nom: 'contrats de démo (Hardhat)', cmd: 'npm run test:contracts', manque: 'blockchain/node_modules absent : cd blockchain && npm install' });
}
function nombre2(out, re) { const m = out.match(re); return m ? Number(m[1]) : null; }
function lireNodeTest(r) { const total = nombre(r.out, 'tests'); if (total === null) return null; return { total, pass: nombre(r.out, 'pass'), fail: nombre(r.out, 'fail'), saute: nombre(r.out, 'skipped') }; }
function lireLignes(r) { // suites qui impriment une ligne par contrôle : « ok … » / « PASS … » contre « ECHEC … » / « FAIL … »
  const lignes = r.out.split(/\r?\n/);
  const pass = lignes.filter((l) => /^\s*(ok|PASS)\b/.test(l)).length;
  const fail = lignes.filter((l) => /^\s*(ECHEC|FAIL|ÉCHEC)\b/.test(l)).length;
  return pass + fail === 0 ? null : { pass, fail, total: pass + fail };
}

async function etapeTests() {
  say('\n5. Tests rapides (chiffres lus dans la sortie de chaque commande)');
  const rows = [];
  for (const s of SUITES) {
    if (s.manque) { saute(`${s.nom} : ${s.manque}`); continue; }
    const avant = (s.restaure || []).map((f) => (existsSync(f) ? readFileSync(f) : null));
    const r = await s.run();
    // Un test qui réécrit un fichier suivi par git salirait le clone : on remet le fichier comme il était.
    (s.restaure || []).forEach((f, i) => { if (avant[i] !== null) { try { writeFileSync(f, avant[i]); } catch { /* lecture seule */ } } });
    const n = s.lire(r);
    const detail = n ? `${n.pass} réussis sur ${n.total}${n.fail ? `, ${n.fail} en échec` : ''}${n.saute ? `, ${n.saute} sautés` : ''}` : 'résultat non lisible dans la sortie';
    if (r.code === 0 && n && !n.fail) ok(`${s.nom} : ${detail} (${r.s} s)`);
    else {
      bad(`${s.nom} : ${detail} (code ${r.code}, ${r.s} s)`);
      const queue = r.out.split(/\r?\n/).filter((l) => /^\s*(not ok|✖)|\bError\b/.test(l) && !/^\s*✔/.test(l)).slice(0, 4).map((l) => '             ' + l.trim().slice(0, 150));
      queue.forEach((l) => say(l));
    }
    say(`             commande : ${s.cmd}`);
    rows.push(s.nom);
  }
}

// ------------------------------------------------------------ déroulement
say('Hold up : contrôle de l\'installation');
say(`Dépôt : ${ROOT}\n`);
if (flag('--donnees')) { etapeDonnees(); process.exit(echecs ? 1 : 0); }
etapeVersions();
etapeDonnees();
etapeExtension();
await etapePorts();
if (flag('--sans-tests')) say('\n5. Tests rapides : sautés (--sans-tests)');
else await etapeTests();
say('\n---------------------------------------------------------');
if (echecs === 0) say('Résultat : aucune ligne [ECHEC]. Pour la démonstration : node scripts/demo.mjs');
else say(`Résultat : ${echecs} ligne(s) [ECHEC] ci-dessus. Les lignes [info] ne bloquent rien.`);
say('Ces tests valident le code, ils ne mesurent pas la détection. Les chiffres de détection sont dans livrables/CHIFFRES.md.');
process.exit(echecs ? 1 : 0);
