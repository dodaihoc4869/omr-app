// TRUNG TU 09/10 · MỞ CA KIỂM TRA (bản vẽ GV-MoCa thầy duyệt), chế độ Game Hóa 2.0 — CHỈ giao diện, logic mở ca không đổi:
//   · thanh 4 bước nối liền (Đề · Ai làm · Giờ · Luật), mỗi bước có dòng trạng thái; bước đang làm `aria-current="step"`;
//   · nút "Mở ca kiểm tra ngay" chưa đủ điều kiện thì mờ KÈM câu lý do ("Chọn đề trước…", nối bằng aria-describedby);
//   · cờ TẮT ⇒ thanh bước cũ ("1. Đề"…) như cũ.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { TeacherExamSource } from '../src/data/examContent'

const de = (maDe: string, n: number): TeacherExamSource => ({
  maDe,
  nhom: '12 · CI - Ester lipid',
  nguon: `Nguồn ${maDe}`,
  phanI: Array.from({ length: n }, (_, i) => ({ id: `${maDe}-I-${i + 1}`, text: `Câu ${maDe} số ${i + 1}`, choices: ['a', 'b', 'c', 'd'], correct: 'A', chuyenDe: 'Ester' })) as never,
  phanII: [],
  phanIII: [],
})
const KHO = [de('KT-12-C1', 10), de('KT-11-C2', 8)]

vi.mock('../src/lib/exam-api', async (goc) => ({ ...(await goc<Record<string, unknown>>()), danhSachEm: async () => [], publishSession: vi.fn() }))
vi.mock('../src/lib/exam-db', () => ({
  loadScriptUrl: async () => '',
  loadTeacherSecret: async () => '',
  loadExamSources: async () => KHO,
  loadAllSessionTeacherBanks: async () => [],
  docSoCauCa: async () => undefined,
  luuSoCauCa: vi.fn(),
  saveSessionTeacherBank: vi.fn(),
  loadKhoaApp: async () => null,
  saveKhoaApp: vi.fn(),
  goKhoaApp: vi.fn(),
  batKhoaApp: vi.fn(),
}))
vi.mock('../src/lib/exam-sync', () => ({ dongBoNganHang: async () => null }))
vi.mock('../src/components/NutDongBo', () => ({ default: () => null }))
vi.mock('../src/components/KhoiRutDe', () => ({ default: () => null }))
vi.mock('../src/store/appStore', () => ({
  useAppStore: (sel: (s: Record<string, unknown>) => unknown) => sel({ setScreen: vi.fn(), showToast: vi.fn(), classList: [], moChiTietCa: vi.fn() }),
}))

const { useCoHoa2 } = await import('../src/components/chien-dich/co-hoa2')
const { default: ExamSetupScreen } = await import('../src/screens/ExamSetupScreen')

afterEach(() => {
  cleanup()
  useCoHoa2.getState().dat(null)
  localStorage.clear()
})

describe('Mở ca kiểm tra 2.0 — thanh 4 bước + câu lý do dưới nút mở ca', () => {
  it('bốn bước nối liền có trạng thái; bấm "Bước tiếp" đổi bước đang làm; nút mở ca mờ kèm lý do khi chưa chọn đề', async () => {
    useCoHoa2.getState().dat({ bat: true, lop: [], sbd: [] })
    const { container } = render(<ExamSetupScreen />)
    await waitFor(() => expect(container.textContent).toContain('Chưa chọn đề kiểm tra'))
    const thanh = screen.getByRole('list', { name: 'Các bước mở ca' })
    const buoc = within(thanh).getAllByRole('listitem')
    expect(buoc.map((b) => b.querySelector('.ct-buoc-chu b')?.textContent)).toEqual(['Đề', 'Ai làm', 'Giờ', 'Luật'])
    expect(buoc[0]!.getAttribute('aria-current')).toBe('step')
    expect(buoc[0]!.textContent).toContain('Đang chọn')
    expect(buoc[1]!.textContent).toContain('Mọi em có link')
    expect(buoc[2]!.textContent).toMatch(/\d+ phút/)
    expect(buoc[3]!.textContent).toContain('Thầy công bố sau')
    expect(container.querySelector('nav.ct-etapes')).toBeNull()

    const mo = screen.getByRole('button', { name: /Mở ca kiểm tra ngay/ }) as HTMLButtonElement
    expect(mo.disabled).toBe(true)
    const lyDo = document.getElementById(mo.getAttribute('aria-describedby')!)!
    expect(lyDo.textContent).toBe('Chọn đề trước, nút sẽ sáng lên. Mở xong có ngay link và mã ca.')

    fireEvent.click(screen.getByRole('button', { name: 'Bước tiếp: Ai làm' }))
    expect(buoc[1]!.getAttribute('aria-current')).toBe('step')
    expect(buoc[0]!.getAttribute('aria-current')).toBeNull()
    // đề chưa chọn mà đã sang bước sau ⇒ bước Đề báo thiếu (màu hổ phách + chữ "Chưa chọn"), không đánh dấu xong
    expect(buoc[0]!.getAttribute('data-trang-thai')).toBe('thieu')
    expect(buoc[0]!.textContent).toContain('Chưa chọn')
    fireEvent.click(within(buoc[3]!).getByRole('button'))
    expect(buoc[3]!.getAttribute('aria-current')).toBe('step')
    expect(buoc[1]!.getAttribute('data-trang-thai')).toBe('xong')
  })

  it('cờ TẮT ⇒ thanh bước cũ, câu dưới nút như cũ', async () => {
    const { container } = render(<ExamSetupScreen />)
    await waitFor(() => expect(container.textContent).toContain('Chưa chọn đề kiểm tra'))
    expect(container.querySelector('nav.ct-etapes')).toBeTruthy()
    expect(container.querySelector('.ct-buoc-thanh')).toBeNull()
    expect(container.textContent).toContain('Mở xong có ngay link + mã ca để gửi nhóm lớp.')
  })
})
