// Xếp Học thật · Cần theo dõi · Đối phó · Không dạy nổi · ĐUỔI (thầy 24/10). Đặc tả docs/DE-XUAT-HOC-THAT-DOI-PHO-2410.md mục 4b.
import { describe, expect, it } from 'vitest'
import { bacCongKhai, bacTheoLichSu, canDuoiWilson, danhGiaEm, type CanThiep, type DauVaoDanhGia, type LuotDanhGia, type TuanDaTinh } from '../server/src/danh-gia-hoc-that'

const NGAY = Array.from({ length: 14 }, (_, i) => `2026-10-${String(11 + i).padStart(2, '0')}`)
function luot(n: number, f: (i: number) => Partial<LuotDanhGia>): LuotDanhGia[] {
  return Array.from({ length: n }, (_, i) => ({
    phan: 'I', dung: true, ma: 3, r: 1.5, pLop: 0.6, chon: 'ABCD'[i % 4]!, coGoiY: false, songSinh: false,
    ngay: NGAY[i % 14]!, luc: `${NGAY[i % 14]}T0${i % 10}:00:00Z`, ...f(i),
  }))
}
const vao = (l: LuotDanhGia[], them: Partial<DauVaoDanhGia> = {}): DauVaoDanhGia => ({ luot: l, ngayCuaSo: NGAY, ktcn: { daNop: 0, boHan: 0, diem: [] }, thi: [], gianLanXacNhan: 0, buoi: null, ...them })

describe('Wilson', () => {
  it('ít lượt ⇒ cận dưới thấp (không phạt oan); nhiều lượt ⇒ sát tỉ lệ thật', () => {
    expect(canDuoiWilson(3, 5)).toBeLessThan(0.4)
    expect(canDuoiWilson(30, 50)).toBeGreaterThan(0.5)
    expect(canDuoiWilson(0, 0)).toBe(0)
  })
})

describe('Điểm Thật một tuần', () => {
  it('nhanh mà ĐÚNG («Thuộc») không bị phạt ⇒ Học thật', () => {
    const k = danhGiaEm(vao(luot(60, () => ({ ma: 1, thuoc: true, dung: true, r: 0.2 }))))
    expect(k.phat).toEqual([])
    expect(k).toMatchObject({ diem: 100, bacTuan: 1, duDuLieu: true })
    expect(k.soLieu.soThuoc).toBe(60)
  })
  it('em YẾU (sai nhiều nhưng làm chậm, có nghĩ) vẫn là Học thật — điểm thấp không bao giờ là lý do Đối phó', () => {
    const k = danhGiaEm(vao(luot(60, (i) => ({ dung: i % 3 === 0, ma: 3, r: 2 }))))
    expect(k.bacTuan).toBe(1)
  })
  it('nhanh mà SAI nhiều (câu không khó) ⇒ Đối phó, lý do bằng số', () => {
    const k = danhGiaEm(vao(luot(60, (i) => (i < 30 ? { ma: 1, dung: false, r: 0.2, pLop: 0.85 } : { ma: 3, dung: true }))))
    expect(k.bacTuan).toBe(3)
    expect(k.phat[0]!.chu).toContain('30/60 lượt trả lời trước khi đọc xong đề mà sai')
  })
  it('sai NHANH ở câu KHÓ (lớp đúng < 40%) không tính', () => {
    const k = danhGiaEm(vao(luot(60, (i) => (i < 30 ? { ma: 1, dung: false, r: 0.2, pLop: 0.2 } : { ma: 3, dung: true }))))
    expect(k.phat.find((p) => p.ma === 'nhanMaSai' && p.chu.includes('trước khi đọc xong'))).toBeUndefined()
  })
  it('bấm liền ≥ 6 câu cùng một đáp án ⇒ phạt bấm lặp', () => {
    const k = danhGiaEm(vao(luot(30, (i) => ({ chon: 'B', ngay: NGAY[0]!, luc: `${NGAY[0]}T00:${String(i).padStart(2, '0')}:00Z` }))))
    expect(k.phat.find((p) => p.ma === 'bamLap')).toBeTruthy()
  })
  it('cố tình treo máy ≥ 2 ngày ⇒ cờ đỏ (Đối phó dù điểm còn cao)', () => {
    const l = [...luot(40, () => ({})), ...luot(6, (i) => ({ treo: 'co_tinh' as const, ngay: NGAY[i % 2]! }))]
    const k = danhGiaEm(vao(l))
    expect(k.coDo).toBe(true)
    expect(k.bacTuan).toBe(3)
  })
  it('thuộc mà không hiểu: đúng câu gốc cao, bản song sinh thấp ⇒ phạt', () => {
    const l = [...luot(30, () => ({ dung: true })), ...luot(12, (i) => ({ songSinh: true, dung: i < 3 }))]
    expect(danhGiaEm(vao(l)).phat.find((p) => p.ma === 'thuocKhongHieu')).toBeTruthy()
  })
  it('ít lượt ⇒ chưa đủ dữ liệu, không gắn Đối phó vì vài lượt', () => {
    const k = danhGiaEm(vao(luot(6, () => ({ ma: 1, dung: false, r: 0.1 }))))
    expect(k.duDuLieu).toBe(false)
    expect(k.bacTuan).toBe(1)
  })
})

