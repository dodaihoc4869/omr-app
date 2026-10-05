-- HỌC PHÍ (thầy 05/10, server/src/hoc-phi.ts) — CHỈ THÊM. Máy chủ cũng tự tạo lần đầu dùng; tệp này để D1 thật có bảng sẵn.
-- hoc_phi: mức phải nộp RIÊNG (khác 4.500.000 đ chuẩn) + ghi chú. Không có dòng ⇒ mức chuẩn.
-- hoc_phi_nop: mỗi lần nộp một dòng; đã nộp = tổng.
CREATE TABLE IF NOT EXISTS hoc_phi (sbd TEXT PRIMARY KEY, phai_nop INTEGER NOT NULL, ghi_chu TEXT, cap_nhat_luc TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS hoc_phi_nop (id TEXT PRIMARY KEY, sbd TEXT NOT NULL, so_tien INTEGER NOT NULL, ngay_vn TEXT NOT NULL, ghi_chu TEXT, nguon TEXT NOT NULL, luc TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_hoc_phi_nop_sbd ON hoc_phi_nop(sbd);
