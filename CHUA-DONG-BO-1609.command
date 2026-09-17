#!/bin/bash
# CHỮA ĐỒNG BỘ 16/09 — máy chủ trả `ngayNap` cho `danhSachDe`.
#
# NGUYÊN NHÂN GỐC: `danhSachDeKho` không trả `ngayNap` (D1 không có cột giữ
# nó). App nhận '' cho cả 225 tờ, so với ngày thật nằm trong gói đang giữ trên
# máy thầy ⇒ kết luận TỜ NÀO CŨNG ĐỔI ⇒ mỗi lượt Đồng bộ tải lại toàn bộ kho
# VÀ đẩy lại ngân hàng của mọi ca đã mở, chạy mãi không xong. Nhìn từ phía thầy
# đúng là "bấm Đồng bộ mà không vào".
#
# Tệp này KHÔNG đụng app trên Pages (game thần thú của phiên khác giữ nguyên).
# Chỉ: cột D1 → Worker → nạp lại kho → TỰ NGHIỆM THU.
# Wrangler dùng phiên đăng nhập sẵn trên máy Thầy; tệp này KHÔNG chứa mã bí mật.
set -u
cd "$(dirname "$0")" || exit 1
GOC="$(pwd)"
KHO="$GOC/../kho-de"
LOG="$GOC/_chua-dong-bo-1609.log"
W="npx -y wrangler@latest"

{
echo "===== BẮT ĐẦU $(date '+%F %T') ====="

# ─────────────────────────────────────────────────────── 1/6 · CHỐT CA THI
echo
echo "=== 1/6 · Kiểm ca thi đang mở ==="
MAT=""
for T in "$KHO/cau-hinh-may-chu-moi.json" "$KHO/cau-hinh.json"; do
  [ -f "$T" ] || continue
  MAT=$(/usr/bin/python3 -c "import json,sys;print((json.load(open(sys.argv[1],encoding='utf-8')).get('secret') or '').strip())" "$T" 2>/dev/null)
  [ -n "$MAT" ] && break
done
if [ -z "$MAT" ]; then
  echo ">>> KHÔNG ĐỌC ĐƯỢC MÃ BÍ MẬT — không kiểm được ca mở. DỪNG."; exit 1
fi
KQ=$(MAT="$MAT" /usr/bin/python3 - <<'PY'
import json, os, urllib.request
try:
    d = json.dumps({'action': 'danhSachCa', 'secret': os.environ['MAT']}).encode()
    q = urllib.request.Request('https://omr.ttadodaihoc.workers.dev/goi', data=d,
                               headers={'Content-Type': 'application/json',
                                        'User-Agent': 'chua-dong-bo/1.0'})
    r = json.load(urllib.request.urlopen(q, timeout=60))
except Exception as e:
    print('LOI %s' % str(e)[:120]); raise SystemExit(0)
if not r.get('ok'):
    print('LOI %s' % str(r.get('error'))[:120]); raise SystemExit(0)
mo = [c for c in (r.get('items') or [])
      if c.get('trangThai') == 'mo' and int(c.get('daVao') or 0) > int(c.get('daNop') or 0)]
if mo:
    print('CA_MO %d' % len(mo))
else:
    print('SACH %d ca trong danh sách, không ca nào đang mở còn em chưa nộp'
          % len(r.get('items') or []))
PY
)
echo "$KQ"
case "$KQ" in
  CA_MO*) echo ">>> DỪNG: đang có ca thi mở."; exit 1 ;;
  LOI*)   echo ">>> DỪNG: không hỏi được máy chủ nên KHÔNG biết có ca mở hay không."; exit 1 ;;
esac

# ──────────────────────────────────────────── 2/6 · THÊM CỘT ngay_nap VÀO D1
echo
echo "=== 2/6 · Thêm cột ngay_nap vào bảng de_kho (D1 thật) ==="
$W d1 execute omr --file=server/migration-1609-ngay-nap.sql --remote -y --config server/wrangler.toml 2>&1 | tee /tmp/_alter1609.txt
if grep -qi "duplicate column" /tmp/_alter1609.txt; then
  echo "    (cột đã có sẵn từ lượt trước — bỏ qua, không phải lỗi)"
fi

echo
echo "--- kiểm cột có thật không ---"
$W d1 execute omr --remote -y --config server/wrangler.toml \
   --command "SELECT COUNT(*) AS so_to, COUNT(NULLIF(ngay_nap,'')) AS co_ngay FROM de_kho" 2>&1 | tee /tmp/_kiemcot1609.txt
