// @vitest-environment node
// MỞ CHẶNG DÙNG LẠI KẾ HOẠCH SẢNH VỪA LẬP (19/10 — thầy 16/10 "phần này load lâu quá…", 19/10 "tiếp tục hoàn thiện tốc độ đỉnh cao nhất, ổn định nhất").
// Khoá:
//   · sảnh rồi mở chặng trong 15 giây (app mở chặng TRƯỚC ngay sau sảnh) ⇒ KHÔNG lập lại kế hoạch (ít lệnh D1 hẳn) và ra ĐÚNG bộ câu như lập lại từ đầu;
//   · giữa hai lệnh em vừa trả lời một câu (máy khác / isolate khác — bản nhớ không biết) ⇒ đọc lại "vừa làm" lệch ⇒ lập lại, KHÔNG phát lại câu vừa làm;
//   · lệnh khác của em (vd đếm hôm nay, nộp câu) xoá bản nhớ; quá 15 giây ⇒ lập lại như cũ.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { taoKhoOmni, themChienDich } from './omni-3-ke-hoach-chung'
import { dongBoGoi7 } from '../server/src/goi-bai-7'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich, xoaDemMetaCau } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemChanKhoi } from '../server/src/chan-khac-khoi'
import { gameToken } from '../server/src/game-v2-auth'
import { NHO_KE_HOACH_MS } from '../server/src/goi-bai-7-nho'
import type { Env } from '../server/src/kieu'

const NOW = Date.parse('2026-10-12T13:30:00Z') // 20:30 giờ VN
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaDemChanKhoi(); xoaDemMetaCau() })

