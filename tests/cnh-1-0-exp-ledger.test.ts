// CNH-1.0 P07 — CORE ENTITLEMENT SETTLEMENT SUBSTRATE tests.
//
// ⚠️ RUNTIME: these tests run against `taoD1That()` — an IN-MEMORY node:sqlite database that
// loads the REAL `server/schema.sql` + every `server/migration-*.sql` and executes the server's
// SQL for real, with `batch` wrapped in a transaction (like D1). This proves SCHEMA SHAPE and
// SQL SEMANTICS (UNIQUE, CHECK, INSERT..SELECT guards, batch rollback). It does NOT prove real
// Cloudflare D1 / workerd concurrency, load limits, or dialect differences. Any concurrency
// claim here is about the SQLite transaction model, not the D1 runtime. The interleaving tests
// use `serialiseD1` to force the SQLite transaction model; they are NOT a real-D1 concurrency
// proof.
//
// ⚠️ SCOPE: this job proves the SUBSTRATE only. It does NOT wire issued tasks, academic locks,
// optional pricing, original-learning-day resolution, submission/embargo/correction, migration
// or legacy cutover. Those MUST land before activation.
import { describe, expect, it } from 'vitest'
import { serialiseD1, taoD1That } from './_d1-that'
import {
  PHIEN_BAN_CHINH_SACH,
  quyetToanQuyenCore,
} from '../server/src/cnh-exp-ledger'

const NGAY = '2026-09-23'

