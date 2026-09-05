// HAI NÚT MỖI EM TRONG DANH SÁCH HỌC SINH (thầy chốt 05/09).
//
// Trước đây chạm bất kỳ đâu trên hàng là mở hồ sơ, rồi hồ sơ đổ hết mọi khối
// xuống một cột: muốn xem lịch sử ca của em phải cuộn qua biểu đồ tiến bộ,
// phiếu Zalo và bảng chuyên đề. Nay mỗi tên có hai nút đi thẳng vào đúng mục.
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/react'
import type { EmTomTat, HoSoEm } from '../src/lib/exam-api'

const DS: EmTomTat[] = [
  { sbd: '001', hoTen: 'Lê Minh Đức', lop: '12A1', namSinh: '2008', soCa: 3, diemGanNhat: 7.5, trangThai: 'trong_danh_sach' } as EmTomTat,
  { sbd: '002', hoTen: 'Trần Thu Hà', lop: '12A1', namSinh: '2008', soCa: 0, diemGanNhat: null, trangThai: 'trong_danh_sach' } as EmTomTat,
]

const HO_SO: HoSoEm = {
  em: { sbd: '001', hoTen: 'Lê Minh Đức', lop: '12A1', namSinh: '2008' },
  ca: [
    { maCa: '111111', tenCa: 'Ca Ester', lanThu: 1, nopLuc: '2026-09-01T02:00:00Z', tong: 7.5, hang: 4, siSo: 30 },
    { maCa: '222222', tenCa: 'Ca Amine', lanThu: 1, nopLuc: '2026-09-03T02:00:00Z', tong: 8, hang: 2, siSo: 30 },
  ],
  chuyenDe: [{ ten: 'Ester – lipid', soCau: 12, soSai: 6, tiLeSai: 0.5, xuHuong: 'giu' }],
} as unknown as HoSoEm

const moHoSoEm = vi.fn()
let sbdDangXem = ''

vi.mock('../src/store/appStore', () => ({
  useAppStore: (sel: (s: Record<string, unknown>) => unknown) => sel({ sbdDangXem, moHoSoEm, showToast: vi.fn(), setScreen: vi.fn() }),
}))
vi.mock('../src/lib/exam-db', () => ({ loadScriptUrl: async () => 'https://x', loadTeacherSecret: async () => 'mat' }))
vi.mock('../src/lib/exam-api', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  danhSachEm: async () => DS,
  hoSoEm: async () => HO_SO,
  deleteStudentRegistration: vi.fn(),
  // Khối "Mật khẩu mở app" trong màn Cài đặt đọc hai hàm này lúc dựng.
  loadKhoaApp: async () => null,
  saveKhoaApp: vi.fn(),
  goKhoaApp: vi.fn(),
  batKhoaApp: vi.fn(),
}))
vi.mock('../src/components/NutDongBoDanhSach', () => ({ default: () => null }))
vi.mock('../src/components/NutBaiTapPdf', () => ({ default: () => null }))
vi.mock('../src/components/PhieuZaloEm', () => ({ default: () => <div>KHOI PHIEU ZALO</div> }))
vi.mock('../src/components/KhoiTienBo', () => ({ default: () => <div>KHOI TIEN BO</div> }))

const { default: HocSinhScreen } = await import('../src/screens/HocSinhScreen')

beforeEach(() => {
  moHoSoEm.mockClear()
  sbdDangXem = ''
})

