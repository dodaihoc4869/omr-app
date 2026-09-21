-- CHỈ THÊM (21/09/2026): "GIAO THÊM BÀI CHO CON" của phụ huynh (`POST /ph/giao-them`, docs/hop-dong-ph-giao-them-2109.md mục 5). Lùi: DROP TABLE ph_giao_them (bài đã tạo nằm ở `mom_bai`, không mất).
-- MỘT dòng cho MỖI lượt THÀNH CÔNG (lượt bị từ chối không ghi). Đếm trần 3 lượt/ngày VN ở MÁY CHỦ: khoá duy nhất (sbd, ngay_vn, luot) + khoá theo phút (bấm đúp không tạo gói thứ hai).
CREATE TABLE IF NOT EXISTS ph_giao_them (
  khoa           TEXT PRIMARY KEY,   -- <sbd>|<ngày VN>|<phút yyyy-mm-ddThh:mm giờ UTC>
  sbd            TEXT NOT NULL,
  ngay_vn        TEXT NOT NULL,
  luot           INTEGER NOT NULL,   -- 1..3 trong ngày
  so_cau         INTEGER NOT NULL,   -- số câu GIAO thật (sau khi chọn qid)
  phut_uoc_tinh  INTEGER NOT NULL,
  thanh_phan_json TEXT NOT NULL,     -- [{loai, dang?, tenDang?, soCau}] đúng số giao thật
  ly_do_json     TEXT NOT NULL,      -- câu tiếng thường cho phụ huynh
  ma_mom         TEXT NOT NULL,      -- id bài trong mom_bai (giao_them_<ngày>_<lượt>)
  qid_json       TEXT NOT NULL,      -- thứ tự câu đã giao
  luc            TEXT NOT NULL,
  UNIQUE (sbd, ngay_vn, luot)
);
CREATE INDEX IF NOT EXISTS idx_ph_giao_them_ngay ON ph_giao_them(ngay_vn);
