// HẤP THỤ THEO NGÀY — hàm THUẦN (Code 1, 21/09/2026; thầy chốt 13:36 "CHỐT HẾT BUILD ĐI"; Điều 1 + 2 + 9 của `DE-XUAT-THAN-THU-MOI-NGAY-2109.md`).
//
// Thần thú lên cấp theo NGÀY HỌC ĐỀU, không theo lượng EXP kiếm được: mỗi ngày (giờ Việt Nam) thần thú HẤP THỤ tối đa
//   200 EXP khi em ĐẠT nhiệm vụ ngày · 120 EXP khi em có học nhưng chưa đạt · 0 khi em không học.
// EXP kiếm dư nằm nguyên trong ỐNG NGHIỆM (`wallet`), hôm sau nạp tiếp — không em nào bị vứt công. Vì đường cấp mới tổng 238 200 EXP = 1 191 ngày × 200:
//   SỚM NHẤT cấp 10 là ngày 12 (2 400 EXP) và cấp 120 là ngày 1 191, dù em cày bao nhiêu câu trong một ngày.
// MỘT cổng: mọi nơi làm tăng `cap` / `exp` của hồ sơ game (nạp, quà, Đoàn, legacy…) phải đi qua `hapThu`; máy chủ (Code 3) gọi hàm này, máy em chỉ HIỂN THỊ kết quả máy chủ trả.
//
// Hồ sơ dùng ba trường của hồ sơ game v2: `cap` (1…120), `exp` (EXP đã nạp DỞ DANG trong cấp hiện tại, 0 ≤ exp < thanhExp(cap)), `wallet` (ống nghiệm) và `hapThu` = { ngay, da }
// (số EXP đã hấp thụ trong `ngay`; sang ngày mới `da` coi như 0). Hàm KHÔNG sửa đầu vào, KHÔNG đọc đồng hồ, KHÔNG ngẫu nhiên; chuỗi ngày `YYYY-MM-DD` so sánh bằng `===`.
//
// ══ LUẬT v4 (thầy chốt 29/09/2026, `docs/DE-XUAT-EXP-2909.md`): NẠP TỰ DO ══
// Mọi EXP vào thần thú NGAY lúc ghi sổ qua `nhanTuDo` (không trần nạp, không ống nghiệm, không nút nạp). Lưới an toàn KHOÁ MỐC: muốn lên cấp 10 phải có ≥ 21 ngày đạt nhiệm vụ ngày;
// phần EXP vượt mốc nằm ở `choMoc` ("chờ mốc"), đủ ngày thì vào thú hết — không mất. Hồ sơ v3 (`luatCap = 3`) chuyển MỘT lần bằng `chuyenV3SangV4` (giữ cấp, giữ tiến độ trong thanh
// theo tỉ lệ, nạp ống nghiệm cũ vào đường mới, ghi `truocSiet4` để lùi). Các hàm "hấp thụ theo ngày" bên dưới (`hapThu`, `tranHapThu`, chữ ống nghiệm…) là LỊCH SỬ v3,
// chỉ còn cho chuyển đổi và test cũ — màn và máy chủ không dùng nữa.
//
// ══ LUẬT v5 (THẦY ĐÃ CHỐT 29/09/2026 "build và đẩy luôn", `docs/DE-XUAT-EXP-V5-2909.md`): KHÔNG TRẦN NGÀY + CỔNG NGÀY ĐẠT ══
// Mọi EXP vào thú qua `nhanV5`: thú nhận tới SỨC CHỨA = T(max(cấp, cấp ngày cho phép) + 1) − 1 (thanh đầy, còn thiếu 1 EXP); phần vượt là EXP TRÀN, đổi vàng + mảnh
// theo lợi suất giảm dần trong ngày VN (`vangTranNgay`, `manhTranNgay` — tính trên TỔNG tràn hôm nay, đúc phần chênh ⇒ gọi lại không cộng đôi).
// EXP chờ mốc của v4 (`choMoc`) giữ ở NGĂN RIÊNG: đổ vào thú (trước EXP mới) mỗi khi sức chứa tăng, KHÔNG thành EXP tràn, KHÔNG đúc vàng lần nữa.
// Hồ sơ v4 chuyển MỘT lần bằng `chuyenV4SangV5` (giữ cấp, tiến độ trong thanh theo tỉ lệ, ghi `truocV5` để lùi); hồ sơ cũ hơn đi chuỗi → v3 → v4 → v5 (`chuyenDoiLuatCap`).
// Phần v4 (`nhanTuDo`, `chuyenV3SangV4`, khoá mốc cấp 10) nay là LỊCH SỬ — chỉ còn cho chuỗi chuyển đổi và test cũ.
import { CAP_TOI_DA } from '../game/than-thu-hoa-hoc/hinh-thai'
import { BANG_THANH_EXP_V2_DAU, nhanExp, thanhExp, thanhExpCu, thanhExpV3, thanhExpV4, tongExpToiCap, tongExpToiCapV3, tongExpToiCapV4 } from '../game/than-thu-hoa-hoc/kinh-nghiem'
import { BANG_NGAY_CAP, capChoPhepTheoNgay, manhTranNgay, vangTranNgay } from './kinh-te-game'

