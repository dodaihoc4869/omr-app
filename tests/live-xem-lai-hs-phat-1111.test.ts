// XEM LẠI LIVE — MÁY EM, TRÌNH PHÁT (đợt X2, thầy chốt build 11/11; đặc tả docs/dac-ta-live-xem-lai-1011.md mục 4.9). Phần THUẦN của trình phát:
//   · đồng hồ phát: đồng hồ riêng (buổi không tiếng) chạy theo tốc độ 1× / 1,5× / 2×; làm mượt `audio.currentTime`; hàng phát ↔ thanh tua;
//   · «Bỏ khoảng lặng»: tới khoảng lặng thì nhảy sang cuối khoảng, không vượt cuối đoạn, không nhảy lắt nhắt;
//   · máy phát nét: nét vẽ DẦN theo `t + diem[i][3]`, có đầu nét nội suy + con trỏ; xoá / bảng mới áp tại `t`; kết quả cuối = đúng bảng của sổ nét;
//   · TUA: dựng lại từ mốc «bảng mới» gần nhất phía trước — chỉ tải đúng khúc `net.bin` cần (Range), mốc «xoá hết» thì lùi tới «bảng mới».
import { describe, expect, it } from 'vitest'
import { taoLoiBut, type NetBut, type SuKienBut } from '../src/lib/but-bang-loi'
import { giaiSo } from '../src/lib/live/ma-net'
import { docNetBin } from '../src/lib/live/xem-lai-kieu'
import { LUOC_IT_NHAT_MS, nhayLang, taoDongHoRieng, taoLamMuot, tongHang, tongLang, tuViTriHang, viTriHang } from '../src/screens/live-xem-lai/hs/dong-ho'
import { taoKhoNet } from '../src/screens/live-xem-lai/hs/kho-net'
import { giaiMuc, taoMayPhat, NAN_TRO_MS } from '../src/screens/live-xem-lai/hs/may-phat'
import { taoBuoiGia } from './_live-xem-lai-hs-gia'

const loi = taoLoiBut()
/** Lớp vẽ giả: dựng lại mảng nét bằng CHÍNH `apSuKien` của bộ máy bút (như lớp vẽ thật). */
function taoLopVe() {
  let ds: NetBut[] = []
  const sk: SuKienBut[] = []
  return { nhan: (e: SuKienBut) => { sk.push(e); ds = loi.apSuKien(ds, e) }, net: () => ds, sk }
}
const { buoi, net } = taoBuoiGia()
const tatCa = giaiMuc(docNetBin(net).muc)

