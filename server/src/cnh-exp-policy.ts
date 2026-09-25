// CNH-1.0 P07 — FOUNDATION (pure, server-only policy core).
//
// Scope of THIS file (deliberately small):
//   * One central policy object holding the locked economy constants for core pricing.
//   * Runtime validation of a TRUSTED server task/attempt snapshot (no client payload parsing).
//   * Pure core raw-price functions (single task, and the explicit teacher-confirmed step).
//   * Pure core-entitlement function (achieved / rawCore / corePaid / compensation).
//
// Explicitly OUT of scope here (integration is the NEXT job):
//   * Ledger dedup / receipt writing / atomic locks. Pricing is NOT dedup: the caller MUST
//     enforce the same-day content_group lock and write the grant + wallet in ONE transaction
//     with a receipt. This module only computes numbers.
//   * Policy cutover / versioning. The caller MUST route each event through the policy version
//     that was effective on the event's original learning_day.
//   * Suspicion / anti-cheat heuristics. We do NOT invent any. `released` here means
//     publication eligibility (not embargoed); unresolved-suspicion handling is a separate
//     integration concern and is NOT modeled as a blanket zero.
//
// No clock, no DB, no randomness, no I/O. Deterministic: same input ⇒ same output.

/** Difficulty levels: 0 = Biết, 1 = Hiểu, 2 = Vận dụng. */
export type DoKho = 0 | 1 | 2

/** Question parts. */
export type Phan = 'I' | 'II' | 'III'

/** Assistance state of an attempt, as recorded by the server. */
export type TroGiup = 'none' | 'assisted' | 'unknown'

/** Optional purposes. Chosen by the server at issuance; never by the client. */
export type MucDichOptional =
  | 'due_review'
  | 'transfer'
  | 'repair_complete'
  | 'peer_help'
  | 'consolidation'
  | 'speed_practice'

/** Locked economy constants for core + optional pricing (subset of THAM-SO.json `economy`). */
export interface ChinhSachCore {
  /** Total core entitlement for an achieved day. */
  readonly coreCap: number
  /** Total optional entitlement for a day. */
  readonly optionalCap: number
  /** Raw EXP recorded for a valid-but-wrong core attempt (also the base included in correct prices). */
  readonly baseValidCoreAttempt: number
  /** Full-correct price per part and difficulty. Already INCLUDES `baseValidCoreAttempt`. */
  readonly correctCorePrice: Readonly<Record<Phan, readonly [number, number, number]>>
  /** Fixed optional prices for the four priced purposes (consolidation uses the core table). */
  readonly optionalPrice: Readonly<{
    due_review: number
    transfer: number
    repair_complete: number
    peer_help: number
  }>
  /** Max paid help events per helper per day. */
  readonly helpDailyCountCap: number
}

/**
 * The single source of truth for core + optional pricing in code.
 * Values are locked to THAM-SO.json `economy`; the test suite asserts equality via fs.
 */
export const CHINH_SACH_CORE: ChinhSachCore = Object.freeze({
  coreCap: 220,
  optionalCap: 120,
  baseValidCoreAttempt: 2,
  correctCorePrice: Object.freeze({
    I: Object.freeze([2, 3, 5] as const),
    II: Object.freeze([3, 5, 8] as const),
    III: Object.freeze([4, 6, 10] as const),
  }),
  optionalPrice: Object.freeze({
    due_review: 6,
    transfer: 10,
    repair_complete: 20,
    peer_help: 5,
  }),
  helpDailyCountCap: 5,
})

/** Trusted server snapshot of one core task/attempt. All fields are server-authoritative. */
export interface NhiemVuCore {
  readonly part: Phan
  readonly difficulty: DoKho
  /** True only when the server accepted a real submission for this attempt. */
  readonly validAttempt: boolean
  readonly assistance: TroGiup
  /** True when this content_group already received a raw price today (server lock). */
  readonly alreadyPaidContentGroupToday: boolean
  /**
   * Publication eligibility only: true when the task is released (not embargoed).
   * This is NOT a suspicion/anti-cheat signal; unresolved suspicion is a separate
   * integration concern and is never modeled here as a blanket zero.
   */
  readonly released: boolean
  /** Correctness of the attempt. Ignored when the attempt is invalid/unsubmitted. */
  readonly correct: boolean
  /** Part II only: total mandatory sub-items (m). */
  readonly partIIMandatoryTotal?: number
  /** Part II only: correct sub-items (k). */
  readonly partIICorrectCount?: number
}

