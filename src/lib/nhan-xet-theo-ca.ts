// NHẬN XÉT RIÊNG CHO TỪNG CA — thầy chốt 07/09: "làm nhận xét theo từng ca".
//
// ============================================================================
// VÌ SAO PHẢI THAY CÁI CŨ
// ============================================================================
// Khối VIỆC CẦN LÀM trước đây in đúng một đoạn cho MỌI em, MỌI ca:
//
//   "Thầy đã giao cho em tổng hợp bài tập để khắc phục điểm yếu của em. Hãy
//    luyện tập nghiêm túc để bản thân tiến bộ trong lần thi tới…"
//
// Đoạn đó là chữ thầy tự viết và vẫn giữ làm câu kết, nhưng đứng một mình thì
// nó vi phạm chính bộ quy tắc viết của thầy: điều 5 cấm nhận xét chung chung,
// điều 1 cấm câu rỗng. Phụ huynh đọc xong không biết con sai chỗ nào.
//
// ============================================================================
// BỐN PHẦN, ĐÚNG THỨ TỰ — quy tắc viết điều 23
// ============================================================================
//   1. Lỗi cụ thể, kèm NGÀY bài và SỐ CÂU SAI
//   2. Nguyên nhân: thiếu kiến thức nào, hay lỗi kỹ năng nào
//   3. Việc em phải làm, có SỐ LƯỢNG cụ thể
//   4. Mốc Thầy sẽ kiểm tra lại
//
// Thiếu phần nào thì phần đó BIẾN MẤT, không có câu độn thay chỗ.
//
// ============================================================================
// LUẬT KHÔNG BỊA
// ============================================================================
// Mọi con số trong đây phải đến từ bảng chấm của CHÍNH ca đó. Phần "nguyên
// nhân" lấy nguyên câu `soLieu` của bộ tín hiệu `phan-tich-lam-bai.ts` — bộ đó
// đã có luật cấm bịa và cấm gán tính cách, nên chép lại là kế thừa luôn cả hai.
// Không có tín hiệu kỹ năng nào thì nói thẳng là cách làm bài đều tay và chuyển
// nguyên nhân sang kiến thức, KHÔNG nặn ra một lời khuyên chung.
//
// Cấm dấu gạch ngang dài (quy tắc điều 13) và cấm emoji (điều 14).
import type { TinHieuLamBai } from './phan-tich-lam-bai'

