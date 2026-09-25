// @vitest-environment node
// CNH-1.0 P08 — BẰNG CHỨNG CHUYỂN ĐỔI HỒ SƠ CŨ (`03` §9.1/§9.2) trên LƯỢC ĐỒ THẬT (`node:sqlite`).
//
// Chứng minh: dry-run KHÔNG ghi; ghi thì quyết định + trạng thái CÙNG batch; chạy lại CÙNG
// `migration_id` KHÔNG đổi tài sản; `migration_id` khác ⇒ CAS thua, KHÔNG ghi đè; ảnh chụp lệch
// level/progress ⇒ chặn; §9.1 giữ khiên cũ >5 + không reset hạn mức ngày; §9.2 giữ ba nhánh khiên đầu.
import { describe, expect, it } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import { chieuTrangThaiP08, chuyenDoiP08, type AnhChupCu, type YeuCauChuyenDoi } from '../server/src/cnh-exp-p08-chuyen-doi'

const NGAY = '2026-09-24'

const anhChup = (o: Partial<AnhChupCu> = {}): AnhChupCu => ({
  level: 1,
  progress: 0,
  wallet: 500,
  gold: 20,
  items: 3,
  unusedShields: 0,
  usedShields: 0,
  fragmentBalance: 0,
  achievedDays: 0,
  absorbedToday: 0,
  revision: 0,
  pendingReceipts: 0,
  nguonSo: 'ledger',
  ...o,
})

const yeuCau = (o: Partial<YeuCauChuyenDoi> = {}, s: Partial<AnhChupCu> = {}): YeuCauChuyenDoi => ({
  studentId: 'S1',
  learningDay: NGAY,
  migrationId: 'M1',
  // §9.1: 00:00 NGÀY VN KẾ TIẾP. NGAY = 2026-09-24 ⇒ 00:00 VN 25/09 = 17:00:00Z 24/09 (VN = UTC+7).
  effectiveAt: '2026-09-24T17:00:00.000Z',
  oldPolicy: 'legacy-exam-pro-max',
  newPolicy: 'CNH-1.0',
  snapshot: anhChup(s),
  dryRun: false,
  ...o,
})

/** Ví P07 phải có sẵn (P08 không tự đẻ ví). */
function gieoVi(d1: D1That, sbd = 'S1', wallet = 500): void {
  d1.sql.prepare('INSERT INTO cnh_exp_account (student_id, wallet_exp, earned_exp, revision) VALUES (?, ?, 0, 0)').run(sbd, wallet)
}

const dem = (d1: D1That, bang: string, dk = '1=1') =>
  Number((d1.sql.prepare(`SELECT COUNT(*) AS n FROM ${bang} WHERE ${dk}`).get() as { n: number }).n)
const hang = (d1: D1That, sbd = 'S1') =>
  (d1.sql.prepare('SELECT * FROM cnh_exp_p08_state WHERE student_id = ?').get(sbd) ?? null) as Record<string, unknown> | null

describe('P08 chuyển đổi · chiếu trạng thái (`03` §9.1)', () => {
  it('level 10 + progress 0 ⇒ invested_exp = 2400 (đi vòng đúng lại)', () => {
    const t = chieuTrangThaiP08({ learningDay: NGAY, snapshot: anhChup({ level: 10, progress: 0 }) })
    expect(t.invested_exp).toBe(2400)
    expect(t.level).toBe(10)
  })

  it('giữ NGUYÊN số cũ: vàng, khiên cũ (kể cả >5), ngày đạt, hạn mức trong ngày', () => {
    const t = chieuTrangThaiP08({
      learningDay: NGAY,
      snapshot: anhChup({ level: 2, progress: 149, gold: 77, unusedShields: 7, usedShields: 3, fragmentBalance: 12, achievedDays: 30, absorbedToday: 120 }),
    })
    expect(t).toMatchObject({
      invested_exp: 269,
      level: 2,
      gold: 77,
      unused_shields: 7, // §9.1 "giữ mọi khiên cũ, kể cả vượt 5"
      used_shields: 3,
      fragment_balance: 12,
      achieved_days: 30,
      absorbed_today: 120, // §9.1 "không reset hạn mức đã dùng trong ngày"
      absorbed_day: NGAY,
      revision: 0,
    })
  })

  it('§9.2 ba nhánh khiên đầu: `claimed` ⇒ cờ 1; `legacy_unresolved` ⇒ cờ 0 + giữ mảnh chờ', () => {
    expect(chieuTrangThaiP08({ learningDay: NGAY, snapshot: anhChup({ firstClaimStatus: 'claimed' }) }).first_shield_claimed).toBe(1)
    const t = chieuTrangThaiP08({ learningDay: NGAY, snapshot: anhChup({ firstClaimStatus: 'legacy_unresolved', legacyPendingFragments: 40 }) })
    expect(t.first_shield_claimed).toBe(0)
    expect(t.first_claim_status).toBe('legacy_unresolved')
    expect(t.legacy_pending_fragments).toBe(40) // KHÔNG tự tiêu
  })

  it('ảnh chụp LỆCH (progress vượt thanh) ⇒ NÉM CORRUPT_STATE, không bịa số', () => {
    expect(() => chieuTrangThaiP08({ learningDay: NGAY, snapshot: anhChup({ level: 1, progress: 9999 }) })).toThrow(/LỆCH|vượt đường cấp/)
    expect(() => chieuTrangThaiP08({ learningDay: NGAY, snapshot: anhChup({ level: 121 }) })).toThrow(/ngoài 1…120/)
  })
})

