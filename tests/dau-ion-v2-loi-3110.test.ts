// @vitest-environment node
// «ĐẤU NGUYÊN TỬ» 3 ĐẤU 3 · LÕI (src/lib/dau-ion/loi.ts, chạy chung máy chủ + máy em) — thầy duyệt bản vẽ 01/11 docs/ban-ve-dau-ion-3v3-0111/DAC-TA.md.
// Khoá: tự ngắm ĐỐI THỦ gần nhất trên CẢ SÂN có đường bắn thông (nấp ⇒ không bắn, nòng vẫn dõi), không bắn / không trúng đồng đội (đạn xuyên, dây chuyền
// và nổ lan bỏ đồng đội), 5 cấp súng, A.I bắn chậm hơn 25 %, vật phẩm rải đối xứng, bị hạ KHÔNG tụt cấp, tỉ số phe, góp sức, huy hiệu mỗi em một cái,
// sân 1040 × 520 đối xứng gương hai trục (không ô nấp an toàn tuyệt đối, bệ giữa khuất), mô phỏng nhiều ván: hai phe cân, 0 lần trúng đồng đội.
import { describe, expect, it } from 'vitest'
import { BE_PHE, CAN_E, CAP, CHO_KH, CHO_XT, GIAY_CHE_MOI, GIAY_VAN, MAU_MAX, R, SAN_H, SAN_W, TAM_NGAM, VAT_CAN, aiDi, buocTran, chonMuc, doiTheo, dungVatCan, huyHieu, laySuKien, taoTran, thayNhau, themGhe, vanMoi, xepBang, type DongKet, type Ghe, type Tran } from '../src/lib/dau-ion/loi'

/** Trận trống (không vật phẩm, không khiên hồi sinh), ghế theo phe cho trước, đặt tay. */
function tran(phe: number[]): Tran {
  const tr = taoTran(phe.map((p, i) => ({ id: i + 1, nt: i % 7, phe: p })), 7)
  tr.vp = []; tr.su = []; tr.henE = 1e9; tr.henXt = 1e9; tr.henKh = 1e9
  for (const g of tr.ghe) { g.che = 0; g.x = -1000 - g.id * 100; g.y = 40; g.nap = 9 }
  return tr
}
const dat = (tr: Tran, id: number, o: Partial<Ghe>) => Object.assign(tr.ghe.find((g) => g.id === id)!, o)
const chay = (tr: Tran, giay: number, buoc = 1 / 20) => { const su = []; for (let t = 0; t < giay - 1e-9; t += buoc) { buocTran(tr, buoc); su.push(...laySuKien(tr)) } return su }
// Hành lang thông y = 470 (dưới hai cốc cánh dưới) — không vật che từ x 30 tới 1010.

