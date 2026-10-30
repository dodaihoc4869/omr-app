// @vitest-environment node
// ĐO CHI PHÍ D1 CỦA LỆNH NÓNG VỚI DỮ LIỆU CỠ THẬT (thầy 30/10 21:50: «máy chủ chịu được hàng trăm nghìn học sinh mà tối nào có 200 hs làm cũng kêu lag»).
// Bản đo giờ cao điểm 30/10: D1 chính bận 2938 s / 2,5 giờ; nhiều câu đọc ĐỌC LẠI CẢ LỊCH SỬ em (1.256–20.000 dòng / lần). Test đếm-đợt hiện có
// (toc-do-may-chu-lenh-nong-1310) chạy kho tí hon ⇒ không thấy. Tệp này nạp kho cỡ thật (3.000 câu, 300 em × 1.500 sự kiện) rồi đo TỪNG lệnh:
// số câu SQL, tổng ms SQLite (cùng máy SQLite như D1), câu nặng nhất. Chạy: DO_TAI=1 npx vitest run tests/do-tai-nong-3010.test.ts
import { afterEach, beforeEach, it, vi } from 'vitest'
import worker from '../server/src/index'
import { themChienDich } from './omni-3-ke-hoach-chung'
import { napKhoLon as napKhoLonChung } from './kho-tai-lon'
import { dongBoGoi7 } from '../server/src/goi-bai-7'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich, xoaDemMetaCau } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemChanKhoi } from '../server/src/chan-khac-khoi'
import { gameToken } from '../server/src/game-v2-auth'
import type { Env } from '../server/src/kieu'

const NOW = Date.parse('2026-10-30T13:30:00Z') // 20:30 VN
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaDemChanKhoi(); xoaDemMetaCau() })

const SO_DE = Number(process.env.SO_DE ?? 120), CAU_MOI_DE = 25, SO_EM = Number(process.env.SO_EM ?? 300), SK_MOI_EM = Number(process.env.SK_MOI_EM ?? 1500)

