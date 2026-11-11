// @vitest-environment node
// NÉT TRÊN MẠNG YẾU (thầy 12/11: «Nãy tôi thử iphone mạng wifi 1 vạch nét chữ ko mượt») — đệm phát của máy em (src/lib/live/noi-suy.ts).
// Khoá: gói kèm 3 lô trước ⇒ mất 3 gói liền không thủng; thủng thì xin đường phụ WebSocket (`canTro`) và gói phụ vá lỗ mà không làm đổi D;
// đứt rồi gói về dồn cục ⇒ phát bù có trần (không hiện vụt), tồn quá 1,2 giây mới hiện ngay phần cũ; gói muộn của nét đã xong bị bỏ; con trỏ tới lệch
// thứ tự không giật lùi; nét mất tin nhấc không giữ đồng hồ khi đã thấy bút rời; D nới tới 450 ms theo rung thật rồi rút dần, tính theo thời gian.
// Cả đường truyền (máy thầy gửi theo luật mới + mất gói / rung / đứt): scripts/thu-live-1011/do-mang-yeu.mjs.
import { describe, expect, it } from 'vitest'
import type { DiemBut } from '../src/lib/but-bang-loi'
import { DU_TOI_DA, LO_KEM, daGuiDc, netGuiMoi, tuGoiCuoi, tuGoiDc, tuGoiWs } from '../src/lib/live/gui-diem'
import { DIEM_TOI_DA_MOT_GOI, GOI_DIEM_TOI_DA, giaiGoi, maGoiDiem, type GoiDiem } from '../src/lib/live/ma-net'
import { taoDemPhat, type DemPhat } from '../src/lib/live/noi-suy'

const DAU = { id: 'b_n1', cong: 'but' as const, mau: 'rgb(244,239,228)', co: 1.7 }
const LECH = 1000, KHUNG = 1000 / 60
/** Nét mẫu: `n` điểm, cách nhau 5 ms (bút 200 Hz), đi ngang. */
const net = (n: number): DiemBut[] => Array.from({ length: n }, (_, i) => [0.1 + i * 0.001, 0.4, 0.5, i * 5] as DiemBut)
/** Máy thầy gửi mỗi 15 ms một lô 3 điểm; gói thứ `j` mang lô j kèm `kem` lô trước. `tGoc` = giờ live lúc nét bắt đầu. */
function goiCua(ds: DiemBut[], kem: number, tGoc = 0, dau = DAU): { nhan: number; g: GoiDiem; phu?: boolean }[] {
  const ra: { nhan: number; g: GoiDiem }[] = []
  for (let j = 0; j * 3 < ds.length; j++) {
    const tu = Math.max(0, (j - kem) * 3), den = Math.min(ds.length, j * 3 + 3), tGui = tGoc + ds[den - 1]![3] + 1
    ra.push({ nhan: tGui + LECH, g: { phien: 1, tGui, k: 'diem', dau, tGoc, tu, diem: ds.slice(tu, den) } })
  }
  return ra
}
/** Chạy máy em từ `tu` tới `den` (đồng hồ máy em), nạp gói đúng giờ tới. Trả mọi điểm đã phát + từng khung. */
function chay(dem: DemPhat, goi: { nhan: number; g: GoiDiem; phu?: boolean }[], tu: number, den: number, khung = KHUNG) {
  const hang = [...goi].sort((a, b) => a.nhan - b.nhan), ra: DiemBut[] = [], ks: { t: number; moi: number; tDau: number; d: number; butX: number | null }[] = []
  let i = 0, tDau = -1
  for (let t = tu; t <= den; t += khung) {
    while (i < hang.length && hang[i]!.nhan <= t) { dem.nap(hang[i]!.g, hang[i]!.nhan, hang[i]!.phu); i++ }
    const k = dem.khung(t)
    let moi = 0
    for (const n of k.net) { for (const p of n.moi) { ra.push(p); moi++; if (p[3] > tDau) tDau = p[3] } }
    ks.push({ t, moi, tDau, d: k.d, butX: k.but ? k.but.x : null })
  }
  return { ra, ks }
}

