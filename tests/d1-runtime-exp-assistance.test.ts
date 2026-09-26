// P07 assistance local workerd D1 transactional coverage.
// Local D1 runtime coverage for the P07 authoritative assistance command.
// CNH-1.0 P07 — BẰNG CHỨNG GIAO DỊCH LỆNH TRỢ GIÚP TRÊN **RUNTIME D1 THẬT** (workerd qua
// `@cloudflare/vitest-pool-workers`), dữ liệu TỔNG HỢP, chạy CỤC BỘ.
//
// ⚠️ ĐÂY KHÔNG PHẢI PRODUCTION. Runtime workerd CỤC BỘ (Miniflare) với binding D1 cục bộ
// (`wrangler.d1-test.toml`), dữ liệu TỔNG HỢP, KHÔNG deploy, KHÔNG credential mạng, KHÔNG dữ
// liệu thật. Mọi lời gọi async chồng nhau chạy trong CÙNG một isolate ⇒ đây là bằng chứng về
// NGỮ NGHĨA GIAO DỊCH của D1 (CAS, UNIQUE, CHECK, batch nguyên tử), KHÔNG phải bằng chứng về
// mạng/thiết bị phân tán.
//
// Mục tiêu: chứng minh `ghiTroGiup` (server/src/cnh-exp-assistance.ts) hoạt động ĐÚNG trên D1
// THẬT — dùng `ghiTroGiup` THẬT, KHÔNG mock D1, KHÔNG tự viết lại SQL, KHÔNG bọc tuần tự.
//
// Chạy: `npm run test:d1` (config `vitest.config.d1.ts` + `wrangler.d1-test.toml`).
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
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
  docSuKienHocTap,
  ngayHocVN,
  PHIEN_BAN_CHINH_SACH,
} from '../server/src/cnh-exp-submit'
import type { D1PreparedStatement, Env } from '../server/src/kieu'

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
 * Tách một tệp SQL thành các CÂU LỆNH riêng (bỏ dòng chú thích `--`) — giống fixture runtime
 * hiện có. CHỈ dùng để nạp LƯỢC ĐỒ (không có trigger).
 */
