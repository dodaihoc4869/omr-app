#!/bin/bash
# ĐẨY APP LÊN CLOUDFLARE PAGES — https://omr-app-b3u.pages.dev/
#
# Vì sao có tệp này: Pages project `omr-app` KHÔNG nối vào GitHub, nên đẩy mã
# lên GitHub không làm Pages đổi gì. Mỗi bản mới phải đẩy thẳng bằng wrangler.
# Lần đẩy gần nhất trước tệp này là 97f2ed6 lúc 23:32 ngày 13/09.
#
# Cách dùng: bấm đúp vào tệp này. Không cần gõ gì.
# Wrangler dùng phiên đăng nhập sẵn trên máy Thầy; tệp này KHÔNG chứa mã bí mật.
set -u
cd "$(dirname "$0")" || exit 1

echo "=== 1/3 · Dựng bản mới (địa chỉ gốc /, đúng cho pages.dev) ==="
# KHÔNG đặt GITHUB_PAGES=true: cờ đó đổi địa chỉ gốc thành /omr-app/ và chỉ
# đúng cho GitHub Pages. Đặt nhầm thì pages.dev tải tài nguyên sai đường, mở ra
# trang trắng.
unset GITHUB_PAGES
npm run build || { echo ">>> DỰNG HỎNG — đọc lỗi ở trên."; exit 1; }

echo
echo "=== 2/3 · Đẩy lên Pages ==="
npx -y wrangler@latest pages deploy dist --project-name=omr-app --branch=main
MA=$?

echo
echo "=== 3/3 · Kết quả ==="
if [ $MA -eq 0 ]; then
  echo ">>> XONG. Mở https://omr-app-b3u.pages.dev/ để kiểm."
  echo "    Giáo viên : https://omr-app-b3u.pages.dev/?vai=gv"
  echo "    Học sinh  : https://omr-app-b3u.pages.dev/hs"
  echo "    Phụ huynh : https://omr-app-b3u.pages.dev/ph"
else
  echo ">>> CHƯA ĐẨY ĐƯỢC (mã thoát $MA) — đọc lỗi ở trên."
  echo "    Nếu báo chưa đăng nhập: chạy  npx wrangler login  rồi bấm lại tệp này."
fi
echo
read -r -p "Bấm Enter để đóng cửa sổ..." _
