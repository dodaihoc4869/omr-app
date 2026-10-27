// Mức câu → giám thị (màn làm chặng Duo). Tệp NHỎ, nạp cùng màn làm bài; phần vẽ / hoạt ảnh nằm trong mảnh lười GiamThi.
import type { MucGT } from './giam-thi-ve'

// Chuẩn hoá mức độ: CÙNG luật `khoaMucDo()` (src/lib/muc-do-nhan-thuc.ts — test giam-thi-2710 khoá hai hàm trả như nhau). Không nhập tệp ấy: nó thành
// mảnh dùng chung với báo cáo ca ⇒ precache vượt trần 170 tệp (kiem-sw).
const KHOA: Record<string, MucGT> = { biet: 'nb', nb: 'nb', nhan_biet: 'nb', hieu: 'th', th: 'th', thong_hieu: 'th', van_dung: 'vd', vd: 'vd', van_dung_cao: 'vdc', vdc: 'vdc' }

/** Câu không có mức độ ⇒ null (không giám thị, giữ bố cục cũ). Sao ≥ 2 ⇒ Vận dụng cao, cùng luật máy chủ (hanh-trinh-v5-d1: `sao>=2 ? 'VDC'`). */
export function mucGiamThi(q: { mucDo?: unknown; sao?: unknown } | null | undefined): MucGT | null {
  const k = KHOA[String(q?.mucDo ?? '').trim().toLowerCase().replace(/\s+/g, '_')]
  if (!k) return null
  return Number(q?.sao) >= 2 ? 'vdc' : k
}

/** Đề dài / có hình ⇒ giám thị thu nhỏ góc trái trên, bong bóng đề chảy xuống. Ngắn (≤ ~3 dòng ở 390 px) ⇒ giám thị to cạnh bong bóng. */
export const deDaiGiamThi = (q: { text?: string; thanCauImg?: unknown; table?: unknown; hinhAnh?: { viTri: string }[] }) =>
  (q.text?.length ?? 0) > 64 || !!q.thanCauImg || !!q.table || !!q.hinhAnh?.some((h) => h.viTri === 'sau_de')
