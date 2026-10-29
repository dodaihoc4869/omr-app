// @vitest-environment node
// CỔNG TỐC ĐỘ MÁY CHỦ — MỞ CÂU / KIỂM TRA CỦA SỬA LỖI (thầy 29/10, video 08:25: «Đang mở câu…» ~3,3 s, «Đang kiểm tra…» ~1,3 s; đo bản sống: mo-dot 2,6 s, gon-nop 0,9 s,
// mỗi đợt chờ D1 ≈ 170–190 ms). Đếm số ĐỢT CHỜ D1 NỐI TIẾP trên đường trả lời (như toc-do-may-chu-lenh-nong-1310.test.ts) qua đúng cửa thật `worker.fetch`:
// mở câu kèm bản làm lại (mo-dot `gon`), mở lại (gon-mo), nộp (gon-nop). Mốc = số đo SAU khi đệm isolate + đọc song song (server/src/chua-gon-nho.ts, chua-gon-lenh.ts);
// trước đó (bản 28/10): mo-dot nguội 15 · ấm 11 · gon-mo 5 · gon-nop ấm 7 / 6 / nguội 7. Mốc CHỈ HẠ, không nâng; vượt ⇒ ĐỎ.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { taoD1That } from './_d1-that'
import { seedChua, Q } from './_chua-cau-sai-fixture'
import { xoaMoiDem } from '../server/src/dem-chung'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import type { Env } from '../server/src/kieu'

const T = Date.parse('2026-10-07T03:00:00Z')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T); xoaMoiDem(); xoaDemCaBaoVe() })
afterEach(() => { vi.useRealTimers(); xoaDemCaBaoVe() })

type Lenh = { first?: unknown; all?: unknown; run?: unknown; bind?: unknown }
/** Bọc D1 đếm đợt: mỗi lần chạy (first/all/run/batch) xếp hàng; `chay` trả cả hàng khi mã đã rảnh (một đợt). */
function boDemDot(goc: Env['DB']) {
  const hang: (() => void)[] = []
  const that = new WeakMap<object, unknown>()
  let lan = 0
  const cho = <T,>(f: () => Promise<T>) => new Promise<T>((ok, loi) => { lan++; hang.push(() => { f().then(ok, loi) }) })
  const boc = (st: Lenh & object): unknown => {
    const b = {
      bind: (...a: unknown[]) => boc((st.bind as (...x: unknown[]) => Lenh & object)(...a)),
      first: (...a: unknown[]) => cho(() => (st.first as (...x: unknown[]) => Promise<unknown>)(...a)),
      all: () => cho(() => (st.all as () => Promise<unknown>)()),
      run: () => cho(() => (st.run as () => Promise<unknown>)()),
      raw: (...a: unknown[]) => cho(() => ((st as { raw: (...x: unknown[]) => Promise<unknown> }).raw)(...a)),
    }
    that.set(b, st)
    return b
  }
  const g = goc as unknown as { prepare(q: string): Lenh & object; batch(ds: unknown[]): Promise<unknown> }
  const db: Record<string, unknown> = {
    prepare: (q: string) => boc(g.prepare(q)),
    batch: (ds: object[]) => cho(() => g.batch(ds.map((x) => that.get(x) ?? x))),
  }
  db.withSession = () => db
  const raNgoai = () => new Promise<void>((r) => setImmediate(r))
  /** Chạy `viec` tới khi có phản hồi; trả số đợt chờ D1 nối tiếp và tổng số lệnh D1 trên đường trả lời. Sau đó xả hết việc phụ (không tính). */
  async function chay<T>(viec: () => Promise<T>, viecPhu: Promise<unknown>[]): Promise<{ kq: T; dot: number; lenh: number }> {
    let xong = false, dot = 0
    const lan0 = lan
    const p = viec().finally(() => { xong = true })
    p.catch(() => {})
    for (;;) {
      await raNgoai()
      if (xong) break
      if (hang.length) { dot++; for (const f of hang.splice(0)) f() }
    }
    const lenh = lan - lan0 - hang.length
    let phuXong = false
    const phu = Promise.allSettled(viecPhu).finally(() => { phuXong = true })
    for (let i = 0; i < 10_000 && !(phuXong && !hang.length); i++) { await raNgoai(); for (const f of hang.splice(0)) f() }
    await phu
    return { kq: await p, dot, lenh }
  }
  return { db: db as unknown as Env['DB'], chay }
}


const MOC = { moNguoi: 11, moAm: 3, goiMoLai: 1, nopSaiAm: 2, nopDungAm: 2, nopNguoi: 4 }

it('mở câu / nộp của Sửa lỗi: số đợt chờ D1 nối tiếp không vượt mốc', async () => {
  const d = taoD1That()
  const token = await seedChua(d.env)
  const bo = boDemDot(d.env.DB)
  const env = { ...d.env, DB: bo.db } as Env
  const goi = async (duong: string, than: Record<string, unknown>) => {
    const viecPhu: Promise<unknown>[] = []
    const ctx = { waitUntil: (p: Promise<unknown>) => { viecPhu.push(p) }, passThroughOnException() {} }
    return bo.chay(async () => {
      const r = await worker.fetch(new Request('https://test' + duong, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...than, token }) }), env, ctx as never)
      return (await r.json()) as Record<string, any>
    }, viecPhu)
  }
  const dot: Record<string, number> = {}
  const a = await goi('/hs/chua-cau-sai/mo-dot', { qid: Q, gon: true }); dot.moNguoi = a.dot
  expect(a.kq.gon?.ok).toBe(true)
  const dotId = a.kq.dotId as string
  const b = await goi('/hs/chua-cau-sai/mo-dot', { qid: Q, gon: true }); dot.moAm = b.dot
  expect(b.kq.gon?.ok).toBe(true)
  const c = await goi('/hs/chua-cau-sai/gon-nop', { dotId, ban: Q, traLoi: '40', khoa: 'k1', qid: Q }); dot.nopSaiAm = c.dot
  expect(c.kq).toMatchObject({ ok: true, dung: false, ket: 'goi_y' })
  const e = await goi('/hs/chua-cau-sai/gon-mo', { dotId, qid: Q }); dot.goiMoLai = e.dot
  expect(e.kq.ok).toBe(true)
  const f = await goi('/hs/chua-cau-sai/gon-nop', { dotId, ban: Q, traLoi: '24', khoa: 'k2', qid: Q }); dot.nopDungAm = f.dot
  expect(f.kq).toMatchObject({ ok: true, dung: true })
  xoaMoiDem() // isolate vừa dậy: đệm trống
  const g = await goi('/hs/chua-cau-sai/gon-nop', { dotId, ban: Q, traLoi: '40', khoa: 'k3', qid: Q }); dot.nopNguoi = g.dot
  expect(g.kq.ok).toBe(true)
  const vuot = Object.entries(MOC).filter(([k, m]) => dot[k]! > m).map(([k, m]) => `${k}: ${dot[k]} đợt (mốc ${m})`)
  const ha = Object.entries(MOC).filter(([k, m]) => dot[k]! < m).map(([k, m]) => `${k}: ${dot[k]} < ${m}`)
  if (ha.length) console.info(`Nhanh hơn mốc — hạ MOC trong tests/toc-do-sua-cau-2910.test.ts: ${ha.join(' · ')}`)
  expect(vuot, 'CHẬM HƠN bản trước — làm lại cho nhanh bằng/hơn rồi mới đẩy').toEqual([])
})
