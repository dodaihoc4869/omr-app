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

/** Cách công bố điểm cho học sinh của 1 ca:
 * - khong: không công bố trên máy em — thầy chấm ở màn Theo dõi rồi gửi nhận xét.
 * - ngay: server trả keyBank (CÓ đáp án) ĐÚNG 1 LẦN trong response lần nộp của
 *   chính em đó (submitAnswers) — không có cách lấy đáp án trước khi nộp.
 * - ca_lop_xong: em nộp xong chỉ thấy "đang chờ cả lớp"; app tự hỏi lại
 *   (fetchKetQua) và server chỉ trả keyBank khi MỌI em đã vào thi đều đã nộp,
 *   hoặc mọi em đều đã hết giờ — tránh em nộp sớm đọc đáp án cho em đang làm.
 * Hai chế độ sau đều gửi keyBank lên máy chủ — thầy tự cân nhắc. */
export type CongBoDiem = 'khong' | 'ngay' | 'ca_lop_xong'

export async function publishSession(
  scriptUrl: string,
  maCa: string,
  lop: string,
  thoiGianPhut: number,
  bank: PublicExamBank,
  congBoDiem: CongBoDiem = 'khong',
  keyBank?: KeyBank,
): Promise<void> {
  const result = await postJson(scriptUrl, {
    action: 'publish',
    maCa,
    lop,
    thoiGianPhut,
    bank,
    // Cột ImmediateFeedback trên sheet: 'true' | 'false' | 'calop' (bản cũ chỉ có true/false).
    immediateFeedback: congBoDiem === 'ngay' ? true : congBoDiem === 'ca_lop_xong' ? 'calop' : false,
    keyBank: congBoDiem === 'khong' ? undefined : keyBank,
  })
  if (!result.ok) throw new Error(result.error || 'Mở ca kiểm tra thất bại')
}

/** Kết quả hỏi lại sau khi nộp (chế độ ca_lop_xong, hoặc mở lại app sau khi
 * đã nộp): sanSang=true kèm keyBank khi đã được phép xem. */
export interface KetQuaCongBo {
  congBo: CongBoDiem
  sanSang: boolean
  daNop: number
  daVao: number
  keyBank: KeyBank | null
}

export async function fetchKetQua(scriptUrl: string, maCa: string, sbd: string): Promise<KetQuaCongBo> {
  const url = `${scriptUrl}?action=ketQua&maCa=${encodeURIComponent(maCa)}&sbd=${encodeURIComponent(sbd)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  const r = await res.json()
  if (!r.ok) throw new Error(r.error || 'Không hỏi được kết quả')
  return { congBo: r.congBo, sanSang: !!r.sanSang, daNop: r.daNop ?? 0, daVao: r.daVao ?? 0, keyBank: r.keyBank ?? null }
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
): Promise<{ keyBank: KeyBank | null; congBo: CongBoDiem }> {
  const result = await postJson(scriptUrl, { action: 'submit', maCa, sbd, maDe, dapAn, integrity })
  if (!result.ok) throw new Error(result.error || 'Nộp bài thất bại')
  return { keyBank: result.keyBank ?? null, congBo: result.congBo ?? (result.keyBank ? 'ngay' : 'khong') }
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

/** Xoá đăng ký phụ huynh (theo SĐT) — dùng khi đăng ký nhầm, cho đăng ký lại từ đầu. */
export async function deleteParentRegistration(scriptUrl: string, sdt: string): Promise<void> {
  const result = await postJson(scriptUrl, { action: 'deleteParent', sdt })
  if (!result.ok) throw new Error(result.error || 'Xoá đăng ký thất bại')
}

// ============================================================================
// HỌC SINH — đăng ký hồ sơ 1 lần (SBD + họ tên + năm sinh), dùng để tự điền
// sẵn SBD lúc vào thi và để nhắn tin cho thầy có tên hiển thị rõ ràng.
// ============================================================================

export async function registerStudent(scriptUrl: string, sbd: string, hoTen: string, namSinh: string, lop: string): Promise<void> {
  const result = await postJson(scriptUrl, { action: 'registerStudent', sbd, hoTen, namSinh, lop })
  if (!result.ok) throw new Error(result.error || 'Đăng ký thất bại')
}

export interface StudentProfile {
  found: boolean
  sbd?: string
  hoTen?: string
  namSinh?: string
  lop?: string
}

export async function fetchStudentProfile(scriptUrl: string, sbd: string): Promise<StudentProfile> {
  const url = `${scriptUrl}?action=studentProfile&sbd=${encodeURIComponent(sbd)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  return res.json()
}

/** Xoá đăng ký hồ sơ học sinh (theo SBD) — dùng khi đăng ký nhầm, cho đăng ký lại từ đầu. */
export async function deleteStudentRegistration(scriptUrl: string, sbd: string): Promise<void> {
  const result = await postJson(scriptUrl, { action: 'deleteStudent', sbd })
  if (!result.ok) throw new Error(result.error || 'Xoá đăng ký thất bại')
}

// ============================================================================
// TIN NHẮN PHỤ HUYNH/HỌC SINH ↔ THẦY — nhắn trực tiếp qua app, thầy xem chung 1 hộp thư
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
  const result = await postJson(scriptUrl, {
    action: 'sendMessage',
    sdt,
    hoTenPhuHuynh,
    sbd,
    lop,
    hoTenHocSinh,
    noiDung,
    nguoiGui: 'phuhuynh',
  })
  if (!result.ok) throw new Error(result.error || 'Gửi tin nhắn thất bại')
}

