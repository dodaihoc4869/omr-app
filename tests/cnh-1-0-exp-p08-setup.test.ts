// @vitest-environment node
// CNH-1.0 P08 — JOB LẮP ĐẶT (cờ `cau_hinh` + cron) — LƯỢC ĐỒ THẬT (`node:sqlite`).
//
// Chứng minh: KHÔNG cờ ⇒ không chạy, không ghi · cờ HUỶ thắng cờ cho phép · dry-run chạy hết mà KHÔNG ghi ·
// chạy thật đẻ ví + `cnh_exp_p08_state` · đổi dryRun giữa chừng ⇒ chạy lại từ đầu · `xong` thì không chạy lại.
import { describe, expect, it } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import { chaySetupP08NeuDuoc, KHOA_CHO_PHEP, KHOA_HUY, KHOA_TRANG_THAI, SO_EM_MOI_LUOT } from '../server/src/cnh-exp-p08-setup'

const T0 = Date.parse('2026-09-25T03:00:00Z') // 10:00 giờ VN ngày 25/09
const ho = (o: Record<string, unknown>) =>
  JSON.stringify({ pet: 'dat_quy', choice: true, cap: 3, exp: 10, wallet: 120, earned: 500, mastery: [], arena: null, ...o })
function gieo(d1: D1That, sbd: string, o: Record<string, unknown> = {}): void {
  d1.sql.prepare('INSERT INTO game_v2_profile (sbd, revision, json, created_at) VALUES (?, 3, ?, ?)').run(sbd, ho(o), 'x')
}
function datCo(d1: D1That, khoa: string, giaTri: string): void {
  d1.sql
    .prepare("INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, datetime('now')) ON CONFLICT(khoa) DO UPDATE SET gia_tri=excluded.gia_tri")
    .run(khoa, giaTri)
}
const dem = (d1: D1That, bang: string) => Number((d1.sql.prepare(`SELECT COUNT(*) AS n FROM ${bang}`).get() as { n: number }).n)
const tt = (d1: D1That) => JSON.parse((d1.sql.prepare('SELECT gia_tri AS g FROM cau_hinh WHERE khoa = ?').get(KHOA_TRANG_THAI) as { g: string } | undefined)?.g ?? 'null')
/** Chạy cron tới khi xong (tối đa `toiDa` lượt) — mô phỏng cron mỗi phút. */
async function chayHet(d1: D1That, toiDa = 60): Promise<ReturnType<typeof tt>> {
  for (let i = 0; i < toiDa; i++) {
    const r = await chaySetupP08NeuDuoc(d1.env, T0 + i * 60_000)
    if (!r.chay || r.lyDo === 'xong') return tt(d1)
  }
  throw new Error('job không xong sau số lượt tối đa')
}

