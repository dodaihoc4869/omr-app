#!/bin/bash
# LƯỢT CHIỀU "THỬ THÁCH RIÊNG HÔM NAY" của Bộ não A.I (thầy chốt 21/09/2026). Thường chạy ~18:30, để em thấy thẻ trước giờ học 20:00.
#   bash scripts/bo-nao/chay-chieu.sh [--xem-truoc] [YYYY-MM-DD]  → LẤY thẻ em có tín hiệu → trợ lý viết lời mời → XEM TRƯỚC (ghi bo-nao/<ngày>/chieu/xem-truoc.md), KHÔNG nộp
#   bash scripts/bo-nao/chay-chieu.sh --nop [YYYY-MM-DD]          → NỘP những gì đã xem trước (KHÔNG gọi AI lại; chỉ nộp khi ra/ không đổi sau bản xem trước)
# Phiên AI chỉ được: `lay.mjs --chieu`, `nop.mjs --chieu --xem-truoc`, date/ls, đọc-ghi trong bo-nao/, gọi trợ lý con. KHÔNG sửa mã, KHÔNG git, KHÔNG mạng khác, KHÔNG nộp thật, KHÔNG đọc mã bí mật.
set -euo pipefail
cd "$(dirname "$0")/../.."
CHE_DO="xem-truoc"; NGAY=""
for a in "$@"; do
  case "$a" in
    --xem-truoc) CHE_DO="xem-truoc" ;;
    --nop) CHE_DO="nop" ;;
    [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]) NGAY="$a" ;;
    *) echo "Cách dùng: chay-chieu.sh [--xem-truoc | --nop] [YYYY-MM-DD]"; exit 1 ;;
  esac
done
if [ "$CHE_DO" = "nop" ]; then
  # nộp thật: không cần AI; mã lệnh tự kiểm đã có bản xem trước và ra/ không đổi sau nó
  node scripts/bo-nao/nop.mjs --chieu ${NGAY:+"$NGAY"}
  exit 0
fi
LOI_DAN="bo-nao/LOI-DAN-CHIEU.md"
[ -f "$LOI_DAN" ] || { echo "Không thấy lời dặn: $LOI_DAN"; exit 1; }
if [ -n "$NGAY" ]; then printf '%s\n' "$NGAY" > bo-nao/CHAY-NGAY-CHIEU.txt; else rm -f bo-nao/CHAY-NGAY-CHIEU.txt; fi
echo "Bộ não A.I lượt chiều bắt đầu… (thường 3–8 phút; xong sẽ in ≤ 6 dòng và tệp xem-truoc.md — CHƯA nộp)"
claude -p --allowedTools \
    "Bash(node scripts/bo-nao/lay.mjs --chieu:*)" "Bash(node scripts/bo-nao/nop.mjs --chieu --xem-truoc:*)" \
    "Bash(date:*)" "Bash(TZ=Asia/Ho_Chi_Minh date:*)" "Bash(ls:*)" "Bash(cat bo-nao/CHAY-NGAY-CHIEU.txt)" "Bash(rm bo-nao/CHAY-NGAY-CHIEU.txt)" "Bash(rm -f bo-nao/CHAY-NGAY-CHIEU.txt)" \
    "Read(bo-nao/**)" "Edit(bo-nao/**)" "Glob" "Grep" "Agent" "Task" \
  --disallowedTools "WebFetch" "WebSearch" "Bash(git:*)" "Bash(curl:*)" "Bash(wrangler:*)" "Bash(npx:*)" < "$LOI_DAN"
echo "Xong lượt AI. Đọc bo-nao/<ngày>/chieu/xem-truoc.md rồi nộp: bash scripts/bo-nao/chay-chieu.sh --nop"
