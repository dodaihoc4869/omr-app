/**
 * KINH NGHIỆM — MỘT NGUỒN SỰ THẬT.
 *
 * Thầy chốt 14-09: **hết thanh thì phải đi kiếm theo hệ thống game**, không có
 * nút bấm phát ra EXP.
 *
 * NHỊP GAME — tính từ nhịp thật của trung tâm, không ước chừng.
 * Một học kỳ 18 tuần, 1 ca thi và 2 bài tập mỗi tuần, 40 câu một ca, sai 30%,
 * trong đó ~60% là câu phần I đưa được vào game và em chăm sửa được ~60% số đó:
 *
 *   18 ca thi 7 điểm      7 560 EXP
 *   36 bài tập về nhà     7 200 EXP
 *   78 câu sai sửa xong   7 776 EXP
 *   ───────────────────────────────
 *   một học kỳ           22 536 EXP
 *
 * Chốt cả đường cấp 1 → 12 ở **15 120 EXP**, tức **67% một học kỳ** — khoảng
 * 12 tuần học đều. Đủ xa để cấp 12 là phần thưởng, đủ gần để thấy được đích.
 *
 * Lịch sử hai lần chỉnh: 2000 (14-09) cho 57 520 EXP — hai học kỳ rưỡi, quá xa;
 * 240 (15-09) cho 6 890 EXP — một tháng rưỡi là hết hình thái, quá gần.
 *
 * Nghĩa là mọi điểm kinh nghiệm phải đổi bằng một VIỆC HỌC THẬT: leo tháp,
 * sửa câu sai, nộp bài, thi. Nút "nạp năng lượng" cho không EXP đã bị bỏ —
 * nó biến trục tiến bộ của game thành trò bấm nút, không dính gì tới việc học.
 */
/*
 * ĐƯỜNG CẤP MỚI (thầy chốt 21/09/2026 13:36, Điều 1 của `DE-XUAT-THAN-THU-MOI-NGAY-2109.md`): lên cấp theo NGÀY HỌC ĐỀU.
 * Mỗi ngày thần thú hấp thụ tối đa 200 EXP (khi em đạt nhiệm vụ ngày; 120 khi chỉ có học; 0 khi không học — xem `src/lib/hap-thu-ngay.ts`), nên đường 238 200 EXP
 * = 1 191 ngày × 200: SỚM NHẤT cấp 10 là ngày 12 (2 400 EXP) và cấp 120 là ngày 1 191 (238 200 EXP), dù em kiếm EXP nhanh cỡ nào.
 * `thanhExp` tra BẢNG 119 số viết thẳng (không tính mũ) để máy chủ và máy em ra CÙNG một số, không lệch làm tròn. Chín thanh đầu: 120 · 150 · 180 · 220 · 260 ·
 * 300 · 350 · 390 · 430 (tổng 2 400); từ cấp 10 mỗi cấp ~5 ngày, cuối đường ~20 ngày một cấp; thanh không bao giờ ngắn lại.
 * Đường CŨ (ba đoạn 120 × 1,10 → dốc 1,55 → dài 1,037, tổng 1 286 590 EXP) giữ dưới tên `thanhExpCu`, CHỈ để chuyển đổi hồ sơ đã chơi (`chuyenDoiLuatCap`).
 * Chú thích "ĐƯỜNG EXP 120 CẤP — BA ĐOẠN" bên dưới là lịch sử của đường cũ.
 */
import { CAP_TOI_DA, type CapTienHoa } from './hinh-thai'

