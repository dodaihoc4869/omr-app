// Soát lõi JS (MA_TACH) khớp numpy: nạp .tgt, chạy 24 kHz trên tiếng tham chiếu, so mặt nạ; đo thời gian một khung ở 48 kHz.
import { readFileSync } from 'node:fs'
const [, , tepTs, tgt, thamChieu] = process.argv
const ma = /export const MA_TACH = `([\s\S]*?)`/.exec(readFileSync(tepTs, 'utf8'))[1]
const L = new Function(ma + '\nreturn { docMoHinh, taoTach, taoFft };')()
const b = readFileSync(tgt), ab = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)
const w = L.docMoHinh(ab)
const r = JSON.parse(readFileSync(thamChieu, 'utf8'))
const T = L.taoTach(w, 24000), x = Float32Array.from(r.x)
let lech = 0
for (let k = 0; k < r.m.length; k++) { T.khung(x.subarray(k * 240, k * 240 + 240)); for (let i = 0; i < w.NB; i++) lech = Math.max(lech, Math.abs(T.m[i] - r.m[k][i])) }
console.log('lệch mặt nạ JS–numpy lớn nhất', lech.toExponential(2), w.h)
const T48 = L.taoTach(w, 48000), z = new Float32Array(480).map(() => Math.random() * 0.1 - 0.05)
for (let i = 0; i < 50; i++) T48.khung(z.slice())
const t0 = performance.now(); for (let i = 0; i < 500; i++) T48.khung(z.slice())
const ms = (performance.now() - t0) / 500
console.log('48 kHz: ms / khung 10 ms =', ms.toFixed(3), '⇒ hệ số thời gian thực', (ms / 10).toFixed(3))
