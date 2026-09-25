// CNH-1.0 P07 — immutable SERVER-ISSUED task/attempt reward snapshot registry.
//
// ⚠️ RUNTIME: these tests run the REAL migration + REAL SQL against the in-memory SQLite
// adapter in `tests/_d1-that.ts` (node:sqlite). This proves schema shape + SQL semantics
// (ON CONFLICT DO NOTHING, UNIQUE indexes, CAS-style read-back). It does NOT prove Cloudflare
// D1/workerd concurrency behaviour. Concurrency cases below use `serialiseD1` to model the
// atomic batch boundary; they are NOT a substitute for a workerd run.
import { describe, it, expect } from 'vitest'
import { taoD1That, serialiseD1, type D1That } from './_d1-that'
import {
  phatAnhChup,
  docAnhChup,
  publicDto,
  jsonChuanHoa,
  bamAnhChup,
  bamSha256,
  kiemTraAnhChup,
  LoiAnhChup,
  type AnhChupNhiemVu,
} from '../server/src/cnh-exp-task'

/** A minimal valid server snapshot. Callers may override individual fields. */
function anhChup(over: Partial<AnhChupNhiemVu> = {}): AnhChupNhiemVu {
  return {
    taskId: 'task-1',
    attemptId: 'att-1',
    studentId: 'hs-1',
    qid: 'q-1',
    questionVersion: 'v1',
    contentGroup: 'cg-1',
    familyId: 'fam-1',
    skillIds: ['sk-1', 'sk-2'],
    difficulty: 1,
    part: 'I',
    purpose: 'maintenance',
    bucket: 'core',
    planId: 'plan-1',
    planRevision: 1,
    policy: {
      version: 'CNH-1.0',
      curriculumRevision: 1,
      bankRevision: 1,
      protectionRevision: 1,
      learnerRevision: 1,
    },
    issuedAt: 1_700_000_000_000,
    expiresAt: 1_700_000_900_000,
    expectedSeconds: 60,
    grading: {
      key: { answer: 'A' },
      gradingPolicy: { mode: 'exact' },
      orderMapping: { options: ['A', 'B', 'C', 'D'] },
    },
    ...over,
  }
}

function db(): D1That {
  return taoD1That()
}

