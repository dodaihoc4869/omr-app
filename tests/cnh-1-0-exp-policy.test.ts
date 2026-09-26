// @vitest-environment node
// CNH-1.0 P07 — FOUNDATION tests for the pure core pricing + entitlement policy.
// Reads THAM-SO.json via fs (server tsconfig has no resolveJsonModule) to prevent drift.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  CHINH_SACH_CORE,
  giaBuocTuLamGiaoVienRaw,
  giaCoreRaw,
  giaOptionalRaw,
  kiemTraBuocTuLamGiaoVien,
  kiemTraNhiemVuCore,
  kiemTraNhiemVuOptional,
  quyenCore,
  type NhiemVuCore,
  type NhiemVuOptional,
} from '../server/src/cnh-exp-policy'

const HERE = dirname(fileURLToPath(import.meta.url))
const THAM_SO = JSON.parse(
  readFileSync(resolve(HERE, '../docs/cline-ca-nhan-hoa-2309/THAM-SO.json'), 'utf8'),
) as {
  economy: {
    coreCap: number
    optionalCap: number
    baseValidCoreAttempt: number
    correctCorePrice: Record<'I' | 'II' | 'III', number[]>
    optionalPrice: Record<'due_review' | 'transfer' | 'repair_complete' | 'peer_help', number>
    helpDailyCountCap: number
  }
}

const task = (o: Partial<NhiemVuCore> & { part: NhiemVuCore['part'] }): NhiemVuCore => {
  const base: NhiemVuCore = {
    difficulty: 1,
    validAttempt: true,
    assistance: 'none',
    alreadyPaidContentGroupToday: false,
    released: true,
    correct: true,
    ...o,
  }
  // Part II fields are only valid on part "II"; never attach them to I/III fixtures.
  if (base.part === 'II') {
    return {
      partIIMandatoryTotal: 4,
      partIICorrectCount: 4,
      ...base,
    }
  }
  return base
}

describe('P07 — constants are locked to THAM-SO.json (no drift)', () => {
  it('coreCap / baseValidCoreAttempt / correctCorePrice match the JSON source', () => {
    expect(CHINH_SACH_CORE.coreCap).toBe(THAM_SO.economy.coreCap)
    expect(CHINH_SACH_CORE.baseValidCoreAttempt).toBe(THAM_SO.economy.baseValidCoreAttempt)
    expect(CHINH_SACH_CORE.correctCorePrice.I).toEqual(THAM_SO.economy.correctCorePrice.I)
    expect(CHINH_SACH_CORE.correctCorePrice.II).toEqual(THAM_SO.economy.correctCorePrice.II)
    expect(CHINH_SACH_CORE.correctCorePrice.III).toEqual(THAM_SO.economy.correctCorePrice.III)
  })

  it('optionalCap / optionalPrice / helpDailyCountCap match the JSON source', () => {
    expect(CHINH_SACH_CORE.optionalCap).toBe(THAM_SO.economy.optionalCap)
    expect(CHINH_SACH_CORE.optionalPrice.due_review).toBe(THAM_SO.economy.optionalPrice.due_review)
    expect(CHINH_SACH_CORE.optionalPrice.transfer).toBe(THAM_SO.economy.optionalPrice.transfer)
    expect(CHINH_SACH_CORE.optionalPrice.repair_complete).toBe(THAM_SO.economy.optionalPrice.repair_complete)
    expect(CHINH_SACH_CORE.optionalPrice.peer_help).toBe(THAM_SO.economy.optionalPrice.peer_help)
    expect(CHINH_SACH_CORE.helpDailyCountCap).toBe(THAM_SO.economy.helpDailyCountCap)
  })

  it('the policy object is frozen (no accidental mutation)', () => {
    expect(Object.isFrozen(CHINH_SACH_CORE)).toBe(true)
    expect(Object.isFrozen(CHINH_SACH_CORE.correctCorePrice)).toBe(true)
    expect(Object.isFrozen(CHINH_SACH_CORE.optionalPrice)).toBe(true)
  })
})

