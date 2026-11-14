// LIVE THEO KHỐI (thầy chốt build 12/11; đặc tả docs/dac-ta-live-moi-1211.md) — HỢP ĐỒNG dùng chung máy thầy, máy em và máy chủ. Thuần kiểu, không DOM.
export type KhoiLive = 10 | 11 | 12
/** `hen` = đã hẹn giờ · `cho` = phòng chờ đang mở (em vào chơi Sinh Tồn) · `dang` = thầy đã bấm Bắt đầu · `xong` = đã kết thúc. */
type TrangThaiLich = 'hen' | 'cho' | 'dang' | 'xong'
export interface LichLive { id: string; khoi: KhoiLive; /** Giờ bắt đầu (ms). */ batDau: number; ten: string; trangThai: TrangThaiLich; buoiId?: string }
/** Thẻ Live ở trang chủ máy em: `khong` = không có buổi cho khối em; `hen` = có lịch (chưa tới 10 phút trước giờ); `cho` / `dang` = bấm «Tham gia» được. */
export interface LiveCuaEm { trangThai: 'khong' | 'hen' | 'cho' | 'dang'; khoi?: KhoiLive; ten?: string; batDau?: number }
/** Một người trong phòng: `doi` 0..3 theo DOI_BPU (Natri · Kali · Đồng · Canxi). */
export interface NguoiLop { sbd: string; ten: string; doi: number; /** kJ của em trong buổi (phòng gửi kèm danh sách lớp). */ kj?: number
  /** Sinh Tồn đợt 4 (bản 6): mã đồ gọn (`gonMac`, tu-do.ts) và chỉ số danh hiệu tuần (`DANH_HIEU`) — phòng gắn vào danh sách lúc em vào; thiếu ⇒ không đồ / không danh hiệu. */
  c?: string; dh?: number }

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
export interface SinhTonGui { p: [number, number, number, number]; t?: string; a?: string; h?: number; e?: number
  /** Bản 5: chỉ số hộp trong `viTriHop(bản đồ)` em vừa chạm (0 / thiếu = hộp tâm sân). Máy THẦY gửi thêm `roi: 1` khi bấm «Rời trận». */ k?: number; roi?: 1 }
