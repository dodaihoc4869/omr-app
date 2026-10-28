-- TỰ SỬA LỖI THEO ĐỀ XUẤT (thầy duyệt 28/10; server/src/tu-sua-viec-ngay.ts). CHỈ THÊM: một bảng mới + một chỉ mục trên bảng lượt sửa gọn (bảng nhỏ).
-- Việc hôm nay của Tự sửa lỗi theo SBD + ngày VN: danh sách câu máy em đã chọn (muc_json) + khoá câu đã xong phần (xong_json) + số chặng thêm (them).
CREATE TABLE IF NOT EXISTS tu_sua_viec_ngay (
  sbd          TEXT    NOT NULL,
  ngay_vn      TEXT    NOT NULL,
  muc_json     TEXT    NOT NULL DEFAULT '[]',
  xong_json    TEXT    NOT NULL DEFAULT '[]',
  them         INTEGER NOT NULL DEFAULT 0,
  cap_nhat_luc INTEGER NOT NULL,
  PRIMARY KEY (sbd, ngay_vn)
);
-- Đợt em đã khép hôm nay + «Đã tự sửa hôm nay» đọc theo (sbd, ngày) — trước: quét cả bảng chua_gon_lan (chỉ có chỉ mục theo dot_id).
CREATE INDEX IF NOT EXISTS idx_cgl_em_ngay ON chua_gon_lan(sbd, ngay_vn);