describe('Tự ngắm 3 đấu 3', () => {
  it('ngắm ĐỐI THỦ gần nhất trên cả sân (xa 940 vẫn ngắm); đồng đội đứng gần hơn bị bỏ qua', () => {
    expect(TAM_NGAM).toBeGreaterThan(Math.hypot(SAN_W, SAN_H))
    const tr = tran([0, 0, 1])
    const em = dat(tr, 1, { x: 60, y: 470 }); dat(tr, 2, { x: 200, y: 470 }); const xa = dat(tr, 3, { x: 1000, y: 470 })
    expect(chonMuc(tr.ghe, em)).toBe(xa)
  })
  it('vật che chắn đường bắn ⇒ bỏ qua đối thủ đó; MỌI đối thủ đều nấp ⇒ không ngắm, không bắn, nòng vẫn dõi đối thủ gần nhất', () => {
    const tr = tran([0, 1, 1])
    const em = dat(tr, 1, { x: 300, y: 260, nap: 0 })
    dat(tr, 2, { x: 600, y: 260 }) // sau bình nón nhỏ + bình cầu
    const lo = dat(tr, 3, { x: 200, y: 420 })
    expect(chonMuc(tr.ghe, em)).toBe(lo)
    const nap = dat(tr, 3, { x: 300, y: 480 }) // sau cốc cánh dưới (278…322, 402…446)
    expect(chonMuc(tr.ghe, em)).toBeNull()
    expect(doiTheo(tr.ghe, em)).toBe(nap)
    const su = chay(tr, 0.05)
    expect(su.some((s) => s.t === 'ban' && s.chu === 1)).toBe(false)
    expect(em.ngam).toBeCloseTo(Math.PI / 2, 3)
  })
  it('giữ mục tiêu cũ tới khi có đối thủ gần hơn hẳn (25 %)', () => {
    const tr = tran([0, 1, 1])
    const em = dat(tr, 1, { x: 60, y: 470, muc: 2 })
    const cu = dat(tr, 2, { x: 260, y: 470 }) // 200
    dat(tr, 3, { x: 60, y: 300 }) // 170: gần hơn nhưng chưa tới 25 %
    expect(chonMuc(tr.ghe, em)).toBe(cu)
    const moi = dat(tr, 3, { x: 60, y: 330 }) // 140 × 1,25 = 175 < 200
    expect(chonMuc(tr.ghe, em)).toBe(moi)
  })
  it('bỏ qua đối thủ còn khiên hồi sinh, đang chờ hồi, hoặc vắng', () => {
    const tr = tran([0, 1])
    const em = dat(tr, 1, { x: 60, y: 470 }), b = dat(tr, 2, { x: 300, y: 470 })
    for (const o of [{ che: 1 }, { cho: 1 }, { vang: true }]) { Object.assign(b, { che: 0, cho: 0, vang: false }, o); expect(chonMuc(tr.ghe, em)).toBeNull() }
  })
  it('tự bắn khi có đối thủ lộ; ghế vắng KHÔNG bắn; hai đồng đội đứng sát nhau KHÔNG bắn nhau', () => {
    const tr = tran([0, 1])
    dat(tr, 1, { x: 60, y: 470, nap: 0 }); dat(tr, 2, { x: 900, y: 470, nap: 0 })
    expect(chay(tr, 0.05).filter((s) => s.t === 'ban').map((s) => s.t === 'ban' && s.chu).sort()).toEqual([1, 2])
    const tr2 = tran([0, 1])
    dat(tr2, 1, { x: 60, y: 470, nap: 0, vang: true }); dat(tr2, 2, { x: 900, y: 470, nap: 0, vang: true })
    expect(chay(tr2, 1).filter((s) => s.t === 'ban')).toHaveLength(0)
    const tr3 = tran([0, 0])
    dat(tr3, 1, { x: 60, y: 470, nap: 0 }); dat(tr3, 2, { x: 120, y: 470, nap: 0 })
    expect(chay(tr3, 1).filter((s) => s.t === 'ban')).toHaveLength(0)
  })
  it('đạn bay XUYÊN đồng đội đứng giữa đường và vẫn trúng đối thủ phía sau', () => {
    const tr = tran([0, 0, 1])
    dat(tr, 1, { x: 60, y: 470, nap: 0 }); dat(tr, 2, { x: 300, y: 470, nap: 99 }); dat(tr, 3, { x: 700, y: 470, nap: 99, mau: 999 })
    const su = chay(tr, 1.6)
    expect(su.some((s) => s.t === 'trung' && s.ai === 2)).toBe(false)
    expect(su.some((s) => s.t === 'trung' && s.ai === 3 && s.boi === 1)).toBe(true)
  })
})

