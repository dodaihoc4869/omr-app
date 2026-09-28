// @vitest-environment node
// THUẬT TOÁN CHỌN EM — bảng DẠY HỌC (thầy lệnh 28/09: "chọn học sinh ở mức độ câu đó hoặc cao hơn, đảm bảo xác suất cao nhất lên bảng làm đúng").
// Khoá: chỉ em CÓ MẶT · ưu tiên mức ≥ mức độ câu · xác suất cao nhất · hoà ⇒ em ít được gọi hơn · tối đa 2 lần/buổi khi còn em đủ sức ·
// thiếu số liệu ⇒ hạng chung cao nhất + "ước lượng" · tất định.
import { describe, expect, it } from 'vitest'
import { chonEmChoCau, mucEmOCau, xacSuatDung, xepEmChoDanhSach, TOI_DA_LAN_MOI_BUOI, type SucHocEm } from '../src/lib/chon-em-day-hoc'

const sh = (o: Partial<SucHocEm> = {}): SucHocEm => ({ tong: { n: 0, d: 0 }, qid: {}, dang: {}, chuyenDe: {}, bac: {}, lenBang: { n: 0, dat: 0, homNay: 0 }, ...o })
const em = (...ds: string[]) => ds.map((s) => ({ sbd: s, hoTen: `Em ${s}` }))
const cauVD = { qid: 'Q1', maDang: 'D1', chuyenDe: 'Ester', mucDo: 'van_dung' as const }
const cauNB = { qid: 'Q2', maDang: 'D1', chuyenDe: 'Ester', mucDo: 'biet' as const }

describe('mức của em ở câu', () => {
  it('bậc hồ sơ trước; không có thì suy từ tỉ lệ đúng dạng (≥ 3 lần); không nữa ⇒ null', () => {
    expect(mucEmOCau(sh({ bac: { D1: 1 } }), cauVD)).toBe(1)
    expect(mucEmOCau(sh({ bac: { 'CD:Ester': 2 } }), cauVD)).toBe(2)
    expect(mucEmOCau(sh({ dang: { D1: { n: 10, d: 9 } } }), cauVD)).toBe(2)
    expect(mucEmOCau(sh({ dang: { D1: { n: 10, d: 7 } } }), cauVD)).toBe(1)
    expect(mucEmOCau(sh({ dang: { D1: { n: 10, d: 2 } } }), cauVD)).toBe(-1)
    expect(mucEmOCau(sh({ dang: { D1: { n: 2, d: 2 } } }), cauVD)).toBeNull()
  })
  it('xác suất: em giỏi dạng > em yếu dạng; thiếu bậc so với câu Vận dụng bị trừ', () => {
    const gioi = xacSuatDung(sh({ tong: { n: 40, d: 32 }, dang: { D1: { n: 12, d: 11 } }, bac: { D1: 2 } }), cauVD)
    const yeu = xacSuatDung(sh({ tong: { n: 40, d: 32 }, dang: { D1: { n: 12, d: 4 } }, bac: { D1: 0 } }), cauVD)
    expect(gioi.p).toBeGreaterThan(yeu.p)
    expect(gioi.coSoLieu).toBe(true)
    expect(gioi.p).toBeLessThan(1)
    expect(yeu.p).toBeGreaterThan(0)
  })
})

