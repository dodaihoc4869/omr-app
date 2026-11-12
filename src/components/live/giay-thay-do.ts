// LIVE BẢNG — GIẤY SOI, PHẦN ĐO (không phải component): chỉ số trong một khối bố cục, so số đo máy em với số đo của thầy, bố cục soi được không.
// Tách khỏi GiayThay.tsx (12/11, luật lint only-export-components: tệp component chỉ xuất component). Nạp lười cùng LopLive. Chú giải: đầu GiayThay.tsx.
import type { GiayThay as BoCucGiay } from '../../lib/bpu/phong-live'

/** Chỉ số trong một khối của bố cục (xem `GiayThay` ở phong-live.ts). */
export const LOAI = 0, TT = 1, X = 2, Y = 3, W = 4, H = 5, CO = 6, DONG = 7, DAM = 8, HET_X = 9, HET_Y = 10

/** So số đo của máy em với của thầy cho MỘT khối chữ: chiều cao lệch dưới 0,4 dòng, chỗ hết chữ lệch ngang dưới 1,2 % bề rộng (ít nhất 3 px), dọc dưới 0,3 dòng. */
export function khoiKhop(thay: readonly number[], em: { cao: number; hetX: number; hetY: number }): boolean {
  const dong = Math.max(8, thay[DONG]! / 10)
  return Math.abs(em.cao - thay[H]!) <= dong * 0.4 && Math.abs(em.hetX - thay[HET_X]!) <= Math.max(3, thay[W]! * 0.012) && Math.abs(em.hetY - thay[HET_Y]!) <= dong * 0.3
}
/** Bố cục này máy em soi được không: đúng trang đang chiếu, không có khối lạ, có khối đề. */
export function soiDuoc(g: BoCucGiay | null | undefined, khoaTrang: string): g is BoCucGiay {
  return !!g && !g.la && g.k === khoaTrang && g.o.some((b) => b[LOAI] === 2)
}
