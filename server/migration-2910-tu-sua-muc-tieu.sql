-- SỬA LỖI 12–36 CÂU/NGÀY (thầy 29/10; server/src/sua-loi-phan-bo.ts). CHỈ THÊM: một bảng nhỏ.
-- Một dòng / em / ngày VN: số câu MỤC TIÊU của phần ngày (13…36) máy chủ đã lập lúc đầu ngày — khoá chặng sau Sửa lỗi (tu_sua_khoa_ngay) đếm theo số này.
-- Không có dòng ⇒ 12 câu như trước. Chỉ tăng trong ngày (MAX).
CREATE TABLE IF NOT EXISTS tu_sua_muc_tieu_ngay (
  sbd      TEXT    NOT NULL,
  ngay_vn  TEXT    NOT NULL,
  muc_tieu INTEGER NOT NULL,
  PRIMARY KEY (sbd, ngay_vn)
);
