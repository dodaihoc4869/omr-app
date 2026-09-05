// RÚT ĐỀ CHO BUỔI CHỮA BÀI — chế độ "Phân công lên bảng" ở khối Bộ câu ra đề.
//
// Máy tự chọn hết, nên phải kiểm bằng số chứ không tin mắt: đúng ngân sách
// giây, phủ đều chuyên đề, ưu tiên câu nhiều sao, đẩy câu nghi đáp án xuống
// cuối, và trộn lại phải ra bộ khác.
import { describe, expect, it } from 'vitest'
import { dungUngVien, giayUocTinh, GIAY_MOI_CAU, moiIdDaRut, PHAN_DE, PHUT_TOI_DA_LEN_BANG, rutDeLenBang, rutKhoChua, soCauCua, soCauLenBang, soTinHieu, TRAN_KHO_CHUA, tongCau, type CauUngVien, type PhanDe } from '../src/lib/rut-de'
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

  it('CHỐT CỨNG 15 PHÚT: ca đặt 45 phút vẫn ra đúng bộ của 15 phút', () => {
    expect(soCauLenBang(UV, 45)).toEqual(soCauLenBang(UV, 15))
    expect(soCauLenBang(UV, 120)).toEqual(soCauLenBang(UV, 15))
    expect(giayUocTinh(soCauLenBang(UV, 45))).toBeLessThanOrEqual(PHUT_TOI_DA_LEN_BANG * 60)
  })

  it('ca ngắn hơn 15 phút thì rút ít hơn, không tràn giờ', () => {
    expect(giayUocTinh(soCauLenBang(UV, 5))).toBeLessThanOrEqual(5 * 60)
    expect(tongCau(soCauLenBang(UV, 5))).toBeLessThan(tongCau(soCauLenBang(UV, 15)))
  })

  it('ưu tiên Phần II vì dày tín hiệu nhất trên mỗi giây, nhưng vẫn giữ một câu Phần III để có câu đứng bảng', () => {
    const s = soCauLenBang(UV, 15)
    expect(s.II).toBe(3)
    expect(s.III).toBe(1)
    expect(s.I).toBeGreaterThan(0)
  })

  it('ngân sách hẹp thì BỎ Phần III — 180 giây cho một tín hiệu là quá đắt', () => {
    expect(soCauLenBang(UV, 8).III).toBe(0)
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
  it('có chip "Kiểm tra điểm yếu" và ép cả lớp cùng một đề', async () => {
    const ma = (await import('../src/components/KhoiRutDe.tsx?raw')).default
    expect(ma).toContain('Kiểm tra điểm yếu')
    expect(ma).toContain("setCheDo('lenbang')")
    // soCau báo lên = ĐÚNG cỡ kho đã rút ⇒ mỗi em làm hết ⇒ cả lớp cùng một đề
    expect(ma).toContain('onDoi({ ids: moiIdDaRut(kq), soCau: kho, lenBang: true, idsChua: moiIdDaRut(chua) })')
    expect(ma).toContain('Cả lớp làm CÙNG một đề')
  })

  it('số câu tính theo thời lượng ca chứ không phải con số cứng', async () => {
    const ma = (await import('../src/components/KhoiRutDe.tsx?raw')).default
    expect(ma).toContain('soCauLenBang(uv, phutLamBai)')
    expect(ma).toContain('phutLamBai={thoiGianPhut}'.replace('phutLamBai={thoiGianPhut}', 'phutLamBai'))
  })

  it('cờ lên bảng suy thẳng từ chế độ, không có nút gạt riêng', async () => {
    const ma = (await import('../src/screens/ExamSetupScreen.tsx?raw')).default
    expect(ma).toContain('phutLamBai={thoiGianPhut}')
    expect(ma).toContain('const lenBang = boRut?.lenBang === true')
    expect(ma).not.toContain('NutGat')
  })

  it('chế độ này lưu KHO CHỮA của ca để màn Gọi lên bảng đủ câu chia bốn lượt', async () => {
    const ma = (await import('../src/screens/ExamSetupScreen.tsx?raw')).default
    expect(ma).toContain('luuKhoChuaCa(maCa, locNguonTheoId(selectedSources, boRut.idsChua))')
    const goi = (await import('../src/screens/GoiLenBangScreen.tsx?raw')).default
    expect(goi).toContain('docKhoChuaCa(ca.maCa)')
  })
})

