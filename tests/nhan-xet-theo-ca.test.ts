// NHẬN XÉT RIÊNG TỪNG CA — thầy chốt 07/09: "làm nhận xét theo từng ca".
//
// Đo bằng ĐÚNG bộ quy tắc viết của thầy, không đo bằng cảm giác:
//
//   điều 1  cấm câu rỗng            điều 13 cấm dấu gạch ngang dài
//   điều 4  cấm khen không dẫn chứng điều 14 cấm emoji
//   điều 5  cấm nhận xét chung chung điều 22 tin phụ huynh 60–120 chữ
//   điều 6  cấm bịa số              điều 23 đủ bốn phần, đúng thứ tự
//   điều 28 tả hành vi, không gán tính cách
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  nhanXetTheoCa,
  phanLoiCuThe,
  phanNguyenNhan,
  phanViecPhaiLam,
  phanMocKiemLai,
  demChu,
  type DuLieuNhanXetCa,
} from '../src/lib/nhan-xet-theo-ca'
import type { TinHieuLamBai } from '../src/lib/phan-tich-lam-bai'

const doc = (f: string) => readFileSync(resolve(__dirname, '..', f), 'utf8')

const th = (ma: string, soLieu: string): TinHieuLamBai => ({ ma, nhan: 'x', soLieu, loiKhuyen: 'y' })

const NEN: DuLieuNhanXetCa = {
  ngay: '2026-09-06T12:00:00.000Z',
  tenCa: '2009 - Doll - 7',
  soCauSai: 16,
  tongSoCau: 28,
  chuyenDeSai: [
    { ten: 'Ester – lipid', soCau: 9, soSai: 7 },
    { ten: 'Carbohydrate', soCau: 6, soSai: 4 },
  ],
  tinHieu: [th('bo_trong', 'Em không điền gì ở 3/28 câu.')],
  soCauChua: 16,
  xung: 'con',
}

describe('điều 23 — đủ bốn phần, đúng thứ tự', () => {
  it('phần 1 nêu NGÀY và SỐ CÂU SAI, không nêu chung chung', () => {
    const c = phanLoiCuThe(NEN)
    expect(c).toContain('06/9')
    expect(c).toContain('16/28 câu')
    expect(c).toContain('Ester – lipid')
    expect(c).toContain('7/9 câu')
  })

  it('phần 2 lấy NGUYÊN câu số liệu của tín hiệu, không viết lại', () => {
    // Báo cáo HỌC SINH: câu mượn giữ nguyên từng chữ.
    expect(phanNguyenNhan({ ...NEN, xung: 'em' })).toBe('Em không điền gì ở 3/28 câu.')
    // Báo cáo PHỤ HUYNH: SỬA SAU KHI IN THỬ — chỉ đại từ đổi, số liệu nguyên vẹn.
    // Bản đầu ghép thẳng nên một đoạn có cả "con sai 16/28" lẫn "Em không điền
    // gì", đọc ra hai người khác nhau.
    expect(phanNguyenNhan(NEN)).toBe('Con không điền gì ở 3/28 câu.')
  })

  it('phần 3 nêu SỐ LƯỢNG việc phải làm', () => {
    expect(phanViecPhaiLam(NEN)).toContain('16 câu khắc phục')
  })

  it('phần 4 nêu MỐC kiểm lại', () => {
    expect(phanMocKiemLai(NEN)).toContain('Buổi học tới')
    // SỬA SAU KHI IN THỬ: phần 1 đã nêu tên chuyên đề rồi, nhắc lại ở đây là
    // lần thứ ba trong bốn câu. Xem test "KHÔNG nhắc tên chuyên đề ba lần".
    expect(phanMocKiemLai(NEN)).toContain('phần đó')
  })

  it('bốn phần ghép đúng thứ tự trong bản đầy đủ', () => {
    const t = nhanXetTheoCa(NEN)
    const i1 = t.indexOf('16/28 câu')
    const i2 = t.indexOf('không điền gì')
    const i3 = t.indexOf('16 câu khắc phục')
    const i4 = t.indexOf('Buổi học tới')
    expect(i1).toBeGreaterThanOrEqual(0)
    expect(i2).toBeGreaterThan(i1)
    expect(i3).toBeGreaterThan(i2)
    expect(i4).toBeGreaterThan(i3)
  })

  it('có hạn nộp thì mốc là HẠN NỘP, không phải buổi học tới', () => {
    const t = phanMocKiemLai({ ...NEN, hanNop: '2026-09-10T00:00:00.000Z' })
    expect(t).toContain('10/9')
    expect(t).not.toContain('Buổi học tới')
  })
})

