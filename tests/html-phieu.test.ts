import { describe, expect, it } from 'vitest'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'
import { biaHtml, chuHtml, dapAnChu, dungPhieu, ngayVN, oGiaiHtml, taiLieuHtml, thanhHtml, theCauHtml, thoat, tongQuanHtml } from '../src/lib/html-phieu'

const C = (o: Partial<CauLuyen>): CauLuyen =>
  ({ phan: 'I', id: 'x', chuyenDe: 'Ester – lipid', mucDo: 'biet', text: 'Đề', luaChon: null, dapAn: '', chot: '', lyDo: null, buoc: null, ketQua: '', ...o }) as CauLuyen

const MCQ = C({ text: 'Ester nào sau đây?', luaChon: ['A1', 'B1', 'C1', 'D1'], dapAn: 'C', chot: 'Chốt kiến thức.' })

const TT = { hoTen: 'Đỗ Đại Học', sbd: '12121212', ngay: new Date(2026, 8, 4), tenChuyenDe: 'Ester – lipid', ketQua: 'Sai 26/32 câu', hienDapAn: false }

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
  it('thẻ GẬP SẴN: chưa bấm thì không có lớp mo, nên đáp án chưa được tô', () => {
    const h = theCauHtml(MCQ, 1)
    expect(h).toContain('<article class="q-card" data-so="1" data-phan="I" data-muc="biet">')
    expect(h).not.toContain('q-card mo')
  })

  it('đánh dấu phương án đúng bằng lớp `dung` để CSS tô khi mở', () => {
    const h = theCauHtml(MCQ, 1)
    expect(h).toContain('<div class="q-opt dung"><div class="q-opt-letter"><span class="ky">C</span></div>')
    expect((h.match(/q-opt dung/g) || []).length).toBe(1)
  })

  it('lời giải nằm NGAY TRONG thẻ, gập trong sol-wrap', () => {
    const h = theCauHtml(MCQ, 3)
    expect(h).toContain('id="giai-3"')
    expect(h).toContain('class="sol-wrap"')
    expect(h).toContain('Chốt kiến thức.')
    expect(h).toContain('aria-expanded="false"')
    expect(h).toContain('aria-controls="giai-3"')
  })

  it('mở sẵn thì thẻ có lớp mo và nút báo đang mở', () => {
    const h = theCauHtml(MCQ, 1, true)
    expect(h).toContain('class="q-card mo"')
    expect(h).toContain('aria-expanded="true"')
  })

  it('đủ bốn phương án A B C D', () => {
    const h = theCauHtml(MCQ, 1)
    for (const k of ['A', 'B', 'C', 'D']) expect(h).toContain(`q-opt-letter"><span class="ky">${k}</span>`)
  })

  it('phương án dài thì xuống một cột cho khỏi vỡ chữ', () => {
    const dai = C({ luaChon: ['x'.repeat(70), 'b', 'c', 'd'], dapAn: 'A' })
    expect(theCauHtml(dai, 1)).toContain('q-options single-col')
    expect(theCauHtml(MCQ, 1)).not.toContain('single-col')
  })

  it('in đúng số thứ tự và nhãn mức độ', () => {
    const h = theCauHtml(MCQ, 7)
    expect(h).toContain('q-num"><span class="ky">7</span>')
    expect(h).toContain('Nhận biết')
  })
})

describe('theCauHtml — Phần II', () => {
  const tf = C({ phan: 'II', luaChon: ['ya', 'yb', 'yc', 'yd'], dapAn: 'DSSD', chot: 'c.' })

  it('mỗi ý đánh dấu `dung` vào đúng một trong hai ô Đ/S', () => {
    const h = theCauHtml(tf, 1)
    const hang = h.split('<div class="tf-statement">').slice(1)
    expect(hang).toHaveLength(4)
    expect(hang[0]).toContain('tf-badge d dung')
    expect(hang[1]).toContain('tf-badge s dung')
    expect(hang[2]).toContain('tf-badge s dung')
    expect(hang[3]).toContain('tf-badge d dung')
  })

  it('mỗi ý chỉ một ô được đánh dấu, không đánh cả hai', () => {
    const h = theCauHtml(tf, 1)
    expect((h.match(/tf-badge [ds] dung/g) || []).length).toBe(4)
  })

  it('đánh số ý bằng a b c d', () => {
    const h = theCauHtml(tf, 1)
    for (const k of ['a. ', 'b. ', 'c. ', 'd. ']) expect(h).toContain(k)
  })

  it('mỗi ý một hàng flex để ô Đ/S cân giữa với chữ dài', () => {
    const h = theCauHtml(tf, 1)
    expect((h.match(/class="tf-item"/g) || []).length).toBe(4)
    expect(h).toContain('class="tf-o"')
  })
})

