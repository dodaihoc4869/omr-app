// @vitest-environment node
// G1 giảm chi phí D1 (12/11): cạnh tiên quyết cả lớp cộng sẵn bằng cron (server/src/hanh-trinh-canh-lop.ts) — so cũ↔mới trên D1 thật trong bộ nhớ,
// khoá kế hoạch truy vấn (lệnh lập kế hoạch không còn chạm bảng cạnh từng em khi bảng cộng sẵn đã dựng).
import { describe, it, expect } from 'vitest'
import { taoD1That } from './_d1-that'
import { SQL_CANH_LOP_CU, SQL_CANH_LOP_DOC, docCanhLopMotLuot, dungCanhLopNeuCu, HAN_DUNG_CANH_LOP_MS, chuKyDungCanhLop, SQL_DUNG_CANH_LOP } from '../server/src/hanh-trinh-canh-lop'
import { canhDangHoc, CANH_HOC_TOI_THIEU, type CanhHoc } from '../server/src/do-thi-tien-quyet'

const NGAY = 86_400_000
const T = Date.UTC(2026, 10, 12, 13, 0, 0) // 20:00 VN — khung học (chu kỳ 30 phút)
const keHoach = (sql: any, q: string) => (sql.prepare('EXPLAIN QUERY PLAN ' + q).all() as { detail: string }[]).map((r) => r.detail)
const so = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)
const sap = (ds: CanhHoc[]) => ds.slice().sort((a, b) => so(a.tu, b.tu) || so(a.den, b.den))
const datNguong = (c: CanhHoc) => (c.soEm ?? 0) >= CANH_HOC_TOI_THIEU.soEm && c.nCo >= CANH_HOC_TOI_THIEU.nCo && c.nChua >= CANH_HOC_TOI_THIEU.nChua

/** Dữ liệu giả đủ trường hợp: biên 19/20 em, 29/30 lượt, dòng đúng mốc 7 ngày, dòng ngoài cửa sổ, dòng đã về 0, nhiều em mỗi cạnh, cạnh phân biệt rõ. */
function napDuLieu(sql: any) {
  const ins = sql.prepare('INSERT INTO hanh_trinh_v4_canh VALUES(?,?,?,?,?,?,?,?)')
  const them = (sbd: string, tu: string, den: string, nCo: number, dungCo: number, nChua: number, dungChua: number, luc: number) => ins.run(sbd, tu, den, nCo, dungCo, nChua, dungChua, luc)
  // A: 20 em × (2 có, 2 chưa) ⇒ 40/40 — đạt; có kèm dòng đúng mốc T−7 ngày (vẫn tính) và dòng T−7 ngày−1 (bị loại).
  for (let i = 0; i < 20; i++) them(`A${i}`, 'nen:mol', 'dang:A', 2, 2, 2, 0, i === 0 ? T - 7 * NGAY : T - NGAY)
  them('A_cu', 'nen:mol', 'dang:A', 50, 50, 50, 0, T - 7 * NGAY - 1)
  them('A_0', 'nen:mol', 'dang:A', 0, 0, 0, 0, T - 1000) // dòng đã về 0 — không đếm em
  // B: 19 em (thiếu 1 em) dù nhiều lượt — không đạt.
  for (let i = 0; i < 19; i++) them(`B${i}`, 'nen:mol', 'dang:B', 5, 5, 5, 1, T - 2 * NGAY)
  // C: 20 em, nCo = 29 — không đạt; D: 20 em, nCo = 30, nChua = 30 — đạt (biên).
  for (let i = 0; i < 20; i++) them(`C${i}`, 'nen:ph', 'dang:C', i < 9 ? 2 : 1, 1, 2, 1, T - 3 * NGAY)
  for (let i = 0; i < 20; i++) them(`D${i}`, 'nen:ph', 'dang:D', i < 10 ? 2 : 1, i < 10 ? 2 : 0, i < 10 ? 2 : 1, 0, T - 3 * NGAY)
  // E: cạnh thứ hai cùng `den` A — đạt, để thứ tự (tu, den) có nghĩa; một em xuất hiện ở nhiều cạnh.
  for (let i = 0; i < 25; i++) them(`A${i}`, 'nen:can_bang', 'dang:A', 3, 3, 3, 0, T - NGAY)
  // F: `den` không hỏi tới — đạt nhưng không được trả.
  for (let i = 0; i < 20; i++) them(`F${i}`, 'nen:mol', 'dang:F', 2, 2, 2, 2, T - NGAY)
}
const cu = (sql: any, dens: string[], moc: number) => sap(sql.prepare(SQL_CANH_LOP_CU).all(JSON.stringify(dens), moc) as CanhHoc[])
const DENS = ['dang:A', 'dang:B', 'dang:C', 'dang:D', 'dang:khong_co']