describe('5 cấp súng', () => {
  it('số viên mỗi loạt 1 · 2 · 3 · 3 · 5; nhịp loạt 0,34 · 0,34 · 0,36 · 0,36 · 0,4 giây', () => {
    expect(CAP.slice(1).map((c) => c.vien.length)).toEqual([1, 2, 3, 3, 5])
    expect(CAP.slice(1).map((c) => c.nhip)).toEqual([0.34, 0.34, 0.36, 0.36, 0.4])
    for (let cap = 1; cap <= 5; cap++) {
      const tr = tran([0, 1])
      dat(tr, 1, { x: 60, y: 470, cap, nap: 0 }); dat(tr, 2, { x: 1000, y: 470 })
      buocTran(tr, 0.05)
      expect(tr.dan.filter((d) => d.chu === 1)).toHaveLength(CAP[cap].vien.length)
    }
  })
  it('A.I bắn chậm hơn người 25 %: trong 2 giây Cấp 1 người 6 loạt, A.I 5 loạt', () => {
    // Người ở hành lang dưới (y 470), A.I ở hành lang trên (y 30): hai đường bắn thông, mỗi người một đối thủ ở đầu kia.
    const tr = tran([0, 1, 0, 1])
    dat(tr, 1, { x: 60, y: 470, nap: 0 }); dat(tr, 2, { x: 1000, y: 470, nap: 99, mau: 999 })
    dat(tr, 3, { x: 60, y: 30, nap: 0, ai: true }); dat(tr, 4, { x: 1000, y: 30, nap: 99, mau: 999 })
    const su = chay(tr, 2)
    expect(su.filter((s) => s.t === 'ban' && s.chu === 1)).toHaveLength(6)
    expect(su.filter((s) => s.t === 'ban' && s.chu === 3)).toHaveLength(5)
  })
  it('Cấp 4 · dây chuyền: nảy sang ĐỐI THỦ gần nhất (≤ 170), không nảy sang đồng đội', () => {
    const tr = tran([0, 1, 1, 0])
    dat(tr, 1, { x: 60, y: 470, cap: 4, nap: 0 }); dat(tr, 2, { x: 200, y: 470, nap: 99, mau: 999 }); dat(tr, 3, { x: 300, y: 470, nap: 99, mau: 999 }); dat(tr, 4, { x: 200, y: 425, nap: 99 })
    const su = chay(tr, 0.5)
    expect(su.some((s) => s.t === 'xich' && s.chu === 1 && s.a === 2 && s.b === 3)).toBe(true)
    expect(su.some((s) => s.t === 'trung' && s.ai === 3 && s.phu === 1)).toBe(true)
    expect(su.some((s) => s.t === 'trung' && s.ai === 4)).toBe(false)
  })
  it('Cấp 5 · toả nhiệt: nổ lan trúng đối thủ đứng sát, KHÔNG trúng đồng đội đứng sát', () => {
    const tr = tran([0, 1, 1, 0])
    dat(tr, 1, { x: 60, y: 470, cap: 5, nap: 0 }); dat(tr, 2, { x: 300, y: 470, nap: 99, mau: 999 }); dat(tr, 3, { x: 335, y: 490, nap: 99, mau: 999 }); dat(tr, 4, { x: 320, y: 430, nap: 99 })
    const su = chay(tr, 0.6)
    expect(su.some((s) => s.t === 'no' && s.chu === 1)).toBe(true)
    expect(su.some((s) => s.t === 'trung' && s.ai === 3 && s.phu === 2)).toBe(true)
    expect(su.some((s) => s.t === 'trung' && s.ai === 4)).toBe(false)
  })
})

