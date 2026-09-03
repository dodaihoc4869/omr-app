// Màn Ca thi — chế độ tích chọn để xoá nhiều ca.
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, fireEvent, waitFor, act } from '@testing-library/react'
import type { CaTomTat } from '../src/lib/exam-api'

const danhSachCa = vi.fn()
const xoaNhieuCa = vi.fn()
const showToast = vi.fn()

vi.mock('../src/lib/exam-api', () => ({
  danhSachCa: (...a: unknown[]) => danhSachCa(...a),
  xoaNhieuCa: (...a: unknown[]) => xoaNhieuCa(...a),
}))
vi.mock('../src/lib/exam-db', () => ({
  loadScriptUrl: async () => 'https://gia/exec',
  loadTeacherSecret: async () => 'mat',
}))
vi.mock('../src/lib/gio-may-chu', () => ({ gioMayChu: () => new Date('2026-09-02T15:00:00Z').getTime() }))
vi.mock('../src/store/appStore', () => ({
  useAppStore: (sel: (s: Record<string, unknown>) => unknown) => sel({ setScreen: vi.fn(), moChiTietCa: vi.fn(), showToast }),
}))

const { default: LichSuCaScreen } = await import('../src/screens/LichSuCaScreen')

const ca = (maCa: string, lop: string, daVao: number): CaTomTat => ({
  maCa,
  tenCa: `Ca ${maCa}`,
  lop,
  thoiGianPhut: 45,
  moLuc: '2026-09-02T14:00:00Z',
  batDau: '2026-09-02T14:00:00Z',
  hetHanVao: '2026-09-02T16:00:00Z',
  trangThai: 'mo',
  daVao,
  daNop: 0,
  canhBao: 0,
})

async function moMan(ds: CaTomTat[]) {
  danhSachCa.mockResolvedValue(ds)
  const r = render(<LichSuCaScreen />)
  await waitFor(() => expect(r.getByText('Ca 111111')).toBeTruthy())
  fireEvent.click(r.getByLabelText('Chọn ca để xoá'))
  return r
}

beforeEach(() => {
  danhSachCa.mockReset()
  xoaNhieuCa.mockReset()
  showToast.mockReset()
  xoaNhieuCa.mockResolvedValue({ ok: [], loi: [] })
})

describe('Ca thi — tích chọn xoá', () => {
  it('chọn tất cả rồi xoá: gửi đúng danh sách mã ca đang hiện', async () => {
    const r = await moMan([ca('111111', '12', 0), ca('222222', '2', 0)])
    fireEvent.click(r.getByText('Chọn tất cả (2)'))
    expect(r.getByText('Đã chọn 2')).toBeTruthy()
    await act(async () => {
      fireEvent.click(r.getByText('Xoá 2'))
    })
    await act(async () => {
      fireEvent.click(r.getByText('Xoá 2 ca'))
    })
    expect(xoaNhieuCa).toHaveBeenCalledWith('https://gia/exec', 'mat', ['111111', '222222'])
  })

  it('tích từng ca: chỉ xoá ca đã tích', async () => {
    const r = await moMan([ca('111111', '12', 0), ca('222222', '2', 0)])
    fireEvent.click(r.getByText('Ca 222222'))
    expect(r.getByText('Đã chọn 1')).toBeTruthy()
    await act(async () => {
      fireEvent.click(r.getByText('Xoá 1'))
    })
    await act(async () => {
      fireEvent.click(r.getByText('Xoá 1 ca'))
    })
    expect(xoaNhieuCa).toHaveBeenCalledWith('https://gia/exec', 'mat', ['222222'])
  })

  // Thầy bỏ bước gõ "XOA": xoá ngay sau khi bấm, không gõ gì thêm. Hộp xác
  // nhận vẫn còn — nó liệt kê đúng ca nào và bao nhiêu bài làm sẽ mất.
  it('ca đã có em vào làm: xoá được ngay, KHÔNG bắt gõ chữ xác nhận', async () => {
    const r = await moMan([ca('111111', '12', 3)])
    fireEvent.click(r.getByText('Ca 111111'))
    await act(async () => {
      fireEvent.click(r.getByText('Xoá 1'))
    })
    expect((r.getByText('Xoá 1 ca') as HTMLButtonElement).disabled).toBe(false)
    expect(r.queryByLabelText('Gõ XOA để xác nhận xoá')).toBeNull()
    // Hộp xác nhận vẫn phải nói rõ mất bao nhiêu bài làm.
    expect(r.getByText(/xoá rồi không khôi phục được/)).toBeTruthy()
    await act(async () => {
      fireEvent.click(r.getByText('Xoá 1 ca'))
    })
    expect(xoaNhieuCa).toHaveBeenCalledWith('https://gia/exec', 'mat', ['111111'])
  })

  it('bộ lọc lớp đang bật: "Chọn tất cả" không đụng ca của lớp khác', async () => {
    const r = await moMan([ca('111111', '12', 0), ca('222222', '2', 0)])
    fireEvent.click(r.getByText('2'))
    fireEvent.click(r.getByText('Chọn tất cả (1)'))
    await act(async () => {
      fireEvent.click(r.getByText('Xoá 1'))
    })
    await act(async () => {
      fireEvent.click(r.getByText('Xoá 1 ca'))
    })
    expect(xoaNhieuCa).toHaveBeenCalledWith('https://gia/exec', 'mat', ['222222'])
  })
})
