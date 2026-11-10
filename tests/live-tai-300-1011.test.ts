// @vitest-environment node
// LIVE BẢNG — TẢI Durable Object: 300 kết nối máy em GIẢ × 30 lô điểm / giây qua đường dự phòng WebSocket (đặc tả mục 4.2, 6, rủi ro R1).
// Đo thời gian xử lý MỖI LÔ của phòng (nhận khung → chuyển nguyên văn tới 300 máy) và khoá cách làm: lô điểm KHÔNG ghi storage, KHÔNG dựng view, KHÔNG JSON;
// view đầy đủ chỉ phát khi trạng thái đổi. Số in ra `[đo]` để ghi báo cáo.
// LƯU Ý: kết nối giả chỉ đếm ⇒ số ở đây là phần MÃ CỦA PHÒNG (vòng lặp + kiểm vai + chặn nhịp); chi phí `send()` thật của runtime Cloudflare chưa gồm —
// đo thật ở Đợt 0 (đặc tả mục 7, «Tải 300 em»).
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { LO_MOI_GIAY, LO_MOI_GIAY_TRAN } from '../src/lib/bpu/phong-live'
import { maGoiDiem, maNetXong } from '../src/lib/live/ma-net'
import { datWebSocketPairGia, taoPhongGia } from './_live-phong-gia'

const SO_EM = 300
const p = (ds: number[], q: number) => { const s = [...ds].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(s.length * q))]! }
const tb = (ds: number[]) => ds.reduce((a, b) => a + b, 0) / ds.length

