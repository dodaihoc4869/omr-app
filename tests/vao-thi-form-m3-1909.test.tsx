// VIỆC C · C5 — form "Vào ca kiểm tra trực tuyến" của cổng học sinh mặc Material 3 (VaoThiForm).
// Đổi áo, không đổi xương: `vaoThi` (kiểm mã 4–8 chữ số, trao danh tính đã xác thực + mật khẩu ca cho màn thi) giữ nguyên; chữ, tên nút,
// `autoFocus`, chỉ nhận chữ số ở ô mã giữ nguyên; đường không phải cổng học sinh giữ đoạn JSX cũ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import StudentPortalScreen from '../src/screens/StudentPortalScreen'
import VaoThiForm from '../src/components/bang-nhiem-vu/VaoThiForm'

const mocks = vi.hoisted(() => ({ tuCong: vi.fn() }))
vi.mock('../src/screens/ExamTakeScreen', () => ({ default: (p: any) => { mocks.tuCong(p.tuCong); return <div data-testid="man-thi">Màn thi thử</div> } }))
vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => null }))
vi.mock('../src/components/BangVinhDanh', () => ({ default: () => null }))
vi.mock('../src/components/BangTinPhuHuynh', () => ({ default: () => null }))
vi.mock('../src/components/ThongBaoHocSinh', () => ({ default: () => null, noticeApi: vi.fn() }))
vi.mock('../src/game/than-thu-v2/academic-sync', () => ({ syncStudentExp: async () => {} }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrlHoacMacDinh: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({
  ...(await original<any>()),
  hsLichSuCaApi: async () => ({ ok: true, items: [] }),
  hsBtvnApi: async () => ({ ok: true, items: [] }),
  thanThuDocApi: async () => ({ ok: true, hoSo: {} }),
}))
vi.mock('../src/lib/mom-api', async (original) => ({ ...(await original<any>()), momApi: async () => ({ ok: true, items: [] }) }))

const datDuong = (d: string) => window.history.replaceState(null, '', d)
beforeEach(() => {
  localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: '12121212', hoTen: 'Đỗ Minh', lop: '12A1', namSinh: '2008', token: 'test-token' }))
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, items: [] }) }))
})
afterEach(async () => {
  cleanup()
  await new Promise((r) => setTimeout(r, 60))
  localStorage.clear()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  datDuong('/')
})
const moForm = async () => {
  fireEvent.click(await screen.findByRole('button', { name: /Vào thi/ }))
  return await screen.findByRole('dialog', { name: 'Vào phòng thi' })
}