type Do = { q: string; ms: number; n: number }
/** Bọc D1: đo thời gian SQLite của từng câu (first/all/run; lô chia đều theo câu) và số dòng trả về. */
function boDo(goc: Env['DB']) {
  let ghi: Do[] | null = null
  const g = goc as unknown as { prepare(q: string): Record<string, (...a: unknown[]) => unknown>; batch(ds: unknown[]): Promise<{ results?: unknown[] }[]> }
  const that = new WeakMap<object, { st: Record<string, (...a: unknown[]) => unknown>; q: string }>()
  const boc = (st: Record<string, (...a: unknown[]) => unknown>, q: string): Record<string, unknown> => {
    const chay = (ten: string) => async (...a: unknown[]) => {
      const t = performance.now(); const r = await (st[ten] as (...x: unknown[]) => Promise<unknown>)(...a)
      const n = ten === 'all' ? ((r as { results?: unknown[] })?.results?.length ?? 0) : ten === 'first' ? (r ? 1 : 0) : 0
      ghi?.push({ q, ms: performance.now() - t, n }); return r
    }
    const b: Record<string, unknown> = { bind: (...a: unknown[]) => boc(st.bind(...a) as never, q), first: chay('first'), all: chay('all'), run: chay('run'), raw: chay('raw') }
    that.set(b, { st, q })
    return b
  }
  const db: Record<string, unknown> = {
    prepare: (q: string) => { if (ghi && process.env.VET_SO && /^SELECT khoa, sbd, qid, /.test(q) && /FROM su_kien_hoc WHERE sbd IN/.test(q)) console.log('VET', /received_at >= \?/.test(q) ? 'them' : 'CA', new Error().stack?.split('\n').slice(2, 8).map((x) => x.trim().replace(/\(.*server\/src\//, '(')).join(' | ')); return boc(g.prepare(q) as never, q) },
    batch: async (ds: object[]) => {
      const t = performance.now(); const r = await g.batch(ds.map((x) => that.get(x)?.st ?? x)); const ms = (performance.now() - t) / Math.max(1, ds.length)
      ds.forEach((x, i) => ghi?.push({ q: '[lô] ' + (that.get(x)?.q ?? '?'), ms, n: r[i]?.results?.length ?? 0 })); return r
    },
  }
  db.withSession = () => db
  return { db: db as unknown as Env['DB'], batDau: () => { ghi = [] }, ketThuc: () => { const r = ghi ?? []; ghi = null; return r } }
}

// Kho cỡ thật: tách sang tests/kho-tai-lon.ts (31/10) để scripts/thu-tai-50k/sinh-kho.ts dựng D1 thử tải bằng CÙNG cách nạp.
const napKhoLon = () => napKhoLonChung({ now: NOW, soDe: SO_DE, cauMoiDe: CAU_MOI_DE, soEm: SO_EM, skMoiEm: SK_MOI_EM })

const tom = (ds: Do[]) => {
  const g = new Map<string, Do>()
  for (const d of ds) { const key = d.q.replace(/\s+/g, ' ').slice(0, 150); const o = g.get(key) ?? { q: key, ms: 0, n: 0 }; o.ms += d.ms; o.n += d.n; g.set(key, o) }
  return { soCau: ds.length, ms: Math.round(ds.reduce((a, d) => a + d.ms, 0) * 10) / 10, dong: ds.reduce((a, d) => a + d.n, 0), nang: [...g.values()].sort((a, b) => b.ms - a.ms).slice(0, 6) }
}

it.skipIf(!process.env.DO_TAI)('đo chi phí D1 lệnh nóng với kho cỡ thật', async () => {
  const t0 = performance.now()
  const { k } = napKhoLon()
  await damBaoBangBaiDaDay(k.env)
  const b8 = k.qids('DH-B8')
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: b8, maDe: ['DH-B8'], sbd: ['S1'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, NOW)
  console.log(`nạp kho: ${Math.round(performance.now() - t0)} ms · su_kien_hoc=${(k.d.sql.prepare('SELECT COUNT(*) n FROM su_kien_hoc').get() as { n: number }).n}`)
  const bo = boDo(k.env.DB)
  const env = { ...k.env, DB: bo.db } as Env
  const token = await gameToken(k.env, 'S1')
  const goi = async (lenh: string, than: Record<string, unknown>) => {
    const phu: Promise<unknown>[] = []
    const ctx = { waitUntil: (p: Promise<unknown>) => { phu.push(p) }, passThroughOnException() {} }
    bo.batDau()
    const t = performance.now()
    const res = await worker.fetch(new Request(`https://test/game-v2/${lenh}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...than, token }) }), env, ctx as never)
    const kq = (await res.json()) as Record<string, unknown>
    const tuong = performance.now() - t
    await Promise.allSettled(phu)
    const ds = bo.ketThuc()
    const r = tom(ds)
    console.log(`\n== ${lenh} ok=${kq.ok} · tường ${Math.round(tuong)} ms · ${r.soCau} câu SQL · ${r.ms} ms SQLite · ${r.dong} dòng trả`)
    for (const x of r.nang) console.log(`   ${x.ms.toFixed(1).padStart(7)} ms  ${String(x.n).padStart(6)} dòng  ${x.q}`)
    if (process.env.CHI_TIET === lenh) for (const d of ds) console.log(`     · ${d.ms.toFixed(2).padStart(6)} ms ${String(d.n).padStart(5)} dòng  ${d.q.replace(/\s+/g, ' ').slice(0, 170)}`)
    return kq
  }
  await goi('hoc-tap-sanh', {})
  vi.setSystemTime(NOW + 20_000)
  await goi('hoc-tap-sanh', {})
  vi.setSystemTime(NOW + 40_000)
  const s = await goi('hoc-tap-start', {})
  const cau = (s.questions as { qid: string; phan: string }[] | undefined)?.[0]
  if (cau) {
    vi.setSystemTime(NOW + 100_000)
    await goi('answer', { session: s.id, qid: cau.qid, answer: cau.phan === 'I' ? 'A' : cau.phan === 'II' ? 'DSDD' : '4', assisted: false, msLam: 30_000 })
  }
  vi.setSystemTime(NOW + 101_000)
  await goi('hoc-tap-dem', {})
  vi.setSystemTime(NOW + 120_000)
  await goi('hoc-tap-sanh', {})
}, 600_000)
