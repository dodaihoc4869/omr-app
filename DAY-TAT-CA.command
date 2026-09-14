#!/bin/bash
# ĐẨY CẢ MÁY CHỦ LẪN APP — bấm đúp vào tệp này, không cần gõ gì.
#
# Vì sao gộp một tệp: từ 14/09 mỗi lần sửa cách ĐẾM CÂU là phải đẩy CẢ HAI —
# máy chủ trả số, app vẽ số. Đẩy lệch một bên là hai bên nói hai con số khác
# nhau, đúng thứ lỗi vừa sửa.
#
# Wrangler dùng phiên đăng nhập sẵn trên máy Thầy; tệp này KHÔNG chứa mã bí mật.
set -u
cd "$(dirname "$0")" || exit 1

echo "=== 1/4 · Đẩy MÁY CHỦ (Worker) ==="
( cd server && npx -y wrangler@latest deploy ) || { echo ">>> MÁY CHỦ CHƯA LÊN — đọc lỗi ở trên."; exit 1; }

echo
echo "=== 2/4 · Dựng bản mới (địa chỉ gốc /, đúng cho pages.dev) ==="
unset GITHUB_PAGES
npm run build || { echo ">>> DỰNG HỎNG — đọc lỗi ở trên."; exit 1; }

# Cloudflare Pages: KHÔNG được để 404.html trong dist, có nó là tắt SPA fallback.
rm -f dist/404.html

echo
echo "=== 2b/4 · Kiểm service worker TRƯỚC khi đẩy ==="
# Lỗi 14/09 "app không vào được" nằm trong dist/sw.js — tệp chỉ sinh ra lúc
# dựng nên không phép kiểm nào trong kho đụng tới. Từ nay chặn ngay tại đây.
node scripts/kiem-sw.mjs || { echo ">>> SERVICE WORKER HỎNG — KHÔNG ĐẨY. Đọc dòng ✗ ở trên."; exit 1; }

echo
echo "=== 3/4 · Đẩy APP lên Pages ==="
npx -y wrangler@latest pages deploy dist --project-name=omr-app --branch=main
MA=$?

echo
echo "=== 4/4 · Kết quả ==="
if [ $MA -eq 0 ]; then
  echo ">>> XONG CẢ HAI."
  echo "    Giáo viên : https://omr-app-b3u.pages.dev/?vai=gv"
  echo "    Học sinh  : https://omr-app-b3u.pages.dev/hs"
  echo "    Phụ huynh : https://omr-app-b3u.pages.dev/ph"
else
  echo ">>> APP CHƯA ĐẨY ĐƯỢC (mã thoát $MA) — đọc lỗi ở trên. Máy chủ thì đã lên."
fi
echo
read -r -p "Bấm Enter để đóng cửa sổ..." _
