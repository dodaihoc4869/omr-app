// SỔ CỦA MỘT EM TỪ MỐC (`docLanLam` > 200 câu, srs2-d1.ts) — tách 12/11 (G5, hoá đơn D1) để srs2-d1.ts không to thêm. Câu SQL y hệt bản cũ trong srs2-d1.ts.
import type { Env } from './kieu'
import { daNho, nhoTheoLuot } from './doc-d1-theo-luot'
import { SQL_TC } from './lam-lai-so'
import { SQL_LA_LAN_LAM_GIU_CHAN_DOAN } from './omni-kieu'

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v))

/** Các mốc đã đọc sổ của mỗi em trong lượt — CHỈ ghi khi D1 của lượt có sổ nhớ theo lượt (bản gộp, sống một request); D1 sống lâu không bao giờ có mục. */
export const MOC_DA_DOC = new WeakMap<object, Map<string, Set<string>>>()

/** Dòng sổ của em từ `tuLuc` (bỏ dòng xem lời giải / lướt / chữa bước; giữ chẩn đoán), theo thứ tự chỉ mục (sbd, luc). */
export function docSoTuMoc(env: Env, sbd: string, tuLuc: string): Promise<Row[]> {
  const sql = (coVis: boolean, truoc = false) => `SELECT qid, ngay_vn, luc, ket_qua, ${coVis ? 'assistance, visibility, purpose,' : ''} nguon, ${SQL_TC} AS tc FROM su_kien_hoc WHERE sbd = ? AND luc ${truoc ? '<' : '>='} ? ${coVis ? `AND (${SQL_LA_LAN_LAM_GIU_CHAN_DOAN})` : ''}`
  // G5 12/11 (hoá đơn D1: câu này ~3.386 hàng × 18 nghìn lượt/ngày): kết quả KHÔNG phụ thuộc tập câu (lọc theo câu ở dưới) ⇒ trong CÙNG một lượt (bản gộp,
  // nhớ theo lượt; lệnh ghi sổ xoá bản nhớ) các lần đọc sổ của cùng em không đọc lại dòng nào: cùng mốc ⇒ dùng chung; đã đọc cả sổ (mốc rỗng) ⇒ lọc `luc >= mốc`
  // tại chỗ; đã đọc từ mốc X mà nay cần cả sổ (hồ sơ: lượt chính từ mốc X chạy TRƯỚC, ôn bài cũ cả sổ chạy sau) ⇒ chỉ đọc thêm phần `luc < X` rồi nối (chỉ mục
  // (sbd, luc) trả dòng theo luc tăng ⇒ cùng thứ tự với một lần đọc cả sổ). Ngoài bản gộp ⇒ đọc như cũ.
  const khoaSo = (moc: string) => `srs2_lan_lam_tu_moc|${sbd}|${moc}`
  const doc = (moc: string, truoc: boolean) => async (): Promise<Row[]> => {
    try {
      return (await env.DB.prepare(sql(true, truoc)).bind(sbd, moc).all<Row>()).results ?? []
    } catch {
      return (await env.DB.prepare(sql(false, truoc)).bind(sbd, moc).all<Row>()).results ?? []
    }
  }
  const docTu = (moc: string, f = doc(moc, false)) => nhoTheoLuot(env.DB, khoaSo(moc), f, ['su_kien_hoc'])
  const khoaDb = env.DB as unknown as object
  const daDoc = MOC_DA_DOC.get(khoaDb)?.get(sbd)
  const x = tuLuc || !daDoc ? '' : [...daDoc].filter((m) => m && daNho(env.DB, khoaSo(m))).sort()[0]
  let p: Promise<Row[]>
  if (tuLuc && daNho(env.DB, khoaSo(''))) p = docTu('').then((r) => r.filter((y) => str(y.luc) >= tuLuc))
  else if (x && !daNho(env.DB, khoaSo(''))) p = docTu('', async () => { const [a, b] = await Promise.all([doc(x, true)(), docTu(x)]); return [...a, ...b] })
  else p = docTu(tuLuc)
  // Ghi mốc TRƯỚC khi chờ (lần gọi sau trong lúc lần này đang đọc cũng dùng chung được), và chỉ khi sổ nhớ theo lượt thật sự giữ lần đọc này.
  if (daNho(env.DB, khoaSo(tuLuc))) {
    let m = MOC_DA_DOC.get(khoaDb)
    if (!m) { m = new Map(); MOC_DA_DOC.set(khoaDb, m) }
    let t = m.get(sbd)
    if (!t) { t = new Set(); m.set(sbd, t) }
    t.add(tuLuc)
  }
  return p
}
