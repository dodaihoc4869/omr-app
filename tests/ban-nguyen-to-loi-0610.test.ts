// Lõi thuần của mini-game phòng chờ "Bắn nguyên tố": rng và dt do test cấp nên kết quả tất định.
import { describe, expect, it } from 'vitest'
import { HANG, LOAI_HAT, buoc, chamHat, dichTau, taoHat, taoTrangThai, type TrangThai } from '../src/components/phong-cho/ban-nguyen-to-loi'

const rng = () => 0.5
const chiSo = (ma: string) => LOAI_HAT.findIndex(l => l.ma === ma)
/** Sân trống, một hạt đứng thẳng trên đầu tàu (không trôi) để đo số lần bắn. */
function sanMotHat(ma: string): TrangThai {
  const tt = taoTrangThai(340, 352, false, rng)
  tt.hat = []
  const h = taoHat(tt, chiSo(ma), tt.tauX, 80, rng); h.vx = 0; h.vy = 0; tt.hat.push(h)
  return tt
}
/** Đặt một hạt electron trên đầu tàu rồi bắn đến khi vỡ (thật sự bằng đạn). */
function voMot(tt: TrangThai) {
  const truoc = tt.soVo
  const h = taoHat(tt, chiSo('e'), tt.tauX, 80, rng); h.vx = 0; h.vy = 0; tt.hat = [h]
  for (let i = 0; i < 400 && tt.soVo === truoc; i++) buoc(tt, 0.02, rng)
}
const chay = (tt: TrangThai, giay: number, dt = 0.03) => { for (let t = 0; t < giay; t += dt) buoc(tt, dt, rng) }

describe('bảng hạt', () => {
  it('giữ đúng điểm và số lần bắn đã chốt', () => {
    const bang = Object.fromEntries(LOAI_HAT.map(l => [l.kyHieu, [l.diem, l.soLanBan]]))
    expect(bang).toEqual({ 'H₂O': [20, 2], 'e⁻': [10, 1], 'p⁺': [10, 1], 'CO₂': [25, 2], 'C₂H₅OH': [30, 3], 'Fe³⁺': [35, 3] })
    expect(LOAI_HAT.find(l => l.ma === 'e')!.nhom).toBe('electron')
    expect(LOAI_HAT.find(l => l.ma === 'p')!.nhom).toBe('proton')
    expect(LOAI_HAT.find(l => l.ma === 'fe3')!.nhom).toBe('ion')
  })
})

describe('bắn vỡ và điểm', () => {
  it.each(LOAI_HAT.map(l => [l.ma, l.soLanBan, l.diem] as const))('%s vỡ đúng sau %i viên và cộng %i điểm', (ma, soLan, diem) => {
    const tt = sanMotHat(ma)
    let dan = 0, truoc = 0
    while (!tt.soVo && dan < 400) {
      const daBan = tt.daBan; buoc(tt, 0.02, rng); dan += tt.daBan - daBan
      if (tt.soVo === 0) truoc = tt.hat[0].hp
    }
    expect(tt.soVo).toBe(1)
    expect(tt.diem).toBe(diem)
    expect(tt.gan).toBe(chiSo(ma))
    expect(tt.daKham).toEqual([chiSo(ma)])
    expect(truoc).toBe(1) // trước viên cuối còn đúng một chấm máu
    expect(tt.tia).toHaveLength(1)
    expect(soLan).toBeGreaterThanOrEqual(1)
  })
  it('hạt nhiều máu cần nhiều viên đạn trúng hơn hạt ít máu', () => {
    const a = sanMotHat('e'), b = sanMotHat('fe3')
    const demDan = (tt: TrangThai) => { let n = 0; while (!tt.soVo && n < 400) { const d = tt.daBan; buoc(tt, 0.02, rng); n += tt.daBan - d } return n }
    expect(demDan(b)).toBeGreaterThan(demDan(a))
  })
})

describe('liên tiếp', () => {
  it('tăng theo từng hạt vỡ, về 0 khi quá lâu không vỡ hạt nào', () => {
    const tt = taoTrangThai(340, 352, false, rng)
    voMot(tt); expect(tt.lienTiep).toBe(1)
    voMot(tt); expect(tt.lienTiep).toBe(2)
    tt.hat = []
    dichTau(tt, 0); tt.tauX = 48 // tàu né sang mép: hạt mới sinh ra giữa sân không bị bắn
    chay(tt, HANG.hetLienTiep + 0.5)
    expect(tt.lienTiep).toBe(0)
  })
})

