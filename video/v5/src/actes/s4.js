// actes/s4.js : SCENE 4, de T4 a T5. On pirate ce site : la meme attaque, deux fins.
// Voix : k1 « Maintenant, on pirate ce site. » k2 « Sans Hold up : le compte tombe à zéro. »
//        k3 « Avec Hold up : le droit de cinquante a servi à l'échange. » k4 « Il ne reste rien à prendre. »
// Preuve : research/demo_reelle/site_echange/test/preuve_piratage.mjs (sans : le compte passe de 50 a 0 ; avec : le droit ramene a 50 a ete
// consomme par l'echange, le pirate prend 0, il reste 50). Aucune prise d'ecran dans cette scene : tout est dessine, et c'est ecrit a l'image.
// Un seul monde, une camera qui s'y deplace (mkCam, la camera de l'ouverture) : guichet en haut, deux poches, deux cordes.
//   coup sur le toit -> recul sur le tableau -> poche de gauche (la main plonge, 50 tombe a 0) -> la camera suit la main et la prise jusqu'au
//   guichet -> redescend la corde de droite (nouee : le droit de 50 part a l'echange, il reste 0) -> tres gros plan sur la main qui bute
//   -> « RIEN » -> recul sur le tableau : 0 a gauche, 50 DUSDC a droite.
// Tous les temps sont cales sur les debuts de lignes de voix (L.k1..k4.debut). Un seul proprietaire par fichier ; rien ne fuit hors de ce bloc.
'use strict';
(() => {
  const K1 = L.k1.debut, K2 = L.k2.debut, K3 = L.k3.debut, K4 = L.k4.debut;
  // ---------- le monde : en pixels de l'image au zoom 1 (la camera met son point de visee 30 px au-dessus du milieu de l'image) ----------
  const BX = 960, BY = 215, BS = 1.45, AS = 1.35, ROOF = -112;         // guichet (centre, echelle) ; bras raye (echelle, dans le repere du guichet)
  const K = 2.6, PY0 = 400, NIV = .5;                                   // poches (echelle, haut de l'ourlet) ; 50 DUSDC : la poche est a moitie pleine
  const PG = { x: 380, cote: -1, seed: 71 }, PD = { x: 1540, cote: 1, seed: 72 };
  const CGX = 820, CDX = 1100;                                          // colonnes de texte des deux gros plans
  // ---------- les temps ----------
  const tHit = K1 + .55;                         // le coup tombe avant « pirate »
  const tTab = tHit + .95;                       // premier tableau : deux poches, 50 DUSDC chacune
  const tTend = K2 + .3;                         // le pirate reprend tout le mou de la corde de gauche
  const tSans = K2 - .1, tGrab = K2 + 1.2;       // la main touche le fond avant « tombe »
  const tZero = K2 + 1.78;                       // le 0 claque avant « zéro »
  const tExG = tZero + .3, tGo = tZero + .25, GO = .6, tLump = tGo + GO;       // la main file avec la prise, la camera la suit
  const tAvec = K3 - .1, LUN = [K3 + .3, K3 + 3.55, K3 + 4.15];              // trois essais contre le noeud, de plus en plus forts
  const tDroit = K3 + .95, t50 = K3 + 1.42, tUse = K3 + 2.25, tD0 = tUse + .42, tExD = LUN[1] - .1;
  const tLimp = K4 - .1, tRien = K4 + .5, tOut = K4 + .85, tBal = tOut + .42;

  // ---------- camera : celle de l'ouverture (zoom en logarithme, vitesses qui se chevauchent) ----------
  const roll = t => pose(t, [[T4, .03], [tHit - .1, -.014, E.glisse], [tTab, .012, E.glisse], [K2 - .2, -.024, E.glisse], [tZero + .28, -.008, E.derive], [tLump + .1, .03, E.glisse],
    [K3 - .2, .022, E.glisse], [LUN[1] - .2, .004, E.derive], [LUN[2], -.03, E.glisse], [tRien + .22, -.02, E.derive], [tOut + .4, .01, E.glisse], [T5, -.006, E.derive]]);
  const CAM = mkCam([
    [T4, 960, 478, .98],
    [T4 + .34, 960, 470, 1.04, E.derive],
    [tHit - .14, 963, 165, 1.86, E.glisse],            // monte au toit avec le poing
    [tHit + .1, 962, 172, 1.95, E.derive],
    [tTab, 960, 470, 1, bez(.55, 0, .25, 1)],          // recule : la tension court le long des deux cordes
    [K2 - .9, 960, 471, 1.045, E.derive],
    [K2 - .2, 640, 530, 1.74, E.glisse],               // la poche de gauche, sans Hold up
    [tGrab - .4, 650, 530, 1.86, E.derive],
    [tZero + .28, 664, 530, 2.0, E.derive],
    [tLump + .1, 1040, 160, 1.8, E.glisse],            // suit la main et la prise le long de la corde, jusqu'au guichet
    [K3 - .2, 1280, 530, 1.74, E.glisse],              // redescend la corde de droite, nouee
    [t50 - .06, 1272, 530, 1.8, E.derive],
    [t50 + .16, 1268, 530, 1.9, E.sec],                // le 50 claque : la camera encaisse
    [tD0 - .05, 1264, 530, 1.94, E.derive],
    [tD0 + .16, 1262, 530, 2.03, E.sec],
    [LUN[1] - .2, 1260, 530, 2.07, E.derive],
    [LUN[2], 1440, 541, 2.6, E.glisse],                // tres gros plan : la main bute a un cheveu des pieces
    [tRien + .22, 1436, 541, 2.74, E.derive],
    [tOut + .4, 960, 470, 1, bez(.55, 0, .25, 1)],     // recule : le tableau des deux fins
    [T5, 960, 464, 1.075, E.derive],
  ], roll);
  const secousse = t => { let x = 0, y = 0; for (const [t0, a] of [[tHit, 26], [tZero, 22], [t50, 9], [tD0, 11], [LUN[0] + .04, 7], [LUN[1] + .04, 10], [LUN[2] + .04, 15], [tRien, 18], [tBal, 7]]) { const s = shake(t, t0, a); x += s[0]; y += s[1]; } return [x, y]; };

  // ---------- etats ----------
  const taut = t => E.arrive(seg(t, tHit + .32, tHit + .6));           // la tension descend les cordes apres le coup
  function etatG(t) {      // a gauche, sans Hold up : corde libre, la main descend au fond et prend tout
    const tt = taut(t), tend = E.arrive(seg(t, tTend, tTend + .3));
    const S = { lv: NIV, wy: 2, curl: lerp(.14, .5, tt), strain: 0, rot: 0, jolt: 0, bow: 0, thin: 1, vib: 0 };
    S.sag = lerp(52, 30, tt) * (1 - .82 * tend) + 6 * (1 - tend) * Math.sin(t * 2.3) + 26 * (t > tTend ? Math.exp(-(t - tTend) * 7) * Math.sin((t - tTend) * 30) : 0);
    S.vib = 1.5 * tend;
    const tap = T4 + .62; if (t > tap - .18 && t < tap + .3) { S.strain = pose(t, [[tap - .18, 0], [tap - .04, -5, E.arrive], [tap + .03, 1.5, E.pars], [tap + .2, 0, E.arrive]]); S.wy += pose(t, [[tap - .18, 0], [tap - .04, -2.5, E.arrive], [tap + .03, .8, E.pars], [tap + .2, 0, E.arrive]]); }
    const s = tGrab, s0 = s - .46, deep = 74, top = -40;
    if (t > s0) {
      S.wy = pose(t, [[s0, 2], [s0 + .13, -7, E.arrive], [s + .03, deep, bez(.45, 0, .55, 1)], [s + .14, deep + 1], [s + .34, top, E.pars], [s + .46, top + 7, E.arrive], [tGo, top + 4, E.doux]]);
      S.curl = pose(t, [[s0, .5], [s0 + .13, 0, E.arrive], [s - .02, 0], [s + .06, 1, E.sec]]);
      S.lv = lerp(NIV, 0, E.pars(seg(t, s + .12, s + .34)));
      S.thin = pose(t, [[s0 + .13, 1], [s + .03, .78, E.doux], [s + .14, .78], [s + .34, 1, E.arrive]]);
      S.jolt = pose(t, [[s + .02, 0], [s + .07, 4, E.arrive], [s + .2, -7, E.doux], [s + .4, 2, E.doux], [s + .56, 0, E.doux]]);
      S.loot = t > s + .14; S.vib = t < s + .34 ? 2.4 : .6;
      if (t > s + .34) S.rot = .16 * Math.exp(-(t - s - .34) * 4) * Math.sin((t - s - .34) * 13);
    }
    if (t > tGo) S.travel = 1 - E.pars(seg(t, tGo, tGo + GO));
    return S;
  }
  function etatD(t) {      // a droite, avec Hold up : la corde est nouee a l'ourlet, le droit est consomme, la main n'atteint pas les pieces
    const tt = taut(t), S = { lv: NIV, wy: -6, curl: .14, strain: 0, rot: 0, jolt: 0, bow: 0, thin: 1, knot: true, sag: lerp(16, 3, tt) + 2 * (1 - tt) * Math.sin(t * 2.3 + 1), vib: 0 };
    if (t > tHit + .5 && t < tLimp) {              // le pirate tire sans relache : la corde vibre, les doigts s'allongent, rien ne vient
      const f = t > K3 - .3 ? 1 : .45; S.vib = 1.5 * f; S.strain = f * (1.4 + .7 * Math.sin(t * 37) + .4 * Math.sin(t * 23)); S.wy += f * (2.2 + .8 * Math.sin(t * 29)); S.curl = .08; S.jolt = f * (1 + .7 * Math.sin(t * 41));
    }
    LUN.forEach((Lg, i) => { const f = [1.1, 1.6, 2.1][i]; if (t > Lg - .2 && t < Lg + .5) {
      S.wy = -6 + pose(t, [[Lg - .2, 2], [Lg - .05, -5 * f, E.arrive], [Lg + .04, 6 * f, E.pars], [Lg + .17, 6 * f], [Lg + .27, -4 * f, E.doux], [Lg + .46, 2, E.doux]]);
      S.strain = pose(t, [[Lg - .05, 1], [Lg + .04, 4 * f, E.pars], [Lg + .16, 3.7 * f + Math.sin(t * 70) * .5], [Lg + .42, 1.4, E.arrive]]);
      S.curl = pose(t, [[Lg - .2, .08], [Lg - .05, 0, E.arrive], [Lg + .16, 0], [Lg + .42, .08]]);
      S.jolt = pose(t, [[Lg - .02, 1], [Lg + .05, 5 * f, E.arrive], [Lg + .16, 4.4 * f], [Lg + .4, 1, E.arrive]]);
      S.bow = pose(t, [[Lg - .08, 0], [Lg + .05, 30 * f, E.arrive], [Lg + .16, 27 * f], [Lg + .45, 0, E.doux]]); S.vib = 3; } });
    if (t > tLimp) { const d = t - tLimp; S.curl = lerp(.14, .42, E.arrive(seg(d, 0, .3))); S.rot = .22 * Math.exp(-d * 2.6) * Math.sin(d * 9.5); S.wy -= 2 * E.arrive(seg(d, 0, .3)); S.sag = 3 + 16 * E.arrive(seg(t, tOut, tOut + .4)) + 5 * Math.exp(-d * 2) * Math.sin(d * 11); }
    return S;
  }

  // ---------- une poche et sa corde, du guichet a la main (repere de la poche, a l'echelle K) ----------
  function cote(P, S, t, cz) {
    const z0 = Z; Z = cz * K; const lw = LW(), wy = S.wy;
    X.save(); X.translate(P.x, PY0); X.scale(K, K);
    const A = [(BX + P.cote * 66 * BS - P.x) / K, (BY + 30 * BS - PY0) / K], P3 = [0, Math.min(-6, wy - 4) + S.jolt];
    const d = Math.hypot(P3[0] - A[0], P3[1] - A[1]), a = Math.atan2(P3[1] - A[1], P3[0] - A[0]);
    const pts = cubic(A, [A[0] + Math.cos(a) * d * .42, A[1] + Math.sin(a) * d * .42 + S.sag + S.bow], [P3[0] + S.bow * .5, P3[1] - Math.min(92, 40 + d * .1) - S.bow * .2], P3, 26);
    if (S.vib) for (let i = 1; i < 26; i++) pts[i][1] += S.vib * Math.sin(Math.PI * i / 26) * Math.sin(t * 58 + i * .55);
    pts.push([0, (P3[1] + S.jolt + wy) / 2], [0, S.jolt + wy - 3]);
    const tr = S.travel, ourlet = () => { X.beginPath(); X.roundRect(-PW / 2 - 3, 0, PW + 6, 15, 4); };
    const contour = () => { pocketPath(0); X.strokeStyle = INK; X.lineWidth = lw; X.lineJoin = 'round'; X.stroke(); pocketPath(7); X.setLineDash([5, 5]); X.lineWidth = lw * .5; X.globalAlpha = .8; X.stroke(); pocketPath(12); X.stroke(); X.setLineDash([]); X.globalAlpha = 1;
      X.beginPath(); X.ellipse(0, 2, 13, 4.5, 0, 0, Math.PI); X.lineWidth = lw * 1.3; X.stroke(); };
    // la corde, derriere la poche
    if (tr === undefined || tr > .004) { const q = tr !== undefined ? cutTo(pts, tr) : pts; if (q.length > 1) { smooth(jit(q, P.seed, .45)); X.strokeStyle = INK; X.lineWidth = 4.2; X.globalAlpha = .55; X.lineCap = 'round'; X.stroke(); X.globalAlpha = 1; } }
    X.save(); X.translate(0, S.jolt); pocketPath(0); X.fillStyle = BLK; X.fill(); ourlet(); X.fill(); X.strokeStyle = INK; X.lineWidth = lw; X.stroke(); X.restore();
    if (tr !== undefined) {          // la main est partie avec la prise : poche vide ; les pieces suivent la main avec retard
      X.save(); X.translate(0, S.jolt); coins({ seed: P.seed }, S.lv); contour(); X.restore();
      if (tr > .004) { const pr = 1 - tr;
        for (let k = 6; k >= 1; k--) { const uu = tr + k * .045 * Math.max(0, 1 - pr * 2.6); if (uu >= 1) continue; const q = along(pts, uu); X.save(); X.translate(q.x + sh(P.seed, k, 40) * 5, q.y + sh(P.seed, k, 41) * 5); X.rotate(q.a + sh(P.seed, k, 42)); X.beginPath(); X.ellipse(0, 0, 10, 4.5, 0, 0, 7); X.fillStyle = INK; X.fill(); X.strokeStyle = BLK; X.lineWidth = 1.5; X.stroke(); X.restore(); }
        const q = along(pts, tr); X.beginPath(); X.ellipse(q.x + Math.cos(q.a) * 34, q.y + Math.sin(q.a) * 34, 24, 16, q.a, 0, 7); X.fillStyle = INK; X.fill(); X.strokeStyle = BLK; X.lineWidth = 1.5; X.stroke();
        hand(q.x, q.y, 1.3, { curl: 1, rot: q.a - Math.PI / 2 }, P.seed); }
      X.restore(); Z = z0; return;
    }
    tube(pts.slice(Math.floor(pts.length * .8)), 15 * S.thin, P.seed);
    if (S.knot) { X.save(); X.translate(0, S.jolt - 16 + (wy + 6)); X.lineCap = 'round';        // le noeud : il ne passe pas l'oeillet
      X.beginPath(); X.ellipse(9, -1, 10, 8, -.5, 0, Math.PI * 2); X.strokeStyle = INK; X.lineWidth = 15 * .62 + 2 * lw; X.stroke(); X.strokeStyle = BLK; X.lineWidth = 15 * .62; X.stroke();
      X.beginPath(); X.moveTo(-3, -7); X.lineTo(3, 7); X.strokeStyle = INK; X.lineWidth = 15 + 2 * lw; X.stroke(); X.strokeStyle = BLK; X.lineWidth = 15; X.stroke(); X.restore(); }
    const dive = S.curl > .6 && wy > 0, hy = S.jolt + wy;
    if (dive && !S.loot) hand(0, hy, 1.3, S, P.seed);
    X.save(); X.translate(0, S.jolt); coins({ seed: P.seed }, S.lv); X.restore();
    if (S.loot) { X.beginPath(); X.ellipse(1, hy + 38, 24, 16, 0, 0, 7); X.fillStyle = INK; X.fill(); X.strokeStyle = BLK; X.lineWidth = 1.5; X.stroke();
      for (let k = 0; k < 4; k++) { const dd = (t - tGrab - .2 - k * .07) * 1.6; if (dd > 0 && dd < 1) { X.beginPath(); X.ellipse(sh(P.seed, k, 50) * 16, hy + 46 + dd * dd * 90, 8, 3.6, sh(P.seed, k, 51) + dd * 5, 0, 7); X.fillStyle = INK; X.fill(); X.stroke(); } } }     // quelques pieces retombent
    if (!dive || S.loot) hand(0, hy, 1.3, S, P.seed);
    X.save(); X.translate(0, S.jolt); contour(); X.restore();
    X.restore(); Z = z0;
  }

  // ---------- le guichet du site (fictif) et le bras raye du pirate ----------
  const ecrase = (t, t0) => { const d = t - t0; return d < 0 || d > .5 ? 0 : pose(d, [[0, 0], [.05, 1, E.arrive], [.26, -.12, E.doux], [.42, 0, E.doux]]); };
  function brasTip(t) {
    if (t < T4 + .1 || t > tOut + .45) return null;
    const y = pose(t, [[T4 + .1, -1100], [K1 - .12, -318, E.arrive], [tHit - .22, -306, E.derive], [tHit - .1, -350, E.arrive], [tHit, ROOF + 30, bez(.7, 0, 1, .5)], [tOut - .14, ROOF + 30], [tOut, ROOF + 44, E.arrive], [tOut + .38, -2300, bez(.7, 0, .9, .4)]]);
    const curl = t > tOut ? pose(t, [[tOut, 1], [tOut + .16, .05, E.arrive]]) : pose(t, [[K1 - .2, 0], [tHit - .1, .3], [tHit - .02, 1, E.sec]]);
    return { x: 6, y, curl };
  }
  // les rayures defilent tant que le pirate tire : la matiere qui file donne le sens du flux
  const flux = t => 150 * (clamp(t, tHit + .3, tLimp) - tHit - .3) + 300 * E.doux(seg(t, tGrab, tGrab + .5)) + 240 * E.doux(seg(t, tLump, tLump + .6))
    + LUN.reduce((s, Lg, i) => s + [70, 110, 160][i] * E.doux(seg(t, Lg, Lg + .3)), 0) + 560 * E.pars(seg(t, tOut, tOut + .38));
  function bras(tip, sc, t) {
    const w = 30 * sc, O = [tip.x + 760 * sc, tip.y - 1750 * sc], d = t - tHit, wave = d > 0 ? 70 * Math.exp(-d * 3.4) * Math.sin(d * 13) : 0;
    const pts = cubic(O, [tip.x + 640 * sc, tip.y - 900 * sc], [tip.x + 30 * sc + wave, tip.y - 430 * sc], [tip.x, tip.y - 2], 34);
    const p = jit(pts, 7005, .8), lw = Math.max(LW(), 3 * sc * .6); X.lineCap = 'butt'; X.lineJoin = 'round';
    smooth(p); X.strokeStyle = INK; X.lineWidth = w + 2 * lw; X.stroke();
    smooth(p); X.strokeStyle = BLK; X.lineWidth = w; X.stroke();
    smooth(p); X.setLineDash([22 * sc, 26 * sc]); X.lineDashOffset = -flux(t) * sc; X.strokeStyle = INK; X.stroke(); X.setLineDash([]); X.lineDashOffset = 0;
    return pts;
  }
  function guichet(t, cz) {
    const z0 = Z; Z = cz * BS; const lw = LW(), sq0 = ecrase(t, tHit), sq = sq0 + .4 * ecrase(t, tLump) + .25 * ecrase(t, tUse + .26) + .3 * ecrase(t, tOut);
    X.save(); X.translate(BX, BY); X.scale(BS, BS);
    const tip = brasTip(t);
    if (tip) { X.save(); X.beginPath(); X.rect(-3000, -6000, 6000, 6000 + ROOF + (t >= tHit ? 15 * sq0 : 300)); X.clip();
      const pts = bras(tip, AS, t);
      const u = seg(t, tLump, tLump + 1.5); if (u > 0 && u < 1) { const q = along(pts, 1 - .012 - Math.pow(u, 1.7)); X.save(); X.translate(q.x, q.y); X.rotate(q.a); X.beginPath(); X.ellipse(0, 0, 37 * AS, 30 * AS, 0, 0, 7); X.fillStyle = INK; X.fill(); X.strokeStyle = BLK; X.lineWidth = 3; X.stroke(); X.restore(); }     // la prise remonte le bras
      if (t < tHit + .1 || t > tOut) hand(tip.x, tip.y - 6, 2.3 * AS, { curl: tip.curl, strain: 2 * (1 - tip.curl) }, 4242);      // il arrive le poing ferme ; il repart la main vide
      X.restore(); }
    X.translate(0, 108); X.scale(1 + .1 * sq, 1 - .13 * sq); X.translate(0, -108);
    const J = (pts, s) => jit(pts, 9450 + s, .7); X.lineJoin = 'round'; X.lineCap = 'round'; X.strokeStyle = INK; X.lineWidth = lw; X.fillStyle = BLK;
    trace(J([[-88, 92], [88, 92], [88, 108], [-88, 108]], 1), true); X.fill(); X.stroke();
    trace(J([[-72, -62], [72, -62], [72, 92], [-72, 92]], 2), true); X.fill(); X.stroke();
    trace(J([[-96, -62], [-66, -112], [66, -112], [96, -62]], 3), true); X.fill(); X.stroke();
    const sh0 = E.pars(seg(t, tHit, tHit + .1));          // guichet allume tant que le site est a lui ; le rideau tombe avec le coup
    X.beginPath(); X.moveTo(-42, 34); X.lineTo(-42, -16); X.quadraticCurveTo(-42, -40, 0, -40); X.quadraticCurveTo(42, -40, 42, -16); X.lineTo(42, 34); X.closePath();
    X.fillStyle = INK; X.fill(); X.save(); X.clip(); X.fillStyle = BLK; X.fillRect(-44, -42, 88, 78 * sh0);
    if (sh0 > 0) { X.strokeStyle = INK; X.lineWidth = lw * .6; for (let i = 0; i < 6; i++) { const yy = -42 + 78 * sh0 - 6 - i * 12; X.beginPath(); X.moveTo(-44, yy); X.lineTo(44, yy); X.stroke(); } }
    X.restore(); X.strokeStyle = INK; X.lineWidth = lw; X.stroke();
    trace(J([[-54, 36], [54, 36]], 4)); X.lineWidth = lw * 1.6; X.stroke(); X.lineWidth = lw;
    X.beginPath(); X.moveTo(-30, 62); X.lineTo(30, 62); X.stroke();
    if (t >= tHit) { X.lineWidth = lw * .8; for (const [dx, dy] of [[-38, 14], [-24, 26], [30, 20], [44, 9]]) { X.beginPath(); X.moveTo(6 + Math.sign(dx) * 22, -112); X.lineTo(6 + dx + Math.sign(dx) * 14, -112 + dy); X.stroke(); } }
    X.restore(); Z = z0;
  }

  // ---------- la typographie : dans le monde, elle bouge avec la camera ; elle arrive sur le mot, avec de la masse ----------
  const larg = (s, px) => { X.font = `700 ${px}px Montserrat`; return X.measureText(s).width; };
  const enLigne = (num, cx, sn, su) => { const wn = larg(num, sn), wu = larg('DUSDC', su), w = wn + sn * .2 + wu; return [cx - w / 2 + wn / 2, cx + w / 2 - wu / 2]; };     // « 50 DUSDC » centre : centres du nombre et de l'unite
  const NB = 96, UN = 56, YB = 808;                 // soldes du tableau : corps du nombre, de l'unite, ligne de base
  function textes(t) {
    { const s = 1 - E.pars(seg(t, K2 - 1.02, K2 - .86)); if (s > .02) T("le site d'échange (fictif)", 800, 44, 34 * s, { al: 'right', a: .85 }); }
    if (t >= tHit + .02 && t < K2 - .15) { X.save(); X.translate(BX, 318); X.rotate(-.07); frappe('PIRATÉ', 0, 0, 122, t, tHit + .02, { stroke: 12, de: 3.2 }); X.restore(); }
    // le solde de gauche : pose sous la poche, il grossit avec le gros plan, tombe a 0, puis retourne sous la poche
    if (t >= tTab - .1) { const [n50, u50] = enLigne('50', PG.x, NB, UN), [n0, u0] = enLigne('0', PG.x, NB, UN);
      const k = t < tExG ? E.glisse(seg(t, K2 - .9, K2 - .25)) : 1 - E.glisse(seg(t, tExG, tExG + .45)), xa = t < tExG ? n50 : n0, ua = t < tExG ? u50 : u0;
      const xn = lerp(xa, CGX, k), yn = lerp(YB, 650, k), pn = lerp(NB, 165, k), xu = lerp(ua, CGX, k), yu = lerp(YB, 704, k), pu = lerp(UN, 46, k);
      if (t >= tZero) frappe('0', xn, yn, pn, t, tZero, { de: 2.3 });
      else if (t > tGrab + .1) { const kr = E.pars(seg(t, tGrab + .1, tZero)), v = Math.max(1, Math.round(50 * (1 - kr))); T(String(v), xn + sh(v, 7, 2) * 5, yn + sh(v, 7, 1) * 10 + 26 * kr, pn * (1 + .2 * kr)); }      // le compte tombe
      else frappe('50', xn, yn, pn, t, tTab - .1, { de: 2.3 });
      frappe('DUSDC', xu, yu, pu, t, tTab - .04, { de: 2 }); }
    if (t >= tTab + .04 && t < K2 - .3) { const [dn, du] = enLigne('50', PD.x, NB, UN); frappe('50', dn, YB, NB, t, tTab + .04, { de: 2.3 }); frappe('DUSDC', du, YB, UN, t, tTab + .1, { de: 2 }); }
    // gros plan de gauche
    if (t >= tSans && t < tExG + .2) { const s = 1 - E.pars(seg(t, tExG, tExG + .16)); if (s > .02) { frappe('SANS HOLD UP', CGX, 432, 56 * s, t, tSans, { de: 2.8 }); if (t >= tSans + .16) frappe('COMPTE', CGX, 500, 27 * s, t, tSans + .16, { a: .8 }); } }
    // gros plan de droite : le droit de 50 part a l'echange, il reste 0
    if (t >= tAvec && t < tExD + .3) { const dx = -1100 * E.pars(seg(t, tExD, tExD + .26));
      frappe('AVEC HOLD UP', CDX + dx, 432, 56, t, tAvec, { de: 2.8 });
      if (t >= tDroit) frappe('DROIT DE PRENDRE', CDX + dx, 500, 27, t, tDroit, { a: .8 });
      if (t >= t50) { frappe('DUSDC', CDX + dx, 704, 46, t, t50 + .06, { de: 2 });
        if (t < tUse) frappe('50', CDX, 650, 165, t, t50, { de: 2.5 });
        else if (t < tUse + .26) { const k = E.pars(seg(t, tUse, tUse + .26)); T('50', lerp(CDX, BX, k), lerp(650, BY + 20, k), lerp(165, 22, k)); }
        if (t >= tD0) frappe('0', CDX + dx, 650, 165, t, tD0, { de: 2.5 }); } }
    // la fin : rien pour le pirate ; le tableau des deux fins
    if (t >= tRien) frappe('RIEN', 1240, 590, 112, t, tRien, { stroke: 10, de: 2.9 });
    if (t > tRien + .1) { T('SANS HOLD UP', PG.x, 100, 56); T('AVEC HOLD UP', PD.x, 100, 56); }
    if (t >= tBal) { const [dn, du] = enLigne('50', PD.x, NB, UN); frappe('50', dn, YB, NB, t, tBal, { de: 2.5 }); frappe('DUSDC', du, YB, UN, t, tBal + .06, { de: 2 }); }
  }

  const vif = t => (t > tHit - .12 && t < tHit + .12) || (t > tGrab - .34 && t < tGrab + .4) || (t > tGo && t < tGo + GO) || (t > tUse && t < tUse + .3) || (t > tExD && t < tExD + .28) || (t > tOut && t < tOut + .4) || LUN.some(Lg => t > Lg - .06 && t < Lg + .1);
  acte({ id: 's4', draw(t) {
    const z00 = Z;
    X.save(); const fo = t < T4 + RACC ? fouetIn(t, T4, RACCORDS.T4) : t > T5 - RACC ? fouetOut(t, T5, RACCORDS.T5) : [0, 0]; X.translate(fo[0], fo[1]);
    X.save(); const sk = secousse(t), c = CAM.apply(t, sk[0], sk[1]);
    cote(PG, etatG(t), t, c.z); cote(PD, etatD(t), t, c.z);
    guichet(t, c.z);
    textes(t);
    X.restore();
    mention('Dessin. Soldes lus sur la chaîne locale par preuve_piratage.mjs (copie d\'Avalanche, argent fictif)', .7);
    X.restore(); Z = z00;
    flash(t, tHit, .6); flash(t, tZero, .45); flash(t, tRien, .3);
  }, blur: t => enFouet(t, T4, T5) ? 6 : Math.max(CAM.blur(t), vif(t) ? 4 : 1) });

  // ---------- reperes sonores : chaque evenement visuel fort a son son, au meme temps que l'image ----------
  cue(T4, 'whoosh', { d: .4 }); cue(T4 + .12, 'arrive'); cue(T4 + .62, 'tap');
  cue(tHit - .45, 'silence', { d: .42 }); cue(tHit, 'coup'); cue(tHit, 'impact', { g: 1.3 }); cue(tHit + .03, 'rideau'); cue(tHit + .32, 'tension', { d: .9 });
  cue(tTab - .1, 'tic', { g: .9 }); cue(tTab + .04, 'tic', { g: .9 });
  cue(K2 - .85, 'whoosh', { d: .55 }); cue(tSans, 'toc', { g: 1 }); cue(tTend, 'tension', { d: .45 });
  cue(tGrab - .46, 'etire', { d: .5 }); cue(tGrab + .03, 'poignee', { n: 2, g: 1.2 }); cue(tGrab + .12, 'defile', { d: tZero - tGrab - .12 });
  cue(tZero, 'impact', { g: 1.4 }); cue(tZero, 'boum', { g: 1 });
  cue(tGo, 'whoosh', { d: GO + .1 }); cue(tLump, 'prise', { g: 1, pan: 0 }); cue(tLump + .3, 'whoosh', { d: .6 });
  cue(tAvec, 'toc', { g: 1 }); LUN.forEach((s, i) => cue(s + .04, 'bute', { g: [.7, .9, 1.15][i] }));
  cue(tDroit, 'tic', { g: .8 }); cue(t50, 'impact', { g: 1 }); cue(tUse, 'whoosh', { d: .28 }); cue(tUse + .26, 'toc', { g: .8 }); cue(tD0, 'impact', { g: 1.15 });
  cue(LUN[1] - .2, 'tension', { d: 1.1 }); cue(tLimp, 'renonce');
  cue(tRien - .5, 'silence', { d: .46 }); cue(tRien, 'impact', { g: 1.5 }); cue(tOut, 'retire'); cue(tBal, 'toc', { g: 1.1 }); cue(T5 - RACC, 'whoosh', { d: .4 });
  menace(T4, tLimp);             // tenue grave sous la menace ; elle cesse quand la main renonce
  // ---------- images cles ----------
  cle('s4_coup', tHit + .1); cle('s4_zero', tZero + .2); cle('s4_droit', tD0 + .3); cle('s4_rien', tRien + .2); cle('piratage', tBal + .3);
})();
