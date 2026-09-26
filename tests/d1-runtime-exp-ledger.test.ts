// CNH-1.0 P07 — BẰNG CHỨNG GIAO DỊCH TRÊN **RUNTIME D1 THẬT** (workerd qua
// `@cloudflare/vitest-pool-workers`), dữ liệu TỔNG HỢP, chạy CỤC BỘ.
//
// ⚠️ ĐÂY KHÔNG PHẢI PRODUCTION. Đây là runtime workerd CỤC BỘ (Miniflare) với binding D1 cục bộ
// (`wrangler.d1-test.toml`), dữ liệu TỔNG HỢP, KHÔNG deploy, KHÔNG kết nối tài khoản Cloudflare,
// KHÔNG dùng credential mạng, KHÔNG dữ liệu thật. Nó cũng KHÔNG mô phỏng "hai thiết bị vật lý":
// mọi lời gọi async chồng nhau chạy trong CÙNG một isolate ⇒ đây là bằng chứng về NGỮ NGHĨA GIAO DỊCH
// của D1 (CAS, UNIQUE, CHECK, batch nguyên tử), KHÔNG phải bằng chứng về mạng/thiết bị phân tán.
//
// Mục tiêu: chứng minh `quyetToanQuyenCore` (server/src/cnh-exp-ledger.ts) hoạt động ĐÚNG trên D1
// THẬT — dùng `quyetToanQuyenCore` THẬT, KHÔNG mock D1, KHÔNG tự viết lại SQL, KHÔNG bọc tuần tự.
//
// Chạy: `npm run test:d1` (config `vitest.config.d1.ts` + `wrangler.d1-test.toml`).
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  LENH_QUYET_TOAN_CORE,
  PHIEN_BAN_CHINH_SACH,
  LoiQuyetToan,
  quyetToanQuyenCore,
  type PhanHoiQuyetToanCore,
} from '../server/src/cnh-exp-ledger'
import type { Env } from '../server/src/kieu'

const ENV = env as unknown as Env
const DB = ENV.DB
const NGAY = '2026-09-23'

/** Bộ đếm tên duy nhất cho mỗi test (sinh student_id + trigger name TỔNG HỢP, không đụng nhau). */
let dem = 0
const maMoi = (): string => `T${Date.now().toString(36)}-${(dem++).toString(36)}`

/** student_id TỔNG HỢP, duy nhất cho từng test ⇒ không xoá dữ liệu dùng chung, không đụng test khác. */
const sbdMoi = (): string => `S-${maMoi()}`

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
 * Chọn CHỈ migration của sổ cái P07 từ binding `LUOC_DO_SQL` (binding chứa MỌI migration của repo).
 * Dấu hiệu phân biệt: `CREATE TABLE IF NOT EXISTS cnh_exp_account`. KHÔNG nạp migration khác.
 */
function chonMigrationSoCai(ds: string[]): string {
  const hit = ds.filter((s) => /CREATE TABLE IF NOT EXISTS\s+cnh_exp_account/i.test(s))
  if (hit.length !== 1) {
    throw new Error(`cần ĐÚNG MỘT migration cnh_exp_account, thấy ${hit.length}`)
  }
  return hit[0]
}

/** Nạp lược đồ P07 (chỉ migration sổ cái) vào D1 thật. Idempotent nhờ IF NOT EXISTS. */
async function napLuocDo(): Promise<void> {
  const ds = (env as unknown as { LUOC_DO_SQL: string[] }).LUOC_DO_SQL
  const sql = chonMigrationSoCai(ds)
  const cau = tachCau(sql)
  for (let i = 0; i < cau.length; i += 50) {
    await DB.batch(cau.slice(i, i + 50).map((c) => DB.prepare(c)))
  }
}

