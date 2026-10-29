// @vitest-environment jsdom
// SỬA CÂU — KIỂM TRA TỨC THÌ BẰNG TEM (thầy 29/10, video 09:47 «Bấm kiểm tra còn quá lâu. Phải tức thì luôn», ChuaGon.tsx + src/lib/chua-gon-luong.ts). Khoá:
//   · gon-mo cấp `sk` ⇒ «Kiểm tra» gửi theo luồng (tem); dòng TẠM hiện tấm kết quả NGAY, trước khi bản đầy đủ về;
//   · «Tiếp tục» / «Làm lại» bấm lúc bản đầy đủ chưa về ⇒ chờ nó (không mất ghi nhận «xong phần»); lần 2 mở NGAY tại máy bằng sk2, KHÔNG gọi gon-mo lần nữa;
//   · bản đầy đủ lỗi sau dòng tạm ⇒ bỏ kết quả tạm, về lại câu + báo lỗi; không tem ⇒ y như cũ (apiGonNop).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'

const api = vi.hoisted(() => ({ apiMoDot: vi.fn(), apiPhatItem: vi.fn(), apiNopItem: vi.fn(), apiXinGoiY: vi.fn(), apiCoChua: vi.fn(), apiGonMo: vi.fn(), apiGonNop: vi.fn() }))
const luong = vi.hoisted(() => ({ apiGonNopLuong: vi.fn() }))
vi.mock('../src/lib/chua-cau-sai-api', () => api)
vi.mock('../src/lib/chua-gon-luong', async (goc) => ({ ...(await goc<typeof import('../src/lib/chua-gon-luong')>()), apiGonNopLuong: luong.apiGonNopLuong }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }), xongNapDiaChi: async () => {} }))
import Man from '../src/components/chua-cau-sai/ManChuaCauSai'

const DE = { qid: 'Q', phan: 'I', text: 'Thuỷ phân hoàn toàn 8,8 gam etyl axetat bằng dung dịch NaOH vừa đủ. Khối lượng muối thu được là', choices: ['8,2 gam.', '6,8 gam.', '9,6 gam.', '4,1 gam.'], ideas: [], hinhAnh: [], tenDang: 'Thuỷ phân ester' }
const CHI_TIET = { de: { ...DE, maDe: 'DH-12', mucDo: 'hieu', sao: 0 }, dapAn: 'A', loiGiai: { chot: 'Muối CH₃COONa là 8,2 gam.' } }
const MO = { ok: true, dotId: 'D1', lan: 1, ban: 'Q', banKhac: false, tuSuaNeuDung: true, de: DE, sk: 'SK-LAN-1' }
const CHO = { timeout: 8000 }
const xong = () => (JSON.parse(localStorage.getItem('omr_tu_sua_hom_nay_10044') || '{"x":[]}') as { x: string[] }).x
const hoan = <T,>() => { let ok!: (v: T) => void; const p = new Promise<T>((r) => { ok = r }); return { p, ok } }

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: '10044', token: 't' }))
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, cau: [] }) })))
  api.apiMoDot.mockResolvedValue({ ok: true, dotId: 'D1', trangThai: 'thieu_hoc_lieu' })
  api.apiGonMo.mockResolvedValue(MO)
  document.documentElement.dataset.trong = 'hs'
})
afterEach(() => { cleanup(); vi.unstubAllGlobals(); delete document.documentElement.dataset.trong })

