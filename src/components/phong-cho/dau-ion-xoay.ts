// XOAY SÂN KHI VẼ «Đấu Nguyên Tử» 3 đấu 3 (bản vẽ 01/11, docs/ban-ve-dau-ion-3v3-0111/DAC-TA.md mục 2): lõi và phòng đấu chỉ có MỘT sân
// 1040 × 520 (Bazơ đầu trái, Axit đầu phải). Máy em đổi toạ độ TRƯỚC khi vẽ để:
//  · điện thoại / máy tính NGANG: phe em luôn ở BÊN TRÁI (em phe Axit ⇒ xoay 180°);
//  · điện thoại DỌC: sân xoay 90° cho dài theo chiều cao, phe em luôn ở DƯỚI.
// Bốn phép đều là PHÉP QUAY (không lật gương) nên chữ, nguyên tử, nòng súng không bị ngược. Hướng kéo / điểm chạm của em đổi ngược lại trước khi gửi.
import { SAN_H, SAN_W, VAT_CAN, type SuKien, type VatCan } from '../../lib/dau-ion/loi'
import type { Canh } from './dau-ion-ve'

export interface Xoay {
  /** Điện thoại dọc: sân dựng đứng (520 × 1040). */
  doc: boolean
  /** Em phe Axit (căn cứ đầu phải) ⇒ xoay thêm 180°. */
  lat: boolean
}
export const KHONG_XOAY: Xoay = { doc: false, lat: false }
/** Cỡ sân khi vẽ (đơn vị sân). */
export const coSan = (k: Xoay): { w: number; h: number } => (k.doc ? { w: SAN_H, h: SAN_W } : { w: SAN_W, h: SAN_H })

/** Điểm sân ⇒ điểm vẽ. */
export function ra(x: number, y: number, k: Xoay): [number, number] {
  if (k.lat) { x = SAN_W - x; y = SAN_H - y }
  return k.doc ? [y, SAN_W - x] : [x, y]
}
/** Góc sân ⇒ góc vẽ. */
export const gocRa = (a: number, k: Xoay): number => a + (k.lat ? Math.PI : 0) - (k.doc ? Math.PI / 2 : 0)
/** Hướng (vận tốc) sân ⇒ hướng vẽ. */
export function huongRa(dx: number, dy: number, k: Xoay): [number, number] {
  if (k.lat) { dx = -dx; dy = -dy }
  return k.doc ? [dy, -dx] : [dx, dy]
}
/** Hướng em kéo trên màn ⇒ hướng đi trên sân (gửi phòng). */
export function huongVao(dx: number, dy: number, k: Xoay): [number, number] {
  if (k.doc) [dx, dy] = [-dy, dx]
  return k.lat ? [-dx, -dy] : [dx, dy]
}
/** Điểm vẽ ⇒ điểm sân (chạm một điểm để đi tới). */
export function diemVao(X: number, Y: number, k: Xoay): [number, number] {
  let x = X, y = Y
  if (k.doc) { x = SAN_W - Y; y = X }
  return k.lat ? [SAN_W - x, SAN_H - y] : [x, y]
}

/** Vật che theo khung vẽ (hình chữ nhật xoay 90° đổi rộng ↔ cao). `cuaEm`: giá ống chắn căn cứ của phe em. */
export type VatVe = VatCan & { cuaEm?: boolean }
export function vatRa(k: Xoay, pheEm: number): VatVe[] {
  return VAT_CAN.map((v) => {
    const cuaEm = v.k === 'cn' && v.phe !== undefined ? v.phe === pheEm : undefined
    if (v.k === 'tron') { const [x, y] = ra(v.x, v.y, k); return { ...v, x, y, cuaEm } }
    const [ax, ay] = ra(v.x, v.y, k), [bx, by] = ra(v.x + v.w, v.y + v.h, k)
    return { ...v, x: Math.min(ax, bx), y: Math.min(ay, by), w: Math.abs(bx - ax), h: Math.abs(by - ay), cuaEm }
  })
}

/** Cảnh sân ⇒ cảnh vẽ (bản sao; không đổi cảnh gốc của bộ chạy). */
export function xoayCanh(c: Canh, k: Xoay): Canh {
  if (!k.doc && !k.lat) return c
  return {
    t: c.t,
    ghe: c.ghe.map((g) => { const [x, y] = ra(g.x, g.y, k); return { ...g, x, y, ngam: gocRa(g.ngam, k) } }),
    dan: c.dan.map((d) => { const [x, y] = ra(d.x, d.y, k), [vx, vy] = huongRa(d.vx, d.vy, k); return { ...d, x, y, vx, vy } }),
    vp: c.vp.map((v) => { const [x, y] = ra(v.x, v.y, k); return { ...v, x, y } }),
  }
}
/** Sự kiện sân ⇒ sự kiện vẽ (chỉ đổi toạ độ / góc). */
export function xoaySu(s: SuKien, k: Xoay): SuKien {
  if ((!k.doc && !k.lat) || !('x' in s)) return s
  const [x, y] = ra(s.x, s.y, k)
  return s.t === 'ban' ? { ...s, x, y, ngam: gocRa(s.ngam, k) } : { ...s, x, y }
}
