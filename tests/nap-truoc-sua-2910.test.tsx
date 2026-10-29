// @vitest-environment jsdom
// NẠP TRƯỚC CÂU SỬA KẾ TIẾP (thầy 29/10 «Mở câu quá lâu»): câu chưa xong kế tiếp được mở sẵn ở máy chủ; bấm vào là dùng ngay, không màn «Đang mở câu…».
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

const api = vi.hoisted(() => ({ apiMoDot: vi.fn(), apiPhatItem: vi.fn(), apiNopItem: vi.fn(), apiXinGoiY: vi.fn(), apiCoChua: vi.fn(), apiGonMo: vi.fn(), apiGonNop: vi.fn() }))
vi.mock('../src/lib/chua-cau-sai-api', () => api)
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }), xongNapDiaChi: async () => {} }))
import Man from '../src/components/chua-cau-sai/ManChuaCauSai'
import { HAN_NAP_TRUOC_MS, layNapTruocCauSua, layNapTruocCauSuaNgay, napTruocCauSua, xoaNapTruocCauSua } from '../src/lib/nap-truoc-sua'

const DE = { qid: 'Q', phan: 'I', text: 'Thuỷ phân hoàn toàn 8,8 gam etyl axetat bằng dung dịch NaOH vừa đủ. Khối lượng muối thu được là', choices: ['8,2 gam.', '6,8 gam.', '9,6 gam.', '4,1 gam.'], ideas: [], hinhAnh: [] }
const MO = { ok: true, dotId: 'D1', lan: 1, ban: 'Q', banKhac: false, tuSuaNeuDung: true, de: DE }
const DOT = { ok: true, dotId: 'D1', gon: MO }

beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear(); xoaNapTruocCauSua()
  localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: '10044', token: 't' }))
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, cau: [] }) })))
  api.apiMoDot.mockResolvedValue(DOT)
  api.apiCoChua.mockResolvedValue(false)
})
afterEach(() => { cleanup(); vi.unstubAllGlobals(); xoaNapTruocCauSua() })

describe('kho nạp trước', () => {
  it('nạp một câu đúng MỘT lần (gọi lặp trong hạn không gọi thêm); lấy ra dùng một lần', async () => {
    napTruocCauSua('t', 'Q'); napTruocCauSua('t', 'Q')
    expect(api.apiMoDot).toHaveBeenCalledTimes(1)
    expect(api.apiMoDot).toHaveBeenCalledWith('t', 'Q', undefined, false, true)
    const r = await layNapTruocCauSua('t', 'Q')!
    expect(r).toMatchObject({ ok: true, dotId: 'D1' })
    expect(layNapTruocCauSua('t', 'Q')).toBeNull() // dùng một lần: lần mở lại sau khi làm hỏi tươi
  })
  it('quá hạn ⇒ không dùng; nạp lại được', async () => {
    const t0 = 1_000_000
    napTruocCauSua('t', 'Q', t0)
    expect(layNapTruocCauSua('t', 'Q', t0 + HAN_NAP_TRUOC_MS + 1)).toBeNull()
    napTruocCauSua('t', 'Q', t0 + HAN_NAP_TRUOC_MS + 2)
    expect(api.apiMoDot).toHaveBeenCalledTimes(2)
  })
  it('kết quả lỗi không nằm lại (lần bấm thật hỏi tươi); mạng ném lỗi cũng vậy', async () => {
    api.apiMoDot.mockResolvedValueOnce({ ok: false, loi: 'x' })
    napTruocCauSua('t', 'Q')
    await Promise.resolve(); await Promise.resolve(); await new Promise((r) => setTimeout(r, 0))
    expect(layNapTruocCauSua('t', 'Q')).toBeNull()
    api.apiMoDot.mockRejectedValueOnce(new Error('mạng'))
    napTruocCauSua('t', 'Q2')
    await new Promise((r) => setTimeout(r, 0))
    expect(layNapTruocCauSua('t', 'Q2')).toBeNull()
  })
  it('giữ tối đa 3 câu; theo token (đổi tài khoản không lẫn)', () => {
    for (const q of ['A', 'B', 'C', 'D']) napTruocCauSua('t', q)
    expect(layNapTruocCauSua('t', 'A')).toBeNull() // câu cũ nhất bị bỏ
    expect(layNapTruocCauSua('t', 'D')).not.toBeNull()
    expect(layNapTruocCauSua('khac', 'B')).toBeNull()
    napTruocCauSua('', 'X'); napTruocCauSua('t', '')
    expect(api.apiMoDot).toHaveBeenCalledTimes(4)
  })
})

