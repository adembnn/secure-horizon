#!/usr/bin/env python3
# son.py : son d'impact synthetise (aucun fichier tiers, pas de musique) a partir des reperes de la page, mixe sous la voix (48 kHz stereo).
# Registre bande-annonce : coups graves, montees coupees net, passages, nappe sous la menace, matiere discrete entre les phrases, silence avant le verdict.
# NB : ce son n'a ete ecoute par personne ; il est seulement mesure (les mesures sont imprimees a chaque lancement).
#   python son.py [cues.json] [mix.wav] [--pistes] [--sans-voix]
#   par defaut ../out/cues.json -> ../out/mix.wav ; la voix (figee) est lue dans ../essai/voix/voix.wav
#   --pistes    ecrit aussi <mix>.voix.wav et <mix>.effets.wav (les deux pistes telles qu'elles sont dans le mix : leur somme est le mix)
#   --sans-voix planche d'essai : memes effets, voix muette, pas d'ecrasement lateral
# Contrat d'entree : { dur, cues: [{t, k, ...}], menace: [[a, b], ...], scenes: [{id, a, b}] }.
# Sortes : coup, boum {g}, impact {g}, riser {d}, whoosh {d, g, sens}, souffle {d}, toc {g}, tic {g}, touche {g}, defile {d}, bute {g}, poignee {n, g},
#   prise {g, pan}, retire, renonce, arrive {d}, etire {d}, rideau, tap, tension {d}, guette {n}, plonge {d}, silence {d}.
# Une sorte inconnue ou un repere mal forme est ignore avec un avertissement, jamais une erreur.
# Chaine : effets + fond -> silences (tout coupe sauf la voix) -> ecrasement lateral (les effets restent ECART dB sous la voix pendant les mots)
#   -> + voix -> niveau (CIBLE LUFS) -> limiteur a anticipation (PLAFOND dBFS, crete mesuree sur-echantillonnee x4). Aucun ecretage.
import json, os, sys, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, lfilter, resample_poly, iirpeak, fftconvolve
from scipy.ndimage import minimum_filter1d, maximum_filter1d, uniform_filter1d
H = os.path.dirname(os.path.abspath(__file__)); E = os.path.join(H, '..', 'essai'); O = os.path.join(H, '..', 'out'); SR = 48000
POS = [a for a in sys.argv[1:] if not a.startswith('--')]; OPT = {a for a in sys.argv[1:] if a.startswith('--')}
CUES = POS[0] if POS else os.path.join(O, 'cues.json'); MIX = POS[1] if len(POS) > 1 else os.path.join(O, 'mix.wav')
SANS_VOIX = '--sans-voix' in OPT; PISTES = '--pistes' in OPT
CIBLE, PLAFOND, ECART, G_VOIX = -15.0, -2.0, 10.0, 1.72      # LUFS vise ; plafond de crete (dBFS) ; ecart voix/effets impose pendant les mots (dB) ; gain de la voix avant mise a niveau
C = json.load(open(CUES, encoding='utf-8')); DUR = float(C['dur']); N = int(SR * DUR); NT = N + 3 * SR
FX = np.zeros((NT, 2)); HOP = 48; NC = N // HOP + 1           # HOP : pas de controle de 1 ms

# ---------- outils ----------
def R(t, s=0): return np.random.default_rng(int(abs(t) * 1000) * 131 + s)        # alea propre a chaque repere : ajouter un repere ne change pas les autres
def tt(d): return np.arange(max(8, int(SR * d))) / SR
_S = {}
def _sos(kind, f, o):
    if (kind, f, o) not in _S: _S[(kind, f, o)] = butter(o, [min(x, SR * .49) for x in f] if len(f) > 1 else min(f[0], SR * .49), btype=kind, fs=SR, output='sos')
    return _S[(kind, f, o)]
