// film.js : essai d'ouverture de la video Hold up. La page est une fonction du temps : window.renderAt(t).
// Aucun hasard libre : tout bruit vient de hash(seed). Encre blanche grattee sur noir, trait redessine toutes les 3 images.
'use strict';
const W = 1920, H = 1080, FPS = 60;
const TL = window.TL, DUR = TL.duree; window.DUR = DUR;
const cv = document.getElementById('c'), X = cv.getContext('2d');
const INK = '#f6f3ec', BLK = '#060606';

// ---------- outils ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const seg = (t, a, b) => clamp((t - a) / (b - a));
function hash(a, b = 0, c = 0) { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; h ^= h >>> 16; return (h >>> 0) / 4294967295; }
const sh = (a, b, c) => hash(a, b, c) * 2 - 1;
function bez(x1, y1, x2, y2) {            // courbe cubique façon CSS
  return x => { if (x <= 0) return 0; if (x >= 1) return 1; let u = x;
    for (let i = 0; i < 8; i++) { const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx; const f = ((ax * u + bx) * u + cx) * u - x, d = (3 * ax * u + 2 * bx) * u + cx; if (Math.abs(d) < 1e-6) break; u -= f / d; }
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by; return ((ay * u + by) * u + cy) * u; };
}
const E = {
  arrive: bez(.16, 1, .3, 1),      // part vite, se pose longuement
  pars: bez(.6, 0, .9, .35),       // se ramasse puis accelere (chute, arrachement)
  glisse: bez(.7, 0, .2, 1),       // camera : depart et arrivee amortis, milieu rapide
  doux: bez(.4, 0, .25, 1),
  derive: bez(.25, .1, .35, 1),    // derive lente de camera
  sec: bez(.2, 0, 0, 1),
};
// suite de poses : keys = [[t, v, courbe vers cette pose], ...]
function pose(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const a = keys[i - 1], b = keys[i]; return lerp(a[1], b[1], (b[2] || E.doux)(seg(t, a[0], b[0]))); }
  return keys[keys.length - 1][1];
}
// reperes de la voix
const V = Object.fromEntries(TL.voix.map(v => [v.id, v]));
const L = V;                                   // lignes du film (o1..o12 : ouverture)
V.v01 = L.o1; V.v02 = { debut: L.o2.debut, fin: L.o3.fin }; V.v03 = { debut: L.o4.debut, fin: L.o6.fin }; V.v04 = L.o7;
V.v05 = { debut: L.o8.debut, fin: L.o9.fin }; V.v06 = { debut: L.o10.debut - .5, fin: L.o10.fin }; V.v07 = { debut: L.o11.debut, fin: L.o12.fin };
const T_END1 = L.p1.debut - 0.5;               // fin de l'ouverture, le plan 2b prend la suite

// ---------- le monde ----------
const PW = 96, PH = 124;                       // poche
const COLS = 22, ROWS = 8, PX = 165, PY = 205;
const BOOTH = { x: 0, y: -20 };
const T_HIT = L.o3.debut - 0.5;                 // montrer avant de dire : le coup tombe AVANT « Piratee. »
const T_PULL = L.o4.debut - 0.55;               // les premieres poches se vident avant le montant
const T_WAVE = L.o6.fin - T_PULL - 0.9;          // la vague s'acheve sur « Vides. »
const SCOOP = [L.o7.debut + 0.3, L.o7.debut + 0.95, L.o7.fin - 0.8];   // 3 poignees ; la derniere avant « illimitee »
const LUNGE = [L.o8.debut - 0.6, L.o8.debut + 0.0, L.o8.fin - 0.4];
const T_LIMP = Math.max(LUNGE[2] + 0.5, L.o9.debut - 0.3);
const T_OUT = L.o9.fin + 0.3;
const T_HOVER = L.o10.debut + 0.3;
const T_TAP0 = 0.85, T_TAP1 = -9, T_Q = L.o12.debut + 1.1, T_NOIR = 1e9;

function makeField(ox, oy, id, hacked) {
  const ps = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (c >= 9 && c <= 12 && r >= 3 && r <= 4) continue;
    if (!hacked && Math.pow((c - 10.5) / 11.4, 2) + Math.pow((r - 3.5) / 4.4, 2) > 1 - hash(c, r, id) * .3 && !(c === 12 && r === 5)) continue;   // les autres guichets : des nuees irregulieres, pas des rectangles
    const k = r * COLS + c, fixed = (c === 9 && r === 5) || (r === 6 && (c === 16 || c === 17));
    const p = { c, r, k, seed: k + id * 1000,
      x: ox + (c - 10.5) * PX + (r % 2 ? PX / 4 : -PX / 4) + (fixed ? 0 : sh(k, id, 1) * 15), y: oy + (r - 3.5) * PY - 62 + (fixed ? 0 : sh(k, id, 2) * 13) };
    const dx = p.x - (ox + BOOTH.x), dy = p.y - (oy + BOOTH.y); p.dist = Math.hypot(dx, dy); p.ang = Math.atan2(dy + 30, dx);
    ps.push(p);
  }
  const md = Math.max(...ps.map(p => p.dist));
  // 15 poches limitees parmi 168 : 153 videes. Le nombre 15 est une illustration (la source ne donne pas ce nombre).
  const order = ps.filter(p => !(p.c === 9 && p.r === 5) && !(p.c === 16 && p.r === 6) && !(p.c === 17 && p.r === 6) && p.dist > 420)
    .sort((a, b) => hash(a.k, 77, id) - hash(b.k, 77, id));
  const lim = new Set(order.slice(0, 14).map(p => p.k)); lim.add(6 * COLS + 17);
  for (const p of ps) {
    p.limited = hacked && lim.has(p.k); p.hero = hacked && p.c === 9 && p.r === 5; p.pu = hacked && p.c === 16 && p.r === 6; p.pl = hacked && p.c === 17 && p.r === 6;
    p.tD = !hacked || p.limited || p.pu ? 1e9 : T_PULL + Math.pow((p.dist - 300) / (md - 300), .85) * T_WAVE + sh(p.k, 5) * .09;
    p.sag0 = 26 + p.dist * .05 + hash(p.k, 9) * 26;
  }
  ps.sort((a, b) => b.dist - a.dist);
  return { ox, oy, id, hacked, ps, bx: ox + BOOTH.x, by: oy + BOOTH.y };
}
const F0 = makeField(0, 0, 0, true);
const OTHERS = [makeField(-3350, -1500, 1, false), makeField(3150, -1800, 2, false), makeField(-2950, 1800, 3, false), makeField(3550, 1450, 4, false)];
const FIELDS = [F0, ...OTHERS];
const HERO = F0.ps.find(p => p.hero), PU = F0.ps.find(p => p.pu), PL = F0.ps.find(p => p.pl);
const MINE = OTHERS[0].ps.find(p => p.c === 12 && p.r === 5);
window.COUNTS = { total: F0.ps.length, limitees: F0.ps.filter(p => p.limited).length, videes: F0.ps.filter(p => !p.limited).length };

