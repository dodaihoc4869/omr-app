// @vitest-environment node
// CHẤM NHANH «Kiểm tra» (thầy 28/10: «Bấm kiểm tra vẫn bị chậm, chưa tức thì ngay») — server/src/cham-nhanh.ts + nop-luong.ts.
// Khoá TÍNH ĐÚNG của đường đệm: dòng 1 (đúng / sai từ bộ nhớ, 0 đợt D1) luôn khớp dòng 2 (phản hồi `answer` đầy đủ, ghi một lần); không chấm nhanh khi đệm thiếu /
// hỏng, sai phiên (token em khác), phiên hết hạn, câu đang bảo vệ ca thi, câu đã có biên nhận (nộp lại ⇒ bản đã lưu); đáp án đã xuống máy thì nộp lại đáp án khác
// vẫn chấm theo lần đầu. Số đợt D1 tới dòng 1 khoá ở cổng tốc độ (toc-do-may-chu-nop-2710, mốc mayChuNop.nop-cau-luong = 0).
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
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
import { nhoBaoVe, nhoDaLo, xoaChamNhanh } from '../server/src/cham-nhanh'
import type { Env } from '../server/src/kieu'

const NOW = Date.parse('2026-10-12T13:30:00Z')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW); xoaChamNhanh() })
afterEach(() => { vi.useRealTimers(); xoaChamNhanh(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaDemChanKhoi(); xoaDemMetaCau() })

async function kho() {
  const k = taoKhoOmni({ 'DH-B8': 24 }, 3)
  for (const q of SQL_BANG_HANH_TRINH) k.d.sql.exec(q)
  for (const q of SQL_SAN_SANG) k.d.sql.exec(q)
  k.d.sql.exec('CREATE TABLE IF NOT EXISTS chien_dich_em (chien_dich_id TEXT NOT NULL, sbd TEXT NOT NULL, them_luc TEXT, bot_luc TEXT, PRIMARY KEY (chien_dich_id, sbd))')
  await damBaoBangBaiDaDay(k.env)
  const b8 = k.qids('DH-B8')
  k.d.sql.exec(`UPDATE hoc_sinh SET lop='12', ten_lop=NULL, mat_khau='mk';
    INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8. Amine',24,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
  k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
    .run('amine', '12 - Lớp Thường', 'B8', 'Bài 8. Amine', 8, '["DH-B8"]', '2026-10-11T11:00:00Z')
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: b8, maDe: ['DH-B8'], sbd: ['S1', 'S2'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, NOW)
  return { k, env: k.env as Env, token: await gameToken(k.env as Env, 'S1'), token2: await gameToken(k.env as Env, 'S2') }
}
type Kho = Awaited<ReturnType<typeof kho>>

/** Gọi một lệnh qua cửa thật; xả mọi việc nền (`ctx.waitUntil`). `luong` ⇒ đọc NDJSON: [dòng…]; JSON thường ⇒ [một khối] + `json: true`. */
async function goi(x: Kho, lenh: string, than: Record<string, unknown>, token = x.token) {
  const nen: Promise<unknown>[] = []
  const ctx = { waitUntil: (p: Promise<unknown>) => { nen.push(p) }, passThroughOnException() {} }
  const res = await worker.fetch(new Request(`https://test/game-v2/${lenh}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...than, token }) }), x.env, ctx as never)
  const luong = /ndjson/.test(res.headers.get('content-type') ?? '')
  const chu = await res.text()
  for (let i = 0; i < nen.length; i++) await nen[i]!.catch(() => null)
  const dong = luong ? chu.trim().split('\n').map((d) => JSON.parse(d) as Record<string, unknown>) : [JSON.parse(chu) as Record<string, unknown>]
  return { luong, dong, cuoi: dong[dong.length - 1]! }
}
const traLoi = (phan: string, dung: boolean) => phan === 'I' ? (dung ? 'B' : 'A') : phan === 'II' ? (dung ? 'DSDS' : 'DSDD') : dung ? '4' : '5'

async function moChang(x: Kho) {
  const s = await goi(x, 'hoc-tap-start', {})
  expect(s.cuoi.ok, JSON.stringify(s.cuoi).slice(0, 200)).toBe(true)
  const ds = s.cuoi.questions as { qid: string; phan: string }[]
  expect(ds.length).toBeGreaterThanOrEqual(5)
  return { id: s.cuoi.id as string, ds }
}
const nop = (x: Kho, id: string, c: { qid: string; phan: string }, dung: boolean, them: Record<string, unknown> = {}, token = x.token) =>
  goi(x, 'answer', { session: id, qid: c.qid, answer: traLoi(c.phan, dung), assisted: false, msLam: 30_000, luong: 1, ...them }, token)

it('mở chặng nạp sẵn phiên + câu + phạm vi + câu bảo vệ ⇒ câu ĐẦU đã chấm nhanh; mọi câu: dòng 1 khớp dòng 2, ghi đúng một lần', async () => {
  const x = await kho()
  const { id, ds } = await moChang(x)
  for (const [i, dung] of [[0, true], [1, false], [2, true], [3, false]] as const) {
    vi.setSystemTime(NOW + 60_000 * (i + 1))
    const r = await nop(x, id, ds[i]!, dung)
    expect(r.luong, `câu ${i}: ${JSON.stringify(r.cuoi).slice(0, 160)}`).toBe(true)
    expect(r.dong.length).toBe(2)
    const [d1, d2] = r.dong as [Record<string, unknown>, Record<string, unknown>]
    expect(d1.tam).toBe(true); expect(d1.correct).toBe(dung); expect(d2.ok).toBe(true); expect(d2.correct).toBe(dung)
    expect(d1.answer).toBe(d2.answer); expect(d1.traLoi).toBe(d2.traLoi)
    expect(JSON.stringify(d1.solution)).toBe(JSON.stringify(d2.solution))
    expect(x.k.d.dem('game_v2_attempt', `id='${id}|${ds[i]!.qid}'`)).toBe(1)
  }
})

it('nộp lại câu đã chấm (đáp án khác) ⇒ không chấm nhanh, trả bản đã lưu; đáp án đã xuống máy ⇒ lượt chấm lại dùng đáp án lần ấy', async () => {
  const x = await kho()
  const { id, ds } = await moChang(x)
  vi.setSystemTime(NOW + 30_000); await nop(x, id, ds[0]!, true)
  vi.setSystemTime(NOW + 60_000); const sai = await nop(x, id, ds[1]!, false)
  expect(sai.luong).toBe(true)
  vi.setSystemTime(NOW + 61_000); const lai = await nop(x, id, ds[1]!, true)
  expect(lai.luong).toBe(false); expect(lai.cuoi.correct).toBe(false); expect(lai.cuoi.replayed).toBe(true)
  // Dòng 1 đã đi mà lượt ghi chưa xong (giả: chỉ nhớ đáp án đã lộ) ⇒ lượt nộp kế của câu ấy chấm theo đáp án đã lộ, không theo đáp án mới.
  nhoDaLo(`${id}|${ds[2]!.qid}`, traLoi(ds[2]!.phan, false))
  vi.setSystemTime(NOW + 90_000); const lo = await nop(x, id, ds[2]!, true, { luong: 0 })
  expect(lo.cuoi.ok).toBe(true); expect(lo.cuoi.correct).toBe(false)
})

it('sai phiên (token em khác) / phiên hết hạn / đệm hỏng / câu đang bảo vệ ca thi ⇒ không chấm nhanh, lời báo như cũ', async () => {
  const x = await kho()
  ;(x.env as unknown as Record<string, unknown>).TAT_TAM_SOM = '1' // khoá nguồn «dòng 1 sớm từ đường thường» (29/10): ca này khoá đường ĐỆM; đường sớm có ca riêng bên dưới
  const { id, ds } = await moChang(x)
  vi.setSystemTime(NOW + 30_000); await nop(x, id, ds[0]!, true)
  // em khác cầm mã phiên của S1
  await goi(x, 'hoc-tap-start', {}, x.token2)
  vi.setSystemTime(NOW + 40_000); const la = await nop(x, id, ds[1]!, true, {}, x.token2)
  expect(la.luong).toBe(false); expect(la.cuoi.ok).toBe(false)
  // câu đang bảo vệ ca thi (tập bảo vệ của isolate có câu này)
  nhoBaoVe(new Set([ds[1]!.qid]))
  vi.setSystemTime(NOW + 50_000); const bv = await nop(x, id, ds[1]!, true)
  expect(bv.luong).toBe(false)
  // đệm hỏng / mất (isolate mới) ⇒ đường thường, kết quả đúng
  xoaChamNhanh()
  vi.setSystemTime(NOW + 70_000); const moi = await nop(x, id, ds[2]!, true)
  expect(moi.luong).toBe(false); expect(moi.cuoi.ok).toBe(true); expect(moi.cuoi.correct).toBe(true)
  // phiên hết hạn (2 giờ) ⇒ không chấm nhanh; máy chủ báo hết hạn như cũ
  vi.setSystemTime(NOW + 2 * 3_600_000 + 1000); const het = await nop(x, id, ds[3]!, true)
  expect(het.luong).toBe(false); expect(het.cuoi.ok).toBe(false)
})

it('token giả / hết hạn ⇒ không chấm nhanh, không chạm đệm', async () => {
  const x = await kho()
  const { id, ds } = await moChang(x)
  vi.setSystemTime(NOW + 30_000); await nop(x, id, ds[0]!, true)
  vi.setSystemTime(NOW + 40_000); const gia = await nop(x, id, ds[1]!, true, {}, x.token.slice(0, -2) + 'xx')
  expect(gia.luong).toBe(false); expect(gia.cuoi.ok).toBe(false)
})

// DÒNG 1 SỚM TỪ ĐƯỜNG THƯỜNG (29/10, thầy «Bấm kiểm tra vẫn chưa tức thì»): đệm isolate trượt ⇒ lệnh đầy đủ gửi dòng 1 ngay khi chấm xong sau đợt đọc đầu.
it('đệm trượt (isolate mới) ⇒ vẫn theo luồng: dòng 1 (đúng / sai) TRƯỚC, dòng 2 đầy đủ; dòng 1 khớp dòng 2; ghi đúng một lần', async () => {
  const x = await kho()
  const { id, ds } = await moChang(x)
  for (const [i, dung] of [[0, true], [1, false], [2, true], [3, false]] as const) {
    xoaChamNhanh() // isolate không có gì trong đệm
    vi.setSystemTime(NOW + 60_000 * (i + 1))
    const r = await nop(x, id, ds[i]!, dung)
    expect(r.luong, `câu ${i}: ${JSON.stringify(r.cuoi).slice(0, 160)}`).toBe(true)
    expect(r.dong.length).toBe(2)
    const [d1, d2] = r.dong as [Record<string, unknown>, Record<string, unknown>]
    expect(d1.tam).toBe(true); expect(d1.correct).toBe(dung); expect(d2.ok).toBe(true); expect(d2.correct).toBe(dung)
    expect(d1.answer).toBe(d2.answer); expect(d1.traLoi).toBe(d2.traLoi)
    expect(JSON.stringify(d1.solution)).toBe(JSON.stringify(d2.solution))
    expect(x.k.d.dem('game_v2_attempt', `id='${id}|${ds[i]!.qid}'`)).toBe(1)
  }
})
it('đường sớm: lỗi trước khi chấm (phiên hết hạn / sai phiên / token giả) ⇒ JSON thường với lời báo + mã trạng thái như cũ, không dòng 1', async () => {
  const x = await kho()
  const { id, ds } = await moChang(x)
  xoaChamNhanh()
  await goi(x, 'hoc-tap-start', {}, x.token2)
  vi.setSystemTime(NOW + 40_000); const la = await nop(x, id, ds[1]!, true, {}, x.token2)
  expect(la.luong).toBe(false); expect(la.cuoi.ok).toBe(false)
  vi.setSystemTime(NOW + 2 * 3_600_000 + 1000); const het = await nop(x, id, ds[3]!, true)
  expect(het.luong).toBe(false); expect(het.cuoi.ok).toBe(false)
})
it('công tắc TAT_TAM_SOM ⇒ đệm trượt đi JSON thường như trước; TAT_NOP_LUONG ⇒ tắt cả hai nguồn', async () => {
  const x = await kho()
  const { id, ds } = await moChang(x)
  xoaChamNhanh()
  ;(x.env as unknown as Record<string, unknown>).TAT_TAM_SOM = '1'
  vi.setSystemTime(NOW + 60_000); const a = await nop(x, id, ds[0]!, true)
  expect(a.luong).toBe(false); expect(a.cuoi.ok).toBe(true); expect(a.cuoi.correct).toBe(true)
  ;(x.env as unknown as Record<string, unknown>).TAT_TAM_SOM = ''
  ;(x.env as unknown as Record<string, unknown>).TAT_NOP_LUONG = '1'
  vi.setSystemTime(NOW + 120_000); const b = await nop(x, id, ds[1]!, false)
  expect(b.luong).toBe(false); expect(b.cuoi.ok).toBe(true); expect(b.cuoi.correct).toBe(false)
})
