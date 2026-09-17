/**
 * VÒNG TƯƠNG KHẮC BÁT ĐẠI HỆ — MỖI CẶP LÀ MỘT PHẢN ỨNG HOÁ HỌC & CHÂN LÝ KHOA HỌC CÓ THẬT.
 *
 * Thầy chốt 16-09: 8 Thần Thú theo hướng:
 *   · Tứ Đại Tự Nhiên: Đất · Nước · Lửa · Khí
 *   · Tứ Trụ Tâm Thức: Đức Tin · Tình Yêu · Lòng Biết Ơn · Sự Sáng Ý Thức
 *
 * ───────────────────────────────────────────────────────────────────────────
 * CÂN BẰNG HOÀN HẢO 1 : 1:
 * Mỗi hệ thắng chính xác 2 hệ và thua chính xác 2 hệ:
 *   1. Vòng Tự Nhiên: Đất > Nước > Lửa > Khí > Đất
 *   2. Vòng Tâm Thức: Đức Tin > Tình Yêu > Lòng Biết Ơn > Sự Sáng Ý Thức > Đức Tin
 *   3. Cầu Nối Giao Thoa:
 *      · Đất > Sự Sáng Ý Thức | Lòng Biết Ơn > Đất
 *      · Nước > Đức Tin       | Tình Yêu > Nước
 *      · Lửa > Tình Yêu       | Đức Tin > Lửa
 *      · Khí > Lòng Biết Ơn   | Sự Sáng Ý Thức > Khí
 *
 * Tỉ lệ thắng/thua giữa cả 8 hệ là 1,000 (cân bằng đối xứng tuyệt đối).
 */

export type HeNguyenTo =
  | 'dat'
  | 'nuoc'
  | 'lua'
  | 'khi'
  | 'ductin'
  | 'tinhyeu'
  | 'bieton'
  | 'sangy'
  // Alias tương thích ngược cho dữ liệu cũ
  | 'hoa'
  | 'axit'
  | 'kiem'
  | 'dien'
  | 'huuco'

export const DS_HE: readonly HeNguyenTo[] = [
  'dat',
  'nuoc',
  'lua',
  'khi',
  'ductin',
  'tinhyeu',
  'bieton',
  'sangy',
] as const

/** Chuẩn hoá hệ cũ về 8 hệ mới nếu gặp dữ liệu lưu trước đây. */
export function chuanHoaHe(he: string): HeNguyenTo {
  switch (he) {
    case 'hoa': return 'lua'
    case 'axit': return 'nuoc'
    case 'kiem': return 'dat'
    case 'dien': return 'ductin'
    case 'huuco': return 'tinhyeu'
    default:
      if (DS_HE.includes(he as HeNguyenTo)) return he as HeNguyenTo
      return 'dat'
  }
}

export const TEN_HE_DAY_DU: Record<HeNguyenTo, string> = {
  dat: 'Đất · kết tủa, silicate khoáng thạch',
  nuoc: 'Nước · dung môi, liên kết hydro',
  lua: 'Lửa · nhiệt nhôm, phản ứng toả nhiệt',
  khi: 'Khí · halogen, khuếch tán',
  ductin: 'Đức tin · định luật bảo toàn khối lượng',
  tinhyeu: 'Tình yêu · liên kết cộng hoá trị chia sẻ',
  bieton: 'Lòng biết ơn · cân bằng động Le Chatelier',
  sangy: 'Sự sáng ý thức · quang hoá, photon lượng tử',
  // Giữ alias cũ để không vỡ UI nếu còn chỗ đọc
  hoa: 'Lửa · nhiệt nhôm, phản ứng toả nhiệt',
  axit: 'Nước · dung môi, liên kết hydro',
  kiem: 'Đất · kết tủa, silicate khoáng thạch',
  dien: 'Đức tin · định luật bảo toàn khối lượng',
  huuco: 'Tình yêu · liên kết cộng hoá trị chia sẻ',
}

