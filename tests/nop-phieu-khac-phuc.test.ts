// PHIẾU KHẮC PHỤC NỘP ĐƯỢC — nghiệm thu theo NOP-PHIEU-KHAC-PHUC.md mục 8.
//
// Mỗi phép kiểm ứng với một dòng trong bảng "định nghĩa hoàn thành".
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { CAU_HINH_NOP_MAC_DINH, cauHinhNop, chamKhacPhuc } from '../src/lib/cau-hinh-nop-khac-phuc'
import { dungPhieu, JS_PHIEU, theCauHtml, thanhNopHtml } from '../src/lib/html-phieu'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'

const GS = fs.readFileSync(path.join(process.cwd(), 'docs/apps-script-kiem-tra.gs'), 'utf8')

const C = (o: Partial<CauLuyen>): CauLuyen =>
  ({ phan: 'I', id: 'x', maDe: 'X', chuyenDe: 'Ester – lipid', dang: 'chua_ro', sao: 0, mucDo: 'hieu', text: 'Đề', luaChon: ['a', 'b', 'c', 'd'], dapAn: 'A', chot: 'c', lyDo: null, buoc: null, ketQua: '', ...o }) as CauLuyen

const CAU: CauLuyen[] = [C({ id: 'q1', dapAn: 'C' }), C({ id: 'q2', phan: 'II', dapAn: 'DSDS' }), C({ id: 'q3', phan: 'III', luaChon: null, dapAn: '12,5' })]

const TT = { hoTen: 'Nguyễn Văn A', sbd: '12050', ngay: new Date(2026, 8, 8), tenChuyenDe: 'Ester', ketQua: '', hienDapAn: true }
const NOP = { ma: 'abcd1234ef', sbd: '12050', url: 'https://script.google.com/x/exec' }

describe('chấm — một luật, hai nơi dùng', () => {
  it('ba phần ba luật, câu bỏ trống tính SAI chứ không phải chưa làm', () => {
    const kq = chamKhacPhuc(
      CAU.map((c) => ({ id: c.id, phan: c.phan, dapAn: c.dapAn })),
      { q1: 'c', q2: 'DSDS', q3: '' },
    )
    expect(kq.soCau).toBe(3)
    // 'c' khớp 'C' (không phân biệt hoa thường), 'DSDS' khớp, q3 bỏ trống là sai.
    expect(kq.soDung).toBe(2)
    expect(kq.qidSai).toEqual(['q3'])
    expect(kq.soBoTrong).toBe(1)
  })

  it('phần III so số, dấu phẩy và dấu chấm là một', () => {
    const mot = [{ id: 'q3', phan: 'III' as const, dapAn: '12,5' }]
    expect(chamKhacPhuc(mot, { q3: '12.5' }).soDung).toBe(1)
    expect(chamKhacPhuc(mot, { q3: '12,5' }).soDung).toBe(1)
    expect(chamKhacPhuc(mot, { q3: '12' }).soDung).toBe(0)
  })

  it('cấu hình mặc định: nộp lại được, nộp xong mở lời giải, trước nộp thì khoá', () => {
    expect(CAU_HINH_NOP_MAC_DINH).toEqual({ CHO_NOP_LAI: true, HIEN_GIAI_SAU_NOP: true, HIEN_GIAI_TRUOC_NOP: false, CAN_LAM_HET_MOI_NOP: false })
    expect(cauHinhNop(null)).toEqual(CAU_HINH_NOP_MAC_DINH)
    expect(cauHinhNop({ CAN_LAM_HET_MOI_NOP: true }).CAN_LAM_HET_MOI_NOP).toBe(true)
  })
})

