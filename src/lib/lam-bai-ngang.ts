// MÀN LÀM BÀI NGANG (thầy chốt bản vẽ docs/ban-ve-lam-bai-ngang-2809/LamBai-Ngang.html, 28/09):
// "khi vào màn làm bài là tự bung full màn hình … xoay ngang tự đổi giao diện xoay ngang, dọc giữ nguyên".
// Tệp này THUẦN (không React): chọn bố cục theo hướng/kích thước, tỉ lệ thanh kéo, mức màu đồng hồ,
// đọc phím tắt, và hai hàm vào/thoát toàn màn hình. Test: tests/lam-bai-ngang-2809.test.ts(x).

import { useEffect, useState } from 'react'

export type BoCuc = 'doc' | 'ngang' | 'ngang-gon'

/** Bề rộng tối thiểu cho bố cục ngang ĐỦ (máy tính, máy tính bảng xoay ngang 1024×768 / 1180×820). */
export const RONG_NGANG_DU = 900
/** Thấp hơn mức này (điện thoại xoay ngang ~390 px) ⇒ biến thể gọn. */
export const CAO_NGANG_DU = 500
/** Hẹp hơn mức này thì dù ngang cũng không đủ chỗ chia hai bên ⇒ giữ dọc. */
export const RONG_NGANG_TOI_THIEU = 560

/** DỌC giữ nguyên giao diện hiện tại; NGANG đủ rộng ⇒ chia hai bên; điện thoại xoay ngang ⇒ ngang gọn. */
export function chonBoCuc(rong: number, cao: number, nam: boolean): BoCuc {
  if (!nam || rong < RONG_NGANG_TOI_THIEU) return 'doc'
  if (rong >= RONG_NGANG_DU && cao >= CAO_NGANG_DU) return 'ngang'
  return 'ngang-gon'
}

// ---------------------------------------------------------------- THANH KÉO
export const TI_LE_MAC_DINH = 0.58
export const TI_LE_MIN = 0.35
export const TI_LE_MAX = 0.75
export const BUOC_PHIM = 0.02
export const BUOC_PHIM_SHIFT = 0.1
export const KHOA_TI_LE = 'ddh.lamBaiNgang.tiLe'

export function kepTiLe(v: number): number {
  if (!Number.isFinite(v)) return TI_LE_MAC_DINH
  return Math.round(Math.max(TI_LE_MIN, Math.min(TI_LE_MAX, v)) * 1000) / 1000
}

export function docTiLe(kho: Pick<Storage, 'getItem'> | null = typeof localStorage === 'undefined' ? null : localStorage): number {
  try {
    const s = kho?.getItem(KHOA_TI_LE)
    return s === null || s === undefined ? TI_LE_MAC_DINH : kepTiLe(Number(s))
  } catch {
    return TI_LE_MAC_DINH
  }
}

export function ghiTiLe(v: number, kho: Pick<Storage, 'setItem'> | null = typeof localStorage === 'undefined' ? null : localStorage): void {
  try {
    kho?.setItem(KHOA_TI_LE, String(kepTiLe(v)))
  } catch {
    /* trình duyệt chặn lưu — chỉ mất tiện nhớ */
  }
}

/** Phím trên thanh kéo đang có tiêu điểm ⇒ tỉ lệ mới; không phải phím của thanh ⇒ null. */
export function tiLeTheoPhim(ti: number, key: string, shift: boolean): number | null {
  const b = shift ? BUOC_PHIM_SHIFT : BUOC_PHIM
  if (key === 'ArrowLeft') return kepTiLe(ti - b)
  if (key === 'ArrowRight') return kepTiLe(ti + b)
  if (key === 'Home') return TI_LE_MIN
  if (key === 'End') return TI_LE_MAX
  if (key === 'Enter') return TI_LE_MAC_DINH
  return null
}

// ---------------------------------------------------------------- ĐỒNG HỒ
/** '' bình thường · 'vang' còn ≤ 10 phút · 'do' còn ≤ 5 phút (cùng mốc `gapNow` của màn thi). */
export function mucDongHo(conGiay: number | null | undefined): '' | 'vang' | 'do' {
  if (typeof conGiay !== 'number' || !Number.isFinite(conGiay)) return ''
  if (conGiay <= 300) return 'do'
  if (conGiay <= 600) return 'vang'
  return ''
}

// ---------------------------------------------------------------- PHÍM TẮT
export type HanhDongPhim =
  | { loai: 'chon-pa'; viTri: number }
  | { loai: 'chon-y'; viTri: number }
  | { loai: 'ghi-y'; gt: 'D' | 'S' }
  | { loai: 'sau' }
  | { loai: 'truoc' }
  | { loai: 'danh-dau' }
  | { loai: 'vao-o' }
  | { loai: 'bang-phim' }

