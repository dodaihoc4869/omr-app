// SOÁT «TRẠNG THÁI MANG SANG» (lượt 3): đoạn người khác nói một mình 3 s (đúng như cảnh 18 s: 3 s đầu của giọng, −25 − snr dBFS, nền ồn −65 dBFS)
// chạy qua (a) bộ tách MỚI (trạng thái GRU = 0), (b) bộ tách vừa nghe thầy nói 2,8 s (+ hở 0,5 s), (c) vừa nghe thầy + CHÍNH giọng này nói chồng 2,8 s (+ hở 0,5 s)
// ⇒ giọng khác giảm (dB) theo thời gian từ lúc bắt đầu nói.
// (a) cao hẳn (b) ⇒ lọt là do trạng thái «thầy» mang sang, không phải do không nhận ra giọng.
//   node do-trang-thai.mjs <tach-giong-thay.ts> <tệp.tgt> <thầy.wav> <tên=giọng khác.wav> … [LV_SNR=0]
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
const [, , tepTs, tgt, tepThay, ...ds] = process.argv
const ma = /export const MA_TACH = `([\s\S]*?)`/.exec(readFileSync(tepTs, 'utf8'))[1]
const L = new Function(ma + '\nreturn { docMoHinh: docMoHinh, taoTach: taoTach };')()
const b = readFileSync(tgt), w = L.docMoHinh(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength))
const HZ = 48000, K = 480, SNR = +(process.env.LV_SNR ?? 0)
const doc = (t) => { const o = execFileSync('ffmpeg', ['-v', 'error', '-i', t, '-ac', '1', '-ar', '48000', '-f', 'f32le', '-'], { maxBuffer: 1 << 28 }); return new Float32Array(o.buffer, o.byteOffset, o.length / 4) }
const rms = (x) => { let e = 0, n = 0; for (let i = 0; i + K <= x.length; i += K) { let f = 0; for (let j = 0; j < K; j++) f += x[i + j] ** 2; if (f / K > 1e-6) { e += f; n += K } } return Math.sqrt(e / Math.max(1, n)) }
const muc = (x, db) => { const k = 10 ** (db / 20) / rms(x); return x.map((v) => v * k) }
let hat = 12345; const nn = () => { hat = (hat * 1103515245 + 12345) >>> 0; return hat / 4294967296 }
const MOC = [[0, 250], [250, 500], [500, 1000], [1000, 2000], [2000, 3000]]
function chay(truoc, O) { // truoc: tiếng cho bộ tách nghe trước (có thể rỗng); O: đoạn người khác ⇒ dB giảm theo mốc
  const T = L.taoTach(w, HZ), bO = T.bong(), x = Float32Array.from([...truoc, ...O]), o = Float32Array.from([...new Float32Array(truoc.length), ...O])
  for (let i = 0; i < x.length; i++) x[i] += (nn() * 2 - 1) * 10 ** (-65 / 20) * Math.sqrt(3)
  const eV = MOC.map(() => 0), eR = MOC.map(() => 0)
  for (let k = 0; (k + 1) * K <= x.length; k++) {
    const G = T.khung(x.slice(k * K, k * K + K)), c = o.slice(k * K, k * K + K); bO(c, G)
    const t0 = k * K - truoc.length; if (t0 < 0) continue
    // c = phần giọng khác qua mặt nạ, chậm K mẫu ⇒ so với đoạn vào lùi một khung
    const ms = ((t0 - K) * 1000) / HZ, j0 = MOC.findIndex(([a, z]) => ms >= a && ms < z); if (j0 < 0) continue
    for (let j = 0; j < K; j++) { eV[j0] += o[k * K - K + j] ** 2; eR[j0] += c[j] ** 2 }
  }
  return Object.fromEntries(MOC.map(([a, z], j) => [`${a}-${z}ms`, +(10 * Math.log10(eV[j] / Math.max(eR[j], 1e-20))).toFixed(1)]))
}
const thay = muc(doc(tepThay), -25), truoc = Float32Array.from([...thay.subarray(0, Math.round(2.8 * HZ)), ...new Float32Array(Math.round(0.5 * HZ))])
for (const d of ds) {
  const [ten, tep] = d.split('='), X = muc(doc(tep), -25 - SNR), O = X.subarray(0, 3 * HZ)
  // (c) đúng như đoạn «khác một mình» THỨ HAI của cảnh 18 s: ngay sau 2,8 s NÓI CHỒNG (thầy + chính giọng này) + hở 0,5 s
  const n = Math.round(2.8 * HZ), chong = new Float32Array(n + Math.round(0.5 * HZ)); for (let i = 0; i < n; i++) chong[i] = thay[(i + n) % thay.length] + X[(i + 3 * HZ) % X.length]
  console.log(JSON.stringify({ ban: w.h.ban, snr: SNR, khac: ten, moi: chay(new Float32Array(0), O), sauThay: chay(truoc, O), sauChong: chay(chong, O) }))
}
