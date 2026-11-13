// XEM LẠI LIVE — HỢP ĐỒNG DỮ LIỆU DÙNG CHUNG (thầy chốt build 11/11; đặc tả docs/dac-ta-live-xem-lai-1011.md mục 4.7). Thuần, không DOM.
// Máy chủ (chốt buổi, lệnh /gv/live-*, /hs/live-*, /live-tep) và máy khách (Lịch sử Live của thầy, danh sách + trang buổi + trình phát của em)
// CÙNG nhập tệp này. Đổi hợp đồng = CHỈ THÊM trường tuỳ chọn; trường đã có không đổi nghĩa, không đổi kiểu.
// An toàn: `buoi.json` KHÔNG mang kết quả riêng của em nào, KHÔNG mang câu chưa mở đáp án trong buổi (mục 4.4 luật 7).
import type { ManHinh } from '../may-tinh/may'

export type TrangThaiBuoiLive = 'dang_ghi' | 'dang_xu_ly' | 'xong' | 'loi' | 'dang_xoa'
export type QuyenBuoiLive = 'lop' | 'diem_danh'
export type LoaiDoanLive = 'len_bang' | 'thay_chua'

/** Mọi mốc thời gian `t0`, `t1`, `t` trong tệp này là MILI-GIÂY trên TRỤC TIẾNG của `tieng.mp3`
 *  (0 = đầu tệp; các lần tắt / bật live nối liền; khoảng của câu chưa mở đáp án đã bị cắt khỏi trục). */
export type KhoangMs = [t0: number, t1: number]

/** Một câu đã mở đáp án trong buổi (thẻ câu ở trang buổi). */
export interface CauBuoiLive {
  /** Số câu trong buổi, 1..N theo thứ tự chiếu (chữ hiện «Câu 3»). */
  so: number
  /** Số lượt của phòng (`LuotPhong.so`) — khoá để ghép kết quả riêng của em từ `/hs/live-buoi`. */
  luot: number
  qid: string
  phan: 'I' | 'II' | 'III'
  tuLuan: boolean
  /** Tên dạng của câu trong kho ('' = chưa có ⇒ tên đoạn bỏ khúc giữa). */
  dang: string
  /** Tên bài của câu trong kho ('' = không tra được). */
  bai: string
  /** Câu công khai — NGUYÊN dạng phòng gửi máy em lúc làm bài (`LuotPhong.cau`), máy em dựng bằng đúng thành phần đề đang có. */
  cau: Record<string, unknown>
  /** Đáp án đúng (chuỗi như `LuotPhong.dung`). Chỉ có khi câu ĐÃ mở đáp án trong buổi; câu vào trang theo đường «đã chữa trên bảng» mà chưa mở đáp án ⇒ ''. */
  dung: string
  /** (11/11, chỉ thêm) false = câu CHƯA mở đáp án trong buổi nhưng thầy đã gọi em lên bảng / bật bảng live cho câu đó (cả lớp đã xem thầy chữa):
   *  `dung` = '' và `giai` = null — máy em không vẽ ô «Đáp án đúng», không có nút lời giải. Vắng / true = đã mở đáp án. */
  moDapAn?: boolean
  /** Lời giải kho + ảnh lời giải (như `LuotPhong.giai`); null = kho chưa có. */
  giai: { solution: unknown; anh: { src: string; viTri: string; alt?: string }[] } | null
  /** Tỉ lệ lớp: số em làm đúng / số em đã gửi. */
  soDung: number
  soGui: number
  /** Chương của câu trên trục tiếng (từ mở câu tới trước lượt kế). */
  t0: number
  t1: number
}

/** Một đoạn xem lại (chỉ mục — không cắt tệp). */
export interface DoanBuoiLive {
  /** Thứ tự đoạn trong buổi, 1..M. */
  stt: number
  loai: LoaiDoanLive
  /** `CauBuoiLive.so` của câu chứa đoạn. */
  cau: number
  luot: number
  /** Tên đoạn đã ghép sẵn (mục 4.6), ví dụ «Câu 3 · Amine tác dụng với acid · Minh Anh lên bảng». */
  ten: string
  /** Em lên bảng (đoạn «len_bang»): số báo danh, tên gọi hai chữ, đội 0..3, kết quả chấm. Đoạn «thay_chua» ⇒ null. */
  lenBang: { sbd: string; ten: string; doi: number; dat: boolean | null } | null
  t0: number
  t1: number
  /** Giây có tiếng sau khi bỏ lặng. */
  giayCoTieng: number
  soNet: number
  /** Đoạn đáng xem (mục 4.5): chữ lý do đã ghép sẵn, ví dụ «cả lớp sai nhiều nhất»; null = không gắn nhãn. */
  dangXem: string | null
  /** Phần thứ mấy khi đoạn bị ngắt bởi lặng ≥ 90 giây (1 = không ngắt / phần đầu). */
  phan: number
}