/**
 * (LỊCH SỬ — ĐƯỜNG CŨ, nay chỉ còn ở `thanhExpCu`.) ĐƯỜNG EXP 120 CẤP — BA ĐOẠN, khớp đúng hai mốc thầy chốt 15-09:
 * *"độ khó phải rõ ràng từ cấp số 10, từ số 13 trở đi là phải lâu mới lên
 * được cấp rồi"*.
 *
 *   cấp 1–9    120 × 1,10^(c−1)        khởi động nhanh: 120 → 260
 *   cấp 10–12  … × 1,55^(c−9)          DỐC HẲN: 400 → 620 → 960
 *   cấp 13–119 … × 1,037^(c−12)        LÂU DẦN: 990 → … → 46 740
 *
 * Tổng tới cấp 120 = 1 286 590 EXP (đường 12 cấp cũ chỉ 15 120).
 *
 * MỘT CHỦ Ý PHẢI GIỮ: em nào đang tối đa cấp 12 hôm nay, sau lượt reset leo
 * lại tới cấp 12 chỉ tốn 3 610 EXP — NHANH HƠN bây giờ (15 120). Reset không
 * được làm em nản ngay tuần đầu; đường dài nằm ở phía sau cấp 13.
 */
export const EXP_BAN_DAU = 120

/** Hệ số ba đoạn của đường CŨ (chỉ `thanhExpCu` dùng; đường mới là `BANG_THANH_EXP`). */
export const HE_SO_DOAN_DAU = 1.10
export const HE_SO_DOAN_DOC = 1.55
export const HE_SO_DOAN_DAI = 1.037
/** Cấp bắt đầu đoạn dốc, và cấp bắt đầu đoạn dài. */
export const CAP_DOC = 10
export const CAP_DAI = 13

/**
 * BẢNG THANH EXP — 119 số viết thẳng: `BANG_THANH_EXP[c − 1]` là EXP để đi từ cấp `c` lên cấp `c + 1` (c = 1…119). Tổng đúng 238 200; 9 số đầu tổng 2 400; không giảm.
 * Đổi một số ở đây là đổi cả nhịp game (test khoá tổng, mốc ngày 12 / 1 191 và từng số).
 */
export const BANG_THANH_EXP_V2_DAU = [160, 200, 250, 320, 400, 500, 620, 780, 970] as const
export const BANG_THANH_EXP: readonly number[] = [
  120, 150, 180, 220, 260, 300, 350, 390, 430, 1000,
  1010, 1030, 1040, 1050, 1060, 1080, 1090, 1110, 1120, 1130,
  1150, 1160, 1180, 1190, 1210, 1220, 1240, 1250, 1270, 1290,
  1300, 1320, 1330, 1350, 1370, 1390, 1400, 1420, 1440, 1460,
  1480, 1490, 1510, 1530, 1550, 1570, 1590, 1610, 1630, 1650,
  1670, 1690, 1720, 1740, 1760, 1780, 1800, 1830, 1850, 1870,
  1900, 1920, 1950, 1970, 1990, 2020, 2050, 2070, 2100, 2120,
  2150, 2180, 2210, 2230, 2260, 2290, 2320, 2350, 2380, 2410,
  2440, 2470, 2500, 2530, 2560, 2600, 2630, 2660, 2700, 2730,
  2760, 2800, 2840, 2870, 2910, 2940, 2980, 3020, 3060, 3100,
  3130, 3170, 3210, 3260, 3300, 3340, 3380, 3420, 3470, 3510,
  3550, 3600, 3640, 3690, 3740, 3780, 3830, 3880, 3950,
]

/**
 * Thanh EXP của một cấp (đường MỚI, tra bảng). Cấp 120 là tối đa nên trả 0 — hết đường lên. Cấp lẻ được làm tròn, cấp < 1 tính như cấp 1.
 */
export function thanhExp(cap: number): number {
  if (cap >= CAP_TOI_DA) return 0
  const c = Math.max(1, Math.round(cap))
  if (c >= CAP_TOI_DA) return 0
  return BANG_THANH_EXP[c - 1] ?? 0
}

/** Tổng EXP phải có để ĐẠT tới cấp `cap` từ cấp 1 (cấp 1 = 0; cấp 10 = 2 400; cấp 120 = 238 200). */
export function tongExpToiCap(cap: number): number {
  const c = Math.min(CAP_TOI_DA, Math.max(1, Math.round(cap)))
  let t = 0
  for (let i = 1; i < c; i++) t += thanhExp(i)
  return t
}