describe('đồng hồ phát', () => {
  it('đồng hồ riêng (buổi không tiếng): chạy theo tốc độ, dừng thì đứng, đặt lại được', () => {
    const d = taoDongHoRieng()
    d.dat(10_000, 0)
    expect(d.doc(500)).toBe(10_000) // chưa phát
    d.phat(1000)
    expect(d.doc(3000)).toBe(12_000)
    d.datTocDo(1.5, 3000)
    expect(d.doc(5000)).toBe(15_000)
    d.datTocDo(2, 5000)
    expect(d.doc(6000)).toBe(17_000)
    d.dung(6000)
    expect(d.dangPhat()).toBe(false)
    expect(d.doc(9000)).toBe(17_000)
    d.dat(60_000, 9000); d.phat(9000)
    expect(d.doc(9500)).toBe(61_000)
  })
  it('làm mượt audio.currentTime: tự chạy giữa hai lần cập nhật, tiếng đứng thì nét đứng, tua thì theo ngay, tạm dừng thì đúng số của audio', () => {
    const m = taoLamMuot()
    expect(m.doc(5000, 0, true, 1)).toBe(5000)
    expect(m.doc(5000, 16, true, 1)).toBe(5016) // trình duyệt chưa cập nhật ⇒ tự chạy theo đồng hồ máy
    const a = m.doc(5040, 50, true, 1) // con số mới NHỎ hơn mốc đã hiện (5050) một chút ⇒ không đứng, không lùi: vẫn tiến, chỉ chậm lại chút
    expect(a).toBeGreaterThan(5016 + 34 * 0.75 - 0.001); expect(a).toBeLessThan(5050)
    expect(m.doc(5040, 2000, true, 1)).toBe(5440) // tiếng đứng (đang đệm): đi nốt tối đa 400 ms rồi đứng
    expect(m.doc(5040, 2500, true, 1)).toBe(5440)
    expect(m.doc(1000, 2516, true, 1)).toBe(1000) // tua lùi (lệch quá 250 ms) ⇒ theo ngay
    expect(m.doc(1000, 9000, false, 1)).toBe(1000) // tạm dừng ⇒ đúng con số của audio
    expect(m.doc(1000, 9500, true, 2)).toBe(1000) // phát lại: bắt đầu đúng từ số của audio
    expect(m.doc(1000, 9516, true, 2)).toBe(1032) // tốc độ 2×
  })
  it('NÉT MƯỢT (thầy 13/11 «nét bút xem lại bị giật»): giờ tiếng cập nhật thưa, lệch nhịp ⇒ đồng hồ vẫn tiến ĐỀU từng khung, không khựng, không nhảy, vẫn bám tiếng', () => {
    // Điện thoại: trình duyệt chỉ đổi `currentTime` ~4–10 lần / giây, mỗi lần lệch ±25 ms so với giờ thật (độ trễ loa, lịch cập nhật). 60 khung / giây, 20 giây.
    for (const td of [1, 1.5, 2]) {
      const m = taoLamMuot()
      let hat = 12345, tAudio = 100_000, kyCapNhat = 0, truoc = -1, lechLon = 0
      const buoc: number[] = []
      const ngau = () => { hat = (hat * 1103515245 + 12345) & 0x7fffffff; return hat / 0x7fffffff }
      for (let k = 0; k < 1200; k++) {
        const nay = k * (1000 / 60), that = 100_000 + nay * td
        if (nay >= kyCapNhat) { tAudio = Math.round(that + (ngau() - 0.5) * 50); kyCapNhat = nay + 100 + ngau() * 150 }
        const t = m.doc(tAudio, nay, true, td)
        if (truoc >= 0) buoc.push(t - truoc)
        truoc = t
        if (k > 120) lechLon = Math.max(lechLon, Math.abs(t - that))
      }
      const chuan = (1000 / 60) * td
      expect(Math.min(...buoc)).toBeGreaterThan(chuan * 0.74) // không khựng (trước đây có khung đứng im: bước 0)
      expect(Math.max(...buoc)).toBeLessThan(chuan * 1.26) // không nhảy (trước đây có khung nhảy vài chục ms)
      expect(lechLon).toBeLessThan(60) // vẫn khớp tiếng (lệch dưới 60 ms sau 2 giây đầu)
    }
  })
  it('hàng phát ↔ thanh tua', () => {
    const hang = [{ t0: 100_000, t1: 160_000 }, { t0: 300_000, t1: 330_000 }]
    expect(tongHang(hang)).toBe(90_000)
    expect(viTriHang(hang, 0, 130_000)).toBe(30_000)
    expect(viTriHang(hang, 1, 310_000)).toBe(70_000)
    expect(tuViTriHang(hang, 30_000)).toEqual({ vt: 0, t: 130_000 })
    expect(tuViTriHang(hang, 60_000)).toEqual({ vt: 1, t: 300_000 })
    expect(tuViTriHang(hang, 999_000)).toEqual({ vt: 1, t: 330_000 })
  })
})

describe('bỏ khoảng lặng', () => {
  const doan = { t0: 0, t1: 100_000 }
  const lang: [number, number][] = [[10_000, 20_000], [50_000, 120_000]]
  it('trong khoảng lặng ⇒ nhảy tới cuối khoảng; ngoài khoảng ⇒ không nhảy', () => {
    expect(nhayLang(9_999, lang, doan)).toBeNull()
    expect(nhayLang(10_000, lang, doan)).toBe(20_000)
    expect(nhayLang(15_000, lang, doan)).toBe(20_000)
    expect(nhayLang(20_000, lang, doan)).toBeNull()
  })
  it('không vượt cuối đoạn, không nhảy khi chỉ còn một mẩu', () => {
    expect(nhayLang(60_000, lang, doan)).toBe(100_000) // khoảng lặng dài quá đoạn ⇒ dừng ở cuối đoạn
    expect(nhayLang(20_000 - LUOC_IT_NHAT_MS + 1, lang, doan)).toBeNull()
  })
  it('tổng khoảng lặng trong một đoạn', () => {
    expect(tongLang(lang, doan)).toBe(10_000 + 50_000)
    // dữ liệu giả: đoạn câu 3 có một khoảng lặng 42 giây (43 giây trừ 0,5 giây hai đầu)
    const d3 = buoi.doan.find((d) => d.cau === 3)!
    expect(Math.round(tongLang(buoi.lang, d3) / 1000)).toBe(42)
  })
})