describe('cnh-exp-task — canonical JSON + hash', () => {
  it('same object with different key order ⇒ same hash', async () => {
    const a = anhChup()
    const b = anhChup({
      grading: {
        orderMapping: { options: ['A', 'B', 'C', 'D'] },
        gradingPolicy: { mode: 'exact' },
        key: { answer: 'A' },
      },
    })
    const ha = await bamAnhChup(kiemTraAnhChup(a))
    const hb = await bamAnhChup(kiemTraAnhChup(b))
    expect(ha.hash).toBe(hb.hash)
    expect(ha.json).toBe(hb.json)
  })

  it('option array order is preserved (NOT sorted) and changes the hash', async () => {
    const a = anhChup()
    const b = anhChup({
      grading: {
        key: { answer: 'A' },
        gradingPolicy: { mode: 'exact' },
        orderMapping: { options: ['D', 'C', 'B', 'A'] },
      },
    })
    const ha = await bamAnhChup(kiemTraAnhChup(a))
    const hb = await bamAnhChup(kiemTraAnhChup(b))
    expect(ha.hash).not.toBe(hb.hash)
    expect(jsonChuanHoa(kiemTraAnhChup(b))).toContain('["D","C","B","A"]')
  })

  it('reordered keys ⇒ identical canonical JSON and hash', async () => {
    const a = { b: 1, a: { d: 2, c: 3 } }
    const b = { a: { c: 3, d: 2 }, b: 1 }
    expect(jsonChuanHoa(a)).toBe(jsonChuanHoa(b))
    expect(await bamSha256(jsonChuanHoa(a))).toBe(await bamSha256(jsonChuanHoa(b)))
  })

  it('preserves own keys named __proto__/constructor/prototype (no setter collision)', () => {
    const withProto = JSON.parse('{"__proto__":{"x":1},"constructor":"c","prototype":"p","a":1}') as Record<string, unknown>
    const withoutProto = { constructor: 'c', prototype: 'p', a: 1 } as Record<string, unknown>
    const s1 = jsonChuanHoa(withProto)
    const s2 = jsonChuanHoa(withoutProto)
    expect(s1).not.toBe(s2)
    expect(s1).toContain('"__proto__"')
    expect(s1).toContain('"constructor"')
    expect(s1).toContain('"prototype"')
    // Round-trips through JSON.parse with the own key intact.
    const back = JSON.parse(s1) as Record<string, unknown>
    expect(Object.prototype.hasOwnProperty.call(back, '__proto__')).toBe(true)
    expect((back as { __proto__: unknown }).__proto__).toEqual({ x: 1 })
  })

  it('rejects non-JSON structures with a typed error (never RangeError/stack overflow)', () => {
    expect(() => jsonChuanHoa(new Date())).toThrow(LoiAnhChup)
    expect(() => jsonChuanHoa(new Map())).toThrow(LoiAnhChup)
    expect(() => jsonChuanHoa(new Set())).toThrow(LoiAnhChup)
    expect(() => jsonChuanHoa(() => 1)).toThrow(LoiAnhChup)
    expect(() => jsonChuanHoa(Symbol('s'))).toThrow(LoiAnhChup)
    expect(() => jsonChuanHoa(undefined)).toThrow(LoiAnhChup)
    expect(() => jsonChuanHoa(10n)).toThrow(LoiAnhChup)
    expect(() => jsonChuanHoa({ a: undefined })).toThrow(LoiAnhChup)
    expect(() => jsonChuanHoa({ a: new Date() })).toThrow(LoiAnhChup)
    expect(() => jsonChuanHoa([1, , 3])).toThrow(LoiAnhChup)
    expect(() => jsonChuanHoa({ get a() { return 1 } })).toThrow(LoiAnhChup)
    expect(() => jsonChuanHoa({ a: NaN })).toThrow(LoiAnhChup)
    expect(() => jsonChuanHoa({ a: Infinity })).toThrow(LoiAnhChup)
  })

  it('rejects cycles with a typed error, not a RangeError', () => {
    const cyc: Record<string, unknown> = { a: 1 }
    cyc.self = cyc
    let caught: unknown
    try {
      jsonChuanHoa(cyc)
    } catch (e) {
      caught = e
    }
    expect(caught).toBeInstanceOf(LoiAnhChup)
    expect((caught as LoiAnhChup).ma).toBe('SNAPSHOT_INVALID')
    expect(caught).not.toBeInstanceOf(RangeError)
  })

  it('supports null-prototype objects', () => {
    const o = Object.create(null) as Record<string, unknown>
    o.a = 1
    o.b = { c: 2 }
    expect(jsonChuanHoa(o)).toBe('{"a":1,"b":{"c":2}}')
  })

  it('rejects an array index getter WITHOUT invoking it (jsonChuanHoa + public validation)', () => {
    let calls = 0
    const arr: unknown[] = ['A', 'B']
    Object.defineProperty(arr, 1, {
      get() {
        calls++
        return 'B'
      },
      enumerable: true,
      configurable: true,
    })
    expect(() => jsonChuanHoa(arr)).toThrow(LoiAnhChup)
    // Public validation must reject the accessor-bearing array before reading any field.
    expect(() => kiemTraAnhChup(anhChup({ skillIds: arr as never }))).toThrow(LoiAnhChup)
    expect(calls).toBe(0)
  })

  it('rejects an accessor on grading.orderMapping WITHOUT invoking it (public validation)', () => {
    let calls = 0
    const orderMapping: unknown[] = ['A', 'B']
    Object.defineProperty(orderMapping, 0, {
      get() {
        calls++
        return 'A'
      },
      enumerable: true,
      configurable: true,
    })
    expect(() =>
      kiemTraAnhChup(
        anhChup({
          grading: { key: { answer: 'A' }, gradingPolicy: { mode: 'exact' }, orderMapping },
        }),
      ),
    ).toThrow(LoiAnhChup)
    expect(calls).toBe(0)
  })

  it('rejects own symbol keys on arrays (jsonChuanHoa + public validation)', () => {
    const arr: unknown[] = ['A', 'B']
    ;(arr as unknown as Record<symbol, unknown>)[Symbol('s')] = 1
    expect(() => jsonChuanHoa(arr)).toThrow(LoiAnhChup)
    expect(() => kiemTraAnhChup(anhChup({ skillIds: arr as never }))).toThrow(LoiAnhChup)
  })

  it('public validation deep-clones grading.orderMapping arrays (order preserved, frozen)', () => {
    const validated = kiemTraAnhChup(
      anhChup({
        grading: {
          key: { answer: 'A' },
          gradingPolicy: { mode: 'exact' },
          orderMapping: ['D', 'C', 'B', 'A'],
        },
      }),
    )
    expect(validated.grading.orderMapping).toEqual(['D', 'C', 'B', 'A'])
    expect(Object.isFrozen(validated.grading.orderMapping)).toBe(true)
  })

  it('normal ordered arrays are unchanged (order preserved, no false rejection)', () => {
    expect(jsonChuanHoa(['A', 'B', 'C', 'D'])).toBe('["A","B","C","D"]')
    expect(jsonChuanHoa({ options: ['D', 'C', 'B', 'A'] })).toBe('{"options":["D","C","B","A"]}')
  })
})