/**
 * Thanh EXP của một cấp theo ĐƯỜNG CŨ (ba đoạn, tổng 1 286 590). CHỈ để tính lại hồ sơ đã chơi lúc chuyển sang đường mới — mọi nơi khác dùng `thanhExp`.
 */
export function thanhExpCu(cap: number): number {
  if (cap >= CAP_TOI_DA) return 0
  const c = Math.max(1, Math.round(cap))
  const nenDau = EXP_BAN_DAU * Math.pow(HE_SO_DOAN_DAU, CAP_DOC - 2)
  const nenDoc = nenDau * Math.pow(HE_SO_DOAN_DOC, CAP_DAI - CAP_DOC)
  let v: number
  if (c < CAP_DOC) v = EXP_BAN_DAU * Math.pow(HE_SO_DOAN_DAU, c - 1)
  else if (c < CAP_DAI) v = nenDau * Math.pow(HE_SO_DOAN_DOC, c - CAP_DOC + 1)
  else v = nenDoc * Math.pow(HE_SO_DOAN_DAI, c - CAP_DAI + 1)
  return Math.round(v / 10) * 10
}

/**
 * SỨC CHỨA ỐNG NGHIỆM — kho EXP em kiếm được mà chưa nạp cho thần thú.
 *
 * Thầy chốt 15-09: EXP hiện ra kiểu ống nghiệm đựng chất lỏng xanh lá; bấm nạp
 * thì ống vơi, kiếm được thì đầy lên. Tức là **hai bể**, không phải một:
 *   · ỐNG NGHIỆM  — EXP đã kiếm, chưa dùng. Chỉ đầy bằng việc học thật.
 *   · THANH CẤP ĐỘ — EXP đã nạp vào thú. Chỉ đầy bằng cách rót từ ống sang.
 *
 * Nút nạp KHÔNG sinh ra EXP, nó chỉ chuyển chỗ.
 *
 * Trần nâng 2 000 → 50 000 cùng đường 120 cấp: cấp đắt nhất là 46 740, ống
 * phải rót nổi ít nhất một cấp ở MỌI mức, nếu không thì tới cuối đường em rót
 * ba lần mới lên nổi một cấp và thanh trông như đứng yên.
 */
export const SUC_CHUA_ONG = 50000

/** Tổng EXP phải kiếm để đi từ cấp 1 tới cấp 120 (đường mới: 238 200). */
export function tongExpToiDinh(): number {
  let t = 0
  for (let c = 1; c < CAP_TOI_DA; c++) t += thanhExp(c)
  return t
}

/* ─────────── NĂM NGUỒN KIẾM EXP, đều là việc học thật ─────────── */

/**
 * Khoá nguồn EXP — dùng làm khoá sổ nhật ký, nên KHÔNG đổi chữ tuỳ tiện:
 * đổi là mất sổ cũ trong máy học sinh.
 */
export type NguonKiemExp = 'leoThap' | 'sanBoss' | 'btvn' | 'caThi' | 'mom'

export const DS_NGUON_EXP: readonly NguonKiemExp[] =
  ['caThi', 'btvn', 'mom', 'leoThap', 'sanBoss'] as const

export const TEN_NGUON_EXP: Record<NguonKiemExp, string> = {
  caThi: 'Thi kiểm tra',
  btvn: 'Bài tập về nhà',
  mom: 'Nộp bài gia đình giao',
  leoThap: 'Leo tháp tri thức',
  sanBoss: 'Săn boss câu sai',
}

/** Sổ cộng dồn EXP theo từng nguồn. Chỉ cộng — chưa có mục nào trừ EXP. */
export type SoExpTheoNguon = Record<NguonKiemExp, number>

export function soExpRong(): SoExpTheoNguon {
  return { caThi: 0, btvn: 0, mom: 0, leoThap: 0, sanBoss: 0 }
}

