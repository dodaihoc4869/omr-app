// HỢP ĐỒNG: LỊCH SỬ LÀM CÂU CỦA MỘT EM (thầy 09/10 khuya: "bấm vào từng học sinh hiển thị rõ toàn bộ lịch sử, câu làm sai
// số giây làm mỗi câu, mọi thứ về học sinh đó").
// Lệnh thầy `POST /gv/lich-su-lam-cau {sbd, gioiHan?}` — CHỈ ĐỌC sổ `su_kien_hoc` (mọi nguồn: ca thi, Đảo, Đoàn, Bi-a, Lên bảng,
// Đầu giờ, Ôn lại, BTVN…), bỏ sự kiện "đọc lời giải" và sự kiện còn giấu (`visibility = 'embargoed'`). Chỉ thầy (mã bí mật).
// Dùng chung cho máy chủ (`server/src/lich-su-lam-cau.ts`) và app thầy (`src/lib/lich-su-lam-cau-api.ts`).
// 21/10: THÊM (chỉ-thêm, trường tuỳ chọn) `mucLam` từng lượt + `tong.mucLam` — Mức làm 1–4 (server/src/muc-lam.ts, docs/dac-ta-muc-lam-bai-2010.md).
import type { MucLamLuot, TongMucLam } from './muc-lam'

export type { MucLamLuot, TongMucLam }

/** Nguồn đo số giây: `do` = đo thật (cột `giay` của sổ, hoặc `raw_json.ms` máy em gửi); `uoc` = ƯỚC TÍNH (lượt game cũ,
 *  khoảng cách từ lần trả lời trước); `null` = không đo được (không đoán). */
export type NguonGiay = 'do' | 'uoc' | null

/** Một lần em làm một câu. */
export interface LanLamCau {
  /** ISO (giờ máy chủ). */
  luc: string
  /** Ngày lịch Việt Nam `YYYY-MM-DD`. */
  ngay: string
  qid: string
  /** "Câu 25 · Hiệu suất ester hoá" khi tra được kho; không tra được ⇒ chuỗi rỗng (app tự ghi theo mã câu). */
  tieuDe: string
  /** Mức độ: 'biet' | 'hieu' | 'VD' | 'VDC' | '' */
  mucDo: string
  /** Nơi làm, tên ngắn: "Ca Kiểm tra 15 phút 11B" · "Đảo" · "Đoàn" · "Bi-a" · "Lên bảng" · "Đầu giờ" · "Ôn lại" · "BTVN"… */
  noi: string
  /** true = đúng · false = sai · null = bỏ trống (ca thi). */
  dung: boolean | null
  /** Đáp án em chọn ('A'…'D', chuỗi đúng-sai, số…); không biết ⇒ null. */
  chon: string | null
  /** Số giây làm câu này (đã làm tròn, ≥ 1); null = không đo được. */
  giay: number | null
  nguonGiay: NguonGiay
  /** Em đã dùng gợi ý / được hỗ trợ ở lần này. */
  coGoiY: boolean
  /** Mức làm 1–4 của lượt. VẮNG ⇒ "Chưa có số đo" (giây cũ / chưa đo / thiếu kích thước đề; bản học sinh/phụ huynh: cả lượt ĐÚNG ở Mức 1–2 — chỉ hiện số giây). */
  mucLam?: MucLamLuot
}

/** Một câu em từng làm SAI (ít nhất một lần). */
export interface CauEmSai {
  qid: string
  /** Bản học sinh / phụ huynh (đợt 16): khoá "g<số>" mở màn Tự chữa đúng câu (`khoaMoChua` trong ho-so-em-hs-loc.ts). Bản thầy: vắng. */
  moChua?: string
  tieuDe: string
  mucDo: string
  soLan: number
  soSai: number
  soDung: number
  /** Lần gần nhất đúng ⇒ em đã sửa được. */
  lanCuoiDung: boolean
  /** ISO lần gần nhất. */
  lanCuoi: string
  /** Số giây các lần SAI, cũ → mới (null = lần ấy không đo được). */
  giaySai: (number | null)[]
}

export interface TongLichSuLamCau {
  soLuot: number
  soDung: number
  soSai: number
  soBoTrong: number
  /** Số câu khác nhau đã làm. */
  soCau: number
  /** Số câu khác nhau từng sai. */
  soCauSai: number
  /** Trung bình giây mỗi lượt (chỉ lượt đo được — gồm cả ước tính); không có ⇒ null. */
  giayTb: number | null
  /** Tổng giây các lượt đo được. */
  tongGiay: number
}