/** (LỊCH SỬ v4) Khoá mốc: cấp 10 cần ≥ 21 ngày đạt. Chỉ còn cho `nhanTuDo` trong chuỗi chuyển v3 → v4 → v5. */
export const CAP_KHOA_MOC_V4 = 10
export const NGAY_DAT_MO_CAP_10_V4 = 21

/** Sức hấp thụ của MỘT ngày em đạt nhiệm vụ ngày. */
export const HAP_THU_DAT = 200
/** Sức hấp thụ của một ngày em có học nhưng chưa đạt nhiệm vụ ngày. */
export const HAP_THU_CO_HOC = 120
/** (LỊCH SỬ — v5 BỎ trần game theo ngày.) Điều 9: EXP sinh trong GAME tối đa mỗi ngày VN = đúng mức "có học". Chỉ còn cho hàm lịch sử `tranExpGameNgay` và test cũ. */
export const TRAN_EXP_GAME_NGAY = 120
/** Điều 10: bảng giá EXP học tập mới từ 2026-09-22 nâng thưởng "đạt nhiệm vụ ngày" 20 ⇒ 80; em đã đạt trước mốc được BÙ phần chênh này cho mỗi ngày đạt. */
export const BU_DAT_NGAY = 60
/** Mã luật cấp hiện hành (`luatCap`): 5 = không trần ngày + cổng ngày đạt (29/09 chiều). Hồ sơ khác 5 chuyển MỘT lần khi mở / khi cộng EXP (`chuyenDoiLuatCap`). */
export const LUAT_CAP_MOI = 5
/** Luật cấp v4 (29/09 sáng, nạp tự do + khoá mốc cấp 10) — chỉ để nhận ra hồ sơ cần chuyển. */
export const LUAT_CAP_V4 = 4
/** Luật cấp v3 (21/09, hấp thụ theo ngày) — chỉ để nhận ra hồ sơ cần chuyển. */
export const LUAT_CAP_V3 = 3
/** Ngày sớm nhất tới cấp 10 (v5: D(10) = 21 ngày đạt). */
export const NGAY_SOM_NHAT_CAP_10 = BANG_NGAY_CAP[10]!

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

/** EXP còn cần để ĐẦY cấp 120 từ trạng thái (cap, exp) theo đường v3. 0 khi đã cấp 120. */
function sucChuaDenDinh(cap: number, exp: number): number {
  if (cap >= CAP_TOI_DA) return 0
  let c = -exp
  for (let l = cap; l < CAP_TOI_DA; l++) c += thanhExpV3(l)
  return Math.max(0, c)
}

/** `nhanExp` trên đường v3 (chỉ cho các hàm lịch sử v3 và chuyển đổi cũ). */
export function nhanExpV3(hienTai: { capDo: number; exp: number }, them: number): { capDo: number; exp: number } {
  let capDo = Math.max(1, Math.round(hienTai.capDo))
  let exp = Math.max(0, Math.round(hienTai.exp)) + Math.max(0, Math.round(them))
  while (capDo < CAP_TOI_DA) {
    const can = thanhExpV3(capDo)
    if (can <= 0 || exp < can) break
    exp -= can
    capDo += 1
  }
  if (capDo >= CAP_TOI_DA) exp = 0
  return { capDo, exp }
}

