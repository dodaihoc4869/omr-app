import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
const api = vi.hoisted(() => ({ apiDanhSachTuChua: vi.fn() }))
vi.mock('../src/lib/chua-cau-sai-api', () => api)
vi.mock('../src/components/hoa2/api', () => ({ taiCauDaLam: async () => ({ cheDo2: false }), NHAN_NGUON_LAN: {} }))
import ManTuChua from '../src/components/hoc-tap/ManTuChua'
import { docNhoTuSua, soCauCanSua, xoaNhoTuSua } from '../src/lib/tu-sua-loi'
const dem = { can: 102, cho: 1, xong: 1, tong: 104 }
const sau = { hang: 1, giaoLuc: 100, dotId: 'D99', nay: '2026-10-16T10:00:00.000Z' }
const ds = Array.from({ length: 100 }, (_, i) => ({ dotId: `D${i}`, qid: `Q${i}`, trangThai: 'can_thay' }))
beforeEach(() => { xoaNhoTuSua(); api.apiDanhSachTuChua.mockReset() })
afterEach(() => cleanup())
describe('Tự sửa lỗi · mở thêm danh sách tại chỗ', () => {
  it('thẻ tổng dùng tổng thật dù chỉ tải 100; Xem tiếp gộp không trùng, cache Hôm nay nhận cùng tổng, không tải lại trang đầu', async () => {
    api.apiDanhSachTuChua.mockResolvedValueOnce({ trangThai: 'bat', ds, dem, sau })
      .mockResolvedValueOnce({ trangThai: 'bat', ds: [ds[99], { dotId: 'D100', qid: 'Q100', trangThai: 'can_thay' }, { dotId: 'D101', qid: 'Q101', trangThai: 'can_thay' }, { dotId: 'D102', qid: 'Q102', trangThai: 'cho_gap_lai_2', denHan: '9999-12-31' }, { dotId: 'D103', qid: 'Q103', trangThai: 'da_tu_sua' }], dem })
    const { container } = render(<ManTuChua token="token" onVe={() => {}} />)
    await screen.findByRole('button', { name: 'Xem tiếp các câu' })
    expect(container.querySelector('.tcl-so')?.textContent).toBe('102câu cần sửa')
    expect(screen.getByText('Đã tải 100/104 câu trong danh sách.')).toBeTruthy()
    expect(api.apiDanhSachTuChua).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Xem tiếp các câu' }))
    await screen.findByRole('region', { name: 'Đã tự sửa: 1 câu' })
    expect(container.querySelectorAll('[data-khoa]')).toHaveLength(104)
    expect(container.querySelector('.tcl-so')?.textContent).toBe('102câu cần sửa')
    expect(api.apiDanhSachTuChua).toHaveBeenNthCalledWith(2, 'token', sau)
    expect(screen.queryByRole('button', { name: 'Xem tiếp các câu' })).toBeNull()
    expect(soCauCanSua(docNhoTuSua('token'), Date.now())).toBe(102)
    expect(screen.getByRole('heading', { name: 'Sửa lại câu em làm sai' })).toBeTruthy()
  })
  it('trang sau lỗi giữ nguyên câu đang xem và thử tiếp đúng cursor', async () => {
    api.apiDanhSachTuChua.mockResolvedValueOnce({ trangThai: 'bat', ds, dem, sau })
      .mockResolvedValueOnce({ trangThai: 'loi', loi: 'Mạng đang chậm.' })
      .mockResolvedValueOnce({ trangThai: 'bat', ds: [{ dotId: 'D100', qid: 'Q100', trangThai: 'can_thay' }], dem })
    const { container } = render(<ManTuChua token="token" onVe={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Xem tiếp các câu' }))
    expect((await screen.findByRole('alert')).textContent).toBe('Mạng đang chậm.')
    expect(container.querySelectorAll('[data-khoa]')).toHaveLength(100)
    fireEvent.click(screen.getByRole('button', { name: 'Xem tiếp các câu' }))
    await waitFor(() => expect(container.querySelectorAll('[data-khoa]')).toHaveLength(101))
    expect(api.apiDanhSachTuChua).toHaveBeenNthCalledWith(3, 'token', sau)
  })
})
