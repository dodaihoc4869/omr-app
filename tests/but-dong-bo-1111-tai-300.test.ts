// @vitest-environment node
// BÚT + ĐỒNG BỘ NÉT — 300 EM CÙNG LÚC (thầy 11/11: «Tất cả phải mượt mà ổn định và tức thì cho ít nhất 300 hs vào cùng lúc tiếng nói bút viết»).
// Đường thật từ đầu tới cuối, KHÔNG mạng thật: bộ máy bút thật (`taoSo`) → thư viện máy thầy thật (`taoLiveThay`, đường WebSocket dự phòng) →
// phòng thật (Durable Object, ctx giả) → 300 kết nối máy em (298 cái chỉ ĐẾM + 2 thư viện máy em thật `taoLiveEm` vẽ 60 khung / giây).
// Thầy viết ~12 giây chữ mẫu (bút 200 Hz, có con trỏ lơ lửng giữa các nét) ⇒ đo: số lô / giây, byte / giây mỗi em, thời gian phòng xử lý mỗi lô
// (nhận khung → gửi xong cho cả 300 máy = độ trễ phát của phòng), và hai máy em thật có dựng lại ĐÚNG TỪNG ĐIỂM nét của thầy không, đầu nét có đứng không.
// Thêm: ước lượng tải đường DataChannel (qua SFU) của bản mới — gói / giây, byte / giây mỗi em — bằng chính bộ mã hoá `ma-net`.
// LƯU Ý: kết nối giả chỉ đếm ⇒ số ở đây là phần MÃ (phòng + thư viện); chi phí `send()` thật của Cloudflare và SFU thật với 300 phiên: CHƯA THỬ.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoLoiBut, type DiemBut, type NetBut, type SuKienBut } from '../src/lib/but-bang-loi'
import { LO_MOI_GIAY_TRAN } from '../src/lib/bpu/phong-live'
import { taoLiveEm, taoLiveThay } from '../src/lib/live'
import { BYTE_MOI_DIEM, maGoiDiem, maNhac, maTro } from '../src/lib/live/ma-net'
// @ts-expect-error tệp .mjs của bộ đo (chữ viết tay mẫu), không có kiểu
import { taoNgauNhien, vietDong } from '../scripts/but-bang-1011/chu-tay-mau.mjs'
import { datWebSocketPairGia, taoDongHoGia, taoKenhGia, taoPhongGia } from './_live-phong-gia'

const SO_EM = 300
const loi = taoLoiBut(), MAU = 'rgb(244,239,228)'
const pc = (ds: number[], q: number) => { const s = [...ds].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * q))]! : 0 }
/** Bài viết: mảng nét, mỗi nét là mảng mẫu [x px, y px, lực, ms từ đầu nét] ở khổ 1920 × 1080 (cột bảng đen). */
function baiViet(): number[][][] {
  const rnd = taoNgauNhien(1111), net: number[][][] = []
  for (const [chuoi, y] of [['CH_3COOH + NaOH', 200], ['> CH_3COONa + H_2O', 290], ['n = 0,1 mol', 380], ['C_6H_5OH + NaOH', 470]] as [string, number][]) net.push(...vietDong(chuoi, 1312, y, 42, { rnd, vMax: 700 }))
  return net
}

