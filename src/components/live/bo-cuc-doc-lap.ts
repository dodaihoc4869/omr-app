// LIVE BẢNG — MÁY EM: GIẤY ĐỀ VÀ BẢNG ĐEN CO GIÃN ĐỘC LẬP (11/11 chiều; đặc tả docs/dac-ta-live-bang-1011.md mục 4.3h). Thuần: không DOM.
// Thầy 11/11: «tối ưu không gian hiển thị đề và bảng đen phải full để hs đọc rõ» ⇒ (sau khi biết phủ kín mà chữ chưa to hơn) «Làm chuẩn cái này luôn nhé.
// Tối ưu cho hs nhất có thể».
//
// VÌ SAO PHẢI TÁCH: bản trước co CẢ vùng chiếu (giấy + bảng) bằng MỘT hệ số ⇒ giấy và bảng trói nhau theo tỉ lệ tờ của thầy; màn nào cũng có một
// cạnh giới hạn nên chữ + nét chỉ to thêm 0–9 %. Ở đây mỗi khung một phép co riêng theo BỀ NGANG của chính nó; nội dung cao hơn khung thì cuộn dọc
// trong khung (giấy: em tự cuộn + tự trôi theo bút thầy; bảng: tự theo bút như bảng cuộn sẵn có).
//
// GIỚI HẠN HÌNH HỌC (nói thẳng): giấy giữ ĐÚNG cách xuống dòng của giấy thầy (để nét gạch chân khớp chữ) ⇒ cỡ chữ đề tỉ lệ thuận với bề ngang khung
// giấy; nét bảng tỉ lệ thuận với bề ngang khung bảng. Hai khung chia nhau MỘT bề ngang màn ⇒ không thể cùng lúc to hết cỡ. Vì vậy:
//   · `chia` = phần bề ngang của GIẤY (0..1). Ba mốc (`mocChia`): ƯU TIÊN GIẤY · GIỮA · ƯU TIÊN BẢNG, tính theo cỡ chữ thật của đề trên giấy thầy:
//     giấy không hẹp tới mức chữ đề dưới 15 px (`SAN_CHU`), không rộng quá mức chữ 34 px (`TRAN_CHU`); bảng không rộng quá mức nét bằng nét thật của
//     thầy trên màn 1920 (`S_TRAN`).
//   · TỰ ƯU TIÊN THEO THẦY (`taoUuTien`): thầy viết trên bảng ⇒ sau 2 giây bảng nở; thầy quay lại gạch trên giấy ⇒ sau 2 giây giấy nở. Em kéo vạch
//     chia thì theo em (nhớ trên máy); chạm hai lần vào khung nào thì khung đó phủ kín, khung kia trượt ra ngoài màn.
import { KHE_GIUA, LE_NGOAI, type AnToan, type KhungChieu, type O } from './bo-cuc'
import type { KhungVe } from './ve-bang'

/** Chữ thường của đề trên máy em không nhỏ hơn / không cần to hơn ngần này (px CSS) khi máy tự chia. */
export const SAN_CHU = 15, TRAN_CHU = 34
/** Phép co không vượt mức này (px máy em / px lôgic) trừ khi màn cao tới mức «vừa chiều cao» còn lớn hơn: 1,15 ≈ nét to bằng nét của thầy trên màn 1920. */
export const S_TRAN = 1.15
/** Giấy thầy mặc định: cỡ chữ đề / bề ngang ô giấy (đo tờ thật 1366: 34,8 / 896) — dùng khi chưa có số đo giấy. */
export const TI_LE_CHU_MAC_DINH = 0.0388
/** Trễ quyết định của tự ưu tiên (ms) · em vừa tự cuộn trong ngần này thì khung không tự trôi (ms) · khung nở / thu trong ngần này (ms). */
export const TRE_UU_TIEN_MS = 2000, NHUONG_MS = 4000, NO_MS = 450
/** Khoá nhớ vạch chia trên máy em (em tự kéo). Vắng = máy tự chia theo thầy. */
export const KHOA_CHIA = 'ddh.live.chia'
/** DẢI THẺ TÊN em đang lên bảng (thầy 11/11: thông báo «lên bảng» thu về góc thẻ tên): nằm NGOÀI mép trên khung bảng đen — như thẻ tên trên màn chiếu của
 *  thầy (hàng trên của cột bảng; ô bảng thầy gửi sang KHÔNG gồm thẻ ấy nên nét của thầy có thể nằm sát mép trên khung bảng ⇒ thẻ không được đè lên khung).
 *  Khung bảng nhường `DAU_BANG` px (dải cao `DAU_BANG − KHE_DAU`, khe `KHE_DAU` sát khung); khung giấy không đổi. Dải rộng dưới `DAU_DU` px ⇒ dấu chỉ còn hình. */
