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
  { cap: 3, co: 'sung', ten: 'Mọc Sừng' },
  { cap: 5, co: 'duoi', ten: 'Sinh Đuôi' },
  { cap: 8, co: 'canhNho', ten: 'Chớm Cánh' },
  { cap: 11, co: 'haoQuang', ten: 'Thức Tỉnh Hào Quang' },
  { cap: 15, co: 'vay', ten: 'Vảy Nguyên Tố' },
  { cap: 20, co: 'canhLon', ten: 'Song Dực' },
  { cap: 26, co: 'quyDao', ten: 'Quỹ Đạo Năng Lượng' },
  { cap: 33, co: 'vuongMien', ten: 'Vương Miện' },
  { cap: 41, co: 'vongRune', ten: 'Vòng Rune Nguyên Tố' },
  { cap: 50, co: 'toiThuong', ten: 'Hình Thái Tối Thượng' },
  { cap: 60, co: 'gaiLung', ten: 'Gai Sống Lưng' },
  { cap: 70, co: 'duoiLua', ten: 'Đuôi Lửa Nguyên Tố' },
  { cap: 81, co: 'haoQuangKep', ten: 'Hào Quang Song Tầng' },
  { cap: 92, co: 'matThuBa', ten: 'Mắt Thứ Ba' },
  { cap: 104, co: 'giapNguc', ten: 'Giáp Ngực Nguyên Tố' },
  { cap: 116, co: 'runeKep', ten: 'Rune Nghịch Chuyển' },
] as const

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
