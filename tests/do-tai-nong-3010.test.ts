// @vitest-environment node
// ĐO CHI PHÍ D1 CỦA LỆNH NÓNG VỚI DỮ LIỆU CỠ THẬT (thầy 30/10 21:50: «máy chủ chịu được hàng trăm nghìn học sinh mà tối nào có 200 hs làm cũng kêu lag»).
// Bản đo giờ cao điểm 30/10: D1 chính bận 2938 s / 2,5 giờ; nhiều câu đọc ĐỌC LẠI CẢ LỊCH SỬ em (1.256–20.000 dòng / lần). Test đếm-đợt hiện có
// (toc-do-may-chu-lenh-nong-1310) chạy kho tí hon ⇒ không thấy. Tệp này nạp kho cỡ thật (3.000 câu, 300 em × 1.500 sự kiện) rồi đo TỪNG lệnh:
// số câu SQL, tổng ms SQLite (cùng máy SQLite như D1), câu nặng nhất. Chạy: DO_TAI=1 npx vitest run tests/do-tai-nong-3010.test.ts
import { afterEach, beforeEach, it, vi } from 'vitest'
import worker from '../server/src/index'
import { taoKhoOmni, themChienDich } from './omni-3-ke-hoach-chung'
import { dongBoGoi7 } from '../server/src/goi-bai-7'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { SQL_SAN_SANG } from '../server/src/san-sang'
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

function napKhoLon() {
  const so: Record<string, number> = { 'DH-B8': 24 }
  for (let i = 0; i < SO_DE; i++) so[`DH-X${i}`] = CAU_MOI_DE
  const k = taoKhoOmni(so, 3)
  for (const q of SQL_BANG_HANH_TRINH) k.d.sql.exec(q)
  for (const q of SQL_SAN_SANG) k.d.sql.exec(q)
  k.d.sql.exec('CREATE TABLE IF NOT EXISTS chien_dich_em (chien_dich_id TEXT NOT NULL, sbd TEXT NOT NULL, them_luc TEXT, bot_luc TEXT, PRIMARY KEY (chien_dich_id, sbd))')
  const sql = k.d.sql
  sql.exec(`UPDATE hoc_sinh SET lop='12', ten_lop=NULL, mat_khau='mk'`)
  const de = sql.prepare('INSERT OR IGNORE INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES(?,?,?,0,?)')
  const ix = sql.prepare('INSERT OR IGNORE INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,?,?)')
  for (const maDe of Object.keys(so)) { de.run(maDe, maDe === 'DH-B8' ? 'Bài 8. Amine' : `Đề ${maDe}`, so[maDe]!, 'v1'); ix.run(maDe, 'v1', 'x') }
  sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
  // Lịch sử cỡ thật: SO_EM em, mỗi em SK_MOI_EM sự kiện trải 60 ngày (game 60 % · chua_loi 20 % · thi 10 % · tu_luyen 10 %).
  const qall: string[] = []
  for (const maDe of Object.keys(so)) qall.push(...k.qids(maDe))
  const em = sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc,mat_khau) VALUES(?,?,'12','x','mk')")
  const sk = sql.prepare(`INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,giay,luc,ngay_vn,ma_dang,chuyen_de,muc_do,attempt_id,assistance,visibility,purpose,raw_json,received_at)
    VALUES(?,?,?,?,?,1,?,?,?,?,?,NULL,NULL,?,?,NULL,NULL,?,?)`)
  const at = sql.prepare('INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,?,?,?,?,?,?)')
  let seed = 7
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }
  sql.exec('BEGIN')
  for (let e = 1; e <= SO_EM; e++) {
    const sbd = e <= 3 ? `S${e}` : `E${e}`
    if (e > 3) em.run(sbd, `Em ${e}`)
    for (let j = 0; j < SK_MOI_EM; j++) {
      const qid = qall[Math.floor(rnd() * qall.length)]!
      const t = NOW - Math.floor(rnd() * 60 * 86_400_000) - 86_400_000
      const luc = new Date(t).toISOString(), ngay = new Date(t + 7 * 3_600_000).toISOString().slice(0, 10)
      const r = rnd(), nguon = r < 0.6 ? 'game' : r < 0.8 ? 'chua_loi' : r < 0.9 ? 'thi' : 'tu_luyen'
      const id = `a-${sbd}-${j}`
      sk.run(`k-${sbd}-${j}`, sbd, qid, nguon, nguon === 'game' ? `ss-${sbd}-${j >> 3}` : `m-${j}`, rnd() < 0.7 ? 1 : 0, 20 + Math.floor(rnd() * 90), luc, ngay, `${qid.split('-').slice(0, 2).join('-')}.D${j % 3}`, id, 'tu_lam', JSON.stringify({ tc: 1, tt: 'x', ll: 0 }), t)
      if (nguon === 'game') at.run(id, sbd, `ss-${sbd}-${j >> 3}`, qid, `g-${qid}`, JSON.stringify({ traLoi: 'A', at: luc }), luc)
    }
  }
  sql.exec('COMMIT')
  sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
    .run('amine', '12 - Lớp Thường', 'B8', 'Bài 8. Amine', 8, '["DH-B8"]', '2026-10-11T11:00:00Z')
  sql.exec('ANALYZE')
  return { k, qall }
}

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