async function kho() {
  const k = taoKhoOmni({ 'DH-B8': 24 }, 3)
  for (const q of SQL_BANG_HANH_TRINH) k.d.sql.exec(q)
  await damBaoBangBaiDaDay(k.env)
  const b8 = k.qids('DH-B8')
  k.d.sql.exec(`UPDATE hoc_sinh SET lop='12', ten_lop=NULL, mat_khau='mk';
    INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8. Amine',24,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
  k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
    .run('amine', '12 - Lớp Thường', 'B8', 'Bài 8. Amine', 8, '["DH-B8"]', '2026-10-11T11:00:00Z')
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: b8, maDe: ['DH-B8'], sbd: ['S1'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, NOW)
  // Đếm lệnh D1 đã chạy (first/all/run + từng lệnh trong batch).
  const dem = { n: 0 }
  const goc = k.env.DB as unknown as { prepare(q: string): Record<string, (...a: unknown[]) => unknown>; batch(ds: unknown[]): Promise<unknown> }
  const boc = (st: Record<string, (...a: unknown[]) => unknown>): Record<string, unknown> => new Proxy(st, {
    get(t, p) {
      const v = Reflect.get(t, p) as unknown
      if (p === 'bind') return (...a: unknown[]) => boc((v as (...x: unknown[]) => Record<string, (...a: unknown[]) => unknown>).apply(t, a))
      if (p === 'first' || p === 'all' || p === 'run' || p === 'raw') return (...a: unknown[]) => { dem.n++; return (v as (...x: unknown[]) => unknown).apply(t, a) }
      return typeof v === 'function' ? (v as (...x: unknown[]) => unknown).bind(t) : v
    },
  })
  const db = new Proxy(goc, {
    get(t, p) {
      if (p === 'prepare') return (q: string) => boc(t.prepare(q))
      if (p === 'batch') return (ds: unknown[]) => { dem.n += ds.length; return t.batch(ds) }
      const v = Reflect.get(t, p) as unknown
      return typeof v === 'function' ? (v as (...x: unknown[]) => unknown).bind(t) : v
    },
  })
  const env = { ...k.env, DB: db } as unknown as Env
  return { k, env, dem, token: await gameToken(k.env, 'S1') }
}
type Kho = Awaited<ReturnType<typeof kho>>
async function goi(x: Kho, lenh: string, than: Record<string, unknown> = {}) {
  const ctx = { waitUntil: (p: Promise<unknown>) => { void p.catch(() => {}) }, passThroughOnException() {} }
  const res = await worker.fetch(new Request(`https://test/game-v2/${lenh}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...than, token: x.token }) }), x.env, ctx as never)
  return (await res.json()) as Record<string, unknown>
}
const qids = (r: Record<string, unknown>) => ((r.questions as { qid: string }[] | undefined) ?? []).map((q) => q.qid)
async function moChang(x: Kho, sau: number) {
  vi.setSystemTime(NOW + sau)
  const truoc = x.dem.n
  const r = await goi(x, 'hoc-tap-start')
  return { r, lenh: x.dem.n - truoc }
}

it('sảnh rồi mở chặng ngay ⇒ không lập lại kế hoạch, cùng bộ câu với lập lại từ đầu', async () => {
  const x = await kho()
  // Lượt 1 — LẬP LẠI TỪ ĐẦU (như trước 19/10): sảnh, một lệnh khác xoá bản nhớ, rồi mở chặng.
  expect((await goi(x, 'hoc-tap-sanh')).ok).toBe(true)
  vi.setSystemTime(NOW + 400)
  await goi(x, 'hoc-tap-dem')
  const lapLai = await moChang(x, 800)
  // Lượt 2 — cùng trạng thái (bỏ phiên vừa cấp): sảnh rồi mở chặng NGAY ⇒ dùng lại kế hoạch sảnh.
  x.k.d.sql.exec('DELETE FROM game_v2_session')
  vi.setSystemTime(NOW + 1000)
  expect((await goi(x, 'hoc-tap-sanh')).ok).toBe(true)
  const dungLai = await moChang(x, 1800)
  expect(dungLai.r.ok, JSON.stringify(dungLai.r).slice(0, 200)).toBe(true)
  expect(qids(dungLai.r).length).toBeGreaterThan(0)
  expect(qids(dungLai.r)).toEqual(qids(lapLai.r))
  expect(dungLai.r.goi7).toEqual(lapLai.r.goi7)
  expect(dungLai.lenh).toBeLessThan(lapLai.lenh / 2)
  console.info(`mở chặng sau sảnh: ${dungLai.lenh} lệnh D1 (lập lại từ đầu: ${lapLai.lenh})`)
})

it('giữa sảnh và mở chặng em vừa trả lời một câu (isolate khác) ⇒ lập lại, không phát lại câu vừa làm', async () => {
  const x = await kho()
  const s = await goi(x, 'hoc-tap-sanh')
  expect(s.ok).toBe(true)
  // Lượt mở chặng "lạnh" để biết câu đầu kế hoạch sẽ phát (rồi xoá phiên để mở chặng sau lập phiên mới).
  const dau = await moChang(x, 200)
  const q0 = qids(dau.r)[0]!
  x.k.d.sql.exec('DELETE FROM game_v2_session')
  vi.setSystemTime(NOW + 300)
  await goi(x, 'hoc-tap-sanh') // sảnh lần hai nhớ kế hoạch (q0 chưa làm)
  // Một lượt trả lời q0 ghi thẳng (máy khác / isolate khác — không đi qua isolate này nên bản nhớ không bị xoá).
  x.k.d.sql.prepare('INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,?,?,?,?,?,?)')
    .run('khac|' + q0, 'S1', 'khac', q0, 'g', '{}', new Date(NOW + 400).toISOString())
  const sau = await moChang(x, 600)
  expect(sau.r.ok).toBe(true)
  expect(qids(sau.r)).not.toContain(q0)
  expect(sau.lenh).toBeGreaterThan(dau.lenh / 2) // đã lập lại kế hoạch
})

it('quá 15 giây sau sảnh ⇒ lập lại như cũ', async () => {
  const x = await kho()
  await goi(x, 'hoc-tap-sanh')
  const tre = await moChang(x, NHO_KE_HOACH_MS + 1000)
  x.k.d.sql.exec('DELETE FROM game_v2_session')
  vi.setSystemTime(NOW + NHO_KE_HOACH_MS + 2000)
  await goi(x, 'hoc-tap-sanh')
  const ngay = await moChang(x, NHO_KE_HOACH_MS + 2500)
  expect(tre.r.ok).toBe(true)
  expect(ngay.lenh).toBeLessThan(tre.lenh / 2)
})
