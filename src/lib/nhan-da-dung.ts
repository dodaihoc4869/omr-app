// NHÃN CÂU "ĐÃ LÀM ĐÚNG" / CÂU THAY — phần MÁY EM cần (in nhãn dưới số câu, tách nhãn thay, câu gốc, đọc bản đồ nhãn). Tách khỏi `rut-de-da-dung.ts`
// (21/10, luật tốc độ thầy 13/10): thẻ câu và màn thi chỉ cần mấy hàm nhỏ này, nhưng nhập từ `rut-de-da-dung` là kéo cả thuật toán rút đề của thầy
// (rut-de-da-dung + rut-de-v2 + ma trận 2026, ~50 KB mã gốc) vào gói MỞ của app học sinh và phụ huynh. `rut-de-da-dung.ts` xuất lại y nguyên các tên này.
/** Cách một câu trong đề thay cho câu em đã đúng: `thay_so` = bản đổi số (song sinh / biến thể bằng mã) · `cung_dang` = câu anh em (cùng dạng, nội dung khác). */
export type KieuThay = 'thay_so' | 'cung_dang'

/**
 * Nhãn HIỆN CHO EM của câu đã được thay — là CẢ CÂU (máy em in nguyên văn, không thêm "Em đã làm đúng:"):
 *   thay_so   → "Câu này thay số của câu em đã đúng ở Ca Kiểm tra tuần 3 · 28/09 · Thông hiểu"
 *   cung_dang → "Câu này thay cho câu em đã đúng ở … (cùng dạng bài, nội dung khác)" · câu lý thuyết: "Câu lý thuyết này thay cho câu em đã đúng ở …"
 * Vì sao cả câu nằm trong chuỗi nhãn: máy em đang cache bản cũ vẫn in được (thành "Em đã làm đúng: Câu này thay số của …" — dài nhưng đủ nghĩa, không mất nhãn);
 * không thêm khoá mới vào gói đề của em (đường `/vao-thi` giữ nguyên).
 */
export function nhanThay(kieu: KieuThay, lyThuyet: boolean, nhanGoc: string): string {
  const noi = String(nhanGoc ?? '').trim()
  const o = noi ? `ở ${noi}` : 'trước đây'
  if (kieu === 'thay_so') return `Câu này thay số của câu em đã đúng ${o}`
  return `${lyThuyet ? 'Câu lý thuyết này' : 'Câu này'} thay cho câu em đã đúng ${o} (cùng dạng bài, nội dung khác)`
}
const MAU_NHAN_THAY = /^Câu (?:lý thuyết )?này (?:thay số của|thay cho) câu em đã đúng /
/** Nhãn này là nhãn câu ĐÃ THAY (nhãn câu nguyên văn bắt đầu bằng tên nơi: "Ca …", "Chiến dịch …", "Ôn lại"… — không bao giờ bằng "Câu này"). */
export const laNhanThay = (nhan: unknown): boolean => typeof nhan === 'string' && MAU_NHAN_THAY.test(nhan.trim())

/** Chữ đầy đủ máy em in dưới số câu: câu nguyên văn "Em đã làm đúng: <nhãn>"; câu đã thay in đúng nhãn thay (xem `nhanThay`). */
export const chuNhanDaDung = (nhan: string): string => {
  const n = String(nhan ?? '').trim()
  return laNhanThay(n) ? n : `Em đã làm đúng: ${n}`
}
/** Dòng nhãn trong báo cáo cuối bài của thầy: "đã làm đúng: <nơi>" cho câu nguyên văn; câu đã thay in cả nhãn thay (nó đã nói nơi). */
export const chuNhanBaoCao = (nhan: string): string => {
  const n = String(nhan ?? '').trim()
  return laNhanThay(n) ? n : `đã làm đúng: ${n || 'không rõ nơi'}`
}

