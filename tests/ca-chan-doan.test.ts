// RÚT CA CHẨN ĐOÁN — 12 phép kiểm mục 8 của MOCAVAGOILENBANG.md, cộng ba phép
// "phải chạy trên dữ liệu thật trước khi mở ca" (28–30).
//
// Không chụp màn hình: mỗi phép kiểm là một lời gọi hàm và một khẳng định.
import { describe, expect, it } from 'vitest'
import { CHE_DO, cheDoTu, diemChuyenDe, MAC_DINH, rutCaKiemChung, tinHieu, tomTatCheDo, type CauUngVien, type HoSoEm, type ThongKeChuyenDe } from '../src/lib/ca-chan-doan'

const cau = (id: string, phan: 'I' | 'II' | 'III', chuyenDe: string, sao: 0 | 1 | 2, maDe = 'MOI'): CauUngVien => ({
  phan,
  id,
  maDe,
  soGoc: Number(id.replace(/\D/g, '')) || 1,
  chuyenDe,
  mucDo: '',
  text: `đề ${id}`,
  coHinh: false,
  canXem: false,
  sao,
  lyDoSao: sao ? 'nền' : '',
})

/** Kho ĐỀ MỚI: một bài, ba chuyên đề, đủ câu 2 sao cho lõi chung. */
const KHO_MOI: CauUngVien[] = [
  ...Array.from({ length: 8 }, (_, i) => cau(`M-I-${i + 1}`, 'I', ['Ester', 'Lipid', 'Xà phòng'][i % 3], (i < 4 ? 2 : 1) as 0 | 1 | 2)),
  ...Array.from({ length: 4 }, (_, i) => cau(`M-II-${i + 1}`, 'II', ['Ester', 'Lipid'][i % 2], (i < 3 ? 2 : 1) as 0 | 1 | 2)),
  ...Array.from({ length: 3 }, (_, i) => cau(`M-III-${i + 1}`, 'III', 'Ester', 1)),
]

/** Kho ĐỀ CŨ: bốn chuyên đề, mỗi cái đủ câu cả Phần I lẫn Phần II. */
const CD_CU = ['Chuẩn độ', 'Sulfur', 'Cân bằng', 'Điện li']
const KHO_CU: CauUngVien[] = CD_CU.flatMap((cd, k) => [
  ...Array.from({ length: 6 }, (_, i) => cau(`C${k}-I-${i + 1}`, 'I', cd, (i % 3) as 0 | 1 | 2, 'CU')),
  ...Array.from({ length: 3 }, (_, i) => cau(`C${k}-II-${i + 1}`, 'II', cd, (i % 3) as 0 | 1 | 2, 'CU')),
])

const tk = (tiLeSai: number, buoiChuaDo = 0, daiDang = false, chuaTungDo = false): ThongKeChuyenDe => ({ tiLeSai, buoiChuaDo, daiDang, chuaTungDo })

const em = (sbd: string, ten: string, cd: Record<string, ThongKeChuyenDe>, daRa: string[] = []): HoSoEm => ({ sbd, ten, chuyenDe: cd, daRa })

const BA_EM: HoSoEm[] = [
  em('001', 'Em Chuẩn độ', { 'Chuẩn độ': tk(0.8, 2, true), Sulfur: tk(0.1, 0), 'Cân bằng': tk(0.2, 1), Ester: tk(0.4, 0) }),
  em('002', 'Em Sulfur', { 'Chuẩn độ': tk(0.1, 0), Sulfur: tk(0.95, 3, true), 'Cân bằng': tk(0.2, 0), Ester: tk(0.3, 0) }),
  em('003', 'Em Cân bằng', { 'Chuẩn độ': tk(0.1, 0), Sulfur: tk(0.1, 0), 'Cân bằng': tk(0.7, 4, true), Ester: tk(0.2, 0) }),
]

const kq = () => rutCaKiemChung(KHO_MOI, KHO_CU, BA_EM)

