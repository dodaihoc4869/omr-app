// CNH-1.0 P07 — PURE SNAPSHOT GRADING ADAPTER.
//
// Scope of THIS file (deliberately narrow):
//   * Grade ONE attempt from the IMMUTABLE server snapshot (`AnhChupNhiemVu`) + the raw answer.
//   * The ONLY inputs are (a) a validated stored snapshot and (b) the raw answer payload.
//     The current question bank, the client's `correct` flag, the client's price/assistance,
//     and any live lookup are NEVER consulted. Grading is a pure function of pinned material.
//   * Versioned grading-material contracts stored in `snapshot.grading` (Parts I/II/III),
//     validated structurally and FAIL-CLOSED (malformed ⇒ typed error, never a silent `false`).
//   * Part III delegates to the EXISTING engine `chamTheoPolicy` (src/lib/cham-so-policy.ts).
//     No reimplementation, no default policy, no fallback when the policy is malformed.
//
// Explicitly OUT of scope here (integration is the NEXT job):
//   * DB writes, ledger/receipt, wallet mutation, atomic locks. This module computes a grade.
//   * HTTP routes. `gradeFromSnapshot` is a pure function, NOT a route.
//   * Reward pricing. The caller feeds `correct`/`subitems` into `giaCoreRaw` (cnh-exp-policy.ts).
//
// No clock, no randomness, no I/O. Deterministic: same snapshot + same answer ⇒ same result.

import { kiemTraAnhChup, LoiAnhChup, type AnhChupNhiemVu, type Phan } from './cnh-exp-task'
import { chamTheoPolicy, ChamInputError, ChamMaterialError, type GradingResult } from '../../src/lib/cham-so-policy'

/** Version tag for the grading-material contracts understood by this adapter. */
export const GRADING_MATERIAL_VERSION = 'CNH-1.0' as const

/** Typed error codes for grading failures. */
export type MaLoiCham =
  | 'GRADING_MATERIAL_INVALID'
  | 'GRADING_MATERIAL_VERSION_UNSUPPORTED'
  | 'ANSWER_INVALID'
  | 'ANSWER_MALFORMED'

export class LoiCham extends Error {
  readonly ma: MaLoiCham
  constructor(ma: MaLoiCham, thongDiep: string) {
    super(thongDiep)
    this.name = 'LoiCham'
    this.ma = ma
  }
}

// ---------------------------------------------------------------------------
// 1. Versioned grading-material contracts.
//
// SINGLE AUTHORITY: the answer key and the displayed→canonical mapping live ONLY in the
// OUTER snapshot slots `snapshot.grading.key` and `snapshot.grading.orderMapping`.
// `snapshot.grading.gradingPolicy` carries ONLY the `kind` discriminator, per-part options,
// and (Part III) the policy metadata. A nested `key`/`orderMapping` inside `gradingPolicy`
// is REJECTED as ambiguous — there is no deployed compatibility to preserve.
// ---------------------------------------------------------------------------

/** Part I options (no key/mapping here — those come from the outer snapshot slots). */
export interface VatLieuChamPhanI {
  readonly kind: 'part-i-option-id-v1'
  /** Canonical option ID that is the correct answer (from `snapshot.grading.key`). */
  readonly key: string
  /** Displayed option ID → canonical option ID (from `snapshot.grading.orderMapping`). */
  readonly orderMapping: Readonly<Record<string, string>>
}

/** Part II options (no key/mapping here — those come from the outer snapshot slots). */
export interface VatLieuChamPhanII {
  readonly kind: 'part-ii-subitems-v1'
  /** Mandatory subitems, in issued order (from `snapshot.grading.key`). */
  readonly key: readonly { readonly id: string; readonly correct: boolean; readonly skillIds: readonly string[] }[]
  /** Displayed subitem ID → canonical subitem ID (from `snapshot.grading.orderMapping`). */
  readonly orderMapping: Readonly<Record<string, string>>
  /** When true, the answer may use `D`/`S` strings (normalized to boolean). Default: false. */
  readonly allowDS?: boolean
}

