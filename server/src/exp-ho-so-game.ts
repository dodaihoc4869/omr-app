// CỘNG EXP + MẢNH KHIÊN VÀO HỒ SƠ GAME — HÀM THUẦN (DE-XUAT-EXP-MANH-KHIEN-1909.md mục 4 và "Thiết kế máy chủ").
//
// Hồ sơ giữ TỔNG LUỸ KẾ đã cộng (`expMoi.daCong`, `expMoi.manhDaTinh`), mỗi lần chỉ cộng phần chênh `tổng sổ − đã cộng`. Nơi gọi (`exp-d1.ts`) ghi hồ sơ
// bằng CAS theo `revision`, nên gọi lại bao nhiêu lần, hai lượt nộp chạy chồng nhau, hay em chưa có hồ sơ lúc khoản phát sinh, đều không cộng trùng
// và không sót. EXP học tập nạp thẳng vào cấp bằng đúng `nhanExp` như luật cũ (KHÔNG đổi cơ chế hai bể ví/cấp của game).
//
// Khiên: `shieldRemaining` cũ (`shields.ts`, KHÔNG sửa) = quà tiến hoá − đã dùng. Khiên RÈN cộng thêm: còn lại = quà + đã rèn − đã dùng.
// Quy ước dùng: khiên quà tiến hoá dùng TRƯỚC, khiên rèn sau — nên "khiên rèn chưa dùng" = min(đã rèn, còn lại). Đó là con số chạm trần
// `KHIEN_REN_TOI_DA` (5) để ngừng rèn thêm.
import { nhanExp } from '../../src/game/than-thu-hoa-hoc/kinh-nghiem'
import { shieldEntitlement } from '../../src/game/than-thu-v2/shields'
import { congManh, type KhienRen } from './exp-hoc-tap'

export interface HoSoGameExp {
  cap: number
  exp: number
  earned: number
  shields?: { used: number }
  /** Tổng luỹ kế ĐÃ CỘNG vào hồ sơ này (từ sổ `exp_so`/`manh_khien_so`). Thiếu = 0. */
  expMoi?: { daCong: number; manhDaTinh: number }
  khienRen?: KhienRen
}

/** Khiên còn dùng được = quà tiến hoá + đã rèn − đã dùng (không âm). */
export const khienConLai = (p: Pick<HoSoGameExp, 'cap' | 'shields' | 'khienRen'>): number =>
  Math.max(0, shieldEntitlement(p.cap) + Math.max(0, p.khienRen?.daRen ?? 0) - Math.max(0, p.shields?.used ?? 0))

/** Khiên rèn chưa dùng (quà dùng trước). */
export const khienRenChuaDung = (p: Pick<HoSoGameExp, 'cap' | 'shields' | 'khienRen'>): number =>
  Math.min(Math.max(0, p.khienRen?.daRen ?? 0), khienConLai(p))

export interface DaCong {
  exp: number
  manh: number
  khienMoi: number
}

/**
 * Cộng phần chênh giữa TỔNG SỔ và tổng đã cộng vào hồ sơ (sửa `p` tại chỗ). `tongExp`/`tongManh` là SUM của sổ (không bao giờ giảm).
 * Trả phần vừa cộng; hồ sơ đã bắt kịp sổ thì không đổi gì.
 */
export function congTongSoVaoHoSo(p: HoSoGameExp, tongExp: number, tongManh: number): DaCong {
  const daCong = Math.max(0, p.expMoi?.daCong ?? 0)
  const manhDaTinh = Math.max(0, p.expMoi?.manhDaTinh ?? 0)
  const them = Math.max(0, Math.floor(tongExp) - daCong)
  const themManh = Math.max(0, Math.floor(tongManh) - manhDaTinh)
  if (them > 0) {
    const sau = nhanExp({ capDo: p.cap, exp: p.exp }, them)
    p.cap = sau.capDo
    p.exp = sau.exp
    p.earned = Math.max(0, p.earned) + them
  }
  let khienMoi = 0
  if (themManh > 0) {
    const truoc = p.khienRen ?? { manh: 0, daRen: 0 }
    const sau = congManh(truoc, themManh, khienRenChuaDung(p))
    khienMoi = sau.daRen - truoc.daRen
    p.khienRen = sau
  }
  p.expMoi = { daCong: Math.max(daCong, Math.floor(tongExp)), manhDaTinh: Math.max(manhDaTinh, Math.floor(tongManh)) }
  return { exp: them, manh: themManh, khienMoi }
}
