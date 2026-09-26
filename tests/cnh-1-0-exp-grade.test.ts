// @vitest-environment node
// CNH-1.0 P07 — PURE SNAPSHOT GRADING ADAPTER.
// Exercises `server/src/cnh-exp-grade.ts` against the immutable snapshot contract
// (`server/src/cnh-exp-task.ts`) and the existing Part III engine (`src/lib/cham-so-policy.ts`).
// Integration with core pricing (`giaCoreRaw`) is asserted with REAL numbers, not copies.
import { describe, expect, it } from 'vitest'
import { gradeFromSnapshot, LoiCham, kiemTraVatLieuCham } from '../server/src/cnh-exp-grade'
import { kiemTraAnhChup, type AnhChupNhiemVu } from '../server/src/cnh-exp-task'
import { giaCoreRaw } from '../server/src/cnh-exp-policy'

/**
 * Build a minimal valid snapshot. The answer key and displayed→canonical mapping are
 * distributed into the OUTER `grading.key` / `grading.orderMapping` slots (the single
 * authority); `gradingPolicy` carries only `kind` + options + Part III policy metadata.
 */
function snapshot(
  part: 'I' | 'II' | 'III',
  material: { key: unknown; orderMapping: unknown; gradingPolicy: unknown },
  difficulty: 0 | 1 | 2 = 1,
): AnhChupNhiemVu {
  return kiemTraAnhChup({
    taskId: 'T1',
    attemptId: 'A1',
    studentId: 'S1',
    qid: 'Q1',
    questionVersion: 'v1',
    contentGroup: 'CG1',
    familyId: 'F1',
    skillIds: ['SK1'],
    difficulty,
    part,
    purpose: 'maintenance',
    bucket: 'core',
    planId: 'P1',
    planRevision: 1,
    policy: { version: 'CNH-1.0', curriculumRevision: 1, bankRevision: 1, protectionRevision: 1, learnerRevision: 1 },
    issuedAt: 1000,
    expiresAt: 2000,
    expectedSeconds: 60,
    grading: { key: material.key, gradingPolicy: material.gradingPolicy, orderMapping: material.orderMapping },
  })
}

const PHAN_I = {
  key: 'C',
  orderMapping: { A: 'A', B: 'B', C: 'C', D: 'D' },
  gradingPolicy: { kind: 'part-i-option-id-v1' },
}

const PHAN_II = {
  key: [
    { id: 'a', correct: true, skillIds: ['SK1'] },
    { id: 'b', correct: false, skillIds: ['SK1'] },
    { id: 'c', correct: true, skillIds: ['SK2'] },
    { id: 'd', correct: false, skillIds: ['SK2'] },
  ],
  orderMapping: { '1': 'a', '2': 'b', '3': 'c', '4': 'd' },
  gradingPolicy: { kind: 'part-ii-subitems-v1' },
}

const PHAN_III = {
  key: '0,54',
  orderMapping: {},
  gradingPolicy: { kind: 'part-iii-policy-v1', policy: { policy: 'numeric-value-v1', policyVersion: 'CNH-1.0' } },
}

