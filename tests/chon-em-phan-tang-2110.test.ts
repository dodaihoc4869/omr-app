// CHỌN EM LÊN BẢNG PHÂN TẦNG (thầy chốt 21/10, đặc tả docs/dac-ta-goi-len-bang-phan-tang-2110.md mục 7).
import { describe, expect, it } from 'vitest'
import { bacCuaMucDo, chiaTang, phanBoGoi, xepCapChua, xepEmPhanTang, trongSoLenBang, type CauCanGoi, type UngVienEm } from '../src/lib/chon-em-phan-tang'

/** 22 em: p tăng dần theo số thứ tự (em 1 yếu nhất), em 20–22 chưa có dữ liệu. */
const LOP: UngVienEm[] = Array.from({ length: 22 }, (_, i) => ({ sbd: `E${String(i + 1).padStart(2, '0')}`, ten: `Em ${i + 1}`, p: i < 19 ? 0.1 + (0.85 * i) / 18 : null, daDung: i >= 12 && i < 19, soLan14: i % 4 }))
const cauBac = (n: number): CauCanGoi[] => Array.from({ length: n }, (_, i) => ({ qid: `Q${i + 1}`, bac: (i % 3) as 0 | 1 | 2, ungVien: LOP }))
const ds = (m: Map<string, { sbd: string; tang: 1 | 2 | 3 }>, n: number) => Array.from({ length: n }, (_, i) => m.get(`Q${i + 1}`)!)

describe('lõi chọn em phân tầng', () => {
  it('chia 3 tầng theo phân vị 1/3; em chưa có dữ liệu vào tầng dưới; dưới 3 em không chia', () => {
    const t = chiaTang(LOP)
    expect([1, 2, 3].map((k) => [...t.values()].filter((v) => v === k).length)).toEqual([7, 8, 7])
    for (const s of ['E20', 'E21', 'E22']) expect(t.get(s)).toBe(1)
    expect(t.get('E19')).toBe(3)
    expect([...chiaTang(LOP.slice(0, 2)).values()]).toEqual([2, 2])
  })

  it('23 câu cho 22 em: MỌI em được gọi trước khi có lần hai; đúng một em lên lần hai; không em nào hai câu liền nhau', () => {
    const kq = ds(xepEmPhanTang(cauBac(23), { hatGiong: 'BH-1' }), 23)
    const pb = phanBoGoi(kq)
    expect(pb.soEm).toBe(22)
    expect(pb.lenLan2).toBe(1)
    expect(pb.lienNhau).toBe(false)
    expect(new Set(kq.slice(0, 22).map((k) => k.sbd)).size).toBe(22)
  })

  it('ba tầng mỗi tầng ≈ 1/3 lượt; câu Nhận biết vào Cần kèm, câu Vận dụng vào Khá (khi tầng còn em)', () => {
    const m = xepEmPhanTang(cauBac(9), { hatGiong: 'BH-2' })
    const kq = ds(m, 9)
    expect([1, 2, 3].map((t) => kq.filter((k) => k.tang === t).length)).toEqual([3, 3, 3])
    expect(['Q1', 'Q4', 'Q7'].map((q) => m.get(q)!.tang)).toEqual([1, 1, 1])
    expect(['Q3', 'Q6', 'Q9'].map((q) => m.get(q)!.tang)).toEqual([3, 3, 3])
    expect(m.get('Q1')!.lyDo).toMatch(/^Câu dễ → em Cần kèm · /)
  })

  it('cùng hạt giống ⇒ cùng kết quả; khác hạt giống ⇒ thường khác (không cố định một em)', () => {
    const a = ds(xepEmPhanTang(cauBac(12), { hatGiong: 'X' }), 12).map((k) => k.sbd)
    expect(ds(xepEmPhanTang(cauBac(12), { hatGiong: 'X' }), 12).map((k) => k.sbd)).toEqual(a)
    const khac = ['Y', 'Z', 'W'].map((h) => ds(xepEmPhanTang(cauBac(12), { hatGiong: h }), 12).map((k) => k.sbd).join())
    expect(khac.some((x) => x !== a.join())).toBe(true)
  })

  it('chế độ "Chắc đúng" giữ y bộ chọn cũ: em đã đúng trước, rồi p cao (chính là lỗi "chỉ gọi vài em giỏi")', () => {
    const kq = ds(xepEmPhanTang(cauBac(6), { cheDo: 'chac' }), 6)
    expect(kq.every((k) => LOP.find((e) => e.sbd === k.sbd)!.daDung)).toBe(true)
  })

  it('chế độ "Ngẫu nhiên": vẫn mỗi em một lần, không phân tầng; em lâu chưa lên bảng có trọng số cao hơn', () => {
    const kq = ds(xepEmPhanTang(cauBac(22), { cheDo: 'ngau', hatGiong: 'N' }), 22)
    expect(new Set(kq.map((k) => k.sbd)).size).toBe(22)
    expect([0, 1, 2, 5].map(trongSoLenBang)).toEqual([3, 1.5, 1, 0.7])
  })

  it('em đã lên ở lượt trước của buổi (daLenTrongBuoi) và em thầy bỏ qua không bị gọi lại khi còn em khác', () => {
    const daLen = new Map(LOP.slice(0, 20).map((e) => [e.sbd, 1]))
    const kq = ds(xepEmPhanTang(cauBac(2), { hatGiong: 'L', daLenTrongBuoi: daLen }), 2)
    expect(kq.map((k) => k.sbd).sort()).toEqual(['E21', 'E22'])
    const bo = new Map([['Q1', new Set(LOP.filter((e) => e.sbd !== 'E05').map((e) => e.sbd))]])
    expect(xepEmPhanTang(cauBac(1), { boQua: bo }).get('Q1')!.sbd).toBe('E05')
  })

  it('chữa câu: vai lên bảng là em ĐÃ SAI, vai giảng lại là em ĐÃ ĐÚNG, khác em; 3 câu ⇒ 6 em khác nhau', () => {
    const uv = LOP.map((e, i) => ({ ...e, soSai: i < 12 ? 1 + (i % 2) : 0 }))
    const cau: CauCanGoi[] = ['A', 'B', 'C'].map((q) => ({ qid: q, bac: 2, ungVien: uv }))
    const m = xepCapChua(cau, { hatGiong: 'C' })
    const em = new Set<string>()
    for (const q of ['A', 'B', 'C']) {
      const c = m.get(q)!
      expect(uv.find((e) => e.sbd === c.lenBang!.sbd)!.soSai).toBeGreaterThan(0)
      expect(uv.find((e) => e.sbd === c.giangLai!.sbd)!.daDung).toBe(true)
      expect(c.lenBang!.lyDo).toMatch(/^Đã sai câu này \d lần/)
      em.add(c.lenBang!.sbd); em.add(c.giangLai!.sbd)
    }
    expect(em.size).toBe(6)
  })

  it('mức độ câu chuẩn hoá: biết / hiểu / VD-VDC; lạ ⇒ thông hiểu', () => {
    expect(['biet', 'Nhận biết', 'hieu', 'VD', 'VDC', 'van_dung', '', null].map(bacCuaMucDo)).toEqual([0, 0, 1, 2, 2, 2, 1, 1])
  })
})
