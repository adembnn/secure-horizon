// actes/s5.js : SCENE 5, de T5 a T6. Retirer une autorisation deja donnee ; le journal garde une ligne.
// Voix : r1 « Tu as déjà donné un droit trop large ? » r2 « Révoquer, ce n'est pas annuler la transaction. »
//        r3 « C'est reprendre l'autorisation. » r4 « Hold up prépare la transaction. Ton portefeuille la signe. »
// Idee : la corde de la main qui est dans MA poche passe par le lien « Retirer l'autorisation » du vrai panneau. Un clic : la corde se tend,
// la main est remontee a l'ourlet ; Hold up sort un bordereau, la poche (le portefeuille) le signe, la main repart au guichet, le panneau dit « Retirée ».
// Matiere reelle : img/panneau.png, img/retrait.png, img/apres.png (360 x 680, fond clair), dans cet ordre, jamais retouchees : recadrage et zoom seulement.
// Un seul monde, une camera (mkCam). Tout est local a ce bloc : rien ne fuit vers les autres scenes.
'use strict';
(() => {
  const IMG = {}; for (const n of ['panneau', 'retrait', 'apres']) IMG[n] = charge(`img/${n}.png`);

  // ---------- temps : tout est cale sur les debuts de lignes et de mots de la voix ----------
  const r1 = L.r1.debut, r2 = L.r2.debut, r3 = L.r3.debut, r4 = L.r4.debut;
  const TAP = [T5 + .36, T5 + .6];                          // la main tapote : elle est chez elle
  const tDive = tMot('r1', 6) - .14;                        // « trop large » : elle descend jusqu'au fond
  const tLand = r2 - .28;                                   // le vrai panneau tombe sur la corde avant « Révoquer »
  const tCirc = r2 + .02;                                   // l'encre entoure « Retirer l'autorisation »
  const tAnn = tMot('r2', 4) - .1, tSlash = tAnn + .4, tAnnOut = tSlash + .3;      // « annuler » : le mot tombe, il est barre
  const tClick = r3 - .5;                                   // le clic precede « C'est reprendre »
  const TUG = [r3 + .2, r3 + .68, r3 + 1.16];               // trois tractions : la main remonte a l'ourlet
  const tJ = L.r3.fin + .22, tUnroll = tJ - .12;            // le journal se deroule : une ligne de plus
  const tPrint = r4 - .22, PAS = .21, tSlide = tMot('r4', 4) + .12;               // Hold up sort le bordereau, il glisse vers la poche
  const tSign = tMot('r4', 5) + .02, tRel = tMot('r4', 8) - .24;                  // la poche signe ; la main est rendue avant « signe »

  // ---------- le monde (1 unite = 1 pixel au cadrage « duo ») ----------
  const PKX = 250, PKY = 405, SP = 3.7;                     // ma poche (haut de l'ourlet, au centre)
  const PAX = 900, PAY = 40, PS = 3.15, R0 = 56;            // le panneau : la rangee R0 de la capture est a y = PAY
  const pX = c => PAX + c * PS, pY = r => PAY + (r - R0) * PS;
  const A1 = [PAX, pY(141.5)], A2 = [PAX + 360 * PS, pY(141.5)], HH = [PKX, PKY + 8];   // la corde passe a la hauteur du soulignement du lien
  const GX = 2960, GY = 190, SB = 1.8, FG = { bx: 0, by: 0, id: 5, hacked: false };     // le guichet de la plateforme, au bout de la corde
  const yL = x => lerp(A1[1], HH[1], (A1[0] - x) / (A1[0] - HH[0]));                    // la corde tendue entre le panneau et la poche

  const CAM = mkCam([
    [T5, 258, 668, 1.72],                                   // tres gros plan : la main dans mes pieces
    [r1 - .1, 262, 662, 1.62, E.derive],
    [r1 + .85, 570, 500, 1.02, E.glisse],                   // recule : la poche, la corde qui monte
    [tDive + .22, 640, 490, .95, E.derive],
    [tLand - .12, 1560, 400, .58, E.glisse],                // plan large : la corde va jusqu'au guichet
    [tLand + .14, 1545, 398, .6, E.derive],
    [r2 + .5, 1305, 285, 1.75, E.glisse],                   // gros plan sur le lien « Retirer l'autorisation »
    [tMot('r2', 1) - .08, 1318, 288, 1.86, E.derive],
    [tAnn - .02, 1046, 455, .92, E.glisse],                 // duo : la poche, le panneau, le mot
    [tAnnOut, 1060, 457, .96, E.derive],
    [tClick - .04, 1305, 285, 1.8, E.glisse],               // le clic
    [tClick + .3, 1296, 288, 1.86, E.derive],
    [TUG[0] - .02, 330, 640, 1.5, E.glisse],                // le long de la corde tendue, jusqu'a la poche
    [TUG[2] + .3, 346, 632, 1.42, E.derive],
    [tJ + .12, 1330, 542, 1.27, E.glisse],                  // le journal : la ligne qui vient d'arriver
    [tPrint - .08, 1318, 536, 1.2, E.derive],
    [tPrint + .5, 760, 520, 1.25, E.glisse],                // le bordereau sort du panneau
    [tSlide, 740, 524, 1.28, E.derive],
    [tSlide + .55, 540, 575, 1.4, E.glisse],                // la signature
    [tRel - .05, 548, 580, 1.44, E.derive],
    [tRel + .6, 1060, 458, .94, E.glisse],                  // la main est partie : la poche intacte, « Retirée »
    [T6 - RACC, 1068, 462, .98, E.derive],
    [T6, 1070, 463, .99, E.derive],
  ], t => pose(t, [[T5, -.03], [r1 + .85, .012, E.glisse], [tLand, -.012, E.glisse], [r2 + .5, .007, E.glisse], [tAnn, -.01, E.glisse], [tClick, .006, E.glisse], [TUG[0], -.022, E.glisse], [tJ + .12, .006, E.glisse], [tPrint + .5, -.01, E.glisse], [tSlide + .55, .012, E.glisse], [tRel + .6, -.006, E.glisse], [T6, .004, E.derive]]));

  // ---------- la corde : du guichet (u = 0) a l'ourlet de ma poche (u = 1) ----------
  function corde(t) {
    const ten = E.arrive(seg(t, tClick + .02, tClick + .12)), mou = (1 - .3 * E.pars(seg(t, tDive, tDive + .12))) * (1 - ten), resp = Math.sin(t * 2.3), kL = E.arrive(seg(t, tLand - .04, tLand + .08));
    const s3 = cubic([GX - 66 * SB, GY + 40 * SB], [2680, A2[1] + 40 + 150 * mou + 14 * resp * mou], [2330, A2[1] + 130 * mou - 8 * resp * mou], A2, 14);
    const mid = []; for (let i = 1; i < 8; i++) mid.push([lerp(A2[0], A1[0], i / 8), A1[1]]);
    const d1 = [(HH[0] - A1[0]) / 3, (HH[1] - A1[1]) / 3];
    let bow = 0; for (const u of TUG) { const d = t - u; if (d > -.08 && d < .5) bow += pose(d, [[-.08, 0], [.05, 34, E.arrive], [.16, 30], [.45, 0, E.doux]]); }
    const c1 = [lerp(770, A1[0] + d1[0], ten), lerp(A1[1] + 260 * mou + 14 * resp, A1[1] + d1[1] - bow, ten)];
    const c2 = [lerp(PKX + 46, A1[0] + 2 * d1[0], ten), lerp(HH[1] - 380 - 12 * resp, A1[1] + 2 * d1[1] - bow * .5, ten)];
    const s1 = cubic(A1, c1, c2, HH, 22);
    const dc = t - tClick - .06, tw = dc > 0 && t < tRel ? 26 * Math.exp(-dc * 7) * Math.sin(dc * 46) + 1.5 * Math.sin(t * 64) : 0;      // elle claque en se tendant, puis vibre
    if (tw) s1.forEach((p, i) => { p[1] += tw * Math.sin(Math.PI * i / 22); });
    const pts = [...s3, ...mid, ...s1];
    if (kL < 1) for (const p of pts) p[1] += 230 * (1 - kL) * Math.pow(Math.sin(Math.PI * clamp((p[0] - 430) / 2350)), 1.3);      // avant le panneau : elle pend
    return pts;
  }
  const EK = bez(.5, 0, .75, .5), travel = t => 1 - EK(seg(t, tRel + .06, tRel + .66));        // la main file le long de la corde, vide
  let tApres = tRel + .3;                                   // l'instant ou la main passe derriere le lien : le panneau dit « Retirée »
  for (let tt = tRel + .06; tt < tRel + .7; tt += 1 / 240) if (along(corde(tt), travel(tt)).x > PAX + 70) { tApres = tt; break; }

  // ---------- la main dans la poche ----------
  function etat(t) {
    const S = { wy: 34 + 2.5 * Math.sin(t * 2.1), curl: .3 + .2 * Math.sin(t * 3.4), strain: 0, rot: .05 * Math.sin(t * 1.7), jolt: 0, main: true };
    for (const a of TAP) if (t > a - .18 && t < a + .5) { S.strain += pose(t, [[a - .18, 0], [a - .04, -5, E.arrive], [a + .03, 2, E.pars], [a + .2, 0, E.arrive]]); S.wy += pose(t, [[a - .18, 0], [a - .04, -4, E.arrive], [a + .03, 1.5, E.pars], [a + .2, 0, E.arrive]]); }
    if (t > tDive - .3) {                                   // elle se ramasse, plonge jusqu'au fond, y reste
      S.wy = pose(t, [[tDive - .3, S.wy], [tDive - .05, 18, E.arrive], [tDive + .1, 63, E.pars], [tDive + .22, 59, E.doux]]) + (t > tDive + .22 ? 1.6 * Math.sin((t - tDive - .22) * 2.6) : 0);
      S.curl = t > tDive + .4 ? .5 + .2 * Math.sin((t - tDive - .4) * 3.6) : pose(t, [[tDive - .3, S.curl], [tDive - .05, 0, E.arrive], [tDive + .14, 0], [tDive + .4, .5, E.doux]]);
      S.strain = pose(t, [[tDive - .05, 0], [tDive + .08, 3, E.pars], [tDive + .3, 0, E.doux]]);
      S.jolt = pose(t, [[tDive + .07, 0], [tDive + .12, 5, E.arrive], [tDive + .24, -3, E.doux], [tDive + .42, 1, E.doux], [tDive + .56, 0, E.doux]]);
      S.rot = .04 * Math.sin(t * 1.9);
    }
    if (t > tClick) {                                       // la corde la prend : trois tractions, elle remonte a l'ourlet et y reste, tendue
      const g = E.arrive(seg(t, tClick + .06, tClick + .2));
      S.curl = lerp(S.curl, 0, g); S.strain = 2.6 * g + .5 * Math.sin(t * 70) * g;
      S.wy = pose(t, [[tClick + .06, S.wy], [tClick + .16, 57, E.arrive], [TUG[0] - .12, 58], [TUG[0] - .02, 61, E.arrive], [TUG[0] + .11, 43, E.sec], [TUG[1] - .12, 44, E.doux], [TUG[1] - .02, 47, E.arrive], [TUG[1] + .11, 26, E.sec],
        [TUG[2] - .12, 27, E.doux], [TUG[2] - .02, 30, E.arrive], [TUG[2] + .11, 6, E.sec], [TUG[2] + .3, 9, E.doux]]);
      S.rot = .03 * Math.sin(t * 31) * g; S.jolt = 0;
      TUG.forEach((u, i) => { const d = t - u, f = [1, 1.3, 1.7][i]; if (d > -.02 && d < .6) { S.rot += .2 * f * Math.exp(-d * 6) * Math.sin(d * 26); S.jolt += pose(d, [[0, 0], [.07, -4.5 * f, E.arrive], [.2, 1.6 * f, E.doux], [.36, 0, E.doux]]); } });
      if (t > TUG[2] + .3) S.wy += .7 * Math.sin(t * 57);
    }
    if (t > tRel) { S.wy = pose(t, [[tRel, 9], [tRel + .06, 2, E.pars]]); S.main = t < tRel + .06;
      S.jolt = pose(t, [[tRel + .04, 0], [tRel + .1, -9, E.arrive], [tRel + .26, 4, E.doux], [tRel + .44, -1.5, E.doux], [tRel + .6, 0, E.doux]]); }
    return S;
  }
  // des pieces sautent et retombent dans la poche (repere de la poche)
  function eclats(t, t0, n, seed, v0, v1) { const d = t - t0; if (d < 0 || d > .7) return;
    for (let i = 0; i < n; i++) { const y = 44 - lerp(v0, v1, hash(seed, i, 1)) * d + 620 * d * d, x = sh(seed, i, 3) * 30 + sh(seed, i, 2) * 40 * d; if (y > 45) continue;
      X.save(); X.translate(x, y); X.rotate(sh(seed, i, 4) * 1.2 + d * sh(seed, i, 5) * 14); X.beginPath(); X.ellipse(0, 0, 10, 4.4, 0, 0, 7); X.fillStyle = INK; X.fill(); X.strokeStyle = BLK; X.lineWidth = 1.5; X.stroke(); X.restore(); } }
  function poche(t, S, cz, queue) {
    X.save(); X.translate(PKX, PKY + S.jolt * SP); X.scale(SP, SP); Z = cz * SP; const lw = LW();
    pocketPath(0); X.fillStyle = BLK; X.fill();
    X.beginPath(); X.roundRect(-PW / 2 - 3, 0, PW + 6, 15, 4); X.fillStyle = BLK; X.fill(); X.strokeStyle = INK; X.lineWidth = lw; X.stroke();
    if (S.main) tube([...queue.map(p => [(p[0] - PKX) / SP, (p[1] - PKY) / SP - S.jolt]), [0, (S.wy + 8) / 2], [0, S.wy - 3]], 15, 81);
    coins({ seed: 81 }, 1);
    if (S.main) hand(0, S.wy, 1.3, S, 81);
    eclats(t, tDive + .09, 8, 51, 150, 300); TUG.forEach((u, i) => eclats(t, u + .06, 3 + i * 2, 52 + i, 110, 210 + i * 40));
    const dr = t - tRel - .05; if (dr > 0 && dr < .5) for (let i = 0; i < 6; i++) { const d = dr - i * .025, y = 2 + i * 2 + 520 * d * d; if (d < 0 || y > 44) continue;      // elle lache tout : les pieces retombent chez moi
      X.save(); X.translate(sh(61, i, 1) * 15, y); X.rotate(sh(61, i, 2) + d * 9); X.beginPath(); X.ellipse(0, 0, 10, 4.4, 0, 0, 7); X.fillStyle = INK; X.fill(); X.strokeStyle = BLK; X.lineWidth = 1.5; X.stroke(); X.restore(); }
    pocketPath(0); X.strokeStyle = INK; X.lineWidth = lw; X.lineJoin = 'round'; X.stroke();
    pocketPath(7); X.setLineDash([5, 5]); X.lineWidth = lw * .5; X.stroke(); pocketPath(12); X.stroke(); X.setLineDash([]);
    X.beginPath(); X.ellipse(0, 2, 13, 4.5, 0, 0, Math.PI); X.strokeStyle = INK; X.lineWidth = lw * 1.3; X.stroke();
    X.restore(); Z = cz;
  }

  // ---------- traits d'encre poses sur le panneau (noirs : l'ecran reel est clair) ----------
  const rond = (cx, cy, rx, ry, seed, pw = 1) => { const o = []; for (let i = 0; i <= 48; i++) { const a = -2.5 + i / 48 * 2.2 * Math.PI, k = 1 + .045 * Math.sin(i * .8 + seed) + .05 * i / 48, co = Math.cos(a), si = Math.sin(a);
    o.push([cx + Math.sign(co) * Math.pow(Math.abs(co), pw) * rx * k, cy + Math.sign(si) * Math.pow(Math.abs(si), pw) * ry * k]); } return o; };
  const R_LIEN = rond(pX(82), pY(133.5), 228, 46, 3), R_FAIT = rond(pX(42), pY(131.5), 104, 42, 9), R_LIGNE = rond(pX(169), pY(261), 509, 98, 5, .4);
  const encre = (pts, k, w) => { if (k <= 0) return; smooth(jit(cutTo(pts, Math.min(1, k)), 77, 1.2)); X.strokeStyle = BLK; X.lineWidth = w; X.lineCap = 'round'; X.lineJoin = 'round'; X.stroke(); };
  function panneau(t, c) {
    if (t < tLand - .26) return;
    const im = t >= tApres ? IMG.apres : t >= tClick + .05 ? IMG.retrait : IMG.panneau;
    const kU = E.arrive(seg(t, tUnroll, tUnroll + .4)), ra = lerp(12, 56, kU);      // la fenetre descend le long du panneau : l'en-tete sort, le journal entre
    let rb = lerp(184, 298, kU); if (!enFouet(t, T5, T6)) rb = Math.min(rb, R0 + (c.y + 374 / c.z - PAY) / PS);      // jamais de fond clair sous les sous-titres
    if (rb <= ra + 1) return;
    const dy = t < tLand ? -1500 * (1 - E.pars(seg(t, tLand - .26, tLand))) : pose(t - tLand, [[0, 0], [.07, -18, E.arrive], [.18, 0, bez(.6, 0, .9, .4)], [.23, -5, E.arrive], [.3, 0, E.doux]]);
    const rot = pose(t, [[tLand - .26, -.07], [tLand, .014, E.pars], [tLand + .16, -.004, E.doux], [tLand + .3, 0, E.doux]]);
    X.save(); X.translate(PAX + 180 * PS, A1[1] + dy); X.rotate(rot); X.translate(-PAX - 180 * PS, -A1[1]);
    X.imageSmoothingEnabled = true; X.imageSmoothingQuality = 'high';
    if (im.complete && im.naturalWidth) X.drawImage(im, 0, ra, 360, rb - ra, PAX, pY(ra), 360 * PS, (rb - ra) * PS);
    if (t < tClick + .05) {                                  // le lien est le bout de la corde : un trait le relie au bord, l'encre l'entoure
      const k = seg(t, tCirc - .1, tCirc); if (k > 0) { X.beginPath(); X.moveTo(PAX, A1[1]); X.lineTo(lerp(PAX, pX(19), k), A1[1]); X.strokeStyle = BLK; X.lineWidth = 5; X.lineCap = 'round'; X.stroke(); }
      const pr = pose(t, [[tClick - .05, 1], [tClick + .03, .93, E.arrive]]); X.save(); X.translate(pX(82), pY(133.5)); X.scale(pr, pr); X.translate(-pX(82), -pY(133.5)); encre(R_LIEN, E.doux(seg(t, tCirc, tCirc + .3)) * 1.001, 6); X.restore();
    }
    const kc = seg(t, tClick, tClick + .3); if (kc > 0 && kc < 1) { const e = E.arrive(kc); X.beginPath(); X.ellipse(pX(82), pY(133.5), lerp(70, 300, e), lerp(26, 90, e), 0, 0, 7); X.strokeStyle = BLK; X.lineWidth = 9 * (1 - e) + .01; X.stroke(); }
    if (rb > 290) encre(R_LIGNE, E.doux(seg(t, tJ + .02, tJ + .36)) * 1.001, 6);
    if (t >= tApres) encre(R_FAIT, E.doux(seg(t, tApres + .12, tApres + .34)) * 1.001, 6);
    // le pointeur de la personne : c'est elle qui clique
    if (t > tClick - .45 && t < tClick + .55) { const k = E.arrive(seg(t, tClick - .45, tClick - .08)), o = E.pars(seg(t, tClick + .32, tClick + .55)), ps = pose(t, [[tClick - .03, 1], [tClick + .03, .8, E.sec], [tClick + .16, 1, E.doux]]);
      X.save(); X.translate(lerp(pX(250), pX(112), k) + o * 900, lerp(pY(215), pY(137), k) + o * 520); X.scale(ps * 1.25, ps * 1.25);
      X.beginPath(); X.moveTo(0, 0); X.lineTo(0, 58); X.lineTo(14, 45); X.lineTo(25, 68); X.lineTo(35, 63); X.lineTo(24, 41); X.lineTo(43, 41); X.closePath(); X.lineJoin = 'round'; X.strokeStyle = INK; X.lineWidth = 7; X.stroke(); X.fillStyle = BLK; X.fill(); X.restore(); }
    X.restore();
  }

  // ---------- le bordereau : la transaction preparee par Hold up, pendue a la corde ; la poche la signe ----------
  const SIG = (() => { const o = []; for (let i = 0; i <= 46; i++) { const s = i / 46; o.push([-58 + 118 * s + 9 * Math.sin(s * 17), 206 - (26 - 12 * s) * Math.sin(s * 22 + .4) - 4 * s]); } const e = o[o.length - 1];
    return [...o, ...cubic(e, [104, 176], [20, 252], [-64, 242], 10).slice(1), ...cubic([-64, 242], [0, 236], [60, 240], [92, 234], 8).slice(1)]; })();
  const XS1 = 560, LEAD = cubic([PKX + 120, PKY + 26], [PKX + 150, PKY - 130], [XS1 - 120, yL(XS1) + 120], [XS1 + SIG[0][0], yL(XS1) + SIG[0][1]], 14);
  const sub = (pts, u0, u1) => { if (u1 <= u0 + 1e-4) return null; const a = cutTo(pts, Math.min(1, u1)); return u0 <= 0 ? a : cutTo(a.slice().reverse(), 1 - u0 / u1).reverse(); };
  function bordereau(t) {
    if (t < tPrint || t > tRel + .17) return;
    let xs = PAX + 115; for (let i = 0; i < 5; i++) xs -= 46 * E.arrive(seg(t, tPrint + i * PAS, tPrint + i * PAS + .13));       // il sort par a-coups, comme d'une imprimante
    const ks = E.glisse(seg(t, tSlide, tSlide + .5)); xs -= (785 - XS1) * ks; xs += 640 * E.pars(seg(t, tRel, tRel + .17));
    let rot = -.2 * Math.sin(Math.PI * ks); for (let i = 0; i < 5; i++) { const d = t - (tPrint + i * PAS + .1); if (d > 0) rot += .04 * Math.exp(-d * 9) * Math.sin(d * 38); }
    const ds = t - tSlide - .5; if (ds > 0) rot += .15 * Math.exp(-ds * 5) * Math.sin(ds * 13); if (t > tRel) rot -= .3 * E.pars(seg(t, tRel, tRel + .17));
    X.save(); X.translate(xs, yL(xs)); X.rotate(rot);
    const b = [[-105, 14], [-35, 14], [35, 14], [105, 14], [105, 140], [105, 262]]; for (let i = 0; i < 7; i++) b.push([105 - (i + .5) * 30, 276], [105 - (i + 1) * 30, 262]); b.push([-105, 140]);
    trace(jit(b, 311, 1.4), true); X.fillStyle = BLK; X.fill(); X.strokeStyle = INK; X.lineWidth = 6; X.lineJoin = 'round'; X.lineCap = 'round'; X.stroke();
    for (const px of [-62, 62]) { X.beginPath(); X.roundRect(px - 9, -14, 18, 40, 7); X.fillStyle = BLK; X.fill(); X.stroke(); }
    X.lineWidth = 9; for (const [y, w] of [[58, 150], [90, 116], [122, 134]]) { X.beginPath(); X.moveTo(-76, y); X.lineTo(-76 + w, y); X.stroke(); }
    X.lineWidth = 3.5; X.beginPath(); X.moveTo(-70, 226); X.lineTo(86, 226); X.stroke();
    X.lineWidth = 5; X.beginPath(); X.moveTo(-90, 208); X.lineTo(-76, 222); X.moveTo(-76, 208); X.lineTo(-90, 222); X.stroke();
    const k = E.doux(seg(t, tSign, tSign + .48)); if (k > 0) { smooth(cutTo(SIG, k)); X.strokeStyle = INK; X.lineWidth = 6.5; X.stroke(); }
    X.restore();
  }

  const SEC = [[tDive + .1, 8], [tLand, 16], [tSlash, 14], [TUG[0] + .05, 5], [TUG[1] + .05, 7], [TUG[2] + .05, 10], [tRel + .02, 16]];
  const VITE = [[tDive - .06, tDive + .22], [tLand - .26, tLand + .12], [tAnn, tAnn + .16], [tSlash - .02, tSlash + .1], [tClick - .02, tClick + .14], ...TUG.map(u => [u - .03, u + .16]), [tSign - .16, tSign + .1], [tRel, tRel + .72]];

  acte({ id: 's5', draw(t) {
    const z0 = Z, S = etat(t), fi = fouetIn(t, T5, RACCORDS.T5), fo = fouetOut(t, T6, RACCORDS.T6);
    let sx = 0, sy = 0; for (const [t0, a] of SEC) { const s = shake(t, t0, a); sx += s[0]; sy += s[1]; }
    X.save(); const c = CAM.apply(t, sx + fi[0] + fo[0], sy + fi[1] + fo[1]);
    // le guichet, au bout de la corde
    X.save(); X.translate(GX, GY); X.scale(SB, SB); Z = c.z * SB; drawBooth(FG, t); X.restore(); Z = c.z;
    // la corde, et la main qui file quand elle est rendue
    const pts = corde(t), fly = t > tRel + .06, tr = fly ? travel(t) : 1, cut = fly ? (tr > .002 ? cutTo(pts, tr) : null) : pts.slice(0, pts.length - 4);
    if (cut && cut.length > 1) { smooth(jit(cut, 81, 1.6)); X.strokeStyle = INK; X.lineWidth = 4.2 * SP; X.lineCap = 'round'; X.lineJoin = 'round'; X.globalAlpha = .55; X.stroke(); X.globalAlpha = 1; }
    if (fly && tr > .002) { const q = along(pts, tr), a = lerp(0, q.a - Math.PI / 2, E.arrive(seg(t, tRel + .06, tRel + .16)));
      X.save(); X.translate(q.x, q.y); X.scale(SP, SP); Z = c.z * SP; hand(0, 0, 1.3, { curl: .22, strain: 1.5, rot: a }, 81); X.restore(); Z = c.z; }
    bordereau(t);
    // « annuler » : le mot tombe sous le panneau, un trait le barre, il s'ecrase
    if (t >= tAnn && t < tAnnOut + .12) { const cx = PAX + 180 * PS, by = 720, ky = 1 - E.pars(seg(t, tAnnOut, tAnnOut + .12)), hit = t >= tSlash ? 1 : 0;
      X.save(); X.translate(cx, by); X.rotate(-.022 * hit); X.scale(1 + .25 * (1 - ky), Math.max(.02, ky)); frappe('ANNULER', 0, 8 * hit, 190, t, tAnn); X.restore();
      const ks = seg(t, tSlash, tSlash + .07); if (ks > 0 && ky > .5) { const sl = cutTo([[cx - 570, by - 22], [cx + 570, by - 112]], ks); X.lineCap = 'round'; trace(sl); X.strokeStyle = BLK; X.lineWidth = 34; X.stroke(); trace(sl); X.strokeStyle = INK; X.lineWidth = 13; X.stroke(); } }
    panneau(t, c);
    poche(t, S, c.z, pts.slice(pts.length - 5));
    // l'encre part de la poche et va signer : c'est le portefeuille qui signe
    const ld = sub(LEAD, E.doux(seg(t, tSign - .08, tSign + .08)), E.doux(seg(t, tSign - .16, tSign))); if (ld && t < tSign + .08) { smooth(ld); X.strokeStyle = INK; X.lineWidth = 6.5; X.lineCap = 'round'; X.stroke(); }
    // le journal : une ligne de plus
    frappe('une ligne', 870, 706, 44, t, tJ + .3, { al: 'right' }); frappe('au journal', 870, 760, 44, t, tJ + .52, { al: 'right' });
    X.restore(); Z = z0;
    if (t >= tLand) { X.save(); X.translate(fo[0], fo[1]); mention("Prise réelle de l'extension"); X.restore(); }
    flash(t, tSlash, .22); flash(t, tRel + .02, .3);
  }, blur: t => enFouet(t, T5, T6) ? 6 : Math.max(CAM.blur(t), VITE.some(([a, b]) => t > a && t < b) ? 4 : 1) });

  // ---------- reperes sonores de la scene ----------
  cue(T5, 'whoosh', { d: .35 }); TAP.forEach(a => cue(a, 'tap'));
  cue(r1 - .1, 'souffle', { d: .9 }); cue(tDive - .28, 'etire', { d: .3 }); cue(tDive + .1, 'bute', { g: .9 }); cue(tDive + .12, 'poignee', { n: 1, g: .7 });
  cue(tLand - .3, 'whoosh', { d: .3 }); cue(tLand, 'impact', { g: 1.2 }); cue(tLand + .01, 'boum', { g: .8 });
  cue(tCirc, 'etire', { d: .3 }); cue(tAnn + .13, 'boum', { g: .9 }); cue(tSlash, 'impact', { g: 1.1 }); cue(tAnnOut, 'souffle', { d: .3 });
  cue(tClick, 'touche', { g: 1.6 }); cue(tClick + .04, 'tension', { d: .7 }); cue(tClick + .32, 'whoosh', { d: .4, sens: -1 });
  TUG.forEach((u, i) => cue(u + .04, 'bute', { g: [.7, .9, 1.1][i] })); cue(TUG[2] + .3, 'tension', { d: .9 });
  cue(tJ - .25, 'whoosh', { d: .4 }); cue(tJ + .1, 'etire', { d: .3 }); cue(tJ + .43, 'tic', { g: .9 }); cue(tJ + .65, 'tic', { g: 1 });
  for (let i = 0; i < 5; i++) cue(tPrint + i * PAS, 'touche', { g: 1.2 }); cue(tSlide, 'etire', { d: .5 }); cue(tSlide + .5, 'toc', { g: .8 });
  cue(tSign - .1, 'defile', { d: .5 }); cue(tRel - .32, 'silence', { d: .3 });
  cue(tRel + .02, 'impact', { g: 1.3 }); cue(tRel + .03, 'retire'); cue(tRel + .08, 'whoosh', { d: .5 }); cue(tApres + .12, 'toc', { g: 1 }); cue(tApres + .3, 'tic', { g: 1 });
  cue(T6 - RACC, 'whoosh', { d: .3, sens: -1 });
  // ---------- images cles de la scene ----------
  cle('trop_large', tDive + .3); cle('retirer', tClick - .08); cle('reprendre', TUG[2] + .2); cle('journal', tJ + .8); cle('signe', tRel - .04); cle('retiree', T6 - RACC - .08);
})();
