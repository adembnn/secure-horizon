// acts.js : plans 2b a 7 du film. Charge apres film.js (memes outils : X, E, pose, hand, pocketPath, coins, stripedArm...).
// Chaque acte est une fonction du temps ; les reperes sont les debuts de LIGNES de voix (mesures). L'image precede toujours le mot.
'use strict';
const UI = '"Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif';       // police du produit (ecrans) ; Montserrat reste la police du film
const CLEF_S = 0.9;             // « Compris par Clef en 0,9 s » : valeur affichee par la vraie fenetre dans la prise reelle (film_ne_correspond_pas_limiter.webm)
const MAQUETTE = false;          // passe a false quand la prise reelle de l'extension remplace les ecrans dessines
const T2 = T_END1, T3 = L.h1.debut - .55, T4 = L.k1.debut - .7, T5 = L.r1.debut - .65, T6 = L.m1.debut - .7, T7 = L.f1.debut - .8;
const tx = (str, x, y, px, o = {}) => { X.font = `${o.w || 700} ${px}px ${o.ui ? UI : 'Montserrat'}`; X.textAlign = o.al || 'center'; X.textBaseline = o.base || 'alphabetic'; X.globalAlpha = (o.a === undefined ? 1 : o.a) * (X.globalAlpha); if (o.stroke) { X.lineJoin = 'round'; X.strokeStyle = BLK; X.lineWidth = o.stroke; X.strokeText(str, x, y); } X.fillStyle = o.c || '#fff'; X.fillText(str, x, y); };
const T = (str, x, y, px, o = {}) => { X.save(); tx(str, x, y, px, o); X.restore(); };
// un mot ou un chiffre qui claque : arrive gros, se pose net
function slam(str, x, y, px, t, t0, o = {}) { if (t < t0) return; const k = E.arrive(seg(t, t0, t0 + .22)), sc = lerp(2.4, 1, k); X.save(); X.translate(x, y); X.scale(sc, sc); X.globalAlpha = clamp((t - t0) / .05); tx(str, 0, 0, px, o); X.restore(); }
const shake = (t, t0, amp = 14) => { const d = t - t0; return d < 0 || d > .5 ? [0, 0] : [amp * Math.exp(-d * 10) * Math.sin(d * 60), amp * .7 * Math.exp(-d * 10) * Math.cos(d * 47)]; };
const flash = (t, t0, a = .55) => { const d = t - t0; if (d >= 0 && d < .12) { X.save(); X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = a * (1 - d / .12); X.fillStyle = '#fff'; X.fillRect(0, 0, W, H); X.restore(); } };
// camera d'acte : jamais immobile (poussee lente + derive), secousses ajoutees
function cam(t, a, b, o = {}) { const k = seg(t, a, b), s = lerp(o.s0 || 1, o.s1 || 1.07, k); X.translate(W / 2 + (o.dx || 0) * (k - .5), H / 2 - 30 + (o.dy || 0) * (k - .5)); X.rotate((o.r0 || 0) + ((o.r1 || 0) - (o.r0 || 0)) * k); X.scale(s, s); X.translate(-W / 2, -H / 2 + 30); }

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
const T_GANT = L.h9.debut - .5;          // le gant se leve avant « Ca ne correspond pas. »

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
const legend = (str, a = .7, y = 1046) => T(str, 48, y, 21, { al: 'left', a });