describe('P07 — Part I: canonical option-ID grading', () => {
  it('exact canonical match through the explicit identity mapping', () => {
    const s = snapshot('I', PHAN_I)
    expect(gradeFromSnapshot(s, 'C')).toEqual({ valid: true, correct: true })
    expect(gradeFromSnapshot(s, 'A')).toEqual({ valid: true, correct: false })
  })
  it('permuted displayed→canonical mapping still grades by canonical truth', () => {
    const permuted = {
      key: 'C',
      orderMapping: { A: 'D', B: 'C', C: 'B', D: 'A' },
      gradingPolicy: { kind: 'part-i-option-id-v1' },
    }
    const s = snapshot('I', permuted)
    expect(gradeFromSnapshot(s, 'B').correct).toBe(true) // displayed B → canonical C
    expect(gradeFromSnapshot(s, 'A').correct).toBe(false)
  })
  it('unknown displayedID is malformed, not silently false', () => {
    const s = snapshot('I', PHAN_I)
    expect(() => gradeFromSnapshot(s, 'Z')).toThrow(LoiCham)
    expect(() => gradeFromSnapshot(s, '')).toThrow(LoiCham)
    expect(() => gradeFromSnapshot(s, 3)).toThrow(LoiCham)
  })
  it('duplicate mapping target is rejected as malformed material', () => {
    expect(() =>
      kiemTraVatLieuCham('I', { kind: 'part-i-option-id-v1' }, 'C', { A: 'C', B: 'C' }),
    ).toThrow(LoiCham)
  })
  it('key not present in orderMapping is rejected', () => {
    expect(() =>
      kiemTraVatLieuCham('I', { kind: 'part-i-option-id-v1' }, 'Z', { A: 'A' }),
    ).toThrow(LoiCham)
  })
  it('the OUTER grading.key is the single authority for the correct answer', () => {
    const s = snapshot('I', { ...PHAN_I, key: 'A' })
    expect(gradeFromSnapshot(s, 'A').correct).toBe(true)
    expect(gradeFromSnapshot(s, 'C').correct).toBe(false)
  })
  it('the OUTER grading.orderMapping controls displayed→canonical interpretation', () => {
    const s = snapshot('I', { ...PHAN_I, orderMapping: { A: 'C', B: 'B', C: 'A', D: 'D' } })
    expect(gradeFromSnapshot(s, 'A').correct).toBe(true) // displayed A → canonical C
    expect(gradeFromSnapshot(s, 'C').correct).toBe(false)
  })
  it('a nested key/orderMapping inside gradingPolicy is rejected as ambiguous', () => {
    expect(() =>
      kiemTraVatLieuCham('I', { kind: 'part-i-option-id-v1', key: 'C' }, 'C', { A: 'A', B: 'B', C: 'C', D: 'D' }),
    ).toThrow(LoiCham)
    expect(() =>
      kiemTraVatLieuCham('I', { kind: 'part-i-option-id-v1', orderMapping: { A: 'A' } }, 'A', { A: 'A' }),
    ).toThrow(LoiCham)
  })
})

