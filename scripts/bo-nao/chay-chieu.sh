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
# Trợ lý con chạy NỀN: bản `claude -p` mặc định chỉ chờ việc nền 600 giây rồi tự kết thúc ("Background tasks still running after 600s; terminating") —
# lượt 21/09 13:02 bị cắt giữa chừng, không ra tệp xem trước. Nới trần chờ lên 40 phút (không để vô hạn kẻo treo).
export CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS="${CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS:-2400000}"
# Mốc thời gian đầu lượt: cuối lượt tệp kết quả phải MỚI HƠN mốc này (tệp cũ của lần chạy trước không được tính).
DAU_LUOT="$(mktemp -t chay-chieu.XXXXXX)"
trap 'rm -f "$DAU_LUOT"' EXIT
set +e   # claude có thể thoát mã 0 dù bị cắt giữa chừng, hoặc mã ≠ 0 dù đã ra tệp: KHÔNG tin mã thoát, kiểm tệp thật ở dưới
claude -p --allowedTools \
    "Bash(node scripts/bo-nao/lay.mjs --chieu:*)" "Bash(node scripts/bo-nao/nop.mjs --chieu --xem-truoc:*)" \
    "Bash(date:*)" "Bash(TZ=Asia/Ho_Chi_Minh date:*)" "Bash(ls:*)" "Bash(cat bo-nao/CHAY-NGAY-CHIEU.txt)" "Bash(rm bo-nao/CHAY-NGAY-CHIEU.txt)" "Bash(rm -f bo-nao/CHAY-NGAY-CHIEU.txt)" \
    "Read(bo-nao/**)" "Edit(bo-nao/**)" "Glob" "Grep" "Agent" "Task" \
  --disallowedTools "WebFetch" "WebSearch" "Bash(git:*)" "Bash(curl:*)" "Bash(wrangler:*)" "Bash(npx:*)" < "$LOI_DAN"
MA_AI=$?
set -e

# KIỂM CUỐI LƯỢT: phải có kết quả THẬT. Không có xem-truoc.md mới ⇒ in lỗi rõ và thoát mã ≠ 0 (trước đây vẫn in "Xong lượt AI" và thoát 0 dù hỏng).
NGAY_KT="${NGAY:-$(TZ=Asia/Ho_Chi_Minh date +%Y-%m-%d)}"
TM="bo-nao/$NGAY_KT/chieu"
moi_hon_moc() { [ -n "$(find "$1" -maxdepth 0 -newer "$DAU_LUOT" 2>/dev/null)" ]; }
if [ ! -f "$TM/tom-tat.json" ] || ! moi_hon_moc "$TM/tom-tat.json"; then
  echo "LỖI: lượt AI kết thúc (claude thoát mã $MA_AI) nhưng KHÔNG lấy được thẻ em (không có $TM/tom-tat.json mới). CHƯA có gì để nộp. Chạy lại: bash scripts/bo-nao/chay-chieu.sh ${NGAY}" >&2
  exit 2
fi
SO_EM="$(node -e 'try{const t=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));console.log(Number.isFinite(t.soEmDuocLay)?t.soEmDuocLay:"?")}catch(e){console.log("?")}' "$TM/tom-tat.json")"
if [ "$SO_EM" = "0" ]; then
  echo "Hôm nay không có em nào có tín hiệu → không có gì để xem trước hay nộp."
  exit 0
fi
if [ ! -f "$TM/xem-truoc.md" ] || ! moi_hon_moc "$TM/xem-truoc.md"; then
  echo "LỖI: lượt AI kết thúc (claude thoát mã $MA_AI) nhưng KHÔNG có $TM/xem-truoc.md mới — trợ lý con có thể bị cắt giữa chừng. CHƯA nộp được gì. Chạy lại: bash scripts/bo-nao/chay-chieu.sh ${NGAY}" >&2
  exit 3
fi
echo "Xong lượt AI. Đọc $TM/xem-truoc.md rồi nộp: bash scripts/bo-nao/chay-chieu.sh --nop ${NGAY}"