export const TEN_HE_NGAN: Record<HeNguyenTo, string> = {
  dat: 'Đất',
  nuoc: 'Nước',
  lua: 'Lửa',
  khi: 'Khí',
  ductin: 'Đức tin',
  tinhyeu: 'Tình yêu',
  bieton: 'Biết ơn',
  sangy: 'Sáng ý',
  hoa: 'Lửa',
  axit: 'Nước',
  kiem: 'Đất',
  dien: 'Đức tin',
  huuco: 'Tình yêu',
}

/** Một cặp khắc chế: `cong` áp đảo `thu`, kèm phản ứng thật làm bằng chứng. */
export interface CapKhacChe {
  cong: HeNguyenTo
  thu: HeNguyenTo
  /** Phương trình hoặc hiện tượng có thật — đây là phần HỌC của cơ chế. */
  banChung: string
}

/**
 * BẢNG KHẮC CHẾ BÁT ĐẠI HỆ (16 CẶP KHẮC CHẾ ĐỐI XỨNG).
 * Mỗi hệ thắng 2 hệ và thua 2 hệ.
 */
export const BANG_KHAC_CHE: readonly CapKhacChe[] = [
  // ─── 1. VÒNG TỨ ĐẠI TỰ NHIÊN (4 CẶP) ───
  {
    cong: 'dat',
    thu: 'nuoc',
    banChung: 'Mạng lưới tinh thể Silicate (SiO₂) và kết tủa khoáng thạch ngăn chặn và hấp phụ dòng chảy của nước.',
  },
  {
    cong: 'nuoc',
    thu: 'lua',
    banChung: 'Nhiệt dung riêng cực lớn của H₂O hấp thụ nhiệt lượng toả ra từ phản ứng cháy, dập tắt ngọn lửa.',
  },
  {
    cong: 'lua',
    thu: 'khi',
    banChung: 'Nhiệt độ cao (phản ứng nhiệt nhôm 2000°C) nung nóng và làm giãn nở bành trướng thể tích chất khí mãnh liệt.',
  },
  {
    cong: 'khi',
    thu: 'dat',
    banChung: 'Khí Halogen (F₂, Cl₂) có tính oxi hoá cực mạnh, ăn mòn và phong hoá lớp đá khoáng: SiO₂ + 2F₂ → SiF₄ + O₂.',
  },

  // ─── 2. VÒNG TỨ TRỤ TÂM THỨC (4 CẶP) ───
  {
    cong: 'ductin',
    thu: 'tinhyeu',
    banChung: 'Định luật bảo toàn khối lượng và năng lượng che chở, giữ cho liên kết cộng hoá trị luôn bền vững không tan vỡ.',
  },
  {
    cong: 'tinhyeu',
    thu: 'bieton',
    banChung: 'Sự sẻ chia đôi electron tạo nền tảng cho phản ứng thuận nghịch và thiết lập hệ đệm cân bằng bền vững.',
  },
  {
    cong: 'bieton',
    thu: 'sangy',
    banChung: 'Trạng thái cân bằng bền vững vững chãi (Le Chatelier) giúp tâm trí tĩnh lặng, chuẩn bị cho electron nhảy mức lượng tử.',
  },
  {
    cong: 'sangy',
    thu: 'ductin',
    banChung: 'Ánh sáng photon quang phổ soi rọi chân lý định luật tự nhiên, củng cố đức tin kiên định vào khoa học.',
  },

  // ─── 3. CẦU NỐI GIAO THOA TỰ NHIÊN & TÂM THỨC (8 CẶP) ───
  {
    cong: 'dat',
    thu: 'sangy',
    banChung: 'Lớp vỏ nham thạch và khoáng vật dày đặc che chắn, hấp thụ hoàn toàn tia photon ánh sáng quang học.',
  },
  {
    cong: 'bieton',
    thu: 'dat',
    banChung: 'Hệ đệm phù sa màu mỡ trung hoà độ phèn chua (cân bằng pH) phục hồi sự màu mỡ cho đất đai.',
  },
  {
    cong: 'nuoc',
    thu: 'ductin',
    banChung: 'Dung môi nước phân ly mạnh mẽ, thuỷ phân và hoà tan các tinh thể muối bền vững.',
  },
  {
    cong: 'tinhyeu',
    thu: 'nuoc',
    banChung: 'Mạng lưới liên kết hydro liên phân tử gắn kết từng phân tử H₂O đơn độc thành đại dương sự sống mênh mông.',
  },
  {
    cong: 'lua',
    thu: 'tinhyeu',
    banChung: 'Nhiệt độ cao nhiệt phân cắt đứt các liên kết cộng hoá trị hữu cơ C-C và C-H.',
  },
  {
    cong: 'ductin',
    thu: 'lua',
    banChung: 'Cấu trúc kim cương tinh khiết sp³ và định luật bảo toàn khối lượng bất biến trước ngọn lửa 2000°C.',
  },
  {
    cong: 'khi',
    thu: 'bieton',
    banChung: 'Áp suất khí biến thiên làm chuyển dịch trạng thái cân bằng hoá học theo nguyên lý Le Chatelier.',
  },
  {
    cong: 'sangy',
    thu: 'khi',
    banChung: 'Năng lượng photon ánh sáng kích thích các phân tử khí hiếm phát sáng rực rỡ trong ống phóng điện quang phổ.',
  },
] as const

