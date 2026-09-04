// MỞ CA — mỗi mã đề trong kho phải hiện thành BA DÒNG TÍCH RIÊNG.
//
// Thầy chốt 04-09: một bài trong kho là 90–190 câu gộp cả ba phần; muốn mở ca
// chỉ gồm trắc nghiệm thì trước đây phải chọn cả mã rồi vào màn Rút đề đặt hai
// phần kia về 0. Nay tích đúng một dòng.
import { describe, expect, it, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import type { TeacherExamSource } from '../src/data/examContent'

const de = (maDe: string, nI: number, nII: number, nIII: number): TeacherExamSource => ({
  maDe,
  nhom: '12 · CI - Ester lipid',
  phanI: Array.from({ length: nI }, (_, i) => ({ id: `${maDe}-I-${i}`, text: 't', choices: ['a', 'b', 'c', 'd'], correct: 'A' })) as never,
  phanII: Array.from({ length: nII }, (_, i) => ({ id: `${maDe}-II-${i}`, text: 't', ideas: ['a', 'b', 'c', 'd'], correct: 'DDDD' })) as never,
  phanIII: Array.from({ length: nIII }, (_, i) => ({ id: `${maDe}-III-${i}`, text: 't', correct: '1' })) as never,
})

const KHO = [de('12-C1-B2', 51, 19, 23), de('11-C1-B1', 47, 16, 0)]

vi.mock('../src/lib/exam-api', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  danhSachEm: async () => [],
  publishSession: vi.fn(),
}))
vi.mock('../src/lib/exam-db', () => ({
  loadScriptUrl: async () => '',
  loadTeacherSecret: async () => '',
  loadExamSources: async () => KHO,
  loadAllSessionTeacherBanks: async () => [],
  docSoCauCa: async () => undefined,
  luuSoCauCa: vi.fn(),
  saveSessionTeacherBank: vi.fn(),
}))
vi.mock('../src/lib/exam-sync', () => ({ dongBoNganHang: async () => null }))
vi.mock('../src/components/NutDongBo', () => ({ default: () => null }))
vi.mock('../src/components/KhoiRutDe', () => ({ default: () => null }))
vi.mock('../src/store/appStore', () => ({
  useAppStore: (sel: (s: Record<string, unknown>) => unknown) => sel({ setScreen: vi.fn(), showToast: vi.fn(), classList: [] }),
}))

const { default: ExamSetupScreen } = await import('../src/screens/ExamSetupScreen')

describe('danh sách đề khi mở ca', () => {
  it('danh sách nằm trong HỘP CUỘN cao cố định, không kéo dài cả trang', async () => {
    const { container } = render(<ExamSetupScreen />)
    await waitFor(() => expect(container.textContent).toContain('12-C1-B2-TN'))
    const hop = container.querySelector('[role="listbox"]') as HTMLElement
    expect(hop).toBeTruthy()
    expect(hop.style.overflowY).toBe('auto')
    expect(parseInt(hop.style.maxHeight, 10)).toBeGreaterThan(0)
  })

  it('mỗi mã ra ba dòng, đặt tên rõ phần nào', async () => {
    const { container } = render(<ExamSetupScreen />)
    await waitFor(() => expect(container.textContent).toContain('12-C1-B2-TN'))
    const chu = container.textContent ?? ''
    for (const ma of ['12-C1-B2-TN', '12-C1-B2-DS', '12-C1-B2-TLN']) expect(chu).toContain(ma)
    // Phần in thành viên ngắn TN / ĐS / TLN; tên đầy đủ nằm ở title để rê chuột.
    const vien = [...container.querySelectorAll('[title]')].map((e) => e.getAttribute('title'))
    expect(vien).toContain('Trắc nghiệm')
    expect(vien).toContain('Đúng sai')
    expect(vien).toContain('Trả lời ngắn')
  })

  it('phần rỗng KHÔNG sinh dòng — đề không có trả lời ngắn thì chỉ ra hai mã', async () => {
    const { container } = render(<ExamSetupScreen />)
    await waitFor(() => expect(container.textContent).toContain('11-C1-B1-TN'))
    const chu = container.textContent ?? ''
    expect(chu).toContain('11-C1-B1-DS')
    expect(chu).not.toContain('11-C1-B1-TLN')
  })

  it('số câu mỗi dòng đúng bằng số câu của phần đó', async () => {
    const { container } = render(<ExamSetupScreen />)
    await waitFor(() => expect(container.textContent).toContain('12-C1-B2-TN'))
    const dong = [...container.querySelectorAll('[role="option"]')].map((e) => e.textContent ?? '')
    const timDong = (ma: string) => dong.find((t) => t.includes(ma) && t.includes('câu')) ?? ''
    expect(timDong('12-C1-B2-TN')).toContain('51 câu')
    expect(timDong('12-C1-B2-DS')).toContain('19 câu')
    expect(timDong('12-C1-B2-TLN')).toContain('23 câu')
  })
})
