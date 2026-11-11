// In bảng gọn từ số đo do-tach-giong.mjs
import { readFileSync } from 'node:fs'
const d = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const chi = process.argv[3] ? process.argv[3].split(',') : null
console.log('snr khac cach | khacGiam | chongKhacGiam | thayGiu | chong vao→ra | thayBiHa% | moSau | rtf')
for (const r of d.ca) if (!chi || chi.includes(r.cach)) console.log(`${r.snr} ${r.khac} ${r.cach} | ${r.khacGiamDb} | ${r.chongKhacGiamDb ?? '-'} | ${r.thayGiuSiSdr} | ${r.chongSiSdr0}→${r.chongSiSdr} | ${r.thayBiHaPt ?? '-'} | ${r.moSauKhacMs ?? '-'} | ${r.rtf ?? '-'}`)
