-- ĐOÀN HỘ TỐNG (bước 5, 21/09/2026) — mồi hằng ngày: vé, rương chuỗi, mốc Đoàn lớp, Trùm lớp. CHỈ THÊM, chạy lại nhiều lần được.
-- Chưa chạy tệp này: game vẫn chơi được (mỗi ngày một chặng miễn phí), Sảnh chỉ không có số vé / rương / trùm lớp.
-- Lùi: DROP TABLE doan_trum_lop; DROP TABLE doan_ve_so;

-- SỔ VÉ chỉ-thêm. Số vé của em = SUM(so). Khoá chính là khoá idempotent → nạp lại sổ hai lần không cộng trùng:
--   <sbd>|dat|<ngày VN>            +2  đạt nhiệm vụ ngày      (đọc từ sổ EXP của Code 3, không tự tính lại)
--   <sbd>|lo|<mã bài>|<chỉ số lô>  +1  xong lô BTVN đúng nhịp (nt.)
--   <sbd>|ruong|<mốc>|<ngày VN>    +n  rương chuỗi 3 / 7 / 14 ngày (tất định theo sbd + ngày + mùa)
--   <sbd>|moc|<mùa>|<trạm>         +1  cả lớp tới mốc trạm (chỉ em đã góp sức trong mùa)
--   <sbd>|trum|<mùa>|<Chủ nhật>    +1  lớp hạ Trùm lớp (chỉ em đã góp sức tối đó)
--   <sbd>|tieu|<mã chặng>          −1  đi chặng thêm trong ngày (rời sảnh trước khi lên đường thì xoá dòng = hoàn vé)
CREATE TABLE IF NOT EXISTS doan_ve_so (
  khoa     TEXT PRIMARY KEY,
  sbd      TEXT NOT NULL,
  ngay_vn  TEXT NOT NULL,
  loai     TEXT NOT NULL,
  so       INTEGER NOT NULL,
  ma_nguon TEXT,
  luc      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS doan_ve_so_em ON doan_ve_so(sbd, ngay_vn);

-- ĐÓNG GÓP TRÙM LỚP: mỗi chặng THẮNG kết thúc trong khung Chủ nhật 20:00–20:20 (giờ VN) góp sát thương của em. Chỉ-thêm, đọc tổng theo lớp.
CREATE TABLE IF NOT EXISTS doan_trum_lop (
  khoa       TEXT PRIMARY KEY,       -- <mã chặng>|<sbd>
  lop        TEXT NOT NULL,
  chu_nhat   TEXT NOT NULL,          -- ngày VN của tối Chủ nhật ấy
  sbd        TEXT NOT NULL,
  sat_thuong INTEGER NOT NULL,
  luc        TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS doan_trum_lop_lop ON doan_trum_lop(lop, chu_nhat);