/** Trusted server snapshot for the explicit teacher-confirmed independent step. */
export interface BuocTuLamGiaoVien {
  /** True only when a teacher confirmed this independent step. */
  readonly teacherConfirmed: boolean
  /** True when this step_id already received a raw price today (server lock). */
  readonly alreadyPaidStepToday: boolean
  /** Publication eligibility only (not embargoed). Not a suspicion signal. */
  readonly released: boolean
}

/** Result of pricing one core task. */
export interface KetQuaGiaCore {
  /** Raw EXP to record for this task (0 when nothing is granted). */
  readonly raw: number
  /** Machine-readable reason, for receipts and debugging. */
  readonly lyDo:
    | 'CORRECT_FULL'
    | 'CORRECT_PARTIAL_II'
    | 'WRONG_VALID'
    | 'ASSISTED_OR_UNKNOWN'
    | 'INVALID_OR_UNSUBMITTED'
    | 'DUPLICATE_CONTENT_GROUP_TODAY'
    | 'EMBARGOED'
    | 'TEACHER_STEP'
    | 'TEACHER_STEP_DUPLICATE'
    | 'TEACHER_STEP_EMBARGOED'
    | 'TEACHER_STEP_UNCONFIRMED'
}

/** Result of computing core entitlement for a day. */
export interface KetQuaQuyenCore {
  /** Total core entitlement for the day: achieved ? coreCap : min(coreCap, rawCore). */
  readonly entitlement: number
  /** Amount to grant now: max(0, entitlement - corePaid - compensationAlreadyPaid). */
  readonly grant: number
}

/**
 * Trusted server snapshot of one optional task, discriminated by the IMMUTABLE purpose
 * chosen by the server at issuance. Each variant carries only the facts that purpose needs.
 * All fields are server-authoritative; the client never supplies money or the purpose.
 */
export type NhiemVuOptional =
  | {
      readonly purpose: 'due_review'
      /** Publication eligibility only (not embargoed). */
      readonly released: boolean
      /** Server issued this entitlement for this attempt. */
      readonly issued: boolean
      /** Independent (unassisted) attempt. */
      readonly independent: boolean
      readonly correct: boolean
      /** Card was actually due at issuance time. */
      readonly dueAtIssuance: boolean
      /** Academic content lock (student+content_group+day) not already consumed. */
      readonly contentLockFree: boolean
      /** Scope/level of the task matches the issued entitlement. */
      readonly scopeLevelValid: boolean
    }
  | {
      readonly purpose: 'transfer'
      readonly released: boolean
      readonly issued: boolean
      readonly independent: boolean
      readonly correct: boolean
      /** Opportunity was bound to THIS attempt at issuance. */
      readonly opportunityBoundToAttempt: boolean
      /** Family has been trained. */
      readonly familyTrained: boolean
      /**
       * Novelty captured at ISSUANCE: content_group had not been seen before the
       * opportunity was issued. This is a historical fact, not the current lock.
       */
      readonly contentGroupUnseen: boolean
      /** Scope/difficulty matches the issued opportunity. */
      readonly scopeDifficultyValid: boolean
      /**
       * Current atomic server decision: the shared academic lock
       * (student + content_group + learning_day) is free, i.e. no other task on this
       * content_group has already been paid today (core, due_review, repair, ...).
       * This is NOT replaced by `contentGroupUnseen` (issuance novelty) nor by
       * `opportunityLockFree` (family+difficulty+day).
       */
      readonly contentLockFree: boolean
      /** family+difficulty+day opportunity not consumed by another attempt. */
      readonly opportunityLockFree: boolean
    }
  | {
      readonly purpose: 'repair_complete'
      readonly released: boolean
      readonly issued: boolean
      /** Episode verified as transitioned to recovered. */
      readonly episodeRecovered: boolean
      /** Episode has not been paid before (episode_id unique for life). */
      readonly episodeUnpaid: boolean
      /** Academic content lock available. */
      readonly contentLockFree: boolean
    }
  | {
      readonly purpose: 'peer_help'
      readonly released: boolean
      readonly issued: boolean
      /** Help event verified by the server. */
      readonly helpVerified: boolean
      /** Helper is not the recipient. */
      readonly helperIsNotRecipient: boolean
      /** Recipient task has not already been paid by any helper. */
      readonly recipientTaskUnpaid: boolean
      /** Helper's paid help count today (before this event). */
      readonly helperPaidCountToday: number
    }
  | {
      readonly purpose: 'consolidation'
      readonly released: boolean
      readonly issued: boolean
      readonly independent: boolean
      readonly correct: boolean
      readonly part: Phan
      readonly difficulty: DoKho
      /** Academic content lock not already consumed. */
      readonly contentLockFree: boolean
      /** Task authorized with correct scope/level. */
      readonly scopeLevelValid: boolean
      /** Part II only: total mandatory sub-items (m). */
      readonly partIIMandatoryTotal?: number
      /** Part II only: correct sub-items (k). */
      readonly partIICorrectCount?: number
    }
  | {
      readonly purpose: 'speed_practice'
      readonly released: boolean
      readonly issued: boolean
    }