/**
 * CHỮ CHO MÀN (Boss + đề bài Đợt 1; từ chuẩn: "thần thú", "ống nghiệm", "EXP", "ôn lại", "nhiệm vụ ngày"): giọng trung tính, nói thật lý do, có số thật. Code 2 dùng NGUYÊN CHỮ.
 * `tenThu` = tên thú của em (biệt danh hoặc tên loài); `soCauHomNay` = số câu KHÁC NHAU em đã làm hôm nay.
 */
export function chuHapThu(lyDo: Exclude<LyDoHapThu, null>, d: { tenThu: string; soCauHomNay?: number }): string {
  const ten = d.tenThu.trim() || 'Thần thú'
  if (lyDo === 'no') return `Hôm nay ${ten} đã ăn no. EXP còn lại nằm trong ống nghiệm, mai em nạp tiếp.`
  if (lyDo === 'chua_hoc') return `Em làm đủ ${CO_HOC_TOI_THIEU_CAU} câu hôm nay rồi cho ${ten} ăn nhé · em đã làm ${soNguyen(d.soCauHomNay)} câu.`
  if (lyDo === 'het_ong') return 'Ống nghiệm của em đang hết EXP. Em làm bài tập về nhà hoặc phần ôn lại để có thêm EXP.'
  return `${ten} đã đạt cấp tối đa 120.`
}
/** Dòng nhắc khi em CÓ HỌC nhưng chưa đạt nhiệm vụ ngày (trần hôm nay 120): đạt thì thú ăn thêm phần chênh (80 EXP). */
export const chuChuaDatNhiemVu = (tenThu: string): string => `Đạt nhiệm vụ ngày hôm nay thì ${tenThu.trim() || 'thần thú'} ăn được thêm ${HAP_THU_DAT - HAP_THU_CO_HOC} EXP.`
/** Thanh nhỏ cạnh nút nạp: "Hôm nay {tên thú} đã hấp thụ 120 / 200 EXP". */
export const chuThanhHapThu = (tenThu: string, da: number, tran: number): string => `Hôm nay ${tenThu.trim() || 'thần thú'} đã hấp thụ ${soNguyen(da)} / ${soNguyen(tran)} EXP`

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
  const r = nhanExpV3({ capDo: cap, exp }, daNap)
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
export function chuyenDoiSangV3<H extends HoSoCu>(hoSoCu: H, soNgayCoHocTrongMua: number, ngayVN: string, tuyChon: { luc?: string; coHocHomNay?: boolean; soNgayDatTruocBangGiaMoi?: number } = {}): KetQuaChuyenDoi<H> {
  if (hoSoCu.luatCap === LUAT_CAP_V3 || hoSoCu.luatCap === LUAT_CAP_V4 || hoSoCu.luatCap === LUAT_CAP_MOI) return { hoSo: hoSoCu as KetQuaChuyenDoi<H>['hoSo'], daChuyen: false, tongCu: 0, tongMoi: 0, daHapThu: 0, daTruDinhGia: 0, buDatNgay: 0 }
  // V2 -> V3: giữ cấp, trả chênh lệch giá và phần thanh dư về ví.
  // Không tạo EXP, không dùng lại hạn mức hấp thụ của ngày chuyển.
  if (hoSoCu.luatCap === 2) {
    const cap = kepCap(hoSoCu.cap), exp = soNguyen(hoSoCu.exp)
    let chenh = 0
    for (let c = 1; c < Math.min(cap, 10); c++) chenh += BANG_THANH_EXP_V2_DAU[c - 1]! - thanhExpV3(c)
    const expMoi = cap >= CAP_TOI_DA ? 0 : Math.min(exp, thanhExpV3(cap) - 1)
    const traVi = chenh + exp - expMoi
    const tongCu = tongExpToiCapV3(cap) + chenh + exp + soNguyen(hoSoCu.wallet)
    const hoSo = { ...hoSoCu, exp: expMoi, wallet: soNguyen(hoSoCu.wallet) + traVi, luatCap: LUAT_CAP_V3 }
    return { hoSo: hoSo as KetQuaChuyenDoi<H>['hoSo'], daChuyen: true, tongCu, tongMoi: tongCu, daHapThu: tongExpToiCapV3(cap) + expMoi, daTruDinhGia: 0, buDatNgay: 0 }
  }
  const capCu = kepCap(hoSoCu.cap)
  const expCu = soNguyen(hoSoCu.exp)
  const wallet = soNguyen(hoSoCu.wallet)
  const tongCu = tongExpTheoDuongCu(capCu, expCu, wallet)
  const chenh = chenhDinhGia(hoSoCu.mastery)
  const bu = BU_DAT_NGAY * soNguyen(tuyChon.soNgayDatTruocBangGiaMoi)
  const tongMoi = Math.max(0, tongCu - chenh) + bu
  const ngay = soNguyen(soNgayCoHocTrongMua)
  let a = Math.min(tongMoi, HAP_THU_DAT * ngay)
  if (capCu < CAP_TOI_DA) a = Math.min(a, tongExpToiCapV3(capCu + 1) - 1)
  const r = nhanExpV3({ capDo: 1, exp: 0 }, a)
  const daHomNay = tuyChon.coHocHomNay === false ? 0 : Math.min(HAP_THU_DAT, Math.max(0, a - HAP_THU_DAT * Math.max(0, ngay - 1)))
  const truocSiet: TruocSiet = { cap: capCu, exp: expCu, wallet, luc: tuyChon.luc ?? ngayVN, dinhGiaLai: { chenh, daTru: Math.min(chenh, tongCu) }, buDatNgay: bu }
  const hoSo = { ...hoSoCu, cap: r.capDo, exp: r.exp, wallet: tongMoi - a, hapThu: { ngay: ngayVN, da: daHomNay }, luatCap: LUAT_CAP_V3, truocSiet }
  return { hoSo, daChuyen: true, tongCu, tongMoi, daHapThu: a, daTruDinhGia: Math.min(chenh, tongCu), buDatNgay: bu }
}

