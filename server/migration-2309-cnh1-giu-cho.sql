-- CNH-1.0 (P05 mục 4) — GIỮ CHỖ CÂU THEO LƯỢT, có UNIQUENESS + CAS.
--
-- VÌ SAO: 04 §4.1/§5 yêu cầu giữ chỗ (reservation) bằng SQL có khoá duy nhất để hai lượt/máy không
-- nhận cùng một câu; lượt THUA chỉ được chọn lại phần CHƯA chốt, không được "chiếm lại" câu người khác.
-- Trước bản này repo không có bảng giữ chỗ nào (đã kiểm: không có `giu_cho`/`reservation`).
--
-- LUẬT (khoá bằng tests/cnh-1-0-giu-cho.test.ts):
--   · PK `(sbd, ngay, qid)` ⇒ MỘT câu chỉ thuộc một lượt trong một ngày của một em.
--   · Thắng chỗ = `INSERT OR IGNORE` có `meta.changes = 1`; `changes = 0` nghĩa là ĐÃ có người giữ.
--   · Giữ chỗ có HẠN (`lease_until`, ms): hết hạn thì lượt khác được tiếp quản bằng UPDATE có điều kiện
--     `lease_until < ?` (CAS) — vẫn là một câu lệnh nguyên tử, không đọc-rồi-ghi.
--   · Bảng chỉ là TRẠNG THÁI ĐANG CHẠY của ngày ⇒ reset toàn app XOÁ (xem BANG_XOA).
-- THÊM BẢNG THUẦN (không DROP, không sửa cột cũ).
CREATE TABLE IF NOT EXISTS giu_cho (
  sbd         TEXT NOT NULL,
  ngay        TEXT NOT NULL,
  qid         TEXT NOT NULL,
  task_id     TEXT NOT NULL,
  nguon       TEXT NOT NULL DEFAULT '',
  lease_until INTEGER NOT NULL,
  cap_nhat_luc TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (sbd, ngay, qid)
);
CREATE INDEX IF NOT EXISTS giu_cho_han ON giu_cho(ngay, lease_until);
