// @vitest-environment node
// "Các em ĐÃ HỌC hôm nay" (thi-dua-hom-nay.ts, 2 chỗ): truy vấn `SELECT DISTINCT sbd … WHERE ngay_vn = ? AND luc >= ? AND ket_qua IS NOT NULL` quét CẢ sổ (D1 thật 29.156 dòng × 72 lần/giờ 21/09) vì DISTINCT
// khiến SQLite ưa chỉ mục idx_skh_em_ngay. Bản mới bọc truy vấn con `LIMIT -1` để đi chỉ mục phủ idx_skh_luc. Khoá: CÙNG TẬP EM với truy vấn cũ trên mọi kiểu dòng, kế hoạch chạy có dùng idx_skh_luc,
// không UNION (chốt 5 term của D1), thứ tự tham số (mốc ISO trước, ngày VN sau). SQLite thật.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { SQL_EM_DA_HOC_HOM_NAY } from '../server/src/thi-dua-hom-nay'
import { taoD1That, type D1That } from './_d1-that'

const SQL_CU = 'SELECT DISTINCT sbd FROM su_kien_hoc WHERE ngay_vn = ? AND luc >= ? AND ket_qua IS NOT NULL'
const MOC = '2026-09-21T05:00:00.000Z' // 12:00 VN 21/09
const NGAY = '2026-09-22'
let n = 0
const ghi = (d: D1That, o: { sbd: string; luc: string; ngay: string; kq: 0 | 1 | null }) =>
  d.sql.prepare('INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .run(`k${++n}`, o.sbd, `Q${n}`, 'on_lai', 'm', 1, o.kq, 30, o.luc, o.ngay, 'D.1')
const tap = async (d: D1That, sql: string, ...bind: string[]): Promise<string[]> =>
  [...((await d.env.DB.prepare(sql).bind(...bind).all<{ sbd: string }>()).results ?? []).map((x) => String(x.sbd))].sort()

/** Mỗi em một kiểu dòng dễ nhầm. Chỉ A, B, G, H được vào tập. */
function du(): D1That {
  const d = taoD1That()
  ghi(d, { sbd: 'A', luc: '2026-09-22T01:00:00.000Z', ngay: NGAY, kq: 1 })            // đúng, hôm nay
  ghi(d, { sbd: 'A', luc: '2026-09-22T01:05:00.000Z', ngay: NGAY, kq: 0 })            // A lần hai (DISTINCT)
  ghi(d, { sbd: 'B', luc: '2026-09-22T02:00:00.000Z', ngay: NGAY, kq: 0 })            // sai, hôm nay
  ghi(d, { sbd: 'C', luc: '2026-09-22T02:00:00.000Z', ngay: NGAY, kq: null })         // chưa chấm ⇒ loại
  ghi(d, { sbd: 'D', luc: '2026-09-21T04:59:59.999Z', ngay: '2026-09-21', kq: 1 })     // trước mốc ⇒ loại
  ghi(d, { sbd: 'E', luc: '2026-09-21T10:00:00.000Z', ngay: '2026-09-21', kq: 1 })     // sau mốc nhưng NGÀY hôm qua ⇒ loại (vì ngay_vn ≠ hôm nay)
  ghi(d, { sbd: 'F', luc: '2026-09-22T03:00:00.000Z', ngay: '2026-09-21', kq: 1 })     // luc hôm nay nhưng ngay_vn lệch ⇒ loại (đúng như truy vấn cũ)
  ghi(d, { sbd: 'G', luc: MOC, ngay: NGAY, kq: 1 })                                     // đúng biên mốc (≥) — ngay_vn hôm nay ⇒ vào
  ghi(d, { sbd: 'H', luc: '2026-09-22T16:59:00.000Z', ngay: NGAY, kq: 0 })            // cuối ngày ⇒ vào
  for (let i = 0; i < 200; i++) ghi(d, { sbd: `Z${i % 40}`, luc: `2026-09-1${i % 9}T03:00:00.000Z`, ngay: `2026-09-1${i % 9}`, kq: 1 }) // sổ cũ: KHÔNG được đọc
  return d
}

describe('em đã học hôm nay: bản chỉ mục = bản cũ', () => {
  it('cùng tập em trên mọi kiểu dòng (DISTINCT, chưa chấm, trước mốc, ngày lệch, biên mốc)', async () => {
    const d = du()
    const cu = await tap(d, SQL_CU, NGAY, MOC)
    const moi = await tap(d, SQL_EM_DA_HOC_HOM_NAY, MOC, NGAY)
    expect(cu).toEqual(['A', 'B', 'G', 'H'])
    expect(moi).toEqual(cu)
  })

  it('không có dòng nào hôm nay ⇒ tập rỗng; mốc SAU mọi dòng ⇒ rỗng', async () => {
    const d = taoD1That()
    expect(await tap(d, SQL_EM_DA_HOC_HOM_NAY, MOC, NGAY)).toEqual([])
    const e = du()
    expect(await tap(e, SQL_EM_DA_HOC_HOM_NAY, '2026-09-23T00:00:00.000Z', NGAY)).toEqual([])
  })

  it('kế hoạch chạy đi bằng chỉ mục idx_skh_luc (SEARCH theo luc), không quét bảng', () => {
    const d = du()
    const kh = (d.sql.prepare(`EXPLAIN QUERY PLAN ${SQL_EM_DA_HOC_HOM_NAY}`).all(MOC, NGAY) as { detail: string }[]).map((x) => x.detail).join(' | ')
    expect(kh).toMatch(/SEARCH .*idx_skh_luc \(luc>\?\)/)
    expect(kh).not.toMatch(/SCAN su_kien_hoc/)
  })

  it('không UNION (chốt 5 term của D1 thật) và đúng hai tham số: mốc ISO trước, ngày VN sau', () => {
    expect(SQL_EM_DA_HOC_HOM_NAY).not.toMatch(/UNION/i)
    expect((SQL_EM_DA_HOC_HOM_NAY.match(/\?/g) ?? []).length).toBe(2)
    expect(SQL_EM_DA_HOC_HOM_NAY.indexOf('luc >= ?')).toBeLessThan(SQL_EM_DA_HOC_HOM_NAY.indexOf('ngay_vn = ?'))
  })

  it('cả hai chỗ dùng ở thi-dua-hom-nay.ts đều gọi hằng số này (không còn DISTINCT trần) với thứ tự (mốc, ngày)', () => {
    const ma = readFileSync('server/src/thi-dua-hom-nay.ts', 'utf8')
    expect(ma).not.toMatch(/SELECT DISTINCT sbd FROM su_kien_hoc WHERE ngay_vn/)
    expect(ma.match(/prepare\(SQL_EM_DA_HOC_HOM_NAY\)\.bind\(/g)).toHaveLength(2)
    expect(ma).toMatch(/prepare\(SQL_EM_DA_HOC_HOM_NAY\)\.bind\(moc\.iso, ngayVn\(nowMs\)\)/)
    expect(ma).toMatch(/prepare\(SQL_EM_DA_HOC_HOM_NAY\)\.bind\(mocHt\.iso, ngay\)/)
  })
})