describe('cnh-exp-task — validation', () => {
  it('rejects empty strings, bad enums, bad times, bad expectedSeconds', () => {
    expect(() => kiemTraAnhChup(anhChup({ taskId: '' }))).toThrow(LoiAnhChup)
    expect(() => kiemTraAnhChup(anhChup({ part: 'IV' as never }))).toThrow(LoiAnhChup)
    expect(() => kiemTraAnhChup(anhChup({ difficulty: 3 as never }))).toThrow(LoiAnhChup)
    expect(() => kiemTraAnhChup(anhChup({ bucket: 'gold' as never }))).toThrow(LoiAnhChup)
    expect(() => kiemTraAnhChup(anhChup({ purpose: 'nope' as never }))).toThrow(LoiAnhChup)
    expect(() => kiemTraAnhChup(anhChup({ expiresAt: 1 }))).toThrow(LoiAnhChup)
    expect(() => kiemTraAnhChup(anhChup({ expectedSeconds: 0 }))).toThrow(LoiAnhChup)
    expect(() => kiemTraAnhChup(anhChup({ planRevision: -1 }))).toThrow(LoiAnhChup)
    expect(() => kiemTraAnhChup(anhChup({ skillIds: ['ok', ''] }))).toThrow(LoiAnhChup)
    expect(() => kiemTraAnhChup(anhChup({ grading: { key: NaN, gradingPolicy: {}, orderMapping: {} } }))).toThrow(LoiAnhChup)
  })

  it('rejects invalid input with NO writes', async () => {
    const d = db()
    await expect(phatAnhChup(d.env.DB, anhChup({ taskId: '' }), 1)).rejects.toThrow(LoiAnhChup)
    expect(d.dem('cnh_exp_task')).toBe(0)
  })

  it('rejects non-JSON grading material with NO DB row', async () => {
    const d = db()
    await expect(
      phatAnhChup(d.env.DB, anhChup({ grading: { key: new Date(), gradingPolicy: {}, orderMapping: {} } as never }), 1),
    ).rejects.toThrow(LoiAnhChup)
    await expect(
      phatAnhChup(d.env.DB, anhChup({ grading: { key: { a: undefined }, gradingPolicy: {}, orderMapping: {} } as never }), 2),
    ).rejects.toThrow(LoiAnhChup)
    expect(d.dem('cnh_exp_task')).toBe(0)
  })

  it('rejects a non-integer / negative `now`', async () => {
    const d = db()
    await expect(phatAnhChup(d.env.DB, anhChup(), 1.5)).rejects.toThrow(LoiAnhChup)
    await expect(phatAnhChup(d.env.DB, anhChup(), -1)).rejects.toThrow(LoiAnhChup)
    await expect(phatAnhChup(d.env.DB, anhChup(), NaN)).rejects.toThrow(LoiAnhChup)
    expect(d.dem('cnh_exp_task')).toBe(0)
  })

  it('deep input mutation after validation cannot change the validated snapshot', async () => {
    const d = db()
    const input = anhChup()
    const validated = kiemTraAnhChup(input)
    const before = await bamAnhChup(validated)
    // Mutate the ORIGINAL nested objects after validation.
    ;(input.grading.key as { answer: string }).answer = 'Z'
    ;(input.grading.orderMapping as { options: string[] }).options.push('E')
    ;(input.skillIds as string[]).push('sk-9')
    const after = await bamAnhChup(validated)
    expect(after.hash).toBe(before.hash)
    expect((validated.grading.key as { answer: string }).answer).toBe('A')
    expect((validated.grading.orderMapping as { options: string[] }).options).toEqual(['A', 'B', 'C', 'D'])
    expect(validated.skillIds).toEqual(['sk-1', 'sk-2'])
    // And the frozen clone is actually frozen.
    expect(Object.isFrozen(validated.grading.key)).toBe(true)
    expect(Object.isFrozen(validated.grading.orderMapping)).toBe(true)
    expect(Object.isFrozen(validated.skillIds)).toBe(true)
    void d
  })
})

