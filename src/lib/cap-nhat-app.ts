// TỰ CẬP NHẬT BẢN MỚI.
//
// Lý do có file này: thầy sửa lỗi, đẩy bản mới lên, mở lại app trên máy vẫn
// thấy bản cũ và tưởng chưa sửa. Service worker giữ bản đã tải trong bộ nhớ
// máy (workbox precache) và chỉ hỏi máy chủ xem có bản mới đúng LÚC ĐĂNG KÝ —
// tab đang mở cả buổi, hoặc app PWA khôi phục lại từ nền, đều không hỏi lại.
//
// Ở đây hỏi thêm vào 3 thời điểm rẻ và đúng lúc: khi quay lại app (bật màn
// hình, chuyển tab về), khi có mạng lại, và mỗi 30 phút nếu app cứ mở. Có bản
// mới thì workbox (registerType 'autoUpdate') tự thay và tự tải lại trang —
// bài làm đang dở không mất vì lưu liên tục vào IndexedDB (exam-db.ts).

/** Khoảng cách giữa hai lần tự hỏi máy chủ khi app cứ mở (ms). */
export const NHIP_HOI_MS = 30 * 60 * 1000

// ĐANG LÀM BÀI THÌ KHÔNG HỎI. Có bản mới là app tự tải lại trang — giữa lúc em
// đang thi thì tải lại làm mất toàn màn hình, và máy chống gian lận có thể tính
// đó là một lần rời màn. Bài không mất (IndexedDB), nhưng em hoảng là có thật.
// Bản mới chờ tới lúc em nộp xong cũng không muộn.
let dangLamBai = false

/** ExamTakeScreen gọi khi vào/ra màn làm bài. */
export function datDangLamBai(v: boolean): void {
  dangLamBai = v
}

export function dangLamBaiKhong(): boolean {
  return dangLamBai
}

/** Khoảng cách tối thiểu giữa hai lần hỏi — chặn hỏi dồn khi người dùng bật
 * tắt màn hình liên tục. */
export const GIAN_CACH_TOI_THIEU_MS = 60 * 1000

export interface DangKySW {
  update: () => Promise<unknown>
  /** Bản mới đã tải xong nhưng còn nằm chờ (chưa chiếm quyền). */
  waiting?: { postMessage: (m: unknown) => void } | null
}

/** Đẩy bản đang nằm chờ vào chạy ngay.
 *
 * Bản sinh ra từ `3420563` trở về trước chỉ gọi `skipWaiting()` KHI NHẬN được
 * tin nhắn này, nên máy nào còn giữ service worker cũ vẫn cần một cú đẩy. Từ
 * bản sau, sw tự gọi `skipWaiting` lúc cài nên hàm này chỉ còn là dây bảo hiểm. */
export function daySangBanMoi(dangKy: DangKySW): void {
  dangKy.waiting?.postMessage({ type: 'SKIP_WAITING' })
}

/**
 * Bật tự hỏi bản mới cho một đăng ký service worker.
 * Trả về hàm gỡ (dùng trong test và khi cần tắt).
 */
export function batTuHoiBanMoi(
  dangKy: DangKySW,
  moiTruong: {
    addEventListener: (t: string, f: () => void) => void
    removeEventListener: (t: string, f: () => void) => void
    an?: () => boolean
    now?: () => number
    setInterval?: (f: () => void, ms: number) => number
    clearInterval?: (id: number) => void
  },
): () => void {
  const now = moiTruong.now || (() => Date.now())
  const an = moiTruong.an || (() => false)
  const datNhip = moiTruong.setInterval || ((f, ms) => setInterval(f, ms) as unknown as number)
  const goNhip = moiTruong.clearInterval || ((id) => clearInterval(id))

  let hoiLanCuoi = 0

  const hoi = () => {
    if (dangLamBaiKhong()) return
    const t = now()
    if (t - hoiLanCuoi < GIAN_CACH_TOI_THIEU_MS) return
    hoiLanCuoi = t
    void Promise.resolve(dangKy.update())
      .then(() => daySangBanMoi(dangKy))
      .catch(() => {})
  }

  const khiQuayLai = () => {
    if (an()) return
    hoi()
  }

  moiTruong.addEventListener('visibilitychange', khiQuayLai)
  moiTruong.addEventListener('focus', khiQuayLai)
  moiTruong.addEventListener('online', hoi)
  const nhip = datNhip(hoi, NHIP_HOI_MS)

  return () => {
    moiTruong.removeEventListener('visibilitychange', khiQuayLai)
    moiTruong.removeEventListener('focus', khiQuayLai)
    moiTruong.removeEventListener('online', hoi)
    goNhip(nhip)
  }
}

