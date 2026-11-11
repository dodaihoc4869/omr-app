// «CHỈ GIỌNG THẦY» lượt 2 — LƯỚI trong Worker khung (MA_TACH + MA_KHUNG của src/lib/live/chuoi-tieng.ts, chạy ĐÚNG chuỗi ấy):
//  · bật / tắt trộn một khung, tắt xong là tiếng gốc;
//  · luật thầy chốt 11/11 đêm: CHỈ HỌC SINH NÓI MÀ ĐẦU RA IM LÀ ĐÚNG ⇒ không tự tắt. Chỉ quay về tiếng gốc khi (a) bộ nhận giọng báo đang có giọng thầy ≥ 1,5 s
//    mà tiếng ra im (≤ −30 dB so với vào) ⇒ «cam-thay»; hoặc (b) lỗi kỹ thuật: số hỏng ⇒ tắt NGAY, tiếng ra ≈ 0 tuyệt đối ⇒ «cam-ky-thuat», chậm ⇒ «cham»,
//    khung ngừng chảy ⇒ xetNgungChay;
//  · công tắc lùi khẩn + cờ hiện mức (src/lib/live/chi-thay.ts).
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { MA_TACH } from '../src/lib/live/tach-giong-thay'
import { NGUNG_CHAY_MS, xetNgungChay } from '../src/lib/live/chuoi-tieng'
import { chiThayCo, chiThayTatKhan, taiMoHinhThay } from '../src/lib/live/chi-thay'

const MA_KHUNG = /const MA_KHUNG = `([\s\S]*?)`/.exec(readFileSync(resolve(__dirname, '../src/lib/live/chuoi-tieng.ts'), 'utf8'))![1]!

function tepGia(D = 4, NB = 221): ArrayBuffer {
  const n = [NB, NB, NB * D, D, D * 3 * D, D * 3 * D, 3 * D, D * 3 * D, D * 3 * D, 3 * D, D * NB, NB]
  const js = new TextEncoder().encode(JSON.stringify({ ban: 'thu-luoi', ngay: '2026-11-11', D, NB, hiTu: 120 }))
  const dau = 8 + js.length, lech = (4 - (dau % 4)) % 4, tong = n.reduce((a, b) => a + b, 0)
  const ab = new ArrayBuffer(dau + lech + tong * 4), u8 = new Uint8Array(ab)
  u8.set([84, 71, 84, 49]); new DataView(ab).setUint32(4, js.length, true); u8.set(js, 8)
  const f = new Float32Array(ab, dau + lech); let o = 0
  n.forEach((k, i) => { for (let j = 0; j < k; j++) f[o + j] = i === 1 ? 1 : i === 0 ? -3 : i === 11 ? 1 : 0.01 * Math.sin(j); o += k })
  return ab
}

type Tin = Record<string, unknown>
function taoWorker(dongHo?: () => number) {
  const tin: Tin[] = []
  class AD { d: Float32Array; constructor(o: { data: Float32Array }) { this.d = o.data } }
  const perf = { now: dongHo ?? (() => performance.now()) }
  const W = new Function('postMessage', 'AudioData', 'performance', MA_TACH + MA_KHUNG + '\nreturn { xuLy: xuLy, dat: function (v) { c = v; }, nhan: function (d) { onmessage({ data: d }); }, lay: function () { return { tg: tg, pha: tgPha }; } };')(
    (d: Tin) => tin.push(d), AD, perf) as { xuLy(f: unknown): AD; dat(c: Tin): void; nhan(d: Tin): void; lay(): { tg: { khung(x: Float32Array): Float32Array } | null; pha: number } }
  W.dat({ chiTach: true })
  const khung = (x: Float32Array): Float32Array => W.xuLy({ numberOfFrames: 480, numberOfChannels: 1, sampleRate: 48000, timestamp: 0, copyTo: (d: Float32Array) => d.set(x), close: () => undefined }).d
  return { W, tin, khung }
}
const giong = (k: number): Float32Array => Float32Array.from({ length: 480 }, (_, i) => 0.1 * Math.sin((k * 480 + i) * 0.03) + 0.05 * Math.sin((k * 480 + i) * 0.41))

