#!/usr/bin/env node
// SINH BẢN VẼ ô "THI ĐUA HÔM NAY" — phương án 8A (thầy chốt 21/09 13:36; đề DE-XUAT-THAN-THU-MOI-NGAY-2109.md ĐIỀU 8). Code 2.
//   node docs/ban-ve-thi-dua-2109/sinh-ban-ve.mjs          ghi HTML tĩnh tự chứa vào thư mục này
//   node docs/ban-ve-thi-dua-2109/sinh-ban-ve.mjs --anh    thêm: chụp Chromium 390 sáng+tối (mọi trạng thái) + 1 ảnh 1440, JPG ≤ 150 KB vào ./anh/
// Dữ liệu và tên là GIẢ. Màu đọc từ tokens.css + m3-theme.css của app. Xếp theo SỰ CHĂM (số câu → đạt nhiệm vụ ngày → chuỗi), không theo điểm; theo lớp.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const AQUI = dirname(fileURLToPath(import.meta.url))
const GOC = join(AQUI, '..', '..')
const doc = (p) => readFileSync(join(GOC, p), 'utf8')
const CSS = [doc('src/styles/tokens.css'), doc('src/components/bang-nhiem-vu/m3-theme.css').replace(/@theme inline \{[\s\S]*?\n\}\n?/, ''), readFileSync(join(AQUI, 'thi-dua.css'), 'utf8')].join('\n')

const IC = {
  len: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  lua: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  thu: '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>',
  nguoi: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  muc: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  phai: '<path d="m9 18 6-6-6-6"/>',
}
const ic = (t, cls = '') => `<svg class="td-i ${cls}" aria-hidden="true" focusable="false" viewBox="0 0 24 24">${IC[t]}</svg>`

const MAU = ['--td-mau:var(--m3-primary-container);--td-mau-chu:var(--m3-on-primary-container)', '--td-mau:var(--m3-secondary-container);--td-mau-chu:var(--m3-on-secondary-container)', '--td-mau:var(--m3-tertiary-container);--td-mau-chu:var(--m3-on-tertiary-container)']
const TOP = [
  { ten: 'Gia Bảo', hoDem: 'Lê', thu: 'Bông', cau: 52, chuoi: 21 },
  { ten: 'Minh Anh', hoDem: 'Trần', thu: 'Lửa Nhỏ', cau: 47, chuoi: 12 },
  { ten: 'Thảo Vy', hoDem: 'Phạm', thu: 'Mập Địch', cau: 44, chuoi: 9 },
]
const rutGon = (b) => `${b.ten} ${b.hoDem[0]}.`

/** Bục 3 bạn chăm nhất. `em` = 1..3 ⇒ chính em ở vị trí ấy (tên "Em", viền nhấn). `trong` ⇒ chưa ai học (ô nét đứt). */
const buc = ({ em = 0, trong = false, emThu = 'Lửa Nhỏ', emCau = 0, emChuoi = 0 } = {}) => {
  const ds = TOP.map((b, i) => (em === i + 1 ? { ten: 'Em', thu: emThu, cau: emCau, chuoi: emChuoi, laEm: true } : { ten: rutGon(b), thu: b.thu, cau: b.cau, chuoi: b.chuoi }))
  return `<ol class="td-buc${trong ? ' td-buc--trong' : ''}" aria-label="Ba bạn chăm nhất lúc này">${ds
    .map((b, i) =>
      trong
        ? `<li class="td-buc__ban td-buc__ban--${i + 1}"><span class="td-avt" aria-hidden="true">${ic('thu')}<b style="background:var(--m3-surface-container-highest);color:var(--td-nhat)">${i + 1}</b></span><span class="td-buc__ten">Còn trống</span><span class="td-buc__cau"><strong class="td-so">0</strong>câu hôm nay</span><span class="td-buc__cot"></span></li>`
        : `<li class="td-buc__ban td-buc__ban--${i + 1}${b.laEm ? ' td-buc__ban--em' : ''}" aria-label="Hạng ${i + 1}: ${b.ten}, ${b.cau} câu hôm nay, chuỗi ${b.chuoi} ngày, thần thú ${b.thu}">
      <span class="td-avt" style="${MAU[i]}" aria-hidden="true">${ic('thu')}<b>${i + 1}</b></span>
      <span class="td-buc__ten">${b.ten}</span><span class="td-buc__thu">${b.thu}</span>
      <span class="td-buc__cau"><strong class="td-so">${b.cau}</strong>câu hôm nay</span>
      <span class="td-buc__chuoi">${ic('lua')}Chuỗi ${b.chuoi} ngày</span><span class="td-buc__cot" aria-hidden="true"></span></li>`,
    )
    .join('')}</ol>`
}
const vuot = (t = 'Minh Anh vừa vượt lên hạng 2', khi = '2 phút trước') => `<p class="td-vuot" role="status" aria-live="polite">${ic('len')}<span>${t}</span><small class="td-so">${khi}</small></p>`

