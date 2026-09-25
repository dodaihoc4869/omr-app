// CNH-1.0 P08 — HẤP THỤ · CẤP · KHIÊN · MẢNH · VÍ (hàm THUẦN, server-only, CHƯA nối route, CHƯA bật cờ).
//
// Điều khoản: `03` §1 (số có một nguồn), §6 (hấp thụ/cấp), §7 (mảnh/khiên), §8 (ví/vàng);
// `06` R26–R30 (T21–T26). Vector số: `docs/cline-ca-nhan-hoa-2309/MAU-KET-QUA.json`.
//
// ⚠️ MỘT NGUỒN cho ĐƯỜNG CẤP: `03` §6 — "Sau đó giữ bảng cấp đang dùng theo version hiện tại".
// Bảng đó là `BANG_THANH_EXP` (`src/game/than-thu-hoa-hoc/kinh-nghiem.ts`, 119 số, tổng 238 200).
// Ta IMPORT nó, KHÔNG chép lại: chép lại là mầm lệch giữa máy chủ và máy em.
//
// ⚠️ Tệp này KHÔNG đọc DB/đồng hồ/ngẫu nhiên, KHÔNG ghi, KHÔNG quyết định thay giáo viên.
// Đầu vào KHÔNG hợp lệ (NaN/âm/thập phân/tràn) ⇒ NÉM LỖI (`03` §1: "từ chối …"), KHÔNG ép về 0.
import { CAP_TOI_DA } from '../../src/game/than-thu-hoa-hoc/hinh-thai'
import { BANG_THANH_EXP, thanhExp, tongExpToiCap } from '../../src/game/than-thu-hoa-hoc/kinh-nghiem'

/** Hằng số kinh tế P08 — khớp `THAM-SO.json` §economy. Đổi ở đây PHẢI đổi THAM-SO + tăng phiên bản. */
export const KINH_TE = Object.freeze({
  coreCap: 220,
  optionalCap: 120,
  achievedAbsorbCap: 200,
  studiedAbsorbCap: 120,
  noneAbsorbCap: 0,
  reserveExp: 400,
  expToGold: 1,
  fragmentPerAchievedDay: 1,
  fragmentsPerShield: 21,
  firstShieldMinAchievedDays: 21,
  shieldMinLevel: 10,
  firstShieldExpCost: 0,
  laterShieldExpCost: 300,
  maxUnusedShields: 5,
  /** Cấp tối đa — MỘT NGUỒN: `src/game/than-thu-hoa-hoc/hinh-thai.ts`. */
  maxLevel: CAP_TOI_DA,
  /**
   * §6: "Sau đó giữ bảng cấp đang dùng theo version hiện tại; không bật đường 365 ngày".
   * Giá trị giữ ĐÚNG chữ của `THAM-SO.json` (`existing-versioned-table`); bảng thật đang dùng là
   * `BANG_THANH_EXP` (`src/game/than-thu-hoa-hoc/kinh-nghiem.ts`) — xem `capTuInvestedExp`.
   */
  postLevel10Curve: 'existing-versioned-table' as const,
  curveEnabled365Days: false,
  /** §6: mặc định hấp thụ bằng THAO TÁC học sinh; tự hấp thụ chỉ khi có opt-in và vẫn qua cùng command. */
  autoAbsorbDefault: false,
  /** Chín thanh đầu — CẮT TỪ bảng cấp thật, không chép tay (khớp `THAM-SO.economy.firstNineBars`). */
  firstNineBars: Object.freeze(BANG_THANH_EXP.slice(0, 9)),
})

/** `BANG_THANH_EXP` phải đủ 119 thanh (cấp 1→120) — lệch là đường cấp hỏng, phải biết NGAY. */
if (BANG_THANH_EXP.length !== CAP_TOI_DA - 1) {
  throw new Error(`BANG_THANH_EXP phải có ${CAP_TOI_DA - 1} thanh, đang có ${BANG_THANH_EXP.length}`)
}

/** Trần THÂM NHẬP của cả đường cấp = tổng EXP để đạt cấp tối đa (238 200). */
export const TRAN_INVESTED_EXP = tongExpToiCap(CAP_TOI_DA)

