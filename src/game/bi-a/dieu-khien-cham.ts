// BI-A · ĐIỀU KHIỂN CHẠM (thầy duyệt 30/09, bản vẽ thử "Bàn Bi-a mới"): hàm THUẦN — không DOM, không React; màn chơi gọi, test gọi thẳng.
// Ba thao tác: (1) kéo ở BẤT KỲ đâu trên bàn = xoay gậy đúng bằng góc ngón quét quanh bi cái (tương đối 1 : 1, "Chậm" = × 0,5);
// (2) bánh xe tinh chỉnh (1 px = 0,05°, chạm nhanh 1/5 đầu dải = ± 0,1°); (3) thanh lực dọc có vùng "Huỷ" 8 % ở đầu và vạch vàng "đủ tới bi".
// Chống rung khi nhấc ngón: bỏ dịch chuyển < 3 px (vùng chết), lúc nhấc lấy góc tại thời điểm ≥ 80 ms trước đó. Không đổi vật lý/luật/giao thức.
import { nhamInfo } from './du-doan'
import { chuanGoc, gocToi, type Diem } from './gay'
import { A_LAN, A_TRUOT, R, VMAX, type Ban } from './vat-ly'

// ───────────── thanh lực ─────────────
/** Vùng "Huỷ" ở đầu thanh: thả tay khi còn trong vùng này ⇒ KHÔNG đánh, góc giữ nguyên. */
export const LUC_HUY = 0.08
/**
 * Vị trí trên thanh `p` (0 = đầu thanh, 1 = cuối) ⇒ lực THẬT đưa vào vật lý (0–1): (p − 0,08) / 0,92, kẹp [0, 1] — giữ nguyên dải lực vật lý.
 * Trong vùng Huỷ ⇒ 0 (không đánh). Ngoài vùng Huỷ tối thiểu 0,02 (lực nhỏ nhất `VanBia.ban` nhận) để "ra khỏi Huỷ là đánh", không có khe chết.
 */
export function lucThat(p: number): number {
  if (!(p >= LUC_HUY)) return 0
  return Math.max(0.02, Math.min(1, (p - LUC_HUY) / (1 - LUC_HUY)))
}
/** Ngược của `lucThat`: lực thật ⇒ vị trí trên thanh (vẽ vạch vàng). */
export const viTriTrenThanh = (luc: number): number => LUC_HUY + (1 - LUC_HUY) * Math.max(0, Math.min(1, luc))

// ───────────── vạch "đủ tới bi" ─────────────
/** Tốc độ (đv/s) bi cái coi là đã dừng khi đang lăn — đúng ngưỡng trong `step` (vat-ly.ts). */
const V_DUNG = 2
/** Đệm quãng đường (đv bàn): bi cái phải VƯỢT điểm bi ma một chút mới chạm (bước rời rạc 1/240 giây). */
const DEM_QUANG = 3
/**
 * Quãng bi cái KHÔNG xoáy đi được tới khi dừng với tốc độ đầu `v`: trượt (giảm tốc A_TRUOT) tới khi lăn thuần ở 5/7 v,
 * rồi lăn (giảm tốc A_LAN) tới V_DUNG. Giải tích từ hằng số vat-ly.ts (khớp mô phỏng bước — test đối chiếu lõi thật).
 */
export function quangDuongDung(v: number): number {
  const vl = v * 5 / 7
  return (v * v - vl * vl) / (2 * A_TRUOT) + Math.max(0, vl * vl - V_DUNG * V_DUNG) / (2 * A_LAN)
}
/** Lực thật (0–1) nhỏ nhất để bi cái không xoáy đi được quãng `L`. Không đạt được kể cả lực 1 ⇒ 1. */
export function lucChoQuangDuong(L: number): number {
  const k = (1 - 25 / 49) / (2 * A_TRUOT) + (25 / 49) / (2 * A_LAN)
  const v = Math.sqrt((Math.max(0, L) + V_DUNG * V_DUNG / (2 * A_LAN)) / k)
  const x = (v / VMAX - 0.05) / 0.95
  if (x <= 0) return 0.02
  return Math.max(0.02, Math.min(1, Math.pow(x, 1 / 1.2)))
}
/**
 * Vạch vàng "đủ tới bi đích": lực thật tối thiểu để bi cái (không xoáy) còn tốc độ tới điểm bi ma của bi đầu tiên trên đường ngắm.
 * Không có bi trên đường ngắm, hoặc bi đó không phải bi đích hợp lệ (`hopLe`) ⇒ null (ẩn vạch).
 */
export function vachDuToi(st: Ban, aim: Diem, hopLe: (id: string) => boolean): number | null {
  const info = nhamInfo(st, aim)
  if (!info || info.loai !== 'bi' || !hopLe(info.b.id)) return null
  return lucChoQuangDuong(Math.hypot(info.gx - info.c.x, info.gy - info.c.y) + DEM_QUANG)
}

// ───────────── bánh xe tinh chỉnh ─────────────
/** Kéo bánh xe 1 px CSS ⇒ xoay 0,05°. */
export const DO_MOI_PX = 0.05
/** Chạm nhanh vào 1/5 đầu mỗi bên dải ⇒ ± 0,1°. */
export const DO_CHAM_DAU = 0.1
export const PHAN_DAU = 0.2
/** Chạm nhanh ở vị trí `t` (0 = đầu trái/trên, 1 = đầu phải/dưới) ⇒ số độ xoay (âm = ngược chiều kim đồng hồ trên màn). Giữa dải ⇒ 0. */
export function doChamBanhXe(t: number): number {
  if (t <= PHAN_DAU) return -DO_CHAM_DAU
  if (t >= 1 - PHAN_DAU) return DO_CHAM_DAU
  return 0
}
/** Lăn chuột trên bàn (máy tính): một nấc = 0,1°, giữ Shift = 0,02°. `delta` theo nấc (dương = xuống). */
export const doLanChuot = (nac: number, shift: boolean): number => nac * (shift ? 0.02 : 0.1)

