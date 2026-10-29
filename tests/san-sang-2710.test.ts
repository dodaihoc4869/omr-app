// @vitest-environment node
// SẴN SÀNG (thầy 27/10 «tức thì mọi khung giờ, không sai sót»; Boss: sảnh ≤ 2 đợt D1, mở chặng ≤ 2): Sảnh + chặng kế tiếp lập sẵn NGOÀI đường chờ (sau câu cuối,
// sau Sảnh chậm, cron đêm), dùng khi DẤU khớp (server/src/san-sang.ts). Khoá: số đợt chờ D1 (cổng tốc độ, mục `mayChuSanSang`) VÀ đúng nội dung — Sảnh bản sẵn
// y hệt Sảnh lập lại; dấu đổi (em vừa trả lời, thầy đổi cấu hình) ⇒ không dùng bản cũ; chặng sẵn dùng MỘT lần; không phát lại câu vừa làm.
// (Phần đầu tệp là bộ đo của toc-do-may-chu-nop-2710: NỘP TỨC THÌ (thầy 27/10: «Học sinh kêu bấm nút nộp load chậm lag. Tối ưu tức thì luôn đi»). Cổng MÁY CHỦ cho nút «Kiểm tra» của màn làm chặng (lệnh
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
import { cronSanSangDem, xoaBangVangSanSang } from '../server/src/san-sang'
import { lamMoiNiem, moNiem } from '../server/src/niem-phong'

const NOW = Date.parse('2026-10-12T13:30:00Z') // 20:30 giờ VN — giờ cao điểm
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaBangVangSanSang(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaDemChanKhoi(); xoaDemMetaCau() })

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
  return { env, bo, d: k.d, rawEnv: k.env, token: await gameToken(k.env, 'S1'), tokenBan: await gameToken(k.env, 'S2') }
}

