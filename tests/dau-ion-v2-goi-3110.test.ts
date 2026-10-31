// @vitest-environment node
// «ĐẤU NGUYÊN TỬ 2» · GÓI NHỊ PHÂN (src/lib/dau-ion/goi.ts): ý định 8 byte CHỈ hướng đi; ảnh trận MÃ 3 (bản cũ mã 2 không đọc lẫn) cho 6 ghế
// và mọi loại sự kiện; sân 6 bạn chơi thật 60 giây ⇒ gói trung bình ≤ 120 byte (đặc tả ≈ 110 B/ảnh, ≈ 2,2 KB/giây mỗi em).
import { describe, expect, it } from 'vitest'
import { GOI_ANH, PHIEN_BAN, datAck, docAnh, docYDinh, maAnh, maYDinh } from '../src/lib/dau-ion/goi'
import { aiDi, buocTran, laySuKien, taoTran, type SuKien } from '../src/lib/dau-ion/loi'

describe('Gói ý định', () => {
  it('8 byte, chỉ seq + dx + dy (byte ngắm / bắn để trống)', () => {
    const b = maYDinh(300, 0.5, -1.4)
    expect(b.length).toBe(8)
    expect([...b.slice(4)]).toEqual([0, 0, 0, 0])
    expect(docYDinh(b)).toEqual({ seq: 300 & 0xff, dx: 0.5, dy: -1 })
    expect(docYDinh(new Uint8Array(7))).toBeNull()
    expect(PHIEN_BAN).toBe(2)
  })
})

describe('Ảnh trận mã 3', () => {
  it('6 ghế + mọi sự kiện: mã rồi đọc lại đúng', () => {
    const tr = taoTran(Array.from({ length: 6 }, (_, i) => ({ id: i + 1, nt: i })), 5)
    Object.assign(tr.ghe[0], { x: 123.45, y: 543.21, muc: 2, mau: 7, cap: 4, khien: 2, ha: 3, e: 5, che: 0 })
    Object.assign(tr.ghe[1], { cho: 1, vang: true, cap: 5, mau: 10 })
    const su: SuKien[] = [
      { t: 'ban', chu: 1, cap: 4, x: 10, y: 20, ngam: 1.25 },
      { t: 'trung', ai: 2, boi: 1, x: 30, y: 40, mau: 6, phu: 1 },
      { t: 'chan', ai: 3, boi: 1, khien: 2 },
      { t: 'ha', ai: 2, boi: 1, x: 50, y: 60, capCu: 5, chuoi: 3 },
      { t: 'hoi', ai: 2 },
      { t: 'vp', id: 77, k: 'xt', x: 300, y: 206 },
      { t: 'nhat', id: 77, ai: 1, k: 'xt', x: 300, y: 206 },
      { t: 'len', ai: 1, cap: 5, xt: true },
      { t: 'xich', chu: 1, a: 2, b: 3 },
      { t: 'no', chu: 1, x: 70, y: 80 },
      { t: 'tat', x: 1, y: 2, nt: 0 },
    ]
    const b = datAck(maAnh(9, 41.2, tr.ghe, su), 33)
    expect(b[0]).toBe(GOI_ANH)
    const a = docAnh(b)!
    expect(a).toMatchObject({ tick: 9, ack: 33, con: 42 })
    expect(a.ghe).toHaveLength(6)
    expect(a.ghe[0]).toEqual({ id: 1, x: 123.45, y: 543.21, muc: 2, mau: 7, cap: 4, cho: false, che: false, khien: 2, vang: false, ha: 3, e: 5 })
    expect(a.ghe[1]).toMatchObject({ cho: true, vang: true, cap: 5, mau: 10 })
    expect(a.su.map((s) => s.t)).toEqual(['ban', 'trung', 'chan', 'ha', 'hoi', 'vp', 'nhat', 'len', 'xich', 'no']) // `tat` chỉ ở máy em
    expect(a.su[0]).toMatchObject({ chu: 1, cap: 4, x: 10, y: 20 })
    expect((a.su[0] as { ngam: number }).ngam).toBeCloseTo(1.25, 3)
    expect(a.su[1]).toEqual({ t: 'trung', ai: 2, boi: 1, x: 30, y: 40, mau: 6, phu: 1 })
    expect(a.su[3]).toEqual({ t: 'ha', ai: 2, boi: 1, x: 50, y: 60, capCu: 5, chuoi: 3 })
    expect(a.su[5]).toEqual({ t: 'vp', id: 77, k: 'xt', x: 300, y: 206 })
    expect(a.su[7]).toEqual({ t: 'len', ai: 1, cap: 5, xt: true })
    expect(a.su[8]).toEqual({ t: 'xich', chu: 1, a: 2, b: 3 })
  })
  it('gói bản cũ (mã 2) và gói cụt ⇒ null', () => {
    expect(docAnh(new Uint8Array([2, 0, 0, 60, 0, 0]))).toBeNull()
    const tr = taoTran([{ id: 1, nt: 0 }], 1)
    const b = maAnh(1, 60, tr.ghe, [{ t: 'ban', chu: 1, cap: 1, x: 1, y: 1, ngam: 0 }])
    expect(docAnh(b.slice(0, b.length - 2))).toBeNull()
  })
  it('sân 6 bạn chơi 60 giây ở 20 ảnh/giây ⇒ gói trung bình ≤ 120 byte', () => {
    const tr = taoTran(Array.from({ length: 6 }, (_, i) => ({ id: i + 1, nt: i, ai: true })), 11)
    let tong = 0, n = 0
    while (!tr.xong) {
      for (const g of tr.ghe) g.yd = aiDi(tr, g, 0.05)
      buocTran(tr, 0.05)
      tong += maAnh(n, tr.con, tr.ghe, laySuKien(tr)).length; n++
    }
    const tb = tong / n
    expect(Math.abs(n - 1200)).toBeLessThanOrEqual(1)
    console.log(`[dau-ion-v2] ảnh trận trung bình ${tb.toFixed(1)} B · ${((tb * 20) / 1024).toFixed(2)} KB/giây mỗi em`)
    expect(tb).toBeLessThanOrEqual(120)
    expect((tb * 20) / 1024).toBeLessThan(2.4) // KB/giây mỗi em
  })
})