def bp(x, f1, f2, o=2): return sosfilt(_sos('band', (f1, f2), o), x, axis=0)
def lp(x, f, o=2): return sosfilt(_sos('low', (f,), o), x, axis=0)
def hp(x, f, o=2): return sosfilt(_sos('high', (f,), o), x, axis=0)
def unite(x): return x / (x.std() + 1e-12)                                       # ecart type 1
def crete(x): return x / (np.abs(x).max() + 1e-12)                               # crete 1
def nbp(n, r, f1, f2, s=False): return unite(bp(r.standard_normal((n, 2) if s else n), f1, f2))
def nhp(n, r, f, s=False): return unite(hp(r.standard_normal((n, 2) if s else n), f))
def st(x, pan=0.):                                                               # mono -> stereo a puissance constante ; pan de -1 (gauche) a 1 (droite), nombre ou courbe
    a = (np.clip(pan, -1, 1) + 1) * np.pi / 4; return np.stack([x * np.cos(a), x * np.sin(a)], 1) * 2 ** .5
def put(x, t, g=1.):
    if x.ndim == 1: x = st(x)
    i = int(round(t * SR))
    if i < 0: x = x[-i:]; i = 0
    n = min(len(x), NT - i)
    if n > 0: FX[i:i + n] += x[:n] * g
def fin(y, d=.02): m = min(len(y), int(SR * d)); y[-m:] *= (np.linspace(1, 0, m)[:, None] if y.ndim == 2 else np.linspace(1, 0, m)); return y
FB = 2 ** np.arange(np.log2(80), np.log2(14000), 1 / 3)
def balaie(n, fc, r, larg=.7, s=True):                                           # bruit dont la bande suit fc(t) en Hz (largeur en octaves) : banc de tiers d'octave fondus
    y = np.zeros((n, 2) if s else n); lf = np.log2(np.maximum(fc, 30.)) * np.ones(n)
    for f in FB:                                                                 # un bruit independant par bande : les bandes s'ajoutent en puissance, sans creux aux recouvrements
        w = np.exp(-.5 * ((lf - np.log2(f)) / larg) ** 2)
        if w.max() > .02: y += bp(r.standard_normal((n, 2) if s else n), f * .89, f * 1.122) * (1000 / f) ** .5 * (w[:, None] if s else w)
    return unite(y)

# ---------- les sortes (chaque fonction rend un son de crete 1) ----------
def boum(g=1., f0=40., r=None):       # sous-grave dont la hauteur chute (170 -> 40 Hz en 60 ms) + claquement bref + queue courte
    gg = float(np.clip(g, .3, 1.6)); t = tt(1.3 + .35 * gg); n = len(t)
    f = f0 * (1 + 3.2 * np.exp(-t / .020) + .5 * np.exp(-t / .15)); ph = 2 * np.pi * np.cumsum(f) / SR
    e = (1 - np.exp(-t / .0012)) * np.exp(-t / (.22 + .10 * gg))
    sub = np.tanh(2.2 * np.sin(ph) * e) / np.tanh(2.2) + .22 * np.sin(2 * ph + .5) * e ** 1.5           # la saturation douce donne les harmoniques qui passent sur de petits haut-parleurs
    corps = nbp(n, r, 50, 200) * np.exp(-t / .09) * .30
    clac = nhp(n, r, 1600, 1) * np.exp(-t / .006)[:, None] * .42 + nbp(n, r, 350, 2600, 1) * np.exp(-t / .024)[:, None] * .34
    queue = nbp(n, r, 60, 480, 1) * ((1 - np.exp(-t / .03)) * np.exp(-t / .24))[:, None] * .10
    return crete(fin((sub + corps)[:, None] + clac + queue, .08))
def impact(r, g=1.):                  # coup sec et large : grave tres court, cogne, claquement decorrele gauche/droite, premieres reflexions croisees, pas de queue
    t = tt(.5); n = len(t); f = 58 * (1 + 2.6 * np.exp(-t / .011)); ph = 2 * np.pi * np.cumsum(f) / SR
    bas = np.tanh(2.6 * np.sin(ph) * (1 - np.exp(-t / .0008)) * np.exp(-t / .060)) / np.tanh(2.6)
    cogne = nbp(n, r, 130, 520) * np.exp(-t / .030) * .55
    y = (bas + cogne)[:, None] + nhp(n, r, 2000, 1) * np.exp(-t / .0045)[:, None] * .75 + nbp(n, r, 600, 3400, 1) * np.exp(-t / .014)[:, None] * .6
    y += nbp(n, r, 180, 2600, 1) * ((1 - np.exp(-t / .004)) * np.exp(-t / .06))[:, None] * .10
    hi = hp(y, 220); a, b = int(.013 * SR), int(.021 * SR); y[a:, 0] += .42 * hi[:-a, 1]; y[b:, 1] += .42 * hi[:-b, 0]
    return crete(fin(y, .04))