/** Part III: exact `ChamInput` policy metadata for the existing engine. */
export interface VatLieuChamPhanIII {
  readonly kind: 'part-iii-policy-v1'
  /** Pinned answer key (string, from `snapshot.grading.key`). */
  readonly key: string
  /** Exact policy metadata forwarded to `chamTheoPolicy`. */
  readonly policy: {
    readonly policy: 'numeric-value-v1' | 'numeric-rounded-v1' | 'numeric-unit-v1' | 'literal-v1'
    readonly policyVersion: 'CNH-1.0'
    readonly decimals?: number
    readonly requiredUnit?: string
    readonly allowedConversions?: readonly string[]
    readonly allowFraction?: boolean
    readonly accepted?: readonly string[]
  }
}

export type VatLieuCham = VatLieuChamPhanI | VatLieuChamPhanII | VatLieuChamPhanIII

// ---------------------------------------------------------------------------
// 2. Structural validation of grading material (fail-closed)
// ---------------------------------------------------------------------------

function laObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function chuoiKhongRong(v: unknown, ten: string): string {
  if (typeof v !== 'string' || v.length === 0) {
    throw new LoiCham('GRADING_MATERIAL_INVALID', `${ten} phải là chuỗi không rỗng: ${String(v)}`)
  }
  return v
}

/**
 * Validate a displayed→canonical mapping: plain object, non-empty string keys/values,
 * and NO two displayed IDs mapping to the same canonical ID (ambiguous duplicate target).
 */
function kiemTraAnhXa(v: unknown, ten: string): Readonly<Record<string, string>> {
  if (!laObject(v)) {
    throw new LoiCham('GRADING_MATERIAL_INVALID', `${ten} phải là object`)
  }
  const keys = Object.keys(v)
  if (keys.length === 0) {
    throw new LoiCham('GRADING_MATERIAL_INVALID', `${ten} không được rỗng`)
  }
  const out: Record<string, string> = Object.create(null) as Record<string, string>
  const seenTargets = new Set<string>()
  for (const k of keys) {
    const target = chuoiKhongRong(v[k], `${ten}.${k}`)
    if (seenTargets.has(target)) {
      throw new LoiCham('GRADING_MATERIAL_INVALID', `${ten} có đích trùng (mơ hồ): ${target}`)
    }
    seenTargets.add(target)
    out[k] = target
  }
  return Object.freeze(out)
}

/** Reject a nested `key`/`orderMapping` inside `gradingPolicy` — the outer slots are the ONLY authority. */
function kiemTraKhongTrungKhoa(p: Record<string, unknown>): void {
  if (p.key !== undefined) {
    throw new LoiCham('GRADING_MATERIAL_INVALID', 'gradingPolicy không được chứa key (dùng snapshot.grading.key)')
  }
  if (p.orderMapping !== undefined) {
    throw new LoiCham('GRADING_MATERIAL_INVALID', 'gradingPolicy không được chứa orderMapping (dùng snapshot.grading.orderMapping)')
  }
}

function kiemTraVatLieuPhanI(
  key: string,
  orderMapping: Readonly<Record<string, string>>,
): VatLieuChamPhanI {
  if (!Object.values(orderMapping).includes(key)) {
    throw new LoiCham('GRADING_MATERIAL_INVALID', `grading.key không nằm trong orderMapping: ${key}`)
  }
  return Object.freeze({ kind: 'part-i-option-id-v1' as const, key, orderMapping })
}

