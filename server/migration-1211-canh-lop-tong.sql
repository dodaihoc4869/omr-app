-- 12/11 (G1 giảm chi phí D1): cạnh tiên quyết cả lớp cộng sẵn bằng cron (server/src/hanh-trinh-canh-lop.ts). CHỈ THÊM.
-- Trước: mỗi lần lập kế hoạch cộng lại từ hanh_trinh_v4_canh (~14.088 hàng đọc/lượt × 11.606 lượt/ngày ≈ 163 triệu hàng).
CREATE TABLE IF NOT EXISTS hanh_trinh_v4_canh_lop(tu TEXT NOT NULL,den TEXT NOT NULL,n_co INTEGER NOT NULL,dung_co INTEGER NOT NULL,n_chua INTEGER NOT NULL,dung_chua INTEGER NOT NULL,so_em INTEGER NOT NULL,PRIMARY KEY(den,tu));
CREATE TABLE IF NOT EXISTS hanh_trinh_v4_canh_lop_moc(id INTEGER PRIMARY KEY CHECK(id=1),luc INTEGER NOT NULL);
