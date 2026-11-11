#!/bin/bash
# Mỗi checkpoint mới của các lượt luyện ⇒ xuất .tgt + đo nhanh (do-nhanh.mjs) ⇒ do-nhanh.log
S=${TG_TAM:?đặt TG_TAM}
WT=$(cd "$(dirname "$0")/../../../.." && pwd)
cd "$S"
while true; do
  for d in ck-c ck-d ck-e ck-f; do
    [ -d "$d" ] || continue
    for ck in "$d"/ck-*.pkl; do
      [ -f "$ck" ] || continue
      ten="$d-$(basename "$ck" .pkl | sed 's/ck-0*//')"
      [ -f "mh/$ten.tgt" ] && continue
      venv/bin/python -I ma/xuat.py "$ck" "mh/$ten.tgt" "$ten" > /dev/null 2>&1 || continue
      node "$WT/scripts/thu-live-1011/tach-giong/luyen/do-nhanh.mjs" "$WT/src/lib/live/tach-giong-thay.ts" "mh/$ten.tgt" \
        thay=cham/thay-that.wav khac-that=cham/khac-that.wav lj-nu=mau/giong-nu.wav vctk-nam=mau/xon-xao-2.wav libri=mau/xon-xao-3.wav viet-tts=mau/giong-viet.wav >> do-nhanh.log 2>&1
    done
  done
  sleep 60
done
