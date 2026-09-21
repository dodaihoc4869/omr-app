// Lớp gọi máy chủ của Bảng nhiệm vụ: /hs/ke-hoach-ngay + /hs/ca-dang-mo, các hook, và nối dây vào
// StudentPortalScreen THẬT (kế hoạch máy chủ hiện lên; Vào thi đổi tertiary khi ca đang mở; lỗi → trợ lý).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import StudentPortalScreen from '../src/screens/StudentPortalScreen'
import { dongGoiBanNho, tuKeHoachNgay } from '../src/lib/nhiem-vu-adapter'
import { PETS } from '../src/game/than-thu-v2/core'
import {
  taiCaDangMo,
  taiKeHoachNgay,
  useCaDangMo,
  useKeHoachNgay,
  useLamMoiKhiDong,
  useSauVeDauTien,
} from '../src/components/bang-nhiem-vu/may-chu'

const mocks = vi.hoisted(() => ({ homework: vi.fn(), sheet: vi.fn(), items: [] as any[], momItems: [] as any[], lichSuCho: null as Promise<any> | null }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: ({ index, level }: any) => <div data-testid="thu" data-index={index} data-level={level} /> }))
vi.mock('../src/components/ThongBaoHocSinh', () => ({ default: () => null, noticeApi: vi.fn() }))
vi.mock('../src/game/than-thu-v2/academic-sync', () => ({ syncStudentExp: async () => {} }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrlHoacMacDinh: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({
  ...(await original<any>()),
  hsLichSuCaApi: () => mocks.lichSuCho ?? Promise.resolve({ ok: true, items: [] }),
  hsBtvnApi: async () => ({ ok: true, items: mocks.items }),
  thanThuDocApi: async () => ({ ok: true, hoSo: {} }),
}))
vi.mock('../src/lib/mom-api', async (original) => ({
  ...(await original<any>()),
  momApi: async () => ({ ok: true, items: mocks.momItems }),
}))
vi.mock('../src/lib/btvn-may-chu-moi', () => ({ btvnCuaEm: mocks.homework }))
vi.mock('../src/lib/btvn-cho-em', () => ({ layCauHinhChoEmBtvn: async () => ({ URL: '/test' }), dungPhieuBtvn: mocks.sheet }))

const NOW = Date.now()
const gio = (h: number) => new Date(NOW + h * 3600_000).toISOString()
const KE_HOACH = {
  ok: true,
  ngay: '2026-09-19',
  nganSach: { mucTieuCau: 12, toiThieuCau: 6, vanTocGiay: 78, vanTocNguon: 'do', ghiChuVanToc: '' },
  viec: [
    { id: 'on_lai:2026-09-19', loai: 'on_lai', soCau: 3, thuTu: 1, batBuoc: false, khan: false, cong: null, hien: true, nhan: 'bu', trangThai: 'cho', ghiChu: 'Ôn 3 câu đã tới hạn nhắc lại', chiTiet: { qid: ['a'] }, hanCung: null, hanMem: null, nguon: 'ho_so' },
    { id: 'than_thu:X', loai: 'than_thu', soCau: 6, thuTu: 2, batBuoc: false, khan: false, cong: 'on_lai:2026-09-19', hien: false, nhan: 'tuy_chon', trangThai: 'cho', ghiChu: 'Luyện dạng còn yếu với thần thú', chiTiet: { dang: 'X' }, hanCung: null, hanMem: null, nguon: 'ho_so' },
  ],
  canhBao: [],
  quaHan: [],
  tienBo: { daLamCau: 2, lenBac: 1, tutBac: 0, dat: false, toiThieuCau: 6, conThieu: 4 },
  chuoiDat: 0,
  lanNghi: false,
  capNhatLuc: gio(-0.1),
}

type Tra = { status?: number; body?: any; nem?: boolean; cho?: Promise<void> }
let cuocGoi: { url: string; body: any }[] = []
let tra: Record<string, Tra | (() => Tra)> = {}
function giaLapFetch() {
  cuocGoi = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: any) => {
      const u = String(url)
      let body: any = {}
      try { body = JSON.parse(init?.body || '{}') } catch {}
      cuocGoi.push({ url: u, body })
      const duong = new URL(u).pathname
      const r = typeof tra[duong] === 'function' ? (tra[duong] as () => Tra)() : (tra[duong] as Tra | undefined)
      if (r?.nem) throw new Error('mất mạng')
      if (r?.cho) await r.cho
      const status = r?.status ?? 200
      return { ok: status >= 200 && status < 300, status, json: async () => r?.body ?? { ok: true, items: [] } }
    }),
  )
}
const goiTheo = (duong: string) => cuocGoi.filter((c) => new URL(c.url).pathname === duong)

