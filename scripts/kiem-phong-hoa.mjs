#!/usr/bin/env node
/**
 * KIỂM PHÔNG 'Baloo 2' CỦA GAME HÓA 2.0 — chống tái phát lỗi "PHÁ 3 Ổ PHỤC KÍCH" (28/09/2026).
 *
 * Lỗi gốc: phong-baloo.ts nạp các tệp CSS theo bộ con của fontsource (`vietnamese-800.css`, `latin-800.css`…) —
 * các tệp này KHÔNG có `unicode-range`. Hai @font-face cùng tên 'Baloo 2', cùng độ đậm, không unicode-range ⇒ Chromium
 * dùng mặt khai SAU (latin) cho MỌI ký tự; latin không có "Ổ/Ố/Ơ…" nên HarfBuzz tự tách thành Ô + dấu móc (U+0309)
 * lấy trong latin ⇒ chữ HOA có dấu hiện méo/như chữ thường. Thứ tự nạp CSS đổi theo mảnh ⇒ lúc đúng lúc sai.
 *
 * Cách kiểm: dựng một trang dùng ĐÚNG các import CSS trong src/components/hoa2/phong-baloo.ts + CSS Sảnh thật
 * (.h2-sanh .baloo, .h2-nut-chinh-lon: 800 · letter-spacing .5px; .h2-nut-chinh-nho: 700), vẽ từng chữ cái tiếng Việt
 * (HOA + thường, đủ 5 dấu) và so từng điểm ảnh với bản MẪU vẽ bằng đúng tệp woff2 của bộ con chứa ký tự đó
 * (một @font-face riêng, không cạnh tranh). Chạy hai thứ tự nạp (xuôi + ngược). Lệch ⇒ in chữ hỏng, thoát mã 1.
 *
 * Chạy:  node scripts/kiem-phong-hoa.mjs [--anh <tệp.jpg>]
 *   (cần Chromium của Playwright; mặc định /opt/pw-browsers/chromium-1194/chrome-linux/chrome, đổi bằng biến CHROME)
 */
import { chromium } from 'playwright'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FS = path.join(GOC, 'node_modules/@fontsource/baloo-2')
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const iAnh = process.argv.indexOf('--anh')
const TEP_ANH = iAnh > 0 ? process.argv[iAnh + 1] : null

// 1) Các CSS phông mà app THẬT nạp.
const nguonTs = fs.readFileSync(path.join(GOC, 'src/components/hoa2/phong-baloo.ts'), 'utf8')
const cssApp = [...nguonTs.matchAll(/^import\s+'@fontsource\/baloo-2\/([^']+\.css)'/gm)].map((m) => m[1])
if (!cssApp.length) { console.error('Không tìm thấy import @fontsource/baloo-2 trong phong-baloo.ts'); process.exit(2) }

// 2) Bản đồ bộ con → unicode-range (lấy từ CSS đầy đủ của fontsource) để chọn tệp MẪU cho từng ký tự.
function khoang(cssTen) {
  const css = fs.readFileSync(path.join(FS, cssTen), 'utf8')
  const ra = []
  for (const m of css.matchAll(/files\/baloo-2-([a-z-]+)-(\d+)-normal\.woff2[\s\S]*?unicode-range:\s*([^;]+);/g)) {
    const dai = m[3].split(',').map((s) => {
      const [a, b] = s.trim().replace(/^U\+/i, '').split('-')
      return [parseInt(a, 16), parseInt(b ?? a, 16)]
    })
    ra.push({ bo: m[1], dai })
  }
  return ra
}
const BO = khoang('800.css').filter((b) => b.bo !== 'devanagari')
// Chromium thử mặt khai SAU trước ⇒ ưu tiên như fontsource xếp: latin > latin-ext > vietnamese.
const UU_TIEN = ['latin', 'latin-ext', 'vietnamese']
function boCua(ch) {
  const cp = ch.codePointAt(0)
  for (const ten of UU_TIEN) {
    const b = BO.find((x) => x.bo === ten)
    if (b && b.dai.some(([a, z]) => cp >= a && cp <= z)) return ten
  }
  return null
}

// 3) Mọi chữ cái tiếng Việt có dấu (HOA + thường) + vài chữ gốc để đối chiếu.
const GOC_CHU = ['a', 'ă', 'â', 'e', 'ê', 'i', 'o', 'ô', 'ơ', 'u', 'ư', 'y']
const DAU = ['́', '̀', '̉', '̃', '̣']
const thuong = new Set(['đ', 'o', 'h'])
for (const g of GOC_CHU) { thuong.add(g); for (const d of DAU) thuong.add((g + d).normalize('NFC')) }
const CHU = [...thuong].flatMap((c) => [c.toUpperCase(), c])
const CHUOI_THAT = ['PHÁ 3 Ổ PHỤC KÍCH', 'BÁT LINH ĐẢO · CẦU CHƯA HẠ', 'CHỐT ĐÁP ÁN · TUNG CHIÊU', 'CHỌN THẦN THÚ CỦA EM', 'BẠN ĐỒNG HÀNH HỢP NHẤT HÔM NAY']