// ---------- camera ----------
const WIDE = [0, 95, .52];
const CAM = [
  [0, HERO.x + 34, HERO.y + 58, 4.3],
  [V.v02.debut - .1, HERO.x + 26, HERO.y + 46, 4.0, E.derive],
  [T_HIT - .7, 0, -150, 2.1, E.glisse],            // remonte le bras jusqu'au guichet
  [T_HIT + .75, 0, -140, 2.05, E.derive],
  [T_HIT + 2.95, WIDE[0], WIDE[1], WIDE[2], bez(.55, 0, .25, 1)],  // recule : chaque poche revelee est deja prise
  [V.v04.debut - .35, WIDE[0], WIDE[1] + 4, .505, E.derive],
  [V.v04.debut + .95, PU.x + 60, PU.y + 30, 3.5, E.glisse],  // deux poches voisines dans le meme cadre
  [SCOOP[2] + .5, PU.x + 70, PU.y + 52, 3.8, E.derive],
  [V.v05.debut + .35, PL.x - 20, PL.y + 30, 4.3, E.glisse],
  [V.v05.fin + .15, PL.x - 14, PL.y + 36, 4.6, E.derive],
  [V.v06.debut + .1, WIDE[0], WIDE[1], WIDE[2], E.glisse],
  [V.v06.debut + 1.6, 100, 40, .262, bez(.5, 0, .2, 1)],     // recule encore : d'autres guichets
  [V.v07.debut + .25, 100, 40, .25, E.derive],
  [V.v07.debut + 1.55, MINE.x + 30, MINE.y + 40, 4.0, bez(.75, 0, .15, 1)],   // plonge dans MA poche
  [T_END1 + .3, MINE.x + 30, MINE.y + 70, 4.6, E.derive],
];
function camRaw(t) {
  let a = CAM[0], b = CAM[0], k = 0;
  for (let i = 1; i < CAM.length; i++) if (t <= CAM[i][0]) { a = CAM[i - 1]; b = CAM[i]; k = (b[4] || E.doux)(seg(t, a[0], b[0])); break; } else { a = b = CAM[i]; }
  // zoom interpole en logarithme ; la position suit le zoom pour que le sujet reste tenu pendant un grand changement d'echelle
  const lz = lerp(Math.log(a[3]), Math.log(b[3]), k), z = Math.exp(lz);
  let kp = k; if (a[3] !== b[3] && Math.abs(Math.log(b[3] / a[3])) > .5) kp = (1 / z - 1 / a[3]) / (1 / b[3] - 1 / a[3]);
  return { x: lerp(a[1], b[1], kp), y: lerp(a[2], b[2], kp), z };
}
const ROLL = t => pose(t, [[0, -.045], [T_HIT - .3, .012, E.glisse], [T_HIT + 3, -.014, E.glisse], [V.v04.debut + 1, .03, E.glisse], [V.v05.debut + .5, -.026, E.glisse], [V.v06.debut + .3, .008, E.glisse], [V.v06.debut + 1.8, .02, E.glisse], [V.v07.debut + 1.6, -.035, E.glisse], [DUR, -.02, E.derive]]);
function camAt(t) {      // moyenne glissante (gaussienne, +/- 0,28 s) : aucune vitesse ne s'annule entre deux mouvements, ils se chevauchent
  let x = 0, y = 0, lz = 0, r = 0, ws = 0;
  for (let i = -6; i <= 6; i++) { const w = Math.exp(-i * i / 9), tt = clamp(t + i * .047, 0, DUR), c = camRaw(tt); x += c.x * w; y += c.y * w; lz += Math.log(c.z) * w; r += ROLL(tt) * w; ws += w; }
  let cy = y / ws; const d = t - T_HIT; if (d > 0 && d < .6) cy += 7 * Math.exp(-d * 9) * Math.cos(d * 34);       // le coup : une secousse, amortie
  return { x: x / ws, y: cy, z: Math.exp(lz / ws), r: r / ws };
}

