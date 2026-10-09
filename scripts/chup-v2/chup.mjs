#!/usr/bin/env node
// CHỤP ẢNH BẢN DUYỆT V2 bằng Chromium THẬT (Playwright), dữ liệu GIẢ (trang.tsx thay `fetch`; mọi yêu cầu ra ngoài máy cục bộ bị CHẶN).
//   npx vite build --config scripts/chup-v2/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-v2/chup.mjs <thư mục tạm> <thư mục ảnh> [ten1,ten2,…]
// Mỗi ảnh: JPG tự hạ chất lượng tới khi ≤ 150 KB. In: lỗi trang, tràn ngang (px), vùng chạm < 44px (nút/đường dẫn hiển thị).
// Thoát mã 1 nếu có lỗi trang hoặc tràn ngang.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.argv[2] ?? 'dist-chup-v2')
const RA = resolve(process.argv[3] ?? 'anh-v2')
const CHON = (process.argv[4] ?? '').split(',').filter(Boolean)
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const PUB = resolve(import.meta.dirname, '../../public')
const may = createServer((req, res) => {
  const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = join(DIST, duong)
  const pub = join(PUB, duong)
  const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-v2/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' })
  res.end(readFileSync(tep))
}).listen(0)
const goc = `http://127.0.0.1:${may.address().port}`
const trangGoc = `${goc}/scripts/chup-v2/trang.html`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const trinh = await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })

/** [tên ảnh, ?man=, rộng, cao, nền ('light'|'dark'), cả trang?, chờ chữ (regex)] */
const DS = [
  ['01a-hom-nay-doc', 'sanh', 390, 844, 'light', true, /Hôm nay/],
  ['01a-hom-nay-doc-toi', 'sanh', 390, 844, 'dark', true, /Hôm nay/],
  ['01b-hom-nay-ngang-dien-thoai', 'sanh', 844, 390, 'light', false, /Hôm nay/],
  ['01b-hom-nay-ngang-dien-thoai-toi', 'sanh', 844, 390, 'dark', false, /Hôm nay/],
  ['01c-hom-nay-may-tinh-toi', 'sanh', 1440, 960, 'dark', false, /Hôm nay/],
  ['01c-hom-nay-may-tinh', 'sanh', 1440, 960, 'light', false, /Hôm nay/],
  ['01d-hom-nay-xong', 'sanh-xong', 390, 844, 'light', true, /Hôm nay/],
  ['01e-hom-nay-ca-dang-mo', 'sanh-ca-mo', 390, 844, 'light', false, /Vào thi/],
  ['01f-hom-nay-dang-tai', 'sanh-dang-tai', 390, 844, 'light', false, /Hành trình/],
  ['06-than-thu-doc', 'than-thu', 390, 844, 'light', true, /Thần thú của em/],
  ['06-than-thu-may-tinh', 'than-thu', 1440, 900, 'light', false, /Thần thú của em/],
  ['07-cua-hang-doc', 'cua-hang', 390, 844, 'light', true, /Cửa hàng/],
  ['07-cua-hang-may-tinh', 'cua-hang', 1440, 900, 'light', false, /Cửa hàng/],
  ['08-bat-linh-dao-ngang', 'dao', 1280, 720, 'light', false, /LÊN ĐƯỜNG|Lên đường/, 'dao'],
  ['08-bat-linh-dao-dien-thoai-ngang', 'dao', 844, 390, 'light', false, /LÊN ĐƯỜNG|Lên đường/, 'dao'],
  ['08-bat-linh-dao-doc', 'dao', 390, 844, 'light', false, /LÊN ĐƯỜNG|Lên đường/, 'dao'],
  ['09-doan-ho-tong-ngang', 'doan', 1280, 720, 'light', false, /CHỐT ĐÁP ÁN|CHỌN ĐÁP ÁN/, 'doan'],
  ['09-doan-ho-tong-dien-thoai-ngang', 'doan', 844, 390, 'light', false, /CHỐT ĐÁP ÁN|CHỌN ĐÁP ÁN/, 'doan'],
  ['14-gv-nhip-hom-nay', 'gv-nhip', 1440, 960, 'light', false, /Nhịp học hôm nay/],
  ['14-gv-nhip-hom-nay-toi', 'gv-nhip', 1440, 960, 'dark', false, /Nhịp học hôm nay/],
  ['14-gv-nhip-hom-nay-dien-thoai', 'gv-nhip', 390, 844, 'light', true, /Nhịp học hôm nay/],
  ['14-gv-nhip-dien-thoai-toi', 'gv-nhip', 390, 844, 'dark', true, /Nhịp học hôm nay/],
  ['14-gv-nhip-ngang-toi', 'gv-nhip', 844, 390, 'dark', true, /Nhịp học hôm nay/],
  ['14-gv-nhip-ngang', 'gv-nhip', 844, 390, 'light', true, /Nhịp học hôm nay/],
  ...['light', 'dark'].flatMap((nen) => [[390,844,'doc'],[844,390,'ngang'],[1440,900,'may-tinh']].flatMap(([w,h,k]) => [
    [`20-ph-${k}-${nen}`, 'ph', w,h,nen,true,/Hôm nay/],
    [`21-de-thu-${k}-${nen}`, 'de-thu',w,h,nen,true,/Đề thử 14 câu/,'de-thu'],
  ])),
  ['18-gv-ma-tran-de', 'gv-ma-tran', 1440, 700, 'light', false, /Ma trận đề/],
]