describe('lưới «Chỉ giọng thầy» trong Worker khung', () => {
  it('nạp mô hình ⇒ báo «chay» kèm bản; bật ⇒ tiếng ra khác tiếng vào; tắt ⇒ trộn một khung rồi về đúng tiếng gốc', () => {
    const { W, tin, khung } = taoWorker()
    W.nhan({ chiThay: true }); W.nhan({ tach: tepGia() })
    expect(tin.find((t) => t.tg === 'chay')).toMatchObject({ h: { ban: 'thu-luoi' } })
    expect(W.lay().pha).toBe(1)
    let khac = 0
    for (let k = 0; k < 20; k++) { const x = giong(k), y = khung(x.slice()); for (let i = 0; i < 480; i++) khac = Math.max(khac, Math.abs(y[i]! - x[i]!)) }
    expect(W.lay().pha).toBe(2); expect(khac).toBeGreaterThan(0.01)
    W.nhan({ chiThay: false }); khung(giong(20))
    expect(W.lay().pha).toBe(0)
    const x = giong(21); expect(Array.from(khung(x.slice()))).toEqual(Array.from(x))
  })

  it('lõi ra số hỏng (NaN) ⇒ tắt ngay «so-hong», khung ấy đi tiếng gốc', () => {
    const { W, tin, khung } = taoWorker()
    W.nhan({ chiThay: true }); W.nhan({ tach: tepGia() })
    W.lay().tg!.khung = (x: Float32Array) => x.fill(NaN)
    const x = giong(0), y = khung(x.slice())
    expect(Array.from(y)).toEqual(Array.from(x))
    expect(tin.find((t) => t.tg === 'tu-tat')).toMatchObject({ ly: 'so-hong' }); expect(W.lay().pha).toBe(0)
  })

  it('(b) lỗi kỹ thuật: mic có tín hiệu mà tiếng ra ≈ 0 tuyệt đối suốt 1,5 giây ⇒ tự tắt «cam-ky-thuat»; 1,4 giây thì chưa', () => {
    const { W, tin, khung } = taoWorker()
    W.nhan({ chiThay: true }); W.nhan({ tach: tepGia() })
    W.lay().tg!.khung = (x: Float32Array) => x.fill(0)
    for (let k = 0; k < 140; k++) khung(giong(k))
    expect(tin.some((t) => t.tg === 'tu-tat')).toBe(false)
    for (let k = 140; k < 151; k++) khung(giong(k))
    expect(tin.find((t) => t.tg === 'tu-tat')).toMatchObject({ ly: 'cam-ky-thuat' })
    const x = giong(200); expect(Array.from(khung(x.slice()))).toEqual(Array.from(x))
  })

  it('CHỈ HỌC SINH NÓI (không có tin «thầy đang nói») mà tiếng ra hạ 40 dB suốt 3 giây ⇒ ĐÚNG, KHÔNG tự tắt', () => {
    const { W, tin, khung } = taoWorker()
    W.nhan({ chiThay: true }); W.nhan({ tach: tepGia() })
    W.lay().tg!.khung = (x: Float32Array) => { for (let i = 0; i < x.length; i++) x[i]! *= 0.01; return x }
    for (let k = 0; k < 300; k++) khung(giong(k))
    expect(tin.some((t) => t.tg === 'tu-tat')).toBe(false); expect(W.lay().pha).toBe(2)
  })

  it('(a) bộ nhận giọng báo ĐANG CÓ GIỌNG THẦY mà tiếng ra hạ ≥ 30 dB suốt 1,5 giây ⇒ «cam-thay», về tiếng gốc; báo thầy thôi nói ⇒ đếm lại', () => {
    const { W, tin, khung } = taoWorker()
    W.nhan({ chiThay: true }); W.nhan({ tach: tepGia() })
    W.lay().tg!.khung = (x: Float32Array) => { for (let i = 0; i < x.length; i++) x[i]! *= 0.01; return x }
    W.nhan({ thayNoi: true })
    for (let k = 0; k < 100; k++) khung(giong(k))
    W.nhan({ thayNoi: false }); khung(giong(100)); W.nhan({ thayNoi: true }) // ngắt quãng ⇒ đếm lại từ đầu
    for (let k = 101; k < 240; k++) khung(giong(k))
    expect(tin.some((t) => t.tg === 'tu-tat')).toBe(false)
    for (let k = 240; k < 260; k++) khung(giong(k))
    expect(tin.find((t) => t.tg === 'tu-tat')).toMatchObject({ ly: 'cam-thay' })
    const x = giong(300); expect(Array.from(khung(x.slice()))).toEqual(Array.from(x))
  })

  it('(a) thầy đang nói và tiếng ra giữ giọng (chỉ hạ 6 dB) ⇒ không tự tắt', () => {
    const { W, tin, khung } = taoWorker()
    W.nhan({ chiThay: true }); W.nhan({ tach: tepGia() }); W.nhan({ thayNoi: true })
    W.lay().tg!.khung = (x: Float32Array) => { for (let i = 0; i < x.length; i++) x[i]! *= 0.5; return x }
    for (let k = 0; k < 300; k++) khung(giong(k))
    expect(tin.some((t) => t.tg === 'tu-tat')).toBe(false)
  })

  it('(b) khung ngừng chảy: mô hình đang chạy mà Worker im quá 2,5 giây ⇒ lớp gọi bắt được', () => {
    expect(xetNgungChay({ tg: 'chay', vaoLuc: 10_000 }, 0, 10_000 + NGUNG_CHAY_MS - 1)).toBe(false)
    expect(xetNgungChay({ tg: 'chay', vaoLuc: 10_000 }, 0, 10_000 + NGUNG_CHAY_MS + 1)).toBe(true)
    expect(xetNgungChay({ tg: 'tat', vaoLuc: 10_000 }, 0, 99_999)).toBe(false)
    expect(xetNgungChay({ tg: 'chay', vaoLuc: undefined }, 50_000, 50_000 + 1000)).toBe(false) // vừa bật, chưa có tin nào
  })

  it('mic im (thầy không nói) thì tiếng ra nhỏ KHÔNG bị coi là câm', () => {
    const { W, tin, khung } = taoWorker()
    W.nhan({ chiThay: true }); W.nhan({ tach: tepGia() })
    W.lay().tg!.khung = (x: Float32Array) => x.fill(0)
    for (let k = 0; k < 300; k++) khung(new Float32Array(480).fill(1e-4))
    expect(tin.some((t) => t.tg === 'tu-tat')).toBe(false)
  })

  it('chạy chậm (7 ms mỗi khung 10 ms ⇒ hệ số 0,7 > 0,6) ⇒ báo hệ số rồi tự tắt «cham»', () => {
    let t = 0, lan = 0
    const { W, tin, khung } = taoWorker(() => { lan++; t += lan % 2 ? 0 : 7; return t })
    W.nhan({ chiThay: true }); W.nhan({ tach: tepGia() })
    for (let k = 0; k < 205; k++) khung(giong(k))
    const rtf = tin.find((x) => typeof x.tgRtf === 'number')
    expect(rtf?.tgRtf as number).toBeGreaterThan(0.6)
    expect(tin.find((x) => x.tg === 'tu-tat')).toMatchObject({ ly: 'cham' }); expect(W.lay().pha).toBe(0)
  })

  it('tệp mô hình hỏng ⇒ báo «loi», tiếng đi thẳng', () => {
    const { W, tin, khung } = taoWorker()
    W.nhan({ chiThay: true }); W.nhan({ tach: new ArrayBuffer(32) })
    expect(tin.find((t) => t.tg === 'loi')).toBeTruthy()
    const x = giong(0); expect(Array.from(khung(x.slice()))).toEqual(Array.from(x))
  })
})