describe('cnh-exp-task — issuance immutability', () => {
  it('retry with the same snapshot returns the ORIGINAL row unchanged', async () => {
    const d = db()
    const first = await phatAnhChup(d.env.DB, anhChup(), 1000)
    expect(first.created).toBe(true)
    const second = await phatAnhChup(d.env.DB, anhChup(), 9999)
    expect(second.created).toBe(false)
    expect(second.hash).toBe(first.hash)
    // created_at must NOT be reset by the retry.
    const row = d.sql.prepare(`SELECT created_at FROM cnh_exp_task WHERE attempt_id='att-1'`).get() as { created_at: number }
    expect(row.created_at).toBe(1000)
  })

  it('same-millisecond retry ⇒ created true then false (not created_at === now)', async () => {
    const d = db()
    const first = await phatAnhChup(d.env.DB, anhChup(), 5000)
    const second = await phatAnhChup(d.env.DB, anhChup(), 5000)
    expect(first.created).toBe(true)
    expect(second.created).toBe(false)
    const row = d.sql.prepare(`SELECT created_at FROM cnh_exp_task WHERE attempt_id='att-1'`).get() as { created_at: number }
    expect(row.created_at).toBe(5000)
  })

  it('conflicting version/key/purpose ⇒ SNAPSHOT_CONFLICT', async () => {
    const d = db()
    await phatAnhChup(d.env.DB, anhChup(), 1)
    await expect(
      phatAnhChup(d.env.DB, anhChup({ questionVersion: 'v2' }), 2),
    ).rejects.toMatchObject({ ma: 'SNAPSHOT_CONFLICT' })
    await expect(
      phatAnhChup(d.env.DB, anhChup({ grading: { key: { answer: 'B' }, gradingPolicy: { mode: 'exact' }, orderMapping: { options: ['A', 'B', 'C', 'D'] } } }), 3),
    ).rejects.toMatchObject({ ma: 'SNAPSHOT_CONFLICT' })
    await expect(
      phatAnhChup(d.env.DB, anhChup({ purpose: 'probe' }), 4),
    ).rejects.toMatchObject({ ma: 'SNAPSHOT_CONFLICT' })
    expect(d.dem('cnh_exp_task')).toBe(1)
  })

  it('same qid on two attempts keeps separate versions', async () => {
    const d = db()
    await phatAnhChup(d.env.DB, anhChup({ attemptId: 'att-1', taskId: 'task-1', questionVersion: 'v1' }), 1)
    await phatAnhChup(d.env.DB, anhChup({ attemptId: 'att-2', taskId: 'task-2', questionVersion: 'v2' }), 2)
    const a1 = await docAnhChup(d.env.DB, 'hs-1', 'att-1')
    const a2 = await docAnhChup(d.env.DB, 'hs-1', 'att-2')
    expect(a1?.questionVersion).toBe('v1')
    expect(a2?.questionVersion).toBe('v2')
    expect(d.dem('cnh_exp_task')).toBe(2)
  })

  it('reusing a task_id for another attempt conflicts (not swallowed)', async () => {
    const d = db()
    await phatAnhChup(d.env.DB, anhChup({ attemptId: 'att-1', taskId: 'task-1' }), 1)
    await expect(
      phatAnhChup(d.env.DB, anhChup({ attemptId: 'att-2', taskId: 'task-1' }), 2),
    ).rejects.toThrow()
    expect(d.dem('cnh_exp_task')).toBe(1)
  })
})