/** Đọc sổ từ máy, bỏ khoá lạ, ép số âm hoặc rác về 0. */
export function vaSoExp(tho: unknown): SoExpTheoNguon {
  const ra = soExpRong()
  if (typeof tho !== 'object' || tho === null) return ra
  const o = tho as Record<string, unknown>
  for (const k of DS_NGUON_EXP) {
    const v = o[k]
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) ra[k] = Math.round(v)
  }
  return ra
}

export function tongSoExp(so: SoExpTheoNguon): number {
  return DS_NGUON_EXP.reduce((t, k) => t + (so[k] ?? 0), 0)
}

export const NGUON_EXP = {
  /**
   * Hạ trùm một tầng tháp. Tầng càng cao càng nhiều.
   *
   * HẠ TỪ `120 + 30 × tầng` XUỐNG `30 + 6 × tầng`. Công thức cũ làm tháp NUỐT
   * cả game: leo tới tầng 40 cho 29 400 EXP, gần gấp đôi cả đường lên cấp 12 —
   * tức là ngồi leo tháp một buổi tối là đủ tối đa hình thái, khỏi cần thi,
   * khỏi cần nộp bài. Nay tới tầng 20 cho 1 860 EXP (12% cả đường), tới tầng 40
   * cho 6 120 EXP (40%): tháp là THƯỞNG THÊM, ba nguồn kia mới là đường chính.
   *
   * Và một tầng tháp đáng ít hơn một câu sai sửa xong là có chủ ý: tầng tháp là
   * một câu bất kỳ, câu sai là LỖI CỦA CHÍNH EM được sửa.
   */
  leoThap: (tang: number) => Math.round((25 + Math.max(0, Math.round(tang)) * 0.9) / 5) * 5,
  /**
   * Leo LẠI một tầng đã hạ — chỉ 12%.
   *
   * Vì sao phải có: 999 tầng với công thức cũ `30 + 6×tầng` in ra 3 026 970
   * EXP, gấp 200 lần cả đường 12 cấp. Tháp thành máy in, khỏi cần thi khỏi cần
   * nộp bài. Nay lần đầu hạ một tầng mới trả đủ, cày lại tầng cũ gần như không
   * được gì — muốn thêm EXP thì phải leo CAO HƠN, tức phải trả lời đúng câu
   * khó hơn.
   */
  leoThapLai: (tang: number) =>
    Math.max(1, Math.floor((Math.round((25 + Math.max(0, Math.round(tang)) * 0.9) / 5) * 5) * 0.12)),
  /** Thanh tẩy MỘT câu sai — sửa xong một câu mình từng làm sai. */
  suaCauSai: () => 100,
  /** Nộp đủ một bài tập về nhà. */
  nopBtvn: () => 200,
  /** Một ca thi, theo điểm đạt được (thang 10). */
  caThi: (diem: number) => Math.max(0, Math.round(diem * 60)),
  /**
   * Nộp một bài MOM — bài phụ huynh giao, làm trong hai tiếng có người nhà
   * ngồi cạnh. Nặng hơn bài tập về nhà thường vì dài hơn và có giám sát.
   */
  nopMom: (diem: number) => 150 + Math.max(0, Math.round(diem * 25)),
} as const

export interface TinhExpLuyenThuParams {
  sao?: number
  laDangYeu?: boolean
  comboDungLienTiep?: number
  soCauTrongNgay?: number
}

/** TÍNH EXP THÔNG MINH CHO TỪNG HỌC SINH KHI LUYỆN THÚ.
 *
 * 1. Phân tầng theo sao: 0 sao (20), 1 sao (45), 2 sao (90).
 * 2. Hệ số Lỗ hổng x1.5 khi học sinh hạ gục đúng dạng bài đang yếu.
 * 3. Thưởng chuỗi Combo đúng liên tiếp (Streak 3 x1.15, 5 x1.3, 10 x1.5).
 * 4. Chống cày cuốc tiêu cực: trên 25 câu/ngày giảm còn 20%. */
