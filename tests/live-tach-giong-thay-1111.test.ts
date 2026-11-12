// «CHỈ GIỌNG THẦY» lượt 2 — lõi chạy mô hình (src/lib/live/tach-giong-thay.ts, chuỗi ES5 cho Worker): FFT cỡ 960 đúng, STFT với hệ số 1 trả ĐÚNG tiếng vào
// chậm một khung (480 mẫu = 10 ms), đọc tệp .tgt, mạng chạy khớp bản tham chiếu viết thẳng ở đây, sàn hệ số giữ tiếng ra không bao giờ về 0.
import { describe, expect, it } from 'vitest'
import { MA_TACH } from '../src/lib/live/tach-giong-thay'

interface Tach { G: Float32Array; m: Float32Array; khung(x: Float32Array): Float32Array; bong(): (x: Float32Array, G: Float32Array) => void }
interface W { D: number; NB: number; h: Record<string, unknown> }
const L = new Function(MA_TACH + '\nreturn { docMoHinh: docMoHinh, taoTach: taoTach, taoFft: taoFft };')() as {
  docMoHinh(ab: ArrayBuffer): W
  taoTach(w: W, hz: number, san?: number): Tach
  taoFft(n: number): (xr: Float64Array, xi: Float64Array, yr: Float64Array, yi: Float64Array) => void
}

let hat = 7
const nn = (): number => { hat = (hat * 1103515245 + 12345) >>> 0; return hat / 4294967296 - 0.5 }

/** Tệp .tgt nhỏ, trọng số giả (D = 6, NB = 221). */
function tepGia(D = 6, NB = 221): { ab: ArrayBuffer; mang: Record<string, Float32Array> } {
  const ten: [string, number][] = [['MU', NB], ['SD', NB], ['Wi', NB * D], ['bi', D], ['g1x', D * 3 * D], ['g1h', D * 3 * D], ['g1b', 3 * D], ['g2x', D * 3 * D], ['g2h', D * 3 * D], ['g2b', 3 * D], ['Wo', D * NB], ['bo', NB]]
  const mang: Record<string, Float32Array> = {}
  for (const [t, n] of ten) mang[t] = Float32Array.from({ length: n }, () => (t === 'SD' ? 1 + Math.abs(nn()) : t === 'MU' ? -3 + nn() : nn() * 0.6))
  const js = new TextEncoder().encode(JSON.stringify({ ban: 'thu', ngay: '2026-11-11', D, NB, hiTu: 120 }))
  const dau = 8 + js.length, lech = (4 - (dau % 4)) % 4, tong = ten.reduce((s, [, n]) => s + n, 0)
  const ab = new ArrayBuffer(dau + lech + tong * 4), u8 = new Uint8Array(ab)
  u8.set([84, 71, 84, 49]); new DataView(ab).setUint32(4, js.length, true); u8.set(js, 8)
  const f = new Float32Array(ab, dau + lech); let o = 0
  for (const [t] of ten) { f.set(mang[t]!, o); o += mang[t]!.length }
  return { ab, mang }
}

