// CNH-1.0 P07 — ATOMIC RELEASED-CORE ATTEMPT SUBMISSION VERTICAL (internal, server-only, NOT activated).
//
// ⚠️ SCOPE: this module settles ONE released CORE attempt submission end-to-end, atomically:
//   validate identity → read the IMMUTABLE snapshot → grade → price → settle entitlement →
//   write accepted event + academic lock + day + wallet + grant ledger + receipt, ALL IN ONE BATCH.
//
// It is NOT an HTTP route, NOT a cutover, and does NOT wire optional pricing, embargo/release,
// correction, rollover, rubric, or legacy migration. Those are SEPARATE jobs.
//
// ⚠️ AUTHORITY: `cnh_exp_account` is intended to become the SINGLE wallet authority. Until the
// cutover adapter exists, the legacy cron/SUM(ledger) path MUST NOT run alongside this table.
//
// Reuse (no reimplementation):
//   * `docAnhChup` (cnh-exp-task.ts) — verified immutable snapshot read (hash + indexed columns).
//   * `gradeFromSnapshot` (cnh-exp-grade.ts) — pure grading from pinned material.
//   * `giaCoreRaw` / `quyenCore` (cnh-exp-policy.ts) — pure pricing + entitlement.
//   * The CAS + CHECK-guard transaction shape proven in cnh-exp-ledger.ts (04 §5).
//
// Transaction shape (04 §5), ONE batch, ONE primary session:
//   1. Read receipt by idempotency key: same hash ⇒ replay the EXACT stored response; different
//      hash ⇒ IDEMPOTENCY_CONFLICT.
//   2. Read the accepted event for this attempt: same answer hash ⇒ replay the ORIGINAL result
//      (independent of a later clock); different answer hash ⇒ ATTEMPT_ALREADY_SUBMITTED.
//   3. Read authoritative control / day / account / academic lock on the PRIMARY session.
//   4. Grade + price + compute entitlement from persisted rows (pure functions).
//   5. Fresh `execution_id` per CAS attempt; claim via INSERT..SELECT guarded by ALL read
//      revisions AND attempt-not-accepted AND lock state, with
//      `ON CONFLICT(student_id, command_type, request_id) DO NOTHING` so a lost same-key claim is
//      a silent no-op (NOT a thrown UNIQUE error).
//   6. Every subsequent mutation is guarded by `claim.execution_id`; accepted event, academic
//      lock (only when a non-zero raw is credited), day, wallet, grant ledger and receipt are
//      written in the SAME batch.
//   7. An in-transaction invariant guard (`cnh_exp_submit_guard`, `CHECK (ok = 1)`) rolls the
//      batch back if the claim succeeded but a required row was not applied OR the resulting
//      values are not exactly what we computed. A FAILED invariant inserts `ok = 0` and VIOLATES
//      the CHECK (hard rollback) — never a silent 0-row no-op.
//   8. A losing claim makes every following write a no-op; we then re-read the receipt / accepted
//      event and retry, bounded, with backoff + jitter. Exhaustion is a typed retryable error,
//      never a false success of 0. Unexpected SQL/CHECK/ledger-uniqueness failures PROPAGATE
//      immediately (rollback) — they are never swallowed into a retry.
//
// No clock, no randomness, no I/O in the pure path. `sleep`/`uuid` are injectable ONLY so tests
// can be deterministic; production defaults are safe. `receivedAt` is passed by a trusted adapter.

import type { D1Database, D1DatabaseSession, Env } from './kieu'
import { docAnhChup, bamSha256, jsonChuanHoa, type AnhChupNhiemVu } from './cnh-exp-task'
import { gradeFromSnapshot, LoiCham, type KetQuaCham, type KetQuaChamY } from './cnh-exp-grade'
import { giaCoreRaw, quyenCore } from './cnh-exp-policy'

/** The only command type this substrate settles today. */
export const LENH_NOP_BAI_CORE = 'submit_core' as const

/** Policy version this substrate writes. Cutover/versioning is a separate job. */
export const PHIEN_BAN_CHINH_SACH = 'CNH-1.0' as const

/** Bounded retry schedule (04 §5.7): 20/40/80/160/320 ms with small jitter. */
export const SO_LAN_THU_LAI = 5
const LICH_CHO_MS = [20, 40, 80, 160, 320] as const

/** Assistance states the server may assert for an attempt. */
export type TroGiup = 'none' | 'assisted' | 'unknown'

/** Publication state of a persisted learning event (04 §2 `LearningEvent.visibility`). */
export type HienThi = 'embargoed' | 'released'

/**
 * Trusted server context that produced an event. NEVER derived from the answer payload.
 * Today the only producer is the released-CORE submission command.
 */
export const NGUON_NOP_BAI_CORE = 'submit_core' as const
export type NguonSuKien = typeof NGUON_NOP_BAI_CORE

/** Typed, stable error codes (04 §4.4). */
export type MaLoiNopBai =
  | 'IDEMPOTENCY_CONFLICT'
  | 'ATTEMPT_ALREADY_SUBMITTED'
  | 'RETRYABLE_CONFLICT'
  | 'NOT_FOUND'
  | 'NOT_RELEASED'
  | 'NOT_ACTIVE'
  | 'NOT_CORE'
  | 'SESSION_EXPIRED'
  | 'CORRUPT_STATE'
  | 'GRADING_FAILED'
  | 'ANSWER_UNSUPPORTED_FORMAT'

export class LoiNopBai extends Error {
  readonly ma: MaLoiNopBai
  constructor(ma: MaLoiNopBai, thongDiep: string) {
    super(thongDiep)
    this.name = 'LoiNopBai'
    this.ma = ma
  }
}

/** Injectable side effects — production defaults are safe; tests override for determinism. */
export interface PhuThuocNopBai {
  /** Fresh unique id per CAS attempt. Defaults to `crypto.randomUUID()`. */
  uuid?: () => string
  /** Backoff sleep. Defaults to a real timer. */
  sleep?: (ms: number) => Promise<void>
}

/** Input the caller supplies. NOTE: no correct/exp/day/assistance/achieved/hash — server-derived. */
export interface YeuCauNopBaiCore {
  /** Authenticated student id (server-derived; never trusted from the client body). */
  studentId: string
  /** The attempt being submitted. */
  attemptId: string
  /** Raw answer payload (opaque; graded against the pinned snapshot). */
  rawAnswer: unknown
  /** Client-supplied idempotency key. */
  requestId: string
  /** Server clock (epoch ms) at which the submission was received. */
  receivedAt: number
}

/**
 * The exact response persisted and replayed byte-for-byte.
 *
 * NOTE: there is deliberately NO `replayed` field. The stored response is the immutable result
 * of the command; a replay returns that SAME object unchanged. The response NEVER contains the
 * answer key, solution, or grading material.
 */
