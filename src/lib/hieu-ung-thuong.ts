// HIỆU ỨNG THƯỞNG PHẠT (HIEU-UNG.md phần A6–A8, B, C, D, E, H — thầy 26/10 «hấp dẫn hơn Duolingo»). Bản TS của ve-moi/tp.js:
// - chỉ transform + opacity (Web Animations API), đếm số bằng requestAnimationFrame; KHÔNG thư viện;
// - hạt nằm trong MỘT lớp `position:fixed; overflow:hidden; pointer-events:none` ⇒ không làm tràn trang, không chặn bấm; ≤ 40 hạt; xong thì gỡ;
// - giảm chuyển động (prefers-reduced-motion) ⇒ không chuyển động, giữ màu + số cuối; máy yếu (html.may-yeu) ⇒ nửa số hạt, không hoa giấy;
// - xongHieuUng(): bấm nút chính giữa hiệu ứng ⇒ nhảy tới trạng thái cuối (kết thúc mọi hoạt ảnh hữu hạn, gỡ hạt, số về số cuối);
// - phanHoiThuong(kieu): rung (rung.ts) + tiếng (am-thanh-thuong.ts / am-thanh.ts) CÙNG nhịp, một chỗ gọi.
import { duocPhanHoi } from './rung'
import { phat } from './am-thanh'
import { phatThuong, type KieuTiengThuong } from './am-thanh-thuong'

export type MucChuyenDong = 'du' | 'nhe' | 'khong'
export function mucChuyenDong(): MucChuyenDong {
  if (typeof window === 'undefined') return 'khong'
  try { if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 'khong' } catch { /* bỏ qua */ }
  return document.documentElement.classList.contains('may-yeu') ? 'nhe' : 'du'
}
export const coChuyenDong = () => mucChuyenDong() !== 'khong'

// ───────────────────────────── phản hồi (rung + tiếng)
export type KieuThuong = KieuTiengThuong | 'xong' | 'binh' | 'mua' | 'goCua' | 'huyHieu' | 'mucTieu' | 'hoanHao' | 'chuoiTat' | 'truot' | 'giuHang' | 'cuocThua' | 'gui' | 'khongTinh'
const RUNG: Record<KieuThuong, number[]> = {
  combo: [12, 30, 12], tinhThe: [8], ruong: [20, 40, 30, 40, 60], lenHang: [30, 50, 30, 50, 80], roiHang: [60], chuoi: [25, 40, 50], vo: [40, 30, 20],
  thangHoa: [80], xong: [20, 40, 20, 40, 60], binh: [15, 40, 25], mua: [10, 30, 10], goCua: [18, 120, 18], huyHieu: [20, 40, 40], mucTieu: [20, 40, 20, 40, 60],
  hoanHao: [30, 50, 30, 50, 80], chuoiTat: [50], truot: [35, 60, 35], giuHang: [18], cuocThua: [40, 30, 20], gui: [10], khongTinh: [12], set: [120], tick: [8],
}
const TIENG: Partial<Record<KieuThuong, [KieuTiengThuong, number?] | 'xong'>> = {
  combo: ['combo'], tinhThe: ['tinhThe'], ruong: ['ruong'], lenHang: ['lenHang'], roiHang: ['roiHang'], chuoi: ['chuoi'], vo: ['vo'], thangHoa: ['thangHoa'],
  xong: 'xong', binh: ['tinhThe'], mua: ['tinhThe'], goCua: ['combo', 0], huyHieu: ['ruong'], mucTieu: 'xong', hoanHao: ['lenHang'], chuoiTat: ['roiHang'],
  truot: ['roiHang'], giuHang: ['combo', 2], cuocThua: ['vo'], gui: ['tinhThe'],
}
export function phanHoiThuong(kieu: KieuThuong, bac = 0): void {
  if (duocPhanHoi('ddh.rung')) {
    // chỉ rung sau khi em đã chạm trang (trình duyệt chặn rung trước lần chạm đầu và ghi lỗi ra bảng điều khiển)
    try { const n = navigator as Navigator & { vibrate?: (m: number[]) => boolean; userActivation?: { hasBeenActive: boolean } }; if (typeof n.vibrate === 'function' && n.userActivation?.hasBeenActive !== false) n.vibrate(RUNG[kieu].map((v, i) => (i % 2 ? v : Math.max(v, 35)))) /* 27/10: nhịp bật ≥ 35 ms (máy Android không rung kịp nhịp ngắn) */ } catch { /* bỏ qua */ }
  }
  const t = TIENG[kieu]
  if (t === 'xong') phat('xong')
  else if (t) phatThuong(t[0], t[1] ?? bac)
}

// ───────────────────────────── công cụ hoạt ảnh
const ketThuc = new Set<() => void>()
/** Đăng kí việc «về trạng thái cuối» (đếm số đang chạy…) — xongHieuUng() gọi hết. Trả hàm huỷ đăng kí. */
export function khiXong(f: () => void): () => void { ketThuc.add(f); return () => { ketThuc.delete(f) } }

