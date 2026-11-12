#!/usr/bin/env node
// ĐO BỘ LỌC ỒN CHO TIẾNG LIVE — chạy NGOẠI TUYẾN trong Node bằng CHÍNH mã lọc của app (cắt chuỗi MA_LOC trong src/lib/live/loc-on/ma-loc.ts ra chạy,
// tham số lấy từ THAM_LOC_ON trong src/lib/live/chuoi-tieng.ts) + đúng tệp wasm app dùng (RNNoise; DeepFilterNet 3 ở public/loc-on/).
//   node scripts/thu-live-1011/do-loc-on.mjs [tệp số đo = docs/ban-ve-live-1011/so-do-loc-on-3-1111.json]
//   LV_MAU=<thư mục>   mẫu tiếng THẬT do `tai-mau-loc-on.mjs` tải về (giong-nam / giong-nu / giong-viet / xon-xao-1..5 / on-that .wav) ⇒ nhóm «that».
//                      Không có ⇒ chỉ nhóm giọng tổng hợp (DeepFilterNet 3 coi giọng tổng hợp là ồn và xoá — số nhóm ấy chỉ để so với lượt 2).
//   LV_CHI=<biểu thức> chỉ chạy bộ có tên khớp (thử nhanh).
//   LV_XUAT=<thư mục>  KHÔNG đo: ghi tín hiệu của nhóm giọng thật ra WAV (mỗi giọng một tệp nối các ca) cho do-loc-on-trinh-duyet.mjs thu qua Chromium.
//   LV_NS=<thư mục>    thư mục ấy sau khi Chromium đã thu ⇒ thêm bộ «lọc ồn của trình duyệt (WebRTC)» (và «mic trình duyệt không lọc» nếu có ra0-0.wav).
// Ồn: quạt / điều hoà (ồn hồng + ù 100 Hz, đều), xôn xao (8 giọng tổng hợp; và 8 lớp giọng người thật), gõ bút / bàn phím (xung 2–6 ms), xe ngoài đường
// (ầm trầm + xe lướt qua + còi), ồn thật (bản ghi) — ở tỉ số tín / ồn 0 / 10 / 20 dB.
// Đo: bớt ồn ở đoạn im (dB) · SI-SDR so với giọng sạch và mức cải thiện · «giữ phổ» (như SI-SDR nhưng chỉ so ĐỘ LỚN phổ, không kể pha) ·
// giọng sạch đi qua bộ lọc còn giữ bao nhiêu (SI-SDR, giữ phổ, dải tần tới −3 dB) ·
// trễ thêm (ms) · thời gian xử lý mỗi khung 10 ms (⇒ hệ số thời gian thực). MỤC TIÊU lượt 3 (mức Mạnh): đoạn im — ồn đều ≥ 30 dB, xôn xao ≥ 20 dB,
// tiếng gõ ≥ 15 dB; giọng sạch SI-SDR ≥ 18 dB, dải ≥ 16 kHz; giọng vốn rõ (20 dB) không kém «không lọc».
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { join, resolve } from 'node:path'

const GOC = resolve(import.meta.dirname, '../..')
const RA = resolve(process.argv[2] ?? join(GOC, 'docs/ban-ve-live-1011/so-do-loc-on-3-1111.json'))
const HZ = 48000, K = 480, GIAY = 14
const MAU = process.env.LV_MAU ? resolve(process.env.LV_MAU) : null

// ── Mã lọc của app ──
const MA_LOC = /export const MA_LOC = `([\s\S]*?)`/.exec(readFileSync(join(GOC, 'src/lib/live/loc-on/ma-loc.ts'), 'utf8'))[1]
const THAM = new Function('return ' + /THAM_LOC_ON:[^=]*= (\{.*\})\s*$/m.exec(readFileSync(join(GOC, 'src/lib/live/chuoi-tieng.ts'), 'utf8'))[1])()
const taoMaLoc = new Function(MA_LOC + '\nreturn { napLoc: napLoc, locOn: locOn, buocDf: buocDf, dfDo: dfDo, dfMuon: dfMuon, dfCho: dfCho, dat: function (t) { thDich = t; }, df: function (v) { dfOk = v; }, tt: function () { return { dfGd: dfGd, dfW: dfW, tre: tre, dfBo: dfBo }; } };')
const RNNOISE = readFileSync(join(GOC, 'src/lib/live/loc-on/rnnoise.wasm'))