/** Result of pricing one optional task. */
export interface KetQuaGiaOptional {
  /** Price implied by the purpose and facts (0 when not eligible). */
  readonly pricedAmount: number
  /** Amount to grant now: min(pricedAmount, max(0, optionalCap - optionalPaid)). */
  readonly grantedAmount: number
  /** Machine-readable reason, for receipts and debugging. */
  readonly lyDo:
    | 'OPTIONAL_PRICED'
    | 'OPTIONAL_CAPPED'
    | 'OPTIONAL_ZERO'
    | 'OPTIONAL_EMBARGOED'
    | 'OPTIONAL_NOT_ISSUED'
    | 'OPTIONAL_NOT_INDEPENDENT'
    | 'OPTIONAL_WRONG'
    | 'OPTIONAL_DUPLICATE_CONTENT_GROUP'
    | 'OPTIONAL_NOT_DUE'
    | 'OPTIONAL_SCOPE_INVALID'
    | 'OPTIONAL_OPPORTUNITY_NOT_BOUND'
    | 'OPTIONAL_FAMILY_NOT_TRAINED'
    | 'OPTIONAL_CONTENT_GROUP_SEEN'
    | 'OPTIONAL_OPPORTUNITY_CONSUMED'
    | 'OPTIONAL_EPISODE_NOT_RECOVERED'
    | 'OPTIONAL_EPISODE_ALREADY_PAID'
    | 'OPTIONAL_HELP_UNVERIFIED'
    | 'OPTIONAL_HELP_SELF'
    | 'OPTIONAL_HELP_RECIPIENT_ALREADY_PAID'
    | 'OPTIONAL_HELP_DAILY_CAP'
    | 'OPTIONAL_PARTIAL_II'
    | 'OPTIONAL_SPEED_PRACTICE'
}

const PHAN_HOP_LE: readonly Phan[] = ['I', 'II', 'III']
const TRO_GIUP_HOP_LE: readonly TroGiup[] = ['none', 'assisted', 'unknown']
const MUC_DICH_HOP_LE: readonly MucDichOptional[] = [
  'due_review',
  'transfer',
  'repair_complete',
  'peer_help',
  'consolidation',
  'speed_practice',
]

/** Reject anything that is not a non-negative safe integer. */
function laSoNguyenAnToan(v: unknown): v is number {
  return typeof v === 'number' && Number.isSafeInteger(v) && v >= 0
}

/** Reject anything that is not a boolean. */
function laBoolean(v: unknown): v is boolean {
  return typeof v === 'boolean'
}

