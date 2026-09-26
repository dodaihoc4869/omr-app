// @vitest-environment node
// CNH-1.0 P08 — KHỞI TẠO VÍ (`cnh_exp_account`) TỪ HỒ SƠ CŨ — LƯỢC ĐỒ THẬT (`node:sqlite`).
//
// Chứng minh: dry-run KHÔNG ghi · chạy thật ghi ĐÚNG ví/earned + `revision = 0` · chạy lại KHÔNG ghi đè ·
// hồ sơ hỏng chỉ vào `loi` (không chặn em khác) · giá trị âm/thập phân/thiếu ⇒ 0 (không rollback batch) ·
// KHÔNG đụng `game_v2_profile` · con trỏ phân trang đúng · hàm đối chiếu tổng khớp.
import { describe, expect, it } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import { khoiTaoViHangLoat, tongViHienCo, tongViTuHoSoCu } from '../server/src/cnh-exp-p08-khoi-tao'

function gieo(d1: D1That, sbd: string, json: string, revision = 5): void {
  d1.sql.prepare('INSERT INTO game_v2_profile (sbd, revision, json, created_at) VALUES (?, ?, ?, ?)').run(sbd, revision, json, '2026-09-25T00:00:00Z')
}
const ho = (o: Record<string, unknown>) => JSON.stringify({ pet: 'dat_quy', choice: true, cap: 1, exp: 0, wallet: 0, earned: 0, ...o })
const vi = (d1: D1That, sbd: string) =>
  d1.sql.prepare('SELECT wallet_exp AS w, earned_exp AS e, revision AS r FROM cnh_exp_account WHERE student_id = ?').get(sbd) as
    | { w: number; e: number; r: number }
    | undefined
const dem = (d1: D1That, bang: string) => Number((d1.sql.prepare(`SELECT COUNT(*) AS n FROM ${bang}`).get() as { n: number }).n)