describe('P07 — all 9 full-correct prices (unassisted, valid, released, not paid)', () => {
  const cases: Array<[NhiemVuCore['part'], 0 | 1 | 2, number]> = [
    ['I', 0, 2], ['I', 1, 3], ['I', 2, 5],
    ['II', 0, 3], ['II', 1, 5], ['II', 2, 8],
    ['III', 0, 4], ['III', 1, 6], ['III', 2, 10],
  ]
  for (const [part, difficulty, expected] of cases) {
    it(`${part} difficulty ${difficulty} ⇒ ${expected}`, () => {
      const r = giaCoreRaw(task({ part, difficulty }))
      expect(r.raw).toBe(expected)
      expect(r.lyDo).toBe('CORRECT_FULL')
    })
  }
})

describe('P07 — wrong / assisted / unknown / invalid / duplicate / embargoed', () => {
  it('unassisted wrong I/III ⇒ base 2', () => {
    expect(giaCoreRaw(task({ part: 'I', difficulty: 2, correct: false }))).toEqual({
      raw: 2,
      lyDo: 'WRONG_VALID',
    })
    expect(giaCoreRaw(task({ part: 'III', difficulty: 2, correct: false }))).toEqual({
      raw: 2,
      lyDo: 'WRONG_VALID',
    })
  })

  it('assisted correct never grants the independent premium ⇒ base 2', () => {
    expect(giaCoreRaw(task({ part: 'III', difficulty: 2, assistance: 'assisted' }))).toEqual({
      raw: 2,
      lyDo: 'ASSISTED_OR_UNKNOWN',
    })
  })

  it('unknown assistance correct ⇒ base 2', () => {
    expect(giaCoreRaw(task({ part: 'I', difficulty: 2, assistance: 'unknown' }))).toEqual({
      raw: 2,
      lyDo: 'ASSISTED_OR_UNKNOWN',
    })
  })

  it('invalid / unsubmitted attempt ⇒ 0', () => {
    expect(giaCoreRaw(task({ part: 'I', difficulty: 2, validAttempt: false }))).toEqual({
      raw: 0,
      lyDo: 'INVALID_OR_UNSUBMITTED',
    })
  })

  it('content_group already paid today ⇒ 0', () => {
    expect(giaCoreRaw(task({ part: 'I', difficulty: 2, alreadyPaidContentGroupToday: true }))).toEqual({
      raw: 0,
      lyDo: 'DUPLICATE_CONTENT_GROUP_TODAY',
    })
  })

  it('embargoed (not released) ⇒ 0, even if otherwise correct', () => {
    expect(giaCoreRaw(task({ part: 'III', difficulty: 2, released: false }))).toEqual({
      raw: 0,
      lyDo: 'EMBARGOED',
    })
  })
})

describe('P07 — Part II partial credit: 2 + floor((full - 2) * k / m)', () => {
  it('difficulty 1, k=3, m=4, whole-answer correct=false ⇒ 4 (k/m is the authority)', () => {
    const r = giaCoreRaw(
      task({ part: 'II', difficulty: 1, partIIMandatoryTotal: 4, partIICorrectCount: 3, correct: false }),
    )
    expect(r.raw).toBe(4)
    expect(r.lyDo).toBe('CORRECT_PARTIAL_II')
  })

  it('k=0 ⇒ base 2; k=m ⇒ full price', () => {
    expect(giaCoreRaw(task({ part: 'II', difficulty: 1, partIIMandatoryTotal: 4, partIICorrectCount: 0 })).raw).toBe(2)
    expect(giaCoreRaw(task({ part: 'II', difficulty: 1, partIIMandatoryTotal: 4, partIICorrectCount: 4 })).raw).toBe(5)
  })

  it('sweeps k = 0..m for difficulty 2 (full 8, m=4) with correct = (k === m)', () => {
    const got = [0, 1, 2, 3, 4].map(
      (k) =>
        giaCoreRaw(
          task({
            part: 'II',
            difficulty: 2,
            partIIMandatoryTotal: 4,
            partIICorrectCount: k,
            correct: k === 4,
          }),
        ).raw,
    )
    expect(got).toEqual([2, 3, 5, 6, 8])
  })

  it('exact BigInt floor: k=m-1, m=MAX_SAFE_INTEGER, difficulty 2 ⇒ 7; k=m ⇒ 8', () => {
    const m = Number.MAX_SAFE_INTEGER
    expect(
      giaCoreRaw(
        task({ part: 'II', difficulty: 2, partIIMandatoryTotal: m, partIICorrectCount: m - 1, correct: false }),
      ).raw,
    ).toBe(7)
    expect(
      giaCoreRaw(
        task({ part: 'II', difficulty: 2, partIIMandatoryTotal: m, partIICorrectCount: m, correct: true }),
      ).raw,
    ).toBe(8)
  })

  it('rejects m <= 0 and k > m', () => {
    expect(() => giaCoreRaw(task({ part: 'II', difficulty: 1, partIIMandatoryTotal: 0, partIICorrectCount: 0 }))).toThrow()
    expect(() => giaCoreRaw(task({ part: 'II', difficulty: 1, partIIMandatoryTotal: 4, partIICorrectCount: 5 }))).toThrow()
  })
})

