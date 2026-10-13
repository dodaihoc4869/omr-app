// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { parentPass } from '../server/src/game-v2-auth'
import type { Env } from '../server/src/kieu'

describe('cấp liên kết phụ huynh khi D1 lỗi', () => {
  it('không biến lỗi đọc mật khẩu thành liên kết không ràng buộc mật khẩu', async () => {
    const loi = new Error('D1 DB is overloaded')
    const first = vi.fn(async () => { throw loi })
    const st = { bind: () => st, first }
    const env = { DB: { prepare: () => st }, MA_BI_MAT: 'ma-thu-nghiem' } as unknown as Env
    await expect(parentPass(env, 'HS1')).rejects.toBe(loi)
    expect(first).toHaveBeenCalledTimes(1)
  })
})
