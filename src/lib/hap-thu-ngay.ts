// HẤP THỤ THEO NGÀY — hàm THUẦN (Code 1, 21/09/2026; thầy chốt 13:36 "CHỐT HẾT BUILD ĐI"; Điều 1 + 2 + 9 của `DE-XUAT-THAN-THU-MOI-NGAY-2109.md`).
//
// Thần thú lên cấp theo NGÀY HỌC ĐỀU, không theo lượng EXP kiếm được: mỗi ngày (giờ Việt Nam) thần thú HẤP THỤ tối đa
//   200 EXP khi em ĐẠT nhiệm vụ ngày · 120 EXP khi em có học nhưng chưa đạt · 0 khi em không học.
// EXP kiếm dư nằm nguyên trong ỐNG NGHIỆM (`wallet`), hôm sau nạp tiếp — không em nào bị vứt công. Vì đường cấp mới tổng 240 000 EXP = 1 200 ngày × 200:
//   SỚM NHẤT cấp 10 là ngày 21 (4 200 EXP) và cấp 120 là ngày 1 200, dù em cày bao nhiêu câu trong một ngày.
// MỘT cổng: mọi nơi làm tăng `cap` / `exp` của hồ sơ game (nạp, quà, Đoàn, legacy…) phải đi qua `hapThu`; máy chủ (Code 3) gọi hàm này, máy em chỉ HIỂN THỊ kết quả máy chủ trả.
//
// Hồ sơ dùng ba trường của hồ sơ game v2: `cap` (1…120), `exp` (EXP đã nạp DỞ DANG trong cấp hiện tại, 0 ≤ exp < thanhExp(cap)), `wallet` (ống nghiệm) và `hapThu` = { ngay, da }
// (số EXP đã hấp thụ trong `ngay`; sang ngày mới `da` coi như 0). Hàm KHÔNG sửa đầu vào, KHÔNG đọc đồng hồ, KHÔNG ngẫu nhiên; chuỗi ngày `YYYY-MM-DD` so sánh bằng `===`.
import { CAP_TOI_DA } from '../game/than-thu-hoa-hoc/hinh-thai'
import { nhanExp, thanhExp, thanhExpCu, tongExpToiCap } from '../game/than-thu-hoa-hoc/kinh-nghiem'

/** Sức hấp thụ của MỘT ngày em đạt nhiệm vụ ngày. */
export const HAP_THU_DAT = 200
/** Sức hấp thụ của một ngày em có học nhưng chưa đạt nhiệm vụ ngày. */
export const HAP_THU_CO_HOC = 120
/** Điều 9: EXP sinh trong GAME (nấc dạng, thử thách, tiếp sức, kết chặng, vỡ giáp…) tối đa mỗi ngày VN = đúng mức "có học". EXP học tập không bị trần. */
export const TRAN_EXP_GAME_NGAY = 120
/** Điều 10: bảng giá EXP học tập mới từ 2026-09-22 nâng thưởng "đạt nhiệm vụ ngày" 20 ⇒ 80; em đã đạt trước mốc được BÙ phần chênh này cho mỗi ngày đạt. */
export const BU_DAT_NGAY = 60
/** Mã luật cấp của hồ sơ sau khi chuyển đổi (`luatCap`); hồ sơ chưa có hoặc khác 2 là hồ sơ của đường cũ. */
export const LUAT_CAP_MOI = 2
/** Ngày sớm nhất tới cấp 10 / cấp 120 khi em ĐẠT mọi ngày (bất biến của đường mới; test khoá). */
export const NGAY_SOM_NHAT_CAP_10 = 21
export const NGAY_SOM_NHAT_CAP_120 = 1200

export type LyDoHapThu = 'no' | 'chua_hoc' | 'het_ong' | 'cap_toi_da' | null

export interface HoSoCapExp {
  cap: number
  exp: number
  wallet: number
  hapThu?: { ngay: string; da: number }
}

const soNguyen = (x: unknown): number => (typeof x === 'number' && Number.isFinite(x) ? Math.max(0, Math.floor(x)) : 0)
const kepCap = (c: unknown): number => Math.min(CAP_TOI_DA, Math.max(1, Math.round(typeof c === 'number' && Number.isFinite(c) ? c : 1)))

