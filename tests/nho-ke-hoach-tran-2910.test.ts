// @vitest-environment node
// BỘ NHỚ (thầy 29/10 «tức thì giờ cao điểm 100%»; đo 28/10 19–23h: 1 367 lượt `exceededMemory`): bản nhớ kế hoạch Sảnh giữ cả `lap` (nhiều MB) —
// trần cũ 2000 em/isolate + chỉ dọn khi ghi. Nay: trần NHO_TOI_DA, quá trần ⇒ bỏ bản CŨ NHẤT (không xoá cả bảng), bản hết hạn bị dọn khi ghi/lấy.
import { expect, it } from 'vitest'
import { NHO_KE_HOACH_MS, NHO_TOI_DA, layKeHoach7, nhoKeHoach7 } from '../server/src/goi-bai-7-nho'

const muc = (luc: number) => ({ luc, lap: { to: 'lớn' }, daLam: new Set<string>(), vuaLam: new Set<string>(), soVua: 0 })

it('quá trần ⇒ chỉ bỏ bản cũ nhất; bản mới nhất vẫn lấy được; không bao giờ giữ quá NHO_TOI_DA', () => {
  const db = {}
  const now = 1_000_000
  for (let i = 0; i < NHO_TOI_DA + 10; i++) nhoKeHoach7(db, 'S' + i, muc(now + i))
  const t = now + NHO_TOI_DA + 10
  expect(layKeHoach7(db, 'S0', t)).toBeNull() // cũ nhất đã bị bỏ
  expect(layKeHoach7(db, 'S9', t)).toBeNull()
  expect(layKeHoach7(db, 'S' + (NHO_TOI_DA + 9), t)).not.toBeNull() // mới nhất còn
  expect(layKeHoach7(db, 'S' + (NHO_TOI_DA + 9), t)).toBeNull() // lấy là xoá
  let con = 0
  for (let i = 0; i < NHO_TOI_DA + 10; i++) if (layKeHoach7(db, 'S' + i, t)) con++
  expect(con).toBeLessThanOrEqual(NHO_TOI_DA - 1)
  expect(con).toBeGreaterThan(0) // KHÔNG xoá sạch bảng như trước
})

it('bản hết hạn bị dọn khi ghi bản mới; bản còn hạn giữ', () => {
  const db = {}
  nhoKeHoach7(db, 'A', muc(0))
  nhoKeHoach7(db, 'B', muc(NHO_KE_HOACH_MS - 1))
  nhoKeHoach7(db, 'C', muc(NHO_KE_HOACH_MS + 1)) // A quá hạn ⇒ dọn
  expect(layKeHoach7(db, 'A', NHO_KE_HOACH_MS + 1)).toBeNull()
  expect(layKeHoach7(db, 'B', NHO_KE_HOACH_MS + 1)).not.toBeNull()
})
