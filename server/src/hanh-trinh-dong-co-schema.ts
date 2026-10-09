// Chỉ thêm bảng bộ đệm/receipt, không sửa điểm và sổ học.
export const SQL_DONG_CO_HANH_TRINH=[
  `CREATE TABLE IF NOT EXISTS hanh_trinh_v4_em(sbd TEXT PRIMARY KEY,cursor TEXT NOT NULL,phien_ban TEXT NOT NULL,mo_hinh_json TEXT NOT NULL,cap_nhat_luc INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS hanh_trinh_v4_canh(sbd TEXT NOT NULL,tu TEXT NOT NULL,den TEXT NOT NULL,n_co INTEGER NOT NULL,dung_co INTEGER NOT NULL,n_chua INTEGER NOT NULL,dung_chua INTEGER NOT NULL,cap_nhat_luc INTEGER NOT NULL,PRIMARY KEY(sbd,tu,den))`,
  `CREATE INDEX IF NOT EXISTS hanh_trinh_v4_canh_den ON hanh_trinh_v4_canh(den,cap_nhat_luc)`,
  `CREATE TABLE IF NOT EXISTS hanh_trinh_v4_can_thiep(sbd TEXT NOT NULL,ngay TEXT NOT NULL,moc INTEGER NOT NULL,qid TEXT NOT NULL,nhom TEXT NOT NULL,ky_nang TEXT NOT NULL,context TEXT NOT NULL,cach TEXT NOT NULL,xac_suat REAL NOT NULL,goi_luc INTEGER NOT NULL,dung_luc INTEGER,do_luc INTEGER,ket_qua INTEGER,do_receipt TEXT,PRIMARY KEY(sbd,ngay,moc),UNIQUE(sbd,do_receipt))`,
  `CREATE TABLE IF NOT EXISTS hanh_trinh_v4_chot(sbd TEXT NOT NULL,ngay TEXT NOT NULL,da_lam INTEGER NOT NULL,PRIMARY KEY(sbd,ngay))`,
  `CREATE INDEX IF NOT EXISTS hanh_trinh_v4_bandit ON hanh_trinh_v4_can_thiep(do_luc,context,cach)`,
]
