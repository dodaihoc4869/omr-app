// G4b · Màn "Ca thi" (danh sách ca) của thầy mặc Material 3 (21/09). Đổi phần NHÌN: lớp Tailwind màu rời + mã hex → lớp ngữ nghĩa (lich-su-ca-m3.css).
// Chức năng giữ nguyên (tìm, lọc lớp, chọn để xoá, ca đã xoá, mở chi tiết); công cụ "Đồng bộ lại phiếu mọi ca" xuống CUỐI trang.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import type { CaTomTat } from '../src/lib/exam-api'

const m = vi.hoisted(() => ({ danhSachCa: vi.fn(), moChiTietCa: vi.fn() }))
vi.mock('../src/lib/exam-api', () => ({
  danhSachCa: (...a: unknown[]) => m.danhSachCa(...a),
  xoaNhieuCa: vi.fn(),
  khoiPhucCa: vi.fn(),
  xoaVinhVienCa: vi.fn(),
}))
vi.mock('../src/lib/exam-db', () => ({
  loadScriptUrl: async () => 'https://gia/exec',
  loadTeacherSecret: async () => 'mat',
  loadKhoaApp: async () => null,
  saveKhoaApp: vi.fn(),
  goKhoaApp: vi.fn(),
  batKhoaApp: vi.fn(),
}))
vi.mock('../src/lib/gio-may-chu', () => ({ gioMayChu: () => new Date('2026-09-21T01:00:00Z').getTime() }))
vi.mock('../src/store/appStore', () => ({
  useAppStore: (sel: (s: Record<string, unknown>) => unknown) => sel({ setScreen: vi.fn(), moChiTietCa: m.moChiTietCa, showToast: vi.fn() }),
}))
const { default: LichSuCaScreen } = await import('../src/screens/LichSuCaScreen')

const ca = (maCa: string, lop: string, o: Partial<CaTomTat> = {}): CaTomTat => ({
  maCa,
  tenCa: `Ca ${maCa}`,
  lop,
  thoiGianPhut: 50,
  moLuc: '2026-09-21T00:00:00Z',
  batDau: '2026-09-21T00:00:00Z',
  hetHanVao: '2026-09-21T02:00:00Z',
  trangThai: 'mo',
  daVao: 8,
  daNop: 2,
  canhBao: 1,
  ...o,
})

