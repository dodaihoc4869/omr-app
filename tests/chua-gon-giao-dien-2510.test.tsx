// @vitest-environment jsdom
// CHỮA CÂU GỌN — MÀN EM (thầy 25/10 "sửa theo đề xuất", src/components/chua-cau-sai/ChuaGon.tsx). Khoá:
//   · mở câu: đề + MỘT dòng luật tự làm, KHÔNG đáp án đúng / lời giải trên màn; nút "Kiểm tra" chỉ bật khi đã trả lời;
//   · đúng ⇒ "Em đã tự sửa xong câu này" NGAY + "Câu tiếp theo"; xong phần hôm nay ghi trên máy;
//   · sai ⇒ "Chưa đúng · em thử thêm một lần" + gợi ý, chưa ghi xong, không đáp án; "Làm lại câu này" mở lần 2;
//   · sai lần 2 ⇒ đáp án đúng + lời giải + Hỏi thầy; xong phần ghi;
//   · không mở được câu ⇒ báo thật + Hỏi thầy, vẫn tính xong phần (không kẹt chặng).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

const api = vi.hoisted(() => ({ apiMoDot: vi.fn(), apiPhatItem: vi.fn(), apiNopItem: vi.fn(), apiXinGoiY: vi.fn(), apiCoChua: vi.fn(), apiGonMo: vi.fn(), apiGonNop: vi.fn() }))
vi.mock('../src/lib/chua-cau-sai-api', () => api)
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }), xongNapDiaChi: async () => {} }))
import Man from '../src/components/chua-cau-sai/ManChuaCauSai'
import { LUAT_BAN_MOI } from '../src/lib/chua-truc-tiep'

