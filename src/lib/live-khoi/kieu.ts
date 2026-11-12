// LIVE THEO KHỐI (thầy chốt build 12/11; đặc tả docs/dac-ta-live-moi-1211.md) — HỢP ĐỒNG dùng chung máy thầy, máy em và máy chủ. Thuần kiểu, không DOM.
export type KhoiLive = 10 | 11 | 12
/** `hen` = đã hẹn giờ · `cho` = phòng chờ đang mở (em vào chơi Giữ Lửa) · `dang` = thầy đã bấm Bắt đầu · `xong` = đã kết thúc. */
type TrangThaiLich = 'hen' | 'cho' | 'dang' | 'xong'
export interface LichLive { id: string; khoi: KhoiLive; /** Giờ bắt đầu (ms). */ batDau: number; ten: string; trangThai: TrangThaiLich; buoiId?: string }
/** Thẻ Live ở trang chủ máy em: `khong` = không có buổi cho khối em; `hen` = có lịch (chưa tới 10 phút trước giờ); `cho` / `dang` = bấm «Tham gia» được. */
export interface LiveCuaEm { trangThai: 'khong' | 'hen' | 'cho' | 'dang'; khoi?: KhoiLive; ten?: string; batDau?: number }
/** Một người trong phòng: `doi` 0..3 theo DOI_BPU (Natri · Kali · Đồng · Canxi). */
export interface NguoiLop { sbd: string; ten: string; doi: number; /** kJ của em trong buổi (phòng gửi kèm danh sách lớp). */ kj?: number }

/** KÊNH LỚP: tin đi qua kết nối sẵn có của phòng, phòng chỉ chuyển tiếp trong bộ nhớ (0 D1). `chat` = nhắn cả lớp · `tro` = trò Giữ Lửa ở phòng chờ. */
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

// ── TRÒ GIỮ LỬA ── sân 1000 × 600 (đơn vị sân). Máy em gửi tối đa 4 lần / giây `gui('tro', { p: [x, y, m], a? })`: vị trí nguyên + khối lượng `m` (10..400);
// `a` = số báo danh của đốm vừa THU PHỤC mình (máy bị thu phục tự báo, rồi hồi sinh ở góc đội). Phòng gom và phát mỗi 250 ms MỘT ảnh chụp
// `{ ds: { [sbd]: [x, y, m, doi] }, an: [sbdThuPhuc, sbdBiThuPhuc, m][] }` (s = ''); đốm im quá 5 giây bị gỡ khỏi `ds`.
export const SAN_RONG = 1000
export const SAN_CAO = 600
export interface TroGui { p: [number, number, number]; a?: string }
export interface TroAnh { ds: Record<string, [number, number, number, number]>; an: [string, string, number][] }
