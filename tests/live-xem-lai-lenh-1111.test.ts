// @vitest-environment node
// XEM LẠI LIVE (thầy chốt build 11/11; đặc tả docs/dac-ta-live-xem-lai-1011.md mục 4.7, 7): LỆNH MÁY CHỦ qua đúng cửa thật `worker.fetch` trên D1 thật-trong-bộ-nhớ
// (lược đồ nạp từ server/schema.sql + mọi migration, gồm server/migration-z-1011-live-xem-lai.sql) + R2 giả có Range:
// tải khúc, tệp có Range ⇒ 206, vé sai / hết hạn, quyền xem (điểm quyết 3), lịch sử của thầy, đổi tên, xoá hàng loạt (đứt giữa chừng chạy tiếp, không đụng điểm).
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { taoD1That, type D1That } from './_d1-that'
import { khucGia, taoR2Gia, type R2Gia } from './_live-xem-lai-gia'
import { gameToken } from '../server/src/game-v2-auth'
import { kyVeBpu } from '../server/src/phong-binh-phan-ung'
import { SQL_LIVE_XEM_LAI, damBaoCotLyDo } from '../server/src/live-xem-lai'
import { SBD_THAY, cronLiveXemLai, docRange, emXemDuoc, hanVeLive, kiemVeLive, kyVeLive } from '../server/src/live-xem-lai-lenh'
import { tachCauLive } from '../scripts/tach-cau-live-xem-lai.mjs'
import { docDauGon } from '../src/lib/live/xem-lai-khuc'
import type { Env } from '../server/src/kieu'
import type { TraLiveBuoiHs, TraLiveDsGv, TraLiveDsHs, TraLiveXoa } from '../src/lib/live/xem-lai-kieu'

const T0 = Date.parse('2026-11-10T13:00:00Z')
const GOC = 'https://may-chu.thu'
let d1: D1That, r2: R2Gia, env: Env
/** Các lệnh Worker đã gửi vào phòng (cửa nội bộ `/xl-*`) + câu trả lời giả của phòng. */
let goiPhong: { buoi: string; duong: string; b: unknown }[] = []
let traPhong: Record<string, unknown> = { ok: true }

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
  d1 = taoD1That(); r2 = taoR2Gia(); goiPhong = []; traPhong = { ok: true }
  env = { ...d1.env, DE: r2.be, PHONG_BPU: {
    idFromName: (ten: string) => ({ toString: () => ten }),
    get: (id: { toString(): string }) => ({ fetch: async (req: Request) => { goiPhong.push({ buoi: id.toString(), duong: new URL(req.url).pathname, b: await req.json().catch(() => null) }); return new Response(JSON.stringify(traPhong)) } }),
  } } as unknown as Env
  d1.sql.exec(`INSERT INTO hoc_sinh(sbd,ho_ten,lop,ten_lop,mat_khau,cap_nhat_luc) VALUES
    ('A1','Nguyễn Minh Anh','12','12A1','mk','x'),('A2','Trần Bảo','12','12A1','mk','x'),('B1','Lê Chi','12','12A2','mk','x'),('C1','Phạm Dũng','11','','mk','x')`)
  d1.sql.exec(`INSERT INTO buoi_hoc(id,ten,lop,bi_mat,mo_luc,het_han,cap_nhat_luc) VALUES ('b1','12A1','12A1','x','2026-11-10T12:00:00Z','2026-11-11T12:00:00Z','x'),('b2','Mọi lớp','','x','2026-11-09T12:00:00Z','2026-11-10T12:00:00Z','x')`)
  d1.sql.exec(`INSERT INTO buoi_hoc_diem_danh(buoi_id,sbd,luc,cach,trang_thai,cap_nhat_luc) VALUES ('b1','A1','x','ma','co_mat','x'),('b2','B1','x','ma','co_mat','x'),('b2','A2','x','ma','bo','x')`)
  d1.sql.exec(`CREATE TABLE IF NOT EXISTS bpu_luot (buoi_id TEXT NOT NULL, sbd TEXT NOT NULL, qid TEXT NOT NULL, luot INTEGER NOT NULL, chon TEXT, dung INTEGER NOT NULL DEFAULT 0, giay REAL, kj INTEGER NOT NULL DEFAULT 0, doi INTEGER, roi INTEGER NOT NULL DEFAULT 0, len_bang INTEGER NOT NULL DEFAULT 0, luc TEXT NOT NULL, PRIMARY KEY (buoi_id, sbd, luot))`)
  d1.sql.exec(`INSERT INTO bpu_luot(buoi_id,sbd,qid,luot,chon,dung,len_bang,luc) VALUES ('b1','A1','q1',1,'A',1,2,'x'),('b1','A1','q3',3,'B',0,0,'x'),('b1','A2','q1',1,'B',0,0,'x')`)
})
afterEach(() => { vi.useRealTimers() })