export type MaLoiP08 = 'SO_KHONG_HOP_LE' | 'TRAN_SO' | 'VUOT_DUONG_CAP'
/** Lỗi chính sách P08. Đọc `.ma` (giống `LoiNopBai.ma`), KHÔNG bắt theo chuỗi thông điệp. */
export class LoiP08 extends Error {
  readonly ma: MaLoiP08
  constructor(ma: MaLoiP08, thongDiep: string) {
    super(thongDiep)
    this.name = 'LoiP08'
    this.ma = ma
  }
}

/**
 * Số nguyên không âm trong miền an toàn (`03` §1). TỪ CHỐI: NaN, ±∞, số thập phân, số âm, tràn.
 * KHÔNG ép về 0: ép về 0 sẽ biến `NaN` thành "0 EXP" và lặng lẽ chặn hấp thụ mà không ai biết.
 */
function soNguyenKhongAm(v: unknown, ten: string): number {
  if (typeof v !== 'number' || !Number.isInteger(v)) {
    throw new LoiP08('SO_KHONG_HOP_LE', `${ten} phải là số nguyên, nhận ${String(v)}`)
  }
  if (v < 0) throw new LoiP08('SO_KHONG_HOP_LE', `${ten} phải >= 0, nhận ${v}`)
  if (!Number.isSafeInteger(v)) throw new LoiP08('TRAN_SO', `${ten} vượt miền số nguyên an toàn, nhận ${v}`)
  return v
}

// ───────────────────────── CẤP · ĐƯỜNG CẤP (`03` §6) ─────────────────────────

/** Vị trí trên đường cấp: cấp hiện tại + tiến độ TRONG thanh của cấp đó. */
export interface TrangThaiCap {
  level: number
  progress: number
}

/**
 * SUY CẤP từ `invested_exp` (tổng EXP đã hấp thụ) — `03` §6: *"Khi vượt một thanh, chuyển phần dư
 * sang thanh tiếp theo trong vòng lặp bị chặn ở level 120. … Không chia cho thanh 0."*
 * Vòng lặp luôn có `level < maxLevel` nên KHÔNG bao giờ tra `thanhExp(120) = 0`.
 * `invested_exp` vượt trần đường cấp ⇒ NÉM (`VUOT_DUONG_CAP`), không kẹp im lặng.
 */
export function capTuInvestedExp(investedExp: unknown): TrangThaiCap {
  const tong = soNguyenKhongAm(investedExp, 'invested_exp')
  if (tong > TRAN_INVESTED_EXP) {
    throw new LoiP08('VUOT_DUONG_CAP', `invested_exp ${tong} vượt trần đường cấp ${TRAN_INVESTED_EXP}`)
  }
  let level = 1
  let con = tong
  while (level < CAP_TOI_DA && con >= thanhExp(level)) {
    con -= thanhExp(level)
    level += 1
  }
  return { level, progress: con }
}

/** `exp_missing_to_level_120` của `03` §6: còn thiếu bao nhiêu để chạm cấp tối đa. */
export function expThieuToiCapToiDa(investedExp: unknown): number {
  return TRAN_INVESTED_EXP - soNguyenKhongAm(investedExp, 'invested_exp')
}

// ───────────────────────── HẤP THỤ (`03` §6) ─────────────────────────
//
// ⚠️ CẢNH BÁO CHO NGƯỜI NỐI LỆNH D1: luật CŨ trong `server/src/game-v2-hap-thu.ts` chặn theo
// THANH HIỆN TẠI (`expConThieu = thanhExp(cap) − exp`) ⇒ hấp thụ KHÔNG vượt được thanh trong một
// lượt. `03` §6 chốt luật MỚI: `take = min(wallet, available, exp_missing_to_level_120)` — chặn
// theo TỔNG đường tới cấp 120, nên MỘT lượt ĐI XUYÊN nhiều thanh (xem `capTuInvestedExp`).
// Bằng chứng §10: ví ngày 12 = 240 chỉ đúng khi hấp thụ tròn 200/ngày xuyên thanh. ĐỪNG tái dùng
// `thanhExp(cap) − exp` của legacy: làm vậy ví sẽ phình nhanh hơn bảng chuẩn và lệch cả 3 vector mô phỏng.

/** Trạng thái ngày để chọn TRẦN hấp thụ: `achieved` > `studied` > chưa học (`03` §6). */
export type TrangThaiNgay = 'achieved' | 'studied' | 'chua_hoc'

