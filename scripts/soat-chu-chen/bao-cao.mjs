#!/usr/bin/env node
// DỰNG BÁO CÁO từ ket-qua.json của soat.mjs: gộp trùng (cùng màn + cùng phần tử + cùng loại ⇒ một dòng, liệt kê khổ bị), xếp nặng → nhẹ,
// chọn ảnh khoanh vùng (≤ 150 KB/ảnh, tối đa --anh ảnh) chép vào thư mục ảnh của docs.
//   node scripts/soat-chu-chen/bao-cao.mjs <thư mục ra của soat> docs/soat-chu-chen-2610.md docs/anh-soat-2610 [--anh 60] [--json tom-tat.json]
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, resolve, dirname } from 'node:path'

const thamSo = process.argv.slice(2)
const lay = (ten, mac) => { const i = thamSo.indexOf(ten); return i >= 0 ? thamSo[i + 1] : mac }
const [RA, MD, ANH] = thamSo.filter((x, i) => !x.startsWith('--') && !thamSo[i - 1]?.startsWith('--')).map((x) => resolve(x))
const TOI_DA_ANH = Number(lay('--anh', '60'))
const kq = JSON.parse(readFileSync(join(RA, 'ket-qua.json'), 'utf8'))

const KHO = ['390×700', '360×640', '412×780', '390×844', '844×390', '740×360', '1024×768', '1440×900']
const TEN = { a: 'Chữ bị cắt', b: 'Chữ tràn khung có nền/viền', c: 'Hai phần tử chồng nhau', d: 'Phần tử nổi/ghim che nội dung', e: 'Chữ chạm/vượt lòng vòng', f: 'Dòng mở đầu bằng «·»', g: 'Chữ vỡ mỗi từ một dòng', h: 'Tràn ngang', i: 'Đích bấm < 44px', j: 'Ô số rơi một mình xuống hàng (khoảng trắng)', 'a…': 'Ba chấm «…» cố ý ở danh sách (ghi riêng)' }
const NANG = { a: 5, d: 5, c: 4, e: 4, g: 4, b: 3, h: 3, f: 2, j: 1, 'a…': 0, i: 0 }
const THU_TU = ['a', 'd', 'c', 'e', 'g', 'b', 'h', 'f', 'j']
const app = (man) => (man.startsWith('gv-') ? 'Thầy' : man.startsWith('ph') ? 'Phụ huynh' : 'Học sinh')
// giao diện cũ (lùi một máy bằng `ddh.trong=tat`; phụ huynh không «Một trang»): báo riêng, không tính vào tổng chính
const cu = (man) => /trong=tat/.test(man) || (man.startsWith('ph') && !man.startsWith('ph-vao') && !/mot=1/.test(man))
const chuan = (s) => (s ?? '').replace(/\d+/g, '#').replace(/\s+/g, ' ').slice(0, 28)

const nhom = new Map() // khoá → dòng gộp
const loiTrang = new Map()
for (const r of kq) {
  const kho = `${r.w}×${r.h}`
  if (r.loiTrang?.length) loiTrang.set(`${r.canh}`, [...(loiTrang.get(r.canh) ?? []), ...r.loiTrang.map((x) => `${kho}${r.nen === 'dark' ? ' tối' : ''}: ${x}`)])
  for (const l of r.loi) {
    const khoa = `${r.canh}|${l.loai}|${l.dau}|${['c', 'b', 'e', 'f', 'g', 'a', 'a…', 'h'].includes(l.loai) ? chuan(l.chu) : ''}|${l.khung ?? ''}`
    let g = nhom.get(khoa)
    if (!g) nhom.set(khoa, (g = { canh: r.canh, man: r.man, viec: r.viec, loai: l.loai, dau: l.dau, chu: l.chu, ghi: l.ghi ?? '', khung: l.khung ?? '', so: 0, kho: new Set(), nen: new Set(), luot: 0 }))
    g.kho.add(kho); g.nen.add(r.nen); g.luot++; g.so = Math.max(g.so, l.so ?? 0)
    if (l.ghi && !g.ghi.includes(l.ghi)) g.ghi = g.ghi || l.ghi
  }
}
const dong = [...nhom.values()]
const chinh = dong.filter((g) => !cu(g.man))
const dongCu = dong.filter((g) => cu(g.man))
const khoChu = (g) => {
  const ds = KHO.filter((k) => g.kho.has(k))
  const nen = g.nen.size === 2 ? '' : g.nen.has('dark') ? ' (chỉ tối)' : ' (chỉ sáng)'
  return (ds.length === KHO.length ? 'mọi khổ' : ds.join(', ')) + nen
}

