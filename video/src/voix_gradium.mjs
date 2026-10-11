// voix_gradium.mjs : voix definitive par Gradium, un fichier audio par plan. JAMAIS LANCE a ce jour.
//   node --env-file=.env video/src/voix_gradium.mjs --voix=<voice_id> --envoyer
// Sans --envoyer, le script liste seulement ce qu'il enverrait (aucun appel reseau).
//
// Documentation officielle lue le 11 oct. 2026 :
//   https://docs.gradium.ai/guides/text-to-speech-rest
//     POST https://api.gradium.ai/api/post/speech/tts ; en-tetes x-api-key et Content-Type: application/json ;
//     corps JSON : text, voice_id, output_format ("wav"), only_audio (true : la reponse est l'audio brut) ; model_name facultatif.
//   https://docs.gradium.ai/guides/text-to-speech   (formats : pcm, wav, opus)
// NON TROUVE dans ces pages, donc NON code : la liste des voix francaises, et tout reglage de debit ou de style.
// Le voice_id se choisit dans le studio Gradium et se passe en argument. Relire le schema complet
// (https://gradium.ai/api_docs.html) avant le premier appel.
// La cle est lue dans la variable d'environnement GRADIUM_API_KEY (nom provisoire) ; elle n'est ni affichee ni ecrite.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
// Reference complete lue le 11 oct. 2026 : https://docs.gradium.ai/api-reference/endpoint/tts-post
//   (text, voice_id, output_format obligatoires ; only_audio ; json_config = chaine JSON : padding_bonus (debit, positif = plus lent,
//   -4 a 4), temp (0 a 1,4), rewrite_rules ("fr")). Reglages : https://docs.gradium.ai/guides/voice-settings
// Voix francaises : https://docs.gradium.ai/guides/voices/flagship-voices (masculines : Marius, Jules, Gaspard, Damien, Augustin).
// Voix de caractere listees par l'API le 11 oct. 2026 (src/voix_liste.mjs -> essai/voix/gradium_voix.json) : graves, lentes, a silences.
const VOIX = { mordraigne: 'mcnFQKXub9mUu7Kp', alcandre: 'KiLmwQLBITLjM8mj', tourmentin: 'v6aUcAmblZcoIbl7', graoully: 'WPIIsaqRZ3kKsOip', damien: '25AzBFyp6svYnJsj', gaspard: 'iEu63s1rhn_kegTr', marius: 'biuhvu17TxVKOcyy', jules: 'YKeBw3OV1RgpdhLh', augustin: 'Tek4tJXiX6_yvXq7' };
const HERE = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
let plans = JSON.parse(readFileSync(resolve(HERE, args.texte || 'voix_ouverture.json'), 'utf8')).lignes;
if (args.seulement) plans = plans.filter(p => String(args.seulement).split(',').includes(p.id));
const nom = String(args.voix || ''), voice_id = VOIX[nom] || nom;
const lent = args.lent !== undefined ? Number(args.lent) : 0;
const temp = args.temp !== undefined ? Number(args.temp) : null;      // 0 a 1,4 ; defaut du service 0,7 ; plus haut = plus varie
const out = resolve(HERE, args.out || `../essai/voix/gradium_${nom}${lent ? '_lent' + lent : ''}${temp !== null ? '_temp' + temp : ''}`);
if (!args.envoyer) { for (const p of plans) console.log(p.id, '->', p.voix); console.log('Rien envoye. Ajouter --envoyer et --voix=<nom ou voice_id>.'); process.exit(0); }
const KEY = process.env.GRADIUM_API_KEY;
if (!KEY) { console.error('GRADIUM_API_KEY absente des variables d environnement'); process.exit(1); }
if (!voice_id) { console.error('--voix=<nom ou voice_id> obligatoire'); process.exit(1); }
mkdirSync(out, { recursive: true });
for (const p of plans) {
  const f = `${out}/${p.id}.wav`; if (existsSync(f)) { console.log(p.id, 'deja en cache'); continue; }
  const body = { text: p.voix, voice_id, output_format: 'wav', only_audio: true, json_config: JSON.stringify({ rewrite_rules: 'fr', ...(lent ? { padding_bonus: lent } : {}), ...(temp !== null ? { temp } : {}) }) };
  const r = await fetch('https://api.gradium.ai/api/post/speech/tts', { method: 'POST', headers: { 'x-api-key': KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) { console.error(p.id, 'echec HTTP', r.status); process.exit(1); }   // le corps d'erreur n'est pas affiche
  writeFileSync(f, Buffer.from(await r.arrayBuffer())); console.log(p.id, 'ok');
}
