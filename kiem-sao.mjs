// PHÉP KIỂM 1–3 của đặc tả CA-THI-VA-GOI-LEN-BANG mục 8: sao đi từ kho lên app.
// Chạy: KHO=kho-de/nhe npx tsx kiem-sao.mjs
import { readFileSync, readdirSync } from 'node:fs'
const dir = process.env.KHO || 'kho-de/nhe'
const { parseKhoDeJsonText, buildTeacherSourceFromKhoDe } = await import('./src/lib/exam-kho-de-import.ts')
const { mergeAndStrip, soSao } = await import('./src/data/examContent.ts')
const { dungUngVien } = await import('./src/lib/rut-de.ts')

const files = readdirSync(dir).filter((x) => x.endsWith('.json')).sort()
const nguon = []
let tongCau = 0, coCanChua = 0, loi = 0
const demSao = { 0: 0, 1: 0, 2: 0 }
const demGoc = { 0: 0, 1: 0, 2: 0 }

for (const f of files) {
  const raw = readFileSync(`${dir}/${f}`, 'utf8')
  // Đếm THẲNG trên kho, không qua app — đây là con số đối chứng.
  for (const c of JSON.parse(raw).cau) {
    const s = c.can_chua && [0, 1, 2].includes(c.can_chua.sao) ? c.can_chua.sao : 0
    demGoc[s]++
  }
  const p = parseKhoDeJsonText(raw)
  if (!p.ok) { console.log(`${f} PARSE LỖI:`, p.errors.slice(0, 3)); loi++; continue }
  const r = buildTeacherSourceFromKhoDe(p.json)
  loi += r.errors.length
  nguon.push(r.source)
  for (const q of [...r.source.phanI, ...r.source.phanII, ...r.source.phanIII]) {
    tongCau++
    if (q.canChua) coCanChua++
    demSao[soSao(q)]++
  }
}

console.log(`Đề nạp được : ${nguon.length}/${files.length}   lỗi build: ${loi}`)
console.log(`PHÉP KIỂM 1 — câu có canChua sau khi nạp : ${coCanChua}/${tongCau}`)
console.log(`PHÉP KIỂM 2 — đếm sao qua app  : 2★ ${demSao[2]} · 1★ ${demSao[1]} · 0★ ${demSao[0]}`)
console.log(`              đếm sao thẳng kho: 2★ ${demGoc[2]} · 1★ ${demGoc[1]} · 0★ ${demGoc[0]}`)
const khop = demSao[0] === demGoc[0] && demSao[1] === demGoc[1] && demSao[2] === demGoc[2]
console.log(`              KHỚP: ${khop ? 'CÓ' : 'KHÔNG'}`)

const goi = JSON.stringify(mergeAndStrip(nguon))
console.log(`PHÉP KIỂM 3 — gói gửi máy chủ chứa "canChua": ${goi.includes('canChua') ? 'CÓ (SAI)' : 'KHÔNG (đúng)'}`)
console.log(`              gói cũng không chứa loiGiai/chuyenDe: ${!goi.includes('loiGiai') && !goi.includes('chuyenDe') ? 'đúng' : 'SAI'}`)

const uv = dungUngVien(nguon)
const saoUv = [...uv.I, ...uv.II, ...uv.III].reduce((s, c) => s + c.sao, 0)
const saoNguon = demSao[1] + demSao[2] * 2
console.log(`Phụ — tổng sao trong ứng viên rút đề: ${saoUv} (kỳ vọng ${saoNguon}) ${saoUv === saoNguon ? 'OK' : 'LỆCH'}`)

const hong = coCanChua !== tongCau || !khop || goi.includes('canChua') || saoUv !== saoNguon
process.exit(hong ? 1 : 0)
