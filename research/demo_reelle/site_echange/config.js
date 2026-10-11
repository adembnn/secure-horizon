#!/usr/bin/env node
// Recopie, en lecture seule, le fichier d'adresses produit par research/demo_reelle/chain/
// (addresses.local.json) vers ce dossier, pour que le site statique puisse le lire avec un
// simple fetch relatif. Le serveur statique ne sert que ce dossier : on n'y lit jamais chain/.
//
// Ce script NE MODIFIE JAMAIS research/demo_reelle/chain/ : il lit, il écrit une copie ici.
// Il ne garde que les champs utiles au site d'échange (jamais la victime ni le déployeur).
//
// Usage : node config.js            (copie une fois)
//         node config.js --watch    (recopie toutes les 2 s, pratique en démo live, car le
//                                     script de réinitialisation redéploie un drainer à chaque tour)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "..", "chain", "addresses.local.json");
const dst = join(here, "addresses.local.json");
const KEEP = ["chainId", "rpcUrl", "usdc", "wavax", "router", "drainer", "collector"];

function syncOnce() {
  if (!existsSync(src)) {
    console.log("[config] addresses.local.json absent dans chain/ — rien a copier. Deploie d'abord la chaine de demo.");
    return false;
  }
  const full = JSON.parse(readFileSync(src, "utf8"));
  const slim = {};
  for (const k of KEEP) if (full[k] !== undefined) slim[k] = full[k];
  for (const need of ["usdc", "wavax", "router", "drainer", "rpcUrl", "chainId"]) {
    if (slim[need] === undefined) {
      console.log(`[config] champ manquant dans la source : ${need}. Copie ignoree.`);
      return false;
    }
  }
  writeFileSync(dst, JSON.stringify(slim, null, 2) + "\n");
  console.log("[config] addresses.local.json copie depuis chain/ (champs du site uniquement).");
  return true;
}

syncOnce();
if (process.argv.includes("--watch")) {
  console.log("[config] --watch actif : nouvelle copie toutes les 2 s (Ctrl+C pour arreter).");
  setInterval(syncOnce, 2000);
}