function kiemTraVatLieuPhanII(
  p: Record<string, unknown>,
  rawKey: unknown,
  orderMapping: Readonly<Record<string, string>>,
): VatLieuChamPhanII {
  if (!Array.isArray(rawKey) || rawKey.length === 0) {
    throw new LoiCham('GRADING_MATERIAL_INVALID', 'grading.key (Phần II) phải là mảng không rỗng')
  }
  const ids = new Set<string>()
  const key = rawKey.map((raw, i) => {
    if (!laObject(raw)) {
      throw new LoiCham('GRADING_MATERIAL_INVALID', `grading.key[${i}] phải là object`)
    }
    const id = chuoiKhongRong(raw.id, `grading.key[${i}].id`)
    if (ids.has(id)) {
      throw new LoiCham('GRADING_MATERIAL_INVALID', `grading.key có id trùng: ${id}`)
    }
    ids.add(id)
    if (typeof raw.correct !== 'boolean') {
      throw new LoiCham('GRADING_MATERIAL_INVALID', `grading.key[${i}].correct phải là boolean`)
    }
    if (!Array.isArray(raw.skillIds) || raw.skillIds.some((s) => typeof s !== 'string' || !s.length)) {
      throw new LoiCham('GRADING_MATERIAL_INVALID', `grading.key[${i}].skillIds phải là mảng chuỗi không rỗng`)
    }
    return Object.freeze({
      id,
      correct: raw.correct,
      skillIds: Object.freeze((raw.skillIds as string[]).slice()),
    })
  })

  // Every canonical subitem must be covered by exactly one displayed ID (unique coverage).
  const covered = new Set(Object.values(orderMapping))
  for (const id of ids) {
    if (!covered.has(id)) {
      throw new LoiCham('GRADING_MATERIAL_INVALID', `orderMapping thiếu subitem bắt buộc: ${id}`)
    }
  }
  for (const target of covered) {
    if (!ids.has(target)) {
      throw new LoiCham('GRADING_MATERIAL_INVALID', `orderMapping trỏ tới subitem không có trong key: ${target}`)
    }
  }

  const out: { kind: 'part-ii-subitems-v1'; key: VatLieuChamPhanII['key']; orderMapping: Readonly<Record<string, string>>; allowDS?: boolean } = {
    kind: 'part-ii-subitems-v1',
    key: Object.freeze(key),
    orderMapping,
  }
  if (p.allowDS !== undefined) {
    if (typeof p.allowDS !== 'boolean') {
      throw new LoiCham('GRADING_MATERIAL_INVALID', 'grading.allowDS phải là boolean')
    }
    out.allowDS = p.allowDS
  }
  return Object.freeze(out)
}

