// Máy chủ ĐANG LÀM MỚI (reset 21/09): đóng băng trả HTTP 200 `{ ok:false, error, dangLamMoi:true }` (docs/moc-reset-1909.md mục 2).
// Đó KHÔNG phải lỗi đăng nhập/mất mạng ⇒ app: GIỮ phiên, GIỮ bản nhớ + nháp, hiện một dải M3 nhẹ (chữ 0.Planer chốt), tự thử lại theo
// nhịp 60 s, dải biến mất ngay khi máy chủ trả bình thường. Lỗi mạng thường KHÔNG bật dải.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import StudentPortalScreen from '../src/screens/StudentPortalScreen'
import ParentPortalScreen from '../src/screens/ParentPortalScreen'
import BangNhiemVu from '../src/components/bang-nhiem-vu/BangNhiemVu'
import { tuKeHoachNgay } from '../src/lib/nhiem-vu-adapter'
import { laDangLamMoi, taiKeHoachNgay, taiKeHoachNgayChiTiet, useKeHoachNgay } from '../src/components/bang-nhiem-vu/may-chu'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => null }))
vi.mock('../src/components/BangVinhDanh', () => ({ default: () => null }))
vi.mock('../src/components/BangTinPhuHuynh', () => ({ default: () => null }))
vi.mock('../src/components/ThongBaoHocSinh', () => ({ default: () => null, noticeApi: vi.fn() }))
vi.mock('../src/game/than-thu-v2/academic-sync', () => ({ syncStudentExp: async () => {} }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrl: async () => '/test', loadScriptUrlHoacMacDinh: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({
  ...(await original<any>()),
  tenTheoSbd: async () => ({ sbd: '12121212', hoTen: 'Đỗ Minh', lop: '12A1', tenCa: '' }),
  hsLichSuCaApi: async () => ({ ok: true, items: [] }),
  hsBtvnApi: async () => ({ ok: true, items: [] }),
  hsCauSaiApi: async () => ({ ok: true, items: [] }),
  thanThuDocApi: async () => ({ ok: true, hoSo: {} }),
}))
vi.mock('../src/lib/mom-api', async (original) => ({ ...(await original<any>()), migrateMom: async () => {}, momApi: async () => ({ ok: true, items: [] }) }))

const NOW = Date.now()
const gio = (h: number) => new Date(NOW + h * 3600_000).toISOString()
const KE_HOACH = {
  ok: true,
  ngay: '2026-09-19',
  nganSach: { mucTieuCau: 12, toiThieuCau: 6, vanTocGiay: 78, vanTocNguon: 'do', ghiChuVanToc: '' },
  viec: [
    { id: 'on_lai:2026-09-19', loai: 'on_lai', soCau: 3, thuTu: 1, batBuoc: false, khan: false, cong: null, hien: true, nhan: 'bu', trangThai: 'cho', ghiChu: 'Ôn 3 câu đã tới hạn nhắc lại', chiTiet: { qid: ['a', 'b', 'c'] } },
  ],
  canhBao: [],
  quaHan: [],
  tienBo: { daLamCau: 2, lenBac: 1, tutBac: 0, dat: false, toiThieuCau: 6, conThieu: 4 },
  chuoiDat: 0,
  lanNghi: false,
  capNhatLuc: gio(-0.1),
}
const DONG_BANG = { ok: false, error: 'Hệ thống đang làm mới, thử lại sau 1 phút', dangLamMoi: true, serverNow: NOW }

let phanHoi: () => { nem?: boolean; body: any } = () => ({ body: KE_HOACH })
let soLanGoi = 0
beforeEach(() => {
  phanHoi = () => ({ body: KE_HOACH })
  soLanGoi = 0
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const duong = new URL(String(url)).pathname
      if (duong === '/hs/ke-hoach-ngay') {
        soLanGoi++
        const r = phanHoi()
        if (r.nem) throw new Error('mất mạng')
        return { ok: true, status: 200, json: async () => r.body }
      }
      if (duong === '/hs/ca-dang-mo') return { ok: true, status: 200, json: async () => ({ ok: true, coCaMo: false, soCa: 0 }) }
      return { ok: true, status: 200, json: async () => ({ ok: true, items: [], winners: [] }) }
    }),
  )
})
afterEach(async () => {
  cleanup()
  await new Promise((r) => setTimeout(r, 60))
  localStorage.clear()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  window.history.replaceState(null, '', '/')
})

const DAI = () => document.querySelector('[data-vung="dang-lam-moi"]') as HTMLElement | null