// ---------- etats ----------
const surfY = lv => 42 + (1 - lv) * 74;
function tautAt(p, t) { const s = T_HIT + .45 + p.dist / 5200; return E.arrive(seg(t, s, s + .28)); }
const tGo = p => p.pu ? SCOOP[2] + .06 : p.tD + .05;
const goDur = p => .62 + p.dist / 2300;
function pocketState(p, t) {
  // -> {lv, wy (poignet sous le haut de la poche), curl, strain, rot, jolt, bow, thin, bulges:[{u,size}]}
  const S = { lv: 1, wy: 0, curl: .14, strain: 0, rot: 0, jolt: 0, bow: 0, thin: 1, bulges: [], knot: p.limited };
  if (p.limited) {
    S.lv = .55; S.wy = -6;
    if (p.pl) {
      for (let i = 0; i < 3; i++) { const L = LUNGE[i], f = [1, 1.5, 2.1][i];
        if (t > L - .2 && t < L + .5) {
          S.wy += pose(t, [[L - .2, 0], [L - .05, -5 * f, E.arrive], [L + .04, 6 * f, E.pars], [L + .17, 6 * f], [L + .27, -4 * f, E.doux], [L + .46, 0, E.doux]]);
          S.strain = pose(t, [[L - .05, 0], [L + .04, 4 * f, E.pars], [L + .16, 3.7 * f + Math.sin(t * 70) * .5], [L + .42, 0, E.arrive]]);
          S.curl = pose(t, [[L - .2, .14], [L - .05, 0, E.arrive], [L + .16, 0], [L + .42, .14]]);
          S.jolt = pose(t, [[L - .02, 0], [L + .05, 5 * f, E.arrive], [L + .16, 4.4 * f], [L + .4, 0, E.arrive]]);
          S.bow = pose(t, [[L - .08, 0], [L + .05, 46 * f, E.arrive], [L + .16, 42 * f], [L + .45, 0, E.doux]]);
        }
      }
      if (t > T_LIMP) { const d = t - T_LIMP; S.curl = lerp(.14, .42, E.arrive(seg(d, 0, .3))); S.rot = .2 * Math.exp(-d * 3.2) * Math.sin(d * 9.5); S.wy -= 2 * E.arrive(seg(d, 0, .3)); }
    }
    return S;
  }
  if (p.pu) {
    const LV = [1, .66, .34, 0]; let lv = 1, wy = surfY(1) - 40, curl = .14;
    const tt = tautAt(p, t); curl = lerp(.14, .5, tt);
    for (let k = 0; k < 3; k++) { const s = SCOOP[k], last = k === 2, s0 = last ? s - .46 : s - .2;
      if (t < s0) break;
      const top = last ? -70 : 4, deep = surfY(LV[k]) - 16, rest = k ? 0 : surfY(1) - 40;
      wy = pose(t, [[s0, rest], [s0 + .13, rest - 8, E.arrive], [s + .03, deep, last ? bez(.45, 0, .55, 1) : E.pars], [s + .14, deep + 1], [s + (last ? .34 : .4), top, E.pars]]);
      curl = pose(t, [[s0, .5], [s0 + .13, 0, E.arrive], [s - .02, 0], [s + .06, 1, E.sec]]);
      lv = lerp(LV[k], LV[k + 1], E.pars(seg(t, s + .12, s + .34)));
      S.thin = last ? pose(t, [[s0 + .13, 1], [s + .03, .78, E.doux], [s + .14, .78], [s + .34, 1, E.arrive]]) : 1;
      S.jolt = pose(t, [[s + .13, 0], [s + .2, -3, E.arrive], [s + .42, 0, E.doux]]);
      const bu = seg(t, s + .16, s + .16 + 1.1); if (bu > 0 && bu < 1) S.bulges.push({ u: 1 - Math.pow(bu, 1.5), size: 1.25 });
    }
    S.lv = lv; S.wy = wy; S.curl = curl;
    if (t > tGo(p) + .08) { S.wy = surfY(LV[2]) - 16; S.travel = 1 - E.pars(seg(t, tGo(p) + .08, tGo(p) + .08 + goDur(p))); }
    return S;
  }
  const tD = p.tD, tt = p.hacked === false ? 0 : tautAt(p, t);
  let rest = surfY(1) - 40; S.wy = rest; S.curl = lerp(.14, .5, tt);
  const tap = (p.hero && t < 2) ? T_TAP0 : (p === MINE ? T_TAP1 : -9);
  if (tap > 0 && t > tap - .18 && t < tap + .5) {      // la main tapote : elle est chez elle
    S.strain = pose(t, [[tap - .18, 0], [tap - .04, -5, E.arrive], [tap + .03, 1.5, E.pars], [tap + .2, 0, E.arrive]]);
    S.wy += pose(t, [[tap - .18, 0], [tap - .04, -2.5, E.arrive], [tap + .03, .8, E.pars], [tap + .2, 0, E.arrive]]);
  }
  if (p === MINE && t > T_Q) {      // « le droit de prendre ? » : elle prend une poignee, et la tient
    S.wy = pose(t, [[T_Q, rest], [T_Q + .16, rest - 8, E.arrive], [T_Q + .28, rest + 12, E.pars], [T_Q + .4, rest + 12], [T_Q + .95, rest - 30, E.arrive]]);
    S.curl = pose(t, [[T_Q, .14], [T_Q + .16, 0, E.arrive], [T_Q + .24, 0], [T_Q + .33, 1, E.sec]]);
    S.loot = t > T_Q + .33; S.jolt = pose(t, [[T_Q + .4, 0], [T_Q + .5, -3, E.arrive], [T_Q + .8, 0, E.doux]]);
  }
  if (t > tD - .2) {
    S.wy = pose(t, [[tD - .2, rest], [tD - .06, rest - 9, E.arrive], [tD + .04, rest + 13, E.pars], [tD + .13, rest + 13]]);
    S.curl = pose(t, [[tD - .2, .5], [tD - .06, 0, E.arrive], [tD - .01, 0], [tD + .06, 1, E.sec]]);
    S.lv = 1 - E.doux(seg(t, tD + .1, tD + .42));
    S.jolt = pose(t, [[tD + .02, 0], [tD + .07, 3, E.arrive], [tD + .16, -5, E.doux], [tD + .34, 1.2, E.doux], [tD + .5, 0, E.doux]]);   // la poche encaisse, remonte, retombe
    if (t > tGo(p) + .08) S.travel = 1 - E.pars(seg(t, tGo(p) + .08, tGo(p) + .08 + goDur(p)));
  }
  return S;
}
const levelFar = (p, t) => p.limited ? .55 : p.pu ? pocketState(p, t).lv : 1 - E.doux(seg(t, p.tD + .1, p.tD + .42));
const travelFar = (p, t) => t > tGo(p) + .08 ? 1 - E.pars(seg(t, tGo(p) + .08, tGo(p) + .08 + goDur(p))) : undefined;

// bras du voleur (raye) : position de la pointe
const ROOF_Y = -112;
function thiefTip(t) {
  if (t < T_HIT - .62 || t > T_OUT + .5) return null;
  const y = pose(t, [[T_HIT - .62, -520], [T_HIT - .3, -275, E.arrive], [T_HIT - .2, -275], [T_HIT - .1, -305, E.arrive], [T_HIT, ROOF_Y + 30, bez(.7, 0, 1, .5)],
    [T_OUT - .14, ROOF_Y + 30], [T_OUT, ROOF_Y + 42, E.arrive], [T_OUT + .34, -1900, bez(.7, 0, .9, .4)]]);
  const curl = pose(t, [[T_HIT - .3, 0], [T_HIT - .1, .25], [T_HIT - .02, 1, E.sec]]);
  return { x: BOOTH.x + 6, y: BOOTH.y + y, curl };
}
const TB = []; for (let j = 0; j < 14; j++) TB.push([T_PULL + .5 + j * .25, .7 + .6 * Math.sin(Math.PI * (j + 1) / 15)]);
for (const s of SCOOP) TB.push([s + 1.05, .9]);
const boothSquash = t => { const d = t - T_HIT; return d < 0 || d > .5 ? 0 : pose(d, [[0, 0], [.05, 1, E.arrive], [.26, -.12, E.doux], [.42, 0, E.doux]]); };

