// @vitest-environment jsdom
// MÀN SỬA CÂU — ĐÁP ÁN TRÊN MÁY (thầy 31/10, ChuaGon.tsx + src/lib/sua-loi-may.ts): gon-mo có `dm` ⇒
//   · «Kiểm tra» hiện kết quả NGAY từ máy em (chưa có phản hồi nào của máy chủ), gon-nop vẫn gửi ở nền (đường thường, không tem) — máy chủ chấm lại;
//   · sai lần 1 ⇒ gợi ý ngay; «Làm lại câu này» mở lần 2 tại máy (không gon-mo); lần 2 chấm ngay; lần 2 chỉ GỬI sau khi lần 1 ghi xong; bản đầy đủ lần 1 về muộn KHÔNG vẽ đè lần 2;
//   · mất mạng ⇒ giữ kết quả, báo nhẹ, xếp lần nộp chờ gửi; bản máy chủ khác máy em ⇒ theo máy chủ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { dmSua } from '../server/src/chua-gon-niem'
import type { Env } from '../server/src/kieu'
import type { PrivateQuestion } from '../src/game/than-thu-v2/core'

const api = vi.hoisted(() => ({ apiMoDot: vi.fn(), apiPhatItem: vi.fn(), apiNopItem: vi.fn(), apiXinGoiY: vi.fn(), apiCoChua: vi.fn(), apiGonMo: vi.fn(), apiGonNop: vi.fn(), apiGonMoNgay: vi.fn() }))
const luong = vi.hoisted(() => ({ apiGonNopLuong: vi.fn() }))
vi.mock('../src/lib/chua-cau-sai-api', () => api)
vi.mock('../src/lib/chua-gon-luong', async (goc) => ({ ...(await goc<typeof import('../src/lib/chua-gon-luong')>()), apiGonNopLuong: luong.apiGonNopLuong }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }), xongNapDiaChi: async () => {} }))
import Man from '../src/components/chua-cau-sai/ManChuaCauSai'

const DE = { qid: 'Q', phan: 'I', text: 'Thuỷ phân hoàn toàn 8,8 gam etyl axetat bằng dung dịch NaOH vừa đủ. Khối lượng muối thu được là', choices: ['8,2 gam.', '6,8 gam.', '9,6 gam.', '4,1 gam.'], ideas: [], hinhAnh: [], tenDang: 'Thuỷ phân ester' }
const BAN = { qid: 'Q', phan: 'I', correct: 'A', solution: { chot: 'Muối CH₃COONa là 8,2 gam.' }, hinhAnh: [] } as unknown as PrivateQuestion
const CHI_TIET = { de: { ...DE, maDe: 'DH-12', mucDo: 'hieu', sao: 0 }, dapAn: 'A', loiGiai: BAN.solution }
const CHO = { timeout: 8000 }
const hoan = <T,>() => { let ok!: (v: T) => void; const p = new Promise<T>((r) => { ok = r }); return { p, ok } }
let MO: Record<string, unknown>

beforeEach(async () => {
  vi.clearAllMocks()
  localStorage.clear()
  localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: '10044', token: 't' }))
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, cau: [] }) })))
  const dm = await dmSua({ MA_BI_MAT: 'bi-mat-thu' } as unknown as Env, '10044', { dotId: 'D1', ban: BAN, lan: 1, tuSua: true, docGan: false, goiY: 'Em gạch chân điều đề hỏi.' })
  MO = { ok: true, dotId: 'D1', lan: 1, ban: 'Q', banKhac: false, tuSuaNeuDung: true, de: DE, sk: 'SK-LAN-1', dm }
  api.apiMoDot.mockResolvedValue({ ok: true, dotId: 'D1', trangThai: 'thieu_hoc_lieu' })
  api.apiGonMo.mockResolvedValue(MO)
  document.documentElement.dataset.trong = 'hs'
})
afterEach(() => { cleanup(); vi.unstubAllGlobals(); delete document.documentElement.dataset.trong })