// ================= PLAN 2b : l'autorisation que personne ne lit ; une sur trois =================
const A2 = { a: T2, b: T3, draw(t) {
  X.save(); cam(t, T2, T3, { s0: 1, s1: 1.06, dx: -40, r0: .006, r1: -.008 });
  // emplacement reserve : l'ecran d'autorisation du vrai portefeuille (prise du fondateur). Il arrive, personne ne le lit, il est balaye.
  const tOut = L.p2.debut - .25, tIn = T2 + .05;
  if (t < tOut + .4) { const k = E.arrive(seg(t, tIn, tIn + .45)), o = E.pars(seg(t, tOut, tOut + .35));
    X.save(); X.translate(W / 2 + (1 - k) * 1500 - o * 300, 470 - o * 1300); X.rotate((1 - k) * .12 - o * .35);
    X.strokeStyle = INK; X.lineWidth = 3; X.setLineDash([14, 10]); X.beginPath(); X.roundRect(-250, -350, 500, 700, 14); X.fillStyle = BLK; X.fill(); X.stroke(); X.setLineDash([]);
    T('emplacement réservé', 0, -30, 30); T("écran d'autorisation du portefeuille", 0, 14, 24, { a: .7 }); T('prise réelle du fondateur', 0, 48, 24, { a: .7 });
    for (let i = 0; i < 7; i++) { X.globalAlpha = .28; X.fillStyle = INK; X.fillRect(-190, 110 + i * 30, 380 - (i % 3) * 70, 6); } X.globalAlpha = 1;
    X.restore(); }
  // neuf poches : une sur trois a la main libre (illimitee), les autres sont nouees
  const t0 = L.p3.debut - .75, tDim = L.p4.debut - .35;
  if (t > t0) for (let i = 0; i < 9; i++) { const free = i % 3 === 2, s = t0 + i * .055, d = E.arrive(seg(t, s, s + .4));
    const y = lerp(-420, 470, d) + pose(t, [[s + .3, 0], [s + .4, 9, E.arrive], [s + .58, 0, E.doux]]);
    const tap = free && t > tDim ? pose(t, [[tDim + i * .03, 0], [tDim + i * .03 + .1, -22, E.arrive], [tDim + i * .03 + .26, 3, E.pars], [tDim + i * .03 + .4, 0, E.doux]]) : 0;
    pk(165 + i * 199, y + tap, 1.62, { seed: 300 + i, knot: !free, wy: free ? undefined : -8, curl: free ? .14 : .2, a: free ? 1 : lerp(1, .32, E.doux(seg(t, tDim, tDim + .3))) }); }
  const tN = L.p3.debut + .55; const [sx, sy] = shake(t, tN, 10); X.translate(sx, sy);
  slam('34 %', W / 2, 300, 230, t, tN, { stroke: 14 });
  if (t > tN + .5) T("notre mesure, sur un échantillon de blocs d'Avalanche", W / 2, 800, 28, { a: .7 * seg(t, tN + .5, tN + .7) });
  X.restore(); flash(t, tN, .35);
}, blur: t => (t < T2 + .5 || Math.abs(t - (L.p2.debut - .1)) < .3 || (t > L.p3.debut - .75 && t < L.p3.debut + .1)) ? 4 : 1 };

