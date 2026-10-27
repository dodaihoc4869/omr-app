// @vitest-environment node
// ĐỆM THEO KHO trong isolate (28/10 — Analytics D1 27/10 19–23h: câu rút gọn của tờ 8 %, siêu dữ liệu câu ~6 % thời gian D1; kho gần như tĩnh): mỗi khoá đọc D1
// nhiều nhất MỘT lần / 30 phút; quá 5 phút hỏi dấu kho (một dòng); dấu đổi (thầy sửa kho) ⇒ đọc lại NGAY; lượt cùng lúc chờ chung; bộ nhớ có trần.
import { afterEach, beforeEach, expect, it } from 'vitest'
import { batDemTheoKho, DemTheoKho, xoaDemTheoKho } from '../server/src/dau-kho-cau'
import type { Env } from '../server/src/kieu'

beforeEach(() => batDemTheoKho(true))
afterEach(() => { batDemTheoKho(false); xoaDemTheoKho() })

function khoGia() {
  const tt = { dau: '268|2026-10-07T04:02:57.847Z', lanDau: 0 }
  const env = { DB: { prepare: () => ({ first: async () => { tt.lanDau++; return { d: tt.dau } } }) } } as unknown as Env
  return { env, tt }
}
const T0 = Date.parse('2026-10-28T12:00:00Z')

it('đọc D1 một lần / khoá; trong 5 phút không hỏi dấu; quá 5 phút dấu y nguyên ⇒ vẫn dùng đệm; dấu đổi ⇒ đọc lại ngay', async () => {
  const { env, tt } = khoGia()
  const dem = new DemTheoKho<{ qids: string[] }>()
  let lanDoc = 0
  const doc = async () => { lanDoc++; return { qids: ['q1', 'q2'] } }
  expect(await dem.lay(env, 'A', T0, doc)).toEqual({ qids: ['q1', 'q2'] })
  await dem.lay(env, 'A', T0 + 60_000, doc)
  expect([lanDoc, tt.lanDau]).toEqual([1, 0])
  await dem.lay(env, 'A', T0 + 6 * 60_000, doc)
  expect([lanDoc, tt.lanDau]).toEqual([1, 1])
  tt.dau = '269|2026-10-28T12:10:00.000Z' // thầy lập lại chỉ mục một tờ
  await dem.lay(env, 'A', T0 + 12 * 60_000, doc)
  expect(lanDoc).toBe(2)
  await dem.lay(env, 'A', T0 + 13 * 60_000, doc)
  expect(lanDoc).toBe(2)
  await dem.lay(env, 'A', T0 + 13 * 60_000 + 31 * 60_000, doc) // quá hạn tối đa 30 phút ⇒ đọc lại dù dấu y nguyên
  expect(lanDoc).toBe(3)
})

it('lượt cùng khoá đến cùng lúc chờ chung MỘT lượt đọc; lỗi đọc không bị đệm', async () => {
  const { env } = khoGia()
  const dem = new DemTheoKho<number>()
  let lanDoc = 0, tra: (v: number) => void = () => {}
  const doc = () => { lanDoc++; return new Promise<number>((ok) => { tra = ok }) }
  const a = dem.lay(env, 'K', T0, doc), b = dem.lay(env, 'K', T0, doc)
  tra(7)
  expect(await Promise.all([a, b])).toEqual([7, 7])
  expect(lanDoc).toBe(1)
  let loi = 0
  await expect(dem.lay(env, 'L', T0, async () => { loi++; throw new Error('D1 bận') })).rejects.toThrow('D1 bận')
  expect(await dem.lay(env, 'L', T0, async () => { loi++; return 1 })).toBe(1)
  expect(loi).toBe(2)
})

it('bộ nhớ có trần: vượt số khoá / tổng trọng lượng ⇒ bỏ khoá cũ nhất', async () => {
  const { env } = khoGia()
  const dem = new DemTheoKho<string[]>(30 * 60_000, 5 * 60_000, 2, 10)
  let lanDoc = 0
  const doc = (n: number) => async () => { lanDoc++; return Array.from({ length: n }, (_, i) => `q${i}`) }
  await dem.lay(env, 'A', T0, doc(3), (v) => v.length)
  await dem.lay(env, 'B', T0, doc(3), (v) => v.length)
  await dem.lay(env, 'C', T0, doc(3), (v) => v.length) // quá 2 khoá ⇒ bỏ A
  await dem.lay(env, 'A', T0, doc(3), (v) => v.length)
  expect(lanDoc).toBe(4)
  await dem.lay(env, 'D', T0, doc(9), (v) => v.length) // nặng ⇒ chỉ còn D
  await dem.lay(env, 'D', T0, doc(9), (v) => v.length)
  expect(lanDoc).toBe(5)
})

it('bộ test mặc định TẮT đệm: đọc thẳng mỗi lần', async () => {
  batDemTheoKho(false)
  const { env } = khoGia()
  const dem = new DemTheoKho<number>()
  let lanDoc = 0
  await dem.lay(env, 'A', T0, async () => ++lanDoc)
  await dem.lay(env, 'A', T0, async () => ++lanDoc)
  expect(lanDoc).toBe(2)
})