export const DAU_BANG = 26, KHE_DAU = 2, DAU_DU = 236

export type Vung = 'giay' | 'bang'
export interface MocChia { giay: number; giua: number; bang: number }
const kep = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v))

interface Hop { x0: number; y0: number; x1: number; y1: number }
const khungDung = (w: number, h: number, at: AnToan): Hop => {
  const x0 = at.trai + LE_NGOAI, y0 = (at.tren ?? 0) + LE_NGOAI
  return { x0, y0, x1: Math.max(x0 + 1, w - at.phai - LE_NGOAI), y1: Math.max(y0 + 1, h - at.duoi - LE_NGOAI) }
}

/** BA MỐC CHIA theo nội dung. `tiLeChu` = cỡ chữ đề / bề ngang ô giấy của thầy (từ số đo giấy; null = giấy dựng thường, chữ không phụ thuộc bề ngang khung).
 *  Trả phần bề ngang của GIẤY ở ba trạng thái. Luôn có bang ≤ giua ≤ giay. */
export function mocChia(w: number, h: number, at: AnToan, kc: KhungChieu, tiLeChu: number | null): MocChia {
  // giấy dựng thường (câu có ảnh / bảng / sơ đồ, giấy lệch): chữ xuống dòng theo khung của em ⇒ giấy không cần rộng, nhường bảng
  if (tiLeChu == null || !(tiLeChu > 0)) return { giay: 0.6, giua: 0.5, bang: 0.42 }
  const A = khungDung(w, h, at), W = Math.max(1, A.x1 - A.x0 - KHE_GIUA), H = A.y1 - A.y0
  /** Cỡ chữ đề khi giấy rộng cả `W` (chưa kẹp trần phép co). */
  const chuDay = tiLeChu * W
  const pSan = SAN_CHU / chuDay, pTran = TRAN_CHU / chuDay
  const giua = kep(0.6, Math.min(pSan, 0.72), 0.72)
  const giay = Math.min(0.8, Math.max(giua, pTran))
  // bảng không cần rộng hơn mức nét = nét thật của thầy (hoặc mức vừa chiều cao, nếu màn cao)
  const bangDu = (kc.bang.w * Math.max(H / kc.bang.h, S_TRAN)) / W
  const bang = Math.min(giua, Math.max(0.42, pSan, 1 - bangDu))
  return { giay, giua, bang }
}

export interface BoCucDL {
  /** Khổ hình + phần bề ngang của giấy đang dùng + khung đang phóng kín (nếu có). */
  w: number; h: number; chia: number; phong: Vung | null
  /** Khung giấy / khung bảng trong hình (px CSS). Khung đang bị khung kia phóng kín ⇒ nằm ngoài màn. */
  giay: O; bang: O
  /** Phép co của từng khung (px máy em / px lôgic của vùng chiếu). */
  sG: number; sB: number
  /** Tấm giấy (đúng ô giấy của thầy đã co): lề trái trong khung + khổ. Cao hơn khung ⇒ cuộn. */
  tam: { x: number; w: number; h: number }
  /** Ô bảng của thầy đã co: lề trái trong khung + khổ (cao hơn khung ⇒ máy em trôi theo bút). */
  oBang: { x: number; w: number; h: number }
  /** Tâm vạch chia (px CSS) — nằm giữa khe hai khung; đang phóng kín thì không có vạch. */
  vach: number | null
  /** Bề ngang dùng được để chia (đã trừ khe) + mép trái của nó. */
  x0: number; W: number
}
export interface DauVaoDL { w: number; h: number; at: AnToan; kc: KhungChieu; chia: number; phong?: Vung | null
  /** Bề cao (px) nhường cho dải thẻ tên phía trên khung bảng; 0 / vắng = không có dải. */
  dauBang?: number
  /** Live theo khối, chế độ Bảng: bảng đang phóng co VỪA TRỌN khung (cả ngang lẫn dọc) — em thấy hết bảng của thầy, không phải cuộn. */
  vua?: boolean }

