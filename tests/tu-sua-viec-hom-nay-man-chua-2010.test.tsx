// @vitest-environment jsdom
// MÀN CHỮA — phần của Việc hôm nay (thầy 20/10): MỘT dòng điều kiện ở bản mới; tiêu đề sau khi nộp nói đúng việc em vừa làm (ghép xong · tự sửa xong); nộp xong chặng
// cuối làm được hôm nay ⇒ ghi trên máy em (cho thẻ ở Hôm nay); bước thường chưa xong ⇒ không ghi. Câu chỉ có lối câu gốc: "Kiểm tra lại" / "Em đã giải xong" ⇒ ghi.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const api = vi.hoisted(() => ({ apiMoDot: vi.fn(), apiPhatItem: vi.fn(), apiNopItem: vi.fn(), apiXinGoiY: vi.fn(), apiCoChua: vi.fn() }))
vi.mock('../src/lib/chua-cau-sai-api', () => api)
import Man from '../src/components/chua-cau-sai/ManChuaCauSai'
import { LUAT_BAN_MOI } from '../src/lib/chua-truc-tiep'

const item = { id: 'I1', loai: 'kiem_chung', tieuDe: 'Cân bằng phản ứng', kieu: 'so', hoi: 'Tính tổng hệ số.', luaChon: null }
const ph = {
  ok: true, dotId: 'D1', trangThai: 'dang_kiem_chung', lanGapLai: 2, item,
  tienDo: { soBuocDaQua: 2, soBuocCanKiem: 2 }, tienDoChiTiet: [{ buocId: 'm', tieuDe: 'Cân bằng electron', trangThai: 'co_bang_chung_hieu_trong_phien' }],
}
const ghiLocal = () => JSON.parse(localStorage.getItem('omr_tu_sua_hom_nay_11010') ?? 'null') as { x: string[] } | null

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: '11010', token: 't' }))
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, cau: [] }) })))
  api.apiMoDot.mockResolvedValue({ ok: true, dotId: 'D1' })
  api.apiPhatItem.mockResolvedValue(ph)
  api.apiCoChua.mockResolvedValue(false)
})

describe('Bản mới (lần gặp lại 2)', () => {
  it('MỘT dòng điều kiện trước khi làm; nói đúng luật tự làm, không nhắc giờ', async () => {
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    expect(await screen.findByText(LUAT_BAN_MOI)).toBeTruthy()
    expect(document.querySelectorAll('.ccs-luat')).toHaveLength(1)
  })

  it('tự làm đúng ⇒ "Em đã tự sửa xong câu này" + ghi xong phần hôm nay; dòng điều kiện biến mất khi đã có phản hồi', async () => {
    api.apiNopItem.mockResolvedValue({ ok: true, dung: true, trangThaiMoi: 'da_tu_sua', phanGiuDuoc: 'Em đã chứng minh được: Cân bằng electron.' })
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    fireEvent.change(await screen.findByLabelText('Câu trả lời của em'), { target: { value: '9' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tự thử lại' }))
    expect(await screen.findByRole('heading', { name: 'Em đã tự sửa xong câu này' })).toBeTruthy()
    expect(screen.getByText(/Em đã chứng minh được: Cân bằng electron/)).toBeTruthy()
    expect(screen.queryByText(LUAT_BAN_MOI)).toBeNull()
    await waitFor(() => expect(ghiLocal()?.x).toEqual(['D1']))
  })
})

describe('Ghép xong cả bài và hết sức mà vướng', () => {
  const buocGhep = { ...ph, trangThai: 'dang_ghep_bai', item: { ...item, id: 'I2', loai: 'ghep_bai', tieuDe: 'Ghép lại cả bài' } }
  it('ghép xong ⇒ "Em đã ghép lại xong cả bài" + giờ bản mới mở (giờ VN, 24 giờ) + ghi xong phần hôm nay; không có dòng điều kiện ở bước ghép', async () => {
    api.apiPhatItem.mockResolvedValue(buocGhep)
    const han = new Date(Date.parse('2026-10-20T10:40:00Z') + 86_400_000).toISOString() // 17:40 · Thứ Tư 21/10/2026 giờ VN
    api.apiNopItem.mockResolvedValue({ ok: true, dung: true, trangThaiMoi: 'cho_gap_lai_2', denHan: han, hanhDongTiep: 'Sau ít nhất 24 giờ, thử một bản mới mà không xem gợi ý.' })
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    expect(screen.queryByText(LUAT_BAN_MOI)).toBeNull()
    fireEvent.change(await screen.findByLabelText('Câu trả lời của em'), { target: { value: '9' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tự thử lại' }))
    expect(await screen.findByRole('heading', { name: 'Em đã ghép lại xong cả bài' })).toBeTruthy()
    expect(screen.getByText(/Bản mới mở lúc/).textContent).toContain('17:40 · Thứ Tư 21/10/2026')
    await waitFor(() => expect(ghiLocal()?.x).toEqual(['D1']))
  })

  it('sai ở chặng cuối ⇒ chuyển sang chờ chữa trên lớp vẫn ghi xong phần hôm nay (thầy 20/10: hôm nay em không còn gì làm thêm được); tiêu đề giữ nguyên', async () => {
    api.apiPhatItem.mockResolvedValue(buocGhep)
    api.apiNopItem.mockResolvedValue({ ok: true, dung: false, trangThaiMoi: 'can_thay', diemlech: 'Bài tổng hợp còn vướng.' })
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    fireEvent.change(await screen.findByLabelText('Câu trả lời của em'), { target: { value: '8' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tự thử lại' }))
    expect(await screen.findByRole('heading', { name: 'Ta đã thấy chỗ cần gỡ' })).toBeTruthy()
    await waitFor(() => expect(ghiLocal()?.x).toEqual(['D1']))
  })

  it('bước sửa thường chưa xong (đang dở) ⇒ KHÔNG ghi; tiêu đề như cũ', async () => {
    api.apiPhatItem.mockResolvedValue({ ...ph, trangThai: 'dang_chua_buoc', item: { ...item, id: 'I3', loai: 'chan_doan', tieuDe: 'Khối lượng mol' } })
    api.apiNopItem.mockResolvedValue({ ok: true, dung: true, trangThaiMoi: 'dang_chua_buoc' })
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    fireEvent.change(await screen.findByLabelText('Câu trả lời của em'), { target: { value: '40' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tự thử lại' }))
    expect(await screen.findByRole('heading', { name: 'Bước này em làm được rồi' })).toBeTruthy()
    expect(ghiLocal()).toBeNull()
  })
})
