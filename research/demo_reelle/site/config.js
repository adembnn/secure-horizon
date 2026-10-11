#!/usr/bin/env node
// Copie en lecture seule les fichiers d'adresses produits par research/demo_reelle/chain/
// (addresses.local.json, addresses.fuji.json) vers ce dossier, pour que le site statique
// puisse les lire avec un simple fetch relatif (le serveur statique ne sert que ce dossier).
//
// Ce script NE MODIFIE JAMAIS research/demo_reelle/chain/ : il ne fait que lire ses fichiers
// et écrire des copies ici. S'il manque un fichier, il le dit clairement et continue.
//
// Usage : node config.js            (copie local + fuji, ceux qui existent)
//         node config.js --watch    (répète la copie toutes les 2 s, pratique en démo live)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const chainDir = join(here, "..", "chain");
const KINDS = ["local", "fuji"];

function syncOne(kind) {
  const src = join(chainDir, `addresses.${kind}.json`);
  const dst = join(here, `addresses.${kind}.json`);
  if (!existsSync(src)) {
    console.log(`[config] addresses.${kind}.json absent dans chain/ — rien à copier (le site affichera un état "non configuré" pour ce réseau).`);
    return false;
  }
  const raw = readFileSync(src, "utf8");
  // On vérifie juste que c'est du JSON valide avant de le recopier.
  JSON.parse(raw);
  writeFileSync(dst, raw);
  console.log(`[config] addresses.${kind}.json copié depuis chain/.`);
  return true;
}

function syncAll() {
  let any = false;
  for (const kind of KINDS) any = syncOne(kind) || any;
  if (!any) console.log("[config] Aucune adresse trouvée. Lancez d'abord le script de déploiement de l'autre agent (dossier chain/), puis relancez ce script.");
}

syncAll();

if (process.argv.includes("--watch")) {
  console.log("[config] --watch actif : nouvelle copie toutes les 2 s (Ctrl+C pour arrêter).");
  setInterval(syncAll, 2000);
}