const DO_DAM = [800, 700]
function trang(thuTu) {
  const link = thuTu.map((c) => `<link rel="stylesheet" href="/node_modules/@fontsource/baloo-2/${c}">`).join('')
  const mau = UU_TIEN.flatMap((bo) => DO_DAM.map((w) =>
    `@font-face{font-family:'Mau ${bo} ${w}';font-weight:${w};src:url(/node_modules/@fontsource/baloo-2/files/baloo-2-${bo}-${w}-normal.woff2) format('woff2')}`)).join('\n')
  const o = (ch, w, ho) => {
    const lop = w === 800 ? 'h2-nut-chinh-lon' : 'h2-nut-chinh-nho'
    const kieu = ho ? ` style="font-family:'${ho}'"` : ''
    return `<i class="o"><span class="baloo ${lop}"${kieu}>${ch}</span></i>`
  }
  let hang = ''
  for (const w of DO_DAM) {
    hang += `<div class="hang" data-w="${w}" data-loai="app">${CHU.map((c) => o(c, w)).join('')}</div>`
    hang += `<div class="hang" data-w="${w}" data-loai="mau">${CHU.map((c) => o(c, w, `Mau ${boCua(c)} ${w}`)).join('')}</div>`
  }
  const that = CHUOI_THAT.map((t) => `<div class="that"><span class="baloo h2-nut-chinh-lon">${t}</span></div>`).join('')
  return `<!doctype html><meta charset="utf-8">${link}
<link rel="stylesheet" href="/src/components/hoa2/sanh-ban-do.css">
<style>${mau}
html,body{margin:0;background:rgb(255,255,255)}
.h2-sanh{display:block!important;min-height:0!important;height:auto!important;position:static!important;overflow:visible!important;background:rgb(255,255,255)!important;color:rgb(0,0,0)!important;padding:8px!important}
.hang{display:flex;flex-wrap:wrap;width:1600px}
.o{display:inline-block;width:40px;height:52px;position:relative;font-style:normal;overflow:hidden}
.o span{position:absolute;left:6px;top:8px;color:rgb(0,0,0);font-size:28px!important;line-height:1!important}
.that{padding:4px 0;color:rgb(0,0,0)}
</style>
<div class="h2-sanh">${hang}${that}</div>`
}

const may = http.createServer((q, r) => {
  const url = decodeURIComponent(q.url.split('?')[0])
  if (url === '/') { r.setHeader('content-type', 'text/html;charset=utf-8'); return r.end(may.trang) }
  const p = path.join(GOC, url)
  if (!p.startsWith(GOC) || !fs.existsSync(p)) return r.writeHead(404).end()
  r.setHeader('content-type', p.endsWith('.css') ? 'text/css' : p.endsWith('.woff2') ? 'font/woff2' : 'font/woff')
  r.end(fs.readFileSync(p))
}).listen(0)
const cong = may.address().port

const trinh = await chromium.launch({ executablePath: CHROME })
let tongLoi = 0
for (const [ten, thuTu] of [['xuôi', cssApp], ['ngược', [...cssApp].reverse()]]) {
  may.trang = trang(thuTu)
  const tab = await trinh.newPage({ viewport: { width: 1640, height: 900 }, deviceScaleFactor: 1 })
  await tab.goto(`http://localhost:${cong}/`)
  await tab.evaluate(async () => { await document.fonts.ready; await new Promise((r) => setTimeout(r, 200)) })
  const png = (await tab.screenshot({ fullPage: true, type: 'png' })).toString('base64')
  const ket = await tab.evaluate(async (b64) => {
    const anh = new Image(); anh.src = 'data:image/png;base64,' + b64; await anh.decode()
    const cv = document.createElement('canvas'); cv.width = anh.width; cv.height = anh.height
    const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(anh, 0, 0)
    const muc = (el) => { const r = el.getBoundingClientRect(); return cx.getImageData(r.left + scrollX, r.top + scrollY, r.width, r.height).data }
    const loi = []
    for (const w of [800, 700]) {
      const app = [...document.querySelectorAll(`.hang[data-w="${w}"][data-loai="app"] .o`)]
      const mau = [...document.querySelectorAll(`.hang[data-w="${w}"][data-loai="mau"] .o`)]
      app.forEach((o, i) => {
        const a = muc(o), m = muc(mau[i]); let khac = 0, muc_ = 0
        for (let k = 0; k < a.length; k += 4) {
          const da = a[k] < 128, dm = m[k] < 128
          if (da || dm) muc_++
          if (da !== dm) khac++
        }
        const tl = muc_ ? khac / muc_ : 0
        if (tl > 0.08) loi.push({ w, chu: o.textContent, lech: Math.round(tl * 100) })
      })
    }
    return loi
  }, png)
  if (TEP_ANH && ten === 'xuôi') await tab.screenshot({ path: TEP_ANH, type: 'jpeg', quality: 60, clip: { x: 0, y: 0, width: 1640, height: 440 } })
  await tab.close()
  console.log(`[${ten}] ${cssApp.length} CSS · ${CHU.length} chữ × 2 độ đậm · hỏng: ${ket.length}`)
  if (ket.length) console.log('  ' + ket.map((k) => `${k.chu}(${k.w}:${k.lech}%)`).join(' '))
  tongLoi += ket.length
}
await trinh.close(); may.close()
console.log(tongLoi ? `ĐỎ — ${tongLoi} chữ vẽ sai so với tệp phông gốc` : 'XANH — mọi chữ tiếng Việt vẽ đúng phông Baloo 2 ở cả hai thứ tự nạp')
process.exit(tongLoi ? 1 : 0)
