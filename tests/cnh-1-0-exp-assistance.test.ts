// P07 authoritative assistance command.
// @vitest-environment node
// CNH-1.0 P07 — AUTHORITATIVE ASSISTANCE COMMAND VERTICAL.
//
// ⚠️ RUNTIME: these tests run the server SQL against the REAL schema + migrations on Node's
// in-memory SQLite (`tests/_d1-that.ts`), NOT on Cloudflare D1/workerd. They prove schema shape
// and SQL semantics (CAS, ON CONFLICT, CHECK guard, batch rollback) — NOT D1 runtime concurrency,
// load limits, or dialect differences. Concurrency assertions here are serialised by the helper;
// a later job MUST re-run them on workerd/wrangler.
import { describe, expect, it } from 'vitest'
import { taoD1That, serialiseD1, type D1That } from './_d1-that'
import { phatAnhChup, type AnhChupNhiemVu } from '../server/src/cnh-exp-task'
import {
  ghiTroGiup,
  bamYeuCauTroGiup,
  LENH_TRO_GIUP,
  type LoaiTroGiup,
} from '../server/src/cnh-exp-assistance'
import {
  nopBaiCore,
  capDieuKhienNopBai,
  ngayHocVN,
  docSuKienHocTap,
} from '../server/src/cnh-exp-submit'

const PHIEN_BAN = 'CNH-1.0'

const PHAN_I = {
  key: 'C',
  orderMapping: { A: 'A', B: 'B', C: 'C', D: 'D' },
  gradingPolicy: { kind: 'part-i-option-id-v1' },
}

/** Build a valid snapshot for a given attempt/contentGroup. */
function snapshot(
  overrides: Partial<AnhChupNhiemVu> = {},
): AnhChupNhiemVu {
  return {
    taskId: 'T1',
    attemptId: 'A1',
    studentId: 'S1',
    qid: 'Q1',
    questionVersion: 'v1',
    contentGroup: 'CG1',
    familyId: 'F1',
    skillIds: ['SK1'],
    difficulty: 1,
    part: 'I',
    purpose: 'maintenance',
    bucket: 'core',
    planId: 'P1',
    planRevision: 1,
    policy: { version: 'CNH-1.0', curriculumRevision: 1, bankRevision: 1, protectionRevision: 1, learnerRevision: 1 },
    issuedAt: 1000,
    expiresAt: 2000,
    expectedSeconds: 60,
    grading: { key: PHAN_I.key, gradingPolicy: PHAN_I.gradingPolicy, orderMapping: PHAN_I.orderMapping },
    ...overrides,
  }
}

/** Seed the LEARNER (account + day) ONCE per student. */
function seedLearner(
  d1: D1That,
  opts: { studentId?: string; wallet?: number; earned?: number; rawCore?: number; achieved?: 0 | 1; corePaid?: number } = {},
) {
  const studentId = opts.studentId ?? 'S1'
  d1.sql
    .prepare(`INSERT INTO cnh_exp_account (student_id, wallet_exp, earned_exp, revision) VALUES (?, ?, ?, 0)`)
    .run(studentId, opts.wallet ?? 0, opts.earned ?? 0)
  d1.sql
    .prepare(
      `INSERT INTO cnh_exp_day (student_id, learning_day, policy_version, raw_core, achieved, core_paid, compensation_paid, revision)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0)`,
    )
    .run(studentId, ngayHocVN(1500), PHIEN_BAN, opts.rawCore ?? 0, opts.achieved ?? 0, opts.corePaid ?? 0)
}

/** Seed ONE attempt (snapshot + control) for an already-seeded learner. */
async function seedAttempt(
  d1: D1That,
  opts: {
    studentId?: string
    attemptId?: string
    contentGroup?: string
    taskId?: string
    assistance?: 'none' | 'assisted' | 'unknown'
    released?: boolean
    active?: boolean
    issuedAt?: number
    expiresAt?: number
  } = {},
) {
  const studentId = opts.studentId ?? 'S1'
  const attemptId = opts.attemptId ?? 'A1'
  const contentGroup = opts.contentGroup ?? 'CG1'
  const taskId = opts.taskId ?? attemptId
  await phatAnhChup(
    d1.env.DB,
    snapshot({
      studentId,
      attemptId,
      taskId,
      contentGroup,
      issuedAt: opts.issuedAt ?? 1000,
      expiresAt: opts.expiresAt ?? 2000,
    }),
    900,
  )
  await capDieuKhienNopBai(d1.env.DB, {
    studentId,
    attemptId,
    assistance: opts.assistance ?? 'none',
    released: opts.released ?? true,
    active: opts.active ?? true,
  })
}