describe('C5 · form vào phòng thi ở cổng học sinh (/hs)', () => {
  it('có form M3: tiêu đề, hai ô viền nổi, dòng SBD, nút chính; KHÔNG còn màu tím cứng của bản cũ', async () => {
    datDuong('/hs')
    render(<StudentPortalScreen />)
    const hop = await moForm()
    expect(hop.querySelector('.vtf')).toBeTruthy()
    expect(within(hop).getByRole('heading', { name: 'Vào ca kiểm tra trực tuyến' })).toBeTruthy()
    expect(within(hop).getByLabelText('Mã ca kiểm tra (thường 6 chữ số)')).toBeTruthy()
    expect(within(hop).getByLabelText('Mật khẩu ca kiểm tra (nếu ca có yêu cầu)')).toBeTruthy()
    expect(hop.querySelector('.vtf-sbd')!.textContent).toBe('Số báo danh đăng nhập của em: 12121212 (Đỗ Minh)')
    const nut = within(hop).getByRole('button', { name: 'Vào ca kiểm tra' })
    expect(nut.className).toContain('m3-nut-chinh')
    expect(nut.getAttribute('type')).toBe('submit')
    expect(hop.innerHTML).not.toMatch(/purple/)
  })

  it('ô mã: chỉ nhận chữ số, tối đa 8, tự lấy nét; bàn phím số trên điện thoại', async () => {
    datDuong('/hs')
    render(<StudentPortalScreen />)
    const hop = await moForm()
    const ma = within(hop).getByLabelText('Mã ca kiểm tra (thường 6 chữ số)') as HTMLInputElement
    expect(ma.maxLength).toBe(8)
    expect(ma.getAttribute('inputmode')).toBe('numeric')
    expect(ma.required).toBe(true)
    expect(document.activeElement).toBe(ma) // tự lấy nét ngay khi mở (bản cũ có autoFocus)
    fireEvent.change(ma, { target: { value: '54a3-9 98' } })
    expect(ma.value).toBe('543998')
  })

  it('mã quá ngắn: báo lỗi nguyên văn cũ (role=alert), không vào thi; sửa lại thì hết lỗi và vào thi', async () => {
    datDuong('/hs')
    render(<StudentPortalScreen />)
    const hop = await moForm()
    const ma = within(hop).getByLabelText('Mã ca kiểm tra (thường 6 chữ số)')
    fireEvent.change(ma, { target: { value: '123' } })
    fireEvent.submit(hop.querySelector('form')!)
    expect((await within(hop).findByRole('alert')).textContent).toBe('Vui lòng nhập mã ca kiểm tra hợp lệ (từ 4 đến 8 chữ số)')
    expect(screen.queryByTestId('man-thi')).toBeNull()
    fireEvent.change(ma, { target: { value: '543998' } })
    fireEvent.submit(hop.querySelector('form')!)
    expect(await screen.findByTestId('man-thi')).toBeTruthy()
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
  })

  it('mã hợp lệ: trao ĐÚNG danh tính đã xác thực + mật khẩu ca (đã cắt khoảng trắng) cho màn thi, không hỏi lại tên', async () => {
    datDuong('/hs')
    render(<StudentPortalScreen />)
    const hop = await moForm()
    fireEvent.change(within(hop).getByLabelText('Mã ca kiểm tra (thường 6 chữ số)'), { target: { value: '543998' } })
    fireEvent.change(within(hop).getByLabelText('Mật khẩu ca kiểm tra (nếu ca có yêu cầu)'), { target: { value: '  mk123  ' } })
    fireEvent.click(within(hop).getByRole('button', { name: 'Vào ca kiểm tra' }))
    expect(await screen.findByTestId('man-thi')).toBeTruthy()
    expect(mocks.tuCong).toHaveBeenLastCalledWith({ maCa: '543998', sbd: '12121212', hoTen: 'Đỗ Minh', namSinh: '2008', lop: '12A1', matKhau: 'mk123' })
  })

  it('không mật khẩu ca: matKhau rỗng', async () => {
    datDuong('/hs')
    render(<StudentPortalScreen />)
    const hop = await moForm()
    fireEvent.change(within(hop).getByLabelText('Mã ca kiểm tra (thường 6 chữ số)'), { target: { value: '543998' } })
    fireEvent.click(within(hop).getByRole('button', { name: 'Vào ca kiểm tra' }))
    await screen.findByTestId('man-thi')
    expect(mocks.tuCong.mock.calls.at(-1)![0].matKhau).toBe('')
  })
})

describe('C5 · thành phần độc lập và cô lập', () => {
  it('VaoThiForm: lỗi chỉ hiện khi có; thiếu họ tên thì không in ngoặc; đầu vào điều khiển được', () => {
    const doi = vi.fn()
    const nop = vi.fn((e) => e.preventDefault())
    const { container, rerender } = render(<VaoThiForm maCa="" onMaCa={doi} matKhau="" onMatKhau={() => {}} loi="" onSubmit={nop} sbd="999" />)
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(container.querySelector('.vtf-sbd')!.textContent).toBe('Số báo danh đăng nhập của em: 999')
    fireEvent.change(container.querySelector('.vtf-nhap--ma')!, { target: { value: '12x3' } })
    expect(doi).toHaveBeenCalledWith('123')
    rerender(<VaoThiForm maCa="" onMaCa={doi} matKhau="" onMatKhau={() => {}} loi="Sai mã" onSubmit={nop} sbd="999" hoTen="Nam" />)
    expect(container.querySelector('[role="alert"]')!.textContent).toBe('Sai mã')
    expect(container.querySelector('.vtf-sbd')!.textContent).toContain('(Nam)')
    fireEvent.submit(container.querySelector('form')!)
    expect(nop).toHaveBeenCalledTimes(1)
  })

  it('đường KHÔNG phải cổng học sinh (jsdom `/`): giữ NGUYÊN form cũ, không có .vtf', async () => {
    datDuong('/')
    render(<StudentPortalScreen />)
    const hop = await moForm()
    expect(hop.querySelector('.vtf')).toBeNull()
    expect(within(hop).getByRole('button', { name: 'Vào ca kiểm tra' }).className).toContain('btn-google-primary')
  })

  const css = fs.readFileSync(path.join(process.cwd(), 'src/components/bang-nhiem-vu/vao-thi-form.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  it('CSS: không mã màu cứng, mọi bộ chọn dưới .vtf, ô nhập và nút cao ≥ 56 px', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(css).not.toMatch(/\brgba?\(/)
    for (const m of css.matchAll(/([^{}]+)\{/g)) for (const b of m[1].split(',')) expect(b.trim().startsWith('.vtf'), b).toBe(true)
    expect(css).toMatch(/\.vtf-nhap\s*\{[^}]*height:\s*56px/)
    expect(css).toMatch(/\.vtf-nut\s*\{[^}]*min-height:\s*56px/)
  })
})
