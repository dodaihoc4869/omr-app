// BÌNH PHẢN ỨNG — PHÂN BIỆT «TẮT MÀN HÌNH» VỚI «RỜI MÀN» trên máy em (thầy chốt 10/11: «chỉ tắt màn hình là không báo; thoát app, về màn hình chính,
// cửa sổ nổi, chia đôi màn hình báo TỨC THÌ; giữ chặt cho mọi điện thoại»). Nằm trong mảnh BPU nạp lười ⇒ không thêm byte mở app /hs.
//
// VÌ SAO KHÔNG ĐOÁN BẰNG HẸN GIỜ NỮA (lỗi thầy báo 10/11, em tắt màn vẫn bị −50 kJ): mã cũ cho rằng tắt màn ⇒ trình duyệt đóng băng trang ⇒ hẹn giờ chạy
// trễ. Android Chrome KHÔNG đóng băng ngay khi tắt màn (hẹn giờ vẫn chạy đúng hạn) ⇒ báo nhầm. Trên web, sự kiện tắt màn và chuyển app GIỐNG HỆT nhau
// (visibilitychange hidden + blur); chỉ có một tín hiệu thật: IdleDetector (`screenState: 'locked'`), Chrome Android ≥ 94, cần quyền `idle-detection`.
//
// ĐỘ TRỄ CỦA IdleDetector (đã đọc mã Chromium 10/11 — ui/base/idle/idle_polling_service.cc, ui/android/.../IdleDetector.java,
// content/browser/idle/idle_manager_impl.cc): trên Android trạng thái khoá chỉ được HỎI LẠI mỗi 15 giây (`kPollInterval`) ⇒ sự kiện `change` có thể trễ
// tới 15 s — không dùng được. NHƯNG khi một máy dò MỚI `start()` mà trình duyệt đang không có máy dò nào, IdleManagerImpl::AddMonitor ⇒ IdlePollingService
// hỏi hệ điều hành NGAY (PollIdleState: KeyguardManager.inKeyguardRestrictedInputMode() || !PowerManager.isInteractive()). Bấm nút nguồn ⇒ isInteractive
// = false trước khi Chrome nhận onStop ⇒ lúc trang ẩn, hỏi tươi là thấy 'locked'. Vì vậy: mỗi lần trang ẩn tạo một máy dò mới, đọc `screenState` khi
// `start()` xong (một vòng IPC, vài ms), rồi huỷ ngay (để lần sau lại được hỏi tươi). Không chờ hẹn giờ.
//
// NHẬN DIỆN MÁY: KHÔNG đoán theo tên trình duyệt (UA). Chỉ có Chrome (Android) cài IdleDetector; iPhone / iPad (WebKit), Firefox không có ⇒ tự rơi vào
// nhánh GIỮ CHẶT: trang ẩn là báo rời ngay, kể cả bấm khoá màn. Android từ chối quyền / chưa trả lời ⇒ cũng giữ chặt.

type TrangThaiQuyen = 'granted' | 'denied' | 'prompt' | null
type MayDo = { screenState: string | null; start: (o: { threshold: number; signal: AbortSignal }) => Promise<void> }
type LopMayDo = { new (): MayDo; requestPermission?: () => Promise<string> }

const lopMayDo = (): LopMayDo | null => (typeof window !== 'undefined' && (window as unknown as { IdleDetector?: LopMayDo }).IdleDetector) || null

let quyen: TrangThaiQuyen = null
let dangXin: Promise<unknown> | null = null
let daDoc = false
/** Đã xin một lần trong lần nạp trang này (em gạt hộp đi không chọn ⇒ 'prompt' — không hỏi lại ở mỗi lần chạm đáp án). */
let daXin = false

/** Đọc trạng thái quyền sẵn có (không hiện hộp hỏi) — gọi khi màn BPU gắn. */
export function docQuyenTatMan(): void {
  if (daDoc || !lopMayDo()) return
  daDoc = true
  try {
    const p = (navigator as Navigator & { permissions?: { query: (d: { name: string }) => Promise<{ state: string; onchange: (() => void) | null }> } }).permissions
    void p?.query({ name: 'idle-detection' }).then((s) => {
      const doc = () => { quyen = s.state === 'granted' || s.state === 'denied' ? s.state : 'prompt' }
      doc(); s.onchange = doc
    }).catch(() => {})
  } catch { /* trình duyệt không hỏi được quyền */ }
}

/** Xin quyền `idle-detection` — PHẢI gọi trong thao tác của em (nút «Vào Bình Phản Ứng», lần chạm `click` trên màn BPU). Đã rõ (cho / từ chối) ⇒ không hỏi
 *  lại. Gọi TRƯỚC `requestFullscreen` (toàn màn hình «tiêu» lượt thao tác). Trong lúc hộp hỏi quyền hiện, trang mất tiêu điểm ⇒ `dangXinQuyen()` để nhánh
 *  cửa sổ nổi KHÔNG báo nhầm. */
export function xinQuyenTatMan(): void {
  const L = lopMayDo()
  if (!L?.requestPermission || daXin || dangXin || quyen === 'granted' || quyen === 'denied') return
  daXin = true
  try {
    const p = L.requestPermission()
    dangXin = p
    void p.then((s) => { quyen = s === 'granted' ? 'granted' : s === 'denied' ? 'denied' : 'prompt' }, () => {}).finally(() => { if (dangXin === p) dangXin = null })
  } catch { dangXin = null }
}
export const dangXinQuyen = (): boolean => dangXin !== null || choHop > 0 || !!kiemNgoai?.()
/** LIVE: thư viện live của máy em tự xin quyền mic (em được gọi lên bảng) và biết lúc hộp hỏi đang hiện (`dangChoQuyenMic`) ⇒ lớp live gắn hàm hỏi vào đây
 *  (gỡ bằng null) để nhánh «cửa sổ nổi» không báo nhầm. */
