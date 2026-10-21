// @vitest-environment jsdom
// HỒ SƠ LÀM BÀI TẢI TỨC THÌ (thầy 21/10: "hồ sơ làm bài của học sinh load quá chậm, bạn cho load tức thì đi").
// Đo thật (wrangler tail 6 phút): máy chủ chờ D1 ~10 giây cho `/gv/lich-su-lam-cau` và `/gv/ho-so-thai-do` (CPU chỉ 21–47 ms) vì hai lệnh nặng chồng nhau cùng các lệnh nặng khác của màn Hôm nay.
// Nay tấm: (1) khung đầu xin 150 lượt mới nhất — tổng, câu sai, Mức làm vẫn tính trên mọi lượt máy chủ đọc; (2) Thái độ làm bài hỏi SAU khung đầu; (3) KHÔNG tự nạp thêm lượt cũ (mỗi lần xin là một lần
// đọc nặng cả cửa sổ trên D1) — chỉ khi thầy bấm «Tải thêm lượt cũ hơn»; (4) mở lại em vừa xem trong 5 phút ⇒ vẽ NGAY bản trong bộ nhớ rồi đọc mới nền (lỗi nền bỏ qua).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'

const m = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/exam-db', () => ({ loadScriptUrl: async () => 'https://gia/exec', loadTeacherSecret: async () => 'mat', loadExamSources: async () => [] }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => m.goi(duong, body) }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu-gia.example.com/', quenDiaChiMayChu: () => {} }))

import { hoSoThaiDoGia } from '../scripts/chup-v2/gia/bai-hang-ngay'
import { lichSuGia } from '../scripts/chup-v2/gia/lich-su-lam-cau'
const { default: HoSoLamCauEm, xoaDemHoSoLamCau, GIOI_HAN_KHUNG_DAU } = await import('../src/components/chien-dich/HoSoLamCauEm')

const SBD = '11010'
const TD = hoSoThaiDoGia(SBD)
const LS = lichSuGia(SBD, TD.em.hoTen)
const em = { sbd: SBD, ten: TD.em.hoTen, khoi: '12' }
const goiLichSu = () => m.goi.mock.calls.filter(([d]) => d === '/gv/lich-su-lam-cau').map(([, b]) => b as Record<string, unknown>)
const goiThaiDo = () => m.goi.mock.calls.filter(([d]) => d === '/gv/ho-so-thai-do')

beforeEach(() => {
  xoaDemHoSoLamCau()
  m.goi.mockReset()
})
afterEach(() => cleanup())