/** Bảng vàng của buổi (số thật của phòng lúc chốt). */
export interface BangVangLive {
  /** Bốn đội theo thứ tự đội 0..3: tên đội + kJ. */
  doi: { ten: string; kj: number }[]
  /** Chỉ số đội thắng (null = hoà / chưa có kJ). */
  doiThang: number | null
  /** Tối đa ba em nhiều kJ nhất. */
  top: { ten: string; doi: number; kj: number }[]
  /** Chuỗi đúng dài nhất (null = không ai có chuỗi từ 2). */
  chuoi: { ten: string; doi: number; so: number } | null
}

/** Nội dung `live/<buổi>/buoi.json`. */
export interface BuoiLiveJson {
  v: 1
  /** = `buoi_hoc.id`. */
  id: string
  /** Bản dựng; dựng lại ⇒ +1 (máy em bỏ bản đệm cũ). */
  ban: number
  /** YYYY-MM-DD giờ Việt Nam. */
  ngay: string
  /** Lớp của buổi ('' = buổi mọi lớp). */
  lop: string
  /** ISO. */
  batLuc: string
  tatLuc: string | null
  /** Tên bài tự động (mục 4.6) và tên thầy đặt (null = dùng tự động). Dòng tên đầy đủ ghép bằng `src/lib/live/xem-lai-ten.ts`. */
  tenTuDong: string
  tenThay: string | null
  /** Giấy đề tối hay sáng lúc live (trình phát theo THẦY). */
  giayToi: boolean
  /** Buổi có tệp tiếng không (thầy live không mic ⇒ false; trình phát chạy đồng hồ riêng). */
  coTieng: boolean
  /** Độ dài trục tiếng (ms) và tổng độ dài các đoạn (ms). */
  msLive: number
  msDoan: number
  /** Cỡ tệp (byte) để hiện dung lượng và tải theo Range. */
  byteTieng: number
  byteNet: number
  cau: CauBuoiLive[]
  doan: DoanBuoiLive[]
  /** Khoảng lặng từ 6 giây (đã trừ 0,5 giây hai đầu) — trình phát nhảy qua khi bật «Bỏ khoảng lặng». */
  lang: KhoangMs[]
  /** Khoảng mic em bật — vạch trên thanh tua, có tên em. */
  emNoi: { ten: string; doi: number | null; t0: number; t1: number }[]
  /** Mốc «bảng mới» / «xoá hết» trong `net.bin`: giờ + vị trí byte của bản ghi ⇒ tua thì tải và dựng lại từ mốc gần nhất phía trước. Luôn có mốc đầu `{ t: 0, byte: 0 }`. */
  mocBang: { t: number; byte: number }[]
  bangVang: BangVangLive | null
  /** LIVE THEO KHỐI (13/11): dòng thời gian CHẾ ĐỘ thầy đang dạy — `bang` = bảng kín màn, `hoc` = giấy đề + bảng — theo trục tiếng (ms), tăng dần, không lặp giá trị
   *  liền nhau. Trình phát xếp hình đúng theo đó, kể cả khi thầy đổi qua lại trong một buổi. Vắng (buổi trên lớp / buổi dựng trước 13/11) ⇒ trình phát suy từ trang bút. */
  che?: MocChe[]
  /** MÁY TÍNH FX4869 của thầy (13/11, chỉ thêm): các lần mở / cất / dời / bấm phím theo trục tiếng (ms), tăng dần. Vắng = buổi không dùng máy tính, hoặc buổi
   *  dựng trước 13/11 (lúc đó phòng không ghi máy tính ⇒ không khôi phục được). */
  mayTinh?: MocMayTinh[]
}
/** Một mốc của máy tính: `mo` 0 = thầy cất (hoặc thầy im quá 13 giây / tắt live) · 1 = đang hiện tại tâm (`x`, `y`) bề ngang `w` — đều là phần của màn thầy (0–1).
 *  `mh` = thứ đang hiện trên máy (`ManHinh` của src/lib/may-tinh/may.ts); VẮNG = y như mốc trước (chỉ đổi chỗ). `p` + `n` = phím thầy bấm ở mốc này + số thứ tự lần bấm. */
