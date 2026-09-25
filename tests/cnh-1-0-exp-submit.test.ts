// @vitest-environment node
// CNH-1.0 P07 — ATOMIC RELEASED-CORE SUBMISSION VERTICAL.
//
// ⚠️ RUNTIME: these tests run the server SQL against the REAL schema + migrations on Node's
// in-memory SQLite (`tests/_d1-that.ts`), NOT on Cloudflare D1/workerd. They prove schema shape
// and SQL semantics (CAS, ON CONFLICT, CHECK guard, batch rollback) — NOT D1 runtime concurrency,
// load limits, or dialect differences. Concurrency assertions here are serialised by the helper;
// a later job MUST re-run them on workerd/wrangler.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { taoD1That, serialiseD1, type D1That } from './_d1-that'
import { phatAnhChup, type AnhChupNhiemVu } from '../server/src/cnh-exp-task'
import {
  nopBaiCore,
  capDieuKhienNopBai,
  ngayHocVN,
  bamYeuCauNopBai,
  docSuKienHocTap,
  LENH_NOP_BAI_CORE,
} from '../server/src/cnh-exp-submit'

const PHIEN_BAN = 'CNH-1.0'

/** Build a valid snapshot for a given part + grading material. */
function snapshot(
  part: 'I' | 'II' | 'III',
  material: { key: unknown; orderMapping: unknown; gradingPolicy: unknown },
  difficulty: 0 | 1 | 2 = 1,
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
    ...overrides,
  }
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

/**
 * Seed the LEARNER (account + day) ONCE per student. Never reset wallet/day between attempts —
 * a second attempt for the same student must reuse the SAME account/day rows.
 */
