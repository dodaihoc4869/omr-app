// ĐĂNG NHẬP KÈM SẢNH — NỐI DÂY Ở VỎ APP HỌC SINH (D1 vòng 2, 06/10): em đăng nhập ở màn nhẹ (AppHocSinh) ⇒ phản hồi `sanh` máy chủ đính kèm được ghi thành
// phản hồi hỏi sớm ĐÃ VỀ TRƯỚC lượt vẽ đầu của cổng (Sảnh có số ngay, không gửi lệnh hoa2-sanh); phiên cất trong máy KHÔNG chứa `sanh`; lỗi/thiếu ⇒ đường cũ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

const GOC = 'https://omr.ttadodaihoc.workers.dev'
const SANH = { ok: true, cheDo2: true, ngay: '2026-10-06', theLuc: { con: 28, tong: 40 } }
const thanTk = (token: string) => JSON.stringify({ token })
const DUONG_SANH = '/game-v2/hoa2-sanh'

const mocks = vi.hoisted(() => ({ dangNhap: vi.fn(), cong: { thay: null as null | (() => unknown) } }))
vi.mock('../src/lib/exam-db', async (goc) => ({ ...(await goc<Record<string, unknown>>()), loadScriptUrlHoacMacDinh: async () => '/test' }))
vi.mock('../src/lib/dia-chi-may-chu', async () => {
  const { ghiDiaChiDaDung } = await import('../src/lib/hoi-som')
  return { layDiaChiMayChu: async () => { ghiDiaChiDaDung(GOC); return GOC } }
})
vi.mock('../src/lib/hs-dang-nhap-api', async () => {
  const { ghiDiaChiDaDung } = await import('../src/lib/hoi-som')
  return {
    hsDangNhapKemSanhApi: async (...a: unknown[]) => { ghiDiaChiDaDung(GOC); return mocks.dangNhap(...a) },
    hsDangNhapApi: async (...a: unknown[]) => mocks.dangNhap(...a),
    hsDatMatKhauApi: async () => ({ ok: true }),
  }
})
// Cổng giả: chụp lại ĐÚNG những gì lượt vẽ đầu của Sảnh thấy (đọc đồng bộ như `useSanhHoa2` → `sanhHoiSom`).
vi.mock('../src/screens/StudentPortalScreen', async () => {
  const { xemHoiSomDaVe } = await import('../src/lib/hoi-som')
  return {
    default: function CongGia() {
      const tk = JSON.parse(localStorage.getItem('omr_student_portal_auth') ?? '{}').token as string
      const x = xemHoiSomDaVe('/game-v2/hoa2-sanh', JSON.stringify({ token: tk }))
      const o = x ? (JSON.parse(x.text) as { ok?: boolean; theLuc?: unknown }) : null
      const hopLe = !!o && o.ok === true && !!o.theLuc // như `docSanh`: phải đủ phần bắt buộc mới dùng được cho lượt vẽ đầu
      mocks.cong.thay = () => (hopLe ? o : null)
      return <div data-testid="cong">{hopLe ? 'co-so-ngay' : 'chua-co-so'}</div>
    },
  }
})
import AppHocSinh from '../src/AppHocSinh'
import { layHoiSom } from '../src/lib/hoi-som'

describe('AppHocSinh — đăng nhập kèm Sảnh', () => {
  let goiThat: ReturnType<typeof vi.fn>
  beforeEach(() => {
    localStorage.clear()
    ;(window as unknown as { __ddhHoiSom?: unknown }).__ddhHoiSom = undefined
    mocks.cong.thay = null
    goiThat = vi.fn(async (url: string) => new Response(JSON.stringify({ ok: true, url }), { status: 200 }))
    vi.stubGlobal('fetch', goiThat)
    window.fetch = goiThat as unknown as typeof fetch
    window.history.replaceState(null, '', '/hs')
  })
  afterEach(async () => {
    cleanup()
    await new Promise((r) => setTimeout(r, 30))
    localStorage.clear()
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    window.history.replaceState(null, '', '/')
  })
  const dangNhap = async () => {
    fireEvent.change(await screen.findByLabelText('Số báo danh (SBD)'), { target: { value: '99001' } })
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'mk' } })
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))
  }

  it('máy chủ đính kèm Sảnh ⇒ lượt vẽ ĐẦU của cổng đã có số (không chờ vòng mạng), KHÔNG gửi lệnh hoa2-sanh, gửi 4 lệnh Sảnh còn lại; phiên cất KHÔNG chứa `sanh`', async () => {
    mocks.dangNhap.mockResolvedValue({ ok: true, sbd: '99001', hoTen: 'Em', lop: '12A', namSinh: '2008', token: 'tk-moi', sanh: SANH })
    render(<AppHocSinh />)
    await dangNhap()
    expect(await screen.findByTestId('cong')).toHaveProperty('textContent', 'co-so-ngay')
    expect(mocks.cong.thay!()).toEqual(SANH)
    const duong = goiThat.mock.calls.map((c) => String(c[0]).replace(GOC, ''))
    expect(duong).not.toContain(DUONG_SANH)
    expect(duong.sort()).toEqual(['/hs/buoi-hoc', '/hs/ca-dang-mo', '/hs/ke-hoach-ngay', '/hs/lich-su'])
    const phien = JSON.parse(localStorage.getItem('omr_student_portal_auth')!)
    expect(phien).toEqual({ sbd: '99001', hoTen: 'Em', lop: '12A', namSinh: '2008', token: 'tk-moi' })
  })

  it('máy chủ cũ (không có `sanh`) ⇒ đường cũ y hệt: gửi đủ 5 lệnh (có hoa2-sanh), lượt vẽ đầu chưa có số', async () => {
    mocks.dangNhap.mockResolvedValue({ ok: true, sbd: '99001', hoTen: 'Em', token: 'tk-moi' })
    render(<AppHocSinh />)
    await dangNhap()
    expect(await screen.findByTestId('cong')).toHaveProperty('textContent', 'chua-co-so')
    const duong = goiThat.mock.calls.map((c) => String(c[0]).replace(GOC, ''))
    expect(duong).toContain(DUONG_SANH)
    expect(duong).toHaveLength(5)
  })

  it('lệnh hoa2-sanh sau đó (lượt hỏi của Sảnh) nhận đúng phản hồi kèm, một lần; lượt kế gửi thật', async () => {
    mocks.dangNhap.mockResolvedValue({ ok: true, sbd: '99001', hoTen: 'Em', token: 'tk-moi', sanh: SANH })
    render(<AppHocSinh />)
    await dangNhap()
    await screen.findByTestId('cong')
    // Cổng giả chỉ ĐỌC (không nhận) ⇒ lượt nhận đầu tiên của lệnh thật vẫn lấy được phản hồi kèm.
    const r = await layHoiSom(GOC + DUONG_SANH, thanTk('tk-moi'))
    expect(r && (await r.json())).toEqual(SANH)
    expect(layHoiSom(GOC + DUONG_SANH, thanTk('tk-moi'))).toBeNull()
    await waitFor(() => expect(goiThat).toHaveBeenCalledTimes(4))
  })
})