// ── DeepFilterNet 3 (wasm-bindgen; keo tối thiểu giống Worker src/lib/live/loc-on/df3.ts) ──
const TEP_WASM = join(GOC, 'public/loc-on/df3-wasm-0200.bin'), TEP_MO_HINH = join(GOC, 'public/loc-on/df3-mo-hinh-v3.bin')
let dfX = null, dfMoHinh = null, dfMod = null
/** Mỗi lần gọi dựng một bản wasm MỚI (bản này không có hàm huỷ trạng thái) — mô-đun chỉ biên dịch một lần. */
function napDf() {
  const td = new TextDecoder(), imp = {}, mod = (dfMod ??= new WebAssembly.Module(gunzipSync(readFileSync(TEP_WASM))))
  let x = null
  for (const i of WebAssembly.Module.imports(mod)) {
    const n = i.name, m = (imp[i.module] ??= {})
    if (n.includes('new_from_slice')) m[n] = (p, l) => new Float32Array(new Float32Array(x.memory.buffer, p >>> 0, l))
    else if (n.includes('getRandomValues')) m[n] = (p, l) => { globalThis.crypto.getRandomValues(new Uint8Array(x.memory.buffer, p >>> 0, l)) }
    else if (n.includes('wbindgen_throw')) m[n] = (p, l) => { throw new Error(td.decode(new Uint8Array(x.memory.buffer, p >>> 0, l))) }
    else if (n.includes('init_externref_table')) m[n] = () => { const t = x.__wbindgen_externrefs, o = t.grow(4); t.set(0, undefined); t.set(o, undefined); t.set(o + 1, null); t.set(o + 2, true); t.set(o + 3, false) }
    else throw new Error('import lạ ' + n)
  }
  x = new WebAssembly.Instance(mod, imp).exports; x.__wbindgen_start()
  dfMoHinh ??= readFileSync(TEP_MO_HINH)
  return (dfX = x)
}
const dfCap = (n, can) => (dfX.__wbindgen_malloc_command_export ?? dfX.__wbindgen_malloc)(n, can) >>> 0
/** Chạy DeepFilterNet 3 thô trên cả tín hiệu (trạng thái mới mỗi lần). Trả đầu ra (trễ 1440 mẫu) + ms mỗi khung (trung vị). Nhớ kết quả theo `khoa`. */
const nhoDf = new Map()
function dfTho(x, khoa) {
  if (khoa && nhoDf.has(khoa)) return nhoDf.get(khoa)
  napDf()
  const p = dfCap(dfMoHinh.length, 1); new Uint8Array(dfX.memory.buffer).set(dfMoHinh, p)
  const st = dfX.df_create(p, dfMoHinh.length, 100) >>> 0, y = new Float32Array(x.length), ts = []
  for (let d = 0; d + K <= x.length; d += K) { const q = dfCap(K * 4, 4); new Float32Array(dfX.memory.buffer, q, K).set(x.subarray(d, d + K)); const t0 = performance.now(); const r = dfX.df_process_frame(st, q, K); ts.push(performance.now() - t0); y.set(r, d) }
  ts.sort((a, b) => a - b)
  const kq = { y, ms: ts[ts.length >> 1], ms95: ts[Math.floor(ts.length * 0.95)] }
  if (khoa) nhoDf.set(khoa, kq)
  return kq
}
/** Chạy đúng vòng của Worker app trên cả tín hiệu: locOn (RNNoise) rồi buocDf (DeepFilterNet, nếu `coDf`). `muc` = 'vua' | 'manh'.
 *  Có DeepFilterNet ⇒ chạy trước 0,8 giây im cho bộ ấy NHẬP CUỘC xong (đủ 50 khung + một quãng im + trộn chéo 200 ms) rồi mới vào tín hiệu ⇒ số đo là của
 *  trạng thái ổn định, trễ cố định 30 ms. (Khâu nhập cuộc giữa lúc đang ồn được thử riêng: tests/live-loc-on-3-1111.test.ts.) */
