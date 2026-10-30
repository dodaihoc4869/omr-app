// KHUNG TĨNH LỘ TRÌNH (thầy chụp 28/10 máy Android: mở app HS thấy MÀN TRẮNG, «Vẫn chưa tức thì»).
//
// Đo (scripts/do-mo-tuc-thi-hs.mjs, có service worker, CPU ×4, Fast 3G): mở lại thì HTML về sau ~10 ms, mọi mảnh mã về sau ~100 ms (bộ nhớ máy), nhưng
// Lộ trình chỉ hiện sau ~1,3 s: chạy mã khởi động (~400 ms CPU ×4) → mảnh cổng → mảnh «Trong» (nạp NỐI SAU mảnh cổng) → React dựng → lớp vào mục mờ dần
// 200 ms từ trong suốt. Suốt quãng ấy chỉ có nền trống — đúng ảnh thầy chụp.
//
// Cách sửa: lần mở trước, sau khi Lộ trình đã vẽ đủ số, lúc máy rảnh, CHỤP HTML của #root (đã làm sạch: không ô nhập, không hộp thoại, không màn làm
// bài — chỉ chụp khi Lộ trình đang là màn chính, đúng những gì em đang thấy) vào localStorage. Lần mở sau, đoạn mã nội tuyến NHỎ trong index.html
// (`moKhungTinh`, chạy lúc phân tích HTML, trước mã chính) dựng lại ảnh ấy trong một lớp phủ cố định `#khung-tinh-hs` ⇒ khung đầu đã là Lộ trình thật
// của em. React dựng Lộ trình xong (MotTrangHs gắn) thì gỡ lớp phủ trong CÙNG khung hình ⇒ không nháy. Chưa có ảnh (lần đầu sau khi cài bản này / ảnh
// khác ngày / khác khổ màn) ⇒ khung xương đúng bố cục Lộ trình. Số trên ảnh luôn là số HÔM NAY (ảnh khác ngày ⇒ bỏ, như đệm Sảnh — hoa2/api.ts).
// Không đăng nhập / giao diện cũ (`ddh.trong` = 'tat') / đường khác `/hs` trần ⇒ không làm gì.

import { ID_KHUNG_TINH, KHOA_KHUNG_TINH, PHIEN_BAN_KHUNG } from './khung-tinh-noi-tuyen'
import { KHOA_BI_TINH } from '../components/linh-vat/Bi'
export { ID_KHUNG_TINH, KHOA_KHUNG_TINH, PHIEN_BAN_KHUNG }
/** Trần cỡ ảnh (ký tự HTML) — lớn hơn ⇒ không lưu (giữ localStorage nhẹ, dựng nhanh). */
export const TRAN_KHUNG = 300_000

/** Ngày hôm nay giờ Việt Nam (YYYY-MM-DD) — cùng luật đệm Sảnh. */
export const ngayVn = (ms: number = Date.now()): string => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)

export interface AnhKhung {
  v: number
  sbd: string
  ngay: string
  /** Bề rộng cửa sổ lúc chụp (px CSS) — khổ khác (xoay máy, máy khác) ⇒ khung xương. */
  w: number
  html: string
}

/** Phần tử KHÔNG chụp: ô nhập, hộp thoại, khung nhúng, phương tiện, thẻ nổi. */
const BO = 'script,noscript,template,iframe,video,audio,canvas,input,textarea,select,dialog,[role=dialog],[role=alertdialog],[aria-modal],[data-khong-chup],.da-pop,img[src^="blob:"]'
/** Thuộc tính trỏ tới id khác (đổi tên id ⇒ bỏ cho khỏi trỏ sai) + thuộc tính tương tác. */
const BO_THUOC_TINH = ['for', 'aria-controls', 'aria-describedby', 'aria-labelledby', 'aria-activedescendant', 'aria-owns', 'autofocus', 'name', 'value']

/** Phần tử bên TRONG một hình SVG (path, defs, gradient…) — giữ / bỏ theo cả hình, không xét riêng (defs không có kích thước). */
const trongSvg = (e: Element): boolean => typeof SVGElement !== 'undefined' && e instanceof SVGElement && e.tagName.toLowerCase() !== 'svg'