describe('bản nạp trước ĐÃ VỀ dựng thẳng ở lần vẽ đầu (29/10, video 11:00 «khựng chỗ mở câu»)', () => {
  it('layNapTruocCauSuaNgay: chưa về ⇒ null; về rồi ⇒ trả đồng bộ MỘT lần; hết hạn ⇒ null; lỗi ⇒ null', async () => {
    const t0 = Date.now()
    napTruocCauSua('t', 'Q', t0)
    expect(layNapTruocCauSuaNgay('t', 'Q', t0)).toBeNull() // lời hứa chưa kịp xong
    await Promise.resolve(); await Promise.resolve(); await new Promise((r) => setTimeout(r, 0))
    expect(layNapTruocCauSuaNgay('t', 'Q', t0 + HAN_NAP_TRUOC_MS + 1)).toBeNull() // quá hạn
    napTruocCauSua('t', 'Q', t0 + HAN_NAP_TRUOC_MS + 2)
    await new Promise((r) => setTimeout(r, 0))
    expect(layNapTruocCauSuaNgay('t', 'Q', t0 + HAN_NAP_TRUOC_MS + 3)).toMatchObject({ ok: true, dotId: 'D1' })
    expect(layNapTruocCauSuaNgay('t', 'Q', t0 + HAN_NAP_TRUOC_MS + 3)).toBeNull() // dùng một lần
    api.apiMoDot.mockResolvedValue({ ok: false, loi: 'mạng' })
    napTruocCauSua('t', 'Q2', t0)
    await new Promise((r) => setTimeout(r, 0))
    expect(layNapTruocCauSuaNgay('t', 'Q2', t0)).toBeNull()
  })
  it('đã về trước khi mở màn ⇒ màn dựng thẳng bản làm lại ngay lần vẽ đầu (không «Đang mở câu…»), không gọi lại mo-dot / gon-mo', async () => {
    napTruocCauSua('t', 'Q')
    await new Promise((r) => setTimeout(r, 0)) // lượt nạp trước đã về
    const { container } = render(<Man token="t" qid="Q" onVe={() => {}} />)
    expect(container.textContent).not.toContain('Đang mở câu') // lần vẽ ĐẦU TIÊN đã có màn câu / khung Duo, không khung chờ
    expect(await screen.findByRole('heading', { name: 'Em tự làm lại câu này' })).toBeTruthy()
    expect(api.apiMoDot).toHaveBeenCalledTimes(1)
    expect(api.apiGonMo).not.toHaveBeenCalled()
  })
})

describe('màn mở câu dùng bản nạp trước', () => {
  it('bấm câu đã nạp trước ⇒ vào thẳng bản làm lại, KHÔNG gọi mo-dot lần nữa', async () => {
    napTruocCauSua('t', 'Q')
    expect(api.apiMoDot).toHaveBeenCalledTimes(1)
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    expect(await screen.findByRole('heading', { name: 'Em tự làm lại câu này' })).toBeTruthy()
    expect(api.apiMoDot).toHaveBeenCalledTimes(1)
    expect(api.apiGonMo).not.toHaveBeenCalled()
  })
  it('không nạp trước ⇒ mở như cũ (một lệnh mo-dot kèm bản làm lại)', async () => {
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    expect(await screen.findByRole('heading', { name: 'Em tự làm lại câu này' })).toBeTruthy()
    expect(api.apiMoDot).toHaveBeenCalledTimes(1)
  })
  it('nạp trước bị lỗi ⇒ hỏi tươi, em vẫn vào được câu', async () => {
    api.apiMoDot.mockResolvedValueOnce({ ok: false, loi: 'mạng' }).mockResolvedValue(DOT)
    napTruocCauSua('t', 'Q')
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    expect(await screen.findByRole('heading', { name: 'Em tự làm lại câu này' })).toBeTruthy()
    expect(api.apiMoDot).toHaveBeenCalledTimes(2)
  })
})
