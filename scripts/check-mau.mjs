// Kiểm tra "một nguồn sự thật" cho màu (MANCUAVAOVANENTOI.md mục 1): ngoài
// src/styles/tokens.css KHÔNG được có mã màu "#rrggbb" nào trong src/.
// Chạy: npm run check:mau — CI cũng chạy, sót là build đỏ.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('../src', import.meta.url).pathname
const CHO_PHEP = new Set(['styles/tokens.css'])
const HEX = /#[0-9a-fA-F]{3,8}\b/g
// bỏ qua: id URL fragment kiểu "#root", tham chiếu React key… — chỉ bắt chuỗi hex thuần
const loi = []

function duyet(dir) {
  for (const ten of readdirSync(dir)) {
    const p = join(dir, ten)
    if (statSync(p).isDirectory()) duyet(p)
    else if (/\.(tsx?|css)$/.test(ten)) {
      const rel = relative(ROOT, p)
      if (CHO_PHEP.has(rel)) continue
      const dong = readFileSync(p, 'utf8').split('\n')
      dong.forEach((d, i) => {
        const m = d.match(HEX)
        if (m) loi.push(`${rel}:${i + 1}: ${m.join(' ')}`)
      })
    }
  }
}
duyet(ROOT)
if (loi.length) {
  console.error(`❌ ${loi.length} mã màu nằm ngoài tokens.css:\n` + loi.join('\n'))
  process.exit(1)
}
console.log('✅ Không có mã màu # nào ngoài src/styles/tokens.css')
