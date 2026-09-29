// CỘNG EXP + MẢNH KHIÊN VÀO HỒ SƠ GAME — HÀM THUẦN (DE-XUAT-EXP-MANH-KHIEN-1909.md mục 4 và "Thiết kế máy chủ").
//
// Hồ sơ giữ TỔNG LUỸ KẾ đã cộng (`expMoi.daCong`, `expMoi.manhDaTinh`), mỗi lần chỉ cộng phần chênh `tổng sổ − đã cộng`. Nơi gọi (`exp-d1.ts`) ghi hồ sơ
// bằng CAS theo `revision`, nên gọi lại bao nhiêu lần, hai lượt nộp chạy chồng nhau, hay em chưa có hồ sơ lúc khoản phát sinh, đều không cộng trùng
// và không sót. LUẬT v4 (thầy chốt 29/09, docs/DE-XUAT-EXP-2909.md): EXP vào THẲNG thần thú qua `nhanTuDo` (nạp tự do + khoá mốc cấp 10 cần 21 ngày đạt);
// hồ sơ v3 được chuyển MỘT lần (`chuyenV3SangV4`) ngay trước lần cộng đầu tiên. Hồ sơ cũ hơn v3 (chưa chuyển) vẫn vào ống nghiệm như cũ, lần mở sau chuyển nốt.
// LUẬT v5 (THẦY ĐÃ CHỐT 29/09 chiều, docs/DE-XUAT-EXP-V5-2909.md): EXP vào thú qua `nhanV5` — sức chứa theo số ngày đạt (cộng ngày nghỉ chung thầy đặt); phần vượt là EXP TRÀN,
// đổi vàng tràn (luỹ kế `tranV5.tongVang`, đúc lười ở vang-duc.ts) + mảnh tràn (cộng thẳng vào `khienRen.manh`, cùng lần ghi CAS của hồ sơ ⇒ không cộng đôi).
// Hồ sơ v3/v4 được chuyển MỘT lần (`chuyenV3SangV4` → `chuyenV4SangV5`) ngay trước lần cộng đầu tiên.
//
// Khiên: `shieldRemaining` cũ (`shields.ts`, KHÔNG sửa) = quà tiến hoá − đã dùng. Khiên RÈN cộng thêm: còn lại = quà + đã rèn − đã dùng.
// Quy ước dùng: khiên quà tiến hoá dùng TRƯỚC, khiên rèn sau — nên "khiên rèn chưa dùng" = min(đã rèn, còn lại). Đó là con số chạm trần
// `KHIEN_REN_TOI_DA` (5) để ngừng rèn thêm.
import { MANH_REN_KHIEN, KHIEN_REN_GIU_TOI_DA, VANG_REN_KHIEN, ngayDatKhien } from '../../src/lib/kinh-te-game'
import { LUAT_CAP_MOI, LUAT_CAP_V3, LUAT_CAP_V4, chuyenV3SangV4, chuyenV4SangV5, nhanV5, ngayConThieuLenCap, dangChoNgayV5, type HoSoV3, type HoSoV4, type TranV5, type TruocSiet4, type TruocV5 } from '../../src/lib/hap-thu-ngay'
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
  /** v4: EXP chờ mốc (thú chưa được lên cấp 10 vì chưa đủ 21 ngày đạt). v5: NGĂN RIÊNG, đổ vào thú khi sức chứa tăng. */
  choMoc?: number
  /** v5: EXP tràn hôm nay + luỹ kế (vàng tràn/mảnh tràn đã đúc). */
  tranV5?: TranV5
  truocV5?: TruocV5
  /** v4: `earned` lúc chuyển sang v4 — vàng chỉ đúc trên phần EXP kiếm SAU mốc này. */
  mocVang?: number
  truocSiet4?: TruocSiet4
  shields?: { used: number }
  /** Tổng luỹ kế ĐÃ CỘNG vào hồ sơ này (từ sổ `exp_so`/`manh_khien_so`). Thiếu = 0. `ngayDat` = số NGÀY ĐẠT nhiệm vụ ngày tính từ mốc `khien_moc` (mở khiên quà đầu, phương án B).
   *  v5: `ngayNghi` = số ngày nghỉ chung thầy đặt (từ mốc, tới hôm nay, không trùng ngày đạt) — CHỈ cộng vào số ngày cho mốc cấp, không cộng mảnh, không mở khiên. */
  expMoi?: { daCong: number; manhDaTinh: number; ngayDat?: number; ngayNghi?: number }
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

