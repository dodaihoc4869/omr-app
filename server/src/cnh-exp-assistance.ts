// P07 authoritative assistance command.
// CNH-1.0 P07 — AUTHORITATIVE ASSISTANCE COMMAND (internal, server-only, NOT activated).
//
// ⚠️ SCOPE: this module is the ONLY path that may assert `assistance = 'assisted'` for an attempt.
// It persists the assistance fact + a durable content-group exposure lock + a command receipt,
// atomically, BEFORE any caller may return hint/reveal content (04 §4.3). It does NOT return hint
// content, is NOT an HTTP route, and does NOT implement embargo/release, correction, optional
// pricing, or cutover. Those are SEPARATE jobs.
//
// ⚠️ AUTHORITY: `cnh_exp_attempt_control` is the server-mutable control record; `cnh_exp_exposure_lock`
// is the durable content-group exposure fact. Both are written in the SAME batch as the receipt.
//
// Reuse (no reimplementation):
//   * `docAnhChup` (cnh-exp-task.ts) — verified immutable snapshot read (hash + indexed columns).
//   * `jsonChuanHoa` / `bamSha256` (cnh-exp-task.ts) — canonical hashing.
//   * The CAS + CHECK-guard transaction shape proven in cnh-exp-ledger.ts / cnh-exp-submit.ts (04 §5).
//
// Transaction shape (04 §5), ONE batch, ONE primary session:
//   1. Read the REQUEST receipt by idempotency key FIRST: same hash ⇒ replay the EXACT stored
//      response; different hash ⇒ IDEMPOTENCY_CONFLICT. This MUST precede the semantic-receipt
//      check so a request key reused with a different payload is always a conflict.
//   2. Read the SEMANTIC receipt by (attempt, kind): a same-action replay under a NEW request key
//      returns the ORIGINAL response verbatim and does NOT bump the control revision again. This
//      is what makes the `none`/`unknown` → `assisted` transition MONOTONIC (exactly once). The
//      replay ATOMICALLY binds the new request key as a durable alias receipt (original response,
//      requested hash, original committed revision, fresh execution_id) with
//      `ON CONFLICT(request key) DO NOTHING`, then reads back and hash-validates the key. No
//      control/lock mutation happens on a semantic replay.
//   3. Read authoritative control + snapshot on the PRIMARY session.
//   4. Fresh `execution_id` per CAS attempt; claim via INSERT..SELECT guarded by the control
//      revision, the exposure-lock presence/revision, the ABSENCE of a semantic receipt for
//      (attempt, kind), AND the request UNIQUE key, with
//      `ON CONFLICT(student_id, command_type, request_id) DO NOTHING` so a lost same-key claim is
//      a silent no-op (NOT a thrown UNIQUE error).
//   5. Every subsequent mutation is guarded by `claim.execution_id`: EVERY existing sibling
//      control row in the same (student, content_group) exposure is transitioned to `assisted`
//      with a revision bump (only when not already `assisted`), the exposure lock is upserted with
//      a revision bump, the semantic receipt is written (a plain guarded insert — NOT
//      `ON CONFLICT DO NOTHING`, so a claimed duplicate side effect fails loudly), and the request
//      receipt is written — all in the SAME batch.
//   6. An in-transaction invariant guard (`cnh_exp_assistance_guard`, `CHECK (ok = 1)`) rolls the
//      batch back if the claim succeeded but a required row was not applied OR the resulting
//      values are not exactly what we computed. A FAILED invariant inserts `ok = 0` and VIOLATES
//      the CHECK (hard rollback) — never a silent 0-row no-op.
//   7. A losing claim makes every following write a no-op; we then re-read the receipt and retry,
//      bounded, with backoff + jitter. Exhaustion is a typed retryable error, never a false
//      success. Unexpected SQL/CHECK failures PROPAGATE immediately (rollback).
//
// No clock, no randomness, no I/O in the pure path. `sleep`/`uuid` are injectable ONLY so tests
// can be deterministic; production defaults are safe. `receivedAt` is passed by a trusted adapter.
//
// ⚠️ EXPOSURE IDENTITY (documented, NOT invented): see the header of
// migration-2309-cnh-exp-submit.sql. The exposure lock is keyed by `(student_id, content_group)`
// with NO day component (matching §3 `active_reservation`).
//
// ⚠️ EXPOSURE LIFECYCLE — UNRESOLVED, NOT APPROVED (acceptance backlog, MUST be specified before
// route activation): the spec does NOT define whether a learning exposure resets across VN
// learning days or is further scoped by plan. This module deliberately does NOT reset by day and
// does NOT invent a reset rule. The claim that a permanent (student, content_group) ban is
// "spec-mandated" is UNSUPPORTED and is NOT made here. The current lock scope is the existing
// cross-channel protection fix; the exposure lifecycle remains an open acceptance item. This
// module stays INTERNAL and UNACTIVATED until that is resolved.

