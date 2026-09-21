// Móc dùng chung của Bảng tin sàn: giảm chuyển động, màu từ token (đọc lại khi đổi sáng/tối), đồng hồ theo giờ máy chủ, kích thước hộp.
import { useEffect, useState, type RefObject } from 'react'

export function useItDong(): boolean {
  const [it, setIt] = useState(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const mq = matchMedia('(prefers-reduced-motion: reduce)')
    const doi = () => setIt(mq.matches)
    mq.addEventListener?.('change', doi)
    return () => mq.removeEventListener?.('change', doi)
  }, [])
  return it
}

/** Chế độ MỘT MÀN không cuộn: cửa sổ đủ cao (≥ 700 px) VÀ khung đủ rộng (≥ 980 px). Khớp điều kiện CSS `data-mot-man` (bang-tin-san.css). */
export function useMotMan(): boolean {
  const [v, setV] = useState(() => typeof matchMedia === 'function' && matchMedia('(min-height: 700px)').matches)
  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const mq = matchMedia('(min-height: 700px)')
    const doi = () => setV(mq.matches)
    mq.addEventListener?.('change', doi)
    return () => mq.removeEventListener?.('change', doi)
  }, [])
  return v
}

/** Tên các token màu (sau tiền tố `--bts-`) mà canvas / three.js cần đọc. */
export const TEN_MAU = ['nen', 'mat', 'mat-2', 'vien', 'chu', 'chu-phu', 'chu-mo', 'duong', 'la', 'do', 'vang', 'xam-o', 'luoi', 'tren-gia'] as const
export type MauSan = Record<(typeof TEN_MAU)[number], string>

const MAU_TRONG = Object.fromEntries(TEN_MAU.map((k) => [k, ''])) as MauSan

/** Đọc màu từ CSS token của phần tử gốc; đọc lại khi đổi giao diện (thuộc tính `data-giao-dien`, prefers-color-scheme) hoặc khi `khoa` đổi. */
export function useMauSan(goc: RefObject<HTMLElement | null>): { mau: MauSan; phienBan: number } {
  const [trang, setTrang] = useState<{ mau: MauSan; phienBan: number }>({ mau: MAU_TRONG, phienBan: 0 })
  useEffect(() => {
    const doc = () => {
      const el = goc.current
      if (!el) return
      const cs = getComputedStyle(el)
      const mau = Object.fromEntries(TEN_MAU.map((k) => [k, cs.getPropertyValue(`--bts-${k}`).trim()])) as MauSan
      // không đổi màu nào ⇒ giữ nguyên (khỏi vẽ lại canvas vô ích)
      setTrang((t) => (t.phienBan > 0 && TEN_MAU.every((k) => t.mau[k] === mau[k]) ? t : { mau, phienBan: t.phienBan + 1 }))
    }
    doc()
    // đổi giao diện: đọc ngay và đọc LẠI sau hai khung hình (điều kiện media / CSS nạp muộn có thể được tính lại sau lần đọc đầu)
    const sau = () => {
      doc()
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => requestAnimationFrame(doc))
    }
    const mo = new MutationObserver(sau)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-giao-dien', 'class', 'style'] })
    const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null
    mq?.addEventListener?.('change', doc)
    return () => {
      mo.disconnect()
      mq?.removeEventListener?.('change', doc)
    }
  }, [goc])
  return trang
}

/** Kích thước hộp (làm tròn); đổi kích thước ⇒ render lại để canvas vẽ lại. */
export function useKichThuoc(ref: RefObject<HTMLElement | null>): { w: number; h: number } {
  const [kt, setKt] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const doc = () => {
      const r = el.getBoundingClientRect()
      setKt((k) => (k.w === Math.round(r.width) && k.h === Math.round(r.height) ? k : { w: Math.round(r.width), h: Math.round(r.height) }))
    }
    doc()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(doc)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return kt
}

/** Giờ máy chủ (ms), chạy theo từng giây: `serverNow` + thời gian đã trôi kể từ lúc nhận. `cố định` (kiểm thử / bản vẽ) ⇒ không chạy. */
export function useGioMayChu(serverNow: number, nhanLucMs: number, coDinh?: number): number {
  const lech = serverNow - nhanLucMs
  const [now, setNow] = useState(() => coDinh ?? Date.now() + lech)
  useEffect(() => {
    if (coDinh !== undefined) {
      setNow(coDinh)
      return
    }
    const buoc = () => setNow(Date.now() + lech)
    buoc()
    const id = setInterval(buoc, 1000)
    return () => clearInterval(id)
  }, [lech, coDinh])
  return now
}

/** Vẽ canvas sắc nét theo devicePixelRatio: trả ngữ cảnh 2D đã xoá và cỡ CSS; hộp 0 ⇒ null. */
export function chuanBiCanvas(cv: HTMLCanvasElement): { ctx: CanvasRenderingContext2D; w: number; h: number } | null {
  const r = cv.getBoundingClientRect()
  const w = Math.round(r.width)
  const h = Math.round(r.height)
  if (w < 2 || h < 2) return null
  const dpr = Math.min(window.devicePixelRatio || 1, 3)
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
    cv.width = Math.round(w * dpr)
    cv.height = Math.round(h * dpr)
  }
  const ctx = cv.getContext('2d')
  if (!ctx) return null
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  return { ctx, w, h }
}

/** rgba từ chuỗi màu CSS (hex hoặc rgb()) + độ trong suốt — dùng cho canvas. */
export function phaMau(mau: string, a: number): string {
  const s = mau.trim()
  let r = 0
  let g = 0
  let b = 0
  if (s.startsWith('#')) {
    const h = s.slice(1)
    const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
    r = parseInt(f.slice(0, 2), 16)
    g = parseInt(f.slice(2, 4), 16)
    b = parseInt(f.slice(4, 6), 16)
  } else {
    const m = s.match(/[\d.]+/g)
    if (m && m.length >= 3) [r, g, b] = [Number(m[0]), Number(m[1]), Number(m[2])]
  }
  return `rgba(${r},${g},${b},${a})`
}

