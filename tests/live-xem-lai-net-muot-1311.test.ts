// XEM LẠI LIVE — NÉT BÚT MƯỢT (thầy 13/11: «Nét bút xem lại vẫn bị giật, chưa mượt như trong live. Sửa triệt để và áp dụng mọi bản ghi lại»).
// Đo trên Chromium thật (scripts/chup-live-xem-lai-hs-1111/do-net.mjs) cho thấy trong nét đầu bút đã đi đều; chỗ khác live là:
//   · GIỮA HAI NÉT cây bút đứng ở cuối nét rồi vụt sang đầu nét sau (live có đường bút lơ lửng, bản ghi không lưu) ⇒ nay cây bút LƯỚT sang nét kế;
//   · điểm TRÙNG GIỜ (máy thầy gom mẫu) làm đầu nét đứng rồi nhảy cả cụm ⇒ rải đều cụm;
//   · nhiều nét chồng giờ ⇒ cây bút bám một nét tới khi xong, không nhảy qua lại;
//   · `readyState` tụt chốc lát ⇒ đồng hồ không đặt lại.
// Mọi thứ ở TRÌNH PHÁT ⇒ bản ghi cũ tự hưởng, không phải dựng lại.
import { describe, expect, it } from 'vitest'
import type { DiemBut, NetBut, SuKienBut } from '../src/lib/but-bang-loi'
import { taoLoiBut } from '../src/lib/but-bang-loi'
import { maBangMoi, maNetXong } from '../src/lib/live/ma-net'
import { docNetBin, ghiNetBin } from '../src/lib/live/xem-lai-kieu'
import { VUNG_MAC_DINH, maTrang } from '../src/components/live/bo-cuc'
import { CHO_DEM_MS, taoLamMuot } from '../src/screens/live-xem-lai/hs/dong-ho'
import { HIEN_TRUOC_MS, LUOT_TRON_MS, NAN_TRO_MS, giaiMuc, raiGio, taoMayPhat, type KhungMayPhat, type MucPhat } from '../src/screens/live-xem-lai/hs/may-phat'
import { dauLyTuong, hetViet, taoBuoiNet, vietTay, type NetCoGio } from './_live-xem-lai-net-gia'

const KHUNG = 1000 / 60
const TRANG = maTrang('bl', VUNG_MAC_DINH, false)
/** Đóng dãy nét thành mục phát (qua đúng đường `net.bin`: mã hoá → đọc → giải). */
function mucCua(ds: readonly NetCoGio[], dau: { t: number; khung: Uint8Array }[] = []): MucPhat[] {
  const muc = [{ t: 0, khung: maBangMoi(TRANG, 16 / 9) as Uint8Array }, ...dau]
  for (const n of ds) for (const k of maNetXong(n.net)) muc.push({ t: n.t, khung: k })
  muc.sort((a, b) => a.t - b.t)
  return giaiMuc(docNetBin(ghiNetBin(muc)).muc)
}
/** Chạy máy phát 60 khung / giây từ `t0` tới `t1`, trả từng khung. */
function chay(muc: readonly MucPhat[], t0: number, t1: number, nhan: (sk: SuKienBut) => void = () => {}): { t: number; f: KhungMayPhat }[] {
  const may = taoMayPhat(nhan), ra: { t: number; f: KhungMayPhat }[] = []
  may.dungLai(muc, t0)
  for (let t = t0; t <= t1; t += KHUNG) ra.push({ t, f: may.buoc(t) })
  return ra
}
const net = (id: string, diem: DiemBut[]): NetBut => ({ id, cong: 'but', mau: '#f4efe4', co: 3.2, diem })
const dai = (n: NetBut): number => n.diem[n.diem.length - 1]![3]
const BX = +(VUNG_MAC_DINH.bang[0] + 0.02).toFixed(5), BY = +(VUNG_MAC_DINH.bang[1] + 0.1).toFixed(5)
/** Gạch ngang dài `w` trong `ms` mili-giây, điểm cách 10 ms. */
const gach = (x: number, y: number, w: number, ms: number): DiemBut[] => Array.from({ length: Math.round(ms / 10) + 1 }, (_, i) => [+(x + (w * i * 10) / ms).toFixed(5), +y.toFixed(5), 0.5, i * 10] as DiemBut)

