// 24/10 (em SBD 10044 «Vẫn lỗi»): máy chủ trả «chưa có lỗi đang mở» KÈM mã đợt (sổ học đã đóng lỗi, đợt vừa được đóng) ⇒ màn chữa tính xong phần
// hôm nay và báo «Câu này không cần sửa nữa» (không còn khung «Chưa mở được câu này» làm kẹt chặng). Không kèm mã đợt ⇒ khung lỗi cũ y nguyên.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'

const api = vi.hoisted(() => ({
  apiMoDot: vi.fn(),
  apiPhatItem: vi.fn(),
  apiNopItem: vi.fn(),
  apiXinGoiY: vi.fn(),
  apiCoChua: vi.fn(),
}))
const ghi = vi.hoisted(() => vi.fn())
vi.mock('../src/lib/chua-cau-sai-api', () => api)
vi.mock('../src/lib/tu-sua-viec-hom-nay', () => ({ ghiXongHomNay: ghi, docSbdHs: () => '11010' }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }), xongNapDiaChi: async () => {} }))

import Man from '../src/components/chua-cau-sai/ManChuaCauSai'

beforeEach(() => { vi.clearAllMocks() })
afterEach(cleanup)

describe('Sổ học đã đóng lỗi, hàng đợt vừa đóng', () => {
  it('«chưa có lỗi đang mở» kèm mã đợt ⇒ ghi xong phần hôm nay + màn «sửa xong rồi», không khung lỗi', async () => {
    api.apiMoDot.mockResolvedValue({ ok: false, loi: 'Câu này chưa có lỗi đang mở đã công bố.', ma: 'CHUA_CO_LOI', dotId: 'D9', daDong: true })
    const onVe = vi.fn()
    render(<Man token="t" qid="Q" tenCau="Cấu trúc bảng tuần hoàn" onVe={onVe} />)
    expect(await screen.findByRole('heading', { name: 'Câu này không cần sửa nữa' })).toBeTruthy()
    expect(ghi).toHaveBeenCalledWith('D9')
    expect(screen.queryByRole('heading', { name: 'Chưa mở được câu này' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Thử lại' })).toBeNull()
    screen.getByRole('button', { name: 'Sang câu khác' }).click()
    expect(onVe).toHaveBeenCalled()
  })
  it('sổ chưa thấy lần sai nào (daDong = false) ⇒ vẫn tính xong phần, chữ không khẳng định em đã làm đúng', async () => {
    api.apiMoDot.mockResolvedValue({ ok: false, loi: 'Câu này chưa có lỗi đang mở đã công bố.', ma: 'CHUA_CO_LOI', dotId: 'D9', daDong: false })
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    expect(await screen.findByRole('heading', { name: 'Câu này tạm chưa cần sửa' })).toBeTruthy()
    expect(ghi).toHaveBeenCalledWith('D9')
    expect(screen.getByRole('status').textContent).not.toMatch(/làm lại đúng|sửa xong rồi/)
  })
  // SỬA CÓ CHỦ Ý 28/10 (thầy «Bỏ màn chưa sửa được câu này đi»): không còn khung lỗi — câu tự khép phần hôm nay rồi sang câu kế / về.
  it('«chưa có lỗi đang mở» KHÔNG kèm mã đợt ⇒ ghi xong phần theo mã câu, sang câu kế ngay — không khung lỗi', async () => {
    api.apiMoDot.mockResolvedValue({ ok: false, loi: 'Câu này chưa có lỗi đang mở đã công bố.', ma: 'CHUA_CO_LOI' })
    const onVe = vi.fn(), onTiep = vi.fn()
    render(<Man token="t" qid="Q" onVe={onVe} onTiep={onTiep} />)
    await waitFor(() => expect(onTiep).toHaveBeenCalledTimes(1))
    expect(ghi).toHaveBeenCalledWith('Q')
    expect(onVe).not.toHaveBeenCalled()
    expect(screen.queryByRole('heading', { name: 'Chưa mở được câu này' })).toBeNull()
  })
})
