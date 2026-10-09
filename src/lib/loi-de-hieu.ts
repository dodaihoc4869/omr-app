// LỖI DỄ HIỂU CHO MÀN THẦY (trung tu giao diện thầy duyệt 09/10 — "lỗi tải: câu dễ hiểu + Thử lại, KHÔNG hiện lỗi kỹ thuật thô").
//
// Ảnh chụp 09/10 còn in thẳng "Cannot read properties of undefined (reading 'map')" ra màn Hôm nay và Học sinh: câu ấy là lỗi của
// MÃ (máy chủ trả thiếu trường), thầy đọc không ra việc phải làm. Luật một chỗ:
//   · câu tiếng Việt do app / máy chủ viết sẵn ("Chưa kết nối máy chủ — vào Cài đặt…", "Hết thời gian chờ máy chủ") ⇒ GIỮ, vì nó nói đúng việc;
//   · lỗi kỹ thuật (TypeError, "Failed to fetch", JSON hỏng, mã HTTP, chữ tiếng Anh trơn…) ⇒ thay bằng "Mạng có thể đang chập chờn."
// Thuần, không phụ thuộc giao diện — kiểm bằng tests/gv-trung-tu-0910.test.tsx.

const DAU_TIENG_VIET = /[àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/i
const KY_THUAT =
  /cannot read|undefined|\bnull\b|is not a function|is not defined|not iterable|failed to fetch|networkerror|load failed|unexpected token|unexpected end|\bjson\b|typeerror|referenceerror|syntaxerror|rangeerror|aborterror|\bhttp\s*\d{3}\b|\bstatus\s*\d{3}\b|^\s*\d{3}\b|\[object |stack|at\s+\w+\s*\(/i

/** Câu này là lỗi kỹ thuật thô (không nên đưa nguyên văn cho thầy). Rỗng ⇒ coi như kỹ thuật (không có gì để nói). */
export function laLoiKyThuat(chu: string): boolean {
  const s = chu.trim()
  if (!s) return true
  if (KY_THUAT.test(s)) return true
  return !DAU_TIENG_VIET.test(s)
}

/** Lý do dễ hiểu từ một lỗi bất kỳ: câu tiếng Việt viết sẵn thì giữ (thêm dấu chấm), còn lại "Mạng có thể đang chập chờn." */
export function lyDoDeHieu(e: unknown): string {
  // Lỗi của MÃ (TypeError, ReferenceError…) luôn là kỹ thuật, dù câu có viết tiếng Việt.
  if (e instanceof Error && /^(TypeError|ReferenceError|SyntaxError|RangeError)$/.test(e.name)) return 'Mạng có thể đang chập chờn.'
  const chu = e instanceof Error ? e.message : typeof e === 'string' ? e : ''
  if (laLoiKyThuat(chu)) return 'Mạng có thể đang chập chờn.'
  const s = chu.trim()
  return /[.!?…]$/.test(s) ? s : `${s}.`
}

/** Một câu trọn cho dòng báo lỗi: "Chưa tải được <việc>. <lý do>" — `viec` viết thường, vd "danh sách học sinh". */
export function loiDeHieu(e: unknown, viec: string): string {
  return `Chưa tải được ${viec}. ${lyDoDeHieu(e)}`
}