/** Convenience: seed learner + one attempt. */
async function seed(
  d1: D1That,
  opts: Parameters<typeof seedAttempt>[1] & Parameters<typeof seedLearner>[1] = {},
) {
  seedLearner(d1, opts)
  await seedAttempt(d1, opts)
}

describe('P07 assistance — happy paths', () => {
  it('hint records assisted, bumps control revision, locks exposure, writes receipt', async () => {
    const d1 = taoD1That()
    await seed(d1)
    const r = await ghiTroGiup(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      requestId: 'R1',
      kind: 'hint',
      receivedAt: 1500,
    })
    expect(r.commandType).toBe(LENH_TRO_GIUP)
    expect(r.assistance).toBe('assisted')
    expect(r.contentGroup).toBe('CG1')
    expect(r.kind).toBe('hint')
    expect(r.controlRevision).toBe(1)
    expect(d1.dem('cnh_exp_exposure_lock')).toBe(1)
    expect(d1.dem('cnh_exp_command', `command_type = '${LENH_TRO_GIUP}'`)).toBe(1)
    const ctrl = d1.sql
      .prepare(`SELECT assistance, revision FROM cnh_exp_attempt_control WHERE student_id = 'S1' AND attempt_id = 'A1'`)
      .get() as { assistance: string; revision: number }
    expect(ctrl.assistance).toBe('assisted')
    expect(ctrl.revision).toBe(1)
  })

  it('reveal behaves identically to hint (both lock to assisted)', async () => {
    const d1 = taoD1That()
    await seed(d1)
    const r = await ghiTroGiup(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      requestId: 'R1',
      kind: 'reveal',
      receivedAt: 1500,
    })
    expect(r.kind).toBe('reveal')
    expect(r.assistance).toBe('assisted')
    expect(d1.dem('cnh_exp_exposure_lock')).toBe(1)
  })

  it('does NOT touch wallet/day/EXP', async () => {
    const d1 = taoD1That()
    await seed(d1, { wallet: 7, earned: 7, rawCore: 5, corePaid: 5 })
    await ghiTroGiup(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      requestId: 'R1',
      kind: 'hint',
      receivedAt: 1500,
    })
    const acc = d1.sql.prepare(`SELECT wallet_exp, earned_exp, revision FROM cnh_exp_account WHERE student_id = 'S1'`).get() as { wallet_exp: number; earned_exp: number; revision: number }
    expect(acc.wallet_exp).toBe(7)
    expect(acc.earned_exp).toBe(7)
    expect(acc.revision).toBe(0)
    const day = d1.sql.prepare(`SELECT raw_core, core_paid, revision FROM cnh_exp_day WHERE student_id = 'S1'`).get() as { raw_core: number; core_paid: number; revision: number }
    expect(day.raw_core).toBe(5)
    expect(day.core_paid).toBe(5)
    expect(day.revision).toBe(0)
    expect(d1.dem('cnh_exp_grant_ledger')).toBe(0)
  })
})

describe('P07 assistance — idempotency', () => {
  it('same request key + same payload replays the original receipt', async () => {
    const d1 = taoD1That()
    await seed(d1)
    const first = await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 })
    const replay = await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1900 })
    expect(replay).toEqual(first)
    expect(d1.dem('cnh_exp_exposure_lock')).toBe(1)
    expect(d1.dem('cnh_exp_command', `command_type = '${LENH_TRO_GIUP}'`)).toBe(1)
  })

  it('same request key + different kind ⇒ IDEMPOTENCY_CONFLICT', async () => {
    const d1 = taoD1That()
    await seed(d1)
    await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 })
    await expect(
      ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'reveal', receivedAt: 1500 }),
    ).rejects.toMatchObject({ ma: 'IDEMPOTENCY_CONFLICT' })
  })

  it('same attempt + new request key + same kind replays the original result', async () => {
    const d1 = taoD1That()
    await seed(d1)
    const first = await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 })
    const second = await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R2', kind: 'hint', receivedAt: 1900 })
    expect(second).toEqual(first)
    expect(d1.dem('cnh_exp_exposure_lock')).toBe(1)
  })
})

