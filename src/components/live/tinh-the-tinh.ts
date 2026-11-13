// CỔ VŨ BẠN LÊN BẢNG — PHẦN TÍNH của tinh thể lửa (không phải component; luật lint only-export-components). Chú giải: đầu TinhTheCoVu.tsx.
export interface DiemTinhThe { x: number; y: number }
export interface DichTinhThe extends DiemTinhThe { /** Thẻ tên để nháy khi tinh thể tới (có thể nằm trong tờ chiếu). */ the?: Element | null }
export interface PropsTinhThe {
  /** Khoá lời gọi (lượt + em): đổi ⇒ đặt lại mốc đếm. */
  khoa: string
  /** Lượt cổ vũ theo đội (chỉ số đội 0–3). */
  dem: readonly number[]
  /** Toạ độ tâm thẻ tên trong hệ của lớp phủ này; null ⇒ màn này không có thẻ tên, không bay. */
  dich: (lop: HTMLDivElement) => DichTinhThe | null
  /** Chỗ nút cổ vũ của em (toạ độ trong lớp phủ) — tinh thể của chính em xuất phát từ đây. */
  nguon?: (lop: HTMLDivElement) => DiemTinhThe | null
  /** Số lần chính em đã bấm + đội của em (máy thầy bỏ trống). */
  cuaEm?: number
  doiEm?: number
  /** Lớp phủ bám cửa sổ (máy thầy); mặc định phủ kín khối cha (máy em — khối cha có thể đang xoay 90° bằng CSS). */
  coDinh?: boolean
  /** Máy yếu. */
  yeu?: boolean
}

/** Mỗi lượt số mới: tối đa ngần này tinh thể MỘT đội · cả màn cùng lúc tối đa TRAN (máy yếu TRAN_YEU). */
export const MOI_LUOT = 8, TRAN = 36, TRAN_YEU = 12

/** Số tinh thể cần phát cho từng đội khi số đếm đổi từ `cu` sang `moi` (không âm, chặn MOI_LUOT). Số giảm / lời gọi khác ⇒ 0. */
export function tinhPhat(cu: readonly number[] | null, moi: readonly number[]): number[] {
  return [0, 1, 2, 3].map((d) => (cu ? Math.max(0, Math.min(MOI_LUOT, (moi[d] ?? 0) - (cu[d] ?? 0))) : 0))
}
