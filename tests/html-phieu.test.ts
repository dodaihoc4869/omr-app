import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'
import { biaHtml, chuHtml, JS_PHIEU, dapAnChu, dungPhieu, ngayVN, oGiaiHtml, taiLieuHtml, thanhHtml, theCauHtml, thoat, tongQuanHtml } from '../src/lib/html-phieu'

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

  it('gỡ ký tự Symbol rơi ra từ PDF ngay lúc HIỂN THỊ, không đợi nạp lại đề', () => {
    // Ca mở trước khi có bộ gỡ vẫn giữ bản chưa lọc; lọc ở tầng hiển thị thì
    // mọi ca cũ tự đúng. \uF05B là dấu [ của font Symbol.
    // Gỡ xong thì bộ định dạng Hoá nhận ra công thức và hạ chỉ số luôn.
    expect(chuHtml('K = \uF05BCH3COOH\uF05D')).toBe('K = [CH<sub>3</sub>COOH]')
    expect(chuHtml('\uF028x\uF029')).toBe('(x)')
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

  it('gộp ĐỦ kiến thức cốt lõi, các bước và kết quả — không còn mục lời giải riêng ở cuối', () => {
    const h = oGiaiHtml(C({ dapAn: 'A', chot: 'x', buoc: ['b1'], ketQua: 'k' }))
    expect(h).toContain('Kiến thức cốt lõi')
    // Cốt lõi in đậm và đứng TRƯỚC các bước (thầy chốt 04-09 khuya).
    expect(h.indexOf('sol-cot-loi')).toBeLessThan(h.indexOf('Làm từng bước'))
    expect(h).toContain('Làm từng bước')
    expect(h).toContain('Kết quả')
  })

  // 07/09 (PHIEU-BAI-TAP-V2 mục 4.5): lý do KHÔNG còn dựng thành khối riêng
  // trong ô lời giải — nó đi theo chính phương án của nó trong `theCauHtml`.
  // Bản cũ bắt em nhảy qua lại giữa hai khối để dò dòng nào ứng với phương án
  // nào; đó là split-attention. Bảo đảm cũ (mỗi phương án có lý do của nó, có
  // dấu ✓/✗, không dùng màu một mình) giữ nguyên, chỉ đổi chỗ đứng.
  it('lý do đi theo phương án, KHÔNG còn khối "Vì sao" riêng', () => {
    // Lý do bây giờ SỐNG TRONG phương án, nên câu phải có phương án thì mới có
    // chỗ cho nó đứng — bản cũ dựng khối riêng nên không cần `luaChon`.
    const c = C({ dapAn: 'B', luaChon: ['A1', 'B1', 'C1', 'D1'], lyDo: [
      { khoa: 'A', dung: false, ly: 'sai vì x' },
      { khoa: 'B', dung: true, ly: 'đúng vì y' },
    ] })
    expect(oGiaiHtml(c)).not.toContain('Vì sao chọn / không chọn từng phương án')
    const t = theCauHtml(c, 1)
    expect(t).toMatch(/opt-ly sai[\s\S]{0,140}sai vì x/)
    expect(t).toMatch(/opt-ly dung[\s\S]{0,140}đúng vì y/)
    expect(t).toContain('✓')
    expect(t).toContain('✗')
  })

  it('kiến thức cốt lõi vẫn đứng TRÊN các bước', () => {
    const h = oGiaiHtml(C({ dapAn: 'B', chot: 'COT-LOI', buoc: ['b1'] }))
    expect(h.indexOf('COT-LOI')).toBeLessThan(h.indexOf('Làm từng bước'))
  })

  it('Phần II đổi DSSD thành Đ S S Đ, và mỗi ý mang lý do của chính nó', () => {
    const c = C({ phan: 'II', luaChon: ['ý a', 'ý b', 'ý c', 'ý d'], dapAn: 'DSSD', lyDo: [
      { khoa: 'a', dung: true, ly: 'la' },
      { khoa: 'b', dung: false, ly: 'lb' },
      { khoa: 'c', dung: false, ly: 'lc' },
      { khoa: 'd', dung: true, ly: 'ld' },
    ] })
    expect(oGiaiHtml(c)).toContain('Đ S S Đ')
    expect(oGiaiHtml(c)).not.toContain('Vì sao từng ý')
    const t = theCauHtml(c, 1)
    expect(t.slice(t.indexOf('ý a'), t.indexOf('ý b'))).toContain('la')
    expect(t.slice(t.indexOf('ý b'), t.indexOf('ý c'))).toContain('lb')
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
    // 07/09: tên chuyên đề để NGUYÊN MỘT DÒNG, không cắt tay ở dấu gạch — cỡ
    // chữ clamp() tự xuống dòng đúng chỗ, còn cắt tay thì tên như
    // "Hydrocarbon không no" xuống sai chỗ.
    expect(h).toContain('Ester – lipid')
    expect(h).not.toContain('<br>')
    // NGÀY và SỐ CÂU nằm trong DÒNG PHỤ dưới tên chuyên đề, không còn là một ô
    // riêng và một chân trang riêng — bìa gọn lại theo yêu cầu 06/09, nhưng
    // vẫn nói đủ.
    expect(h).toContain('20 câu')
    expect(h).toContain('04/09/2026')
    expect(h).toContain('<div class="cover-subtitle">Thầy Đỗ Đại Học · 20 câu · 04/09/2026</div>')
  })

  it('bìa KHÔNG in công thức nào — mọi chữ đến từ tham số', () => {
    // 07/09 (PHIEU-BAI-TAP-V2 mục 4.1). Bản 06/09 đã bỏ ba phân tử vắt chéo và
    // chọn công thức theo chuyên đề; bản này bỏ nốt cả bảng công thức, vì nó
    // vẫn là chữ Hoá nằm trong mã app mà chỗ gọi không đổi được.
    const h = biaHtml(TT, 20)
    expect(h).not.toContain('cover-molecule')
    expect(h).not.toContain('cover-chemical')
    expect(h).not.toContain('<span class="ct">')
    expect(h).not.toContain('<sub>')
  })

  it('không có dòng kết quả thì KHÔNG in ô kết quả rỗng', () => {
    expect(biaHtml({ ...TT, ketQua: '' }, 5)).not.toContain('Kết quả')
  })

  it('bìa bản lời giải đổi nhãn', () => {
    expect(biaHtml({ ...TT, hienDapAn: true }, 5)).toContain('Lời giải chi tiết')
  })

  it('chỗ gọi khai ô bìa thì bìa gọi ĐÚNG TÊN, không gõ cứng "Học sinh" và "SBD"', () => {
    // Đề của một CA: ô đầu là tên bài kiểm tra, số 6 chữ số là mã ca. Bản
    // trước gõ cứng nhãn nên in ra "Học sinh: Test 3" và "SBD: 547341".
    const h = biaHtml(
      { ...TT, ketQua: '', nhanBia: 'Đề kiểm tra kèm lời giải', oBia: [
        { nhan: 'Bài kiểm tra', gia: 'Test 3' },
        { nhan: 'Mã ca', gia: '547341' },
        { nhan: 'Lớp', gia: '31' },
      ] },
      28,
    )
    expect(h).toContain('>Bài kiểm tra</div><div class="cover-info-value">Test 3<')
    expect(h).toContain('>Mã ca</div><div class="cover-info-value">547341<')
    expect(h).toContain('Đề kiểm tra kèm lời giải')
    expect(h).not.toContain('>Học sinh<')
    expect(h).not.toContain('>SBD<')
  })

  it('ô bìa rỗng giá trị thì bỏ hẳn, không in ô trống', () => {
    const h = biaHtml({ ...TT, oBia: [{ nhan: 'Lớp', gia: '' }, { nhan: 'Mã ca', gia: '99' }] }, 5)
    expect(h).not.toContain('>Lớp<')
    expect(h).toContain('>Mã ca<')
  })

  it('KHÔNG khai gì thì giữ nguyên bìa cũ — link phiếu đã gửi đi vẫn hiện như lúc gửi', () => {
    const h = biaHtml(TT, 20)
    expect(h).toContain('>Học sinh</div><div class="cover-info-value">Đỗ Đại Học<')
    expect(h).toContain('>SBD</div><div class="cover-info-value">12121212<')
  })

  it('NGÀY luôn có mặt kể cả khi chỗ gọi tự khai ô bìa riêng', () => {
    const h = biaHtml({ ...TT, oBia: [{ nhan: 'Mã ca', gia: '99' }] }, 5)
    expect(h).toContain('04/09/2026')
    expect(h).toContain('>Mã ca</div>')
    // Ô "Học sinh / SBD" mặc định nhường chỗ cho lời khai của chỗ gọi.
    expect(h).not.toContain('>Học sinh</div>')
  })

  // 07/09 (PHIEU-BAI-TAP-V2 mục 4.3): panel bốn ô cộng bảng phân loại thu thành
  // MỘT DÒNG, nên khoảng "Câu 1–9" không còn được in ra nữa. Bảo đảm cũ là
  // "không nói sai câu nào thuộc mức độ nào"; bản mới giữ bảo đảm đó ở mức
  // MẠNH HƠN: không in khoảng nào cả, chỉ in số đếm — số đếm thì không sai được.
  it('mức độ xen kẽ: đếm đúng và KHÔNG in khoảng câu nào', () => {
    const cau = [C({ mucDo: 'biet' }), C({ mucDo: 'hieu' }), C({ mucDo: 'biet' })]
    const h = tongQuanHtml(cau)
    expect(h).toContain('2 nhận biết')
    expect(h).toContain('1 thông hiểu')
    expect(h).not.toMatch(/Câu \d/)
    expect(h).not.toContain('–')
  })

  it('mức độ đứng liền nhau cũng chỉ ra số đếm, không ra khoảng', () => {
    const cau = [C({ mucDo: 'biet' }), C({ mucDo: 'biet' }), C({ mucDo: 'hieu' })]
    const h = tongQuanHtml(cau)
    expect(h).toContain('2 nhận biết')
    expect(h).not.toMatch(/Câu \d/)
  })

  it('tổng quan đếm đúng số câu từng phần', () => {
    const cau = [C({}), C({}), C({ phan: 'II' }), C({ phan: 'III' })]
    const h = tongQuanHtml(cau)
    expect(h).toContain('>4 câu</button>')
    expect(h).toContain('>2 trắc nghiệm</button>')
    expect(h).toContain('>1 đúng sai</button>')
    expect(h).toContain('>1 trả lời ngắn</button>')
    // KHÔNG EMOJI trong phiếu — quy tắc viết của thầy.
    expect(h).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u)
  })

  it('kho không có mức độ nào thì bỏ hẳn phần mức độ, không in dấu chấm giữa rỗng', () => {
    const h = tongQuanHtml([C({ mucDo: '' })])
    expect(h).not.toContain('topics-list')
    expect(h).not.toContain('data-loc="muc:')
    expect(h.trimEnd()).not.toMatch(/·\s*<\/section>$/)
  })
})