import type { D1Database, D1DatabaseSession, Env } from './kieu'
import { docAnhChup, bamSha256, jsonChuanHoa, type AnhChupNhiemVu } from './cnh-exp-task'

/** The only command type this substrate settles today. */
export const LENH_TRO_GIUP = 'assistance' as const

/** Policy version this substrate writes. Cutover/versioning is a separate job. */
export const PHIEN_BAN_CHINH_SACH = 'CNH-1.0' as const

/** Bounded retry schedule (04 §5.7): 20/40/80/160/320 ms with small jitter. */
export const SO_LAN_THU_LAI = 5
const LICH_CHO_MS = [20, 40, 80, 160, 320] as const

/** The assistance kinds a caller may request. Both lock the exposure to `assisted`. */
export type LoaiTroGiup = 'hint' | 'reveal'

/** Assistance states the server may assert for an attempt. */
export type TroGiup = 'none' | 'assisted' | 'unknown'

/** Typed, stable error codes (04 §4.4). */
export type MaLoiTroGiup =
  | 'IDEMPOTENCY_CONFLICT'
  | 'RETRYABLE_CONFLICT'
  | 'NOT_FOUND'
  | 'NOT_RELEASED'
  | 'NOT_ACTIVE'
  | 'SESSION_EXPIRED'
  | 'CORRUPT_STATE'

export class LoiTroGiup extends Error {
  readonly ma: MaLoiTroGiup
  constructor(ma: MaLoiTroGiup, thongDiep: string) {
    super(thongDiep)
    this.name = 'LoiTroGiup'
    this.ma = ma
  }
}

/** Injectable side effects — production defaults are safe; tests override for determinism. */
export interface PhuThuocTroGiup {
  /** Fresh unique id per CAS attempt. Defaults to `crypto.randomUUID()`. */
  uuid?: () => string
  /** Backoff sleep. Defaults to a real timer. */
  sleep?: (ms: number) => Promise<void>
}

/** Input the caller supplies. NOTE: no independence flag, no assistance state — server-derived. */
export interface YeuCauTroGiup {
  /** Authenticated student id (server-derived; never trusted from the client body). */
  studentId: string
  /** The issued attempt the hint/reveal is for. */
  attemptId: string
  /** Client-supplied idempotency key. */
  requestId: string
  /** Explicit hint/reveal kind. */
  kind: LoaiTroGiup
  /** Server clock (epoch ms) at which the request was received. */
  receivedAt: number
}

/**
 * The exact response persisted and replayed byte-for-byte.
 *
 * NOTE: there is deliberately NO `replayed` field and NO hint/reveal CONTENT. This receipt is the
 * durable proof that assistance was recorded; a caller may return content ONLY after this command
 * commits. The response NEVER contains the answer key, solution, or grading material.
 */
export interface PhanHoiTroGiup {
  commandType: typeof LENH_TRO_GIUP
  studentId: string
  attemptId: string
  contentGroup: string
  kind: LoaiTroGiup
  assistance: 'assisted'
  policyVersion: string
  controlRevision: number
}

