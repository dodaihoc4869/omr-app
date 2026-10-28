-- SỬA XONG MỚI MỞ CHẶNG SAU (thầy 28/10 «Tôi muốn sửa phải xong mới hiện chặng sau»; server/src/tu-sua-viec-ngay.ts). CHỈ THÊM: một bảng mới.
-- Một dòng / em / ngày VN: lúc Lộ trình của em KHOÁ các chặng nằm sau nút Tự sửa lỗi (máy em báo nền khi em tới nút Sửa lỗi mà phần hôm nay chưa xong).
-- Máy chủ chỉ từ chối mở chặng mới (mã TU_SUA_TRUOC) khi có dòng này VÀ 12 câu của ngày (tu_sua_viec_ngay) còn câu chưa xong phần.
CREATE TABLE IF NOT EXISTS tu_sua_khoa_ngay (
  sbd     TEXT    NOT NULL,
  ngay_vn TEXT    NOT NULL,
  luc     INTEGER NOT NULL,
  PRIMARY KEY (sbd, ngay_vn)
);