describe('P07 — Part II: mandatory subitems, per-subitem results', () => {
  it('all correct ⇒ whole correct, k = m', () => {
    const s = snapshot('II', PHAN_II)
    const r = gradeFromSnapshot(s, { '1': true, '2': false, '3': true, '4': false })
    expect(r.correct).toBe(true)
    expect(r.mandatoryTotal).toBe(4)
    expect(r.correctCount).toBe(4)
    expect(r.subitems?.map((x) => x.correct)).toEqual([true, true, true, true])
  })
  it('3/4 correct ⇒ whole false, k = 3 (feeds partial pricing)', () => {
    const s = snapshot('II', PHAN_II)
    const r = gradeFromSnapshot(s, { '1': true, '2': false, '3': true, '4': true })
    expect(r.correct).toBe(false)
    expect(r.correctCount).toBe(3)
    expect(r.mandatoryTotal).toBe(4)
  })
  it('permuted subitem mapping grades by canonical truth', () => {
    const permuted = { ...PHAN_II, orderMapping: { '1': 'd', '2': 'c', '3': 'b', '4': 'a' } }
    const s = snapshot('II', permuted)
    const r = gradeFromSnapshot(s, { '1': false, '2': true, '3': false, '4': true })
    expect(r.correct).toBe(true)
  })
  it('an inherited (non-own) answer property does not satisfy a mandatory subitem', () => {
    const s = snapshot('II', PHAN_II)
    const answer = Object.create({ '1': true, '2': false, '3': true, '4': false }) as Record<string, unknown>
    expect(() => gradeFromSnapshot(s, answer)).toThrow(LoiCham)
  })
  it('an accessor answer property is rejected without being invoked', () => {
    const s = snapshot('II', PHAN_II)
    let invoked = false
    const answer: Record<string, unknown> = { '2': false, '3': true, '4': false }
    Object.defineProperty(answer, '1', {
      enumerable: true,
      get() {
        invoked = true
        return true
      },
    })
    expect(() => gradeFromSnapshot(s, answer)).toThrow(LoiCham)
    expect(invoked).toBe(false)
  })
  it('missing mandatory answer is malformed, not silently false', () => {
    const s = snapshot('II', PHAN_II)
    expect(() => gradeFromSnapshot(s, { '1': true, '2': false, '3': true })).toThrow(LoiCham)
  })
  it('unknown displayedID in answer is malformed', () => {
    const s = snapshot('II', PHAN_II)
    expect(() => gradeFromSnapshot(s, { '1': true, '2': false, '3': true, '4': false, '9': true })).toThrow(LoiCham)
  })
  it('non-boolean value is malformed unless allowDS is set', () => {
    const s = snapshot('II', PHAN_II)
    expect(() => gradeFromSnapshot(s, { '1': 'D', '2': 'S', '3': 'D', '4': 'S' })).toThrow(LoiCham)
    const ds = snapshot('II', { ...PHAN_II, gradingPolicy: { ...PHAN_II.gradingPolicy, allowDS: true } })
    const r = gradeFromSnapshot(ds, { '1': 'D', '2': 'S', '3': 'D', '4': 'S' })
    expect(r.correct).toBe(true)
  })
  it('orderMapping missing a mandatory subitem is rejected', () => {
    expect(() =>
      kiemTraVatLieuCham('II', { kind: 'part-ii-subitems-v1' }, PHAN_II.key, { '1': 'a', '2': 'b', '3': 'c' }),
    ).toThrow(LoiCham)
  })
  it('orderMapping pointing to an unknown subitem is rejected', () => {
    expect(() =>
      kiemTraVatLieuCham('II', { kind: 'part-ii-subitems-v1' }, PHAN_II.key, { '1': 'a', '2': 'b', '3': 'c', '4': 'z' }),
    ).toThrow(LoiCham)
  })
  it('duplicate subitem id in key is rejected', () => {
    const badKey = [...PHAN_II.key, { id: 'a', correct: true, skillIds: ['SK1'] }]
    expect(() =>
      kiemTraVatLieuCham('II', { kind: 'part-ii-subitems-v1' }, badKey, PHAN_II.orderMapping),
    ).toThrow(LoiCham)
  })
})

describe('P07 — Part II integration with core pricing (real numbers)', () => {
  it('3/4 correct at difficulty 1 ⇒ giaCoreRaw raw = 4', () => {
    const s = snapshot('II', PHAN_II, 1)
    const r = gradeFromSnapshot(s, { '1': true, '2': false, '3': true, '4': true })
    const price = giaCoreRaw({
      part: 'II',
      difficulty: 1,
      validAttempt: true,
      assistance: 'none',
      alreadyPaidContentGroupToday: false,
      released: true,
      correct: r.correct,
      partIIMandatoryTotal: r.mandatoryTotal,
      partIICorrectCount: r.correctCount,
    })
    expect(price.raw).toBe(4)
    expect(price.lyDo).toBe('CORRECT_PARTIAL_II')
  })
  it('4/4 correct at difficulty 2 ⇒ giaCoreRaw raw = 8', () => {
    const s = snapshot('II', PHAN_II, 2)
    const r = gradeFromSnapshot(s, { '1': true, '2': false, '3': true, '4': false })
    const price = giaCoreRaw({
      part: 'II',
      difficulty: 2,
      validAttempt: true,
      assistance: 'none',
      alreadyPaidContentGroupToday: false,
      released: true,
      correct: r.correct,
      partIIMandatoryTotal: r.mandatoryTotal,
      partIICorrectCount: r.correctCount,
    })
    expect(price.raw).toBe(8)
    expect(price.lyDo).toBe('CORRECT_FULL')
  })
})

