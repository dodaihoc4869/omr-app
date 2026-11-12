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
export type LoaiTinLop = 'chat' | 'tro'
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
/** Một nhân vật trong ảnh chụp: [x, y, máu 0..100, đội 0..3, cấp súng 1..4, mã mục tiêu đang bắn]. */
export type SinhTonDong = [number, number, number, number, number, string]
export interface SinhTonGui { p: [number, number, number, number]; t?: string; a?: string; h?: number }
/** `an` = các lượt hạ từ ảnh chụp trước [kẻ hạ, bị hạ]; `d` = lượt hạ bốn đội trong ván; `v` = số thứ tự ván (1, 2, …); `c` = cỡ bản đồ 0..2; `h` = [số hộp, mã em đã nhặt]. */
export interface SinhTonAnh { ds: Record<string, SinhTonDong>; an: [string, string][]; d: [number, number, number, number]; v: number; c: number; h: [number, string] }
