// Outillage commun des testeurs Hold up : chemins, etat d'un environnement, petits utilitaires.
// Chaine locale uniquement. Aucune cle n'est jamais affichee ni ecrite.
import { createRequire } from 'node:module';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import net from 'node:net';

export const ICI = dirname(fileURLToPath(import.meta.url));
export const RACINE = resolve(ICI, '..', '..', '..');
export const BLOCKCHAIN = join(RACINE, 'blockchain');
export const SITE_ECHANGE = join(RACINE, 'research', 'demo_reelle', 'site_echange');
export const SITE_LEURRE = join(RACINE, 'research', 'demo_reelle', 'site');
export const EXTENSION = join(RACINE, 'research', 'titouan', 'T_banc_e2e', 'extension_standalone', 'extension');
export const PLAYWRIGHT_DIR = process.env.HOLDUP_PLAYWRIGHT_DIR || 'C:/Users/Adem/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright-core';
export const CHROME_EXE = process.env.HOLDUP_CHROME_EXE || 'C:/Users/Adem/AppData/Local/Packages/Claude_pzs8sxrjxfjjc/LocalCache/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export function arg(nom, defaut) {
  const p = '--' + nom + '=';
  const a = process.argv.find((x) => x.startsWith(p));
  if (a) return a.slice(p.length);
  return process.argv.includes('--' + nom) ? true : defaut;
}
export function idDepuisArgs() {
  const id = Number(arg('id'));
  if (!Number.isInteger(id) || id < 1 || id > 40) { console.error('--id=N obligatoire (entier de 1 a 40)'); process.exit(2); }
  return id;
}
// Ports : jamais 8545 (chaine partagee), 8789 (relais), 8793 (site partage).
export const ports = (n) => ({ chaine: 8600 + n, neve: 8700 + n, leurre: 8710 + n });
export const dossier = (n) => join(process.env.TEMP || process.env.TMP || tmpdir(), 'holdup-testeur-' + n);
export const fichierEtat = (n) => join(dossier(n), 'etat.json');
export function lireEtat(n) {
  const f = fichierEtat(n);
  if (!existsSync(f)) { console.error(`Environnement ${n} absent (${f}). Lance d'abord : node monter.mjs --id=${n}`); process.exit(2); }
  return JSON.parse(readFileSync(f, 'utf8'));
}
export function ecrireJson(f, o) { mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, JSON.stringify(o, null, 2)); }
export function requireEthers() { return createRequire(join(BLOCKCHAIN, 'package.json'))('ethers'); }
export function requirePlaywright() { return createRequire(join(PLAYWRIGHT_DIR, 'package.json'))(PLAYWRIGHT_DIR); }
export async function rpc(url, method, params = []) {
  const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
  const j = await r.json(); if (j.error) throw new Error(j.error.message); return j.result;
}
export function portLibre(port) {
  return new Promise((ok) => { const c = net.connect(port, '127.0.0.1'); c.once('connect', () => { c.destroy(); ok(false); }); c.once('error', () => ok(true)); });
}
