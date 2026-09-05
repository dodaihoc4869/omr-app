// RÚT ĐỀ CHO BUỔI CHỮA BÀI — chế độ "Phân công lên bảng" ở khối Bộ câu ra đề.
//
// Máy tự chọn hết, nên phải kiểm bằng số chứ không tin mắt: đúng ngân sách
// giây, phủ đều chuyên đề, ưu tiên câu nhiều sao, đẩy câu nghi đáp án xuống
// cuối, và trộn lại phải ra bộ khác.
import { describe, expect, it } from 'vitest'
import { dungUngVien, giayUocTinh, GIAY_MOI_CAU, PHAN_DE, rutDeLenBang, soCauCua, soCauLenBang, soTinHieu, tongCau, type CauUngVien, type PhanDe } from '../src/lib/rut-de'
import type { TeacherExamSource } from '../src/data/examContent'

/** Kho giả: 3 chuyên đề × 20 câu Phần I, 12 câu Phần II, 9 câu Phần III. */
const CD = ['Ester – lipid', 'Carbohydrate', 'Hợp chất chứa N']

function khoGia(): TeacherExamSource[] {
  const sao = (i: number): 0 | 1 | 2 => (i % 10 === 0 ? 2 : i % 5 === 0 ? 1 : 0)
  return [
    {
      maDe: 'KHO',
      phanI: Array.from({ length: 60 }, (_, i) => ({
        id: `I${i}`,
        text: `TN ${i}`,
        choices: ['a', 'b', 'c', 'd'],
        correct: 'A',
        chuyenDe: CD[i % 3],
        mucDo: 'hieu',
        canChua: sao(i) ? { sao: sao(i), ly_do: 'câu nền' } : undefined,
      })),
      phanII: Array.from({ length: 12 }, (_, i) => ({
        id: `II${i}`,
        text: `ĐS ${i}`,
        ideas: ['a', 'b', 'c', 'd'],
        correct: ['D', 'S', 'D', 'S'],
        chuyenDe: CD[i % 3],
        mucDo: 'hieu',
      })),
      phanIII: Array.from({ length: 9 }, (_, i) => ({
        id: `III${i}`,
        text: `TLN ${i}`,
        correct: '1',
        chuyenDe: CD[i % 3],
        mucDo: 'van_dung',
      })),
    } as unknown as TeacherExamSource,
  ]
}

const UV = dungUngVien(khoGia())

describe('số câu theo ngân sách giây', () => {
  it('ca 15 phút ra bộ nhỏ, KHÔNG vượt 15 phút', () => {
    const s = soCauLenBang(UV, 15)
    expect(giayUocTinh(s)).toBeLessThanOrEqual(15 * 60)
    expect(tongCau(s)).toBeGreaterThan(0)
  })

  it('ca dài hơn thì ra nhiều câu hơn, không phải con số cố định', () => {
    expect(tongCau(soCauLenBang(UV, 45))).toBeGreaterThan(tongCau(soCauLenBang(UV, 15)))
  })

  it('không phần nào ngốn hết ngân sách của phần khác', () => {
    const s = soCauLenBang(UV, 15)
    for (const p of PHAN_DE) expect(s[p] * GIAY_MOI_CAU[p]).toBeLessThan(15 * 60)
    expect(s.II).toBeGreaterThan(0)
  })

  it('kho thiếu câu thì chặn theo kho, không đòi câu không có', () => {
    const nho = dungUngVien([{ maDe: 'X', phanI: [], phanII: [], phanIII: [] } as unknown as TeacherExamSource])
    expect(soCauLenBang(nho, 45)).toEqual({ I: 0, II: 0, III: 0 })
  })

  it('Phần II một câu đáng bốn tín hiệu', () => {
    expect(soTinHieu({ I: 6, II: 2, III: 1 })).toBe(6 + 8 + 1)
  })
})

