#!/usr/bin/env node
// DỰNG TÀI SẢN cho bản vẽ giao diện v2 (02/11) — chạy lại khi Mol hoặc bộ biểu tượng đổi:
//   node docs/ban-ve-giao-dien-v2-0211/dung.mjs [đường dẫn @phosphor-icons/core/assets]
// 1) Mol: gọi ĐÚNG hàm svgMol của mã thật (src/components/linh-vat/mol-dong.ts, gói bằng esbuild) ⇒ tai-san.js (window.MOL_MAT) — không vẽ lại tay,
//    dáng / màu / cảm xúc y Mol đang chạy; chép src/styles/mol.css ⇒ mol.css (bản sao để trang vẽ tự chứa, nguồn gốc vẫn là src/).
// 2) Biểu tượng: chép SVG Phosphor (MIT) đang dùng vào bieu-tuong/ + gộp vào tai-san.js (window.BIEU_TUONG).
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { build } from 'esbuild'

const DAY = import.meta.dirname
const GOC = resolve(DAY, '../..')
const ICON = process.argv[2]
// Bộ biểu tượng — MỘT bộ Phosphor: Fill (đặc) cho nút / trạng thái, Duotone (hai lớp) cho nhãn / chip; X đóng dùng Bold.
const DUNG = [
  'x-bold', 'atom-duotone', 'fire-fill', 'lightbulb-fill', 'check-circle-fill', 'x-circle-fill', 'check-bold', 'book-open-duotone',
  'chat-circle-dots-duotone', 'backspace-fill', 'flask-duotone', 'list-checks-duotone', 'calculator-duotone', 'sparkle-fill', 'lightning-fill',
  'target-duotone', 'flag-duotone', 'arrow-right-bold', 'lock-simple-fill', 'speaker-high-fill', 'star-fill', 'trophy-duotone', 'calendar-check-duotone', 'lightbulb-bold',
]
if (ICON) {
  for (const t of DUNG) {
    const [ten, ...kieu] = t.split('-'), k = kieu.pop()
    const nguon = join(ICON, k, `${[ten, ...kieu].join('-')}-${k}.svg`)
    if (!existsSync(nguon)) throw new Error(`thiếu ${nguon}`)
    copyFileSync(nguon, join(DAY, 'bieu-tuong', `${t}.svg`))
  }
  copyFileSync(join(ICON, '..', 'LICENSE'), join(DAY, 'bieu-tuong', 'LICENSE-phosphor.txt'))
}
const BIEU_TUONG = Object.fromEntries(DUNG.map((t) => [t, readFileSync(join(DAY, 'bieu-tuong', `${t}.svg`), 'utf8').replace(/^<svg[^>]*>|<\/svg>\s*$/g, '')]))

const goi = await build({
  stdin: { contents: `export { svgMol, VIEWBOX_MOL } from './src/components/linh-vat/mol-dong.ts'`, resolveDir: GOC, loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'neutral', loader: { '.css': 'empty' }, logLevel: 'error',
})
const { svgMol, VIEWBOX_MOL } = await import(`data:text/javascript;base64,${Buffer.from(goi.outputFiles[0].text).toString('base64')}`)
const MAT = ['vui', 'khen', 'chao', 'nghi', 'ngac', 'buon', 'ngu', 'doi', 'buc', 'cau', 'ratCau', 'nguong', 'me', 'nhay', 'tuTin']
const MOL_MAT = Object.fromEntries(MAT.map((m) => [m, svgMol(m).replace(/\s*\n\s*/g, ' ')]))
writeFileSync(join(DAY, 'tai-san.js'), `// TỰ SINH bởi dung.mjs — đừng sửa tay. Mol = svgMol() của src/components/linh-vat/mol-dong.ts; biểu tượng = Phosphor (MIT).\n` +
  `window.MOL_VIEWBOX = ${JSON.stringify(VIEWBOX_MOL)};\nwindow.MOL_MAT = ${JSON.stringify(MOL_MAT)};\nwindow.BIEU_TUONG = ${JSON.stringify(BIEU_TUONG)};\n`)
copyFileSync(join(GOC, 'src/styles/mol.css'), join(DAY, 'mol.css'))
console.log('tai-san.js', (readFileSync(join(DAY, 'tai-san.js')).length / 1024).toFixed(1), 'KB ·', MAT.length, 'mặt Mol ·', DUNG.length, 'biểu tượng')
