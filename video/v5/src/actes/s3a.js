// actes/s3a.js : SCENE 3a, de T3 a T3B (40,16 a 54,20 s). Hold up ; la question ; la phrase tapee ; Clef la range.
// Voix : h1 « Hold up. » h2 « Une extension. Posée devant ton portefeuille. » h3 « Avant de signer, une question. »
//        h4 « Que veux-tu faire ? » h5 « Tu écris : échanger cinquante dollars. »
// Matiere reelle : la prise de l'extension, images 1 a 43 (commun.js : reel, reelFrame, prise). La scene 3b reprend la meme prise a T3B.
// Un seul proprietaire par fichier. Tout est local a ce bloc : rien ne fuit vers les autres scenes.
'use strict';
(() => {
  const WX = 70, WY = 52, WS = 1.6;       // la fenetre (440 x 520) a l'echelle 1,6 : la vignette que le fondateur refuse
  const CX = 1080, ROW = [300, 420, 540], words = ['échanger', '50 DUSDC', 'contre AVAX'];
  const tChips = L.h5.debut + 2.0, tCmp = L.h7.debut - .5;
  function fenetre(t) {
    X.save(); X.translate(WX, WY + lerp(1100, 0, E.arrive(seg(t, T3 + .1, T3 + .6)))); X.scale(WS, WS);
    prise(reelFrame(t));
    X.strokeStyle = '#808080'; X.lineWidth = 1; X.strokeRect(0, 0, 440, 520);
    X.restore();
  }
  acte({ id: 's3a', draw(t) {
    X.save();
    cam(t, T3, T4, { s0: 1, s1: 1.05, dx: 30, r0: -.004, r1: .005 });      // poussee heritee du plan 3 entier (T3 a T4) : la meme que dans s3b
    // --- a droite : le mecanisme
    if (t > L.h1.debut - .25 && t < L.h3.debut - .3) { slam('Hold up', 1360, 470, 150, t, L.h1.debut - .25); }
    if (t > L.h3.debut - .4 && t < tChips - .2) { const k = clamp((t - (L.h3.debut - .4)) / .25); T('Que veux-tu faire ?', 1360, 470, 72, { a: k * (1 - seg(t, tChips - .5, tChips - .2)) }); }
    // les mots quittent la phrase et vont se ranger (s3b les retrouve poses en CX, ROW[i])
    if (t > tChips) words.forEach((w, i) => { const s = tChips + i * .13, k = E.glisse(seg(t, s, s + .55)); if (t < s) return;
      const x0 = WX + [160, 222, 285][i] * WS, y0 = WY + 107 * WS;
      T(w, lerp(x0, CX, k), lerp(y0, ROW[i], k) - Math.sin(k * Math.PI) * 130, lerp(24, 62, k), { a: 1, stroke: 8 }); });
    if (t > tChips + .9) T(CLEF_S ? `classée par Clef en ${String(CLEF_S).replace('.', ',')} s` : 'classée par Clef', CX, 640, 26, { a: .7 * seg(t, tChips + .9, tChips + 1.1) * (1 - seg(t, tCmp, tCmp + .3)) });
    if (t > tChips + .3) T('ta phrase', CX, 210, 26, { a: .7 * seg(t, tChips + .3, tChips + .5) * (1 - seg(t, tCmp, tCmp + .3)) });
    fenetre(t);
    X.restore();
    legend("Prise réelle de l'extension, rythme ajusté à la voix. Copie locale d'Avalanche, argent fictif (DUSDC, jeton de démonstration).");
  }, blur: t => (t < T3 + .6 || (t > L.h5.debut + 2 && t < L.h5.debut + 2.9)) ? 4 : 1 });

  // ---------- reperes sonores de la scene ----------
  cue(T3 + .1, 'souffle', { d: .5 }); cue(L.h1.debut - .25, 'boum', { g: .7 });
  for (let i = 0; i < 28; i++) cue(L.h5.debut - .7 + i * 2.3 / 28, 'touche', { g: .5 }); for (let i = 0; i < 3; i++) cue(L.h5.debut + 2.0 + i * .13 + .5, 'tic', { g: .9 });
  // ---------- images cles de la scene ----------
  cle('classement', L.h5.debut + 3.1);
})();
