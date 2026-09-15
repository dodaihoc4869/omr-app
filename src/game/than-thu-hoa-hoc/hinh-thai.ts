/**
 * MỘT TRĂM HAI MƯƠI HÌNH THÁI TIẾN HOÁ.
 *
 * Thầy chốt 15-09: *"tăng thêm cấp thú lên 120 cấp"*, *"thêm hình thái mới cho
 * đủ 120"*.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * VÌ SAO KHÔNG VẼ TAY 120 BỨC. Hệ này từ đầu đã là hệ SINH, không phải một
 * tập tranh: mỗi hình thái là ba núm số cộng một tập cờ tính năng CỘNG DỒN.
 * Nhờ vậy "cấp sau ngầu hơn cấp trước" là thứ ĐẾM ĐƯỢC, và phép kiểm bắt được
 * ngay nếu ai lỡ tay làm cấp sau nghèo hơn cấp trước. Kéo từ 12 lên 120 chỉ
 * cần: thêm sáu cờ mới, giãn mốc bật cờ ra, và cho ba núm số nhích MỖI CẤP.
 *
 * HAI LUẬT BẤT BIẾN, phép kiểm khoá cả hai:
 *   1. Cờ đã bật thì không bao giờ tắt (trừ `vo` — vỏ trứng, ngoại lệ duy nhất).
 *   2. Ba núm số không bao giờ giảm; riêng `coCon` TĂNG NGHIÊM NGẶT mỗi cấp,
 *      nên không có hai cấp nào nhìn giống hệt nhau.
 *
 * Mười tám MỐC cấu trúc rải trên 120 cấp: đầu đường dày (cứ hai ba cấp một
 * tính năng mới — em mới nuôi phải thấy thú đổi liên tục), cuối đường thưa.
 */

/** Cấp tiến hoá: 1 (trứng) → 120 (tối thượng). */
export type CapTienHoa = number

export const CAP_TOI_DA = 120

export interface HinhThai {
  cap: CapTienHoa
  ten: string
  /** Nhân vào bán kính vẽ. TĂNG NGHIÊM NGẶT mỗi cấp. */
  coCon: number
  /** Số hạt năng lượng bay quanh. Không giảm. */
  soHat: number
  /** Độ đậm hào quang 0..1. Không giảm. */
  damHaoQuang: number

  // ——— tính năng, CỘNG DỒN: bật rồi thì không bao giờ tắt
  vo: boolean          // vỏ trứng — chỉ cấp 1, đây là NGOẠI LỆ DUY NHẤT
  than: boolean        // nở ra, có thân và mắt
  sung: boolean        // mọc sừng
  duoi: boolean        // sinh đuôi
  canhNho: boolean     // chớm cánh
  haoQuang: boolean    // thức tỉnh hào quang
  vay: boolean         // vảy nguyên tố trên thân
  canhLon: boolean     // song dực, cánh hai tầng
  quyDao: boolean      // hạt chạy quỹ đạo
  vuongMien: boolean   // vương miện
  vongRune: boolean    // vòng rune nguyên tố xoay quanh
  toiThuong: boolean   // mắt rực, lửa viền, ba vòng rune
  // ——— sáu cờ MỚI của đường 120 cấp
  gaiLung: boolean     // hàng gai chạy dọc sống lưng
  duoiLua: boolean     // chót đuôi bốc lửa nguyên tố
  haoQuangKep: boolean // hai tầng hào quang lồng nhau
  matThuBa: boolean    // con mắt thứ ba giữa trán
  giapNguc: boolean    // tấm giáp nguyên tố trước ngực
  runeKep: boolean     // vòng rune thứ tư, quay ngược chiều
}

/** Tên cờ theo đúng thứ tự bật — dùng cho phép kiểm và cho bảng mốc. */
export const DS_CO = [
  'than', 'sung', 'duoi', 'canhNho', 'haoQuang', 'vay', 'canhLon', 'quyDao',
  'vuongMien', 'vongRune', 'toiThuong', 'gaiLung', 'duoiLua', 'haoQuangKep',
  'matThuBa', 'giapNguc', 'runeKep',
] as const

export type TenCo = (typeof DS_CO)[number]

/**
 * MƯỜI TÁM MỐC — cấp nào bật cờ nào, và tên bậc ấy.
 *
 * Đầu đường dày: cấp 2, 3, 5, 8 — em mới nuôi mở app mỗi hôm là thấy thú khác.
 * Cuối đường thưa: mốc cuối cách nhau 12 cấp, để hình thái đỉnh thật sự hiếm.
 */
interface Moc { cap: number; co: TenCo | null; ten: string }