/** Học sinh nhắn tin cho thầy — hiển thị tên theo đúng cấu trúc hồ sơ đã đăng
 * ký ("Năm sinh - Họ Tên Học Sinh"), để thầy phân biệt được với tin nhắn phụ huynh. */
export async function sendStudentMessage(scriptUrl: string, sbd: string, hoTenHienThi: string, lop: string, noiDung: string): Promise<void> {
  const result = await postJson(scriptUrl, {
    action: 'sendMessage',
    sdt: '',
    hoTenPhuHuynh: '',
    sbd,
    lop,
    hoTenHocSinh: hoTenHienThi,
    noiDung,
    nguoiGui: 'hocsinh',
  })
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
  nguoiGui: 'phuhuynh' | 'hocsinh'
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

// ============================================================================
// TIN NHẮN THẦY → PHỤ HUYNH/HỌC SINH (chiều ngược lại) — thầy chọn đúng 1 em
// theo SBD (không suy đoán/khớp mờ tên) rồi gửi, phụ huynh/học sinh của em đó
// tự poll lại thấy tin.
// ============================================================================

export async function sendTeacherMessage(scriptUrl: string, sbd: string, noiDung: string): Promise<void> {
  const result = await postJson(scriptUrl, { action: 'sendTeacherMessage', sbd, noiDung })
  if (!result.ok) throw new Error(result.error || 'Gửi tin nhắn thất bại')
}

export interface TeacherMessage {
  id: string
  sbd: string
  noiDung: string
  thoiGian: string
  daXem: boolean
}

export async function fetchParentInbox(scriptUrl: string, sdt: string): Promise<{ found: boolean; items: TeacherMessage[] }> {
  const url = `${scriptUrl}?action=parentInbox&sdt=${encodeURIComponent(sdt)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  return res.json()
}

export async function fetchStudentInbox(scriptUrl: string, sbd: string): Promise<{ found: boolean; items: TeacherMessage[] }> {
  const url = `${scriptUrl}?action=studentInbox&sbd=${encodeURIComponent(sbd)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  return res.json()
}

export async function markTeacherMessagesRead(scriptUrl: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const result = await postJson(scriptUrl, { action: 'markTeacherMessagesRead', ids })
  if (!result.ok) throw new Error(result.error || 'Đánh dấu đã đọc thất bại')
}

// ============================================================================
// QUẢN LÝ ĐĂNG KÝ (chỉ thầy dùng) — xem + xoá phụ huynh/học sinh đã đăng ký.
// Phụ huynh/học sinh KHÔNG có nút tự xoá trong app của họ — đăng ký xong là
// cố định, chỉ thầy xoá được ở màn này để cho đăng ký lại.
// ============================================================================

export interface RegisteredParent {
  sdt: string
  hoTenPhuHuynh: string
  sbd: string
  lop: string
  hoTenHocSinh: string
  dangKyLuc: string
}

export async function listRegisteredParents(scriptUrl: string): Promise<RegisteredParent[]> {
  const url = `${scriptUrl}?action=listParents`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  const data = await res.json()
  return data.items || []
}

export interface RegisteredStudent {
  sbd: string
  hoTen: string
  namSinh: string
  lop: string
  dangKyLuc: string
}

export async function listRegisteredStudents(scriptUrl: string): Promise<RegisteredStudent[]> {
  const url = `${scriptUrl}?action=listStudents`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  const data = await res.json()
  return data.items || []
}

export interface FeedbackSummary {
  sbd: string
  maCa: string
  maDe: string
  thoiGianNop: string
  diem: number
  xepLoai: string
}

/** Toàn bộ điểm đã chấm — dùng để thầy tra nhanh theo tên rồi gửi lại cho phụ huynh. */
export async function listAllFeedback(scriptUrl: string): Promise<FeedbackSummary[]> {
  const url = `${scriptUrl}?action=listAllFeedback`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  const data = await res.json()
  return data.items || []
}

// ---------------------------------------------------------------------------
// KHO ĐỀ trên Apps Script (NAPDETUDONG.md, hướng A): pipeline "Nạp đề mới"
// đẩy đề đầy đủ (đáp án + lời giải + ảnh) lên đây bằng MÃ BÍ MẬT; app trên
// máy thầy tự tải về ngân hàng. Mã bí mật thầy nhập 1 lần, lưu IndexedDB máy
// thầy (không nhúng trong code). Tất cả đi qua POST để mã không lọt vào URL.
// ---------------------------------------------------------------------------
export interface KhoDeItem {
  maDe: string
  nguon: string
  ngayNap: string
  soCau: number
  soNghi: number
  capNhatLuc: string
}

export async function danhSachDe(scriptUrl: string, secret: string): Promise<KhoDeItem[]> {
  const r = await postJson(scriptUrl, { action: 'danhSachDe', secret })
  if (!r.ok) throw new Error(r.error || 'Không lấy được danh sách đề')
  return (r.items as KhoDeItem[]).map((x) => ({ ...x, maDe: String(x.maDe), ngayNap: String(x.ngayNap ?? ''), nguon: String(x.nguon ?? '') }))
}

/** Trả về JSON đề nguyên dạng pipeline đã đẩy (khuôn KhoDeJson, xem exam-kho-de-import.ts). */
export async function layDe(scriptUrl: string, secret: string, maDe: string): Promise<unknown> {
  const r = await postJson(scriptUrl, { action: 'layDe', secret, maDe })
  if (!r.ok) throw new Error(r.error || `Không lấy được đề ${maDe}`)
  return r.de
}

export async function luuDe(scriptUrl: string, secret: string, de: unknown): Promise<{ maDe: string; soCau: number; soNghi: number }> {
  const r = await postJson(scriptUrl, { action: 'luuDe', secret, de })
  if (!r.ok) throw new Error(r.error || 'Đẩy đề thất bại')
  return { maDe: String(r.maDe), soCau: Number(r.soCau), soNghi: Number(r.soNghi) }
}

export async function xoaDe(scriptUrl: string, secret: string, maDe: string): Promise<void> {
  const r = await postJson(scriptUrl, { action: 'xoaDe', secret, maDe })
  if (!r.ok) throw new Error(r.error || 'Xoá đề thất bại')
}