describe('HoSoLamCauEm — tải tức thì', () => {
  it('khung đầu xin 150 lượt; Thái độ làm bài chỉ hỏi SAU khi khung đầu về; còn lượt cũ ⇒ KHÔNG tự nạp thêm', async () => {
    let traKhungDau: (v: unknown) => void = () => {}
    m.goi.mockImplementation((duong: string, b: Record<string, unknown>) => {
      if (duong === '/gv/ho-so-thai-do') return Promise.resolve({ ok: true, du: TD })
      if (duong === '/gv/lich-su-lam-cau') return b.gioiHan ? new Promise((r) => { traKhungDau = r }) : Promise.resolve({ ok: true, du: LS })
      return Promise.resolve({ ok: false, loai: 'chua_co_lenh', chu: 'x' })
    })
    render(<HoSoLamCauEm em={em} onDong={() => {}} />)
    await screen.findByRole('dialog')
    await waitFor(() => expect(goiLichSu()).toEqual([{ sbd: SBD, gioiHan: GIOI_HAN_KHUNG_DAU }]))
    expect(goiThaiDo()).toHaveLength(0) // khung đầu chưa về ⇒ chưa hỏi Thái độ
    traKhungDau({ ok: true, du: { ...LS, conNua: true } })
    await screen.findByText('Số lượt làm câu') // khung đầu đã vẽ
    await waitFor(() => expect(goiThaiDo()).toHaveLength(1))
    await new Promise((r) => setTimeout(r, 50))
    expect(goiLichSu()).toEqual([{ sbd: SBD, gioiHan: GIOI_HAN_KHUNG_DAU }]) // còn lượt cũ nhưng KHÔNG tự xin thêm
  })
  it('khung đầu đã đủ (không còn lượt cũ) ⇒ KHÔNG xin thêm lần nào', async () => {
    m.goi.mockImplementation(async (duong: string) => (duong === '/gv/ho-so-thai-do' ? { ok: true, du: TD } : duong === '/gv/lich-su-lam-cau' ? { ok: true, du: { ...LS, conNua: false } } : { ok: false, loai: 'chua_co_lenh', chu: 'x' }))
    render(<HoSoLamCauEm em={em} onDong={() => {}} />)
    await screen.findByText('Số lượt làm câu')
    await waitFor(() => expect(goiThaiDo()).toHaveLength(1))
    expect(goiLichSu()).toHaveLength(1)
  })
  it('mở lại em vừa xem (≤ 5 phút) ⇒ vẽ NGAY bản trong bộ nhớ (không khung xương), đọc mới nền; lỗi nền KHÔNG hiện thông báo lỗi', async () => {
    m.goi.mockImplementation(async (duong: string) => (duong === '/gv/ho-so-thai-do' ? { ok: true, du: TD } : duong === '/gv/lich-su-lam-cau' ? { ok: true, du: { ...LS, conNua: false } } : { ok: false, loai: 'chua_co_lenh', chu: 'x' }))
    const lan1 = render(<HoSoLamCauEm em={em} onDong={() => {}} />)
    await screen.findByText('Số lượt làm câu')
    await waitFor(() => expect(goiThaiDo()).toHaveLength(1))
    lan1.unmount()
    m.goi.mockReset()
    m.goi.mockImplementation(() => new Promise(() => {})) // máy chủ không trả lời nữa
    render(<HoSoLamCauEm em={em} onDong={() => {}} />)
    const tam = await screen.findByRole('dialog')
    expect(within(tam).getByText('Số lượt làm câu')).toBeTruthy() // vẽ ngay từ bộ nhớ, đồng bộ
    expect(within(tam).getByText(/^Thái độ làm bài ·/)).toBeTruthy()
    await waitFor(() => expect(goiLichSu()).toEqual([{ sbd: SBD, gioiHan: Math.max(GIOI_HAN_KHUNG_DAU, LS.lan.length) }])) // đọc mới nền, đúng số dòng đang hiện (không rút ngắn)
    expect(within(tam).queryByRole('alert')).toBeNull()
  })
  it('em khác không dùng bản của em này; sau 5 phút bản bộ nhớ hết hạn', async () => {
    m.goi.mockImplementation(async (duong: string) => (duong === '/gv/ho-so-thai-do' ? { ok: true, du: TD } : duong === '/gv/lich-su-lam-cau' ? { ok: true, du: { ...LS, conNua: false } } : { ok: false, loai: 'chua_co_lenh', chu: 'x' }))
    const lan1 = render(<HoSoLamCauEm em={em} onDong={() => {}} />)
    await screen.findByText('Số lượt làm câu')
    lan1.unmount()
    m.goi.mockReset()
    m.goi.mockImplementation(() => new Promise(() => {}))
    render(<HoSoLamCauEm em={{ ...em, sbd: '99999' }} onDong={() => {}} />)
    const tam = await screen.findByRole('dialog')
    expect(within(tam).queryByText('Số lượt làm câu')).toBeNull() // em khác: chưa có gì ⇒ khung xương
    cleanup()
    const t0 = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(t0 + 6 * 60_000)
    render(<HoSoLamCauEm em={em} onDong={() => {}} />)
    const tam2 = await screen.findByRole('dialog')
    expect(within(tam2).queryByText('Số lượt làm câu')).toBeNull() // quá 5 phút ⇒ hết hạn
    vi.restoreAllMocks()
  })
})
