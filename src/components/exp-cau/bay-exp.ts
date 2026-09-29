// "+N EXP" BAY VÀO THẦN THÚ (Boss bổ sung 29/09, cùng PR EXP v5): số (kèm 3–5 đốm sáng) bay theo đường cong từ chỗ câu/nút chốt tới ẢNH THẦN THÚ trên màn, ~700 ms;
// tới nơi thú loé sáng nhẹ (+ vòng sáng ngắn khi lên cấp) và phát sự kiện `exp-cau-toi` để thanh EXP nhích.
// Chỉ dùng transform/opacity qua Web Animations API (không đổi bố cục, không rAF riêng). Máy yếu ('gon'): số bay THẲNG, không đốm. Xin giảm chuyển động ('tinh'): không bay.
// Không tìm thấy đích (hoặc trình duyệt không có `Element.animate`) ⇒ trả null, nơi gọi giữ hành vi cũ (số hiện tại chỗ).
import type { CheDoHieuUng } from '../../lib/hieu-ung-exp-cau'

/** Đích mặc định, theo thứ tự ưu tiên: đánh dấu riêng · Đảo 2 · Đảo cũ · Đoàn Hộ Tống (thú của em) · thanh EXP nhỏ (ôn câu, BTVN, Bi-a). */
export const DICH_EXP_MAC_DINH = ['[data-dich-exp]', '.dao2-canh-thu', '.dao-san-thu', '.dh-thu-em', '.exp-thanh-nho-ray'] as const
export const THOI_GIAN_BAY_MS = 700
/** Tên sự kiện phát trên `window` khi số tới thú: `detail = { exp }`. */
export const SU_KIEN_TOI = 'exp-cau-toi'

const hienRo = (el: Element): boolean => {
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.height > 0
}

/** Đích đầu tiên đang hiện trên màn theo danh sách chọn. */
export function timDich(chon: readonly string[] = DICH_EXP_MAC_DINH, goc: ParentNode = document): HTMLElement | null {
  for (const s of chon) {
    for (const el of Array.from(goc.querySelectorAll<HTMLElement>(s))) if (hienRo(el)) return el
  }
  return null
}

/** Điểm trên đường cong bậc hai (t = 0…1) từ A qua điểm điều khiển C tới B. */
export function diemCong(a: { x: number; y: number }, c: { x: number; y: number }, b: { x: number; y: number }, t: number): { x: number; y: number } {
  const u = 1 - t
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y }
}