function kiemTraVatLieuPhanIII(
  p: Record<string, unknown>,
  key: string,
): VatLieuChamPhanIII {
  if (!laObject(p.policy)) {
    throw new LoiCham('GRADING_MATERIAL_INVALID', 'grading.policy phải là object')
  }
  const meta = p.policy
  const policy = chuoiKhongRong(meta.policy, 'grading.policy.policy')
  const HOP_LE = ['numeric-value-v1', 'numeric-rounded-v1', 'numeric-unit-v1', 'literal-v1']
  if (!HOP_LE.includes(policy)) {
    throw new LoiCham('GRADING_MATERIAL_VERSION_UNSUPPORTED', `policy không hỗ trợ: ${policy}`)
  }
  // Require an EXPLICIT pinned policy version — no default, no fallback.
  if (meta.policyVersion !== 'CNH-1.0') {
    throw new LoiCham(
      'GRADING_MATERIAL_VERSION_UNSUPPORTED',
      `grading.policy.policyVersion phải là "CNH-1.0": ${String(meta.policyVersion)}`,
    )
  }
  // Validate array/boolean TYPES before any slice/spread so a string is never spread into chars.
  let allowedConversions: readonly string[] | undefined
  if (meta.allowedConversions !== undefined) {
    if (!Array.isArray(meta.allowedConversions) || meta.allowedConversions.some((x) => typeof x !== 'string' || !x.length)) {
      throw new LoiCham('GRADING_MATERIAL_INVALID', 'grading.policy.allowedConversions phải là mảng chuỗi không rỗng')
    }
    allowedConversions = Object.freeze((meta.allowedConversions as string[]).slice())
  }
  let accepted: readonly string[] | undefined
  if (meta.accepted !== undefined) {
    if (!Array.isArray(meta.accepted) || meta.accepted.some((x) => typeof x !== 'string' || !x.length)) {
      throw new LoiCham('GRADING_MATERIAL_INVALID', 'grading.policy.accepted phải là mảng chuỗi không rỗng')
    }
    accepted = Object.freeze((meta.accepted as string[]).slice())
  }
  let allowFraction: boolean | undefined
  if (meta.allowFraction !== undefined) {
    if (typeof meta.allowFraction !== 'boolean') {
      throw new LoiCham('GRADING_MATERIAL_INVALID', 'grading.policy.allowFraction phải là boolean')
    }
    allowFraction = meta.allowFraction
  }
  const out: {
    kind: 'part-iii-policy-v1'
    key: string
    policy: VatLieuChamPhanIII['policy']
  } = {
    kind: 'part-iii-policy-v1',
    key,
    policy: Object.freeze({
      policy: policy as VatLieuChamPhanIII['policy']['policy'],
      policyVersion: 'CNH-1.0' as const,
      ...(meta.decimals !== undefined ? { decimals: meta.decimals as number } : {}),
      ...(meta.requiredUnit !== undefined ? { requiredUnit: chuoiKhongRong(meta.requiredUnit, 'grading.policy.requiredUnit') } : {}),
      ...(allowedConversions !== undefined ? { allowedConversions } : {}),
      ...(allowFraction !== undefined ? { allowFraction } : {}),
      ...(accepted !== undefined ? { accepted } : {}),
    }),
  }
  return Object.freeze(out)
}

/**
 * Validate grading material against the pinned part. Fail-closed.
 *
 * `key` and `orderMapping` come from the OUTER snapshot slots (`snapshot.grading.key` /
 * `snapshot.grading.orderMapping`) — the SINGLE authority. `gradingPolicy` carries only the
 * `kind` discriminator, per-part options, and (Part III) policy metadata; a nested
 * `key`/`orderMapping` inside it is rejected as ambiguous.
 */
export function kiemTraVatLieuCham(
  part: Phan,
  rawPolicy: unknown,
  rawKey: unknown,
  rawOrderMapping: unknown,
): VatLieuCham {
  if (!laObject(rawPolicy)) {
    throw new LoiCham('GRADING_MATERIAL_INVALID', 'grading.gradingPolicy phải là object')
  }
  kiemTraKhongTrungKhoa(rawPolicy)
  const kind = rawPolicy.kind
  if (part === 'I') {
    if (kind !== 'part-i-option-id-v1') {
      throw new LoiCham('GRADING_MATERIAL_INVALID', `Phần I cần kind part-i-option-id-v1, nhận ${String(kind)}`)
    }
    const key = chuoiKhongRong(rawKey, 'grading.key')
    const orderMapping = kiemTraAnhXa(rawOrderMapping, 'grading.orderMapping')
    return kiemTraVatLieuPhanI(key, orderMapping)
  }
  if (part === 'II') {
    if (kind !== 'part-ii-subitems-v1') {
      throw new LoiCham('GRADING_MATERIAL_INVALID', `Phần II cần kind part-ii-subitems-v1, nhận ${String(kind)}`)
    }
    const orderMapping = kiemTraAnhXa(rawOrderMapping, 'grading.orderMapping')
    return kiemTraVatLieuPhanII(rawPolicy, rawKey, orderMapping)
  }
  if (kind !== 'part-iii-policy-v1') {
    throw new LoiCham('GRADING_MATERIAL_INVALID', `Phần III cần kind part-iii-policy-v1, nhận ${String(kind)}`)
  }
  const key = chuoiKhongRong(rawKey, 'grading.key')
  return kiemTraVatLieuPhanIII(rawPolicy, key)
}