/** Trần hấp thụ một ngày: 200 (đạt) / 120 (có học chưa đạt) / 0 (chưa học). */
export function tranHapThuNgay(tt: TrangThaiNgay): number {
  if (tt !== 'achieved' && tt !== 'studied' && tt !== 'chua_hoc') {
    throw new LoiP08('SO_KHONG_HOP_LE', `trạng thái ngày lạ: ${String(tt)}`)
  }
  return tt === 'achieved' ? KINH_TE.achievedAbsorbCap : tt === 'studied' ? KINH_TE.studiedAbsorbCap : KINH_TE.noneAbsorbCap
}

export interface DauVaoHapThu {
  /** `wallet_exp` — ví CHƯA hấp thụ (`03` §1; nằm ở `cnh_exp_account` của P07). */
  walletExp: number
  /** Đã hấp thụ hôm nay (theo NGÀY VN). */
  absorbedToday: number
  trangThaiNgay: TrangThaiNgay
  /** `invested_exp` — tổng EXP ĐÃ hấp thụ (`03` §1). Không phải `wallet_exp`, càng không phải `earned_exp`. */
  investedExp: number
}

export interface KetQuaHapThu {
  /** Lượng hấp thụ LƯỢT NÀY = min(ví, còn lại của trần ngày, còn thiếu tới cấp tối đa). */
  take: number
  tranNgay: number
  conLaiTranNgay: number
  walletAfter: number
  absorbedTodayAfter: number
  investedExpAfter: number
  /** Cấp/tiến độ SUY RA sau lượt hấp thụ (vượt thanh ⇒ sang thanh kế, dừng ở cấp tối đa). */
  levelAfter: number
  progressAfter: number
  /** Đã chạm cấp tối đa ⇒ `03` §6: "không hấp thụ thêm, ví giữ nguyên". */
  chamTranCap: boolean
}

/**
 * HẤP THỤ đúng một lượt (`03` §6):
 *   dailyLimit = achieved?200 : studied?120 : 0
 *   available  = max(0, dailyLimit − absorbed_today)
 *   take       = min(wallet_exp, available, exp_missing_to_level_120)
 * Hàm TỰ tính `exp_missing_to_level_120` từ `invested_exp` (không nhận hộp đen từ ngoài).
 * KHÔNG tự mua/rèn; KHÔNG reset `absorbed_today`; thu nhập nhiều KHÔNG nâng trần.
 */
export function tinhHapThu(v: DauVaoHapThu): KetQuaHapThu {
  const wallet = soNguyenKhongAm(v.walletExp, 'wallet_exp')
  const daHap = soNguyenKhongAm(v.absorbedToday, 'absorbed_today')
  const invested = soNguyenKhongAm(v.investedExp, 'invested_exp')
  if (invested > TRAN_INVESTED_EXP) {
    throw new LoiP08('VUOT_DUONG_CAP', `invested_exp ${invested} vượt trần đường cấp ${TRAN_INVESTED_EXP}`)
  }
  const tranNgay = tranHapThuNgay(v.trangThaiNgay)
  const conLaiTran = Math.max(0, tranNgay - daHap)
  const thieu = TRAN_INVESTED_EXP - invested
  const take = Math.min(wallet, conLaiTran, thieu)
  const investedExpAfter = invested + take
  const cap = capTuInvestedExp(investedExpAfter)
  return {
    take,
    tranNgay,
    conLaiTranNgay: conLaiTran - take,
    walletAfter: wallet - take,
    absorbedTodayAfter: daHap + take,
    investedExpAfter,
    levelAfter: cap.level,
    progressAfter: cap.progress,
    chamTranCap: thieu === 0,
  }
}

// ───────────────────────── VÍ · VÀNG (`03` §8) ─────────────────────────

/** Ví có thể TIÊU = `max(0, wallet − 400)` (dự trữ chỉ bảo vệ hành động tiêu EXP). */
export function expTieuDuoc(walletExp: unknown): number {
  return Math.max(0, soNguyenKhongAm(walletExp, 'wallet_exp') - KINH_TE.reserveExp)
}

export interface KetQuaDoiVang {
  ok: boolean
  lyDo: string
  /** EXP bị trừ khỏi ví. */
  expTru: number
  /** Vàng nhận = `expTru × expToGold`. */
  goldNhan: number
  walletAfter: number
  goldAfter: number
}

