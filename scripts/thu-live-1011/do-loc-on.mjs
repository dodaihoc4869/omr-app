#!/usr/bin/env node
// ĐO BỘ LỌC ỒN CHO TIẾNG LIVE (thầy 11/11: «lọc ồn chưa ngon … để giọng thầy và hs trong sáng nhất») — chạy NGOẠI TUYẾN trong Node, đúng tệp wasm app dùng.
//   node scripts/thu-live-1011/do-loc-on.mjs [rnnoise.wasm = src/lib/live/loc-on/rnnoise.wasm] [tệp số đo = docs/ban-ve-live-1011/so-do-loc-on-1111.json]
// Tín hiệu TỔNG HỢP 48 kHz (không có giọng người thật / lớp học thật): giọng nam (f0 105–150 Hz) và giọng nữ / trẻ (f0 220–320 Hz) trộn với ba loại ồn —
// quạt / điều hoà (ồn hồng + ù 100 Hz, đều), xôn xao (8 giọng nhỏ chồng nhau), gõ bút / bàn phím (xung 2–6 ms) — ở tỉ số tín / ồn 0 / 10 / 20 dB.
// Đo: giảm ồn ở đoạn im (dB) · SI-SDR so với giọng sạch (dB) và mức cải thiện · giọng sạch đi qua bộ lọc còn giữ bao nhiêu (SI-SDR, dải tần tới −3 dB) ·
// «tiếng nước» = độ lệch chuẩn theo thời gian của ồn dư từng băng (dB) · trễ thêm (ms) · thời gian xử lý mỗi khung 10 ms.
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const GOC = resolve(import.meta.dirname, '../..')
const WASM = resolve(process.argv[2] ?? join(GOC, 'src/lib/live/loc-on/rnnoise.wasm'))
const RA = resolve(process.argv[3] ?? join(GOC, 'docs/ban-ve-live-1011/so-do-loc-on-1111.json'))
const HZ = 48000, K = 480, GIAY = 14

// ── RNNoise (wasm thô, không lớp keo) ──
function taoRnnoise() {
  let bo
  const kq = new WebAssembly.Instance(new WebAssembly.Module(readFileSync(WASM)), { env: { emscripten_memcpy_big: (d, s, n) => { new Uint8Array(bo.buffer).copyWithin(d, s, s + n) } /* KHÔNG trả mảng về wasm: đổi cả mảng 16 MB ra số mất ≈ 1 giây mỗi lần gọi */, emscripten_resize_heap: () => 0, __assert_fail: () => { throw new Error('rnnoise') } } })
  const x = kq.exports
  bo = x.memory
  x.emscripten_stack_init?.(); x.__wasm_call_ctors?.()
  const st = x.rnnoise_create(0), pv = x.malloc(K * 4), pr = x.malloc(K * 4)
  return (khung) => { const f = new Float32Array(bo.buffer, pv, K); for (let i = 0; i < K; i++) f[i] = khung[i] * 32768 + (Math.random() - 0.5) * 0.1 /* rung ≈ −116 dBFS: số 0 tuyệt đối làm bộ lọc chạy số siêu nhỏ, chậm đi */; x.rnnoise_process_frame(st, pr, pv); const r = new Float32Array(bo.buffer, pr, K), y = new Float32Array(K); for (let i = 0; i < K; i++) y[i] = r[i] / 32768; return y }
}
/** Chạy cả tín hiệu qua bộ lọc; `kho` = phần giọng gốc trộn lại (0 = lọc hết cỡ). Trả đầu ra + thời gian mỗi khung (ms). */
function loc(x, kho) {
  const f = taoRnnoise(), y = new Float32Array(x.length)
  const t0 = process.hrtime.bigint()
  for (let d = 0; d + K <= x.length; d += K) y.set(f(x.subarray(d, d + K)), d)
  const ms = Number(process.hrtime.bigint() - t0) / 1e6 / Math.floor(x.length / K)
  return { y, ms, kho }
}

