#!/usr/bin/env node
// ĐO TIẾNG LIVE TRƯỚC / SAU (11/11) — Chromium THẬT, mic giả đọc tệp WAV, thư viện thật `taoLiveThay` phát tới một kết nối WebRTC thứ hai ngay trong trang
// (scripts/thu-live-1011/do-tieng.tsx). KHÔNG qua Cloudflare Realtime SFU thật (SFU chỉ chuyển tiếp gói, không mã hoá lại) và KHÔNG có trễ mạng.
//   npx vite build --config scripts/thu-live-1011/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/thu-live-1011/do-tieng.mjs <thư mục tạm> [tệp số đo = docs/ban-ve-live-1011/so-do-tieng-1111.json]
// Đo: (1) quét tần 50 Hz → 20 kHz: dải tần còn lại ở đầu nhận (Hz tại −3 dB / −10 dB so với vùng 300–3000 Hz), tốc độ bit thật, trễ đệm nhận;
//     (2) giọng nói tổng hợp ở ba mức vào (−35 / −25 / −15 dBFS RMS): mức RMS lúc có tiếng + đỉnh ở đầu nhận (mục tiêu −18 … −14 dBFS, đỉnh không vỡ);
//     (3) trễ thêm của chuỗi làm rõ tiếng (dựng ngoại tuyến).
import { existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { moMayChu } from './may-chu.mjs'

const GOC = resolve(import.meta.dirname, '../..')
const DIST = resolve(process.argv[2] ?? 'dist-thu-live')
const RA = resolve(process.argv[3] ?? join(GOC, 'docs/ban-ve-live-1011/so-do-tieng-1111.json'))
const HZ = 48000
const tam = mkdtempSync(join(tmpdir(), 'do-tieng-'))

function ghiWav(ten, mau) {
  const b = Buffer.alloc(44 + mau.length * 2)
  b.write('RIFF', 0); b.writeUInt32LE(36 + mau.length * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22)
  b.writeUInt32LE(HZ, 24); b.writeUInt32LE(HZ * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(mau.length * 2, 40)
  for (let i = 0; i < mau.length; i++) b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(mau[i] * 32767))), 44 + i * 2)
  const p = join(tam, ten)
  writeFileSync(p, b)
  return p
}
/** Quét tần log 50 Hz → 20 kHz, 10 giây, biên độ 0,25 (−12 dBFS đỉnh). */
function quetTan() {
  const T = 10, n = T * HZ, m = new Float32Array(n), f0 = 50, f1 = 20000, k = Math.log(f1 / f0)
  for (let i = 0; i < n; i++) { const t = i / HZ; m[i] = 0.25 * Math.sin((2 * Math.PI * f0 * T / k) * (Math.exp((t / T) * k) - 1)) * Math.min(1, i / 480, (n - i) / 480) }
  return m
}
/** GIỌNG NÓI TỔNG HỢP (không phải tiếng người thật): chuỗi âm tiết ~4 âm / giây, nguồn răng cưa 110–160 Hz qua ba cộng hưởng nguyên âm, chen âm xát 4–8 kHz;
 *  chỉnh cho RMS lúc có tiếng bằng `rmsDb`. */
