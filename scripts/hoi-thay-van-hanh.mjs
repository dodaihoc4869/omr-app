// Cổng thuần để kiểm bằng máy: mọi DDL được xét trước khi chạm D1.
const BANG = new Set(['hoi_thay_kiem', 'hoi_thay_can_giup', 'hoi_thay_ho_tro_receipt'])
export function kiemDdlHoiThay(ds) {
  if (!Array.isArray(ds) || !ds.length || ds.length > 16) throw new Error('Schema Hỏi thầy chưa hợp lệ.')
  for (const sql of ds) {
    if (typeof sql !== 'string' || /;|--|\/\*|\b(DROP|ALTER|INSERT|UPDATE|DELETE|REPLACE|ATTACH|PRAGMA)\b/i.test(sql)) throw new Error('Chỉ nhận DDL tạo bảng/chỉ mục riêng của Hỏi thầy.')
    const table = /^CREATE TABLE IF NOT EXISTS (\w+)\s*\(/.exec(sql)
    const index = /^CREATE (?:UNIQUE )?INDEX IF NOT EXISTS (\w+) ON (\w+)\s*\(/.exec(sql)
    if (table ? !BANG.has(table[1]) : !index || !/^(htk_|ht_cg_)/.test(index[1]) || !BANG.has(index[2])) throw new Error('Schema chạm ngoài làn Hỏi thầy.')
  }
}

export async function apSchemaHoiThay(query, ds) {
  kiemDdlHoiThay(ds)
  // Ca thường đã qua kiem-phat-hanh-chua; cả chặng kiểm tra cá nhân đang chạy cũng chặn DDL/đổi bản.
  const r = await query(`SELECT COUNT(*) AS n FROM kiem_tra_ca_nhan_chang c JOIN kiem_tra_ca_nhan k ON k.id=c.bai_id
    WHERE k.nop_luc IS NULL AND c.chot_luc IS NULL AND c.bat_dau<=CAST((julianday('now')-2440587.5)*86400000 AS INTEGER)
    AND c.han>CAST((julianday('now')-2440587.5)*86400000 AS INTEGER)`)
  if (!r.length || Number(r[0].n) !== 0) throw new Error('Có chặng kiểm tra cá nhân đang làm hoặc chưa kiểm được: dừng phát hành.')
  for (const sql of ds) await query(sql)
  return { schemaHoiThay: true, soLenhChiThem: ds.length, soChangDangLam: 0 }
}