function themBuoi(id: string, o: { lop?: string; tt?: string; quyen?: string; ngay?: string; byte?: number; tat?: string | null; capNhat?: string } = {}): void {
  d1.sql.prepare(`INSERT INTO live_buoi (id, lop, ngay, bat_luc, tat_luc, ten_tu_dong, so_cau, so_doan, giay_live, giay_doan, byte, trang_thai, tien_do, quyen, ban, tao_luc, cap_nhat)
    VALUES (?,?,?,?,?, 'Bài 8. Amine', 5, 2, 2880, 900, ?, ?, 100, ?, 2, 'x', ?)`).run(id, o.lop ?? '12A1', o.ngay ?? '2026-11-10', `${o.ngay ?? '2026-11-10'}T12:00:00.000Z`, o.tat === undefined ? '2026-11-10T12:48:00.000Z' : o.tat, o.byte ?? 19_000_000, o.tt ?? 'xong', o.quyen ?? 'lop', o.capNhat ?? '2026-11-10T12:49:00.000Z')
  d1.sql.prepare(`INSERT INTO live_doan (buoi_id, stt, loai, luot, qid, ten, sbd_len_bang, dat, t0, t1) VALUES (?,1,'len_bang',1,'q1','Câu 1 · Amine · Minh Anh lên bảng','A1',1,0,60000),(?,2,'thay_chua',3,'q3','Câu 3 · Thầy chữa',NULL,NULL,70000,90000)`).run(id, id)
}
async function themTep(id: string): Promise<void> {
  const tieng = new Uint8Array(6000); for (let i = 0; i < tieng.length; i++) tieng[i] = i % 251
  await r2.be.put(`live/${id}/tieng.mp3`, tieng, { httpMetadata: { contentType: 'audio/mpeg' } })
  await r2.be.put(`live/${id}/buoi.json`, JSON.stringify({ v: 1, id, tenThay: null }))
  await r2.be.put(`live/${id}/net.bin`, new Uint8Array(100))
  await r2.be.put(`live/${id}/su-kien.json`, '{"bi-mat":1}')
  await r2.be.put(`live/${id}/k/p1-00000.bin`, new Uint8Array(10))
}
const goi = (duong: string, o: RequestInit & { thay?: boolean } = {}): Promise<Response> =>
  worker.fetch(new Request(`${GOC}${duong}`, { ...o, headers: { ...(o.thay ? { 'x-ma-bi-mat': 'bi-mat-thu' } : {}), ...(o.headers as Record<string, string> | undefined) } }), env) as Promise<Response>
const hs = async <T,>(duong: string, sbd: string, them: Record<string, unknown> = {}): Promise<{ status: number; j: T & { ok?: boolean } }> => {
  const r = await goi(duong, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: await gameToken(env, sbd), ...them }) })
  return { status: r.status, j: (await r.json()) as T & { ok?: boolean } }
}
const gv = async <T,>(duong: string, b: Record<string, unknown> = {}): Promise<{ status: number; j: T & { ok?: boolean; error?: string; lyDo?: string } }> => {
  const r = await goi(duong, { method: 'POST', thay: true, headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) })
  return { status: r.status, j: (await r.json()) as T & { ok?: boolean } }
}

describe('Lược đồ D1 chỉ-thêm', () => {
  it('tệp migration đúng mục 4.7, chỉ gồm CREATE … IF NOT EXISTS, và khớp bản sao trong mã', () => {
    const gon = (s: string) => s.replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')').trim().replace(/;$/, '')
    const tep = tachCauLive(readFileSync('server/migration-z-1011-live-xem-lai.sql', 'utf8')).map(gon)
    expect(tep).toEqual(SQL_LIVE_XEM_LAI.map(gon))
    expect(tep.every((s) => /^CREATE (TABLE|INDEX) IF NOT EXISTS /.test(s))).toBe(true)
    expect(readFileSync('.github/workflows/deploy.yml', 'utf8')).toContain('node scripts/ap-migration-live-xem-lai-1111.mjs')
  })
})

