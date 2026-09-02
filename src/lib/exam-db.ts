// Lưu cấu hình + ngân hàng câu hỏi + tiến trình làm bài vào IndexedDB. Tiến
// trình làm bài LƯU THEO ID CÂU (không theo thứ tự đã xáo trên màn hình) —
// để mất mạng/refresh giữa chừng vẫn khôi phục đúng, và nộp bài lên server
// luôn ở dạng chấm được ngay (chấm lại chỉ cần chạy lại đúng thuật toán chọn
// câu từ (mãCa, sbd), không cần lưu thêm bộ câu đã gán cho từng em).
import { openDB, type IDBPDatabase } from 'idb'
import type { PublicExamBank, TeacherExamSource } from '../data/examContent'

export interface AnswerRecord {
  phanI: Record<string, 'A' | 'B' | 'C' | 'D'> // qid -> lựa chọn (đã quy về chữ cái GỐC, chưa xáo)
  phanII: Record<string, ('D' | 'S' | null)[]> // qid -> 4 giá trị theo ý a,b,c,d GỐC
  phanIII: Record<string, string> // qid -> đáp án gõ tay
}

export function emptyAnswerRecord(): AnswerRecord {
  return { phanI: {}, phanII: {}, phanIII: {} }
}

/** Bằng chứng rời app / có thể gian lận — KHÔNG thể phát hiện chụp ảnh màn hình bằng
 * JavaScript (không có API nào trên web làm được việc này, kể cả PWA), nên chỉ ghi lại
 * tín hiệu gần nhất có thể đo: số lần & tổng thời gian rời tab/app trong lúc làm bài. */
export interface IntegrityEvent {
  type: 'hidden' | 'visible' | 'blur' | 'focus'
  at: string // ISO timestamp
}
export interface IntegrityLog {
  leaveCount: number // số lần rời app (tab ẩn / mất focus) — cộng dồn cả lượt, kể cả sau khi thầy mở khoá
  totalHiddenMs: number // tổng thời gian app bị ẩn (cộng dồn)
  events: IntegrityEvent[]
  blocked: boolean // true = bài đang bị khoá (rời màn tới ngưỡng, hoặc một lần rời quá lâu) + đã tự nộp
  /** Vì sao khoá lần gần nhất (QUANLYCATHI mục 6). */
  lyDoKhoa?: 'qua_so_lan' | 'roi_qua_lau'
  /** leaveCount tại lần thầy mở khoá gần nhất — đếm ngưỡng lại từ mốc này. */
  mocMoKhoa?: number
  /** Số lần thầy đã mở khoá lượt này. */
  soLanMoKhoa?: number
}

export function emptyIntegrityLog(): IntegrityLog {
  return { leaveCount: 0, totalHiddenMs: 0, events: [], blocked: false }
}

export interface ExamAttempt {
  key: string // `${maCa}:${sbd}` — máy em chỉ giữ LƯỢT MỚI NHẤT; lịch sử các lượt nằm trên máy chủ (LuotThi)
  maCa: string
  sbd: string
  maDe: string // giữ để hiển thị, không còn dùng để tra đáp án cố định theo vị trí
  startedAt: string // ISO GIỜ MÁY CHỦ lúc em vào (vaoLuc) — không dùng setInterval cộng dồn
  durationMinutes: number
  /** ISO giờ máy chủ hết giờ làm bài (vaoLuc + thời lượng). Bản cũ không có → tính từ startedAt. */
  hetGioLuc?: string
  /** Lượt thứ mấy trong ca (thi lại = 2, 3…). Bản cũ không có → 1. */
  lanThu?: number
  idThietBi?: string
  /** Giây em dừng ở từng câu (qid → giây, cộng dồn theo thẻ câu đang chiếm màn) — QUANLYCATHI mục 5. */
  giayCau?: Record<string, number>
  /** Ngưỡng chống gian lận của ca (máy chủ trả lúc vào thi) — mục 6. */
  nguong?: { lan: number; giay: number }
  answers: AnswerRecord
  integrity: IntegrityLog
  submitted: boolean
  submittedAt: string | null
  pendingSubmit: boolean // true = đã bấm Nộp nhưng chưa gửi được lên server (mất mạng)
}

