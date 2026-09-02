import { describe, expect, it, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import TheCau from '../src/components/TheCau'
import MaCaInput from '../src/components/MaCaInput'

const trangThai = (container: HTMLElement) => Array.from(container.querySelectorAll('[data-trang-thai]')).map((el) => el.getAttribute('data-trang-thai'))

describe('TheCau — chế độ THI (không bao giờ lộ đáp án)', () => {
  it('xanh = đang chọn; không có ô giải thích, không có dấu đúng/sai', () => {
    const { container, queryByText, queryByLabelText } = render(
      <TheCau cheDo="thi" phan="I" stt={1} text="Đề" choices={['CaO', 'CO2', 'NaOH', 'HCl']} choicePerm={[0, 1, 2, 3]} selected="B" />,
    )
    expect(trangThai(container)).toEqual(['trong', 'chon', 'trong', 'trong'])
    expect(queryByText('Thầy chưa nhập lời giải cho câu này.')).toBeNull()
    expect(queryByLabelText('đúng')).toBeNull()
    expect(queryByLabelText('sai')).toBeNull()
  })

  it('chạm CẢ HÀNG là chọn, trả về chữ cái GỐC (trước khi xáo)', () => {
    const onSelect = vi.fn()
    const { getByText } = render(
      <TheCau cheDo="thi" phan="I" stt={1} text="Đề" choices={['CaO', 'CO2', 'NaOH', 'HCl']} choicePerm={[2, 0, 3, 1]} selected={null} onSelect={onSelect} />,
    )
    // Hàng hiển thị đầu tiên (chữ "A.") chứa phương án gốc chỉ số 2 = NaOH.
    fireEvent.click(getByText('NaOH'))
    expect(onSelect).toHaveBeenCalledWith('C')
  })

  it('Phần II: Đúng và Sai khi chọn đều tô xanh (đỏ CHỈ dùng khi xem lại)', () => {
    const { container } = render(
      <TheCau cheDo="thi" phan="II" stt={2} text="Đề" ideas={['a', 'b', 'c', 'd']} selected={['D', 'S', null, null]} />,
    )
    const nut = Array.from(container.querySelectorAll('button[data-trang-thai]'))
    expect(nut.map((b) => b.getAttribute('data-trang-thai'))).toEqual(['chon', 'trong', 'trong', 'chon', 'trong', 'trong', 'trong', 'trong'])
    expect(container.querySelectorAll('[data-trang-thai="sai"]').length).toBe(0)
  })

  it('Phần III: ô nhập, gõ là gọi onChange', () => {
    const onChange = vi.fn()
    const { getByPlaceholderText } = render(<TheCau cheDo="thi" phan="III" stt={3} text="Đề" selected={null} onChange={onChange} />)
    fireEvent.change(getByPlaceholderText('Nhập đáp án'), { target: { value: '12,5' } })
    expect(onChange).toHaveBeenCalledWith('12,5')
  })
})

describe('TheCau — chế độ XEM LẠI', () => {
  it('Phần I: đáp án đúng xanh ✓, phương án em chọn sai đỏ ✗, có ô giải thích', () => {
    const { container, getByLabelText } = render(
      <TheCau
        cheDo="xem_lai"
        phan="I"
        stt={1}
        text="Đề"
        choices={['CaO', 'CO2', 'NaOH', 'HCl']}
        choicePerm={[0, 1, 2, 3]}
        selected="A"
        correct="B"
        explanation="CO2 là oxide acid."
      />,
    )
    expect(trangThai(container)).toEqual(['sai', 'dung', 'trong', 'trong'])
    expect(getByLabelText('đúng')).toBeTruthy()
    expect(getByLabelText('sai')).toBeTruthy()
    expect(container.textContent).toContain('là oxide acid.')
  })

  it('chưa trả lời -> chỉ tô đáp án đúng, không có dấu ✗; không có lời giải -> báo rõ', () => {
    const { container, getByText, queryByLabelText } = render(
      <TheCau cheDo="xem_lai" phan="I" stt={1} text="Đề" choices={['CaO', 'CO2', 'NaOH', 'HCl']} choicePerm={[0, 1, 2, 3]} selected={null} correct="B" />,
    )
    expect(trangThai(container)).toEqual(['trong', 'dung', 'trong', 'trong'])
    expect(queryByLabelText('sai')).toBeNull()
    expect(getByText('Thầy chưa nhập lời giải cho câu này.')).toBeTruthy()
  })

  it('Phần II: từng ý — đúng ✓, sai ✗, chưa trả lời không dấu', () => {
    const { container } = render(
      <TheCau cheDo="xem_lai" phan="II" stt={1} text="Đề" ideas={['a', 'b', 'c', 'd']} correct={['D', 'S', 'D', 'S']} selected={['D', 'D', null, 'D']} />,
    )
    // a: chọn D đúng D -> ✓ ; b: chọn D đúng S -> ✗ ; c: null -> không ; d: chọn D đúng S -> ✗
    expect(container.querySelectorAll('[aria-label="đúng"]').length).toBe(1)
    expect(container.querySelectorAll('[aria-label="sai"]').length).toBe(2)
    // Nút xem lại bị khoá, không bấm được.
    expect(Array.from(container.querySelectorAll('button[data-trang-thai]')).every((b) => (b as HTMLButtonElement).disabled)).toBe(true)
  })

  it('Phần III: chấp nhận dấu , thay . ; chưa trả lời báo rõ', () => {
    const dung = render(<TheCau cheDo="xem_lai" phan="III" stt={1} text="Đề" correct="12,5" selected="12.5" />)
    expect(dung.container.querySelectorAll('[aria-label="sai"]').length).toBe(0)
    expect(dung.container.querySelectorAll('[aria-label="đúng"]').length).toBe(2) // ô đáp án + ô em trả lời
    const trong = render(<TheCau cheDo="xem_lai" phan="III" stt={1} text="Đề" correct="12,5" selected={null} />)
    expect(trong.getByText('Em chưa trả lời câu này.')).toBeTruthy()
  })
})

describe('MaCaInput — 6 ô số', () => {
  it('chỉ nhận số, tối đa 6 ký tự, hiện từng số vào từng ô', () => {
    const onChange = vi.fn()
    const { getByLabelText, rerender, container } = render(<MaCaInput value="" onChange={onChange} />)
    fireEvent.change(getByLabelText('Mã ca 6 số'), { target: { value: '80a25539' } })
    expect(onChange).toHaveBeenCalledWith('802553')
    rerender(<MaCaInput value="802553" onChange={onChange} />)
    const oSo = Array.from(container.querySelectorAll('div > div > div')).map((d) => d.textContent)
    expect(oSo.slice(0, 6)).toEqual(['8', '0', '2', '5', '5', '3'])
  })
})
