// Phần của lam-bai.ts CHỈ màn làm chặng (ManLamBaiTap, nạp lười) dùng — tách ra khỏi mảnh dùng chung để lượt mở cổng học sinh không tải các hàm này (mốc tải 29/10).
import { CAU_MOI_CHANG, type SoHomNay } from './lam-bai'

/** Các cạnh của khung đo (`getBoundingClientRect`), tính theo khung nhìn. */
export type KhungDo = Pick<DOMRect, 'top' | 'bottom' | 'left' | 'right'>

/**
 * HÀNG Ô PHẢI THẤY ĐƯỢC KHI EM GÕ (15/10, việc văn phòng a254c6118c6b): màn nhỏ, câu dài ⇒ thanh đáy (bàn phím số, dính đáy) che hàng ô (340×760 câu
 * amine 6 dòng: đáy hàng ô 481, đỉnh thanh 447 ⇒ em bấm "2" "4" mà hai ô bị cắt nửa). Trả số px cần cuộn xuống để đáy hàng ô nằm trên đỉnh thanh
 * cách `khoang` px. 0 khi: đã thấy trọn · thanh không chồng ngang hàng ô (màn rộng / xoay ngang: thanh là cột phải) · chưa đo được (khung rỗng).
 */
export function cuonDeThayO(hang: KhungDo, thanh: KhungDo, khoang = 12): number {
  const coDo = (r: KhungDo) => r.right > r.left && r.bottom > r.top
  if (!coDo(hang) || !coDo(thanh)) return 0
  if (thanh.left >= hang.right || thanh.right <= hang.left) return 0
  const can = hang.bottom - thanh.top + khoang
  return can > 0 ? Math.ceil(can) : 0
}

/** Đủ điều kiện bấm "Nộp câu" ở màn luyện: như `duTraLoi` + Phần III phải có ít nhất một chữ số (không nộp "-" hay "," trơn). */
export function coChuSo(v: string): boolean {
  return /\d/.test(v)
}

/**
 * Số hôm nay nhánh Gói 7 từ HAI con số máy chủ (đã làm, M) — đúng luật nhánh `goi7` của `soHomNay` (chặng = ⌈M/6⌉, đang ở chặng ⌊đã làm/6⌋ + 1).
 * Màn làm bài dùng với số của `hoc-tap-start` (lúc mở chặng) và lệnh nhẹ `hoc-tap-dem` (sau mỗi câu) — không nạp lại cả sảnh sau mỗi câu.
 */
export function soHomNayGoi7(daLam: number, muc: number): SoHomNay | null {
  if (!Number.isFinite(daLam) || daLam < 0 || !Number.isFinite(muc) || muc <= 0) return null
  const soChang = Math.ceil(muc / CAU_MOI_CHANG)
  return { daLam, muc, chang: Math.min(soChang, Math.floor(daLam / CAU_MOI_CHANG) + 1), soChang }
}

/** Danh sách số câu thành chữ: [2] ⇒ "Câu 2" · [2, 4] ⇒ "Câu 2 và 4" · [1, 2, 4] ⇒ "Câu 1, 2 và 4". */
export function chuDanhSachCau(so: number[]): string {
  if (!so.length) return ''
  if (so.length === 1) return `Câu ${so[0]}`
  return `Câu ${so.slice(0, -1).join(', ')} và ${so[so.length - 1]}`
}

