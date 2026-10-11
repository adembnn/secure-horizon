// actes/commun.js : socle partage des scenes qui suivent l'ouverture. LECTURE SEULE pour les scenes : personne n'edite ce fichier
// pendant le travail en parallele. Charge apres film.js (dont il reprend les outils : X, E, pose, seg, lerp, clamp, bez, hash, hand,
// pocketPath, coins, tube, cubic, along, smooth, cutTo, stripedArm, drawBooth, makeField, surfY, LW, Z, L, DUR, W, H, INK, BLK...).
// Les reperes sont les debuts de LIGNES de voix (L.<id>.debut, mesures) ; L.<id>.mots[i].t est estime a +/- 0,15 s. L'image precede le mot.
'use strict';
const UI = '"Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif';       // police du produit (ecrans) ; Montserrat reste la police du film
const CLEF_S = 0.9;             // « Compris par Clef en 0,9 s » : valeur affichee par la vraie fenetre dans la prise reelle (film_ne_correspond_pas_limiter.webm)

// ---------- bornes des scenes : figees, elles viennent de la voix ----------
const T2 = T_END1, T3 = L.h1.debut - .55, T3B = L.h6.debut - .6, T4 = L.k1.debut - .7, T5 = L.r1.debut - .65, T6 = L.m1.debut - .7, T7 = L.f1.debut - .8;
const BORNES = { s2b: [T2, T3], s3a: [T3, T3B], s3b: [T3B, T4], s4: [T4, T5], s5: [T5, T6], s6: [T6, T7], s7: [T7, DUR + 1] };
const T_GANT = L.h9.debut - .5;          // le gant se leve avant « Ca ne correspond pas. »
// zone utile : rien de signifiant sous ZONE.y1 (les sous-titres occupent y 905 a 1012, ligne de base 988, centres) ; mention() va sous eux, en coin
const ZONE = { x0: 60, y0: 40, x1: 1860, y1: 890 };

// ---------- registre : chaque scene s'enregistre ici, avec ses reperes sonores et ses images cles ; actes/index.js assemble ----------
const SCENES = [], SC_CUES = [], SC_CLES = {}, SC_MENACE = [], SC_IMAGES = [];
function acte(o) {               // acte({ id, draw(t), blur(t) }) : a et b sont poses d'apres BORNES[id], ils ne se changent pas
  const b = BORNES[o.id]; if (!b) { console.error('acte : id inconnu ' + o.id); return o; }
  if ((o.a !== undefined && o.a !== b[0]) || (o.b !== undefined && o.b !== b[1])) console.warn('acte ' + o.id + ' : bornes ignorees, celles de la voix font foi');
  o.a = b[0]; o.b = b[1]; if (!o.blur) o.blur = () => 1; SCENES.push(o); return o;
}
const cue = (t, k, o = {}) => { SC_CUES.push({ t, k, ...o }); };          // repere sonore : cue(t, sorte, { g, d, n, pan })
const cle = (nom, t) => { SC_CLES[nom] = +t.toFixed(2); };                // image cle : node render.mjs --stills=cles
const menace = (a, b) => { SC_MENACE.push([a, b]); };                     // tenue grave (sub) entre a et b
const charge = src => { const im = new Image(); im.src = src; SC_IMAGES.push(im); return im; };   // image attendue avant window.ready