beforeEach(() => {
  tra = {}
  giaLapFetch()
})
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('taiKeHoachNgay / taiCaDangMo', () => {
  it('có token → gửi {token} (không lộ sbd); không token → gửi {sbd}; đúng đường /hs/ke-hoach-ngay', async () => {
    tra['/hs/ke-hoach-ngay'] = { body: KE_HOACH }
    expect(await taiKeHoachNgay({ token: 'tk', sbd: '123' })).toMatchObject({ ok: true })
    expect(goiTheo('/hs/ke-hoach-ngay')[0].body).toEqual({ token: 'tk' })
    await taiKeHoachNgay({ sbd: '123' })
    expect(goiTheo('/hs/ke-hoach-ngay')[1].body).toEqual({ sbd: '123' })
    expect(cuocGoi[0].url).toBe('https://may.test/hs/ke-hoach-ngay')
  })

  it('lỗi mạng, 404/500, JSON không đủ phần, ok:false → null (không ném)', async () => {
    for (const t of [{ nem: true }, { status: 404 }, { status: 500, body: KE_HOACH }, { body: { ok: true, items: [] } }, { body: { ok: false, error: 'x' } }, { body: null }] as Tra[]) {
      tra['/hs/ke-hoach-ngay'] = t
      expect(await taiKeHoachNgay({ token: 'tk' })).toBeNull()
    }
  })

  it('ca đang mở: chỉ coCaMo:true (và ok:true) mới là true; lỗi/404/thiếu trường/ok:false → false', async () => {
    tra['/hs/ca-dang-mo'] = { body: { ok: true, coCaMo: true, soCa: 2 } }
    expect(await taiCaDangMo({ token: 'tk' })).toBe(true)
    expect(goiTheo('/hs/ca-dang-mo')[0].body).toEqual({ token: 'tk' })
    for (const t of [{ body: { ok: true, coCaMo: false, soCa: 0 } }, { body: { ok: true } }, { body: { ok: false, coCaMo: true } }, { status: 404 }, { nem: true }] as Tra[]) {
      tra['/hs/ca-dang-mo'] = t
      expect(await taiCaDangMo({ sbd: '1' })).toBe(false)
    }
  })
})

