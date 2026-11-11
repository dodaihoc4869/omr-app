// @vitest-environment jsdom
// XEM LẠI LIVE (thầy chốt build 11/11; đặc tả docs/dac-ta-live-xem-lai-1011.md mục 4.2, 4.3; rủi ro R3, R4): MÁY GHI trên máy thầy —
// (1) bộ cắt khúc theo SỐ MẪU (thuần, bộ mã hoá giả); (2) máy ghi tự chạy / tự dừng theo trạng thái live, báo phòng `live-ghi`, không bao giờ ném lỗi;
// (3) phần nối ở cửa sổ app (thay-noi.ts): ngăn ghi + thẻ nhắc một lần gửi sang tờ, mốc giờ nét; (4) chữ của ngăn ghi trên tờ chiếu.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BoCatKhuc, TRE_VAO_MS, type KhucRa } from '../src/lib/live/may-ghi-cat'
import { docKhuc, ghiKhuc, mucTuRms } from '../src/lib/live/xem-lai-khuc'
import { BYTE_MOI_KHUNG, HZ_LIVE, MAU_MOI_KHUNG, TRE_LAME_MAU, tachKhung } from '../src/lib/live/xem-lai-mp3'
import { taoPhong, viewBang, type TrangThaiPhong } from '../src/lib/bpu/phong'
import { datCoLive, liveBat } from '../src/lib/bpu/phong-live'
import { JS_LIVE_TO_CHIEU } from '../src/lib/live-to-chieu'

/** Bộ mã hoá giả: 48 kHz vào ⇒ 24 kHz ra, nhả khung 144 byte mỗi khi đủ 576 mẫu ra (trễ 1 khung), khung đầu tiên là khung «Info» như LAME. */
function maGia(hz = 48000) {
  let mauRa = 0, daNha = 0, info = false
  const khung = (so: number): Uint8Array => { const k = new Uint8Array(BYTE_MOI_KHUNG); k.set([0xff, 0xf3, 0x64, 0xc4]); new DataView(k.buffer).setUint32(20, so, true); return k }
  const nha = (het: boolean): Uint8Array => {
    const ds: Uint8Array[] = []
    if (!info) { info = true; const k = khung(0); k.set([0x49, 0x6e, 0x66, 0x6f], 13); ds.push(k) }
    const co = Math.floor(mauRa / MAU_MOI_KHUNG) - (het ? 0 : 1)
    while (daNha < co) ds.push(khung(++daNha))
    const ra = new Uint8Array(ds.reduce((s, x) => s + x.length, 0)); let o = 0
    for (const x of ds) { ra.set(x, o); o += x.length }
    return ra
  }
  return { maHoa: (pcm: Float32Array) => { mauRa += (pcm.length * HZ_LIVE) / hz; return nha(false) }, ketThuc: () => nha(true) }
}