describe('dư thừa trong gói + đường phụ', () => {
  it('gói kèm 3 lô trước: mất 3 gói LIỀN không thủng nét, không cần đường phụ', () => {
    const ds = net(90), goi = goiCua(ds, 3).filter((_, j) => j < 10 || j > 12)
    const dem = taoDemPhat(), r = chay(dem, goi, LECH, LECH + 900)
    expect(r.ra).toEqual(ds)
    expect(dem.soDo(LECH + 900).mat).toBe(0)
    expect(dem.canTro(LECH + 900)).toBe(false)
  })
  it('mất 5 gói liền ⇒ thủng: không có ai vá thì nối thẳng NGAY (không đứng chờ), `canTro` bật 20 giây rồi tắt', () => {
    const ds = net(90), goi = goiCua(ds, 3).filter((_, j) => j < 10 || j > 14)
    const dem = taoDemPhat(), r = chay(dem, goi, LECH, LECH + 900)
    // lô 10 và 11 mất hẳn (gói 15 chỉ kèm lại lô 12, 13, 14) ⇒ thiếu 6 điểm
    expect(r.ra.length).toBe(84)
    for (let i = 1; i < r.ra.length; i++) expect(r.ra[i]![3]).toBeGreaterThan(r.ra[i - 1]![3])
    expect(dem.canTro(LECH + 900)).toBe(true)
    expect(dem.canTro(LECH + 900 + 19_000)).toBe(true)
    expect(dem.canTro(LECH + 900 + 21_000)).toBe(false)
    const s = dem.soDo(LECH + 900)
    expect(s.mat).toBe(6); expect(s.tro).toBe(true); expect(s.muc).toBe(1)
    // khoảng dừng dài nhất quanh chỗ thủng: không quá quãng thật sự không có gói (5 gói × 15 ms) + hai khung
    let dai = 0, nay = 0
    for (const k of r.ks) { if (k.tDau >= 0 && k.tDau < 445 && k.moi === 0) { nay += KHUNG; dai = Math.max(dai, nay) } else nay = 0 }
    expect(dai).toBeLessThanOrEqual(5 * 15 + 2 * KHUNG + 1)
  })
  it('đường phụ đang chảy: gói phụ (tới muộn hơn) VÁ lỗ ⇒ phát đủ từng điểm, đúng thứ tự; gói phụ không làm D đổi', () => {
    const ds = net(120), chinh = goiCua(ds, 3).filter((_, j) => j < 20 || j > 24)
    // đường phụ: mọi điểm, mỗi 35 ms một gói, tới chậm hơn đường chính 120 ms
    const phu: { nhan: number; g: GoiDiem; phu: boolean }[] = []
    for (let a = 0; a < ds.length; a += 7) { const den = Math.min(ds.length, a + 7), tGui = ds[den - 1]![3] + 1; phu.push({ nhan: tGui + LECH + 120, g: { phien: 1, tGui, k: 'diem', dau: DAU, tGoc: 0, tu: a, diem: ds.slice(a, den) }, phu: true }) }
    const dem = taoDemPhat(), r = chay(dem, [...chinh, ...phu], LECH, LECH + 1400)
    expect(r.ra).toEqual(ds)
    expect(dem.soDo(LECH + 1400).mat).toBe(0)
    // gói phụ tới muộn 120 ms: nếu tính vào dao động thì D đã vọt lên > 120
    expect(Math.max(...r.ks.map((k) => k.d))).toBeLessThan(60)
  })
  it('gói tới MUỘN của một nét đã phát xong ⇒ bỏ, không dựng lại thành nét thứ hai', () => {
    const ds = net(30), goi = goiCua(ds, 3)
    const dem = taoDemPhat()
    goi.push({ nhan: ds[29]![3] + 2 + LECH, g: { phien: 1, tGui: ds[29]![3] + 2, k: 'nhac', id: DAU.id, tong: 30 } })
    // một gói lặp của chính nét đó tới sau 600 ms (mạng rung, đường phụ chậm)
    goi.push({ nhan: LECH + 800, g: goi[5]!.g })
    const r = chay(dem, goi, LECH, LECH + 1500)
    expect(r.ra).toEqual(ds)
    expect(dem.dangPhat(DAU.id)).toBe(false)
  })
})

