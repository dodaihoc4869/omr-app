-- LỜI GIẢI TỪNG BƯỚC (phương án A, thầy chốt 29/09/2026) — CHỈ THÊM 3 bảng, không đụng bảng có sẵn.
-- Máy chủ TỰ DỰNG các bảng này lúc chạy (server/src/loi-giai.ts · damBaoBangLoiGiai) vì CI không chạy migration;
-- tệp này là bản ghi + để chạy tay nếu muốn: cd server && npx wrangler d1 execute omr --file=migration-2909-loi-giai.sql --remote -y
CREATE TABLE IF NOT EXISTS loi_giai (bam TEXT PRIMARY KEY, qid_mau TEXT NOT NULL, dang TEXT NOT NULL, bo TEXT, lop TEXT, tang TEXT, trang_thai TEXT NOT NULL, so_co_dap_an INTEGER NOT NULL DEFAULT 0, co_json TEXT, r2_khoa TEXT NOT NULL, soan_luc TEXT NOT NULL, duyet_luc TEXT, ghi_chu TEXT);
CREATE INDEX IF NOT EXISTS loi_giai_trang_thai ON loi_giai(trang_thai);
CREATE TABLE IF NOT EXISTS loi_giai_cau (qid TEXT PRIMARY KEY, bam TEXT NOT NULL, ma_de TEXT NOT NULL, dang TEXT NOT NULL, lop TEXT, bo TEXT, cap_nhat_luc TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS loi_giai_cau_bam ON loi_giai_cau(bam);
CREATE INDEX IF NOT EXISTS loi_giai_cau_de ON loi_giai_cau(ma_de);
CREATE TABLE IF NOT EXISTS loi_giai_viec (bam TEXT PRIMARY KEY, qid TEXT NOT NULL, ma_de TEXT NOT NULL, dang TEXT NOT NULL, lop TEXT, bo TEXT, tang TEXT, uu_tien INTEGER NOT NULL DEFAULT 0, trang_thai TEXT NOT NULL, so_lan INTEGER NOT NULL DEFAULT 0, ma_luot TEXT, nhan_luc TEXT, loi TEXT, tao_luc TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS loi_giai_viec_hang ON loi_giai_viec(trang_thai, bo, uu_tien);