describe('Bộ cắt khúc theo số mẫu', () => {
  it('đủ 10 giây MẪU là đóng một khúc, bất kể lô to nhỏ; khúc gồm khung trọn vẹn, bỏ khung Info; nối các khúc = đúng luồng gốc', () => {
    const ra: KhucRa[] = [], cat = new BoCatKhuc(48000, maGia(), (k) => ra.push(k))
    cat.datMoc(0, 0, 1_000_000)
    let da = 0
    for (const lo of [128, 2400, 4096, 333, 48000, 7, 480_000 - 128 - 2400 - 4096 - 333 - 48000 - 7, 600_000, 100_000]) { cat.nap(new Float32Array(lo).fill(0.1)); da += lo }
    expect(ra.map((k) => k.stt)).toEqual([0, 1]) // 24,58 giây mẫu ⇒ hai khúc đủ, phần dư chờ
    cat.dong()
    expect(ra.map((k) => k.stt)).toEqual([0, 1, 2])
    expect(ra[0]!.dau.kh).toBe(415); expect(ra[1]!.dau.kh).toBe(417) // (10 giây = 416,67 khung; khung đầu trễ một khung)
    expect(ra.reduce((s, k) => s + k.dau.kh, 0)).toBe(Math.floor((da / 2) / MAU_MOI_KHUNG))
    const so = ra.flatMap((k) => { expect(k.mp3.length).toBe(k.dau.kh * BYTE_MOI_KHUNG); return tachKhung(k.mp3).khung.map((f) => new DataView(k.mp3.buffer, k.mp3.byteOffset).getUint32(f.vt + 20, true)) })
    expect(so).toEqual(so.map((_, i) => i + 1)) // liền mạch, không mất, không lặp, không có khung Info (số 0)
    expect(cat.soDo()).toMatchObject({ mauVao: da, khuc: 3 })
  })
  it('mốc giờ: t0 của khúc = giờ máy của khung đầu (trừ độ trễ LAME + trễ vào), các khúc nối khít theo số khung; mức âm mỗi 0,5 giây', () => {
    const ra: KhucRa[] = [], cat = new BoCatKhuc(48000, maGia(), (k) => ra.push(k))
    const E0 = 1_794_000_000_000
    // lô 50 ms rời AudioWorklet trễ 3–9 ms sau mẫu cuối: mốc lấy lô ÍT TRỄ NHẤT
    for (let i = 0; i < 420; i++) { cat.datMoc(i * 2400, 2400, E0 + (i + 1) * 50 + 3 + (i % 4) * 2); cat.nap(new Float32Array(2400).fill(i < 200 ? 0.5 : 0)) }
    cat.dong()
    const e0 = E0 + 3 - TRE_VAO_MS
    expect(ra[0]!.dau.t0).toBe(Math.round(e0 - (TRE_LAME_MAU * 1000) / HZ_LIVE)); expect(ra[0]!.dau.tm).toBe(e0)
    expect(ra[1]!.dau.t0 - ra[0]!.dau.t0).toBe(ra[0]!.dau.kh * 24); expect(ra[2]!.dau.t0 - ra[1]!.dau.t0).toBe(ra[1]!.dau.kh * 24)
    expect(ra[1]!.dau.tm - ra[0]!.dau.tm).toBe(10_000)
    expect(ra[0]!.dau.muc).toHaveLength(20); expect(ra[0]!.dau.muc.every((m) => m === mucTuRms(0.5))).toBe(true)
    expect(ra[1]!.dau.muc).toEqual(Array(20).fill(0)); expect(ra[2]!.dau.muc).toHaveLength(2)
  })
  it('mốc giờ nét đi kèm khúc đang ghi (ms so với t0 của khúc); khúc đóng / mở lại đúng qua định dạng khúc', () => {
    const ra: KhucRa[] = [], cat = new BoCatKhuc(24000, maGia(24000), (k) => ra.push(k))
    cat.datMoc(0, 0, 5_000_000)
    cat.danhDau('n1', 5_000_400); cat.nap(new Float32Array(240_000)); cat.danhDau('n2', 5_012_345); cat.dong()
    expect(ra[0]!.dau.net).toEqual([['n1', 5_000_400 - ra[0]!.dau.t0]]); expect(ra[1]!.dau.net).toEqual([['n2', 5_012_345 - ra[1]!.dau.t0]])
    const k = docKhuc(ghiKhuc(ra[0]!.dau, ra[0]!.mp3))!
    expect(k.dau).toEqual(ra[0]!.dau); expect(k.mp3.length).toBe(ra[0]!.mp3.length)
  })
})

describe('Máy ghi tự chạy / tự dừng theo live', () => {
  beforeEach(() => { localStorage.clear(); vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })
  it('live bật ở máy đang giữ live + phòng bật Xem lại Live ⇒ tự ghi, báo phòng «đang-ghi» kèm mẫu đồng hồ; live tắt ⇒ tự dừng, báo «xong»', async () => {
    const M = await import('../src/lib/live/may-ghi')
    const tin: Record<string, unknown>[] = []
    const o = { layLuong: () => ({ mic: null, em: null }), phong: { ve: 'v', goc: 'https://may-chu' }, buoiId: 'b1', gui: (t: Record<string, unknown>) => { tin.push(t) } }
    M.soatMayGhi({ ...o, pha: 'live', live: { bat: true } as never }) // công tắc tắt (không có `ghi`) ⇒ không ghi
    M.soatMayGhi({ ...o, pha: 'san', live: { bat: true, ghi: 'tat' } as never }) // máy khác đang live ⇒ máy này không ghi
    expect(tin).toEqual([])
    M.soatMayGhi({ ...o, pha: 'live', live: { bat: true, ghi: 'tat' } as never })
    M.soatMayGhi({ ...o, pha: 'live', live: { bat: true, ghi: 'dang-ghi' } as never }) // gọi lặp ⇒ vẫn một máy ghi
    expect(tin).toHaveLength(1)
    expect(tin[0]).toMatchObject({ t: 'live-ghi', tt: 'dang-ghi' }); expect(typeof tin[0]!.dh).toBe('number'); expect(String(tin[0]!.p)).toMatch(/^[a-z0-9]{1,16}$/)
    vi.advanceTimersByTime(10_000)
    expect(tin).toHaveLength(2) // nhịp 10 giây (mẫu đồng hồ)
    M.soatMayGhi({ ...o, pha: 'san', live: { bat: false, ghi: 'tat' } as never })
    await vi.runAllTimersAsync()
    expect(tin[tin.length - 1]).toMatchObject({ t: 'live-ghi', tt: 'tat', xong: true, ket: 0, p: tin[0]!.p })
    M._datLaiMayGhi()
  })
  it('máy không có AudioWorklet / luồng thợ ⇒ báo «loi», KHÔNG ném lỗi (live vẫn chạy)', async () => {
    const M = await import('../src/lib/live/may-ghi')
    const tt: string[] = [], tin: Record<string, unknown>[] = []
    const mic = { active: true, getAudioTracks: () => [{}] } as unknown as MediaStream
    const may = M.taoMayGhi({ goc: 'https://may-chu', ve: 'v', buoi: 'b1', layLuong: () => ({ mic, em: null }), gui: (t) => { tin.push(t) }, khiTrangThai: (t) => { tt.push(t) } })
    await vi.advanceTimersByTimeAsync(50)
    expect(tt).toEqual(['dang-ghi', 'loi']); expect(tin.map((t) => t.tt)).toEqual(['dang-ghi', 'loi'])
    expect(() => may.danhDau('n1', Date.now())).not.toThrow()
    await may.dung()
    expect(tin[tin.length - 1]).toMatchObject({ tt: 'tat', xong: true })
  })
})