/**
 * Thần thú sau một lần nhận EXP: cấp, EXP trong thanh, số cấp vừa lên, EXP đang chờ mốc (ngăn v4).
 * v5 (chỉ-thêm): `tran` EXP tràn của lần này, `vangTran`/`manhTran` vừa đúc; `choNgay` = số ngày đạt còn thiếu để lên cấp khi thanh đã đầy (0 = không chờ).
 */
export interface AnhThu { cap: number; exp: number; soCapLen: number; choMoc: number; tran?: number; vangTran?: number; manhTran?: number; choNgay?: number }

/** Số ngày tính cho MỐC CẤP (v5): ngày đạt + ngày nghỉ chung thầy đặt (điểm chốt 2). */
export const soNgayChoCap = (p: Pick<HoSoGameExp, 'expMoi'>): number => Math.max(0, p.expMoi?.ngayDat ?? 0) + Math.max(0, p.expMoi?.ngayNghi ?? 0)

/** Ngày VN (UTC+7) của một mốc ISO. */
const ngayVnCua = (iso: string): string => new Date(Date.parse(iso) + 7 * 3600_000).toISOString().slice(0, 10)

/**
 * CỘNG `them` EXP vào hồ sơ (sửa `p` tại chỗ) theo luật đang áp cho hồ sơ: v3/v4 ⇒ chuyển sang v5 trước; v5 ⇒ `nhanV5` (sức chứa theo số ngày cho mốc cấp,
 * EXP tràn đổi vàng + mảnh — mảnh tràn cộng thẳng vào `khienRen.manh`); hồ sơ cũ hơn v3 ⇒ vào ống nghiệm như cũ. `earned` luôn tăng đúng `them`.
 * Gọi với `them = 0` để đổ ngăn chờ khi em vừa có thêm ngày đạt.
 */
export function congExpVaoHoSo(p: HoSoGameExp, them: number, nowIso: string = new Date().toISOString()): AnhThu | null {
  const n = Math.max(0, Math.floor(them))
  if (p.luatCap === LUAT_CAP_V3) {
    const doi = chuyenV3SangV4(p as unknown as HoSoV3, p.expMoi?.ngayDat ?? 0, nowIso)
    Object.assign(p, doi.hoSo)
    delete (p as { hapThu?: unknown }).hapThu
  }
  if (p.luatCap === LUAT_CAP_V4) Object.assign(p, chuyenV4SangV5(p as unknown as HoSoV4, nowIso).hoSo)
  p.earned = Math.max(0, p.earned ?? 0) + n
  if (p.luatCap !== LUAT_CAP_MOI) {
    if (n > 0) p.wallet = Math.max(0, p.wallet ?? 0) + n
    return null
  }
  const soNgay = soNgayChoCap(p)
  const r = nhanV5({ cap: p.cap, exp: p.exp, wallet: 0, choMoc: p.choMoc, ...(p.tranV5 ? { tranV5: p.tranV5 } : {}) }, n, soNgay, ngayVnCua(nowIso))
  p.cap = r.hoSo.cap
  p.exp = r.hoSo.exp
  p.choMoc = r.hoSo.choMoc ?? 0
  if (r.hoSo.tranV5) p.tranV5 = r.hoSo.tranV5
  if (r.manhTran > 0) {
    const cu = p.khienRen ?? { manh: 0, daRen: 0 }
    p.khienRen = { ...cu, manh: cu.manh + r.manhTran }
  }
  const choNgay = dangChoNgayV5(p.cap, p.exp, soNgay) ? ngayConThieuLenCap(p.cap, soNgay) : 0
  return { cap: p.cap, exp: p.exp, soCapLen: r.soCapLen, choMoc: p.choMoc, tran: r.tran, vangTran: r.vangTran, manhTran: r.manhTran, choNgay }
}

/**
 * Cộng phần chênh giữa TỔNG SỔ và tổng đã cộng vào hồ sơ (sửa `p` tại chỗ). `tongExp`/`tongManh` là SUM của sổ (không bao giờ giảm).
 * Trả phần vừa cộng; hồ sơ đã bắt kịp sổ thì không đổi gì.
 */
