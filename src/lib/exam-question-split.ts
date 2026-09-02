// Tách vùng đề (vùng A, đã cắt bằng exam-answer-key.ts) thành PHẦN I/II/III
// -> từng câu -> từng phương án A/B/C/D — làm ĐÚNG như file gốc trình bày,
// KHÔNG ép mọi câu về một khuôn dòng cố định nào.
//
// Đề thật (kho 15 năm của thầy) viết phương án theo NHIỀU KIỂU khác nhau
// TRONG CÙNG MỘT FILE: 4 phương án 1 dòng, 2 phương án 1 dòng, mỗi phương án
// 1 dòng riêng — vì vậy KHÔNG được tách theo ranh giới dòng (\n), mà phải gộp
// hết chữ của 1 câu thành 1 chuỗi liền rồi cắt tại đúng vị trí xuất hiện của
// các mốc "A." "B." "C." "D." (có hoặc không dấu chấm/dấu ngoặc sau chữ cái).

export interface ParsedOption {
  key: 'A' | 'B' | 'C' | 'D'
  text: string
}

export interface ParsedQuestion {
  so: number
  de: string
  pa: ParsedOption[]
  /** Nghi công thức Hoá bị vỡ khi PDF trích lớp chữ (vd "2 Ca +" thay vì
   * "Ca2+") — CHỈ đánh dấu để sau này đọc lại bằng ảnh, KHÔNG tự đoán sửa. */
  canDocAnh: boolean
}

export interface ParsedPhan {
  ten: 'I' | 'II' | 'III'
  cau: ParsedQuestion[]
}

// Dấu hiệu công thức Hoá bị vỡ khi lớp chữ PDF tách rời chỉ số/điện tích ra
// khỏi nguyên tố (lỗi rất hay gặp, vd ion Ca2+ bị trích thành "2\nCa +"), HOẶC
// dấu hiệu có BẢNG SỐ LIỆU/SƠ ĐỒ bị xé lẻ thành chữ vô nghĩa — cả hai đều
// KHÔNG tự sửa được bằng regex, chỉ đánh dấu để đọc lại bằng ảnh trang gốc.
const DAU_HIEU_VO: RegExp[] = [
  /\d\s+[A-ZĐ][a-zàảãáạâầấậẫẩăằắặẵẳêềếệễểôồốộỗổơờớợỡởưừứựữử]?\s*[+\-−]/, // "2 Ca +"
  /[A-ZĐ][a-zàảãáạâầấậẫẩăằắặẵẳêềếệễểôồốộỗổơờớợỡởưừứựữử]?\s*\d\s*[+\-−]\s/, // "Ca 2 +"
  /[ΔΕ]\s*[HfE]/, // "Δ f H" (nhiệt tạo thành chuẩn, thế điện cực)
  /°/,
  /\s{4,}\S/, // nhiều khoảng trắng liên tiếp chen giữa chữ — dấu hiệu bảng/công thức bị xé lẻ
  /\d\s\d\s\d/, // "2 2 2 4 2O" — chỉ số/hệ số của sơ đồ phản ứng nhiều bước bị xé rời từng ký tự
  /(?:[-–−]?\d+,\d+\s+){2,}/, // "0,340 –0,763 –0,440" — dãy số thập phân liên tiếp, dấu hiệu BẢNG bị đọc thành 1 dòng chữ
]

// Cú pháp mhchem hợp lệ (\ce{...}) hoặc toán/lý ($...$) mà thầy/Claude đã gõ
// lại đúng chuẩn TỰ NHIÊN chứa đúng hình dạng "chữ + số + khoảng trắng + dấu
// +/-" (vd "\ce{6nCO2 + 5nH2O ...}") — giống hệt dấu hiệu vỡ ở trên. Phải bỏ
// các đoạn \ce{}/$...$ ra trước khi dò, chỉ dò phần CHỮ THƯỜNG còn lại, nếu
// không công thức càng đúng chuẩn càng dễ bị báo vỡ nhầm.
const CE_OR_MATH_STRIP_RE = /\\ce\{[^}]*\}|\$[^$]*\$/g

/** Xuất ra ngoài để màn Duyệt câu dùng lại — sau khi thầy (hoặc Claude) sửa
 * chữ, chạy lại đúng phép kiểm tra này trên chữ MỚI để tự gỡ cờ vàng, không
 * cần một cơ chế đánh dấu "đã sửa" riêng dễ lệch với nội dung thật. */
export function congThucVo(text: string): boolean {
  const chuThuong = text.replace(CE_OR_MATH_STRIP_RE, ' ')
  return DAU_HIEU_VO.some((re) => re.test(chuThuong))
}