function seedLearner(
  d1: D1That,
  opts: {
    studentId?: string
    wallet?: number
    earned?: number
    rawCore?: number
    achieved?: 0 | 1
    corePaid?: number
    compensationPaid?: number
  } = {},
) {
  const studentId = opts.studentId ?? 'S1'
  d1.sql
    .prepare(
      `INSERT INTO cnh_exp_account (student_id, wallet_exp, earned_exp, revision) VALUES (?, ?, ?, 0)`,
    )
    .run(studentId, opts.wallet ?? 0, opts.earned ?? 0)

  d1.sql
    .prepare(
      `INSERT INTO cnh_exp_day (student_id, learning_day, policy_version, raw_core, achieved, core_paid, compensation_paid, revision)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    )
    .run(
      studentId,
      ngayHocVN(1500),
      PHIEN_BAN,
      opts.rawCore ?? 0,
      opts.achieved ?? 0,
      opts.corePaid ?? 0,
      opts.compensationPaid ?? 0,
    )
}

/** Seed ONE attempt (control + snapshot) for an already-seeded learner. */
async function seedAttempt(
  d1: D1That,
  opts: {
    studentId?: string
    attemptId?: string
    contentGroup?: string
    taskId?: string
    part?: 'I' | 'II' | 'III'
    difficulty?: 0 | 1 | 2
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
  const part = opts.part ?? 'I'
  const difficulty = opts.difficulty ?? 1
  const material = part === 'II' ? PHAN_II : PHAN_I
  // task_id is UNIQUE per student: each attempt MUST carry its own stable taskId, otherwise a
  // second attempt for the same student collides on idx_cnh_exp_task_student_task. Default it to
  // the attemptId so distinct attempts never share a taskId (contentGroup is left untouched).
  const taskId = opts.taskId ?? attemptId

  await phatAnhChup(
    d1.env.DB,
    snapshot(part, material, difficulty, {
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

/** Convenience: seed learner + one attempt (the common single-attempt case). */
async function seed(
  d1: D1That,
  opts: Parameters<typeof seedAttempt>[1] & Parameters<typeof seedLearner>[1] = {},
) {
  seedLearner(d1, opts)
  await seedAttempt(d1, opts)
}

describe('P07 submit — happy paths', () => {
  it('Part I correct ⇒ raw 3, wallet 3', async () => {
    const d1 = taoD1That()
    await seed(d1, { part: 'I', difficulty: 1 })
    const r = await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'C',
      requestId: 'R1',
      receivedAt: 1500,
    })
    expect(r.commandType).toBe(LENH_NOP_BAI_CORE)
    expect(r.correct).toBe(true)
    expect(r.raw).toBe(3)
    expect(r.walletAfter).toBe(3)
    expect(r.earnedAfter).toBe(3)
    expect(r.corePaidAfter).toBe(3)
    expect(d1.dem('cnh_exp_accepted')).toBe(1)
    expect(d1.dem('cnh_exp_academic_lock')).toBe(1)
    expect(d1.dem('cnh_exp_grant_ledger')).toBe(1)
  })

  it('Part II 3/4 correct ⇒ raw 4', async () => {
    const d1 = taoD1That()
    await seed(d1, { part: 'II', difficulty: 1 })
    const r = await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: { '1': true, '2': false, '3': true, '4': true },
      requestId: 'R1',
      receivedAt: 1500,
    })
    expect(r.correct).toBe(false)
    expect(r.raw).toBe(4)
    expect(r.walletAfter).toBe(4)
  })

  it('wrong answer ⇒ raw 2 (base valid attempt)', async () => {
    const d1 = taoD1That()
    await seed(d1, { part: 'I', difficulty: 1 })
    const r = await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'A',
      requestId: 'R1',
      receivedAt: 1500,
    })
    expect(r.correct).toBe(false)
    expect(r.raw).toBe(2)
    expect(r.walletAfter).toBe(2)
  })

  it('assisted correct ⇒ raw 2 (no independent premium)', async () => {
    const d1 = taoD1That()
    await seed(d1, { part: 'I', difficulty: 1, assistance: 'assisted' })
    const r = await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'C',
      requestId: 'R1',
      receivedAt: 1500,
    })
    expect(r.correct).toBe(true)
    expect(r.raw).toBe(2)
  })
})

describe('P07 submit — idempotency and attempt conflict', () => {
  it('same request key + same payload replays the original receipt (later clock)', async () => {
    const d1 = taoD1That()
    await seed(d1, { part: 'I', difficulty: 1 })
    const first = await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'C',
      requestId: 'R1',
      receivedAt: 1500,
    })
    const replay = await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'C',
      requestId: 'R1',
      receivedAt: 1900,
    })
    expect(replay).toEqual(first)
    expect(d1.dem('cnh_exp_accepted')).toBe(1)
    expect(d1.dem('cnh_exp_grant_ledger')).toBe(1)
  })

  it('same request key + different payload ⇒ IDEMPOTENCY_CONFLICT', async () => {
    const d1 = taoD1That()
    await seed(d1, { part: 'I', difficulty: 1 })
    await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'C',
      requestId: 'R1',
      receivedAt: 1500,
    })
    await expect(
      nopBaiCore(d1.env, {
        studentId: 'S1',
        attemptId: 'A1',
        rawAnswer: 'A',
        requestId: 'R1',
        receivedAt: 1500,
      }),
    ).rejects.toMatchObject({ ma: 'IDEMPOTENCY_CONFLICT' })
  })

  it('same attempt + new request + same answer replays the original result', async () => {
    const d1 = taoD1That()
    await seed(d1, { part: 'I', difficulty: 1 })
    const first = await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'C',
      requestId: 'R1',
      receivedAt: 1500,
    })
    const second = await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'C',
      requestId: 'R2',
      receivedAt: 1900,
    })
    expect(second.raw).toBe(first.raw)
    expect(second.correct).toBe(first.correct)
    expect(d1.dem('cnh_exp_accepted')).toBe(1)
    expect(d1.dem('cnh_exp_grant_ledger')).toBe(1)
  })

  it('same attempt + new request + different answer ⇒ ATTEMPT_ALREADY_SUBMITTED', async () => {
    const d1 = taoD1That()
    await seed(d1, { part: 'I', difficulty: 1 })
    await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'C',
      requestId: 'R1',
      receivedAt: 1500,
    })
    await expect(
      nopBaiCore(d1.env, {
        studentId: 'S1',
        attemptId: 'A1',
        rawAnswer: 'A',
        requestId: 'R2',
        receivedAt: 1500,
      }),
    ).rejects.toMatchObject({ ma: 'ATTEMPT_ALREADY_SUBMITTED' })
  })
})

describe('P07 submit — academic lock (same content_group, different attempts)', () => {
  it('one raw credited, the other accepted with raw 0', async () => {
    const d1 = taoD1That()
    seedLearner(d1)
    await seedAttempt(d1, { part: 'I', difficulty: 1, attemptId: 'A1', contentGroup: 'CG1' })
    await seedAttempt(d1, { part: 'I', difficulty: 1, attemptId: 'A2', contentGroup: 'CG1' })

    const r1 = await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'C',
      requestId: 'R1',
      receivedAt: 1500,
    })
    const r2 = await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A2',
      rawAnswer: 'C',
      requestId: 'R2',
      receivedAt: 1500,
    })
    expect(r1.raw).toBe(3)
    expect(r2.raw).toBe(0)
    expect(d1.dem('cnh_exp_academic_lock')).toBe(1)
    expect(d1.dem('cnh_exp_accepted')).toBe(2)
    expect(d1.dem('cnh_exp_grant_ledger')).toBe(2)
  })
})

describe('P07 submit — fail-closed gates', () => {
  it('missing control ⇒ NOT_FOUND, no event/money', async () => {
    const d1 = taoD1That()
    await seed(d1, { part: 'I', difficulty: 1 })
    d1.sql.prepare(`DELETE FROM cnh_exp_attempt_control WHERE student_id = 'S1' AND attempt_id = 'A1'`).run()
    await expect(
      nopBaiCore(d1.env, {
        studentId: 'S1',
        attemptId: 'A1',
        rawAnswer: 'C',
        requestId: 'R1',
        receivedAt: 1500,
      }),
    ).rejects.toMatchObject({ ma: 'NOT_FOUND' })
    expect(d1.dem('cnh_exp_accepted')).toBe(0)
    expect(d1.dem('cnh_exp_grant_ledger')).toBe(0)
  })

  it('released false ⇒ NOT_RELEASED, no event/money', async () => {
    const d1 = taoD1That()
    await seed(d1, { part: 'I', difficulty: 1, released: false })
    await expect(
      nopBaiCore(d1.env, {
        studentId: 'S1',
        attemptId: 'A1',
        rawAnswer: 'C',
        requestId: 'R1',
        receivedAt: 1500,
      }),
    ).rejects.toMatchObject({ ma: 'NOT_RELEASED' })
    expect(d1.dem('cnh_exp_accepted')).toBe(0)
    expect(d1.dem('cnh_exp_grant_ledger')).toBe(0)
  })

  it('active false ⇒ NOT_ACTIVE, no event/money', async () => {
    const d1 = taoD1That()
    await seed(d1, { part: 'I', difficulty: 1, active: false })
    await expect(
      nopBaiCore(d1.env, {
        studentId: 'S1',
        attemptId: 'A1',
        rawAnswer: 'C',
        requestId: 'R1',
        receivedAt: 1500,
      }),
    ).rejects.toMatchObject({ ma: 'NOT_ACTIVE' })
    expect(d1.dem('cnh_exp_accepted')).toBe(0)
  })

  it('foreign student ⇒ NOT_FOUND (no cross-student fallback)', async () => {
    const d1 = taoD1That()
    await seed(d1, { part: 'I', difficulty: 1 })
    await expect(
      nopBaiCore(d1.env, {
        studentId: 'S2',
        attemptId: 'A1',
        rawAnswer: 'C',
        requestId: 'R1',
        receivedAt: 1500,
      }),
    ).rejects.toMatchObject({ ma: 'NOT_FOUND' })
  })

  it('expired window ⇒ SESSION_EXPIRED, no event/money', async () => {
    const d1 = taoD1That()
    await seed(d1, { part: 'I', difficulty: 1, issuedAt: 1000, expiresAt: 2000 })
    await expect(
      nopBaiCore(d1.env, {
        studentId: 'S1',
        attemptId: 'A1',
        rawAnswer: 'C',
        requestId: 'R1',
        receivedAt: 2000,
      }),
    ).rejects.toMatchObject({ ma: 'SESSION_EXPIRED' })
    expect(d1.dem('cnh_exp_accepted')).toBe(0)
  })

  it('malformed answer ⇒ GRADING_FAILED, no event/money', async () => {
    const d1 = taoD1That()
    await seed(d1, { part: 'I', difficulty: 1 })
    await expect(
      nopBaiCore(d1.env, {
        studentId: 'S1',
        attemptId: 'A1',
        rawAnswer: 'Z',
        requestId: 'R1',
        receivedAt: 1500,
      }),
    ).rejects.toMatchObject({ ma: 'GRADING_FAILED' })
    expect(d1.dem('cnh_exp_accepted')).toBe(0)
  })
})

describe('P07 submit — VN day boundary', () => {
  it('23:59:59 VN vs 00:00 VN land on different days', () => {
    const before = Date.UTC(2026, 8, 24, 16, 59, 59)
    const after = Date.UTC(2026, 8, 24, 17, 0, 0)
    expect(ngayHocVN(before)).toBe('2026-09-24')
    expect(ngayHocVN(after)).toBe('2026-09-25')
  })

  it('retry with a later clock still uses the ORIGINAL day', async () => {
    const d1 = taoD1That()
    await seed(d1, { part: 'I', difficulty: 1, issuedAt: 1000, expiresAt: 10_000_000_000 })
    const first = await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'C',
      requestId: 'R1',
      receivedAt: 1500,
    })
    const replay = await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'C',
      requestId: 'R1',
      receivedAt: 10_000_000,
    })
    expect(replay.learningDay).toBe(first.learningDay)
  })

  it('00:00:01 VN đã sang NGÀY MỚI; nửa đêm UTC (07:00 VN) KHÔNG đổi ngày', () => {
    // VN = UTC+7: 00:00:01 ngày 25/09 VN = 17:00:01Z ngày 24/09.
    expect(ngayHocVN(Date.UTC(2026, 8, 24, 17, 0, 0))).toBe('2026-09-25')
    expect(ngayHocVN(Date.UTC(2026, 8, 24, 17, 0, 1))).toBe('2026-09-25')
    // 07:00 VN cùng ngày = 00:00Z ⇒ vẫn NGÀY CŨ (mốc cắt là 17:00Z, không phải 00:00Z).
    expect(ngayHocVN(Date.UTC(2026, 8, 24, 0, 0, 0))).toBe('2026-09-24')
    expect(ngayHocVN(Date.UTC(2026, 8, 24, 16, 59, 59, 999))).toBe('2026-09-24')
  })

  it('cắt ngày đúng ở cuối THÁNG, cuối NĂM và ngày NHUẬN', () => {
    expect(ngayHocVN(Date.UTC(2026, 8, 30, 16, 59, 59))).toBe('2026-09-30')
    expect(ngayHocVN(Date.UTC(2026, 8, 30, 17, 0, 1))).toBe('2026-10-01')
    expect(ngayHocVN(Date.UTC(2026, 11, 31, 16, 59, 59))).toBe('2026-12-31')
    expect(ngayHocVN(Date.UTC(2026, 11, 31, 17, 0, 1))).toBe('2027-01-01')
    expect(ngayHocVN(Date.UTC(2028, 1, 29, 16, 59, 59))).toBe('2028-02-29')
    expect(ngayHocVN(Date.UTC(2028, 1, 29, 17, 0, 1))).toBe('2028-03-01')
  })

  it('TẤT ĐỊNH: cùng mốc ⇒ cùng chuỗi, KHÔNG phụ thuộc múi giờ máy chạy', () => {
    const moc = [0, 1500, Date.UTC(2026, 8, 24, 17, 0, 0), Date.UTC(2030, 0, 1, 3, 4, 5)]
    for (const m of moc) {
      const lan1 = ngayHocVN(m)
      expect(ngayHocVN(m)).toBe(lan1)
      expect(ngayHocVN(m)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
    // Đổi sang múi giờ địa phương (getFullYear/getDate) ⇒ 2 dòng dưới ĐỎ.
    expect(ngayHocVN(Date.UTC(2026, 8, 24, 17, 0, 0))).toBe('2026-09-25')
    expect(ngayHocVN(Date.UTC(2026, 8, 24, 16, 59, 59))).toBe('2026-09-24')
  })

  it('đầu vào KHÔNG hợp lệ ⇒ ném CORRUPT_STATE (không im lặng trả ngày sai)', () => {
    for (const x of [Number.NaN, 1.5, -1, Number.POSITIVE_INFINITY, '1500', null, undefined]) {
      let ma = 'KHONG_NEM'
      try {
        ngayHocVN(x as number)
      } catch (e) {
        ma = (e as { ma?: string }).ma ?? ''
      }
      expect(ma, `đầu vào: ${String(x)}`).toBe('CORRUPT_STATE')
    }
  })
})

describe('P07 submit — VECTOR CHUẨN `MAU-KET-QUA.json` kind="day" (`03` §5, T27)', () => {
  interface VectorDay { id: string; kind: string; input: { acceptedAt: string }; expected: { learningDay: string } }
  const vectors = (JSON.parse(readFileSync('docs/cline-ca-nhan-hoa-2309/MAU-KET-QUA.json', 'utf8')) as { vectors: VectorDay[] }).vectors.filter((v) => v.kind === 'day')

  it('có ĐÚNG 2 vector `day` (V29/V30) — trước đây tôi mới test gián tiếp bằng Date.UTC', () => {
    expect(vectors.map((v) => v.id)).toEqual(['V29', 'V30'])
  })

  for (const v of vectors) {
    it(`${v.id}: ${v.input.acceptedAt} ⇒ ${v.expected.learningDay}`, () => {
      // ADAPTER MỎNG: vector cho mốc ISO; `ngayHocVN` nhận epoch-ms ⇒ CHỈ đổi kiểu, KHÔNG tính lại ngày.
      expect(ngayHocVN(Date.parse(v.input.acceptedAt))).toBe(v.expected.learningDay)
    })
  }
})

describe('P07 submit — concurrency (serialised by the helper)', () => {
  it('same attempt, different request keys ⇒ one accepted, one replay', async () => {
    const d1 = taoD1That()
    serialiseD1(d1.env)
    await seed(d1, { part: 'I', difficulty: 1 })
    const [a, b] = await Promise.all([
      nopBaiCore(d1.env, {
        studentId: 'S1',
        attemptId: 'A1',
        rawAnswer: 'C',
        requestId: 'R1',
        receivedAt: 1500,
      }),
      nopBaiCore(d1.env, {
        studentId: 'S1',
        attemptId: 'A1',
        rawAnswer: 'C',
        requestId: 'R2',
        receivedAt: 1500,
      }),
    ])
    expect(a.raw).toBe(3)
    expect(b.raw).toBe(3)
    expect(d1.dem('cnh_exp_accepted')).toBe(1)
    expect(d1.dem('cnh_exp_grant_ledger')).toBe(1)
  })

  it('same content_group, different attempts ⇒ one raw credited', async () => {
    const d1 = taoD1That()
    serialiseD1(d1.env)
    seedLearner(d1)
    await seedAttempt(d1, { part: 'I', difficulty: 1, attemptId: 'A1', contentGroup: 'CG1' })
    await seedAttempt(d1, { part: 'I', difficulty: 1, attemptId: 'A2', contentGroup: 'CG1' })
    const [a, b] = await Promise.all([
      nopBaiCore(d1.env, {
        studentId: 'S1',
        attemptId: 'A1',
        rawAnswer: 'C',
        requestId: 'R1',
        receivedAt: 1500,
      }),
      nopBaiCore(d1.env, {
        studentId: 'S1',
        attemptId: 'A2',
        rawAnswer: 'C',
        requestId: 'R2',
        receivedAt: 1500,
      }),
    ])
    const raws = [a.raw, b.raw].sort((x, y) => x - y)
    expect(raws).toEqual([0, 3])
    expect(d1.dem('cnh_exp_academic_lock')).toBe(1)
  })
})

describe('P07 submit — CAS assistance race', () => {
  it('a control revision bump between read and write loses the CAS and re-reads', async () => {
    const d1 = taoD1That()
    await seed(d1, { part: 'I', difficulty: 1, assistance: 'none' })

    // Simulate a concurrent control change (assistance downgrade) that bumps the revision
    // AFTER the submission read the control but BEFORE its batch commits.
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
    expect(d1.dem('cnh_exp_grant_ledger')).toBe(1)
  })
})

describe('P07 submit — rollback on failure', () => {
  it('a failing batch rolls back ALL writes, then a retry succeeds', async () => {
    const d1 = taoD1That()
    await seed(d1, { part: 'I', difficulty: 1 })

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
      nopBaiCore(d1.env, {
        studentId: 'S1',
        attemptId: 'A1',
        rawAnswer: 'C',
        requestId: 'R1',
        receivedAt: 1500,
      }),
    ).rejects.toThrow('simulated batch failure')

    // Nothing committed.
    expect(d1.dem('cnh_exp_accepted')).toBe(0)
    expect(d1.dem('cnh_exp_grant_ledger')).toBe(0)
    expect(d1.dem('cnh_exp_academic_lock')).toBe(0)

    // Retry works.
    const r = await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'C',
      requestId: 'R1',
      receivedAt: 1500,
    })
    expect(r.raw).toBe(3)
    expect(d1.dem('cnh_exp_accepted')).toBe(1)
  })
})

describe('P07 submit — receipt excludes key/solution', () => {
  it('the response never contains the answer key or grading material', async () => {
    const d1 = taoD1That()
    await seed(d1, { part: 'I', difficulty: 1 })
    const r = await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'C',
      requestId: 'R1',
      receivedAt: 1500,
    })
    const json = JSON.stringify(r)
    expect(json).not.toContain('orderMapping')
    expect(json).not.toContain('gradingPolicy')
    expect(json).not.toContain('"key"')
  })
})

describe('P07 submit — canonical request hash', () => {
  it('same attempt + same answer ⇒ same hash; different answer ⇒ different hash', async () => {
    const h1 = await bamYeuCauNopBai('A1', 'C')
    const h2 = await bamYeuCauNopBai('A1', 'C')
    const h3 = await bamYeuCauNopBai('A1', 'A')
    expect(h1).toBe(h2)
    expect(h1).not.toBe(h3)
  })
})

describe('P07 submit — replay returns the ORIGINAL result (no recompute)', () => {
  it('a later achieved/wallet change does NOT alter the replayed original result', async () => {
    const d1 = taoD1That()
    await seed(d1, { part: 'I', difficulty: 1 })
    const first = await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'C',
      requestId: 'R1',
      receivedAt: 1500,
    })
    expect(first.raw).toBe(3)
    expect(first.grant).toBe(3)
    expect(first.walletAfter).toBe(3)
    expect(first.committedRevision).toBe(1)

    // Mutate the persisted day/account OUT OF BAND (no settle): flip achieved and bump wallet.
    d1.sql
      .prepare(
        `UPDATE cnh_exp_day SET achieved = 1, revision = revision + 1
          WHERE student_id = 'S1' AND learning_day = ? AND policy_version = ?`,
      )
      .run(ngayHocVN(1500), PHIEN_BAN)
    d1.sql
      .prepare(
        `UPDATE cnh_exp_account SET wallet_exp = 220, earned_exp = 220, revision = revision + 1
          WHERE student_id = 'S1'`,
      )
      .run()

    // Same attempt + NEW request + same answer ⇒ EXACT original result, no wallet mutation.
    const replay = await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'C',
      requestId: 'R2',
      receivedAt: 1900,
    })
    expect(replay).toEqual(first)
    expect(replay.grant).toBe(3)
    expect(replay.walletAfter).toBe(3)
    expect(replay.committedRevision).toBe(1)
    // No new money was written by the replay.
    expect(d1.dem('cnh_exp_grant_ledger')).toBe(1)
    expect(d1.dem('cnh_exp_accepted')).toBe(1)
  })

  it('replay on a later VN day still reports the ORIGINAL learning day', async () => {
    const d1 = taoD1That()
    await seed(d1, { part: 'I', difficulty: 1, issuedAt: 1000, expiresAt: 10_000_000_000 })
    const first = await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'C',
      requestId: 'R1',
      receivedAt: 1500,
    })
    const replay = await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'C',
      requestId: 'R2',
      receivedAt: 10_000_000,
    })
    expect(replay.learningDay).toBe(first.learningDay)
    expect(replay).toEqual(first)
  })

  it('a corrupt/missing original receipt fails closed with CORRUPT_STATE', async () => {
    const d1 = taoD1That()
    await seed(d1, { part: 'I', difficulty: 1 })
    await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'C',
      requestId: 'R1',
      receivedAt: 1500,
    })
    // Delete the ORIGINAL command receipt, leaving the accepted row dangling.
    d1.sql.prepare(`DELETE FROM cnh_exp_command WHERE request_id = 'R1'`).run()
    await expect(
      nopBaiCore(d1.env, {
        studentId: 'S1',
        attemptId: 'A1',
        rawAnswer: 'C',
        requestId: 'R2',
        receivedAt: 1900,
      }),
    ).rejects.toMatchObject({ ma: 'CORRUPT_STATE' })
  })
})

describe('P07 submit — receipt alias binding', () => {
  it('a new request key for the same attempt/answer binds an alias with the original response', async () => {
    const d1 = taoD1That()
    await seed(d1, { part: 'I', difficulty: 1 })
    const first = await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'C',
      requestId: 'R1',
      receivedAt: 1500,
    })
    const alias = await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'C',
      requestId: 'R2',
      receivedAt: 1900,
    })
    expect(alias).toEqual(first)
    // The alias is durably stored as its own receipt row. No extra money.
    expect(d1.dem('cnh_exp_command', `request_id = 'R2'`)).toBe(1)
    expect(d1.dem('cnh_exp_grant_ledger')).toBe(1)
    expect(d1.dem('cnh_exp_accepted')).toBe(1)
  })

  it('reusing an alias key for a different answer ⇒ IDEMPOTENCY_CONFLICT', async () => {
    const d1 = taoD1That()
    await seed(d1, { part: 'I', difficulty: 1 })
    await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'C',
      requestId: 'R1',
      receivedAt: 1500,
    })
    await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'C',
      requestId: 'R2',
      receivedAt: 1900,
    })
    await expect(
      nopBaiCore(d1.env, {
        studentId: 'S1',
        attemptId: 'A1',
        rawAnswer: 'A',
        requestId: 'R2',
        receivedAt: 1900,
      }),
    ).rejects.toMatchObject({ ma: 'IDEMPOTENCY_CONFLICT' })
  })

  it('concurrent new requests for the same attempt/answer return the identical original receipt', async () => {
    const d1 = taoD1That()
    serialiseD1(d1.env)
    await seed(d1, { part: 'I', difficulty: 1 })
    const [a, b] = await Promise.all([
      nopBaiCore(d1.env, {
        studentId: 'S1',
        attemptId: 'A1',
        rawAnswer: 'C',
        requestId: 'R1',
        receivedAt: 1500,
      }),
      nopBaiCore(d1.env, {
        studentId: 'S1',
        attemptId: 'A1',
        rawAnswer: 'C',
        requestId: 'R2',
        receivedAt: 1500,
      }),
    ])
    expect(a).toEqual(b)
    expect(a.raw).toBe(3)
    expect(d1.dem('cnh_exp_accepted')).toBe(1)
    expect(d1.dem('cnh_exp_grant_ledger')).toBe(1)
  })
})

describe('P07 submit — immutable LearningEvent evidence', () => {
  it('Part I: stores the canonical answer, empty subitems, assistance and released visibility', async () => {
    const d1 = taoD1That()
    await seed(d1, { part: 'I', difficulty: 1, assistance: 'assisted' })
    await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'C',
      requestId: 'R1',
      receivedAt: 1500,
    })
    const ev = await docSuKienHocTap(d1.env.DB, 'S1', 'A1')
    expect(ev).not.toBeNull()
    expect(ev?.eventId).toBe('A1')
    expect(ev?.attemptId).toBe('A1')
    expect(ev?.studentId).toBe('S1')
    expect(ev?.learningDay).toBe(ngayHocVN(1500))
    expect(ev?.source).toBe('submit_core')
    expect(ev?.answerPayload).toBe('C')
    expect(ev?.subitemResults).toEqual([])
    expect(ev?.correct).toBe(true)
    expect(ev?.assistance).toBe('assisted')
    expect(ev?.activeSeconds).toBeNull()
    expect(ev?.visibility).toBe('released')
    expect(ev?.correctionOf).toBeNull()
    expect(ev?.policyVersion).toBe(PHIEN_BAN)
    expect(typeof ev?.snapshotId).toBe('string')
    expect(ev?.snapshotId.length).toBeGreaterThan(0)
  })

  it('Part II: stores exact per-subitem skills/correctness from the snapshot', async () => {
    const d1 = taoD1That()
    await seed(d1, { part: 'II', difficulty: 1 })
    await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: { '1': true, '2': false, '3': true, '4': true },
      requestId: 'R1',
      receivedAt: 1500,
    })
    const ev = await docSuKienHocTap(d1.env.DB, 'S1', 'A1')
    expect(ev?.subitemResults).toEqual([
      { id: 'a', correct: true, skillIds: ['SK1'] },
      { id: 'b', correct: true, skillIds: ['SK1'] },
      { id: 'c', correct: true, skillIds: ['SK2'] },
      { id: 'd', correct: false, skillIds: ['SK2'] },
    ])
    expect(ev?.answerPayload).toEqual({ '1': true, '2': false, '3': true, '4': true })
    expect(ev?.correct).toBe(false)
  })

  it('mutating the input during the async hash cannot create a divergent stored/graded payload', async () => {
    const d1 = taoD1That()
    await seed(d1, { part: 'II', difficulty: 1 })
    const answer: Record<string, boolean> = { '1': true, '2': false, '3': true, '4': false }
    // Mutate the SAME object after the call starts but before it resolves. The canonical capture
    // happens synchronously before any await, so the stored/graded payload must be the ORIGINAL.
    const p = nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: answer,
      requestId: 'R1',
      receivedAt: 1500,
    })
    answer['1'] = false
    answer['4'] = true
    const r = await p
    // The ORIGINAL answer {1:true,2:false,3:true,4:false} is ALL correct against the pinned key
    // ([true,false,true,false]), so the grade is correct and every subitem is correct.
    expect(r.correct).toBe(true)
    // Part II, difficulty 1, all-correct ⇒ full table price 5 (frozen policy).
    expect(r.raw).toBe(5)
    const ev = await docSuKienHocTap(d1.env.DB, 'S1', 'A1')
    expect(ev?.answerPayload).toEqual({ '1': true, '2': false, '3': true, '4': false })
    expect(ev?.subitemResults).toEqual([
      { id: 'a', correct: true, skillIds: ['SK1'] },
      { id: 'b', correct: true, skillIds: ['SK1'] },
      { id: 'c', correct: true, skillIds: ['SK2'] },
      { id: 'd', correct: true, skillIds: ['SK2'] },
    ])
  })

  it('replay returns the original receipt and does NOT rewrite the stored evidence', async () => {
    const d1 = taoD1That()
    await seed(d1, { part: 'I', difficulty: 1 })
    const first = await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'C',
      requestId: 'R1',
      receivedAt: 1500,
    })
    const before = await docSuKienHocTap(d1.env.DB, 'S1', 'A1')
    const replay = await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'C',
      requestId: 'R2',
      receivedAt: 1900,
    })
    expect(replay).toEqual(first)
    const after = await docSuKienHocTap(d1.env.DB, 'S1', 'A1')
    expect(after).toEqual(before)
    expect(d1.dem('cnh_exp_accepted')).toBe(1)
  })

  it('a fault-injected evidence mismatch rolls the whole transaction back', async () => {
    const d1 = taoD1That()
    await seed(d1, { part: 'I', difficulty: 1 })

    // Snapshot EVERY table the batch touches, so we can prove the rollback is total.
    const truoc = {
      account: d1.chup('cnh_exp_account'),
      day: d1.chup('cnh_exp_day'),
      command: d1.chup('cnh_exp_command'),
      accepted: d1.chup('cnh_exp_accepted'),
      ledger: d1.chup('cnh_exp_grant_ledger'),
      lock: d1.chup('cnh_exp_academic_lock'),
      guard: d1.chup('cnh_exp_submit_guard'),
    }

    // A REAL SQLite AFTER INSERT trigger on the accepted row, scoped to S1/A1, rewrites the
    // stored evidence to a VALID JSON payload that differs from what was graded. The guard's
    // evidence invariant (answer_json = ?) then fails and CHECK(ok=1) aborts the whole batch.
    // This fires INSIDE the batch, after the accepted insert — unlike a pre-insert UPDATE.
    d1.sql.exec(
      `CREATE TRIGGER tamper_evidence AFTER INSERT ON cnh_exp_accepted
         WHEN NEW.student_id = 'S1' AND NEW.attempt_id = 'A1'
         BEGIN
           UPDATE cnh_exp_accepted SET answer_json = '"TAMPERED"' WHERE rowid = NEW.rowid;
         END`,
    )

    try {
      await expect(
        nopBaiCore(d1.env, {
          studentId: 'S1',
          attemptId: 'A1',
          rawAnswer: 'C',
          requestId: 'R1',
          receivedAt: 1500,
        }),
      ).rejects.toThrow()

      // The whole batch rolled back: every touched table is byte-identical to before.
      expect(d1.chup('cnh_exp_account')).toBe(truoc.account)
      expect(d1.chup('cnh_exp_day')).toBe(truoc.day)
      expect(d1.chup('cnh_exp_command')).toBe(truoc.command)
      expect(d1.chup('cnh_exp_accepted')).toBe(truoc.accepted)
      expect(d1.chup('cnh_exp_grant_ledger')).toBe(truoc.ledger)
      expect(d1.chup('cnh_exp_academic_lock')).toBe(truoc.lock)
      expect(d1.chup('cnh_exp_submit_guard')).toBe(truoc.guard)
      expect(await docSuKienHocTap(d1.env.DB, 'S1', 'A1')).toBeNull()
    } finally {
      d1.sql.exec('DROP TRIGGER tamper_evidence')
    }

    // With the fault removed, the SAME request succeeds exactly once.
    const r = await nopBaiCore(d1.env, {
      studentId: 'S1',
      attemptId: 'A1',
      rawAnswer: 'C',
      requestId: 'R1',
      receivedAt: 1500,
    })
    expect(r.raw).toBe(3)
    expect(d1.dem('cnh_exp_accepted')).toBe(1)
    expect(d1.dem('cnh_exp_grant_ledger')).toBe(1)
    expect(d1.dem('cnh_exp_academic_lock')).toBe(1)
  })
})

describe('P07 submit — control provisioning', () => {
  it('rejects a non-boolean released/active flag', async () => {
    const d1 = taoD1That()
    seedLearner(d1)
    await phatAnhChup(
      d1.env.DB,
      snapshot('I', PHAN_I, 1, { studentId: 'S1', attemptId: 'A1' }),
      900,
    )
    await expect(
      capDieuKhienNopBai(d1.env.DB, {
        studentId: 'S1',
        attemptId: 'A1',
        released: 'false' as unknown as boolean,
      }),
    ).rejects.toMatchObject({ ma: 'CORRUPT_STATE' })
  })

  it('rejects provisioning for a missing/foreign task', async () => {
    const d1 = taoD1That()
    seedLearner(d1)
    await expect(
      capDieuKhienNopBai(d1.env.DB, { studentId: 'S1', attemptId: 'A1' }),
    ).rejects.toMatchObject({ ma: 'NOT_FOUND' })
  })

  it('repeated provisioning does NOT downgrade an existing control', async () => {
    const d1 = taoD1That()
    seedLearner(d1)
    await phatAnhChup(
      d1.env.DB,
      snapshot('I', PHAN_I, 1, { studentId: 'S1', attemptId: 'A1' }),
      900,
    )
    const first = await capDieuKhienNopBai(d1.env.DB, {
      studentId: 'S1',
      attemptId: 'A1',
      assistance: 'none',
      released: true,
      active: true,
    })
    expect(first.created).toBe(true)
    const second = await capDieuKhienNopBai(d1.env.DB, {
      studentId: 'S1',
      attemptId: 'A1',
      assistance: 'assisted',
      released: false,
      active: false,
    })
    expect(second.created).toBe(false)
    expect(second.assistance).toBe('none')
    expect(second.released).toBe(true)
    expect(second.active).toBe(true)
    expect(second.revision).toBe(first.revision)
  })
})
