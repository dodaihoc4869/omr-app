// MỞ CHẶNG TRƯỚC (thầy 16/10, ảnh "Chặng học của em — Đang chuẩn bị những câu phù hợp với em…": "phần này load lâu quá, quét và tối ưu tốc độ tức thì").
// Màn làm bài chỉ chờ MỘT lệnh: `hoc-tap-start` (máy chủ lập kế hoạch Gói 7, đọc câu, lưu phiên). Gọi lệnh ấy SỚM, lúc em gần như chắc sẽ bấm học:
//   · Hôm nay đã có số và nút "Học tiếp" bấm được (không phải ngày kiểm tra riêng, còn việc xếp được);
//   · em vừa xong chặng (màn "Học tiếp chặng N" — câu cuối đã nộp xong nên kế hoạch đã tính câu ấy).
// Em bấm ⇒ màn làm bài dùng lại ĐÚNG lời hứa đang bay / đã xong ⇒ câu hiện ngay. Kết quả GIỐNG HỆT gọi lúc bấm: máy chủ tự dùng lại phiên chưa làm xong
// (cùng mã phiên, trong 2 giờ — goi-bai-7.ts `startGoi7`), trần câu/ngày đếm theo câu đã TRẢ LỜI chứ không theo phiên ⇒ mở trước không tốn suất của em.
// Mỗi lời hứa dùng MỘT lần; quá TUOI_MO_TRUOC_MS, khác token hoặc lời hứa lỗi mạng ⇒ màn làm bài gọi lại như cũ.
import { goiHoa2 } from '../hoa2/api'

type KetQuaMo = Record<string, unknown>
/** Tuổi tối đa của một lượt mở trước (máy chủ giữ phiên 2 giờ; 10 phút để kế hoạch không cũ khi em rời đi lâu). */
export const TUOI_MO_TRUOC_MS = 10 * 60_000
/** Thời hạn chờ máy chủ của lệnh mở chặng — đúng số giây màn làm bài vẫn dùng. */
export const GIAY_CHO_MO_CHANG = 40

let dangCo: { token: string; luc: number; p: Promise<KetQuaMo> } | null = null
/** Bộ test mặc định TẮT (lượt mở trước sống theo mô-đun ⇒ test sau dùng nhầm máy chủ giả của test trước); test của tính năng bật bằng `batMoChangTruoc(true)`. */
let bat = !(globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.VITEST
export function batMoChangTruoc(b: boolean): void { bat = b; dangCo = null }

/** Bắt đầu mở chặng trước cho `token` (đã có lượt còn hạn cho token này ⇒ không gọi thêm). Không bao giờ ném. */
export function moChangTruoc(token: string, goi: typeof goiHoa2 = goiHoa2, now: number = Date.now()): void {
  if (!bat || !token) return
  if (dangCo && dangCo.token === token && now - dangCo.luc < TUOI_MO_TRUOC_MS) return
  const p = goi('hoc-tap-start', token, {}, GIAY_CHO_MO_CHANG)
  p.catch(() => {}) // lỗi để lượt dùng xử lý (gọi lại)
  dangCo = { token, luc: now, p }
}

/** Lấy (và XOÁ) lượt mở trước còn hạn của `token`; không có ⇒ null. Lượt lỗi mạng ⇒ lời hứa trả về tự gọi lại MỘT lần như cũ. */
export function layChangMoTruoc(token: string, goi: typeof goiHoa2 = goiHoa2, now: number = Date.now()): Promise<KetQuaMo> | null {
  const c = dangCo
  dangCo = null
  if (!c || c.token !== token || now - c.luc >= TUOI_MO_TRUOC_MS) return null
  return c.p.catch(() => goi('hoc-tap-start', token, {}, GIAY_CHO_MO_CHANG))
}

/** Bỏ lượt mở trước (đăng xuất / test). */
export function boChangMoTruoc(): void { dangCo = null }