/** HAI KHUNG ĐỘC LẬP. Giấy bên trái bảng (mọi bố cục tờ hiện có); tờ lạ có giấy bên phải ⇒ hai khung đổi bên. */
export function boCucDocLap({ w, h, at, kc, chia, phong = null, dauBang = 0, vua = false }: DauVaoDL): BoCucDL {
  const A = khungDung(w, h, at), Wd = A.x1 - A.x0, H = A.y1 - A.y0, W = Math.max(1, Wd - KHE_GIUA)
  const p = kep(chia, 0.2, 0.9), trai = kc.giay.x <= kc.bang.x
  const wG0 = Math.round(W * p), wB0 = W - wG0
  const wG = phong === 'giay' ? Wd : wG0, wB = phong === 'bang' ? Wd : wB0
  // dải thẻ tên chỉ lấy chỗ của khung BẢNG (không quá 1/5 chiều cao); bảng vốn co theo bề ngang nên nét không nhỏ đi, chỉ bớt phần thấy được
  const dau = kep(dauBang, 0, H * 0.2), HB = H - dau
  const sG = Math.min(wG / kc.giay.w, Math.max(H / kc.giay.h, S_TRAN)), sB = Math.min(wB / kc.bang.w, vua && phong === 'bang' ? HB / kc.bang.h : Math.max(HB / kc.bang.h, S_TRAN))
  // chỗ đứng: bình thường xếp cạnh nhau; khung đang phóng phủ cả bề ngang, khung kia đứng ngoài màn về phía của nó
  const xT = A.x0, xP = (rong: number): number => A.x1 - rong
  let xG: number, xB: number
  if (phong === 'giay') { xG = A.x0; xB = trai ? w + KHE_GIUA : -wB - KHE_GIUA }
  else if (phong === 'bang') { xB = A.x0; xG = trai ? -wG - KHE_GIUA : w + KHE_GIUA }
  else if (trai) { xG = xT; xB = xP(wB) }
  else { xB = xT; xG = xP(wG) }
  const tw = kc.giay.w * sG, bw = kc.bang.w * sB
  return {
    w, h, chia: p, phong,
    giay: { x: xG, y: A.y0, w: wG, h: H }, bang: { x: xB, y: A.y0 + dau, w: wB, h: HB }, sG, sB,
    tam: { x: Math.max(0, (wG - tw) / 2), w: tw, h: kc.giay.h * sG }, oBang: { x: Math.max(0, (wB - bw) / 2), w: bw, h: kc.bang.h * sB },
    vach: phong ? null : (trai ? xG + wG : xB + wB) + KHE_GIUA / 2, x0: A.x0, W,
  }
}

/** Ô của DẢI THẺ TÊN (px CSS của hình): ngay trên khung bảng, cùng bề ngang, cách khung `KHE_DAU`. Bố cục không nhường chỗ ⇒ null. */
export function oDauBang(bc: BoCucDL): O | null {
  const cao = bc.bang.y - bc.giay.y - KHE_DAU
  return cao > 0 ? { x: bc.bang.x, y: bc.giay.y, w: bc.bang.w, h: cao } : null
}