describe('lõi «Chỉ giọng thầy»', () => {
  it('FFT 960 (2^6·3·5) khớp DFT thẳng', () => {
    const n = 960, fft = L.taoFft(n), xr = new Float64Array(n).map(nn), xi = new Float64Array(n).map(nn), yr = new Float64Array(n), yi = new Float64Array(n)
    fft(xr, xi, yr, yi)
    for (const k of [0, 1, 7, 50, 333, 480, 959]) {
      let a = 0, b = 0
      for (let j = 0; j < n; j++) { const t = (-2 * Math.PI * j * k) / n; a += xr[j]! * Math.cos(t) - xi[j]! * Math.sin(t); b += xr[j]! * Math.sin(t) + xi[j]! * Math.cos(t) }
      expect(Math.abs(yr[k]! - a)).toBeLessThan(1e-9); expect(Math.abs(yi[k]! - b)).toBeLessThan(1e-9)
    }
  })

  it('STFT hệ số 1 ⇒ tiếng ra = tiếng vào chậm đúng 480 mẫu (10 ms), không méo', () => {
    const { ab } = tepGia(), T = L.taoTach(L.docMoHinh(ab), 48000), bong = T.bong()
    const x = Float32Array.from({ length: 480 * 40 }, (_, i) => Math.sin(i * 0.05) * 0.3 + nn() * 0.1), y = new Float32Array(x.length), G = new Float32Array(481).fill(1)
    for (let k = 0; k < 40; k++) { const b = x.slice(k * 480, k * 480 + 480); bong(b, G); y.set(b, k * 480) }
    let sai = 0
    for (let i = 960; i < x.length; i++) sai = Math.max(sai, Math.abs(y[i]! - x[i - 480]!))
    expect(sai).toBeLessThan(1e-5)
  })

  it('mạng chạy khớp bản tham chiếu (24 kHz, cửa sổ 480) và tệp đọc đúng đầu mục', () => {
    const D = 6, NB = 221, { ab, mang: P } = tepGia(D, NB), w = L.docMoHinh(ab)
    expect(w.h.ban).toBe('thu')
    const T = L.taoTach(w, 24000, 0), N = 480, H = 240
    const win = Float64Array.from({ length: N }, (_, i) => Math.sqrt(0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N)))
    const x = Float32Array.from({ length: H * 12 }, () => nn() * 0.2), buf = new Float64Array(N)
    const sg = (v: number): number => 1 / (1 + Math.exp(-v))
    const nhan = (v: Float64Array, W: Float32Array, b: Float32Array | null, J: number): Float64Array => { const o = new Float64Array(J); for (let j = 0; j < J; j++) { let s = b ? b[j]! : 0; for (let i = 0; i < v.length; i++) s += v[i]! * W[i * J + j]!; o[j] = s } return o }
    const gru = (v: Float64Array, h: Float64Array, Wx: Float32Array, Wh: Float32Array, b: Float32Array): Float64Array => {
      const xt = nhan(v, Wx, b, 3 * D), hh = nhan(h, Wh, null, 3 * D)
      return Float64Array.from({ length: D }, (_, j) => { const z = sg(xt[j]! + hh[j]!), r = sg(xt[D + j]! + hh[D + j]!), n = Math.tanh(xt[2 * D + j]! + r * hh[2 * D + j]!); return (1 - z) * n + z * h[j]! })
    }
    let h1 = new Float64Array(D), h2 = new Float64Array(D), lech = 0
    for (let k = 0; k < 12; k++) {
      buf.copyWithin(0, H); for (let i = 0; i < H; i++) buf[H + i] = x[k * H + i]!
      const f = new Float64Array(NB)
      for (let b = 0; b < NB; b++) { let re = 0, im = 0; for (let j = 0; j < N; j++) { const t = (-2 * Math.PI * j * b) / N; re += buf[j]! * win[j]! * Math.cos(t); im += buf[j]! * win[j]! * Math.sin(t) } f[b] = (Math.log10(re * re + im * im + 1e-10) - P.MU![b]!) / P.SD![b]! }
      const a = nhan(f, P.Wi!, P.bi!, D).map(Math.tanh)
      h1 = gru(a, h1, P.g1x!, P.g1h!, P.g1b!); h2 = gru(h1, h2, P.g2x!, P.g2h!, P.g2b!)
      const m = nhan(h1.map((v, i) => v + h2[i]!), P.Wo!, P.bo!, NB).map(sg)
      T.khung(x.slice(k * H, k * H + H))
      for (let b = 0; b < NB; b++) lech = Math.max(lech, Math.abs(m[b]! - T.m[b]!))
    }
    expect(lech).toBeLessThan(1e-4)
  })

  it('sàn hệ số: mặt nạ về 0 thì tiếng ra vẫn còn ≥ −50 dB, dải trên 11 kHz theo trung bình 6–11 kHz', () => {
    const { ab, mang } = tepGia(); mang.bo!.fill(-40) // ép mặt nạ ≈ 0
    const T = L.taoTach(L.docMoHinh(ab.slice(0)), 48000)
    // bo nằm cuối tệp: sửa thẳng trong bản sao
    const ab2 = ab.slice(0), f = new Float32Array(ab2, ab2.byteLength - 221 * 4, 221); f.fill(-40)
    const T2 = L.taoTach(L.docMoHinh(ab2), 48000)
    const x = Float32Array.from({ length: 480 }, () => nn() * 0.3)
    T2.khung(x.slice()); const G = T2.khung(x.slice())
    for (let k = 0; k < 481; k++) expect(G[k]).toBeCloseTo(0.003, 6)
    expect(T.G.length).toBe(481)
  })
})
