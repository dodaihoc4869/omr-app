#!/bin/bash
# Chạy luyện nền, tách khỏi phiên (đứt thì chạy lại: tự nạp checkpoint mới nhất). TG_DL = thư mục dữ liệu (mặc định du-lieu; lượt F: du-lieu-f).
cd "${TG_TAM:?đặt TG_TAM}"
setsid nohup venv/bin/python -I ma/luyen.py "${TG_DL:-du-lieu}" "${1:-ck1}" "${2:-30000}" >> "luyen-${1:-ck1}.log" 2>&1 < /dev/null &
echo "pid $!"
