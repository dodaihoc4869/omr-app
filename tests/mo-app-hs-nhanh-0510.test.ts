// MỞ APP HỌC SINH NHANH (05/10, thầy: "nhanh gấp 2 lần", giữ nguyên giao diện): đoạn mã nội tuyến index.html chọn đúng nhóm mảnh theo đường
// vào + phiên, chỉ HỎI SỚM lệnh Sảnh khi máy em đã đăng nhập và đã biết máy chủ; lệnh hỏi sớm chỉ được NHẬN đúng một lần, đúng địa chỉ + thân.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { KHOA_DIA_CHI_HS, KHOA_PHIEN_HS, LENH_HOI_SOM, taoMaNapTruoc, type BangNapTruoc } from '../src/lib/nap-truoc-man-em'
import { batDauHoiSom, danhDauDaNhan, ghiDiaChiDaDung, layHoiSom, xemHoiSomDaVe } from '../src/lib/hoi-som'

const BANG: BangNapTruoc = {
  thi: ['/assets/ExamTakeScreen-a.js'],
  hs: ['/assets/StudentPortalScreen-c.js', '/assets/StudentPortalScreen-c.css'],
  ph: ['/assets/ParentPortalScreen-d.js'],
  app: ['/assets/App-e.js'],
  hsVo: ['/assets/AppHocSinh-f.js'],
  phongHs: ['/assets/be-vietnam-pro-latin-400-normal-g.woff2'],
  katex: ['/assets/katex-goi-h.js', '/assets/katex-goi-h.css'],
}
const GOC = 'https://omr.ttadodaihoc.workers.dev'

type The = { rel: string; as?: string; type?: string; href: string; crossOrigin: string | null; fetchPriority?: string }
function chay(duong: string, q: string, o: { phien?: object | null; diaChi?: string; coSw?: boolean } = {}) {
  const them: The[] = []
  const goi: { url: string; than: string }[] = []
  const khiXong: (() => void)[] = []
  const document = {
    head: { appendChild: (l: The) => them.push(l) },
    createElement: () => ({ rel: '', href: '', crossOrigin: null }) as The,
    addEventListener: (ten: string, f: () => void) => ten === 'DOMContentLoaded' && khiXong.push(f),
  }
  const kho: Record<string, string> = {}
  if (o.phien) kho[KHOA_PHIEN_HS] = JSON.stringify(o.phien)
  if (o.diaChi) kho[KHOA_DIA_CHI_HS] = o.diaChi
  const localStorage = { getItem: (k: string) => kho[k] ?? null }
  const navigator = { serviceWorker: o.coSw ? { controller: {} } : { controller: null } }
  const fetch = (url: string, init: { body: string }) => {
    goi.push({ url, than: init.body })
    return new Promise(() => {})
  }
  const window = { fetch } as Record<string, unknown>
  new Function('document', 'location', 'localStorage', 'navigator', 'window', 'fetch', taoMaNapTruoc(BANG))(document, { pathname: duong, search: q }, localStorage, navigator, window, fetch)
  const truocKhiXong = them.length
  for (const f of khiXong) f()
  return { them, goi, window, truocKhiXong }
}