/** Ngày dạng dd/m — đủ để phụ huynh biết bài nào, không dài dòng. */
function ngayGon(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getDate()).padStart(2, '0')}/${d.getMonth() + 1}`
}

export interface DuLieuNhanXetCa {
  /** Ngày em nộp bài. Rỗng thì bỏ luôn cụm ngày, không đoán. */
  ngay: string
  tenCa?: string
  soCauSai: number
  tongSoCau: number
  /** Chuyên đề CÓ CÂU SAI, đã xếp sai nhiều trước. Rỗng = không sai gì. */
  chuyenDeSai: { ten: string; soCau: number; soSai: number }[]
  /** Bộ tín hiệu của chính ca này. Phần 2 lấy từ đây. */
  tinHieu: TinHieuLamBai[]
  /** Số câu khắc phục ĐÃ kèm theo báo cáo. 0 = không kèm gì. */
  soCauChua: number
  /** Hạn nộp bài tập, khi thầy đã giao bài trong app. */
  hanNop?: string | null
  /** Xưng hô: `em` cho báo cáo học sinh, `con` cho phụ huynh. */
  xung?: 'em' | 'con'
}

/** Lời nhắn thầy tự viết 04-09. Giữ nguyên văn làm CÂU KẾT, không sửa chữ. */
export const LOI_KET_LUYEN_TAP =
  'Không ai có thể giúp em tiến bộ bằng chính em.'

/** PHẦN 1 — lỗi cụ thể, kèm ngày và số câu sai. */
export function phanLoiCuThe(d: DuLieuNhanXetCa): string {
  const xung = d.xung ?? 'em'
  const ngay = ngayGon(d.ngay)
  const bai = d.tenCa ? `Bài ${d.tenCa}` : 'Bài kiểm tra'
  const dau = ngay ? `${bai} ngày ${ngay}` : bai
  if (d.soCauSai <= 0) return `${dau}, ${xung} làm đúng cả ${d.tongSoCau} câu.`
  const yeu = d.chuyenDeSai[0]
  // Chỉ nêu chuyên đề khi nó thật sự nổi hơn phần còn lại; nêu bừa là gán cho
  // em một điểm yếu mà số liệu không đỡ.
  const neuYeu = yeu && yeu.soSai >= 2 ? `, mất điểm nhiều nhất ở ${yeu.ten} (sai ${yeu.soSai}/${yeu.soCau} câu)` : ''
  return `${dau}, ${xung} sai ${d.soCauSai}/${d.tongSoCau} câu${neuYeu}.`
}

/** Đổi xưng hô của câu mượn từ bộ tín hiệu.
 *
 * Bộ tín hiệu viết sẵn với "Em"; báo cáo phụ huynh gọi con là "con". Không đổi
 * thì một đoạn có cả "con sai 16/28 câu" lẫn "Em không điền gì ở 3/28 câu" —
 * đọc ra hai người. CHỈ đổi đại từ, tuyệt đối không viết lại phần số liệu. */
function doiXung(cau: string, xung: 'em' | 'con'): string {
  if (xung === 'em') return cau
  return cau.replace(/(^|[.;:]\s+)Em\b/g, '$1Con').replace(/\bcủa em\b/g, 'của con')
}

/** PHẦN 2 — nguyên nhân. Lấy nguyên câu số liệu của tín hiệu mạnh nhất. */
export function phanNguyenNhan(d: DuLieuNhanXetCa): string {
  const xung = d.xung ?? 'em'
  const t = d.tinHieu[0]
  if (!t) return ''
  if (t.ma === 'deu_tay') {
    const yeu = d.chuyenDeSai[0]
    // Chuyên đề đã nêu ở phần 1 rồi thì nói "chuyên đề đó", không lặp tên.
    const daNeu = Boolean(yeu && yeu.soSai >= 2)
    if (!yeu) return 'Cách làm bài không có gì phải chỉnh.'
    return daNeu
      ? 'Cách làm bài không có gì phải chỉnh, chỗ hổng nằm ở kiến thức chuyên đề đó.'
      : `Cách làm bài không có gì phải chỉnh, chỗ hổng nằm ở kiến thức ${yeu.ten}.`
  }
  return doiXung(t.soLieu, xung)
}

/** PHẦN 3 — việc phải làm, có số lượng. */
export function phanViecPhaiLam(d: DuLieuNhanXetCa): string {
  const xung = d.xung ?? 'em'
  if (d.soCauChua > 0) {
    return `${xung === 'em' ? 'Em' : 'Con'} làm ${d.soCauChua} câu khắc phục trong phiếu bài tập kèm đây.`
  }
  return ''
}

/** PHẦN 4 — mốc thầy kiểm lại.
 *
 * KHÔNG nhắc lại tên chuyên đề khi phần 1 đã nêu: nhắc ba lần trong bốn câu là
 * câu rỗng (quy tắc điều 1), và đoạn ngắn đọc thành lặp. */
export function phanMocKiemLai(d: DuLieuNhanXetCa): string {
  if (d.hanNop) {
    const h = ngayGon(d.hanNop)
    return h ? `Hạn nộp ${h}, Thầy chấm rồi báo lại kết quả.` : 'Thầy chấm bài đó rồi báo lại kết quả.'
  }
  if (d.soCauChua <= 0 && d.soCauSai <= 0) return ''
  const yeu = d.chuyenDeSai[0]
  const daNeuTen = Boolean(yeu && yeu.soSai >= 2)
  if (daNeuTen) return 'Buổi học tới Thầy kiểm lại riêng phần đó.'
  return yeu ? `Buổi học tới Thầy kiểm lại riêng phần ${yeu.ten}.` : 'Buổi học tới Thầy kiểm lại riêng phần này.'
}

/** NHẬN XÉT ĐẦY ĐỦ cho một ca. Ghép bốn phần, bỏ phần rỗng. */
export function nhanXetTheoCa(d: DuLieuNhanXetCa): string {
  const cau = [phanLoiCuThe(d), phanNguyenNhan(d), phanViecPhaiLam(d), phanMocKiemLai(d)].filter((x) => x.trim() !== '')
  // Câu kết của thầy đứng riêng một dòng, chỉ khi có việc phải làm — không thì
  // nó thành lời động viên treo lơ lửng sau một câu báo em làm đúng hết.
  const than = cau.join(' ')
  return d.soCauChua > 0 ? `${than}\n${LOI_KET_LUYEN_TAP}` : than
}

/** Đếm chữ, để test giữ đúng khung 60–120 chữ của quy tắc điều 22. */
export function demChu(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length
}