describe('tải phòng live: 300 kết nối × 30 lô/giây', () => {
  beforeAll(datWebSocketPairGia)
  // Chỉ giả đồng hồ lịch + hẹn giờ (để điều khiển bộ chặn nhịp và các hẹn gom của phòng); `performance.now()` thật để đo.
  beforeEach(() => { vi.useFakeTimers({ now: 1_700_000_000_000, toFake: ['Date', 'setTimeout', 'clearTimeout'] }) })
  afterEach(() => { vi.useRealTimers() })

  async function dung() {
    const ph = taoPhongGia()
    await ph.khoi(Array.from({ length: SO_EM }, (_, i) => ({ sbd: `S${i}` })))
    const gv = await ph.noi('gv')
    const em = []
    for (let i = 0; i < SO_EM; i++) em.push(await ph.noi('hs', `S${i}`))
    await ph.gui(gv, { t: 'live-bat' })
    for (const w of em) await ph.gui(w, { t: 'live-ok', dc: false })
    await vi.advanceTimersByTimeAsync(400)
    // Từ đây kết nối giả chỉ ĐẾM (không sao chép vùng nhớ) để phép đo không bị chính đồ giả làm nặng.
    const dem = { chu: 0, nhiPhan: 0, byte: 0 }
    for (const w of [gv, ...em]) w.send = (d) => { if (typeof d === 'string') dem.chu += 1; else { dem.nhiPhan += 1; dem.byte += (d as ArrayBuffer).byteLength } }
    return { ph, gv, em, dem }
  }
  /** Một lô điểm thật: 7 điểm (≈ 33 ms bút Wacom 200 điểm/giây), ~130 byte. */
  const lo = (i: number) => maGoiDiem({ phien: 1, tGui: i * 33, dau: { id: 'n1', cong: 'but', mau: 'rgb(244,239,228)', co: 2.3 }, tGoc: 0, tu: i * 7, diem: Array.from({ length: 7 }, (_, k) => [0.1 + (i * 7 + k) / 1e4, 0.5, 0.5, (i * 7 + k) * 5] as [number, number, number, number]) })

  it('30 lô/giây trong 10 giây ⇒ 90.000 lệnh gửi; mỗi lô xử lý dưới 1 ms; 0 lần ghi storage, 0 view, 0 tin chữ', async () => {
    const { ph, gv, dem } = await dung()
    const SO_LO = LO_MOI_GIAY * 10
    const khung = Array.from({ length: SO_LO }, (_, i) => { const k = lo(i); return (k.buffer as ArrayBuffer).slice(k.byteOffset, k.byteOffset + k.byteLength) })
    // Làm nóng (JIT) rồi mới đo.
    for (let i = 0; i < 60; i++) { vi.setSystemTime(1_700_000_001_000 + i * 34); await ph.p.webSocketMessage(gv as never, khung[i]!) }
    dem.chu = dem.nhiPhan = dem.byte = 0
    const ghi = ph.kho.ghi, ms: number[] = []
    const t0 = performance.now()
    for (let i = 0; i < SO_LO; i++) {
      vi.setSystemTime(1_700_000_010_000 + i * 34)
      const a = performance.now()
      await ph.p.webSocketMessage(gv as never, khung[i]!)
      ms.push(performance.now() - a)
    }
    const tong = performance.now() - t0
    console.log(`[đo] phòng live, ${SO_EM} kết nối giả × ${LO_MOI_GIAY} lô/giây × 10 giây: mỗi lô trung bình ${tb(ms).toFixed(4)} ms · trung vị ${p(ms, 0.5).toFixed(4)} ms · p95 ${p(ms, 0.95).toFixed(4)} ms · lớn nhất ${Math.max(...ms).toFixed(3)} ms · ${dem.nhiPhan} lệnh gửi · ${(tong / 10).toFixed(2)} ms CPU cho mỗi giây live (${(tong / 100).toFixed(3)} % một lõi)`)
    expect(dem.nhiPhan).toBe(SO_LO * SO_EM)
    expect(dem.chu).toBe(0) // không view, không tin chữ nào theo lô
    expect(ph.kho.ghi).toBe(ghi) // không ghi storage theo lô
    expect(dem.byte).toBe(khung.reduce((s, k) => s + k.byteLength, 0) * SO_EM) // chuyển NGUYÊN VĂN
    expect(tb(ms)).toBeLessThan(1)
    expect(p(ms, 0.95)).toBeLessThan(2)
  })
  it('máy em đã có DataChannel (`live-ok {dc:true}`) KHÔNG nhận lô qua WebSocket; chưa live thì không chuyển lô; quá trần lô/giây thì bỏ phần vượt', async () => {
    const { ph, gv, em, dem } = await dung()
    for (let i = 0; i < 200; i++) await ph.gui(em[i]!, { t: 'live-ok', dc: true })
    dem.nhiPhan = 0
    vi.setSystemTime(1_700_000_020_000)
    await ph.guiNp(gv, lo(0))
    expect(dem.nhiPhan).toBe(100)
    // Dồn 100 lô trong cùng một giây ⇒ chỉ `LO_MOI_GIAY_TRAN` lô được chuyển.
    dem.nhiPhan = 0
    vi.setSystemTime(1_700_000_021_000)
    for (let i = 0; i < 100; i++) await ph.guiNp(gv, lo(i))
    expect(dem.nhiPhan).toBe(LO_MOI_GIAY_TRAN * 100)
    await ph.gui(gv, { t: 'live-tat' })
    dem.nhiPhan = 0
    vi.setSystemTime(1_700_000_023_000)
    await ph.guiNp(gv, lo(0))
    expect(dem.nhiPhan).toBe(0)
  })
  it('nét xong 4 khung/giây × 300 máy: mỗi khung dưới 1 ms, không ghi storage trong lúc chuyển; so với MỘT lần phát view đầy đủ', async () => {
    const { ph, gv, dem } = await dung()
    const net = maNetXong({ id: 'n', cong: 'but', mau: 'rgb(244,239,228)', co: 2.3, diem: Array.from({ length: 250 }, (_, i) => [i / 300, 0.4, 0.5, i * 5] as [number, number, number, number]) })[0]!
    for (let i = 0; i < 20; i++) await ph.guiNp(gv, net)
    dem.nhiPhan = dem.chu = 0
    const ghi = ph.kho.ghi, ms: number[] = []
    for (let i = 0; i < 40; i++) { const k = (net.buffer as ArrayBuffer).slice(net.byteOffset, net.byteOffset + net.byteLength), a = performance.now(); await ph.p.webSocketMessage(gv as never, k); ms.push(performance.now() - a) }
    expect(dem.nhiPhan).toBe(40 * SO_EM)
    expect(dem.chu).toBe(0)
    expect(ph.kho.ghi).toBe(ghi)
    expect(tb(ms)).toBeLessThan(1)
    // Đối chứng: một lần đổi trạng thái (phát `viewBang` + 300 `viewEm`).
    const a = performance.now()
    await ph.gui(gv, { t: 'live-dat', tiengLop: true })
    const view = performance.now() - a
    expect(dem.chu).toBe(SO_EM + 1)
    console.log(`[đo] phòng live, ${SO_EM} kết nối giả: mỗi khung nét xong (~2,3 KB) trung bình ${tb(ms).toFixed(4)} ms · p95 ${p(ms, 0.95).toFixed(4)} ms; MỘT lần phát view đầy đủ cho cả lớp = ${view.toFixed(2)} ms (vì vậy view chỉ phát khi trạng thái đổi)`)
  })
})
