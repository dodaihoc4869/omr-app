// CỘNG EXP + MẢNH KHIÊN VÀO HỒ SƠ GAME — HÀM THUẦN (DE-XUAT-EXP-MANH-KHIEN-1909.md mục 4 và "Thiết kế máy chủ").
//
// Hồ sơ giữ TỔNG LUỸ KẾ đã cộng (`expMoi.daCong`, `expMoi.manhDaTinh`), mỗi lần chỉ cộng phần chênh `tổng sổ − đã cộng`. Nơi gọi (`exp-d1.ts`) ghi hồ sơ
// bằng CAS theo `revision`, nên gọi lại bao nhiêu lần, hai lượt nộp chạy chồng nhau, hay em chưa có hồ sơ lúc khoản phát sinh, đều không cộng trùng
// và không sót. EXP học tập vào ỐNG NGHIỆM (`wallet`) — thần thú chỉ lên cấp qua cổng hấp thụ `invest` (Đợt 1 thần thú mỗi ngày, 21/09).
//
// Khiên: `shieldRemaining` cũ (`shields.ts`, KHÔNG sửa) = quà tiến hoá − đã dùng. Khiên RÈN cộng thêm: còn lại = quà + đã rèn − đã dùng.
// Quy ước dùng: khiên quà tiến hoá dùng TRƯỚC, khiên rèn sau — nên "khiên rèn chưa dùng" = min(đã rèn, còn lại). Đó là con số chạm trần
// `KHIEN_REN_TOI_DA` (5) để ngừng rèn thêm.
import { EXP_DU_TRU, EXP_REN_KHIEN, MANH_REN_KHIEN, KHIEN_REN_GIU_TOI_DA } from '../../src/lib/kinh-te-game'
import { shieldEntitlement } from '../../src/game/than-thu-v2/shields'
import { congManh, type KhienRen } from './exp-hoc-tap'
import { CAP_KHIEN_QUA_DAU, NGAY_DAT_MO_KHIEN_QUA } from './exp-cau-hinh'

export interface HoSoGameExp {
  cap: number
  luatCap?: number
  exp: number
  /** Ống nghiệm: EXP đã kiếm, chưa nạp vào thần thú. */
  wallet?: number
  earned: number
  shields?: { used: number }
  /** Tổng luỹ kế ĐÃ CỘNG vào hồ sơ này (từ sổ `exp_so`/`manh_khien_so`). Thiếu = 0. `ngayDat` = số NGÀY ĐẠT nhiệm vụ ngày tính từ mốc `khien_moc` (mở khiên quà đầu, phương án B). */
  expMoi?: { daCong: number; manhDaTinh: number; ngayDat?: number }
  khienRen?: KhienRen
}

/**
 * Khiên QUÀ TIẾN HOÁ em đang được hưởng (thầy chọn phương án B, 21/09): công thức cũ `shieldEntitlement(cấp)` NHƯNG khiên quà ĐẦU TIÊN (mốc cấp 10) chỉ mở khi em có ≥ `NGAY_DAT_MO_KHIEN_QUA`
 * ngày đạt nhiệm vụ ngày tính từ `khien_moc` (`expMoi.ngayDat`, thiếu = 0). Các mốc tiến hoá và ảnh thú KHÔNG đổi. Máy chủ là nguồn DUY NHẤT của "khiên còn lại".
 */
export const khienQuaTienHoa = (p: Pick<HoSoGameExp, 'cap' | 'expMoi'>): number =>
  shieldEntitlement(p.cap) - (p.cap >= CAP_KHIEN_QUA_DAU && (p.expMoi?.ngayDat ?? 0) < NGAY_DAT_MO_KHIEN_QUA ? 1 : 0)

/** Khiên còn dùng được = quà tiến hoá (đã khoá theo ngày đạt) + đã rèn − đã dùng (không âm). */
export const khienConLai = (p: Pick<HoSoGameExp, 'cap' | 'shields' | 'khienRen' | 'expMoi'>): number =>
  Math.max(0, khienQuaTienHoa(p) + Math.max(0, p.khienRen?.daRen ?? 0) - Math.max(0, p.shields?.used ?? 0))

/** Khiên rèn chưa dùng (quà dùng trước). */
export const khienRenChuaDung = (p: Pick<HoSoGameExp, 'cap' | 'shields' | 'khienRen' | 'expMoi'>): number =>
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
export function congTongSoVaoHoSo(p: HoSoGameExp, tongExp: number, tongManh: number, ngayDat?: number): DaCong {
  const daCong = Math.max(0, p.expMoi?.daCong ?? 0)
  const manhDaTinh = Math.max(0, p.expMoi?.manhDaTinh ?? 0)
  const them = Math.max(0, Math.floor(tongExp) - daCong)
  const themManh = Math.max(0, Math.floor(tongManh) - manhDaTinh)
  if (them > 0) {
    // Đợt 1 thần thú mỗi ngày: EXP học tập vào ỐNG NGHIỆM (`wallet`); thần thú hấp thụ qua cổng `invest` (200/120/0 mỗi ngày). Không còn nạp thẳng vào cấp.
    p.wallet = Math.max(0, p.wallet ?? 0) + them
    p.earned = Math.max(0, p.earned) + them
  }
  let khienMoi = 0
  if (themManh > 0) {
    const truoc = p.khienRen ?? { manh: 0, daRen: 0 }
    const sau = (p.luatCap ?? 0) >= 3 ? { ...truoc, manh: truoc.manh + themManh } : congManh(truoc, themManh, khienRenChuaDung(p))
    khienMoi = sau.daRen - truoc.daRen
    p.khienRen = sau
  }
  p.expMoi = { daCong: Math.max(daCong, Math.floor(tongExp)), manhDaTinh: Math.max(manhDaTinh, Math.floor(tongManh)), ...(ngayDat === undefined ? (p.expMoi?.ngayDat === undefined ? {} : { ngayDat: p.expMoi.ngayDat }) : { ngayDat: Math.max(0, Math.floor(ngayDat)) }) }
  return { exp: them, manh: themManh, khienMoi }
}

/** Rèn theo số lần đã rèn để request cũ không trừ EXP thêm lần nữa. */
export function renKhienBangExp(p: HoSoGameExp, soDaRen: number): boolean {
  const cu = p.khienRen ?? { manh: 0, daRen: 0 }
  if (!Number.isInteger(soDaRen) || soDaRen < 0 || soDaRen > cu.daRen) throw new Error('Em tải lại Túi đồ trước khi rèn.')
  if (soDaRen < cu.daRen) return false
  if ((p.luatCap ?? 0) < 3) throw new Error('Hồ sơ đang cập nhật. Em thử lại sau.')
  if ((p.expMoi?.ngayDat ?? 0) < MANH_REN_KHIEN || cu.manh < MANH_REN_KHIEN) throw new Error(`Em cần ${MANH_REN_KHIEN} ngày đạt nhiệm vụ và ${MANH_REN_KHIEN} mảnh để rèn khiên.`)
  if (khienRenChuaDung(p) >= KHIEN_REN_GIU_TOI_DA) throw new Error('Túi đã đủ khiên rèn. Em giữ mảnh cho lần sau.')
  if ((p.wallet ?? 0) < EXP_REN_KHIEN + EXP_DU_TRU) throw new Error(`Rèn cần ${EXP_REN_KHIEN} EXP, giữ lại ${EXP_DU_TRU} EXP để thần thú ăn.`)
  p.wallet = (p.wallet ?? 0) - EXP_REN_KHIEN
  p.khienRen = { manh: cu.manh - MANH_REN_KHIEN, daRen: cu.daRen + 1 }
  return true
}
