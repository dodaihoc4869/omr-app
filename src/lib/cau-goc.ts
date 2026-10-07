// CÂU GỐC của câu thay — ca "Kiểm chứng câu đã đúng" (thầy 07/10: nút nhỏ "Xem câu gốc" để em đối chiếu kiến thức của câu thay thế).
// Kiểu + bộ đọc phòng thủ của nội dung CÔNG KHAI máy chủ phát ở `/hs/cau-goc` (server/src/cau-goc.ts). Chỉ giữ các trường công khai của đề:
// dù máy chủ lỡ gửi thừa (`correct`, `solution`, `hinhAnh` kiểu `sau_loi_giai`…) thì máy em cũng KHÔNG giữ — đáp án không bao giờ xuống màn thi trước khi nộp.
import type { ViTriHinh } from '../data/examContent'

/** Ảnh của câu gốc tại một vị trí; ảnh của LỜI GIẢI (`sau_loi_giai`) không bao giờ vào đây. */
export interface HinhCauGoc {
  src: string
  viTri: Exclude<ViTriHinh, 'sau_loi_giai'>
  alt?: string
}

/** Câu gốc như máy em giữ: đề, phương án / ý, bảng, hình của đề. KHÔNG đáp án, KHÔNG lời giải. */
export interface CauGocCongKhai {
  qid: string
  phan: 'I' | 'II' | 'III'
  text: string
  choices?: string[]
  ideas?: string[]
  /** Ảnh thay chữ của từng phương án / ý (theo chỉ số gốc 0–3); ô không có ảnh là `undefined`. */
  choiceImgs?: (string | undefined)[]
  ideaImgs?: (string | undefined)[]
  table?: string[][]
  thanCauImg?: string
  imageDataUrl?: string
  hinhAnh?: HinhCauGoc[]
}
/** Hàm xin câu gốc theo qid câu GỐC. `null` = máy chủ không có câu ấy để phát; ném lỗi = không hỏi được ⇒ cho em bấm thử lại. */
export type LayCauGoc = (qid: string) => Promise<CauGocCongKhai | null>

const VI_TRI_HINH: ReadonlySet<string> = new Set(['sau_de', 'sau_pa_A', 'sau_pa_B', 'sau_pa_C', 'sau_pa_D', 'sau_y_a', 'sau_y_b', 'sau_y_c', 'sau_y_d', 'cuoi_cau'])

const chuoi = (v: unknown): string => (typeof v === 'string' ? v : '')
const mangChuoi = (v: unknown, tran: number): string[] | undefined => (Array.isArray(v) ? v.slice(0, tran).map(chuoi) : undefined)
/** Nguồn ảnh hợp lệ: ảnh nhúng, đường dẫn tuyệt đối http(s) hoặc đường dẫn gốc (kho ảnh của máy chủ). Khác ⇒ bỏ. */
const nguonAnh = (v: unknown): string => {
  const s = chuoi(v).trim()
  return /^(data:image\/|https?:\/\/|\/)/i.test(s) ? s : ''
}
const mangAnh = (v: unknown): (string | undefined)[] | undefined => {
  if (!Array.isArray(v)) return undefined
  const ra = v.slice(0, 4).map((x) => nguonAnh(x) || undefined)
  return ra.some(Boolean) ? ra : undefined
}

/** Đọc MỘT câu gốc máy chủ trả: sai kiểu / không có đề ⇒ null. Bỏ mọi trường ngoài danh sách công khai. */
export function docCauGoc(v: unknown): CauGocCongKhai | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null
  const o = v as Record<string, unknown>
  const qid = chuoi(o.qid).trim()
  const phan = o.phan === 'I' || o.phan === 'II' || o.phan === 'III' ? o.phan : null
  const text = chuoi(o.text)
  const thanCauImg = nguonAnh(o.thanCauImg)
  if (!qid || !phan || (!text.trim() && !thanCauImg)) return null
  const bang = Array.isArray(o.table) ? o.table.slice(0, 60).map((h) => (Array.isArray(h) ? h.slice(0, 20).map(chuoi) : [])) : undefined
  const choices = mangChuoi(o.choices, 4)
  const ideas = mangChuoi(o.ideas, 4)
  const imageDataUrl = nguonAnh(o.imageDataUrl)
  const choiceImgs = mangAnh(o.choiceImgs)
  const ideaImgs = mangAnh(o.ideaImgs)
  const hinhAnh: HinhCauGoc[] = Array.isArray(o.hinhAnh)
    ? o.hinhAnh.slice(0, 12).flatMap((h) => {
        const x = (h && typeof h === 'object' ? h : {}) as Record<string, unknown>
        const src = nguonAnh(x.src)
        const viTri = chuoi(x.viTri)
        if (!src || !VI_TRI_HINH.has(viTri)) return []
        const alt = chuoi(x.alt).trim()
        return [{ src, viTri: viTri as HinhCauGoc['viTri'], ...(alt ? { alt } : {}) }]
      })
    : []
  return {
    qid, phan, text,
    ...(choices && choices.length > 0 ? { choices } : {}),
    ...(ideas && ideas.length > 0 ? { ideas } : {}),
    ...(choiceImgs ? { choiceImgs } : {}),
    ...(ideaImgs ? { ideaImgs } : {}),
    ...(bang && bang.length > 0 ? { table: bang } : {}),
    ...(thanCauImg ? { thanCauImg } : {}),
    ...(imageDataUrl ? { imageDataUrl } : {}),
    ...(hinhAnh.length > 0 ? { hinhAnh } : {}),
  }
}

/** Đọc bảng `cau` của `/hs/cau-goc`: qid câu gốc → câu; phần tử hỏng bị bỏ. */
export function docBangCauGoc(v: unknown): Record<string, CauGocCongKhai> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {}
  // `fromEntries` tạo khoá riêng (khoá `__proto__` cũng chỉ là khoá thường, không đổi nguyên mẫu).
  return Object.fromEntries(Object.entries(v as Record<string, unknown>).flatMap(([k, x]) => {
    const c = docCauGoc(x)
    return c ? [[k, c] as const] : []
  }))
}
