#!/usr/bin/env node
// CHỤP + ĐO «đề Bình Phản Ứng giống chặng, có giám thị» (thầy 10/11) — Chromium thật, dữ liệu giả (trang.tsx).
//   npx vite build --config scripts/chup-bpu-de-chang-1011/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-bpu-de-chang-1011/chup.mjs <thư mục tạm> <thư mục ảnh> [nhãn: truoc|sau] [cảnh,cảnh…]
// Mỗi cảnh in số đo: cuộn ngang, giám thị có / không, nút Gửi có đè phương án không, chữ có tràn khỏi bong bóng không.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.argv[2] ?? 'dist-chup-bpu')
const ANH = resolve(process.argv[3] ?? 'docs/ban-ve-bpu-1011')
const NHAN = process.argv[4] ?? 'sau'
const CHON = (process.argv[5] ?? '').split(',').filter(Boolean)
mkdirSync(ANH, { recursive: true })
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const PUB = resolve(import.meta.dirname, '../../public')
const may = createServer((req, res) => {
  const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = join(DIST, duong), pub = join(PUB, duong)
  const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-bpu-de-chang-1011/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' })
  res.end(readFileSync(tep))
}).listen(0)
const goc = `http://127.0.0.1:${may.address().port}`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })

const chonDs = async (t) => { for (const [i, v] of ['Đúng', 'Đúng', 'Sai', 'Sai'].entries()) await t.getByRole('group', { name: `Chọn cho ý ${'abcd'[i]}` }).getByRole('button', { name: new RegExp(`^${v}`) }).click() }
const gui = async (t) => { await t.locator('.bpu-gui-noi[data-hien="true"]').click(); await t.waitForTimeout(1600) }
/** Cảnh: tên ảnh (sau tiền tố `20-`), đường dẫn, khổ, sáng / tối, thao tác trước khi chụp. `ca` = chụp cả trang cuộn (ảnh so chặng ↔ BPU). */
const CANH = [
  // cùng một câu (đúng–sai «hợp chất chứa nitrogen») ở chặng và ở BPU
  { ten: `chang-${NHAN}-dung-sai-toi-390`, url: '?man=chang&cau=ds', w: 390, h: 844, toi: true },
  { ten: `bpu-${NHAN}-dung-sai-toi-390`, url: '?man=bpu&cau=ds', w: 390, h: 844, toi: true },
  { ten: `bpu-${NHAN}-dung-sai-sang-390`, url: '?man=bpu&cau=ds', w: 390, h: 844 },
  { ten: `chang-${NHAN}-dung-sai-sang-390`, url: '?man=chang&cau=ds', w: 390, h: 844, chiSau: true },
  // câu có cảnh «hình của đề vẽ lại» (thẻ riêng dưới đề, ẩn ảnh gốc) — chặng và Bình Phản Ứng cùng hiện
  { ten: `chang-${NHAN}-hinh-ve-lai-toi-390`, url: '?man=chang&cau=ds&ve=1', w: 390, h: 844, toi: true, chiSau: true },
  { ten: `bpu-${NHAN}-hinh-ve-lai-toi-390`, url: '?man=bpu&cau=ds&ve=1', w: 390, h: 844, toi: true, chiSau: true },
  // ba loại câu có giám thị
  { ten: `bpu-${NHAN}-trac-nghiem-toi-390`, url: '?man=bpu&cau=tn', w: 390, h: 844, toi: true },
  { ten: `bpu-${NHAN}-trac-nghiem-da-chon-sang-390`, url: '?man=bpu&cau=tn', w: 390, h: 844, lam: async (t) => { await t.getByRole('radio').nth(1).click() }, chiSau: true },
  { ten: `bpu-${NHAN}-tra-loi-ngan-toi-390`, url: '?man=bpu&cau=tln', w: 390, h: 844, toi: true, lam: async (t) => { for (const s of ['6', ',', '4', '8']) await t.locator('.bpu-phim button', { hasText: new RegExp(`^${s}$`) }).click() } },
  { ten: `bpu-${NHAN}-de-ngan-sang-390`, url: '?man=bpu&cau=ngan', w: 390, h: 844, chiSau: true },
  // sau khi gửi (lớp che giữ nguyên) + thầy mở đáp án
  { ten: `bpu-${NHAN}-dang-gui-toi-390`, url: '?man=bpu&cau=ds', w: 390, h: 844, toi: true, chiSau: true, lam: async (t) => { await chonDs(t); await t.locator('.bpu-gui-noi[data-hien="true"]').click(); await t.waitForTimeout(240) }, ngay: true },
  { ten: `bpu-${NHAN}-da-gui-che-toi-390`, url: '?man=bpu&cau=ds', w: 390, h: 844, toi: true, chiSau: true, lam: async (t) => { await chonDs(t); await gui(t) } },
  { ten: `bpu-${NHAN}-mo-dap-an-toi-390`, url: '?man=bpu&cau=ds', w: 390, h: 844, toi: true, chiSau: true, lam: async (t) => { await chonDs(t); await gui(t); await t.evaluate(() => window.__bpu.mo()); await t.waitForTimeout(900) } },
  { ten: `bpu-${NHAN}-ban-len-bang-de-chi-xem-toi-390`, url: '?man=bpu&cau=ds', w: 390, h: 844, toi: true, chiSau: true, lam: async (t) => { await t.evaluate(() => window.__bpu.goi()); await t.waitForTimeout(700); await t.locator('.bpu-de-xem').scrollIntoViewIfNeeded() } },
  // khổ khác + chữ to + máy yếu + máy ngang
  { ten: `bpu-${NHAN}-dung-sai-toi-360`, url: '?man=bpu&cau=ds', w: 360, h: 760, toi: true, chiSau: true },
  { ten: `bpu-${NHAN}-dung-sai-toi-430`, url: '?man=bpu&cau=ds', w: 430, h: 932, toi: true, chiSau: true },
  { ten: `bpu-${NHAN}-chu-130-toi-390`, url: '?man=bpu&cau=ds&chu=130', w: 390, h: 844, toi: true, chiSau: true },
  { ten: `bpu-${NHAN}-may-yeu-sang-390`, url: '?man=bpu&cau=tn&yeu=1', w: 390, h: 844, chiSau: true },
  { ten: `bpu-${NHAN}-tra-loi-ngan-sang-360`, url: '?man=bpu&cau=tln', w: 360, h: 760, chiSau: true },
  { ten: `bpu-${NHAN}-chu-130-trac-nghiem-sang-390`, url: '?man=bpu&cau=tn&chu=130', w: 390, h: 844, chiSau: true },
  { ten: `bpu-${NHAN}-ngang-toi-844`, url: '?man=bpu&cau=ds', w: 844, h: 390, toi: true, chiSau: true },
  { ten: `bpu-${NHAN}-ngang-trac-nghiem-sang-844`, url: '?man=bpu&cau=tn', w: 844, h: 390, chiSau: true },
]