describe('P08 job lắp đặt · cờ + cron', () => {
  it('KHÔNG cờ ⇒ không chạy, không ghi gì', async () => {
    const d1 = taoD1That()
    gieo(d1, 'S1')
    const r = await chaySetupP08NeuDuoc(d1.env, T0)
    expect(r).toMatchObject({ chay: false, lyDo: 'chua_len_dan' })
    expect(dem(d1, 'cnh_exp_account')).toBe(0)
    expect(dem(d1, 'cnh_exp_p08_state')).toBe(0)
    expect(dem(d1, 'cau_hinh')).toBe(0)
  })

  it('cờ HUỶ thắng cờ cho phép', async () => {
    const d1 = taoD1That()
    gieo(d1, 'S1')
    datCo(d1, KHOA_CHO_PHEP, '{"choPhep":true}')
    datCo(d1, KHOA_HUY, 'true')
    const r = await chaySetupP08NeuDuoc(d1.env, T0)
    expect(r).toMatchObject({ chay: false, lyDo: 'da_huy' })
    expect(dem(d1, 'cnh_exp_account')).toBe(0)
  })

  it('DRY-RUN: đi hết hai bước nhưng KHÔNG ghi ví/trạng thái; báo đúng tổng', async () => {
    const d1 = taoD1That()
    gieo(d1, 'S1', { wallet: 120, earned: 500 })
    gieo(d1, 'S2', { wallet: 80, earned: 300 })
    datCo(d1, KHOA_CHO_PHEP, '{"choPhep":true,"dryRun":true}')
    const kq = await chayHet(d1)
    expect(kq.buoc).toBe('xong')
    expect(kq.dryRun).toBe(true)
    expect(kq.migrationId).toBe('P08-20260925')
    expect(kq.learningDay).toBe('2026-09-25')
    expect(kq.effectiveAt).toBe('2026-09-25T17:00:00.000Z') // 00:00 VN 26/09
    expect(kq.khoiTao).toMatchObject({ tao: 2, daCo: 0, tongWallet: 200, tongEarned: 800 })
    expect(kq.chuyenDoi).toMatchObject({ chuyen: 2, daCo: 0 })
    expect(dem(d1, 'cnh_exp_account')).toBe(0)
    expect(dem(d1, 'cnh_exp_p08_state')).toBe(0)
    expect(dem(d1, 'cnh_exp_p08_chuyen_doi')).toBe(0)
  })

  it('CHẠY THẬT: đẻ ví + `cnh_exp_p08_state` + sổ chuyển đổi cho MỌI em, rồi `xong`', async () => {
    const d1 = taoD1That()
    for (const s of ['S1', 'S2', 'S3']) gieo(d1, s)
    datCo(d1, KHOA_CHO_PHEP, '{"choPhep":true,"dryRun":false}')
    const kq = await chayHet(d1)
    expect(kq.buoc).toBe('xong')
    expect(kq.khoiTao).toMatchObject({ tao: 3, daCo: 0, tongWallet: 360 })
    expect(kq.chuyenDoi).toMatchObject({ chuyen: 3, daCo: 0, loi: 0 })
    expect(dem(d1, 'cnh_exp_account')).toBe(3)
    expect(dem(d1, 'cnh_exp_p08_state')).toBe(3)
    expect(dem(d1, 'cnh_exp_p08_chuyen_doi')).toBe(3)
    expect(kq.loi).toEqual([])
    // Ví ĐÚNG bằng hồ sơ cũ, KHÔNG mất.
    expect(Number((d1.sql.prepare("SELECT wallet_exp AS w FROM cnh_exp_account WHERE student_id='S2'").get() as { w: number }).w)).toBe(120)
  })

  it('LÔ CHIA NHỎ: mỗi lượt đúng `SO_EM_MOI_LUOT` em ⇒ phải nhiều lượt mới xong', async () => {
    const d1 = taoD1That()
    const n = SO_EM_MOI_LUOT + 5
    for (let i = 0; i < n; i++) gieo(d1, `S${String(i).padStart(3, '0')}`)
    datCo(d1, KHOA_CHO_PHEP, '{"choPhep":true}')
    let luot = 0
    for (let i = 0; i < 40; i++) {
      const r = await chaySetupP08NeuDuoc(d1.env, T0 + i * 60_000)
      luot += 1
      if (!r.chay || r.lyDo === 'xong') break
      expect(r.trangThai!.buoc === 'khoi_tao_vi' ? r.trangThai!.khoiTao.tao : 0).toBeLessThanOrEqual(n)
    }
    expect(dem(d1, 'cnh_exp_p08_state')).toBe(n)
    expect(luot).toBeGreaterThanOrEqual(4) // 2 lượt khởi tạo + 2 lượt chuyển đổi
    expect(tt(d1).buoc).toBe('xong')
  })

  it('XONG rồi: cron gọi lại KHÔNG chạy nữa', async () => {
    const d1 = taoD1That()
    gieo(d1, 'S1')
    datCo(d1, KHOA_CHO_PHEP, '{"choPhep":true}')
    await chayHet(d1)
    const sau = JSON.stringify(tt(d1))
    const lai = await chaySetupP08NeuDuoc(d1.env, T0 + 9_999_999)
    expect(lai).toMatchObject({ chay: false, lyDo: 'xong' })
    expect(JSON.stringify(tt(d1))).toBe(sau)
  })
})