describe('POST /bpu/live/ghi — máy thầy tải khúc 10 giây', () => {
  const khuc = () => khucGia({ t0: T0, soDau: 1, kh: 50, net: [['n1', 30]] })
  const ve = (v: 'gv' | 'hs', han = T0 + 3_600_000) => kyVeBpu('bi-mat-thu', { b: 'b1', s: v === 'hs' ? 'A1' : '', v, h: han })
  it('vé thầy ⇒ ghi R2 đúng khoá, kèm phần đầu gọn trong siêu dữ liệu; trùng stt ⇒ ghi đè, không lỗi; 0 lệnh D1', async () => {
    const truoc = d1.soLenh.prepare + d1.soLenh.batch
    const url = `/bpu/live/ghi?phien=p1&stt=3&ve=${encodeURIComponent(await ve('gv'))}`
    for (let i = 0; i < 2; i++) expect(await (await goi(url, { method: 'POST', body: khuc() })).json()).toEqual({ ok: true })
    const t = r2.du.get('live/b1/k/p1-00003.bin')!
    expect(t.b.length).toBe(khuc().length); expect(docDauGon(t.meta?.d)).toMatchObject({ t0: T0, kh: 50, net: [['n1', 30]] })
    expect([...r2.du.keys()]).toHaveLength(1); expect(d1.soLenh.prepare + d1.soLenh.batch).toBe(truoc); expect(goiPhong).toEqual([])
  })
  it('vé em / vé sai / vé hết hạn ⇒ 403; khúc hỏng ⇒ 400; tham số sai ⇒ 400; không ghi gì', async () => {
    const guiVoi = async (v: string, than: Uint8Array = khuc(), q = 'phien=p1&stt=0') => (await goi(`/bpu/live/ghi?${q}&ve=${encodeURIComponent(v)}`, { method: 'POST', body: than })).status
    expect(await guiVoi(await ve('hs'))).toBe(403); expect(await guiVoi('abc.def')).toBe(403); expect(await guiVoi(await ve('gv', T0 - 1))).toBe(403)
    expect(await guiVoi(await ve('gv'), new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))).toBe(400)
    expect(await guiVoi(await ve('gv'), khuc(), 'phien=P%2F..&stt=0')).toBe(400); expect(await guiVoi(await ve('gv'), khuc(), 'phien=p1&stt=-1')).toBe(400)
    expect(r2.du.size).toBe(0)
  })
  it('tải bù (bu=1): nhận vé thầy quá hạn dưới 24 giờ, báo phòng dựng lại; phòng đã dọn ⇒ bỏ khúc', async () => {
    const cu = await ve('gv', T0 - 3 * 3_600_000)
    expect((await goi(`/bpu/live/ghi?phien=p1&stt=1&bu=1&ve=${encodeURIComponent(cu)}`, { method: 'POST', body: khuc() })).status).toBe(200)
    expect(goiPhong).toEqual([{ buoi: 'bpu:b1', duong: '/xl-bu', b: {} }]); expect(r2.du.size).toBe(1)
    expect((await goi(`/bpu/live/ghi?phien=p1&stt=2&bu=1&ve=${encodeURIComponent(await ve('gv', T0 - 25 * 3_600_000))}`, { method: 'POST', body: khuc() })).status).toBe(403)
    traPhong = { ok: false, lyDo: 'da-don' }
    expect(await (await goi(`/bpu/live/ghi?phien=p1&stt=5&bu=1&ve=${encodeURIComponent(cu)}`, { method: 'POST', body: khuc() })).json()).toEqual({ ok: false, lyDo: 'da-don' })
    expect(r2.du.has('live/b1/k/p1-00005.bin')).toBe(false)
  })
})

describe('GET /live-tep/<id>/<tệp>?ve — tệp buổi live, có Range', () => {
  it('Range ⇒ 206 đúng byte + đầu mục; không Range ⇒ 200 cả tệp; 0 lệnh D1, 1 lần đọc R2', async () => {
    await themTep('b1')
    const ve = encodeURIComponent(await kyVeLive('bi-mat-thu', 'b1', 'A1', hanVeLive(T0), 2))
    const d1Truoc = d1.soLenh.prepare + d1.soLenh.batch, r2Truoc = r2.dem.get
    const r = await goi(`/live-tep/b1/tieng.mp3?ve=${ve}`, { headers: { range: 'bytes=3000-3143' } })
    expect(r.status).toBe(206)
    expect(r.headers.get('content-range')).toBe('bytes 3000-3143/6000'); expect(r.headers.get('content-length')).toBe('144')
    expect(r.headers.get('accept-ranges')).toBe('bytes'); expect(r.headers.get('content-type')).toBe('audio/mpeg')
    expect(r.headers.get('cache-control')).toBe('private, max-age=3600'); expect(r.headers.get('access-control-allow-origin')).toBe('*')
    expect(r.headers.get('access-control-expose-headers')).toContain('content-range')
    const b = new Uint8Array(await r.arrayBuffer())
    expect(b.length).toBe(144); expect(b[0]).toBe(3000 % 251); expect(b[143]).toBe(3143 % 251)
    expect(r2.dem.get - r2Truoc).toBe(1); expect(d1.soLenh.prepare + d1.soLenh.batch).toBe(d1Truoc)
    const mo = await goi(`/live-tep/b1/tieng.mp3?ve=${ve}`, { headers: { range: 'bytes=5900-' } })
    expect(mo.status).toBe(206); expect(mo.headers.get('content-range')).toBe('bytes 5900-5999/6000')
    const duoi = await goi(`/live-tep/b1/tieng.mp3?ve=${ve}`, { headers: { range: 'bytes=-100' } })
    expect(duoi.headers.get('content-range')).toBe('bytes 5900-5999/6000'); expect((await duoi.arrayBuffer()).byteLength).toBe(100)
    const vuot = await goi(`/live-tep/b1/tieng.mp3?ve=${ve}`, { headers: { range: 'bytes=5990-9999' } })
    expect(vuot.headers.get('content-range')).toBe('bytes 5990-5999/6000')
    expect((await goi(`/live-tep/b1/tieng.mp3?ve=${ve}`, { headers: { range: 'bytes=7000-' } })).status).toBe(416)
    const ca = await goi(`/live-tep/b1/buoi.json?ve=${ve}`)
    expect(ca.status).toBe(200); expect(ca.headers.get('content-type')).toContain('application/json'); expect(await ca.json()).toMatchObject({ id: 'b1' })
    expect((await goi(`/live-tep/b1/net.bin?ve=${ve}`)).headers.get('content-length')).toBe('100')
    expect(docRange('bytes=0-')).toEqual({ offset: 0 }); expect(docRange('items=0-5')).toBeNull(); expect(docRange(null)).toBeNull()
    // trình duyệt hỏi trước (preflight) cho đầu mục Range
    const hoi = await goi('/live-tep/b1/net.bin', { method: 'OPTIONS' })
    expect(hoi.status).toBe(204); expect(hoi.headers.get('access-control-allow-headers')).toContain('range')
  })
  it('vé sai, vé của buổi khác, vé HẾT HẠN ⇒ 403; nhật ký sự kiện thô và khúc thô KHÔNG phục vụ; buổi đã xoá ⇒ 404', async () => {
    await themTep('b1'); await themTep('b2')
    const han = hanVeLive(T0), ve = await kyVeLive('bi-mat-thu', 'b1', 'A1', han, 2)
    expect(han - T0).toBeGreaterThanOrEqual(6 * 3_600_000); expect(han - T0).toBeLessThan(7 * 3_600_000); expect(han % 3_600_000).toBe(0)
    const tt = async (duong: string) => (await goi(duong)).status
    expect(await tt(`/live-tep/b1/tieng.mp3?ve=${encodeURIComponent(ve)}`)).toBe(200)
    expect(await tt('/live-tep/b1/tieng.mp3')).toBe(403); expect(await tt('/live-tep/b1/tieng.mp3?ve=x.y.z.t')).toBe(403)
    expect(await tt(`/live-tep/b2/tieng.mp3?ve=${encodeURIComponent(ve)}`)).toBe(403) // vé ký cho đúng một buổi
    expect(await tt(`/live-tep/b1/tieng.mp3?ve=${encodeURIComponent(ve.replace(/\.\d+\./, '.9.'))}`)).toBe(403) // sửa bản dựng trong vé
    expect(await tt(`/live-tep/b1/su-kien.json?ve=${encodeURIComponent(ve)}`)).toBe(404)
    expect(await tt(`/live-tep/b1/k/p1-00000.bin?ve=${encodeURIComponent(ve)}`)).toBe(404)
    expect(await kiemVeLive('bi-mat-thu', 'b1', ve, han)).toMatchObject({ sbd: 'A1', ban: 2 })
    vi.setSystemTime(han + 1)
    expect(await tt(`/live-tep/b1/tieng.mp3?ve=${encodeURIComponent(ve)}`)).toBe(403)
    expect(await kiemVeLive('bi-mat-thu', 'b1', ve)).toBeNull()
    vi.setSystemTime(T0)
    await r2.be.delete('live/b1/tieng.mp3')
    expect(await tt(`/live-tep/b1/tieng.mp3?ve=${encodeURIComponent(ve)}`)).toBe(404)
  })
})

