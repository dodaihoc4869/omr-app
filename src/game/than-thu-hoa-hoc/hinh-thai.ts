/**
 * MƯỜI HAI HÌNH THÁI TIẾN HOÁ.
 *
 * Luật cốt lõi: **hình thái sau NGẦU HƠN hình thái trước, không có ngoại lệ.**
 * Cách giữ cho luật đó đúng mà không cần ai nhìn bằng mắt: mỗi hình thái là một
 * tập TÍNH NĂNG CỘNG DỒN — cấp N có đủ mọi thứ cấp N−1 có, cộng thêm ít nhất
 * một thứ mới. Nhờ vậy "ngầu hơn" trở thành một con số đếm được, và có phép
 * kiểm bắt được nếu ai đó lỡ tay làm cấp sau nghèo hơn cấp trước.
 */

/** Cấp tiến hoá: 1 (trứng) → 12 (tối thượng). */
export type CapTienHoa = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

export const CAP_TOI_DA = 12

export interface HinhThai {
  cap: CapTienHoa
  ten: string
  /** Nhân vào bán kính vẽ. Tăng dần. */
  coCon: number
  /** Số hạt năng lượng bay quanh. Tăng dần. */
  soHat: number
  /** Độ đậm hào quang 0..1. Tăng dần. */
  damHaoQuang: number

  // ——— tính năng, CỘNG DỒN: bật rồi thì không bao giờ tắt
  vo: boolean          // vỏ trứng — chỉ cấp 1, đây là NGOẠI LỆ DUY NHẤT
  than: boolean        // 2: nở ra, có thân và mắt
  sung: boolean        // 3: mọc sừng
  duoi: boolean        // 4: sinh đuôi
  canhNho: boolean     // 5: chớm cánh
  haoQuang: boolean    // 6: thức tỉnh hào quang
  vay: boolean         // 7: vảy nguyên tố trên thân
  canhLon: boolean     // 8: song dực, cánh hai tầng
  quyDao: boolean      // 9: hạt chạy quỹ đạo
  vuongMien: boolean   // 10: vương miện
  vongRune: boolean    // 11: vòng rune nguyên tố xoay quanh
  toiThuong: boolean   // 12: mắt rực, lửa viền, ba vòng rune
}

/** Đếm số tính năng đang bật — dùng cho phép kiểm "ngầu dần". */
export function demTinhNang(h: HinhThai): number {
  return [h.than, h.sung, h.duoi, h.canhNho, h.haoQuang, h.vay,
    h.canhLon, h.quyDao, h.vuongMien, h.vongRune, h.toiThuong]
    .filter(Boolean).length
}

const TEN: readonly string[] = [
  'Trứng Nguyên Tố',
  'Sơ Sinh',
  'Mọc Sừng',
  'Sinh Đuôi',
  'Chớm Cánh',
  'Thức Tỉnh Hào Quang',
  'Vảy Nguyên Tố',
  'Song Dực',
  'Quỹ Đạo Năng Lượng',
  'Vương Miện',
  'Vòng Rune Nguyên Tố',
  'Hình Thái Tối Thượng',
]

function dung(cap: CapTienHoa): HinhThai {
  return {
    cap,
    ten: TEN[cap - 1]!,
    coCon: 0.80 + (cap - 1) * 0.035,
    soHat: cap <= 2 ? 0 : (cap - 2) * 2,
    damHaoQuang: Math.min(1, (cap - 1) * 0.09),
    vo: cap === 1,
    than: cap >= 2,
    sung: cap >= 3,
    duoi: cap >= 4,
    canhNho: cap >= 5,
    haoQuang: cap >= 6,
    vay: cap >= 7,
    canhLon: cap >= 8,
    quyDao: cap >= 9,
    vuongMien: cap >= 10,
    vongRune: cap >= 11,
    toiThuong: cap >= 12,
  }
}

export const MUOI_HAI_HINH_THAI: readonly HinhThai[] =
  ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as CapTienHoa[]).map(dung)

export function layHinhThai(cap: number): HinhThai {
  const c = Math.max(1, Math.min(CAP_TOI_DA, Math.round(cap))) as CapTienHoa
  return MUOI_HAI_HINH_THAI[c - 1]!
}
