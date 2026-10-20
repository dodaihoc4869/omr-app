// ĐỒNG HỒ ĐO GIÂY LÀM CÂU PHÍA MÁY EM (thầy 20/10/2026: "tất cả các câu học sinh đã làm, đang làm hoặc sắp làm đều phải đo được").
// Đặc tả: docs/dac-ta-muc-lam-bai-2010.md mục 4. MỘT định nghĩa cho mọi màn làm câu:
//   giây của một câu = tổng thời gian câu đang là "câu em làm" TRONG LÚC tab đang hiện, tính từ lúc câu hiện tới lúc nộp;
//   dừng khi tab ẩn / khoá màn hình, hoặc 180 giây em không chạm màn (chạm lại thì chạy tiếp); trần 900 giây một câu.
// Máy chủ KHÔNG ước giây thay máy em (server/src/do-giay-luot.ts chỉ làm sạch rồi ghi; số từ/hình/phần của đề do máy chủ tự đo). Câu chưa đủ 1 giây ⇒ KHÔNG gửi (không gửi số 0).
import { useEffect, useRef, type RefObject } from 'react'

export const IM_LANG_MS = 180_000
export const TRAN_MS = 900_000

/** Bộ đếm thuần (không đụng DOM, không hẹn giờ): nơi gọi bấm `nhip` mỗi giây và `cham` mỗi lần em chạm màn. */
export class DongHoCau {
  private readonly ms = new Map<string, number>()
  private chamCuoi: number
  private readonly nay: () => number
  constructor(nay: () => number = Date.now) {
    this.nay = nay
    this.chamCuoi = nay()
  }
  /** Em vừa chạm màn / gõ phím. */
  cham(): void {
    this.chamCuoi = this.nay()
  }
  /** Mỗi giây. `khoa` = câu đang làm (null ⇒ không cộng); `hienThi` = tab đang hiện. */
  nhip(khoa: string | null, hienThi: boolean): void {
    if (!khoa || !hienThi) return
    if (this.nay() - this.chamCuoi > IM_LANG_MS) return
    this.ms.set(khoa, Math.min(TRAN_MS, (this.ms.get(khoa) ?? 0) + 1000))
  }
  /** Giây đã dồn của một câu (nguyên) hoặc null khi chưa đủ 1 giây. */
  giay(khoa: string): number | null {
    const m = this.ms.get(khoa)
    return m !== undefined && m >= 1000 ? Math.round(m / 1000) : null
  }
  /** Câu hiện lại từ đầu (làm lại / sang lượt mới): bắt đầu đếm lại từ 0 và coi như em vừa chạm. */
  datLai(khoa: string | null): void {
    if (khoa) this.ms.delete(khoa)
    this.cham()
  }
}

const SU_KIEN_CHAM = ['pointerdown', 'keydown', 'input', 'touchstart', 'wheel'] as const
const dangHien = () => typeof document === 'undefined' || document.visibilityState === 'visible'

/** MỘT câu mỗi màn (game, chữa câu): `khoa` đổi ⇒ đếm lại. Trả `giay(khoa?)` để lấy khi nộp. */
export function useGiayCau(khoa: string | null): { giay: (k?: string | null) => number | null } {
  const dh = useRef<DongHoCau | null>(null)
  if (!dh.current) dh.current = new DongHoCau()
  const kRef = useRef(khoa)
  kRef.current = khoa
  useEffect(() => {
    dh.current!.datLai(khoa)
  }, [khoa])
  useEffect(() => {
    const id = window.setInterval(() => dh.current!.nhip(kRef.current, dangHien()), 1000)
    const cham = () => dh.current!.cham()
    for (const e of SU_KIEN_CHAM) window.addEventListener(e, cham, { passive: true, capture: true })
    return () => {
      window.clearInterval(id)
      for (const e of SU_KIEN_CHAM) window.removeEventListener(e, cham, { capture: true })
    }
  }, [])
  return { giay: (k) => { const kk = k ?? kRef.current; return kk ? dh.current!.giay(kk) : null } }
}

/**
 * NHIỀU câu cùng hiện trên một màn (danh sách ôn lại): mỗi câu là phần tử con có `data-qid` của `goc`.
 * "Câu đang làm" = câu em chạm gần nhất NẾU nó đang hiện ≥ 50% trên màn; không thì câu hiện lớn nhất. Chỉ cộng cho MỘT câu mỗi giây.
 */
export function useGiayNhieuCau(goc: RefObject<HTMLElement | null>, bat: boolean): { giay: (qid: string) => number | null } {
  const dh = useRef<DongHoCau | null>(null)
  if (!dh.current) dh.current = new DongHoCau()
  useEffect(() => {
    if (!bat) return
    const el = goc.current
    const tiLe = new Map<string, number>()
    let chamQid: string | null = null
    const io = typeof IntersectionObserver === 'function'
      ? new IntersectionObserver((ds) => { for (const e of ds) { const q = (e.target as HTMLElement).dataset.qid; if (q) tiLe.set(q, e.isIntersecting ? e.intersectionRatio : 0) } }, { threshold: [0, 0.25, 0.5, 0.75, 1] })
      : null
    const quanSat = () => { if (io && el) el.querySelectorAll<HTMLElement>('[data-qid]').forEach((c) => io.observe(c)) }
    quanSat()
    const chonKhoa = (): string | null => {
      if (chamQid && (tiLe.get(chamQid) ?? 0) >= 0.5) return chamQid
      let tot: string | null = null
      let max = 0
      tiLe.forEach((r, q) => { if (r > max) { max = r; tot = q } })
      return tot
    }
    const id = window.setInterval(() => { quanSat(); dh.current!.nhip(chonKhoa(), dangHien()) }, 1000)
    const cham = (e: Event) => {
      dh.current!.cham()
      const c = (e.target as HTMLElement | null)?.closest?.('[data-qid]') as HTMLElement | null
      if (c?.dataset.qid && el?.contains(c)) chamQid = c.dataset.qid
    }
    for (const e of SU_KIEN_CHAM) window.addEventListener(e, cham, { passive: true, capture: true })
    return () => {
      window.clearInterval(id)
      io?.disconnect()
      for (const e of SU_KIEN_CHAM) window.removeEventListener(e, cham, { capture: true })
    }
  }, [goc, bat])
  return { giay: (qid) => dh.current!.giay(qid) }
}

/** Cụm `doGiay` gửi cùng lượt nộp: CHỈ giây đo thật. Kích thước đề (số từ, hình, phần) do máy chủ tự đo từ câu nó chấm — không tin số máy em. Chưa có giây ⇒ undefined. */
export function cumDoGiay(giay: number | null): { g: number } | undefined {
  if (giay === null || giay < 1) return undefined
  return { g: Math.min(900, giay) }
}
