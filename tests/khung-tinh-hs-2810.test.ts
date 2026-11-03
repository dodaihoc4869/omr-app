// KHUNG TĨNH LỘ TRÌNH (thầy 28/10, máy Android: mở app HS thấy màn trắng — «Vẫn chưa tức thì»). Xem src/lib/khung-tinh-hs.ts + khung-tinh-noi-tuyen.ts.
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { chupDuoc, lamSachKhung, ngayVn } from '../src/lib/khung-tinh-hs'
import { ID_KHUNG_TINH, KHOA_KHUNG_TINH, PHIEN_BAN_KHUNG, moKhungTinh } from '../src/lib/khung-tinh-noi-tuyen'
import { taoMaNapTruoc } from '../src/lib/nap-truoc-man-em'

const doc = (p: string) => readFileSync(new URL('../' + p, import.meta.url), 'utf8')
const PHIEN = 'omr_student_portal_auth'
const CSS = ['/assets/trong-a.css', '/assets/TrongHs-b.css']

function dat(duong: string): void {
  window.history.replaceState(null, '', duong)
}
function mo(): void {
  moKhungTinh(window, document, CSS, KHOA_KHUNG_TINH, PHIEN)
}
const anh = (them: Record<string, unknown> = {}) => JSON.stringify({ v: PHIEN_BAN_KHUNG, sbd: '99001', ngay: ngayVn(), w: window.innerWidth, html: '<div class="ht-app ht2" data-mot="1"><button>Học tiếp</button></div>', ...them })

beforeEach(() => {
  localStorage.clear()
  document.body.innerHTML = '<main id="root"></main>'
  document.head.querySelectorAll('link').forEach((l) => l.remove())
  document.documentElement.removeAttribute('data-ht2')
  document.documentElement.removeAttribute('data-trong')
  // jsdom không có matchMedia: khổ màn luôn khớp (đúng như máy thật mở lại cùng máy)
  ;(window as unknown as { matchMedia: (q: string) => { matches: boolean } }).matchMedia = (q: string) => ({ matches: !/display-mode/.test(q) })
})
afterEach(() => {
  ;(window as unknown as { __ddhGoKhungTinh?: (() => void) | null }).__ddhGoKhungTinh?.()
  dat('/')
})