describe('chọn em cho một câu', () => {
  const soLieu: Record<string, SucHocEm> = {
    A: sh({ tong: { n: 50, d: 45 }, dang: { D1: { n: 10, d: 9 } }, bac: { D1: 2 } }), // giỏi, đủ Vận dụng
    B: sh({ tong: { n: 50, d: 40 }, dang: { D1: { n: 10, d: 7 } }, bac: { D1: 1 } }), // Hiểu
    C: sh({ tong: { n: 50, d: 49 }, dang: { D1: { n: 10, d: 10 } }, bac: { D1: 2 } }), // giỏi nhất nhưng VẮNG
  }
  it('CHỈ em có mặt: em giỏi nhất vắng thì không bao giờ được chọn', () => {
    const k = chonEmChoCau(cauVD, em('A', 'B'), soLieu)!
    expect(k.sbd).toBe('A')
    expect(k.bang.map((x) => x.sbd)).not.toContain('C')
    expect(chonEmChoCau(cauVD, [], soLieu)).toBeNull()
  })
  it('mức ≥ mức độ câu được ưu tiên: câu Vận dụng chọn em bậc Vận dụng dù em khác làm nhiều hơn', () => {
    const s = { ...soLieu, B: sh({ tong: { n: 200, d: 170 }, dang: { D1: { n: 60, d: 50 } }, bac: { D1: 1 } }) }
    const k = chonEmChoCau(cauVD, em('B', 'A'), s)!
    expect(k.sbd).toBe('A')
    expect(k.duMuc).toBe(true)
    expect(k.lyDo).toMatch(/bậc Vận dụng ≥ mức Vận dụng/)
  })
  it('xác suất cao nhất trong nhóm đủ mức; câu Nhận biết thì cả A lẫn B đủ mức ⇒ em xác suất cao hơn', () => {
    const k = chonEmChoCau(cauNB, em('A', 'B'), soLieu)!
    expect(k.sbd).toBe('A')
    expect(k.bang[0]!.xacSuat).toBeGreaterThanOrEqual(k.bang[1]!.xacSuat)
  })
  it('HOÀ ⇒ em ít được gọi hơn trong buổi', () => {
    const s = { X: sh({ tong: { n: 10, d: 8 }, bac: { D1: 2 } }), Y: sh({ tong: { n: 10, d: 8 }, bac: { D1: 2 } }) }
    expect(chonEmChoCau(cauVD, em('X', 'Y'), s)!.sbd).toBe('X')
    expect(chonEmChoCau(cauVD, em('X', 'Y'), s, { X: 1 })!.sbd).toBe('Y')
  })
  it('KHÔNG quá 2 lần/buổi khi còn em khác đủ sức; hết em đủ sức thì vẫn gọi được', () => {
    expect(chonEmChoCau(cauVD, em('A', 'B'), soLieu, { A: TOI_DA_LAN_MOI_BUOI })!.sbd).not.toBe('A')
    const k = chonEmChoCau(cauVD, em('A'), soLieu, { A: TOI_DA_LAN_MOI_BUOI })!
    expect(k.sbd).toBe('A') // chỉ còn một em có mặt
  })
  it('THIẾU SỐ LIỆU: chưa em nào có số ở dạng này ⇒ chọn em hạng chung cao nhất, ghi rõ "ước lượng"', () => {
    const s = { P: sh({ tong: { n: 30, d: 12 } }), Q: sh({ tong: { n: 30, d: 27 } }), R: sh() }
    const k = chonEmChoCau(cauVD, em('P', 'Q', 'R'), s)!
    expect(k.sbd).toBe('Q')
    expect(k.uocLuong).toBe(true)
    expect(k.lyDo).toMatch(/^Ước lượng/)
    // máy chủ không trả gì (lỗi mạng) ⇒ vẫn chọn được, vẫn ước lượng
    const k2 = chonEmChoCau(cauVD, em('P', 'Q'), {})!
    expect(k2.uocLuong).toBe(true)
  })
  it('"Đổi em khác": bỏ qua em vừa đổi', () => {
    const k = chonEmChoCau(cauVD, em('A', 'B'), soLieu, {}, new Set(['A']))!
    expect(k.sbd).toBe('B')
  })
  it('tất định: cùng đầu vào ⇒ cùng kết quả', () => {
    const a = chonEmChoCau(cauNB, em('B', 'A'), soLieu)
    const b = chonEmChoCau(cauNB, em('B', 'A'), soLieu)
    expect(a).toEqual(b)
  })
})

describe('xếp cả danh sách câu', () => {
  it('cộng dồn số lần gọi: 5 câu, em giỏi nhất chỉ lên tối đa 2 lần, các câu còn lại chia cho em khác đủ sức', () => {
    const s: Record<string, SucHocEm> = {
      A: sh({ tong: { n: 50, d: 48 }, dang: { D1: { n: 10, d: 10 } }, bac: { D1: 2 } }),
      B: sh({ tong: { n: 50, d: 44 }, dang: { D1: { n: 10, d: 9 } }, bac: { D1: 2 } }),
      C: sh({ tong: { n: 50, d: 40 }, dang: { D1: { n: 10, d: 8 } }, bac: { D1: 1 } }),
    }
    const ds = Array.from({ length: 5 }, (_, i) => ({ ...cauNB, qid: `Q${i}` }))
    const kq = xepEmChoDanhSach(ds, em('A', 'B', 'C'), s)
    const dem: Record<string, number> = {}
    for (const k of kq) dem[k!.sbd] = (dem[k!.sbd] ?? 0) + 1
    expect(dem.A).toBe(2)
    expect(dem.B).toBe(2)
    expect(dem.C).toBe(1)
    expect(kq[0]!.sbd).toBe('A')
  })
})