const trang = ({ tieuDe, body }) => `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark"><title>${tieuDe}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body class="m3 td">${body}</body></html>`

const KHUNG = (t) => `<div class="td-khung-gia" aria-hidden="true">${t}</div>`
const CHAN = '<p class="td-chan">Xếp theo độ chăm hôm nay: số câu đã làm, rồi đã đạt nhiệm vụ ngày chưa, rồi chuỗi ngày học. Không xếp theo điểm. Cập nhật mỗi phút.</p>'

/** Ô hoàn chỉnh. `thanh` = số bạn đã học; `si` = sĩ số. */
const o = ({ lop = '12A1', bucHtml, vuotHtml = '', emHtml, thanh, si, cuoiHtml, chan = CHAN }) => `<section class="td-o" aria-labelledby="td-t" data-vung="thi-dua">
  <div class="td-dau"><h2 id="td-t">Thi đua hôm nay</h2><span class="td-song"><i aria-hidden="true"></i>Cập nhật 1 phút trước</span><p style="flex-basis:100%">Lớp ${lop} · ${si} bạn</p></div>
  ${bucHtml}${vuotHtml}${emHtml}
  <div class="td-lop"><p class="td-lop__chu"><b class="td-so">${thanh} trong ${si} bạn</b><span>đã học hôm nay</span></p><div class="td-lop__thanh" role="progressbar" aria-label="Số bạn đã học hôm nay" aria-valuemin="0" aria-valuemax="${si}" aria-valuenow="${thanh}"><i style="width:${(thanh / si) * 100}%"></i></div></div>
  ${cuoiHtml}${chan}</section>`

const emHang = ({ hang, si, cau, chu, them }) => `<div class="td-em" data-vung="vi-tri-em"><div class="td-em__hang" role="img" aria-label="Em đứng hạng ${hang} trong ${si} bạn"><b class="td-so">${hang}</b><small>hạng của em</small></div>
  <div class="td-em__chu"><h3>Em đang hạng ${hang} trong ${si} bạn</h3><p class="td-so">${cau}</p>${them ? `<span class="td-em__them">${ic('len')}${them}</span>` : ''}</div></div>`
const cuoi8A = (n, si) => `<p class="td-cuoi">${ic('nguoi')}<span><b class="td-so">${n} bạn</b> chưa học hôm nay</span></p>`

const P = {}
P['td-1-em-o-giua'] = () => trang({ tieuDe: 'Thi đua hôm nay · em ở giữa lớp', body: `<main class="td-trang">
  <p class="td-ghi-chu">MẪU 8A · em đang ở GIỮA lớp (hạng 9/42). Không nêu tên bạn nào ngoài 3 bạn đầu; phần "chưa học" chỉ có con số. Khung nét đứt chỉ minh hoạ vị trí: ô nằm ở ĐẦU Bảng nhiệm vụ của em.</p>
  ${KHUNG('Đầu trang: "Chào Minh" · Chuỗi 5 ngày')}
  ${o({ bucHtml: buc(), vuotHtml: vuot(), emHtml: emHang({ hang: 9, si: 42, cau: 'Em đã làm 31 câu hôm nay', them: 'Làm thêm 5 câu là vượt 2 bạn' }), thanh: 27, si: 42, cuoiHtml: cuoi8A(15, 42) })}
  ${KHUNG('Việc hôm nay: Bài tập về nhà · Chặng 2 …')}</main>` })