/** Seed a synthetic account + day. Tests never touch legacy tables. */
function gieo(
  d1: ReturnType<typeof taoD1That>,
  opts: {
    studentId?: string
    wallet?: number
    earned?: number
    accountRevision?: number
    rawCore?: number
    achieved?: boolean
    corePaid?: number
    compensationPaid?: number
    dayRevision?: number
  } = {},
) {
  const studentId = opts.studentId ?? 'em-01'
  d1.sql
    .prepare(
      `INSERT INTO cnh_exp_account (student_id, wallet_exp, earned_exp, revision)
       VALUES (?, ?, ?, ?)`,
    )
    .run(studentId, opts.wallet ?? 0, opts.earned ?? 0, opts.accountRevision ?? 0)
  d1.sql
    .prepare(
      `INSERT INTO cnh_exp_day
         (student_id, learning_day, policy_version, raw_core, achieved, core_paid, compensation_paid, revision)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      studentId,
      NGAY,
      PHIEN_BAN_CHINH_SACH,
      opts.rawCore ?? 0,
      opts.achieved ? 1 : 0,
      opts.corePaid ?? 0,
      opts.compensationPaid ?? 0,
      opts.dayRevision ?? 0,
    )
  return studentId
}

const yeuCau = (studentId: string, requestId: string, requestHash = 'h1') => ({
  studentId,
  learningDay: NGAY,
  requestHash,
  requestId,
})

describe('CNH P07 — quyết toán quyền core (substrate, NOT real D1/workerd)', () => {
  it('136 đã trả, achieved ⇒ bù 84; ví/earned/core_paid/sổ/receipt nhất quán', async () => {
    const d1 = taoD1That()
    const studentId = gieo(d1, {
      wallet: 136,
      earned: 136,
      rawCore: 136,
      achieved: true,
      corePaid: 136,
    })

    const kq = await quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r1'))

    expect(kq.entitlement).toBe(220)
    expect(kq.grant).toBe(84)
    expect(kq.walletAfter).toBe(220)
    expect(kq.earnedAfter).toBe(220)
    expect(kq.corePaidAfter).toBe(220)

    // The response is exactly the stored receipt JSON (no extra fields, no `replayed` flag).
    const lenhRow = d1.sql
      .prepare('SELECT response_json FROM cnh_exp_command WHERE student_id = ?')
      .get(studentId) as any
    expect(kq).toEqual(JSON.parse(lenhRow.response_json))

    const tk = d1.sql
      .prepare('SELECT wallet_exp, earned_exp, revision FROM cnh_exp_account WHERE student_id = ?')
      .get(studentId) as any
    expect(tk.wallet_exp).toBe(220)
    expect(tk.earned_exp).toBe(220)
    expect(tk.revision).toBe(1)

    const ng = d1.sql
      .prepare('SELECT core_paid, revision FROM cnh_exp_day WHERE student_id = ?')
      .get(studentId) as any
    expect(ng.core_paid).toBe(220)
    expect(ng.revision).toBe(1)

    const so = d1.sql
      .prepare('SELECT amount FROM cnh_exp_grant_ledger WHERE student_id = ?')
      .all(studentId) as any[]
    expect(so).toHaveLength(1)
    expect(so[0].amount).toBe(84)

    const lenh = d1.sql
      .prepare('SELECT response_json FROM cnh_exp_command WHERE student_id = ?')
      .all(studentId) as any[]
    expect(lenh).toHaveLength(1)
    expect(JSON.parse(lenh[0].response_json).grant).toBe(84)
  })

  it('190 đã trả, achieved ⇒ bù 30', async () => {
    const d1 = taoD1That()
    const studentId = gieo(d1, {
      wallet: 190,
      earned: 190,
      rawCore: 190,
      achieved: true,
      corePaid: 190,
    })
    const kq = await quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r1'))
    expect(kq.grant).toBe(30)
    expect(kq.walletAfter).toBe(220)
  })

  it('đã trả 220, achieved ⇒ bù 0 nhưng vẫn có receipt', async () => {
    const d1 = taoD1That()
    const studentId = gieo(d1, {
      wallet: 220,
      earned: 220,
      rawCore: 220,
      achieved: true,
      corePaid: 220,
    })
    const kq = await quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r1'))
    expect(kq.grant).toBe(0)
    expect(kq.walletAfter).toBe(220)
    const lenh = d1.sql
      .prepare('SELECT COUNT(*) n FROM cnh_exp_command WHERE student_id = ?')
      .get(studentId) as any
    expect(lenh.n).toBe(1)
  })

  it('correction raw 2→5 trên ngày đã trả 220 ⇒ bù 0 (không bù chênh raw)', async () => {
    const d1 = taoD1That()
    const studentId = gieo(d1, {
      wallet: 220,
      earned: 220,
      rawCore: 5,
      achieved: true,
      corePaid: 220,
    })
    const kq = await quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r1'))
    expect(kq.entitlement).toBe(220)
    expect(kq.grant).toBe(0)
  })

  it('compensation đã trả chặn trả trùng', async () => {
    const d1 = taoD1That()
    const studentId = gieo(d1, {
      wallet: 136,
      earned: 136,
      rawCore: 136,
      achieved: true,
      corePaid: 136,
      compensationPaid: 84,
    })
    const kq = await quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r1'))
    expect(kq.grant).toBe(0)
  })

  it('cùng key cùng hash ⇒ replay y hệt (deep-equal, không chuẩn hoá), không ghi thêm', async () => {
    const d1 = taoD1That()
    const studentId = gieo(d1, {
      wallet: 136,
      earned: 136,
      rawCore: 136,
      achieved: true,
      corePaid: 136,
    })
    const a = await quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r1'))
    const b = await quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r1'))
    // The stored response is immutable: a replay returns the SAME object, deep-equal to the first.
    expect(b).toEqual(a)
    expect(b.committedRevision).toBe(a.committedRevision)
    const so = d1.sql
      .prepare('SELECT COUNT(*) n FROM cnh_exp_grant_ledger WHERE student_id = ?')
      .get(studentId) as any
    expect(so.n).toBe(1)
  })

  it('cùng key khác hash ⇒ IDEMPOTENCY_CONFLICT', async () => {
    const d1 = taoD1That()
    const studentId = gieo(d1, {
      wallet: 136,
      earned: 136,
      rawCore: 136,
      achieved: true,
      corePaid: 136,
    })
    await quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r1', 'h1'))
    await expect(
      quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r1', 'h2')),
    ).rejects.toMatchObject({ ma: 'IDEMPOTENCY_CONFLICT' })
  })

  it('khác key cùng quyền ⇒ không trả hai lần', async () => {
    const d1 = taoD1That()
    const studentId = gieo(d1, {
      wallet: 136,
      earned: 136,
      rawCore: 136,
      achieved: true,
      corePaid: 136,
    })
    const a = await quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r1'))
    const b = await quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r2'))
    expect(a.grant).toBe(84)
    expect(b.grant).toBe(0)
    const tk = d1.sql
      .prepare('SELECT wallet_exp FROM cnh_exp_account WHERE student_id = ?')
      .get(studentId) as any
    expect(tk.wallet_exp).toBe(220)
    // Two DISTINCT committed receipts (different request_id), grants sorted [0, 84].
    const lenh = d1.sql
      .prepare('SELECT request_id, response_json FROM cnh_exp_command WHERE student_id = ? ORDER BY request_id')
      .all(studentId) as any[]
    expect(lenh).toHaveLength(2)
    expect(new Set(lenh.map((r) => r.request_id)).size).toBe(2)
    const grants = lenh.map((r) => JSON.parse(r.response_json).grant).sort((x, y) => x - y)
    expect(grants).toEqual([0, 84])
  })

  it('hai học sinh độc lập', async () => {
    const d1 = taoD1That()
    const a = gieo(d1, {
      studentId: 'em-a',
      wallet: 136,
      earned: 136,
      rawCore: 136,
      achieved: true,
      corePaid: 136,
    })
    const b = gieo(d1, {
      studentId: 'em-b',
      wallet: 0,
      earned: 0,
      rawCore: 0,
      achieved: false,
      corePaid: 0,
    })
    const ka = await quyetToanQuyenCore(d1.env, yeuCau(a, 'r1'))
    const kb = await quyetToanQuyenCore(d1.env, yeuCau(b, 'r1'))
    expect(ka.grant).toBe(84)
    expect(kb.grant).toBe(0)
    const tka = d1.sql
      .prepare('SELECT wallet_exp FROM cnh_exp_account WHERE student_id = ?')
      .get(a) as any
    const tkb = d1.sql
      .prepare('SELECT wallet_exp FROM cnh_exp_account WHERE student_id = ?')
      .get(b) as any
    expect(tka.wallet_exp).toBe(220)
    expect(tkb.wallet_exp).toBe(0)
  })

  it('CAS thua thật (revision lệch NGAY trước batch đầu) ⇒ thử lại, execution_id mới mỗi lần', async () => {
    const d1 = taoD1That()
    const studentId = gieo(d1, {
      wallet: 136,
      earned: 136,
      rawCore: 136,
      achieved: true,
      corePaid: 136,
    })
    // Force a REAL CAS loss: bump the account revision IMMEDIATELY BEFORE the first batch runs,
    // so the first claim's revision guard fails (0 rows) and the batch is a no-op. We wrap the
    // DB batch to do this deterministically (not in `sleep`, which runs only AFTER a retry).
    const seen: string[] = []
    let soLanBatch = 0
    const batchGoc = d1.env.DB.batch.bind(d1.env.DB)
    d1.env.DB.batch = (async (ds: any[]) => {
      soLanBatch++
      if (soLanBatch === 1) {
        d1.sql
          .prepare('UPDATE cnh_exp_account SET revision = revision + 1 WHERE student_id = ?')
          .run(studentId)
      }
      return batchGoc(ds)
    }) as typeof d1.env.DB.batch

    const kq = await quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r1'), {
      uuid: () => {
        const id = `exec-${seen.length}`
        seen.push(id)
        return id
      },
      sleep: async () => {},
    })

    expect(kq.grant).toBe(84)
    // At least two REAL batch attempts, and each claim used a DISTINCT execution_id.
    expect(soLanBatch).toBeGreaterThanOrEqual(2)
    expect(seen.length).toBeGreaterThanOrEqual(2)
    expect(new Set(seen).size).toBe(seen.length)
    // Exactly one grant, and the final revisions reflect exactly one successful settlement.
    const so = d1.sql
      .prepare('SELECT COUNT(*) n FROM cnh_exp_grant_ledger WHERE student_id = ?')
      .get(studentId) as any
    expect(so.n).toBe(1)
    const tk = d1.sql
      .prepare('SELECT wallet_exp, revision FROM cnh_exp_account WHERE student_id = ?')
      .get(studentId) as any
    expect(tk.wallet_exp).toBe(220)
    // account revision: 1 (forced bump) + 1 (successful settlement) = 2
    expect(tk.revision).toBe(2)
    const ng = d1.sql
      .prepare('SELECT core_paid, revision FROM cnh_exp_day WHERE student_id = ?')
      .get(studentId) as any
    expect(ng.core_paid).toBe(220)
    expect(ng.revision).toBe(1)
  })

  it('lỗi SQL khi ghi sổ ⇒ MỘT batch, không sleep, rollback toàn bộ; thử lại thành công', async () => {
    const d1 = taoD1That()
    const studentId = gieo(d1, {
      wallet: 136,
      earned: 136,
      rawCore: 136,
      achieved: true,
      corePaid: 136,
    })
    d1.sql.exec(
      `CREATE TRIGGER chan_so BEFORE INSERT ON cnh_exp_grant_ledger
       BEGIN SELECT RAISE(ABORT, 'boom'); END;`,
    )
    let soLanBatch = 0
    let soLanSleep = 0
    const batchGoc = d1.env.DB.batch.bind(d1.env.DB)
    d1.env.DB.batch = (async (ds: any[]) => {
      soLanBatch++
      return batchGoc(ds)
    }) as typeof d1.env.DB.batch

    await expect(
      quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r1'), {
        sleep: async () => {
          soLanSleep++
        },
      }),
    ).rejects.toThrow(/boom/)
    // Unexpected SQL failure propagates immediately: exactly ONE batch, NO retry sleeps.
    expect(soLanBatch).toBe(1)
    expect(soLanSleep).toBe(0)
    // Nothing committed.
    expect((d1.sql.prepare('SELECT COUNT(*) n FROM cnh_exp_command').get() as any).n).toBe(0)
    expect((d1.sql.prepare('SELECT COUNT(*) n FROM cnh_exp_guard').get() as any).n).toBe(0)
    expect(
      (d1.sql
        .prepare('SELECT wallet_exp FROM cnh_exp_account WHERE student_id = ?')
        .get(studentId) as any).wallet_exp,
    ).toBe(136)
    expect(
      (d1.sql
        .prepare('SELECT core_paid FROM cnh_exp_day WHERE student_id = ?')
        .get(studentId) as any).core_paid,
    ).toBe(136)

    d1.sql.exec('DROP TRIGGER chan_so')
    const kq = await quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r1'))
    expect(kq.grant).toBe(84)
  })

  it('UPDATE bị RAISE(IGNORE) ⇒ guard rollback, không false success', async () => {
    const d1 = taoD1That()
    const studentId = gieo(d1, {
      wallet: 136,
      earned: 136,
      rawCore: 136,
      achieved: true,
      corePaid: 136,
    })
    // Silently ignore the account update: the claim commits but the account row is not applied.
    d1.sql.exec(
      `CREATE TRIGGER bo_qua BEFORE UPDATE ON cnh_exp_account
       BEGIN SELECT RAISE(IGNORE); END;`,
    )
    let soLanBatch = 0
    let soLanSleep = 0
    const batchGoc = d1.env.DB.batch.bind(d1.env.DB)
    d1.env.DB.batch = (async (ds: any[]) => {
      soLanBatch++
      return batchGoc(ds)
    }) as typeof d1.env.DB.batch

    await expect(
      quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r1'), {
        sleep: async () => {
          soLanSleep++
        },
      }),
    ).rejects.toThrow()
    // The guard CHECK aborts the batch: ONE batch, NO retry sleeps, nothing committed.
    expect(soLanBatch).toBe(1)
    expect(soLanSleep).toBe(0)
    expect((d1.sql.prepare('SELECT COUNT(*) n FROM cnh_exp_command').get() as any).n).toBe(0)
    expect((d1.sql.prepare('SELECT COUNT(*) n FROM cnh_exp_guard').get() as any).n).toBe(0)
    expect(
      (d1.sql
        .prepare('SELECT wallet_exp FROM cnh_exp_account WHERE student_id = ?')
        .get(studentId) as any).wallet_exp,
    ).toBe(136)
  })

  // ── ROLLBACK FAULT MATRIX ────────────────────────────────────────────────────────────────────
  // Each fault makes ONE essential write a silent no-op (RAISE(IGNORE)) or a hard abort. In every
  // case the guard must roll the WHOLE batch back: exactly ONE batch, NO retry sleeps, and the
  // ENTIRE account/day state unchanged with commands/ledger/guards at 0. Synthetic SQLite only.
  const FAULTS: Array<{ ten: string; sql: string; drop: string }> = [
    {
      ten: 'account UPDATE bị IGNORE',
      sql: `CREATE TRIGGER fault BEFORE UPDATE ON cnh_exp_account BEGIN SELECT RAISE(IGNORE); END;`,
      drop: 'DROP TRIGGER fault',
    },
    {
      ten: 'day UPDATE bị IGNORE',
      sql: `CREATE TRIGGER fault BEFORE UPDATE ON cnh_exp_day BEGIN SELECT RAISE(IGNORE); END;`,
      drop: 'DROP TRIGGER fault',
    },
    {
      ten: 'ledger INSERT bị IGNORE',
      sql: `CREATE TRIGGER fault BEFORE INSERT ON cnh_exp_grant_ledger BEGIN SELECT RAISE(IGNORE); END;`,
      drop: 'DROP TRIGGER fault',
    },
  ]

  for (const f of FAULTS) {
    it(`rollback: ${f.ten} ⇒ một batch, không sleep, toàn bộ account/day không đổi`, async () => {
      const d1 = taoD1That()
      const studentId = gieo(d1, {
        wallet: 136,
        earned: 136,
        rawCore: 136,
        achieved: true,
        corePaid: 136,
      })
      d1.sql.exec(f.sql)
      let soLanBatch = 0
      let soLanSleep = 0
      const batchGoc = d1.env.DB.batch.bind(d1.env.DB)
      d1.env.DB.batch = (async (ds: any[]) => {
        soLanBatch++
        return batchGoc(ds)
      }) as typeof d1.env.DB.batch

      await expect(
        quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r1'), {
          sleep: async () => {
            soLanSleep++
          },
        }),
      ).rejects.toThrow()
      expect(soLanBatch).toBe(1)
      expect(soLanSleep).toBe(0)
      // ENTIRE account/day state unchanged.
      const tk = d1.sql
        .prepare('SELECT wallet_exp, earned_exp, revision FROM cnh_exp_account WHERE student_id = ?')
        .get(studentId) as any
      expect(tk.wallet_exp).toBe(136)
      expect(tk.earned_exp).toBe(136)
      expect(tk.revision).toBe(0)
      const ng = d1.sql
        .prepare('SELECT core_paid, revision FROM cnh_exp_day WHERE student_id = ?')
        .get(studentId) as any
      expect(ng.core_paid).toBe(136)
      expect(ng.revision).toBe(0)
      expect((d1.sql.prepare('SELECT COUNT(*) n FROM cnh_exp_command').get() as any).n).toBe(0)
      expect((d1.sql.prepare('SELECT COUNT(*) n FROM cnh_exp_grant_ledger').get() as any).n).toBe(0)
      expect((d1.sql.prepare('SELECT COUNT(*) n FROM cnh_exp_guard').get() as any).n).toBe(0)

      // Drop the fault and retry the SAME key: the reward is not lost, granted exactly once.
      d1.sql.exec(f.drop)
      const kq = await quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r1'))
      expect(kq.grant).toBe(84)
      expect(
        (d1.sql
          .prepare('SELECT wallet_exp FROM cnh_exp_account WHERE student_id = ?')
          .get(studentId) as any).wallet_exp,
      ).toBe(220)
      expect(
        (d1.sql
          .prepare('SELECT COUNT(*) n FROM cnh_exp_grant_ledger WHERE student_id = ? AND amount > 0')
          .get(studentId) as any).n,
      ).toBe(1)
    })
  }

  it('rollback: claim INSERT RAISE(ABORT) ⇒ một batch, không sleep, không ghi gì; retry cùng key trả 84', async () => {
    const d1 = taoD1That()
    const studentId = gieo(d1, {
      wallet: 136,
      earned: 136,
      rawCore: 136,
      achieved: true,
      corePaid: 136,
    })
    d1.sql.exec(
      `CREATE TRIGGER fault BEFORE INSERT ON cnh_exp_command BEGIN SELECT RAISE(ABORT, 'claim-boom'); END;`,
    )
    let soLanBatch = 0
    let soLanSleep = 0
    const batchGoc = d1.env.DB.batch.bind(d1.env.DB)
    d1.env.DB.batch = (async (ds: any[]) => {
      soLanBatch++
      return batchGoc(ds)
    }) as typeof d1.env.DB.batch

    await expect(
      quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r1'), {
        sleep: async () => {
          soLanSleep++
        },
      }),
    ).rejects.toThrow(/claim-boom/)
    expect(soLanBatch).toBe(1)
    expect(soLanSleep).toBe(0)
    expect((d1.sql.prepare('SELECT COUNT(*) n FROM cnh_exp_command').get() as any).n).toBe(0)
    expect((d1.sql.prepare('SELECT COUNT(*) n FROM cnh_exp_grant_ledger').get() as any).n).toBe(0)
    expect((d1.sql.prepare('SELECT COUNT(*) n FROM cnh_exp_guard').get() as any).n).toBe(0)
    expect(
      (d1.sql
        .prepare('SELECT wallet_exp FROM cnh_exp_account WHERE student_id = ?')
        .get(studentId) as any).wallet_exp,
    ).toBe(136)

    d1.sql.exec('DROP TRIGGER fault')
    const kq = await quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r1'))
    expect(kq.grant).toBe(84)
    expect(
      (d1.sql
        .prepare('SELECT wallet_exp FROM cnh_exp_account WHERE student_id = ?')
        .get(studentId) as any).wallet_exp,
    ).toBe(220)
  })

  it('rollback: post-state hỏng (wallet +1 sau UPDATE, revision giữ nguyên) ⇒ guard bắt lệch giá trị', async () => {
    const d1 = taoD1That()
    const studentId = gieo(d1, {
      wallet: 136,
      earned: 136,
      rawCore: 136,
      achieved: true,
      corePaid: 136,
    })
    // AFTER UPDATE: bump wallet by 1 while preserving the revision the guard expects. The guard's
    // exact-value check (wallet_exp = walletAfter) must FAIL ⇒ ok = 0 ⇒ CHECK(ok=1) aborts.
    d1.sql.exec(
      `CREATE TRIGGER lech_gia_tri AFTER UPDATE ON cnh_exp_account
       BEGIN UPDATE cnh_exp_account SET wallet_exp = wallet_exp + 1 WHERE student_id = NEW.student_id; END;`,
    )
    let soLanBatch = 0
    let soLanSleep = 0
    const batchGoc = d1.env.DB.batch.bind(d1.env.DB)
    d1.env.DB.batch = (async (ds: any[]) => {
      soLanBatch++
      return batchGoc(ds)
    }) as typeof d1.env.DB.batch

    await expect(
      quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r1'), {
        sleep: async () => {
          soLanSleep++
        },
      }),
    ).rejects.toThrow()
    expect(soLanBatch).toBe(1)
    expect(soLanSleep).toBe(0)
    expect((d1.sql.prepare('SELECT COUNT(*) n FROM cnh_exp_command').get() as any).n).toBe(0)
    expect((d1.sql.prepare('SELECT COUNT(*) n FROM cnh_exp_grant_ledger').get() as any).n).toBe(0)
    expect((d1.sql.prepare('SELECT COUNT(*) n FROM cnh_exp_guard').get() as any).n).toBe(0)
    expect(
      (d1.sql
        .prepare('SELECT wallet_exp FROM cnh_exp_account WHERE student_id = ?')
        .get(studentId) as any).wallet_exp,
    ).toBe(136)

    d1.sql.exec('DROP TRIGGER lech_gia_tri')
    const kq = await quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r1'))
    expect(kq.grant).toBe(84)
  })

  it('tràn số nguyên ⇒ fail closed, không ghi một phần', async () => {
    const d1 = taoD1That()
    const studentId = gieo(d1, {
      wallet: Number.MAX_SAFE_INTEGER,
      earned: Number.MAX_SAFE_INTEGER,
      rawCore: 136,
      achieved: true,
      corePaid: 136,
    })
    await expect(quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r1'))).rejects.toMatchObject({
      ma: 'CORRUPT_STATE',
    })
    expect((d1.sql.prepare('SELECT COUNT(*) n FROM cnh_exp_command').get() as any).n).toBe(0)
  })

  it('thiếu ngày/tài khoản ⇒ NOT_FOUND, không receipt thành công', async () => {
    const d1 = taoD1That()
    await expect(quyetToanQuyenCore(d1.env, yeuCau('em-khong-co', 'r1'))).rejects.toMatchObject({
      ma: 'NOT_FOUND',
    })
    expect((d1.sql.prepare('SELECT COUNT(*) n FROM cnh_exp_command').get() as any).n).toBe(0)
  })

  it('chọn phiên ĐỌC-GHI: dùng first-primary (KHÔNG first-unconstrained) khi runtime có session', async () => {
    const d1 = taoD1That()
    const studentId = gieo(d1, {
      wallet: 136,
      earned: 136,
      rawCore: 136,
      achieved: true,
      corePaid: 136,
    })
    const constraints: string[] = []
    const goc = d1.env.DB.withSession
    d1.env.DB.withSession = ((c?: string) => {
      constraints.push(String(c))
      return goc!.call(d1.env.DB, c)
    }) as typeof d1.env.DB.withSession

    await quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r1'))
    expect(constraints).toContain('first-primary')
    expect(constraints).not.toContain('first-unconstrained')
  })

  it('cột tiền là REAL (1.5) ⇒ CHECK typeof=integer chặn ngay ở SQL', () => {
    const d1 = taoD1That()
    expect(() =>
      d1.sql
        .prepare('INSERT INTO cnh_exp_account (student_id, wallet_exp) VALUES (?, ?)')
        .run('em-x', 1.5),
    ).toThrow()
    expect(() =>
      d1.sql
        .prepare(
          `INSERT INTO cnh_exp_day (student_id, learning_day, policy_version, raw_core)
           VALUES (?, ?, ?, ?)`,
        )
        .run('em-x', NGAY, PHIEN_BAN_CHINH_SACH, 1.5),
    ).toThrow()
  })

  it('achieved hỏng (không phải 0/1) ⇒ fail closed, không ghi command', async () => {
    const d1 = taoD1That()
    const studentId = gieo(d1, {
      wallet: 136,
      earned: 136,
      rawCore: 136,
      achieved: true,
      corePaid: 136,
    })
    // Synthetic corruption: bypass the CHECK to simulate a legacy/buggy row.
    d1.sql.exec('PRAGMA ignore_check_constraints = ON')
    d1.sql
      .prepare('UPDATE cnh_exp_day SET achieved = 2 WHERE student_id = ?')
      .run(studentId)
    d1.sql.exec('PRAGMA ignore_check_constraints = OFF')

    await expect(quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r1'))).rejects.toMatchObject({
      ma: 'CORRUPT_STATE',
    })
    expect((d1.sql.prepare('SELECT COUNT(*) n FROM cnh_exp_command').get() as any).n).toBe(0)
  })

  it('revision = MAX_SAFE_INTEGER ⇒ fail closed (revision+1 tràn), không ghi command', async () => {
    const d1 = taoD1That()
    const studentId = gieo(d1, {
      wallet: 136,
      earned: 136,
      rawCore: 136,
      achieved: true,
      corePaid: 136,
      accountRevision: Number.MAX_SAFE_INTEGER,
    })
    await expect(quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r1'))).rejects.toMatchObject({
      ma: 'CORRUPT_STATE',
    })
    expect((d1.sql.prepare('SELECT COUNT(*) n FROM cnh_exp_command').get() as any).n).toBe(0)
  })

  it('hai request ĐỒNG THỜI cùng key cùng hash ⇒ chỉ một lần trả, không double-pay', async () => {
    const d1 = taoD1That()
    const studentId = gieo(d1, {
      wallet: 136,
      earned: 136,
      rawCore: 136,
      achieved: true,
      corePaid: 136,
    })
    serialiseD1(d1.env)
    const [a, b] = await Promise.all([
      quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r1')),
      quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r1')),
    ])
    expect(a).toEqual(b)
    const so = d1.sql
      .prepare('SELECT COUNT(*) n FROM cnh_exp_grant_ledger WHERE student_id = ?')
      .get(studentId) as any
    expect(so.n).toBe(1)
    const tk = d1.sql
      .prepare('SELECT wallet_exp FROM cnh_exp_account WHERE student_id = ?')
      .get(studentId) as any
    expect(tk.wallet_exp).toBe(220)
  })

  it('hai request ĐỒNG THỜI cùng key KHÁC hash ⇒ một thắng, một IDEMPOTENCY_CONFLICT', async () => {
    const d1 = taoD1That()
    const studentId = gieo(d1, {
      wallet: 136,
      earned: 136,
      rawCore: 136,
      achieved: true,
      corePaid: 136,
    })
    serialiseD1(d1.env)
    const kq = await Promise.allSettled([
      quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r1', 'h1')),
      quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r1', 'h2')),
    ])
    const loi = kq.filter((r) => r.status === 'rejected') as PromiseRejectedResult[]
    expect(loi).toHaveLength(1)
    expect(loi[0].reason).toMatchObject({ ma: 'IDEMPOTENCY_CONFLICT' })
    const so = d1.sql
      .prepare('SELECT COUNT(*) n FROM cnh_exp_grant_ledger WHERE student_id = ?')
      .get(studentId) as any
    expect(so.n).toBe(1)
  })

  it('hai request ĐỒNG THỜI khác key cùng quyền ⇒ chỉ một lần trả', async () => {
    const d1 = taoD1That()
    const studentId = gieo(d1, {
      wallet: 136,
      earned: 136,
      rawCore: 136,
      achieved: true,
      corePaid: 136,
    })
    serialiseD1(d1.env)
    const [a, b] = await Promise.all([
      quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r1')),
      quyetToanQuyenCore(d1.env, yeuCau(studentId, 'r2')),
    ])
    const tong = a.grant + b.grant
    expect(tong).toBe(84)
    // Exactly ONE POSITIVE grant row; the zero-grant command still writes its own audit row
    // (amount 0), so we assert on the positive row and the SUM, not on the raw row count.
    const so = d1.sql
      .prepare('SELECT amount FROM cnh_exp_grant_ledger WHERE student_id = ?')
      .all(studentId) as any[]
    expect(so.filter((r) => r.amount > 0)).toHaveLength(1)
    expect(so.reduce((s, r) => s + r.amount, 0)).toBe(84)
    // Two distinct committed receipts, grants sorted [0, 84].
    const lenh = d1.sql
      .prepare('SELECT request_id, response_json FROM cnh_exp_command WHERE student_id = ? ORDER BY request_id')
      .all(studentId) as any[]
    expect(lenh).toHaveLength(2)
    expect(new Set(lenh.map((r) => r.request_id)).size).toBe(2)
    const grants = lenh.map((r) => JSON.parse(r.response_json).grant).sort((x, y) => x - y)
    expect(grants).toEqual([0, 84])
    const tk = d1.sql
      .prepare('SELECT wallet_exp, earned_exp FROM cnh_exp_account WHERE student_id = ?')
      .get(studentId) as any
    expect(tk.wallet_exp).toBe(220)
    expect(tk.earned_exp).toBe(220)
    const ng = d1.sql
      .prepare('SELECT core_paid FROM cnh_exp_day WHERE student_id = ?')
      .get(studentId) as any
    expect(ng.core_paid).toBe(220)
  })
})
