// Tải một phần AudioMNIST (soerenab/AudioMNIST, giấy phép MIT; 60 người, 48 kHz) qua raw.githubusercontent.com: mỗi người 10 chữ số × 3 lần.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
const RA = process.argv[2]; mkdirSync(RA, { recursive: true })
const G = 'https://raw.githubusercontent.com/soerenab/AudioMNIST/master/'
for (const t of ['LICENSE', 'data/audioMNIST_meta.txt']) { const r = await fetch(G + t); writeFileSync(join(RA, t.split('/').pop()), Buffer.from(await r.arrayBuffer())) }
const viec = []
for (let s = 1; s <= 60; s++) for (let d = 0; d <= 9; d++) for (let i = 0; i < 3; i++) viec.push([s, d, i])
let xong = 0, loi = 0
async function tho() {
  while (viec.length) {
    const [s, d, i] = viec.shift(), ss = String(s).padStart(2, '0'), ten = `${d}_${ss}_${i}.wav`, dich = join(RA, ss, ten)
    if (existsSync(dich)) { xong++; continue }
    mkdirSync(join(RA, ss), { recursive: true })
    try { const r = await fetch(`${G}data/${ss}/${ten}`); if (!r.ok) { loi++; continue } writeFileSync(dich, Buffer.from(await r.arrayBuffer())); xong++ } catch { loi++ }
  }
}
await Promise.all(Array.from({ length: 12 }, tho))
console.log('xong', xong, 'loi', loi)
