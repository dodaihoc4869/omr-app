// @vitest-environment jsdom
// SỬA TRÊN CÂU GỐC — phần của Việc hôm nay (thầy 20/10; 94% đợt chưa có bài luyện từng bước nên đa số câu của ngày là lối này):
//   · em tự làm lại và bấm "Kiểm tra lại" (hoặc "Em đã giải xong" ở câu tự luận / điền số) ⇒ ghi "xong phần hôm nay" trên máy em;
//   · chỉ bấm "Em chưa làm được · xem lời giải" mà chưa tự làm ⇒ KHÔNG ghi;
//   · hẹn lần gặp lại 2 đã tới ⇒ đúng MỘT dòng điều kiện cạnh nút "Làm lần gặp lại 2"; chưa tới ⇒ không dòng.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

const api = vi.hoisted(() => ({ apiMoDot: vi.fn(), apiPhatItem: vi.fn(), apiNopItem: vi.fn(), apiXinGoiY: vi.fn(), apiCoChua: vi.fn(),
  // Chữa câu gọn (25/10): máy chủ CHƯA có lệnh gọn (mất nối / bản cũ) ⇒ màn đi lối cũ — tệp này kiểm lối lùi ấy.
  apiGonMo: vi.fn(async () => ({ ok: false, loi: 'Chưa nối được máy chủ.' })) }))
vi.mock('../src/lib/chua-cau-sai-api', () => api)
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }), xongNapDiaChi: async () => {} }))
import Man from '../src/components/chua-cau-sai/ManChuaCauSai'
import { LUAT_BAN_MOI } from '../src/lib/chua-truc-tiep'

const CT = {
  de: { qid: 'Q', phan: 'I', text: 'Thuỷ phân hoàn toàn 8,8 gam etyl axetat bằng dung dịch NaOH vừa đủ. Khối lượng muối thu được là', choices: ['8,2 gam.', '6,8 gam.', '9,6 gam.', '4,1 gam.'], ideas: [], hinhAnh: [], tenDang: 'Thuỷ phân ester', mucDo: 'hieu', maDe: 'DH-12', sao: 0 },
  dapAn: 'A',
  loiGiai: { chot: 'Muối CH₃COONa là 8,2 gam.', buoc: ['Tính số mol etyl axetat: 8,8 : 88 = 0,1 mol.'] },
  emTraLoi: 'B',
}
const DOT = { ok: true, dotId: 'D1', trangThai: 'thieu_hoc_lieu', coHocLieu: false, revision: 1, tienDo: { soBuocDaQua: 0, soBuocCanKiem: 0 }, tienDoChiTiet: [], cauGoc: null, item: null }
const ghiLocal = () => JSON.parse(localStorage.getItem('omr_tu_sua_hom_nay_11010') ?? 'null') as { x: string[] } | null
function mayChu(cau: unknown) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const u = new URL(String(url)).pathname
    return { ok: true, status: 200, json: async () => (u === '/game-v2/hoa2-cau-chi-tiet' ? { ok: true, cau: [cau] } : { ok: true }) }
  }))
}
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: '11010', token: 't' }))
  api.apiMoDot.mockResolvedValue({ ok: true, dotId: 'D1', trangThai: 'thieu_hoc_lieu' })
  api.apiPhatItem.mockResolvedValue(DOT)
  api.apiCoChua.mockResolvedValue(false)
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('Câu chỉ có lối câu gốc: khi nào tính là xong phần hôm nay', () => {
  it('"Kiểm tra lại" (dù đúng hay sai) ⇒ ghi', async () => {
    mayChu(CT)
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Tự làm lại câu này' }))
    expect(ghiLocal()).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /6,8/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra lại' }))
    expect(await screen.findByRole('heading', { name: 'Chưa đúng' })).toBeTruthy()
    expect(ghiLocal()?.x).toEqual(['D1'])
  })

  it('chỉ "Em chưa làm được · xem lời giải" mà chưa tự làm ⇒ KHÔNG ghi', async () => {
    mayChu(CT)
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Tự làm lại câu này' }))
    fireEvent.click(screen.getByRole('button', { name: 'Em chưa làm được · xem lời giải' }))
    expect(await screen.findByText('Đáp án đúng')).toBeTruthy()
    expect(ghiLocal()).toBeNull()
  })

  it('câu điền số / tự luận: giải ra giấy rồi "Em đã giải xong · xem lời giải" ⇒ ghi', async () => {
    mayChu({ ...CT, de: { ...CT.de, phan: 'III', choices: [] }, dapAn: '8,2', emTraLoi: '6,8' })
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Tự làm lại câu này' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Em đã giải xong · xem lời giải' }))
    expect(ghiLocal()?.x).toEqual(['D1'])
  })
})

describe('Hẹn lần gặp lại 2', () => {
  it('đã tới ⇒ nút "Làm lần gặp lại 2" kèm đúng MỘT dòng điều kiện; chưa tới ⇒ không dòng', async () => {
    mayChu(CT)
    api.apiPhatItem.mockResolvedValue({ ...DOT, trangThai: 'cho_gap_lai_2', denHan: new Date(Date.now() - 3600_000).toISOString() })
    const { unmount } = render(<Man token="t" qid="Q" onVe={() => {}} />)
    expect(await screen.findByRole('button', { name: 'Làm lần gặp lại 2' })).toBeTruthy()
    expect(screen.getByText(LUAT_BAN_MOI)).toBeTruthy()
    expect(document.querySelectorAll('.ccs-luat')).toHaveLength(1)
    unmount()
    api.apiPhatItem.mockResolvedValue({ ...DOT, trangThai: 'cho_gap_lai_2', denHan: new Date(Date.now() + 5 * 3600_000).toISOString() })
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    await screen.findByText(/Lần gặp lại 2 mở lúc/)
    expect(screen.queryByText(LUAT_BAN_MOI)).toBeNull()
  })
})
