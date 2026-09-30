-- TU LUYỆN v3 (30/09/2026) — CHỈ-THÊM. Máy chủ cũng tự dựng hai bảng này tại chỗ (server/src/tu-luyen-cau-sai.ts `SQL_BANG_KHAC_PHUC`,
-- y hệt tệp này; test khoá) vì CI deploy không chạy migration.
--
-- tu_luyen_khac_phuc: ÔN CÁCH QUÃNG cho câu trong kho câu sai của em. Đúng lần 1 ⇒ so_dung_lien 1 + hen_lai (≥ 1 ngày);
--   đúng lần 2 liên tiếp ở ngày khác ⇒ da_khac_phuc_luc (rời kho); sai lại ⇒ về 0. Khoá (sbd, qid).
-- tu_luyen_cham_cau: "Chấm từng câu" — câu đã chấm trong lượt đang làm (khoá, không sửa được); lúc nộp dùng đúng câu trả lời đã chấm.
CREATE TABLE IF NOT EXISTS tu_luyen_khac_phuc (
  sbd TEXT NOT NULL,
  qid TEXT NOT NULL,
  so_dung_lien INTEGER NOT NULL DEFAULT 0,
  lan_cuoi INTEGER NOT NULL DEFAULT 0,
  hen_lai INTEGER,
  da_khac_phuc_luc INTEGER,
  PRIMARY KEY (sbd, qid)
);
CREATE TABLE IF NOT EXISTS tu_luyen_cham_cau (
  luot_id TEXT NOT NULL,
  sbd TEXT NOT NULL,
  qid TEXT NOT NULL,
  tra_loi TEXT NOT NULL DEFAULT '',
  dung INTEGER NOT NULL DEFAULT 0,
  diem REAL NOT NULL DEFAULT 0,
  luc INTEGER NOT NULL,
  PRIMARY KEY (luot_id, qid)
);
