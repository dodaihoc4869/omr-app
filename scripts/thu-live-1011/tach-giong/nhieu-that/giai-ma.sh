#!/bin/bash
# Giải mã mọi tieng.mp3 thành f32le mono 24 kHz + 16 kHz.
for d in "$1"/*/; do
  ffmpeg -v error -y -i "$d/tieng.mp3" -ac 1 -ar 24000 -f f32le "$d/t24.f32"
  ffmpeg -v error -y -i "$d/tieng.mp3" -ac 1 -ar 16000 -f f32le "$d/t16.f32"
done
echo xong