interface DongDieuKhien {
  assistance: string
  released: number
  active: number
  revision: number
}

interface DongLenh {
  request_hash: string
  response_json: string
}

interface DongKhoa {
  revision: number
}

interface DongBienNhan {
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

function kiemTraDongDieuKhien(v: unknown): DongDieuKhien {
  if (typeof v !== 'object' || v === null) {
    throw new LoiTroGiup('CORRUPT_STATE', 'dòng điều khiển không phải object')
  }
  const o = v as Record<string, unknown>
  if (o.assistance !== 'none' && o.assistance !== 'assisted' && o.assistance !== 'unknown') {
    throw new LoiTroGiup('CORRUPT_STATE', `assistance không hợp lệ: ${String(o.assistance)}`)
  }
  if (o.released !== 0 && o.released !== 1) {
    throw new LoiTroGiup('CORRUPT_STATE', `released phải là 0 hoặc 1: ${String(o.released)}`)
  }
  if (o.active !== 0 && o.active !== 1) {
    throw new LoiTroGiup('CORRUPT_STATE', `active phải là 0 hoặc 1: ${String(o.active)}`)
  }
  if (!laSoNguyenAnToan(o.revision)) {
    throw new LoiTroGiup('CORRUPT_STATE', 'revision điều khiển không phải số nguyên an toàn >= 0')
  }
  if (!Number.isSafeInteger(o.revision + 1)) {
    throw new LoiTroGiup('CORRUPT_STATE', 'revision điều khiển + 1 vượt số nguyên an toàn')
  }
  return { assistance: o.assistance, released: o.released, active: o.active, revision: o.revision }
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
    .bind(studentId, LENH_TRO_GIUP, requestId)
    .first<DongLenh>()
  return r ?? null
}

/**
 * Read the durable SEMANTIC receipt for (student, attempt, kind), or null when this semantic
 * action has never committed. A same-action replay under a NEW request key returns this ORIGINAL
 * response verbatim — the monotonic-transition record.
 */
async function docBienNhan(
  db: DbDoc,
  studentId: string,
  attemptId: string,
  kind: LoaiTroGiup,
): Promise<DongBienNhan | null> {
  const r = await db
    .prepare(
      `SELECT response_json
         FROM cnh_exp_assistance_receipt
        WHERE student_id = ? AND attempt_id = ? AND kind = ?`,
    )
    .bind(studentId, attemptId, kind)
    .first<DongBienNhan>()
  return r ?? null
}

/**
 * Read the durable exposure lock for (student, content_group), or null when absent. The lock's
 * `revision` is the CAS guard the submission command reads.
 */
async function docKhoa(
  db: DbDoc,
  studentId: string,
  contentGroup: string,
): Promise<DongKhoa | null> {
  const r = await db
    .prepare(
      `SELECT revision FROM cnh_exp_exposure_lock WHERE student_id = ? AND content_group = ?`,
    )
    .bind(studentId, contentGroup)
    .first<DongKhoa>()
  if (r == null) return null
  if (!laSoNguyenAnToan(r.revision)) {
    throw new LoiTroGiup('CORRUPT_STATE', 'revision khoá phơi nhiễm không phải số nguyên an toàn >= 0')
  }
  return { revision: r.revision }
}

/**
 * Canonical hash of the assistance request: the attempt identity + the explicit kind.
 * The caller NEVER supplies this. Deterministic: same attempt + same kind ⇒ same hash.
 */
export async function bamYeuCauTroGiup(attemptId: string, kind: LoaiTroGiup): Promise<string> {
  const json = jsonChuanHoa({ attemptId, kind })
  return bamSha256(json)
}

/**
 * Record authoritative assistance for ONE issued attempt, atomically.
 *
 * The caller supplies ONLY identity + kind + idempotency + server clock. The assistance state is
 * SERVER-asserted: this command sets `assistance = 'assisted'` on the attempt's control row AND
 * inserts a durable content-group exposure lock, so EVERY issued attempt in the same
 * (student, content_group) exposure is permanently `assisted` (04 §4.3). No wallet/day/EXP is
 * touched. A caller may return hint/reveal content ONLY after this command commits.
 */
export async function ghiTroGiup(
  env: Env,
  yeuCau: YeuCauTroGiup,
  phuThuoc: PhuThuocTroGiup = {},
): Promise<PhanHoiTroGiup> {
  const uuid = phuThuoc.uuid ?? macDinhUuid
  const sleep = phuThuoc.sleep ?? macDinhSleep

  const { studentId, attemptId, requestId, kind, receivedAt } = yeuCau
  if (!studentId || !attemptId || !requestId) {
    throw new LoiTroGiup('NOT_FOUND', 'thiếu studentId/attemptId/requestId')
  }
  if (kind !== 'hint' && kind !== 'reveal') {
    throw new LoiTroGiup('CORRUPT_STATE', `kind không hợp lệ: ${String(kind)}`)
  }
  if (!laSoNguyenAnToan(receivedAt)) {
    throw new LoiTroGiup('CORRUPT_STATE', `receivedAt phải là số nguyên an toàn >= 0: ${String(receivedAt)}`)
  }

  const requestHash = await bamYeuCauTroGiup(attemptId, kind)

  // ONE primary session for ALL reads AND the batch/confirmation (04 §5, §6): this command is a
  // read-after-write settlement, so it must NEVER read a replica.
  const session: D1DatabaseSession | null =
    typeof env.DB.withSession === 'function' ? env.DB.withSession('first-primary') : null
  const dbDoc: DbDoc = session ?? env.DB
  const dbGhi: D1Database = (session as unknown as D1Database) ?? env.DB

  for (let lanThu = 0; lanThu < SO_LAN_THU_LAI; lanThu++) {
    // 1. REQUEST receipt FIRST: same hash ⇒ replay the EXACT stored response; different hash ⇒
    //    IDEMPOTENCY_CONFLICT. This MUST run before the semantic-receipt check so that reusing a
    //    request key with a DIFFERENT payload is always a conflict — even when the semantic action
    //    (attempt, kind) already exists. Checking the semantic receipt first would let a caller
    //    reuse a request key with a different payload and silently receive the semantic response.
    const lenhCu = await docLenh(dbDoc, studentId, requestId)
    if (lenhCu) {
      if (lenhCu.request_hash !== requestHash) {
        throw new LoiTroGiup(
          'IDEMPOTENCY_CONFLICT',
          `request_id ${requestId} đã dùng với payload khác`,
        )
      }
      return JSON.parse(lenhCu.response_json) as PhanHoiTroGiup
    }

    // 2. SEMANTIC receipt: a same-action replay under a NEW request key returns the ORIGINAL
    //    response verbatim and does NOT bump the control revision again. This is the monotonic
    //    `none`/`unknown` → `assisted` transition record. We MUST still bind THIS new request key
    //    as a durable alias receipt (with the ORIGINAL response, the requested hash and the
    //    ORIGINAL committed revision) so the key is hash-bound and a later reuse with a different
    //    payload is a conflict. No control/lock mutation happens on a semantic replay.
    const bienNhan = await docBienNhan(dbDoc, studentId, attemptId, kind)
    if (bienNhan) {
      const gocPhanHoi = JSON.parse(bienNhan.response_json) as PhanHoiTroGiup
      const aliasExecutionId = uuid()
      await dbGhi
        .prepare(
          `INSERT INTO cnh_exp_command
             (student_id, command_type, request_id, request_hash, execution_id, response_json, committed_revision)
           SELECT ?, ?, ?, ?, ?, ?, ?
            WHERE EXISTS (SELECT 1 FROM cnh_exp_assistance_receipt
                           WHERE student_id = ? AND attempt_id = ? AND kind = ?)
           ON CONFLICT (student_id, command_type, request_id) DO NOTHING`,
        )
        .bind(
          studentId,
          LENH_TRO_GIUP,
          requestId,
          requestHash,
          aliasExecutionId,
          bienNhan.response_json,
          gocPhanHoi.controlRevision,
          studentId,
          attemptId,
          kind,
        )
        .run()

      // Read back the alias (or a pre-existing row for this key) and validate its hash.
      const alias = await docLenh(dbDoc, studentId, requestId)
      if (!alias) {
        throw new LoiTroGiup('CORRUPT_STATE', `không đọc được bí danh ${requestId}`)
      }
      if (alias.request_hash !== requestHash) {
        throw new LoiTroGiup(
          'IDEMPOTENCY_CONFLICT',
          `request_id ${requestId} đã dùng với payload khác`,
        )
      }
      return JSON.parse(alias.response_json) as PhanHoiTroGiup
    }

    // 3. Read authoritative control + verified immutable snapshot on the primary.
    const dieuKhien = await docDieuKhien(dbDoc, studentId, attemptId)
    if (!dieuKhien) {
      throw new LoiTroGiup('NOT_FOUND', `thiếu điều khiển cho ${studentId}/${attemptId}`)
    }
    if (dieuKhien.active !== 1) {
      throw new LoiTroGiup('NOT_ACTIVE', `attempt ${attemptId} không còn hiệu lực`)
    }
    if (dieuKhien.released !== 1) {
      throw new LoiTroGiup('NOT_RELEASED', `attempt ${attemptId} chưa được phát hành`)
    }

    const snapshot: AnhChupNhiemVu | null = await docAnhChup(env.DB, studentId, attemptId)
    if (!snapshot) {
      throw new LoiTroGiup('NOT_FOUND', `thiếu ảnh chụp cho ${studentId}/${attemptId}`)
    }
    if (snapshot.policy.version !== PHIEN_BAN_CHINH_SACH) {
      throw new LoiTroGiup('CORRUPT_STATE', `policy.version không hỗ trợ: ${snapshot.policy.version}`)
    }
    if (receivedAt < snapshot.issuedAt || receivedAt >= snapshot.expiresAt) {
      throw new LoiTroGiup('SESSION_EXPIRED', `receivedAt ngoài cửa sổ hiệu lực của attempt ${attemptId}`)
    }

    // Read the exposure lock (if any) so the claim can CAS on its presence AND revision: a lock
    // created between this read and the batch loses the CAS and we re-read.
    const khoa = await docKhoa(dbDoc, studentId, snapshot.contentGroup)

    const executionId = uuid()
    // The control revision is bumped ONLY when the target attempt is not already `assisted`
    // (monotonic transition). A re-issue for an already-assisted attempt keeps the revision.
    const controlRevision = dieuKhien.assistance === 'assisted' ? dieuKhien.revision : dieuKhien.revision + 1
    const lockRevision = (khoa?.revision ?? -1) + 1

    const phanHoi: PhanHoiTroGiup = {
      commandType: LENH_TRO_GIUP,
      studentId,
      attemptId,
      contentGroup: snapshot.contentGroup,
      kind,
      assistance: 'assisted',
      policyVersion: PHIEN_BAN_CHINH_SACH,
      controlRevision,
    }
    const responseJson = JSON.stringify(phanHoi)

    // 4. One batch: claim, then every mutation guarded by claim.execution_id, then the
    //    in-transaction invariant guard. A losing claim makes all of these no-ops.
    //
    //    The claim is guarded by the control revision, the exposure-lock presence/revision, the
    //    ABSENCE of a semantic receipt for (attempt, kind), AND the request UNIQUE key, so a
    //    concurrent control change, a concurrent lock creation, OR a concurrent command that
    //    already performed this semantic action loses the CAS (and we re-read the original).
    const claim = dbGhi.prepare(
      `INSERT INTO cnh_exp_command
         (student_id, command_type, request_id, request_hash, execution_id, response_json, committed_revision)
       SELECT ?, ?, ?, ?, ?, ?, ?
        WHERE EXISTS (SELECT 1 FROM cnh_exp_attempt_control
                       WHERE student_id = ? AND attempt_id = ? AND revision = ?)
          AND (? = 0 OR EXISTS (SELECT 1 FROM cnh_exp_exposure_lock
                                 WHERE student_id = ? AND content_group = ? AND revision = ?))
          AND (? = 1 OR NOT EXISTS (SELECT 1 FROM cnh_exp_exposure_lock
                                     WHERE student_id = ? AND content_group = ?))
          AND NOT EXISTS (SELECT 1 FROM cnh_exp_assistance_receipt
                           WHERE student_id = ? AND attempt_id = ? AND kind = ?)
       ON CONFLICT (student_id, command_type, request_id) DO NOTHING`,
    ).bind(
      studentId,
      LENH_TRO_GIUP,
      requestId,
      requestHash,
      executionId,
      responseJson,
      controlRevision,
      studentId,
      attemptId,
      dieuKhien.revision,
      khoa ? 1 : 0,
      studentId,
      snapshot.contentGroup,
      khoa?.revision ?? 0,
      khoa ? 1 : 0,
      studentId,
      snapshot.contentGroup,
      studentId,
      attemptId,
      kind,
    )

    // Transition EVERY existing sibling control row in the same (student, content_group) exposure
    // to `assisted`, bumping the revision ONLY when it is not already `assisted` (monotonic). The
    // target attempt is included. Guarded by the claim.
    const capDieuKhien = dbGhi.prepare(
      `UPDATE cnh_exp_attempt_control
          SET assistance = 'assisted',
              revision = revision + CASE WHEN assistance = 'assisted' THEN 0 ELSE 1 END,
              cap_nhat_luc = datetime('now')
        WHERE student_id = ?
          AND attempt_id IN (
            SELECT attempt_id FROM cnh_exp_task
             WHERE student_id = ? AND content_group = ?
          )
          AND EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
    ).bind(studentId, studentId, snapshot.contentGroup, executionId)

    // Durable content-group exposure lock: upsert with a revision bump. The lock is created on
    // first assistance and its revision is bumped on every subsequent assistance command, so a
    // submission that read an older lock revision loses the CAS.
    //
    // NOTE: `cnh_exp_exposure_lock` has NO `cap_nhat_luc` column (see
    // migration-2309-cnh-exp-submit.sql) — only `tao_luc`. The upsert therefore updates ONLY the
    // columns that actually exist; referencing a nonexistent column would fail the whole batch.
    const ghiKhoa = dbGhi.prepare(
      `INSERT INTO cnh_exp_exposure_lock
         (student_id, content_group, attempt_id, assistance, execution_id, revision)
       SELECT ?, ?, ?, 'assisted', ?, ?
        WHERE EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)
       ON CONFLICT (student_id, content_group) DO UPDATE SET
         revision = revision + 1,
         execution_id = excluded.execution_id`,
    ).bind(studentId, snapshot.contentGroup, attemptId, executionId, lockRevision, executionId)

    // Durable SEMANTIC receipt: ONE row per (student, attempt, kind). Written in the SAME batch as
    // the transition, so a same-action replay under a new key returns this ORIGINAL response.
    //
    // The claim already required `NOT EXISTS` on this semantic receipt, so a CLAIMED command is
    // guaranteed to be the FIRST semantic action. We therefore do NOT use
    // `ON CONFLICT ... DO NOTHING` here: masking a duplicate would hide a claimed duplicate side
    // effect. A duplicate insert (which would mean the claim guard was bypassed) raises a real
    // UNIQUE error and rolls the whole batch back.
    const ghiBienNhan = dbGhi.prepare(
      `INSERT INTO cnh_exp_assistance_receipt
         (student_id, attempt_id, kind, execution_id, response_json)
       SELECT ?, ?, ?, ?, ?
        WHERE EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
    ).bind(studentId, attemptId, kind, executionId, responseJson, executionId)

    // In-transaction invariant guard (04 §5.6). The ONLY condition in the outer WHERE is that the
    // claim committed; the post-state invariants live in a `CASE WHEN ... THEN 1 ELSE 0 END` in
    // the SELECT list. This is deliberate and load-bearing:
    //   * Claim committed + invariants hold  ⇒ inserts (execution_id, 1) ⇒ CHECK(ok=1) passes.
    //   * Claim committed + invariant FAILS  ⇒ inserts (execution_id, 0) ⇒ CHECK(ok=1) VIOLATES
    //     ⇒ hard SQL error ⇒ the whole batch rolls back.
    //   * Claim lost (no row for execution_id) ⇒ outer WHERE is false ⇒ inserts NOTHING (no-op).
    // We verify RESULTING VALUES (target control assistance/revision, EVERY sibling control
    // assistance, exposure lock revision, semantic receipt, request receipt), not merely row
    // counts.
    const guard = dbGhi.prepare(
      `INSERT INTO cnh_exp_assistance_guard (execution_id, ok)
       SELECT ?,
              CASE WHEN
                (SELECT COUNT(*) FROM cnh_exp_attempt_control
                  WHERE student_id = ? AND attempt_id = ? AND assistance = 'assisted'
                    AND revision = ?) = 1
                AND (SELECT COUNT(*) FROM cnh_exp_attempt_control
                      WHERE student_id = ? AND attempt_id IN (
                        SELECT attempt_id FROM cnh_exp_task
                         WHERE student_id = ? AND content_group = ?
                      ) AND assistance <> 'assisted') = 0
                AND (SELECT COUNT(*) FROM cnh_exp_exposure_lock
                      WHERE student_id = ? AND content_group = ? AND assistance = 'assisted'
                        AND revision = ?) = 1
                AND (SELECT COUNT(*) FROM cnh_exp_assistance_receipt
                      WHERE student_id = ? AND attempt_id = ? AND kind = ?
                        AND execution_id = ? AND response_json = ?) = 1
                AND (SELECT COUNT(*) FROM cnh_exp_command
                      WHERE student_id = ? AND command_type = ? AND request_id = ?
                        AND request_hash = ? AND execution_id = ?) = 1
              THEN 1 ELSE 0 END
        WHERE EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
    ).bind(
      executionId,
      studentId,
      attemptId,
      controlRevision,
      studentId,
      studentId,
      snapshot.contentGroup,
      studentId,
      snapshot.contentGroup,
      lockRevision,
      studentId,
      attemptId,
      kind,
      executionId,
      responseJson,
      studentId,
      LENH_TRO_GIUP,
      requestId,
      requestHash,
      executionId,
      executionId,
    )

    // Unexpected SQL/CHECK failures PROPAGATE (rollback) — never swallowed into a retry. A lost
    // same-key claim is a silent no-op (ON CONFLICT DO NOTHING), so it does NOT throw here; we
    // detect it below by re-reading the receipt.
    await dbGhi.batch([claim, capDieuKhien, ghiKhoa, ghiBienNhan, guard])

    // 5. Confirm the claim actually committed (a losing claim is a silent no-op).
    const daClaim = await docLenh(dbDoc, studentId, requestId)
    if (!daClaim) {
      await sleep(jitter(LICH_CHO_MS[Math.min(lanThu, LICH_CHO_MS.length - 1)]))
      continue
    }
    if (daClaim.request_hash !== requestHash) {
      throw new LoiTroGiup(
        'IDEMPOTENCY_CONFLICT',
        `request_id ${requestId} đã dùng với payload khác`,
      )
    }
    return JSON.parse(daClaim.response_json) as PhanHoiTroGiup
  }

  throw new LoiTroGiup('RETRYABLE_CONFLICT', 'hết lượt thử lại ghi trợ giúp')
}
