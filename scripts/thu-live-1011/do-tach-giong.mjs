#!/usr/bin/env node
// ĐO «CHỈ GIỌNG THẦY» (tách giọng theo người nói, 11/11 tối) — NGOẠI TUYẾN trong Node: chuỗi Worker cổng (MA_CONG, tach-giong/ma-cong.mjs) + chuỗi Worker
// nhận giọng (MA_NHAN, tach-giong/ma-nhan.mjs) + ONNX Runtime Web (wasm, 1 luồng — đúng cách trình duyệt sẽ chạy). KẾT LUẬN: không phát hành (docs/do-live-1011.md mục 10).
//   LV_MAU=<thư mục> LV_TG=<thư mục> node scripts/thu-live-1011/do-tach-giong.mjs [tệp số đo = docs/ban-ve-live-1011/so-do-tach-giong-1111.json]
//   LV_TG (KHÔNG đưa vào kho, 40 MB): `npm i onnxruntime-web@1.20.1` ở thư mục tạm rồi chép dist/ort.wasm.min.mjs, dist/ort-wasm-simd-threaded.mjs,
//         dist/ort-wasm-simd-threaded.wasm + tệp `wespeaker_en_voxceleb_CAM++.onnx` (bản phát hành «speaker-recongition-models» của sherpa-onnx, k2-fsa;
//         mô hình WeSpeaker VoxCeleb, CC BY 4.0) vào cùng một thư mục.
//   (mẫu tiếng thật do `tai-mau-loc-on.mjs` tải: giong-nam = «giọng thầy», xon-xao-2 (nam) / giong-nu (nữ) = «học sinh nói gần mic», xon-xao-1..5 = xôn xao)
// Cảnh 18 giây (48 kHz, nền ồn −65 dBFS): thầy nói một mình · người khác nói một mình · NÓI CHỒNG · người khác nói một mình · thầy nói NGAY sau người khác
// (khoảng hở 150 ms). Mẫu giọng: 5 giây đầu của giong-nam; phần thầy trong cảnh lấy từ 5,6 giây còn lại (không trùng mẫu).
// Ba cách: «Chuẩn trình duyệt» (ngoại tuyến không chạy được bộ lọc WebRTC ⇒ coi như đi thẳng: lọc ồn trình duyệt không xoá giọng nói) · «Mạnh» (RNNoise
// của chuỗi khung, tham số THAM_LOC_ON.manh) · «Chỉ giọng thầy» (cổng; bộ nhận giọng chạy THẬT, điểm chỉ áp dụng sau đúng số ms suy luận đo được).
// Đo: giọng khác giảm (dB, đoạn chỉ có người khác + đoạn nói chồng) · giọng thầy giữ (SI-SDR so với tiếng vào, % khung bị hạ > 3 dB, dải tới −3 dB) ·
// thầy nói ngay sau người khác: bao lâu mới mở · trễ thêm (ms) · CPU (ms / cửa sổ, hệ số thời gian thực).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { docWav } from '../thu-live-dot0-1011/giong.mjs'

const GOC = resolve(import.meta.dirname, '../..')
const RA = resolve(process.argv[2] ?? join(GOC, 'docs/ban-ve-live-1011/so-do-tach-giong-1111.json'))
const MAU = resolve(process.env.LV_MAU ?? '')
if (!process.env.LV_MAU || !existsSync(join(MAU, 'giong-nam.wav'))) { console.log('Thiếu LV_MAU (chạy tai-mau-loc-on.mjs trước).'); process.exit(1) }
const HZ = 48000, K = 480
import { MA_CONG } from './tach-giong/ma-cong.mjs'
import { MA_NHAN } from './tach-giong/ma-nhan.mjs'
const chuoi = (tep, ten) => new RegExp(`(?:export )?const ${ten} = \`([\\s\\S]*?)\``).exec(readFileSync(join(GOC, tep), 'utf8'))[1]
const taoMaCong = () => new Function('postMessage', MA_CONG + '\nreturn { taoCong: taoCong, taoHa: taoHa };')(() => {})
const taoMaNhan = () => new Function(MA_NHAN + '\nreturn { datPhien: datPhien, nhung: nhung, nhanKhoi: nhanKhoi, cos: cos, chuan: chuan, hoSo: function (h) { hoSo = h; }, ban: function (b) { ban = b; } };')()
const MA_KHUNG = chuoi('src/lib/live/chuoi-tieng.ts', 'MA_KHUNG')
const MA_TACH = chuoi('src/lib/live/tach-giong-thay.ts', 'MA_TACH')
const THAM = new Function('return ' + /THAM_LOC_ON:[^=]*= (\{.*\})\s*$/m.exec(readFileSync(join(GOC, 'src/lib/live/chuoi-tieng.ts'), 'utf8'))[1])()