describe('Sửa câu: kiểm tra tức thì bằng tem', () => {
  it('đúng: tấm «Em đã tự sửa xong» hiện NGAY từ dòng tạm (kèm lời giải), «Tiếp tục» chờ bản đầy đủ rồi mới sang câu kế và ghi «xong phần»', async () => {
    const onTiep = vi.fn()
    const day = hoan<Record<string, unknown>>()
    luong.apiGonNopLuong.mockImplementation(async (_t: string, _du: unknown, tam: (k: unknown) => void) => {
      tam({ ok: true, tam: true, dotId: 'D1', lan: 1, ban: 'Q', dung: true, ket: 'tu_sua', trangThai: 'da_tu_sua', ct: { dapAn: 'A', loiGiai: CHI_TIET.loiGiai, hinhSau: [] } })
      return await day.p
    })
    render(<Man token="t" qid="Q" onVe={() => {}} onTiep={onTiep} />)
    await screen.findByRole('button', { name: 'Kiểm tra' }, CHO)
    fireEvent.click(screen.getByRole('radio', { name: /8,2/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    expect(await screen.findByRole('heading', { name: 'Em đã tự sửa xong câu này' })).toBeTruthy() // trước khi bản đầy đủ về
    expect(luong.apiGonNopLuong).toHaveBeenCalledOnce()
    expect(api.apiGonNop).not.toHaveBeenCalled()
    expect(luong.apiGonNopLuong.mock.calls[0]![1]).toMatchObject({ dotId: 'D1', ban: 'Q', traLoi: 'A', sk: 'SK-LAN-1', qid: 'Q' })
    expect(screen.getByRole('button', { name: 'Lời giải' })).toBeTruthy() // chi tiết ghép từ tem + đề đã có
    expect(xong()).toEqual([]) // chưa ghi: bản đầy đủ chưa về
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }))
    expect(onTiep).not.toHaveBeenCalled() // chờ bản đầy đủ
    await act(async () => { day.ok({ ok: true, dotId: 'D1', lan: 1, ban: 'Q', dung: true, ket: 'tu_sua', trangThai: 'da_tu_sua', nguyenTu: 2, chiTiet: CHI_TIET }) })
    expect(onTiep).toHaveBeenCalledOnce()
    expect(xong()).toEqual(['D1', 'Q'])
  })

  it('sai lần 1: tấm đỏ + gợi ý NGAY, «Làm lại câu này» mở lần 2 NGAY bằng sk2 (không gọi gon-mo), lần 2 gửi tem lần 2; sai nữa ⇒ đáp án + lời giải ngay', async () => {
    const day1 = hoan<Record<string, unknown>>()
    luong.apiGonNopLuong
      .mockImplementationOnce(async (_t: string, _du: unknown, tam: (k: unknown) => void) => {
        tam({ ok: true, tam: true, dotId: 'D1', lan: 1, ban: 'Q', dung: false, ket: 'goi_y', goiY: 'Em gạch chân điều đề hỏi.', sk2: 'SK-LAN-2' })
        return await day1.p
      })
      .mockImplementationOnce(async (_t: string, _du: unknown, tam: (k: unknown) => void) => {
        tam({ ok: true, tam: true, dotId: 'D1', lan: 2, ban: 'Q', dung: false, ket: 'loi_giai', ct: { dapAn: 'A', loiGiai: CHI_TIET.loiGiai, hinhSau: [] } })
        return { ok: true, dotId: 'D1', lan: 2, ban: 'Q', dung: false, ket: 'loi_giai', chiTiet: CHI_TIET }
      })
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    await screen.findByRole('button', { name: 'Kiểm tra' }, CHO)
    fireEvent.click(screen.getByRole('radio', { name: /6,8/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    expect(await screen.findByRole('heading', { name: 'Chưa đúng · em thử thêm một lần' })).toBeTruthy()
    expect(screen.getByText(/gạch chân điều đề hỏi/)).toBeTruthy()
    expect(screen.queryByText(/Đáp án/)).toBeNull() // gợi ý không lộ đáp án
    const lam = screen.getByRole('button', { name: 'Làm lại câu này' }) as HTMLButtonElement
    expect(lam.disabled).toBe(false) // bấm được ngay, chưa cần bản đầy đủ
    fireEvent.click(lam)
    await act(async () => { day1.ok({ ok: true, dotId: 'D1', lan: 1, ban: 'Q', dung: false, ket: 'goi_y', goiY: 'Em gạch chân điều đề hỏi.' }) }) // bản đầy đủ lần 1 về
    expect(await screen.findByText(/· lần 2/)).toBeTruthy()
    expect(api.apiGonMo).toHaveBeenCalledTimes(1) // chỉ lần mở đầu — lần 2 mở tại máy
    fireEvent.click(screen.getByRole('radio', { name: /9,6/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    expect(await screen.findByRole('heading', { name: 'Chưa đúng · xem đáp án và lời giải' })).toBeTruthy()
    expect(luong.apiGonNopLuong.mock.calls[1]![1]).toMatchObject({ sk: 'SK-LAN-2', ban: 'Q', traLoi: 'C' })
    expect(screen.getByText(/Đáp án:/)).toBeTruthy()
  })

  it('bản đầy đủ LỖI sau dòng tạm ⇒ bỏ kết quả tạm, về lại câu, báo lỗi; «Tiếp tục» đã bấm không đi tiếp', async () => {
    const onTiep = vi.fn()
    const day = hoan<Record<string, unknown>>()
    luong.apiGonNopLuong.mockImplementation(async (_t: string, _du: unknown, tam: (k: unknown) => void) => {
      tam({ ok: true, tam: true, dotId: 'D1', lan: 1, ban: 'Q', dung: true, ket: 'xong_phan', lyDo: 'cung_ngay', ct: { dapAn: 'A', loiGiai: CHI_TIET.loiGiai, hinhSau: [] } })
      return await day.p
    })
    render(<Man token="t" qid="Q" onVe={() => {}} onTiep={onTiep} />)
    await screen.findByRole('button', { name: 'Kiểm tra' }, CHO)
    fireEvent.click(screen.getByRole('radio', { name: /8,2/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    await screen.findByRole('heading', { name: 'Đúng rồi · xong phần hôm nay' })
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }))
    await act(async () => { day.ok({ ok: false, loi: 'Máy chủ bận. Em thử lại.' }) })
    expect(onTiep).not.toHaveBeenCalled()
    expect(await screen.findByRole('button', { name: 'Kiểm tra' })).toBeTruthy()
    expect(screen.getByText(/Máy chủ bận/)).toBeTruthy()
    expect(xong()).toEqual([])
  })

  it('không có tem (máy chủ cũ / tem không cấp) ⇒ y như cũ: apiGonNop, không luồng', async () => {
    api.apiGonMo.mockResolvedValue({ ...MO, sk: undefined })
    api.apiGonNop.mockResolvedValue({ ok: true, dotId: 'D1', lan: 1, ban: 'Q', dung: true, ket: 'tu_sua', trangThai: 'da_tu_sua', chiTiet: CHI_TIET })
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    await screen.findByRole('button', { name: 'Kiểm tra' }, CHO)
    fireEvent.click(screen.getByRole('radio', { name: /8,2/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    expect(await screen.findByRole('heading', { name: 'Em đã tự sửa xong câu này' })).toBeTruthy()
    expect(luong.apiGonNopLuong).not.toHaveBeenCalled()
    expect(api.apiGonNop).toHaveBeenCalledOnce()
    expect(xong()).toEqual(['D1', 'Q'])
  })
})