describe('300 em cùng lúc: thầy viết thật qua phòng thật', () => {
  beforeAll(datWebSocketPairGia)
  beforeEach(() => { vi.useFakeTimers({ now: 1_700_000_000_000, toFake: ['Date', 'setTimeout', 'clearTimeout'] }) })
  afterEach(() => { vi.useRealTimers() })

  it('đường WebSocket dự phòng: lô điểm ≤ 30 / giây (+ lô cuối và tin nhấc của từng nét), không vượt trần 45 của phòng; mỗi lô phòng xử lý dưới 1 ms cho 300 máy; hai máy em thật dựng lại đúng từng điểm, đầu nét không đứng', async () => {
    const ph = taoPhongGia(), dh = taoDongHoGia()
    await ph.khoi(Array.from({ length: SO_EM }, (_, i) => ({ sbd: `S${i}` })), { cho: true, sfu: false })
    const gv = await ph.noi('gv'), kGv = taoKenhGia(ph, gv)
    const so = loi.taoSo()
    so.datTiLe(16 / 9)
    const lt = taoLiveThay({ ve: 've-gv', goc: 'https://may-chu.example', kenh: kGv.kenh, layAnh: () => ({ trang: so.trang(), ...so.xuat() }), moiTruong: dh.mt })
    gv.nhan = (d) => lt.nhanTinPhong(d)
    so.nghe((sk) => lt.nhanSuKienBut(sk))
    const kenh = [kGv]
    // 2 máy em THẬT
    const that = []
    for (const sbd of ['S0', 'S1']) {
      const ds: NetBut[] = [], ws = await ph.noi('hs', sbd), kn = taoKenhGia(ph, ws)
      kenh.push(kn)
      const dangViet = new Map<string, number>()
      const le = taoLiveEm({ ve: 've-hs', goc: 'https://may-chu.example', kenh: kn.kenh, khiBut: (s: SuKienBut) => { loi.apSuKien(ds, s) }, moiTruong: dh.mt })
      ws.nhan = (d) => le.nhanTinPhong(d)
      await ph.gui(ws, { t: 'vao' }); await ph.gui(ws, { t: 'chao' })
      that.push({ le, ds, dangViet })
    }
    // 298 máy em chỉ đếm
    const dem = { nhiPhan: 0, byte: 0, chu: 0, diem: 0 }
    const gia = []
    for (let i = 2; i < SO_EM; i++) {
      const w = await ph.noi('hs', `S${i}`)
      await ph.gui(w, { t: 'vao' }); await ph.gui(w, { t: 'chao' })
      gia.push(w)
    }
    const troi = async (ms: number) => {
      for (let con = ms; con > 0; con -= 4) { dh.tien(Math.min(4, con)); for (const k of kenh) await k.xong(); await vi.advanceTimersByTimeAsync(Math.min(4, con)) }
      for (const k of kenh) await k.xong()
    }
    await ph.gui(gv, { t: 'chao' })
    await troi(50)
    expect((await lt.bat({ khongTieng: true })).ok).toBe(true)
    lt.dat({ bang: true }) // bảng → máy em
    await troi(600)
    // 298 máy em giả báo «đang xem, không có DataChannel» SAU khi live bật (phòng mới chuyển lô điểm cho các máy đã báo), rồi chỉ ĐẾM
    for (const w of gia) {
      await ph.gui(w, { t: 'live-ok', dc: false })
      w.send = (d) => { if (typeof d === 'string') dem.chu += 1; else { const b = new Uint8Array(d as ArrayBuffer); dem.nhiPhan += 1; dem.byte += b.byteLength; if (b[0]! >= 0x21) dem.diem += 1 } }
    }
    await troi(100)
    // đo thời gian phòng xử lý từng khung nhị phân của thầy (nhận → gửi xong cho mọi máy)
    const msLo: number[] = [], gioLo: number[] = []
    const goc = ph.p.webSocketMessage.bind(ph.p)
    ph.p.webSocketMessage = (async (ws: never, d: string | ArrayBuffer) => {
      if (typeof d === 'string' || (ws as unknown) !== gv) return goc(ws, d)
      const diem = new Uint8Array(d)[0]! >= 0x21
      const a = performance.now()
      await goc(ws, d)
      if (diem) { msLo.push(performance.now() - a); gioLo.push(dh.gio()) }
    }) as typeof ph.p.webSocketMessage
    dem.nhiPhan = dem.byte = dem.chu = dem.diem = 0

    // ── thầy viết: máy thầy 60 khung / giây gom mẫu; giữa hai nét bút lơ lửng tới đầu nét sau; máy em vẽ 60 khung / giây ──
    const bai = baiViet(), t0 = dh.gio()
    let khungViet = 0, khungDung = 0, dungDai = 0, dungNay = 0
    const dauTruoc = new Map<string, number>()
    const khungEm = () => {
      for (const e of that) {
        const k = e.le.khung(dh.gio())
        if (e !== that[0]) continue
        for (const h of k.dau) {
          const net = e.ds.find((x) => x.id === h.id), da = (net?.diem.length ?? 0) + h.x // điểm đã vẽ + chỗ đầu nét: tiến ⇔ số này đổi
          const truoc = dauTruoc.get(h.id)
          if (truoc != null) { khungViet++; if (da === truoc) { khungDung++; dungNay += 16; dungDai = Math.max(dungDai, dungNay) } else dungNay = 0 }
          dauTruoc.set(h.id, da)
        }
      }
    }
    for (let j = 0; j < bai.length; j++) {
      const m = bai[j]!
      so.batDau({ mau: MAU, co: 1.7, diem: loi.diem(m[0]![0]!, m[0]![1]!, m[0]![2]!, 0, 1920, 1080), bang: true })
      let i = 1
      for (let t = 16; i < m.length; t += 16) {
        const lo: DiemBut[] = []
        while (i < m.length && m[i]![3]! <= t) { lo.push(loi.diem(m[i]![0]!, m[i]![1]!, m[i]![2]!, m[i]![3]!, 1920, 1080)); i++ }
        if (lo.length) so.themDiem(lo)
        await troi(16); khungEm()
      }
      so.ketThuc()
      const ke = bai[j + 1], c = m[m.length - 1]!
      for (let b = 1; b <= 9; b++) { if (ke) so.tro((c[0]! + (ke[0]![0]! - c[0]!) * b / 9) / 1920, (c[1]! + (ke[0]![1]! - c[1]!) * b / 9) / 1080); await troi(16); khungEm() }
    }
    for (let i = 0; i < 40; i++) { await troi(16); khungEm() }
    const giay = (dh.gio() - t0) / 1000

    // ── kết quả ──
    const nguon = so.xuat().net
    for (const e of that) {
      expect(e.ds.map((n) => n.id)).toEqual(nguon.map((n) => n.id))
      expect(e.ds.map((n) => n.diem)).toEqual(nguon.map((n) => n.diem)) // đúng từng điểm, từng số
    }
    // số lô mỗi giây (theo giây đồng hồ) không vượt trần của phòng
    const theoGiay = new Map<number, number>()
    for (const g of gioLo) theoGiay.set(Math.floor(g / 1000), (theoGiay.get(Math.floor(g / 1000)) ?? 0) + 1)
    const loMoiGiayLon = Math.max(...theoGiay.values())
    const moiEm = { loMoiGiay: msLo.length / giay, byteMoiGiay: dem.byte / 298 / giay }
    console.log(`[đo 300] thầy viết ${nguon.length} nét (${nguon.reduce((s, n) => s + n.diem.length, 0)} điểm) trong ${giay.toFixed(1)} giây qua WebSocket của phòng, ${SO_EM} máy em: ` +
      `${moiEm.loMoiGiay.toFixed(1)} lô điểm / giây (giây nhiều nhất ${loMoiGiayLon}) · mỗi em nhận ${(moiEm.byteMoiGiay / 1024).toFixed(2)} KB/giây (cả lớp ${(moiEm.byteMoiGiay * SO_EM / 1024).toFixed(0)} KB/giây) · ` +
      `phòng xử lý mỗi lô: trung bình ${(msLo.reduce((a, b) => a + b, 0) / msLo.length).toFixed(4)} ms · p95 ${pc(msLo, 0.95).toFixed(4)} ms · lớn nhất ${Math.max(...msLo).toFixed(3)} ms ` +
      `(= ${(msLo.reduce((a, b) => a + b, 0) / giay).toFixed(2)} ms CPU cho mỗi giây live) · máy em thật: đầu nét đứng ${khungDung}/${khungViet} khung, quãng đứng dài nhất ${dungDai} ms`)
    expect(loMoiGiayLon).toBeLessThanOrEqual(LO_MOI_GIAY_TRAN)
    expect(dem.diem).toBe(msLo.length * 298) // MỌI lô điểm tới đủ 298 máy đếm (+ 2 máy thật)
    // lô theo nhịp ≤ 30 / giây + mỗi nét thêm lô cuối (đi ngay, không chờ nhịp) và tin nhấc bút
    expect(moiEm.loMoiGiay).toBeLessThanOrEqual(30.5 + 2 * nguon.length / giay)
    expect(pc(msLo, 0.95)).toBeLessThan(1)
    expect(dem.chu).toBeLessThan(298 * 4) // không phát view theo từng lô
    expect(khungViet).toBeGreaterThan(300)
    expect(khungDung / khungViet).toBeLessThan(0.02)
    expect(dungDai).toBeLessThanOrEqual(34)
    lt.huy(); for (const e of that) e.le.huy()
  }, 120_000)

  it('đường DataChannel (qua SFU) của bản mới: mỗi khung vẽ của thầy một gói (lô trước + lô mới) + gói cuối lặp + con trỏ mỗi khung ⇒ mỗi em dưới 12 KB/giây', () => {
    const bai = baiViet(), dau = { id: 'b_n0123456789abcd', cong: 'but' as const, mau: MAU, co: 1.7 }
    let goi = 0, byte = 0, ms = 0, lon = 0
    for (let j = 0; j < bai.length; j++) {
      const m = bai[j]!, diem = m.map((q) => loi.diem(q[0]!, q[1]!, q[2]!, q[3]!, 1920, 1080))
      let truoc = 0, da = 0
      for (let t = 16; da < diem.length; t += 16) {
        let den = da
        while (den < diem.length && m[den]![3]! <= t) den++
        if (den === da) continue
        const k = maGoiDiem({ phien: 1, tGui: ms + t, dau, tGoc: ms, tu: truoc, diem: diem.slice(truoc, den) })
        goi++; byte += k.length; lon = Math.max(lon, k.length)
        truoc = da; da = den
      }
      // gói cuối lặp + báo nhấc hai lần
      byte += maGoiDiem({ phien: 1, tGui: 0, dau, tGoc: ms, tu: truoc, diem: diem.slice(truoc) }).length + 2 * maNhac({ phien: 1, tGui: 0, id: dau.id, tong: diem.length }).length; goi += 3
      ms += m[m.length - 1]![3]! + 150
      // lơ lửng 150 ms giữa hai nét: 9 gói con trỏ
      byte += 9 * maTro({ phien: 1, tGui: 0, x: 0.7, y: 0.4 }).length; goi += 9
    }
    const giay = ms / 1000, kbEm = byte / giay / 1024
    console.log(`[đo 300] đường DataChannel bản mới, cùng bài viết ${giay.toFixed(1)} giây: ${(goi / giay).toFixed(0)} gói / giây · mỗi em ${kbEm.toFixed(2)} KB/giây thân gói (cả lớp ${SO_EM} em: ${(kbEm * SO_EM / 1024).toFixed(2)} MB/giây do SFU phát, không qua phòng) · gói lớn nhất ${lon} byte · ${BYTE_MOI_DIEM} byte mỗi điểm`)
    expect(goi / giay).toBeLessThan(85)
    expect(kbEm).toBeLessThan(12)
    expect(lon).toBeLessThan(1100) // dưới một MTU
  })
})