describe('thanhHtml', () => {
  it('đếm đúng tổng số câu và có nút mở tất cả', () => {
    const h = thanhHtml(12)
    expect(h).toContain('id="dem-mo">0</b>/<span id="dem-tong">12</span>')
    expect(h).toContain('id="mo-het"')
    expect(h).toContain('id="bo-loc"')
    expect(h).toContain('Mở tất cả')
  })
})

describe('hai lựa chọn in', () => {
  it('thanh có nút Hiện đề và nút Tải PDF hai lựa chọn (thầy chốt 06/09)', () => {
    const h = thanhHtml(10)
    // HIỆN ĐỀ — giấu đáp án và lời giải NGAY TRÊN MÀN HÌNH, không chỉ khi in.
    expect(h).toContain('id="chi-de"')
    expect(h).toContain('Hiện đề')
    // TẢI PDF hỏi tải bản nào, không đoán hộ: hai lựa chọn ra hai tệp khác hẳn.
    expect(h).toContain('id="tai-pdf"')
    expect(h).toContain('id="pdf-de"')
    expect(h).toContain('Chỉ đề bài')
    expect(h).toContain('id="pdf-giai"')
    expect(h).toContain('Đề và lời giải')
    // Nói thẳng là đi qua hộp in của máy, không hứa một cú bấm ra tệp.
    expect(h).toContain('Lưu thành PDF')
    // KHÔNG còn nút tải tệp HTML: thầy chốt tải về phải là PDF.
    expect(h).not.toContain('id="tai-tep"')
  })

  it('bản chỉ có đề KHÔNG dựng nút Hiện đề — không có gì để giấu', () => {
    const h = thanhHtml(10, true)
    expect(h).not.toContain('id="chi-de"')
    expect(h).toContain('id="pdf-de"')
    expect(h).not.toContain('id="pdf-giai"')
  })

  it('chế độ chỉ đề ĐÓNG hết thẻ đang mở, không chỉ trông vào CSS', () => {
    // Thẻ đang mở mang lớp "mo", mà luật màn hình của lớp đó ngang cơ với luật
    // chỉ-đề — câu đang đọc dở vẫn hở lời giải.
    const h = taiLieuHtml('', 'x')
    expect(h).toContain("classList.contains('mo')")
    expect(h).toContain('daMo.push')
    expect(h).toContain('body.chi-de .q-opt.dung { background: #f8fafc !important;')
  })

  it('chế độ chỉ đề giấu SẠCH lời giải và đáp án đã tô, ở CẢ màn hình lẫn bản in', () => {
    const h = taiLieuHtml('', 'x')
    expect(h).toContain('body.chi-de .sol-wrap { display: none !important; }')
    expect(h).toContain('body.chi-de .sa-answer { display: none !important; }')
    expect(h).toContain('body.chi-de .sa-blank { display: block !important; }')
    // Ô đáp án đúng phải trở lại màu thường, không thì em nhìn màn hình vẫn
    // thấy ô nào được tô xanh.
    expect(h).toContain('body.chi-de .q-opt.dung')
    expect(h).toContain('body.chi-de .tf-badge.dung')
    // Luật nằm NGOÀI mọi khối @media thì mới ăn trên màn hình. Đây là cả điểm
    // của lần sửa này: bản cũ chỉ giấu được lúc in. Kiểm bằng cách CẮT SẠCH
    // các khối @media rồi xem luật còn không.
    const boMedia = (cssGoc: string) => {
      // Cắt CHÚ THÍCH trước: chính chú thích của luật này có chữ "@media print"
      // trong đó, không cắt là bộ quét ăn luôn cả luật cần kiểm.
      const css = cssGoc.replace(/\/\*[\s\S]*?\*\//g, '')
      let ra = ''
      let i = 0
      while (i < css.length) {
        const k = css.indexOf('@media', i)
        if (k < 0) {
          ra += css.slice(i)
          break
        }
        ra += css.slice(i, k)
        let sau = css.indexOf('{', k)
        let sau2 = sau + 1
        let sauCap = 1
        while (sau2 < css.length && sauCap > 0) {
          if (css[sau2] === '{') sauCap++
          else if (css[sau2] === '}') sauCap--
          sau2++
        }
        i = sau2
      }
      return ra
    }
    expect(boMedia(h)).toContain('body.chi-de .sol-wrap { display: none !important; }')
  })

  it('tải PDF xong TRẢ màn hình về đúng trạng thái trước khi bấm', () => {
    const h = taiLieuHtml('', 'x')
    expect(h).toContain('var chiDeCu = document.body.classList.contains(\'chi-de\')')
    expect(h).toContain('datChiDe(chiDeCu)')
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
    // Panel `summary-page` đã thu thành dòng `tong-quan` (V2 mục 4.3); bảo đảm
    // "chỉ MỘT lần" giữ nguyên, chỉ đổi tên khối.
    expect((h.match(/class="tong-quan"/g) || []).length).toBe(1)
    expect(h).not.toContain('summary-page')
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

  it('cụm CÓ câu thì là nút lọc, cụm rỗng thì để chết', () => {
    const h = tongQuanHtml(cau)
    expect(h).toContain('data-loc="phan:I"')
    expect(h).toContain('data-loc="phan:II"')
    expect(h).toContain('data-loc="tat"')
    const chiPhanI = tongQuanHtml([MCQ])
    expect(chiPhanI).toContain('data-loc="phan:I"')
    expect(chiPhanI).not.toContain('data-loc="phan:II"')
    // Cụm rỗng để CHẾT: không phải <button>, không có data-loc, và mờ đi cho
    // khỏi mời bấm. Bấm vào để lọc ra trang trắng là vô nghĩa.
    expect(chiPhanI).toContain('<span class="tq-cum tat">0 đúng sai</span>')
    expect(chiPhanI).toContain('<span class="tq-cum tat">0 trả lời ngắn</span>')
  })

  it('mức độ vẫn là nút lọc — bỏ chip màu, KHÔNG bỏ chức năng', () => {
    expect(tongQuanHtml(cau)).toContain('data-loc="muc:hieu"')
    expect(tongQuanHtml(cau)).toContain('aria-pressed="false"')
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

// ============================================================ CHỐT CHẶN BẪY
// `CSS_PHIEU` và `JS_PHIEU` là template literal. MỘT dấu backtick lạc vào —
// kể cả trong comment CSS hay comment JS — là chuỗi đứt giữa chừng, và lỗi báo
// ra ở tận đâu đâu ("card is not defined", "Expected a semicolon"). Đã dính
// BỐN lần trong một ngày. Test này bắt ngay tại chỗ.
describe('không có backtick lạc trong CSS_PHIEU / JS_PHIEU', () => {
  const doc = readFileSync(resolve(process.cwd(), 'src/lib/html-phieu.ts'), 'utf8').split('\n')

  for (const ten of ['CSS_PHIEU', 'JS_PHIEU']) {
    it(`${ten} không chứa dấu backtick nào ở giữa`, () => {
      const dau = doc.findIndex((l) => l.startsWith(`export const ${ten} = \``))
      expect(dau).toBeGreaterThan(-1)
      const cuoi = doc.findIndex((l, i) => i > dau && l === '`')
      expect(cuoi).toBeGreaterThan(dau)
      const lac = doc.slice(dau + 1, cuoi).map((l, i) => (l.includes('`') ? dau + 2 + i : 0)).filter(Boolean)
      expect(lac).toEqual([])
    })
  }
})

// Kịch bản nhúng vào phiếu phải CHẠY ĐƯỢC. Đã dính: dấu \n trong chuỗi JS bị
// template literal của TS đổi thành xuống dòng THẬT, làm đứt chuỗi JS và cả
// kịch bản chết ngay ("SyntaxError: Invalid or unexpected token") — gập mở lời
// giải hỏng theo mà không báo gì.
describe('JS_PHIEU chạy được', () => {
  it('cú pháp hợp lệ', () => {
    expect(() => new Function(JS_PHIEU)).not.toThrow()
  })
})
