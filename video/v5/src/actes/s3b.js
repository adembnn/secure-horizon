// actes/s3b.js : SCENE 3b, de T3B a T4 (54,20 a 76,34 s). Ce que la demande fait vraiment ; la comparaison ; « TOUT » ; le gant ; le verdict ; le bouton ; la limite.
// Voix : h6 « Elle lit ce que la demande fait vraiment. » h7 « Et elle compare. » h8 « Le site demande tous tes dollars. »
//        h9 « Ça ne correspond pas. » h10 « Tu as écrit cinquante. La demande donne tout. » h11 « Un geste. Le droit revient à cinquante. »
// Matiere reelle : la prise de l'extension, images 43 a 184 (commun.js : reel, reelFrame, prise) ; img/c-limite.png (ecran « Limiter », non utilise ici).
// Le gant blanc plein du film n'apparait qu'ici (T_GANT) et sur le logo final.
// Un seul proprietaire par fichier. Tout est local a ce bloc : rien ne fuit vers les autres scenes.
'use strict';
(() => {
  const WX = 70, WY = 52, WS = 1.6;       // la fenetre (440 x 520) a l'echelle 1,6 : la vignette que le fondateur refuse
  const MAXU = '115792089237316195423570985008687907853269984665640564039457584007913129639935';      // 2^256 - 1 : le montant de la demande
  const CX = 1080, RX = 1600, ROW = [300, 420, 540], words = ['échanger', '50 DUSDC', 'contre AVAX'];
  const tChips = L.h5.debut + 2.0, tReq = T3B, tCmp = L.h7.debut - .5, tHit = tCmp + .75, tBig = L.h8.debut - .55, tG = T_GANT, tImp = tG + .27, tBack = L.h10.debut - .3, tFix = L.h11.debut + .95;
  function fenetre(t) {
    X.save(); X.translate(WX, WY); X.scale(WS, WS);
    prise(reelFrame(t));
    X.strokeStyle = '#808080'; X.lineWidth = 1; X.strokeRect(0, 0, 440, 520);
    X.restore();
  }
  acte({ id: 's3b', draw(t) {
    X.save(); const [sx, sy] = shake(t, tImp, 22), [s2x, s2y] = shake(t, tHit, 9); X.translate(sx + s2x, sy + s2y);
    cam(t, T3, T4, { s0: 1, s1: 1.05, dx: 30, r0: -.004, r1: .005 });      // poussee heritee du plan 3 entier (T3 a T4) : la meme que dans s3a
    // les trois mots ranges par s3a (poses en CX, ROW[i]) ; « 50 DUSDC » va se mesurer a la demande
    words.forEach((w, i) => { const s = tChips + i * .13, k = E.glisse(seg(t, s, s + .55));
      const x0 = WX + [160, 222, 285][i] * WS, y0 = WY + 107 * WS;
      let x = lerp(x0, CX, k), y = lerp(y0, ROW[i], k) - Math.sin(k * Math.PI) * 130, px = lerp(24, 62, k), a = 1;
      if (i === 1) {
        const kc = E.glisse(seg(t, tCmp, tHit)), back = pose(t, [[tHit, 0], [tHit + .16, 1, E.arrive]]); x = lerp(x, 1150, kc) - back * 70;
        const kb = E.arrive(seg(t, tBig, tBig + .5)); x -= kb * 150; px = lerp(px, 44, kb); const kr = E.arrive(seg(t, tBack, tBack + .4)); x = lerp(x, 1010, kr); px = lerp(px, 84, kr); y = lerp(y, 450, kr);
      } else { a = (1 - .75 * E.doux(seg(t, tCmp, tCmp + .4))) * (1 - E.doux(seg(t, tBig - .2, tBig + .1))); }
      T(w, x, y, px, { a, stroke: 8 }); });
    if (t < tBig) T(CLEF_S ? `classée par Clef en ${String(CLEF_S).replace('.', ',')} s` : 'classée par Clef', CX, 640, 26, { a: .7 * seg(t, tChips + .9, tChips + 1.1) * (1 - seg(t, tCmp, tCmp + .3)) });
    if (t < tCmp + .3) T('ta phrase', CX, 210, 26, { a: .7 * seg(t, tChips + .3, tChips + .5) * (1 - seg(t, tCmp, tCmp + .3)) });
    // la demande du site, lue telle qu'elle est : approve(site, 2^256 - 1). Le nombre defile, puis devient « TOUT ».
    if (t > tReq && t < tReq + 1.7) { const k = seg(t, tReq, tReq + 1.5); X.save(); X.beginPath(); X.rect(770, 0, 1150, 1080); X.clip();
      T('approve( app.neve.exchange, ' + MAXU + ' )', 1920 - E.glisse(k) * 4300, 300, 58, { al: 'left', ui: true, w: 600, a: 1 - seg(t, tReq + 1.45, tReq + 1.7) }); X.restore(); }
    if (t > tReq + .2 && t < tCmp + .3) T('la demande du site', RX, 210, 26, { a: .7 * seg(t, tReq + .2, tReq + .4) * (1 - seg(t, tCmp, tCmp + .3)) });
    const tT = tReq + 1.4;
    if (t > tT) { const kc = E.glisse(seg(t, tCmp, tHit)), back = pose(t, [[tHit, 0], [tHit + .16, 1, E.arrive]]), kb = E.arrive(seg(t, tBig, tBig + .6)), kf = seg(t, tFix, tFix + .28);
      let x = lerp(RX, 1420, kc) + back * 60 - kb * 60, px = lerp(130, 470, kb) * (1 + .012 * Math.sin(t * 9) * kb), y = lerp(420, 560, kb);
      const kr = E.arrive(seg(t, tBack, tBack + .4)); x = lerp(x, 1690, kr); px = lerp(px, 130, kr); y = lerp(y, 450, kr);
      const sq = Math.sin(kf * Math.PI);
      X.save(); X.translate(x, y); X.scale(1 + sq * .25 - kf * 0, 1 - sq * .5);
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
  }, blur: t => ((t > L.h6.debut - .6 && t < L.h6.debut + .9) || (t > T_GANT && t < T_GANT + .3)) ? 4 : 1 });

  // ---------- reperes sonores de la scene ----------
  cue(L.h6.debut - .6, 'defile', { d: 1.5 }); cue(L.h6.debut + .8, 'boum', { g: .6 }); cue(L.h7.debut + .25, 'toc', { g: 1 });
  cue(L.h8.debut - .55, 'riser', { d: 1.6 }); cue(tG - .6, 'silence', { d: .6 }); cue(tG + .27, 'boum', { g: 1.3 }); cue(L.h11.debut + .85, 'tic', { g: 1 }); cue(L.h11.debut + .95, 'boum', { g: .6 });
  // ---------- images cles de la scene ----------
  cle('tout', L.h8.debut + .6); cle('gant', T_GANT + .5); cle('limite', L.h11.debut + 1.6);
})();
