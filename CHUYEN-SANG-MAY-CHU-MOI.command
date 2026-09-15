#!/bin/bash
# ============================================================================
# CHUYỂN SANG MÁY CHỦ MỚI — nhấp đúp là chạy.
#
#   ① bảng `danh_sach` trên D1   (chạy lại bao nhiêu lần cũng vô hại)
#   ② phát hành Worker từ mã nguồn `server/src/*.ts`
#   ③ đẩy app lên GitHub → Pages tự dựng
#
# KHÔNG CHẠY KHI ĐANG CÓ CA THI MỞ.
#
# VÌ SAO CÓ LỚP `script` Ở DƯỚI (lỗi bản 11:47, đã sửa): bản trước gói cả khối
# vào `{ ... } | tee`, mà đường ống làm đầu ra KHÔNG còn là màn hình thật. Thấy
# vậy wrangler coi là chạy máy-với-máy và từ chối mở trình duyệt đăng nhập, báo
# "In a non-interactive environment...". `script` dựng một màn hình giả nên
# wrangler đăng nhập được MÀ vẫn ghi log đầy đủ.
#
# LÙI LẠI:
#   Worker: dash.cloudflare.com → Workers → omr → Deployments → bản cũ → Rollback
#   App:    cd "/Volumes/SSD NGOÀI/omr-app" && git push -f origin f46b6a4:main
# ============================================================================
cd "$(dirname "$0")" || exit 1

if [ "$1" != "--chay" ]; then
  script -q _chuyen-may-chu.log "$0" --chay
  echo
  echo "Đã ghi lại vào: $(pwd)/_chuyen-may-chu.log"
  echo "Bấm phím bất kỳ để đóng cửa sổ."
  read -n 1 -s
  exit 0
fi

export CLOUDFLARE_ACCOUNT_ID=550e95d8d7a4fbd7f555954e85efcb3e
W="npx -y wrangler@latest"

echo "===== $(date '+%F %T') ====="
echo "Kho mã: $(pwd)"
echo "Nhánh : $(git rev-parse --abbrev-ref HEAD)   HEAD: $(git rev-parse --short HEAD)"
rm -f .git/index.lock .git/HEAD.lock 2>/dev/null

echo
echo "############ 0. ĐĂNG NHẬP CLOUDFLARE ############"
# `wrangler whoami` THOÁT 0 kể cả khi chưa đăng nhập — đó là lý do bản trước đi
# thẳng vào bước sau rồi mới gãy. Phải đọc chữ, không đọc mã thoát.
AI=$($W whoami 2>&1)
echo "$AI"
if echo "$AI" | grep -qi "not authenticated\|You are not authenticated"; then
  echo ">>> Chưa đăng nhập. Trình duyệt sẽ mở ra — thầy bấm Allow rồi quay lại cửa sổ này."
  $W login || { echo ">>> DỪNG: đăng nhập hỏng."; exit 1; }
  AI=$($W whoami 2>&1)
  echo "$AI"
  echo "$AI" | grep -qi "not authenticated" && { echo ">>> DỪNG: vẫn chưa đăng nhập."; exit 1; }
fi

echo
echo "############ 1. BẢNG DANH SÁCH LỚP TRÊN D1 ############"
cd server || exit 1
$W d1 execute omr --file=migration-1109-danh-sach.sql --remote -y
B1=$?
echo "mã thoát = $B1"
if [ $B1 -ne 0 ]; then
  echo ">>> DỪNG. Chưa có bảng thì KHÔNG phát hành Worker — mọi lượt vào thi sẽ rơi về đường cũ."
  cd ..; exit 1
fi

echo
echo "############ 1B. CỘT ĐIỂM, HỌ TÊN VÀ BẢNG LƯỢT BỊ CHẶN ############"
echo "(Chạy lần hai sẽ báo 'duplicate column name' — ĐÚNG và vô hại: cột đã có."
echo " Vì vậy KHÔNG dừng ở mã thoát, mà kiểm bằng truy vấn thật ở ngay dưới.)"
$W d1 execute omr --file=migration-1109-chi-tiet-ca.sql --remote -y
echo "mã thoát = $? (không dùng để quyết định)"

echo
echo "############ 1C. DỰNG NỐT MỌI BẢNG CÒN THIẾU (đợt bỏ hẳn Apps Script) ############"
echo "(Chạy lần hai báo 'already exists' — ĐÚNG và vô hại.)"
$W d1 execute omr --file=migration-1209-toan-bo.sql --remote -y
echo "mã thoát = $? (không dùng để quyết định)"

