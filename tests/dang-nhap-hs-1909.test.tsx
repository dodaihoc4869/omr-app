// Form ĐĂNG NHẬP học sinh + form đặt mật khẩu lần đầu (Code 4 đo Chromium thật 390 px: ô 292×42, nút mắt 16×16 không tên, nút 46 px,
// <label> không gắn ô nhập). Sửa: mọi đích chạm ≥ 48 px, <label htmlFor> ↔ id, nút mắt 48×48 có aria-label Hiện/Ẩn mật khẩu.
// jsdom không đo được pixel: khoá ở mức lớp/thuộc tính (số đo thật nằm ở bộ chụp Chromium); luồng đăng nhập cũ không đổi.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import StudentPortalScreen from '../src/screens/StudentPortalScreen'

const mocks = vi.hoisted(() => ({ dangNhap: vi.fn(), datMatKhau: vi.fn() }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => null }))
vi.mock('../src/components/BangVinhDanh', () => ({ default: () => null }))
vi.mock('../src/components/BangTinPhuHuynh', () => ({ default: () => null }))
vi.mock('../src/components/ThongBaoHocSinh', () => ({ default: () => null, noticeApi: vi.fn() }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrlHoacMacDinh: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({
  ...(await original<any>()),
  hsDangNhapApi: (...a: any[]) => mocks.dangNhap(...a),
  hsDatMatKhauApi: (...a: any[]) => mocks.datMatKhau(...a),
}))

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', '/hs')
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, items: [] }) })))
  mocks.dangNhap.mockImplementation(async (_u: string, sbd: string) => (sbd === '111' ? { ok: false, chuaCoMatKhau: true } : { ok: true, sbd, hoTen: 'Đỗ Minh', lop: '12A1', token: 'tk-moi' }))
  mocks.datMatKhau.mockResolvedValue({ ok: true })
})
afterEach(async () => {
  cleanup()
  await new Promise((r) => setTimeout(r, 60))
  localStorage.clear()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  window.history.replaceState(null, '', '/')
})
const cao48 = (el: Element) => /(^|\s)min-h-\[48px\](\s|$)/.test(el.className)

describe('form đăng nhập học sinh', () => {
  it('ô SBD và ô mật khẩu: <label> gắn đúng ô (getByLabelText), cao ≥ 48 px; nút Đăng nhập cao ≥ 48 px', async () => {
    render(<StudentPortalScreen />)
    const sbd = (await screen.findByLabelText('Số báo danh (SBD)')) as HTMLInputElement
    expect(sbd.id).toBe('hs-dn-sbd')
    expect(cao48(sbd)).toBe(true)
    const mk = screen.getByLabelText('Mật khẩu') as HTMLInputElement
    expect(mk.id).toBe('hs-dn-mat-khau')
    expect(mk.type).toBe('password')
    expect(cao48(mk)).toBe(true)
    expect(mk.className).toContain('pr-12') // chừa chỗ cho nút mắt 48 px, chữ không chạy dưới nút
    expect(cao48(screen.getByRole('button', { name: 'Đăng nhập' }))).toBe(true)
    // chữ, gợi ý giữ nguyên
    expect(sbd.placeholder).toBe('Ví dụ: 110234 hoặc 12026')
    expect(mk.placeholder).toBe('Nhập mật khẩu của em…')
    // Thầy chốt 21/09 (H5): màn đăng nhập KHÔNG in mật khẩu mặc định; bàn phím số cho ô SBD; "…" thay "...".
    expect(sbd.getAttribute('inputmode')).toBe('numeric')
    expect(document.body.textContent).not.toContain('12121212')
    expect(screen.getByText('Quên mật khẩu: nhắn thầy để đặt lại.')).toBeTruthy()
  })

  it('nút mắt: 48×48, có tên "Hiện mật khẩu" ↔ "Ẩn mật khẩu" đổi theo trạng thái, đổi kiểu ô mật khẩu; là button type=button (không nộp form)', async () => {
    render(<StudentPortalScreen />)
    const mk = (await screen.findByLabelText('Mật khẩu')) as HTMLInputElement
    const mat = screen.getByRole('button', { name: 'Hiện mật khẩu' })
    expect(mat.getAttribute('type')).toBe('button')
    expect(mat.className).toMatch(/\bw-12\b/)
    expect(mat.className).toMatch(/\bh-12\b/)
    fireEvent.click(mat)
    expect(mk.type).toBe('text')
    const an = screen.getByRole('button', { name: 'Ẩn mật khẩu' })
    fireEvent.click(an)
    expect(mk.type).toBe('password')
    expect(screen.queryByRole('button', { name: 'Ẩn mật khẩu' })).toBeNull()
    expect(mocks.dangNhap).not.toHaveBeenCalled()
  })

  it('luồng đăng nhập KHÔNG đổi: nhập SBD + mật khẩu → gọi API đúng tham số → lưu phiên → vào Bảng nhiệm vụ', async () => {
    const { container } = render(<StudentPortalScreen />)
    fireEvent.change(await screen.findByLabelText('Số báo danh (SBD)'), { target: { value: ' 12121212 ' } })
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: ' matkhau ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    await waitFor(() => expect(mocks.dangNhap).toHaveBeenCalledWith('/test', '12121212', 'matkhau'))
    await waitFor(() => expect(JSON.parse(localStorage.getItem('omr_student_portal_auth')!).token).toBe('tk-moi'))
    await waitFor(() => expect(container.querySelector('.bnv')).toBeTruthy())
  })

  it('đường KHÔNG có mật khẩu (SBD 111): hiện form đặt mật khẩu lần đầu với ô + nút ≥ 48 px và <label> gắn ô', async () => {
    render(<StudentPortalScreen />)
    fireEvent.change(await screen.findByLabelText('Số báo danh (SBD)'), { target: { value: '111' } })
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    const moi = (await screen.findByLabelText('Mật khẩu mới')) as HTMLInputElement
    const xn = screen.getByLabelText('Xác nhận mật khẩu') as HTMLInputElement
    expect([moi.id, xn.id]).toEqual(['hs-mk-moi', 'hs-mk-xac-nhan'])
    expect(cao48(moi) && cao48(xn)).toBe(true)
    expect(cao48(screen.getByRole('button', { name: 'Quay lại' }))).toBe(true)
    expect(cao48(screen.getByRole('button', { name: /Xác nhận & Đăng nhập/ }))).toBe(true)
    fireEvent.change(moi, { target: { value: 'abcdef' } })
    fireEvent.change(xn, { target: { value: 'abcdef' } })
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận & Đăng nhập/ }))
    await waitFor(() => expect(mocks.datMatKhau).toHaveBeenCalled())
  })
})