/**
 * Đổi `x` EXP sang vàng (`03` §8): `x` nguyên > 0 và `x ≤ spendable_exp`; trừ `x` ví và cộng vàng
 * CÙNG một giao dịch (việc ghi là của caller). `goldTruoc` để trả `goldAfter` cho hợp đồng vector.
 * `x` là SỐ DO NGƯỜI DÙNG ĐƯA ⇒ từ chối bằng `ok:false` (không ném); `wallet`/`gold` là trạng thái
 * máy chủ ⇒ sai kiểu là NÉM (`03` §1).
 */
export function xetDoiVang(walletExp: unknown, x: unknown, goldTruoc: unknown = 0): KetQuaDoiVang {
  const w = soNguyenKhongAm(walletExp, 'wallet_exp')
  const gold = soNguyenKhongAm(goldTruoc, 'gold')
  const nen = { expTru: 0, goldNhan: 0, walletAfter: w, goldAfter: gold }
  if (typeof x !== 'number' || !Number.isInteger(x)) {
    return { ok: false, lyDo: `số EXP đổi phải là số nguyên, nhận ${String(x)}`, ...nen }
  }
  if (x <= 0) return { ok: false, lyDo: 'số EXP đổi phải > 0', ...nen }
  const tieuDuoc = Math.max(0, w - KINH_TE.reserveExp)
  if (x > tieuDuoc) {
    return { ok: false, lyDo: `vượt ví tiêu được (${tieuDuoc}); dự trữ ${KINH_TE.reserveExp} phải giữ`, ...nen }
  }
  const goldNhan = x * KINH_TE.expToGold
  return { ok: true, lyDo: '', expTru: x, goldNhan, walletAfter: w - x, goldAfter: gold + goldNhan }
}

// ───────────────────────── KHIÊN · MẢNH (`03` §7) ─────────────────────────

export interface TinKhien {
  level: number
  /** `fragment_balance` — mảnh CHƯA TIÊU. */
  fragmentBalance: number
  /** Số khiên CHƯA DÙNG đang có. */
  unusedShields: number
  /** Số khiên ĐÃ DÙNG — chỉ để tính `claim_index`, mặc định 0. */
  usedShields?: number
  /** Số NGÀY ĐẠT tích luỹ. */
  achievedDays: number
  firstShieldClaimed: boolean
  walletExp: number
}

export type LoaiKhien = 'first' | 'later' | 'khong'

export interface KetQuaKhien {
  loai: LoaiKhien
  /** `common` = level≥10 ∧ mảnh≥21 ∧ kho<5. */
  common: boolean
  lyDo: string
  fragmentBalanceAfter: number
  walletAfter: number
  unusedAfter: number
  usedAfter: number
  firstClaimedAfter: boolean
  /**
   * `03` §7.1 "Ghi claim_index": số thứ tự khiên ĐƯỢC CẤP ở lượt này = tổng khiên đã cấp + 1.
   * `null` khi lượt này KHÔNG cấp khiên (`loai === 'khong'`) — không ghi `claim_index` nào.
   */
  claimIndexAfter: number | null
  /** Chi phí VÍ của lượt này: `first` = 0 (`firstShieldExpCost`), `later` = 300, từ chối = 0. */
  expCost: number
}

/**
 * XÉT điều kiện đổi MỘT khiên (`03` §7.1):
 *   common = level>=10 AND fragments>=21 AND unused_shields<5
 *   first  = common AND achieved_days>=21 AND first_shield_claimed=false
 *   later  = common AND first_shield_claimed=true AND wallet_exp>=700
 * First: fragments−21, unused+1, first_shield_claimed=true, VÍ GIỮ NGUYÊN.
 * Later: fragments−21, wallet−300, unused+1.
 * Kho đã `maxUnusedShields` ⇒ KHÔNG trừ mảnh/tiền (chỉ là `khong`) — §7.1.
 */