describe('Vật phẩm', () => {
  it('electron: đủ 3 · 5 · 7 · 9 thì lên cấp; Cấp 5 thì electron hồi 1 Máu', () => {
    expect([...CAN_E]).toEqual([0, 3, 5, 7, 9])
    const tr = tran([0])
    const em = dat(tr, 1, { x: 100, y: 470 })
    const nhatE = () => { tr.vp.push({ id: 200, k: 'e', x: em.x, y: em.y, t0: -1 }); buocTran(tr, 0.05) }
    for (let i = 0; i < 3; i++) nhatE()
    expect(em.cap).toBe(2)
    for (let i = 0; i < 5 + 7 + 9; i++) nhatE()
    expect(em.cap).toBe(5); expect(em.e).toBe(0); expect(em.nhatE).toBe(24)
    em.mau = 4; nhatE()
    expect(em.mau).toBe(5)
  })
  it('Xúc tác: lên ngay 1 cấp; Cấp 5 thì hồi đầy Máu', () => {
    const tr = tran([0])
    const em = dat(tr, 1, { x: 100, y: 470, cap: 3 })
    tr.vp.push({ id: 9, k: 'xt', x: em.x, y: em.y, t0: -1 }); buocTran(tr, 0.05)
    expect(em.cap).toBe(4)
    expect(laySuKien(tr).find((s) => s.t === 'len')).toMatchObject({ ai: 1, cap: 4, xt: true })
    Object.assign(em, { cap: 5, mau: 2 }); tr.vp.push({ id: 9, k: 'xt', x: em.x, y: em.y, t0: -1 }); buocTran(tr, 0.05)
    expect(em.mau).toBe(MAU_MAX)
  })
  it('Khiên: chặn đúng 3 viên kế tiếp', () => {
    const tr = tran([0, 1])
    dat(tr, 1, { x: 60, y: 470, nap: 0 })
    const b = dat(tr, 2, { x: 300, y: 470, nap: 99, khien: 3 })
    const su = chay(tr, 2)
    expect(su.filter((s) => s.t === 'chan' && s.ai === 2)).toHaveLength(3)
    expect(b.khien).toBe(0)
    expect(b.mau).toBeLessThan(MAU_MAX)
  })
  it('rải ĐỐI XỨNG: electron theo cặp đối xứng tâm; Xúc tác hiện cùng lúc ở hai cánh; Khiên trước hai căn cứ', () => {
    const tr = taoTran([{ id: 1, nt: 0, phe: 0 }, { id: 2, nt: 1, phe: 0 }], 3)
    const su = [...laySuKien(tr), ...chay(tr, 30)]
    const e = su.filter((s) => s.t === 'vp' && s.k === 'e') as { x: number; y: number }[]
    expect(e.length).toBeGreaterThanOrEqual(16)
    for (const v of e) expect(e.some((w) => Math.abs(w.x - (SAN_W - v.x)) < 1e-6 && Math.abs(w.y - (SAN_H - v.y)) < 1e-6)).toBe(true)
    const vt = (k: string) => su.filter((s) => s.t === 'vp' && s.k === k).map((s) => s.t === 'vp' && [s.x, s.y].join())
    expect(new Set(vt('xt'))).toEqual(new Set(CHO_XT.map((p) => p.join())))
    expect(new Set(vt('kh'))).toEqual(new Set(CHO_KH.map((p) => p.join())))
  })
})

