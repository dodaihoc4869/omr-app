// Code2 M02: immutable issuance on local workerd D1, synthetic data only.
// Actual Sessions/SQL, concurrent calls without serialiseD1. Not physical devices,
// HTTP integration, production or approval of content-group exposure lifetime.
import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { docAnhChup, phatAnhChup, publicDto, type AnhChupNhiemVu } from '../server/src/cnh-exp-task'
import type { Env } from '../server/src/kieu'

const DB = (env as unknown as Env).DB
const fresh = () => `code2-${crypto.randomUUID()}`
function snapshot(): AnhChupNhiemVu {
  return {
    studentId: fresh(), taskId: 'T1', attemptId: 'A1', qid: 'Q1', questionVersion: 'v1',
    contentGroup: 'G1', familyId: null, skillIds: ['SK1'], difficulty: 1, part: 'I',
    purpose: 'maintenance', bucket: 'core', planId: 'P1', planRevision: 1,
    policy: { version: 'CNH-1.0', curriculumRevision: 1, bankRevision: 1, protectionRevision: 1, learnerRevision: 1 },
    issuedAt: 1000, expiresAt: 2000, expectedSeconds: 60,
    grading: { key: 'B', orderMapping: { A: 'C', B: 'B', C: 'A' }, gradingPolicy: { kind: 'part-i-option-id-v1' } },
  }
}
const rows = async (studentId: string) => (await DB.prepare('SELECT * FROM cnh_exp_task WHERE student_id = ? ORDER BY attempt_id').bind(studentId).all()).results

beforeAll(async () => {
  const migrations = (env as unknown as { LUOC_DO_SQL: string[] }).LUOC_DO_SQL
    .filter(sql => /CREATE TABLE IF NOT EXISTS\s+cnh_exp_task\s*\(/i.test(sql))
  expect(migrations).toHaveLength(1)
  const statements = migrations[0].split('\n').filter(line => !/^\s*--/.test(line)).join('\n')
    .split(';').map(sql => sql.trim()).filter(Boolean)
  await DB.batch(statements.map(sql => DB.prepare(sql)))
})

describe('Code2 M02: immutable task registry, local D1', () => {
  it('20 simultaneous identical same-millisecond issues create one row and exactly one created=true', async () => {
    const s = snapshot()
    const results = await Promise.all(Array.from({ length: 20 }, () => phatAnhChup(DB, s, 900)))
    expect(results.filter(r => r.created)).toHaveLength(1)
    for (const result of results) {
      expect(result.snapshot).toEqual(s)
      expect(result.hash).toBe(results[0].hash)
    }
    const before = await rows(s.studentId)
    expect(before).toHaveLength(1)
    expect(before[0].created_at).toBe(900)
    expect((await phatAnhChup(DB, s, 1900)).created).toBe(false)
    expect(await rows(s.studentId)).toEqual(before)
  })

  it.each(['questionVersion', 'gradingKey', 'orderMapping', 'purpose'] as const)('racing conflicting %s has one winner; loser never overwrites', async (field) => {
    const original = snapshot()
    const changed: AnhChupNhiemVu = field === 'questionVersion' ? { ...original, questionVersion: 'v2' }
      : field === 'purpose' ? { ...original, purpose: 'consolidation' }
      : { ...original, grading: { ...original.grading, ...(field === 'gradingKey' ? { key: 'A' } : { orderMapping: { A: 'A', B: 'B', C: 'C' } }) } }
    const results = await Promise.allSettled([phatAnhChup(DB, original, 900), phatAnhChup(DB, changed, 901)])
    const wins = results.filter(r => r.status === 'fulfilled')
    const losses = results.filter(r => r.status === 'rejected')
    expect(wins).toHaveLength(1)
    expect(losses).toHaveLength(1)
    expect(losses[0].reason).toMatchObject({ ma: 'SNAPSHOT_CONFLICT' })
    expect(wins[0].value.created).toBe(true)
    expect(await docAnhChup(DB, original.studentId, original.attemptId)).toEqual(wins[0].value.snapshot)
    expect(await rows(original.studentId)).toHaveLength(1)
  })

  it('same task under a second attempt errors without changing the first; corrected identity can retry', async () => {
    const s = snapshot()
    await phatAnhChup(DB, s, 900)
    const before = await rows(s.studentId)
    await expect(phatAnhChup(DB, { ...s, attemptId: 'A2' }, 901)).rejects.toThrow()
    expect(await rows(s.studentId)).toEqual(before)
    expect(await docAnhChup(DB, s.studentId, 'A2')).toBeNull()
    expect((await phatAnhChup(DB, { ...s, attemptId: 'A2', taskId: 'T2' }, 902)).created).toBe(true)
  })

  it('same attempt/task identifiers across students keep separate keys and DTOs exclude grading', async () => {
    const a = snapshot(), b = { ...snapshot(), grading: { ...a.grading, key: 'A' } }
    await Promise.all([phatAnhChup(DB, a, 900), phatAnhChup(DB, b, 900)])
    expect(await docAnhChup(DB, a.studentId, a.attemptId)).toEqual(a)
    expect(await docAnhChup(DB, b.studentId, b.attemptId)).toEqual(b)
    expect(await docAnhChup(DB, fresh(), a.attemptId)).toBeNull()
    const dto = publicDto((await docAnhChup(DB, a.studentId, a.attemptId))!)
    expect(Object.keys(dto).sort()).toEqual(['taskId', 'attemptId', 'qid', 'questionVersion', 'part', 'difficulty', 'purpose', 'bucket', 'expiresAt', 'expectedSeconds'].sort())
  })

  it.each(['snapshot_hash', 'snapshot_json', 'content_group'] as const)('tampered %s fails read and issue before conflict comparison, without silent repair', async (column) => {
    const s = snapshot()
    await phatAnhChup(DB, s, 900)
    await DB.prepare(`UPDATE cnh_exp_task SET ${column} = ? WHERE student_id = ?`).bind('corrupt', s.studentId).run()
    const before = await rows(s.studentId)
    await expect(docAnhChup(DB, s.studentId, s.attemptId)).rejects.toMatchObject({ ma: 'CORRUPT_SNAPSHOT' })
    await expect(phatAnhChup(DB, { ...s, questionVersion: 'v2' }, 901)).rejects.toMatchObject({ ma: 'CORRUPT_SNAPSHOT' })
    expect(await rows(s.studentId)).toEqual(before)
  })

  it('an AFTER INSERT failure rolls the row back; same identity can issue after the fault is removed', async () => {
    const s = snapshot(), trigger = `code2_fault_${crypto.randomUUID().replaceAll('-', '')}`
    // Synthetic UUID-only student ID, scoped trigger; no effect on other concurrent suites.
    await DB.prepare(`CREATE TRIGGER ${trigger} AFTER INSERT ON cnh_exp_task
      WHEN NEW.student_id = '${s.studentId}' BEGIN SELECT RAISE(ABORT, 'code2 issuance fault'); END`).run()
    try {
      await expect(phatAnhChup(DB, s, 900)).rejects.toThrow(/code2 issuance fault/)
      expect(await rows(s.studentId)).toEqual([])
      expect(await docAnhChup(DB, s.studentId, s.attemptId)).toBeNull()
    } finally {
      await DB.prepare(`DROP TRIGGER IF EXISTS ${trigger}`).run()
    }
    expect((await phatAnhChup(DB, s, 901)).created).toBe(true)
    expect((await phatAnhChup(DB, s, 902)).created).toBe(false)
    expect(await rows(s.studentId)).toHaveLength(1)
  })
})
