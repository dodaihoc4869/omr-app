// HỢP ĐỒNG: LỊCH SỬ LÀM CÂU CỦA MỘT EM (thầy 09/10 khuya: "bấm vào từng học sinh hiển thị rõ toàn bộ lịch sử, câu làm sai
// số giây làm mỗi câu, mọi thứ về học sinh đó").
// Lệnh thầy `POST /gv/lich-su-lam-cau {sbd, gioiHan?}` — CHỈ ĐỌC sổ `su_kien_hoc` (mọi nguồn: ca thi, Đảo, Đoàn, Bi-a, Lên bảng,
// Đầu giờ, Ôn lại, BTVN…), bỏ sự kiện "đọc lời giải" và sự kiện còn giấu (`visibility = 'embargoed'`). Chỉ thầy (mã bí mật).
// Dùng chung cho máy chủ (`server/src/lich-su-lam-cau.ts`) và app thầy (`src/lib/lich-su-lam-cau-api.ts`).

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
}

/** Một câu em từng làm SAI (ít nhất một lần). */
export interface CauEmSai {
  qid: string
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
  /** Mới trước; tối đa `gioiHan` (mặc định 1000, trần 2000). */
  lan: LanLamCau[]
  /** Câu từng sai: CHƯA đúng lại trước, rồi nhiều lần sai trước, rồi gần đây trước. */
  cauSai: CauEmSai[]
  /** Còn lượt cũ hơn chưa trả trong `lan` (vượt `gioiHan`). */
  conNua: boolean
  /** Sổ của em vượt 5000 lượt ⇒ `tong`/`cauSai` chỉ tính 5000 lượt gần nhất. */
  catBot: boolean
}

export type TraLoiLichSuLamCau = KetQuaLichSuLamCau | { ok: false; error: string }
