-- Tối ưu 08/10: index (ma_ca, sbd) cho query ghiSuKienThi khi thầy chấm ca thi cả lớp.
-- Query: SELECT sbd, lan_thu, nop_luc FROM luot WHERE ma_ca = ? AND sbd IN (...) AND nop_luc IS NOT NULL
-- Index cũ idx_luot_ca_tt(ma_ca, trang_thai, het_gio_luc) không cover sbd — quét toàn bảng theo ma_ca.
CREATE INDEX IF NOT EXISTS idx_luot_ca_sbd ON luot(ma_ca, sbd, lan_thu, nop_luc);