// ---------------------------------------------------------------------------
// 3. Typed grade result (NO keys/solutions leaked)
// ---------------------------------------------------------------------------

export interface KetQuaChamY {
  readonly id: string
  readonly correct: boolean
  readonly skillIds: readonly string[]
}

export interface KetQuaCham {
  /** True when the answer was well-formed and grading ran. False ⇒ malformed answer. */
  readonly valid: boolean
  /** Whole-answer correctness (Part II: all mandatory subitems correct). */
  readonly correct: boolean
  /** Part II only: per-subitem results, in issued order. */
  readonly subitems?: readonly KetQuaChamY[]
  /** Part II only: total mandatory subitems (m). */
  readonly mandatoryTotal?: number
  /** Part II only: correct subitems (k). */
  readonly correctCount?: number
  /** Part III only: engine error (e.g. `unsupported-format`), when the engine returned one. */
  readonly error?: GradingResult['error']
}

// ---------------------------------------------------------------------------
// 4. Part I grading
// ---------------------------------------------------------------------------

function chamPhanI(m: VatLieuChamPhanI, answer: unknown): KetQuaCham {
  if (typeof answer !== 'string' || answer.length === 0) {
    throw new LoiCham('ANSWER_INVALID', 'đáp án Phần I phải là chuỗi không rỗng (displayedID)')
  }
  const canonical = m.orderMapping[answer]
  if (canonical === undefined) {
    throw new LoiCham('ANSWER_MALFORMED', `displayedID không có trong orderMapping: ${answer}`)
  }
  return { valid: true, correct: canonical === m.key }
}

// ---------------------------------------------------------------------------
// 5. Part II grading
// ---------------------------------------------------------------------------

function chuanHoaBoolean(v: unknown, allowDS: boolean, ten: string): boolean {
  if (typeof v === 'boolean') return v
  if (allowDS && typeof v === 'string') {
    const s = v.trim().toUpperCase()
    if (s === 'D') return true
    if (s === 'S') return false
  }
  throw new LoiCham('ANSWER_MALFORMED', `${ten} phải là boolean${allowDS ? ' hoặc "D"/"S"' : ''}`)
}

function chamPhanII(m: VatLieuChamPhanII, answer: unknown): KetQuaCham {
  if (!laObject(answer)) {
    throw new LoiCham('ANSWER_INVALID', 'đáp án Phần II phải là object displayedID→boolean')
  }
  // Reject accessors BEFORE reading any value (never invoke a getter/setter).
  for (const k of Object.keys(answer)) {
    const d = Object.getOwnPropertyDescriptor(answer, k)
    if (d !== undefined && (d.get !== undefined || d.set !== undefined)) {
      throw new LoiCham('ANSWER_MALFORMED', `answer.${k} là getter/setter (không được gọi)`)
    }
  }
  const allowDS = m.allowDS === true
  const subitems: KetQuaChamY[] = []
  let correctCount = 0
  for (const item of m.key) {
    // Find the displayed ID that maps to this canonical subitem.
    const displayed = Object.keys(m.orderMapping).find((d) => m.orderMapping[d] === item.id)
    if (displayed === undefined) {
      throw new LoiCham('GRADING_MATERIAL_INVALID', `không có displayedID cho subitem: ${item.id}`)
    }
    // Require an OWN property: an inherited value must not satisfy a mandatory subitem.
    if (!Object.prototype.hasOwnProperty.call(answer, displayed)) {
      throw new LoiCham('ANSWER_MALFORMED', `thiếu câu trả lời cho subitem: ${displayed}`)
    }
    const value = chuanHoaBoolean(answer[displayed], allowDS, `answer.${displayed}`)
    const ok = value === item.correct
    if (ok) correctCount++
    subitems.push(Object.freeze({ id: item.id, correct: ok, skillIds: item.skillIds }))
  }
  // Reject unknown displayed IDs (not part of the issued mapping).
  for (const k of Object.keys(answer)) {
    if (!(k in m.orderMapping)) {
      throw new LoiCham('ANSWER_MALFORMED', `displayedID lạ trong đáp án Phần II: ${k}`)
    }
  }
  const mandatoryTotal = m.key.length
  return {
    valid: true,
    correct: correctCount === mandatoryTotal,
    subitems: Object.freeze(subitems),
    mandatoryTotal,
    correctCount,
  }
}