describe('luật gửi của máy thầy (gui-diem.ts) + mã gói thật', () => {
  it('mỗi gói DataChannel = lô mới + 3 lô liền trước, vẫn là gói 0x21 cũ (chỉ `tu` lùi lại), ≤ 1.100 byte; mất 3 gói liền máy em vẫn phát đủ điểm', () => {
    const ds = net(120), n = netGuiMoi(DAU, []), goi: { nhan: number; g: GoiDiem }[] = []
    for (let i = 0; i < ds.length; i += 3) {
      n.diem.push(...ds.slice(i, i + 3))
      const tu = tuGoiDc(n), tGui = ds[i + 2]![3] + 1
      expect(tu).toBe(Math.max(0, i - LO_KEM * 3))
      const k = maGoiDiem({ phien: 1, tGui, dau: DAU, tGoc: 0, tu, diem: n.diem.slice(tu) })
      expect(k[0]).toBe(0x21); expect(k.byteLength).toBeLessThanOrEqual(GOI_DIEM_TOI_DA)
      const g = giaiGoi(k, 1)!
      expect(g.k === 'diem' && g.tu).toBe(tu)
      daGuiDc(n)
      goi.push({ nhan: tGui + LECH, g })
    }
    expect(n.lichDc.length).toBe(LO_KEM)
    const dem = taoDemPhat(), r = chay(dem, goi.filter((_, j) => j < 12 || j > 14), LECH, LECH + 1100)
    expect(r.ra.map((p) => p[3])).toEqual(ds.map((p) => p[3]))
    expect(dem.soDo(LECH + 1100).mat).toBe(0)
  })
  it('phần kèm không quá 24 điểm (bút nhanh, lô to); gói lặp cuối nét cùng tầm; WebSocket vừa hết nghẽn chỉ gửi phần mới nhất của nét', () => {
    const ds = net(400), n = netGuiMoi(DAU, [])
    for (let i = 0; i < 100; i += 20) { n.diem.push(...ds.slice(i, i + 20)); const tu = tuGoiDc(n); expect(n.daDc - tu).toBeLessThanOrEqual(DU_TOI_DA); expect(tu).toBeLessThanOrEqual(i); daGuiDc(n) }
    expect(tuGoiCuoi(n)).toBeGreaterThanOrEqual(n.diem.length - DU_TOI_DA - 8)
    expect(tuGoiCuoi(n)).toBeLessThan(n.diem.length - 20)
    // WebSocket: chưa ai cần ⇒ daWs đứng ở 0 ⇒ em vừa xin giữa nét nhận cả nét từ đầu
    expect(tuGoiWs(n)).toBe(0)
    // đường lên nghẽn lúc nét còn điểm chờ, rồi hết nghẽn ⇒ chỉ một gói mới nhất
    n.diem.push(...ds.slice(100)); n.nghen = true
    expect(tuGoiWs(n)).toBe(400 - DIEM_TOI_DA_MOT_GOI)
    expect(n.nghen).toBe(false)
  })
})

