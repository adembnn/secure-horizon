#!/bin/bash
# assemble.sh [sortie.mp4] [image.mp4] [mix.wav] : image + son -> ../out/<sortie> (H.264 High, 1920x1080, 60 i/s, AAC 48 kHz, faststart), puis mesures.
#   bash assemble.sh film_v5_a.mp4                    lit ../out/image.mp4 et ../out/mix.wav
# Un nom nouveau par rendu montrable. Ecrit aussi <sortie>.mesures.txt (duree, taille, niveau sonore, images figees) et <sortie>.planche_1s.jpg.
set -e; cd "$(dirname "$0")/../out"; OUT=${1:-film_v5.mp4}; IMG=${2:-image.mp4}; MIX=${3:-mix.wav}; B="${OUT%.mp4}"
ffmpeg -y -loglevel error -i "$IMG" -i "$MIX" -map 0:v -map 1:a -af "loudnorm=I=-15:TP=-1.5:LRA=11" -c:v libx264 -crf ${CRF:-21} -preset slow -pix_fmt yuv420p -r ${FPS:-60} -profile:v high -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$OUT"
ffprobe -v error -show_entries format=duration,size -of default=nw=1 "$OUT" | tee "$B.mesures.txt"
ffmpeg -hide_banner -nostats -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|LRA|Peak):" | tee -a "$B.mesures.txt"
ffmpeg -hide_banner -nostats -i "$OUT" -vf "freezedetect=n=-50dB:d=2" -an -f null - 2>&1 | grep -i "freeze_" | tee -a "$B.mesures.txt" || true
ffmpeg -y -loglevel error -i "$OUT" -vf "fps=1,scale=480:-1,tile=6x23" -frames:v 1 -q:v 3 "$B.planche_1s.jpg"