// ---------------------------------------------------------------------------
// 6. Part III grading (delegates to the existing engine)
// ---------------------------------------------------------------------------

function chamPhanIII(m: VatLieuChamPhanIII, answer: unknown): KetQuaCham {
  if (typeof answer !== 'string' || answer.length === 0) {
    throw new LoiCham('ANSWER_INVALID', 'đáp án Phần III phải là chuỗi không rỗng')
  }
  let result: GradingResult
  try {
    result = chamTheoPolicy({
      policy: m.policy.policy,
      key: m.key,
      answer,
      ...(m.policy.policyVersion !== undefined ? { policyVersion: m.policy.policyVersion } : {}),
      ...(m.policy.decimals !== undefined ? { decimals: m.policy.decimals } : {}),
      ...(m.policy.requiredUnit !== undefined ? { requiredUnit: m.policy.requiredUnit } : {}),
      ...(m.policy.allowedConversions !== undefined ? { allowedConversions: [...m.policy.allowedConversions] } : {}),
      ...(m.policy.allowFraction !== undefined ? { allowFraction: m.policy.allowFraction } : {}),
      ...(m.policy.accepted !== undefined ? { accepted: [...m.policy.accepted] } : {}),
    })
  } catch (e) {
    if (e instanceof ChamInputError || e instanceof ChamMaterialError) {
      throw new LoiCham('GRADING_MATERIAL_INVALID', `policy metadata không hợp lệ: ${e.message}`)
    }
    throw e
  }
  return {
    valid: result.error === undefined,
    correct: result.correct,
    ...(result.error !== undefined ? { error: result.error } : {}),
  }
}

// ---------------------------------------------------------------------------
// 7. Public entry point
// ---------------------------------------------------------------------------

/**
 * Grade ONE attempt from the IMMUTABLE server snapshot + the raw answer.
 *
 * The snapshot is re-validated via `kiemTraAnhChup` (fail-closed). The answer key and the
 * displayed→canonical mapping are read from the OUTER snapshot slots `snapshot.grading.key`
 * and `snapshot.grading.orderMapping`; `snapshot.grading.gradingPolicy` carries only the
 * `kind` discriminator, per-part options, and (Part III) policy metadata. The current
 * question bank, the client's `correct` flag, price and assistance are NEVER consulted.
 *
 * Throws `LoiCham` on malformed grading material or malformed answer. Returns a typed
 * `KetQuaCham` that NEVER contains the answer key or solution.
 */
export function gradeFromSnapshot(snapshot: unknown, rawAnswer: unknown): KetQuaCham {
  let s: AnhChupNhiemVu
  try {
    s = kiemTraAnhChup(snapshot)
  } catch (e) {
    if (e instanceof LoiAnhChup) {
      throw new LoiCham('GRADING_MATERIAL_INVALID', `ảnh chụp không hợp lệ: ${e.message}`)
    }
    throw e
  }

  const material = kiemTraVatLieuCham(s.part, s.grading.gradingPolicy, s.grading.key, s.grading.orderMapping)

  switch (material.kind) {
    case 'part-i-option-id-v1':
      return chamPhanI(material, rawAnswer)
    case 'part-ii-subitems-v1':
      return chamPhanII(material, rawAnswer)
    case 'part-iii-policy-v1':
      return chamPhanIII(material, rawAnswer)
  }
}