// ================= PLAN 3 : la phrase -> Clef la range -> ce que la demande fait -> comparaison -> verdict =================
const WX = 70, WY = 52, WS = 1.6;       // la fenetre (440 x 540) a l'echelle 1,42
const PHRASE = 'échanger 50 USDC contre AVAX', MAXU = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
const REEL = []; for (let i = 1; i <= 184; i++) { const im = new Image(); im.src = `img/reel/f${String(i).padStart(3, '0')}.jpg`; REEL.push(im); }
function reelFrame(t) {      // numero d'image (1..184) de la prise reelle a l'instant t du film
  const tType = L.h5.debut - .7, tCmp = L.h7.debut - .5, tN = T_GANT + .1, tPress = L.h11.debut + .85;
  if (t >= tPress + 1.9) return Math.min(184, 108 + (t - tPress - 1.9) * 25);
  if (t >= tPress) return Math.min(108, 93 + (t - tPress) * 25);
  if (t >= tN) return Math.min(90, 68 + (t - tN) * 25);
  if (t >= tCmp) return Math.min(60, 44 + (t - tCmp) * 25);
  return pose(t, [[tType, 2], [tType + 2.3, 40, x => x], [tType + 2.6, 43, x => x]]);
}
function fenetre(t) {
  X.save(); X.translate(WX, WY + lerp(1100, 0, E.arrive(seg(t, T3 + .1, T3 + .6)))); X.scale(WS, WS);
  const im = REEL[clamp(Math.round(reelFrame(t)), 1, 184) - 1];
  X.fillStyle = '#000'; X.fillRect(0, 0, 440, 540); if (im && im.complete) X.drawImage(im, 0, 0, 440, 540);
  X.strokeStyle = '#808080'; X.lineWidth = 1; X.strokeRect(0, 0, 440, 540);
  X.restore();
}
const A3 = { a: T3, b: T4, draw(t) {
  const tChips = L.h5.debut + 2.0, tReq = L.h6.debut - .6, tCmp = L.h7.debut - .5, tHit = tCmp + .75, tBig = L.h8.debut - .55, tG = T_GANT, tImp = tG + .27, tBack = L.h10.debut - .3, tFix = L.h11.debut + .95;
  X.save(); const [sx, sy] = shake(t, tImp, 22), [s2x, s2y] = shake(t, tHit, 9); X.translate(sx + s2x, sy + s2y);
  cam(t, T3, T4, { s0: 1, s1: 1.05, dx: 30, r0: -.004, r1: .005 });
  const slow = 1 - .0 * seg(t, tG - .5, tG);
  // --- a droite : le mecanisme
  const CX = 1080, RX = 1600, ROW = [300, 420, 540], words = ['échanger', '50 DUSDC', 'contre AVAX'];
  if (t > L.h1.debut - .25 && t < L.h3.debut - .3) { slam('Hold up', 1360, 470, 150, t, L.h1.debut - .25); }
  if (t > L.h3.debut - .4 && t < tChips - .2) { const k = clamp((t - (L.h3.debut - .4)) / .25); T('Que veux-tu faire ?', 1360, 470, 72, { a: k * (1 - seg(t, tChips - .5, tChips - .2)) }); }
  // les mots quittent la phrase et vont se ranger
  if (t > tChips) words.forEach((w, i) => { const s = tChips + i * .13, k = E.glisse(seg(t, s, s + .55)); if (t < s) return;
    const x0 = WX + [160, 222, 285][i] * WS, y0 = WY + 107 * WS;
    let x = lerp(x0, CX, k), y = lerp(y0, ROW[i], k) - Math.sin(k * Math.PI) * 130, px = lerp(24, 62, k), a = 1;
    if (i === 1) { // « 50 USDC » va se mesurer a la demande
      const kc = E.glisse(seg(t, tCmp, tHit)), back = pose(t, [[tHit, 0], [tHit + .16, 1, E.arrive]]); x = lerp(x, 1150, kc) - back * 70;
      const kb = E.arrive(seg(t, tBig, tBig + .5)); x -= kb * 150; px = lerp(px, 44, kb); const kr = E.arrive(seg(t, tBack, tBack + .4)); x = lerp(x, 1010, kr); px = lerp(px, 84, kr); y = lerp(y, 450, kr);
    } else { a = (1 - .75 * E.doux(seg(t, tCmp, tCmp + .4))) * (1 - E.doux(seg(t, tBig - .2, tBig + .1))); }
    T(w, x, y, px, { a, stroke: 8 }); });
  if (t > tChips + .9 && t < tBig) T(CLEF_S ? `classée par Clef en ${String(CLEF_S).replace('.', ',')} s` : 'classée par Clef', CX, 640, 26, { a: .7 * seg(t, tChips + .9, tChips + 1.1) * (1 - seg(t, tCmp, tCmp + .3)) });
  if (t > tChips + .3 && t < tCmp + .3) T('ta phrase', CX, 210, 26, { a: .7 * seg(t, tChips + .3, tChips + .5) * (1 - seg(t, tCmp, tCmp + .3)) });
  // la demande du site, lue telle qu'elle est : approve(site, 2^256 - 1). Le nombre defile, puis devient « TOUT ».
  if (t > tReq && t < tReq + 1.7) { const k = seg(t, tReq, tReq + 1.5); X.save(); X.beginPath(); X.rect(770, 0, 1150, 1080); X.clip();
    T('approve( app.neve.exchange, ' + MAXU + ' )', 1920 - E.glisse(k) * 4300, 300, 58, { al: 'left', ui: true, w: 600, a: 1 - seg(t, tReq + 1.45, tReq + 1.7) }); X.restore(); }
  if (t > tReq + .2 && t < tCmp + .3) T('la demande du site', RX, 210, 26, { a: .7 * seg(t, tReq + .2, tReq + .4) * (1 - seg(t, tCmp, tCmp + .3)) });
  const tT = tReq + 1.4;
  if (t > tT) { const kc = E.glisse(seg(t, tCmp, tHit)), back = pose(t, [[tHit, 0], [tHit + .16, 1, E.arrive]]), kb = E.arrive(seg(t, tBig, tBig + .6)), kf = seg(t, tFix, tFix + .28);
    let x = lerp(RX, 1420, kc) + back * 60 - kb * 60, px = lerp(130, 470, kb) * (1 + .012 * Math.sin(t * 9) * kb), y = lerp(420, 560, kb);
    const kr = E.arrive(seg(t, tBack, tBack + .4)); x = lerp(x, 1690, kr); px = lerp(px, 130, kr); y = lerp(y, 450, kr);
    const sq = Math.sin(kf * Math.PI);
    X.save(); X.translate(x, y); X.scale(1 + sq * .25 - kf * 0, 1 - sq * .5); const a = t >= tFix + .14 ? 1 : 1;
    if (kf < .5) { if (t < tT + .25) slam('TOUT', 0, 0, px, t, tT, { stroke: 12 }); else tx('TOUT', 0, 0, px, { stroke: 12 }); } else tx('50 DUSDC', 0, 0, 84, { stroke: 10 });
    X.restore(); }
  // le gant : entree rapide, arret net, impact. Il se pose entre ce que tu as ecrit et ce que la demande donne.
  if (t > tG) { const down = E.pars(seg(t, tFix + .5, tFix + .95)); const kr = E.arrive(seg(t, tBack, tBack + .45));
    X.save(); X.translate(0, down * 1200); gloveRise(t, tG, lerp(1540, 1350, kr), lerp(900, 610, kr), lerp(720, 300, kr), 1100); X.restore(); }
  if (t > tBack + .2 && t < tFix) { T('tu as écrit', 1010, 330, 26, { a: .7 * seg(t, tBack + .2, tBack + .4) }); T('la demande donne', 1690, 330, 26, { a: .7 * seg(t, tBack + .2, tBack + .4) }); }
  if (t > tFix + .3) T('le droit est ramené à ce que tu as écrit', 1350, 760, 26, { a: .7 * seg(t, tFix + .3, tFix + .5) });
  fenetre(t);
  X.restore();
  flash(t, tImp, .6); flash(t, tFix, .3);
  legend("Prise réelle de l'extension, rythme ajusté à la voix. Copie locale d'Avalanche, argent fictif (DUSDC, jeton de démonstration).");
}, blur: t => (t < T3 + .6 || (t > L.h6.debut - .6 && t < L.h6.debut + .9) || (t > T_GANT && t < T_GANT + .3) || (t > L.h5.debut + 2 && t < L.h5.debut + 2.9)) ? 4 : 1 };