def riser(d, r):                      # montee : bruit dont la bande grimpe de 170 Hz a 6,7 kHz, battement qui accelere, glissando discret ; COUPE NET 45 ms avant la fin
    t = tt(d); n = len(t); k = t / d
    trem = 1 - .4 * k * (.5 + .5 * np.sin(2 * np.pi * np.cumsum(7 + 30 * k ** 2) / SR))
    y = balaie(n, 170 * 2 ** (5.3 * k ** 1.25), r, .65) * (k ** 2.3 * trem)[:, None] * .33
    y += (np.sin(2 * np.pi * np.cumsum(52 * 2 ** (2.6 * k)) / SR) * k ** 2.5 * .28)[:, None]
    c = n - int(.045 * SR); m = int(.003 * SR)
    if c > 4 * m: y[c:] = 0; y[c - m:c] *= np.linspace(1, 0, m)[:, None]
    return crete(y)
def whoosh(d, r, sens=1):             # passage : bande qui monte puis redescend (effet Doppler), volume en cloche, panoramique de gauche a droite (sens < 0 : droite a gauche)
    t = tt(d); n = len(t); k = t / d; env = np.sin(np.pi * k) ** 1.2 * np.exp(-.5 * ((k - .5) / .30) ** 2)
    x = balaie(n, 300 * 2 ** (3.1 * np.exp(-.5 * ((k - .46) / .2) ** 2)) * (1 - .3 * k), r, .7, s=False) * env
    pan = (1 if sens >= 0 else -1) * np.clip((k - .5) * 3.4, -1, 1) * .95
    return crete(st(x, pan) + st(nbp(n, r, 50, 180) * env ** 2 * .45, pan * .4))
def souffle(d, r, sens=1):            # air : sens 1 = montee qui retombe vite ; sens -1 = retombee
    if sens > 0: t = tt(d + .3); k = np.clip(t / d, 0, 1); env = np.where(t < d, k ** 2.2, np.exp(-(t - d) / .07)); fc = 380 * 2 ** (2.4 * k)
    else: t = tt(d); k = t / d; env = (1 - k) ** 2 * (1 - np.exp(-t / .012)); fc = 1700 * 2 ** (-2.5 * k)
    return crete(fin(balaie(len(t), fc, r, .8) * env[:, None]))
def frotte(d, r, r0=14., r1=34., ton=1.):     # frottement de corde : accroche-glisse (impulsions irregulieres) dans trois resonances + un peu de fibre
    t = tt(d); n = len(t); k = t / d; j = unite(lp(r.standard_normal(n), 5.))
    ph = np.cumsum(r0 * (r1 / r0) ** k * np.clip(1 + .28 * j, .3, 2)) / SR; i = np.flatnonzero(np.diff(np.floor(ph)) > 0)
    exc = np.zeros(n); exc[i] = .5 + .5 * r.random(len(i)); y = np.zeros(n)
    for f, q, a in ((290, 9, 1.), (610, 12, .7), (1180, 14, .45)):
        b_, a_ = iirpeak(f * ton * (1 + .06 * (r.random() - .5)), q, fs=SR); y += unite(lfilter(b_, a_, exc)) * a
    fibre = nbp(n, r, 600, 3000) * np.sqrt(np.maximum(lp(exc, 30.), 0)); y = unite(y) + unite(fibre) * .25
    return crete(fin(y * np.sin(np.pi * k) ** .6, .03))