// ── ONNX Runtime Web + mô hình (LV_TG) ──
if (!process.env.LV_TG) { console.log('Thiếu LV_TG (xem phần đầu tệp).'); process.exit(1) }
const PT = resolve(process.env.LV_TG)
const ort = await import(pathToFileURL(join(PT, 'ort.wasm.min.mjs')).href)
ort.env.wasm.wasmPaths = { mjs: pathToFileURL(join(PT, 'ort-wasm-simd-threaded.mjs')).href }
ort.env.wasm.wasmBinary = readFileSync(join(PT, 'ort-wasm-simd-threaded.wasm'))
const moHinh = readFileSync(join(PT, 'wespeaker_en_voxceleb_CAM++.onnx'))
// Số đo LẶP LẠI ĐƯỢC: ồn nền từ bộ sinh số giả có hạt cố định; điểm của bộ nhận giọng áp dụng sau đúng TRE_QD ms (cỡ thời gian suy luận đo được),
// bộ nhận giọng bận đúng chừng ấy (lượt tới trong lúc bận thì bỏ) — thời gian suy luận THẬT vẫn đo riêng cho cột CPU.
const TRE_QD = 50
let hat = 12345
const ngauNhien = () => { hat = (hat * 1103515245 + 12345) >>> 0; return hat / 4294967296 }

const doc = (t) => { const w = docWav(readFileSync(t.includes('/') ? t : join(MAU, `${t}.wav`))); if (w.hz !== HZ) throw new Error(`${t}: ${w.hz} Hz`); return w.kenh[0] }
const rmsHoatDong = (x) => { let e = 0, n = 0; for (let i = 0; i + K <= x.length; i += K) { let f = 0; for (let j = 0; j < K; j++) f += x[i + j] ** 2; if (f / K > 1e-6) { e += f; n += K } } return Math.sqrt(e / Math.max(1, n)) }
const datMuc = (x, db) => { const r = rmsHoatDong(x), k = 10 ** (db / 20) / r; return x.map((v) => v * k) }
const ha16 = (x) => { const h = taoMaCong().taoHa(HZ), o = []; h(x, x.length, o); return Float32Array.from(o) }

// ── mẫu giọng thầy: 5 giây đầu ⇒ cửa sổ 1,5 s bước 0,75 s ⇒ trung bình (đúng cách mau-giong.ts làm) ──
// LƯỢT 2 (mục 11): LV_THAY = WAV 48 kHz giọng THẦY THẬT giữ riêng (không dùng luyện; trích từ «Xem lại Live», KHÔNG vào kho) — bắt buộc khi đo mô hình
// riêng giọng thầy (mô hình coi giọng nam mẫu là «người khác»). LV_KHAC = WAV 48 kHz giọng khác THẬT giữ riêng (thêm hàng «khac-that»).
// LV_MH = tệp .tgt (mô hình, src/lib/live/tach-giong-thay.ts) ⇒ thêm cách «mo-hinh». LV_SNR = danh sách mức (mặc định 0,2,10 — 2 dB = mức đo thật mục 11.1).
const thay = doc(process.env.LV_THAY || 'giong-nam'), CAT = 5 * HZ
const N0 = taoMaNhan(); await N0.datPhien(ort, moHinh)
async function hocMau(x16) { const e = []; for (let i = 0; i + 24000 <= x16.length; i += 12000) { const v = await N0.nhung(x16.subarray(i, i + 24000)); if (v) e.push(v) } const t = new Float32Array(e[0].length); for (const v of e) for (let i = 0; i < t.length; i++) t[i] += v[i]; return { tam: N0.chuan(t), n: e.length } }
const mau = await hocMau(ha16(datMuc(thay.subarray(0, CAT), -25)))