describe('Bị hạ (thân thiện), tỉ số phe, hồi Máu, ván', () => {
  it('hết Máu ⇒ KHÔNG tụt cấp súng, chỉ mất electron đang gom; rơi 2 electron; người hạ +2 electron; tỉ số phe +1; hồi sau 1,2 giây ở bệ phe mình', () => {
    const tr = tran([0, 1])
    const a = dat(tr, 1, { x: 60, y: 470, nap: 0, cap: 2, e: 0 })
    const b = dat(tr, 2, { x: 300, y: 470, nap: 99, mau: 1, cap: 3, e: 4 })
    const su = chay(tr, 0.6)
    expect(su.find((s) => s.t === 'ha')).toMatchObject({ ai: 2, boi: 1, capCu: 3, chuoi: 1 })
    expect(b.cap).toBe(3); expect(b.e).toBe(0); expect(b.cho).toBeGreaterThan(0)
    expect(su.filter((s) => s.t === 'vp' && s.k === 'e')).toHaveLength(2)
    expect(a.e).toBe(2); expect(a.ha).toBe(1); expect(tr.ti).toEqual([1, 0])
    chay(tr, 1.3)
    expect(b.cho).toBeLessThanOrEqual(0); expect(b.mau).toBe(MAU_MAX); expect(b.che).toBeGreaterThan(0)
    expect(BE_PHE[1].some(([x, y]) => x === b.x && y === b.y)).toBe(true)
  })
  it('góp sức: trúng đối thủ trong 4 giây trước khi đồng đội hạ ⇒ +1 góp sức', () => {
    const tr = tran([0, 0, 1])
    const a = dat(tr, 1, { x: 60, y: 470 }), b = dat(tr, 2, { x: 60, y: 420 })
    const c = dat(tr, 3, { x: 300, y: 470, nap: 99, mau: 2 })
    c.boiLuc[a.id] = 0
    a.nap = 99; b.nap = 0
    chay(tr, 1)
    expect(c.biHa).toBe(1); expect(b.ha).toBe(1); expect(a.hoTro).toBe(1)
  })
  it('2,5 giây không trúng ⇒ hồi 1 Máu mỗi 0,5 giây', () => {
    const tr = tran([0])
    const em = dat(tr, 1, { x: 100, y: 470, mau: 5, biTrungLuc: 0 })
    chay(tr, 2.4); expect(em.mau).toBe(5)
    chay(tr, 1.1); expect(em.mau).toBeGreaterThanOrEqual(6)
  })
  it('ván 60 giây; ván mới: mọi người về Cấp 1, tỉ số về 0 – 0, đứng ở bệ phe mình', () => {
    const tr = tran([0, 1, 0])
    expect(tr.con).toBe(GIAY_VAN)
    chay(tr, 60, 0.5)
    expect(tr.xong).toBe(true)
    tr.ti = [3, 2]
    vanMoi(tr)
    expect(tr.xong).toBe(false); expect(tr.ti).toEqual([0, 0])
    expect(tr.ghe.every((g) => g.cap === 1 && g.ha === 0 && BE_PHE[g.phe].some(([x, y]) => x === g.x && y === g.y))).toBe(true)
  })
  it('vào giữa ván: vào phe ít ghế hơn, hiện ở bệ phe mình xa đối thủ nhất, khiên 3 giây', () => {
    const tr = taoTran([{ id: 1, nt: 0, phe: 0 }, { id: 2, nt: 1, phe: 0 }, { id: 3, nt: 2, phe: 1 }], 1)
    Object.assign(tr.ghe[0], { x: 900, y: 424 })
    const g = themGhe(tr, { id: 9, nt: 3 })
    expect(g.phe).toBe(1); expect(g.che).toBe(GIAY_CHE_MOI)
    expect([g.x, g.y]).toEqual([964, 96]) // xa Bazơ đang đứng ở (900, 424) nhất
  })
  it('tất định theo hạt giống (6 ghế A.I, 20 giây)', () => {
    const lam = () => {
      const tr = taoTran(Array.from({ length: 6 }, (_, i) => ({ id: i + 1, nt: i, ai: true, phe: i % 2 })), 42)
      for (let i = 0; i < 400; i++) { for (const g of tr.ghe) g.yd = aiDi(tr, g, 0.05); buocTran(tr, 0.05) }
      return JSON.stringify(xepBang(tr)) + tr.ghe.map((g) => g.x.toFixed(3)).join()
    }
    expect(lam()).toBe(lam())
  })
})

describe('Huy hiệu hết ván (không ai «đứng chót»)', () => {
  it('mỗi em THẬT đúng một huy hiệu, chia đều; A.I không nhận; ai còn thiếu ⇒ «Hăng hái»', () => {
    const d = (id: number, o: Partial<DongKet>): DongKet => ({ id, nt: 0, phe: id % 2, ai: false, ha: 0, biHa: 0, capMax: 1, chuoiMax: 0, cap: 1, nhatE: 0, hoTro: 0, trung: 0, songMax: 0, ...o })
    const bang = [d(1, { ha: 5, trung: 30, nhatE: 20 }), d(2, { ha: 4, hoTro: 3 }), d(3, { nhatE: 9 }), d(4, { songMax: 40 }), d(5, {}), d(6, { ai: true, ha: 9 })]
    const h = huyHieu(bang)
    expect(h.get(1)?.ten).toBe('Xạ thủ')
    expect(h.get(2)?.ten).toBe('Đồng đội cứu nguy')
    expect(h.get(3)?.ten).toBe('Nhặt electron giỏi')
    expect(h.get(4)?.ten).toBe('Bền bỉ')
    expect(h.get(5)?.ten).toBe('Hăng hái')
    expect(h.has(6)).toBe(false)
    expect(new Set([...h.values()].map((x) => x.k)).size).toBe(5)
  })
})

