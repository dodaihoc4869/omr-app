// @vitest-environment node
// TRÒ «GIỮ LỬA» phòng chờ Live theo khối (thầy duyệt 12/11, đặc tả docs/dac-ta-live-moi-1211.md mục 4) — khoá luật của LÕI THUẦN src/lib/live-khoi/tro-loi.ts.
import { describe, expect, it } from 'vitest'
import { SAN_CAO, SAN_RONG, type TroAnh } from '../src/lib/live-khoi/kieu'
import {
  ANH_MS, BAT_TU_MS, HAT_MOC_MS, HOI_SINH_MS, M_MAX, M_MIN, NHIP_GUI_MS, NHIP_NHAC_MS, SO_HAT, TANG_HE, TANG_HOI_MS, TANG_MS, VAN_MS,
  apThuong, banKinh, biThuPhuc, buoc, capLua, capNhatDomKhac, dangChet, diemDoi, diemHoiSinh, dungGoi, gocDoi, hatHien, hoiTang, sinhHat, taoNgauNhien,
  taoNhipGui, taoToi, thuGui, tocDo, trongGoc, trongVong, vanSo, viTriDom, vongLanh, type DauVao, type DomKhac, type Hat, type TrangThaiToi,
} from '../src/lib/live-khoi/tro-loi'

/** Đầu ván 1000 (vòng lạnh còn kín sân). */
const T0 = 1000 * VAN_MS
const YEN: DauVao = { dx: 0, dy: 0, tang: false }
const giua = (m: number, doi = 0, nay = T0): TrangThaiToi => ({ ...taoToi(doi, nay), x: 500, y: 300, m })
const hat1 = (x: number, y: number, gt = 3): Hat => ({ id: 0, x, y, loai: gt === 6 ? 1 : 0, gt })
const dom = (sbd: string, x: number, y: number, m: number, doi: number): DomKhac => ({ sbd, x, y, m, doi })

describe('Giữ Lửa — bản đồ hạt theo hạt giống chung', () => {
  it('cùng hạt giống ⇒ cùng dãy số; khác hạt giống ⇒ khác', () => {
    const a = taoNgauNhien(42), b = taoNgauNhien(42), c = taoNgauNhien(43)
    const da = [a(), a(), a()], db = [b(), b(), b()], dc = [c(), c(), c()]
    expect(da).toEqual(db)
    expect(da).not.toEqual(dc)
    for (const v of da) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1) }
  })
  it('mọi máy cùng số ván ⇒ cùng bản đồ hạt; ván khác ⇒ bản đồ khác', () => {
    expect(vanSo(T0 + 12_345)).toBe(1000)
    expect(vanSo(T0 + VAN_MS)).toBe(1001)
    expect(sinhHat(vanSo(T0 + 5))).toEqual(sinhHat(vanSo(T0 + 80_000)))
    expect(sinhHat(1000)).not.toEqual(sinhHat(1001))
  })
  it('đủ số hạt, nằm trong sân, không nằm trong góc đội nào', () => {
    const ds = sinhHat(7)
    expect(ds).toHaveLength(SO_HAT)
    for (const h of ds) {
      expect(h.x).toBeGreaterThan(0); expect(h.x).toBeLessThan(SAN_RONG)
      expect(h.y).toBeGreaterThan(0); expect(h.y).toBeLessThan(SAN_CAO)
      for (let d = 0; d < 4; d++) expect(trongGoc(h.x, h.y, d)).toBe(false)
    }
    expect(new Set(ds.map((h) => h.id)).size).toBe(SO_HAT)
  })
})