def toc(r, f=140., d=.28):            # cogne mate
    t = tt(d); n = len(t)
    return crete(np.sin(2 * np.pi * np.cumsum(f * (1 + .7 * np.exp(-t / .010))) / SR) * np.exp(-t / .045) + .4 * np.sin(2 * np.pi * f * 2.4 * t) * np.exp(-t / .022) + nbp(n, r, 700, 3200) * np.exp(-t / .0035) * .3)
def tic(r, f=2100., d=.09):           # petit choc metallique, deux partiels non harmoniques
    t = tt(d); n = len(t)
    return crete(np.sin(2 * np.pi * f * t) * np.exp(-t / .011) + .5 * np.sin(2 * np.pi * f * 2.76 * t + 1) * np.exp(-t / .006) + nhp(n, r, 3000) * np.exp(-t / .0025) * .5)
def touche(r):                        # touche de clavier : enfoncement puis relachement
    t = tt(.075); n = len(t); y = nbp(n, r, 1500, 6500) * np.exp(-t / .003) + .6 * np.sin(2 * np.pi * (350 + 200 * r.random()) * t) * np.exp(-t / .012)
    j = int((.028 + .012 * r.random()) * SR); y[j:] += .35 * (nbp(n, r, 2000, 7000) * np.exp(-t / .002))[:n - j]; return crete(y)
def pieces(r, nb=5, etale=.07):       # tintement de pieces
    t = tt(etale + .14); y = np.zeros(len(t))
    for _ in range(nb): j = int(r.random() * etale * SR); m = len(t) - j; y[j:] += np.sin(2 * np.pi * (3000 + 4500 * r.random()) * t[:m]) * np.exp(-t[:m] / (.012 + .02 * r.random())) * (.5 + .5 * r.random())
    return crete(y)
def cliquetis(d, r):                  # defilement : cliquetis qui ralentit, de gauche a droite
    t = tt(d); n = len(t); k = t / d; ph = np.cumsum(26 * (1 - .35 * k)) / SR; i = np.flatnonzero(np.diff(np.floor(ph)) > 0)
    exc = np.zeros(n); exc[i] = .6 + .4 * r.random(len(i)); tk = tt(.014); y = fftconvolve(exc, nbp(len(tk), r, 1400, 7000) * np.exp(-tk / .003))[:n]
    return crete(st(y * np.sin(np.pi * k) ** .4, (2 * k - 1) * .5))
def guette(nn, r):                    # pulsation grave a l'attaque lente : quelque chose rode
    t = tt(1.1); f = (56 - 3 * nn) * (1 + .6 * np.exp(-t / .05))
    return crete(fin(np.tanh(1.6 * np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 - np.exp(-t / .02)) * np.exp(-t / .28)) + nbp(len(t), r, 80, 300) * np.exp(-t / .15) * .12, .1))

