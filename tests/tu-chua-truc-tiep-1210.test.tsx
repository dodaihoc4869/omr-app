// CHỮA TRỰC TIẾP CÂU GỐC (12/10) — thầy: "mục chữa lỗi hiển thị cho thật chuẩn để học sinh chữa lỗi được" (kèm ảnh "Cùng gỡ câu này" ở
// trạng thái "Cần thêm bài luyện đúng chỗ": em chỉ thấy một khung chữ). SỬA CÓ CHỦ Ý 12/10 (Boss): thứ tự là Xem lại câu gốc → TỰ LÀM LẠI →
// Đáp án và lời giải (xem đáp án trước rồi làm lại là chép, không phải tự chữa). Khoá:
//   · thieu_hoc_lieu ⇒ lối "Chữa trực tiếp câu gốc": bước 1 câu gốc bằng TheCau + đáp án em đã chọn, KHÔNG đáp án đúng / lời giải;
//   · bước 2 tự làm lại: đúng ⇒ "Em đã tự sửa đúng" + mở bước 3; sai ⇒ báo sai (không lộ đáp án), thử thêm một lần, rồi mở bước 3;
//     nút phụ "Em chưa làm được — xem lời giải" mở bước 3 ngay; câu trả lời ngắn / tự luận ⇒ giải ra giấy rồi đối chiếu;
//   · máy chủ KHÔNG cho đáp án (câu thuộc ca chưa công bố ⇒ `khoa`) ⇒ vẫn làm lại được nhưng không chấm, "Câu này chưa được mở đáp án,
//     thầy sẽ chữa", không bước 3, không đáp án / lời giải trên màn;
//   · vòng chữa báo đang có ca kiểm tra mở ⇒ KHÔNG hỏi đề/đáp án câu gốc;
//   · cho_gap_lai_2 ⇒ ghi rõ giờ + thứ + ngày hẹn, kèm nút sang câu khác;
//   · hàm thuần: so lần tự làm lại, chữ đáp án có nhãn, thời gian còn lại.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'

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
const duongTuGo = () => screen.getByRole('list', { name: 'Các bước chữa trực tiếp' })
const nutBuoc = (ten: RegExp) => within(duongTuGo()).getByRole('button', { name: ten }) as HTMLButtonElement
/** Chưa có đáp án đúng / lời giải nào trên màn. */
function chuaLoDapAn() {
  expect(screen.queryByText('Đáp án đúng')).toBeNull()
  expect(screen.queryByText(/0,1 × 82/)).toBeNull()
  expect(screen.queryByText(/khối lượng muối CH₃COONa là 8,2 gam/)).toBeNull()
}

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
  it('không còn ngõ cụt: câu gốc + đáp án em chọn → tự làm lại (sai, thử thêm, vẫn sai) → đáp án + lời giải', async () => {
    mayChu({ ok: true, cau: [CT] })
    const veNgoai = vi.fn()
    render(<Man token="t" qid="Q" onVe={veNgoai} />)
    // Bước 1: câu gốc đầy đủ + đáp án em đã chọn; đáp án đúng / lời giải CHƯA hiện
    expect(await screen.findByRole('heading', { name: 'Bài luyện từng bước đang được chuẩn bị' })).toBeTruthy()
    expect(screen.getByText('Sửa trên câu gốc')).toBeTruthy() // dòng phụ đầu màn: tên lối đang đi
    expect(await screen.findByText(/etyl axetat/)).toBeTruthy()
    expect(screen.getByText('Em đã chọn').nextSibling?.textContent).toBe('B')
    chuaLoDapAn()
    expect(screen.queryByText('Cần thêm bài luyện đúng chỗ')).toBeNull()
    // Đường tự gỡ: 1 Xem lại câu gốc → 2 Tự làm lại → 3 Đáp án và lời giải (bước 3 khoá tới khi em làm lại)
    // SỬA CÓ CHỦ ĐÍCH 13/10 (đợt 18 — thầy: "Bỏ hết các gợi ý hướng dẫn"): bỏ dòng nhỏ dưới tên bước; nút không còn dấu gạch dài; khối khoá đáp án
    // nói gọn "Lần làm lại này không chấm"; dòng phụ đầu màn "Sửa trên câu gốc".
    expect(within(duongTuGo()).getAllByRole('button').map((b) => b.textContent)).toEqual(['1Xem lại câu gốc', '2Tự làm lại', '3Đáp án và lời giải'])
    expect(nutBuoc(/Xem lại câu gốc/).getAttribute('aria-current')).toBe('step')
    expect(nutBuoc(/Đáp án và lời giải/).disabled).toBe(true)
    // một nút chính (đổi theo bước), kèm nút sang câu khác
    expect(document.querySelectorAll('.ccs-day .ccs-nut-chinh')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Sang câu khác' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Xem đáp án và lời giải' })).toBeNull()
    // Bước 2: tự làm lại — sai lần đầu ⇒ báo sai, KHÔNG lộ đáp án, cho thử thêm
    fireEvent.click(screen.getByRole('button', { name: 'Tự làm lại câu này' }))
    expect(nutBuoc(/Tự làm lại/).getAttribute('aria-current')).toBe('step')
    expect((screen.getByRole('button', { name: 'Kiểm tra lại' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByRole('button', { name: 'Em chưa làm được · xem lời giải' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /6,8/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra lại' }))
    expect(await screen.findByRole('heading', { name: 'Chưa đúng' })).toBeTruthy()
    chuaLoDapAn()
    expect(nutBuoc(/Đáp án và lời giải/).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Thử thêm một lần' }))
    fireEvent.click(screen.getByRole('button', { name: /9,6/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra lại' }))
    // sai lần hai ⇒ mở bước 3
    expect(await screen.findByRole('heading', { name: 'Vẫn chưa đúng' })).toBeTruthy()
    chuaLoDapAn()
    expect(nutBuoc(/Đáp án và lời giải/).disabled).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Xem đáp án và lời giải' }))
    // Bước 3: đáp án đúng + lời giải từng bước + đối chiếu lần làm lại
    expect(await screen.findByText('Đáp án đúng')).toBeTruthy()
    expect(screen.getByText('Đáp án đúng').nextSibling?.textContent).toBe('A')
    expect(screen.getByText(/0,1 × 82/)).toBeTruthy()
    expect(screen.getByText('Lần em tự làm lại').nextSibling?.textContent).toBe('C · chưa đúng')
    fireEvent.click(screen.getAllByRole('button', { name: 'Sang câu khác' })[0]!)
    expect(veNgoai).toHaveBeenCalled()
    // đề + đáp án lấy qua đường "Câu đã làm" (máy chủ xét quyền), đúng câu
    expect(cuoc.filter((c) => c.u === '/game-v2/hoa2-cau-chi-tiet').map((c) => c.body.qid)).toEqual(['Q'])
  })

  it('tự làm lại đúng ⇒ "Em đã tự sửa đúng" rồi mới mở lời giải để đối chiếu', async () => {
    mayChu({ ok: true, cau: [CT] })
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Tự làm lại câu này' }))
    fireEvent.click(screen.getByRole('button', { name: /8,2/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra lại' }))
    expect(await screen.findByRole('heading', { name: 'Em đã tự sửa đúng' })).toBeTruthy()
    expect(screen.getByText(/không tính điểm, không đổi lịch ôn/)).toBeTruthy()
    chuaLoDapAn()
    fireEvent.click(screen.getByRole('button', { name: 'Đối chiếu lời giải' }))
    expect(await screen.findByText(/0,1 × 82/)).toBeTruthy()
    expect(screen.getByText('Lần em tự làm lại').nextSibling?.textContent).toBe('A · đúng')
  })

  it('"Em chưa làm được — xem lời giải" mở bước 3 ngay', async () => {
    mayChu({ ok: true, cau: [CT] })
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Tự làm lại câu này' }))
    chuaLoDapAn()
    fireEvent.click(screen.getByRole('button', { name: 'Em chưa làm được · xem lời giải' }))
    expect(await screen.findByText('Đáp án đúng')).toBeTruthy()
    expect(screen.getByText(/0,1 × 82/)).toBeTruthy()
    expect(nutBuoc(/Đáp án và lời giải/).getAttribute('aria-current')).toBe('step')
  })

  it('câu trả lời ngắn (điền số) ⇒ giải ra giấy rồi "Em đã giải xong — xem lời giải để đối chiếu"', async () => {
    mayChu({ ok: true, cau: [{ ...CT, de: { ...CT.de, phan: 'III', choices: [] }, dapAn: '8,2', emTraLoi: '6,8' }] })
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    expect(await screen.findByText('Em đã trả lời')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Tự làm lại câu này' }))
    expect(screen.getByText(/em giải ra giấy/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Kiểm tra lại' })).toBeNull()
    chuaLoDapAn()
    fireEvent.click(screen.getByRole('button', { name: 'Em đã giải xong · xem lời giải' }))
    expect(await screen.findByText('Đáp án đúng')).toBeTruthy()
    expect(screen.getByText('Đáp án đúng').nextSibling?.textContent).toBe('8,2')
  })

  it('máy chủ không cho đáp án (câu thuộc ca chưa công bố) ⇒ làm lại được nhưng không chấm, không đáp án, không bước 3', async () => {
    mayChu({ ok: true, cau: [], khoa: ['Q'] })
    api.apiPhatItem.mockResolvedValue({ ...DOT, cauGoc: { phan: 'I', text: DE, choices: ['8,2 gam.', '6,8 gam.', '9,6 gam.', '4,1 gam.'] } })
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    expect(await screen.findByText(/Câu này chưa được mở đáp án, thầy sẽ chữa/)).toBeTruthy()
    chuaLoDapAn()
    expect(nutBuoc(/Đáp án và lời giải/).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Tự làm lại câu này' }))
    expect(screen.getByText(/Câu này chưa được mở đáp án, thầy sẽ chữa\. Lần làm lại này không chấm/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /6,8/ }))
    expect(screen.queryByRole('button', { name: 'Kiểm tra lại' })).toBeNull()
    expect(screen.queryByRole('button', { name: /xem lời giải/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'Sang câu khác' })).toBeTruthy()
    expect(nutBuoc(/Đáp án và lời giải/).disabled).toBe(true)
    chuaLoDapAn()
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