describe('đoạn mã nội tuyến — cổng học sinh', () => {
  it('máy CHƯA đăng nhập: vỏ + màn đăng nhập nạp ngay; mảnh cổng + KaTeX nạp SAU DOMContentLoaded, ưu tiên THẤP; không gọi máy chủ', () => {
    const { them, goi, truocKhiXong } = chay('/hs', '')
    expect(truocKhiXong).toBe(1)
    expect(them.map((t) => [t.href, t.fetchPriority ?? ''])).toEqual([
      ['/assets/AppHocSinh-f.js', ''],
      ['/assets/StudentPortalScreen-c.js', 'low'],
      ['/assets/StudentPortalScreen-c.css', 'low'],
      ['/assets/katex-goi-h.js', 'low'],
      ['/assets/katex-goi-h.css', 'low'],
    ])
    expect(goi).toEqual([])
  })

  it('máy ĐÃ đăng nhập + biết máy chủ: nạp vỏ + cổng (thường), hỏi sớm đúng 5 lệnh Sảnh với đúng thân lệnh các màn gửi', () => {
    const { them, goi } = chay('/hs', '', { phien: { sbd: ' 99001 ', token: 'tk1', hoTen: 'Em' }, diaChi: GOC })
    expect(them.map((t) => t.href)).toEqual(['/assets/AppHocSinh-f.js', '/assets/StudentPortalScreen-c.js', '/assets/StudentPortalScreen-c.css'])
    expect(them.every((t) => !t.fetchPriority)).toBe(true)
    expect(goi).toEqual([
      { url: GOC + '/game-v2/hoa2-sanh', than: '{"token":"tk1"}' },
      { url: GOC + '/hs/ke-hoach-ngay', than: '{"token":"tk1"}' },
      { url: GOC + '/hs/ca-dang-mo', than: '{"token":"tk1"}' },
      { url: GOC + '/hs/buoi-hoc', than: '{"token":"tk1"}' },
      { url: GOC + '/hs/lich-su', than: '{"sbd":"99001"}' },
    ])
    expect(LENH_HOI_SOM).toHaveLength(5)
  })

  it('phông Sảnh chỉ nạp trước khi trang do service worker phục vụ', () => {
    const phien = { sbd: '1', token: 't' }
    expect(chay('/hs', '', { phien, diaChi: GOC }).them.some((t) => t.as === 'font')).toBe(false)
    const coSw = chay('/hs', '', { phien, diaChi: GOC, coSw: true }).them.filter((t) => t.as === 'font')
    expect(coSw).toEqual([{ rel: 'preload', as: 'font', type: 'font/woff2', href: BANG.phongHs![0], crossOrigin: '' }])
  })

  it('địa chỉ máy chủ lạ (không https, có đường dẫn) hoặc phiên không token ⇒ KHÔNG hỏi sớm', () => {
    expect(chay('/hs', '', { phien: { sbd: '1', token: 't' }, diaChi: 'http://x.dev' }).goi).toEqual([])
    expect(chay('/hs', '', { phien: { sbd: '1', token: 't' }, diaChi: GOC + '/duong' }).goi).toEqual([])
    expect(chay('/hs', '', { phien: { sbd: '1', token: 't' } }).goi).toEqual([])
    // Không token: chỉ lệnh theo SBD (/hs/lich-su) được hỏi — y như màn gửi.
    expect(chay('/hs', '', { phien: { sbd: '1' }, diaChi: GOC }).goi.map((g) => g.url)).toEqual([GOC + '/hs/lich-su'])
  })

  it('link riêng CŨ (?vai=hs, /hs/<token>) không phải cổng: nạp App.tsx, không vỏ học sinh, không hỏi sớm (cùng kết luận main.tsx)', () => {
    for (const [d, q] of [['/hs', '?vai=hs'], ['/hs/abcdefgh1234', '?vai=hocsinh'], ['/', '?vai=ph']]) {
      const { them, goi } = chay(d, q, { phien: { sbd: '1', token: 't' }, diaChi: GOC })
      expect(them.map((t) => t.href)).toEqual(['/assets/App-e.js'])
      expect(goi).toEqual([])
    }
  })

  it('đường khác giữ nguyên: thi/phụ huynh nạp App.tsx + mảnh của mình; app thầy, phiếu, `/` trần chỉ nạp App.tsx', () => {
    expect(chay('/t/123456', '').them.map((t) => t.href)).toEqual(['/assets/App-e.js', '/assets/ExamTakeScreen-a.js'])
    expect(chay('/ph', '').them.map((t) => t.href)).toEqual(['/assets/App-e.js', '/assets/ParentPortalScreen-d.js'])
    for (const d of ['/gv', '/p', '/']) expect(chay(d, '').them.map((t) => t.href)).toEqual(['/assets/App-e.js'])
  })
})