// ══════════════════════════════ LUẬT v4 — NẠP TỰ DO + KHOÁ MỐC (29/09) ══════════════════════════════

export interface HoSoTuDo extends HoSoCapExp {
  /** EXP chờ mốc: đã kiếm, đã ghi sổ, nhưng thú chưa được lên cấp 10 vì chưa đủ ngày đạt. Vắng = 0. */
  choMoc?: number
}

export interface KetQuaNhanTuDo<H extends HoSoTuDo> {
  /** Hồ sơ sau khi nhận (đầu vào KHÔNG bị sửa). Không có gì để nhận ⇒ CHÍNH đầu vào. */
  hoSo: H
  /** EXP vừa vào thú (kể cả phần chờ mốc vừa được mở). */
  daVao: number
  /** EXP còn chờ mốc sau lần này. */
  choMoc: number
  /** Số cấp vừa lên. */
  soCapLen: number
}

/** Khoá mốc còn chặn hồ sơ này không: thú chưa tới cấp 10 và em chưa đủ 21 ngày đạt. Em đã ở cấp ≥ 10 (kể cả theo đường cũ) thì không bị chặn. */
export const dangKhoaMoc = (cap: number, soNgayDat: number): boolean => kepCap(cap) < CAP_KHOA_MOC_V4 && soNguyen(soNgayDat) < NGAY_DAT_MO_CAP_10_V4

/** `nhanExp` trên đường v4 (chỉ cho `nhanTuDo` lịch sử trong chuỗi chuyển đổi). */
function nhanExpV4(hienTai: { capDo: number; exp: number }, them: number): { capDo: number; exp: number; soCapLen: number } {
  let capDo = Math.max(1, Math.round(hienTai.capDo))
  let exp = Math.max(0, Math.round(hienTai.exp)) + Math.max(0, Math.round(them))
  let soCapLen = 0
  while (capDo < CAP_TOI_DA) {
    const can = thanhExpV4(capDo)
    if (can <= 0 || exp < can) break
    exp -= can
    capDo += 1
    soCapLen += 1
  }
  if (capDo >= CAP_TOI_DA) exp = 0
  return { capDo, exp, soCapLen }
}

/**
 * NHẬN EXP TỰ DO (luật v4): `them` EXP (cộng phần đang chờ mốc) vào thú ngay. Chưa đủ `NGAY_DAT_MO_CAP_10` ngày đạt ⇒ thú dừng ở CUỐI cấp 9
 * (tổng tới cấp 10 − 1), phần vượt nằm ở `choMoc`. Đủ ngày ⇒ vào hết (gọi với `them = 0` để mở phần chờ). Cấp 120: EXP chỉ ghi sổ (thú đầy), `choMoc` về 0.
 */
