// actes/s6.js : SCENE 6, de T6 a T7. La mesure, sur le moteur de comparaison (PAS l'extension) : jeu aveugle de 250 cas, ouvert une seule fois.
// Voix : m1 « Deux cent cinquante cas. Écrits sans voir nos règles. » m2 « Quatre-vingt-sept pour cent des demandes dangereuses : signalées. »
//        m3 « Sans la phrase de l'utilisateur : soixante-cinq. »
// Chiffres (METRIQUES.md 1.1 et research/titouan/T_banc_e2e/blind_decalage/run/RESULTAT.md) : 131/150 = 87 % avec la phrase ; 97/150 = 65 % sans ;
// 15/100 = 15 % d'alertes a tort, objectif de 10 % manque. Aucune prise d'ecran : tout est dessine.
// Un seul monde, une camera qui s'y deplace (mkCam, la camera de l'ouverture) : deux poings tiennent chacun une gerbe de cordes. Le bras raye (le pirate) tient
// les 150 demandes dangereuses, le bras nu les 100 honnetes. Une demande signalee = un noeud sur la corde : la main bute. Non signalee : la main passe et vide la poche.
// Tout est local a ce bloc : rien ne fuit vers les autres scenes.
'use strict';
(() => {
  const D = L.m1.debut, M2 = L.m2.debut, M3 = L.m3.debut;
  const SX = 150, SY = 190, XB = 3200, XM = 1375, LIFT = 534, FIST_Y = -1780, GRIP_Y = -1570, EYE = { x: XM, y: -3400 };
  const sm = (x, a, b) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
  const pulse = d => d < 0 || d > .3 ? 0 : (1 - d / .3) * (1 - d / .3);

  // ---------- le monde : 150 poches sous le bras raye, 100 sous le bras nu ----------
  function champ(ox, cols, rows, hors, id) {
    const ps = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { if (hors(c, r)) continue; const k = r * cols + c;
      ps.push({ c, r, k, id, seed: 7000 + id * 1000 + k, x: ox + (c - (cols - 1) / 2) * SX + (r % 2 ? SX / 4 : -SX / 4) + sh(k, id, 31) * 11, y: (r - 3.5) * SY - 62 + sh(k, id, 32) * 9, sag0: 20 + hash(k, id, 33) * 34, ph: hash(k, id, 34) * 6.3 }); }
    ps.sort((a, b) => b.y - a.y);                        // du bas vers le haut : les poches du haut couvrent les cordes de celles du bas
    return { ox, id, ps, gx: ox, gy: GRIP_Y };
  }
  const FA = champ(0, 19, 8, (c, r) => r === 7 && (c === 0 || c === 18), 0);
  const FB = champ(XB, 13, 8, (c, r) => (r === 0 || r === 7) && (c === 0 || c === 12), 1);
  const at = (F, c, r) => F.ps.find(p => p.c === c && p.r === r);
  const H1 = at(FA, 9, 4), N1 = at(FA, 10, 4), H2 = at(FA, 16, 4);

  // ---------- les temps : chaque evenement arrive sur le mot, ou juste avant ----------
  const T250 = D + .02;                       // « Deux cent cinquante » : le nombre tombe
  const TSPLIT = tMot('m1', 3) - .12;         // « cas. » : 250 = 150 + 100
  const TBAND = tMot('m1', 5) - .06;          // « sans voir » : le bandeau
  const TMOT2 = tMot('m1', 8) - .08;          // « règles. »
  const TW1 = M2 - .46;                       // le coup, en gros plan, avant le chiffre
  const N87 = M2 + .05;
  const TR2 = tMot('m2', 5) - .1, TR3 = tMot('m2', 6) - .06;      // « dangereuses », « signalées » : elles retentent, plus fort
  const TB = M2 + 2.96, N15 = TB + .17;       // les 100 honnetes, dans le silence qui suit
  const TRIP = tMot('m3', 2), TU = TRIP + .2, TS2 = TU + .3;      // « la phrase » : on l'arrache, le noeud se defait, la main plonge
  const N65 = tMot('m3', 5) - .05;

  // ---------- les roles, tires au sort une fois (hash) : 19 passent, 34 ne tiennent que par la phrase, 97 tiennent sans elle ----------
  N1.role = 'passe'; H2.role = 'phrase';
  for (const [c, r] of [[9, 4], [8, 4], [15, 4], [17, 4], [15, 5], [16, 5], [17, 5], [16, 3]]) at(FA, c, r).role = 'tient';
  FA.ps.filter(p => !p.role).sort((a, b) => hash(a.k, 61) - hash(b.k, 61)).forEach((p, i) => { p.role = i < 18 ? 'passe' : i < 18 + 33 ? 'phrase' : 'tient'; });
  [...FB.ps].sort((a, b) => hash(a.k, 62) - hash(b.k, 62)).forEach((p, i) => { p.role = i < 15 ? 'tort' : 'juste'; });
  const nb = (F, r) => F.ps.filter(p => p.role === r).length;
  if (FA.ps.length !== 150 || FB.ps.length !== 100 || nb(FA, 'passe') !== 19 || nb(FA, 'phrase') !== 34 || nb(FA, 'tient') !== 97 || nb(FB, 'tort') !== 15)
    console.error(`s6 : comptes faux (${FA.ps.length}, ${FB.ps.length}, ${nb(FA, 'passe')}, ${nb(FA, 'phrase')}, ${nb(FA, 'tient')}, ${nb(FB, 'tort')})`);
  const far = (ps, q) => Math.max(...ps.map(p => Math.hypot(p.x - q.x, p.y - q.y)));
  const m1 = far(FA.ps, H1), m2 = far(FA.ps, H2), mb = far(FB.ps, { x: XB, y: 0 });
  for (const p of FA.ps) {
    p.t1 = p === H1 || p === N1 ? TW1 : TW1 + .2 + Math.pow(Math.hypot(p.x - H1.x, p.y - H1.y) / m1, .85) * .62 + sh(p.k, 5) * .035;     // la vague part du gros plan
    p.t2 = p === H2 ? TS2 : TS2 + .24 + Math.pow(Math.hypot(p.x - H2.x, p.y - H2.y) / m2, .85) * .55 + sh(p.k, 6) * .03;
    p.tu = p === H2 ? TU : p.t2 - .26;
    p.essais = [p.t1, TR2 + sh(p.k, 7) * .03, TR3 + sh(p.k, 8) * .025];
    p.go = .42 + Math.hypot(p.x - FA.gx, p.y - FA.gy) / 4200;
  }
  for (const p of FB.ps) p.tb = TB + .02 + Math.pow(Math.hypot(p.x - XB, p.y) / mb, .85) * .3 + sh(p.k, 9) * .03;
  const KNOTTED = FA.ps.filter(p => p.role !== 'passe'), PHRASE = FA.ps.filter(p => p.role === 'phrase');
  const compte = t => KNOTTED.filter(p => p.t1 <= t).length - PHRASE.filter(p => p.t2 + .12 <= t).length;       // demandes signalees a l'instant t

  // ---------- etat d'une poche a l'instant t ----------
  function etat(p, t) {
    const S = { lv: 1, wy: 2, curl: .14, strain: 0, rot: 0, jolt: 0, bow: 0, knot: false, loot: false, tr: undefined, ring: 0, mark: false, seed: p.seed };
    if (p.id === 1) {                                    // honnetes : la main est chez elle ; 15 butent sur un noeud qui n'avait pas lieu d'etre
      const d = t - p.tb;
      if (p.role === 'tort') { S.knot = true; S.wy = -6; const r = tries(t, [p.tb], 1.7); S.wy += r.wy; S.strain = r.strain; S.curl = r.curl; S.jolt = r.jolt * 1.6; S.bow = r.bow; S.ring = pulse(d - .04); S.mark = d > .05; }
      else if (d > -.18 && d < .25) { S.strain = pose(d, [[-.18, 0], [-.04, -5, E.arrive], [.03, 1.5, E.pars], [.2, 0, E.arrive]]); S.wy += pose(d, [[-.18, 0], [-.04, -2.5, E.arrive], [.03, .8, E.pars], [.2, 0, E.arrive]]); S.jolt = pose(d, [[0, 0], [.05, 3, E.arrive], [.22, 0, E.doux]]); }
      return S;
    }
    if (p.role !== 'passe' && t < p.tu) {                // nouee : elle tire, le noeud tient
      S.knot = true; S.wy = -6; const r = tries(t, p.essais, 1.25); S.wy += r.wy; S.strain = r.strain; S.curl = r.curl; S.jolt = r.jolt; S.bow = r.bow;
      for (const e of p.essais) S.ring = Math.max(S.ring, pulse(t - e - .04));
      if ((p === H1) && t < TW1 - .05) S.wy -= 8 * sm(t, TW1 - .6, TW1 - .22);       // elle se ramasse
      return S;
    }
    const ts = p.role === 'passe' ? p.t1 : p.t2;         // libre : elle descend jusqu'au fond et emporte tout
    if (p.role === 'phrase') { const d = t - p.tu; S.wy = lerp(-6, 2, E.arrive(seg(d, 0, .22))); S.rot = .2 * Math.exp(-d * 5) * Math.sin(d * 13); }
    if (p === N1 && t < TW1 - .05) S.wy -= 8 * sm(t, TW1 - .6, TW1 - .22);
    if (t > ts - .2) {
      S.wy = pose(t, [[ts - .2, S.wy], [ts - .07, -7, E.arrive], [ts + .03, 78, E.pars], [ts + .14, 79], [ts + .4, -64, E.pars]]);
      S.curl = pose(t, [[ts - .2, .14], [ts - .07, 0, E.arrive], [ts - .02, 0], [ts + .06, 1, E.sec]]);
      S.lv = 1 - E.pars(seg(t, ts + .1, ts + .34)); S.loot = t > ts + .1;
      S.jolt = pose(t, [[ts + .02, 0], [ts + .07, 4, E.arrive], [ts + .16, -6, E.doux], [ts + .34, 1.5, E.doux], [ts + .5, 0, E.doux]]);
      if (t > ts + .4) S.tr = 1 - E.pars(seg(t, ts + .4, ts + .4 + p.go));
    }
    return S;
  }
  // le chiffre tombe DANS le champ : les rangs du haut sont souleves d'un coup, ceux du bas encaissent
  const U = d => d <= 0 ? 0 : pose(d, [[0, 0], [.1, 1.1, E.arrive], [.22, .97, E.doux], [.36, 1, E.doux]]);
  const bump = d => d <= 0 || d > .4 ? 0 : pose(d, [[0, 0], [.07, 1, E.arrive], [.4, 0, E.doux]]);
  function leve(p, t) {
    const [cx, tn, a, b] = p.id === 0 ? [0, N87, 800, 1300] : [XB, N15, 640, 1000], ax = Math.abs(p.x - cx), d = t - tn - ax / 9000, f = 1 - sm(ax, a, b);
    let y = p.r <= 3 ? -LIFT * U(d) * f : 22 * bump(d) * f;
    if (p.id === 0) { y += (p.r <= 3 ? -34 : 26) * bump(t - N65 - ax / 9000); y += -16 * bump(t - T250 - .45 - (p.y + 800) / 6000); }       // « 65 » retombe ; le poing tire sur ses cordes
    else y += -16 * bump(t - T250 - .6 - (p.y + 800) / 6000);
    return y;
  }
  function corde(F, p, S, dy, near, t) {
    const A = [F.gx, F.gy], P3 = [p.x, p.y + dy + S.jolt + (near ? S.wy - 32 : -6)], d = Math.hypot(P3[0] - A[0], P3[1] - A[1]);
    const sag = p.sag0 + 9 * Math.sin(t * 2.3 + p.ph) + S.bow;
    return cubic(A, [A[0] + (P3[0] - A[0]) * .42, A[1] + (P3[1] - A[1]) * .42 + sag], [P3[0] + S.bow * .5, P3[1] - Math.min(92, 40 + d * .1) - S.bow * .2], P3, near ? 22 : 10);
  }
  function loin(p, S, dy) {
    const lw = LW(); X.save(); X.translate(p.x, p.y + dy + S.jolt); X.lineJoin = 'round';
    pocketPath(0); X.fillStyle = BLK; X.fill();
    if (S.lv > .004) { X.save(); pocketPath(3); X.clip(); X.fillStyle = INK; X.fillRect(-PW / 2, surfY(S.lv) - 8, PW, PH);
      if (S.mark) { X.strokeStyle = BLK; X.lineWidth = 11; X.lineCap = 'butt'; for (let i = -3; i < 4; i++) { X.beginPath(); X.moveTo(-70 + i * 30, 132); X.lineTo(i * 30 + 62, 0); X.stroke(); } } X.restore(); }
    pocketPath(0); X.strokeStyle = INK; X.lineWidth = lw; X.stroke();
    X.beginPath(); X.roundRect(-PW / 2 - 3, 0, PW + 6, 15, 4); X.fillStyle = BLK; X.fill(); X.stroke();
    if (S.knot) { X.beginPath(); X.arc(5, -16, 11 + 38 * S.ring, 0, 7); X.strokeStyle = INK; X.lineWidth = Math.max(5, 2 / Z) * (1 + S.ring); X.stroke(); }
    X.restore();
  }
  const FLY = [];
  function dessineChamp(F, t, v) {
    const near = Z > .95, cache = [];
    // cordes d'abord (derriere les poches)
    for (const p of F.ps) { const S = etat(p, t), dy = leve(p, t), vu = p.x > v.x0 - 130 && p.x < v.x1 + 130 && p.y + dy > v.y0 - 240 && p.y + dy < v.y1 + 130; cache.push([S, dy, vu]);
      if (S.tr !== undefined && S.tr <= .002) continue;
      if (near && vu && S.tr === undefined) continue;                                             // en gros plan, pk trace la corde de la main
      if (near && (Math.max(F.gx, p.x) < v.x0 - 100 || Math.min(F.gx, p.x) > v.x1 + 100 || p.y + dy < v.y0 - 100)) continue;
      const pts0 = corde(F, p, S, dy, near && vu, t), pts = S.tr !== undefined ? cutTo(pts0, S.tr) : pts0; if (pts.length < 2) continue;
      if (near) { smooth(jit(pts, p.seed, .45)); X.lineWidth = 4.2; X.globalAlpha = .55; } else { trace(pts); X.lineWidth = Math.max(6, 1.15 / Z); X.globalAlpha = clamp(.42 + Z * .9, 0, .95); }
      X.strokeStyle = INK; X.lineCap = 'round'; X.lineJoin = 'round'; X.stroke(); X.globalAlpha = 1;
      if (S.tr !== undefined) FLY.push([p, pts0, S.tr, near]);
    }
    F.ps.forEach((p, i) => { const [S, dy, vu] = cache[i]; if (!vu) return;
      if (!near) { loin(p, S, dy); return; }
      X.save(); X.translate(p.x, p.y + dy + S.jolt); X.scale(.8, .8);
      pk(0, 0, 1.25, { ...S, jolt: 0, hand: S.tr === undefined, cordTo: [F.gx - p.x, F.gy - (p.y + dy + S.jolt)] }); X.restore();
      const ky = p.y + dy + S.jolt + S.wy - 40;
      if (S.ring > 0) { X.beginPath(); X.arc(p.x + 9, ky, 15 + 46 * (1 - S.ring), 0, 7); X.strokeStyle = INK; X.lineWidth = 3.2; X.globalAlpha = S.ring; X.stroke(); X.globalAlpha = 1; }
      if (p.role === 'phrase' && t >= p.tu && t < p.tu + .3) {                                       // le noeud glisse et s'ouvre
        const d = (t - p.tu) / .3, k = E.arrive(d); X.lineCap = 'round'; X.strokeStyle = INK;
        X.beginPath(); X.ellipse(p.x + 9 + 16 * k, ky - 6 * k, 10 + 24 * k, 8 * (1 - k) + .6, -.5 * (1 - k), 0, 7); X.lineWidth = 4.2; X.stroke();
        X.lineWidth = 3; for (let i = 0; i < 5; i++) { const a = -2.6 + i * .55, r0 = 24 + 30 * k, r1 = r0 + 16 * (1 - k); X.beginPath(); X.moveTo(p.x + 9 + Math.cos(a) * r0, ky + Math.sin(a) * r0); X.lineTo(p.x + 9 + Math.cos(a) * r1, ky + Math.sin(a) * r1); X.stroke(); } }
    });
    for (const [p, pts, tr, nr] of FLY) { const q = along(pts, tr);                                  // la main file le long de la corde avec sa prise
      if (!nr) { X.beginPath(); X.arc(q.x, q.y, Math.max(17, 4 / Z), 0, 7); X.fillStyle = INK; X.fill(); continue; }
      X.beginPath(); X.ellipse(q.x + Math.cos(q.a) * 34, q.y + Math.sin(q.a) * 34, 18, 13, q.a, 0, 7); X.fillStyle = INK; X.fill(); X.strokeStyle = BLK; X.lineWidth = 1.5; X.stroke();
      hand(q.x, q.y, 1.3, { curl: 1, rot: q.a - Math.PI / 2 }, p.seed); }
    FLY.length = 0;
  }
  // le bras qui tient la gerbe : raye = le pirate (comme dans l'ouverture), nu = une plateforme honnete
  function bras(F, dir, raye, t) {
    const sc = 3.4, tug = bump(t - T250 - (raye ? .42 : .57)), tip = { x: F.gx + dir * 6, y: FIST_Y - 90 * tug }, w = 30 * sc;
    const pts = jit(cubic([tip.x + dir * 760 * sc, tip.y - 1750 * sc], [tip.x + dir * 640 * sc, tip.y - 900 * sc], [tip.x + dir * 30 * sc, tip.y - 430 * sc], [tip.x, tip.y - 2], 30), 7100 + F.id, .8), lw = Math.max(LW(), 3 * sc * .6);
    X.lineCap = 'butt'; X.lineJoin = 'round'; smooth(pts); X.strokeStyle = INK; X.lineWidth = w + 2 * lw; X.stroke(); smooth(pts); X.strokeStyle = BLK; X.lineWidth = w; X.stroke();
    if (raye) { let flow = t * 60; for (const p of FA.ps) if (p.role !== 'tient') flow += 26 * E.doux(seg(t, (p.role === 'passe' ? p.t1 : p.t2) + .4, (p.role === 'passe' ? p.t1 : p.t2) + .9));
      smooth(pts); X.setLineDash([22 * sc, 26 * sc]); X.lineDashOffset = -flow * sc; X.strokeStyle = INK; X.stroke(); X.setLineDash([]); X.lineDashOffset = 0; }
    hand(tip.x, tip.y - 20, 8.4, { curl: 1 - .25 * tug, strain: 0 }, 4400 + F.id);
  }

  // ---------- « sans voir » : un oeil, puis le bandeau ----------
  function oeil(t) {
    X.save(); X.translate(EYE.x, EYE.y); X.scale(.9, .9); X.lineJoin = 'round'; X.lineCap = 'round';
    const lw = 9, w = 520, cl = 1 - pose(t, [[TBAND - .5, 0], [TBAND - .44, 1, E.sec], [TBAND - .34, 0, E.arrive]]), h = 215 * (.1 + .9 * cl);
    const amande = () => { X.beginPath(); X.moveTo(-w, 10); X.bezierCurveTo(-w * .45, -h * 1.25, w * .45, -h * 1.25, w, 10); X.bezierCurveTo(w * .45, h * 1.05, -w * .45, h * 1.05, -w, 10); X.closePath(); };
    amande(); X.fillStyle = BLK; X.fill(); X.save(); amande(); X.clip();
    const ix = pose(t, [[TBAND - .95, -120], [TBAND - .62, 120, E.glisse], [TBAND - .3, -50, E.glisse], [TBAND - .08, 0, E.doux]]) + wob(91, 1) * 3, iy = -8 + wob(91, 2) * 2;
    X.beginPath(); X.arc(ix, iy, 168, 0, 7); X.fillStyle = BLK; X.fill(); X.strokeStyle = INK; X.lineWidth = lw; X.stroke();
    X.lineWidth = lw * .55; for (let i = 0; i < 26; i++) { const a = i / 26 * 6.283 + sh(i, 92) * .08, r0 = 86 + hash(i, 93) * 16, r1 = 150 + sh(i, 94) * 10; X.beginPath(); X.moveTo(ix + Math.cos(a) * r0, iy + Math.sin(a) * r0); X.lineTo(ix + Math.cos(a) * r1, iy + Math.sin(a) * r1); X.stroke(); }
    X.beginPath(); X.arc(ix, iy, 72, 0, 7); X.fillStyle = INK; X.fill(); X.beginPath(); X.arc(ix - 26, iy - 26, 17, 0, 7); X.fillStyle = BLK; X.fill(); X.restore();
    amande(); X.strokeStyle = INK; X.lineWidth = lw * 1.3; X.stroke();
    X.beginPath(); X.moveTo(-w * .86, -74); X.bezierCurveTo(-w * .4, -h * 1.25 - 88, w * .4, -h * 1.25 - 88, w * .86, -74); X.lineWidth = lw * .7; X.stroke();
    const lid = cubic([-w, 10], [-w * .45, -h * 1.25], [w * .45, -h * 1.25], [w, 10], 12);
    X.lineWidth = lw * .8; for (let i = 2; i <= 10; i++) { const q = lid[i], nx = q[0] / w * .7, n = Math.hypot(nx, 1), len = 52 + hash(i, 96) * 16; X.beginPath(); X.moveTo(q[0], q[1] - 4); X.lineTo(q[0] + nx / n * len + wob(97, i) * 2, q[1] - 4 - len / n); X.stroke(); }
    X.restore();
  }
  function bandeau(t) {
    if (t < TBAND) return; const d = t - TBAND, k = E.arrive(seg(d, 0, .15)), y0 = EYE.y - 4 + 14 * bump(d - .13), xa = EYE.x - 1100, xb = lerp(xa, EYE.x + 560, k), HB = 312;
    const ligne = off => { const o = []; for (let i = 0; i <= 14; i++) { const u = i / 14; o.push([lerp(xa, xb, u), y0 + off - Math.sin(u * 3.1) * 20 * k + wob(95, i) * 1.6]); } return o; };
    X.lineJoin = 'round';
    if (k > .98) for (let i = 0; i < 2; i++) {                                                     // les deux pans du noeud flottent
      const a = (i ? .5 : -.34) + .1 * Math.sin(t * 9 + i * 2), q = []; for (let j = 0; j <= 5; j++) q.push([xb + 40 + j * 62 * Math.cos(a), y0 + j * 62 * Math.sin(a) + Math.sin(t * 11 + j * 1.1 + i) * 5 * j]);
      X.lineCap = 'round'; smooth(q); X.strokeStyle = INK; X.lineWidth = 104; X.stroke(); smooth(q); X.strokeStyle = BLK; X.lineWidth = 86; X.stroke(); }
    X.lineCap = 'butt'; let c = ligne(0); smooth(c); X.strokeStyle = INK; X.lineWidth = HB + 18; X.stroke(); smooth(c); X.strokeStyle = BLK; X.lineWidth = HB; X.stroke();
    X.strokeStyle = INK; X.lineWidth = 5; X.setLineDash([26, 22]); for (const off of [-HB / 2 + 26, HB / 2 - 26]) { c = ligne(off); smooth(c); X.stroke(); } X.setLineDash([]);
    if (k > .98) { X.beginPath(); X.ellipse(xb + 30, y0, 78, 96, .15, 0, 7); X.fillStyle = BLK; X.fill(); X.strokeStyle = INK; X.lineWidth = 9; X.stroke(); X.beginPath(); X.moveTo(xb - 6, y0 - 40); X.quadraticCurveTo(xb + 30, y0, xb + 60, y0 + 52); X.lineWidth = 6; X.stroke(); }
  }

  // ---------- la camera : jamais immobile, chaque deplacement va chercher quelque chose ----------
  const CAMK = [
    [T6, H1.x + 30, H1.y + 45, 2.3],
    [D - .44, H1.x + 60, H1.y + 38, 2.15, E.derive],
    [T250 + .1, XM, -395, .327, bez(.55, 0, .25, 1)],           // recule : les 250, les deux poings
    [TSPLIT + .25, XM, -395, .36, E.derive],
    [TBAND - .22, EYE.x, EYE.y + 30, 1.08, E.glisse],            // monte jusqu'a l'oeil
    [TMOT2 + .12, EYE.x + 14, EYE.y + 30, 1.25, E.derive],
    [TW1 - .26, H1.x + 72, H1.y + 22, 2.7, bez(.75, 0, .15, 1)],  // plonge sur deux poches : une nouee, une libre
    [TW1 + .2, H1.x + 78, H1.y + 28, 2.95, E.derive],
    [N87 + .1, 0, 60, .56, bez(.55, 0, .25, 1)],                 // recule : la vague, le chiffre
    [N87 + .95, 0, -166, .42, E.derive],                         // recule encore : tout le champ, ouvert par le chiffre
    [TR2 - .2, -330, 290, 1.45, E.glisse],                       // descend dans les rangs, les longe
    [TB - .37, 160, 290, 1.62, E.derive],
    [TB, XB, 60, .56, bez(.75, 0, .15, 1)],                      // fouette vers les 100 honnetes
    [M3 - .4, XB + 30, 50, .61, E.derive],
    [M3 - .02, H2.x - 6, H2.y - 62, 3.0, bez(.75, 0, .15, 1)],    // revient : un noeud, la phrase qui le tient
    [TS2 + .2, H2.x + 8, H2.y - 28, 3.3, E.derive],
    [N65 - .1, 0, 60, .56, bez(.55, 0, .25, 1)],
    [N65 + .55, 0, 40, .62, E.derive],
    [N65 + 1.05, 1555, -180, .41, E.glisse],                     // les deux resultats ensemble
    [T7, 1555, -180, .44, E.derive],
  ];
  const ROLL = t => pose(t, [[T6, -.03], [T250, .012, E.glisse], [TBAND, -.02, E.glisse], [TW1, .03, E.glisse], [N87 + .2, -.012, E.glisse], [TR2, .022, E.glisse], [TB, -.015, E.glisse], [M3, .03, E.glisse], [N65, -.012, E.glisse], [T7, .012, E.glisse]]);
  const CAM = mkCam(CAMK, ROLL);
  const SECOUSSES = [[T250, 10], [TBAND + .14, 8], [TW1 + .04, 7], [N87, 18], [TR3 + .04, 7], [N15, 13], [N65, 18]];

  function textes(t) {
    if (t >= T250 && t < TW1 - .3) {                    // 250, puis 150 dangereuses + 100 honnetes
      if (t < TSPLIT) frappe('250', XM, -930, 1000, t, T250, { stroke: 64 });
      else { const k = E.arrive(seg(t, TSPLIT, TSPLIT + .3));
        for (const [str, x0, x1, lab] of [['150', XM - 380, 0, 'demandes dangereuses'], ['100', XM + 420, XB, 'demandes honnêtes']]) {
          T(str, lerp(x0, x1, k), lerp(-930, -985, k), lerp(640, 330, k), { stroke: 44 }); frappe(lab, x1, -815, 132, t, TSPLIT + .24, { stroke: 36, de: 1.9 }); } }
    }
    if (t > TBAND - .9 && t < TW1) {                    // sous l'oeil
      if (t < TMOT2) frappe('JEU AVEUGLE', EYE.x, EYE.y + 288, 150, t, TBAND + .1, { stroke: 22 }); else frappe('OUVERT UNE SEULE FOIS', EYE.x, EYE.y + 270, 88, t, TMOT2, { stroke: 18 });
    }
    if (t >= N87) {                                     // le chiffre vit : il suit le compte des mains arretees
      const n = compte(t);
      if (t < N65) frappe(t < TS2 ? '87 %' : Math.max(65, Math.round(n / 150 * 100)) + ' %', 0, -165, 560, t, N87, { stroke: 46 }); else frappe('65 %', 0, -165, 560, t, N65, { stroke: 46 });
      if (t < N65) frappe(n + ' sur 150', 0, -45, 96, t, N87 + .16, { stroke: 28, de: 1.8 }); else frappe('97 sur 150, sans la phrase', 0, -45, 92, t, N65 + .14, { stroke: 28, de: 1.8 });
    }
    if (t >= N15) { frappe('15 %', XB, -215, 470, t, N15, { stroke: 42 }); frappe("d'alertes à tort", XB, -108, 96, t, N15 + .13, { stroke: 28, de: 1.8 }); frappe('objectif 10 % : manqué', XB, -20, 86, t, N15 + .24, { stroke: 26, de: 1.8 }); }
    if (t > M3 - .3 && t < TRIP + .5) {                 // la phrase de l'utilisateur tient le noeud ; on l'arrache
      const d = t - TRIP - .1, k = d > 0 ? E.pars(seg(d, 0, .3)) : 0, x = H2.x + 4 + 420 * k, y = H2.y - 132 - 260 * k, ky = H2.y + leve(H2, t) - 52;
      if (k < .05) { X.beginPath(); X.moveTo(H2.x + 9, ky); X.quadraticCurveTo(H2.x + 30 + wob(98, 1) * 2, ky - 34, H2.x + 6, y + 9); X.strokeStyle = INK; X.lineWidth = 2.6; X.lineCap = 'round'; X.stroke(); }
      X.save(); X.translate(x, y); X.rotate(.5 * k); frappe('« échanger 50 DUSDC contre AVAX »', 0, 0, 15.5, t, M3 - .2, { stroke: 5, de: 2 });
      const s = E.sec(seg(t, TRIP - .04, TRIP + .07)); if (s > 0) { X.beginPath(); X.moveTo(-138, -5 + wob(99, 1)); X.lineTo(-138 + 276 * s, -6 + wob(99, 2)); X.strokeStyle = INK; X.lineWidth = 3.4; X.lineCap = 'round'; X.stroke(); } X.restore();
    }
  }

  acte({ id: 's6', draw(t) {
    X.save();
    const fi = t < T6 + RACC ? fouetIn(t, T6, 'd') : [0, 0], fo = t > T7 - RACC ? fouetOut(t, T7, 'b') : [0, 0]; let sx = fi[0] + fo[0], sy = fi[1] + fo[1];
    for (const [ts, amp] of SECOUSSES) { const s = shake(t, ts, amp); sx += s[0]; sy += s[1]; }
    X.translate(sx, sy); X.save();
    const c = CAM.apply(t), v = { x0: c.x - W * .56 / c.z, x1: c.x + W * .56 / c.z, y0: c.y - H * .6 / c.z, y1: c.y + H * .66 / c.z };
    if (v.y0 < EYE.y + 500) { oeil(t); bandeau(t); }
    for (const F of [FA, FB]) { if (F.ox + 1700 < v.x0 || F.ox - 1700 > v.x1 || v.y1 < -1500) continue; dessineChamp(F, t, v); }
    if (v.y0 < FIST_Y + 600) { bras(FA, -1, true, t); bras(FB, 1, false, t); }
    textes(t);
    X.restore();
    mention('Moteur de comparaison, jeu aveugle de 250 cas, ouvert une seule fois', .82);
    X.restore();
    flash(t, T250, .3); flash(t, N87, .5); flash(t, N15, .32); flash(t, N65, .5);
  }, blur: t => enFouet(t, T6, T7) ? 6 : CAM.blur(t) });

  // ---------- reperes sonores de la scene ----------
  cue(T6, 'whoosh', { d: .35 }); cue(D - .44, 'souffle', { d: .55 }); cue(T250, 'impact', { g: 1.2 }); cue(T250 + .42, 'tension', { d: .4 });
  cue(TSPLIT + .24, 'toc', { g: .8 }); cue(TSPLIT + .3, 'whoosh', { d: .45 }); cue(TBAND, 'rideau'); cue(TBAND + .13, 'impact', { g: .8 }); cue(TMOT2, 'toc', { g: .9 });
  cue(TW1 - .5, 'plonge', { d: .3 }); cue(TW1 - .22, 'silence', { d: .2 }); cue(TW1 + .04, 'bute', { g: 1 }); cue(TW1 + .03, 'poignee', { g: 1, n: 0 });
  FA.ps.forEach((p, i) => { if (p === H1 || p === N1) return; if (p.role === 'passe') cue(p.t1 + .03, 'prise', { g: .7, pan: clamp(p.x / 1500, -1, 1) }); else if (i % 6 === 0) cue(p.t1 + .04, 'bute', { g: .3 }); });
  cue(N87 - .5, 'riser', { d: .5 }); cue(N87, 'impact', { g: 1.5 }); cue(N87 + .02, 'boum', { g: 1 }); cue(TR2 - .2, 'whoosh', { d: .35 }); cue(TR2 + .04, 'bute', { g: .8 }); cue(TR3 + .04, 'bute', { g: 1 });
  cue(TB - .37, 'whoosh', { d: .4 }); cue(TB + .06, 'tap'); FB.ps.filter(p => p.role === 'tort').forEach((p, i) => { if (i % 3 === 0) cue(p.tb + .04, 'bute', { g: .45 }); }); cue(N15, 'impact', { g: 1.1 });
  cue(M3 - .4, 'whoosh', { d: .4 }); cue(M3 - .2, 'toc', { g: .6 }); cue(TRIP, 'tic', { g: .8 }); cue(TRIP + .1, 'retire'); cue(TU, 'etire', { d: .3 }); cue(TS2 + .03, 'poignee', { g: 1, n: 2 });
  PHRASE.forEach(p => { if (p !== H2) cue(p.t2 + .03, 'prise', { g: .75, pan: clamp(p.x / 1500, -1, 1) }); });
  cue(N65 - .62, 'riser', { d: .6 }); cue(N65, 'impact', { g: 1.5 }); cue(N65 + .02, 'boum', { g: 1 }); cue(N65 + .58, 'souffle', { d: .5 }); cue(T7 - RACC, 'whoosh', { d: .35 });
  // ---------- images cles de la scene ----------
  cle('mesure_250', TSPLIT + .7); cle('mesure_aveugle', TMOT2 - .15); cle('mesure_87', N87 + .6); cle('mesure_15', N15 + .55); cle('mesure_phrase', TRIP - .1); cle('mesure', N65 + .45); cle('mesure_bilan', T7 - .45);
})();
