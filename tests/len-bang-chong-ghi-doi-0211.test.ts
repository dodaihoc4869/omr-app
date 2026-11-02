// @vitest-environment node
// CHỐNG GHI ĐÔI LÊN BẢNG (02/11, số thật: 158/159 lượt có hai dòng cách nhau ~0,85 giây — app thầy gửi lệnh cũ `action: ghiLenBang` tới chính Worker rồi
// «soi» thêm `/len-bang`). Cùng em · câu · chuyên đề · kết quả trong 10 giây = MỘT lần: một dòng `len_bang`, một dòng sổ, một lần `qid_da_lam`.
import { describe, it, expect, vi, afterEach } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const moi = (d: D1That, o: Record<string, unknown> = {}) => goiWorker(worker, d.env, '/len-bang', { sbd: 'S1', chuyenDe: 'Este', qid: 'Q1', dat: false, ...o }, true)
const cu = (d: D1That, o: Record<string, unknown> = {}) => goiWorker(worker, d.env, '/goi', { action: 'ghiLenBang', sbd: 'S1', chuyenDe: 'Este', qid: 'Q1', dat: false, ...o }, true)
const dem = (d: D1That, bang: string, dk = '1') => (d.sql.prepare(`SELECT COUNT(*) AS n FROM ${bang} WHERE ${dk}`).get() as { n: number }).n

afterEach(() => { vi.useRealTimers() })

describe('POST /len-bang chống ghi đôi', () => {
  it('đường cũ (action ghiLenBang) rồi đường mới (/len-bang) cùng lượt ⇒ MỘT dòng mỗi bảng', async () => {
    const d = taoD1That()
    expect(await cu(d)).toMatchObject({ ok: true })
    expect(await moi(d)).toMatchObject({ ok: true })
    expect(dem(d, 'len_bang')).toBe(1)
    expect(dem(d, 'su_kien_hoc', "nguon = 'len_bang'")).toBe(1)
    expect(d.sql.prepare("SELECT so_lan FROM qid_da_lam WHERE sbd = 'S1' AND qid = 'Q1'").get()).toEqual({ so_lan: 1 })
  })
  it('khác câu / khác em / khác kết quả / khác chuyên đề ⇒ vẫn ghi đủ', async () => {
    const d = taoD1That()
    for (const o of [{}, { qid: 'Q2' }, { sbd: 'S2' }, { dat: true }, { chuyenDe: 'Amin' }]) expect(await moi(d, o)).toMatchObject({ ok: true })
    expect(dem(d, 'len_bang')).toBe(5)
  })
  it('cùng em cùng câu gọi lại sau hơn 10 giây ⇒ là lần mới, ghi', async () => {
    const d = taoD1That()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-02T10:00:00.000Z'))
    await moi(d)
    vi.setSystemTime(new Date('2026-11-02T10:00:09.000Z'))
    await moi(d)
    expect(dem(d, 'len_bang')).toBe(1)
    vi.setSystemTime(new Date('2026-11-02T10:00:11.000Z'))
    await moi(d)
    expect(dem(d, 'len_bang')).toBe(2)
  })
})

// TỐC ĐỘ (tác tử tốc độ 02/11, luật thầy 13/10 «sửa xong phải nhanh hơn»): soi trùng nằm TRONG lô ghi ⇒ lượt ghi mới = 3 đợt chờ D1 nối tiếp, bằng
// bản trước #750 (6c58f165: 3; bản #750 thêm một câu SELECT chờ riêng ⇒ 4). Lượt trùng = 1 đợt (chỉ lô, không ghi gì). Đếm như tests/toc-do-may-chu-lenh-nong-1310.test.ts:
// mọi lệnh D1 giữ lại tới khi mã rảnh rồi trả cả hàng = một đợt; việc phụ sau phản hồi (`ctx.waitUntil`) không tính.
function demDot(d: D1That) {
  type St = { bind(...a: unknown[]): St; first(...a: unknown[]): Promise<unknown>; all(): Promise<unknown>; run(): Promise<unknown> }
  const hang: (() => void)[] = []
  const that = new WeakMap<object, St>()
  const cho = <T,>(f: () => Promise<T>) => new Promise<T>((ok, loi) => { hang.push(() => { f().then(ok, loi) }) })
  const goc = d.env.DB as unknown as { prepare(q: string): St; batch(ds: St[]): Promise<unknown> }
  const boc = (st: St): St => {
    const b: St = { bind: (...a) => boc(st.bind(...a)), first: (...a) => cho(() => st.first(...a)), all: () => cho(() => st.all()), run: () => cho(() => st.run()) }
    that.set(b, st)
    return b
  }
  const db: Record<string, unknown> = { prepare: (q: string) => boc(goc.prepare(q)), batch: (ds: St[]) => cho(() => goc.batch(ds.map((x) => that.get(x) ?? x))) }
  db.withSession = () => db
  const env = { ...d.env, DB: db } as unknown as D1That['env']
  return async (duong: string, body: Record<string, unknown>) => {
    const phu: Promise<unknown>[] = []
    let xong = false, dot = 0
    const p = worker.fetch(new Request(`https://test${duong}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...body, secret: 'bi-mat-thu' }) }), env, { waitUntil: (x: Promise<unknown>) => { phu.push(x) } } as never)
      .then((r) => r.json() as Promise<Record<string, unknown>>).finally(() => { xong = true })
    for (;;) {
      await new Promise<void>((r) => setImmediate(r))
      if (xong) break
      if (hang.length) { dot++; for (const f of hang.splice(0)) f() }
    }
    for (let i = 0; i < 1000 && hang.length; i++) { for (const f of hang.splice(0)) f(); await new Promise<void>((r) => setImmediate(r)) }
    await Promise.allSettled(phu)
    return { kq: await p, dot }
  }
}

describe('POST /len-bang: số đợt chờ D1 nối tiếp', () => {
  it('lượt mới ≤ 3 đợt, lượt trùng ≤ 1 đợt, vẫn đúng một dòng mỗi bảng', async () => {
    const d = taoD1That()
    const goi = demDot(d)
    const lb = { sbd: 'S1', chuyenDe: 'Este', qid: 'Q1', dat: true }
    const moi1 = await goi('/len-bang', lb)
    const trung = await goi('/len-bang', lb)
    console.log(`[toc-do len-bang] mới ${moi1.dot} đợt · trùng ${trung.dot} đợt`)
    expect(moi1.kq).toMatchObject({ ok: true })
    expect(trung.kq).toMatchObject({ ok: true })
    expect(moi1.dot).toBeLessThanOrEqual(3)
    expect(trung.dot).toBeLessThanOrEqual(1)
    expect(dem(d, 'len_bang')).toBe(1)
    expect(dem(d, 'su_kien_hoc', "nguon = 'len_bang'")).toBe(1)
    expect(d.sql.prepare("SELECT so_lan FROM qid_da_lam WHERE sbd = 'S1' AND qid = 'Q1'").get()).toEqual({ so_lan: 1 })
  })
})