// ================= PLAN 4 : on pirate ce site. Sans / avec. Le seul climax. =================
const FB = { bx: 960, by: 230, id: 9, hacked: false };
const A4 = { a: T4, b: T5, draw(t) {
  const tSlam = L.k1.debut - .15, tL = L.k2.debut - .45, tR = [L.k3.debut - .4, L.k3.debut + .35, L.k3.debut + 1.1], tArr = tL + .95, tOut = L.k4.debut - .2;
  X.save(); const [sx, sy] = shake(t, tSlam, 18), [s2x, s2y] = shake(t, tArr, 12); X.translate(sx + s2x, sy + s2y);
  const kIn = E.arrive(seg(t, T4, T4 + .5)); X.translate((1 - kIn) * 1900, 0);
  cam(t, T4, T5, { s0: 1, s1: 1.06, dy: 30, r0: .008, r1: -.006 });
  const PLx = 520, PRx = 1400, PY0 = 470, SC = 2.25;
  // cordes : du guichet aux deux mains
  const z0 = Z; Z = 1;
  const gone = t > tL + .28, u = gone ? 1 - E.pars(seg(t, tL + .28, tArr)) : 1;
  const SR = tries(t, tR, 1.15), wyR = -8 + SR.wy;
  const cordL = cubic([FB.bx - 60, FB.by + 60], [760, 330], [PLx, 250], [PLx, PY0 - 40], 24), cordR = cubic([FB.bx + 60, FB.by + 60], [1160, 330 + SR.bow], [PRx, 250], [PRx, PY0 + (wyR - 34) * SC], 24);
  X.lineCap = 'round'; X.strokeStyle = INK; X.lineWidth = 6; X.globalAlpha = .6;
  if (u > .01) { smooth(cutTo(cordL, u)); X.stroke(); } smooth(cordR); X.stroke(); X.globalAlpha = 1;
  // le bras raye
  const ty = pose(t, [[tSlam - .5, -700], [tSlam - .22, 30, E.arrive], [tSlam - .12, 0, E.arrive], [tSlam, 232, bez(.7, 0, 1, .5)], [tOut, 232], [tOut + .1, 246, E.arrive], [tOut + .45, -1600, E.pars]]);
  if (t > tSlam - .5) { X.save(); X.beginPath(); X.rect(0, -3000, W, 3000 + FB.by - 112 + 12); X.clip(); stripedArm({ x: FB.bx + 6, y: FB.by - 330 + ty }, 1.5, t, t > tL ? (t - tL) * 160 : 0, 5); X.restore(); }
  X.save(); const sq = pose(t, [[tSlam, 0], [tSlam + .05, 1, E.arrive], [tSlam + .26, -.12, E.doux], [tSlam + .42, 0, E.doux]]); X.translate(FB.bx, FB.by + 108); X.scale(1.5 * (1 + .1 * sq), 1.5 * (1 - .13 * sq)); X.translate(-FB.bx, -FB.by - 108); Z = 1.5; drawBooth(FB, t); X.restore(); Z = z0;
  T("le site d'échange (fictif)", FB.bx + 180, FB.by + 20, 24, { al: 'left', a: .7 });
  // a gauche, sans Hold up : la main prend tout et repart
  const lvL = 1 - E.doux(seg(t, tL + .1, tL + .45)), rest = surfY(1) - 40;
  const wyL = pose(t, [[tL - .2, rest], [tL - .06, rest - 9, E.arrive], [tL + .04, rest + 13, E.pars], [tL + .28, rest + 13]]);
  pk(PLx, PY0, SC, { seed: 71, lv: lvL, hand: !gone, wy: wyL, curl: pose(t, [[tL - .2, .14], [tL - .06, 0, E.arrive], [tL + .05, 1, E.sec]]), cordTo: [0, -30], jolt: pose(t, [[tL + .02, 0], [tL + .07, 8, E.arrive], [tL + .18, -12, E.doux], [tL + .4, 3, E.doux], [tL + .55, 0, E.doux]]), a: 1 - .55 * E.doux(seg(t, tOut, tOut + .4)) });
  if (gone && u > .01) { const q = along(cordL, u); Z = SC; X.beginPath(); X.ellipse(q.x + Math.cos(q.a) * 70, q.y + Math.sin(q.a) * 70, 40, 28, q.a, 0, 7); X.fillStyle = INK; X.fill(); hand(q.x, q.y, 1.3 * SC, { curl: 1, rot: q.a - Math.PI / 2 }, 71); Z = z0; }
  // a droite, avec Hold up : la corde est nouee a 50, la main bute trois fois
  pk(PRx, PY0, SC, { seed: 72, lv: 1, knot: true, wy: wyR, curl: t > tR[2] + .5 ? lerp(.14, .45, E.arrive(seg(t, tR[2] + .5, tR[2] + .8))) : SR.curl, strain: SR.strain, jolt: SR.jolt, rot: t > tR[2] + .5 ? .2 * Math.exp(-(t - tR[2] - .5) * 3.2) * Math.sin((t - tR[2] - .5) * 9.5) : 0, cordTo: [0, -30] });
  T('sans Hold up', PLx, 820, 34, { a: seg(t, T4 + .4, T4 + .6) }); T('avec Hold up', PRx, 820, 34, { a: seg(t, T4 + .4, T4 + .6) });
  // les soldes (preuve_piratage.mjs : sans, 50 puis 0 ; avec, le pirate prend 0)
  if (t < tArr) T('50 DUSDC', PLx - 250, 620, 60, { a: seg(t, T4 + .5, T4 + .7) }); else slam('0', PLx - 250, 640, 150, t, tArr, { stroke: 10 });
  T('50 DUSDC', PRx + 260, 620, 60, { a: seg(t, T4 + .5, T4 + .7) });
  if (t > tR[2] + .6) T('le pirate prend 0', PRx + 260, 670, 28, { a: .8 * seg(t, tR[2] + .6, tR[2] + .8) });
  X.restore(); flash(t, tSlam, .5); flash(t, tArr, .35);
  legend("Preuve rejouée sur une copie locale d'Avalanche, argent fictif (research/demo_reelle/site_echange/test/preuve_piratage.mjs).");
}, blur: t => (t < T4 + .5 || (t > L.k1.debut - .7 && t < L.k1.debut) || (t > L.k2.debut - .3 && t < L.k2.debut + .6) || t > L.k4.debut - .2 && t < L.k4.debut + .3) ? 4 : 1 };