// ── tổng theo loại / app (đếm dòng đã gộp)
const dem = (ds, f) => { const o = {}; for (const g of ds) { const k = f(g); o[k] = (o[k] ?? 0) + 1 } return o }
const theoLoai = dem(chinh, (g) => g.loai)
const theoApp = {}
for (const g of chinh) { theoApp[app(g.man)] ??= {}; theoApp[app(g.man)][g.loai] = (theoApp[app(g.man)][g.loai] ?? 0) + 1 }
// ── điểm nặng từng màn (không tính i, a…); nhân thêm độ phủ khổ (lỗi ở nhiều khổ nặng hơn)
const diem = new Map()
for (const g of chinh) { if (!NANG[g.loai]) continue; const d = diem.get(g.canh) ?? { canh: g.canh, man: g.man, diem: 0, loai: {} }; d.diem += NANG[g.loai] * (0.5 + g.kho.size / KHO.length); d.loai[g.loai] = (d.loai[g.loai] ?? 0) + 1; diem.set(g.canh, d) }
const xep = [...diem.values()].sort((a, b) => b.diem - a.diem)

// ── chọn ảnh: lỗi nặng trước, mỗi (màn, loại) một ảnh, tối đa TOI_DA_ANH
const anhCo = new Map()
for (const r of kq) for (const a of r.anh ?? []) { const [canh, , loai] = a.replace(/\.jpg$/, '').split('__'); const k = `${canh}|${loai === 'a3' ? 'a…' : loai}`; if (!anhCo.has(k)) anhCo.set(k, a) }
const ungVien = [...new Map(chinh.filter((g) => NANG[g.loai] > 0).sort((a, b) => NANG[b.loai] * b.kho.size - NANG[a.loai] * a.kho.size).map((g) => [`${g.canh}|${g.loai}`, g])).keys()]
const chon = []
const daLoaiMan = new Set()
// lượt 1: mỗi màn ảnh lỗi nặng nhất; lượt 2: thêm loại khác
for (const vong of [1, 2]) for (const k of ungVien) {
  if (chon.length >= TOI_DA_ANH) break
  const [canh] = k.split('|')
  if (!anhCo.has(k) || chon.includes(k) || (vong === 1 && daLoaiMan.has(canh))) continue
  chon.push(k); daLoaiMan.add(canh)
}
if (existsSync(ANH)) rmSync(ANH, { recursive: true })
mkdirSync(ANH, { recursive: true })
const anhCua = new Map()
let tongByte = 0
for (const k of chon) { const tep = anhCo.get(k); copyFileSync(join(RA, 'anh', tep), join(ANH, tep)); tongByte += statSync(join(ANH, tep)).size; anhCua.set(k, tep) }
const duongAnh = (tep) => relative(dirname(MD), join(ANH, tep)).replace(/\\/g, '/')

