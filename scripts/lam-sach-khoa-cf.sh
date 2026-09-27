#!/usr/bin/env bash
# LÀM SẠCH KHOÁ CLOUDFLARE trước khi đưa cho wrangler (27/09/2026).
# Lỗi gặp thật (run 499): secret CLOUDFLARE_API_TOKEN dán thành 2 dòng ⇒ wrangler báo
#   Headers.set: "***⏎***" is an invalid header value.
# Cách làm: tách từng dòng, bỏ khoảng trắng/ngoặc kép/tiền tố "TEN_BIEN=" dán thừa,
#   · khoá API = dòng đầu tiên KHÔNG phải mã tài khoản (32 ký tự hex), không phải tên biến VIET_HOA, không có khoảng trắng;
#   · mã tài khoản = chuỗi 32 hex đầu tiên trong CLOUDFLARE_ACCOUNT_ID (thiếu thì tìm trong secret khoá).
# KHÔNG in giá trị khoá: chỉ in số dòng + độ dài từng dòng để chẩn đoán. Ghi ra $GITHUB_ENV.
set -euo pipefail
sach() { printf '%s\n' "$1" | tr -d '\r' | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//; s/^[A-Za-z_]+[[:space:]]*[=:][[:space:]]*//; s/^["'\'']//; s/["'\'']$//' | grep -v '^$' || true; }
T_DONG=$(sach "${T:-}")
A_DONG=$(sach "${A:-}")
echo "Khoá API: $(printf '%s\n' "$T_DONG" | grep -c . || true) dòng, độ dài: $(printf '%s\n' "$T_DONG" | awk '{printf "%s%d", (NR>1?", ":""), length($0)}')"
echo "Mã tài khoản: $(printf '%s\n' "$A_DONG" | grep -c . || true) dòng, độ dài: $(printf '%s\n' "$A_DONG" | awk '{printf "%s%d", (NR>1?", ":""), length($0)}')"
TOKEN=$(printf '%s\n' "$T_DONG" | grep -Ev '^[0-9a-fA-F]{32}$' | grep -Ev '^[A-Z_]+$' | grep -v '[[:space:]]' | head -n1 || true)
ACC=$(printf '%s\n' "$A_DONG" | grep -oE '[0-9a-fA-F]{32}' | head -n1 || true)
[ -n "$ACC" ] || ACC=$(printf '%s\n' "$T_DONG" | grep -E '^[0-9a-fA-F]{32}$' | head -n1 || true)
if [ -z "$TOKEN" ]; then echo "::error::Không tìm thấy khoá API hợp lệ trong secret CLOUDFLARE_API_TOKEN"; exit 1; fi
if [ -z "$ACC" ]; then echo "::error::Không tìm thấy mã tài khoản (32 ký tự hex) trong CLOUDFLARE_ACCOUNT_ID"; exit 1; fi
echo "::add-mask::$TOKEN"
echo "::add-mask::$ACC"
echo "Đã chọn khoá API độ dài ${#TOKEN}, mã tài khoản độ dài ${#ACC}"
{ echo "CF_TOKEN_SACH=$TOKEN"; echo "CF_ACC_SACH=$ACC"; } >> "${GITHUB_ENV:?}"
