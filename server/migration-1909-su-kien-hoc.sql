-- GĐ 0 — SỔ SỰ KIỆN HỌC (DE-XUAT-CA-NHAN-HOA-1909.md mục 1.1).
--
-- Mỗi dòng = MỘT lần em làm MỘT câu, ở bất kỳ nguồn nào (ca thi, BTVN, khắc
-- phục, bài Mom, lên bảng, game, luyện đề). Chỉ THÊM, không bao giờ sửa/xoá
-- (trừ đường chấm lại ca thi, xem su-kien-hoc.ts). Đây là nguồn duy nhất để
-- dựng hồ sơ nắm kiến thức ở GĐ 1.
--
-- Chỉ THÊM bảng mới: không đụng cột hay bảng nào đang chạy. Mã máy chủ có
-- phòng vệ nếu quên chạy file này (ghi sổ báo lỗi, KHÔNG làm hỏng lượt nộp).
--
--   khoa     nguon|ma_nguon|sbd|qid|lan          (idempotent: ghi lại = không thêm dòng)
--   ket_qua  1 = đúng · 0 = sai · NULL = bỏ trống / chưa làm (KHÔNG cộng lần sai)
--   ma_dang  chỉ có khi nguồn biết chắc (game); còn lại NULL, GĐ 1 tra theo qid
--   ngay_vn  ngày lịch Việt Nam (+07:00) của `luc`, để đếm "đúng cùng ngày = 1 mốc"
CREATE TABLE IF NOT EXISTS su_kien_hoc (
  khoa      TEXT PRIMARY KEY,
  sbd       TEXT NOT NULL,
  qid       TEXT NOT NULL,
  nguon     TEXT NOT NULL,
  ma_nguon  TEXT NOT NULL,
  lan       INTEGER NOT NULL DEFAULT 1,
  ket_qua   INTEGER,
  giay      INTEGER,
  luc       TEXT NOT NULL,
  ngay_vn   TEXT NOT NULL,
  ma_dang   TEXT,
  chuyen_de TEXT,
  muc_do    TEXT
);
CREATE INDEX IF NOT EXISTS idx_skh_em_ngay ON su_kien_hoc(sbd, ngay_vn);
CREATE INDEX IF NOT EXISTS idx_skh_em_qid  ON su_kien_hoc(sbd, qid);
CREATE INDEX IF NOT EXISTS idx_skh_nguon   ON su_kien_hoc(nguon, ma_nguon);
