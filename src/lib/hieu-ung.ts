// HIỆU ỨNG DÙNG CHUNG kiểu Duolingo, bản Hoá học (thầy 26/10: «Hiệu ứng phải hấp dẫn hoặc hơn doligo nhé»; danh mục ve-moi/thuong-phat/HIEU-UNG.md).
// Luật: CHỈ transform + opacity (Web Animations API, không thư viện), ≤ 40 hạt mỗi lượt, xong thì gỡ phần tử; lớp hạt là `position: fixed` phủ khung nhìn,
// `overflow: hidden`, `pointer-events: none` ⇒ không làm tràn trang, không chặn bấm; toạ độ lấy từ getBoundingClientRect lúc gọi (đúng cả khi đã cuộn,
// xoay ngang, cột phải máy tính). Giảm chuyển động / máy yếu (<html class="may-yeu">) ⇒ không bắn hạt, số hiện ngay giá trị cuối.
// Chỉ các mảnh NẠP LƯỜI của app học sinh «Trong» dùng (làm chặng, Lộ trình) — không vào nhóm mở app; mảnh riêng ở kho chạy-lúc (globIgnores).
import { useEffect, useState } from 'react'

/** Không chuyển động: em bật giảm chuyển động, máy yếu, hoặc môi trường không có matchMedia / animate (máy kiểm thử). */
export function yenLang(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return true
  if (document.documentElement.classList.contains('may-yeu')) return true
  if (typeof window.matchMedia !== 'function' || typeof Element.prototype.animate !== 'function') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const LUC_GIAC = 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0 50%)'
const SAO = 'polygon(50% 0, 62% 36%, 100% 38%, 70% 60%, 80% 100%, 50% 76%, 20% 100%, 30% 60%, 0 38%, 38% 36%)'
const MAU_MAC_DINH = ['--tr-dung', '--tr-sao', '--tr-tin', '--tr-chu-y']

export interface TuyChonHat {
  /** Số hạt (tối đa 40). */
  so?: number
  /** Biến màu «Trong» (không mã màu thô). */
  mau?: string[]
  hinh?: 'luc-giac' | 'sao'
  /** Bán kính bung (px). */
  xa?: number
  /** Thời lượng (ms). */
  ms?: number
  /** 'bung' = toả tròn từ tâm; 'roi' = hoa giấy rơi từ mép trên phần tử. */
  kieu?: 'bung' | 'roi'
  co?: number
}

/** Bắn hạt lục giác / sao từ tâm phần tử `el` (toạ độ màn hình lúc gọi). Trả số hạt đã bắn (0 khi yên lặng). */
export function banHat(el: Element | null | undefined, t: TuyChonHat = {}): number {
  if (!el || yenLang()) return 0
  const r = el.getBoundingClientRect()
  if (!r.width && !r.height) return 0
  const so = Math.max(1, Math.min(40, t.so ?? 8)), mau = t.mau ?? MAU_MAC_DINH, ms = t.ms ?? 450, xa = t.xa ?? 64, co = t.co ?? 10
  const lop = document.createElement('div')
  lop.setAttribute('aria-hidden', 'true')
  lop.style.cssText = 'position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:80;contain:strict'
  document.body.appendChild(lop)
  const cx = r.left + r.width / 2, cy = t.kieu === 'roi' ? r.top : r.top + r.height / 2
  let con = so
  for (let i = 0; i < so; i++) {
    const h = document.createElement('i')
    const c = co * (0.7 + ((i * 37) % 10) / 16)
    h.style.cssText = `position:absolute;left:${cx - c / 2}px;top:${cy - c / 2}px;width:${c}px;height:${c}px;background:var(${mau[i % mau.length]});clip-path:${t.hinh === 'sao' ? SAO : LUC_GIAC};will-change:transform,opacity`
    lop.appendChild(h)
    let dau: Keyframe, cuoi: Keyframe
    if (t.kieu === 'roi') {
      const dx = (i / so - 0.5) * r.width * 1.1, dy = 140 + ((i * 53) % 9) * 22
      dau = { transform: `translate(${dx * 0.3}px, -10px) rotate(0deg)`, opacity: 0 }
      cuoi = { transform: `translate(${dx}px, ${dy}px) rotate(${200 + i * 23}deg)`, opacity: 0 }
      h.animate([dau, { opacity: 1, offset: 0.15 }, cuoi], { duration: ms + (i % 5) * 90, delay: (i % 7) * 40, easing: 'ease-in', fill: 'both' }).onfinish = () => { if (--con <= 0) lop.remove() }
      continue
    }
    const goc = (i / so) * Math.PI * 2 + (i % 2 ? 0.25 : 0), d = xa * (0.75 + (i % 3) * 0.18)
    dau = { transform: 'translate(0, 0) scale(.4) rotate(0deg)', opacity: 1 }
    cuoi = { transform: `translate(${Math.cos(goc) * d}px, ${Math.sin(goc) * d}px) scale(1) rotate(${90 + i * 30}deg)`, opacity: 0 }
    h.animate([dau, cuoi], { duration: ms, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'both' }).onfinish = () => { if (--con <= 0) lop.remove() }
  }
  // Rào: trình duyệt hãm hoạt ảnh ở tab ẩn ⇒ vẫn gỡ lớp hạt.
  window.setTimeout(() => lop.remove(), ms + 1200)
  return so
}

