-- CHỈ THÊM (19/09/2026): ĐẾM TRUY CẬP CỦA PHỤ HUYNH — token hay SBD trần (TOKEN PHỤ HUYNH, câu chốt 9, giai đoạn MỀM).
--
-- Cổng phụ huynh từ trước tới nay gọi `/parent-news/*`, `/mom/create|parent-list` bằng SBD TRẦN: ai biết SBD của em nào cũng đọc được tiến bộ và giao bài cho em ấy. Giai đoạn
-- MỀM: máy chủ nhận CẢ token (`pass`, cùng token `parentPass` của game) lẫn SBD trần và ghi lại mỗi cái được dùng bao nhiêu, để thầy biết còn bao nhiêu phụ huynh CHƯA có liên kết
-- trước khi tự quyết giai đoạn CỨNG. KHÔNG có công tắc nào tự chuyển sang cứng.
--
--   ngay  ngày VN · sbd  con của phụ huynh · kieu  token | sbd_tran · duong  parent-news | mom | ph-ke-hoach | ph-thoi-gian-hoc | ph-xac-dinh · so  số lượt gọi
-- Chỉ THÊM dòng/cộng dồn; bảng thuộc nhóm GIỮ của reset 21/09 (số đếm để quyết định giai đoạn cứng). Chưa chạy migration thì đếm bị bỏ qua, đường cũ chạy như trước.
CREATE TABLE IF NOT EXISTS ph_truy_cap (
  ngay  TEXT NOT NULL,
  sbd   TEXT NOT NULL,
  kieu  TEXT NOT NULL,
  duong TEXT NOT NULL,
  so    INTEGER NOT NULL DEFAULT 1,
  luc   TEXT NOT NULL,
  PRIMARY KEY (ngay, sbd, kieu, duong)
);
