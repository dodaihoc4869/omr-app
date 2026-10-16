// DDL thuần để runner áp trước Worker; không kéo AI/game hay chạy migration ở đường mở app.
export const SQL_HOI_THAY_KIEM: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS hoi_thay_kiem (id TEXT PRIMARY KEY,sbd TEXT NOT NULL,qid_goc TEXT NOT NULL,nhom_goc TEXT NOT NULL,version_goc TEXT NOT NULL,qid_kiem TEXT NOT NULL,version_kiem TEXT NOT NULL,khoa_noi_dung TEXT NOT NULL,snapshot_json TEXT NOT NULL,assistance TEXT NOT NULL,trang_thai TEXT NOT NULL DEFAULT 'dang_lam',phat_luc INTEGER NOT NULL,het_han_luc INTEGER NOT NULL,nop_luc INTEGER,tra_loi TEXT,dung INTEGER,attempt_id TEXT,request_hash TEXT,response_json TEXT,den_han INTEGER,revision INTEGER NOT NULL DEFAULT 0)`,
  'CREATE INDEX IF NOT EXISTS htk_em_goc ON hoi_thay_kiem(sbd,qid_goc,phat_luc DESC)',
  'CREATE INDEX IF NOT EXISTS htk_em_han ON hoi_thay_kiem(sbd,den_han)',
  "CREATE UNIQUE INDEX IF NOT EXISTS htk_mot_cau_mo ON hoi_thay_kiem(sbd,qid_goc) WHERE trang_thai='dang_lam'",
  'CREATE UNIQUE INDEX IF NOT EXISTS htk_lan_nop ON hoi_thay_kiem(sbd,attempt_id) WHERE attempt_id IS NOT NULL',
]
