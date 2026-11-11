// LIVE — LỌC ỒN LƯỢT 3 (thầy 11/11: «khử ồn phải thật xuất sắc, giọng nói trong rõ ràng»): bộ lọc sâu DeepFilterNet 3 ở Worker riêng + đường lui nhiều tầng.
// Test chạy ĐÚNG mã Worker của app (chuỗi MA_KHUNG / MA_LOC) với RNNoise thật (tệp wasm trong kho) và một bộ DeepFilterNet GIẢ (trả tiếng gốc lùi 30 ms × 0,5)
// ⇒ kiểm phần app tự viết: nhập cuộc êm, trộn chéo 200 ms, quá hạn / chậm / lỗi thì về RNNoise, không bao giờ mất tiếng. Chất lượng lọc thật: do-loc-on.mjs.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MA_KHUNG, THAM_LOC_ON } from '../src/lib/live/chuoi-tieng'
import { MA_LOC, TRE_DF3 } from '../src/lib/live/loc-on/ma-loc'

const RN = readFileSync(join(__dirname, '../src/lib/live/loc-on/rnnoise.wasm'))
const rnBuf = (): ArrayBuffer => RN.buffer.slice(RN.byteOffset, RN.byteOffset + RN.byteLength) as ArrayBuffer
const K = 480

interface MaLoc { napLoc(b: ArrayBuffer): void; locOn(x: Float32Array): void; buocDf(x: Float32Array, goc: Float32Array, y: Float32Array | null): void; dfDo(ms: number): void; dfMuon(): number; dfCho(): number; dat(t: unknown): void; df(v: number): void; tt(): { dfGd: number; dfW: number; tre: number; dfBo: number; dfOk: number } }
function taoLoc(tin: unknown[] = []): MaLoc {
  return new Function('postMessage', MA_LOC + '\nreturn { napLoc: napLoc, locOn: locOn, buocDf: buocDf, dfDo: dfDo, dfMuon: dfMuon, dfCho: dfCho, dat: function (t) { thDich = t; }, df: function (v) { dfOk = v; }, tt: function () { return { dfGd: dfGd, dfW: dfW, tre: tre, dfBo: dfBo, dfOk: dfOk }; } };')((m: unknown) => tin.push(m)) as MaLoc
}
/** Tiếng thử: ồn trắng nhỏ đều (RNNoise coi là im ⇒ có quãng im để nhập cuộc) — có hạt giống, lặp lại được. */
function taoOn(n: number, bien = 0.01): Float32Array { let h = 4242; const m = new Float32Array(n); for (let i = 0; i < n; i++) { h = (h * 1103515245 + 12345) & 0x7fffffff; m[i] = (h / 0x7fffffff - 0.5) * 2 * bien } return m }
/** Bộ DeepFilterNet giả: tiếng gốc lùi đúng TRE_DF3 mẫu, nhân 0,5. */
function dfGia(x: Float32Array): Float32Array { const y = new Float32Array(x.length); for (let i = TRE_DF3; i < x.length; i++) y[i] = x[i - TRE_DF3]! * 0.5; return y }
/** Chạy vòng của Worker (đồng bộ): `coY(k)` = khung thứ k có nhận được khung DeepFilterNet không; `ms(k)` = thời gian bộ ấy báo. */
function chay(m: MaLoc, x: Float32Array, o: { coY?: (k: number) => boolean; ms?: (k: number) => number } = {}): { y: Float32Array; w: number[] } {
  const y = new Float32Array(x.length), yd = dfGia(x), w: number[] = []
  for (let d = 0, k = 0; d + K <= x.length; d += K, k++) {
    const kh = x.slice(d, d + K), dung = m.tt().dfGd || m.dfMuon(), goc = dung ? kh.slice() : null
    m.locOn(kh)
    if (goc) { const cho = m.dfCho() && (o.coY?.(k) ?? true); if (m.dfMuon()) m.dfDo(o.ms?.(k) ?? 1); m.buocDf(kh, goc, cho ? yd.subarray(d, d + K) : null) }
    y.set(kh, d); w.push(m.tt().dfW)
  }
  return { y, w }
}
const nl = (m: Float32Array, a: number, b: number): number => { let e = 0; for (let i = a; i < b; i++) e += m[i]! * m[i]!; return Math.sqrt(e / (b - a)) }
const buocLonNhat = (m: Float32Array, a: number, b: number): number => { let v = 0; for (let i = a + 1; i < b; i++) v = Math.max(v, Math.abs(m[i]! - m[i - 1]!)); return v }

