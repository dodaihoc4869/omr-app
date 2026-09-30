#!/usr/bin/env node
// Gộp kết quả đo Bi-a (do-client.mjs, nhiều lần mỗi kịch bản) thành bảng trung vị TRƯỚC / SAU (markdown).
//   node scripts/do-bia/tom-tat.mjs <truoc.json> [<sau.json>]
import { readFileSync } from 'node:fs'

const [a, b] = process.argv.slice(2).map((f) => JSON.parse(readFileSync(f, 'utf8')))
const tv = (xs) => { const s = [...xs].sort((x, y) => x - y), m = s.length >> 1; return !s.length ? NaN : s.length % 2 ? s[m] : Math.round(((s[m - 1] + s[m]) / 2) * 10) / 10 }
const lay = (o, duong) => duong.split('.').reduce((x, k) => (x == null ? x : x[k]), o)
const trungVi = (kq, ks, duong) => { const r = kq.kichBan[ks]; const ds = Array.isArray(r) ? r : [r]; return tv(ds.map((x) => lay(x, duong)).filter((x) => typeof x === 'number')) }
const COT = [
  ['lan10s.fps', 'FPS 10 s lăn', 1], ['lan10s.p95', 'p95 khung (ms)', -1], ['lan10s.p99', 'p99 khung (ms)', -1], ['lan10s.tren33', 'khung > 33 ms', -1],
  ['dangLan.fps', 'FPS lúc bi lăn', 1], ['dangLan.p95', 'p95 lúc bi lăn', -1],
  ['lan10s.cpu', 'CPU luồng chính lúc lăn (%)', -1], ['lan10s.taskDaiSo', 'tác vụ dài > 50 ms', -1], ['lan10s.taskDaiMs', 'tổng tác vụ dài (ms)', -1],
  ['yen3s.cpu', 'CPU lúc nhắm đứng yên (%)', -1], ['keoGay.p50', 'kéo gậy → vẽ p50 (ms)', -1], ['keoGay.p95', 'kéo gậy → vẽ p95 (ms)', -1],
  ['vaoBanMs', 'bấm → bàn chơi được (ms)', -1], ['heapSauLanMB', 'JS heap sau lăn (MB)', -1],
]
for (const ks of Object.keys(a.kichBan)) {
  console.log(`\n**${ks}** (trung vị ${Array.isArray(a.kichBan[ks]) ? a.kichBan[ks].length : 1} lần${b ? ` / ${Array.isArray(b.kichBan[ks]) ? b.kichBan[ks].length : 1} lần` : ''})\n`)
  console.log(b ? '| Số đo | Trước | Sau | Đổi |\n|---|---:|---:|---:|' : '| Số đo | Giá trị |\n|---|---:|')
  for (const [duong, ten, huong] of COT) {
    const x = trungVi(a, ks, duong)
    if (!b) { console.log(`| ${ten} | ${x} |`); continue }
    const y = b.kichBan[ks] ? trungVi(b, ks, duong) : NaN
    const doi = !isFinite(x) || !isFinite(y) ? '' : huong > 0 ? (x ? `×${(y / x).toFixed(2)}` : '') : (y ? `÷${(x / y).toFixed(2)}` : x ? '→ 0' : '')
    console.log(`| ${ten} | ${x} | ${y} | ${doi} |`)
  }
}
