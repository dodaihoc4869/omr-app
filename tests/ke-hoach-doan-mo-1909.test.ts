// @vitest-environment node
// `doanMo` ở gốc JSON của POST /hs/ke-hoach-ngay (Code 2 cần để hiện thẻ "Lên đường cùng Đoàn Hộ Tống"): boolean, chỉ khi ok:true, cùng nguồn `cau_hinh.doan_ho_tong`.
import { describe, it, expect } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'

const dung = (cfg: string | null) => {
  const d = taoD1That()
  for (const s of ['S1', 'S2']) d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,cap_nhat_luc) VALUES(?,'x','x')").run(s)
  if (cfg !== null) d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('doan_ho_tong',?,'x')").run(cfg)
  return d
}
describe('doanMo trong /hs/ke-hoach-ngay', () => {
  it('không có dòng cờ → doanMo:false cho mọi em (boolean, không vắng)', async () => {
    const d = dung(null)
    const r = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' })
    expect(r.ok).toBe(true)
    expect(r.doanMo).toBe(false)
  })
  it('dsSbd chỉ mở đúng em trong danh sách; toanBo mở mọi em; JSON hỏng → false', async () => {
    const d = dung('{"dsSbd":["S1"],"toanBo":false}')
    expect((await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' })).doanMo).toBe(true)
    expect((await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S2' })).doanMo).toBe(false)
    const t = dung('{"dsSbd":[],"toanBo":true}')
    expect((await goiWorker(worker, t.env, '/hs/ke-hoach-ngay', { sbd: 'S2' })).doanMo).toBe(true)
    const h = dung('{hỏng')
    expect((await goiWorker(worker, h.env, '/hs/ke-hoach-ngay', { sbd: 'S1' })).doanMo).toBe(false)
  })
  it('phản hồi lỗi (SBD bịa) KHÔNG có trường doanMo', async () => {
    const d = dung('{"toanBo":true}')
    const r = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'KHONG-CO' })
    expect(r.ok).toBe(false)
    expect('doanMo' in r).toBe(false)
  })
})
