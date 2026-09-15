#!/bin/bash
# ĐẨY RIÊNG MÁY CHỦ (Worker) — KHÔNG đụng tới app trên Pages.
#
# Vì sao có tệp này bên cạnh DAY-TAT-CA.command: có lúc chỉ máy chủ sẵn sàng
# còn cây mã của app đang dở (phiên khác sửa chưa xong, phép kiểm còn đỏ). Đẩy
# gộp lúc ấy là cõng theo bản dở lên cho học sinh. Tệp này cắt đúng một nửa:
# chỉ `server/src/**` lên Cloudflare, app giữ nguyên bản đang chạy.
#
# CHỐT AN TOÀN: KHÔNG đẩy khi đang có ca thi mở. Học sinh đang làm bài mà đổi
# máy chủ là hỏng ca thật.
#
# Wrangler dùng phiên đăng nhập sẵn trên máy Thầy; tệp này KHÔNG chứa mã bí mật.
set -u
cd "$(dirname "$0")" || exit 1

LOG="_day-may-chu.log"
{
echo "===== $(date '+%F %T') ====="

echo "=== 1/3 · Kiểm ca thi đang mở ==="
MAT=""
for T in "../kho-de/cau-hinh-may-chu-moi.json" "../kho-de/cau-hinh.json"; do
  [ -f "$T" ] || continue
  # /usr/bin/python3 (Python của macOS) là bản DUY NHẤT có sẵn chứng chỉ gốc.
  # Gọi `python3` trơn là trúng bản Homebrew/pyenv, và lượt gọi HTTPS ra
  # "CERTIFICATE_VERIFY_FAILED" — đúng lỗi lượt chạy đầu 15/09 đã dính.
  # NAP-DE-LEN-MAY-CHU-MOI.command cũng ghi cứng đường này vì cùng lý do.
  MAT=$(/usr/bin/python3 -c "import json,sys;print((json.load(open(sys.argv[1],encoding='utf-8')).get('secret') or '').strip())" "$T" 2>/dev/null)
  [ -n "$MAT" ] && break
done
if [ -z "$MAT" ]; then
  echo ">>> KHÔNG ĐỌC ĐƯỢC MÃ BÍ MẬT trong kho-de/cau-hinh*.json — KHÔNG kiểm được ca mở."
  echo ">>> DỪNG. Không đẩy gì cả."
  exit 1
fi

KQ=$(MAT="$MAT" /usr/bin/python3 - <<'PY'
import json, os, urllib.request
try:
    d = json.dumps({'action': 'danhSachCa', 'secret': os.environ['MAT']}).encode()
    q = urllib.request.Request('https://omr.ttadodaihoc.workers.dev/goi', data=d,
                               headers={'Content-Type': 'application/json',
                                        'User-Agent': 'day-may-chu/1.0'})
    r = json.load(urllib.request.urlopen(q, timeout=60))
except Exception as e:
    print('LOI %s' % str(e)[:120]); raise SystemExit(0)
if not r.get('ok'):
    print('LOI %s' % str(r.get('error'))[:120]); raise SystemExit(0)
mo = [c for c in (r.get('items') or [])
      if c.get('trangThai') == 'mo' and int(c.get('daVao') or 0) > int(c.get('daNop') or 0)]
if mo:
    print('CA_MO %d' % len(mo))
    for c in mo[:10]:
        print('   %s %s — vào %s, nộp %s' % (c.get('maCa'), c.get('tenCa'), c.get('daVao'), c.get('daNop')))
else:
    print('SACH %d ca trong danh sách, không ca nào đang mở còn em chưa nộp'
          % len(r.get('items') or []))
PY
)
echo "$KQ"
case "$KQ" in
  CA_MO*) echo ">>> DỪNG: đang có ca thi mở. Đổi máy chủ lúc này là phá ca thật."; exit 1 ;;
  LOI*)   echo ">>> DỪNG: không hỏi được máy chủ nên KHÔNG biết có ca mở hay không. Không đẩy."; exit 1 ;;
esac

echo
echo "=== 2/3 · Kiểm kiểu TypeScript của máy chủ ==="
npx -y tsc --noEmit -p server/tsconfig.json || { echo ">>> MÃ MÁY CHỦ SAI KIỂU — KHÔNG ĐẨY."; exit 1; }

echo
echo "=== 3/3 · Đẩy Worker ==="
( cd server && npx -y wrangler@latest deploy )
MA=$?

echo
if [ $MA -eq 0 ]; then
  echo ">>> MÁY CHỦ ĐÃ LÊN. App trên Pages giữ nguyên bản cũ."
else
  echo ">>> MÁY CHỦ CHƯA LÊN (mã thoát $MA) — đọc lỗi ở trên."
fi
echo "===== xong $(date '+%F %T') ====="
} 2>&1 | tee -a "$LOG"

echo
read -r -p "Bấm Enter để đóng cửa sổ..." _
