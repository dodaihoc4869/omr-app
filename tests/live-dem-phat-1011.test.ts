// @vitest-environment node
// LIVE BẢNG — đệm phát + nội suy nét phía máy em (src/lib/live/noi-suy.ts, đặc tả mục 4.4). Chuỗi giờ tới GIẢ: đều · dao động 80 ms · mất 10 %.
// Khoá: đầu nét tiến mỗi khung hình, KHÔNG BAO GIỜ lùi; D trong 30–150 ms, đổi ≤ 2 ms mỗi khung; đồng hồ hai máy lệch bất kỳ vẫn đúng;
// hết điểm thì giữ đầu nét (không đoán xa); đồng bộ tiếng–nét theo trễ tiếng.
import { describe, expect, it } from 'vitest'
import type { DiemBut } from '../src/lib/but-bang-loi'
import type { GoiDiem } from '../src/lib/live/ma-net'
import { dNetTheoTieng, taoDemPhat } from '../src/lib/live/noi-suy'

const DAU = { id: 'n1', cong: 'but' as const, mau: 'rgb(244,239,228)', co: 2.3 }
/** Bộ sinh số giả ngẫu nhiên cố định (test tất định). */
function ngauNhien(hat: number) { let s = hat >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 0x100000000 } }

interface KichBan { giay: number; tre(i: number): number; mat(i: number): boolean; lechDongHo?: number }
/** Thầy viết một nét dài `giay` giây, 200 điểm/giây, x tăng đều; gửi một gói mỗi 16 ms mang lô mới + lô liền trước. Máy em vẽ 60 khung/giây. */
function chay(kb: KichBan, tuy?: Parameters<typeof taoDemPhat>[0]) {
  const dem = taoDemPhat(tuy), lech = kb.lechDongHo ?? 123_456
  const tong = kb.giay * 200, diem: DiemBut[] = []
  for (let i = 0; i < tong; i++) diem.push([i / tong, 0.5, 0.5, i * 5])
  const goi: { nhan: number; g: GoiDiem }[] = []
  let truoc = 0, da = 0
  for (let lo = 0, t = 16; da < tong; lo++, t += 16) {
    const den = Math.min(tong, Math.floor(t / 5) + 1)
    if (den <= da) continue
    const g: GoiDiem = { phien: 1, tGui: 2000 + t, k: 'diem', dau: DAU, tGoc: 2000, tu: truoc, diem: diem.slice(truoc, den) }
    truoc = da; da = den
    if (!kb.mat(lo)) goi.push({ nhan: 2000 + t + lech + kb.tre(lo), g })
  }
  goi.push({ nhan: 2000 + kb.giay * 1000 + 20 + lech + 40, g: { phien: 1, tGui: 2000 + kb.giay * 1000 + 20, k: 'nhac', id: 'n1', tong } })
  goi.sort((a, b) => a.nhan - b.nhan)
  const ra: DiemBut[] = [], ds: number[] = []
  let gi = 0, xong = false, lui = 0, khungViet = 0, khungDung = 0, dungDaiNhat = 0, dungNay = 0, xTruoc = -1
  const t0 = 2000 + lech
  for (let k = 0; !xong && k < (kb.giay + 3) * 60; k++) {
    const nay = t0 + k * (1000 / 60)
    while (gi < goi.length && goi[gi]!.nhan <= nay) { dem.nap(goi[gi]!.g, goi[gi]!.nhan); gi++ }
    const kh = dem.khung(nay)
    ds.push(kh.d)
    const n = kh.net[0]
    if (!n) continue
    ra.push(...n.moi); xong = n.xong
    if (!n.head) continue
    if (n.head.x < xTruoc - 1e-12) lui++
    // «Đang viết»: sau 2 giây làm nóng và trước khi thầy nhấc bút 0,3 giây.
    if (nay - t0 > 2000 && nay - t0 < kb.giay * 1000 - 300) {
      khungViet++
      if (n.head.x <= xTruoc + 1e-12) { khungDung++; dungNay += 1000 / 60; dungDaiNhat = Math.max(dungDaiNhat, dungNay) } else dungNay = 0
    }
    xTruoc = n.head.x
  }
  return { ra, diem, ds, lui, xong, khungViet, khungDung, dungDaiNhat, soDo: dem.soDo(t0 + 99_999) }
}
const dTrongKhoang = (ds: number[], a = 30, b = 150) => ds.every((d) => d >= a - 1e-9 && d <= b + 1e-9)
const buocToiDa = (ds: number[]) => Math.max(...ds.slice(1).map((d, i) => Math.abs(d - ds[i]!)))

