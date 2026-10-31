// @vitest-environment node
// NGĂN RIÊNG TỪNG HỌC SINH (30/10): lệnh app học sinh đi vào Durable Object của đúng em; kết quả y hệt đường cũ; lỗi ngăn ⇒ đường cũ với đúng thân gói;
// đăng nhập / thi / GET / thiếu token ⇒ không vào ngăn.
import { describe, expect, it } from 'vitest'
import worker, { NganHocSinh } from '../server/src/index'
import { DAU_TRONG_NGAN, datXuLyNgan, laDuongNgan, sbdChonNgan, xoaEnvChungNgan } from '../server/src/ngan-hoc-sinh'
import { gameToken } from '../server/src/game-v2-auth'
import { dbGoc } from '../server/src/cau-hinh-dem'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import type { Env } from '../server/src/kieu'

function khoCoNgan(loi = false) {
  xoaEnvChungNgan() // mỗi ca một D1 giả riêng (máy thật: mọi ngăn cùng ràng buộc)
  const k = taoKhoOmni({}, 3)
  k.d.sql.exec(`UPDATE hoc_sinh SET mat_khau='mk'`)
  const vao: { ten: string; dau: boolean }[] = []
  const goiY: string[] = []
  const viec: Promise<unknown>[] = []
  const env = { ...k.env, TAT_NGAN_DINH: '1' } as Env // đường apac| (ngăn trung chuyển: tests/ngan-sat-d1-3110.test.ts)
  env.NGAN_HS = {
    idFromName: (ten: string) => ({ toString: () => ten }),
    get: (id, tuy) => ({
      ...(goiY.push(tuy?.locationHint ?? ''), {}),
      fetch: async (req: Request) => {
        if (loi) throw new Error('ngăn hỏng')
        vao.push({ ten: id.toString(), dau: req.headers.has(DAU_TRONG_NGAN) })
        const state = { waitUntil: (p: Promise<unknown>) => { viec.push(p) } } as never
        return new NganHocSinh(state, env).fetch(req)
      },
    }),
  }
  return { k, env, vao, viec, goiY }
}
const goi = (env: Env, duong: string, than: unknown, init: RequestInit = {}) =>
  worker.fetch(new Request(`https://test${duong}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(than), ...init }), env, { waitUntil() {}, passThroughOnException() {} } as never)

describe('ngăn riêng từng học sinh', () => {
  it('đọc SBD từ token game (chưa kiểm chữ ký — chỉ để chọn ngăn)', async () => {
    const { k } = khoCoNgan()
    expect(sbdChonNgan({ token: await gameToken(k.env, 'S2') })).toBe('S2')
    expect(sbdChonNgan({ token: 'rác' })).toBeNull()
    expect(sbdChonNgan({ token: `${btoa(JSON.stringify({ sbd: "x'; DROP" }))}.k` })).toBeNull()
    expect(sbdChonNgan({})).toBeNull()
    expect(laDuongNgan('/game-v2/hoc-tap-sanh')).toBe(true)
    expect(laDuongNgan('/hs/ke-hoach-ngay')).toBe(true)
    expect(laDuongNgan('/hs/dang-nhap')).toBe(false)
    expect(laDuongNgan('/nop')).toBe(false)
    expect(laDuongNgan('/vao-thi')).toBe(false)
    expect(laDuongNgan('/gv/bang-tin')).toBe(false)
  })

  it('lệnh học sinh vào đúng ngăn của em, kết quả y hệt đường cũ', async () => {
    const a = khoCoNgan()
    const token = await gameToken(a.k.env, 'S1')
    const quaNgan = await (await goi(a.env, '/game-v2/hoc-tap-dem', { token })).json() as Record<string, unknown>
    expect(a.vao).toEqual([{ ten: 'apac|S1', dau: true }])
    expect(a.goiY).toEqual(['apac']) // ngăn luôn tạo ở châu Á, sát D1
    const b = khoCoNgan()
    const thang = await (await goi(b.k.env, '/game-v2/hoc-tap-dem', { token: await gameToken(b.k.env, 'S1') })).json() as Record<string, unknown>
    expect(quaNgan.ok).toBe(true)
    expect({ ...quaNgan, serverNow: 0 }).toEqual({ ...thang, serverNow: 0 })
  })

  it('đăng nhập, thi, thiếu token ⇒ không vào ngăn', async () => {
    const a = khoCoNgan()
    await goi(a.env, '/hs/dang-nhap', { sbd: 'S1', matKhau: 'mk' })
    await goi(a.env, '/nop', { sbd: 'S1' })
    await goi(a.env, '/game-v2/hoc-tap-dem', {})
    expect(a.vao).toEqual([])
  })

  it('ngăn lỗi ⇒ tự chạy đường cũ với đúng thân gói', async () => {
    const a = khoCoNgan(true)
    const r = await (await goi(a.env, '/game-v2/hoc-tap-dem', { token: await gameToken(a.k.env, 'S1') })).json() as Record<string, unknown>
    expect(r.ok).toBe(true)
  })

  it('công tắc TAT_NGAN_HS ⇒ không vào ngăn', async () => {
    const a = khoCoNgan()
    a.env.TAT_NGAN_HS = '1'
    await goi(a.env, '/game-v2/hoc-tap-dem', { token: await gameToken(a.k.env, 'S1') })
    expect(a.vao).toEqual([])
  })

  it('mọi ngăn trong isolate dùng CHUNG một env (đệm dữ liệu chung không nhân bản theo em)', async () => {
    xoaEnvChungNgan()
    const thay: unknown[] = []
    datXuLyNgan(async (_r, e) => { thay.push(e.DB); return new Response('{}') })
    const a = { DB: {} } as unknown as Env, b = { DB: {} } as unknown as Env
    const st = { waitUntil() {} } as never
    await new NganHocSinh(st, a).fetch(new Request('https://t/game-v2/x', { method: 'POST', body: '{}' }))
    await new NganHocSinh(st, b).fetch(new Request('https://t/game-v2/x', { method: 'POST', body: '{}' }))
    expect(dbGoc(thay[0] as object)).toBe(dbGoc(thay[1] as object)) // cùng D1 gốc (lệnh được chọn đo mang bản xem đếm câu — khoá đệm vẫn là D1 gốc)
    datXuLyNgan((r, e, c) => worker.fetch(r, e, c))
    xoaEnvChungNgan()
  })
})
