// Local D1 runtime coverage for released CORE submit.
// CNH-1.0 P07 — BẰNG CHỨNG GIAO DỊCH NỘP BÀI CORE TRÊN **RUNTIME D1 THẬT** (workerd qua
// `@cloudflare/vitest-pool-workers`), dữ liệu TỔNG HỢP, chạy CỤC BỘ.
//
// ⚠️ ĐÂY KHÔNG PHẢI PRODUCTION. Đây là runtime workerd CỤC BỘ (Miniflare) với binding D1 cục bộ
// (`wrangler.d1-test.toml`), dữ liệu TỔNG HỢP, KHÔNG deploy, KHÔNG kết nối tài khoản Cloudflare,
// KHÔNG dùng credential mạng, KHÔNG dữ liệu thật. Nó cũng KHÔNG mô phỏng "hai thiết bị vật lý":
// mọi lời gọi async chồng nhau chạy trong CÙNG một isolate ⇒ đây là bằng chứng về NGỮ NGHĨA GIAO DỊCH
// của D1 (CAS, UNIQUE, CHECK, batch nguyên tử), KHÔNG phải bằng chứng về mạng/thiết bị phân tán.
//
// Mục tiêu: chứng minh `nopBaiCore` (server/src/cnh-exp-submit.ts) hoạt động ĐÚNG trên D1 THẬT —
// dùng `nopBaiCore` THẬT, KHÔNG mock D1, KHÔNG tự viết lại SQL, KHÔNG bọc tuần tự.
//
// Chạy: `npm run test:d1` (config `vitest.config.d1.ts` + `wrangler.d1-test.toml`).
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { phatAnhChup, type AnhChupNhiemVu } from '../server/src/cnh-exp-task'
import {
  LENH_NOP_BAI_CORE,
  PHIEN_BAN_CHINH_SACH,
  nopBaiCore,
  capDieuKhienNopBai,
  docSuKienHocTap,
  ngayHocVN,
  type PhanHoiNopBaiCore,
} from '../server/src/cnh-exp-submit'
import type { Env } from '../server/src/kieu'

const ENV = env as unknown as Env
const DB = ENV.DB

/** Bộ đếm tên duy nhất cho mỗi test (sinh student_id + trigger name TỔNG HỢP, không đụng nhau). */
let dem = 0
const maMoi = (): string => `T${Date.now().toString(36)}-${(dem++).toString(36)}`

/** student_id TỔNG HỢP, duy nhất cho từng test ⇒ không xoá dữ liệu dùng chung, không đụng test khác. */
const sbdMoi = (): string => `S-${maMoi()}`

/** attempt_id TỔNG HỢP, duy nhất cho từng test. */
const attemptMoi = (): string => `A-${maMoi()}`

/**
 * Tách một tệp SQL thành các CÂU LỆNH riêng (bỏ dòng chú thích `--`) — giống fixture runtime hiện có.
 * LƯU Ý: hàm này CHỈ dùng để nạp LƯỢC ĐỒ (không có trigger). Trigger được chạy RIÊNG bằng một
 * `prepare` cho TOÀN BỘ câu lệnh (xem `taoTrigger`), KHÔNG tách `BEGIN`/`END`.
 */
