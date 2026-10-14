// @vitest-environment node
// GIỜ CAO ĐIỂM 14/10: danh sách chiến dịch (`SELECT * FROM chien_dich …`, 3.238 lần/3 giờ cao điểm 13/10) đệm 60 giây thay 15 giây trong isolate;
// ghi trong isolate vẫn xoá đệm ngay (`xoaDemChienDich`).
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { taoKhoOmni, themChienDich } from './omni-3-ke-hoach-chung'
import { docChienDichCuaEm, xoaDemChienDich } from '../server/src/srs2-d1'

const T = Date.parse('2026-10-14T13:00:00Z')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T); xoaDemChienDich() })
afterEach(() => { vi.useRealTimers(); xoaDemChienDich() })

it('chiến dịch mới ghi ngoài isolate: chưa thấy ở giây 30, thấy ở giây 61; xoaDemChienDich ⇒ thấy ngay', async () => {
  const k = taoKhoOmni({ 'DH-B8': 4 }, 2)
  const qids = k.qids('DH-B8')
  themChienDich(k.d, { id: 'cd-1', qids, maDe: ['DH-B8'], sbd: ['S1'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 10, huyetChien: false })
  expect((await docChienDichCuaEm(k.env, 'S1')).map((c) => c.id)).toEqual(['cd-1'])
  // Ghi THẲNG vào D1 (như một isolate khác ghi) — `themChienDich` của bộ thử tự xoá đệm nên không dùng ở đây.
  const chep = (id: string, luc: string) => k.d.sql.prepare(`INSERT INTO chien_dich (id, ten, lop, sbd_json, ma_de_json, qid_json, han_nop, the_luc_ngay, huyet_chien, ma_ca, tao_luc, trang_thai)
    SELECT ?, ten, lop, sbd_json, ma_de_json, qid_json, han_nop, the_luc_ngay, huyet_chien, ma_ca, ?, trang_thai FROM chien_dich WHERE id='cd-1'`).run(id, luc)
  chep('cd-2', '2026-10-02T00:00:00Z')
  vi.setSystemTime(T + 30_000)
  expect((await docChienDichCuaEm(k.env, 'S1')).map((c) => c.id)).toEqual(['cd-1'])
  vi.setSystemTime(T + 61_000)
  expect((await docChienDichCuaEm(k.env, 'S1')).map((c) => c.id).sort()).toEqual(['cd-1', 'cd-2'])
  chep('cd-3', '2026-10-03T00:00:00Z')
  xoaDemChienDich()
  expect((await docChienDichCuaEm(k.env, 'S1')).map((c) => c.id).sort()).toEqual(['cd-1', 'cd-2', 'cd-3'])
})
