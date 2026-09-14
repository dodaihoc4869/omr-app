#!/bin/bash
# Chạy hai phép kiểm đầu-cuối trên máy chủ game THẬT (chạy cục bộ).
#   bash server-game/kiem/chay.sh
set -e
cd "$(dirname "$0")/.."
npx wrangler dev --local --port 8799 --ip 127.0.0.1 > /tmp/wr.log 2>&1 &
WP=$!
trap "kill $WP 2>/dev/null" EXIT
for i in $(seq 1 40); do sleep 2; curl -s -m 2 http://127.0.0.1:8799/khoe >/dev/null 2>&1 && break; done
node kiem/e2e-phong-cho.mjs
node kiem/e2e-van-that.mjs
