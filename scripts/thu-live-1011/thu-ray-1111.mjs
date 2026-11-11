#!/usr/bin/env node
// SOI «ĐƯỜNG RAY CỦA TỜ» SAU KHI MÃ BÚT CHẠY (11/11: `var ray` của bút từng đè `ray` của tờ ⇒ lưới Tổng quan rỗng, thẻ tên không mở bảng chi tiết,
// hình trong đề không phóng — không lỗi JavaScript nào). Chromium THẬT, tờ chiếu thật trong trang thử vai thầy, phòng thật chạy trong Node. Dữ liệu giả.
//   npx vite build --config scripts/thu-live-1011/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/thu-live-1011/thu-ray-1111.mjs <thư mục tạm>          ⇒ in từng phép soi, mã thoát 1 nếu có phép nào trượt
import { existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { moMayChu } from './may-chu.mjs'

const DIST = resolve(process.argv[2] ?? 'dist-thu-live')
const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
const loiTrang = [], kq = []
const soi = (ten, dat, them = '') => { kq.push(dat); console.log(`${dat ? 'ĐẠT ' : 'TRƯỢT'} · ${ten}${them ? ' · ' + them : ''}`) }

const may = await moMayChu({ dist: DIST })
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })
const ctx = await trinh.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, permissions: ['microphone'] })
await ctx.route((u) => !u.href.startsWith(may.goc), (r) => r.abort())
const thay = await ctx.newPage()
thay.on('pageerror', (e) => loiTrang.push(e.message))
await thay.goto(`${may.goc}/scripts/thu-live-1011/trang.html?vai=thay&noi=1`)
const to = thay.frameLocator('iframe')
await to.locator('body[data-bo-cuc="xong"]').waitFor({ timeout: 20000 })
const khung = thay.frames().find((f) => f !== thay.mainFrame())
const dem = (s) => to.locator(s).count()
// phím gõ vào đúng cửa sổ tờ chiếu (như khi thầy đang đứng ở tờ): chưa đưa tiêu điểm vào khung thì Tab đầu tiên chỉ là trình duyệt nhảy tiêu điểm vào khung
await thay.locator('iframe').evaluate((k) => k.contentWindow.focus())
const phim = async (k) => { await thay.keyboard.press(k); await ngu(250) }

// 1 · Tab ⇒ lưới «Tổng quan» đủ thẻ đợt; bấm thẻ đợt 2 ⇒ sang đợt 2
const soDot = await dem('#mc-ray > .mc-dot')
await phim('Tab')
const soThe = await dem('.mc-luoi.mc-mo .mc-the-dot')
soi('Tab ⇒ lưới Tổng quan có đủ thẻ đợt', soDot >= 2 && soThe === soDot, `${soThe} thẻ / ${soDot} đợt`)
if (soThe > 1) { await to.locator('.mc-luoi.mc-mo .mc-the-dot').nth(1).click(); await ngu(500) } else await phim('Escape')
const sauBam = await khung.evaluate(() => window.__mcChiSo())
soi('bấm thẻ «Đợt 2» ⇒ tờ sang đợt 2, lưới đóng', sauBam === 1 && (await dem('.mc-luoi.mc-mo')) === 0, `đợt đang chiếu: ${sauBam + 1}`)
await khung.evaluate(() => window.__mcDen(0)); await ngu(500)

// 2 · gọi em lên bảng (L) rồi bấm thẻ tên ⇒ bảng chi tiết em mở
await phim('l'); await ngu(900)
const the = to.locator('.mc-dot').first().locator('.mc-em[id]:not([hidden])').first()
const coThe = await the.count()
if (coThe) await the.click()
await ngu(400)
soi('gọi em (L) rồi bấm thẻ tên ⇒ bảng chi tiết mở', coThe > 0 && (await dem('.mc-ct.mc-mo')) === 1, `thẻ tên đang hiện: ${coThe}`)
await phim('Escape')
soi('Esc ⇒ bảng chi tiết đóng', (await dem('.mc-ct.mc-mo')) === 0)

