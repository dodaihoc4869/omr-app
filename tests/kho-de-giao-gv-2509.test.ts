// @vitest-environment node
// MÀN THẦY "GIAO ĐỀ THEO TUẦN" — /gv/kho-de-giao (bước 4, 26/09/2026).
import { afterEach, describe, expect, it } from 'vitest'
import { gvKhoDeGiao } from '../server/src/gv-kho-de-giao'
import { xoaDemKhoDeGiao } from '../server/src/kho-de-giao'
import { taoD1That } from './_d1-that'

const GIAO = '2026-10-01T00:00:00+07:00'
const HAN = '2026-10-15T23:59:59+07:00'
const CFG = { bat: true, khoi: 12, lop: '12', sbd: ['S1'], maDe: ['D'], giaoLuc: GIAO, deadline: HAN }
afterEach(() => xoaDemKhoDeGiao())

describe('màn thầy Giao đề theo tuần — /gv/kho-de-giao', () => {
  it('luu: kiểm rồi ghi; doc đọc lại đúng cấu hình; có danh sách đề/em', async () => {
    const d = taoD1That()
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','Một','12','x'); INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('D','Đề D','12',5,'k',0,'v')")
    expect((await gvKhoDeGiao(d.env, { action: 'luu', cfg: CFG })).ok).toBe(true)
    const b = await gvKhoDeGiao(d.env, { action: 'doc' })
    expect((b.cfg as { maDe: string[] }).maDe).toEqual(['D'])
    expect((b.de as { maDe: string }[]).map((x) => x.maDe)).toEqual(['D'])
    expect((b.em as { sbd: string }[]).map((x) => x.sbd)).toEqual(['S1'])
  })
  it('luu cấu hình sai (deadline dưới 7 ngày) ⇒ từ chối, KHÔNG ghi', async () => {
    const d = taoD1That()
    const r = await gvKhoDeGiao(d.env, { action: 'luu', cfg: { ...CFG, deadline: '2026-10-03T00:00:00+07:00' } })
    expect(r.ok).toBe(false)
    expect(String(r.error)).toContain('tối thiểu 7 ngày')
    expect(d.dem('cau_hinh', "khoa = 'kho_de_giao'")).toBe(0)
  })
})