describe('điểm trùng giờ', () => {
  it('rải đều cụm điểm cùng giờ trên quãng từ điểm trước nó; nét bình thường và nét dựng lại tức thì giữ nguyên', () => {
    const d = (t: number): DiemBut => [0.7, 0.1, 0.5, t]
    expect(raiGio([d(0), d(8), d(17), d(25)])).toBeNull()
    expect(raiGio([d(0), d(0), d(0), d(0)])).toBeNull() // nét dựng lại tức thì: mọi điểm giờ 0 ⇒ vẫn hiện một lượt
    expect(raiGio([d(0), d(33), d(33), d(33), d(66), d(66)])).toEqual([0, 11, 22, 33, 49.5, 66])
    expect(raiGio([d(0), d(1), d(1)])).toBeNull() // cụm sát điểm trước (dưới 2 ms): không có gì để rải
    const g = raiGio([d(0), d(40), d(40), d(41), d(90), d(90), d(90)])!
    for (let i = 1; i < g.length; i++) expect(g[i]!).toBeGreaterThan(g[i - 1]!) // giờ tăng chặt, không lùi
    expect(g[g.length - 1]).toBe(90) // điểm cuối cụm giữ đúng giờ ⇒ nét không dài ra, không ngắn đi
  })
  it('nét có điểm dồn cụm 33 ms: đầu nét tiến ở MỌI khung hình, bám sát đường viết thật (trước: đứng rồi nhảy cả cụm)', () => {
    const ds = vietTay('cung-gio'), muc = mucCua(ds)
    expect(muc.some((m) => m.k === 'net' && !!m.gio)).toBe(true)
    const kh = chay(muc, 1500, hetViet(ds) + 200)
    let dung = 0, trong = 0, lechLon = 0
    for (let i = 1; i < kh.length; i++) {
      const a = kh[i - 1]!, b = kh[i]!
      if (a.f.dau.length !== 1 || b.f.dau.length !== 1 || a.f.dau[0]!.id !== b.f.dau[0]!.id) continue
      const lt0 = dauLyTuong(ds, a.t), lt1 = dauLyTuong(ds, b.t)
      if (!lt0 || !lt1) continue
      trong += 1
      const di = Math.hypot(lt1.x - lt0.x, lt1.y - lt0.y), dm = Math.hypot(b.f.dau[0]!.x - a.f.dau[0]!.x, b.f.dau[0]!.y - a.f.dau[0]!.y)
      if (di > 0.0008 && dm < di * 0.2) dung += 1
      lechLon = Math.max(lechLon, Math.hypot(b.f.dau[0]!.x - lt1.x, b.f.dau[0]!.y - lt1.y))
    }
    expect(trong).toBeGreaterThan(500)
    expect(dung).toBe(0)
    // giờ ghi trễ hơn giờ thật tối đa một cụm (33 ms) ⇒ đầu nét chỉ lệch chỗ thật trong tầm ấy (bề ngang bảng ≈ 0,3)
    expect(lechLon).toBeLessThan(0.012)
  })
  it('phát hết ⇒ bảng cuối vẫn đúng từng điểm của nét gốc (giờ rải chỉ dùng để phát)', () => {
    const ds = vietTay('cung-gio'), muc = mucCua(ds), loi = taoLoiBut()
    let bang: NetBut[] = []
    chay(muc, 0, hetViet(ds) + 100, (sk) => { bang = loi.apSuKien(bang, sk) })
    expect(bang.map((n) => n.id)).toEqual(ds.map((n) => n.net.id))
    for (const n of ds) expect(bang.find((x) => x.id === n.net.id)!.diem).toEqual(n.net.diem)
  })
})