describe('P07 — runtime validation rejects malformed input (no fallback)', () => {
  it('rejects bad enums', () => {
    expect(() => kiemTraNhiemVuCore({ ...task({ part: 'I' }), part: 'IV' })).toThrow()
    expect(() => kiemTraNhiemVuCore({ ...task({ part: 'I' }), difficulty: 3 })).toThrow()
    expect(() => kiemTraNhiemVuCore({ ...task({ part: 'I' }), assistance: 'cheat' })).toThrow()
  })

  it('rejects non-boolean flags', () => {
    expect(() => kiemTraNhiemVuCore({ ...task({ part: 'I' }), validAttempt: 1 })).toThrow()
    expect(() => kiemTraNhiemVuCore({ ...task({ part: 'I' }), released: 'yes' })).toThrow()
  })

  it('rejects NaN / Infinity / negative / fractional counts', () => {
    const base = task({ part: 'II', difficulty: 1, partIIMandatoryTotal: 4, partIICorrectCount: 2 })
    expect(() => kiemTraNhiemVuCore({ ...base, partIIMandatoryTotal: Number.NaN })).toThrow()
    expect(() => kiemTraNhiemVuCore({ ...base, partIIMandatoryTotal: Number.POSITIVE_INFINITY })).toThrow()
    expect(() => kiemTraNhiemVuCore({ ...base, partIICorrectCount: -1 })).toThrow()
    expect(() => kiemTraNhiemVuCore({ ...base, partIICorrectCount: 1.5 })).toThrow()
  })

  it('rejects Part II fields on non-II parts', () => {
    expect(() => kiemTraNhiemVuCore({ ...task({ part: 'I' }), partIIMandatoryTotal: 4 })).toThrow()
    expect(() => kiemTraNhiemVuCore({ ...task({ part: 'III' }), partIICorrectCount: 2 })).toThrow()
  })

  it('rejects non-object input', () => {
    expect(() => kiemTraNhiemVuCore(null)).toThrow()
    expect(() => kiemTraNhiemVuCore('x')).toThrow()
  })
})

describe('P07 — teacher-confirmed independent step (separate explicit function)', () => {
  it('confirmed, released, not paid ⇒ 2', () => {
    expect(
      giaBuocTuLamGiaoVienRaw({ teacherConfirmed: true, alreadyPaidStepToday: false, released: true }),
    ).toEqual({ raw: 2, lyDo: 'TEACHER_STEP' })
  })

  it('unconfirmed ⇒ 0; duplicate ⇒ 0; embargoed ⇒ 0', () => {
    expect(
      giaBuocTuLamGiaoVienRaw({ teacherConfirmed: false, alreadyPaidStepToday: false, released: true }).raw,
    ).toBe(0)
    expect(
      giaBuocTuLamGiaoVienRaw({ teacherConfirmed: true, alreadyPaidStepToday: true, released: true }).raw,
    ).toBe(0)
    expect(
      giaBuocTuLamGiaoVienRaw({ teacherConfirmed: true, alreadyPaidStepToday: false, released: false }).raw,
    ).toBe(0)
  })

  it('validates its own input shape', () => {
    expect(() => kiemTraBuocTuLamGiaoVien({ teacherConfirmed: 'yes' })).toThrow()
  })
})