const loiTrang = []
const tran = []
const chamNho = []
for (const [ten, m, w, hgt, nen, ca, cho, viec] of DS) {
  if (CHON.length && !CHON.some((c) => ten.startsWith(c))) continue
  const ctx = await trinh.newContext({ viewport: { width: w, height: hgt }, deviceScaleFactor: 1, colorScheme: nen, hasTouch: w < 900, isMobile: w < 500 })
  await ctx.route((u) => !u.href.startsWith(goc), (r) => r.abort())
  const t = await ctx.newPage()
  t.setDefaultTimeout(8000)
  t.on('pageerror', (e) => loiTrang.push(`${ten}: ${e.message}`))
  t.on('console', (msg) => { if (msg.type() === 'error' && !/Failed to load resource/.test(msg.text())) loiTrang.push(`${ten}: console ${msg.text().slice(0, 200)}`) })
  await t.goto(`${trangGoc}?man=${m}`)
  try {
    await t.getByText(cho).first().waitFor({ timeout: 20000 })
  } catch {
    loiTrang.push(`${ten}: không thấy chữ ${cho}`)
  }
  try {
    if (viec === 'de-thu') {
      await t.locator('.dao2-de-thu-cau').first().locator('.pa-hang').nth(2).click()
      const chon = t.locator('.dao2-de-thu-ban-do button').first()
      if (await chon.getAttribute('data-da-lam') !== 'true') throw new Error('Bản đồ không cập nhật câu đã làm')
      const rong = {width:w,height:hgt}
      await t.setViewportSize({width:hgt,height:w})
      await t.waitForTimeout(200)
      if (await chon.getAttribute('data-da-lam') !== 'true') throw new Error('Xoay làm mất đáp án')
      await t.setViewportSize(rong)
      await t.getByRole('button',{name:'Câu 14: chưa làm',exact:true}).click()
      if (await t.evaluate(()=>document.activeElement?.id) !== 'de-thu-cau-14') throw new Error('Không đưa focus đến câu 14')
      await t.getByRole('button',{name:'Câu 1: đã làm',exact:true}).click()
      await t.evaluate(()=>window.scrollTo(0,0))
    } else if (viec === 'dao') {
      await t.getByRole('button', { name: /LÊN ĐƯỜNG|Lên đường/ }).first().click()
      await t.getByText(/^ẢI 1\//).first().waitFor({ timeout: 20000 })
      await t.waitForTimeout(600)
      await t.getByRole('button', { name: /CH₃COOCH₃|CH3COOCH3/ }).first().click()
    } else if (viec === 'doan') {
      await t.waitForTimeout(600)
      await t.getByRole('button', { name: /Methyl acetate/ }).first().click()
    }
  } catch (e) {
    const chu = `${ten}: thao tác ${viec} hỏng — ${String(e).slice(0, 300)}`
    loiTrang.push(chu)
    console.log(chu)
  }
  await t.waitForTimeout(900)
  const tr = await t.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  if (tr > 0) tran.push(`${ten}: ${tr}px`)
  const nho = await t.evaluate(() =>
    [...document.querySelectorAll('button, a[href], [role="button"]')]
      .filter((e) => {
        const r = e.getBoundingClientRect()
        const s = getComputedStyle(e)
        return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && (r.width < 44 || r.height < 44)
      })
      .map((e) => `${(e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 40)} ${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`),
  )
  if (nho.length) chamNho.push(`${ten}: ${nho.join(' | ')}`)
  for (const q of [72, 60, 50, 40, 32, 25, 20, 15]) {
    const buf = await t.screenshot({ type: 'jpeg', quality: q, fullPage: ca })
    if (buf.length <= 150 * 1024 || q === 15) {
      writeFileSync(join(RA, `${ten}.jpg`), buf)
      console.log(`${ten}.jpg ${(buf.length / 1024).toFixed(0)} KB (q${q}) · tràn ngang ${tr}px`)
      break
    }
  }
  await ctx.close()
}
await trinh.close()
may.close()
console.log(`\nLỗi trang: ${loiTrang.length}`)
for (const l of loiTrang) console.log('  ' + l)
console.log(`Tràn ngang: ${tran.length}`)
for (const l of tran) console.log('  ' + l)
console.log(`Vùng chạm < 44px: ${chamNho.length}`)
for (const l of chamNho) console.log('  ' + l)
process.exit(loiTrang.length || tran.length ? 1 : 0)
