// @vitest-environment node
// SINH TỒN ĐỢT 4 — tủ đồ bé ma, thành tích, đội cả học kỳ, thi đua / danh hiệu tuần (đặc tả docs/dac-ta-sinh-ton-v2-1311.md mục 8–10 + mục 4).
// Lõi thuần (src/lib/live-khoi/tu-do.ts) + máy chủ (server/src/sinh-ton-du-lieu.ts) trên D1 giả CHẠY SQL THẬT (node:sqlite, lược đồ thật — tests/_d1-that.ts):
//  · đồ chỉ đổi hình (không trường nào chạm luật trò); chữ điều kiện đúng chuẩn «Chuỗi N ngày» / «Cấp N»;
//  · tuần (thứ Hai 00:00 giờ VN) + học kỳ (HK1 tháng 8 → 1, HK2 tháng 2 → 7) đúng ở các mốc;
//  · ghi cuối ván: MỘT batch, bỏ máy bù `~…` + bé ma Thầy, cộng dồn, kỷ lục hạ liền lấy MAX, thi đua theo ĐỘI CẢ KỲ (bỏ đội trong trận), đội chia đều theo lớp;
//  · mặc đồ chưa mở ⇒ từ chối, không ghi; đã mở ⇒ lưu; danh hiệu tuần trước đúng người; thầy mới xem được tên.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const chuoi = vi.hoisted(() => ({ so: 0 }))
vi.mock('../server/src/chuoi-ngay-bai-d1', () => ({ chuoiBaiNeuBat: async () => null }))
vi.mock('../server/src/chuoi-ngay-hoc', () => ({ docChuoiNgayHoc: async () => chuoi.so }))

import { taoD1That, type D1That } from './_d1-that'
import { kyVeDau } from '../server/src/dau-ion-ve'
import { ghiCuoiVanSinhTon, sinhTonDuLieu, taoBang, SQL_SINH_TON_DU_LIEU } from '../server/src/sinh-ton-du-lieu'
import {
  DO_BE_MA, NGAN_DO, chuTuan, dieuKienChu, dongDieuKien, huyHieuDat, kiemMac, maHocKy, maTuan, tuanTruoc, xetDanhHieu, THANH_TICH_TRONG,
} from '../src/lib/live-khoi/tu-do'

const VN = (s: string) => Date.parse(`${s}+07:00`)

