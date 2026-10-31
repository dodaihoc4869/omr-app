// @vitest-environment node
// «ĐẤU NGUYÊN TỬ 2» · LÕI (src/lib/dau-ion/loi.ts, chạy chung máy chủ + máy em) — thầy duyệt 31/10 docs/DE-XUAT-DAU-ION-V2-3110.md.
// Khoá: tự ngắm (gần nhất, tầm 320, vật che, giữ mục tiêu 25 %, bỏ qua khiên hồi sinh / vắng), 5 cấp súng (số viên, nhịp, dây chuyền, nổ lan),
// electron lên cấp, Xúc tác, Khiên 3 viên, bị hạ xuống 1 cấp + rơi 3 electron + người hạ +2, hồi Máu, ván 60 giây, xếp hạng, tất định theo hạt giống.
import { describe, expect, it } from 'vitest'
import { CAN_E, CAP, GIAY_VAN, MAU_MAX, TAM_NGAM, aiDi, buocTran, chonMuc, laySuKien, taoTran, themGhe, vanMoi, xepBang, type Ghe, type Tran } from '../src/lib/dau-ion/loi'

/** Trận trống (không vật phẩm, không khiên hồi sinh), đặt ghế tay. */
function tran(n: number): Tran {
  const tr = taoTran(Array.from({ length: n }, (_, i) => ({ id: i + 1, nt: i })), 7)
  tr.vp = []; tr.su = []; tr.henE = 1e9; tr.henXt = 1e9; tr.henKh = 1e9
  for (const g of tr.ghe) { g.che = 0; g.x = -1000 - g.id * 100; g.y = 40; g.nap = 9 }
  return tr
}
const dat = (tr: Tran, id: number, o: Partial<Ghe>) => Object.assign(tr.ghe.find((g) => g.id === id)!, o)
const chay = (tr: Tran, giay: number, buoc = 1 / 20) => { const su = []; for (let t = 0; t < giay - 1e-9; t += buoc) { buocTran(tr, buoc); su.push(...laySuKien(tr)) } return su }

describe('Tự ngắm', () => {
  it('chọn bạn gần nhất trong tầm 320, không bị vật che; ngoài tầm ⇒ không ai', () => {
    const tr = tran(3)
    const em = dat(tr, 1, { x: 60, y: 60 }), gan = dat(tr, 2, { x: 60, y: 200 }), xa = dat(tr, 3, { x: 260, y: 60 })
    expect(chonMuc(tr.ghe, em)).toBe(gan)
    dat(tr, 2, { x: 60, y: 60 + TAM_NGAM + 5 })
    expect(chonMuc(tr.ghe, em)).toBe(xa)
    dat(tr, 3, { x: 60 + TAM_NGAM + 5, y: 60 })
    expect(chonMuc(tr.ghe, em)).toBeNull()
    void xa
  })
  it('vật che chắn đường bắn ⇒ bỏ qua bạn đó (bình cầu giữa sân)', () => {
    const tr = tran(3)
    const em = dat(tr, 1, { x: 220, y: 300 })
    dat(tr, 2, { x: 380, y: 300 }) // sau bình cầu (300, 300, r 42)
    const tren = dat(tr, 3, { x: 220, y: 520 })
    expect(chonMuc(tr.ghe, em)).toBe(tren)
  })
  it('giữ mục tiêu cũ tới khi có bạn gần hơn hẳn (25 %)', () => {
    const tr = tran(3)
    const em = dat(tr, 1, { x: 60, y: 60, muc: 2 })
    const cu = dat(tr, 2, { x: 60, y: 260 }) // 200
    dat(tr, 3, { x: 230, y: 60 }) // 170: gần hơn nhưng chưa tới 25 %
    expect(chonMuc(tr.ghe, em)).toBe(cu)
    const moi = dat(tr, 3, { x: 200, y: 60 }) // 140 × 1,25 = 175 < 200
    expect(chonMuc(tr.ghe, em)).toBe(moi)
  })
  it('bỏ qua bạn còn khiên hồi sinh, đang chờ hồi, hoặc vắng', () => {
    const tr = tran(2)
    const em = dat(tr, 1, { x: 60, y: 60 }), b = dat(tr, 2, { x: 60, y: 160 })
    for (const o of [{ che: 1 }, { cho: 1 }, { vang: true }]) { Object.assign(b, { che: 0, cho: 0, vang: false }, o); expect(chonMuc(tr.ghe, em)).toBeNull() }
  })
  it('máy chủ tự bắn khi có mục tiêu; ghế vắng KHÔNG tự bắn; không có mục tiêu ⇒ không bắn', () => {
    const tr = tran(2)
    dat(tr, 1, { x: 60, y: 60, nap: 0 }); dat(tr, 2, { x: 60, y: 200, nap: 0 })
    const su = chay(tr, 0.05)
    expect(su.filter((s) => s.t === 'ban').map((s) => s.t === 'ban' && s.chu).sort()).toEqual([1, 2])
    const tr2 = tran(2)
    dat(tr2, 1, { x: 60, y: 60, nap: 0, vang: true }); dat(tr2, 2, { x: 60, y: 560, nap: 0 })
    expect(chay(tr2, 1).filter((s) => s.t === 'ban')).toHaveLength(0)
  })
})

