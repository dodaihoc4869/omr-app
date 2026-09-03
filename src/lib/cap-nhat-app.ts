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
    void Promise.resolve(dangKy.update()).catch(() => {})
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

/** Phiên bản đang chạy — vite ghi vào lúc build (xem vite.config.ts).
 * Hiện ở màn chính để thầy đối chiếu: sửa xong, mở app, thấy đúng mã commit
 * mới nghĩa là máy đã nhận bản mới; còn mã cũ nghĩa là chưa nhận. */
declare const __PHIEN_BAN__: string
export const PHIEN_BAN_APP: string = typeof __PHIEN_BAN__ === 'string' ? __PHIEN_BAN__ : 'dev'
