// MỞ APP HỌC SINH NHANH (05/10, thầy: "nhanh gấp 2 lần", giữ nguyên giao diện): đoạn mã nội tuyến index.html chọn đúng nhóm mảnh theo đường
// vào + phiên, chỉ HỎI SỚM lệnh Sảnh khi máy em đã đăng nhập và đã biết máy chủ; lệnh hỏi sớm chỉ được NHẬN đúng một lần, đúng địa chỉ + thân.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { KHOA_DIA_CHI_HS, KHOA_PHIEN_HS, LENH_HOI_SOM, taoMaNapTruoc, type BangNapTruoc } from '../src/lib/nap-truoc-man-em'
import { batDauHoiSom, danhDauDaNhan, ghiDiaChiDaDung, layHoiSom, xemHoiSomDaVe } from '../src/lib/hoi-som'
import { ghiNhoKetQuaSanh, type KetQuaSanh } from '../src/components/hoa2/api'

const BANG: BangNapTruoc = {
  thi: ['/assets/ExamTakeScreen-a.js'],
  hs: ['/assets/StudentPortalScreen-c.js', '/assets/StudentPortalScreen-c.css'],
  ph: ['/assets/ParentPortalScreen-d.js'],
  app: ['/assets/App-e.js'],
  hsVo: ['/assets/AppHocSinh-f.js'],
  phongHs: ['/assets/be-vietnam-pro-latin-400-normal-g.woff2'],
  katex: ['/assets/katex-goi-h.js', '/assets/katex-goi-h.css'],
  anhDangNhapHs: '/than-thu-v2/nho/thu-1-3.webp',
}
const GOC = 'https://omr.ttadodaihoc.workers.dev'

type The = { rel: string; as?: string; type?: string; href: string; crossOrigin: string | null; fetchPriority?: string }
function chay(duong: string, q: string, o: { phien?: object | null; diaChi?: string; coSw?: boolean; luu?: Record<string, string>; caMo?: 'khong' | 'co' | 'hong' } = {}) {
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
  Object.assign(kho, o.luu ?? {})
  const localStorage = { getItem: (k: string) => kho[k] ?? null }
  const navigator = { serviceWorker: o.coSw ? { controller: {} } : { controller: null } }
  const fetch = (url: string, init: { body: string }) => {
    goi.push({ url, than: init.body })
    // Chỉ khi test nói rõ về ca đang mở thì lệnh `/hs/ca-dang-mo` mới có phản hồi (mọi lệnh khác treo như cũ).
    if (o.caMo && url.endsWith('/hs/ca-dang-mo')) {
      if (o.caMo === 'hong') return Promise.reject(new Error('mạng'))
      const text = JSON.stringify({ ok: true, coCaMo: o.caMo === 'co', soCa: o.caMo === 'co' ? 1 : 0 })
      return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(text), headers: { get: () => null } })
    }
    return new Promise(() => {})
  }
  const window = { fetch } as Record<string, unknown>
  new Function('document', 'location', 'localStorage', 'navigator', 'window', 'fetch', taoMaNapTruoc(BANG))(document, { pathname: duong, search: q }, localStorage, navigator, window, fetch)
  const truocKhiXong = them.length
  for (const f of khiXong) f()
  return { them, goi, window, truocKhiXong }
}