describe('Giữ Lửa — di chuyển, gom hạt, tăng tốc', () => {
  it('gom hạt chạm thân ⇒ tăng khối lượng; hạt ẩn trên máy mình rồi mọc lại sau 8 giây', () => {
    const h = [hat1(505, 300, 6)]
    const k = buoc(giua(10), YEN, 16, T0 + 100, h, [])
    expect(k.anHat).toEqual([0])
    expect(k.tt.m).toBe(16)
    expect(hatHien(k.tt, 0, T0 + 200)).toBe(false)
    const k2 = buoc(k.tt, YEN, 16, T0 + 200, h, [])
    expect(k2.anHat).toEqual([])
    expect(k2.tt.m).toBe(16)
    expect(hatHien(k.tt, 0, T0 + 100 + HAT_MOC_MS)).toBe(true)
    const k3 = buoc(k2.tt, YEN, 16, T0 + 100 + HAT_MOC_MS, h, [])
    expect(k3.tt.m).toBe(22)
  })
  it('khối lượng không vượt 400; hạt ở xa không gom', () => {
    expect(buoc(giua(399), YEN, 16, T0 + 100, [hat1(500, 300, 6)], []).tt.m).toBe(M_MAX)
    expect(buoc(giua(10), YEN, 16, T0 + 100, [hat1(600, 300)], []).anHat).toEqual([])
  })
  it('bán kính lớn dần theo khối lượng, tốc độ giảm dần', () => {
    expect(banKinh(400)).toBeGreaterThan(banKinh(100))
    expect(banKinh(100)).toBeGreaterThan(banKinh(10))
    expect(tocDo(400)).toBeLessThan(tocDo(100))
    expect(tocDo(100)).toBeLessThan(tocDo(10))
    const nhe = buoc(giua(10), { dx: 1, dy: 0, tang: false }, 100, T0 + 100, [], []).tt.x - 500
    const nang = buoc(giua(300), { dx: 1, dy: 0, tang: false }, 100, T0 + 100, [], []).tt.x - 500
    expect(nhe).toBeCloseTo(tocDo(10) * 0.1, 5)
    expect(nang).toBeLessThan(nhe)
  })
  it('hướng dài quá 1 được chuẩn hoá; đốm bị kẹp trong sân', () => {
    const cheo = buoc(giua(10), { dx: 1, dy: 1, tang: false }, 100, T0 + 100, [], []).tt
    expect(Math.hypot(cheo.x - 500, cheo.y - 300)).toBeCloseTo(tocDo(10) * 0.1, 5)
    let tt = { ...giua(10, 1), x: 20, y: 300 }
    for (let i = 1; i <= 30; i++) tt = buoc(tt, { dx: -1, dy: 0, tang: false }, 100, T0 + i * 100, [], []).tt
    expect(tt.x).toBeCloseTo(banKinh(tt.m), 5)
    expect(tt.x).toBeGreaterThan(0)
  })
  it('tăng tốc ×1,8 trong 1,2 giây, tốn 5% khối lượng, hồi 4 giây mới bấm lại được', () => {
    const t = T0 + 1000
    const k = buoc(giua(100), { dx: 1, dy: 0, tang: true }, 100, t, [], [])
    expect(k.vuaTang).toBe(true)
    expect(k.tt.m).toBeCloseTo(95, 6)
    expect(k.tt.x - 500).toBeCloseTo(tocDo(95) * TANG_HE * 0.1, 5)
    expect(hoiTang(k.tt, t)).toBe(0)
    expect(hoiTang(k.tt, t + TANG_HOI_MS / 2)).toBeCloseTo(0.5, 6)
    // Bấm lại khi chưa hồi: không tốn thêm, không kéo dài.
    const k2 = buoc(k.tt, { dx: 1, dy: 0, tang: true }, 100, t + 500, [], [])
    expect(k2.vuaTang).toBeUndefined()
    expect(k2.tt.m).toBeCloseTo(95, 6)
    // Hết 1,2 giây: về tốc độ thường.
    const k3 = buoc(k2.tt, { dx: 1, dy: 0, tang: false }, 100, t + TANG_MS + 1, [], [])
    expect(k3.tt.x - k2.tt.x).toBeCloseTo(tocDo(95) * 0.1, 5)
    // Sau 4 giây bấm lại được.
    expect(hoiTang(k3.tt, t + TANG_HOI_MS)).toBe(1)
    expect(buoc(k3.tt, { dx: 0, dy: 0, tang: true }, 16, t + TANG_HOI_MS, [], []).vuaTang).toBe(true)
  })
  it('khối lượng 10 bấm tăng tốc không tụt dưới 10', () => {
    expect(buoc(giua(10), { dx: 0, dy: 0, tang: true }, 16, T0 + 50, [], []).tt.m).toBe(M_MIN)
  })
})

