// LIVE BẢNG — MÁY EM: PHẦN TÍNH của thông báo «lên bảng» (không phải component): em được gọi của lượt, khoá «đang lên bảng», pha của tấm giữa màn.
// Tách khỏi LenBang.tsx (12/11, luật lint only-export-components: tệp component chỉ xuất component). Chỉ LopLive (nạp lười) nhập ⇒ không vào mảnh mở app.
// Chú giải + luật phát: đầu LenBang.tsx. AN TOÀN: chỉ dùng `viewEm.luot.goi` (tên, đội, đã chấm chưa) — không đáp án.
import { useEffect, useState } from 'react'
import { tenNgan, type ViewEm } from '../../lib/bpu/phong'

/** Tấm giữa màn đứng ngần này (ms) · thu nhỏ về dấu trong ngần này (ms). */
export const GIUA_MS = 3000, THU_MS = 400

export interface EmLenBang {
  /** Khoá của LỜI GỌI (lượt + em): đổi ⇒ lời gọi mới. */
  khoa: string
  /** Tên gọi hai chữ. */
  ten: string
  doi: number
  /** Máy này là của chính em được gọi. */
  laEm: boolean
  /** Em còn ĐANG lên bảng (thầy chưa chấm, chưa mở đáp án). */
  dang: boolean
  /** Lượt cổ vũ theo đội người bấm (0–3) · số lần chính em cầm máy đã bấm — cho tinh thể cổ vũ (TinhTheCoVu.tsx). */
  tiep: readonly number[]
  emTiep: number
  /** Đội của em cầm máy (−1 = không rõ). */
  doiEm: number
}
const KHONG_TIEP: readonly number[] = [0, 0, 0, 0]
/** Em được gọi lên bảng của lượt (từ `viewEm.luot`); không có lời gọi ⇒ null. `sbd` = số báo danh của em đang cầm máy. */
export function emLenBang(l: ViewEm['luot'] | undefined, sbd: string | null | undefined, doiEm = -1): EmLenBang | null {
  const g = l?.goi
  if (!l || !g) return null
  return { khoa: `${l.so}:${g.sbd}`, ten: tenNgan(g.ten), doi: g.doi, laEm: !!sbd && g.sbd === sbd, dang: l.pha !== 'mo' && g.dat == null, tiep: g.tiepDoi ?? KHONG_TIEP, emTiep: g.emTiep ?? 0, doiEm }
}
/** Khoá «đang lên bảng» để so lời gọi mới (rỗng = không ai đang lên bảng). */
export const khoaDang = (em: EmLenBang | null | undefined): string => (em && em.dang ? em.khoa : '')

/** Pha của tấm giữa màn theo mốc phát `luc` (0 = không phát): 'giua' ⇒ 'thu' ⇒ ''. Mốc đổi (gọi em khác) ⇒ bắt đầu lại; mốc về 0 (hết lượt gọi) ⇒ tắt ngay. */
export function usePhaLenBang(luc: number): 'giua' | 'thu' | '' {
  const tinh = (): 'giua' | '' => (luc > 0 && Date.now() - luc < GIUA_MS ? 'giua' : '')
  const [pha, setPha] = useState<'giua' | 'thu' | ''>(tinh)
  const [truoc, setTruoc] = useState(luc)
  if (luc !== truoc) { setTruoc(luc); setPha(tinh()) }
  useEffect(() => {
    if (pha === 'giua') { const h = setTimeout(() => setPha('thu'), Math.max(0, luc + GIUA_MS - Date.now())); return () => clearTimeout(h) }
    if (pha === 'thu') { const h = setTimeout(() => setPha(''), THU_MS + 40); return () => clearTimeout(h) }
    return undefined
  }, [pha, luc])
  return pha
}

// ── TINH THỂ CỔ VŨ: chỗ đo của MÁY EM (lớp phủ là con trực tiếp của `.lv`). Cộng dồn offset, không dùng getBoundingClientRect — hình có thể xoay 90° bằng CSS. ──
function tamTheoOffset(lop: HTMLElement, el: HTMLElement | null): { x: number; y: number } | null {
  const goc = lop.offsetParent
  if (!el || !goc || !el.offsetWidth) return null
  let x = el.offsetWidth / 2, y = el.offsetHeight / 2
  for (let n: HTMLElement | null = el; n && n !== goc; n = n.offsetParent as HTMLElement | null) { x += n.offsetLeft; y += n.offsetTop }
  return { x: x - lop.offsetLeft, y: y - lop.offsetTop }
}
/** Đích = thẻ tên CÓ SẴN trên khung bảng (`.lv-lb-the`); bảng đang phóng kín (không có dải thẻ tên) ⇒ giữa mép trên. */
export function dichTinhTheEm(lop: HTMLDivElement): { x: number; y: number; the?: Element | null } {
  const the = lop.parentElement?.querySelector<HTMLElement>('.lv-lb-the') ?? null, p = tamTheoOffset(lop, the)
  return p ? { ...p, the } : { x: lop.offsetWidth / 2, y: 14 }
}
/** Nguồn tinh thể của chính em = nút «Tiếp sức / Cổ vũ» trên dải lượt. */
export const nguonTinhTheEm = (lop: HTMLDivElement): { x: number; y: number } | null => tamTheoOffset(lop, lop.parentElement?.querySelector<HTMLElement>('.lv-luot button.tiep') ?? null)