/** Mốc hết giờ của lượt (ISO): ưu tiên mốc máy chủ, bản cũ tính từ startedAt. */
export function hetGioCua(a: Pick<ExamAttempt, 'startedAt' | 'durationMinutes' | 'hetGioLuc'>): string {
  if (a.hetGioLuc) return a.hetGioLuc
  return new Date(new Date(a.startedAt).getTime() + a.durationMinutes * 60000).toISOString()
}

const DB_NAME = 'omr-exam'
const DB_VERSION = 2
const STORE_SETTINGS = 'settings'
const STORE_SOURCES = 'examSources'
const STORE_ATTEMPTS = 'attempts'
const STORE_SESSION_CACHE = 'sessionCache'
const STORE_SESSION_BANK_TEACHER = 'sessionBankTeacher'

async function getDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) db.createObjectStore(STORE_SETTINGS)
      }
      // v1 dùng object store tên khác cho nội dung đề/bài làm — xoá sạch làm lại vì
      // đổi hẳn shape dữ liệu (đề cố định theo vị trí -> ngân hàng câu random theo id).
      if (db.objectStoreNames.contains('examContents')) db.deleteObjectStore('examContents')
      if (db.objectStoreNames.contains('attempts')) db.deleteObjectStore('attempts')
      if (!db.objectStoreNames.contains(STORE_SOURCES)) db.createObjectStore(STORE_SOURCES, { keyPath: 'maDe' })
      if (!db.objectStoreNames.contains(STORE_ATTEMPTS)) db.createObjectStore(STORE_ATTEMPTS, { keyPath: 'key' })
      if (!db.objectStoreNames.contains(STORE_SESSION_CACHE)) db.createObjectStore(STORE_SESSION_CACHE)
      if (!db.objectStoreNames.contains(STORE_SESSION_BANK_TEACHER)) db.createObjectStore(STORE_SESSION_BANK_TEACHER)
    },
  })
}

export interface CachedSession {
  maCa: string
  lop: string
  thoiGianPhut: number
  bank: PublicExamBank
}

/** Cache đề đã tải về máy học sinh — để mất mạng giữa chừng vẫn mở lại làm tiếp được. */
export async function cacheSession(session: CachedSession): Promise<void> {
  const db = await getDb()
  await db.put(STORE_SESSION_CACHE, session, session.maCa)
}

export async function loadCachedSession(maCa: string): Promise<CachedSession | undefined> {
  const db = await getDb()
  return db.get(STORE_SESSION_CACHE, maCa)
}

/** Lưu lại (trên máy thầy) ngân hàng ĐẦY ĐỦ ĐÁP ÁN đã dùng để mở 1 ca — để màn Theo dõi
 * chấm lại được sau này mà không cần thầy nhớ đã chọn đúng những đề nào. */
export async function saveSessionTeacherBank(maCa: string, sources: TeacherExamSource[]): Promise<void> {
  const db = await getDb()
  await db.put(STORE_SESSION_BANK_TEACHER, sources, maCa)
}

export async function loadSessionTeacherBank(maCa: string): Promise<TeacherExamSource[] | undefined> {
  const db = await getDb()
  return db.get(STORE_SESSION_BANK_TEACHER, maCa)
}

export async function saveScriptUrl(url: string): Promise<void> {
  const db = await getDb()
  await db.put(STORE_SETTINGS, url, 'scriptUrl')
}

export async function loadScriptUrl(): Promise<string> {
  const db = await getDb()
  return (await db.get(STORE_SETTINGS, 'scriptUrl')) || ''
}

/** Link Apps Script cho MÁY HỌC SINH mở link ngắn /t/<mã ca> (không kèm
 * &api=...): thứ tự ưu tiên IndexedDB (đã lưu từ lần trước) → file
 * public/cau-hinh.json cùng thư mục app (do thầy push kèm code). Lấy được từ
 * file thì lưu lại để lần sau offline vẫn có. */
