-- CHỮA CÂU GỌN (thầy 25/10, docs/de-xuat-chua-cau-gon-2510.md; server/src/chua-gon-lenh.ts). CHỈ THÊM: một bảng mới, không đụng bảng cũ.
-- Mỗi dòng = một lần em nộp ở màn sửa câu gọn. `khoa` do máy em sinh (bấm lặp ⇒ trả lại đúng kết quả cũ). Trần 2 lần / đợt / ngày VN (chốt trong cùng câu INSERT).
CREATE TABLE IF NOT EXISTS chua_gon_lan (
  khoa     TEXT    PRIMARY KEY,
  dot_id   TEXT    NOT NULL,
  sbd      TEXT    NOT NULL,
  ngay_vn  TEXT    NOT NULL,
  lan      INTEGER NOT NULL,
  ban      TEXT    NOT NULL,
  tra_loi  TEXT    NOT NULL DEFAULT '',
  dung     INTEGER NOT NULL,
  ket      TEXT    NOT NULL,
  luc      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS chua_gon_lan_dot ON chua_gon_lan(dot_id, sbd, ngay_vn);
