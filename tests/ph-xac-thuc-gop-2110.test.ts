// @vitest-environment node
// XÁC THỰC PHỤ HUYNH GỘP MỘT TRUY VẤN (21/10, cổng tốc độ `/ph`): liên kết có `pk` đã đọc hàng `hoc_sinh` khi kiểm mật khẩu ⇒ không hỏi lại "em có tồn tại không".
// `/ph/xac-dinh` lấy luôn tên + lớp từ hàng ấy (trước đây 4 đợt D1: mật khẩu → tồn tại → đếm truy cập → tên) và hoãn đếm truy cập qua `ctx`.
// Lỗi của mã hỏng / bị thu hồi / SBD lạ giữ NGUYÊN chữ cũ.
import { describe, expect, it } from 'vitest'
import { parentPass } from '../server/src/game-v2-auth'
import { phXacDinh, sbdCuaPhuHuynh } from '../server/src/ph-truy-cap'
import { taoD1That, type D1That } from './_d1-that'
import type { Env, ExecutionContext } from '../server/src/kieu'

const themEm = (d: D1That, sbd: string, matKhau: string | null, ten = 'Em', lop: string | null = null) =>
  d.sql.prepare('INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,?,?,?)').run(sbd, ten, lop, matKhau, 'x')

/** Bọc D1: đếm số lần chuẩn bị câu SQL có chứa `FROM hoc_sinh` (giữ nguyên mọi hành vi khác). */
function demHocSinh(env: Env) {
  const goc = env.DB as unknown as { prepare(q: string): unknown }
  const sql: string[] = []
  const DB = new Proxy(goc, { get: (t, k, r) => (k === 'prepare' ? (q: string) => { if (/FROM hoc_sinh/i.test(q)) sql.push(q); return t.prepare(q) } : Reflect.get(t, k, r)) })
  return { env: { ...env, DB } as unknown as Env, sql }
}
const ctxGiu = () => { const viec: Promise<unknown>[] = []; return { ctx: { waitUntil: (p: Promise<unknown>) => { viec.push(p) }, passThroughOnException() {} } as unknown as ExecutionContext, viec } }

describe('sbdCuaPhuHuynh: liên kết có pk chỉ đọc hoc_sinh MỘT lần', () => {
  it('token có pk ⇒ đúng 1 truy vấn hoc_sinh (kiểm mật khẩu cũng là bằng chứng em tồn tại)', async () => {
    const d = taoD1That(); themEm(d, 'S1', 'mk-1')
    const pass = await parentPass(d.env, 'S1')
    const { env, sql } = demHocSinh(d.env)
    const r = await sbdCuaPhuHuynh(env, { pass }, 'ph-hoc-2', { chiToken: true })
    expect(r).toEqual({ sbd: 'S1', kieu: 'token' })
    expect(sql).toHaveLength(1)
    expect(sql[0]).toMatch(/SELECT mat_khau FROM hoc_sinh/) // KHÔNG đọc cột tên/lớp khi lệnh không cần
  })
  it('token cũ không pk (em chưa có mật khẩu) ⇒ vẫn kiểm tồn tại như trước (1 truy vấn, không cột tên)', async () => {
    const d = taoD1That(); themEm(d, 'S2', null)
    const pass = await parentPass(d.env, 'S2')
    const { env, sql } = demHocSinh(d.env)
    expect(await sbdCuaPhuHuynh(env, { pass }, 'ph-loi-thay', { chiToken: true })).toEqual({ sbd: 'S2', kieu: 'token' })
    expect(sql).toHaveLength(1)
    expect(sql[0]).toMatch(/SELECT sbd FROM hoc_sinh/)
  })
  it('SBD trần: giai đoạn mềm vẫn chạy; SBD lạ / quá dài ⇒ cùng câu lỗi cũ', async () => {
    const d = taoD1That(); themEm(d, 'S3', 'mk')
    expect(await sbdCuaPhuHuynh(d.env, { sbd: ' S3 ' }, 'parent-news')).toEqual({ sbd: 'S3', kieu: 'sbd_tran' })
    await expect(sbdCuaPhuHuynh(d.env, { sbd: 'KHONG-CO' }, 'parent-news')).rejects.toThrow('Không tìm thấy số báo danh của con.')
    await expect(sbdCuaPhuHuynh(d.env, { sbd: 'X'.repeat(41) }, 'parent-news')).rejects.toThrow('Không tìm thấy số báo danh của con.')
    await expect(sbdCuaPhuHuynh(d.env, { sbd: '' }, 'parent-news')).rejects.toThrow('Không tìm thấy số báo danh của con.')
  })
  it('đổi mật khẩu ⇒ thu hồi với đúng câu cũ; mã sai chữ ký ⇒ "không hợp lệ"; chỉ-token mà thiếu pass ⇒ đòi liên kết riêng', async () => {
    const d = taoD1That(); themEm(d, 'S4', 'mk-1')
    const pass = await parentPass(d.env, 'S4')
    d.sql.prepare("UPDATE hoc_sinh SET mat_khau='mk-2' WHERE sbd='S4'").run()
    await expect(sbdCuaPhuHuynh(d.env, { pass }, 'ph-hoc-2', { chiToken: true })).rejects.toThrow(/hết hiệu lực.*Thầy gửi lại/)
    await expect(sbdCuaPhuHuynh(d.env, { pass: pass.slice(0, -2) + 'zz' }, 'ph-hoc-2')).rejects.toThrow('Mã xem tiến bộ không hợp lệ.')
    await expect(sbdCuaPhuHuynh(d.env, { sbd: 'S4' }, 'ph-hoc-2', { chiToken: true })).rejects.toThrow(/Cần liên kết riêng/)
  })
})

