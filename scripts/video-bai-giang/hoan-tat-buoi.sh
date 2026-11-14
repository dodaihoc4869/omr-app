#!/usr/bin/env bash
# VIDEO TÓM TẮT — BƯỚC 2/2: HOÀN TẤT + ĐẨY LÊN APP HỌC SINH (thầy 14/11). Sau khi đã soạn lời (spec) + cấu hình cảnh:
#   1) sinh lời riêng từng cảnh (loi-sach-cN.json) từ spec (giờ chữ của PhoWhisper, cắt cứng t / d / c)
#   2) dựng kịch bản + nét (dung-kich-ban.mjs) · soát phụ đề ngắt sai · liệt kê chữ nghi là tên trong đoạn giọng (chỉ in ra máy, không gửi đi)
#   3) trộn tiếng (am-thanh.py — giọng chuẩn theo mẫu K12, nhạc + tiếng động mức K12)
#   4) tải 3 tệp lên (dang-len.sh) ⇒ HEAD kịch bản 200 + Range tiếng 206 ⇒ thẻ «Video tóm tắt» hiện trong Xem lại Live của buổi
# KHÔNG đẩy main, KHÔNG phát hành app: chỉ ghi dữ liệu của buổi (R2), máy em không phải tải lại app.
# Dùng: bash hoan-tat-buoi.sh <mã buổi> <thư mục tư liệu> <cau-hinh.json> <spec.json> [--khong-tai]
set -euo pipefail
B="$1"; D="$2"; CH="$3"; SPEC="$4"; KHONG_TAI="${5:-}"
HERE="$(cd "$(dirname "$0")" && pwd)"
W="${MAY_CHU:-https://omr.ttadodaihoc.workers.dev}"
RA="$D/ra"; AM="$D/am"; mkdir -p "$RA" "$AM"
python3 "$HERE/sinh-loi.py" "$D" "$SPEC"
node "$HERE/dung-kich-ban.mjs" "$D" "$CH" "$RA" > "$D/dung.log"
grep "^tổng" "$D/dung.log"
python3 - "$RA/kich-ban.json" <<'EOF'
import json, re, sys
kb = json.load(open(sys.argv[1])); bad = []
for d in kb['doan']:
    for c in d.get('phuDe') or []:
        s = c['chu']
        if re.match(r'^[-−+=⇒→)\],.:;×]', s) or re.search(r'[-−+=⇒→(×]$', s) or s.count('(') != s.count(')'): bad.append((d.get('id'), s))
print('phụ đề ngắt sai:', bad if bad else 'không có')
if bad: sys.exit(1)
EOF
python3 "$HERE/kiem-ten.py" "$RA/kich-ban.json" "$D/loi-asr-all.json" "$D/ten-buoi.txt" > "$D/ten-trong-giong.txt" || true
echo "chữ nghi là tên trong đoạn giọng: $(tail -1 "$D/ten-trong-giong.txt") (xem $D/ten-trong-giong.txt — đùa có tên thì giữ, gọi tên nhắc nhở thì phải cắt)"
python3 "$HERE/am-thanh.py" "$RA/kich-ban.json" "$D/tieng.mp3" "$AM" | grep "giọng ghép\|^xong"
find "$AM" -name '*.wav' -delete
[ "$KHONG_TAI" = "--khong-tai" ] && { echo "chưa tải (--khong-tai)"; exit 0; }
bash "$HERE/dang-len.sh" "$B" "$RA/kich-ban.json" "$RA/net.json" "$AM/am-thanh.m4a" | grep -o "← [a-z]* HTTP [0-9]*"
VE=$(node -e 'console.log(encodeURIComponent(require("fs").readFileSync(process.argv[1], "utf8")))' "$D/ve.txt")
curl -sS -I "$W/live-tep/$B/video-kb.json?ve=$VE" -o /dev/null -w "HEAD video-kb %{http_code}\n"
curl -sS -r 0-1023 "$W/live-tep/$B/video-am.m4a?ve=$VE" -o /dev/null -w "Range video-am %{http_code}\n"
