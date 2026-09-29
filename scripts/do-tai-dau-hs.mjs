#!/usr/bin/env node
// ĐO LƯỢT TẢI ĐẦU APP HỌC SINH (/hs) từ `dist/` (chạy SAU `npm run build`).
//
// Lượt tải đầu = những gì index.html kéo ngay (script vào + modulepreload + stylesheet)
// + mảnh StudentPortalScreen và mọi mảnh nó cần (danh sách __vite__mapDeps mà mảnh vào gắn cho lời gọi import())
// + KaTeX (main.tsx nạp NGAY khi vai là học sinh).
// In: số tệp JS/CSS, tổng KB thô, tổng KB gzip. Dùng để so trước/sau khi tối ưu cho máy yếu.
//
//   node scripts/do-tai-dau-hs.mjs            # bảng ngắn
//   node scripts/do-tai-dau-hs.mjs --chi-tiet # thêm 15 tệp nặng nhất
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const DIST = process.argv.find((a) => a.startsWith('--dist='))?.slice(7) || 'dist'
const html = readFileSync(join(DIST, 'index.html'), 'utf8')
const tep = new Set()
for (const m of html.matchAll(/(?:src|href)="\/?(assets\/[^"]+\.(?:js|css))"/g)) tep.add(m[1])

const vao = [...tep].find((t) => /assets\/index-[^/]+\.js$/.test(t))
const maVao = readFileSync(join(DIST, vao), 'utf8')
const mangF = maVao.match(/m\.f=\[([^\]]*)\]/)
const dsDeps = mangF ? [...mangF[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]) : []

// Tìm mọi mảnh mà mảnh vào gọi import() kèm danh sách phụ thuộc, lấy những mảnh có tên khớp.
function themTheoTen(tenMau) {
  const tim = new RegExp('import\\(`\\./(' + tenMau + '-[A-Za-z0-9_-]+\\.js)`\\)(?:(?!import\\()[\\s\\S]){0,800}?__vite__mapDeps\\(\\[([0-9,]+)\\]\\)', 'g')
  let thay = false
  for (const m of maVao.matchAll(tim)) {
    thay = true
    tep.add('assets/' + m[1])
    for (const i of m[2].split(',')) tep.add(dsDeps[Number(i)])
  }
  // Có thể lời gọi nằm ở mảnh khác (vd chem-format) — quét mọi tệp đã có.
  if (!thay) {
    for (const t of [...tep].filter((x) => x.endsWith('.js'))) {
      const ma = readFileSync(join(DIST, t), 'utf8')
      const f = ma.match(/m\.f=\[([^\]]*)\]/)
      const ds = f ? [...f[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : []
      for (const m of ma.matchAll(tim)) {
        tep.add('assets/' + m[1])
        for (const i of m[2].split(',')) tep.add(ds[Number(i)])
      }
    }
  }
}
themTheoTen('StudentPortalScreen')
themTheoTen('katex-goi')

// Khép kín theo import tĩnh (phòng mảnh con không được liệt kê).
let doi = true
while (doi) {
  doi = false
  for (const t of [...tep].filter((x) => x.endsWith('.js'))) {
    const ma = readFileSync(join(DIST, t), 'utf8')
    for (const m of ma.matchAll(/(?:^|[;}\n])\s*import\s*(?:[^'"`()]*?from\s*)?["'`]\.\/([^"'`]+\.js)["'`]/g)) {
      const p = 'assets/' + m[1]
      if (!tep.has(p)) { tep.add(p); doi = true }
    }
  }
}

const hang = [...tep].map((t) => {
  const b = readFileSync(join(DIST, t))
  return { t, tho: b.length, gz: gzipSync(b, { level: 9 }).length }
})
const cong = (loc) => hang.filter(loc).reduce((a, h) => ({ n: a.n + 1, tho: a.tho + h.tho, gz: a.gz + h.gz }), { n: 0, tho: 0, gz: 0 })
const kb = (x) => (x / 1024).toFixed(1)
const js = cong((h) => h.t.endsWith('.js'))
const css = cong((h) => h.t.endsWith('.css'))
console.log(`Tải đầu /hs: JS ${js.n} tệp ${kb(js.tho)} KB (gzip ${kb(js.gz)}) · CSS ${css.n} tệp ${kb(css.tho)} KB (gzip ${kb(css.gz)}) · TỔNG ${js.n + css.n} tệp ${kb(js.tho + css.tho)} KB (gzip ${kb(js.gz + css.gz)})`)
if (process.argv.includes('--chi-tiet')) {
  for (const h of hang.sort((a, b) => b.tho - a.tho).slice(0, 15)) console.log(`  ${kb(h.tho).padStart(7)} KB  gz ${kb(h.gz).padStart(6)}  ${h.t}`)
}
const tatCa = readdirSync(join(DIST, 'assets')).length
console.log(`(dist/assets: ${tatCa} tệp)`)
