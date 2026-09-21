// @vitest-environment node
// W3 — NỐI "DỒN VỀ ĐÍCH": `docVeDichCuaEm` (ve-dich-d1.ts, Code 4, đọc-chỉ) gắn vào lệnh kế hoạch ngày của em (`no` + `veDich`, chỉ-thêm) và vào `/ph/tat-ca-ve-con` (`no` CHỈ khi có nợ). Hàm gốc đã có test riêng (ve-dich-d1-may-chu-2109).
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, type D1That } from './_d1-that'
import { BAY_GIO, dung, giao, gio, mo } from './_btvn-nang-do-mau'

afterEach(() => vi.useRealTimers())
const KH = (d: D1That) => goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' }) as Promise<any>
const PH = (d: D1That) => goiWorker(worker, d.env, '/ph/tat-ca-ve-con', { sbd: 'S1' }) as Promise<any>
const HAI_NGAY = new Date(BAY_GIO.getTime() + 2 * 24 * 3_600_000)

async function baiDaMo(): Promise<D1That> {
  gio(BAY_GIO)
  const d = dung()
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,mat_khau,cap_nhat_luc) VALUES('S1','Em Một','mk','x')").run()
  await giao(d); await mo(d)
  return d
}

describe('lệnh kế hoạch ngày của em có `no` + `veDich`', () => {
  it('chặng của các ngày trước chưa làm ⇒ no.tongCau > 0, no.theoNgay có món; veDich[0] có chặng trạng thái "no"; chỉ-thêm (khoá cũ vẫn còn)', async () => {
    const d = await baiDaMo()
    gio(HAI_NGAY)
    const kh = await KH(d)
    expect(kh.ok).toBe(true); expect(kh).toHaveProperty('nganSach'); expect(kh).toHaveProperty('viec') // khoá cũ nguyên vẹn
    expect(kh.no.tongCau).toBeGreaterThan(0); expect(kh.no.theoNgay.length).toBeGreaterThan(0)
    expect(kh.veDich.length).toBeGreaterThan(0)
    expect(kh.veDich[0].chang.some((c: { trangThai: string }) => c.trangThai === 'no')).toBe(true)
    expect(kh.veDich[0]).toMatchObject({ maBtvn: expect.any(String), hanNop: expect.any(String) })
  })
  it('em đúng nhịp (cùng ngày mở bài) ⇒ no.tongCau = 0 (khối vẫn có để màn hiện một dòng xanh)', async () => {
    const d = await baiDaMo()
    const kh = await KH(d)
    expect(kh.no).toMatchObject({ tongCau: 0, tongPhut: 0, theoNgay: [] })
    expect(Array.isArray(kh.veDich)).toBe(true)
  })
  it('KHÔNG ghi gì: gọi hai lần không đổi D1 ngoài kế hoạch ngày (đọc-chỉ của ve-dich)', async () => {
    const d = await baiDaMo()
    gio(HAI_NGAY)
    await KH(d)
    const truoc = d.chup('btvn_em') + d.chup('btvn_em_cau') + d.chup('btvn')
    await KH(d)
    expect(d.chup('btvn_em') + d.chup('btvn_em_cau') + d.chup('btvn')).toBe(truoc)
  })
})

describe('/ph/tat-ca-ve-con có `no` CHỈ khi có nợ', () => {
  it('có nợ ⇒ ra.no = {theoNgay, tongCau, tongPhut}; đúng nhịp ⇒ VẮNG khoá no (không bịa)', async () => {
    const d = await baiDaMo()
    expect(await PH(d)).not.toHaveProperty('no')
    gio(HAI_NGAY)
    const r = await PH(d)
    expect(r.ok).toBe(true)
    expect(r.no.tongCau).toBeGreaterThan(0); expect(Array.isArray(r.no.theoNgay)).toBe(true)
  })
})
