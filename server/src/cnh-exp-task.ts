// CNH-1.0 P07 — immutable SERVER-ISSUED task/attempt reward snapshot registry.
//
// Scope of THIS file (deliberately narrow):
//   * Typed, runtime-validated snapshot of ONE server-issued task/attempt (04 §2 AssignmentSnapshot).
//   * Canonical JSON (recursive key sort, array order preserved) + SHA-256 via crypto.subtle.
//   * Immutable issuance: INSERT ... ON CONFLICT(student_id,attempt_id) DO NOTHING, then read the
//     actual row. Same hash ⇒ original row unchanged; different hash ⇒ typed SNAPSHOT_CONFLICT.
//   * Reader by authenticated (student_id, attempt_id) ONLY. Never a qid-latest lookup, never a
//     cross-student fallback.
//   * A separate public DTO allowlist that NEVER leaks the grading key/policy or order mapping.
//
// Explicitly OUT of scope here (integration is the NEXT job):
//   * Grant calculation / ledger writes / wallet mutation. This module stores facts only.
//   * HTTP routes. `publicDto` is a pure function, NOT a route.
//   * Cutover / policy versioning beyond recording `policyVersion` on the snapshot.
//   * The legacy `cau_snapshot` (sbd,qid) store is untouched.
//
// ADAPTER CONTRACT: before any reward is activated, BOTH issuance and submission must be routed
// through this registry (issueTaskSnapshot on issue, readTaskSnapshot on submit). Until then this
// table is inert evidence and MUST NOT be treated as a payout source.
//
// No clock, no randomness, no I/O beyond the injected D1 handle. Deterministic: same input ⇒ same hash.

import type { D1Database, D1DatabaseSession, D1PreparedStatement } from './kieu'

/** Difficulty levels: 0 = Biết, 1 = Hiểu, 2 = Vận dụng. */
export type DoKho = 0 | 1 | 2

/** Question parts. */
export type Phan = 'I' | 'II' | 'III'

/** Reward bucket. Chosen by the server at issuance; never by the client. */
export type NhomThuong = 'core' | 'optional'

/**
 * Purpose vocabulary — the FULL 04 §2 union (NOT the narrower optional-only list in
 * cnh-exp-policy.ts). The purpose is IMMUTABLE and server-issued.
 */
export type MucDich =
  | 'maintenance'
  | 'consolidation'
  | 'repair'
  | 'homework_slice'
  | 'return'
  | 'probe'
  | 'due_review'
  | 'transfer'
  | 'repair_complete'
  | 'peer_help'
  | 'speed_practice'

/** Policy reference pinned onto every snapshot (04 §2 PolicyRef). */
export interface ThamChieuChinhSach {
  readonly version: 'CNH-1.0'
  readonly curriculumRevision: number
  readonly bankRevision: number
  readonly protectionRevision: number
  readonly learnerRevision: number
}

/**
 * Server-only grading material. NEVER returned by `publicDto`.
 * `key` and `gradingPolicy` are opaque server structures; `orderMapping` preserves the
 * issued question/option order (arrays are NOT sorted).
 */
export interface VatLieuChamServer {
  /** Opaque grading key (answer payload). Server-only. */
  readonly key: unknown
  /** Opaque grading policy. Server-only. */
  readonly gradingPolicy: unknown
  /** Question/option order mapping as issued. Array order is preserved verbatim. */
  readonly orderMapping: unknown
}

/**
 * Optional, purpose-specific evidence reference (help/repair opportunities).
 * Validated STRUCTURALLY only: this module does NOT assert the referenced facts are true.
 * A later adapter MUST verify the referenced evidence before any payout.
 */
export interface ThamChieuBangChung {
  readonly kind: string
  readonly refId: string
  readonly [k: string]: unknown
}

/** The full server-only snapshot stored in `cnh_exp_task.snapshot_json`. */
export interface AnhChupNhiemVu {
  readonly taskId: string
  readonly attemptId: string
  readonly studentId: string
  readonly qid: string
  readonly questionVersion: string
  readonly contentGroup: string
  readonly familyId: string | null
  readonly skillIds: readonly string[]
  readonly difficulty: DoKho
  readonly part: Phan
  readonly purpose: MucDich
  readonly bucket: NhomThuong
  readonly planId: string
  readonly planRevision: number
  readonly policy: ThamChieuChinhSach
  readonly issuedAt: number
  readonly expiresAt: number
  readonly expectedSeconds: number
  /** Server-only grading material. */
  readonly grading: VatLieuChamServer
  /** Optional purpose-specific evidence reference (validated structurally, not asserted). */
  readonly evidenceRef?: ThamChieuBangChung
}

