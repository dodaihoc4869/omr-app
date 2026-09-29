// BI-A PHẢN ỨNG · BỐ CỤC + PHÉP ĐỔI TOẠ ĐỘ (đặc tả 8.3). Chọn theo kích thước THẬT của khung, không theo loại máy.
// Bàn tự nằm ngang khi khung rộng hơn cao (chọn chiều cho bàn to nhất). Vật lý luôn trên bàn dọc 500 × 900; bàn ngang chỉ đổi phép vẽ:
// màn = (H − y, x) — phép QUAY, không lật, nên xoáy trái/phải vẫn đúng chiều.
import { H, T, W } from './vat-ly'

export type BoCuc = 'doc' | 'ngang' | 'pc'
/** Máy tính: rộng ≥ 1024 và cao ≥ 600. Còn lại: rộng > cao ⇒ xoay ngang; không thì dọc. */
export function chonBoCuc(rong: number, cao: number): BoCuc {
  if (rong >= 1024 && cao >= 600) return 'pc'
  if (rong > cao) return 'ngang'
  return 'doc'
}
export interface KhungBan {
  /** Bàn vẽ nằm ngang. */
  xoay: boolean
  /** Điểm ảnh CSS trên một đơn vị bàn. */
  S: number
  /** Cỡ canvas theo điểm ảnh CSS. */
  cw: number
  ch: number
}
/** Khung bàn vừa hộp (bw × bh điểm ảnh CSS).
 *  · `khungDoc` (khung nhìn dọc: rộng ≤ cao) ⇒ bàn LUÔN dọc — máy cầm dọc không bao giờ thấy bàn nằm ngang, dù hộp bàn tạm thấp.
 *  · Còn lại chọn chiều cho bàn to nhất; có `xoayCu` thì chỉ đổi chiều khi chiều kia to hơn ≥ 8% (trễ, không lật qua lại).
 *    Không có `xoayCu`: lệch < 2% thì giữ dọc. */
export function tinhKhungBan(bw: number, bh: number, o: { khungDoc?: boolean; xoayCu?: boolean } = {}): KhungBan {
  const s1 = Math.min(bw / (W + 2 * T), bh / (H + 2 * T)), s2 = Math.min(bw / (H + 2 * T), bh / (W + 2 * T))
  const xoay = o.khungDoc ? false : o.xoayCu === undefined ? s2 > s1 * 1.02 : o.xoayCu ? !(s1 > s2 * 1.08) : s2 > s1 * 1.08
  const S = Math.max(0.05, xoay ? s2 : s1)
  return { xoay, S, cw: ((xoay ? H : W) + 2 * T) * S, ch: ((xoay ? W : H) + 2 * T) * S }
}
/** Toạ độ bàn → điểm ảnh canvas (đã nhân dpr). */
export function raMan(k: KhungBan, dpr: number, px: number, py: number): [number, number] {
  const s = k.S * dpr
  return k.xoay ? [s * (H + T - py), s * (px + T)] : [s * (px + T), s * (py + T)]
}
/** Đặt ma trận vẽ theo toạ độ bàn. */
export function datTFBan(x: CanvasRenderingContext2D, k: KhungBan, dpr: number): void {
  const s = k.S * dpr
  if (k.xoay) x.setTransform(0, s, -s, 0, s * (H + T), s * T)
  else x.setTransform(s, 0, 0, s, s * T, s * T)
}
/** Điểm chạm (điểm ảnh CSS trong canvas, CHƯA co giãn) → toạ độ bàn. */
export function toaDoBan(k: KhungBan, lx: number, ly: number): { x: number; y: number } {
  const u = lx / k.S - T, v = ly / k.S - T
  return k.xoay ? { x: v, y: H - u } : { x: u, y: v }
}
/** Lệch trái/phải (−0,7 … 0,7) theo vị trí bi TRÊN MÀN, cho âm thanh. */
export function panTheoMan(k: Pick<KhungBan, 'xoay'>, x: number, y: number): number {
  const fx = k.xoay ? (H - y) / H : x / W
  return (fx * 2 - 1) * 0.7
}

// ───── ĐIỆN THOẠI XOAY NGANG · BÀN TOÀN MÀN (thầy lệnh 29/09: "khi xoay ngang màn hình cả bàn bi a full ngang giống điện thoại") ─────
// Bàn chiếm cả khung trừ: lề an toàn (tai thỏ / thanh home: env(safe-area-inset-*), tối thiểu LE_NGANG) và MỘT cột nút mảnh mỗi bên
// (COT_NGANG: nút 44 px bên trái, thanh lực dọc bên phải). Mọi thứ khác là lớp phủ. CSS `bi-a.css` (khối "xoay ngang") dùng ĐÚNG hai số này.
export const COT_NGANG = 48
export const LE_NGANG = 4
export interface VienAn { tren: number; phai: number; duoi: number; trai: number }
export interface HopBanNgang extends KhungBan {
  /** Góc trên-trái canvas trong khung (điểm ảnh CSS). */
  x: number
  y: number
  /** Hộp dành cho bàn (sau lề an toàn + hai cột nút). */
  hop: { x: number; y: number; w: number; h: number }
}
/** Hộp bàn khi điện thoại xoay ngang (khung `vw × vh`, lề an toàn `an`): bàn nằm ngang, đúng tỉ lệ, to nhất, canh giữa. */
export function hopBanNgang(vw: number, vh: number, an: Partial<VienAn> = {}): HopBanNgang {
  const trai = Math.max(LE_NGANG, an.trai ?? 0) + COT_NGANG, phai = Math.max(LE_NGANG, an.phai ?? 0) + COT_NGANG
  const tren = Math.max(LE_NGANG, an.tren ?? 0), duoi = Math.max(LE_NGANG, an.duoi ?? 0)
  const w = Math.max(1, vw - trai - phai), h = Math.max(1, vh - tren - duoi)
  const k = tinhKhungBan(w, h, { xoayCu: true })
  return { ...k, x: trai + (w - k.cw) / 2, y: tren + (h - k.ch) / 2, hop: { x: trai, y: tren, w, h } }
}
