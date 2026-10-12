// CHỮA TRỰC TIẾP CÂU GỐC (12/10) — thầy: "mục chữa lỗi hiển thị cho thật chuẩn để học sinh chữa lỗi được" (kèm ảnh "Cùng gỡ câu này" ở
// trạng thái "Cần thêm bài luyện đúng chỗ": em chỉ thấy một khung chữ). Khoá:
//   · thieu_hoc_lieu ⇒ lối "Chữa trực tiếp câu gốc": (a) câu gốc bằng TheCau, (b) đáp án em đã chọn, (c) đáp án đúng + lời giải SAU khi em bấm,
//     (d) em tự làm lại và kiểm tra lại — đúng / chưa đúng; nút rời màn "Sang câu khác";
//   · máy chủ KHÔNG cho (câu thuộc ca chưa công bố ⇒ `khoa`) ⇒ không đáp án, không lời giải, không bước 2–3;
//   · vòng chữa báo đang có ca kiểm tra mở ⇒ KHÔNG hỏi đề/đáp án câu gốc;
//   · cho_gap_lai_2 ⇒ ghi rõ giờ + thứ + ngày hẹn, kèm nút sang câu khác;
//   · hàm thuần: so lần tự làm lại, chữ đáp án có nhãn, thời gian còn lại.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

const api = vi.hoisted(() => ({
  apiMoDot: vi.fn(),
  apiPhatItem: vi.fn(),
  apiNopItem: vi.fn(),
  apiXinGoiY: vi.fn(),
  apiGuiThay: vi.fn(),
  apiCoChua: vi.fn(),
}))
vi.mock('../src/lib/chua-cau-sai-api', () => api)
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }), xongNapDiaChi: async () => {} }))

import Man from '../src/components/chua-cau-sai/ManChuaCauSai'
import { chuConLai, chuDapAn, soTuLam, canChuaTrucTiep, henGapLai } from '../src/lib/chua-truc-tiep'

