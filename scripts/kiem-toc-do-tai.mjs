// CỔNG TỐC ĐỘ TẢI APP — chạy NGAY SAU `npm run build`, TRƯỚC khi đẩy.
//
// Luật thường trực (thầy 13/10): "Khi bạn sửa bất kì cái gì thì luôn phải đảm bảo sau khi sửa xong tốc độ load app và tốc độ máy chủ phải nhanh hơn".
// Đo SỐ BYTE PHẢI TẢI ĐỂ MỞ từng app (nén gzip như khi gửi qua mạng): tệp mã vào cửa (`index.html`) + mọi tệp nó nạp tĩnh + phần riêng của app
// (khối mã màn chính của app và mọi tệp khối ấy nạp tĩnh) + tệp kiểu (CSS) đi kèm. So với mốc `docs/moc-toc-do.json` (đo trên bản đang chạy thật):
// lớn hơn mốc quá DUNG_SAI ⇒ thoát mã 1 (đỏ, không đẩy). Nhỏ hơn ⇒ in gợi ý HẠ mốc (mốc chỉ hạ, không nâng).
// Cách dùng: `node scripts/kiem-toc-do-tai.mjs` (so mốc) · `node scripts/kiem-toc-do-tai.mjs --in` (chỉ in số đo, dạng JSON).
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const GOC = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = resolve(GOC, 'dist')
const ASSETS = resolve(DIST, 'assets')
/** Dung sai 1 KB nén cho mỗi app (~1 ms trên mạng 4G) — chỗ cho một dòng chữ / một luật kiểu; hơn thế phải bù ở chỗ khác. */
const DUNG_SAI = 1024
/** Khối mã màn chính của từng app (tên tệp trước dấu "-<băm>"). */
const APP = { 'giao-vien': ['App'], 'hoc-sinh': ['AppHocSinh', 'StudentPortalScreen'], 'phu-huynh': ['ParentPortalScreen'] }

if (!existsSync(resolve(DIST, 'index.html'))) { console.error('Chưa có dist/index.html. Chạy trước: npm run build'); process.exit(2) }
const tep = readdirSync(ASSETS)
const coBam = (ten) => tep.filter((t) => t.replace(/-[A-Za-z0-9_]{6,}\.(js|css)$/, '') === ten)
const nen = new Map()
const kichCo = (t) => { if (!nen.has(t)) { const b = readFileSync(resolve(ASSETS, t)); nen.set(t, gzipSync(b, { level: 9 }).length) } return nen.get(t) }
/** Đóng tĩnh: tệp + mọi tệp nó `import` tĩnh (không tính `import()` động — nạp khi bấm). */
function dong(dau) {
  const da = new Set(), hang = [...dau]
  while (hang.length) {
    const t = hang.pop()
    if (da.has(t) || !existsSync(resolve(ASSETS, t))) continue
    da.add(t)
    if (!t.endsWith('.js')) continue
    const ma = readFileSync(resolve(ASSETS, t), 'utf8')
    for (const m of ma.matchAll(/(?:\bfrom\s*|\bimport\s*)["']\.\/([^"']+\.js)["']/g)) hang.push(m[1])
  }
  return da
}
const html = readFileSync(resolve(DIST, 'index.html'), 'utf8')
const vao = [...html.matchAll(/(?:src|href)="\/assets\/([^"]+\.(?:js|css))"/g)].map((m) => m[1])
const chung = dong(vao)
const so = {}
for (const [app, ds] of Object.entries(APP)) {
  const rieng = ds.flatMap(coBam)
  if (!rieng.some((t) => t.endsWith('.js'))) { console.error(`Không thấy khối mã ${ds.join('/')} trong dist/assets — sửa bảng APP trong ${fileURLToPath(import.meta.url)}`); process.exit(2) }
  const tat = new Set([...chung, ...dong(rieng)])
  so[app] = { tep: tat.size, gzip: [...tat].reduce((s, t) => s + kichCo(t), 0) }
}
if (process.argv.includes('--in')) { console.log(JSON.stringify(so)); process.exit(0) }
const moc = JSON.parse(readFileSync(resolve(GOC, 'docs/moc-toc-do.json'), 'utf8')).taiApp ?? {}
const kb = (n) => `${(n / 1024).toFixed(1)} KB`
let do_ = 0
for (const [app, s] of Object.entries(so)) {
  const m = moc[app]
  if (!m) { console.error(`✗ thiếu mốc taiApp.${app} trong docs/moc-toc-do.json`); do_++; continue }
  const lech = s.gzip - m.gzip
  const dong1 = `${app}: ${kb(s.gzip)} nén, ${s.tep} tệp (mốc ${kb(m.gzip)}, ${lech >= 0 ? '+' : ''}${(lech / 1024).toFixed(1)} KB)`
  if (lech > DUNG_SAI) { console.error(`✗ CHẬM HƠN — ${dong1}`); do_++ }
  else console.log(`${lech < 0 ? '✓ nhanh hơn' : '✓ bằng mốc'} — ${dong1}`)
}
if (do_) { console.error('Tải app CHẬM HƠN bản trước — làm nhẹ lại (tách khối nạp khi bấm, bỏ phần thừa) rồi mới đẩy.'); process.exit(1) }
if (Object.entries(so).some(([a, s]) => moc[a] && s.gzip < moc[a].gzip - DUNG_SAI)) console.log('Gợi ý: hạ mốc taiApp trong docs/moc-toc-do.json bằng số trên.')
