// Tiện ích thuần của app phụ huynh mới: tuyến điều hướng theo `#…` và chữ ngày/phần dùng chung giữa các màn.
import { thuTuChuoiNgay } from '../../lib/ph-moi/dinh-dang'

export type Muc = 'hom-nay' | 'diem' | 'tien-bo' | 'loi-thay'
export type Tuyen = { muc: Muc; maCa: string | null }

/** `#ca/<mã>` ⇒ màn chi tiết ca (thuộc mục Điểm số); hash lạ ⇒ Hôm nay. */
export function docTuyen(hash: string): Tuyen {
  const h = hash.replace(/^#/, '')
  if (h.startsWith('ca/')) {
    let ma = ''
    try {
      ma = decodeURIComponent(h.slice(3)).trim()
    } catch {
      ma = ''
    }
    if (ma) return { muc: 'diem', maCa: ma }
  }
  if (h === 'diem' || h === 'tien-bo' || h === 'loi-thay') return { muc: h, maCa: null }
  return { muc: 'hom-nay', maCa: null }
}
export const lienKetCa = (maCa: string): string => `#ca/${encodeURIComponent(maCa)}`

/** Hạn nộp theo ngày (YYYY-MM-DD, hết lúc 23:59 giờ VN): "23:59 · Thứ Tư 30/09/2026". Sai dạng ⇒ "". */
export function chuHanNgay(ngay: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ngay)
  return m ? `23:59 · ${thuTuChuoiNgay(ngay)} ${m[3]}/${m[2]}/${m[1]}` : ''
}

export const TEN_PHAN: Record<'I' | 'II' | 'III', string> = { I: 'Trắc nghiệm', II: 'Đúng–sai', III: 'Trả lời ngắn' }

/**
 * Thầy 28/09: app phụ huynh KHÔNG dùng chữ "A.I Đỗ Đại Học" / "Bộ não A.I …" — người nói với phụ huynh là "Thầy Đỗ Đại Học".
 * Áp cho MỌI chữ máy chủ gửi rồi hiện nguyên văn (thư tuần, lời nhắn, cảnh báo). Chữ của chính app viết thẳng "Thầy Đỗ Đại Học".
 */
export function chuThay(s: string): string {
  return s
    .replace(/Bộ não A\.?I\.? hỗ trợ riêng (?:em|con)(?: \p{Lu}\p{L}*)*/gu, 'Thầy Đỗ Đại Học')
    .replace(/Bộ não A\.?I\.?/gu, 'Thầy Đỗ Đại Học')
    .replace(/A\.I Đỗ Đại Học/g, 'Thầy Đỗ Đại Học')
}