describe('máy phát nét', () => {
  it('nét vẽ dần theo giờ từng điểm, có đầu nét nội suy + con trỏ; viết xong thì chốt', () => {
    const net1 = tatCa.find((m) => m.k === 'net')!
    if (net1.k !== 'net') throw new Error('thiếu nét')
    const n = net1.net.diem.length, dai = net1.net.diem[n - 1]![3]
    const ve = taoLopVe(), may = taoMayPhat(ve.nhan)
    may.dungLai(tatCa, net1.t - 1)
    expect(ve.net().some((x) => x.id === net1.net.id)).toBe(false) // chưa tới giờ
    const giua = may.buoc(net1.t + dai / 2)
    const dangVe = ve.net().find((x) => x.id === net1.net.id)!
    expect(dangVe.diem.length).toBeGreaterThan(0)
    expect(dangVe.diem.length).toBeLessThan(n)
    expect(dangVe.diem.every((p) => p[3] <= dai / 2)).toBe(true) // chỉ những điểm đã tới giờ
    expect(giua.dau).toHaveLength(1)
    expect(giua.tro).toEqual({ x: giua.dau[0]!.x, y: giua.dau[0]!.y, cham: true, net: net1.net.id }) // (13/11: cây bút mang cả «đang chạm» + mã nét)
    // đầu nét nằm giữa hai điểm kẹp mốc phát
    const k = dangVe.diem.length, a = net1.net.diem[k - 1]!, b = net1.net.diem[k]!
    expect(giua.dau[0]!.x).toBeGreaterThanOrEqual(Math.min(a[0], b[0]) - 1e-9)
    expect(giua.dau[0]!.x).toBeLessThanOrEqual(Math.max(a[0], b[0]) + 1e-9)
    const xong = may.buoc(net1.t + dai + 1)
    expect(ve.net().find((x) => x.id === net1.net.id)!.diem).toEqual(net1.net.diem)
    expect(ve.sk[ve.sk.length - 1]!.loai).toBe('net-xong') // lớp vẽ đã đủ điểm ⇒ chỉ báo chốt, không vẽ lại
    expect(xong.dau).toHaveLength(0)
    expect(xong.tro).not.toBeNull() // vừa nhấc bút: con trỏ nán lại
    expect(may.buoc(net1.t + dai + NAN_TRO_MS + 5).tro).toBeNull()
  })
  it('phát từng khung 50 ms qua trọn một đoạn ⇒ bảng cuối đúng bằng bảng dựng thẳng tại cuối đoạn', () => {
    const d = buoi.doan.find((x) => x.cau === 2)! // đoạn có một lần tẩy nét
    const dan = taoLopVe(), mayDan = taoMayPhat(dan.nhan)
    const cuoi = d.t1 - 1 // (đúng `t1` là lúc thầy mở câu kế ⇒ «bảng mới»)
    mayDan.dungLai(tatCa, d.t0)
    for (let t = d.t0; t < cuoi; t += 50) mayDan.buoc(t)
    mayDan.buoc(cuoi)
    const thang = taoLopVe(), mayThang = taoMayPhat(thang.nhan)
    mayThang.dungLai(tatCa, cuoi)
    expect(dan.net().map((x) => x.id)).toEqual(thang.net().map((x) => x.id))
    expect(dan.net()).toEqual(mayThang.bang().net)
    expect(dan.net().length).toBe(d.soNet - 1) // 34 nét, tẩy 1
    expect(thang.sk.filter((e) => e.loai === 'trang')).toHaveLength(1) // tua = lớp vẽ vẽ lại ĐÚNG một lần
  })
  it('bảng mới áp tại giờ của nó: sang câu kế thì bảng trắng, khoá trang đổi', () => {
    const c2 = buoi.cau.find((c) => c.so === 2)!, c3 = buoi.cau.find((c) => c.so === 3)!
    const ve = taoLopVe(), may = taoMayPhat(ve.nhan)
    may.dungLai(tatCa, c3.t0 - 1)
    expect(ve.net().length).toBeGreaterThan(0)
    expect(may.bang().trang.startsWith('cau-2')).toBe(true)
    may.buoc(c3.t0 + 1)
    expect(ve.net()).toHaveLength(0)
    expect(may.bang().trang.startsWith('cau-3')).toBe(true)
    expect(c2.t1).toBeLessThanOrEqual(c3.t0)
  })
  it('nét nhiều khung trong net.bin ghép lại thành một nét đủ điểm', () => {
    const tong = docNetBin(net).muc.filter((m) => giaiSo(m.khung)?.k === 'net').length
    expect(tatCa.filter((m) => m.k === 'net').length).toBe(tong) // dữ liệu giả: mỗi nét một khung
    expect(giaiMuc([{ t: 5, khung: new Uint8Array([0xff, 0, 0, 0, 0, 1]) }])).toEqual([]) // khung lạ bị bỏ, không ném
  })
})

