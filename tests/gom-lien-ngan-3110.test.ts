// @vitest-environment node
// NGĂN GOM D1 LIÊN ISOLATE (31/10, gom-lien-ngan.ts): lô của nhiều nơi gửi (nhiều isolate) cùng lúc ⇒ MỘT lượt gửi D1; kết quả từng nơi y hệt gửi thẳng;
// lô chung lỗi ⇒ chạy lại riêng từng nơi (nơi lỗi không ghi gì, nơi khác vẫn đúng); D1 quá tải ⇒ mọi nơi nhận nguyên lỗi; bộ gom trong isolate đi qua ngăn gom
// cho đúng `.first() / .first(cot) / .all() / .run() / batch()` như gửi thẳng; tham số không an toàn với JSON ⇒ gửi thẳng.
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { NganGomD1, duongGuiQuaNganGom, thamSoAnToan, type CauGui } from '../server/src/gom-lien-ngan'
import { gomD1 } from '../server/src/gom-d1'
import type { D1Database, D1Result, Env } from '../server/src/kieu'

function dung() {
  const d = taoD1That()
  d.sql.exec(`CREATE TABLE gt (id INTEGER PRIMARY KEY, ten TEXT, so REAL); INSERT INTO gt (id, ten, so) VALUES (1, 'a', 1.5), (2, 'b', NULL), (3, 'c', 3)`)
  const goc = d.env.DB as unknown as D1Database & { batch: D1Database['batch'] }
  let lo = 0
  const db = { prepare: (q: string) => goc.prepare(q), batch: (ds: never[]) => { lo++; return goc.batch(ds) } } as unknown as D1Database
  const ngan = new NganGomD1({} as never, { DB: db } as Env)
  const gui = async (cau: CauGui[]) => {
    const r = await ngan.fetch(new Request('https://gom/lo', { method: 'POST', body: JSON.stringify({ cau }) }))
    return (await r.json()) as { kq?: D1Result[]; loi?: string }
  }
  return { d, ngan, gui, soLo: () => lo }
}
const bo = (r: { kq?: D1Result[] }) => (r.kq ?? []).map((x) => x.results)

