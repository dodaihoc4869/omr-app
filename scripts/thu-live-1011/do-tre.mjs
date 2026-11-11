#!/usr/bin/env node
// ĐO TRỄ THƯỜNG TRỰC + ĐỘ TRONG CỦA TIẾNG LIVE (11/11, thầy: «làm cho tức thì», «tiếng phải trong nhất») — Chromium THẬT, mic giả đọc tệp WAV, thư viện
// thật `taoLiveThay` phát tới một kết nối WebRTC thứ hai ngay trong trang (đóng vai «SFU + máy em»; trang đo: do-tieng.tsx, hàm `__do2`).
// KHÔNG qua Cloudflare Realtime SFU thật, KHÔNG có trễ mạng (trừ khi bật rung mô phỏng), KHÔNG có loa / mic thật.
//   npx vite build --config scripts/thu-live-1011/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/thu-live-1011/do-tre.mjs <thư mục tạm> [tệp số đo = docs/ban-ve-live-1011/so-do-tre-1111.json] [nhãn lượt, vd. rung-30]
// Ba tín hiệu: (1) chuỗi xung 4 ms cách nhau 400 ms ⇒ trễ từng chặng (trung vị, p95, ≥ 50 xung); (2) sin 1 kHz ở −20 và −6 dBFS ⇒ SINAD / THD;
// (3) giọng nói tổng hợp −25 dBFS trên nền ồn −55 dBFS, quãng nghỉ 0,9 giây ⇒ mức, đỉnh, ồn trong quãng nghỉ, độ «thở», segSNR qua bộ mã.
import { existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { moMayChu } from './may-chu.mjs'

const GOC = resolve(import.meta.dirname, '../..')
const DIST = resolve(process.argv[2] ?? 'dist-thu-live')
const RA = resolve(process.argv[3] ?? join(GOC, 'docs/ban-ve-live-1011/so-do-tre-1111.json'))
const NHAN = process.argv[4] ?? 'cuc-bo'
const CHI = (process.argv[5] ?? 'xung,sin,noi').split(',')
const HZ = 48000
const tam = mkdtempSync(join(tmpdir(), 'do-tre-'))

function ghiWav(ten, mau) {
  const b = Buffer.alloc(44 + mau.length * 2)
  b.write('RIFF', 0); b.writeUInt32LE(36 + mau.length * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22)
  b.writeUInt32LE(HZ, 24); b.writeUInt32LE(HZ * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(mau.length * 2, 40)
  for (let i = 0; i < mau.length; i++) b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(mau[i] * 32767))), 44 + i * 2)
  const p = join(tam, ten); writeFileSync(p, b); return p
}
/** Xung 4 ms (1,5 kHz, bật tức thì) cách nhau 400 ms, 20 giây (Chromium phát lặp lại tệp). */
function chuoiXung() {
  const m = new Float32Array(HZ * 20)
  for (let t = 0.2; t < 19.7; t += 0.4) { const d = Math.round(t * HZ); for (let k = 0; k < 192; k++) m[d + k] = 0.5 * Math.cos((2 * Math.PI * 1500 * k) / HZ) * (k < 150 ? 1 : (192 - k) / 42) }
  return m
}
const sin1k = (db) => { const a = Math.pow(10, db / 20), m = new Float32Array(HZ * 10); for (let i = 0; i < m.length; i++) m[i] = a * Math.sin((2 * Math.PI * 1000 * i) / HZ); return m }
/** Giọng nói tổng hợp (nguồn răng cưa + 3 cộng hưởng, âm xát) RMS lúc có tiếng `rmsDb`, nền ồn trắng `onDb`, cứ 6 âm tiết nghỉ 0,9 giây. */
function giongNoi(rmsDb, onDb) {
  const n = HZ * 24, m = new Float32Array(n)
  let hat = 12345
  const rnd = () => { hat = (hat * 1103515245 + 12345) & 0x7fffffff; return hat / 0x7fffffff }
  const NGUYEN_AM = [[730, 1090, 2440], [270, 2290, 3010], [300, 870, 2240], [530, 1840, 2480], [570, 840, 2410], [440, 1020, 2240]]
  const coHuong = (f, q) => { const w = (2 * Math.PI * f) / HZ, al = Math.sin(w) / (2 * q), a0 = 1 + al; return { b0: al / a0, b2: -al / a0, a1: (-2 * Math.cos(w)) / a0, a2: (1 - al) / a0, x1: 0, x2: 0, y1: 0, y2: 0 } }
  const chay = (c, x) => { const y = c.b0 * x + c.b2 * c.x2 - c.a1 * c.y1 - c.a2 * c.y2; c.x2 = c.x1; c.x1 = x; c.y2 = c.y1; c.y1 = y; return y }
  let i = Math.round(0.3 * HZ), dem = 0
  while (i < n - HZ * 1.2) {
    if (dem % 3 === 2) { const d = Math.round((0.06 + rnd() * 0.05) * HZ), cao = coHuong(5500, 1.2); for (let k = 0; k < d && i + k < n; k++) m[i + k] += chay(cao, rnd() * 2 - 1) * 0.5 * Math.sin((Math.PI * k) / d); i += d }
    const d = Math.round((0.16 + rnd() * 0.1) * HZ), va = NGUYEN_AM[Math.floor(rnd() * NGUYEN_AM.length)], f0 = 110 + rnd() * 50, luot = 0.85 + rnd() * 0.3
    const ch = [coHuong(va[0], 6), coHuong(va[1], 9), coHuong(va[2], 10)], manh = 0.6 + rnd() * 0.4
    let pha = 0
    for (let k = 0; k < d && i + k < n; k++) { pha += (f0 * (1 + (luot - 1) * (k / d))) / HZ; const cua = 2 * (pha - Math.floor(pha + 0.5)), bao = Math.sin((Math.PI * k) / d) ** 0.7; m[i + k] += (chay(ch[0], cua) + 0.6 * chay(ch[1], cua) + 0.35 * chay(ch[2], cua) + 0.12 * cua) * bao * manh }
    i += d + Math.round((0.04 + rnd() * 0.05) * HZ); dem += 1
    if (dem % 6 === 0) i += Math.round(0.9 * HZ)
  }
  let dinh = 0
  for (const v of m) if (Math.abs(v) > dinh) dinh = Math.abs(v)
  let s = 0, c = 0
  for (let k = 0; k + 960 <= n; k += 960) { let e = 0; for (let j = 0; j < 960; j++) e += m[k + j] ** 2; if (Math.sqrt(e / 960) > dinh * 0.0056) { s += e; c += 960 } }
  const he = Math.pow(10, rmsDb / 20) / Math.sqrt(s / Math.max(1, c)), on = Math.pow(10, onDb / 20) * Math.sqrt(3)
  for (let k = 0; k < n; k++) m[k] = m[k] * he + (rnd() * 2 - 1) * on
  return m
}