// ── dựng cảnh ──
function canh(khac, snr) {
  const T = datMuc(thay.subarray(CAT), -25), O = datMuc(khac, -25 - snr)
  const s = (g) => Math.round(g * HZ), dai = s(18.2)
  const tT = new Float32Array(dai), tO = new Float32Array(dai), nhan = new Uint8Array(Math.ceil(dai / K)) // 1 thầy · 2 khác · 3 chồng · 4 thầy sau khác
  const dat = (dich, nguon, tu, tuNguon, dai2) => { for (let i = 0; i < dai2 && tu + i < dich.length && tuNguon + i < nguon.length; i++) dich[tu + i] = nguon[tuNguon + i] }
  const nT = T.length, a = Math.floor(nT / 2)
  dat(tT, T, s(0.3), 0, a)                       // [0,3; 3,1) thầy một mình
  dat(tO, O, s(3.6), 0, s(3))                    // [3,6; 6,6) khác một mình
  dat(tT, T, s(7.1), a, nT - a); dat(tO, O, s(7.1), s(3) % O.length, nT - a) // [7,1; 9,9) chồng
  dat(tO, O, s(10.4), s(0.5), s(3.5))            // [10,4; 13,9) khác một mình
  dat(tT, T, s(14.05), 0, a)                     // [14,05; …) thầy NGAY sau khác (hở 150 ms)
  for (let k = 0; k < nhan.length; k++) { const t = (k * K) / HZ; nhan[k] = t >= 0.3 && t < 3.1 ? 1 : t >= 3.6 && t < 6.6 ? 2 : t >= 7.1 && t < 9.9 ? 3 : t >= 10.4 && t < 13.9 ? 2 : t >= 14.05 && t < 16.8 ? 4 : 0 }
  const on = new Float32Array(dai); for (let i = 0; i < dai; i++) on[i] = (ngauNhien() * 2 - 1) * 10 ** (-65 / 20) * Math.sqrt(3)
  const vao = new Float32Array(dai); for (let i = 0; i < dai; i++) vao[i] = tT[i] + tO[i] + on[i]
  return { vao, tT, tO, on, nhan }
}

