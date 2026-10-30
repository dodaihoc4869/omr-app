// @vitest-environment node
// «ĐẤU ION» (game phòng chờ, 30/10) — lõi thuần dùng chung máy chủ + máy em: đi, va vật che, nhịp bắn, trúng mất Máu, hạ, hồi lại có khiên,
// thắng khi hạ đủ / hết giờ, hoà, vật phẩm, A.I, tất định theo hạt giống. Gói nhị phân: kích thước nhỏ, mã hoá ⇄ giải mã đúng.
import { describe, expect, it } from 'vitest'
import {
  BUOC, CHU_KY_BAN, GIAY_HOI, GIAY_KHIEN_HOI, LUAT, MAU_TOI_DA, R_NGUOI, SAN, TOC_DO, VAT_CAN,
  buocTran, diChuyen, dungVatCan, laySuKien, taoTran, thayNhau, yDinhAI, type Tran,
} from '../src/lib/dau-ion/loi'
import { datAck, docAnh, docYDinh, maAnh, maYDinh } from '../src/lib/dau-ion/goi'

const chay = (tr: Tran, giay: number, dt = BUOC) => { for (let t = 0; t < giay - 1e-9; t += dt) buocTran(tr, dt) }
/** Đặt hai em đối mặt trên đường trống (hàng y = 560, không vật che) cách nhau `xa`. */
function doiMat(xa = 200): Tran {
  const tr = taoTran('doi', [{ id: 1, nt: 0 }, { id: 2, nt: 1 }], 7)
  const [a, b] = tr.ghe
  a.x = 200; a.y = 560; b.x = 200 + xa; b.y = 560
  a.khien = 0; b.khien = 0; a.nap = 0; b.nap = 0
  a.yd = { dx: 0, dy: 0, ngam: 0, ban: false }; b.yd = { dx: 0, dy: 0, ngam: Math.PI, ban: false }
  tr.henVp = 999
  return tr
}