// SỬA CÓ CHỦ ĐÍCH 13/10: lệnh Sảnh hỏi sớm = `hoc-tap-sanh` (đúng lệnh Hôm nay dùng; trước hỏi `hoa2-sanh` mà màn không nhận ⇒ máy chủ chạy thừa).
describe('đoạn mã nội tuyến — cổng học sinh', () => {
  // SỬA CÓ CHỦ ĐÍCH 13/10 (thầy: "tối ưu cả cho máy yếu" — đo Chromium CPU chậm 6× + mạng 1,6 Mbps): màn đăng nhập không có công thức ⇒ KHÔNG nạp
  // trước KaTeX (83 KB nén giành đường truyền với ảnh lớn nhất của màn); thay bằng nạp trước CHÍNH ảnh ấy (phần tử lớn nhất màn đầu).
  it('máy CHƯA đăng nhập: vỏ + màn đăng nhập + ảnh thần thú nạp ngay; mảnh cổng nạp SAU DOMContentLoaded, ưu tiên THẤP; KHÔNG KaTeX; không gọi máy chủ', () => {
    const { them, goi, truocKhiXong } = chay('/hs', '')
    expect(truocKhiXong).toBe(2)
    expect(them.map((t) => [t.href, t.fetchPriority ?? ''])).toEqual([
      ['/assets/AppHocSinh-f.js', ''],
      ['/than-thu-v2/nho/thu-1-3.webp', ''],
      ['/assets/StudentPortalScreen-c.js', 'low'],
      ['/assets/StudentPortalScreen-c.css', 'low'],
    ])
    expect(them[1]).toMatchObject({ rel: 'preload', as: 'image' })
    expect(goi).toEqual([])
  })

  it('máy ĐÃ đăng nhập + biết máy chủ: nạp vỏ + cổng (thường), hỏi sớm đúng 5 lệnh Sảnh với đúng thân lệnh các màn gửi', () => {
    const { them, goi } = chay('/hs', '', { phien: { sbd: ' 99001 ', token: 'tk1', hoTen: 'Em' }, diaChi: GOC })
    expect(them.map((t) => t.href)).toEqual(['/assets/AppHocSinh-f.js', '/assets/StudentPortalScreen-c.js', '/assets/StudentPortalScreen-c.css'])
    expect(them.every((t) => !t.fetchPriority)).toBe(true)
    expect(goi).toEqual([
      { url: GOC + '/game-v2/hoc-tap-sanh', than: '{"token":"tk1"}' },
      { url: GOC + '/hs/ke-hoach-ngay', than: '{"token":"tk1"}' },
      { url: GOC + '/hs/ca-dang-mo', than: '{"token":"tk1"}' },
      { url: GOC + '/hs/buoi-hoc', than: '{"token":"tk1"}' },
      { url: GOC + '/hs/lich-su', than: '{"sbd":"99001"}' },
    ])
    expect(LENH_HOI_SOM).toHaveLength(5)
  })

  // MỞ CHẶNG SỚM (21/10, ảnh thầy "Đang chuẩn bị những câu phù hợp với em…" — "bình thường vào tức thì"): chỉ khi đệm Sảnh HÔM NAY nói em còn việc
  // VÀ lệnh hỏi sớm `/hs/ca-dang-mo` báo KHÔNG có ca đang mở. Đệm ghi bằng đúng hàm thật `ghiNhoKetQuaSanh` (khoá + hình dạng do app tự ghi).
  describe('mở chặng sớm (hoc-tap-start lúc đọc HTML)', () => {
    const hom = () => new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10)
    const SBD = ' 99001 ' // có khoảng trắng như phiên lưu — khoá đệm dùng đúng chuỗi này
    const phien = { sbd: SBD, token: 'tk1' }
    const xong = () => new Promise<void>((r) => setTimeout(r, 0))
    /** Đệm Sảnh do hàm THẬT ghi vào jsdom, rồi chép sang kho giả của đoạn mã nội tuyến. */
    const dem = (sanh: object, sbd = SBD) => {
      ghiNhoKetQuaSanh(sbd, { cheDo2: true, sanh } as unknown as KetQuaSanh)
      const k = `omr_hoa2_sanh_dem:${sbd}`
      const v = localStorage.getItem(k)!
      localStorage.removeItem(k)
      return { [k]: v }
    }
    const duongGoi = (r: ReturnType<typeof chay>) => r.goi.map((g) => g.url.replace(GOC, ''))
    const CON = (con: number, them: object = {}) => ({ ngay: hom(), theLuc: { con, tong: 12 }, ...them })
    it('đệm hôm nay CÒN VIỆC + KHÔNG ca đang mở ⇒ gửi thêm hoc-tap-start với thân {"token":…}, hạn dùng 10 phút; vẫn đúng 5 lệnh Sảnh trước', async () => {
      const r = chay('/hs', '', { phien, diaChi: GOC, luu: dem(CON(12)), caMo: 'khong' })
      expect(duongGoi(r)).toEqual(['/game-v2/hoc-tap-sanh', '/hs/ke-hoach-ngay', '/hs/ca-dang-mo', '/hs/buoi-hoc', '/hs/lich-su']) // chưa biết ca ⇒ chưa gửi
      await xong()
      expect(duongGoi(r).at(-1)).toBe('/game-v2/hoc-tap-start')
      expect(r.goi.at(-1)).toEqual({ url: GOC + '/game-v2/hoc-tap-start', than: '{"token":"tk1"}' })
      const muc = (r.window.__ddhHoiSom as Record<string, { het?: number; tuHtml?: boolean }>)['/game-v2/hoc-tap-start']!
      expect(muc.tuHtml).toBe(true)
      expect(muc.het! - Date.now()).toBeGreaterThan(590_000)
      expect(muc.het! - Date.now()).toBeLessThanOrEqual(600_000)
    })
    it('KHÔNG gửi khi: có ca đang mở · lệnh ca lỗi / chưa về · chưa có đệm · đệm ngày khác · hết việc (con = 0) · ngày kiểm tra riêng · đệm hỏng', async () => {
      const ca = (caMo: 'co' | 'hong' | undefined, luu: Record<string, string>) => chay('/hs', '', { phien, diaChi: GOC, luu, caMo })
      const rs = [
        ca('co', dem(CON(12))),
        ca('hong', dem(CON(12))),
        ca(undefined, dem(CON(12))), // lệnh ca treo
        ca('khong', {}),
        ca('khong', dem({ ngay: '2000-01-01', theLuc: { con: 12 } })),
        ca('khong', dem(CON(0))),
        ca('khong', dem(CON(12, { kiemTraCaNhan: { homNay: true, baiNgayToiThieu: false } }))),
        ca('khong', { [`omr_hoa2_sanh_dem:${SBD}`]: '{khong-phai-json' }),
      ]
      await xong()
      for (const r of rs) expect(duongGoi(r)).toHaveLength(5)
    })
    it('ngày kiểm tra riêng NHƯNG có bài ngày tối thiểu (baiNgayToiThieu) ⇒ vẫn học được ⇒ gửi (cùng luật `ngayKiem` của HocTapHomNay)', async () => {
      const r = chay('/hs', '', { phien, diaChi: GOC, luu: dem(CON(5, { kiemTraCaNhan: { homNay: true, baiNgayToiThieu: true } })), caMo: 'khong' })
      await xong()
      expect(duongGoi(r).at(-1)).toBe('/game-v2/hoc-tap-start')
    })
    it('khoá đệm khớp cả khi phiên lưu SBD sạch khoảng trắng; máy chưa đăng nhập / địa chỉ máy chủ lạ ⇒ không gửi gì, kể cả có đệm', async () => {
      const r = chay('/hs', '', { phien: { sbd: '99001', token: 'tk1' }, diaChi: GOC, luu: dem(CON(3), '99001'), caMo: 'khong' })
      await xong()
      expect(duongGoi(r).at(-1)).toBe('/game-v2/hoc-tap-start')
      const luu = dem(CON(12))
      expect(chay('/hs', '', { luu, caMo: 'khong' }).goi).toEqual([])
      expect(chay('/hs', '', { phien, diaChi: 'http://x.dev', luu, caMo: 'khong' }).goi).toEqual([])
    })
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

  it('link riêng CŨ (?vai=hs, /hs/<token>, ?vai=ph) từ 22/10 là cổng của vai: nạp y như /hs, /ph (cùng kết luận main.tsx)', () => {
    const o = { phien: { sbd: '1', token: 't' }, diaChi: GOC }
    const hs = chay('/hs', '', o)
    for (const [d, q] of [['/hs', '?vai=hs'], ['/hs/abcdefgh1234', '?vai=hocsinh'], ['/hs/abcdefgh1234', '']]) {
      const r = chay(d, q, o)
      expect(r.them.map((t) => t.href), d + q).toEqual(hs.them.map((t) => t.href))
      expect(r.goi.map((g) => g.url), d + q).toEqual(hs.goi.map((g) => g.url))
    }
    expect(chay('/', '?vai=ph', o).them.map((t) => t.href)).toEqual(chay('/ph', '', o).them.map((t) => t.href))
  })

  // 25/10 (tức thì hơn nữa): cổng phụ huynh có gốc riêng `AppPhuHuynh` ⇒ bảng có `phVo` thì đường phụ huynh nạp vỏ + mảnh cổng, KHÔNG nạp App.tsx.
  it('có nhóm phVo: /ph, /phu-huynh, ?vai=ph nạp vỏ phụ huynh + mảnh cổng, không App.tsx; đường khác không đổi', () => {
    const B2: BangNapTruoc = { ...BANG, phVo: ['/assets/AppPhuHuynh-p.js'] }
    const chay2 = (duong: string, q: string) => {
      const them: The[] = []
      const document = { head: { appendChild: (l: The) => them.push(l) }, createElement: () => ({ rel: '', href: '', crossOrigin: null }) as The, addEventListener: () => {} }
      new Function('document', 'location', 'localStorage', 'navigator', 'window', 'fetch', taoMaNapTruoc(B2))(document, { pathname: duong, search: q }, { getItem: () => null }, { serviceWorker: { controller: null } }, {}, () => new Promise(() => {}))
      return them.map((t) => t.href)
    }
    for (const [d, q] of [['/ph', ''], ['/phu-huynh', ''], ['/', '?vai=ph'], ['/ph/abcdefgh1234', '']]) expect(chay2(d, q), d + q).toEqual(['/assets/AppPhuHuynh-p.js', '/assets/ParentPortalScreen-d.js'])
    expect(chay2('/t/123456', '')).toEqual(['/assets/App-e.js', '/assets/ExamTakeScreen-a.js'])
    for (const d of ['/gv', '/p', '/']) expect(chay2(d, '')).toEqual(['/assets/App-e.js'])
  })
  it('main.tsx dựng gốc AppPhuHuynh cho cổng phụ huynh; gốc ấy cùng cây ChanLoi → Suspense → BatLinhShell vai="ph" → ParentPortalScreen như App.tsx', () => {
    const ma = readFileSync('src/main.tsx', 'utf8')
    expect(ma).toContain("import('./AppPhuHuynh')")
    expect(ma).toMatch(/laCongPhuHuynh = dvMo\.vai === 'phuhuynh'/)
    const vo = readFileSync('src/AppPhuHuynh.tsx', 'utf8')
    expect(vo).toContain('<ChanLoi o="Cổng phụ huynh">')
    expect(vo).toContain('<BatLinhShell vai="ph"><ParentPortalScreen /></BatLinhShell>')
    expect(vo).not.toMatch(/from '\.\/App'/)
    expect(readFileSync('src/App.tsx', 'utf8')).toContain('<BatLinhShell vai="ph"><ParentPortalScreen /></BatLinhShell>')
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
    const r = await layHoiSom(GOC + '/game-v2/hoc-tap-sanh', thanTk('tk1'))
    expect(r && (await r.json())).toEqual({ ok: true, url: GOC + '/game-v2/hoc-tap-sanh' })
    expect(layHoiSom(GOC + '/game-v2/hoc-tap-sanh', thanTk('tk1'))).toBeNull()
    expect(goiThat).toHaveBeenCalledTimes(5)
  })

  it('khác thân (em khác) hoặc khác máy chủ ⇒ không nhận', () => {
    batDauHoiSom(GOC, { token: 'tk1', sbd: '9' })
    expect(layHoiSom(GOC + '/game-v2/hoc-tap-sanh', thanTk('tk2'))).toBeNull()
    expect(layHoiSom('https://khac.workers.dev/game-v2/hoc-tap-sanh', thanTk('tk1'))).toBeNull()
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
    expect(xemHoiSomDaVe('/game-v2/hoc-tap-sanh', than)).toBeNull()
    ghiDiaChiDaDung(GOC)
    expect(xemHoiSomDaVe('/game-v2/hoc-tap-sanh', than)).toMatchObject({ ok: true, status: 200 })
    danhDauDaNhan('/game-v2/hoc-tap-sanh', than)
    expect(xemHoiSomDaVe('/game-v2/hoc-tap-sanh', than)).toBeNull()
  })
})