/**
 * "CÓ HỌC" (siết 21/09 chiều, Boss chốt): hôm nay em làm ít nhất chừng này câu KHÁC NHAU (mọi nguồn) mới được hấp thụ `HAP_THU_CO_HOC`. Trước đó chỉ cần ≥ 1 sự kiện — một câu sai mỗi ngày
 * là đủ ăn 120 từ ống dự trữ. Đạt nhiệm vụ ngày thì hiển nhiên đã làm đủ (mức tối thiểu ≥ 4 câu).
 */
export const CO_HOC_TOI_THIEU_CAU = 4
export const laCoHoc = (soCauKhacNhauHomNay: number): boolean => soNguyen(soCauKhacNhauHomNay) >= CO_HOC_TOI_THIEU_CAU

/**
 * Sức hấp thụ của ngày hôm nay: đạt ⇒ 200, có học ⇒ 120, còn lại ⇒ 0. Truyền `soCauHomNay` (số câu KHÁC NHAU hôm nay, mọi nguồn) ⇒ "có học" = `laCoHoc(soCauHomNay)` và BỎ QUA `coHocHomNay`;
 * chỉ truyền `coHocHomNay` (boolean, chữ ký cũ) ⇒ dùng như máy chủ báo. (Đạt mà "không có học" không xảy ra: đạt ⇒ đã làm ≥ mức tối thiểu.)
 */
export function tranHapThu(v: { datHomNay: boolean; coHocHomNay?: boolean; soCauHomNay?: number }): number {
  const coHoc = v.soCauHomNay !== undefined ? laCoHoc(v.soCauHomNay) : v.coHocHomNay === true
  return v.datHomNay ? HAP_THU_DAT : coHoc ? HAP_THU_CO_HOC : 0
}

/** Số EXP game em được NHẬN thêm hôm nay: `xin` bị chặn ở phần còn lại của trần 120/ngày (không âm). Quá trần ⇒ 0 (câu, bản đồ, vé vẫn ghi — chỉ thưởng EXP bằng 0). */
export function tranExpGameNgay(daNhanHomNay: number, xin: number): number {
  return Math.max(0, Math.min(soNguyen(xin), TRAN_EXP_GAME_NGAY - soNguyen(daNhanHomNay)))
}

/** EXP còn cần để ĐẦY cấp 120 từ trạng thái (cap, exp). 0 khi đã cấp 120. */
function sucChuaDenDinh(cap: number, exp: number): number {
  if (cap >= CAP_TOI_DA) return 0
  let c = -exp
  for (let l = cap; l < CAP_TOI_DA; l++) c += thanhExp(l)
  return Math.max(0, c)
}

export interface KetQuaHapThu<H extends HoSoCapExp> {
  /** Hồ sơ sau khi nạp (đầu vào KHÔNG bị sửa). `daNap = 0` ⇒ trả lại CHÍNH đầu vào. */
  hoSo: H
  /** Số EXP thần thú vừa hấp thụ (chuyển từ ống sang thanh cấp). */
  daNap: number
  /** Vì sao `daNap < xin` (nói THẬT cho em): 'no' hôm nay đủ trần · 'chua_hoc' hôm nay em chưa học · 'het_ong' ống hết EXP · 'cap_toi_da' đã tới cấp 120 (hoặc sắp đầy). `null` = nạp đủ như xin. */
  lyDo: LyDoHapThu
  /** Phần trần hôm nay còn lại SAU lần nạp này. */
  conTran: number
}

/**
 * NẠP EXP từ ống vào thần thú qua cổng hấp thụ ngày. `xin` = số EXP em muốn nạp (Infinity = nạp hết được); `tran` = `tranHapThu(...)` của HÔM NAY (đạt sau khi đã nạp 120 thì
 * gọi lại với tran 200 ⇒ nạp tiếp được tới 200); `ngayVN` = ngày Việt Nam hôm nay. `daNap = min(xin, phần trần còn lại, ống, phần còn thiếu tới cấp 120)`.
 */