describe('Đấu Nguyên Tử · lõi', () => {
  it('sân vuông 600, hai góc xuất phát đối xứng tâm, không ai đứng trong vật che', () => {
    const tr = taoTran('doi', [{ id: 1, nt: 0 }, { id: 2, nt: 1 }])
    expect(SAN).toBe(600)
    const [a, b] = tr.ghe
    expect(a.x + b.x).toBe(SAN); expect(a.y + b.y).toBe(SAN)
    for (const g of tr.ghe) expect(dungVatCan(g.x, g.y, R_NGUOI)).toBe(false)
    expect(VAT_CAN.length).toBeGreaterThanOrEqual(5)
    expect(tr.ghe.every((g) => g.mau === MAU_TOI_DA && g.khien === GIAY_KHIEN_HOI)).toBe(true)
  })

  it('đi đúng tốc độ, chéo không nhanh hơn, không xuyên vật che, không ra khỏi sân', () => {
    expect(diChuyen(100, 560, 1, 0, 1).x).toBeCloseTo(100 + TOC_DO, 5)
    const cheo = diChuyen(100, 560, 1, -1, 0.1)
    expect(Math.hypot(cheo.x - 100, cheo.y - 560)).toBeLessThanOrEqual(TOC_DO * 0.1 + 1e-6)
    let p = { x: 300, y: 200 }
    for (let i = 0; i < 100; i++) p = diChuyen(p.x, p.y, 0, 1, BUOC) // đi thẳng vào bình cầu giữa sân
    expect(dungVatCan(p.x, p.y, R_NGUOI - 0.5)).toBe(false)
    let q = { x: 30, y: 30 }
    for (let i = 0; i < 100; i++) q = diChuyen(q.x, q.y, -1, -1, BUOC)
    expect(q.x).toBeGreaterThanOrEqual(R_NGUOI); expect(q.y).toBeGreaterThanOrEqual(R_NGUOI)
  })

  it('giữ bắn: đúng nhịp CHU_KY_BAN; Xúc tác bắn nhanh gấp đôi', () => {
    const tr = doiMat(500)
    tr.ghe[0].yd.ban = true; tr.ghe[0].yd.ngam = -Math.PI / 2 // bắn lên trời, không trúng ai
    chay(tr, 2)
    const thuong = tr.ghe[0].ban
    expect(thuong).toBeGreaterThanOrEqual(Math.floor(2 / CHU_KY_BAN)); expect(thuong).toBeLessThanOrEqual(Math.ceil(2 / CHU_KY_BAN) + 1)
    const tr2 = doiMat(500); tr2.ghe[0].yd.ban = true; tr2.ghe[0].yd.ngam = -Math.PI / 2; tr2.ghe[0].xucTac = 99
    chay(tr2, 2)
    expect(tr2.ghe[0].ban).toBeGreaterThanOrEqual(thuong * 2 - 2)
  })

  it('trúng: −1 Máu, có sự kiện ban/trung; 3 viên ⇒ bị hạ, chờ hồi rồi về sân với khiên và đủ Máu', () => {
    const tr = doiMat(220)
    tr.ghe[0].yd.ban = true
    let su: ReturnType<typeof laySuKien> = []
    for (let i = 0; i < 200 && tr.ghe[1].biHa === 0; i++) { buocTran(tr, BUOC); su = su.concat(laySuKien(tr)) }
    expect(su.filter((s) => s.t === 'trung').map((s) => (s as { mau: number }).mau)).toEqual([2, 1, 0])
    expect(su.some((s) => s.t === 'ha' && s.ai === 2 && s.boi === 1)).toBe(true)
    const [a, b] = tr.ghe
    expect(a.ha).toBe(1); expect(b.biHa).toBe(1); expect(a.trung).toBe(3); expect(b.cho).toBeGreaterThan(0)
    a.yd.ban = false
    chay(tr, GIAY_HOI + 0.1)
    expect(b.cho).toBe(0); expect(b.mau).toBe(MAU_TOI_DA); expect(b.khien).toBeGreaterThan(0)
  })

  it('khiên hồi sinh và Khiên nhặt được chặn đạn, không mất Máu', () => {
    const tr = doiMat(220)
    tr.ghe[1].khien = 5
    tr.ghe[0].yd.ban = true
    chay(tr, 1)
    expect(tr.ghe[1].mau).toBe(MAU_TOI_DA)
    const tr2 = doiMat(220)
    tr2.ghe[1].giap = true; tr2.ghe[0].yd.ban = true
    let lan = 0
    for (let i = 0; i < 200 && tr2.ghe[1].mau === MAU_TOI_DA; i++) { buocTran(tr2, BUOC); lan += laySuKien(tr2).filter((s) => s.t === 'chan').length }
    expect(tr2.ghe[1].giap).toBe(false); expect(lan).toBeGreaterThanOrEqual(1)
  })

  it('vật che chặn đạn (bắn xuyên bình cầu giữa sân không trúng)', () => {
    const tr = taoTran('doi', [{ id: 1, nt: 0 }, { id: 2, nt: 1 }], 3)
    const [a, b] = tr.ghe
    a.x = 300; a.y = 200; b.x = 300; b.y = 400; a.khien = b.khien = 0; tr.henVp = 999
    a.yd = { dx: 0, dy: 0, ngam: Math.PI / 2, ban: true }
    chay(tr, 2)
    expect(b.mau).toBe(MAU_TOI_DA)
    expect(thayNhau(300, 200, 300, 400)).toBe(false)
    expect(thayNhau(100, 560, 500, 560)).toBe(true)
  })

  it('hạ đủ 5 ⇒ thắng ngay; hết 90 giây ⇒ ai hạ nhiều hơn thắng; bằng nhau ⇒ hoà', () => {
    const tr = doiMat(220)
    tr.ghe[0].ha = LUAT.doi.haThang - 1
    tr.ghe[0].yd.ban = true
    for (let i = 0; i < 400 && !tr.xong; i++) buocTran(tr, BUOC)
    expect(tr.xong).toBe(true); expect(tr.thang).toBe(1)
    const t2 = doiMat(500); t2.ghe[1].ha = 2; t2.ghe[0].ha = 1
    chay(t2, LUAT.doi.giay + 1, 0.5)
    expect(t2.xong).toBe(true); expect(t2.thang).toBe(2)
    const t3 = doiMat(500)
    chay(t3, LUAT.doi.giay + 1, 0.5)
    expect(t3.thang).toBeNull()
  })

  it('vật phẩm hiện theo hẹn; nhặt Xúc tác ⇒ bắn nhanh 5 giây', () => {
    const tr = taoTran('doi', [{ id: 1, nt: 0 }, { id: 2, nt: 1 }], 11)
    tr.henVp = 0.01
    buocTran(tr, BUOC)
    expect(tr.vp).not.toBeNull()
    const vp = tr.vp!
    vp.loai = 0
    tr.ghe[0].x = vp.x; tr.ghe[0].y = vp.y
    buocTran(tr, BUOC)
    expect(tr.vp).toBeNull(); expect(tr.ghe[0].xucTac).toBeGreaterThan(4.5)
  })

  it('tất định: cùng hạt giống + cùng ý định ⇒ cùng kết quả; A.I tự hạ được người đứng yên', () => {
    const a = taoTran('ai', [{ id: 1, nt: 0 }, { id: 2, nt: 3 }], 42), b = taoTran('ai', [{ id: 1, nt: 0 }, { id: 2, nt: 3 }], 42)
    for (const tr of [a, b]) for (let i = 0; i < 1200 && !tr.xong; i++) { tr.ghe[1].yd = yDinhAI(tr, tr.ghe[1], 1); buocTran(tr, BUOC) }
    expect(a.ghe.map((g) => [Math.round(g.x), Math.round(g.y), g.ha, g.biHa])).toEqual(b.ghe.map((g) => [Math.round(g.x), Math.round(g.y), g.ha, g.biHa]))
    expect(a.ghe[1].ha).toBeGreaterThan(0)
  })
})