// ---------- texte ----------
const tx = (str, x, y, px, o = {}) => { X.font = `${o.w || 700} ${px}px ${o.ui ? UI : 'Montserrat'}`; X.textAlign = o.al || 'center'; X.textBaseline = o.base || 'alphabetic'; X.globalAlpha = (o.a === undefined ? 1 : o.a) * (X.globalAlpha); if (o.stroke) { X.lineJoin = 'round'; X.strokeStyle = BLK; X.lineWidth = o.stroke; X.strokeText(str, x, y); } X.fillStyle = o.c || '#fff'; X.fillText(str, x, y); };
const T = (str, x, y, px, o = {}) => { X.save(); tx(str, x, y, px, o); X.restore(); };
// un mot ou un chiffre qui claque : arrive gros, se pose net
function slam(str, x, y, px, t, t0, o = {}) { if (t < t0) return; const k = E.arrive(seg(t, t0, t0 + .22)), sc = lerp(2.4, 1, k); X.save(); X.translate(x, y); X.scale(sc, sc); X.globalAlpha = clamp((t - t0) / .05); tx(str, 0, 0, px, o); X.restore(); }
const shake = (t, t0, amp = 14) => { const d = t - t0; return d < 0 || d > .5 ? [0, 0] : [amp * Math.exp(-d * 10) * Math.sin(d * 60), amp * .7 * Math.exp(-d * 10) * Math.cos(d * 47)]; };
const flash = (t, t0, a = .55) => { const d = t - t0; if (d >= 0 && d < .12) { X.save(); X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = a * (1 - d / .12); X.fillStyle = '#fff'; X.fillRect(0, 0, W, H); X.restore(); } };
// camera d'acte (ancienne, celle que le fondateur trouve molle : une seule poussee lente sur toute la scene). Preferer mkCam.
function cam(t, a, b, o = {}) { const k = seg(t, a, b), s = lerp(o.s0 || 1, o.s1 || 1.07, k); X.translate(W / 2 + (o.dx || 0) * (k - .5), H / 2 - 30 + (o.dy || 0) * (k - .5)); X.rotate((o.r0 || 0) + ((o.r1 || 0) - (o.r0 || 0)) * k); X.scale(s, s); X.translate(-W / 2, -H / 2 + 30); }
const legend = (str, a = .7, y = 1046) => T(str, 48, y, 21, { al: 'left', a });      // ancienne legende, corps 21 : illisible, ne plus s'en servir

// ---------- le gant du logo (docs/design/system/logo/logo.svg), plein et blanc : Hold up ----------
const G_PAUME = new Path2D('M150 150A38 38 0 0 1 226 150V272A8 8 0 0 0 242 272V122A35 35 0 0 1 312 122V272A8 8 0 0 0 328 272V160A31 31 0 0 1 390 160V330C390 388 350 424 300 424H236C180 424 150 400 150 340Z');
const G_POUCE = new Path2D('M214 388Q122 374 86 282'), G_PLI = new Path2D('M170 322Q206 334 214 378');
function glove(cx, by, size, sx = 1, sy = 1) {     // origine : bas du revers, au centre
  X.save(); X.translate(cx, by); X.scale(size / 512 * sx, size / 512 * sy); X.translate(-270, -446);
  X.translate(11, -56); X.translate(256, 256); X.rotate(8 * Math.PI / 180); X.translate(-256, -256);
  X.fillStyle = '#fff'; X.fill(G_PAUME); X.lineCap = 'round'; X.strokeStyle = '#fff'; X.lineWidth = 70; X.stroke(G_POUCE);
  X.beginPath(); X.roundRect(172, 440, 196, 62, 24); X.fill(); X.strokeStyle = '#000'; X.lineWidth = 16; X.stroke(G_PLI); X.restore();
}
// le geste : il se ramasse, monte d'un trait, s'arrete net, un seul tassement (MOTION.md, etire dans le temps pour le film)
function gloveRise(t, t0, cx, by, size, from = 900) {
  if (t < t0) return; const d = t - t0;
  const y = pose(d, [[0, from], [.07, from + 30, E.arrive], [.26, -size * .045, bez(.7, 0, .9, .5)], [.34, size * .012, E.sec], [.46, 0, E.doux]]);
  const sy = pose(d, [[0, .92], [.07, .88, E.arrive], [.26, 1.07, E.pars], [.34, .975, E.sec], [.46, 1, E.doux]]);
  glove(cx, by + y, size, 2 - sy > 1.08 ? 1.08 : 2 - sy, sy);
}

