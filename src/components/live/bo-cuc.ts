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
/** Lề ngoài tối thiểu quanh giấy + bảng (px của máy em), cộng thêm vùng an toàn của máy (tai thỏ, thanh home). */
export const LE_NGOAI = 4
/** Khe giữa giấy và bảng trên máy em không rộng quá ngần này (px); khe trên tờ của thầy rộng hơn ⇒ hai ô nới về phía nhau. */
export const KHE_GIUA = 5

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
export interface O { x: number; y: number; w: number; h: number }
export interface BoCucEm {
  /** Phép co + dời áp lên vùng chiếu (px lôgic ⇒ px của hình). MỘT phép co đều cho cả giấy lẫn bảng ⇒ nét của thầy khớp đúng chỗ. */
  s: number; x: number; y: number
  /** Khối giấy + bảng theo ĐÚNG ô của thầy (px của hình). */
  cw: number; ch: number
  /** Ô giấy / ô bảng VẼ trên máy em (px của hình): ô của thầy nới ra tới mép khung nhìn — phần nới là giấy trắng / bảng trống, nét không đổi chỗ. */
  giay: O; bang: O
  /** Diện tích (giấy + bảng) / diện tích khung nhìn đã trừ vùng an toàn, 0..1. */
  phu: number
}
interface Hop { x0: number; y0: number; x1: number; y1: number }
/** Khung nhìn dùng được: hình trừ vùng an toàn trừ lề ngoài. */
const khungDung = (w: number, h: number, at: AnToan): Hop => {
  const x0 = at.trai + LE_NGOAI, y0 = (at.tren ?? 0) + LE_NGOAI
  return { x0, y0, x1: Math.max(x0 + 1, w - at.phai - LE_NGOAI), y1: Math.max(y0 + 1, h - at.duoi - LE_NGOAI) }
}
const giayBenTrai = (k: KhungChieu): boolean => k.giay.x <= k.bang.x

/** PHỦ KÍN (thầy 11/11 lần 3: «tối ưu không gian hiển thị đề và bảng đen phải full để hs đọc rõ»): với phép co + dời `p`, nới ô giấy và ô bảng ra tới mép
 *  khung nhìn — ô bên trái nới sang trái, ô bên phải nới sang phải, cả hai nới lên / xuống; khe giữa thu về `KHE_GIUA`. Chỉ ô NỀN nới; nét, chữ giấy soi và
 *  khung cuộn của bảng vẫn theo đúng ô của thầy. Giấy và bảng không xếp cạnh nhau (bố cục lạ) ⇒ giữ nguyên ô của thầy. */
export function oPhu(w: number, h: number, at: AnToan, k: KhungChieu, p: { s: number; x: number; y: number }): { giay: O; bang: O; phu: number } {
  const A = khungDung(w, h, at)
  const hop = (o: O): Hop => ({ x0: p.x + o.x * p.s, y0: p.y + o.y * p.s, x1: p.x + (o.x + o.w) * p.s, y1: p.y + (o.y + o.h) * p.s })
  const g = hop(k.giay), b = hop(k.bang)
  const T = giayBenTrai(k) ? g : b, P = giayBenTrai(k) ? b : g
  if (T.x1 <= P.x0 + 0.5) {
    const bot = Math.max(0, (P.x0 - T.x1 - KHE_GIUA) / 2)
    T.x1 += bot; P.x0 -= bot
    T.x0 = Math.min(T.x0, A.x0); P.x1 = Math.max(P.x1, A.x1)
    for (const o of [T, P]) { o.y0 = Math.min(o.y0, A.y0); o.y1 = Math.max(o.y1, A.y1) }
  }
  const o4 = (v: Hop): O => ({ x: v.x0, y: v.y0, w: v.x1 - v.x0, h: v.y1 - v.y0 })
  const dt = (v: Hop): number => Math.max(0, Math.min(v.x1, A.x1) - Math.max(v.x0, A.x0)) * Math.max(0, Math.min(v.y1, A.y1) - Math.max(v.y0, A.y0))
  return { giay: o4(g), bang: o4(b), phu: (dt(g) + dt(b)) / (Math.max(1, w - at.trai - at.phai) * Math.max(1, h - at.duoi - (at.tren ?? 0))) }
}