describe('Đấu Nguyên Tử · gói nhị phân', () => {
  it('ý định 8 byte, mã hoá ⇄ giải mã', () => {
    const b = maYDinh(300, { dx: 0.5, dy: -1, ngam: 1.234, ban: true })
    expect(b.length).toBe(8)
    const y = docYDinh(b)!
    expect(y.seq).toBe(300 & 0xff); expect(y.yd.dx).toBeCloseTo(0.5, 2); expect(y.yd.dy).toBe(-1); expect(y.yd.ngam).toBeCloseTo(1.234, 3); expect(y.yd.ban).toBe(true)
    expect(docYDinh(new Uint8Array(7))).toBeNull()
  })
  it('ảnh trận 1–1 không sự kiện ≤ 24 byte; có sự kiện vẫn giải đúng; ack ghi riêng từng em', () => {
    const tr = doiMat(220)
    tr.ghe[0].yd.ban = true
    const rong = maAnh(1, tr.con, tr.ghe, [])
    expect(rong.length).toBe(6 + 2 * 9)
    let su: ReturnType<typeof laySuKien> = []
    while (!su.some((s) => s.t === 'trung')) { buocTran(tr, BUOC); su = laySuKien(tr) }
    const b = datAck(maAnh(9, tr.con, tr.ghe, su), 77)
    expect(b.length).toBeLessThanOrEqual(64)
    const a = docAnh(b)!
    expect(a.ack).toBe(77); expect(a.tick).toBe(9); expect(a.ghe).toHaveLength(2)
    expect(a.ghe[0].x).toBeCloseTo(tr.ghe[0].x, 1); expect(a.ghe[1].mau).toBe(tr.ghe[1].mau)
    expect(a.su.map((s) => s.t)).toEqual(su.map((s) => s.t))
  })
})