/** Một phần thiếu câu thì phần thừa giây dồn sang Phần I — kiểm riêng vì đây là
 * chỗ dễ âm thầm rút hụt cả ca. */
describe('bù ngân sách khi kho lệch', () => {
  it('kho không có Phần II và III thì Phần I lấy hết ngân sách, không bỏ phí giờ', () => {
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
    // 900s / 60s = 15 câu, đúng trần Phần I
    expect(s.I).toBe(15)
    expect(giayUocTinh(s)).toBeLessThanOrEqual(15 * 60)
  })
})

/** Kiểu PhanDe dùng tới trong file, khai báo để lint không kêu import thừa. */
export type _P = PhanDe

// KHO CHỮA — bộ câu rộng hơn đề em làm. Thiếu nó thì bốn lượt gọi lên bảng hết
// câu ngay lượt hai, mà thầy chỉ phát hiện lúc đứng trước lớp.
describe('kho chữa cho bốn lượt gọi', () => {
  const lam = rutDeLenBang(UV, { phut: 15, seed: 3 })
  const chua = rutKhoChua(UV, lam, { phut: 15, seed: 3 })

  it('GỒM trọn bộ em làm, không bỏ sót câu nào', () => {
    const idLam = moiIdDaRut(lam)
    const idChua = moiIdDaRut(chua)
    for (const id of idLam) expect(idChua.has(id)).toBe(true)
  })

  it('rộng hơn bộ em làm để đủ chia bốn lượt', () => {
    expect(tongCau(soCauCua(chua))).toBeGreaterThan(tongCau(soCauCua(lam)) * 2)
    expect(tongCau(soCauCua(chua))).toBeLessThanOrEqual(TRAN_KHO_CHUA)
  })

  it('câu thêm CÙNG CHUYÊN ĐỀ với bộ em làm — không chữa chuyên đề lớp chưa đụng', () => {
    const cdLam = new Set(PHAN_DE.flatMap((p) => lam.chon[p]).map((c) => c.chuyenDe))
    for (const p of PHAN_DE) for (const c of chua.chon[p]) expect(cdLam.has(c.chuyenDe)).toBe(true)
  })

  it('không câu nào lặp trong kho chữa', () => {
    const ids = PHAN_DE.flatMap((p) => chua.chon[p].map((c) => c.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('kho cạn thì kho chữa bằng đúng bộ em làm, không báo thiếu', () => {
    const beo = dungUngVien([
      {
        maDe: 'B',
        phanI: [{ id: 'p1', text: 't', choices: ['a', 'b', 'c', 'd'], correct: 'A', chuyenDe: 'Ester', mucDo: 'hieu' }],
        phanII: [],
        phanIII: [],
      } as unknown as TeacherExamSource,
    ])
    const l = rutDeLenBang(beo, { phut: 15, seed: 1 })
    const c = rutKhoChua(beo, l, { phut: 15, seed: 1 })
    expect(moiIdDaRut(c).size).toBe(1)
    expect(c.thieu).toEqual({ I: 0, II: 0, III: 0 })
  })
})

// Thầy bấm chip "Phân công lên bảng" thì ô thời lượng ca tự về 15 phút — để ô
// giờ không nói một đằng bộ câu một nẻo (thầy chốt 05/09 chiều, kèm ảnh màn).
describe('chọn chế độ thì ô thời lượng ca tự đổi', () => {
  it('chip gọi onDoiPhutLamBai với đúng trần 15 phút', async () => {
    const ma = (await import('../src/components/KhoiRutDe.tsx?raw')).default
    expect(ma).toContain('onDoiPhutLamBai?.(PHUT_TOI_DA_LEN_BANG)')
    // chỉ đổi khi đang khác 15, không ghi đè liên tục
    expect(ma).toContain('if (phutLamBai !== PHUT_TOI_DA_LEN_BANG) onDoiPhutLamBai?.(PHUT_TOI_DA_LEN_BANG)')
  })

  it('màn Mở ca nối thẳng vào ô số phút', async () => {
    const ma = (await import('../src/screens/ExamSetupScreen.tsx?raw')).default
    expect(ma).toContain('onDoiPhutLamBai={setThoiGianPhut}')
  })
})
