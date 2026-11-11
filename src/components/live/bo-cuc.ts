// LIVE BẢNG — BỐ CỤC MÁY EM (đặc tả docs/dac-ta-live-bang-1011.md mục 2.2, 4.6; bản vẽ docs/ban-ve-live-1011 ảnh 13–40). Thuần: không DOM.
//
// Máy em SOI ĐÚNG màn chiếu: giấy đề bên trái, bảng đen bên phải. Nét bút của thầy mang toạ độ 0..1 theo CẢ cửa sổ tờ chiếu (src/lib/but-bang-loi.ts);
// tờ báo thêm ô giấy + ô bảng của đợt đang chiếu (`window.__mcBut.vung()`) ⇒ máy em dựng một «cửa sổ thầy ảo» cùng tỉ lệ, cắt lấy phần giấy + bảng
// (bỏ thanh phím dưới đáy) rồi co vừa màn. Nét vẽ lại bằng CHÍNH bộ dựng nét của thầy trên khung ảo đó ⇒ hình y hệt, sắc ở mọi cỡ.
//
// Ô giấy / ô bảng đi cùng KHOÁ TRANG của sổ nét (chuỗi ≤ 60 ký tự do app thầy đặt, phòng không đọc): `<khoá>~gx0,gy0,gx1,gy1,bx0,by0,bx1,by1~<s|t>`
// (phần nghìn của cửa sổ thầy; s = giấy sáng, t = giấy tối). Khoá không có phần này (bản cũ / nguồn khác) ⇒ dùng ô mặc định đo trên tờ thật 16:9.

/** Ô chữ nhật [x0, y0, x1, y1], 0..1 theo cửa sổ tờ chiếu của thầy. */
export type O4 = [number, number, number, number]
export interface VungChieu { giay: O4; bang: O4; giayToi: boolean }

/** Đo trên tờ chiếu thật 1920 × 1080 (10/11): giấy đề · cột bảng đen. */
export const VUNG_MAC_DINH: VungChieu = { giay: [0.0052, 0.0093, 0.6615, 0.9194], bang: [0.6667, 0.0185, 0.9948, 0.9194], giayToi: false }
/** Chiều cao lôgic của vùng chiếu trên máy em (bản vẽ: 1600 × 820). */
export const CAO_LOGIC = 820
/** Dải dành cho tay nắm ở MÉP TRÊN (thầy 11/11 lần 2: «thanh ẩn … chuyển lên mép trên») — khi còn chỗ; tay nắm là viên thuốc nằm ngang cao 7 px. */
export const CO_NAM = 18

const hopLe = (o: number[]): o is O4 => o.length === 4 && o.every((v) => Number.isFinite(v) && v >= 0 && v <= 1) && o[2]! - o[0]! > 0.02 && o[3]! - o[1]! > 0.02

/** Ghép khoá trang gửi vào sổ nét (máy thầy). */
export function maTrang(khoa: string, vung: { giay?: readonly number[] | null; bang?: readonly number[] | null } | null, giayToi: boolean): string {
  const k = String(khoa).replace(/~/g, '-').slice(0, 12)
  const g = vung?.giay, b = vung?.bang
  if (!g || !b || !hopLe([...g]) || !hopLe([...b])) return k
  const so = [...g, ...b].map((v) => Math.round(v * 1000)).join(',')
  return `${k}~${so}~${giayToi ? 't' : 's'}`
}
/** Tách khoá trang (máy em). Phần ô vắng / hỏng ⇒ ô mặc định. */
export function giaiTrang(trang: string): { khoa: string; vung: VungChieu } {
  const [khoa = '', so = '', giay = ''] = String(trang ?? '').split('~')
  const ds = so ? so.split(',').map((v) => Number(v) / 1000) : []
  const g = ds.slice(0, 4), b = ds.slice(4, 8)
  if (ds.length !== 8 || !hopLe(g) || !hopLe(b)) return { khoa, vung: { ...VUNG_MAC_DINH, giayToi: giay === 't' } }
  return { khoa, vung: { giay: g, bang: b, giayToi: giay === 't' } }
}

