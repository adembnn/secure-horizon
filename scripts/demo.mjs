#!/usr/bin/env node
// Hold up : lance toute la démo en local avec une seule commande.   node scripts/demo.mjs
// Aucune dépendance. Node 22.18 ou plus. Tout reste sur 127.0.0.1 : aucun fonds réel, aucun secret.
//
// Ordre : chaîne locale (8545) -> déploiement des contrats de démo -> copie des adresses vers le site Neve
//         -> site Neve (8793) -> relais du classifieur (8789) -> console d'attaque (8792) -> site « Glacier » (8791).
//         Avec --ancien : aussi le serveur de vérification (8787), le RPC de garde (8555) et le labo (8800 / 8801).
// Ce qui tourne déjà n'est jamais relancé ni arrêté. Ce qui n'existe pas dans le dépôt est sauté avec un message, jamais simulé.
//
// Options : --fork         fork local d'Avalanche C-Chain (lit le RPC public, besoin d'Internet) ; défaut : chaîne vide hors ligne
//           --redeploy     redéploie les contrats même si la chaîne déjà lancée les contient (change leurs adresses)
//           --ancien       lance aussi les services de l'ancienne version (8787, 8555, 8800, 8801), inutiles au produit livré
//           --lookalike    génère aussi le faux contact (adresse sosie, 5 à 30 s de calcul)
//           --no-install   ne lance pas `npm install` dans blockchain/ s'il manque
//           --check        vérifie seulement les prérequis et l'état des ports, ne lance rien
//           --victim 0x…   adresse du portefeuille de test à approvisionner (défaut : compte Hardhat n°5, clé publique)
import { spawn, spawnSync } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, readFileSync } from 'node:fs';
import net from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BC = join(ROOT, 'blockchain');
const CHAIN_DIR = join(ROOT, 'research', 'demo_reelle', 'chain');
const DEMO_DIR = join(ROOT, 'research', 'demo_reelle');
const BANC = join(ROOT, 'research', 'titouan', 'T_banc_e2e');
const LOGS = join(ROOT, 'logs', 'demo'); // logs/ est ignoré par git
const WIN = process.platform === 'win32';
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };

// Ports par défaut = ports documentés. Surchargeables par les variables que les scripts du dépôt lisent déjà
// (HOLDUP_PORT, SENTINELLE_PORT, HOLDUP_RPC_PORT, HOLDUP_DRAIN_PORT) plus HOLDUP_SITE_PORT. La console d'attaque n'accepte
// en CORS que le site sur 8791 : changer le port du site coupe le bouton « Réclamer » (utile seulement pour les tests).
const envPort = (n, d) => (Number.isInteger(Number(process.env[n])) && Number(process.env[n]) > 0 ? Number(process.env[n]) : d);
const P = { chain: envPort('HOLDUP_PORT', 8545), neve: envPort('HOLDUP_NEVE_PORT', 8793), relais: 8789, drain: envPort('HOLDUP_DRAIN_PORT', 8792), site: envPort('HOLDUP_SITE_PORT', 8791), check: envPort('SENTINELLE_PORT', 8787), rpc: envPort('HOLDUP_RPC_PORT', 8555), labApi: 8800, labUi: 8801 };
const RELAIS_PORT_FIXE = 8789; // le relais écoute en dur sur 8789 (research/demo_reelle/classifieur/relay.mjs) et l'extension livrée n'appelle que ce port
const EXT_DIR = join(ROOT, 'research', 'titouan', 'T_banc_e2e', 'extension_standalone', 'extension');
const NEVE_DIR = join(ROOT, 'research', 'demo_reelle', 'site_echange');
const say = (s = '') => console.log(s);
const ok = (s) => say(`  [ok]    ${s}`);
const skip = (s) => say(`  [saute] ${s}`);
const bad = (s) => say(`  [ECHEC] ${s}`);

