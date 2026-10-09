export const SQL_HT6=[
  `CREATE TABLE IF NOT EXISTS hanh_trinh_v6_chon(sbd TEXT NOT NULL,ngay TEXT NOT NULL,moc INTEGER NOT NULL,qid TEXT NOT NULL,version TEXT NOT NULL,nhom TEXT NOT NULL,lop TEXT NOT NULL,tang INTEGER NOT NULL,phan TEXT NOT NULL,kn_json TEXT NOT NULL,p_truoc REAL NOT NULL,features_json TEXT NOT NULL,prop REAL NOT NULL,tao_luc INTEGER NOT NULL,diagnostic INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(sbd,ngay,moc,qid))`,
  `CREATE TABLE IF NOT EXISTS hanh_trinh_v6_do(sbd TEXT NOT NULL,receipt TEXT NOT NULL,qid TEXT NOT NULL,version TEXT NOT NULL,lop TEXT NOT NULL,tang INTEGER NOT NULL,phan TEXT NOT NULL,p_truoc REAL NOT NULL,y REAL NOT NULL,features_json TEXT NOT NULL,prop REAL NOT NULL,luc INTEGER NOT NULL,ms INTEGER,transfer REAL,transfer_receipt TEXT,source_json TEXT NOT NULL,transfer_source_json TEXT NOT NULL,nhac_lai REAL,nhac_receipt TEXT,nhac_source_json TEXT NOT NULL,PRIMARY KEY(sbd,receipt),UNIQUE(sbd,transfer_receipt))`,
  `CREATE TABLE IF NOT EXISTS hanh_trinh_v6_fit(khoa TEXT PRIMARY KEY,mo_hinh_json TEXT NOT NULL,so_mau INTEGER NOT NULL,luc INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS hanh_trinh_v6_chon_em ON hanh_trinh_v6_chon(sbd,tao_luc)`,
  `CREATE INDEX IF NOT EXISTS hanh_trinh_v6_do_luc ON hanh_trinh_v6_do(luc)`,
] as const
