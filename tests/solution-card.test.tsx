import { describe, expect, it } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { SolutionMcq, SolutionTrueFalse, SolutionShortAnswer } from '../src/components/SolutionCard'

describe('SolutionMcq — thẻ Phần I gập/mở, tô đúng màu đáp án đúng/sai', () => {
  it('mặc định gập — không hiện đề bài/phương án cho tới khi bấm', () => {
    const { queryByText, getByText } = render(
      <SolutionMcq
        mauIdx={0}
        soThuTu={1}
        text="Chất nào sau đây là oxit axit?"
        choices={['CaO', 'CO2', 'NaOH', 'HCl']}
        choicePerm={[0, 1, 2, 3]}
        correct="B"
        selected="A"
        explanation="CO2 là oxit axit."
      />,
    )
    expect(queryByText('Chất nào sau đây là oxit axit?')).toBeNull()
    fireEvent.click(getByText('Câu 1'))
    expect(getByText('Chất nào sau đây là oxit axit?')).toBeTruthy()
  })

  it('tô đúng đáp án đúng (xanh) và đáp án đã chọn sai (đỏ)', () => {
    const { getByText, container } = render(
      <SolutionMcq
        mauIdx={0}
        soThuTu={1}
        text="Đề"
        choices={['CaO', 'CO2', 'NaOH', 'HCl']}
        choicePerm={[0, 1, 2, 3]}
        correct="B"
        selected="A"
        explanation="Giải thích"
      />,
    )
    fireEvent.click(getByText('Câu 1'))
    const dungBox = container.querySelector('.border-emerald-400')
    const saiBox = container.querySelector('.border-rose-400')
    expect(dungBox?.textContent).toContain('CO2')
    expect(saiBox?.textContent).toContain('CaO')
  })

  it('chưa trả lời (selected=null) không tô đỏ ô nào', () => {
    const { getByText, container } = render(
      <SolutionMcq
        mauIdx={0}
        soThuTu={1}
        text="Đề"
        choices={['CaO', 'CO2', 'NaOH', 'HCl']}
        choicePerm={[0, 1, 2, 3]}
        correct="B"
        selected={null}
      />,
    )
    fireEvent.click(getByText('Câu 1'))
    expect(container.querySelector('.border-rose-400')).toBeNull()
  })

  it('không có lời giải -> hiện thông báo chưa có, không để trắng', () => {
    const { getByText } = render(
      <SolutionMcq mauIdx={0} soThuTu={1} text="Đề" choices={['A', 'B', 'C', 'D']} choicePerm={[0, 1, 2, 3]} correct="A" selected="A" />,
    )
    fireEvent.click(getByText('Câu 1'))
    expect(getByText('Thầy chưa nhập lời giải cho câu này.')).toBeTruthy()
  })
})

describe('SolutionTrueFalse — Phần II, đúng/sai từng ý theo lựa chọn của học sinh', () => {
  it('ý đúng hiện dấu tick, ý sai hiện dấu x, ý chưa trả lời hiện dấu ?', () => {
    const { getByText, container } = render(
      <SolutionTrueFalse
        mauIdx={0}
        soThuTu={1}
        text="Đề"
        ideas={['a', 'b', 'c', 'd']}
        correct={['D', 'S', 'D', 'S']}
        selected={['D', 'D', null, 'D']}
      />,
    )
    fireEvent.click(getByText('Câu 1'))
    // a: chọn D, đúng D -> đúng (emerald). b: chọn D, đúng S -> sai (rose). c: null -> chưa trả lời. d: chọn D, đúng S -> sai.
    expect(container.querySelectorAll('.bg-emerald-600').length).toBe(1)
    expect(container.querySelectorAll('.bg-rose-600').length).toBe(2)
    expect(container.querySelectorAll('.bg-slate-300').length).toBe(1)
  })
})

describe('SolutionShortAnswer — Phần III, luôn hiện đáp án đúng + so sánh với bài làm', () => {
  it('trả lời đúng (chấp nhận dấu , thay .)', () => {
    const { getByText } = render(<SolutionShortAnswer mauIdx={0} soThuTu={1} text="Đề" correct="12,5" selected="12.5" />)
    fireEvent.click(getByText('Câu 1'))
    expect(getByText('12,5')).toBeTruthy()
    expect(getByText(/Em đã chọn/)).toBeTruthy()
  })

  it('chưa trả lời -> báo rõ, không suy đoán', () => {
    const { getByText } = render(<SolutionShortAnswer mauIdx={0} soThuTu={1} text="Đề" correct="12,5" selected={null} />)
    fireEvent.click(getByText('Câu 1'))
    expect(getByText('Em chưa trả lời câu này.')).toBeTruthy()
  })
})
