// @vitest-environment node
// CNH-1.0 P08 — BẰNG CHỨNG NỐI ROUTE: nhánh `vang-doi` (shop) + `shield-use` (game) đi cửa P08.
//
// Chạy trên `node:sqlite` + lược đồ THẬT. Dữ liệu TỔNG HỢP. Chứng minh: cửa ĐÓNG (mặc định) ⇒ KHÔNG
// chạm substrate P08; cửa MỞ ⇒ đi đúng lệnh P08 (ghi sổ tiêu P08 + `vang_so`, chuyển unused→used).
import { describe, expect, it } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import { shopAction } from '../server/src/game-v2-shop'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import type { Profile } from '../server/src/game-v2'

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
const hoSo = (wallet = 1000): Profile =>
  ({ pet: 'dat_quy', choice: false, legacy: null, cap: 1, exp: 0, wallet, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z' }) as unknown as Profile
const gieoHoSo = (d1: D1That, sbd: string, wallet = 1000) =>
  d1.sql.prepare('INSERT INTO game_v2_profile (sbd, revision, json, created_at) VALUES (?, 0, ?, ?)').run(sbd, JSON.stringify(hoSo(wallet)), 'x')
const dem = (d1: D1That, bang: string, dk = '1=1') =>
  Number((d1.sql.prepare(`SELECT COUNT(*) AS n FROM ${bang} WHERE ${dk}`).get() as { n: number }).n)
const tongVang = (d1: D1That, sbd = 'S1') =>
  Number((d1.sql.prepare('SELECT COALESCE(SUM(so_vang),0) AS t FROM vang_so WHERE sbd = ?').get(sbd) as { t: number }).t)
const docLai = (p: Profile) => async () => ({ profile: p, revision: 0 })

/** Ví P07 + trạng thái P08 (điều kiện để lệnh P08 chạy được). */
function gieoP07(d1: D1That, sbd: string, o: { wallet?: number; unused?: number; used?: number; gold?: number } = {}): void {
  d1.sql.prepare('INSERT INTO cnh_exp_account (student_id, wallet_exp, earned_exp, revision) VALUES (?, ?, 0, 0)').run(sbd, o.wallet ?? 1000)
  d1.sql
    .prepare("INSERT INTO cnh_exp_p08_state (student_id, absorbed_day, invested_exp, level, unused_shields, used_shields, gold) VALUES (?, ?, 0, 1, ?, ?, ?)")
    .run(sbd, NGAY, o.unused ?? 0, o.used ?? 0, o.gold ?? 0)
}

describe('P08 nối route · SHOP `vang-doi` (§8)', () => {
  it('cửa ĐÓNG (mặc định) ⇒ KHÔNG chạm substrate P08', async () => {
    const d1 = taoD1That()
    gieoHoSo(d1, 'S1')
    gieoP07(d1, 'S1', { wallet: 700 })
    await shopAction(d1.env, 'S1', hoSo(700), 0, 'vang-doi', { khoaYeuCau: 'khoa-du-16-ky-tu', soExp: 300 }, docLai(hoSo(700)))
    expect(dem(d1, 'cnh_exp_spend_ledger')).toBe(0) // nhánh P08 KHÔNG chạy
    expect(tongVang(d1)).toBe(0)
  })

  it('cửa MỞ ⇒ đi lệnh `doiVangCore`: sổ tiêu P08 + `vang_so` + gương `gold` CÙNG giao dịch', async () => {
    const d1 = taoD1That()
    gieoHoSo(d1, 'S1')
    gieoP07(d1, 'S1', { wallet: 700, gold: 0 })
    datCua(d1, CUA_MO)
    const kq = await shopAction(d1.env, 'S1', hoSo(700), 0, 'vang-doi', { khoaYeuCau: 'khoa-du-16-ky-tu', soExp: 300 }, docLai(hoSo(700)))
    expect(kq).toMatchObject({ ok: true, daDoi: 300, vang: 300, ongNghiem: 400, lapLai: false })
    expect(dem(d1, 'cnh_exp_spend_ledger', "command_type = 'doi_vang'")).toBe(1)
    expect(tongVang(d1)).toBe(300) // shop đọc SUM(vang_so) ⇒ thấy vàng vừa đổi
    expect(Number((d1.sql.prepare("SELECT gold AS g FROM cnh_exp_p08_state WHERE student_id = 'S1'").get() as { g: number }).g)).toBe(300)
    expect(Number((d1.sql.prepare("SELECT wallet_exp AS w FROM cnh_exp_account WHERE student_id = 'S1'").get() as { w: number }).w)).toBe(400)
  })

  it('cửa MỞ nhưng CHƯA chuyển đổi ⇒ NÉM `NOT_FOUND` (đúng thứ tự: chuyển TRƯỚC, bật cờ SAU)', async () => {
    const d1 = taoD1That()
    gieoHoSo(d1, 'S1')
    datCua(d1, CUA_MO)
    await expect(shopAction(d1.env, 'S1', hoSo(700), 0, 'vang-doi', { khoaYeuCau: 'khoa-du-16-ky-tu', soExp: 300 }, docLai(hoSo(700)))).rejects.toMatchObject({ ma: 'NOT_FOUND' })
    expect(tongVang(d1)).toBe(0)
  })

  it('cửa MỞ: xuyên dự trữ 400 ⇒ NÉM `KHONG_DU_DIEU_KIEN`, không ghi gì', async () => {
    const d1 = taoD1That()
    gieoHoSo(d1, 'S1')
    gieoP07(d1, 'S1', { wallet: 700 })
    datCua(d1, CUA_MO)
    await expect(shopAction(d1.env, 'S1', hoSo(700), 0, 'vang-doi', { khoaYeuCau: 'khoa-du-16-ky-tu', soExp: 301 }, docLai(hoSo(700)))).rejects.toMatchObject({ ma: 'KHONG_DU_DIEU_KIEN' })
    expect(dem(d1, 'cnh_exp_spend_ledger')).toBe(0)
  })
})

describe('P08 nối route · `shield-use` (§7.2)', () => {
  // ⚠️ TỪ 25/09: nhánh P08 đòi CẢ `khoaYeuCau` (không chỉ cửa mở) — nút "dùng khiên" hiện có đã gửi `useId`,
  // nếu chỉ kiểm cửa thì vừa mở cổng là em bấm khiên rơi ngay vào P08 (nhận `{ok,p08}` không có `profile`).
  const goi = async (d: D1That, useId: string, khoaYeuCau?: string) =>
    (await gameV2(d.env, 'shield-use', { token: await gameToken(d.env, 'S1'), useId, ...(khoaYeuCau ? { khoaYeuCau } : {}) })) as Record<string, unknown>
  const gieoEm = (d1: D1That) => {
    d1.sql.prepare("INSERT INTO hoc_sinh (sbd, ho_ten, lop, mat_khau, cap_nhat_luc) VALUES ('S1','Em S1','12','mk','x')").run()
    gieoHoSo(d1, 'S1')
  }

  it('cửa MỞ + CÓ `khoaYeuCau` ⇒ chuyển 1 khiên CHƯA DÙNG → ĐÃ DÙNG kèm usage receipt', async () => {
    const d1 = taoD1That()
    gieoEm(d1)
    gieoP07(d1, 'S1', { unused: 2, used: 0 })
    datCua(d1, CUA_MO)
    const kq = await goi(d1, 'use-abcdefghijklmnop', 'khoa-dung-khien-01')
    expect(kq).toMatchObject({ ok: true, p08: { unusedAfter: 1, usedAfter: 1 } })
    expect(dem(d1, 'cnh_exp_spend_ledger', "command_type = 'dung_khien'")).toBe(1)
    expect(Number((d1.sql.prepare("SELECT unused_shields AS u FROM cnh_exp_p08_state WHERE student_id='S1'").get() as { u: number }).u)).toBe(1)
  })

  it('🔴 cửa MỞ nhưng KHÔNG gửi `khoaYeuCau` ⇒ vẫn đi đường CŨ (nút khiên hiện có không tự rơi vào P08)', async () => {
    const d1 = taoD1That()
    gieoEm(d1)
    gieoP07(d1, 'S1', { unused: 2, used: 0 })
    datCua(d1, CUA_MO)
    await expect(goi(d1, 'use-abcdefghijklmnop')).rejects.toThrow(/Em chưa có khiên/)
    expect(dem(d1, 'cnh_exp_spend_ledger')).toBe(0)
    expect(Number((d1.sql.prepare("SELECT unused_shields AS u FROM cnh_exp_p08_state WHERE student_id='S1'").get() as { u: number }).u)).toBe(2)
  })

  it('cửa ĐÓNG (mặc định) ⇒ đường CŨ (ném đúng lời cũ), KHÔNG chạm substrate P08', async () => {
    const d1 = taoD1That()
    gieoEm(d1)
    gieoP07(d1, 'S1', { unused: 2, used: 0 })
    // Hồ sơ CŨ không có khiên ⇒ đường CŨ ném đúng lời cũ ⇒ chứng minh KHÔNG đi nhánh P08.
    await expect(goi(d1, 'use-abcdefghijklmnop', 'khoa-dung-khien-01')).rejects.toThrow(/Em chưa có khiên/)
    expect(dem(d1, 'cnh_exp_spend_ledger')).toBe(0)
    expect(Number((d1.sql.prepare("SELECT unused_shields AS u FROM cnh_exp_p08_state WHERE student_id='S1'").get() as { u: number }).u)).toBe(2)
  })

  it('cửa MỞ + có `khoaYeuCau` + hết khiên chưa dùng ⇒ NÉM `KHONG_DU_DIEU_KIEN`', async () => {
    const d1 = taoD1That()
    gieoEm(d1)
    gieoP07(d1, 'S1', { unused: 0, used: 0 })
    datCua(d1, CUA_MO)
    await expect(goi(d1, 'use-abcdefghijklmnop', 'khoa-dung-khien-01')).rejects.toMatchObject({ ma: 'KHONG_DU_DIEU_KIEN' })
  })
})
