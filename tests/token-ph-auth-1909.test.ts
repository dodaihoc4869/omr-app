// @vitest-environment node
// MÃ PHỤ HUYNH (server/src/game-v2-auth.ts) — nền của token PH giai đoạn mềm: ràng buộc mật khẩu em (thu hồi), token cũ vẫn dùng được,
// mã PH KHÔNG bao giờ là phiên học sinh, và mã hỏng không làm sập lệnh (lỗi có chữ, không TypeError).
import { describe, it, expect } from 'vitest'
import { gameIdentity, gameToken, parentIdentity, parentPass } from '../server/src/game-v2-auth'
import { taoD1That, type D1That } from './_d1-that'

const themEm = (d: D1That, sbd: string, matKhau: string | null) => d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,mat_khau,cap_nhat_luc) VALUES(?,'Em',?,'x')").run(sbd, matKhau)
const giaiMa = (t: string) => JSON.parse(atob(t.split('.')[0]!)) as Record<string, unknown>
/** Ký y như máy chủ (HMAC-SHA256, hex, khoá = MA_BI_MAT) để dựng token với dữ liệu tuỳ ý. */
async function ky(d: D1That, payload: Record<string, unknown>): Promise<string> {
  const p = btoa(JSON.stringify(payload))
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(String(d.env.MA_BI_MAT)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const s = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(p))
  return `${p}.${[...new Uint8Array(s)].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}
const NGAY = 86_400_000

describe('mã phụ huynh gắn mật khẩu của em', () => {
  it('em có mật khẩu: token mang `pk` (băm mật khẩu), KHÔNG mang `pwd`; parentIdentity trả đúng SBD', async () => {
    const d = taoD1That(); themEm(d, 'S1', 'mk-1')
    const t = await parentPass(d.env, 'S1')
    const o = giaiMa(t)
    expect(o).toMatchObject({ sbd: 'S1', purpose: 'game-parent' })
    expect(typeof o.pk).toBe('string')
    expect('pwd' in o).toBe(false)
    expect(await parentIdentity(d.env, t)).toBe('S1')
  })
  it('đổi mật khẩu của em ⇒ liên kết đã phát THU HỒI ngay, câu báo dặn phụ huynh nhờ Thầy gửi lại; token cấp lại thì dùng được', async () => {
    const d = taoD1That(); themEm(d, 'S1', 'mk-1')
    const t = await parentPass(d.env, 'S1')
    d.sql.prepare("UPDATE hoc_sinh SET mat_khau='mk-2' WHERE sbd='S1'").run()
    await expect(parentIdentity(d.env, t)).rejects.toThrow(/hết hiệu lực.*Thầy gửi lại/)
    expect(await parentIdentity(d.env, await parentPass(d.env, 'S1'))).toBe('S1')
  })
  it('em chưa có mật khẩu: token không có `pk` và dùng được; em bị xoá mật khẩu SAU khi cấp (token có pk) ⇒ thu hồi', async () => {
    const d = taoD1That(); themEm(d, 'S2', null); themEm(d, 'S3', 'mk')
    const t2 = await parentPass(d.env, 'S2')
    expect('pk' in giaiMa(t2)).toBe(false)
    expect(await parentIdentity(d.env, t2)).toBe('S2')
    const t3 = await parentPass(d.env, 'S3')
    d.sql.prepare("UPDATE hoc_sinh SET mat_khau=NULL WHERE sbd='S3'").run()
    await expect(parentIdentity(d.env, t3)).rejects.toThrow(/hết hiệu lực/)
  })
  it('token cũ (cấp trước 21/09, không có `pk`) ký đúng vẫn dùng được tới khi hết hạn, kể cả sau khi em đổi mật khẩu', async () => {
    const d = taoD1That(); themEm(d, 'S1', 'mk-1')
    const cu = await ky(d, { sbd: 'S1', exp: Date.now() + NGAY, purpose: 'game-parent' })
    expect(await parentIdentity(d.env, cu)).toBe('S1')
    d.sql.prepare("UPDATE hoc_sinh SET mat_khau='mk-2' WHERE sbd='S1'").run()
    expect(await parentIdentity(d.env, cu)).toBe('S1') // không thu hồi được: đúng như ghi trong tài liệu
  })
})

describe('mã phụ huynh không thay được phiên học sinh (và ngược lại)', () => {
  it('gameIdentity từ chối token PH (kể cả token cũ không có pk, kể cả khi có `pwd` đúng); parentIdentity từ chối token học sinh', async () => {
    const d = taoD1That(); themEm(d, 'S1', 'mk-1')
    const hs = await gameToken(d.env, 'S1')
    const pwd = giaiMa(hs).pwd
    await expect(gameIdentity(d.env, { token: await parentPass(d.env, 'S1') })).rejects.toThrow(/Phiên game không hợp lệ/)
    await expect(gameIdentity(d.env, { token: await ky(d, { sbd: 'S1', exp: Date.now() + NGAY, purpose: 'game-parent' }) })).rejects.toThrow(/Phiên game không hợp lệ/)
    await expect(gameIdentity(d.env, { token: await ky(d, { sbd: 'S1', exp: Date.now() + NGAY, purpose: 'game-parent', pwd }) })).rejects.toThrow(/Phiên game không hợp lệ/)
    await expect(parentIdentity(d.env, hs)).rejects.toThrow(/Mã xem tiến bộ/)
    expect(await gameIdentity(d.env, { token: hs })).toBe('S1')
  })
})

describe('mã hỏng: lỗi có chữ, không TypeError, không lộ chi tiết', () => {
  it('không phải chuỗi / thiếu chữ ký / chữ ký sai / dữ liệu không giải mã được', async () => {
    const d = taoD1That(); themEm(d, 'S1', 'mk-1')
    const t = await parentPass(d.env, 'S1')
    for (const xau of [undefined, null, '', '.', 'abc', 'abc.', '.def', `${t}x`, `khong-base64!!.${t.split('.')[1]}`, 12345, { x: 1 }]) {
      await expect(parentIdentity(d.env, xau as never)).rejects.toThrow(/Mã xem tiến bộ/)
    }
    // Chữ ký ĐÚNG nhưng dữ liệu không phải JSON: vẫn là lỗi có chữ.
    const p = btoa('khong phai json')
    const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(String(d.env.MA_BI_MAT)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const s = [...new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(p)))].map((x) => x.toString(16).padStart(2, '0')).join('')
    await expect(parentIdentity(d.env, `${p}.${s}`)).rejects.toThrow(/Mã xem tiến bộ không hợp lệ/)
    await expect(gameIdentity(d.env, { token: 'a.b' })).rejects.toThrow(/Phiên game không hợp lệ/)
  })
  it('token PH hết hạn, sai mục đích, thiếu SBD hoặc SBD rỗng đều bị từ chối', async () => {
    const d = taoD1That(); themEm(d, 'S1', 'mk-1')
    await expect(parentIdentity(d.env, await ky(d, { sbd: 'S1', exp: Date.now() - 1000, purpose: 'game-parent' }))).rejects.toThrow(/hết hạn/)
    await expect(parentIdentity(d.env, await ky(d, { sbd: 'S1', exp: 'khong phai so', purpose: 'game-parent' }))).rejects.toThrow(/hết hạn/)
    await expect(parentIdentity(d.env, await ky(d, { sbd: 'S1', exp: Date.now() + NGAY, purpose: 'khac' }))).rejects.toThrow(/hết hạn/)
    await expect(parentIdentity(d.env, await ky(d, { exp: Date.now() + NGAY, purpose: 'game-parent' }))).rejects.toThrow(/không hợp lệ/)
    await expect(parentIdentity(d.env, await ky(d, { sbd: '', exp: Date.now() + NGAY, purpose: 'game-parent' }))).rejects.toThrow(/không hợp lệ/)
  })
})
