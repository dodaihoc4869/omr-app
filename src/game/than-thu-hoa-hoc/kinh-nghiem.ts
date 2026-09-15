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
import { CAP_TOI_DA, type CapTienHoa } from './hinh-thai'

/**
 * Thanh EXP của cấp 1 — **300**.
 *
 * Chọn 300 vì đó là mốc lên cấp 2 bằng **một ca thi 5 điểm**, hoặc hai bài tập,
 * hoặc ba câu sai sửa xong. Em làm xong buổi học đầu tiên là thấy thanh nhảy —
 * đó là cái móc giữ em quay lại.
 */
export const EXP_BAN_DAU = 300

/**
 * Mỗi cấp thanh dài thêm **28%**.
 *
 * Trước là 18% — thanh gần như phẳng, cấp 11 chỉ đắt gấp 5 lần cấp 1, nên đoạn
 * cuối không có sức nặng. Với 28%: cấp 1 tốn 300, cấp 11 tốn 3 540 (gấp gần 12
 * lần). Năm cấp đầu chỉ chiếm 17% cả đường, còn ba cấp cuối chiếm 56% — vào
 * nhanh, về chậm, đúng nhịp một game nuôi thú.
 */
export const HE_SO_DAI_THEM = 1.28

/**
 * Thanh EXP của một cấp. Cấp 12 là tối đa nên trả 0 — hết đường lên.
 */
export function thanhExp(cap: number): number {
  if (cap >= CAP_TOI_DA) return 0
  const c = Math.max(1, Math.round(cap))
  return Math.round((EXP_BAN_DAU * Math.pow(HE_SO_DAI_THEM, c - 1)) / 10) * 10
}

/**
 * SỨC CHỨA ỐNG NGHIỆM — kho EXP em kiếm được mà chưa nạp cho thần thú.
 *
 * Thầy chốt 15-09: EXP hiện ra kiểu ống nghiệm đựng chất lỏng xanh lá; bấm nạp
 * thì ống vơi, kiếm được thì đầy lên. Tức là **hai bể**, không phải một:
 *   · ỐNG NGHIỆM  — EXP đã kiếm, chưa dùng. Chỉ đầy bằng việc học thật.
 *   · THANH CẤP ĐỘ — EXP đã nạp vào thú. Chỉ đầy bằng cách rót từ ống sang.
 *
 * Nút nạp KHÔNG sinh ra EXP, nó chỉ chuyển chỗ. Đây là điểm phải giữ: bể thứ
 * hai không được mở thêm một đường vào nào ngoài cái ống.
 *
 * Trần 2 000 chọn để ống luôn rót đủ ít nhất một cấp ở mọi mức (cấp đắt nhất là
 * 3 540, rót hai lần là qua). Ống đầy thì CHẶN quy đổi thêm và báo cho em nạp
 * trước — không bao giờ làm mất EXP em đã kiếm.
 */
export const SUC_CHUA_ONG = 2000

/** Tổng EXP phải kiếm để đi từ cấp 1 tới cấp 12. */
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
  mom: 'Nộp bài cho MOM',
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
  leoThap: (tang: number) => 30 + Math.max(0, Math.round(tang)) * 6,
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

/** Nhãn hiện cho học sinh — phải khớp đúng con số ở trên, không hứa suông. */
export const BANG_NGUON_EXP: readonly { viec: string; thuong: string }[] = [
  { viec: 'Hạ trùm một tầng tháp', thuong: '30 + 6 × số tầng' },
  { viec: 'Thanh tẩy một câu sai', thuong: '100 EXP' },
  { viec: 'Nộp đủ một bài tập về nhà', thuong: '200 EXP' },
  { viec: 'Thi xong một ca', thuong: '60 EXP mỗi điểm' },
  { viec: 'Nộp một bài cho MOM', thuong: '150 + 25 × điểm' },
]

export interface KetQuaNhanExp {
  capDo: number
  capTienHoa: CapTienHoa
  exp: number
  expToiDa: number
  /** Lên được mấy cấp trong lần nhận này. */
  soCapLen: number
  /** Đã chạm trần cấp 12 chưa. */
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