/** Nhãn câu thay TÁCH thành phần (đọc cả nhãn đã lưu ở ca cũ — định dạng `nhanThay` không đổi): `noi` = "nơi · dd/mm · mức", rỗng khi nhãn ghi "trước đây". Không phải nhãn thay ⇒ null. */
export interface NhanThayTach { kieu: KieuThay; lyThuyet: boolean; noi: string }
const TACH_NHAN_THAY = /^Câu (lý thuyết )?này (thay số của|thay cho) câu em đã đúng (?:ở (.+?)|trước đây)(?: \(cùng dạng bài, nội dung khác\))?$/
export function tachNhanThay(nhan: unknown): NhanThayTach | null {
  if (typeof nhan !== 'string') return null
  const m = TACH_NHAN_THAY.exec(nhan.trim())
  if (!m) return null
  const thaySo = m[2] === 'thay số của'
  return { kieu: thaySo ? 'thay_so' : 'cung_dang', lyThuyet: !!m[1], noi: (m[3] ?? '').trim() }
}
/**
 * Dòng ĐẬM NGẮN của ô ghi chú câu thay trên máy em (thầy 07/10: "rút gọn ý nghĩa của phần ghi chú"); nơi · ngày · mức đi dòng phụ bên dưới.
 * Chữ lưu trong ca (`nhanThay`) và báo cáo của thầy giữ nguyên câu đầy đủ — chỉ máy em hiện bản gọn.
 */
export function chuNganNhanThay(t: Pick<NhanThayTach, 'kieu' | 'lyThuyet'>): string {
  if (t.kieu === 'thay_so') return 'Thay số từ câu em đã đúng'
  return t.lyThuyet ? 'Thay cho câu lý thuyết em đã đúng' : 'Thay cho câu em đã đúng'
}

/**
 * CÂU GỐC của câu thay (thầy 07/10: nút "Xem câu gốc" để em đối chiếu kiến thức): máy thầy ghi vào CHÍNH bản đồ nhãn của em thêm khoá "~goc:<qid câu thay>" → qid câu gốc
 * em đã đúng. Không phải qid thật nên không bao giờ trùng một câu trong đề; máy chủ cất/cắt bản đồ này nguyên văn (không cần sửa đường cất), máy em cũ bỏ qua.
 * Chỉ MAPPING (qid → qid, vài chục byte một câu) — nội dung công khai của câu gốc máy em xin riêng ở `/hs/cau-goc`, không đi trong gói đề của cả lớp.
 */
export const TIEN_TO_GOC = '~goc:'
export const khoaGoc = (qidThay: string): string => `${TIEN_TO_GOC}${qidThay}`
export const laKhoaGoc = (khoa: string): boolean => khoa.startsWith(TIEN_TO_GOC)
/** qid câu gốc của câu thay `qidThay` trong bản đồ nhãn của em (thiếu ⇒ rỗng). */
export function gocCuaCauThay(daDung: Readonly<Record<string, string>> | null | undefined, qidThay: string): string {
  const v = daDung?.[khoaGoc(qidThay)]
  return typeof v === 'string' ? v.trim() : ''
}
/** Mọi qid câu gốc có trong bản đồ nhãn của em (không trùng) — máy chủ chỉ phát nội dung công khai cho đúng những qid này. */
export function cacCauGocCuaEm(daDung: Readonly<Record<string, unknown>> | null | undefined): string[] {
  const ra = new Set<string>()
  for (const [k, v] of Object.entries(daDung ?? {})) if (laKhoaGoc(k) && typeof v === 'string' && v.trim()) ra.add(v.trim())
  return [...ra]
}

/** Nhãn "đã làm đúng" của MỘT em, đọc phòng thủ: qid → nhãn (chuỗi ≤ 260 ký tự — nhãn câu đã thay là cả câu, xem `nhanThay`). */
export function daDungCuaEm(v: unknown): Record<string, string> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {}
  const ra: Record<string, string> = {}
  for (const [q, n] of Object.entries(v as Record<string, unknown>)) {
    const qid = String(q ?? '').trim()
    if (!qid || typeof n !== 'string' || !n.trim()) continue
    ra[qid] = n.trim().slice(0, 260) // nhãn câu thay là cả câu (nhãn nơi + lời giải thích) — dài hơn nhãn nơi cũ
  }
  return ra
}