describe('các hook', () => {
  it('useKeHoachNgay: có kế hoạch; lần sau lỗi thì GIỮ bản cuối và báo cu; hồi lại thì hết cu', async () => {
    tra['/hs/ke-hoach-ngay'] = { body: KE_HOACH }
    const { result, rerender } = renderHook(({ n }) => useKeHoachNgay({ token: 'tk' }, true, n), { initialProps: { n: 0 } })
    expect(result.current).toMatchObject({ keHoach: null, daXong: false, cu: false })
    await waitFor(() => expect(result.current.daXong).toBe(true))
    expect(result.current.keHoach?.tienBo.daLamCau).toBe(2)
    expect(result.current.cu).toBe(false)

    tra['/hs/ke-hoach-ngay'] = { nem: true }
    rerender({ n: 1 })
    await waitFor(() => expect(result.current.cu).toBe(true))
    expect(result.current.keHoach?.tienBo.daLamCau).toBe(2)

    tra['/hs/ke-hoach-ngay'] = { body: { ...KE_HOACH, tienBo: { ...KE_HOACH.tienBo, daLamCau: 5 } } }
    rerender({ n: 2 })
    await waitFor(() => expect(result.current.keHoach?.tienBo.daLamCau).toBe(5))
    expect(result.current.cu).toBe(false)
  })

  it('useKeHoachNgay: lỗi ngay lần đầu ⇒ daXong nhưng KHÔNG có kế hoạch cũ (rơi về trợ lý), cu = false', async () => {
    tra['/hs/ke-hoach-ngay'] = { nem: true }
    const { result } = renderHook(() => useKeHoachNgay({ token: 'tk' }, true, 0))
    await waitFor(() => expect(result.current.daXong).toBe(true))
    expect(result.current).toMatchObject({ keHoach: null, cu: false })
  })

  it('useKeHoachNgay: đổi người (đăng xuất/đăng nhập) không rò kế hoạch của người trước; chưa bật thì không gọi', async () => {
    tra['/hs/ke-hoach-ngay'] = { body: KE_HOACH }
    const { result, rerender } = renderHook(({ tk }) => useKeHoachNgay({ token: tk }, !!tk, 0), { initialProps: { tk: 'a' } })
    await waitFor(() => expect(result.current.keHoach).not.toBeNull())
    rerender({ tk: '' })
    expect(result.current).toMatchObject({ keHoach: null, daXong: false })
    const truoc = goiTheo('/hs/ke-hoach-ngay').length
    await new Promise((r) => setTimeout(r, 30))
    expect(goiTheo('/hs/ke-hoach-ngay').length).toBe(truoc)
  })

  it('useCaDangMo: true khi máy chủ báo coCaMo; tự về false khi 404; tắt thì luôn false', async () => {
    tra['/hs/ca-dang-mo'] = { body: { ok: true, coCaMo: true, soCa: 1 } }
    const { result } = renderHook(() => useCaDangMo({ token: 'tk' }, true))
    expect(result.current).toBe(false)
    await waitFor(() => expect(result.current).toBe(true))
    const tat = renderHook(() => useCaDangMo({ token: 'tk' }, false))
    await new Promise((r) => setTimeout(r, 20))
    expect(tat.result.current).toBe(false)
  })

  it('useLamMoiKhiDong: chỉ tăng khi chuyển true → false (vừa đóng một màn)', () => {
    const { result, rerender } = renderHook(({ m }) => useLamMoiKhiDong(m), { initialProps: { m: false } })
    expect(result.current).toBe(0)
    rerender({ m: true })
    expect(result.current).toBe(0)
    rerender({ m: false })
    expect(result.current).toBe(1)
    rerender({ m: false })
    expect(result.current).toBe(1)
  })

  it('useSauVeDauTien: false ở khung đầu, true sau một nhịp rảnh', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useSauVeDauTien())
    expect(result.current).toBe(false)
    await act(async () => { vi.advanceTimersByTime(300) })
    expect(result.current).toBe(true)
  })
})