// ---------- dessin ----------
let BOIL = 0, BOILK = 0, Z = 1, NOW = 0;
const wob = (a, b) => { const k = BOILK * BOILK * (3 - 2 * BOILK); return lerp(sh(a, b, BOIL), sh(a, b, BOIL + 1), k); };   // bruit lisse dans le temps
function jit(pts, seed, amp) { if (Z < .8 || !amp) return pts; return pts.map((p, i) => [p[0] + wob(seed, i) * amp, p[1] + wob(seed, i + 500) * amp]); }
function trace(pts, closed) { X.beginPath(); X.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) X.lineTo(pts[i][0], pts[i][1]); if (closed) X.closePath(); }
function smooth(pts, closed) {      // passe par les milieux : trait souple, pas de polygone
  X.beginPath(); const n = pts.length;
  if (closed) { const m = i => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2]; const s = m(0); X.moveTo(s[0], s[1]); for (let i = 1; i <= n; i++) { const q = m(i); X.quadraticCurveTo(pts[i % n][0], pts[i % n][1], q[0], q[1]); } X.closePath(); }
  else { X.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < n - 1; i++) { const q = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2]; X.quadraticCurveTo(pts[i][0], pts[i][1], q[0], q[1]); } X.lineTo(pts[n - 1][0], pts[n - 1][1]); }
}
const cubic = (a, b, c, d, n) => { const o = []; for (let i = 0; i <= n; i++) { const u = i / n, v = 1 - u; o.push([v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * d[0], v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * d[1]]); } return o; };
function along(pts, u) {   // point a la fraction u de la longueur
  let L = 0; const ls = [0]; for (let i = 1; i < pts.length; i++) { L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); ls.push(L); }
  const d = u * L; let i = 1; while (i < pts.length - 1 && ls[i] < d) i++;
  const k = (d - ls[i - 1]) / Math.max(1e-6, ls[i] - ls[i - 1]); return { x: lerp(pts[i - 1][0], pts[i][0], k), y: lerp(pts[i - 1][1], pts[i][1], k), a: Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]) };
}
const LW = () => Math.max(2.5, 1.5 / Z);              // trait d'encre, en unites du monde
function tube(pts, w, seed) {                          // tuyau souple : contour blanc, ame noire
  const p = jit(pts, seed, .55); X.lineCap = 'round'; X.lineJoin = 'round';
  smooth(p); X.strokeStyle = INK; X.lineWidth = Math.max(w + 2 * LW(), 1.5 / Z); X.stroke();
  if (w * Z > 1.2) { smooth(p); X.strokeStyle = BLK; X.lineWidth = w; X.stroke(); }
}
function capsule(x0, y0, x1, y1, r) { const a = Math.atan2(y1 - y0, x1 - x0); X.moveTo(x0 + Math.cos(a + Math.PI / 2) * r, y0 + Math.sin(a + Math.PI / 2) * r); X.arc(x0, y0, r, a + Math.PI / 2, a - Math.PI / 2); X.arc(x1, y1, r, a - Math.PI / 2, a + Math.PI / 2); X.closePath(); }
// gant de dessin anime (creux : il appartient a la plateforme, pas a Hold up). Origine : poignet ; la main pend vers +y.
function hand(x, y, s, st, seed) {
  const { curl = 0, strain = 0, rot = 0 } = st; const o = 1 - curl;
  X.save(); X.translate(x, y); X.rotate(rot); X.scale(s, s);
  const j = (i) => wob(seed, i) * .4;
  const shape = () => { X.beginPath();
    const fl = 5 + 10 * o + strain, fy = 23 - 3 * curl;
    for (let i = -1; i <= 1; i++) { const a = i * (.2 * o + .05) , bx = i * 8.2 + j(i + 2), ex = bx + Math.sin(a) * fl + i * 1.2 * o, ey = fy + Math.cos(a) * fl + (i === 0 ? 1.5 : 0); capsule(bx, fy - 3, ex, ey + j(i + 5), 4.6); }
    const ta = lerp(1.25, .25, curl), tl = 6 + 4 * o + strain * .3; capsule(-11.5, 14, -11.5 - Math.sin(ta) * tl, 14 + Math.cos(ta) * tl, 4.6);
    X.moveTo(13.5, 14); X.ellipse(0 + j(9), 14 + j(10), 13.5, 11.5 + curl * 1.5, 0, 0, Math.PI * 2);
  };
  X.lineJoin = 'round'; const lw = LW() / s;
  shape(); X.strokeStyle = INK; X.lineWidth = 2 * lw; X.stroke(); shape(); X.fillStyle = BLK; X.fill();
  if (Z * s > 1.5) { X.beginPath(); for (let i = -1; i <= 1; i++) { X.moveTo(i * 5, 9 + j(20 + i)); X.lineTo(i * 5.6, 16.5); } X.strokeStyle = INK; X.lineWidth = lw * .8; X.lineCap = 'round'; X.stroke(); }
  // revers du gant
  X.beginPath(); X.roundRect(-11, -5, 22, 10, 5); X.strokeStyle = INK; X.lineWidth = 2 * lw; X.stroke(); X.fillStyle = BLK; X.fill();
  X.restore();
}
function pocketPath(inset = 0) {      // poche plaquee de pantalon : cotes droits, fond en pointe. Origine en haut au centre
  const w = PW / 2 - inset, b = PH - inset * 1.25, k = 30; X.beginPath();
  X.moveTo(-w, 15); X.lineTo(-w + 2, b - k - 6); X.quadraticCurveTo(-w + 2, b - k + 2, -w + 10, b - k + 6); X.lineTo(-7, b - 3); X.quadraticCurveTo(0, b + 1, 7, b - 3); X.lineTo(w - 10, b - k + 6); X.quadraticCurveTo(w - 2, b - k + 2, w - 2, b - k - 6); X.lineTo(w, 15); X.closePath();
}
function coins(p, lv) {
  if (lv <= .004) return; const sy = surfY(lv);
  X.save(); pocketPath(5.5); X.clip();
  X.fillStyle = INK; X.fillRect(-PW / 2, sy, PW, PH);
  if (Z > 1.1) {                                       // les pieces : disques couches sur le dessus, tranches dans la masse
    X.lineWidth = 1.5; X.strokeStyle = BLK;
    for (let i = 0; i < 9; i++) { const cx = -38 + i * 9.6 + sh(p.seed, i, 11) * 3, cy = sy + sh(p.seed, i, 12) * 3 - 1, a = sh(p.seed, i, 13) * .5;
      X.beginPath(); X.ellipse(cx, cy, 10.5, 4.2, a, 0, Math.PI * 2); X.fillStyle = INK; X.fill(); X.stroke(); }
    for (let i = 0; i < 16; i++) { const cx = sh(p.seed, i, 21) * 36, cy = sy + 9 + hash(p.seed, i, 22) * 70, a = sh(p.seed, i, 23) * .6;
      X.beginPath(); X.ellipse(cx, cy, 9.5, 3.6, a, .15, Math.PI - .15); X.stroke(); }
  }
  X.restore();
}
function drawPocket(F, p, t) {
  const near = Z > .95, S = near ? pocketState(p, t) : null, lv = near ? S.lv : levelFar(p, t);
  X.save(); X.translate(p.x, p.y + (S ? S.jolt : 0));
  const lw = LW();
  if (!near) {                                        // vue large : pleine = blanche, prise = un contour
    pocketPath(0); X.fillStyle = BLK; X.fill();
    if (lv > .004) { X.save(); pocketPath(3); X.clip(); X.fillStyle = INK; X.fillRect(-PW / 2, surfY(lv) - 8, PW, PH); X.restore(); }
    pocketPath(0); X.strokeStyle = INK; X.lineWidth = lw; X.lineJoin = 'round'; X.stroke();
    X.beginPath(); X.roundRect(-PW / 2 - 3, 0, PW + 6, 15, 4); X.fillStyle = BLK; X.fill(); X.stroke();
    X.restore(); return;
  }
  pocketPath(0); X.fillStyle = BLK; X.fill();
  // ourlet (derriere le bras)
  X.beginPath(); X.roundRect(-PW / 2 - 3, 0, PW + 6, 15, 4); X.fillStyle = BLK; X.fill(); X.strokeStyle = INK; X.lineWidth = lw; X.stroke();
  X.restore();
  if (S.travel !== undefined) { X.save(); X.translate(p.x, p.y + S.jolt); coins(p, lv); pocketPath(0); X.strokeStyle = INK; X.lineWidth = lw; X.lineJoin = 'round'; X.stroke(); if (Z > 1.4) { pocketPath(8); X.setLineDash([5, 6]); X.lineWidth = lw * .55; X.globalAlpha = .75; X.stroke(); X.setLineDash([]); X.globalAlpha = 1; } X.beginPath(); X.ellipse(0, 2, 13, 4.5, 0, 0, Math.PI); X.lineWidth = lw * 1.3; X.stroke(); X.restore(); return; }
  // fin du bras et main, dans la poche (coupe)
  const A = armPts(F, p, t, S); const tail = A.pts.slice(Math.floor(A.pts.length * .8));
  tube(tail, 15 * S.thin, p.seed);
  X.save(); X.translate(p.x, p.y + S.jolt);
  // oeillet (moitie arriere deja couverte), noeud des poches limitees
  if (S.knot) { X.save(); X.translate(0, -16 + (S.wy + 6)); X.lineCap = 'round';
    X.beginPath(); X.ellipse(9, -1, 10, 8, -.5, 0, Math.PI * 2); X.strokeStyle = INK; X.lineWidth = 15 * .62 + 2 * lw; X.stroke(); X.strokeStyle = BLK; X.lineWidth = 15 * .62; X.stroke();
    X.beginPath(); X.moveTo(-3, -7); X.lineTo(3, 7); X.strokeStyle = INK; X.lineWidth = 15 + 2 * lw; X.stroke(); X.strokeStyle = BLK; X.lineWidth = 15; X.stroke(); X.restore(); }
  X.restore();
  const dive = S.curl > .6 && S.wy > 0;
  if (dive && !S.loot) hand(p.x, p.y + S.jolt + S.wy, 1.3, S, p.seed);
  X.save(); X.translate(p.x, p.y + S.jolt);
  coins(p, lv);
  X.restore();
  if (S.loot) { X.beginPath(); X.ellipse(p.x + 1, p.y + S.jolt + S.wy + 38, 24, 16, 0, 0, 7); X.fillStyle = INK; X.fill(); X.strokeStyle = BLK; X.lineWidth = 1.5; X.stroke(); }
  if (!dive || S.loot) hand(p.x, p.y + S.jolt + S.wy, 1.3, S, p.seed);
  X.save(); X.translate(p.x, p.y + S.jolt);
  pocketPath(0); X.strokeStyle = INK; X.lineWidth = lw; X.lineJoin = 'round'; X.stroke();
  if (Z > 1.4) { pocketPath(7); X.setLineDash([5, 5]); X.lineWidth = lw * .5; X.globalAlpha = .8; X.stroke(); pocketPath(12); X.stroke(); X.setLineDash([]); X.globalAlpha = 1; }
  // oeillet : anneau cousu a l'ourlet, le bras passe dedans
  X.beginPath(); X.ellipse(0, 2, 13, 4.5, 0, 0, Math.PI); X.strokeStyle = INK; X.lineWidth = lw * 1.3; X.stroke();
  X.restore();
  for (const b of S.bulges) if (b.u > .8) lump(A.pts, b, 15);
}
function armPts(F, p, t, S) {
  S = S || { wy: 0, jolt: 0, bow: 0 };
  const a = p.ang, A = [F.bx + Math.cos(a) * 66, F.by + 30 + Math.sin(a) * 72], P3 = [p.x, p.y - 6 + (S.jolt || 0)];
  const d = Math.hypot(P3[0] - A[0], P3[1] - A[1]), tt = F.hacked ? tautAt(p, t) : 0;
  let sag = p.sag0 * (1 - .8 * tt) + (S.bow || 0) + 7 * (1 - tt) * Math.sin(NOW * 2.3 - p.dist / 210 + p.ang);
  const n = Z > .95 ? 26 : 10;
  const pts = cubic(A, [A[0] + Math.cos(a) * d * .42, A[1] + Math.sin(a) * d * .42 + sag], [P3[0] + (S.bow || 0) * .5, P3[1] - Math.min(92, 40 + d * .1) - (S.bow || 0) * .2], P3, n);
  if (Z > .95) { const wy = p.y + (S.jolt || 0) + (S.wy || 0); pts.push([p.x, (P3[1] + wy) / 2], [p.x, wy - 3]); }
  return { pts };
}
function lump(pts, b, w) { const q = along(pts, b.u); X.save(); X.translate(q.x, q.y); X.rotate(q.a); X.beginPath(); X.ellipse(0, 0, 15 * b.size, (w * .5 + 5.5) * b.size, 0, 0, Math.PI * 2); X.fillStyle = INK; X.fill(); X.restore(); }

