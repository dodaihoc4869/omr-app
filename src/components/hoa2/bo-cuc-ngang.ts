// BỐ CỤC NGANG của app học sinh 2.0 (bản vẽ đã chốt: docs/ban-ve-ngang-2809/README.md, mục "Điểm ngắt").
//   · máy tính / máy tính bảng ngang (≥ 1024 px)                    ⇒ bố cục 7/5 đầy đủ;
//   · điện thoại xoay ngang (≥ 700 px, landscape)                   ⇒ bố cục 7/5; cao ≤ 500 px thì THU TỈ LỆ theo khung 900 px cao;
//   · còn lại (điện thoại dọc, cửa sổ hẹp)                          ⇒ GIỮ bản dọc có sẵn.
// Máy không có matchMedia (jsdom, render máy chủ) ⇒ bản dọc — mọi test cũ giữ nguyên.
import { useEffect, useState } from 'react'

/** Truy vấn điểm ngắt ngang (một chuỗi, hai nhánh "HOẶC"). */
export const MQ_NGANG = '(min-width: 1024px), (orientation: landscape) and (min-width: 700px)'
/** Điện thoại xoay ngang thấp: bố cục 7/5 nhưng thu tỉ lệ + ẩn dòng phụ. */
export const MQ_NGANG_THAP = '(orientation: landscape) and (max-height: 500px)'
/** Chiều cao khung chuẩn của bản vẽ ngang (1440 × 900). */
export const CAO_KHUNG_NGANG = 900

export interface BoCucNgang {
  ngang: boolean
  /** Ngang và thấp (≤ 500 px) ⇒ thu tỉ lệ. */
  thap: boolean
  /** Tỉ lệ thu (1 = không thu). Chỉ < 1 khi `thap`. */
  tiLe: number
}

const DOC: BoCucNgang = { ngang: false, thap: false, tiLe: 1 }

/** Đọc điểm ngắt lúc này (không có matchMedia ⇒ bản dọc). */
export function docBoCucNgang(): BoCucNgang {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return DOC
  const ngang = !!window.matchMedia(MQ_NGANG)?.matches
  if (!ngang) return DOC
  const thap = !!window.matchMedia(MQ_NGANG_THAP)?.matches
  const cao = typeof window.innerHeight === 'number' && window.innerHeight > 0 ? window.innerHeight : CAO_KHUNG_NGANG
  // Khung gọn 560 px cao (đã ẩn dòng phụ): màn 390 px cao ⇒ thu 0,75 — không dưới 0,75 để chữ thân còn ≥ 10,5 px; cột phải tự cuộn nếu thiếu chỗ.
  const tiLe = thap ? Math.max(0.75, Math.min(1, Math.round((cao / 560) * 100) / 100)) : 1
  return { ngang, thap, tiLe }
}

/** Hook: theo dõi điểm ngắt ngang (xoay máy, kéo cửa sổ). */
export function useBoCucNgang(): BoCucNgang {
  const [bc, setBc] = useState<BoCucNgang>(docBoCucNgang)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const dat = () =>
      setBc((cu) => {
        const moi = docBoCucNgang()
        return cu.ngang === moi.ngang && cu.thap === moi.thap && cu.tiLe === moi.tiLe ? cu : moi
      })
    dat()
    const ds = [window.matchMedia(MQ_NGANG), window.matchMedia(MQ_NGANG_THAP)].filter(Boolean)
    ds.forEach((mq) => mq.addEventListener?.('change', dat))
    window.addEventListener('resize', dat)
    return () => {
      ds.forEach((mq) => mq.removeEventListener?.('change', dat))
      window.removeEventListener('resize', dat)
    }
  }, [])
  return bc
}