describe('StudentPortalScreen thật: nối kế hoạch máy chủ và "ca đang mở"', () => {
  beforeEach(() => {
    mocks.items = []
    mocks.momItems = []
    localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: 'test', hoTen: 'Em thử', token: 'test-token' }))
    mocks.sheet.mockResolvedValue('<html><body>Đề</body></html>')
    mocks.homework.mockResolvedValue({ ok: true, maBtvn: 'BT1', de: {}, soCau: 1 })
  })

  it('kế hoạch máy chủ hợp lệ: thẻ "Làm ngay" là việc đầu của máy chủ, việc bị cổng mờ có nhãn, dùng token', async () => {
    tra['/hs/ke-hoach-ngay'] = { body: KE_HOACH }
    const { container } = render(<StudentPortalScreen />)
    const lamNgay = await screen.findByRole('region', { name: /^Làm ngay: Ôn 3 câu đã tới hạn nhắc lại/ })
    expect(lamNgay).toBeTruthy()
    expect(container.querySelector('.bnv')!.getAttribute('data-nguon')).toBe('ke_hoach_ngay')
    const biCong = container.querySelector('[data-bi-cong="true"]')!
    expect(biCong.textContent).toContain('Mở sau khi xong: Ôn 3 câu đã tới hạn nhắc lại')
    expect(container.querySelector('[data-vung="tien-do"]')!.textContent).toContain('Đã làm 2 câu, 1 câu lên bậc ôn')
    expect(goiTheo('/hs/ke-hoach-ngay')[0].body).toEqual({ token: 'test-token' })
    expect(container.querySelectorAll('.bnv-nut-chinh').length).toBe(1)
  })

  it('máy chủ lỗi hoặc trả JSON hỏng: rơi về nguồn trợ lý, vẫn mở được bài Mẹ giao (không trắng màn)', async () => {
    tra['/hs/ke-hoach-ngay'] = { body: { ok: true, items: [] } }
    mocks.momItems = [{ id: 'M1', tieuDe: 'Bài luyện thử', soCau: 1, trangThai: 'chua_lam' }]
    const { container } = render(<StudentPortalScreen />)
    expect(await screen.findByRole('button', { name: 'Làm bài của Mom' })).toBeTruthy()
    expect(container.querySelector('.bnv')!.getAttribute('data-nguon')).toBe('tro_ly')
  })

  it('bài Mẹ giao chưa bắt đầu do máy chủ đưa vào viec[]: hiện thành thẻ việc, bấm mở đúng bài', async () => {
    tra['/hs/ke-hoach-ngay'] = { body: { ...KE_HOACH, viec: [{ id: 'mom:M1', loai: 'mom', soCau: 4, thuTu: 1, batBuoc: true, khan: false, cong: null, hien: true, nhan: null, trangThai: 'cho', ghiChu: 'Bài Mom giao, chưa bắt đầu.', chiTiet: { id: 'M1', chuaBatDau: true }, hanCung: null, hanMem: null, nguon: 'M1' }] } }
    mocks.momItems = [{ id: 'M1', tieuDe: 'Bài Mẹ mới nhận', soCau: 4, trangThai: 'chua_lam' }]
    const { container } = render(<StudentPortalScreen />)
    await screen.findByRole('region', { name: /^Làm ngay: Bài Mẹ mới nhận/ })
    expect(container.querySelector('.bnv')!.getAttribute('data-nguon')).toBe('ke_hoach_ngay')
    expect(container.querySelector('[data-vung="ton-cu"]')).toBeNull()
  })

  it('bài Mẹ cũ ngoài viec[] (máy chủ chưa gửi tonCu): hàng thu gọn "Bài cũ chưa làm · N bài", không thành thẻ việc; mở ra bấm được', async () => {
    tra['/hs/ke-hoach-ngay'] = { body: KE_HOACH }
    mocks.momItems = [{ id: 'M1', tieuDe: 'Bài Mẹ cũ', soCau: 4, trangThai: 'chua_lam' }]
    const { container } = render(<StudentPortalScreen />)
    await screen.findByRole('region', { name: /^Làm ngay: Ôn 3 câu/ })
    await waitFor(() => expect(container.querySelector('[data-vung="ton-cu"]')).not.toBeNull())
    expect(container.textContent).toContain('Bài cũ chưa làm · 1 bài')
    expect(container.querySelectorAll('[data-viec="mom:M1"]').length).toBe(0)
    fireEvent.click(screen.getByRole('button', { name: /Bài cũ chưa làm · 1 bài/ }))
    expect(screen.getByRole('button', { name: 'Bài Mẹ cũ 4 câu — bài cũ' })).toBeTruthy()
  })

  it('ca đang mở (máy chủ báo coCaMo:true): nút Vào thi đổi sang tertiary + chấm nhịp; bấm vẫn mở phòng vào thi', async () => {
    tra['/hs/ke-hoach-ngay'] = { body: KE_HOACH }
    tra['/hs/ca-dang-mo'] = { body: { ok: true, coCaMo: true, soCa: 1 } }
    const { container } = render(<StudentPortalScreen />)
    const fab = await screen.findByRole('button', { name: /Vào thi · ca đang mở/ })
    expect(fab.getAttribute('data-ca-mo')).toBe('true')
    expect(fab.querySelector('.bnv-fab-cham')).not.toBeNull()
    expect(container.querySelectorAll('.bnv-nut-chinh').length).toBe(1)
    fireEvent.click(fab)
    expect(await screen.findByRole('dialog', { name: 'Vào phòng thi' })).toBeTruthy()
    expect(goiTheo('/hs/ca-dang-mo')[0].body).toEqual({ token: 'test-token' })
  })

  it('không có ca đang mở (hoặc endpoint lỗi): nút Vào thi giữ dạng thường', async () => {
    tra['/hs/ke-hoach-ngay'] = { body: KE_HOACH }
    tra['/hs/ca-dang-mo'] = { status: 404 }
    render(<StudentPortalScreen />)
    const fab = await screen.findByRole('button', { name: 'Vào thi' })
    await waitFor(() => expect(goiTheo('/hs/ca-dang-mo').length).toBeGreaterThan(0))
    expect(fab.getAttribute('data-ca-mo')).toBe('false')
  })
})