describe('Sửa câu: đáp án trên máy', () => {
  it('đúng: «Em đã tự sửa xong» NGAY từ máy em (máy chủ chưa trả gì); gon-nop đường thường ở nền; bản đầy đủ về thay thế', async () => {
    const day = hoan<Record<string, unknown>>()
    api.apiGonNop.mockImplementation(() => day.p)
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    await screen.findByRole('button', { name: 'Kiểm tra' }, CHO)
    fireEvent.click(screen.getByRole('radio', { name: /8,2/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    expect(await screen.findByRole('heading', { name: 'Em đã tự sửa xong câu này' })).toBeTruthy()
    expect(luong.apiGonNopLuong).not.toHaveBeenCalled()
    expect(api.apiGonNop).toHaveBeenCalledWith('t', 'D1', 'Q', 'A', expect.any(String), 'Q')
    await act(async () => { day.ok({ ok: true, dotId: 'D1', lan: 1, ban: 'Q', dung: true, ket: 'tu_sua', trangThai: 'da_tu_sua', nguyenTu: 2, chiTiet: CHI_TIET }) })
    expect(screen.getByRole('heading', { name: 'Em đã tự sửa xong câu này' })).toBeTruthy()
  })

  it('bản máy chủ khác máy em ⇒ theo máy chủ', async () => {
    api.apiGonNop.mockResolvedValue({ ok: true, dotId: 'D1', lan: 1, ban: 'Q', dung: true, ket: 'xong_phan', lyDo: 'cung_ngay', chiTiet: CHI_TIET })
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    await screen.findByRole('button', { name: 'Kiểm tra' }, CHO)
    fireEvent.click(screen.getByRole('radio', { name: /8,2/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    expect(await screen.findByText(/xong phần hôm nay/i, undefined, CHO)).toBeTruthy()
  })

  it('sai lần 1 ⇒ gợi ý NGAY; lần 2 mở + chấm tại máy; lần 2 gửi SAU lần 1; bản đầy đủ lần 1 về muộn không vẽ đè lần 2', async () => {
    const day1 = hoan<Record<string, unknown>>()
    api.apiGonNop
      .mockImplementationOnce(() => day1.p)
      .mockResolvedValueOnce({ ok: true, dotId: 'D1', lan: 2, ban: 'Q', dung: false, ket: 'loi_giai', chiTiet: CHI_TIET })
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    await screen.findByRole('button', { name: 'Kiểm tra' }, CHO)
    fireEvent.click(screen.getByRole('radio', { name: /6,8/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    expect(await screen.findByRole('heading', { name: 'Chưa đúng · em thử thêm một lần' })).toBeTruthy()
    expect(screen.getByText(/gạch chân điều đề hỏi/)).toBeTruthy()
    expect(screen.queryByText(/Đáp án/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Làm lại câu này' }))
    expect(await screen.findByText(/· lần 2/)).toBeTruthy()
    expect(api.apiGonMo).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('radio', { name: /9,6/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    expect(await screen.findByRole('heading', { name: 'Chưa đúng · xem đáp án và lời giải' })).toBeTruthy() // chấm tại máy, lần 1 chưa ghi xong
    expect(api.apiGonNop).toHaveBeenCalledTimes(1) // lần 2 chờ lượt ghi lần 1
    await act(async () => { day1.ok({ ok: true, dotId: 'D1', lan: 1, ban: 'Q', dung: false, ket: 'goi_y', goiY: 'Em gạch chân điều đề hỏi.' }) })
    await act(async () => { await new Promise((r) => setTimeout(r, 20)) })
    expect(api.apiGonNop).toHaveBeenCalledTimes(2)
    expect(api.apiGonNop.mock.calls[1]!.slice(1, 4)).toEqual(['D1', 'Q', 'C'])
    expect(api.apiGonNop.mock.calls[1]![4]).not.toBe(api.apiGonNop.mock.calls[0]![4]) // lần 2 khoá chống lặp riêng
    expect(screen.getByRole('heading', { name: 'Chưa đúng · xem đáp án và lời giải' })).toBeTruthy() // không bị lần 1 vẽ đè
  })

  it('mất mạng ⇒ giữ kết quả trên màn, báo nhẹ, xếp lần nộp chờ gửi', async () => {
    api.apiGonNop.mockResolvedValue({ ok: false })
    render(<Man token="t" qid="Q" onVe={() => {}} />)
    await screen.findByRole('button', { name: 'Kiểm tra' }, CHO)
    fireEvent.click(screen.getByRole('radio', { name: /8,2/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    expect(await screen.findByRole('heading', { name: 'Em đã tự sửa xong câu này' })).toBeTruthy()
    expect(await screen.findByText(/mất mạng/, undefined, { timeout: 9000 })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Em đã tự sửa xong câu này' })).toBeTruthy()
    const cho = JSON.parse(localStorage.getItem('omr_sua_cho_10044') || '[]') as { dotId: string; traLoi: string }[]
    expect(cho).toMatchObject([{ dotId: 'D1', traLoi: 'A' }])
  }, 15_000)
})