describe('cnh-exp-task — ownership + read', () => {
  it('read is scoped to the authenticated student; no cross-student fallback', async () => {
    const d = db()
    await phatAnhChup(d.env.DB, anhChup({ studentId: 'hs-1', attemptId: 'att-1' }), 1)
    expect(await docAnhChup(d.env.DB, 'hs-2', 'att-1')).toBeNull()
    expect(await docAnhChup(d.env.DB, 'hs-1', 'att-1')).not.toBeNull()
  })

  it('read returns the full server-only snapshot (grading material present)', async () => {
    const d = db()
    await phatAnhChup(d.env.DB, anhChup(), 1)
    const a = await docAnhChup(d.env.DB, 'hs-1', 'att-1')
    expect(a?.grading.key).toEqual({ answer: 'A' })
    expect(a?.grading.orderMapping).toEqual({ options: ['A', 'B', 'C', 'D'] })
  })
})

describe('cnh-exp-task — integrity (fails closed, never repairs)', () => {
  it('corrupt snapshot_json ⇒ CORRUPT_SNAPSHOT on read', async () => {
    const d = db()
    await phatAnhChup(d.env.DB, anhChup(), 1)
    d.sql.prepare(`UPDATE cnh_exp_task SET snapshot_json = '{not json' WHERE attempt_id='att-1'`).run()
    await expect(docAnhChup(d.env.DB, 'hs-1', 'att-1')).rejects.toMatchObject({ ma: 'CORRUPT_SNAPSHOT' })
  })

  it('tampered snapshot_hash ⇒ CORRUPT_SNAPSHOT on read', async () => {
    const d = db()
    await phatAnhChup(d.env.DB, anhChup(), 1)
    d.sql.prepare(`UPDATE cnh_exp_task SET snapshot_hash = 'deadbeef' WHERE attempt_id='att-1'`).run()
    await expect(docAnhChup(d.env.DB, 'hs-1', 'att-1')).rejects.toMatchObject({ ma: 'CORRUPT_SNAPSHOT' })
  })

  it('JSON/column identity mismatch ⇒ CORRUPT_SNAPSHOT (no silent repair)', async () => {
    const d = db()
    await phatAnhChup(d.env.DB, anhChup(), 1)
    // Rewrite the indexed qid column only; JSON still says q-1.
    d.sql.prepare(`UPDATE cnh_exp_task SET qid = 'q-OTHER' WHERE attempt_id='att-1'`).run()
    await expect(docAnhChup(d.env.DB, 'hs-1', 'att-1')).rejects.toMatchObject({ ma: 'CORRUPT_SNAPSHOT' })
  })

  it('owner relation mismatch ⇒ CORRUPT_SNAPSHOT (never another student grading material)', async () => {
    const d = db()
    await phatAnhChup(d.env.DB, anhChup({ studentId: 'hs-1', attemptId: 'att-1' }), 1)
    // Point the row at another student while the JSON still says hs-1.
    d.sql.prepare(`UPDATE cnh_exp_task SET student_id = 'hs-2' WHERE attempt_id='att-1'`).run()
    await expect(docAnhChup(d.env.DB, 'hs-2', 'att-1')).rejects.toMatchObject({ ma: 'CORRUPT_SNAPSHOT' })
  })

  it('issuance also verifies the stored row (corrupt row ⇒ CORRUPT_SNAPSHOT)', async () => {
    const d = db()
    await phatAnhChup(d.env.DB, anhChup(), 1)
    d.sql.prepare(`UPDATE cnh_exp_task SET snapshot_hash = 'deadbeef' WHERE attempt_id='att-1'`).run()
    await expect(phatAnhChup(d.env.DB, anhChup(), 2)).rejects.toMatchObject({ ma: 'CORRUPT_SNAPSHOT' })
  })

  it('corrupt stored row wins over a DIFFERENT incoming hash ⇒ CORRUPT_SNAPSHOT (not CONFLICT)', async () => {
    const d = db()
    await phatAnhChup(d.env.DB, anhChup(), 1)
    d.sql.prepare(`UPDATE cnh_exp_task SET snapshot_hash = 'deadbeef' WHERE attempt_id='att-1'`).run()
    // Incoming snapshot differs from the stored one; the corrupt stored row must still win.
    await expect(
      phatAnhChup(d.env.DB, anhChup({ questionVersion: 'v2' }), 2),
    ).rejects.toMatchObject({ ma: 'CORRUPT_SNAPSHOT' })
  })

  it('healthy stored row + different incoming hash ⇒ SNAPSHOT_CONFLICT (unchanged)', async () => {
    const d = db()
    await phatAnhChup(d.env.DB, anhChup({ questionVersion: 'v1' }), 1)
    await expect(
      phatAnhChup(d.env.DB, anhChup({ questionVersion: 'v2' }), 2),
    ).rejects.toMatchObject({ ma: 'SNAPSHOT_CONFLICT' })
    expect(d.dem('cnh_exp_task')).toBe(1)
  })
})