describe('P07 — core entitlement (03 §3.2)', () => {
  it('achieved ⇒ entitlement 220', () => {
    expect(quyenCore({ achieved: true, rawCore: 0, corePaid: 0, compensationAlreadyPaid: 0 })).toEqual({
      entitlement: 220,
      grant: 220,
    })
  })

  it('not achieved ⇒ min(220, rawCore)', () => {
    expect(quyenCore({ achieved: false, rawCore: 300, corePaid: 0, compensationAlreadyPaid: 0 })).toEqual({
      entitlement: 220,
      grant: 220,
    })
    expect(quyenCore({ achieved: false, rawCore: 50, corePaid: 0, compensationAlreadyPaid: 0 })).toEqual({
      entitlement: 50,
      grant: 50,
    })
  })

  it('136 paid ⇒ grant 84; 190 paid ⇒ grant 30; 220 paid ⇒ grant 0', () => {
    expect(quyenCore({ achieved: true, rawCore: 220, corePaid: 136, compensationAlreadyPaid: 0 }).grant).toBe(84)
    expect(quyenCore({ achieved: true, rawCore: 220, corePaid: 190, compensationAlreadyPaid: 0 }).grant).toBe(30)
    expect(quyenCore({ achieved: true, rawCore: 220, corePaid: 220, compensationAlreadyPaid: 0 }).grant).toBe(0)
  })

  it('rawCore overflow cap: rawCore huge but entitlement stays at 220', () => {
    expect(quyenCore({ achieved: false, rawCore: 1_000_000, corePaid: 0, compensationAlreadyPaid: 0 })).toEqual({
      entitlement: 220,
      grant: 220,
    })
  })

  it('correction raw 2 -> 5 on an already-220 day ⇒ grant 0 (total entitlement, not raw delta)', () => {
    expect(quyenCore({ achieved: true, rawCore: 5, corePaid: 220, compensationAlreadyPaid: 0 }).grant).toBe(0)
  })

  it('compensation already paid prevents a double grant', () => {
    expect(quyenCore({ achieved: true, rawCore: 220, corePaid: 136, compensationAlreadyPaid: 84 }).grant).toBe(0)
  })

  it('no negative clawback: overpaid day ⇒ grant 0', () => {
    expect(quyenCore({ achieved: true, rawCore: 220, corePaid: 300, compensationAlreadyPaid: 0 }).grant).toBe(0)
  })

  it('rejects malformed entitlement inputs', () => {
    expect(() => quyenCore({ achieved: 'yes', rawCore: 0, corePaid: 0, compensationAlreadyPaid: 0 })).toThrow()
    expect(() => quyenCore({ achieved: true, rawCore: -1, corePaid: 0, compensationAlreadyPaid: 0 })).toThrow()
    expect(() => quyenCore({ achieved: true, rawCore: 1.5, corePaid: 0, compensationAlreadyPaid: 0 })).toThrow()
    expect(() => quyenCore({ achieved: true, rawCore: Number.NaN, corePaid: 0, compensationAlreadyPaid: 0 })).toThrow()
  })

  it('safe-integer boundaries: MAX_SAFE_INTEGER rawCore is accepted; overflow of paid sum is rejected', () => {
    expect(
      quyenCore({ achieved: false, rawCore: Number.MAX_SAFE_INTEGER, corePaid: 0, compensationAlreadyPaid: 0 }),
    ).toEqual({ entitlement: 220, grant: 220 })
    expect(() =>
      quyenCore({
        achieved: true,
        rawCore: 0,
        corePaid: Number.MAX_SAFE_INTEGER,
        compensationAlreadyPaid: 1,
      }),
    ).toThrow()
  })
})

// ---------------------------------------------------------------------------
// P07 — OPTIONAL pricing (03 §4). Pure policy only; ledger locks are the next job.
// ---------------------------------------------------------------------------

const dueReview = (o: Partial<Extract<NhiemVuOptional, { purpose: 'due_review' }>> = {}) =>
  ({
    purpose: 'due_review',
    released: true,
    issued: true,
    independent: true,
    correct: true,
    dueAtIssuance: true,
    contentLockFree: true,
    scopeLevelValid: true,
    ...o,
  }) as NhiemVuOptional

const transfer = (o: Partial<Extract<NhiemVuOptional, { purpose: 'transfer' }>> = {}) =>
  ({
    purpose: 'transfer',
    released: true,
    issued: true,
    independent: true,
    correct: true,
    opportunityBoundToAttempt: true,
    familyTrained: true,
    contentGroupUnseen: true,
    scopeDifficultyValid: true,
    contentLockFree: true,
    opportunityLockFree: true,
    ...o,
  }) as NhiemVuOptional