describe('Z3 · bộ lọc sâu: nhập cuộc êm, trộn chéo 200 ms', () => {
  it('bộ lọc sâu CHƯA sẵn ⇒ chạy RNNoise như lượt 2 (trễ 10 ms), không đợi gì', () => {
    const tin: unknown[] = [], m = taoLoc(tin)
    m.napLoc(rnBuf()); m.dat(THAM_LOC_ON.manh)
    const x = taoOn(K * 120), r = chay(m, x)
    expect(tin).toContainEqual({ loc: 'chay' })
    expect(m.tt()).toMatchObject({ tre: 1, dfGd: 0, dfW: 0, dfBo: 0 })
    expect(r.w.every((v) => v === 0)).toBe(true)
    expect(nl(r.y, K * 60, K * 120)).toBeLessThan(nl(x, K * 60, K * 120)) // RNNoise + cổng đang hạ ồn
    expect(nl(r.y, K * 60, K * 120)).toBeGreaterThan(0)
  })

  it('bộ lọc sâu sẵn ⇒ đủ 50 khung chạy nóng + một quãng im thì NHẬP CUỘC, rồi trộn chéo đúng 20 khung (200 ms) — không có bước nhảy nào ở chỗ nối', () => {
    const tin: unknown[] = [], m = taoLoc(tin)
    m.napLoc(rnBuf()); m.dat(THAM_LOC_ON.vua); m.df(1)
    const x = taoOn(K * 200), r = chay(m, x)
    const dau = r.w.findIndex((v) => v > 0), cuoi = r.w.findIndex((v) => v >= 1)
    expect(dau).toBeGreaterThanOrEqual(50) // chưa đủ 50 khung trả về thì chưa vào
    expect(dau).toBeLessThan(70)
    expect(cuoi - dau).toBe(19) // 0,05 mỗi khung ⇒ khung thứ 20 đạt 1
    for (let k = dau + 1; k <= cuoi; k++) expect(r.w[k]! - r.w[k - 1]!).toBeCloseTo(0.05, 5)
    expect(tin).toContainEqual({ bo: 'df3', tre: 30 })
    expect(m.tt()).toMatchObject({ dfGd: 1, dfBo: 1 })
    // chỗ nối (5 khung trước nhập cuộc → hết trộn chéo): bước nhảy giữa hai mẫu liền nhau không lớn hơn bước nhảy của chính tiếng vào
    expect(buocLonNhat(r.y, (dau - 5) * K, (cuoi + 2) * K)).toBeLessThanOrEqual(buocLonNhat(x, 0, x.length))
    // sau khi vào: đầu ra = bộ lọc sâu (tiếng gốc lùi 30 ms × 0,5, trộn lại 12 % tiếng gốc ở mức Vừa) nhân cổng — KHÔNG im
    expect(nl(r.y, (cuoi + 5) * K, x.length)).toBeGreaterThan(0)
  })

  it('đang nói liên tục (không có quãng im): chờ tối đa 3 giây rồi vẫn nhập cuộc', () => {
    const m = taoLoc()
    m.napLoc(rnBuf()); m.dat(THAM_LOC_ON.manh); m.df(1)
    // «giọng» = chuỗi xung đều 140 Hz qua vài cộng hưởng: RNNoise báo có giọng liên tục
    const x = new Float32Array(K * 520); for (let i = 0; i < x.length; i++) { const p = (i * 140 / 48000) % 1; x[i] = 0.2 * (2 * p - 1) * (0.6 + 0.4 * Math.sin(i * 0.0007)) + 0.05 * Math.sin(i * 0.09) + 0.03 * Math.sin(i * 0.31) }
    const r = chay(m, x), dau = r.w.findIndex((v) => v > 0)
    expect(dau).toBeGreaterThan(0)
    expect(dau).toBeLessThanOrEqual(50 + 300 + 3)
  })
})