/**
 * Phím tắt khi làm bài (bản vẽ đã chốt). `phan` là phần của câu đang xem.
 *  · Phần I: 1–4 hoặc A–D chọn phương án (theo chữ cái HIỆN RA).
 *  · Phần II: 1–4 chọn ý a–d; D = Đúng, S = Sai cho ý đang chọn (thầy chốt D/S, không dùng Đ).
 *  · Phần III: Enter vào ô đáp số.
 *  · N câu sau · P câu trước · M đánh dấu xem lại · ? bảng phím.
 * Phím cách (giữ để đọc) do cơ chế Giữ để đọc lo, không đi qua đây.
 */
export function docPhim(key: string, phan: 'I' | 'II' | 'III'): HanhDongPhim | null {
  const k = key.length === 1 ? key.toLowerCase() : key
  if (k === 'n') return { loai: 'sau' }
  if (k === 'p') return { loai: 'truoc' }
  if (k === 'm') return { loai: 'danh-dau' }
  if (k === '?') return { loai: 'bang-phim' }
  if (phan === 'I') {
    if (/^[1-4]$/.test(k)) return { loai: 'chon-pa', viTri: Number(k) - 1 }
    if (/^[a-d]$/.test(k)) return { loai: 'chon-pa', viTri: k.charCodeAt(0) - 97 }
  }
  if (phan === 'II') {
    if (/^[1-4]$/.test(k)) return { loai: 'chon-y', viTri: Number(k) - 1 }
    if (k === 'd') return { loai: 'ghi-y', gt: 'D' }
    if (k === 's') return { loai: 'ghi-y', gt: 'S' }
  }
  if (phan === 'III' && key === 'Enter') return { loai: 'vao-o' }
  return null
}

/** Đang gõ trong ô nhập ⇒ phím tắt nhường cho chữ. */
export function dangGoChu(el: Element | null | undefined): boolean {
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (el as HTMLElement).isContentEditable === true
}

// ---------------------------------------------------------------- TOÀN MÀN HÌNH
type PhanTuFs = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void }
type TaiLieuFs = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> | void }

/**
 * Xin vào toàn màn hình. PHẢI gọi ĐỒNG BỘ ngay trong hàm xử lý cú bấm (trình duyệt chỉ cho khi có thao tác
 * của người dùng) — nên hàm KHÔNG `await` gì trước lời gọi. Không hỗ trợ (iPhone Safari) hoặc bị từ chối ⇒
 * lặng lẽ bỏ qua: bố cục làm bài vốn đã chiếm trọn khung nhìn (100dvh). Trả về true nếu ĐÃ GỌI được API.
 */
export function thuVaoToanManHinh(doc: Document = document): boolean {
  const d = doc as TaiLieuFs
  if (d.fullscreenElement || d.webkitFullscreenElement) return false
  const el = doc.documentElement as PhanTuFs
  try {
    if (typeof el.requestFullscreen === 'function') {
      const p = el.requestFullscreen({ navigationUI: 'hide' } as FullscreenOptions)
      if (p && typeof (p as Promise<void>).catch === 'function') (p as Promise<void>).catch(() => {})
      return true
    }
    if (typeof el.webkitRequestFullscreen === 'function') {
      const p = el.webkitRequestFullscreen()
      if (p && typeof (p as Promise<void>).catch === 'function') (p as Promise<void>).catch(() => {})
      return true
    }
  } catch {
    /* bị từ chối — dùng bố cục chiếm trọn khung nhìn */
  }
  return false
}

/** Nộp bài / thoát ca ⇒ trả lại màn hình thường. Không ở toàn màn hình thì thôi. */
export function thoatToanManHinh(doc: Document = document): void {
  const d = doc as TaiLieuFs
  if (!(d.fullscreenElement || d.webkitFullscreenElement)) return
  try {
    const p = typeof d.exitFullscreen === 'function' ? d.exitFullscreen() : d.webkitExitFullscreen?.()
    if (p && typeof (p as Promise<void>).catch === 'function') (p as Promise<void>).catch(() => {})
  } catch {
    /* bỏ qua */
  }
}

// ---------------------------------------------------------------- HOOK THEO HƯỚNG MÁY
/** Bố cục theo hướng máy, nghe `(orientation: landscape)` + đổi cỡ cửa sổ. */
export function docBoCucHienTai(): BoCuc {
  if (typeof window === 'undefined') return 'doc'
  const w = window.innerWidth
  const h = window.innerHeight
  // Không có matchMedia (trình duyệt quá cũ, môi trường test) ⇒ giữ DỌC — giao diện cũ, chắc chắn chạy.
  if (typeof window.matchMedia !== 'function') return 'doc'
  return chonBoCuc(w, h, window.matchMedia('(orientation: landscape)').matches)
}
export function useBoCuc(): BoCuc {
  const [bc, setBc] = useState<BoCuc>(docBoCucHienTai)
  useEffect(() => {
    const doi = () => setBc(docBoCucHienTai())
    const mq = typeof window.matchMedia === 'function' ? window.matchMedia('(orientation: landscape)') : null
    mq?.addEventListener?.('change', doi)
    window.addEventListener('resize', doi)
    window.addEventListener('orientationchange', doi)
    return () => {
      mq?.removeEventListener?.('change', doi)
      window.removeEventListener('resize', doi)
      window.removeEventListener('orientationchange', doi)
    }
  }, [])
  return bc
}