function kiemTraPhan(v: unknown): Phan {
  if (typeof v !== 'string' || !PHAN_HOP_LE.includes(v as Phan)) {
    throw new TypeError(`part không hợp lệ: ${String(v)}`)
  }
  return v as Phan
}

function kiemTraDoKho(v: unknown): DoKho {
  if (v !== 0 && v !== 1 && v !== 2) {
    throw new TypeError(`difficulty không hợp lệ: ${String(v)}`)
  }
  return v
}

function kiemTraTroGiup(v: unknown): TroGiup {
  if (typeof v !== 'string' || !TRO_GIUP_HOP_LE.includes(v as TroGiup)) {
    throw new TypeError(`assistance không hợp lệ: ${String(v)}`)
  }
  return v as TroGiup
}

function kiemTraBoolean(v: unknown, ten: string): boolean {
  if (!laBoolean(v)) {
    throw new TypeError(`${ten} phải là boolean: ${String(v)}`)
  }
  return v
}

/**
 * Validate a trusted core task snapshot. Throws on malformed input instead of falling back.
 * Returns a normalized, frozen copy so callers cannot mutate the input mid-flight.
 */
export function kiemTraNhiemVuCore(v: unknown): NhiemVuCore {
  if (typeof v !== 'object' || v === null) {
    throw new TypeError('nhiệm vụ core phải là object')
  }
  const o = v as Record<string, unknown>
  const part = kiemTraPhan(o.part)
  const difficulty = kiemTraDoKho(o.difficulty)
  const validAttempt = kiemTraBoolean(o.validAttempt, 'validAttempt')
  const assistance = kiemTraTroGiup(o.assistance)
  const alreadyPaidContentGroupToday = kiemTraBoolean(
    o.alreadyPaidContentGroupToday,
    'alreadyPaidContentGroupToday',
  )
  const released = kiemTraBoolean(o.released, 'released')
  const correct = kiemTraBoolean(o.correct, 'correct')

  const out: {
    part: Phan
    difficulty: DoKho
    validAttempt: boolean
    assistance: TroGiup
    alreadyPaidContentGroupToday: boolean
    released: boolean
    correct: boolean
    partIIMandatoryTotal?: number
    partIICorrectCount?: number
  } = {
    part,
    difficulty,
    validAttempt,
    assistance,
    alreadyPaidContentGroupToday,
    released,
    correct,
  }

  if (part === 'II') {
    const m = o.partIIMandatoryTotal
    const k = o.partIICorrectCount
    if (!laSoNguyenAnToan(m) || m <= 0) {
      throw new TypeError(`partIIMandatoryTotal phải là số nguyên an toàn > 0: ${String(m)}`)
    }
    if (!laSoNguyenAnToan(k) || k > m) {
      throw new TypeError(`partIICorrectCount phải là số nguyên an toàn trong [0, m]: ${String(k)}`)
    }
    out.partIIMandatoryTotal = m
    out.partIICorrectCount = k
  } else if (o.partIIMandatoryTotal !== undefined || o.partIICorrectCount !== undefined) {
    throw new TypeError('partIIMandatoryTotal/partIICorrectCount chỉ hợp lệ với part = "II"')
  }

  return Object.freeze(out)
}

/** Validate a trusted teacher-confirmed step snapshot. Throws on malformed input. */
export function kiemTraBuocTuLamGiaoVien(v: unknown): BuocTuLamGiaoVien {
  if (typeof v !== 'object' || v === null) {
    throw new TypeError('bước tự làm phải là object')
  }
  const o = v as Record<string, unknown>
  return Object.freeze({
    teacherConfirmed: kiemTraBoolean(o.teacherConfirmed, 'teacherConfirmed'),
    alreadyPaidStepToday: kiemTraBoolean(o.alreadyPaidStepToday, 'alreadyPaidStepToday'),
    released: kiemTraBoolean(o.released, 'released'),
  })
}