// ---------- petite poche autonome (pour les actes) ----------
function pk(x, y, sc, o) {
  const z0 = Z; Z = sc; const lw = LW(), wy = o.wy === undefined ? surfY(o.lv === undefined ? 1 : o.lv) - 40 : o.wy, lv = o.lv === undefined ? 1 : o.lv;
  X.save(); X.translate(x, y + (o.jolt || 0)); X.scale(sc, sc); X.globalAlpha *= o.a === undefined ? 1 : o.a;
  pocketPath(0); X.fillStyle = BLK; X.fill(); X.beginPath(); X.roundRect(-PW / 2 - 3, 0, PW + 6, 15, 4); X.fill(); X.strokeStyle = INK; X.lineWidth = lw; X.stroke();
  if (o.hand !== false) {
    const top = o.cordTo || [0, -420]; X.beginPath(); X.moveTo(0, wy - 30); X.quadraticCurveTo((o.bow || 0), wy - 120, top[0], top[1]); X.strokeStyle = INK; X.lineWidth = 4.2; X.globalAlpha *= .6; X.lineCap = 'round'; X.stroke(); X.globalAlpha /= .6;
    tube([[0, wy - 34], [0, wy - 18], [0, wy - 3]], 15, o.seed || 1);
    if (o.knot) { X.beginPath(); X.ellipse(9, wy - 40, 10, 8, -.5, 0, 7); X.strokeStyle = INK; X.lineWidth = 9 + 2 * lw; X.stroke(); X.strokeStyle = BLK; X.lineWidth = 9; X.stroke(); X.beginPath(); X.ellipse(0, 2, 13, 4.5, 0, 0, 7); X.strokeStyle = INK; X.lineWidth = lw * 1.3; X.stroke(); }
  }
  const dive = (o.curl || 0) > .6 && wy > 0 && !o.loot;
  if (o.hand !== false && dive) hand(0, wy, 1.3, o, o.seed || 1);
  coins({ seed: o.seed || 1 }, lv);
  if (o.loot) { X.beginPath(); X.ellipse(1, wy + 38, 24, 16, 0, 0, 7); X.fillStyle = INK; X.fill(); X.strokeStyle = BLK; X.lineWidth = 1.5; X.stroke(); }
  if (o.hand !== false && !dive) hand(0, wy, 1.3, o, o.seed || 1);
  pocketPath(0); X.strokeStyle = INK; X.lineWidth = lw; X.lineJoin = 'round'; X.stroke();
  pocketPath(7); X.setLineDash([5, 5]); X.lineWidth = lw * .5; X.stroke(); pocketPath(12); X.stroke(); X.setLineDash([]);
  X.restore(); Z = z0;
}
// trois essais contre un noeud : rend {wy, strain, curl, jolt, bow} a ajouter
function tries(t, times, f0 = 1) { const S = { wy: 0, strain: 0, curl: .14, jolt: 0, bow: 0 };
  times.forEach((Lg, i) => { const f = f0 * [1, 1.5, 2.1][i % 3]; if (t > Lg - .2 && t < Lg + .5) {
    S.wy = pose(t, [[Lg - .2, 0], [Lg - .05, -5 * f, E.arrive], [Lg + .04, 6 * f, E.pars], [Lg + .17, 6 * f], [Lg + .27, -4 * f, E.doux], [Lg + .46, 0, E.doux]]);
    S.strain = pose(t, [[Lg - .05, 0], [Lg + .04, 4 * f, E.pars], [Lg + .16, 3.7 * f + Math.sin(t * 70) * .5], [Lg + .42, 0, E.arrive]]);
    S.curl = pose(t, [[Lg - .2, .14], [Lg - .05, 0, E.arrive], [Lg + .16, 0], [Lg + .42, .14]]);
    S.jolt = pose(t, [[Lg - .02, 0], [Lg + .05, 5 * f, E.arrive], [Lg + .16, 4.4 * f], [Lg + .4, 0, E.arrive]]);
    S.bow = pose(t, [[Lg - .08, 0], [Lg + .05, 46 * f, E.arrive], [Lg + .16, 42 * f], [Lg + .45, 0, E.doux]]); } });
  return S; }

