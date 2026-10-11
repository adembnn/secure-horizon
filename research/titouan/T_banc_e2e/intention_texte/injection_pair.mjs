// injection_pair.mjs - effet propre d'une injection : la MEME phrase avec et sans consigne hostile (DEV seulement).
// Usage : node intention_texte/injection_pair.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wilson, pct, acceptable, OUTFLOW } from './score_lib.mjs';
import * as BASE from './clf_baseline.mjs';
import * as IMPR from './clf_improved.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const items = readFileSync(join(HERE, 'phrases_dev.jsonl'), 'utf8').split('\n').filter(Boolean).map(JSON.parse).filter((i) => i.truth.injection && i.clean_text);
for (const [name, clf] of [['repli actuel', BASE], ['amelioree', IMPR]]) {
  let cleanOk = 0, flip = 0, rescue = 0, permissive = 0, changed = 0;
  for (const it of items) {
    const a = (await clf.classify(it.clean_text)).type, b = (await clf.classify(it.text)).type;
    const okA = acceptable(it.truth).has(a), okB = acceptable(it.truth).has(b);
    if (okA) cleanOk++;
    if (okA && !okB) flip++;
    if (!okA && okB) rescue++;
    if (a !== b) changed++;
    if (OUTFLOW.has(b) && !OUTFLOW.has(a)) permissive++;
  }
  console.log(name.padEnd(14), 'paires', items.length, '| sans consigne: type juste', cleanOk, '| la consigne FAIT BASCULER un type juste en faux/aucun:', flip, '| type change par la consigne:', changed, '| bascule vers un type qui autorise une sortie de fonds:', permissive, '| corrige par hasard:', rescue);
}