describe('cờ / công tắc lùi khẩn «Chỉ giọng thầy»', () => {
  const kho = new Map<string, string>()
  const ls = { getItem: (k: string) => kho.get(k) ?? null, setItem: (k: string, v: string) => void kho.set(k, v), removeItem: (k: string) => void kho.delete(k) }
  afterEach(() => { kho.clear(); delete (globalThis as { localStorage?: unknown }).localStorage })
  it('mặc định ẨN (chưa phát hành); cờ «hien» + có địa chỉ mô hình mới hiện; «tat» = lùi khẩn, không hiện, không tải', async () => {
    ;(globalThis as { localStorage?: unknown }).localStorage = ls
    expect(chiThayCo()).toBe(false)
    kho.set('ddh.live.chi-thay', 'hien'); expect(chiThayCo()).toBe(false) // chưa có địa chỉ
    kho.set('ddh.live.chi-thay-url', 'https://vi-du.invalid/m.tgt'); expect(chiThayCo()).toBe(true)
    let goi = 0
    const b = await taiMoHinhThay((async () => { goi++; return new Response(new Uint8Array(64)) }) as unknown as typeof fetch)
    expect(b?.byteLength).toBe(64); expect(goi).toBe(1)
    kho.set('ddh.live.chi-thay', 'tat'); expect(chiThayTatKhan()).toBe(true); expect(chiThayCo()).toBe(false)
  })
})
