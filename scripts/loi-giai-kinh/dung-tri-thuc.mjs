#!/usr/bin/env node
// Dựng dữ liệu tri thức cho máy soạn Lời giải Kính từ skill lý thuyết của thầy (docs/skill-ly-thuyet-thay/SKILL.md).
// Ra server/src/kinh-tri-thuc-du-lieu.ts: THAN_CHU (bảng thần chú soát tay) + MUC (mỗi mục kiến thức: bài, tên, bước, mẹo, hay nhầm, thầy nói).
// Bỏ mã video (thầy 02/11: không trích dẫn video). Chạy lại khi skill đổi: node scripts/loi-giai-kinh/dung-tri-thuc.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const s = fs.readFileSync(path.join(GOC, 'docs/skill-ly-thuyet-thay/SKILL.md'), 'utf8')
const dong = s.split('\n')
// 1) bảng thần chú
const thanChu = []
let trongBang = false
for (const d of dong) {
  if (d.startsWith('## Bộ thần chú')) { trongBang = true; continue }
  if (trongBang && d.startsWith('## ')) break
  if (!trongBang || !d.startsWith('| **')) continue
  const o = d.split('|').map((x) => x.trim())
  const m = o[1].match(/^\*\*(.+?)\*\*\s*(.*)$/)
  if (!m) continue
  thanChu.push({ chu: m[1], them: m[2].replace(/^\(|\)$/g, ''), dung: o[2], goc: o[3].replace(/\s*·\s*/, ' · ') })
}
// 2) mục kiến thức
const muc = []
let bai = '', cur = null
const dongMuc = () => { if (cur) { muc.push(cur); cur = null } }
for (const d of dong) {
  const h2 = d.match(/^## (.+?)(?:\s*\(`[^`]+`\))?\s*$/)
  if (h2 && !d.startsWith('## Bộ thần chú') && !/^## (Khi nào|Cách dùng|Phong cách|PHONG CÁCH|Mục lục)/.test(d)) { dongMuc(); bai = h2[1].trim(); continue }
  if (/^# /.test(d)) { dongMuc(); continue }
  const h3 = d.match(/^### (.+)$/)
  if (h3 && bai) { dongMuc(); cur = { bai, ten: h3[1].trim(), buoc: [], meo: '', nham: '', noi: [] }; continue }
  if (!cur) continue
  const b = d.match(/^\d+\.\s+(.+)$/)
  if (b) { cur.buoc.push(b[1].trim()); continue }
  if (d.startsWith('- Mẹo:')) cur.meo = d.slice(6).trim()
  else if (d.startsWith('- Hay nhầm:')) cur.nham = d.slice(11).trim()
  else if (d.startsWith('- Thầy nói:')) cur.noi = d.slice(11).split(' / ').map((x) => x.trim()).filter(Boolean)
}
dongMuc()
const sach = muc.filter((m) => m.buoc.length || m.noi.length)
const tc = `// SINH TỰ ĐỘNG bởi scripts/loi-giai-kinh/dung-tri-thuc.mjs từ docs/skill-ly-thuyet-thay/SKILL.md — KHÔNG sửa tay.
// Bảng thần chú của thầy (soát tay từng câu trong skill). Máy chủ chỉ nhận thần chú có đúng trong bảng này.
export interface ThanChu { chu: string; them: string; dung: string; goc: string }
export const THAN_CHU: readonly ThanChu[] = ${JSON.stringify(thanChu, null, 1)}
`
fs.writeFileSync(path.join(GOC, 'server/src/kinh-than-chu.ts'), tc)
fs.writeFileSync(path.join(GOC, 'scripts/loi-giai-kinh/tri-thuc.json'), JSON.stringify({ thanChu, muc: sach }))
// App học sinh: thần chú kèm «dùng khi» (thầy 03/11 «đẹp như bản mẫu» — hộp thần chú có dòng giải thích dưới chữ thần chú). Nằm trong mảnh nạp lười Lời giải Kính.
fs.writeFileSync(path.join(GOC, 'src/lib/loi-giai-kinh/than-chu-dung.ts'), `// SINH TỰ ĐỘNG bởi scripts/loi-giai-kinh/dung-tri-thuc.mjs — KHÔNG sửa tay.
export const THAN_CHU_DUNG: Readonly<Record<string, string>> = ${JSON.stringify(Object.fromEntries(thanChu.map((t) => [t.chu, [t.them, t.dung].filter(Boolean).join(' · ')])), null, 1)}
`)
console.log('thần chú', thanChu.length, '· mục', sach.length, '· bài', new Set(sach.map((m) => m.bai)).size)
