#!/usr/bin/env node
// ĐỐI CHỨNG: LỌC ỒN CÓ SẴN CỦA TRÌNH DUYỆT (bộ xử lý tiếng WebRTC của Chromium — thứ mà Meet bản web dựa trên). Zoom / Meet bản gốc là mã đóng,
// KHÔNG đo được ở đây. Cách đo: Chromium thật dùng tệp WAV làm mic (`--use-file-for-fake-audio-capture`), trang thu đúng thứ
// `getUserMedia({ noiseSuppression: true })` trả về (khử vọng + tự chỉnh âm lượng TẮT), ghi lại thành WAV; `do-loc-on.mjs` căn thời gian bằng tương quan
// chéo rồi tính CÙNG chỉ số với các bộ khác.
//   1) LV_MAU=<mẫu> LV_XUAT=<thư mục> node scripts/thu-live-1011/do-loc-on.mjs      ⇒ <thư mục>/vao-<i>.wav + muc-luc.json
//   2) node scripts/thu-live-1011/do-loc-on-trinh-duyet.mjs <thư mục> [khong-loc]    ⇒ <thư mục>/ra-<i>.wav  (thêm `khong-loc`: thu cả bản KHÔNG lọc của
//                                                                                       tệp đầu ⇒ ra0-0.wav, để kiểm chính đường đo)
//   3) LV_MAU=<mẫu> LV_NS=<thư mục> node scripts/thu-live-1011/do-loc-on.mjs        ⇒ bảng có thêm dòng «lọc ồn của trình duyệt»
import { execFileSync } from 'node:child_process'
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIR = resolve(process.argv[2] ?? '')
const ML = JSON.parse(readFileSync(join(DIR, 'muc-luc.json'), 'utf8'))
const may = createServer((_, r) => { r.setHeader('content-type', 'text/html'); r.end('<!doctype html><meta charset="utf-8"><title>thu</title>') })
await new Promise((x) => may.listen(0, '127.0.0.1', x))
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', EXE = existsSync(exe) && statSync(exe).isFile() ? exe : undefined
const URL0 = `http://127.0.0.1:${may.address().port}/`

/** Ghi WAV 48 kHz. Trình duyệt giao tần số khác (Chromium không lọc ⇒ 44,1 kHz) ⇒ ghi tạm rồi nhờ ffmpeg đổi về 48 kHz. */
function ghiWav(tep, b16, hz = 48000) {
  if (hz !== 48000) { ghiWav(tep + '.goc.wav', b16, 48000); const b = readFileSync(tep + '.goc.wav'); b.writeUInt32LE(hz, 24); b.writeUInt32LE(hz * 2, 28); writeFileSync(tep + '.goc.wav', b); execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tep + '.goc.wav', '-ar', '48000', '-c:a', 'pcm_s16le', tep]); return }
  const b = Buffer.alloc(44 + b16.length)
  b.write('RIFF', 0); b.writeUInt32LE(36 + b16.length, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22)
  b.writeUInt32LE(48000, 24); b.writeUInt32LE(96000, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(b16.length, 40)
  b16.copy(b, 44); writeFileSync(tep, b)
}
/** Thu `giay` giây từ mic giả `tep` với lọc ồn của trình duyệt bật / tắt. Trả Buffer PCM 16 bit + cấu hình trình duyệt báo. */
async function thu(tep, giay, loc) {
  const b = await chromium.launch({ executablePath: EXE, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', `--use-file-for-fake-audio-capture=${tep}%noloop`, '--autoplay-policy=no-user-gesture-required'] })
  try {
    const p = await (await b.newContext()).newPage()
    await p.goto(URL0)
    const cauHinh = await p.evaluate(async ({ giay, loc }) => {
      const l = await navigator.mediaDevices.getUserMedia({ audio: { noiseSuppression: loc, echoCancellation: false, autoGainControl: false, channelCount: 1, sampleRate: 48000 } })
      const t = l.getAudioTracks()[0], doc = new MediaStreamTrackProcessor({ track: t }).readable.getReader()
      const N = giay * 48000, m = new Int16Array(N), tam = new Float32Array(4800) // 48 kHz hay 44,1 kHz đều đủ chỗ cho `giay` giây
      let vt = 0, hz = 0
      while (vt < N) {
        const { value: f, done } = await doc.read()
        if (done) break
        hz = f.sampleRate
        const n = Math.min(f.numberOfFrames, N - vt), k = n <= tam.length ? tam : new Float32Array(f.numberOfFrames)
        f.copyTo(k, { planeIndex: 0, format: 'f32-planar' }); f.close()
        for (let i = 0; i < n; i++) m[vt + i] = Math.max(-32768, Math.min(32767, Math.round(k[i] * 32768)))
        vt += n
      }
      window.__m = new Uint8Array(m.buffer, 0, vt * 2)
      const s = t.getSettings(); t.stop()
      return { hz, n: vt, on: s.noiseSuppression, vong: s.echoCancellation, agc: s.autoGainControl }
    }, { giay, loc })
    const manh = []
    for (let d = 0; d < cauHinh.n * 2; d += 3_000_000) manh.push(Buffer.from(await p.evaluate(({ d }) => { const u = window.__m.subarray(d, d + 3_000_000); let s = ''; for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768)); return btoa(s) }, { d }), 'base64'))
    return { pcm: Buffer.concat(manh), cauHinh }
  } finally { await b.close() }
}
const ra = { luc: new Date().toISOString(), trinhDuyet: null, tep: [] }
for (const [i, t] of ML.tep.entries()) {
  const giay = Math.ceil(t.n / 48000) + 2
  if (existsSync(join(DIR, `ra-${i}.wav`))) console.log(`đã có ra-${i}.wav — bỏ qua`)
  else {
    const k = await thu(join(DIR, t.tep), giay, true)
    ghiWav(join(DIR, `ra-${i}.wav`), k.pcm, k.cauHinh.hz); ra.tep.push({ tep: `ra-${i}.wav`, ...k.cauHinh })
    console.log(`đã thu ra-${i}.wav (${giay} giây, ${k.cauHinh.hz} Hz) · trình duyệt báo lọc ồn ${k.cauHinh.on}, khử vọng ${k.cauHinh.vong}, tự chỉnh âm lượng ${k.cauHinh.agc}`)
  }
  if (i === 0 && process.argv[3] === 'khong-loc') { const k0 = await thu(join(DIR, t.tep), giay, false); ghiWav(join(DIR, 'ra0-0.wav'), k0.pcm, k0.cauHinh.hz); console.log(`đã thu ra0-0.wav (không lọc, ${k0.cauHinh.hz} Hz) · lọc ồn ${k0.cauHinh.on}`) }
}
{ const b = await chromium.launch({ executablePath: EXE }); ra.trinhDuyet = b.version(); await b.close() }
writeFileSync(join(DIR, 'thu.json'), JSON.stringify(ra, null, 1) + '\n')
may.close()
console.log('Chromium', ra.trinhDuyet)