describe('lõi tủ đồ (thuần)', () => {
  it('đủ 8 món đúng bản vẽ; mỗi món CHỈ có mã · tên · ngăn · điều kiện mở — không trường nào chạm sát thương / tốc độ / máu', () => {
    expect(DO_BE_MA.map((d) => `${d.ten} — ${dieuKienChu(d)}`)).toEqual([
      'Mũ tốt nghiệp — Chuỗi 7 ngày', 'Tai nghe — Chuỗi 3 ngày', 'Mũ phù thuỷ — Cấp 20', 'Áo kẻ ô li — Cấp 10', 'Áo sao đêm — Chuỗi 30 ngày',
      'Đạn cầu vồng — Chuỗi 14 ngày', 'Pháo giấy — Cấp 40', 'Điểm 10 đỏ — Cấp 60',
    ])
    for (const d of DO_BE_MA) {
      expect(Object.keys(d).sort()).toEqual(['loai', 'ma', 'mo', 'ten'])
      expect(Object.keys(d.mo).sort()).toEqual(['kieu', 'so'])
      expect(NGAN_DO.some((n) => n.loai === d.loai)).toBe(true)
    }
    expect(JSON.stringify(DO_BE_MA)).not.toMatch(/sat|toc|mau|hp|dan_|satThuong|tocDo/i)
    expect(new Set(DO_BE_MA.map((d) => d.ma)).size).toBe(DO_BE_MA.length)
  })
  it('dòng tiến độ: «Cấp 20 · em đang cấp 14», «Chuỗi 30 ngày · em đang Chuỗi 12 ngày», đã mở ⇒ «Đã mở · Chuỗi 3 ngày»', () => {
    const t = { cap: 14, chuoi: 12 }, theo = (ma: string) => DO_BE_MA.find((d) => d.ma === ma)!
    expect(dongDieuKien(theo('mu-phu-thuy'), t)).toBe('Cấp 20 · em đang cấp 14')
    expect(dongDieuKien(theo('ao-sao-dem'), t)).toBe('Chuỗi 30 ngày · em đang Chuỗi 12 ngày')
    expect(dongDieuKien(theo('tai-nghe'), t)).toBe('Đã mở · Chuỗi 3 ngày')
  })
  it('kiểm quyền mặc: món chưa mở / sai ngăn / mã lạ ⇒ từ chối; để trống ngăn được', () => {
    const t = { cap: 14, chuoi: 12 }
    expect(kiemMac({ mu: 'mu-tot-nghiep', ao: 'ao-ke-o-li' }, t)).toEqual({ ok: true, mac: { mu: 'mu-tot-nghiep', ao: 'ao-ke-o-li', dan: null, ha: null } })
    expect(kiemMac({ mu: 'mu-phu-thuy' }, t)).toMatchObject({ ok: false, loi: expect.stringContaining('Cấp 20') })
    expect(kiemMac({ ao: 'mu-tot-nghiep' }, t).ok).toBe(false)
    expect(kiemMac({ dan: 'sung-to' }, t).ok).toBe(false)
    expect(kiemMac({}, t)).toEqual({ ok: true, mac: { mu: null, ao: null, dan: null, ha: null } })
  })
  it('tuần VN bắt đầu thứ Hai 00:00 (17:00 UTC Chủ nhật); học kỳ HK1 8 → 1, HK2 2 → 7', () => {
    expect(maTuan(VN('2026-11-15T23:59:59'))).toBe('2026-11-09')
    expect(maTuan(VN('2026-11-16T00:00:00'))).toBe('2026-11-16')
    expect(maTuan(Date.parse('2026-11-15T17:00:00Z'))).toBe('2026-11-16')
    expect(maTuan(VN('2026-11-13T12:00:00'))).toBe('2026-11-09')
    expect(tuanTruoc('2026-11-09')).toBe('2026-11-02')
    expect(chuTuan('2026-11-09')).toBe('09/11 – 15/11')
    expect(maHocKy(VN('2026-07-31T23:59:59'))).toBe('2025-HK2')
    expect(maHocKy(VN('2026-08-01T00:00:00'))).toBe('2026-HK1')
    expect(maHocKy(VN('2027-01-31T23:59:59'))).toBe('2026-HK1')
    expect(maHocKy(VN('2027-02-01T00:00:00'))).toBe('2026-HK2')
    expect(maHocKy(Date.parse('2026-07-31T17:00:00Z'))).toBe('2026-HK1') // 00:00 1/8 giờ VN
  })
  it('danh hiệu: số cao nhất > 0, hoà ⇒ cùng giữ; không ai hạ Thầy ⇒ không trao', () => {
    const ds = [{ sbd: 'a', ha: 5, dietTk: 1, haThay: 0 }, { sbd: 'b', ha: 9, dietTk: 2, haThay: 0 }, { sbd: 'c', ha: 9, dietTk: 0, haThay: 0 }]
    expect(xetDanhHieu(ds)).toEqual([{ loai: 'tho-san', so: 9, sbd: ['b', 'c'] }, { loai: 'pha-tk', so: 2, sbd: ['b'] }])
  })
  it('huy hiệu theo mốc 10/50/200 lượt hạ · hạ liền 3/5 · thủ khoa 1/10 · hạ Thầy 1', () => {
    expect(huyHieuDat(THANH_TICH_TRONG)).toEqual([])
    expect(huyHieuDat({ ha: 52, chuoiMax: 4, thuKhoa: 1, haThay: 1, van: 30 })).toEqual(['ha-10', 'ha-50', 'lien-3', 'tk-1', 'ha-thay'])
  })
})

