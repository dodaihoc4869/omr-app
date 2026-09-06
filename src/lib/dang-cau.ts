// DẠNG CÂU — LÝ THUYẾT hay BÀI TẬP. Thầy chốt 06/09.
//
// ============================================================================
// VÌ SAO PHẢI ĐOÁN, VÀ VÌ SAO ĐƯỢC PHÉP TRẢ LỜI "CHƯA RÕ"
// ============================================================================
// Kho đề KHÔNG có trường nào phân biệt lý thuyết với bài tập. Đo trên kho thật
// 06/09: 2.520 câu trong 41 file, mỗi câu chỉ có `phan · so · de · pa ·
// dap_an · chuyen_de · muc_do · can_chua · loi_giai`. Không có `dang`.
//
// Nên chỗ này SUY RA từ những gì có. Suy ra thì có câu trúng câu trượt, và luật
// vàng của dự án là "không lặng lẽ sai — ca không chắc thì cờ hoá, không đoán".
// Vì vậy hàm này có BA kết quả chứ không phải hai: câu không đủ bằng chứng thì
// trả `chua_ro`, và hai nút lọc chặt KHÔNG lấy câu đó.
//
// ----------------------------------------------------------------------------
// SỐ ĐO THẬT — chạy luật y hệt dưới đây lên cả 2.520 câu, 06/09
// ----------------------------------------------------------------------------
//
//              lý thuyết   bài tập   chưa rõ
//   Phần I        1.270        82       164
//   Phần II         371        12        43
//   Phần III          0       578         0
//   ────────────────────────────────────────
//   cộng          1.641       672       207   (chưa rõ 8 %)
//
// KIỂM CHIỀU SAI NGƯỢC (chỗ nguy hiểm hơn): trong 1.641 câu bị gọi lý thuyết,
// chỉ 11 câu Phần I có số kèm đơn vị. Đọc tay cả 11 thì cả 11 gọi ĐÚNG — đơn vị
// ở đó là điều kiện chứ không phải phép tính: "Tích số ion của nước ở 25 °C
// là", "Môi trường kiềm có khoảng pH ở 25 °C là", câu tra bảng độ tan.
//
// 207 câu `chua_ro` là khó thật. Ví dụ: "Nguyên tử X có tổng số hạt bằng 52,
// số hạt mang điện nhiều hơn số hạt không mang điện là…" — phải tính, nhưng
// câu hỏi lại là chọn phát biểu đúng. Máy không tách nổi bằng mặt chữ, nên
// chúng nằm ngoài hai nút lọc chặt.
//
// ĐƯỜNG ĐI SAU NÀY: pipeline nạp đề đang gắn `chuyen_de`, `muc_do`, `can_chua`
// — lúc đó nó có cả đề lẫn lời giải trong tay và phân loại chuẩn hơn hẳn. Khi
// kho có trường `dang`, `dangCua` đọc thẳng trường đó và bỏ qua toàn bộ phần
// suy đoán (nhánh đầu tiên trong hàm). Không phải sửa chỗ gọi nào.

export type DangCau = 'ly_thuyet' | 'bai_tap' | 'chua_ro'

/** Lựa chọn của thầy ở mọi màn rút câu. `ngau_nhien` = không lọc dạng, lấy cả
 * câu `chua_ro` — đó là lý do nó vẫn rút được từ trọn kho. */
export type LocDang = 'ly_thuyet' | 'bai_tap' | 'ngau_nhien'

export const TEN_DANG: Record<DangCau, string> = {
  ly_thuyet: 'Lý thuyết',
  bai_tap: 'Bài tập',
  chua_ro: 'Chưa rõ',
}

export const TEN_LOC_DANG: Record<LocDang, string> = {
  ngau_nhien: 'Ngẫu nhiên',
  ly_thuyet: 'Chỉ lý thuyết',
  bai_tap: 'Chỉ bài tập',
}

export const MOI_LOC_DANG: LocDang[] = ['ngau_nhien', 'ly_thuyet', 'bai_tap']
export const LOC_DANG_MAC_DINH: LocDang = 'ngau_nhien'

// ---------------------------------------------------------------------------
// MỘT NGUỒN SỰ THẬT CHO LUẬT ĐOÁN. Sửa số ở đây, không rải vào chỗ khác.

/** Số kèm ĐƠN VỊ ĐO thật. Bắt buộc có ranh giới từ hai đầu.
 *
 * Đã CỐ Ý bỏ `%`, `M`, `L`, `V`, `A`, `J`: một chữ cái đứng lẻ khớp vào giữa
 * công thức hoá học và vào phần trăm đồng vị của câu lý thuyết. Đo 06/09: giữ
 * chúng lại thì `chua_ro` vọt từ 8 % lên 41 %. */
export const SO_KEM_DON_VI = /\b\d+[,.]?\d*\s*(gam|g|kg|mg|mol|mmol|ml|mL|lít|lit|atm|kPa|kJ|nm|amu|đvC|°C)\b/i

