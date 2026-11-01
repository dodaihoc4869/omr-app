// @vitest-environment node
// «ĐẤU NGUYÊN TỬ» 3 ĐẤU 3 · GÓI NHỊ PHÂN (src/lib/dau-ion/goi.ts): GIAO THỨC 3 — ý định 8 byte CHỈ hướng đi; ảnh trận MÃ 4 (bản cũ mã 3 không đọc lẫn):
// đầu 10 byte có BƯỚC TRẬN (mốc thời gian của phòng, uint16) + tỉ số hai phe; toạ độ × 50 (sân 1040 × 520 vừa 16 bit); sân 6 ghế chơi 60 giây
// ⇒ gói trung bình ≤ 125 byte.
import { describe, expect, it } from 'vitest'
import { GOI_ANH, PHIEN_BAN, datAck, docAnh, docYDinh, maAnh, maYDinh } from '../src/lib/dau-ion/goi'
import { SAN_H, SAN_W, aiDi, buocTran, laySuKien, taoTran, type SuKien } from '../src/lib/dau-ion/loi'

describe('Gói ý định', () => {
  it('8 byte, chỉ seq + dx + dy (byte ngắm / bắn để trống); giao thức 3', () => {
    const b = maYDinh(300, 0.5, -1.4)
    expect(b.length).toBe(8)
    expect([...b.slice(4)]).toEqual([0, 0, 0, 0])
    expect(docYDinh(b)).toEqual({ seq: 300 & 0xff, dx: 0.5, dy: -1 })
    expect(docYDinh(new Uint8Array(7))).toBeNull()
    expect(PHIEN_BAN).toBe(3)
    expect(GOI_ANH).toBe(4)
  })
})

describe('Ảnh trận mã 4', () => {
  it('6 ghế + mọi sự kiện + bước trận + tỉ số: mã rồi đọc lại đúng; toạ độ góc xa nhất của sân 1040 × 520 không tràn', () => {
    const tr = taoTran(Array.from({ length: 6 }, (_, i) => ({ id: i + 1, nt: i, phe: i % 2 })), 5)
    Object.assign(tr.ghe[0], { x: 123.46, y: 443.22, muc: 2, mau: 7, cap: 4, khien: 2, ha: 3, e: 5, che: 0 })
    Object.assign(tr.ghe[1], { cho: 1, vang: true, cap: 5, mau: 10 })
    Object.assign(tr.ghe[2], { x: SAN_W, y: SAN_H })
    const su: SuKien[] = [
      { t: 'ban', chu: 1, cap: 4, x: 10, y: 20, ngam: 1.25 },
      { t: 'trung', ai: 2, boi: 1, x: 30, y: 40, mau: 6, phu: 1 },
      { t: 'chan', ai: 3, boi: 1, khien: 2 },
      { t: 'ha', ai: 2, boi: 1, x: 50, y: 60, capCu: 5, chuoi: 3 },
      { t: 'hoi', ai: 2 },
      { t: 'vp', id: 77, k: 'xt', x: 520, y: 58 },
      { t: 'nhat', id: 77, ai: 1, k: 'xt', x: 520, y: 58 },
      { t: 'len', ai: 1, cap: 5, xt: true },
      { t: 'xich', chu: 1, a: 2, b: 3 },
      { t: 'no', chu: 1, x: 970, y: 80 },
      { t: 'tat', x: 1, y: 2, nt: 0 },
      { t: 'cham', ai: 2, boi: 1, x: 3, y: 4 },
    ]
    const b = datAck(maAnh(9, 41.2, tr.ghe, su, 65535 + 7, [12, 9]), 33)
    expect(b[0]).toBe(GOI_ANH)
    const a = docAnh(b)!
    expect(a).toMatchObject({ tick: 9, ack: 33, con: 42, buoc: 6, ti: [12, 9] })
    expect(a.ghe).toHaveLength(6)
    expect(a.ghe[0]).toEqual({ id: 1, x: 123.46, y: 443.22, muc: 2, mau: 7, cap: 4, cho: false, che: false, khien: 2, vang: false, ha: 3, e: 5 })
    expect(a.ghe[1]).toMatchObject({ cho: true, vang: true, cap: 5, mau: 10 })
    expect(a.ghe[2]).toMatchObject({ x: SAN_W, y: SAN_H })
    expect(a.su.map((s) => s.t)).toEqual(['ban', 'trung', 'chan', 'ha', 'hoi', 'vp', 'nhat', 'len', 'xich', 'no']) // `tat`, `cham` chỉ ở máy em
    expect((a.su[0] as { ngam: number }).ngam).toBeCloseTo(1.25, 3)
    expect(a.su[1]).toEqual({ t: 'trung', ai: 2, boi: 1, x: 30, y: 40, mau: 6, phu: 1 })
    expect(a.su[3]).toEqual({ t: 'ha', ai: 2, boi: 1, x: 50, y: 60, capCu: 5, chuoi: 3 })
    expect(a.su[5]).toEqual({ t: 'vp', id: 77, k: 'xt', x: 520, y: 58 })
    expect(a.su[9]).toEqual({ t: 'no', chu: 1, x: 970, y: 80 })
  })
  it('gói bản cũ (mã 3, đầu 6 byte) và gói cụt ⇒ null', () => {
    expect(docAnh(new Uint8Array([3, 0, 0, 60, 0, 0, 0, 0, 0, 0]))).toBeNull()
    const tr = taoTran([{ id: 1, nt: 0 }], 1)
    const b = maAnh(1, 60, tr.ghe, [{ t: 'ban', chu: 1, cap: 1, x: 1, y: 1, ngam: 0 }])
    expect(docAnh(b.slice(0, b.length - 2))).toBeNull()
  })
  it('sân 6 ghế 3 đấu 3 chơi 60 giây ở 20 ảnh/giây ⇒ gói trung bình ≤ 125 byte', () => {
    const tr = taoTran(Array.from({ length: 6 }, (_, i) => ({ id: i + 1, nt: i, ai: true, phe: i < 3 ? 0 : 1 })), 11)
    let tong = 0, n = 0
    while (!tr.xong) {
      for (const g of tr.ghe) g.yd = aiDi(tr, g, 0.05)
      buocTran(tr, 0.05)
      tong += maAnh(n, tr.con, tr.ghe, laySuKien(tr), n, tr.ti).length; n++
    }
    const tb = tong / n
    expect(Math.abs(n - 1200)).toBeLessThanOrEqual(1)
    console.log(`[dau-ion-3v3] ảnh trận trung bình ${tb.toFixed(1)} B · ${((tb * 20) / 1024).toFixed(2)} KB/giây mỗi em`)
    expect(tb).toBeLessThanOrEqual(125)
  })
})