describe('RÚT CÂU — 12 phép kiểm', () => {
  it('1. lõi chung đúng 3 câu (1 Phần II + 2 Phần I)', () => {
    const r = kq()
    expect(r.loiChung).toHaveLength(3)
    expect(r.loiChung.filter((c) => c.phan === 'II')).toHaveLength(1)
    expect(r.loiChung.filter((c) => c.phan === 'I')).toHaveLength(2)
  })

  it('2. lõi chung toàn câu 2 sao', () => {
    expect(kq().loiChung.every((c) => c.sao === 2)).toBe(true)
  })

  it('3. mỗi em đúng 5 câu riêng', () => {
    const r = kq()
    for (const e of BA_EM) expect(r.theoEm[e.sbd]).toHaveLength(5)
  })

  it('4. không câu nào trùng trong một em', () => {
    const r = kq()
    for (const e of BA_EM) {
      const id = r.theoEm[e.sbd].map((c) => c.id)
      expect(new Set(id).size).toBe(id.length)
    }
  })

  it('5. câu riêng không trùng lõi chung', () => {
    const r = kq()
    const chung = new Set(r.loiChung.map((c) => c.id))
    for (const e of BA_EM) expect(r.theoEm[e.sbd].some((c) => chung.has(c.id))).toBe(false)
  })

  it('6. ba em hồ sơ khác nhau → ba chuyên đề cũ khác nhau', () => {
    const r = kq()
    const chon = BA_EM.map((e) => r.chuyenDeDo[e.sbd][0])
    expect(new Set(chon).size).toBe(3)
  })

  it('7. em sai 80% Chuẩn độ + dai dẳng → chọn đúng Chuẩn độ', () => {
    expect(kq().chuyenDeDo['001']).toEqual(['Chuẩn độ'])
  })

  it('8. em sai 95% Sulfur + dai dẳng → chọn đúng Sulfur', () => {
    expect(kq().chuyenDeDo['002']).toEqual(['Sulfur'])
  })

  it('9. câu cũ đúng chuyên đề đã chọn', () => {
    const r = kq()
    for (const e of BA_EM) {
      const cu = r.theoEm[e.sbd].filter((c) => c.maDe === 'CU')
      expect(cu).toHaveLength(3)
      expect(cu.every((c) => r.chuyenDeDo[e.sbd].includes(c.chuyenDe))).toBe(true)
    }
  })

  it('10. tránh được câu đã ra với chính em đó', () => {
    const daRa = KHO_CU.filter((c) => c.chuyenDe === 'Chuẩn độ' && c.phan === 'I').slice(0, 4).map((c) => c.id)
    const r = rutCaKiemChung(KHO_MOI, KHO_CU, [em('001', 'Em Chuẩn độ', { 'Chuẩn độ': tk(0.8, 2, true) }, daRa)])
    const lay = r.theoEm['001'].filter((c) => c.maDe === 'CU' && c.phan === 'I').map((c) => c.id)
    // Chuyên đề Chuẩn độ có 6 câu Phần I, cấm 4 câu, cần 2 → phải lấy đúng 2 câu chưa ra.
    expect(lay).toHaveLength(2)
    expect(lay.some((id) => daRa.includes(id))).toBe(false)
  })

  it('11. 660s, trong ngân sách 840s', () => {
    const r = kq()
    expect(r.giayUocTinh).toBe(660)
    expect(r.giayUocTinh).toBeLessThanOrEqual(MAC_DINH.giay)
  })

  it('12. không sinh cảnh báo', () => {
    expect(kq().canhBao).toEqual([])
  })
})

describe('BA CHẾ ĐỘ — số câu, giây, tín hiệu đúng bảng đặc tả', () => {
  it('bảng mục 3 khớp với hằng trong mã, không đếm tay', () => {
    expect(tomTatCheDo(CHE_DO.ca_hai)).toEqual({ soCau: 8, giay: 660, tinHieu: 14 })
    expect(tomTatCheDo(CHE_DO.chi_moi)).toEqual({ soCau: 8, giay: 660, tinHieu: 14 })
    expect(tomTatCheDo(CHE_DO.chi_cu)).toEqual({ soCau: 7, giay: 600, tinHieu: 13 })
  })

  it('không chế độ nào có Phần III — Phần III đắt gấp 4,8 lần Phần II', () => {
    for (const c of Object.values(CHE_DO)) {
      expect(c.loiChung.III + c.riengMoi.III + c.cu.III).toBe(0)
    }
  })

  it('bỏ tích khối nào thì tự chuyển chế độ; bỏ cả hai thì không mở được', () => {
    expect(cheDoTu(true, true)).toBe('ca_hai')
    expect(cheDoTu(true, false)).toBe('chi_moi')
    expect(cheDoTu(false, true)).toBe('chi_cu')
    expect(cheDoTu(false, false)).toBeNull()
  })

  it('chỉ đề cũ thì đo sâu HAI chuyên đề, và rút đủ 7 câu', () => {
    const r = rutCaKiemChung([], KHO_CU, BA_EM, CHE_DO.chi_cu)
    expect(r.loiChung).toEqual([])
    for (const e of BA_EM) {
      expect(r.theoEm[e.sbd]).toHaveLength(7)
      expect(r.chuyenDeDo[e.sbd]).toHaveLength(2)
    }
    expect(r.giayUocTinh).toBe(600)
    expect(r.canhBao).toEqual([])
  })

  it('chỉ đề mới thì lõi chung dày hơn và không đụng kho cũ', () => {
    const r = rutCaKiemChung(KHO_MOI, KHO_CU, BA_EM, CHE_DO.chi_moi)
    expect(r.loiChung).toHaveLength(5)
    for (const e of BA_EM) {
      expect(r.theoEm[e.sbd]).toHaveLength(3)
      expect(r.theoEm[e.sbd].every((c) => c.maDe === 'MOI')).toBe(true)
    }
    expect(r.giayUocTinh).toBe(660)
  })

  it('tín hiệu Phần II bằng 4, phần khác bằng 1', () => {
    expect(tinHieu([cau('a', 'II', 'x', 0), cau('b', 'I', 'x', 0), cau('c', 'III', 'x', 0)])).toBe(6)
  })
})