export function xetKhien(t: TinKhien): KetQuaKhien {
  const level = soNguyenKhongAm(t.level, 'level')
  const fragments = soNguyenKhongAm(t.fragmentBalance, 'fragment_balance')
  const shields = soNguyenKhongAm(t.unusedShields, 'unused_shields')
  const daDung = soNguyenKhongAm(t.usedShields ?? 0, 'used_shields')
  const days = soNguyenKhongAm(t.achievedDays, 'achieved_days')
  const wallet = soNguyenKhongAm(t.walletExp, 'wallet_exp')
  const goc = {
    fragmentBalanceAfter: fragments,
    walletAfter: wallet,
    unusedAfter: shields,
    usedAfter: daDung,
    firstClaimedAfter: t.firstShieldClaimed === true,
    claimIndexAfter: null,
    expCost: 0,
  }
  const common = level >= KINH_TE.shieldMinLevel && fragments >= KINH_TE.fragmentsPerShield && shields < KINH_TE.maxUnusedShields
  if (!common) {
    const vi =
      level < KINH_TE.shieldMinLevel
        ? `cấp ${level} < ${KINH_TE.shieldMinLevel}`
        : fragments < KINH_TE.fragmentsPerShield
          ? `mảnh ${fragments} < ${KINH_TE.fragmentsPerShield}`
          : `kho đã đủ ${shields}/${KINH_TE.maxUnusedShields}`
    return { loai: 'khong', common: false, lyDo: vi, ...goc }
  }
  const claimIndexMoi = shields + daDung + 1
  if (!t.firstShieldClaimed) {
    if (days < KINH_TE.firstShieldMinAchievedDays) {
      return { loai: 'khong', common: true, lyDo: `ngày đạt ${days} < ${KINH_TE.firstShieldMinAchievedDays}`, ...goc }
    }
    return {
      loai: 'first',
      common: true,
      lyDo: '',
      fragmentBalanceAfter: fragments - KINH_TE.fragmentsPerShield,
      walletAfter: wallet,
      unusedAfter: shields + 1,
      usedAfter: daDung,
      firstClaimedAfter: true,
      claimIndexAfter: claimIndexMoi,
      expCost: KINH_TE.firstShieldExpCost,
    }
  }
  const canVi = KINH_TE.laterShieldExpCost + KINH_TE.reserveExp
  if (wallet < canVi) {
    return { loai: 'khong', common: true, lyDo: `ví ${wallet} < ${canVi} (${KINH_TE.laterShieldExpCost} rèn + ${KINH_TE.reserveExp} dự trữ)`, ...goc }
  }
  return {
    loai: 'later',
    common: true,
    lyDo: '',
    fragmentBalanceAfter: fragments - KINH_TE.fragmentsPerShield,
    walletAfter: wallet - KINH_TE.laterShieldExpCost,
    unusedAfter: shields + 1,
    usedAfter: daDung,
    firstClaimedAfter: true,
    claimIndexAfter: claimIndexMoi,
    expCost: KINH_TE.laterShieldExpCost,
  }
}



// ───────────────────────── MÔ PHỎNG CHUẨN (`03` §10) ─────────────────────────

export interface DauVaoMoPhong {
  /** EXP KIẾM ĐƯỢC mỗi ngày đạt (ví nhận trước khi hấp thụ). */
  earnedEachAchievedDay: number
  days: number
}

export interface KetQuaMoPhong {
  /** Ngày ĐẦU TIÊN chạm cấp 10 (chưa có ⇒ `null`). */
  level10Day: number | null
  firstShieldDay: number | null
  secondShieldDay: number | null
  walletDay12: number
  walletDay21: number
  walletDay42: number
}

/**
 * MÔ PHỎNG chuẩn `03` §10: tài khoản mới, ví 0, ĐẠT mỗi ngày, hấp thụ tối đa, không mua đồ.
 * Mỗi ngày theo ĐÚNG thứ tự §10 ("first nhận ngày 21, later đầu ngày 42 SAU thu/hấp thụ"):
 *   1) ví += earned  2) hấp thụ (trần 200/ngày; vượt thanh ⇒ sang thanh kế)  3) +1 mảnh, +1 ngày đạt
 *   4) XÉT một khiên (first trước, rồi later)  5) chốt số ví của ngày.
 * Dùng CHÍNH `tinhHapThu` + `xetKhien` ở trên ⇒ vector §10 kiểm luôn cả hai hàm đó.
 */