// CẤU HÌNH SO SÁNH. «trước» = bản đang sống (#1603): chuỗi hai bộ nén, tự chỉnh âm lượng của trình duyệt bật, Opus 64 kb/s khung 20 ms.
const O64 = { bitrate: 64000, dtx: false, fec: true, rong: true }
const TRUOC = { ten: 'trước (#1603): chuỗi nén + AGC trình duyệt, 64 kb/s, khung 20 ms', chuoiKieu: 'nen', agc: true, opus: { ...O64, ptime: 20 } }
const SAU = { ten: 'SAU (mặc định của thư viện, lọc ồn riêng tắt)', locOn: 'tat' }
const KHUNG = { chuoiKieu: 'khung', agc: false }
const KHUNG_AGC = { chuoiKieu: 'khung', agc: true }
const DS = {
  xung: [TRUOC, { ...TRUOC, ten: 'trước, máy em KHÔNG đặt đệm rung thấp nhất', demNhan0: false }, { ...TRUOC, ten: 'trước + khung 10 ms', opus: { ...O64, ptime: 10 } },
    { ten: 'không chuỗi (mic thẳng), AGC trình duyệt, khung 20 ms', chuoi: false, agc: true, opus: { ...O64, ptime: 20 } },
    { ten: 'chuỗi nhanh (worklet), AGC tắt, khung 20 ms', chuoiKieu: 'nhanh', agc: false, opus: { ...O64, ptime: 20 } },
    { ...KHUNG, ten: 'chuỗi từng khung (Worker), AGC tắt, khung 20 ms', opus: { ...O64, ptime: 20 } }, { ...KHUNG, ten: 'chuỗi từng khung, AGC tắt, khung 10 ms', opus: { ...O64, ptime: 10 } },
    { ...KHUNG, ten: 'chuỗi từng khung + AGC trình duyệt, khung 20 ms', agc: true, opus: { ...O64, ptime: 20 } }, SAU],
  sin: [TRUOC, { ...TRUOC, ten: 'trước + khung 10 ms', opus: { ...O64, ptime: 10 } }, { ...TRUOC, ten: 'trước + 96 kb/s', opus: { ...O64, bitrate: 96000, ptime: 20 } },
    { ...KHUNG, ten: 'chuỗi từng khung, AGC tắt, 64 kb/s khung 20 ms', opus: { ...O64, ptime: 20 } }, { ...KHUNG, ten: 'chuỗi từng khung, AGC tắt, 64 kb/s khung 10 ms', opus: { ...O64, ptime: 10 } },
    { ...KHUNG, ten: 'chuỗi từng khung, AGC tắt, 96 kb/s khung 20 ms', opus: { ...O64, bitrate: 96000, ptime: 20 } },
    { ...KHUNG_AGC, ten: 'chuỗi từng khung + AGC trình duyệt, 64 kb/s khung 20 ms', opus: { ...O64, ptime: 20 } }, { ...KHUNG_AGC, ten: 'chuỗi từng khung + AGC trình duyệt, 96 kb/s khung 20 ms', opus: { ...O64, bitrate: 96000, ptime: 20 } },
    { ...KHUNG_AGC, ten: 'chuỗi từng khung + AGC trình duyệt, 64 kb/s khung 10 ms', opus: { ...O64, ptime: 10 } }, SAU],
}
DS.noi = [...DS.sin.slice(0, 3), { ten: 'chuỗi nén, AGC TẮT, 64 kb/s khung 20 ms', chuoiKieu: 'nen', agc: false, opus: { ...O64, ptime: 20 } }, { ten: 'không chuỗi, AGC trình duyệt, 64 kb/s khung 20 ms', chuoi: false, agc: true, opus: { ...O64, ptime: 20 } }, ...DS.sin.slice(3)]

