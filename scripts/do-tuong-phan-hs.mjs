#!/usr/bin/env node
// ĐO TƯƠNG PHẢN BẢNG MÀU «TƯƠI» APP HỌC SINH (thầy cho phép 27/10: «Màu sắc của app làm siêu tươi như dolingo»).
//   node scripts/do-tuong-phan-hs.mjs        → in bảng sáng + tối, thoát mã 1 nếu cặp nào dưới ngưỡng
// Đọc khối `:root[data-trong='hs'] { … }` (sáng) và khối cùng tên trong `@media (prefers-color-scheme: dark)` (tối) ở src/styles/trong.css,
// tính tỉ lệ tương phản WCAG 2.x cho các cặp chữ/nền thật sự dùng trong app học sinh. Ngưỡng: chữ thường ≥ 4,5 · chữ to/đậm (nút, huy hiệu) ≥ 3.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const rgb = (h) => { h = h.replace('#', ''); if (h.length === 3) h = [...h].map((x) => x + x).join(''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) }
const sang = (h) => { const [r, g, b] = rgb(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
export const tuongPhan = (a, b) => { const x = sang(a), y = sang(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }

function bien(khoi) {
  const ra = {}
  for (const m of khoi.matchAll(/(--tr-[\w-]+)\s*:\s*(#[0-9a-f]{3,8})\s*;/gi)) ra[m[1]] = m[2].toLowerCase()
  return ra
}
export function docBang(css) {
  const sangM = css.match(/^:root\[data-trong='hs'\]\s*\{([^}]*)\}/m)
  const toiM = css.match(/@media \(prefers-color-scheme: dark\)\s*\{\s*:root\[data-trong='hs'\]\s*\{([^}]*)\}/m)
  if (!sangM || !toiM) throw new Error('không thấy khối :root[data-trong=hs] sáng/tối trong trong.css')
  return { sang: bien(sangM[1]), toi: bien(toiM[1]) }
}

// [chữ, nền, ngưỡng, chỗ dùng]
export const CAP = [
  ['--tr-chu', '--tr-nen', 4.5, 'chữ chính / nền'], ['--tr-chu', '--tr-mat', 4.5, 'chữ chính / thẻ'], ['--tr-chu', '--tr-mat-2', 4.5, 'chữ chính / mặt phụ'],
  ['--tr-chu-2', '--tr-mat', 4.5, 'chữ phụ / thẻ'], ['--tr-chu-2', '--tr-mat-2', 4.5, 'chữ phụ / mặt phụ'],
  ['--tr-chu-3', '--tr-mat', 4.5, 'chữ mờ / thẻ'], ['--tr-chu-3', '--tr-nen', 4.5, 'chữ mờ / nền'],
  ['--tr-chu', '--tr-dung-nhat', 4.5, 'lời giải trên tấm đúng'], ['--tr-chu-2', '--tr-dung-nhat', 4.5, 'chữ phụ trên tấm đúng'],
  ['--tr-chu', '--tr-sai-nhat', 4.5, 'lời giải trên tấm sai'], ['--tr-chu-2', '--tr-sai-nhat', 4.5, 'chữ phụ trên tấm sai'],
  ['--tr-dung-chu', '--tr-dung-nhat', 4.5, 'tiêu đề «Chính xác!» / ô đúng'], ['--tr-dung-chu', '--tr-mat', 4.5, 'chữ xanh lá / thẻ'],
  ['--tr-sai-chu', '--tr-sai-nhat', 4.5, 'tiêu đề «Chưa đúng» / ô sai'], ['--tr-sai-chu', '--tr-mat', 4.5, 'chữ đỏ / thẻ'],
  ['--tr-tin-chu', '--tr-tin-nhat', 4.5, 'ô đang chọn (xanh dương)'], ['--tr-tin-chu', '--tr-mat', 4.5, 'nhãn xanh dương / thẻ'],
  ['--tr-chu-y-chu', '--tr-chu-y-nhat', 4.5, 'chữ cam / nền cam nhạt'], ['--tr-chu-y-chu', '--tr-mat', 4.5, 'chữ cam / thẻ'],
  ['--tr-sao-chu', '--tr-sao-nhat', 4.5, 'chuỗi ngày / nền vàng nhạt'], ['--tr-sao-chu', '--tr-mat', 4.5, 'số chuỗi / thẻ'],
  ['--tr-hs-chu', '--tr-hs-nhat', 4.5, 'chip / tab đang chọn'],
  ['--tr-hs-tren', '--tr-hs-nut', 3, 'chữ ĐẬM trên nút chính (KIỂM TRA, TIẾP TỤC)'],
  ['--tr-trang', '--tr-dung-nut', 3, 'chữ đậm trên huy hiệu xanh lá'], ['--tr-trang', '--tr-sai', 3, 'chữ đậm trên nút / huy hiệu đỏ'],
  ['--tr-trang', '--tr-tin-chu', 4.5, 'chữ trên nút xanh dương đậm'], ['--tr-trang', '--tr-chu-y-nut', 3, 'chữ đậm trên ô cam'],
]

export function doBang(bang) {
  return CAP.map(([c, n, nguong, cho]) => {
    if (!bang[c] || !bang[n]) return { c, n, nguong, cho, tp: 0, dat: false, thieu: true }
    const tp = tuongPhan(bang[c], bang[n])
    return { c, n, nguong, cho, mauC: bang[c], mauN: bang[n], tp, dat: tp >= nguong }
  })
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const bang = docBang(readFileSync(new URL('../src/styles/trong.css', import.meta.url), 'utf8'))
  let truot = 0
  for (const [ten, b] of [['SÁNG', bang.sang], ['TỐI', bang.toi]]) {
    console.log(`\n${ten}  | chữ | nền | tỉ lệ | ngưỡng | chỗ dùng`)
    for (const d of doBang(b)) {
      if (!d.dat) truot++
      console.log(`${d.dat ? 'đạt ' : 'TRƯỢT'} | ${d.c} ${d.mauC ?? '?'} | ${d.n} ${d.mauN ?? '?'} | ${d.tp.toFixed(2)} | ${d.nguong} | ${d.cho}`)
    }
  }
  console.log(`\n${truot ? truot + ' cặp TRƯỢT' : 'Tất cả cặp đạt ngưỡng'}`)
  process.exit(truot ? 1 : 0)
}
