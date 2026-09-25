// CNH-1.0 P08 — BẰNG CHỨNG LƯỢC ĐỒ: migration CHỈ-THÊM, ràng buộc fail-closed, lùi SẠCH.
//
// Chạy trên `node:sqlite` THẬT (qua `taoD1That()`, nạp `schema.sql` + MỌI `server/migration-*.sql`)
// nên `CHECK (typeof(col) = 'integer')` và `UNIQUE` được KIỂM CHỨNG chứ không đoán.
//
// ⚠️ Điều khoản: `03` §6–§9 (`06` R26–R31, T21–T31/T45). KHÔNG chạy remote, KHÔNG bật cờ.
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { describe, expect, it } from 'vitest'
import { KINH_TE, TRAN_INVESTED_EXP } from '../server/src/cnh-exp-p08'
import { taoD1That } from './_d1-that'

const TEN_MOI = ['cnh_exp_p08_state', 'cnh_exp_fragment_ledger', 'cnh_exp_spend_ledger', 'cnh_exp_p08_guard', 'cnh_exp_p08_chuyen_doi', 'cnh_exp_p08_giai_quyet']
/** Bảng của P07: tệp P08/LÙI KHÔNG được chạm. */
const TEN_P07 = ['cnh_exp_account', 'cnh_exp_day', 'cnh_exp_command', 'cnh_exp_grant_ledger', 'cnh_exp_guard']

type Sql = DatabaseSync
const coBang = (sql: Sql, ten: string) => !!sql.prepare("SELECT 1 AS x FROM sqlite_master WHERE type = 'table' AND name = ?").get(ten)
const cotCua = (sql: Sql, bang: string) =>
  (sql.prepare(`SELECT name FROM pragma_table_info('${bang}')`).all() as { name: string }[]).map((r) => r.name)
const nem = (fn: () => unknown) => {
  try {
    fn()
  } catch (e) {
    return (e as Error).message
  }
  return null
}
const chen = (sql: Sql, bang: string, hang: Record<string, unknown>) => {
  const ks = Object.keys(hang)
  sql.prepare(`INSERT INTO ${bang} (${ks.join(', ')}) VALUES (${ks.map(() => '?').join(', ')})`).run(...(Object.values(hang) as never[]))
}
/** Một hàng `cnh_exp_p08_state` hợp lệ tối thiểu; `thay` để phá đúng một cột. */
const hangState = (thay: Record<string, unknown> = {}) => ({
  student_id: 'S1',
  absorbed_day: '2026-09-24',
  absorbed_today: 0,
  invested_exp: 0,
  level: 1,
  fragment_balance: 0,
  unused_shields: 0,
  used_shields: 0,
  first_shield_claimed: 0,
  achieved_days: 0,
  gold: 0,
  revision: 0,
  ...thay,
})
const chenState = (sql: Sql, thay: Record<string, unknown> = {}) => chen(sql, 'cnh_exp_p08_state', hangState(thay))