describe('5 cấp súng', () => {
  it('số viên mỗi loạt 1 · 2 · 3 · 3 · 5; nhịp loạt 0,34 · 0,34 · 0,36 · 0,36 · 0,4 giây', () => {
    expect(CAP.slice(1).map((c) => c.vien.length)).toEqual([1, 2, 3, 3, 5])
    expect(CAP.slice(1).map((c) => c.nhip)).toEqual([0.34, 0.34, 0.36, 0.36, 0.4])
    for (let cap = 1; cap <= 5; cap++) {
      const tr = tran(2)
      dat(tr, 1, { x: 60, y: 60, cap, nap: 0 }); dat(tr, 2, { x: 60, y: 1e4 })
      dat(tr, 2, { x: 300, y: 560 }) // ngoài tầm: không bắn trả
      dat(tr, 1, { x: 300, y: 460 })
      buocTran(tr, 0.05)
      expect(tr.dan.filter((d) => d.chu === 1)).toHaveLength(CAP[cap].vien.length)
    }
  })
  it('bắn đúng nhịp: Cấp 1 trong 1,02 giây bắn 3 loạt', () => {
    const tr = tran(2)
    dat(tr, 1, { x: 300, y: 460, nap: 0 }); dat(tr, 2, { x: 300, y: 560, nap: 99, mau: 999 })
    expect(chay(tr, 1.02).filter((s) => s.t === 'ban' && s.chu === 1)).toHaveLength(3)
  })
  it('Cấp 4 · dây chuyền: trúng thì tia sét nảy sang bạn gần nhất (≤ 170), trừ thêm 1 Máu', () => {
    const tr = tran(3)
    dat(tr, 1, { x: 300, y: 430, cap: 4, nap: 0 }); dat(tr, 2, { x: 300, y: 540, nap: 99 }); dat(tr, 3, { x: 420, y: 540, nap: 99 })
    const su = chay(tr, 0.5)
    expect(su.some((s) => s.t === 'xich' && s.chu === 1 && s.a === 2 && s.b === 3)).toBe(true)
    expect(su.some((s) => s.t === 'trung' && s.ai === 3 && s.phu === 1)).toBe(true)
  })
  it('Cấp 5 · toả nhiệt: trúng thì nổ lan bán kính 46, bạn đứng sát cũng mất Máu', () => {
    const tr = tran(3)
    dat(tr, 1, { x: 300, y: 430, cap: 5, nap: 0 }); dat(tr, 2, { x: 300, y: 540, nap: 99 }); dat(tr, 3, { x: 340, y: 548, nap: 99 })
    const su = chay(tr, 0.4)
    expect(su.some((s) => s.t === 'no' && s.chu === 1)).toBe(true)
    expect(su.some((s) => s.t === 'trung' && s.ai === 3 && s.phu === 2)).toBe(true)
  })
})

describe('Vật phẩm', () => {
  it('electron: đủ 3 · 5 · 7 · 9 thì lên cấp; Cấp 5 thì electron hồi 1 Máu', () => {
    expect([...CAN_E]).toEqual([0, 3, 5, 7, 9])
    const tr = tran(1)
    const em = dat(tr, 1, { x: 100, y: 500 })
    const nhatE = () => { tr.vp.push({ id: 200, k: 'e', x: em.x, y: em.y, t0: -1 }); buocTran(tr, 0.05) }
    for (let i = 0; i < 3; i++) nhatE()
    expect(em.cap).toBe(2)
    for (let i = 0; i < 5 + 7 + 9; i++) nhatE()
    expect(em.cap).toBe(5); expect(em.e).toBe(0)
    em.mau = 4; nhatE()
    expect(em.mau).toBe(5)
  })
  it('Xúc tác: lên ngay 1 cấp; Cấp 5 thì hồi đầy Máu', () => {
    const tr = tran(1)
    const em = dat(tr, 1, { x: 100, y: 500, cap: 3 })
    tr.vp.push({ id: 9, k: 'xt', x: em.x, y: em.y, t0: -1 }); buocTran(tr, 0.05)
    expect(em.cap).toBe(4)
    expect(laySuKien(tr).find((s) => s.t === 'len')).toMatchObject({ ai: 1, cap: 4, xt: true })
    Object.assign(em, { cap: 5, mau: 2 }); tr.vp.push({ id: 9, k: 'xt', x: em.x, y: em.y, t0: -1 }); buocTran(tr, 0.05)
    expect(em.mau).toBe(MAU_MAX)
  })
  it('Khiên: chặn đúng 3 viên kế tiếp', () => {
    const tr = tran(2)
    dat(tr, 1, { x: 300, y: 450, nap: 0 })
    const b = dat(tr, 2, { x: 300, y: 540, nap: 99, khien: 3 })
    const su = chay(tr, 1.6)
    expect(su.filter((s) => s.t === 'chan' && s.ai === 2)).toHaveLength(3)
    expect(b.khien).toBe(0)
    expect(b.mau).toBeLessThan(MAU_MAX)
  })
  it('vật phẩm hiện lại: electron giữ ~14 cái; Xúc tác và Khiên mỗi thứ một cái', () => {
    const tr = taoTran([{ id: 1, nt: 0 }], 3)
    for (let i = 0; i < 20 * 30; i++) { buocTran(tr, 0.05); laySuKien(tr) }
    expect(tr.vp.filter((v) => v.k === 'e').length).toBeGreaterThanOrEqual(12)
    expect(tr.vp.filter((v) => v.k === 'xt').length).toBeLessThanOrEqual(1)
    expect(tr.vp.filter((v) => v.k === 'kh').length).toBeLessThanOrEqual(1)
  })
})