const repair = (o: Partial<Extract<NhiemVuOptional, { purpose: 'repair_complete' }>> = {}) =>
  ({
    purpose: 'repair_complete',
    released: true,
    issued: true,
    episodeRecovered: true,
    episodeUnpaid: true,
    contentLockFree: true,
    ...o,
  }) as NhiemVuOptional

const help = (o: Partial<Extract<NhiemVuOptional, { purpose: 'peer_help' }>> = {}) =>
  ({
    purpose: 'peer_help',
    released: true,
    issued: true,
    helpVerified: true,
    helperIsNotRecipient: true,
    recipientTaskUnpaid: true,
    helperPaidCountToday: 0,
    ...o,
  }) as NhiemVuOptional

const consolidation = (o: Partial<Extract<NhiemVuOptional, { purpose: 'consolidation' }>> = {}) =>
  ({
    purpose: 'consolidation',
    released: true,
    issued: true,
    independent: true,
    correct: true,
    part: 'I',
    difficulty: 1,
    contentLockFree: true,
    scopeLevelValid: true,
    ...o,
  }) as NhiemVuOptional

describe('P07 — optional prices match the spec (immutable purpose)', () => {
  it('due_review 6, transfer 10, repair_complete 20, peer_help 5', () => {
    expect(giaOptionalRaw(dueReview(), 0)).toEqual({
      pricedAmount: 6,
      grantedAmount: 6,
      lyDo: 'OPTIONAL_PRICED',
    })
    expect(giaOptionalRaw(transfer(), 0)).toEqual({
      pricedAmount: 10,
      grantedAmount: 10,
      lyDo: 'OPTIONAL_PRICED',
    })
    expect(giaOptionalRaw(repair(), 0)).toEqual({
      pricedAmount: 20,
      grantedAmount: 20,
      lyDo: 'OPTIONAL_PRICED',
    })
    expect(giaOptionalRaw(help(), 0)).toEqual({
      pricedAmount: 5,
      grantedAmount: 5,
      lyDo: 'OPTIONAL_PRICED',
    })
  })

  it('repair_complete is 20, never 10+20 (no extra transfer)', () => {
    expect(giaOptionalRaw(repair(), 0).pricedAmount).toBe(20)
  })
})

describe('P07 — due_review guards', () => {
  it('not due at issuance ⇒ 0', () => {
    expect(giaOptionalRaw(dueReview({ dueAtIssuance: false }), 0).pricedAmount).toBe(0)
  })
  it('assisted/unknown ⇒ 0 (independent required)', () => {
    expect(giaOptionalRaw(dueReview({ independent: false }), 0).pricedAmount).toBe(0)
  })
  it('wrong ⇒ 0', () => {
    expect(giaOptionalRaw(dueReview({ correct: false }), 0).pricedAmount).toBe(0)
  })
  it('content lock already consumed ⇒ 0', () => {
    expect(giaOptionalRaw(dueReview({ contentLockFree: false }), 0).pricedAmount).toBe(0)
  })
  it('scope/level invalid ⇒ 0', () => {
    expect(giaOptionalRaw(dueReview({ scopeLevelValid: false }), 0).pricedAmount).toBe(0)
  })
})