function chayApp(x, muc, coDf, khoa) {
  const m = taoMaLoc(), y = new Float32Array(x.length), yd = coDf ? dfTho(x, khoa) : null, im = new Float32Array(K)
  m.napLoc(RNNOISE.buffer.slice(RNNOISE.byteOffset, RNNOISE.byteOffset + RNNOISE.byteLength)); m.dat(THAM[muc]); m.df(coDf ? 1 : 0)
  const buoc = (kh, yk) => { const dung = m.tt().dfGd || m.dfMuon(), goc = dung ? kh.slice() : null; m.locOn(kh); if (goc) { const cho = m.dfCho(); if (m.dfMuon()) m.dfDo(1); m.buocDf(kh, goc, cho ? yk : null) } return kh }
  if (coDf) { for (let j = 0; j < 80; j++) buoc(new Float32Array(K), im); if (!m.tt().dfBo) throw new Error('DeepFilterNet chưa nhập cuộc sau 0,8 giây im') }
  const t0 = process.hrtime.bigint()
  for (let d = 0; d + K <= x.length; d += K) y.set(buoc(x.slice(d, d + K), yd ? yd.y.subarray(d, d + K) : null), d)
  return { y, ms: Number(process.hrtime.bigint() - t0) / 1e6 / Math.floor(x.length / K) + (yd ? yd.ms : 0), ms95: yd ? yd.ms95 : null }
}
function docWav(tep) {
  const b = readFileSync(tep); let p = 12, kenh = 1, d = null
  while (p + 8 <= b.length) { const id = b.toString('ascii', p, p + 4), n = b.readUInt32LE(p + 4); if (id === 'fmt ') { kenh = b.readUInt16LE(p + 10); if (b.readUInt32LE(p + 12) !== HZ || b.readUInt16LE(p + 22) !== 16) throw new Error('cần WAV 48 kHz 16 bit: ' + tep) } if (id === 'data') { d = b.subarray(p + 8, p + 8 + n); break } p += 8 + n + (n & 1) }
  const n = Math.floor(d.length / (2 * kenh)), m = new Float32Array(n)
  for (let i = 0; i < n; i++) { let s = 0; for (let k = 0; k < kenh; k++) s += d.readInt16LE((i * kenh + k) * 2); m[i] = s / kenh / 32768 }
  return m
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

/** Xe ngoài đường: ầm trầm liên tục (< 200 Hz) + từng xe lướt qua (ồn 200–2000 Hz phồng lên rồi xẹp trong 2–4 giây) + thỉnh thoảng còi (hai nốt 420 + 520 Hz, 0,4 giây). */
function onXe() {
  const n = HZ * GIAY, m = new Float32Array(n); let tr = 0, tr2 = 0
  for (let i = 0; i < n; i++) { const w = rnd() * 2 - 1; tr += 0.02 * (w - tr); tr2 += 0.02 * (tr - tr2); m[i] = tr2 * 14 }
  let i = Math.round(0.4 * HZ)
  while (i < n) { const d = Math.round((2 + rnd() * 2) * HZ), c1 = coHuong(350 + rnd() * 300, 0.7), c2 = coHuong(1200 + rnd() * 600, 0.8), a = 0.5 + rnd() * 0.5; for (let k = 0; k < d && i + k < n; k++) { const w = rnd() * 2 - 1, bao = Math.exp(-(((k - d / 2) / (d / 5)) ** 2)); m[i + k] += (chay(c1, w) + 0.5 * chay(c2, w)) * bao * a } i += Math.round((1.5 + rnd() * 2.5) * HZ) }
  for (let t = 3.2; t < GIAY - 1; t += 5.3) { const d0 = Math.round(t * HZ), d = Math.round(0.4 * HZ); for (let k = 0; k < d; k++) m[d0 + k] += 0.5 * (Math.sin((2 * Math.PI * 420 * k) / HZ) + Math.sin((2 * Math.PI * 520 * k) / HZ)) * Math.min(1, k / 480, (d - k) / 480) }
  return m
}
/** Giọng người thật từ tệp WAV: đặt sau 0,9 giây im, đệm cho đủ dài; cờ «đang nói» = khung 10 ms to hơn −45 dB so với khung to nhất (nới 50 ms hai phía). */
function giongThat(tep) {
  const g = docWav(tep), n = HZ * GIAY, m = new Float32Array(n), noi = new Uint8Array(n), d0 = Math.round(0.9 * HZ)
  m.set(g.subarray(0, Math.min(g.length, n - d0 - HZ)), d0)
  let dinh = 0; const nl = []; for (let d = 0; d + K <= n; d += K) { let e = 0; for (let i = 0; i < K; i++) e += m[d + i] ** 2; nl.push(e); dinh = Math.max(dinh, e) }
  nl.forEach((e, k) => { if (e > dinh * 3e-5) noi.fill(1, Math.max(0, (k - 5) * K), Math.min(n, (k + 6) * K)) })
  return { m, noi }
}
/** Xôn xao THẬT: 8 lớp giọng người thật chồng nhau (mỗi tệp một người; lớp 6–8 là người cũ phát nhanh / chậm ±6–12 % cho khác giọng), lệch giờ ngẫu nhiên, mức bằng nhau. */
function onXonXaoThat(ds) {
  const n = HZ * GIAY, m = new Float32Array(n), tl = [1, 1, 1, 1, 1, 0.89, 1.12, 0.94]
  for (let v = 0; v < 8; v++) { const g = docWav(ds[v % ds.length]), r = rms(g) || 1, lech = Math.floor(rnd() * g.length); for (let i = 0; i < n; i++) { const p = (lech + i * tl[v]) % (g.length - 1), p0 = Math.floor(p); m[i] += (g[p0] + (g[p0 + 1] - g[p0]) * (p - p0)) / r } }
  return m
}
function onThat(tep) { const g = docWav(tep), m = new Float32Array(HZ * GIAY); for (let i = 0; i < m.length; i++) m[i] = g[(i + HZ) % g.length]; return m }

// ── Số đo ──
const db = (v) => 10 * Math.log10(Math.max(1e-30, v))
/** SI-SDR của `y` so với giọng sạch `s` (trễ chung `tre` mẫu), MỘT hệ số khuếch đại cho cả tín hiệu, nhưng khớp trễ lại TỪNG CỬA SỔ 100 ms trong ±1 ms
 *  (lệch làm tương quan lớn nhất): bộ xử lý tiếng của trình duyệt có trễ trôi vài mẫu theo thời gian — không khớp lại thì dạng sóng lệch pha và bị chấm oan.
 *  Với các bộ trễ cố định (RNNoise, DeepFilterNet) cửa sổ nào cũng chọn lệch 0 nên số không đổi. */
function siSdr(y, s, tre) {
  const W = 4800, ds = []
  let ss = 0, sy = 0
  for (let d = 0; d + W <= s.length && d + W + tre + 48 <= y.length; d += W) {
    let e = 0; for (let i = 0; i < W; i += 4) e += s[d + i] * s[d + i]
    let lon = -1e99, lech = 0
    if (e > 1e-7) for (let l = -48; l <= 48; l++) { if (d + tre + l < 0) continue; let c = 0; for (let i = 0; i < W; i += 2) c += s[d + i] * y[d + i + tre + l]; if (c > lon) { lon = c; lech = l } }
    ds.push(lech)
    for (let i = 0; i < W; i++) { ss += s[d + i] * s[d + i]; sy += s[d + i] * y[d + i + tre + lech] }
  }
  const a = sy / ss; let e = 0
  ds.forEach((lech, k) => { const d = k * W; for (let i = 0; i < W; i++) { const v = y[d + i + tre + lech] - a * s[d + i]; e += v * v } })
  return db((a * a * ss) / e)
}
/** FFT cơ số 2 tại chỗ. */
function fft(re, im) {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t } }
  for (let len = 2; len <= n; len <<= 1) { const g = (-2 * Math.PI) / len, wr = Math.cos(g), wi = Math.sin(g); for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const a = i + k, b = a + len / 2, xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr; re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t } } }
}
/** Độ lớn phổ từng khung (cửa sổ Hann 1024, bước 512; 0 – 12 kHz) của `m` từ mẫu `lech`. */
function phoDoLon(m, lech, soKhung) {
  const N = 1024, ra = []
  for (let k = 0; k < soKhung; k++) { const re = new Float64Array(N), im = new Float64Array(N), d = lech + k * 512; for (let i = 0; i < N; i++) re[i] = (m[d + i] ?? 0) * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1))); fft(re, im); const a = new Float32Array(256); for (let i = 0; i < 256; i++) a[i] = Math.hypot(re[i + 1], im[i + 1]); ra.push(a) }
  return ra
}
/** GIỮ GIỌNG KHÔNG KỂ PHA (dB): tỉ số năng lượng phổ của giọng sạch / sai khác ĐỘ LỚN phổ giữa đầu ra và giọng sạch (một hệ số khuếch đại chung).
 *  SI-SDR chấm cả pha: bộ lọc của trình duyệt tách băng làm lệch pha (tai không nghe ra) nên bị SI-SDR chấm rất thấp — chỉ số này công bằng hơn cho nó. */
