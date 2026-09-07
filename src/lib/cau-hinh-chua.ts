// CẤU HÌNH RÚT CÂU CHỮA THEO DẠNG BÀI — đặc tả v3 mục 3.
//
// MỘT NGUỒN SỰ THẬT. Cấm rải mấy con số này vào component hay lib khác.

import type { MucDoCau } from './bai-tap-pdf'

/** Vị trí ban đầu của thanh kéo, và số câu cho chỗ KHÔNG có màn (báo cáo phụ
 * huynh). Đặc tả v4 mục 3.
 *
 * Đây là MẶC ĐỊNH, không phải TRẦN. v3 có `TRAN_CAU_CHUA = 10` chặn cứng nên
 * thầy kéo bao nhiêu cũng chỉ ra 10; v4 bỏ hẳn: trần là `tongUngVien` — số câu
 * kho THẬT SỰ có cùng nhãn với những câu em sai. */
export const SO_CAU_MAC_DINH = 10

/** Tính cả câu CÙNG CƠ CHẾ khác việc phải làm vào ứng viên (bậc 2).
 *
 * v4 hạ xuống `false`: bậc 2 là câu gần dạng chứ không đúng dạng, bật sẵn thì
 * thầy tưởng mọi câu trong phiếu đều trúng lỗi. Bật ở màn Cài đặt khi cần, lúc
 * đó max của thanh kéo đổi ngay tại chỗ. */
export const CHO_BAC_2 = false

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
