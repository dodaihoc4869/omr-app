// @vitest-environment node
// OMNI 3 · CHƯƠNG TRÌNH "CẨN THẬN" — `canThan` trong khối `omni` của Sảnh (`hoa2-sanh`) trên D1 thật (node:sqlite, đủ migration). LÀN B, đợt 2 sáng 06/10.
// Hồ sơ phát lại: giữ phatLaiEm thật nhưng ghi đè Sơ ý + số lượt vững (cùng cách tests/omni-3-d1.test.ts) để đặt Sơ ý tuỳ ý.
import { beforeEach, describe, expect, it, vi } from 'vitest'

const gia = vi.hoisted(() => ({ ghiDe: {} as Record<string, { sEm: number; nVung: number }> }))
vi.mock('../server/src/omni-p-vkn', async (goc) => {
  const m = await goc<typeof import('../server/src/omni-p-vkn')>()
  return { ...m, phatLaiEm: vi.fn((sbd: string, dv: import('../server/src/omni-p-vkn').DauVaoPhatLai) => { const hs = m.phatLaiEm(sbd, dv); const o = gia.ghiDe[sbd]; return o ? { ...hs, ...o } : hs }) }
})

import { taoD1That } from './_d1-that'
import { omniChoSanh, xoaDemOmni } from '../server/src/omni-d1'
import { sanh2 } from '../server/src/srs2-d1'
import { LENH_HOA2 } from '../server/src/srs2-game'
import { THAM_SO_OMNI } from '../server/src/omni-kieu'
import { LENH_OMNI_HOA2 } from '../server/src/omni-game'
import type { Env } from '../server/src/kieu'

const T0 = Date.parse('2026-10-06T03:00:00Z') // 10:00 Thứ Ba 06/10/2026 giờ VN
const KHOA_CU = ['baiDangLuyen', 'bat', 'chungChi', 'choBaiMoi', 'conDangDe8', 'dangVung', 'deThu', 'metGio', 'nhatKy', 'onBaiCu', 'sEm', 'sMucTieu', 've']

function dung(omni: boolean = true) {
  const d = taoD1That()
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Em 1','12A1','mk','x'),('S2','Em 2','12A1','mk','x')")
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true}','x')`)
  if (omni) d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('omni','{"bat":true}','x')`)
  return { d, env: d.env as unknown as Env }
}
const NGU = { tong: 10, con: 4, chienDichId: null as string | null }
beforeEach(() => { gia.ghiDe = {}; xoaDemOmni() })

describe('Sảnh — omni.canThan (chỉ-thêm, CHỈ khi true)', () => {
  it('Sơ ý > 0,07 (đủ dữ liệu) ⇒ canThan: true; đúng số sEm em thấy ở Sảnh', async () => {
    const { env } = dung()
    gia.ghiDe.S1 = { sEm: 0.12, nVung: 30 }
    const r = (await omniChoSanh(env, 'S1', T0, NGU))!
    expect(r.canThan).toBe(true)
    expect(r.sEm).toBe(0.12)
    expect(r.sMucTieu).toBe(THAM_SO_OMNI.C_SO_Y)
    expect(Object.keys(r).sort()).toEqual([...KHOA_CU, 'canThan'].sort())
  })
  it('Sơ ý ≤ 0,07 (kể cả đúng 0,07) ⇒ KHÔNG có trường canThan — khối omni y hệt hôm nay', async () => {
    const { env } = dung()
    for (const sEm of [0.03, 0.06, 0.07]) {
      gia.ghiDe.S1 = { sEm, nVung: 30 }
      xoaDemOmni()
      const r = (await omniChoSanh(env, 'S1', T0, NGU))!
      expect('canThan' in r, `sEm ${sEm}`).toBe(false)
      expect(Object.keys(r).sort()).toEqual([...KHOA_CU].sort())
    }
  })
  it('chưa đủ dữ liệu (< 10 lượt vững; Sảnh không hiện số Sơ ý) ⇒ KHÔNG canThan, kể cả hồ sơ rỗng (prior 0,08 > 0,07)', async () => {
    const { env } = dung()
    gia.ghiDe.S1 = { sEm: 0.4, nVung: 9 }
    const r = (await omniChoSanh(env, 'S1', T0, NGU))!
    expect(r.sEm).toBeNull()
    expect('canThan' in r).toBe(false)
    gia.ghiDe = {}; xoaDemOmni() // hồ sơ rỗng thật: 0 lượt vững, Sơ ý = prior 0,08
    const rong = (await omniChoSanh(env, 'S1', T0, NGU))!
    expect(rong.sEm).toBeNull()
    expect('canThan' in rong).toBe(false)
  })
  it('OMNI tắt ⇒ không có khối omni; hoa2-sanh (sanh2) của em OMNI bật có canThan, của em khác (không Sơ ý cao) không có', async () => {
    const tat = dung(false)
    gia.ghiDe.S1 = { sEm: 0.3, nVung: 50 }
    expect(await omniChoSanh(tat.env, 'S1', T0, NGU)).toBeNull()
    expect('omni' in (await sanh2(tat.env, 'S1', T0) as Record<string, unknown>)).toBe(false)
    xoaDemOmni()
    const { env } = dung()
    gia.ghiDe = { S1: { sEm: 0.3, nVung: 50 }, S2: { sEm: 0.04, nVung: 50 } }
    const s1 = (await sanh2(env, 'S1', T0)) as { omni?: { canThan?: boolean; sEm: number | null } }
    const s2 = (await sanh2(env, 'S2', T0)) as { omni?: { canThan?: boolean; sEm: number | null } }
    expect(s1.omni?.canThan).toBe(true)
    expect(s2.omni).toBeTruthy()
    expect('canThan' in s2.omni!).toBe(false)
  })
  it('lệnh hoa2-omni-buoc-sai nằm trong cổng lệnh Hoá 2.0 của game', () => {
    expect(LENH_OMNI_HOA2).toContain('hoa2-omni-buoc-sai')
    expect(LENH_HOA2.has('hoa2-omni-buoc-sai')).toBe(true)
  })
})