describe('P07 assistance — fail-closed gates', () => {
  it('missing control ⇒ NOT_FOUND, no lock/receipt', async () => {
    const d1 = taoD1That()
    await seed(d1)
    d1.sql.prepare(`DELETE FROM cnh_exp_attempt_control WHERE student_id = 'S1' AND attempt_id = 'A1'`).run()
    await expect(
      ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 }),
    ).rejects.toMatchObject({ ma: 'NOT_FOUND' })
    expect(d1.dem('cnh_exp_exposure_lock')).toBe(0)
    expect(d1.dem('cnh_exp_command', `command_type = '${LENH_TRO_GIUP}'`)).toBe(0)
  })

  it('released false ⇒ NOT_RELEASED', async () => {
    const d1 = taoD1That()
    await seed(d1, { released: false })
    await expect(
      ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 }),
    ).rejects.toMatchObject({ ma: 'NOT_RELEASED' })
    expect(d1.dem('cnh_exp_exposure_lock')).toBe(0)
  })

  it('active false ⇒ NOT_ACTIVE', async () => {
    const d1 = taoD1That()
    await seed(d1, { active: false })
    await expect(
      ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 }),
    ).rejects.toMatchObject({ ma: 'NOT_ACTIVE' })
  })

  it('foreign student ⇒ NOT_FOUND (no cross-student fallback)', async () => {
    const d1 = taoD1That()
    await seed(d1)
    await expect(
      ghiTroGiup(d1.env, { studentId: 'S2', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 }),
    ).rejects.toMatchObject({ ma: 'NOT_FOUND' })
  })

  it('expired window ⇒ SESSION_EXPIRED', async () => {
    const d1 = taoD1That()
    await seed(d1, { issuedAt: 1000, expiresAt: 2000 })
    await expect(
      ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 2000 }),
    ).rejects.toMatchObject({ ma: 'SESSION_EXPIRED' })
  })

  it('invalid kind ⇒ CORRUPT_STATE', async () => {
    const d1 = taoD1That()
    await seed(d1)
    await expect(
      ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'x' as LoaiTroGiup, receivedAt: 1500 }),
    ).rejects.toMatchObject({ ma: 'CORRUPT_STATE' })
  })
})

describe('P07 assistance — exposure scope (same student+contentGroup)', () => {
  it('a second attempt in the SAME contentGroup inherits assisted at provisioning', async () => {
    const d1 = taoD1That()
    seedLearner(d1)
    await seedAttempt(d1, { attemptId: 'A1', contentGroup: 'CG1' })
    await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 })
    // A FUTURE attempt in the same exposure is provisioned AFTER the lock exists.
    await seedAttempt(d1, { attemptId: 'A2', contentGroup: 'CG1' })
    const ctrl = d1.sql
      .prepare(`SELECT assistance FROM cnh_exp_attempt_control WHERE student_id = 'S1' AND attempt_id = 'A2'`)
      .get() as { assistance: string }
    expect(ctrl.assistance).toBe('assisted')
  })

  it('a DIFFERENT contentGroup is NOT affected', async () => {
    const d1 = taoD1That()
    seedLearner(d1)
    await seedAttempt(d1, { attemptId: 'A1', contentGroup: 'CG1' })
    await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 })
    await seedAttempt(d1, { attemptId: 'A2', contentGroup: 'CG2' })
    const ctrl = d1.sql
      .prepare(`SELECT assistance FROM cnh_exp_attempt_control WHERE student_id = 'S1' AND attempt_id = 'A2'`)
      .get() as { assistance: string }
    expect(ctrl.assistance).toBe('none')
  })

  it('a DIFFERENT student is NOT affected', async () => {
    const d1 = taoD1That()
    seedLearner(d1, { studentId: 'S1' })
    seedLearner(d1, { studentId: 'S2' })
    await seedAttempt(d1, { studentId: 'S1', attemptId: 'A1', contentGroup: 'CG1' })
    await seedAttempt(d1, { studentId: 'S2', attemptId: 'A1', contentGroup: 'CG1' })
    await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 })
    const ctrl = d1.sql
      .prepare(`SELECT assistance FROM cnh_exp_attempt_control WHERE student_id = 'S2' AND attempt_id = 'A1'`)
      .get() as { assistance: string }
    expect(ctrl.assistance).toBe('none')
  })

  it('provisioning cannot downgrade an exposed attempt to independent', async () => {
    const d1 = taoD1That()
    seedLearner(d1)
    await seedAttempt(d1, { attemptId: 'A1', contentGroup: 'CG1' })
    await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 })
    // Re-provision A1 explicitly requesting independence — the lock must override.
    const r = await capDieuKhienNopBai(d1.env.DB, {
      studentId: 'S1',
      attemptId: 'A1',
      assistance: 'none',
      released: true,
      active: true,
    })
    expect(r.assistance).toBe('assisted')
  })
})

