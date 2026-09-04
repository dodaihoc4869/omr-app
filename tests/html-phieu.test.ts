import { describe, expect, it } from 'vitest'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'
import { biaHtml, chuHtml, ngayVN, oGiaiHtml, taiLieuHtml, theCauHtml, thoat, tongQuanHtml } from '../src/lib/html-phieu'

const C = (o: Partial<CauLuyen>): CauLuyen =>
  ({ phan: 'I', id: 'x', chuyenDe: 'Ester – lipid', mucDo: 'biet', text: 'Đề', luaChon: null, dapAn: '', chot: '', lyDo: null, buoc: null, ketQua: '', ...o }) as CauLuyen

const MCQ = C({ text: 'Ester nào sau đây?', luaChon: ['A1', 'B1', 'C1', 'D1'], dapAn: 'C', chot: 'Chốt kiến thức.' })

describe('thoat', () => {
  it('chặn dấu ngoặc nhọn để nội dung đề không phá cấu trúc trang', () => {
    expect(thoat('<script>x</script>')).toBe('&lt;script&gt;x&lt;/script&gt;')
  })
  it('chặn dấu & và nháy kép', () => {
    expect(thoat('a & "b"')).toBe('a &amp; &quot;b&quot;')
  })
})

describe('chuHtml', () => {
  it('công thức mhchem ra chỉ số dưới', () => {
    expect(chuHtml('$\\ce{H2SO4}$')).toBe('H<sub>2</sub>SO<sub>4</sub>')
  })
  it('chữ thường giữ nguyên', () => {
    expect(chuHtml('Ester đơn chức')).toBe('Ester đơn chức')
  })
  it('vẫn thoát ký tự nguy hiểm bên trong công thức', () => {
    expect(chuHtml('a < b')).not.toContain('< b')
  })
})

describe('ngayVN', () => {
  it('luôn hai chữ số ngày và tháng', () => {
    expect(ngayVN(new Date(2026, 8, 4))).toBe('04/09/2026')
  })
})

describe('theCauHtml — Phần I', () => {
  it('bản ĐỀ BÀI không tô đáp án nào', () => {
    const h = theCauHtml(MCQ, 1, false)
    expect(h).not.toContain('q-opt correct')
    expect(h).not.toContain('sol-box')
  })

  it('bản LỜI GIẢI tô đúng phương án đúng và in ô hướng làm', () => {
    const h = theCauHtml(MCQ, 1, true)
    expect(h).toContain('<div class="q-opt correct"><div class="q-opt-letter">C</div>')
    expect(h).toContain('sol-box')
    expect(h).toContain('Chốt kiến thức.')
  })

  it('đủ bốn phương án A B C D', () => {
    const h = theCauHtml(MCQ, 1, true)
    for (const k of ['A', 'B', 'C', 'D']) expect(h).toContain(`q-opt-letter">${k}<`)
  })

  it('phương án dài thì xuống một cột cho khỏi vỡ chữ', () => {
    const dai = C({ luaChon: ['x'.repeat(60), 'b', 'c', 'd'], dapAn: 'A' })
    expect(theCauHtml(dai, 1, false)).toContain('q-options single-col')
    expect(theCauHtml(MCQ, 1, false)).not.toContain('single-col')
  })

  it('in đúng số thứ tự và nhãn mức độ', () => {
    const h = theCauHtml(MCQ, 7, false)
    expect(h).toContain('q-num">7<')
    expect(h).toContain('Nhận biết')
  })
})