// ---------- la prise reelle de l'extension : img/reel/f001..f184.jpg (440 x 540, 25 i/s, marge grise a droite et en bas) ----------
// Contenu, lu sur les planches out/planches/reel_1sur8.jpg et reel_transitions.jpg (bornes a une ou deux images pres) :
// 1-8 la fenetre s'ouvre (« Que veux-tu faire ? ») ; 9-43 la phrase « echanger 50 DUSDC contre AVAX » est tapee et « Ce que j'ai compris »
// se remplit (echanger / 50 DUSDC / contre AVAX) ; 44-47 appui sur « Verifier » ; 48-67 « Je compare ta phrase a la demande. » ;
// 68-95 verdict « Ca ne correspond pas a ce que tu as ecrit. Tu as ecrit 50 DUSDC. La demande donne acces a tout ton DUSDC. »,
// « Compris par Clef en 0,9 s », boutons « Annuler » et « Limiter a 50 DUSDC et envoyer » (appui en 95) ;
// 96-115 « C'est parti vers ton portefeuille. Autorisation limitee a 50 DUSDC. J'attends la suite de ton echange. » ;
// 116-141 deuxieme demande du meme echange : « Ca correspond a ce que tu as ecrit. » ; 142-184 « C'est parti vers ton portefeuille. », puis noir.
const REEL = []; for (let i = 1; i <= 184; i++) REEL.push(charge(`img/reel/f${String(i).padStart(3, '0')}.jpg`));
const reel = n => REEL[clamp(Math.round(n), 1, 184) - 1];
function reelFrame(t) {      // numero d'image (1..184) de la prise reelle a l'instant t du film : l'ordre de la prise est conserve, le rythme suit la voix
  const tType = L.h5.debut - .7, tCmp = L.h7.debut - .5, tN = T_GANT + .1, tPress = L.h11.debut + .85;
  if (t >= tPress + 1.9) return Math.min(184, 108 + (t - tPress - 1.9) * 25);
  if (t >= tPress) return Math.min(108, 93 + (t - tPress) * 25);
  if (t >= tN) return Math.min(90, 68 + (t - tN) * 25);
  if (t >= tCmp) return Math.min(60, 44 + (t - tCmp) * 25);
  return pose(t, [[tType, 2], [tType + 2.3, 40, x => x], [tType + 2.6, 43, x => x]]);
}
// dessine l'image n de la prise a l'origine du repere courant, en 440 x 520 (marge grise rognee : source 424 x 501). Contenu jamais retouche.
function prise(n) { const im = reel(n); X.fillStyle = '#000'; X.fillRect(0, 0, 440, 520); if (im && im.complete) X.drawImage(im, 0, 0, 424, 501, 0, 0, 440, 520); }