/** Public DTO — explicit allowlist. NEVER contains grading key/policy or order mapping. */
export interface AnhChupCongKhai {
  readonly taskId: string
  readonly attemptId: string
  readonly qid: string
  readonly questionVersion: string
  readonly part: Phan
  readonly difficulty: DoKho
  readonly purpose: MucDich
  readonly bucket: NhomThuong
  readonly expiresAt: number
  readonly expectedSeconds: number
}

/** Typed error codes for issuance/read failures. */
export type MaLoiAnhChup =
  | 'SNAPSHOT_CONFLICT'
  | 'SNAPSHOT_NOT_FOUND'
  | 'SNAPSHOT_INVALID'
  | 'CORRUPT_SNAPSHOT'

export class LoiAnhChup extends Error {
  readonly ma: MaLoiAnhChup
  constructor(ma: MaLoiAnhChup, thongDiep: string) {
    super(thongDiep)
    this.name = 'LoiAnhChup'
    this.ma = ma
  }
}

const PHAN_HOP_LE: readonly Phan[] = ['I', 'II', 'III']
const NHOM_HOP_LE: readonly NhomThuong[] = ['core', 'optional']
const MUC_DICH_HOP_LE: readonly MucDich[] = [
  'maintenance',
  'consolidation',
  'repair',
  'homework_slice',
  'return',
  'probe',
  'due_review',
  'transfer',
  'repair_complete',
  'peer_help',
  'speed_practice',
]

/** Reject anything that is not a non-empty string. */
function chuoiKhongRong(v: unknown, ten: string): string {
  if (typeof v !== 'string' || v.length === 0) {
    throw new LoiAnhChup('SNAPSHOT_INVALID', `${ten} phải là chuỗi không rỗng: ${String(v)}`)
  }
  return v
}

/** Reject anything that is not a non-negative safe integer. */
function soNguyenAnToan(v: unknown, ten: string): number {
  if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 0) {
    throw new LoiAnhChup('SNAPSHOT_INVALID', `${ten} phải là số nguyên an toàn >= 0: ${String(v)}`)
  }
  return v
}

/** Reject anything that is not a non-negative safe integer (server clock). */
function kiemTraDongHo(v: unknown, ten: string): number {
  if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 0) {
    throw new LoiAnhChup('SNAPSHOT_INVALID', `${ten} phải là số nguyên an toàn >= 0: ${String(v)}`)
  }
  return v
}

function kiemTraPhan(v: unknown): Phan {
  if (typeof v !== 'string' || !PHAN_HOP_LE.includes(v as Phan)) {
    throw new LoiAnhChup('SNAPSHOT_INVALID', `part không hợp lệ: ${String(v)}`)
  }
  return v as Phan
}

function kiemTraDoKho(v: unknown): DoKho {
  if (v !== 0 && v !== 1 && v !== 2) {
    throw new LoiAnhChup('SNAPSHOT_INVALID', `difficulty không hợp lệ: ${String(v)}`)
  }
  return v
}

function kiemTraNhom(v: unknown): NhomThuong {
  if (typeof v !== 'string' || !NHOM_HOP_LE.includes(v as NhomThuong)) {
    throw new LoiAnhChup('SNAPSHOT_INVALID', `bucket không hợp lệ: ${String(v)}`)
  }
  return v as NhomThuong
}

function kiemTraMucDich(v: unknown): MucDich {
  if (typeof v !== 'string' || !MUC_DICH_HOP_LE.includes(v as MucDich)) {
    throw new LoiAnhChup('SNAPSHOT_INVALID', `purpose không hợp lệ: ${String(v)}`)
  }
  return v as MucDich
}

