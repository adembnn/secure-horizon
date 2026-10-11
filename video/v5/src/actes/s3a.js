// actes/s3a.js : SCENE 3a, de T3 a T3B (40,16 a 53,70 s). Hold up ; la question ; la phrase tapee ; Clef la range.
// Voix : h1 « Hold up. » h2 « Une extension. Posée devant ton portefeuille. » h3 « Avant de signer, une question. »
//        h4 « Que veux-tu faire ? » h5 « Tu écris : échanger cinquante dollars. »
// Idee : un seul monde, une camera qui s'y deplace. A gauche les mains des plateformes au bout de leurs cordes, a droite MA poche.
// Une dalle tombe entre les deux (« Hold up. »), se deroule (« Une extension. ») : c'est la vraie fenetre de l'extension. Les mains butent
// dessus, la poche encaisse. La camera plonge sur la vraie question, revient sur la phrase qui se tape, et Clef la range en trois.
// Matiere reelle : la prise de l'extension, images 1 a 43 (ordre conserve, rythme cale sur la voix), et deux captures sans perte du meme
// ecran (img/captures/a_honnete_1_question.png, question_frappe.png). Contenu jamais retouche : recadrage et echelle seulement.
// La scene 3b reprend la prise a l'image 43. Un seul proprietaire par fichier. Tout est local a ce bloc.
'use strict';
(() => {
  const imQ = charge('img/captures/a_honnete_1_question.png'), imF = charge('img/captures/question_frappe.png');

  // ---------- temps, tous cales sur la voix ----------
  const h5 = L.h5.debut, tPose = tMot('h2', 2);
  const tImp = L.h1.debut - .15;                 // la dalle tombe, avant « Hold up. »
  const tExt = L.h2.debut - .06, tUI = tExt + .1; // elle se deroule, avant « Une extension. » ; la vraie fenetre s'ouvre dedans
  const tStamp = tPose - .2;                     // elle se pose, avant « Posée »
  const tLimp = L.h3.debut - .12, tDive = L.h3.debut + .25, tTit = tDive + .8;      // « Avant de signer » : les mains attendent ; la camera plonge
  const tLine = tMot('h3', 4) - .15, tQ = L.h4.debut - .2, tBack = L.h4.fin + .04, tS3 = tBack + .65;
  const tL4 = h5 - .5, tArrow = h5 - .26, tL5 = h5 + .86;
  const tW = [h5 + .56, h5 + 1.68, h5 + 2.36];   // fin de frappe de chaque morceau de la phrase (prise reelle)
  const tS50 = h5 + 1.76, tClef = h5 + 2.5, t09 = tClef + .62;

  // ---------- la prise reelle : quelle image a quel instant (ordre conserve) ----------
  const STEPS = [[tUI, 1], [tUI + .14, 2]];
  for (let f = 3; f <= 12; f++) STEPS.push([lerp(tUI + .5, tDive, (f - 3) / 9), f]);          // le curseur clignote
  for (let f = 13; f <= 18; f++) STEPS.push([lerp(tDive + .2, h5 + .1, (f - 13) / 5), f]);
  const KEYS = [[.2, 19], [.32, 20], [.44, 21], [.56, 22], [1.2, 23], [1.36, 24], [1.52, 25], [1.68, 26], [1.98, 27], [2.07, 28], [2.16, 29], [2.26, 30], [2.36, 31]];
  KEYS.forEach(([d, f]) => STEPS.push([h5 + d, f])); STEPS.push([h5 + 2.42, 32], [h5 + 2.47, 33]);
  STEPS.push([tClef + .12, 34], [tClef + .17, 35], [tClef + .22, 36]); for (let f = 37; f <= 43; f++) STEPS.push([tClef + .3 + (f - 37) * .08, f]);
  function ecran(t) {            // repere de la fenetre : 440 x 520, origine en haut a gauche
    let f = 0; for (const s of STEPS) { if (t >= s[0]) f = s[1]; else break; }
    if (!f) return;
    const im = f >= 43 ? imF : (f >= 13 && f <= 18) ? imQ : reel(f);
    X.imageSmoothingEnabled = true; X.imageSmoothingQuality = 'high';
    if (im && im.complete) X.drawImage(im, 0, 0, 424, 501, 0, 0, 440, 520);
  }

  // ---------- les mains des plateformes (creuses), a gauche ----------
  const HN = [{ y: -185, s: 4.6, seed: 811, anc: [-1700, -900], ph: 0, t0: tImp + .01, f0: 1.3 },
              { y: -40, s: 3.7, seed: 823, anc: [-1800, -560], ph: 2.1, t0: tExt + .14, f0: .7 },
              { y: 108, s: 3.2, seed: 839, anc: [-1750, -260], ph: 4.3, t0: tExt + .27, f0: .7 }];
  const LGS = [[tPose + .45, 0, 1], [tPose + .95, 1, 1.4], [tPose + 1.5, 0, 2], [tPose + 1.54, 2, 1.5], [tL4, 0, 1.3], [tL5, 1, 1.2]];   // [instant, main, force]
  const HITS = [...HN.map(h => [h.t0, h.f0]), ...LGS.map(l => [l[0] + .03, l[2]])];          // tout ce qui cogne la fenetre
  const reach = (curl, strain) => (23 - 3 * curl) + (5 + 10 * (1 - curl) + strain) + 4.6;     // poignet -> bout des doigts, en unites de la main
  const winJ = t => { let j = 0; for (const [e, f] of HITS) if (t > e && t < e + .45) j += pose(t, [[e, 0], [e + .05, 3 * f, E.arrive], [e + .16, 2.4 * f], [e + .42, 0, E.arrive]]); return j; };
  const winY = t => t < tImp ? pose(t, [[tImp - .13, -640], [tImp, 12, bez(.6, 0, 1, .6)]])
    : pose(t, [[tImp, 12], [tImp + .08, -6, E.arrive], [tImp + .22, 0, E.doux], [tStamp - .3, 0], [tStamp - .08, -24, E.doux], [tStamp, 6, E.pars], [tStamp + .1, -3, E.arrive], [tStamp + .24, 0, E.doux]]);
  const slabH = t => pose(t, [[tExt, 150], [tExt + .24, 546, bez(.5, 0, .3, 1)], [tExt + .36, 513, E.doux], [tExt + .48, 520, E.doux]]);
  function etat(i, t) {
    const h = HN[i]; if (t < h.t0 - .42) return null;
    const idle = seg(t, h.t0 + .5, h.t0 + 1), limp = E.arrive(seg(t, tLimp, tLimp + .3));
    let dx = 0, strain = idle * 1.1 * Math.pow(Math.max(0, Math.sin(t * 7.3 + h.ph - .6)), 3), bow = 0, rot = 0;
    let curl = .14 + limp * .2 + idle * .16 * Math.pow(Math.max(0, Math.sin(t * 7.3 + h.ph)), 3);
    const whips = [];
    if (t < h.t0) {                // elle fonce
      dx = pose(t, [[h.t0 - .42, -820], [h.t0 - .2, -300, E.arrive], [h.t0 - .09, -335, E.doux], [h.t0, 0, bez(.7, 0, 1, .5)]]);
      curl = pose(t, [[h.t0 - .42, .4], [h.t0 - .08, .05, E.doux]]); strain = pose(t, [[h.t0 - .1, 0], [h.t0, 2.5, E.pars]]);
    } else { const d = t - h.t0;   // elle bute, recule, revient tater
      dx += pose(d, [[0, 0], [.13, -120 * h.f0, E.arrive], [.38, -70 * h.f0, E.doux], [.8, 0, E.doux]]);
      strain = Math.max(strain, pose(d, [[0, 4.5], [.14, 0, E.arrive]])); if (d < .5) curl = pose(d, [[0, 0], [.14, 0], [.5, .14, E.doux]]);
      if (d < 1.6) whips.push([55 * h.f0 * Math.exp(-d * 3.4), d]); }
    for (const [t0, k, f] of LGS) { if (k !== i || t < t0 - .24 || t > t0 + .52) continue;      // un essai : elle se ramasse, pousse, la fenetre tient
      dx += pose(t, [[t0 - .24, 0], [t0 - .07, -58 * f, E.arrive], [t0 + .02, 0, E.pars], [t0 + .17, 0], [t0 + .29, -40 * f, E.doux], [t0 + .52, 0, E.doux]]);
      strain = Math.max(strain, pose(t, [[t0 - .04, 0], [t0 + .03, 3.6 * f, E.pars], [t0 + .16, 3.3 * f + Math.sin(t * 70) * .4], [t0 + .42, 0, E.arrive]]));
      curl *= pose(t, [[t0 - .24, 1], [t0 - .07, 0, E.arrive], [t0 + .17, 0], [t0 + .44, 1]]);
      bow += pose(t, [[t0 - .08, 0], [t0 + .05, 46 * f, E.arrive], [t0 + .16, 42 * f], [t0 + .45, 0, E.doux]]);
      const d = t - t0; if (d > 0) whips.push([30 * f * Math.exp(-d * 4), d]); }
    if (t > tLimp) { const d = t - tLimp; rot = .16 * Math.exp(-d * 3) * Math.sin(d * 9.5); }
    const y = h.y + idle * (1 - .6 * limp) * (9 * Math.sin(t * 1.7 + h.ph) + 4 * Math.sin(t * 4.3 + h.ph * 1.7));
    return { x: -220 + (t >= h.t0 ? winJ(t) : 0) - 2 - reach(curl, strain) * h.s + dx, y, curl, strain, rot, bow, whips };
  }
  function main(i, t) {
    const h = HN[i], st = etat(i, t); if (!st) return;
    const A = h.anc, d = st.x - A[0];
    const pts = cubic(A, [A[0] + d * .45, A[1] + 150 + 40 * Math.sin(t * 1.3 + h.ph)], [st.x - 300 - st.bow * .6, st.y - st.bow * 1.7], [st.x, st.y], 30);
    for (let j = 1; j < 30; j++) { const u = j / 30, env = Math.sin(u * Math.PI); let w = 7 * Math.sin(t * 2.3 - u * 7 + h.ph);
      for (const [a, dd] of st.whips) w += a * Math.sin(dd * 13 - u * 5); pts[j][1] += env * w; }
    X.save(); X.lineCap = 'round'; X.lineJoin = 'round';
    smooth(jit(pts.slice(0, 21), h.seed, .9)); X.strokeStyle = INK; X.lineWidth = 3 * h.s; X.globalAlpha = .55; X.stroke(); X.globalAlpha = 1;
    tube(pts.slice(19), 11.5 * h.s, h.seed);
    X.restore();
    hand(st.x, st.y, h.s, { curl: st.curl, strain: st.strain, rot: -Math.PI / 2 + st.rot }, h.seed);
  }

  // ---------- ma poche, a droite : elle encaisse chaque coup ----------
  const PKX = 394, PKY = -265, PKS = 3;
  const PE = [[tImp, 1.6], [HN[1].t0, .5], [HN[2].t0, .6], [tStamp, 1.3], ...LGS.map(l => [l[0] + .03, l[2] * .8]), [tS50, .7], [t09, .9]];
  const rattle = t => { let j = 0; for (const [e, f] of PE) if (t > e && t < e + .52) j += pose(t, [[e + .02, 0], [e + .07, 3 * f, E.arrive], [e + .16, -5 * f, E.doux], [e + .34, 1.2 * f, E.doux], [e + .5, 0, E.doux]]); return j; };
  const lift = t => 9 * pose(t, [[tS50, 0], [tS50 + .16, 1.25, E.arrive], [tS50 + .3, 1, E.doux]]);
  function poche(t) {
    const jl = rattle(t), lf = lift(t), lw = 3.4 / PKS;
    X.save(); X.translate(PKX, PKY + jl * PKS); X.scale(PKS, PKS); X.lineJoin = 'round';
    pocketPath(0); X.fillStyle = BLK; X.fill();
    X.beginPath(); X.roundRect(-PW / 2 - 3, 0, PW + 6, 15, 4); X.fillStyle = BLK; X.fill(); X.strokeStyle = INK; X.lineWidth = lw; X.stroke();
    if (lf > 0) {                  // « 50 » : la tranche que la phrase designe se detache du reste
      X.save(); X.beginPath(); X.rect(-60, 51, 120, 100); X.clip(); coins({ seed: 55 }, 1); X.restore();
      X.save(); X.translate(0, -lf); X.beginPath(); X.rect(-60, 20, 120, 31); X.clip(); coins({ seed: 55 }, 1); X.restore();
    } else coins({ seed: 55 }, 1);
    for (const [e, f] of PE) { if (f < .7) continue; const d = t - e - .05; if (d <= 0 || d > .7) continue;      // des pieces sautent, retombent
      for (let k = 0; k < 5; k++) { const vy = -(95 + 70 * hash(k, 7, e * 100 | 0)) * Math.sqrt(f), yy = 40 - lf + vy * d + 260 * d * d; if (yy > 41 - lf) continue;
        X.save(); X.translate(sh(k, 8, e * 100 | 0) * 33, yy); X.rotate(sh(k, 9, e * 100 | 0) * .6 + d * 7 * sh(k, 10, 3)); X.beginPath(); X.ellipse(0, 0, 10.5, 4.2, 0, 0, 7); X.fillStyle = INK; X.fill(); X.strokeStyle = BLK; X.lineWidth = 1.5; X.stroke(); X.restore(); } }
    pocketPath(0); X.strokeStyle = INK; X.lineWidth = lw; X.stroke();
    pocketPath(7); X.setLineDash([5, 5]); X.lineWidth = lw * .5; X.stroke(); pocketPath(12); X.stroke(); X.setLineDash([]);
    X.restore();
    if (t >= tS50 + .08) frappe('50 DUSDC', PKX, PKY + (25.5 + jl) * PKS, 23, t, tS50 + .08, { stroke: 5 });
  }

  // ---------- traits d'encre poses sur la vraie fenetre (repere : centre de la fenetre) ----------
  const part = (pts, a, b) => { if (b <= a + 1e-4) return null; const p = cutTo(pts, b); return a <= 0 ? p : cutTo(p.slice().reverse(), 1 - a / b).reverse(); };
  function trait(pts, a, b, w, seed) { const p = part(pts, a, b); if (!p || p.length < 2) return; X.lineCap = 'round'; X.lineJoin = 'round'; smooth(jit(p, seed, .7)); X.strokeStyle = INK; X.lineWidth = LW() * w; X.stroke(); }
  const WX = [[-121.4, -55], [-48.8, 24.9], [31.1, 120.4]], SX = [-132.8, -.5, 128], LAB = ['QUOI', 'COMBIEN', 'CONTRE QUOI'];      // mesures sur question_frappe.png
  function encre(t) {
    // la question : soulignee sur « question », puis frappee sur « Que veux-tu faire ? »
    if (t > tLine && t < tS3) { const out = E.pars(seg(t, tBack, tBack + .22));
      trait(cubic([-102, -168], [-40, -165], [40, -171], [102, -167], 14), out, E.arrive(seg(t, tLine, tLine + .18)), 1.5, 31);
      trait(cubic([-64, -160], [-20, -158], [30, -162], [76, -159], 10), out, E.arrive(seg(t, tLine + .09, tLine + .25)), 1.1, 32); }
    if (t > tQ && t < tS3) for (let i = 0; i < 8; i++) { const side = i < 4 ? -1 : 1, a = [-.5, -.17, .17, .5][i % 4], s = tQ + (i % 4) * .014;
      const k = E.arrive(seg(t, s, s + .1)) * (1 - E.pars(seg(t, tBack, tBack + .18))), r0 = 112 + 3 * Math.sin(t * 13 + i), r1 = r0 + (22 + 10 * hash(i, 5)) * k; if (k <= 0) continue;
      trait([[side * r0 * Math.cos(a), -186 + r0 * .55 * Math.sin(a)], [side * r1 * Math.cos(a), -186 + r1 * .55 * Math.sin(a)]], 0, 1, 1.4, 40 + i); }
    // « Tu écris : » : un trait part de la question et vient pointer le champ
    if (t > tArrow && t < h5 + .62) { const k = E.glisse(seg(t, tArrow, tArrow + .3)), out = E.pars(seg(t, h5 + .4, h5 + .6)), P = cubic([108, -185], [176, -182], [138, -112], [22, -127], 22);
      trait(P, out, k, 1.4, 51); if (k > .96 && out < .7) { trait([[22, -127], [37, -136]], 0, 1, 1.4, 52); trait([[22, -127], [38, -119]], 0, 1, 1.4, 53); } }
    // chaque morceau tape est souligne ; puis Clef le range : une corde par morceau, une etiquette au-dessus de la case reelle qui se remplit
    for (let i = 0; i < 3; i++) { const [a, b] = WX[i]; if (t < tW[i]) continue;
      const k = E.arrive(seg(t, tW[i], tW[i] + .12)); trait([[a, -117], [a, -113.5], [(a + b) / 2, -112.5], [b, -113.5], [b, -117]], 0, k, 1.2, 60 + i);
      const s = tClef + i * .07; if (t < s) continue;
      const C = cubic([(a + b) / 2, -112], [(a + b) / 2, -78], [SX[i], -74], [SX[i], -41], 16), kc = E.glisse(seg(t, s, s + .17)), ko = E.pars(seg(t, t09 - .16, t09 - .04));
      trait(C, ko, kc, 1.3, 70 + i);
      if (t >= s + .15) { frappe(LAB[i], SX[i], -14, 14.5, t, s + .15, { de: 2.2 });
        const kd = E.arrive(seg(t, s + .22, s + .34)); trait([[SX[i], -9], [SX[i], 12]], 0, kd, 1.2, 80 + i); if (kd > .9) { trait([[SX[i], 12], [SX[i] - 5, 6]], 0, 1, 1.2, 83 + i); trait([[SX[i], 12], [SX[i] + 5, 6]], 0, 1, 1.2, 86 + i); } } }
    // le temps mesure, tel que la vraie fenetre l'affiche : « Compris par Clef en 0,9 s »
    if (t >= t09 - .14) { const big = `${String(CLEF_S).replace('.', ',')} s`, small = 'Compris par Clef en';
      X.save(); X.font = '700 46px Montserrat'; const w2 = X.measureText(big).width; X.font = '700 16.5px Montserrat'; const w1 = X.measureText(small).width; X.restore();
      const x0 = -(w1 + 9 + w2) / 2;
      frappe(small, x0 + w1 / 2, -45, 16.5, t, t09 - .14, { de: 1.8 }); frappe(big, x0 + w1 + 9 + w2 / 2, -45, 46, t, t09, { de: 3 }); }
  }

  // ---------- la fenetre : une dalle qui tombe, puis se deroule ; dedans, la prise reelle ----------
  function fenetre(t) {
    if (t < tImp - .13) return;
    const h = slabH(t), lw = LW();
    X.save(); X.translate(-220 + winJ(t), -260 + winY(t));
    X.fillStyle = '#000'; X.fillRect(0, 0, 440, h);
    X.save(); X.beginPath(); X.rect(0, 0, 440, h); X.clip(); ecran(t); X.restore();
    if (t < tExt + .16) { const k = E.pars(seg(t, tExt, tExt + .16)), s = lerp(1, .3, k);      // le nom, frappe sur la dalle ; il se replie la ou s'ouvre la vraie question
      X.save(); X.translate(220, 75); X.scale(s, s); frappe('HOLD UP', 0, 31, 88, t, tImp, { de: 3.2 }); X.restore(); }
    const n = Math.max(2, Math.round(h / 60)), P = [];
    for (let i = 0; i <= 8; i++) P.push([i * 55, 0]); for (let i = 1; i <= n; i++) P.push([440, i * h / n]); for (let i = 7; i >= 0; i--) P.push([i * 55, h]); for (let i = n - 1; i >= 1; i--) P.push([0, i * h / n]);
    trace(jit(P, 77, .6), true); X.strokeStyle = INK; X.lineWidth = lw; X.lineJoin = 'round'; X.stroke();
    X.translate(220, 260); encre(t);
    X.restore();
    // elle se pose : quatre eclats au pied
    const d = t - tStamp; if (d > 0 && d < .32) { const k = E.arrive(d / .32); X.save(); X.lineCap = 'round'; X.strokeStyle = INK; X.lineWidth = lw * 1.2;
      for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { const a = -.15 - i * .42, r0 = 12 + 46 * k, r1 = 12 + 46 * Math.min(1, k * 1.9); X.beginPath(); X.moveTo(sd * (226 + r1 * Math.cos(a)), 262 + r1 * Math.sin(a)); X.lineTo(sd * (226 + r0 * Math.cos(a)), 262 + r0 * Math.sin(a)); X.stroke(); }
      X.restore(); }
  }

  // ---------- camera : la meme mathematique que l'ouverture ----------
  const cam = mkCam([
    [T3, 28, -150, 2.05],
    [tImp + .1, 40, -160, 2.2, E.derive],                 // tres pres : la main, la dalle, le nom
    [tExt - .05, 46, -166, 2.34, E.derive],
    [tExt + .65, 60, 8, 1.44, E.glisse],                  // recule avec la dalle qui se deroule : mains, fenetre entiere, poche
    [tStamp + .1, 66, 10, 1.47, E.derive],
    [tDive, 76, 10, 1.52, E.derive],
    [tTit, 0, -182, 3.6, E.glisse],                       // plonge sur la vraie question
    [tQ, 0, -182, 3.68, E.derive],
    [tBack, 0, -181, 3.8, E.derive],
    [tS3, 104, -32, 2.5, bez(.6, 0, .2, 1)],              // revient : le champ, les trois cases, et la poche a cote
    [T3B, 134, -30, 2.6, E.derive],
  ], t => pose(t, [[T3, .035], [tImp + .3, -.014, E.glisse], [tExt + .7, .01, E.glisse], [tDive, -.008, E.derive], [tTit, 0, E.glisse]]));
  const SHK = [[tImp, 16], [HN[1].t0, 5], [HN[2].t0, 6], [tStamp, 8], ...LGS.map(l => [l[0] + .03, 3 + 3.5 * l[2]]), [tQ, 5], [tS50, 5], [tClef + .15, 3], [t09, 12]];
  const punch = (t, t0) => { const d = t - t0; return d <= 0 || d > .3 ? 0 : pose(d, [[0, 0], [.06, 1, E.arrive], [.3, 0, E.doux]]); };
  const EVB = [[tImp - .14, tImp + .24], [tExt, tExt + .5], [tStamp - .08, tStamp + .16], ...LGS.map(l => [l[0] - .08, l[0] + .3]), [tQ, tQ + .14], [tS50, tS50 + .2], [tClef, tClef + .5], [t09 - .14, t09 + .2]];

  acte({ id: 's3a', draw(t) {
    X.save();
    let [dx, dy] = t < T3 + RACC ? fouetIn(t, T3, RACCORDS.T3) : t > T3B - RACC ? fouetOut(t, T3B, RACCORDS.T3B) : [0, 0];
    for (const [e, a] of SHK) { const s = shake(t, e, a); dx += s[0]; dy += s[1]; }
    X.translate(dx, dy);
    const b = 1 + .05 * punch(t, tImp) + .045 * punch(t, tQ) + .035 * punch(t, t09);
    X.translate(W / 2, H / 2 - 30); X.scale(b, b); X.translate(-W / 2, -(H / 2 - 30));
    cam.apply(t);
    poche(t);
    main(1, t); main(2, t); main(0, t);
    fenetre(t);
    X.restore();
    flash(t, tImp, .45); flash(t, LGS[2][0] + .03, .14); flash(t, t09, .38);
    if (t > tUI + .14) mention(t > tW[1] ? "Prise réelle de l'extension. DUSDC : jeton de démonstration." : "Prise réelle de l'extension");
  }, blur: t => Math.max(enFouet(t, T3, T3B) ? 6 : 1, cam.blur(t), EVB.some(e => t >= e[0] && t < e[1]) ? 4 : 1) });

  // ---------- reperes sonores de la scene ----------
  cue(T3 + .02, 'whoosh', { d: .3 }); cue(tImp, 'impact', { g: 1.3 }); cue(tImp, 'boum', { g: .8 }); cue(tImp + .03, 'bute', { g: 1 });
  cue(tExt, 'etire', { d: .3 }); cue(HN[1].t0, 'bute', { g: .6 }); cue(HN[2].t0, 'bute', { g: .7 }); cue(tExt + .24, 'toc', { g: .8 });
  cue(tStamp, 'boum', { g: .7 });
  LGS.forEach((l, i) => { if (i !== 3) cue(l[0] + .04, 'bute', { g: clamp(.45 + .28 * l[2], .5, 1) }); }); cue(LGS[2][0] + .04, 'impact', { g: .8 });
  cue(tLimp, 'renonce'); cue(tDive + .1, 'plonge', { d: .7 }); cue(tLine, 'souffle', { d: .2 }); cue(tQ, 'impact', { g: .7 }); cue(tBack, 'whoosh', { d: .6 }); cue(tArrow, 'souffle', { d: .3 });
  KEYS.forEach(([d]) => cue(h5 + d, 'touche', { g: .5 })); tW.forEach(w => cue(w + .03, 'tic', { g: .6 }));
  cue(tS50, 'toc', { g: 1 }); cue(tClef, 'whoosh', { d: .2 }); for (let i = 0; i < 3; i++) cue(tClef + i * .07 + .15, 'tic', { g: .9 });
  cue(t09 - .22, 'silence', { d: .2 }); cue(t09, 'impact', { g: 1.2 }); cue(t09, 'boum', { g: .6 }); cue(T3B - RACC, 'whoosh', { d: .35 });
  // ---------- images cles de la scene ----------
  cle('holdup', tImp + .35); cle('question', tQ + .45); cle('classement', t09 + .3);
})();
