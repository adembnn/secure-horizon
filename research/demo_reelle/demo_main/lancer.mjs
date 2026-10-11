#!/usr/bin/env node
// Hold up : la demo jouee A LA MAIN, en une commande.   node research/demo_reelle/demo_main/lancer.mjs
// Meme montage que les testeurs (research/demo_reelle/testeurs) : chaine Hardhat locale isolee, contrats de demo,
// sites servis en local, Chromium avec l'extension construite et un portefeuille de test dans la page.
// La difference : personne ne pilote, la fenetre est visible et c'est toi qui cliques et qui ecris.
//
// Scene 1, site frauduleux : Glacier Rewards (fausse recompense, signature Permit illimitee vers un contrat de collecte).
// Scene 2, site honnete    : Neve ?mode=habituel (droit ILLIMITE a son propre routeur) puis la regie « on pirate le site ».
//
// Rien ne touche la chaine partagee 8545 ni les sites 8791 / 8793. Seul le relais du classifieur (8789) est commun.
// Chaine locale numero 31337, expres : Hold up lit directement Avalanche (43114) et Fuji (43113) ; une chaine locale qui porterait
// l'un de ces numeros serait comparee a la vraie chaine, ou ses contrats de demo n'existent pas.
// Aucune cle : le portefeuille de test fait signer les comptes deverrouilles du noeud local (comptes Hardhat, publics).
// Relancer la commande remet tout a zero (chaine neuve). Ctrl+C ou fermer le navigateur arrete tout.
//
// Options : --sans-holdup   meme navigateur SANS l'extension (la prise « avant »)
//           --installation-neuve   ne declare pas les jetons de demo dans les reglages de l'extension
//           --sans-navigateur   monte seulement la chaine et les sites, affiche les adresses
//           --verifier      rejoue les deux scenes par script dans ce montage, affiche le resultat, puis s'arrete
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, rmSync, mkdirSync, openSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { RACINE, BLOCKCHAIN, SITE_ECHANGE, SITE_LEURRE, EXTENSION, CHROME_EXE, ICI as TESTEURS, requirePlaywright, requireEthers, rpc, sleep, portLibre } from '../testeurs/lib.mjs';

const has = (n) => process.argv.includes('--' + n);
const P = { chaine: 8645, neve: 8693, leurre: 8691, drain: 8692, pirate: 8612, reinit: 8613, relais: 8789 };
const D = join(process.env.TEMP || process.env.TMP || '.', 'holdup-demo-main');
const CHAIN_DIR = join(RACINE, 'research', 'demo_reelle', 'chain');
const RPC = `http://127.0.0.1:${P.chaine}`;
const URLS = {
  leurre: `http://localhost:${P.leurre}/lure.html`,
  attaquant: `http://localhost:${P.leurre}/attaquant.html`,
  neve: `http://localhost:${P.neve}/?mode=habituel`,
  regie: `http://localhost:${P.neve}/regie.html`
};
const say = (s = '') => console.log(s);

// ---------------------------------------------------------------- arret
const enfants = [];
let ctx = null, arret = false;
async function stop(code = 0) {
  if (arret) return; arret = true;
  say('\nArret de la demo...');
  try { if (ctx) await ctx.close(); } catch { /* deja ferme */ }
  for (const c of enfants) if (c.pid && c.exitCode === null) spawnSync('taskkill', ['/PID', String(c.pid), '/T', '/F'], { windowsHide: true });
  process.exit(code);
}
process.on('SIGINT', () => stop(0)); process.on('SIGTERM', () => stop(0));