echo "--- KIỂM THẬT: cột và bảng mới phải TRA ĐƯỢC ---"
$W d1 execute omr --remote -y --command "SELECT COUNT(sinh_tai_d1) AS co_cot_ca FROM ca" > /tmp/_kiem_d1_a.txt 2>&1
KA=$?
$W d1 execute omr --remote -y --command "SELECT COUNT(tong) AS co_cot_luot FROM luot" > /tmp/_kiem_d1_b.txt 2>&1
KB=$?
$W d1 execute omr --remote -y --command "SELECT COUNT(*) AS co_bang_chan FROM chan_vao" > /tmp/_kiem_d1_c.txt 2>&1
KC=$?
$W d1 execute omr --remote -y --command "SELECT (SELECT COUNT(*) FROM chi_tiet_cau) AS ctc, (SELECT COUNT(*) FROM tien_do_hs) AS tdh, (SELECT COUNT(*) FROM de_kho) AS de, (SELECT COUNT(*) FROM btvn) AS btvn" > /tmp/_kiem_d1_d.txt 2>&1
KD=$?
cat /tmp/_kiem_d1_d.txt
cat /tmp/_kiem_d1_a.txt /tmp/_kiem_d1_b.txt /tmp/_kiem_d1_c.txt
if [ $KA -ne 0 ] || [ $KB -ne 0 ] || [ $KC -ne 0 ] || [ $KD -ne 0 ]; then
  echo ">>> DỪNG. Thiếu cột hoặc thiếu bảng thì màn Chi tiết ca trên máy chủ mới sẽ lỗi."
  cd ..; exit 1
fi
echo ">>> Cột và bảng mới đã có đủ."

echo
echo "############ 2. PHÁT HÀNH WORKER ############"
$W deploy
B2=$?
echo "mã thoát = $B2"
cd ..
if [ $B2 -ne 0 ]; then echo ">>> DỪNG. Worker chưa lên thì đẩy app cũng vô ích."; exit 1; fi

echo
echo "############ KIỂM NGAY MÁY CHỦ VỪA LÊN ############"
U=https://omr.ttadodaihoc.workers.dev
echo "--- /khoe (phải có coDB:true coR2:true coMat:true) ---"
curl -s --max-time 20 "$U/khoe"; echo
echo "--- /ten-theo-sbd (phải 200 hoặc 404, KHÔNG được 405) ---"
curl -s -o /dev/null -w "ma HTTP = %{http_code}\n" --max-time 20 "$U/ten-theo-sbd?maCa=TESTX&sbd=TEST0001"
echo "--- /phieu/TESTKHONGCO (phải 404, KHÔNG được 405) ---"
curl -s -o /dev/null -w "ma HTTP = %{http_code}\n" --max-time 20 "$U/phieu/TESTKHONGCO"
echo "--- /cham-diem KHÔNG kèm mã bí mật (phải 403 = bản BỎ APPS SCRIPT đã lên) ---"
curl -s -o /dev/null -w "ma HTTP = %{http_code}\n" --max-time 20 -X POST -H "content-type: application/json" -d '{}' "$U/cham-diem"
echo "--- /kho/danh-sach KHÔNG kèm mã bí mật (phải 403) ---"
curl -s -o /dev/null -w "ma HTTP = %{http_code}\n" --max-time 20 -X POST -H "content-type: application/json" -d '{}' "$U/kho/danh-sach"
echo "--- /btvn/cua-em (CÔNG KHAI, phải 200 kèm lyDo thieu — KHÔNG được 403/404) ---"
curl -s --max-time 20 -X POST -H "content-type: application/json" -d '{}' "$U/btvn/cua-em"; echo
echo "--- /ca/chi-tiet KHÔNG kèm mã bí mật (phải 403 = đợt 5D đã lên; 404 = bản cũ) ---"
curl -s -o /dev/null -w "ma HTTP = %{http_code}\n" --max-time 20 -X POST -H "content-type: application/json" -d '{"maCa":"TESTX"}' "$U/ca/chi-tiet"
echo "--- /em/danh-sach KHÔNG kèm mã bí mật (phải 403) ---"
curl -s -o /dev/null -w "ma HTTP = %{http_code}\n" --max-time 20 -X POST -H "content-type: application/json" -d '{}' "$U/em/danh-sach"
echo "--- /ca/sua KHÔNG kèm mã bí mật (phải 403 = đường MỚI đã lên; 404 = bản cũ) ---"
curl -s -o /dev/null -w "ma HTTP = %{http_code}\n" --max-time 20 -X POST -H "content-type: application/json" -d '{"maCa":"TESTX"}' "$U/ca/sua"
echo "(405 = bản cũ vẫn chạy, phát hành chưa ăn)"

echo
echo "############ 3. ĐẨY APP LÊN GITHUB ############"
ssh -o BatchMode=yes -o ConnectTimeout=15 -T git@github.com 2>&1
git push origin may-chu-moi:main
B3=$?
echo "mã thoát = $B3"
if [ $B3 -eq 0 ]; then
  git branch -f main may-chu-moi
  echo ">>> ĐÃ ĐẨY. Xem dựng bản: https://github.com/dodaihoc4869/omr-app/actions"
else
  echo ">>> CHƯA ĐẨY ĐƯỢC — đọc lỗi ở trên. Worker vẫn đã lên bình thường."
fi

echo
echo "===== XONG $(date '+%F %T') ====="