export interface PhanHoiNopBaiCore {
  commandType: typeof LENH_NOP_BAI_CORE
  studentId: string
  attemptId: string
  learningDay: string
  policyVersion: string
  correct: boolean
  raw: number
  entitlement: number
  grant: number
  walletAfter: number
  earnedAfter: number
  corePaidAfter: number
  committedRevision: number
}

interface DongDieuKhien {
  assistance: string
  released: number
  active: number
  revision: number
}

interface DongDaNhan {
  answer_hash: string
  received_at: number
  learning_day: string
  correct: number
  raw: number
  snapshot_hash: string
  execution_id: string
}

interface DongTaiKhoan {
  wallet_exp: number
  earned_exp: number
  revision: number
}

interface DongNgay {
  raw_core: number
  achieved: number
  core_paid: number
  compensation_paid: number
  revision: number
}

interface DongLenh {
  request_hash: string
  response_json: string
}

/**
 * The persisted immutable LearningEvent evidence for a released CORE submission (04 §2).
 * This is the INTERNAL, server-only view — it is NOT a public DTO and MUST NOT be returned by
 * any route. `answerPayload`/`subitemResults` are parsed from the canonical JSON stored at write.
 */
export interface SuKienHocTap {
  /** Stable event identity. For a submission event this is the attempt id. */
  readonly eventId: string
  readonly attemptId: string
  readonly studentId: string
  readonly receivedAt: number
  readonly learningDay: string
  readonly source: string
  /** The pinned snapshot hash (grading-material provenance). */
  readonly snapshotId: string
  /** The canonical raw answer payload, parsed from the frozen JSON written at submit time. */
  readonly answerPayload: unknown
  /** Per-subitem results from the actual grade, in issued order (`[]` for Parts I/III). */
  readonly subitemResults: readonly KetQuaChamY[]
  readonly correct: boolean
  readonly assistance: TroGiup
  /** NULL at submission time — telemetry is never fabricated. */
  readonly activeSeconds: number | null
  readonly visibility: HienThi
  /** NULL for an original submission; set by a later correction job. */
  readonly correctionOf: string | null
  readonly policyVersion: string
}

interface DongSuKien {
  student_id: string
  attempt_id: string
  received_at: number
  learning_day: string
  source: string
  snapshot_hash: string
  answer_json: string
  subitems_json: string
  correct: number
  assistance: string
  active_seconds: number | null
  visibility: string
  correction_of: string | null
  policy_version: string
}

const macDinhUuid = (): string => crypto.randomUUID()
const macDinhSleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/** Small jitter in [0, ms/4) so concurrent retries do not stampede in lockstep. */
function jitter(ms: number): number {
  return ms + Math.floor(Math.random() * Math.max(1, Math.floor(ms / 4)))
}

function laSoNguyenAnToan(v: unknown): v is number {
  return typeof v === 'number' && Number.isSafeInteger(v) && v >= 0
}

/** A read-only handle: either the primary DB or a primary session (both expose prepare/first). */
type DbDoc = Pick<D1Database, 'prepare'>

/**
 * Derive the ORIGINAL VN learning day (UTC+7) from a server epoch-ms timestamp.
 * Deterministic: same instant ⇒ same day string `YYYY-MM-DD`.
 */
