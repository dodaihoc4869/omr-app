// Kênh 5 phía phụ huynh, trên ParentPortalScreen THẬT: nút "Giao bài cho con" đi đường /parent-news
// (bài hằng ngày đã cá nhân hoá), in NGUYÊN VĂN lý do của máy chủ, ba trạng thái, lỗi, chống bấm đúp.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ParentPortalScreen from '../src/screens/ParentPortalScreen'

const mocks = vi.hoisted(() => ({ momItems: [] as any[] }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => null }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrl: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({
  ...(await original<any>()),
  tenTheoSbd: async () => ({ sbd: '12121212', hoTen: 'Đỗ Minh', lop: '12A1', tenCa: '' }),
  hsLichSuCaApi: async () => ({ ok: true, items: [] }),
  hsCauSaiApi: async () => ({ ok: true, items: [] }),
  hsBtvnApi: async () => ({ ok: true, items: [] }),
}))
vi.mock('../src/lib/mom-api', async (original) => ({
  ...(await original<any>()),
  migrateMom: async () => {},
  momApi: async () => ({ ok: true, items: mocks.momItems }),
}))

const NGAY = '2026-09-19'
const LY_DO_CON_DU = 'Còn dư 3 câu trong mục tiêu 12 câu hôm nay; ưu tiên câu ôn tới hạn trước.'
const LY_DO_DA_DU = 'Mục tiêu hôm nay 12 câu. Bài đang chờ còn 8 câu, con đã làm 4 câu. Chưa cần giao thêm.'
const baoCao = (questionCount: number, reason: string) => ({
  day: NGAY, updatedAt: new Date().toISOString(), today: [], weak: [], wrong: 0, pending: 0,
  pendingDetails: { btvn: 0, mom: 0, daily: 0 }, questionCount, assignmentCount: 0, minutes: 0, mode: 'x', reason,
  phanDu: { mucTieuCau: 12, taiCung: 8, daLamCau: 4, soCau: questionCount },
})

type Tra = { status?: number; body?: any; nem?: boolean }
let cuoc: { duong: string; body: any }[] = []
let tra: Record<string, Tra | (() => Tra)> = {}
const goi = (duong: string) => cuoc.filter((c) => c.duong === duong)

beforeEach(() => {
  cuoc = []
  tra = {}
  mocks.momItems = []
  localStorage.setItem('omr_ph_sbd', '12121212')
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: any) => {
      const duong = new URL(String(url)).pathname
      let body: any = {}
      try { body = JSON.parse(init?.body || '{}') } catch {}
      cuoc.push({ duong, body })
      const r = typeof tra[duong] === 'function' ? (tra[duong] as () => Tra)() : (tra[duong] as Tra | undefined)
      if (r?.nem) throw new Error('mất mạng')
      const status = r?.status ?? 200
      return { ok: status >= 200 && status < 300, status, json: async () => r?.body ?? { ok: true, items: [] } }
    }),
  )
})
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

const nutGiao = () => screen.findByRole('button', { name: 'Giao bài cho con' })
const lyDo = (c: HTMLElement) => c.querySelector('[data-vung="ly-do-giao-bai"]')?.textContent