/** ĐỘNG TỪ HỎI của một câu bắt tính toán.
 *
 * Cố ý KHÔNG nhận danh từ trần "khối lượng", "thể tích", "nồng độ": chúng đầy
 * trong câu lý thuyết ("khối lượng riêng của kim loại kiềm nhỏ vì…"). Chỉ nhận
 * khi chúng đi với một động từ hỏi. */
export const DONG_TU_HOI_TINH = /(^|[.;:]\s*)(tính|xác định)\s|giá trị của|là bao nhiêu|bao nhiêu\s*(gam|g|mol|ml|mL|lít|lit|%|kJ)|hiệu suất của|nồng độ mol của|phần trăm khối lượng/i

export const DIEM = {
  soKemDonVi: 2,
  dongTuHoi: 2,
  /** Đáp án là một con số trần ⇒ gần như chắc chắn phải tính ra nó. */
  dapAnSo: 3,
  vanDung: 1,
  /** Mức "biết" là tái hiện kiến thức — kéo mạnh về phía lý thuyết. */
  biet: -2,
} as const

/** Từ mốc này trở lên là bài tập. */
export const MOC_BAI_TAP = 3
/** Từ mốc này trở xuống là lý thuyết. Ở giữa hai mốc là `chua_ro`. */
export const MOC_LY_THUYET = 0

const LA_SO = /^-?\d+([,.]\d+)?$/

export interface CauDeDoan {
  /** Phần III (trả lời ngắn) LUÔN là bài tập — xem `dangCua`. */
  phan?: string
  text?: string
  /** Bốn phương án của Phần I, hoặc bốn ý của Phần II. */
  luaChon?: (string | undefined)[]
  /** Đáp án đúng. Chỉ dùng để biết nó có phải một con số trần không. */
  dapAn?: string
  mucDo?: string
  /** Nhãn thật từ pipeline nạp đề, khi kho đã có. Có thì dùng thẳng. */
  dang?: string
}

/** Điểm thô của luật đoán. Xuất ra để test và để màn hình giải thích được vì
 * sao một câu rơi vào nhóm nào. */
export function diemDang(c: CauDeDoan): number {
  const chu = [c.text ?? '', ...(c.luaChon ?? []).map((v) => v ?? '')].join(' ')
  let d = 0
  if (SO_KEM_DON_VI.test(chu)) d += DIEM.soKemDonVi
  if (DONG_TU_HOI_TINH.test(chu)) d += DIEM.dongTuHoi
  if (LA_SO.test(String(c.dapAn ?? '').trim())) d += DIEM.dapAnSo
  if (c.mucDo === 'van_dung') d += DIEM.vanDung
  if (c.mucDo === 'biet') d += DIEM.biet
  return d
}

/** Dạng của một câu.
 *
 * Ba tầng, theo thứ tự tin cậy giảm dần:
 *   1. Nhãn thật từ kho — có thì dùng, không đoán nữa.
 *   2. Phần III là trả lời ngắn: đáp án luôn là một con số em phải tính ra.
 *      Số đo 06/09 xác nhận 578/578 câu Phần III đều là bài tập.
 *   3. Điểm từ mặt chữ. */
export function dangCua(c: CauDeDoan): DangCau {
  if (c.dang === 'ly_thuyet' || c.dang === 'bai_tap') return c.dang
  if (c.phan === 'III') return 'bai_tap'
  const d = diemDang(c)
  if (d >= MOC_BAI_TAP) return 'bai_tap'
  if (d <= MOC_LY_THUYET) return 'ly_thuyet'
  return 'chua_ro'
}

/** Câu này có lọt bộ lọc dạng thầy chọn không.
 *
 * `ngau_nhien` nhận hết, KỂ CẢ `chua_ro`. Hai lựa chọn chặt chỉ nhận câu đã
 * chắc — đó là chỗ lời hứa "không lặng lẽ sai" được thi hành. */
export function hopDang(dang: DangCau, loc: LocDang): boolean {
  return loc === 'ngau_nhien' || dang === loc
}

/** Đếm từng nhóm để màn hình hiện thẳng ba con số cho thầy nhìn. */
export function demDang(ds: { dang: DangCau }[]): Record<DangCau, number> {
  const ra: Record<DangCau, number> = { ly_thuyet: 0, bai_tap: 0, chua_ro: 0 }
  for (const c of ds) ra[c.dang] += 1
  return ra
}

/** Còn bao nhiêu câu dùng được cho một lựa chọn lọc — để màn hình báo trước
 * khi thầy bấm rút, thay vì rút xong mới báo thiếu. */
export function soCauDung(dem: Record<DangCau, number>, loc: LocDang): number {
  if (loc === 'ngau_nhien') return dem.ly_thuyet + dem.bai_tap + dem.chua_ro
  return dem[loc]
}