// 3 · bấm hình trong đề ⇒ phóng hình (câu mẫu không có hình ⇒ gắn một hình giả vào vùng đề của đợt đang chiếu)
const coVung = await khung.evaluate(() => {
  const v = window.__mcDot().querySelector('.mc-vung-de'); if (!v) return false
  const im = document.createElement('img'); im.id = 'hinh-thu'; im.alt = 'Hình thử'; im.style.cssText = 'display:block;width:120px;height:60px'
  im.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60"><rect width="120" height="60" fill="gray"/></svg>')
  v.appendChild(im); return true
})
if (coVung) { await to.locator('#hinh-thu').click({ force: true }); await ngu(300) }
soi('bấm hình trong đề ⇒ lớp phóng hình mở', coVung && (await dem('.mc-phong.mc-mo img')) === 1)
if (await dem('.mc-phong.mc-mo')) { await to.locator('.mc-phong.mc-mo').click(); await ngu(200) }
await khung.evaluate(() => { const im = document.getElementById('hinh-thu'); if (im) im.remove() })

// 4 · bút vẫn vẽ; thanh cuộn bảng đen (.mc-but-ray) vẫn hiện và chạy theo độ cuộn; #mc-ray không bị đổi lớp
await phim('b')
const vung = await khung.evaluate(() => window.__mcBut.vung())
const B = vung.bang
soi('B bật bút, tờ có ô bảng đen', !!B && (await dem('body.mc-co-but')) === 1, B ? `ô bảng ${B.map((x) => x.toFixed(2)).join(' · ')}` : 'không có ô bảng')
if (B) {
  const W = 1366, H = 768, x0 = (B[0] + (B[2] - B[0]) * 0.25) * W, y0 = (B[1] + (B[3] - B[1]) * 0.3) * H
  const net = async () => { await thay.mouse.move(x0, y0); await thay.mouse.down(); for (let i = 1; i <= 24; i++) { await thay.mouse.move(x0 + i * 7, y0 + Math.sin(i / 3) * 18); await ngu(8) } await thay.mouse.up(); await ngu(250) }
  await net()
  const n1 = await khung.evaluate(() => window.__mcBut.xuat().net.length)
  soi('kéo chuột trên bảng ⇒ có một nét', n1 === 1, `${n1} nét`)
  const ray0 = await khung.evaluate(() => { const r = document.querySelector('.mc-but-ray'), t = r.querySelector('i'); return { co: r.classList.contains('mc-co'), top: t.style.top, cao: t.style.height, rong: r.getBoundingClientRect().height } })
  await thay.mouse.move(x0, y0); await thay.mouse.wheel(0, 600); await ngu(900)
  const ray1 = await khung.evaluate(() => { const t = document.querySelector('.mc-but-ray i'); return { top: t.style.top, cuon: window.__mcBut.cuon() } })
  soi('thanh cuộn bảng đen hiện khi bút bật', ray0.co && ray0.rong > 50, `vạch cao ${Math.round(ray0.rong)} px · tay nắm ${ray0.top} / ${ray0.cao}`)
  soi('lăn chuột trên bảng ⇒ bảng cuộn, tay nắm thanh cuộn chạy theo', ray1.cuon > 0 && ray1.top !== ray0.top, `độ cuộn ${ray1.cuon.toFixed(3)} · tay nắm ${ray0.top} → ${ray1.top}`)
  await net()
  const n2 = await khung.evaluate(() => { const ds = window.__mcBut.xuat().net; return { so: ds.length, y: Math.max(...ds[ds.length - 1].diem.map((d) => d[1])) } })
  soi('viết tiếp sau khi cuộn ⇒ nét mới nằm dưới phần đã cuộn', n2.so === 2 && n2.y > B[1] + (B[3] - B[1]) * 0.3 + ray1.cuon * 0.5, `${n2.so} nét · y lớn nhất ${n2.y.toFixed(3)}`)
}
const rayTo = await khung.evaluate(() => { const r = document.getElementById('mc-ray'); return { lop: r.className, dot: r.querySelectorAll(':scope > .mc-dot').length, coBut: !!r.querySelector('.mc-but-ray') } })
soi('#mc-ray của tờ không mang lớp / phần tử của thanh cuộn bút', !/mc-but-ray|mc-co\b/.test(rayTo.lop) && !rayTo.coBut && rayTo.dot === soDot, `lớp «${rayTo.lop}» · ${rayTo.dot} đợt`)
await phim('b')
soi('không lỗi JavaScript trên trang', loiTrang.length === 0, loiTrang.join(' | '))

await trinh.close(); await may.dong?.()
const truot = kq.filter((x) => !x).length
console.log(`\n${kq.length - truot} / ${kq.length} phép soi đạt`)
process.exit(truot ? 1 : 0)