describe('đứt rồi có lại', () => {
  /** Nét 2,4 giây; gói gửi trong quãng [tu, den) bị giữ lại, về cả cục lúc `den` (mạng có lại). */
  const donCuc = (tu: number, den: number) => { const ds = net(480); return { ds, goi: goiCua(ds, 3).map((x) => (x.g.tGui >= tu && x.g.tGui < den ? { ...x, nhan: den + LECH + 5 } : x)) } }
  it('đứt 0,8 giây rồi gói về dồn cục: PHÁT BÙ nhanh dần, không khung nào hiện quá 2,5 lần thời gian khung, bắt kịp trong ~1 giây; đủ điểm', () => {
    const { ds, goi } = donCuc(600, 1400)
    const dem = taoDemPhat(), r = chay(dem, goi, LECH, LECH + 3200)
    expect(r.ra).toEqual(ds)
    let lon = 0
    for (let i = 1; i < r.ks.length; i++) lon = Math.max(lon, r.ks[i]!.tDau - r.ks[i - 1]!.tDau)
    expect(lon).toBeLessThanOrEqual(2.5 * KHUNG + 10) // + một bước mẫu 5 ms × 2 (điểm phát theo từng mẫu)
    expect(lon).toBeGreaterThan(1.5 * KHUNG) // có phát bù thật
    // 1,1 giây sau khi mạng có lại: đã bám kịp (chậm hơn thầy không quá D + 60 ms)
    const k = r.ks.find((x) => x.t >= LECH + 1400 + 1100)!
    expect(k.t - LECH - k.tDau).toBeLessThan(k.d + 60)
    expect(dem.soDo(LECH + 3200).vut).toBe(0)
  })
  it('đứt 2 giây (tồn đọng quá 1,2 giây): HIỆN NGAY phần cũ một lần, chỉ phát động ~0,5 giây mới nhất — không tua cả đoạn dài', () => {
    const { ds, goi } = donCuc(300, 2300)
    const dem = taoDemPhat(), r = chay(dem, goi, LECH, LECH + 4000)
    expect(r.ra).toEqual(ds)
    const buoc: number[] = []
    for (let i = 1; i < r.ks.length; i++) buoc.push(r.ks[i]!.tDau - r.ks[i - 1]!.tDau)
    const vut = buoc.filter((b) => b > 250)
    expect(vut.length).toBe(1)
    expect(vut[0]).toBeGreaterThan(1200)
    // ngoài lần đó ra không khung nào quá 2,5 lần
    expect(Math.max(...buoc.filter((b) => b <= 250))).toBeLessThanOrEqual(2.5 * KHUNG + 10)
    expect(dem.soDo(LECH + 4000).vut).toBe(1)
  })
  it('mạng đứt giữa nét (không gói nào tới): đồng hồ GIỮ ở điểm cuối tới 2,5 giây — mạng có lại thì phát tiếp từ đúng chỗ dừng', () => {
    const ds = net(300), goi = goiCua(ds, 3).filter((x) => x.g.tGui < 400 || x.g.tGui >= 1100)
    const dem = taoDemPhat()
    let r = chay(dem, goi, LECH, LECH + 1090)
    // trong lúc đứt: đầu nét đứng ở điểm cuối đã nhận, nét vẫn đang phát
    expect(r.ks[r.ks.length - 1]!.tDau).toBeLessThan(400)
    expect(dem.dangPhat(DAU.id)).toBe(true)
    // chưa biết là mạng đứt hay thầy dừng tay ⇒ chưa xin đường phụ; mạng có lại, thấy thủng ⇒ xin, mức mạng lên 1
    expect(dem.canTro(LECH + 1090)).toBe(false)
    r = chay(dem, goi.filter((x) => x.nhan > LECH + 1090), LECH + 1100, LECH + 1900)
    expect(r.ks[r.ks.length - 1]!.tDau).toBe(ds[299]![3])
    expect(dem.soDo(LECH + 1900)).toMatchObject({ tro: true, muc: 1 })
  })
})

describe('con trỏ + nhấc bút khi mất gói', () => {
  it('gói con trỏ tới LỆCH THỨ TỰ (mạng rung): con trỏ không giật lùi', () => {
    const dem = taoDemPhat(), goi: { nhan: number; g: GoiDiem }[] = []
    // con trỏ đi đều sang phải, 60 gói / giây; giờ tới rung 0–90 ms theo một dãy cố định
    for (let i = 0; i < 90; i++) goi.push({ nhan: i * 16 + LECH + ((i * 37) % 90), g: { phien: 1, tGui: i * 16, k: 'tro', x: 0.1 + i * 0.005, y: 0.5 } })
    const r = chay(dem, goi, LECH, LECH + 1700)
    const xs = r.ks.map((k) => k.butX).filter((x): x is number => x != null)
    expect(xs.length).toBeGreaterThan(60)
    for (let i = 1; i < xs.length; i++) expect(xs[i]!).toBeGreaterThanOrEqual(xs[i - 1]! - 1e-9)
  })
  it('nét mất cả gói cuối lẫn tin nhấc, nhưng đã thấy con trỏ lơ lửng sau đó ⇒ không giữ đồng hồ: nét kế chảy ngay, không đứng chờ 350 ms', () => {
    const a = net(30), b = net(60), dem = taoDemPhat()
    const goi = goiCua(a, 3).slice(0, 9) // gói cuối của nét a mất, không có tin nhấc
    const tHet = a[29]![3]
    for (let i = 1; i <= 4; i++) goi.push({ nhan: tHet + i * 16 + LECH, g: { phien: 1, tGui: tHet + i * 16, k: 'tro', x: 0.2, y: 0.5 } })
    const tGocB = tHet + 90
    goi.push(...goiCua(b, 3, tGocB, { ...DAU, id: 'b_n2' }))
    const r = chay(dem, goi, LECH, LECH + tGocB + 500)
    // nét b phát đủ và ĐÚNG NHỊP: điểm cuối của b hiện không muộn hơn D + 60 ms
    const tB = tGocB + b[59]![3], khung = r.ks.find((k) => k.t - LECH >= tB + 22 + 60)!
    expect(r.ra.filter((p) => b.includes(p)).length).toBe(60)
    expect(r.ks.filter((k) => k.t <= khung.t).reduce((s, k) => s + k.moi, 0)).toBe(27 + 60)
  })
})

