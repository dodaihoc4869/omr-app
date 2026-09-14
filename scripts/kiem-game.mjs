/**
 * CỔNG TĨNH của game Giải Cứu Công Chúa. Chạy: node scripts/kiem-game.mjs
 * Bỏ qua dòng chú thích — cổng phải soi MÃ, không soi lời văn.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const THU_MUC = 'src/game/giai-cuu-cong-chua'
const VO = 'src/components/GiaiCuuCongChuaGame.tsx'
const loi = []
const bao = []

/** Bỏ chú thích // và /* *​/ rồi mới soi. */
function chiMa(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((d) => !d.trim().startsWith('//')).join('\n')
}

const tep = readdirSync(THU_MUC).filter((f) => f.endsWith('.ts')).map((f) => join(THU_MUC, f))
const tatCa = [...tep, VO]

// 1 · Math.random CHỈ ở hieu-ung.ts
for (const f of tatCa) {
  if (f.endsWith('hieu-ung.ts')) continue
  if (/Math\.random/.test(chiMa(readFileSync(f, 'utf8')))) loi.push(`${f}: dùng Math.random ngoài hieu-ung.ts`)
}
bao.push('Math.random chỉ ở hieu-ung.ts')

// 2 · không CDN, không tệp ảnh/âm thanh
for (const f of tatCa) {
  const m = chiMa(readFileSync(f, 'utf8'))
  if (/src=["']https?:|from ["']https?:|cdnjs|jsdelivr|unpkg/.test(m)) loi.push(`${f}: gọi ra CDN`)
  if (/\.(png|jpg|jpeg|webp|gif|svg|mp3|ogg|wav|opus)["')]/.test(m)) loi.push(`${f}: tham chiếu tệp ảnh/âm thanh`)
}
bao.push('không CDN, không tệp ảnh/âm thanh')

// 3 · không rò dữ liệu học sinh
for (const f of tatCa) {
  const m = chiMa(readFileSync(f, 'utf8'))
  const x = m.match(/\b(sbd|hoTen|BangDiem|soDienThoai)\b|dulieu\.json/i)
  if (x) loi.push(`${f}: nhắc tới dữ liệu học sinh (${x[0]})`)
}
bao.push('không rò dữ liệu học sinh')

// 4 · vòng lặp game không gọi setState
for (const f of tep) {
  if (/setState|useState/.test(chiMa(readFileSync(f, 'utf8')))) loi.push(`${f}: mã game import React state`)
}
bao.push('mã game không đụng React state')

// 5 · một nguồn sự thật: chỉ hoa-chat.ts được liệt kê 12 công thức
for (const f of tep) {
  if (f.endsWith('hoa-chat.ts')) continue
  const m = chiMa(readFileSync(f, 'utf8'))
  if (/ct:\s*['"]/.test(m)) loi.push(`${f}: khai lại bảng hoá chất ngoài hoa-chat.ts`)
}
bao.push('một nguồn sự thật cho bảng hoá chất')

// 6 · Đấu Trường đã xoá sạch
if (existsSync('src/game/dau-truong-hoa-chat')) loi.push('src/game/dau-truong-hoa-chat vẫn còn')
if (existsSync('src/components/DauTruongGame.tsx')) loi.push('DauTruongGame.tsx vẫn còn')
bao.push('Đấu Trường đã xoá sạch')

for (const b of bao) console.log('  ✓ ' + b)
if (loi.length) { console.error('\nTRƯỢT:'); for (const l of loi) console.error('  ✗ ' + l); process.exit(1) }
console.log('\nCỔNG TĨNH: ĐẠT')