async function goi(k: Awaited<ReturnType<typeof kho>>, lenh: string, than: Record<string, unknown>, token = k.token) {
  const viecPhu: Promise<unknown>[] = []
  const ctx = { waitUntil: (p: Promise<unknown>) => { viecPhu.push(p) }, passThroughOnException() {} }
  return k.bo.chay(async () => {
    const res = await worker.fetch(new Request(`https://test/game-v2/${lenh}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...than, token }) }), k.env, ctx as never)
    return (await res.json()) as Record<string, unknown>
  }, viecPhu)
}

const MOC = path.resolve(__dirname, '../docs/moc-toc-do.json')
const traLoi = (phan: string, dung: boolean) => phan === 'I' ? (dung ? 'B' : 'A') : phan === 'II' ? (dung ? 'DSDS' : 'DSDD') : dung ? '4' : '5'


type K = Awaited<ReturnType<typeof kho>>
/** Số đo cho cổng tốc độ (mục `mayChuSanSang` của docs/moc-toc-do.json) — gom từ các ca dưới, so ở ca cuối. */
const DO: Record<string, { dot: number; lenh: number }> = {}
const ghiDo = (ten: string, r: { dot: number; lenh: number }) => { DO[ten] = { dot: r.dot, lenh: r.lenh } }
const boKhoaPhu = (r: Record<string, unknown>) => { const { chuoiNgay: _c, ...x } = r; return x }
async function lamHet(k: K, s: { kq: Record<string, unknown> }, t0: number) {
  const ds = s.kq.questions as { qid: string; phan: string }[]
  for (let i = 0; i < ds.length; i++) {
    vi.setSystemTime(t0 + i * 20_000)
    const r = await goi(k, 'answer', { session: s.kq.id, qid: ds[i]!.qid, answer: traLoi(ds[i]!.phan, i % 2 === 0), assisted: false, msLam: 20_000 })
    expect(r.kq.ok, JSON.stringify(r.kq).slice(0, 200)).toBe(true)
  }
  return ds.map((q) => q.qid)
}

it('Sảnh / Mở chặng dùng bản sẵn: ≤ 1 / ≤ 2 đợt D1; Sảnh bản sẵn y hệt Sảnh lập lại; chặng sẵn dùng một lần', async () => {
  const k = await kho()
  await goi(k, 'hoc-tap-dem', {}, k.tokenBan)
  const dau = await goi(k, 'hoc-tap-sanh', {})
  expect(dau.kq.ok).toBe(true)
  vi.setSystemTime(NOW + 10_000)
  const nhanh = await goi(k, 'hoc-tap-sanh', {})
  expect(nhanh.dot).toBeLessThanOrEqual(1); ghiDo('sanh-lan-sau', nhanh)
  // Bỏ bản sẵn ⇒ lập lại đúng như cũ (cùng giờ): nội dung phải TRÙNG bản sẵn.
  k.d.sql.exec('DELETE FROM hoc_tap_san_sang')
  const lai = await goi(k, 'hoc-tap-sanh', {})
  expect(lai.dot).toBeGreaterThan(1)
  expect(boKhoaPhu(nhanh.kq)).toEqual(boKhoaPhu(lai.kq))
  vi.setSystemTime(NOW + 12_000)
  const mo = await goi(k, 'hoc-tap-start', {})
  expect(mo.dot).toBeLessThanOrEqual(2); ghiDo('mo-chang', mo)
  expect((mo.kq.questions as unknown[]).length).toBeGreaterThan(0)
  expect(mo.kq.questions).not.toContainEqual(expect.objectContaining({ correct: expect.anything() })) // đề công khai, không đáp án
  const phien = k.d.sql.prepare('SELECT json FROM game_v2_session WHERE id=?').get(String(mo.kq.id)) as { json: string } | undefined
  expect(phien && JSON.parse(phien.json).questions.map((q: { qid: string }) => q.qid)).toEqual((mo.kq.questions as { qid: string }[]).map((q) => q.qid))
  // Mở lại (chưa làm câu nào): chặng sẵn đã dùng ⇒ đường cũ trả ĐÚNG đợt vừa mở, không tạo đợt mới.
  vi.setSystemTime(NOW + 13_000)
  const mo2 = await goi(k, 'hoc-tap-start', {})
  expect(mo2.kq.id).toBe(mo.kq.id)
})

it('dấu đổi ⇒ không dùng bản cũ: em vừa trả lời một câu; thầy đổi cấu hình', async () => {
  const k = await kho()
  await goi(k, 'hoc-tap-dem', {}, k.tokenBan)
  await goi(k, 'hoc-tap-sanh', {})
  vi.setSystemTime(NOW + 5_000)
  const s = await goi(k, 'hoc-tap-start', {})
  const q = (s.kq.questions as { qid: string; phan: string }[])[0]!
  vi.setSystemTime(NOW + 30_000)
  await goi(k, 'answer', { session: s.kq.id, qid: q.qid, answer: traLoi(q.phan, true), assisted: false, msLam: 20_000 })
  vi.setSystemTime(NOW + 31_000)
  const sau = await goi(k, 'hoc-tap-sanh', {})
  expect(sau.dot).toBeGreaterThan(1) // lập lại
  expect((sau.kq.goi7 as { daLamHomNay: number }).daLamHomNay).toBe(1)
  vi.setSystemTime(NOW + 40_000)
  expect((await goi(k, 'hoc-tap-sanh', {})).dot).toBeLessThanOrEqual(1) // bản mới (lượt chậm vừa cất) dùng được
  k.d.sql.exec("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('thu_san_sang','{}','z')")
  vi.setSystemTime(NOW + 41_000)
  expect((await goi(k, 'hoc-tap-sanh', {})).dot).toBeGreaterThan(1)
})

it('câu cuối chặng ⇒ chuẩn bị nền: Sảnh ≤ 1 đợt, mở chặng ≤ 2 đợt, không phát lại câu vừa làm; cron đêm ⇒ Sảnh đầu ngày ≤ 1 đợt', async () => {
  const k = await kho()
  await goi(k, 'hoc-tap-dem', {}, k.tokenBan)
  const s = await goi(k, 'hoc-tap-start', {})
  const daLam = await lamHet(k, s, NOW + 20_000)
  vi.setSystemTime(NOW + 400_000)
  await goi(k, 'hoc-tap-dem', {}, k.tokenBan) // em khác vừa gọi ⇒ đệm cờ isolate nóng (giờ học)
  const sanh = await goi(k, 'hoc-tap-sanh', {})
  expect(sanh.dot).toBeLessThanOrEqual(1); ghiDo('sanh-sau-chang', sanh)
  expect((sanh.kq.goi7 as { daLamHomNay: number }).daLamHomNay).toBe(daLam.length)
  const mo = await goi(k, 'hoc-tap-start', {})
  expect(mo.dot).toBeLessThanOrEqual(2); ghiDo('mo-chang-sau-chang', mo)
  expect((mo.kq.questions as { qid: string }[]).map((q) => q.qid).filter((q) => daLam.includes(q))).toEqual([])
  // Ngày mới: cron đêm (00:30 VN) chuẩn bị ⇒ lượt Sảnh đầu ngày dùng bản sẵn.
  const dem = Date.parse('2026-10-13T01:00:00+07:00')
  vi.setSystemTime(dem)
  expect(await cronSanSangDem(k.rawEnv, dem, 10)).toBeGreaterThanOrEqual(1)
  // TEM NIÊM PHONG (29/10): chặng lập sẵn mang tem hạn DÀI trong D1 — máy em KHÔNG bao giờ nhận tem ấy trực tiếp (`moNiem` từ chối), lúc mở được làm MỚI (45 phút từ giờ).
  const luuSan = JSON.parse(String((k.d.sql.prepare('SELECT chang_json FROM hoc_tap_san_sang WHERE sbd=?').get('S1') as { chang_json: string }).chang_json)) as { questions: { qid: string; sk?: string }[] }
  expect(luuSan.questions.length).toBeGreaterThan(0)
  const luc19 = Date.parse('2026-10-13T19:30:06+07:00')
  for (const q of luuSan.questions) {
    expect(typeof q.sk).toBe('string')
    expect(await moNiem(k.rawEnv as Env, 'S1', q.qid, q.sk, luc19)).toBeNull() // hạn dài ⇒ chưa dùng được trực tiếp
    expect(await lamMoiNiem(k.rawEnv as Env, 'S1', q.qid, q.sk, luc19)).toBeTypeOf('string')
  }
  vi.setSystemTime(Date.parse('2026-10-13T19:30:00+07:00'))
  await goi(k, 'hoc-tap-dem', {}, k.tokenBan)
  const dauNgay = await goi(k, 'hoc-tap-sanh', {})
  expect(dauNgay.kq.ok).toBe(true)
  expect(dauNgay.dot).toBeLessThanOrEqual(1); ghiDo('sanh-dau-ngay', dauNgay)
  vi.setSystemTime(Date.parse('2026-10-13T19:30:05+07:00'))
  const moDauNgay = await goi(k, 'hoc-tap-start', {})
  expect(moDauNgay.kq.ok).toBe(true); expect(moDauNgay.dot).toBeLessThanOrEqual(2); ghiDo('mo-chang-dau-ngay', moDauNgay)
  // Chặng mở từ bản sẵn: mỗi câu mang tem đã làm MỚI — dùng được ngay (dòng 1 «Kiểm tra» không cần D1) và đúng câu.
  const moCau = moDauNgay.kq.questions as { qid: string; sk?: string }[]
  expect(moCau.length).toBeGreaterThan(0)
  for (const q of moCau) expect(await moNiem(k.rawEnv as Env, 'S1', q.qid, q.sk, Date.parse('2026-10-13T19:30:10+07:00'))).toMatchObject({ q: q.qid })
})

it('cron chuẩn bị MỌI em còn đang nhận gói — kể cả gói đã QUÁ HẠN nộp (29/10: cũ lọc `han >= hôm nay` ⇒ bỏ sót 233 em); em khoá thì không; bản cũ (em vừa học phiên mới) được làm mới', async () => {
  const k = await kho()
  const dem = Date.parse('2026-10-13T01:00:00+07:00')
  vi.setSystemTime(dem)
  k.d.sql.exec("UPDATE goi_bai_7_em SET han='2026-10-01'") // hạn đã qua — em vẫn «đang nhận» (goi-bai-7-quyen.ts)
  expect((k.d.sql.prepare("SELECT COUNT(*) n FROM goi_bai_7_em WHERE han<'2026-10-13'").get() as { n: number }).n).toBeGreaterThanOrEqual(2)
  const soEm = (k.d.sql.prepare('SELECT COUNT(DISTINCT sbd) n FROM goi_bai_7_em').get() as { n: number }).n
  expect(soEm).toBeGreaterThanOrEqual(2)
  k.d.sql.exec("UPDATE hoc_sinh SET trang_thai='khoa' WHERE sbd='S2'")
  expect(await cronSanSangDem(k.rawEnv, dem, 10)).toBe(2) // S1 + S3 (S2 bị khoá)
  const ban = k.d.sql.prepare('SELECT sbd, ngay, luc FROM hoc_tap_san_sang').all() as { sbd: string; ngay: string; luc: number }[]
  expect(ban.map((b) => b.sbd).sort()).toEqual(['S1', 'S3'])
  expect(ban[0]!.ngay).toBe('2026-10-13')
  // Đã có bản đủ mới ⇒ lượt sau không lập lại.
  vi.setSystemTime(dem + 60_000)
  expect(await cronSanSangDem(k.rawEnv, dem + 60_000, 10)).toBe(0)
  // Thầy giao bài / đổi cấu hình ⇒ DẤU CHUNG đổi ⇒ mọi bản lệch cùng lúc: cron vá lại (em vừa trả lời < 10 phút là đang học ⇒ bỏ qua).
  k.d.sql.exec("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('thay_giao_bai_moi','{}','z')")
  k.d.sql.prepare('INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,?,?,?,?,?,?)')
    .run('p|a', 'S1', 'p', 'q-x', 'g-x', JSON.stringify({ attempt: { assisted: false } }), new Date(dem + 150_000).toISOString())
  vi.setSystemTime(dem + 180_000)
  const truoc = k.d.sql.prepare('SELECT sbd, luc FROM hoc_tap_san_sang ORDER BY sbd').all() as { sbd: string; luc: number }[]
  expect(await cronSanSangDem(k.rawEnv, dem + 180_000, 10)).toBe(1) // chỉ S3 (S1 đang học)
  const sau = k.d.sql.prepare('SELECT sbd, luc FROM hoc_tap_san_sang ORDER BY sbd').all() as { sbd: string; luc: number }[]
  expect(sau.find((x) => x.sbd === 'S3')!.luc).toBe(dem + 180_000)
  expect(sau.find((x) => x.sbd === 'S1')!.luc).toBe(truoc.find((x) => x.sbd === 'S1')!.luc)
  // Nghỉ đủ 10 phút ⇒ S1 được vá; S3 đã khớp dấu ⇒ không lập lại.
  const muon = dem + 180_000 + 11 * 60_000
  vi.setSystemTime(muon)
  expect(await cronSanSangDem(k.rawEnv, muon, 10)).toBe(1)
  expect((k.d.sql.prepare('SELECT luc FROM hoc_tap_san_sang WHERE sbd=?').get('S1') as { luc: number }).luc).toBe(muon)
  expect((k.d.sql.prepare('SELECT luc FROM hoc_tap_san_sang WHERE sbd=?').get('S3') as { luc: number }).luc).toBe(dem + 180_000)
  vi.setSystemTime(muon + 60_000)
  expect(await cronSanSangDem(k.rawEnv, muon + 60_000, 10)).toBe(0) // mọi bản đã khớp dấu
})

it('hạn mức cron theo khung giờ: đêm 10 · sáng 6 · chiều 16 · tối 6 · 00:00–00:14 nghỉ', async () => {
  const { toiDaCron, TOI_DA_DEM, TOI_DA_SANG, TOI_DA_CHIEU, TOI_DA_TOI } = await import('../server/src/san-sang')
  const vn = (h: number, m = 0) => Date.parse(`2026-10-13T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00+07:00`)
  expect(toiDaCron(vn(0, 5))).toBe(0); expect(toiDaCron(vn(0, 15))).toBe(TOI_DA_DEM); expect(toiDaCron(vn(3, 59))).toBe(TOI_DA_DEM)
  expect(toiDaCron(vn(4))).toBe(TOI_DA_SANG); expect(toiDaCron(vn(12, 59))).toBe(TOI_DA_SANG)
  expect(toiDaCron(vn(13))).toBe(TOI_DA_CHIEU); expect(toiDaCron(vn(18, 59))).toBe(TOI_DA_CHIEU)
  expect(toiDaCron(vn(19))).toBe(TOI_DA_TOI); expect(toiDaCron(vn(23, 59))).toBe(TOI_DA_TOI)
  const k = await kho()
  vi.setSystemTime(vn(0, 5))
  expect(await cronSanSangDem(k.rawEnv, vn(0, 5))).toBe(0) // 00:05 nghỉ (việc đổi ngày 00:01)
})

it('cổng tốc độ: số đợt chờ D1 của Sảnh / Mở chặng (bản sẵn) không vượt mốc `mayChuSanSang` (mốc chỉ hạ)', () => {
  const moc = JSON.parse(fs.readFileSync(MOC, 'utf8')) as { mayChuSanSang?: Record<string, { dot: number; lenh: number }> }
  if (process.env.GHI_MOC_TOC_DO) fs.writeFileSync(process.env.GHI_MOC_TOC_DO, JSON.stringify(DO, null, 1))
  const vuot: string[] = [], thieu: string[] = []
  for (const [ten, d] of Object.entries(DO)) {
    const m = moc.mayChuSanSang?.[ten]
    if (!m) { thieu.push(`"${ten}": { "dot": ${d.dot}, "lenh": ${d.lenh} }`); continue }
    if (d.dot > m.dot) vuot.push(`${ten}: ${d.dot} đợt (mốc ${m.dot})`)
    if (d.lenh > m.lenh) vuot.push(`${ten}: ${d.lenh} lệnh D1 (mốc ${m.lenh})`)
  }
  expect(Object.keys(DO).length).toBe(6)
  expect(thieu, 'thiếu mốc mayChuSanSang').toEqual([])
  expect(vuot, 'CHẬM HƠN bản trước').toEqual([])
})
