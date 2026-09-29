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
import { CAP_TOI_DA } from '../game/than-thu-hoa-hoc/hinh-thai'
import { BANG_THANH_EXP_V2_DAU, nhanExp, thanhExp, thanhExpCu, thanhExpV3, tongExpToiCap, tongExpToiCapV3 } from '../game/than-thu-hoa-hoc/kinh-nghiem'
import { CAP_KHOA_MOC, NGAY_DAT_MO_CAP_10 } from './kinh-te-game'

/** Sức hấp thụ của MỘT ngày em đạt nhiệm vụ ngày. */
export const HAP_THU_DAT = 200
/** Sức hấp thụ của một ngày em có học nhưng chưa đạt nhiệm vụ ngày. */
export const HAP_THU_CO_HOC = 120
/** Điều 9: EXP sinh trong GAME (nấc dạng, thử thách, tiếp sức, kết chặng, vỡ giáp…) tối đa mỗi ngày VN = đúng mức "có học". EXP học tập không bị trần. */
export const TRAN_EXP_GAME_NGAY = 120
/** Điều 10: bảng giá EXP học tập mới từ 2026-09-22 nâng thưởng "đạt nhiệm vụ ngày" 20 ⇒ 80; em đã đạt trước mốc được BÙ phần chênh này cho mỗi ngày đạt. */
export const BU_DAT_NGAY = 60
/** Mã luật cấp hiện hành (`luatCap`): 4 = nạp tự do (29/09). Hồ sơ khác 4 chuyển MỘT lần khi mở / khi cộng EXP (`chuyenDoiLuatCap`). */
export const LUAT_CAP_MOI = 4
/** Luật cấp v3 (21/09, hấp thụ theo ngày) — chỉ để nhận ra hồ sơ cần chuyển. */
export const LUAT_CAP_V3 = 3
/** Ngày sớm nhất tới cấp 10 (khoá mốc: cần 21 ngày đạt). */
export const NGAY_SOM_NHAT_CAP_10 = NGAY_DAT_MO_CAP_10

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
  if (hoSoCu.luatCap === LUAT_CAP_V3 || hoSoCu.luatCap === LUAT_CAP_MOI) return { hoSo: hoSoCu as KetQuaChuyenDoi<H>['hoSo'], daChuyen: false, tongCu: 0, tongMoi: 0, daHapThu: 0, daTruDinhGia: 0, buDatNgay: 0 }
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
export const dangKhoaMoc = (cap: number, soNgayDat: number): boolean => kepCap(cap) < CAP_KHOA_MOC && soNguyen(soNgayDat) < NGAY_DAT_MO_CAP_10

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
  if (dangKhoaMoc(cap, soNgayDat)) vao = Math.min(tong, Math.max(0, tongExpToiCap(CAP_KHOA_MOC) - 1 - (tongExpToiCap(cap) + exp)))
  const conCho = tong - vao
  const r = nhanExp({ capDo: cap, exp }, vao)
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
  if (hoSoCu.luatCap === LUAT_CAP_MOI) return { hoSo: hoSoCu as KetQuaV3SangV4<H>['hoSo'], daChuyen: false, ongDaNap: 0 }
  const cap = kepCap(hoSoCu.cap)
  const expCu = soNguyen(hoSoCu.exp)
  const wallet = soNguyen(hoSoCu.wallet)
  const earned = soNguyen(hoSoCu.earned)
  const thanhCu = thanhExpV3(cap), thanhMoi = thanhExp(cap)
  const expMoi = cap >= CAP_TOI_DA || thanhCu <= 0 ? 0 : Math.min(thanhMoi - 1, Math.floor((Math.min(expCu, thanhCu) / thanhCu) * thanhMoi))
  const giu = { ...hoSoCu } as Record<string, unknown>
  delete giu.hapThu
  const truoc = { ...giu, cap, exp: expMoi, wallet: 0, choMoc: 0, luatCap: LUAT_CAP_MOI, mocVang: earned, truocSiet4: { cap, exp: expCu, wallet, earned, luc } } as unknown as H
  const r = nhanTuDo(truoc, wallet, soNgayDat)
  return { hoSo: r.hoSo as KetQuaV3SangV4<H>['hoSo'], daChuyen: true, ongDaNap: wallet }
}

/**
 * CHUYỂN hồ sơ bất kỳ sang luật hiện hành (v4): hồ sơ cũ hơn v3 đi qua `chuyenDoiSangV3` (đường 21/09) rồi `chuyenV3SangV4`.
 * `tuyChon.soNgayDat` = số ngày đạt nhiệm vụ ngày của em (cho khoá mốc). Idempotent: hồ sơ v4 trả lại nguyên (`daChuyen: false`).
 */
export function chuyenDoiLuatCap<H extends HoSoCu & HoSoV3>(hoSoCu: H, soNgayCoHocTrongMua: number, ngayVN: string, tuyChon: { luc?: string; coHocHomNay?: boolean; soNgayDatTruocBangGiaMoi?: number; soNgayDat?: number } = {}): KetQuaChuyenDoi<H> {
  if (hoSoCu.luatCap === LUAT_CAP_MOI) return { hoSo: hoSoCu as KetQuaChuyenDoi<H>['hoSo'], daChuyen: false, tongCu: 0, tongMoi: 0, daHapThu: 0, daTruDinhGia: 0, buDatNgay: 0 }
  const v3 = hoSoCu.luatCap === LUAT_CAP_V3 ? null : chuyenDoiSangV3(hoSoCu, soNgayCoHocTrongMua, ngayVN, tuyChon)
  const goc = (v3 ? v3.hoSo : hoSoCu) as H
  const r = chuyenV3SangV4(goc, soNguyen(tuyChon.soNgayDat), tuyChon.luc ?? ngayVN)
  const hoSo = r.hoSo as unknown as KetQuaChuyenDoi<H>['hoSo']
  if (v3) return { ...v3, hoSo, daChuyen: true }
  const tong = tongExpToiCapV3(kepCap(hoSoCu.cap)) + soNguyen(hoSoCu.exp) + soNguyen(hoSoCu.wallet)
  return { hoSo, daChuyen: true, tongCu: tong, tongMoi: tong, daHapThu: tongExpToiCap(hoSo.cap) + soNguyen(hoSo.exp), daTruDinhGia: 0, buDatNgay: 0 }
}