describe('P07 assistance — cross-attempt sibling transition (BUG1)', () => {
  it('hint on A1 transitions an ALREADY-PROVISIONED sibling A2 to assisted', async () => {
    const d1 = taoD1That()
    seedLearner(d1)
    await seedAttempt(d1, { attemptId: 'A1', contentGroup: 'CG1' })
    await seedAttempt(d1, { attemptId: 'A2', contentGroup: 'CG1' })
    // Both provisioned independent BEFORE any assistance.
    const truoc = d1.sql
      .prepare(`SELECT attempt_id, assistance, revision FROM cnh_exp_attempt_control WHERE student_id = 'S1' ORDER BY attempt_id`)
      .all() as { attempt_id: string; assistance: string; revision: number }[]
    expect(truoc.map((r) => r.assistance)).toEqual(['none', 'none'])

    await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 })

    const sau = d1.sql
      .prepare(`SELECT attempt_id, assistance, revision FROM cnh_exp_attempt_control WHERE student_id = 'S1' ORDER BY attempt_id`)
      .all() as { attempt_id: string; assistance: string; revision: number }[]
    expect(sau.map((r) => r.assistance)).toEqual(['assisted', 'assisted'])
    // Both siblings bumped exactly once.
    expect(sau.map((r) => r.revision)).toEqual([1, 1])
  })

  it('submitting the sibling A2 after hinting A1 credits raw 2 (assisted), not full reward', async () => {
    const d1 = taoD1That()
    seedLearner(d1)
    await seedAttempt(d1, { attemptId: 'A1', contentGroup: 'CG1' })
    await seedAttempt(d1, { attemptId: 'A2', contentGroup: 'CG1' })
    await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 })

    const r = await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A2',
      rawAnswer: 'C',
      requestId: 'R2',
      receivedAt: 1500,
    })
    expect(r.correct).toBe(true)
    expect(r.raw).toBe(2)
    expect(r.walletAfter).toBe(2)
    const ev = await docSuKienHocTap(d1.env.DB, 'S1', 'A2')
    expect(ev?.assistance).toBe('assisted')
  })

  it('reverse ordering: hint A1 first, then provision A2 ⇒ A2 inherits assisted', async () => {
    const d1 = taoD1That()
    seedLearner(d1)
    await seedAttempt(d1, { attemptId: 'A1', contentGroup: 'CG1' })
    await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 })
    await seedAttempt(d1, { attemptId: 'A2', contentGroup: 'CG1' })
    const ctrl = d1.sql
      .prepare(`SELECT assistance FROM cnh_exp_attempt_control WHERE student_id = 'S1' AND attempt_id = 'A2'`)
      .get() as { assistance: string }
    expect(ctrl.assistance).toBe('assisted')

    const r = await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A2',
      rawAnswer: 'C',
      requestId: 'R2',
      receivedAt: 1500,
    })
    expect(r.raw).toBe(2)
  })

  it('a sibling in a DIFFERENT contentGroup is NOT transitioned', async () => {
    const d1 = taoD1That()
    seedLearner(d1)
    await seedAttempt(d1, { attemptId: 'A1', contentGroup: 'CG1' })
    await seedAttempt(d1, { attemptId: 'A2', contentGroup: 'CG2' })
    await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 })
    const ctrl = d1.sql
      .prepare(`SELECT assistance FROM cnh_exp_attempt_control WHERE student_id = 'S1' AND attempt_id = 'A2'`)
      .get() as { assistance: string }
    expect(ctrl.assistance).toBe('none')
  })

  it('a sibling of a DIFFERENT student is NOT transitioned', async () => {
    const d1 = taoD1That()
    seedLearner(d1, { studentId: 'S1' })
    seedLearner(d1, { studentId: 'S2' })
    await seedAttempt(d1, { studentId: 'S1', attemptId: 'A1', contentGroup: 'CG1' })
    await seedAttempt(d1, { studentId: 'S2', attemptId: 'A1', contentGroup: 'CG1' })
    await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 })
    const ctrl = d1.sql
      .prepare(`SELECT assistance FROM cnh_exp_attempt_control WHERE student_id = 'S2' AND attempt_id = 'A1'`)
      .get() as { assistance: string }
    expect(ctrl.assistance).toBe('none')
  })
})