describe('điểm chuyên đề đến hạn đo', () => {
  it('đúng công thức 40·sai + 10·buổi(trần 6) + 30 dai dẳng + 20 chưa từng đo', () => {
    expect(diemChuyenDe(tk(1, 0))).toBe(40)
    expect(diemChuyenDe(tk(0, 3))).toBe(30)
    expect(diemChuyenDe(tk(0, 99))).toBe(60) // trần 6 buổi
    expect(diemChuyenDe(tk(0.5, 1, true))).toBe(20 + 10 + 30)
    expect(diemChuyenDe(tk(0, 0, false, true))).toBe(20)
  })
})

describe('BA PHÉP TRÊN DỮ LIỆU THẬT — 28, 29, 30', () => {
  it('28. kho cũ chỉ có MỘT chuyên đề → nới sang chuyên đề kế, không rơi câu', () => {
    const motCd = KHO_CU.filter((c) => c.chuyenDe === 'Chuẩn độ')
    const r = rutCaKiemChung(KHO_MOI, motCd, BA_EM)
    for (const e of BA_EM) {
      expect(r.theoEm[e.sbd]).toHaveLength(5)
      expect(r.theoEm[e.sbd].filter((c) => c.maDe === 'CU')).toHaveLength(3)
    }
    expect(r.canhBao).toEqual([])
  })

  it('29. em CHƯA CÓ HỒ SƠ (buổi đầu) → vẫn rút đủ câu, chuyên đề bốc theo seed', () => {
    const moi = [em('900', 'Em mới', {})]
    const r = rutCaKiemChung(KHO_MOI, KHO_CU, moi)
    // Không có hồ sơ thì không chọn được chuyên đề cũ nào...
    expect(r.chuyenDeDo['900']).toEqual([])
    // ...nhưng phần RIÊNG MỚI vẫn phải đủ, và cảnh báo phải nói thẳng thiếu mấy câu.
    expect(r.theoEm['900'].filter((c) => c.maDe === 'MOI')).toHaveLength(2)
    expect(r.canhBao.join(' ')).toContain('kho cũ thiếu')
  })

  it('30. 29 em → 29 bộ khác nhau, nhưng lõi chung giống hệt nhau', () => {
    const ds = Array.from({ length: 29 }, (_, i) =>
      em(String(i + 1).padStart(3, '0'), `Em ${i + 1}`, {
        'Chuẩn độ': tk((i % 5) / 5, i % 4),
        Sulfur: tk(((i + 1) % 5) / 5, (i + 1) % 4),
        'Cân bằng': tk(((i + 2) % 5) / 5, (i + 2) % 4),
        'Điện li': tk(((i + 3) % 5) / 5, (i + 3) % 4),
      }),
    )
    const r = rutCaKiemChung(KHO_MOI, KHO_CU, ds)
    expect(Object.keys(r.theoEm)).toHaveLength(29)
    // Lõi chung là MỘT bộ, dùng chung cho cả lớp — đây là điều kiện để tính
    // tiLeDungLop và doChum.
    expect(r.loiChung).toHaveLength(3)
    // Có ít nhất hai em nhận bộ câu riêng khác nhau (không phải phát cùng một bộ).
    const chuoi = new Set(ds.map((e) => r.theoEm[e.sbd].map((c) => c.id).sort().join('|')))
    expect(chuoi.size).toBeGreaterThan(1)
    for (const e of ds) expect(r.theoEm[e.sbd]).toHaveLength(5)
  })

  it('chạy hai lần cùng seed ra kết quả y hệt', () => {
    const a = kq()
    const b = kq()
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('kho mới thiếu câu thì nói thẳng, không lặng lẽ rút ít đi', () => {
    const r = rutCaKiemChung(KHO_MOI.filter((c) => c.phan === 'I').slice(0, 2), KHO_CU, [BA_EM[0]])
    expect(r.canhBao.join(' ')).toContain('Lõi chung Phần II')
  })
})