describe('Giữ Lửa — vòng lạnh', () => {
  it('đầu ván kín sân (bốn góc đều trong vòng), cuối ván co về 55%, sang ván mới mở lại', () => {
    const dau = vongLanh(T0)
    for (const [x, y] of [[0, 0], [SAN_RONG, 0], [0, SAN_CAO], [SAN_RONG, SAN_CAO]]) expect(trongVong(x, y, dau)).toBe(true)
    const cuoi = vongLanh(T0 + VAN_MS - 1)
    expect(cuoi.rx).toBeCloseTo(0.55 * SAN_RONG / 2, 0)
    expect(cuoi.ry).toBeCloseTo(0.55 * SAN_CAO / 2, 0)
    const giuaVan = vongLanh(T0 + VAN_MS / 2)
    expect(giuaVan.rx).toBeLessThan(dau.rx)
    expect(giuaVan.rx).toBeGreaterThan(cuoi.rx)
    expect(vongLanh(T0 + VAN_MS).rx).toBeCloseTo(dau.rx, 6)
  })
  it('ở ngoài vòng mất 4% khối lượng mỗi giây, không dưới 10; ở trong vòng không mất', () => {
    const cuoi = T0 + VAN_MS - 5000
    let ngoai = { ...giua(200, 1, cuoi), x: 500, y: 40 }
    expect(trongVong(ngoai.x, ngoai.y, vongLanh(cuoi))).toBe(false)
    for (let i = 1; i <= 10; i++) { const k = buoc(ngoai, YEN, 100, cuoi + i * 100, [], []); expect(k.ngoaiVong).toBe(true); ngoai = k.tt }
    expect(ngoai.m).toBeCloseTo(200 * 0.96, 6)
    const trong = buoc(giua(200, 1, cuoi), YEN, 100, cuoi + 100, [], [])
    expect(trong.ngoaiVong).toBe(false)
    expect(trong.tt.m).toBe(200)
    const nho = buoc({ ...giua(10, 1, cuoi), x: 500, y: 40 }, YEN, 100, cuoi + 100, [], [])
    expect(nho.tt.m).toBe(M_MIN)
  })
  it('sang ván mới: hạt đã ăn hiện lại, báo vanMoi', () => {
    const k = buoc(giua(10), YEN, 16, T0 + 100, [hat1(500, 300)], [])
    expect(hatHien(k.tt, 0, T0 + 200)).toBe(false)
    const k2 = buoc(k.tt, YEN, 16, T0 + VAN_MS + 1, [], [])
    expect(k2.vanMoi).toBe(true)
    expect(k2.tt.van).toBe(1001)
    expect(k2.tt.hatAn).toEqual({})
  })
})

