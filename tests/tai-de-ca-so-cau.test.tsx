// THẺ "TẢI ĐỀ & LỜI GIẢI" — số câu phải nói đúng chuyện.
//
// LỖI THẦY BÁO 04-09: thẻ ghi "Mã 12-C1-B1 · 85 câu" trong khi ca chỉ ra 28
// câu. Hai con số đều có thật — 85 là kho của ca, 28 là số câu máy cắt cho mỗi
// em — nhưng thẻ chỉ nói một con nên đọc thành app đếm sai, và in ra là thừa
// 57 câu giấy.
import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { TeacherExamSource } from '../src/data/examContent'

vi.mock('../src/components/NutPhieuHtml', () => ({ default: () => null }))

const { default: NutTaiDeCa } = await import('../src/components/NutTaiDeCa')

const kho = (maDe: string, nI: number, nII: number, nIII: number): TeacherExamSource => ({
  maDe,
  phanI: Array.from({ length: nI }, (_, i) => ({ id: `${maDe}-I-${i}`, text: 't', choices: ['a', 'b', 'c', 'd'], correct: 'A' })) as never,
  phanII: Array.from({ length: nII }, (_, i) => ({ id: `${maDe}-II-${i}`, text: 't', ideas: ['a', 'b', 'c', 'd'], correct: 'DDDD' })) as never,
  phanIII: Array.from({ length: nIII }, (_, i) => ({ id: `${maDe}-III-${i}`, text: 't', correct: '1' })) as never,
})

const chung = { maCa: '984033', tenCa: 'Ca 12A1', showToast: vi.fn() }

describe('số câu trên thẻ tải đề', () => {
  it('ca cắt bớt: nói CẢ số câu mỗi em làm lẫn số câu trong kho', () => {
    const { container } = render(<NutTaiDeCa {...chung} banks={[kho('12-C1-B1', 55, 15, 15)]} soCauCa={{ I: 18, II: 4, III: 6 }} />)
    const chu = container.textContent ?? ''
    expect(chu).toContain('85 câu')
    expect(chu).toContain('28 câu')
    expect(chu).toContain('Cả kho của ca')
    // Nói rõ là mỗi em một bộ, không có "đề của ca" chung.
    expect(chu).toContain('mỗi em một bộ khác nhau')
  })

  it('ca rút đề đúng bằng kho: chỉ một con số, không thêm câu chữ thừa', () => {
    const { container } = render(<NutTaiDeCa {...chung} banks={[kho('12-C1-B1', 18, 4, 6)]} soCauCa={{ I: 18, II: 4, III: 6 }} />)
    const chu = container.textContent ?? ''
    expect(chu).toContain('28 câu')
    expect(chu).not.toContain('Cả kho của ca')
  })

  it('ca cũ không lưu số câu thì giữ nguyên cách hiện cũ, không đoán bừa', () => {
    const { container } = render(<NutTaiDeCa {...chung} banks={[kho('12-C1-B1', 55, 15, 15)]} soCauCa={null} />)
    const chu = container.textContent ?? ''
    expect(chu).toContain('85 câu')
    expect(chu).not.toContain('mỗi em làm')
  })
})
