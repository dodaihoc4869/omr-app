// TỰ CHỮA LỖI · DANH SÁCH (12/10) — thầy: "mục chữa lỗi hiển thị cho thật chuẩn để học sinh chữa lỗi được". Khoá:
//   · mỗi câu có TÊN (dạng bài lấy từ "Câu đã làm", dự phòng "Câu sai số N") + phần + lần sai gần nhất (tên nguồn chuẩn, không tên game)
//     và TRẠNG THÁI bằng chữ (không mã nội bộ); nhóm Cần chữa / Đang chờ lần gặp lại / Đã tự sửa;
//   · lỗi tải ⇒ nói lý do + nút Thử lại (gọi lại máy chủ); rỗng ⇒ nói vì sao + việc tiếp (Về Hôm nay, Luyện thêm ở Tu luyện);
//   · chọn một câu ⇒ màn chữa đúng câu, kèm tên; quay ra ⇒ về danh sách và tải lại.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

const api = vi.hoisted(() => ({ apiDanhSachTuChua: vi.fn() }))
vi.mock('../src/lib/chua-cau-sai-api', () => api)
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }), xongNapDiaChi: async () => {} }))
vi.mock('../src/components/chua-cau-sai/ManChuaCauSai', () => ({
  default: ({ qid, tenCau, onVe }: { qid: string; tenCau?: string; onVe: () => void }) => (
    <div>
      <p>Đang chữa {qid} · {tenCau}</p>
      <button type="button" onClick={onVe}>Ra danh sách</button>
    </div>
  ),
}))

import ManTuChua from '../src/components/hoc-tap/ManTuChua'

const CDL = {
  ok: true,
  cheDo2: true,
  chienDich: [{ id: 'cd1', ten: 'Hành trình', hanNop: '9999-12-31', tong: 3 }],
  cau: [
    { qid: 'Q1', chienDichId: 'cd1', stt: 3, phan: 'I', mucDo: 'hieu', tenDang: 'Thuỷ phân ester', trangThai: 'dang_on', lanCuoiDung: false, henOn: null, lichSu: [{ ngay: '2026-10-08', dung: false, coGoiY: false, nguon: 'dao' }, { ngay: '2026-10-10', dung: false, coGoiY: false, nguon: 'doan' }] },
    { qid: 'Q2', chienDichId: 'cd1', stt: 5, phan: 'III', mucDo: 'VD', tenDang: 'Chất béo', trangThai: 'dang_on', lanCuoiDung: false, henOn: null, lichSu: [{ ngay: '2026-10-09', dung: false, coGoiY: false, nguon: 'bia' }] },
  ],
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const u = new URL(String(url)).pathname
    return { ok: true, status: 200, json: async () => (u.endsWith('/hoa2-cau-da-lam') ? CDL : { ok: true }) }
  }))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