const may = await moMayChu({ dist: DIST })
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
async function chay(wav, ds, kieu, giay, cho) {
  const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', `--use-file-for-fake-audio-capture=${wav}`, '--autoplay-policy=no-user-gesture-required'] })
  try {
    const ctx = await trinh.newContext({ permissions: ['microphone'] })
    await ctx.route((u) => !u.href.startsWith(may.goc), (r) => r.abort())
    const t = await ctx.newPage()
    t.on('pageerror', (e) => console.log('  lỗi trang:', e.message))
    await t.goto(`${may.goc}/scripts/thu-live-1011/do-tieng.html`)
    await t.waitForFunction(() => typeof window.__do2 === 'function', null, { timeout: 15000 })
    return await t.evaluate(([d, k, g, c]) => window.__do2(d, k, g, c), [ds, kieu, giay, cho])
  } finally { await trinh.close() }
}
const ra = { luc: new Date().toISOString(), ghiChu: 'Chromium thật + mic giả đọc tệp WAV; thư viện taoLiveThay thật → kết nối WebRTC thứ hai trong trang (không SFU thật, không loa / mic thật). Trễ đo giữa ba điểm trong trang bằng cùng một đồng hồ mẫu: mic trình duyệt giao → đầu ra chuỗi → tiếng nhận sau Opus + đệm rung. CHƯA gồm bộ đệm thu của thiết bị và trễ loa.' }
if (CHI.includes('xung')) {
  console.log('① Chuỗi xung — trễ từng chặng (ms)')
  // Mỗi cấu hình đo trên BA kết nối mới (đệm rung và pha khung của mỗi kết nối một khác) ⇒ gộp: trung vị của ba trung vị, p95 lớn nhất.
  const wav = ghiWav('xung.wav', chuoiXung()), lan = []
  for (let l = 0; l < 3; l++) lan.push(await chay(wav, DS.xung, 'xung', 22, 3))
  const giua = (a) => { const b = a.filter((v) => v != null).sort((x, y) => x - y); return b.length ? b[Math.floor((b.length - 1) / 2)] : null }
  ra.xung = DS.xung.map((ch, i) => { const d = lan.map((x) => x[i]); return { ten: ch.ten, soXung: d.reduce((s, x) => s + x.soNhan, 0), chuoiMs: giua(d.map((x) => x.chuoiMs)), tongMs: giua(d.map((x) => x.tongMs)), tongP95: Math.max(...d.map((x) => x.tongP95 ?? 0)), tongNhoNhat: Math.min(...d.map((x) => x.tongNhoNhat ?? 1e9)), tongLonNhat: Math.max(...d.map((x) => x.tongLonNhat ?? 0)), demRungMs: giua(d.map((x) => x.demRungMs)), goiMoiGiay: d[0].goiMoiGiay, mic: d[0].mic, baLan: d.map((x) => x.tongMs) } })
  for (const x of ra.xung) console.log(`  ${x.ten}\n     chuỗi ${x.chuoiMs} · TỔNG mic → nhận ${x.tongMs} (ba lần: ${x.baLan.join(' / ')}; p95 ${x.tongP95}; ${x.tongNhoNhat}–${x.tongLonNhat}; ${x.soXung} xung) · đệm rung ${x.demRungMs} · ${x.goiMoiGiay} gói/giây · kiểu ${x.mic.kieu} · AGC ${x.mic.agc} · mic ${x.mic.hz} Hz`)
}
if (CHI.includes('sin')) {
  ra.sin = {}
  for (const muc of [-20, -6]) {
    console.log(`② Sin 1 kHz ${muc} dBFS — SINAD / THD (dB)`)
    ra.sin[muc] = await chay(ghiWav(`sin${muc}.wav`, sin1k(muc)), DS.sin, 'sin', 6, 7)
    for (const x of ra.sin[muc]) console.log(`  ${x.ten}\n     tại mic: SINAD ${x.sinMic?.sinad} · sau chuỗi: SINAD ${x.sinChuoi?.sinad}, THD ${x.sinChuoi?.thd}, mức ${x.sinChuoi?.mucDb} · NHẬN: SINAD ${x.sinNhan?.sinad}, THD ${x.sinNhan?.thd}, mức ${x.sinNhan?.mucDb} · ${x.kbps} kb/s`)
  }
}
if (CHI.includes('on')) {
  // LỌC ỒN (11/11): giọng −25 dBFS trên nền ồn trắng −35 dBFS (tín / ồn tại mic ≈ 10 dB) qua đường thật — không lọc / lọc của trình duyệt / lọc riêng Vừa / Mạnh
  const O = { opus: { ...O64, ptime: 20 } }
  const dsOn = [{ ...O, ten: 'không lọc', locOn: 'tat' }, { ...O, ten: 'lọc ồn + khử vọng của TRÌNH DUYỆT (lọc riêng tắt)', locOn: 'tat', loc: 'bat' }, { ...O, ten: 'lọc riêng «Vừa»', locOn: 'vua' }, { ...O, ten: 'lọc riêng «Mạnh»', locOn: 'manh' }]
  console.log('④ Giọng nói −25 dBFS trên nền ồn −35 dBFS — lọc ồn')
  ra.on = await chay(ghiWav('on.wav', giongNoi(-25, -35)), dsOn, 'noi', 20, 8)
  for (const x of ra.on) console.log(`  ${x.ten}\n     NHẬN: nói ${x.noiNhan.rmsNoiDb} dBFS · đỉnh ${x.noiNhan.dinhDb} · ồn quãng nghỉ ${x.noiNhan.onNghiDb} · tín / ồn ${x.noiNhan.tinTrenOnDb} dB (tại mic ${x.noiMic.tinTrenOnDb}) · «thở» ${x.noiNhan.thoDb} dB · segSNR ${x.noiNhan.segSnrDb} dB · lọc: ${x.mic.locOn} (${x.mic.locOnChay})`)
}
if (CHI.includes('noi')) {
  console.log('③ Giọng nói −25 dBFS trên nền ồn −55 dBFS')
  ra.noi = await chay(ghiWav('noi.wav', giongNoi(-25, -55)), DS.noi, 'noi', 20, 8)
  for (const x of ra.noi) console.log(`  ${x.ten}\n     NHẬN: nói ${x.noiNhan.rmsNoiDb} dBFS · đỉnh ${x.noiNhan.dinhDb} · ồn quãng nghỉ ${x.noiNhan.onNghiDb} · tín / ồn ${x.noiNhan.tinTrenOnDb} dB (tại mic ${x.noiMic.tinTrenOnDb}) · «thở» ${x.noiNhan.thoDb} dB (${x.noiNhan.soQuangNghi} quãng) · segSNR ${x.noiNhan.segSnrDb} dB · ${x.kbps} kb/s`)
}
const cu = existsSync(RA) ? JSON.parse(readFileSync(RA, 'utf8')) : {}
cu[NHAN] = { ...(cu[NHAN] ?? {}), ...ra }
writeFileSync(RA, JSON.stringify(cu, null, 1) + '\n')
console.log(`\nĐã ghi ${RA} (mục «${NHAN}»)`)
await may.dong()
process.exit(0)
