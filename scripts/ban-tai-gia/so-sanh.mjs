// SO SÁNH HAI BẢN ĐO (Code 1, 21/09/2026; Boss: "chạy lại sau mỗi gói của Code 3 để chứng minh giảm"). Dùng:
//   node scripts/ban-tai-gia/so-sanh.mjs <mã cũ> <mã mới>      (đọc docs/do-tai-d1/ban-tai-<mã>.json; ghi docs/do-tai-d1/so-sanh-<cũ>-<mới>.md)
// Mỗi lệnh: truy vấn TB và dòng đọc TB trước → sau, % đổi; tổng cộng; lệnh mới VƯỢT / hết vượt ngân sách. Số của HAI lần chạy cùng kịch bản, cùng em giả, cùng bản sao lưu mới so sánh được — kiểm `cauHinh` giống nhau.
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = join(dirname(fileURLToPath(import.meta.url)), '../..')
const [cu, moi] = process.argv.slice(2)
if (!cu || !moi) { console.error('Dùng: node scripts/ban-tai-gia/so-sanh.mjs <mã cũ> <mã mới>'); process.exit(1) }
const doc = (ma) => JSON.parse(readFileSync(join(REPO, `docs/do-tai-d1/ban-tai-${ma}.json`), 'utf8'))
const a = doc(cu), b = doc(moi)
const phanTram = (x, y) => (x === 0 ? (y === 0 ? '0 %' : '+∞') : `${y >= x ? '+' : ''}${(((y - x) / x) * 100).toFixed(0)} %`)
const so = (x) => Math.round(x).toLocaleString('vi-VN')
const mapA = new Map(a.theoLenh.map((x) => [x.lenh, x]))
const mapB = new Map(b.theoLenh.map((x) => [x.lenh, x]))
const lenh = [...new Set([...mapA.keys(), ...mapB.keys()])]
const tong = (m, k) => [...m.values()].reduce((t, x) => t + x[k] * x.n, 0)
const dong = []
const P = (s = '') => dong.push(s)
P(`# So sánh bản đo tải giả: ${cu} → ${moi}`)
P()
const khac = []
for (const k of ['soEm', 'phut', 'nhanh', 'saoLuu', 'treD1Ms']) if (String(a.cauHinh[k] ?? 0) !== String(b.cauHinh[k] ?? 0)) khac.push(`${k}: ${a.cauHinh[k] ?? 0} ≠ ${b.cauHinh[k] ?? 0}`)
if (khac.length) P(`⚠️ Cấu hình KHÁC nhau (so sánh chỉ mang tính tham khảo): ${khac.join(' · ')}`)
else P(`Cùng kịch bản: ${a.cauHinh.soEm} em × ${a.cauHinh.phut} phút, cùng bản sao lưu \`${a.cauHinh.saoLuu}\`.`)
P()
const tvA = tong(mapA, 'tvTb'), tvB = tong(mapB, 'tvTb'), dA = tong(mapA, 'docTb'), dB = tong(mapB, 'docTb')
P(`- **Tổng truy vấn D1:** ${so(tvA)} → ${so(tvB)} (${phanTram(tvA, tvB)})`)
P(`- **Tổng dòng đọc:** ${so(dA)} → ${so(dB)} (${phanTram(dA, dB)})`)
const vA = a.theoLenh.filter((x) => x.vuot).length, vB = b.theoLenh.filter((x) => x.vuot).length
P(`- **Lệnh vượt ngân sách:** ${vA} → ${vB}`)
P()
P('| Lệnh | Truy vấn TB | Δ | Dòng đọc TB | Δ | Dòng ghi TB | p50→p95 ms (cũ / mới) | Vượt |')
P('|---|---|---:|---|---:|---|---|---|')
for (const k of lenh.sort((x, y) => ((mapA.get(y)?.docTb ?? 0) * (mapA.get(y)?.n ?? 0)) - ((mapA.get(x)?.docTb ?? 0) * (mapA.get(x)?.n ?? 0)))) {
  const x = mapA.get(k), y = mapB.get(k)
  const vuot = `${x ? (x.vuot ? '❌' : '✅') : '—'} → ${y ? (y.vuot ? '❌' : '✅') : '—'}`
  P(`| \`${k}\` | ${x ? x.tvTb.toFixed(1) : '—'} → ${y ? y.tvTb.toFixed(1) : '—'} | ${x && y ? phanTram(x.tvTb, y.tvTb) : ''} | ${x ? so(x.docTb) : '—'} → ${y ? so(y.docTb) : '—'} | ${x && y ? phanTram(x.docTb, y.docTb) : ''} | ${x ? (x.ghiTb ?? '—') : '—'} → ${y ? (y.ghiTb ?? '—') : '—'} | ${x ? `${so(x.ms50)}→${so(x.ms95)}` : '—'} / ${y ? `${so(y.ms50)}→${so(y.ms95)}` : '—'} | ${vuot} |`)
}
P()
writeFileSync(join(REPO, `docs/do-tai-d1/so-sanh-${cu}-${moi}.md`), dong.join('\n') + '\n')
console.log(`Đã ghi docs/do-tai-d1/so-sanh-${cu}-${moi}.md`)