// ================= PLAN 5 : retirer l'autorisation ; le journal =================
const IMG = {}; for (const n of ['panneau', 'retrait', 'apres']) { IMG[n] = new Image(); IMG[n].src = `img/${n}.png`; }
const A5 = { a: T5, b: T6, draw(t) {
  const tPull = L.r3.debut - .55, tJ = L.r4.debut - .6;
  X.save(); const kIn = E.arrive(seg(t, T5, T5 + .5)); X.translate(0, (1 - kIn) * 1200);
  cam(t, T5, T6, { s0: 1.02, s1: 1.09, dx: -50, r0: -.007, r1: .006 });
  const u = 1 - E.pars(seg(t, tPull + .25, tPull + .85)), out = t > tPull + .25, rest = surfY(1) - 40;
  const x0 = lerp(700, 560, E.glisse(seg(t, tJ, tJ + .6)));
  const wy = pose(t, [[tPull, rest], [tPull + .12, rest + 5, E.arrive], [tPull + .25, rest - 24, E.pars]]) - (1 - u) * 330;
  pk(x0, 430, 2.7, { seed: 81, lv: 1, wy, curl: pose(t, [[tPull, .14], [tPull + .2, 0, E.arrive]]), hand: u > .02, cordTo: [0, -420], jolt: pose(t, [[tPull + .25, 0], [tPull + .33, -8, E.arrive], [tPull + .6, 2, E.doux], [tPull + .75, 0, E.doux]]) });
  if (t < tPull) T('un droit trop large : la main est restée dans la poche', x0, 880, 28, { a: .7 * seg(t, T5 + .6, T5 + .8) });
  else T('le droit est remis à zéro : il ne reste rien à utiliser', x0, 880, 28, { a: .7 * seg(t, tPull + .7, tPull + .9) });
  // le vrai panneau de l'extension : l'autorisation ouverte, le retrait en cours, le retrait fait ; chaque decision a sa ligne
  if (t > tJ) { const k = E.arrive(seg(t, tJ, tJ + .55)), w = 360 * 1.22, h = 680 * 1.22, t1 = L.r4.debut + .7, t2 = L.r4.debut + 2.5;
    const im = t >= t2 ? IMG.apres : t >= t1 ? IMG.retrait : IMG.panneau; X.save(); X.translate(1240 + (1 - k) * 900, 60); X.rotate((1 - k) * .06);
    if (im.complete) X.drawImage(im, 0, 0, w, h); X.strokeStyle = '#808080'; X.lineWidth = 1; X.strokeRect(0, 0, w, h);
    X.restore(); T(t >= t2 ? "retirée : une ligne de plus au journal" : 'chaque décision laisse une ligne', 1240 + 220, 935, 28, { a: .7 * seg(t, tJ + .9, tJ + 1.1) }); }
  X.restore();
  legend("Prise réelle : le panneau de l'extension (autorisation, retrait, journal).");
}, blur: t => (t < T5 + .5 || (t > L.r3.debut - .4 && t < L.r3.debut + .4) || (t > L.r4.debut - .6 && t < L.r4.debut)) ? 4 : 1 };