const FLY = [];
function drawFly() {                                                    // la main file ; les pieces la suivent en retard, puis la rattrapent
  for (const { p, A, tr } of FLY) { const pr = 1 - tr;
    for (let k = 5; k >= 1; k--) { const uu = tr + k * .05 * Math.max(0, 1 - pr * 3.2); if (uu >= 1) continue; const q = along(A.pts, uu); X.save(); X.translate(q.x + sh(p.seed, k, 40) * 5, q.y + sh(p.seed, k, 41) * 5); X.rotate(q.a + sh(p.seed, k, 42)); X.beginPath(); X.ellipse(0, 0, 10, 4.5, 0, 0, 7); X.fillStyle = INK; X.fill(); X.strokeStyle = BLK; X.lineWidth = 1.5; X.stroke(); X.restore(); }
    const q = along(A.pts, tr); X.beginPath(); X.ellipse(q.x + Math.cos(q.a) * 34, q.y + Math.sin(q.a) * 34, 18, 13, q.a, 0, 7); X.fillStyle = INK; X.fill(); X.strokeStyle = BLK; X.lineWidth = 1.5; X.stroke();
    hand(q.x, q.y, 1.3, { curl: 1, rot: q.a - Math.PI / 2 }, p.seed); }
  FLY.length = 0;
}
function cutTo(pts, u) { let L = 0; const ls = [0]; for (let i = 1; i < pts.length; i++) { L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); ls.push(L); }
  const d = u * L, o = [pts[0]]; for (let i = 1; i < pts.length; i++) { if (ls[i] < d) o.push(pts[i]); else { const k = (d - ls[i - 1]) / Math.max(1e-6, ls[i] - ls[i - 1]); o.push([lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]); break; } } return o; }