describe('độ đệm thích nghi', () => {
  /** Gói con trỏ đều 60 / giây, giờ tới rung đều 0 … `rung` ms (dãy cố định). */
  const troRung = (tu: number, den: number, rung: number) => { const ra: { nhan: number; g: GoiDiem }[] = []; let h = 12345; for (let t = tu; t < den; t += 16) { h = (h * 1103515245 + 12345) & 0x7fffffff; ra.push({ nhan: t + LECH + (h % 1000) / 1000 * rung, g: { phien: 1, tGui: t, k: 'tro', x: 0.5, y: 0.5 } }) } return ra }
  it('rung 300 ms: D tự nới vượt trần cũ 150, không quá 450; mỗi khung 16,7 ms nới ≤ 2 ms, rút ≤ 1 ms; mạng tốt lại thì ~10 giây sau mới rút về', () => {
    const dem = taoDemPhat(), goi = [...troRung(0, 6000, 300), ...troRung(6000, 30_000, 0)]
    const r = chay(dem, goi, LECH, LECH + 30_000)
    const dLuc = (t: number) => r.ks.find((k) => k.t >= LECH + t)!.d
    expect(dLuc(5500)).toBeGreaterThan(250); expect(Math.max(...r.ks.map((k) => k.d))).toBeLessThanOrEqual(450)
    for (let i = 1; i < r.ks.length; i++) { const b = r.ks[i]!.d - r.ks[i - 1]!.d; expect(b).toBeLessThanOrEqual(2 + 1e-6); expect(b).toBeGreaterThanOrEqual(-1 - 1e-6) }
    expect(dLuc(12_000)).toBeGreaterThan(200) // 6 giây sau khi mạng tốt lại: còn giữ (cửa sổ chậm 10 giây)
    expect(dLuc(29_000)).toBeLessThan(50) // rồi rút hẳn về mức mạng tốt
  })
  it('máy 30 khung / giây (iPhone tiết kiệm pin): D đổi cùng tốc độ theo THỜI GIAN như máy 60 khung / giây', () => {
    const a = chay(taoDemPhat(), troRung(0, 5000, 300), LECH, LECH + 5000), b = chay(taoDemPhat(), troRung(0, 5000, 300), LECH, LECH + 5000, 1000 / 30)
    const dA = a.ks.find((k) => k.t >= LECH + 3000)!.d, dB = b.ks.find((k) => k.t >= LECH + 3000)!.d
    expect(Math.abs(dA - dB)).toBeLessThan(25)
    expect(dB).toBeGreaterThan(200)
  })
  it('mạng tốt: D ở sàn 22 ms, mức mạng 0, không xin đường phụ', () => {
    const ds = net(200), dem = taoDemPhat(), r = chay(dem, goiCua(ds, 3), LECH, LECH + 1500)
    expect(r.ra).toEqual(ds)
    expect(Math.max(...r.ks.map((k) => k.d))).toBeLessThanOrEqual(22 + 1e-9)
    expect(dem.soDo(LECH + 1500)).toMatchObject({ muc: 0, tro: false, vut: 0, mat: 0 })
  })
})