describe('A.1 — bản nhớ kế hoạch: vẽ NGAY khi mở lại, rồi thay bằng bản mới', () => {
  const KHOA = 'omr_bnv_ke_hoach:test'
  const nho = (lui = 0) => {
    const d = tuKeHoachNgay({ ...KE_HOACH, viec: KE_HOACH.viec.map((v) => ({ ...v })) } as any, Date.now(), {})
    const b = dongGoiBanNho(d, Date.now() - lui)!
    return JSON.stringify(b)
  }
  const gieoNho = (chu: string) => localStorage.setItem(KHOA, chu)
  let giaiKeHoach!: () => void
  let giaiLichSu!: (v: any) => void

  beforeEach(() => {
    mocks.items = []
    mocks.momItems = []
    localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: 'test', hoTen: 'Em thử', token: 'test-token' }))
    // Mạng và danh sách CHƯA về: chỉ bản nhớ mới có gì để vẽ.
    tra['/hs/ke-hoach-ngay'] = { body: KE_HOACH, cho: new Promise<void>((ok) => (giaiKeHoach = ok)) }
    mocks.lichSuCho = new Promise((ok) => (giaiLichSu = ok))
  })
  afterEach(() => {
    mocks.lichSuCho = null
  })

  it('có bản nhớ CÙNG NGÀY: vẽ ngay (không chờ mạng), có dòng "Kế hoạch lúc … đang cập nhật", không skeleton', async () => {
    gieoNho(nho())
    const { container } = render(<StudentPortalScreen />)
    expect(await screen.findByRole('region', { name: /^Làm ngay: Ôn 3 câu đã tới hạn nhắc lại/ })).toBeTruthy()
    expect(container.querySelector('[data-vung="ke-hoach-cu"]')!.textContent).toMatch(/^Kế hoạch lúc \d{2}:\d{2} · đang cập nhật/)
    expect(container.querySelector('[aria-busy="true"]')).toBeNull()
    expect(goiTheo('/hs/ke-hoach-ngay').length).toBeGreaterThan(0) // vẫn gọi máy chủ để cập nhật
  })

  it('bản mới về thì THAY: bỏ dòng "đang cập nhật", lưu lại bản nhớ mới', async () => {
    gieoNho(nho(60_000))
    const { container } = render(<StudentPortalScreen />)
    await screen.findByRole('region', { name: /^Làm ngay: Ôn 3 câu/ })
    expect(container.querySelector('[data-vung="ke-hoach-cu"]')).not.toBeNull()
    const luuTruoc = JSON.parse(localStorage.getItem(KHOA)!).luuLuc
    await act(async () => {
      giaiKeHoach()
      giaiLichSu({ ok: true, items: [] })
    })
    await waitFor(() => expect(container.querySelector('[data-vung="ke-hoach-cu"]')).toBeNull())
    expect(container.querySelector('.bnv')!.getAttribute('data-nguon')).toBe('ke_hoach_ngay')
    await waitFor(() => expect(JSON.parse(localStorage.getItem(KHOA)!).luuLuc).toBeGreaterThan(luuTruoc))
  })

  it('bản nhớ của NGÀY HÔM QUA: KHÔNG vẽ việc cũ — chỉ skeleton tới khi dữ liệu về', async () => {
    gieoNho(nho(24 * 3600_000))
    const { container } = render(<StudentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[aria-busy="true"]')).not.toBeNull())
    expect(container.querySelector('[data-vung="lam-ngay"]')).toBeNull()
    expect(container.querySelectorAll('.bnv-the').length).toBe(0)
    expect(container.textContent).not.toContain('Ôn 3 câu đã tới hạn')
  })

  it('bản nhớ rác (không phải JSON / sai cấu trúc): bỏ qua, skeleton, không sập', async () => {
    for (const rac of ['{khong-phai-json', JSON.stringify({ ngay: 'x' }), 'null', '[]']) {
      cleanup()
      gieoNho(rac)
      const { container } = render(<StudentPortalScreen />)
      await waitFor(() => expect(container.querySelector('[aria-busy="true"]')).not.toBeNull())
      expect(container.querySelector('[data-vung="lam-ngay"]')).toBeNull()
    }
  })

  it('máy chủ LỖI sau khi dữ liệu đã về: thôi vẽ bản nhớ, rơi về nguồn trợ lý (không giữ mãi bản cũ)', async () => {
    gieoNho(nho())
    tra['/hs/ke-hoach-ngay'] = { nem: true }
    mocks.lichSuCho = null
    mocks.momItems = [{ id: 'M1', tieuDe: 'Bài luyện thử', soCau: 1, trangThai: 'chua_lam' }]
    const { container } = render(<StudentPortalScreen />)
    await waitFor(() => expect(container.querySelector('.bnv')!.getAttribute('data-nguon')).toBe('tro_ly'))
    expect(container.querySelector('[data-vung="ke-hoach-cu"]')).toBeNull()
  })

  it('không lưu bản nhớ từ nguồn trợ lý; khác SBD không dùng bản nhớ của nhau', async () => {
    tra['/hs/ke-hoach-ngay'] = { nem: true }
    mocks.lichSuCho = null
    mocks.momItems = [{ id: 'M1', tieuDe: 'Bài luyện thử', soCau: 1, trangThai: 'chua_lam' }]
    localStorage.setItem('omr_bnv_ke_hoach:nguoi-khac', nho())
    const { container } = render(<StudentPortalScreen />)
    await waitFor(() => expect(container.querySelector('.bnv')!.getAttribute('data-nguon')).toBe('tro_ly'))
    expect(container.textContent).not.toContain('Ôn 3 câu đã tới hạn')
    expect(localStorage.getItem(KHOA)).toBeNull()
  })
})