function giuPho(y, s, tre) {
  const n = Math.floor((Math.min(s.length, y.length - tre) - 1024) / 512), S = phoDoLon(s, 0, n), Y = phoDoLon(y, tre, n)
  let ss = 0, sy = 0
  for (let k = 0; k < n; k++) for (let i = 0; i < 256; i++) { ss += S[k][i] * S[k][i]; sy += S[k][i] * Y[k][i] }
  const a = sy / ss; let e = 0
  for (let k = 0; k < n; k++) for (let i = 0; i < 256; i++) { const v = Y[k][i] - a * S[k][i]; e += v * v }
  return db((a * a * ss) / e)
}
function timTre(y, s) { let lon = -1e99, tre = 0; for (let lag = 0; lag <= 2400; lag++) { let c = 0; for (let i = HZ; i < HZ * 4; i += 3) c += s[i] * y[i + lag]; if (c > lon) { lon = c; tre = lag } } return tre }
/** Ồn ở đoạn im (xa tiếng nói ≥ 100 ms). */
function onIm(y, noi, tre) { const xa = new Uint8Array(noi.length); for (let i = 4800; i < noi.length - 4800; i += 480) { let im = 1; for (let j = -4800; j <= 4800; j += 480) if (noi[i + j]) { im = 0; break } if (im) xa.fill(1, i, i + 480) } let e = 0, c = 0; for (let i = HZ; i + tre < y.length; i++) if (xa[i]) { e += y[i + tre] ** 2; c++ } return e / Math.max(1, c) }
/** Dải tần còn lại của giọng sạch sau lọc: tần số cao nhất mà phổ dài hạn còn trong −3 dB so với trước lọc. */
function daiTan(y, s, tre) { let tren = 0; for (let b = 0; b < 40; b++) { const f = 200 * Math.pow(100, b / 39), w = (2 * Math.PI * f) / HZ; const nl = (m, lech) => { let t = 0; for (let d = HZ; d + 2048 + lech < m.length; d += 9600) { let re = 0, im = 0; for (let i = 0; i < 2048; i++) { re += m[d + lech + i] * Math.cos(w * i); im -= m[d + lech + i] * Math.sin(w * i) } t += re * re + im * im } return t }; if (db(nl(y, tre) / nl(s, 0)) > -3) tren = f } return Math.round(tren) }