describe('cạnh tiên quyết cả lớp cộng sẵn (G1 12/11)', () => {
  it('chưa dựng ⇒ câu cũ y nguyên (cùng một lượt), tong=false', async () => {
    const d = taoD1That(); napDuLieu(d.sql)
    const r = await docCanhLopMotLuot(d.env, DENS, T, T - 7 * NGAY)
    expect(r.tong).toBe(false)
    expect(sap(r.ds)).toEqual(cu(d.sql, DENS, T - 7 * NGAY))
    expect(r.ds.length).toBeGreaterThan(2)
  })

  it('đã dựng ⇒ y hệt câu cũ tại cùng mốc (sau lọc ngưỡng) và canhDangHoc giống hệt', async () => {
    const d = taoD1That(); napDuLieu(d.sql)
    const cuDay = cu(d.sql, DENS, T - 7 * NGAY)
    expect(await dungCanhLopNeuCu(d.env, T)).toEqual({ dung: true, soCanh: 4 }) // A×2, D, F
    // Đổi dữ liệu SAU lúc dựng: bảng cộng sẵn giữ ảnh chụp tại mốc (lệch có giới hạn ≤ chu kỳ dựng).
    d.sql.prepare("UPDATE hanh_trinh_v4_canh SET n_co=n_co+100 WHERE den='dang:A'").run()
    const r = await docCanhLopMotLuot(d.env, DENS, T + 5 * 60_000, 0)
    expect(r.tong).toBe(true)
    expect(sap(r.ds)).toEqual(cuDay.filter(datNguong))
    expect(sap(r.ds).map((c) => `${c.tu}>${c.den}`)).toEqual(['nen:can_bang>dang:A', 'nen:mol>dang:A', 'nen:ph>dang:D'])
    expect(canhDangHoc(sap(r.ds))).toEqual(canhDangHoc(cuDay))
    expect(canhDangHoc(cuDay).length).toBeGreaterThan(0) // ca thật có cạnh học (không so hai mảng rỗng)
    // Kiểu số giữ nguyên (SUM số nguyên).
    for (const c of r.ds) for (const k of ['nCo', 'dungCo', 'nChua', 'dungChua', 'soEm'] as const) expect(Number.isInteger(c[k])).toBe(true)
  })

  it('đã dựng nhưng không cạnh nào đạt ngưỡng ⇒ [] (không lùi về câu cũ)', async () => {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO hanh_trinh_v4_canh VALUES('S1','nen:mol','dang:A',1,1,1,0,?)").run(T - NGAY)
    expect((await dungCanhLopNeuCu(d.env, T)).dung).toBe(true)
    const r = await docCanhLopMotLuot(d.env, ['dang:A'], T + 1000, 0)
    expect(r).toEqual({ tong: true, ds: [] })
  })

  it('mốc quá 6 giờ (cron dừng) ⇒ lùi về câu cũ', async () => {
    const d = taoD1That(); napDuLieu(d.sql)
    await dungCanhLopNeuCu(d.env, T)
    const now = T + HAN_DUNG_CANH_LOP_MS + 1
    const r = await docCanhLopMotLuot(d.env, DENS, now, now - 7 * NGAY)
    expect(r.tong).toBe(false)
    expect(sap(r.ds)).toEqual(cu(d.sql, DENS, now - 7 * NGAY))
  })

  it('giành mốc: lượt cron trong chu kỳ không dựng; hai lô chồng nhau thì lô sau không làm gì; hết chu kỳ thì dựng lại', async () => {
    const d = taoD1That(); napDuLieu(d.sql)
    expect((await dungCanhLopNeuCu(d.env, T)).dung).toBe(true)
    const anh = d.chup('hanh_trinh_v4_canh_lop')
    expect((await dungCanhLopNeuCu(d.env, T + 60_000)).dung).toBe(false)
    // Lô thứ hai của một cron chồng (đã qua câu đọc mốc khi mốc còn cũ) — mô phỏng bằng cách gọi lô ghi khi mốc vừa được lô trước giành.
    const lo = await d.env.DB.batch([
      d.env.DB.prepare('UPDATE hanh_trinh_v4_canh_lop_moc SET luc=?1 WHERE id=1 AND (luc<=?1-?2 OR luc>?1)').bind(T + 2000, chuKyDungCanhLop(T)),
    ])
    expect(lo[0]!.meta.changes).toBe(0)
    expect(d.chup('hanh_trinh_v4_canh_lop')).toBe(anh)
    d.sql.prepare("INSERT INTO hanh_trinh_v4_canh VALUES('B_moi','nen:mol','dang:B',5,5,5,1,?)").run(T)
    expect((await dungCanhLopNeuCu(d.env, T + 30 * 60_000)).dung).toBe(true)
    expect(d.dem('hanh_trinh_v4_canh_lop', "den='dang:B'")).toBe(1) // B đủ 20 em sau lần dựng mới
    expect(d.dem('hanh_trinh_v4_canh_lop_moc')).toBe(1)
  })

  it('chu kỳ: khung học 18–24h VN 30 phút, ngoài khung 120 phút', () => {
    expect(chuKyDungCanhLop(T)).toBe(1_800_000)
    expect(chuKyDungCanhLop(Date.UTC(2026, 10, 12, 3, 0, 0))).toBe(7_200_000) // 10:00 VN
  })

  it('kế hoạch truy vấn: nhánh cộng sẵn SEARCH theo khoá chính (den,tu); dòng mốc theo khoá chính; không SCAN bảng nào', () => {
    const d = taoD1That()
    expect(SQL_CANH_LOP_DOC).toMatch(/^SELECT\b/) // lớp gộp đọc theo lượt chỉ coi câu SELECT là câu đọc (WITH ⇒ bị coi là ghi, thêm một đợt chờ)
    const ke = keHoach(d.sql, SQL_CANH_LOP_DOC)
    expect(ke.some((x) => /^SEARCH hanh_trinh_v4_canh_lop USING (COVERING )?INDEX sqlite_autoindex_hanh_trinh_v4_canh_lop_1 \(den=\?\)/.test(x))).toBe(true)
    expect(ke.some((x) => /SEARCH hanh_trinh_v4_canh_lop_moc USING INTEGER PRIMARY KEY/.test(x))).toBe(true)
    expect(ke.filter((x) => /^SCAN /.test(x) && !/json_each/.test(x))).toEqual([])
    // Nhánh câu cũ (chỉ chạy khi chưa dựng) vẫn đi chỉ mục theo den như trước.
    expect(ke.some((x) => /SEARCH hanh_trinh_v4_canh USING (COVERING )?INDEX hanh_trinh_v4_canh_den/.test(x))).toBe(true)
  })

  it('kế hoạch lệnh dựng (cron, ≤ 30 lần/ngày): đúng MỘT lượt quét bảng cạnh, dòng mốc đọc một lần theo khoá chính', () => {
    const d = taoD1That()
    const ke = keHoach(d.sql, SQL_DUNG_CANH_LOP)
    expect(ke.filter((x) => /hanh_trinh_v4_canh\b(?!_)/.test(x))).toHaveLength(1)
    expect(ke).toContain('SCALAR SUBQUERY 1') // không tương quan ⇒ tính một lần
    expect(ke.some((x) => /SEARCH hanh_trinh_v4_canh_lop_moc USING INTEGER PRIMARY KEY/.test(x))).toBe(true)
  })

  it('đã dựng ⇒ nhánh câu cũ bị điều kiện hằng chặn trước vòng quét (đo thời gian trên 60.000 dòng cạnh)', async () => {
    const d = taoD1That()
    const ins = d.sql.prepare('INSERT INTO hanh_trinh_v4_canh VALUES(?,?,?,?,?,?,?,?)')
    d.sql.exec('BEGIN')
    for (let s = 0; s < 1500; s++) for (let k = 0; k < 40; k++) ins.run(`S${s}`, `nen:${k % 7}`, `dang:${k}`, 2, 1, 2, 1, T - NGAY)
    d.sql.exec('COMMIT')
    const dens = JSON.stringify(Array.from({ length: 40 }, (_, i) => `dang:${i}`))
    const do_ = () => { const a = performance.now(); for (let i = 0; i < 3; i++) d.sql.prepare(SQL_CANH_LOP_DOC).all(dens, T - HAN_DUNG_CANH_LOP_MS, T - 7 * NGAY); return performance.now() - a }
    const truoc = do_()
    await dungCanhLopNeuCu(d.env, T)
    const sau = do_()
    expect(d.dem('hanh_trinh_v4_canh_lop')).toBe(40)
    expect(sau * 5).toBeLessThan(truoc)
  })
})
