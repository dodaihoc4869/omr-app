// @vitest-environment node
// ĐỢT 19 · LÀN R — khối `buoiHoc` của `POST /ph/tat-ca-ve-con` (điểm danh buổi học trên lớp của con; GHI-CHU bản vẽ docs/ban-ve-dot19/GHI-CHU.md mục 2).
// Khoá trên D1 GIẢ BẰNG SQLITE THẬT (tests/_d1-that.ts):
//   · phụ huynh đúng con thấy đúng số: buổi của lớp con (có mặt: giờ vào + cách điểm danh; vắng; buổi chưa kết thúc), buổi "mọi lớp" chỉ khi con có mặt,
//     buổi lớp khác không tính, ≤ 8 buổi mới trước, ngoài 60 ngày không tính, tên lớp hiệu lực theo đúng luật `tenLopCuaEm`;
//   · liên kết của con A không đọc được con B (sbd trong thân bị bỏ qua), liên kết giả bị từ chối, SBD lạ bị từ chối;
//   · KHÔNG thêm đợt chờ D1 nối tiếp: câu SQL buổi học bắt đầu ở ĐỢT ĐẦU cùng sổ học, và tổng số đợt y như khi bỏ hẳn câu ấy (bộ bọc đếm đợt như
//     tests/toc-do-may-chu-lenh-nong-1310.test.ts); không mã buổi / bí mật / sbd bạn nào lọt ra.
import { describe, expect, it } from 'vitest'
import { parentPass } from '../server/src/game-v2-auth'
import { phTatCaVeCon, SO_NGAY_BUOI_HOC, TOI_DA_BUOI_HOC } from '../server/src/ph-tat-ca-ve-con'
import type { Env } from '../server/src/kieu'
import { taoD1That, type D1That } from './_d1-that'

const T = (s: string): number => Date.parse(`${s}+07:00`)
const NOW = T('2026-10-14T21:05:00')
const iso = (s: string): string => new Date(T(s)).toISOString()

function dung(): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('hien_thi_tu','2026-10-01T00:00:00.000Z','x')").run()
  // S1: khối 12, chưa gán tên lớp ⇒ lớp hiệu lực "12 - Lớp Thường" · S2: lớp "12A1" · S3: khối 11 ⇒ lớp "11"
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,ten_lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn Minh Khôi','12',NULL,'mk','x')").run()
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,ten_lop,mat_khau,cap_nhat_luc) VALUES('S2','Trần Bình','12','12A1','mk','x')").run()
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,ten_lop,mat_khau,cap_nhat_luc) VALUES('S3','Lê An','11',NULL,'mk','x')").run()
  return d
}
let demBuoi = 0
function buoi(d: D1That, o: { ten: string; lop: string; mo: string; dong?: string | null; hetHan?: string }): string {
  const id = `BH-THU-${++demBuoi}`
  d.sql.prepare('INSERT INTO buoi_hoc(id,ten,lop,bi_mat,mo_luc,het_han,dong_luc,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?)')
    .run(id, o.ten, o.lop, 'BI-MAT-KHONG-DUOC-LO', iso(o.mo), o.hetHan ?? new Date(T(o.mo) + 24 * 3_600_000).toISOString(), o.dong === undefined ? new Date(T(o.mo) + 2 * 3_600_000).toISOString() : o.dong, 'x')
  return id
}
const diemDanh = (d: D1That, id: string, sbd: string, gio: string, cach: 'ma' | 'thay' = 'ma', tt: 'co_mat' | 'bo' = 'co_mat') =>
  d.sql.prepare('INSERT INTO buoi_hoc_diem_danh(buoi_id,sbd,luc,cach,trang_thai,cap_nhat_luc) VALUES(?,?,?,?,?,?)').run(id, sbd, iso(gio), cach, tt, 'x')
const chay = async (d: D1That, b: Record<string, unknown>, env: Env = d.env) => (await phTatCaVeCon(env, b, NOW)) as Record<string, any>

