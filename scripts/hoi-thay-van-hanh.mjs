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

const SQL_CHANG_MO = `SELECT COUNT(*) AS n FROM kiem_tra_ca_nhan_chang c JOIN kiem_tra_ca_nhan k ON k.id=c.bai_id
    WHERE k.nop_luc IS NULL AND c.chot_luc IS NULL AND c.bat_dau<=CAST((julianday('now')-2440587.5)*86400000 AS INTEGER)
    AND c.han>CAST((julianday('now')-2440587.5)*86400000 AS INTEGER)`

/** `choMs` > 0 (25/10, thầy: "đẩy mọi thứ lên luôn"): còn chặng ĐANG LÀM thì CHỜ (hỏi lại mỗi `nhipMs`) tới khi hết rồi đi tiếp NGAY — tối các em mở
 *  chặng ngắn (~15 phút) nối nhau, dừng hẳn ở phút thứ 7 của lượt thì gần như không bao giờ gặp khe trống. Vẫn KHÔNG BAO GIỜ đổi bản khi còn chặng mở;
 *  hết `choMs` mà còn chặng ⇒ dừng như cũ. Không đọc được (rỗng / không phải số / D1 lỗi) ⇒ dừng ngay, không chờ. Mặc định 0 = hành vi cũ. */
export async function apSchemaHoiThay(query, ds, { choMs = 0, nhipMs = 20_000, ngu = (ms) => new Promise((r) => setTimeout(r, ms)), bayGio = () => Date.now() } = {}) {
  kiemDdlHoiThay(ds)
  // Ca thường đã qua kiem-phat-hanh-chua; cả chặng kiểm tra cá nhân đang chạy cũng chặn DDL/đổi bản.
  const het = bayGio() + choMs
  let daCho = 0
  for (;;) {
    const r = await query(SQL_CHANG_MO)
    const n = r.length ? Number(r[0].n) : NaN
    if (n === 0) break
    if (!Number.isInteger(n) || n < 0 || bayGio() + nhipMs > het) throw new Error('Có chặng kiểm tra cá nhân đang làm hoặc chưa kiểm được: dừng phát hành.')
    if (!daCho) console.log(`Còn ${n} chặng kiểm tra cá nhân đang làm: chờ hết rồi đẩy ngay (tối đa ${Math.round(choMs / 60_000)} phút).`)
    await ngu(nhipMs)
    daCho += nhipMs
  }
  for (const sql of ds) await query(sql)
  return { schemaHoiThay: true, soLenhChiThem: ds.length, soChangDangLam: 0, ...(daCho ? { daChoGiay: Math.round(daCho / 1000) } : {}) }
}
