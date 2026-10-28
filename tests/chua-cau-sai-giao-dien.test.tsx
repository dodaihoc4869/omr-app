import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
const api = vi.hoisted(() => ({
  apiMoDot: vi.fn(),
  apiPhatItem: vi.fn(),
  apiNopItem: vi.fn(),
  apiXinGoiY: vi.fn(),
  apiCoChua: vi.fn(),
  // Chữa câu gọn (25/10): máy chủ CHƯA có lệnh gọn (mất nối / bản cũ) ⇒ màn đi lối cũ — tệp này kiểm lối lùi ấy.
  apiGonMo: vi.fn(async () => ({ ok: false, loi: 'Chưa nối được máy chủ.' })),
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
  // 12/10: trạng thái không còn bước (can_thay, da_tu_sua…) mở lối "Chữa trực tiếp câu gốc", lối này hỏi `/game-v2/hoa2-cau-chi-tiet`
  // ⇒ chặn mạng thật trong test: máy chủ giả trả không có câu (khối chữa trực tiếp hiện đường Hỏi thầy, không đáp án).
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, cau: [] }) })))
  api.apiMoDot.mockResolvedValue({ ok: true, dotId: 'D1' })
  api.apiPhatItem.mockResolvedValue(ph)
  api.apiCoChua.mockResolvedValue(false)
})
describe('Trải nghiệm sửa từng bước', () => {
  it('vòng tự chữa không có nút gửi riêng; bước cuối đã vào buổi chữa trên lớp', async () => {
    api.apiPhatItem.mockResolvedValue({
      ...ph,
      trangThai: 'can_thay',
      item: null,
    })
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    expect(
      await screen.findByText(
        /Bước còn mắc đã được xếp vào buổi chữa trên lớp/,
      ),
    ).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: /Nhờ thầy|Gửi thầy/ }),
    ).toBeNull()
  })
  it('mất mạng lúc mở đầu: TỰ thử lại (không khung lỗi) và bắt đầu đúng phiên', async () => {
    api.apiMoDot
      .mockResolvedValueOnce({ ok: false, loi: 'Chưa kết nối được' })
      .mockResolvedValueOnce({ ok: true, dotId: 'D1' })
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    // SỬA CÓ CHỦ Ý 28/10 (thầy «Bỏ màn chưa sửa được câu này đi»): không còn khung «Chưa mở được câu này» + «Thử lại» — màn tự thử lại.
    expect(await screen.findByLabelText('Câu trả lời của em', undefined, { timeout: 3000 })).toBeTruthy()
    expect(screen.queryByText('Chưa kết nối được')).toBeNull()
    expect(api.apiMoDot).toHaveBeenCalledTimes(2)
  })
  it('mất mạng mãi: thử lại 2 lần rồi sang câu kế, KHÔNG ghi xong phần (câu còn nợ)', async () => {
    api.apiMoDot.mockResolvedValue({ ok: false, loi: 'Chưa kết nối được' })
    const onTiep = vi.fn()
    render(<Man token="t" qid="Q" onVe={() => {}} onTiep={onTiep} />)
    await waitFor(() => expect(onTiep).toHaveBeenCalledTimes(1), { timeout: 4000 })
    expect(api.apiMoDot).toHaveBeenCalledTimes(3)
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
      screen.getByRole('button', { name: 'Tự thử lại' }),
    )
    expect(await screen.findByText('Em đang bỏ sót O và H.')).toBeTruthy()
    expect((input as HTMLInputElement).disabled).toBe(true)
    expect(api.apiPhatItem).toHaveBeenCalledTimes(1)
    fireEvent.click(
      screen.getByRole('button', { name: 'Tiếp tục' }), // SỬA CÓ CHỦ ĐÍCH 13/10 (đợt 18): nút gọn
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
      screen.getByRole('button', { name: 'Tự thử lại' }),
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
    fireEvent.click(screen.getByRole('button', { name: 'Cần gợi ý' }))
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
