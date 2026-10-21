// @vitest-environment node
// ĐỆM NGẮN + GỘP LƯỢT ĐANG TÍNH của `/gv/nhip-hoc` (thầy 21/10: "app gv không vào được", Nhịp học báo "Máy chủ trả lời chậm").
// Nhịp học là lệnh nặng nhất màn Hôm nay; máy thầy bỏ sau 20 giây rồi "Thử lại" từng đẻ thêm một lượt tính chồng lên lượt cũ. Nay: lượt đang tính được DÙNG CHUNG,
// kết quả ok giữ 90 giây, lỗi không đệm, lượt "đang tính" treo quá 45 giây bị bỏ. D1 THẬT (SQLite) — đếm số lệnh D1 để chứng minh không tính lại.
import { beforeEach, describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { gvNhipHocCoDem, HAN_DEM_NHIP_HOC_MS, HAN_LUOT_DANG_TINH_MS, xoaDemNhipHoc } from '../server/src/nhip-hoc'

const NOW = Date.parse('2026-10-21T05:00:00Z')
type D = ReturnType<typeof taoD1That>
/** Env có đếm số lần `prepare` (một lệnh D1 = một lần prepare). */
function envDem(d: D) {
  let dem = 0
  const goc = d.env.DB as unknown as { prepare: (s: string) => unknown; batch: (x: unknown[]) => Promise<unknown> }
  const db = new Proxy(goc, { get: (t, p) => (p === 'prepare' ? (s: string) => { dem++; return t.prepare(s) } : (t as never)[p as never]) })
  return { env: { ...(d.env as object), DB: db } as unknown as Env, lay: () => dem }
}
const dung = () => {
  const d = taoD1That()
  d.sql.prepare('INSERT INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run('S1', 'Trần An', '2009', '12', 'x')
  d.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, lop, ten_lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run('S1', 'Trần An', '12', '12 - Tinh Hoa', 'x')
  return d
}
beforeEach(() => xoaDemNhipHoc())

describe('gvNhipHocCoDem', () => {
  it('lần hai trong 90 giây trả CÙNG kết quả và KHÔNG gọi D1; hết 90 giây tính lại', async () => {
    const { env, lay } = envDem(dung())
    const a = await gvNhipHocCoDem(env, {}, NOW)
    expect(a.ok).toBe(true)
    const sau1 = lay()
    expect(sau1).toBeGreaterThan(0)
    const b = await gvNhipHocCoDem(env, {}, NOW + 30_000)
    expect(b).toBe(a)
    expect(lay()).toBe(sau1)
    const c = await gvNhipHocCoDem(env, {}, NOW + HAN_DEM_NHIP_HOC_MS + 1)
    expect(c.ok).toBe(true)
    expect(lay()).toBeGreaterThan(sau1)
  })
  it('ba lệnh cùng lúc (mở lại + bấm Thử lại) chỉ MỘT lượt tính — không chồng', async () => {
    const { env, lay } = envDem(dung())
    const [a, b, c] = await Promise.all([gvNhipHocCoDem(env, {}, NOW), gvNhipHocCoDem(env, {}, NOW + 1), gvNhipHocCoDem(env, {}, NOW + 2)])
    expect(a.ok).toBe(true)
    expect(b).toBe(a)
    expect(c).toBe(a)
    const mot = lay()
    xoaDemNhipHoc()
    const rieng = envDem(dung())
    await gvNhipHocCoDem(rieng.env, {}, NOW)
    expect(mot).toBe(rieng.lay()) // đúng số lệnh của MỘT lượt
  })
  it('khoảng ngày khác nhau không dùng chung; khoảng sai ⇒ báo lỗi, không đệm', async () => {
    const { env } = envDem(dung())
    const a = await gvNhipHocCoDem(env, {}, NOW)
    const b = await gvNhipHocCoDem(env, { tu: '2026-10-05' }, NOW + 1)
    expect(b).not.toBe(a)
    const loi = await gvNhipHocCoDem(env, { tu: 'không-phải-ngày' }, NOW)
    expect(loi.ok).toBe(false)
  })
  it('lượt tính LỖI không bị đệm: lần sau tính lại và ra kết quả đúng', async () => {
    const d = dung()
    const { env } = envDem(d)
    const hong = { ...(env as object), DB: { prepare: () => { throw new Error('D1 lỗi giả') }, batch: async () => { throw new Error('D1 lỗi giả') } } } as unknown as Env
    const x = await gvNhipHocCoDem(hong, {}, NOW).catch((e: unknown) => e)
    expect(x instanceof Error || (x as { ok?: boolean }).ok === false).toBe(true)
    const ok = await gvNhipHocCoDem(env, {}, NOW + 1)
    expect(ok.ok).toBe(true)
  })
  it('lượt "đang tính" treo quá 45 giây bị bỏ — lệnh sau tính lại thay vì chờ mãi', async () => {
    const d = dung()
    const { env } = envDem(d)
    let mo!: () => void
    const treo = { ...(env as object), DB: { prepare: () => new Promise((r) => { mo = () => r(undefined) }), batch: () => new Promise(() => {}) } } as unknown as Env
    void gvNhipHocCoDem(treo, {}, NOW).catch(() => {}) // không bao giờ xong
    const ok = await gvNhipHocCoDem(env, {}, NOW + HAN_LUOT_DANG_TINH_MS + 1)
    expect(ok.ok).toBe(true)
    void mo
  })
})
