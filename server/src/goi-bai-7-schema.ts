export const SQL_GOI7: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS goi_bai_7 (id TEXT PRIMARY KEY,tick_id TEXT NOT NULL UNIQUE,lop TEXT NOT NULL,khoa_bai TEXT NOT NULL,ten TEXT NOT NULL,bat_dau TEXT NOT NULL,han TEXT NOT NULL,tao_luc TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS goi_bai_7_lop ON goi_bai_7(lop,bat_dau)`,
  `CREATE TABLE IF NOT EXISTS goi_bai_7_cau (goi_id TEXT NOT NULL,qid TEXT NOT NULL,version TEXT NOT NULL,ma_de TEXT NOT NULL,meta_json TEXT NOT NULL,PRIMARY KEY(goi_id,qid))`,
  `CREATE TABLE IF NOT EXISTS goi_bai_7_em (goi_id TEXT NOT NULL,sbd TEXT NOT NULL,bat_dau TEXT NOT NULL,han TEXT NOT NULL,PRIMARY KEY(goi_id,sbd))`,
  `CREATE INDEX IF NOT EXISTS goi_bai_7_em_sbd ON goi_bai_7_em(sbd,han)`,
  `CREATE TABLE IF NOT EXISTS goi_bai_7_gap (receipt TEXT PRIMARY KEY,goi_id TEXT NOT NULL,sbd TEXT NOT NULL,qid TEXT NOT NULL,version TEXT NOT NULL,kieu TEXT NOT NULL,luc TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS goi_bai_7_gap_em ON goi_bai_7_gap(goi_id,sbd,qid,version)`,
  `CREATE TABLE IF NOT EXISTS goi_bai_7_ngay (goi_id TEXT NOT NULL,sbd TEXT NOT NULL,ngay TEXT NOT NULL,quota INTEGER NOT NULL,PRIMARY KEY(goi_id,sbd,ngay))`,
  `CREATE TABLE IF NOT EXISTS goi_bai_7_chua (goi_id TEXT NOT NULL,qid TEXT NOT NULL,version TEXT NOT NULL,loi_go TEXT NOT NULL,luc TEXT NOT NULL,PRIMARY KEY(goi_id,qid,version))`,
  `CREATE TABLE IF NOT EXISTS goi_bai_7_kiem (id TEXT PRIMARY KEY,goi_id TEXT NOT NULL,sbd TEXT NOT NULL,ma_de TEXT NOT NULL,json TEXT NOT NULL,tao_luc TEXT NOT NULL,nop_luc TEXT,diem REAL)`,
  `CREATE INDEX IF NOT EXISTS goi_bai_7_kiem_em ON goi_bai_7_kiem(goi_id,sbd,nop_luc)`,
  // CHỈ THÊM 12/10 (thầy: "học sinh làm 24 câu nhưng lại báo 31 câu … hiển thị thật chính xác"): MỨC HÔM NAY của em ngày Gói 7 — chốt ở lần lập đầu
  // tiên trong ngày (`chotMucNgay7`, INSERT OR IGNORE), mọi màn em / thầy / phụ huynh đọc lại đúng số này. muc = max(toi_thieu_tang, quota).
  `CREATE TABLE IF NOT EXISTS goi_bai_7_muc_ngay (sbd TEXT NOT NULL,ngay TEXT NOT NULL,tang INTEGER NOT NULL,toi_thieu_tang INTEGER NOT NULL,quota INTEGER NOT NULL,muc INTEGER NOT NULL,luc TEXT NOT NULL,PRIMARY KEY(sbd,ngay))`,
  // Hạn thầy sửa: nhật ký chỉ-thêm, đồng thời là biên nhận cho giao dịch đổi hạn/tính lại kế hoạch.
  `CREATE TABLE IF NOT EXISTS goi_bai_7_sua_han (id TEXT PRIMARY KEY,goi_id TEXT NOT NULL,han_cu TEXT NOT NULL,han_moi TEXT NOT NULL,luc TEXT NOT NULL)`,
]
