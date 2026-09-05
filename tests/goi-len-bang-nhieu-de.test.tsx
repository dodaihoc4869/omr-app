// GỌI LÊN BẢNG — TÍCH ĐƯỢC NHIỀU ĐỀ (thầy chốt 05/09).
//
// Trước đây màn này chọn đúng MỘT mã đề. Một buổi chữa bài hiếm khi bó trong
// một mã: thầy lấy trắc nghiệm bài này, đúng sai bài kia. Nay tích nhiều mã,
// tích cả chương một chạm, và câu của mọi đề đã tích gộp chung một kho để phân.
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/react'
import type { TeacherExamSource } from '../src/data/examContent'

const de = (maDe: string, nI: number, nII: number): TeacherExamSource =>
  ({
    maDe,
    nhom: '12 · C1 - Ester lipid',
    nguon: 'Bài 1. Ester',
    phanI: Array.from({ length: nI }, (_, i) => ({ id: `${maDe}-I-${i + 1}`, text: `TN ${i + 1}`, choices: ['a', 'b', 'c', 'd'], correct: 'A', chuyenDe: 'Ester' })),
    phanII: Array.from({ length: nII }, (_, i) => ({ id: `${maDe}-II-${i + 1}`, text: `ĐS ${i + 1}`, ideas: ['a', 'b', 'c', 'd'], correct: ['D', 'D', 'D', 'D'], chuyenDe: 'Ester' })),
    phanIII: [],
  }) as unknown as TeacherExamSource

// Một bài, hai dạng — đúng hình dạng kho thật sau khi tách theo phần.
const KHO = [de('12-C1-B1', 5, 3)]

vi.mock('../src/lib/exam-api', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  danhSachEm: async () => [],
  danhSachCa: async () => [],
  chiTietCa: async () => ({ ca: {}, luot: [] }),
  qidDaLam: async () => ({}),
  hoSoEm: async () => ({}),
  ghiLenBang: vi.fn(),
}))
vi.mock('../src/lib/exam-db', () => ({
  loadScriptUrl: async () => 'https://x',
  loadTeacherSecret: async () => 'mat',
  loadExamSources: async () => KHO,
  // Khối "Mật khẩu mở app" trong màn Cài đặt đọc hai hàm này lúc dựng.
  loadKhoaApp: async () => null,
  saveKhoaApp: vi.fn(),
  goKhoaApp: vi.fn(),
  batKhoaApp: vi.fn(),
}))
vi.mock('../src/components/TheCau', () => ({ default: () => null }))
vi.mock('../src/store/appStore', () => ({
  useAppStore: (sel: (s: Record<string, unknown>) => unknown) => sel({ setScreen: vi.fn(), showToast: vi.fn() }),
}))

const { default: GoiLenBangScreen } = await import('../src/screens/GoiLenBangScreen')

/** Mở hết cây để thấy tầng dạng. */
async function moHetCay(container: HTMLElement) {
  for (let i = 0; i < 4; i++) {
    const nut = [...container.querySelectorAll('button[aria-expanded="false"]')] as HTMLElement[]
    if (nut.length === 0) break
    for (const b of nut) fireEvent.click(b)
  }
}

describe('Gọi lên bảng — chọn nhiều đề', () => {
  it('hộp chọn đề dùng Ô TÍCH, không phải nút chọn một', async () => {
    const { container, queryAllByRole } = render(<GoiLenBangScreen />)
    await waitFor(() => expect(container.textContent).toContain('Khối 12'))
    // Hai chip "cách lấy câu" ở mục 2 cũng là radio, nhưng chúng không mang tên
    // đề — cái phải là Ô TÍCH là những dòng đề trong hộp chọn.
    expect(queryAllByRole('radio').filter((e) => /12-C1-B1|Khối 12|C1 - Ester/.test(e.textContent ?? ''))).toHaveLength(0)
    expect(queryAllByRole('checkbox').length).toBeGreaterThan(0)
  })

  it('mở màn KHÔNG tự tích sẵn đề nào', async () => {
    const { container } = render(<GoiLenBangScreen />)
    await waitFor(() => expect(container.textContent).toContain('Đã chọn:'))
    expect(container.textContent).toContain('Đã chọn: 0 câu')
  })

  it('tích hai dạng thì thanh tổng cộng dồn câu của cả hai', async () => {
    const { container, getAllByRole } = render(<GoiLenBangScreen />)
    await waitFor(() => expect(container.textContent).toContain('Khối 12'))
    await moHetCay(container)
    const la = getAllByRole('checkbox').filter((e) => /12-C1-B1-(TN|DS)/.test(e.textContent ?? ''))
    expect(la.length).toBe(2)
    fireEvent.click(la[0])
    fireEvent.click(la[1])
    // 5 trắc nghiệm + 3 đúng sai = 8 câu.
    expect(container.textContent).toContain('Đã chọn: 8 câu')
    expect(container.textContent).toMatch(/I:\s*5/)
    expect(container.textContent).toMatch(/II:\s*3/)
  })

  it('tích ô CHƯƠNG là lấy hết mọi dạng trong chương, một chạm', async () => {
    const { container, getByRole } = render(<GoiLenBangScreen />)
    await waitFor(() => expect(container.textContent).toContain('Khối 12'))
    fireEvent.click(getByRole('checkbox', { name: /C1 - Ester lipid/ }))
    expect(container.textContent).toContain('Đã chọn: 8 câu')
  })

  it('bỏ tích hết thì thanh tổng về 0', async () => {
    const { container, getByRole, getByText } = render(<GoiLenBangScreen />)
    await waitFor(() => expect(container.textContent).toContain('Khối 12'))
    fireEvent.click(getByRole('checkbox', { name: /C1 - Ester lipid/ }))
    expect(container.textContent).toContain('Đã chọn: 8 câu')
    fireEvent.click(getByText('Bỏ chọn hết'))
    expect(container.textContent).toContain('Đã chọn: 0 câu')
  })
})