describe('Z3 · đường lui: bộ lọc sâu lỗi / chậm ⇒ về RNNoise, KHÔNG BAO GIỜ mất tiếng', () => {
  it('một khung quá hạn (không có khung trả về) lúc đang chạy ⇒ khung ấy lấy ngay đường RNNoise đã khớp trễ, tiếng không đứt', () => {
    const tin: unknown[] = [], m = taoLoc(tin)
    m.napLoc(rnBuf()); m.dat(THAM_LOC_ON.vua); m.df(1)
    const x = taoOn(K * 260, 0.05), r = chay(m, x, { coY: (k) => k < 150 })
    expect(r.w[149]).toBe(1)
    expect(r.w[150]).toBe(0) // rơi thẳng về RNNoise trong đúng khung ấy
    expect(tin).toContainEqual({ bo: 'rn', tre: 30 }) // vẫn ở đường trễ 30 ms ⇒ không nhảy thời gian
    for (let k = 150; k < 260; k++) expect(nl(r.y, k * K, (k + 1) * K)).toBeGreaterThan(0)
    expect(buocLonNhat(r.y, 148 * K, 153 * K)).toBeLessThanOrEqual(buocLonNhat(x, 0, x.length))
  })

  it('bộ lọc sâu chạy chậm (trung bình > 6 ms mỗi khung 10 ms = hệ số thời gian thực 0,6) ⇒ tự bỏ, báo `cham`, trộn về RNNoise', () => {
    const tin: unknown[] = [], m = taoLoc(tin)
    m.napLoc(rnBuf()); m.dat(THAM_LOC_ON.manh); m.df(1)
    const x = taoOn(K * 300, 0.05), r = chay(m, x, { ms: (k) => (k < 120 ? 1 : 9) })
    expect(r.w[119]).toBe(1)
    expect(tin.some((t) => (t as { df?: string }).df === 'cham')).toBe(true)
    expect(m.tt().dfOk).toBe(0)
    expect(r.w[299]).toBe(0)
    for (let k = 120; k < 300; k++) expect(nl(r.y, k * K, (k + 1) * K)).toBeGreaterThan(0)
  })

  it('chậm ngay từ lúc chạy nóng ⇒ không bao giờ nhập cuộc', () => {
    const m = taoLoc()
    m.napLoc(rnBuf()); m.dat(THAM_LOC_ON.manh); m.df(1)
    const r = chay(m, taoOn(K * 200), { ms: () => 8 })
    expect(r.w.every((v) => v === 0)).toBe(true)
    expect(m.tt()).toMatchObject({ dfGd: 0, dfOk: 0 })
  })

  it('thầy bấm «Tắt» lúc bộ lọc sâu đang chạy ⇒ trộn về, bỏ phần lùi, đầu ra trở lại ĐÚNG tiếng mic (trễ 0)', () => {
    const m = taoLoc()
    m.napLoc(rnBuf()); m.dat(THAM_LOC_ON.vua); m.df(1)
    const x = taoOn(K * 400, 0.05)
    chay(m, x.subarray(0, K * 150))
    expect(m.tt().dfBo).toBe(1)
    m.dat(null)
    const r = chay(m, x.subarray(K * 150))
    expect(m.tt()).toMatchObject({ dfGd: 0, dfW: 0, tre: 0 })
    const cuoi = x.subarray(K * 150)
    for (let i = K * 200; i < K * 250; i++) expect(r.y[i]).toBe(cuoi[i])
  })
})

