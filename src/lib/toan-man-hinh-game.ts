// GAME TỰ VÀO TOÀN MÀN HÌNH (thầy lệnh 21/09: "vào bất kì màn game nào đều TỰ ra full màn hình và GIỮ nút Về app học sinh"; KHÔNG có nút bật/thoát).
// Luật (Boss chốt):
//  1. Xin toàn màn hình NGAY TRONG cú chạm mở game (`xinToanManHinh('cu-cham-vao')`) — còn cử chỉ người dùng.
//  2. Vào thẳng bằng link / tải lại / lazy-load làm mất cử chỉ ⇒ xin lại ở lần chạm ĐẦU TIÊN trong game, đúng MỘT lần mỗi lượt vào
//     (`xinToanManHinh('cham-dau')` do `useToanManHinhGame` gọi).
//  3. Trình duyệt từ chối / không có API (iPhone Safari) ⇒ IM LẶNG, không báo lỗi; bố cục phủ kín 100dvh + vùng an toàn vẫn như cũ.
//  4. Em tự thoát toàn màn hình giữa chừng ⇒ KHÔNG ép lại trong lượt đó.
//  5. Rời game (Về app học sinh / đổi tab / đóng màn) ⇒ thoát toàn màn hình của mình. Không khoá xoay màn hình.
// TUYỆT ĐỐI không đụng ExamTakeScreen và các tín hiệu rời màn của ca kiểm tra: tệp này chỉ được gọi từ cổng học sinh khi mở/đóng TAB GAME.
// Không dùng thư viện; mọi API trình duyệt bọc try/catch.
type PhanTuToanMan = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void }
type TaiLieuToanMan = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> | void }

interface Luot {
  /** Đã xin ở cú chạm mở game. */
  xinCuChamVao: boolean
  /** Đã xin ở lần chạm đầu tiên trong game. */
  xinChamDau: boolean
  /** Đã THẤY màn hình vào toàn màn hình trong lượt này (để phân biệt "em thoát" với "chưa từng vào"). */
  daVao: boolean
  /** Em tự thoát toàn màn hình ⇒ không ép lại. */
  emThoat: boolean
}

const luotMoi = (): Luot => ({ xinCuChamVao: false, xinChamDau: false, daVao: false, emThoat: false })
let luot: Luot = luotMoi()

export function dangToanManHinh(): boolean {
  if (typeof document === 'undefined') return false
  const d = document as TaiLieuToanMan
  return !!(d.fullscreenElement || d.webkitFullscreenElement)
}

/** Gọi API của trình duyệt, nuốt MỌI lỗi (kể cả promise bị từ chối). */
function goiIm(f: () => Promise<void> | void): void {
  try {
    const r = f()
    if (r && typeof (r as Promise<void>).catch === 'function') (r as Promise<void>).catch(() => {})
  } catch {
    /* im lặng */
  }
}

/**
 * Xin toàn màn hình cho cả trang. `nguon`:
 *  · 'cu-cham-vao' — gọi thẳng trong cú chạm mở game (mỗi lượt một lần);
 *  · 'cham-dau'   — lần chạm đầu tiên trong game, CHỈ khi chưa toàn màn hình (mỗi lượt một lần).
 * Không có API / em đã tự thoát / đã xin đủ ⇒ không làm gì, không lỗi.
 */
export function xinToanManHinh(nguon: 'cu-cham-vao' | 'cham-dau'): void {
  if (typeof document === 'undefined' || luot.emThoat) return
  if (nguon === 'cu-cham-vao') {
    if (luot.xinCuChamVao) return
    luot.xinCuChamVao = true
  } else {
    if (luot.xinChamDau || dangToanManHinh()) return
    luot.xinChamDau = true
  }
  const goc = document.documentElement as PhanTuToanMan
  if (typeof goc.requestFullscreen === 'function') goiIm(() => goc.requestFullscreen({ navigationUI: 'hide' } as FullscreenOptions))
  else if (typeof goc.webkitRequestFullscreen === 'function') goiIm(() => goc.webkitRequestFullscreen!())
}

/** Thoát toàn màn hình (nếu đang) và mở lượt mới cho lần vào sau. Gọi khi rời game. */
export function ketThucLuotToanManHinh(): void {
  const d = typeof document === 'undefined' ? null : (document as TaiLieuToanMan)
  if (d && dangToanManHinh()) {
    if (typeof d.exitFullscreen === 'function') goiIm(() => d.exitFullscreen())
    else if (typeof d.webkitExitFullscreen === 'function') goiIm(() => d.webkitExitFullscreen!())
  }
  luot = luotMoi()
}

/** Theo dõi `fullscreenchange`: đã vào rồi mà thoát ra (không phải do mình) ⇒ em tự thoát ⇒ không ép lại. Trả hàm gỡ. */
export function theoDoiToanManHinh(): () => void {
  if (typeof document === 'undefined') return () => {}
  const khiDoi = () => {
    if (dangToanManHinh()) {
      luot.daVao = true
    } else if (luot.daVao) {
      // Đã vào rồi mà thoát ra. Lần rời game do CHÍNH MÌNH gọi thì `ketThucLuotToanManHinh` đã mở lượt mới (daVao=false) trước khi sự kiện tới ⇒ không lọt vào đây.
      luot.emThoat = true
      luot.daVao = false
    }
  }
  document.addEventListener('fullscreenchange', khiDoi)
  document.addEventListener('webkitfullscreenchange', khiDoi)
  return () => {
    document.removeEventListener('fullscreenchange', khiDoi)
    document.removeEventListener('webkitfullscreenchange', khiDoi)
  }
}

/** Dùng cho test: đặt lại mọi trạng thái của lượt. */
export function datLaiLuotToanManHinh(): void {
  luot = luotMoi()
}
