// Kiểm hai kịch bản mẫu của bản vẽ «Nhật ký bài dạy»: (1) đúng lược đồ luoc-do.json (sau khi bỏ phần MÁY điền),
// (2) lược đồ chặt (mọi trường bắt buộc, ít chỗ hợp kiểu, không min / max), (3) CỔNG TỰ KIỂM của khuon.js: cảnh nào đạt, cảnh nào bị bỏ, có phát hành không.
// Chạy từ gốc repo:  node docs/ban-ve-nhat-ky-bai-day-1311/kiem-kich-ban.mjs
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { readFileSync } from 'node:fs'
const can = createRequire(import.meta.url)
const Ajv2020 = can('ajv/dist/2020').default
const DAY = dirname(fileURLToPath(import.meta.url))
const doc = (t) => JSON.parse(readFileSync(join(DAY, t), 'utf8'))
let hong = 0

// ── (2) lược đồ chặt ──
const ld = doc('luoc-do.json')
let tuyChon = 0, hop = 0
const cam = []
;(function di(x, duong) {
  if (!x || typeof x !== 'object') return
  if (Array.isArray(x)) return x.forEach((y, i) => di(y, duong + '/' + i))
  if (x.type === 'object' && x.properties) {
    if (x.additionalProperties !== false) cam.push(duong + ': thiếu additionalProperties false')
    tuyChon += Object.keys(x.properties).filter((k) => !(x.required || []).includes(k)).length
  }
  if (x.anyOf || Array.isArray(x.type)) hop++
  for (const k of ['minimum', 'maximum', 'multipleOf', 'minLength', 'maxLength', 'maxItems', 'exclusiveMinimum', 'exclusiveMaximum']) if (k in x) cam.push(`${duong}: có ${k}`)
  for (const k in x) di(x[k], duong + '/' + k)
})(ld, '#')
console.log(`Lược đồ: ${tuyChon} trường tuỳ chọn, ${hop} chỗ hợp kiểu${cam.length ? ', LỖI: ' + cam.join('; ') : ''}`)
if (tuyChon > 0 || hop > 3 || cam.length) hong++

// ── (1) kịch bản mẫu đúng lược đồ, sau khi bỏ phần MÁY điền ──
const ajv = new Ajv2020({ strict: false, allErrors: true })
const hopLe = ajv.compile(ld)
function phanGemini(kb) {
  const x = JSON.parse(JSON.stringify(kb))
  for (const k of ['buoi', 'nguon', 'ghiChu', 'mau']) delete x[k]
  for (const c of x.canh) { delete c.nguon.vung; if (c.khuon === 'tong-ket') c.duLieu.y.forEach((y) => delete y.giay) }
  return x
}
for (const t of ['lien-ket', 'fes2']) {
  const ok = hopLe(phanGemini(doc(`kich-ban-${t}.json`)))
  console.log(`kich-ban-${t}.json đúng lược đồ: ${ok ? 'có' : 'KHÔNG'}`)
  if (!ok) { hong++; for (const e of hopLe.errors.slice(0, 8)) console.log('   ', e.instancePath, e.message, JSON.stringify(e.params)) }
}

// ── (3) cổng tự kiểm ──
globalThis.window = globalThis
globalThis.location = { search: '' }
globalThis.matchMedia = () => ({ matches: false })
globalThis.document = { documentElement: { classList: { contains: () => false } } }
;(0, eval)(readFileSync(join(DAY, 'khuon.js'), 'utf8'))
const N = window.NKB
for (const t of ['lien-ket', 'fes2']) {
  const c = N.kiemCong(doc(`kich-ban-${t}.json`))
  const so = Object.values(c.chiTiet).flat(), dung = so.filter((x) => x.ok === true).length
  console.log(`kich-ban-${t}.json: ${c.dat.length}/${c.soCau} cảnh đạt · ${dung} mục kiểm đúng · phát hành: ${c.phatHanh ? 'có' : 'KHÔNG'} · ${c.nguong.moTa}`)
  for (const b of c.bo) console.log(`    bỏ ${b.id} «${b.tieuDe}»: ${b.lyDo.join(' | ')}`)
  if (!c.phatHanh) hong++
}
// tự thử: sửa một số / bỏ nguồn thì cổng phải bỏ đúng cảnh đó
const thu = doc('kich-ban-lien-ket.json'), c7 = thu.canh.find((c) => c.id === 'c7'), c3 = thu.canh.find((c) => c.id === 'c3')
c7.duLieu.tinh.ketQua.gt = 0.45; c7.duLieu.tinh.ketQua.hien = '0,45'
c3.nguon.den = c3.nguon.tu
const bo = N.kiemCong(thu).bo.map((x) => x.id)
const dungBo = bo.includes('c7') && bo.includes('c3')
console.log(`Tự thử (sửa Δχ CH₄ thành 0,45; xoá đoạn tiếng của O₂): cổng bỏ ${bo.join(', ')}${dungBo ? '' : ' (HỎNG)'}`)
if (!dungBo) hong++
// không đủ cảnh tin được ⇒ không phát hành
const it = doc('kich-ban-lien-ket.json'); it.canh.forEach((c, i) => { if (i > 1) { c.nguon.trang = 0 } })
const ph = N.kiemCong(it).phatHanh
console.log(`Tự thử (chỉ 2 cảnh có nguồn): phát hành ${ph ? 'CÓ (HỎNG)' : 'không, chỉ hiện bảng gốc'}`)
if (ph) hong++
// tự thử: tên người trong lời Thầy bị che theo danh sách lớp; bản phát hành không mang chữ chép bảng
const ten = doc('kich-ban-lien-ket.json'); ten.canh[0].loi[0].chu = 'Bạn Minh Anh với bạn Long kéo co, cặp electron là vạch ở giữa.'
const ph2 = N.quaCong(ten, { tenLop: ['Minh Anh', 'Long'] }).kb, chuCe = ph2.canh[0].loi[0].chu, conChep = ph2.canh.some((c) => c.nguon.chep)
console.log(`Tự thử che tên: «${chuCe}» · bản phát hành còn chữ chép bảng: ${conChep ? 'CÓ (HỎNG)' : 'không'}`)
if (/Minh Anh|Long/.test(chuCe) || conChep) hong++
console.log(hong ? `HỎNG ${hong} mục` : 'TẤT CẢ ĐẠT')
process.exit(hong ? 1 : 0)
