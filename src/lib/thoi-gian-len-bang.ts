// THỜI GIAN LÊN BẢNG THEO ĐỘ KHÓ × ĐỘ DÀI × EM — HÀM THUẦN, MỘT NGUỒN (M1, 19/09/2026).
//
// Thầy chốt: "Dựa vào độ khó và đề dài hay ngắn tính toán lại hết thời gian lên bảng, chữa bài."
//
// TRƯỚC ĐÂY có hai công thức rời nhau:
//   · Engine E (`xep-buoi-chua.ts`): chỉ theo SAO — 300 / 180 / 120 giây, không nhìn đề dài hay ngắn;
//   · `thoiGianDayHoc()` của tờ chiếu: đếm từ + độ khó, kẹp 60–180 s, chỉ dùng cho đồng hồ đếm ngược.
// Đề Phần II bốn ý dài và đề Phần I một dòng cùng sao thì tốn giờ y hệt — đó là chỗ buổi chữa hụt giờ.
//
// NAY MỘT HÀM: `thoiGianCau` = T_đọc + T_làm + T_chữa (công thức và hằng số ở `THOI_GIAN_LEN_BANG`,
// `len-bang-cau-hinh.ts`). Ba thành phần tách ra vì tờ chiếu cần chúng: pha LÀM BÀI = T_đọc + T_làm,
// pha CHỮA = T_chữa; và hai em lên song song thì `T_đợt = max(T_đọc+T_làm) + T_chữa_A + T_chữa_B`.
//
// TƯƠNG THÍCH: câu KHÔNG có văn bản (`noiDung` thiếu — test cũ dựng `CauChua` tối giản, hoặc gói đề không tải
// được) rơi về `GIAY_LEN_BANG_THEO_SAO` (300 / 180 / 120, `xep-buoi-chua-1409` khoá) — không bịa số từ ô trống.
// Mọi thứ THUẦN và TẤT ĐỊNH: cùng đầu vào ra cùng số, không đọc đồng hồ.
import type { CauLuyen } from './bai-tap-pdf'
import {
  CAU_HINH_LEN_BANG_MAC_DINH,
  GIAY_THUC,
  THOI_GIAN_LEN_BANG,
  giayLenBang,
  type CauHinhLenBang,
} from './len-bang-cau-hinh'

export type PhanCau = 'I' | 'II' | 'III'
export type BacDangEm = 'biet' | 'hieu' | 'van_dung'

/** Những gì ta ĐO được từ nội dung một câu — chỉ ba con số, để tính thời gian không phải mang cả câu hỏi. */
export interface NoiDungCau {
  /** Số từ của đề + các phương án / ý (chữ hiển thị, không tính thẻ HTML). */
  soTu: number
  /** Có ảnh hoặc bảng số liệu (đọc lâu hơn). */
  coHinh: boolean
  /** Số bước của lời giải (0 = không có lời giải). */
  soBuoc: number
}

export interface DauVaoThoiGian {
  phan: PhanCau
  /** Chưa gắn sao tính như 0 sao. */
  sao?: 0 | 1 | 2
  /** Thiếu ⇒ rơi về `GIAY_LEN_BANG_THEO_SAO` (`giayLenBang`). */
  noiDung?: NoiDungCau
  /** Tỉ lệ em trong lớp làm SAI câu này (0–1). Thiếu ⇒ coi như 0 (không đoán lớp sai nhiều hay ít). */
  tiLeLopSai?: number
  /** Bậc của em đứng lên ở dạng của câu. Thiếu ⇒ hệ số 1,0. */
  bacEm?: BacDangEm | null
  /** HỆ SỐ HIỆU CHỈNH theo giây thật (M6, `hieu-chinh-giay-thuc.ts`): nhân cả ba thành phần. Thiếu / không hợp lệ ⇒ 1. Câu thiếu văn bản
   * (300 / 180 / 120 thầy đã chốt) KHÔNG bị hiệu chỉnh. */
  heSo?: number
}

export interface ThoiGianCau {
  /** Giây đọc đề. */
  doc: number
  /** Giây làm bài (viết lên bảng). */
  lam: number
  /** Giây chữa: cả lớp nghe thầy chữa xong câu. */
  chua: number
  /** Tổng đã kẹp và làm tròn; luôn `doc + lam + chua === tong`. */
  tong: number
  /** `true` khi câu thiếu văn bản và số này là hằng số theo sao (`GIAY_LEN_BANG_THEO_SAO`). */
  roiVeMacDinh: boolean
}