describe('buoiHoc — phụ huynh đúng con thấy đúng số', () => {
  it('buổi của lớp con: có mặt (giờ vào, cách điểm danh), vắng, "bớt em" là vắng, buổi đang mở; mới trước', async () => {
    const d = dung()
    const b1 = buoi(d, { ten: 'Buổi 1 · Ôn tập', lop: '12 - Lớp Thường', mo: '2026-10-08T17:30' })
    const b2 = buoi(d, { ten: 'Buổi 2 · Ester', lop: '12 - Lớp Thường', mo: '2026-10-10T17:30' })
    buoi(d, { ten: 'Buổi 3 · Ester', lop: '12 - Lớp Thường', mo: '2026-10-12T17:30' }) // con không điểm danh ⇒ vắng
    const b4 = buoi(d, { ten: 'Buổi 4 · Chất béo', lop: '12 - Lớp Thường', mo: '2026-10-13T17:30' })
    const b5 = buoi(d, { ten: 'Buổi 5 · Ester – Lipid', lop: '12 - Lớp Thường', mo: '2026-10-14T17:30', dong: null, hetHan: '2026-10-15T17:30:00+07:00' })
    diemDanh(d, b1, 'S1', '2026-10-08T17:45')
    diemDanh(d, b2, 'S1', '2026-10-10T17:58', 'thay')
    diemDanh(d, b4, 'S1', '2026-10-13T17:50', 'ma', 'bo') // thầy bớt em ⇒ vắng
    diemDanh(d, b5, 'S1', '2026-10-14T17:52')
    const r = await chay(d, { pass: await parentPass(d.env, 'S1') })
    expect(r.buoiHoc.ds).toEqual([
      { ten: 'Buổi 5 · Ester – Lipid', moLuc: iso('2026-10-14T17:30'), coMat: true, luc: iso('2026-10-14T17:52'), cach: 'ma', dangMo: true },
      { ten: 'Buổi 4 · Chất béo', moLuc: iso('2026-10-13T17:30'), coMat: false },
      { ten: 'Buổi 3 · Ester', moLuc: iso('2026-10-12T17:30'), coMat: false },
      { ten: 'Buổi 2 · Ester', moLuc: iso('2026-10-10T17:30'), coMat: true, luc: iso('2026-10-10T17:58'), cach: 'thay' },
      { ten: 'Buổi 1 · Ôn tập', moLuc: iso('2026-10-08T17:30'), coMat: true, luc: iso('2026-10-08T17:45'), cach: 'ma' },
    ])
    const chu = JSON.stringify(r.buoiHoc)
    for (const lo of ['BI-MAT', 'BH-THU', 'S2', 'S3', 'buoi_id', '"id"']) expect(chu).not.toContain(lo)
  })

  it('buổi "mọi lớp" chỉ tính khi con có mặt; buổi lớp khác không tính; tên lớp đã gán thắng lớp mặc định', async () => {
    const d = dung()
    const chung1 = buoi(d, { ten: 'Buổi chung có mặt', lop: '', mo: '2026-10-09T08:00' })
    buoi(d, { ten: 'Buổi chung vắng', lop: '', mo: '2026-10-09T14:00' })
    const lopKhac = buoi(d, { ten: 'Buổi 12A1', lop: '12A1', mo: '2026-10-10T17:30' })
    buoi(d, { ten: 'Buổi khối 11', lop: '11', mo: '2026-10-11T17:30' })
    diemDanh(d, chung1, 'S1', '2026-10-09T08:05')
    diemDanh(d, lopKhac, 'S2', '2026-10-10T17:40')
    const r1 = await chay(d, { sbd: 'S1' })
    expect(r1.buoiHoc.ds.map((x: any) => x.ten)).toEqual(['Buổi chung có mặt'])
    // S2 (tên lớp đã gán "12A1"): buổi 12A1 có mặt; buổi chung vắng không tính
    const r2 = await chay(d, { sbd: 'S2' })
    expect(r2.buoiHoc.ds).toEqual([{ ten: 'Buổi 12A1', moLuc: iso('2026-10-10T17:30'), coMat: true, luc: iso('2026-10-10T17:40'), cach: 'ma' }])
    // S3 (khối 11, chưa gán ⇒ lớp "11"): buổi khối 11 vắng vẫn tính
    const r3 = await chay(d, { sbd: 'S3' })
    expect(r3.buoiHoc.ds).toEqual([{ ten: 'Buổi khối 11', moLuc: iso('2026-10-11T17:30'), coMat: false }])
  })

  it(`tối đa ${TOI_DA_BUOI_HOC} buổi mới nhất; buổi trước ${SO_NGAY_BUOI_HOC} ngày không tính; chưa có buổi nào ⇒ VẮNG khoá`, async () => {
    const d = dung()
    expect('buoiHoc' in (await chay(d, { sbd: 'S1' }))).toBe(false)
    buoi(d, { ten: 'Quá cũ', lop: '12 - Lớp Thường', mo: '2026-08-01T17:30' })
    expect('buoiHoc' in (await chay(d, { sbd: 'S1' }))).toBe(false)
    for (let i = 1; i <= 10; i++) buoi(d, { ten: `Buổi ${i}`, lop: '12 - Lớp Thường', mo: `2026-10-${String(i).padStart(2, '0')}T17:30` })
    const r = await chay(d, { sbd: 'S1' })
    expect(r.buoiHoc.ds.map((x: any) => x.ten)).toEqual(['Buổi 10', 'Buổi 9', 'Buổi 8', 'Buổi 7', 'Buổi 6', 'Buổi 5', 'Buổi 4', 'Buổi 3'])
  })

  it('thiếu bảng buổi học (máy chủ mới hơn D1) ⇒ khối vắng, lệnh vẫn ok', async () => {
    const d = dung()
    d.sql.exec('DROP TABLE buoi_hoc_diem_danh; DROP TABLE buoi_hoc')
    const r = await chay(d, { sbd: 'S1' })
    expect(r.ok).toBe(true)
    expect('buoiHoc' in r).toBe(false)
  })
})

