// Chỉ thêm dữ liệu dẫn xuất/phân nhóm đo lường, không thay điểm/sổ học.
export const SQL_HANH_TRINH_V5=[
  `CREATE TABLE IF NOT EXISTS hanh_trinh_v5_muc(sbd TEXT NOT NULL,pham_vi TEXT NOT NULL,phien_ban TEXT NOT NULL,muc_json TEXT NOT NULL,tien_do_json TEXT NOT NULL,cap_nhat_luc INTEGER NOT NULL,PRIMARY KEY(sbd,pham_vi))`,
  `CREATE TABLE IF NOT EXISTS hanh_trinh_v5_phan_nhom(thu_nghiem TEXT NOT NULL,sbd TEXT NOT NULL,nhom TEXT NOT NULL CHECK(nhom IN ('A','B')),tang_phan TEXT NOT NULL,bat_dau INTEGER NOT NULL,diem_dau REAL,ma_tran_dau TEXT,pham_vi TEXT NOT NULL,PRIMARY KEY(thu_nghiem,sbd))`,
  `CREATE TABLE IF NOT EXISTS hanh_trinh_v5_quyet_dinh(sbd TEXT NOT NULL,ngay TEXT NOT NULL,moc INTEGER NOT NULL,phien_ban TEXT NOT NULL,nhom TEXT NOT NULL,qids_json TEXT NOT NULL,vai_json TEXT NOT NULL,phut_du_kien REAL NOT NULL,tao_luc INTEGER NOT NULL,PRIMARY KEY(sbd,ngay,moc,tao_luc))`,
  `CREATE TABLE IF NOT EXISTS hanh_trinh_v5_de_thu(id TEXT PRIMARY KEY,sbd TEXT NOT NULL,thu_nghiem TEXT NOT NULL,nhom TEXT NOT NULL,pham_vi TEXT NOT NULL,ma_tran TEXT NOT NULL,qids_json TEXT NOT NULL,tao_luc INTEGER NOT NULL,doc_lap INTEGER NOT NULL CHECK(doc_lap IN(0,1)))`,
  `CREATE INDEX IF NOT EXISTS hanh_trinh_v5_de_thu_em ON hanh_trinh_v5_de_thu(sbd,tao_luc)`,
  `CREATE INDEX IF NOT EXISTS hanh_trinh_v5_nhom_tang ON hanh_trinh_v5_phan_nhom(thu_nghiem,tang_phan,nhom)`,
]
export const KHONG_CA_HT5="NOT EXISTS(SELECT 1 FROM ca WHERE trang_thai='mo')"
