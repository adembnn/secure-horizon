// Vérifie hors ligne un export du journal de Hold up (bouton "Exporter le journal (JSON)" du panneau latéral).
// Usage : node extension/tools/verify_journal.mjs holdup-journal.json
// Code de sortie 0 : la chaîne est cohérente. 1 : une ligne a été changée, retirée au milieu ou déplacée. 2 : fichier illisible.
import { readFileSync } from 'node:fs';
import { verifyChain, parseExport } from '../journal_chain.js';

const file = process.argv[2];
if (!file) { console.error('Usage : node extension/tools/verify_journal.mjs <export.json>'); process.exit(2); }
let chain;
try { chain = parseExport(readFileSync(file, 'utf8')); } catch (e) { console.error('Fichier illisible : ' + e.message); process.exit(2); }
const r = await verifyChain(chain);
console.log(r.checked + ' ligne(s) lue(s).');
if (r.ok) console.log('La chaîne est cohérente : aucune ligne changée, retirée au milieu ou déplacée.');
else { console.log('La chaîne est ROMPUE :'); for (const p of r.problems) console.log(' - ' + p); }
console.log(r.note);
process.exit(r.ok ? 0 : 1);
