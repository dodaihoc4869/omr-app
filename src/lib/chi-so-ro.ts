// CHỈ SỐ HOÁ HỌC VẼ RÕ (OMNI 3, điều phối 05/10 — thầy hỏi "Lời giải hiển thị đúng chuẩn chưa?").
// Kho đề / câu nền viết chỉ số bằng ký tự Unicode (C₆H₁₂O₆, Fe³⁺, 10⁻³). Phông Be Vietnam Pro không có các glyph ₀–₉ ⁰–⁹ ⁺⁻ nên máy lấy phông
// dự phòng — chữ bé, lệch dòng, khó đọc (thầy nhắc 28/09; "Câu đã làm" đã sửa bằng `chiSoDuoiRo` của hoa2/cau-chuyen.ts). Ở đây đổi sang cú pháp
// `_{…}` / `^{…}` mà ChemText / TheCau vẽ bằng <sub>/<sup> CÙNG phông chữ quanh nó. Chỉ đổi cách VẼ, không đổi nội dung, không đụng dữ liệu gửi máy chủ.
// Hàm thuần, không phụ thuộc gì (dùng được ở mọi mảnh nạp lười).
const DUOI = '₀₁₂₃₄₅₆₇₈₉'
const TREN = '⁰¹²³⁴⁵⁶⁷⁸⁹'

/** "CO₂" → "CO_{2}"; "Fe³⁺" → "Fe^{3+}"; "10⁻³" → "10^{-3}". Chuỗi không có ký tự chỉ số ⇒ trả nguyên. */
export function chiSoRo(s: string): string {
  if (!/[₀-₉⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]/.test(s)) return s
  return s
    .replace(/[₀-₉]+/g, (d) => `_{${[...d].map((c) => DUOI.indexOf(c)).join('')}}`)
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+/g, (d) => `^{${[...d].map((c) => (c === '⁺' ? '+' : c === '⁻' ? '-' : String(TREN.indexOf(c)))).join('')}}`)
}

/** Đổi MỌI chuỗi lá trong một đối tượng lời giải (chot, các bước, lý do từng phương án/ý…) — giữ nguyên cấu trúc, số, boolean. */
export function chiSoRoSau<T>(v: T): T {
  if (typeof v === 'string') return chiSoRo(v) as unknown as T
  if (Array.isArray(v)) return v.map((x) => chiSoRoSau(x)) as unknown as T
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, chiSoRoSau(x)])) as T
  return v
}
