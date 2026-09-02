// Gọi Apps Script Web App (doGet/doPost trong docs/apps-script-kiem-tra.gs).
// Dùng Content-Type: text/plain cho POST để tránh trình duyệt gửi preflight
// OPTIONS — Apps Script Web App không xử lý OPTIONS, preflight sẽ lỗi CORS
// nếu dùng application/json.
import type { PublicExamBank, TeacherExamSource } from '../data/examContent'
import type { AnswerRecord, IntegrityLog } from './exam-db'

/** Ngân hàng gộp CÓ đáp án (chỉ dùng nội bộ cho tính năng "xem điểm ngay"). */
export interface KeyBank {
  phanI: TeacherExamSource['phanI']
  phanII: TeacherExamSource['phanII']
  phanIII: TeacherExamSource['phanIII']
}

export interface SessionConfig {
  found: boolean
  maCa?: string
  lop?: string
  thoiGianPhut?: number
  bank?: PublicExamBank
}

async function postJson(scriptUrl: string, body: unknown): Promise<any> {
  const res = await fetch(scriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  return res.json()
}

export async function publishSession(
  scriptUrl: string,
  maCa: string,
  lop: string,
  thoiGianPhut: number,
  bank: PublicExamBank,
  // Bật thì gửi kèm keyBank (CÓ đáp án) lên server — server chỉ trả lại đúng
  // 1 lần trong response của chính lần nộp bài của từng em (xem submitAnswers),
  // không có cách nào lấy đáp án trước khi nộp. Thầy tự cân nhắc bật/tắt vì
  // đây là đánh đổi với rủi ro lộ đề giữa các em thi cùng ca.
  immediateFeedback?: boolean,
  keyBank?: KeyBank,
): Promise<void> {
  const result = await postJson(scriptUrl, { action: 'publish', maCa, lop, thoiGianPhut, bank, immediateFeedback, keyBank })
  if (!result.ok) throw new Error(result.error || 'Mở ca kiểm tra thất bại')
}

export async function fetchSession(scriptUrl: string, maCa: string): Promise<SessionConfig> {
  const url = `${scriptUrl}?action=session&maCa=${encodeURIComponent(maCa)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  return res.json()
}

export async function submitAnswers(
  scriptUrl: string,
  maCa: string,
  sbd: string,
  maDe: string,
  dapAn: AnswerRecord,
  integrity: IntegrityLog,
): Promise<{ keyBank: KeyBank | null }> {
  const result = await postJson(scriptUrl, { action: 'submit', maCa, sbd, maDe, dapAn, integrity })
  if (!result.ok) throw new Error(result.error || 'Nộp bài thất bại')
  return { keyBank: result.keyBank ?? null }
}

export interface SubmissionRow {
  sbd: string
  maDe: string
  thoiGianNop: string
  dapAn: AnswerRecord
  integrity?: IntegrityLog
}

export async function listSubmissions(scriptUrl: string, maCa: string): Promise<SubmissionRow[]> {
  const url = `${scriptUrl}?action=listSubmissions&maCa=${encodeURIComponent(maCa)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  const data = await res.json()
  return data.rows || []
}

// ============================================================================
// PHỤ HUYNH — đăng ký, xem nhận xét sau khi nộp, theo dõi làm bài thời gian thực
// ============================================================================

export async function registerParent(
  scriptUrl: string,
  sdt: string,
  hoTenPhuHuynh: string,
  sbd: string,
  lop: string,
  hoTenHocSinh: string,
): Promise<void> {
  const result = await postJson(scriptUrl, { action: 'registerParent', sdt, hoTenPhuHuynh, sbd, lop, hoTenHocSinh })
  if (!result.ok) throw new Error(result.error || 'Đăng ký thất bại')
}

export interface ParentFeedbackItem {
  maCa: string
  maDe: string
  thoiGianNop: string
  diem: number
  xepLoai: string
  cauSai: string // JSON stringify {phanI:number[], phanII:number[], phanIII:number[]}
}

export interface ParentFeedbackResult {
  found: boolean
  hoTenPhuHuynh?: string
  sbd?: string
  lop?: string
  hoTenHocSinh?: string
  items?: ParentFeedbackItem[]
}

export async function fetchParentFeedback(scriptUrl: string, sdt: string): Promise<ParentFeedbackResult> {
  const url = `${scriptUrl}?action=parentFeedback&sdt=${encodeURIComponent(sdt)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  return res.json()
}

export async function sendParentFeedback(
  scriptUrl: string,
  sbd: string,
  maCa: string,
  maDe: string,
  thoiGianNop: string,
  diem: number,
  xepLoai: string,
  cauSai: { phanI: number[]; phanII: number[]; phanIII: number[] },
): Promise<void> {
  const result = await postJson(scriptUrl, { action: 'sendFeedback', sbd, maCa, maDe, thoiGianNop, diem, xepLoai, cauSai })
  if (!result.ok) throw new Error(result.error || 'Gửi nhận xét thất bại')
}

/** Học sinh tự động gửi lên định kỳ trong lúc làm bài + ngay mỗi lần rời màn
 * hình, để phụ huynh xem gần-thời-gian-thực và nhận cảnh báo rời màn hình
 * sớm nhất có thể (không phải push thật, phụ huynh tự poll lại). */
export async function pushExamStatus(
  scriptUrl: string,
  status: {
    sbd: string
    maCa: string
    lop: string
    dangLam: boolean
    batDauLuc: string
    daLamCauHoi: number
    tongCauHoi: number
    soLanRoiApp: number
    blocked: boolean
  },
): Promise<void> {
  try {
    await postJson(scriptUrl, { action: 'examStatus', ...status })
  } catch {
    // Cập nhật trạng thái theo dõi không phải luồng chính — mất mạng thì bỏ
    // qua, không chặn học sinh làm bài, lần đẩy tiếp theo sẽ tự bù.
  }
}

export interface ParentStatus {
  found: boolean
  hoTenHocSinh?: string
  sbd?: string
  status: {
    maCa: string
    lop: string
    dangLam: boolean
    batDauLuc: string
    daLamCauHoi: number
    tongCauHoi: number
    soLanRoiApp: number
    blocked: boolean
    capNhatLuc: string
  } | null
}

export async function fetchParentStatus(scriptUrl: string, sdt: string): Promise<ParentStatus> {
  const url = `${scriptUrl}?action=parentStatus&sdt=${encodeURIComponent(sdt)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  return res.json()
}

// ============================================================================
// TIN NHẮN PHỤ HUYNH ↔ THẦY — phụ huynh nhắn trực tiếp, thầy xem trong app
// ============================================================================

export async function sendParentMessage(
  scriptUrl: string,
  sdt: string,
  hoTenPhuHuynh: string,
  sbd: string,
  lop: string,
  hoTenHocSinh: string,
  noiDung: string,
): Promise<void> {
  const result = await postJson(scriptUrl, { action: 'sendMessage', sdt, hoTenPhuHuynh, sbd, lop, hoTenHocSinh, noiDung })
  if (!result.ok) throw new Error(result.error || 'Gửi tin nhắn thất bại')
}

export interface ParentMessage {
  id: string
  sdt: string
  hoTenPhuHuynh: string
  sbd: string
  lop: string
  hoTenHocSinh: string
  noiDung: string
  thoiGian: string
  daDoc: boolean
}

export async function listParentMessages(scriptUrl: string): Promise<ParentMessage[]> {
  const url = `${scriptUrl}?action=listMessages`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  const data = await res.json()
  return data.items || []
}

export async function markMessagesRead(scriptUrl: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const result = await postJson(scriptUrl, { action: 'markMessagesRead', ids })
  if (!result.ok) throw new Error(result.error || 'Đánh dấu đã đọc thất bại')
}