export function hapThu<H extends HoSoCapExp>(hoSo: H, xin: number, ngayVN: string, tran: number): KetQuaHapThu<H> {
  const cap = kepCap(hoSo.cap)
  const exp = soNguyen(hoSo.exp)
  const wallet = soNguyen(hoSo.wallet)
  const tranHop = Math.min(HAP_THU_DAT, soNguyen(tran))
  const da = hoSo.hapThu && hoSo.hapThu.ngay === ngayVN ? soNguyen(hoSo.hapThu.da) : 0
  const conTranTruoc = Math.max(0, tranHop - da)
  const suc = sucChuaDenDinh(cap, exp)
  const xinSo = xin === Number.POSITIVE_INFINITY ? Number.MAX_SAFE_INTEGER : soNguyen(xin)
  const daNap = Math.min(xinSo, conTranTruoc, wallet, suc)
  // Vì sao nạp ít hơn em xin: giới hạn nào ĐANG chặn (bằng đúng `daNap`), ưu tiên nói cấp tối đa → chưa học → đủ trần → hết ống.
  let lyDo: LyDoHapThu = null
  if (daNap < xinSo) {
    if (suc === daNap) lyDo = 'cap_toi_da'
    else if (tranHop === 0) lyDo = 'chua_hoc'
    else if (conTranTruoc === daNap) lyDo = 'no'
    else lyDo = 'het_ong'
  }
  if (daNap <= 0) return { hoSo, daNap: 0, lyDo, conTran: conTranTruoc }
  const r = nhanExp({ capDo: cap, exp }, daNap)
  const moi = { ...hoSo, cap: r.capDo, exp: r.exp, wallet: wallet - daNap, hapThu: { ngay: ngayVN, da: da + daNap } }
  return { hoSo: moi, daNap, lyDo, conTran: conTranTruoc - daNap }
}

// ══════════════════════════════ CHUYỂN ĐỔI HỒ SƠ ĐÃ CHƠI (Điều 2 + Điều 9) ══════════════════════════════

/**
 * ĐỊNH GIÁ LẠI thưởng nấc dạng đã nhận (Điều 9: nấc 20 · 40 · 40 ⇒ 10 · 20 · 30). Mỗi dạng ở nấc cao nhất `stage` đã được trả 0 · 20 · 60 · 100 EXP; giá mới 0 · 10 · 30 · 60;
 * phần chênh 0 · 10 · 30 · 40 bị trừ khỏi TỔNG EXP của em (không âm) TRƯỚC khi rải vào đường mới. EXP học tập không đổi.
 */
export const CHENH_THUONG_NAC: readonly number[] = [0, 10, 30, 40]

export interface HoSoCu extends HoSoCapExp {
  mastery?: readonly { stage?: number }[]
  luatCap?: number
  truocSiet?: unknown
}

export interface TruocSiet {
  cap: number
  exp: number
  wallet: number
  luc: string
  /** `chenh` = tổng chênh tính theo `mastery`; `daTru` = số EXP thực sự bị trừ (= `chenh` trừ phần kẹp ≥ 0). */
  dinhGiaLai: { chenh: number; daTru: number }
  /** Điều 10: EXP cộng BÙ = `BU_DAT_NGAY` × số ngày em đã "đạt nhiệm vụ ngày" TRƯỚC khi bảng giá mới có hiệu lực (0 nếu không có). */
  buDatNgay: number
}

export interface KetQuaChuyenDoi<H extends HoSoCu> {
  hoSo: H & { luatCap: number; truocSiet?: TruocSiet }
  /** `false` ⇒ hồ sơ đã ở luật cấp mới (`luatCap === 2`), trả lại CHÍNH đầu vào (idempotent). */
  daChuyen: boolean
  /** Tổng EXP em có trước khi chuyển, theo đường CŨ: đã nạp (`thanhExpCu`) + dở dang + ống. */
  tongCu: number
  /** Tổng sau định giá lại và bù: `max(0, tongCu − chenh) + buDatNgay`. Bằng `daHapThu + hoSo.wallet` (bảo toàn). */
  tongMoi: number
  /** Số EXP thần thú đã hấp thụ vào đường mới. */
  daHapThu: number
  /** Số EXP bị trừ do định giá lại thưởng nấc. */
  daTruDinhGia: number
  /** Số EXP cộng bù do bảng giá "đạt nhiệm vụ ngày" mới (Điều 10). */
  buDatNgay: number
}

/** Tổng EXP em đã có theo ĐƯỜNG CŨ: các thanh đã đầy (`thanhExpCu`) + phần dở dang + ống nghiệm. */
export function tongExpTheoDuongCu(cap: number, exp: number, wallet: number): number {
  let t = soNguyen(exp) + soNguyen(wallet)
  for (let c = 1; c < kepCap(cap); c++) t += thanhExpCu(c)
  return t
}

