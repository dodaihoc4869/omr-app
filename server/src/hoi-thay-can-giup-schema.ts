// Bảng riêng, chỉ-thêm. Không thêm chỉ mục vào sổ học đang phục vụ ca thi.
export const SQL_HOI_THAY_CAN_GIUP = [
  `CREATE TABLE IF NOT EXISTS hoi_thay_can_giup (
    sbd TEXT NOT NULL, qid TEXT NOT NULL, tieu_de TEXT NOT NULL DEFAULT '',
    ly_do TEXT NOT NULL DEFAULT '', trang_thai TEXT NOT NULL DEFAULT 'can_thay',
    loi_thay TEXT NOT NULL DEFAULT '', loi_luc INTEGER NOT NULL DEFAULT 0,
    doc_luc INTEGER NOT NULL DEFAULT 0, gui_luc INTEGER NOT NULL,
    cap_nhat_luc INTEGER NOT NULL, revision INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY(sbd,qid)
  )`,
  'CREATE INDEX IF NOT EXISTS ht_cg_hang ON hoi_thay_can_giup(trang_thai,cap_nhat_luc DESC,sbd,qid)',
  `CREATE TABLE IF NOT EXISTS hoi_thay_ho_tro_receipt (
    request_id TEXT PRIMARY KEY, request_hash TEXT NOT NULL,
    response_json TEXT NOT NULL, tao_luc INTEGER NOT NULL
  )`,
] as const
