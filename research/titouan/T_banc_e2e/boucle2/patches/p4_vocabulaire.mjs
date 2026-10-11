// boucle2, tour 3 : vocabulaire des mots-clés (extension/intent_text.js). Cause : une phrase claire (« déposer 50 USDC sur Aave »,
// « je laisse Uniswap utiliser 40 DAI », « changer 25 USDT en WETH ») n'est pas comprise, la réponse reste « pas pu vérifier ».
// Source des mots : la moitié RÉGLAGE du panel preuves/panel (conformes laissés « pas pu vérifier »), pas le jeu de contrôle.
//   node patches/p4_vocabulaire.mjs ../extension/intent_text.js
import { readFileSync, writeFileSync } from 'node:fs';
const f = process.argv[2]; let s = readFileSync(f, 'utf8'); const crlf = s.includes('\r\n'); if (crlf) s = s.replace(/\r\n/g, '\n');
const rep = (a, b) => { if (s.split(a).length !== 2) throw new Error('motif attendu une fois : ' + a.slice(0, 60)); s = s.replace(a, () => b); };
rep("|list(er|e|ing)?\\b|offre\\b|offer\\b)/],", "|list(er|e|ing)?\\b|offre\\b|offer\\b|chang(e|er|es|ez|eons)?\\b|depos|deposit|suppl(y|ie)|lend(ing)?\\b|pret(e|er|ez)?\\b|plac(e|er|ez)\\b|stak(e|er|ing)\\b|(mettre|mets|met|put|putting|parking) [^.!?]{0,40}\\b(sur|dans|en depot|into|in|on)\\b)/],");
rep("  grant: /\\b(autoris|approuv|approve|allow|permission|donner (l'|un )?acces|droit de (depenser|prendre|deplacer))/,", "  grant: /\\b(autori[sz]|approuv|approve|allow|permission|donner (l'|un )?acces|droit de (depenser|prendre|deplacer)|laiss\\w* \\S+( \\S+)? (utiliser|depenser|prendre)|let(ting)? \\S+( \\S+)? (spend|use)\\b)/,");
writeFileSync(f, crlf ? s.replace(/\n/g, '\r\n') : s);
console.log('ok');
