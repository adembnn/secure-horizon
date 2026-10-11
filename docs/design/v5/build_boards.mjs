// Builds the v5 reference boards from the REAL surface of the extension (ui/screen.css + ui/screen.js) : a board is the
// product's own code drawn with fixed data, so a board can never drift from what ships.
//   node docs/design/v5/build_boards.mjs
// Output : boards/<n>_<name>.html (one standalone page per state, at the window's inner size), index.html (all boards),
//          canevas.artifact.html (same content without <html>/<head>, ready to be published as an Artifact by the main session).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const UI = resolve(HERE, '..', '..', '..', 'research', 'titouan', 'T_banc_e2e', 'extension', 'ui');
const css = readFileSync(join(UI, 'screen.css'), 'utf8');
const js = readFileSync(join(UI, 'screen.js'), 'utf8');
const { TEXT, answerOf } = await import('file:///' + resolve(UI, '..', 'outcome.js').replace(/\\/g, '/'));

const intent = (model) => ({ text: 'x', clear: true, kind: 'pay_someone', facts: { asked: false, receive: false, grant: false }, model });
const A = { expected: '0x7a3F9c21B04e5D8a1f6C2E90aB4733dE8c15E2b9', actual: '0x7a3F1d88Ce0277aF0b3D9a41F6c20e5B4d19E2b9' };
const q = (extra) => Object.assign({ kind: 'question', title: TEXT.question('app.exemple.org'), placeholder: TEXT.placeholder }, extra);
const a = (verdict, it, leftMs) => Object.assign({ kind: 'answer', leftMs }, answerOf(verdict, it));
const W = 424, H = 501;
const BOARDS = [
  { id: '1_question_vide', name: '1. La question, vide', w: W, h: H, screen: q() },
  { id: '2_question_remplie', name: '2. La question, remplie', w: W, h: H, screen: q({ value: 'payer 20 USDC à Paul' }) },
  { id: '3_verification', name: '3. Vérification', w: W, h: H, screen: q({ value: 'payer 20 USDC à Paul', checking: true }) },
  { id: '4_correspond', name: '4. Correspond', w: W, h: H, screen: a({ level: 'attention', texts: { reel: 'Cette opération envoie 20 USDC à Paul.' } }, intent(true), 0) },
  { id: '5_ne_correspond_pas', name: '5. Ne correspond pas', w: W, h: H, screen: a({ level: 'danger', intent_contradiction: true, texts: { reel: 'Cette signature gratuite laisse app.exemple.org prendre tes 2 480 USDC sans limite de durée.' } }, intent(true), 24000) },
  { id: '6_deux_adresses', name: '6. Ne correspond pas, deux adresses', w: W, h: H, screen: a({ level: 'danger', address_diff: A, texts: { reel: 'Tes 20 USDC partiraient vers 0x7a3F…E2b9, pas vers ton contact.' } }, intent(true), 24000) },
  { id: '7_pas_pu_verifier', name: '7. Pas pu vérifier', w: W, h: H, screen: a({ level: 'unknown', indeterminate: true, texts: { reel: 'Ce message est illisible : je ne peux pas dire ce qu’il autorise.' } }, intent(true), 30000) },
  { id: '8a_question_360', name: '8. À 360 px : la question', w: 360, h: H, screen: q() },
  { id: '8b_ne_correspond_pas_360', name: '8. À 360 px : ne correspond pas', w: 360, h: H, screen: a({ level: 'danger', intent_contradiction: true, texts: { reel: 'Cette signature gratuite laisse app.exemple.org prendre tes 2 480 USDC sans limite de durée.' } }, intent(true), 24000) },
  { id: '8c_deux_adresses_360', name: '8. À 360 px : deux adresses', w: 360, h: H, screen: a({ level: 'danger', address_diff: A, texts: { reel: 'Tes 20 USDC partiraient vers 0x7a3F…E2b9, pas vers ton contact.' } }, intent(true), 24000) },
  { id: '5_sombre', name: 'Thème sombre : ne correspond pas', w: W, h: H, theme: 'dark', screen: a({ level: 'danger', intent_contradiction: true, texts: { reel: 'Cette signature gratuite laisse app.exemple.org prendre tes 2 480 USDC sans limite de durée.' } }, intent(true), 24000) },
];

