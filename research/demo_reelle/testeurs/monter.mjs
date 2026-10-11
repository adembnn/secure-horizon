#!/usr/bin/env node
// Monte un environnement isole complet pour le testeur N : chaine Hardhat locale, contrats de demo,
// site Neve, site leurre, page d'envois, copie de l'extension. Tout vit dans %TEMP%/holdup-testeur-N/.
// Usage : node monter.mjs --id=N        (ne touche jamais 8545, 8789, 8793, ni addresses.local.json du depot)
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, rmSync, mkdirSync, openSync, writeFileSync, readFileSync, existsSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { ICI, BLOCKCHAIN, SITE_ECHANGE, SITE_LEURRE, EXTENSION, idDepuisArgs, ports, dossier, fichierEtat, ecrireJson, rpc, sleep, portLibre } from './lib.mjs';

const n = idDepuisArgs();
const t0 = Date.now();
const P = ports(n), D = dossier(n);
const etapes = {};
const marque = (nom, t) => { etapes[nom] = Math.round((Date.now() - t) / 100) / 10; };

if (existsSync(fichierEtat(n))) { // un ancien environnement du meme numero : on l'arrete d'abord
  spawnSync(process.execPath, [join(ICI, 'demonter.mjs'), `--id=${n}`, '--silencieux'], { stdio: 'ignore' });
}
for (const [nom, port] of Object.entries(P)) {
  if (!(await portLibre(port))) { console.error(`Port ${port} (${nom}) deja utilise. Demonte l'environnement ${n} ou prends un autre numero.`); process.exit(1); }
}
rmSync(D, { recursive: true, force: true, maxRetries: 5 });
mkdirSync(join(D, 'journaux'), { recursive: true });

// --- 1. Chaine Hardhat. Config minimale hors depot : aucun .env n'est lu (le hardhat.config.js du depot charge dotenv).
let t = Date.now();
const cfg = join(D, 'hardhat.config.cjs');
writeFileSync(cfg, [
  `const bc = ${JSON.stringify(BLOCKCHAIN)};`,
  `require(bc + '/node_modules/@nomicfoundation/hardhat-toolbox');`,
  `module.exports = { solidity: '0.8.24', paths: { root: bc }, networks: { hardhat: { chainId: 43114 }, localhost: { url: 'http://127.0.0.1:${P.chaine}' } } };`
].join('\n'));
const bootstrap = join(BLOCKCHAIN, 'node_modules', 'hardhat', 'internal', 'cli', 'bootstrap.js');
const pids = {};
function lancer(nom, cmdArgs, env = {}) {
  const out = openSync(join(D, 'journaux', nom + '.log'), 'a');
  const c = spawn(process.execPath, cmdArgs, { cwd: BLOCKCHAIN, env: { ...process.env, ...env }, detached: true, stdio: ['ignore', out, out], windowsHide: true });
  c.unref(); pids[nom] = c.pid; return c;
}
lancer('chaine', [bootstrap, '--config', cfg, 'node', '--hostname', '127.0.0.1', '--port', String(P.chaine)], { HOLDUP_CHAIN_MODE: 'plain' });
const url = `http://127.0.0.1:${P.chaine}`;
for (let i = 0; i < 100; i++) {
  try { await rpc(url, 'eth_chainId'); break; } catch { await sleep(300); }
  if (i === 99) { console.error('La chaine ne repond pas. Voir ' + join(D, 'journaux', 'chaine.log')); process.exit(1); }
}
marque('chaine', t);

// --- 2. Contrats de demo, adresses dans le dossier temporaire (HOLDUP_CHAIN_OUT_DIR), jamais dans le depot.
t = Date.now();
const sortieChaine = join(D, 'chain'); mkdirSync(sortieChaine, { recursive: true });
const dep = spawnSync(process.execPath, [bootstrap, '--config', cfg, 'run', '--no-compile', join(BLOCKCHAIN, 'scripts', 'demo', 'deploy-local.js'), '--network', 'localhost'],
  { cwd: BLOCKCHAIN, env: { ...process.env, HOLDUP_CHAIN_OUT_DIR: sortieChaine, HOLDUP_PORT: String(P.chaine) }, encoding: 'utf8' });