grep -qi "no such column" /tmp/_kiemcot1609.txt && { echo ">>> CỘT CHƯA VÀO ĐƯỢC — DỪNG, không đẩy Worker."; exit 1; }

# ───────────────────────────────────────────────────── 3/6 · KIỂM KIỂU MÁY CHỦ
echo
echo "=== 3/6 · Kiểm kiểu TypeScript của máy chủ ==="
npx -y tsc --noEmit -p server/tsconfig.json || { echo ">>> MÃ MÁY CHỦ SAI KIỂU — KHÔNG ĐẨY."; exit 1; }

# ────────────────────────────────────────────────────────── 4/6 · ĐẨY WORKER
echo
echo "=== 4/6 · Đẩy Worker (app trên Pages GIỮ NGUYÊN) ==="
( cd server && $W deploy ) || { echo ">>> MÁY CHỦ CHƯA LÊN. DỪNG."; exit 1; }

# ───────────────────────────────────────── 5/6 · NẠP LẠI CẢ KHO ĐỂ ĐIỀN NGÀY
echo
echo "=== 5/6 · Nạp lại toàn bộ kho để điền ngay_nap cho 225 tờ (vài phút) ==="
( cd "$KHO" && mkdir -p _xem && /usr/bin/python3 cong-cu/nap-de-may-chu-moi.py --day-het ) \
  || { echo ">>> NẠP KHO CHƯA XONG — đọc lỗi ở trên."; exit 1; }

# ──────────────────────────────────────────────────────── 6/6 · TỰ NGHIỆM THU
echo
echo "=== 6/6 · NGHIỆM THU: máy chủ trả ngayNap khớp từng gói ==="
MAT="$MAT" KHO="$KHO" /usr/bin/python3 - <<'PY'
import json, os, sys, urllib.request
sys.path.insert(0, os.path.join(os.environ['KHO'], 'cong-cu'))
os.chdir(os.environ['KHO'])
import may_chu_moi as M
d = json.dumps({'action': 'danhSachDe', 'secret': os.environ['MAT']}).encode()
q = urllib.request.Request('https://omr.ttadodaihoc.workers.dev/goi', data=d,
                           headers={'Content-Type': 'application/json',
                                    'User-Agent': 'chua-dong-bo/1.0'})
r = json.load(urllib.request.urlopen(q, timeout=180))
tren = {x['maDe']: x for x in (r.get('items') or [])}
duoi = {}
for p in M.cac_tep_de():
    duoi[M.ma_cua(p)] = (json.load(open(p, encoding='utf-8')).get('ngay_nap') or '').strip()

co_truong = sum(1 for x in tren.values() if 'ngayNap' in x)
rong = [m for m, x in tren.items() if not (x.get('ngayNap') or '').strip()]
lech = [(m, duoi[m], (tren[m].get('ngayNap') or '')) for m in duoi if m in tren and duoi[m] != (tren[m].get('ngayNap') or '')]
thieu = [m for m in duoi if m not in tren]

print('Tờ dưới máy thầy        : %d' % len(duoi))
print('Tờ trên máy chủ         : %d' % len(tren))
print('Tờ máy chủ CÓ ngayNap   : %d' % co_truong)
print('Tờ ngayNap còn RỖNG     : %d' % len(rong))
print('Tờ ngayNap LỆCH gói     : %d' % len(lech))
print('Tờ có dưới mà máy chủ thiếu: %d' % len(thieu))
for m, a, b in lech[:10]:
    print('   LỆCH %-20s gói=%s  máy chủ=%s' % (m, a, b))
dat = (len(duoi) == len(tren) == co_truong) and not rong and not lech and not thieu
print()
print('KẾT LUẬN: %s' % ('ĐẠT — mỗi tờ có đúng ngày nạp, app sẽ chỉ tải tờ nào thật sự đổi.'
                        if dat else 'TRƯỢT — đọc các dòng trên.'))
raise SystemExit(0 if dat else 1)
PY
MA=$?
echo
if [ $MA -eq 0 ]; then
  echo ">>> XONG. Giờ mở app, bấm Đồng bộ ngay: chỉ những tờ thật sự đổi mới tải."
  echo "    Lùi máy chủ: git revert --no-edit <mã commit> rồi bấm DAY-MAY-CHU.command."
  echo "    (Cột ngay_nap là cột THÊM, bản máy chủ cũ không đụng tới nên lùi an toàn.)"
else
  echo ">>> NGHIỆM THU TRƯỢT — đọc phần 6/6 ở trên."
fi
echo "===== KẾT THÚC $(date '+%F %T') ====="
} 2>&1 | tee "$LOG"

echo
read -r -p "Bấm Enter để đóng cửa sổ..." _