/** Số cho lớp vẽ nét (ve-bang.ts `datKhung`): lớp chốt của giấy = đúng tấm giấy; bảng theo cửa sổ thầy ảo riêng. `kc` = khung chiếu của CÙNG trang. */
export function khungVeDL(bc: BoCucDL, kc: KhungChieu, dpr: number): KhungVe {
  const { sG, sB } = bc
  return {
    Wv: kc.Wv * sG, Hv: kc.Hv * sG, ox: (kc.ox + kc.giay.x) * sG, oy: (kc.oy + kc.giay.y) * sG, w: bc.tam.w, h: bc.tam.h, dpr,
    dl: {
      hw: bc.w, hh: bc.h,
      gx: bc.giay.x + bc.tam.x, gy: bc.giay.y, gw: bc.tam.w, gh: bc.giay.h,
      bWv: kc.Wv * sB, bHv: kc.Hv * sB, box: (kc.ox + kc.bang.x) * sB - (bc.bang.x + bc.oBang.x), boy: (kc.oy + kc.bang.y) * sB - bc.bang.y, bh: bc.bang.h,
      kx: bc.bang.x, ky: bc.bang.y,
    },
  }
}
/** Điểm (x, y) 0..1 của cửa sổ thầy ⇒ px CSS trong HÌNH theo phép của khung GIẤY (chưa trừ độ cuộn của giấy). */
export function diemGiay(bc: BoCucDL, kc: KhungChieu, x: number, y: number): [number, number] {
  return [bc.giay.x + bc.tam.x + (x * kc.Wv - kc.ox - kc.giay.x) * bc.sG, bc.giay.y + (y * kc.Hv - kc.oy - kc.giay.y) * bc.sG]
}
/** Như trên theo phép của khung BẢNG (chưa trừ độ cuộn của bảng). */
export function diemBang(bc: BoCucDL, kc: KhungChieu, x: number, y: number): [number, number] {
  return [bc.bang.x + bc.oBang.x + (x * kc.Wv - kc.ox - kc.bang.x) * bc.sB, bc.bang.y + (y * kc.Hv - kc.oy - kc.bang.y) * bc.sB]
}
/** Bút của thầy đang ở vùng nào: nét mã «b_…» = bảng; còn lại theo hoành độ (trong cột bảng đen của thầy). `bang` = ô bảng 0..1. */
export const laNetBang = (id: string): boolean => id.charCodeAt(0) === 98 && id.charCodeAt(1) === 95
export function vungBut(bang: readonly number[], x: number, net?: string | null): Vung {
  if (net && laNetBang(net)) return 'bang'
  return x >= bang[0]! && x <= bang[2]! ? 'bang' : 'giay'
}
/** Nét thuộc BẢNG: mã «b_…», hoặc nét mã thường BẮT ĐẦU trong ô bảng đen (bản ghi / máy thầy trước khi có mã «b_») — cùng luật với lớp vẽ (ve-bang.ts). */
export function netOBang(bang: readonly number[], n: { id: string; diem: readonly (readonly number[])[] }): boolean {
  if (laNetBang(n.id)) return true
  const p = n.diem[0]
  return !!p && p[0]! >= bang[0]! && p[0]! <= bang[2]! && p[1]! >= bang[1]! && p[1]! <= bang[3]!
}

/** TỰ ƯU TIÊN THEO THẦY, có trễ: thầy hoạt động ở vùng KHÁC vùng đang ưu tiên ⇒ ghi mốc; trong `tre` ms thầy quay lại vùng đang ưu tiên ⇒ huỷ mốc
 *  (thầy nhấp qua lại không làm khung giật); hết `tre` ms ⇒ đổi ưu tiên. */
export function taoUuTien(dau: Vung = 'giay', tre: number = TRE_UU_TIEN_MS) {
  let uu: Vung = dau, ung: Vung | null = null, luc = 0
  return {
    /** Một khung hình: `vung` = vùng thầy đang viết / đang chạm bút (null = không làm gì). Trả vùng đang ưu tiên. */
    buoc(nay: number, vung: Vung | null): Vung {
      if (vung === uu) ung = null
      else if (vung && ung !== vung) { ung = vung; luc = nay }
      if (ung && nay - luc >= tre) { uu = ung; ung = null }
      return uu
    },
    /** Đặt thẳng (vào live lúc bảng đã có nét, em vừa bật lại tự ưu tiên). */
    dat(v: Vung): void { uu = v; ung = null },
    dang: (): Vung => uu,
  }
}

