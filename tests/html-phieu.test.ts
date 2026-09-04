import { describe, expect, it } from 'vitest'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'
import { biaHtml, chuHtml, ngayVN, oGiaiHtml, taiLieuHtml, theCauHtml, theGiaiHtml, thoat, tongQuanHtml } from '../src/lib/html-phieu'

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

  it('trang đề in đáp án nhưng KHÔNG in các bước — bước để dành cho trang lời giải', () => {
    const h = theCauHtml(sa, 1, true)
    expect(h).toContain('sa-answer')
    expect(h).toContain('100')
    expect(h).not.toContain('Làm từng bước')
  })
})

describe('oGiaiHtml', () => {
  it('câu không có gì để giải thì KHÔNG in ô rỗng', () => {
    expect(oGiaiHtml(C({}))).toBe('')
  })
  it('ô kem trang đề chỉ in câu chốt, một dòng', () => {
    const h = oGiaiHtml(C({ chot: 'x', buoc: ['b'], ketQua: 'k' }))
    expect(h).toContain('Hướng làm')
    expect(h).not.toContain('Làm từng bước')
    expect(h).not.toContain('Kết quả')
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
    expect(h).toContain('ESTER<br>– LIPID')
  })

  it('không có dòng kết quả thì KHÔNG in ô kết quả rỗng', () => {
    expect(biaHtml({ ...t, ketQua: '' }, 5)).not.toContain('Kết quả')
  })

  it('bìa bản lời giải đổi nhãn', () => {
    expect(biaHtml({ ...t, hienDapAn: true }, 5)).toContain('Lời giải chi tiết')
  })

  it('mức độ xen kẽ thì KHÔNG ghi khoảng "Câu 1–9" — nói sai số câu', () => {
    const cau = [C({ mucDo: 'biet' }), C({ mucDo: 'hieu' }), C({ mucDo: 'biet' })]
    const h = tongQuanHtml(cau)
    expect(h).toContain('Câu 1, 3 · 2 câu')
    expect(h).not.toContain('Câu 1–3 · 2 câu')
  })

  it('mức độ đứng liền nhau thì ghi khoảng cho gọn', () => {
    const cau = [C({ mucDo: 'biet' }), C({ mucDo: 'biet' }), C({ mucDo: 'hieu' })]
    expect(tongQuanHtml(cau)).toContain('Câu 1–2 · 2 câu')
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

describe('theGiaiHtml — trang Lời giải chi tiết', () => {
  it('KHÔNG in lại phương án — trang giải phải gọn hơn trang đề', () => {
    const h = theGiaiHtml(MCQ, 1)
    expect(h).not.toContain('q-options')
    expect(h).not.toContain('q-opt-letter')
  })

  it('nhãn chỉ còn mức độ và đáp án, bỏ nhãn loại và chuyên đề', () => {
    const h = theGiaiHtml(MCQ, 1)
    expect(h).toContain('Đáp án: C')
    expect(h).not.toContain('type-mc')
  })

  it('in lý do TỪNG phương án, đánh dấu ✓ ở phương án đúng', () => {
    const c = C({ dapAn: 'B', lyDo: [
      { khoa: 'A', dung: false, ly: 'sai vì x' },
      { khoa: 'B', dung: true, ly: 'đúng vì y' },
    ] })
    const h = theGiaiHtml(c, 2)
    expect(h).toContain('<strong>A.</strong> sai vì x')
    expect(h).toContain('<strong>B.</strong> ✓ đúng vì y')
  })

  it('Phần II đổi DSSD thành Đ S S Đ và đánh ✓ đúng ý', () => {
    const c = C({ phan: 'II', dapAn: 'DSSD', lyDo: [
      { khoa: 'a', dung: true, ly: 'la' },
      { khoa: 'b', dung: false, ly: 'lb' },
      { khoa: 'c', dung: false, ly: 'lc' },
      { khoa: 'd', dung: true, ly: 'ld' },
    ] })
    const h = theGiaiHtml(c, 3)
    expect(h).toContain('Đáp án: Đ S S Đ')
    expect(h).toContain('<strong>a.</strong> ✓ la')
    expect(h).toContain('<strong>b.</strong> lb')
    expect(h).toContain('<strong>d.</strong> ✓ ld')
    expect(h).toContain('Vì sao từng ý')
  })

  it('không có lý do từng phương án thì rơi về câu chốt', () => {
    const h = theGiaiHtml(C({ dapAn: 'A', chot: 'chốt đây' }), 1)
    expect(h).toContain('Hướng làm')
    expect(h).toContain('chốt đây')
  })

  it('câu không có gì để giải thì KHÔNG in ô kem rỗng', () => {
    expect(theGiaiHtml(C({ dapAn: 'A' }), 1)).not.toContain('sol-box')
  })

  it('in các bước và kết quả cho câu trả lời ngắn', () => {
    const h = theGiaiHtml(C({ phan: 'III', dapAn: '100', buoc: ['Tính số mol', 'Suy ra thể tích'], ketQua: 'V = 100 ml' }), 4)
    expect(h).toContain('1. Tính số mol')
    expect(h).toContain('V = 100 ml')
  })
})

describe('hình trong phiếu', () => {
  const A = 'data:image/png;base64,AAAA'

  it('ảnh cắt cả thân câu THAY chữ đề — lớp chữ PDF hay vỡ công thức âm thầm', () => {
    const h = theCauHtml(C({ anhThanCau: A, text: 'chữ có thể sai' }), 1, false)
    expect(h).toContain('class="q-hinh than"')
    expect(h).not.toContain('chữ có thể sai')
  })

  it('phương án bằng ảnh thì in ảnh, KHÔNG in chữ "(xem hình)"', () => {
    const h = theCauHtml(C({ luaChon: ['(xem hình)', 'b', 'c', 'd'], anhLuaChon: [A, undefined, undefined, undefined], dapAn: 'A' }), 1, false)
    expect(h).toContain('class="q-hinh pa"')
    expect(h).not.toContain('(xem hình)')
  })

  it('ảnh nhúng đúng vị trí trong câu', () => {
    const h = theCauHtml(C({ hinh: [{ src: A, viTri: 'sau_de' }, { src: A, viTri: 'cuoi_cau' }] }), 1, false)
    expect((h.match(/class="q-hinh"/g) || []).length).toBe(2)
  })

  it('ảnh phương án A đứng trong đúng ô phương án A', () => {
    const h = theCauHtml(C({ luaChon: ['a', 'b', 'c', 'd'], dapAn: 'A', hinh: [{ src: A, viTri: 'sau_pa_B' }] }), 1, false)
    const oB = h.split('q-opt-letter">B<')[1].split('</div></div>')[0]
    expect(oB).toContain('q-hinh')
  })

  it('bảng số liệu in thành bảng thật, hàng đầu là tiêu đề', () => {
    const h = theCauHtml(C({ bang: [['Chất', 'M'], ['Ester', '88']] }), 1, false)
    expect(h).toContain('<th>Chất</th>')
    expect(h).toContain('<td>Ester</td>')
  })

  it('câu không có hình thì KHÔNG chèn thẻ img rỗng', () => {
    expect(theCauHtml(MCQ, 1, false)).not.toContain('<img')
  })

  it('trang lời giải cũng in ảnh thân câu, không thì em không biết đang giải câu nào', () => {
    expect(theGiaiHtml(C({ anhThanCau: A, dapAn: 'A' }), 1)).toContain('q-hinh than')
  })

  it('Phần II: mỗi ý một hàng flex để ô Đ/S cân giữa với chữ dài', () => {
    const h = theCauHtml(C({ phan: 'II', luaChon: ['a', 'b', 'c', 'd'], dapAn: 'DSDS' }), 1, true)
    expect((h.match(/class="tf-item"/g) || []).length).toBe(4)
    expect(h).toContain('class="tf-o"')
  })
})