export function nhanTuDo<H extends HoSoTuDo>(hoSo: H, them: number, soNgayDat: number): KetQuaNhanTuDo<H> {
  const cap = kepCap(hoSo.cap)
  const exp = soNguyen(hoSo.exp)
  const cho = soNguyen(hoSo.choMoc)
  const tong = soNguyen(them) + cho
  if (tong <= 0) return { hoSo, daVao: 0, choMoc: 0, soCapLen: 0 }
  if (cap >= CAP_TOI_DA) return { hoSo: { ...hoSo, cap, exp: 0, choMoc: 0 }, daVao: 0, choMoc: 0, soCapLen: 0 }
  let vao = tong
  if (dangKhoaMoc(cap, soNgayDat)) vao = Math.min(tong, Math.max(0, tongExpToiCapV4(CAP_KHOA_MOC_V4) - 1 - (tongExpToiCapV4(cap) + exp)))
  const conCho = tong - vao
  const r = nhanExpV4({ capDo: cap, exp }, vao)
  return { hoSo: { ...hoSo, cap: r.capDo, exp: r.exp, choMoc: conCho }, daVao: vao, choMoc: conCho, soCapLen: r.soCapLen }
}

/** Dấu vết trước khi sang v4 (để lùi): cấp, EXP trong thanh, ống nghiệm, EXP đã kiếm lúc chuyển. */
export interface TruocSiet4 {
  cap: number
  exp: number
  wallet: number
  earned: number
  luc: string
}

export interface HoSoV3 extends HoSoTuDo {
  luatCap?: number
  earned?: number
  truocSiet4?: TruocSiet4
  mocVang?: number
}

export interface KetQuaV3SangV4<H extends HoSoV3> {
  hoSo: H & { luatCap: number }
  /** `false` ⇒ hồ sơ đã ở v4, trả lại CHÍNH đầu vào (gọi lại không nạp đôi). */
  daChuyen: boolean
  /** EXP ống nghiệm cũ đã nạp vào đường mới (gồm cả phần đang chờ mốc). */
  ongDaNap: number
}

/**
 * CHUYỂN hồ sơ v3 → v4 (MỘT lần; chỉ-thêm trường, không ai tụt cấp):
 *   1. giữ nguyên cấp; tiến độ trong thanh theo tỉ lệ `floor(exp_cũ / thanhV3(cấp) × thanhV4(cấp))` (kẹp < thanh mới);
 *   2. ống nghiệm cũ (`wallet`) nạp hết vào đường mới qua `nhanTuDo` (không trần; chưa đủ 21 ngày đạt thì phần vượt cấp 10 "chờ mốc"); `wallet` = 0;
 *   3. KHÔNG đúc vàng cho EXP cũ: `mocVang = earned` lúc chuyển (vàng chỉ tính trên EXP kiếm từ nay);
 *   4. ghi `truocSiet4` (cấp, EXP, ống, earned, lúc) để lùi được; `hapThu` cũ bỏ đi. Vàng, mảnh, khiên, đồ không đụng.
 * Idempotent: hồ sơ `luatCap === 4` trả lại nguyên.
 */
export function chuyenV3SangV4<H extends HoSoV3>(hoSoCu: H, soNgayDat: number, luc: string): KetQuaV3SangV4<H> {
  if (hoSoCu.luatCap === LUAT_CAP_V4 || hoSoCu.luatCap === LUAT_CAP_MOI) return { hoSo: hoSoCu as KetQuaV3SangV4<H>['hoSo'], daChuyen: false, ongDaNap: 0 }
  const cap = kepCap(hoSoCu.cap)
  const expCu = soNguyen(hoSoCu.exp)
  const wallet = soNguyen(hoSoCu.wallet)
  const earned = soNguyen(hoSoCu.earned)
  const thanhCu = thanhExpV3(cap), thanhMoi = thanhExpV4(cap)
  const expMoi = cap >= CAP_TOI_DA || thanhCu <= 0 ? 0 : Math.min(thanhMoi - 1, Math.floor((Math.min(expCu, thanhCu) / thanhCu) * thanhMoi))
  const giu = { ...hoSoCu } as Record<string, unknown>
  delete giu.hapThu
  const truoc = { ...giu, cap, exp: expMoi, wallet: 0, choMoc: 0, luatCap: LUAT_CAP_V4, mocVang: earned, truocSiet4: { cap, exp: expCu, wallet, earned, luc } } as unknown as H
  const r = nhanTuDo(truoc, wallet, soNgayDat)
  return { hoSo: r.hoSo as KetQuaV3SangV4<H>['hoSo'], daChuyen: true, ongDaNap: wallet }
}