// ── Tín hiệu ──
let hat = 777
const rnd = () => { hat = (hat * 1103515245 + 12345) & 0x7fffffff; return hat / 0x7fffffff }
const coHuong = (f, q) => { const w = (2 * Math.PI * f) / HZ, al = Math.sin(w) / (2 * q), a0 = 1 + al; return { b0: al / a0, b2: -al / a0, a1: (-2 * Math.cos(w)) / a0, a2: (1 - al) / a0, x1: 0, x2: 0, y1: 0, y2: 0 } }
const chay = (c, x) => { const y = c.b0 * x + c.b2 * c.x2 - c.a1 * c.y1 - c.a2 * c.y2; c.x2 = c.x1; c.x1 = x; c.y2 = c.y1; c.y1 = y; return y }
const NGUYEN_AM = [[730, 1090, 2440], [270, 2290, 3010], [300, 870, 2240], [530, 1840, 2480], [570, 840, 2410], [440, 1020, 2240]]
/** Giọng tổng hợp: nguồn răng cưa + 3 cộng hưởng + âm xát; `f0`, `tiLe` (cộng hưởng cao hơn ở giọng nữ / trẻ); cứ 6 âm tiết nghỉ 0,8 giây. Trả mẫu + cờ «đang nói» từng mẫu. */
function giong(f0Tu, f0Den, tiLe, giay = GIAY, nghi = 0.8) {
  const n = HZ * giay, m = new Float32Array(n), noi = new Uint8Array(n)
  let i = Math.round(0.9 * HZ), dem = 0
  while (i < n - HZ * (nghi + 0.5)) {
    if (dem % 3 === 2) { const d = Math.round((0.06 + rnd() * 0.05) * HZ), cao = coHuong(5500, 1.2); for (let k = 0; k < d && i + k < n; k++) { m[i + k] += chay(cao, rnd() * 2 - 1) * 0.5 * Math.sin((Math.PI * k) / d); noi[i + k] = 1 } i += d }
    const d = Math.round((0.16 + rnd() * 0.1) * HZ), va = NGUYEN_AM[Math.floor(rnd() * NGUYEN_AM.length)], f0 = f0Tu + rnd() * (f0Den - f0Tu), luot = 0.85 + rnd() * 0.3
    const ch = [coHuong(va[0] * tiLe, 6), coHuong(va[1] * tiLe, 9), coHuong(va[2] * tiLe, 10)], manh = 0.6 + rnd() * 0.4
    let pha = 0
    for (let k = 0; k < d && i + k < n; k++) { pha += (f0 * (1 + (luot - 1) * (k / d))) / HZ; const cua = 2 * (pha - Math.floor(pha + 0.5)), bao = Math.sin((Math.PI * k) / d) ** 0.7; m[i + k] += (chay(ch[0], cua) + 0.6 * chay(ch[1], cua) + 0.35 * chay(ch[2], cua) + 0.12 * cua) * bao * manh; noi[i + k] = 1 }
    i += d + Math.round((0.04 + rnd() * 0.05) * HZ); dem += 1
    if (dem % 6 === 0) i += Math.round(nghi * HZ)
  }
  return { m, noi }
}
const rms = (m, chon) => { let e = 0, c = 0; for (let i = 0; i < m.length; i++) if (!chon || chon[i]) { e += m[i] * m[i]; c++ } return Math.sqrt(e / Math.max(1, c)) }
const nhan = (m, k) => { const r = new Float32Array(m.length); for (let i = 0; i < m.length; i++) r[i] = m[i] * k; return r }
function onQuat() { const n = HZ * GIAY, m = new Float32Array(n); let b0 = 0, b1 = 0, b2 = 0; for (let i = 0; i < n; i++) { const w = rnd() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; m[i] = b0 + b1 + b2 + w * 0.1848 + 0.6 * Math.sin((2 * Math.PI * 100 * i) / HZ) + 0.25 * Math.sin((2 * Math.PI * 200 * i) / HZ) } return m }
function onXonXao() { const m = new Float32Array(HZ * GIAY); for (let v = 0; v < 8; v++) { const g = giong(100 + rnd() * 180, 160 + rnd() * 180, 0.9 + rnd() * 0.3, GIAY, 0.15).m, lech = Math.floor(rnd() * HZ); for (let i = 0; i < m.length; i++) m[i] += g[(i + lech) % g.length] } return m }
function onGo() { const n = HZ * GIAY, m = new Float32Array(n); let i = Math.round(0.3 * HZ); while (i < n - 2000) { const d = Math.round((0.002 + rnd() * 0.004) * HZ), c = coHuong(1800 + rnd() * 3000, 1.5), a = 0.5 + rnd() * 0.5; for (let k = 0; k < d * 6 && i + k < n; k++) m[i + k] += chay(c, k < d ? rnd() * 2 - 1 : 0) * a; i += Math.round((0.15 + rnd() * 0.45) * HZ) } return m }

