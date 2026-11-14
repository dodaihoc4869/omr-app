// Chỉ thêm bảng bộ đệm/receipt, không sửa điểm và sổ học.
export const SQL_DONG_CO_HANH_TRINH=[
  `CREATE TABLE IF NOT EXISTS hanh_trinh_v4_em(sbd TEXT PRIMARY KEY,cursor TEXT NOT NULL,phien_ban TEXT NOT NULL,mo_hinh_json TEXT NOT NULL,cap_nhat_luc INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS hanh_trinh_v4_canh(sbd TEXT NOT NULL,tu TEXT NOT NULL,den TEXT NOT NULL,n_co INTEGER NOT NULL,dung_co INTEGER NOT NULL,n_chua INTEGER NOT NULL,dung_chua INTEGER NOT NULL,cap_nhat_luc INTEGER NOT NULL,PRIMARY KEY(sbd,tu,den))`,
  `CREATE INDEX IF NOT EXISTS hanh_trinh_v4_canh_den ON hanh_trinh_v4_canh(den,cap_nhat_luc)`,
  `CREATE TABLE IF NOT EXISTS hanh_trinh_v4_can_thiep(sbd TEXT NOT NULL,ngay TEXT NOT NULL,moc INTEGER NOT NULL,qid TEXT NOT NULL,nhom TEXT NOT NULL,ky_nang TEXT NOT NULL,context TEXT NOT NULL,cach TEXT NOT NULL,xac_suat REAL NOT NULL,goi_luc INTEGER NOT NULL,dung_luc INTEGER,do_luc INTEGER,ket_qua INTEGER,do_receipt TEXT,PRIMARY KEY(sbd,ngay,moc),UNIQUE(sbd,do_receipt))`,
  `CREATE TABLE IF NOT EXISTS hanh_trinh_v4_chot(sbd TEXT NOT NULL,ngay TEXT NOT NULL,da_lam INTEGER NOT NULL,PRIMARY KEY(sbd,ngay))`,
  `CREATE INDEX IF NOT EXISTS hanh_trinh_v4_bandit ON hanh_trinh_v4_can_thiep(do_luc,context,cach)`,
  // 12/11 (G1 giảm chi phí D1): cạnh tiên quyết CẢ LỚP cộng sẵn — cron dựng lại ≤ 30 phút/lần (hanh-trinh-canh-lop.ts). Dòng mốc id=1: `luc` = lúc dựng (0 = chưa dựng).
  `CREATE TABLE IF NOT EXISTS hanh_trinh_v4_canh_lop(tu TEXT NOT NULL,den TEXT NOT NULL,n_co INTEGER NOT NULL,dung_co INTEGER NOT NULL,n_chua INTEGER NOT NULL,dung_chua INTEGER NOT NULL,so_em INTEGER NOT NULL,PRIMARY KEY(den,tu))`,
  `CREATE TABLE IF NOT EXISTS hanh_trinh_v4_canh_lop_moc(id INTEGER PRIMARY KEY CHECK(id=1),luc INTEGER NOT NULL)`,
  // 14/11 (hoá đơn D1): cạnh lớp GỘP theo kỹ năng đích — một dòng JSON / den (hanh-trinh-canh-lop.ts SQL_DUNG_CANH_LOP_DEN), dựng cùng lô với bảng trên.
  `CREATE TABLE IF NOT EXISTS hanh_trinh_v4_canh_lop_den(den TEXT PRIMARY KEY,j TEXT NOT NULL)`,
  // 12/11 (H3 đợt 3): bảng bandit (đúng / sai theo ngữ cảnh × cách cứu, 90 ngày) CẢ LỚP cộng sẵn — cron dựng lại ≤ 30 phút/lần (hanh-trinh-bandit-lop.ts).
  `CREATE TABLE IF NOT EXISTS hanh_trinh_v4_bandit_lop(context TEXT NOT NULL,cach TEXT NOT NULL,dung INTEGER NOT NULL,sai INTEGER NOT NULL,PRIMARY KEY(context,cach))`,
  `CREATE TABLE IF NOT EXISTS hanh_trinh_v4_bandit_lop_moc(id INTEGER PRIMARY KEY CHECK(id=1),luc INTEGER NOT NULL)`,
]