export async function loadScriptUrlHoacMacDinh(): Promise<string> {
  const daLuu = await loadScriptUrl()
  if (daLuu) return daLuu
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}cau-hinh.json`, { cache: 'no-cache' })
    if (!res.ok) return ''
    const cfg = (await res.json()) as { scriptUrl?: string }
    const url = (cfg.scriptUrl || '').trim()
    if (url) await saveScriptUrl(url)
    return url
  } catch {
    return ''
  }
}

/** Mã bí mật kho đề (khớp MA_BI_MAT trong Apps Script) — chỉ trên máy thầy. */
export async function saveTeacherSecret(secret: string): Promise<void> {
  const db = await getDb()
  await db.put(STORE_SETTINGS, secret, 'teacherSecret')
}

export async function loadTeacherSecret(): Promise<string> {
  const db = await getDb()
  return (await db.get(STORE_SETTINGS, 'teacherSecret')) || ''
}

/** Toàn bộ ngân hàng CÓ đáp án của các ca đã mở (để chấm lại khi thầy sửa
 * đáp án một câu trong ngân hàng — xem NganHangDeScreen). */
export async function loadAllSessionTeacherBanks(): Promise<{ maCa: string; sources: TeacherExamSource[] }[]> {
  const db = await getDb()
  const keys = (await db.getAllKeys(STORE_SESSION_BANK_TEACHER)) as string[]
  const out: { maCa: string; sources: TeacherExamSource[] }[] = []
  for (const k of keys) {
    const sources = (await db.get(STORE_SESSION_BANK_TEACHER, k)) as TeacherExamSource[] | undefined
    if (sources) out.push({ maCa: String(k), sources })
  }
  return out
}

export async function saveExamSource(source: TeacherExamSource): Promise<void> {
  const db = await getDb()
  await db.put(STORE_SOURCES, source)
}

export async function loadExamSources(): Promise<TeacherExamSource[]> {
  const db = await getDb()
  return db.getAll(STORE_SOURCES)
}

export async function deleteExamSource(maDe: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE_SOURCES, maDe)
}

export function attemptKey(maCa: string, sbd: string): string {
  return `${maCa}:${sbd}`
}

export async function saveAttempt(attempt: ExamAttempt): Promise<void> {
  const db = await getDb()
  await db.put(STORE_ATTEMPTS, attempt)
}

export async function loadAttempt(maCa: string, sbd: string): Promise<ExamAttempt | undefined> {
  const db = await getDb()
  return db.get(STORE_ATTEMPTS, attemptKey(maCa, sbd))
}

export async function listPendingAttempts(): Promise<ExamAttempt[]> {
  const db = await getDb()
  const all: ExamAttempt[] = await db.getAll(STORE_ATTEMPTS)
  return all.filter((a) => a.pendingSubmit)
}

// Lưu SĐT phụ huynh đã đăng ký trên CHÍNH máy này — mở lại app không cần
// đăng ký/nhập lại số để xem nhận xét, giống lưu link Apps Script.
export async function saveMyParentPhone(sdt: string): Promise<void> {
  const db = await getDb()
  await db.put(STORE_SETTINGS, sdt, 'myParentPhone')
}

export async function loadMyParentPhone(): Promise<string> {
  const db = await getDb()
  return (await db.get(STORE_SETTINGS, 'myParentPhone')) || ''
}

// Lưu SBD học sinh đã đăng ký hồ sơ trên CHÍNH máy này — mở lại app tự điền
// sẵn SBD lúc vào thi/nhắn tin, không phải gõ lại mỗi lần.
export async function saveMyStudentSbd(sbd: string): Promise<void> {
  const db = await getDb()
  await db.put(STORE_SETTINGS, sbd, 'myStudentSbd')
}

export async function loadMyStudentSbd(): Promise<string> {
  const db = await getDb()
  return (await db.get(STORE_SETTINGS, 'myStudentSbd')) || ''
}
