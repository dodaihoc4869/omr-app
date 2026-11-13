// LIVE THEO KHỐI (thầy chốt build 12/11; đặc tả docs/dac-ta-live-moi-1211.md) — HỢP ĐỒNG dùng chung máy thầy, máy em và máy chủ. Thuần kiểu, không DOM.
export type KhoiLive = 10 | 11 | 12
/** `hen` = đã hẹn giờ · `cho` = phòng chờ đang mở (em vào chơi Sinh Tồn) · `dang` = thầy đã bấm Bắt đầu · `xong` = đã kết thúc. */
type TrangThaiLich = 'hen' | 'cho' | 'dang' | 'xong'
export interface LichLive { id: string; khoi: KhoiLive; /** Giờ bắt đầu (ms). */ batDau: number; ten: string; trangThai: TrangThaiLich; buoiId?: string }
/** Thẻ Live ở trang chủ máy em: `khong` = không có buổi cho khối em; `hen` = có lịch (chưa tới 10 phút trước giờ); `cho` / `dang` = bấm «Tham gia» được. */
export interface LiveCuaEm { trangThai: 'khong' | 'hen' | 'cho' | 'dang'; khoi?: KhoiLive; ten?: string; batDau?: number }
/** Một người trong phòng: `doi` 0..3 theo DOI_BPU (Natri · Kali · Đồng · Canxi). */
export interface NguoiLop { sbd: string; ten: string; doi: number; /** kJ của em trong buổi (phòng gửi kèm danh sách lớp). */ kj?: number }

/** KÊNH LỚP: tin đi qua kết nối sẵn có của phòng, phòng chỉ chuyển tiếp trong bộ nhớ (0 D1). `chat` = nhắn cả lớp · `tro` = trò Sinh Tồn ở phòng chờ. */
export type LoaiTinLop = 'chat' | 'tro' | 'mt' | 'hieu'
/** Tin phòng phát xuống: `s` = số báo danh người gửi do PHÒNG đóng dấu ('gv' = thầy, '' = phòng), `n` tên, `d` đội (-1 = không đội), `l` giờ phòng (ms). */
export interface TinLop { k: LoaiTinLop; s: string; n: string; d: number; l: number; x: unknown }
export interface KenhLop { gui(k: LoaiTinLop, x: unknown): void; nghe(k: LoaiTinLop, f: (tin: TinLop) => void): () => void }

// ── CHAT ── máy gửi `gui('chat', { c })`; phòng cắt 200 ký tự, mỗi em 1 tin / 2 giây, phát lại cho MỌI máy (kể cả máy gửi). Thầy gửi `{ tat: true | false }` để
// khoá / mở chat cả lớp (phòng phát `{ tat }` với s = 'gv'). Máy mới vào gửi `{ xin: 1 }` ⇒ phòng gửi riêng máy đó tối đa 200 tin gần nhất (từng tin một, cũ trước).
export interface ChatGui { c?: string; tat?: boolean; xin?: 1 }
export interface ChatNhan { c?: string; tat?: boolean }
export const CHAT_DAI = 200
export const CHAT_NHIP_MS = 2000

// ── TRÒ SINH TỒN ── (thầy chốt 12/11; đặc tả docs/dac-ta-sinh-ton-1211.md). Sân = bản đồ theo `c` (src/lib/live-khoi/sinh-ton-loi.ts). Máy em gửi tối đa
// 4 lần / giây `gui('tro', { p: [x, y, máu, cấp súng], t?, a?, h? })`: `t` = mã nhân vật súng mình đang bắn ('' = không bắn); `a` = mã kẻ vừa HẠ mình (máy bị
// hạ tự báo); `h` = số hộp tiếp tế mình vừa chạm. Phòng gom, tính MÁY BÙ CHỖ (mã bắt đầu bằng '~') và phát mỗi 250 ms MỘT ảnh chụp (s = '').
/** Một nhân vật trong ảnh chụp: [x, y, máu 0..100, đội 0..3, cấp súng 1..6, mã mục tiêu đang bắn]. Mã máy bù `~<chỉ số tên>-<số thứ tự>` (tên: ten-may.ts `tenMay`). */
export type SinhTonDong = [number, number, number, number, number, string]
/** `p[3]` = cấp súng ĐANG DÙNG (đang Pháo Sao ⇒ 6 — `capSung` của lõi). `e` (bản 4) = biểu cảm 0..3 (bốn nhãn cố định, không chữ tự do); phòng nhận tối đa
 *  1 lần / 2 giây mỗi em, lần dư bị bỏ. */