describe('cnh-exp-task — public DTO allowlist', () => {
  it('never leaks grading key/policy/order mapping or nested server-only fields', async () => {
    const d = db()
    await phatAnhChup(d.env.DB, anhChup(), 1)
    const a = (await docAnhChup(d.env.DB, 'hs-1', 'att-1'))!
    const dto = publicDto(a)
    const keys = Object.keys(dto).sort()
    expect(keys).toEqual(
      ['attemptId', 'bucket', 'difficulty', 'expectedSeconds', 'expiresAt', 'part', 'purpose', 'qid', 'questionVersion', 'taskId'].sort(),
    )
    const json = JSON.stringify(dto)
    expect(json).not.toContain('answer')
    expect(json).not.toContain('gradingPolicy')
    expect(json).not.toContain('orderMapping')
    expect(json).not.toContain('familyId')
    expect(json).not.toContain('skillIds')
    expect(json).not.toContain('planId')
  })
})

describe('cnh-exp-task — concurrency (serialised, NOT real D1)', () => {
  it('simultaneous same attempt + same hash ⇒ one row, both succeed', async () => {
    const d = db()
    serialiseD1(d.env)
    const [a, b] = await Promise.all([
      phatAnhChup(d.env.DB, anhChup(), 1),
      phatAnhChup(d.env.DB, anhChup(), 2),
    ])
    expect(a.hash).toBe(b.hash)
    expect(d.dem('cnh_exp_task')).toBe(1)
  })

  it('simultaneous same attempt + different hash ⇒ exactly one wins, loser conflicts', async () => {
    const d = db()
    serialiseD1(d.env)
    const results = await Promise.allSettled([
      phatAnhChup(d.env.DB, anhChup({ questionVersion: 'v1' }), 1),
      phatAnhChup(d.env.DB, anhChup({ questionVersion: 'v2' }), 2),
    ])
    const ok = results.filter((r) => r.status === 'fulfilled')
    const bad = results.filter((r) => r.status === 'rejected')
    expect(ok).toHaveLength(1)
    expect(bad).toHaveLength(1)
    expect((bad[0] as PromiseRejectedResult).reason).toMatchObject({ ma: 'SNAPSHOT_CONFLICT' })
    expect(d.dem('cnh_exp_task')).toBe(1)
  })

  it('8 concurrent same attempt + SAME now ⇒ exactly one created=true, original created_at kept', async () => {
    const d = db()
    serialiseD1(d.env)
    const results = await Promise.all(
      Array.from({ length: 8 }, () => phatAnhChup(d.env.DB, anhChup(), 7777)),
    )
    expect(results.filter((r) => r.created)).toHaveLength(1)
    expect(results.filter((r) => !r.created)).toHaveLength(7)
    expect(new Set(results.map((r) => r.hash)).size).toBe(1)
    expect(d.dem('cnh_exp_task')).toBe(1)
    const row = d.sql.prepare(`SELECT created_at FROM cnh_exp_task WHERE attempt_id='att-1'`).get() as { created_at: number }
    expect(row.created_at).toBe(7777)
  })
})