describe('cây bút giữa hai nét', () => {
  it('viết chữ (nét ngắn nối nhau): cây bút luôn hiện, lướt từ cuối nét sang ĐÚNG đầu nét sau, không khung nào vụt', () => {
    const ds = vietTay('chu'), kh = chay(mucCua(ds), 1900, hetViet(ds))
    let nhac = 0, dungIm = 0, vut = 0, hut = 0
    const buocCua = (i: number): number => { const a = kh[i - 1]?.f.tro, b = kh[i]?.f.tro; return a && b ? Math.hypot(b.x - a.x, b.y - a.y) : 0 }
    for (let i = 1; i < kh.length; i++) {
      const a = kh[i - 1]!, b = kh[i]!
      if (b.t < ds[0]!.t) continue
      expect(b.f.tro).not.toBeNull() // nhấc bút lâu nhất trong kịch bản < 0,7 giây ⇒ không lúc nào mất bút
      if (!a.f.tro || !b.f.tro) continue
      const buoc = Math.hypot(b.f.tro.x - a.f.tro.x, b.f.tro.y - a.f.tro.y)
      if (!b.f.tro.cham && !a.f.tro.cham) { nhac += 1; if (buoc === 0) dungIm += 1 }
      // nét bắt đầu: khung trước đó cây bút đã ở sát đầu nét
      if (b.f.tro.cham && !a.f.tro.cham) { const p = ds.find((n) => n.net.id === b.f.tro!.net)!.net.diem[0]!; if (Math.hypot(a.f.tro.x - p[0], a.f.tro.y - p[1]) > 0.004) hut += 1 }
      // «vụt»: lúc nhấc bút mà MỘT khung dời hơn 1/8 bề ngang một chữ trong khi khung trước và khung sau gần như đứng (sang dòng mới thì lướt nhanh nhưng đều)
      if (!b.f.tro.cham && buoc > 0.0015 && buoc > 3 * Math.max(buocCua(i - 1), buocCua(i + 1)) + 0.0005) vut += 1
    }
    expect(nhac).toBeGreaterThan(400)
    expect(vut).toBe(0)
    expect(hut).toBe(0)
    expect(dungIm / nhac).toBeLessThan(0.08) // trước: ~100 % số khung nhấc bút cây bút đứng im
  })
  it('lướt êm: đi liền mạch từ cuối nét (không giật lúc rời), nhanh dần rồi chậm dần, tới nơi đúng lúc nét sau bắt đầu', () => {
    const a = net('b_a', gach(BX, BY, 0.02, 200)), b = net('b_b', gach(BX + 0.1, BY + 0.05, 0.02, 200))
    const ds = [{ t: 1000, net: a }, { t: 1500, net: b }] // nhấc bút 300 ms
    const kh = chay(mucCua(ds), 900, 1500 + 100)
    const giua = kh.filter((k) => k.t > 1200 && k.t < 1500)
    expect(giua.every((k) => k.f.tro && !k.f.tro.cham && k.f.tro.sat)).toBe(true)
    const cuoiA = a.diem[a.diem.length - 1]!, dauB = b.diem[0]!
    const f = giua.map((k) => (k.f.tro!.x - cuoiA[0]) / (dauB[0] - cuoiA[0]))
    for (let i = 1; i < f.length; i++) expect(f[i]!).toBeGreaterThan(f[i - 1]!) // luôn tiến
    expect(f[0]!).toBeLessThan(0.02); expect(f[f.length - 1]!).toBeGreaterThan(0.98)
    // đi trên đoạn thẳng nối hai đầu
    for (const k of giua) expect(Math.abs((k.f.tro!.y - cuoiA[1]) / (dauB[1] - cuoiA[1]) - (k.f.tro!.x - cuoiA[0]) / (dauB[0] - cuoiA[0]))).toBeLessThan(1e-9)
    const buoc = f.slice(1).map((v, i) => v - f[i]!)
    expect(Math.max(...buoc)).toBeLessThan((KHUNG / 300) * 1.6) // không khung nào đi quá 1,6 lần bước trung bình
  })
  it('nghỉ lâu: nán ở cuối nét rồi mới lướt; nghỉ rất lâu: ẩn, hiện sẵn ở đầu nét kế trước 0,3 giây', () => {
    const a = net('b_a', gach(BX, BY, 0.02, 200)), b = net('b_b', gach(BX + 0.05, BY, 0.02, 200)), c = net('b_c', gach(BX + 0.1, BY, 0.02, 200))
    // a xong lúc 1200 · b bắt đầu 2400 (nghỉ 1,2 giây) · b xong 2600 · c bắt đầu 8000 (nghỉ 5,4 giây)
    const kh = chay(mucCua([{ t: 1000, net: a }, { t: 2400, net: b }, { t: 8000, net: c }]), 900, 8100)
    const tai = (t: number) => kh.find((k) => k.t >= t)!.f.tro
    const cuoiA = a.diem[a.diem.length - 1]!, cuoiB = b.diem[b.diem.length - 1]!
    expect(tai(1300)).toEqual({ x: cuoiA[0], y: cuoiA[1], cham: false }) // còn nán
    expect(tai(1300 + LUOT_TRON_MS)).toMatchObject({ cham: false }) // vẫn hiện suốt quãng nghỉ 1,2 giây
    expect(tai(2370)!.sat).toBe(true)
    expect(Math.abs(tai(2395)!.x - b.diem[0]![0])).toBeLessThan(0.002)
    expect(tai(2600 + NAN_TRO_MS - 50)).toEqual({ x: cuoiB[0], y: cuoiB[1], cham: false })
    expect(tai(2600 + NAN_TRO_MS + 50)).toBeNull() // nghỉ rất lâu: ẩn
    expect(tai(8000 - HIEN_TRUOC_MS - 60)).toBeNull()
    expect(tai(8000 - HIEN_TRUOC_MS + 20)).toEqual({ x: c.diem[0]![0], y: c.diem[0]![1], cham: false }) // hiện sẵn ở đầu nét kế
  })
  it('không lướt sai chỗ: khác vùng (giấy ↔ bảng), sang bảng mới, nét kế là nét dựng lại tức thì', () => {
    const giay = net('g1', gach(0.2, 0.3, 0.02, 200)), b = net('b_b', gach(BX, BY, 0.02, 200))
    // giấy → bảng: không lướt qua hai hệ toạ độ; tới sát giờ thì cây bút sang đầu nét bảng
    let kh = chay(mucCua([{ t: 1000, net: giay }, { t: 1600, net: b }]), 900, 1650)
    expect(kh.filter((k) => k.t > 1200 && k.t < 1600).every((k) => k.f.tro && !k.f.tro.sat)).toBe(true)
    expect(kh.find((k) => k.t >= 1250)!.f.tro).toMatchObject({ x: giay.diem[giay.diem.length - 1]![0] })
    expect(kh.find((k) => k.t >= 1580)!.f.tro).toMatchObject({ x: b.diem[0]![0], cham: false })
    // bảng mới chen giữa: bỏ chỗ cũ
    kh = chay(mucCua([{ t: 1000, net: b }, { t: 1700, net: net('b_c', gach(BX + 0.1, BY, 0.02, 200)) }], [{ t: 1300, khung: maBangMoi(maTrang('c2', VUNG_MAC_DINH, false), 16 / 9) }]), 900, 1650)
    expect(kh.find((k) => k.t >= 1250)!.f.tro).not.toBeNull()
    expect(kh.find((k) => k.t >= 1350)!.f.tro).toBeNull()
    expect(kh.find((k) => k.t >= 1700 - HIEN_TRUOC_MS + 20)!.f.tro).toMatchObject({ x: +(BX + 0.1).toFixed(5), cham: false })
    // nét kế có mọi điểm giờ 0 (dựng lại tức thì): không phải nét thầy viết ⇒ không lướt tới
    const tucThi = net('b_t', gach(BX + 0.1, BY, 0.02, 200).map((p) => [p[0], p[1], p[2], 0] as DiemBut))
    kh = chay(mucCua([{ t: 1000, net: b }, { t: 1500, net: tucThi }]), 900, 1480)
    expect(kh.filter((k) => k.t > 1220).every((k) => k.f.tro && !k.f.tro.sat && k.f.tro.x === b.diem[b.diem.length - 1]![0])).toBe(true)
  })
  it('nhiều nét chồng giờ: cây bút bám một nét tới khi nét ấy xong, không nhảy qua lại giữa các đầu nét', () => {
    const ds = vietTay('chong'), kh = chay(mucCua(ds), 1900, hetViet(ds))
    let chong = 0, doiGiuaChung = 0
    for (let i = 1; i < kh.length; i++) {
      const a = kh[i - 1]!, b = kh[i]!
      if (b.f.dau.length > 1) chong += 1
      // khung trước bám nét X, khung này X vẫn đang vẽ mà cây bút lại ở nét khác
      if (a.f.tro?.cham && b.f.tro?.cham && a.f.tro.net !== b.f.tro.net && b.f.dau.some((d) => d.id === a.f.tro!.net)) doiGiuaChung += 1
    }
    expect(chong).toBeGreaterThan(3) // kịch bản có nét chồng giờ thật
    expect(doiGiuaChung).toBe(0)
  })
  it('buổi giả có bảng sẵn 2000 nét: dựng tại chỗ rồi phát tiếp, cây bút lướt như thường', () => {
    const b = taoBuoiNet('chu', { nen: 2000 }), muc = giaiMuc(docNetBin(b.net).muc)
    const kh = chay(muc, b.viet[0]!.t - 50, b.viet[3]!.t + dai(b.viet[3]!.net))
    expect(kh.filter((k) => k.t > b.viet[0]!.t).every((k) => !!k.f.tro)).toBe(true)
  })
})

