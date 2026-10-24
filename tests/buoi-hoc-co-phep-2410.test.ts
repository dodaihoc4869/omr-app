// @vitest-environment node
// VẮNG CÓ PHÉP (24/10, xếp học sinh — «vắng không phép» chỉ tính phần còn lại). Máy chủ `server/src/buoi-hoc.ts` trên D1 thật.
import { beforeEach, describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { _xoaDemSai, gvBuoiHoc, hsDiemDanh } from '../server/src/buoi-hoc'
import { gameToken } from '../server/src/game-v2-auth'

const T0 = Date.parse('2026-10-24T11:00:30.000Z')
beforeEach(() => _xoaDemSai())
function fixture() {
  const d = taoD1That()
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','12','mk1','x'),('S2','Trần Bảo','12','mk2','x')")
  return { d, env: d.env }
}
const tt = (d: ReturnType<typeof taoD1That>, sbd: string) => (d.sql.prepare('SELECT trang_thai FROM buoi_hoc_diem_danh WHERE sbd = ?').get(sbd) as { trang_thai: string } | undefined)?.trang_thai

describe('vắng có phép', () => {
  it('thầy ghi có phép ⇒ không tính có mặt; gỡ ⇒ xoá đúng dấu ấy', async () => {
    const { d, env } = fixture()
    const mo = (await gvBuoiHoc(env, { action: 'mo', lop: '' }, T0)) as any
    const r = (await gvBuoiHoc(env, { action: 'co-phep', id: mo.buoi.id, sbd: 'S2' }, T0 + 1000)) as any
    expect(r.ok).toBe(true)
    expect(tt(d, 'S2')).toBe('co_phep')
    expect(r.coMat.map((x: any) => x.sbd)).not.toContain('S2')
    await gvBuoiHoc(env, { action: 'bo-co-phep', id: mo.buoi.id, sbd: 'S2' }, T0 + 2000)
    expect(tt(d, 'S2')).toBeUndefined()
  })
  it('em đang có mặt thì «có phép» không đè; em có phép mà vẫn tới quét mã ⇒ có mặt', async () => {
    const { d, env } = fixture()
    const mo = (await gvBuoiHoc(env, { action: 'mo', lop: '' }, T0)) as any
    await hsDiemDanh(env, { token: await gameToken(env, 'S1'), ma: mo.ma }, T0 + 5000)
    await gvBuoiHoc(env, { action: 'co-phep', id: mo.buoi.id, sbd: 'S1' }, T0 + 6000)
    expect(tt(d, 'S1')).toBe('co_mat')
    await gvBuoiHoc(env, { action: 'co-phep', id: mo.buoi.id, sbd: 'S2' }, T0 + 7000)
    await hsDiemDanh(env, { token: await gameToken(env, 'S2'), ma: mo.ma }, T0 + 8000)
    expect(tt(d, 'S2')).toBe('co_mat')
  })
})
