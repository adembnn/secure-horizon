#!/bin/bash
# voix.sh <voix> [lent] [temp] : UNE commande pour (re)faire toute la voix du film avec une voix Gradium donnee.
#   bash video/src/voix.sh mordraigne        (depuis la racine du depot ; la cle est lue par node --env-file=.env, jamais affichee)
# 1. demande a Gradium les lignes qui ne sont pas deja en cache (essai/voix/gradium_<voix>_.../), 2. pose les lignes et mesure (voix.py),
# 3. traitement bande-annonce par ffmpeg (grave -1,5 demi-ton, graves, compression, salle courte, limiteur) -> essai/voix/voix.wav
set -e
V=${1:-mordraigne}; LENT=${2:-1}; TEMP=${3:-1}
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$ROOT"
PY="C:/Users/Adem/Video AI/atelier/.venv/Scripts/python.exe"
node --env-file=.env video/src/voix_gradium.mjs --texte=voix_film.json --voix=$V --lent=$LENT --temp=$TEMP --envoyer
"$PY" -X utf8 -I video/src/voix.py gradium_${V}_lent${LENT}_temp${TEMP} voix_film.json
cd video/essai/voix
ffmpeg -y -loglevel error -i voix_brut.wav -af "asetrate=48000*0.9170,aresample=48000,atempo=1.0905,highpass=f=55,bass=g=5:f=110:w=0.7,equalizer=f=3200:t=q:w=1.2:g=2.5,acompressor=threshold=-22dB:ratio=5:attack=6:release=160:makeup=6,aecho=0.85:0.35:55|110:0.16|0.09,alimiter=limit=0.84" -ar 48000 -ac 1 -c:a pcm_s24le voix.wav
ffprobe -v error -show_entries format=duration -of csv=p=0 voix.wav