function drawArms(F, t, view) {
  for (const p of F.ps) {
    if (!inView(p.x, p.y, view, 0) && !inView(F.bx, F.by, view, 0) && !segInView(F.bx, F.by, p.x, p.y, view)) continue;
    const near = Z > .95, S = near ? pocketState(p, t) : null, A = armPts(F, p, t, S);
    const tr = !F.hacked || p.limited ? undefined : near ? S.travel : travelFar(p, t);
    if (tr !== undefined && tr <= 0.002) continue;                       // la corde est rentree au guichet avec la prise
    const pts = tr !== undefined ? cutTo(A.pts, tr) : A.pts;
    if (pts.length < 2) continue;
    if (near) {
      smooth(jit(pts, p.seed, .45)); X.strokeStyle = INK; X.lineWidth = 4.2; X.globalAlpha = .55; X.lineCap = 'round'; X.stroke(); X.globalAlpha = 1;
      for (const b of S.bulges) if (b.u <= .8) lump(A.pts, b, 9);
      if (tr !== undefined) FLY.push({ p, A, tr });
    } else {
      trace(pts); X.strokeStyle = INK; X.lineWidth = Math.max(15 * .4, 1.15 / Z); X.globalAlpha = clamp(.42 + Z * .9, 0, .95); X.lineJoin = 'round'; X.stroke(); X.globalAlpha = 1;
      if (tr !== undefined) { const q = along(A.pts, tr); X.beginPath(); X.arc(q.x, q.y, Math.max(15, 3.6 / Z), 0, 7); X.fillStyle = INK; X.fill(); }
      if (p.pu) for (const b of pocketState(p, t).bulges) { const q = along(A.pts, b.u); X.beginPath(); X.arc(q.x, q.y, Math.max(11, 3 / Z), 0, 7); X.fillStyle = INK; X.fill(); }
      if (p.limited && Z > .3) { X.beginPath(); X.arc(p.x + 5, p.y - 16, 9, 0, 7); X.strokeStyle = INK; X.lineWidth = Math.max(4, 1.4 / Z); X.stroke(); }
    }
  }
}
function inView(x, y, v, m) { return x > v.x0 - 260 - m && x < v.x1 + 260 + m && y > v.y0 - 260 - m && y < v.y1 + 260 + m; }
function segInView(x0, y0, x1, y1, v) { return !(Math.max(x0, x1) < v.x0 - 200 || Math.min(x0, x1) > v.x1 + 200 || Math.max(y0, y1) < v.y0 - 200 || Math.min(y0, y1) > v.y1 + 200); }

// lettres tracees a la main (traits droits) pour l'enseigne
const GLY = { L: [[[0, 0], [0, 10], [6, 10]]], I: [[[3, 0], [3, 10]]], '.': [[[2.6, 9.4], [3.4, 10]]], F: [[[6, 0], [0, 0], [0, 10]], [[0, 5], [4.5, 5]]] };
function sign(txt, x, y, s, seed) { X.lineCap = 'round'; X.lineJoin = 'round'; X.strokeStyle = INK; X.lineWidth = Math.max(2.6, 1.2 / Z); let cx = x;
  for (const ch of txt) { for (const st of GLY[ch]) { X.beginPath(); st.forEach((q, i) => { const px = cx + q[0] * s + sh(seed, i + ch.charCodeAt(0), 3) * .8, py = y + q[1] * s + sh(seed, i, 4) * .8; i ? X.lineTo(px, py) : X.moveTo(px, py); }); X.stroke(); } cx += (ch === '.' ? 6 : ch === 'I' ? 7.5 : 9.5) * s; } }