describe('P07 — transfer guards', () => {
  it('wrong ⇒ priced 0 (ledger still consumes the opportunity — persistence is out of scope)', () => {
    expect(giaOptionalRaw(transfer({ correct: false }), 0).pricedAmount).toBe(0)
  })
  it('opportunity not bound to this attempt ⇒ 0', () => {
    expect(giaOptionalRaw(transfer({ opportunityBoundToAttempt: false }), 0).pricedAmount).toBe(0)
  })
  it('family not trained ⇒ 0', () => {
    expect(giaOptionalRaw(transfer({ familyTrained: false }), 0).pricedAmount).toBe(0)
  })
  it('content_group already seen ⇒ 0', () => {
    expect(giaOptionalRaw(transfer({ contentGroupUnseen: false }), 0).pricedAmount).toBe(0)
  })
  it('scope/difficulty invalid ⇒ 0', () => {
    expect(giaOptionalRaw(transfer({ scopeDifficultyValid: false }), 0).pricedAmount).toBe(0)
  })
  it('opportunity consumed by another attempt ⇒ 0', () => {
    expect(giaOptionalRaw(transfer({ opportunityLockFree: false }), 0).pricedAmount).toBe(0)
  })
  it('issued novel transfer but shared academic lock already paid today ⇒ priced 0 / granted 0', () => {
    // Novelty at issuance is true, opportunity is free, yet the same content_group was
    // already paid today by a core/due/repair task: the shared academic lock blocks it.
    expect(giaOptionalRaw(transfer({ contentLockFree: false }), 0)).toEqual({
      pricedAmount: 0,
      grantedAmount: 0,
      lyDo: 'OPTIONAL_DUPLICATE_CONTENT_GROUP',
    })
  })
  it('rejects missing or non-boolean contentLockFree', () => {
    const { contentLockFree: _omit, ...withoutLock } = transfer() as Record<string, unknown>
    expect(() => kiemTraNhiemVuOptional(withoutLock)).toThrow()
    expect(() => kiemTraNhiemVuOptional({ ...transfer(), contentLockFree: 'yes' })).toThrow()
  })
})

describe('P07 — repair_complete guards', () => {
  it('episode not recovered ⇒ 0', () => {
    expect(giaOptionalRaw(repair({ episodeRecovered: false }), 0).pricedAmount).toBe(0)
  })
  it('episode already paid ⇒ 0', () => {
    expect(giaOptionalRaw(repair({ episodeUnpaid: false }), 0).pricedAmount).toBe(0)
  })
  it('content lock consumed ⇒ 0', () => {
    expect(giaOptionalRaw(repair({ contentLockFree: false }), 0).pricedAmount).toBe(0)
  })
})

describe('P07 — peer_help guards', () => {
  it('unverified help ⇒ 0', () => {
    expect(giaOptionalRaw(help({ helpVerified: false }), 0).pricedAmount).toBe(0)
  })
  it('self-help (helper === recipient) ⇒ 0', () => {
    expect(giaOptionalRaw(help({ helperIsNotRecipient: false }), 0).pricedAmount).toBe(0)
  })
  it('recipient task already paid by any helper ⇒ 0', () => {
    expect(giaOptionalRaw(help({ recipientTaskUnpaid: false }), 0).pricedAmount).toBe(0)
  })
  it('fifth help of the day is paid; sixth is blocked by the daily cap', () => {
    expect(giaOptionalRaw(help({ helperPaidCountToday: 4 }), 0).pricedAmount).toBe(5)
    expect(giaOptionalRaw(help({ helperPaidCountToday: 5 }), 0).pricedAmount).toBe(0)
  })
  it('no attempt/correctness requirement on the helper itself', () => {
    // The helper's own attempt facts are irrelevant; validity comes from the verified event.
    expect(giaOptionalRaw(help(), 0).pricedAmount).toBe(5)
  })
})

describe('P07 — consolidation uses the core full-price table', () => {
  const cases: Array<[NhiemVuCore['part'], 0 | 1 | 2, number]> = [
    ['I', 0, 2], ['I', 1, 3], ['I', 2, 5],
    ['II', 0, 3], ['II', 1, 5], ['II', 2, 8],
    ['III', 0, 4], ['III', 1, 6], ['III', 2, 10],
  ]
  for (const [part, difficulty, expected] of cases) {
    it(`${part} difficulty ${difficulty} ⇒ ${expected}`, () => {
      const t =
        part === 'II'
          ? consolidation({ part, difficulty, partIIMandatoryTotal: 4, partIICorrectCount: 4 })
          : consolidation({ part, difficulty })
      expect(giaOptionalRaw(t, 0).pricedAmount).toBe(expected)
    })
  }

  it('Part II partial (k < m) ⇒ 0; fully correct (k === m) ⇒ full price', () => {
    expect(
      giaOptionalRaw(
        consolidation({ part: 'II', difficulty: 2, partIIMandatoryTotal: 4, partIICorrectCount: 3, correct: false }),
        0,
      ).pricedAmount,
    ).toBe(0)
    expect(
      giaOptionalRaw(
        consolidation({ part: 'II', difficulty: 2, partIIMandatoryTotal: 4, partIICorrectCount: 4 }),
        0,
      ).pricedAmount,
    ).toBe(8)
  })

  it('assisted/unknown ⇒ 0; wrong ⇒ 0; content lock consumed ⇒ 0; scope invalid ⇒ 0', () => {
    expect(giaOptionalRaw(consolidation({ independent: false }), 0).pricedAmount).toBe(0)
    expect(giaOptionalRaw(consolidation({ correct: false }), 0).pricedAmount).toBe(0)
    expect(giaOptionalRaw(consolidation({ contentLockFree: false }), 0).pricedAmount).toBe(0)
    expect(giaOptionalRaw(consolidation({ scopeLevelValid: false }), 0).pricedAmount).toBe(0)
  })
})

