#!/bin/bash
# PHÁT HÀNH BẢN SẠCH — nhấp đúp là chạy, không cần gõ gì.
#
# Khác DAY-TAT-CA.command ở hai chỗ, và đó là lý do tệp này tồn tại:
#
# 1. CHỐT CA THI. Không đẩy gì khi đang có ca thi mở còn em chưa nộp — đổi máy
#    chủ hay đổi đề giữa ca là phá ca thật. DAY-TAT-CA.command không có chốt này.
#
# 2. DỰNG TỪ BẢN ĐÃ COMMIT (HEAD), KHÔNG DỰNG TỪ CÂY ĐANG SỬA. Ngày 16/09 cây
#    làm việc còn hai tệp thần thú của phiên khác sửa dở, và phép kiểm
#    `tests/than-thu-long-canh.test.ts` đỏ vì mắt thú bị lông nuốt. Cùng lúc ấy
#    HEAD xanh trọn. Dựng từ HEAD nên bản lên mạng là bản đã commit, việc dở của
#    phiên kia nằm nguyên trên ổ, không bị cõng lên cho học sinh.
#
# Wrangler dùng phiên đăng nhập sẵn trên máy Thầy; tệp này KHÔNG chứa mã bí mật.
set -u
cd "$(dirname "$0")" || exit 1
GOC="$(pwd)"
KHO="$GOC/../kho-de"
LOG="$GOC/_phat-hanh.log"

{
echo "===== BẮT ĐẦU $(date '+%F %T') ====="

# ─────────────────────────────────────────────────────────── 1/6 · CHỐT CA THI
echo
echo "=== 1/6 · Kiểm ca thi đang mở ==="
MAT=""
for T in "$KHO/cau-hinh-may-chu-moi.json" "$KHO/cau-hinh.json"; do
  [ -f "$T" ] || continue
  # /usr/bin/python3 là bản DUY NHẤT trên máy Thầy có sẵn chứng chỉ gốc; gọi
  # `python3` trơn là trúng Homebrew/pyenv và lượt HTTPS ra CERTIFICATE_VERIFY_FAILED.
  MAT=$(/usr/bin/python3 -c "import json,sys;print((json.load(open(sys.argv[1],encoding='utf-8')).get('secret') or '').strip())" "$T" 2>/dev/null)
  [ -n "$MAT" ] && break
done
if [ -z "$MAT" ]; then
  echo ">>> KHÔNG ĐỌC ĐƯỢC MÃ BÍ MẬT trong kho-de/cau-hinh*.json — không kiểm được ca mở."
  echo ">>> DỪNG. Không đẩy gì cả."
  exit 1
fi

KQ=$(MAT="$MAT" /usr/bin/python3 - <<'PY'
import json, os, urllib.request
try:
    d = json.dumps({'action': 'danhSachCa', 'secret': os.environ['MAT']}).encode()
    q = urllib.request.Request('https://omr.ttadodaihoc.workers.dev/goi', data=d,
                               headers={'Content-Type': 'application/json',
                                        'User-Agent': 'phat-hanh-sach/1.0'})
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
        print('   %s %s — vào %s, nộp %s' % (c.get('maCa'), c.get('tenCa'),
                                             c.get('daVao'), c.get('daNop')))
else:
    print('SACH %d ca trong danh sách, không ca nào đang mở còn em chưa nộp'
          % len(r.get('items') or []))
PY
)
echo "$KQ"
case "$KQ" in
  CA_MO*) echo ">>> DỪNG: đang có ca thi mở. Đổi đề hay đổi máy chủ lúc này là phá ca thật."; exit 1 ;;
  LOI*)   echo ">>> DỪNG: không hỏi được máy chủ nên KHÔNG biết có ca mở hay không. Không đẩy."; exit 1 ;;
esac

# ──────────────────────────────────────────────────────── 2/6 · NẠP KHO ĐỀ
echo
echo "=== 2/6 · Nạp kho đề lên máy chủ (đối chiếu từng tờ, mất vài phút) ==="
( cd "$KHO" && mkdir -p _xem/nap-may-chu-moi \
  && /usr/bin/python3 cong-cu/nap-de-may-chu-moi.py ) \
  || { echo ">>> NẠP KHO CHƯA XONG — đọc lỗi ở trên. DỪNG, không đẩy app."; exit 1; }

echo
echo "=== 3/6 · Đẩy lại 55 tờ dạng bài (nhãn menu nằm ở D1, không nằm trong gói) ==="
( cd "$KHO" && /usr/bin/python3 cong-cu/nap-de-may-chu-moi.py --day-dang-bai ) \
  || { echo ">>> ĐẨY TỜ DẠNG BÀI HỎNG — đọc lỗi ở trên. DỪNG."; exit 1; }

# ──────────────────────────────────────────── 4/6 · DỰNG BẢN SẠCH TỪ HEAD
echo
echo "=== 4/6 · Dựng bản sạch từ HEAD ==="
MA_HEAD=$(git rev-parse HEAD) || { echo ">>> Không đọc được HEAD."; exit 1; }
echo "HEAD = $MA_HEAD"

