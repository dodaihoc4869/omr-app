// ƯU TIÊN NHÃN KIẾN THỨC — LÕI THUẦN (dùng chung BTVN nâng đỡ + bài hằng ngày của phụ huynh).
//
// Một chỗ duy nhất cho luật "nhãn kiến thức em còn yếu thì câu ấy đáng chọn hơn": chuẩn hoá nhãn, gom bằng chứng
// theo em, rồi tính ĐIỂM THƯỞNG có trần. THUẦN: không IO, không đọc đồng hồ, không `Math.random()`; cùng đầu vào ⇒ cùng kết quả.
//
// Đây KHÔNG phải lược đồ mới: chỉ là hàm nhỏ nhận dữ liệu đã có (nhãn của câu + lịch sử của CHÍNH em) và trả con số.
// Nhờ vậy `btvn-nang-do.ts` (đang có bản sao nội tuyến) và `parent-news-chon-cau.ts` dùng CHUNG một định nghĩa.

/** Trần điểm thưởng nhãn cho MỘT câu (khớp `BTVN_NANG_DO` bản cũ: `Math.min(4, …)`). */
export const TRAN_THUONG_NHAN = 4

/** Hệ số: mỗi câu ĐÚNG ở nhãn trừ đi bấy nhiêu lần số câu SAI (khớp `sai - 2 * dung`). */
export const HE_SO_DUNG = 2

/** Nhãn của một câu: chuỗi, cắt khoảng trắng, bỏ rỗng, khử trùng — giữ thứ tự xuất hiện. */
export function chuanNhanKienThuc(tho: unknown): string[] {
  const ds = Array.isArray(tho) ? tho : []
  const ra: string[] = []
  const thay = new Set<string>()
  for (const x of ds) {
    if (typeof x !== 'string') continue
    const kt = x.trim()
    if (kt === '' || thay.has(kt)) continue
    thay.add(kt)
    ra.push(kt)
  }
  return ra
}

/** Bằng chứng của MỘT câu trong lịch sử của chính em (nơi gọi tự dựng từ sổ/hồ sơ của em ấy). */
export interface BangChungCau {
  /** Câu này em từng làm sai và CHƯA khắc phục (đang phải ôn). */
  sai: boolean
  /** Câu này em đã khắc phục / chưa từng sai (đã nắm). */
  dung: boolean
  /** Câu này em đã đúng lại ở ≥ 2 NGÀY KHÁC NHAU ⇒ làm nữa là phí sức, KHÔNG thưởng nhãn. */
  daDungLai: boolean
}

/** Lịch sử của em, tra theo qid. Vắng qid ⇒ em chưa từng gặp câu ấy (không có bằng chứng). */
export type LichSuCuaEm = ReadonlyMap<string, BangChungCau>

/** Một câu ứng viên: qid + nhãn kiến thức thô (chưa chuẩn hoá). */
export interface CauCoNhan {
  qid: string
  kienThuc?: unknown
}

/** Bảng điểm nhãn đã gom cho MỘT em: nhãn → điểm yếu (đã kẹp ≥ 0). */
export type DiemNhan = ReadonlyMap<string, number>

/**
 * Gom bằng chứng theo NHÃN cho một em: `sai - 2 * dung`, kẹp ≥ 0 SAU khi cộng đủ tổng (không phụ thuộc thứ tự duyệt).
 * Nhãn không xuất hiện trong bằng chứng sai ⇒ không có trong bảng (điểm 0).
 */
export function gomDiemNhan(cau: readonly CauCoNhan[], lichSu: LichSuCuaEm): DiemNhan {
  const sai = new Map<string, number>()
  const dung = new Map<string, number>()
  for (const c of cau) {
    const bc = lichSu.get(c.qid)
    if (!bc) continue
    const nhan = chuanNhanKienThuc(c.kienThuc)
    if (nhan.length === 0) continue
    if (bc.sai) for (const kt of nhan) sai.set(kt, (sai.get(kt) || 0) + 1)
    if (bc.dung) for (const kt of nhan) dung.set(kt, (dung.get(kt) || 0) + 1)
  }
  const ra = new Map<string, number>()
  for (const [kt, s] of sai) ra.set(kt, Math.max(0, s - HE_SO_DUNG * (dung.get(kt) || 0)))
  return ra
}

/**
 * ĐIỂM THƯỞNG NHÃN của một câu: tổng điểm yếu của các nhãn câu ấy mang, kẹp ≤ `TRAN_THUONG_NHAN`.
 * Câu em đã đúng lại ≥ 2 ngày khác nhau ⇒ 0 (không "hồi sinh" câu đã thành thạo). Nhãn rỗng ⇒ 0.
 */
export function thuongNhan(c: CauCoNhan, diemNhan: DiemNhan, daDungLai = false): number {
  if (daDungLai) return 0
  let t = 0
  for (const kt of chuanNhanKienThuc(c.kienThuc)) t += diemNhan.get(kt) || 0
  return Math.min(TRAN_THUONG_NHAN, t)
}

/**
 * Số câu ĐÃ CHỌN cùng nhãn với câu ứng viên (để trừ nhẹ, không dồn hết vào một kỹ năng).
 * `daChon` là danh sách câu đã chọn (có nhãn); so khớp theo nhãn chung.
 */
export function trungNhan(c: CauCoNhan, daChon: readonly CauCoNhan[]): number {
  const nhan = chuanNhanKienThuc(c.kienThuc)
  if (nhan.length === 0) return 0
  let dem = 0
  for (const d of daChon) {
    const nhan2 = chuanNhanKienThuc(d.kienThuc)
    if (nhan2.some((kt) => nhan.includes(kt))) dem++
  }
  return dem
}