// ================= PLAN 6 : la mesure. 150 demandes dangereuses, 100 honnetes. =================
const M_A = [...Array(150).keys()].sort((a, b) => hash(a, 61) - hash(b, 61)), M_B = [...Array(100).keys()].sort((a, b) => hash(a, 62) - hash(b, 62));
const RANK_A = []; M_A.forEach((idx, r) => RANK_A[idx] = r); const RANK_B = []; M_B.forEach((idx, r) => RANK_B[idx] = r);
function mini(x, y, sc, full, mark, jolt) { X.save(); X.translate(x, y + jolt); X.scale(sc, sc); pocketPath(0); X.fillStyle = full ? INK : BLK; X.fill(); X.strokeStyle = INK; X.lineWidth = 5; X.lineJoin = 'round'; X.stroke();
  if (mark) { X.save(); pocketPath(0); X.clip(); X.strokeStyle = BLK; X.lineWidth = 9; for (let i = -3; i < 4; i++) { X.beginPath(); X.moveTo(-60 + i * 30, 130); X.lineTo(i * 30 + 60, 0); X.stroke(); } X.restore(); } X.restore(); }
const A6 = { a: T6, b: T7, draw(t) {
  const t87 = L.m2.debut - .7, n87 = L.m2.debut + .1, t65 = L.m3.debut - .6, n65 = L.m3.debut + 1.0, t15 = n65 + .9;
  X.save(); const [sx, sy] = shake(t, n87, 12), [s2x, s2y] = shake(t, n65, 12); X.translate(sx + s2x, sy + s2y);
  const kIn = E.arrive(seg(t, T6, T6 + .5)); X.translate(-(1 - kIn) * 1900, 0);
  cam(t, T6, T7, { s0: 1, s1: 1.05, dx: 40, r0: .005, r1: -.005 });
  for (let i = 0; i < 150; i++) { const c = i % 15, r = Math.floor(i / 15), s = T6 + .3 + (c + r) * .028, k = E.arrive(seg(t, s, s + .3)); if (t < s) continue;
    const rk = RANK_A[i], w1 = t87 + (c + r) * .03, w2 = t65 + (c + r) * .025;
    const lost = (rk < 19 && t > w1 + .15) || (rk < 53 && t > w2 + .15);        // 150 - 131 = 19 ratees ; 150 - 97 = 53 sans la phrase
    const jolt = pose(t, [[w1, 0], [w1 + .07, 7, E.arrive], [w1 + .3, 0, E.doux]]) + pose(t, [[w2, 0], [w2 + .07, 7, E.arrive], [w2 + .3, 0, E.doux]]);
    mini(170 + c * 62, 170 + r * 66, .42 * k, !lost, false, jolt); }
  for (let i = 0; i < 100; i++) { const c = i % 10, r = Math.floor(i / 10), s = T6 + .5 + (c + r) * .028, k = E.arrive(seg(t, s, s + .3)); if (t < s) continue;
    const w = t15 + (c + r) * .03, marked = RANK_B[i] < 15 && t > w; mini(1250 + c * 62, 170 + r * 66, .42 * k, true, marked, pose(t, [[w, 0], [w + .07, marked ? 7 : 0, E.arrive], [w + .3, 0, E.doux]])); }
  T('150 demandes dangereuses', 170 + 7 * 62, 130, 28, { a: .8 * seg(t, T6 + .6, T6 + .8) }); T('100 demandes honnêtes', 1250 + 4.5 * 62, 130, 28, { a: .8 * seg(t, T6 + .8, T6 + 1) });
  if (t < n65) slam('87 %', 170 + 7 * 62, 560, 250, t, n87, { stroke: 22 }); else slam('65 %', 170 + 7 * 62, 560, 250, t, n65, { stroke: 22 });
  if (t > n87 + .4) T(t < n65 ? 'signalées, avec la phrase' : 'signalées, sans la phrase', 170 + 7 * 62, 640, 30, { stroke: 8, a: seg(t, (t < n65 ? n87 : n65) + .4, (t < n65 ? n87 : n65) + .6) });
  slam('15 %', 1250 + 4.5 * 62, 520, 170, t, t15 + .5, { stroke: 18 });
  if (t > t15 + .9) { T("d'alertes à tort", 1250 + 4.5 * 62, 580, 30, { stroke: 8 }); T('objectif de 10 % : manqué', 1250 + 4.5 * 62, 622, 30, { stroke: 8 }); }
  X.restore(); flash(t, n87, .35); flash(t, n65, .35);
  legend('moteur de comparaison, jeu aveugle de 250 cas, ouvert une seule fois');
}, blur: t => t < T6 + .5 ? 4 : 1 };

