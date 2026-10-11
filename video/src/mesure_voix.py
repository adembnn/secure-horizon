#!/usr/bin/env python3
# mesure_voix.py <fichiers wav> : duree de parole et hauteur mediane (autocorrelation). Sert a choisir une voix grave et posee
# quand personne ne peut l'ecouter : c'est une mesure, pas un jugement d'oreille.
import sys, numpy as np, soundfile as sf
for f in sys.argv[1:]:
    x, sr = sf.read(f); x = x if x.ndim == 1 else x.mean(1); w = int(sr * .04); f0 = []; act = 0
    for i in range(0, len(x) - w, w // 2):
        s = x[i:i + w] - x[i:i + w].mean()
        if np.sqrt((s ** 2).mean()) < .02: continue
        act += 1; a = np.correlate(s, s, 'full')[w - 1:]; lo, hi = int(sr / 320), int(sr / 60); k = lo + int(np.argmax(a[lo:hi]))
        if a[k] > .45 * a[0]: f0.append(sr / k)
    print(f"{f}  duree {len(x)/sr:.2f} s  parole {act*.02:.2f} s  hauteur mediane {np.median(f0):.0f} Hz (10e-90e centile {np.percentile(f0,10):.0f}-{np.percentile(f0,90):.0f})")
