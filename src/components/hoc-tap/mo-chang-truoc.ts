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

let dangCo: { token: string; luc: number; p: Promise<KetQuaMo>; kq?: KetQuaMo } | null = null
/** Bộ test mặc định TẮT (lượt mở trước sống theo mô-đun ⇒ test sau dùng nhầm máy chủ giả của test trước); test của tính năng bật bằng `batMoChangTruoc(true)`. */
let bat = !(globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.VITEST
export function batMoChangTruoc(b: boolean): void { bat = b; dangCo = null }

/** Bắt đầu mở chặng trước cho `token` (đã có lượt còn hạn cho token này ⇒ không gọi thêm). Không bao giờ ném. */
export function moChangTruoc(token: string, goi: typeof goiHoa2 = goiHoa2, now: number = Date.now()): void {
  if (!bat || !token) return
  if (dangCo && dangCo.token === token && now - dangCo.luc < TUOI_MO_TRUOC_MS) return
  const p = goi('hoc-tap-start', token, {}, GIAY_CHO_MO_CHANG)
  const muc: { token: string; luc: number; p: Promise<KetQuaMo>; kq?: KetQuaMo } = { token, luc: now, p }
  p.then((r) => { if (r && r.ok === true && Array.isArray(r.questions)) muc.kq = r }, () => {}) // lỗi để lượt dùng xử lý (gọi lại)
  dangCo = muc
}

/** Đọc ĐỒNG BỘ (và XOÁ) lượt mở trước ĐÃ VỀ thành công của `token` ⇒ mở câu đầu tức thì 0 ms (không chớp khung chờ). Chưa về / lỗi ⇒ null (nhường `layChangMoTruoc`). */
export function layChangMoTruocNgay(token: string, now: number = Date.now()): KetQuaMo | null {
  const c = dangCo
  if (!c || c.token !== token || now - c.luc >= TUOI_MO_TRUOC_MS || !c.kq) return null
  dangCo = null
  return c.kq
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

// BÁO RỜI APP GIỮA CHỪNG (thầy 29/10 «mở app tức thì mọi lúc»): em làm dở chặng rồi khoá máy / đổi ứng dụng ⇒ bản lập sẵn Sảnh + chặng trên máy chủ đã hết hạn (dấu đổi vì em vừa
// làm câu). Báo một lần cho máy chủ lập lại NỀN (server/src/san-sang.ts `chuanBiKhiThoat`) ⇒ lần mở app sau Sảnh có ngay, không lập kế hoạch ~3 s. Tối đa 1 lượt / 60 s; lỗi mạng bỏ qua.
// Em bấm «thoát» về Hôm nay thì KHÔNG báo ở đây: Hôm nay tự hỏi lại Sảnh và máy chủ lập sẵn sau lượt ấy. (Cùng tệp này để khỏi thêm một mảnh vào precache.)
const HAN_BAO_ROI_MS = 60_000
let cuoiBaoRoi = 0
export function baoRoiAppGiuaChung(token: string, now: number = Date.now(), goi: typeof goiHoa2 = goiHoa2): void {
  if (!token || now - cuoiBaoRoi < HAN_BAO_ROI_MS) return
  cuoiBaoRoi = now
  goi('hoc-tap-chuan-bi', token, {}, 10).catch(() => {})
}
/** Gắn khi màn đang làm: app bị ẩn mà `coTienDo()` đúng ⇒ báo. Trả hàm gỡ. */
export function nghePhanAnRoiApp(coTienDo: () => boolean, token: string): () => void {
  const f = () => { if (document.visibilityState === 'hidden' && coTienDo()) baoRoiAppGiuaChung(token) }
  document.addEventListener('visibilitychange', f)
  return () => document.removeEventListener('visibilitychange', f)
}
/** Chỉ cho test. */
export const datLaiBaoRoiApp = (): void => { cuoiBaoRoi = 0 }