describe('P07 assistance — lock created before the submission batch (BUG2)', () => {
  it('a lock created between the submission read and its batch loses the CAS ⇒ raw 2, assisted event', async () => {
    const d1 = taoD1That()
    await seed(d1, { assistance: 'none' })

    // Simulate: the submission read the control (assistance=none) and the (absent) lock, but
    // BEFORE its batch commits, an assistance command creates the lock AND transitions the
    // control. The submission's CAS must lose and re-read the effective assisted state.
    const realBatch = d1.env.DB.batch.bind(d1.env.DB)
    let bumped = false
    d1.env.DB.batch = (async (ds: unknown[]) => {
      if (!bumped) {
        bumped = true
        d1.sql
          .prepare(
            `UPDATE cnh_exp_attempt_control SET assistance = 'assisted', revision = revision + 1
              WHERE student_id = 'S1' AND attempt_id = 'A1'`,
          )
          .run()
        d1.sql
          .prepare(
            `INSERT INTO cnh_exp_exposure_lock (student_id, content_group, attempt_id, assistance, execution_id, revision)
             VALUES ('S1', 'CG1', 'A1', 'assisted', 'x', 1)`,
          )
          .run()
      }
      return realBatch(ds as never)
    }) as typeof d1.env.DB.batch

    const r = await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'C',
      requestId: 'R1',
      receivedAt: 1500,
    })
    expect(r.raw).toBe(2)
    expect(d1.dem('cnh_exp_accepted')).toBe(1)
    const ev = await docSuKienHocTap(d1.env.DB, 'S1', 'A1')
    expect(ev?.assistance).toBe('assisted')
  })

  it('a lock created between the submission read and its batch (control NOT bumped) still loses the CAS', async () => {
    const d1 = taoD1That()
    await seed(d1, { assistance: 'none' })

    // Only the LOCK is created (the control row is untouched). The submission's lock-presence CAS
    // must still lose, so the effective assisted state is re-read.
    const realBatch = d1.env.DB.batch.bind(d1.env.DB)
    let bumped = false
    d1.env.DB.batch = (async (ds: unknown[]) => {
      if (!bumped) {
        bumped = true
        d1.sql
          .prepare(
            `INSERT INTO cnh_exp_exposure_lock (student_id, content_group, attempt_id, assistance, execution_id, revision)
             VALUES ('S1', 'CG1', 'A1', 'assisted', 'x', 1)`,
          )
          .run()
      }
      return realBatch(ds as never)
    }) as typeof d1.env.DB.batch

    const r = await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'C',
      requestId: 'R1',
      receivedAt: 1500,
    })
    expect(r.raw).toBe(2)
    const ev = await docSuKienHocTap(d1.env.DB, 'S1', 'A1')
    expect(ev?.assistance).toBe('assisted')
  })
})