// ── ba cách xử lý (mỗi cách trả tín hiệu ra + hệ số cổng nếu có) ──
const dongTg = []; let NHAN_HT = null
async function chayCong(vao) {
  const MC = taoMaCong(), cong = MC.taoCong(), ha = MC.taoHa(HZ), NN = taoMaNhan()
  await NN.datPhien(ort, moHinh); NN.hoSo(mau.tam)
  const ra = new Float32Array(vao.length), g = new Float32Array(Math.ceil(vao.length / K)), cho = []
  let gom = [], co = [], dau = false, banToi = -1, msTong = 0, lan = 0, usCong = 0
  for (let k = 0; k * K < vao.length; k++) {
    const x = vao.slice(k * K, k * K + K), n = x.length, t = ((k + 1) * K * 1000) / HZ
    while (cho.length && cho[0].luc <= t) cong.quyet(cho.shift().kq)
    ha(x, n, gom); co.push(cong.s.noi ? 1 : 0); if (cong.s.dauNhan) dau = true
    if (co.length >= 10) {
      NN.ban(t < banToi)
      const t0 = performance.now(), kq = await NN.nhanKhoi({ x: Float32Array.from(gom), v: Uint8Array.from(co), dau, t })
      const ms = performance.now() - t0
      dongTg.length = process.env.LV_DONG && k < 10 ? 0 : dongTg.length
      if (kq) { msTong += ms; lan++; banToi = t + TRE_QD; cho.push({ luc: t + TRE_QD, kq }); if (process.env.LV_DONG) dongTg.push(`qd ${t.toFixed(0)} s=${kq.s.toFixed(2)} n=${kq.n.toFixed(2)}`) }
      gom = []; co = []; dau = false
    }
    const u0 = performance.now(); g[k] = cong.buoc(x, n, HZ, t); usCong += (performance.now() - u0) * 1000
    ra.set(x, k * K)
    if (process.env.LV_DONG && k % 5 === 0) dongTg.push(`${t.toFixed(0)} ${NHAN_HT ? NHAN_HT[k] : ''} g=${g[k].toFixed(2)} ${cong.s.dich}/${cong.s.lienKhac} nen=${cong.s.nen.toFixed(0)} L=${cong.s.lNgan.toFixed(0)} mt=${cong.s.mucThay?.toFixed(0)} mk=${cong.s.mucKhac.toFixed(0)}`)
  }
  return { ra, g, msCuaSo: msTong / Math.max(1, lan), rtf: msTong / ((vao.length / HZ) * 1000), usKhung: usCong / g.length, bv: cong.s.bv }
}
async function chayManh(vao) {
  const RN = readFileSync(join(GOC, 'src/lib/live/loc-on/rnnoise.wasm'))
  const L = new Function('postMessage', MA_KHUNG + '\nreturn { napLoc: napLoc, locOn: locOn, dat: function (t) { thDich = t; } };')(() => {})
  L.napLoc(RN.buffer.slice(RN.byteOffset, RN.byteOffset + RN.byteLength)); L.dat(THAM.manh)
  const ra = new Float32Array(vao.length)
  for (let k = 0; (k + 1) * K <= vao.length; k++) { const x = vao.slice(k * K, k * K + K); L.locOn(x); ra.set(x, k * K) }
  return { ra, tre: K } // locOn lùi tiếng 10 ms
}

async function chayMoHinh(vao, tT, tO) {
  const L = new Function(MA_TACH + '\nreturn { docMoHinh: docMoHinh, taoTach: taoTach, taoFft: taoFft };')()
  const b = readFileSync(process.env.LV_MH), w = L.docMoHinh(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength))
  const T = L.taoTach(w, HZ), bT = T.bong(), bO = T.bong()
  const ra = new Float32Array(vao.length), rT = new Float32Array(vao.length), rO = new Float32Array(vao.length), nK = Math.floor(vao.length / K)
  let ms = 0
  const gCao = new Float32Array(nK)
  for (let k = 0; k < nK; k++) {
    const x = vao.slice(k * K, k * K + K), t0 = performance.now(), G = T.khung(x); ms += performance.now() - t0
    gCao[k] = G[480]
    ra.set(x, k * K)
    const a = tT.slice(k * K, k * K + K); bT(a, G); rT.set(a, k * K)
    const c = tO.slice(k * K, k * K + K); bO(c, G); rO.set(c, k * K)
  }
  // g[k] = hệ số THẬT trên phần giọng thầy của khung k (ra chậm đúng K mẫu): căn bậc hai năng lượng ra / vào
  const g = new Float32Array(nK)
  for (let k = 0; k + 1 < nK; k++) { let a = 0, c = 0; for (let j = 0; j < K; j++) { a += tT[k * K + j] ** 2; c += rT[(k + 1) * K + j] ** 2 } g[k] = a > 1e-12 ? Math.sqrt(c / a) : 1 }
  // GIỮ DẢI của giọng thầy (đoạn thầy một mình, phần giọng thầy qua mặt nạ / vào): dB theo dải; dải 11–24 kHz = hệ số mô hình đặt cho dải cao lúc thầy nói
  const fft = L.taoFft(960), hann = Float64Array.from({ length: 960 }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / 960)), DAI = [[100, 1000], [1000, 3000], [3000, 6000], [6000, 11000]]
  const eV = DAI.map(() => 0), eR = DAI.map(() => 0), xr = new Float64Array(960), xi = new Float64Array(960), yr = new Float64Array(960), yi = new Float64Array(960)
  let cao = 0, nCao = 0
  for (let k = 0; k + 2 < nK; k++) {
    if (NHAN_HT[k] !== 1 || NHAN_HT[k + 1] !== 1) continue
    for (const [src, e, tre] of [[tT, eV, 0], [rT, eR, K]]) {
      for (let i = 0; i < 960; i++) { xr[i] = (src[k * K + tre + i] ?? 0) * hann[i]; xi[i] = 0 }
      fft(xr, xi, yr, yi)
      DAI.forEach(([a, b], j) => { for (let f = Math.ceil(a / 50); f < b / 50; f++) e[j] += yr[f] ** 2 + yi[f] ** 2 })
    }
    let el = 0; for (let j = 0; j < K; j++) el += tT[k * K + j] ** 2
    if (el / K > 1e-5) { cao += gCao[k]; nCao++ }
  }
  const giuDai = Object.fromEntries(DAI.map(([a, b], j) => [`${a / 1000}-${b / 1000}kHz`, +(10 * Math.log10(eR[j] / Math.max(eV[j], 1e-20))).toFixed(1)]))
  giuDai['11-24kHz'] = +(20 * Math.log10(Math.max(cao / Math.max(nCao, 1), 1e-6))).toFixed(1)
  return { ra, tre: K, g, rO, msCuaSo: ms / nK, rtf: ms / nK / 10, usKhung: (ms / nK) * 1000, ban: w.h.ban, giuDai }
}