describe('hoi-som — nhận phản hồi hỏi sớm', () => {
  const thanTk = (token: string) => JSON.stringify({ token })
  let goiThat: ReturnType<typeof vi.fn>
  const fetchCu = window.fetch
  beforeEach(() => {
    ;(window as unknown as { __ddhHoiSom?: unknown }).__ddhHoiSom = undefined
    goiThat = vi.fn(async (url: string) => new Response(JSON.stringify({ ok: true, url }), { status: 200, headers: { 'x-nhip-de-nghi': '' } }))
    vi.stubGlobal('fetch', goiThat)
    window.fetch = goiThat as unknown as typeof fetch
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    window.fetch = fetchCu
  })

  it('đúng địa chỉ + thân ⇒ nhận MỘT lần (không gửi lại); lần sau trả null để màn gửi lệnh thật', async () => {
    batDauHoiSom(GOC, { token: 'tk1', sbd: '9' })
    expect(goiThat).toHaveBeenCalledTimes(5)
    const r = await layHoiSom(GOC + '/game-v2/hoa2-sanh', thanTk('tk1'))
    expect(r && (await r.json())).toEqual({ ok: true, url: GOC + '/game-v2/hoa2-sanh' })
    expect(layHoiSom(GOC + '/game-v2/hoa2-sanh', thanTk('tk1'))).toBeNull()
    expect(goiThat).toHaveBeenCalledTimes(5)
  })

  it('khác thân (em khác) hoặc khác máy chủ ⇒ không nhận', () => {
    batDauHoiSom(GOC, { token: 'tk1', sbd: '9' })
    expect(layHoiSom(GOC + '/game-v2/hoa2-sanh', thanTk('tk2'))).toBeNull()
    expect(layHoiSom('https://khac.workers.dev/game-v2/hoa2-sanh', thanTk('tk1'))).toBeNull()
    expect(layHoiSom(GOC + '/hs/lich-su', JSON.stringify({ sbd: '9' }))).not.toBeNull()
  })

  it('lượt hỏi sớm hỏng (mất mạng) ⇒ trả null: chỗ gọi tự gửi lệnh như cũ', async () => {
    goiThat.mockImplementation(async () => {
      throw new TypeError('Failed to fetch')
    })
    batDauHoiSom(GOC, { token: 'tk1', sbd: '9' })
    await expect(layHoiSom(GOC + '/hs/buoi-hoc', thanTk('tk1'))).resolves.toBeNull()
  })

  it('hết hạn chờ của chỗ gọi ⇒ ném AbortError như fetch', async () => {
    goiThat.mockImplementation(() => new Promise(() => {}))
    batDauHoiSom(GOC, { token: 'tk1', sbd: '9' })
    const c = new AbortController()
    const hua = layHoiSom(GOC + '/hs/ke-hoach-ngay', thanTk('tk1'), c.signal)
    c.abort()
    await expect(hua).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('đọc đồng bộ cho lượt vẽ đầu chỉ khi đã biết máy chủ đang dùng + phản hồi đã về; đánh dấu đã nhận thì thôi', async () => {
    batDauHoiSom(GOC, { token: 'tk1', sbd: '9' })
    const than = thanTk('tk1')
    await layHoiSom('https://chua-nhan.dev/x', than) // không nhận gì, chỉ chờ lượt fetch giả xong
    await new Promise((r) => setTimeout(r, 0))
    ghiDiaChiDaDung('https://khac.workers.dev')
    expect(xemHoiSomDaVe('/game-v2/hoa2-sanh', than)).toBeNull()
    ghiDiaChiDaDung(GOC)
    expect(xemHoiSomDaVe('/game-v2/hoa2-sanh', than)).toMatchObject({ ok: true, status: 200 })
    danhDauDaNhan('/game-v2/hoa2-sanh', than)
    expect(xemHoiSomDaVe('/game-v2/hoa2-sanh', than)).toBeNull()
  })
})