// ══════════════════════════════ LUẬT v5 — KHÔNG TRẦN NGÀY + CỔNG NGÀY ĐẠT (29/09 chiều) ══════════════════════════════

/** EXP tràn của hồ sơ: hôm nay (`ngay`, `exp`, đã đúc `vang`/`manh`) và luỹ kế (`tongExp` trừ khỏi vàng thường, `tongVang` cộng vào vàng đáng đúc, `tongManh` đã cộng vào mảnh). */
export interface TranV5 {
  ngay: string
  exp: number
  vang: number
  manh: number
  tongExp: number
  tongVang: number
  tongManh: number
}

export interface HoSoV5 extends HoSoCapExp {
  /** Ngăn riêng: EXP chờ mốc của v4, đổ vào thú khi sức chứa tăng; không thành EXP tràn. */
  choMoc?: number
  tranV5?: TranV5
}

export interface KetQuaNhanV5<H extends HoSoV5> {
  /** Hồ sơ sau khi nhận (đầu vào KHÔNG bị sửa). Không có gì đổi ⇒ CHÍNH đầu vào. */
  hoSo: H
  /** EXP vừa vào thú (kể cả phần ngăn chờ vừa đổ vào). */
  daVao: number
  /** EXP tràn của lần này (thú đã đầy thanh mà chưa đủ ngày đạt, hoặc đã cấp 120). */
  tran: number
  /** Vàng tràn / mảnh tràn ĐÚC THÊM ở lần này (phần chênh của tổng hôm nay). */
  vangTran: number
  manhTran: number
  soCapLen: number
  /** EXP còn trong ngăn chờ (v4) sau lần này. */
  choMoc: number
}

/** Tổng EXP trong thú của (cấp, EXP trong thanh) theo đường v5. */
export const tongTrongThuV5 = (cap: number, exp: number): number => tongExpToiCap(kepCap(cap)) + soNguyen(exp)

/**
 * SỨC CHỨA (v5): tổng EXP tối đa thú giữ được = T(cN + 1) − 1, cN = max(cấp hiện tại, cấp mà số ngày đạt cho phép). Cấp 120 (hoặc cN = 120) ⇒ T(120).
 * Em đang ở cấp cao hơn số ngày cho phép (lên theo đường cũ) vẫn giữ cấp và được làm đầy thanh hiện tại; cổng ngày chỉ chặn lần lên cấp tiếp theo.
 */
export function sucChuaV5(cap: number, soNgayDat: number): number {
  const cN = Math.max(kepCap(cap), capChoPhepTheoNgay(soNgayDat))
  return cN >= CAP_TOI_DA ? tongExpToiCap(CAP_TOI_DA) : tongExpToiCap(cN + 1) - 1
}

/** Thú đã đầy thanh và đang CHỜ NGÀY ĐẠT để lên cấp (không phải cấp 120). */
export const dangChoNgayV5 = (cap: number, exp: number, soNgayDat: number): boolean =>
  kepCap(cap) < CAP_TOI_DA && tongTrongThuV5(cap, exp) >= sucChuaV5(cap, soNgayDat)

/** Số ngày đạt còn thiếu để thú lên cấp kế tiếp (0 = đủ ngày hoặc đã cấp 120). */
export const ngayConThieuLenCap = (cap: number, soNgayDat: number): number =>
  kepCap(cap) >= CAP_TOI_DA ? 0 : Math.max(0, (BANG_NGAY_CAP[kepCap(cap) + 1] ?? 0) - soNguyen(soNgayDat))

/**
 * NHẬN EXP (luật v5): ngăn chờ v4 (`choMoc`) đổ vào trước, rồi `them` EXP mới — tới sức chứa (`sucChuaV5`). Phần EXP mới vượt sức chứa là EXP TRÀN:
 * cộng vào tổng tràn HÔM NAY (`ngayVN`) và đúc phần chênh `vangTranNgay(tổng) − đã đúc`, `manhTranNgay(tổng) − đã đúc` (sang ngày mới lợi suất tốt trở lại).
 * Gọi với `them = 0` để đổ ngăn chờ khi số ngày đạt vừa tăng. Hàm KHÔNG sửa đầu vào, KHÔNG đọc đồng hồ.
 */