// ---------------------------------------------------------------- 0. un ancien montage encore en marche : on l'arrete
const fPids = join(D, 'pids.json');
if (existsSync(fPids)) {
  try { for (const pid of JSON.parse(readFileSync(fPids, 'utf8'))) spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true }); } catch { /* illisible */ }
  await sleep(600);
}
// Un navigateur de demo reste d'un lancement precedent (terminal ferme sans Ctrl+C) : on le ferme, lui seulement.
spawnSync('powershell', ['-NoProfile', '-Command', "Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | Where-Object { $_.CommandLine -like '*holdup-demo-main*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"], { windowsHide: true });
for (const k of ['chaine', 'neve', 'leurre', 'drain', 'pirate', 'reinit']) {
  if (!(await portLibre(P[k]))) { say(`Le port ${P[k]} (${k}) est deja pris par un autre programme. Ferme-le puis relance.`); process.exit(1); }
}
rmSync(D, { recursive: true, force: true, maxRetries: 5 });
mkdirSync(join(D, 'journaux'), { recursive: true });
function lancer(nom, args, env = {}, cwd = BLOCKCHAIN) {
  const out = openSync(join(D, 'journaux', nom + '.log'), 'a');
  const c = spawn(process.execPath, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', out, out], windowsHide: true });
  enfants.push(c); writeFileSync(fPids, JSON.stringify(enfants.map((e) => e.pid)));
  return c;
}
async function attendrePort(port, nom) {
  for (let i = 0; i < 100; i++) { if (!(await portLibre(port))) return; await sleep(150); }
  say(`[ECHEC] ${nom} ne repond pas sur ${port}. Voir ${join(D, 'journaux')}`); await stop(1);
}

// ---------------------------------------------------------------- 1. chaine locale (config hors depot, aucun .env lu)
say('Hold up : demo a la main');
const cfg = join(D, 'hardhat.config.cjs');
writeFileSync(cfg, [
  `const bc = ${JSON.stringify(BLOCKCHAIN)};`,
  `require(bc + '/node_modules/@nomicfoundation/hardhat-toolbox');`,
  `module.exports = { solidity: '0.8.24', paths: { root: bc }, networks: { hardhat: { chainId: ${process.env.HOLDUP_DEMO_CHAINID || 31337} }, localhost: { url: '${RPC}' } } };`
].join('\n'));
const bootstrap = join(BLOCKCHAIN, 'node_modules', 'hardhat', 'internal', 'cli', 'bootstrap.js');
if (!existsSync(bootstrap)) { say('blockchain/node_modules est absent. Lance une fois : cd blockchain && npm install'); process.exit(1); }
lancer('chaine', [bootstrap, '--config', cfg, 'node', '--hostname', '127.0.0.1', '--port', String(P.chaine)], { HOLDUP_CHAIN_MODE: 'plain' });
for (let i = 0; ; i++) {
  try { await rpc(RPC, 'eth_chainId'); break; } catch { await sleep(300); }
  if (i > 100) { say('[ECHEC] la chaine ne repond pas. Voir ' + join(D, 'journaux', 'chaine.log')); await stop(1); }
}
say(`  [ok] chaine locale ${RPC}`);

// ---------------------------------------------------------------- 2. contrats de demo (adresses hors depot)
const sortie = join(D, 'chain'); mkdirSync(sortie, { recursive: true });
const envChaine = { HOLDUP_CHAIN_OUT_DIR: sortie, HOLDUP_PORT: String(P.chaine) };
const dep = spawnSync(process.execPath, [bootstrap, '--config', cfg, 'run', '--no-compile', join(BLOCKCHAIN, 'scripts', 'demo', 'deploy-local.js'), '--network', 'localhost'],
  { cwd: BLOCKCHAIN, env: { ...process.env, ...envChaine }, encoding: 'utf8', windowsHide: true });
writeFileSync(join(D, 'journaux', 'deploiement.log'), (dep.stdout || '') + (dep.stderr || ''));
const fAdr = join(sortie, 'addresses.local.json');
if (dep.status !== 0 || !existsSync(fAdr)) { say('[ECHEC] deploiement. Voir ' + join(D, 'journaux', 'deploiement.log')); await stop(1); }
const adr = JSON.parse(readFileSync(fAdr, 'utf8'));
// Deux comptes de test, tous deux deverrouilles sur le noeud local : la « victime » du site frauduleux (2 480 DUSDC)
// et le compte de l'echange (100 DUSDC, pour que la scene se lise 100 -> 50 -> 0 ou 50).
const { ethers } = requireEthers();
const provider = new ethers.JsonRpcProvider(RPC, undefined, { staticNetwork: true, batchMaxCount: 1, cacheTimeout: -1 });
const comptes = await provider.send('eth_accounts', []);
const compteLeurre = adr.victim.toLowerCase();
const compteNeve = comptes[6].toLowerCase();
const usdc = new ethers.Contract(adr.usdc, ['function mint(address,uint256)', 'function balanceOf(address) view returns (uint256)', 'function allowance(address,address) view returns (uint256)'], await provider.getSigner(comptes[6]));
await (await usdc.mint(comptes[6], 100_000000n)).wait();
say(`  [ok] contrats de demo ; compte du site frauduleux 2 480 DUSDC, compte de l'echange 100 DUSDC`);

// ---------------------------------------------------------------- 3. sites : copies pointees sur ce montage
const neve = join(D, 'site_echange'), leurre = join(D, 'site');
cpSync(SITE_ECHANGE, neve, { recursive: true, filter: (s) => !/[\\/]test([\\/]|$)/.test(s) });
cpSync(SITE_LEURRE, leurre, { recursive: true });
const KEEP = ['chainId', 'rpcUrl', 'usdc', 'wavax', 'router', 'vulnRouter', 'drainer', 'collector'];
writeFileSync(join(neve, 'addresses.local.json'), JSON.stringify(Object.fromEntries(KEEP.filter((k) => adr[k] !== undefined).map((k) => [k, adr[k]])), null, 2));
writeFileSync(join(leurre, 'addresses.local.json'), JSON.stringify(adr, null, 2));
const remplacer = (f, de, vers) => { const s = readFileSync(f, 'utf8'); if (!s.includes(de)) { say(`[attention] ${de} introuvable dans ${f}`); return; } writeFileSync(f, s.split(de).join(vers)); };
remplacer(join(leurre, 'app.js'), '127.0.0.1:8792', `127.0.0.1:${P.drain}`);
remplacer(join(leurre, 'attaquant.js'), '127.0.0.1:8792', `127.0.0.1:${P.drain}`);
remplacer(join(neve, 'regie.html'), '127.0.0.1:8611', `127.0.0.1:${P.pirate}`);
// Regie : un bouton de plus, dans la copie seulement, qui remet les trois cas d'usage a leur etat de depart (voir l'etape 5 bis).
remplacer(join(neve, 'regie.html'), '<p id="status"></p>', `<div class="row"><button id="btn-reinit" type="button">Réinitialiser toute la démo</button></div>
<p id="status"></p>
<script>
document.getElementById("btn-reinit").addEventListener("click", async function () {
  var b = this, st = document.getElementById("status"); b.disabled = true; st.textContent = "Réinitialisation…";
  try {
    var r = await fetch("http://127.0.0.1:${P.reinit}/reinitialiser", { method: "POST" }); var d = await r.json();
    if (!r.ok || d.error) throw new Error(d.error || ("HTTP " + r.status));
    document.getElementById("btn-etat").click();
    setTimeout(function () { st.textContent = "Démo réinitialisée : " + d.resume; }, 600);
  } catch (e) { st.textContent = "Réinitialisation impossible : " + e.message; }
  b.disabled = false;
});
</script>`);
const statique = join(TESTEURS, 'serveur_statique.mjs');
lancer('site_neve', [statique, neve, String(P.neve)]);
lancer('site_leurre', [statique, leurre, String(P.leurre)]);
const origines = [P.neve, P.leurre].flatMap((p) => [`http://localhost:${p}`, `http://127.0.0.1:${p}`]).join(',');
const lancerAttaquant = () => lancer('attaquant', [join(CHAIN_DIR, 'drain.mjs'), '--network', 'local', '--serve'], { ...envChaine, HOLDUP_DRAIN_PORT: String(P.drain), HOLDUP_SITE_ORIGINS: origines }, RACINE);
let attaquant = lancerAttaquant();
lancer('pirate', [join(CHAIN_DIR, 'pirater.mjs'), '--network', 'local', '--serve'], { ...envChaine, HOLDUP_PIRATE_PORT: String(P.pirate), HOLDUP_SITE_ORIGINS: origines }, RACINE);
await attendrePort(P.neve, 'site Neve'); await attendrePort(P.leurre, 'site Glacier'); await attendrePort(P.drain, 'console attaquant'); await attendrePort(P.pirate, 'regie pirate');
say('  [ok] sites : Glacier Rewards (frauduleux), Neve (honnete), console de l\'attaquant, regie');

// ---------------------------------------------------------------- 4. relais du classifieur (commun ; lance seulement s'il manque)
if (await portLibre(P.relais)) {
  const relais = join(RACINE, 'research', 'demo_reelle', 'classifieur', 'relay.mjs');
  lancer('relais', [...(existsSync(join(RACINE, '.env')) ? ['--env-file=.env'] : []), relais], {}, RACINE);
  await attendrePort(P.relais, 'relais du classifieur');
}
let fournisseur = '?';
try { fournisseur = (await (await fetch(`http://127.0.0.1:${P.relais}/health`, { signal: AbortSignal.timeout(2500) })).json()).provider || '?'; } catch { /* illisible */ }
say(`  [ok] relais du classifieur (${fournisseur === 'keywords' ? 'SANS modele : mots-cles seulement, aucune cle lue' : 'modele ' + fournisseur})`);

if (has('sans-navigateur')) {
  say('\nMontage pret, sans navigateur :'); for (const [k, u] of Object.entries(URLS)) say(`  ${k.padEnd(10)} ${u}`);
  say('Ctrl+C pour tout arreter.'); await new Promise(() => {});
}

// ---------------------------------------------------------------- 5. navigateur : extension construite + portefeuille de test
const { chromium } = requirePlaywright();
const avecHoldUp = !has('sans-holdup');
const verifier = has('verifier');
const ext = join(D, 'extension');
const extSource = (process.argv.find((x) => x.startsWith('--extension=')) || '').slice(12) || EXTENSION; // --extension=<dossier> : un autre build
if (avecHoldUp) cpSync(extSource, ext, { recursive: true });
const args = ['--no-first-run', '--no-default-browser-check', '--start-maximized'];
if (verifier) args.push('--headless=new'); // le rejeu par script ne prend pas l'ecran
if (avecHoldUp) args.push(`--disable-extensions-except=${ext}`, `--load-extension=${ext}`);
ctx = await chromium.launchPersistentContext(join(D, 'profil'), { executablePath: CHROME_EXE, headless: false, viewport: null, locale: 'fr-FR', args, ignoreDefaultArgs: ['--enable-automation'] });
// Le portefeuille de test : il repond tout de suite, sans fenetre de confirmation, et fait signer le compte par le noeud local.
// C'est exactement le portefeuille des testeurs, sans cle dans la page ni dans ce script.
await ctx.addInitScript(([parPort, defaut, chainHex, rpcUrl]) => {
  if (window.top !== window) return;
  const compte = parPort[location.port] || defaut;
  const rpc = (method, params) => fetch(rpcUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }) }).then((r) => r.json()).then((j) => { if (j.error) { const e = new Error(j.error.message); e.code = j.error.code; throw e; } return j.result; });
  const provider = { isMetaMask: false, request: async ({ method, params }) => {
    if (method === 'eth_requestAccounts' || method === 'eth_accounts') return [compte];
    if (method === 'eth_chainId') return chainHex;
    if (method === 'net_version') return String(parseInt(chainHex, 16));
    if (method === 'wallet_switchEthereumChain' || method === 'wallet_addEthereumChain') return null;
    if (method === 'eth_sendTransaction') return rpc(method, [{ ...params[0], from: compte }]);
    if (method === 'eth_signTypedData_v4') return rpc(method, [compte, typeof params[1] === 'string' ? JSON.parse(params[1]) : params[1]]);
    return rpc(method, params || []);
  }, on() {}, removeListener() {} };
  window.ethereum = provider;
  const announce = () => window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail: Object.freeze({ info: { uuid: '6f1c2a3e-0000-4000-8000-00000000d3a1', name: 'Portefeuille de test', icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>', rdns: 'test.local.wallet' }, provider }) }));
  window.addEventListener('eip6963:requestProvider', announce); announce();
}, [{ [P.leurre]: compteLeurre, [P.neve]: compteNeve }, compteNeve, '0x' + Number(adr.chainId).toString(16), RPC]);

const fenetres = []; // fenetres ouvertes par l'extension
ctx.on('page', (p) => { if (p.url().startsWith('chrome-extension://') || p.url() === 'about:blank' || p.url() === '') fenetres.push(p); });
await sleep(1500); // laisse l'extension s'installer (elle peut ouvrir sa page d'accueil)
// Reglage fait une fois par la personne dans « Mon contexte » : les deux jetons de la chaine de demo (etat T+ des testeurs).
// Sans lui, sur une installation neuve, Hold up signale l'acces illimite mais conseille de reduire soi-meme au lieu de limiter.
if (avecHoldUp && !has('installation-neuve')) {
  const sw = ctx.serviceWorkers()[0] || await ctx.waitForEvent('serviceworker', { timeout: 10000 }).catch(() => null);
  const jetons = [{ address: adr.usdc, symbol: 'USDC', decimals: 6, chainId: adr.chainId }, { address: adr.wavax, symbol: 'WAVAX', decimals: 18, chainId: adr.chainId }];
  const ecrit = sw ? await sw.evaluate(async ([tokens, knownSpenders]) => { await chrome.storage.local.set({ contexte: { tokens, knownSpenders } }); return true; }, [jetons, [adr.router, adr.vulnRouter]]).catch(() => false) : false;
  say(ecrit ? '  [ok] extension Hold up chargee, jetons de la chaine de demo declares dans ses reglages' : '  [ECHEC] extension Hold up : reglages non ecrits (extension non chargee ?)');
}
const premier = ctx.pages()[0] || await ctx.newPage();
const onglets = { leurre: premier };
await premier.goto(URLS.leurre);
for (const k of ['attaquant', 'neve', 'regie']) { onglets[k] = await ctx.newPage(); await onglets[k].goto(URLS[k]); }
for (const p of ctx.pages()) if (/welcome\.html/.test(p.url())) await p.close().catch(() => {});
await onglets.leurre.bringToFront();
ctx.on('close', () => stop(0));

const lire = async () => ({
  leurre_usdc: Number(await usdc.balanceOf(compteLeurre)) / 1e6, leurre_droit_piege: String(await usdc.allowance(compteLeurre, adr.drainer)),
  neve_usdc: Number(await usdc.balanceOf(compteNeve)) / 1e6, neve_droit_routeur: String(await usdc.allowance(compteNeve, adr.vulnRouter)),
  pirate_usdc: Number(await usdc.balanceOf(adr.collector)) / 1e6
});
// ---------------------------------------------------------------- 5 bis. reinitialisation, appelee par le bouton de la regie
// La chaine revient a l'instantane pris au depart (soldes, droits, butin du pirate), l'extension oublie ce qu'elle a vu
// (journal, autorisations laissees ouvertes ; ses reglages restent), ses fenetres se ferment, les onglets reviennent a leur page de depart.
const extId = avecHoldUp ? JSON.parse(readFileSync(join(ext, 'BUILD_INFO.json'), 'utf8')).extension_id : null;
let instantane = await provider.send('evm_snapshot', []);
let enCours = false;
async function reinitialiser() {
  await provider.send('evm_revert', [instantane]);
  instantane = await provider.send('evm_snapshot', []);
  for (const p of ctx.pages()) if (p.url().startsWith('chrome-extension://')) await p.close().catch(() => {});
  let extension = 'sans extension';
  if (extId) {
    const p = await ctx.newPage();
    try {
      await p.goto(`chrome-extension://${extId}/popup.html`);
      await p.evaluate(async () => { await chrome.storage.session.clear(); const tout = await chrome.storage.local.get(null); await chrome.storage.local.remove(Object.keys(tout).filter((k) => !['contexte', 'cfg'].includes(k))); });
      extension = 'journal et autorisations de l\x27extension effaces';
    } catch (e) { extension = 'extension NON remise a zero (' + String(e.message).split('\n')[0] + ')'; }
    await p.close().catch(() => {});
  }
  // la console de l'attaquant garde sa chronologie en memoire : on la relance
  if (attaquant.pid && attaquant.exitCode === null) spawnSync('taskkill', ['/PID', String(attaquant.pid), '/T', '/F'], { windowsHide: true });
  for (let i = 0; i < 40 && !(await portLibre(P.drain)); i++) await sleep(100);
  attaquant = lancerAttaquant(); await attendrePort(P.drain, 'console attaquant');
  for (const k of ['leurre', 'attaquant', 'neve']) { if (onglets[k].isClosed()) onglets[k] = await ctx.newPage(); await onglets[k].goto(URLS[k]).catch(() => {}); }
  if (onglets.regie.isClosed()) { onglets.regie = await ctx.newPage(); await onglets.regie.goto(URLS.regie).catch(() => {}); }
  await onglets.regie.bringToFront().catch(() => {});
  const e = await lire();
  return `compte du site frauduleux ${e.leurre_usdc} DUSDC, compte de l'échange ${e.neve_usdc} DUSDC, pirate ${e.pirate_usdc} DUSDC ; ${extension}.`;
}
const ORIGINES_REGIE = new Set([`http://localhost:${P.neve}`, `http://127.0.0.1:${P.neve}`]);
createServer(async (req, res) => {
  const o = req.headers.origin, cors = o && ORIGINES_REGIE.has(o) ? { 'access-control-allow-origin': o, vary: 'Origin' } : {};
  const fin = (code, corps) => res.writeHead(code, { 'content-type': 'application/json', ...cors }).end(JSON.stringify(corps));
  if (![`127.0.0.1:${P.reinit}`, `localhost:${P.reinit}`].includes(String(req.headers.host)) || (o && !ORIGINES_REGIE.has(o))) return fin(403, { error: 'refuse' });
  if (req.method === 'OPTIONS') return res.writeHead(204, { ...cors, 'access-control-allow-methods': 'POST' }).end();
  if (req.method !== 'POST' || req.url !== '/reinitialiser') return fin(404, { error: 'introuvable' });
  if (enCours) return fin(409, { error: 'une reinitialisation est deja en cours' });
  enCours = true;
  try { const resume = await reinitialiser(); say(new Date().toLocaleTimeString('fr-FR') + '  REINITIALISE : ' + resume); fin(200, { ok: true, resume }); }
  catch (e) { fin(500, { error: String(e.message).split('\n')[0] }); }
  enCours = false;
}).listen(P.reinit, '127.0.0.1');

const lisible = (v) => (BigInt(v) >= 2n ** 128n ? 'ILLIMITE' : Number(v) / 1e6);

if (!verifier) {
  say('');
  say(`==================== Pret${avecHoldUp ? '' : ' (SANS Hold up : prise « avant »)'} ====================`);
  say('Quatre onglets sont ouverts dans le navigateur de demo :');
  say(`  1. Site frauduleux        ${URLS.leurre}`);
  say(`  2. Console de l'attaquant ${URLS.attaquant}`);
  say(`  3. Site honnete (Neve)    ${URLS.neve}`);
  say(`  4. Regie « on pirate »    ${URLS.regie}`);
  say('');
  say('Scene 1 : onglet 1, suivre le lien, « Connecter mon portefeuille », « Reclamer ma recompense ».');
  say('          Hold up s\x27interpose. Ecrire : recevoir ma récompense   Reponse : « Ça ne correspond pas », puis Annuler.');
  say('          L\x27onglet 2 (attaquant) ne bouge pas : 2 480 DUSDC toujours sur le compte.');
  say('Scene 2 : onglet 3, « Connecter le portefeuille », « Echanger ». Ecrire : échanger 50 USDC contre AVAX');
  say('          Reponse : « Tu as ecrit 50 USDC. La demande donne acces a tout ton USDC. » Annuler : rien ne part.');
  say('          Onglet 4, « Pirater » : sert a montrer ce que l\x27illimite aurait coute (a jouer avec --sans-holdup : 100 -> 50 -> 0).');
  say('');
  say('Soldes lus sur la chaine (mis a jour ici quand ils changent) :');
  let dernier = '';
  setInterval(async () => {
    try {
      const e = await lire();
      const l = `  frauduleux : compte ${e.leurre_usdc} DUSDC, droit du piege ${lisible(e.leurre_droit_piege)} | echange : compte ${e.neve_usdc} DUSDC, droit du routeur ${lisible(e.neve_droit_routeur)} | pirate ${e.pirate_usdc} DUSDC`;
      if (l !== dernier) { dernier = l; say(new Date().toLocaleTimeString('fr-FR') + l); }
    } catch { /* chaine arretee */ }
  }, 1500);
  say('Remise a zero : onglet 4 (regie), bouton « Réinitialiser toute la démo ». Fermer le navigateur arrete tout.');
  await new Promise(() => {});
}

// ---------------------------------------------------------------- 6. --verifier : les deux scenes rejouees par script, dans CE montage
const R = [];
const note = (s) => { R.push(s); say('  ' + s); };
const texte = async (p) => (await p.evaluate(() => document.body.innerText).catch(() => '')).replace(/\s+/g, ' ').trim();
async function fenetreSuivante(depuis, ms = 9000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { const f = fenetres.slice(depuis).find((p) => !p.isClosed()); if (f) { await f.waitForLoadState().catch(() => {}); await sleep(1200); return f; } await sleep(200); }
  return null;
}
async function repondre(f, phrase, bouton) {
  const champ = f.locator('textarea, input[type="text"], input:not([type])').first();
  // Le champ doit s'ouvrir vide, sans exemple : c'est la personne qui ecrit. Lu avant de taper, avec une capture.
  let vide = '';
  if (await champ.count()) {
    const avant = await champ.evaluate((x) => ({ value: x.value, placeholder: x.placeholder })).catch(() => null);
    vide = " | champ vide a l'ouverture : " + (avant && !avant.value && !avant.placeholder ? 'oui' : 'NON' + (avant ? ' (' + (avant.value || avant.placeholder) + ')' : ''));
    await f.screenshot({ path: join(D, `verif_${R.length}_ouverture.png`) }).catch(() => {});
    await champ.fill(phrase); await sleep(600); await champ.press('Enter');
  }
  for (const t = Date.now(); !f.isClosed() && Date.now() - t < 6000 && !(await f.locator('[data-outcome]').count().catch(() => 1));) await sleep(150);
  if (f.isClosed()) return '(fenetre fermee toute seule)';
  const verdict = (await f.locator('[data-outcome]').first().getAttribute('data-outcome').catch(() => null)) || '?';
  const vu = (await texte(f)).slice(0, 260);
  await f.screenshot({ path: join(D, `verif_${R.length}.png`) }).catch(() => {});
  let suite = "";
  if (bouton) {
    let fait = false;
    for (const t = Date.now(); Date.now() - t < 45000 && !f.isClosed() && !fait;) {
      fait = await f.evaluate((b) => { const x = [...document.querySelectorAll("button")].find((y) => y.innerText.trim().toLowerCase() === b && !y.disabled && y.getAttribute("aria-disabled") !== "true"); if (x) { x.click(); return true; } return false; }, bouton).catch(() => false);
      if (!fait) await sleep(500);
    }
    await sleep(1500);
    suite = " | clic " + bouton + " : " + (fait ? "oui" : "NON") + " | ensuite : " + (f.isClosed() ? "(fenetre fermee)" : (await texte(f)).slice(0, 260));
    if (!f.isClosed()) await f.screenshot({ path: join(D, `verif_${R.length}_apres.png`) }).catch(() => {});
  }
  return `verdict ${verdict}${vide} | ${vu}${suite}`;
}
say(`\nVerification${avecHoldUp ? '' : ' SANS Hold up'} : les deux scenes, par script.`);
note('depart : ' + JSON.stringify(await lire()));
try {
  // scene 1 : site frauduleux
  const s1 = onglets.leurre; await s1.bringToFront();
  await s1.locator('a').first().click(); await s1.waitForLoadState(); await sleep(1500);
  const boutons1 = s1.locator('button:visible');
  await boutons1.first().click(); await sleep(2000);
  let n = fenetres.length;
  await s1.locator('button:visible').filter({ hasText: /r[ée]clamer/i }).first().click();
  if (avecHoldUp) {
    const f = await fenetreSuivante(n);
    note('scene 1, fenetre Hold up : ' + (f ? await repondre(f, 'recevoir ma récompense', 'annuler') : 'AUCUNE'));
  }
  await sleep(4000);
  note('scene 1, site : ' + (await texte(s1)).slice(-200));
  note('scene 1, chaine : ' + JSON.stringify(await lire()));
  // scene 2 : site honnete qui demande l'illimite
  const s2 = onglets.neve; await s2.bringToFront();
  n = fenetres.length;
  await s2.locator('#btn-swap').click(); await sleep(2000);
  if (/connex|connect/i.test(await s2.locator('#btn-swap').innerText().catch(() => ''))) { await s2.locator('#btn-swap').click(); await sleep(1500); }
  if (avecHoldUp) {
    if (fenetres.length === n) await s2.locator('#btn-swap').click().catch(() => {});
    for (let tour = 0; tour < 3; tour++) {
      const f = await fenetreSuivante(n, 7000); if (!f) break;
      n = fenetres.indexOf(f) + 1;
      note(`scene 2, fenetre Hold up ${tour + 1} : ` + await repondre(f, 'échanger 50 USDC contre AVAX', 'continuer'));
      for (const t = Date.now(); !f.isClosed() && Date.now() - t < 8000;) await sleep(200);
    }
  } else if (!/…|cours/.test(await s2.locator('#state').innerText().catch(() => ''))) await s2.locator('#btn-swap').click().catch(() => {});
  await sleep(5000);
  note('scene 2, site : ' + (await s2.locator('#state').innerText().catch(() => '')).replace(/\s+/g, ' '));
  note('scene 2, chaine apres l\'echange : ' + JSON.stringify(await lire()));
  const s3 = onglets.regie; await s3.bringToFront();
  await s3.locator('#btn-pirater').click(); await sleep(4000);
  note('regie : ' + (await s3.locator('#status').innerText().catch(() => '')).replace(/\s+/g, ' '));
  note('scene 2, chaine apres le piratage : ' + JSON.stringify(await lire()));
} catch (e) { note('ERREUR ' + String(e.message).split('\n')[0]); }
try {
  const r = await onglets.regie.evaluate(async (port) => { const x = await fetch(`http://127.0.0.1:${port}/reinitialiser`, { method: 'POST' }); return x.status + ' ' + await x.text(); }, P.reinit);
  note('reinitialisation (appel depuis la regie) : ' + r);
  note('chaine apres reinitialisation : ' + JSON.stringify(await lire()));
  await sleep(1500);
  note('onglets apres reinitialisation : ' + ctx.pages().map((p) => p.url().replace('http://localhost:', ':')).join(' | '));
  note('bouton dans la regie : ' + await onglets.regie.locator('#btn-reinit').innerText().catch(() => 'ABSENT'));
} catch (e) { note('reinitialisation ERREUR ' + String(e.message).split('\n')[0]); }
writeFileSync(join(D, 'verification.json'), JSON.stringify(R, null, 1));
await stop(0);