# ---------- reperes ----------
SIL, AUD, POIDS, NETS, AVERT = [], [], [], [], {}
class Inconnue(Exception): pass
def joue(c):
    k = c['k']; t = float(c['t']); g = float(np.clip(c.get('g', 1), 0, 2.5)); r = R(t, len(k)); pan = float(np.clip(c.get('pan', 0), -1, 1)); nn = int(c.get('n', 0))
    d = lambda v: float(np.clip(c.get('d', v), .08, 8)); w = .12
    if not (t == t and -1 <= t <= DUR + 1): raise ValueError('temps hors film')
    if k == 'silence': SIL.append((t, d(.5))); return
    if k == 'boum': put(boum(g, 40., r), t, .8 * g ** .6); w = 1
    elif k == 'coup': put(boum(1.3, 40., r), t, .9); put(impact(r), t, .45); w = 1
    elif k == 'impact': put(impact(r), t, .68 * g ** .6); w = 1
    elif k == 'riser': put(riser(d(1.), r), t, .42); NETS.append(t + d(1.)); w = .6
    elif k == 'whoosh': put(whoosh(d(.5), r, c.get('sens', 1)), t, .36 * min(g, 1.6)); w = .5
    elif k == 'plonge': put(riser(d(1.), r), t, .40); put(boum(1.1, 40., r), t + d(1.), .85); AUD.append(t + d(1.)); NETS.append(t + d(1.)); w = .8
    elif k == 'souffle': put(souffle(d(.5), r), t, .27); w = .35
    elif k == 'arrive': put(souffle(d(.6), r), t, .24); w = .3
    elif k == 'etire': put(souffle(d(.6), r), t, .14); put(frotte(d(.6), r, 16, 44), t, .17); w = .3
    elif k == 'tension': put(frotte(d(.9), r, 10, 30, .9), t, .15); put(souffle(d(.9), r), t, .07); w = .3
    elif k in ('retire', 'renonce'):
        put(souffle(.45, r, -1), t, .27); w = .3
        if k == 'renonce': put(frotte(.4, r, 30, 12), t, .12)
    elif k == 'toc': put(toc(r, 140.), t, .32 * g)
    elif k == 'tic': put(tic(r, 1900 + 500 * r.random()), t, .20 * g)
    elif k == 'tap': put(tic(r, 1300., .05), t, .18); put(toc(r, 300., .05), t, .08)
    elif k == 'touche': put(st(touche(r), .3 * (r.random() - .5)), t, .11 * g)
    elif k == 'defile': put(cliquetis(d(1.), r), t, .20); w = .3
    elif k == 'bute': put(toc(r, 165., .3), t, .5 * g); put(boum(.4, 62., r), t, .28 * g); put(frotte(.32, r, 22, 50, 1.2), t + .03, .13 * g); w = .5
    elif k == 'poignee': put(pieces(r, 5 + nn % 4), t, .22 * g); put(toc(r, 108., .22), t, .32 * g); w = .3
    elif k == 'prise': put(st(crete(nbp(3600, r, 1000, 4200) * np.exp(-tt(.075) / .005) + .6 * pieces(r, 1, .004)[:3600] + .5 * toc(r, 120 + 60 * r.random(), .075)), pan * .85), t, .15 * g)
    elif k == 'rideau':
        for i in range(7): put(toc(r, 520. - 45 * i, .06), t + i * .017, .16); put(tic(r, 1500. - 110 * i, .04), t + i * .017, .12)
        put(toc(r, 95., .25), t + .125, .3)
    elif k == 'guette': put(st(guette(nn, r), (-.55, .55)[nn % 2]), t, .36); w = .4
    else: raise Inconnue(k)
    AUD.append(t); POIDS.append((t, w))
for c in C.get('cues', []):
    try: joue(c)
    except Inconnue: AVERT[str(c.get('k'))] = AVERT.get(str(c.get('k')), 0) + 1
    except Exception as e: print(f'AVERTISSEMENT : repere ignore {json.dumps(c, ensure_ascii=False)} ({type(e).__name__} : {e})', file=sys.stderr)
for k, n in AVERT.items(): print(f'AVERTISSEMENT : sorte inconnue « {k} » ignoree ({n} repere(s))', file=sys.stderr)

# ---------- voix (figee) et sa presence ----------
v, sr = sf.read(os.path.join(E, 'voix', 'voix.wav')); assert sr == SR
v = (v.mean(1) if v.ndim > 1 else v); v = np.pad(v, (0, max(0, N - len(v))))[:N] * (0 if SANS_VOIX else G_VOIX)
def env(x, win=.03):                  # enveloppe efficace au pas de 1 ms, fenetre centree
    p = (x ** 2).mean(1) if x.ndim == 2 else x ** 2; p = np.pad(p, (0, NC * HOP - len(p))); return np.sqrt(np.maximum(uniform_filter1d(p.reshape(-1, HOP).mean(1), max(1, int(win * 1000)), mode='nearest'), 0))
def haut(c, n=N): return np.interp(np.arange(n), (np.arange(len(c)) + .5) * HOP, c)      # du pas de controle au pas d'echantillon
def lent(seed, fc): x = sosfilt(butter(2, fc, fs=1000, output='sos'), np.random.default_rng(seed).standard_normal(NC + 8000))[8000:]; return unite(x)
ev = env(v); MOT = ev > 10 ** (-48 / 20)                                           # la voix parle (son fond est un zero numerique)
pres = uniform_filter1d(maximum_filter1d(MOT.astype(float), 121), 200, mode='nearest')            # 0..1, tenue 60 ms, pentes de 0,2 s
phrase = maximum_filter1d(MOT.astype(np.uint8), 301) > 0                           # les trous de moins de 0,3 s font partie de la phrase
dd = np.diff(np.concatenate([[1], phrase.astype(np.int8), [1]])); TROUS = [(a / 1000, b / 1000) for a, b in zip(np.flatnonzero(dd == -1), np.flatnonzero(dd == 1)) if b - a >= 700]

