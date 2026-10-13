-- Chỉ-thêm: kiểm tra có lịch riêng từng học sinh. Không bật cờ ở migration.
CREATE TABLE IF NOT EXISTS kiem_tra_ca_nhan (id TEXT PRIMARY KEY,sbd TEXT NOT NULL,lop TEXT NOT NULL,ngay TEXT NOT NULL,mo_luc INTEGER NOT NULL,han_luc INTEGER NOT NULL,trang_thai TEXT NOT NULL,json TEXT NOT NULL,tra_json TEXT NOT NULL DEFAULT '{}',revision INTEGER NOT NULL DEFAULT 0,nop_luc INTEGER,diem REAL,da_ghi INTEGER NOT NULL DEFAULT 0,cap_nhat_luc INTEGER NOT NULL,UNIQUE(sbd,ngay));
CREATE INDEX IF NOT EXISTS ktcn_em_ngay ON kiem_tra_ca_nhan(sbd,ngay);
CREATE INDEX IF NOT EXISTS ktcn_lich ON kiem_tra_ca_nhan(trang_thai,ngay,cap_nhat_luc);
CREATE TABLE IF NOT EXISTS kiem_tra_ca_nhan_chang (bai_id TEXT NOT NULL,stt INTEGER NOT NULL,bat_dau INTEGER NOT NULL,han INTEGER NOT NULL,chot_luc INTEGER,PRIMARY KEY(bai_id,stt));
CREATE TABLE IF NOT EXISTS kiem_tra_ca_nhan_dieu_phoi (sbd TEXT PRIMARY KEY,lop TEXT NOT NULL,thu_luc INTEGER NOT NULL,loi TEXT NOT NULL DEFAULT '');
