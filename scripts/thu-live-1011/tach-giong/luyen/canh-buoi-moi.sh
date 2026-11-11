#!/bin/bash
# Mỗi 45 phút: tải buổi «Xem lại Live» mới ('xong'), giải mã, trích thêm giọng thầy / giọng khác (them-buoi.py). Bộ luyện tự quét lại thư mục dữ liệu.
S=${TG_TAM:?đặt TG_TAM = thư mục tạm chứa live/ du-lieu/ lv-tg/ do-a/ ma/}
cd "$S"
while true; do
  echo "== $(date -u +%H:%M) =="
  RA=$S/live node ma/tai-live.mjs 2>&1 | tail -20
  bash ma/giai-ma.sh "$S/live"
  python3 -I ma/them-buoi.py "$S/live" lv-tg/wespeaker_en_voxceleb_CAM++.onnx do-a du-lieu/live 2>&1 | tail -20
  sleep 2700
done
