// gen.mjs - generateur reproductible (graine fixe) du catalogue d'attaques SYNTHETIQUES.
// Usage : node gen.mjs   (ecrit cases.jsonl, DEV.jsonl, TEST.jsonl, TEST_HASH.txt, scenarios.json, SCENARIOS.md, MANIFEST.json dans ce dossier)
import { writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEED, sha256hex } from './lib.mjs';
import { CASES } from './core.mjs';
import { SCENARIOS, MSG, PLACEHOLDERS } from './scenarios.mjs';
import * as f1 from './fam1.mjs'; import * as f2 from './fam2.mjs'; import * as f3 from './fam3.mjs'; import * as f4 from './fam4.mjs'; import * as f5 from './fam5.mjs'; import * as f6 from './fam6.mjs';

const SRC = dirname(fileURLToPath(import.meta.url));
const DIR = process.env.OUT_DIR || SRC; // OUT_DIR permet a validate.mjs de verifier la reproductibilite sans ecraser les fichiers
export const HELD_OUT_FAMILY = 'eip7702'; // famille entiere tenue hors DEV
for (const f of [f1, f2, f3, f4, f5, f6]) f.run();

// ---- split : niveau 1 famille tenue hors DEV ; niveau 2 sous-famille hachee (1/4) ; niveau 3 cas hache (1/10)
const h32 = (s) => parseInt(sha256hex(`split:${SEED}:${s}`).slice(0, 8), 16);
function splitOf(c) {
  if (c.family === HELD_OUT_FAMILY) return ['TEST', 'famille_tenue_hors_DEV'];
  if (h32(`${c.family}/${c.subfamily}`) % 4 === 0) return ['TEST', 'sous_famille_hachee'];
  if (h32(c.id) % 10 === 0) return ['TEST', 'cas_hache'];
  return ['DEV', 'defaut'];
}
for (const c of CASES) { const [s, why] = splitOf(c); c.split = s; c.split_reason = why; }

const ids = new Set(); for (const c of CASES) { if (ids.has(c.id)) throw new Error('id duplique ' + c.id); ids.add(c.id); }
const sorted = [...CASES].sort((a, b) => (a.id < b.id ? -1 : 1));
const ser = (arr) => arr.map((c) => JSON.stringify(c)).join('\n') + '\n';
const all = ser(sorted); const dev = ser(sorted.filter((c) => c.split === 'DEV')); const test = ser(sorted.filter((c) => c.split === 'TEST'));
writeFileSync(join(DIR, 'cases.jsonl'), all); writeFileSync(join(DIR, 'DEV.jsonl'), dev); writeFileSync(join(DIR, 'TEST.jsonl'), test);
const testHash = sha256hex(test);
writeFileSync(join(DIR, 'TEST_HASH.txt'), `SHA-256 de TEST.jsonl (octets exacts, cas tries par id) :\n${testHash}\n\nnb_cas_TEST=${sorted.filter((c) => c.split === 'TEST').length}\ngraine=${SEED}\nfamille_tenue_hors_DEV=${HELD_OUT_FAMILY}\nRegle : ce fichier est ecrit par gen.mjs AVANT tout usage ; validate.mjs verifie que TEST.jsonl correspond. TEST ne sert qu'a la mesure finale ; ne jamais regler de seuil dessus.\n`);

// ---- scenarios
writeFileSync(join(DIR, 'scenarios.json'), JSON.stringify({ synthetic: true, notice: 'SYNTHETIQUE : scripts pour agents joueurs d\'escroc dans un banc defensif ; adresses/domaines factices', placeholders: PLACEHOLDERS, scenarios: SCENARIOS, pasted_messages: MSG }, null, 2));
let md = '# Scenarios d\'escroc SYNTHETIQUES (8) - scripts bilingues FR/EN pour agents joueurs\n\nUsage defensif uniquement : un agent joue l\'escroc contre un agent-victime protege par la barriere d\'intention. Adresses, domaines et noms sont des PLACEHOLDERS factices (`{ATTACKER_ADDRESS}`, `{FAKE_SITE}`...). Genere par gen.mjs depuis scenarios.mjs.\n\n';
for (const s of SCENARIOS) {
  md += `## ${s.id}. ${s.title_fr} / ${s.title_en}\n\n- Canal : ${s.channel}\n- Persona : ${s.persona}\n- Objectif de transaction : ${s.transaction_goal.primary}\n- Methode du portefeuille : \`${s.transaction_goal.method}\`\n- Repli technique : ${s.transaction_goal.fallback}\n- Familles de cas liees : ${s.transaction_goal.linked_families.join(', ')}\n- Succes : ${s.success}\n- Abandon : ${s.abort}\n${s.note ? '- Note : ' + s.note + '\n' : ''}\n### Dialogue (FR)\n`;
  s.stages.forEach((st, i) => { md += `${i + 1}. [${st.tactic}] ${st.fr}\n`; });
  md += '\n### Dialogue (EN)\n'; s.stages.forEach((st, i) => { md += `${i + 1}. [${st.tactic}] ${st.en}\n`; });
  md += '\n### Reponses aux objections\n'; s.objections.forEach((o) => { md += `- FR "${o.fr}" -> ${o.reply_fr}\n- EN "${o.en}" -> ${o.reply_en}\n`; });
  md += '\n';
}
writeFileSync(join(DIR, 'SCENARIOS.md'), md);

// ---- manifest
const src = ['lib.mjs', 'core.mjs', 'fam1.mjs', 'fam2.mjs', 'fam3.mjs', 'fam4.mjs', 'fam5.mjs', 'fam6.mjs', 'scenarios.mjs', 'gen.mjs'].map((f) => [f, sha256hex(readFileSync(join(SRC, f)))]);
writeFileSync(join(DIR, 'MANIFEST.json'), JSON.stringify({ seed: SEED, n_cases: CASES.length, sha256: { 'cases.jsonl': sha256hex(all), 'DEV.jsonl': sha256hex(dev), 'TEST.jsonl': testHash }, generator_sources: Object.fromEntries(src) }, null, 2));
console.log(`cases=${CASES.length} dev=${CASES.filter((c) => c.split === 'DEV').length} test=${CASES.filter((c) => c.split === 'TEST').length} TEST_HASH=${testHash}`);
