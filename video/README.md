# Vidéo de démonstration Hold up : fabrication

Tout se rend sur cette machine, sans rien installer : le rendu se sert, en lecture seule, de la chaîne du fondateur (`C:\Users\Adem\Video AI\atelier` : puppeteer-core, Chromium, Python avec numpy et soundfile). La variable `ATELIER` change ce chemin.

## Commande unique (Git Bash, depuis `video/src`)

```bash
PY="C:/Users/Adem/Video AI/atelier/.venv/Scripts/python.exe -X utf8 -I"
$PY voix.py gradium_damien_lent1 \
 && node render.mjs --cues --out=../essai/cues.json \
 && $PY son.py \
 && node render.mjs --clip --out=../essai/image.mp4 \
 && bash assemble.sh essai_vN.mp4
```

Chaque rendu montrable porte un nom nouveau (`essai_vN.mp4`). `assemble.sh` écrit aussi `mesures.txt` (durée, taille, niveau sonore, images figées) et `planche_1s.jpg`.

## Les fichiers

| Fichier | Rôle |
|---|---|
| `src/index.html`, `src/film.js` | Le film : une page dont l'image est une fonction du temps (`window.renderAt(t)`), sans hasard libre. 60 images par seconde, flou de mouvement par sous-images moyennées quand la caméra bouge. |
| `src/voix_ouverture.json` | Le texte découpé par phrase, avec la pause après chacune. |
| `src/voix_gradium.mjs` | Voix définitive (Gradium). `node --env-file=.env video/src/voix_gradium.mjs --voix=damien --lent=1 --envoyer`, depuis la racine du dépôt. La clé est lue dans l'environnement, jamais affichée ni écrite. Les fichiers déjà faits ne sont pas redemandés. |
| `src/tts.mjs` | Voix de travail locale (Kokoro). Ne sert plus dans un essai montré. |
| `src/voix.py` | Pose les phrases, écrit `essai/voix/voix.wav` et `src/timeline.js`. Les débuts de mots sont estimés (silences, puis poids en syllabes), pas transcrits : faster-whisper n'est pas installé. |
| `src/son.py` | Fond sonore synthétisé à partir des repères de la page, mixé sous la voix. |
| `src/render.mjs` | Rendu : `--stills`, `--strip`, `--clip`, `--cues`. |
| `src/assemble.sh` | Image, son, niveau à −15 LUFS, mesures, planche. |
| `src/mesure_voix.py` | Durée et hauteur d'une voix, pour comparer sans écouter. |
| `src/fonts/` | Montserrat Bold (licence OFL jointe), copiée depuis l'atelier du fondateur. |
| `cles/` | Images clés en PNG 1920 × 1080. |
| `essai/` | Les rendus, la planche, les mesures, les voix en cache. |

## Ce qui n'a pas marché, et ce qui a été fait à la place

- faster-whisper absent : les sous-titres et les gestes sont calés sur des débuts de mots estimés, à ±0,15 s près.
- Personne n'a écouté le son : il est mesuré seulement. La voix Gradium a été choisie sur sa description officielle et sur sa hauteur mesurée.