describe('P07 assistance — monotonic transition + semantic receipt (idempotency)', () => {
  it('same attempt + same kind + NEW request key replays the ORIGINAL response and does NOT bump revision', async () => {
    const d1 = taoD1That()
    await seed(d1)
    const first = await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 })
    expect(first.controlRevision).toBe(1)
    const second = await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R2', kind: 'hint', receivedAt: 1900 })
    expect(second).toEqual(first)
    const ctrl = d1.sql
      .prepare(`SELECT assistance, revision FROM cnh_exp_attempt_control WHERE student_id = 'S1' AND attempt_id = 'A1'`)
      .get() as { assistance: string; revision: number }
    expect(ctrl.assistance).toBe('assisted')
    expect(ctrl.revision).toBe(1)
    expect(d1.dem('cnh_exp_assistance_receipt')).toBe(1)
    expect(d1.dem('cnh_exp_command', `command_type = '${LENH_TRO_GIUP}'`)).toBe(2)
  })

  it('hint then reveal for the same attempt are DISTINCT semantic actions (each its own receipt)', async () => {
    const d1 = taoD1That()
    await seed(d1)
    const hint = await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 })
    const reveal = await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R2', kind: 'reveal', receivedAt: 1900 })
    expect(hint.kind).toBe('hint')
    expect(reveal.kind).toBe('reveal')
    expect(d1.dem('cnh_exp_assistance_receipt')).toBe(2)
    // The reveal did NOT bump the control revision again (already assisted).
    const ctrl = d1.sql
      .prepare(`SELECT revision FROM cnh_exp_attempt_control WHERE student_id = 'S1' AND attempt_id = 'A1'`)
      .get() as { revision: number }
    expect(ctrl.revision).toBe(1)
  })

  it('a same-action replay under a new key does NOT touch money', async () => {
    const d1 = taoD1That()
    await seed(d1, { wallet: 7, earned: 7, rawCore: 5, corePaid: 5 })
    await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 })
    await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R2', kind: 'hint', receivedAt: 1900 })
    const acc = d1.sql.prepare(`SELECT wallet_exp, earned_exp, revision FROM cnh_exp_account WHERE student_id = 'S1'`).get() as { wallet_exp: number; earned_exp: number; revision: number }
    expect(acc.wallet_exp).toBe(7)
    expect(acc.earned_exp).toBe(7)
    expect(acc.revision).toBe(0)
    expect(d1.dem('cnh_exp_grant_ledger')).toBe(0)
  })
})

describe('P07 assistance — stale independent submission race', () => {
  it('a submission that read independent loses the CAS after assistance locks the exposure', async () => {
    const d1 = taoD1That()
    await seed(d1, { assistance: 'none' })

    // Simulate: the submission read the control (assistance=none) but BEFORE its batch commits,
    // an assistance command bumps the control revision. The submission's CAS must lose.
    const realBatch = d1.env.DB.batch.bind(d1.env.DB)
    let bumped = false
    d1.env.DB.batch = (async (ds: unknown[]) => {
      if (!bumped) {
        bumped = true
        d1.sql
          .prepare(
            `UPDATE cnh_exp_attempt_control SET assistance = 'assisted', revision = revision + 1
              WHERE student_id = 'S1' AND attempt_id = 'A1'`,
          )
          .run()
      }
      return realBatch(ds as never)
    }) as typeof d1.env.DB.batch

    const r = await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'C',
      requestId: 'R1',
      receivedAt: 1500,
    })
    // The CAS lost on the first attempt; the retry re-read the downgraded assistance ⇒ raw 2.
    expect(r.raw).toBe(2)
    expect(d1.dem('cnh_exp_accepted')).toBe(1)
  })
})

describe('P07 assistance — concurrency (serialised by the helper)', () => {
  it('two concurrent hint/reveal commands ⇒ one control bump, one lock, both receipts', async () => {
    const d1 = taoD1That()
    serialiseD1(d1.env)
    await seed(d1)
    const [a, b] = await Promise.all([
      ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 }),
      ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R2', kind: 'reveal', receivedAt: 1500 }),
    ])
    expect(a.assistance).toBe('assisted')
    expect(b.assistance).toBe('assisted')
    expect(d1.dem('cnh_exp_exposure_lock')).toBe(1)
    expect(d1.dem('cnh_exp_command', `command_type = '${LENH_TRO_GIUP}'`)).toBe(2)
    const ctrl = d1.sql
      .prepare(`SELECT assistance, revision FROM cnh_exp_attempt_control WHERE student_id = 'S1' AND attempt_id = 'A1'`)
      .get() as { assistance: string; revision: number }
    expect(ctrl.assistance).toBe('assisted')
    // Exactly one command won the CAS and bumped the revision; the other re-read and replayed.
    expect(ctrl.revision).toBe(1)
  })

  it('two concurrent commands with the SAME request key ⇒ one receipt, identical response', async () => {
    const d1 = taoD1That()
    serialiseD1(d1.env)
    await seed(d1)
    const [a, b] = await Promise.all([
      ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 }),
      ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 }),
    ])
    expect(a).toEqual(b)
    expect(d1.dem('cnh_exp_command', `command_type = '${LENH_TRO_GIUP}'`)).toBe(1)
    expect(d1.dem('cnh_exp_exposure_lock')).toBe(1)
  })
})