describe('đồng hồ phát: tiếng tải theo khúc', () => {
  it('readyState tụt chốc lát giữa lúc đang phát ⇒ đồng hồ KHÔNG đặt lại, nét vẫn tiến đều (trước: mỗi lần tụt là một nhịp đứng / nhảy)', () => {
    // giờ tiếng đổi theo bậc ~120 ms (điện thoại, tai nghe Bluetooth) + cứ 300 ms `readyState` tụt một khung
    const m = taoLamMuot(), buoc: number[] = []
    let tAudio = 50_000, ke = 0, truoc = -1, lechLon = 0
    for (let k = 0; k < 900; k++) {
      const nay = k * KHUNG, that = 50_000 + nay
      if (nay >= ke) { tAudio = Math.round(that); ke = nay + 120 }
      const t = m.doc(tAudio, nay, true, 1, !(k % 18 === 17))
      if (truoc >= 0) buoc.push(t - truoc)
      truoc = t
      if (k > 60) lechLon = Math.max(lechLon, Math.abs(t - that))
    }
    expect(Math.min(...buoc)).toBeGreaterThan(KHUNG * 0.74)
    expect(Math.max(...buoc)).toBeLessThan(KHUNG * 1.26)
    expect(lechLon).toBeLessThan(60)
  })
  it('thiếu dữ liệu LÂU (tiếng đứng thật) ⇒ theo đúng số của audio; có lại thì chạy tiếp từ đó', () => {
    const m = taoLamMuot()
    m.doc(7000, 0, true, 1); m.doc(7016, 16, true, 1)
    let t = 0
    for (let nay = 32; nay <= 16 + CHO_DEM_MS + 40; nay += 16) t = m.doc(7016, nay, true, 1, false)
    expect(t).toBe(7016)
    expect(m.doc(7016, 600, true, 1, true)).toBe(7016)
    expect(m.doc(7030, 616, true, 1, true)).toBeGreaterThan(7016)
  })
})