const DE = { qid: 'Q', phan: 'I', text: 'Thuỷ phân hoàn toàn 8,8 gam etyl axetat bằng dung dịch NaOH vừa đủ. Khối lượng muối thu được là', choices: ['8,2 gam.', '6,8 gam.', '9,6 gam.', '4,1 gam.'], ideas: [], hinhAnh: [], tenDang: 'Thuỷ phân ester' }
const CHI_TIET = { de: { ...DE, maDe: 'DH-12', mucDo: 'hieu', sao: 0 }, dapAn: 'A', loiGiai: { chot: 'Muối CH₃COONa là 8,2 gam.', buoc: ['Tính số mol etyl axetat: 8,8 : 88 = 0,1 mol.'] } }
const MO = { ok: true, dotId: 'D1', lan: 1, ban: 'Q', banKhac: false, tuSuaNeuDung: true, de: DE }
const xong = () => (JSON.parse(localStorage.getItem('omr_tu_sua_hom_nay_10044') || '{"x":[]}') as { x: string[] }).x

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: '10044', token: 't' }))
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, cau: [] }) })))
  api.apiMoDot.mockResolvedValue({ ok: true, dotId: 'D1', trangThai: 'thieu_hoc_lieu' })
  api.apiGonMo.mockResolvedValue(MO)
  api.apiCoChua.mockResolvedValue(false)
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('Chữa câu gọn — màn em', () => {
  it('mở câu: một dòng luật tự làm, không đáp án; đúng ⇒ "Em đã tự sửa xong câu này" ngay, ghi xong phần, nút "Câu tiếp theo"', async () => {
    const onTiep = vi.fn()
    render(<Man token="t" qid="Q" onVe={() => {}} onTiep={onTiep} />)
    expect(await screen.findByRole('heading', { name: 'Em tự làm lại câu này' })).toBeTruthy()
    expect(screen.getByText(LUAT_BAN_MOI)).toBeTruthy()
    expect(screen.queryByText('Đáp án đúng')).toBeNull()
    expect(api.apiMoDot).toHaveBeenCalledWith('t', 'Q', undefined, false, true)
    expect(api.apiPhatItem).not.toHaveBeenCalled()
    const kiem = screen.getByRole('button', { name: 'Kiểm tra' }) as HTMLButtonElement
    expect(kiem.disabled).toBe(true)
    api.apiGonNop.mockResolvedValue({ ok: true, dotId: 'D1', lan: 1, ban: 'Q', dung: true, ket: 'tu_sua', trangThai: 'da_tu_sua', chiTiet: CHI_TIET })
    fireEvent.click(screen.getByRole('button', { name: /8,2/ }))
    fireEvent.click(kiem)
    expect(await screen.findByRole('heading', { name: 'Em đã tự sửa xong câu này' })).toBeTruthy()
    expect(api.apiGonNop).toHaveBeenCalledWith('t', 'D1', 'Q', 'A', expect.any(String), 'Q')
    expect(xong()).toEqual(['D1', 'Q']) // mã đợt + mã câu (25/10: mục ngày có thể mang mã đợt khác)
    fireEvent.click(screen.getByRole('button', { name: 'Câu tiếp theo' }))
    expect(onTiep).toHaveBeenCalledOnce()
    // Lời giải chỉ mở khi em bấm.
    expect(screen.queryByText('Đáp án đúng')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Xem lời giải' }))
    expect(screen.getByText('Đáp án đúng')).toBeTruthy()
  })

  it('sai ⇒ gợi ý, chưa ghi xong, không đáp án; "Làm lại câu này" ⇒ lần 2; sai nữa ⇒ đáp án + lời giải, ghi xong phần', async () => {
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    await screen.findByRole('heading', { name: 'Em tự làm lại câu này' })
    api.apiGonNop.mockResolvedValueOnce({ ok: true, dotId: 'D1', lan: 1, ban: 'Q', dung: false, ket: 'goi_y', goiY: 'Em đọc lại đề, gạch chân điều đề hỏi rồi loại từng phương án.' })
    fireEvent.click(screen.getByRole('button', { name: /6,8/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    expect(await screen.findByRole('heading', { name: 'Chưa đúng · em thử thêm một lần' })).toBeTruthy()
    expect(screen.getByText(/gạch chân điều đề hỏi/)).toBeTruthy()
    expect(screen.queryByText('Đáp án đúng')).toBeNull()
    expect(xong()).toEqual([])
    api.apiGonMo.mockResolvedValueOnce({ ...MO, lan: 2, tuSuaNeuDung: false })
    fireEvent.click(screen.getByRole('button', { name: 'Làm lại câu này' }))
    expect(await screen.findByText(/· lần 2/)).toBeTruthy()
    expect(screen.queryByText(LUAT_BAN_MOI)).toBeNull()
    api.apiGonNop.mockResolvedValueOnce({ ok: true, dotId: 'D1', lan: 2, ban: 'Q', dung: false, ket: 'loi_giai', chiTiet: CHI_TIET })
    fireEvent.click(screen.getByRole('button', { name: /9,6/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    expect(await screen.findByRole('heading', { name: 'Chưa đúng · xem đáp án và lời giải' })).toBeTruthy()
    expect(screen.getByText('Đáp án đúng')).toBeTruthy()
    expect(xong()).toEqual(['D1', 'Q']) // mã đợt + mã câu (25/10: mục ngày có thể mang mã đợt khác)
  })

  it('đúng mà chưa qua luật tự làm (vừa sai hôm nay) ⇒ "xong phần hôm nay" + lý do thật, không gọi là đã tự sửa', async () => {
    api.apiGonMo.mockResolvedValue({ ...MO, tuSuaNeuDung: false })
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    await screen.findByRole('heading', { name: 'Em tự làm lại câu này' })
    expect(screen.getByText(/Ngày khác tự làm đúng mới tính là đã tự sửa/)).toBeTruthy()
    api.apiGonNop.mockResolvedValue({ ok: true, dotId: 'D1', lan: 1, ban: 'Q', dung: true, ket: 'xong_phan', lyDo: 'cung_ngay', chiTiet: CHI_TIET })
    fireEvent.click(screen.getByRole('button', { name: /8,2/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    expect(await screen.findByRole('heading', { name: 'Đúng rồi · xong phần hôm nay' })).toBeTruthy()
    expect(screen.queryByText('Em đã tự sửa xong câu này')).toBeNull()
    expect(xong()).toEqual(['D1', 'Q']) // mã đợt + mã câu (25/10: mục ngày có thể mang mã đợt khác)
  })

  it('không mở được câu ⇒ báo thật + Hỏi thầy; vẫn tính xong phần hôm nay (không kẹt chặng)', async () => {
    api.apiGonMo.mockResolvedValue({ ok: false, ma: 'KHONG_MO_DUOC_CAU', loi: 'Chưa mở được câu này ở đây. Em bấm Hỏi thầy nhé.' })
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    expect(await screen.findByRole('heading', { name: 'Chưa mở được câu này ở đây' })).toBeTruthy()
    expect(xong()).toEqual(['D1', 'Q']) // mã đợt + mã câu (25/10: mục ngày có thể mang mã đợt khác)
    expect(api.apiPhatItem).not.toHaveBeenCalled()
  })

  it('mất mạng lúc nộp ⇒ báo, giữ đáp án; bấm lại gửi ĐÚNG khoá cũ', async () => {
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    await screen.findByRole('heading', { name: 'Em tự làm lại câu này' })
    api.apiGonNop.mockResolvedValueOnce({ ok: false, loi: 'Chưa nối được máy chủ. Em kiểm tra mạng rồi thử lại.' })
    fireEvent.click(screen.getByRole('button', { name: /8,2/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    expect(await screen.findByText(/Chưa nối được máy chủ/)).toBeTruthy()
    api.apiGonNop.mockResolvedValueOnce({ ok: true, dotId: 'D1', lan: 1, ban: 'Q', dung: true, ket: 'tu_sua', trangThai: 'da_tu_sua', chiTiet: CHI_TIET })
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    expect(await screen.findByRole('heading', { name: 'Em đã tự sửa xong câu này' })).toBeTruthy()
    const [a, b] = api.apiGonNop.mock.calls
    expect(b![4]).toBe(a![4])
    expect(b![3]).toBe('A')
  })
})