// ───────────── kéo trên bàn = xoay gậy ─────────────
export const CHAM_NHANH_MS = 200
export const CHAM_NHANH_PX = 6
export const KHOA_NHA_MS = 80
export const VUNG_CHET_PX = 3
export type DoNhay = 'thuong' | 'cham'
export const HE_NHAY: Readonly<Record<DoNhay, number>> = { thuong: 1, cham: 0.5 }
const SO_MAU = 16

/** Kết quả nhấc ngón. `chamNhanh`: chạm ≤ 200 ms và dịch ≤ 6 px (màn chơi xử lý như CHẠM — nhắm bi, giải trước); `goc` đã trả về góc lúc chạm. */
export interface KetQuaNha { goc: number; chamNhanh: boolean }

/**
 * Một lần kéo trên bàn. Toạ độ màn (`sx`, `sy`, px CSS) cho vùng chết và chạm nhanh; toạ độ bàn (`p`) + tâm bi cái (`c`) cho góc quét
 * (bàn nằm ngang chỉ là phép QUAY + co giãn đều ⇒ hiệu hai góc giữ nguyên). Góc gậy = góc hướng bắn (radian, atan2 của `aim`).
 * Không cấp phát khi kéo: bộ đệm mẫu là mảng số cố định.
 */
export class KeoXoay {
  dang = false
  private t0 = 0
  private x0 = 0
  private y0 = 0
  private xaNhat = 0
  private gocDau = 0
  private sx = 0
  private sy = 0
  private bx = 0
  private by = 0
  /** Có điểm neo hợp lệ (ngón ngoài vòng 2R quanh bi cái). */
  private coNeo = false
  private readonly mt = new Float64Array(SO_MAU)
  private readonly mg = new Float64Array(SO_MAU)
  private n = 0
  private dau = 0

  bat(t: number, sx: number, sy: number, p: Diem, c: Diem, goc: number): void {
    this.dang = true; this.t0 = t; this.x0 = sx; this.y0 = sy; this.xaNhat = 0; this.gocDau = goc
    this.sx = sx; this.sy = sy; this.n = 0; this.dau = 0
    this.coNeo = Math.hypot(p.x - c.x, p.y - c.y) >= 2 * R
    this.bx = p.x; this.by = p.y
    this.ghiMau(t, goc)
  }
  /** Ngón tới (sx, sy) / p lúc `t`. Trả góc mới, hoặc null nếu không đổi (vùng chết, ngón sát bi cái, vừa đặt lại neo). */
  keo(t: number, sx: number, sy: number, p: Diem, c: Diem, goc: number, he: number): number | null {
    if (!this.dang) return null
    const d0 = Math.hypot(sx - this.x0, sy - this.y0)
    if (d0 > this.xaNhat) this.xaNhat = d0
    if (Math.hypot(sx - this.sx, sy - this.sy) < VUNG_CHET_PX) return null
    this.sx = sx; this.sy = sy
    if (Math.hypot(p.x - c.x, p.y - c.y) < 2 * R) { this.coNeo = false; return null } // sát bi cái: góc không ổn định ⇒ bỏ, bỏ neo
    if (!this.coNeo) { this.coNeo = true; this.bx = p.x; this.by = p.y; return null } // vừa ra khỏi vòng 2R: neo lại, không nhảy
    const da = chuanGoc(gocToi(c, p) - Math.atan2(this.by - c.y, this.bx - c.x)) * he
    this.bx = p.x; this.by = p.y
    const moi = chuanGoc(goc + da)
    this.ghiMau(t, moi)
    return moi
  }
  /** Nhấc ngón lúc `t`: góc khoá = góc của mẫu mới nhất có thời điểm ≤ t − 80 ms (không có ⇒ góc lúc chạm). */
  nha(t: number): KetQuaNha {
    this.dang = false
    if (t - this.t0 <= CHAM_NHANH_MS && this.xaNhat <= CHAM_NHANH_PX) return { goc: this.gocDau, chamNhanh: true }
    let goc = this.gocDau, tim = false
    for (let k = 0; k < this.n; k++) {
      const i = (this.dau + k) % SO_MAU
      if (this.mt[i]! <= t - KHOA_NHA_MS) { goc = this.mg[i]!; tim = true }
    }
    if (!tim && this.n === SO_MAU) goc = this.mg[this.dau]! // bộ đệm đầy mà mẫu nào cũng trong 80 ms: lấy mẫu cũ nhất
    return { goc, chamNhanh: false }
  }
  /** Đang giữ ngón quá 200 ms hoặc đã dịch quá 6 px ⇒ chắc chắn không còn là chạm nhanh. */
  daKeo(t: number): boolean { return t - this.t0 > CHAM_NHANH_MS || this.xaNhat > CHAM_NHANH_PX }
  private ghiMau(t: number, goc: number): void {
    const i = (this.dau + this.n) % SO_MAU
    this.mt[i] = t; this.mg[i] = goc
    if (this.n < SO_MAU) this.n++
    else this.dau = (this.dau + 1) % SO_MAU
  }
}

/** Hướng bắn (vector đơn vị) ⇄ góc. */
export const gocCua = (aim: Diem): number => Math.atan2(aim.y, aim.x)