describe('/hs/live-* — quyền xem (điểm quyết 3)', () => {
  it('em thuộc lớp của buổi thấy buổi, KỂ CẢ em vắng; em lớp khác không thấy; vé chỉ có khi buổi đã xong', async () => {
    themBuoi('b1'); themBuoi('b9', { tt: 'dang_xu_ly', ngay: '2026-11-11' }); themBuoi('bx', { tt: 'dang_xoa' }); themBuoi('bl', { tt: 'loi' }); themBuoi('bg', { tt: 'dang_ghi' })
    const a1 = await hs<TraLiveDsHs>('/hs/live-ds', 'A1')
    expect(a1.status).toBe(200); expect(a1.j.buoi.map((b) => [b.id, b.trangThai, !!b.ve, b.lenBang])).toEqual([['b9', 'dang_xu_ly', false, [1]], ['b1', 'xong', true, [1]]])
    expect(a1.j.buoi[1]).toMatchObject({ ngay: '2026-11-10', lop: '12A1', tenTuDong: 'Bài 8. Amine', tenThay: null, soCau: 5, soDoan: 2, giayLive: 2880, giayDoan: 900, tienDo: 100, ban: 2 })
    expect(await kiemVeLive('bi-mat-thu', 'b1', a1.j.buoi[1]!.ve)).toMatchObject({ sbd: 'A1', ban: 2 })
    const a2 = await hs<TraLiveDsHs>('/hs/live-ds', 'A2') // em vắng (không điểm danh) vẫn xem được để học bù
    expect(a2.j.buoi.map((b) => [b.id, b.lenBang])).toEqual([['b9', []], ['b1', []]])
    expect((await hs<TraLiveDsHs>('/hs/live-ds', 'B1')).j.buoi).toEqual([])
    expect((await hs<TraLiveDsHs>('/hs/live-ds', 'C1')).j.buoi).toEqual([])
  })
  it('buổi «mọi lớp» ⇒ chỉ em ĐÃ điểm danh buổi đó; thầy đặt «diem_danh» ⇒ em vắng của lớp không xem được nữa', async () => {
    themBuoi('b2', { lop: '', quyen: 'diem_danh', ngay: '2026-11-09' }); themBuoi('b1')
    expect((await hs<TraLiveDsHs>('/hs/live-ds', 'B1')).j.buoi.map((b) => b.id)).toEqual(['b2'])
    expect((await hs<TraLiveDsHs>('/hs/live-ds', 'A2')).j.buoi.map((b) => b.id)).toEqual(['b1']) // A2 điểm danh b2 nhưng đã bị bỏ
    expect((await gv('/gv/live-dat', { id: 'b1', quyen: 'diem_danh' })).j).toMatchObject({ ok: true, quyen: 'diem_danh' })
    expect((await hs<TraLiveDsHs>('/hs/live-ds', 'A2')).j.buoi).toEqual([])
    expect((await hs<TraLiveDsHs>('/hs/live-ds', 'A1')).j.buoi.map((b) => b.id)).toEqual(['b1'])
  })
  it('/hs/live-buoi: kết quả RIÊNG của em từ bpu_luot của chính em; em lớp khác / buổi chưa xong / đã xoá ⇒ 404; token sai ⇒ 401', async () => {
    themBuoi('b1'); themBuoi('b9', { tt: 'dang_xu_ly' })
    const r = await hs<TraLiveBuoiHs>('/hs/live-buoi', 'A1', { id: 'b1' })
    expect(r.j).toMatchObject({ ok: true, id: 'b1', ban: 2, ketQua: { 1: { dung: true }, 3: { dung: false } }, lenBang: [1] })
    expect(await kiemVeLive('bi-mat-thu', 'b1', r.j.ve)).toMatchObject({ sbd: 'A1' })
    expect((await hs<TraLiveBuoiHs>('/hs/live-buoi', 'A2', { id: 'b1' })).j.ketQua).toEqual({ 1: { dung: false } })
    expect((await hs('/hs/live-buoi', 'B1', { id: 'b1' })).status).toBe(404)
    expect((await hs('/hs/live-buoi', 'A1', { id: 'b9' })).status).toBe(404)
    expect((await hs('/hs/live-buoi', 'A1', { id: 'khong-co' })).status).toBe(404)
    expect((await goi('/hs/live-ds', { method: 'POST', body: JSON.stringify({ token: 'gia.mao' }) })).status).toBe(401)
    // cũng nhận GET với ?token=
    const get = await goi(`/hs/live-buoi?id=b1&token=${encodeURIComponent(await gameToken(env, 'A1'))}`)
    expect(get.status).toBe(200); expect(((await get.json()) as TraLiveBuoiHs).lenBang).toEqual([1])
    d1.sql.exec('DROP TABLE bpu_luot') // chưa buổi nào kết thúc ⇒ bảng chưa có ⇒ vẫn trả quyền + vé
    expect((await hs<TraLiveBuoiHs>('/hs/live-buoi', 'A1', { id: 'b1' })).j).toMatchObject({ ok: true, ketQua: {}, lenBang: [] })
  })
  it('buổi LIVE THEO KHỐI («Live Khối N», 14/11 thầy báo «Nhật ký của bài live K12 chưa có»): quyền «cả lớp» = CẢ KHỐI N, kể cả em không bấm Tham gia', async () => {
    d1.sql.exec(`INSERT INTO hoc_sinh(sbd,ho_ten,lop,ten_lop,mat_khau,cap_nhat_luc,trang_thai) VALUES ('D1','Em D1','','12 - Nhóm 10 điểm','mk','x',NULL),
      ('D2','Em D2','12','12 - Tinh Hoa','mk','x','khoa'),('12121212','Thử','','','mk','x',NULL)`)
    themBuoi('lk12', { lop: 'Live Khối 12', ngay: '2026-11-12' }); themBuoi('lk10', { lop: 'Live Khối 10', ngay: '2026-11-11' })
    themBuoi('lk12d', { lop: 'Live Khối 12', quyen: 'diem_danh', ngay: '2026-11-10' })
    d1.sql.exec(`INSERT INTO buoi_hoc_diem_danh(buoi_id,sbd,luc,cach,trang_thai,cap_nhat_luc) VALUES ('lk10','B1','x','live','co_mat','x')`)
    const ds = async (sbd: string) => (await hs<TraLiveDsHs>('/hs/live-ds', sbd)).j.buoi.map((b) => b.id)
    expect(await ds('A1')).toEqual(['lk12']) // khối 12 (lop «12»), không bấm Tham gia vẫn thấy; buổi «chỉ em có mặt» vẫn chặn
    expect(await ds('D1')).toEqual(['lk12']) // khối lấy SỐ ĐẦU của tên lớp: «12 - Nhóm 10 điểm» là khối 12, KHÔNG thấy Live Khối 10
    expect(await ds('B1')).toEqual(['lk12', 'lk10']) // có mặt buổi khối khác ⇒ vẫn thấy buổi đó (luật cũ)
    expect(await ds('C1')).toEqual([]) // khối 11
    expect(await ds('12121212')).toEqual(['lk12', 'lk10']) // tài khoản thử của thầy: mọi khối
    expect((await hs<TraLiveDsHs>('/hs/live-ds', 'A1')).j.buoi[0]!.ve).toBeTruthy()
    const mo = async (sbd: string, id: string) => (await hs<TraLiveBuoiHs>('/hs/live-buoi', sbd, { id })).status
    expect([await mo('A1', 'lk12'), await mo('D1', 'lk12'), await mo('12121212', 'lk10')]).toEqual([200, 200, 200])
    expect([await mo('A1', 'lk10'), await mo('C1', 'lk12'), await mo('A1', 'lk12d'), await mo('D1', 'lk10')]).toEqual([404, 404, 404, 404])
    d1.sql.exec('DROP TABLE bpu_luot') // nhánh dự phòng (bảng chưa có) cũng đọc hồ sơ em
    expect([await mo('A1', 'lk12'), await mo('C1', 'lk12')]).toEqual([200, 404])
    expect(emXemDuoc({ duoc: 0, quyen: 'lop', lop: 'Live Khối 12' }, undefined, 'X')).toBe(false) // em không có hồ sơ (bị khoá) ⇒ không
    expect(emXemDuoc({ duoc: 0, quyen: 'lop', lop: '12A1' }, { lop: '12' }, 'X')).toBe(false) // lớp thường: chỉ luật cũ
  })
  it('một đợt chờ D1 cho mỗi lệnh của em (đọc song song với kiểm mật khẩu)', async () => {
    themBuoi('b1')
    const token = await gameToken(env, 'A1')
    for (const [duong, them] of [['/hs/live-ds', {}], ['/hs/live-buoi', { id: 'b1' }]] as const) {
      const truoc = { ...d1.soLenh }
      await goi(duong, { method: 'POST', body: JSON.stringify({ token, ...them }) })
      expect(d1.soLenh.batch - truoc.batch, duong).toBe(1) // một lô đọc
    }
  })
})