describe('theCauHtml — Phần III', () => {
  const sa = C({ phan: 'III', dapAn: '100', buoc: ['Tính số mol', 'Suy ra thể tích'], ketQua: 'V = 100 ml' })

  it('có sẵn cả ô trống lẫn ô đáp án — CSS quyết định hiện cái nào', () => {
    const h = theCauHtml(sa, 1)
    expect(h).toContain('sa-blank')
    expect(h).toContain('sa-answer')
  })

  it('các bước và kết quả nằm trong ô lời giải gập', () => {
    const h = theCauHtml(sa, 1)
    const giai = h.split('class="sol-wrap"')[1]
    expect(giai).toContain('Làm từng bước')
    expect(giai).toContain('1. Tính số mol')
    expect(giai).toContain('V = 100 ml')
  })
})

describe('oGiaiHtml — lời giải gộp một chỗ', () => {
  it('câu không có đáp án lẫn lời giải thì KHÔNG có ô, thẻ cũng không có nút mở', () => {
    expect(oGiaiHtml(C({}))).toBe('')
    const h = theCauHtml(C({}), 1)
    expect(h).toContain('khong-giai')
    expect(h).not.toContain('q-nut-giai')
  })

  it('luôn mở đầu bằng đáp án', () => {
    const h = oGiaiHtml(C({ dapAn: 'B' }))
    expect(h).toContain('Đáp án')
    expect(h).toContain('sol-dap">Đáp án: <b>B</b>')
  })

  it('gộp ĐỦ hướng làm, các bước và kết quả — không còn mục lời giải riêng ở cuối', () => {
    const h = oGiaiHtml(C({ dapAn: 'A', chot: 'x', buoc: ['b1'], ketQua: 'k' }))
    expect(h).toContain('Hướng làm')
    expect(h).toContain('Làm từng bước')
    expect(h).toContain('Kết quả')
  })

  it('in lý do TỪNG phương án, đánh dấu ✓ ở phương án đúng', () => {
    const h = oGiaiHtml(C({ dapAn: 'B', lyDo: [
      { khoa: 'A', dung: false, ly: 'sai vì x' },
      { khoa: 'B', dung: true, ly: 'đúng vì y' },
    ] }))
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
    const h = oGiaiHtml(c)
    expect(h).toContain('Đ S S Đ')
    expect(h).toContain('<strong>a.</strong> ✓ la')
    expect(h).toContain('<strong>b.</strong> lb')
    expect(h).toContain('Vì sao từng ý')
  })
})

describe('dapAnChu', () => {
  it('Phần II đổi mã DSDD sang chữ Đ/S cách nhau', () => {
    expect(dapAnChu(C({ phan: 'II', dapAn: 'DSDD' }))).toBe('Đ S Đ Đ')
  })
  it('câu chưa có đáp án thì in gạch ngang chứ không in chuỗi rỗng', () => {
    expect(dapAnChu(C({}))).toBe('—')
  })
})