const MOC: readonly Moc[] = [
  { cap: 1, co: null, ten: 'Trứng Nguyên Tố' },
  { cap: 2, co: 'than', ten: 'Sơ Sinh' },
  { cap: 4, co: 'sung', ten: 'Mọc Sừng' },
  { cap: 7, co: 'duoi', ten: 'Sinh Đuôi' },
  // ── BẬC 2 ── cấp 10
  { cap: 10, co: 'canhNho', ten: 'Chớm Cánh' },
  { cap: 16, co: 'haoQuang', ten: 'Thức Tỉnh Hào Quang' },
  { cap: 23, co: 'vay', ten: 'Vảy Nguyên Tố' },
  // ── BẬC 3 ── cấp 30
  { cap: 30, co: 'canhLon', ten: 'Song Dực' },
  { cap: 38, co: 'quyDao', ten: 'Quỹ Đạo Năng Lượng' },
  { cap: 44, co: 'gaiLung', ten: 'Gai Sống Lưng' },
  // ── BẬC 4 ── cấp 50
  { cap: 50, co: 'vuongMien', ten: 'Vương Miện' },
  { cap: 58, co: 'duoiLua', ten: 'Đuôi Lửa Nguyên Tố' },
  { cap: 64, co: 'vongRune', ten: 'Vòng Rune Nguyên Tố' },
  // ── BẬC 5 ── cấp 70
  { cap: 70, co: 'toiThuong', ten: 'Hình Thái Tối Thượng' },
  { cap: 80, co: 'haoQuangKep', ten: 'Hào Quang Song Tầng' },
  { cap: 90, co: 'matThuBa', ten: 'Mắt Thứ Ba' },
  // ── BẬC 6 ── cấp 100
  { cap: 100, co: 'giapNguc', ten: 'Giáp Ngực Nguyên Tố' },
  { cap: 112, co: 'runeKep', ten: 'Rune Nghịch Chuyển' },
] as const

/**
 * SÁU BẬC TIẾN HOÁ — đúng mốc trong ảnh thầy gửi 15-09: 10 · 30 · 50 · 70 · 100.
 *
 * Mỗi con MỘT BỘ TÊN RIÊNG. Trước nay sáu con dùng chung một thang tên
 * ("Mọc Sừng", "Song Dực"…) — đúng kiểu đặt cho một con thú chung chung, mà
 * thầy đã vẽ ra sáu dòng giống khác hẳn nhau, mỗi dòng một tông danh xưng.
 */
export const CAP_BAC: readonly number[] = [1, 10, 30, 50, 70, 100]

export const TEN_BAC_THEO_THU: Record<string, readonly string[]> = {
  // Xích Phượng Nhiệt Nhôm — hệ Hoả
  hoa_long: [
    'Trứng Hoả Tinh', 'Xích Phượng Sơ Sinh', 'Xích Phượng Trưởng Thành',
    'Hoả Phượng Hoàn Cầu', 'Đại Phượng Triều Dương',
    'TỐI THƯỢNG XÍCH PHƯỢNG LONG THẦN',
  ],
  // Tử Giác Kỳ Lân Cường Toan — hệ Acid
  thuy_quai: [
    'Trứng Cường Toan', 'Kỳ Lân Nhỏ', 'Kỳ Lân Trưởng Thành',
    'Thần Thú Kỳ Lân', 'Đại Kỳ Lân Thần Thú',
    'CÕI THƯỢNG TỬ GIÁC KỲ LÂN',
  ],
  // Huyền Quy Kết Tủa BaSO₄ — hệ Base
  thiet_giap: [
    'Trứng Kết Tủa', 'Quy Vạn Niên Nhỏ', 'Sở Quy Trưởng Thành',
    'Thần Quy Vạn Niên', 'Sở Quy Thần Quy',
    'TỐI THƯỢNG HUYỀN QUY THẦN GIÁP',
  ],
  // Thanh Long Halogen — hệ Khí
  loi_dieu: [
    'Trứng Halogen', 'Rồng Cung Đình Nhỏ', 'Thần Long Hoàn Thiện',
    'Thanh Long Halogen', 'Cung Đình Đại Thần Long',
    'TỐI THƯỢNG CUNG ĐÌNH LONG THẦN',
  ],
  // Lôi Lân Điện Cực — hệ Điện hoá
  loi_kim: [
    'Trứng Điện Cực', 'Đại Lân Nhỏ', 'Đại Lân Trưởng Thành',
    'Sơn Lâm Đại Lân', 'Thần Sơn Lâm Đại Lân',
    'TỐI THƯỢNG SƠN LÂM LÔI LÂN',
  ],
  // Bích Long Ester Polymer — hệ Hữu cơ
  moc_tinh: [
    'Trứng Polymer', 'Thuỷ Phù Long Thần Nhỏ', 'Thuỷ Phù Long Thần Trưởng Thành',
    'Thuỷ Phù Long Thần Đa Dạng', 'Đại Thuỷ Phù Long Thần',
    'TỐI THƯỢNG THUỶ PHÙ LONG THẦN',
  ],
}

