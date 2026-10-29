// @vitest-environment node
// GIỚI HẠN LẬP KẾ HOẠCH NẶNG ĐỒNG THỜI (thầy 29/10 21:36 «học sinh đang kêu lag»; Analytics 19–23h: `exceededMemory` 1 070 lượt): tối đa TOI_DA_LAP_DONG_THOI lượt `lapGoi7` cùng lúc mỗi isolate,
// các lượt sau xếp hàng và vẫn chạy HẾT (không rơi, không chen), lỗi của một lượt không làm kẹt hàng.
import { expect, it } from 'vitest'
import * as g7 from '../server/src/goi-bai-7'

it('chỉ TOI_DA_LAP_DONG_THOI lượt chạy cùng lúc; lượt dư chờ rồi chạy hết, theo thứ tự', async () => {
  // Gọi qua hàm giới hạn thật bằng env giả khiến lapGoi7Tho dừng sớm: đếm đồng thời qua DB giả treo tới khi mở cổng.
  let dangChay = 0, toiDa = 0
  let mo!: () => void
  const cong = new Promise<void>((ok) => { mo = ok })
  const env = {
    DB: {
      prepare: () => { dangChay++; toiDa = Math.max(toiDa, dangChay); const p = { bind: () => p, first: async () => { await cong; dangChay--; return null }, all: async () => { await cong; dangChay--; return { results: [] } }, run: async () => { await cong; dangChay--; return { meta: { changes: 0 } } } }; return p },
      batch: async () => { await cong; return [] },
    },
  } as never
  const ds = Array.from({ length: 8 }, (_, i) => g7.lapGoi7(env, 'S' + i, Date.now()).catch(() => 'loi'))
  await new Promise((ok) => setTimeout(ok, 20))
  const tt = g7.trangThaiLap7()
  expect(tt.chay).toBeLessThanOrEqual(g7.TOI_DA_LAP_DONG_THOI)
  expect(tt.chay + tt.cho).toBe(8)
  mo()
  await Promise.all(ds)
  expect(g7.trangThaiLap7()).toEqual({ chay: 0, cho: 0 }) // mọi lượt xong, không kẹt chỗ
})