describe('P07 assistance — rollback on injected failure', () => {
  it('a failing batch rolls back ALL writes, then a retry succeeds', async () => {
    const d1 = taoD1That()
    await seed(d1)

    const realBatch = d1.env.DB.batch.bind(d1.env.DB)
    let broken = false
    d1.env.DB.batch = (async (ds: unknown[]) => {
      if (!broken) {
        broken = true
        throw new Error('simulated batch failure')
      }
      return realBatch(ds as never)
    }) as typeof d1.env.DB.batch

    await expect(
      ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 }),
    ).rejects.toThrow('simulated batch failure')

    expect(d1.dem('cnh_exp_exposure_lock')).toBe(0)
    expect(d1.dem('cnh_exp_command', `command_type = '${LENH_TRO_GIUP}'`)).toBe(0)
    const ctrl = d1.sql
      .prepare(`SELECT assistance, revision FROM cnh_exp_attempt_control WHERE student_id = 'S1' AND attempt_id = 'A1'`)
      .get() as { assistance: string; revision: number }
    expect(ctrl.assistance).toBe('none')
    expect(ctrl.revision).toBe(0)

    const r = await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 })
    expect(r.assistance).toBe('assisted')
    expect(d1.dem('cnh_exp_exposure_lock')).toBe(1)
  })

  it('a fault-injected control mismatch rolls the whole transaction back', async () => {
    const d1 = taoD1That()
    await seed(d1)

    const truoc = {
      control: d1.chup('cnh_exp_attempt_control'),
      lock: d1.chup('cnh_exp_exposure_lock'),
      command: d1.chup('cnh_exp_command'),
      guard: d1.chup('cnh_exp_assistance_guard'),
    }

    // A REAL SQLite AFTER INSERT trigger on the command table bumps the control revision AFTER
    // the assistance command's own UPDATE, so the guard's control-revision invariant fails and
    // CHECK(ok=1) aborts the whole batch.
    d1.sql.exec(
      `CREATE TRIGGER tamper_control AFTER INSERT ON cnh_exp_command
         WHEN NEW.command_type = '${LENH_TRO_GIUP}'
         BEGIN
           UPDATE cnh_exp_attempt_control SET revision = revision + 5
             WHERE student_id = NEW.student_id AND attempt_id = 'A1';
         END`,
    )

    try {
      await expect(
        ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 }),
      ).rejects.toThrow()

      expect(d1.chup('cnh_exp_attempt_control')).toBe(truoc.control)
      expect(d1.chup('cnh_exp_exposure_lock')).toBe(truoc.lock)
      expect(d1.chup('cnh_exp_command')).toBe(truoc.command)
      expect(d1.chup('cnh_exp_assistance_guard')).toBe(truoc.guard)
    } finally {
      d1.sql.exec('DROP TRIGGER IF EXISTS tamper_control')
    }

    const r = await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 })
    expect(r.assistance).toBe('assisted')
    expect(d1.dem('cnh_exp_exposure_lock')).toBe(1)
  })
})

describe('P07 assistance — canonical request hash', () => {
  it('same attempt + same kind ⇒ same hash; different kind ⇒ different hash', async () => {
    const h1 = await bamYeuCauTroGiup('A1', 'hint')
    const h2 = await bamYeuCauTroGiup('A1', 'hint')
    const h3 = await bamYeuCauTroGiup('A1', 'reveal')
    expect(h1).toBe(h2)
    expect(h1).not.toBe(h3)
  })
})

describe('P07 assistance — receipt excludes key/solution', () => {
  it('the response never contains the answer key or grading material', async () => {
    const d1 = taoD1That()
    await seed(d1)
    const r = await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 })
    const json = JSON.stringify(r)
    expect(json).not.toContain('orderMapping')
    expect(json).not.toContain('gradingPolicy')
    expect(json).not.toContain('"key"')
  })
})