describe('Z3 · vòng đọc của Worker: chờ khung bộ lọc sâu tối đa 25 ms', () => {
  const khung = (m: Float32Array, moc: number) => ({ numberOfFrames: K, numberOfChannels: 1, sampleRate: 48000, timestamp: moc, copyTo: (d: Float32Array) => d.set(m), close: () => undefined })
  function taoTho(tin: unknown[]) {
    class AudioDataGia { data: Float32Array; timestamp: number; constructor(o: { data: Float32Array; timestamp: number }) { this.data = o.data; this.timestamp = o.timestamp } }
    return new Function('postMessage', 'AudioData', 'var onmessage;\n' + MA_KHUNG + '\nreturn { tin: function (d) { onmessage({ data: d }); }, xuLy: xuLy, dat: function () { c = { dich: 0.12, tran: 0.78, nhoNhat: 0.5, lonNhat: 20, len: 3, lenDau: 9, xuong: 3 }; }, tt: function () { return { dfGd: dfGd, dfW: dfW, dfOk: dfOk, dfAm: dfAm }; } };')((m: unknown) => tin.push(m), AudioDataGia) as { tin(d: unknown): void; xuLy(f: unknown): { data: Float32Array } | Promise<{ data: Float32Array }>; dat(): void; tt(): { dfGd: number; dfW: number; dfOk: number; dfAm: number } }
  }
  afterEach(() => { vi.useRealTimers() })

  it('bộ lọc sâu trả lời đều ⇒ nhập cuộc; một khung QUÁ HẠN 25 ms ⇒ khung ấy vẫn ra (đường RNNoise) rồi trộn chéo trở lại; quá hạn 3 lần ⇒ báo `cham`, thôi chờ', async () => {
    vi.useFakeTimers()
    const tin: unknown[] = [], t = taoTho(tin), x = taoOn(K * 200, 0.05)
    let traLoi = true
    const cong = { onmessage: null as null | ((e: { data: unknown }) => void), postMessage(d: { s: number; k: Float32Array }) { if (traLoi) queueMicrotask(() => cong.onmessage?.({ data: { s: d.s, k: new Float32Array(K), ms: 1 } })) }, close() { /* đóng */ } }
    t.dat(); t.tin({ loc: rnBuf(), muc: THAM_LOC_ON.manh }); t.tin({ df: cong })
    let k = 0
    const buoc = () => { const r = t.xuLy(khung(x.subarray(k * K, (k + 1) * K), k * 10000)); k++; return r }
    for (; k < 100;) { expect((await buoc()).data.length).toBe(K); await Promise.resolve() }
    expect(t.tt()).toMatchObject({ dfGd: 1, dfOk: 1 })
    expect(t.tt().dfW).toBeGreaterThan(0)
    // khung quá hạn thứ nhất
    traLoi = false
    const r = buoc()
    expect(typeof (r as Promise<unknown>).then).toBe('function') // đang chờ bộ lọc sâu
    let xong: { data: Float32Array } | null = null
    void (r as Promise<{ data: Float32Array }>).then((a) => { xong = a })
    await vi.advanceTimersByTimeAsync(24)
    expect(xong).toBeNull()
    await vi.advanceTimersByTimeAsync(2)
    expect(xong).not.toBeNull()
    expect(nl(xong!.data, 0, K)).toBeGreaterThan(0) // có tiếng (đường RNNoise), không phải khung câm
    expect(t.tt()).toMatchObject({ dfOk: 1, dfW: 0 }) // một cú khựng lẻ: CHƯA bỏ bộ lọc sâu
    expect(tin.some((m) => (m as { df?: string }).df === 'cham')).toBe(false)
    // bộ lọc sâu trả lời lại ⇒ trộn chéo trở lại
    traLoi = true
    for (let i = 0; i < 25; i++) { await buoc(); await Promise.resolve() }
    expect(t.tt().dfW).toBe(1)
    // quá hạn thêm hai lần nữa (tổng 3 lần trong 30 giây) ⇒ bỏ hẳn
    traLoi = false
    for (let i = 0; i < 2; i++) { const p = buoc() as Promise<{ data: Float32Array }>; await vi.advanceTimersByTimeAsync(26); expect(nl((await p).data, 0, K)).toBeGreaterThan(0) }
    expect(tin).toContainEqual({ df: 'cham', han: 1 })
    expect(t.tt()).toMatchObject({ dfOk: 0, dfW: 0 })
    const r2 = buoc()
    expect(typeof (r2 as Promise<unknown>).then).toBe('undefined') // không chờ nữa: ra ngay
    expect(nl((r2 as { data: Float32Array }).data, 0, K)).toBeGreaterThan(0)
  })

  it('bộ lọc sâu báo lỗi giữa chừng ⇒ khung đang chờ được thả ngay với đường RNNoise, báo `loi`', async () => {
    const tin: unknown[] = [], t = taoTho(tin), x = taoOn(K * 140, 0.05)
    let hong = false
    const cong = { onmessage: null as null | ((e: { data: unknown }) => void), postMessage(d: { s: number }) { queueMicrotask(() => cong.onmessage?.({ data: hong ? { s: d.s, loi: 1 } : { s: d.s, k: new Float32Array(K), ms: 1 } })) }, close() { /* đóng */ } }
    t.dat(); t.tin({ loc: rnBuf(), muc: THAM_LOC_ON.vua }); t.tin({ df: cong })
    for (let k = 0; k < 100; k++) { await t.xuLy(khung(x.subarray(k * K, (k + 1) * K), k * 10000)); await Promise.resolve() }
    expect(t.tt().dfGd).toBe(1)
    hong = true
    const a = await t.xuLy(khung(x.subarray(100 * K, 101 * K), 1e6))
    expect(nl(a.data, 0, K)).toBeGreaterThan(0)
    expect(tin).toContainEqual({ df: 'loi' })
    expect(t.tt().dfOk).toBe(0)
  })
})