/**
 * Reject anything that is NOT a plain JSON value, and return a DEEP-CLONED, FROZEN copy so a
 * caller mutating its input after validation cannot alter the validated snapshot.
 *
 * Rejected (typed `SNAPSHOT_INVALID`, never a RangeError/stack overflow):
 *   * non-finite numbers (NaN/Infinity)
 *   * `undefined`, `bigint`, `symbol`, `function`
 *   * `Date`, `Map`, `Set`, `RegExp`, `ArrayBuffer`, typed arrays, class instances
 *   * cyclic references
 *   * sparse arrays (holes) and arrays with extra own non-index keys
 *   * objects with getters/accessors (never invoked — rejected instead)
 *   * symbol-keyed own properties
 *
 * Supported: `null`, finite numbers, strings, booleans, dense arrays, plain objects and
 * null-prototype objects. Own keys are preserved verbatim, INCLUDING `__proto__`,
 * `constructor` and `prototype` (the clone uses a null-prototype object so no setter fires).
 */
function saoChepJson(v: unknown, ten: string, seen: Set<object>): unknown {
  if (v === null) return null
  const t = typeof v
  if (t === 'number') {
    if (!Number.isFinite(v as number)) {
      throw new LoiAnhChup('SNAPSHOT_INVALID', `${ten} chứa số không hữu hạn`)
    }
    return v
  }
  if (t === 'string' || t === 'boolean') return v
  if (t === 'undefined') {
    throw new LoiAnhChup('SNAPSHOT_INVALID', `${ten} chứa undefined (không phải JSON)`)
  }
  if (t === 'bigint' || t === 'symbol' || t === 'function') {
    throw new LoiAnhChup('SNAPSHOT_INVALID', `${ten} chứa kiểu không phải JSON: ${t}`)
  }
  if (t !== 'object') {
    throw new LoiAnhChup('SNAPSHOT_INVALID', `${ten} chứa kiểu không hỗ trợ: ${t}`)
  }

  const obj = v as object
  if (seen.has(obj)) {
    throw new LoiAnhChup('SNAPSHOT_INVALID', `${ten} chứa tham chiếu vòng`)
  }
  seen.add(obj)
  try {
    if (Array.isArray(obj)) {
      const n = obj.length
      if (Object.getOwnPropertySymbols(obj).length > 0) {
        throw new LoiAnhChup('SNAPSHOT_INVALID', `${ten} chứa khoá symbol trên mảng`)
      }
      const out: unknown[] = []
      for (let i = 0; i < n; i++) {
        const d = Object.getOwnPropertyDescriptor(obj, i)
        if (d === undefined) {
          throw new LoiAnhChup('SNAPSHOT_INVALID', `${ten} chứa mảng thưa (lỗ ${i})`)
        }
        if (d.get !== undefined || d.set !== undefined) {
          throw new LoiAnhChup('SNAPSHOT_INVALID', `${ten}[${i}] là getter/setter (không được gọi)`)
        }
        out.push(saoChepJson(d.value, `${ten}[${i}]`, seen))
      }
      // Reject extra own non-index keys (e.g. arr.foo = 1) — not representable in JSON.
      for (const k of Object.keys(obj)) {
        if (!/^(0|[1-9]\d*)$/.test(k) || Number(k) >= n) {
          throw new LoiAnhChup('SNAPSHOT_INVALID', `${ten} chứa khoá lạ trên mảng: ${k}`)
        }
      }
      return Object.freeze(out)
    }

    const proto = Object.getPrototypeOf(obj)
    if (proto !== Object.prototype && proto !== null) {
      throw new LoiAnhChup('SNAPSHOT_INVALID', `${ten} không phải object thuần (${Object.prototype.toString.call(obj)})`)
    }

    const syms = Object.getOwnPropertySymbols(obj)
    if (syms.length > 0) {
      throw new LoiAnhChup('SNAPSHOT_INVALID', `${ten} chứa khoá symbol`)
    }

    const out: Record<string, unknown> = Object.create(null) as Record<string, unknown>
    for (const k of Object.keys(obj)) {
      const d = Object.getOwnPropertyDescriptor(obj, k)
      if (d === undefined) continue
      if (d.get !== undefined || d.set !== undefined) {
        throw new LoiAnhChup('SNAPSHOT_INVALID', `${ten}.${k} là getter/setter (không được gọi)`)
      }
      out[k] = saoChepJson(d.value, `${ten}.${k}`, seen)
    }
    return Object.freeze(out)
  } finally {
    seen.delete(obj)
  }
}