describe('Bị hạ, hồi Máu, ván, xếp hạng', () => {
  it('hết Máu ⇒ súng xuống 1 cấp, rơi 3 electron tại chỗ, hồi sau 1,5 giây; người hạ +2 electron', () => {
    const tr = tran(2)
    const a = dat(tr, 1, { x: 300, y: 450, nap: 0, cap: 2, e: 0 })
    const b = dat(tr, 2, { x: 300, y: 540, nap: 99, mau: 1, cap: 3, e: 4 })
    const su = chay(tr, 0.5)
    const ha = su.find((s) => s.t === 'ha')
    expect(ha).toMatchObject({ ai: 2, boi: 1, capCu: 3, chuoi: 1 })
    expect(b.cap).toBe(2); expect(b.e).toBe(0); expect(b.cho).toBeGreaterThan(0)
    expect(su.filter((s) => s.t === 'vp' && s.k === 'e')).toHaveLength(3)
    expect(a.e).toBe(2); expect(a.ha).toBe(1)
    chay(tr, 1.6)
    expect(b.cho).toBeLessThanOrEqual(0); expect(b.mau).toBe(MAU_MAX); expect(b.che).toBeGreaterThan(0)
  })
  it('Cấp 1 bị hạ vẫn Cấp 1', () => {
    const tr = tran(2)
    dat(tr, 1, { x: 300, y: 450, nap: 0 }); const b = dat(tr, 2, { x: 300, y: 540, nap: 99, mau: 1 })
    chay(tr, 0.5)
    expect(b.cap).toBe(1)
  })
  it('2,5 giây không trúng ⇒ hồi 1 Máu mỗi 0,5 giây', () => {
    const tr = tran(1)
    const em = dat(tr, 1, { x: 100, y: 500, mau: 5, biTrungLuc: 0 })
    chay(tr, 2.4); expect(em.mau).toBe(5)
    chay(tr, 1.1); expect(em.mau).toBeGreaterThanOrEqual(6)
  })
  it('ván 60 giây; xếp hạng: hạ nhiều ⇒ ít bị hạ ⇒ cấp cao nhất', () => {
    const tr = tran(3)
    Object.assign(tr.ghe[0], { ha: 2, biHa: 3, capMax: 2 }); Object.assign(tr.ghe[1], { ha: 2, biHa: 1, capMax: 1 }); Object.assign(tr.ghe[2], { ha: 2, biHa: 1, capMax: 4 })
    expect(xepBang(tr).map((d) => d.id)).toEqual([3, 2, 1])
    expect(tr.con).toBe(GIAY_VAN)
    chay(tr, 60, 0.5)
    expect(tr.xong).toBe(true)
    vanMoi(tr)
    expect(tr.xong).toBe(false); expect(tr.ghe.every((g) => g.cap === 1 && g.ha === 0)).toBe(true)
  })
  it('vào giữa ván: hiện ở bệ xa người đang chơi nhất, có khiên hồi sinh 1,2 giây', () => {
    const tr = taoTran([{ id: 1, nt: 0 }], 1)
    Object.assign(tr.ghe[0], { x: 300, y: 60 })
    const g = themGhe(tr, { id: 9, nt: 2 })
    expect(g.y).toBe(548); expect(g.che).toBeCloseTo(1.2)
  })
  it('tất định theo hạt giống (6 ghế A.I, 20 giây)', () => {
    const lam = () => {
      const tr = taoTran(Array.from({ length: 6 }, (_, i) => ({ id: i + 1, nt: i, ai: true })), 42)
      for (let i = 0; i < 400; i++) { for (const g of tr.ghe) g.yd = aiDi(tr, g, 0.05); buocTran(tr, 0.05) }
      return JSON.stringify(xepBang(tr)) + tr.ghe.map((g) => g.x.toFixed(3)).join()
    }
    expect(lam()).toBe(lam())
  })
})
