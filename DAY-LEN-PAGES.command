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

echo "=== 1/4 · Dựng bản mới (địa chỉ gốc /, đúng cho pages.dev) ==="
# KHÔNG đặt GITHUB_PAGES=true: cờ đó đổi địa chỉ gốc thành /omr-app/ và chỉ
# đúng cho GitHub Pages. Đặt nhầm thì pages.dev tải tài nguyên sai đường, mở ra
# trang trắng.
unset GITHUB_PAGES
npm run build || { echo ">>> DỰNG HỎNG — đọc lỗi ở trên."; exit 1; }

# Cloudflare Pages: KHÔNG được để 404.html trong dist. Có 404.html thì Cloudflare
# tắt cơ chế SPA fallback và mọi link /hs, /ph, /t/... đều bị trả lỗi 404!
rm -f dist/404.html

echo
echo "=== 2/4 · Kiểm service worker TRƯỚC khi đẩy ==="
# Lỗi 14/09 "app không vào được" nằm trong dist/sw.js — tệp chỉ sinh ra lúc dựng
# nên không phép kiểm nào trong kho đụng tới. DAY-TAT-CA.command đã chặn ở đây
# từ hôm ấy; tệp này thì quên, và ngày 15/09 đẩy bản thần thú qua tệp này nên
# phải chạy chốt bằng tay sau khi đã đẩy xong — đúng thứ tự ngược.
node scripts/kiem-sw.mjs || {
  echo ">>> SERVICE WORKER HỎNG — KHÔNG ĐẨY. Đọc dòng ✗ ở trên."
  echo "    Bản đang chạy trên Pages KHÔNG bị đụng tới, học sinh vẫn dùng bình thường."
  read -r -p "Bấm Enter để đóng cửa sổ..." _
  exit 1
}

echo
echo "=== 3/4 · Đẩy lên Pages ==="
npx -y wrangler@latest pages deploy dist --project-name=omr-app --branch=main
MA=$?

echo
echo "=== 4/4 · Kết quả ==="
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