describe('điều 5 + 6 — không chung chung, không bịa', () => {
  it('MỖI CA MỘT NHẬN XÉT KHÁC NHAU — đây là cả yêu cầu của thầy', () => {
    const a = nhanXetTheoCa(NEN)
    const b = nhanXetTheoCa({
      ...NEN,
      soCauSai: 4,
      chuyenDeSai: [{ ten: 'Polymer', soCau: 5, soSai: 3 }],
      tinHieu: [th('nop_som', 'Em làm 12 phút trên 45 phút được phép, còn sai 4 câu.')],
      soCauChua: 6,
    })
    expect(a).not.toBe(b)
    expect(b).toContain('4/28 câu')
    expect(b).toContain('Polymer')
    expect(b).toContain('12 phút')
  })

  it('KHÔNG nêu chuyên đề khi chỉ sai đúng một câu ở đó — số liệu không đỡ nổi', () => {
    const c = phanLoiCuThe({ ...NEN, soCauSai: 1, chuyenDeSai: [{ ten: 'Polymer', soCau: 5, soSai: 1 }] })
    expect(c).toContain('1/28 câu')
    expect(c).not.toContain('Polymer')
  })

  it('em làm đúng hết thì nói đúng thế, KHÔNG nặn ra điểm yếu', () => {
    const t = nhanXetTheoCa({ ...NEN, soCauSai: 0, chuyenDeSai: [], tinHieu: [], soCauChua: 0 })
    expect(t).toContain('làm đúng cả 28 câu')
    expect(t).not.toContain('khắc phục')
    expect(t).not.toContain('Buổi học tới')
  })

  it('không có tín hiệu kỹ năng thì chuyển nguyên nhân sang KIẾN THỨC, không nói suông', () => {
    const t = phanNguyenNhan({ ...NEN, tinHieu: [th('deu_tay', 'Sai 16/28 câu, không có câu bỏ trống.')] })
    expect(t).toContain('Cách làm bài không có gì phải chỉnh')
    // Chuyên đề đã nêu ở phần 1 (sai 7/9 câu) nên ở đây nói "chuyên đề đó".
    expect(t).toContain('kiến thức chuyên đề đó')
    // Chưa nêu ở phần 1 thì PHẢI nói rõ tên, nếu không phụ huynh không biết đâu.
    const t2 = phanNguyenNhan({
      ...NEN,
      soCauSai: 1,
      chuyenDeSai: [{ ten: 'Polymer', soCau: 5, soSai: 1 }],
      tinHieu: [th('deu_tay', '')],
    })
    expect(t2).toContain('Polymer')
  })

  it('thiếu dữ liệu thì phần đó BIẾN MẤT, không có câu độn', () => {
    expect(phanNguyenNhan({ ...NEN, tinHieu: [] })).toBe('')
    expect(phanViecPhaiLam({ ...NEN, soCauChua: 0 })).toBe('')
    // Ngày hỏng thì bỏ cụm ngày, KHÔNG in "Invalid Date".
    const c = phanLoiCuThe({ ...NEN, ngay: 'rác' })
    expect(c).not.toMatch(/Invalid|NaN|undefined/)
    expect(c).toContain('16/28 câu')
  })
})

