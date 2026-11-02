#!/usr/bin/env bash
# TẠO PHÔNG TẬP CON cho bản vẽ giao diện v2 (02/11). Tự chứa — KHÔNG CDN.
# Nguồn: @fontsource/nunito, @fontsource/baloo-2, @fontsource/be-vietnam-pro (SIL OFL 1.1) cài TẠM ngoài repo:
#   mkdir -p /tmp/pkg && cd /tmp/pkg && npm i @fontsource/nunito @fontsource/baloo-2 @fontsource/be-vietnam-pro
#   pip install fonttools brotli
#   bash docs/ban-ve-giao-dien-v2-0211/tao-phong.sh /tmp/pkg/node_modules
# Mỗi phông hai mảnh latin + vietnamese (unicode-range ⇒ trình duyệt chỉ tải mảnh cần), bỏ hinting, chỉ giữ tính năng chữ cần cho tiếng Việt + số.
set -euo pipefail
NM="${1:?đường dẫn node_modules có @fontsource}"
RA="$(cd "$(dirname "$0")" && pwd)/phong"
mkdir -p "$RA"
LATIN='U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2013-2014,U+2018-201A,U+201C-201E,U+2022,U+2026,U+2032-2033,U+2039-203A,U+20AC,U+2122,U+2190-2193,U+2212,U+2215'
VIET='U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB'
TINH='kern,liga,calt,ccmp,locl,mark,mkmk,tnum,lnum'
tap() { # $1 tệp nguồn · $2 tệp ra · $3 dải mã
  pyftsubset "$1" --unicodes="$3" --layout-features="$TINH" --no-hinting --desubroutinize --flavor=woff2 --output-file="$RA/$2"
}
tap "$NM/@fontsource/nunito/files/nunito-latin-800-normal.woff2" nunito-800-latin.woff2 "$LATIN"
tap "$NM/@fontsource/nunito/files/nunito-vietnamese-800-normal.woff2" nunito-800-viet.woff2 "$VIET"
tap "$NM/@fontsource/baloo-2/files/baloo-2-latin-800-normal.woff2" baloo2-800-latin.woff2 "$LATIN"
tap "$NM/@fontsource/baloo-2/files/baloo-2-vietnamese-800-normal.woff2" baloo2-800-viet.woff2 "$VIET"
for w in 400 600 700; do
  tap "$NM/@fontsource/be-vietnam-pro/files/be-vietnam-pro-latin-$w-normal.woff2" bvp-$w-latin.woff2 "$LATIN"
  tap "$NM/@fontsource/be-vietnam-pro/files/be-vietnam-pro-vietnamese-$w-normal.woff2" bvp-$w-viet.woff2 "$VIET"
done
cp "$NM/@fontsource/nunito/LICENSE" "$RA/OFL-nunito.txt"
cp "$NM/@fontsource/baloo-2/LICENSE" "$RA/OFL-baloo2.txt"
cp "$NM/@fontsource/be-vietnam-pro/LICENSE" "$RA/OFL-be-vietnam-pro.txt"
ls -l "$RA"/*.woff2 | awk '{ printf "%-26s %6.1f KB\n", $9, $5/1024 }' | sed "s#$RA/##"