beforeEach(() => {
  m.danhSachCa.mockResolvedValue([ca('111111', '12A1'), ca('222222', '12A2', { canhBao: 0 }), ca('333333', '12A1', { trangThai: 'dong' })])
})
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('LichSuCaScreen · giao diện M3', () => {
  it('thẻ ca dùng lớp ngữ nghĩa: mã ca, tên, lớp, đã nộp/đã vào, trạng thái, cảnh báo rời màn', async () => {
    const { container } = render(<LichSuCaScreen />)
    await waitFor(() => expect(container.querySelectorAll('.ls-ca')).toHaveLength(3))
    const the = container.querySelector('.ls-ca') as HTMLElement
    expect(the.querySelector('.ls-ca-ma')?.textContent).toBe('#111111')
    expect(the.querySelector('.ls-ca-ten')?.textContent).toBe('Ca 111111')
    expect(the.querySelector('.ls-ca-lop')?.textContent).toBe('Lớp 12A1')
    expect(the.querySelector('.ls-ca-nop')?.textContent).toBe('2/8 nộp')
    expect(the.textContent).toContain('1 cảnh báo rời màn')
    expect(the.getAttribute('data-trang-thai')).toBeTruthy()
    expect(container.querySelector('.ls-thu-muc-luoi .ls-thu-muc .ls-thu-muc-than')).toBeTruthy()
  })

  it('bộ lọc lớp và ô tìm vẫn lọc đúng; chip đang chọn đánh dấu ls-chip--chon', async () => {
    const { container } = render(<LichSuCaScreen />)
    await waitFor(() => expect(container.querySelectorAll('.ls-ca')).toHaveLength(3))
    fireEvent.click(screen.getByRole('button', { name: '12A2' }))
    expect(container.querySelectorAll('.ls-ca')).toHaveLength(1)
    expect(screen.getByRole('button', { name: '12A2' }).className).toContain('ls-chip--chon')
    fireEvent.click(screen.getByRole('button', { name: 'Tất cả' }))
    fireEvent.change(screen.getByLabelText('Tìm ca'), { target: { value: '333' } })
    expect(container.querySelectorAll('.ls-ca')).toHaveLength(1)
  })

  it('bấm thẻ ca mở chi tiết ca (đúng mã)', async () => {
    const { container } = render(<LichSuCaScreen />)
    await waitFor(() => expect(container.querySelectorAll('.ls-ca')).toHaveLength(3))
    fireEvent.click(container.querySelector('.ls-ca') as HTMLElement)
    expect(m.moChiTietCa).toHaveBeenCalledWith('111111')
  })

  it('chế độ chọn để xoá: thẻ ca được chọn có ls-ca--chon, nút chế độ có ls-nut-tron--bat', async () => {
    const { container } = render(<LichSuCaScreen />)
    await waitFor(() => expect(container.querySelectorAll('.ls-ca')).toHaveLength(3))
    fireEvent.click(screen.getByRole('button', { name: 'Chọn ca để xoá' }))
    expect(screen.getByRole('button', { name: 'Thoát chế độ chọn' }).className).toContain('ls-nut-tron--bat')
    fireEvent.click(container.querySelector('.ls-ca') as HTMLElement)
    expect(container.querySelector('.ls-ca--chon')).toBeTruthy()
  })

  it('công cụ "Đồng bộ lại phiếu mọi ca" nằm SAU danh sách ca, còn nguyên nút; ẩn khi chọn/xem ca đã xoá (như cũ)', async () => {
    const { container } = render(<LichSuCaScreen />)
    await waitFor(() => expect(container.querySelectorAll('.ls-ca')).toHaveLength(3))
    const nut = screen.getByRole('button', { name: 'Đồng bộ lại phiếu mọi ca' })
    const the = container.querySelector('.ls-ca') as HTMLElement
    expect(the.compareDocumentPosition(nut) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Chọn ca để xoá' }))
    expect(screen.queryByRole('button', { name: 'Đồng bộ lại phiếu mọi ca' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Thoát chế độ chọn' }))
    fireEvent.click(screen.getByRole('button', { name: 'Xem ca đã xoá' }))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Đồng bộ lại phiếu mọi ca' })).toBeNull())
  })

  it('không còn ca nào: câu trống + nút mở ca đầu tiên vẫn có', async () => {
    m.danhSachCa.mockResolvedValue([])
    render(<LichSuCaScreen />)
    expect(await screen.findByText('Chưa có ca nào.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Mở ca kiểm tra đầu tiên' })).toBeTruthy()
  })
})

describe('nguồn: hết mã hex + lớp Tailwind màu rời trong màn Ca thi', () => {
  const src = fs.readFileSync(path.join(process.cwd(), 'src/screens/LichSuCaScreen.tsx'), 'utf8')
  const css = fs.readFileSync(path.join(process.cwd(), 'src/screens/lich-su-ca-m3.css'), 'utf8')
  it('LichSuCaScreen.tsx: không hex, không bg-/text-/border- theo dải màu Tailwind', () => {
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(src).not.toMatch(/\b(?:bg|text|border|from|via|to|ring)-(?:slate|blue|indigo|emerald|rose|amber)-\d{2,3}/)
    expect(src).toContain("import './lich-su-ca-m3.css'")
  })
  it('lich-su-ca-m3.css: chỉ token, không hex, không !important', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(css).not.toContain('!important')
    expect(css).toContain('var(--m3-primary)')
  })
})
