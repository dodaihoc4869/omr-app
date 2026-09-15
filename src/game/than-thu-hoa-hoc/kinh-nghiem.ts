/**
 * KINH NGHIỆM — MỘT NGUỒN SỰ THẬT.
 *
 * Thầy chốt 14-09: **hết thanh thì phải đi kiếm theo hệ thống game**, không có
 * nút bấm phát ra EXP. Thanh đầu tiên chốt 2000, hạ xuống **240** ngày 15-09.
 *
 * Nghĩa là mọi điểm kinh nghiệm phải đổi bằng một VIỆC HỌC THẬT: leo tháp,
 * sửa câu sai, nộp bài, thi. Nút "nạp năng lượng" cho không EXP đã bị bỏ —
 * nó biến trục tiến bộ của game thành trò bấm nút, không dính gì tới việc học.
 */
import { CAP_TOI_DA, type CapTienHoa } from './hinh-thai'

/**
 * Thanh EXP của cấp 1. Thầy chốt: 2000 (14-09) → **240** (15-09).
 *
 * Đây là NÚM VẶN NHỊP GAME. Với 240, cả đường từ cấp 1 lên cấp 12 tốn
 * **6 890 EXP** — bằng khoảng 18 tầng tháp, hoặc 14 ca thi 8 điểm, hoặc 68 câu
 * sai sửa xong. Đổi số này là đổi cả nhịp; `HE_SO_DAI_THEM` là núm thứ hai.
 */
export const EXP_BAN_DAU = 240

/** Mỗi cấp thanh dài thêm 18%. Đổi một số này là đổi cả nhịp game. */
export const HE_SO_DAI_THEM = 1.18

/**
 * Thanh EXP của một cấp. Cấp 12 là tối đa nên trả 0 — hết đường lên.
 */
export function thanhExp(cap: number): number {
  if (cap >= CAP_TOI_DA) return 0
  const c = Math.max(1, Math.round(cap))
  return Math.round((EXP_BAN_DAU * Math.pow(HE_SO_DAI_THEM, c - 1)) / 10) * 10
}

/** Tổng EXP phải kiếm để đi từ cấp 1 tới cấp 12. */
export function tongExpToiDinh(): number {
  let t = 0
  for (let c = 1; c < CAP_TOI_DA; c++) t += thanhExp(c)
  return t
}

/* ─────────── BỐN NGUỒN KIẾM EXP, đều là việc học thật ─────────── */

export const NGUON_EXP = {
  /** Hạ trùm một tầng tháp. Tầng càng cao càng nhiều. */
  leoThap: (tang: number) => 120 + Math.max(0, Math.round(tang)) * 30,
  /** Thanh tẩy MỘT câu sai — sửa xong một câu mình từng làm sai. */
  suaCauSai: () => 100,
  /** Nộp đủ một bài tập về nhà. */
  nopBtvn: () => 200,
  /** Một ca thi, theo điểm đạt được (thang 10). */
  caThi: (diem: number) => Math.max(0, Math.round(diem * 60)),
} as const

/** Nhãn hiện cho học sinh — phải khớp đúng con số ở trên, không hứa suông. */
export const BANG_NGUON_EXP: readonly { viec: string; thuong: string }[] = [
  { viec: 'Hạ trùm một tầng tháp', thuong: '120 + 30 × số tầng' },
  { viec: 'Thanh tẩy một câu sai', thuong: '100 EXP' },
  { viec: 'Nộp đủ một bài tập về nhà', thuong: '200 EXP' },
  { viec: 'Thi xong một ca', thuong: '60 EXP mỗi điểm' },
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