// ================= PLAN 7 : la fin. Le playbook en quatre lignes, le cadre, le gant. =================
const F7 = makeField(40000, 0, 7, false);
const PB = ['Qui est alerté : la personne devant son écran.', "Automatique : l'écart signalé, le droit ramené au montant écrit.", "Humain : annuler, continuer, retirer l'autorisation.", 'Documenté : une ligne de journal par décision.'];
const A7 = { a: T7, b: DUR + 1, draw(t) {
  const tSlam = L.f1.debut - .25, tPB = L.f2.debut - .5, tEnd = L.f3.debut - .55, tG = tEnd + .12;
  if (t < tEnd) {
    X.save(); const [sx, sy] = shake(t, tSlam, 16); X.translate(sx, sy);
    const k = seg(t, T7, tEnd), z = lerp(.5, .62, E.derive(k)); Z = z;
    X.translate(W / 2 + 180 * E.doux(seg(t, tPB - .2, tPB + .6)), H / 2 - 30); X.rotate(lerp(-.02, .015, k)); X.scale(z, z); X.translate(-F7.bx, -F7.by - 90);
    const view = { x0: F7.bx - 2600, x1: F7.bx + 2600, y0: -1600, y1: 1600 };
    // toutes les cordes sont nouees : au coup, une vague les tend, rien ne part
    X.save(); const wv = t - tSlam; if (wv > 0 && wv < 1.2) X.translate(0, 0);
    drawArms(F7, t, view); for (const p of F7.ps) { const w = tSlam + .1 + p.dist / 2600, j = pose(t, [[w, 0], [w + .07, 9, E.arrive], [w + .32, 0, E.doux]]); X.save(); X.translate(0, j); drawPocket(F7, p, t); X.beginPath(); X.arc(p.x + 5, p.y - 16, 9, 0, 7); X.strokeStyle = INK; X.lineWidth = 5; X.stroke(); X.restore(); }
    const ty = pose(t, [[tSlam - .5, -1500], [tSlam - .2, -200, E.arrive], [tSlam - .1, -235, E.arrive], [tSlam, 0, bez(.7, 0, 1, .5)], [tPB - .1, 0], [tPB, 14, E.arrive], [tPB + .4, -2600, E.pars]]);
    if (t > tSlam - .5) { X.save(); X.beginPath(); X.rect(F7.bx - 3000, -6000, 6000, 6000 + F7.by - 112 + 12); X.clip(); stripedArm({ x: F7.bx + 6, y: F7.by - 82 + ty }, 1, t, 0, 7); X.restore(); }
    drawBooth(F7, t); X.restore(); X.restore(); Z = 1;
    if (t > tPB) { X.save(); X.setTransform(1, 0, 0, 1, 0, 0); X.fillStyle = `rgba(6,6,6,${.72 * E.doux(seg(t, tPB, tPB + .4))})`; X.fillRect(0, 0, W, H);
      PB.forEach((s, i) => { const s0 = tPB + .15 + i * .32, kk = E.arrive(seg(t, s0, s0 + .35)); if (t > s0) T(s, 150 - (1 - kk) * 220, 300 + i * 96, 40, { al: 'left', a: kk }); });
      if (t > tPB + 1.5) T('NIST CSF 2.0 : Détecter, Répondre. DE.AE-02, DE.CM-09, RS.MI-01, RS.AN-06. ATT&CK T1657. OWASP ASI01.', 150, 760, 24, { al: 'left', a: .7 * seg(t, tPB + 1.5, tPB + 1.8) });
      X.restore(); }
    flash(t, tSlam, .5);
  } else {
    const [sx, sy] = shake(t, tG + .27, 20); X.save(); X.translate(sx, sy); const k = seg(t, tEnd, DUR), s = 1 + .04 * k; X.translate(W / 2, H / 2); X.scale(s, s); X.translate(-W / 2, -H / 2);
    gloveRise(t, tG, 700, 700, 420, 900);
    if (t > tG + .3) { const kk = E.arrive(seg(t, tG + .3, tG + .6)); T('Hold up', 950 + (1 - kk) * 60, 590, 150, { ui: true, w: 700, al: 'left', a: kk }); }
    X.restore(); flash(t, tG + .27, .5);
  }
}, blur: t => (t < T7 + .4 || (t > L.f1.debut - .8 && t < L.f1.debut) || (t > L.f3.debut - .45 && t < L.f3.debut - .1)) ? 4 : 1 };