P['td-2-em-nhom-cuoi'] = () => trang({ tieuDe: 'Thi đua hôm nay · em ở nhóm cuối', body: `<main class="td-trang">
  <p class="td-ghi-chu">MẪU 8A · em đang ở NHÓM CUỐI (chưa học hôm nay). Chỉ CHÍNH em thấy thẻ cam về mình; các bạn khác không thấy và không ai bị nêu tên. Tên các em cuối bảng chỉ hiện ở Bảng tin của thầy.</p>
  ${KHUNG('Đầu trang: "Chào Minh" · Chuỗi 5 ngày')}
  ${o({ bucHtml: buc(), vuotHtml: vuot('Thảo Vy vừa vượt lên hạng 3', '5 phút trước'), emHtml: emHang({ hang: 33, si: 42, cau: 'Em chưa có câu nào hôm nay', them: '' }), thanh: 27, si: 42,
    cuoiHtml: `${cuoi8A(15, 42)}<div class="td-the-cam" role="group" aria-label="Thẻ của riêng em"><h3>${ic('muc')}Em đang ở nhóm cuối lớp hôm nay</h3><p class="td-so">6 câu là thoát nhóm cuối. Khoảng 8 phút.</p><button class="td-nut" type="button">Làm 6 câu ngay</button></div>` })}
  ${KHUNG('Việc hôm nay: Bài tập về nhà · Chặng 2 …')}</main>` })

P['td-3-dau-ngay'] = () => trang({ tieuDe: 'Thi đua hôm nay · đầu ngày', body: `<main class="td-trang">
  <p class="td-ghi-chu">MẪU 8A · ĐẦU NGÀY: chưa bạn nào học. Không bục rỗng đáng sợ: nói thẳng và mời em làm câu đầu tiên. Không dòng "vừa vượt lên", không thẻ cam, không "42 bạn chưa học".</p>
  ${KHUNG('Đầu trang: "Chào Minh" · Chuỗi 5 ngày')}
  <section class="td-o" aria-labelledby="td-t" data-vung="thi-dua">
    <div class="td-dau"><h2 id="td-t">Thi đua hôm nay</h2><span class="td-song"><i aria-hidden="true"></i>Cập nhật 1 phút trước</span><p style="flex-basis:100%">Lớp 12A1 · 42 bạn</p></div>
    ${buc({ trong: true })}
    <div class="td-trong"><h3>Chưa bạn nào học hôm nay</h3><p class="td-so">Em làm câu đầu tiên là em dẫn đầu lớp lúc này.</p></div>
    <div class="td-lop"><p class="td-lop__chu"><b class="td-so">0 trong 42 bạn</b><span>đã học hôm nay</span></p><div class="td-lop__thanh" role="progressbar" aria-label="Số bạn đã học hôm nay" aria-valuemin="0" aria-valuemax="42" aria-valuenow="0"><i style="width:0%"></i></div></div>
    ${CHAN}</section>
  ${KHUNG('Việc hôm nay: Bài tập về nhà · Chặng 2 …')}</main>` })

P['td-4-em-dung-dau'] = () => trang({ tieuDe: 'Thi đua hôm nay · em đứng đầu', body: `<main class="td-trang">
  <p class="td-ghi-chu">MẪU 8A · EM ĐỨNG ĐẦU lớp lúc này: em nằm ngay giữa bục; thẻ vị trí nói bạn kế cách bao nhiêu câu (không nêu tên); vẫn không thẻ cam, không nêu tên ai chưa học.</p>
  ${KHUNG('Đầu trang: "Chào Minh" · Chuỗi 5 ngày')}
  ${o({ bucHtml: buc({ em: 1, emThu: 'Lửa Nhỏ', emCau: 55, emChuoi: 5 }), vuotHtml: vuot('Em vừa vượt lên hạng 1', 'vừa xong'), emHtml: emHang({ hang: 1, si: 42, cau: 'Em đã làm 55 câu hôm nay', them: 'Bạn kế cách em 3 câu' }), thanh: 31, si: 42, cuoiHtml: cuoi8A(11, 42) })}
  ${KHUNG('Việc hôm nay: Bài tập về nhà · Chặng 2 …')}</main>` })