describe('P08 chuyển đổi · lệnh ghi (`03` §9.1)', () => {
  it('dry-run: KHÔNG ghi gì, vẫn trả kết quả dự kiến', async () => {
    const d1 = taoD1That()
    gieoVi(d1)
    const r = await chuyenDoiP08(d1.env, yeuCau({ dryRun: true }, { level: 10 }))
    expect(r).toMatchObject({ dryRun: true, daChuyen: false, investedExp: 2400 })
    expect(dem(d1, 'cnh_exp_p08_state')).toBe(0)
    expect(dem(d1, 'cnh_exp_p08_chuyen_doi')).toBe(0)
    expect(dem(d1, 'cnh_exp_p08_guard')).toBe(0)
  })

  it('ghi: quyết định + trạng thái + cửa canh CÙNG batch; số cũ giữ nguyên', async () => {
    const d1 = taoD1That()
    gieoVi(d1, 'S1', 500)
    const r = await chuyenDoiP08(d1.env, yeuCau({}, { level: 10, gold: 20, unusedShields: 6, achievedDays: 12 }))
    expect(r.daChuyen).toBe(false)
    expect(dem(d1, 'cnh_exp_p08_chuyen_doi')).toBe(1)
    expect(dem(d1, 'cnh_exp_p08_state')).toBe(1)
    expect(dem(d1, 'cnh_exp_p08_guard')).toBe(1)
    const h = hang(d1)!
    expect(h.invested_exp).toBe(2400)
    expect(h.level).toBe(10)
    expect(h.unused_shields).toBe(6)
    expect(h.gold).toBe(20)
    expect(h.revision).toBe(0)
    expect(h.absorbed_day).toBe(NGAY)
  })

  it('chạy lại CÙNG `migration_id` ⇒ PHÁT LẠI, không đổi tài sản (§9.3)', async () => {
    const d1 = taoD1That()
    gieoVi(d1)
    const a = await chuyenDoiP08(d1.env, yeuCau())
    const b = await chuyenDoiP08(d1.env, yeuCau())
    expect(b.daChuyen).toBe(true)
    expect(b.snapshotHash).toBe(a.snapshotHash)
    expect(dem(d1, 'cnh_exp_p08_state')).toBe(1)
    expect(dem(d1, 'cnh_exp_p08_chuyen_doi')).toBe(1)
  })

  it('`migration_id` KHÁC ⇒ CAS THUA: ném, KHÔNG ghi đè (§9.1)', async () => {
    const d1 = taoD1That()
    gieoVi(d1)
    await chuyenDoiP08(d1.env, yeuCau())
    await expect(chuyenDoiP08(d1.env, { ...yeuCau(), migrationId: 'M2' })).rejects.toMatchObject({ ma: 'KHONG_DU_DIEU_KIEN' })
    expect(dem(d1, 'cnh_exp_p08_chuyen_doi')).toBe(1)
    expect(Number(hang(d1)!.invested_exp)).toBe(0) // hàng cũ KHÔNG bị đổi
  })

  it('đã có trạng thái P08 nhưng CHƯA có quyết định ⇒ KHÔNG ghi đè, cả batch rollback', async () => {
    const d1 = taoD1That()
    gieoVi(d1)
    d1.sql.prepare("INSERT INTO cnh_exp_p08_state (student_id, invested_exp, level) VALUES ('S1', 500, 1)").run()
    await expect(chuyenDoiP08(d1.env, yeuCau({}, { level: 10 }))).rejects.toThrow()
    expect(dem(d1, 'cnh_exp_p08_chuyen_doi')).toBe(0) // quyết định cũng bị rollback
    expect(Number(hang(d1)!.invested_exp)).toBe(500) // hàng cũ nguyên vẹn
  })

  it('thiếu `migration_id` ⇒ NOT_FOUND, không ghi gì', async () => {
    const d1 = taoD1That()
    gieoVi(d1)
    await expect(chuyenDoiP08(d1.env, { ...yeuCau(), migrationId: '' })).rejects.toMatchObject({ ma: 'NOT_FOUND' })
    expect(dem(d1, 'cnh_exp_p08_chuyen_doi')).toBe(0)
  })

  it('§9.3 · HAI học sinh CÙNG `migration_id` đều chuyển được (id duy nhất THEO học sinh, không toàn cục)', async () => {
    const d1 = taoD1That()
    gieoVi(d1, 'S1')
    gieoVi(d1, 'S2')
    const a = await chuyenDoiP08(d1.env, { ...yeuCau(), studentId: 'S1', migrationId: 'DOT-2409' })
    const b = await chuyenDoiP08(d1.env, { ...yeuCau(), studentId: 'S2', migrationId: 'DOT-2409' })
    expect(a.daChuyen).toBe(false)
    expect(b.daChuyen).toBe(false)
    expect(dem(d1, 'cnh_exp_p08_chuyen_doi')).toBe(2)
    expect(dem(d1, 'cnh_exp_p08_state')).toBe(2)
  })

  it('§9.3 · cùng `migration_id` nhưng ẢNH CHỤP KHÁC ⇒ NÉM (không đổi số dư mở đầu)', async () => {
    const d1 = taoD1That()
    gieoVi(d1)
    await chuyenDoiP08(d1.env, yeuCau())
    await expect(chuyenDoiP08(d1.env, yeuCau({}, { gold: 999 }))).rejects.toMatchObject({ ma: 'KHONG_DU_DIEU_KIEN' })
    expect(Number(hang(d1)!.gold)).toBe(20) // số cũ KHÔNG đổi
  })

  it('§9.1 · hiệu lực SAI GIỜ hoặc SAI NGÀY ⇒ NÉM, không ghi gì', async () => {
    const d1 = taoD1That()
    gieoVi(d1)
    // 07:00 giờ VN (00:00Z) — không phải nửa đêm.
    await expect(chuyenDoiP08(d1.env, yeuCau({ effectiveAt: '2026-09-25T00:00:00.000Z' }))).rejects.toMatchObject({ ma: 'KHONG_DU_DIEU_KIEN' })
    // 00:00 giờ VN nhưng CÙNG NGÀY (không phải ngày kế tiếp).
    await expect(chuyenDoiP08(d1.env, yeuCau({ effectiveAt: '2026-09-23T17:00:00.000Z' }))).rejects.toMatchObject({ ma: 'KHONG_DU_DIEU_KIEN' })
    // Chuỗi rác.
    await expect(chuyenDoiP08(d1.env, yeuCau({ effectiveAt: 'khong-phai-ngay' }))).rejects.toMatchObject({ ma: 'KHONG_DU_DIEU_KIEN' })
    expect(dem(d1, 'cnh_exp_p08_chuyen_doi')).toBe(0)
    expect(dem(d1, 'cnh_exp_p08_state')).toBe(0)
    // Đúng 00:00 ngày kế tiếp ⇒ chạy được.
    const ok = await chuyenDoiP08(d1.env, yeuCau())
    expect(ok.daChuyen).toBe(false)
  })
})

describe('P08 chuyển đổi · ràng buộc SQL (`03` §9.2)', () => {
  it('cờ khiên ĐẦU phải KHỚP `first_claim_status` (claimed ⇒ 1; none/legacy_unresolved ⇒ 0)', () => {
    const d1 = taoD1That()
    const chen = (first: number, trangThai: string) =>
      d1.sql
        .prepare(
          `INSERT INTO cnh_exp_p08_state (student_id, first_shield_claimed, first_claim_status)
           VALUES (?, ?, ?)`,
        )
        .run(`X${first}${trangThai}`, first, trangThai)
    expect(() => chen(1, 'none')).toThrow(/CHECK/i)
    expect(() => chen(1, 'legacy_unresolved')).toThrow(/CHECK/i)
    expect(() => chen(0, 'claimed')).toThrow(/CHECK/i)
    expect(() => chen(1, 'bậy')).toThrow(/CHECK/i) // giá trị lạ
    expect(() => chen(0, 'none')).not.toThrow()
    expect(() => chen(1, 'claimed')).not.toThrow()
    expect(() => chen(0, 'legacy_unresolved')).not.toThrow()
  })
})