// ── số đo ──
const db = (e) => 10 * Math.log10(Math.max(e, 1e-20))
function siSdr(ra, goc) { let a = 0, b = 0; for (let i = 0; i < goc.length; i++) { a += ra[i] * goc[i]; b += goc[i] * goc[i] } const k = a / b; let s = 0, n = 0; for (let i = 0; i < goc.length; i++) { const v = k * goc[i]; s += v * v; n += (ra[i] - v) ** 2 } return n > 0 ? db(s / n) : 99 }
const doan = (x, nhan, loai, tre = 0) => { const o = []; for (let k = 0; k < nhan.length; k++) if (nhan[k] === loai) for (let j = 0; j < K; j++) { const i = k * K + j + tre; if (i < x.length) o.push(x[i]) } return Float32Array.from(o) }
const nl = (x) => { let e = 0; for (const v of x) e += v * v; return e }
function daiTan(ra, vao) { // phổ trung bình 4096 điểm (DFT thô theo dải 1/3 octave) ⇒ tần số cao nhất còn ≥ −3 dB so với tiếng vào
  const N = 2048, dai = [], buoc = 2048
  const pho = (x) => { const p = new Float64Array(N / 2); for (let i = 0; i + N <= x.length; i += buoc) for (let f = 1; f < N / 2; f += 4) { let re = 0, im = 0; for (let j = 0; j < N; j += 2) { const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * j) / N), v = x[i + j] * w; re += v * Math.cos((2 * Math.PI * f * j) / N); im -= v * Math.sin((2 * Math.PI * f * j) / N) } p[f] += re * re + im * im } return p }
  const a = pho(ra), b = pho(vao)
  for (let f = 1; f < N / 2; f += 4) dai.push([(f * HZ) / N, db(a[f] / Math.max(b[f], 1e-20))])
  let tot = 0; for (const [hz, d] of dai) { if (d < -3 && b[Math.round((hz * N) / HZ)] > 1e-9) break; tot = hz }
  return Math.round(tot)
}
function moSau(g, nhan, tT) { let k0 = -1; for (let k = 0; k < nhan.length; k++) if (nhan[k] === 4) { let e = 0; for (let j = 0; j < K; j++) e += (tT[k * K + j] ?? 0) ** 2; if (db(e / K) > -45) { k0 = k; break } } if (k0 < 0) return null; for (let k = k0; k < nhan.length && nhan[k] === 4; k++) if (g[k] >= 0.7) return Math.round(((k - k0) * K * 1000) / HZ); return 9999 }