// The boards freeze the delay (a reference board that counts down would never match its caption).
const boot = (list) => `<script>${js}</script>
<script>(function(){var B=${JSON.stringify(list)};var real=Date.now;var t0=real.call(Date);Date.now=function(){return t0;};
B.forEach(function(b){var root=document.getElementById('b-'+b.id);if(b.theme)root.setAttribute('data-theme',b.theme);
var ui=HoldupScreen.mount(root,{onSubmit:function(){},onCancel:function(){},onContinue:function(){}});ui.show(b.screen,'board');});
if(document.activeElement&&B.length>1)document.activeElement.blur();})();</script>`;
const frame = (b) => `<div class="frame" style="width:${b.w}px;height:${b.h}px"><div id="b-${b.id}" class="hu"${b.theme ? ` data-theme="${b.theme}"` : ''}></div></div>`;

mkdirSync(join(HERE, 'boards'), { recursive: true });
for (const b of BOARDS) {
  writeFileSync(join(HERE, 'boards', b.id + '.html'), `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Hold up v5 : ${b.name}</title>
<style>${css}
html,body{margin:0;height:100%;background:#e9e9e9}body{display:grid;place-items:center}.frame{background:#fff;outline:1px solid #cfcfcf}</style></head>
<body>${frame(b)}${boot([b])}</body></html>
`);
}

const page = `<title>Hold up v5</title>
<style>
/* Layout : a plain wall of boards at the window's real inner size, captions under each, nothing else. */
:root { --wall: #ececec; --wall-ink: #171717; --wall-ink-2: #5c5c5c; --wall-edge: #cfcfcf; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --wall: #1c1c1c; --wall-ink: #ededed; --wall-ink-2: #a3a3a3; --wall-edge: #3a3a3a; color-scheme: dark } }
:root[data-theme="dark"] { --wall: #1c1c1c; --wall-ink: #ededed; --wall-ink-2: #a3a3a3; --wall-edge: #3a3a3a; color-scheme: dark }
body { margin: 0; background: var(--wall); color: var(--wall-ink); font: 15px/1.5 "Segoe UI Variable Text", "Segoe UI", system-ui, -apple-system, sans-serif; }
.wall { padding-block: 32px 48px; padding-inline: 16px; max-width: 1400px; margin: 0 auto; }
.wall h1 { margin: 0; font-size: 24px; font-weight: 400; letter-spacing: -0.01em; }
.wall .lede { margin: 8px 0 32px; max-width: 68ch; color: var(--wall-ink-2); }
.boards { display: flex; flex-wrap: wrap; gap: 40px 32px; align-items: flex-start; }
.board { min-width: 0; max-width: 100%; }
.board figcaption { margin-top: 10px; font-size: 14px; color: var(--wall-ink-2); }
.scroll { max-width: 100%; overflow-x: auto; }
.frame { outline: 1px solid var(--wall-edge); }
${css}
</style>
<div class="wall">
<h1>Hold up v5 : la fenêtre</h1>
<p class="lede">Deux moments : une question en texte libre, puis une réponse. Chaque planche est le code livré de l’extension (ui/screen.css et ui/screen.js) dessiné avec des données fixes, à la taille intérieure de la fenêtre (424 × 501) puis à 360 px. Le délai est figé sur les planches.</p>
<div class="boards">
${BOARDS.map((b) => `<figure class="board" style="margin:0"><div class="scroll">${frame(b)}</div><figcaption>${b.name}</figcaption></figure>`).join('\n')}
</div>
</div>
${boot(BOARDS)}
`;
writeFileSync(join(HERE, 'canevas.artifact.html'), page);
writeFileSync(join(HERE, 'index.html'), '<!doctype html>\n<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>\n' + page + '</body></html>\n');
console.log('boards : ' + BOARDS.length + ' pages + index.html + canevas.artifact.html');