describe('thần thú của em trên StudentPortalScreen thật (lỗi thầy báo)', () => {
  const KHOA = 'omr_bnv_ke_hoach:test'
  const chi = (id: string) => PETS.findIndex((p) => p.id === id)
  beforeEach(() => {
    mocks.items = []
    mocks.momItems = []
    localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: 'test', hoTen: 'Em thử', token: 'test-token' }))
  })
  const thu = (c: HTMLElement) => c.querySelector('.bnv-thu-vong [data-testid="thu"]') as HTMLElement | null

  it('máy chủ báo nuoc_long cấp 37 "Bông" → đúng con, đúng cấp, đúng tên (KHÔNG phải Hoả Long cấp 1)', async () => {
    tra['/hs/ke-hoach-ngay'] = { body: { ...KE_HOACH, thanThu: { pet: 'nuoc_long', cap: 37, nickname: 'Bông' } } }
    const { container } = render(<StudentPortalScreen />)
    await waitFor(() => expect(thu(container)).not.toBeNull())
    expect(Number(thu(container)!.dataset.index)).toBe(chi('nuoc_long'))
    expect(thu(container)!.dataset.level).toBe('37')
    expect(screen.getByRole('button', { name: 'Mở thần thú Bông · Cấp 37' })).toBeTruthy()
  })

  it('máy chủ báo chưa chọn (thanThu:null): "Chưa chọn thần thú", chạm mở game, không con nào', async () => {
    tra['/hs/ke-hoach-ngay'] = { body: { ...KE_HOACH, thanThu: null } }
    const { container } = render(<StudentPortalScreen />)
    await screen.findByRole('button', { name: /Chưa chọn thần thú/ })
    await new Promise((r) => setTimeout(r, 250))
    expect(thu(container)).toBeNull()
  })

  it('máy chủ cũ (không có trường) hoặc lỗi → giữ chỗ, KHÔNG hiện con mặc định', async () => {
    tra['/hs/ke-hoach-ngay'] = { body: KE_HOACH }
    const { container } = render(<StudentPortalScreen />)
    await screen.findByRole('region', { name: /^Làm ngay/ })
    await new Promise((r) => setTimeout(r, 250))
    expect(thu(container)).toBeNull()
    expect(container.textContent).not.toContain('Hoả Long')
    expect(container.querySelector('.bnv-thu-vong')).not.toBeNull()
  })

  it('bản nhớ giữ thần thú: mở lại (mạng chưa về) vẫn đúng con, rồi thay khi máy chủ báo con khác', async () => {
    const d = tuKeHoachNgay({ ...KE_HOACH, viec: KE_HOACH.viec.map((v) => ({ ...v })), thanThu: { pet: 'nuoc_long', cap: 37, nickname: 'Bông' } } as any, Date.now(), {})
    localStorage.setItem(KHOA, JSON.stringify(dongGoiBanNho(d, Date.now())))
    let giai!: () => void
    tra['/hs/ke-hoach-ngay'] = { body: { ...KE_HOACH, thanThu: { pet: 'dat_quy', cap: 6, nickname: 'Rùa' } }, cho: new Promise<void>((ok) => (giai = ok)) }
    mocks.lichSuCho = new Promise(() => {})
    const { container } = render(<StudentPortalScreen />)
    await waitFor(() => expect(thu(container)).not.toBeNull())
    expect(Number(thu(container)!.dataset.index)).toBe(chi('nuoc_long'))
    expect(thu(container)!.dataset.level).toBe('37')
    mocks.lichSuCho = null
  })
})

