// MẪU GIỌNG cho phép thử «tiếng thật» (tieng-that.mjs) + phép so «có đúng là giọng nói vào không» (tương quan đường bao năng lượng).
// Không dùng ffmpeg: tự đọc / ghi WAV (PCM 8/16/24/32 bit, float 32 bit, một / nhiều kênh) ⇒ chạy được trên mọi máy CI.
//   node scripts/thu-live-dot0-1011/giong.mjs <thư mục ra>   ⇒ <thư mục ra>/giong-1.wav (một kênh) + giong-2.wav (hai kênh) 48 kHz 16 bit
// Nguồn giọng: người thật, nam, thu 48 kHz — Rikorose/DeepFilterNet assets/clean_freesound_33711.wav (MIT / Apache-2.0); KHÔNG đưa vào kho.
// Tải không được ⇒ giọng tổng hợp (nguyên âm có cộng hưởng, nhịp âm tiết) — ghi rõ trong kết quả vì bộ lọc ồn có thể coi giọng tổng hợp là ồn.
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

export const HZ = 48000
export const URL_GIONG = 'https://raw.githubusercontent.com/Rikorose/DeepFilterNet/main/assets/clean_freesound_33711.wav'

/** Đọc WAV ⇒ { hz, kenh: Float32Array[] } (−1..1). */
export function docWav(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') throw new Error('không phải WAV')
  let o = 12, fmt = null, data = null
  while (o + 8 <= buf.length) {
    const id = buf.toString('ascii', o, o + 4), n = buf.readUInt32LE(o + 4)
    if (id === 'fmt ') {
      let tag = buf.readUInt16LE(o + 8)
      if (tag === 0xfffe && n >= 40) tag = buf.readUInt16LE(o + 8 + 24) // WAVE_FORMAT_EXTENSIBLE: hai byte đầu của mã định dạng con
      fmt = { tag, so: buf.readUInt16LE(o + 10), hz: buf.readUInt32LE(o + 12), bit: buf.readUInt16LE(o + 22) }
    } else if (id === 'data') data = buf.subarray(o + 8, Math.min(buf.length, o + 8 + n))
    o += 8 + n + (n & 1)
  }
  if (!fmt || !data) throw new Error('WAV thiếu fmt / data')
  const b = fmt.bit / 8, khung = Math.floor(data.length / (b * fmt.so)), kenh = Array.from({ length: fmt.so }, () => new Float32Array(khung))
  for (let i = 0; i < khung; i++) for (let k = 0; k < fmt.so; k++) {
    const p = (i * fmt.so + k) * b
    let v
    if (fmt.tag === 3) v = b === 4 ? data.readFloatLE(p) : data.readDoubleLE(p)
    else if (b === 1) v = (data[p] - 128) / 128
    else if (b === 2) v = data.readInt16LE(p) / 32768
    else if (b === 3) v = data.readIntLE(p, 3) / 8388608
    else v = data.readInt32LE(p) / 2147483648
    kenh[k][i] = v
  }
  return { hz: fmt.hz, kenh }
}
/** Ghi WAV 16 bit PCM từ các kênh Float32Array cùng độ dài. */
export function ghiWav(tep, kenh, hz = HZ) {
  const n = kenh[0].length, so = kenh.length, d = Buffer.alloc(44 + n * so * 2)
  d.write('RIFF', 0, 'ascii'); d.writeUInt32LE(36 + n * so * 2, 4); d.write('WAVE', 8, 'ascii'); d.write('fmt ', 12, 'ascii')
  d.writeUInt32LE(16, 16); d.writeUInt16LE(1, 20); d.writeUInt16LE(so, 22); d.writeUInt32LE(hz, 24); d.writeUInt32LE(hz * so * 2, 28); d.writeUInt16LE(so * 2, 32); d.writeUInt16LE(16, 34)
  d.write('data', 36, 'ascii'); d.writeUInt32LE(n * so * 2, 40)
  for (let i = 0; i < n; i++) for (let k = 0; k < so; k++) d.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(kenh[k][i] * 32767))), 44 + (i * so + k) * 2)
  writeFileSync(tep, d)
}
/** Đổi tần số lấy mẫu (nội suy tuyến tính — đủ cho mẫu thử). */
export function doiHz(x, tu, den = HZ) {
  if (tu === den) return x
  const n = Math.floor((x.length * den) / tu), y = new Float32Array(n)
  for (let i = 0; i < n; i++) { const t = (i * tu) / den, a = Math.floor(t), f = t - a; y[i] = (x[a] ?? 0) * (1 - f) + (x[a + 1] ?? x[a] ?? 0) * f }
  return y
}
/** Giọng tổng hợp dự phòng: nguyên âm (hài âm 110–140 Hz qua ba cộng hưởng), 4 âm tiết / giây, có quãng nghỉ. */
export function giongTongHop(giay = 10) {
  const n = giay * HZ, x = new Float32Array(n), F = [[700, 110], [1220, 120], [2600, 160]]
  for (let i = 0; i < n; i++) {
    const t = i / HZ, am = Math.floor(t * 4), cau = Math.floor(t / 2.5)
    const bat = (am % 5 !== 4) && (t % 2.5 < 2.0) ? Math.sin(Math.PI * ((t * 4) % 1)) ** 2 : 0
    const f0 = 110 + 25 * Math.sin(2 * Math.PI * 0.7 * t + cau)
    let v = 0
    for (let h = 1; h * f0 < 4000; h++) { const f = h * f0; let g = 0; for (const [fc, bw] of F) g += 1 / (1 + ((f - fc) / bw) ** 2); v += (g / h) * Math.sin(2 * Math.PI * f * t + h) }
    x[i] = v * bat
  }
  return x
}
/** Tải giọng người thật; lỗi ⇒ null. */
export async function taiGiong() {
  try { const r = await fetch(URL_GIONG); if (!r.ok) return null; const w = docWav(Buffer.from(await r.arrayBuffer())); return doiHz(w.kenh[0], w.hz) } catch { return null }
}
/** Chuẩn hoá: cắt tối đa `giay` giây, đỉnh = `dinh`. */
export function chuanHoa(x, giay = 12, dinh = 0.5) {
  const y = x.slice(0, Math.min(x.length, giay * HZ))
  let m = 0
  for (const v of y) m = Math.max(m, Math.abs(v))
  if (m > 0) for (let i = 0; i < y.length; i++) y[i] = (y[i] / m) * dinh
  return y
}