/** Tổng chênh định giá lại của một danh sách `mastery` (mỗi dạng theo nấc `stage` 0…3; nấc lạ kẹp vào 0…3). */
export function chenhDinhGia(mastery: readonly { stage?: number }[] | undefined): number {
  let t = 0
  for (const m of mastery ?? []) t += CHENH_THUONG_NAC[Math.min(3, soNguyen(m?.stage))] ?? 0
  return t
}

/**
 * CHUYỂN ĐỔI hồ sơ đã chơi sang đường cấp mới (MỘT lần; sau đó `luatCap = 2`):
 *   1. T = tổng EXP theo đường cũ (đã nạp + dở dang + ống);
 *   2. định giá lại thưởng nấc (`chenhDinhGia`): T ← max(0, T − chênh), rồi CỘNG BÙ Điều 10: T ← T + 60 × `soNgayDatTruocBangGiaMoi` [cả hai TRƯỚC khi rải];
 *   3. hấp thụ A = min(T, 200 × `soNgayCoHocTrongMua`) vào đường mới (như thể mỗi ngày có học em đã ăn đủ 200); phần dư T − A về ống nghiệm;
 *   4. KHÔNG em nào tăng cấp: nếu A đưa em lên cao hơn cấp cũ thì A bị kẹp tới đúng "cuối" cấp cũ (tổng tới cấp cũ + 1 trừ 1), phần thừa về ống và hôm sau nạp tiếp qua cổng `hapThu`
 *      (gặp ở em có ống lớn mà cấp cũ thấp vì chưa nạp, và ở em cấp cũ ≥ 31 khi đường mới rẻ hơn đường cũ);
 *   5. `hapThu` của hôm chuyển = phần A rơi vào riêng hôm nay (≤ 200; 0 nếu `tuyChon.coHocHomNay === false`); ghi `truocSiet` (cấp/EXP/ống cũ, `luc`, `dinhGiaLai`) để lùi được.
 * Idempotent: hồ sơ `luatCap === 2` trả lại nguyên. Tổng EXP sau chuyển (`daHapThu + wallet`) = `tongMoi` = max(0, tongCu − chênh) + bù.
 */
export function chuyenDoiLuatCap<H extends HoSoCu>(hoSoCu: H, soNgayCoHocTrongMua: number, ngayVN: string, tuyChon: { luc?: string; coHocHomNay?: boolean; soNgayDatTruocBangGiaMoi?: number } = {}): KetQuaChuyenDoi<H> {
  if (hoSoCu.luatCap === LUAT_CAP_MOI) return { hoSo: hoSoCu as KetQuaChuyenDoi<H>['hoSo'], daChuyen: false, tongCu: 0, tongMoi: 0, daHapThu: 0, daTruDinhGia: 0, buDatNgay: 0 }
  const capCu = kepCap(hoSoCu.cap)
  const expCu = soNguyen(hoSoCu.exp)
  const wallet = soNguyen(hoSoCu.wallet)
  const tongCu = tongExpTheoDuongCu(capCu, expCu, wallet)
  const chenh = chenhDinhGia(hoSoCu.mastery)
  const bu = BU_DAT_NGAY * soNguyen(tuyChon.soNgayDatTruocBangGiaMoi)
  const tongMoi = Math.max(0, tongCu - chenh) + bu
  const ngay = soNguyen(soNgayCoHocTrongMua)
  let a = Math.min(tongMoi, HAP_THU_DAT * ngay)
  if (capCu < CAP_TOI_DA) a = Math.min(a, tongExpToiCap(capCu + 1) - 1)
  const r = nhanExp({ capDo: 1, exp: 0 }, a)
  const daHomNay = tuyChon.coHocHomNay === false ? 0 : Math.min(HAP_THU_DAT, Math.max(0, a - HAP_THU_DAT * Math.max(0, ngay - 1)))
  const truocSiet: TruocSiet = { cap: capCu, exp: expCu, wallet, luc: tuyChon.luc ?? ngayVN, dinhGiaLai: { chenh, daTru: Math.min(chenh, tongCu) }, buDatNgay: bu }
  const hoSo = { ...hoSoCu, cap: r.capDo, exp: r.exp, wallet: tongMoi - a, hapThu: { ngay: ngayVN, da: daHomNay }, luatCap: LUAT_CAP_MOI, truocSiet }
  return { hoSo, daChuyen: true, tongCu, tongMoi, daHapThu: a, daTruDinhGia: Math.min(chenh, tongCu), buDatNgay: bu }
}
