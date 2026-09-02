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
// khỏi nguyên tố (lỗi rất hay gặp, vd ion Ca2+ bị trích thành "2\nCa +").
const DAU_HIEU_VO: RegExp[] = [
  /\d\s+[A-ZĐ][a-zàảãáạâầấậẫẩăằắặẵẳêềếệễểôồốộỗổơờớợỡởưừứựữử]?\s*[+\-−]/, // "2 Ca +"
  /[A-ZĐ][a-zàảãáạâầấậẫẩăằắặẵẳêềếệễểôồốộỗổơờớợỡởưừứựữử]?\s*\d\s*[+\-−]\s/, // "Ca 2 +"
  /[ΔΕ]\s*[HfE]/, // "Δ f H" (nhiệt tạo thành chuẩn, thế điện cực)
  /°/,
  /\s{4,}\S/, // nhiều khoảng trắng liên tiếp chen giữa chữ — dấu hiệu bảng/công thức bị xé lẻ
]

function congThucVo(text: string): boolean {
  return DAU_HIEU_VO.some((re) => re.test(text))
}

function normSpace(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

const PHAN_RE = /^[ \t]*PH[ẦA]N\s+(I{1,3})\b/gim

/** Cắt vùng đề thành các khối PHẦN I/II/III theo đúng thứ tự xuất hiện. */
export function splitPhan(vungA: string): ParsedPhan[] {
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
    out.push({ ten: markers[i].ten, cau: splitCau(vungA.slice(start, end)) })
  }
  return out
}

// Nhận "Câu 1." "Câu 1:" "Câu 1 " ở đầu dòng — KHÔNG bắt "1." đầu dòng ở đây
// vì dễ trùng với số liệu/bảng trong đề (vd "1 kg", "1 số điện") — chỉ dùng
// mốc "Câu <số>" tường minh, an toàn hơn cho kho đề đa dạng của thầy.
const CAU_RE = /^[ \t]*C[âa]u\s+(\d{1,3})\s*[.:]?\s/gim

function splitCau(khoi: string): ParsedQuestion[] {
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
    const { de, pa } = splitPa(raw)
    out.push({ so: markers[i].so, de, pa, canDocAnh: congThucVo(raw) })
  }
  return out
}

// Mốc phương án: chữ A/B/C/D KHÔNG đứng liền sau chữ/số khác (tránh bắt nhầm
// giữa từ, vd không bắt "A" trong "NaHCO3"), theo sau là dấu chấm/ngoặc rồi
// khoảng trắng. Chỉ nhận theo ĐÚNG THỨ TỰ A rồi B rồi C rồi D — mốc nào không
// khớp thứ tự đang chờ thì bỏ qua (chặn bắt nhầm chữ hoa đơn lẻ ngẫu nhiên
// trong đề, ví dụ ký hiệu nguyên tố hay biến số vật lý).
const OPTION_MARK_RE = /(?<![A-Za-zÀ-ỹ0-9])([ABCD])\s*[.)]\s+/g

function splitPa(raw: string): { de: string; pa: ParsedOption[] } {
  const found: { index: number; markerEnd: number; key: 'A' | 'B' | 'C' | 'D' }[] = []
  let m: RegExpExecArray | null
  OPTION_MARK_RE.lastIndex = 0
  let expect = 'A'
  while ((m = OPTION_MARK_RE.exec(raw))) {
    if (m[1] === expect) {
      found.push({ index: m.index, markerEnd: m.index + m[0].length, key: expect as 'A' | 'B' | 'C' | 'D' })
      expect = String.fromCharCode(expect.charCodeAt(0) + 1)
      if (expect > 'D') break
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