// ── Số đo ──
const db = (v) => 10 * Math.log10(Math.max(1e-30, v))
/** SI-SDR của `y` so với giọng sạch `s` (đã khớp trễ `tre` mẫu). */
function siSdr(y, s, tre) { let ss = 0, sy = 0; const n = Math.min(s.length, y.length - tre); for (let i = 0; i < n; i++) { ss += s[i] * s[i]; sy += s[i] * y[i + tre] } const a = sy / ss; let e = 0; for (let i = 0; i < n; i++) { const d = y[i + tre] - a * s[i]; e += d * d } return db((a * a * ss) / e) }
function timTre(y, s) { let lon = -1e99, tre = 0; for (let lag = 0; lag <= 2400; lag++) { let c = 0; for (let i = HZ; i < HZ * 4; i += 3) c += s[i] * y[i + lag]; if (c > lon) { lon = c; tre = lag } } return tre }
/** Năng lượng từng băng (24 băng trên thang log 100 Hz – 12 kHz) của một khung 1024 mẫu — biến đổi Fourier thẳng trên vài tần số mỗi băng là đủ cho «tiếng nước». */
function bang(m, d) { const r = []; for (let b = 0; b < 24; b++) { const f = 100 * Math.pow(120, (b + 0.5) / 24), w = (2 * Math.PI * f) / HZ; let re = 0, im = 0; for (let i = 0; i < 1024; i++) { const v = m[d + i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / 1023)); re += v * Math.cos(w * i); im -= v * Math.sin(w * i) } r.push(re * re + im * im) } return r }
/** «Tiếng nước»: trong các đoạn im, độ lệch chuẩn theo thời gian (dB) của năng lượng từng băng, trung bình các băng. Ồn đều ⇒ nhỏ; ồn dư lập loè ⇒ lớn. */
function tiengNuoc(y, noi, tre) { const ds = []; for (let d = HZ; d + 1024 + tre < y.length; d += 2048) { let im = true; for (let i = -4800; i < 1024 + 4800; i += 240) if (noi[d + i]) { im = false; break } if (im) ds.push(bang(y, d + tre).map((v) => db(v))) } if (ds.length < 4) return null; let tong = 0; for (let b = 0; b < 24; b++) { const a = ds.map((x) => x[b]), tb = a.reduce((s, v) => s + v, 0) / a.length; tong += Math.sqrt(a.reduce((s, v) => s + (v - tb) ** 2, 0) / a.length) } return tong / 24 }
/** Ồn ở đoạn im (xa tiếng nói ≥ 100 ms). */
function onIm(y, noi, tre) { const xa = new Uint8Array(noi.length); for (let i = 4800; i < noi.length - 4800; i += 480) { let im = 1; for (let j = -4800; j <= 4800; j += 480) if (noi[i + j]) { im = 0; break } if (im) xa.fill(1, i, i + 480) } let e = 0, c = 0; for (let i = HZ; i + tre < y.length; i++) if (xa[i]) { e += y[i + tre] ** 2; c++ } return e / Math.max(1, c) }
/** Dải tần còn lại của giọng sạch sau lọc: tần số cao nhất mà phổ dài hạn còn trong −3 dB so với trước lọc. */
function daiTan(y, s, tre) { let tren = 0; for (let b = 0; b < 40; b++) { const f = 200 * Math.pow(100, b / 39), w = (2 * Math.PI * f) / HZ; const nl = (m, lech) => { let t = 0; for (let d = HZ; d + 2048 + lech < m.length; d += 9600) { let re = 0, im = 0; for (let i = 0; i < 2048; i++) { re += m[d + lech + i] * Math.cos(w * i); im -= m[d + lech + i] * Math.sin(w * i) } t += re * re + im * im } return t }; if (db(nl(y, tre) / nl(s, 0)) > -3) tren = f } return Math.round(tren) }