describe('ngăn gom D1 liên isolate', () => {
  it('đầu nối tới ngăn gom tạo TRONG MỖI lần gửi (bộ gom dùng chung cả isolate — đầu nối của ngăn này không được dùng ở ngăn khác: lượt 15)', async () => {
    const x = dung()
    let get = 0
    const ns = { idFromName: (t: string) => ({ toString: () => t }), get: () => { get++; return { fetch: (r: Request) => x.ngan.fetch(r) } } }
    const qua = duongGuiQuaNganGom({ DB: x.d.env.DB, GOM_D1: ns, BAT_GOM_LIEN_NGAN: '1' } as unknown as Env)!
    expect(qua).toBeTypeOf('function')
    expect(get).toBe(0)
    await qua([{ q: 'SELECT 1 AS a', v: null }])
    await qua([{ q: 'SELECT 2 AS a', v: null }])
    expect(get).toBe(2)
    expect(duongGuiQuaNganGom({ DB: x.d.env.DB, GOM_D1: ns } as unknown as Env)).toBeUndefined() // công tắc tắt ⇒ gửi thẳng
  })

  it('ba nơi gửi cùng lúc ⇒ một lượt gửi D1; kết quả chia đúng từng nơi (cả ghi)', async () => {
    const x = dung()
    const [a, b, c] = await Promise.all([
      x.gui([{ q: 'SELECT ten FROM gt WHERE id = ?', v: [1] }, { q: 'SELECT COUNT(*) AS n FROM gt', v: null }]),
      x.gui([{ q: "INSERT INTO gt (id, ten) VALUES (?, ?)", v: [4, 'd'] }, { q: 'SELECT ten FROM gt WHERE id = 4', v: null }]),
      x.gui([{ q: 'SELECT so FROM gt ORDER BY id', v: null }]),
    ])
    expect(x.soLo()).toBe(1)
    expect(bo(a)).toEqual([[{ ten: 'a' }], [{ n: 3 }]])
    expect(bo(b)).toEqual([[], [{ ten: 'd' }]])
    expect(b.kq![0]!.meta?.changes).toBe(1)
    expect(bo(c)).toEqual([[{ so: 1.5 }, { so: null }, { so: 3 }, { so: null }]]) // chạy sau lô của nơi thứ hai trong cùng giao dịch — như đến lần lượt
  })

  it('lô chung lỗi ⇒ chạy lại riêng: nơi lỗi nhận lỗi và KHÔNG ghi gì, nơi khác vẫn đúng', async () => {
    const x = dung()
    const [ok, hong] = await Promise.all([
      x.gui([{ q: "UPDATE gt SET ten = 'A' WHERE id = 1", v: null }, { q: 'SELECT ten FROM gt WHERE id = 1', v: null }]),
      x.gui([{ q: "INSERT INTO gt (id, ten) VALUES (9, 'z')", v: null }, { q: 'SELECT * FROM bang_khong_co', v: null }]),
    ])
    expect(bo(ok)).toEqual([[], [{ ten: 'A' }]])
    expect(hong.loi).toMatch(/no such table/)
    expect(x.d.sql.prepare('SELECT COUNT(*) AS n FROM gt WHERE id = 9').get()).toEqual({ n: 0 })
    expect(x.d.sql.prepare('SELECT ten FROM gt WHERE id = 1').get()).toEqual({ ten: 'A' })
  })

  it('D1 quá tải ⇒ mọi nơi gửi nhận nguyên lỗi quá tải (bộ gom nơi gửi tự chờ rồi gửi lại)', async () => {
    const ngan = new NganGomD1({} as never, { DB: { prepare: () => ({ bind: () => ({}) }), batch: async () => { throw new Error('D1_ERROR: D1 DB is overloaded. Requests queued for too long.') } } } as unknown as Env)
    const gui = async (cau: CauGui[]) => (await (await ngan.fetch(new Request('https://gom/lo', { method: 'POST', body: JSON.stringify({ cau }) }))).json()) as { loi?: string }
    const kq = await Promise.all([gui([{ q: 'SELECT 1', v: null }]), gui([{ q: 'SELECT 2', v: null }])])
    for (const r of kq) expect(r.loi).toMatch(/overloaded/)
  })

  it('bộ gom trong isolate qua ngăn gom: first / first(cot) / all / run / batch y hệt gửi thẳng; tham số không an toàn ⇒ gửi thẳng', async () => {
    const chay = async (qua: boolean) => {
      const x = dung()
      let goi = 0
      const g = gomD1(x.d.env.DB as unknown as D1Database, qua ? async (cau) => { goi++; const r = await x.gui(cau); if (r.loi !== undefined) throw new Error(r.loi); return r.kq! } : undefined)
      const [f, fc, al, ru, ba] = await Promise.all([
        g.prepare('SELECT id, ten FROM gt WHERE id = ?').bind(2).first(),
        g.prepare('SELECT ten FROM gt WHERE id = ?').bind(3).first('ten'),
        g.prepare('SELECT id FROM gt ORDER BY id DESC').all(),
        g.prepare('UPDATE gt SET so = ? WHERE id = ?').bind(7, 2).run(),
        g.batch([g.prepare('SELECT so FROM gt WHERE id = 2'), g.prepare('SELECT COUNT(*) AS n FROM gt')]),
      ])
      const khong = await g.prepare('SELECT ? AS x').bind(Number.NaN).first()
      return { goi, f, fc, al: (al as D1Result).results, ru: (ru as D1Result).meta?.changes, ba: (ba as D1Result[]).map((r) => r.results), khong }
    }
    const thang = await chay(false), quaNgan = await chay(true)
    const { goi, ...a } = quaNgan
    const { goi: _g, ...b } = thang
    expect(a).toEqual(b)
    expect(goi).toBe(1) // cả năm việc cùng lượt ⇒ một lô qua ngăn gom; câu NaN gửi thẳng
    expect(thamSoAnToan([1, 'a', null, true])).toBe(true)
    expect(thamSoAnToan([Number.NaN])).toBe(false)
    expect(thamSoAnToan([new Uint8Array(1)])).toBe(false)
  })
})
