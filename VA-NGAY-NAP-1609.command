#!/bin/bash
# VÁ NỐT 5 TỜ CÒN RỖNG ngay_nap rồi NGHIỆM THU LẠI CẢ 225 TỜ.
# Lượt trước đẩy ngay lúc Worker mới vừa lên nên vài lượt đầu còn trúng bản cũ.
set -u
cd "$(dirname "$0")" || exit 1
KHO="$(pwd)/../kho-de"
LOG="$(pwd)/_va-ngay-nap-1609.log"
{
echo "===== BẮT ĐẦU $(date '+%F %T') ====="
MAT=""
for T in "$KHO/cau-hinh-may-chu-moi.json" "$KHO/cau-hinh.json"; do
  [ -f "$T" ] || continue
  MAT=$(/usr/bin/python3 -c "import json,sys;print((json.load(open(sys.argv[1],encoding='utf-8')).get('secret') or '').strip())" "$T" 2>/dev/null)
  [ -n "$MAT" ] && break
done
[ -z "$MAT" ] && { echo ">>> KHÔNG ĐỌC ĐƯỢC MÃ BÍ MẬT. DỪNG."; exit 1; }

echo
echo "=== 1/2 · Đẩy lại các tờ máy chủ còn RỖNG ngay_nap ==="
CAN=$(MAT="$MAT" KHO="$KHO" /usr/bin/python3 - <<'PY'
import json, os, urllib.request
d = json.dumps({'action':'danhSachDe','secret':os.environ['MAT']}).encode()
q = urllib.request.Request('https://omr.ttadodaihoc.workers.dev/goi', data=d,
                           headers={'Content-Type':'application/json','User-Agent':'va-ngay-nap/1.0'})
r = json.load(urllib.request.urlopen(q, timeout=180))
print(' '.join(sorted(x['maDe'] for x in (r.get('items') or []) if not (x.get('ngayNap') or '').strip())))
PY
)
if [ -z "$CAN" ]; then
  echo "    Không tờ nào rỗng — khỏi đẩy."
else
  echo "    Cần đẩy lại: $CAN"
  ( cd "$KHO" && /usr/bin/python3 cong-cu/nap-de-may-chu-moi.py --day-het $CAN ) \
    || { echo ">>> ĐẨY LẠI HỎNG."; exit 1; }
fi

echo
echo "=== 2/2 · NGHIỆM THU: máy chủ trả ngayNap khớp từng gói (cả 225 tờ) ==="
MAT="$MAT" KHO="$KHO" /usr/bin/python3 - <<'PY'
import json, os, sys, urllib.request
sys.path.insert(0, os.path.join(os.environ['KHO'], 'cong-cu'))
os.chdir(os.environ['KHO'])
import may_chu_moi as M
d = json.dumps({'action':'danhSachDe','secret':os.environ['MAT']}).encode()
q = urllib.request.Request('https://omr.ttadodaihoc.workers.dev/goi', data=d,
                           headers={'Content-Type':'application/json','User-Agent':'va-ngay-nap/1.0'})
r = json.load(urllib.request.urlopen(q, timeout=180))
tren = {x['maDe']: x for x in (r.get('items') or [])}
duoi = {M.ma_cua(p): (json.load(open(p, encoding='utf-8')).get('ngay_nap') or '').strip()
        for p in M.cac_tep_de()}
rong = [m for m, x in tren.items() if not (x.get('ngayNap') or '').strip()]
lech = [(m, duoi[m], tren[m].get('ngayNap') or '') for m in duoi
        if m in tren and duoi[m] != (tren[m].get('ngayNap') or '')]
thieu = [m for m in duoi if m not in tren]
print('Tờ dưới máy thầy : %d' % len(duoi))
print('Tờ trên máy chủ  : %d' % len(tren))
print('ngayNap còn RỖNG : %d' % len(rong))
print('ngayNap LỆCH gói : %d' % len(lech))
print('máy chủ thiếu tờ : %d' % len(thieu))
for m, a, b in lech[:15]:
    print('   LỆCH %-20s gói=%s  máy chủ=%s' % (m, a, b))
from collections import Counter
print('Phân bố ngày trên máy chủ:', dict(Counter((x.get('ngayNap') or '(rỗng)') for x in tren.values())))
dat = len(duoi) == len(tren) and not rong and not lech and not thieu
print()
print('KẾT LUẬN: %s' % ('ĐẠT — mỗi tờ có đúng ngày nạp. App chỉ tải tờ nào thật sự đổi.'
                        if dat else 'TRƯỢT — đọc các dòng trên.'))
raise SystemExit(0 if dat else 1)
PY
MA=$?
echo
[ $MA -eq 0 ] && echo ">>> XONG. Mở app, bấm Đồng bộ ngay." || echo ">>> TRƯỢT."
echo "===== KẾT THÚC $(date '+%F %T') ====="
} 2>&1 | tee "$LOG"
echo
read -r -p "Bấm Enter để đóng cửa sổ..." _