# ---------- fond : la matiere qui reste entre les phrases (souffle, grave tenu, frottements de corde) et la nappe sous la menace ----------
tc = np.arange(NC) / 1000.
imp = np.zeros(NC)
for t, w in POIDS:
    if 0 <= int(t * 1000) < NC: imp[int(t * 1000)] += w
act = 1 - np.exp(-fftconvolve(imp, np.concatenate([np.exp(np.arange(-600, 0) / 200.), np.exp(-np.arange(0, 4000) / 1100.)]))[600:600 + NC])    # activite de l'image, lue dans les reperes : 0..1
teinte = np.full(NC, .2); creux = np.ones(NC)
for i, s in enumerate(C.get('scenes', [])):                                        # chaque scene a sa couleur d'air ; un creux bref a chaque raccord
    teinte[(tc >= s['a']) & (tc < s['b'])] = (.30, .10, .40, .20, .45, .15, .35)[i % 7]; creux *= 1 - .6 * np.exp(-((tc - s['a']) / .12) ** 2)
teinte = uniform_filter1d(teinte, 300, mode='nearest')
menv = np.zeros(NC)
for a, b in C.get('menace', [[0, DUR]]): menv += np.clip((tc - a) / 1.5, 0, 1) * np.clip((b - tc) / 1.0, 0, 1) * (tc >= a) * (tc <= b)
menv = np.clip(menv, 0, 1); monte = np.zeros(NC)
for t, d in SIL: monte = np.maximum(monte, np.clip((tc - (t - 1.2)) / 1.2, 0, 1) ** 2 * (tc <= t))      # le fond gonfle avant un silence voulu : la coupe s'entend
trou = 1 - pres; trou_lent = uniform_filter1d(trou, 500, mode='nearest')
tA = np.arange(N) / SR; rb = np.random.default_rng(11)
def tenu(parts, seed):                # partiels tenus, chacun avec sa lente respiration ; ni rythme ni melodie
    y = np.zeros(N)
    for j, (f, a) in enumerate(parts): y += a * np.sin(2 * np.pi * f * tA + 1.3 * j) * haut(1 + .3 * np.clip(lent(seed + j, .12), -2, 2))
    return unite(y)
air = unite(bp(rb.standard_normal((N, 2)), 130, 650)) * np.stack([haut(10 ** (.125 * np.clip(lent(31, .15), -2, 2))), haut(10 ** (.125 * np.clip(lent(32, .15), -2, 2)))], 1)
air += unite(bp(rb.standard_normal((N, 2)), 650, 3000)) * haut((teinte + .5 * act) * .55)[:, None]
grave = tenu(((55., 1.), (82.6, .6), (110.4, .5), (165.3, .35)), 40)
nappe = tenu(((41.2, 1.), (41.55, .8), (61.9, .45), (82.9, .3)), 50)[:, None] + unite(bp(rb.standard_normal((N, 2)), 40, 140)) * .45
BED = air * haut(10 ** (-43 / 20) * (1 + 1.2 * trou) * (1 - .6 * menv))[:, None]
BED += grave[:, None] * haut(10 ** (-45 / 20) * (1 + 2.0 * trou_lent) * (1 + .6 * act) * (1 - .8 * menv))[:, None]
BED += nappe * haut(10 ** (-31 / 20) * menv * (1 + .45 * trou_lent))[:, None]
BED *= haut((1 + .8 * monte) * creux * np.clip(tc / .5, 0, 1) * np.clip((DUR - tc) / .35, 0, 1))[:, None]
FX[:N] += BED; del BED, air, grave, nappe
for i, (a, b) in enumerate(TROUS):                                                 # dans chaque trou de voix apres l'ouverture : un frottement de corde ou une respiration grave, en alternance
    if a < 28 or b - a < .7: continue
    r = R(a, 77); d = min(b - a - .25, .55 + .45 * r.random()); pan = (-.35, .35)[i % 2]
    if d < .3: continue
    if i % 2 == 0: put(st(frotte(d, r, 9 + 6 * r.random(), 22 + 16 * r.random(), .8 + .5 * r.random()), pan), a + .12, .085)
    else: put(st(crete(unite(bp(r.standard_normal(int(d * SR)), 180, 800)) * np.sin(np.pi * np.arange(int(d * SR)) / int(d * SR)) ** 1.5), pan), a + .12, .090)
    if b - a > 1.9: put(st(frotte(.6, r, 20, 11, .7), -pan), a + (b - a) * .55, .07)