# MỐC LUI. Kho này có nhiều phiên cùng làm; đã có lần HEAD hỏng vì một phiên
# commit tệp gọi sang module mà chính nó chưa commit (16/09: DauTruongChanLy.tsx
# gọi ./CauHoiTrongGame còn tệp ấy vẫn nằm ngoài git). Lúc ấy KHÔNG phát hành
# được mà cũng KHÔNG được sửa việc dở của phiên kia.
#
# Nếu có tệp MOC-PHAT-HANH.txt chứa một mã commit, tệp này dựng HEAD trước;
# HEAD hỏng thì lui về mốc ấy và NÓI TO ra. Mốc phải là tổ tiên của HEAD nên
# không thể lỡ phát hành nhánh lạ. Khi HEAD lành trở lại thì mốc tự hết tác
# dụng — xoá rỗng tệp ấy là xong.
MOC=""
if [ -f MOC-PHAT-HANH.txt ]; then
  MOC=$(tr -d ' \t\r\n' < MOC-PHAT-HANH.txt)
fi

TMP="${TMPDIR:-/tmp}/omr-phat-hanh-$$"
dung_tu() {           # $1 = mã commit
  rm -rf "$TMP"; mkdir -p "$TMP" || return 1
  git archive "$1" | tar -x -C "$TMP" || return 1
  ln -s "$GOC/node_modules" "$TMP/node_modules"
  ( cd "$TMP" && unset GITHUB_PAGES && npm run build )
}

MA_DUNG="$MA_HEAD"
if ! dung_tu "$MA_HEAD"; then
  if [ -z "$MOC" ]; then
    echo ">>> DỰNG HỎNG ở HEAD — đọc lỗi ở trên. Bản đang chạy KHÔNG bị đụng."
    exit 1
  fi
  if ! git merge-base --is-ancestor "$MOC" "$MA_HEAD" 2>/dev/null; then
    echo ">>> DỰNG HỎNG ở HEAD, và mốc lui $MOC KHÔNG phải tổ tiên của HEAD."
    echo ">>> DỪNG, không phát hành. Bản đang chạy KHÔNG bị đụng."
    exit 1
  fi
  echo
  echo "############################################################"
  echo "# HEAD ($MA_HEAD) DỰNG HỎNG."
  echo "# LUI VỀ MỐC trong MOC-PHAT-HANH.txt: $MOC"
  echo "# Bản lên mạng là mốc ấy, KHÔNG phải HEAD."
  echo "############################################################"
  echo
  MA_DUNG="$MOC"
  dung_tu "$MOC" || {
    echo ">>> MỐC LUI CŨNG DỰNG HỎNG — đọc lỗi ở trên. Bản đang chạy KHÔNG bị đụng."
    exit 1
  }
fi

# Cloudflare Pages: có 404.html là tắt SPA fallback, mọi link /hs, /ph, /t/… ra 404.
rm -f "$TMP/dist/404.html"

echo
echo "=== 5/6 · Kiểm service worker TRƯỚC khi đẩy ==="
( cd "$TMP" && node scripts/kiem-sw.mjs ) || {
  echo ">>> SERVICE WORKER HỎNG — KHÔNG ĐẨY. Đọc dòng ✗ ở trên."
  echo "    Bản đang chạy trên Pages KHÔNG bị đụng tới."
  exit 1
}

# Không đưa bản HEAD/mốc lui thiếu game V2 đè lên máy chủ đang chạy.
if [ ! -f "$TMP/server/src/game-v2.ts" ] || ! grep -q "p.startsWith('/game-v2/')" "$TMP/server/src/index.ts" || ! grep -q 'than-thu-v2/Game' "$TMP/src/screens/StudentPortalScreen.tsx"; then
  echo ">>> BẢN PHÁT HÀNH THIẾU GAME V2 — KHÔNG ĐẨY."
  echo "    Cần lưu đủ mã nguồn game đã nghiệm thu vào bản phát hành trước."
  exit 1
fi

# ───────────────────────────────────────────────────── 6/6 · ĐẨY WORKER + PAGES
echo
echo "=== 6/6 · Đẩy máy chủ rồi đẩy app ==="
( cd "$TMP/server" && npx -y wrangler@latest deploy ) \
  || { echo ">>> MÁY CHỦ CHƯA LÊN — đọc lỗi ở trên. App giữ nguyên bản cũ."; exit 1; }

( cd "$TMP" && npx -y wrangler@latest pages deploy dist --project-name=omr-app --branch=main )
MA=$?

echo
if [ $MA -eq 0 ]; then
  echo ">>> XONG CẢ BA: kho đề, máy chủ, app."
  echo "    Giáo viên : https://omr-app-b3u.pages.dev/?vai=gv"
  echo "    Học sinh  : https://omr-app-b3u.pages.dev/hs"
  echo "    Phụ huynh : https://omr-app-b3u.pages.dev/ph"
  echo "    Cài đặt App HS & PH : https://omr-app-b3u.pages.dev/cai-app"
  echo "    Bản vừa phát hành : $MA_DUNG"
  [ "$MA_DUNG" = "$MA_HEAD" ] || echo "    (LUI VỀ MỐC — HEAD $MA_HEAD dựng hỏng)"
  echo "    Lùi bản phát hành : git revert --no-edit <mã commit> rồi bấm lại tệp này."
else
  echo ">>> APP CHƯA ĐẨY ĐƯỢC (mã thoát $MA) — đọc lỗi ở trên. Máy chủ thì đã lên."
fi
rm -rf "$TMP"
echo "===== KẾT THÚC $(date '+%F %T') ====="
} 2>&1 | tee -a "$LOG"

echo
read -r -p "Bấm Enter để đóng cửa sổ..." _