describe('nhận diện phản hồi đang làm mới', () => {
  it('CHỈ `dangLamMoi === true` (boolean) mới tính: chuỗi "true", số 1, vắng, false, null, mảng đều không', () => {
    expect(laDangLamMoi(DONG_BANG)).toBe(true)
    expect(laDangLamMoi({ dangLamMoi: true })).toBe(true)
    for (const x of [{ dangLamMoi: 'true' }, { dangLamMoi: 1 }, { dangLamMoi: false }, { ok: false }, {}, null, undefined, [], 'dangLamMoi', 0]) expect(laDangLamMoi(x)).toBe(false)
  })

  it('taiKeHoachNgayChiTiet: đóng băng ⇒ {keHoach:null, dangLamMoi:true}; bình thường ⇒ kế hoạch + false; lỗi mạng / 500 ⇒ null + false; taiKeHoachNgay vẫn trả null khi đóng băng', async () => {
    phanHoi = () => ({ body: DONG_BANG })
    expect(await taiKeHoachNgayChiTiet({ token: 'tk' })).toEqual({ keHoach: null, dangLamMoi: true })
    expect(await taiKeHoachNgay({ token: 'tk' })).toBeNull()
    phanHoi = () => ({ body: KE_HOACH })
    const ok = await taiKeHoachNgayChiTiet({ token: 'tk' })
    expect(ok.dangLamMoi).toBe(false)
    expect(ok.keHoach?.tienBo.daLamCau).toBe(2)
    phanHoi = () => ({ nem: true, body: null })
    expect(await taiKeHoachNgayChiTiet({ token: 'tk' })).toEqual({ keHoach: null, dangLamMoi: false })
    phanHoi = () => ({ body: { ok: false, error: 'lỗi khác' } })
    expect(await taiKeHoachNgayChiTiet({ token: 'tk' })).toEqual({ keHoach: null, dangLamMoi: false })
  })

  it('phản hồi đóng băng KHÔNG làm gì tới bộ nhớ: không có `mocReset` ⇒ phiên đăng nhập, bản nhớ kế hoạch, nháp Mẹ giao, mốc cũ còn nguyên', async () => {
    const seed: Record<string, string> = {
      omr_student_portal_auth: JSON.stringify({ sbd: 'test', hoTen: 'Em thử', token: 'tk' }),
      'omr_bnv_ke_hoach:test': '{"gia":"tri"}',
      omr_mom_draft_M1_test: '{"cauTraLoi":{"q1":"A"}}',
      omr_moc_reset: '2026-09-14',
      ddh_id_thiet_bi: 'thiet-bi-1',
    }
    for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v)
    phanHoi = () => ({ body: DONG_BANG })
    await taiKeHoachNgayChiTiet({ token: 'tk' })
    for (const [k, v] of Object.entries(seed)) expect(localStorage.getItem(k), k).toBe(v)
  })
})

describe('hook useKeHoachNgay: cờ dangLamMoi', () => {
  it('đóng băng ngay lần đầu: daXong nhưng chưa có kế hoạch, dangLamMoi bật, KHÔNG là "cu"; hồi lại thì tắt; giữ bản cuối khi đóng băng lần sau; lỗi mạng thường thì tắt cờ', async () => {
    phanHoi = () => ({ body: DONG_BANG })
    const { result, rerender } = renderHook(({ n }) => useKeHoachNgay({ token: 'tk' }, true, n), { initialProps: { n: 0 } })
    expect(result.current).toMatchObject({ keHoach: null, daXong: false, dangLamMoi: false })
    await waitFor(() => expect(result.current.daXong).toBe(true))
    expect(result.current).toMatchObject({ keHoach: null, cu: false, dangLamMoi: true })

    phanHoi = () => ({ body: KE_HOACH })
    rerender({ n: 1 })
    await waitFor(() => expect(result.current.keHoach).not.toBeNull())
    expect(result.current).toMatchObject({ cu: false, dangLamMoi: false })

    phanHoi = () => ({ body: DONG_BANG })
    rerender({ n: 2 })
    await waitFor(() => expect(result.current.dangLamMoi).toBe(true))
    expect(result.current.keHoach?.tienBo.daLamCau).toBe(2) // vẫn giữ bản cuối
    expect(result.current.cu).toBe(true)

    phanHoi = () => ({ nem: true, body: null })
    rerender({ n: 3 })
    await waitFor(() => expect(result.current.dangLamMoi).toBe(false))
    expect(result.current.cu).toBe(true)
  })
})