const r1 = (v) => (v == null ? null : Math.round(v * 10) / 10)
const tb = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null)
const co = (t) => MAU && existsSync(join(MAU, t))
// Hai NHÓM giọng: «thật» (cần LV_MAU — số chính của lượt 3) và «tổng hợp» (so được với số lượt 2; DeepFilterNet coi giọng này là ồn).
const NHOM = { that: {}, tongHop: { 'giọng nam (tổng hợp)': giong(105, 150, 1), 'giọng nữ / trẻ (tổng hợp)': giong(220, 320, 1.17) } }
for (const [ten, tep] of [['người thật, nam (thu 48 kHz)', 'giong-nam.wav'], ['người thật, nữ (gốc 22 kHz)', 'giong-nu.wav'], ['máy đọc tiếng Việt (gốc 16 kHz)', 'giong-viet.wav']]) if (co(tep)) NHOM.that[ten] = giongThat(join(MAU, tep))
const ON = { 'quạt / điều hoà': onQuat(), 'xôn xao (tổng hợp)': onXonXao(), 'gõ bút / bàn phím': onGo(), 'xe ngoài đường': onXe() }
if (co('xon-xao-1.wav')) ON['xôn xao THẬT (5 người, 8 lớp)'] = onXonXaoThat([1, 2, 3, 4, 5].filter((i) => co(`xon-xao-${i}.wav`)).map((i) => join(MAU, `xon-xao-${i}.wav`)))
if (co('on-that.wav')) ON['ồn thật (bản ghi freesound 2530)'] = onThat(join(MAU, 'on-that.wav'))
const coDf = existsSync(TEP_WASM) && existsSync(TEP_MO_HINH)
/** Tín hiệu của một ca: giọng (RMS lúc nói 0,1) + ồn ở tỉ số `snr` dB (null = giọng sạch). */
const tinHieu = (g, o, snr) => { const s = nhan(g.m, 0.1 / rms(g.m, g.noi)); if (!o) return { s, x: s }; const n = nhan(o, (0.1 / Math.pow(10, snr / 20)) / rms(o)), x = new Float32Array(s.length); for (let i = 0; i < x.length; i++) x[i] = s[i] + n[i]; return { s, x } }
/** Thứ tự các ca trong tệp nối của một giọng: giọng sạch, rồi từng loại ồn × 0 / 10 / 20 dB. Khoá = đúng khoá các bộ lọc nhận. */
const dsCa = (tg) => [{ khoa: 'sach|' + tg, to: null, snr: null }, ...Object.keys(ON).flatMap((to) => [0, 10, 20].map((snr) => ({ khoa: [tg, to, snr].join('|'), to, snr })))]
if (process.env.LV_XUAT) {
  const dir = resolve(process.env.LV_XUAT), ml = { tep: [] }
  mkdirSync(dir, { recursive: true })
  Object.entries(NHOM.that).forEach(([tg, g], i) => {
    const ca = dsCa(tg), m = new Float32Array(ca.length * HZ * GIAY)
    ca.forEach((c, k) => m.set(tinHieu(g, c.to ? ON[c.to] : null, c.snr).x, k * HZ * GIAY))
    const b = Buffer.alloc(44 + m.length * 2)
    b.write('RIFF', 0); b.writeUInt32LE(36 + m.length * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(HZ, 24); b.writeUInt32LE(HZ * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(m.length * 2, 40)
    for (let j = 0; j < m.length; j++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(m[j] * 32768))), 44 + j * 2)
    writeFileSync(join(dir, `vao-${i}.wav`), b); ml.tep.push({ tep: `vao-${i}.wav`, giong: tg, n: m.length, ca: ca.map((c) => c.khoa) })
  })
  writeFileSync(join(dir, 'muc-luc.json'), JSON.stringify(ml, null, 1) + '\n')
  console.log(`Đã ghi ${ml.tep.length} tệp vào ${dir}`); process.exit(0)
}
/** Bản Chromium đã thu: căn cả tệp MỘT lần bằng tương quan chéo trên ca đầu (giọng sạch; dò −0,2 … 1,5 giây), lùi 5 ms cho chắc, rồi cắt từng ca theo khoá. */
const NS = {}
function napNs(dir, tienTo) {
  const ml = JSON.parse(readFileSync(join(dir, 'muc-luc.json'), 'utf8')), kho = new Map()
  ml.tep.forEach((t, i) => {
    if (!existsSync(join(dir, `${tienTo}-${i}.wav`))) return
    const y = docWav(join(dir, `${tienTo}-${i}.wav`)), s = docWav(join(dir, t.tep))
    let lon = -1e99, lech = 0
    for (let lag = -9600; lag <= 72000; lag += 2) { let c = 0; for (let j = HZ; j < HZ * 6; j += 4) c += s[j] * (y[j + lag] ?? 0); if (c > lon) { lon = c; lech = lag } }
    lech -= 240 // âm = trình duyệt đã nuốt mất đoạn đầu tệp trước khi trang kịp thu (đo: 40 ms) ⇒ đệm số 0
    t.ca.forEach((khoa, k) => { const c = new Float32Array(HZ * GIAY), d0 = lech + k * HZ * GIAY; for (let j = 0; j < c.length; j++) c[j] = y[d0 + j] ?? 0; kho.set(khoa, c) })
  })
  return kho
}
if (process.env.LV_NS) { NS.loc = napNs(resolve(process.env.LV_NS), 'ra'); NS.khong = napNs(resolve(process.env.LV_NS), 'ra0'); try { NS.ban = JSON.parse(readFileSync(join(resolve(process.env.LV_NS), 'thu.json'), 'utf8')).trinhDuyet } catch { NS.ban = '?' } }
const boNs = (ten, kho) => ({ ten, kb: 1, chiCo: kho, chay: (x, k) => { const y = new Float32Array(x.length), c = kho.get(k); if (c) y.set(c.subarray(0, Math.min(c.length, y.length))); return { y, ms: 0 } } })
const BO = [
  { ten: 'không lọc', chay: (x) => ({ y: x, ms: 0 }), kb: 0 },
  ...(NS.khong?.size ? [boNs(`mic trình duyệt KHÔNG lọc — kiểm đường đo (Chromium ${NS.ban})`, NS.khong)] : []),
  ...(NS.loc?.size ? [boNs(`lọc ồn của trình duyệt — WebRTC (Chromium ${NS.ban})`, NS.loc)] : []),
  { ten: 'RNNoise «Vừa» (lượt 2)', chay: (x) => chayApp(x, 'vua', false), kb: 157, tre: 480 },
  { ten: 'RNNoise «Mạnh» (lượt 2)', chay: (x) => chayApp(x, 'manh', false), kb: 157, tre: 480 },
  ...(coDf ? [
    { ten: 'DeepFilterNet 3 thô (không cổng)', chay: (x, k) => dfTho(x, k), kb: 11678, tre: 1440 },
    { ten: 'DeepFilterNet 3 «Vừa» (lượt 3)', chay: (x, k) => chayApp(x, 'vua', true, k), kb: 11678, tre: 1440 },
    { ten: 'DeepFilterNet 3 «Mạnh» (lượt 3)', chay: (x, k) => chayApp(x, 'manh', true, k), kb: 11678, tre: 1440 },
  ] : []),
].filter((b) => !process.env.LV_CHI || new RegExp(process.env.LV_CHI).test(b.ten))
const ra = { luc: new Date().toISOString(), ghiChu: 'Ngoại tuyến trong Node, mã lọc của app. Tín / ồn 0 / 10 / 20 dB. Nhóm «that» = giọng thật (số chính), «tongHop» = giọng tổng hợp.', giong: { that: Object.keys(NHOM.that), tongHop: Object.keys(NHOM.tongHop) }, on: Object.keys(ON), bo: [] }
for (const b of BO) {
  const h = { ten: b.ten, kb: b.kb, nhom: {} }
  let tre = 0, ms = 0, ms95 = null
  for (const [tn, GIONG] of Object.entries(NHOM)) {
    if (!Object.keys(GIONG).length) continue
    const sach = {}, on = {}, treG = {}
    for (const [tg, g] of Object.entries(GIONG)) {
      if (b.chiCo && !b.chiCo.has('sach|' + tg)) continue
      const s = nhan(g.m, 0.1 / rms(g.m, g.noi)), k = b.chay(s, 'sach|' + tg)
      const t = b.kb ? timTre(k.y, s) : 0
      treG[tg] = b.tre ?? t
      if (tn === 'that' || !Object.keys(NHOM.that).length) { tre = t; ms = k.ms; ms95 = k.ms95 ?? null }
      sach[tg] = { siSdr: b.kb ? r1(siSdr(k.y, s, t)) : null, giuPho: b.kb ? r1(giuPho(k.y, s, t)) : null, den3dBHz: b.kb ? daiTan(k.y, s, t) : null, treMs: r1(t / 48) }
    }
    if (!Object.keys(sach).length) continue
    for (const [to, o] of Object.entries(ON)) {
      const giam = [], hon = { 0: [], 10: [], 20: [] }, pho = { 0: [], 10: [], 20: [] }, theoGiong = {}
      for (const [tg, g] of Object.entries(GIONG)) for (const snr of [0, 10, 20]) {
        if (!(tg in treG)) continue
        const { s, x } = tinHieu(g, o, snr), treN = treG[tg]
        const y = b.chay(x, [tg, to, snr].join('|')).y
        const gi = db(onIm(x, g.noi, 0) / onIm(y, g.noi, treN)), ho = siSdr(y, s, treN) - siSdr(x, s, 0), ph = giuPho(y, s, treN) - giuPho(x, s, 0)
        giam.push(gi); hon[snr].push(ho); pho[snr].push(ph); (theoGiong[tg] ??= {})[snr] = { giamOn: r1(gi), siSdrHon: r1(ho), giuPhoHon: r1(ph) }
      }
      on[to] = { giamOn: r1(tb(giam)), giamOnItNhat: r1(Math.min(...giam)), siSdrHon0: r1(tb(hon[0])), siSdrHon10: r1(tb(hon[10])), siSdrHon20: r1(tb(hon[20])), siSdrHon20XauNhat: r1(Math.min(...hon[20])), giuPhoHon0: r1(tb(pho[0])), giuPhoHon10: r1(tb(pho[10])), giuPhoHon20: r1(tb(pho[20])), giuPhoHon20XauNhat: r1(Math.min(...pho[20])), theoGiong }
    }
    h.nhom[tn] = { sach, on }
  }
  h.treMs = r1(tre / 48); h.msMoiKhung = Math.round(ms * 1000) / 1000; h.ms95 = ms95 == null ? null : Math.round(ms95 * 1000) / 1000; h.heSoThoiGianThuc = Math.round(ms * 100) / 1000
  ra.bo.push(h)
  console.log(`${b.ten} · trễ ${h.treMs} ms · ${h.msMoiKhung} ms/khung (p95 ${h.ms95 ?? '—'})`)
  for (const [tn, v] of Object.entries(h.nhom)) console.log(`  [${tn}] sạch: ` + Object.entries(v.sach).map(([tg, q]) => `${tg} ${q.siSdr} dB (phổ ${q.giuPho}) tới ${q.den3dBHz} Hz`).join(' · ') + '\n   '
    + Object.entries(v.on).map(([to, q]) => `${to}: bớt ${q.giamOn} dB (ít nhất ${q.giamOnItNhat}) · SI-SDR hơn ${q.siSdrHon0} / ${q.siSdrHon10} / ${q.siSdrHon20} (xấu nhất ở 20 dB: ${q.siSdrHon20XauNhat}) · phổ hơn ${q.giuPhoHon0} / ${q.giuPhoHon10} / ${q.giuPhoHon20} (xấu nhất ${q.giuPhoHon20XauNhat})`).join('\n   '))
}
writeFileSync(RA, JSON.stringify(ra, null, 1) + '\n')
console.log(`\nĐã ghi ${RA}`)
