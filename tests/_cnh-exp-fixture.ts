// FIXTURE DÙNG CHUNG cho bộ test RUNTIME D1 của P07 (EXP) — trích NGUYÊN cách nạp lược đồ + gieo
// dữ liệu TỔNG HỢP của `d1-runtime-exp-submit.test.ts` để test ADAPTER (Lát 1) không lệch cách dựng.
//
// ⚠️ KHÔNG phải production: workerd cục bộ (Miniflare) + binding D1 cục bộ (`wrangler.d1-test.toml`),
// dữ liệu TỔNG HỢP, KHÔNG deploy, KHÔNG credential, KHÔNG dữ liệu thật.
import { env } from 'cloudflare:test'
import { capDieuKhienNopBai, PHIEN_BAN_CHINH_SACH } from '../server/src/cnh-exp-submit'
import { phatAnhChup, type AnhChupNhiemVu } from '../server/src/cnh-exp-task'
import type { Env } from '../server/src/kieu'

export const ENV = env as unknown as Env
export const DB = ENV.DB

let dem = 0
/** Tên duy nhất cho mỗi test (student_id/attempt_id TỔNG HỢP, không đụng nhau). */
export const maMoi = (): string => `T${Date.now().toString(36)}-${(dem++).toString(36)}`
export const sbdMoi = (): string => `S-${maMoi()}`
export const attemptMoi = (): string => `A-${maMoi()}`

/** Tách một tệp SQL thành các CÂU LỆNH riêng (bỏ chú thích) — CHỈ dùng cho LƯỢC ĐỒ, không cho trigger. */
export function tachCau(sql: string): string[] {
  const sach = sql
    .replace(/\/\*[\s\S]*?\*\//g, '\n')
    .split('\n')
    .filter((l) => !/^\s*--/.test(l))
    .map((l) => l.replace(/\s--.*$/, ''))
    .join('\n')
  return sach
    .split(/;\s*(?:\n|$)/)
    .map((s) => s.trim())
    .filter((s) => /[A-Za-z]/.test(s))
}

/** Chọn ĐÚNG MỘT migration P07 theo dấu hiệu (fail nếu 0 hoặc >1). */
function chonMigration(ds: string[], dau: RegExp, ten: string): string {
  const hit = ds.filter((s) => dau.test(s))
  if (hit.length !== 1) throw new Error(`cần ĐÚNG MỘT migration ${ten}, thấy ${hit.length}`)
  return hit[0]
}

/** Nạp lược đồ P07 (sổ cái + nhiệm vụ + nộp bài) vào D1 thật. Idempotent nhờ IF NOT EXISTS. */
export async function napLuocDo(): Promise<void> {
  const ds = (env as unknown as { LUOC_DO_SQL: string[] }).LUOC_DO_SQL
  const soCai = chonMigration(ds, /CREATE TABLE IF NOT EXISTS\s+cnh_exp_account/i, 'cnh_exp_account')
  const nhiemVu = chonMigration(ds, /CREATE TABLE IF NOT EXISTS\s+cnh_exp_task/i, 'cnh_exp_task')
  const nopBai = chonMigration(ds, /CREATE TABLE IF NOT EXISTS\s+cnh_exp_attempt_control/i, 'cnh_exp_attempt_control')
  for (const sql of [soCai, nhiemVu, nopBai]) {
    const cau = tachCau(sql)
    for (let i = 0; i < cau.length; i += 50) {
      await DB.batch(cau.slice(i, i + 50).map((c) => DB.prepare(c)))
    }
  }
}

/** Ảnh chụp TỔNG HỢP hợp lệ cho một (student, attempt, contentGroup). */
export function anhChup(
  studentId: string,
  attemptId: string,
  contentGroup: string,
  opts: { taskId?: string; part?: 'I' | 'II' | 'III'; difficulty?: 0 | 1 | 2; issuedAt?: number; expiresAt?: number } = {},
): AnhChupNhiemVu {
  const part = opts.part ?? 'I'
  const material =
    part === 'II'
      ? {
          key: [
            { id: 'a', correct: true, skillIds: ['SK1'] },
            { id: 'b', correct: false, skillIds: ['SK1'] },
            { id: 'c', correct: true, skillIds: ['SK2'] },
            { id: 'd', correct: false, skillIds: ['SK2'] },
          ],
          orderMapping: { '1': 'a', '2': 'b', '3': 'c', '4': 'd' },
          gradingPolicy: { kind: 'part-ii-subitems-v1' },
        }
      : {
          key: 'C',
          orderMapping: { A: 'A', B: 'B', C: 'C', D: 'D' },
          gradingPolicy: { kind: 'part-i-option-id-v1' },
        }
  return {
    taskId: opts.taskId ?? attemptId,
    attemptId,
    studentId,
    qid: `Q-${attemptId}`,
    questionVersion: 'v1',
    contentGroup,
    familyId: null,
    skillIds: ['SK1'],
    difficulty: opts.difficulty ?? 1,
    part,
    purpose: 'maintenance',
    bucket: 'core',
    planId: 'P1',
    planRevision: 1,
    policy: { version: 'CNH-1.0', curriculumRevision: 1, bankRevision: 1, protectionRevision: 1, learnerRevision: 1 },
    issuedAt: opts.issuedAt ?? 1000,
    expiresAt: opts.expiresAt ?? 10_000_000_000,
    expectedSeconds: 60,
    grading: material,
  }
}

/** Tạo hàng tài khoản + hàng ngày TỔNG HỢP cho một student_id mới. */
export async function gieoHocSinh(
  studentId: string,
  learningDay: string,
  opts: { wallet?: number; earned?: number; rawCore?: number; achieved?: 0 | 1; corePaid?: number; compensationPaid?: number } = {},
): Promise<void> {
  await DB.batch([
    DB.prepare(`INSERT INTO cnh_exp_account (student_id, wallet_exp, earned_exp, revision) VALUES (?, ?, ?, 0)`).bind(
      studentId,
      opts.wallet ?? 0,
      opts.earned ?? 0,
    ),
    DB.prepare(
      `INSERT INTO cnh_exp_day
         (student_id, learning_day, policy_version, raw_core, achieved, core_paid, compensation_paid, revision)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    ).bind(studentId, learningDay, PHIEN_BAN_CHINH_SACH, opts.rawCore ?? 0, opts.achieved ?? 0, opts.corePaid ?? 0, opts.compensationPaid ?? 0),
  ])
}

/** Phát ảnh chụp + cấp điều khiển cho MỘT attempt TỔNG HỢP. */
export async function gieoAttempt(
  studentId: string,
  attemptId: string,
  contentGroup: string,
  opts: { part?: 'I' | 'II' | 'III'; difficulty?: 0 | 1 | 2; assistance?: 'none' | 'assisted' | 'unknown'; released?: boolean; active?: boolean; issuedAt?: number; expiresAt?: number } = {},
): Promise<void> {
  await phatAnhChup(DB, anhChup(studentId, attemptId, contentGroup, opts), 900)
  await capDieuKhienNopBai(DB, {
    studentId,
    attemptId,
    assistance: opts.assistance ?? 'none',
    released: opts.released ?? true,
    active: opts.active ?? true,
  })
}
