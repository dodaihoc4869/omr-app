#!/usr/bin/env bash
# VIDEO TÓM TẮT — BƯỚC 1/2: CHUẨN BỊ TƯ LIỆU MỘT BUỔI LIVE (thầy 14/11 «đóng gói các kĩ thuật … live kết thúc văn phòng soạn luôn video tóm tắt đẩy lên app»).
# Làm mọi việc MÁY làm được trước khi người / tác tử soạn lời:
#   1) cài công cụ nếu thiếu (venv faster-whisper + mô hình PhoWhisper ~1,5 GB, fluidsynth + soundfont, node_modules)
#   2) lấy vé của buổi (POST /gv/live-ds, mã GV do proxy gắn) ⇒ tải buoi.json, trang.json, tieng.mp3, net.bin
#   3) khoảng lặng (lang-35.txt) · nét có giờ thật từng điểm (net-gio.json) · ảnh bảng (bang-*.jpg) · danh sách tên của buổi (ten-buoi.txt)
#   4) nghe lời Thầy bằng PhoWhisper theo khúc ~3 phút cắt ở khoảng lặng ⇒ loi-asr-k*.json ⇒ gộp loi-asr-all.json ⇒ nghe.txt (đọc để soạn)
# Chữ máy nghe có tên học sinh ⇒ CHỈ nằm trong thư mục tư liệu (ngoài kho mã), không in ra kênh công khai.
# Dùng: bash chuan-bi-buoi.sh <mã buổi> <thư mục tư liệu> [giây đầu] [giây cuối]
set -euo pipefail
B="$1"; D="$2"; DAU="${3:-0}"; CUOI="${4:-}"
HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$HERE/../.." && pwd)"
W="${MAY_CHU:-https://omr.ttadodaihoc.workers.dev}"
CC="${CONG_CU:-$HOME/.video-tom-tat}"      # venv + mô hình dùng chung giữa các buổi
mkdir -p "$D" "$CC"

# ── 1) công cụ ──
if [ ! -x "$CC/wv/bin/python" ]; then python3 -m venv "$CC/wv" && "$CC/wv/bin/pip" install -q faster-whisper; fi
if [ ! -f "$CC/pho-medium/model.bin" ]; then
  HF_HUB_DISABLE_TELEMETRY=1 "$CC/wv/bin/python" -c "from huggingface_hub import snapshot_download; snapshot_download('mad1999/pho-whisper-medium-ct2', local_dir='$CC/pho-medium')"
fi
command -v fluidsynth >/dev/null && [ -f /usr/share/sounds/sf2/FluidR3_GM.sf2 ] || { ( (apt-get update -q && apt-get install -y -q fluidsynth fluid-soundfont-gm) >/dev/null 2>&1 || (sudo apt-get update -q && sudo apt-get install -y -q fluidsynth fluid-soundfont-gm) >/dev/null 2>&1) || echo "CẢNH BÁO: chưa cài được fluidsynth (nhạc nền)"; }
[ -d "$REPO/node_modules" ] || (cd "$REPO" && npm ci --silent)
"$CC/wv/bin/python" -c "import numpy" 2>/dev/null || "$CC/wv/bin/pip" install -q numpy

# ── 2) tư liệu ──
curl -sS -X POST -H 'content-type: application/json' -d '{}' "$W/gv/live-ds" -o "$D/ds.json"
node -e '
const j = require(process.argv[1]), b = (j.buoi || []).find((x) => x.id === process.argv[2])
if (!b) { console.error("không thấy buổi " + process.argv[2] + " trong /gv/live-ds"); process.exit(1) }
require("fs").writeFileSync(process.argv[3], b.ve); const c = { ...b }; delete c.ve; require("fs").writeFileSync(process.argv[4], JSON.stringify(c))' "$D/ds.json" "$B" "$D/ve.txt" "$D/thong-tin.json"
VE=$(node -e 'console.log(encodeURIComponent(require("fs").readFileSync(process.argv[1], "utf8")))' "$D/ve.txt")
for t in buoi.json trang.json tieng.mp3 net.bin; do
  [ -s "$D/$t" ] || curl -sS -f "$W/live-tep/$B/$t?ve=$VE" -o "$D/$t" || { echo "LỖI tải $t"; exit 1; }
done
jq -r '[.. | objects | (.ten? // empty), (.hoTen? // empty)] | map(select(type == "string")) | unique | .[]' "$D/buoi.json" > "$D/ten-buoi.txt" || true

# ── 3) khoảng lặng · nét có giờ · ảnh bảng ──
ffmpeg -nostdin -i "$D/tieng.mp3" -af silencedetect=noise=-35dB:d=0.25 -f null - 2>&1 | python3 -c "
import sys, re
s = None; o = []
for l in sys.stdin:
  m = re.search(r'silence_start: ([\d.]+)', l)
  if m: s = float(m[1])
  m = re.search(r'silence_end: ([\d.]+)', l)
  if m and s is not None: o.append(f'{s} {float(m[1])}'); s = None
open('$D/lang-35.txt', 'w').write('\n'.join(o) + '\n')"
(cd "$REPO" && npx jiti scripts/video-bai-giang/net-co-gio.ts "$D")
python3 "$HERE/ve-bang.py" "$D"

# ── 4) nghe lời Thầy (khúc ~180 s, ranh giới đặt vào khoảng lặng dài nhất gần mốc) ──
TONG=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$D/tieng.mp3"); CUOI="${CUOI:-$TONG}"
python3 - "$D/lang-35.txt" "$DAU" "$CUOI" > "$D/khuc.txt" <<'EOF'
import sys
lang = [tuple(map(float, l.split())) for l in open(sys.argv[1]) if l.strip()]
a, b = float(sys.argv[2]), float(sys.argv[3]); m = [a]
while m[-1] + 200 < b:
    goi = [x for x in lang if m[-1] + 150 <= (x[0] + x[1]) / 2 <= m[-1] + 230]
    m.append(round((max(goi, key=lambda x: x[1] - x[0])[0] + max(goi, key=lambda x: x[1] - x[0])[1]) / 2, 2) if goi else m[-1] + 180)
m.append(b); print(' '.join(str(x) for x in m))
EOF
read -r -a M < "$D/khuc.txt"
for i in $(seq 0 $((${#M[@]} - 2))); do
  [ -s "$D/loi-asr-k$i.json" ] && continue
  ffmpeg -nostdin -loglevel error -y -ss "${M[$i]}" -to "${M[$((i + 1))]}" -i "$D/tieng.mp3" -ac 1 -ar 16000 "$D/khuc.wav"
  "$CC/wv/bin/python" "$HERE/nghe-loi.py" "$CC/pho-medium" "$D/khuc.wav" "${M[$i]}" "$D/loi-asr-k$i.json"
done
rm -f "$D/khuc.wav"
python3 "$HERE/gop-asr.py" "$D"
python3 - "$D" <<'EOF'
import json, sys
d = sys.argv[1]
with open(d + '/nghe.txt', 'w') as f:
    for s in json.load(open(d + '/loi-asr-all.json')):
        f.write(f"{s['a']:.1f}-{s['b']:.1f} {s['chu']}\n")
print('xong: nghe.txt + loi-asr-all.json + bang-*.jpg trong', d)
EOF