describe('bìa và tổng quan', () => {
  it('bìa in đủ tên, SBD, ngày và số câu', () => {
    const h = biaHtml(TT, 20)
    expect(h).toContain('Đỗ Đại Học')
    expect(h).toContain('12121212')
    expect(h).toContain('04/09/2026')
    expect(h).toContain('20 Câu')
    expect(h).toContain('ESTER<br>– LIPID')
  })

  it('không có dòng kết quả thì KHÔNG in ô kết quả rỗng', () => {
    expect(biaHtml({ ...TT, ketQua: '' }, 5)).not.toContain('Kết quả')
  })

  it('bìa bản lời giải đổi nhãn', () => {
    expect(biaHtml({ ...TT, hienDapAn: true }, 5)).toContain('Lời giải chi tiết')
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

describe('thanhHtml', () => {
  it('đếm đúng tổng số câu và có nút mở tất cả', () => {
    const h = thanhHtml(12)
    expect(h).toContain('id="dem-mo">0</b>/<span id="dem-tong">12</span>')
    expect(h).toContain('id="mo-het"')
    expect(h).toContain('id="in-phieu"')
    expect(h).toContain('id="bo-loc"')
    expect(h).toContain('Mở tất cả')
  })
})

describe('taiLieuHtml', () => {
  it('cắt hộp chữ theo nét chữ để căn giữa cho chuẩn', () => {
    const h = taiLieuHtml('', 'x')
    expect(h).toContain('text-box-trim: trim-both')
    expect(h).toContain('text-box-edge: cap alphabetic')
  })

  it('tài liệu tự chứa: doctype, charset, toàn bộ CSS và kịch bản gập mở', () => {
    const h = taiLieuHtml('<div class="ds-cau"></div>', 'Phiếu')
    expect(h.startsWith('<!DOCTYPE html>')).toBe(true)
    expect(h).toContain('charset="UTF-8"')
    expect(h).toContain('@page { size: A4')
    expect(h).toContain('print-color-adjust: exact')
    expect(h).toContain('<script>')
    expect(h).toContain("closest('.q-card')")
  })

  it('co theo bề rộng máy — có thẻ viewport, không khoá khổ giấy A4 trên màn hình', () => {
    const h = taiLieuHtml('', 'x')
    expect(h).toContain('width=device-width')
    expect(h).not.toContain('width: 210mm')
  })

  it('bản in tự mở hết lời giải vì trên giấy không bấm được', () => {
    expect(taiLieuHtml('', 'x')).toContain('.sol-wrap { grid-template-rows: 1fr !important; }')
  })
})

describe('dungPhieu — trọn tài liệu', () => {
  const cau = [MCQ, C({ phan: 'III', dapAn: '100' })]

  it('một tài liệu duy nhất: bìa và tổng quan chỉ xuất hiện MỘT lần', () => {
    const h = dungPhieu(TT, cau)
    expect((h.match(/class="cover"/g) || []).length).toBe(1)
    expect((h.match(/class="summary-page"/g) || []).length).toBe(1)
  })

  it('KHÔNG còn mục Lời Giải Chi Tiết riêng ở cuối', () => {
    expect(dungPhieu(TT, cau)).not.toContain('Lời Giải Chi Tiết')
  })

  it('mỗi câu đúng một thẻ, đánh số liên tục', () => {
    const h = dungPhieu(TT, cau)
    expect((h.match(/class="q-card"/g) || []).length).toBe(2)
    expect(h).toContain('data-so="1"')
    expect(h).toContain('data-so="2"')
  })

  it('nội dung câu không phá được cấu trúc trang', () => {
    const h = dungPhieu(TT, [C({ text: '<img onerror=alert(1)>', dapAn: 'A' })])
    expect(h).not.toContain('<img onerror')
  })
})

describe('lọc theo ô tổng quan', () => {
  const cau = [MCQ, C({ phan: 'II', luaChon: ['a', 'b', 'c', 'd'], dapAn: 'DSDS', mucDo: 'hieu' }), C({ phan: 'III', dapAn: '5', mucDo: 'hieu' })]

  it('mỗi thẻ mang sẵn phần và mức độ để lọc được không cần gọi máy chủ', () => {
    const h = theCauHtml(C({ phan: 'II', mucDo: 'van_dung', dapAn: 'DDSS' }), 2)
    expect(h).toContain('data-phan="II"')
    expect(h).toContain('data-muc="van_dung"')
  })

  it('ô thống kê CÓ câu thì là nút lọc, ô rỗng thì để chết', () => {
    const h = tongQuanHtml(cau)
    expect(h).toContain('class="stat-card" data-loc="phan:I"')
    expect(h).toContain('class="stat-card" data-loc="phan:II"')
    expect(h).toContain('class="stat-card" data-loc="tat"')
    const chiPhanI = tongQuanHtml([MCQ])
    expect(chiPhanI).toContain('data-loc="phan:I"')
    expect(chiPhanI).not.toContain('data-loc="phan:II"')
    expect(chiPhanI).toContain('<div class="stat-card"><div class="stat-icon">⚖️')
  })

  it('dòng mức độ cũng là nút lọc', () => {
    expect(tongQuanHtml(cau)).toContain('class="topic-item" data-loc="muc:hieu"')
  })

  it('kịch bản có đủ phần lọc và bộ đếm chạy theo tập đang hiện', () => {
    const h = taiLieuHtml('', 'x')
    expect(h).toContain("closest('[data-loc]')")
    expect(h).toContain('dem-tong')
  })
})

describe('hình trong phiếu', () => {
  const A = 'data:image/png;base64,AAAA'

  it('ảnh cắt cả thân câu THAY chữ đề — lớp chữ PDF hay vỡ công thức âm thầm', () => {
    const h = theCauHtml(C({ anhThanCau: A, text: 'chữ có thể sai' }), 1)
    expect(h).toContain('class="q-hinh than"')
    expect(h).not.toContain('chữ có thể sai')
  })

  it('phương án bằng ảnh thì in ảnh, KHÔNG in chữ "(xem hình)"', () => {
    const h = theCauHtml(C({ luaChon: ['(xem hình)', 'b', 'c', 'd'], anhLuaChon: [A, undefined, undefined, undefined], dapAn: 'A' }), 1)
    expect(h).toContain('class="q-hinh pa"')
    expect(h).not.toContain('(xem hình)')
  })

  it('ảnh nhúng đúng vị trí trong câu', () => {
    const h = theCauHtml(C({ hinh: [{ src: A, viTri: 'sau_de' }, { src: A, viTri: 'cuoi_cau' }] }), 1)
    expect((h.match(/class="q-hinh"/g) || []).length).toBe(2)
  })

  it('ảnh phương án A đứng trong đúng ô phương án A', () => {
    const h = theCauHtml(C({ luaChon: ['a', 'b', 'c', 'd'], dapAn: 'A', hinh: [{ src: A, viTri: 'sau_pa_B' }] }), 1)
    const oB = h.split('q-opt-letter"><span class="ky">B</span>')[1].split('</div></div>')[0]
    expect(oB).toContain('q-hinh')
  })

  it('bảng số liệu in thành bảng thật, hàng đầu là tiêu đề, bọc khung cuộn ngang', () => {
    const h = theCauHtml(C({ bang: [['Chất', 'M'], ['Ester', '88']] }), 1)
    expect(h).toContain('<th>Chất</th>')
    expect(h).toContain('<td>Ester</td>')
    expect(h).toContain('q-bang-cuon')
  })

  it('câu không có hình thì KHÔNG chèn thẻ img rỗng', () => {
    expect(theCauHtml(MCQ, 1)).not.toContain('<img')
  })
})