describe('Z3 · Worker bộ lọc sâu phía luồng chính (df3.ts): tải có tiến độ, sẵn sàng thì nối cổng, chậm / lỗi thì thôi', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); vi.useRealTimers() })
  async function dung() {
    const tho: { tin: unknown[]; onmessage: ((e: { data: unknown }) => void) | null; dung: boolean }[] = []
    vi.stubGlobal('Worker', class { tin: unknown[] = []; onmessage = null; onerror = null; dung = false; constructor() { tho.push(this as never) } postMessage(m: unknown) { this.tin.push(m) } terminate() { this.dung = true } })
    vi.stubGlobal('DecompressionStream', class {})
    vi.stubGlobal('MessageChannel', class { port1 = { ten: 1 }; port2 = { ten: 2 } })
    const U = URL as unknown as { createObjectURL?: unknown; revokeObjectURL?: unknown }
    U.createObjectURL = () => 'blob:df3'; U.revokeObjectURL = () => undefined
    vi.resetModules()
    const df3 = await import('../src/lib/live/loc-on/df3')
    return { df3, tho }
  }

  it('lần đầu cần ⇒ dựng MỘT Worker, gửi địa chỉ hai tệp ở /loc-on/ (không nằm trong assets/ ⇒ ngoài kho tải sẵn); tiến độ lên dần; sẵn sàng ⇒ chuỗi tiếng nhận cổng', async () => {
    const { df3, tho } = await dung()
    const chuoi = { tin: [] as unknown[], postMessage(m: unknown) { this.tin.push(m) } } as unknown as Worker & { tin: unknown[] }
    let goi = 0
    df3.ngheDf3(() => { goi++ })
    expect(df3.tinhDf3().tinh).toBe('khong')
    df3.noiDf3(chuoi)
    expect(tho.length).toBe(1)
    const tai = (tho[0]!.tin[0] as { tai: { wasm: string; moHinh: string; kho: string } }).tai
    expect(tai.wasm).toMatch(/\/loc-on\/df3-wasm-[0-9]+\.bin$/)
    expect(tai.moHinh).toMatch(/\/loc-on\/df3-mo-hinh-v3\.bin$/)
    expect(tai.kho).toBe(df3.TEP_DF3.kho)
    expect(df3.tinhDf3()).toMatchObject({ tinh: 'tai', da: 0, tong: df3.TEP_DF3.coWasm + df3.TEP_DF3.coMoHinh })
    tho[0]!.onmessage!({ data: { da: 5_000_000 } })
    expect(df3.tinhDf3()).toMatchObject({ tinh: 'tai', da: 5_000_000 })
    expect(chuoi.tin.length).toBe(0) // chưa sẵn ⇒ chuỗi tiếng chưa nhận gì, vẫn chạy RNNoise
    tho[0]!.onmessage!({ data: { san: 1, ms: 1.2, msDung: 900 } })
    expect(df3.tinhDf3().tinh).toBe('san')
    expect(chuoi.tin[0]).toMatchObject({ df: { ten: 2 } })
    expect(tho[0]!.tin[1]).toMatchObject({ cong: { ten: 1 } })
    expect(goi).toBeGreaterThanOrEqual(3)
    // lần mở mic sau (chuỗi tiếng mới) ⇒ dùng lại Worker ấy, nối cổng ngay
    const chuoi2 = { tin: [] as unknown[], postMessage(m: unknown) { this.tin.push(m) } } as unknown as Worker & { tin: unknown[] }
    df3.noiDf3(chuoi2)
    expect(tho.length).toBe(1)
    expect(chuoi2.tin[0]).toMatchObject({ df: { ten: 2 } })
  })

  it('chạy nóng đã chậm (> 6 ms mỗi khung) hoặc chuỗi tiếng báo chậm ⇒ `cham`, dừng Worker, không thử lại trong lượt mở app này', async () => {
    const { df3, tho } = await dung()
    const chuoi = { postMessage() { /* nhận */ } } as unknown as Worker
    df3.noiDf3(chuoi)
    tho[0]!.onmessage!({ data: { san: 1, ms: 7.5 } })
    expect(df3.tinhDf3().tinh).toBe('cham')
    expect(tho[0]!.dung).toBe(true)
    expect(df3.coDf3()).toBe(false)
    df3.noiDf3(chuoi)
    expect(tho.length).toBe(1)
  })

  it('tải / dựng lỗi ⇒ `loi` (chuỗi tiếng cứ chạy RNNoise); lần mở mic sau thử lại, quá 3 lần thì thôi', async () => {
    const { df3, tho } = await dung()
    const chuoi = { postMessage() { /* nhận */ } } as unknown as Worker
    for (let i = 0; i < 3; i++) { df3.noiDf3(chuoi); expect(tho.length).toBe(i + 1); tho[i]!.onmessage!({ data: { loi: 'tai 404' } }); expect(df3.tinhDf3().tinh).toBe('loi') }
    expect(df3.coDf3()).toBe(false)
    df3.noiDf3(chuoi)
    expect(tho.length).toBe(3)
  })

  it('không còn chuỗi tiếng nào dùng suốt 60 giây ⇒ dừng Worker cho nhẹ máy; có chuỗi mới trước đó thì giữ', async () => {
    vi.useFakeTimers()
    const { df3, tho } = await dung()
    const chuoi = { postMessage() { /* nhận */ } } as unknown as Worker
    const go = df3.noiDf3(chuoi)
    tho[0]!.onmessage!({ data: { san: 1, ms: 1 } })
    go()
    await vi.advanceTimersByTimeAsync(30_000)
    const go2 = df3.noiDf3(chuoi)
    await vi.advanceTimersByTimeAsync(61_000)
    expect(tho[0]!.dung).toBe(false)
    go2()
    await vi.advanceTimersByTimeAsync(61_000)
    expect(tho[0]!.dung).toBe(true)
    expect(df3.tinhDf3().tinh).toBe('khong')
  })
})