export function moPhongChuan(v: DauVaoMoPhong): KetQuaMoPhong {
  const earned = soNguyenKhongAm(v.earnedEachAchievedDay, 'earnedEachAchievedDay')
  const days = soNguyenKhongAm(v.days, 'days')
  let wallet = 0
  let invested = 0
  let fragmentBalance = 0
  let unusedShields = 0
  let usedShields = 0
  let achievedDays = 0
  let firstShieldClaimed = false
  let level = 1
  let level10Day: number | null = null
  let firstShieldDay: number | null = null
  let secondShieldDay: number | null = null
  const viTheoNgay: Record<number, number> = {}
  for (let ngay = 1; ngay <= days; ngay++) {
    wallet += earned
    const hap = tinhHapThu({ walletExp: wallet, absorbedToday: 0, trangThaiNgay: 'achieved', investedExp: invested })
    wallet = hap.walletAfter
    invested = hap.investedExpAfter
    level = hap.levelAfter
    achievedDays += 1
    fragmentBalance += KINH_TE.fragmentPerAchievedDay
    if (level10Day === null && level >= KINH_TE.shieldMinLevel) level10Day = ngay
    const khien = xetKhien({ level, fragmentBalance, unusedShields, usedShields, achievedDays, firstShieldClaimed, walletExp: wallet })
    if (khien.loai !== 'khong') {
      fragmentBalance = khien.fragmentBalanceAfter
      wallet = khien.walletAfter
      unusedShields = khien.unusedAfter
      firstShieldClaimed = khien.firstClaimedAfter
      if (khien.loai === 'first') firstShieldDay = ngay
      else secondShieldDay = ngay
    }
    viTheoNgay[ngay] = wallet
  }
  return {
    level10Day,
    firstShieldDay,
    secondShieldDay,
    walletDay12: viTheoNgay[12] ?? 0,
    walletDay21: viTheoNgay[21] ?? 0,
    walletDay42: viTheoNgay[42] ?? 0,
  }
}

// ───────────────── LỊCH HỌC → NGÀY LỊCH (`03` §10) ─────────────────

/** Thứ theo ISO-8601: 1 = Thứ Hai … 7 = Chủ Nhật. */
export const THU_ISO: Readonly<Record<string, number>> = Object.freeze({
  Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7,
})

export interface DauVaoLichHoc {
  /** Ngày LỊCH 1 là thứ mấy (tên tiếng Anh theo ISO): `'Monday'`, … */
  startWeekday: string
  /** Các thứ CÓ học (1…7). Phải khác rỗng và không trùng. */
  studyWeekdays: readonly number[]
  /** Số thứ tự NGÀY HỌC (1 = ngày học đầu tiên), KHÔNG phải ngày lịch. */
  studyDay: number
}

/**
 * ĐỔI "ngày HỌC thứ N" → "ngày LỊCH thứ mấy" (`03` §10).
 *
 * §10: *"Học thứ Hai–thứ Sáu, bắt đầu thứ Hai: ngày học 12 = ngày lịch 16; ngày đạt 21 = lịch 29;
 * ngày đạt 42 = lịch 58. Không quảng cáo '21 ngày lịch chắc chắn có khiên' cho lịch học 5 ngày/tuần."*
 *
 * Vì sao cần hàm này: KHIÊN tính theo **ngày ĐẠT** (`xetKhien`), không theo ngày lịch. Hàm này chỉ
 * để ĐỔI SANG NGÀY LỊCH khi hiển thị/nói cho phụ huynh — dùng sai (coi 21 là ngày lịch) là hứa sai.
 */
export function ngayLichTuNgayHoc(v: DauVaoLichHoc): number {
  const batDau = THU_ISO[v.startWeekday]
  if (batDau === undefined) {
    throw new LoiP08('SO_KHONG_HOP_LE', `startWeekday phải là tên thứ ISO (Monday…Sunday), nhận ${String(v.startWeekday)}`)
  }
  if (!Array.isArray(v.studyWeekdays) || v.studyWeekdays.length === 0) {
    throw new LoiP08('SO_KHONG_HOP_LE', 'studyWeekdays phải là danh sách KHÁC RỖNG')
  }
  const coHoc = new Set(v.studyWeekdays.map((t) => soNguyenKhongAm(t, 'studyWeekdays')))
  for (const t of coHoc) {
    if (t < 1 || t > 7) throw new LoiP08('SO_KHONG_HOP_LE', `thứ phải trong 1…7, nhận ${t}`)
  }
  if (coHoc.size !== v.studyWeekdays.length) throw new LoiP08('SO_KHONG_HOP_LE', 'studyWeekdays bị TRÙNG')
  const ngayHoc = soNguyenKhongAm(v.studyDay, 'studyDay')
  if (ngayHoc < 1) throw new LoiP08('SO_KHONG_HOP_LE', `studyDay bắt đầu từ 1, nhận ${ngayHoc}`)
  let dem = 0
  let lich = 0
  while (dem < ngayHoc) {
    lich += 1
    const thu = ((batDau - 1 + (lich - 1)) % 7) + 1
    if (coHoc.has(thu)) dem += 1
  }
  return lich
}


