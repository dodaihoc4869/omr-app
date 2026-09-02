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
  leaveCount: number // số lần rời app (tab ẩn / mất focus)
  totalHiddenMs: number // tổng thời gian app bị ẩn (cộng dồn)
  events: IntegrityEvent[]
  blocked: boolean // true = đã rời màn hình từ lần thứ 2 trở lên, bài bị khoá + tự nộp, đánh dấu nghi gian lận
}

export function emptyIntegrityLog(): IntegrityLog {
  return { leaveCount: 0, totalHiddenMs: 0, events: [], blocked: false }
}

export interface ExamAttempt {
  key: string // `${maCa}:${sbd}`
  maCa: string
  sbd: string
  maDe: string // giữ để hiển thị, không còn dùng để tra đáp án cố định theo vị trí
  startedAt: string // ISO — dùng để tính đồng hồ đếm ngược, không dùng setInterval cộng dồn
  durationMinutes: number
  answers: AnswerRecord
  integrity: IntegrityLog
  submitted: boolean
  submittedAt: string | null
  pendingSubmit: boolean // true = đã bấm Nộp nhưng chưa gửi được lên server (mất mạng)
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