// ── Phần nối ở cửa sổ app + mặt tờ chiếu ──
const goiGhi: [string, unknown][] = []
let khiTt: ((t: Record<string, unknown>) => void) | null = null
vi.mock('../src/lib/live', () => ({
  taoLiveThay: (tuy: { khiTrangThai?: (t: Record<string, unknown>) => void }) => {
    khiTt = tuy.khiTrangThai ?? null
    const khong = () => {}
    return { noiSan: async () => {}, dsMic: async () => [], moMic: async () => ({ ok: true }), bat: async () => ({ ok: true }), tat: khong, thaMic: khong, mucAm: () => 0, dat: khong, thuMic: khong, datNgheEm: khong,
      nhanSuKienBut: khong, guiAnh: khong, nhanTinPhong: khong, khiNoiLai: khong, huy: khong, luongGhi: () => ({ mic: null, em: null }) }
  },
}))
vi.mock('../src/components/bpu/gan-gv', () => ({ datLive: () => {} }))
class WsGia extends EventTarget { readyState = 1; binaryType = 'blob'; send() {} mo() { this.dispatchEvent(new Event('open')) } nhan(v: unknown) { this.dispatchEvent(Object.assign(new Event('message'), { data: JSON.stringify(v) })) } }
function phong(xl: boolean): TrangThaiPhong {
  const st = taoPhong({ buoiId: 'b1', lop: '12A1', nay: 1000, ds: [{ sbd: 'S1', ten: 'Nguyễn Thị Hà', coMat: true, luc: 1000 }] })
  datCoLive(st, { cho: true, sfu: false }, 1000)
  if (xl) st.live!.ghi = 'tat'
  return st
}
describe('phần nối ở cửa sổ app (thay-noi.ts)', () => {
  beforeEach(() => { localStorage.clear(); goiGhi.length = 0; vi.resetModules() })
  it('đang live + phòng báo `ghi` ⇒ nạp mảnh máy ghi và soát; ngăn ghi + thẻ nhắc MỘT lần sang tờ; nét mới ⇒ đánh mốc giờ', async () => {
    vi.doMock('../src/lib/live/may-ghi', () => ({ soatMayGhi: (o: { pha?: string; buoiId?: string; live?: { ghi?: string } | null }) => { goiGhi.push(['soat', { pha: o.pha, buoiId: o.buoiId, ghi: o.live?.ghi }]) }, danhDauNet: (sk: { loai: string }) => { goiGhi.push(['moc', sk.loai]) }, taiBuKhucKet: () => { goiGhi.push(['bu', null]) } }))
    const M = await import('../src/components/live/thay-noi'), C = await import('../src/components/bpu/cau-live')
    const tin: Record<string, unknown>[] = [], to = { postMessage: (m: Record<string, unknown>) => { tin.push(m) } } as unknown as Window
    const ttCuoi = () => [...tin].reverse().find((m) => m.lenh === 'live-tt')!.tt as { ghi?: string; nhacGhi?: boolean; pha: string }
    const cho = () => new Promise((r) => setTimeout(r, 0))
    const ws = new WsGia(), st = phong(true)
    C.noiLive(ws as unknown as WebSocket, 've-gv', 'https://may-chu'); ws.mo()
    M.nhanTinTo({ viec: 'chao' }, to)
    ws.nhan(viewBang(st)); await cho(); await cho()
    expect(goiGhi).toEqual([]) // chưa live ⇒ KHÔNG nạp mảnh máy ghi
    expect(ttCuoi().ghi).toBeUndefined()
    liveBat(st, 2000); ws.nhan(viewBang(st)); await cho()
    khiTt?.({ pha: 'live', tieng: 'khong', xem: 0, xemWs: 0 }); await cho(); await cho()
    expect(goiGhi.filter((x) => x[0] === 'soat').pop()).toEqual(['soat', { pha: 'live', buoiId: 'b1', ghi: 'tat' }])
    expect(ttCuoi()).toMatchObject({ pha: 'live', ghi: 'tat' }); expect(ttCuoi().nhacGhi).toBeUndefined()
    st.live!.ghi = 'dang-ghi'; ws.nhan(viewBang(st)); await cho(); await cho()
    expect(ttCuoi()).toMatchObject({ ghi: 'dang-ghi', nhacGhi: true })
    M.nhanTinTo({ viec: 'but', sk: { loai: 'net-moi', trang: 'c1', net: { id: 'n1', cong: 'but', mau: '#fff', co: 3, diem: [[0.1, 0.1, 0.5, 0]] } } }, to)
    expect(goiGhi.filter((x) => x[0] === 'moc')).toEqual([['moc', 'net-moi']])
    // lần live sau trên máy này: không nhắc nữa
    M._datLaiLiveThay()
    expect(localStorage.getItem('ddh.live.ghi-da-nhac')).toBe('1')
    M.nhanTinTo({ viec: 'chao' }, to)
    ws.nhan(viewBang(st)); await cho(); await cho()
    khiTt?.({ pha: 'live', tieng: 'khong', xem: 0, xemWs: 0 }); await cho()
    expect(ttCuoi().ghi).toBe('dang-ghi'); expect(ttCuoi().nhacGhi).toBeUndefined()
    M._datLaiLiveThay()
  })
  it('công tắc Xem lại Live tắt (phòng không có `ghi`) ⇒ không nạp mảnh máy ghi, tờ không có ngăn ghi', async () => {
    vi.doMock('../src/lib/live/may-ghi', () => ({ soatMayGhi: () => { goiGhi.push(['soat', null]) }, danhDauNet: () => {}, taiBuKhucKet: () => {} }))
    const M = await import('../src/components/live/thay-noi'), C = await import('../src/components/bpu/cau-live')
    const tin: Record<string, unknown>[] = [], to = { postMessage: (m: Record<string, unknown>) => { tin.push(m) } } as unknown as Window
    const ws = new WsGia(), st = phong(false)
    C.noiLive(ws as unknown as WebSocket, 've-gv', 'https://may-chu'); ws.mo()
    M.nhanTinTo({ viec: 'chao' }, to)
    liveBat(st, 2000); ws.nhan(viewBang(st)); await new Promise((r) => setTimeout(r, 0))
    khiTt?.({ pha: 'live', tieng: 'khong', xem: 0, xemWs: 0 }); await new Promise((r) => setTimeout(r, 5))
    expect(goiGhi).toEqual([])
    expect('ghi' in ([...tin].reverse().find((m) => m.lenh === 'live-tt')!.tt as object)).toBe(false)
    M._datLaiLiveThay()
  })
})

