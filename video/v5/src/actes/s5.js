// actes/s5.js : SCENE 5, de T5 a T6 (93,00 a 108,00 s). Retirer une autorisation deja donnee ; le journal.
// Voix : r1 « Tu as déjà donné un droit trop large ? » r2 « Révoquer, ce n'est pas annuler la transaction. »
//        r3 « C'est reprendre l'autorisation. » r4 « Hold up prépare la transaction. Ton portefeuille la signe. »
// Matiere reelle : img/panneau.png (l'autorisation ouverte), img/retrait.png (retrait en cours), img/apres.png (retrait fait), 360 x 680 ;
// img/journal.png (364 x 684, non utilise ici) ; docs/design/system/captures_reelles/ pour les memes ecrans en source.
// Un seul proprietaire par fichier. Tout est local a ce bloc : rien ne fuit vers les autres scenes.
'use strict';
(() => {
  const IMG = {}; for (const n of ['panneau', 'retrait', 'apres']) IMG[n] = charge(`img/${n}.png`);
  acte({ id: 's5', draw(t) {
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
  }, blur: t => (t < T5 + .5 || (t > L.r3.debut - .4 && t < L.r3.debut + .4) || (t > L.r4.debut - .6 && t < L.r4.debut)) ? 4 : 1 });

  // ---------- reperes sonores de la scene ----------
  cue(T5, 'souffle', { d: .5 }); cue(L.r3.debut - .3, 'retire'); cue(L.r4.debut - .6, 'souffle', { d: .5 }); cue(L.r4.debut + .3, 'tic', { g: .8 });
  // ---------- images cles de la scene ----------
  cle('journal', L.r4.debut + 1.5);
})();