const ACTS = [A2, A3, A4, A5, A6, A7];
window.actAt = t => t < T2 ? null : ACTS.find(a => t >= a.a && t < a.b) || A7;
window.actOver = t => { if (t >= T2 - .12 && t < T2) { X.fillStyle = BLK; X.globalAlpha = seg(t, T2 - .12, T2); X.fillRect(0, 0, W, H); X.globalAlpha = 1; } };

// ---------- reperes sonores des actes ----------
(() => { const c = window.CUES.cues, tG = T_GANT;
  const push = (t, k, o = {}) => c.push({ t, k, ...o });
  push(T2 + .05, 'souffle', { d: .45 }); push(L.p2.debut - .25, 'souffle', { d: .35 }); for (let i = 0; i < 9; i++) push(L.p3.debut - .75 + i * .055 + .3, 'toc', { g: .5 });
  push(L.p3.debut + .55 - .7, 'riser', { d: .7 }); push(L.p3.debut + .55, 'boum'); push(L.p4.debut - .3, 'toc', { g: .8 });
  push(T3 + .1, 'souffle', { d: .5 }); push(L.h1.debut - .25, 'boum', { g: .7 });
  for (let i = 0; i < 28; i++) push(L.h5.debut - .7 + i * 2.3 / 28, 'touche', { g: .5 }); for (let i = 0; i < 3; i++) push(L.h5.debut + 2.0 + i * .13 + .5, 'tic', { g: .9 });
  push(L.h6.debut - .6, 'defile', { d: 1.5 }); push(L.h6.debut + .8, 'boum', { g: .6 }); push(L.h7.debut + .25, 'toc', { g: 1 });
  push(L.h8.debut - .55, 'riser', { d: 1.6 }); push(tG - .6, 'silence', { d: .6 }); push(tG + .27, 'boum', { g: 1.3 }); push(L.h11.debut + .85, 'tic', { g: 1 }); push(L.h11.debut + .95, 'boum', { g: .6 });
  push(T4, 'souffle', { d: .5 }); push(L.k1.debut - .65, 'riser', { d: .5 }); push(L.k1.debut - .15, 'boum', { g: 1.2 }); push(L.k2.debut - .4, 'poignee', { n: 0, g: 1 }); push(L.k2.debut + .5, 'boum', { g: .9 });
  [L.k3.debut - .4, L.k3.debut + .35, L.k3.debut + 1.1].forEach((s, i) => push(s + .04, 'bute', { g: [.7, .9, 1.1][i] })); push(L.k4.debut - .2, 'retire'); push(L.k4.debut - .7, 'silence', { d: .5 });
  push(T5, 'souffle', { d: .5 }); push(L.r3.debut - .3, 'retire'); push(L.r4.debut - .6, 'souffle', { d: .5 }); push(L.r4.debut + .3, 'tic', { g: .8 });
  push(T6, 'souffle', { d: .5 }); for (let i = 0; i < 24; i++) push(T6 + .3 + i * .03, 'tic', { g: .25 }); push(L.m2.debut - .6, 'riser', { d: .7 }); push(L.m2.debut + .1, 'boum'); push(L.m3.debut + .3, 'riser', { d: .7 }); push(L.m3.debut + 1.0, 'boum'); push(L.m3.debut + 2.4, 'boum', { g: .7 });
  push(T7, 'souffle', { d: .4 }); push(L.f1.debut - .75, 'riser', { d: .5 }); push(L.f1.debut - .25, 'boum', { g: 1.2 }); for (let i = 0; i < 4; i++) push(L.f2.debut - .35 + i * .32, 'tic', { g: .7 });
  push(L.f3.debut - 1.0, 'silence', { d: .55 }); push(L.f3.debut - .16, 'boum', { g: 1.4 });
  window.CUES.menace = [[0, T2], [T4, T5]]; window.CUES.dur = DUR; c.sort((a, b) => a.t - b.t); })();
window.CLES = { poche: 1.2, coup: +(T_HIT + .05).toFixed(2), vague: +(T_PULL + T_WAVE * .55).toFixed(2), resiste: +(LUNGE[2] + .1).toFixed(2), une_sur_trois: +(L.p4.debut + .3).toFixed(2), classement: +(L.h5.debut + 3.1).toFixed(2), tout: +(L.h8.debut + .6).toFixed(2), gant: +(T_GANT + .5).toFixed(2), limite: +(L.h11.debut + 1.6).toFixed(2), piratage: +(L.k3.debut + .5).toFixed(2), journal: +(L.r4.debut + 1.5).toFixed(2), mesure: +(L.m3.debut + 3).toFixed(2), playbook: +(L.f2.debut + 1.6).toFixed(2), fin: +(DUR - .8).toFixed(2) };
Promise.all([document.fonts.load('700 68px Montserrat'), ...Object.values(IMG).map(i => i.decode().catch(() => 0)), ...REEL.map(i => i.decode().catch(() => 0))]).then(() => { draw(0); window.ready = true; });