const DE = 'Thuỷ phân hoàn toàn 8,8 gam etyl axetat bằng dung dịch NaOH vừa đủ. Khối lượng muối thu được là'
const CT = {
  de: { qid: 'Q', phan: 'I', text: DE, choices: ['8,2 gam.', '6,8 gam.', '9,6 gam.', '4,1 gam.'], ideas: [], hinhAnh: [], tenDang: 'Thuỷ phân ester', mucDo: 'hieu', maDe: 'DH-12', sao: 0 },
  dapAn: 'A',
  loiGiai: { chot: 'Số mol este bằng 0,1 mol nên khối lượng muối CH₃COONa là 8,2 gam.', buoc: ['Tính số mol etyl axetat: 8,8 : 88 = 0,1 mol.', 'Muối CH₃COONa: 0,1 × 82 = 8,2 gam.'] },
  emTraLoi: 'B',
}
let cuoc: { u: string; body: Record<string, unknown> }[] = []
function mayChu(chiTiet: Record<string, unknown>) {
  cuoc = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { body?: string }) => {
    const u = new URL(String(url)).pathname
    cuoc.push({ u, body: JSON.parse(init?.body || '{}') })
    const tra = (b: unknown) => ({ ok: true, status: 200, json: async () => b })
    if (u === '/game-v2/hoa2-cau-chi-tiet') return tra(chiTiet)
    return tra({ ok: true })
  }))
}
const DOT = { ok: true, dotId: 'D1', trangThai: 'thieu_hoc_lieu', coHocLieu: false, revision: 1, tienDo: { soBuocDaQua: 0, soBuocCanKiem: 0 }, tienDoChiTiet: [], cauGoc: null, item: null }

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  api.apiMoDot.mockResolvedValue({ ok: true, dotId: 'D1', trangThai: 'thieu_hoc_lieu' })
  api.apiPhatItem.mockResolvedValue(DOT)
  api.apiCoChua.mockResolvedValue(false)
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Chữa trực tiếp câu gốc khi thiếu bài luyện từng bước', () => {
  it('không còn ngõ cụt: câu gốc + đáp án em chọn → đáp án đúng + lời giải → tự làm lại, kiểm tra lại', async () => {
    mayChu({ ok: true, cau: [CT] })
    const veNgoai = vi.fn()
    render(<Man token="t" qid="Q" onVe={veNgoai} />)
    // (a) câu gốc đầy đủ + (b) đáp án em đã chọn; đáp án đúng CHƯA hiện
    expect(await screen.findByRole('heading', { name: 'Bài luyện từng bước đang được chuẩn bị' })).toBeTruthy()
    expect(screen.getByText('Chữa trực tiếp câu gốc')).toBeTruthy() // dòng phụ đầu màn: tên lối đang đi
    expect(await screen.findByText(/etyl axetat/)).toBeTruthy()
    expect(screen.getByText('Em đã chọn').nextSibling?.textContent).toBe('B')
    expect(screen.queryByText('Đáp án đúng')).toBeNull()
    expect(screen.queryByText(/0,1 × 82/)).toBeNull()
    expect(screen.queryByText('Cần thêm bài luyện đúng chỗ')).toBeNull()
    // Đường tự gỡ có 3 bước, bước 1 đang mở
    const duong = screen.getByRole('list', { name: 'Các bước chữa trực tiếp' })
    expect(within(duong).getAllByRole('button').map((b) => b.textContent)).toEqual(['1Xem lại câu gốc', '2Đáp án và lời giải', '3Tự làm lại'])
    expect(within(duong).getByRole('button', { name: /Xem lại câu gốc/ }).getAttribute('aria-current')).toBe('step')
    // một nút chính, kèm nút sang câu khác
    expect(document.querySelectorAll('.ccs-day .ccs-nut-chinh')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Sang câu khác' })).toBeTruthy()
    // (c) đáp án đúng + lời giải từng bước
    fireEvent.click(screen.getByRole('button', { name: 'Xem đáp án và lời giải' }))
    expect(await screen.findByText('Đáp án đúng')).toBeTruthy()
    expect(screen.getByText('Đáp án đúng').nextSibling?.textContent).toBe('A')
    expect(screen.getByText(/0,1 × 82/)).toBeTruthy()
    // (d) tự làm lại: chọn sai ⇒ "Chưa đúng" + đáp án đúng; làm lại, chọn đúng ⇒ "Em làm đúng rồi"
    fireEvent.click(screen.getByRole('button', { name: 'Tự làm lại câu này' }))
    const kiem = screen.getByRole('button', { name: 'Kiểm tra lại' }) as HTMLButtonElement
    expect(kiem.disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /6,8/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra lại' }))
    expect(await screen.findByRole('heading', { name: 'Chưa đúng' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Làm lại lần nữa' }))
    fireEvent.click(screen.getByRole('button', { name: /8,2/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra lại' }))
    expect(await screen.findByRole('heading', { name: 'Em làm đúng rồi' })).toBeTruthy()
    expect(screen.getByText(/không tính điểm, không đổi lịch ôn/)).toBeTruthy()
    fireEvent.click(screen.getAllByRole('button', { name: 'Sang câu khác' })[0]!)
    expect(veNgoai).toHaveBeenCalled()
    // đề + đáp án lấy qua đường "Câu đã làm" (máy chủ xét quyền), đúng câu
    expect(cuoc.filter((c) => c.u === '/game-v2/hoa2-cau-chi-tiet').map((c) => c.body.qid)).toEqual(['Q'])
  })

  it('máy chủ không cho đáp án (câu thuộc ca chưa công bố) ⇒ không đáp án, không lời giải, không bước 2–3', async () => {
    mayChu({ ok: true, cau: [], khoa: ['Q'] })
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    expect(await screen.findByText(/ca kiểm tra chưa công bố kết quả/)).toBeTruthy()
    expect(screen.queryByText('Đáp án đúng')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Xem đáp án và lời giải' })).toBeNull()
    const duong = screen.getByRole('list', { name: 'Các bước chữa trực tiếp' })
    expect((within(duong).getByRole('button', { name: /Đáp án và lời giải/ }) as HTMLButtonElement).disabled).toBe(true)
    expect((within(duong).getByRole('button', { name: /Tự làm lại/ }) as HTMLButtonElement).disabled).toBe(true)
    expect(document.body.textContent).not.toMatch(/8,2 gam/)
    expect(screen.getByRole('button', { name: 'Sang câu khác' })).toBeTruthy()
  })

  it('em đang có ca kiểm tra mở (vòng chữa từ chối) ⇒ không hỏi đề / đáp án câu gốc', async () => {
    mayChu({ ok: true, cau: [CT] })
    api.apiMoDot.mockResolvedValue({ ok: false, ma: 'DANG_KIEM_TRA', loi: 'Em hoàn thành ca kiểm tra trước khi chữa câu.' })
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    expect(await screen.findByText('Em hoàn thành ca kiểm tra trước khi chữa câu.')).toBeTruthy()
    await new Promise((r) => setTimeout(r, 30))
    expect(cuoc.some((c) => c.u === '/game-v2/hoa2-cau-chi-tiet')).toBe(false)
    expect(screen.queryByText('Đáp án đúng')).toBeNull()
  })

  it('chờ lần gặp lại 2 ⇒ ghi rõ giờ · thứ · ngày hẹn + còn bao lâu, kèm nút sang câu khác', async () => {
    mayChu({ ok: true, cau: [CT] })
    const den = new Date(Date.now() + (5 * 60 + 20) * 60000).toISOString()
    api.apiPhatItem.mockResolvedValue({ ...DOT, trangThai: 'cho_gap_lai_2', denHan: den })
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    const hen = await screen.findByText(/Lần gặp lại 2 mở lúc/)
    expect(hen.textContent).toMatch(/\d{2}:\d{2} · (Thứ (Hai|Ba|Tư|Năm|Sáu|Bảy)|Chủ nhật) \d{2}\/\d{2}\/\d{4}/)
    expect(hen.textContent).toMatch(/còn 5 giờ (19|20) phút/)
    expect(screen.getByRole('button', { name: 'Sang câu khác' })).toBeTruthy()
  })

  it('trạng thái nào có bước để làm thì đi đường từng bước như cũ', () => {
    expect(canChuaTrucTiep({ ok: true, trangThai: 'dang_chua_buoc', item: { id: 'I', loai: 'chan_doan', tieuDe: 'x', kieu: 'so', hoi: 'h', luaChon: null } })).toBe(false)
    expect(canChuaTrucTiep({ ok: true, trangThai: 'thieu_hoc_lieu' })).toBe(true)
    expect(canChuaTrucTiep({ ok: true, trangThai: 'dang_chua_buoc' })).toBe(true) // máy chủ không phát được bước ⇒ không bỏ em lại
    expect(canChuaTrucTiep({ ok: true, trangThai: 'dang_chua_buoc', canNghi: true })).toBe(false)
  })
})

describe('Hàm thuần của chữa trực tiếp', () => {
  it('so lần tự làm lại cùng luật TheCau xem lại', () => {
    expect(soTuLam('I', 'b', 'B')).toBe(true)
    expect(soTuLam('I', 'C', 'B')).toBe(false)
    expect(soTuLam('II', 'DSSD', 'ĐSSĐ')).toBe(true)
    expect(soTuLam('II', 'DSS-', 'DSSD')).toBe(false)
    expect(soTuLam('III', '8.2', '8,2')).toBe(true)
    expect(soTuLam('III', '8,2', '')).toBe(false)
  })
  it('đáp án viết thành chữ có nhãn', () => {
    expect(chuDapAn('I', 'c')).toBe('C')
    expect(chuDapAn('II', 'DSĐ-')).toBe('a) Đúng · b) Sai · c) Đúng · d) chưa chọn')
    expect(chuDapAn('III', ' 3,36 ')).toBe('3,36')
    expect(chuDapAn('I', null)).toBe('')
  })
  it('thời gian còn lại + mốc hẹn giờ Việt Nam', () => {
    const nay = Date.UTC(2026, 9, 12, 3, 0)
    expect(chuConLai(nay + 12 * 60000, nay)).toBe('còn 12 phút')
    expect(chuConLai(nay + (5 * 60 + 20) * 60000, nay)).toBe('còn 5 giờ 20 phút')
    expect(chuConLai(nay + (2 * 1440 + 180) * 60000, nay)).toBe('còn 2 ngày 3 giờ')
    expect(chuConLai(nay - 1000, nay)).toBe('')
    // 07:30 UTC 13/10/2026 = 14:30 giờ Việt Nam, Thứ Ba
    expect(henGapLai('2026-10-13T07:30:00.000Z', nay)).toEqual({ luc: '14:30 · Thứ Ba 13/10/2026', conLai: 'còn 1 ngày 4 giờ', daToi: false })
    expect(henGapLai(undefined, nay)).toBeNull()
  })
})