export function hoatAnh(el: Element | null | undefined, kf: Keyframe[], ms: number, o: { tre?: number; e?: string; fill?: FillMode; lap?: number } = {}): Animation | null {
  if (!el || !coChuyenDong() || typeof (el as HTMLElement).animate !== 'function') return null
  try { return (el as HTMLElement).animate(kf, { duration: ms, easing: o.e ?? 'cubic-bezier(.2,.8,.2,1)', delay: o.tre ?? 0, fill: o.fill ?? 'backwards', iterations: o.lap ?? 1 }) } catch { return null }
}
export const cho = (ms: number) => new Promise<void>((r) => setTimeout(r, coChuyenDong() ? ms : 0))

let lop: HTMLDivElement | null = null
function layLop(): HTMLDivElement {
  if (!lop || !lop.isConnected) { lop = document.createElement('div'); lop.className = 'tp-lop'; lop.setAttribute('aria-hidden', 'true'); document.body.append(lop) }
  return lop
}
const tam = (el: Element): [number, number] => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2] }
const MAU_HAT = ['dung', 'tin', 'sao', 'sai', 'tt', 'bang'] as const
export type MauHat = (typeof MAU_HAT)[number] | 'kc' | 'lua' | 'trang' | 'chu3' | 'vang'
const soHat = (n: number) => Math.min(40, mucChuyenDong() === 'nhe' ? Math.ceil(n / 2) : n)

