// CỘNG EXP + MẢNH KHIÊN VÀO HỒ SƠ GAME — HÀM THUẦN (DE-XUAT-EXP-MANH-KHIEN-1909.md mục 4 và "Thiết kế máy chủ").
//
// Hồ sơ giữ TỔNG LUỸ KẾ đã cộng (`expMoi.daCong`, `expMoi.manhDaTinh`), mỗi lần chỉ cộng phần chênh `tổng sổ − đã cộng`. Nơi gọi (`exp-d1.ts`) ghi hồ sơ
// bằng CAS theo `revision`, nên gọi lại bao nhiêu lần, hai lượt nộp chạy chồng nhau, hay em chưa có hồ sơ lúc khoản phát sinh, đều không cộng trùng
// và không sót. LUẬT v4 (thầy chốt 29/09, docs/DE-XUAT-EXP-2909.md): EXP vào THẲNG thần thú qua `nhanTuDo` (nạp tự do + khoá mốc cấp 10 cần 21 ngày đạt);
// hồ sơ v3 được chuyển MỘT lần (`chuyenV3SangV4`) ngay trước lần cộng đầu tiên. Hồ sơ cũ hơn v3 (chưa chuyển) vẫn vào ống nghiệm như cũ, lần mở sau chuyển nốt.
//
// Khiên: `shieldRemaining` cũ (`shields.ts`, KHÔNG sửa) = quà tiến hoá − đã dùng. Khiên RÈN cộng thêm: còn lại = quà + đã rèn − đã dùng.
// Quy ước dùng: khiên quà tiến hoá dùng TRƯỚC, khiên rèn sau — nên "khiên rèn chưa dùng" = min(đã rèn, còn lại). Đó là con số chạm trần
// `KHIEN_REN_TOI_DA` (5) để ngừng rèn thêm.
import { MANH_REN_KHIEN, KHIEN_REN_GIU_TOI_DA, VANG_REN_KHIEN } from '../../src/lib/kinh-te-game'
import { LUAT_CAP_MOI, LUAT_CAP_V3, chuyenV3SangV4, nhanTuDo, type HoSoV3, type TruocSiet4 } from '../../src/lib/hap-thu-ngay'
import { shieldEntitlement } from '../../src/game/than-thu-v2/shields'
import { congManh, type KhienRen } from './exp-hoc-tap'
import { CAP_KHIEN_QUA_DAU, NGAY_DAT_MO_KHIEN_QUA } from './exp-cau-hinh'

export interface HoSoGameExp {
  cap: number
  luatCap?: number
  exp: number
  /** Ống nghiệm (LỊCH SỬ v3): EXP đã kiếm, chưa nạp. Hồ sơ v4 luôn 0. */
  wallet?: number
  earned: number
  /** v4: EXP chờ mốc (thú chưa được lên cấp 10 vì chưa đủ 21 ngày đạt). */
  choMoc?: number
  /** v4: `earned` lúc chuyển sang v4 — vàng chỉ đúc trên phần EXP kiếm SAU mốc này. */
  mocVang?: number
  truocSiet4?: TruocSiet4
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
  /** v4: ảnh chụp thần thú SAU lần cộng (cho hiệu ứng "+N EXP", thanh nhích, lên cấp). Vắng với hồ sơ chưa sang v4. */
  thu?: AnhThu
}

/** Thần thú sau một lần nhận EXP: cấp, EXP trong thanh, số cấp vừa lên, EXP đang chờ mốc. */
export interface AnhThu { cap: number; exp: number; soCapLen: number; choMoc: number }

/**
 * CỘNG `them` EXP vào hồ sơ (sửa `p` tại chỗ) theo luật đang áp cho hồ sơ: v3 ⇒ chuyển sang v4 trước; v4 ⇒ vào thẳng thú (`nhanTuDo`, khoá mốc theo
 * `expMoi.ngayDat`); hồ sơ cũ hơn v3 ⇒ vào ống nghiệm như cũ. `earned` luôn tăng đúng `them`. Gọi với `them = 0` để mở phần chờ mốc khi em vừa đủ ngày đạt.
 */