// ================= outils ajoutes pour la refonte (aucune scene d'origine ne s'en sert : sans effet sur l'equivalence) =================
// camera de monde, meme mathematique que l'ouverture (film.js : camRaw, camAt, camSpeed). keys = [[t, x, y, zoom, courbe], ...] ; roll = t => radians.
// Zoom interpole en logarithme, position qui suit le zoom, moyenne gaussienne sur +/- 0,28 s : aucune vitesse ne s'annule entre deux mouvements.
function mkCam(keys, roll = () => 0) {
  const t0 = keys[0][0], t1 = keys[keys.length - 1][0];
  const raw = t => { let a = keys[0], b = keys[0], k = 0;
    for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { a = keys[i - 1]; b = keys[i]; k = (b[4] || E.doux)(seg(t, a[0], b[0])); break; } else { a = b = keys[i]; }
    const z = Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), k)); let kp = k; if (a[3] !== b[3] && Math.abs(Math.log(b[3] / a[3])) > .5) kp = (1 / z - 1 / a[3]) / (1 / b[3] - 1 / a[3]);
    return { x: lerp(a[1], b[1], kp), y: lerp(a[2], b[2], kp), z }; };
  const at = t => { let x = 0, y = 0, lz = 0, r = 0, ws = 0;
    for (let i = -6; i <= 6; i++) { const w = Math.exp(-i * i / 9), tt = clamp(t + i * .047, t0, t1), c = raw(tt); x += c.x * w; y += c.y * w; lz += Math.log(c.z) * w; r += roll(tt) * w; ws += w; }
    return { x: x / ws, y: y / ws, z: Math.exp(lz / ws), r: r / ws }; };
  const speed = t => { const a = at(t - .5 / FPS), b = at(t + .5 / FPS); return Math.hypot(b.x - a.x, b.y - a.y) * b.z + Math.abs(Math.log(b.z / a.z)) * 900; };   // pixels par image
  // pose le repere : le point (c.x, c.y) du monde vient au centre de l'image (un peu au-dessus, pour laisser les sous-titres). Regle aussi Z (epaisseur des traits).
  const apply = (t, dx = 0, dy = 0) => { const c = at(t); Z = c.z; X.translate(W / 2 + dx, H / 2 - 30 + dy); X.rotate(c.r); X.scale(c.z, c.z); X.translate(-c.x, -c.y); return c; };
  return { raw, at, speed, apply, blur: t => flou(speed(t)) };
}
const flou = v => v > 14 ? 6 : v > 2.5 ? 4 : 1;      // nombre de sous-images selon la vitesse en pixels par image (regle de l'ouverture)
const tMot = (id, i) => L[id].mots[i].t;              // debut estime du i-eme mot de la ligne id (+/- 0,15 s)
// un mot qui arrive avec de la masse : il tombe gros, s'ecrase, rebondit court, se pose. Aucun fondu. o comme tx (+ o.de : echelle de depart).
function frappe(str, x, y, px, t, t0, o = {}) { if (t < t0) return; const d = t - t0;
  const s = pose(d, [[0, o.de || 2.6], [.13, .94, bez(.5, 0, .9, .6)], [.2, 1.05, E.sec], [.34, 1, E.doux]]), sq = pose(d, [[.11, 0], [.14, 1, E.sec], [.24, -.25, E.doux], [.36, 0, E.doux]]);
  X.save(); X.translate(x, y); X.scale(s * (1 + .09 * sq), s * (1 - .13 * sq)); tx(str, 0, 0, px, o); X.restore(); }
// mention d'honnetete : une ligne nue, coin bas gauche, sous les sous-titres, corps 34 (« Prise réelle de l'extension », « maquette de l'écran »)
const mention = (str, a = .7) => T(str, 48, 1060, 34, { al: 'left', a });
// raccord fouette entre deux scenes : la sortante accelere pendant RACC s avant sa borne, l'entrante arrive de l'oppose et se pose en RACC s.
// dir = sens dans lequel l'IMAGE defile : 'g' gauche, 'd' droite, 'h' haut, 'b' bas. RACCORDS dit le sens convenu a chaque borne. Rend [dx, dy] a translater.
const RACC = .3, RACCORDS = { T2: 'g', T3: 'h', T3B: 'g', T4: 'g', T5: 'h', T6: 'd', T7: 'b' };
const VEC = { g: [-1, 0], d: [1, 0], h: [0, -1], b: [0, 1] };
const fouetOut = (t, b, dir) => { const k = E.pars(seg(t, b - RACC, b)), v = VEC[dir]; return [v[0] * k * W * 1.15, v[1] * k * H * 1.15]; };
const fouetIn = (t, a, dir) => { const k = 1 - E.arrive(seg(t, a, a + RACC)), v = VEC[dir]; return [-v[0] * k * W * 1.15, -v[1] * k * H * 1.15]; };
const enFouet = (t, a, b) => t < a + RACC || t > b - RACC;       // vrai pendant un raccord : rendre alors blur >= 6
