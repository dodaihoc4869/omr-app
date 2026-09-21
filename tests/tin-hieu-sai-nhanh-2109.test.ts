// TÍN HIỆU "sai nhanh hôm trước, đúng hôm sau" (Code 1, 21/09/2026; Boss: chỉ-đọc cho thầy, KHÔNG phạt tự động).
import { describe, expect, it } from 'vitest'
import { mulberry32 } from '../src/lib/exam-shuffle'
import { TIN_HIEU_SAI_NHANH, chuTinHieuSaiNhanh, demSaiNhanhDungLai, type SuKienSaiNhanh } from '../src/lib/tin-hieu-sai-nhanh'

const HOM_NAY = '2026-09-25'
const ev = (qid: string, ngayVn: string, ketQua: 0 | 1 | null, giay: number | null): SuKienSaiNhanh => ({ qid, ngayVn, ketQua, giay })
/** n câu: sai `giay` giây ngày `saiNgay`, đúng ngày `dungNgay`. */
const cap = (n: number, saiNgay: string, dungNgay: string, giay = 2, tienTo = 'Q'): SuKienSaiNhanh[] => Array.from({ length: n }, (_, i) => [ev(`${tienTo}${i}`, saiNgay, 0, giay), ev(`${tienTo}${i}`, dungNgay, 1, 20)]).flat()

