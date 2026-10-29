// @vitest-environment node
// LỖI 14/10 15h (thầy, ảnh màn em: "Chặng học của em — Em đã hoàn thành phần được xếp hôm nay…" trong khi vòng tròn còn 1 câu): "học sinh còn 1 câu nhưng
// app ko cho làm, sửa triệt để nhé". Đo D1 thật 21:40 (workflow do-goi7-chang-rong-1410): 3 em 23/24, kế hoạch còn ĐÚNG 1 câu ôn/sửa — câu ấy đang NGHI
// SAI ĐÁP ÁN. Nguyên nhân gốc: cổng phát câu (`chanKhacKhoiEm`) loại câu nghi, kế hoạch chỉ xét câu nghi cho câu gói CHƯA gặp; kế hoạch xếp vừa đúng phần
// còn lại của mức nên một câu không phát được là chặng rỗng. Khoá:
//  · câu ôn/sửa đang nghi KHÔNG vào kế hoạch; em còn thiếu mức thì mở chặng vẫn có câu khác;
//  · câu vừa làm ≤ 15 phút (lượt lướt chưa tính) không vào kế hoạch sửa/ôn — cùng luật lúc phát;
//  · BẤT BIẾN: câu kế hoạch nào lúc phát không phát được (lý do kế hoạch không lường trước) ⇒ chặng đi tiếp hàng chờ dự phòng, không rỗng khi còn câu.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { taoKhoOmni, themChienDich, lam } from './omni-3-ke-hoach-chung'
import { dongBoGoi7, lapGoi7, startGoi7 } from '../server/src/goi-bai-7'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemCauNghi } from '../server/src/chan-khac-khoi'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import type { Env } from '../server/src/kieu'

const NOW = Date.parse('2026-10-13T13:10:00Z') // 20:10 giờ VN
const NGAY = 24 * 3600_000
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaDemCauNghi() })

async function kho() {
  const k = taoKhoOmni({ 'DH-B8': 60 }, 2)
  for (const q of SQL_BANG_HANH_TRINH) k.d.sql.exec(q)
  await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`UPDATE hoc_sinh SET lop='12', ten_lop=NULL;
    INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8',60,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x');
    CREATE TABLE IF NOT EXISTS cau_nghi_dap_an (qid TEXT PRIMARY KEY, so_lan INTEGER NOT NULL, so_sai INTEGER NOT NULL, ty_le_sai REAL NOT NULL, trang_thai TEXT NOT NULL DEFAULT 'nghi', ghi_chu TEXT, luc TEXT NOT NULL)`)
  k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
    .run('amine', '12 - Lớp Thường', 'B8', 'Bài 8', 8, '["DH-B8"]', '2026-10-12T11:00:00Z')
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: k.qids('DH-B8'), maDe: ['DH-B8'], sbd: ['S1', 'S2'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, NOW)
  return k
}
type KetQua = { questions: { qid: string }[]; message?: string; goi7?: { daLamHomNay: number; toiThieu: number } }

/** Hôm qua em làm sai một câu gói (⇒ hôm nay câu ấy là việc SỬA/ÔN), hôm nay làm đúng M − 1 câu khác của kế hoạch ⇒ còn ĐÚNG 1 câu, rơi vào câu sửa/ôn ấy. */
async function con1CauSua(k: Awaited<ReturnType<typeof kho>>) {
  const x = k.qids('DH-B8')[0]!
  await lam(k.env, 'S1', x, NOW - NGAY, false, { cauVersion: 'v1' })
  const lap0 = (await lapGoi7(k.env, 'S1', NOW))!
  const viecX = lap0.plan.viec.find((v) => v.qid === x)
  expect(viecX?.vai, 'tiền đề: câu sai hôm qua là việc sửa/ôn hôm nay').toMatch(/^(sua|on)$/)
  const khac = lap0.plan.viec.map((v) => v.qid).filter((q) => q !== x).slice(0, lap0.toiThieu - 1)
  let t = NOW - 3 * 3600_000
  for (const q of khac) await lam(k.env, 'S1', q, (t += 60_000), true, { cauVersion: 'v1' })
  const lap1 = (await lapGoi7(k.env, 'S1', NOW))!
  expect(lap1.daLamNgay, 'tiền đề: còn đúng 1 câu').toBe(lap1.toiThieu - 1)
  expect(lap1.plan.viec.map((v) => `${v.qid}:${v.vai}`), 'tiền đề: câu cuối là câu sửa/ôn').toEqual([`${x}:${viecX!.vai}`])
  return { x, toiThieu: lap1.toiThieu }
}

