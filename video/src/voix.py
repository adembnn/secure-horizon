#!/usr/bin/env python3
# voix.py <sous-dossier de voix> [fichier de lignes] : pose les lignes de voix avec leurs pauses.
# Mesure chaque fichier (parole a -40 dBFS), rogne, estime le debut de chaque mot (silences internes, puis poids en syllabes),
# ecrit essai/voix/voix_brut.wav (48 kHz mono) et src/timeline.js (window.TL, lu par la page).
# NB : faster-whisper n'est pas installe sur cette machine ; les temps de mots sont ESTIMES (+/- 0,15 s), pas transcrits.
# Les debuts et fins de LIGNES, eux, sont mesures : le montage s'appuie d'abord sur eux.
import json, subprocess, os, re, sys, numpy as np, soundfile as sf
H = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(H, '..', 'essai', 'voix'); SR = 48000
SRC = os.path.join(D, sys.argv[1]) if len(sys.argv) > 1 else D
LINES = json.load(open(os.path.join(H, sys.argv[2] if len(sys.argv) > 2 else 'voix_ouverture.json'), encoding='utf-8'))['lignes']
def load(f):
    x = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(x, dtype=np.float32).copy()
def env(x, win):
    n = len(x) // win; return 20 * np.log10(np.sqrt(np.mean(x[:n * win].reshape(n, win) ** 2, axis=1) + 1e-12))
def span(x, thr=-40):
    win = int(SR * .01); idx = np.where(env(x, win) > thr)[0]
    return max(0, idx[0] * win - int(SR * .012)), min(len(x), (idx[-1] + 1) * win + int(SR * .03))
def gaps(y, thr=-36, mn=.16):
    win = int(SR * .01); q = env(y, win) < thr; out = []; i = 0
    while i < len(q):
        if q[i]:
            j = i
            while j < len(q) and q[j]: j += 1
            if (j - i) * .01 >= mn and i > 5 and j < len(q) - 5: out.append((i * .01, j * .01))
            i = j
        else: i += 1
    return out
def syl(w): return max(1, len(re.findall(r'[aeiouyéèêëàâîïôûù]+', w.lower()))) + .5
out, voix, t = [], [], 0.6           # un temps d'image avant le premier mot : montrer avant de dire
out.append(np.zeros(int(SR * t), np.float32))
for l in LINES:
    x = load(f"{SRC}/{l['id']}.wav"); a, b = span(x); y = x[a:b].copy()
    f = int(SR * .006); y[:f] *= np.linspace(0, 1, f); y[-f:] *= np.linspace(1, 0, f)
    dur = len(y) / SR
    toks = [w for w in l['st'].split() if re.search(r'\w', w)]
    chunks = [[]]
    for w in toks:
        chunks[-1].append(w)
        if re.search(r'[,:.?!]$', w): chunks.append([])
    chunks = [c for c in chunks if c]
    g = sorted(gaps(y), key=lambda p: p[0] - p[1])[:len(chunks) - 1]; g.sort()
    segs = []; s0 = 0.0
    if len(g) == len(chunks) - 1:
        for (ga, gb) in g: segs.append((s0, ga)); s0 = gb
        segs.append((s0, dur))
    else:
        chunks = [toks]; segs = [(0.0, dur)]
    mots = []
    for ws, (sa, sb) in zip(chunks, segs):
        wt = [syl(w) for w in ws]; tot = sum(wt); acc = 0
        for w, k in zip(ws, wt):
            mots.append({'m': w, 't': round(t + sa + (sb - sa) * acc / tot, 3)}); acc += k
    voix.append({'id': l['id'], 'plan': l.get('plan', 1), 'debut': round(t, 3), 'fin': round(t + dur, 3), 'st': l['st'], 'mots': mots})
    out.append(y); t += dur
    p = int(SR * l['pause']); out.append(np.zeros(p, np.float32)); t += p / SR
audio = np.concatenate(out); sf.write(f'{D}/voix_brut.wav', audio, SR, subtype='PCM_24')
tl = {'duree': round(len(audio) / SR, 3), 'fps': 60, 'source': sys.argv[1] if len(sys.argv) > 1 else 'kokoro', 'voix': voix}
open(os.path.join(H, 'timeline.js'), 'w', encoding='utf-8').write('// genere par voix.py, ne pas editer\nwindow.TL = ' + json.dumps(tl, ensure_ascii=False, indent=1) + ';\n')
print('duree', tl['duree'])
plan = None
for v in voix:
    if v['plan'] != plan: plan = v['plan']; print('--- plan', plan, 'debut', v['debut'])
    print(' ', v['id'], v['debut'], v['fin'], v['st'][:40])