describe('máy chủ (D1 giả chạy SQL thật)', () => {
  let d: D1That
  const nay = VN('2026-11-13T19:00:00')
  const veCua = (sbd: string) => kyVeDau('bi-mat-thu', { c: 'CA1', s: sbd, t: '', h: Date.now() + 3_600_000 })
  const goi = async (p: string, b: Record<string, unknown>, thay = false) => sinhTonDuLieu(d.env, p, b, thay)
  const themEm = (sbd: string, ten: string, lop: string, cap = 0) => {
    d.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, lop, cap_nhat_luc) VALUES (?, ?, ?, ?)').run(sbd, ten, lop, '2026-11-01')
    if (cap) d.sql.prepare('INSERT INTO game_v2_profile (sbd, revision, json, created_at) VALUES (?, 0, ?, ?)').run(sbd, JSON.stringify({ cap }), '2026-11-01')
  }
  beforeEach(() => {
    d = taoD1That(); chuoi.so = 0
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(nay)
    for (let i = 1; i <= 8; i++) themEm(`A${i}`, `Nguyễn Văn An ${i}`, '11A2', i === 1 ? 14 : 0)
    themEm('B1', 'Trần Thị Gia Bảo', '11A3'); themEm('C1', 'Lê Minh Châu', '12A1')
  })
  afterEach(() => { vi.useRealTimers() })

  it('đường đọc khi bảng CHƯA có (chưa ván nào) ⇒ vẫn trả tủ đồ, tự gán đội cả kỳ', async () => {
    const r = await goi('/sinh-ton/tu-do', { ve: await veCua('A1') })
    expect(r).toMatchObject({ ok: true, cap: 14, chuoi: 0, mac: { mu: null, ao: null, dan: null, ha: null }, hocKy: '2026-HK1', thiDua: { tuan: '2026-11-09', doi: [0, 0, 0, 0] } })
    expect(r.mo).toEqual(['ao-ke-o-li'])
    expect([0, 1, 2, 3]).toContain(r.doiKy)
    expect((await goi('/sinh-ton/tu-do', { ve: await veCua('A1') })).doiKy).toBe(r.doiKy) // cố định
    expect((await goi('/sinh-ton/tu-do', { ve: 'gia.mao' })).ok).toBe(false)
  })

  it('ghi cuối ván: MỘT batch, bỏ máy bù + bé ma Thầy, cộng dồn, hạ liền lấy MAX, đội chia đều theo lớp, thi đua theo đội cả kỳ', async () => {
    const ds = Array.from({ length: 8 }, (_, i) => ({ id: `A${i + 1}`, ha: i + 1, biHa: 1, chuoiMax: i % 4, doi: 0 }))
    await taoBang(d.env) // DDL một lần mỗi isolate (lô riêng, chỉ lần đầu)
    const batch = vi.spyOn(d.env.DB, 'batch')
    const r = await ghiCuoiVanSinhTon(d.env, { ma: 'lop-11', luc: nay, idThay: 'thay-x' }, [...ds, { id: '~m1', ha: 50 }, { id: 'thay-x', ha: 9 }, { id: 'gv', ha: 9 }, { id: '', ha: 1 }])
    expect(r.ghi).toBe(8)
    expect(batch).toHaveBeenCalledTimes(1)
    expect(d.dem('st_tuan')).toBe(8)
    expect(d.dem('st_tuan', "sbd LIKE '~%' OR sbd IN ('thay-x','gv')")).toBe(0)
    // 8 em cùng lớp ⇒ 2 em mỗi đội (bỏ «doi: 0» của trận).
    const theoDoi = d.sql.prepare("SELECT doi, COUNT(*) n FROM st_doi_ky WHERE ky = '2026-HK1' GROUP BY doi ORDER BY doi").all() as { doi: number; n: number }[]
    expect(theoDoi.map((x) => x.n)).toEqual([2, 2, 2, 2])
    await ghiCuoiVanSinhTon(d.env, { ma: 'lop-11', luc: nay }, [{ id: 'A1', ha: 3, chuoiMax: 5, thuKhoa: 1 }, { id: 'A1', ha: 1, chuoiMax: 2 }])
    const a1 = d.sql.prepare("SELECT * FROM st_thanh_tich WHERE sbd = 'A1'").get() as Record<string, number>
    expect(a1).toMatchObject({ ha: 5, chuoi_max: 5, thu_khoa: 1, van: 3 })
    const t1 = d.sql.prepare("SELECT * FROM st_tuan WHERE sbd = 'A1'").get() as Record<string, number>
    expect(t1).toMatchObject({ tuan: '2026-11-09', ha: 5, bi_ha: 1, van: 3 })
    const doiA1 = (d.sql.prepare("SELECT doi FROM st_doi_ky WHERE sbd = 'A1'").get() as { doi: number }).doi
    expect(t1.doi).toBe(doiA1)
    // Thẻ sảnh: vạch lớp 11A2 = tổng lượt hạ theo đội cả kỳ (1+..+8 = 36, + 4 của ván sau).
    const r2 = await goi('/sinh-ton/tu-do', { ve: await veCua('A1') })
    expect((r2.thiDua as { doi: number[] }).doi.reduce((a, b) => a + b, 0)).toBe(40)
    expect(r2.doiKy).toBe(doiA1)
    expect(r2.thanhTich).toEqual({ ha: 5, chuoiMax: 5, thuKhoa: 1, haThay: 0, van: 3 })
    expect(r2.huyHieu).toEqual(['lien-3', 'lien-5', 'tk-1'])
  })

  it('không em thật nào ⇒ 0 lệnh D1', async () => {
    const batch = vi.spyOn(d.env.DB, 'batch')
    expect(await ghiCuoiVanSinhTon(d.env, { ma: 'x', luc: nay }, [{ id: '~a', ha: 3 }])).toEqual({ ghi: 0 })
    expect(batch).not.toHaveBeenCalled()
  })

  it('mặc đồ: chưa mở ⇒ từ chối, KHÔNG ghi; đã mở ⇒ lưu, tủ đồ trả đúng bộ đang mặc', async () => {
    chuoi.so = 12
    const ve = await veCua('A1')
    const tu = await goi('/sinh-ton/mac', { ve, mac: { mu: 'mu-phu-thuy' } })
    expect(tu).toMatchObject({ ok: false, ma: 'chua_mo' })
    const coBang = d.sql.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE name = 'st_mac'").get() as { n: number }
    if (coBang.n) expect(d.dem('st_mac')).toBe(0)
    expect(await goi('/sinh-ton/mac', { ve, mac: { mu: 'mu-tot-nghiep', ao: 'ao-ke-o-li', dan: null, ha: null } })).toMatchObject({ ok: true })
    const r = await goi('/sinh-ton/tu-do', { ve })
    expect(r.mac).toEqual({ mu: 'mu-tot-nghiep', ao: 'ao-ke-o-li', dan: null, ha: null })
    expect(r.mo).toEqual(['mu-tot-nghiep', 'tai-nghe', 'ao-ke-o-li'])
  })

  it('danh hiệu tuần trước (xét theo khối, chỉ em thật) hiện ở tủ đồ của đúng em; thầy xem thi đua có tên, em gọi lệnh thầy bị từ chối', async () => {
    const tuanTr = VN('2026-11-05T20:00:00')
    await ghiCuoiVanSinhTon(d.env, { ma: 'p', luc: tuanTr, idThay: 'T' }, [
      { id: 'A2', ha: 9, dietTk: 1 }, { id: 'B1', ha: 12, dietTk: 0, haThay: 1 }, { id: 'A3', ha: 2, dietTk: 3 }, { id: 'C1', ha: 40 }, { id: '~b', ha: 99 },
    ])
    const b1 = await goi('/sinh-ton/tu-do', { ve: await veCua('B1') })
    expect(b1.danhHieu).toEqual(['tho-san', 'ha-thay']) // C1 khối 12 không tính vào khối 11; máy bù không bao giờ
    expect((await goi('/sinh-ton/tu-do', { ve: await veCua('A3') })).danhHieu).toEqual(['pha-tk'])
    expect((await goi('/sinh-ton/tu-do', { ve: await veCua('A2') })).danhHieu).toEqual([])
    expect(await goi('/sinh-ton/thi-dua', { khoi: 11 })).toMatchObject({ ok: false })
    await ghiCuoiVanSinhTon(d.env, { ma: 'p', luc: nay }, [{ id: 'A4', ha: 6 }])
    const gv = await goi('/sinh-ton/thi-dua', { khoi: 11 }, true)
    expect(gv).toMatchObject({ ok: true, tuan: '2026-11-09', chuTuan: '09/11 – 15/11', soEm: 1 })
    expect(gv.danhHieuTuanNay).toEqual([{ loai: 'tho-san', ten: 'Thợ săn tuần', nguoi: ['An 4'], so: 6 }])
    expect((gv.danhHieuTuanTruoc as { ten: string; nguoi: string[] }[]).map((x) => `${x.ten}: ${x.nguoi.join(', ')}`)).toEqual(['Thợ săn tuần: Gia Bảo', 'Kẻ phá thủ khoa: An 3', 'Hạ gục Thầy: Gia Bảo'])
  })

  it('bảng CHỈ-THÊM: mọi câu DDL là CREATE … IF NOT EXISTS', () => {
    for (const s of SQL_SINH_TON_DU_LIEU) expect(s).toMatch(/^CREATE (TABLE|INDEX) IF NOT EXISTS /)
  })
})