function giongNoi(rmsDb) {
  const T = 12, n = T * HZ, m = new Float32Array(n)
  let hat = 12345
  const rnd = () => { hat = (hat * 1103515245 + 12345) & 0x7fffffff; return hat / 0x7fffffff }
  const NGUYEN_AM = [[730, 1090, 2440], [270, 2290, 3010], [300, 870, 2240], [530, 1840, 2480], [570, 840, 2410], [440, 1020, 2240]]
  const coHuong = (f, q) => { const w = (2 * Math.PI * f) / HZ, al = Math.sin(w) / (2 * q), a0 = 1 + al; return { b0: al / a0, b2: -al / a0, a1: (-2 * Math.cos(w)) / a0, a2: (1 - al) / a0, x1: 0, x2: 0, y1: 0, y2: 0 } }
  const chay = (c, x) => { const y = c.b0 * x + c.b2 * c.x2 - c.a1 * c.y1 - c.a2 * c.y2; c.x2 = c.x1; c.x1 = x; c.y2 = c.y1; c.y1 = y; return y }
  let i = Math.round(0.2 * HZ), dem = 0
  while (i < n - HZ * 0.4) {
    if (dem % 3 === 2) { // âm xát
      const d = Math.round((0.06 + rnd() * 0.05) * HZ), cao = coHuong(5500, 1.2)
      for (let k = 0; k < d && i + k < n; k++) m[i + k] += chay(cao, rnd() * 2 - 1) * 0.5 * Math.sin((Math.PI * k) / d)
      i += d
    }
    const d = Math.round((0.16 + rnd() * 0.1) * HZ), va = NGUYEN_AM[Math.floor(rnd() * NGUYEN_AM.length)], f0 = 110 + rnd() * 50, luot = 0.85 + rnd() * 0.3
    const ch = [coHuong(va[0], 6), coHuong(va[1], 9), coHuong(va[2], 10)], manh = 0.6 + rnd() * 0.4
    let pha = 0
    for (let k = 0; k < d && i + k < n; k++) {
      pha += (f0 * (1 + (luot - 1) * (k / d))) / HZ
      const cua = 2 * (pha - Math.floor(pha + 0.5)), bao = Math.sin((Math.PI * k) / d) ** 0.7
      m[i + k] += (chay(ch[0], cua) + 0.6 * chay(ch[1], cua) + 0.35 * chay(ch[2], cua) + 0.12 * cua) * bao * manh
    }
    i += d + Math.round((0.05 + rnd() * 0.09) * HZ); dem += 1
    if (dem % 9 === 0) i += Math.round(0.35 * HZ) // quãng lấy hơi
  }
  // chỉnh RMS lúc có tiếng (khung 20 ms trên −45 dB so với đỉnh)
  let dinh = 0
  for (const v of m) if (Math.abs(v) > dinh) dinh = Math.abs(v)
  let s = 0, c = 0
  for (let k = 0; k + 960 <= n; k += 960) { let e = 0; for (let j = 0; j < 960; j++) e += m[k + j] ** 2; if (Math.sqrt(e / 960) > dinh * 0.0056) { s += e; c += 960 } }
  const he = Math.pow(10, rmsDb / 20) / Math.sqrt(s / Math.max(1, c))
  for (let k = 0; k < n; k++) m[k] *= he
  return m
}

const may = await moMayChu({ dist: DIST })
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
async function chay(wav, giay, ca) {
  const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', `--use-file-for-fake-audio-capture=${wav}`, '--autoplay-policy=no-user-gesture-required'] })
  try {
    const ctx = await trinh.newContext({ permissions: ['microphone'] })
    await ctx.route((u) => !u.href.startsWith(may.goc), (r) => r.abort())
    const t = await ctx.newPage()
    const loi = []
    t.on('pageerror', (e) => loi.push(e.message))
    await t.goto(`${may.goc}/scripts/thu-live-1011/do-tieng.html`)
    await t.waitForFunction(() => typeof window.__doTieng === 'function', null, { timeout: 15000 })
    const goc = ca.includes('truoc') && ca.includes('sau-loc') ? await t.evaluate((g) => window.__doGoc(g), giay) : null
    const kq = await t.evaluate(([g, c]) => window.__doTieng(g, c), [giay, ca])
    const tre = await t.evaluate(() => window.__treChuoi())
    if (loi.length) console.log('  lỗi trang:', loi.slice(0, 2).join(' | '))
    return { kq, tre, goc }
  } finally { await trinh.close() }
}
/** Dải tần còn lại: mốc = trung vị vùng 300–3000 Hz; đi từ 3 kHz lên tới khi tụt dưới mốc − `nguong` dB. */
function daiTan(pho, nguong) {
  const giua = pho.filter(([f]) => f >= 300 && f <= 3000).map(([, d]) => d).sort((a, b) => a - b), moc = giua[Math.floor(giua.length / 2)]
  let tren = 3000
  for (const [f, d] of pho) { if (f < 3000) continue; if (d < moc - nguong) break; tren = f }
  let duoi = 300
  for (const [f, d] of [...pho].reverse()) { if (f > 300) continue; if (d < moc - nguong) break; duoi = f }
  return { moc: Math.round(moc * 10) / 10, duoi, tren }
}