/** Validate + deep-clone + freeze a JSON-ish value. */
function kiemTraJsonHuuHan(v: unknown, ten: string): unknown {
  return saoChepJson(v, ten, new Set<object>())
}

function kiemTraThamChieuChinhSach(v: unknown): ThamChieuChinhSach {
  if (typeof v !== 'object' || v === null) {
    throw new LoiAnhChup('SNAPSHOT_INVALID', 'policy phải là object')
  }
  const o = v as Record<string, unknown>
  if (o.version !== 'CNH-1.0') {
    throw new LoiAnhChup('SNAPSHOT_INVALID', `policy.version phải là "CNH-1.0": ${String(o.version)}`)
  }
  return Object.freeze({
    version: 'CNH-1.0' as const,
    curriculumRevision: soNguyenAnToan(o.curriculumRevision, 'policy.curriculumRevision'),
    bankRevision: soNguyenAnToan(o.bankRevision, 'policy.bankRevision'),
    protectionRevision: soNguyenAnToan(o.protectionRevision, 'policy.protectionRevision'),
    learnerRevision: soNguyenAnToan(o.learnerRevision, 'policy.learnerRevision'),
  })
}

function kiemTraVatLieuCham(v: unknown): VatLieuChamServer {
  if (typeof v !== 'object' || v === null) {
    throw new LoiAnhChup('SNAPSHOT_INVALID', 'grading phải là object')
  }
  const o = v as Record<string, unknown>
  if (o.key === undefined) {
    throw new LoiAnhChup('SNAPSHOT_INVALID', 'grading.key là bắt buộc')
  }
  if (o.gradingPolicy === undefined) {
    throw new LoiAnhChup('SNAPSHOT_INVALID', 'grading.gradingPolicy là bắt buộc')
  }
  if (o.orderMapping === undefined) {
    throw new LoiAnhChup('SNAPSHOT_INVALID', 'grading.orderMapping là bắt buộc')
  }
  const key = kiemTraJsonHuuHan(o.key, 'grading.key')
  const gradingPolicy = kiemTraJsonHuuHan(o.gradingPolicy, 'grading.gradingPolicy')
  const orderMapping = kiemTraJsonHuuHan(o.orderMapping, 'grading.orderMapping')
  return Object.freeze({ key, gradingPolicy, orderMapping })
}

function kiemTraBangChung(v: unknown): ThamChieuBangChung {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) {
    throw new LoiAnhChup('SNAPSHOT_INVALID', 'evidenceRef phải là object')
  }
  const o = v as Record<string, unknown>
  const kind = chuoiKhongRong(o.kind, 'evidenceRef.kind')
  const refId = chuoiKhongRong(o.refId, 'evidenceRef.refId')
  const cloned = kiemTraJsonHuuHan(o, 'evidenceRef') as Record<string, unknown>
  return Object.freeze({ ...cloned, kind, refId })
}

/**
 * Validate a trusted server snapshot. Throws `LoiAnhChup('SNAPSHOT_INVALID')` on malformed input
 * instead of falling back. Returns a frozen, normalized copy so callers cannot mutate mid-flight.
 */
