// ĐẾM SỐ LÊN (GHI-CHU-BUILD.md mục 2): ba số cạnh vòng (38 · 79 % · 52) và số điểm của ca (7,5) đếm từ 0 lên đúng nhịp với vòng (700 ms, giảm tốc). CHỮ SỐ CUỐI luôn đúng bằng giá trị thật (kể cả khi
// giảm chuyển động / không có requestAnimationFrame / jsdom / chưa cuộn tới: khi đó không đếm, hiện thẳng số thật). Chữ số tabular (đã bật ở gốc) nên không giật. Chỉ đổi chữ của MỘT nút văn bản, không đụng bố cục.
import { useLayoutEffect, useRef } from 'react'

const DAI_MS = 700
const GIAM = '(prefers-reduced-motion: reduce)'
const KHOP = /^(\d+)(?:,(\d+))?$/

/** THUẦN. Chữ hiển thị ở tiến độ `p` ∈ [0, 1] của số `cuoi` ("38", "7,5"): số nguyên ⇒ làm tròn; số lẻ giữ ĐÚNG số chữ số thập phân của số cuối. p ≥ 1 ⇒ trả NGUYÊN `cuoi`; chữ không phải số ⇒ trả nguyên `cuoi`. */
export function tinhSoDem(cuoi: string, p: number): string {
  const m = KHOP.exec(cuoi)
  if (!m || !(p < 1)) return cuoi
  const le = m[2] ?? ''
  const gia = Number(`${m[1]}${le ? `.${le}` : ''}`) * Math.max(0, Number.isFinite(p) ? p : 0)
  return le ? gia.toFixed(le.length).replace('.', ',') : String(Math.round(gia))
}
const dat = (t: number) => 1 - Math.pow(1 - t, 3) // ease-out cubic

/** Có nên đếm không: có requestAnimationFrame + matchMedia và người dùng KHÔNG chọn giảm chuyển động. Thiếu matchMedia (jsdom, máy chủ) ⇒ không đếm. */
export function nenDemSo(): boolean {
  if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function' || typeof window.matchMedia !== 'function') return false
  return !window.matchMedia(GIAM).matches
}

/** Một số có thể đếm lên. `chu` = chữ số CUỐI ("38", "7,5"); `tre` = trễ bắt đầu (ms, lệch nhịp giữa các số). */
export function SoDem({ chu, tre = 0 }: { chu: string; tre?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !KHOP.test(chu) || !nenDemSo()) return
    let h = 0
    let tm = 0
    let bd = 0
    el.textContent = tinhSoDem(chu, 0) // đặt về 0 TRƯỚC khi vẽ (không chớp số cuối rồi mới về 0)
    const chay = (t: number) => {
      if (!bd) bd = t
      const p = Math.min(1, (t - bd) / DAI_MS)
      el.textContent = tinhSoDem(chu, dat(p))
      if (p < 1) h = window.requestAnimationFrame(chay)
    }
    tm = window.setTimeout(() => (h = window.requestAnimationFrame(chay)), Math.max(0, tre))
    return () => {
      window.clearTimeout(tm)
      window.cancelAnimationFrame(h)
      el.textContent = chu // thoát giữa chừng (đổi số / gỡ): luôn để số thật
    }
  }, [chu, tre])
  return <span ref={ref}>{chu}</span>
}
