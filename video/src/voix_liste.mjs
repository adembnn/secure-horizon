// voix_liste.mjs : liste les voix de Gradium (catalogue compris) et ecrit video/essai/voix/gradium_voix.json
//   node --env-file=.env video/src/voix_liste.mjs
// Doc lue le 11 oct. 2026 : https://docs.gradium.ai/api-reference/endpoint/get-voices
//   GET https://api.gradium.ai/api/voices/?include_catalog=true&limit=...  en-tete x-api-key.
// Seuls uid, nom, langue, description et etiquettes sont ecrits. La cle n'est ni affichee ni ecrite.
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const KEY = process.env.GRADIUM_API_KEY; if (!KEY) { console.error('GRADIUM_API_KEY absente'); process.exit(1); }
const r = await fetch('https://api.gradium.ai/api/voices/?include_catalog=true&limit=500', { headers: { 'x-api-key': KEY } });
if (!r.ok) { console.error('echec HTTP', r.status); process.exit(1); }
const all = (await r.json()).map(v => ({ uid: v.uid, name: v.name, language: v.language, description: v.description, tags: (v.tags || []).map(t => t.value) }));
const out = resolve(dirname(fileURLToPath(import.meta.url)), '../essai/voix'); mkdirSync(out, { recursive: true });
writeFileSync(`${out}/gradium_voix.json`, JSON.stringify(all, null, 1));
const fr = all.filter(v => /fr/i.test(v.language || '') || /french|fran/i.test((v.description || '') + ' ' + v.tags.join(' ')));
console.log(all.length, 'voix,', fr.length, 'en francais');
for (const v of fr) console.log(v.uid, '|', v.name, '|', v.language, '|', v.tags.join(','), '|', (v.description || '').slice(0, 150));