export function kiemTraAnhChup(v: unknown): AnhChupNhiemVu {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) {
    throw new LoiAnhChup('SNAPSHOT_INVALID', 'ảnh chụp phải là object')
  }
  // Deep-clone + validate the ENTIRE input as plain JSON BEFORE any field access, so that
  // accessor-bearing structures (getters/setters on the object or on nested arrays) are
  // rejected without ever being invoked. Field validators below then operate on a frozen,
  // plain-JSON clone. `saoChepJson` preserves own keys verbatim (incl. __proto__) and never
  // uses JSON.stringify (which would invoke getters and drop keys).
  const o = saoChepJson(v, 'ảnh chụp', new Set<object>()) as Record<string, unknown>

  const taskId = chuoiKhongRong(o.taskId, 'taskId')
  const attemptId = chuoiKhongRong(o.attemptId, 'attemptId')
  const studentId = chuoiKhongRong(o.studentId, 'studentId')
  const qid = chuoiKhongRong(o.qid, 'qid')
  const questionVersion = chuoiKhongRong(o.questionVersion, 'questionVersion')
  const contentGroup = chuoiKhongRong(o.contentGroup, 'contentGroup')
  const planId = chuoiKhongRong(o.planId, 'planId')

  let familyId: string | null
  if (o.familyId === null) {
    familyId = null
  } else {
    familyId = chuoiKhongRong(o.familyId, 'familyId')
  }

  if (!Array.isArray(o.skillIds)) {
    throw new LoiAnhChup('SNAPSHOT_INVALID', 'skillIds phải là mảng')
  }
  const skillIds = o.skillIds.map((s, i) => chuoiKhongRong(s, `skillIds[${i}]`))

  const difficulty = kiemTraDoKho(o.difficulty)
  const part = kiemTraPhan(o.part)
  const purpose = kiemTraMucDich(o.purpose)
  const bucket = kiemTraNhom(o.bucket)
  const planRevision = soNguyenAnToan(o.planRevision, 'planRevision')
  const policy = kiemTraThamChieuChinhSach(o.policy)
  const issuedAt = soNguyenAnToan(o.issuedAt, 'issuedAt')
  const expiresAt = soNguyenAnToan(o.expiresAt, 'expiresAt')
  const expectedSeconds = soNguyenAnToan(o.expectedSeconds, 'expectedSeconds')

  if (expiresAt <= issuedAt) {
    throw new LoiAnhChup('SNAPSHOT_INVALID', `expiresAt phải lớn hơn issuedAt: ${expiresAt} <= ${issuedAt}`)
  }
  if (expectedSeconds <= 0) {
    throw new LoiAnhChup('SNAPSHOT_INVALID', `expectedSeconds phải > 0: ${expectedSeconds}`)
  }

  const grading = kiemTraVatLieuCham(o.grading)

  const out: {
    taskId: string
    attemptId: string
    studentId: string
    qid: string
    questionVersion: string
    contentGroup: string
    familyId: string | null
    skillIds: readonly string[]
    difficulty: DoKho
    part: Phan
    purpose: MucDich
    bucket: NhomThuong
    planId: string
    planRevision: number
    policy: ThamChieuChinhSach
    issuedAt: number
    expiresAt: number
    expectedSeconds: number
    grading: VatLieuChamServer
    evidenceRef?: ThamChieuBangChung
  } = {
    taskId,
    attemptId,
    studentId,
    qid,
    questionVersion,
    contentGroup,
    familyId,
    skillIds: Object.freeze(skillIds.slice()),
    difficulty,
    part,
    purpose,
    bucket,
    planId,
    planRevision,
    policy,
    issuedAt,
    expiresAt,
    expectedSeconds,
    grading,
  }

  if (o.evidenceRef !== undefined) {
    out.evidenceRef = kiemTraBangChung(o.evidenceRef)
  }

  return Object.freeze(out)
}

/**
 * Canonical JSON: recursively sort object keys, PRESERVE array order (never sort answer/option
 * arrays), reject non-finite numbers and non-JSON structures. Deterministic: same logical
 * object ⇒ same string.
 *
 * Serialization is done by hand (NOT by assigning into `{}`) so that own keys named
 * `__proto__`, `constructor` or `prototype` are preserved verbatim instead of triggering a
 * prototype setter and vanishing/colliding.
 */
