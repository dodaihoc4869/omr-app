# Việc Claude giao cho Codex

Cách dùng tệp này: xem `AGENTS.md` mục 2. Mục mới nhất nằm ở cuối.

Mỗi mục ghi:
- việc cần làm;
- tệp liên quan;
- cách nghiệm thu.

Codex đổi `[ ]` thành `[x]` hoặc `[!]` ngay trong PR của mình.

## 13/10 — sau khi gộp PR258 (kiểm tra cá nhân) và PR259 (đợt 19)
Thầy đã chuyển bốn việc này cho Codex trên máy thầy ngày 13/10. Codex làm xong thì đánh dấu.

- [x] **Xác nhận thoả thuận.** PR262 — đã đọc và xác nhận trong Nhật ký; đồng ý hợp đồng.
  - Đọc `docs/hop-dong-claude-codex-1310.md`.
  - Ghi một dòng Nhật ký "đã đọc hop-dong-claude-codex-1310".
  - Chỗ chưa đồng ý thì viết vào mục 5 "Ý kiến".
- [x] **Sửa 26 test đỏ do PR258 sinh ra.** PR262 — 74/74 liên quan; so full theo tên + kiểm lại cùng main: 0 lỗi mới còn tái hiện. Chúng đỏ trên `main` 12ab2be3, trước khi gộp đợt 19. Các tệp:
  - `goi-len-bang-to-chieu-cham`: bản giả thiếu `getState` / `luuBuoiChua`;
  - `chua-bai-1210b`: thứ tự mới có chủ đích, kèm luật mới ≥ 5 em;
  - `goi-len-bang-lich-su-cau`;
  - `hop-thoai-app`: gọi `confirm()` thô;
  - `nhip-bang`: `setInterval` trong `ManKiemTraCaNhan`.

  Test đổi có chủ đích thì ghi chú "SỬA CÓ CHỦ ĐÍCH 13/10" kèm lý do. Không `skip`. Nghiệm thu: toàn bộ vitest so theo tên với `main` có 0 test đỏ mới, và 26 test này xanh.
- [x] **`TheKiemTraCon` dùng khung thẻ của trang phụ huynh mới.** PR262 — PH3/3, Chromium6tổ hợp0JS/0tràn, màu0.
  - Đổi lớp `ph3-ah` cũ sang `tvc-the` (xem `src/components/ph-v3/TrangVeCon.tsx`).
  - Giữ nguyên luồng:
    - ngày kiểm tra thì thẻ thay khối Hôm nay;
    - ngày khác thì hiện lịch sắp tới;
    - `cho_nguon` thì ẩn.
  - Nghiệm thu: `tests/ph-kiem-tra-dot19-1310.test.tsx` 3/3 xanh; `npm run kiem:mau-giu` 0.
- [x] **Cổng trước khi gộp.** PR262 — frontend/serverTS, build/tốc độ0đỏ, SW13/13, màu0; đã gộp main e4f69136, không có deploy đang chạy trước mở PR. Xem docs/ket-qua-hop-dong-claude-1310.md; chờ Claude soát, chưa phát hành.
  - Chạy đủ các cổng ở `AGENTS.md` mục 3.
  - Mở PR vào `main`, thân PR liệt kê kết quả từng cổng.