function normSpace(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

// Đầu trang/chân trang PDF (số trang, mã đề lặp lại, khung "Họ tên/Số báo
// danh") — KHÔNG thuộc nội dung câu hỏi. Không lọc thì câu bị cắt ngang trang
// (vd câu cuối trang 3) sẽ bị dòng chân trang chen vào GIỮA đề bài, làm hỏng
// cả phần đề lẫn việc tách phương án phía sau nó.
const HEADER_FOOTER_LINE_RE = [
  /^\s*Trang\s+\d+\s*\/\s*\d+.*$/im,
  /^\s*M[aã]\s*đ[ềe]\s*(?:thi)?\s*:?\s*\d+\s*$/im,
  /^\s*Họ,?\s*t[êe]n\s*th[íi]\s*sinh.*$/im,
  /^\s*S[ốo]\s*b[áa]o\s*danh.*$/im,
]

function stripHeaderFooterLines(text: string): string {
  return text
    .split('\n')
    .filter((line) => !HEADER_FOOTER_LINE_RE.some((re) => re.test(line)))
    .join('\n')
}

// Export để exam-image-crop.ts dùng LẠI nguyên các mốc này khi định vị vùng
// ẢNH cần cắt — tách bằng chữ và tách bằng ảnh phải khớp tuyệt đối cùng một
// quy tắc, tránh 2 bộ regex lệch nhau theo thời gian.
export const PHAN_RE = /^[ \t]*PH[ẦA]N\s+(I{1,3})\b/gim

/** Cắt vùng đề thành các khối PHẦN I/II/III theo đúng thứ tự xuất hiện. */
export function splitPhan(vungAGoc: string): ParsedPhan[] {
  const vungA = stripHeaderFooterLines(vungAGoc)
  const markers: { index: number; ten: 'I' | 'II' | 'III' }[] = []
  let m: RegExpExecArray | null
  PHAN_RE.lastIndex = 0
  while ((m = PHAN_RE.exec(vungA))) {
    const ten = m[1].toUpperCase()
    if (ten === 'I' || ten === 'II' || ten === 'III') markers.push({ index: m.index, ten })
  }
  if (markers.length === 0) return []
  const out: ParsedPhan[] = []
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].index
    const end = i + 1 < markers.length ? markers[i + 1].index : vungA.length
    out.push({ ten: markers[i].ten, cau: splitCau(vungA.slice(start, end), markers[i].ten) })
  }
  return out
}

// Nhận "Câu 1." "Câu 1:" "Câu 1 " ở đầu dòng — KHÔNG bắt "1." đầu dòng ở đây
// vì dễ trùng với số liệu/bảng trong đề (vd "1 kg", "1 số điện") — chỉ dùng
// mốc "Câu <số>" tường minh, an toàn hơn cho kho đề đa dạng của thầy.
export const CAU_RE = /^[ \t]*C[âa]u\s+(\d{1,3})\s*[.:]?\s/gim

function splitCau(khoi: string, ten: 'I' | 'II' | 'III'): ParsedQuestion[] {
  const markers: { index: number; so: number; markerEnd: number }[] = []
  let m: RegExpExecArray | null
  CAU_RE.lastIndex = 0
  while ((m = CAU_RE.exec(khoi))) {
    markers.push({ index: m.index, so: parseInt(m[1], 10), markerEnd: m.index + m[0].length })
  }
  const out: ParsedQuestion[] = []
  for (let i = 0; i < markers.length; i++) {
    const from = markers[i].markerEnd
    const to = i + 1 < markers.length ? markers[i + 1].index : khoi.length
    const raw = khoi.slice(from, to)
    const { de, pa } = splitPa(raw, ten)
    out.push({ so: markers[i].so, de, pa, canDocAnh: congThucVo(raw) })
  }
  return out
}

// Mốc phương án. Phần I dùng chữ HOA "A." "B." "C." "D." (phương án chọn 1
// trong 4). Phần II dùng chữ THƯỜNG "a)" "b)" "c)" "d)" (4 ý Đúng/Sai) — cùng
// một cơ chế tách, chỉ khác bảng chữ cái. Phần III không có mốc nào (trả lời
// ngắn), coi cả câu là đề bài.
// Chữ cái KHÔNG được đứng liền sau chữ/số khác (tránh bắt nhầm giữa từ, vd
// không bắt "A" trong "NaHCO3"), theo sau là dấu chấm/ngoặc rồi khoảng
// trắng. Chỉ nhận ĐÚNG THỨ TỰ mốc 1 rồi 2 rồi 3 rồi 4 — mốc không khớp thứ tự
// đang chờ thì bỏ qua (chặn bắt nhầm ký hiệu nguyên tố/biến số vật lý).
export function optionMarkerRe(ten: 'I' | 'II' | 'III'): RegExp | null {
  if (ten === 'I') return /(?<![A-Za-zÀ-ỹ0-9])([ABCD])\s*[.)]\s+/g
  if (ten === 'II') return /(?<![A-Za-zÀ-ỹ0-9])([abcd])\s*[.)]\s+/g
  return null
}

export const KEYS: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D']

function splitPa(raw: string, ten: 'I' | 'II' | 'III'): { de: string; pa: ParsedOption[] } {
  const re = optionMarkerRe(ten)
  if (!re) return { de: normSpace(raw), pa: [] }

  const found: { index: number; markerEnd: number; key: 'A' | 'B' | 'C' | 'D' }[] = []
  let m: RegExpExecArray | null
  re.lastIndex = 0
  let expectIdx = 0
  while ((m = re.exec(raw))) {
    if (m[1].toUpperCase() === KEYS[expectIdx]) {
      found.push({ index: m.index, markerEnd: m.index + m[0].length, key: KEYS[expectIdx] })
      expectIdx += 1
      if (expectIdx >= KEYS.length) break
    }
  }
  if (found.length < 2) {
    // Không tìm đủ mốc phương án hợp lệ (vd Phần III trả lời ngắn không có
    // A/B/C/D) — coi toàn bộ là đề bài, không có phương án.
    return { de: normSpace(raw), pa: [] }
  }
  const de = normSpace(raw.slice(0, found[0].index))
  const pa: ParsedOption[] = []
  for (let i = 0; i < found.length; i++) {
    const from = found[i].markerEnd
    const to = i + 1 < found.length ? found[i + 1].index : raw.length
    pa.push({ key: found[i].key, text: normSpace(raw.slice(from, to)).replace(/\.\s*$/, '') })
  }
  return { de, pa }
}