export function jsonChuanHoa(v: unknown): string {
  const walk = (x: unknown, seen: Set<object>): string => {
    if (x === null) return 'null'
    const t = typeof x
    if (t === 'number') {
      if (!Number.isFinite(x as number)) {
        throw new LoiAnhChup('SNAPSHOT_INVALID', 'giá trị số không hữu hạn trong JSON chuẩn hoá')
      }
      return JSON.stringify(x)
    }
    if (t === 'string' || t === 'boolean') return JSON.stringify(x)
    if (t === 'undefined') {
      throw new LoiAnhChup('SNAPSHOT_INVALID', 'undefined không phải JSON')
    }
    if (t === 'bigint' || t === 'symbol' || t === 'function') {
      throw new LoiAnhChup('SNAPSHOT_INVALID', `kiểu không hỗ trợ trong JSON: ${t}`)
    }
    if (t !== 'object') {
      throw new LoiAnhChup('SNAPSHOT_INVALID', `kiểu không hỗ trợ trong JSON: ${t}`)
    }

    const obj = x as object
    if (seen.has(obj)) {
      throw new LoiAnhChup('SNAPSHOT_INVALID', 'tham chiếu vòng trong JSON chuẩn hoá')
    }
    seen.add(obj)
    try {
      if (Array.isArray(obj)) {
        const n = obj.length
        if (Object.getOwnPropertySymbols(obj).length > 0) {
          throw new LoiAnhChup('SNAPSHOT_INVALID', 'khoá symbol trên mảng trong JSON chuẩn hoá')
        }
        const parts: string[] = []
        for (let i = 0; i < n; i++) {
          const d = Object.getOwnPropertyDescriptor(obj, i)
          if (d === undefined) {
            throw new LoiAnhChup('SNAPSHOT_INVALID', `mảng thưa trong JSON chuẩn hoá (lỗ ${i})`)
          }
          if (d.get !== undefined || d.set !== undefined) {
            throw new LoiAnhChup('SNAPSHOT_INVALID', `getter/setter trên mảng trong JSON chuẩn hoá: ${i}`)
          }
          parts.push(walk(d.value, seen))
        }
        for (const k of Object.keys(obj)) {
          if (!/^(0|[1-9]\d*)$/.test(k) || Number(k) >= n) {
            throw new LoiAnhChup('SNAPSHOT_INVALID', `khoá lạ trên mảng trong JSON chuẩn hoá: ${k}`)
          }
        }
        return `[${parts.join(',')}]`
      }

      const proto = Object.getPrototypeOf(obj)
      if (proto !== Object.prototype && proto !== null) {
        throw new LoiAnhChup('SNAPSHOT_INVALID', `không phải object thuần trong JSON chuẩn hoá (${Object.prototype.toString.call(obj)})`)
      }
      if (Object.getOwnPropertySymbols(obj).length > 0) {
        throw new LoiAnhChup('SNAPSHOT_INVALID', 'khoá symbol trong JSON chuẩn hoá')
      }

      const keys = Object.keys(obj).sort()
      const parts: string[] = []
      for (const k of keys) {
        const d = Object.getOwnPropertyDescriptor(obj, k)
        if (d === undefined) continue
        if (d.get !== undefined || d.set !== undefined) {
          throw new LoiAnhChup('SNAPSHOT_INVALID', `getter/setter trong JSON chuẩn hoá: ${k}`)
        }
        parts.push(`${JSON.stringify(k)}:${walk(d.value, seen)}`)
      }
      return `{${parts.join(',')}}`
    } finally {
      seen.delete(obj)
    }
  }
  return walk(v, new Set<object>())
}

/** SHA-256 (lowercase hex) of a UTF-8 string via WebCrypto. */
export async function bamSha256(s: string): Promise<string> {
  const bytes = new TextEncoder().encode(s)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const view = new Uint8Array(digest)
  let hex = ''
  for (const b of view) hex += b.toString(16).padStart(2, '0')
  return hex
}

/** Canonical JSON + SHA-256 of a validated snapshot. */
export async function bamAnhChup(a: AnhChupNhiemVu): Promise<{ json: string; hash: string }> {
  const json = jsonChuanHoa(a)
  const hash = await bamSha256(json)
  return { json, hash }
}

/**
 * Decode + verify a stored row against BOTH its own hash and the indexed identity columns.
 *
 * Fails closed with `CORRUPT_SNAPSHOT` (never silently repairs, never returns another
 * student's grading material) when:
 *   * `snapshot_json` is not valid JSON or fails `kiemTraAnhChup`
 *   * canonical SHA-256 of the stored JSON ≠ `snapshot_hash`
 *   * any indexed column disagrees with the JSON (student/attempt/task/qid/content_group/
 *     plan/policy_version/purpose/bucket/issued_at/expires_at/expected_seconds)
 *   * `expect` is supplied and the row's (student_id, attempt_id) does not match it
 */