// SỬA CÓ CHỦ ĐÍCH 13/10 (đợt 18 — thầy: "tự sửa lỗi", "Tối ưu lại câu từ cho dễ hiểu"): chữ "chữa" của em ⇒ "sửa" (thầy CHỮA trên lớp, em SỬA):
// "Sửa trên câu gốc", "Đang sửa từng bước", nhóm "Cần sửa", "Em không còn câu nào cần sửa". Hành vi không đổi.
describe('Danh sách câu cần chữa', () => {
  it('tên câu + phần + lần sai gần nhất (tên nguồn chuẩn) + trạng thái bằng chữ; nhóm theo việc', async () => {
    const den = new Date(Date.now() + 26 * 3600000).toISOString()
    api.apiDanhSachTuChua.mockResolvedValue({ trangThai: 'bat', ds: [
      { qid: 'Q1', trangThai: 'thieu_hoc_lieu' },
      { qid: 'Q2', trangThai: 'cho_gap_lai_2', denHan: den },
      { qid: 'Q9', trangThai: 'dang_chua_buoc' },
      { qid: 'Q3', trangThai: 'da_tu_sua' },
    ] })
    render(<ManTuChua token="t" onVe={() => {}} />)
    const dong1 = await screen.findByRole('button', { name: /Thuỷ phân ester/ })
    expect(dong1.textContent).toContain('Trắc nghiệm · sai lần gần nhất 10/10 · Ôn theo kế hoạch')
    expect(dong1.textContent).toContain('Sửa trên câu gốc')
    const dong2 = screen.getByRole('button', { name: /Chất béo/ })
    expect(dong2.textContent).toContain('Trả lời ngắn · sai lần gần nhất 09/10 · Luyện tập trước đây')
    expect(dong2.textContent).toMatch(/Lần gặp lại 2 mở lúc \d{2}:\d{2} · (Thứ (Hai|Ba|Tư|Năm|Sáu|Bảy)|Chủ nhật) \d{2}\/\d{2}\/\d{4}/)
    expect(screen.getByRole('button', { name: /Câu sai số 3/ }).textContent).toContain('Đang sửa từng bước')
    expect(screen.getByRole('button', { name: /Câu sai số 4/ }).textContent).toContain('Đã tự sửa')
    expect(screen.getByRole('region', { name: 'Cần sửa: 2 câu' })).toBeTruthy()
    expect(screen.getByRole('region', { name: 'Đang chờ lần gặp lại: 1 câu' })).toBeTruthy()
    expect(screen.getByRole('region', { name: 'Đã tự sửa: 1 câu' })).toBeTruthy()
    // không mã nội bộ, không tên game, không chữ mơ hồ cũ
    const chu = document.body.textContent ?? ''
    expect(chu).not.toMatch(/thieu_hoc_lieu|cho_gap_lai_2|Bát Linh|Đoàn Hộ|Bi-a|Câu cần xem lại/)
    // chọn câu ⇒ màn chữa đúng câu, có tên; quay ra ⇒ danh sách tải lại
    fireEvent.click(dong1)
    expect(await screen.findByText('Đang chữa Q1 · Thuỷ phân ester')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Ra danh sách' }))
    await waitFor(() => expect(api.apiDanhSachTuChua).toHaveBeenCalledTimes(2))
    expect(await screen.findByRole('button', { name: /Thuỷ phân ester/ })).toBeTruthy()
  })

  it('lỗi tải ⇒ lý do + Thử lại gọi lại máy chủ', async () => {
    api.apiDanhSachTuChua
      .mockResolvedValueOnce({ trangThai: 'loi', loi: 'Chưa nối được máy chủ. Em kiểm tra mạng rồi thử lại.' })
      .mockResolvedValueOnce({ trangThai: 'bat', ds: [{ qid: 'Q1', trangThai: 'can_chan_doan' }] })
    render(<ManTuChua token="t" onVe={() => {}} />)
    expect((await screen.findByRole('alert')).textContent).toContain('Chưa nối được máy chủ')
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByRole('button', { name: /Thuỷ phân ester/ })).toBeTruthy()
    expect(api.apiDanhSachTuChua).toHaveBeenCalledTimes(2)
  })

  it('rỗng ⇒ nói vì sao + việc tiếp', async () => {
    api.apiDanhSachTuChua.mockResolvedValue({ trangThai: 'bat', ds: [] })
    const veHomNay = vi.fn(), tuLuyen = vi.fn()
    render(<ManTuChua token="t" onVe={veHomNay} onTuLuyen={tuLuyen} />)
    expect(await screen.findByRole('heading', { name: 'Em không còn câu nào cần sửa' })).toBeTruthy()
    expect(screen.getByText(/Câu em làm sai sẽ tự vào đây/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Luyện thêm ở Tu luyện' }))
    expect(tuLuyen).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Về Hôm nay' }))
    expect(veHomNay).toHaveBeenCalled()
  })

  it('mở thẳng một câu (từ màn làm câu) ⇒ vào màn chữa ngay; quay ra là danh sách', async () => {
    api.apiDanhSachTuChua.mockResolvedValue({ trangThai: 'bat', ds: [{ qid: 'Q2', trangThai: 'dang_chua_buoc' }] })
    render(<ManTuChua token="t" qid="Q2" onVe={() => {}} />)
    expect(await screen.findByText(/Đang chữa Q2/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Ra danh sách' }))
    expect(await screen.findByRole('button', { name: /Chất béo/ })).toBeTruthy()
  })
})