/** GIẤY TỰ TRÔI THEO BÚT: bút của thầy ở `y` (px trên tấm giấy) nằm ngoài phần đang thấy [cuon, cuon + cao] (chừa lề) ⇒ trôi tới cho bút nằm ở 45 %
 *  chiều cao khung. Em vừa tự cuộn trong `NHUONG_MS` ⇒ KHÔNG trôi, chỉ báo mũi tên (1 = thầy ở dưới, −1 = ở trên). */
export function troiGiay(v: { y: number; cuon: number; cao: number; tong: number; nay: number; lucCham: number }): { dich: number | null; mui: -1 | 0 | 1 } {
  const le = Math.min(44, v.cao * 0.14), tran = Math.max(0, v.tong - v.cao)
  const tren = v.y < v.cuon + le, duoi = v.y > v.cuon + v.cao - le
  if (!tren && !duoi) return { dich: null, mui: 0 }
  const dich = kep(v.y - v.cao * 0.45, 0, tran)
  if (Math.abs(dich - v.cuon) < 1) return { dich: null, mui: 0 } // hết chỗ cuộn (bút ở sát mép tấm giấy)
  if (v.nay - v.lucCham < NHUONG_MS) return { dich: null, mui: duoi ? 1 : -1 }
  return { dich, mui: 0 }
}
/** Một bước trôi êm (hằng số thời gian 160 ms); sát đích dưới nửa px thì tới luôn. */
export function buocTroi(cuon: number, dich: number, dt: number): number {
  const moi = cuon + (dich - cuon) * (1 - Math.exp(-Math.max(0, Math.min(64, dt)) / 160))
  return Math.abs(dich - moi) < 0.5 ? dich : moi
}

/** CHUYỂN KHUNG ÊM (chỉ `transform`): đã xếp theo bố cục MỚI, đặt lên mỗi khung phép `translate(dx) scale(r)` (gốc trên-trái của khung) để trông y như
 *  bố cục CŨ, rồi cho về «không» trong `NO_MS`. `net` = phép cho lớp «đang viết» (toạ độ hình) ứng với khung `vung` thầy đang viết. */
export function chuyenKhung(cu: BoCucDL, moi: BoCucDL): { giay: { dx: number; r: number }; bang: { dx: number; r: number }; net: (vung: Vung) => { dx: number; dy: number; r: number } } {
  const mot = (xCu: number, leCu: number, sCu: number, xMoi: number, leMoi: number, sMoi: number) => { const r = sCu / sMoi; return { dx: xCu + leCu - xMoi - r * leMoi, r } }
  const giay = mot(cu.giay.x, cu.tam.x, cu.sG, moi.giay.x, moi.tam.x, moi.sG), bang = mot(cu.bang.x, cu.oBang.x, cu.sB, moi.bang.x, moi.oBang.x, moi.sB)
  return {
    giay, bang,
    // điểm P của hình (bố cục mới) hiện ở a + r·P: a = góc cũ − r·góc mới
    net: (vung) => { const k = vung === 'giay' ? giay : bang, o = vung === 'giay' ? moi.giay : moi.bang; return { dx: o.x + k.dx - k.r * o.x, dy: o.y * (1 - k.r), r: k.r } },
  }
}

/** Đọc / ghi vạch chia em tự kéo (bọc try/catch: máy chặn lưu). null = máy tự chia theo thầy. */
export function docChia(kho: Pick<Storage, 'getItem'> | null | undefined): number | null {
  try { const v = Number(kho?.getItem(KHOA_CHIA)); return v >= 0.2 && v <= 0.9 ? v : null } catch { return null }
}
export function ghiChia(kho: Pick<Storage, 'setItem' | 'removeItem'> | null | undefined, chia: number | null): void {
  try { if (chia == null) kho?.removeItem(KHOA_CHIA); else kho?.setItem(KHOA_CHIA, chia.toFixed(3)) } catch { /* chặn lưu ⇒ chỉ nhớ trong buổi */ }
}
