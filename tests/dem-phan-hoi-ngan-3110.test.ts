// @vitest-environment node
// ĐỆM PHẢN HỒI LỆNH HỎI ĐỊNH KỲ TRONG NGĂN (31/10): lệnh hỏi lại theo nhịp (ca thi đang mở, buổi học, bài mẹ giao, thông báo, thưởng, cờ chữa câu sai) — lần
// hai trong thời hạn KHÔNG chạm D1, thân y hệt (serverNow làm mới); lệnh có câu GHI không được đệm; em vừa ghi (lệnh khác của em) ⇒ đệm bỏ ngay; hết hạn ⇒ đọc lại.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { NganHocSinh, HAN_DEM_PHAN_HOI, DAU_TRONG_NGAN, DAU_SBD_NGAN, xoaEnvChungNgan } from '../server/src/ngan-hoc-sinh'
import '../server/src/index'
import { gameToken } from '../server/src/game-v2-auth'
import { xoaMoiDem } from '../server/src/dem-chung'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import type { Env } from '../server/src/kieu'

beforeEach(() => { xoaMoiDem(); xoaEnvChungNgan() })
afterEach(() => { xoaEnvChungNgan() })

function kho() {
  const k = taoKhoOmni({ 'DH-B8': 24 }, 3)
  k.d.sql.exec(`UPDATE hoc_sinh SET mat_khau='mk'`)
  const d = { n: 0 }
  const g = k.env.DB as unknown as { prepare(q: string): Record<string, (...a: unknown[]) => unknown>; batch(ds: unknown[]): Promise<unknown> }
  const prep = g.prepare.bind(g), bat = g.batch.bind(g)
  g.prepare = (q: string) => { const st = prep(q); const boc = (s: Record<string, (...a: unknown[]) => unknown>): Record<string, unknown> => ({ __st: s, bind: (...a: unknown[]) => boc(s.bind!(...a) as never), first: (...a: unknown[]) => { d.n++; return s.first!(...a) }, all: () => { d.n++; return s.all!() }, run: () => { d.n++; return s.run!() } }); return boc(st) as never }
  g.batch = (ds: { __st?: unknown }[]) => { d.n++; return bat(ds.map((x) => x.__st ?? x)) }
  const nen: Promise<unknown>[] = []
  const st = { waitUntil: (p: Promise<unknown>) => { nen.push(p) } } as never
  const ngan = new NganHocSinh(st, k.env as Env)
  const goi = async (duong: string, than: Record<string, unknown>) => {
    const res = await ngan.fetch(new Request(`https://t${duong}`, { method: 'POST', headers: { 'content-type': 'application/json', [DAU_TRONG_NGAN]: '1', [DAU_SBD_NGAN]: 'S1' }, body: JSON.stringify(than) }))
    const chu = await res.text()
    for (let i = 0; i < nen.length; i++) await nen[i]!.catch(() => null)
    return { chu, j: JSON.parse(chu) as Record<string, unknown>, do: res.headers.get('x-ngan-do') ?? '' }
  }
  return { k, d, goi }
}
const boNow = (s: string) => s.replace(/"serverNow":\d+/, '"serverNow":0')

describe('đệm phản hồi lệnh hỏi định kỳ trong ngăn', () => {
  it('mọi đường trong danh sách: lần hai trong hạn không chạm D1 (nếu lần đầu không ghi), thân y hệt; serverNow làm mới', async () => {
    for (const duong of Object.keys(HAN_DEM_PHAN_HOI)) {
      xoaMoiDem(); xoaEnvChungNgan()
      const x = kho()
      const token = await gameToken(x.k.env as Env, 'S1')
      const a = await x.goi(duong, { token })
      const n = x.d.n
      const b = await x.goi(duong, { token })
      console.log('[đệm phản hồi]', duong, b.do.endsWith('dem=1') ? 'ĐỆM' : 'không đệm (lần đầu có ghi)', a.j.ok)
      if (b.do.endsWith('dem=1')) {
        expect(x.d.n, duong).toBe(n)
        expect(boNow(b.chu), duong).toBe(boNow(a.chu))
      } else {
        // lần đầu có ghi ⇒ không đệm: lần hai chạy thật, vẫn đúng kết quả
        expect(b.j.ok, duong).toBe(a.j.ok)
      }
    }
  })

  it('em vừa có lệnh GHI (mở chặng) ⇒ đệm của em bỏ ngay; lần sau đọc lại D1', async () => {
    const x = kho()
    const token = await gameToken(x.k.env as Env, 'S1')
    await x.goi('/hs/ca-dang-mo', { token })
    const b = await x.goi('/hs/ca-dang-mo', { token })
    expect(b.do.endsWith('dem=1')).toBe(true)
    await x.goi('/game-v2/hoc-tap-start', { token })
    const n = x.d.n
    const c = await x.goi('/hs/ca-dang-mo', { token })
    expect(c.do.endsWith('dem=1')).toBe(false)
    expect(x.d.n).toBeGreaterThan(n)
  })

  it('hết hạn ⇒ đọc lại; thân khác (token khác) ⇒ khoá khác', async () => {
    const x = kho()
    const token = await gameToken(x.k.env as Env, 'S1')
    await x.goi('/hs/ca-dang-mo', { token })
    const goc = Date.now
    const t = goc()
    Date.now = () => t + HAN_DEM_PHAN_HOI['/hs/ca-dang-mo']! + 1000
    try { expect((await x.goi('/hs/ca-dang-mo', { token })).do.endsWith('dem=1')).toBe(false) } finally { Date.now = goc }
    expect((await x.goi('/hs/ca-dang-mo', { token, them: 1 })).do.endsWith('dem=1')).toBe(false)
  })
})
