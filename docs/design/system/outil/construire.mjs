/* Hold up : construit les pages de docs/design/system/ à partir de outil/src/.
 *   node docs/design/system/outil/construire.mjs
 * Sorties : un fichier HTML par écran, components.html, motion.html (feuilles liées), planche.html et motion_planche.html
 * (pages autonomes publiables : pas de doctype, tout le CSS et le script en ligne, aucune ressource externe). */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const write = (p, s) => { writeFileSync(join(root, p), s.replace(/\r\n/g, '\n'), 'utf8'); console.log('écrit', p, s.length); };

// Espaces du français, dans le texte seulement (jamais dans une balise).
const typo = (html) => html.split(/(<[^>]+>)/).map((part) => (part.startsWith('<') ? part : part
  .replace(/ ([?!;])/g, ' $1').replace(/ :/g, ' :').replace(/« /g, '« ').replace(/ »/g, ' »')
  .replace(/(\d) (\d{3})\b/g, '$1 $2').replace(/(\d) (?=[\p{L}])/gu, '$1 '))).join('');

const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
<!-- Le gant : copie de docs/design/system/logo/logo_mono_blanc.svg (main seule ; le pli du pouce est tracé de la couleur du fond, sans masque : moins cher à peindre). L'icône : logo_small.svg. -->
<symbol id="hu-glove" viewBox="0 0 512 512"><g transform="translate(11 -56) rotate(8 256 256)" fill="currentColor" stroke-linecap="round"><path d="M150 150A38 38 0 0 1 226 150V272A8 8 0 0 0 242 272V122A35 35 0 0 1 312 122V272A8 8 0 0 0 328 272V160A31 31 0 0 1 390 160V330C390 388 350 424 300 424H236C180 424 150 400 150 340Z"/><path d="M214 388Q122 374 86 282" fill="none" stroke="currentColor" stroke-width="70"/><rect x="172" y="440" width="196" height="62" rx="24"/><path d="M170 322Q206 334 214 378" fill="none" stroke="var(--hu-page)" stroke-width="16"/></g></symbol>
<symbol id="hu-icon" viewBox="0 0 16 16"><rect width="16" height="16" rx="2.25" fill="#000"/><g fill="#fff"><path d="M4 3.5A1.5 1.5 0 0 1 7 3.5V7.5A.5 .5 0 0 0 8 7.5V2.5A1.5 1.5 0 0 1 11 2.5V7.5A.5 .5 0 0 0 12 7.5V4A1.5 1.5 0 0 1 15 4V9A3 3 0 0 1 12 12H7A3 3 0 0 1 4 9Z"/><path d="M5.6 9.6Q3.4 9.4 2.3 7.6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><rect x="6" y="13" width="7" height="2" rx="1"/></g></symbol>
</svg>`;

// ---- macros
function addr(label, a, b) {
  const x = a.slice(2), y = b.slice(2);
  let groups = '';
  for (let g = 0; g < 10; g++) {
    let cells = '';
    for (let i = 0; i < 4; i++) { const c = x[g * 4 + i], d = c.toLowerCase() !== y[g * 4 + i].toLowerCase(); cells += d ? `<b>${c}</b>` : `<i>${c}</i>`; }
    groups += `<span>${cells}</span>`;
  }
  return `<div class="hu-addr hu-m" style="--hu-i:2"><p class="hu-addr-label">${label}</p><p class="hu-addr-grid hu-num" aria-hidden="true">${groups}</p><span class="hu-sr">${a}</span></div>`;
}
function expand(src) {
  return src.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\[\[win([^\]]*)\]\]/g, (_, s) => {
      const f = s.trim().split(/\s+/).filter(Boolean);
      const out = f.find((x) => ['match', 'mismatch', 'unverifiable'].includes(x));
      const cls = ['hu', 'hu-k', 'hu-win'].concat(f.includes('busy') ? ['hu-is-busy'] : [], f.includes('ready') ? ['hu-is-ready'] : []);
      return `<div class="${cls.join(' ')}"${out ? ` data-outcome="${out}"` : ''}><div class="hu-stage">`;
    })
    .replace(/\[\[\/win\]\]/g, '</div></div>')
    .replace(/\[\[slot ([^|\]]*)\|([^|\]]*)\|([^\]]*)\]\]/g, (_, q, v, st) => `<span class="hu-slot${st ? ' is-' + st : ''}"><span class="hu-slot-q">${q}</span><span class="hu-slot-v">${v}</span></span>`)
    .replace(/\[\[addr ([^|\]]*)\|([^|\]]*)\|([^\]]*)\]\]/g, (_, l, a, b) => addr(l, a, b));
}

// ---- lecture des écrans
const attr = (s, n) => { const m = new RegExp(`\\b${n}="([^"]*)"`).exec(s); return m ? m[1] : ''; };
function parse(file) {
  const src = typo(expand(read(file)));
  const files = [];
  for (const fm of src.matchAll(/<file ([^>]*)>([\s\S]*?)<\/file>/g)) {
    const views = [];
    for (const vm of fm[2].matchAll(/<view ([^>]*)>([\s\S]*?)<\/view>/g)) views.push({ id: attr(vm[1], 'id'), w: attr(vm[1], 'w'), h: attr(vm[1], 'h'), cap: attr(vm[1], 'cap'), body: vm[2].trim() });
    files.push({ name: attr(fm[1], 'name'), title: attr(fm[1], 'title'), section: attr(fm[1], 'section'), views });
  }
  return files;
}
const figure = (v) => `<figure class="pl-view" id="v-${v.id}" style="--w:${v.w}"><figcaption>${v.cap}</figcaption><div class="pl-frame${v.h ? '' : ' pl-frame--auto'}" style="--w:${v.w}${v.h ? ';--h:' + v.h : ''}">\n${v.body}\n</div></figure>`;