/** Khung hình (transform + opacity) cho một vật bay từ A tới B. `cong = false` ⇒ bay thẳng. `thuNho` = tỉ lệ cỡ lúc tới. */
export function khungBay(a: { x: number; y: number }, b: { x: number; y: number }, o: { cong: boolean; lech?: number; thuNho?: number; soKhung?: number }): Keyframe[] {
  const n = Math.max(2, o.soKhung ?? 12)
  const c = o.cong
    ? { x: (a.x + b.x) / 2 + (o.lech ?? 0), y: Math.min(a.y, b.y) - Math.max(60, Math.abs(a.x - b.x) * 0.35) }
    : { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  const ra: Keyframe[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = diemCong(a, c, b, t)
    const s = 1 + ((o.thuNho ?? 0.55) - 1) * t
    ra.push({ offset: t, transform: `translate(-50%, -50%) translate(${(p.x - a.x).toFixed(1)}px, ${(p.y - a.y).toFixed(1)}px) scale(${s.toFixed(3)})`, opacity: t < 0.8 ? 1 : Math.max(0, (1 - t) / 0.2) })
  }
  return ra
}

const taoVat = (lop: string, x: number, y: number, chu = ''): HTMLElement => {
  const el = document.createElement('span')
  el.className = lop
  el.setAttribute('aria-hidden', 'true')
  el.style.left = `${x}px`
  el.style.top = `${y}px`
  if (chu) el.textContent = chu
  document.body.appendChild(el)
  return el
}

/**
 * Cho số `chu` bay từ `nguon` vào thú. Trả hàm huỷ (gỡ mọi vật bay) hoặc null khi không bay (tĩnh / không có đích / không có WAAPI).
 * `xong` gọi MỘT lần lúc số tới nơi (kể cả khi bị huỷ sớm thì không gọi).
 */
export function bayVaoThu(nguon: HTMLElement, chu: string, cheDo: CheDoHieuUng, o: { exp: number; lenCap?: boolean; dich?: readonly string[]; xong?: () => void } = { exp: 0 }): (() => void) | null {
  if (cheDo === 'tinh' || typeof document === 'undefined' || typeof nguon.animate !== 'function') return null
  const dich = timDich(o.dich ?? DICH_EXP_MAC_DINH)
  if (!dich || dich.contains(nguon)) return null
  const ra = nguon.getBoundingClientRect(), rb = dich.getBoundingClientRect()
  if (!(ra.width > 0) || !(rb.width > 0)) return null
  const a = { x: ra.left + ra.width / 2, y: ra.top + ra.height / 2 }
  const b = { x: rb.left + rb.width / 2, y: rb.top + rb.height * (dich.classList.contains('exp-thanh-nho-ray') ? 0.5 : 0.42) }
  const vat: HTMLElement[] = []
  const hoatAnh: Animation[] = []
  let daXong = false
  const go = () => { for (const h of hoatAnh) { try { h.cancel() } catch { /* đã xong */ } } for (const v of vat) v.remove() }
  const so = taoVat('exp-bay-so', a.x, a.y, chu)
  vat.push(so)
  const chinh = so.animate(khungBay(a, b, { cong: cheDo === 'day-du' }), { duration: THOI_GIAN_BAY_MS, easing: 'cubic-bezier(.45,0,.25,1)', fill: 'forwards' })
  hoatAnh.push(chinh)
  if (cheDo === 'day-du') {
    const soDom = 4
    for (let i = 0; i < soDom; i++) {
      const d = taoVat('exp-bay-hat', a.x, a.y)
      vat.push(d)
      hoatAnh.push(d.animate(khungBay(a, b, { cong: true, lech: (i - (soDom - 1) / 2) * 28, thuNho: 0.3, soKhung: 10 }), { duration: THOI_GIAN_BAY_MS - 60 + i * 40, delay: i * 35, easing: 'cubic-bezier(.4,0,.3,1)', fill: 'forwards' }))
    }
  }
  chinh.onfinish = () => {
    if (daXong) return
    daXong = true
    for (const v of vat) v.remove()
    // Loé sáng nhẹ ở thú (vòng sáng đè lên ảnh — chỉ transform/opacity), lên cấp thì vòng to và lâu hơn.
    const co = Math.max(48, Math.min(rb.width, rb.height))
    const loe = taoVat(o.lenCap ? 'exp-loe exp-loe-cap' : 'exp-loe', b.x, b.y)
    loe.style.width = loe.style.height = `${co}px`
    const hl = loe.animate(
      o.lenCap
        ? [{ transform: 'translate(-50%, -50%) scale(.5)', opacity: 0 }, { transform: 'translate(-50%, -50%) scale(1.25)', opacity: 0.95, offset: 0.35 }, { transform: 'translate(-50%, -50%) scale(1.9)', opacity: 0 }]
        : [{ transform: 'translate(-50%, -50%) scale(.6)', opacity: 0 }, { transform: 'translate(-50%, -50%) scale(1.05)', opacity: 0.7, offset: 0.4 }, { transform: 'translate(-50%, -50%) scale(1.3)', opacity: 0 }],
      { duration: o.lenCap ? 800 : 480, easing: 'ease-out', fill: 'forwards' },
    )
    hl.onfinish = () => loe.remove()
    vat.length = 0
    vat.push(loe)
    hoatAnh.length = 0
    hoatAnh.push(hl)
    try { window.dispatchEvent(new CustomEvent(SU_KIEN_TOI, { detail: { exp: o.exp } })) } catch { /* trình duyệt cũ */ }
    o.xong?.()
  }
  return go
}