describe('buoiHoc — xác thực và phạm vi y hệt các lệnh /ph/*', () => {
  it('liên kết của con A KHÔNG đọc được con B (sbd trong thân bị bỏ qua)', async () => {
    const d = dung()
    const b = buoi(d, { ten: 'Buổi 12A1', lop: '12A1', mo: '2026-10-10T17:30' })
    diemDanh(d, b, 'S2', '2026-10-10T17:40')
    const r = await chay(d, { pass: await parentPass(d.env, 'S1'), sbd: 'S2' })
    expect(r.hoTen).toBe('Nguyễn Minh Khôi')
    expect('buoiHoc' in r).toBe(false)
    expect(JSON.stringify(r)).not.toContain('Buổi 12A1')
  })
  it('liên kết giả / sai ⇒ từ chối (không rơi xuống SBD trần); SBD lạ ⇒ từ chối', async () => {
    const d = dung()
    const pass = await parentPass(d.env, 'S1')
    await expect(phTatCaVeCon(d.env, { pass: `${pass}x`, sbd: 'S1' }, NOW)).rejects.toThrow(/không hợp lệ/)
    await expect(phTatCaVeCon(d.env, { pass: 'gia.mao', sbd: 'S1' }, NOW)).rejects.toThrow(/không hợp lệ/)
    await expect(phTatCaVeCon(d.env, { sbd: 'KHONG-CO' }, NOW)).rejects.toThrow(/Không tìm thấy số báo danh/)
  })
})