// ---------------------------------------------------------------- prérequis
const [major, minor] = process.versions.node.split('.').map(Number);
// Le serveur importe engine/vendor/compare.ts : il faut le retrait natif des types TypeScript, activé par défaut à partir de
// Node 22.18 et 23.6 (documentation Node). Seul Node 25.6 a été essayé ici ; les versions plus anciennes sont une exigence, pas un test.
const nodeOk = major >= 24 || (major === 23 && minor >= 6) || (major === 22 && minor >= 18);
if (!nodeOk) { say(`Node ${process.versions.node} est trop ancien : il faut Node 22.18 ou plus (essayé avec Node 25.6).`); process.exit(1); }
const victim = opt('--victim');
if (victim && !/^0x[0-9a-fA-F]{40}$/.test(victim)) { say('--victim doit être une adresse 0x… de 40 caractères hexadécimaux.'); process.exit(1); }

const portBusy = (port) => new Promise((res) => {
  const s = net.connect({ port, host: '127.0.0.1' });
  s.once('connect', () => { s.destroy(); res(true); });
  s.once('error', () => res(false));
});
async function rpcChainId(port) {
  try {
    const r = await fetch(`http://127.0.0.1:${port}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }), signal: AbortSignal.timeout(2500) });
    const j = await r.json();
    return j.result ? parseInt(j.result, 16) : null;
  } catch { return null; }
}
async function waitFor(fn, ms, label) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { if (await fn()) return true; await new Promise((r) => setTimeout(r, 400)); }
  bad(`${label} : pas prêt après ${Math.round(ms / 1000)} s`);
  return false;
}

// ---------------------------------------------------------------- processus enfants
mkdirSync(LOGS, { recursive: true });
const children = [];
function start(name, file, fileArgs, { cwd = ROOT, env = {}, nodeArgs = [] } = {}) {
  const log = createWriteStream(join(LOGS, `${name}.log`));
  const child = spawn(process.execPath, [...nodeArgs, file, ...fileArgs], { cwd, env: { HARDHAT_DISABLE_TELEMETRY_PROMPT: 'true', ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'], detached: !WIN, windowsHide: true });
  child.stdout.pipe(log); child.stderr.pipe(log);
  const rec = { name, child, exited: false };
  child.on('exit', (code) => { rec.exited = true; rec.code = code; });
  children.push(rec);
  return rec;
}
function runOnce(name, file, fileArgs, { cwd = ROOT, env = {} } = {}) {
  const r = spawnSync(process.execPath, [file, ...fileArgs], { cwd, env: { HARDHAT_DISABLE_TELEMETRY_PROMPT: 'true', ...process.env, ...env }, encoding: 'utf8', windowsHide: true, timeout: 600000 });
  const out = (r.stdout || '') + (r.stderr || '');
  try { createWriteStream(join(LOGS, `${name}.log`)).end(out); } catch { /* journal facultatif */ }
  return { ok: r.status === 0, out };
}
let stopping = false;
function killTree(rec) {
  if (rec.exited || !rec.child.pid) return;
  if (WIN) spawnSync('taskkill', ['/pid', String(rec.child.pid), '/T', '/F'], { windowsHide: true });
  else { try { process.kill(-rec.child.pid, 'SIGTERM'); } catch { try { rec.child.kill('SIGTERM'); } catch { /* déjà arrêté */ } } }
}
function shutdown(code = 0) {
  if (stopping) return; stopping = true;
  say('\nArrêt de tous les services lancés par ce script...');
  for (const r of children.slice().reverse()) killTree(r);
  setTimeout(() => process.exit(code), 600);
}
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

// ---------------------------------------------------------------- catalogue des services
const exists = (...p) => existsSync(join(ROOT, ...p));
const labApi = ['research/demo_reelle/lab/server/server.mjs', 'research/demo_reelle/lab/server/index.mjs'].find((p) => exists(p));
const labUiDir = join(DEMO_DIR, 'lab', 'ui');
const labUiPage = ['index.html'].find((f) => existsSync(join(labUiDir, f)));
const hasHardhat = existsSync(join(BC, 'node_modules', 'hardhat'));

say('Hold up : démonstration locale');
say(`Node ${process.versions.node} sur ${process.platform}. Dépôt : ${ROOT}`);
say('');

if (flag('--check')) {
  say('Prérequis et ports :');
  say(`  Node >= 22.18             : ${nodeOk ? 'oui' : 'non'}`);
  say(`  blockchain/node_modules   : ${hasHardhat ? 'présent' : 'absent (npm install sera lancé)'}`);
  const noms = { chain: 'chaîne locale', neve: 'site Neve', relais: 'relais du classifieur', drain: 'console d\'attaque', site: 'site Glacier', check: 'ancien : serveur /check', rpc: 'ancien : RPC de garde', labApi: 'ancien : labo (serveur)', labUi: 'ancien : labo (interface)' };
  for (const [n, p] of Object.entries(P)) say(`  port ${String(p).padEnd(5)} ${noms[n].padEnd(26)}: ${(await portBusy(p)) ? 'déjà utilisé (je ne le relancerai pas)' : 'libre'}`);
  say(`  fichier .env              : ${existsSync(join(ROOT, '.env')) ? 'présent (le relais sera lancé avec --env-file=.env)' : 'absent (le relais classera sans modèle)'}`);
  say(`  extension à charger       : ${existsSync(join(EXT_DIR, 'manifest.json')) ? EXT_DIR : 'ABSENTE'}`);
  say(`  site Neve                 : ${existsSync(join(NEVE_DIR, 'index.html')) ? 'présent' : 'absent'}`);
  process.exit(0);
}

// ---------------------------------------------------------------- 1. dépendances de blockchain/
if (!hasHardhat) {
  if (flag('--no-install')) { bad('blockchain/node_modules est absent. Lance : cd blockchain && npm install'); process.exit(1); }
  say('Première fois : installation des dépendances de blockchain/ (Hardhat, OpenZeppelin ; environ une minute, Internet requis)...');
  const r = spawnSync('npm install --no-audit --no-fund', { cwd: BC, stdio: 'inherit', shell: true }); // chaîne unique : pas d'avertissement DEP0190 sous Windows
  if (r.status !== 0) { bad('npm install a échoué. Vérifie ta connexion puis relance.'); process.exit(1); }
}

const hardhatCli = join(BC, 'node_modules', 'hardhat', 'internal', 'cli', 'bootstrap.js');
const urls = []; // [libellé, url, remarque]
const skipped = [];
const reused = []; // services qui tournaient déjà : on n'y touche pas
const launched = []; // services lancés par ce script : Ctrl+C les arrête

// ---------------------------------------------------------------- 2. chaîne locale
say('Étape 1 sur 5 : la chaîne locale');
let chainReady = false;
let chainWasRunning = false;
if (await portBusy(P.chain)) {
  const id = await rpcChainId(P.chain);
  if (id) { ok(`chaîne : le port ${P.chain} répond déjà (chainId ${id}). Je la réutilise et je ne l'arrêterai pas.`); chainReady = true; chainWasRunning = true; reused.push('chaîne locale'); }
  else bad(`le port ${P.chain} est occupé par autre chose qu'un nœud EVM. Libère-le ou change HOLDUP_PORT.`);
} else {
  const mode = flag('--fork') ? 'fork' : 'plain';
  start('chain', join(BC, 'scripts', 'chain-local.js'), [], { cwd: BC, env: { HOLDUP_CHAIN_MODE: mode } });
  chainReady = await waitFor(async () => (await rpcChainId(P.chain)) !== null, 90000, 'chaîne locale');
  if (chainReady) { ok(`chaîne : nœud local Hardhat lancé sur http://127.0.0.1:${P.chain} (mode ${mode}, chainId ${await rpcChainId(P.chain)})`); launched.push('chaîne locale'); }
}
if (!chainReady) { bad('Sans chaîne locale rien ne marche. Détail : logs/demo/chain.log'); shutdown(1); await new Promise((r) => setTimeout(r, 5000)); }

// ---------------------------------------------------------------- 3. déploiement des contrats de démo
say('\nÉtape 2 sur 5 : les contrats de démo');
async function hasCode(addr) {
  try {
    const r = await fetch(`http://127.0.0.1:${P.chain}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getCode', params: [addr, 'latest'] }), signal: AbortSignal.timeout(2500) });
    const j = await r.json();
    return typeof j.result === 'string' && j.result.length > 2;
  } catch { return false; }
}
async function alreadyDeployed() {
  try {
    const a = JSON.parse(readFileSync(join(CHAIN_DIR, 'addresses.local.json'), 'utf8'));
    for (const k of ['usdc', 'wavax', 'router', 'drainer']) if (!a[k] || !(await hasCode(a[k]))) return false;
    return (await rpcChainId(P.chain)) === Number(a.chainId);
  } catch { return false; }
}
if (chainWasRunning && !flag('--redeploy') && !victim && await alreadyDeployed()) {
  ok('contrats de démo : déjà déployés sur cette chaîne, je les réutilise (--redeploy pour en refaire de neufs)');
} else {
  say('  ... compilation et déploiement (la première compilation télécharge le compilateur Solidity)');
  const dep = runOnce('deploy', hardhatCli, ['run', 'scripts/demo/deploy-local.js', '--network', 'localhost'], { cwd: BC, env: victim ? { DEMO_VICTIM: victim } : {} });
  if (!dep.ok) { bad('déploiement : voir logs/demo/deploy.log'); say(dep.out.split('\n').slice(-12).join('\n')); shutdown(1); await new Promise((r) => setTimeout(r, 5000)); }
  ok('contrats de démo déployés (DemoUSDC, DemoWAVAX, DemoNFT, DemoRouter, FreshDrainer neuf) : research/demo_reelle/chain/addresses.local.json');
}

if (flag('--lookalike')) {
  say('  ... recherche de l\'adresse sosie (5 à 30 s)');
  const lk = runOnce('lookalike', join(CHAIN_DIR, 'lookalike.mjs'), ['--network', 'local']);
  lk.ok ? ok('faux contact et poussière générés (context.local.json)') : bad('lookalike : voir logs/demo/lookalike.log');
}

// ---------------------------------------------------------------- 4. services HTTP
async function service({ name, label, port, file, fileArgs = [], nodeArgs = [], env = {}, cwd = ROOT, url, note, requires }) {
  if (requires && !requires.every((p) => existsSync(p))) { skip(`${label} : fichiers absents du dépôt (${requires.filter((p) => !existsSync(p)).map((p) => p.replace(ROOT, '').replace(/^[\\/]/, '')).join(', ')})`); skipped.push(label); return false; }
  if (await portBusy(port)) { skip(`${label} : le port ${port} répond déjà. Je le réutilise, je ne le relance pas et je ne l'arrêterai pas.`); urls.push([label, url, note ? note + ' (déjà en marche)' : '(déjà en marche)']); reused.push(label); return 'reused'; }
  const rec = start(name, file, fileArgs, { cwd, env, nodeArgs });
  const up = await waitFor(async () => !rec.exited && (await portBusy(port)), 30000, label);
  if (up) { ok(`${label} : lancé, ${url}`); urls.push([label, url, note || '']); launched.push(label); return 'launched'; }
  skipped.push(label); say(`          détail : logs/demo/${name}.log`); return false;
}

// 4a. site Neve : d'abord copier les adresses fraîchement déployées (sinon il vise d'anciens contrats)
say('\nÉtape 3 sur 5 : le site d\'échange Neve (scène principale)');
if (existsSync(join(NEVE_DIR, 'config.js'))) {
  const cp = runOnce('neve-config', join(NEVE_DIR, 'config.js'), []);
  cp.ok ? ok('adresses copiées vers le site Neve (research/demo_reelle/site_echange/addresses.local.json)') : bad('copie des adresses vers le site Neve : voir logs/demo/neve-config.log');
}
const neveBase = `http://localhost:${P.neve}/`;
await service({ name: 'neve', label: 'site Neve (échange)', port: P.neve, file: join(ROOT, 'docs', 'demo', 'serve_static.mjs'), fileArgs: [NEVE_DIR, String(P.neve)], url: neveBase, note: 'ajoute ?mode=honnete, ?mode=piege ou ?mode=piege&via=permit', requires: [join(NEVE_DIR, 'index.html'), join(ROOT, 'docs', 'demo', 'serve_static.mjs')] });

// 4b. relais du classifieur : le modèle Clef y est appelé, la clé reste dans ce processus (jamais dans l'extension)
say('\nÉtape 4 sur 5 : le relais du classifieur (la phrase écrite part ici, puis au modèle)');
const hasEnv = existsSync(join(ROOT, '.env'));
if (!hasEnv) say('  [info]  pas de fichier .env à la racine : sans clé, l\'intention sera classée sans modèle (mots-clés). Copie .env.example en .env et remplis CF_ACCOUNT_ID et CF_API_TOKEN pour utiliser le modèle.');
const relayRes = await service({ name: 'relais', label: 'relais du classifieur', port: P.relais, file: join(DEMO_DIR, 'classifieur', 'relay.mjs'), nodeArgs: hasEnv ? ['--env-file=.env'] : [], url: `http://127.0.0.1:${P.relais}/health`, note: 'l\'extension livrée appelle ce port', requires: [join(DEMO_DIR, 'classifieur', 'relay.mjs')] });
if (relayRes) {
  let relayProvider = null;
  try { const h = await (await fetch(`http://127.0.0.1:${P.relais}/health`, { signal: AbortSignal.timeout(2500) })).json(); relayProvider = h.provider || null; } catch { /* santé illisible */ }
  if (relayProvider === 'clef' || relayProvider === 'jev') ok(`relais : il classe avec le modèle (${relayProvider})`);
  else if (relayProvider) say('  [info]  relais : aucune clé lue, sans clé, l\'intention sera classée sans modèle (mots-clés). L\'écran de l\'extension le dit.');
  else say('  [info]  relais : état illisible (/health). Regarde logs/demo/relais.log');
}

// 4c. scène « me connecter » et console d'attaque simulée
say('\nÉtape 5 sur 5 : la scène « me connecter » et la console d\'attaque simulée');
await service({ name: 'drain', label: 'console d\'attaque simulée', port: P.drain, file: join(CHAIN_DIR, 'drain.mjs'), fileArgs: ['--network', 'local', '--serve'], url: `http://127.0.0.1:${P.drain}/state`, note: 'API de l\'attaquant simulé, pas une page', requires: [join(CHAIN_DIR, 'drain.mjs')] });
if (exists('research/demo_reelle/site/config.js')) {
  const cp = runOnce('site-config', join(DEMO_DIR, 'site', 'config.js'), []);
  cp.ok || say('  [attention] copie des adresses vers le site Glacier : voir logs/demo/site-config.log');
}
await service({ name: 'site', label: 'site « Glacier Rewards »', port: P.site, file: join(ROOT, 'docs', 'demo', 'serve_static.mjs'), fileArgs: [join(DEMO_DIR, 'site'), String(P.site)], url: `http://localhost:${P.site}/lure.html`, note: 'scène « me connecter » ; console présentateur : /attaquant.html', requires: [join(DEMO_DIR, 'site', 'index.html'), join(ROOT, 'docs', 'demo', 'serve_static.mjs')] });

if (flag('--ancien')) {
  say('\nServices de l\'ancienne version (--ancien) :');
  await service({ name: 'check', label: 'ancien : serveur de vérification (/check)', port: P.check, file: join(BANC, 'server', 'server.mjs'), url: `http://127.0.0.1:${P.check}/health`, note: 'utilisé par l\'extension avec serveur, pas par le build livré', requires: [join(BANC, 'server', 'server.mjs')] });
  await service({ name: 'rpc', label: 'ancien : RPC de garde', port: P.rpc, file: join(DEMO_DIR, 'rpc_garde', 'proxy.mjs'), env: { HOLDUP_UPSTREAM: `http://127.0.0.1:${P.chain}`, HOLDUP_RPC_PORT: String(P.rpc) }, url: `http://127.0.0.1:${P.rpc}/`, note: 'URL RPC à saisir dans le portefeuille ; page des demandes retenues à la même adresse', requires: [join(DEMO_DIR, 'rpc_garde', 'proxy.mjs')] });
  if (labApi) await service({ name: 'lab-api', label: 'ancien : labo (serveur)', port: P.labApi, file: join(ROOT, labApi), url: `http://127.0.0.1:${P.labApi}/` });
  if (labUiPage) await service({ name: 'lab-ui', label: 'ancien : labo (interface)', port: P.labUi, file: join(ROOT, 'docs', 'demo', 'serve_static.mjs'), fileArgs: [labUiDir, String(P.labUi)], url: `http://127.0.0.1:${P.labUi}/` });
}

// ---------------------------------------------------------------- 5. mode d'emploi
let addr = {};
try { addr = JSON.parse(readFileSync(join(CHAIN_DIR, 'addresses.local.json'), 'utf8')); } catch { /* absent */ }
say('\n==================== Ce que tu peux ouvrir ====================');
say('Dans Chrome ou Edge :');
if (urls.some((u) => u[0].startsWith('site Neve'))) {
  say(`  Scène principale, parcours honnête       : ${neveBase}?mode=honnete`);
  say(`  Scène principale, piège (droit illimité) : ${neveBase}?mode=piege`);
  say(`  Scène principale, piège par signature    : ${neveBase}?mode=piege&via=permit`);
} else say('  (le site Neve n\'est pas lancé, voir plus haut)');
for (const [l, u, n] of urls) if (!l.startsWith('site Neve')) say(`  ${l} : ${u}${n ? '   (' + n + ')' : ''}`);
say('\nExtension à charger (une fois) :');
if (existsSync(join(EXT_DIR, 'manifest.json'))) {
  say(`  ${EXT_DIR}`);
  say('  chrome://extensions (Edge : edge://extensions) > Mode développeur > Charger l\'extension non empaquetée > ce dossier.');
  say('  Une seule version de Hold up chargée à la fois. Recharge l\'onglet de la page après chaque chargement.');
} else bad(`dossier d'extension absent : ${EXT_DIR}`);
if (skipped.length) say(`\nNon lancés : ${skipped.join(', ')}.`);
say('\nPortefeuille de test (jamais un vrai) :');
say(`  réseau : RPC http://127.0.0.1:${P.chain}, chainId ${addr.chainId ?? 'voir addresses.local.json'}, symbole AVAX`);
say(`  compte approvisionné : ${addr.victim ?? 'voir research/demo_reelle/chain/addresses.local.json'} (2 480 DemoUSDC de test)`);
say('  Les clés des comptes Hardhat sont PUBLIQUES : ne jamais y mettre de vrais fonds.');
say('\nCe qui sort de la machine : la phrase écrite, du navigateur vers le relais local, qui la transmet au modèle seulement s\'il a une clé.');
say('\nDéjà en marche avant ce script (je n\'y touche pas) : ' + (reused.length ? reused.join(', ') : 'rien'));
say('Lancés par ce script (Ctrl+C les arrête)         : ' + (launched.length ? launched.join(', ') : 'rien'));
say('Guide pas à pas : livrables/INSTALLATION.md. Contrôle de l\'installation et des tests : node scripts/verifier_installation.mjs');
if (children.length === 0) { say('\nRien à garder en vie : tout tournait déjà. Rien à arrêter.'); process.exit(0); }
// HOLDUP_DEMO_AUTOSTOP=<secondes> : arrêt propre automatique (pour vérifier le démarrage et l'arrêt sans terminal interactif).
if (Number(process.env.HOLDUP_DEMO_AUTOSTOP) > 0) setTimeout(() => shutdown(0), Number(process.env.HOLDUP_DEMO_AUTOSTOP) * 1000);
const watch = setInterval(() => {
  for (const r of children) if (r.exited && !r.reported && !stopping) { r.reported = true; bad(`${r.name} s'est arrêté (code ${r.code}). Détail : logs/demo/${r.name}.log`); }
}, 3000);
process.on('exit', () => clearInterval(watch));
