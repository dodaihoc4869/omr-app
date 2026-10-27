// GỢI Ý RIÊNG CỦA CÂU sau lần sửa sai đầu (chữa câu gọn — chua-gon-lenh.ts). Thầy 27/10: lời khuyên chung chung («Em đọc lại đề, gạch chân điều đề hỏi
// rồi loại từng phương án») là VÔ NGHĨA ⇒ bỏ hẳn. Chỉ lấy điều riêng của câu, theo thứ tự:
//   1. (nơi gọi) bước 1 bài luyện từng bước thầy đã duyệt;
//   2. VẾ ĐẦU của bước 1 lời giải kho (`buoc[0]`) — ví dụ «Tính số mol ester: 8,8 : 88 = 0,1 mol»;
//   3. VẾ ĐẦU của ô Kiến thức cốt lõi (`chot`).
// «Vế đầu» = phần trước dấu suy ra đầu tiên (⇒, →, ;) — chỉ là bước khởi đầu, không phải cả lời giải. Vế nào LỘ ĐÁP ÁN thì bỏ (chữ «đáp án», «chọn B»,
// chữ / số của phương án đúng mà đề không có, đáp số Phần III). Phần II (Đúng–sai): lời giải nói thẳng ý nào đúng ⇒ không lấy từ lời giải.
// Không có gì an toàn ⇒ null ⇒ KHÔNG hiện dòng Gợi ý. Hàm thuần — test: tests/goi-y-rieng-2710.test.ts.
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'

type CauGoiY = Pick<PrivateQuestion, 'phan' | 'correct' | 'choices' | 'text' | 'solution'>

const TRAN = 160
const so = (s: string): string[] => s.match(/-?\d+(?:[.,]\d+)?/g)?.map((x) => x.replace('.', ',')) ?? []
const gon = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').replace(/[.。]+$/, '').trim()

function docLoiGiai(sol: unknown): { buoc: string[]; chot: string } {
  let o: unknown = sol
  if (typeof o === 'string') { try { o = JSON.parse(o) } catch { return { buoc: [], chot: '' } } }
  if (!o || typeof o !== 'object') return { buoc: [], chot: '' }
  const r = o as Record<string, unknown>
  const buoc = Array.isArray(r.buoc) ? r.buoc.map((b) => (typeof b === 'string' ? b : b && typeof b === 'object' ? String((b as Record<string, unknown>).noiDung ?? '') : '').trim()).filter(Boolean) : []
  const c = r.chot ?? r.kienThucCotLoi ?? r.kien_thuc_cot_loi
  return { buoc, chot: typeof c === 'string' && !c.includes('[object Object]') ? c.trim() : '' }
}

/** Câu `chu` có lộ đáp án của `q` không. */
export function loDapAn(chu: string, q: CauGoiY): boolean {
  if (/đáp án|đáp số|chọn\s+(?:phương án\s+)?[A-D]\b|\b[A-D]\s*(?:là|đúng)\b|[⇒→]\s*[A-D]\b|kết quả/i.test(chu)) return true
  const deSo = new Set(so(q.text ?? ''))
  const soLo = (dich: string) => so(dich).filter((x) => !deSo.has(x) && x !== '0' && x !== '1')
  const coSo = (xs: string[]) => { const cs = new Set(so(chu)); return xs.some((x) => cs.has(x)) }
  if (q.phan === 'I') {
    const i = 'ABCD'.indexOf(String(q.correct ?? '').trim().toUpperCase())
    const pa = i >= 0 ? String(q.choices?.[i] ?? '') : ''
    if (gon(pa).length >= 3 && gon(chu).includes(gon(pa))) return true
    if (coSo(soLo(pa))) return true
  }
  if (q.phan === 'III') {
    const d = String(q.correct ?? '').trim()
    if (d && coSo(so(d))) return true
  }
  return false
}

/** Vế đầu của một dòng lời giải (trước ⇒ / → / ;), bỏ ngoặc kết; quá dài ⇒ cắt ở dấu phẩy gần trần. */
function veDau(s: string): string {
  let v = s.split(/\s*(?:⇒|=>|→|;|\n)\s*/)[0]!.trim().replace(/[,:]$/, '')
  if (v.length > TRAN) { const k = v.lastIndexOf(',', TRAN); v = (k > 40 ? v.slice(0, k) : v.slice(0, TRAN)).trim() + '…' }
  return v
}

/** Gợi ý riêng từ lời giải kho; không có vế nào an toàn ⇒ null. */
export function goiYTuLoiGiai(q: CauGoiY): string | null {
  if (q.phan === 'II') return null
  const { buoc, chot } = docLoiGiai(q.solution)
  for (const nguon of [buoc[0] ?? '', chot]) {
    const v = nguon ? veDau(nguon) : ''
    if (v.length >= 8 && !loDapAn(v, q)) return v
  }
  return null
}
