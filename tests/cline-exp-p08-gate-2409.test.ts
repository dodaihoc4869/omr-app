// @vitest-environment node
// CNH-1.0 — CỬA P08 (`03` §6–§9): fail-closed, KHÔNG chạm substrate khi cửa đóng.
//
// Chạy trên `node:sqlite` + lược đồ THẬT. Dữ liệu TỔNG HỢP. Không deploy, không chạm dữ liệu thật.
import { describe, expect, it } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import { hapThuQuaP08, renKhienQuaP08 } from '../server/src/cnh-exp-adapter'

const NGAY = '2026-09-24'
const PHIEN_BAN = 'CNH-1.0'

const CUA_MO = { bangDaChay: true, phienBanChinhSach: PHIEN_BAN, duongCuConBat: false, viMoiLaChu: true, anhChupDaNoi: true }

function datCua(d1: D1That, c: Record<string, unknown>): void {
  d1.sql
    .prepare(
      "INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES ('cnh_exp_kich_hoat', ?, datetime('now')) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri",
    )
    .run(JSON.stringify(c))
}
function gieo(d1: D1That): void {
  d1.sql.prepare("INSERT INTO cnh_exp_account (student_id, wallet_exp, earned_exp, revision) VALUES ('S1', 400, 0, 0)").run()
  d1.sql.prepare("INSERT INTO cnh_exp_p08_state (student_id, absorbed_day, invested_exp, level) VALUES ('S1', ?, 0, 1)").run(NGAY)
  d1.sql.prepare("INSERT INTO cnh_exp_day (student_id, learning_day, policy_version, raw_core, achieved) VALUES ('S1', ?, ?, 0, 1)").run(NGAY, PHIEN_BAN)
}
const dem = (d1: D1That, bang: string) => Number((d1.sql.prepare(`SELECT COUNT(*) AS n FROM ${bang}`).get() as { n: number }).n)
const yc = () => ({ studentId: 'S1', learningDay: NGAY, requestId: 'R1', requestHash: 'h1' })

describe('Cửa P08 · ĐÓNG (mặc định) ⇒ NÉM và KHÔNG chạm substrate', () => {
  it('chưa có cờ ⇒ THIEU_BANG, KHÔNG ghi bảng nào của P08', async () => {
    const d1 = taoD1That()
    gieo(d1)
    await expect(hapThuQuaP08(d1.env, '/game-v2/invest', yc())).rejects.toMatchObject({ ma: 'THIEU_BANG' })
    expect(dem(d1, 'cnh_exp_command')).toBe(0)
    expect(dem(d1, 'cnh_exp_p08_guard')).toBe(0)
    expect(Number((d1.sql.prepare("SELECT wallet_exp AS w FROM cnh_exp_account WHERE student_id = 'S1'").get() as { w: number }).w)).toBe(400)
  })

  it('sai PHIÊN BẢN chính sách ⇒ SAI_PHIEN_BAN', async () => {
    const d1 = taoD1That()
    gieo(d1)
    datCua(d1, { ...CUA_MO, phienBanChinhSach: 'CNH-0.9' })
    await expect(hapThuQuaP08(d1.env, '/game-v2/invest', yc())).rejects.toMatchObject({ ma: 'SAI_PHIEN_BAN' })
  })

  it('HAI ĐƯỜNG TIỀN cùng bật ⇒ HAI_DUONG_TIEN (04 §5: không cộng hai lần)', async () => {
    const d1 = taoD1That()
    gieo(d1)
    datCua(d1, { ...CUA_MO, duongCuConBat: true, viMoiLaChu: true })
    await expect(hapThuQuaP08(d1.env, '/game-v2/invest', yc())).rejects.toMatchObject({ ma: 'HAI_DUONG_TIEN' })
  })

  it('thiếu ẢNH CHỤP ⇒ THIEU_ANH_CHUP', async () => {
    const d1 = taoD1That()
    gieo(d1)
    datCua(d1, { ...CUA_MO, anhChupDaNoi: false })
    await expect(hapThuQuaP08(d1.env, '/game-v2/invest', yc())).rejects.toMatchObject({ ma: 'THIEU_ANH_CHUP' })
  })

  it('đường LẠ hoặc NGOÀI LÁT (Đoàn của Aider) ⇒ CUA_KHONG_HOP_LE', async () => {
    const d1 = taoD1That()
    gieo(d1)
    datCua(d1, CUA_MO)
    await expect(hapThuQuaP08(d1.env, '/duong-khong-co', yc())).rejects.toMatchObject({ ma: 'CUA_KHONG_HOP_LE' })
    await expect(hapThuQuaP08(d1.env, '/game-v2/doan-nop', yc())).rejects.toMatchObject({ ma: 'CUA_KHONG_HOP_LE' })
  })
})

describe('Cửa P08 · MỞ ⇒ đi đúng lệnh P08', () => {
  it('cửa MỞ: hấp thụ chạy được (take 200), ghi receipt + cửa canh', async () => {
    const d1 = taoD1That()
    gieo(d1)
    datCua(d1, CUA_MO)
    const kq = await hapThuQuaP08(d1.env, '/game-v2/invest', yc())
    expect(kq).toMatchObject({ take: 200, walletAfter: 200, investedExpAfter: 200, levelAfter: 2 })
    expect(dem(d1, 'cnh_exp_command')).toBe(1)
    expect(dem(d1, 'cnh_exp_p08_guard')).toBe(1)
  })

  it('cửa MỞ nhưng em CHƯA chuyển đổi (thiếu trạng thái P08) ⇒ NOT_FOUND (đúng thứ tự bắt buộc)', async () => {
    const d1 = taoD1That()
    d1.sql.prepare("INSERT INTO cnh_exp_account (student_id, wallet_exp, earned_exp, revision) VALUES ('S1', 400, 0, 0)").run()
    datCua(d1, CUA_MO)
    await expect(hapThuQuaP08(d1.env, '/game-v2/invest', yc())).rejects.toMatchObject({ ma: 'NOT_FOUND' })
  })

  it('rèn khiên qua cửa MỞ cũng chạy (chưa đủ điều kiện ⇒ KHONG_DU_DIEU_KIEN, không ghi)', async () => {
    const d1 = taoD1That()
    gieo(d1)
    datCua(d1, CUA_MO)
    await expect(renKhienQuaP08(d1.env, '/game-v2/khien-ren', yc())).rejects.toMatchObject({ ma: 'KHONG_DU_DIEU_KIEN' })
    expect(dem(d1, 'cnh_exp_spend_ledger')).toBe(0)
  })
})
