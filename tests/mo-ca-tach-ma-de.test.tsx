// MỞ CA — mỗi mã đề trong kho phải hiện thành BA DÒNG TÍCH RIÊNG.
//
// Thầy chốt 04-09: một bài trong kho là 90–190 câu gộp cả ba phần; muốn mở ca
// chỉ gồm trắc nghiệm thì trước đây phải chọn cả mã rồi vào màn Rút đề đặt hai
// phần kia về 0. Nay tích đúng một dòng.
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/react'
import type { TeacherExamSource } from '../src/data/examContent'

const de = (maDe: string, nI: number, nII: number, nIII: number): TeacherExamSource => ({
  maDe,
  nhom: '12 · CI - Ester lipid',
  nguon: `Nguồn ${maDe}`,
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

/** MỘT MÀN MỞ CA DUY NHẤT (thầy chốt 05/09 chiều) — không còn bước chọn loại
 * ca, vào là soạn luôn. */
function moCaKiemTra() {
  return render(<ExamSetupScreen />)
}

/** Cây MẶC ĐỊNH GẬP HẾT — mở lần lượt khối, chương, bài để thấy tầng dạng. */
async function moHetCay(container: HTMLElement) {
  for (let i = 0; i < 4; i++) {
    const nut = [...container.querySelectorAll('button[aria-expanded="false"]')] as HTMLElement[]
    if (nut.length === 0) break
    for (const b of nut) fireEvent.click(b)
  }
}

describe('danh sách đề khi mở ca', () => {
  it('cây nằm trong HỘP CUỘN cao cố định, không kéo dài cả trang', async () => {
    const { container } = moCaKiemTra()
    await waitFor(() => expect(container.textContent).toContain('Khối 12'))
    const hop = container.querySelector('[role="tree"]') as HTMLElement
    expect(hop).toBeTruthy()
    expect(hop.style.overflowY).toBe('auto')
    expect(parseInt(hop.style.maxHeight, 10)).toBeGreaterThan(0)
  })

  it('mặc định GẬP HẾT: chỉ thấy khối và chương, chưa thấy mã đề', async () => {
    const { container } = moCaKiemTra()
    await waitFor(() => expect(container.textContent).toContain('Khối 12'))
    const cay = (container.querySelector('[role="tree"]') as HTMLElement).textContent ?? ''
    expect(cay).toContain('CI - Ester lipid')
    expect(cay).not.toContain('12-C1-B2-TN')
  })

  it('mở hết cây thì mỗi mã ra ba dòng, đặt tên rõ phần nào', async () => {
    const { container } = moCaKiemTra()
    await waitFor(() => expect(container.textContent).toContain('Khối 12'))
    await moHetCay(container)
    const chu = (container.querySelector('[role="tree"]') as HTMLElement).textContent ?? ''
    for (const ma of ['12-C1-B2-TN', '12-C1-B2-DS', '12-C1-B2-TLN']) expect(chu).toContain(ma)
    for (const ten of ['Trắc nghiệm', 'Đúng sai', 'Trả lời ngắn']) expect(chu).toContain(ten)
  })

  it('phần rỗng KHÔNG sinh dòng — đề không có trả lời ngắn thì chỉ ra hai mã', async () => {
    const { container } = moCaKiemTra()
    await waitFor(() => expect(container.textContent).toContain('Khối 11'))
    await moHetCay(container)
    const chu = (container.querySelector('[role="tree"]') as HTMLElement).textContent ?? ''
    expect(chu).toContain('11-C1-B1-TN')
    expect(chu).toContain('11-C1-B1-DS')
    expect(chu).not.toContain('11-C1-B1-TLN')
  })

  it('số câu mỗi dòng đúng bằng số câu của phần đó, và tầng bài cộng đủ', async () => {
    const { container } = moCaKiemTra()
    await waitFor(() => expect(container.textContent).toContain('Khối 12'))
    await moHetCay(container)
    const dong = [...(container.querySelector('[role="tree"]') as HTMLElement).children].map((e) => e.textContent ?? '')
    const timDong = (ma: string) => dong.find((t) => t.includes(ma) && t.includes('câu')) ?? ''
    expect(timDong('12-C1-B2-TN')).toContain('51 câu')
    expect(timDong('12-C1-B2-DS')).toContain('19 câu')
    expect(timDong('12-C1-B2-TLN')).toContain('23 câu')
    // Tầng bài phải cộng đúng ba dạng: 51 + 19 + 23 = 93.
    expect(dong.some((t) => t.includes('Nguồn 12-C1-B2') && t.includes('93 câu'))).toBe(true)
  })
})