const TG = THOI_GIAN_LEN_BANG

function kep(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x))
}

function lamTron(x: number, buoc: number): number {
  return Math.round(x / buoc) * buoc
}

/** Đếm từ của một đoạn chữ đề: bỏ thẻ HTML, mỗi công thức (`$…$`, `\ce{…}`) tính MỘT từ. */
export function demTu(s: string | null | undefined): number {
  if (!s) return 0
  const sach = s
    .replace(/<[^>]*>/g, ' ')
    .replace(/\$[^$]*\$/g, ' x ')
    .replace(/\\ce\{[^}]*\}/g, ' x ')
  const t = sach.trim()
  return t ? t.split(/\s+/).length : 0
}

/** Thống kê nội dung của một `CauLuyen` (dạng tờ chiếu / phiếu dùng). */
export function noiDungTuCauLuyen(c: CauLuyen): NoiDungCau {
  const text = c.anhThanCau ? '' : c.text || ''
  let soTu = demTu(text)
  for (const p of c.luaChon ?? []) soTu += demTu(p)
  const coHinh = Boolean(
    c.anhThanCau ||
      (c.anhLuaChon && c.anhLuaChon.some(Boolean)) ||
      (c.hinh && c.hinh.length > 0) ||
      (c.bang && c.bang.length > 0) ||
      /<img\b|<table\b/i.test(c.text || ''),
  )
  // Câu cắt ảnh cả thân (đề là ẢNH): không có chữ để đếm — đếm cỡ một đề trung bình để không tính thành 0 giây đọc.
  if (c.anhThanCau && soTu === 0) soTu = SO_TU_DE_ANH
  const soBuoc = c.buoc && c.buoc.length > 0 ? c.buoc.length : c.lyDo && c.lyDo.length > 0 ? Math.ceil(c.lyDo.length / 2) : 0
  return { soTu, coHinh, soBuoc }
}

/** Đề chỉ có ảnh thì ước một đề trung bình (chữ trong ảnh không đếm được). */
const SO_TU_DE_ANH = 40

/** Thống kê nội dung của câu GỐC trong gói đề (`TeacherMcq/TrueFalse/ShortAnswerQuestion`) — để màn xếp buổi
 * tính thời gian mà không phải dựng `CauLuyen` cho cả kho. Đọc phòng thủ: trường nào thiếu tính như không có. */
export function noiDungTuCauGoc(phan: PhanCau, q: unknown): NoiDungCau {
  const o = (q ?? {}) as Record<string, unknown>
  const chuoi = (v: unknown) => (typeof v === 'string' ? v : '')
  const mang = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
  const anhThan = chuoi(o.thanCauImg)
  let soTu = anhThan ? 0 : demTu(chuoi(o.text))
  if (phan === 'I') for (const p of mang(o.choices)) soTu += demTu(chuoi(p))
  if (phan === 'II') for (const y of mang(o.ideas)) soTu += demTu(chuoi(y))
  const coHinh =
    Boolean(anhThan) ||
    mang(o.choiceImgs).some(Boolean) ||
    mang(o.ideaImgs).some(Boolean) ||
    Boolean(o.imageDataUrl) ||
    mang(o.hinhAnh).length > 0 ||
    mang(o.table).length > 0 ||
    /<img\b|<table\b/i.test(chuoi(o.text))
  if (anhThan && soTu === 0) soTu = SO_TU_DE_ANH
  const lg = (o.loiGiai ?? {}) as Record<string, unknown>
  const buoc = mang(lg.buoc).length
  const lyDo = Object.keys((lg.tungPa ?? {}) as object).length + Object.keys((lg.tungY ?? {}) as object).length
  const soBuoc = buoc > 0 ? buoc : lyDo > 0 ? Math.ceil(lyDo / 2) : chuoi(o.explanation) ? 1 : 0
  return { soTu, coHinh, soBuoc }
}