it('ca thật 14/10: còn 1 câu, câu ấy (sửa/ôn) đang NGHI SAI ĐÁP ÁN ⇒ kế hoạch thay câu khác, mở chặng CÓ câu (trước: rỗng, "Em đã hoàn thành…")', async () => {
  const k = await kho()
  const { x, toiThieu } = await con1CauSua(k)
  k.d.sql.prepare("INSERT INTO cau_nghi_dap_an(qid,so_lan,so_sai,ty_le_sai,trang_thai,luc) VALUES(?,9,9,1,'nghi','x')").run(x)
  xoaDemCauNghi()
  const r = (await startGoi7(k.env, 'S1', NOW)) as KetQua
  expect(r.questions.length, r.message).toBeGreaterThan(0)
  expect(r.questions.map((q) => q.qid)).not.toContain(x)
  expect(r.goi7?.daLamHomNay).toBe(toiThieu - 1)
  const lap = (await lapGoi7(k.env, 'S1', NOW))!
  expect(lap.chan.has(x)).toBe(true)
  expect(lap.plan.viec.map((v) => v.qid)).not.toContain(x)
  expect(lap.plan.viec.length).toBe(1) // vẫn đủ phần còn lại của mức bằng câu khác
})

// 29/10: lượt LƯỚT là câu em đã được phát + đã trả lời ⇒ tính vào mức hôm nay (Lộ trình / chặng khớp những gì em đã làm). Câu ấy KHÔNG quay lại kế hoạch; mức đủ ⇒ chặng rỗng đúng («đã hoàn thành»).
it('câu vừa trả lời ≤ 15 phút mà lượt LƯỚT: không quay lại kế hoạch sửa/ôn, được tính vào mức — kế hoạch và lúc phát cùng luật', async () => {
  const k = await kho()
  const { x } = await con1CauSua(k)
  const luc = NOW - 60_000
  k.d.sql.prepare('INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,?,?,?,?,?,?)').run(`p|${x}`, 'S1', 'p', x, `g-${x}`, '{}', new Date(luc).toISOString())
  await ghiSuKien(k.env, [{ nguon: 'game', maNguon: 'p', sbd: 'S1', qid: x, lan: 1, ketQua: null, luc: new Date(luc).toISOString(), maDang: '', chuyenDe: '', mucDo: '', attemptId: `p|${x}`, assistance: 'none', purpose: 'luot', receivedAt: luc }] as never)
  const lap = (await lapGoi7(k.env, 'S1', NOW))!
  expect(lap.vuaLam.has(x)).toBe(true)
  expect(lap.plan.viec.map((v) => v.qid)).not.toContain(x)
  expect(lap.daLamNgay, 'lướt tính vào mức: câu cuối vừa làm ⇒ đủ mức').toBe(lap.toiThieu)
  const r = (await startGoi7(k.env, 'S1', NOW)) as KetQua
  expect(r.questions.map((q) => q.qid)).not.toContain(x)
})

it('BẤT BIẾN: MỌI câu kế hoạch lúc phát không đọc được (thầy vừa sửa/rút câu…) mà em còn thiếu mức ⇒ chặng đi tiếp hàng chờ dự phòng, có câu', async () => {
  const k = await kho()
  const lap = (await lapGoi7(k.env, 'S1', NOW))!
  const ke = new Set(lap.plan.viec.map((v) => v.qid))
  expect(ke.size).toBe(lap.toiThieu)
  // Bộ bọc D1: câu đọc theo ref của MỌI câu kế hoạch trả "không có" (như câu vừa bị rút khỏi chỉ mục ngay giữa lập kế hoạch và phát).
  const goc = k.env.DB as unknown as { prepare(q: string): { bind(...a: unknown[]): unknown } }
  const env = { ...k.env, DB: { ...k.env.DB, batch: (k.env.DB as unknown as { batch: unknown }).batch, prepare: (q: string) => {
    const st = goc.prepare(q)
    if (!/FROM game_v2_question q JOIN de_kho d ON d\.ma_de=q\.ma_de JOIN game_v2_index g .* WHERE q\.ma_de=\? AND q\.qid=\? AND q\.version=\?/.test(q)) return st
    return { bind: (...a: unknown[]) => (ke.has(String(a[1])) ? { first: async () => null, all: async () => ({ results: [] }) } : st.bind(...a)) }
  } } } as unknown as Env
  const r = (await startGoi7(env, 'S1', NOW)) as KetQua
  expect(r.questions.length, r.message).toBe(6)
  expect(r.questions.filter((q) => ke.has(q.qid))).toEqual([])
})

it('đủ mức rồi mà kế hoạch không phát được câu nào ⇒ KHÔNG mở thêm từ hàng chờ dự phòng (dự phòng chỉ dành cho em còn thiếu mức)', async () => {
  const k = await kho()
  const lap0 = (await lapGoi7(k.env, 'S1', NOW))!
  let t = NOW - 3 * 3600_000
  for (const v of lap0.plan.viec) await lam(k.env, 'S1', v.qid, (t += 60_000), true, { cauVersion: 'v1' })
  const lap = (await lapGoi7(k.env, 'S1', NOW))!
  expect(lap.daLamNgay).toBe(lap.toiThieu)
  expect(lap.plan.viec).toEqual([])
  const r = (await startGoi7(k.env, 'S1', NOW)) as KetQua
  expect(r.questions).toEqual([])
})
