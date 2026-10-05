#!/usr/bin/env node
// CHỤP ẢNH OMNI 3 bằng Chromium THẬT (Playwright), dữ liệu GIẢ (trang.tsx thay `fetch`; mọi yêu cầu ra ngoài máy cục bộ bị CHẶN).
//   npx vite build --config scripts/chup-omni-3/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-omni-3/chup.mjs <thư mục tạm> <thư mục ảnh> [man1,man2,…]
// Khổ: học sinh + phụ huynh 390×844 (điện thoại dọc), thầy 1440×900. Ảnh JPG, tự hạ chất lượng tới khi ≤ 150 KB.
// In ra: lỗi trang, tràn ngang (px) từng ảnh. Thoát mã 1 nếu có lỗi trang hoặc tràn ngang.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.argv[2] ?? 'dist-chup-omni')
const RA = resolve(process.argv[3] ?? 'anh-omni-3')
const CHON = (process.argv[4] ?? '').split(',').filter(Boolean)
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const may = createServer((req, res) => {
  const p = join(DIST, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  const tep = existsSync(p) && statSync(p).isFile() ? p : join(DIST, 'scripts/chup-omni-3/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' })
  res.end(readFileSync(tep))
}).listen(0)
const goc = `http://127.0.0.1:${may.address().port}`
const trangGoc = `${goc}/scripts/chup-omni-3/trang.html`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const trinh = await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })

const loiTrang = []
const tran = []
async function chup(trang, ten, fullPage = false) {
  const t = await trang.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  if (t > 0) tran.push(`${ten}: ${t}px`)
  for (const q of [72, 60, 50, 40, 32, 25]) {
    const buf = await trang.screenshot({ type: 'jpeg', quality: q, fullPage })
    if (buf.length <= 150 * 1024 || q === 25) {
      writeFileSync(join(RA, `${ten}.jpg`), buf)
      console.log(`${ten}.jpg ${(buf.length / 1024).toFixed(0)} KB (q${q}) · tràn ngang ${t}px`)
      return
    }
  }
}