describe('dải "đang làm mới" trên Bảng nhiệm vụ', () => {
  const duLieu = () => tuKeHoachNgay(KE_HOACH as any, Date.now(), {})
  it('học sinh: đúng chữ 0.Planer chốt, role=status, có mặt trước phần việc; phụ huynh: "Con"; đang tải skeleton hoặc không có cờ thì KHÔNG hiện', () => {
    const { rerender, container } = render(<BangNhiemVu vaiTro="hocsinh" hoTen="Đỗ Minh" now={NOW} duLieu={duLieu()} dangLamMoi />)
    const dai = DAI()!
    expect(dai.getAttribute('role')).toBe('status')
    expect(dai.textContent).toContain('Hệ thống đang làm mới, khoảng 1–5 phút.')
    expect(dai.textContent).toContain('Em cứ để app mở, app tự vào lại.')
    // "1–5 phút" không bị ngắt dòng giữa dấu gạch (ảnh 360 px từng tách "1–" / "5 phút")
    expect(dai.querySelector('.bnv-dang-lam-moi-so')!.textContent).toBe('1–5 phút')
    expect(dai.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true')
    // đứng trước phần việc (dòng tiến độ) — bắt buộc có phần tử này, không để khẳng định lặng lẽ bị bỏ qua
    const tienDo = container.querySelector('[data-vung="tien-do"]')
    expect(tienDo).toBeTruthy()
    expect(dai.compareDocumentPosition(tienDo!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    rerender(<BangNhiemVu vaiTro="phuhuynh" hoTen="Đỗ Minh" now={NOW} duLieu={duLieu()} dangLamMoi />)
    expect(DAI()!.textContent).toContain('Con cứ để app mở, app tự vào lại.')
    expect(DAI()!.textContent).not.toContain('Em cứ')
    rerender(<BangNhiemVu vaiTro="hocsinh" hoTen="Đỗ Minh" now={NOW} duLieu={duLieu()} dangLamMoi dangTai />)
    expect(DAI()).toBeNull()
    rerender(<BangNhiemVu vaiTro="hocsinh" hoTen="Đỗ Minh" now={NOW} duLieu={duLieu()} />)
    expect(DAI()).toBeNull()
    rerender(<BangNhiemVu vaiTro="hocsinh" hoTen="Đỗ Minh" now={NOW} duLieu={duLieu()} dangLamMoi={false} />)
    expect(DAI()).toBeNull()
  })

  it('CSS: chỉ đọc biến --m3-*, không mã màu cứng, không position:fixed; mọi phần tử trong dải có mặt trong tệp', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/components/bang-nhiem-vu/bang-nhiem-vu.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    const luat = css.match(/\.bnv-dang-lam-moi[^{}]*\{[^}]*\}/g) || []
    expect(luat.length).toBeGreaterThanOrEqual(5)
    expect(luat.join('\n')).toMatch(/\.bnv-dang-lam-moi-so\s*\{[^}]*white-space:\s*nowrap/)
    for (const l of luat) {
      expect(l, l).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|position:\s*fixed/)
    }
    expect(luat.join('\n')).toMatch(/background:\s*var\(--m3-secondary-container\)/)
  })
})

describe('StudentPortalScreen thật khi máy chủ đang làm mới', () => {
  beforeEach(() => {
    localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: 'test', hoTen: 'Em thử', token: 'test-token' }))
  })

  it('hiện dải, KHÔNG đăng xuất (phiên còn), KHÔNG dọn bản nhớ; máy chủ trả lại bình thường (khi quay lại tab) thì dải biến mất', async () => {
    localStorage.setItem('omr_mom_draft_M1_test', '{"cauTraLoi":{"q1":"B"}}')
    phanHoi = () => ({ body: DONG_BANG })
    const { container } = render(<StudentPortalScreen />)
    await waitFor(() => expect(DAI()).toBeTruthy())
    expect(DAI()!.textContent).toContain('Em cứ để app mở, app tự vào lại.')
    expect(container.querySelector('.bnv')).toBeTruthy()
    expect(JSON.parse(localStorage.getItem('omr_student_portal_auth')!).token).toBe('test-token')
    expect(localStorage.getItem('omr_mom_draft_M1_test')).toBe('{"cauTraLoi":{"q1":"B"}}')
    expect(screen.queryByRole('button', { name: /Đăng nhập|Vào xem/ })).toBeNull()

    phanHoi = () => ({ body: KE_HOACH })
    const truoc = soLanGoi
    act(() => {
      window.dispatchEvent(new Event('focus'))
    })
    await waitFor(() => expect(soLanGoi).toBeGreaterThan(truoc))
    await waitFor(() => expect(DAI()).toBeNull())
    expect(container.querySelector('.bnv')!.getAttribute('data-nguon')).toBe('ke_hoach_ngay')
  })

  it('máy chủ bình thường: không có dải; lỗi mạng thường: không có dải (chỉ rơi về trợ lý như cũ)', async () => {
    const a = render(<StudentPortalScreen />)
    await waitFor(() => expect(a.container.querySelector('.bnv')!.getAttribute('data-nguon')).toBe('ke_hoach_ngay'))
    expect(DAI()).toBeNull()
    a.unmount()
    phanHoi = () => ({ nem: true, body: null })
    const b = render(<StudentPortalScreen />)
    await waitFor(() => expect(b.container.querySelector('.bnv')!.getAttribute('data-nguon')).toBe('tro_ly'))
    expect(DAI()).toBeNull()
  })
})

describe('ParentPortalScreen thật khi máy chủ đang làm mới', () => {
  it('nối đúng cờ vào Bảng nhiệm vụ của phụ huynh: "Con cứ để app mở…", giữ SBD đã đăng nhập', async () => {
    window.history.replaceState(null, '', '/?vai=phuhuynh')
    localStorage.setItem('omr_ph_sbd', '12121212')
    phanHoi = () => ({ body: DONG_BANG })
    render(<ParentPortalScreen />)
    await waitFor(() => expect(DAI()).toBeTruthy())
    expect(DAI()!.textContent).toContain('Con cứ để app mở, app tự vào lại.')
    expect(localStorage.getItem('omr_ph_sbd')).toBe('12121212')
  })
})
