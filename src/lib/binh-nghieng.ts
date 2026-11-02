// BÌNH «HÔM NAY» NGHIÊNG THEO MÁY (thầy 02/11 tối: «nghiêng máy thì chất lỏng bên trong nghiêng theo» — docs/ban-ve-binh-0211/DAC-TA.md mục 3).
// Mặt dung dịch luôn nằm ngang theo trọng lực: màn nghiêng θ (cùng chiều kim đồng hồ) ⇒ khối dung dịch trong bình xoay −θ.
// NHẸ: mảnh này nạp lúc rảnh (không ở lượt mở app); chỉ nghe cảm biến khi bình đang hiện trên màn và tab đang mở; mỗi khung chỉ đổi
// MỘT thuộc tính transform của một nhóm SVG; vòng rAF TỰ DỪNG khi đã lặng (cảm biến rung tay ±0,5° bị lọc + vùng chết, không đánh thức lại).
// Máy yếu / xin giảm chuyển động ⇒ vẫn nghiêng nhưng tắt dần tới hạn (không sóng sánh). Màn xoay ngang ⇒ đứng yên (chỉ hỗ trợ cầm dọc).

/** Góc tối đa của mặt dung dịch (độ). */
export const GOC_MAX = 35
/** Vùng chết (độ): rung tay nhỏ hơn mức này không đánh thức vòng vẽ. */
export const VUNG_CHET = 0.8

/** Góc nghiêng của màn trong mặt phẳng màn hình (độ, dương = cùng chiều kim đồng hồ) từ beta / gamma của deviceorientation.
 *  Trọng lực trên mặt màn ∝ (cosβ·sinγ, sinβ). Máy nằm gần phẳng (sinβ nhỏ) ⇒ lấy sàn 0,5 cho trục dọc để góc không nhảy ±90°. */
export function gocMan(beta: number | null, gamma: number | null): number {
  if (beta == null || gamma == null || !isFinite(beta) || !isFinite(gamma)) return 0
  const b = (beta * Math.PI) / 180, g = (gamma * Math.PI) / 180
  const x = Math.cos(b) * Math.sin(g), y = Math.max(Math.sin(b), 0.5)
  const a = (Math.atan2(x, y) * 180) / Math.PI
  return Math.max(-GOC_MAX, Math.min(GOC_MAX, a))
}

/** Bộ lò xo một chiều cho góc mặt dung dịch. `buoc(dt)` trả true khi còn chuyển động (cần khung kế). */
export function loXo(tatDanToiHan: boolean) {
  const K = 42, C = tatDanToiHan ? 2 * Math.sqrt(K) : 6.5
  let x = 0, v = 0, dich = 0, loc = 0
  return {
    /** Nhận góc thô từ cảm biến; trả true nếu đích đổi đủ lớn (cần đánh thức vòng vẽ). */
    dat(goc: number): boolean {
      loc += (goc - loc) * 0.25
      if (Math.abs(loc - dich) < VUNG_CHET) return false
      dich = loc
      return true
    },
    buoc(dt: number): boolean {
      const h = Math.min(dt, 1 / 30)
      v += (-(x - dich) * K - v * C) * h
      x += v * h
      if (Math.abs(v) < 0.05 && Math.abs(x - dich) < 0.1) { x = dich; v = 0; return false }
      return true
    },
    get goc() { return x },
  }
}

interface Mo { tatDan: boolean; win?: Window }

/** Gắn nghiêng cho nhóm dung dịch `g` (xoay quanh tâm mặt dung dịch do `tam()` trả về, toạ độ SVG). Trả hàm gỡ. */
export function ganNghieng(g: SVGGElement, tam: () => [number, number], { tatDan, win = window }: Mo): () => void {
  const DOE = (win as unknown as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } }).DeviceOrientationEvent
  if (!DOE) return () => {}
  const lx = loXo(tatDan)
  let hien = false, nghe = false, khung = 0, truoc = 0, go = false
  const ve = () => { const [cx, cy] = tam(); g.setAttribute('transform', `rotate(${(-lx.goc).toFixed(2)} ${cx} ${cy})`) }
  const lap = (t: number) => {
    const dt = truoc ? (t - truoc) / 1000 : 1 / 60
    truoc = t
    const con = lx.buoc(dt)
    ve()
    khung = con ? win.requestAnimationFrame(lap) : 0
    if (!con) truoc = 0
  }
  const ngang = () => { try { return !!win.matchMedia?.('(orientation: landscape)').matches } catch { return false } }
  const nhan = (e: DeviceOrientationEvent) => {
    if (lx.dat(ngang() ? 0 : gocMan(e.beta, e.gamma)) && !khung) khung = win.requestAnimationFrame(lap)
  }
  const capNhat = () => {
    const can = hien && win.document.visibilityState !== 'hidden'
    if (can && !nghe) { win.addEventListener('deviceorientation', nhan); nghe = true }
    if (!can && nghe) { win.removeEventListener('deviceorientation', nhan); nghe = false }
  }
  const IO = (win as Window & { IntersectionObserver?: typeof IntersectionObserver }).IntersectionObserver
  const io = typeof IO === 'function' ? new IO((ds: IntersectionObserverEntry[]) => { hien = ds.some((d) => d.isIntersecting); capNhat() }) : null
  const svg = g.ownerSVGElement
  if (io && svg) io.observe(svg); else hien = true
  win.document.addEventListener('visibilitychange', capNhat)
  // iPhone: phải xin quyền cảm biến trong một lần chạm — gắn vào lần chạm đầu lên thẻ (không chặn chạm, không preventDefault)
  const the = svg?.closest('.kb-hero') ?? svg
  const xin = () => { void DOE.requestPermission?.().then((kq) => { if (kq === 'granted' && !go) capNhat() }).catch(() => {}) }
  if (typeof DOE.requestPermission === 'function') the?.addEventListener('click', xin, { once: true, passive: true })
  capNhat()
  return () => {
    go = true
    io?.disconnect()
    win.document.removeEventListener('visibilitychange', capNhat)
    the?.removeEventListener('click', xin)
    if (nghe) win.removeEventListener('deviceorientation', nhan)
    if (khung) win.cancelAnimationFrame(khung)
  }
}
