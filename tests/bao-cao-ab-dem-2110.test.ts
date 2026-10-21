// @vitest-environment node
// ĐỆM + GỘP LƯỢT ĐANG TÍNH của `baoCaoAB` (báo cáo A/B Hành trình): câu SQL giữ lâu của nó (≈ 3,4 triệu dòng đọc, ≈ 2,3 giây trên D1 thật) chạy mỗi lần thầy mở bảng một chiến dịch ⇒ chặn mọi lệnh khác.
// Nay một isolate chỉ tính MỘT lượt cho cùng danh sách em trong 10 phút; lượt đang tính được dùng chung; lỗi không đệm; lượt treo quá 60 giây bị bỏ. D1 THẬT (SQLite).
import { beforeEach, describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { baoCaoABCoDem, HAN_DEM_AB_MS, HAN_LUOT_AB_DANG_TINH_MS, xoaDemBaoCaoAB } from '../server/src/hanh-trinh-do-luong'
import { bangHanhTrinh } from '../server/src/hanh-trinh-d1'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { SQL_GOI7 } from '../server/src/goi-bai-7-schema'

const NOW = Date.parse('2026-10-21T05:00:00Z')
function envDem(ddl = false) {
  const d = taoD1That()
  if (ddl) for (const q of [...SQL_BANG_HANH_TRINH, ...SQL_GOI7]) d.sql.exec(q)
  let dem = 0
  const goc = d.env.DB as unknown as { prepare: (s: string) => unknown }
  const db = new Proxy(goc, { get: (t, p) => (p === 'prepare' ? (s: string) => { dem++; return t.prepare(s) } : (t as never)[p as never]) })
  return { env: { ...(d.env as object), DB: db } as unknown as Env, lay: () => dem }
}
beforeEach(() => xoaDemBaoCaoAB())

describe('baoCaoABCoDem', () => {
  it('lần hai cùng danh sách em trong 10 phút trả CÙNG kết quả và KHÔNG gọi D1; thứ tự em không đổi khoá; hết 10 phút tính lại', async () => {
    const { env, lay } = envDem()
    const a = await baoCaoABCoDem(env, ['S1', 'S2'], NOW)
    const sau1 = lay()
    expect(sau1).toBeGreaterThan(0)
    const b = await baoCaoABCoDem(env, ['S2', 'S1'], NOW + 60_000)
    expect(b).toBe(a)
    expect(lay()).toBe(sau1)
    await baoCaoABCoDem(env, ['S1', 'S2'], NOW + HAN_DEM_AB_MS + 1)
    expect(lay()).toBeGreaterThan(sau1)
  })
  it('danh sách em khác nhau không dùng chung', async () => {
    const { env, lay } = envDem()
    await baoCaoABCoDem(env, ['S1'], NOW)
    const sau1 = lay()
    await baoCaoABCoDem(env, ['S9'], NOW + 1)
    expect(lay()).toBeGreaterThan(sau1)
  })
  it('bốn lệnh cùng lúc (Hôm nay mở bảng nhiều chiến dịch + Thử lại) chỉ MỘT lượt tính', async () => {
    const mot = envDem()
    await baoCaoABCoDem(mot.env, ['S1'], NOW)
    const soMot = mot.lay()
    xoaDemBaoCaoAB()
    const { env, lay } = envDem()
    const kq = await Promise.all([1, 2, 3, 4].map((i) => baoCaoABCoDem(env, ['S1'], NOW + i)))
    expect(kq[1]).toBe(kq[0])
    expect(kq[3]).toBe(kq[0])
    expect(lay()).toBe(soMot)
  })
  it('lượt LỖI không đệm: lần sau tính lại; lượt "đang tính" treo quá 60 giây bị bỏ', async () => {
    const { env } = envDem()
    const hong = { ...(env as object), DB: { prepare: () => { throw new Error('D1 lỗi giả') }, batch: async () => { throw new Error('D1 lỗi giả') } } } as unknown as Env
    await expect(baoCaoABCoDem(hong, ['S1'], NOW)).rejects.toThrow()
    const ok = await baoCaoABCoDem(env, ['S1'], NOW + 1)
    expect(ok.thuNghiem).toBeTruthy()
    xoaDemBaoCaoAB()
    const treo = { ...(env as object), DB: { prepare: () => new Promise(() => {}), batch: () => new Promise(() => {}) } } as unknown as Env
    void baoCaoABCoDem(treo, ['S2'], NOW).catch(() => {})
    const lai = await baoCaoABCoDem(env, ['S2'], NOW + HAN_LUOT_AB_DANG_TINH_MS + 1)
    expect(lai.thuNghiem).toBeTruthy()
  })
})

describe('bangHanhTrinh — cờ boDoLuong (màn Hôm nay chỉ đếm)', () => {
  it('boDoLuong ⇒ KHÔNG chạy báo cáo A/B (ít lệnh D1 hơn, không có doLuong); vắng cờ ⇒ như cũ (có doLuong)', async () => {
    const cd = { id: 'hanh-trinh-v3-khoi-12', sbd: ['S1'], qids: [], maDe: [] } as never
    const a = envDem(true)
    const day = (await bangHanhTrinh(a.env, cd, '2026-10-21', false)) as { hanhTrinhNgay: { doLuong?: unknown } }
    const b = envDem(true)
    xoaDemBaoCaoAB()
    const gon = (await bangHanhTrinh(b.env, cd, '2026-10-21', true)) as { hanhTrinhNgay: { doLuong?: unknown } }
    expect(day.hanhTrinhNgay.doLuong).toBeTruthy()
    expect(gon.hanhTrinhNgay.doLuong).toBeUndefined()
    expect(b.lay()).toBeLessThan(a.lay()) // bỏ cả lô truy vấn của báo cáo A/B
  })
})
