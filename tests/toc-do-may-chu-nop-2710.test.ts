// @vitest-environment node
// NỘP TỨC THÌ (thầy 27/10: «Học sinh kêu bấm nút nộp load chậm lag. Tối ưu tức thì luôn đi»). Cổng MÁY CHỦ cho nút «Kiểm tra» của màn làm chặng (lệnh
// `answer`) và lệnh đếm nhẹ ngay sau mỗi câu (`hoc-tap-dem`) — đo trên kho GIỐNG BẢN SỐNG hơn bộ đo bốn lệnh nóng (toc-do-may-chu-lenh-nong-1310): công tắc
// Kiểm tra ôn tập BẬT (em có lịch kiểm tra ngày kia), em đã có hồ sơ game (không phải lượt tạo hồ sơ lần đầu), đệm cấu hình của isolate đang nóng (em khác
// vừa gọi — giờ cao điểm một isolate phục vụ nhiều em). Cùng cách đếm: số ĐỢT CHỜ D1 NỐI TIẾP trên đường trả lời qua cửa thật `worker.fetch`; việc phụ sau
// phản hồi (`ctx.waitUntil`) không tính. Mốc ở `docs/moc-toc-do.json` mục `mayChuNop`; vượt mốc ⇒ ĐỎ; thấp hơn ⇒ xanh + gợi ý hạ mốc (CHỈ HẠ).
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
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
import { damBaoKtCn } from '../server/src/kiem-tra-ca-nhan-schema'
import { metaKt } from '../server/src/kiem-tra-ca-nhan'
import type { Env } from '../server/src/kieu'

const NOW = Date.parse('2026-10-12T13:30:00Z') // 20:30 giờ VN — giờ cao điểm
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaDemChanKhoi(); xoaDemMetaCau() })

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