describe('CÒN DƯ: giao bài hằng ngày cá nhân hoá', () => {
  it('in nguyên văn lý do; bấm → POST /parent-news/assign {sbd}; báo kết quả; thấy bài đã giao; không mở luồng tay', async () => {
    tra['/parent-news/list'] = () => ({ body: { ok: true, report: baoCao(3, LY_DO_CON_DU), history: [], daily: mocks.momItems.length ? { id: `daily_${NGAY}`, submitted_at: null } : null } })
    tra['/parent-news/assign'] = () => {
      mocks.momItems = [{ id: `daily_${NGAY}`, tieuDe: 'Ôn tập cá nhân hoá ngày 2026-09-19 · 3 câu', soCau: 3, trangThai: 'chua_lam', sbd: '12121212' }]
      return { body: { ok: true, id: `daily_${NGAY}`, questionCount: 3 } }
    }
    const { container } = render(<ParentPortalScreen />)
    const nut = await nutGiao()
    await waitFor(() => expect(lyDo(container)).toBe(LY_DO_CON_DU))
    expect(container.querySelector('[data-vung="giao-bai"]')!.getAttribute('data-trang-thai')).toBe('con-du')

    fireEvent.click(nut)
    await waitFor(() => expect(goi('/parent-news/assign').length).toBe(1))
    expect(goi('/parent-news/assign')[0].body).toEqual({ sbd: '12121212' })
    expect(await screen.findByText('Đã giao 1 bài gồm 3 câu sang app của con.')).toBeTruthy()
    // Sau khi giao: máy chủ báo bài hằng ngày đã có ⇒ ô đổi sang "đã giao", không còn nút giao trùng.
    await waitFor(() => expect(container.querySelector('[data-vung="da-giao"]')?.textContent).toBe('Hôm nay đã giao 3 câu · con chưa làm'))
    expect(container.querySelector('[data-vung="giao-bai"]')!.getAttribute('data-trang-thai')).toBe('da-giao')
    // Không mở sheet giao tay.
    expect(screen.queryByText('Khắc Phục Lỗi Sai & Luyện Đề (4 Lựa Chọn)')).toBeNull()
  })

  it('bấm hai lần liền chỉ gửi MỘT yêu cầu (nút khoá trong lúc đang giao)', async () => {
    tra['/parent-news/list'] = { body: { ok: true, report: baoCao(3, LY_DO_CON_DU), history: [], daily: null } }
    let giai!: () => void
    const cho = new Promise<void>((ok) => (giai = ok))
    const goc = (globalThis.fetch as any).getMockImplementation()
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: any) => {
      if (String(url).endsWith('/parent-news/assign')) { cuoc.push({ duong: '/parent-news/assign', body: JSON.parse(init.body) }); await cho; return { ok: true, status: 200, json: async () => ({ ok: true, id: 'x', questionCount: 3 }) } }
      return goc(url, init)
    }))
    render(<ParentPortalScreen />)
    const nut = await nutGiao()
    await waitFor(() => expect(nut.getAttribute('class')).toContain('bnv-nut-tonal'))
    fireEvent.click(nut)
    await waitFor(() => expect((screen.getByRole('button', { name: /Đang giao/ }) as HTMLButtonElement).disabled).toBe(true))
    fireEvent.click(screen.getByRole('button', { name: /Đang giao/ }))
    expect(goi('/parent-news/assign').length).toBe(1)
    giai()
    await screen.findByText('Đã giao 1 bài gồm 3 câu sang app của con.')
  })

  it('máy chủ báo lỗi (không tìm được câu): hiện NGUYÊN VĂN lỗi ở vai trò alert, nút dùng lại được', async () => {
    tra['/parent-news/list'] = { body: { ok: true, report: baoCao(3, LY_DO_CON_DU), history: [], daily: null } }
    tra['/parent-news/assign'] = { status: 400, body: { ok: false, error: 'Chưa tìm được câu phù hợp để giao hôm nay. Vui lòng thử lại sau.' } }
    render(<ParentPortalScreen />)
    fireEvent.click(await nutGiao())
    expect((await screen.findByRole('alert')).textContent).toBe('Chưa tìm được câu phù hợp để giao hôm nay. Vui lòng thử lại sau.')
    expect((screen.getByRole('button', { name: 'Giao bài cho con' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('máy chủ nói bài hôm nay đã có (alreadySent): báo "không tạo thêm bài trùng"', async () => {
    tra['/parent-news/list'] = { body: { ok: true, report: baoCao(3, LY_DO_CON_DU), history: [], daily: null } }
    tra['/parent-news/assign'] = { body: { ok: true, alreadySent: true, id: `daily_${NGAY}` } }
    render(<ParentPortalScreen />)
    fireEvent.click(await nutGiao())
    expect(await screen.findByText('Bài hôm nay đã được giao trước đó. Không tạo thêm bài trùng.')).toBeTruthy()
  })
})

describe('ĐÃ ĐỦ (questionCount = 0): không chặn, chỉ đổi dạng', () => {
  it('in nguyên văn lý do trong ô vàng; nút dạng phụ; bấm vào luồng giao tay cũ, KHÔNG gọi assign', async () => {
    tra['/parent-news/list'] = { body: { ok: true, report: baoCao(0, LY_DO_DA_DU), history: [], daily: null } }
    const { container } = render(<ParentPortalScreen />)
    const nut = await nutGiao()
    await waitFor(() => expect(lyDo(container)).toBe(LY_DO_DA_DU))
    expect(container.querySelector('[data-vung="giao-bai"]')!.getAttribute('data-trang-thai')).toBe('da-du')
    expect(nut.classList.contains('bnv-nut-vien')).toBe(true)
    fireEvent.click(nut)
    expect(await screen.findByText('Khắc Phục Lỗi Sai & Luyện Đề (4 Lựa Chọn)')).toBeTruthy()
    expect(goi('/parent-news/assign').length).toBe(0)
  })
})

describe('ĐÃ GIAO hôm nay', () => {
  it.each([
    ['chua_lam', 'con chưa làm'],
    ['dang_lam', 'con đang làm'],
    ['da_nop', 'con đã nộp'],
  ])('bài hằng ngày đã có (%s): "Hôm nay đã giao 5 câu · %s"; nút phụ mở luồng tay', async (trangThai, chu) => {
    mocks.momItems = [{ id: `daily_${NGAY}`, tieuDe: 'Ôn tập cá nhân hoá', soCau: 5, trangThai, sbd: '12121212' }]
    tra['/parent-news/list'] = { body: { ok: true, report: baoCao(3, LY_DO_CON_DU), history: [], daily: { id: `daily_${NGAY}`, submitted_at: trangThai === 'da_nop' ? new Date().toISOString() : null } } }
    const { container } = render(<ParentPortalScreen />)
    const nut = await nutGiao()
    await waitFor(() => expect(container.querySelector('[data-vung="da-giao"]')?.textContent).toBe(`Hôm nay đã giao 5 câu · ${chu}`))
    expect(nut.classList.contains('bnv-nut-vien')).toBe(true)
    fireEvent.click(nut)
    expect(await screen.findByText('Khắc Phục Lỗi Sai & Luyện Đề (4 Lựa Chọn)')).toBeTruthy()
    expect(goi('/parent-news/assign').length).toBe(0)
  })
})

describe('máy chủ chưa trả / lỗi', () => {
  it('không có báo cáo: không in câu lý do nào (không bịa), nút mở luồng giao tay như cũ', async () => {
    tra['/parent-news/list'] = { nem: true }
    const { container } = render(<ParentPortalScreen />)
    const nut = await nutGiao()
    await new Promise((r) => setTimeout(r, 120))
    expect(lyDo(container)).toBeUndefined()
    expect(container.querySelector('[data-vung="giao-bai"]')!.getAttribute('data-trang-thai')).toBe('chua-biet')
    fireEvent.click(nut)
    expect(await screen.findByText('Khắc Phục Lỗi Sai & Luyện Đề (4 Lựa Chọn)')).toBeTruthy()
    expect(goi('/parent-news/assign').length).toBe(0)
  })

  it('không còn chữ "3 Vòng"/"Phân Tầng" và không giả định "≥ 12 câu" ở màn phụ huynh', async () => {
    tra['/parent-news/list'] = { body: { ok: true, report: baoCao(1, 'Còn dư 1 câu trong mục tiêu 12 câu hôm nay.'), history: [], daily: null } }
    const { container } = render(<ParentPortalScreen />)
    await nutGiao()
    await waitFor(() => expect(lyDo(container)).toBe('Còn dư 1 câu trong mục tiêu 12 câu hôm nay.'))
    expect(container.textContent).not.toMatch(/3 Vòng|Phân Tầng/i)
  })
})