export interface KhungChieu {
  /** Cửa sổ thầy ảo, tính bằng px lôgic (vùng chiếu cao `CAO_LOGIC`). */
  Wv: number
  Hv: number
  /** Góc trên-trái của vùng chiếu trong cửa sổ ảo (px lôgic). */
  ox: number
  oy: number
  /** Vùng chiếu (px lôgic). */
  LW: number
  LH: number
  /** Ô giấy / ô bảng trong vùng chiếu (px lôgic). */
  giay: { x: number; y: number; w: number; h: number }
  bang: { x: number; y: number; w: number; h: number }
}
/** Vùng chiếu = hộp bao giấy + bảng, nới ra bằng đúng lề trái của giấy (mép vùng cách đều như trên tờ). `tiLe` = ngang / dọc cửa sổ thầy. */
export function khungChieu(vung: VungChieu, tiLe: number): KhungChieu {
  const t = tiLe > 0.5 && tiLe < 4 ? tiLe : 16 / 9
  const g = vung.giay, b = vung.bang
  const le = Math.max(0, Math.min(g[0], b[0]))
  const cx0 = Math.max(0, Math.min(g[0], b[0]) - le), cx1 = Math.min(1, Math.max(g[2], b[2]) + le)
  const leDoc = le * t // cùng số px với lề ngang
  const cy0 = Math.max(0, Math.min(g[1], b[1]) - leDoc), cy1 = Math.min(1, Math.max(g[3], b[3]) + leDoc)
  const Hv = CAO_LOGIC / (cy1 - cy0), Wv = Hv * t
  const o = (v: O4) => ({ x: (v[0] - cx0) * Wv, y: (v[1] - cy0) * Hv, w: (v[2] - v[0]) * Wv, h: (v[3] - v[1]) * Hv })
  return { Wv, Hv, ox: cx0 * Wv, oy: cy0 * Hv, LW: (cx1 - cx0) * Wv, LH: CAO_LOGIC, giay: o(g), bang: o(b) }
}

/** Vùng an toàn của HÌNH (đã xoay nếu có): trái, phải, đáy, trên (px; `tren` vắng = 0). */
export interface AnToan { trai: number; phai: number; duoi: number; tren?: number }
export interface BoCucEm { s: number; x: number; y: number; cw: number; ch: number; /** Tay nắm đè lên mép bảng (không còn dải dư) ⇒ mờ 78 %, em kéo dọc được. */ namDe: boolean }
/** Co vùng chiếu `LW × LH` vừa hình `w × h` (hình luôn NGANG), canh giữa bề ngang. Còn chỗ thì chừa dải tay nắm ở MÉP TRÊN (vùng chiếu dồn xuống dưới);
 *  chừa mà hình nhỏ đi quá 6 % ⇒ thôi, để tay nắm đè mép trên (mờ, tự né nét). */
export function boCucEm(w: number, h: number, at: AnToan, LW: number, LH: number = CAO_LOGIC): BoCucEm {
  const tren = at.tren ?? 0
  const ngang = Math.max(1, w - at.trai - at.phai), doc = Math.max(1, h - at.duoi - tren)
  const sDay = Math.min(ngang / LW, doc / LH), sNam = Math.min(ngang / LW, (doc - CO_NAM) / LH)
  const s = sNam < sDay * 0.94 ? sDay : sNam
  const cw = LW * s, ch = LH * s, du = doc - ch
  const namDe = du < CO_NAM - 0.5
  return { s, x: at.trai + (ngang - cw) / 2, y: tren + (namDe ? du / 2 : CO_NAM + Math.max(0, (du - CO_NAM) / 2)), cw, ch, namDe }
}

/** Phóng bảng (chạm hai lần, ảnh 35): ô bảng đen phủ kín chiều cao. Trả phép dời + co áp lên vùng chiếu. */
export function boCucPhong(w: number, h: number, at: AnToan, k: KhungChieu): { s: number; x: number; y: number } {
  const tren = (at.tren ?? 0) + CO_NAM
  const ngang = Math.max(1, w - at.trai - at.phai), doc = Math.max(1, h - at.duoi - tren)
  const s = Math.min(ngang / k.bang.w, doc / k.bang.h)
  return { s, x: at.trai + (ngang - k.bang.w * s) / 2 - k.bang.x * s, y: tren + (doc - k.bang.h * s) / 2 - k.bang.y * s }
}

/** Máy đang DỌC mà không khoá ngang được (iPhone; Android từ chối `lock`) ⇒ xoay hình 90° bằng CSS. Khổ của HÌNH khi đó = (cao, rộng) của trang. */
export function canXoayCss(rong: number, cao: number, daKhoaNgang: boolean): boolean {
  return !daKhoaNgang && cao > rong
}
/** Vùng an toàn của HÌNH từ vùng an toàn của MÁY (env(safe-area-inset-*)): hình xoay 90° thuận kim ⇒ đỉnh máy (tai thỏ) thành mép TRÁI hình, đáy máy
 *  (thanh home) thành mép PHẢI hình, mép trái máy thành đáy hình, mép phải máy thành mép TRÊN hình (chỗ tay nắm). */
export function anToanHinh(may: { tren: number; phai: number; duoi: number; trai: number }, xoay: boolean): AnToan {
  return xoay ? { trai: may.tren, phai: may.duoi, duoi: may.trai, tren: may.phai } : { trai: may.trai, phai: may.phai, duoi: may.duoi, tren: may.tren }
}