let do_ = 0
for (const c of CANH) {
  if (CHON.length ? !CHON.some((x) => c.ten.includes(x)) : NHAN !== 'sau' && c.chiSau) continue
  const ctx = await trinh.newContext({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: c.toi ? 'dark' : 'light', reducedMotion: c.url.includes('yeu=1') ? 'reduce' : 'no-preference' })
  const t = await ctx.newPage()
  const loi = []
  t.on('pageerror', (e) => loi.push(e.message))
  await t.goto(goc + '/' + c.url)
  await t.evaluate(() => document.fonts.ready)
  await t.locator('.ht2-lam-de').first().waitFor({ timeout: 15000 })
  await t.waitForTimeout(1800) // phông + giám thị nạp lười + quyết khung chữ L
  if (c.lam) await c.lam(t)
  if (!c.ngay) await t.waitForTimeout(500) // `ngay`: chụp giữa hiệu ứng gửi (đề còn hiện ~0,5 s, giám thị cúi nhìn)
  const so = await t.evaluate(() => {
    const hop = (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height } }
    const cat = (a, b) => a.x < b.r - 1 && b.x < a.r - 1 && a.y < b.b - 1 && b.y < a.b - 1
    const than = document.querySelector('.bpu-hs-than') ?? document.scrollingElement
    const gt = document.querySelector('.duo-gt-nv svg'), bong = document.querySelector('.duo-gt-bong'), nut = document.querySelector('.bpu-gui-noi'), che = document.querySelector('.bpu-che')
    // chữ / hình của đề phải nằm TRONG bong bóng (không tràn ngang), giám thị không đè chữ đề
    const de = document.querySelector('.ht2-lam-de')
    const tranDe = de && bong ? [...de.querySelectorAll('.ht2-lam-de-chu, img, table')].filter((x) => x.getBoundingClientRect().width > 0 && (hop(x).r > hop(bong).r + 1 || hop(x).x < hop(bong).x - 1)).length : 0
    // từng DÒNG chữ đề (khung chữ L cho chữ chảy quanh giám thị ⇒ đo theo dòng, không theo khối) + ảnh đề không được chồng lên hình giám thị
    const dong = []
    if (de) { const w = document.createTreeWalker(de, NodeFilter.SHOW_TEXT); for (let n = w.nextNode(); n; n = w.nextNode()) { if (!n.textContent.trim() || n.parentElement.closest('[hidden], .ht2-an') || getComputedStyle(n.parentElement).position === 'absolute') continue; const r = document.createRange(); r.selectNodeContents(n); for (const x of r.getClientRects()) if (x.width > 1) dong.push({ x: x.left, y: x.top, r: x.right, b: x.bottom }) } for (const i of de.querySelectorAll('img')) dong.push(hop(i)) }
    const g = gt ? hop(gt) : null
    const deGt = g ? dong.filter((d) => cat(d, { x: g.x + g.w * 0.22, y: g.y + g.h * 0.12, r: g.r - g.w * 0.22, b: g.b - g.h * 0.06 })).length : 0
    // nút Gửi nổi không đè nút trả lời nào
    const deNut = nut && !che ? [...document.querySelectorAll('.bpu-hs-than button, .bpu-hs-than [role=radio], .bpu-hs-than .ht2-lam-o-hang, .bpu-hs-than .ht2-lam-de')].filter((x) => x.getBoundingClientRect().width > 0 && cat(hop(x), hop(nut))).length : 0
    return { cuonNgang: than.scrollWidth > than.clientWidth + 1 || document.scrollingElement.scrollWidth > innerWidth + 1, giamThi: !!gt, chuL: !!document.querySelector('.duo-gt-san[data-l]'), tranDe, deGt, deNut, anhDe: [...document.querySelectorAll('.ht2-lam-de img')].map((i) => `${Math.round(i.getBoundingClientRect().width)}×${Math.round(i.getBoundingClientRect().height)}`).join(' '), che: !!che }
  })
  const tep = join(ANH, `20-${c.ten}.jpg`)
  // ảnh ≤ 150 KB: hạ dần chất lượng
  for (const q of [72, 60, 50, 40, 32]) { await t.screenshot({ path: tep, type: 'jpeg', quality: q }); if (statSync(tep).size <= 150_000) break }
  const xau = so.cuonNgang || so.tranDe || so.deGt || so.deNut || loi.length
  if (xau) do_++
  console.log(`${xau ? 'ĐỎ ' : 'ok '} ${c.ten} · ${Math.round(statSync(tep).size / 1024)} KB · ${JSON.stringify(so)}${loi.length ? ' · LỖI ' + loi.join(' | ') : ''}`)
  await ctx.close()
}
await trinh.close(); may.close()
console.log(do_ ? `${do_} cảnh đỏ` : '0 đỏ')
process.exit(do_ ? 1 : 0)