/**
 * Price ONE core task.
 *
 * Rules (03 §3.1):
 *   * Invalid/unsubmitted attempt, or embargoed task ⇒ 0.
 *   * content_group already paid today ⇒ 0 (server lock; this function does NOT dedup).
 *   * Assisted/unknown assistance never grants the independent-correct premium ⇒ base 2.
 *   * Unassisted wrong (I/III) ⇒ base 2.
 *   * Unassisted correct (I/III) ⇒ full table price (already includes base 2).
 *   * Part II ⇒ 2 + floor((full - 2) * k / m). Authority is k/m; the whole-answer
 *     `correct` flag is NOT used for Part II money (a partial answer is naturally
 *     whole-answer incorrect).
 */
export function giaCoreRaw(v: unknown): KetQuaGiaCore {
  const t = kiemTraNhiemVuCore(v)

  if (!t.released) return { raw: 0, lyDo: 'EMBARGOED' }
  if (!t.validAttempt) return { raw: 0, lyDo: 'INVALID_OR_UNSUBMITTED' }
  if (t.alreadyPaidContentGroupToday) {
    return { raw: 0, lyDo: 'DUPLICATE_CONTENT_GROUP_TODAY' }
  }

  const full = CHINH_SACH_CORE.correctCorePrice[t.part][t.difficulty]

  if (t.assistance !== 'none') {
    return { raw: CHINH_SACH_CORE.baseValidCoreAttempt, lyDo: 'ASSISTED_OR_UNKNOWN' }
  }

  if (t.part === 'II') {
    const m = t.partIIMandatoryTotal as number
    const k = t.partIICorrectCount as number
    const base = CHINH_SACH_CORE.baseValidCoreAttempt
    // Exact integer floor via BigInt: (full - base) * k can exceed Number.MAX_SAFE_INTEGER
    // even for valid k/m. Result is bounded by `full` (≤ 10), so Number() is safe.
    const raw = base + Number((BigInt(full - base) * BigInt(k)) / BigInt(m))
    return { raw, lyDo: k === m ? 'CORRECT_FULL' : 'CORRECT_PARTIAL_II' }
  }

  if (!t.correct) {
    return { raw: CHINH_SACH_CORE.baseValidCoreAttempt, lyDo: 'WRONG_VALID' }
  }

  return { raw: full, lyDo: 'CORRECT_FULL' }
}

/**
 * Price the explicit teacher-confirmed independent step (03 §3.1).
 * Separate function on purpose: the generic API must not accept arbitrary task forgery.
 * A confirmed, released, not-yet-paid step grants exactly `baseValidCoreAttempt` (2).
 */
export function giaBuocTuLamGiaoVienRaw(v: unknown): KetQuaGiaCore {
  const s = kiemTraBuocTuLamGiaoVien(v)
  if (!s.released) return { raw: 0, lyDo: 'TEACHER_STEP_EMBARGOED' }
  if (!s.teacherConfirmed) return { raw: 0, lyDo: 'TEACHER_STEP_UNCONFIRMED' }
  if (s.alreadyPaidStepToday) return { raw: 0, lyDo: 'TEACHER_STEP_DUPLICATE' }
  return { raw: CHINH_SACH_CORE.baseValidCoreAttempt, lyDo: 'TEACHER_STEP' }
}

/**
 * Compute core entitlement for a day (03 §3.2).
 *
 *   entitlement = achieved ? coreCap : min(coreCap, rawCore)
 *   grant       = max(0, entitlement - corePaid - compensationAlreadyPaid)
 *
 * All inputs must be non-negative safe integers. No clawback: grant is never negative.
 * Overflow is rejected up front (safe-integer validation) rather than silently wrapping.
 *
 * NOTE: this is pure arithmetic. The caller MUST apply `grant` to `core_paid` and the wallet
 * in ONE atomic transaction with a receipt, and MUST NOT double-grant on concurrent requests.
 * Correction flows must recompute the ORIGINAL day's total entitlement (not a raw delta) and
 * pass any already-paid compensation here so it is not granted twice.
 */