async function lenDuong(t) {
  const nut = t.getByRole('button', { name: /LÊN ĐƯỜNG/ }).first()
  await nut.waitFor({ timeout: 30000 })
  for (let i = 0; i < 40 && (await nut.isDisabled()); i++) await t.waitForTimeout(250)
  await nut.click()
  await t.getByText(/^ẢI 1\//).first().waitFor({ timeout: 20000 })
  await t.waitForTimeout(800)
}
async function chotDapAn(t, chu) {
  await t.getByRole('button', { name: chu }).first().click()
  await t.waitForTimeout(250)
  await t.getByRole('button', { name: 'CHỐT ĐÁP ÁN · TUNG CHIÊU' }).first().click()
  await t.waitForTimeout(400)
}

/** Mỗi màn: [tên, khổ, hàm chạy]. Hàm nhận trang đã mở `?man=<tên>`. */
const MAN = [
  ['sanh', [390, 844], async (t) => {
    await t.waitForSelector('text=Tu luyện', { timeout: 20000 })
    await t.waitForTimeout(1500)
    await chup(t, 'hs-sanh-390')
    await chup(t, 'hs-sanh-ca-trang-390', true)
  }],
  ['sanh-cho', [390, 844], async (t) => {
    await t.waitForSelector('text=Tu luyện', { timeout: 20000 })
    await t.waitForTimeout(1500)
    await chup(t, 'hs-sanh-cho-bai-moi-ca-trang-390', true)
  }],
  // ── Đảo 2.0 thật (Dao2 + máy chủ giả qua prop call) ──
  ['dao-chip', [390, 844], async (t) => {
    await lenDuong(t)
    await chup(t, 'hs-dao-cau-co-chip-chua-chac-390')
  }],
  ['dao-cham', [390, 844], async (t) => {
    await lenDuong(t)
    await chotDapAn(t, /^B\./)
    await t.getByRole('button', { name: /ĐÃ ĐỌC LỜI GIẢI/ }).first().waitFor({ timeout: 20000 })
    await t.waitForTimeout(600)
    await chup(t, 'hs-dao-dung-nhung-cham-390')
    await t.locator('.loi-giai').first().scrollIntoViewIfNeeded()
    await t.waitForTimeout(500)
    await chup(t, 'hs-dao-loi-giai-trac-nghiem-390')
  }],
  ['dao-chac-sai', [390, 844], async (t) => {
    await lenDuong(t)
    await chotDapAn(t, /^C\./)
    await t.getByRole('button', { name: /ĐÃ ĐỌC LỜI GIẢI/ }).first().waitFor({ timeout: 20000 })
    await t.waitForTimeout(900)
    await chup(t, 'hs-dao-chac-ma-sai-mo-loi-giai-390')
  }],
  ['dao-tln', [390, 844], async (t) => {
    await lenDuong(t)
    await t.locator('.dao2-giay input').first().fill('9,9')
    await t.waitForTimeout(250)
    await t.getByRole('button', { name: 'CHỐT ĐÁP ÁN · TUNG CHIÊU' }).first().click()
    await t.getByRole('button', { name: /ĐÃ ĐỌC LỜI GIẢI/ }).first().waitFor({ timeout: 20000 })
    await t.locator('.loi-giai').first().scrollIntoViewIfNeeded()
    await t.waitForTimeout(600)
    await chup(t, 'hs-dao-loi-giai-tra-loi-ngan-390')
  }],
  ['dao-tram', [390, 844], async (t) => {
    await lenDuong(t)
    for (let i = 1; i <= 3; i++) {
      await chotDapAn(t, /^A\./)
      if (i < 3) {
        const nut = t.getByRole('button', { name: new RegExp(`ĐÃ ĐỌC LỜI GIẢI · SANG ẢI ${i + 1}`) })
        await nut.waitFor({ timeout: 20000 })
        await nut.click()
        await t.waitForTimeout(500)
      }
    }
    await t.getByText('Trạm hồi phục', { exact: false }).first().waitFor({ timeout: 20000 })
    await t.waitForTimeout(700)
    await t.getByText('Trạm hồi phục', { exact: false }).first().scrollIntoViewIfNeeded()
    await chup(t, 'hs-tram-hoi-phuc-390')
    const lam = t.getByRole('button', { name: 'Làm 3 câu nền' })
    if (await lam.count()) {
      await lam.first().click()
      await t.waitForTimeout(1200)
      await chup(t, 'hs-tram-cau-nen-390')
      await t.locator('.lg-nen-cau input').first().fill('0,1')
      await t.getByRole('button', { name: 'Nộp câu này' }).first().click()
      await t.locator('.lg-kq').first().waitFor({ timeout: 20000 })
      await t.waitForTimeout(500)
      await chup(t, 'hs-tram-cau-nen-loi-giai-390')
    }
  }],
  ['de-thu', [390, 844], async (t) => {
    await t.getByRole('button', { name: 'Nộp đề thử' }).first().waitFor({ timeout: 20000 }).catch(() => {})
    await t.waitForTimeout(1200)
    await chup(t, 'hs-de-thu-390')
  }],
  // ── App thầy: bảng Dạy học → bước "Bài hôm nay" (tick bài, chọn em theo điểm danh) ──
  ['gv-bai', [1440, 900], async (t) => {
    await t.getByRole('heading', { name: 'Bài hôm nay' }).first().waitFor({ timeout: 30000 })
    await t.waitForTimeout(800)
    await t.locator('[data-bai="DH-12-C1-B3"] input[type="radio"], [data-bai="DH-12-C1-B3"] [role="radio"]').first().click()
    await t.getByRole('heading', { name: 'Chọn em nhận chiến dịch' }).first().waitFor({ timeout: 20000 })
    await t.waitForTimeout(1200)
    await t.getByRole('heading', { name: 'Bài hôm nay' }).first().scrollIntoViewIfNeeded()
    await chup(t, 'gv-bai-hom-nay-ca-lop-1440', true)
    const chip = t.getByRole('group', { name: 'Chọn em theo điểm danh' }).getByRole('button').first()
    await chip.click()
    await t.waitForTimeout(1200)
    await t.getByRole('heading', { name: 'Chọn em nhận chiến dịch' }).first().scrollIntoViewIfNeeded()
    await chup(t, 'gv-bai-hom-nay-theo-diem-danh-1440')
  }],
  // ── Bảng chiến dịch của thầy: OMNI TẮT (bảng cũ y nguyên) và OMNI BẬT (ô P + n câu, Sơ ý, Khoảng cách tới 8, "Cần thầy chữa" ba nhóm) ──
  ['gv-bang-cu', [1440, 900], async (t) => {
    await t.getByRole('heading', { name: 'Cần thầy dạy lại' }).first().waitFor({ timeout: 30000 })
    await t.waitForTimeout(800)
    await chup(t, 'gv-bang-chien-dich-omni-tat-1440', true)
    await t.getByRole('heading', { name: 'Cần thầy dạy lại' }).first().scrollIntoViewIfNeeded()
    await t.waitForTimeout(300)
    await chup(t, 'gv-can-thay-day-lai-omni-tat-1440')
  }],
  ['gv-bang-omni', [1440, 900], async (t) => {
    await t.getByRole('heading', { name: 'Cần thầy chữa' }).first().waitFor({ timeout: 30000 })
    await t.waitForTimeout(800)
    await chup(t, 'gv-bang-chien-dich-omni-bat-1440', true)
    await t.getByRole('heading', { name: 'Cần thầy chữa' }).first().scrollIntoViewIfNeeded()
    await t.waitForTimeout(300)
    await chup(t, 'gv-can-thay-chua-omni-bat-1440')
    // Thẻ có hộp cuộn: cuộn hộp xuống đáy để thấy nhóm 2 (câu sai từ 4 lần — danh sách cũ) và nhóm 3 (em sơ ý cao).
    await t.evaluate(() => {
      const the = document.getElementById('cd-can-day-lai')?.closest('section')
      for (const el of the ? [...the.querySelectorAll('*')] : []) if (el.scrollHeight > el.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(el).overflowY)) el.scrollTop = el.scrollHeight
    })
    await t.waitForTimeout(300)
    await chup(t, 'gv-can-thay-chua-cuon-xuong-1440')
  }],
  ['gv-cai-dat', [1440, 900], async (t) => {
    await t.getByText(/OMNI/).first().waitFor({ timeout: 30000 })
    await t.waitForTimeout(1200)
    await chup(t, 'gv-cai-dat-omni-1440', true)
  }],
  // ── Tổng quan app thầy: thẻ "Chất lượng sửa lỗi · 14 ngày" (5 thước đo theo lớp, 05/10) — cả trang, thẻ, đổi lớp, nền tối, điện thoại 390 ──
  ['gv-tong-quan', [1440, 900], async (t) => {
    const the = t.getByRole('region', { name: /Chất lượng sửa lỗi/ })
    await the.waitFor({ timeout: 30000 })
    await t.waitForTimeout(1000)
    await chup(t, 'gv-tong-quan-ca-trang-1440', true)
    await the.scrollIntoViewIfNeeded()
    await t.waitForTimeout(300)
    await chup(t, 'gv-tong-quan-chat-luong-sua-loi-1440')
    await the.getByRole('button', { name: '11B' }).click()
    await the.getByText(/Lớp 11B/).waitFor({ timeout: 20000 })
    await the.scrollIntoViewIfNeeded()
    await t.waitForTimeout(400)
    await chup(t, 'gv-chat-luong-sua-loi-lop-11b-1440')
    await the.getByRole('button', { name: '12A1' }).click()
    await the.getByText(/Lớp 12A1/).waitFor({ timeout: 20000 })
    await t.emulateMedia({ colorScheme: 'dark' })
    await the.scrollIntoViewIfNeeded()
    await t.waitForTimeout(600)
    await chup(t, 'gv-chat-luong-sua-loi-toi-1440')
    await t.emulateMedia({ colorScheme: 'light' })
    await t.setViewportSize({ width: 390, height: 844 })
    await t.waitForTimeout(800)
    await the.scrollIntoViewIfNeeded()
    await t.waitForTimeout(300)
    await chup(t, 'gv-chat-luong-sua-loi-390')
  }],
  ['ph', [390, 844], async (t) => {
    await t.waitForSelector('[data-vung="chien-dich"]', { timeout: 30000 })
    await t.waitForTimeout(800)
    await t.locator('[data-vung="chien-dich"]').scrollIntoViewIfNeeded()
    await t.waitForTimeout(300)
    await chup(t, 'ph-chien-dich-cua-con-390')
    await chup(t, 'ph-hom-nay-ca-trang-390', true)
  }],
]