export function congExpVaoHoSo(p: HoSoGameExp, them: number, nowIso: string = new Date().toISOString()): AnhThu | null {
  const n = Math.max(0, Math.floor(them))
  if (p.luatCap === LUAT_CAP_V3) {
    const doi = chuyenV3SangV4(p as unknown as HoSoV3, p.expMoi?.ngayDat ?? 0, nowIso)
    Object.assign(p, doi.hoSo)
    delete (p as { hapThu?: unknown }).hapThu
  }
  p.earned = Math.max(0, p.earned ?? 0) + n
  if (p.luatCap !== LUAT_CAP_MOI) {
    if (n > 0) p.wallet = Math.max(0, p.wallet ?? 0) + n
    return null
  }
  const r = nhanTuDo({ cap: p.cap, exp: p.exp, wallet: 0, choMoc: p.choMoc }, n, p.expMoi?.ngayDat ?? 0)
  p.cap = r.hoSo.cap
  p.exp = r.hoSo.exp
  p.choMoc = r.hoSo.choMoc ?? 0
  return { cap: p.cap, exp: p.exp, soCapLen: r.soCapLen, choMoc: p.choMoc }
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
  // Số ngày đạt cập nhật TRƯỚC khi cộng EXP: hôm nay em vừa đạt ngày thứ 21 thì phần chờ mốc mở ngay trong CÙNG lần cộng.
  if (ngayDat !== undefined) p.expMoi = { daCong, manhDaTinh, ngayDat: Math.max(0, Math.floor(ngayDat)) }
  // Luật v4: EXP vào THẲNG thần thú (hồ sơ v3 được chuyển trước); cả khi `them = 0` vẫn gọi để mở phần chờ mốc lúc em vừa đủ ngày đạt.
  const thu = them > 0 || (p.choMoc ?? 0) > 0 || p.luatCap === LUAT_CAP_V3 ? congExpVaoHoSo(p, them) : null
  let khienMoi = 0
  if (themManh > 0) {
    const truoc = p.khienRen ?? { manh: 0, daRen: 0 }
    const sau = (p.luatCap ?? 0) >= 3 ? { ...truoc, manh: truoc.manh + themManh } : congManh(truoc, themManh, khienRenChuaDung(p))
    khienMoi = sau.daRen - truoc.daRen
    p.khienRen = sau
  }
  p.expMoi = { daCong: Math.max(daCong, Math.floor(tongExp)), manhDaTinh: Math.max(manhDaTinh, Math.floor(tongManh)), ...(p.expMoi?.ngayDat === undefined ? {} : { ngayDat: p.expMoi.ngayDat }) }
  return { exp: them, manh: themManh, khienMoi, ...(thu ? { thu } : {}) }
}

/**
 * RÈN KHIÊN (luật v4): 21 mảnh + 21 ngày đạt + `VANG_REN_KHIEN` (1 400) vàng; KHÔNG cần cấp 10; giữ tối đa 5 khiên rèn chưa dùng.
 * Rèn theo số lần đã rèn (`soDaRen`) để yêu cầu cũ gửi lại không rèn/trừ vàng thêm lần nữa: `soDaRen < daRen` ⇒ false (đã rèn rồi).
 * `vang` = số vàng hiện có (sổ `vang_so`); hàm chỉ KIỂM và sửa `p` (mảnh, số đã rèn) — nơi gọi ghi dòng trừ vàng CÙNG lô với hồ sơ.
 */
export function renKhienBangVang(p: HoSoGameExp, soDaRen: number, vang: number): boolean {
  const cu = p.khienRen ?? { manh: 0, daRen: 0 }
  if (!Number.isInteger(soDaRen) || soDaRen < 0 || soDaRen > cu.daRen) throw new Error('Em tải lại Túi đồ trước khi rèn.')
  if (soDaRen < cu.daRen) return false
  if ((p.luatCap ?? 0) < 3) throw new Error('Hồ sơ đang cập nhật. Em thử lại sau.')
  if ((p.expMoi?.ngayDat ?? 0) < MANH_REN_KHIEN || cu.manh < MANH_REN_KHIEN) throw new Error(`Em cần ${MANH_REN_KHIEN} ngày đạt nhiệm vụ và ${MANH_REN_KHIEN} mảnh để rèn khiên.`)
  if (khienRenChuaDung(p) >= KHIEN_REN_GIU_TOI_DA) throw new Error('Túi đã đủ khiên rèn. Em giữ mảnh cho lần sau.')
  if (!(vang >= VANG_REN_KHIEN)) throw new Error(`Rèn một khiên cần ${VANG_REN_KHIEN.toLocaleString('vi-VN')} vàng. Em đang có ${Math.max(0, Math.floor(vang)).toLocaleString('vi-VN')} vàng.`)
  p.khienRen = { manh: cu.manh - MANH_REN_KHIEN, daRen: cu.daRen + 1 }
  return true
}