describe('P07 assistance — request-key hash binding across semantic actions', () => {
  it('R1 hint, R2 reveal; reusing R2 for hint ⇒ IDEMPOTENCY_CONFLICT even though hint semantic exists', async () => {
    const d1 = taoD1That()
    await seed(d1)
    const hint = await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 })
    const reveal = await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R2', kind: 'reveal', receivedAt: 1900 })
    expect(hint.kind).toBe('hint')
    expect(reveal.kind).toBe('reveal')
    // R2 was bound to `reveal`; reusing it for `hint` (whose semantic receipt exists) MUST conflict.
    await expect(
      ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R2', kind: 'hint', receivedAt: 1900 }),
    ).rejects.toMatchObject({ ma: 'IDEMPOTENCY_CONFLICT' })
    // No extra command rows were written by the rejected call.
    expect(d1.dem('cnh_exp_command', `command_type = '${LENH_TRO_GIUP}'`)).toBe(2)
  })

  it('new alias R3 hint then reuse R3 for reveal ⇒ IDEMPOTENCY_CONFLICT', async () => {
    const d1 = taoD1That()
    await seed(d1)
    const first = await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 })
    // R3 is a NEW key for the SAME semantic action (hint) ⇒ alias of the original.
    const alias = await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R3', kind: 'hint', receivedAt: 1900 })
    expect(alias).toEqual(first)
    // Reusing R3 for a DIFFERENT kind must conflict.
    await expect(
      ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R3', kind: 'reveal', receivedAt: 1900 }),
    ).rejects.toMatchObject({ ma: 'IDEMPOTENCY_CONFLICT' })
  })

  it('exact same alias replay is stable (same key, same kind, repeated)', async () => {
    const d1 = taoD1That()
    await seed(d1)
    const first = await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 })
    const alias1 = await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R3', kind: 'hint', receivedAt: 1900 })
    const alias2 = await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R3', kind: 'hint', receivedAt: 2500 })
    expect(alias1).toEqual(first)
    expect(alias2).toEqual(first)
    // Exactly one semantic receipt; the alias key is durable and stable.
    expect(d1.dem('cnh_exp_assistance_receipt')).toBe(1)
    expect(d1.dem('cnh_exp_command', `request_id = 'R3'`)).toBe(1)
    const ctrl = d1.sql
      .prepare(`SELECT revision FROM cnh_exp_attempt_control WHERE student_id = 'S1' AND attempt_id = 'A1'`)
      .get() as { revision: number }
    expect(ctrl.revision).toBe(1)
  })

  it('a semantic replay binds the alias with the ORIGINAL committed revision', async () => {
    const d1 = taoD1That()
    await seed(d1)
    const first = await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 })
    expect(first.controlRevision).toBe(1)
    const alias = await ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R3', kind: 'hint', receivedAt: 1900 })
    expect(alias.controlRevision).toBe(1)
    const row = d1.sql
      .prepare(`SELECT committed_revision FROM cnh_exp_command WHERE request_id = 'R3'`)
      .get() as { committed_revision: number }
    expect(row.committed_revision).toBe(1)
  })

  it('concurrent same-action/different-keys ⇒ one semantic transition, all keys durable', async () => {
    const d1 = taoD1That()
    serialiseD1(d1.env)
    await seed(d1)
    const [a, b, c] = await Promise.all([
      ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R1', kind: 'hint', receivedAt: 1500 }),
      ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R2', kind: 'hint', receivedAt: 1500 }),
      ghiTroGiup(d1.env, { studentId: 'S1', attemptId: 'A1', requestId: 'R3', kind: 'hint', receivedAt: 1500 }),
    ])
    expect(a).toEqual(b)
    expect(b).toEqual(c)
    expect(d1.dem('cnh_exp_assistance_receipt')).toBe(1)
    expect(d1.dem('cnh_exp_command', `command_type = '${LENH_TRO_GIUP}'`)).toBe(3)
    const ctrl = d1.sql
      .prepare(`SELECT assistance, revision FROM cnh_exp_attempt_control WHERE student_id = 'S1' AND attempt_id = 'A1'`)
      .get() as { assistance: string; revision: number }
    expect(ctrl.assistance).toBe('assisted')
    expect(ctrl.revision).toBe(1)
  })
})