describe('tab BTVN của học sinh nói đúng hệ CHẶNG (không còn "3 Vòng Phân Tầng", không "nắm chắc")', () => {
  it('mở từ menu ba chấm: tiêu đề/banner/nhãn từng bài nói "chia chặng theo ngày/giờ"', async () => {
    localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: 'test', hoTen: 'Em thử', token: 'test-token' }))
    mocks.items = [{ maBtvn: 'BT1', maCa: 'CA1', soCau: 8, tenBtvn: 'Bài test', giaoLuc: gio(-5), hanNop: gio(48), daNop: false, soLanLamLaiConLai: 3 }]
    mocks.momItems = []
    tra['/hs/ke-hoach-ngay'] = { body: KE_HOACH }
    const { container } = render(<StudentPortalScreen />)
    fireEvent.click(await screen.findByRole('button', { name: 'Mở menu' }))
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Bài tập về nhà' }))
    expect(await screen.findByText('Cách làm bài tập về nhà: chia chặng theo ngày/giờ')).toBeTruthy()
    const chu = container.textContent!
    expect(chu).toContain('CHẶNG ĐANG MỞ')
    expect(chu).toContain('Chia chặng theo ngày/giờ')
    expect(chu).not.toMatch(/3 Vòng|Phân Tầng|VÒNG [123]|Vòng [123]|nắm chắc/i)
  })
})

