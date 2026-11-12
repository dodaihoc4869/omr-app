#!/bin/bash
# LƯỢT H (12/11 sáng): từ F-40000, cấu hình G (luân lượt + xôn xao, mẫu 4 s) + 12,8 phút giọng thầy YouTube thầy gửi (<dl>/yt, giữ riêng yt-iBs8-giu).
# Chạy lại an toàn (máy khởi động lại): chỉ khởi những gì đang không chạy; luyen.py tự nạp checkpoint mới nhất trong ck-h.
# TG_YT_TI = tỉ lệ mẫu giọng thầy YouTube SẠCH (mặc định 0,6; lượt H đổi 0,35 từ bước 42 000 — xem docs/do-live-1011.md 11.8).
#   TG_TAM=<thư mục tạm có venv/, ma/ (= thư mục này), du-lieu-f/> bash chay-h.sh
cd "${TG_TAM:?đặt TG_TAM}"
if ! pgrep -f "ma/luyen.py du-lieu-f ck-h" > /dev/null; then
  echo "=== H khởi $(date -u +%H:%M) UTC (nạp ck mới nhất trong ck-h): TG_L2=4 TG_LOT=0.05 TG_IM0=0.1 TG_IM1=0.1 TG_GIA=0.05 TG_LUOT=0.3 TG_XON=0.15 TG_GIAY=4 TG_YT_TI=${TG_YT_TI:-0.6}, du-lieu-f, SO_BUOC 60000" >> luyen-ck-h.log
  TG_DL=du-lieu-f TG_L2=4 TG_LOT=0.05 TG_IM0=0.1 TG_IM1=0.1 TG_GIA=0.05 TG_LUOT=0.3 TG_XON=0.15 TG_GIAY=4 TG_YT_TI=${TG_YT_TI:-0.6} bash ma/chay-luyen.sh ck-h 60000
fi
pgrep -f ma/canh-ck.sh > /dev/null || { setsid nohup bash ma/canh-ck.sh >> canh-ck.log 2>&1 < /dev/null & echo "canh-ck $!"; }
