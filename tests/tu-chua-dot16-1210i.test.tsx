// TỰ CHỮA LỖI · ĐỢT 16 (12/10) — thầy: "Trùng tu toàn diện giao diện tự sửa lỗi, mời gọi hs sửa lỗi, phải siêu đẹp, siêu thân thiện, rất khoa
// học…" và "chỗ các câu học sinh chưa chữa đc bấm vào phải nảy vào đúng chỗ tự sửa". Khoá (màn THẬT: ManTuChua + ManChuaCauSai, máy chủ giả):
//   · mở thẳng một câu (`qid`) có trong danh sách ⇒ mở ĐÚNG đợt của câu đó (khớp cả bản đổi số "~n"), đầu màn chữa mang tên câu; quay lại ⇒ danh sách;
//   · câu KHÔNG có trong danh sách ⇒ vẫn thử mở (lệnh mo-dot như cũ); không mở được ⇒ về danh sách + lời báo thật + "Thử mở lại"
//     (không khung lỗi riêng, không kẹt); mở được ⇒ vào màn chữa;
//   · danh sách lỗi khi đang mở thẳng ⇒ báo rõ câu em chọn chưa mở được + Thử lại ⇒ tải lại rồi mở đúng câu;
//   · thẻ tổng: mọi con số lấy từ dữ liệu máy chủ và có nhãn; nút chính mở câu đứng đầu nhóm Cần chữa THEO THỨ TỰ MÁY CHỦ; không mã nội bộ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

const api = vi.hoisted(() => ({
  apiDanhSachTuChua: vi.fn(),
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

import ManTuChua, { goc, timMucChua } from '../src/components/hoc-tap/ManTuChua'

const CDL = {
  ok: true,
  cheDo2: true,
  chienDich: [{ id: 'cd1', ten: 'Hành trình', hanNop: '9999-12-31', tong: 3 }],
  cau: [
    { qid: 'Q1', chienDichId: 'cd1', stt: 3, phan: 'I', mucDo: 'hieu', tenDang: 'Thuỷ phân ester', trangThai: 'dang_on', lanCuoiDung: false, henOn: null, lichSu: [{ ngay: '2026-10-10', dung: false, coGoiY: false, nguon: 'doan' }] },
    { qid: 'Q2', chienDichId: 'cd1', stt: 5, phan: 'III', mucDo: 'VD', tenDang: 'Chất béo', trangThai: 'dang_on', lanCuoiDung: false, henOn: null, lichSu: [{ ngay: '2026-10-09', dung: false, coGoiY: false, nguon: 'bia' }] },
    { qid: 'QX', chienDichId: 'cd1', stt: 7, phan: 'I', mucDo: 'biet', tenDang: 'Saccharose', trangThai: 'dang_on', lanCuoiDung: false, henOn: null, lichSu: [{ ngay: '2026-10-11', dung: false, coGoiY: false, nguon: 'dao' }] },
  ],
}
const DOT = { ok: true, dotId: 'D9', trangThai: 'thieu_hoc_lieu', coHocLieu: false, revision: 1, tienDo: { soBuocDaQua: 0, soBuocCanKiem: 0 }, tienDoChiTiet: [], cauGoc: null, item: null }
const DS = { trangThai: 'bat', ds: [
  { dotId: 'D1', qid: 'Q1', trangThai: 'thieu_hoc_lieu' },
  { dotId: 'D2', qid: 'Q2', trangThai: 'dang_chua_buoc' },
] }

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  api.apiPhatItem.mockResolvedValue(DOT)
  api.apiCoChua.mockResolvedValue(false)
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const u = new URL(String(url)).pathname
    return { ok: true, status: 200, json: async () => (u.endsWith('/hoa2-cau-da-lam') ? CDL : { ok: true, cau: [] }) }
  }))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