async function giaiMaVaKiemChung(
  row: DongAnhChup,
  expect?: { studentId: string; attemptId: string },
): Promise<AnhChupNhiemVu> {
  if (expect !== undefined) {
    if (row.student_id !== expect.studentId || row.attempt_id !== expect.attemptId) {
      throw new LoiAnhChup(
        'CORRUPT_SNAPSHOT',
        `hàng không thuộc (student, attempt) yêu cầu: ${row.student_id}/${row.attempt_id}`,
      )
    }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(row.snapshot_json)
  } catch {
    throw new LoiAnhChup('CORRUPT_SNAPSHOT', 'snapshot_json không phải JSON hợp lệ')
  }

  let snapshot: AnhChupNhiemVu
  try {
    snapshot = kiemTraAnhChup(parsed)
  } catch (e) {
    throw new LoiAnhChup('CORRUPT_SNAPSHOT', `snapshot_json không hợp lệ: ${(e as Error).message}`)
  }

  const { hash } = await bamAnhChup(snapshot)
  if (hash !== row.snapshot_hash) {
    throw new LoiAnhChup(
      'CORRUPT_SNAPSHOT',
      `băm ảnh chụp không khớp: ${hash} ≠ ${row.snapshot_hash}`,
    )
  }

  const mismatches: string[] = []
  const cmp = (ten: string, a: unknown, b: unknown) => {
    if (a !== b) mismatches.push(`${ten}: ${String(a)} ≠ ${String(b)}`)
  }
  cmp('student_id', row.student_id, snapshot.studentId)
  cmp('attempt_id', row.attempt_id, snapshot.attemptId)
  cmp('task_id', row.task_id, snapshot.taskId)
  cmp('qid', row.qid, snapshot.qid)
  cmp('content_group', row.content_group, snapshot.contentGroup)
  cmp('plan_id', row.plan_id, snapshot.planId)
  cmp('plan_revision', row.plan_revision, snapshot.planRevision)
  cmp('policy_version', row.policy_version, snapshot.policy.version)
  cmp('purpose', row.purpose, snapshot.purpose)
  cmp('bucket', row.bucket, snapshot.bucket)
  cmp('issued_at', row.issued_at, snapshot.issuedAt)
  cmp('expires_at', row.expires_at, snapshot.expiresAt)
  cmp('expected_seconds', row.expected_seconds, snapshot.expectedSeconds)
  if (mismatches.length > 0) {
    throw new LoiAnhChup('CORRUPT_SNAPSHOT', `cột chỉ mục không khớp JSON: ${mismatches.join('; ')}`)
  }

  return snapshot
}

/** Row shape of `cnh_exp_task`. */
interface DongAnhChup {
  student_id: string
  attempt_id: string
  task_id: string
  qid: string
  content_group: string
  plan_id: string
  plan_revision: number
  policy_version: string
  purpose: string
  bucket: string
  issued_at: number
  expires_at: number
  expected_seconds: number
  snapshot_json: string
  snapshot_hash: string
  created_at: number
}

/**
 * Issue (or re-read) an immutable snapshot for (student_id, attempt_id).
 *
 * Semantics:
 *   * INSERT ... ON CONFLICT(student_id, attempt_id) DO NOTHING, then READ the actual row.
 *   * Same hash ⇒ return the ORIGINAL row unchanged (no timestamp reset, no overwrite).
 *   * Different hash ⇒ throw `LoiAnhChup('SNAPSHOT_CONFLICT')`.
 *   * A reused task_id for another attempt violates the UNIQUE(student_id, task_id) index and
 *     surfaces as a real error (NOT swallowed by INSERT OR IGNORE).
 *   * The caller NEVER supplies the hash.
 *
 * `now` is the server clock (epoch ms) used only for `created_at`; it does not affect the hash.
 * It MUST be a non-negative safe integer.
 *
 * `created` is derived from the INSERT's own `meta.changes === 1` — NOT from `created_at === now`,
 * which would report `true` for every same-millisecond retry or simultaneous request.
 *
 * When the runtime exposes the D1 Sessions API, the INSERT and the read-back run in ONE
 * `first-primary` session so the read cannot observe a stale replica.
 */