export interface MocMayTinh { t: number; mo: 0 | 1; x?: number; y?: number; w?: number; mh?: ManHinh; p?: string; n?: number }
/** Máy tính tại một thời điểm — cùng dạng gói `TinMayTinh` lúc live (src/components/may-tinh/dong-bo.ts) ⇒ mặt máy chỉ-xem vẽ lại y như máy em lúc live. */
export interface MayTinhLuc { mo: true; x: number; y: number; w: number; mh: ManHinh; p: string; n: number }
/** Chỉ số mốc cuối cùng có `t` ≤ giờ đang phát (−1 = chưa tới mốc nào / không có máy tính). Rẻ: gọi được ở mọi khung hình. */
export function chiSoMayTinh(ds: readonly MocMayTinh[] | undefined, t: number): number {
  if (!ds?.length || ds[0]!.t > t) return -1
  let lo = 0, hi = ds.length - 1, k = 0
  while (lo <= hi) { const g = (lo + hi) >> 1; if (ds[g]!.t <= t) { k = g; lo = g + 1 } else hi = g - 1 }
  return k
}
/** Máy tính đang hiện ở mốc thứ `k` (từ `chiSoMayTinh`): lùi trong lần mở hiện tại tìm màn hình + lần bấm phím gần nhất. Đã cất ⇒ null. */
export function mayTinhTai(ds: readonly MocMayTinh[] | undefined, k: number): MayTinhLuc | null {
  const m = ds && k >= 0 ? ds[k] : undefined
  if (!m || !m.mo) return null
  let mh: ManHinh | undefined, p = '', n = -1
  for (let i = k; i >= 0 && ds![i]!.mo && !(mh && n >= 0); i--) { const c = ds![i]!; if (!mh && c.mh) mh = c.mh; if (n < 0 && c.n != null) { n = c.n; p = c.p ?? '' } }
  return mh ? { mo: true, x: m.x ?? 0.8, y: m.y ?? 0.5, w: m.w ?? 0.25, mh, p, n: Math.max(0, n) } : null
}
export interface MocChe { t: number; v: 'hoc' | 'bang' }
/** Chế độ tại giờ `t` của trục tiếng: mốc cuối cùng có `t` ≤ giờ đang phát (trước mốc đầu ⇒ lấy mốc đầu). Không có dòng thời gian ⇒ null. */
export function cheTai(che: readonly MocChe[] | undefined, t: number): 'hoc' | 'bang' | null {
  if (!che?.length) return null
  let lo = 0, hi = che.length - 1, k = 0
  while (lo <= hi) { const g = (lo + hi) >> 1; if (che[g]!.t <= t) { k = g; lo = g + 1 } else hi = g - 1 }
  return che[k]!.v
}

// ───────────────────────── net.bin ─────────────────────────
// Dãy bản ghi nối nhau, xếp theo `t` tăng dần. Mỗi bản ghi:
//   [t u32 LE]  mili-giây trên trục tiếng lúc khung BẮT ĐẦU có hiệu lực (khung nét xong: lúc ĐIỂM ĐẦU của nét chạm bảng)
//   [n u16 LE]  số byte của khung
//   [khung]     NGUYÊN một khung sổ nét của Live (mã 0x11–0x15, `src/lib/live/ma-net.ts`: `giaiSo`), 5 byte đầu = mã + stt
// Trình phát: nét xong ⇒ vẽ dần từng điểm theo `t + diem[i][3]`; xoá / bảng mới / hoàn tác ⇒ áp tại `t`.

export const DAU_BAN_GHI_NET = 6
/** Một khung sổ nét dài tối đa (trùng `KHUNG_TOI_DA` của phong-live.ts). */
export const KHUNG_NET_TOI_DA = 16 * 1024

/** Ghép các bản ghi thành thân `net.bin`. Khung dài quá `KHUNG_NET_TOI_DA` hoặc rỗng bị bỏ. */
export function ghiNetBin(muc: readonly { t: number; khung: Uint8Array }[]): Uint8Array<ArrayBuffer> {
  const hop = muc.filter(m => m.khung.length > 0 && m.khung.length <= KHUNG_NET_TOI_DA)
  let tong = 0
  for (const m of hop) tong += DAU_BAN_GHI_NET + m.khung.length
  const ra = new Uint8Array(tong), dv = new DataView(ra.buffer)
  let o = 0
  for (const m of hop) {
    dv.setUint32(o, Math.max(0, Math.round(m.t)) >>> 0, true); dv.setUint16(o + 4, m.khung.length, true)
    ra.set(m.khung, o + DAU_BAN_GHI_NET); o += DAU_BAN_GHI_NET + m.khung.length
  }
  return ra
}

