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
    // Soi THÂN phiếu, không soi bảng kiểu: `.lam-vung` luôn có trong CSS.
    const cu = dungPhieu(TT, CAU)
    expect(cu).not.toContain('class="lam-vung"')
    expect(cu).not.toContain('id="du-nop"')
    expect(cu).not.toContain('id="nut-nop"')
    // Và thẻ câu dựng riêng cũng vậy.
    expect(theCauHtml(CAU[0], 1)).not.toContain('class="lam-vung"')
  })

  it('KHAI `nop` thì mỗi câu có ô làm, mỗi phần một kiểu ô', () => {
    const h = dungPhieu(TT, CAU, { nop: NOP })
    expect((h.match(/class="lam-vung"/g) || []).length).toBe(3)
    // Phần I: bốn nút A–D.
    const oI = h.slice(h.indexOf('data-qid="q1"'), h.indexOf('data-qid="q2"'))
    for (const k of ['A', 'B', 'C', 'D']) expect(oI).toContain(`data-chon="${k}"`)
    // Phần II: bốn ý, mỗi ý một cặp Đ/S.
    const oII = h.slice(h.indexOf('data-qid="q2"'), h.indexOf('data-qid="q3"'))
    expect((oII.match(/class="lam-y"/g) || []).length).toBe(4)
    // Phần III: ô gõ.
    expect(h.slice(h.indexOf('data-qid="q3"'))).toContain('class="lam-nhap"')
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
    expect(doc.slice(0, 200)).toContain('kiemTraMaBiMat_(body)')
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
