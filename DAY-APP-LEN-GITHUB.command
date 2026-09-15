#!/bin/bash
# ĐẨY BẢN APP MỚI LÊN GITHUB → GitHub Actions tự dựng và phát hành lên Pages.
# Nhấp đúp là chạy.
#
# Lần này GHI TOÀN BỘ vào _day-app.log để đọc lại được, và GIỮ CỬA SỔ MỞ
# cho tới khi bấm phím — lần trước cửa sổ đóng ngay nên không ai thấy lỗi.
#
# LÙI BẢN PHÁT HÀNH nếu có gì sai:
#     cd "/Volumes/SSD NGOÀI/omr-app" && git revert --no-edit 62dcaad && git push
cd "$(dirname "$0")" || exit 1

{
  echo "===== $(date '+%F %T') ====="
  echo "Kho mã: $(pwd)"
  rm -f .git/index.lock .git/HEAD.lock 2>/dev/null
  rm -rf .git/rac-khoa 2>/dev/null

  echo
  echo "--- Commit sẽ đẩy ---"
  git log --oneline -1
  echo
  echo "--- Kiểm khoá SSH tới GitHub ---"
  ssh -o BatchMode=yes -o ConnectTimeout=15 -T git@github.com 2>&1
  echo "(dòng 'Hi <tên>! You've successfully authenticated' = khoá ổn;"
  echo " 'Permission denied (publickey)' = máy này chưa có khoá SSH cho GitHub)"
  echo
  echo "--- Đẩy ---"
  git push origin main 2>&1
  KQ=$?
  echo
  echo "--- Kết quả ---"
  echo "mã thoát git push = $KQ"
  echo "HEAD      = $(git rev-parse --short HEAD)"
  echo "origin/main = $(git rev-parse --short origin/main 2>/dev/null)"
  if [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main 2>/dev/null)" ]; then
    echo ">>> ĐÃ ĐẨY XONG."
    echo ">>> Xem dựng bản: https://github.com/dodaihoc4869/omr-app/actions"
  else
    echo ">>> CHƯA ĐẨY ĐƯỢC — đọc phần lỗi ở trên."
  fi
} 2>&1 | tee _day-app.log

echo
echo "Đã ghi lại vào: $(pwd)/_day-app.log"
echo "Bấm phím bất kỳ để đóng cửa sổ."
read -n 1 -s