describe('P08 lược đồ · tệp mới CHỈ-THÊM', () => {
  it('nạp xong lược đồ: có ĐỦ 4 bảng P08 + 2 chỉ mục, KHÔNG đụng bảng P07', () => {
    const { sql } = taoD1That()
    for (const t of [...TEN_MOI, ...TEN_P07]) expect(coBang(sql, t), t).toBe(true)
    const idx = (sql.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_cnh_exp_%'").all() as { name: string }[]).map((r) => r.name)
    expect(idx).toContain('idx_cnh_exp_fragment_student')
    expect(idx).toContain('idx_cnh_exp_spend_student')
  })

  it('tệp LÙI KHÔNG nằm trong `migration-*.sql` (⇒ `taoD1That` không tự chạy nó)', () => {
    // Ai đổi tên nó thành `migration-…` thì lược đồ test bị xoá ngay sau khi dựng ⇒ dòng dưới ĐỎ.
    expect(readFileSync('server/lui-2309-cnh-exp-p08.sql', 'utf8')).toMatch(/^-- LÙI/m)
    expect(coBang(taoD1That().sql, 'cnh_exp_p08_state')).toBe(true)
  })

  it('tệp LÙI chỉ DROP đối tượng P08 — KHÔNG `ALTER`/`DROP` bảng P07', () => {
    // Bỏ chú thích trước khi soi: đầu tệp CÓ nhắc tên bảng P07 (để giải thích "không được chạm"),
    // nếu soi cả chú thích thì phép kiểm vô nghĩa.
    const lenh = readFileSync('server/lui-2309-cnh-exp-p08.sql', 'utf8').replace(/--[^\n]*/g, '')
    for (const t of TEN_P07) expect(lenh, t).not.toMatch(new RegExp(`DROP TABLE IF EXISTS ${t}\\b`))
    expect(lenh).not.toMatch(/\bALTER\s+TABLE\b/i)
    expect(lenh).not.toMatch(/cnh_exp_account/)
    for (const t of TEN_MOI) expect(lenh, t).toMatch(new RegExp(`DROP TABLE IF EXISTS ${t}\\b`))
  })

  it('CHỈ-THÊM thật: `cnh_exp_account` KHÔNG mọc cột P08 nào', () => {
    const cot = cotCua(taoD1That().sql, 'cnh_exp_account')
    expect(cot.sort()).toEqual(['cap_nhat_luc', 'earned_exp', 'revision', 'student_id', 'wallet_exp'])
    for (const c of ['fragments', 'unused_shields', 'gold', 'absorbed_today']) expect(cot, c).not.toContain(c)
  })
})

describe('P08 lược đồ · ràng buộc số FAIL-CLOSED tại tầng SQL', () => {
  it('`cnh_exp_p08_state`: cột tiền/đếm PHẢI là số nguyên trong khoảng', () => {
    const { sql } = taoD1That()
    chenState(sql) // hàng hợp lệ
    expect(nem(() => chenState(sql, { student_id: 'S2', gold: 1.5 }))).toMatch(/CHECK/i)
    expect(nem(() => chenState(sql, { student_id: 'S2', fragment_balance: -1 }))).toMatch(/CHECK/i)
    expect(nem(() => chenState(sql, { student_id: 'S2', revision: 1.5 }))).toMatch(/CHECK/i)
    expect(nem(() => chenState(sql, { student_id: 'S2', absorbed_today: 'abc' }))).toMatch(/CHECK/i)
    expect(sql.prepare('SELECT COUNT(*) AS n FROM cnh_exp_p08_state').get()).toEqual({ n: 1 })
  })

  it('`invested_exp` có TRẦN đường cấp (`03` §6) — SỐ LẤY TỪ MODULE, không cứng trong test', () => {
    const { sql } = taoD1That()
    // Lấy trần từ chính hàm sản phẩm ⇒ SQL cứng `238200` mà lệch `BANG_THANH_EXP` là đỏ NGAY.
    chenState(sql, { student_id: 'SD', invested_exp: TRAN_INVESTED_EXP })
    expect((sql.prepare("SELECT invested_exp AS v FROM cnh_exp_p08_state WHERE student_id = 'SD'").get() as { v: number }).v).toBe(TRAN_INVESTED_EXP)
    expect(nem(() => chenState(sql, { student_id: 'SX', invested_exp: TRAN_INVESTED_EXP + 1 }))).toMatch(/CHECK/i)
    expect(nem(() => chenState(sql, { student_id: 'SX', invested_exp: 1.5 }))).toMatch(/CHECK/i)
  })

  it('`absorbed_today` có TRẦN NGÀY = `KINH_TE.achievedAbsorbCap` (`03` §6) — 201 là chặn', () => {
    const { sql } = taoD1That()
    chenState(sql, { student_id: 'SA', absorbed_today: KINH_TE.achievedAbsorbCap })
    expect((sql.prepare("SELECT absorbed_today AS v FROM cnh_exp_p08_state WHERE student_id = 'SA'").get() as { v: number }).v).toBe(KINH_TE.achievedAbsorbCap)
    expect(nem(() => chenState(sql, { student_id: 'SX', absorbed_today: KINH_TE.achievedAbsorbCap + 1 }))).toMatch(/CHECK/i)
    expect(nem(() => chenState(sql, { student_id: 'SX', absorbed_today: -1 }))).toMatch(/CHECK/i)
  })

  it('`cnh_exp_p08_state`: cấp ∈ [1,120] và cờ `first_shield_claimed` ∈ {0,1}', () => {
    const { sql } = taoD1That()
    expect(nem(() => chenState(sql, { level: 0 }))).toMatch(/CHECK/i)
    expect(nem(() => chenState(sql, { level: 121 }))).toMatch(/CHECK/i)
    expect(nem(() => chenState(sql, { level: 1.5 }))).toMatch(/CHECK/i)
    expect(nem(() => chenState(sql, { first_shield_claimed: 2 }))).toMatch(/CHECK/i)
    // Cờ 1 phải đi kèm `first_claim_status = 'claimed'` (§9.2 — CHECK tương quan).
    chenState(sql, { level: 120, first_shield_claimed: 1, first_claim_status: 'claimed' })
    expect(sql.prepare('SELECT COUNT(*) AS n FROM cnh_exp_p08_state').get()).toEqual({ n: 1 })
  })

  it('§9.1 · kho khiên CŨ vượt 5 PHẢI chuyển vào được (trần 5 là luật CẤP, không phải ràng buộc cột)', () => {
    const { sql } = taoD1That()
    // Đây là điều khoản "Giữ mọi khiên cũ, kể cả vượt 5". Nếu ai thêm lại `CHECK (unused_shields <= 5)`
    // thì 3 dòng dưới ĐỎ — và hồ sơ cũ có 6/9 khiên sẽ KHÔNG THỂ chuyển vào (mất tài sản của em).
    chenState(sql, { student_id: 'S6', unused_shields: 6 })
    chenState(sql, { student_id: 'S9', unused_shields: 9 })
    expect((sql.prepare("SELECT unused_shields AS u FROM cnh_exp_p08_state WHERE student_id = 'S9'").get() as { u: number }).u).toBe(9)
    // Nhưng luật CẤP vẫn chặn: `xetKhien` từ chối khi kho ≥ 5 (kiểm ở bộ hàm thuần).
    expect(nem(() => chenState(sql, { student_id: 'SX', unused_shields: -1 }))).toMatch(/CHECK/i)
    expect(nem(() => chenState(sql, { student_id: 'SX', unused_shields: 1.5 }))).toMatch(/CHECK/i)
  })

  it('`cnh_exp_fragment_ledger`: khoá ĐÚNG `(student_id, learning_day, achieved_fragment)` của §7.1', () => {
    const { sql } = taoD1That()
    const goc = { entry_id: 'E1', student_id: 'S1', learning_day: '2026-09-24', policy_version: 'CNH-1.0', kind: 'achieved_fragment', delta: 1, execution_id: 'X1' }
    const them = (o: Record<string, unknown> = {}) => chen(sql, 'cnh_exp_fragment_ledger', { ...goc, ...o })
    expect(nem(() => them({ kind: 'tang_linh_tinh' }))).toMatch(/CHECK/i)
    expect(nem(() => them({ delta: 0 }))).toMatch(/CHECK/i)
    expect(nem(() => them({ delta: -1 }))).toMatch(/CHECK/i) // sổ mảnh CHỈ ghi phần KIẾM (§7.1); tiêu nằm ở sổ TIÊU
    expect(nem(() => them({ delta: 1.5 }))).toMatch(/CHECK/i)
    them()
    // Cấp lần hai CÙNG ngày ⇒ UNIQUE chặn ("không tạo ngày thứ hai", §7.1) — không cộng đôi.
    expect(nem(() => them({ entry_id: 'E2', execution_id: 'X2' }))).toMatch(/UNIQUE/i)
    // CÙNG ngày nhưng KHÁC phiên bản chính sách ⇒ VẪN chặn: một ngày gốc chỉ có một phiên bản (§9.1),
    // nên `policy_version` CỐ Ý không nằm trong khoá. Bỏ nó khỏi khoá ⇒ dòng này ĐỎ.
    expect(nem(() => them({ entry_id: 'E3', execution_id: 'X3', policy_version: 'CNH-1.1' }))).toMatch(/UNIQUE/i)
    // Ngày KHÁC ⇒ hợp lệ (một mảnh mỗi ngày đạt). `studied` không tạo hàng nào.
    them({ entry_id: 'E2', learning_day: '2026-09-25', execution_id: 'X2' })
    expect(sql.prepare('SELECT COUNT(*) AS n FROM cnh_exp_fragment_ledger').get()).toEqual({ n: 2 })
  })

  it('`cnh_exp_spend_ledger`: sổ TIÊU không bao giờ cộng ví; một lệnh tối đa một khiên', () => {
    const { sql } = taoD1That()
    const goc = { entry_id: 'E1', student_id: 'S1', command_type: 'doi_vang', request_id: 'R1', exp_delta: -200, gold_delta: 200, fragments_delta: 0, shields_delta: 0, execution_id: 'X1' }
    const them = (o: Record<string, unknown> = {}) => chen(sql, 'cnh_exp_spend_ledger', { ...goc, ...o })
    expect(nem(() => them({ exp_delta: 1 }))).toMatch(/CHECK/i) // cộng ví ⇒ chặn
    expect(nem(() => them({ command_type: 'mua_do' }))).toMatch(/CHECK/i)
    expect(nem(() => them({ shields_delta: 2 }))).toMatch(/CHECK/i)
    expect(nem(() => them({ fragments_delta: 1 }))).toMatch(/CHECK/i)
    // `exp_delta = 0` HỢP LỆ (`03` §7: rèn khiên KHÔNG trừ ví, chỉ tiêu mảnh) — dùng bộ khoá riêng.
    expect(nem(() => them({ entry_id: 'E9', request_id: 'R9', execution_id: 'X9', exp_delta: 0, gold_delta: 0 }))).toBeNull()
    them()
    // CÙNG chìa khoá yêu cầu (`student, command_type, request_id`) ⇒ chặn: lệnh trùng không trừ hai lần.
    expect(nem(() => them({ entry_id: 'E2', execution_id: 'X2' }))).toMatch(/UNIQUE/i)
    // CÙNG `execution_id` (một lượt CAS) ⇒ chặn.
    expect(nem(() => them({ entry_id: 'E3', request_id: 'R2' }))).toMatch(/UNIQUE/i)
    expect(sql.prepare('SELECT COUNT(*) AS n FROM cnh_exp_spend_ledger').get()).toEqual({ n: 2 })
  })

  it('§7.1 · `ren_khien` PHẢI có `claim_index`; UNIQUE(student, claim_index) chặn cấp ĐÔI', () => {
    const { sql } = taoD1That()
    const ren = (o: Record<string, unknown> = {}) => ({
      entry_id: 'K1', student_id: 'S1', command_type: 'ren_khien', request_id: 'Q1', claim_index: 3,
      exp_delta: -300, gold_delta: 0, fragments_delta: -21, shields_delta: 1, execution_id: 'Y1', ...o,
    })
    const dv = { entry_id: 'A1', student_id: 'S1', command_type: 'doi_vang', request_id: 'P1', exp_delta: -200, gold_delta: 200, execution_id: 'Z1' }
    // Tương quan `command_type ↔ claim_index` (bảng CHECK): thiếu/sai kiểu đều bị chặn.
    expect(nem(() => chen(sql, 'cnh_exp_spend_ledger', ren({ claim_index: null })))).toMatch(/CHECK/i)
    expect(nem(() => chen(sql, 'cnh_exp_spend_ledger', ren({ claim_index: 0 })))).toMatch(/CHECK/i)
    expect(nem(() => chen(sql, 'cnh_exp_spend_ledger', ren({ claim_index: 1.5 })))).toMatch(/CHECK/i)
    expect(nem(() => chen(sql, 'cnh_exp_spend_ledger', { ...dv, claim_index: 2 }))).toMatch(/CHECK/i) // đổi vàng mà có claim_index
    chen(sql, 'cnh_exp_spend_ledger', ren())
    // "Hai máy gọi quà/rèn ngày 21 CHỈ nhận 1 khiên" (§7.1): cùng `claim_index`, yêu cầu KHÁC ⇒ UNIQUE chặn.
    expect(nem(() => chen(sql, 'cnh_exp_spend_ledger', ren({ entry_id: 'K2', request_id: 'Q2', execution_id: 'Y2' })))).toMatch(/UNIQUE/i)
    // Lượt kế tiếp (`claim_index` 4) hợp lệ — "không có luật phải đợi 21 ngày kể từ lần bấm trước".
    chen(sql, 'cnh_exp_spend_ledger', ren({ entry_id: 'K3', request_id: 'Q3', execution_id: 'Y3', claim_index: 4 }))
    // Nhiều hàng đổi vàng (`claim_index` NULL) KHÔNG đụng nhau (SQLite cho nhiều NULL trong UNIQUE).
    chen(sql, 'cnh_exp_spend_ledger', dv)
    chen(sql, 'cnh_exp_spend_ledger', { ...dv, entry_id: 'A2', request_id: 'P2', execution_id: 'Z2' })
    expect(sql.prepare("SELECT COUNT(*) AS n FROM cnh_exp_spend_ledger WHERE command_type = 'ren_khien'").get()).toEqual({ n: 2 })
    expect(sql.prepare("SELECT COUNT(*) AS n FROM cnh_exp_spend_ledger WHERE command_type = 'doi_vang'").get()).toEqual({ n: 2 })
  })

  it('`cnh_exp_p08_guard`: `ok = 0` KHÔNG ghi được (bất biến hỏng phải là LỖI, không phải 0 hàng)', () => {
    const { sql } = taoD1That()
    expect(nem(() => sql.prepare("INSERT INTO cnh_exp_p08_guard (execution_id, ok) VALUES ('X1', 0)").run())).toMatch(/CHECK/i)
    expect(nem(() => sql.prepare("INSERT INTO cnh_exp_p08_guard (execution_id, ok) VALUES ('X2', 1.5)").run())).toMatch(/CHECK/i)
    sql.prepare("INSERT INTO cnh_exp_p08_guard (execution_id, ok) VALUES ('X3', 1)").run()
    expect(sql.prepare('SELECT COUNT(*) AS n FROM cnh_exp_p08_guard').get()).toEqual({ n: 1 })
  })
})

describe('P08 lược đồ · LÙI sạch trên lược đồ dựng riêng', () => {
  it('áp P08 rồi áp tệp LÙI ⇒ 4 bảng P08 BIẾN MẤT, 5 bảng P07 CÒN NGUYÊN; áp lại được', () => {
    const sql = new DatabaseSync(':memory:')
    sql.exec(readFileSync('server/migration-2309-cnh-exp-ledger.sql', 'utf8')) // dựng P07
    sql.exec(readFileSync('server/migration-2309-cnh-exp-p08.sql', 'utf8'))
    for (const t of [...TEN_MOI, ...TEN_P07]) expect(coBang(sql, t), `sau khi áp: ${t}`).toBe(true)
    sql.exec(readFileSync('server/lui-2309-cnh-exp-p08.sql', 'utf8'))
    for (const t of TEN_MOI) expect(coBang(sql, t), `sau khi lùi: ${t}`).toBe(false)
    for (const t of TEN_P07) expect(coBang(sql, t), `sau khi lùi: ${t}`).toBe(true)
    // Idempotent: áp lại lần hai chạy được, bảng trở lại (chỉ-thêm ⇒ chạy lại vô hại).
    sql.exec(readFileSync('server/migration-2309-cnh-exp-p08.sql', 'utf8'))
    expect(coBang(sql, 'cnh_exp_p08_state')).toBe(true)
    sql.close()
  })
})