/** Co khối GIẤY + BẢNG (hộp bao hai ô của thầy — bỏ hẳn lề của tờ chiếu) vừa khung nhìn theo CẠNH GIỚI HẠN, không chừa dải nào cho tay nắm (tay nắm đè mép
 *  phải bảng đen). Khối dính mép trên và dính về phía giấy (giấy bên trái ⇒ dính trái): phần dư bề ngang thành bảng đen nới rộng — chỗ tay nắm đứng, thầy
 *  không viết tới; phần dư bề dọc thành giấy / bảng nới xuống dưới. Tỉ lệ nội bộ của vùng chiếu giữ nguyên (một phép co đều). */
export function boCucEm(w: number, h: number, at: AnToan, k: KhungChieu): BoCucEm {
  const A = khungDung(w, h, at)
  const bx0 = Math.min(k.giay.x, k.bang.x), by0 = Math.min(k.giay.y, k.bang.y)
  const bw = Math.max(k.giay.x + k.giay.w, k.bang.x + k.bang.w) - bx0, bh = Math.max(k.giay.y + k.giay.h, k.bang.y + k.bang.h) - by0
  const s = Math.min((A.x1 - A.x0) / bw, (A.y1 - A.y0) / bh)
  const p = { s, x: giayBenTrai(k) ? A.x0 - bx0 * s : A.x1 - (bx0 + bw) * s, y: A.y0 - by0 * s }
  return { ...p, cw: bw * s, ch: bh * s, ...oPhu(w, h, at, k, p) }
}

/** Phóng bảng (chạm hai lần, ảnh 35): ô bảng đen của thầy phủ kín chiều cao (hoặc bề ngang), nằm giữa; phần còn lại bên phía giấy vẫn là giấy. */
export function boCucPhong(w: number, h: number, at: AnToan, k: KhungChieu): BoCucEm {
  const A = khungDung(w, h, at), ngang = A.x1 - A.x0, doc = A.y1 - A.y0
  const s = Math.min(ngang / k.bang.w, doc / k.bang.h)
  const p = { s, x: A.x0 + (ngang - k.bang.w * s) / 2 - k.bang.x * s, y: A.y0 + (doc - k.bang.h * s) / 2 - k.bang.y * s }
  return { ...p, cw: k.bang.w * s, ch: k.bang.h * s, ...oPhu(w, h, at, k, p) }
}

/** Máy đang DỌC mà không khoá ngang được (iPhone; Android từ chối `lock`) ⇒ xoay hình 90° bằng CSS. Khổ của HÌNH khi đó = (cao, rộng) của trang. */
export function canXoayCss(rong: number, cao: number, daKhoaNgang: boolean): boolean {
  return !daKhoaNgang && cao > rong
}
/** Vùng an toàn của HÌNH từ vùng an toàn của MÁY (env(safe-area-inset-*)): hình xoay 90° thuận kim ⇒ đỉnh máy (tai thỏ) thành mép TRÁI hình, đáy máy
 *  (thanh home) thành mép PHẢI hình, mép trái máy thành đáy hình, mép phải máy thành mép TRÊN hình. Tay nắm + khay ở mép PHẢI của hình = phía thanh home. */
export function anToanHinh(may: { tren: number; phai: number; duoi: number; trai: number }, xoay: boolean): AnToan {
  return xoay ? { trai: may.tren, phai: may.duoi, duoi: may.trai, tren: may.phai } : { trai: may.trai, phai: may.phai, duoi: may.duoi, tren: may.tren }
}
