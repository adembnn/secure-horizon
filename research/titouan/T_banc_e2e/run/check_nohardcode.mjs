// Contrôle anti-hardcoding : échoue si un fichier modifié/créé par la boucle d'amélioration contient
//  - une adresse 0x + 40 hex littérale, ou un hash 0x + 64 hex,
//  - un identifiant de cas du catalogue (<famille>-NNN) pour une famille existant dans DEV/cases,
//  - une lecture de TEST.jsonl, ou des champs d'étiquette du catalogue (label, expected_severity, ideal_severity, required_signals, blind_to_v3_contract) hors run_loop.mjs.
// Ne lit que les ids de DEV.jsonl (jamais TEST.jsonl).
import { readFileSync } from 'node:fs'; import { dirname, join } from 'node:path'; import { fileURLToPath } from 'node:url';
const H = dirname(fileURLToPath(import.meta.url)), R = join(H, '..');
const FILES = ['run/policy.mjs', 'run/ab.mjs', 'run/show.mjs', 'run/test_policy.mjs', 'engine/src/rules_extra.mjs', 'engine/src/fixes.mjs', 'run/run_loop.mjs'];
const dev = readFileSync(join(R, 'attacks', 'DEV.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const families = [...new Set(dev.map((c) => c.id.replace(/-\d+$/, '')))];
const idRe = new RegExp("(^|[^a-z0-9_])(" + families.join("|") + ")-[0-9]{3}");
let bad = 0; const fail = (f, n, what, l) => { bad++; console.log(`ECHEC ${f}:${n} ${what} : ${l.trim().slice(0, 120)}`); };
for (const f of FILES) {
  const lines = readFileSync(join(R, f), 'utf8').split('\n');
  lines.forEach((l, i) => {
    if (/\b0x[0-9a-fA-F]{40}\b/.test(l)) fail(f, i + 1, 'adresse littérale', l);
    if (/\b0x[0-9a-fA-F]{64}\b/.test(l)) fail(f, i + 1, 'hash littéral', l);
    if (idRe.test(l) && f !== 'run/check_nohardcode.mjs') fail(f, i + 1, 'identifiant de cas du catalogue', l);
    if (f !== 'run/run_loop.mjs' && /TEST\.jsonl|expected_severity|ideal_severity|required_signals|blind_to_v3_contract|\.label\b/.test(l) && !/^\s*\/\//.test(l) && f !== 'run/show.mjs' && f !== 'run/ab.mjs') fail(f, i + 1, 'lecture de champ interdit (étiquette / TEST)', l);
  });
}
// les règles ne doivent pas non plus citer les sous-familles du catalogue
const subs = [...new Set(dev.map((c) => c.subfamily))].filter((s) => s && s.includes('_') && s.length > 12); // noms composites du catalogue (pas les noms de fonctions ABI)
for (const f of ['run/policy.mjs', 'engine/src/rules_extra.mjs']) {
  const t = readFileSync(join(R, f), 'utf8');
  for (const s of subs) if (t.includes(s)) fail(f, 0, 'sous-famille du catalogue citée', s);
}
console.log(bad ? `${bad} violation(s)` : `OK : aucune adresse/hash/id de cas/sous-famille/champ interdit dans ${FILES.length} fichiers (${families.length} familles DEV vérifiées)`);
process.exit(bad ? 1 : 0);