# ---------- silences : tout est coupe sauf la voix ; si le prochain repere tombe moins de 0,5 s apres, le silence tient jusqu'a lui (silence, puis frappe) ----------
fx = FX[:N]; porte = np.ones(N); AUD.sort(); SILS = []
for t, d in SIL:
    b = t + d; nx = [x for x in AUD if b < x <= b + .5]; b = nx[0] if nx else b; i, j = max(0, int(t * SR)), min(N, int(b * SR)); m = min(i, int(.04 * SR)); SILS.append((t, b))
    porte[i - m:i] = np.minimum(porte[i - m:i], .5 + .5 * np.cos(np.linspace(0, np.pi, m))); porte[i:j] = 0
    if not nx: q = min(N - j, int(.06 * SR)); porte[j:j + q] = np.minimum(porte[j:j + q], np.linspace(0, 1, q))
for te in NETS:                        # la montee se coupe net : 45 ms de noir complet (fond compris) avant le coup
    i, j = int(round((te - .045) * SR)), int(round(te * SR)); m = int(.003 * SR)
    if i - m < 0 or j >= N: continue
    porte[i - m:i] = np.minimum(porte[i - m:i], np.linspace(1, 0, m)); porte[i:j] = 0
    if not any(te - .005 <= x <= te + .02 for x in AUD): q = int(.008 * SR); porte[j:j + q] = np.minimum(porte[j:j + q], np.linspace(0, 1, q)[:len(porte[j:j + q])])
fx *= porte[:, None]

# ---------- ecrasement lateral : pendant les mots, les effets restent ECART dB sous la voix (anticipation 45 ms, relachement 0,18 s) ----------
def relache(x, tau):                  # descend tout de suite, remonte lentement ; ne depasse jamais x
    y = np.empty_like(x); a = 1 - np.exp(-1 / tau); z = x[0]
    for i, q in enumerate(x): z = q if q < z else z + (q - z) * a; y[i] = z
    return y
if SANS_VOIX: gd = np.ones(N)
else:
    NIV = 20 * np.log10(np.median(ev[MOT])); ef = maximum_filter1d(env(fx), 41)        # NIV : niveau median de la voix pendant les mots
    brut = np.where(MOT, np.clip(np.maximum(ev, 10 ** ((NIV - 21) / 20)) * 10 ** (-ECART / 20) / np.maximum(ef, 1e-9), 10 ** (-40 / 20), 1), 1.)
    gdb = uniform_filter1d(minimum_filter1d(20 * np.log10(brut), 61, mode='nearest'), 31, mode='nearest'); gd = haut(10 ** (relache(gdb, 180.) / 20))
fxd = fx * gd[:, None]

# ---------- niveau, limiteur a anticipation (crete vraie estimee x4), mesures ----------
def lufs(x):                          # sonie integree BS.1770 (ponderation K, portes absolue -70 et relative -10)
    y = lfilter([1, -2, 1], [1, -1.99004745483398, .99007225036621], lfilter([1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, .73248077421585], x, axis=0), axis=0)
    cs = np.concatenate([[0], np.cumsum((y ** 2).sum(1))]); i = np.arange(0, len(y) - 19200, 4800); z = (cs[i + 19200] - cs[i]) / 19200; l = -.691 + 10 * np.log10(np.maximum(z, 1e-12))
    z1 = z[l > -70]
    if not len(z1): return -99.
    return float(-.691 + 10 * np.log10(z[(l > -70) & (l > -.691 + 10 * np.log10(z1.mean()) - 10)].mean()))