export function congTongSoVaoHoSo(p: HoSoGameExp, tongExp: number, tongManh: number, ngayDat?: number, ngayNghi?: number): DaCong {
  const daCong = Math.max(0, p.expMoi?.daCong ?? 0)
  const manhDaTinh = Math.max(0, p.expMoi?.manhDaTinh ?? 0)
  const them = Math.max(0, Math.floor(tongExp) - daCong)
  const themManh = Math.max(0, Math.floor(tongManh) - manhDaTinh)
  // Số ngày đạt (và ngày nghỉ chung) cập nhật TRƯỚC khi cộng EXP: hôm nay em vừa đạt thêm một ngày thì sức chứa tăng ngay trong CÙNG lần cộng.
  const nghiCu = p.expMoi?.ngayNghi
  if (ngayDat !== undefined) p.expMoi = { daCong, manhDaTinh, ngayDat: Math.max(0, Math.floor(ngayDat)), ...(ngayNghi !== undefined && (ngayNghi > 0 || nghiCu !== undefined) ? { ngayNghi: Math.max(0, Math.floor(ngayNghi)) } : nghiCu !== undefined ? { ngayNghi: nghiCu } : {}) }
  // EXP vào thú (hồ sơ v3/v4 được chuyển trước); cả khi `them = 0` vẫn gọi để đổ ngăn chờ lúc em vừa có thêm ngày.
  const thu = them > 0 || (p.choMoc ?? 0) > 0 || p.luatCap === LUAT_CAP_V3 || p.luatCap === LUAT_CAP_V4 ? congExpVaoHoSo(p, them) : null
  let khienMoi = 0
  if (themManh > 0) {
    const truoc = p.khienRen ?? { manh: 0, daRen: 0 }
    const sau = (p.luatCap ?? 0) >= 3 ? { ...truoc, manh: truoc.manh + themManh } : congManh(truoc, themManh, khienRenChuaDung(p))
    khienMoi = sau.daRen - truoc.daRen
    p.khienRen = sau
  }
  p.expMoi = { daCong: Math.max(daCong, Math.floor(tongExp)), manhDaTinh: Math.max(manhDaTinh, Math.floor(tongManh)), ...(p.expMoi?.ngayDat === undefined ? {} : { ngayDat: p.expMoi.ngayDat }), ...(p.expMoi?.ngayNghi === undefined ? {} : { ngayNghi: p.expMoi.ngayNghi }) }
  return { exp: them, manh: themManh, khienMoi, ...(thu ? { thu } : {}) }
}

/**
 * RÈN KHIÊN (luật v5): khiên thứ k (k = số đã rèn + 1) cần `MANH_REN_KHIEN` (36) mảnh + `VANG_REN_KHIEN` (2 600) vàng + số ngày đạt ≥ `ngayDatKhien(k)` (36 + 18·(k − 1));
 * ngày nghỉ chung KHÔNG tính ở đây (chỉ tính cho mốc cấp). KHÔNG cần cấp 10; giữ tối đa 5 khiên rèn chưa dùng.
 * Rèn theo số lần đã rèn (`soDaRen`) để yêu cầu cũ gửi lại không rèn/trừ vàng thêm lần nữa: `soDaRen < daRen` ⇒ false (đã rèn rồi).
 * `vang` = số vàng hiện có (sổ `vang_so`); hàm chỉ KIỂM và sửa `p` (mảnh, số đã rèn) — nơi gọi ghi dòng trừ vàng CÙNG lô với hồ sơ.
 */
export function renKhienBangVang(p: HoSoGameExp, soDaRen: number, vang: number): boolean {
  const cu = p.khienRen ?? { manh: 0, daRen: 0 }
  if (!Number.isInteger(soDaRen) || soDaRen < 0 || soDaRen > cu.daRen) throw new Error('Em tải lại Túi đồ trước khi rèn.')
  if (soDaRen < cu.daRen) return false
  if ((p.luatCap ?? 0) < 3) throw new Error('Hồ sơ đang cập nhật. Em thử lại sau.')
  const canNgay = ngayDatKhien(cu.daRen + 1)
  const coNgay = Math.max(0, p.expMoi?.ngayDat ?? 0)
  if (coNgay < canNgay || cu.manh < MANH_REN_KHIEN) throw new Error(`Rèn khiên thứ ${cu.daRen + 1} cần ${canNgay} ngày đạt nhiệm vụ và ${MANH_REN_KHIEN} mảnh. Em đang có ${coNgay} ngày đạt và ${Math.max(0, cu.manh)} mảnh.`)
  if (khienRenChuaDung(p) >= KHIEN_REN_GIU_TOI_DA) throw new Error('Túi đã đủ khiên rèn. Em giữ mảnh cho lần sau.')
  if (!(vang >= VANG_REN_KHIEN)) throw new Error(`Rèn một khiên cần ${VANG_REN_KHIEN.toLocaleString('vi-VN')} vàng. Em đang có ${Math.max(0, Math.floor(vang)).toLocaleString('vi-VN')} vàng.`)
  p.khienRen = { manh: cu.manh - MANH_REN_KHIEN, daRen: cu.daRen + 1 }
  return true
}
