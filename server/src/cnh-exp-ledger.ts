// CNH-1.0 P07 — CORE ENTITLEMENT SETTLEMENT SUBSTRATE (internal, server-only, NOT activated).
//
// ⚠️ SCOPE: this module settles the CURRENT PERSISTED day entitlement for one student using the
// pure `quyenCore` policy (03 §3.2). It is NOT an HTTP route, NOT a cutover, and does NOT wire
// issued tasks, academic locks, optional pricing, original-learning-day resolution, submission /
// embargo / correction, or legacy migration. Those are SEPARATE jobs that MUST land before this
// substrate is activated (see the header of migration-2309-cnh-exp-ledger.sql).
//
// ⚠️ AUTHORITY: `cnh_exp_account` is intended to become the single wallet authority. Until the
// cutover adapter exists, the legacy cron/SUM(ledger) path MUST NOT run alongside this table.
//
// Transaction shape (04 §5):
//   1. Read receipt by idempotency key: same hash ⇒ replay the EXACT stored response; different
//      hash ⇒ 409.
//   2. Read persisted day + account on the PRIMARY session (read-after-write; never a replica).
//   3. Recompute `quyenCore` from persisted rows (raw/achieved are materialized elsewhere).
//   4. Fresh `execution_id` per CAS attempt; claim via INSERT..SELECT guarded by BOTH revisions
//      and the request UNIQUE key, with `ON CONFLICT(student_id, command_type, request_id)
//      DO NOTHING` so a lost same-key claim is a silent no-op (NOT a thrown UNIQUE error).
//   5. Every subsequent mutation is guarded by `claim.execution_id`; wallet/earned/core_paid,
//      grant ledger and receipt are written in the SAME batch.
//   6. An in-transaction invariant guard (`cnh_exp_guard`, `CHECK (ok = 1)`) rolls the batch back
//      if the claim succeeded but a required row was not applied OR the resulting values are not
//      exactly what we computed. The invariants are evaluated in a `CASE WHEN ... THEN 1 ELSE 0`
//      so a FAILED invariant inserts `ok = 0` and VIOLATES the CHECK (hard rollback) — it is never
//      a silent 0-row no-op. Only the claim-existence test sits in the outer WHERE, so a LOST
//      claim inserts nothing (no-op). This is a SQL CHECK violation, not a post-commit
//      meta.changes hope.
//   7. A losing claim makes every following write a no-op; we then read the receipt / recompute
//      and retry, bounded, with backoff + jitter. Exhaustion is a typed retryable error, never a
//      false success of 0. Unexpected SQL/CHECK/ledger-uniqueness failures PROPAGATE immediately
//      (rollback) — they are never swallowed into a retry.
//
// No clock, no randomness, no I/O in the pure policy path. `sleep`/`uuid` are injectable ONLY so
// tests can be deterministic; production defaults are safe.

import type { D1Database, D1DatabaseSession, Env } from './kieu'
import { quyenCore } from './cnh-exp-policy'

/** The only command type this substrate settles today. */
export const LENH_QUYET_TOAN_CORE = 'settle_core_entitlement' as const

/** Policy version this substrate writes. Cutover/versioning is a separate job. */
export const PHIEN_BAN_CHINH_SACH = 'CNH-1.0' as const

/** Bounded retry schedule (04 §5.7): 20/40/80/160/320 ms with small jitter. */
export const SO_LAN_THU_LAI = 5
const LICH_CHO_MS = [20, 40, 80, 160, 320] as const

/** Typed, stable error codes (04 §4.4). */
export type MaLoiQuyetToan =
  | 'IDEMPOTENCY_CONFLICT'
  | 'RETRYABLE_CONFLICT'
  | 'NOT_FOUND'
  | 'CORRUPT_STATE'

export class LoiQuyetToan extends Error {
  readonly ma: MaLoiQuyetToan
  constructor(ma: MaLoiQuyetToan, thongDiep: string) {
    super(thongDiep)
    this.name = 'LoiQuyetToan'
    this.ma = ma
  }
}

/** Injectable side effects — production defaults are safe; tests override for determinism. */
export interface PhuThuocQuyetToan {
  /** Fresh unique id per CAS attempt. Defaults to `crypto.randomUUID()`. */
  uuid?: () => string
  /** Backoff sleep. Defaults to a real timer. */
  sleep?: (ms: number) => Promise<void>
}

/** Input the caller supplies. NOTE: no amount/raw/achieved/corePaid/wallet — those are persisted. */
export interface YeuCauQuyetToanCore {
  /** Authenticated student id (server-derived; never trusted from the client body). */
  studentId: string
  /** The ORIGINAL persisted learning day (VN day of first server-accepted submission). */
  learningDay: string
  /** Canonical hash of the request payload, for idempotency. */
  requestHash: string
  /** Client-supplied idempotency key. */
  requestId: string
}