function tachCau(sql: string): string[] {
  const sach = sql
    .replace(/\/\*[\s\S]*?\*\//g, '\n') // khối chú thích
    .split('\n')
    .filter((l) => !/^\s*--/.test(l)) // dòng chú thích
    .map((l) => l.replace(/\s--.*$/, '')) // chú thích cuối dòng
    .join('\n')
  return sach
    .split(/;\s*(?:\n|$)/)
    .map((s) => s.trim())
    .filter((s) => /[A-Za-z]/.test(s)) // bỏ mảnh rỗng/chỉ còn khoảng trắng
}

/**
 * Chọn CHỈ các migration P07 cần cho nộp bài từ binding `LUOC_DO_SQL` (binding chứa MỌI migration
 * của repo). Dấu hiệu phân biệt:
 *   * sổ cái: `CREATE TABLE IF NOT EXISTS cnh_exp_account`
 *   * nhiệm vụ: `CREATE TABLE IF NOT EXISTS cnh_exp_task`
 *   * nộp bài: `CREATE TABLE IF NOT EXISTS cnh_exp_attempt_control`
 * KHÔNG nạp migration khác.
 */
function chonMigration(ds: string[], dau: RegExp, ten: string): string {
  const hit = ds.filter((s) => dau.test(s))
  if (hit.length !== 1) {
    throw new Error(`cần ĐÚNG MỘT migration ${ten}, thấy ${hit.length}`)
  }
  return hit[0]
}

/** Nạp lược đồ P07 (sổ cái + nhiệm vụ + nộp bài) vào D1 thật. Idempotent nhờ IF NOT EXISTS. */
async function napLuocDo(): Promise<void> {
  const ds = (env as unknown as { LUOC_DO_SQL: string[] }).LUOC_DO_SQL
  const soCai = chonMigration(ds, /CREATE TABLE IF NOT EXISTS\s+cnh_exp_account/i, 'cnh_exp_account')
  const nhiemVu = chonMigration(ds, /CREATE TABLE IF NOT EXISTS\s+cnh_exp_task/i, 'cnh_exp_task')
  const nopBai = chonMigration(
    ds,
    /CREATE TABLE IF NOT EXISTS\s+cnh_exp_attempt_control/i,
    'cnh_exp_attempt_control',
  )
  for (const sql of [soCai, nhiemVu, nopBai]) {
    const cau = tachCau(sql)
    for (let i = 0; i < cau.length; i += 50) {
      await DB.batch(cau.slice(i, i + 50).map((c) => DB.prepare(c)))
    }
  }
}

/** Ảnh chụp TỔNG HỢP hợp lệ cho một (student, attempt, contentGroup). */
function anhChup(
  studentId: string,
  attemptId: string,
  contentGroup: string,
  opts: { taskId?: string; part?: 'I' | 'II' | 'III'; difficulty?: 0 | 1 | 2; issuedAt?: number; expiresAt?: number } = {},
): AnhChupNhiemVu {
  const part = opts.part ?? 'I'
  const material =
    part === 'II'
      ? {
          key: [
            { id: 'a', correct: true, skillIds: ['SK1'] },
            { id: 'b', correct: false, skillIds: ['SK1'] },
            { id: 'c', correct: true, skillIds: ['SK2'] },
            { id: 'd', correct: false, skillIds: ['SK2'] },
          ],
          orderMapping: { '1': 'a', '2': 'b', '3': 'c', '4': 'd' },
          gradingPolicy: { kind: 'part-ii-subitems-v1' },
        }
      : {
          key: 'C',
          orderMapping: { A: 'A', B: 'B', C: 'C', D: 'D' },
          gradingPolicy: { kind: 'part-i-option-id-v1' },
        }
  return {
    taskId: opts.taskId ?? attemptId,
    attemptId,
    studentId,
    qid: `Q-${attemptId}`,
    questionVersion: 'v1',
    contentGroup,
    familyId: null,
    skillIds: ['SK1'],
    difficulty: opts.difficulty ?? 1,
    part,
    purpose: 'maintenance',
    bucket: 'core',
    planId: 'P1',
    planRevision: 1,
    policy: {
      version: 'CNH-1.0',
      curriculumRevision: 1,
      bankRevision: 1,
      protectionRevision: 1,
      learnerRevision: 1,
    },
    issuedAt: opts.issuedAt ?? 1000,
    expiresAt: opts.expiresAt ?? 10_000_000_000,
    expectedSeconds: 60,
    grading: material,
  }
}

/** Tạo một hàng tài khoản + hàng ngày TỔNG HỢP cho một student_id mới. */
async function gieoHocSinh(
  studentId: string,
  learningDay: string,
  opts: {
    wallet?: number
    earned?: number
    rawCore?: number
    achieved?: 0 | 1
    corePaid?: number
    compensationPaid?: number
  } = {},
): Promise<void> {
  await DB.batch([
    DB.prepare(
      `INSERT INTO cnh_exp_account (student_id, wallet_exp, earned_exp, revision)
       VALUES (?, ?, ?, 0)`,
    ).bind(studentId, opts.wallet ?? 0, opts.earned ?? 0),
    DB.prepare(
      `INSERT INTO cnh_exp_day
         (student_id, learning_day, policy_version, raw_core, achieved, core_paid, compensation_paid, revision)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    ).bind(
      studentId,
      learningDay,
      PHIEN_BAN_CHINH_SACH,
      opts.rawCore ?? 0,
      opts.achieved ?? 0,
      opts.corePaid ?? 0,
      opts.compensationPaid ?? 0,
    ),
  ])
}

/** Phát ảnh chụp + cấp điều khiển cho MỘT attempt TỔNG HỢP. */
async function gieoAttempt(
  studentId: string,
  attemptId: string,
  contentGroup: string,
  opts: {
    part?: 'I' | 'II' | 'III'
    difficulty?: 0 | 1 | 2
    assistance?: 'none' | 'assisted' | 'unknown'
    released?: boolean
    active?: boolean
    issuedAt?: number
    expiresAt?: number
  } = {},
): Promise<void> {
  await phatAnhChup(
    DB,
    anhChup(studentId, attemptId, contentGroup, opts),
    900,
  )
  await capDieuKhienNopBai(DB, {
    studentId,
    attemptId,
    assistance: opts.assistance ?? 'none',
    released: opts.released ?? true,
    active: opts.active ?? true,
  })
}

/** Ảnh chụp TOÀN BỘ trạng thái của MỘT student TỔNG HỢP (dùng để so sánh trước/sau). */
interface AnhTrangThai {
  wallet: number
  earned: number
  accountRevision: number
  rawCore: number
  corePaid: number
  dayRevision: number
  ledgerCount: number
  ledgerSum: number
  ledgerPositiveCount: number
  receiptCount: number
  acceptedCount: number
  lockCount: number
  guardCount: number
}

/**
 * Đọc trạng thái ví/ngày/ledger/receipt/accepted/lock/guard của MỘT student TỔNG HỢP.
 *
 * `guardCount` đếm số hàng `cnh_exp_submit_guard` thuộc các `execution_id` của student này (join
 * qua `cnh_exp_command`), vì bảng guard không có cột student_id. Mọi test dùng student_id TỔNG HỢP
 * riêng nên phép join này cô lập đúng phạm vi.
 */
async function docTrangThai(studentId: string, learningDay: string): Promise<AnhTrangThai> {
  const tk = await DB.prepare(
    'SELECT wallet_exp, earned_exp, revision FROM cnh_exp_account WHERE student_id = ?',
  )
    .bind(studentId)
    .first<{ wallet_exp: number; earned_exp: number; revision: number }>()
  const ng = await DB.prepare(
    `SELECT raw_core, core_paid, revision FROM cnh_exp_day
      WHERE student_id = ? AND learning_day = ? AND policy_version = ?`,
  )
    .bind(studentId, learningDay, PHIEN_BAN_CHINH_SACH)
    .first<{ raw_core: number; core_paid: number; revision: number }>()
  const so = await DB.prepare(
    `SELECT COUNT(*) AS n,
            COALESCE(SUM(amount), 0) AS s,
            COALESCE(SUM(CASE WHEN amount > 0 THEN 1 ELSE 0 END), 0) AS p
       FROM cnh_exp_grant_ledger WHERE student_id = ?`,
  )
    .bind(studentId)
    .first<{ n: number; s: number; p: number }>()
  const lenh = await DB.prepare(
    'SELECT COUNT(*) AS n FROM cnh_exp_command WHERE student_id = ?',
  )
    .bind(studentId)
    .first<{ n: number }>()
  const daNhan = await DB.prepare(
    'SELECT COUNT(*) AS n FROM cnh_exp_accepted WHERE student_id = ?',
  )
    .bind(studentId)
    .first<{ n: number }>()
  const khoa = await DB.prepare(
    'SELECT COUNT(*) AS n FROM cnh_exp_academic_lock WHERE student_id = ?',
  )
    .bind(studentId)
    .first<{ n: number }>()
  const guard = await DB.prepare(
    `SELECT COUNT(*) AS n FROM cnh_exp_submit_guard
      WHERE execution_id IN (SELECT execution_id FROM cnh_exp_command WHERE student_id = ?)`,
  )
    .bind(studentId)
    .first<{ n: number }>()
  return {
    wallet: Number(tk?.wallet_exp ?? -1),
    earned: Number(tk?.earned_exp ?? -1),
    accountRevision: Number(tk?.revision ?? -1),
    rawCore: Number(ng?.raw_core ?? -1),
    corePaid: Number(ng?.core_paid ?? -1),
    dayRevision: Number(ng?.revision ?? -1),
    ledgerCount: Number(so?.n ?? -1),
    ledgerSum: Number(so?.s ?? -1),
    ledgerPositiveCount: Number(so?.p ?? -1),
    receiptCount: Number(lenh?.n ?? -1),
    acceptedCount: Number(daNhan?.n ?? -1),
    lockCount: Number(khoa?.n ?? -1),
    guardCount: Number(guard?.n ?? -1),
  }
}

/** Tạo trigger lỗi CHỈ áp cho MỘT student TỔNG HỢP; trả về tên trigger để DROP trong `finally`. */
async function taoTrigger(ten: string, sql: string): Promise<string> {
  // MỘT `prepare` cho TOÀN BỘ câu lệnh (giữ nguyên BEGIN/END của trigger).
  await DB.prepare(sql).run()
  return ten
}

/** Gỡ một trigger đã tạo (idempotent) và bỏ khỏi danh sách dọn dẹp. */
async function goTrigger(ten: string): Promise<void> {
  await DB.prepare(`DROP TRIGGER IF EXISTS ${ten}`).run()
  const i = triggerDaTao.indexOf(ten)
  if (i >= 0) triggerDaTao.splice(i, 1)
}

const triggerDaTao: string[] = []
afterEach(async () => {
  while (triggerDaTao.length) {
    const ten = triggerDaTao.pop() as string
    await DB.prepare(`DROP TRIGGER IF EXISTS ${ten}`).run()
  }
})

/** Gọi nộp bài THẬT (không mock D1, không bọc tuần tự). */
const nop = (
  studentId: string,
  attemptId: string,
  rawAnswer: unknown,
  requestId: string,
  receivedAt: number,
): Promise<PhanHoiNopBaiCore> =>
  nopBaiCore(ENV, { studentId, attemptId, rawAnswer, requestId, receivedAt })

describe('P07 submit — nộp bài core trên RUNTIME D1 THẬT (workerd cục bộ, dữ liệu tổng hợp)', () => {
  beforeAll(async () => {
    await napLuocDo()
  })

  it.each(['12abc', 'sqrt(4)', '1/2'])('Code2: unsupported %s leaves all state intact; corrected same-key retry succeeds once', async (answer) => {
    const sbd = sbdMoi(), att = attemptMoi(), req = `R-${maMoi()}`
    const ngay = ngayHocVN(1500)
    await gieoHocSinh(sbd, ngay)
    const s: AnhChupNhiemVu = {
      ...anhChup(sbd, att, `CG-${att}`, { part: 'III' }),
      grading: { key: '0.5', orderMapping: {}, gradingPolicy: {
        kind: 'part-iii-policy-v1', policy: { policy: 'numeric-value-v1', policyVersion: 'CNH-1.0' },
      } },
    }
    await phatAnhChup(DB, s, 900)
    await capDieuKhienNopBai(DB, { studentId: sbd, attemptId: att, assistance: 'none', released: true, active: true })
    const before = await docTrangThai(sbd, ngay)
    await expect(nop(sbd, att, answer, req, 1500)).rejects.toMatchObject({ ma: 'ANSWER_UNSUPPORTED_FORMAT' })
    expect(await docTrangThai(sbd, ngay)).toEqual(before)
    expect(await docSuKienHocTap(DB, sbd, att)).toBeNull()
    const accepted = await nop(sbd, att, '0.50', req, 1600)
    expect(accepted).toMatchObject({ correct: true, raw: 6, walletAfter: 6 })
    expect(await nop(sbd, att, '0.50', req, 1700)).toEqual(accepted)
    expect(await docTrangThai(sbd, ngay)).toMatchObject({ acceptedCount: 1, ledgerCount: 1, receiptCount: 1, lockCount: 1, wallet: 6 })
  })

  it.each(['numeric-unit-v1', 'numeric-rounded-v1'])('Code2: missing %s metadata blocks grading without blaming input or writing', async (policy) => {
    const sbd = sbdMoi(), att = attemptMoi(), ngay = ngayHocVN(1500)
    await gieoHocSinh(sbd, ngay)
    await phatAnhChup(DB, {
      ...anhChup(sbd, att, `CG-${att}`, { part: 'III' }),
      grading: { key: '12', orderMapping: {}, gradingPolicy: {
        kind: 'part-iii-policy-v1', policy: { policy, policyVersion: 'CNH-1.0' },
      } },
    }, 900)
    await capDieuKhienNopBai(DB, { studentId: sbd, attemptId: att, assistance: 'none', released: true, active: true })
    const before = await docTrangThai(sbd, ngay)
    await expect(nop(sbd, att, '12', `R-${maMoi()}`, 1500)).rejects.toMatchObject({ ma: 'GRADING_FAILED' })
    expect(await docTrangThai(sbd, ngay)).toEqual(before)
    expect(await docSuKienHocTap(DB, sbd, att)).toBeNull()
  })

  for (const policy of [
    { policy: 'numeric-value-v1' },
    { policy: 'numeric-rounded-v1', decimals: 1 },
    { policy: 'numeric-unit-v1', requiredUnit: 'g' },
  ]) {
    it.each(['sqrt(4)', '12abc'])(`Code2 M02: ${policy.policy} invalid server key %s rejects equal and valid answers without consuming key`, async (key) => {
      const sbd = sbdMoi(), att = attemptMoi(), req = `R-${maMoi()}`, ngay = ngayHocVN(1500)
      await gieoHocSinh(sbd, ngay)
      await phatAnhChup(DB, {
        ...anhChup(sbd, att, `CG-${att}`, { part: 'III' }),
        grading: { key, orderMapping: {}, gradingPolicy: { kind: 'part-iii-policy-v1', policy: { ...policy, policyVersion: 'CNH-1.0' } } },
      }, 900)
      await capDieuKhienNopBai(DB, { studentId: sbd, attemptId: att, assistance: 'none', released: true, active: true })
      const before = await docTrangThai(sbd, ngay)
      for (const answer of ['2', key, '2']) {
        await expect(nop(sbd, att, answer, req, 1500)).rejects.toMatchObject({ ma: 'GRADING_FAILED' })
        expect(await docTrangThai(sbd, ngay)).toEqual(before)
        expect(await docSuKienHocTap(DB, sbd, att)).toBeNull()
      }
      // The invalid immutable snapshot is not overwritten; another correctly issued task
      // proves the failed requests did not bind the request key or award academic credit.
      const validAtt = attemptMoi()
      await gieoAttempt(sbd, validAtt, `CG-${validAtt}`)
      const result = await nop(sbd, validAtt, 'C', req, 1600)
      expect(result).toMatchObject({ correct: true, raw: 3, walletAfter: 3 })
      expect(await nop(sbd, validAtt, 'C', req, 1700)).toEqual(result)
      expect(await docTrangThai(sbd, ngay)).toMatchObject({ acceptedCount: 1, ledgerCount: 1, receiptCount: 1, lockCount: 1, wallet: 3 })
    })
  }

  it('Code2 M02: explicit literal policy still accepts a text key and pays once', async () => {
    const sbd = sbdMoi(), att = attemptMoi(), req = `R-${maMoi()}`, ngay = ngayHocVN(1500)
    await gieoHocSinh(sbd, ngay)
    await phatAnhChup(DB, {
      ...anhChup(sbd, att, `CG-${att}`, { part: 'III' }),
      grading: { key: 'sqrt(4)', orderMapping: {}, gradingPolicy: {
        kind: 'part-iii-policy-v1', policy: { policy: 'literal-v1', policyVersion: 'CNH-1.0' },
      } },
    }, 900)
    await capDieuKhienNopBai(DB, { studentId: sbd, attemptId: att, assistance: 'none', released: true, active: true })
    const result = await nop(sbd, att, 'sqrt(4)', req, 1500)
    expect(result).toMatchObject({ correct: true, raw: 6, walletAfter: 6 })
    expect(await nop(sbd, att, 'sqrt(4)', req, 1600)).toEqual(result)
    expect(await docTrangThai(sbd, ngay)).toMatchObject({ acceptedCount: 1, ledgerCount: 1, wallet: 6 })
  })

  it('cùng request+hash, 8 lời gọi ĐỒNG THỜI ⇒ cùng receipt đã lưu, ledger +1, ví/corePaid đúng', async () => {
    const sbd = sbdMoi()
    const att = attemptMoi()
    const ngay = ngayHocVN(1500)
    await gieoHocSinh(sbd, ngay, { rawCore: 0, achieved: 0 })
    await gieoAttempt(sbd, att, 'CG-1', { part: 'I', difficulty: 1 })

    const reqId = `R-${maMoi()}`
    const ketQua = await Promise.all(
      Array.from({ length: 8 }, () => nop(sbd, att, 'C', reqId, 1500)),
    )

    const dau = ketQua[0]
    for (const r of ketQua) expect(r).toEqual(dau)
    expect(dau.commandType).toBe(LENH_NOP_BAI_CORE)
    expect(dau.correct).toBe(true)
    expect(dau.raw).toBe(3)
    expect(dau.walletAfter).toBe(3)
    expect(dau.earnedAfter).toBe(3)
    expect(dau.corePaidAfter).toBe(3)
    expect(dau.committedRevision).toBe(1)

    const tt = await docTrangThai(sbd, ngay)
    expect(tt.ledgerCount).toBe(1)
    expect(tt.ledgerSum).toBe(3)
    expect(tt.wallet).toBe(3)
    expect(tt.earned).toBe(3)
    expect(tt.corePaid).toBe(3)
    expect(tt.receiptCount).toBe(1)
    expect(tt.acceptedCount).toBe(1)
    expect(tt.lockCount).toBe(1)
    expect(tt.guardCount).toBe(1)
  }, 30_000)

  it('request KHÁC NHAU cùng attempt+đáp án ĐỒNG THỜI ⇒ trả lại NGUYÊN receipt gốc, không nhân đôi', async () => {
    const sbd = sbdMoi()
    const att = attemptMoi()
    const ngay = ngayHocVN(1500)
    await gieoHocSinh(sbd, ngay, { rawCore: 0, achieved: 0 })
    await gieoAttempt(sbd, att, 'CG-1', { part: 'I', difficulty: 1 })

    const [a, b] = await Promise.all([
      nop(sbd, att, 'C', `R-${maMoi()}-a`, 1500),
      nop(sbd, att, 'C', `R-${maMoi()}-b`, 1500),
    ])
    expect(a).toEqual(b)
    expect(a.raw).toBe(3)
    expect(a.walletAfter).toBe(3)

    const tt = await docTrangThai(sbd, ngay)
    expect(tt.ledgerCount).toBe(1)
    expect(tt.ledgerSum).toBe(3)
    expect(tt.wallet).toBe(3)
    expect(tt.acceptedCount).toBe(1)
    expect(tt.lockCount).toBe(1)
    // Hai request key khác nhau ⇒ hai receipt (một gốc + một bí danh), KHÔNG cấp thêm tiền.
    expect(tt.receiptCount).toBe(2)
  }, 30_000)

  it('HAI attempt KHÁC NHAU cùng contentGroup ĐỒNG THỜI ⇒ chỉ MỘT lần được cộng raw', async () => {
    const sbd = sbdMoi()
    const att1 = attemptMoi()
    const att2 = attemptMoi()
    const ngay = ngayHocVN(1500)
    await gieoHocSinh(sbd, ngay, { rawCore: 0, achieved: 0 })
    await gieoAttempt(sbd, att1, 'CG-SHARED', { part: 'I', difficulty: 1 })
    await gieoAttempt(sbd, att2, 'CG-SHARED', { part: 'I', difficulty: 1 })

    const [a, b] = await Promise.all([
      nop(sbd, att1, 'C', `R-${maMoi()}-1`, 1500),
      nop(sbd, att2, 'C', `R-${maMoi()}-2`, 1500),
    ])
    const raws = [a.raw, b.raw].sort((x, y) => x - y)
    expect(raws).toEqual([0, 3])

    const tt = await docTrangThai(sbd, ngay)
    expect(tt.lockCount).toBe(1)
    expect(tt.acceptedCount).toBe(2)
    expect(tt.ledgerCount).toBe(2)
    expect(tt.ledgerSum).toBe(3)
    expect(tt.ledgerPositiveCount).toBe(1)
    expect(tt.wallet).toBe(3)
    expect(tt.corePaid).toBe(3)
  }, 30_000)

  it('cùng attempt nhưng đáp án KHÁC ⇒ ATTEMPT_ALREADY_SUBMITTED, không cấp thêm', async () => {
    const sbd = sbdMoi()
    const att = attemptMoi()
    const ngay = ngayHocVN(1500)
    await gieoHocSinh(sbd, ngay, { rawCore: 0, achieved: 0 })
    await gieoAttempt(sbd, att, 'CG-1', { part: 'I', difficulty: 1 })

    const dau = await nop(sbd, att, 'C', `R-${maMoi()}`, 1500)
    expect(dau.raw).toBe(3)

    await expect(nop(sbd, att, 'A', `R-${maMoi()}`, 1500)).rejects.toMatchObject({
      ma: 'ATTEMPT_ALREADY_SUBMITTED',
    })

    const tt = await docTrangThai(sbd, ngay)
    expect(tt.ledgerCount).toBe(1)
    expect(tt.ledgerSum).toBe(3)
    expect(tt.wallet).toBe(3)
    expect(tt.acceptedCount).toBe(1)
  }, 30_000)

  it('replay SAU khi ví/achieved ĐÃ ĐỔI ⇒ trả lại NGUYÊN kết quả gốc, không cấp thêm', async () => {
    const sbd = sbdMoi()
    const att = attemptMoi()
    const ngay = ngayHocVN(1500)
    await gieoHocSinh(sbd, ngay, { rawCore: 0, achieved: 0 })
    await gieoAttempt(sbd, att, 'CG-1', { part: 'I', difficulty: 1 })

    const goc = await nop(sbd, att, 'C', `R-${maMoi()}`, 1500)
    expect(goc.raw).toBe(3)
    expect(goc.grant).toBe(3)
    expect(goc.walletAfter).toBe(3)
    expect(goc.committedRevision).toBe(1)

    // Đổi trạng thái ngày/tài khoản NGOÀI luồng nộp bài (không quyết toán).
    await DB.prepare(
      `UPDATE cnh_exp_day SET achieved = 1, revision = revision + 1
        WHERE student_id = ? AND learning_day = ? AND policy_version = ?`,
    )
      .bind(sbd, ngay, PHIEN_BAN_CHINH_SACH)
      .run()
    await DB.prepare(
      `UPDATE cnh_exp_account SET wallet_exp = 220, earned_exp = 220, revision = revision + 1
        WHERE student_id = ?`,
    )
      .bind(sbd)
      .run()

    // Cùng attempt + request MỚI + cùng đáp án ⇒ NGUYÊN kết quả gốc, KHÔNG ghi thêm tiền.
    const lai = await nop(sbd, att, 'C', `R-${maMoi()}`, 1900)
    expect(lai).toEqual(goc)
    expect(lai.grant).toBe(3)
    expect(lai.walletAfter).toBe(3)
    expect(lai.committedRevision).toBe(1)

    const tt = await docTrangThai(sbd, ngay)
    expect(tt.ledgerCount).toBe(1)
    expect(tt.ledgerSum).toBe(3)
    expect(tt.acceptedCount).toBe(1)
  }, 30_000)

  // ── Ma trận lỗi tiêm (04 §5.6) ────────────────────────────────────────────────────────────────
  //
  // Mỗi ca: (a) chụp ảnh trạng thái TRƯỚC, (b) tiêm trigger lỗi CHỈ cho student này, (c) gọi nộp
  // bài với request_id/hash MỚI và kỳ vọng NÉM (SQL/CHECK lỗi lan truyền NGUYÊN VẸN — KHÔNG bị bọc
  // thành `LoiNopBai`), (d) so sánh ảnh trạng thái SAU khớp HOÀN TOÀN ảnh trước (rollback nguyên
  // tử), (e) gỡ trigger, (f) thử lại CÙNG request_id ⇒ cấp đúng số và ĐÚNG MỘT dòng ledger dương.
  //
  // LƯU Ý: các ca IGNORE làm guard `CHECK(ok = 1)` vỡ ⇒ D1 ném lỗi CHECK chung, KHÔNG phải
  // `LoiNopBai`. Đó là thiết kế (lỗi SQL bất ngờ phải lan truyền, không bị nuốt thành retry).
  interface CaLoi {
    ten: string
    /** SQL tạo trigger; `%TEN%` và `%SBD%` được thay thế. */
    sql: string
  }

  const MA_TRAN_LOI: CaLoi[] = [
    {
      ten: 'accepted INSERT bị IGNORE',
      sql: `CREATE TRIGGER %TEN% BEFORE INSERT ON cnh_exp_accepted
              WHEN NEW.student_id = '%SBD%'
            BEGIN SELECT RAISE(IGNORE); END`,
    },
    {
      ten: 'academic_lock INSERT bị IGNORE',
      sql: `CREATE TRIGGER %TEN% BEFORE INSERT ON cnh_exp_academic_lock
              WHEN NEW.student_id = '%SBD%'
            BEGIN SELECT RAISE(IGNORE); END`,
    },
    {
      ten: 'day UPDATE bị IGNORE',
      sql: `CREATE TRIGGER %TEN% BEFORE UPDATE ON cnh_exp_day
              WHEN NEW.student_id = '%SBD%'
            BEGIN SELECT RAISE(IGNORE); END`,
    },
    {
      ten: 'account UPDATE bị IGNORE',
      sql: `CREATE TRIGGER %TEN% BEFORE UPDATE ON cnh_exp_account
              WHEN NEW.student_id = '%SBD%'
            BEGIN SELECT RAISE(IGNORE); END`,
    },
    {
      ten: 'ledger INSERT bị IGNORE',
      sql: `CREATE TRIGGER %TEN% BEFORE INSERT ON cnh_exp_grant_ledger
              WHEN NEW.student_id = '%SBD%'
            BEGIN SELECT RAISE(IGNORE); END`,
    },
    {
      ten: 'ledger INSERT ABORT',
      sql: `CREATE TRIGGER %TEN% BEFORE INSERT ON cnh_exp_grant_ledger
              WHEN NEW.student_id = '%SBD%'
            BEGIN SELECT RAISE(ABORT, 'ledger abort'); END`,
    },
    {
      ten: 'claim INSERT ABORT',
      sql: `CREATE TRIGGER %TEN% BEFORE INSERT ON cnh_exp_command
              WHEN NEW.student_id = '%SBD%'
            BEGIN SELECT RAISE(ABORT, 'claim abort'); END`,
    },
    {
      ten: 'ví sau cập nhật bị +1 (giữ revision) ⇒ guard phát hiện',
      sql: `CREATE TRIGGER %TEN% AFTER UPDATE ON cnh_exp_account
              WHEN NEW.student_id = '%SBD%'
            BEGIN UPDATE cnh_exp_account SET wallet_exp = wallet_exp + 1 WHERE student_id = NEW.student_id; END`,
    },
    {
      ten: 'bằng chứng accepted bị sửa (answer_json) ⇒ guard bất biến phát hiện',
      sql: `CREATE TRIGGER %TEN% AFTER INSERT ON cnh_exp_accepted
              WHEN NEW.student_id = '%SBD%'
            BEGIN UPDATE cnh_exp_accepted SET answer_json = '"TAMPERED"' WHERE student_id = NEW.student_id AND attempt_id = NEW.attempt_id; END`,
    },
  ]

  for (const ca of MA_TRAN_LOI) {
    it(`lỗi tiêm: ${ca.ten} ⇒ rollback nguyên tử, rồi thử lại CÙNG request cấp đúng`, async () => {
      const sbd = sbdMoi()
      const att = attemptMoi()
      const ngay = ngayHocVN(1500)
      await gieoHocSinh(sbd, ngay, { rawCore: 0, achieved: 0 })
      await gieoAttempt(sbd, att, 'CG-1', { part: 'I', difficulty: 1 })
      const reqId = `R-${maMoi()}`

      const truoc = await docTrangThai(sbd, ngay)
      // Trạng thái đầu: ví/earned/corePaid 0, chưa có ledger/receipt/accepted/lock/guard.
      expect(truoc).toEqual({
        wallet: 0,
        earned: 0,
        accountRevision: 0,
        rawCore: 0,
        corePaid: 0,
        dayRevision: 0,
        ledgerCount: 0,
        ledgerSum: 0,
        ledgerPositiveCount: 0,
        receiptCount: 0,
        acceptedCount: 0,
        lockCount: 0,
        guardCount: 0,
      })

      const ten = `trg_${maMoi().replace(/[^A-Za-z0-9]/g, '')}`
      await taoTrigger(ten, ca.sql.replace(/%TEN%/g, ten).replace(/%SBD%/g, sbd))
      triggerDaTao.push(ten)

      // Lỗi SQL/CHECK lan truyền NGUYÊN VẸN (không bọc thành LoiNopBai).
      await expect(nop(sbd, att, 'C', reqId, 1500)).rejects.toThrow()

      // Rollback nguyên tử: ảnh trạng thái SAU khớp HOÀN TOÀN ảnh TRƯỚC.
      const sau = await docTrangThai(sbd, ngay)
      expect(sau).toEqual(truoc)

      // Gỡ trigger rồi thử lại CÙNG request_id ⇒ cấp 3, ĐÚNG MỘT dòng ledger dương.
      await goTrigger(ten)
      const lai = (await nop(sbd, att, 'C', reqId, 1500)) as PhanHoiNopBaiCore
      expect(lai.raw).toBe(3)
      expect(lai.walletAfter).toBe(3)
      expect(lai.earnedAfter).toBe(3)
      expect(lai.corePaidAfter).toBe(3)

      const cuoi = await docTrangThai(sbd, ngay)
      expect(cuoi.wallet).toBe(3)
      expect(cuoi.earned).toBe(3)
      expect(cuoi.corePaid).toBe(3)
      expect(cuoi.ledgerCount).toBe(1)
      expect(cuoi.ledgerSum).toBe(3)
      expect(cuoi.ledgerPositiveCount).toBe(1)
      expect(cuoi.receiptCount).toBe(1)
      expect(cuoi.acceptedCount).toBe(1)
      expect(cuoi.lockCount).toBe(1)
      expect(cuoi.guardCount).toBe(1)
    }, 30_000)
  }

  /**
   * Cài một bộ chặn lên `DB.withSession` để bọc phiên `first-primary` THẬT mà `nopBaiCore` dùng.
   *
   * `nopBaiCore` KHÔNG gọi `DB.batch` trực tiếp: nó gọi `env.DB.withSession('first-primary')` rồi
   * dùng `session.batch(...)`. Vì vậy monkeypatch `DB.batch` KHÔNG bao giờ chạy. Ta bọc
   * `withSession` để trả về một ĐỐI TƯỢNG UỶ NHIỆM quanh phiên thật: `prepare`/`batch` được
   * chuyển tiếp NGUYÊN VẸN (giữ giao dịch D1 thật), chỉ chèn một lần thay đổi điều khiển NGAY
   * TRƯỚC lời gọi batch nộp bài đầu tiên.
   *
   * Trả về `{ demBatch, demChen, khoiPhuc }`. `khoiPhuc` khôi phục `withSession` gốc (gọi trong
   * `finally`).
   */
  function chanPhienNopBai(
    truocBatch: () => Promise<void>,
  ): { demBatch: () => number; demChen: () => number; khoiPhuc: () => void } {
    const goc = DB.withSession.bind(DB)
    let demBatch = 0
    let demChen = 0
    DB.withSession = ((...args: unknown[]) => {
      const phien = (goc as (...a: unknown[]) => unknown)(...args) as {
        prepare: (...a: unknown[]) => unknown
        batch: (ds: unknown[]) => Promise<unknown>
      }
      const uyNhiem = {
        prepare: (...a: unknown[]) => phien.prepare(...a),
        batch: async (ds: unknown[]) => {
          demBatch++
          if (demChen === 0) {
            demChen++
            await truocBatch()
          }
          return phien.batch(ds)
        },
      }
      return uyNhiem
    }) as typeof DB.withSession
    return {
      demBatch: () => demBatch,
      demChen: () => demChen,
      khoiPhuc: () => {
        DB.withSession = goc as typeof DB.withSession
      },
    }
  }

  it('điều khiển đổi assistance TRƯỚC khi claim ⇒ CAS thua, đọc lại, KHÔNG giá độc lập đầy đủ', async () => {
    const sbd = sbdMoi()
    const att = attemptMoi()
    const ngay = ngayHocVN(1500)
    await gieoHocSinh(sbd, ngay, { rawCore: 0, achieved: 0 })
    await gieoAttempt(sbd, att, 'CG-1', { part: 'I', difficulty: 1, assistance: 'none' })

    // Mô phỏng thay đổi điều khiển ĐỒNG THỜI (hạ assistance) làm tăng revision SAU khi lệnh nộp
    // đã đọc điều khiển nhưng TRƯỚC khi batch của nó commit. Chèn ĐÚNG MỘT LẦN, ngay trước batch
    // nộp bài đầu tiên, qua phiên `first-primary` THẬT.
    const chan = chanPhienNopBai(async () => {
      await DB.prepare(
        `UPDATE cnh_exp_attempt_control SET assistance = 'assisted', revision = revision + 1
          WHERE student_id = ? AND attempt_id = ?`,
      )
        .bind(sbd, att)
        .run()
    })

    let r: PhanHoiNopBaiCore
    try {
      r = await nop(sbd, att, 'C', `R-${maMoi()}`, 1500)
    } finally {
      chan.khoiPhuc()
    }

    // Bộ chèn THỰC SỰ chạy đúng MỘT lần, và có ÍT NHẤT HAI lời gọi batch nộp bài (lần CAS thua +
    // lần thử lại thành công).
    expect(chan.demChen()).toBe(1)
    expect(chan.demBatch()).toBeGreaterThanOrEqual(2)

    // CAS thua ở lần đầu; lần thử lại đọc lại assistance đã hạ ⇒ raw 2 (KHÔNG phải 3).
    expect(r.raw).toBe(2)
    expect(r.walletAfter).toBe(2)

    const tt = await docTrangThai(sbd, ngay)
    expect(tt.acceptedCount).toBe(1)
    expect(tt.ledgerCount).toBe(1)
    expect(tt.ledgerSum).toBe(2)
    expect(tt.wallet).toBe(2)
  }, 30_000)

  it('điều khiển released=false TRƯỚC khi claim ⇒ NOT_RELEASED, KHÔNG ghi accepted/receipt/ledger/tiền', async () => {
    const sbd = sbdMoi()
    const att = attemptMoi()
    const ngay = ngayHocVN(1500)
    await gieoHocSinh(sbd, ngay, { rawCore: 0, achieved: 0 })
    await gieoAttempt(sbd, att, 'CG-1', { part: 'I', difficulty: 1, released: true })

    const truoc = await docTrangThai(sbd, ngay)

    // Thu hồi phát hành ĐỒNG THỜI ngay trước batch nộp bài đầu tiên.
    const chan = chanPhienNopBai(async () => {
      await DB.prepare(
        `UPDATE cnh_exp_attempt_control SET released = 0, revision = revision + 1
          WHERE student_id = ? AND attempt_id = ?`,
      )
        .bind(sbd, att)
        .run()
    })

    try {
      await expect(nop(sbd, att, 'C', `R-${maMoi()}`, 1500)).rejects.toMatchObject({
        ma: 'NOT_RELEASED',
      })
    } finally {
      chan.khoiPhuc()
    }

    expect(chan.demChen()).toBe(1)
    // `demBatch` đếm SỐ LẦN GỌI `batch`, KHÔNG phải số lần COMMIT. Batch nộp bài ĐẦU TIÊN vẫn được
    // gọi đúng MỘT lần (rồi thua CAS vì released đã đổi); lần thử lại đọc lại released=0 và ném
    // TRƯỚC khi gọi batch nào nữa. Vì vậy số lần gọi là 1, nhưng KHÔNG có gì được ghi.
    expect(chan.demBatch()).toBe(1)

    const sau = await docTrangThai(sbd, ngay)
    expect(sau).toEqual(truoc)
    expect(sau.acceptedCount).toBe(0)
    expect(sau.receiptCount).toBe(0)
    expect(sau.ledgerCount).toBe(0)
    expect(sau.wallet).toBe(0)
    expect(sau.corePaid).toBe(0)
  }, 30_000)

  it('điều khiển active=false TRƯỚC khi claim ⇒ NOT_ACTIVE, KHÔNG ghi accepted/receipt/ledger/tiền', async () => {
    const sbd = sbdMoi()
    const att = attemptMoi()
    const ngay = ngayHocVN(1500)
    await gieoHocSinh(sbd, ngay, { rawCore: 0, achieved: 0 })
    await gieoAttempt(sbd, att, 'CG-1', { part: 'I', difficulty: 1, active: true })

    const truoc = await docTrangThai(sbd, ngay)

    // Vô hiệu hoá attempt ĐỒNG THỜI ngay trước batch nộp bài đầu tiên.
    const chan = chanPhienNopBai(async () => {
      await DB.prepare(
        `UPDATE cnh_exp_attempt_control SET active = 0, revision = revision + 1
          WHERE student_id = ? AND attempt_id = ?`,
      )
        .bind(sbd, att)
        .run()
    })

    try {
      await expect(nop(sbd, att, 'C', `R-${maMoi()}`, 1500)).rejects.toMatchObject({
        ma: 'NOT_ACTIVE',
      })
    } finally {
      chan.khoiPhuc()
    }

    expect(chan.demChen()).toBe(1)
    // `demBatch` đếm SỐ LẦN GỌI `batch`, KHÔNG phải số lần COMMIT. Batch nộp bài ĐẦU TIÊN vẫn được
    // gọi đúng MỘT lần (rồi thua CAS vì active đã đổi); lần thử lại đọc lại active=0 và ném TRƯỚC
    // khi gọi batch nào nữa. Vì vậy số lần gọi là 1, nhưng KHÔNG có gì được ghi.
    expect(chan.demBatch()).toBe(1)

    const sau = await docTrangThai(sbd, ngay)
    expect(sau).toEqual(truoc)
    expect(sau.acceptedCount).toBe(0)
    expect(sau.receiptCount).toBe(0)
    expect(sau.ledgerCount).toBe(0)
    expect(sau.wallet).toBe(0)
    expect(sau.corePaid).toBe(0)
  }, 30_000)

  it('bằng chứng LearningEvent bất biến: Part II lưu đúng subitem + đáp án + assistance', async () => {
    const sbd = sbdMoi()
    const att = attemptMoi()
    const ngay = ngayHocVN(1500)
    await gieoHocSinh(sbd, ngay, { rawCore: 0, achieved: 0 })
    await gieoAttempt(sbd, att, 'CG-1', { part: 'II', difficulty: 1, assistance: 'assisted' })

    const r = await nop(sbd, att, { '1': true, '2': false, '3': true, '4': true }, `R-${maMoi()}`, 1500)
    expect(r.raw).toBe(2)

    const ev = await docSuKienHocTap(DB, sbd, att)
    expect(ev).not.toBeNull()
    expect(ev?.eventId).toBe(att)
    expect(ev?.source).toBe('submit_core')
    expect(ev?.answerPayload).toEqual({ '1': true, '2': false, '3': true, '4': true })
    expect(ev?.subitemResults).toEqual([
      { id: 'a', correct: true, skillIds: ['SK1'] },
      { id: 'b', correct: true, skillIds: ['SK1'] },
      { id: 'c', correct: true, skillIds: ['SK2'] },
      { id: 'd', correct: false, skillIds: ['SK2'] },
    ])
    expect(ev?.assistance).toBe('assisted')
    expect(ev?.visibility).toBe('released')
    expect(ev?.activeSeconds).toBeNull()
    expect(ev?.correctionOf).toBeNull()
    expect(ev?.policyVersion).toBe(PHIEN_BAN_CHINH_SACH)
  }, 30_000)

  it('replay KHÔNG ghi lại bằng chứng: hàng accepted giữ nguyên sau nhiều lần nộp', async () => {
    const sbd = sbdMoi()
    const att = attemptMoi()
    const ngay = ngayHocVN(1500)
    await gieoHocSinh(sbd, ngay, { rawCore: 0, achieved: 0 })
    await gieoAttempt(sbd, att, 'CG-1', { part: 'I', difficulty: 1 })

    const goc = await nop(sbd, att, 'C', `R-${maMoi()}`, 1500)
    const truoc = await docSuKienHocTap(DB, sbd, att)
    const lai = await nop(sbd, att, 'C', `R-${maMoi()}`, 1900)
    expect(lai).toEqual(goc)
    const sau = await docSuKienHocTap(DB, sbd, att)
    expect(sau).toEqual(truoc)

    const tt = await docTrangThai(sbd, ngay)
    expect(tt.acceptedCount).toBe(1)
    expect(tt.ledgerCount).toBe(1)
  }, 30_000)

  it('D1 runtime TỪ CHỐI giá trị phân số cho cột tiền (CHECK typeof = integer)', async () => {
    const sbd = sbdMoi()
    const ngay = ngayHocVN(1500)
    await gieoHocSinh(sbd, ngay, { rawCore: 0, achieved: 0 })
    const truoc = await docTrangThai(sbd, ngay)
    // Ghi thẳng một giá trị REAL vào cột tiền ⇒ CHECK(typeof(...) = 'integer') phải vỡ.
    await expect(
      DB.prepare('UPDATE cnh_exp_account SET wallet_exp = 1.5 WHERE student_id = ?')
        .bind(sbd)
        .run(),
    ).rejects.toThrow()
    const sau = await docTrangThai(sbd, ngay)
    expect(sau).toEqual(truoc)
    expect(sau.wallet).toBe(0)
  }, 30_000)
})