describe('Giữ Lửa — thu phục và hồi sinh', () => {
  it('đúng ngưỡng 1,15: nặng ≥ 1,15 × mình mới thu phục; dưới ngưỡng thì không', () => {
    const toi = giua(100, 0)
    expect(biThuPhuc(toi, dom('B', 505, 300, 115, 1))).toBe(true)
    expect(biThuPhuc(toi, dom('B', 505, 300, 114.9, 1))).toBe(false)
    expect(biThuPhuc(toi, dom('B', 505, 300, 300, 1))).toBe(true)
  })
  it('cùng đội không thu phục; phải chạm tâm (tâm mình trong thân đốm kia)', () => {
    const toi = giua(100, 2)
    expect(biThuPhuc(toi, dom('B', 500, 300, 400, 2))).toBe(false)
    const r = banKinh(400)
    expect(biThuPhuc(toi, dom('B', 500 + r - 1, 300, 400, 3))).toBe(true)
    expect(biThuPhuc(toi, dom('B', 500 + r + 1, 300, 400, 3))).toBe(false)
  })
  it('bị thu phục: trả biThuPhucBoi + gói báo mang khối lượng lúc bị thu phục, về góc đội khối lượng 10', () => {
    const k = buoc(giua(100, 3), YEN, 16, T0 + 100, [], [dom('S7', 502, 300, 200, 0)])
    expect(k.biThuPhucBoi).toBe('S7')
    expect(k.goiThuPhuc).toEqual({ p: [500, 300, 100], a: 'S7' })
    expect(k.tt.m).toBe(M_MIN)
    expect(k.tt.chetDen).toBe(T0 + 100 + HOI_SINH_MS)
    expect(dangChet(k.tt, T0 + 200)).toBe(true)
    expect({ x: k.tt.x, y: k.tt.y }).toEqual(diemHoiSinh(3))
    expect(trongGoc(k.tt.x, k.tt.y, 3)).toBe(true)
  })
  it('đang chờ hồi sinh: đứng yên, không gom hạt; đủ 3 giây thì hồi sinh ở góc đội với khối lượng 10', () => {
    const chet = buoc(giua(100, 1), YEN, 16, T0 + 100, [], [dom('S7', 500, 300, 200, 0)]).tt
    const p = diemHoiSinh(1)
    const k = buoc(chet, { dx: 1, dy: 1, tang: true }, 100, T0 + 100 + HOI_SINH_MS - 1, [{ id: 0, x: p.x, y: p.y, loai: 0, gt: 3 }], [])
    expect(k.hoiSinh).toBeUndefined()
    expect(k.tt.x).toBe(p.x)
    expect(k.tt.m).toBe(M_MIN)
    expect(k.anHat).toEqual([])
    const s = buoc(k.tt, YEN, 16, T0 + 100 + HOI_SINH_MS, [], [])
    expect(s.hoiSinh).toBe(true)
    expect(dangChet(s.tt, T0 + 100 + HOI_SINH_MS)).toBe(false)
    expect(s.tt.m).toBe(M_MIN)
    expect(trongGoc(s.tt.x, s.tt.y, 1)).toBe(true)
  })
  it('vừa hồi sinh 2 giây chưa bị thu phục lại; hết 2 giây thì bị', () => {
    const t = T0 + 100
    const chet = buoc(giua(100, 1), YEN, 16, t, [], [dom('S7', 500, 300, 200, 0)]).tt
    const p = diemHoiSinh(1)
    const canh = [dom('S7', p.x, p.y, 200, 0)]
    const s = buoc(chet, YEN, 16, t + HOI_SINH_MS, [], canh)
    expect(s.hoiSinh).toBe(true)
    expect(s.biThuPhucBoi).toBeUndefined()
    expect(buoc(s.tt, YEN, 16, t + HOI_SINH_MS + BAT_TU_MS - 1, [], canh).biThuPhucBoi).toBeUndefined()
    expect(buoc(s.tt, YEN, 16, t + HOI_SINH_MS + BAT_TU_MS, [], canh).biThuPhucBoi).toBe('S7')
  })
  it('ảnh chụp có an: [toi, sbdKhac, m] ⇒ mình cộng 50% m (trần 400); dòng của người khác thì không', () => {
    const an: TroAnh['an'] = [['TOI', 'S2', 80], ['S3', 'S4', 200], ['S5', 'TOI', 60]]
    const k = apThuong(giua(100), an, 'TOI')
    expect(k.cong).toBe(40)
    expect(k.tt.m).toBe(140)
    expect(apThuong(giua(100), [['S3', 'S4', 200]], 'TOI').cong).toBe(0)
    expect(apThuong(giua(390), [['TOI', 'S2', 100]], 'TOI').tt.m).toBe(M_MAX)
    expect(apThuong(giua(100), undefined, 'TOI').tt.m).toBe(100)
  })
})

