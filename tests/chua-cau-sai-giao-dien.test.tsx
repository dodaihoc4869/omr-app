import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
const api = vi.hoisted(() => ({
  apiMoDot: vi.fn(),
  apiPhatItem: vi.fn(),
  apiNopItem: vi.fn(),
  apiXinGoiY: vi.fn(),
  apiGuiThay: vi.fn(),
  apiCoChua: vi.fn(),
}))
vi.mock('../src/lib/chua-cau-sai-api', () => api)
import Man from '../src/components/chua-cau-sai/ManChuaCauSai'
const item = {
  id: 'I1',
  loai: 'chan_doan',
  tieuDe: 'Khối lượng mol',
  kieu: 'so',
  hoi: 'Tính M(NaOH).',
  luaChon: null,
  donVi: 'g/mol',
}
const ph = {
  ok: true,
  dotId: 'D1',
  trangThai: 'can_chan_doan',
  item,
  tienDo: { soBuocDaQua: 0, soBuocCanKiem: 1 },
  tienDoChiTiet: [
    { buocId: 'm', tieuDe: 'Khối lượng mol', trangThai: 'chua_kiem' },
  ],
}
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  api.apiMoDot.mockResolvedValue({ ok: true, dotId: 'D1' })
  api.apiPhatItem.mockResolvedValue(ph)
  api.apiCoChua.mockResolvedValue(false)
})
describe('Trải nghiệm sửa từng bước', () => {
  it('mất mạng lúc mở đầu có thể tải lại và bắt đầu đúng phiên', async () => {
    api.apiMoDot
      .mockResolvedValueOnce({ ok: false, loi: 'Chưa kết nối được' })
      .mockResolvedValueOnce({ ok: true, dotId: 'D1' })
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    await screen.findByText('Chưa kết nối được')
    fireEvent.click(screen.getByRole('button', { name: 'Tải lại tiến độ' }))
    expect(await screen.findByLabelText('Câu trả lời của em')).toBeTruthy()
    expect(api.apiMoDot).toHaveBeenCalledTimes(2)
  })
  it('phản hồi sai được giữ cho em đọc; khoá đáp án đầu và chỉ chuyển khi em bấm', async () => {
    api.apiNopItem.mockResolvedValue({
      ok: true,
      dung: false,
      diemlech: 'Em đang bỏ sót O và H.',
    })
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    const input = await screen.findByLabelText('Câu trả lời của em')
    fireEvent.change(input, { target: { value: '23' } })
    fireEvent.click(
      screen.getByRole('button', { name: 'Kiểm tra cách em làm' }),
    )
    expect(await screen.findByText('Em đang bỏ sót O và H.')).toBeTruthy()
    expect((input as HTMLInputElement).disabled).toBe(true)
    expect(api.apiPhatItem).toHaveBeenCalledTimes(1)
    fireEvent.click(
      screen.getByRole('button', { name: 'Em sẵn sàng · Tiếp tục' }),
    )
    await waitFor(() => expect(api.apiPhatItem).toHaveBeenCalledTimes(2))
  })
  it('mất mạng giữ payload và attempt; bấm gửi lại không đổi đáp án', async () => {
    api.apiNopItem
      .mockResolvedValueOnce({ ok: false, loi: 'Mất mạng' })
      .mockResolvedValueOnce({ ok: true, dung: true })
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    const input = await screen.findByLabelText('Câu trả lời của em')
    fireEvent.change(input, { target: { value: '40' } })
    fireEvent.click(
      screen.getByRole('button', { name: 'Kiểm tra cách em làm' }),
    )
    expect(await screen.findByText('Mất mạng')).toBeTruthy()
    expect((input as HTMLInputElement).disabled).toBe(true)
    fireEvent.click(
      screen.getByRole('button', { name: 'Gửi lại câu trả lời đã giữ' }),
    )
    await screen.findByText('Bước này em làm được rồi')
    expect(api.apiNopItem.mock.calls[0]).toEqual(api.apiNopItem.mock.calls[1])
  })
  it('lý do có lựa chọn dùng radio; gợi ý được đọc bằng ChemText', async () => {
    api.apiPhatItem.mockResolvedValue({
      ...ph,
      item: {
        ...item,
        kieu: 'chon_ly_do',
        luaChon: [
          { ky: 'A', noi: 'Chỉ tính Na' },
          { ky: 'B', noi: 'Cộng đủ nguyên tử' },
        ],
      },
    })
    api.apiXinGoiY.mockResolvedValue({
      ok: true,
      mucHoTro: 1,
      noiDungGoiY: 'Xét đủ O và H.',
    })
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    expect(
      await screen.findByRole('radio', { name: /Cộng đủ nguyên tử/ }),
    ).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Gợi mở cho em' }))
    expect(await screen.findByText('Xét đủ O và H.')).toBeTruthy()
  })
  it('tự làm được bản mới chưa bị gọi nhầm là đóng lỗi', async () => {
    api.apiPhatItem.mockResolvedValue({
      ...ph,
      item: null,
      trangThai: 'da_tu_sua',
      lanGapLai: 2,
    })
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    expect(await screen.findByText('Em đã tự làm được bản mới')).toBeTruthy()
    expect(screen.queryByText(/lỗi này đã được đóng/)).toBeNull()
  })
})