/** Bậc tiến hoá (1…6) của một cấp. */
export function bacTienHoa(cap: number): number {
  const c = Math.max(1, Math.min(CAP_TOI_DA, Math.round(cap)))
  let b = 1
  for (const [i, m] of CAP_BAC.entries()) if (c >= m) b = i + 1
  return b
}

/**
 * Tên bậc của một con ở một cấp.
 *
 * Đây là tên EM ĐỌC THẤY. Tên kỹ thuật trong `HinhThai.ten` (Mọc Sừng, Song
 * Dực…) giữ nguyên cho phép kiểm và cho mã cũ, nhưng không hiện ra nữa.
 */
export function tenBacThu(idThu: string, cap: number): string {
  const ds = TEN_BAC_THEO_THU[idThu] ?? TEN_BAC_THEO_THU['hoa_long']!
  return ds[bacTienHoa(cap) - 1] ?? ds[ds.length - 1]!
}

/** Cấp tới hạn của bậc kế tiếp; đã ở bậc cuối thì trả 0. */
export function capBacKeTiep(cap: number): number {
  const c = Math.max(1, Math.min(CAP_TOI_DA, Math.round(cap)))
  for (const m of CAP_BAC) if (m > c) return m
  return 0
}

const SO_LA_MA = [
  '', ' II', ' III', ' IV', ' V', ' VI', ' VII', ' VIII', ' IX', ' X',
  ' XI', ' XII', ' XIII', ' XIV', ' XV', ' XVI', ' XVII', ' XVIII', ' XIX', ' XX',
  ' XXI', ' XXII', ' XXIII', ' XXIV', ' XXV',
] as const

/** Mốc đang áp dụng cho một cấp, và cấp ấy là bậc thứ mấy trong mốc. */
function mocCua(cap: number): { moc: Moc; thu: number } {
  let i = 0
  for (let k = 0; k < MOC.length; k++) if (MOC[k]!.cap <= cap) i = k
  return { moc: MOC[i]!, thu: cap - MOC[i]!.cap }
}

function dung(cap: number): HinhThai {
  const { moc, thu } = mocCua(cap)
  const bat = (ten: TenCo): boolean => {
    for (const m of MOC) if (m.co === ten) return cap >= m.cap
    return false
  }
  return {
    cap,
    // Tên duy nhất cho cả 120 cấp: tên bậc, cộng số La Mã cho các cấp trong bậc.
    ten: moc.ten + (SO_LA_MA[thu] ?? ` ${thu + 1}`),
    // TĂNG NGHIÊM NGẶT mỗi cấp — đây là thứ bảo đảm không hai cấp nào giống nhau.
    coCon: 0.8 + (cap - 1) * (1.45 / (CAP_TOI_DA - 1)),
    // Mỗi cấp thêm một hạt từ cấp 3; trần 30 cho máy em không đuối.
    soHat: cap <= 2 ? 0 : Math.min(30, cap - 2),
    damHaoQuang: Math.min(1, (cap - 1) * 0.012),
    vo: cap === 1,
    than: bat('than'),
    sung: bat('sung'),
    duoi: bat('duoi'),
    canhNho: bat('canhNho'),
    haoQuang: bat('haoQuang'),
    vay: bat('vay'),
    canhLon: bat('canhLon'),
    quyDao: bat('quyDao'),
    vuongMien: bat('vuongMien'),
    vongRune: bat('vongRune'),
    toiThuong: bat('toiThuong'),
    gaiLung: bat('gaiLung'),
    duoiLua: bat('duoiLua'),
    haoQuangKep: bat('haoQuangKep'),
    matThuBa: bat('matThuBa'),
    giapNguc: bat('giapNguc'),
    runeKep: bat('runeKep'),
  }
}

/** Đếm số tính năng đang bật — dùng cho phép kiểm "ngầu dần". */
export function demTinhNang(h: HinhThai): number {
  return DS_CO.filter((k) => h[k]).length
}

export const DS_HINH_THAI: readonly HinhThai[] =
  Array.from({ length: CAP_TOI_DA }, (_, i) => dung(i + 1))

/**
 * Giữ tên cũ cho mã và phép kiểm đã viết: mười hai hình thái ĐẦU của thang.
 * KHÔNG còn là cả thang — thang nay có 120 bậc.
 */
export const MUOI_HAI_HINH_THAI: readonly HinhThai[] = DS_HINH_THAI.slice(0, 12)

export function layHinhThai(cap: number): HinhThai {
  const c = Math.max(1, Math.min(CAP_TOI_DA, Math.round(cap)))
  return DS_HINH_THAI[c - 1]!
}

/** Các cấp là MỐC cấu trúc — cấp bật thêm một tính năng mới. */
export const DS_CAP_MOC: readonly number[] = MOC.filter((m) => m.co !== null).map((m) => m.cap)

/** Cấp này có phải mốc không — màn hình reo lên ở đúng những cấp này. */
export function laCapMoc(cap: number): boolean {
  return DS_CAP_MOC.includes(Math.round(cap))
}