describe('Sân chiến thuật 1040 × 520', () => {
  it('đối xứng gương HAI trục: mọi vật che, bệ, Xúc tác, Khiên đều có ảnh gương', () => {
    const k = (v: (typeof VAT_CAN)[number]) => (v.k === 'tron' ? `t${v.x},${v.y},${v.r}` : `c${v.x},${v.y},${v.w},${v.h}`)
    const ds = new Set(VAT_CAN.map(k))
    for (const v of VAT_CAN) {
      const g = v.k === 'tron' ? [{ ...v, x: SAN_W - v.x }, { ...v, y: SAN_H - v.y }] : [{ ...v, x: SAN_W - v.x - v.w }, { ...v, y: SAN_H - v.y - v.h }]
      for (const m of g) expect(ds.has(k(m as never))).toBe(true)
    }
    for (let i = 0; i < 3; i++) expect([BE_PHE[0][i][0] + BE_PHE[1][i][0], BE_PHE[0][i][1] + BE_PHE[1][i][1]]).toEqual([SAN_W, SAN_H])
    for (const ds2 of [CHO_XT, CHO_KH]) expect([ds2[0][0] + ds2[1][0], ds2[0][1] + ds2[1][1]]).toEqual([SAN_W, SAN_H])
  })
  it('không bệ nào thấy bệ đối thủ; bệ giữa khuất với cả nửa sân đối thủ; KHÔNG có ô nấp an toàn tuyệt đối (ô kín nhất vẫn lộ ≥ 10 % sân)', () => {
    for (const a of BE_PHE[0]) for (const b of BE_PHE[1]) expect(thayNhau(a[0], a[1], b[0], b[1])).toBe(false)
    const o: [number, number][] = []
    for (let x = R; x <= SAN_W - R; x += 20) for (let y = R; y <= SAN_H - R; y += 20) if (!dungVatCan(x, y, R)) o.push([x, y])
    const [gx, gy] = BE_PHE[0][1]
    expect(o.filter((p) => p[0] > SAN_W / 2 + 10).some((p) => thayNhau(gx, gy, p[0], p[1]))).toBe(false)
    let kinNhat = 1
    for (const p of o) { let n = 0; for (const q of o) if (thayNhau(p[0], p[1], q[0], q[1])) n++; kinNhat = Math.min(kinNhat, n / o.length) }
    expect(kinNhat).toBeGreaterThanOrEqual(0.1)
  }, 30_000)
  it('mô phỏng 100 ván 6 A.I: hai phe cân (chênh tổng hạ < 10 %), 0 lần trúng đồng đội', () => {
    let a = 0, b = 0, dongDoi = 0
    for (let hat = 1; hat <= 100; hat++) {
      const tr = taoTran([0, 1, 2, 3, 4, 5].map((i) => ({ id: i + 1, nt: i, ai: true, phe: i < 3 ? 0 : 1 })), hat * 7919)
      while (!tr.xong) {
        for (const g of tr.ghe) g.yd = aiDi(tr, g, 1 / 20)
        buocTran(tr, 1 / 20)
        for (const s of laySuKien(tr)) if (s.t === 'trung') { const x = tr.ghe.find((g) => g.id === s.ai)!, y = tr.ghe.find((g) => g.id === s.boi)!; if (x.phe === y.phe) dongDoi++ }
      }
      a += tr.ti[0]; b += tr.ti[1]
    }
    console.log(`[dau-ion-3v3] 100 ván 6 A.I: hạ Bazơ ${a} · Axit ${b}`)
    expect(dongDoi).toBe(0)
    expect(Math.abs(a - b) / (a + b)).toBeLessThan(0.1)
  }, 30_000)
})