/**
 * The exact response persisted and replayed byte-for-byte.
 *
 * NOTE: there is deliberately NO `replayed` field. The stored response is the immutable result
 * of the command; a replay returns that SAME object unchanged (deep-equal to the first response).
 * A caller that wants to know whether it replayed can compare the returned `committedRevision`
 * against its own known revision, or simply treat the response as authoritative.
 */
export interface PhanHoiQuyetToanCore {
  commandType: typeof LENH_QUYET_TOAN_CORE
  studentId: string
  learningDay: string
  policyVersion: string
  entitlement: number
  grant: number
  walletAfter: number
  earnedAfter: number
  corePaidAfter: number
  committedRevision: number
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
 * Validate a persisted account row. SQLite INTEGER affinity does NOT reject a fractional value,
 * so a row written by a buggy/legacy path could hold a REAL. We reject anything that is not a
 * non-negative safe integer here (fail closed) instead of silently computing on corrupt money.
 */
function kiemTraDongTaiKhoan(v: unknown): DongTaiKhoan {
  if (typeof v !== 'object' || v === null) {
    throw new LoiQuyetToan('CORRUPT_STATE', 'dòng tài khoản không phải object')
  }
  const o = v as Record<string, unknown>
  if (!laSoNguyenAnToan(o.wallet_exp) || !laSoNguyenAnToan(o.earned_exp) || !laSoNguyenAnToan(o.revision)) {
    throw new LoiQuyetToan('CORRUPT_STATE', 'tài khoản có giá trị không phải số nguyên an toàn >= 0')
  }
  if (!Number.isSafeInteger(o.revision + 1)) {
    throw new LoiQuyetToan('CORRUPT_STATE', 'revision tài khoản + 1 vượt số nguyên an toàn')
  }
  return { wallet_exp: o.wallet_exp, earned_exp: o.earned_exp, revision: o.revision }
}

/**
 * Validate a persisted day row. `achieved` MUST be exactly 0 or 1 (a fractional/other value is
 * corrupt), and every money/counter/revision must be a non-negative safe integer.
 */
function kiemTraDongNgay(v: unknown): DongNgay {
  if (typeof v !== 'object' || v === null) {
    throw new LoiQuyetToan('CORRUPT_STATE', 'dòng ngày không phải object')
  }
  const o = v as Record<string, unknown>
  if (o.achieved !== 0 && o.achieved !== 1) {
    throw new LoiQuyetToan('CORRUPT_STATE', `achieved phải là 0 hoặc 1: ${String(o.achieved)}`)
  }
  if (
    !laSoNguyenAnToan(o.raw_core) ||
    !laSoNguyenAnToan(o.core_paid) ||
    !laSoNguyenAnToan(o.compensation_paid) ||
    !laSoNguyenAnToan(o.revision)
  ) {
    throw new LoiQuyetToan('CORRUPT_STATE', 'ngày có giá trị không phải số nguyên an toàn >= 0')
  }
  if (!Number.isSafeInteger(o.revision + 1)) {
    throw new LoiQuyetToan('CORRUPT_STATE', 'revision ngày + 1 vượt số nguyên an toàn')
  }
  return {
    raw_core: o.raw_core,
    achieved: o.achieved,
    core_paid: o.core_paid,
    compensation_paid: o.compensation_paid,
    revision: o.revision,
  }
}

/** Read the persisted account row, or null when absent (fail closed downstream). */
async function docTaiKhoan(db: DbDoc, studentId: string): Promise<DongTaiKhoan | null> {
  const r = await db
    .prepare('SELECT wallet_exp, earned_exp, revision FROM cnh_exp_account WHERE student_id = ?')
    .bind(studentId)
    .first<DongTaiKhoan>()
  return r == null ? null : kiemTraDongTaiKhoan(r)
}

/** Read the persisted day row, or null when absent (fail closed downstream). */
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

/** Read the persisted receipt row, or null when this request has never committed. */
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
    .bind(studentId, LENH_QUYET_TOAN_CORE, requestId)
    .first<DongLenh>()
  return r ?? null
}

/**
 * Settle the current persisted core entitlement for one student/day.
 *
 * The caller supplies ONLY identity + idempotency; every money-relevant fact is read from the
 * persisted rows. Absent account/day fail closed (NOT_FOUND) — this substrate never invents a
 * wallet or a day, and never zeroes/resets a preexisting wallet.
 */