const CHI_MUC = new Map<string, CapKhacChe>()
for (const c of BANG_KHAC_CHE) {
  CHI_MUC.set(c.cong + '>' + c.thu, c)
}

export const HE_SO_KHAC_CHE = 1.5
export const HE_SO_BI_KHAC = 0.7

export interface KetQuaTuongKhac {
  heSo: number
  /** 'khac' · 'biKhac' · 'trung' — màn hình đổi màu theo ba trạng thái này. */
  loai: 'khac' | 'biKhac' | 'trung'
  thongDiep: string
  /** Phản ứng thật đứng sau. Rỗng khi hai hệ không có tương tác đặc trưng. */
  banChung: string
}

/**
 * Hệ số sát thương khi hệ `heCong` đánh vào hệ `heThu`.
 */
export function tinhHeSoTuongKhac(heCongTho: HeNguyenTo, heThuTho: HeNguyenTo): KetQuaTuongKhac {
  const heCong = chuanHoaHe(heCongTho)
  const heThu = chuanHoaHe(heThuTho)

  const thang = CHI_MUC.get(heCong + '>' + heThu)
  if (thang) {
    return {
      heSo: HE_SO_KHAC_CHE,
      loai: 'khac',
      thongDiep: `Khắc chế ${TEN_HE_NGAN[heThu]}! Sát thương +50%`,
      banChung: thang.banChung,
    }
  }
  const thua = CHI_MUC.get(heThu + '>' + heCong)
  if (thua) {
    return {
      heSo: HE_SO_BI_KHAC,
      loai: 'biKhac',
      thongDiep: `Bị ${TEN_HE_NGAN[heThu]} khắc chế! Sát thương −30%`,
      banChung: thua.banChung,
    }
  }
  return {
    heSo: 1,
    loai: 'trung',
    thongDiep: 'Hai hệ không có tương tác đặc trưng',
    banChung: '',
  }
}

/** Các hệ mà `he` khắc được. */
export function heKhacDuoc(heTho: HeNguyenTo): CapKhacChe[] {
  const he = chuanHoaHe(heTho)
  return BANG_KHAC_CHE.filter((c) => c.cong === he)
}

/** Các hệ khắc được `he`. */
export function heBiKhacBoi(heTho: HeNguyenTo): CapKhacChe[] {
  const he = chuanHoaHe(heTho)
  return BANG_KHAC_CHE.filter((c) => c.thu === he)
}