describe('đệm phát nét', () => {
  it('gói tới ĐỀU (trễ mạng 40 ms): đầu nét tiến ở MỌI khung, không lùi, đủ mọi điểm đúng thứ tự, D bám sàn 30–50 ms', () => {
    const r = chay({ giay: 6, tre: () => 40, mat: () => false })
    expect(r.xong).toBe(true)
    expect(r.ra).toEqual(r.diem)
    expect(r.lui).toBe(0)
    expect(r.khungViet).toBeGreaterThan(200)
    expect(r.khungDung).toBe(0)
    expect(dTrongKhoang(r.ds)).toBe(true)
    expect(r.ds[r.ds.length - 1]).toBeLessThanOrEqual(50)
    expect(r.soDo.mat).toBe(0)
  })
  it('giờ tới DAO ĐỘNG 0–80 ms (gói tới lệch thứ tự): D tự nâng, đầu nét không lùi, khoảng đứng dài nhất ≤ 50 ms', () => {
    const rn = ngauNhien(7)
    const r = chay({ giay: 8, tre: () => 40 + rn() * 80, mat: () => false })
    expect(r.xong).toBe(true)
    expect(r.lui).toBe(0)
    expect(dTrongKhoang(r.ds)).toBe(true)
    expect(buocToiDa(r.ds)).toBeLessThanOrEqual(2 + 1e-9)
    expect(r.ds[r.ds.length - 1]).toBeGreaterThan(80) // D ≈ p95 dao động + một lô
    expect(r.khungDung / r.khungViet).toBeLessThan(0.05)
    expect(r.dungDaiNhat).toBeLessThanOrEqual(50)
    expect(r.ra.length / r.diem.length).toBeGreaterThan(0.99)
  })
  it('MẤT 10 % gói (dao động 0–30 ms): lô lặp vá chỗ mất, đầu nét không lùi, gần như không đứng', () => {
    const rn = ngauNhien(11), rm = ngauNhien(23)
    const mat = Array.from({ length: 2000 }, () => rm() < 0.1)
    const r = chay({ giay: 8, tre: () => 40 + rn() * 30, mat: (i) => mat[i]! })
    expect(r.xong).toBe(true)
    expect(r.lui).toBe(0)
    expect(dTrongKhoang(r.ds)).toBe(true)
    expect(r.khungDung / r.khungViet).toBeLessThan(0.05)
    expect(r.dungDaiNhat).toBeLessThanOrEqual(50)
    // Chỉ thủng khi mất HAI gói liền (≈ 1 % số lô) ⇒ còn ≥ 97 % điểm; bản chốt từ sổ nét thay phần thủng.
    expect(r.ra.length / r.diem.length).toBeGreaterThan(0.97)
    for (let i = 1; i < r.ra.length; i++) expect(r.ra[i]![3]).toBeGreaterThan(r.ra[i - 1]![3])
  })
  it('đồng hồ máy em lệch đồng hồ máy thầy bất kỳ (âm, dương, rất lớn) ⇒ kết quả như nhau', () => {
    const a = chay({ giay: 3, tre: () => 40, mat: () => false, lechDongHo: -987_654_321 })
    const b = chay({ giay: 3, tre: () => 40, mat: () => false, lechDongHo: 5 })
    expect(a.ra).toEqual(a.diem)
    expect(b.ra).toEqual(b.diem)
    expect(a.khungDung + b.khungDung).toBe(0)
  })
  it('hết điểm mà nét chưa nhấc ⇒ giữ đầu nét tại điểm cuối, không đoán xa; máy yếu D + 16 ms', () => {
    const dem = taoDemPhat()
    dem.nap({ phien: 1, tGui: 100, k: 'diem', dau: DAU, tGoc: 0, tu: 0, diem: [[0.1, 0.2, 0.5, 80], [0.2, 0.2, 0.5, 100]] }, 1100)
    let cuoi = null as null | { x: number; y: number }
    for (let t = 1100; t < 3000; t += 16) { const n = dem.khung(t).net[0]; if (n?.head) cuoi = n.head; expect(n?.xong ?? false).toBe(false) }
    expect(cuoi).toMatchObject({ x: 0.2, y: 0.2 })
    const yeu = taoDemPhat({ mayYeu: true })
    expect(yeu.khung(0).d).toBeGreaterThanOrEqual(46)
  })
  it('con trỏ lơ lửng: nội suy theo cùng mốc phát; đứng yên quá 1,5 giây không có gói ⇒ ẩn', () => {
    const dem = taoDemPhat()
    for (let i = 0; i <= 10; i++) dem.nap({ phien: 1, tGui: i * 50, k: 'tro', x: i / 10, y: 0.5 }, 1000 + i * 50)
    const xs: number[] = []
    for (let t = 1000; t < 1600; t += 16) { const tr = dem.khung(t).tro; if (tr) xs.push(tr.x) }
    expect(xs.length).toBeGreaterThan(20)
    for (let i = 1; i < xs.length; i++) expect(xs[i]!).toBeGreaterThanOrEqual(xs[i - 1]!)
    expect(xs[xs.length - 1]).toBe(1)
    expect(dem.khung(1600 + 2000).tro).toBeNull()
  })
})

describe('đồng bộ tiếng–nét (đặc tả 4.4)', () => {
  it('D nét = kẹp(trễ tiếng − 60, D theo dao động, 150): nét đi trước tiếng ≤ 80 ms, không bao giờ dưới D dao động', () => {
    expect(dNetTheoTieng(null, 46)).toBe(46)
    expect(dNetTheoTieng(90, 46)).toBe(46) // tiếng nhanh ⇒ giữ D theo dao động
    expect(dNetTheoTieng(160, 46)).toBe(100)
    expect(dNetTheoTieng(400, 46)).toBe(150) // trần
    expect(dNetTheoTieng(160, 120)).toBe(120)
  })
  it('có trễ tiếng 180 ms ⇒ D tiến dần lên 120 ms, mỗi khung ≤ 2 ms; bỏ số tiếng ⇒ D hạ dần về mức dao động', () => {
    const dem = taoDemPhat()
    dem.datDTheoTieng(180)
    const ds: number[] = []
    for (let t = 0; t < 2000; t += 16) ds.push(dem.khung(t).d)
    expect(buocToiDa(ds)).toBeLessThanOrEqual(2 + 1e-9)
    expect(ds[ds.length - 1]).toBeCloseTo(120, 5)
    dem.datDTheoTieng(null)
    for (let t = 2000; t < 4000; t += 16) ds.push(dem.khung(t).d)
    expect(ds[ds.length - 1]).toBeLessThanOrEqual(50)
    expect(dTrongKhoang(ds)).toBe(true)
  })
})