export async function quyetToanQuyenCore(
  env: Env,
  yeuCau: YeuCauQuyetToanCore,
  phuThuoc: PhuThuocQuyetToan = {},
): Promise<PhanHoiQuyetToanCore> {
  const uuid = phuThuoc.uuid ?? macDinhUuid
  const sleep = phuThuoc.sleep ?? macDinhSleep

  const { studentId, learningDay, requestHash, requestId } = yeuCau
  if (!studentId || !learningDay || !requestHash || !requestId) {
    throw new LoiQuyetToan('NOT_FOUND', 'thiếu studentId/learningDay/requestHash/requestId')
  }

  // ONE primary session for ALL reads AND the batch/confirmation (04 §5, §6): this command is a
  // read-after-write settlement, so it must NEVER read a replica. `first-primary` pins the
  // session to the primary; when the runtime has no sessions API we fall back to the raw DB
  // (which is already the primary). We do NOT use `first-unconstrained` here.
  const session: D1DatabaseSession | null =
    typeof env.DB.withSession === 'function' ? env.DB.withSession('first-primary') : null
  const dbDoc: DbDoc = session ?? env.DB
  const dbGhi: D1Database = (session as unknown as D1Database) ?? env.DB

  for (let lanThu = 0; lanThu < SO_LAN_THU_LAI; lanThu++) {
    // 1. Receipt first: same hash ⇒ replay the EXACT stored response; different hash ⇒ conflict.
    const lenhCu = await docLenh(dbDoc, studentId, requestId)
    if (lenhCu) {
      if (lenhCu.request_hash !== requestHash) {
        throw new LoiQuyetToan(
          'IDEMPOTENCY_CONFLICT',
          `request_id ${requestId} đã dùng với payload khác`,
        )
      }
      // Return the stored response UNCHANGED (no `replayed` flag, no mutation).
      return JSON.parse(lenhCu.response_json) as PhanHoiQuyetToanCore
    }

    // 2. Read persisted state on the primary (writes must see committed truth).
    const taiKhoan = await docTaiKhoan(dbDoc, studentId)
    const ngay = await docNgay(dbDoc, studentId, learningDay, PHIEN_BAN_CHINH_SACH)
    if (!taiKhoan || !ngay) {
      throw new LoiQuyetToan(
        'NOT_FOUND',
        `thiếu tài khoản hoặc ngày cho ${studentId}/${learningDay}`,
      )
    }

    // 3. Recompute entitlement from persisted rows (pure policy).
    const { entitlement, grant } = quyenCore({
      achieved: ngay.achieved === 1,
      rawCore: ngay.raw_core,
      corePaid: ngay.core_paid,
      compensationAlreadyPaid: ngay.compensation_paid,
    })

    // 4. Prevalidate overflow BEFORE touching the DB (fail closed, no partial writes).
    const walletAfter = taiKhoan.wallet_exp + grant
    const earnedAfter = taiKhoan.earned_exp + grant
    const corePaidAfter = ngay.core_paid + grant
    if (
      !laSoNguyenAnToan(walletAfter) ||
      !laSoNguyenAnToan(earnedAfter) ||
      !laSoNguyenAnToan(corePaidAfter)
    ) {
      throw new LoiQuyetToan('CORRUPT_STATE', 'tràn số nguyên khi cộng quyền core')
    }

    const executionId = uuid()
    const committedRevision = taiKhoan.revision + 1
    const semanticRevision = ngay.revision + 1
    const grantId = uuid()

    const phanHoi: PhanHoiQuyetToanCore = {
      commandType: LENH_QUYET_TOAN_CORE,
      studentId,
      learningDay,
      policyVersion: PHIEN_BAN_CHINH_SACH,
      entitlement,
      grant,
      walletAfter,
      earnedAfter,
      corePaidAfter,
      committedRevision,
    }
    const responseJson = JSON.stringify(phanHoi)

    // 5. One batch: claim, then every mutation guarded by claim.execution_id, then the
    //    in-transaction invariant guard. A losing claim makes all of these no-ops.
    //
    //    The claim uses `ON CONFLICT(student_id, command_type, request_id) DO NOTHING` so a lost
    //    same-key race is a SILENT no-op (0 rows) rather than a thrown UNIQUE error. That keeps
    //    the "losing claim ⇒ every following write is a no-op" contract without catching broad
    //    error text.
    const claim = dbGhi.prepare(
      `INSERT INTO cnh_exp_command
         (student_id, command_type, request_id, request_hash, execution_id, response_json, committed_revision)
       SELECT ?, ?, ?, ?, ?, ?, ?
        WHERE EXISTS (SELECT 1 FROM cnh_exp_account WHERE student_id = ? AND revision = ?)
          AND EXISTS (SELECT 1 FROM cnh_exp_day
                       WHERE student_id = ? AND learning_day = ? AND policy_version = ? AND revision = ?)
       ON CONFLICT (student_id, command_type, request_id) DO NOTHING`,
    ).bind(
      studentId,
      LENH_QUYET_TOAN_CORE,
      requestId,
      requestHash,
      executionId,
      responseJson,
      committedRevision,
      studentId,
      taiKhoan.revision,
      studentId,
      learningDay,
      PHIEN_BAN_CHINH_SACH,
      ngay.revision,
    )

    const capTaiKhoan = dbGhi.prepare(
      `UPDATE cnh_exp_account
          SET wallet_exp = wallet_exp + ?, earned_exp = earned_exp + ?, revision = revision + 1,
              cap_nhat_luc = datetime('now')
        WHERE student_id = ? AND revision = ?
          AND EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
    ).bind(grant, grant, studentId, taiKhoan.revision, executionId)

    const capNgay = dbGhi.prepare(
      `UPDATE cnh_exp_day
          SET core_paid = core_paid + ?, revision = revision + 1, cap_nhat_luc = datetime('now')
        WHERE student_id = ? AND learning_day = ? AND policy_version = ? AND revision = ?
          AND EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
    ).bind(grant, studentId, learningDay, PHIEN_BAN_CHINH_SACH, ngay.revision, executionId)

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
    //     ⇒ hard SQL error ⇒ the whole batch rolls back. A failed invariant can NEVER be a silent
    //     0-row no-op (which would let a false-success receipt commit).
    //   * Claim lost (no row for execution_id) ⇒ outer WHERE is false ⇒ inserts NOTHING (no-op),
    //     so a losing claim commits nothing and is retried by the caller.
    // We verify RESULTING VALUES (wallet/earned/core_paid/revisions and the ledger amount/identity),
    // not merely row counts. A zero-grant settlement still writes exactly ONE ledger audit row
    // (amount 0), so the ledger invariant below holds for every successful command.
    const guard = dbGhi.prepare(
      `INSERT INTO cnh_exp_guard (execution_id, ok)
       SELECT ?,
              CASE WHEN
                (SELECT COUNT(*) FROM cnh_exp_account
                  WHERE student_id = ? AND revision = ? AND wallet_exp = ? AND earned_exp = ?) = 1
                AND (SELECT COUNT(*) FROM cnh_exp_day
                      WHERE student_id = ? AND learning_day = ? AND policy_version = ?
                        AND revision = ? AND core_paid = ?) = 1
                AND (SELECT COUNT(*) FROM cnh_exp_grant_ledger
                      WHERE execution_id = ? AND grant_id = ? AND student_id = ?
                        AND learning_day = ? AND policy_version = ? AND semantic_revision = ?
                        AND amount = ?) = 1
              THEN 1 ELSE 0 END
        WHERE EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
    ).bind(
      executionId,
      studentId,
      committedRevision,
      walletAfter,
      earnedAfter,
      studentId,
      learningDay,
      PHIEN_BAN_CHINH_SACH,
      semanticRevision,
      corePaidAfter,
      executionId,
      grantId,
      studentId,
      learningDay,
      PHIEN_BAN_CHINH_SACH,
      semanticRevision,
      grant,
      executionId,
    )

    // Unexpected SQL/CHECK/ledger-uniqueness failures PROPAGATE (rollback) — never swallowed into
    // a retry. A lost same-key claim is a silent no-op (ON CONFLICT DO NOTHING), so it does NOT
    // throw here; we detect it below by re-reading the receipt.
    await dbGhi.batch([claim, capTaiKhoan, capNgay, ghiSo, guard])

    // 6. Confirm the claim actually committed (a losing claim is a silent no-op).
    const daClaim = await docLenh(dbDoc, studentId, requestId)
    if (!daClaim) {
      await sleep(jitter(LICH_CHO_MS[Math.min(lanThu, LICH_CHO_MS.length - 1)]))
      continue
    }
    if (daClaim.request_hash !== requestHash) {
      throw new LoiQuyetToan(
        'IDEMPOTENCY_CONFLICT',
        `request_id ${requestId} đã dùng với payload khác`,
      )
    }
    // Return the stored response UNCHANGED (no `replayed` flag, no mutation).
    return JSON.parse(daClaim.response_json) as PhanHoiQuyetToanCore
  }

  throw new LoiQuyetToan('RETRYABLE_CONFLICT', 'hết lượt thử lại quyết toán quyền core')
}