const head = (title, css) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${title}</title>
${css.map((c) => `<link rel="stylesheet" href="${c}">`).join('\n')}
</head>
<body class="hu pl">
${SPRITE}
`;
const CSS3 = ['tokens.css', 'components.css', 'motion.css'];
const inlineCss = () => CSS3.map((c) => `/* ==== ${c} ==== */\n` + read(c)).join('\n') + '\nbody { margin: 0; background: var(--hu-page); }\n';

// ---- écrans
const files = parse('outil/src/ecrans.html');
for (const f of files) {
  write(f.name + '.html', head('Hold up ' + f.title, CSS3) + `<h1 class="pl-title">${f.title}</h1>\n<main class="pl-views">\n${f.views.map(figure).join('\n\n')}\n</main>\n</body>\n</html>\n`);
}
const all = new Map(files.flatMap((f) => f.views.map((v) => [v.id, v])));

// ---- composants (deuxième temps : seulement si la source existe)
let kit = '';
if (existsSync(join(root, 'outil/src/components.html'))) {
  kit = typo(expand(read('outil/src/components.html')));
  write('components.html', head('Hold up Composants', CSS3) + kit + '\n</body>\n</html>\n');
}

// ---- planche
const INTRO = `<header>
<h1 class="pl-title">Hold up, le système de design</h1>
<p class="pl-intro">Sobre : du noir, du blanc, deux gris, la police du système en deux graisses. La fenêtre de vérification est noire et son texte est centré. Le gant paraît une seule fois, petit, sur « Ça ne correspond pas ». Tous les écrans sont à leur taille réelle.</p>
</header>`;
let body = '';
for (const f of files) {
  if (f.section) body += `${body ? '</div>\n' : ''}<h2 class="pl-h">${f.section}</h2>\n<div class="pl-views">\n`;
  body += f.views.map(figure).join('\n') + '\n';
}
body += '</div>\n';
const kitBody = kit ? '<h2 class="pl-h">Les pièces, dans tous leurs états</h2>\n' + kit.replace(/<h1[\s\S]*?<\/h1>/, '') : '';
write('planche.html', `<title>Hold up Design system</title>\n<style>\n${inlineCss()}</style>\n${SPRITE}\n<div class="hu pl">\n${typo(INTRO)}\n${body}${kitBody}</div>\n`);

// ---- animations
const mo = typo(read('outil/src/motion.html').replace(/<!--[\s\S]*?-->/g, '')
  .replace(/\[\[demo ([^|\]]*)\|([^|\]]*)\|([^|\]]*)\|([^|\]]*)\|([^|\]]*)\|([^\]]*)\]\]/g, (_, n, w, h, k, t, spec) =>
    `<section class="mo" data-demo="${n}" style="--w:${w}"><div class="mo-head"><h2>${t}</h2><button type="button" class="hu-word" data-replay>Rejouer</button></div><p class="mo-spec">${spec}</p><div class="pl-frame${h ? '' : ' pl-frame--auto'}" style="--w:${w}${h ? ';--h:' + h : ''}"><div class="mo-stage${k ? ' mo-stage--k' : ''}"></div></div></section>`))
  .replace(/\[\[tpl ([^\]]*)\]\]/g, (_, id) => { const v = all.get(id); if (!v) throw new Error('vue inconnue : ' + id); return `<template id="t-${id}">${v.body}</template>\n`; });
const js = read('outil/src/motion.js');
write('motion.html', head('Hold up Animations', CSS3) + mo + `\n<script>\n${js}</script>\n</body>\n</html>\n`);
write('motion_planche.html', `<title>Hold up Animations</title>\n<style>\n${inlineCss()}</style>\n${SPRITE}\n<div class="hu pl">\n${mo}\n</div>\n<script>\n${js}</script>\n`);