describe('ngăn ghi trong viên Live của tờ chiếu', () => {
  const ham = /function lvNganGhi\(t\) \{[\s\S]*?\n  \}/.exec(JS_LIVE_TO_CHIEU)![0]
  const lvNganGhi = new Function('LV_BT', `${ham}; return lvNganGhi`)({ mic: '<svg></svg>' }) as (t: { ghi?: string; tu?: number }) => string
  it('đang ghi ⇒ «Đang ghi để xem lại»; lỗi ⇒ ngăn vàng «Chưa ghi được · live vẫn chạy»; công tắc tắt ⇒ không vẽ; 15 giây đầu chưa báo ⇒ chưa vẽ', () => {
    expect(lvNganGhi({})).toBe('')
    expect(lvNganGhi({ ghi: 'dang-ghi' }).replace(/<[^>]+>|&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()).toBe('Đang ghi để xem lại')
    expect(lvNganGhi({ ghi: 'loi' })).toContain('class="ghi-loi"'); expect(lvNganGhi({ ghi: 'loi' })).toContain('Chưa ghi được · live vẫn chạy')
    expect(lvNganGhi({ ghi: 'tat', tu: Date.now() - 3000 })).toBe('')
    expect(lvNganGhi({ ghi: 'tat', tu: Date.now() - 16_000 })).toContain('Chưa ghi được · live vẫn chạy')
    expect(JS_LIVE_TO_CHIEU).toContain('Thầy không cần bấm gì thêm.')
    expect(() => new Function(JS_LIVE_TO_CHIEU)).not.toThrow() // cú pháp hợp lệ
  })
})