// SỬA CÓ CHỦ ĐÍCH 13/10 (đợt 18 — thầy: "Mời gọi học sinh tự sửa lỗi … Bỏ hết các gợi ý hướng dẫn"): chữ "chữa" của em ⇒ "sửa" ("Sửa trên câu gốc",
// "Câu cần sửa", "Bắt đầu sửa", nhóm "Cần sửa"); tiêu đề thẻ tổng là lời mời "Sửa lại câu em làm sai"; bỏ câu "lịch ôn 1 · 3 · 7 ngày" và lời dặn
// "Em chọn một câu trong danh sách để chữa." (nay khoá: KHÔNG còn). Hành vi, số, thứ tự không đổi.
describe('Mở thẳng một câu (từ hồ sơ / màn làm câu) ⇒ đúng chỗ tự sửa', () => {
  it('câu có trong danh sách (kể cả bản đổi số "~3") ⇒ mở đúng đợt, đầu màn mang tên câu; Quay lại ⇒ danh sách', async () => {
    api.apiDanhSachTuChua.mockResolvedValue(DS)
    api.apiMoDot.mockResolvedValue({ ok: true, dotId: 'D2', trangThai: 'thieu_hoc_lieu' })
    render(<ManTuChua token="t" qid="Q2~3" onVe={() => {}} />)
    expect(await screen.findByText('Sửa trên câu gốc')).toBeTruthy()
    expect(api.apiMoDot).toHaveBeenCalledTimes(1)
    expect(api.apiMoDot).toHaveBeenCalledWith('t', 'Q2') // mã đợt trong danh sách, không phải mã bản đổi số
    expect(await screen.findByRole('heading', { level: 1, name: 'Chất béo' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Sửa lại câu em làm sai' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại' }))
    expect(await screen.findByRole('heading', { name: 'Sửa lại câu em làm sai' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Chất béo/ })).toBeTruthy()
    await waitFor(() => expect(api.apiDanhSachTuChua).toHaveBeenCalledTimes(2)) // quay ra ⇒ tải lại trạng thái
  })

  it('câu KHÔNG có trong danh sách, máy chủ không mở được ⇒ về danh sách + lời báo thật + Thử mở lại', async () => {
    api.apiDanhSachTuChua.mockResolvedValue(DS)
    api.apiMoDot.mockResolvedValue({ ok: false, loi: 'Câu này chưa có lỗi đang mở đã công bố.', ma: 'CHUA_CO_LOI' })
    render(<ManTuChua token="t" qid="QX" onVe={() => {}} />)
    const bao = await screen.findByRole('alert')
    expect(bao.textContent).toContain('Chưa mở được câu em chọn')
    expect(bao.textContent).toContain('Câu này chưa có lỗi đang mở đã công bố.')
    expect(bao.textContent).not.toContain('Em chọn một câu trong danh sách')
    expect(api.apiMoDot).toHaveBeenCalledWith('t', 'QX')
    // danh sách vẫn ở đó, không khung lỗi riêng của màn chữa
    expect(screen.getByRole('heading', { name: 'Sửa lại câu em làm sai' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Thuỷ phân ester/ })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Chưa mở được câu này' })).toBeNull()
    fireEvent.click(within(bao).getByRole('button', { name: 'Thử mở lại' }))
    await waitFor(() => expect(api.apiMoDot).toHaveBeenCalledTimes(2))
    expect((await screen.findByRole('alert')).textContent).toContain('Chưa mở được câu em chọn')
  })

  it('câu KHÔNG có trong danh sách nhưng máy chủ lập được đợt ⇒ vào thẳng màn chữa câu đó', async () => {
    api.apiDanhSachTuChua.mockResolvedValue(DS)
    api.apiMoDot.mockResolvedValue({ ok: true, dotId: 'D7', trangThai: 'thieu_hoc_lieu' })
    render(<ManTuChua token="t" qid="QX" onVe={() => {}} />)
    expect(await screen.findByText('Sửa trên câu gốc')).toBeTruthy()
    expect(api.apiMoDot).toHaveBeenCalledWith('t', 'QX')
    expect(await screen.findByRole('heading', { level: 1, name: 'Saccharose' })).toBeTruthy()
  })

  it('danh sách lỗi khi đang mở thẳng ⇒ nói rõ câu em chọn chưa mở + Thử lại ⇒ tải lại rồi mở đúng câu', async () => {
    api.apiDanhSachTuChua
      .mockResolvedValueOnce({ trangThai: 'loi', loi: 'Chưa nối được máy chủ. Em kiểm tra mạng rồi thử lại.' })
      .mockResolvedValueOnce(DS)
    api.apiMoDot.mockResolvedValue({ ok: true, dotId: 'D1', trangThai: 'thieu_hoc_lieu' })
    render(<ManTuChua token="t" qid="Q1" onVe={() => {}} />)
    const loi = await screen.findByRole('alert')
    expect(loi.textContent).toContain('Chưa mở được câu em chọn vì chưa tải được danh sách câu cần sửa.')
    expect(loi.textContent).toContain('Chưa nối được máy chủ')
    expect(api.apiMoDot).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByText('Sửa trên câu gốc')).toBeTruthy()
    expect(api.apiMoDot).toHaveBeenCalledWith('t', 'Q1')
  })

  it('khớp mã: bỏ đuôi bản đổi số và tiền tố tc:; có cả đợt đã đóng lẫn đợt đang mở ⇒ lấy đợt đang mở', () => {
    expect(goc('tc:Q5#2')).toBe('Q5')
    expect(goc('Q5~12')).toBe('Q5')
    const ds = [{ dotId: 'cu', qid: 'Q5', trangThai: 'da_tu_sua' }, { dotId: 'moi', qid: 'Q5', trangThai: 'can_chan_doan' }]
    expect(timMucChua(ds, 'Q5~1')?.dotId).toBe('moi')
    expect(timMucChua([ds[0]], 'Q5')?.dotId).toBe('cu')
    expect(timMucChua(ds, 'Q6')).toBeUndefined()
  })
})