describe('trang phiếu', () => {
  it('KHÔNG KHAI `nop` thì phiếu KHÔNG mọc thêm một byte nào', () => {
    // Soi THÂN phiếu, không soi bảng kiểu: `.lam-o` luôn có trong CSS.
    const cu = dungPhieu(TT, CAU)
    expect(cu).not.toContain('lam-o"')
    expect(cu).not.toContain('class="lam-nhap"')
    expect(cu).not.toContain('data-qid=')
    expect(cu).not.toContain('id="du-nop"')
    expect(cu).not.toContain('id="nut-nop"')
    // Phiếu đọc vẫn giữ dòng kẻ đáp án tự luận như cũ.
    expect(cu).toContain('class="sa-blank"')
    // Và thẻ câu dựng riêng cũng vậy.
    expect(theCauHtml(CAU[0], 1)).not.toContain('lam-o"')
  })

  it('KHAI `nop` thì CHỌN NGAY TRÊN PHƯƠNG ÁN, không đẻ thêm dòng "em chọn"', () => {
    const h = dungPhieu(TT, CAU, { nop: NOP })
    // Không còn khối chọn riêng nào nữa (thầy chốt 08/09).
    expect(h).not.toContain('class="lam-vung"')
    expect(h).not.toContain('lam-nhan')
    expect(h).not.toContain('Em chọn')
    // Mỗi câu là một thẻ mang data-qid, ô chọn nằm ngay trên thẻ.
    expect((h.match(/class="q-card"[^>]*data-qid="/g) || []).length).toBe(3)
    // Phần I: bốn phương án A–D chính là bốn ô bấm.
    const oI = h.slice(h.indexOf('data-qid="q1"'), h.indexOf('data-qid="q2"'))
    for (const k of ['A', 'B', 'C', 'D']) expect(oI).toContain(`data-chon="${k}"`)
    expect((oI.match(/class="q-opt[^"]* lam-o" data-chon="/g) || []).length).toBe(4)
    expect((oI.match(/aria-checked="false"/g) || []).length).toBe(4)
    // Phần II: bốn ý, mỗi ý một cặp Đ/S ngay trên huy hiệu sẵn có.
    const oII = h.slice(h.indexOf('data-qid="q2"'), h.indexOf('data-qid="q3"'))
    expect((oII.match(/class="tf-item" data-y="/g) || []).length).toBe(4)
    expect((oII.match(/data-chon="D"/g) || []).length).toBe(4)
    expect((oII.match(/data-chon="S"/g) || []).length).toBe(4)
    // Phần III: ô gõ thay dòng kẻ.
    const oIII = h.slice(h.indexOf('data-qid="q3"'))
    expect(oIII).toContain('class="lam-nhap"')
    expect(oIII).not.toContain('class="sa-blank"')
  })

  it('CÓ THANH NỘP, đếm số câu đã làm', () => {
    const h = dungPhieu(TT, CAU, { nop: NOP })
    expect(h).toContain('id="nut-nop"')
    expect(h).toContain('id="nop-tong">3<')
    expect(thanhNopHtml(10)).toContain('id="nop-tong">10<')
  })

  it('GÓI DỮ LIỆU NỘP đi kèm, và KHÔNG nối chuỗi vào mã', () => {
    const h = dungPhieu(TT, CAU, { nop: NOP })
    expect(h).toContain('<script type="application/json" id="du-nop">')
    const goi = JSON.parse(h.slice(h.indexOf('id="du-nop">') + 12, h.indexOf('</script>', h.indexOf('id="du-nop">'))).replace(/\\u003c/g, '<'))
    expect(goi.ma).toBe('abcd1234ef')
    expect(goi.sbd).toBe('12050')
    expect(goi.cau.map((c: { id: string }) => c.id)).toEqual(['q1', 'q2', 'q3'])
    // Dấu `<` trong dữ liệu bị thoát — nhét thẻ script vào đề không phá được trang.
    const doc = dungPhieu(TT, [C({ id: '</script><b>x', dapAn: 'A' })], { nop: NOP })
    expect(doc).not.toContain('</script><b>x')
  })

  it('PHIẾU CHỈ CÓ ĐỀ thì KHÔNG nộp được — không có đáp án để chấm', () => {
    const h = dungPhieu(TT, CAU, { nop: NOP, anGiai: true })
    expect(h).not.toContain('class="lam-vung"')
    expect(h).not.toContain('id="du-nop"')
  })

  it('NỘP XONG MỞ LỜI GIẢI MỌI CÂU — thầy chốt 08/09', () => {
    expect(JS_PHIEU).toContain('HIEN_GIAI_SAU_NOP !== false')
    const than = JS_PHIEU.slice(JS_PHIEU.indexOf('var kq = chamTaiCho()'), JS_PHIEU.indexOf('gui(true)'))
    expect(than).toContain('bat(tatCa[i], true)')
  })

  it('BỎ TRỐNG VẪN NỘP ĐƯỢC, và nói rõ tính là sai', () => {
    expect(JS_PHIEU).toContain('câu chưa làm, mấy câu đó tính là sai. Nộp luôn?')
    expect(JS_PHIEU).toContain('Bỏ trống, tính là sai')
  })

  it('MẤT MẠNG KHÔNG MẤT BÀI — giữ lại và tự gửi lần mở sau', () => {
    expect(JS_PHIEU).toContain("localStorage.setItem(KHOA_LUU + '.cho', '1')")
    expect(JS_PHIEU).toContain("localStorage.getItem(KHOA_LUU + '.cho') === '1'")
    expect(JS_PHIEU).toContain('Bài của em vẫn được giữ')
  })

  it('CHỌN DỞ RỒI ĐÓNG MÁY vẫn còn — lưu theo mã phiếu', () => {
    expect(JS_PHIEU).toContain("var KHOA_LUU = 'ddh.lam.' + du.ma")
    expect(JS_PHIEU).toContain('function luuLam()')
  })

  it('CẤM MÀU ĐƠN ĐỘC — mỗi câu chấm xong có CHỮ Đúng/Sai, không chỉ có màu', () => {
    expect(JS_PHIEU).toContain("d.className = 'lam-ket'")
    expect(JS_PHIEU).toMatch(/'Sai'[\s\S]{0,40}'Đúng'/)
  })
})

describe('lệnh máy chủ', () => {
  it('CÓ ĐÚNG MỘT lệnh ghi công khai mới, và một lệnh đọc cần mã bí mật', () => {
    expect(GS).toContain("if (action === 'nopKhacPhuc') {")
    expect(GS).toContain("if (action === 'nopKhacPhucTheoCa') {")
    const doc = GS.slice(GS.indexOf("if (action === 'nopKhacPhucTheoCa') {"))
    expect(doc.slice(0, 600)).toContain('kiemTraMaBiMat_(body)')
    // `kiemTraMaBiMat_` trả CHUỖI lỗi, không phải phản hồi. Trả thẳng chuỗi ra
    // khỏi doPost là 500 và trình duyệt báo "Failed to fetch" — tôi đã dính
    // đúng lỗi này ở bản 54, nên khoá lại.
    expect(doc.slice(0, 600)).toContain('return jsonResponse_({ ok: false, error: kt })')
    expect(doc.slice(0, 600)).not.toMatch(/if \(kt\) return kt/)
  })

  it('BA KHOÁ thay cho mã bí mật: phiếu có thật · đúng loại · đúng SBD', () => {
    const than = GS.slice(GS.indexOf("if (action === 'nopKhacPhuc') {"), GS.indexOf("if (action === 'nopKhacPhucTheoCa') {"))
    expect(than).toContain('findRowByKey_(shPhieu, 0, maNop)')
    expect(than).toContain("!== 'baitap'")
    expect(than).toContain('.trim() !== sbdNop')
    // Sai khoá nào cũng trả CÙNG một câu.
    expect((than.match(/jsonResponse_\(LOI_NOP\)/g) || []).length).toBeGreaterThanOrEqual(5)
  })

  it('MÁY CHỦ TỰ CHẤM LẠI, không tin con số máy em gửi lên', () => {
    const than = GS.slice(GS.indexOf("if (action === 'nopKhacPhuc') {"), GS.indexOf("if (action === 'nopKhacPhucTheoCa') {"))
    expect(than).toContain('let soDung = 0')
    expect(than).toContain('chuanIII(chon) === chuanIII(dung)')
    // KHÔNG đọc soDung/soCau từ body.
    expect(than).not.toContain('body.soDung')
    expect(than).not.toContain('body.soCau')
  })

  it('LƯỢT MỚI, KHÔNG ĐÈ — đếm lượt cũ của đúng cặp (ma, sbd)', () => {
    const than = GS.slice(GS.indexOf("if (action === 'nopKhacPhuc') {"), GS.indexOf("if (action === 'nopKhacPhucTheoCa') {"))
    // Tên biến CỐ Ý không phải `lanThu`: `let lanThu = 1` là mốc mà test phòng
    // chờ dùng để cắt đoạn mã `vaoThi`, trùng tên là cắt nhầm chỗ.
    expect(than).toContain('let soLanNop = 1')
    expect(than).toContain('soLanNop += 1')
    expect(than).toContain('shNop.appendRow(')
    // appendRow, không setValues đè hàng cũ.
    expect(than).not.toContain('shNop.getRange(lai')
  })

  it('KHÔNG LẪN VÀO ĐIỂM — không đụng BangDiem, ChiTietCau hay LuotThi', () => {
    const than = GS.slice(GS.indexOf("if (action === 'nopKhacPhuc') {"), GS.indexOf("if (action === 'nopKhacPhucTheoCa') {"))
    expect(than).not.toContain('SHEET_LUOT')
    expect(than).not.toContain('SHEET_CHITIET')
    expect(than).not.toContain('SHEET_DIEM')
  })

  it('BẢNG RIÊNG, đủ cột để dựng "lần 1 đúng 4/10"', () => {
    expect(GS).toContain("const SHEET_NOPKP = 'NopKhacPhuc'")
    expect(GS).toContain("const NOPKP_HEADERS = ['Ma', 'MaCa', 'SBD', 'LanThu', 'NopLuc', 'SoCau', 'SoDung', 'DapAnJson', 'QidSaiJson']")
  })

  it('CÒN NGUYÊN thuộc tính SPREADSHEET_ID — dán nhầm là mất cả kho', () => {
    expect(GS).toContain("PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')")
  })
})

describe('nối vào trang phiếu bài tập thật', () => {
  const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/PhieuScreen.tsx'), 'utf8')

  it('BẬT NỘP ở bản CÓ lời giải, TẮT ở bản chỉ đề', () => {
    expect(MAN).toContain('const nop = !anGiai && ma && sbdEm ? { ma, sbd: sbdEm, url } : null')
    expect(MAN).toContain('dungPhieu(tt, cau, { anGiai, nop })')
  })

  it('SBD lấy từ chính gói phiếu, không hỏi em gõ vào', () => {
    // Em chỉ có cái link. Bắt em gõ SBD là mở đường nộp hộ người khác.
    expect(MAN).toContain("tt?.oBia?.find((o) => o.nhan === 'SBD')?.gia")
  })

  it('THIẾU MÃ HOẶC SBD thì phiếu mở ra CHỈ ĐỌC, không mọc nút nộp hỏng', () => {
    expect(MAN).toContain('ma && sbdEm ?')
  })
})

describe('nộp xong mới hiện lời giải (thầy chốt 08/09)', () => {
  const cau = (id: string): CauLuyen => ({
    id,
    phan: 'I',
    text: 'Câu ' + id,
    luaChon: ['a', 'b', 'c', 'd'],
    dapAn: 'A',
    mucDo: 'biet',
    chuyenDe: 'Ester – lipid',
    loiGiai: { buoc: ['Bước 1'], dapAn: 'A' },
  }) as unknown as CauLuyen

  const tt = { hoTen: 'Đỗ Đại Học', sbd: '12121212', ngay: new Date('2026-09-08'), tenChuyenDe: 'Ester – lipid', ketQua: '', hienDapAn: false }

  it('PHIẾU NỘP ĐƯỢC: body mang lớp chua-nop, lời giải bị giấu', () => {
    const html = dungPhieu(tt, [cau('q1')], { nop: { ma: 'abcd1234', sbd: '12121212', url: 'https://x' } })
    expect(html).toContain('<body class="co-lam chua-nop">')
    expect(html).toContain('body.chua-nop .q-nut-giai, body.chua-nop .sol-wrap { display: none !important; }')
    // Và nói rõ vì sao chưa thấy, thay vì để em tưởng phiếu hỏng.
    expect(html).toContain('Lời giải mở ra ngay sau khi em bấm Nộp bài.')
  })

  it('NỘP XONG mới gỡ khoá, gỡ TRƯỚC khi mở từng thẻ', () => {
    const html = dungPhieu(tt, [cau('q1')], { nop: { ma: 'abcd1234', sbd: '12121212', url: 'https://x' } })
    expect(html).toContain("document.body.classList.remove('chua-nop');")
    expect(html.indexOf("classList.remove('chua-nop')")).toBeLessThan(html.indexOf('for (var i = 0; i < tatCa.length; i++) bat(tatCa[i], true);'))
  })

  it('PHIẾU THƯỜNG (không nộp được) KHÔNG bị khoá — thầy vẫn mở lời giải như cũ', () => {
    const html = dungPhieu(tt, [cau('q1')])
    expect(html).toContain('<body>')
    expect(html).not.toContain('<body class="co-lam chua-nop">')
  })

  it('thầy bật HIEN_GIAI_TRUOC_NOP thì không khoá — cấu hình vẫn là cấu hình', () => {
    const html = dungPhieu(tt, [cau('q1')], { nop: { ma: 'abcd1234', sbd: '12121212', url: 'https://x', cauHinh: { HIEN_GIAI_TRUOC_NOP: true } } })
    expect(html).not.toContain('<body class="co-lam chua-nop">')
  })

  it('ĐANG CHỌN thì nhìn thấy được, và đã chấm rồi thì khoá tay', () => {
    const html = dungPhieu(tt, [cau('q1')], { nop: { ma: 'abcd1234', sbd: '12121212', url: 'https://x' } })
    // Ô đang chọn phải đổi nền, không chỉ đổi viền mờ.
    expect(html).toContain('.q-opt.lam-o[aria-checked="true"] { background: #eef2f6; border-color: #2f3e46; }')
    expect(html).toContain('.tf-badge.lam-o[aria-checked="true"] { background: #2f3e46; border-color: #2f3e46; color: #ffffff; }')
    // Bàn phím vẫn thấy ô đang trỏ.
    expect(html).toContain('.lam-o:focus-visible {')
    // Chấm xong thì không bấm đổi được nữa.
    expect(html).toContain('.q-card.da-cham .lam-o, .q-card.da-cham .lam-nhap { pointer-events: none; opacity: .95; }')
  })
})

describe('CHƯA NỘP: bịt ĐỦ BỐN đường tới đáp án (thầy bắt được 08/09)', () => {
  const cau = (id: string, phan: 'I' | 'II' | 'III'): CauLuyen =>
    ({
      id,
      phan,
      text: 'Câu ' + id,
      luaChon: phan === 'III' ? undefined : ['a', 'b', 'c', 'd'],
      dapAn: phan === 'II' ? 'ĐSĐS' : phan === 'III' ? '12,5' : 'A',
      mucDo: 'biet',
      chuyenDe: 'Ester – lipid',
      loiGiai: { buoc: ['Bước 1'], dapAn: 'A' },
    }) as unknown as CauLuyen
  const tt = { hoTen: 'Đỗ Đại Học', sbd: '12121212', ngay: new Date('2026-09-08'), tenChuyenDe: 'Ester – lipid', ketQua: '', hienDapAn: false }
  const html = dungPhieu(tt, [cau('q1', 'I'), cau('q2', 'II'), cau('q3', 'III')], { nop: { ma: 'abcd1234', sbd: '12121212', url: 'https://x' } })

  it('1. khối lời giải THẬT (.sol-wrap) bị giấu — không phải một lớp không tồn tại', () => {
    // Bản đầu giấu `.q-giai`, một lớp KHÔNG có trong phiếu, nên lời giải vẫn mở
    // được. Đây là phép kiểm chống đúng lỗi đó.
    expect(html).toContain('class="sol-wrap"')
    expect(html).toContain('body.chua-nop .q-nut-giai, body.chua-nop .sol-wrap { display: none !important; }')
  })

  it('2. nút "Mở tất cả" và "Hiện đề" ở thanh trên bị giấu', () => {
    expect(html).toContain('body.chua-nop #mo-het, body.chua-nop #chi-de, body.chua-nop #pdf-giai, body.chua-nop .dem-giai { display: none !important; }')
  })

  it('3. bộ đếm "Đã xem lời giải" giấu được RIÊNG, nhãn lọc vẫn còn', () => {
    expect(html).toContain('<span class="dem-giai">Đã xem lời giải')
    // Nhãn lọc nằm ngoài span đó nên không bị giấu lây.
    expect(html).toContain('<span class="the-loc" id="the-loc" hidden>')
  })

  it('4. tải PDF KÈM lời giải bị giấu, chỉ còn bản đề', () => {
    expect(html).toContain('id="pdf-de"')
    expect(html).toContain('body.chua-nop #pdf-giai')
  })

  it('TÔ ĐÁP ÁN ĐÚNG trên thân câu cũng tắt — phòng khi một thẻ lọt vào trạng thái mở', () => {
    expect(html).toContain('body.chua-nop .q-opt.dung { background: #f8fafc !important;')
    expect(html).toContain('body.chua-nop .tf-badge.dung {')
    expect(html).toContain('body.chua-nop .sa-answer { display: none !important; }')
  })

  it('PHIẾU THƯỜNG không mất nút nào — thầy vẫn mở tất cả như cũ', () => {
    const thuong = dungPhieu(tt, [cau('q1', 'I')])
    expect(thuong).not.toContain('<body class="co-lam chua-nop">')
    expect(thuong).toContain('id="mo-het"')
  })
})
