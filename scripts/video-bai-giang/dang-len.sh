#!/usr/bin/env bash
# ĐĂNG VIDEO TÓM TẮT LÊN APP (14/11): mã hoá tiếng 64 kbps (+faststart ⇒ phát ngay khi tải dần) rồi tải 3 tệp của buổi lên máy chủ.
# Mã GV do proxy của phiên Claude gắn vào lượt gọi (môi trường omr-app) — KHÔNG bao giờ ghi mã vào tệp / dòng lệnh.
# Dùng: bash dang-len.sh <mã buổi> <kich-ban.json> <net.json> <am-thanh.m4a đã trộn>
set -euo pipefail
B="$1"; KB="$2"; NET="$3"; AM="$4"
W="${MAY_CHU:-https://omr.ttadodaihoc.workers.dev}"
T="$(mktemp -d)"
ffmpeg -hide_banner -v error -y -i "$AM" -ac 2 -c:a aac -b:a 64k -movflags +faststart "$T/video-am.m4a"
for p in "kb:$KB" "net:$NET" "am:$T/video-am.m4a"; do
  k="${p%%:*}"; f="${p#*:}"
  curl -sS -X POST --data-binary @"$f" -H 'content-type: application/octet-stream' "$W/gv/live-video-ghi?id=$B&tep=$k" -w " ← $k HTTP %{http_code}\n"
done
rm -rf "$T"
