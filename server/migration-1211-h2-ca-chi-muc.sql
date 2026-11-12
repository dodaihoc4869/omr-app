-- 12/11 23:30 (đợt 3 H2): RIÊNG hai chỉ mục bảng ca (bảng nhỏ, chỉ-thêm) chạy đêm nay; phần còn lại của migration-z-1211-h2-goi-nhieu.sql (bảng dấu + trigger) chạy ban ngày 13/11.
CREATE INDEX IF NOT EXISTS idx_ca_trang_thai ON ca(trang_thai);
CREATE INDEX IF NOT EXISTS idx_ca_bao_ve ON ca(ma_ca) WHERE trang_thai<>'da_xoa' AND (trang_thai<>'dong' OR COALESCE(cong_bo,'') NOT IN ('ngay','ca_lop_xong'));