export function nhanV5<H extends HoSoV5>(hoSo: H, them: number, soNgayDat: number, ngayVN: string): KetQuaNhanV5<H> {
  const cap = kepCap(hoSo.cap)
  const exp = cap >= CAP_TOI_DA ? 0 : Math.min(soNguyen(hoSo.exp), Math.max(0, thanhExp(cap) - 1))
  const cho = soNguyen(hoSo.choMoc)
  const moi = soNguyen(them)
  const conCho = Math.max(0, sucChuaV5(cap, soNgayDat) - tongTrongThuV5(cap, exp))
  const voNgan = Math.min(cho, conCho)
  const vaoMoi = Math.min(moi, conCho - voNgan)
  const tran = moi - vaoMoi
  const daVao = voNgan + vaoMoi
  if (daVao === 0 && tran === 0) return { hoSo, daVao: 0, tran: 0, vangTran: 0, manhTran: 0, soCapLen: 0, choMoc: cho }
  const r = nhanExp({ capDo: cap, exp }, daVao)
  let tranV5 = hoSo.tranV5
  let vangTran = 0, manhTran = 0
  if (tran > 0) {
    const cu: TranV5 = tranV5 ?? { ngay: ngayVN, exp: 0, vang: 0, manh: 0, tongExp: 0, tongVang: 0, tongManh: 0 }
    const homNay = cu.ngay === ngayVN ? cu : { ...cu, ngay: ngayVN, exp: 0, vang: 0, manh: 0 }
    const expNgay = soNguyen(homNay.exp) + tran
    vangTran = Math.max(0, vangTranNgay(expNgay) - soNguyen(homNay.vang))
    manhTran = Math.max(0, manhTranNgay(expNgay) - soNguyen(homNay.manh))
    tranV5 = {
      ngay: ngayVN, exp: expNgay, vang: soNguyen(homNay.vang) + vangTran, manh: soNguyen(homNay.manh) + manhTran,
      tongExp: soNguyen(cu.tongExp) + tran, tongVang: soNguyen(cu.tongVang) + vangTran, tongManh: soNguyen(cu.tongManh) + manhTran,
    }
  }
  const hoSoMoi = { ...hoSo, cap: r.capDo, exp: r.exp, choMoc: cho - voNgan, ...(tranV5 ? { tranV5 } : {}) }
  return { hoSo: hoSoMoi, daVao, tran, vangTran, manhTran, soCapLen: r.soCapLen, choMoc: cho - voNgan }
}

/** Dấu vết trước khi sang v5 (để lùi): cấp, EXP trong thanh (v4), EXP chờ mốc, EXP đã kiếm, mốc vàng, lúc chuyển. Vàng/mảnh/khiên ở sổ và hồ sơ KHÔNG đổi. */
export interface TruocV5 {
  cap: number
  exp: number
  choMoc: number
  earned: number
  mocVang: number | null
  luc: string
}

export interface HoSoV4 extends HoSoV5 {
  luatCap?: number
  earned?: number
  mocVang?: number
  truocV5?: TruocV5
}

export interface KetQuaV4SangV5<H extends HoSoV4> {
  hoSo: H & { luatCap: number }
  /** `false` ⇒ hồ sơ đã ở v5, trả lại CHÍNH đầu vào (gọi lại không đổi gì). */
  daChuyen: boolean
}

/**
 * CHUYỂN hồ sơ v4 → v5 (MỘT lần; chỉ-thêm trường, không ai tụt cấp):
 *   1. giữ nguyên cấp; tiến độ trong thanh theo tỉ lệ `⌊exp_cũ / thanhV4(cấp) · thanhV5(cấp)⌋` (kẹp < thanh mới). Cổng ngày chỉ áp cho lần lên cấp tiếp theo;
 *   2. EXP chờ mốc (`choMoc`) giữ NGUYÊN trong ngăn riêng (đổ vào thú khi sức chứa tăng, không thành EXP tràn, không đúc vàng lần nữa);
 *   3. vàng, mảnh, khiên, đồ, `earned`, `mocVang` KHÔNG đụng ⇒ vàng đáng đúc liền mạch (`vangDangDuc` của v5 = v4 khi chưa có EXP tràn);
 *   4. ghi `truocV5` để lùi. Idempotent: hồ sơ `luatCap === 5` trả lại nguyên.
 */
