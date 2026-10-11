#!/bin/bash
# apercu.sh <a> <b> <nom> : rend la plage [a, b] (secondes du film) a 30 i/s et ecrit ../out/scenes/<nom>.mp4, 1280x720, muet, sans grain.
#   bash apercu.sh 54.2 76.34 s3b_v1
# Chaque appel lance son propre navigateur et ecrit ce seul fichier : huit appels peuvent tourner ensemble, avec huit noms differents.
# Ensuite : node mouvement.mjs ../out/scenes/<nom>.mp4      (energie de mouvement, comparee a la reference de l'ouverture)
set -e
[ $# -ge 3 ] || { echo "usage : bash apercu.sh <a> <b> <nom>   (exemple : bash apercu.sh 54.2 76.34 s3b_v1)"; exit 1; }
cd "$(dirname "$0")"; mkdir -p ../out/scenes
node render.mjs --clip --range="$1:$2" --fps="${FPS:-30}" --w=1280 --grain=0 --crf=18 --preset=veryfast --out="../out/scenes/$3.mp4"
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,nb_frames:format=duration -of default=nw=1 "../out/scenes/$3.mp4" | tr '\n' ' '; echo
