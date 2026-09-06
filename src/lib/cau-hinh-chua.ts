// CẤU HÌNH RÚT CÂU CHỮA THEO DẠNG BÀI — đặc tả v3 mục 3.
//
// MỘT NGUỒN SỰ THẬT. Cấm rải mấy con số này vào component hay lib khác.

import type { MucDoCau } from './bai-tap-pdf'

/** Số câu chữa cho MỖI câu sai. */
export const SO_CAU_MOI_CAU_SAI = 2

/** Tổng câu chữa một phiếu. */
export const TRAN_CAU_CHUA = 10

/** Cho phép lấy câu CÙNG NHÁNH CƠ CHẾ khi hết câu cùng mã (bậc 2).
 *
 * Tắt thì hết câu cùng mã là dừng hẳn. Bật thì được nới đúng MỘT tầng — cùng
 * chuyên đề VÀ cùng cơ chế, chỉ khác việc phải làm — và câu đó phải mang cờ
 * `bac: 2` để thầy nhìn ra ngay. Không có tầng ba. */
export const CHO_BAC_2 = true

/** Thứ tự ưu tiên chữa: sai câu nhận biết là hổng nền, chữa trước. */
export const UU_TIEN_BAC: MucDoCau[] = ['biet', 'hieu', 'van_dung']

/** Vị trí của một bậc trong thứ tự ưu tiên. Bậc trống xếp cuối — không biết
 * bậc thì không dám nói là hổng nền. */
export function hangUuTien(m: MucDoCau | ''): number {
  const i = UU_TIEN_BAC.indexOf(m as MucDoCau)
  return i < 0 ? UU_TIEN_BAC.length : i
}

// ---------------------------------------------------------------------------
// MÃ DẠNG BA TẦNG: <CHUYÊN ĐỀ>.<CƠ CHẾ>.<VIỆC PHẢI LÀM>
//
// Ví dụ `ESTER.THUY_PHAN_BASE.TINH_KHOI_LUONG`. Bảng mã đóng sống ở
// `kho-de/DANG-BAI.md` trên máy thầy; app chỉ SO MÃ, không tự nghĩ mã.

/** Hai tầng đầu của một mã — dùng để xét bậc 2. Mã không đủ ba tầng trả ''. */
export function nhanhCoChe(ma: string | null | undefined): string {
  const t = String(ma ?? '').split('.')
  return t.length >= 3 && t[0] && t[1] ? `${t[0]}.${t[1]}` : ''
}

/** Mã có đúng khuôn ba tầng không. Dùng để chặn mã rác lọt vào kho. */
export function maDangHopLe(ma: string | null | undefined): boolean {
  return /^[A-Z0-9_]+\.[A-Z0-9_]+\.[A-Z0-9_]+$/.test(String(ma ?? ''))
}
