import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, fireEvent, waitFor, act } from '@testing-library/react'
import type { CaTomTat } from '../src/lib/exam-api'

const danhSachCa = vi.fn()
const xoaVinhVienCa = vi.fn()
const showToast = vi.fn()

vi.mock('../src/lib/exam-api', () => ({
  danhSachCa: (...a: unknown[]) => danhSachCa(...a),
  khoiPhucCa: vi.fn(),
  xoaNhieuCa: vi.fn(),
  xoaVinhVienCa: (...a: unknown[]) => xoaVinhVienCa(...a),
}))
vi.mock('../src/lib/exam-db', () => ({
  loadScriptUrl: async () => 'https://gia/exec',
  loadTeacherSecret: async () => 'mat',
  loadKhoaApp: async () => null,
  saveKhoaApp: vi.fn(),
  goKhoaApp: vi.fn(),
  batKhoaApp: vi.fn(),
}))
vi.mock('../src/lib/gio-may-chu', () => ({ gioMayChu: () => new Date('2026-09-02T15:00:00Z').getTime() }))
vi.mock('../src/store/appStore', () => ({
  useAppStore: (sel: (s: Record<string, unknown>) => unknown) => sel({ setScreen: vi.fn(), moChiTietCa: vi.fn(), showToast }),
}))

const { default: LichSuCaScreen } = await import('../src/screens/LichSuCaScreen')

const caDaXoa = (maCa: string, tenCa: string): CaTomTat => ({
  maCa,
  tenCa,
  lop: '12',
  thoiGianPhut: 45,
  moLuc: '2026-09-02T14:00:00Z',
  batDau: '2026-09-02T14:00:00Z',
  hetHanVao: '2026-09-02T16:00:00Z',
  trangThai: 'da_xoa',
  daVao: 1,
  daNop: 1,
  canhBao: 0,
})

beforeEach(() => {
  danhSachCa.mockReset()
  xoaVinhVienCa.mockReset()
  showToast.mockReset()
  xoaVinhVienCa.mockResolvedValue({ ok: true, daXoa: [] })
})

describe('Ca đã xoá — Xoá vĩnh viễn', () => {
  it('hiện nút Xoá vĩnh viễn cho từng ca trong màn Ca đã xoá', async () => {
    danhSachCa.mockResolvedValue([caDaXoa('895244', 'Test7'), caDaXoa('720466', 'Test6')])
    const r = render(<LichSuCaScreen />)

    // Bấm xem ca đã xoá
    fireEvent.click(r.getByLabelText('Xem ca đã xoá'))

    await waitFor(() => expect(r.getByText('Ca đã xoá')).toBeTruthy())
    expect(r.getAllByText('Xoá vĩnh viễn').length).toBeGreaterThanOrEqual(2)
  })

  it('bấm Xoá vĩnh viễn một ca mở modal cảnh báo và gọi xoaVinhVienCa khi xác nhận', async () => {
    danhSachCa.mockResolvedValue([caDaXoa('895244', 'Test7')])
    const r = render(<LichSuCaScreen />)

    fireEvent.click(r.getByLabelText('Xem ca đã xoá'))
    await waitFor(() => expect(r.getByText('Test7')).toBeTruthy())

    const nutXoa = r.getAllByRole('button', { name: /^Xoá vĩnh viễn$/ })[0]
    await act(async () => {
      fireEvent.click(nutXoa)
    })

    expect(r.getByText(/KHÔNG THỂ HOÀN TÁC/)).toBeTruthy()
    expect(r.getByText('Xoá vĩnh viễn 1 ca?')).toBeTruthy()

    const nutXacNhan = r.getByRole('button', { name: 'Xoá vĩnh viễn 1 ca' })
    await act(async () => {
      fireEvent.click(nutXacNhan)
    })

    expect(xoaVinhVienCa).toHaveBeenCalledWith('https://gia/exec', 'mat', ['895244'])
  })

  it('nút Xoá vĩnh viễn tất cả khi có nhiều ca đã xoá', async () => {
    danhSachCa.mockResolvedValue([caDaXoa('895244', 'Test7'), caDaXoa('720466', 'Test6')])
    const r = render(<LichSuCaScreen />)

    fireEvent.click(r.getByLabelText('Xem ca đã xoá'))
    await waitFor(() => expect(r.getByText('Test7')).toBeTruthy())

    const nutXoaTatCa = r.getByText('Xoá vĩnh viễn tất cả (2 ca)')
    await act(async () => {
      fireEvent.click(nutXoaTatCa)
    })

    expect(r.getByText('Xoá vĩnh viễn 2 ca?')).toBeTruthy()
    const nutXacNhan = r.getByRole('button', { name: 'Xoá vĩnh viễn 2 ca' })
    await act(async () => {
      fireEvent.click(nutXacNhan)
    })

    expect(xoaVinhVienCa).toHaveBeenCalledWith('https://gia/exec', 'mat', ['895244', '720466'])
  })
})