export async function phatAnhChup(
  db: D1Database,
  input: unknown,
  now: number,
): Promise<{ snapshot: AnhChupNhiemVu; hash: string; created: boolean }> {
  const snapshot = kiemTraAnhChup(input)
  const dongHo = kiemTraDongHo(now, 'now')
  const { json, hash } = await bamAnhChup(snapshot)

  const session: D1DatabaseSession =
    typeof db.withSession === 'function' ? db.withSession('first-primary') : db

  const insert: D1PreparedStatement = session
    .prepare(
      `INSERT INTO cnh_exp_task (
         student_id, attempt_id, task_id, qid, content_group, plan_id, plan_revision,
         policy_version, purpose, bucket, issued_at, expires_at, expected_seconds,
         snapshot_json, snapshot_hash, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(student_id, attempt_id) DO NOTHING`,
    )
    .bind(
      snapshot.studentId,
      snapshot.attemptId,
      snapshot.taskId,
      snapshot.qid,
      snapshot.contentGroup,
      snapshot.planId,
      snapshot.planRevision,
      snapshot.policy.version,
      snapshot.purpose,
      snapshot.bucket,
      snapshot.issuedAt,
      snapshot.expiresAt,
      snapshot.expectedSeconds,
      json,
      hash,
      dongHo,
    )

  const inserted = await insert.run()
  const created = inserted.meta.changes === 1

  const row = await session
    .prepare(
      `SELECT * FROM cnh_exp_task WHERE student_id = ? AND attempt_id = ?`,
    )
    .bind(snapshot.studentId, snapshot.attemptId)
    .first<DongAnhChup>()

  if (row === null) {
    // Should be unreachable: the INSERT either created the row or an existing row is present.
    throw new LoiAnhChup('SNAPSHOT_NOT_FOUND', 'không đọc được ảnh chụp vừa phát')
  }

  // Verify the STORED row FIRST: a corrupt row must fail closed with CORRUPT_SNAPSHOT, never be
  // reported as a mere SNAPSHOT_CONFLICT against the incoming hash.
  const stored = await giaiMaVaKiemChung(row, {
    studentId: snapshot.studentId,
    attemptId: snapshot.attemptId,
  })

  if (row.snapshot_hash !== hash) {
    throw new LoiAnhChup(
      'SNAPSHOT_CONFLICT',
      `attempt ${snapshot.attemptId} đã có ảnh chụp khác (hash ${row.snapshot_hash} ≠ ${hash})`,
    )
  }

  return { snapshot: stored, hash: row.snapshot_hash, created }
}

/**
 * Read the full server-only snapshot for an AUTHENTICATED (student_id, attempt_id).
 * Never a qid-latest lookup, never a cross-student fallback.
 *
 * The stored JSON is decoded and cross-checked against its hash and the indexed identity
 * columns (same verification as issuance). A corrupt/mismatched row fails closed with
 * `CORRUPT_SNAPSHOT` instead of returning another student's grading material.
 *
 * When the runtime exposes the D1 Sessions API, the read runs in a `first-primary` session
 * (same policy as issuance) so it cannot observe a stale replica.
 */
export async function docAnhChup(
  db: D1Database,
  studentId: string,
  attemptId: string,
): Promise<AnhChupNhiemVu | null> {
  const sid = chuoiKhongRong(studentId, 'studentId')
  const aid = chuoiKhongRong(attemptId, 'attemptId')
  const session: D1DatabaseSession =
    typeof db.withSession === 'function' ? db.withSession('first-primary') : db
  const row = await session
    .prepare(`SELECT * FROM cnh_exp_task WHERE student_id = ? AND attempt_id = ?`)
    .bind(sid, aid)
    .first<DongAnhChup>()
  if (row === null) return null
  return giaiMaVaKiemChung(row, { studentId: sid, attemptId: aid })
}

/**
 * Public DTO — explicit allowlist. NEVER returns grading key/policy, order mapping, familyId,
 * skillIds, planId, policy revisions, or any nested server-only field.
 * This is a pure function, NOT a route.
 */
export function publicDto(a: AnhChupNhiemVu): AnhChupCongKhai {
  return Object.freeze({
    taskId: a.taskId,
    attemptId: a.attemptId,
    qid: a.qid,
    questionVersion: a.questionVersion,
    part: a.part,
    difficulty: a.difficulty,
    purpose: a.purpose,
    bucket: a.bucket,
    expiresAt: a.expiresAt,
    expectedSeconds: a.expectedSeconds,
  })
}
