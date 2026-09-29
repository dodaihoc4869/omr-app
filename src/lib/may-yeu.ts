// CHẾ ĐỘ MÁY YẾU (thầy 29/09: "máy cấu hình yếu có vào mượt được không").
//
// Tự bật, em KHÔNG phải chọn: máy ít RAM (navigator.deviceMemory ≤ 3 GB), ít lõi (hardwareConcurrency ≤ 4),
// máy xin giảm chuyển động (prefers-reduced-motion) hoặc bật tiết kiệm dữ liệu (connection.saveData)
// ⇒ gắn lớp `may-yeu` lên <html>. `src/styles/may-yeu.css` đọc lớp này để tắt kính mờ (backdrop-filter),
// giảm bóng đổ lớn, cho hoạt ảnh trang trí chạy một lượt rồi đứng; các công tắc hiệu ứng nặng sẵn có
// (hạt sáng / thị sai / pháo của Sảnh và Đảo, bản giản lược của chương trận đấu) hỏi `giamHieuUng()`.
// Không đổi chức năng, không đổi chữ — chỉ bớt việc vẽ cho máy.
//
// Chỉ bật cho đường vào của học sinh / phụ huynh (main.tsx quyết); jsdom không chạy main.tsx nên test cũ không đổi.

export const LOP_MAY_YEU = 'may-yeu'

export type DauHieuMay = {
  /** navigator.deviceMemory (GB, trình duyệt làm tròn: 0.25/0.5/1/2/4/8). Safari không có. */
  boNhoGb?: number
  /** navigator.hardwareConcurrency (số luồng CPU). */
  soLoi?: number
  /** navigator.connection.saveData. */
  tietKiemDuLieu?: boolean
  /** matchMedia('(prefers-reduced-motion: reduce)'). */
  giamChuyenDong?: boolean
}

/** Máy có dấu hiệu yếu? Số không có / không hợp lệ ⇒ bỏ qua vế đó (không đoán). */
export function laMayYeu(d: DauHieuMay): boolean {
  if (d.giamChuyenDong || d.tietKiemDuLieu) return true
  if (typeof d.boNhoGb === 'number' && Number.isFinite(d.boNhoGb) && d.boNhoGb > 0 && d.boNhoGb <= 3) return true
  if (typeof d.soLoi === 'number' && Number.isFinite(d.soLoi) && d.soLoi > 0 && d.soLoi <= 4) return true
  return false
}

type NavigatorMay = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }

function xinGiamChuyenDong(w: Window): boolean {
  try {
    return typeof w.matchMedia === 'function' && !!w.matchMedia('(prefers-reduced-motion: reduce)')?.matches
  } catch {
    return false
  }
}

/** Đọc dấu hiệu từ trình duyệt; thiếu API nào thì để trống vế đó. */
export function docDauHieuMay(w: Window = window): DauHieuMay {
  const n = w.navigator as NavigatorMay | undefined
  const d: DauHieuMay = { giamChuyenDong: xinGiamChuyenDong(w) }
  try {
    if (n && typeof n.deviceMemory === 'number') d.boNhoGb = n.deviceMemory
    if (n && typeof n.hardwareConcurrency === 'number') d.soLoi = n.hardwareConcurrency
    if (n && n.connection && typeof n.connection.saveData === 'boolean') d.tietKiemDuLieu = n.connection.saveData
  } catch {
    /* trình duyệt chặn đọc — coi như không có dấu hiệu */
  }
  return d
}

/** Gắn lớp `may-yeu` lên <html> nếu máy yếu. Trả về true nếu đã bật. Lỗi bất kỳ ⇒ không bật (app chạy như cũ). */
export function batCheDoMayYeu(w: Window = window): boolean {
  try {
    if (!laMayYeu(docDauHieuMay(w))) return false
    w.document.documentElement.classList.add(LOP_MAY_YEU)
    return true
  } catch {
    return false
  }
}

/** Đang ở chế độ máy yếu (lớp đã gắn)? */
export function dangCheDoMayYeu(): boolean {
  try {
    return typeof document !== 'undefined' && document.documentElement.classList.contains(LOP_MAY_YEU)
  } catch {
    return false
  }
}

/** Công tắc chung cho hiệu ứng JS nặng (hạt, thị sai, pháo): máy xin giảm chuyển động HOẶC đang ở chế độ máy yếu.
 *  Không có window/matchMedia (jsdom, máy chủ) ⇒ false như trước. */
export function giamHieuUng(): boolean {
  if (typeof window === 'undefined') return false
  return xinGiamChuyenDong(window) || dangCheDoMayYeu()
}
