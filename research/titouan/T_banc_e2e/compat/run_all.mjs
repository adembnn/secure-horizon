// Usage: node run_all.mjs [--sites sites.json] [--out results] [--rounds A1:control,B:test,A2:control] [--workers 4] [--only id,id] [--force] [--gap 1500]
// Chaque tour visite tous les sites une fois (bras controle, test, controle bis => bruit A/A). Reprise: les fichiers existants sont ignores.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ChromeInstance, sleep } from './lib/cdp.mjs';
import { visit } from './lib/visit.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true) : d; };
const sitesFile = path.resolve(HERE, arg('sites', 'sites.json'));
const outDir = path.resolve(HERE, arg('out', 'results'));
const rounds = String(arg('rounds', 'A1:control,B:test,A2:control')).split(',').map(s => s.split(':'));
const nWorkers = +arg('workers', 3);
const gap = +arg('gap', 1500);
const only = arg('only', null) ? String(arg('only')).split(',') : null;
const force = !!arg('force', false);
let sites = JSON.parse(readFileSync(sitesFile, 'utf8'));
if (only) sites = sites.filter(s => only.includes(s.id));
const tmpBase = path.join(HERE, '_tmp');

async function worker(wid, queue, round, arm) {
  let chrome = null;
  const ensure = async () => { if (!chrome || chrome.conn.closed || chrome.visits >= 12) { if (chrome) await chrome.close(); chrome = await ChromeInstance.launch(tmpBase); } return chrome; };
  try {
    for (;;) {
      const site = queue.shift(); if (!site) break;
      const file = path.join(outDir, round, site.id + '.json');
      if (!force && existsSync(file)) continue;
      let rec;
      try { const c = await ensure(); rec = await visit(c.conn, site, arm); c.visits++; }
      catch (e) { rec = { siteId: site.id, url: site.url, arm, fatal: 'harnais: ' + String(e.message).slice(0, 160) }; chrome = null; }
      writeFileSync(file, JSON.stringify(rec, null, 1));
      const flag = rec.navError ? 'NAVERR ' + rec.navError : rec.fatal ? 'FATAL ' + rec.fatal : 'ok';
      console.log(`[${round}/${arm}] w${wid} ${site.id.padEnd(16)} ${flag} ${rec.ms || 0}ms status=${rec.main ? rec.main.status : '-'} reqAcc=${(rec.events || []).filter(e => e.t === 'req' && e.m === 'eth_requestAccounts').length}`);
      await sleep(gap);
    }
  } finally { if (chrome) await chrome.close(); }
}

for (const [round, arm] of rounds) {
  mkdirSync(path.join(outDir, round), { recursive: true });
  console.log(`=== tour ${round} (bras ${arm}) : ${sites.length} sites, ${nWorkers} workers ===`);
  const queue = [...sites];
  await Promise.all(Array.from({ length: nWorkers }, (_, i) => worker(i, queue, round, arm)));
}
console.log('termine');