describe('đoạn mã nội tuyến: dựng lớp phủ trước mã chính', () => {
  it('đã đăng nhập + ảnh của HÔM NAY ⇒ lớp phủ đúng ảnh, chèn tờ kiểu (đúng thứ tự, cùng href ⇒ Vite không chèn lại), gỡ lớp phủ giữ tờ kiểu', () => {
    dat('/hs')
    localStorage.setItem(PHIEN, JSON.stringify({ sbd: '99001', token: 't' }))
    localStorage.setItem(KHOA_KHUNG_TINH, anh())
    mo()
    const o = document.getElementById(ID_KHUNG_TINH)!
    expect(o).toBeTruthy()
    expect(o.getAttribute('aria-hidden')).toBe('true')
    expect(o.hasAttribute('inert')).toBe(true)
    expect(o.textContent).toContain('Học tiếp')
    expect([...document.head.querySelectorAll('link[rel=stylesheet]')].map((l) => l.getAttribute('href'))).toEqual(CSS)
    expect(document.documentElement.dataset.trong).toBe('hs')
    ;(window as unknown as { __ddhGoKhungTinh: () => void }).__ddhGoKhungTinh()
    expect(document.getElementById(ID_KHUNG_TINH)).toBeNull()
    expect(document.head.querySelectorAll('link[rel=stylesheet]').length).toBe(2)
    expect(document.documentElement.hasAttribute('data-ht2')).toBe(false) // React chưa dựng .ht2 ⇒ bỏ cờ
  })
  it('ảnh của NGÀY KHÁC / em khác / phiên bản cũ ⇒ lớp phủ CHỈ NỀN — không khung xương (thầy 03/11 «xoá đi»), không bao giờ hiện số ngày khác', () => {
    dat('/hs')
    localStorage.setItem(PHIEN, JSON.stringify({ sbd: '99001', token: 't' }))
    for (const sai of [{ ngay: '2020-01-01' }, { sbd: '12345' }, { v: 1 }]) {
      localStorage.setItem(KHOA_KHUNG_TINH, anh(sai))
      mo()
      const o = document.getElementById(ID_KHUNG_TINH)!
      expect(o.textContent).not.toContain('Học tiếp')
      expect(o.querySelector('div')).toBeNull() // chỉ thẻ <style> tắt hoạt ảnh, không hình gì
      ;(window as unknown as { __ddhGoKhungTinh: () => void }).__ddhGoKhungTinh()
    }
  })
  it('chưa đăng nhập / giao diện cũ / đường khác / đường có tham số khác ⇒ không dựng gì', () => {
    localStorage.setItem(KHOA_KHUNG_TINH, anh())
    dat('/hs'); mo()
    expect(document.getElementById(ID_KHUNG_TINH)).toBeNull() // chưa đăng nhập (đã đăng xuất) ⇒ xoá luôn ảnh của em trước (máy dùng chung)
    expect(localStorage.getItem(KHOA_KHUNG_TINH)).toBeNull()
    localStorage.setItem(KHOA_KHUNG_TINH, anh())
    localStorage.setItem(PHIEN, JSON.stringify({ sbd: '99001', token: 't' }))
    localStorage.setItem('ddh.trong', 'tat'); mo()
    expect(document.getElementById(ID_KHUNG_TINH)).toBeNull()
    localStorage.removeItem('ddh.trong')
    for (const d of ['/gv', '/ph', '/t/123456', '/hs?thongbao=1']) {
      dat(d); mo()
      expect(document.getElementById(ID_KHUNG_TINH)).toBeNull()
    }
  })
  it('đã bỏ khung xương Lộ trình cũ (thầy 03/11): mã nội tuyến không còn hàm dựng khung xương', () => {
    expect(doc('src/lib/khung-tinh-noi-tuyen.ts')).not.toMatch(/taoKhungXuong|LECH_XUONG/)
    expect(doc('vite.config.ts')).not.toMatch(/taoKhungXuong/)
  })
})

describe('chụp ảnh Lộ trình: làm sạch', () => {
  it('bỏ ô nhập / hộp thoại / tấm nổi, đổi id (kèm url(#…) của hình SVG), bỏ thuộc tính trỏ id', () => {
    const g = document.createElement('div')
    g.innerHTML = '<div class="ht-app" data-mot="1"><input value="bí mật"><div role="dialog">x</div><div class="da-pop">p</div>' +
      '<label for="a">nhãn</label><svg><defs><linearGradient id="g1"></linearGradient></defs><path fill="url(#g1)"></path><use href="#g1"></use></svg>' +
      '<div id="tr-menu-dem" aria-labelledby="x">số</div></div>'
    const html = lamSachKhung(g)!
    expect(html).not.toContain('<input')
    expect(html).not.toContain('role="dialog"')
    expect(html).not.toContain('da-pop')
    expect(html).not.toContain('bí mật')
    expect(html).not.toContain('for=')
    expect(html).not.toContain('aria-labelledby')
    expect(html).toContain('id="kt-g1"')
    expect(html).toContain('url(#kt-g1)')
    expect(html).toContain('href="#kt-g1"')
    expect(html).toContain('id="kt-tr-menu-dem"')
  })
  it('chỉ chụp khi Lộ trình đủ số là màn chính (không màn làm bài / tấm đè)', () => {
    const r = document.createElement('div')
    r.innerHTML = '<div class="ht-app" data-mot="1"><main class="da-vo" aria-busy="false"></main></div>'
    expect(chupDuoc(r)).toBe(true)
    r.insertAdjacentHTML('beforeend', '<div class="fixed inset-0 z-50">màn làm bài</div>')
    expect(chupDuoc(r)).toBe(false)
    r.innerHTML = '<div class="ht-app" data-mot="1"><main class="da-vo" aria-busy="true"></main></div>'
    expect(chupDuoc(r)).toBe(false)
  })
})