const BO = [['hs-nam', 'xon-xao-2'], ['hs-nu', 'giong-nu'], ...(process.env.LV_KHAC ? [['khac-that', process.env.LV_KHAC]] : [])]
const ketQua = { luc: new Date().toISOString(), mau: { giay: CAT / HZ, cuaSo: mau.n }, ca: [] }
for (const snr of (process.env.LV_SNR ?? '0,2,10').split(',').map(Number)) {
  const xx = ['xon-xao-1', 'xon-xao-2', 'xon-xao-3', 'xon-xao-4', 'xon-xao-5'].map(doc)
  const dai = Math.max(...xx.map((x) => x.length)), xon = new Float32Array(dai * 2)
  for (const x of xx) for (let i = 0; i < xon.length; i++) xon[i] += x[i % x.length]
  for (const [ten, khac] of [...BO.map(([t, f]) => [t, doc(f)]), ['xon-xao', xon]]) {
    const c = canh(khac, snr)
    NHAN_HT = c.nhan
    const cach = { 'chuan': { ra: c.vao, tre: 0 }, 'manh': await chayManh(c.vao), 'chi-thay': await chayCong(c.vao), ...(process.env.LV_MH ? { 'mo-hinh': await chayMoHinh(c.vao, c.tT, c.tO) } : {}) }
    for (const [ten2, r] of Object.entries(cach)) {
      const tre = r.tre ?? 0
      const khacGiam = db(nl(doan(c.vao, c.nhan, 2)) / nl(doan(r.ra, c.nhan, 2, tre)))
      const chongKhac = r.rO ? db(nl(doan(c.tO, c.nhan, 3)) / nl(doan(r.rO, c.nhan, 3, tre))) : r.g ? db(nl(doan(c.tO, c.nhan, 3)) / nl(doan(c.tO.map((v, i) => v * r.g[Math.floor(i / K)]), c.nhan, 3))) : null
      const tGiu = siSdr(doan(r.ra, c.nhan, 1, tre), doan(c.vao, c.nhan, 1))
      const chong = siSdr(doan(r.ra, c.nhan, 3, tre), doan(c.tT, c.nhan, 3)), chong0 = siSdr(doan(c.vao, c.nhan, 3), doan(c.tT, c.nhan, 3))
      let ha = 0, ha1 = 0, tong = 0; if (r.g) for (let k = 0; k < c.nhan.length; k++) if (c.nhan[k] === 1 || c.nhan[k] === 4) { let e = 0; for (let j = 0; j < K; j++) e += (c.tT[k * K + j] ?? 0) ** 2; if (e / K > 1e-6) { tong++; if (r.g[k] < 0.708) { ha++; if (c.nhan[k] === 1) ha1++ } } }
      const dong = { snr, khac: ten, cach: ten2, khacGiamDb: +khacGiam.toFixed(1), chongKhacGiamDb: chongKhac == null ? null : +chongKhac.toFixed(1), thayGiuSiSdr: +tGiu.toFixed(1), chongSiSdr: +chong.toFixed(1), chongSiSdr0: +chong0.toFixed(1),
        thayBiHaPt: r.g ? +((100 * ha) / Math.max(1, tong)).toFixed(1) : null, thayMotMinhBiHa: r.g ? ha1 : null, moSauKhacMs: r.g ? moSau(r.g, c.nhan, c.tT) : null, daiTanHz: daiTan(doan(r.ra, c.nhan, 1, tre), doan(c.vao, c.nhan, 1)), treMs: (tre * 1000) / HZ,
        msCuaSo: r.msCuaSo ? +r.msCuaSo.toFixed(1) : null, rtf: r.rtf ? +r.rtf.toFixed(3) : null, usKhung: r.usKhung ? +r.usKhung.toFixed(1) : null, bv: r.bv || null, ...(r.giuDai ? { giuDai: r.giuDai, ban: r.ban } : {}) }
      ketQua.ca.push(dong)
      console.log(JSON.stringify(dong))
      if (process.env.LV_DONG && ten2 === 'chi-thay' && `${snr}-${ten}` === (process.env.LV_CA ?? '0-hs-nam')) { writeFileSync(process.env.LV_DONG, dongTg.join('\n')); process.exit(0) }
    }
  }
}
mkdirSync(dirname(RA), { recursive: true })
writeFileSync(RA, JSON.stringify(ketQua, null, 1) + '\n')
console.log('Đã ghi', RA)
