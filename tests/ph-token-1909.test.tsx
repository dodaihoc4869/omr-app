// CỔNG PHỤ HUYNH · TOKEN, giai đoạn MỀM (docs/token-phu-huynh-1909.md, Code 3). Liên kết ?ph=<pass>: đọc + lưu + XOÁ khỏi địa chỉ, xác định con
// bằng /ph/xac-dinh, mọi lệnh PH gửi {pass} thay {sbd} (pass không bao giờ nằm trong địa chỉ lệnh). Không có pass: chạy như cũ bằng SBD.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { docPass, KHOA_PH_PASS, nhanPassTuDiaChi, tachPass, xacDinhPhuHuynh, xoaPass } from '../src/lib/ph-token'
import { datPassPhuHuynh, momApi, parentNewsApi } from '../src/lib/mom-api'
import ParentPortalScreen from '../src/screens/ParentPortalScreen'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => null }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrl: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({
  ...(await original<any>()),
  tenTheoSbd: async () => ({ sbd: '12121212', hoTen: 'TÊN-TỪ-SBD-TRẦN', lop: '12A1', tenCa: '' }),
  hsLichSuCaApi: async () => ({ ok: true, items: [] }),
  hsCauSaiApi: async () => ({ ok: true, items: [] }),
  hsBtvnApi: async () => ({ ok: true, items: [] }),
}))

type Goi = { url: string; body: Record<string, unknown> }
let goi: Goi[] = []
let xacDinh: { ok: boolean; sbd?: string; hoTen?: string; lop?: string; error?: string } = { ok: true, sbd: '12001', hoTen: 'Nguyễn Văn Minh', lop: '12A1' }
beforeEach(() => {
  goi = []
  xacDinh = { ok: true, sbd: '12001', hoTen: 'Nguyễn Văn Minh', lop: '12A1' }
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { body?: string }) => {
    const b = init?.body ? JSON.parse(init.body) : {}
    goi.push({ url: String(url), body: b })
    const u = new URL(String(url)).pathname
    const j = u === '/ph/xac-dinh' ? xacDinh : { ok: true, items: [], winners: [] }
    return { ok: true, status: 200, json: async () => j }
  }))
})
afterEach(() => {
  cleanup()
  localStorage.clear()
  datPassPhuHuynh('')
  vi.unstubAllGlobals()
  window.history.replaceState(null, '', '/')
})

describe('ph-token: thuần', () => {
  it('tachPass: giải mã, cắt khoảng trắng, giữ tham số khác; rỗng / chỉ khoảng trắng = không có', () => {
    expect(tachPass('?ph=abc%20d&vai=phuhuynh')).toEqual({ pass: 'abc d', con: '?vai=phuhuynh' })
    expect(tachPass('?ph=%20%20')).toEqual({ pass: '', con: '' })
    expect(tachPass('?vai=phuhuynh')).toEqual({ pass: '', con: '?vai=phuhuynh' })
    expect(tachPass('')).toEqual({ pass: '', con: '' })
  })

  it('nhanPassTuDiaChi: LƯU pass (khoá omr_ph_pass) và XOÁ ?ph= khỏi thanh địa chỉ (giữ đường, tham số khác, hash)', () => {
    window.history.replaceState(null, '', '/ph?ph=XYZ&vai=phuhuynh#neo')
    expect(nhanPassTuDiaChi()).toBe('XYZ')
    expect(localStorage.getItem(KHOA_PH_PASS)).toBe('XYZ')
    expect(location.pathname + location.search + location.hash).toBe('/ph?vai=phuhuynh#neo')
    expect(location.href).not.toContain('XYZ')
    expect(nhanPassTuDiaChi()).toBe('') // lần sau không còn gì để nhận
    expect(docPass()).toBe('XYZ')
    xoaPass()
    expect(docPass()).toBe('')
  })

  it('xacDinhPhuHuynh: POST /ph/xac-dinh CHỈ {pass}; ok → sbd/tên/lớp; lỗi → đúng câu của máy chủ; mạng hỏng → câu thân thiện', async () => {
    const a = await xacDinhPhuHuynh('P1')
    expect(a).toEqual({ ok: true, sbd: '12001', hoTen: 'Nguyễn Văn Minh', lop: '12A1' })
    expect(goi[0]).toEqual({ url: 'https://may.test/ph/xac-dinh', body: { pass: 'P1' } })
    xacDinh = { ok: false, error: 'Liên kết đã hết hạn. Anh/chị nhờ Thầy gửi liên kết mới.' }
    expect(await xacDinhPhuHuynh('P1')).toEqual({ ok: false, error: 'Liên kết đã hết hạn. Anh/chị nhờ Thầy gửi liên kết mới.' })
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    expect((await xacDinhPhuHuynh('P1')) as { ok: false; error: string }).toMatchObject({ ok: false, error: expect.stringContaining('Chưa kết nối') })
  })
})