/** THỜI GIAN MỘT EM LÊN BẢNG CHỮA MỘT CÂU. Xem đầu tệp và `THOI_GIAN_LEN_BANG`. */
export function thoiGianCau(d: DauVaoThoiGian, ch: CauHinhLenBang = CAU_HINH_LEN_BANG_MAC_DINH, tg: typeof TG = TG): ThoiGianCau {
  if (!d.noiDung) {
    const tong = giayLenBang(ch, d.sao)
    return { doc: 0, lam: tong, chua: 0, tong, roiVeMacDinh: true }
  }
  const sao = d.sao ?? 0
  const lopSai = kep(d.tiLeLopSai ?? 0, 0, 1)
  const bac = d.bacEm ? tg.HE_SO_BAC[d.bacEm] : 1

  const doc = tg.DOC_NEN_GIAY + tg.DOC_GIAY_MOI_TU * d.noiDung.soTu + (d.noiDung.coHinh ? tg.DOC_HINH_GIAY : 0)
  const lam = tg.LAM_NEN_GIAY[d.phan] * tg.HE_SO_SAO[sao] * (1 + tg.HE_SO_LOP_SAI * lopSai) * bac
  // Câu 0 sao ("đọc đáp án là đủ") chữa tối đa CHUA_BUOC_TOI_DA_SAO_0 bước: câu dễ không cần chữa 6 bước trên bảng.
  const tranBuoc = sao === 0 ? Math.min(tg.CHUA_BUOC_TOI_DA, tg.CHUA_BUOC_TOI_DA_SAO_0) : tg.CHUA_BUOC_TOI_DA
  const soBuoc = kep(d.noiDung.soBuoc > 0 ? d.noiDung.soBuoc : tg.CHUA_BUOC_TOI_THIEU, tg.CHUA_BUOC_TOI_THIEU, tranBuoc)
  const chua = (tg.CHUA_NEN_GIAY + tg.CHUA_GIAY_MOI_BUOC * soBuoc) * (lopSai >= tg.CHUA_NGUONG_LOP_SAI ? tg.CHUA_HE_SO_KHO : 1)

  // Hiệu chỉnh từ giây thật: nhân ĐỀU ba thành phần (giữ tỉ trọng pha), rồi kẹp/làm tròn như thường. Ngoài khoảng cho phép ⇒ kẹp lại.
  const heSo = typeof d.heSo === 'number' && Number.isFinite(d.heSo) && d.heSo > 0 ? kep(d.heSo, GIAY_THUC.HE_SO_THAP, GIAY_THUC.HE_SO_CAO) : 1
  const tho = (doc + lam + chua) * heSo
  const tong = kep(lamTron(tho, tg.LAM_TRON_GIAY), tg.TOI_THIEU_GIAY, tg.TOI_DA_GIAY)
  // Kẹp/làm tròn làm tổng lệch tổng thô: co đều ba thành phần theo đúng tỉ lệ rồi dồn phần dư lẻ vào T_làm,
  // để `doc + lam + chua === tong` (tờ chiếu cộng ba số này) mà pha nào cũng còn đúng tỉ trọng.
  const k = (tong / tho) * heSo
  const d2 = Math.round(doc * k)
  const c2 = Math.round(chua * k)
  return { doc: d2, lam: tong - d2 - c2, chua: c2, tong, roiVeMacDinh: false }
}

/** THỜI GIAN MỘT ĐỢT trên tờ chiếu. Hai em SONG SONG cùng làm rồi chữa lần lượt:
 * `T_đợt = max(T_đọc + T_làm của hai em) + T_chữa_A + T_chữa_B`. Một em: đúng T của em ấy. */
export function thoiGianDot(a: ThoiGianCau, b?: ThoiGianCau): number {
  if (!b) return a.tong
  return Math.max(a.doc + a.lam, b.doc + b.lam) + a.chua + b.chua
}

/** GIÂY MỘT EM TỐN TRONG NGÂN SÁCH BUỔI khi hai em lên bảng SONG SONG (tờ chiếu chạy hai em một đợt).
 *
 * Buổi thật tốn `Σ T_đợt`, không phải `Σ T` của từng em: hai em cùng làm bài một lúc nên phần (T_đọc + T_làm) chỉ tính
 * một lần cho cả đợt. Chia đều cho hai em: mỗi em gánh `HE_LAM_SONG_SONG` (mặc định ½) phần làm bài + trọn T_chữa của mình.
 * Câu thiếu văn bản (`roiVeMacDinh`) giữ NGUYÊN 300 / 180 / 120 — đó là con số theo sao đã được thầy chốt và test khoá. */
export function giayBienGhepDoi(t: ThoiGianCau, tg: typeof TG = TG): number {
  if (t.roiVeMacDinh) return t.tong
  return kep(lamTron(t.chua + tg.HE_LAM_SONG_SONG * (t.doc + t.lam), tg.LAM_TRON_GIAY), tg.LAM_TRON_GIAY, tg.TOI_DA_GIAY)
}
