-- 28/10 — CHỈ-THÊM (thử tải 270 em). Bản sao lệnh tạo bảng lúc chạy (chayDdlMotLan) để D1 mới / bộ test có sẵn bảng.
-- Prior lớp tính sẵn theo em (omni-d1.ts `priorChoNhieuEm` / cron đêm bước 'prior').
CREATE TABLE IF NOT EXISTS omni_prior_em (sbd TEXT NOT NULL, moc TEXT NOT NULL, khoa TEXT NOT NULL, json TEXT NOT NULL, PRIMARY KEY (sbd, moc, khoa));
-- Bản chụp kho câu dùng chung (kho-chung.ts).
CREATE TABLE IF NOT EXISTS kho_chup (khoa TEXT NOT NULL, phan INTEGER NOT NULL, dau TEXT NOT NULL, luc INTEGER NOT NULL, json TEXT NOT NULL, PRIMARY KEY (khoa, phan));
-- Bản gọn điểm kỹ năng của em (diem-gon.ts).
CREATE TABLE IF NOT EXISTS omni_p_gon (sbd TEXT PRIMARY KEY, moc TEXT NOT NULL, json TEXT NOT NULL);