/** Bản 5: Ma Mực trong ảnh [x, y, máu, mã nhân vật đang phun mực?] — thiếu phần tử 4 = không phun ai. */
export type SinhTonBoss = [number, number, number, string?]
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
  /** Bản 5 (đợt 3), đều TUỲ CHỌN: `ty` = [mã bé ma Thầy, máu 0..2000] khi Thầy đang trong trận — CHỈ ở ảnh ĐỦ VÀNH (1 trong 4) và ảnh đủ, như `bp`: ảnh mỏng
   *  thiếu `ty` ⇒ giữ số cũ, ảnh đủ vành thiếu `ty` ⇒ Thầy đã rời trận. Dòng Thầy (mã THAY, «đội» 4, máu thật 0..2000) nằm trong `ds` theo vùng như mọi người
   *  (đo 78 em: luôn gửi dòng Thầy cho mọi em tốn ~+7 % byte, `ty` thưa chỉ ~+1 %);
   *  `bx` = Ma Mực đang trên sân (LUÔN có trong mọi ảnh — mọi em thấy thanh máu); `bp` = [máu tối đa, % sát thương Na, K, Cu, Ca] chỉ ở ảnh ĐỦ VÀNH (1 trong 4)
   *  và ảnh đủ — máy em giữ số cũ (gửi thưa cho nhẹ: máu tối đa không đổi, phần trăm đổi chậm); `bh` = đội vừa diệt Ma Mực (0..3, chỉ ở ảnh ngay sau lúc
   *  boss bị hạ; đội đó đã được +5 trong `d`); `hn` = hộp TRANG đã có người nhặt trong lượt hộp hiện tại {chỉ số k ≥ 1: mã} (hộp tâm vẫn ở `h`). */
  ty?: [string, number]; bx?: SinhTonBoss; bp?: [number, number, number, number, number]; bh?: number; hn?: Record<string, string>
  /** Bản 4: 1 = ẢNH MỎNG (chỉ ảnh lọc, 3 trong 4 ảnh): người ở vành ngoài (cách em 910 – 1100) và dòng của chính em không gửi ở ảnh này. */ m?: 1
}
// HỢP ĐỒNG CHO MÀN (TroSinhTon…) theo bản 4 — máy chủ đã làm, màn phải làm theo, và PHẢI phát hành CÙNG LÚC với máy chủ (không thì: banner «vào đội» mỗi
// khi có người lọt vào `ds`, bản đồ nhỏ thiếu, hộp lệch luật, phòng ca đóng 4010 lặp nếu Worker lên trước Pages):
//  · Vào / rời phòng chỉ đọc từ `lop-ds` / `st-ds`; người mới xuất hiện trong `ds` KHÔNG phải «vào đội». Bản đồ nhỏ = đồng đội trong `ds` + chấm `dd` + `tk`.
//  · Tin trò `{ t: 'lop', k: 'tro', l, x }` KHÔNG có `s` / `n` / `d` (thừa, đã bỏ). Dòng `ds` KHÔNG bắn ai chỉ có 5 phần tử ⇒ luôn đọc bằng `docDong`.
//  · Ảnh mỏng (`m: 1`, 3 trong 4 ảnh): người ở vành ngoài + dòng của chính em vắng mặt ⇒ GIỮ dòng cũ của người vắng để VẼ / nội suy (dòng của em thiếu ⇒
//    giữ đội cũ); ảnh không có `m` mà vẫn vắng ⇒ đã ra khỏi tập, bỏ. `dd` chỉ có 1 trong 8 ảnh (2 giây) ⇒ thiếu thì giữ chấm cũ. QUAN TRỌNG: `satThuong` và
//    `chonMucTieu` CHỈ dùng các dòng có trong ẢNH VỪA NHẬN (dòng giữ lại chỉ để vẽ) — vậy mới bằng ảnh đủ (test tests/sinh-ton-v2-dot2-1311.test.ts).
//  · Khung nhìn màn (nửa đường chéo, đơn vị sân) ≤ ~850 (= 1100 − 250 trượt) — rộng hơn thì góc màn máy tính bảng thấy người hiện đột ngột.
//  · Lượt hạ `an[i]`: chuỗi người bị hạ = an[i][2] ?? 0 (≥ 3 ⇒ «ĐÁNH TRƯỢT ĐẠI HỌC!»), chuỗi kẻ hạ = an[i][3] ?? 0 (thay map `chuoi` tự đếm ở máy);
//    an[i][4] === 1 ⇒ người bị hạ là thủ khoa («ĐÃ TIÊU DIỆT THỦ KHOA!») và nếu an[i][0] là em ⇒ lên THÊM 1 cấp (tổng +2, tối đa 6; máy bù phòng tự +2, tối đa 3).
//  · `cap` của `Toi` là cấp THẬT, lên cấp cộng vào đó; gói gửi `p[3]` = `capSung(tt, nay)`.
//  · Hộp: KHÔNG còn «đầy máu + lên cấp». Em nhận hộp (`h[1] === sbd`) ⇒ `tt = apHop(tt, loaiHop(h[0]), nay)` (không lên cấp, không kích chuỗi). `h[1]` có thể là
//    máy bù. Hiệu ứng của người khác suy từ `h` + `loaiHop(h[0])` + thời gian (KHIEN_MS / NHANH_MS / SAO_MS) — không có trường riêng. Khiên chặn cả cháy và ngoài vòng
//    (`nhanDon` / `buocToi` đã làm); chạy nhanh ×1,35 (`buocToi`); Pháo Sao: súng 6 trong 10 giây, bị hạ ⇒ mất (`nhanDon` / `buocToi`).
//  · Biểu cảm: gửi `e` 0..3 kèm gói thường (phòng chỉ nhận khi em đã trên sân, 1 lần / 2 giây); hiện `bc[mã]` trên đầu bé ma tới khi mã đó rời `bc`.
//  · Bảng vàng: `bv` (chỉ em thật) + `hg` của chính em, chỉ trong 5 giây nghỉ; thiếu ⇒ không hiện.
//  · Bản 5: danh sách tính sát thương / ngắm = dòng ảnh vừa nhận (bỏ chính em) + `nvBoss(bx)` đặt CUỐI (sinh-ton-loi.ts). Lượt hạ có `THAY` / `MM` ở vị trí
//    kẻ hạ hoặc bị hạ: hạ Thầy không cộng điểm đội (ghi nhận «Hạ gục Thầy»), Thầy / Ma Mực hạ em không cộng điểm đội nào.
/** Phiên bản giao thức trò Sinh Tồn ở phòng chờ CA KIỂM TRA (13/11; phòng: server/src/sinh-ton-ca.ts). Gói vào `{ t: 'vao', tro: 'st', v, ve }` phải mang đúng số
 *  này; đổi dạng `SinhTonGui` / `SinhTonAnh` không tương thích ⇒ tăng số, máy còn mảnh cũ bị phòng đóng sạch (mã 4010) thay vì nhận ảnh nó không đọc được. */
// 2 (13/11): năm cỡ sân — cỡ 2 đổi nghĩa (ghép 2 × 2 khu), thêm cỡ 3 · 4 ⇒ máy còn mảnh cũ dựng sai sân.
// 3 (13/11, bản 2 «Trang vở»): sáu cấp súng (cấp 1..6 trong ảnh) + thang cỡ sân mới (mọi cỡ ghép trang 1600 × 1000, cỡ 0 = 2 × 2) + mã máy bù mang chỉ số tên.
// 4 (13/11, bản 2 đợt 2): «chỉ gửi gần» (ds chỉ quanh em) + `an` mang chuỗi / thủ khoa + `tk` · `bc` · `bv` · `hg` + `e` trong gói gửi + hộp 4 loại (`loaiHop`).
// 5 (13/11, bản 2 đợt 3): Thầy vào trận (`ty`, dòng «đội» 4 máu 0..2000 — chỉ phòng live) + Ma Mực (`bx` · `bp` · `bh`, mã 'MM' trong `t` / `an`) + mỗi trang
//    một hộp (`hn`, `k` trong gói gửi, `loaiHopO`) + vòng cuối 0,32 ở sân ≥ 3 × 3 trang (`heVongCuoi`) ⇒ máy còn mảnh cũ tính sai vòng / hộp.
// 6 (14/11, bản 2 đợt 4 ghép): danh sách phòng `st-ds` / `st-vao.toi` thêm [mã đồ gọn?, danh hiệu?] + đội cả học kỳ ⇒ máy cũ không vẽ đồ / xếp sai đội hiện ra.
export const PHIEN_BAN_ST = 6