/** Đọc `net.bin` (hoặc một khúc bắt đầu ĐÚNG đầu một bản ghi, ví dụ tải Range từ `mocBang[i].byte`). Bản ghi cuối bị cụt thì bỏ, không ném lỗi.
 *  `du` = số byte đã đọc trọn ⇒ nối khúc kế tiếp từ đó. */
export function docNetBin(b: Uint8Array): { muc: { t: number; khung: Uint8Array }[]; du: number } {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength), muc: { t: number; khung: Uint8Array }[] = []
  let o = 0
  while (o + DAU_BAN_GHI_NET <= b.length) {
    const n = dv.getUint16(o + 4, true)
    if (n === 0 || n > KHUNG_NET_TOI_DA || o + DAU_BAN_GHI_NET + n > b.length) break
    muc.push({ t: dv.getUint32(o, true), khung: b.subarray(o + DAU_BAN_GHI_NET, o + DAU_BAN_GHI_NET + n) })
    o += DAU_BAN_GHI_NET + n
  }
  return { muc, du: o }
}

// ───────────────────────── lệnh máy chủ ─────────────────────────

/** Một buổi trong danh sách (cả `/hs/live-ds` lẫn `/gv/live-ds`). */
export interface BuoiLiveDs {
  id: string
  ngay: string
  lop: string
  batLuc: string
  tenTuDong: string
  tenThay: string | null
  soCau: number
  soDoan: number
  /** Giây live và tổng giây các đoạn. */
  giayLive: number
  giayDoan: number
  trangThai: TrangThaiBuoiLive
  /** 0..100 khi `dang_xu_ly`. */
  tienDo: number
  ban: number
  /** (11/11, chỉ thêm) Buổi đã xong mà KHÔNG có đoạn xem lại nào (`soDoan` = 0): vì sao — `LyDoKhongDoan`. Có đoạn ⇒ vắng / null. Chỉ `/gv/live-ds` trả (máy em không thấy buổi 0 đoạn). */
  lyDo?: LyDoKhongDoan | null
}
/** Vì sao buổi không có đoạn xem lại: live dưới 15 giây · chưa câu nào được chữa · không thu được tiếng và không có nét · phần chữa quá ngắn. */
export type LyDoKhongDoan = 'ngan' | 'khong-cau' | 'khong-tieng-net' | 'khong-doan'

/** `GET /hs/live-ds` — buổi em được xem (mới nhất trước). Buổi `dang_xoa` không trả; `loi` không trả cho em. */
export interface TraLiveDsHs {
  buoi: (BuoiLiveDs & {
    /** Các câu em lên bảng trong buổi (số câu), rỗng nếu không. */
    lenBang: number[]
    /** Vé tệp HMAC `live|<id>|<sbd>|<hạn>` cho `/live-tep/<id>/<tệp>?ve=`; chỉ có khi `trangThai === 'xong'`. */
    ve: string | null
  })[]
}

/** `GET /hs/live-buoi?id=` — kết quả RIÊNG của em trong buổi (từ `bpu_luot` của chính em). 404 = thầy đã gỡ buổi / em không có quyền. */
export interface TraLiveBuoiHs {
  id: string
  ban: number
  ve: string
  /** Theo số lượt của phòng: em đúng / sai; lượt em không gửi thì vắng khoá. */
  ketQua: Record<number, { dung: boolean }>
  /** Số lượt em lên bảng. */
  lenBang: number[]
}

/** `GET /gv/live-ds` — mọi buổi của thầy (mới nhất trước), kể cả đang xử lý / lỗi. */
export interface TraLiveDsGv {
  buoi: (BuoiLiveDs & { byte: number; quyen: QuyenBuoiLive; ve: string | null })[]
  tongByte: number
}

/** `POST /gv/live-xoa { ids }` — trả số buổi đã xoá hẳn và buổi còn dở (cron xoá tiếp). */
export interface TraLiveXoa { xoa: string[]; conDo: string[]; byte: number }

/** Tên ba tệp phục vụ qua `/live-tep/<id>/<tệp>?ve=` (có `Range` ⇒ 206). */
export const TEP_LIVE = { buoi: 'buoi.json', net: 'net.bin', tieng: 'tieng.mp3' } as const
export type TepLive = (typeof TEP_LIVE)[keyof typeof TEP_LIVE]
