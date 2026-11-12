// MÁY BÙ CHỖ của trò «Sinh Tồn» (thầy chốt 12/11, đặc tả docs/dac-ta-sinh-ton-1211.md mục 4) — lõi thuần src/lib/live-khoi/sinh-ton-may.ts.
import { describe, expect, it } from 'vitest'
import { CAP_MAY_TOI_DA, HOI_SINH_MS, MAU_DAY, VAN_MS, laMay, taoBanDo, trongBui, type NhanVat } from '../src/lib/live-khoi/sinh-ton-loi'
import { buocMay, khopMay, mayLenCap, mayThanh, soMayCan, taoMay } from '../src/lib/live-khoi/sinh-ton-may'

const T0 = 1000 * VAN_MS + 10_000
const bd = taoBanDo(0)
/** Ngẫu nhiên cố định cho test lặp lại được. */
const rnd = (() => { let s = 7; return () => { s = (s * 16807) % 2147483647; return s / 2147483647 } })()
const nv = (o: Partial<NhanVat> & { id: string }): NhanVat => ({ x: 0, y: 0, mau: 100, doi: 1, cap: 1, t: '', ...o })

describe('bù chỗ', () => {
  it('mỗi đội luôn đủ 4: thiếu em thì máy bù, đủ 4 em thì không còn máy', () => {
    expect(soMayCan([0, 1, 4, 9])).toEqual([4, 3, 0, 0])
    const may = khopMay(bd, [], [3, 2, 2, 1], T0, rnd)
    expect([0, 1, 2, 3].map((d) => may.filter((m) => m.doi === d).length)).toEqual([1, 2, 2, 3])
    expect(new Set(may.map((m) => m.id)).size).toBe(8)
    expect(may.every((m) => laMay(m.id) && m.mau === MAU_DAY && Math.hypot(m.x - bd.trai[m.doi].x, m.y - bd.trai[m.doi].y) < 70)).toBe(true)
  })
  it('em vào ⇒ đúng MỘT máy của đội đó rời sân (máy ít máu nhất); em rời ⇒ máy bù lại, mã không trùng', () => {
    const dau = khopMay(bd, [], [1, 4, 4, 4], T0, rnd)
    expect(dau).toHaveLength(3)
    dau[1].mau = 20
    const yeu = dau[1].id
    const sau = khopMay(bd, dau, [2, 4, 4, 4], T0 + 250, rnd)
    expect(sau.map((m) => m.id).sort()).toEqual(dau.map((m) => m.id).filter((id) => id !== yeu).sort())
    const lai = khopMay(bd, sau, [1, 4, 4, 4], T0 + 500, rnd)
    expect(lai).toHaveLength(3)
    expect(new Set(lai.map((m) => m.id)).size).toBe(3)
    // Máy cũ giữ nguyên chỗ đứng, không bị dựng lại.
    for (const m of sau) expect(lai.find((x) => x.id === m.id)).toBe(m)
  })
})

describe('một nhịp của máy', () => {
  it('ngắm trễ: thấy cùng một đối thủ 2 nhịp liền mới bắn', () => {
    const m = { ...taoMay(bd, '~0', 0, T0, 0), x: 800, y: 700, batTuDen: 0 }
    const ds = [nv({ id: 'A', x: 900, y: 700 })]
    buocMay(bd, m, ds, T0, 250, rnd)
    expect(m.t).toBe('')
    buocMay(bd, m, ds, T0 + 250, 250, rnd)
    expect(m.t).toBe('A')
    expect(mayThanh(m)).toMatchObject({ id: '~0', doi: 0, t: 'A' })
  })
  it('bị bắn hết máu ⇒ trả mã kẻ hạ, nằm 3 giây rồi hồi sinh ở trại với súng cấp 1', () => {
    const m = { ...taoMay(bd, '~0', 0, T0, 0), x: 800, y: 700, batTuDen: 0, mau: 10, cap: 2 }
    const ds = [nv({ id: 'A', x: 900, y: 700, t: '~0', cap: 4 })]
    expect(buocMay(bd, m, ds, T0, 250, rnd)).toBe('A')
    expect([m.mau, m.t]).toEqual([0, ''])
    expect(buocMay(bd, m, ds, T0 + 1000, 250, rnd)).toBe('')
    expect(m.mau).toBe(0)
    buocMay(bd, m, [], T0 + HOI_SINH_MS + 10, 250, rnd)
    expect([m.mau, m.cap]).toEqual([MAU_DAY, 1])
    expect(Math.hypot(m.x - bd.trai[0].x, m.y - bd.trai[0].y)).toBeLessThan(120)
  })
  it('máu thấp ⇒ lui về bụi xa đối thủ, tới nơi thì ngừng bắn để ẩn', () => {
    const m = { ...taoMay(bd, '~0', 0, T0, 0), x: 600, y: 200, batTuDen: 0, mau: 20, lucTrung: T0 }
    const doiThu = nv({ id: 'A', x: 760, y: 200 })
    let gan = Infinity
    for (let i = 0; i < 40; i++) {
      buocMay(bd, m, [doiThu], T0 + i * 250, 250, rnd)
      gan = Math.min(gan, Math.hypot(m.x - 415, m.y - 196))
      if (trongBui(bd, m.x, m.y)) break
    }
    // Bụi trên-trái tâm (415, 196) cách đối thủ hơn 150.
    expect(trongBui(bd, m.x, m.y)).toBe(true)
    buocMay(bd, m, [doiThu], T0 + 41 * 250, 250, rnd)
    expect(m.t).toBe('')
  })
  it('không thấy ai ⇒ đi theo em thật của đội; ngoài vòng an toàn ⇒ chạy vào trong', () => {
    const m = { ...taoMay(bd, '~0', 0, T0, 0), x: 300, y: 600, batTuDen: 0 }
    const ban = nv({ id: 'S1', x: 300, y: 900, doi: 0 })
    const xa = Math.hypot(m.x - ban.x, m.y - ban.y)
    for (let i = 0; i < 8; i++) buocMay(bd, m, [ban], T0 + i * 250, 250, rnd)
    expect(Math.hypot(m.x - ban.x, m.y - ban.y)).toBeLessThan(xa - 100)
    // Cuối ván vòng co về giữa: máy ở trại chạy về phía giữa sân.
    const cuoi = 1000 * VAN_MS + 80_000
    const n = { ...taoMay(bd, '~1', 0, cuoi, 0), batTuDen: 0 }
    const dau = Math.hypot(n.x - 800, n.y - 500)
    for (let i = 0; i < 8; i++) buocMay(bd, n, [], cuoi + i * 250, 250, rnd)
    expect(Math.hypot(n.x - 800, n.y - 500)).toBeLessThan(dau - 150)
  })
  it('súng của máy tối đa cấp 2 ⇒ các em luôn có cửa thắng', () => {
    const m = taoMay(bd, '~0', 0, T0, 0)
    mayLenCap(m); mayLenCap(m); mayLenCap(m)
    expect(m.cap).toBe(CAP_MAY_TOI_DA)
  })
})