// ------------------------------------------------------------------ đếm đợt chờ D1 nối tiếp ------------------------------------------------------------------
type Lenh = { first?: unknown; all?: unknown; run?: unknown; bind?: unknown }
/** Bọc D1 đếm đợt (như tests/toc-do-may-chu-lenh-nong-1310.test.ts) + ghi đợt BẮT ĐẦU của từng câu SQL. `boQua(q)` ⇒ câu ấy trả rỗng ngay, không xếp hàng. */
function boDemDot(goc: Env['DB'], boQua: (q: string) => boolean = () => false) {
  const hang: (() => void)[] = []
  const dotCua: { q: string; dot: number }[] = []
  let dot = 0
  const cho = <T,>(q: string, f: () => Promise<T>) => new Promise<T>((ok, loi) => { dotCua.push({ q, dot: dot + 1 }); hang.push(() => { f().then(ok, loi) }) })
  const g = goc as unknown as { prepare(q: string): Lenh & object; batch(ds: unknown[]): Promise<unknown> }
  const boc = (q: string, st: Lenh & object): unknown => ({
    bind: (...a: unknown[]) => boc(q, (st.bind as (...x: unknown[]) => Lenh & object)(...a)),
    first: (...a: unknown[]) => (boQua(q) ? Promise.resolve(null) : cho(q, () => (st.first as (...x: unknown[]) => Promise<unknown>)(...a))),
    all: () => (boQua(q) ? Promise.resolve({ results: [] }) : cho(q, () => (st.all as () => Promise<unknown>)())),
    run: () => cho(q, () => (st.run as () => Promise<unknown>)()),
  })
  const db = { prepare: (q: string) => boc(q, g.prepare(q)), batch: (ds: unknown[]) => cho('BATCH', () => g.batch(ds)), withSession: () => db }
  const raNgoai = () => new Promise<void>((r) => setImmediate(r))
  async function chay<T>(viec: () => Promise<T>): Promise<{ kq: T; dot: number }> {
    let xong = false
    const p = viec().finally(() => { xong = true })
    p.catch(() => {})
    for (;;) {
      await raNgoai()
      if (xong) break
      if (hang.length) { dot++; for (const f of hang.splice(0)) f() }
    }
    return { kq: await p, dot }
  }
  return { db: db as unknown as Env['DB'], chay, dotCua }
}
const LA_CAU_BUOI = (q: string) => /FROM buoi_hoc b LEFT JOIN buoi_hoc_diem_danh/.test(q)

describe('tốc độ — không thêm đợt chờ D1 nối tiếp', () => {
  it('câu SQL buổi học bắt đầu ở đợt đầu cùng sổ học; tổng số đợt y như khi bỏ hẳn câu ấy; đúng 1 câu thêm', async () => {
    const d = dung()
    const b = buoi(d, { ten: 'Buổi 1', lop: '12 - Lớp Thường', mo: '2026-10-14T17:30' })
    diemDanh(d, b, 'S1', '2026-10-14T17:52')
    d.sql.prepare("INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn) VALUES ('k1','S1','Q1','on_lai','m',1,1,30,?,'2026-10-14')").run(iso('2026-10-14T19:31'))
    const pass = await parentPass(d.env, 'S1')
    const co = boDemDot(d.env.DB)
    const r1 = await co.chay(() => chay(d, { pass }, { ...d.env, DB: co.db } as Env))
    expect(r1.kq.buoiHoc.ds[0].coMat).toBe(true)
    const khong = boDemDot(d.env.DB, LA_CAU_BUOI)
    const r2 = await khong.chay(() => chay(d, { pass }, { ...d.env, DB: khong.db } as Env))
    expect('buoiHoc' in r2.kq).toBe(false)
    console.info(`/ph/tat-ca-ve-con: ${r2.dot} đợt / ${khong.dotCua.length} lệnh D1 (không có buổi học) → ${r1.dot} đợt / ${co.dotCua.length} lệnh D1`)
    // cùng số đợt chờ nối tiếp
    expect(r1.dot).toBe(r2.dot)
    // câu buổi học bắt đầu CÙNG đợt với câu sổ học (đợt đầu của phần dữ liệu, ngay sau xác thực)
    const dotBuoi = co.dotCua.filter((x) => LA_CAU_BUOI(x.q))
    const dotSo = co.dotCua.find((x) => /FROM su_kien_hoc WHERE sbd = \? ORDER BY luc, khoa/.test(x.q))!
    expect(dotBuoi).toHaveLength(1)
    expect(dotBuoi[0]!.dot).toBe(dotSo.dot)
    // đúng một câu D1 thêm
    expect(co.dotCua.length - khong.dotCua.length).toBe(1)
  })
})
