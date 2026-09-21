// Ô TRẢ LỜI NGẮN + hai nút "−" và "," (thầy 21/09: "thêm 2 ô dấu âm và dấu phẩy bên cạnh các ô trả lời ngắn vì bàn phím số không có dấu âm và dấu phẩy; quét mọi chỗ mọi app").
// Phần này: LOGIC thuần (`src/lib/nhap-dap-so.ts`) + thành phần `ONhapDapSo` trong jsdom. Trình duyệt thật (tiêu điểm, con trỏ, chạm) ở `o-nhap-dap-so-trinh-duyet-2109`; phiếu HTML ở `o-nhap-dap-so-phieu-2109`.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import ONhapDapSo from '../src/components/ONhapDapSo'
import { choPhepPhay, coPhay, doiDau, laAm, suaChenPhay, suaDoiDau, themPhay } from '../src/lib/nhap-dap-so'

afterEach(cleanup)

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

/** Cha giữ trạng thái như mọi nơi dùng: nút chỉ gọi onChange, số hiện là số cha trả về. */
function Cha({ dau = '', ...rest }: { dau?: string } & Partial<React.ComponentProps<typeof ONhapDapSo>>) {
  const [v, setV] = useState(dau)
  return <ONhapDapSo id="o" value={v} onChange={setV} ariaLabel="Đáp số" {...rest} />
}
const o = () => screen.getByLabelText('Đáp số') as HTMLInputElement
const nutAm = () => screen.getByRole('button', { name: /dấu âm/ }) as HTMLButtonElement
const nutPhay = () => screen.getByRole('button', { name: 'Thêm dấu phẩy' }) as HTMLButtonElement
const go = (v: string) => fireEvent.change(o(), { target: { value: v } })

describe('ONhapDapSo — trong jsdom', () => {
  it('bàn phím số (inputMode decimal), có hai nút; "−" và "," ≥ nhãn đúng; ô "số hoặc chữ" giữ bàn phím chữ (inputMode text) mà nút vẫn có', () => {
    render(<Cha />)
    expect(o().getAttribute('inputmode')).toBe('decimal')
    expect(nutAm().textContent).toBe('−')
    expect(nutPhay().textContent).toBe(',')
    cleanup()
    render(<Cha inputMode="text" />)
    expect(o().getAttribute('inputmode')).toBe('text')
    expect(nutAm()).toBeTruthy()
  })
  it('gõ bằng nút ra "-1,5": − → gõ 1 → , → gõ 5', () => {
    render(<Cha />)
    fireEvent.click(nutAm())
    expect(o().value).toBe('-')
    go('-1')
    fireEvent.click(nutPhay())
    expect(o().value).toBe('-1,')
    go('-1,5')
    expect(o().value).toBe('-1,5')
    expect(nutPhay().disabled).toBe(true) // đã có dấu thập phân
    expect(nutAm().getAttribute('aria-label')).toBe('Bỏ dấu âm')
    fireEvent.click(nutAm())
    expect(o().value).toBe('1,5')
    expect(nutAm().getAttribute('aria-label')).toBe('Thêm dấu âm')
  })
  it('KHÔNG lấy tiêu điểm: pointerdown và mousedown trên hai nút bị preventDefault; ô đang có tiêu điểm thì vẫn có sau khi bấm', () => {
    render(<Cha dau="15" />)
    o().focus()
    for (const nut of [nutAm(), nutPhay()]) {
      const pd = new Event('pointerdown', { bubbles: true, cancelable: true })
      const md = new Event('mousedown', { bubbles: true, cancelable: true })
      nut.dispatchEvent(pd)
      nut.dispatchEvent(md)
      expect(pd.defaultPrevented).toBe(true)
      expect(md.defaultPrevented).toBe(true)
    }
    fireEvent.click(nutPhay())
    expect(document.activeElement).toBe(o())
    fireEvent.click(nutAm())
    expect(document.activeElement).toBe(o())
  })
  it('"," chèn TẠI CON TRỎ khi ô có tiêu điểm và đặt con trỏ sau dấu; gõ tiếp vào đúng chỗ', () => {
    render(<Cha dau="15" />)
    o().focus()
    o().setSelectionRange(1, 1)
    fireEvent.click(nutPhay())
    expect(o().value).toBe('1,5')
    expect(o().selectionStart).toBe(2)
    expect(o().selectionEnd).toBe(2)
  })
  it('ô KHÔNG có tiêu điểm ⇒ chèn ở CUỐI và không tự giành tiêu điểm (không bật bàn phím)', () => {
    render(<Cha dau="15" />)
    o().blur()
    o().setSelectionRange(0, 0) // vùng chọn cũ của ô không tiêu điểm không đáng tin
    fireEvent.click(nutPhay())
    expect(o().value).toBe('15,')
    expect(document.activeElement).not.toBe(o())
  })
  it('"−" khi con trỏ ở giữa: dấu vẫn vào ĐẦU số và con trỏ đứng cùng chữ số cũ', () => {
    render(<Cha dau="153" />)
    o().focus()
    o().setSelectionRange(2, 2)
    fireEvent.click(nutAm())
    expect(o().value).toBe('-153')
    expect(o().selectionStart).toBe(3)
  })
  it('dán "0.54" vẫn nhận nguyên văn (không chuẩn hoá, không chặn); dấu phẩy tự khoá vì đã có dấu thập phân', () => {
    const doi = vi.fn()
    render(<Cha onChange={doi} />)
    go('0.54')
    expect(doi).toHaveBeenLastCalledWith('0.54')
    // onChange bị ghi đè ⇒ cha không giữ số; kiểm nút ở bản có cha thật:
    cleanup()
    render(<Cha />)
    go('0.54')
    expect(o().value).toBe('0.54')
    expect(nutPhay().disabled).toBe(true)
  })
  it('em gõ gì gửi nấy: chữ, đơn vị, khoảng trắng, nhiều dấu — không sửa gì', () => {
    const doi = vi.fn()
    render(<ONhapDapSo value="" onChange={doi} ariaLabel="Đáp số" />)
    for (const v of ['5 mol', '  12%', '1,,5', '--3', 'abc', '−5', '1e-3']) { fireEvent.change(o(), { target: { value: v } }); expect(doi).toHaveBeenLastCalledWith(v) }
  })
  it('maxLength: đủ chỗ mới chèn; hết chỗ ⇒ nút "," khoá, "−" (thêm) không đổi gì', () => {
    render(<Cha dau="12345" maxLength={5} />)
    expect(nutPhay().disabled).toBe(true)
    fireEvent.click(nutAm())
    expect(o().value).toBe('12345')
    cleanup()
    render(<Cha dau="1234" maxLength={5} />)
    fireEvent.click(nutPhay())
    expect(o().value).toBe('1234,')
  })
  it('disabled khoá cả ô lẫn hai nút; bấm không gọi onChange', () => {
    const doi = vi.fn()
    render(<ONhapDapSo value="5" onChange={doi} disabled ariaLabel="Đáp số" />)
    expect(o().disabled).toBe(true)
    expect(nutAm().disabled).toBe(true)
    expect(nutPhay().disabled).toBe(true)
    fireEvent.click(nutAm())
    fireEvent.click(nutPhay())
    expect(doi).not.toHaveBeenCalled()
  })
  it('nút không nằm trong <label> của ô: bấm chữ nhãn KHÔNG kích nút "−" (lỗi kinh điển khi bọc nút trong label)', () => {
    render(<div><label htmlFor="o">Đáp án</label><Cha /></div>)
    fireEvent.click(screen.getByText('Đáp án'))
    expect(o().value).toBe('')
  })
})