describe('P07 — Part III: delegates to the existing engine', () => {
  it('comma, minus, scientific and fraction forms via the locked policy', () => {
    const s = snapshot('III', PHAN_III)
    expect(gradeFromSnapshot(s, '0,54').correct).toBe(true)
    expect(gradeFromSnapshot(s, '0.54').correct).toBe(true)
    expect(gradeFromSnapshot(s, '０，５４０').correct).toBe(true)
    const sci = snapshot('III', {
      key: '0.0025',
      orderMapping: {},
      gradingPolicy: { kind: 'part-iii-policy-v1', policy: { policy: 'numeric-value-v1', policyVersion: 'CNH-1.0' } },
    })
    expect(gradeFromSnapshot(sci, '2,5×10^-3').correct).toBe(true)
    const frac = snapshot('III', {
      key: '0.5',
      orderMapping: {},
      gradingPolicy: { kind: 'part-iii-policy-v1', policy: { policy: 'numeric-value-v1', policyVersion: 'CNH-1.0', allowFraction: true } },
    })
    expect(gradeFromSnapshot(frac, '1/2').correct).toBe(true)
  })
  it('strict tolerance boundary: 1.0001 vs 1 is false, 1.00009 is true', () => {
    const s = snapshot('III', {
      key: '1',
      orderMapping: {},
      gradingPolicy: { kind: 'part-iii-policy-v1', policy: { policy: 'numeric-value-v1', policyVersion: 'CNH-1.0' } },
    })
    expect(gradeFromSnapshot(s, '1.0001').correct).toBe(false)
    expect(gradeFromSnapshot(s, '1.00009').correct).toBe(true)
  })
  it('numeric-rounded-v1 rounds half-away-from-zero by metadata decimals', () => {
    const s = snapshot('III', {
      key: '1.25',
      orderMapping: {},
      gradingPolicy: { kind: 'part-iii-policy-v1', policy: { policy: 'numeric-rounded-v1', policyVersion: 'CNH-1.0', decimals: 1 } },
    })
    expect(gradeFromSnapshot(s, '1.3').correct).toBe(true)
    expect(gradeFromSnapshot(s, '1.2').correct).toBe(false)
  })
  it('numeric-unit-v1 rejects g vs kg; accepts only declared aliases', () => {
    const s = snapshot('III', {
      key: '12',
      orderMapping: {},
      gradingPolicy: { kind: 'part-iii-policy-v1', policy: { policy: 'numeric-unit-v1', policyVersion: 'CNH-1.0', requiredUnit: 'g/mol' } },
    })
    expect(gradeFromSnapshot(s, '12 g/mol').correct).toBe(true)
    expect(gradeFromSnapshot(s, '12 kg/mol').correct).toBe(false)
    expect(gradeFromSnapshot(s, '12').correct).toBe(false)
    const alias = snapshot('III', {
      key: '12',
      orderMapping: {},
      gradingPolicy: { kind: 'part-iii-policy-v1', policy: { policy: 'numeric-unit-v1', policyVersion: 'CNH-1.0', requiredUnit: 'g/mol', allowedConversions: ['mol'] } },
    })
    expect(gradeFromSnapshot(alias, '12 mol').correct).toBe(true)
  })
  it('literal-v1 is not conflated with numeric', () => {
    const s = snapshot('III', {
      key: 'pH',
      orderMapping: {},
      gradingPolicy: { kind: 'part-iii-policy-v1', policy: { policy: 'literal-v1', policyVersion: 'CNH-1.0' } },
    })
    expect(gradeFromSnapshot(s, 'ph').correct).toBe(true)
    expect(gradeFromSnapshot(s, 'pOH').correct).toBe(false)
    const num = snapshot('III', {
      key: '12',
      orderMapping: {},
      gradingPolicy: { kind: 'part-iii-policy-v1', policy: { policy: 'literal-v1', policyVersion: 'CNH-1.0' } },
    })
    expect(gradeFromSnapshot(num, '12.0').correct).toBe(false)
  })
  it('unsupported-format is surfaced, not swallowed', () => {
    const s = snapshot('III', {
      key: '0.5',
      orderMapping: {},
      gradingPolicy: { kind: 'part-iii-policy-v1', policy: { policy: 'numeric-value-v1', policyVersion: 'CNH-1.0' } },
    })
    const r = gradeFromSnapshot(s, '1/2')
    expect(r.correct).toBe(false)
    expect(r.error).toBe('unsupported-format')
  })
  it('unsupported policy is rejected, no fallback', () => {
    expect(() =>
      kiemTraVatLieuCham('III', { kind: 'part-iii-policy-v1', policy: { policy: 'numeric-value-v2', policyVersion: 'CNH-1.0' } }, '1', {}),
    ).toThrow(LoiCham)
  })
  it('malformed policy metadata (missing decimals) is rejected', () => {
    const s = snapshot('III', {
      key: '1',
      orderMapping: {},
      gradingPolicy: { kind: 'part-iii-policy-v1', policy: { policy: 'numeric-rounded-v1', policyVersion: 'CNH-1.0' } },
    })
    expect(() => gradeFromSnapshot(s, '1')).toThrow(LoiCham)
  })
  it('a missing policyVersion is rejected (no default, no fallback)', () => {
    expect(() =>
      kiemTraVatLieuCham('III', { kind: 'part-iii-policy-v1', policy: { policy: 'numeric-value-v1' } }, '1', {}),
    ).toThrow(LoiCham)
  })
  it('a string allowedConversions is rejected before any spread', () => {
    expect(() =>
      kiemTraVatLieuCham(
        'III',
        { kind: 'part-iii-policy-v1', policy: { policy: 'numeric-unit-v1', policyVersion: 'CNH-1.0', requiredUnit: 'g/mol', allowedConversions: 'mol' } },
        '12',
        {},
      ),
    ).toThrow(LoiCham)
  })
  it('a string accepted is rejected before any spread', () => {
    expect(() =>
      kiemTraVatLieuCham(
        'III',
        { kind: 'part-iii-policy-v1', policy: { policy: 'literal-v1', policyVersion: 'CNH-1.0', accepted: 'pH' } },
        'pH',
        {},
      ),
    ).toThrow(LoiCham)
  })
  it('a non-boolean allowFraction is rejected', () => {
    expect(() =>
      kiemTraVatLieuCham(
        'III',
        { kind: 'part-iii-policy-v1', policy: { policy: 'numeric-value-v1', policyVersion: 'CNH-1.0', allowFraction: 'yes' } },
        '0.5',
        {},
      ),
    ).toThrow(LoiCham)
  })
})

describe('P07 — snapshot immutability and no key leakage', () => {
  it('mutating the source bank after snapshot does not alter the grade', () => {
    const bank = { key: 'C', orderMapping: { A: 'A', B: 'B', C: 'C', D: 'D' } }
    const s = snapshot('I', { key: bank.key, orderMapping: bank.orderMapping, gradingPolicy: { kind: 'part-i-option-id-v1' } })
    bank.key = 'A'
    bank.orderMapping.C = 'A'
    expect(gradeFromSnapshot(s, 'C').correct).toBe(true)
  })
  it('the result never contains the answer key or solution', () => {
    const s = snapshot('I', PHAN_I)
    const r = gradeFromSnapshot(s, 'C')
    const json = JSON.stringify(r)
    expect(json).not.toContain('"C"')
    expect(json).not.toContain('orderMapping')
    expect(json).not.toContain('key')
  })
  it('malformed snapshot fails closed', () => {
    expect(() => gradeFromSnapshot({}, 'C')).toThrow(LoiCham)
    expect(() => gradeFromSnapshot(null, 'C')).toThrow(LoiCham)
  })
})