// 11/11 — thầy: «kết thúc live chưa thấy có bản ghi». Buổi đã live mà chưa có đoạn nào vẫn có dòng (xong, 0 đoạn, kèm lý do) trong Lịch sử Live của THẦY;
// máy EM chỉ thấy buổi có từ 1 đoạn.
describe('Buổi đã live nhưng chưa có đoạn xem lại (11/11)', () => {
  const khongDoan = (id: string, o: { giay?: number; cau?: number; ngay?: string } = {}): void => {
    themBuoi(id, { ngay: o.ngay, byte: 0 })
    d1.sql.prepare('UPDATE live_buoi SET so_doan = 0, giay_doan = 0, so_cau = ?, giay_live = ?, ban = 0 WHERE id = ?').run(o.cau ?? 0, o.giay ?? 40, id)
    d1.sql.prepare('DELETE FROM live_doan WHERE buoi_id = ?').run(id)
  }
  it('máy em: /hs/live-ds không trả buổi 0 đoạn, /hs/live-buoi của buổi ấy ⇒ 404; buổi đang xử lý vẫn thấy', async () => {
    themBuoi('b1'); khongDoan('b0', { ngay: '2026-11-11' }); themBuoi('b9', { tt: 'dang_xu_ly', ngay: '2026-11-12' })
    const ds = await hs<TraLiveDsHs>('/hs/live-ds', 'A1')
    expect(ds.j.buoi.map((b) => [b.id, b.trangThai])).toEqual([['b9', 'dang_xu_ly'], ['b1', 'xong']])
    expect((await hs('/hs/live-buoi', 'A1', { id: 'b0' })).status).toBe(404)
    expect((await hs('/hs/live-buoi', 'A1', { id: 'b1' })).status).toBe(200)
  })
  it('thầy: dòng 0 đoạn có `lyDo`, không có vé mở; cột `ly_do` CHƯA có ⇒ vẫn đọc được (suy lý do từ số liệu); có cột ⇒ đúng lý do đã ghi', async () => {
    themBuoi('b1'); khongDoan('n1', { giay: 9, ngay: '2026-11-11' }); khongDoan('n2', { giay: 40, cau: 0, ngay: '2026-11-12' }); khongDoan('n3', { giay: 40, cau: 1, ngay: '2026-11-13' })
    expect((d1.sql.prepare("SELECT COUNT(*) AS n FROM pragma_table_info('live_buoi') WHERE name = 'ly_do'").get() as { n: number }).n).toBe(0)
    const truoc = await gv<TraLiveDsGv>('/gv/live-ds')
    expect(truoc.j.buoi.map((b) => [b.id, b.soDoan, b.lyDo ?? null, !!b.ve])).toEqual([['n3', 0, 'khong-doan', false], ['n2', 0, 'khong-cau', false], ['n1', 0, 'ngan', false], ['b1', 2, null, true]])
    // cột chỉ-thêm (thêm lười lúc chốt buổi 0 đoạn đầu tiên; gọi lại không lỗi, không mất dữ liệu)
    await damBaoCotLyDo(env); await damBaoCotLyDo({ ...env, DB: { prepare: (q: string) => env.DB.prepare(q), batch: (x: never[]) => env.DB.batch(x) } } as unknown as Env) // lần hai: D1 báo trùng cột ⇒ bỏ qua
    expect(d1.dem('live_buoi')).toBe(4)
    d1.sql.prepare("UPDATE live_buoi SET ly_do = 'khong-tieng-net' WHERE id = 'n3'").run()
    d1.sql.prepare("UPDATE live_buoi SET ly_do = 'khong-doan' WHERE id = 'b1'").run() // buổi CÓ đoạn: cột cũ không được đọc
    const sau = await gv<TraLiveDsGv>('/gv/live-ds')
    expect(sau.j.buoi.map((b) => [b.id, b.lyDo ?? null])).toEqual([['n3', 'khong-tieng-net'], ['n2', 'khong-cau'], ['n1', 'ngan'], ['b1', null]])
    // thầy xoá được dòng 0 đoạn
    expect((await gv<{ xoa: string[] }>('/gv/live-xoa', { ids: ['n1', 'n2'] })).j.xoa.sort()).toEqual(['n1', 'n2'])
    expect((await gv<TraLiveDsGv>('/gv/live-ds')).j.buoi.map((b) => b.id)).toEqual(['n3', 'b1'])
  })
})

