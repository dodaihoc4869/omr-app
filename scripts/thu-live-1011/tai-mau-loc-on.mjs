#!/usr/bin/env node
// TẢI MẪU TIẾNG THẬT cho bản đo lọc ồn (do-loc-on.mjs, do-loc-on-trinh-duyet.mjs) — KHÔNG đưa vào kho, chỉ nằm ở thư mục tạm.
//   node scripts/thu-live-1011/tai-mau-loc-on.mjs <thư mục đích>     (cần ffmpeg; mạng tới raw.githubusercontent.com)
// Mọi tệp đổi về WAV 48 kHz một kênh 16 bit. Vì sao cần: DeepFilterNet 3 học trên giọng người thật nên coi giọng tổng hợp (răng cưa + cộng hưởng) của bản đo
// cũ là ồn và xoá sạch ⇒ muốn đo «giữ giọng» phải có giọng thật.
//   giong-nam.wav    người thật, nam, tiếng Anh, thu 48 kHz        — Rikorose/DeepFilterNet assets/clean_freesound_33711.wav (MIT / Apache-2.0)
//   giong-nu.wav     người thật, nữ, tiếng Anh, gốc 22 kHz          — LJ Speech LJ001-0001 (phạm vi công cộng), qua kho coqui-ai/TTS tests/data
//   giong-viet.wav   máy đọc nơ-ron tiếng Việt, gốc 16 kHz          — NTT123/vietTTS assets/infore/clip.wav (MIT); KHÔNG phải người thật
//   xon-xao-1..5.wav năm người thật khác (VCTK p240, p260; LibriSpeech 1320, 8230; LJ001-0002) — để trộn thành tiếng xôn xao thật
//   on-that.wav      ồn thật (bản ghi)                               — Rikorose/DeepFilterNet assets/noise_freesound_2530.wav
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const DICH = resolve(process.argv[2] ?? '')
if (!process.argv[2]) { console.error('Thiếu thư mục đích.'); process.exit(1) }
mkdirSync(join(DICH, 'goc'), { recursive: true })
const R = 'https://raw.githubusercontent.com/'
const TEP = [
  ['giong-nam.wav', R + 'Rikorose/DeepFilterNet/main/assets/clean_freesound_33711.wav', []],
  ['giong-nu.wav', R + 'coqui-ai/TTS/dev/tests/data/ljspeech/wavs/LJ001-0001.wav', []],
  ['giong-viet.wav', R + 'NTT123/vietTTS/master/assets/infore/clip.wav', ['-t', '12']],
  ['xon-xao-1.wav', R + 'CorentinJ/Real-Time-Voice-Cloning/master/samples/p240_00000.mp3', []],
  ['xon-xao-2.wav', R + 'CorentinJ/Real-Time-Voice-Cloning/master/samples/p260_00000.mp3', []],
  ['xon-xao-3.wav', R + 'CorentinJ/Real-Time-Voice-Cloning/master/samples/1320_00000.mp3', []],
  ['xon-xao-4.wav', R + 'CorentinJ/Real-Time-Voice-Cloning/master/samples/8230_00000.mp3', []],
  ['xon-xao-5.wav', R + 'coqui-ai/TTS/dev/tests/data/ljspeech/wavs/LJ001-0002.wav', []],
  ['on-that.wav', R + 'Rikorose/DeepFilterNet/main/assets/noise_freesound_2530.wav', []],
]
for (const [ten, u, them] of TEP) {
  const r = await fetch(u)
  if (!r.ok) { console.error(`KHÔNG tải được ${u}: ${r.status}`); process.exitCode = 1; continue }
  const goc = join(DICH, 'goc', ten + '.' + u.split('.').pop())
  writeFileSync(goc, Buffer.from(await r.arrayBuffer()))
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', goc, ...them, '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', join(DICH, ten)])
  console.log('đã có', ten)
}
