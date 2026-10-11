// actes/s3b.js : SCENE 3b, de T3B a T4. LE SOMMET DU FILM. Ce que la demande fait vraiment ; la comparaison ; « TOUT » ; le silence ; le gant ;
// le verdict ; le temps affiche ; le clic de la PERSONNE sur « Limiter a 50 DUSDC et envoyer » ; la corde nouee a 50.
// Voix : h6 « Elle lit ce que la demande fait vraiment. » h7 « Et elle compare. » h8 « Le site demande tous tes dollars. »
//        h9 « Ça ne correspond pas. » h10 « Tu as écrit cinquante. La demande donne tout. » h11 « Un geste. Le droit revient à cinquante. »
// UN SEUL MONDE, une camera qui s'y deplace (mkCam, la camera de l'ouverture) :
//   a gauche, tres loin, le guichet du site ; sa demande court le long de sa corde : approve( le site, 2^256 - 1 ), les 78 chiffres ;
//   au centre, l'ecran reel de l'extension (880 x 1040), pose DEVANT la poche : la corde passe derriere lui ;
//   a droite, MA poche, la main du site au bout de la corde ; plus a droite, la mesure : « 50 DUSDC » (ce que j'ai ecrit) contre « TOUT ».
// Matiere reelle, jamais retouchee : la prise de l'extension (images 43 a 112, ordre conserve, rythme cale sur la voix) et, pour le verdict,
// la capture sans perte img/captures/ne_correspond_pas.png (meme ecran que les images 70 a 92 de la prise). Seuls ajouts : traits d'encre, pointeur.
// La demande du site de demonstration est bien un approve illimite (research/demo_reelle/site_echange/app.js, mode « habituel »).
// La limitation n'est PAS automatique : le gant se leve et propose, c'est la personne qui clique.
// Un seul proprietaire par fichier. Tout est local a ce bloc : rien ne fuit vers les autres scenes.
'use strict';
(() => {
  const a = T3B, b = T4, lin = x => x;
  const imN = charge('img/captures/ne_correspond_pas.png');
  const MAXU = '115792089237316195423570985008687907853269984665640564039457584007913129639935';      // 2^256 - 1 : le montant de la demande
  const TXT = 'approve( le site, ' + MAXU + ' )';

  // ---------- le monde ----------
  const K = 880 / 424, SX = -440, SY = -520, sp = (x, y) => [SX + x * K, SY + y * K];      // un pixel de la capture (424 x 501) -> le monde
  const PXc = 800, PYt = -180, PS = 3.6;                                                    // ma poche : haut au centre, echelle
  const EXIT = [440, -300], ENTER = [-440, -300];                                           // la corde entre dans l'ecran a gauche, en ressort a droite
  const BO = { bx: -6300, by: -1100, id: 9, hacked: false }, BSC = 2.4, A0 = [BO.bx + 66 * BSC, BO.by + 36 * BSC];
  const Y50 = 56.8, COL = 1340, YT = 262, LBX = 1205;                                       // la ligne des 50 (unites de poche), la colonne de mesure
  const GI = { x: 9.5, y: -155.5, s: 195.5 };                                               // le gant de la capture reelle : bas du revers, taille (cale sur image)
  function mkPath(pts) { const ls = [0]; for (let i = 1; i < pts.length; i++) ls.push(ls[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const len = ls[ls.length - 1];
    return { len, at(s) { s = clamp(s, 0, len); let i = 1; while (i < pts.length - 1 && ls[i] < s) i++; const k = (s - ls[i - 1]) / Math.max(1e-6, ls[i] - ls[i - 1]);
      return { x: lerp(pts[i - 1][0], pts[i][0], k), y: lerp(pts[i - 1][1], pts[i][1], k), a: Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]) }; } }; }
  const RLp = cubic(A0, [A0[0] + 1700, A0[1] + 560], [-2300, -230], ENTER, 90), RL = mkPath(RLp);

  // ---------- les temps : tous derives de la voix ----------
  const tr0 = a + .42, tArr = L.h6.debut + 1.5, tDrop = tArr + .15, tTap = tArr + 1.15, tV = tArr + .8,
    tU1 = tMot('h7', 2) - .15, tFly = tU1 + .27, tLandW = tFly + .62, tCreep = tLandW + .2, tPl = L.h8.debut - .22, tTout = tMot('h8', 3) - .08,
    tG = T_GANT, tImp = tG + .27, tLandG = tImp + .4, tLu = [L.h9.debut + .52, L.h9.fin + .32, tMot('h10', 3) + .28],
    tU2 = tMot('h10', 3) - .12, tU3 = tMot('h10', 4) - .32, tBump = tMot('h10', 7) - .08, tCirc = L.h10.fin + .66, tCur0 = L.h11.debut - .22, tClick = tMot('h11', 1) + .04,
    tU4 = tMot('h11', 2) - .1, tRel = tMot('h11', 6) - .32, t50 = tMot('h11', 6) - .06, tTry = [t50 + .52, t50 + 1.05];
  // image de la prise reelle a l'instant t (0 = la capture sans perte du verdict). L'ordre de la prise est conserve.
  const frame = t => t >= tClick + .15 ? Math.min(112, 96 + (t - tClick - .15) * 25) : t >= tClick ? 95 : t >= tImp ? 0
    : t >= tV + .16 ? Math.min(60, 48 + (t - tV - .16) * 25) : t >= tV ? 44 + (t - tV) / .16 * 3 : 43;

  // ---------- les deux cameras (coupe franche sur l'impact du gant) ----------
  const rush = []; for (let i = 1; i <= 7; i++) { const k = i / 8, q = RL.at(bez(.45, 0, .4, 1)(k) * RL.len); rush.push([lerp(tr0, tArr, k), q.x + 140, q.y - 55, Math.exp(lerp(Math.log(1.5), Math.log(1.05), k)), lin]); }
  const rollA = t => pose(t, [[a, -.02], [tr0, -.012, E.derive], [lerp(tr0, tArr, .5), -.045, E.glisse], [tArr + .15, .012, E.glisse], [tU1 - .3, 0, E.doux], [tFly, 0], [tLandW, .014, E.glisse], [tPl + .1, .024, E.glisse], [tTout + .15, -.014, E.arrive], [tImp, .02, E.derive]]);
  const rollB = t => pose(t, [[tImp, -.014], [tImp + .5, 0, E.arrive], [tU3 + .15, 0], [tBump - .3, .014, E.glisse], [tCirc - .1, 0, E.glisse], [tRel - .42, 0], [tRel, .016, E.glisse], [b, .024, E.derive]]);
  const camA = mkCam([
    [a, BO.bx + 150, BO.by - 60, 1.55],                           // le guichet du site : sa demande part
    [tr0, A0[0] + 150, A0[1] - 70, 1.5, E.derive],
    ...rush,                                                      // travelling le long de la corde : les 78 chiffres defilent
    [tArr, -130, -10, .8, lin],                                   // plan large : la demande, l'ecran, la poche
    [tU1 - .7, -95, 5, .86, E.derive],
    [tU1 - .2, -12, 135, 1.9, E.glisse],                          // gros plan : « 50 DUSDC », « Je compare ta phrase a la demande. »
    [tFly, -8, 130, 2.0, E.derive],
    [tLandW + .08, 1143, 50, 1.6, E.glisse],                      // la camera suit le mot jusqu'a la poche
    [tPl - .08, 1150, 52, 1.66, E.derive],
    [tPl + .16, 1143, 62, 1.5, E.arrive],                         // la main plonge : recul sec
    [tTout - .04, 1143, 50, 1.62, E.derive],
    [tTout + .12, 1143, 50, 1.48, E.arrive],                      // TOUT : recul sec
    [tTout + .9, 1130, 55, 1.56, E.derive],
    [tG - .25, 905, 120, 2.35, bez(.45, 0, .55, 1)],              // silence : la camera serre sur la main qui se referme
    [tImp, 900, 122, 2.42, E.derive]], rollA);
  const camB = mkCam([
    [tImp, 277, -60, 1.16],                                       // l'impact : l'ecran reel du verdict et la poche
    [tImp + .45, 277, -60, 1.3, E.arrive],
    [L.h9.fin + .1, 245, -72, 1.42, E.derive],
    [tU2 - .7, 285, -8, 1.34, E.glisse],                          // les deux lignes du verdict
    [tU3 + .15, 300, 0, 1.42, E.derive],
    [tBump - .35, 1143, 50, 1.6, E.glisse],                       // « La demande donne tout. »
    [tBump + .4, 1152, 50, 1.66, E.derive],
    [tCirc - .05, 20, 196, 2.3, E.glisse],                        // « Compris par Clef en 0,9 s »
    [tCirc + .3, 22, 200, 2.42, E.derive],
    [tCur0 + .15, -4, 400, 1.95, E.glisse],                       // les deux boutons : « Annuler » reste visible
    [tClick - .03, -4, 404, 2.0, E.derive],
    [tClick + .06, 30, 412, 2.18, E.arrive],                      // le clic
    [tClick + .35, 0, 404, 2.0, E.doux],
    [tU4 - .12, -10, -66, 1.85, E.glisse],                        // « Autorisation limitee a 50 DUSDC. »
    [tRel - .42, -10, -62, 1.92, E.derive],
    [tRel - .02, 1143, 50, 1.6, E.glisse],                        // la corde se noue
    [b - .3, 1152, 54, 1.68, E.derive],
    [b, 1160, 54, 1.7, lin]], rollB);

  // ---------- mesures de texte (une fois, la police est chargee avant le premier dessin) ----------
  let MES = null;
  function mesures() { if (MES) return MES; X.save(); X.font = '700 100px Montserrat';
    const adv = [...TXT].map(ch => X.measureText(ch).width + 5), tot = adv.reduce((p, q) => p + q, 0), fs = 100 * (RL.len - 200) / tot;
    let s = 150; const g = [...TXT].map((ch, i) => { const w = adv[i] * fs / 100, o = { ch, s: s + w / 2 }; s += w; return o; });
    MES = { fs, g, fT: 100 * 640 / X.measureText('TOUT').width, f50: 100 * 640 / X.measureText('50 DUSDC').width }; X.restore(); return MES; }
  const feed = t => { const d = t - (tArr - .1); return d <= 0 ? 0 : 420 * (d - .3 * (1 - Math.exp(-d / .3))); };      // la demande entre dans l'ecran, chiffre apres chiffre

  // ---------- gestes ----------
  const pulse = (t, t0, amp) => t < t0 || t > t0 + .55 ? 0 : amp * pose(t, [[t0 + .02, 0], [t0 + .07, 3, E.arrive], [t0 + .16, -5, E.doux], [t0 + .34, 1.2, E.doux], [t0 + .5, 0, E.doux]]);
  const lunge = (t, t0) => t < t0 - .25 || t > t0 + .55 ? 0 : pose(t, [[t0 - .25, 0], [t0 - .1, -.25, E.arrive], [t0, 1, E.pars], [t0 + .05, 1.03, E.doux], [t0 + .17, -.3, E.arrive], [t0 + .5, 0, E.doux]]);
  // etat de la main du site et de la poche : dans la poche (kin = 1) ou retenue au bord de l'ecran, corde courte (kin = 0)
  function etat(t) {
    const rest = surfY(1) - 40, TR = t > t50 ? tries(t, tTry, .8) : { wy: 0, strain: 0, curl: .14, jolt: 0, bow: 0 };
    let wy, curl, strain, rot = 0;
    if (t < tImp) {
      wy = pose(t, [[tDrop - .25, -62], [tDrop - .1, -70, E.arrive], [tDrop, rest + 8, E.pars], [tDrop + .14, rest - 3, E.doux], [tDrop + .3, rest, E.doux],
        [tTap - .18, rest], [tTap - .04, rest - 2.5, E.arrive], [tTap + .03, rest + .8, E.pars], [tTap + .2, rest, E.arrive],
        [tCreep, rest], [tPl - .2, 24, E.doux], [tPl - .06, 17, E.arrive], [tPl + .08, 74, E.pars], [tPl + .2, 70, E.doux], [tPl + .4, 72, E.doux], [tG - 1, 72], [tG - .45, 66, E.doux]]);
      curl = pose(t, [[tDrop - .25, .3], [tDrop - .1, 0, E.arrive], [tDrop + .1, .14, E.doux], [tCreep, .14], [tCreep + .2, 0, E.doux], [tPl + .3, 0], [tPl + .7, .12, E.doux], [tTout + .5, .15], [tG - .5, .55, E.doux]]);
      strain = pose(t, [[tTap - .18, 0], [tTap - .04, -5, E.arrive], [tTap + .03, 1.5, E.pars], [tTap + .2, 0, E.arrive], [tCreep, 0], [tPl - .2, 3, E.doux], [tPl + .1, 5, E.pars], [tPl + .5, 1, E.doux], [tG - 1.2, 1], [tG - .45, 3.5, E.doux]]);
      if (t > tG - 1) strain += Math.sin(t * 70) * .4 * seg(t, tG - 1, tG - .5);
      if (t > tPl + .25) rot = .1 * Math.sin((t - tPl) * 13) * (1 - seg(t, tTout - .1, tTout + .5));      // elle fouille
    } else { wy = Y50 - 38 + TR.wy; curl = TR.curl; strain = TR.strain; }
    const jolt = pulse(t, tDrop, .8) + pulse(t, tPl + .06, 2.2) + pulse(t, tTout, 1.3) + pulse(t, t50, 1.5) + TR.jolt
      + (t < tImp ? pose(t, [[tG - 1, 0], [tG - .45, -3, E.doux]]) : 7 * Math.exp(-(t - tImp) * 7) * Math.cos((t - tImp) * 26));
    const Win = [PXc, PYt + (wy - 34 + jolt) * PS];
    const lu = tLu.reduce((p, q) => p + lunge(t, q), 0) + 2.1 * lunge(t, tBump), th = .5 + .1 * Math.sin(t * 2.3) + .42 * lu, Lr = 150 + 85 * Math.max(0, lu);
    const Wh = [EXIT[0] + Lr * Math.sin(th), EXIT[1] + Lr * Math.cos(th)], rotH = -.25 - .5 * (th - .5);
    let kin = 1; const d = t - tImp;
    if (t >= tImp && t < tRel) kin = 1 - pose(t, [[tImp, 0], [tImp + .13, 1.12, E.arrive], [tImp + .3, 1, E.doux]]); else if (t >= tRel) kin = E.pars(seg(t, tRel, t50));
    const kc = clamp(kin), W = [lerp(Wh[0], Win[0], kin), lerp(Wh[1], Win[1], kin)], tens = t < tImp ? seg(t, tG - 1, tG - .45) : 0;
    if (t >= tImp && t < tRel) { curl = .25 - .25 * clamp(lu); strain = 3 * Math.max(0, lu); }
    if (t >= tRel && t <= t50) { curl = 0; strain = 3; }
    const rotF = lerp(rotH, rot, kc) + (d > 0 && d < 1.2 ? .5 * Math.exp(-d * 5) * Math.sin(d * 18) : 0);
    const rope = cubic(EXIT, [EXIT[0] + lerp(Lr * .35, 170, kc), EXIT[1] - lerp(18, 240, kc) * (1 - .45 * tens)], [W[0] + TR.bow - lerp(Lr * .2, 0, kc), W[1] - lerp(45, 230, kc)], W, 24);
    return { wy, curl, strain, rot: rotF, jolt, W, kin, rope, knot: t >= tRel - .06, tip: wy + 40 };
  }
  function mainSite(t, S) {      // la main creuse de la plateforme, au bout de sa corde ; le noeud quand le droit est limite
    X.save(); X.translate(S.W[0], S.W[1]); X.rotate(S.rot); X.scale(PS, PS);
    tube([[0, 0], [0, 16], [0, 31]], 15, 7);
    if (S.knot) { const ks = lerp(2.4, 1, E.arrive(seg(t, tRel - .06, tRel + .08))), lw = LW(); X.save(); X.translate(0, -6); X.scale(ks, ks); X.lineCap = 'round';
      X.beginPath(); X.ellipse(9, -1, 10, 8, -.5, 0, Math.PI * 2); X.strokeStyle = INK; X.lineWidth = 15 * .62 + 2 * lw; X.stroke(); X.strokeStyle = BLK; X.lineWidth = 15 * .62; X.stroke();
      X.beginPath(); X.moveTo(-3, -7); X.lineTo(3, 7); X.strokeStyle = INK; X.lineWidth = 15 + 2 * lw; X.stroke(); X.strokeStyle = BLK; X.lineWidth = 15; X.stroke(); X.restore(); }
    hand(0, 34, 1.3, { curl: S.curl, strain: S.strain, rot: 0 }, 7); X.restore();
  }
  function poche(t, c, S) {
    const z0 = Z; Z = c.z * PS; const lw = LW(), loc = () => { X.translate(PXc, PYt + S.jolt * PS); X.scale(PS, PS); };
    X.save(); loc(); pocketPath(0); X.fillStyle = BLK; X.fill(); X.beginPath(); X.roundRect(-PW / 2 - 3, 0, PW + 6, 15, 4); X.fill(); X.strokeStyle = INK; X.lineWidth = lw; X.stroke(); X.restore();
    X.save(); X.lineCap = 'round'; X.lineJoin = 'round'; smooth(jit(S.rope, 77, 1.4)); X.strokeStyle = INK; X.lineWidth = 4.2 * PS; X.globalAlpha = .6; X.stroke(); X.restore();
    X.save(); loc(); coins({ seed: 31 }, 1);
    if (t > tLandW) {            // la ligne des 50 : ce que j'ai ecrit, mesure dans ma poche
      const k = E.arrive(seg(t, tLandW, tLandW + .22)), x1 = 60, x0 = lerp(x1, -PW / 2 - 5, k), p = 1 + 1.6 * Math.max(0, 1 - Math.abs(t - tU2 - .12) / .25) + 1.2 * Math.max(0, 1 - Math.abs(t - t50 - .05) / .3);
      X.setLineDash([7, 5]); X.lineCap = 'butt'; X.beginPath(); X.moveTo(x1, Y50); X.lineTo(x0, Y50); X.strokeStyle = INK; X.lineWidth = lw * .9 * p; X.stroke();
      pocketPath(5.5); X.clip(); X.beginPath(); X.moveTo(x1, Y50); X.lineTo(x0, Y50); X.strokeStyle = BLK; X.lineWidth = lw * 1.1 * p; X.stroke(); X.setLineDash([]); }
    X.restore();
    const inP = S.kin > .55; if (inP) mainSite(t, S);
    X.save(); loc(); pocketPath(0); X.strokeStyle = INK; X.lineWidth = lw; X.lineJoin = 'round'; X.stroke();
    pocketPath(7); X.setLineDash([5, 5]); X.lineWidth = lw * .5; X.stroke(); pocketPath(12); X.stroke(); X.setLineDash([]);
    X.beginPath(); X.ellipse(0, 2, 13, 4.5, 0, 0, Math.PI); X.lineWidth = lw * 1.3; X.stroke(); X.restore();
    if (!inP) mainSite(t, S);
    Z = z0;
  }
  // trait d'encre qui se trace (souligne, pointe) : jamais sur le contenu, toujours dessous ou autour
  function trait(p0, p1, t, t0, o = {}) { if (t < t0 || t > (o.fin || 1e9)) return; const k = E.arrive(seg(t, t0, t0 + (o.d || .16))), n = 10, pts = [];
    for (let i = 0; i <= n; i++) { const u = i / n * k; pts.push([lerp(p0[0], p1[0], u), lerp(p0[1], p1[1], u) + Math.sin(u * Math.PI) * (o.sag || 3) + wob(o.seed || 1, i) * 1.1]); }
    X.save(); X.lineCap = 'round'; X.lineJoin = 'round'; smooth(pts); X.strokeStyle = INK; X.lineWidth = o.lw || 6; X.stroke(); X.restore(); }
  function anneau(x, y, t, t0, r1 = 120) { const d = t - t0; if (d < 0 || d > .4) return; const k = E.arrive(d / .4);       // l'onde d'un appui : inverse ce qu'elle traverse
    X.save(); X.globalCompositeOperation = 'difference'; X.beginPath(); X.ellipse(x, y, lerp(14, r1, k), lerp(10, r1 * .62, k), 0, 0, 7); X.strokeStyle = '#fff'; X.lineWidth = lerp(12, 1.5, k); X.stroke(); X.restore(); }
  const yRise = (d, size, from) => pose(d, [[0, from], [.07, from + 30, E.arrive], [.26, -size * .045, bez(.7, 0, .9, .5)], [.34, size * .012, E.sec], [.46, 0, E.doux]]);
  const sRise = d => pose(d, [[0, .92], [.07, .88, E.arrive], [.26, 1.07, E.pars], [.34, .975, E.sec], [.46, 1, E.doux]]);

  acte({ id: 's3b', draw(t) {
    const zSave = Z, M = mesures();
    const fi = fouetIn(t, a, RACCORDS.T3B), fo = fouetOut(t, b, RACCORDS.T4), s1 = shake(t, tImp, 26), s2 = shake(t, tTout, 18), s3 = shake(t, t50, 11), s4 = shake(t, tClick, 5), s5 = shake(t, tPl + .08, 8);
    const ox = fi[0] + fo[0] + s1[0] + s2[0] + s3[0] + s4[0] + s5[0], oy = fi[1] + fo[1] + s1[1] + s2[1] + s3[1] + s4[1] + s5[1];
    X.save(); X.imageSmoothingQuality = 'high';
    const cam = t < tImp ? camA : camB, c = cam.apply(t, ox, oy), zc = c.z;
    const vw = W * .58 / zc, vh = H * .64 / zc, v = { x0: c.x - vw, x1: c.x + vw, y0: c.y - vh, y1: c.y + vh };
    const S = etat(t);

    // ---- 1. le guichet du site et sa demande, le long de la corde ----
    if (v.x0 < ENTER[0]) {
      X.save(); X.lineCap = 'round'; smooth(RLp); X.strokeStyle = INK; X.lineWidth = 15; X.globalAlpha = .6; X.stroke(); X.restore();
      const fd = feed(t), rev = 300 + Math.max(0, t - (a - .1)) * 4200;
      X.save(); X.font = `700 ${M.fs}px Montserrat`; X.textAlign = 'center'; X.textBaseline = 'alphabetic'; X.fillStyle = '#fff';
      for (const g of M.g) { const s = g.s + fd; if (s > RL.len + 30 || s > rev) continue; const q = RL.at(s); if (q.x < v.x0 - 90 || q.x > v.x1 + 90) continue;
        X.save(); X.translate(q.x, q.y); X.rotate(q.a); X.fillText(g.ch, 0, -M.fs * .3); X.restore();
        const e = s - (RL.len - 46); if (e > 0 && e < 60) { X.save(); X.translate(ENTER[0] - 8, ENTER[1] - M.fs * .62); X.strokeStyle = INK; X.lineWidth = 6; X.lineCap = 'round'; X.globalAlpha = 1 - e / 60;      // un chiffre vient d'etre lu : une etincelle au bord de l'ecran
          for (let j = -1; j <= 1; j++) { X.beginPath(); X.moveTo(-10 - e * .3, j * 46); X.lineTo(-34 - e * .5, j * 66); X.stroke(); } X.restore(); } }
      X.restore();
      if (v.x0 < BO.bx + 600) { X.save(); const sq = pulse(t, a + .12, .012); X.translate(BO.bx, BO.by + 108 * BSC); X.scale(BSC * (1 + sq), BSC * (1 - sq)); X.translate(-BO.bx, -BO.by - 108); Z = zc * BSC; drawBooth(BO, t); X.restore(); Z = zc;
        T('le site', BO.bx, BO.by - 296, 56); }
      if (t > tArr - .2 && t < tU1 - .55) { const k = E.arrive(seg(t, tArr - .2, tArr - .05)); X.save(); X.translate(-930, -425); X.scale(lerp(1.5, 1, k), lerp(1.5, 1, k)); tx('la demande du site', 0, 0, 46); X.restore(); }
    }

    // ---- 2. l'ecran reel de l'extension, pose devant la poche ----
    const ecranVu = v.x1 > SX && v.x0 < -SX && v.y1 > SY && v.y0 < -SY;
    if (ecranVu) {
      X.fillStyle = '#000'; X.fillRect(SX, SY, 880, 1040);
      const f = frame(t), im = f ? reel(f) : imN; if (im && im.complete && im.naturalWidth) X.drawImage(im, 0, 0, 424, 501, SX, SY, 880, 1040);
      X.save(); X.strokeStyle = INK; X.globalAlpha = .5; X.lineWidth = Math.max(2, 2.5 / zc); X.strokeRect(SX, SY, 880, 1040); X.restore();
      const pV = sp(336, 457); anneau(pV[0], pV[1], t, tV, 150);                                                   // appui sur « Verifier » (prise reelle, images 44 a 47)
      trait(sp(172, 311), sp(240, 311), t, tU1, { fin: tFly + .5, lw: 7, seed: 3 });                               // « 50 DUSDC », dans « Ce que j'ai compris »
      trait(sp(213, 289), sp(290, 289), t, tU2, { fin: tBump - .2, lw: 6, seed: 4 });                              // « Tu as ecrit 50 DUSDC. »
      trait(sp(259, 313), sp(372, 313), t, tU3, { fin: tBump - .2, lw: 6, seed: 5 });                              // « ... tout ton DUSDC. »
      trait(sp(103, 251), sp(321, 251), t, L.h9.debut + .28, { fin: tU2 - .5, lw: 7, seed: 6, d: .22 });           // « Ça ne correspond pas a ce que tu as ecrit. »
      if (t > tCirc && t < tClick + .2) { const k = E.arrive(seg(t, tCirc, tCirc + .3)), o = sp(273.5, 340), pts = [];      // « 0,9 s » : le temps affiche par l'extension, entoure a l'encre
        for (let i = 0; i <= 40; i++) { const u = i / 40 * k * 1.12, an = -2.2 + u * Math.PI * 2; pts.push([o[0] + Math.cos(an) * (52 + u * 5) + wob(8, i) * 1.2, o[1] + 2 + Math.sin(an) * (27 + u * 3) + wob(9, i) * 1.2]); }
        X.save(); X.lineCap = 'round'; X.lineJoin = 'round'; smooth(pts); X.strokeStyle = INK; X.lineWidth = 5; X.stroke(); X.restore(); }
      trait(sp(22, 243), sp(246, 243), t, tU4, { fin: 1e9, lw: 6, seed: 7, d: .22 });                              // « Autorisation limitee a 50 DUSDC. »
    }

    // ---- 3. la mesure : « 50 DUSDC » contre « TOUT » ----
    if (v.x1 > 980) {
      const y50w = PYt + Y50 * PS;
      if (t > tCreep && t < t50 + .12) { const yb = PYt + (t < tImp ? clamp(S.tip, Y50, 118) : lerp(118, Y50, E.pars(seg(t, t50 - .1, t50 + .1)))) * PS, x = 1002;      // l'equerre : jusqu'ou va la main
        if (yb - y50w > 3) { X.save(); X.lineCap = 'round'; X.lineJoin = 'round'; X.strokeStyle = INK; X.lineWidth = 6; trace(jit([[x - 14, y50w], [x, y50w], [x, yb], [x - 14, yb]], 21, 1)); X.stroke(); X.restore(); } }
      if (t >= tTout && t < t50 + .02) { const d = t - tTout, br = 1 + .012 * Math.sin(t * 7.3) * seg(d, .4, .8) + (t > tBump ? .1 * Math.exp(-(t - tBump) * 8) * Math.cos((t - tBump) * 22) : 0);
        const rx = (t > tImp ? 46 * Math.exp(-(t - tImp) * 6) * Math.cos((t - tImp) * 28) : 0) + (t > tG - 1 && t < tG ? Math.sin(t * 64) * 2.2 * seg(t, tG - 1, tG - .5) : 0), kc = E.pars(seg(t, t50 - .1, t50));
        X.save(); X.translate(COL + rx, YT); X.scale(br * (1 + .18 * kc), br * (1 - kc)); frappe('TOUT', 0, 0, M.fT, t, tTout); X.restore(); }
      if (t >= t50) { const tr = tTry.reduce((p, q) => p + (t > q && t < q + .4 ? 5 * Math.exp(-(t - q) * 9) * Math.sin((t - q) * 50) : 0), 0); X.save(); X.translate(COL + tr, YT - 26); frappe('50 DUSDC', 0, 0, M.f50, t, t50); X.restore(); }
    }

    // ---- 4. ma poche, la corde, la main du site ----
    if (v.x1 > 420) poche(t, c, S);
    if (t > tArr - .2 && t < tU1 - .55 && v.x1 > 700) { const k = E.arrive(seg(t, tArr - .2, tArr - .05)); X.save(); X.translate(PXc, 350); X.scale(lerp(1.5, 1, k), lerp(1.5, 1, k)); tx('ta poche', 0, 0, 46); X.restore(); }

    // ---- 5. le mot « 50 DUSDC » quitte l'ecran et va se mesurer a la poche ----
    if (t > tU1 + .1 && t < t50) { const p0 = sp(206, 303), k = E.glisse(seg(t, tFly, tLandW)), pop = E.arrive(seg(t, tU1 + .1, tU1 + .24));
      const x = lerp(p0[0], LBX, k), y = lerp(p0[1] - 40 * pop, 46, k) - Math.sin(k * Math.PI) * 150 - (t > tTout ? 18 * Math.exp(-(t - tTout) * 7) * Math.abs(Math.cos((t - tTout) * 16)) : 0);
      const fs = Math.exp(lerp(Math.log(lerp(27, 44, pop)), Math.log(64), k)), sq = pose(t, [[tLandW - .02, 0], [tLandW + .03, 1, E.sec], [tLandW + .14, -.3, E.doux], [tLandW + .28, 0, E.doux]]);
      X.save(); X.translate(x, y); X.scale(1 + .1 * sq, 1 - .14 * sq); tx('50 DUSDC', 0, 0, fs, { stroke: fs * .16 }); X.restore(); }

    // ---- 6. le pointeur de la personne : c'est TOI qui cliques ----
    if (t > tCur0 && t < tU4 + .1) { const k = E.arrive(seg(t, tCur0, tCur0 + .4)), pr = pose(t, [[tClick - .05, 1], [tClick, .82, E.sec], [tClick + .16, 1, E.doux]]), x = lerp(640, 232, k), y = lerp(760, 442, k) - Math.sin(k * Math.PI) * 40;
      anneau(x, y, t, tClick, 190);
      X.save(); X.translate(x, y); X.scale(1.25 * pr, 1.25 * pr); X.lineJoin = 'round'; trace([[0, 0], [0, 58], [14, 45], [25, 68], [35, 63], [25, 41], [43, 41]], true); X.fillStyle = BLK; X.fill(); X.strokeStyle = INK; X.lineWidth = 5; X.stroke(); X.restore();
      T('toi', x + 96, y + 118, 34, { stroke: 8 }); }

    // ---- 7. le gant, apres l'impact : il va se poser sur le gant de l'ecran reel ----
    if (t >= tImp && t < tLandG) { const d = t - tG, k = bez(.6, 0, .2, 1)(seg(t, tImp + .07, tLandG)), sz = Math.exp(lerp(Math.log(860 / zc), Math.log(GI.s), k)), sy = sRise(d);
      glove(lerp(c.x, GI.x, k), lerp(c.y + (935 - 510 + yRise(d, 860, 1000)) / zc, GI.y, k), sz, Math.min(1.08, 2 - sy), sy); }
    X.restore();

    // ---- hors camera : le gant qui se leve, le cadre de lecture, eclairs, mention ----
    X.save(); X.translate(ox, oy);
    if (t >= tG && t < tImp) gloveRise(t, tG, 960, 935, 860, 1000);
    if (t > tr0 + .08 && t < tArr) { const k = E.arrive(seg(t, tr0 + .08, tr0 + .26)), out = E.pars(seg(t, tArr - .3, tArr - .04)), s = lerp(1.9, 1, k), cx = 960 + out * 1300, cy = 468, w = 215 * s, h = 118 * s;      // le cadre de lecture : elle lit
      X.lineCap = 'round'; X.lineJoin = 'round'; X.strokeStyle = INK; X.lineWidth = 9;
      for (const sg of [-1, 1]) { trace(jit([[cx + sg * (w - 34), cy - h], [cx + sg * w, cy - h], [cx + sg * w, cy + h], [cx + sg * (w - 34), cy + h]], 40 + sg, 1.6)); X.stroke(); } }
    X.restore();
    flash(t, tImp, .7); flash(t, tTout, .45); flash(t, t50, .3);
    if (!enFouet(t, a, b) && ((t > tArr && t < tFly + .3) || (t >= tImp && t < tBump - .5) || (t > tCirc - .2 && t < tRel - .25))) mention("Prise réelle de l'extension. DUSDC : jeton de démonstration.");
    Z = zSave;
  }, blur: t => { if (enFouet(t, a, b)) return 6; let n = (t < tImp ? camA : camB).blur(t);
    if (n < 4 && [[tDrop - .2, tDrop + .2], [tFly, tLandW + .1], [tPl - .1, tPl + .3], [tTout, tTout + .22], [tG, tLandG + .1], [tBump - .25, tBump + .3], [tRel, t50 + .25], ...tLu.map(q => [q - .12, q + .22])].some(r => t > r[0] && t < r[1])) n = 4;
    return n; } });

  // ---------- reperes sonores de la scene : un son par evenement visible ----------
  cue(a, 'whoosh', { d: .4 }); cue(tr0, 'defile', { d: tArr - tr0 }); cue(tArr - .1, 'toc', { g: .7 }); cue(tDrop, 'tap'); cue(tDrop + .02, 'boum', { g: .45 });
  for (let i = 0; i < 9; i++) cue(tArr + .25 + i * .15, 'tic', { g: .35 });
  cue(tV, 'touche', { g: .9 }); cue(tU1, 'tic', { g: .9 }); cue(tFly, 'whoosh', { d: .6 }); cue(tLandW, 'toc', { g: 1 }); cue(tCreep, 'etire', { d: .6 });
  cue(tPl + .06, 'poignee', { n: 2, g: 1 }); cue(tPl + .08, 'boum', { g: .7 }); cue(tTout, 'impact', { g: 1.2 }); cue(tTout, 'boum', { g: 1 });
  cue(tTout + .9, 'riser', { d: tG - .5 - tTout - .9 }); cue(tG - 1, 'tension', { d: .5 }); cue(tG - .5, 'silence', { d: .5 });
  cue(tG, 'whoosh', { d: .26 }); cue(tImp, 'impact', { g: 1.4 }); cue(tImp, 'boum', { g: 1.3 }); cue(tLandG, 'toc', { g: .9 });
  tLu.forEach((q, i) => cue(q + .04, 'bute', { g: [.6, .7, .7][i] })); cue(L.h9.debut + .28, 'tic', { g: .8 }); cue(tU2, 'tic', { g: .9 }); cue(tU3, 'tic', { g: .9 });
  cue(tBump - .6, 'whoosh', { d: .5 }); cue(tBump + .04, 'bute', { g: 1.1 }); cue(tBump, 'boum', { g: .7 }); cue(tCirc - .5, 'whoosh', { d: .45 }); cue(tCirc, 'tic', { g: 1 });
  cue(tClick, 'touche', { g: 1.2 }); cue(tClick + .02, 'toc', { g: 1 }); cue(tU4, 'tic', { g: .9 }); cue(tRel - .4, 'whoosh', { d: .4 }); cue(tRel - .04, 'toc', { g: .9 });
  cue(t50, 'impact', { g: 1 }); cue(t50 + .02, 'bute', { g: 1 }); tTry.forEach((q, i) => cue(q + .04, 'bute', { g: [.8, 1][i] })); cue(b - .3, 'whoosh', { d: .35 });
  // ---------- images cles de la scene ----------
  cle('tout', tTout + .5); cle('gant', tImp + .14); cle('limite', tClick + .08);
})();