describe('/gv/live-* — Lịch sử Live của thầy', () => {
  it('cần mã bí mật; danh sách có trạng thái, tiến độ, dung lượng, tổng dung lượng; không trả buổi đang xoá', async () => {
    themBuoi('b1', { byte: 19_000_000 }); themBuoi('b9', { tt: 'dang_xu_ly', ngay: '2026-11-11', byte: 0 }); themBuoi('bl', { tt: 'loi', ngay: '2026-11-08', byte: 500 }); themBuoi('bx', { tt: 'dang_xoa' })
    expect((await goi('/gv/live-ds', { method: 'POST', body: '{}' })).status).toBe(403)
    const r = await gv<TraLiveDsGv>('/gv/live-ds')
    expect(r.j.buoi.map((b) => [b.id, b.trangThai, b.byte, b.quyen, !!b.ve])).toEqual([['b9', 'dang_xu_ly', 0, 'lop', false], ['b1', 'xong', 19_000_000, 'lop', true], ['bl', 'loi', 500, 'lop', false]])
    expect(r.j.tongByte).toBe(19_000_500)
    expect(await kiemVeLive('bi-mat-thu', 'b1', r.j.buoi[1]!.ve)).toMatchObject({ sbd: SBD_THAY })
    const get = await goi('/gv/live-ds', { thay: true })
    expect(((await get.json()) as TraLiveDsGv).buoi).toHaveLength(3)
  })
  it('đổi tên: lưu tên thầy đặt (gọn, tối đa 80 ký tự), chép vào chỉ mục trang; rỗng ⇒ về tên tự động', async () => {
    themBuoi('b1'); await themTep('b1')
    expect((await gv('/gv/live-doi-ten', { id: 'b1', ten: '  Chữa đề   amine khó ' })).j).toMatchObject({ ok: true, tenThay: 'Chữa đề amine khó' })
    expect(d1.sql.prepare("SELECT ten_thay FROM live_buoi WHERE id='b1'").get()).toEqual({ ten_thay: 'Chữa đề amine khó' })
    expect(JSON.parse(new TextDecoder().decode(r2.du.get('live/b1/buoi.json')!.b)).tenThay).toBe('Chữa đề amine khó')
    expect((await hs<TraLiveDsHs>('/hs/live-ds', 'A1')).j.buoi[0]!.tenThay).toBe('Chữa đề amine khó')
    expect((await gv('/gv/live-doi-ten', { id: 'b1', ten: '   ' })).j).toMatchObject({ ok: true, tenThay: null })
    expect(d1.sql.prepare("SELECT ten_thay FROM live_buoi WHERE id='b1'").get()).toEqual({ ten_thay: null })
    expect((await gv('/gv/live-doi-ten', { id: 'khong-co', ten: 'x' })).status).toBe(404)
  })
  it('xoá hàng loạt: xoá hẳn mọi tệp R2 của buổi + hai bảng; KHÔNG đụng bpu_luot, buoi_hoc, điểm danh, buổi khác', async () => {
    themBuoi('b1', { byte: 19_000_000 }); themBuoi('b2', { byte: 34_000_000, lop: '' }); themBuoi('b3'); await themTep('b1'); await themTep('b2'); await themTep('b3')
    const chup = () => ['bpu_luot', 'buoi_hoc', 'buoi_hoc_diem_danh', 'hoc_sinh'].map((b) => d1.chup(b))
    const truoc = chup()
    const r = await gv<TraLiveXoa>('/gv/live-xoa', { ids: ['b1', 'b2', 'khong-co', '../x'] })
    expect(r.j).toMatchObject({ ok: true, xoa: ['b1', 'b2'], conDo: [], byte: 53_000_000 })
    expect([...r2.du.keys()].filter((k) => !k.startsWith('live/b3/'))).toEqual([]); expect([...r2.du.keys()]).toHaveLength(5)
    expect(d1.sql.prepare('SELECT id FROM live_buoi').all()).toEqual([{ id: 'b3' }]); expect(d1.sql.prepare('SELECT DISTINCT buoi_id FROM live_doan').all()).toEqual([{ buoi_id: 'b3' }])
    expect(chup()).toEqual(truoc)
    expect(goiPhong.filter((x) => x.duong === '/xl-don')).toEqual([{ buoi: 'bpu:b1', duong: '/xl-don', b: { xoa: true } }, { buoi: 'bpu:b2', duong: '/xl-don', b: { xoa: true } }])
    expect((await gv('/gv/live-xoa', { ids: [] })).status).toBe(400)
  })
  it('xoá đứt giữa chừng: buổi còn «dang_xoa», ẩn với em và với danh sách ngay từ bước đầu; cron chạy tiếp tới khi xong', async () => {
    themBuoi('b1'); themBuoi('b3'); await themTep('b1'); await themTep('b3')
    const xoaThat = r2.be.delete.bind(r2.be)
    let hong = true
    r2.be.delete = async (k: string | string[]) => { if (hong && (Array.isArray(k) ? k : [k]).some((x) => x.startsWith('live/b1/'))) throw new Error('R2 rớt'); return xoaThat(k) }
    const r = await gv<TraLiveXoa>('/gv/live-xoa', { ids: ['b1', 'b3'] })
    expect(r.j).toMatchObject({ ok: true, xoa: ['b3'], conDo: ['b1'] })
    expect(d1.sql.prepare("SELECT trang_thai FROM live_buoi WHERE id = 'b1'").get()).toEqual({ trang_thai: 'dang_xoa' })
    expect((await hs<TraLiveDsHs>('/hs/live-ds', 'A1')).j.buoi).toEqual([]); expect((await hs('/hs/live-buoi', 'A1', { id: 'b1' })).status).toBe(404)
    expect((await gv<TraLiveDsGv>('/gv/live-ds')).j.buoi).toEqual([])
    expect(await cronLiveXemLai(env, T0 + 30_000)).toMatchObject({ xoa: 0 }) // chưa tới 1 phút ⇒ chưa đụng
    expect(await cronLiveXemLai(env, T0 + 120_000)).toMatchObject({ xoa: 0 }) // R2 vẫn rớt ⇒ vẫn dở, không mất dấu
    hong = false
    expect(await cronLiveXemLai(env, T0 + 180_000)).toMatchObject({ xoa: 1 })
    expect(d1.dem('live_buoi')).toBe(0); expect(d1.dem('live_doan')).toBe(0); expect(r2.du.size).toBe(0)
    expect(d1.dem('bpu_luot')).toBe(3); expect(d1.dem('buoi_hoc_diem_danh')).toBe(3)
  })
  it('dựng lại: đặt «đang xử lý» rồi gọi phòng chốt ép; phòng báo không dựng được ⇒ trả lỗi, buổi về «loi»', async () => {
    themBuoi('bl', { tt: 'loi' })
    expect((await gv('/gv/live-dung-lai', { id: 'bl' })).j).toMatchObject({ ok: true })
    expect(goiPhong).toEqual([{ buoi: 'bpu:bl', duong: '/xl-chot', b: { ep: true } }])
    expect(d1.sql.prepare("SELECT trang_thai, tien_do FROM live_buoi WHERE id='bl'").get()).toEqual({ trang_thai: 'dang_xu_ly', tien_do: 5 })
    traPhong = { ok: false, lyDo: 'da-don', error: 'Khúc gốc của buổi này đã được dọn nên không dựng lại được.' }
    expect((await gv('/gv/live-dung-lai', { id: 'bl' })).j).toMatchObject({ ok: false, lyDo: 'da-don' })
    expect(d1.sql.prepare("SELECT trang_thai FROM live_buoi WHERE id='bl'").get()).toEqual({ trang_thai: 'loi' })
  })
})

