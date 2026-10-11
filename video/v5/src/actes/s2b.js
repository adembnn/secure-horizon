// actes/s2b.js : SCENE 2b, de T2 a T3. L'autorisation qu'on signe sans la lire ; une sur trois est illimitee.
// Voix : p1 « Chaque plateforme te fait signer une autorisation. » p2 « Presque personne ne la lit. »
//        p3 « Sur Avalanche, trente-quatre pour cent sont illimitées. » p4 « Une sur trois. »
// Un seul monde, une seule camera (celle de l'ouverture, mkCam) : cent poches pendues a leurs cordes.
//   A. fouette d'entree sur MA poche, encore sans main. Une main descend sa corde, un papier au poing : AUTORISATION.
//      La signature se trace (avant « signer »), la main plonge (avant « autorisation »).
//   B. le papier se deroule, interminable ; la camera file avec le rouleau, personne ne lit ; elle bute sur la seule ligne
//      lisible : « montant autorise : illimite » ; un trait d'encre l'entoure pendant le silence.
//   C. recul : cent poches. « 34 % » tombe au milieu et les ecarte ; 34 mains plongent jusqu'au fond et tiennent leur prise,
//      66 butent sur leur noeud. Sur « illimitees », les 34 levent leur prise, en vague.
//   D. plongee sur trois poches voisines : la mienne prend encore, les deux nouees tirent et butent. Sortie fouettee vers le haut.
// Les 34 poches libres sur 100 sont comptees (34,2 % mesure sur Avalanche, METRIQUES.md). Tout est local a ce bloc.
'use strict';
(() => {
  const P2 = L.p2, P3 = L.p3, P4 = L.p4;
  // ---------- temps forts, tous cales sur la voix (l'image precede le mot) ----------
  const T_ARR = T2 + .24;                   // la main arrive, le papier au poing
  const T_SIG = tMot('p1', 4) - .2;         // la signature se trace avant « signer »
  const T_DIVE = tMot('p1', 6) - .14;       // la main plonge avant « autorisation »
  const T_SCR = P2.debut - .2;              // le papier se deroule, la camera file
  const T_LIT = tMot('p2', 4);              // il bute au bout, sur « lit. »
  const T_CIRC = P2.fin + .1;               // le trait entoure « illimite » dans le silence
  const T_BACK = P3.debut - .78;            // recul sur les cent poches
  const T_N = tMot('p3', 2) - .24;          // « 34 % » tombe avant « trente-quatre »
  const T_BL = T_N + .12;                   // il touche : l'onde
  const T_ILL = tMot('p3', 6) - .16;        // « illimitees » : les 34 levent leur prise
  const T_TRIO = P4.debut - .46;            // plongee sur trois poches
  const T_UNE = P4.debut - .06;             // « Une » : la mienne prend encore
  const T_TUG = [tMot('p4', 1), tMot('p4', 2) + .02];   // « sur », « trois » : les deux nouees butent

  // ---------- le champ : cent poches, deux dispositions (serree, puis ecartee par le chiffre) ----------
  const NA = [17, 17, 16, 17, 17, 16], OA = [-.25, .25, 0, -.25, .25, 0], Q = [];
  NA.forEach((n, r) => { for (let c = 0; c < n; c++) { const k = Q.length; Q.push({ k, seed: 2600 + k, ax: (c - (n - 1) / 2 + OA[r]) * PX + sh(k, 31, 1) * 13, ay: (r - 2.5) * PY - 62 + sh(k, 31, 2) * 11 }); } });
  const HERO = Q[17 + 17 + 8]; HERO.hero = true; HERO.free = true;
  const SL = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 21; c++) { if (r >= 2 && r <= 5 && c >= 2 && c <= 18) continue; SL.push({ r, c, x: (c - 10 + (r % 2 ? .25 : -.25)) * PX + sh(r * 21 + c, 32, 1) * 12, y: (r - 3.5) * PY - 62 + sh(r * 21 + c, 32, 2) * 10 }); }
  // qui va ou : au plus pres d'une image « soufflee » depuis le centre, puis echanges tant que le trajet total raccourcit (pas de croisement)
  SL.find(s => s.r === 7 && s.c === 10).q = HERO;
  const ideal = q => { const u = q.ax / 1500, v = (q.ay + 62) / 470, r = Math.hypot(u, v) || 1e-3, g = Math.sqrt(r * r + 1) / r; return [clamp(q.ax * g, -1740, 1740), clamp((q.ay + 62) * g, -720, 720) - 62]; };
  Q.filter(q => !q.hero).map(q => ({ q, i: ideal(q), r: Math.hypot(q.ax / 1500, (q.ay + 62) / 470) })).sort((a, b) => b.r - a.r)
    .forEach(({ q, i }) => { let best = null, bd = 1e18; for (const s of SL) { if (s.q) continue; const d = (s.x - i[0]) ** 2 + (s.y - i[1]) ** 2; if (d < bd) { bd = d; best = s; } } best.q = q; });
  const cout = (q, s) => (s.x - q.ax) ** 2 + (s.y - q.ay) ** 2;
  for (let n = 0, ch = true; ch && n < 60; n++) { ch = false; for (const a of SL) for (const b of SL) { if (a === b || a.q.hero || b.q.hero) continue; if (cout(a.q, b) + cout(b.q, a) < cout(a.q, a) + cout(b.q, b) - 1e-6) { const x = a.q; a.q = b.q; b.q = x; ch = true; } } }
  for (const s of SL) { s.q.bx = s.x; s.q.by = s.y; }
  const enB = (r, c) => SL.find(s => s.r === r && s.c === c).q;
  const TG = enB(7, 9), TD = enB(7, 11); TG.trio = 1; TD.trio = 2; TG.free = TD.free = false;
  // 34 poches libres sur 100 : la mienne, plus 33 tirees au sort (hash) ; les deux voisines du trio sont nouees
  Q.filter(q => !q.hero && !q.trio).sort((a, b) => hash(a.k, 77, 5) - hash(b.k, 77, 5)).forEach((q, i) => { q.free = i < 33; });
  if (Q.length !== 100 || Q.filter(q => q.free).length !== 34) console.error('s2b : compte faux, ' + Q.filter(q => q.free).length + ' libres sur ' + Q.length);
  const ORIG = [[-2900, -1700], [2900, -1700], [-2900, 1700], [2900, 1700]];      // quatre plateformes, hors champ aux quatre coins : les cordes en rayonnent et laissent le centre libre
  for (const q of Q) { q.o = (q.bx < 0 ? 0 : 1) + (q.by + 62 < 0 ? 0 : 2);
    q.dN = Math.hypot(q.ax, q.ay + 62) / 13000; q.dI = q.hero ? .08 : (q.bx + 1750) / 3500 * .4; q.dW = Math.hypot(q.ax - HERO.ax, q.ay - HERO.ay) / 2600; q.sag0 = 30 + hash(q.k, 9) * 50; }
  const ORDRE = [...Q].sort((a, b) => a.by - b.by || a.bx - b.bx);
  const KB = bez(.2, .7, .3, 1);
  function pos(q, t) { const s = T_BL + q.dN; if (t <= s) return [q.ax, q.ay]; const k = pose(t, [[s, 0], [s + .2, 1.06, KB], [s + .44, 1, E.doux]]); return [lerp(q.ax, q.bx, k), lerp(q.ay, q.by, k)]; }

  // ---------- etats des mains ----------
  const REST = surfY(1) - 40, DEEP = 66, TAPS = [T_DIVE + .6, T_DIVE + .82];
  const tape = (S, t, a, f = 1) => { if (t > a - .18 && t < a + .5) { S.strain += f * pose(t, [[a - .18, 0], [a - .04, -5, E.arrive], [a + .03, 1.5, E.pars], [a + .2, 0, E.arrive]]); S.wy += f * pose(t, [[a - .18, 0], [a - .04, -3.5, E.arrive], [a + .03, 1.5, E.pars], [a + .2, 0, E.arrive]]); S.jolt += f * pose(t, [[a, 0], [a + .06, 4, E.arrive], [a + .26, 0, E.doux]]); } };
  function etat(q, t) {
    const S = { lv: 1, wy: q.free ? REST : -6, curl: .14, strain: 0, rot: 0, jolt: 0, bow: 0, knot: !q.free, loot: 0, hand: true, sq: 0 };
    if (q.hero && t < T_SCR) {              // ma poche : la main arrive, tend le papier, attend la signature, plonge
      if (t < T_ARR) { S.hand = false; return S; }
      S.wy = pose(t, [[T_ARR, -340], [T_ARR + .32, -52, bez(.1, .9, .2, 1)], [T_ARR + .46, -66, E.doux], [T_ARR + .68, -62, E.doux], [T_DIVE - .14, -62], [T_DIVE - .02, -78, E.arrive], [T_DIVE + .08, REST + 14, E.pars], [T_DIVE + .17, REST + 14], [T_DIVE + .34, REST - 4, E.doux], [T_DIVE + .5, REST, E.doux]]);
      S.curl = pose(t, [[T_ARR + .2, .5], [T_ARR + .5, .72, E.doux], [T_DIVE - .14, .72], [T_DIVE - .02, 0, E.arrive], [T_DIVE + .1, 0], [T_DIVE + .34, .14, E.doux]]);
      S.strain = pose(t, [[T_DIVE - .14, 0], [T_DIVE - .02, 3, E.arrive], [T_DIVE + .08, 5, E.pars], [T_DIVE + .3, 0, E.arrive]]);
      S.jolt = pose(t, [[T_DIVE + .05, 0], [T_DIVE + .1, 8, E.arrive], [T_DIVE + .22, -5, E.doux], [T_DIVE + .4, 1.5, E.doux], [T_DIVE + .56, 0, E.doux]]);
      S.sq = pose(t, [[T_DIVE + .05, 0], [T_DIVE + .1, 1, E.arrive], [T_DIVE + .28, -.2, E.doux], [T_DIVE + .46, 0, E.doux]]);
      for (const a of TAPS) tape(S, t, a);  // elle tapote : elle est chez elle
      return S;
    }
    tape(S, t, T_BACK + .72 + q.dW, 1.4);   // une vague de tapotements part de ma poche pendant le recul
    const s = T_BL + q.dN;
    if (t < s) { const ins = E.doux(seg(t, T_N - .34, T_N - .04)); S.wy -= 9 * ins; S.curl = lerp(S.curl, 0, ins); S.jolt -= 3 * ins; return S; }   // toutes les mains se levent d'un cran : le souffle avant le chiffre
    if (q.free) {                           // libre : rien n'arrete le bras
      S.wy = pose(t, [[s, REST - 9], [s + .09, DEEP, E.pars], [s + .2, DEEP], [s + .5, REST - 18, E.arrive]]);            // 1. le chiffre tombe : jusqu'au fond, une premiere poignee
      S.curl = pose(t, [[s, 0], [s + .12, 0], [s + .19, 1, E.sec]]); S.loot = t > s + .19 ? 1 : 0;
      S.lv = lerp(1, .7, E.pars(seg(t, s + .2, s + .46)));
      S.jolt = pose(t, [[s + .05, 0], [s + .1, 7, E.arrive], [s + .22, -4, E.doux], [s + .42, 1, E.doux], [s + .56, 0, E.doux]]);
      S.sq = pose(t, [[s + .05, 0], [s + .1, .8, E.arrive], [s + .28, -.15, E.doux], [s + .46, 0, E.doux]]);
      const u = T_ILL + q.dI;               // 2. « illimitees » : elle replonge et sort tout ce qu'elle peut tenir, bien au-dessus de la poche
      if (t > u) { S.wy = pose(t, [[u, REST - 18], [u + .07, REST - 27, E.arrive], [u + .16, 80, E.pars], [u + .25, 80], [u + .48, -74, bez(.3, 0, .2, 1)], [u + .6, -58, E.doux], [u + .76, -62, E.doux]]);
        S.curl = pose(t, [[u + .1, 1], [u + .16, 0, E.sec], [u + .2, 0], [u + .25, 1, E.sec]]); S.loot = t > u + .12 && t < u + .25 ? 0 : t < u + .2 ? 1 : 1.5;
        S.lv = lerp(.7, .3, E.pars(seg(t, u + .25, u + .48)));
        S.jolt = pose(t, [[u + .13, 0], [u + .18, 8, E.arrive], [u + .32, -6, E.doux], [u + .56, 0, E.doux]]);
        S.sq = pose(t, [[u + .13, 0], [u + .18, .9, E.arrive], [u + .36, -.2, E.doux], [u + .54, 0, E.doux]]);
        const d = t - u - .48; if (d > 0) S.rot = .16 * Math.exp(-d * 4) * Math.sin(d * 14); }
      if (q.hero && t > T_UNE - .16) { const a = T_UNE;      // 3. « Une » : la mienne replonge une troisieme fois ; la poche est vide
        S.wy = pose(t, [[a - .16, -62], [a - .04, -82, E.arrive], [a + .07, 84, E.pars], [a + .2, 84], [a + .52, -44, E.arrive], [a + .9, -56, E.doux], [T3, -72, E.derive]]);
        S.curl = pose(t, [[a + .04, 1], [a + .09, 0, E.sec], [a + .13, 0], [a + .19, 1, E.sec]]); S.loot = t > a + .06 && t < a + .19 ? 0 : t < a + .1 ? 1.5 : 2;
        S.lv = lerp(.3, 0, E.pars(seg(t, a + .19, a + .42)));
        S.jolt = pose(t, [[a + .04, 0], [a + .09, 11, E.arrive], [a + .24, -6, E.doux], [a + .44, 2, E.doux], [a + .6, 0, E.doux]]);
        S.sq = pose(t, [[a + .04, 0], [a + .09, 1.3, E.arrive], [a + .28, -.25, E.doux], [a + .46, 0, E.doux]]); S.rot = 0; }
    } else {                                // nouee : elle tire, le noeud l'arrete
      const tg = q.trio ? T_TUG[q.trio - 1] : -9, R = t > tg - .22 && q.trio ? tries(t, [tg], 2.1) : tries(t, [s + .06], 1.5);
      S.wy += R.wy; S.strain = R.strain; S.curl = R.curl; S.jolt = R.jolt; S.bow = R.bow;
      if (q.trio && t > tg + .5) { const d = t - tg - .5; S.curl = lerp(.14, .42, E.arrive(seg(d, 0, .3))); S.rot = .2 * Math.exp(-d * 3.2) * Math.sin(d * 9.5); S.wy -= 2 * E.arrive(seg(d, 0, .3)); }   // elle renonce
    }
    return S;
  }

  // ---------- dessin : corde, poche ----------
  let VIEW = null, TT = 0;
  function cordePts(q) { const S = q.S, A = ORIG[q.o], P3 = [q.P[0], q.P[1] + S.jolt + Math.min(S.wy - 32, -6)];
    const dx = P3[0] - A[0], dy = P3[1] - A[1], d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d;
    const dt = TT - T_BL - q.dN, coup = dt > 0 && dt < .8 ? 46 * Math.exp(-dt * 5) * Math.sin(dt * 24) : 0;       // l'onde du chiffre remonte les cordes
    const out = (-uy * (A[0] + P3[0]) + ux * (A[1] + P3[1])) > 0 ? 1 : -1;      // l'arc tourne le dos au centre du champ
    const sw = out * q.sag0 + 9 * Math.sin(TT * 2.3 - d / 210 + q.k) + coup;
    return cubic(A, [A[0] + ux * d * .45 - uy * sw, A[1] + uy * d * .45 + ux * sw], [P3[0] + S.bow * .5, P3[1] - Math.min(92, 40 + d * .1) - S.bow * .2], P3, Z > .95 ? 26 : 12); }
  function corde(q) { if (!q.S.hand) return; const A = ORIG[q.o]; if (!segInView(A[0], A[1], q.P[0], q.P[1], VIEW)) return;
    const pts = cordePts(q), k = clamp((Z - .6) / 1.2); if (Z > .95) smooth(jit(pts, q.seed, .45)); else trace(pts);
    X.strokeStyle = INK; X.lineWidth = lerp(6, 4.2, k); X.globalAlpha = lerp(.85, .55, k); X.lineCap = 'round'; X.lineJoin = 'round'; X.stroke(); X.globalAlpha = 1; }
  function poche(q) { const S = q.S, lw = LW(), wy = S.wy;
    X.save(); X.translate(q.P[0], q.P[1] + S.jolt); if (S.sq) { X.translate(0, PH); X.scale(1 + .09 * S.sq, 1 - .11 * S.sq); X.translate(0, -PH); }
    X.lineJoin = 'round'; pocketPath(0); X.fillStyle = BLK; X.fill();
    X.beginPath(); X.roundRect(-PW / 2 - 3, 0, PW + 6, 15, 4); X.fillStyle = BLK; X.fill(); X.strokeStyle = INK; X.lineWidth = lw; X.stroke();
    if (S.hand) { const top = Math.min(-6, wy - 34); tube([[0, top], [0, (top + wy - 3) / 2], [0, wy - 3]], 15, q.seed);
      if (S.knot) { X.save(); X.translate(0, -16 + (wy + 6)); X.lineCap = 'round';
        X.beginPath(); X.ellipse(9, -1, 10, 8, -.5, 0, Math.PI * 2); X.strokeStyle = INK; X.lineWidth = 15 * .62 + 2 * lw; X.stroke(); X.strokeStyle = BLK; X.lineWidth = 15 * .62; X.stroke();
        X.beginPath(); X.moveTo(-3, -7); X.lineTo(3, 7); X.strokeStyle = INK; X.lineWidth = 15 + 2 * lw; X.stroke(); X.strokeStyle = BLK; X.lineWidth = 15; X.stroke(); X.restore(); } }
    const dive = S.curl > .6 && wy > 0 && !S.loot;
    if (S.hand && dive) hand(0, wy, 1.3, S, q.seed);
    coins(q, S.lv);
    if (S.hand && S.loot) { X.beginPath(); X.ellipse(1, wy + 38, 24 * S.loot, 16 * S.loot, 0, 0, 7); X.fillStyle = INK; X.fill(); X.strokeStyle = BLK; X.lineWidth = 1.5; X.stroke(); }
    if (S.hand && !dive) hand(0, wy, 1.3, S, q.seed);
    pocketPath(0); X.strokeStyle = INK; X.lineWidth = lw; X.lineJoin = 'round'; X.stroke();
    if (Z > 1.4) { pocketPath(7); X.setLineDash([5, 5]); X.lineWidth = lw * .5; X.globalAlpha = .8; X.stroke(); pocketPath(12); X.stroke(); X.setLineDash([]); X.globalAlpha = 1; }
    X.beginPath(); X.ellipse(0, 2, 13, 4.5, 0, 0, Math.PI); X.strokeStyle = INK; X.lineWidth = lw * 1.3; X.stroke();
    X.restore(); }

  // ---------- le papier : l'autorisation, pendue au bras, qui se deroule sans fin ----------
  const TW = 180, H0 = 116, TH = 640, TH0 = .035, C_ROLL = bez(.55, 0, .9, .6), PLUME = bez(.3, 0, .6, 1);
  const haut = t => t < T_BACK ? pose(t, [[T_SCR - .16, H0], [T_SCR - .02, H0 - 7, E.arrive], [T_LIT, TH, C_ROLL], [T_LIT + .1, TH - 10, E.doux], [T_LIT + .26, TH, E.doux]]) : lerp(TH, 0, E.pars(seg(t, T_BACK, T_BACK + .26)));
  const balance = (t, t0, a, f = 9, am = 3) => t < t0 ? 0 : a * Math.exp(-(t - t0) * am) * Math.sin((t - t0) * f);
  const angle = t => TH0 + balance(t, T_ARR + .3, .42) + balance(t, T_DIVE + .08, -.22, 10, 3.4) + balance(t, T_LIT, .03, 13, 5);
  function dense(P, n = 8) { const o = []; for (let i = 0; i < P.length - 1; i++) { const a = P[Math.max(0, i - 1)], b = P[i], c = P[i + 1], d = P[Math.min(P.length - 1, i + 2)];
    for (let j = 0; j < n; j++) { const u = j / n, u2 = u * u, u3 = u2 * u, f = k => .5 * (2 * b[k] + (c[k] - a[k]) * u + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * u2 + (3 * b[k] - a[k] - 3 * c[k] + d[k]) * u3); o.push([f(0), f(1)]); } } o.push(P[P.length - 1]); return o; }
  const SIG = dense([[36, 102], [40, 84], [48, 76], [52, 90], [46, 104], [56, 96], [64, 82], [70, 86], [68, 100], [78, 94], [86, 84], [92, 96], [100, 90], [108, 84], [114, 98], [124, 90], [134, 86], [150, 92], [164, 82], [150, 104], [112, 110], [70, 108], [128, 103], [168, 99]]);
  const ROND = []; for (let i = 0; i <= 64; i++) { const a = -2.5 + i / 64 * Math.PI * 2 * 1.13, g = 1 + .05 * Math.sin(a * 2.3 + 1) + .07 * (i / 64 - .5); ROND.push([TW / 2 + Math.cos(a) * 74 * g, TH - 67 + Math.sin(a) * 26 * g]); }
  function lignes(ys, y0, y1) {             // lignes illisibles : des mots griffonnes
    X.lineCap = 'round'; X.lineJoin = 'round'; X.strokeStyle = BLK; X.lineWidth = 1.5; X.beginPath();
    for (const y of ys) { if (y < y0 || y > y1) continue; const i = Math.round(y); let x = 14; const end = TW - 14 - (hash(i, 3, 61) < .22 ? 30 + hash(i, 4, 61) * 60 : 0);
      for (let w = 0; x < end - 6; w++) { const len = Math.min(end - x, 7 + hash(i, w, 62) * 20); X.moveTo(x, y); for (let u = 2.2; u <= len; u += 2.2) X.lineTo(x + u, y + sh(i * 97 + w, Math.round(u * 10), 63) * 1.9); x += len + 4.5; } }
    X.stroke(); }
  const YS = [50, 61]; for (let y = 128; y < TH - 122; y += 11) YS.push(y); YS.push(TH - 30, TH - 19);
  function feuille(t) {
    const h = haut(t); if (t < T_ARR || h <= 1) return;
    const S = HERO.S, ax = HERO.P[0] + 15, ay = HERO.P[1] + S.jolt + Math.min(S.wy, 4) - 18;
    X.save(); X.translate(ax, ay); X.rotate(angle(t)); X.lineCap = 'round'; X.lineJoin = 'round';
    X.beginPath(); X.moveTo(-2, -2); X.quadraticCurveTo(2, 10, 15, 19); X.strokeStyle = INK; X.lineWidth = 1.8; X.stroke();        // la ficelle
    X.translate(4, 8);
    trace(jit([[0, 0], [TW, 0], [TW + .5, h], [-.5, h]], 811, .5), true); X.fillStyle = INK; X.fill(); X.strokeStyle = BLK; X.lineWidth = 1.6; X.stroke();
    X.save(); X.beginPath(); X.rect(0, 0, TW, h); X.clip();
    X.beginPath(); X.arc(11, 11, 3.2, 0, 7); X.fillStyle = BLK; X.fill();
    T('AUTORISATION', TW / 2 + 5, 32, 18, { c: BLK });
    X.strokeStyle = BLK; X.lineWidth = 1.6; X.beginPath(); X.moveTo(14, 39); X.lineTo(TW - 14, 39); X.stroke();
    lignes(YS, VIEW.y0 - ay - 60, VIEW.y1 - ay + 60);
    X.strokeStyle = BLK; X.beginPath(); X.moveTo(30, 105); X.lineTo(TW - 10, 105); X.lineWidth = 1.2; X.stroke();
    X.beginPath(); X.moveTo(15, 97); X.lineTo(23, 105); X.moveTo(23, 97); X.lineTo(15, 105); X.lineWidth = 1.9; X.stroke();
    const us = PLUME(seg(t, T_SIG, T_SIG + .42)); if (us > 0) { smooth(cutTo(SIG, us)); X.lineWidth = 2.4; X.stroke(); }
    T('montant autorisé :', TW / 2, TH - 102, 12, { c: BLK });
    T('illimité', TW / 2, TH - 56, 34, { c: BLK });
    const uc = PLUME(seg(t, T_CIRC, T_CIRC + .36)); if (uc > 0) { smooth(cutTo(ROND, uc)); X.strokeStyle = BLK; X.lineWidth = 2.8; X.stroke(); }
    X.restore();
    const r = lerp(13, 4.5, seg(h, H0, TH));                                  // le rouleau, au bas de ce qui est deroule
    X.beginPath(); X.roundRect(-6, h - 4, TW + 12, 2 * r, r); X.fillStyle = INK; X.fill(); X.strokeStyle = BLK; X.lineWidth = 1.6; X.stroke();
    X.beginPath(); X.ellipse(TW + 6 - r * .6, h - 4 + r, r * .42, r * .78, 0, 0, 7); X.stroke();
    X.beginPath(); for (let i = 0; i < 3; i++) { const yy = h - 4 + r + r * .8 * Math.sin(h / 9 + i * 2.1); X.moveTo(6, yy); X.lineTo(TW - 24, yy); } X.lineWidth = .9; X.globalAlpha = .45; X.stroke(); X.globalAlpha = 1;
    X.restore();
  }
  function rouleauFile(t) {                 // une fois signe et roule, le papier remonte la corde : la plateforme le garde
    const a = T_BACK + .26; if (t < a || t > a + .62) return; const pts = cordePts(HERO), q = along(pts, 1 - .995 * E.pars(seg(t, a, a + .6)));
    X.save(); X.translate(q.x, q.y); X.rotate(q.a); X.beginPath(); X.roundRect(-70, -13, 140, 26, 13); X.fillStyle = INK; X.fill(); X.strokeStyle = BLK; X.lineWidth = 1.6; X.stroke(); X.restore(); }

  // ---------- le chiffre : il tombe dans le champ, et le champ s'ecarte ----------
  function chiffre(t) { if (t < T_N) return;
    frappe('34 %', 0, 176, 760, t, T_N, { stroke: 46, de: 2.4 });
    const a = T_N + .55; if (t > a) { const k = E.arrive(seg(t, a, a + .32)); X.save(); X.beginPath(); X.rect(-1450, 226, 2900, 92); X.clip();      // la mention glisse de derriere une ligne : pas de fondu
      T("34,2 % : notre mesure, sur un échantillon de blocs d'Avalanche", 0, 290 + (1 - k) * 96, 68, { stroke: 14 }); X.restore(); } }

  // ---------- camera : celle de l'ouverture ----------
  const HA = [HERO.ax, HERO.ay], HB = [HERO.bx, HERO.by];
  const fp = (lx, ly, wy) => { const ax = HA[0] + 15, ay = HA[1] + Math.min(wy, 4) - 18, c = Math.cos(TH0), s = Math.sin(TH0); return [ax + (4 + lx) * c - (8 + ly) * s, ay + (4 + lx) * s + (8 + ly) * c]; };
  const cSig = fp(TW / 2, 66, -62), cPlu = fp(TW / 2 + 8, 84, -62), cTop = fp(TW / 2, 64, REST), cLit = fp(TW / 2, TH - 68, REST), cMot = fp(TW / 2, TH - 70, REST);
  const roulis = t => pose(t, [[T2, -.035], [T_SIG, .02, E.glisse], [T_DIVE + .2, -.035, E.glisse], [T_LIT, .028, E.glisse], [T_N - .4, -.014, E.glisse], [T_BL + .3, .012, E.glisse], [T_TRIO + .42, -.03, E.glisse], [T3, -.008, E.derive]]);
  const cam = mkCam([
    [T2, HA[0] + 34, HA[1] + 16, 3.0],
    [T_ARR + .55, HA[0] + 46, HA[1] - 14, 3.2, E.derive],
    [T_SIG - .02, cSig[0], cSig[1] + 8, 5.6, E.glisse],                 // pousse sur le papier tendu
    [T_SIG + .46, cPlu[0], cPlu[1] + 4, 5.95, E.derive],                // tient : la plume signe
    [T_DIVE + .2, HA[0] + 30, HA[1] + 36, 3.4, E.glisse],               // redescend avec la main qui plonge
    [T_SCR - .34, HA[0] + 46, HA[1] + 44, 3.55, E.derive],
    [T_SCR, cTop[0], cTop[1] + 9, 5.0, E.glisse],                       // sur le papier, le rouleau lache
    [T_LIT, cLit[0], cLit[1] + 9, 5.2, C_ROLL],                         // file avec le rouleau
    [T_BACK, cMot[0] + 3, cMot[1] + 8, 5.7, E.derive],                  // tient sur le mot qu'on entoure
    [T_N - .42, 0, 60, .64, bez(.55, 0, .25, 1)],                       // recul : cent poches
    [T_BL + .1, 0, 64, .655, E.derive],
    [T_BL + .36, 0, 86, .52, E.sec],                                    // le chiffre repousse la camera
    [T_TRIO, 0, 88, .532, E.derive],
    [T_TRIO + .42, HB[0], HB[1] + 28, 3.05, E.glisse],                  // plongee sur trois poches
    [P4.fin + .1, HB[0] + 4, HB[1] + 22, 3.2, E.derive],
    [T3, HB[0] + 10, HB[1] - 6, 3.35, E.derive],
  ], roulis);
  const wIn = t => (1 - E.arrive(seg(t, T2, T2 + .38))) * 6200, wOut = t => -E.pars(seg(t, T3 - RACC, T3)) * 2500;
  const SEC = [[T_DIVE + .08, 9], [T_LIT, 7], [T_BL, 20], [T_UNE + .08, 10]];

  acte({ id: 's2b', draw(t) {
    TT = t; let dx = wIn(t), dy = wOut(t); for (const [t0, a] of SEC) { const s = shake(t, t0, a); dx += s[0]; dy += s[1]; }
    X.save(); const c = cam.apply(t, dx, dy), cx = c.x - dx / c.z, cy = c.y - dy / c.z;
    VIEW = { x0: cx - W * .56 / c.z, x1: cx + W * .56 / c.z, y0: cy - H * .62 / c.z, y1: cy + H * .62 / c.z };
    for (const q of Q) { q.S = etat(q, t); q.P = pos(q, t); }
    for (const q of Q) corde(q);
    for (const q of ORDRE) if (inView(q.P[0], q.P[1], VIEW, 0)) poche(q);
    feuille(t); rouleauFile(t); chiffre(t);
    X.restore(); flash(t, T_BL, .5);
  }, blur: t => { if (t < T2 + .42 || t > T3 - RACC) return 8; let n = cam.blur(t);
    if (t > T_BL - .02 && t < T_BL + .45) n = Math.max(n, 6); if ((t > T_DIVE - .04 && t < T_DIVE + .22) || (t > T_BACK - .02 && t < T_BACK + .9) || (t > T_UNE - .06 && t < T_UNE + .3)) n = Math.max(n, 4); return n; } });

  // ---------- reperes sonores de la scene ----------
  cue(T2, 'whoosh', { d: .42 }); cue(T_ARR, 'arrive', { d: .34 }); cue(T_ARR + .33, 'toc', { g: .6 });
  cue(T_SIG, 'etire', { d: .42 }); cue(T_SIG + .44, 'tic', { g: 1.2 });
  cue(T_DIVE + .08, 'impact', { g: .9 }); cue(T_DIVE + .1, 'prise', { g: 1, pan: 0 }); for (const a of TAPS) cue(a, 'tap');
  cue(T_SCR - .02, 'defile', { d: T_LIT - T_SCR }); cue(T_LIT, 'bute', { g: .9 });
  cue(T_CIRC, 'etire', { d: .36 }); cue(T_CIRC + .37, 'tic', { g: 1.2 });
  cue(T_BACK, 'whoosh', { d: 1.1, sens: -1 }); cue(T_N - .8, 'riser', { d: .6 }); cue(T_N - .2, 'silence', { d: .3 });
  cue(T_BL, 'impact', { g: 1.5 }); cue(T_BL, 'boum', { g: 1.2 }); cue(T_BL + .1, 'bute', { g: .7 }); cue(T_BL + .2, 'poignee', { g: 1, n: 3 });
  cue(T_ILL, 'etire', { d: .5 }); for (let i = 0; i < 6; i++) cue(T_ILL + .22 + i * .075, 'prise', { g: .6, pan: -1 + i * .4 });
  cue(T_TRIO, 'whoosh', { d: .42 }); cue(T_UNE + .07, 'impact', { g: 1 }); cue(T_UNE + .19, 'poignee', { g: 1.2, n: 2 });
  cue(T_TUG[0] + .04, 'bute', { g: .8 }); cue(T_TUG[1] + .04, 'bute', { g: 1 }); cue(T_TUG[1] + .5, 'renonce'); cue(T3 - RACC, 'whoosh', { d: .34 });
  // ---------- images cles de la scene ----------
  cle('autorisation_signee', T_SIG + .5); cle('illimite_entoure', T_CIRC + .5); cle('trente_quatre', T_BL + .6); cle('une_sur_trois', T_TUG[1] + .3);
})();