const ra = { luc: new Date().toISOString(), ghiChu: 'Chromium thật + mic giả đọc tệp WAV; thư viện taoLiveThay thật → kết nối WebRTC thứ hai trong trang (không SFU thật, không trễ mạng). Giọng nói là tín hiệu TỔNG HỢP, không phải người thật.', quetTan: [], giongNoi: [], treChuoiMs: null }
const CHI_DOI_MIC = process.argv[4] === 'doi-mic' // chỉ chạy bước ③ (nhanh): node … do-tieng.mjs <dist> <tệp số đo> doi-mic
console.log('① Quét tần 50 Hz → 20 kHz')
if (!CHI_DOI_MIC) {
  const { kq, tre, goc } = await chay(ghiWav('quet.wav', quetTan()), 11, ['truoc', 'sau', 'sau-loc'])
  ra.treChuoiMs = tre
  ra.phoGoc = goc
  for (const x of kq) {
    // đường truyền = phổ ở đầu nhận − phổ gốc (cùng tệp, mic thô, cùng cách đo)
    x.pho = x.pho.map(([f, d], i) => [f, Math.round((d - goc[i][1]) * 10) / 10])
    const b3 = daiTan(x.pho, 3), b10 = daiTan(x.pho, 10)
    ra.quetTan.push({ cauHinh: x.ten, tu3: b3.duoi, den3: b3.tren, tu10: b10.duoi, den10: b10.tren, kbps: x.kbps, demNhanMs: x.demNhanMs, mic: x.cauHinhMic, pho: x.pho })
    console.log(`  ${x.ten}\n     −3 dB: ${b3.duoi}–${b3.tren} Hz · −10 dB: ${b10.duoi}–${b10.tren} Hz · ${x.kbps} kb/s · đệm nhận ${x.demNhanMs} ms · mic ${JSON.stringify(x.cauHinhMic)}`)
  }
  console.log(`  trễ thêm của chuỗi làm rõ tiếng: ${tre} ms`)
}
console.log('② Giọng nói tổng hợp ở ba mức vào')
for (const muc of CHI_DOI_MIC ? [] : [-35, -25, -15]) {
  const { kq } = await chay(ghiWav(`noi${muc}.wav`, giongNoi(muc)), 9, ['truoc', 'sau'])
  for (const x of kq) {
    ra.giongNoi.push({ mucVaoDb: muc, cauHinh: x.ten, rmsNoiDb: x.rmsNoiDb, rmsDb: x.rmsDb, dinhDb: x.dinhDb, kbps: x.kbps })
    console.log(`  vào ${muc} dBFS · ${x.ten.split(' (')[0]}: RMS lúc có tiếng ${x.rmsNoiDb} dBFS · đỉnh ${x.dinhDb} dBFS · ${x.kbps} kb/s`)
  }
}
console.log('③ Đổi mic / tạm dừng / đổi lọc LÚC ĐANG LIVE — đo ở đầu nhận')
{
  const wav = ghiWav('noi-doi.wav', giongNoi(-25))
  const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', `--use-file-for-fake-audio-capture=${wav}`, '--autoplay-policy=no-user-gesture-required'] })
  try {
    const ctx = await trinh.newContext({ permissions: ['microphone'] })
    await ctx.route((u) => !u.href.startsWith(may.goc), (r) => r.abort())
    const t = await ctx.newPage()
    await t.goto(`${may.goc}/scripts/thu-live-1011/do-tieng.html`)
    await t.waitForFunction(() => typeof window.__doiMic === 'function', null, { timeout: 15000 })
    ra.doiMic = await t.evaluate((a) => window.__doiMic(a), process.env.LV_AGC === '0' ? false : process.env.LV_AGC === '1' ? true : undefined) // LV_AGC=0 / 1: ép tự chỉnh âm lượng của trình duyệt tắt / bật
    let hong = 0
    for (const b of ra.doiMic) {
      const lang = /đứng yên/.test(b.buoc), dat = lang ? b.emNangLuongTangSauMs == null : b.emNangLuongTangSauMs != null && b.emNangLuongTangSauMs <= 2000
      if (!dat) hong += 1
      console.log(`  ${dat ? '✓' : '✗'} ${b.buoc}: năng lượng phía em ${b.emNangLuongTangSauMs == null ? 'KHÔNG tăng trong 2 giây' : `tăng sau ${b.emNangLuongTangSauMs} ms`} · đầu nhận ${b.nhanRmsDb} dBFS · mic «${b.mic}» · bộ gửi ${b.boGuiCamMic ? 'cầm mic' : 'KHÔNG cầm mic'} · ${b.kbpsNhan} kb/s · vạch ${b.vach} · khử vọng ${b.vong}`)
    }
    ra.doiMicDat = hong === 0
    if (hong) process.exitCode = 1
  } finally { await trinh.close() }
}
// chỉ chạy bước ③ ⇒ giữ số đo ① ② đã có trong tệp, chỉ thay phần `doiMic`
const ghi = CHI_DOI_MIC && existsSync(RA) ? { ...JSON.parse(readFileSync(RA, 'utf8')), doiMic: ra.doiMic, doiMicDat: ra.doiMicDat, lucDoiMic: ra.luc } : ra
writeFileSync(RA, JSON.stringify(ghi, null, 1) + '\n')
console.log(`\nĐã ghi ${RA}`)
await may.dong()
process.exit(process.exitCode ?? 0)