describe('phXacDinh: một truy vấn hoc_sinh, tên + lớp lấy từ hàng xác thực, đếm truy cập hoãn qua ctx', () => {
  it('trả đúng tên + lớp; đúng 1 truy vấn hoc_sinh (có cột tên/lớp); đếm truy cập chạy ở việc phụ', async () => {
    const d = taoD1That(); themEm(d, 'S5', 'mk-5', 'Nguyễn Văn An', '12 - Lớp Thường')
    const pass = await parentPass(d.env, 'S5')
    const { env, sql } = demHocSinh(d.env)
    const { ctx, viec } = ctxGiu()
    expect(await phXacDinh(env, { pass }, ctx)).toEqual({ ok: true, sbd: 'S5', hoTen: 'Nguyễn Văn An', lop: '12 - Lớp Thường' })
    expect(sql).toHaveLength(1)
    expect(sql[0]).toMatch(/mat_khau, ho_ten, lop FROM hoc_sinh/)
    expect(viec).toHaveLength(1) // đếm truy cập đi qua waitUntil, không chặn phản hồi
    await Promise.all(viec)
    const dem = d.sql.prepare("SELECT so FROM ph_truy_cap WHERE sbd='S5' AND duong='ph-xac-dinh' AND kieu='token'").get() as { so: number } | undefined
    expect(dem?.so).toBe(1)
  })
  it('không có ctx (đường gọi cũ) ⇒ vẫn đếm truy cập ngay tại chỗ, không mất', async () => {
    const d = taoD1That(); themEm(d, 'S6', null, 'Em Sáu', '11')
    const pass = await parentPass(d.env, 'S6')
    expect(await phXacDinh(d.env, { pass })).toEqual({ ok: true, sbd: 'S6', hoTen: 'Em Sáu', lop: '11' })
    const dem = d.sql.prepare("SELECT so FROM ph_truy_cap WHERE sbd='S6' AND duong='ph-xac-dinh'").get() as { so: number } | undefined
    expect(dem?.so).toBe(1)
  })
  it('token không pk: tên + lớp lấy bằng truy vấn tồn tại (vẫn 1 truy vấn); em thiếu tên/lớp ⇒ chuỗi rỗng', async () => {
    const d = taoD1That(); d.sql.prepare("INSERT INTO hoc_sinh(sbd,mat_khau,cap_nhat_luc) VALUES('S7',NULL,'x')").run()
    const pass = await parentPass(d.env, 'S7')
    const { env, sql } = demHocSinh(d.env)
    expect(await phXacDinh(env, { pass })).toEqual({ ok: true, sbd: 'S7', hoTen: '', lop: '' })
    expect(sql).toHaveLength(1)
  })
  it('liên kết hỏng ⇒ ném lỗi như cũ (index.ts đổi thành {ok:false,error})', async () => {
    const d = taoD1That()
    await expect(phXacDinh(d.env, { pass: 'rac.rac' })).rejects.toThrow('Mã xem tiến bộ không hợp lệ.')
    await expect(phXacDinh(d.env, {})).rejects.toThrow(/Cần liên kết riêng/)
  })
})
