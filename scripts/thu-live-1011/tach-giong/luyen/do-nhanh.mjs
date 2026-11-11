// ĐO NHANH một checkpoint (.tgt) bằng ĐÚNG lõi JS ở 48 kHz: mỗi tệp tiếng (một người nói) đặt ở −25 dBFS ⇒ mức hạ (dB). Thầy giữ riêng phải ≈ 0 dB,
// giọng người khác CHƯA GẶP (LJ nữ, VCTK nam, xôn xao, giọng khác thật) càng cao càng tốt. Dùng để chọn checkpoint trước khi chạy bản đo 18 s.
//   node do-nhanh.mjs <tach-giong-thay.ts> <tệp.tgt> <tên=tệp.wav> …
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
const [, , tepTs, tgt, ...ds] = process.argv
const ma = /export const MA_TACH = `([\s\S]*?)`/.exec(readFileSync(tepTs, 'utf8'))[1]
const L = new Function(ma + '\nreturn { docMoHinh: docMoHinh, taoTach: taoTach };')()
const b = readFileSync(tgt), w = L.docMoHinh(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength))
const kq = {}
for (const d of ds) {
  const [ten, tep] = d.split('=')
  const o = execFileSync('ffmpeg', ['-v', 'error', '-i', tep, '-ac', '1', '-ar', '48000', '-f', 'f32le', '-'], { maxBuffer: 1 << 28 })
  const x0 = new Float32Array(o.buffer, o.byteOffset, o.length / 4)
  let e = 0, n = 0; for (const v of x0) if (v * v > 1e-7) { e += v * v; n++ }
  const k = 10 ** (-25 / 20) / Math.sqrt(e / n), T = L.taoTach(w, 48000)
  let ev = 0, er = 0
  for (let i = 0; i + 480 <= x0.length; i += 480) { const f = x0.slice(i, i + 480).map((v) => v * k); for (const v of f) ev += v * v; T.khung(f); for (const v of f) er += v * v }
  kq[ten] = +(10 * Math.log10(ev / er)).toFixed(1)
}
console.log(JSON.stringify({ ban: w.h.ban, hạ_dB: kq }))