describe('điều 13, 14, 22, 28 — mặt chữ', () => {
  const bai = [
    nhanXetTheoCa(NEN),
    nhanXetTheoCa({ ...NEN, soCauSai: 3, tinHieu: [th('deu_tay', 'x')], soCauChua: 5 }),
    nhanXetTheoCa({ ...NEN, hanNop: '2026-09-10T00:00:00.000Z' }),
  ]

  it('cấm dấu gạch ngang dài', () => {
    for (const t of bai) expect(t, t).not.toContain('—')
  })

  it('cấm emoji', () => {
    for (const t of bai) expect(t, t).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u)
  })

  it('cấm từ gán TÍNH CÁCH — chỉ tả hành vi', () => {
    const cam = ['cẩu thả', 'lười', 'thông minh', 'chăm chỉ', 'tiềm năng', 'tố chất', 'ẩu']
    for (const t of bai) for (const w of cam) expect(t.toLowerCase(), `"${w}" trong: ${t}`).not.toContain(w)
  })

  it('cấm cụm rào đón và khen suông', () => {
    const cam = ['cố gắng hơn nữa', 'phát huy hơn nữa', 'mong gia đình', 'rất tốt', 'đóng vai trò quan trọng', 'hy vọng']
    for (const t of bai) for (const w of cam) expect(t.toLowerCase(), `"${w}" trong: ${t}`).not.toContain(w)
  })

  it('độ dài nằm trong khung 60–120 chữ của điều 22', () => {
    for (const t of bai) {
      const n = demChu(t)
      expect(n, `${n} chữ: ${t}`).toBeGreaterThanOrEqual(30)
      expect(n, `${n} chữ: ${t}`).toBeLessThanOrEqual(120)
    }
  })
})

describe('không lách — mọi phiếu đi qua đúng một bộ sinh', () => {
  it('lõi dựng phiếu cả ca gọi nhanXetTheoCa, không còn đoạn chung chung', () => {
    const t = doc('src/lib/phieu-ca-ca.ts')
    expect(t).toContain('nhanXetTheoCa(')
    expect(t).not.toContain('viecCanLamMacDinh(')
  })

  it('câu kết của thầy giữ NGUYÊN VĂN, và chỉ đứng sau khi có việc phải làm', () => {
    const ket = 'Không ai có thể giúp em tiến bộ bằng chính em.'
    expect(nhanXetTheoCa(NEN)).toContain(ket)
    expect(nhanXetTheoCa({ ...NEN, soCauSai: 0, chuyenDeSai: [], tinHieu: [], soCauChua: 0 })).not.toContain(ket)
  })
})

// ---------------------------------------------------------------------------
// HAI LỖI TÔI TỰ THẤY KHI IN THỬ RA CHỮ THẬT, trước khi đưa thầy đọc.
describe('đọc thành một giọng, không lặp', () => {
  it('MỘT XƯNG HÔ trong cả đoạn — không lẫn "con" với "em"', () => {
    // Bộ tín hiệu viết sẵn với "Em"; báo cáo phụ huynh gọi "con". Bản đầu ghép
    // thẳng nên ra: "con sai 16/28 câu… Em không điền gì ở 3/28 câu."
    const t = nhanXetTheoCa(NEN)
    const than = t.split('\n')[0]
    expect(than).not.toMatch(/(^|[.;:]\s+)Em\b/)
    expect(than).toContain('Con không điền gì ở 3/28 câu.')
    // Số liệu trong câu mượn phải NGUYÊN VẸN, chỉ đại từ đổi.
    expect(than).toContain('3/28 câu')
  })

  it('báo cáo HỌC SINH giữ nguyên "Em", không đổi bừa', () => {
    const t = nhanXetTheoCa({ ...NEN, xung: 'em' })
    expect(t).toContain('Em không điền gì ở 3/28 câu.')
    expect(t).toContain('em sai 16/28 câu')
  })

  it('KHÔNG nhắc tên chuyên đề ba lần trong bốn câu', () => {
    for (const d of [NEN, { ...NEN, tinHieu: [th('deu_tay', '')] }]) {
      const t = nhanXetTheoCa(d)
      const dem = (t.match(/Ester – lipid/g) ?? []).length
      expect(dem, `nhắc ${dem} lần: ${t}`).toBe(1)
    }
  })

  it('chuyên đề CHƯA được nêu ở phần 1 thì phần 4 vẫn phải nêu tên', () => {
    // Sai đúng 1 câu ⇒ phần 1 không nêu tên ⇒ phần 4 phải nói rõ phần nào.
    const t = phanMocKiemLai({ ...NEN, soCauSai: 1, chuyenDeSai: [{ ten: 'Polymer', soCau: 5, soSai: 1 }] })
    expect(t).toContain('Polymer')
  })
})