describe('danh sách học sinh — hai nút mỗi em', () => {
  it('mỗi em có nút Báo cáo và nút Lịch sử ca, nhãn trợ năng kèm TÊN em', async () => {
    const { getByLabelText, container } = render(<HocSinhScreen />)
    await waitFor(() => expect(container.textContent).toContain('Lê Minh Đức'))
    expect(getByLabelText('Báo cáo của Lê Minh Đức')).toBeTruthy()
    expect(getByLabelText('Lịch sử ca thi của Lê Minh Đức')).toBeTruthy()
    expect(getByLabelText('Báo cáo của Trần Thu Hà')).toBeTruthy()
    expect(getByLabelText('Lịch sử ca thi của Trần Thu Hà')).toBeTruthy()
  })

  it('nút Lịch sử ca nói luôn em đã làm mấy ca', async () => {
    const { getByLabelText, container } = render(<HocSinhScreen />)
    await waitFor(() => expect(container.textContent).toContain('Lê Minh Đức'))
    expect(getByLabelText('Lịch sử ca thi của Lê Minh Đức').textContent).toContain('(3)')
    expect(getByLabelText('Lịch sử ca thi của Trần Thu Hà').textContent).toContain('(0)')
  })

  it('bấm nút nào cũng mở hồ sơ ĐÚNG em đó', async () => {
    const { getByLabelText, container } = render(<HocSinhScreen />)
    await waitFor(() => expect(container.textContent).toContain('Trần Thu Hà'))
    fireEvent.click(getByLabelText('Lịch sử ca thi của Trần Thu Hà'))
    expect(moHoSoEm).toHaveBeenCalledWith('002')
  })

  it('chạm TÊN em cũng mở hồ sơ', async () => {
    const { getByText, container } = render(<HocSinhScreen />)
    await waitFor(() => expect(container.textContent).toContain('Lê Minh Đức'))
    fireEvent.click(getByText('Lê Minh Đức'))
    expect(moHoSoEm).toHaveBeenCalledWith('001')
  })

  it('KHÔNG có nút lồng trong nút — hàng em không còn là một nút lớn', async () => {
    const { container } = render(<HocSinhScreen />)
    await waitFor(() => expect(container.textContent).toContain('Lê Minh Đức'))
    for (const b of container.querySelectorAll('button')) {
      expect(b.querySelector('button')).toBeNull()
    }
  })

  it('vùng chạm của hai nút không dưới 44px', async () => {
    const { getByLabelText, container } = render(<HocSinhScreen />)
    await waitFor(() => expect(container.textContent).toContain('Lê Minh Đức'))
    for (const ten of ['Báo cáo của Lê Minh Đức', 'Lịch sử ca thi của Lê Minh Đức']) {
      expect((getByLabelText(ten) as HTMLElement).style.minHeight).toBe('44px')
    }
  })
})

describe('hồ sơ một em — hai mục tách hẳn', () => {
  it('vào từ nút Báo cáo: thấy tiến bộ và phiếu, KHÔNG đổ lịch sử ca vào cùng trang', async () => {
    const { getByLabelText, container, rerender } = render(<HocSinhScreen />)
    await waitFor(() => expect(container.textContent).toContain('Lê Minh Đức'))
    fireEvent.click(getByLabelText('Báo cáo của Lê Minh Đức'))
    sbdDangXem = '001'
    rerender(<HocSinhScreen />)
    await waitFor(() => expect(container.textContent).toContain('KHOI TIEN BO'))
    expect(container.textContent).toContain('KHOI PHIEU ZALO')
    expect(container.textContent).not.toContain('Ca Ester')
  })

  it('vào từ nút Lịch sử ca: thấy thẳng danh sách ca, không phải cuộn qua phiếu', async () => {
    const { getByLabelText, container, rerender } = render(<HocSinhScreen />)
    await waitFor(() => expect(container.textContent).toContain('Lê Minh Đức'))
    fireEvent.click(getByLabelText('Lịch sử ca thi của Lê Minh Đức'))
    sbdDangXem = '001'
    rerender(<HocSinhScreen />)
    await waitFor(() => expect(container.textContent).toContain('Ca Ester'))
    expect(container.textContent).toContain('Ca Amine')
    expect(container.textContent).not.toContain('KHOI PHIEU ZALO')
  })

  it('trong hồ sơ vẫn đổi qua lại được giữa hai mục', async () => {
    const { getByLabelText, getByRole, container, rerender } = render(<HocSinhScreen />)
    await waitFor(() => expect(container.textContent).toContain('Lê Minh Đức'))
    fireEvent.click(getByLabelText('Báo cáo của Lê Minh Đức'))
    sbdDangXem = '001'
    rerender(<HocSinhScreen />)
    await waitFor(() => expect(container.textContent).toContain('KHOI TIEN BO'))

    fireEvent.click(getByRole('tab', { name: /Lịch sử ca thi/ }))
    expect(container.textContent).toContain('Ca Ester')
    fireEvent.click(getByRole('tab', { name: /Báo cáo/ }))
    expect(container.textContent).toContain('KHOI TIEN BO')
  })

  it('mục đang xem được đánh dấu aria-selected, không chỉ đổi màu', async () => {
    const { getByLabelText, getAllByRole, container, rerender } = render(<HocSinhScreen />)
    await waitFor(() => expect(container.textContent).toContain('Lê Minh Đức'))
    fireEvent.click(getByLabelText('Lịch sử ca thi của Lê Minh Đức'))
    sbdDangXem = '001'
    rerender(<HocSinhScreen />)
    await waitFor(() => expect(container.textContent).toContain('Ca Ester'))
    const tab = getAllByRole('tab')
    expect(tab.filter((t) => t.getAttribute('aria-selected') === 'true')).toHaveLength(1)
    expect(tab.find((t) => t.getAttribute('aria-selected') === 'true')!.textContent).toContain('Lịch sử ca thi')
  })
})