export function tinhExpLuyenThu(p: TinhExpLuyenThuParams): {
  exp: number
  expCoBan: number
  heSoLoHong: number
  heSoCombo: number
  heSoGiamMoiMet: number
  thongDiepThuong: string
} {
  const sao = p.sao === 2 ? 2 : p.sao === 1 ? 1 : 0
  const expCoBan = sao === 2 ? 90 : sao === 1 ? 45 : 20
  const heSoLoHong = p.laDangYeu ? 1.5 : 1.0
  const combo = Math.max(1, p.comboDungLienTiep ?? 1)
  const heSoCombo = combo >= 10 ? 1.5 : combo >= 5 ? 1.3 : combo >= 3 ? 1.15 : 1.0
  const daLuyen = p.soCauTrongNgay ?? 0
  const heSoGiamMoiMet = daLuyen >= 25 ? 0.2 : 1.0

  const tongExp = Math.max(1, Math.round(expCoBan * heSoLoHong * heSoCombo * heSoGiamMoiMet))

  const notes: string[] = []
  if (p.laDangYeu) notes.push('Khắc phục lỗ hổng x1.5')
  if (heSoCombo > 1) notes.push(`Combo x${combo} (+${Math.round((heSoCombo - 1) * 100)}%)`)
  if (heSoGiamMoiMet < 1) notes.push('Đã luyện >25 câu hôm nay (nghỉ ngơi giữ sức)')

  return {
    exp: tongExp,
    expCoBan,
    heSoLoHong,
    heSoCombo,
    heSoGiamMoiMet,
    thongDiepThuong: notes.join(' · '),
  }
}

/** Nhãn hiện cho học sinh — phải khớp đúng con số ở trên, không hứa suông. */
export const BANG_NGUON_EXP: readonly { viec: string; thuong: string }[] = [
  { viec: 'Luyện câu theo sao & độ khó', thuong: '20 ★0 · 45 ★1 · 90 ★2' },
  { viec: 'Khắc phục dạng bài em đang yếu', thuong: 'Thưởng thêm x1.5 EXP' },
  { viec: 'Combo đúng liên tiếp', thuong: 'Chuỗi 3, 5, 10 thưởng tới +50%' },
  { viec: 'Hạ trùm một tầng tháp MỚI', thuong: '25 + 0,9 × số tầng' },
  { viec: 'Thanh tẩy một câu sai', thuong: '100 EXP' },
  { viec: 'Nộp đủ một bài tập về nhà', thuong: '200 EXP' },
  { viec: 'Thi xong một ca', thuong: '60 EXP mỗi điểm' },
  { viec: 'Nộp một bài gia đình giao', thuong: '150 + 25 × điểm' },
]

export interface KetQuaNhanExp {
  capDo: number
  capTienHoa: CapTienHoa
  exp: number
  expToiDa: number
  /** Lên được mấy cấp trong lần nhận này. */
  soCapLen: number
  /** Đã chạm trần cấp 120 chưa. */
  daToiDinh: boolean
}

/**
 * Cộng EXP và xử lên cấp — HÀM THUẦN, dùng chung cho MỌI nguồn.
 *
 * Trước đây mỗi chỗ cộng EXP lại tự viết nhánh lên cấp riêng, và chỗ thắng tháp
 * quên viết — leo hai mươi tầng vẫn Lv.1. Nay chỉ có đúng một hàm này.
 */
export function nhanExp(
  hienTai: { capDo: number; exp: number },
  them: number,
): KetQuaNhanExp {
  let capDo = Math.max(1, Math.round(hienTai.capDo))
  let exp = Math.max(0, Math.round(hienTai.exp)) + Math.max(0, Math.round(them))
  let soCapLen = 0

  while (capDo < CAP_TOI_DA) {
    const can = thanhExp(capDo)
    if (can <= 0 || exp < can) break
    exp -= can
    capDo += 1
    soCapLen += 1
  }

  const daToiDinh = capDo >= CAP_TOI_DA
  if (daToiDinh) exp = 0

  return {
    capDo,
    capTienHoa: capDo as CapTienHoa,
    exp,
    expToiDa: thanhExp(capDo),
    soCapLen,
    daToiDinh,
  }
}