/** `tong` và `cauSai` tính trên MỌI lượt máy chủ đọc (tối đa 5000 lượt gần nhất của em); `lan` chỉ trả `gioiHan` lượt mới nhất. */
export interface KetQuaLichSuLamCau {
  ok: true
  em: { sbd: string; hoTen: string; lop: string }
  tong: TongLichSuLamCau
  /** Mới trước; tối đa `gioiHan` (mặc định 1000, trần 5000). */
  lan: LanLamCau[]
  /** Gộp Mức làm 1–4 trên đúng tập lượt được xem (cùng cửa sổ với `tong`; bản học sinh/phụ huynh bỏ lượt đúng ở Mức 1–2). Máy chủ cũ: vắng. */
  mucLam?: TongMucLam
  /** Hồ sơ 6 mức (22/10) — xem `MucLam6`. Máy chủ cũ: vắng. */
  mucLam6?: MucLam6
  /** Câu từng sai: CHƯA đúng lại trước, rồi nhiều lần sai trước, rồi gần đây trước. */
  cauSai: CauEmSai[]
  /** Còn lượt cũ hơn chưa trả trong `lan` (vượt `gioiHan`). */
  conNua: boolean
  /** Sổ của em vượt 5000 lượt ⇒ `tong`/`cauSai` chỉ tính 5000 lượt gần nhất. */
  catBot: boolean
}

/** Một ngày trong khối "Theo ngày" (6 mức): `dem[i]` = số lượt Mức làm i+1 (lượt treo đếm ở ô 5 / 6, KHÔNG ở ô 1–4). */
export interface NgayMucLam {
  ngay: string
  dem: [number, number, number, number, number, number]
  /** Lượt không có Mức làm (giây cũ / chưa đo / thiếu kích thước đề). */
  chuaCoSoDo: number
  /** Lượt có Mức làm 1–4 nhưng chưa có số đo treo máy (máy em chưa có đồng hồ 22/10). */
  soChuaDoTreo: number
}
export interface DemDungSai { dung: number; sai: number }
/** Bằng chứng Mức làm 6 của MỘT ngày (CHỈ bản thầy): các lượt treo của ngày ấy. */
/** `so` = tổng lượt Mức 6 của ngày; `luot` chỉ tối đa `TOI_DA_LUOT_BANG_CHUNG` lượt (cũ → mới). */
export interface NgayCoTinh { ngay: string; so: number; luot: { luc: string; giayTreo: number; tieuDe: string }[] }

/**
 * HỒ SƠ 6 MỨC (thầy duyệt bản vẽ docs/ban-ve-ho-so-em-2210, 22/10) — trường MỚI, tuỳ chọn; `mucLam` cũ GIỮ NGUYÊN (bốn dòng cộng = soDo) cho máy PWA cũ.
 * Mọi số trên CÙNG tập lượt em được xem (bản học sinh/phụ huynh: Mức 6 đã hạ về 5, lượt đúng Mức 1–2 không mang mức).
 */
export interface MucLam6 {
  /** Khoảng "7 ngày gần nhất" theo ngày Việt Nam (YYYY-MM-DD, gồm cả hai đầu). */
  tu: string
  den: string
  /** 7 ngày, `tongMucLam(…, { tachTreo: true })`: bốn dòng Mức 1–4 KHÔNG gồm lượt treo. */
  bay: TongMucLam
  /** Toàn bộ sổ máy chủ đọc, cũng tách treo — cho khối gập "Toàn bộ sổ". */
  toanBo: TongMucLam
  /** Đúng / sai của lượt Mức 5 (`treo`) và Mức 6 (`coTinh`) trong 7 ngày. */
  treoDungSai: { treo: DemDungSai; coTinh: DemDungSai }
  /** 7 hàng, cũ → mới. */
  theoNgay: NgayMucLam[]
  /** CHỈ bản thầy: các ngày có Mức làm 6 trong 7 ngày (mới trước). */
  ngayCoTinh?: NgayCoTinh[]
}

export type TraLoiLichSuLamCau = KetQuaLichSuLamCau | { ok: false; error: string }
