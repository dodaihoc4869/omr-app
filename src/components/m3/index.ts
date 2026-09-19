// THƯ VIỆN M3 DÙNG CHUNG cho các component ĐỘC LẬP của cổng học sinh / phụ huynh
// (việc C, phiên Code 4). Bảng màu KHÔNG nằm ở đây: nó là `m3-theme.css` của
// Bảng nhiệm vụ (Code 2) — nạp lại đúng tệp đó, không có bảng màu thứ hai.
import '../bang-nhiem-vu/m3-theme.css'
import './m3.css'
import './m3-tuong-thich.css'
import { laManThayQuanLy, docDuongVao } from '../../lib/vai-tro'

/** Đang ở vùng HỌC SINH / PHỤ HUYNH (đường /hs, /ph, ?examCode=, ?vai=phieu…)
 *  hay chưa? Cùng phép `App.tsx` dùng để tách app của thầy khỏi hai cổng: `true`
 *  = cổng em/phụ huynh, được mặc bộ mặt M3; `false` = app giáo viên (đường `/`,
 *  `/gv`) và vitest mặc định (jsdom ở `/`) — giữ nguyên giao diện cũ.
 *
 *  Component nào còn được app giáo viên dùng chung thì CHỈ gắn `m3` lên phần tử
 *  gốc khi hàm này trả `true`. Đọc `location` mỗi lần vẽ (rẻ); hai tham số cho
 *  test dựng đường bất kỳ mà không phải đổi `location`. */
export function dungM3(search?: string, duongDan?: string): boolean {
  try {
    if (search === undefined && duongDan === undefined && typeof location === 'undefined') return false
    return !laManThayQuanLy(search ?? location.search, duongDan ?? location.pathname)
  } catch {
    return false
  }
}

export { default as NutTron } from './NutTron'
export { default as ThanhTren } from './ThanhTren'

/** Đường vào là MÀN THI / XEM ĐIỂM của em (`?examCode=…`, `/t/<mã ca>`, `/d/<mã ca>`) — cùng phép App.tsx dùng.
 *  Khác `dungM3()` ở chỗ nó KHÔNG đúng cho game thần thú (`/hs` trần): TheCau dùng cả ở game, nên ở màn thi mới tự mang
 *  `m3`; mọi chỗ khác thẻ câu chỉ đổi khi đã có tổ tiên `.m3` do màn gọi đặt. */
export function laManThi(search?: string, duongDan?: string): boolean {
  try {
    if (search === undefined && duongDan === undefined && typeof location === 'undefined') return false
    return !!docDuongVao(search ?? location.search, duongDan ?? location.pathname).maCa
  } catch {
    return false
  }
}