describe('demSaiNhanhDungLai', () => {
  it('mặc định: cửa sổ 7 ngày, sai < 5 giây, đúng NGÀY LIỀN SAU, ngưỡng 8 câu; 8 câu ⇒ có, 7 câu ⇒ không', () => {
    expect(TIN_HIEU_SAI_NHANH).toEqual({ cuaSoNgay: 7, nguongGiay: 5, nguongSoCau: 8 })
    const tam = demSaiNhanhDungLai(cap(8, '2026-09-23', '2026-09-24'), HOM_NAY)
    expect(tam).toEqual({ soCau: 8, nguongSoCau: 8, nguongGiay: 5, cuaSoNgay: 7, tuNgay: '2026-09-19', co: true })
    expect(demSaiNhanhDungLai(cap(7, '2026-09-23', '2026-09-24'), HOM_NAY)).toMatchObject({ soCau: 7, co: false })
  })
  it('KHÔNG tính: sai từ 5 giây trở lên, sai không phải ngày liền trước, đúng cùng ngày, đúng cách 2 ngày, thiếu giây, kết quả null, ngoài cửa sổ', () => {
    const d = (ds: SuKienSaiNhanh[]) => demSaiNhanhDungLai(ds, HOM_NAY).soCau
    expect(d(cap(1, '2026-09-23', '2026-09-24', 5))).toBe(0) // đúng 5 giây: không "dưới 5"
    expect(d(cap(1, '2026-09-23', '2026-09-24', 4.99))).toBe(1)
    expect(d(cap(1, '2026-09-22', '2026-09-24'))).toBe(0) // đúng cách 2 ngày
    expect([ev('A', '2026-09-24', 0, 1), ev('A', '2026-09-24', 1, 9)]).toBeTruthy()
    expect(d([ev('A', '2026-09-24', 0, 1), ev('A', '2026-09-24', 1, 9)])).toBe(0) // cùng ngày
    expect(d([ev('A', '2026-09-24', 0, null), ev('A', '2026-09-25', 1, 9)])).toBe(0) // thiếu giây
    expect(d([ev('A', '2026-09-24', null, 1), ev('A', '2026-09-25', 1, 9)])).toBe(0) // chưa có kết quả
    expect(d([ev('A', '2026-09-24', 0, 1), ev('A', '2026-09-25', 0, 9)])).toBe(0) // hôm sau vẫn sai
    expect(d([ev('A', '2026-09-18', 0, 1), ev('A', '2026-09-19', 1, 9)])).toBe(0) // trước cửa sổ (từ 19/09 tính; sai 18/09 ngoài)
    expect(d([ev('A', '2026-09-19', 0, 1), ev('A', '2026-09-20', 1, 9)])).toBe(1) // mép cửa sổ: trong
    expect(d([ev('A', '2026-09-26', 0, 1), ev('A', '2026-09-27', 1, 9)])).toBe(0) // tương lai
  })
  it('đếm câu KHÁC NHAU: một câu sai nhanh nhiều lần / đúng nhiều lần vẫn là 1; hai ngày liên tiếp cùng thoả vẫn là 1 câu', () => {
    const ds = [ev('A', '2026-09-22', 0, 1), ev('A', '2026-09-22', 0, 2), ev('A', '2026-09-23', 1, 9), ev('A', '2026-09-23', 0, 1), ev('A', '2026-09-24', 1, 9)]
    expect(demSaiNhanhDungLai(ds, HOM_NAY).soCau).toBe(1)
  })
  it('tuỳ chọn: cửa sổ, ngưỡng giây, ngưỡng số câu; thuần (không sửa đầu vào, tất định); chữ báo cho thầy có số thật, rỗng khi không có tín hiệu', () => {
    const ds = Object.freeze(cap(3, '2026-09-24', '2026-09-25', 7).map((e) => Object.freeze(e)))
    expect(demSaiNhanhDungLai(ds, HOM_NAY).soCau).toBe(0)
    expect(demSaiNhanhDungLai(ds, HOM_NAY, { nguongGiay: 8, nguongSoCau: 3 })).toMatchObject({ soCau: 3, co: true })
    expect(demSaiNhanhDungLai(cap(2, '2026-09-20', '2026-09-21'), HOM_NAY, { cuaSoNgay: 3, nguongSoCau: 1 }).soCau).toBe(0)
    expect(demSaiNhanhDungLai(cap(2, '2026-09-20', '2026-09-21'), HOM_NAY, { cuaSoNgay: 6, nguongSoCau: 1 }).soCau).toBe(2)
    expect(demSaiNhanhDungLai(ds, HOM_NAY)).toEqual(demSaiNhanhDungLai(ds, HOM_NAY))
    const co = demSaiNhanhDungLai(cap(9, '2026-09-23', '2026-09-24'), HOM_NAY)
    expect(chuTinHieuSaiNhanh(co)).toBe('Em có 9 câu sai rất nhanh (dưới 5 giây) rồi làm đúng vào hôm sau trong 7 ngày gần nhất. Thầy có thể xem cách em làm bài.')
    expect(chuTinHieuSaiNhanh(demSaiNhanhDungLai([], HOM_NAY))).toBe('')
    // ngưỡng giây riêng ⇒ chữ nói đúng số đã dùng (không cứng 5)
    expect(chuTinHieuSaiNhanh(demSaiNhanhDungLai(ds, HOM_NAY, { nguongGiay: 8, nguongSoCau: 3 }))).toBe('Em có 3 câu sai rất nhanh (dưới 8 giây) rồi làm đúng vào hôm sau trong 7 ngày gần nhất. Thầy có thể xem cách em làm bài.')
  })
  it('TÍNH CHẤT 3 000 sổ ngẫu nhiên: soCau ≤ số câu khác nhau; thêm sự kiện đúng KHÔNG làm giảm; co ⇔ soCau ≥ ngưỡng; xáo trộn thứ tự không đổi kết quả', () => {
    const r = mulberry32(8)
    for (let i = 0; i < 3000; i++) {
      const ds: SuKienSaiNhanh[] = Array.from({ length: Math.floor(r() * 40) }, () => ev(`Q${Math.floor(r() * 12)}`, `2026-09-${String(17 + Math.floor(r() * 9)).padStart(2, '0')}`, ([0, 1, null] as const)[Math.floor(r() * 3)]!, r() < 0.15 ? null : Math.floor(r() * 12)))
      const a = demSaiNhanhDungLai(ds, HOM_NAY)
      expect(a.soCau, `#${i}`).toBeLessThanOrEqual(new Set(ds.map((e) => e.qid)).size)
      expect(a.co, `#${i}`).toBe(a.soCau >= 8)
      const them = demSaiNhanhDungLai([...ds, ev(`Q${Math.floor(r() * 12)}`, `2026-09-${String(18 + Math.floor(r() * 8)).padStart(2, '0')}`, 1, 30)], HOM_NAY)
      expect(them.soCau, `#${i}`).toBeGreaterThanOrEqual(a.soCau)
      expect(demSaiNhanhDungLai([...ds].reverse(), HOM_NAY).soCau, `#${i}`).toBe(a.soCau)
    }
  })
})
