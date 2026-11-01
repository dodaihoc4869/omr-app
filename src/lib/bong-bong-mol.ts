// BONG BÓNG LỜI TRÊN ĐẦU MOL (Lộ trình) — HÌNH HỌC THUẦN, test ở tests/bong-bong-gon-0111.test.tsx.
// Thầy 01/11 23h (ảnh thật «Đủ rồi! Vào học ngay!» rộng gấp đôi chữ): «Viền bong bóng phải gọn vừa với chữ nhé» ⇒ bong bóng CO THEO CHỮ: bề rộng = dòng
// dài nhất + đệm (câu ngắn ôm sát; câu dài xuống dòng cân bằng trong bề rộng tối đa), rồi đặt lại vị trí + đuôi theo bề rộng thật.
export const RONG_TOI_DA = 280
export const RONG_TOI_THIEU = 130
/** Cách mép đường đi tối thiểu (px). */
export const MEP = 8
/** Đuôi lệch trái khỏi tâm Mol (px) — tránh nút bấc / lửa trên cổ bình. */
export const LECH_DUOI = 20
/** Đuôi cách mép bong bóng tối thiểu (px). */
export const DUOI_BIEN = 18

type Ngang = { left: number; right: number }

/** Bề rộng ôm chữ: từ mép trái nhất tới mép phải nhất của các dòng chữ (Range.getClientRects) + đệm + viền hai bên. Không đo được ⇒ null. */
export function rongOmChu(dong: readonly Ngang[], dem: number): number | null {
  const ds = dong.filter((d) => d.right > d.left)
  if (!ds.length) return null
  return Math.ceil(Math.max(...ds.map((d) => d.right)) - Math.min(...ds.map((d) => d.left)) + dem)
}

/**
 * Vị trí bong bóng bề rộng `w` trên đầu Mol (tâm ngang `tam`) trong khoảng `duong` (đường đi): căn giữa trên Mol rồi kẹp không tràn mép.
 * Trả `trai` = mép trái bong bóng so với tâm Mol (`--trai`), `duoi` = chỗ đuôi tính từ mép trái bong bóng (`--duoi`), chỉ đúng đầu Mol (lệch trái LECH_DUOI).
 */
export function viTriBong(duong: Ngang, tam: number, w: number): { trai: number; duoi: number } {
  const x = Math.min(Math.max(tam - w / 2, duong.left + MEP), duong.right - MEP - w)
  const trai = Math.round(x - tam)
  return { trai, duoi: Math.round(Math.min(Math.max(-trai - LECH_DUOI, DUOI_BIEN), w - DUOI_BIEN)) }
}
