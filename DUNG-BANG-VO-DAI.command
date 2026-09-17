#!/bin/bash
# DỰNG HAI BẢNG CHO ĐẤU TRƯỜNG CHÂN LÝ — chạy MỘT LẦN, 16-09-2026.
#
# Chạy `server/migration-1609-vo-dai.sql` lên D1 thật. Tệp SQL chỉ có hai câu
# CREATE TABLE IF NOT EXISTS và hai CREATE INDEX IF NOT EXISTS — chạy lại lần
# nữa không hỏng gì, nhưng cũng không cần.
#
# KHÔNG ĐỤNG tới bảng nào đang phục vụ ca thi: không ALTER, không DROP, không
# DELETE. Bước 1 dưới đây chứng minh điều ấy bằng cách đọc chính tệp SQL.
#
# Sau tệp này thì chạy DAY-MAY-CHU.command để đẩy Worker có tám đường
# /vo-dai/*. Chạy ngược thứ tự thì Worker gọi bảng chưa có.
set -u
cd "$(dirname "$0")" || exit 1

LOG="_dung-bang-vo-dai.log"
SQL="server/migration-1609-vo-dai.sql"
{
echo "===== $(date '+%F %T') ====="

echo "=== 1/3 · Soi tệp SQL trước khi cho chạy ==="
if [ ! -f "$SQL" ]; then echo ">>> KHÔNG THẤY $SQL — DỪNG."; exit 1; fi
if grep -Eiq '(^|[^A-Z_])(DROP|ALTER|DELETE|UPDATE|TRUNCATE)([^A-Z_]|$)' "$SQL"; then
  echo ">>> TỆP SQL CÓ LỆNH SỬA/XOÁ DỮ LIỆU — DỪNG, không chạy."
  grep -Ein '(^|[^A-Z_])(DROP|ALTER|DELETE|UPDATE|TRUNCATE)([^A-Z_]|$)' "$SQL"
  exit 1
fi
echo "Chỉ có lệnh tạo bảng/chỉ mục:"
grep -Ei '^(CREATE)' "$SQL"

echo
echo "=== 2/3 · Chạy lên D1 thật (cơ sở dữ liệu omr) ==="
npx -y wrangler@latest d1 execute omr --file="$SQL" --remote --config server/wrangler.toml
MA=$?
if [ $MA -ne 0 ]; then echo ">>> CHẠY SQL HỎNG (mã thoát $MA) — đọc lỗi ở trên."; exit 1; fi

echo
echo "=== 3/3 · Đếm lại để chứng minh hai bảng đã có ==="
npx -y wrangler@latest d1 execute omr --remote --config server/wrangler.toml \
  --command "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'vo_dai%' ORDER BY name"

echo
echo ">>> XONG. Giờ chạy DAY-MAY-CHU.command để đẩy Worker."
echo "===== xong $(date '+%F %T') ====="
} 2>&1 | tee -a "$LOG"

echo
read -r -p "Bấm Enter để đóng cửa sổ..." _
