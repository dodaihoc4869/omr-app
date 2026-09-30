// Ô TRẢ LỜI NGẮN + hai nút "−" và "," (thầy 21/09: "thêm 2 ô dấu âm và dấu phẩy bên cạnh các ô trả lời ngắn vì bàn phím số không có dấu âm và dấu phẩy; quét mọi chỗ mọi app").
// Phần này: LOGIC thuần (`src/lib/nhap-dap-so.ts`). Thành phần (30/09 là `OSoTraLoi`, hai nút TRONG ô) test ở `o-so-tra-loi-3009`. Trình duyệt thật (tiêu điểm, con trỏ, chạm) ở `o-nhap-dap-so-trinh-duyet-2109`; phiếu HTML ở `o-nhap-dap-so-phieu-2109`.
import { describe, expect, it } from 'vitest'
import { choPhepPhay, coPhay, doiDau, laAm, suaChenPhay, suaDoiDau, themPhay } from '../src/lib/nhap-dap-so'


describe('nhap-dap-so — phép thuần', () => {
  it('laAm / coPhay / doiDau / themPhay giữ nguyên nghĩa cũ (đã có test ba-loi-0609)', () => {
    expect(laAm('-5')).toBe(true)
    expect(laAm('  -5')).toBe(true)
    expect(laAm('5-')).toBe(false)
    expect(laAm(null)).toBe(false)
    expect(coPhay('1,5')).toBe(true)
    expect(coPhay('1.5')).toBe(true)
    expect(coPhay('15')).toBe(false)
    expect(doiDau('')).toBe('-')
    expect(doiDau('5')).toBe('-5')
    expect(doiDau('-5')).toBe('5')
    expect(doiDau('  5')).toBe('  -5')
    expect(doiDau('  -5')).toBe('  5')
    expect(themPhay('1')).toBe('1,')
    expect(themPhay('1,5')).toBe('1,5')
    expect(themPhay('1.5')).toBe('1.5')
  })
  it('suaDoiDau: thêm/bỏ "-" ở đầu và dịch con trỏ theo; ô đã đúng dạng ⇒ null', () => {
    expect(suaDoiDau('', 0, 0)).toEqual({ value: '-', caret: 1 })
    expect(suaDoiDau('15', 2, 2)).toEqual({ value: '-15', caret: 3 })
    expect(suaDoiDau('15', 0, 0)).toEqual({ value: '-15', caret: 1 }) // con trỏ đầu số: dấu chèn NGAY chỗ con trỏ ⇒ con trỏ đứng sau dấu
    expect(suaDoiDau('-15', 3, 3)).toEqual({ value: '15', caret: 2 })
    expect(suaDoiDau('-15', 0, 0)).toEqual({ value: '15', caret: 0 })
    expect(suaDoiDau('-15', 1, 1)).toEqual({ value: '15', caret: 0 })
    expect(suaDoiDau('  15', 4, 4)).toEqual({ value: '  -15', caret: 5 })
    expect(suaDoiDau('  -15', 5, 5)).toEqual({ value: '  15', caret: 4 })
  })
  it('suaDoiDau tôn trọng maxLength: thêm dấu mà vượt ⇒ null; bỏ dấu luôn được', () => {
    expect(suaDoiDau('12345', 5, 5, 5)).toBeNull()
    expect(suaDoiDau('1234', 4, 4, 5)).toEqual({ value: '-1234', caret: 5 })
    expect(suaDoiDau('-1234', 5, 5, 5)).toEqual({ value: '1234', caret: 4 })
  })
  it('suaChenPhay: chèn TẠI CON TRỎ, thay vùng chọn, chỉ MỘT dấu thập phân (cả "." dán vào)', () => {
    expect(suaChenPhay('15', 1, 1)).toEqual({ value: '1,5', caret: 2 })
    expect(suaChenPhay('15', 2, 2)).toEqual({ value: '15,', caret: 3 })
    expect(suaChenPhay('15', 0, 0)).toEqual({ value: ',15', caret: 1 }) // không tự chèn số 0: em gõ gì gửi nấy
    expect(suaChenPhay('', 0, 0)).toEqual({ value: ',', caret: 1 })
    expect(suaChenPhay('-5', 2, 2)).toEqual({ value: '-5,', caret: 3 })
    expect(suaChenPhay('1,5', 3, 3)).toBeNull() // đã có
    expect(suaChenPhay('1.5', 0, 0)).toBeNull() // dấu chấm dán vào cũng tính
    expect(suaChenPhay('12', 0, 2)).toEqual({ value: ',', caret: 1 }) // thay cả vùng chọn
    expect(suaChenPhay('1,5', 1, 2)).toEqual({ value: '1,5', caret: 2 }) // vùng chọn CHÍNH dấu phẩy ⇒ thay bằng dấu phẩy
    expect(suaChenPhay('1,5', 0, 1)).toBeNull() // vùng chọn không chứa dấu ⇒ vẫn còn một dấu ⇒ không chèn
    expect(suaChenPhay('15', 9, 9)).toEqual({ value: '15,', caret: 3 }) // con trỏ quá cuối ⇒ kẹp
    expect(suaChenPhay('15', 2, 1)).toEqual({ value: '1,', caret: 2 }) // ngược chiều chọn (chọn chữ "5") ⇒ thay bằng dấu phẩy
  })
  it('suaChenPhay tôn trọng maxLength', () => {
    expect(suaChenPhay('12345', 5, 5, 5)).toBeNull()
    expect(suaChenPhay('1234', 4, 4, 5)).toEqual({ value: '1234,', caret: 5 })
    expect(choPhepPhay('12345', 5, 5, 5)).toBe(false)
    expect(choPhepPhay('1234', 4, 4, 5)).toBe(true)
    expect(choPhepPhay('1,5', 3, 3)).toBe(false)
  })
  it('bấm nút hai lần không đẻ chuỗi lạ: "−" hai lần ⇒ về nguyên trạng; "," hai lần ⇒ vẫn một dấu', () => {
    for (const v of ['', '5', '-5', '1,5', '  7']) expect(doiDau(doiDau(v))).toBe(v)
    const a = suaChenPhay('15', 1, 1)!
    expect(suaChenPhay(a.value, a.caret, a.caret)).toBeNull()
  })
})