/** Tạo một hàng tài khoản + hàng ngày TỔNG HỢP cho một student_id mới. */
async function gieo(
  studentId: string,
  opts: {
    wallet?: number
    earned?: number
    rawCore?: number
    achieved?: 0 | 1
    corePaid?: number
    compensationPaid?: number
  } = {},
): Promise<void> {
  const wallet = opts.wallet ?? 0
  const earned = opts.earned ?? 0
  const rawCore = opts.rawCore ?? 0
  const achieved = opts.achieved ?? 0
  const corePaid = opts.corePaid ?? 0
  const compensationPaid = opts.compensationPaid ?? 0
  await DB.batch([
    DB.prepare(
      `INSERT INTO cnh_exp_account (student_id, wallet_exp, earned_exp, revision)
       VALUES (?, ?, ?, 0)`,
    ).bind(studentId, wallet, earned),
    DB.prepare(
      `INSERT INTO cnh_exp_day
         (student_id, learning_day, policy_version, raw_core, achieved, core_paid, compensation_paid, revision)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    ).bind(studentId, NGAY, PHIEN_BAN_CHINH_SACH, rawCore, achieved, corePaid, compensationPaid),
  ])
}

/** Ảnh chụp TOÀN BỘ trạng thái của MỘT student TỔNG HỢP (dùng để so sánh trước/sau). */
interface AnhTrangThai {
  wallet: number
  earned: number
  accountRevision: number
  corePaid: number
  dayRevision: number
  ledgerCount: number
  ledgerSum: number
  ledgerPositiveCount: number
  receiptCount: number
  guardCount: number
}

/**
 * Đọc trạng thái ví/ngày/ledger/receipt/guard của MỘT student TỔNG HỢP.
 *
 * `guardCount` đếm số hàng `cnh_exp_guard` thuộc các `execution_id` của student này (join qua
 * `cnh_exp_command`), vì bảng guard không có cột student_id. Mọi test dùng student_id TỔNG HỢP
 * riêng nên phép join này cô lập đúng phạm vi.
 */
async function docTrangThai(studentId: string): Promise<AnhTrangThai> {
  const tk = await DB.prepare(
    'SELECT wallet_exp, earned_exp, revision FROM cnh_exp_account WHERE student_id = ?',
  )
    .bind(studentId)
    .first<{ wallet_exp: number; earned_exp: number; revision: number }>()
  const ng = await DB.prepare(
    `SELECT core_paid, revision FROM cnh_exp_day
      WHERE student_id = ? AND learning_day = ? AND policy_version = ?`,
  )
    .bind(studentId, NGAY, PHIEN_BAN_CHINH_SACH)
    .first<{ core_paid: number; revision: number }>()
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
  const guard = await DB.prepare(
    `SELECT COUNT(*) AS n FROM cnh_exp_guard
      WHERE execution_id IN (SELECT execution_id FROM cnh_exp_command WHERE student_id = ?)`,
  )
    .bind(studentId)
    .first<{ n: number }>()
  return {
    wallet: Number(tk?.wallet_exp ?? -1),
    earned: Number(tk?.earned_exp ?? -1),
    accountRevision: Number(tk?.revision ?? -1),
    corePaid: Number(ng?.core_paid ?? -1),
    dayRevision: Number(ng?.revision ?? -1),
    ledgerCount: Number(so?.n ?? -1),
    ledgerSum: Number(so?.s ?? -1),
    ledgerPositiveCount: Number(so?.p ?? -1),
    receiptCount: Number(lenh?.n ?? -1),
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

/** Gọi quyết toán THẬT (không mock D1, không bọc tuần tự). */
const quyetToan = (
  studentId: string,
  requestId: string,
  requestHash: string,
): Promise<PhanHoiQuyetToanCore> =>
  quyetToanQuyenCore(ENV, { studentId, learningDay: NGAY, requestHash, requestId })

describe('P07 — quyết toán quyền core trên RUNTIME D1 THẬT (workerd cục bộ, dữ liệu tổng hợp)', () => {
  beforeAll(async () => {
    await napLuocDo()
  })

  it('cùng request+hash, 8 lời gọi ĐỒNG THỜI ⇒ cùng receipt đã lưu, ledger +1, ví/corePaid đúng', async () => {
    const sbd = sbdMoi()
    await gieo(sbd, { rawCore: 190, achieved: 0 })
    const reqId = `R-${maMoi()}`
    const hash = 'H-same'

    const ketQua = await Promise.all(Array.from({ length: 8 }, () => quyetToan(sbd, reqId, hash)))

    // Mọi lời gọi trả về CÙNG một receipt (deep-equal), không có cờ `replayed`.
    const dau = ketQua[0]
    for (const r of ketQua) expect(r).toEqual(dau)
    expect(dau.commandType).toBe(LENH_QUYET_TOAN_CORE)
    expect(dau.entitlement).toBe(190)
    expect(dau.grant).toBe(190)
    expect(dau.walletAfter).toBe(190)
    expect(dau.earnedAfter).toBe(190)
    expect(dau.corePaidAfter).toBe(190)
    expect(dau.committedRevision).toBe(1)

    const tt = await docTrangThai(sbd)
    expect(tt.ledgerCount).toBe(1)
    expect(tt.ledgerSum).toBe(190)
    expect(tt.wallet).toBe(190)
    expect(tt.earned).toBe(190)
    expect(tt.corePaid).toBe(190)
    expect(tt.receiptCount).toBe(1)
  }, 30_000)

  it('8 request KHÁC NHAU ĐỒNG THỜI khi đã nhận 136 rồi đạt ⇒ tổng grant 84, ví/earned/corePaid 220', async () => {
    const sbd = sbdMoi()
    // Đã nhận 136 (studied), nay achieved ⇒ entitlement = 220 ⇒ grant = 220 - 136 = 84.
    // Lần đầu cấp 84; các lần sau grant 0 (đã trả đủ).
    await gieo(sbd, {
      rawCore: 136,
      achieved: 1,
      corePaid: 136,
      wallet: 136,
      earned: 136,
    })

    const ketQua = await Promise.all(
      Array.from({ length: 8 }, (_, i) => quyetToan(sbd, `R-${maMoi()}-${i}`, `H-${i}`)),
    )

    const tongGrant = ketQua.reduce((s, r) => s + r.grant, 0)
    expect(tongGrant).toBe(84)
    // Đúng MỘT lời gọi thực sự cấp tiền; các lời gọi khác grant 0.
    expect(ketQua.filter((r) => r.grant > 0).length).toBe(1)
    for (const r of ketQua) expect(r.entitlement).toBe(220)

    const tt = await docTrangThai(sbd)
    expect(tt.ledgerCount).toBe(8) // mỗi command thành công ghi MỘT dòng audit (kể cả amount 0)
    expect(tt.ledgerSum).toBe(84)
    expect(tt.ledgerPositiveCount).toBe(1) // đúng MỘT dòng ledger dương
    expect(tt.wallet).toBe(220)
    expect(tt.earned).toBe(220)
    expect(tt.corePaid).toBe(220)
    expect(tt.receiptCount).toBe(8)
  }, 30_000)

  it('replay CHÍNH XÁC sau khi số dư ĐÃ ĐỔI (thêm quyền) ⇒ trả lại ví/revision GỐC, không cấp thêm', async () => {
    const sbd = sbdMoi()
    // Ngày studied, raw 84 ⇒ lệnh đầu cấp 84.
    await gieo(sbd, { rawCore: 84, achieved: 0 })
    const reqId = `R-${maMoi()}`
    const hash = 'H-goc'

    const goc = await quyetToan(sbd, reqId, hash)
    expect(goc.entitlement).toBe(84)
    expect(goc.grant).toBe(84)
    expect(goc.walletAfter).toBe(84)
    expect(goc.committedRevision).toBe(1)

    // Ngày chuyển sang ĐẠT (achieved = 1) ⇒ entitlement 220; một lệnh MỚI cấp thêm 136.
    await DB.prepare(
      `UPDATE cnh_exp_day SET achieved = 1, revision = revision + 1
        WHERE student_id = ? AND learning_day = ? AND policy_version = ?`,
    )
      .bind(sbd, NGAY, PHIEN_BAN_CHINH_SACH)
      .run()
    const them = await quyetToan(sbd, `R-${maMoi()}-them`, 'H-them')
    expect(them.entitlement).toBe(220)
    expect(them.grant).toBe(136)
    expect(them.walletAfter).toBe(220)
    expect(them.committedRevision).toBe(2)

    // Replay đúng request+hash CŨ ⇒ trả lại NGUYÊN receipt gốc (ví 84, revision 1), KHÔNG phải
    // trạng thái ví hiện tại (220) và KHÔNG cấp thêm.
    const lai = await quyetToan(sbd, reqId, hash)
    expect(lai).toEqual(goc)
    expect(lai.committedRevision).toBe(1)
    expect(lai.walletAfter).toBe(84)

    const tt = await docTrangThai(sbd)
    expect(tt.ledgerSum).toBe(220) // 84 + 136, KHÔNG cấp thêm lần nữa
    expect(tt.ledgerPositiveCount).toBe(2)
    expect(tt.wallet).toBe(220)
    expect(tt.receiptCount).toBe(2)
  }, 30_000)

  it('cùng request_id nhưng hash KHÁC, ĐỒNG THỜI ⇒ một thành công, một lỗi typed IDEMPOTENCY_CONFLICT', async () => {
    const sbd = sbdMoi()
    await gieo(sbd, { rawCore: 84, achieved: 0 })
    const reqId = `R-${maMoi()}`

    const kq = await Promise.allSettled([
      quyetToan(sbd, reqId, 'H-A'),
      quyetToan(sbd, reqId, 'H-B'),
    ])

    const thanhCong = kq.filter((r) => r.status === 'fulfilled')
    const thatBai = kq.filter((r) => r.status === 'rejected')
    expect(thanhCong.length).toBe(1)
    expect(thatBai.length).toBe(1)

    const loi = (thatBai[0] as PromiseRejectedResult).reason
    expect(loi).toBeInstanceOf(LoiQuyetToan)
    expect((loi as LoiQuyetToan).ma).toBe('IDEMPOTENCY_CONFLICT')

    const tt = await docTrangThai(sbd)
    expect(tt.ledgerCount).toBe(1)
    expect(tt.ledgerSum).toBe(84)
    expect(tt.receiptCount).toBe(1)
  }, 30_000)

  it('đã nhận 190 rồi ĐẠT ⇒ entitlement 220, bù 30; đã đạt 220 ⇒ grant 0 (không clawback)', async () => {
    // Đạt ngày ⇒ entitlement = 220; đã trả 190 ⇒ bù 30.
    const sbdA = sbdMoi()
    await gieo(sbdA, { rawCore: 190, achieved: 1, corePaid: 190, wallet: 190, earned: 190 })
    const a = await quyetToan(sbdA, `R-${maMoi()}`, 'H-a')
    expect(a.entitlement).toBe(220)
    expect(a.grant).toBe(30)
    expect(a.walletAfter).toBe(220)
    expect(a.earnedAfter).toBe(220)
    expect(a.corePaidAfter).toBe(220)

    const ttA = await docTrangThai(sbdA)
    expect(ttA.wallet).toBe(220)
    expect(ttA.earned).toBe(220)
    expect(ttA.corePaid).toBe(220)
    expect(ttA.ledgerSum).toBe(30)
    expect(ttA.ledgerPositiveCount).toBe(1)

    // Đã đạt và đã trả đủ 220 ⇒ grant 0, không clawback.
    const sbdB = sbdMoi()
    await gieo(sbdB, { rawCore: 190, achieved: 1, corePaid: 220, wallet: 220, earned: 220 })
    const b = await quyetToan(sbdB, `R-${maMoi()}`, 'H-b')
    expect(b.entitlement).toBe(220)
    expect(b.grant).toBe(0)
    expect(b.walletAfter).toBe(220)
    expect(b.corePaidAfter).toBe(220)

    const ttB = await docTrangThai(sbdB)
    expect(ttB.wallet).toBe(220)
    expect(ttB.ledgerSum).toBe(0) // dòng audit amount 0
    expect(ttB.ledgerCount).toBe(1)
    expect(ttB.ledgerPositiveCount).toBe(0)
  }, 30_000)

  it('CHƯA đạt, raw 190, đã trả 190 ⇒ entitlement 190, grant 0 (studied ≠ achieved)', async () => {
    // Cùng raw/đã trả như trường hợp đạt ở trên, nhưng achieved = 0 ⇒ entitlement = min(220,190) = 190
    // ⇒ grant = max(0, 190 - 190) = 0. Chứng minh "tiền" và "đạt ngày" là hai điều khác nhau.
    const sbd = sbdMoi()
    await gieo(sbd, { rawCore: 190, achieved: 0, corePaid: 190, wallet: 190, earned: 190 })
    const r = await quyetToan(sbd, `R-${maMoi()}`, 'H-studied')
    expect(r.entitlement).toBe(190)
    expect(r.grant).toBe(0)
    expect(r.walletAfter).toBe(190)
    expect(r.corePaidAfter).toBe(190)

    const tt = await docTrangThai(sbd)
    expect(tt.wallet).toBe(190)
    expect(tt.earned).toBe(190)
    expect(tt.corePaid).toBe(190)
    expect(tt.ledgerSum).toBe(0)
    expect(tt.ledgerCount).toBe(1)
    expect(tt.ledgerPositiveCount).toBe(0)
  }, 30_000)

  it('mô phỏng HTTP mất phản hồi: bỏ qua kết quả đầu rồi replay ⇒ KHÔNG nhân đôi', async () => {
    const sbd = sbdMoi()
    await gieo(sbd, { rawCore: 84, achieved: 0 })
    const reqId = `R-${maMoi()}`
    const hash = 'H-http'

    // Lần gọi "thành công nhưng client không nhận được phản hồi".
    const lan1 = await quyetToan(sbd, reqId, hash)
    expect(lan1.grant).toBe(84)

    // Client thử lại với CÙNG request_id + hash (đúng giao kèo idempotency).
    const lan2 = await quyetToan(sbd, reqId, hash)
    expect(lan2).toEqual(lan1)

    const tt = await docTrangThai(sbd)
    expect(tt.ledgerCount).toBe(1)
    expect(tt.ledgerSum).toBe(84)
    expect(tt.wallet).toBe(84)
    expect(tt.receiptCount).toBe(1)
  }, 30_000)

  // ── Ma trận lỗi tiêm (04 §5.6) ────────────────────────────────────────────────────────────────
  //
  // Mỗi ca: (a) chụp ảnh trạng thái TRƯỚC, (b) tiêm trigger lỗi CHỈ cho student này, (c) gọi quyết
  // toán với request_id/hash ĐÃ LƯU và kỳ vọng NÉM (SQL/CHECK lỗi lan truyền NGUYÊN VẸN — KHÔNG bị
  // bọc thành `LoiQuyetToan`), (d) so sánh ảnh trạng thái SAU khớp HOÀN TOÀN ảnh trước (rollback
  // nguyên tử), (e) gỡ trigger, (f) thử lại CÙNG request_id/hash ⇒ cấp đúng số và ĐÚNG MỘT dòng
  // ledger dương.
  //
  // LƯU Ý: các ca IGNORE làm guard `CHECK(ok = 1)` vỡ ⇒ D1 ném lỗi CHECK chung, KHÔNG phải
  // `LoiQuyetToan`. Đó là thiết kế (lỗi SQL bất ngờ phải lan truyền, không bị nuốt thành retry).
  interface CaLoi {
    ten: string
    /** SQL tạo trigger; `%TEN%` và `%SBD%` được thay thế. */
    sql: string
  }

  const MA_TRAN_LOI: CaLoi[] = [
    {
      ten: 'account UPDATE bị IGNORE',
      sql: `CREATE TRIGGER %TEN% BEFORE UPDATE ON cnh_exp_account
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
  ]

  for (const ca of MA_TRAN_LOI) {
    it(`lỗi tiêm: ${ca.ten} ⇒ rollback nguyên tử, rồi thử lại CÙNG request cấp đúng`, async () => {
      const sbd = sbdMoi()
      await gieo(sbd, { rawCore: 84, achieved: 0 })
      const reqId = `R-${maMoi()}`
      const hash = 'H-fault'

      const truoc = await docTrangThai(sbd)
      // Trạng thái đầu: ví/earned/corePaid 0, chưa có ledger/receipt/guard.
      expect(truoc).toEqual({
        wallet: 0,
        earned: 0,
        accountRevision: 0,
        corePaid: 0,
        dayRevision: 0,
        ledgerCount: 0,
        ledgerSum: 0,
        ledgerPositiveCount: 0,
        receiptCount: 0,
        guardCount: 0,
      })

      const ten = `trg_${maMoi().replace(/[^A-Za-z0-9]/g, '')}`
      await taoTrigger(ten, ca.sql.replace(/%TEN%/g, ten).replace(/%SBD%/g, sbd))
      triggerDaTao.push(ten)

      // Lỗi SQL/CHECK lan truyền NGUYÊN VẸN (không bọc thành LoiQuyetToan).
      await expect(quyetToan(sbd, reqId, hash)).rejects.toThrow()

      // Rollback nguyên tử: ảnh trạng thái SAU khớp HOÀN TOÀN ảnh TRƯỚC.
      const sau = await docTrangThai(sbd)
      expect(sau).toEqual(truoc)

      // Gỡ trigger rồi thử lại CÙNG request_id + hash ⇒ cấp 84, ĐÚNG MỘT dòng ledger dương.
      await goTrigger(ten)
      const lai = await quyetToan(sbd, reqId, hash)
      expect(lai.grant).toBe(84)
      expect(lai.walletAfter).toBe(84)
      expect(lai.earnedAfter).toBe(84)
      expect(lai.corePaidAfter).toBe(84)

      const cuoi = await docTrangThai(sbd)
      expect(cuoi.wallet).toBe(84)
      expect(cuoi.earned).toBe(84)
      expect(cuoi.corePaid).toBe(84)
      expect(cuoi.ledgerCount).toBe(1)
      expect(cuoi.ledgerSum).toBe(84)
      expect(cuoi.ledgerPositiveCount).toBe(1)
      expect(cuoi.receiptCount).toBe(1)
      expect(cuoi.guardCount).toBe(1)
    }, 30_000)
  }

  it('D1 runtime TỪ CHỐI giá trị phân số cho cột tiền (CHECK typeof = integer)', async () => {
    const sbd = sbdMoi()
    await gieo(sbd, { rawCore: 0, achieved: 0 })
    const truoc = await docTrangThai(sbd)
    // Ghi thẳng một giá trị REAL vào cột tiền ⇒ CHECK(typeof(...) = 'integer') phải vỡ.
    await expect(
      DB.prepare('UPDATE cnh_exp_account SET wallet_exp = 1.5 WHERE student_id = ?')
        .bind(sbd)
        .run(),
    ).rejects.toThrow()
    // Và trạng thái vẫn nguyên vẹn.
    const sau = await docTrangThai(sbd)
    expect(sau).toEqual(truoc)
    expect(sau.wallet).toBe(0)
  }, 30_000)
})