describe('theCauHtml — Phần II', () => {
  const tf = C({ phan: 'II', luaChon: ['ya', 'yb', 'yc', 'yd'], dapAn: 'DSSD', chot: 'c.' })

  it('bản đề để trống cả hai ô Đ và S', () => {
    const h = theCauHtml(tf, 1, false)
    expect(h).not.toContain('tf-badge true')
    expect(h).not.toContain('tf-badge false')
  })

  it('bản lời giải đánh đúng Đ/S theo từng ý', () => {
    const h = theCauHtml(tf, 1, true)
    const hang = h.split('<div class="tf-statement">').slice(1)
    expect(hang).toHaveLength(4)
    expect(hang[0]).toContain('tf-badge true')
    expect(hang[1]).toContain('tf-badge false')
    expect(hang[2]).toContain('tf-badge false')
    expect(hang[3]).toContain('tf-badge true')
  })

  it('đánh số ý bằng a b c d', () => {
    const h = theCauHtml(tf, 1, false)
    for (const k of ['a. ', 'b. ', 'c. ', 'd. ']) expect(h).toContain(k)
  })
})

describe('theCauHtml — Phần III', () => {
  const sa = C({ phan: 'III', dapAn: '100', buoc: ['Tính số mol', 'Suy ra thể tích'], ketQua: 'V = 100 ml' })

  it('bản đề để ô trống cho em điền, KHÔNG lộ đáp án', () => {
    const h = theCauHtml(sa, 1, false)
    expect(h).toContain('sa-blank')
    expect(h).not.toContain('100')
  })

  it('bản lời giải in đáp án, các bước và kết quả', () => {
    const h = theCauHtml(sa, 1, true)
    expect(h).toContain('sa-answer')
    expect(h).toContain('100')
    expect(h).toContain('1. Tính số mol')
    expect(h).toContain('2. Suy ra thể tích')
    expect(h).toContain('V = 100 ml')
  })
})

describe('oGiaiHtml', () => {
  it('câu không có gì để giải thì KHÔNG in ô rỗng', () => {
    expect(oGiaiHtml(C({}))).toBe('')
  })
  it('chỉ có chốt thì in mỗi hướng làm', () => {
    const h = oGiaiHtml(C({ chot: 'x' }))
    expect(h).toContain('Hướng làm')
    expect(h).not.toContain('Làm từng bước')
  })
})

describe('bìa và tổng quan', () => {
  const t = { hoTen: 'Đỗ Đại Học', sbd: '12121212', ngay: new Date(2026, 8, 4), tenChuyenDe: 'Ester – lipid', ketQua: 'Sai 26/32 câu', hienDapAn: false }

  it('bìa in đủ tên, SBD, ngày và số câu', () => {
    const h = biaHtml(t, 20)
    expect(h).toContain('Đỗ Đại Học')
    expect(h).toContain('12121212')
    expect(h).toContain('04/09/2026')
    expect(h).toContain('20 Câu')
    expect(h).toContain('ESTER – LIPID')
  })

  it('không có dòng kết quả thì KHÔNG in ô kết quả rỗng', () => {
    expect(biaHtml({ ...t, ketQua: '' }, 5)).not.toContain('Kết quả')
  })

  it('bìa bản lời giải đổi nhãn', () => {
    expect(biaHtml({ ...t, hienDapAn: true }, 5)).toContain('Lời giải chi tiết')
  })

  it('tổng quan đếm đúng số câu từng phần', () => {
    const cau = [C({}), C({}), C({ phan: 'II' }), C({ phan: 'III' })]
    const h = tongQuanHtml(cau)
    expect(h).toContain('>4</div><div class="stat-label">Tổng số câu')
    expect(h).toContain('>2</div><div class="stat-label">Trắc nghiệm')
    expect(h).toContain('>1</div><div class="stat-label">Đúng / Sai')
  })

  it('kho không có mức độ nào thì bỏ hẳn khối phân loại, không in khung rỗng', () => {
    expect(tongQuanHtml([C({ mucDo: '' })])).not.toContain('topics-list')
  })
})

describe('taiLieuHtml', () => {
  it('tài liệu tự chứa: có doctype, charset và toàn bộ CSS', () => {
    const h = taiLieuHtml('<div class="page"></div>', 'Phiếu')
    expect(h.startsWith('<!DOCTYPE html>')).toBe(true)
    expect(h).toContain('charset="UTF-8"')
    expect(h).toContain('@page { size: A4')
    expect(h).toContain('print-color-adjust: exact')
  })
})