const r1 = (v) => (v == null ? null : Math.round(v * 10) / 10)
const GIONG = { 'giọng nam': giong(105, 150, 1), 'giọng nữ / trẻ': giong(220, 320, 1.17) }
const ON = { 'quạt / điều hoà': onQuat(), 'xôn xao lớp học': onXonXao(), 'gõ bút / bàn phím': onGo() }
const MUC = { 'không lọc': null, 'Vừa (giữ 25 % nền)': 0.25, 'Mạnh (giữ 6 % nền)': 0.06, 'lọc hết cỡ (0 % nền)': 0 }
const ra = { luc: new Date().toISOString(), wasm: WASM.replace(GOC + '/', ''), ghiChu: 'Ngoại tuyến trong Node, tín hiệu tổng hợp 48 kHz; RNNoise khung 480 mẫu. Trộn: đầu ra = lọc × (1 − kho) + gốc (đã lùi cho khớp trễ) × kho.', sach: {}, on: [] }

// (1) giọng SẠCH đi qua bộ lọc: bộ lọc làm hỏng giọng bao nhiêu
let TRE = 0, msKhung = 0
for (const [ten, g] of Object.entries(GIONG)) {
  const s = nhan(g.m, 0.1 / rms(g.m, g.noi)), k = loc(s, 0)
  TRE = timTre(k.y, s); msKhung = k.ms
  const hang = { giong: ten, treMau: TRE, treMs: r1(TRE / 48) }
  for (const [tm, kho] of Object.entries(MUC)) { if (kho == null) continue; const y = new Float32Array(s.length); for (let i = TRE; i < s.length; i++) y[i] = k.y[i] * (1 - kho) + s[i - TRE] * kho; hang[tm] = { siSdr: r1(siSdr(y, s, TRE)), den3dBHz: daiTan(y, s, TRE) } }
  ra.sach[ten] = hang
  console.log(`Giọng sạch · ${ten}: trễ ${hang.treMs} ms · ` + Object.entries(MUC).filter(([, v]) => v != null).map(([tm]) => `${tm}: SI-SDR ${hang[tm].siSdr} dB, còn tới ${hang[tm].den3dBHz} Hz`).join(' · '))
}
ra.msMoiKhung = Math.round(msKhung * 1000) / 1000
ra.cpuPhanTram = r1((msKhung / 10) * 100)
console.log(`Xử lý: ${ra.msMoiKhung} ms mỗi khung 10 ms = ${ra.cpuPhanTram} % một lõi (máy này); CPU ×4: ${r1(ra.cpuPhanTram * 4)} %`)

// (2) giọng + ồn
for (const [tg, g] of Object.entries(GIONG)) for (const [to, o] of Object.entries(ON)) for (const snr of [0, 10, 20]) {
  const s = nhan(g.m, 0.1 / rms(g.m, g.noi)), n = nhan(o, (0.1 / Math.pow(10, snr / 20)) / rms(o)), x = new Float32Array(s.length)
  for (let i = 0; i < x.length; i++) x[i] = s[i] + n[i]
  const k = loc(x, 0), hang = { giong: tg, on: to, snr }
  const on0 = onIm(x, g.noi, 0), sdr0 = siSdr(x, s, 0), nuoc0 = tiengNuoc(x, g.noi, 0)
  for (const [tm, kho] of Object.entries(MUC)) {
    if (kho == null) { hang[tm] = { giamOn: 0, siSdr: r1(sdr0), tiengNuoc: r1(nuoc0) }; continue }
    const y = new Float32Array(x.length); for (let i = TRE; i < x.length; i++) y[i] = k.y[i] * (1 - kho) + x[i - TRE] * kho
    hang[tm] = { giamOn: r1(db(on0 / onIm(y, g.noi, TRE))), siSdr: r1(siSdr(y, s, TRE)), hon: r1(siSdr(y, s, TRE) - sdr0), tiengNuoc: r1(tiengNuoc(y, g.noi, TRE)) }
  }
  ra.on.push(hang)
  console.log(`${tg} + ${to} @ ${snr} dB: ` + Object.entries(MUC).map(([tm]) => `${tm.split(' ')[0]} giảm ồn ${hang[tm].giamOn} · SI-SDR ${hang[tm].siSdr} · nước ${hang[tm].tiengNuoc}`).join(' | '))
}
writeFileSync(RA, JSON.stringify(ra, null, 1) + '\n')
console.log(`\nĐã ghi ${RA}`)