const T = (tuan: string, diem: number, bacTuan: 1 | 2 | 3, bac: 1 | 2 | 3 | 4 | 5 = bacTuan, them: Partial<TuanDaTinh> = {}): TuanDaTinh => ({ tuan, diem, bacTuan, bac, coDo: false, ...them })
const KHONG_TIEN = { dungBanKhac: 0.2, ktcnXuHuong: -1, nhan: 'di_lui' as const }

describe('Thang 5 bậc', () => {
  it('Đối phó tuần đầu ⇒ nhắc em; tuần thứ hai liền ⇒ báo phụ huynh', () => {
    expect(bacTheoLichSu(T('2026-10-26', 50, 3), [], [], KHONG_TIEN, '2026-10-26T01:00:00Z')).toMatchObject({ bac: 3, viec: 'nhac_em' })
    expect(bacTheoLichSu(T('2026-10-26', 50, 3), [T('2026-10-19', 55, 3)], [], KHONG_TIEN, '2026-10-26T01:00:00Z')).toMatchObject({ bac: 3, viec: 'bao_ph' })
  })
  it('KHÔNG có nhật ký can thiệp ⇒ không bao giờ lên Không dạy nổi / ĐUỔI (dù Đối phó 4 tuần)', () => {
    const k = bacTheoLichSu(T('2026-11-16', 30, 3), [T('2026-11-09', 30, 3), T('2026-11-02', 30, 3), T('2026-10-26', 30, 3)], [], KHONG_TIEN, '2026-11-16T01:00:00Z')
    expect(k.bac).toBe(3)
  })
  it('Đối phó 3/4 tuần + 2 lần nhắc đã xem không hiệu quả + không tiến bộ ⇒ Không dạy nổi, đề nghị gọi PH mở cam kết', () => {
    const ct: CanThiep[] = [
      { loai: 'nhac_em', luc: '2026-10-26T01:00:00Z', emXem: '2026-10-26T09:00:00Z' },
      { loai: 'bao_ph', luc: '2026-11-02T01:00:00Z', phXem: '2026-11-02T12:00:00Z' },
    ]
    const k = bacTheoLichSu(T('2026-11-16', 40, 3), [T('2026-11-09', 42, 3), T('2026-11-02', 45, 3), T('2026-10-26', 44, 3)], ct, KHONG_TIEN, '2026-11-16T01:00:00Z')
    expect(k).toMatchObject({ bac: 4, viec: 'goi_ph_mo_cam_ket' })
    expect(k.bangChung?.length).toBe(4)
  })
  it('hết 14 ngày cam kết mà vẫn dưới 60 ⇒ ĐUỔI (máy kết luận, thầy xác nhận)', () => {
    const ct: CanThiep[] = [{ loai: 'cam_ket', luc: '2026-11-16T03:00:00Z' }]
    const k = bacTheoLichSu(T('2026-11-30', 45, 3), [T('2026-11-23', 50, 3, 4), T('2026-11-16', 40, 3, 4)], ct, KHONG_TIEN, '2026-11-30T03:00:00Z')
    expect(k).toMatchObject({ bac: 5, viec: 'xac_nhan_nghi' })
  })
  it('đường tắt: 2 lần gian lận thi đã xác nhận trong 4 tuần ⇒ ĐUỔI ngay', () => {
    const k = bacTheoLichSu(T('2026-11-02', 70, 3, 3, { coDoNang: { coTinh: false, gianLan: 1, boVaVang: false } }), [T('2026-10-26', 65, 3, 3, { coDoNang: { coTinh: false, gianLan: 1, boVaVang: false } })], [], KHONG_TIEN, '2026-11-02T01:00:00Z')
    expect(k.bac).toBe(5)
  })
  it('thầy bấm «Cho thêm 2 tuần» ⇒ trần Không dạy nổi trong 14 ngày', () => {
    const k = bacTheoLichSu(T('2026-11-02', 70, 3, 3, { coDoNang: { coTinh: false, gianLan: 2, boVaVang: false } }), [], [{ loai: 'cho_them', luc: '2026-11-01T00:00:00Z' }], KHONG_TIEN, '2026-11-02T01:00:00Z')
    expect(k.bac).toBe(4)
  })
  it('đi xuống: Đối phó tuần trước, tuần này tốt ⇒ vẫn Đối phó; 2 tuần liền tốt ⇒ hạ MỘT bậc', () => {
    expect(bacTheoLichSu(T('2026-11-02', 90, 1), [T('2026-10-26', 50, 3, 3)], [], KHONG_TIEN, '2026-11-02T01:00:00Z').bac).toBe(3)
    expect(bacTheoLichSu(T('2026-11-09', 90, 1), [T('2026-11-02', 90, 1, 3), T('2026-10-26', 50, 3, 3)], [], KHONG_TIEN, '2026-11-09T01:00:00Z').bac).toBe(2)
    expect(bacTheoLichSu(T('2026-11-09', 90, 1), [T('2026-11-02', 88, 1, 5)], [], KHONG_TIEN, '2026-11-09T01:00:00Z').bac).toBe(4)
  })
  it('học sinh / phụ huynh chỉ thấy Học thật hoặc Đối phó', () => {
    expect([1, 2, 3, 4, 5].map((b) => bacCongKhai(b as 1))).toEqual([1, 1, 3, 3, 3])
  })
})