// ── viết báo cáo
const L = []
const soLuot = kq.length, soCanh = new Set(kq.map((r) => r.canh)).size
L.push('# Soát chữ chèn toàn bộ giao diện — 26/10/2026')
L.push('')
L.push('Thầy 26/10 tối gửi ảnh điện thoại thật: «Chữ vẫn bị chèn, giao cho 1 tác tử check lại toàn bộ giao diện và sửa đúng chuẩn đẹp nhé». Báo cáo này là GIAI ĐOẠN 1 (chỉ soát, chưa sửa mã app).')
L.push('')
L.push(`- Bộ soát: \`scripts/soat-chu-chen/\` (Playwright + Chromium thật, dữ liệu giả của \`scripts/chup-v2\`). Chạy: \`npx vite build --config scripts/chup-v2/vite.config.mjs --outDir <dist>\` rồi \`node scripts/soat-chu-chen/soat.mjs <dist> <ra>\` và \`node scripts/soat-chu-chen/bao-cao.mjs <ra> docs/soat-chu-chen-2610.md docs/anh-soat-2610\`.`)
L.push(`- Phạm vi: ${soCanh} cảnh (mọi cảnh của \`chup.mjs\` gộp theo màn + thao tác, thêm cảnh chỉ có ở \`trang.tsx\` và khối \`// ═══ SOÁT 26/10\`) × 8 khổ (${KHO.join(', ')}) × sáng/tối = ${soLuot} lượt. Bỏ cảnh ép nút Sáng/Tối trong Cài đặt (trùng bố cục).`)
L.push('- Gộp trùng: cùng màn + cùng phần tử + cùng loại (+ cùng mẫu chữ, số thay bằng #) ⇒ MỘT dòng, cột «Khổ bị» liệt kê khổ gặp lỗi. Con số đếm dưới đây là số dòng ĐÃ GỘP.')
L.push('- Giao diện cũ (lùi bằng `ddh.trong=tat`, phụ huynh không «Một trang») báo riêng ở cuối, không tính vào tổng.')
L.push('')
L.push('## Cách bộ soát nhận lỗi')
L.push('')
L.push('| Loại | Nhận thế nào |')
L.push('|---|---|')
L.push('| a. Chữ bị cắt | Dòng chữ (khung chữ thật của từng dòng) thò ra ngoài tổ tiên có `overflow: hidden/clip` gần nhất ⇒ phần chữ mất. Ba chấm (`text-overflow: ellipsis`/`line-clamp`) ở dòng danh sách ⇒ nhóm riêng «a…»; ba chấm trong nút, thẻ, tiêu đề vẫn là lỗi a (ảnh thầy «họn để x…»). |')
L.push('| b. Tràn khung | Chữ thò ra ngoài khung có nền hoặc viền gần nhất (khung không cắt) > 2px. |')
L.push('| c. Chồng nhau | Hai dòng chữ / chữ và nút / hai nút giao nhau > 2px mỗi chiều, bỏ cha–con, bỏ phần bị cắt khuất, bỏ nút trong suốt phủ cả thẻ (mẫu «cả thẻ bấm được»). |')
L.push('| d. Nổi/ghim che | `elementFromPoint` tại tâm dòng chữ/nút trả về phần tử thuộc khối `fixed`/`sticky` khác: cuộn về ĐẦU xét thanh trên + cạnh, cuộn tới ĐÁY xét thanh đáy + nút nổi (không hé ra được dù cuộn hết); trang không cuộn ⇒ xét mọi phần tử nổi. |')
L.push('| e. Chạm lòng vòng | Vòng SVG (`circle` có nét, lấy bán kính trừ nửa nét) hoặc ô tròn CSS (`border-radius` ≥ 50%, gần vuông): bốn góc nét chữ (cao 0,72 cỡ chữ) phải nằm trong lòng vòng. |')
L.push('| f. «·» đầu dòng | Dấu «·» là ký tự nhìn thấy đầu tiên của một dòng hiển thị (xét ký tự trước trong cùng nút chữ, hoặc chữ khác cùng hàng ở bên trái). |')
L.push('| g. Vỡ từng dòng | Khối chữ rộng < 80px mà > 3 dòng, hoặc ≥ 3 dòng mà trung bình ≤ 9 ký tự/dòng trong bề rộng < 140px. |')
L.push('| h. Tràn ngang | Trang/tấm cuộn ngang, hoặc chữ/nút thò qua mép khung nhìn mà không nằm trong khung cuộn/cắt ngang. |')
L.push('| i. Đích bấm < 44px | Nút, đường dẫn, ô nhập hiển thị có cạnh < 44px (đếm riêng, không ảnh). |')
L.push('| j. Ô rơi hàng | Hàng flex-wrap/grid 3–8 ô, hàng đầu ≥ 3 ô mà hàng cuối còn 1 ô hẹp ⇒ khoảng trắng lớn (ảnh thầy «ô số rơi xuống hàng»). |')
L.push('')
L.push('## Tổng số lỗi (đã gộp)')
L.push('')
const apps = ['Học sinh', 'Thầy', 'Phụ huynh']
L.push(`| Loại | Tổng | ${apps.join(' | ')} |`)
L.push(`|---|---:|${apps.map(() => '---:').join('|')}|`)
for (const k of [...THU_TU, 'i', 'a…']) L.push(`| ${k}. ${TEN[k]} | ${theoLoai[k] ?? 0} | ${apps.map((a) => theoApp[a]?.[k] ?? 0).join(' | ')} |`)
const tongAH = THU_TU.filter((k) => k !== 'j').reduce((s, k) => s + (theoLoai[k] ?? 0), 0)
L.push(`| **a–h cộng** | **${tongAH}** | ${apps.map((a) => `**${THU_TU.filter((k) => k !== 'j').reduce((s, k) => s + (theoApp[a]?.[k] ?? 0), 0)}**`).join(' | ')} |`)
L.push('')
L.push('## Màn tệ nhất (điểm = Σ mức nặng × độ phủ khổ; a, d = 5 · c, e, g = 4 · b, h = 3 · f = 2 · j = 1)')
L.push('')
L.push('| # | Màn (cảnh) | App | Điểm | Lỗi theo loại |')
L.push('|---:|---|---|---:|---|')
xep.slice(0, 20).forEach((d, i) => L.push(`| ${i + 1} | \`${d.canh}\` | ${app(d.man)} | ${Math.round(d.diem)} | ${Object.entries(d.loai).sort((a, b) => THU_TU.indexOf(a[0]) - THU_TU.indexOf(b[0])).map(([k, n]) => `${k}×${n}`).join(' ')} |`))
L.push('')
L.push('## Bảng lỗi theo màn (nặng → nhẹ)')
L.push('')
L.push('Cột «Phần tử» là đường lớp CSS ngắn (để tìm trong mã); «Đo» = px mất/thò/giao (e: px vượt lòng vòng, g: số dòng). Ảnh: viền hồng = phần tử lỗi, viền cam nét đứt = khung/phần tử gây lỗi.')
L.push('')
const theoMan = new Map()
for (const g of chinh.filter((g) => g.loai !== 'i' && g.loai !== 'a…')) { if (!theoMan.has(g.canh)) theoMan.set(g.canh, []); theoMan.get(g.canh).push(g) }
const thuTuMan = [...theoMan.keys()].sort((a, b) => (diem.get(b)?.diem ?? 0) - (diem.get(a)?.diem ?? 0))
for (const canh of thuTuMan) {
  const ds = theoMan.get(canh).sort((a, b) => THU_TU.indexOf(a.loai) - THU_TU.indexOf(b.loai) || b.kho.size - a.kho.size)
  const g0 = ds[0]
  L.push(`### \`${canh}\` — ${app(g0.man)} · \`?man=${g0.man}\`${g0.viec ? ` · thao tác \`${g0.viec.length > 60 ? g0.viec.slice(0, 60) + '…' : g0.viec}\`` : ''}`)
  L.push('')
  L.push('| Loại | Phần tử | Mẫu chữ | Đo | Khổ bị | Ghi |')
  L.push('|---|---|---|---:|---|---|')
  for (const g of ds.slice(0, 25)) L.push(`| ${g.loai} | \`${g.dau.replace(/\|/g, '/').slice(0, 110)}\` | ${g.chu.replace(/\|/g, '/').replace(/`/g, "'")} | ${g.so} | ${khoChu(g)} | ${[g.ghi, g.khung].filter(Boolean).join(' · ')} |`)
  if (ds.length > 25) L.push(`| … | còn ${ds.length - 25} dòng | | | | |`)
  L.push('')
  const anh = THU_TU.map((k) => anhCua.get(`${canh}|${k}`)).filter(Boolean)
  for (const a of anh) L.push(`![${a}](${duongAnh(a)})`)
  if (anh.length) L.push('')
}
L.push('## Đích bấm < 44px (i) — theo màn')
L.push('')
L.push('| Màn | Số nút (gộp) | Nhỏ nhất | Ví dụ |')
L.push('|---|---:|---:|---|')
const iMan = new Map()
for (const g of chinh.filter((g) => g.loai === 'i')) { if (!iMan.has(g.canh)) iMan.set(g.canh, []); iMan.get(g.canh).push(g) }
for (const [canh, ds] of [...iMan].sort((a, b) => b[1].length - a[1].length)) L.push(`| \`${canh}\` | ${ds.length} | ${Math.min(...ds.map((g) => g.so))}px | ${ds.sort((a, b) => a.so - b.so).slice(0, 3).map((g) => `«${g.chu.slice(0, 24)}» ${g.ghi}`).join(' · ').replace(/\|/g, '/')} |`)
L.push('')
L.push('## Nhóm riêng: ba chấm «…» cố ý ở dòng danh sách (a…)')
L.push('')
L.push('Không tính là lỗi; liệt kê để thầy/Boss xem có chỗ nào cần hiện đủ (xem đủ được khi bấm theo chuẩn B14).')
L.push('')
L.push('| Màn | Phần tử | Mẫu chữ | Px bị ẩn | Khổ |')
L.push('|---|---|---|---:|---|')
for (const g of chinh.filter((g) => g.loai === 'a…').sort((a, b) => b.so - a.so).slice(0, 60)) L.push(`| \`${g.canh}\` | \`${g.dau.slice(0, 90)}\` | ${g.chu.replace(/\|/g, '/')} | ${g.so} | ${khoChu(g)} |`)
L.push('')
if (dongCu.length) {
  L.push('## Giao diện cũ (lùi một máy) — tham khảo, không tính tổng')
  L.push('')
  const c = dem(dongCu.filter((g) => g.loai !== 'i'), (g) => g.loai)
  L.push(`${new Set(dongCu.map((g) => g.canh)).size} cảnh · ${Object.entries(c).sort((a, b) => THU_TU.indexOf(a[0]) - THU_TU.indexOf(b[0])).map(([k, n]) => `${k}×${n}`).join(' · ')}`)
  L.push('')
}
const ltr = [...loiTrang].filter(([canh]) => ![...dongCu].some((g) => g.canh === canh))
if (ltr.length) {
  L.push('## Lượt có lỗi trang / thao tác hỏng (soát vẫn chạy trên trạng thái đạt được)')
  L.push('')
  for (const [canh, ds] of ltr) L.push(`- \`${canh}\`: ${[...new Set(ds.map((x) => x.replace(/^[^:]+: /, '')))].slice(0, 3).join(' · ').slice(0, 300)} (${ds.length} lượt)`)
  L.push('')
}
L.push(`Ảnh: ${chon.length} tệp, ${Math.round(tongByte / 1024)} KB trong \`${relative(resolve(dirname(MD), '..'), ANH)}\`.`)
L.push('')
writeFileSync(MD, L.join('\n'))
const tomTat = { soLuot, soCanh, theoLoai, theoApp, tongAH, xau: xep.slice(0, 5).map((d) => ({ canh: d.canh, app: app(d.man), diem: Math.round(d.diem), loai: d.loai })), anh: chon.length, kb: Math.round(tongByte / 1024) }
if (lay('--json')) writeFileSync(lay('--json'), JSON.stringify(tomTat, null, 1))
console.log(JSON.stringify(tomTat))