describe('Giữ Lửa — góc đội và điểm đội', () => {
  it('bốn góc đúng vị trí: 0 trên-trái, 1 trên-phải, 2 dưới-trái, 3 dưới-phải', () => {
    const g = [0, 1, 2, 3].map(gocDoi)
    expect(g[0].x).toBeLessThan(500); expect(g[0].y).toBeLessThan(300)
    expect(g[1].x).toBeGreaterThan(500); expect(g[1].y).toBeLessThan(300)
    expect(g[2].x).toBeLessThan(500); expect(g[2].y).toBeGreaterThan(300)
    expect(g[3].x).toBeGreaterThan(500); expect(g[3].y).toBeGreaterThan(300)
  })
  it('vào góc đội mình ⇒ nộp phần vượt 10; góc đội khác thì không', () => {
    const g0 = gocDoi(0)
    const k = buoc({ ...giua(130, 0), x: g0.x + 30, y: g0.y + 30 }, YEN, 16, T0 + 100, [], [])
    expect(k.nop).toBe(120)
    expect(k.tt.m).toBe(M_MIN)
    expect(k.tt.daNop).toBe(120)
    const g1 = gocDoi(1)
    const k2 = buoc({ ...giua(130, 0), x: g1.x - 30, y: g1.y + 30 }, YEN, 16, T0 + 100, [], [])
    expect(k2.nop).toBe(0)
    expect(k2.tt.m).toBe(130)
  })
  it('điểm đội = tổng khối lượng các đốm của đội trong ảnh chụp + phần mình đã nộp (bỏ dòng cũ của chính mình)', () => {
    const ds: TroAnh['ds'] = { TOI: [1, 1, 999, 0], A: [10, 10, 50, 0], B: [10, 10, 70, 1], C: [10, 10, 30, 1], D: [5, 5, 20, 3] }
    expect(diemDoi(ds, { sbd: 'TOI', doi: 0, m: 40, daNop: 120 })).toEqual([210, 100, 0, 20])
    expect(diemDoi(undefined, { sbd: 'TOI', doi: 2, m: 10, daNop: 0 })).toEqual([0, 0, 10, 0])
    // Máy thầy xem trận (không có đốm của mình, đội −1): chỉ là tổng các đốm trong ảnh chụp, không bỏ dòng nào.
    expect(diemDoi(ds, { sbd: '', doi: -1, m: 0, daNop: 0 })).toEqual([1049, 100, 0, 20])
    expect(capLua(0)).toBe(1)
    expect(capLua(510)).toBe(3)
    expect(capLua(1e6)).toBe(9)
  })
})

describe('Giữ Lửa — nội suy đốm khác', () => {
  it('nội suy thẳng giữa hai ảnh chụp 250 ms, kẹp hai đầu', () => {
    const d = { tu: [100, 100, 20] as [number, number, number], den: [200, 300, 40] as [number, number, number], luc: 5000, doi: 1 }
    expect(viTriDom(d, 5000)).toEqual({ x: 100, y: 100, m: 20 })
    expect(viTriDom(d, 5000 + ANH_MS / 2)).toEqual({ x: 150, y: 200, m: 30 })
    expect(viTriDom(d, 5000 + ANH_MS)).toEqual({ x: 200, y: 300, m: 40 })
    expect(viTriDom(d, 9000)).toEqual({ x: 200, y: 300, m: 40 })
    expect(viTriDom(d, 4000)).toEqual({ x: 100, y: 100, m: 20 })
  })
  it('ảnh chụp mới: bỏ chính mình, đốm cũ đi tiếp từ chỗ đang nội suy, đốm vắng bị gỡ, nhảy xa thì hiện thẳng', () => {
    const a1: TroAnh = { ds: { TOI: [1, 1, 10, 0], A: [100, 100, 20, 1], B: [400, 400, 30, 2] }, an: [] }
    const s1 = capNhatDomKhac({}, a1, 'TOI', 1000)
    expect(Object.keys(s1).sort()).toEqual(['A', 'B'])
    expect(s1.A).toEqual({ tu: [100, 100, 20], den: [100, 100, 20], luc: 1000, doi: 1 })
    const s2 = capNhatDomKhac(s1, { ds: { A: [200, 100, 20, 1], B: [410, 400, 30, 2] }, an: [] }, 'TOI', 1250)
    // Ảnh thứ ba tới sớm (giữa chừng): A đang ở 150 ⇒ đi tiếp từ 150.
    const s3 = capNhatDomKhac(s2, { ds: { A: [260, 100, 20, 1], B: [900, 80, 10, 2] }, an: [] }, 'TOI', 1375)
    expect(s3.A.tu[0]).toBeCloseTo(150, 6)
    expect(s3.A.den).toEqual([260, 100, 20])
    expect(s3.B.tu).toEqual([900, 80, 10])
    const s4 = capNhatDomKhac(s3, { ds: { A: [260, 100, 20, 1] }, an: [] }, 'TOI', 1625)
    expect(Object.keys(s4)).toEqual(['A'])
  })
})