/** BẢN MỚI CHIẾM QUYỀN THÌ TẢI LẠI TRANG NGAY.
 *
 * LỖI ĐÃ DÍNH 04-09, dính nhiều lần liền: thầy sửa lỗi, đẩy bản mới lên, CI
 * chạy xong, nhưng app đang mở trên máy thầy vẫn chạy MÃ CỦA BẢN CŨ trong bộ
 * nhớ. Service worker mới đã chiếm quyền (skipWaiting + clientsClaim) nhưng
 * việc đó chỉ đổi thứ được TẢI TỪ ĐÂY VỀ SAU — trang đang mở thì không.
 * Thầy thử lại, thấy y nguyên lỗi cũ, và tưởng tôi chưa sửa.
 *
 * `controllerchange` bắn đúng lúc bản mới chiếm quyền. Nghe sự kiện đó rồi
 * tải lại là trang nhận đúng mã mới.
 *
 * BA CHỐT AN TOÀN:
 *   · Đang làm bài thì KHÔNG tải lại — tải lại giữa giờ thi làm em hoảng, và
 *     máy chống gian lận có thể tính là một lần rời màn. Bài không mất
 *     (IndexedDB), nhưng chờ tới lúc em nộp xong cũng không muộn.
 *   · Chặn vòng lặp bằng mốc thời gian: tải lại rồi mà 20 giây sau lại bắn
 *     nữa thì thôi, không nạp lại vô hạn.
 *   · Lần đầu cài service worker (chưa từng có controller) KHÔNG tính là đổi
 *     bản — lần đó `controllerchange` cũng bắn, tải lại là thừa. */
const KHOA_TAI_LAI = 'taiLaiVìBanMoi'
const CHO_GIUA_HAI_LAN_MS = 20_000

export function batTuTaiLaiKhiDoiBan(
  sw: { addEventListener: (t: string, f: () => void) => void; controller: unknown } | undefined = typeof navigator === 'undefined' ? undefined : navigator.serviceWorker,
  taiLai: () => void = () => location.reload(),
  now: () => number = () => Date.now(),
  kho: Storage | null = typeof sessionStorage === 'undefined' ? null : sessionStorage,
): void {
  if (!sw) return
  // Chưa có controller = lần đầu cài, không phải đổi bản.
  const laLanDau = !sw.controller
  sw.addEventListener('controllerchange', () => {
    if (laLanDau) return
    if (dangLamBaiKhong()) return
    try {
      const truoc = Number(kho?.getItem(KHOA_TAI_LAI) || 0)
      const t = now()
      if (truoc && t - truoc < CHO_GIUA_HAI_LAN_MS) return
      kho?.setItem(KHOA_TAI_LAI, String(t))
    } catch {
      /* máy chặn lưu trữ thì vẫn tải lại, chỉ mất cái chặn vòng lặp */
    }
    taiLai()
  })
}

/** Phiên bản đang chạy — vite ghi vào lúc build (xem vite.config.ts).
 * Hiện ở màn chính để thầy đối chiếu: sửa xong, mở app, thấy đúng mã commit
 * mới nghĩa là máy đã nhận bản mới; còn mã cũ nghĩa là chưa nhận. */
declare const __PHIEN_BAN__: string
export const PHIEN_BAN_APP: string = typeof __PHIEN_BAN__ === 'string' ? __PHIEN_BAN__ : 'dev'
