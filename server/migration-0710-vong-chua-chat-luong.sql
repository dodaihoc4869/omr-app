-- Chỉ thêm; chạy sau migration-0710-chua-cau-sai.sql qua sổ migration D1.
ALTER TABLE chua_loi_dot ADD COLUMN ly_do_thieu TEXT NOT NULL DEFAULT '';
ALTER TABLE chua_loi_dot ADD COLUMN giao_luc INTEGER NOT NULL DEFAULT 0;
ALTER TABLE chua_loi_dot ADD COLUMN chot_do_luc INTEGER NOT NULL DEFAULT 0;
ALTER TABLE chua_loi_dot ADD COLUMN ho_tro_cuoi_luc INTEGER NOT NULL DEFAULT 0;
ALTER TABLE chua_loi_dot ADD COLUMN ket_qua_gap2 TEXT NOT NULL DEFAULT '';
ALTER TABLE chua_loi_dot ADD COLUMN receipt_gap2 TEXT NOT NULL DEFAULT '';
ALTER TABLE chua_loi_phien ADD COLUMN snapshot_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE chua_loi_item ADD COLUMN tieu_de TEXT NOT NULL DEFAULT '';
ALTER TABLE chua_loi_item ADD COLUMN cap_nhat_luc INTEGER NOT NULL DEFAULT 0;
ALTER TABLE chua_loi_item ADD COLUMN muc_ho_tro_cao_nhat INTEGER NOT NULL DEFAULT 0;
ALTER TABLE chua_loi_nop ADD COLUMN request_hash TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_cln_dot_luc ON chua_loi_nop(dot_id, nop_luc);
CREATE INDEX IF NOT EXISTS idx_cli_dot_trang ON chua_loi_item(dot_id, sbd, trang_thai);
CREATE INDEX IF NOT EXISTS idx_cld_giao ON chua_loi_dot(cohort_id, chot_do_luc, ket_qua_gap2);
CREATE TABLE IF NOT EXISTS chua_loi_thay (
  dot_id TEXT PRIMARY KEY REFERENCES chua_loi_dot(id), sbd TEXT NOT NULL,
  qid TEXT NOT NULL, bang_chung_json TEXT NOT NULL,
  trang_thai TEXT NOT NULL DEFAULT 'cho_thay', gui_luc INTEGER NOT NULL,
  xu_ly_luc INTEGER
);
CREATE TABLE IF NOT EXISTS chua_loi_trai_nghiem (
  khoa TEXT PRIMARY KEY, sbd TEXT NOT NULL, dot_id TEXT NOT NULL,
  loai TEXT NOT NULL, gia_tri TEXT NOT NULL DEFAULT '', luc INTEGER NOT NULL
);

-- Cùng lược đồ đường Hỏi thầy; cài mới cũng có lịch sử hỗ trợ.
CREATE TABLE IF NOT EXISTS loi_giai_hoi (sbd TEXT NOT NULL, qid TEXT NOT NULL, nguon TEXT, luc TEXT NOT NULL, co_ho_so INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(sbd,qid,luc));
CREATE INDEX IF NOT EXISTS idx_lg_hoi_em_cau_luc ON loi_giai_hoi(sbd,qid,luc);
-- Receipt nối Tu luyện: giúp retry phục hồi sổ chung từ kết quả đã khoá.
CREATE TABLE IF NOT EXISTS chua_loi_tu_receipt (
  luot_id TEXT NOT NULL, qid TEXT NOT NULL, sbd TEXT NOT NULL,
  luc INTEGER NOT NULL, assistance TEXT NOT NULL, raw_json TEXT NOT NULL,
  PRIMARY KEY(luot_id,qid)
);
ALTER TABLE chua_loi_thay ADD COLUMN loi_go TEXT NOT NULL DEFAULT '';
ALTER TABLE chua_loi_thay ADD COLUMN doc_luc INTEGER NOT NULL DEFAULT 0;