describe('Giữ Lửa — gói gửi và giới hạn nhịp', () => {
  it('gói gửi: vị trí nguyên, khối lượng nguyên 10..400, kèm a khi bị thu phục', () => {
    expect(dungGoi({ x: 123.6, y: 45.2, m: 87.5 })).toEqual({ p: [124, 45, 88] })
    expect(dungGoi({ x: -5, y: 9999, m: 3 })).toEqual({ p: [0, SAN_CAO, 10] })
    expect(dungGoi({ x: 1, y: 2, m: 50 }, 'S9')).toEqual({ p: [1, 2, 50], a: 'S9' })
  })
  it('không quá 4 lần / giây dù mỗi khung hình vị trí đều đổi', () => {
    let nhip = taoNhipGui(), dem = 0
    for (let t = 0; t < 1000; t += 16) {
      const k = thuGui(nhip, dungGoi({ x: t, y: 100, m: 10 }), 50_000 + t)
      nhip = k.nhip
      if (k.gui) dem++
    }
    expect(dem).toBe(4)
  })
  it('chỉ gửi khi đổi; đứng yên gửi nhắc mỗi 2 giây để phòng không gỡ đốm', () => {
    const goi = dungGoi({ x: 100, y: 100, m: 10 })
    const k1 = thuGui(taoNhipGui(), goi, 1000)
    expect(k1.gui).toEqual(goi)
    expect(thuGui(k1.nhip, goi, 1000 + NHIP_GUI_MS).gui).toBeNull()
    expect(thuGui(k1.nhip, goi, 1000 + NHIP_NHAC_MS - 1).gui).toBeNull()
    expect(thuGui(k1.nhip, goi, 1000 + NHIP_NHAC_MS).gui).toEqual(goi)
    expect(thuGui(k1.nhip, dungGoi({ x: 101, y: 100, m: 10 }), 1000 + NHIP_GUI_MS).gui).toEqual({ p: [101, 100, 10] })
    expect(thuGui(k1.nhip, dungGoi({ x: 101, y: 100, m: 10 }), 1000 + NHIP_GUI_MS - 1).gui).toBeNull()
  })
  it('gói thu phục không bao giờ bị bỏ: chờ tới lượt rồi gửi trước gói vị trí', () => {
    const k1 = thuGui(taoNhipGui(), dungGoi({ x: 100, y: 100, m: 90 }), 1000)
    const bao = dungGoi({ x: 120, y: 100, m: 90 }, 'S7')
    const goc = dungGoi({ x: 160, y: 140, m: 10 })
    const k2 = thuGui(k1.nhip, goc, 1100, bao)
    expect(k2.gui).toBeNull()
    expect(k2.nhip.cho).toEqual([bao])
    const k3 = thuGui(k2.nhip, goc, 1000 + NHIP_GUI_MS)
    expect(k3.gui).toEqual(bao)
    expect(k3.nhip.cho).toEqual([])
    expect(thuGui(k3.nhip, goc, 1000 + NHIP_GUI_MS + 10).gui).toBeNull()
    expect(thuGui(k3.nhip, goc, 1000 + 2 * NHIP_GUI_MS).gui).toEqual(goc)
  })
})
