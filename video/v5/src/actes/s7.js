// actes/s7.js : SCENE 7, la fin, de T7 a la derniere image. Trois plans, un seul geste : le bras tire, les noeuds tiennent.
// Voix : f1 « Tout site peut tomber. » f2 « Ce qu'il emporte, c'est toi qui le décides. » f3 « Hold up. »
//   plan 1 (T7 -> tP2)  retour au plan large de l'ouverture : le bras raye frappe un guichet quelconque AVANT « Tout site peut tomber »,
//                       le rideau tombe, toutes les cordes se tendent en vague, trois tirees de force croissante, rien ne part.
//   plan 2 (tP2 -> tG)  la camera descend MA corde : quatre noeuds, les quatre lignes du playbook (attendu e), ma poche au bout,
//                       la main tire et reste trop courte. « Automatique » = l'ecart signale, rien d'autre : limiter est un clic de la personne.
//   plan 3 (tG -> fin)  le gant blanc plein (logo final) monte, « Hold up » tombe sur le mot, la camera recule sans s'arreter :
//                       le guichet tombe, le bras qui tire, la couronne de poches nouees, NIST CSF 2.0 Detecter et Repondre (attendu f),
//                       puis le bras renonce et file.
// Aucune prise d'ecran : tout est dessine. Tout est local a ce bloc.
'use strict';
(() => {
  const F = makeField(40000, 0, 7, false), BX = F.bx, BY = F.by, LV = .6, FO = [1, 1.5, 2.1];
  // ---------- temps, tous derives de la voix ----------
  const tHit = L.f1.debut - .25, PULL1 = [tHit + .55, tHit + 1.0, tHit + 1.45];
  const tP2 = L.f2.debut - .28, tLine = i => tP2 + .2 + i * .6;
  const PULL2 = [tLine(0), tLine(1), tLine(2), tLine(3), tLine(3) + .4, tLine(3) + .8], tLimp = PULL2[5] + .42;
  const tG = L.f3.debut - .42, tI = tG + .26;                    // le gant part a tG, s'arrete net a tI : 0,16 s avant « Hold up »
  const PULL3 = [tI + 1.45, tI + 1.95, tI + 2.45], tQuit = tI + 2.85;
  const tN = [tI + .75, tI + 1.0, tI + 1.25];

  // ---------- le monde : un guichet, ses cordes, ses poches, toutes nouees ----------
  const CROWN = F.ps.filter(p => p.y - BY < -30 || (p.y - BY < 170 && Math.abs(p.x - BX) > 640));      // plan 3 : le bas du champ est laisse au logo
  // cordes et poches : tension propre a la scene (ten), tirees (tries) retardees par la distance
  function s7Field(t, ps, c, pulls, tSlack) {
    const near = Z > .95, vx = W * .56 / c.z + 170, vy = H * .62 / c.z + 210, lwf = Math.max(6, 1.15 / Z), lw = LW(), st = [];
    X.lineCap = 'round'; X.lineJoin = 'round'; X.strokeStyle = INK;
    for (const p of ps) {
      const d0 = p.dist / 4200, s = tHit + .1 + p.dist / 3200;
      const ten = E.arrive(seg(t, s, s + .28)) * (1 - E.doux(seg(t, tSlack + d0, tSlack + d0 + .55)));
      const S = tries(t - d0, pulls, 1), jo = S.jolt * (near ? 1 : 1.8), bow = S.bow * 1.3;
      const a = p.ang, A = [BX + Math.cos(a) * 66, BY + 30 + Math.sin(a) * 72], Q = [p.x, p.y - 6 + jo], d = Math.hypot(Q[0] - A[0], Q[1] - A[1]);
      const sag = p.sag0 * lerp(1.8, .15, ten) + bow + 9 * (1 - ten) * Math.sin(t * 2.3 - p.dist / 210 + p.ang);
      const pts = cubic(A, [A[0] + Math.cos(a) * d * .42, A[1] + Math.sin(a) * d * .42 + sag], [Q[0] + bow * .5, Q[1] - Math.min(92, 40 + d * .1) - bow * .2], Q, near ? 22 : 10);
      if (near) { smooth(jit(pts, p.seed, .45)); X.lineWidth = 4.2; X.globalAlpha = .55; } else { trace(pts); X.lineWidth = lwf; X.globalAlpha = clamp(.42 + Z * .9, 0, .95); }
      X.strokeStyle = INK; X.stroke(); X.globalAlpha = 1; st.push([p, S, jo]);
    }
    for (const [p, S, jo] of st) {
      if (Math.abs(p.x - c.x) > vx || Math.abs(p.y - c.y) > vy) continue;
      if (near) { pk(p.x, p.y, 1, { seed: p.seed, lv: LV, wy: -6 + S.wy, curl: S.curl, strain: S.strain, jolt: jo, bow: 0, knot: true, cordTo: [0, -44] }); continue; }
      X.save(); X.translate(p.x, p.y + jo); pocketPath(0); X.fillStyle = BLK; X.fill();
      X.save(); pocketPath(3); X.clip(); X.fillStyle = INK; X.fillRect(-PW / 2, surfY(LV) - 8, PW, PH); X.restore();
      pocketPath(0); X.strokeStyle = INK; X.lineWidth = lw; X.lineJoin = 'round'; X.stroke();
      X.beginPath(); X.roundRect(-PW / 2 - 3, 0, PW + 6, 15, 4); X.fillStyle = BLK; X.fill(); X.stroke();
      X.beginPath(); X.arc(5, -16, 9, 0, 7); X.lineWidth = Math.max(4, 1.4 / Z); X.stroke(); X.restore();      // le noeud
    }
  }
  const s7Squash = t => { const d = t - tHit; return d < 0 || d > .5 ? 0 : pose(d, [[0, 0], [.05, 1, E.arrive], [.26, -.12, E.doux], [.42, 0, E.doux]]); };
  // le guichet : allume, puis le coup, l'ecrasement, le rideau. Chaque tiree le souleve d'un rien.
  function s7Booth(t, pulls) {
    const sq = s7Squash(t), lw = LW(); let lift = 0;
    pulls.forEach((g, i) => { lift += pose(t, [[g - .02, 0], [g + .06, -3 * FO[i % 3], E.arrive], [g + .3, 0, E.doux]]); });
    X.save(); X.translate(BX, BY + 108 + lift); X.scale(1 + .1 * sq, 1 - .13 * sq); X.translate(-BX, -BY - 108);
    drawBooth(F, t);
    if (Z > .3 && t >= tHit) { const sh0 = E.pars(seg(t, tHit, tHit + .1));
      X.save(); X.translate(BX, BY); X.beginPath(); X.moveTo(-42, 34); X.lineTo(-42, -16); X.quadraticCurveTo(-42, -40, 0, -40); X.quadraticCurveTo(42, -40, 42, -16); X.lineTo(42, 34); X.closePath();
      X.save(); X.clip(); X.fillStyle = BLK; X.fillRect(-44, -42, 88, 78 * sh0);
      if (Z > 1) { X.strokeStyle = INK; X.lineWidth = lw * .6; for (let i = 0; i < 6; i++) { const yy = -42 + 78 * sh0 - 6 - i * 12; X.beginPath(); X.moveTo(-44, yy); X.lineTo(44, yy); X.stroke(); } }
      X.restore(); X.strokeStyle = INK; X.lineWidth = lw; X.lineJoin = 'round'; X.stroke();
      if (Z > .6) { X.lineWidth = lw * .8; X.lineCap = 'round'; for (const [dx, dy] of [[-38, 14], [-24, 26], [30, 20], [44, 9]]) { X.beginPath(); X.moveTo(6 + Math.sign(dx) * 22, -112); X.lineTo(6 + dx + Math.sign(dx) * 14, -112 + dy); X.stroke(); } }
      X.restore(); }
    X.restore();
  }
  // le bras raye : il attend, frappe, tient le guichet, tire (pulls), puis renonce et file (quit)
  function s7Thief(t, pulls, quit) {
    if (t > quit + .5) return;
    let y = pose(t, [[T7, -300], [tHit - .2, -275, E.doux], [tHit - .1, -312, E.arrive], [tHit, -82, bez(.7, 0, 1, .5)]]), flow = 0;
    pulls.forEach((g, i) => { const f = FO[i % 3]; y += pose(t, [[g - .12, 0], [g + .05, -13 * f, E.arrive], [g + .17, -11 * f], [g + .42, 0, E.doux]]); flow += 30 * f * pose(t, [[g - .05, 0], [g + .06, 1, E.arrive], [g + .42, 0, E.doux]]); });
    if (t > quit - .14) { y += pose(t, [[quit - .14, 0], [quit, 12, E.arrive], [quit + .34, -1900, bez(.7, 0, .9, .4)]]); flow += 500 * E.pars(seg(t, quit, quit + .34)); }
    const curl = pose(t, [[tHit - .3, 0], [tHit - .1, .25], [tHit - .02, 1, E.sec]]);
    X.save(); X.beginPath(); X.rect(BX - 3000, BY - 6000, 6000, 6000 - 112 + (t >= tHit ? 15 * s7Squash(t) : 300)); X.clip();
    stripedArm({ x: BX + 6, y: BY + y }, 1, t, flow, 7);
    if (t < tHit + .1) hand(BX + 6, BY + y - 6, 2.3, { curl, strain: 2 * (1 - curl) }, 4242);
    X.restore();
  }

  // ---------- cameras (meme mathematique que l'ouverture) ----------
  // gros plan sur le guichet, le coup, recul sec (la vague de tension s'ouvre avec lui), puis poussee lente calee sur le bas du champ (la bande des sous-titres reste libre)
  const C1 = mkCam([[T7, BX, BY - 150, 1.7], [tHit + .02, BX, BY - 125, 1.62, E.derive], [tHit + .38, BX, BY + 40, .5, bez(.5, 0, .2, 1)], [tP2 - RACC, BX, BY + 219, .66, E.derive], [tP2 + .05, BX - 10, BY + 620, 2.6, bez(.7, 0, .7, .6)]],
    t => pose(t, [[T7, -.04], [tHit + .2, .012, E.glisse], [tHit + 1.2, -.016, E.glisse], [tP2, .03, E.glisse]]));
  const YL = i => i * 120, YP = 420, SP = 2;        // plan 2 : lignes de base des quatre lignes, haut de la poche, echelle de la poche
  const C2 = mkCam([[tP2, 0, -330, 1.3], [tLine(0) + .05, 0, -20, 1.3, E.arrive], [tLine(1) - .12, 0, -8, 1.3, E.derive], [tLine(1) + .1, 0, 80, 1.3, E.glisse], [tLine(2) - .14, 0, 90, 1.28, E.derive],
    [tLine(2) + .12, 0, 190, 1.04, E.glisse], [tLine(3) - .14, 0, 200, 1.03, E.derive], [tLine(3) + .2, 0, 286, 1, E.glisse], [tG + .2, 0, 296, 1.07, E.derive]],
    t => pose(t, [[tP2, .03], [tLine(1), -.012, E.glisse], [tLine(3), .01, E.glisse], [tG, -.008, E.derive]]));
  const GS = 560, LT = 230, LB = LT + GS;           // plan 3 : taille du gant, haut et bas du logotype (unites du monde, sous le guichet)
  const C3 = mkCam([[tG, BX, BY + 560, 1.2], [tI + .25, BX, BY + 558, 1.18, E.derive], [DUR + .5, BX, BY + 190, .5, bez(.25, .5, .45, 1)]], t => pose(t, [[tI, -.012], [DUR, .014, E.derive]]));

  // ---------- plan 1 : tout site peut tomber ----------
  function plan1(t) {
    const [ix, iy] = fouetIn(t, T7, RACCORDS.T7), [ox, oy] = t > tP2 - RACC ? fouetOut(t, tP2, 'h') : [0, 0], [sx, sy] = shake(t, tHit, 18);
    X.save(); X.translate(ix + ox + sx, iy + oy + sy); const c = C1.apply(t);
    s7Field(t, F.ps, c, PULL1, 1e9); s7Thief(t, PULL1, 1e9); s7Booth(t, PULL1);
    X.restore(); Z = 1; flash(t, tHit, .5);
  }

  // ---------- plan 2 : ma corde, quatre noeuds, le playbook en quatre lignes ----------
  const PB = ['QUI EST ALERTÉ : la personne devant son écran', "AUTOMATIQUE : l'écart signalé", "HUMAIN : annuler, continuer, limiter, retirer l'autorisation", 'DOCUMENTÉ : une ligne de journal par décision'];
  let M = null;                                      // mesures de texte, faites une fois (polices chargees avant window.ready)
  function mes() { if (M) return M; X.save(); X.font = '700 46px Montserrat';
    const fs = PB.map(s => Math.min(46, 46 * 1640 / X.measureText(s).width));
    X.font = '700 70px Montserrat'; const NP = ['NIST CSF 2.0 :', 'Détecter', '·', 'Répondre'], nw = NP.map(s => X.measureText(s).width), gap = 24, tot = nw.reduce((a, b) => a + b, 0) + gap * 3; let x = -tot / 2; const nx = nw.map(w => { const cx = x + w / 2; x += w + gap; return cx; });
    const fw = .475 * GS; X.font = `700 ${fw}px ${UI}`; X.letterSpacing = (-4 / 190 * fw).toFixed(1) + 'px'; const tw = X.measureText('Hold up').width; X.letterSpacing = '0px'; X.restore();
    const left = -(.845 * GS + tw) / 2, bl = left - .11 * GS;      // logotype horizontal officiel (logotype_horizontal.svg), centre sur le guichet
    return (M = { fs, NP, nx, fw, tw, gx: bl + .527 * GS, wx: bl + .955 * GS }); }
  function plan2(t) {
    const m = mes(), [ix, iy] = fouetIn(t, tP2, 'h'), [ox, oy] = t > tG - .16 ? fouetOut(t, tG + .14, 'h') : [0, 0];
    X.save(); X.translate(ix + ox, iy + oy); C2.apply(t);
    const S = tries(t, PULL2, 1), dl = t - tLimp, up = -1.5 * S.jolt;
    const curl = dl > 0 ? lerp(.14, .42, E.arrive(seg(dl, 0, .3))) : S.curl, rot = dl > 0 ? .2 * Math.exp(-dl * 3.2) * Math.sin(dl * 9.5) : 0;
    pk(0, YP, SP, { seed: 7, lv: LV, wy: -6 + S.wy - (dl > 0 ? 2 * E.arrive(seg(dl, 0, .3)) : 0), curl, strain: S.strain, rot, jolt: S.jolt, bow: S.bow, knot: true, cordTo: [0, -900] });
    for (let i = 0; i < 4; i++) { const t0 = tLine(i); if (t < t0) continue; const d = t - t0, y = YL(i) + up * (1 - i * .15);
      const kk = pose(d, [[0, 2.6], [.15, .86, bez(.5, 0, .9, .6)], [.24, 1.08, E.sec], [.36, 1, E.doux]]);      // le noeud se serre
      X.save(); X.translate(0, y - 66); X.scale(kk, kk); X.rotate((1 - Math.min(1, d / .2)) * -.9); X.lineCap = 'round';
      X.beginPath(); X.ellipse(15, 0, 20, 16, -.5, 0, 7); X.strokeStyle = INK; X.lineWidth = 23; X.stroke(); X.strokeStyle = BLK; X.lineWidth = 17; X.stroke(); X.restore();
      X.fillStyle = BLK; X.fillRect(-26, y - 45, 52, 60);                                                    // la corde passe derriere la ligne
      frappe(PB[i], 0, y, m.fs[i], t, t0, { stroke: 14 }); }
    X.restore(); Z = 1;
  }

  // ---------- plan 3 : le gant, le nom, puis le recul ----------
  function plan3(t) {
    const m = mes(), [sx, sy] = shake(t, tI, 22);
    X.save(); X.translate(sx, sy); const c = C3.apply(t);
    s7Field(t, CROWN, c, PULL3, tQuit + .08); s7Thief(t, PULL3, tQuit); s7Booth(t, PULL3);
    gloveRise(t, tG, BX + m.gx, BY + LB, GS, 900 / 1.2);
    X.save(); X.letterSpacing = (-4 / 190 * m.fw).toFixed(1) + 'px'; frappe('Hold up', BX + m.wx + m.tw / 2, BY + LB - .226 * GS, m.fw, t, tI + .04, { ui: true, w: 700 }); X.restore();
    m.NP.forEach((s, i) => frappe(s, BX + m.nx[i], BY + LB + 80, 70, t, tN[Math.min(i, 2)], { de: 2.2 }));
    X.restore(); Z = 1; flash(t, tI, .6);
  }

  acte({ id: 's7', draw(t) {
    if (t < tP2) plan1(t);
    else { if (t < tG + .14) plan2(t); if (t >= tG) plan3(t); }
    Z = 1; X.globalAlpha = 1;
  }, blur: t => t < T7 + RACC ? 6 : t < tP2 - RACC ? Math.max(C1.blur(t), Math.abs(t - tHit) < .12 ? 6 : 1) : t < tP2 + RACC ? 6 : t < tG - .16 ? C2.blur(t) : t < tI + .1 ? 6 : Math.max(C3.blur(t), t > tQuit - .05 && t < tQuit + .4 ? 6 : 1) });

  // ---------- reperes sonores de la scene ----------
  menace(T7, tP2);
  cue(T7, 'whoosh', { d: .35 }); cue(tHit - .45, 'arrive'); cue(tHit, 'coup'); cue(tHit, 'impact', { g: 1.2 }); cue(tHit + .03, 'rideau'); cue(tHit + .15, 'tension', { d: .7 });
  PULL1.forEach((g, i) => cue(g + .04, 'bute', { g: [.6, .8, 1][i] }));
  cue(tP2 - .25, 'whoosh', { d: .5 });
  for (let i = 0; i < 4; i++) { cue(tLine(i), 'toc', { g: .9 }); cue(tLine(i) + .04, 'bute', { g: .45 }); }
  cue(PULL2[4] + .04, 'bute', { g: .8 }); cue(PULL2[5] + .04, 'bute', { g: 1 }); cue(tLimp, 'renonce');
  cue(tI - .5, 'silence', { d: .45 }); cue(tG, 'whoosh', { d: .26 }); cue(tI, 'impact', { g: 1.5 }); cue(tI, 'boum', { g: 1.4 }); cue(tI + .04, 'toc', { g: 1 });
  tN.forEach((g, i) => cue(g, 'tic', { g: .8 }));
  PULL3.forEach((g, i) => cue(g + .04, 'bute', { g: [.5, .65, .8][i] }));
  cue(tQuit - .2, 'renonce'); cue(tQuit, 'retire');
  // ---------- images cles de la scene ----------
  cle('retour', PULL1[1] + .08); cle('playbook', tLimp + .1); cle('gant', tI + .5); cle('fin', DUR - .05);
})();