writeFileSync(join(D, 'journaux', 'deploiement.log'), (dep.stdout || '') + (dep.stderr || ''));
const fAdr = join(sortieChaine, 'addresses.local.json');
if (dep.status !== 0 || !existsSync(fAdr)) {
  console.error('Deploiement echoue. Voir ' + join(D, 'journaux', 'deploiement.log'));
  spawnSync('taskkill', ['/PID', String(pids.chaine), '/T', '/F']); process.exit(1);
}
const adr = JSON.parse(readFileSync(fAdr, 'utf8'));
marque('contrats', t);

// --- 3. Sites : copies, pointees sur cette chaine.
t = Date.now();
const neve = join(D, 'site_echange'), leurre = join(D, 'site');
cpSync(SITE_ECHANGE, neve, { recursive: true, filter: (s) => !/[\\/]test([\\/]|$)/.test(s) });
cpSync(SITE_LEURRE, leurre, { recursive: true });
const KEEP = ['chainId', 'rpcUrl', 'usdc', 'wavax', 'router', 'vulnRouter', 'drainer', 'collector'];
const slim = Object.fromEntries(KEEP.filter((k) => adr[k] !== undefined).map((k) => [k, adr[k]]));
writeFileSync(join(neve, 'addresses.local.json'), JSON.stringify(slim, null, 2));
writeFileSync(join(leurre, 'addresses.local.json'), JSON.stringify(adr, null, 2));
copyFileSync(join(ICI, 'page_envois.html'), join(neve, 'page_envois.html'));
writeFileSync(join(neve, 'adresses.json'), JSON.stringify({ ...slim, nft: adr.nft, deployer: adr.deployer }, null, 2));
lancer('site_neve', [join(ICI, 'serveur_statique.mjs'), neve, String(P.neve)]);
lancer('site_leurre', [join(ICI, 'serveur_statique.mjs'), leurre, String(P.leurre)]);
marque('sites', t);

// --- 4. Extension : copie prise a cet instant.
t = Date.now();
const ext = join(D, 'extension');
cpSync(EXTENSION, ext, { recursive: true });
const build = JSON.parse(readFileSync(join(ext, 'BUILD_INFO.json'), 'utf8'));
marque('extension', t);

for (let i = 0; i < 30; i++) { if (!(await portLibre(P.neve)) && !(await portLibre(P.leurre))) break; await sleep(150); }
const dureeS = Math.round((Date.now() - t0) / 100) / 10;
const etat = {
  id: n, monte_le: new Date().toISOString(), duree_montage_s: dureeS, etapes_s: etapes, ports: P, pids, dossier: D,
  chaine: { rpc: url, chainId: adr.chainId, adresses: adr }, // adresses publiques ; aucune cle
  sites: { neve: `http://127.0.0.1:${P.neve}`, leurre: `http://127.0.0.1:${P.leurre}`, envois: `http://127.0.0.1:${P.neve}/page_envois.html` },
  extension: { dossier: ext, extension_id: build.extension_id, build_info: build }
};
ecrireJson(fichierEtat(n), etat);
console.log(`Environnement ${n} pret en ${dureeS} s (chaine ${etapes.chaine} s, contrats ${etapes.contrats} s, sites ${etapes.sites} s, extension ${etapes.extension} s)`);
console.log(`  chaine ${url}  Neve ${etat.sites.neve}  leurre ${etat.sites.leurre}  envois ${etat.sites.envois}`);
console.log(`  extension ${build.extension_id}  tree_sha256 ${build.tree_sha256}`);
console.log(`  dossier ${D}`);
