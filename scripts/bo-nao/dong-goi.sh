#!/bin/bash
# ĐÓNG GÓI "BỘ NÃO A.I" SANG Ổ TRONG của máy thầy: ~/.omr-bo-nao/app/
# Vì sao: macOS chặn tác vụ nền (launchd) đọc ổ SSD NGOÀI ("Operation not permitted"); gói ở ổ trong thì lượt đêm 04:00 chạy được mà không cần ai bấm cấp quyền.
# Gói CHỈ gồm: 3 mã lệnh + 2 mã lệnh chạy, các thư viện thuần chúng import, cẩm nang, lời dặn. DỮ LIỆU từng đêm + sổ tay nằm ở ~/.omr-bo-nao/app/bo-nao/ và KHÔNG bị ghi đè.
# Chạy lại mỗi khi sửa mã lệnh/cẩm nang:  bash scripts/bo-nao/dong-goi.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
DICH="$HOME/.omr-bo-nao/app"
mkdir -p "$DICH/scripts/bo-nao" "$DICH/src/lib" "$DICH/bo-nao/so-tay"
cp scripts/bo-nao/lay.mjs scripts/bo-nao/nop.mjs scripts/bo-nao/chung.mjs scripts/bo-nao/cau-hinh.mjs scripts/bo-nao/chay-tay.sh scripts/bo-nao/chay-dem.sh "$DICH/scripts/bo-nao/"
cp src/lib/bo-nao-khuon.ts src/lib/bo-nao-nen.ts src/lib/btvn-nang-do.ts "$DICH/src/lib/"
# thư viện mà btvn-nang-do.ts import (nếu có) — chép theo danh sách import tương đối
grep -hoE "from '\./[^']+'" src/lib/bo-nao-khuon.ts src/lib/bo-nao-nen.ts src/lib/btvn-nang-do.ts | sed -E "s/from '\.\/([^']+)'/\1/" | sort -u | while read -r m; do [ -f "src/lib/$m.ts" ] && cp "src/lib/$m.ts" "$DICH/src/lib/" || true; done
cp bo-nao/HUONG-DAN-BO-NAO.md bo-nao/LOI-DAN-PHIEN.md "$DICH/bo-nao/"
for f in bai-hoc.md do-token.md; do [ -f "$DICH/bo-nao/so-tay/$f" ] || cp "bo-nao/so-tay/$f" "$DICH/bo-nao/so-tay/"; done   # sổ tay: chỉ chép lần đầu, về sau bộ não tự ghi
printf '{"type":"module"}\n' > "$DICH/package.json"
chmod 700 "$HOME/.omr-bo-nao" "$DICH"; chmod +x "$DICH/scripts/bo-nao/"*.sh
git rev-parse --short HEAD > "$DICH/PHIEN-BAN.txt" 2>/dev/null || true
echo "Đã đóng gói → $DICH (bản $(cat "$DICH/PHIEN-BAN.txt" 2>/dev/null))"
