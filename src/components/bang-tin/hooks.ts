// Móc dùng chung cho Bảng tin bản 3: đo chỗ trống để chọn "top-N", số đếm lên, chuyển bố cục theo bề rộng, trang lướt ngang.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'

const coTheDo = () => typeof window !== 'undefined'

/** Người dùng tắt chuyển động (hoặc môi trường không có matchMedia, như test) ⇒ đặt thẳng giá trị cuối, không hoạt ảnh. */
export function giamChuyenDong(): boolean {
  if (!coTheDo() || typeof window.matchMedia !== 'function') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Số ĐẾM LÊN ≤ 600 ms (đề bài); giá trị vắng (null) ⇒ giữ null, KHÔNG vẽ 0 giả. */
export function useDemLen(dich: number | null, ms = 600): number | null {
  const [hien, setHien] = useState<number | null>(() => (giamChuyenDong() ? dich : dich == null ? null : 0))
  const dau = useRef<number>(0)
  useEffect(() => {
    if (dich == null) {
      setHien(null)
      return
    }
    if (giamChuyenDong() || typeof requestAnimationFrame !== 'function') {
      setHien(dich)
      return
    }
    const tu = dau.current
    const t0 = performance.now()
    let khung = 0
    const chay = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      const e = 1 - Math.pow(1 - p, 3) // ease-out
      const v = tu + (dich - tu) * e
      setHien(v)
      if (p < 1) khung = requestAnimationFrame(chay)
      else dau.current = dich
    }
    khung = requestAnimationFrame(chay)
    return () => cancelAnimationFrame(khung)
  }, [dich, ms])
  return hien
}

/** Chờ một nhịp sau lần vẽ đầu rồi mới đặt `true` — cho thanh "lớn dần" từ 0. Giảm chuyển động ⇒ `true` ngay. */
export function useDaVao(): boolean {
  const [vao, setVao] = useState(giamChuyenDong())
  useEffect(() => {
    if (vao) return
    const id = requestAnimationFrame(() => setVao(true))
    return () => cancelAnimationFrame(id)
  }, [vao])
  return vao
}

/** Khớp media query; môi trường không có matchMedia ⇒ `macDinh`. */
export function useMedia(query: string, macDinh = false): boolean {
  const [khop, setKhop] = useState(() => (coTheDo() && typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : macDinh))
  useEffect(() => {
    if (!coTheDo() || typeof window.matchMedia !== 'function') return
    const m = window.matchMedia(query)
    const doi = () => setKhop(m.matches)
    doi()
    m.addEventListener('change', doi)
    return () => m.removeEventListener('change', doi)
  }, [query])
  return khop
}

/** Đo CHIỀU CAO vùng danh sách do lưới cấp (trang chính không cuộn ⇒ danh sách dài chỉ hiện top-N + "+N nữa") và chiều cao MỘT hàng
 *  đọc từ biến CSS `--bt3-hang` của chính vùng đó (MỘT nguồn: bang-tin-v3.css, đổi theo cỡ màn hình). Không đo được (test, trình duyệt cũ) ⇒ `cao = null` = hiện hết. */
export function useChieuCao<T extends HTMLElement>(hangMacDinh: number): [RefObject<T | null>, number | null, number] {
  const ref = useRef<T | null>(null)
  const [cao, setCao] = useState<number | null>(null)
  const [hang, setHang] = useState(hangMacDinh)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const doi = () => {
      const h = el.clientHeight
      setCao(h > 0 ? h : null)
      const v = parseFloat(getComputedStyle(el).getPropertyValue('--bt3-hang'))
      if (Number.isFinite(v) && v > 0) setHang(v)
    }
    doi()
    const ro = new ResizeObserver(doi)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, cao, hang]
}

/** Bao nhiêu mục HIỆN được trong `cao` px, mỗi mục `hang` px. Vừa hết ⇒ hiện hết; không vừa (hoặc còn mục ngoài danh sách) ⇒ chừa `nut` px cho dòng "+N nữa", luôn hiện ≥ 1 mục. */
export function chiaHang(soMuc: number, cao: number | null, hang: number, nut: number, conNgoai = 0): number {
  if (cao == null) return soMuc
  const vua = Math.floor(cao / hang)
  if (vua >= soMuc && conNgoai === 0) return soMuc
  return Math.min(soMuc, Math.max(1, Math.floor((cao - nut) / hang)))
}

/** Trang lướt ngang (scroll-snap): biết đang ở trang nào và nhảy tới trang khác. */
export function useTrangLuot(soTrang: number): { ref: RefObject<HTMLDivElement | null>; trang: number; chuyen: (i: number) => void } {
  const ref = useRef<HTMLDivElement | null>(null)
  const [trang, setTrang] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const doi = () => {
      const r = el.clientWidth > 0 ? Math.round(el.scrollLeft / el.clientWidth) : 0
      setTrang(Math.min(soTrang - 1, Math.max(0, r)))
    }
    el.addEventListener('scroll', doi, { passive: true })
    return () => el.removeEventListener('scroll', doi)
  }, [soTrang])
  const chuyen = useCallback((i: number) => {
    const el = ref.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: giamChuyenDong() ? 'auto' : 'smooth' })
    setTrang(i)
  }, [])
  return { ref, trang, chuyen }
}

/** Tự làm mới mỗi `ms` (mặc định 60 giây), DỪNG khi tab ẩn, làm mới ngay khi tab hiện lại. */
export function useTuLamMoi(lam: () => void, ms = 60000): void {
  const goi = useRef(lam)
  goi.current = lam
  useEffect(() => {
    if (typeof document === 'undefined') return
    let id: ReturnType<typeof setInterval> | null = null
    const bat = () => {
      if (id == null) id = setInterval(() => goi.current(), ms)
    }
    const tat = () => {
      if (id != null) clearInterval(id)
      id = null
    }
    const doi = () => {
      if (document.hidden) tat()
      else {
        goi.current()
        bat()
      }
    }
    if (!document.hidden) bat()
    document.addEventListener('visibilitychange', doi)
    return () => {
      tat()
      document.removeEventListener('visibilitychange', doi)
    }
  }, [ms])
}