P.index = () => trang({ tieuDe: 'Bản vẽ ô "Thi đua hôm nay" · 8A', body: `<main class="td-trang"><p class="td-ghi-chu">Bản vẽ phương án 8A (không nêu tên em ít học). Dữ liệu giả; chưa build. Mở từng trang; đổi sáng/tối theo máy.</p><div class="td-hub">
  <a href="td-1-em-o-giua.html"><b>1 · Em ở giữa lớp</b><span>Bục 3 bạn, "vừa vượt lên", vị trí của em to, 27/42 bạn đã học, "15 bạn chưa học".</span></a>
  <a href="td-2-em-nhom-cuoi.html"><b>2 · Em ở nhóm cuối</b><span>Thẻ cam CHỈ của chính em: "6 câu là thoát nhóm cuối".</span></a>
  <a href="td-3-dau-ngay.html"><b>3 · Đầu ngày (chưa ai học)</b><span>Nói thẳng, mời em làm câu đầu tiên.</span></a>
  <a href="td-4-em-dung-dau.html"><b>4 · Em đứng đầu</b><span>Em ở giữa bục, "bạn kế cách em 3 câu".</span></a></div></main>` })

for (const [ten, f] of Object.entries(P)) writeFileSync(join(AQUI, `${ten}.html`), f())
console.log(`đã ghi ${Object.keys(P).length} trang HTML vào ${AQUI}`)

if (process.argv.includes('--anh')) {
  const { chromium } = createRequire(join(GOC, 'package.json'))('playwright')
  const RA = join(AQUI, 'anh')
  mkdirSync(RA, { recursive: true })
  const TRAN = 150 * 1024
  const browser = await chromium.launch()
  let xau = 0
  for (const ten of Object.keys(P)) {
    if (ten === 'index') continue
    const cauHinh = [[390, 844, false], [390, 844, true], ...(ten === 'td-1-em-o-giua' ? [[1440, 900, false]] : [])]
    for (const [w, h, toi] of cauHinh) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: toi ? 'dark' : 'light', locale: 'vi-VN', deviceScaleFactor: 1 })
      const tr = await ctx.newPage()
      const loi = []
      tr.on('pageerror', (e) => loi.push(String(e)))
      await tr.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort())
      await tr.goto('file://' + join(AQUI, `${ten}.html`), { waitUntil: 'load' })
      await tr.waitForTimeout(300)
      const kt = await tr.evaluate(() => ({ cao: document.documentElement.scrollHeight, tran: document.documentElement.scrollWidth - innerWidth, nho: [...document.querySelectorAll('button,a')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 47.5) }).length }))
      let ghi = 0
      for (const q of [82, 72, 62, 52, 44, 36]) {
        const buf = await tr.screenshot({ type: 'jpeg', quality: q, fullPage: true })
        if (buf.length <= TRAN) { writeFileSync(join(RA, `${ten}-${w}-${toi ? 'toi' : 'sang'}.jpg`), buf); ghi = buf.length; break }
      }
      console.log(`${ten}-${w}-${toi ? 'toi' : 'sang'}.jpg`.padEnd(40), `${Math.round(ghi / 1024)} KB · cao ${kt.cao} · tràn ${kt.tran} · đích<48 ${kt.nho} · lỗi ${loi.length}`)
      if (!ghi || kt.tran > 0 || loi.length || kt.nho) xau++
      await ctx.close()
    }
  }
  await browser.close()
  console.log(xau ? `${xau} ảnh có vấn đề` : 'sạch: ≤150 KB, 0 tràn, 0 đích <48, 0 lỗi')
}
