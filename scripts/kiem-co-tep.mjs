#!/usr/bin/env node
// Cổng «tệp mã không được to thêm» (02/11, thầy duyệt đề xuất dọn mã). Đo theo BYTE, không theo dòng — đo dòng thì người sửa dồn mã vào một dòng để lách.
// - Tệp mã (src/**/*.ts|tsx|css, server/src/**/*.ts) vượt NGUONG byte phải có mốc riêng trong docs/moc-co-tep.json; mốc CHỈ HẠ.
// - Tệp có mốc được lớn hơn mốc tối đa DU byte (sửa lỗi nhỏ vẫn qua); vượt nữa ⇒ đỏ: tách bớt sang tệp mới rồi mới đẩy.
// - Tệp mới vượt NGUONG (chưa có mốc) ⇒ đỏ. Tệp có mốc mà nhỏ đi / xoá ⇒ chạy `node scripts/kiem-co-tep.mjs --ha` để hạ mốc.
import { execFileSync } from 'node:child_process'
import { readFileSync, statSync, writeFileSync } from 'node:fs'

const NGUONG = 60 * 1024
const DU = 2 * 1024
const MOC = 'docs/moc-co-tep.json'
const ha = process.argv.includes('--ha')

const tep = execFileSync('git', ['ls-files', 'src/*.ts', 'src/*.tsx', 'src/*.css', 'server/src/*.ts'], { encoding: 'utf8' })
  .split('\n').filter(Boolean)
const co = new Map()
for (const t of tep) { try { co.set(t, statSync(t).size) } catch { /* tệp đã xoá khỏi đĩa nhưng còn trong chỉ mục */ } }

const moc = JSON.parse(readFileSync(MOC, 'utf8'))
const tepMoc = moc.tep ?? {}
const loi = []
for (const [t, b] of co) {
  if (b <= NGUONG) continue
  const m = tepMoc[t]
  if (m === undefined) loi.push(`✗ ${t}: ${b} B > ngưỡng ${NGUONG} B, chưa có mốc — tách nhỏ (tệp mới không được vượt ngưỡng)`)
  else if (b > m + DU) loi.push(`✗ ${t}: ${b} B > mốc ${m} B + ${DU} B — tách bớt sang tệp khác rồi mới đẩy`)
}

if (ha) {
  let doi = 0
  for (const [t, m] of Object.entries(tepMoc)) {
    const b = co.get(t)
    if (b === undefined || b <= NGUONG) { delete tepMoc[t]; doi++ }
    else if (b < m) { tepMoc[t] = b; doi++ }
  }
  moc.tep = Object.fromEntries(Object.entries(tepMoc).sort((a, b) => b[1] - a[1]))
  writeFileSync(MOC, JSON.stringify(moc, null, 2) + '\n')
  console.log(`Đã HẠ ${doi} mốc trong ${MOC}.`)
}

const vuot = [...co].filter(([, b]) => b > NGUONG).length
if (loi.length) {
  console.error(loi.join('\n'))
  console.error(`kiem-co-tep: ${loi.length} tệp vượt (ngưỡng ${NGUONG / 1024} KB, dư ${DU / 1024} KB trên mốc).`)
  process.exit(1)
}
console.log(`kiem-co-tep: 0 vi phạm · ${vuot} tệp lớn hơn ${NGUONG / 1024} KB đang giữ mốc (chỉ hạ).`)