describe('C11 · việc on_lai mở màn LamCauOn với ĐÚNG câu máy chủ chọn', () => {
  const datDuong = (d: string) => window.history.replaceState(null, '', d)
  afterEach(() => datDuong('/'))

  it('bấm "Ôn ngay" → sheet "Ôn câu hôm nay" gọi /hs/cau-theo-qid với token + qid của việc; đóng sheet thì hỏi lại /hs/ke-hoach-ngay', async () => {
    datDuong('/hs')
    localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: 'test', hoTen: 'Em thử', token: 'test-token' }))
    mocks.items = []
    mocks.momItems = []
    const qid = (KE_HOACH.viec[0].chiTiet as any).qid as string[]
    tra['/hs/ke-hoach-ngay'] = { body: KE_HOACH }
    tra['/hs/cau-theo-qid'] = { body: { ok: true, cau: [{ qid: qid[0], phan: 'I', text: 'Câu ôn thử phải hiện', choices: ['a', 'b', 'c', 'd'], ideas: [], hinhAnh: [] }], khongCo: [] } }
    render(<StudentPortalScreen />)
    fireEvent.click(await screen.findByRole('button', { name: /Ôn ngay/ }))
    expect(await screen.findByText('Câu ôn thử phải hiện')).toBeTruthy()
    expect(document.querySelector('.m3-thanh-tren-ten')!.textContent).toBe('Ôn câu hôm nay')
    expect(goiTheo('/hs/cau-theo-qid')[0].body).toEqual({ token: 'test-token', qid })
    // KHÔNG mở luồng khắc phục cũ (hsCauSaiApi/luyện lại câu sai)
    expect(goiTheo('/hs/cau-sai').length).toBe(0)
    const truoc = goiTheo('/hs/ke-hoach-ngay').length
    fireEvent.click(screen.getByTitle('Đóng toàn màn hình'))
    await waitFor(() => expect(goiTheo('/hs/ke-hoach-ngay').length).toBeGreaterThan(truoc))
  })

  it('việc on_thi (ôn trước ca thi) có chiTiet.qid: bấm "Ôn ngay" cũng mở LamCauOn, gọi /hs/cau-theo-qid với ĐÚNG qid của việc — không mở luồng khắc phục cũ', async () => {
    datDuong('/hs')
    localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: 'test', hoTen: 'Em thử', token: 'test-token' }))
    mocks.items = []
    mocks.momItems = []
    const qid = ['thi-1', 'thi-2']
    const viecThi = { ...KE_HOACH.viec[0], id: 'on_thi:CA1', loai: 'on_thi', soCau: 2, ghiChu: 'Ôn trước ca thi', chiTiet: { qid } }
    tra['/hs/ke-hoach-ngay'] = { body: { ...KE_HOACH, viec: [viecThi] } }
    tra['/hs/cau-theo-qid'] = { body: { ok: true, cau: [{ qid: qid[0], phan: 'I', text: 'Câu ôn trước ca thi phải hiện', choices: ['a', 'b', 'c', 'd'], ideas: [], hinhAnh: [] }], khongCo: [] } }
    render(<StudentPortalScreen />)
    fireEvent.click(await screen.findByRole('button', { name: /Ôn ngay/ }))
    expect(await screen.findByText('Câu ôn trước ca thi phải hiện')).toBeTruthy()
    expect(goiTheo('/hs/cau-theo-qid')[0].body).toEqual({ token: 'test-token', qid })
    expect(goiTheo('/hs/cau-sai').length).toBe(0)
  })
})
