#!/bin/bash
# assemble.sh : image.mp4 + mix.wav -> $OUT (H.264 High, 1920x1080, 60 i/s, AAC 48 kHz, faststart), puis mesures.
set -e; cd "$(dirname "$0")/../essai"; OUT=${1:-essai_ouverture.mp4}   # un nom nouveau par rendu montrable
ffmpeg -y -loglevel error -i image.mp4 -i mix.wav -map 0:v -map 1:a -af "loudnorm=I=-15:TP=-1.5:LRA=11" -c:v libx264 -crf ${CRF:-21} -preset slow -pix_fmt yuv420p -r ${FPS:-60} -profile:v high -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart $OUT
ffprobe -v error -show_entries format=duration,size -of default=nw=1 $OUT | tee mesures.txt
ffmpeg -hide_banner -nostats -i $OUT -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+I:|Peak:|LRA:" | tee -a mesures.txt
ffmpeg -hide_banner -nostats -i $OUT -vf "freezedetect=n=-50dB:d=2" -an -f null - 2>&1 | grep -i "freeze_" | tee -a mesures.txt || true
ffmpeg -y -loglevel error -i $OUT -vf "fps=1,scale=480:-1,tile=6x5" -frames:v 1 -q:v 3 planche_1s.jpg
