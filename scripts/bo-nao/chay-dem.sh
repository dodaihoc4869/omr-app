#!/bin/bash
# LƯỢT ĐÊM CỦA "BỘ NÃO A.I" — do launchd của máy thầy gọi lúc 04:00 (thầy chọn "dùng terminal" 21/09/2026).
# Không tham số ⇒ `chay-tay.sh` không đặt ngày ⇒ cẩm nang bước 0: chạy trước 12:00 thì soi trọn HÔM QUA.
# Chống chạy chồng bằng thư mục khoá; nhật ký: ~/.omr-bo-nao/nhat-ky/<ngày-giờ>.log (giữ 30 tệp mới nhất). Không in mã bí mật, không in dữ liệu học sinh.
export PATH="/usr/local/bin:$HOME/.npm-global/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export LANG="en_US.UTF-8"
GOC="$(cd "$(dirname "$0")/../.." && pwd)" || { echo "Không vào được thư mục dự án"; exit 2; }
NK="$HOME/.omr-bo-nao/nhat-ky"; mkdir -p "$NK"
LOG="$NK/$(date +%Y%m%d-%H%M%S).log"
{
  echo "== $(date '+%d/%m/%Y %H:%M:%S') · Bộ não A.I lượt đêm · dự án: $GOC"
  echo "node: $(command -v node || echo THIẾU) · claude: $(command -v claude || echo THIẾU)"
  if [ -f "$HOME/.omr-bo-nao/THU" ]; then
    KIEU="$(cat "$HOME/.omr-bo-nao/THU" 2>/dev/null || true)"; rm -f "$HOME/.omr-bo-nao/THU"
    echo "CHẾ ĐỘ THỬ: chỉ kiểm đường đi, không gọi AI."
    ls "$GOC/bo-nao/HUONG-DAN-BO-NAO.md" "$GOC/scripts/bo-nao/lay.mjs" && echo "ĐỌC ĐƯỢC ổ dự án"
    claude --version 2>&1 | head -1
    if [ "$KIEU" = "ai" ]; then echo "Gọi thử AI (một câu, không công cụ):"; (cd "$GOC" && echo "Trả lời đúng một chữ: OK" | claude -p 2>&1 | head -3); fi
    echo "== xong thử"; exit 0
  fi
  KHOA="$HOME/.omr-bo-nao/dang-chay.khoa"
  if ! mkdir "$KHOA" 2>/dev/null; then echo "Đang có lượt khác chạy (khoá $KHOA) — bỏ qua lượt này."; exit 0; fi
  trap 'rmdir "$KHOA" 2>/dev/null' EXIT
  bash "$GOC/scripts/bo-nao/chay-tay.sh"
  echo "== $(date '+%H:%M:%S') · kết thúc, mã thoát $?"
} >> "$LOG" 2>&1
ls -t "$NK"/*.log 2>/dev/null | tail -n +31 | while read -r f; do rm -f "$f"; done