describe('Thẻ tổng: số từ máy chủ, có nhãn, một nút chính theo thứ tự máy chủ', () => {
  it('đếm Cần chữa / Chờ lần gặp lại / Đã tự sửa đúng dữ liệu; nút chính mở câu đứng đầu danh sách máy chủ', async () => {
    const qua = new Date(Date.now() - 3600_000).toISOString()
    const toi = new Date(Date.now() + 30 * 3600_000).toISOString()
    api.apiDanhSachTuChua.mockResolvedValue({ trangThai: 'bat', ds: [
      // máy chủ xếp: lần gặp lại đã tới trước ⇒ câu này là câu đầu tiên cần chữa
      { dotId: 'D2', qid: 'Q2', trangThai: 'cho_gap_lai_2', denHan: qua },
      { dotId: 'D1', qid: 'Q1', trangThai: 'thieu_hoc_lieu' },
      { dotId: 'D3', qid: 'Q3', trangThai: 'can_thay' },
      { dotId: 'D4', qid: 'Q4', trangThai: 'cho_gap_lai_2', denHan: toi },
      { dotId: 'D5', qid: 'Q5', trangThai: 'da_tu_sua' },
      { dotId: 'D6', qid: 'Q6', trangThai: 'da_tu_sua' },
    ] })
    api.apiMoDot.mockResolvedValue({ ok: true, dotId: 'D2', trangThai: 'thieu_hoc_lieu' })
    render(<ManTuChua token="t" onVe={() => {}} />)
    const tong = await screen.findByRole('region', { name: 'Sửa lại câu em làm sai' })
    expect(within(tong).getByText('câu cần sửa').parentElement?.textContent).toBe('3câu cần sửa')
    expect(tong.querySelector('.tcl-tien-do-chu')?.textContent).toBe('Đã tự sửa2/6 câu')
    expect(within(tong).getByRole('img', { name: 'Đã tự sửa 2 trong 6 câu, 1 câu chờ lần gặp lại' })).toBeTruthy()
    expect(within(tong).getByText('Chờ lần gặp lại: 1 câu')).toBeTruthy()
    expect(within(tong).queryByText(/lịch ôn 1 · 3 · 7 ngày|Cách tự chữa/)).toBeNull()
    expect(screen.getByRole('region', { name: 'Cần sửa: 3 câu' })).toBeTruthy()
    expect(screen.getByRole('region', { name: 'Đang chờ lần gặp lại: 1 câu' })).toBeTruthy()
    expect(screen.getByRole('region', { name: 'Đã tự sửa: 2 câu' })).toBeTruthy()
    // đúng MỘT nút chính trên màn; câu đầu tiên theo thứ tự máy chủ
    expect(document.querySelectorAll('.ht-nut-chinh')).toHaveLength(1)
    expect(screen.getByText(/Câu đầu tiên:/).textContent).toBe('Câu đầu tiên: Chất béo')
    // không mã nội bộ trên màn học sinh
    expect(document.body.textContent ?? '').not.toMatch(/\bQ\d\b|\bD\d\b|thieu_hoc_lieu|cho_gap_lai_2|da_tu_sua|can_thay|qid/)
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu sửa' }))
    expect(await screen.findByText('Sửa trên câu gốc')).toBeTruthy()
    expect(api.apiMoDot).toHaveBeenCalledWith('t', 'Q2')
  })

  it('chỉ còn câu chờ lần gặp lại ⇒ 0 câu cần chữa, nói thật lúc này chưa có câu cần chữa ngay, nút chính về Hôm nay', async () => {
    api.apiDanhSachTuChua.mockResolvedValue({ trangThai: 'bat', ds: [
      { dotId: 'D4', qid: 'Q4', trangThai: 'cho_gap_lai_2', denHan: new Date(Date.now() + 5 * 3600_000).toISOString() },
    ] })
    const ve = vi.fn()
    render(<ManTuChua token="t" onVe={ve} />)
    const tong = await screen.findByRole('region', { name: 'Sửa lại câu em làm sai' })
    expect(within(tong).getByText('câu cần sửa').parentElement?.textContent).toBe('0câu cần sửa')
    expect(within(tong).getByText(/Lúc này chưa có câu cần sửa ngay/)).toBeTruthy()
    expect(within(tong).queryByRole('button', { name: 'Bắt đầu sửa' })).toBeNull()
    fireEvent.click(within(tong).getByRole('button', { name: 'Về Hôm nay' }))
    expect(ve).toHaveBeenCalled()
  })

  it('đã tự sửa hết ⇒ mừng mà nói thật: số câu đã tự sửa có nhãn + việc tiếp; danh sách đã sửa vẫn mở lại được', async () => {
    api.apiDanhSachTuChua.mockResolvedValue({ trangThai: 'bat', ds: [{ dotId: 'D5', qid: 'Q1', trangThai: 'da_tu_sua' }] })
    render(<ManTuChua token="t" onVe={() => {}} onTuLuyen={() => {}} />)
    expect(await screen.findByRole('heading', { name: 'Em không còn câu nào cần sửa' })).toBeTruthy()
    expect(screen.getByText(/Đã tự sửa:/).textContent).toBe('Đã tự sửa: 1 câu')
    expect(screen.getByRole('region', { name: 'Đã tự sửa: 1 câu' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Thuỷ phân ester.*Xem lại/ })).toBeTruthy()
  })
})