describe('giới hạn nhẹ máy', () => {
  it('không bao giờ quá 6 hạt và 12 viên đạn cùng lúc, kể cả khi bước thời gian rất lớn', () => {
    const tt = taoTrangThai(340, 352, false, Math.random)
    let toiDaHat = 0, toiDaDan = 0
    for (let i = 0; i < 4000; i++) {
      buoc(tt, i % 50 === 0 ? 0.07 : 0.03, Math.random)
      toiDaHat = Math.max(toiDaHat, tt.hat.length); toiDaDan = Math.max(toiDaDan, tt.dan.length)
    }
    expect(toiDaHat).toBeLessThanOrEqual(HANG.toiDaHat)
    expect(toiDaDan).toBeLessThanOrEqual(HANG.toiDaDan)
    expect(tt.soVo).toBeGreaterThan(0)
  })
  it('đạn đầy 12 thì không bắn thêm', () => {
    const tt = sanMotHat('fe3'); tt.hat = []
    tt.xucTacCon = 1e9 // bắn nhanh nhất
    for (let i = 0; i < 12; i++) tt.dan.push({ x: 0, y: 5 })
    tt.tichBan = 5
    buoc(tt, 0.001, rng)
    expect(tt.dan.length).toBeLessThanOrEqual(12)
  })
})

describe('không có thua', () => {
  it('hạt chạm đáy chỉ mờ đi rồi biến mất, điểm không đổi', () => {
    const tt = taoTrangThai(340, 352, false, rng)
    tt.diem = 100; tt.tauX = 20; tt.mucTieu = 20 / 340 // tàu lệch, đạn không trúng
    tt.hat = []
    const h = taoHat(tt, chiSo('fe3'), 300, tt.cao - HANG.vachMo + 1, rng); h.vx = 0; h.vy = 30; tt.hat.push(h)
    buoc(tt, 0.3, rng)
    expect(tt.hat[0].mo).toBeLessThan(1)
    expect(tt.hat[0].mo).toBeGreaterThan(0)
    chay(tt, HANG.giayMo + 0.5)
    expect(tt.hat.find(k => k.id === h.id)).toBeUndefined()
    expect(tt.diem).toBe(100)
  })
})

describe('xúc tác', () => {
  const soDan = (tt: TrangThai, giay: number) => { const d = tt.daBan; chay(tt, giay, 0.02); return tt.daBan - d }
  it('bắn nhanh gấp đôi trong vài giây rồi trở lại bình thường', () => {
    const thuong = taoTrangThai(340, 352, false, rng); thuong.hat = []
    const nhanh = taoTrangThai(340, 352, false, rng); nhanh.hat = []; nhanh.xucTacCon = HANG.xucTacGiay
    const a = soDan(thuong, 2), b = soDan(nhanh, 2)
    expect(b / a).toBeGreaterThan(1.8)
    expect(b / a).toBeLessThan(2.3)
    chay(nhanh, HANG.xucTacGiay)
    expect(nhanh.xucTacCon).toBe(0)
    nhanh.hat = []
    expect(soDan(nhanh, 2)).toBeLessThanOrEqual(a + 1)
  })
  it('cứ 8 hạt vỡ có một vật phẩm rơi ra, tàu hứng thì bật xúc tác', () => {
    const tt = taoTrangThai(340, 352, false, rng)
    for (let i = 0; i < HANG.moiXucTac; i++) voMot(tt)
    expect(tt.vatPham).toHaveLength(1)
    expect(tt.xucTacCon).toBe(0)
    tt.hat = []; tt.vatPham[0].x = tt.tauX; tt.vatPham[0].y = 100
    chay(tt, 2, 0.02)
    expect(tt.vatPham).toHaveLength(0)
    expect(tt.xucTacCon).toBeGreaterThan(HANG.xucTacGiay - 2.1)
  })
  it('vật phẩm không hứng được thì rơi khỏi sân', () => {
    const tt = taoTrangThai(340, 352, false, rng); tt.hat = []
    tt.vatPham.push({ x: 10, y: 100 }); tt.tauX = 300; tt.mucTieu = 300 / 340
    chay(tt, 5)
    expect(tt.vatPham).toHaveLength(0)
    expect(tt.xucTacCon).toBe(0)
  })
})

describe('giảm chuyển động', () => {
  it('hạt đứng yên, không tự bắn, không rơi vật phẩm; chạm một cái thì vỡ và hạt mới hiện ra', () => {
    const tt = taoTrangThai(340, 352, true, rng)
    const truoc = tt.hat.map(h => [h.x, h.y])
    chay(tt, 10)
    expect(tt.dan).toHaveLength(0)
    expect(tt.daBan).toBe(0)
    expect(tt.hat.map(h => [h.x, h.y])).toEqual(truoc)
    const n = tt.hat.length, a = tt.hat[0], diem = LOAI_HAT[a.loai].diem
    expect(chamHat(tt, 0, 0, rng)).toBe(false)
    expect(chamHat(tt, a.x, a.y, rng)).toBe(true)
    expect(tt.diem).toBe(diem)
    expect(tt.soVo).toBe(1)
    expect(tt.hat.length).toBe(n)
  })
})

describe('tàu', () => {
  it('bám mục tiêu và không ra khỏi sân', () => {
    const tt = taoTrangThai(340, 352, false, rng); tt.hat = []
    dichTau(tt, 5); expect(tt.mucTieu).toBe(1)
    chay(tt, 2); expect(tt.tauX).toBeLessThanOrEqual(340 - 48 + 0.01); expect(tt.tauX).toBeGreaterThan(280)
    dichTau(tt, -3); chay(tt, 2); expect(tt.tauX).toBeGreaterThanOrEqual(48 - 0.01)
  })
})