/** A3 — câu cũ trượt trái + mờ dần: chụp BẢN SAO phần tử đặt đúng chỗ (fixed), không giữ state cũ, không trễ bước sang câu mới. */
export function truotRa(el: Element | null | undefined, ms = 180, daDo?: DOMRect, gon?: string): void {
  if (!el || yenLang()) return
  // `daDo`: khung đã đo trước khi trang đổi (27/10 MƯỢT — màn làm chặng đo rồi cuộn về đầu TRƯỚC khi dựng câu mới, không ép bố cục lần nữa)
  const r = daDo ?? el.getBoundingClientRect()
  if (!r.width || !r.height) return
  const ban = el.cloneNode(true) as HTMLElement
  ban.setAttribute('aria-hidden', 'true'); ban.setAttribute('inert', ''); ban.removeAttribute('id')
  for (const x of ban.querySelectorAll('[id]')) x.removeAttribute('id')
  // `gon`: các hình SVG nặng trong bản sao chỉ giữ khung (rỗng ruột) — bản sao mờ dần 180 ms, hình thật vẫn đứng ở câu mới (27/10 MƯỢT: bớt ~150 nút phải tính kiểu)
  if (gon) for (const x of ban.querySelectorAll(gon)) x.replaceChildren()
  const lop = document.createElement('div')
  lop.setAttribute('aria-hidden', 'true')
  lop.style.cssText = 'position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:5'
  ban.style.cssText += `;position:absolute;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;margin:0;box-sizing:border-box;overflow:hidden`
  lop.appendChild(ban)
  ;(el.closest('.ht-app') ?? document.body).appendChild(lop)
  ban.animate([{ transform: 'translateX(0)', opacity: 1 }, { transform: 'translateX(-48px)', opacity: 0 }], { duration: ms, easing: 'ease-in', fill: 'both' }).onfinish = () => lop.remove()
  window.setTimeout(() => lop.remove(), ms + 600)
}

/** B1 — số đếm tăng từ `tu` lên `den` trong `ms` (requestAnimationFrame), bắt đầu sau `tre` ms. Yên lặng ⇒ trả `den` ngay. */
export function useDemSo(den: number, ms = 800, tre = 0, tu = 0): number {
  const [v, setV] = useState(() => (yenLang() ? den : tu))
  useEffect(() => {
    if (yenLang() || den === tu) { setV(den); return }
    let id = 0
    const t0 = performance.now() + tre
    const buoc = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - t0) / ms))
      setV(Math.round(tu + (den - tu) * (1 - (1 - p) ** 3)))
      if (p < 1) id = requestAnimationFrame(buoc)
    }
    id = requestAnimationFrame(buoc)
    return () => cancelAnimationFrame(id)
  }, [den, ms, tre, tu])
  return v
}