/** Bung hạt lục giác (hoặc tròn) từ một điểm / tâm phần tử. */
export function bungHat(goc: Element | [number, number] | null | undefined, o: { n?: number; r?: number; d?: number; tron?: boolean; mau?: readonly MauHat[]; co?: number; roi?: number; tre?: number } = {}): void {
  if (!goc || !coChuyenDong() || typeof document === 'undefined') return
  const [x, y] = Array.isArray(goc) ? goc : tam(goc)
  const L = layLop(), n = soHat(o.n ?? 8), d = o.d ?? 450, r = o.r ?? 70, mau = o.mau ?? MAU_HAT
  for (let i = 0; i < n; i++) {
    const h = document.createElement('i')
    h.className = `tp-hat tp-hat-${mau[i % mau.length]}${o.tron ? ' tron' : ''}`
    const s = o.co ?? 8 + Math.random() * 8
    h.style.cssText = `left:${x}px;top:${y}px;width:${s}px;height:${s}px;margin:${-s / 2}px 0 0 ${-s / 2}px`
    L.append(h)
    const g = (i / n) * Math.PI * 2 + Math.random() * 0.5, k = r * (0.6 + Math.random() * 0.6)
    if (typeof h.animate !== 'function') { h.remove(); continue }
    h.animate([{ transform: 'translate(0,0) scale(.3) rotate(0)', opacity: 1 }, { transform: `translate(${Math.cos(g) * k}px,${Math.sin(g) * k + (o.roi ?? 0)}px) scale(1) rotate(${Math.random() * 240}deg)`, opacity: 0 }],
      { duration: d * (0.8 + Math.random() * 0.4), easing: 'cubic-bezier(.1,.7,.3,1)', delay: o.tre ?? 0, fill: 'backwards' }).onfinish = () => h.remove()
  }
}
/** Hoa giấy lục giác rơi khắp màn (B3, E2). Máy yếu ⇒ bỏ. */
export function hoaGiay(n = 36, d = 1200): void {
  if (mucChuyenDong() !== 'du' || typeof document === 'undefined') return
  const L = layLop(), W = innerWidth, H = innerHeight
  for (let i = 0; i < Math.min(n, 40); i++) {
    const h = document.createElement('i'); const s = 8 + Math.random() * 8
    h.className = `tp-hat tp-hat-${MAU_HAT[i % 6]}`
    h.style.cssText = `left:${Math.random() * W}px;top:-12px;width:${s}px;height:${s}px`
    L.append(h)
    if (typeof h.animate !== 'function') { h.remove(); continue }
    h.animate([{ transform: 'translateY(0) rotate(0)', opacity: 1 }, { transform: `translate(${(Math.random() - 0.5) * 80}px,${H * (0.55 + Math.random() * 0.45)}px) rotate(${360 + Math.random() * 360}deg)`, opacity: 0.1 }],
      { duration: d * (0.75 + Math.random() * 0.5), delay: Math.random() * 300, easing: 'cubic-bezier(.3,.1,.6,1)', fill: 'backwards' }).onfinish = () => h.remove()
  }
}
/** Đếm số từ `tu` tới `toi` (rAF) ghi thẳng vào phần tử KHÔNG do React quản chữ. Giảm chuyển động ⇒ ghi số cuối ngay. */
export function demSo(el: HTMLElement | null, tu: number, toi: number, ms = 700, dinh: (v: number) => string = (v) => v.toLocaleString('vi-VN')): Promise<void> {
  return new Promise((xong) => {
    if (!el) return xong()
    if (!coChuyenDong() || tu === toi || typeof requestAnimationFrame !== 'function') { el.textContent = dinh(toi); return xong() }
    let huy = false
    let go = () => {}
    const het = () => { huy = true; el.textContent = dinh(toi); go(); xong() }
    go = khiXong(het)
    const t0 = performance.now()
    // MÁY YẾU 30/10 (hồ sơ «Tiếp tục» CPU ×6: số đếm ghi chữ MỖI khung ⇒ tính bố cục mỗi khung đúng lúc câu mới dựng): chỉ ghi khi số hiện ĐỔI — hiệu ứng
    // đếm giữ nguyên từng khung (thầy 30/10 «Không được bỏ hiệu ứng»), chỉ bỏ lượt ghi trùng số.
    let cu = ''
    const buoc = (t: number) => {
      if (huy) return
      const p = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - p, 3)
      const s = dinh(Math.round(tu + (toi - tu) * e)); if (s !== cu) { el.textContent = s; cu = s }
      if (p < 1) requestAnimationFrame(buoc); else { go(); xong() }
    }
    el.textContent = dinh(tu); requestAnimationFrame(buoc)
  })
}
/** Lật số: số cũ lật lên, số mới lật vào (C1, E1). Ghi thẳng phần tử KHÔNG do React quản chữ. */
export function latSo(el: HTMLElement | null, cu: string, moi: string, ms = 520): void {
  if (!el) return
  if (!coChuyenDong() || typeof el.animate !== 'function') { el.textContent = moi; return }
  el.innerHTML = ''
  const m = document.createElement('span'), c = document.createElement('span')
  m.className = 'tp-lat-moi'; c.className = 'tp-lat-cu'; m.textContent = moi; c.textContent = cu
  el.append(m, c)
  let go = () => {}
  const het = () => { el.textContent = moi; go() }
  go = khiXong(het)
  c.animate([{ transform: 'translateY(0) rotateX(0)', opacity: 1 }, { transform: 'translateY(-60%) rotateX(80deg)', opacity: 0 }], { duration: ms * 0.6, easing: 'ease-in', fill: 'forwards' })
  m.animate([{ transform: 'translateY(60%) rotateX(-80deg)', opacity: 0 }, { transform: 'translateY(0) rotateX(0)', opacity: 1 }], { duration: ms * 0.6, delay: ms * 0.4, easing: 'cubic-bezier(.2,1.4,.4,1)', fill: 'backwards' }).onfinish = het
}
/** Tinh thể bay theo đường cong tới bộ đếm (D1). `dem(p)` gọi mỗi viên tới (p = 0..1). */
export function bayToi(tu: Element | null | undefined, toi: Element | null | undefined, o: { n?: number; d?: number; dem?: (p: number) => void } = {}): Promise<void> {
  const n = soHat(o.n ?? 6), d = o.d ?? 700
  return new Promise((xong) => {
    if (!coChuyenDong() || !tu || !toi || typeof document === 'undefined') { o.dem?.(1); return xong() }
    const L = layLop(), [x0, y0] = tam(tu), [x1, y1] = tam(toi), dx = x1 - x0, dy = y1 - y0
    let ve = 0
    const xongMot = () => { ve++; hoatAnh(toi, [{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], 200); phanHoiThuong('tinhThe'); o.dem?.(ve / n); if (ve === n) xong() }
    for (let i = 0; i < n; i++) {
      const h = document.createElement('i'); h.className = 'tp-hat tp-hat-gem'; h.style.cssText = `left:${x0}px;top:${y0}px`
      L.append(h)
      if (typeof h.animate !== 'function') { h.remove(); xongMot(); continue }
      const lx = (Math.random() - 0.5) * 120, ly = -40 - Math.random() * 60
      const kf: Keyframe[] = []
      for (let k = 0; k <= 8; k++) { const t = k / 8; kf.push({ transform: `translate(${2 * (1 - t) * t * (dx * 0.25 + lx) + t * t * dx}px,${2 * (1 - t) * t * (dy * 0.15 + ly) + t * t * dy}px) scale(${k === 0 ? 0.4 : k === 8 ? 0.6 : 1.1})`, opacity: k === 8 ? 0.2 : 1 }) }
      h.animate(kf, { duration: d, delay: i * 70, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'backwards' }).onfinish = () => { h.remove(); xongMot() }
    }
  })
}
/** Nhảy tới trạng thái cuối: kết thúc mọi hoạt ảnh hữu hạn, gỡ hạt, ghi số cuối. Không ảnh hưởng hoạt ảnh lặp (Bi nhún, lửa leo lét). */
export function xongHieuUng(): void {
  if (typeof document === 'undefined') return
  try {
    for (const a of document.getAnimations?.() ?? []) {
      const t = a.effect?.getTiming?.()
      if (t && t.iterations !== Infinity && a instanceof Animation && !(a as CSSAnimation).animationName) try { a.finish() } catch { /* bỏ qua */ }
    }
  } catch { /* bỏ qua */ }
  if (lop) lop.innerHTML = ''
  for (const f of [...ketThuc]) f()
  ketThuc.clear()
}