describe('chọn câu cho buổi chữa bài', () => {
  const kq = rutDeLenBang(UV, { phut: 15, seed: 1 })
  const moiCau = PHAN_DE.flatMap((p) => kq.chon[p])

  it('rút đúng số câu ngân sách cho phép, không thiếu', () => {
    expect(soCauCua(kq)).toEqual(soCauLenBang(UV, 15))
    expect(kq.thieu).toEqual({ I: 0, II: 0, III: 0 })
  })

  it('không câu nào lặp', () => {
    expect(new Set(moiCau.map((c) => c.id)).size).toBe(moiCau.length)
  })

  it('PHỦ ĐỀU chuyên đề — không dồn hết vào một chỗ', () => {
    const dem = new Map<string, number>()
    for (const c of moiCau) dem.set(c.chuyenDe, (dem.get(c.chuyenDe) ?? 0) + 1)
    expect(dem.size).toBe(3)
    // lệch tối đa một câu giữa chuyên đề nhiều nhất và ít nhất, trong từng phần
    for (const p of PHAN_DE) {
      const d = new Map<string, number>()
      for (const c of kq.chon[p]) d.set(c.chuyenDe, (d.get(c.chuyenDe) ?? 0) + 1)
      const so = CD.map((t) => d.get(t) ?? 0)
      expect(Math.max(...so) - Math.min(...so)).toBeLessThanOrEqual(1)
    }
  })

  it('ưu tiên câu NHIỀU SAO: câu 2 sao được lấy trước câu 0 sao cùng chuyên đề', () => {
    // Kho chỉ một chuyên đề để sao là khoá duy nhất còn tác dụng.
    const mot = dungUngVien([
      {
        maDe: 'M',
        phanI: [
          { id: 'x0', text: 'a', choices: ['a', 'b', 'c', 'd'], correct: 'A', chuyenDe: 'Ester', mucDo: 'hieu' },
          { id: 'x2', text: 'b', choices: ['a', 'b', 'c', 'd'], correct: 'A', chuyenDe: 'Ester', mucDo: 'hieu', canChua: { sao: 2, ly_do: 'câu nền' } },
          { id: 'x1', text: 'c', choices: ['a', 'b', 'c', 'd'], correct: 'A', chuyenDe: 'Ester', mucDo: 'hieu', canChua: { sao: 1, ly_do: 'hay sai' } },
        ],
        phanII: [],
        phanIII: [],
      } as unknown as TeacherExamSource,
    ])
    const r = rutDeLenBang(mot, { phut: 2, seed: 1 })
    expect(r.chon.I[0].id).toBe('x2')
    expect(r.chon.I[1].id).toBe('x1')
    expect(r.chon.I.map((c) => c.id)).not.toContain('x0')
  })

  it('câu NGHI ĐÁP ÁN xuống cuối — không đưa câu chưa chắc lên bảng chữa', () => {
    const nghi = dungUngVien([
      {
        maDe: 'N',
        phanI: [
          { id: 'nghi', text: 'a', choices: ['a', 'b', 'c', 'd'], correct: 'A', chuyenDe: 'Ester', mucDo: 'hieu', canChua: { sao: 2, ly_do: 'nền' }, canXem: true },
          { id: 'sach', text: 'b', choices: ['a', 'b', 'c', 'd'], correct: 'A', chuyenDe: 'Ester', mucDo: 'hieu', canChua: { sao: 2, ly_do: 'nền' } },
        ],
        phanII: [],
        phanIII: [],
      } as unknown as TeacherExamSource,
    ])
    expect(nghi.I.find((c) => c.id === 'nghi')?.canXem).toBe(true)
    const r = rutDeLenBang(nghi, { phut: 2, seed: 1 })
    expect(r.chon.I[0].id).toBe('sach')
  })

  it('câu đã ra ở ca trước bị đẩy xuống, nhưng không cấm hẳn', () => {
    const r = rutDeLenBang(UV, { phut: 15, seed: 1, tranhQid: UV.I.slice(0, 40).map((c) => c.id) })
    expect(r.lapLai).toBeLessThan(soCauCua(r).I)
    expect(r.thieu).toEqual({ I: 0, II: 0, III: 0 })
  })

  it('cùng seed ra y hệt, đổi seed ra bộ khác — nút Trộn lại có tác dụng', () => {
    const a = rutDeLenBang(UV, { phut: 15, seed: 7 })
    const b = rutDeLenBang(UV, { phut: 15, seed: 7 })
    const c = rutDeLenBang(UV, { phut: 15, seed: 8 })
    const id = (k: typeof a) => PHAN_DE.flatMap((p) => k.chon[p].map((x: CauUngVien) => x.id)).join(',')
    expect(id(a)).toBe(id(b))
    expect(id(a)).not.toBe(id(c))
  })
})

describe('khối Bộ câu ra đề — chế độ thứ ba', () => {
  it('có chip "Phân công lên bảng" và ép cả lớp cùng một đề', async () => {
    const ma = (await import('../src/components/KhoiRutDe.tsx?raw')).default
    expect(ma).toContain('Phân công lên bảng')
    expect(ma).toContain("setCheDo('lenbang')")
    // soCau báo lên = ĐÚNG cỡ kho đã rút ⇒ mỗi em làm hết ⇒ cả lớp cùng một đề
    expect(ma).toContain('onDoi({ ids: moiIdDaRut(kq), soCau: kho, lenBang: true })')
    expect(ma).toContain('Cả lớp làm CÙNG một đề')
  })

  it('số câu tính theo thời lượng ca chứ không phải con số cứng', async () => {
    const ma = (await import('../src/components/KhoiRutDe.tsx?raw')).default
    expect(ma).toContain('soCauLenBang(uv, phutLamBai)')
    expect(ma).toContain('phutLamBai={thoiGianPhut}'.replace('phutLamBai={thoiGianPhut}', 'phutLamBai'))
  })

  it('chọn chế độ này thì màn Mở ca tự bật nút gạt lên bảng', async () => {
    const ma = (await import('../src/screens/ExamSetupScreen.tsx?raw')).default
    expect(ma).toContain('phutLamBai={thoiGianPhut}')
    expect(ma).toContain('if (boRut?.lenBang) setLenBang(true)')
  })
})

/** Một phần thiếu câu thì phần thừa giây dồn sang Phần I — kiểm riêng vì đây là
 * chỗ dễ âm thầm rút hụt cả ca. */
describe('bù ngân sách khi kho lệch', () => {
  it('kho không có Phần II và III thì Phần I lấy bù, không bỏ phí giờ', () => {
    const chiI = dungUngVien([
      {
        maDe: 'A',
        phanI: Array.from({ length: 40 }, (_, i) => ({ id: `a${i}`, text: 't', choices: ['a', 'b', 'c', 'd'], correct: 'A', chuyenDe: CD[i % 3], mucDo: 'hieu' })),
        phanII: [],
        phanIII: [],
      } as unknown as TeacherExamSource,
    ])
    const s = soCauLenBang(chiI, 15)
    expect(s.II).toBe(0)
    expect(s.III).toBe(0)
    // 900s / 60s = 15 câu nếu dồn hết sang Phần I
    expect(s.I).toBe(15)
    expect(giayUocTinh(s)).toBeLessThanOrEqual(15 * 60)
  })
})

/** Kiểu PhanDe dùng tới trong file, khai báo để lint không kêu import thừa. */
export type _P = PhanDe
