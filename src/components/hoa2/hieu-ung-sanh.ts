// HIỆU ỨNG SẢNH 3D (bản vẽ docs/ban-ve-sanh-dong-2809/Sanh-Dong.html): hạt sáng, pháo sáng, cảnh mở màn một lần mỗi phiên.
// Chỉ transform/opacity (keyframes `h2-no`, `h2-phong` trong sanh-ban-do.css). Máy bật "giảm chuyển động" ⇒ không làm gì.
// Hạt là trang trí thoáng qua (tự xoá khi xong) — không mang số liệu nên dùng Math.random được.

/** Máy bật prefers-reduced-motion? Không có matchMedia (jsdom, máy chủ) ⇒ coi như KHÔNG giảm. */
export function giamChuyenDong(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && !!window.matchMedia('(prefers-reduced-motion: reduce)')?.matches
  } catch {
    return false
  }
}

/** Khoá sessionStorage: cảnh mở màn ~2 giây chỉ chạy LẦN ĐẦU mở Sảnh trong phiên. */
export const KHOA_MO_MAN = 'h2-sanh-mo-man'

/** true nếu phiên này chưa xem cảnh mở màn (và đánh dấu là đã xem). Lỗi sessionStorage (chế độ riêng tư…) ⇒ chạy một lần như thường. */
export function nhanLuotMoMan(): boolean {
  if (giamChuyenDong()) return false
  try {
    if (sessionStorage.getItem(KHOA_MO_MAN) === '1') return false
    sessionStorage.setItem(KHOA_MO_MAN, '1')
  } catch {
    /* sessionStorage bị chặn: vẫn cho chạy */
  }
  return true
}

/** Lớp hiệu ứng `.h2-fx` của Sảnh chứa phần tử `tu` (một lớp phủ cả màn). */
export function timFx(tu: Element | null | undefined): HTMLElement | null {
  return (tu?.closest('.h2-sanh')?.querySelector('.h2-fx') as HTMLElement | null) ?? null
}

/** Đổi toạ độ màn (clientX/Y) sang toạ độ trong lớp fx — tính cả `zoom` của bản ngang thấp. */
export function veToaDoFx(fx: HTMLElement, clientX: number, clientY: number): [number, number] {
  const r = fx.getBoundingClientRect()
  const k = fx.offsetWidth > 0 && r.width > 0 ? fx.offsetWidth / r.width : 1
  return [(clientX - r.left) * k, (clientY - r.top) * k]
}

export const MAU_PHAO = [
  ['rgb(255 180 0)', 'rgb(255 120 20)', 'rgb(255 230 120)'],
  ['rgb(0 190 205)', 'rgb(0 150 200)', 'rgb(120 240 250)'],
  ['rgb(255 70 140)', 'rgb(255 120 170)', 'rgb(255 200 220)'],
  ['rgb(140 90 255)', 'rgb(255 180 0)', 'rgb(200 170 255)'],
]

/** Nổ n hạt sáng tại (x, y) trong `cha`. */
export function hat(cha: HTMLElement | null, x: number, y: number, n: number, mau: string[], tam = 60, co = 6, t = 1.1, trongLuc = 0) {
  if (!cha || giamChuyenDong()) return
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span')
    s.className = 'h2-hat'
    const a = Math.random() * Math.PI * 2
    const d = tam * (0.4 + Math.random() * 0.6)
    s.style.cssText = `--x0:${x.toFixed(0)}px;--y0:${y.toFixed(0)}px;--dx:${(Math.cos(a) * d).toFixed(1)}px;--dy:${(Math.sin(a) * d + trongLuc).toFixed(1)}px;--m:${mau[i % mau.length]};--r:${(co * (0.5 + Math.random() * 0.7)).toFixed(1)}px;--t:${(t * (0.7 + Math.random() * 0.5)).toFixed(2)}s`
    s.addEventListener('animationend', () => s.remove())
    cha.appendChild(s)
  }
}

/** Hạt sáng bay lên (rê / chạm nút chính). */
export function hatBay(cha: HTMLElement | null, x: number, y: number) {
  if (!cha || giamChuyenDong()) return
  const s = document.createElement('span')
  s.className = 'h2-hat'
  s.style.cssText = `--x0:${x.toFixed(0)}px;--y0:${y.toFixed(0)}px;--dx:${((Math.random() - 0.5) * 30).toFixed(0)}px;--dy:${(-40 - Math.random() * 50).toFixed(0)}px;--m:${Math.random() > 0.5 ? 'rgb(255 255 255)' : 'rgb(255 190 30)'};--r:${(3 + Math.random() * 4).toFixed(1)}px;--t:${(0.8 + Math.random() * 0.6).toFixed(2)}s`
  s.addEventListener('animationend', () => s.remove())
  cha.appendChild(s)
}

/** Một quả pháo sáng: đuôi bay lên rồi nổ. */
export function phao(fx: HTMLElement | null, x: number, y: number, mau: string[]) {
  if (!fx || giamChuyenDong()) return
  const h = 90 + Math.random() * 60
  const t = document.createElement('span')
  t.className = 'h2-ten-lua'
  t.style.cssText = `--x0:${x.toFixed(0)}px;--y0:${(y + h).toFixed(0)}px;--h:${h.toFixed(0)}px;--m:${mau[0]};--t:.55s`
  t.addEventListener('animationend', () => {
    t.remove()
    hat(fx, x, y, 34, mau, 70 + Math.random() * 30, 6, 1.3, 30)
  })
  fx.appendChild(t)
}

/** Loạt 4 pháo sáng ở nửa trên lớp fx. Trả hàm huỷ (dọn hẹn giờ khi unmount). */
export function loatPhao(fx: HTMLElement | null): () => void {
  if (!fx || giamChuyenDong()) return () => {}
  const hen: number[] = []
  const w = fx.offsetWidth
  const h = fx.offsetHeight
  for (let i = 0; i < 4; i++) {
    hen.push(window.setTimeout(() => phao(fx, w * (0.18 + Math.random() * 0.6), Math.min(h, 700) * (0.16 + Math.random() * 0.3), MAU_PHAO[i % 4]), i * 380))
  }
  return () => hen.forEach((id) => clearTimeout(id))
}