for (const [ten, [w, hgt], chay] of MAN) {
  if (CHON.length && !CHON.includes(ten)) continue
  const ctx = await trinh.newContext({ viewport: { width: w, height: hgt }, deviceScaleFactor: 1, colorScheme: 'light', locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', serviceWorkers: 'block' })
  // Chặn cứng mọi yêu cầu ra ngoài máy cục bộ (trang.tsx đã thay fetch; đây là lưới an toàn thứ hai).
  await ctx.route('**/*', (r) => (new URL(r.request().url()).origin === goc || r.request().url().startsWith('data:') ? r.continue() : r.abort()))
  const trang = await ctx.newPage()
  trang.on('pageerror', (e) => loiTrang.push(`${ten}: ${e.message.slice(0, 200)}`))
  await trang.goto(`${trangGoc}?man=${ten}&vai=phuhuynh`)
  try {
    await chay(trang)
  } catch (e) {
    loiTrang.push(`${ten}: ${String(e?.message ?? e).slice(0, 200)}`)
    await chup(trang, `LOI-${ten}`)
  }
  await ctx.close()
}
await trinh.close()
may.close()
console.log(`lỗi trang: ${loiTrang.length}${loiTrang.length ? '\n  ' + loiTrang.join('\n  ') : ''}`)
console.log(`tràn ngang: ${tran.length}${tran.length ? '\n  ' + tran.join('\n  ') : ''}`)
process.exit(loiTrang.length || tran.length ? 1 : 0)