/** Đường bao năng lượng (dB, sàn −80) theo khung dài `giayKhung` giây. */
export function duongBao(x, hz, giayKhung) {
  const L = Math.max(1, Math.round(hz * giayKhung)), n = Math.floor(x.length / L), ra = new Float32Array(n)
  for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < L; j++) { const v = x[i * L + j]; s += v * v } ra[i] = 20 * Math.log10(Math.max(1e-4, Math.sqrt(s / L))) }
  return ra
}
/** Tương quan Pearson LỚN NHẤT giữa đường bao nhận được `nhan` (dB) và đường bao mẫu `mau` (dB, một vòng lặp) qua mọi độ lệch vòng.
 *  ≈ 1 = đúng giọng của mẫu (chỉ trễ / nâng mức); ≈ 0–0,3 = không liên quan (im, ồn, tiếng rác). `nhan` phẳng (im hẳn) ⇒ 0. */
export function tuongQuan(nhan, mau) {
  const N = nhan.length, M = mau.length
  if (N < 20 || M < 20) return 0
  let tb = 0
  for (const v of nhan) tb += v
  tb /= N
  let ss = 0
  for (const v of nhan) ss += (v - tb) ** 2
  if (ss / N < 0.5) return 0 // dao động < 0,7 dB: không có đường bao giọng
  let tot = -1
  for (let L = 0; L < M; L++) {
    let sm = 0, s2 = 0, sx = 0
    for (let i = 0; i < N; i++) sm += mau[(i + L) % M]
    const tm = sm / N
    for (let i = 0; i < N; i++) { const a = nhan[i] - tb, b = mau[(i + L) % M] - tm; sx += a * b; s2 += b * b }
    const r = s2 > 0 ? sx / Math.sqrt(ss * s2) : 0
    if (r > tot) tot = r
  }
  return Math.round(tot * 100) / 100
}

// Chạy thẳng: dựng hai tệp mẫu.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const ra = process.argv[2]
  if (!ra) { console.error('Thiếu thư mục ra.'); process.exit(1) }
  mkdirSync(ra, { recursive: true })
  const that = await taiGiong()
  const x = chuanHoa(that ?? giongTongHop(10))
  ghiWav(join(ra, 'giong-1.wav'), [x])
  // Hai kênh như mic mảng của máy (thầy 11/11: «Microphone Array … 2 kênh»): kênh phải = 0,7 × kênh trái.
  ghiWav(join(ra, 'giong-2.wav'), [x, x.map((v) => v * 0.7)])
  writeFileSync(join(ra, 'nguon.txt'), that ? 'nguoi-that' : 'tong-hop')
  console.log(`Mẫu giọng: ${that ? 'người thật (DeepFilterNet assets)' : 'TỔNG HỢP (không tải được giọng thật)'} · ${(x.length / HZ).toFixed(1)} giây · ${ra}/giong-1.wav, giong-2.wav`)
}