/** Kho như bộ đo bốn lệnh nóng (lớp 12 · Bài 8 vừa tick · Gói 7 bật) + Kiểm tra ôn tập BẬT, em S1 có lịch kiểm tra ngày kia (chưa tới: không khoá chặng). */
async function kho() {
  const k = taoKhoOmni({ 'DH-B8': 24 }, 3)
  for (const q of SQL_BANG_HANH_TRINH) k.d.sql.exec(q)
  for (const q of SQL_SAN_SANG) k.d.sql.exec(q) // bảng bản sẵn (san-sang.ts) có sẵn như bản sống
  k.d.sql.exec('CREATE TABLE IF NOT EXISTS chien_dich_em (chien_dich_id TEXT NOT NULL, sbd TEXT NOT NULL, them_luc TEXT, bot_luc TEXT, PRIMARY KEY (chien_dich_id, sbd))') // có ở bản sống
  await damBaoBangBaiDaDay(k.env)
  const b8 = k.qids('DH-B8')
  k.d.sql.exec(`UPDATE hoc_sinh SET lop='12', ten_lop=NULL, mat_khau='mk';
    INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8. Amine',24,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('kiem_tra_ca_nhan_v1','{"bat":true}','x')`)
  k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
    .run('amine', '12 - Lớp Thường', 'B8', 'Bài 8. Amine', 8, '["DH-B8"]', '2026-10-11T11:00:00Z')
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: b8, maDe: ['DH-B8'], sbd: ['S1', 'S2'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await damBaoKtCn(k.env)
  const d = { phienBan: 3, baiNgayToiThieu: 0, lyDo: 'Kiểm tra ôn tập', bai: [{ khoa: 'B8', ten: 'Bài 8. Amine' }], muc: [], cau: [], soPhu: 0, phut: 50, thieu: [], chang: [] }
  k.d.sql.prepare("INSERT INTO kiem_tra_ca_nhan(id,sbd,lop,ngay,mo_luc,han_luc,trang_thai,json,cap_nhat_luc) VALUES('ktcn:S1:2026-10-14','S1','12 - Lớp Thường','2026-10-14',?,?,'hen',?,?)")
    .run(NOW + 2 * 86400000, NOW + 3 * 86400000, JSON.stringify(d), NOW)
  k.d.sql.prepare('INSERT INTO kiem_tra_ca_nhan_meta(id,meta_json) VALUES(?,?)').run('ktcn:S1:2026-10-14', JSON.stringify(metaKt(d as Parameters<typeof metaKt>[0])))
  await dongBoGoi7(k.env, NOW)
  const bo = boDemDot(k.env.DB)
  const env = { ...k.env, DB: bo.db } as Env
  return { env, bo, token: await gameToken(k.env, 'S1'), tokenBan: await gameToken(k.env, 'S2') }
}

async function goi(k: Awaited<ReturnType<typeof kho>>, lenh: string, than: Record<string, unknown>, token = k.token) {
  const viecPhu: Promise<unknown>[] = []
  const ctx = { waitUntil: (p: Promise<unknown>) => { viecPhu.push(p) }, passThroughOnException() {} }
  return k.bo.chay(async () => {
    const res = await worker.fetch(new Request(`https://test/game-v2/${lenh}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...than, token }) }), k.env, ctx as never)
    return (await res.json()) as Record<string, unknown>
  }, viecPhu)
}

/** NỘP THEO LUỒNG (28/10, nop-luong.ts): đo tới DÒNG 1 (đúng / sai) — phần còn lại của luồng đọc NỀN (dòng 2 = phản hồi đầy đủ, ghi trong `ctx.waitUntil`). */
async function goiLuong(k: Awaited<ReturnType<typeof kho>>, than: Record<string, unknown>) {
  const viecPhu: Promise<unknown>[] = []
  const ctx = { waitUntil: (p: Promise<unknown>) => { viecPhu.push(p) }, passThroughOnException() {} }
  let conLai: Promise<string> = Promise.resolve('')
  const r = await k.bo.chay(async () => {
    const res = await worker.fetch(new Request('https://test/game-v2/answer', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...than, luong: 1, token: k.token }) }), k.env, ctx as never)
    if (!/ndjson/.test(res.headers.get('content-type') ?? '')) return { ...(await res.json()) as Record<string, unknown>, __khongLuong: true }
    const doc = res.body!.getReader(), gm = new TextDecoder()
    let dem = ''
    for (;;) { const { value, done } = await doc.read(); if (value) dem += gm.decode(value, { stream: true }); const i = dem.indexOf('\n'); if (i >= 0 || done) { const d1 = dem.slice(0, i >= 0 ? i : undefined); dem = dem.slice(i + 1)
      conLai = (async () => { for (;;) { const x = await doc.read(); if (x.value) dem += gm.decode(x.value, { stream: true }); if (x.done) return dem } })(); return JSON.parse(d1) as Record<string, unknown> } }
  }, viecPhu)
  const du = (await conLai).trim()
  return { ...r, du: du ? JSON.parse(du.split('\n').pop()!) as Record<string, unknown> : null }
}

const MOC = path.resolve(__dirname, '../docs/moc-toc-do.json')
const traLoi = (phan: string, dung: boolean) => phan === 'I' ? (dung ? 'B' : 'A') : phan === 'II' ? (dung ? 'DSDS' : 'DSDD') : dung ? '4' : '5'

it('nút «Kiểm tra» (answer) và lệnh đếm sau câu: số đợt chờ D1 không vượt mốc bản trước', async () => {
  const k = await kho()
  const do_: Record<string, { dot: number; lenh: number }> = {}
  const ghi = (ten: string, r: { kq: Record<string, unknown>; dot: number; lenh: number }) => { expect(r.kq.ok, `${ten}: ${JSON.stringify(r.kq).slice(0, 200)}`).toBe(true); do_[ten] = { dot: r.dot, lenh: r.lenh } }
  // Em khác vừa gọi (giờ cao điểm) ⇒ đệm cấu hình / lớp / phạm vi của isolate đang nóng. Không đo.
  const amCo = async () => { await goi(k, 'hoc-tap-dem', {}, k.tokenBan) }
  const s = await goi(k, 'hoc-tap-start', {})
  expect(s.kq.ok, JSON.stringify(s.kq).slice(0, 200)).toBe(true)
  const ds = s.kq.questions as { qid: string; phan: string }[]
  expect(ds.length).toBeGreaterThanOrEqual(4)
  const nop = (i: number, dung: boolean) => goi(k, 'answer', { session: s.kq.id, qid: ds[i]!.qid, answer: traLoi(ds[i]!.phan, dung), assisted: false, msLam: 30_000 })
  // Câu đầu: lượt tạo hồ sơ game lần đầu (đã đo ở bộ bốn lệnh nóng) — không đo ở đây.
  vi.setSystemTime(NOW + 40_000); await nop(0, true)
  // Câu sai, xác thực còn trong đệm 60 giây (em làm nhanh) — đường ghi lỗi để sửa.
  vi.setSystemTime(NOW + 70_000); await amCo(); const sai = await nop(1, false)
  expect(sai.kq.correct).toBe(false); ghi('nop-cau-sai', sai)
  vi.setSystemTime(NOW + 71_000); ghi('dem-sau-cau', await goi(k, 'hoc-tap-dem', {}))
  // Câu đúng, xác thực còn trong đệm (khoản nguyên tử ghi CÙNG lô chấm).
  vi.setSystemTime(NOW + 100_000); await amCo(); const dung = await nop(2, true)
  expect(dung.kq.correct).toBe(true); ghi('nop-cau-dung', dung)
  // Câu đúng sau hơn 60 giây (đệm xác thực đã trượt ⇒ đọc mật khẩu lại) — trường hợp thường gặp nhất: em đọc đề, tính ~1–2 phút.
  vi.setSystemTime(NOW + 190_000); await amCo(); const lau = await nop(3, true)
  expect(lau.kq.correct).toBe(true); ghi('nop-cau-dung-xac-thuc', lau)
  vi.setSystemTime(NOW + 191_000); ghi('dem-sau-cau-xac-thuc', await goi(k, 'hoc-tap-dem', {}))
  // CHẤM NHANH (thầy 28/10 «bấm kiểm tra vẫn bị chậm, chưa tức thì ngay»): máy em xin `luong: 1` ⇒ đúng / sai về TRƯỚC mọi đợt D1 (phiên, câu, phạm vi, câu bảo vệ
  // từ đệm isolate do các lượt trên nạp); phản hồi đầy đủ (dòng 2) y như `answer` thường. Đo tới dòng 1: 0 đợt. Sau hơn 60 s (đệm xác thực trượt) cũng vậy.
  if (ds[4]) {
    vi.setSystemTime(NOW + 260_000); await amCo()
    const luong = await goiLuong(k, { session: s.kq.id, qid: ds[4].qid, answer: traLoi(ds[4].phan, true), assisted: false, msLam: 30_000 })
    expect(luong.kq.__khongLuong, JSON.stringify(luong.kq).slice(0, 200)).toBeUndefined()
    expect(luong.kq.tam).toBe(true); expect(luong.kq.correct).toBe(true)
    expect(luong.du?.ok, JSON.stringify(luong.du).slice(0, 200)).toBe(true); expect(luong.du?.correct).toBe(true); expect(luong.du?.tam).toBeUndefined()
    ghi('nop-cau-luong', luong)
  }
  // NHANH 27/10 (thầy «nhanh hơn app cũ mọi chỗ»): đồng bộ EXP học tập nền (~3 phút/lần + mỗi lần quay lại tab) — lượt không có gì mới KHÔNG ghi lại hồ sơ;
  // kế hoạch ngày (/hs/ke-hoach-ngay, Sảnh hỏi sớm + làm mới) — lịch Kiểm tra ôn tập đọc cùng đợt mật khẩu.
  vi.setSystemTime(NOW + 300_000); await amCo(); await goi(k, 'academic-sync', {})
  vi.setSystemTime(NOW + 301_000); ghi('dong-bo-exp-lai', await goi(k, 'academic-sync', {}))
  const keHoach = async () => { const viecPhu: Promise<unknown>[] = []; const ctx = { waitUntil: (x: Promise<unknown>) => { viecPhu.push(x) }, passThroughOnException() {} }
    return k.bo.chay(async () => (await (await worker.fetch(new Request('https://test/hs/ke-hoach-ngay', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: k.token }) }), k.env, ctx as never)).json()) as Record<string, unknown>, viecPhu) }
  vi.setSystemTime(NOW + 470_000); await amCo(); ghi('ke-hoach-ngay', await keHoach())
  const moc = JSON.parse(fs.readFileSync(MOC, 'utf8')) as { mayChuNop?: Record<string, { dot: number; lenh: number }> }
  if (process.env.GHI_MOC_TOC_DO) fs.writeFileSync(process.env.GHI_MOC_TOC_DO, JSON.stringify(do_, null, 1))
  const vuot: string[] = [], ha: string[] = [], thieuMoc: string[] = []
  for (const [ten, d] of Object.entries(do_)) {
    const m = moc.mayChuNop?.[ten]
    if (!m) { thieuMoc.push(`"${ten}": { "dot": ${d.dot}, "lenh": ${d.lenh} }`); continue }
    if (d.dot > m.dot) vuot.push(`${ten}: ${d.dot} đợt (mốc ${m.dot})`)
    if (d.lenh > m.lenh) vuot.push(`${ten}: ${d.lenh} lệnh D1 (mốc ${m.lenh})`)
    if (d.dot < m.dot || d.lenh < m.lenh) ha.push(`${ten}: ${d.dot} đợt / ${d.lenh} lệnh (mốc ${m.dot} / ${m.lenh})`)
  }
  if (thieuMoc.length) console.info(`Chưa có mốc — thêm vào docs/moc-toc-do.json mục mayChuNop:\n  ${thieuMoc.join('\n  ')}`)
  if (ha.length) console.info(`Nhanh hơn mốc — hạ mốc trong docs/moc-toc-do.json:\n  ${ha.join('\n  ')}`)
  expect(thieuMoc, 'thiếu mốc mayChuNop').toEqual([])
  expect(vuot, 'CHẬM HƠN bản trước — làm lại cho nhanh bằng/hơn rồi mới đẩy').toEqual([])
})