/**
 * BỎ PHẦN NGOÀI MÀN (đo CPU ×4: mỗi nút của ảnh tốn thời gian tính kiểu + bố cục ở khung đầu, và chính khoảng ấy làm React dựng Lộ trình muộn đi): lớp phủ
 * chỉ hiện một màn hình ở ĐẦU trang ⇒ bỏ mọi phần tử nằm trọn ngoài khung nhìn (đường chặng phía dưới, menu ẩn mép phải, phần tử ẩn). Phần tử cố định
 * (rect trong màn hiện tại) giữ; đang cuộn ⇒ quy về đầu trang. `a[i]` (cây thật) ứng với `b[i]` (bản sao) — cùng thứ tự querySelectorAll('*').
 */
export function catNgoaiMan(a: Element[], b: Element[], ban: Element, rong: number, cao: number, cuon: number): void {
  if (a.length !== b.length) return
  const viTri = new Map<Element, number>(a.map((e, i) => [e, i]))
  const trong: boolean[] = new Array(a.length).fill(false)
  for (let i = a.length - 1; i >= 0; i--) {
    const e = a[i]!
    if (trongSvg(e)) continue
    if (!trong[i]) {
      const r = e.getBoundingClientRect()
      trong[i] = (r.width > 0 || r.height > 0) && r.right > 0 && r.left < rong && ((r.bottom + cuon > 0 && r.top + cuon < cao + 120) || (r.bottom > 0 && r.top < cao))
    }
    if (trong[i] && e.parentElement) { const j = viTri.get(e.parentElement); if (j !== undefined) trong[j] = true }
  }
  for (let i = 0; i < b.length; i++) {
    if (trong[i] || trongSvg(a[i]!)) continue
    const j = a[i]!.parentElement ? viTri.get(a[i]!.parentElement!) : undefined
    if (j === undefined ? b[i]!.parentElement === ban : trong[j]) b[i]!.remove()
  }
}

/** Thuộc tính kiểu cần để hình SVG đứng một mình (trong <img>) trông y như trên trang — kèm giá trị mặc định (bằng thì không ghi). */
const KIEU_SVG: [string, string][] = [['fill', 'rgb(0, 0, 0)'], ['fill-opacity', '1'], ['fill-rule', 'nonzero'], ['stroke', 'none'], ['stroke-width', '1px'], ['stroke-opacity', '1'],
  ['stroke-linecap', 'butt'], ['stroke-linejoin', 'miter'], ['stroke-dasharray', 'none'], ['stroke-dashoffset', '0px'], ['opacity', '1'], ['transform', 'none'],
  ['transform-origin', ''], ['transform-box', 'view-box'], ['display', 'inline'], ['visibility', 'visible'], ['clip-path', 'none'], ['mask', 'none'], ['filter', 'none'],
  ['font-family', ''], ['font-size', ''], ['font-weight', ''], ['text-anchor', 'start'], ['dominant-baseline', 'auto'], ['paint-order', 'normal']]
/** Kiểu của chính thẻ <svg> chuyển sang <img> thay nó (cỡ, dịch / phóng, mờ). */
const KIEU_GOC = ['display', 'width', 'height', 'transform', 'transform-origin', 'opacity', 'position', 'left', 'top', 'right', 'bottom', 'margin']

/**
 * LINH VẬT TĨNH: hình SVG dựng bằng mã (Cú Ngọc — lua-dong.ts, ~120 nút) ⇒ MỘT ảnh <img> SVG đứng một mình, kiểu đã tính sẵn ghi thẳng vào từng nét
 * (màu biến --tr-* đã quy ra rgb). Lớp phủ nhẹ hơn ~120 nút; cùng ảnh ấy giữ chỗ cho linh vật lúc mảnh hoạt ảnh chưa về (Bi.tsx) ⇒ không chớp mất.
 * Trả `{ src, st }` (st = kiểu của <img>) hoặc null.
 */