describe('P07 — speed_practice / non-independent retries ⇒ 0', () => {
  it('speed_practice is always 0', () => {
    expect(giaOptionalRaw({ purpose: 'speed_practice', released: true, issued: true }, 0)).toEqual({
      pricedAmount: 0,
      grantedAmount: 0,
      lyDo: 'OPTIONAL_SPEED_PRACTICE',
    })
  })
})

describe('P07 — optional cap: grantedAmount = min(priced, max(0, 120 - optionalPaid))', () => {
  it('price 10 with optionalPaid 117 ⇒ granted 3, priced stays 10', () => {
    expect(giaOptionalRaw(transfer(), 117)).toEqual({
      pricedAmount: 10,
      grantedAmount: 3,
      lyDo: 'OPTIONAL_CAPPED',
    })
  })
  it('at optionalPaid 120 ⇒ granted 0 but priced 10 is retained (no debt, no drop)', () => {
    expect(giaOptionalRaw(transfer(), 120)).toEqual({
      pricedAmount: 10,
      grantedAmount: 0,
      lyDo: 'OPTIONAL_CAPPED',
    })
  })
  it('over-cap optionalPaid ⇒ granted 0, priced retained', () => {
    expect(giaOptionalRaw(transfer(), 500)).toEqual({
      pricedAmount: 10,
      grantedAmount: 0,
      lyDo: 'OPTIONAL_CAPPED',
    })
  })
  it('academic duplicate ⇒ priced 0 (not merely capped)', () => {
    expect(giaOptionalRaw(dueReview({ contentLockFree: false }), 0)).toEqual({
      pricedAmount: 0,
      grantedAmount: 0,
      lyDo: 'OPTIONAL_DUPLICATE_CONTENT_GROUP',
    })
  })
})

describe('P07 — optional: embargoed / not issued / malformed input', () => {
  it('embargoed ⇒ 0 regardless of purpose', () => {
    expect(giaOptionalRaw(dueReview({ released: false }), 0).lyDo).toBe('OPTIONAL_EMBARGOED')
    expect(giaOptionalRaw(transfer({ released: false }), 0).lyDo).toBe('OPTIONAL_EMBARGOED')
  })
  it('not issued by the server ⇒ 0', () => {
    expect(giaOptionalRaw(transfer({ issued: false }), 0).lyDo).toBe('OPTIONAL_NOT_ISSUED')
  })
  it('rejects unknown purpose', () => {
    expect(() => kiemTraNhiemVuOptional({ purpose: 'free_money', released: true, issued: true })).toThrow()
  })
  it('rejects malformed types', () => {
    expect(() => kiemTraNhiemVuOptional({ ...dueReview(), independent: 'yes' })).toThrow()
    expect(() => kiemTraNhiemVuOptional({ ...help(), helperPaidCountToday: -1 })).toThrow()
    expect(() => kiemTraNhiemVuOptional({ ...help(), helperPaidCountToday: 1.5 })).toThrow()
    expect(() => kiemTraNhiemVuOptional(null)).toThrow()
  })
  it('rejects malformed optionalPaid', () => {
    expect(() => giaOptionalRaw(dueReview(), -1)).toThrow()
    expect(() => giaOptionalRaw(dueReview(), 1.5)).toThrow()
    expect(() => giaOptionalRaw(dueReview(), Number.NaN)).toThrow()
  })
  it('safe-integer boundary: MAX_SAFE_INTEGER optionalPaid is accepted (granted 0)', () => {
    expect(giaOptionalRaw(transfer(), Number.MAX_SAFE_INTEGER).grantedAmount).toBe(0)
  })
})