let kiemNgoai: (() => boolean) | null = null
export function datKiemQuyenNgoai(f: (() => boolean) | null): void { kiemNgoai = f }
/** LIVE (10/11, đặc tả mục 4.7): hộp hỏi quyền KHÁC của trình duyệt (mic khi em được mời nói…) cũng làm trang mất tiêu điểm ⇒ bọc lời hứa xin quyền
 *  bằng hàm này để nhánh «cửa sổ nổi» không báo nhầm trong lúc hộp đang hiện. Trả lại chính lời hứa đó. */
let choHop = 0
export function choHopQuyen<T>(p: Promise<T>): Promise<T> {
  choHop += 1
  const xong = () => { choHop = Math.max(0, choHop - 1) }
  p.then(xong, xong)
  return p
}

/** KHOÁ XOAY (live 10/11, đặc tả mục 4.7): lúc máy đang xoay / vào-ra toàn màn hình, sự kiện đổi cỡ cửa sổ và hướng màn tới LỆCH nhau vài chục ms
 *  (khung trang còn dọc mà hướng máy đã ngang, hoặc ngược lại) ⇒ so cỡ sẽ ra «chia đôi» giả. Trong 600 ms sau `lock()` / `unlock()` / `orientationchange`
 *  / đổi toàn màn hình thì CHƯA xét chia đôi; hết khoá xét lại (màn Bình Phản Ứng hẹn kiểm lại sau `conKhoaXoay()`). */
export const KHOA_XOAY_MS = 600
let khoaXoayDen = 0
export function khoaXoay(ms: number = KHOA_XOAY_MS): void { khoaXoayDen = Math.max(khoaXoayDen, Date.now() + ms) }
/** Mili-giây còn lại của khoá xoay (0 = không khoá). */
export const conKhoaXoay = (): number => Math.max(0, khoaXoayDen - Date.now())
/** Máy phân biệt được tắt màn (có IdleDetector + đã có quyền). Sai ⇒ nhánh GIỮ CHẶT. */
export const coQuyenTatMan = (): boolean => quyen === 'granted' && !!lopMayDo()

/** Hỏi TƯƠI màn hình đã khoá chưa: true = khoá / tắt màn, false = đang mở khoá, null = không biết (lỗi / mất quyền ⇒ người gọi coi như rời). */
export async function kiemKhoaMan(): Promise<boolean | null> {
  const L = lopMayDo()
  if (!L || quyen !== 'granted') return null
  const huy = new AbortController()
  try {
    const d = new L()
    await d.start({ threshold: 60_000, signal: huy.signal }) // ngưỡng nhỏ nhất trình duyệt cho phép; chỉ đọc screenState
    return d.screenState === 'locked' ? true : d.screenState === 'unlocked' ? false : null
  } catch { return null } finally { huy.abort() }
}

/** CHIA ĐÔI MÀN HÌNH / iPad Split View: cửa sổ trang nhỏ hẳn so với màn máy (đọc theo khung bố cục `documentElement.client*` — không đổi khi chụm phóng
 *  to trên iPhone, không đổi khi bàn phím bật trên Chrome ≥ 108 / Safari). Chỉ máy cảm ứng (`pointer: coarse`) — máy tính để cửa sổ nhỏ không tính.
 *  Ngưỡng: rộng < 80 % màn (thanh trình duyệt không bao giờ ăn bề ngang) hoặc cao < 60 % (thanh địa chỉ + thanh trạng thái + thanh điều hướng ≤ ~25 %;
 *  chia đôi ⇒ ≤ 50 %). Đang gõ trong ô nhập (máy cũ bàn phím co trang) ⇒ bỏ qua chiều cao. */
export function dangChiaDoi(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia?.('(pointer: coarse)').matches) return false
  if (conKhoaXoay() > 0) return false // đang xoay / đổi toàn màn hình: cỡ và hướng chưa khớp nhau ⇒ chưa xét (hết khoá xét lại)
  const s = window.screen, de = document.documentElement
  const w = de.clientWidth, h = de.clientHeight
  if (!s?.width || !s?.height || !w || !h) return false
  const dai = Math.max(s.width, s.height), ngan = Math.min(s.width, s.height)
  // Hướng máy lấy từ MÀN (không từ cửa sổ: chia đôi / bàn phím làm cửa sổ «ngang» khi máy đang dọc). iOS < 16.4 chưa có screen.orientation ⇒ window.orientation.
  const huong = (s as Screen & { orientation?: { type?: string } }).orientation?.type, goc = (window as Window & { orientation?: number }).orientation
  const ngang = huong ? huong.startsWith('landscape') : typeof goc === 'number' ? Math.abs(goc) === 90 : w > h
  const W = ngang ? dai : ngan, H = ngang ? ngan : dai
  const el = document.activeElement as HTMLElement | null
  const goPhim = !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
  return w < W * 0.8 || (!goPhim && h < H * 0.6)
}

/** Chỉ cho test: xoá trạng thái quyền giữa các ca. */
export function _datLaiTatMan(): void { quyen = null; dangXin = null; daDoc = false; daXin = false; choHop = 0; khoaXoayDen = 0; kiemNgoai = null }