function drawBooth(F, t) {
  const hit = F.hacked && t >= T_HIT, sq = F.hacked ? boothSquash(t) : 0, lw = LW();
  X.save(); X.translate(F.bx, F.by + 108); X.scale(1 + .1 * sq, 1 - .13 * sq); X.translate(0, -108);
  const J = (pts, s) => jit(pts, 9000 + s + F.id * 50, .7);
  X.lineJoin = 'round'; X.lineCap = 'round'; X.strokeStyle = INK; X.lineWidth = lw; X.fillStyle = BLK;
  // socle, corps, toit
  trace(J([[-88, 92], [88, 92], [88, 108], [-88, 108]], 1), true); X.fill(); X.stroke();
  trace(J([[-72, -62], [72, -62], [72, 92], [-72, 92]], 2), true); X.fill(); X.stroke();
  trace(J([[-96, -62], [-66, -112], [66, -112], [96, -62]], 3), true); X.fill(); X.stroke();
  if (Z > .3) {
    // guichet : allume (blanc) tant que la plateforme est a elle ; rideau baisse ensuite
    const sh0 = F.hacked ? E.pars(seg(t, T_HIT, T_HIT + .1)) : 0;
    X.beginPath(); X.moveTo(-42, 34); X.lineTo(-42, -16); X.quadraticCurveTo(-42, -40, 0, -40); X.quadraticCurveTo(42, -40, 42, -16); X.lineTo(42, 34); X.closePath();
    X.fillStyle = INK; X.fill(); X.save(); X.clip(); X.fillStyle = BLK; X.fillRect(-44, -42, 88, 78 * sh0);
    if (sh0 > 0 && Z > 1) { X.strokeStyle = INK; X.lineWidth = lw * .6; for (let i = 0; i < 6; i++) { const yy = -42 + 78 * sh0 - 6 - i * 12; X.beginPath(); X.moveTo(-44, yy); X.lineTo(44, yy); X.stroke(); } }
    X.restore(); X.strokeStyle = INK; X.lineWidth = lw; X.stroke();
    trace(J([[-54, 36], [54, 36]], 4)); X.lineWidth = lw * 1.6; X.stroke(); X.lineWidth = lw;
    if (F.hacked && Z > .7) sign('LI.FI', -31, 52, 2.0, 31);
    else if (Z > .7) { X.beginPath(); X.moveTo(-30, 62); X.lineTo(30, 62); X.stroke(); }
    if (hit && Z > .6) { X.lineWidth = lw * .8; for (const [dx, dy] of [[-38, 14], [-24, 26], [30, 20], [44, 9]]) { X.beginPath(); X.moveTo(6 + Math.sign(dx) * 22, -112); X.lineTo(6 + dx + Math.sign(dx) * 14, -112 + dy); X.stroke(); } }
  }
  X.restore();
}
function stripedArm(tip, scale, t, flow, seed) {
  const w = 30 * scale, O = [tip.x + 760 * scale, tip.y - 1750 * scale];
  const d = t - T_HIT, wave = seed === 0 && d > 0 ? 70 * Math.exp(-d * 3.4) * Math.sin(d * 13) : 0;
  const pts = cubic(O, [tip.x + 640 * scale, tip.y - 900 * scale], [tip.x + 30 * scale + wave, tip.y - 430 * scale], [tip.x, tip.y - 2], 34);
  const p = jit(pts, 7000 + seed, .8); X.lineCap = 'butt'; X.lineJoin = 'round'; const lw = Math.max(LW(), 3 * scale * .6);
  smooth(p); X.strokeStyle = INK; X.lineWidth = w + 2 * lw; X.stroke();
  smooth(p); X.strokeStyle = BLK; X.lineWidth = w; X.stroke();
  smooth(p); X.setLineDash([22 * scale, 26 * scale]); X.lineDashOffset = -flow * scale; X.strokeStyle = INK; X.stroke(); X.setLineDash([]); X.lineDashOffset = 0;
  return pts;
}
function drawThief(t) {
  const tip = thiefTip(t); if (!tip) return;
  X.save(); X.beginPath(); X.rect(-3000, -6000, 6000, 6000 + BOOTH.y + ROOF_Y + (t >= T_HIT ? 15 * boothSquash(t) : 300)); X.clip();
  // les rayures defilent quand ca tire : la matiere qui file donne le sens du flux
  let flow = 0; for (const [tb] of TB) flow += 60 * E.doux(seg(t, tb, tb + .5)); flow += 500 * E.pars(seg(t, T_OUT, T_OUT + .34));
  const pts = stripedArm(tip, 1, t, flow, 0);
  for (const [tb, size] of TB) { const u = seg(t, tb, tb + .85); if (u > 0 && u < 1) { const q = along(pts, 1 - Math.pow(u, 1.5)); X.save(); X.translate(q.x, q.y); X.rotate(q.a); X.beginPath(); X.ellipse(0, 0, 30 * size, 27 * size, 0, 0, 7); X.fillStyle = INK; X.fill(); X.strokeStyle = BLK; X.lineWidth = 3; X.stroke(); X.restore(); } }
  if (t < T_HIT + .1) hand(tip.x, tip.y - 6, 2.3, { curl: tip.curl, strain: 2 * (1 - tip.curl) }, 4242);
  X.restore();
}
function drawHover(F, i, t) {       // une main rayee vient se tenir au-dessus de chaque autre guichet : elle attend
  const s = T_HOVER + i * .14; if (t < s) return;
  const y = pose(t, [[s, -2600], [s + .3, -760, bez(.1, .9, .2, 1)], [s + .38, -785, E.doux], [s + .6, -775, E.doux]]);
  const tip = { x: F.bx + 10, y: F.by + y }; stripedArm(tip, 4, t, 0, 10 + i);
  hand(tip.x, tip.y - 20, 9.5, { curl: pose(t, [[s + .3, .1], [s + .7, .32, E.doux]]), strain: 1 }, 4300 + i);
}