export function anhSvg(svg: SVGSVGElement): { src: string; st: string } | null {
  try {
    const ban = svg.cloneNode(true) as SVGSVGElement
    const a = [svg, ...Array.from(svg.querySelectorAll('*'))], b = [ban, ...Array.from(ban.querySelectorAll('*'))]
    for (let i = 0; i < a.length; i++) {
      const cs = getComputedStyle(a[i]!), tag = a[i]!.tagName.toLowerCase()
      let st = ''
      if (i > 0) for (const [k, mac] of KIEU_SVG) {
        if (k.startsWith('font') && tag !== 'text' && tag !== 'tspan') continue
        if (k === 'transform-origin' && cs.transform === 'none') continue
        const v = cs.getPropertyValue(k)
        if (v && v !== mac) st += `${k}:${v};`
      }
      b[i]!.removeAttribute('class')
      b[i]!.removeAttribute('style')
      if (st) b[i]!.setAttribute('style', st)
    }
    const csG = getComputedStyle(svg)
    ban.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    ban.setAttribute('width', String(parseFloat(csG.width) || 0))
    ban.setAttribute('height', String(parseFloat(csG.height) || 0))
    const ma = new XMLSerializer().serializeToString(ban).replace(/"/g, "'").replace(/[%#<>\n\r\t]/g, (c) => encodeURIComponent(c))
    let st = ''
    for (const k of KIEU_GOC) { const v = csG.getPropertyValue(k); if (v && v !== 'none' && v !== 'auto' && v !== 'static' && !(k === 'opacity' && v === '1') && !(k === 'margin' && v === '0px')) st += `${k}:${v};` }
    return { src: `data:image/svg+xml;charset=utf-8,${ma}`, st }
  } catch {
    return null
  }
}

/** Khoá đặt cho ảnh linh vật theo cỡ + cảm xúc + hướng (= `khoaBiTinh` của Bi.tsx). */
const khoaBi = (span: Element): string => `${(span as HTMLElement).style.getPropertyValue('--lv-w')}|${span.getAttribute('data-cam') ?? ''}|${span.getAttribute('data-goc') ?? ''}`

type AnhBi = { src: string; st: string; ngay?: string }
function docBi(): Record<string, AnhBi> {
  try { return (JSON.parse(localStorage.getItem(KHOA_BI_TINH) || '{}') as Record<string, AnhBi>) || {} } catch { return {} }
}
/** Ảnh linh vật đã quy ra ẢNH ĐIỂM (webp/png) — giải mã ngoài luồng chính, vẽ rẻ; ảnh SVG đứng một mình phải dựng lại cả tài liệu SVG (~120 nút) mỗi lần
 *  vẽ (đo CPU ×4: React dựng Lộ trình muộn thêm ~90 ms khi lớp phủ + khung giữ chỗ dùng ảnh SVG). */
const laAnhDiem = (a: AnhBi | undefined): a is AnhBi => !!a && /^data:image\/(?:webp|png)/.test(a.src)

/**
 * Quy linh vật trên Lộ trình ra ảnh điểm (mỗi ngày một lần, lúc máy rảnh): SVG đứng một mình (anhSvg) → <canvas> đúng cỡ × mật độ điểm ảnh → webp.
 * Lưu vào KHOA_BI_TINH theo khoá cỡ|cảm xúc|hướng. Lỗi (máy chặn canvas…) ⇒ bỏ qua, lần chụp sau dùng ảnh SVG.
 */
export async function raAnhBi(): Promise<void> {
  try {
    const root = document.getElementById('root')
    if (!root || !loTrinh || !chupDuoc(root)) return
    const kho = docBi(), hom = ngayVn()
    let doi = false
    for (const svg of Array.from(root.querySelectorAll<SVGSVGElement>('.bi.lua > svg.lua-svg'))) {
      const k = khoaBi(svg.parentElement!)
      if (laAnhDiem(kho[k]) && kho[k]!.ngay === hom) continue
      const cs = getComputedStyle(svg), w = parseFloat(cs.width), h = parseFloat(cs.height)
      const a = anhSvg(svg)
      if (!a || !(w > 0 && h > 0)) continue
      const img = new Image()
      img.src = a.src
      await img.decode()
      const tl = Math.min(3, Math.max(1, window.devicePixelRatio || 1))
      const c = document.createElement('canvas')
      c.width = Math.round(w * tl)
      c.height = Math.round(h * tl)
      const g = c.getContext('2d')
      if (!g) continue
      g.drawImage(img, 0, 0, c.width, c.height)
      kho[k] = { src: c.toDataURL('image/webp', 0.9), st: a.st, ngay: hom }
      doi = true
    }
    if (doi) localStorage.setItem(KHOA_BI_TINH, JSON.stringify(kho))
  } catch { /* máy chặn canvas / lưu: giữ như cũ */ }
}

/** Đổi linh vật thành ảnh tĩnh trong bản sao (ảnh điểm đã có ⇒ dùng; chưa có ⇒ ảnh SVG); bỏ giám thị (mảnh nạp lười — lượt vẽ đầu của React cũng
 *  chưa có ⇒ lớp phủ khớp đúng lượt vẽ ấy). `raBi` nhận ảnh SVG của khoá CHƯA có ảnh nào (Bi.tsx dùng làm khung giữ chỗ). */
function linhVatTinh(a: Element[], b: Element[], ban: Element, raBi: Record<string, { src: string; st: string }>): void {
  const kho = docBi()
  for (let i = 0; i < a.length; i++) {
    const e = a[i]!
    if (!ban.contains(b[i]!)) continue
    if (e.classList.contains('gt-o')) { b[i]!.remove(); continue }
    if (e.tagName.toLowerCase() === 'svg' && e.classList.contains('lua-svg')) {
      const span = e.closest('.bi.lua'), k = span ? khoaBi(span) : ''
      const co = k ? kho[k] : undefined
      const anh = laAnhDiem(co) ? co : anhSvg(e as SVGSVGElement)
      if (!anh) { b[i]!.remove(); continue }
      const img = b[i]!.ownerDocument.createElement('img')
      img.className = 'lua-svg bi-tinh'
      img.setAttribute('alt', '')
      img.setAttribute('src', anh.src)
      img.setAttribute('style', anh.st)
      b[i]!.replaceWith(img)
      if (k && !co) raBi[k] = anh
    }
  }
}

/**
 * Làm sạch bản sao của #root thành chuỗi HTML tĩnh. Đổi mọi `id` thành `kt-<id>` (kèm `url(#…)` / `href="#…"` của hình SVG) — lớp phủ còn trong
 * trang lúc React dựng, `getElementById` của app không được trúng phần tử của ảnh. Trả null nếu quá cỡ. `raBi` nhận ảnh tĩnh của linh vật (Bi.tsx dùng).
 */
export function lamSachKhung(goc: Element, khungNhin?: { rong: number; cao: number; cuon: number }, raBi: Record<string, { src: string; st: string }> = {}): string | null {
  const ban = goc.cloneNode(true) as Element
  const a = Array.from(goc.querySelectorAll('*')), b = Array.from(ban.querySelectorAll('*'))
  if (khungNhin) catNgoaiMan(a, b, ban, khungNhin.rong, khungNhin.cao, khungNhin.cuon)
  if (a.length === b.length) linhVatTinh(a, b, ban, raBi)
  ban.querySelectorAll(BO).forEach((e) => e.remove())
  // Dải tên bài dính (chỉ hiện khi đã cuộn) ⇒ ảnh luôn là Lộ trình ở đầu trang.
  ban.querySelectorAll('.da-dai-dinh[data-hien]').forEach((e) => e.removeAttribute('data-hien'))
  ban.querySelectorAll('*').forEach((e) => {
    for (const a of BO_THUOC_TINH) if (e.hasAttribute(a)) e.removeAttribute(a)
    for (const a of [...e.getAttributeNames()]) if (/^on/i.test(a)) e.removeAttribute(a)
  })
  const html = ban.innerHTML
    .replace(/\sid="([^"]*)"/g, ' id="kt-$1"')
    .replace(/url\((&quot;|["'])?#/g, (_m, q: string | undefined) => `url(${q ?? ''}#kt-`)
    .replace(/(\s(?:xlink:)?href=")#/g, '$1#kt-')
  return html.length > TRAN_KHUNG ? null : html
}

/** Lộ trình đang là màn chính, đủ số, không tấm / màn nào đè ⇒ chụp được. */
export function chupDuoc(root: Element | null): boolean {
  if (!root) return false
  if (!root.querySelector('.ht-app[data-mot] .da-vo[aria-busy="false"]')) return false
  return !root.querySelector('.fixed.inset-0, [role=dialog], [aria-modal], .ht2-phu-nen')
}

let loTrinh = false
/** MotTrangHs báo mục đang mở có phải Lộ trình không (chỉ chụp Lộ trình — Luyện tập / Thành tích không chụp). */
export function baoLoTrinh(co: boolean): void {
  loTrinh = co
  if (!co && hen) { window.clearTimeout(hen); hen = 0 }
}

/** Chụp NGAY (đã kiểm điều kiện). Máy chặn lưu / quá cỡ ⇒ bỏ qua, không bao giờ ném lỗi. */
export function chupKhungTinhHs(sbd: string | undefined): boolean {
  try {
    if (typeof document === 'undefined' || !sbd) return false
    const root = document.getElementById('root')
    if (!loTrinh || !chupDuoc(root) || document.getElementById(ID_KHUNG_TINH)) return false
    const raBi: Record<string, { src: string; st: string }> = {}
    const html = lamSachKhung(root!, { rong: window.innerWidth, cao: window.innerHeight, cuon: window.scrollY || 0 }, raBi)
    if (!html) return false
    const anh: AnhKhung = { v: PHIEN_BAN_KHUNG, sbd: String(sbd).trim(), ngay: ngayVn(), w: window.innerWidth, html }
    localStorage.setItem(KHOA_KHUNG_TINH, JSON.stringify(anh))
    if (Object.keys(raBi).length) localStorage.setItem(KHOA_BI_TINH, JSON.stringify({ ...docBi(), ...raBi }))
    return true
  } catch {
    try { localStorage.removeItem(KHOA_KHUNG_TINH) } catch { /* máy chặn lưu */ }
    return false
  }
}

/** Số báo danh của phiên đang lưu (= KHOA_PHIEN_HS của phien-hoc-sinh.ts; đọc thẳng để mảnh «Trong» không kéo mô-đun phiên thành tệp riêng). */
export function sbdPhien(): string | undefined {
  try {
    const p = JSON.parse(localStorage.getItem('omr_student_portal_auth') || 'null') as { sbd?: unknown } | null
    return p?.sbd ? String(p.sbd) : undefined
  } catch {
    return undefined
  }
}

let hen = 0
/** Đã có ảnh của HÔM NAY cho em này (khỏi chụp dự phòng lúc rảnh). */
function coAnhHomNay(sbd: string): boolean {
  try {
    const a = JSON.parse(localStorage.getItem(KHOA_KHUNG_TINH) || 'null') as Partial<AnhKhung> | null
    return !!a && a.v === PHIEN_BAN_KHUNG && a.sbd === sbd.trim() && a.ngay === ngayVn()
  } catch { return false }
}
/**
 * Hẹn chụp. CHỤP CHÍNH lúc em RỜI app (trang ẩn — chuyển app, tắt màn): ảnh là trạng thái mới nhất, và việc chụp (~30–60 ms ở CPU ×4) không chen vào
 * lúc em đang chạm (đo 28/10: chụp lúc rảnh ngay sau khi mở làm «tới chạm được» lùi thêm một tác vụ dài). DỰ PHÒNG: hôm nay chưa có ảnh ⇒ chụp một lần
 * lúc máy rảnh sau 20 giây (máy chưa từng ẩn trang).
 */
export function henChupKhungTinhHs(sbd: string | undefined): void {
  if (typeof window === 'undefined' || !sbd) return
  ganRoiApp(sbd)
  if (hen) return
  const coAnh = coAnhHomNay(sbd)
  const kho = docBi(), coDiem = Object.values(kho).some((x) => laAnhDiem(x) && x.ngay === ngayVn())
  if (coAnh && coDiem) return
  hen = window.setTimeout(() => {
    const w = window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }
    // ảnh điểm linh vật trước (bất đồng bộ), rồi ảnh Lộ trình nếu hôm nay chưa có; chưa chụp được (đang ở màn khác) ⇒ lần đổi số sau hẹn lại
    const lam = () => { void raAnhBi().then(() => { if (!coAnhHomNay(sbd) && !chupKhungTinhHs(sbd)) hen = 0 }) }
    if (w.requestIdleCallback) w.requestIdleCallback(lam, { timeout: 10_000 })
    else lam()
  }, 20_000)
}
let daGanRoi = ''
function ganRoiApp(sbd: string): void {
  if (daGanRoi === sbd) return
  const lanDau = !daGanRoi
  daGanRoi = sbd
  if (!lanDau) return
  const roi = () => { if (document.visibilityState === 'hidden' && daGanRoi) chupKhungTinhHs(daGanRoi) }
  document.addEventListener('visibilitychange', roi)
  window.addEventListener('pagehide', roi)
}

/** Gỡ lớp phủ (React đã dựng màn thật). Gọi nhiều lần / không có lớp phủ ⇒ không làm gì. */
export function goKhungTinh(): void {
  try {
    const w = window as Window & { __ddhGoKhungTinh?: (() => void) | null }
    w.__ddhGoKhungTinh?.()
  } catch { /* không có window (test) */ }
}