export function quyenCore(v: unknown): KetQuaQuyenCore {
  if (typeof v !== 'object' || v === null) {
    throw new TypeError('quyền core phải là object')
  }
  const o = v as Record<string, unknown>
  const achieved = kiemTraBoolean(o.achieved, 'achieved')
  const rawCore = o.rawCore
  const corePaid = o.corePaid
  const compensationAlreadyPaid = o.compensationAlreadyPaid

  if (!laSoNguyenAnToan(rawCore)) {
    throw new TypeError(`rawCore phải là số nguyên an toàn >= 0: ${String(rawCore)}`)
  }
  if (!laSoNguyenAnToan(corePaid)) {
    throw new TypeError(`corePaid phải là số nguyên an toàn >= 0: ${String(corePaid)}`)
  }
  if (!laSoNguyenAnToan(compensationAlreadyPaid)) {
    throw new TypeError(
      `compensationAlreadyPaid phải là số nguyên an toàn >= 0: ${String(compensationAlreadyPaid)}`,
    )
  }

  const cap = CHINH_SACH_CORE.coreCap
  const entitlement = achieved ? cap : Math.min(cap, rawCore)
  const daTra = corePaid + compensationAlreadyPaid
  if (!Number.isSafeInteger(daTra)) {
    throw new RangeError('corePaid + compensationAlreadyPaid vượt quá số nguyên an toàn')
  }
  const grant = Math.max(0, entitlement - daTra)
  return { entitlement, grant }
}

/** Validate a trusted optional task snapshot. Throws on malformed input instead of falling back. */
export function kiemTraNhiemVuOptional(v: unknown): NhiemVuOptional {
  if (typeof v !== 'object' || v === null) {
    throw new TypeError('nhiệm vụ optional phải là object')
  }
  const o = v as Record<string, unknown>
  const purpose = o.purpose
  if (typeof purpose !== 'string' || !MUC_DICH_HOP_LE.includes(purpose as MucDichOptional)) {
    throw new TypeError(`purpose không hợp lệ: ${String(purpose)}`)
  }
  const released = kiemTraBoolean(o.released, 'released')
  const issued = kiemTraBoolean(o.issued, 'issued')

  switch (purpose as MucDichOptional) {
    case 'due_review':
      return Object.freeze({
        purpose: 'due_review',
        released,
        issued,
        independent: kiemTraBoolean(o.independent, 'independent'),
        correct: kiemTraBoolean(o.correct, 'correct'),
        dueAtIssuance: kiemTraBoolean(o.dueAtIssuance, 'dueAtIssuance'),
        contentLockFree: kiemTraBoolean(o.contentLockFree, 'contentLockFree'),
        scopeLevelValid: kiemTraBoolean(o.scopeLevelValid, 'scopeLevelValid'),
      })
    case 'transfer':
      return Object.freeze({
        purpose: 'transfer',
        released,
        issued,
        independent: kiemTraBoolean(o.independent, 'independent'),
        correct: kiemTraBoolean(o.correct, 'correct'),
        opportunityBoundToAttempt: kiemTraBoolean(o.opportunityBoundToAttempt, 'opportunityBoundToAttempt'),
        familyTrained: kiemTraBoolean(o.familyTrained, 'familyTrained'),
        contentGroupUnseen: kiemTraBoolean(o.contentGroupUnseen, 'contentGroupUnseen'),
        scopeDifficultyValid: kiemTraBoolean(o.scopeDifficultyValid, 'scopeDifficultyValid'),
        contentLockFree: kiemTraBoolean(o.contentLockFree, 'contentLockFree'),
        opportunityLockFree: kiemTraBoolean(o.opportunityLockFree, 'opportunityLockFree'),
      })
    case 'repair_complete':
      return Object.freeze({
        purpose: 'repair_complete',
        released,
        issued,
        episodeRecovered: kiemTraBoolean(o.episodeRecovered, 'episodeRecovered'),
        episodeUnpaid: kiemTraBoolean(o.episodeUnpaid, 'episodeUnpaid'),
        contentLockFree: kiemTraBoolean(o.contentLockFree, 'contentLockFree'),
      })
    case 'peer_help': {
      const helperPaidCountToday = o.helperPaidCountToday
      if (!laSoNguyenAnToan(helperPaidCountToday)) {
        throw new TypeError(`helperPaidCountToday phải là số nguyên an toàn >= 0: ${String(helperPaidCountToday)}`)
      }
      return Object.freeze({
        purpose: 'peer_help',
        released,
        issued,
        helpVerified: kiemTraBoolean(o.helpVerified, 'helpVerified'),
        helperIsNotRecipient: kiemTraBoolean(o.helperIsNotRecipient, 'helperIsNotRecipient'),
        recipientTaskUnpaid: kiemTraBoolean(o.recipientTaskUnpaid, 'recipientTaskUnpaid'),
        helperPaidCountToday,
      })
    }
    case 'consolidation': {
      const part = kiemTraPhan(o.part)
      const difficulty = kiemTraDoKho(o.difficulty)
      const out: {
        purpose: 'consolidation'
        released: boolean
        issued: boolean
        independent: boolean
        correct: boolean
        part: Phan
        difficulty: DoKho
        contentLockFree: boolean
        scopeLevelValid: boolean
        partIIMandatoryTotal?: number
        partIICorrectCount?: number
      } = {
        purpose: 'consolidation',
        released,
        issued,
        independent: kiemTraBoolean(o.independent, 'independent'),
        correct: kiemTraBoolean(o.correct, 'correct'),
        part,
        difficulty,
        contentLockFree: kiemTraBoolean(o.contentLockFree, 'contentLockFree'),
        scopeLevelValid: kiemTraBoolean(o.scopeLevelValid, 'scopeLevelValid'),
      }
      if (part === 'II') {
        const m = o.partIIMandatoryTotal
        const k = o.partIICorrectCount
        if (!laSoNguyenAnToan(m) || m <= 0) {
          throw new TypeError(`partIIMandatoryTotal phải là số nguyên an toàn > 0: ${String(m)}`)
        }
        if (!laSoNguyenAnToan(k) || k > m) {
          throw new TypeError(`partIICorrectCount phải là số nguyên an toàn trong [0, m]: ${String(k)}`)
        }
        out.partIIMandatoryTotal = m
        out.partIICorrectCount = k
      } else if (o.partIIMandatoryTotal !== undefined || o.partIICorrectCount !== undefined) {
        throw new TypeError('partIIMandatoryTotal/partIICorrectCount chỉ hợp lệ với part = "II"')
      }
      return Object.freeze(out)
    }
    case 'speed_practice':
      return Object.freeze({ purpose: 'speed_practice', released, issued })
  }
}

