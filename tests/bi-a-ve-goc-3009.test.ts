// BI-A · BI VỪA DỪNG trượt êm về dáng gốc (thầy 30/09: kí hiệu không nhảy khi chuyển từ vẽ lăn sang ảnh vẽ sẵn).
import { describe, expect, it } from 'vitest'
import { MS_VE_GOC, Q_GOC_DOC, Q_GOC_NGANG, noiQuay, taoBong, toBiLan } from '../src/game/bi-a/ve-bi'
import { MAU_BI } from '../src/game/bi-a/nguyen-to'

const dai = (q: readonly number[]) => Math.hypot(q[0]!, q[1]!, q[2]!, q[3]!)
const gan = (a: readonly number[], b: readonly number[]) => a.forEach((x, i) => expect(x).toBeCloseTo(b[i]!, 9))

describe('noiQuay: nội suy hướng quay về dáng gốc', () => {
  const a = [Math.cos(0.9), Math.sin(0.9) * 0.6, Math.sin(0.9) * 0.8, 0] as const
  it('t = 0 ⇒ hướng lúc dừng; t = 1 ⇒ đúng dáng gốc; mọi t độ dài 1', () => {
    gan(noiQuay(a, Q_GOC_DOC, 0, []), a)
    gan(noiQuay(a, Q_GOC_DOC, 1, []), Q_GOC_DOC)
    for (const t of [0.1, 0.3, 0.5, 0.8]) expect(dai(noiQuay(a, Q_GOC_DOC, t, []))).toBeCloseTo(1, 9)
    expect(MS_VE_GOC).toBe(200)
  })
  it('đi đường ngắn nhất: đích cùng hướng nhưng ngược dấu (−q) ⇒ kết quả vẫn quay về đúng hướng đó, không vòng xa', () => {
    const am = Q_GOC_DOC.map((x) => -x)
    const r = noiQuay(a, am, 1, [])
    const dot = Math.abs(r[0]! * Q_GOC_DOC[0] + r[1]! * Q_GOC_DOC[1] + r[2]! * Q_GOC_DOC[2] + r[3]! * Q_GOC_DOC[3])
    expect(dot).toBeCloseTo(1, 9)
    // nửa đường: góc quay đã đi > nửa (ease-out) và không vượt quá góc giữa hai hướng
    const cos0 = Math.abs(a[0] * Q_GOC_DOC[0] + a[1] * Q_GOC_DOC[1] + a[2] * Q_GOC_DOC[2] + a[3] * Q_GOC_DOC[3]), goc0 = Math.acos(cos0)
    const m = noiQuay(a, am, 0.5, []), gocDi = Math.acos(Math.min(1, Math.abs(m[0]! * a[0] + m[1]! * a[1] + m[2]! * a[2] + m[3]! * a[3])))
    expect(gocDi / goc0).toBeCloseTo(1 - 0.5 ** 3, 6)
  })
  it('hai dáng gốc là quaternion đơn vị', () => { expect(dai(Q_GOC_DOC)).toBeCloseTo(1, 12); expect(dai(Q_GOC_NGANG)).toBeCloseTo(1, 12) })
})

describe('dáng gốc khớp ảnh vẽ sẵn: ô kí hiệu giữa mặt bi, dải sọc nằm NGANG', () => {
  const N = 41, B = taoBong(N), d = new Uint8ClampedArray(N * N * 4)
  const mau = (i: number, j: number) => { const o = (j * N + i) * 4; return [d[o]!, d[o + 1]!, d[o + 2]!] }
  const laTrang = (c: number[]) => c[2]! > 0.8 * c[0]! // trắng (kể cả phần tối do bóng) ⇔ ba kênh gần bằng nhau; đỏ cam ⇔ kênh lam thấp hẳn
  for (const [ten, q, xoay] of [['bàn dọc', Q_GOC_DOC, false], ['bàn ngang', Q_GOC_NGANG, true]] as const) {
    it(ten, () => {
      toBiLan(B, 'dich', { to: new Uint8Array(64 * 64), vien: new Uint8Array(64 * 64) }, q, xoay, d)
      const c = Math.floor(N / 2)
      expect(laTrang(mau(c, 4))).toBe(true) // trên: trắng
      expect(laTrang(mau(c, N - 5))).toBe(true) // dưới: trắng
      expect(laTrang(mau(5, c))).toBe(false) // trái: dải đỏ cam
      expect(laTrang(mau(N - 6, c))).toBe(false) // phải: dải đỏ cam
      expect(mau(5, c)[2]!).toBeLessThan(0.4 * mau(5, c)[0]!) // đỏ cam: kênh lam thấp hẳn
      void MAU_BI
    })
  }
})