// ---------- sous-titres : norme du fondateur (Montserrat Bold 68 px, blanc, contour noir, sans fond, 2 a 5 mots, <= 22 car., coupe franche) ----------
const SUBS = [];
for (const v of TL.voix) {
  const toks = []; for (const w of v.st.split(' ')) { if (/[\wÀ-ÿ]/.test(w)) toks.push(w); else if (toks.length) toks[toks.length - 1] += '\u00a0' + w; }
  let cur = null, n = 0; const cards = [];
  toks.forEach((w, i) => { const prev = i ? toks[i - 1] : '';
    if (!cur || /[.?!:]$/.test(prev) || n >= 5 || (cur.txt + ' ' + w).length > 22) { cur = { txt: w, a: Math.max(0, (v.mots[i] || v.mots[v.mots.length - 1]).t - .06), b: 0 }; cards.push(cur); n = 1; }
    else { cur.txt += ' ' + w; n++; } });
  cards[cards.length - 1].b = v.fin + .3; SUBS.push(...cards);
}
SUBS.forEach((s, i) => { if (!s.b) s.b = SUBS[i + 1].a; else if (SUBS[i + 1]) s.b = Math.min(s.b, SUBS[i + 1].a); });
window.SUBS = SUBS;
function drawSubs(t) {
  const s = SUBS.find(s => t >= s.a && t < s.b); if (!s) return;
  const lines = s.txt.split('\n'); X.font = '700 68px Montserrat'; X.textAlign = 'center'; X.textBaseline = 'alphabetic'; X.lineJoin = 'round';
  lines.forEach((l, i) => { const y = 988 - (lines.length - 1 - i) * 78;
    X.save(); X.shadowColor = 'rgba(0,0,0,.5)'; X.shadowBlur = 2; X.shadowOffsetY = 2; X.strokeStyle = 'rgba(0,0,0,.9)'; X.lineWidth = 7; X.strokeText(l, W / 2, y); X.restore();
    X.fillStyle = '#fff'; X.fillText(l, W / 2, y); });
}
// mention de source : une ligne nue, petit corps, blanc 70 %, une fois
function drawSource(t) { const a = T_PULL + T_WAVE * .6, b = V.v04.debut + .6; if (t < a || t > b) return;
  X.textAlign = 'left'; X.textBaseline = 'alphabetic'; X.font = '700 21px Montserrat'; X.fillStyle = 'rgba(255,255,255,.7)'; X.fillText("Source : rapport d'incident de LI.FI, 16 juillet 2024", 48, 1046); }
// ---------- image ----------
function scene(t) {
  const c = camAt(t); Z = c.z;
  X.setTransform(1, 0, 0, 1, 0, 0); X.fillStyle = BLK; X.fillRect(0, 0, W, H);
  X.translate(W / 2, H / 2 - 30); X.rotate(c.r); X.scale(c.z, c.z); X.translate(-c.x, -c.y);
  const view = { x0: c.x - W * .56 / c.z, x1: c.x + W * .56 / c.z, y0: c.y - H * .62 / c.z, y1: c.y + H * .62 / c.z };
  for (const F of FIELDS) {
    if (F.bx + 2100 < view.x0 || F.bx - 2100 > view.x1 || F.by + 1200 < view.y0 || F.by - 1200 > view.y1) continue;
    drawArms(F, t, view);
    for (const p of F.ps) if (inView(p.x, p.y, view, 0)) drawPocket(F, p, t);
    drawFly();
    if (F === F0) drawThief(t);
    drawBooth(F, t);
  }
  OTHERS.forEach((F, i) => drawHover(F, i, t));
  X.setTransform(1, 0, 0, 1, 0, 0);
}
const acc = document.createElement('canvas'); acc.width = W; acc.height = H; const AX = acc.getContext('2d');
function camSpeed(t) { const a = camAt(t - .5 / FPS), b = camAt(t + .5 / FPS); return (Math.hypot(b.x - a.x, b.y - a.y) * b.z + Math.abs(Math.log(b.z / a.z)) * 900); }
function draw(t) {
  BOIL = Math.floor(t * 4.5); BOILK = t * 4.5 - BOIL; NOW = t;
  const act = window.actAt ? window.actAt(t) : null;
  const one = act ? (tt => { X.setTransform(1, 0, 0, 1, 0, 0); X.fillStyle = BLK; X.fillRect(0, 0, W, H); act.draw(tt); X.setTransform(1, 0, 0, 1, 0, 0); }) : scene;
  const n = act ? act.blur(t) : (sp => sp > 14 ? 6 : sp > 2.5 ? 4 : 1)(camSpeed(t));      // flou de mouvement vrai (obturateur 180 deg)
  if (n === 1) one(t);
  else { AX.clearRect(0, 0, W, H); for (let i = 0; i < n; i++) { one(t + (i / n - .5) * .5 / FPS); AX.globalAlpha = 1 / (i + 1); AX.drawImage(cv, 0, 0); } AX.globalAlpha = 1; X.drawImage(acc, 0, 0); }
  if (window.actOver) window.actOver(t);
  if (!act) drawSource(t);
  drawSubs(t);
}
window.renderAt = (t, type = 'image/jpeg', q = .95) => { draw(t); return cv.toDataURL(type, q); };
// reperes sonores, derives de la meme chronologie que l'image
window.CUES = (() => { const c = [];
  c.push({ t: T_TAP0, k: 'tap' }, { t: T_HIT - .62, k: 'arrive' }, { t: T_HIT, k: 'coup' }, { t: T_HIT + .03, k: 'rideau' }, { t: T_HIT + .45, k: 'tension', d: .9 });
  for (const p of F0.ps) if (p.tD < 1e8) c.push({ t: p.tD + .03, k: 'prise', g: clamp(1.2 - p.dist / 2400, .25, 1), pan: clamp(p.x / 1800, -1, 1) });
  SCOOP.forEach((s, i) => c.push({ t: s + .03, k: 'poignee', g: 1, n: i }));
  c.push({ t: SCOOP[2] - .46, k: 'etire', d: .5 });
  LUNGE.forEach((s, i) => c.push({ t: s + .04, k: 'bute', g: [.6, .8, 1][i] }));
  c.push({ t: T_LIMP, k: 'renonce' }, { t: T_OUT, k: 'retire' });
  OTHERS.forEach((F, i) => c.push({ t: T_HOVER + i * .14 + .3, k: 'guette', n: i }));
  c.push({ t: V.v07.debut + .25, k: 'plonge', d: 1.3 }, { t: T_Q + .3, k: 'poignee', g: 1, n: 0 });
  return { dur: DUR, hit: T_HIT, pull: T_PULL, wave: T_WAVE, cues: c.sort((a, b) => a.t - b.t) }; })();
// les images cles et le signal « pret » sont poses par acts.js, charge ensuite