describe('nạp trước: mảnh «Trong» cùng lúc mảnh cổng; máy có service worker ⇒ chèn thẻ nạp trước SAU khung đầu', () => {
  const BANG = { thi: [], hs: ['/assets/Cong.js'], ph: [], hsVo: ['/assets/Vo.js'], hsTrong: ['/assets/TrongHs.js', '/assets/TrongHs.css'] }
  const chay = (controller: unknown) => {
    const raf: (() => void)[] = []
    const w = { requestAnimationFrame: (f: () => void) => raf.push(f) }
    const st = { getItem: (k: string) => (k === PHIEN ? JSON.stringify({ sbd: '1', token: 't' }) : null) }
    new Function('document', 'location', 'localStorage', 'navigator', 'window', 'fetch', 'requestAnimationFrame', taoMaNapTruoc(BANG))(
      document, { pathname: '/hs', search: '' }, st, { serviceWorker: { controller } }, w, () => new Promise(() => {}), w.requestAnimationFrame)
    return raf
  }
  const hrefs = () => [...document.head.querySelectorAll('link')].map((l) => l.getAttribute('href'))
  it('chưa có service worker ⇒ nạp ngay cả vỏ, cổng, «Trong»', () => {
    chay(null)
    expect(hrefs()).toEqual(expect.arrayContaining(['/assets/Vo.js', '/assets/Cong.js', '/assets/TrongHs.js', '/assets/TrongHs.css']))
  })
  it('có service worker ⇒ vỏ ngay; cổng + «Trong» sau khung hình đầu', async () => {
    const raf = chay({})
    expect(hrefs()).toEqual(['/assets/Vo.js'])
    raf.forEach((f) => f())
    await new Promise((r) => setTimeout(r, 5))
    expect(hrefs()).toEqual(expect.arrayContaining(['/assets/Cong.js', '/assets/TrongHs.js']))
  })
})

describe('nối dây', () => {
  it('MotTrangHs gỡ lớp phủ khi gắn + hẹn chụp; màn đăng nhập gỡ lớp phủ', () => {
    const trong = doc('src/components/hoc-tap/TrongHs.tsx')
    expect(trong).toMatch(/useLayoutEffect\(\(\) => \{ goKhungTinh\(\) \}, \[\]\)/)
    expect(trong).toContain('henChupKhungTinhHs(')
    expect(doc('src/screens/DangNhapHocSinh.tsx')).toContain('__ddhGoKhungTinh?.()')

  })
  it('lần vẽ đầu của Lộ trình không mờ dần từ trong suốt (chỉ khi đổi mục)', () => {
    expect(doc('src/components/hoc-tap/HocTapHomNay.tsx')).toContain("daDoiMuc.current ? 'ht-noi-dung ht2-noi-dung tt-vao-muc' : 'ht-noi-dung ht2-noi-dung'")
  })
})

describe('không khung xương ở app học sinh (thầy 03/11 «màn nào load bị vậy nữa xoá sạch»)', () => {
  it('mọi lớp khối giữ chỗ lúc tải trong suốt, không nhấp nháy (giữ chỗ, không nhảy bố cục)', () => {
    const luat = doc('src/styles/khong-xuong-hs.css')
    expect(doc('src/components/hoc-tap/TrongHs.tsx')).toMatch(/import '\.\.\/\.\.\/styles\/khong-xuong-hs\.css'/)
    for (const l of ['.m3-xuong', '.tlu-xuong', '.tcl-xuong', '.ktcn-xuong span', '.ht2-hn-xuong > span', '.ht2-hn-chip-xuong', '.ht2-cho-tab', '.xd-xuong']) expect(luat).toContain(l)
    expect(luat).toMatch(/background: transparent !important;[^}]*animation: none !important/)
  })
})