describe('mom-api: có pass thì gửi {pass} thay {sbd} — chỉ bốn đường máy chủ đã nhận pass', () => {
  it('có pass: /parent-news/list|assign, /mom/parent-list, /mom/create gửi pass, KHÔNG sbd; pass không nằm trong địa chỉ', async () => {
    datPassPhuHuynh('PASS-A')
    await parentNewsApi('list', '12001')
    await parentNewsApi('assign', '12001')
    await momApi('parent-list', { sbd: '12001' })
    await momApi('create', { sbd: '12001', id: 'm1', tieuDe: 'x', dsCau: [] })
    expect(goi.map((g) => new URL(g.url).pathname)).toEqual(['/parent-news/list', '/parent-news/assign', '/mom/parent-list', '/mom/create'])
    for (const g of goi) {
      expect(g.body.pass).toBe('PASS-A')
      expect('sbd' in g.body).toBe(false)
      expect(g.url).not.toContain('PASS-A')
    }
    expect(goi[3].body).toMatchObject({ id: 'm1', tieuDe: 'x' }) // phần còn lại của thân giữ nguyên
  })

  it('đường máy chủ CHƯA nhận pass (/mom/review) vẫn gửi sbd; KHÔNG có pass thì tất cả như cũ (SBD trần)', async () => {
    datPassPhuHuynh('PASS-A')
    await momApi('review', { id: 'b1', sbd: '12001', token: 'T' })
    expect(goi[0].body).toEqual({ id: 'b1', sbd: '12001', token: 'T' })
    goi = []
    datPassPhuHuynh('')
    await parentNewsApi('list', '12001')
    await momApi('parent-list', { sbd: '12001' })
    expect(goi.map((g) => g.body)).toEqual([{ sbd: '12001' }, { sbd: '12001' }])
  })
})

describe('ParentPortalScreen với liên kết ?ph=', () => {
  it('mở /ph?ph=P: xoá ?ph= khỏi địa chỉ, tên con lấy từ /ph/xac-dinh (không tra SBD trần), lệnh PH sau đó gửi pass', async () => {
    window.history.replaceState(null, '', '/?vai=phuhuynh&ph=PASS-B')
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="man-chinh-ph"]')).toBeTruthy())
    expect(location.search).toBe('?vai=phuhuynh')
    expect(goi[0]).toEqual({ url: 'https://may.test/ph/xac-dinh', body: { pass: 'PASS-B' } })
    expect(container.querySelector('.phm-ap-dau__con')!.textContent).toContain('Nguyễn Văn Minh') // tên thật từ /ph/xac-dinh (màn chỉ hiện tên gọi)
    expect(container.textContent).not.toContain('TRẦN') // không phải tên tra bằng SBD trần
    await waitFor(() => expect(goi.some((g) => g.url.endsWith('/ph/tat-ca-ve-con'))).toBe(true))
    for (const g of goi.filter((x) => /tat-ca-ve-con|giao-them/.test(x.url))) expect(g.body.pass).toBe('PASS-B')
    expect(localStorage.getItem(KHOA_PH_PASS)).toBe('PASS-B')
  })

  it('liên kết hết hạn / sai: hiện ĐÚNG câu của máy chủ, xoá pass đã nhớ, vẫn cho nhập SBD như cũ (giai đoạn mềm)', async () => {
    xacDinh = { ok: false, error: 'Liên kết đã hết hạn. Anh/chị nhờ Thầy gửi liên kết mới.' }
    window.history.replaceState(null, '', '/?vai=phuhuynh&ph=CU')
    render(<ParentPortalScreen />)
    expect(await screen.findByText('Liên kết đã hết hạn. Anh/chị nhờ Thầy gửi liên kết mới.')).toBeTruthy()
    expect(screen.getByPlaceholderText(/Ví dụ: 12001/)).toBeTruthy()
    expect(localStorage.getItem(KHOA_PH_PASS)).toBeNull()
    expect(location.search).toBe('?vai=phuhuynh')
  })

  it('không có ?ph= và máy chưa nhớ pass: KHÔNG gọi /ph/xac-dinh (phụ huynh cũ vào bằng SBD như trước)', async () => {
    window.history.replaceState(null, '', '/?vai=phuhuynh')
    render(<ParentPortalScreen />)
    await screen.findByRole('button', { name: 'Vào xem kết quả của con' })
    expect(goi.some((g) => g.url.includes('/ph/xac-dinh'))).toBe(false)
  })
})