describe('tua: dựng lại từ mốc bảng, tải net.bin theo Range', () => {
  const taoKho = (caTep = false) => {
    const goi: [number, number][] = []
    const kho = taoKhoNet({ byteNet: buoi.byteNet, moc: buoi.mocBang, tai: async (tu, den) => { goi.push([tu, den]); return caTep ? { status: 200, b: net } : { status: 206, b: net.subarray(tu, den) } } })
    return { kho, goi }
  }
  it('tua tới giữa đoạn câu 4 ⇒ chỉ tải khúc của mốc «bảng mới» câu 4, bảng đúng như phát từ đầu', async () => {
    const d = buoi.doan.find((x) => x.cau === 4)!, t = d.t0 + (d.t1 - d.t0) * 0.7
    const { kho, goi } = taoKho()
    const r = await kho.napTu(t)
    const moc = buoi.mocBang.filter((m) => m.t <= t).pop()!
    expect(goi).toHaveLength(1)
    expect(goi[0]![0]).toBe(moc.byte)
    expect(goi[0]![0]).toBeGreaterThan(0)
    expect(r.muc[0]!.k).toBe('bang')
    const tua = taoLopVe(), mayTua = taoMayPhat(tua.nhan)
    mayTua.dungLai(r.muc, t)
    const dau = taoLopVe(), mayDau = taoMayPhat(dau.nhan)
    mayDau.dungLai(tatCa, t)
    expect(tua.net()).toEqual(dau.net())
    expect(mayTua.bang().trang).toBe(mayDau.bang().trang)
    expect(tua.net().length).toBeGreaterThan(5)
    // tua tiếp trong cùng khúc ⇒ không tải lại
    await kho.napTu(t + 5000)
    expect(goi).toHaveLength(1)
  })
  it('mốc gần nhất là «xoá hết» (không mang khoá trang) ⇒ lùi tới «bảng mới» gần nhất; bảng vẫn chỉ còn nét sau lệnh xoá', async () => {
    const d = buoi.doan.find((x) => x.cau === 3)!, t = d.t1 - 1000
    const { kho, goi } = taoKho()
    const i = kho.chiSo(t)
    expect((await kho.khuc(i))[0]!.k).toBe('xoa-het')
    const r = await kho.napTu(t)
    expect(r.tu).toBe(i - 1)
    expect(r.muc[0]!.k).toBe('bang')
    expect(goi).toHaveLength(2)
    const ve = taoLopVe(), may = taoMayPhat(ve.nhan)
    may.dungLai(r.muc, t)
    expect(may.bang().trang.startsWith('cau-3')).toBe(true)
    const sauXoa = r.muc.filter((m) => m.k === 'net' && m.t > kho.gioMoc(i)).length
    expect(ve.net().length).toBe(sauXoa)
    expect(ve.net().length).toBeLessThan(d.soNet)
  })
  it('máy chủ trả cả tệp (200, không nhận Range) ⇒ tải một lần, các khúc sau cắt tại chỗ', async () => {
    const { kho, goi } = taoKho(true)
    const a = await kho.napTu(buoi.doan[4]!.t0 + 1000), b = await kho.napTu(buoi.doan[1]!.t0 + 1000)
    expect(goi).toHaveLength(1)
    expect(a.muc[0]!.k).toBe('bang'); expect(b.muc[0]!.k).toBe('bang')
    const ve = taoLopVe(), may = taoMayPhat(ve.nhan)
    may.dungLai(b.muc, buoi.doan[1]!.t1)
    expect(may.bang().trang.startsWith('cau-2')).toBe(true)
  })
  it('tải hỏng ⇒ ném lỗi và không nhớ: lần sau thử lại được', async () => {
    let hong = true
    const kho = taoKhoNet({ byteNet: buoi.byteNet, moc: buoi.mocBang, tai: async (tu, den) => { if (hong) throw new Error('mang'); return { status: 206, b: net.subarray(tu, den) } } })
    await expect(kho.napTu(1000)).rejects.toThrow('mang')
    hong = false
    expect((await kho.napTu(1000)).muc[0]!.k).toBe('bang')
  })
})
