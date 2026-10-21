// DỰNG MỤC LỤC KĨ THUẬT CỦA THẦY cho Hỏi Thầy (thầy 21/10: "skill giải bài theo phong cách của thầy … lấy ra để dùng cho chỗ hỏi thầy").
// Nguồn: docs/skill-giai-bai-phong-cach-thay/references/ky-thuat.md (skill claude.ai `giai-bai-phong-cach-thay`, chắt từ 314 video bài giảng).
// Ra: server/src/hoi-thay-ky-thuat-du-lieu.ts — mảng [chương, loại, chữ]; tên chất cũ trong phụ đề đổi sang danh pháp 2018; mục bị cắt cụt bỏ.
// Chạy lại khi skill đổi: node scripts/hoi-thay/dung-ky-thuat-thay.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const NGUON = 'docs/skill-giai-bai-phong-cach-thay/references/ky-thuat.md'
const DICH = 'server/src/hoi-thay-ky-thuat-du-lieu.ts'
// Tên cũ (phụ đề tự động / sách cũ) ⇒ danh pháp chương trình 2018. Chỉ đổi khi đứng thành một từ. Phần tử thứ ba = đuôi KHÔNG được đứng sau
// ("oxi hoá", "số oxi hoá" là thuật ngữ SGK, không phải nguyên tố ⇒ giữ nguyên).
const DOI = [
  ['amino axit', 'amino acid'], ['axit glutamic', 'glutamic acid'], ['axit axetic', 'acetic acid'], ['axit fomic', 'formic acid'], ['axit', 'acid'], ['bazơ', 'base'],
  ['amin', 'amine'], ['anilin', 'aniline'], ['arinamin', 'arylamine'], ['este', 'ester'], ['ancol', 'alcohol'], ['anđehit', 'aldehyde'], ['andehit', 'aldehyde'], ['xeton', 'ketone'],
  ['glucozơ', 'glucose'], ['fructozơ', 'fructose'], ['saccarozơ', 'saccharose'], ['mantozơ', 'maltose'], ['xenlulozơ', 'cellulose'], ['polime', 'polymer'], ['monome', 'monomer'],
  ['peptit', 'peptide'], ['polipeptit', 'polypeptide'], ['glyxin', 'glycine'], ['alanin', 'alanine'], ['lysin', 'lysine'], ['valin', 'valine'], ['glixerol', 'glycerol'],
  ['etyl', 'ethyl'], ['metyl', 'methyl'], ['axetat', 'acetate'], ['fomat', 'formate'], ['etanol', 'ethanol'], ['metanol', 'methanol'], ['benzen', 'benzene'], ['toluen', 'toluene'],
  ['etilen', 'ethylene'], ['axetilen', 'acetylene'], ['ankan', 'alkane'], ['anken', 'alkene'], ['ankin', 'alkyne'], ['ankađien', 'alkadiene'], ['brom', 'bromine'], ['clo', 'chlorine'],
  ['nitơ', 'nitrogen'], ['oxi', 'oxygen', '\\s*h[oó][aáà]?'], ['oxy', 'oxygen', '\\s*h[oó][aáà]?'], ['hiđro', 'hydrogen'], ['hidro', 'hydrogen'], ['cacbon', 'carbon'], ['photpho', 'phosphorus'], ['lưu huỳnh', 'sulfur'],
  ['oxit', 'oxide'], ['hiđroxit', 'hydroxide'], ['hidroxit', 'hydroxide'], ['diazoni', 'diazonium'], ['cacbohiđrat', 'carbohydrate'], ['cacbohidrat', 'carbohydrate']
]
const L = '\\p{L}\\p{M}\\d'
const doi = (s) => DOI.reduce((t, [cu, moi, khongSau]) => t.replace(new RegExp(`(?<![${L}])${cu}(?![${L}])${khongSau ? `(?!${khongSau})` : ''}`, 'giu'), moi), s)

const ra = []
let chuong = ''
for (const dong of readFileSync(NGUON, 'utf8').split('\n')) {
  const h = /^###\s+(.+?)\s*\(`[^`]+`\)\s*$/.exec(dong)
  if (h) { chuong = doi(h[1].replace(/^(\[\d{4}\]\s*-\s*)?\d{4}\s*-\s*/, '').trim()); continue }
  const m = /^-\s+(Kĩ thuật|Bài mẫu):\s+(.+)$/.exec(dong)
  if (!m || !chuong) continue
  const loai = m[1] === 'Kĩ thuật' ? 'k' : 'b'
  const muc = m[2].split(' · ').map((x) => x.trim())
  // Dòng nguồn bị cắt cụt theo byte ⇒ mục cuối dở dang (có ký tự hỏng hoặc thiếu chữ) — bỏ.
  if (/�/.test(m[2])) muc.pop()
  for (const t of muc) if (t.length >= 8 && !/�/.test(t)) ra.push([chuong, loai, doi(t)])
}
const thay = new Map()
for (const r of ra) { const k = r[1] + '|' + r[2].toLowerCase(); if (!thay.has(k)) thay.set(k, r) }
const ds = [...thay.values()]
const chuongDs = [...new Set(ds.map((r) => r[0]))]
const nen = ds.map((r) => [chuongDs.indexOf(r[0]), r[1], r[2]])
// MỘT chuỗi (mỗi dòng "chỉ số bài giảng<TAB>k|b<TAB>chữ"), không phải mảng lồng: máy JS lướt qua chuỗi nhanh hơn nhiều so với 6 nghìn mảng con
// lúc khởi động Worker; tách dòng khi lệnh Hỏi Thầy cần (hoi-thay-ky-thuat.ts).
const tho = nen.map((r) => `${r[0]}\t${r[1]}\t${r[2].replace(/[\t\n]/g, ' ')}`).join('\n')
writeFileSync(DICH, `// TỆP SINH TỰ ĐỘNG — đừng sửa tay. Nguồn: ${NGUON} · dựng: node scripts/hoi-thay/dung-ky-thuat-thay.mjs
// Kĩ thuật (k) và bài mẫu (b) Thầy Đỗ Đại Học đã giảng, theo tên bài giảng. Chỉ để chọn CÁCH NGHĨ; số liệu không lấy từ đây.
export const CHUONG_BAI_GIANG: readonly string[] = ${JSON.stringify(chuongDs)}
/** Mỗi dòng: chỉ số trong CHUONG_BAI_GIANG \\t loại (k kĩ thuật · b bài mẫu) \\t chữ. */
export const KY_THUAT_THO = ${JSON.stringify(tho)}
`)
console.log(`${ds.length} mục (${ds.filter((r) => r[1] === 'k').length} kĩ thuật), ${chuongDs.length} bài giảng → ${DICH}`)