export function ngayHocVN(receivedAt: number): string {
  if (!laSoNguyenAnToan(receivedAt)) {
    throw new LoiNopBai('CORRUPT_STATE', `receivedAt phải là số nguyên an toàn >= 0: ${String(receivedAt)}`)
  }
  const vn = new Date(receivedAt + 7 * 60 * 60 * 1000)
  const y = vn.getUTCFullYear()
  const m = String(vn.getUTCMonth() + 1).padStart(2, '0')
  const d = String(vn.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Canonical hash of the submission payload: the attempt identity + the raw answer.
 * The caller NEVER supplies this. Deterministic: same attempt + same answer ⇒ same hash.
 */
export async function bamYeuCauNopBai(attemptId: string, rawAnswer: unknown): Promise<string> {
  const json = jsonChuanHoa({ attemptId, answer: rawAnswer })
  return bamSha256(json)
}

/**
 * Capture the raw answer ONCE, synchronously, as a canonical frozen JSON string.
 *
 * This MUST run BEFORE any `await` in the submission path. `jsonChuanHoa` deep-validates and
 * serializes the input in one synchronous pass, so a caller mutating its object after the call
 * cannot change what we hash, grade or persist. The SAME canonical string is then used for all
 * three, which removes the input-mutation race entirely.
 */
export function chupDapAnChuan(rawAnswer: unknown): string {
  return jsonChuanHoa(rawAnswer)
}

/** Parse a canonical answer JSON string back into a value (byte-identical to what was hashed). */
function giaiDapAnChuan(json: string): unknown {
  return JSON.parse(json) as unknown
}

/**
 * Canonical JSON of the per-subitem results from the ACTUAL grade, in issued order.
 * `[]` when the part has no subitems (Parts I/III) — never a fabricated placeholder.
 */
function jsonKetQuaCon(ketQua: KetQuaCham): string {
  const subitems: readonly KetQuaChamY[] = ketQua.subitems ?? []
  return jsonChuanHoa(
    subitems.map((s) => ({ id: s.id, correct: s.correct, skillIds: [...s.skillIds] })),
  )
}

function kiemTraDongDieuKhien(v: unknown): DongDieuKhien {
  if (typeof v !== 'object' || v === null) {
    throw new LoiNopBai('CORRUPT_STATE', 'dòng điều khiển không phải object')
  }
  const o = v as Record<string, unknown>
  if (o.assistance !== 'none' && o.assistance !== 'assisted' && o.assistance !== 'unknown') {
    throw new LoiNopBai('CORRUPT_STATE', `assistance không hợp lệ: ${String(o.assistance)}`)
  }
  if (o.released !== 0 && o.released !== 1) {
    throw new LoiNopBai('CORRUPT_STATE', `released phải là 0 hoặc 1: ${String(o.released)}`)
  }
  if (o.active !== 0 && o.active !== 1) {
    throw new LoiNopBai('CORRUPT_STATE', `active phải là 0 hoặc 1: ${String(o.active)}`)
  }
  if (!laSoNguyenAnToan(o.revision)) {
    throw new LoiNopBai('CORRUPT_STATE', 'revision điều khiển không phải số nguyên an toàn >= 0')
  }
  if (!Number.isSafeInteger(o.revision + 1)) {
    throw new LoiNopBai('CORRUPT_STATE', 'revision điều khiển + 1 vượt số nguyên an toàn')
  }
  return { assistance: o.assistance, released: o.released, active: o.active, revision: o.revision }
}

function kiemTraDongTaiKhoan(v: unknown): DongTaiKhoan {
  if (typeof v !== 'object' || v === null) {
    throw new LoiNopBai('CORRUPT_STATE', 'dòng tài khoản không phải object')
  }
  const o = v as Record<string, unknown>
  if (!laSoNguyenAnToan(o.wallet_exp) || !laSoNguyenAnToan(o.earned_exp) || !laSoNguyenAnToan(o.revision)) {
    throw new LoiNopBai('CORRUPT_STATE', 'tài khoản có giá trị không phải số nguyên an toàn >= 0')
  }
  if (!Number.isSafeInteger(o.revision + 1)) {
    throw new LoiNopBai('CORRUPT_STATE', 'revision tài khoản + 1 vượt số nguyên an toàn')
  }
  return { wallet_exp: o.wallet_exp, earned_exp: o.earned_exp, revision: o.revision }
}

function kiemTraDongNgay(v: unknown): DongNgay {
  if (typeof v !== 'object' || v === null) {
    throw new LoiNopBai('CORRUPT_STATE', 'dòng ngày không phải object')
  }
  const o = v as Record<string, unknown>
  if (o.achieved !== 0 && o.achieved !== 1) {
    throw new LoiNopBai('CORRUPT_STATE', `achieved phải là 0 hoặc 1: ${String(o.achieved)}`)
  }
  if (
    !laSoNguyenAnToan(o.raw_core) ||
    !laSoNguyenAnToan(o.core_paid) ||
    !laSoNguyenAnToan(o.compensation_paid) ||
    !laSoNguyenAnToan(o.revision)
  ) {
    throw new LoiNopBai('CORRUPT_STATE', 'ngày có giá trị không phải số nguyên an toàn >= 0')
  }
  if (!Number.isSafeInteger(o.revision + 1)) {
    throw new LoiNopBai('CORRUPT_STATE', 'revision ngày + 1 vượt số nguyên an toàn')
  }
  return {
    raw_core: o.raw_core,
    achieved: o.achieved,
    core_paid: o.core_paid,
    compensation_paid: o.compensation_paid,
    revision: o.revision,
  }
}

async function docDieuKhien(
  db: DbDoc,
  studentId: string,
  attemptId: string,
): Promise<DongDieuKhien | null> {
  const r = await db
    .prepare(
      `SELECT assistance, released, active, revision
         FROM cnh_exp_attempt_control
        WHERE student_id = ? AND attempt_id = ?`,
    )
    .bind(studentId, attemptId)
    .first<DongDieuKhien>()
  return r == null ? null : kiemTraDongDieuKhien(r)
}

async function docDaNhan(
  db: DbDoc,
  studentId: string,
  attemptId: string,
): Promise<DongDaNhan | null> {
  const r = await db
    .prepare(
      `SELECT answer_hash, received_at, learning_day, correct, raw, snapshot_hash, execution_id
         FROM cnh_exp_accepted
        WHERE student_id = ? AND attempt_id = ?`,
    )
    .bind(studentId, attemptId)
    .first<DongDaNhan>()
  return r ?? null
}

/**
 * Load the ORIGINAL command receipt by its execution reference (the exact command that produced
 * an accepted event). Returns null when absent. We look up by `execution_id` + identity — NEVER
 * by "first matching answer_hash among commands", which could return an alias row.
 */
async function docLenhTheoExecution(
  db: DbDoc,
  studentId: string,
  executionId: string,
): Promise<DongLenh | null> {
  const r = await db
    .prepare(
      `SELECT request_hash, response_json
         FROM cnh_exp_command
        WHERE student_id = ? AND command_type = ? AND execution_id = ?`,
    )
    .bind(studentId, LENH_NOP_BAI_CORE, executionId)
    .first<DongLenh>()
  return r ?? null
}

async function docTaiKhoan(db: DbDoc, studentId: string): Promise<DongTaiKhoan | null> {
  const r = await db
    .prepare('SELECT wallet_exp, earned_exp, revision FROM cnh_exp_account WHERE student_id = ?')
    .bind(studentId)
    .first<DongTaiKhoan>()
  return r == null ? null : kiemTraDongTaiKhoan(r)
}

async function docNgay(
  db: DbDoc,
  studentId: string,
  learningDay: string,
  policyVersion: string,
): Promise<DongNgay | null> {
  const r = await db
    .prepare(
      `SELECT raw_core, achieved, core_paid, compensation_paid, revision
         FROM cnh_exp_day
        WHERE student_id = ? AND learning_day = ? AND policy_version = ?`,
    )
    .bind(studentId, learningDay, policyVersion)
    .first<DongNgay>()
  return r == null ? null : kiemTraDongNgay(r)
}

async function docLenh(
  db: DbDoc,
  studentId: string,
  requestId: string,
): Promise<DongLenh | null> {
  const r = await db
    .prepare(
      `SELECT request_hash, response_json
         FROM cnh_exp_command
        WHERE student_id = ? AND command_type = ? AND request_id = ?`,
    )
    .bind(studentId, LENH_NOP_BAI_CORE, requestId)
    .first<DongLenh>()
  return r ?? null
}

/**
 * Read the immutable LearningEvent evidence for an AUTHENTICATED (student, attempt).
 *
 * INTERNAL, server-only. This is the owned event reader the personalization/correction jobs use;
 * it is NOT a route and MUST NOT be exposed over HTTP. Returns null when no event exists.
 *
 * The stored canonical JSON is parsed back into the exact values that were hashed and graded.
 * A malformed stored payload fails closed with `CORRUPT_STATE` (never a silent partial event).
 */
export async function docSuKienHocTap(
  db: D1Database,
  studentId: string,
  attemptId: string,
): Promise<SuKienHocTap | null> {
  if (typeof studentId !== 'string' || !studentId.length) {
    throw new LoiNopBai('CORRUPT_STATE', 'studentId phải là chuỗi không rỗng')
  }
  if (typeof attemptId !== 'string' || !attemptId.length) {
    throw new LoiNopBai('CORRUPT_STATE', 'attemptId phải là chuỗi không rỗng')
  }
  const session: D1DatabaseSession =
    typeof db.withSession === 'function' ? db.withSession('first-primary') : db
  const row = await session
    .prepare(
      `SELECT student_id, attempt_id, received_at, learning_day, source, snapshot_hash,
              answer_json, subitems_json, correct, assistance, active_seconds, visibility,
              correction_of, policy_version
         FROM cnh_exp_accepted
        WHERE student_id = ? AND attempt_id = ?`,
    )
    .bind(studentId, attemptId)
    .first<DongSuKien>()
  if (row === null) return null
  return anhXaSuKien(row)
}

/** Map a stored accepted row to the typed LearningEvent view, fail-closed on malformed JSON. */
function anhXaSuKien(row: DongSuKien): SuKienHocTap {
  if (typeof row.student_id !== 'string' || !row.student_id.length) {
    throw new LoiNopBai('CORRUPT_STATE', 'su kien thieu student_id')
  }
  if (typeof row.attempt_id !== 'string' || !row.attempt_id.length) {
    throw new LoiNopBai('CORRUPT_STATE', 'su kien thieu attempt_id')
  }
  if (typeof row.source !== 'string' || !row.source.length) {
    throw new LoiNopBai('CORRUPT_STATE', 'su kien thieu source')
  }
  if (typeof row.policy_version !== 'string' || !row.policy_version.length) {
    throw new LoiNopBai('CORRUPT_STATE', 'su kien thieu policy_version')
  }
  if (!laSoNguyenAnToan(row.received_at)) {
    throw new LoiNopBai('CORRUPT_STATE', 'received_at phải là số nguyên an toàn >= 0')
  }
  if (row.correct !== 0 && row.correct !== 1) {
    throw new LoiNopBai('CORRUPT_STATE', `correct phải là 0 hoặc 1: ${String(row.correct)}`)
  }
  if (row.assistance !== 'none' && row.assistance !== 'assisted' && row.assistance !== 'unknown') {
    throw new LoiNopBai('CORRUPT_STATE', `assistance không hợp lệ: ${String(row.assistance)}`)
  }
  if (row.visibility !== 'embargoed' && row.visibility !== 'released') {
    throw new LoiNopBai('CORRUPT_STATE', `visibility không hợp lệ: ${String(row.visibility)}`)
  }
  if (row.active_seconds !== null && !laSoNguyenAnToan(row.active_seconds)) {
    throw new LoiNopBai('CORRUPT_STATE', 'active_seconds phải là NULL hoặc số nguyên an toàn >= 0')
  }
  if (row.correction_of !== null && (typeof row.correction_of !== 'string' || !row.correction_of.length)) {
    throw new LoiNopBai('CORRUPT_STATE', 'correction_of phải là NULL hoặc chuỗi không rỗng')
  }

  let answerPayload: unknown
  try {
    answerPayload = giaiDapAnChuan(row.answer_json)
  } catch {
    throw new LoiNopBai('CORRUPT_STATE', 'answer_json không phải JSON hợp lệ')
  }

  let rawSubitems: unknown
  try {
    rawSubitems = JSON.parse(row.subitems_json)
  } catch {
    throw new LoiNopBai('CORRUPT_STATE', 'subitems_json không phải JSON hợp lệ')
  }
  if (!Array.isArray(rawSubitems)) {
    throw new LoiNopBai('CORRUPT_STATE', 'subitems_json phải là mảng')
  }
  const subitemResults: KetQuaChamY[] = rawSubitems.map((raw, i) => {
    if (typeof raw !== 'object' || raw === null) {
      throw new LoiNopBai('CORRUPT_STATE', `subitems_json[${i}] phải là object`)
    }
    const o = raw as Record<string, unknown>
    if (typeof o.id !== 'string' || !o.id.length) {
      throw new LoiNopBai('CORRUPT_STATE', `subitems_json[${i}].id phải là chuỗi không rỗng`)
    }
    if (typeof o.correct !== 'boolean') {
      throw new LoiNopBai('CORRUPT_STATE', `subitems_json[${i}].correct phải là boolean`)
    }
    if (!Array.isArray(o.skillIds) || o.skillIds.some((s) => typeof s !== 'string' || !s.length)) {
      throw new LoiNopBai('CORRUPT_STATE', `subitems_json[${i}].skillIds phải là mảng chuỗi không rỗng`)
    }
    return Object.freeze({
      id: o.id,
      correct: o.correct,
      skillIds: Object.freeze((o.skillIds as string[]).slice()),
    })
  })

  return Object.freeze({
    eventId: row.attempt_id,
    attemptId: row.attempt_id,
    studentId: row.student_id,
    receivedAt: row.received_at,
    learningDay: row.learning_day,
    source: row.source,
    snapshotId: row.snapshot_hash,
    answerPayload,
    subitemResults: Object.freeze(subitemResults),
    correct: row.correct === 1,
    assistance: row.assistance as TroGiup,
    activeSeconds: row.active_seconds,
    visibility: row.visibility as HienThi,
    correctionOf: row.correction_of,
    policyVersion: row.policy_version,
  })
}

/** True when an academic lock already exists for (student, content_group, learning_day). */
async function coKhoaHocTap(
  db: DbDoc,
  studentId: string,
  contentGroup: string,
  learningDay: string,
): Promise<boolean> {
  const r = await db
    .prepare(
      `SELECT 1 AS x FROM cnh_exp_academic_lock
        WHERE student_id = ? AND content_group = ? AND learning_day = ?`,
    )
    .bind(studentId, contentGroup, learningDay)
    .first<{ x: number }>()
  return r != null
}

/**
 * Read the durable content-group exposure lock for (student, content_group), or null when absent.
 * The lock's `revision` is the CAS guard: a lock created between this read and the batch loses the
 * CAS and the submission re-reads the effective assisted state.
 */
async function docKhoaPhoiNhiem(
  db: DbDoc,
  studentId: string,
  contentGroup: string,
): Promise<{ revision: number } | null> {
  const r = await db
    .prepare(
      `SELECT revision FROM cnh_exp_exposure_lock WHERE student_id = ? AND content_group = ?`,
    )
    .bind(studentId, contentGroup)
    .first<{ revision: number }>()
  if (r == null) return null
  if (!laSoNguyenAnToan(r.revision)) {
    throw new LoiNopBai('CORRUPT_STATE', 'revision khoá phơi nhiễm không phải số nguyên an toàn >= 0')
  }
  return { revision: r.revision }
}

/**
 * Provision (or re-read) the server-mutable control record for an issued attempt.
 *
 * INTERNAL helper: called ONLY by the issued-task adapter. There is NO HTTP shortcut. The
 * `assistance` state is the SERVER-asserted independence state; the default is `unknown` unless
 * the server explicitly asserts independence (`none`). `released` defaults to false (embargoed)
 * until a release job flips it. Idempotent: an existing row is returned unchanged.
 */
export async function capDieuKhienNopBai(
  db: D1Database,
  input: {
    studentId: string
    attemptId: string
    assistance?: TroGiup
    released?: boolean
    active?: boolean
  },
): Promise<{ assistance: TroGiup; released: boolean; active: boolean; revision: number; created: boolean }> {
  const studentId = input.studentId
  const attemptId = input.attemptId
  if (typeof studentId !== 'string' || !studentId.length) {
    throw new LoiNopBai('CORRUPT_STATE', 'studentId phải là chuỗi không rỗng')
  }
  if (typeof attemptId !== 'string' || !attemptId.length) {
    throw new LoiNopBai('CORRUPT_STATE', 'attemptId phải là chuỗi không rỗng')
  }
  const assistance: TroGiup = input.assistance ?? 'unknown'
  if (assistance !== 'none' && assistance !== 'assisted' && assistance !== 'unknown') {
    throw new LoiNopBai('CORRUPT_STATE', `assistance không hợp lệ: ${String(assistance)}`)
  }
  // Optional flags MUST be real booleans when supplied: a string like "false" would otherwise be
  // coerced truthy and silently flip the control. Reject anything that is not `undefined`/boolean.
  if (input.released !== undefined && typeof input.released !== 'boolean') {
    throw new LoiNopBai('CORRUPT_STATE', `released phải là boolean: ${String(input.released)}`)
  }
  if (input.active !== undefined && typeof input.active !== 'boolean') {
    throw new LoiNopBai('CORRUPT_STATE', `active phải là boolean: ${String(input.active)}`)
  }
  const released = input.released === true ? 1 : 0
  const active = input.active === false ? 0 : 1

  // The immutable task snapshot MUST exist for this (student, attempt) before provisioning a
  // control row: a missing/foreign task fails closed (never invent a control for an unknown task).
  const snapshot = await docAnhChup(db, studentId, attemptId)
  if (!snapshot) {
    throw new LoiNopBai('NOT_FOUND', `thiếu ảnh chụp cho ${studentId}/${attemptId}`)
  }

  const session: D1DatabaseSession =
    typeof db.withSession === 'function' ? db.withSession('first-primary') : db

  // INHERIT assistance from the durable content-group exposure lock (04 §4.3): once a hint/reveal
  // has been served for this (student, content_group) exposure, EVERY issued attempt in that
  // exposure is `assisted` — a later attempt can NEVER become independent, even if it was
  // issued/provisioned before the assistance command ran. The lock OVERRIDES the caller's
  // requested assistance (a caller can never downgrade an exposed attempt to independent).
  //
  // The lock is consulted IN THE SAME SQL STATEMENT as the INSERT (via `EXISTS`), NOT via a
  // separate JS read: a concurrent assistance command that creates the lock between a JS read and
  // the INSERT would otherwise leave a new attempt provisioned as independent. With `EXISTS` in
  // the INSERT..SELECT, the lock presence is evaluated atomically with the insert.
  //
  // Idempotent: an existing control row is returned UNCHANGED (never downgrade assistance or
  // reset revision on repeated provisioning).
  const inserted = await session
    .prepare(
      `INSERT INTO cnh_exp_attempt_control (student_id, attempt_id, assistance, released, active, revision)
       SELECT ?, ?, CASE WHEN EXISTS (
                SELECT 1 FROM cnh_exp_exposure_lock
                 WHERE student_id = ? AND content_group = ?
              ) THEN 'assisted' ELSE ? END, ?, ?, 0
       ON CONFLICT(student_id, attempt_id) DO NOTHING`,
    )
    .bind(studentId, attemptId, studentId, snapshot.contentGroup, assistance, released, active)
    .run()
  const created = inserted.meta.changes === 1

  const row = await docDieuKhien(session as unknown as DbDoc, studentId, attemptId)
  if (row === null) {
    throw new LoiNopBai('CORRUPT_STATE', 'không đọc được điều khiển vừa tạo')
  }
  return {
    assistance: row.assistance as TroGiup,
    released: row.released === 1,
    active: row.active === 1,
    revision: row.revision,
    created,
  }
}

/**
 * Submit ONE released CORE attempt, atomically.
 *
 * The caller supplies ONLY identity + raw answer + idempotency + server clock. Every
 * money-relevant fact (assistance, released, active, day, wallet, lock) is read from persisted
 * rows. Absent control/account/day fail closed (NOT_FOUND) — this substrate never invents a
 * wallet or a day, and never zeroes/resets a preexisting wallet.
 */
export async function nopBaiCore(
  env: Env,
  yeuCau: YeuCauNopBaiCore,
  phuThuoc: PhuThuocNopBai = {},
): Promise<PhanHoiNopBaiCore> {
  const uuid = phuThuoc.uuid ?? macDinhUuid
  const sleep = phuThuoc.sleep ?? macDinhSleep

  const { studentId, attemptId, rawAnswer, requestId, receivedAt } = yeuCau
  if (!studentId || !attemptId || !requestId) {
    throw new LoiNopBai('NOT_FOUND', 'thiếu studentId/attemptId/requestId')
  }
  if (!laSoNguyenAnToan(receivedAt)) {
    throw new LoiNopBai('CORRUPT_STATE', `receivedAt phải là số nguyên an toàn >= 0: ${String(receivedAt)}`)
  }

  // Capture the raw answer ONCE, synchronously, BEFORE any await. The SAME canonical JSON is
  // used for hashing, grading and persistence, so a caller mutating its input during an async
  // hash can never produce a stored payload that diverges from the graded one.
  const answerJson = chupDapAnChuan(rawAnswer)
  const answerChuan = giaiDapAnChuan(answerJson)

  const requestHash = await bamYeuCauNopBai(attemptId, answerChuan)
  const learningDay = ngayHocVN(receivedAt)

  // ONE primary session for ALL reads AND the batch/confirmation (04 §5, §6): this command is a
  // read-after-write settlement, so it must NEVER read a replica.
  const session: D1DatabaseSession | null =
    typeof env.DB.withSession === 'function' ? env.DB.withSession('first-primary') : null
  const dbDoc: DbDoc = session ?? env.DB
  const dbGhi: D1Database = (session as unknown as D1Database) ?? env.DB

  for (let lanThu = 0; lanThu < SO_LAN_THU_LAI; lanThu++) {
    // 1. Receipt first: same hash ⇒ replay the EXACT stored response; different hash ⇒ conflict.
    const lenhCu = await docLenh(dbDoc, studentId, requestId)
    if (lenhCu) {
      if (lenhCu.request_hash !== requestHash) {
        throw new LoiNopBai(
          'IDEMPOTENCY_CONFLICT',
          `request_id ${requestId} đã dùng với payload khác`,
        )
      }
      return JSON.parse(lenhCu.response_json) as PhanHoiNopBaiCore
    }

    // 2. Accepted event for this attempt: same answer ⇒ replay the ORIGINAL result (independent
    //    of a later clock); different answer ⇒ ATTEMPT_ALREADY_SUBMITTED (no auto-correction).
    const daNhan = await docDaNhan(dbDoc, studentId, attemptId)
    if (daNhan) {
      if (daNhan.answer_hash !== requestHash) {
        throw new LoiNopBai(
          'ATTEMPT_ALREADY_SUBMITTED',
          `attempt ${attemptId} đã nộp với đáp án khác`,
        )
      }
      // Replay the ORIGINAL result by loading the ORIGINAL command receipt via the execution
      // reference stored on the accepted row. We NEVER recompute entitlement/wallet from current
      // rows: a later `achieved` change could otherwise invent a positive grant that was never
      // committed. The stored response is returned verbatim.
      const goc = await docLenhTheoExecution(dbDoc, studentId, daNhan.execution_id)
      if (!goc) {
        throw new LoiNopBai(
          'CORRUPT_STATE',
          `thiếu lệnh gốc ${daNhan.execution_id} cho attempt ${attemptId}`,
        )
      }
      if (goc.request_hash !== daNhan.answer_hash) {
        throw new LoiNopBai(
          'CORRUPT_STATE',
          `băm lệnh gốc không khớp accepted cho attempt ${attemptId}`,
        )
      }
      // Bind THIS new request key as a durable receipt ALIAS of the original command: one atomic
      // INSERT..SELECT sourced from the valid original receipt + accepted identity, with
      // ON CONFLICT(request key) DO NOTHING. No wallet/day/ledger mutation, no fake paid amount.
      // A fresh execution_id is used for the alias row; the response/committed_revision/hash are
      // copied verbatim from the original. Reusing the alias key for another attempt/answer is
      // caught by the hash check below (IDEMPOTENCY_CONFLICT).
      const gocPhanHoi = JSON.parse(goc.response_json) as PhanHoiNopBaiCore
      const aliasExecutionId = uuid()
      await dbGhi
        .prepare(
          `INSERT INTO cnh_exp_command
             (student_id, command_type, request_id, request_hash, execution_id, response_json, committed_revision)
           SELECT ?, ?, ?, ?, ?, ?, ?
            WHERE EXISTS (SELECT 1 FROM cnh_exp_accepted
                           WHERE student_id = ? AND attempt_id = ? AND answer_hash = ? AND execution_id = ?)
              AND EXISTS (SELECT 1 FROM cnh_exp_command
                           WHERE student_id = ? AND command_type = ? AND execution_id = ?)
           ON CONFLICT (student_id, command_type, request_id) DO NOTHING`,
        )
        .bind(
          studentId,
          LENH_NOP_BAI_CORE,
          requestId,
          requestHash,
          aliasExecutionId,
          goc.response_json,
          gocPhanHoi.committedRevision,
          studentId,
          attemptId,
          daNhan.answer_hash,
          daNhan.execution_id,
          studentId,
          LENH_NOP_BAI_CORE,
          daNhan.execution_id,
        )
        .run()

      // Read back the alias (or a pre-existing row for this key) and validate its hash.
      const alias = await docLenh(dbDoc, studentId, requestId)
      if (!alias) {
        throw new LoiNopBai('CORRUPT_STATE', `không đọc được bí danh ${requestId}`)
      }
      if (alias.request_hash !== requestHash) {
        throw new LoiNopBai(
          'IDEMPOTENCY_CONFLICT',
          `request_id ${requestId} đã dùng với payload khác`,
        )
      }
      return JSON.parse(alias.response_json) as PhanHoiNopBaiCore
    }

    // 3. Read authoritative control / day / account / academic lock on the primary.
    const dieuKhien = await docDieuKhien(dbDoc, studentId, attemptId)
    if (!dieuKhien) {
      throw new LoiNopBai('NOT_FOUND', `thiếu điều khiển cho ${studentId}/${attemptId}`)
    }
    if (dieuKhien.active !== 1) {
      throw new LoiNopBai('NOT_ACTIVE', `attempt ${attemptId} không còn hiệu lực`)
    }
    if (dieuKhien.released !== 1) {
      throw new LoiNopBai('NOT_RELEASED', `attempt ${attemptId} chưa được phát hành`)
    }

    const taiKhoan = await docTaiKhoan(dbDoc, studentId)
    const ngay = await docNgay(dbDoc, studentId, learningDay, PHIEN_BAN_CHINH_SACH)
    if (!taiKhoan || !ngay) {
      throw new LoiNopBai(
        'NOT_FOUND',
        `thiếu tài khoản hoặc ngày cho ${studentId}/${learningDay}`,
      )
    }

    // 4. Read the verified immutable snapshot (hash + indexed columns cross-checked).
    const snapshot: AnhChupNhiemVu | null = await docAnhChup(env.DB, studentId, attemptId)
    if (!snapshot) {
      throw new LoiNopBai('NOT_FOUND', `thiếu ảnh chụp cho ${studentId}/${attemptId}`)
    }
    if (snapshot.bucket !== 'core') {
      throw new LoiNopBai('NOT_CORE', `attempt ${attemptId} không thuộc nhóm core`)
    }
    if (snapshot.policy.version !== PHIEN_BAN_CHINH_SACH) {
      throw new LoiNopBai('CORRUPT_STATE', `policy.version không hỗ trợ: ${snapshot.policy.version}`)
    }
    if (receivedAt < snapshot.issuedAt || receivedAt >= snapshot.expiresAt) {
      throw new LoiNopBai('SESSION_EXPIRED', `receivedAt ngoài cửa sổ hiệu lực của attempt ${attemptId}`)
    }
    // Pin the EXACT grading material used, for the accepted event's provenance.
    const snapshotHash = await bamSha256(jsonChuanHoa(snapshot))

    // 5. Grade from the pinned snapshot (never the current bank, never the client's flag).
    //    Grade the SAME canonical value that was hashed and will be persisted.
    let ketQua: KetQuaCham
    try {
      ketQua = gradeFromSnapshot(snapshot, answerChuan)
    } catch (e) {
      if (e instanceof LoiCham) {
        throw new LoiNopBai('GRADING_FAILED', `chấm thất bại: ${e.message}`)
      }
      throw e
    }

    // Parser failures are validation, not a wrong learning event (02 §1.2).
    // Reject before pricing, claim or writes, so a corrected answer can reuse this key.
    if (ketQua.error === 'unsupported-format') {
      throw new LoiNopBai('ANSWER_UNSUPPORTED_FORMAT', 'Định dạng câu trả lời chưa được hỗ trợ')
    }
    if (!ketQua.valid) throw new LoiNopBai('GRADING_FAILED', 'Chưa có kết quả chấm hợp lệ')

    // 6. Academic lock: a duplicate content_group on the same day is accepted with raw = 0.
    const daCoKhoa = await coKhoaHocTap(dbDoc, studentId, snapshot.contentGroup, learningDay)

    // 6b. Durable content-group exposure lock (04 §4.3): once a hint/reveal has been served for
    //     this (student, content_group) exposure, EVERY attempt in that exposure is `assisted`,
    //     regardless of what the attempt's own control row says. The lock OVERRIDES the control's
    //     assistance for grading/pricing/evidence. We read its revision so the claim can CAS on
    //     it: a lock created between this read and the batch loses the CAS and we re-read.
    const khoaPhoiNhiem = await docKhoaPhoiNhiem(dbDoc, studentId, snapshot.contentGroup)
    const assistanceHieuLuc: TroGiup = khoaPhoiNhiem != null ? 'assisted' : (dieuKhien.assistance as TroGiup)

    // 7. Price from persisted facts (assistance is the EFFECTIVE server-asserted state: the
    //    exposure lock overrides the attempt's own control row).
    const gia = giaCoreRaw({
      part: snapshot.part,
      difficulty: snapshot.difficulty,
      validAttempt: true,
      assistance: assistanceHieuLuc,
      alreadyPaidContentGroupToday: daCoKhoa,
      released: true,
      correct: ketQua.correct,
      ...(snapshot.part === 'II'
        ? {
            partIIMandatoryTotal: ketQua.mandatoryTotal as number,
            partIICorrectCount: ketQua.correctCount as number,
          }
        : {}),
    })
    const raw = gia.raw

    // 8. New day raw = existing + raw (safe-integer checked). Entitlement from persisted rows.
    const rawMoi = ngay.raw_core + raw
    if (!laSoNguyenAnToan(rawMoi)) {
      throw new LoiNopBai('CORRUPT_STATE', 'tràn số nguyên khi cộng raw_core')
    }
    const { entitlement, grant } = quyenCore({
      achieved: ngay.achieved === 1,
      rawCore: rawMoi,
      corePaid: ngay.core_paid,
      compensationAlreadyPaid: ngay.compensation_paid,
    })

    // 9. Prevalidate overflow BEFORE touching the DB (fail closed, no partial writes).
    const walletAfter = taiKhoan.wallet_exp + grant
    const earnedAfter = taiKhoan.earned_exp + grant
    const corePaidAfter = ngay.core_paid + grant
    if (
      !laSoNguyenAnToan(walletAfter) ||
      !laSoNguyenAnToan(earnedAfter) ||
      !laSoNguyenAnToan(corePaidAfter)
    ) {
      throw new LoiNopBai('CORRUPT_STATE', 'tràn số nguyên khi cộng quyền core')
    }

    const executionId = uuid()
    const committedRevision = taiKhoan.revision + 1
    const semanticRevision = ngay.revision + 1
    const grantId = uuid()

    const phanHoi: PhanHoiNopBaiCore = {
      commandType: LENH_NOP_BAI_CORE,
      studentId,
      attemptId,
      learningDay,
      policyVersion: PHIEN_BAN_CHINH_SACH,
      correct: ketQua.correct,
      raw,
      entitlement,
      grant,
      walletAfter,
      earnedAfter,
      corePaidAfter,
      committedRevision,
    }
    const responseJson = JSON.stringify(phanHoi)

    // 10. One batch: claim, then every mutation guarded by claim.execution_id, then the
    //     in-transaction invariant guard. A losing claim makes all of these no-ops.
    //
    //     The claim is guarded by ALL read revisions (control, day, account), the exposure-lock
    //     presence/revision, attempt-not-accepted AND the academic-lock state, so a concurrent
    //     control change (e.g. assistance downgrade), a concurrent lock creation, or a concurrent
    //     same-attempt submission loses the CAS.
    const claim = dbGhi.prepare(
      `INSERT INTO cnh_exp_command
         (student_id, command_type, request_id, request_hash, execution_id, response_json, committed_revision)
       SELECT ?, ?, ?, ?, ?, ?, ?
        WHERE EXISTS (SELECT 1 FROM cnh_exp_attempt_control
                       WHERE student_id = ? AND attempt_id = ? AND revision = ?)
          AND EXISTS (SELECT 1 FROM cnh_exp_account WHERE student_id = ? AND revision = ?)
          AND EXISTS (SELECT 1 FROM cnh_exp_day
                       WHERE student_id = ? AND learning_day = ? AND policy_version = ? AND revision = ?)
          AND NOT EXISTS (SELECT 1 FROM cnh_exp_accepted WHERE student_id = ? AND attempt_id = ?)
          AND (? = 0 OR EXISTS (SELECT 1 FROM cnh_exp_academic_lock
                                 WHERE student_id = ? AND content_group = ? AND learning_day = ?))
          AND (? = 1 OR NOT EXISTS (SELECT 1 FROM cnh_exp_academic_lock
                                     WHERE student_id = ? AND content_group = ? AND learning_day = ?))
          AND (? = 0 OR EXISTS (SELECT 1 FROM cnh_exp_exposure_lock
                                 WHERE student_id = ? AND content_group = ? AND revision = ?))
          AND (? = 1 OR NOT EXISTS (SELECT 1 FROM cnh_exp_exposure_lock
                                     WHERE student_id = ? AND content_group = ?))
       ON CONFLICT (student_id, command_type, request_id) DO NOTHING`,
    ).bind(
      studentId,
      LENH_NOP_BAI_CORE,
      requestId,
      requestHash,
      executionId,
      responseJson,
      committedRevision,
      studentId,
      attemptId,
      dieuKhien.revision,
      studentId,
      taiKhoan.revision,
      studentId,
      learningDay,
      PHIEN_BAN_CHINH_SACH,
      ngay.revision,
      studentId,
      attemptId,
      daCoKhoa ? 1 : 0,
      studentId,
      snapshot.contentGroup,
      learningDay,
      daCoKhoa ? 1 : 0,
      studentId,
      snapshot.contentGroup,
      learningDay,
      khoaPhoiNhiem ? 1 : 0,
      studentId,
      snapshot.contentGroup,
      khoaPhoiNhiem?.revision ?? 0,
      khoaPhoiNhiem ? 1 : 0,
      studentId,
      snapshot.contentGroup,
    )

    // Immutable LearningEvent evidence (04 §2). `answer_json`/`subitems_json` are the canonical
    // values captured/derived above; `assistance` is the SERVER-asserted control state; telemetry
    // (`active_seconds`) and `correction_of` are explicit NULLs — never fabricated. `source` is
    // the trusted server context, never the answer payload.
    const subitemsJson = jsonKetQuaCon(ketQua)
    const ghiDaNhan = dbGhi.prepare(
      `INSERT INTO cnh_exp_accepted
         (student_id, attempt_id, answer_hash, received_at, learning_day, correct, raw, snapshot_hash, execution_id,
          answer_json, subitems_json, assistance, policy_version, visibility, correction_of, active_seconds, source)
       SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?
        WHERE EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
    ).bind(
      studentId,
      attemptId,
      requestHash,
      receivedAt,
      learningDay,
      ketQua.correct ? 1 : 0,
      raw,
      snapshotHash,
      executionId,
      answerJson,
      subitemsJson,
      assistanceHieuLuc,
      PHIEN_BAN_CHINH_SACH,
      'released',
      NGUON_NOP_BAI_CORE,
      executionId,
    )

    // Academic lock is written ONLY when a non-zero raw is credited (a duplicate content_group
    // is accepted with raw = 0 and does NOT insert a lock).
    const ghiKhoa = dbGhi.prepare(
      `INSERT INTO cnh_exp_academic_lock
         (student_id, content_group, learning_day, attempt_id, raw)
       SELECT ?, ?, ?, ?, ?
        WHERE EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)
          AND ? = 1`,
    ).bind(
      studentId,
      snapshot.contentGroup,
      learningDay,
      attemptId,
      raw,
      executionId,
      raw > 0 ? 1 : 0,
    )

    const capNgay = dbGhi.prepare(
      `UPDATE cnh_exp_day
          SET raw_core = raw_core + ?, core_paid = core_paid + ?, revision = revision + 1,
              cap_nhat_luc = datetime('now')
        WHERE student_id = ? AND learning_day = ? AND policy_version = ? AND revision = ?
          AND EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
    ).bind(raw, grant, studentId, learningDay, PHIEN_BAN_CHINH_SACH, ngay.revision, executionId)

    const capTaiKhoan = dbGhi.prepare(
      `UPDATE cnh_exp_account
          SET wallet_exp = wallet_exp + ?, earned_exp = earned_exp + ?, revision = revision + 1,
              cap_nhat_luc = datetime('now')
        WHERE student_id = ? AND revision = ?
          AND EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
    ).bind(grant, grant, studentId, taiKhoan.revision, executionId)

    const ghiSo = dbGhi.prepare(
      `INSERT INTO cnh_exp_grant_ledger
         (grant_id, student_id, learning_day, policy_version, semantic_revision, amount, execution_id)
       SELECT ?, ?, ?, ?, ?, ?, ?
        WHERE EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
    ).bind(
      grantId,
      studentId,
      learningDay,
      PHIEN_BAN_CHINH_SACH,
      semanticRevision,
      grant,
      executionId,
      executionId,
    )

    // In-transaction invariant guard (04 §5.6). The ONLY condition in the outer WHERE is that the
    // claim committed; the post-state invariants live in a `CASE WHEN ... THEN 1 ELSE 0 END` in
    // the SELECT list. This is deliberate and load-bearing:
    //   * Claim committed + invariants hold  ⇒ inserts (execution_id, 1) ⇒ CHECK(ok=1) passes.
    //   * Claim committed + invariant FAILS  ⇒ inserts (execution_id, 0) ⇒ CHECK(ok=1) VIOLATES
    //     ⇒ hard SQL error ⇒ the whole batch rolls back.
    //   * Claim lost (no row for execution_id) ⇒ outer WHERE is false ⇒ inserts NOTHING (no-op).
    // We verify RESULTING VALUES (day/account/accepted/lock and the ledger amount/identity), not
    // merely row counts. A zero-grant settlement still writes exactly ONE ledger audit row
    // (amount 0), so the ledger invariant below holds for every successful command.
    const guard = dbGhi.prepare(
      `INSERT INTO cnh_exp_submit_guard (execution_id, ok)
       SELECT ?,
              CASE WHEN
                (SELECT COUNT(*) FROM cnh_exp_day
                  WHERE student_id = ? AND learning_day = ? AND policy_version = ?
                    AND revision = ? AND raw_core = ? AND core_paid = ?) = 1
                AND (SELECT COUNT(*) FROM cnh_exp_account
                      WHERE student_id = ? AND revision = ? AND wallet_exp = ? AND earned_exp = ?) = 1
                AND (SELECT COUNT(*) FROM cnh_exp_accepted
                      WHERE student_id = ? AND attempt_id = ? AND answer_hash = ?
                        AND received_at = ? AND learning_day = ? AND correct = ? AND raw = ?
                        AND snapshot_hash = ? AND execution_id = ?
                        AND answer_json = ? AND subitems_json = ? AND assistance = ?
                        AND policy_version = ? AND visibility = 'released'
                        AND correction_of IS NULL AND active_seconds IS NULL AND source = ?) = 1
                AND (SELECT COUNT(*) FROM cnh_exp_grant_ledger
                      WHERE execution_id = ? AND grant_id = ? AND student_id = ?
                        AND learning_day = ? AND policy_version = ? AND semantic_revision = ?
                        AND amount = ?) = 1
                AND (? = 0 OR (SELECT COUNT(*) FROM cnh_exp_academic_lock
                                WHERE student_id = ? AND content_group = ? AND learning_day = ?
                                  AND attempt_id = ? AND raw = ?) = 1)
              THEN 1 ELSE 0 END
        WHERE EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
    ).bind(
      executionId,
      studentId,
      learningDay,
      PHIEN_BAN_CHINH_SACH,
      semanticRevision,
      rawMoi,
      corePaidAfter,
      studentId,
      committedRevision,
      walletAfter,
      earnedAfter,
      studentId,
      attemptId,
      requestHash,
      receivedAt,
      learningDay,
      ketQua.correct ? 1 : 0,
      raw,
      snapshotHash,
      executionId,
      answerJson,
      subitemsJson,
      assistanceHieuLuc,
      PHIEN_BAN_CHINH_SACH,
      NGUON_NOP_BAI_CORE,
      executionId,
      grantId,
      studentId,
      learningDay,
      PHIEN_BAN_CHINH_SACH,
      semanticRevision,
      grant,
      raw > 0 ? 1 : 0,
      studentId,
      snapshot.contentGroup,
      learningDay,
      attemptId,
      raw,
      executionId,
    )

    // Unexpected SQL/CHECK/ledger-uniqueness failures PROPAGATE (rollback) — never swallowed into
    // a retry. A lost same-key claim is a silent no-op (ON CONFLICT DO NOTHING), so it does NOT
    // throw here; we detect it below by re-reading the receipt.
    await dbGhi.batch([claim, ghiDaNhan, ghiKhoa, capNgay, capTaiKhoan, ghiSo, guard])

    // 11. Confirm the claim actually committed (a losing claim is a silent no-op).
    const daClaim = await docLenh(dbDoc, studentId, requestId)
    if (!daClaim) {
      await sleep(jitter(LICH_CHO_MS[Math.min(lanThu, LICH_CHO_MS.length - 1)]))
      continue
    }
    if (daClaim.request_hash !== requestHash) {
      throw new LoiNopBai(
        'IDEMPOTENCY_CONFLICT',
        `request_id ${requestId} đã dùng với payload khác`,
      )
    }
    return JSON.parse(daClaim.response_json) as PhanHoiNopBaiCore
  }

  throw new LoiNopBai('RETRYABLE_CONFLICT', 'hết lượt thử lại nộp bài core')
}