export interface SinhTonGui { p: [number, number, number, number]; t?: string; a?: string; h?: number; e?: number }
/** Một lượt hạ (bản 4): [kẻ hạ, bị hạ, chuỗi của người BỊ hạ ngay trước lượt này, chuỗi của kẻ hạ SAU lượt này, 1 = người bị hạ đang là thủ khoa `tk`].
 *  Chuỗi = số lượt hạ liên tiếp chưa bị hạ / chưa chết ngoài vòng, do PHÒNG đếm (máy em không tự suy từ `an` tích luỹ). Ba số cuối có thể thiếu (phòng cũ) ⇒ coi là 0. */
export type SinhTonHa = [ai: string, bi: string, chuoiBi?: number, chuoiAi?: number, laTk?: number]
/** `ds` = nhân vật GỬI GẦN (bản 4): máy em chỉ nhận người cách mình ≤ 1100 + kẻ đang bắn vào mình / vào người đã nhận + thủ khoa; máy thầy (và máy chưa
 *  lên sân) nhận đủ. Nhân vật vào / ra `ds` là chuyện thường, KHÔNG phải vào / rời phòng (vào phòng xem `lop-ds` / `st-ds`).
 *  `dd` (chỉ ảnh lọc) = vị trí đồng đội ở xa không có trong `ds`: [x, y, x, y, …] — chỉ để chấm bản đồ nhỏ (bản đồ nhỏ = đồng đội trong `ds` + `dd` + `tk`).
 *  `an` = các lượt hạ từ ảnh chụp trước (luôn đủ); `d` = lượt hạ bốn đội trong ván; `v` = số thứ tự ván (1, 2, …); `c` = cỡ bản đồ 0..4; `h` = [số hộp, mã người đã nhặt].
 *  Bản 4, mọi trường đều TUỲ CHỌN (thiếu ⇒ máy em kẹp: '' / {} / [] / không hạng — phòng live không có cổng phiên bản):
 *  `tk` = mã thủ khoa đang bị truy nã (thiếu = chưa có); `bc` = biểu cảm còn hiệu lực {mã: 0..3} (2 giây); `bv` = bảng vàng [mã em thật, lượt hạ] tối đa 3 dòng,
 *  chỉ có trong 5 giây nghỉ cuối ván; `hg` = hạng lượt hạ của CHÍNH người nhận trong số em thật trên sân (1 = nhất, bằng nhau cùng hạng), chỉ trong 5 giây nghỉ. */
export interface SinhTonAnh {
  ds: Record<string, SinhTonDong>; an: SinhTonHa[]; d: [number, number, number, number]; v: number; c: number; h: [number, string]
  tk?: string; bc?: Record<string, number>; bv?: [string, number][]; hg?: number; dd?: number[]
}
/** Phiên bản giao thức trò Sinh Tồn ở phòng chờ CA KIỂM TRA (13/11; phòng: server/src/sinh-ton-ca.ts). Gói vào `{ t: 'vao', tro: 'st', v, ve }` phải mang đúng số
 *  này; đổi dạng `SinhTonGui` / `SinhTonAnh` không tương thích ⇒ tăng số, máy còn mảnh cũ bị phòng đóng sạch (mã 4010) thay vì nhận ảnh nó không đọc được. */
// 2 (13/11): năm cỡ sân — cỡ 2 đổi nghĩa (ghép 2 × 2 khu), thêm cỡ 3 · 4 ⇒ máy còn mảnh cũ dựng sai sân.
// 3 (13/11, bản 2 «Trang vở»): sáu cấp súng (cấp 1..6 trong ảnh) + thang cỡ sân mới (mọi cỡ ghép trang 1600 × 1000, cỡ 0 = 2 × 2) + mã máy bù mang chỉ số tên.
// 4 (13/11, bản 2 đợt 2): «chỉ gửi gần» (ds chỉ quanh em) + `an` mang chuỗi / thủ khoa + `tk` · `bc` · `bv` · `hg` + `e` trong gói gửi + hộp 4 loại (`loaiHop`).
export const PHIEN_BAN_ST = 4