def crete4(x): return np.abs(resample_poly(x.astype(np.float32), 4, 1, axis=0)).max(1)       # crete entre echantillons
def limite(x):
    pk = crete4(x); pk = np.pad(pk, (0, NC * HOP * 4 - len(pk))).reshape(-1, HOP * 4).max(1); besoin = np.minimum(1, 10 ** (PLAFOND / 20) / np.maximum(pk, 1e-9))
    g = haut(relache(uniform_filter1d(minimum_filter1d(besoin, 17, mode='nearest'), 11, mode='nearest'), 150.)); return g
mix0 = fxd + v[:, None]; k = 1. if SANS_VOIX else 10 ** ((CIBLE - lufs(mix0)) / 20); gl = limite(mix0 * k)
if not SANS_VOIX:
    for _ in range(2): k *= 10 ** ((CIBLE - lufs(mix0 * (k * gl)[:, None])) / 20); gl = limite(mix0 * k)
gt = k * gl; gt[-1440:] *= np.linspace(1, 0, 1440); mix = mix0 * gt[:, None]; pv = (v * gt)[:, None] * np.ones(2); pf = fxd * gt[:, None]
sf.write(MIX, mix, SR, subtype='PCM_24')
if PISTES: sf.write(MIX[:-4] + '.voix.wav', pv, SR, subtype='PCM_24'); sf.write(MIX[:-4] + '.effets.wav', pf, SR, subtype='PCM_24')
db = lambda x: 20 * np.log10(max(float(x), 1e-12))
print(f'gain commun {db(k):+.1f} dB ; sonie integree {lufs(mix):.1f} LUFS ; crete vraie (x4) {db(crete4(mix).max()):.2f} dBTP ; crete echantillon {db(np.abs(mix).max()):.2f} dBFS ; limiteur : reduction max {-db(gl.min()):.1f} dB, actif {100 * (gl < .999).mean():.1f} % du temps')
if not SANS_VOIX:
    W = 2400; nb = N // W; rv = np.sqrt((v[:nb * W] ** 2).reshape(nb, W).mean(1)); rf = np.sqrt((fxd[:nb * W] ** 2).mean(1).reshape(nb, W).mean(1)); m = rv > 10 ** ((NIV - 20) / 20)
    e = 20 * np.log10(rv[m] / np.maximum(rf[m], 1e-9))      # le gain commun (niveau, limiteur) ne change pas ce rapport
    print(f'voix / effets pendant les mots (fenetres de 50 ms ou la voix est a moins de 20 dB de son niveau median, {m.sum()} fenetres) : minimum {e.min():.1f} dB, 5e centile {np.percentile(e, 5):.1f} dB, mediane {np.median(e):.1f} dB ; fenetres sous 9 dB : {(e < 9).sum()}')
    print(f'ecrasement lateral : reduction max {-db(gd.min()):.1f} dB ; effets seuls hors des mots : crete {db(np.abs(pf).max()):.1f} dBFS')
q = np.abs(mix).max(1) < 10 ** (-38 / 20); dq = np.diff(np.concatenate([[0], q.astype(np.int8), [0]])); S = [(a / SR, b / SR) for a, b in zip(np.flatnonzero(dq == 1), np.flatnonzero(dq == -1)) if b - a >= .8 * SR and b / SR > 40]
voulu = lambda a, b: any(a < y and b > x for x, y in SILS)
print(f'silences complets (< -38 dBFS) de plus de 0,8 s apres 40 s : {len(S)}' + ''.join(f' ; {a:.2f}-{b:.2f} s ({"silence voulu" if voulu(a, b) else "NON VOULU"})' for a, b in S))
print('silences voulus (tout coupe sauf la voix) : ' + (', '.join(f'{a:.2f}-{b:.2f} s' for a, b in SILS) or 'aucun'))
print(MIX, round(N / SR, 3), 's')