/**
 * Price ONE optional task (03 §4).
 *
 * The purpose is IMMUTABLE and server-issued; the client never chooses it or the money.
 * Missing evidence never counts as eligible. This is pure arithmetic: the caller MUST
 * enforce the academic/transfer/repair/help locks, first-submission day, publication and
 * cutover ATOMICALLY in the ledger adapter — these flags are trusted server facts, not
 * HTTP input. A wrong transfer still consumes the opportunity in the ledger (persistence
 * is out of scope here).
 */
export function giaOptionalRaw(v: unknown, optionalPaid: number): KetQuaGiaOptional {
  const t = kiemTraNhiemVuOptional(v)
  if (!laSoNguyenAnToan(optionalPaid)) {
    throw new TypeError(`optionalPaid phải là số nguyên an toàn >= 0: ${String(optionalPaid)}`)
  }

  const zero = (lyDo: KetQuaGiaOptional['lyDo']): KetQuaGiaOptional => ({
    pricedAmount: 0,
    grantedAmount: 0,
    lyDo,
  })

  if (!t.released) return zero('OPTIONAL_EMBARGOED')
  if (!t.issued) return zero('OPTIONAL_NOT_ISSUED')

  let pricedAmount = 0
  let lyDo: KetQuaGiaOptional['lyDo'] = 'OPTIONAL_ZERO'

  switch (t.purpose) {
    case 'speed_practice':
      return zero('OPTIONAL_SPEED_PRACTICE')

    case 'due_review': {
      if (!t.independent) return zero('OPTIONAL_NOT_INDEPENDENT')
      if (!t.correct) return zero('OPTIONAL_WRONG')
      if (!t.dueAtIssuance) return zero('OPTIONAL_NOT_DUE')
      if (!t.contentLockFree) return zero('OPTIONAL_DUPLICATE_CONTENT_GROUP')
      if (!t.scopeLevelValid) return zero('OPTIONAL_SCOPE_INVALID')
      pricedAmount = CHINH_SACH_CORE.optionalPrice.due_review
      lyDo = 'OPTIONAL_PRICED'
      break
    }

    case 'transfer': {
      if (!t.independent) return zero('OPTIONAL_NOT_INDEPENDENT')
      if (!t.correct) return zero('OPTIONAL_WRONG')
      if (!t.opportunityBoundToAttempt) return zero('OPTIONAL_OPPORTUNITY_NOT_BOUND')
      if (!t.familyTrained) return zero('OPTIONAL_FAMILY_NOT_TRAINED')
      if (!t.contentGroupUnseen) return zero('OPTIONAL_CONTENT_GROUP_SEEN')
      if (!t.scopeDifficultyValid) return zero('OPTIONAL_SCOPE_INVALID')
      // Shared academic lock (student+content_group+day): a transfer must not pay a
      // content_group already paid today by any other task, even if it was novel at issuance.
      if (!t.contentLockFree) return zero('OPTIONAL_DUPLICATE_CONTENT_GROUP')
      if (!t.opportunityLockFree) return zero('OPTIONAL_OPPORTUNITY_CONSUMED')
      pricedAmount = CHINH_SACH_CORE.optionalPrice.transfer
      lyDo = 'OPTIONAL_PRICED'
      break
    }

    case 'repair_complete': {
      if (!t.episodeRecovered) return zero('OPTIONAL_EPISODE_NOT_RECOVERED')
      if (!t.episodeUnpaid) return zero('OPTIONAL_EPISODE_ALREADY_PAID')
      if (!t.contentLockFree) return zero('OPTIONAL_DUPLICATE_CONTENT_GROUP')
      pricedAmount = CHINH_SACH_CORE.optionalPrice.repair_complete
      lyDo = 'OPTIONAL_PRICED'
      break
    }

    case 'peer_help': {
      if (!t.helpVerified) return zero('OPTIONAL_HELP_UNVERIFIED')
      if (!t.helperIsNotRecipient) return zero('OPTIONAL_HELP_SELF')
      if (!t.recipientTaskUnpaid) return zero('OPTIONAL_HELP_RECIPIENT_ALREADY_PAID')
      if (t.helperPaidCountToday >= CHINH_SACH_CORE.helpDailyCountCap) {
        return zero('OPTIONAL_HELP_DAILY_CAP')
      }
      pricedAmount = CHINH_SACH_CORE.optionalPrice.peer_help
      lyDo = 'OPTIONAL_PRICED'
      break
    }

    case 'consolidation': {
      if (!t.independent) return zero('OPTIONAL_NOT_INDEPENDENT')
      if (!t.correct) return zero('OPTIONAL_WRONG')
      if (!t.contentLockFree) return zero('OPTIONAL_DUPLICATE_CONTENT_GROUP')
      if (!t.scopeLevelValid) return zero('OPTIONAL_SCOPE_INVALID')
      const full = CHINH_SACH_CORE.correctCorePrice[t.part][t.difficulty]
      if (t.part === 'II') {
        const m = t.partIIMandatoryTotal as number
        const k = t.partIICorrectCount as number
        if (k !== m) return zero('OPTIONAL_PARTIAL_II')
      }
      pricedAmount = full
      lyDo = 'OPTIONAL_PRICED'
      break
    }
  }

  const available = Math.max(0, CHINH_SACH_CORE.optionalCap - optionalPaid)
  const grantedAmount = Math.min(pricedAmount, available)
  return {
    pricedAmount,
    grantedAmount,
    lyDo: grantedAmount < pricedAmount ? 'OPTIONAL_CAPPED' : lyDo,
  }
}
