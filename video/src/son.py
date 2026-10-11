#!/usr/bin/env python3
# son.py : son d'impact synthetise (aucun fichier tiers, pas de musique) a partir des reperes de la page (essai/cues.json),
# mixe sous la voix -> essai/mix.wav (48 kHz stereo). Registre bande-annonce, sec et court : coups graves, montees, sub sous la menace,
# silence net avant le verdict. NB : ce son n'a ete ecoute par personne ; il est seulement mesure.
import json, os, numpy as np, soundfile as sf
from scipy.signal import lfilter, butter
H = os.path.dirname(os.path.abspath(__file__)); E = os.path.join(H, '..', 'essai'); SR = 48000
C = json.load(open(os.path.join(E, 'cues.json'), encoding='utf-8')); N = int(SR * C['dur'])
rng = np.random.default_rng(7); L = np.zeros(N + 3 * SR); R = np.zeros(N + 3 * SR)
def put(x, t, g=1.0, pan=0.0):
    i = int(t * SR); n = min(len(x), len(L) - i)
    if i < 0 or n <= 0: return
    L[i:i + n] += x[:n] * g * (1 - max(0, pan) * .6); R[i:i + n] += x[:n] * g * (1 + min(0, pan) * .6)
def tt(d): return np.arange(int(SR * d)) / SR
def lp(x, fc): b, a = butter(2, fc / (SR / 2)); return lfilter(b, a, x)
def bp(x, f1, f2): b, a = butter(2, [f1 / (SR / 2), f2 / (SR / 2)], btype='band'); return lfilter(b, a, x)
def boum(f0=44, d=2.2):                         # coup grave : sinus qui descend, claque breve, queue de sub
    t = tt(d); f = f0 * (1 + 2.2 * np.exp(-t * 26)); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.tanh(1.6 * np.sin(ph) * np.exp(-t * 2.6)) + lp(rng.standard_normal(len(t)), 900) * np.exp(-t * 26) * 1.2 + bp(rng.standard_normal(len(t)), 60, 160) * np.exp(-t * 5) * .5
def riser(d):                                   # montee : souffle filtre qui s'ouvre + sinus qui grimpe, coupe net
    t = tt(d); k = t / d; n = bp(rng.standard_normal(len(t)), 300, 5000) * k ** 2.5
    f = 70 * 2 ** (k * 2.2); return (n * .9 + np.sin(2 * np.pi * np.cumsum(f) / SR) * k ** 2 * .5) * (1 - np.clip((k - .985) / .015, 0, 1))
def tic(f=2100, d=.07): t = tt(d); return np.sin(2 * np.pi * f * t) * np.exp(-t * 85) * .5 + lp(rng.standard_normal(len(t)), 6000) * np.exp(-t * 120) * .5
def toc(f=150, d=.25): t = tt(d); return np.sin(2 * np.pi * f * t * (1 + .5 * np.exp(-t * 40))) * np.exp(-t * 20)
def souffle(d, up=True): t = tt(d); e = (t / d) ** 2 if up else (1 - t / d) ** 2; return bp(rng.standard_normal(len(t)), 200, 3000) * e
BOUM = boum(); duck = np.ones(N + 3 * SR)
for c in C['cues']:
    k, t, g = c['k'], c['t'], c.get('g', 1)
    if k in ('coup', 'boum'): put(BOUM, t, .95 * g)
    elif k == 'riser': put(riser(c['d']), t, .5)
    elif k == 'rideau': [put(tic(900 - i * 60, .05), t + i * .016, .25) for i in range(6)]
    elif k in ('arrive', 'etire'): put(souffle(c.get('d', .6), True), t, .4)
    elif k == 'souffle': put(souffle(c['d'], True), t, .45); put(souffle(.25, False), t + c['d'], .45)
    elif k == 'prise': put(tic(1700 + 900 * rng.random()), t, .2 * g, c.get('pan', 0)); put(toc(120 + 60 * rng.random(), .12), t, .12 * g, c.get('pan', 0))
    elif k == 'poignee': put(tic(1500 + 250 * c.get('n', 0), .09), t, .45); put(toc(110, .2), t, .4)
    elif k == 'bute': put(toc(170, .3), t, .8 * g); put(boum(70, .5), t, .3 * g)
    elif k == 'toc': put(toc(140, .22), t, .5 * g)
    elif k == 'tic': put(tic(1900 + 500 * rng.random()), t, .35 * g)
    elif k == 'touche': put(tic(2600 + 900 * rng.random(), .03), t, .16 * g)
    elif k == 'defile': put(bp(rng.standard_normal(int(SR * c['d'])), 1500, 7000) * np.abs(np.sin(tt(c['d']) * 60)) ** 6 * .35, t)
    elif k in ('retire', 'renonce'): put(souffle(.4, False), t, .5)
    elif k == 'guette': put(boum(58 - 3 * c['n'], 1.0), t, .45, (-1, 1, -1, 1)[c['n']] * .5)
    elif k == 'plonge': put(riser(c['d']), t, .45); put(BOUM, t + c['d'], .9)
    elif k == 'tap': put(tic(1300, .05), t, .3)
    elif k == 'tension': put(souffle(c['d'], True), t, .15)
    elif k == 'silence': i = int(t * SR); n = int(c['d'] * SR); duck[max(0, i - 2400):i] *= np.linspace(1, 0, min(2400, i)); duck[i:i + n] = 0
# sub sous la menace seulement (pas une musique : une tenue grave, sans rythme ni melodie)
t = np.arange(N + 3 * SR) / SR; sub = (np.sin(2 * np.pi * 41 * t) + .4 * np.sin(2 * np.pi * 61.7 * t + .3)) * (.8 + .2 * np.sin(2 * np.pi * .11 * t))
env = np.zeros_like(t)
for a, b in C.get('menace', [[0, C['dur']]]): env += np.clip((t - a) / 1.5, 0, 1) * np.clip((b - t) / 1.0, 0, 1) * (t >= a) * (t <= b)
L += sub * env * .1; R += sub * env * .1
fx = np.stack([L[:N] * duck[:N], R[:N] * duck[:N]], 1) * .5
v, sr = sf.read(os.path.join(E, 'voix', 'voix.wav')); assert sr == SR
v = np.pad(v, (0, max(0, N - len(v))))[:N]
mix = fx + (v * 1.0)[:, None]; mix /= max(1.0, np.abs(mix).max() / .89)
sf.write(os.path.join(E, 'mix.wav'), mix, SR, subtype='PCM_24'); print('mix.wav', round(N / SR, 3), 's')