function tachCau(sql: string): string[] {
  const sach = sql
    .replace(/\/\*[\s\S]*?\*\//g, '\n')
    .split('\n')
    .filter((l) => !/^\s*--/.test(l))
    .map((l) => l.replace(/\s--.*$/, ''))
    .join('\n')
  return sach
    .split(/;\s*(?:\n|$)/)
    .map((s) => s.trim())
    .filter((s) => /[A-Za-z]/.test(s))
}

/** Chọn CHỈ các migration P07 cần cho trợ giúp + nộp bài từ binding `LUOC_DO_SQL`. */
function chonMigration(ds: string[], dau: RegExp, ten: string): string {
  const hit = ds.filter((s) => dau.test(s))
  if (hit.length !== 1) {
    throw new Error(`cần ĐÚNG MỘT migration ${ten}, thấy ${hit.length}`)
  }
  return hit[0]
}

/** Nạp lược đồ P07 (sổ cái + nhiệm vụ + nộp bài/trợ giúp) vào D1 thật. Idempotent. */
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
  opts: { part?: 'I' | 'II' | 'III'; difficulty?: 0 | 1 | 2; issuedAt?: number; expiresAt?: number } = {},
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
    taskId: attemptId,
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
  opts: { wallet?: number; earned?: number; rawCore?: number; achieved?: 0 | 1; corePaid?: number } = {},
): Promise<void> {
  await DB.batch([
    DB.prepare(
      `INSERT INTO cnh_exp_account (student_id, wallet_exp, earned_exp, revision)
       VALUES (?, ?, ?, 0)`,
    ).bind(studentId, opts.wallet ?? 0, opts.earned ?? 0),
    DB.prepare(
      `INSERT INTO cnh_exp_day
         (student_id, learning_day, policy_version, raw_core, achieved, core_paid, compensation_paid, revision)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0)`,
    ).bind(
      studentId,
      learningDay,
      PHIEN_BAN_CHINH_SACH,
      opts.rawCore ?? 0,
      opts.achieved ?? 0,
      opts.corePaid ?? 0,
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
  await phatAnhChup(DB, anhChup(studentId, attemptId, contentGroup, opts), 900)
  await capDieuKhienNopBai(DB, {
    studentId,
    attemptId,
    assistance: opts.assistance ?? 'none',
    released: opts.released ?? true,
    active: opts.active ?? true,
  })
}

/** Ảnh chụp trạng thái tiền/ledger của MỘT student TỔNG HỢP. */
interface AnhTien {
  wallet: number
  earned: number
  accountRevision: number
  rawCore: number
  corePaid: number
  dayRevision: number
  ledgerCount: number
  ledgerSum: number
}

async function docTien(studentId: string, learningDay: string): Promise<AnhTien> {
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
    `SELECT COUNT(*) AS n, COALESCE(SUM(amount), 0) AS s
       FROM cnh_exp_grant_ledger WHERE student_id = ?`,
  )
    .bind(studentId)
    .first<{ n: number; s: number }>()
  return {
    wallet: Number(tk?.wallet_exp ?? -1),
    earned: Number(tk?.earned_exp ?? -1),
    accountRevision: Number(tk?.revision ?? -1),
    rawCore: Number(ng?.raw_core ?? -1),
    corePaid: Number(ng?.core_paid ?? -1),
    dayRevision: Number(ng?.revision ?? -1),
    ledgerCount: Number(so?.n ?? -1),
    ledgerSum: Number(so?.s ?? -1),
  }
}

/** Đọc điều khiển của một attempt. */
async function docDieuKhien(
  studentId: string,
  attemptId: string,
): Promise<{ assistance: string; revision: number } | null> {
  const r = await DB.prepare(
    `SELECT assistance, revision FROM cnh_exp_attempt_control
      WHERE student_id = ? AND attempt_id = ?`,
  )
    .bind(studentId, attemptId)
    .first<{ assistance: string; revision: number }>()
  return r ?? null
}

/** Đếm số hàng `cnh_exp_command` của MỘT student theo command_type. */
async function demLenh(studentId: string, commandType: string): Promise<number> {
  const r = await DB.prepare(
    `SELECT COUNT(*) AS n FROM cnh_exp_command WHERE student_id = ? AND command_type = ?`,
  )
    .bind(studentId, commandType)
    .first<{ n: number }>()
  return Number(r?.n ?? -1)
}

/** Đếm số hàng `cnh_exp_exposure_lock` của MỘT student. */
async function demKhoa(studentId: string): Promise<number> {
  const r = await DB.prepare(
    `SELECT COUNT(*) AS n FROM cnh_exp_exposure_lock WHERE student_id = ?`,
  )
    .bind(studentId)
    .first<{ n: number }>()
  return Number(r?.n ?? -1)
}

/** Đếm số hàng `cnh_exp_assistance_receipt` của MỘT student. */
async function demBienNhan(studentId: string): Promise<number> {
  const r = await DB.prepare(
    `SELECT COUNT(*) AS n FROM cnh_exp_assistance_receipt WHERE student_id = ?`,
  )
    .bind(studentId)
    .first<{ n: number }>()
  return Number(r?.n ?? -1)
}

/** Gọi trợ giúp THẬT (không mock D1, không bọc tuần tự). */
const troGiup = (
  studentId: string,
  attemptId: string,
  requestId: string,
  kind: LoaiTroGiup,
  receivedAt: number,
) => ghiTroGiup(ENV, { studentId, attemptId, requestId, kind, receivedAt })

/** Tạo trigger lỗi CHỈ áp cho MỘT student TỔNG HỢP; trả về tên trigger để DROP trong `finally`. */
async function taoTrigger(ten: string, sql: string): Promise<string> {
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

/**
 * Cài một bộ chặn lên `DB.withSession` để bọc phiên `first-primary` THẬT mà `ghiTroGiup` dùng.
 *
 * `ghiTroGiup` KHÔNG gọi `DB.batch` trực tiếp: nó gọi `env.DB.withSession('first-primary')` rồi
 * dùng `session.batch(...)`. Vì vậy monkeypatch `DB.batch` KHÔNG bao giờ chạy. Ta bọc
 * `withSession` để trả về một ĐỐI TƯỢNG UỶ NHIỆM quanh phiên thật: `prepare`/`batch` được
 * chuyển tiếp NGUYÊN VẸN (giữ giao dịch D1 thật), chỉ chèn một lần thay đổi điều khiển NGAY
 * TRƯỚC lời gọi batch đầu tiên.
 */
function chanPhienTroGiup(
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

describe('P07 assistance — lệnh trợ giúp trên RUNTIME D1 THẬT (workerd cục bộ, dữ liệu tổng hợp)', () => {
  beforeAll(async () => {
    await napLuocDo()
  })

  it('cùng request+hash, 8 lời gọi ĐỒNG THỜI ⇒ MỘT chuyển trạng thái, một khoá, một biên nhận', async () => {
    const sbd = sbdMoi()
    const att = attemptMoi()
    const ngay = ngayHocVN(1500)
    await gieoHocSinh(sbd, ngay)
    await gieoAttempt(sbd, att, 'CG-1', { assistance: 'none' })

    const reqId = `R-${maMoi()}`
    const ketQua = await Promise.all(
      Array.from({ length: 8 }, () => troGiup(sbd, att, reqId, 'hint', 1500)),
    )

    const dau = ketQua[0]
    for (const r of ketQua) expect(r).toEqual(dau)
    expect(dau.commandType).toBe(LENH_TRO_GIUP)
    expect(dau.assistance).toBe('assisted')
    expect(dau.controlRevision).toBe(1)

    const ctrl = await docDieuKhien(sbd, att)
    expect(ctrl?.assistance).toBe('assisted')
    expect(ctrl?.revision).toBe(1)
    expect(await demKhoa(sbd)).toBe(1)
    expect(await demBienNhan(sbd)).toBe(1)
    expect(await demLenh(sbd, LENH_TRO_GIUP)).toBe(1)
  }, 30_000)

  it('cùng request key nhưng payload KHÁC ⇒ IDEMPOTENCY_CONFLICT, không ghi thêm', async () => {
    const sbd = sbdMoi()
    const att = attemptMoi()
    const ngay = ngayHocVN(1500)
    await gieoHocSinh(sbd, ngay)
    await gieoAttempt(sbd, att, 'CG-1', { assistance: 'none' })

    const reqId = `R-${maMoi()}`
    const dau = await troGiup(sbd, att, reqId, 'hint', 1500)
    expect(dau.assistance).toBe('assisted')

    await expect(troGiup(sbd, att, reqId, 'reveal', 1500)).rejects.toMatchObject({
      ma: 'IDEMPOTENCY_CONFLICT',
    })

    expect(await demLenh(sbd, LENH_TRO_GIUP)).toBe(1)
    expect(await demKhoa(sbd)).toBe(1)
    expect(await demBienNhan(sbd)).toBe(1)
  }, 30_000)

  it('cùng hành động, request key KHÁC ĐỒNG THỜI ⇒ MỘT biên nhận ngữ nghĩa + bí danh bền vững', async () => {
    const sbd = sbdMoi()
    const att = attemptMoi()
    const ngay = ngayHocVN(1500)
    await gieoHocSinh(sbd, ngay)
    await gieoAttempt(sbd, att, 'CG-1', { assistance: 'none' })

    const [a, b, c] = await Promise.all([
      troGiup(sbd, att, `R-${maMoi()}-a`, 'hint', 1500),
      troGiup(sbd, att, `R-${maMoi()}-b`, 'hint', 1500),
      troGiup(sbd, att, `R-${maMoi()}-c`, 'hint', 1500),
    ])
    expect(a).toEqual(b)
    expect(b).toEqual(c)
    expect(a.controlRevision).toBe(1)

    // MỘT biên nhận ngữ nghĩa; BA lệnh (một gốc + hai bí danh) đều bền vững.
    expect(await demBienNhan(sbd)).toBe(1)
    expect(await demLenh(sbd, LENH_TRO_GIUP)).toBe(3)
    expect(await demKhoa(sbd)).toBe(1)

    const ctrl = await docDieuKhien(sbd, att)
    expect(ctrl?.assistance).toBe('assisted')
    expect(ctrl?.revision).toBe(1)
  }, 30_000)

  it('hint/reveal ĐỒNG THỜI ⇒ biên nhận đúng kind, MỘT chuyển assisted', async () => {
    const sbd = sbdMoi()
    const att = attemptMoi()
    const ngay = ngayHocVN(1500)
    await gieoHocSinh(sbd, ngay)
    await gieoAttempt(sbd, att, 'CG-1', { assistance: 'none' })

    const [hint, reveal] = await Promise.all([
      troGiup(sbd, att, `R-${maMoi()}-h`, 'hint', 1500),
      troGiup(sbd, att, `R-${maMoi()}-r`, 'reveal', 1500),
    ])
    expect(hint.kind).toBe('hint')
    expect(reveal.kind).toBe('reveal')
    expect(hint.assistance).toBe('assisted')
    expect(reveal.assistance).toBe('assisted')

    // HAI biên nhận ngữ nghĩa (hint + reveal là hai hành động khác nhau).
    expect(await demBienNhan(sbd)).toBe(2)
    expect(await demKhoa(sbd)).toBe(1)
    const ctrl = await docDieuKhien(sbd, att)
    expect(ctrl?.assistance).toBe('assisted')
    // Chỉ MỘT lần bump revision (đã assisted thì không bump nữa).
    expect(ctrl?.revision).toBe(1)
  }, 30_000)

  it('anh em đã phát hành cùng nhóm bị hạ xuống assisted; anh em phát hành SAU thừa hưởng assisted', async () => {
    const sbd = sbdMoi()
    const ngay = ngayHocVN(1500)
    await gieoHocSinh(sbd, ngay)
    const a1 = attemptMoi()
    const a2 = attemptMoi()
    await gieoAttempt(sbd, a1, 'CG-SHARED', { assistance: 'none' })
    await gieoAttempt(sbd, a2, 'CG-SHARED', { assistance: 'none' })

    const truoc1 = await docDieuKhien(sbd, a1)
    const truoc2 = await docDieuKhien(sbd, a2)
    expect(truoc1?.assistance).toBe('none')
    expect(truoc2?.assistance).toBe('none')

    await troGiup(sbd, a1, `R-${maMoi()}`, 'hint', 1500)

    const sau1 = await docDieuKhien(sbd, a1)
    const sau2 = await docDieuKhien(sbd, a2)
    expect(sau1?.assistance).toBe('assisted')
    expect(sau2?.assistance).toBe('assisted')
    expect(sau1?.revision).toBe(1)
    expect(sau2?.revision).toBe(1)

    // Anh em phát hành SAU khi khoá tồn tại ⇒ thừa hưởng assisted.
    const a3 = attemptMoi()
    await gieoAttempt(sbd, a3, 'CG-SHARED', { assistance: 'none' })
    const sau3 = await docDieuKhien(sbd, a3)
    expect(sau3?.assistance).toBe('assisted')
  }, 30_000)

  it('học sinh KHÁC hoặc nhóm KHÁC KHÔNG bị ảnh hưởng', async () => {
    const sbd1 = sbdMoi()
    const sbd2 = sbdMoi()
    const ngay = ngayHocVN(1500)
    await gieoHocSinh(sbd1, ngay)
    await gieoHocSinh(sbd2, ngay)
    const a1 = attemptMoi()
    const a2 = attemptMoi()
    const a3 = attemptMoi()
    await gieoAttempt(sbd1, a1, 'CG-1', { assistance: 'none' })
    await gieoAttempt(sbd1, a2, 'CG-2', { assistance: 'none' })
    await gieoAttempt(sbd2, a3, 'CG-1', { assistance: 'none' })

    await troGiup(sbd1, a1, `R-${maMoi()}`, 'hint', 1500)

    const c1 = await docDieuKhien(sbd1, a1)
    const c2 = await docDieuKhien(sbd1, a2)
    const c3 = await docDieuKhien(sbd2, a3)
    expect(c1?.assistance).toBe('assisted')
    expect(c2?.assistance).toBe('none')
    expect(c3?.assistance).toBe('none')
  }, 30_000)

  it('nộp bài tranh chấp với hint TRƯỚC batch ⇒ đọc lại, cấp assisted 2, lưu bằng chứng assisted', async () => {
    const sbd = sbdMoi()
    const att = attemptMoi()
    const ngay = ngayHocVN(1500)
    await gieoHocSinh(sbd, ngay)
    await gieoAttempt(sbd, att, 'CG-1', { assistance: 'none' })

    // Chèn MỘT lần ngay trước batch nộp bài đầu tiên: ghi trợ giúp THẬT (hint) làm tăng revision
    // điều khiển + tạo khoá phơi nhiễm. Nộp bài phải thua CAS và đọc lại trạng thái assisted.
    const chan = chanPhienTroGiup(async () => {
      await troGiup(sbd, att, `R-${maMoi()}`, 'hint', 1500)
    })

    let r: Awaited<ReturnType<typeof nopBaiCore>>
    try {
      r = await nopBaiCore(ENV, {
        studentId: sbd,
        attemptId: att,
        rawAnswer: 'C',
        requestId: `R-${maMoi()}`,
        receivedAt: 1500,
      })
    } finally {
      chan.khoiPhuc()
    }

    expect(chan.demChen()).toBe(1)
    expect(chan.demBatch()).toBeGreaterThanOrEqual(2)
    expect(r.raw).toBe(2)
    expect(r.walletAfter).toBe(2)

    const ev = await docSuKienHocTap(DB, sbd, att)
    expect(ev?.assistance).toBe('assisted')
    expect(ev?.correct).toBe(true)
  }, 30_000)

  it('hint commit TRƯỚC khi INSERT cấp điều khiển chạy (dù đã đọc ảnh chụp trước) ⇒ assisted', async () => {
    const sbd = sbdMoi()
    const att = attemptMoi()
    const sibling = attemptMoi()
    const ngay = ngayHocVN(1500)
    await gieoHocSinh(sbd, ngay)
    await gieoAttempt(sbd, sibling, 'CG-1', { assistance: 'none' })
    // Phát ảnh chụp TRƯỚC (không cấp điều khiển) — mô phỏng đọc ảnh chụp đã xảy ra.
    await phatAnhChup(DB, anhChup(sbd, att, 'CG-1'), 900)

    // Target has no control, so hint must be served on an existing sibling. Interleave the real
    // assistance command after target snapshot read, immediately before its real primary INSERT.
    const originalSession = DB.withSession!
    let injected = 0
    DB.withSession = constraint => {
      const session = originalSession.call(DB, constraint)
      return {
        batch: session.batch.bind(session),
        prepare: query => {
          const statement = session.prepare(query)
          if (!query.includes('INSERT INTO cnh_exp_attempt_control')) return statement
          const wrap = (st: D1PreparedStatement): D1PreparedStatement => ({
            bind: (...values) => wrap(st.bind(...values)),
            first: st.first.bind(st),
            all: st.all.bind(st),
            run: async <T>() => {
              if (injected === 0) {
                injected++
                expect(await docDieuKhien(sbd, att)).toBeNull()
                expect(await demKhoa(sbd)).toBe(0)
                await troGiup(sbd, sibling, `R-${maMoi()}`, 'hint', 1500)
                expect(await demKhoa(sbd)).toBe(1)
                expect(await docDieuKhien(sbd, att)).toBeNull()
              }
              return st.run<T>()
            },
          })
          return wrap(statement)
        },
      }
    }
    let cap
    try {
      cap = await capDieuKhienNopBai(DB, {
        studentId: sbd, attemptId: att, assistance: 'none', released: true, active: true,
      })
    } finally { DB.withSession = originalSession }
    expect(injected).toBe(1)
    expect(cap.assistance).toBe('assisted')
    expect(cap.created).toBe(true)

    const ctrl = await docDieuKhien(sbd, att)
    expect(ctrl?.assistance).toBe('assisted')
    expect(await demBienNhan(sbd)).toBe(1)
    const receipt = await nopBaiCore(ENV, {
      studentId: sbd, attemptId: att, rawAnswer: 'C', requestId: `R-${maMoi()}`, receivedAt: 1500,
    })
    expect(receipt.raw).toBe(2)
    expect((await docSuKienHocTap(DB, sbd, att))?.assistance).toBe('assisted')
  }, 30_000)

  it('snapshot alone does not authorize assistance before control is provisioned', async () => {
    const sbd = sbdMoi(), att = attemptMoi()
    await phatAnhChup(DB, anhChup(sbd, att, 'CG-1'), 900)
    await expect(troGiup(sbd, att, `R-${maMoi()}`, 'hint', 1500)).rejects.toMatchObject({ ma: 'NOT_FOUND' })
    expect(await docDieuKhien(sbd, att)).toBeNull()
    expect(await demKhoa(sbd)).toBe(0)
    expect(await demBienNhan(sbd)).toBe(0)
    expect(await demLenh(sbd, LENH_TRO_GIUP)).toBe(0)
  }, 30_000)

  it('lỗi tiêm SAU khi ghi biên nhận/điều khiển/khoá ⇒ rollback toàn bộ, rồi thử lại CÙNG key thành công', async () => {
    const sbd = sbdMoi()
    const att = attemptMoi()
    const ngay = ngayHocVN(1500)
    await gieoHocSinh(sbd, ngay)
    await gieoAttempt(sbd, att, 'CG-1', { assistance: 'none' })

    const truoc = {
      ctrl: await docDieuKhien(sbd, att),
      khoa: await demKhoa(sbd),
      bienNhan: await demBienNhan(sbd),
      lenh: await demLenh(sbd, LENH_TRO_GIUP),
    }
    expect(truoc.ctrl?.assistance).toBe('none')
    expect(truoc.ctrl?.revision).toBe(0)

    // Trigger AFTER INSERT trên bảng biên nhận: chạy SAU khi biên nhận/điều khiển/khoá đã ghi
    // trong batch, làm guard bất biến vỡ ⇒ CHECK(ok=1) abort toàn bộ batch.
    const ten = `trg_${maMoi().replace(/[^A-Za-z0-9]/g, '')}`
    await taoTrigger(
      ten,
      `CREATE TRIGGER ${ten} AFTER INSERT ON cnh_exp_assistance_receipt
         WHEN NEW.student_id = '${sbd}'
       BEGIN
         UPDATE cnh_exp_attempt_control SET revision = revision + 5
           WHERE student_id = NEW.student_id AND attempt_id = '${att}';
       END`,
    )
    triggerDaTao.push(ten)

    const reqId = `R-${maMoi()}`
    await expect(troGiup(sbd, att, reqId, 'hint', 1500)).rejects.toThrow()

    // Rollback nguyên tử: ảnh trạng thái SAU khớp HOÀN TOÀN ảnh TRƯỚC.
    const sau = {
      ctrl: await docDieuKhien(sbd, att),
      khoa: await demKhoa(sbd),
      bienNhan: await demBienNhan(sbd),
      lenh: await demLenh(sbd, LENH_TRO_GIUP),
    }
    expect(sau).toEqual(truoc)

    // Gỡ trigger rồi thử lại CÙNG request_id ⇒ thành công, MỘT chuyển trạng thái.
    await goTrigger(ten)
    const lai = await troGiup(sbd, att, reqId, 'hint', 1500)
    expect(lai.assistance).toBe('assisted')
    expect(lai.controlRevision).toBe(1)

    const cuoi = await docDieuKhien(sbd, att)
    expect(cuoi?.assistance).toBe('assisted')
    expect(cuoi?.revision).toBe(1)
    expect(await demKhoa(sbd)).toBe(1)
    expect(await demBienNhan(sbd)).toBe(1)
    expect(await demLenh(sbd, LENH_TRO_GIUP)).toBe(1)
  }, 30_000)

  it('tràn revision anh em ⇒ lỗi nguyên tử, không ghi gì', async () => {
    const sbd = sbdMoi()
    const ngay = ngayHocVN(1500)
    await gieoHocSinh(sbd, ngay)
    const a1 = attemptMoi()
    const a2 = attemptMoi()
    await gieoAttempt(sbd, a1, 'CG-SHARED', { assistance: 'none' })
    await gieoAttempt(sbd, a2, 'CG-SHARED', { assistance: 'none' })

    // Đẩy revision của anh em A2 lên trần số nguyên an toàn ⇒ UPDATE bump revision tràn CHECK.
    await DB.prepare(
      `UPDATE cnh_exp_attempt_control SET revision = 9007199254740991
        WHERE student_id = ? AND attempt_id = ?`,
    )
      .bind(sbd, a2)
      .run()

    const truoc = {
      ctrl1: await docDieuKhien(sbd, a1),
      ctrl2: await docDieuKhien(sbd, a2),
      khoa: await demKhoa(sbd),
      bienNhan: await demBienNhan(sbd),
      lenh: await demLenh(sbd, LENH_TRO_GIUP),
    }

    await expect(troGiup(sbd, a1, `R-${maMoi()}`, 'hint', 1500)).rejects.toThrow()

    const sau = {
      ctrl1: await docDieuKhien(sbd, a1),
      ctrl2: await docDieuKhien(sbd, a2),
      khoa: await demKhoa(sbd),
      bienNhan: await demBienNhan(sbd),
      lenh: await demLenh(sbd, LENH_TRO_GIUP),
    }
    expect(sau).toEqual(truoc)
    expect(sau.ctrl1?.assistance).toBe('none')
    expect(sau.ctrl2?.assistance).toBe('none')
  }, 30_000)

  it('lệnh trợ giúp KHÔNG đụng ví/ngày/ledger', async () => {
    const sbd = sbdMoi()
    const att = attemptMoi()
    const ngay = ngayHocVN(1500)
    await gieoHocSinh(sbd, ngay, { wallet: 7, earned: 7, rawCore: 5, corePaid: 5 })
    await gieoAttempt(sbd, att, 'CG-1', { assistance: 'none' })

    const truoc = await docTien(sbd, ngay)
    expect(truoc.wallet).toBe(7)
    expect(truoc.rawCore).toBe(5)

    await troGiup(sbd, att, `R-${maMoi()}`, 'hint', 1500)

    const sau = await docTien(sbd, ngay)
    expect(sau).toEqual(truoc)
    expect(sau.ledgerCount).toBe(0)
    expect(sau.wallet).toBe(7)
    expect(sau.corePaid).toBe(5)
  }, 30_000)

  it('băm yêu cầu trợ giúp: cùng attempt+kind ⇒ cùng hash; khác kind ⇒ khác hash', async () => {
    const h1 = await bamYeuCauTroGiup('A1', 'hint')
    const h2 = await bamYeuCauTroGiup('A1', 'hint')
    const h3 = await bamYeuCauTroGiup('A1', 'reveal')
    expect(h1).toBe(h2)
    expect(h1).not.toBe(h3)
  })
})
