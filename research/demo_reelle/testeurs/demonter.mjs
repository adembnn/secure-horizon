#!/usr/bin/env node
// Arrete proprement l'environnement N (chaine, sites). Les resultats sont gardes ; --effacer supprime tout le dossier.
// Usage : node demonter.mjs --id=N [--effacer]
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { arg, idDepuisArgs, dossier, fichierEtat, portLibre, ports, sleep } from './lib.mjs';
const n = idDepuisArgs(), mut = arg('silencieux', false);
const say = (s) => { if (!mut) console.log(s); };
if (existsSync(fichierEtat(n))) {
  const e = JSON.parse(readFileSync(fichierEtat(n), 'utf8'));
  for (const [nom, pid] of Object.entries(e.pids || {})) {
    const r = spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { encoding: 'utf8' });
    say(`${nom} (pid ${pid}) : ${r.status === 0 ? 'arrete' : 'deja arrete'}`);
  }
} else say("Pas d'etat.json : rien a arreter.");
await sleep(500);
for (const [nom, port] of Object.entries(ports(n))) say(`port ${port} (${nom}) : ${(await portLibre(port)) ? 'libre' : 'ENCORE OCCUPE'}`);
if (arg('effacer', false)) { rmSync(dossier(n), { recursive: true, force: true, maxRetries: 5 }); say('dossier efface'); }