export function chuyenV4SangV5<H extends HoSoV4>(hoSoCu: H, luc: string): KetQuaV4SangV5<H> {
  if (hoSoCu.luatCap === LUAT_CAP_MOI) return { hoSo: hoSoCu as KetQuaV4SangV5<H>['hoSo'], daChuyen: false }
  const cap = kepCap(hoSoCu.cap)
  const expCu = soNguyen(hoSoCu.exp)
  const thanhCu = thanhExpV4(cap), thanhMoi = thanhExp(cap)
  const expMoi = cap >= CAP_TOI_DA || thanhCu <= 0 || thanhMoi <= 0 ? 0 : Math.min(thanhMoi - 1, Math.floor((Math.min(expCu, thanhCu) / thanhCu) * thanhMoi))
  const cho = soNguyen(hoSoCu.choMoc)
  const mocVang = typeof hoSoCu.mocVang === 'number' && Number.isFinite(hoSoCu.mocVang) ? hoSoCu.mocVang : null
  const truocV5: TruocV5 = { cap, exp: expCu, choMoc: cho, earned: soNguyen(hoSoCu.earned), mocVang, luc }
  const hoSo = { ...hoSoCu, cap, exp: expMoi, choMoc: cho, luatCap: LUAT_CAP_MOI, truocV5 }
  return { hoSo: hoSo as KetQuaV4SangV5<H>['hoSo'], daChuyen: true }
}

/**
 * CHUYỂN hồ sơ bất kỳ sang luật hiện hành (v5): cũ hơn v3 → `chuyenDoiSangV3` (đường 21/09) → `chuyenV3SangV4` → `chuyenV4SangV5`; v3 → v4 → v5; v4 → v5.
 * `tuyChon.soNgayDat` = số ngày đạt (cho khoá mốc của bước v3 → v4 lịch sử). Idempotent: hồ sơ v5 trả lại nguyên (`daChuyen: false`).
 */
export function chuyenDoiLuatCap<H extends HoSoCu & HoSoV3 & HoSoV4>(hoSoCu: H, soNgayCoHocTrongMua: number, ngayVN: string, tuyChon: { luc?: string; coHocHomNay?: boolean; soNgayDatTruocBangGiaMoi?: number; soNgayDat?: number } = {}): KetQuaChuyenDoi<H> {
  if (hoSoCu.luatCap === LUAT_CAP_MOI) return { hoSo: hoSoCu as KetQuaChuyenDoi<H>['hoSo'], daChuyen: false, tongCu: 0, tongMoi: 0, daHapThu: 0, daTruDinhGia: 0, buDatNgay: 0 }
  const luc = tuyChon.luc ?? ngayVN
  const v3 = hoSoCu.luatCap === LUAT_CAP_V3 || hoSoCu.luatCap === LUAT_CAP_V4 ? null : chuyenDoiSangV3(hoSoCu, soNgayCoHocTrongMua, ngayVN, tuyChon)
  const goc3 = (v3 ? v3.hoSo : hoSoCu) as H
  const goc4 = (goc3.luatCap === LUAT_CAP_V4 ? goc3 : chuyenV3SangV4(goc3, soNguyen(tuyChon.soNgayDat), luc).hoSo) as H
  const r = chuyenV4SangV5(goc4, luc)
  const hoSo = r.hoSo as unknown as KetQuaChuyenDoi<H>['hoSo']
  if (v3) return { ...v3, hoSo, daChuyen: true }
  const tong = hoSoCu.luatCap === LUAT_CAP_V4
    ? tongExpToiCapV4(kepCap(hoSoCu.cap)) + soNguyen(hoSoCu.exp) + soNguyen(hoSoCu.choMoc)
    : tongExpToiCapV3(kepCap(hoSoCu.cap)) + soNguyen(hoSoCu.exp) + soNguyen(hoSoCu.wallet)
  return { hoSo, daChuyen: true, tongCu: tong, tongMoi: tong, daHapThu: tongExpToiCap(hoSo.cap) + soNguyen(hoSo.exp), daTruDinhGia: 0, buDatNgay: 0 }
}