describe('Cron mỗi phút — lưới đỡ', () => {
  it('không buổi nào dở ⇒ một câu đọc, không gọi phòng; bảng chưa có ⇒ thôi', async () => {
    themBuoi('b1', { tat: '2026-11-10T12:48:00.000Z' })
    const truoc = d1.soLenh.prepare
    expect(await cronLiveXemLai(env, T0)).toEqual({ soat: 0, chot: 0, xoa: 0, don: 0 })
    expect(d1.soLenh.prepare - truoc).toBe(1); expect(goiPhong).toEqual([])
    d1.sql.exec('DROP TABLE live_buoi')
    expect(await cronLiveXemLai(env, T0)).toEqual({ soat: 0, chot: 0, xoa: 0, don: 0 })
  })
  it('đang ghi ⇒ phòng soát máy thầy; đang xử lý quá 5 phút ⇒ chốt lại; xong tròn 24 giờ ⇒ dọn khúc thô', async () => {
    themBuoi('bg', { tt: 'dang_ghi' }); themBuoi('bm', { tt: 'dang_xu_ly', capNhat: new Date(T0 - 60_000).toISOString() }); themBuoi('bc', { tt: 'dang_xu_ly', capNhat: new Date(T0 - 6 * 60_000).toISOString() })
    themBuoi('bd', { tat: new Date(T0 - 24 * 3_600_000 - 120_000).toISOString() }); themBuoi('bs', { tat: new Date(T0 - 23 * 3_600_000).toISOString() }); themBuoi('bo', { tat: new Date(T0 - 30 * 3_600_000).toISOString() })
    expect(await cronLiveXemLai(env, T0)).toEqual({ soat: 1, chot: 1, xoa: 0, don: 1 })
    expect(goiPhong.map((x) => [x.buoi, x.duong]).sort()).toEqual([['bpu:bc', '/xl-chot'], ['bpu:bd', '/xl-don'], ['bpu:bg', '/xl-soat']])
  })
})