describe('P08 khởi tạo ví · `game_v2_profile.wallet → cnh_exp_account`', () => {
  it('dry-run: KHÔNG ghi gì nhưng báo ĐÚNG số sẽ ghi', async () => {
    const d1 = taoD1That()
    gieo(d1, 'S1', ho({ wallet: 300, earned: 500 }))
    gieo(d1, 'S2', ho({ wallet: 0, earned: 0 }))
    const r = await khoiTaoViHangLoat(d1.env, { dryRun: true })
    expect(r).toMatchObject({ xet: 2, tao: 2, daCo: 0, tongWallet: 300, tongEarned: 500, xong: true, conTro: null })
    expect(dem(d1, 'cnh_exp_account')).toBe(0)
  })

  it('chạy thật: ghi wallet/earned ĐÚNG, `revision` bắt đầu 0, KHÔNG đụng hồ sơ cũ', async () => {
    const d1 = taoD1That()
    gieo(d1, 'S1', ho({ wallet: 300, earned: 500 }))
    gieo(d1, 'S2', ho({ wallet: 7, earned: 9 }))
    const truoc = JSON.stringify(d1.sql.prepare('SELECT * FROM game_v2_profile ORDER BY sbd').all())
    const r = await khoiTaoViHangLoat(d1.env, { dryRun: false })
    expect(r).toMatchObject({ xet: 2, tao: 2, daCo: 0, tongWallet: 307, tongEarned: 509 })
    expect(vi(d1, 'S1')).toEqual({ w: 300, e: 500, r: 0 })
    expect(vi(d1, 'S2')).toEqual({ w: 7, e: 9, r: 0 })
    expect(JSON.stringify(d1.sql.prepare('SELECT * FROM game_v2_profile ORDER BY sbd').all())).toBe(truoc)
  })

  it('chạy LẠI: mọi em vào `daCo`, tài sản KHÔNG đổi (idempotent)', async () => {
    const d1 = taoD1That()
    gieo(d1, 'S1', ho({ wallet: 300, earned: 500 }))
    await khoiTaoViHangLoat(d1.env, { dryRun: false })
    d1.sql.prepare('UPDATE cnh_exp_account SET wallet_exp = 111 WHERE student_id = ?').run('S1')
    const lai = await khoiTaoViHangLoat(d1.env, { dryRun: false })
    expect(lai).toMatchObject({ xet: 1, tao: 0, daCo: 1, tongWallet: 0 })
    expect(vi(d1, 'S1')!.w).toBe(111) // KHÔNG bị ghi đè về 300
  })

  it('giá trị âm / thập phân / thiếu ⇒ 0 (không vi phạm CHECK ⇒ không rollback batch)', async () => {
    const d1 = taoD1That()
    gieo(d1, 'S1', ho({ wallet: -50, earned: 12.7 }))
    gieo(d1, 'S2', JSON.stringify({ pet: 'dat_quy' }))
    const r = await khoiTaoViHangLoat(d1.env, { dryRun: false })
    expect(r).toMatchObject({ xet: 2, tao: 2 })
    expect(vi(d1, 'S1')).toEqual({ w: 0, e: 12, r: 0 })
    expect(vi(d1, 'S2')).toEqual({ w: 0, e: 0, r: 0 })
  })

  it('hồ sơ HỎNG chỉ vào `loi` — KHÔNG chặn em khác, KHÔNG ghi gì cho em đó', async () => {
    const d1 = taoD1That()
    gieo(d1, 'S1', ho({ wallet: 100, earned: 100 }))
    d1.sql.prepare('INSERT INTO game_v2_profile (sbd, revision, json, created_at) VALUES (?, 1, ?, ?)').run('S2', '{hong', 'x')
    gieo(d1, 'S3', ho({ wallet: 5, earned: 5 }))
    const r = await khoiTaoViHangLoat(d1.env, { dryRun: false })
    expect(r).toMatchObject({ xet: 3, tao: 2, daCo: 0, xong: true })
    expect(r.loi).toHaveLength(1)
    expect(r.loi[0]).toMatchObject({ studentId: 'S2', ma: 'CORRUPT_STATE' })
    expect(vi(d1, 'S2')).toBeUndefined()
    expect(vi(d1, 'S1')!.w).toBe(100)
    expect(vi(d1, 'S3')!.w).toBe(5)
  })

  it('CON TRỎ: phân trang 2 em/lượt, chạy tới hết, không bỏ sót/không lặp', async () => {
    const d1 = taoD1That()
    for (const s of ['S1', 'S2', 'S3', 'S4', 'S5']) gieo(d1, s, ho({ wallet: 10, earned: 10 }))
    let con: string | null = null
    const thay: string[] = []
    let vong = 0
    do {
      const r = await khoiTaoViHangLoat(d1.env, { dryRun: false, gioiHan: 2, tuSbd: con })
      vong += 1
      for (const s of ['S1', 'S2', 'S3', 'S4', 'S5']) if (!thay.includes(s) && vi(d1, s)) thay.push(s)
      con = r.conTro
      if (con === null) expect(r.xong).toBe(true)
    } while (con !== null)
    expect(vong).toBe(3)
    expect(dem(d1, 'cnh_exp_account')).toBe(5)
    expect(thay.sort()).toEqual(['S1', 'S2', 'S3', 'S4', 'S5'])
  })

  it('đối chiếu tổng: `tongViTuHoSoCu` = `tongViHienCo` sau khi chạy thật', async () => {
    const d1 = taoD1That()
    gieo(d1, 'S1', ho({ wallet: 121, earned: 200 }))
    gieo(d1, 'S2', ho({ wallet: 79, earned: 100 }))
    const mongDoi = await tongViTuHoSoCu(d1.env)
    expect(mongDoi).toEqual({ soEm: 2, tongWallet: 200, tongEarned: 300 })
    await khoiTaoViHangLoat(d1.env, { dryRun: false })
    expect(await tongViHienCo(d1.env)).toEqual({ soEm: 2, tongWallet: 200, tongEarned: 300 })
  })
})
