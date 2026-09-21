#!/bin/bash
# CHẠY TAY MỘT LƯỢT "BỘ NÃO A.I" TRONG TERMINAL (thầy tự chạy — quyền do chính lệnh này cấp, chỉ đúng những việc ghi dưới đây).
#   bash "/Volumes/SSD NGOÀI/omr-app/scripts/bo-nao/chay-tay.sh"            → soi HÔM NAY (hoặc hôm qua nếu trước 12:00 — theo cẩm nang)
#   bash "/Volumes/SSD NGOÀI/omr-app/scripts/bo-nao/chay-tay.sh" 2026-09-21 → soi đúng ngày này
# Phiên chỉ được: chạy lay.mjs / nop.mjs / date / ls, đọc-ghi trong bo-nao/, gọi trợ lý con. KHÔNG sửa mã, KHÔNG git, KHÔNG mạng khác, KHÔNG đọc mã bí mật.
set -euo pipefail
cd "$(dirname "$0")/../.."
if [ "${1:-}" != "" ]; then
  case "$1" in [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]) printf '%s\n' "$1" > bo-nao/CHAY-NGAY.txt ;; *) echo "Ngày phải dạng YYYY-MM-DD"; exit 1 ;; esac
fi
LOI_DAN="bo-nao/LOI-DAN-PHIEN.md"   # lời dặn đi cùng gói, không phụ thuộc đường dẫn máy
[ -f "$LOI_DAN" ] || { echo "Không thấy lời dặn: $LOI_DAN"; exit 1; }
echo "Bộ não A.I bắt đầu chạy… (thường 10–25 phút; xong sẽ in tổng kết ≤ 8 dòng)"
# Bỏ phần đầu tệp (frontmatter giữa hai dòng ---) rồi đưa lời dặn qua ĐƯỜNG NHẬP CHUẨN: lời dặn bắt đầu bằng "---" sẽ bị hiểu nhầm là tuỳ chọn nếu truyền làm tham số.
awk 'BEGIN{d=0} /^---[[:space:]]*$/ && d<2 {d++; next} d>=2 || d==0 {print}' "$LOI_DAN" | claude -p \
  --allowedTools \
    "Bash(node scripts/bo-nao/lay.mjs:*)" "Bash(node scripts/bo-nao/nop.mjs:*)" \
    "Bash(date:*)" "Bash(TZ=Asia/Ho_Chi_Minh date:*)" "Bash(ls:*)" "Bash(cat bo-nao/CHAY-NGAY.txt)" "Bash(rm bo-nao/CHAY-NGAY.txt)" "Bash(rm -f bo-nao/CHAY-NGAY.txt)" \
    "Read(bo-nao/**)" "Edit(bo-nao/**)" "Glob" "Grep" "Agent" "Task" \
  --disallowedTools "WebFetch" "WebSearch" "Bash(git:*)" "Bash(curl:*)" "Bash(wrangler:*)" "Bash(npx:*)"
