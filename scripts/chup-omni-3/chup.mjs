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


/** Mỗi màn: [tên, khổ, hàm chạy]. Hàm nhận trang đã mở `?man=<tên>`. */
/** Chụp RIÊNG một phần tử (cắt đúng khung phần tử, tự cuộn tới) — dùng khi cần ảnh gọn, chữ đọc được. JPG ≤ 150 KB như `chup`. */
async function chupPhan(trang, chon, ten) {
  const el = trang.locator(chon).first()
  for (const q of [72, 60, 50, 40, 32, 25]) {
    const buf = await el.screenshot({ type: 'jpeg', quality: q })
    if (buf.length <= 150 * 1024 || q === 25) {
      writeFileSync(join(RA, `${ten}.jpg`), buf)
      console.log(`${ten}.jpg ${(buf.length / 1024).toFixed(0)} KB (q${q})`)
      return
    }
  }
}
/** Chụp MỘT VÙNG của trang: từ đầu phần tử `chon` xuống `cao` px (hoặc hết phần tử) — dùng khi tấm xổ xuống tràn ra ngoài khung phần tử hoặc phần tử quá dài. */
async function chupVung(trang, chon, ten, cao = 760) {
  const el = trang.locator(chon).first()
  await el.scrollIntoViewIfNeeded()
  const h = await el.evaluate((e, c) => {
    const r = e.getBoundingClientRect()
    return { x: Math.max(0, r.left + scrollX), y: r.top + scrollY, w: r.width, h: Math.min(c, r.height) }
  }, cao)
  for (const q of [72, 60, 50, 40, 32, 25]) {
    const buf = await trang.screenshot({ type: 'jpeg', quality: q, fullPage: true, clip: { x: h.x, y: h.y, width: h.w, height: h.h } })
    if (buf.length <= 150 * 1024 || q === 25) {
      writeFileSync(join(RA, `${ten}.jpg`), buf)
      console.log(`${ten}.jpg ${(buf.length / 1024).toFixed(0)} KB (q${q})`)
      return
    }
  }
}
const MAN = [
  ['sanh', [390, 844], async (t) => {
    await t.waitForSelector('.ht-app', { timeout: 20000 })
    await t.waitForTimeout(1500)
    await chup(t, 'hs-hoc-tap-390')
    await chup(t, 'hs-hoc-tap-ca-trang-390', true)
  }],
  ['sanh-cho', [390, 844], async (t) => {
    await t.waitForSelector('.ht-app', { timeout: 20000 })
    await t.waitForTimeout(1500)
    await chup(t, 'hs-hoc-tap-cho-bai-moi-ca-trang-390', true)
  }],
  // ── Đảo 2.0 thật (Dao2 + máy chủ giả qua prop call) ──

  // ĐOÀN MỘT MÌNH · Trạm hồi phục (06/10): chốt đáp án sai ⇒ thẻ Trạm dưới kết quả câu (quãng nghỉ) ⇒ "Làm 3 câu nền" ⇒ hộp câu nền phải NỔI TRÊN lớp phủ Đoàn.





  // ── CẨN THẬN (06/10): chỉ cho em `canThan` — ô "Soát lại đơn vị và số liệu" (câu Phần III) + thẻ "Em biết câu này. Sai vì bước nào?" (sau lượt chắc-mà-sai) ──


  // ── App thầy: bảng Dạy học → bước "Bài hôm nay" (tick bài, chọn em theo điểm danh) ──
  ['gv-bai', [1440, 900], async (t) => {
    await t.getByRole('heading', { name: 'Bài hôm nay' }).first().waitFor({ timeout: 30000 })
    await t.waitForTimeout(800)
    await t.locator('[data-bai="DH-12-C1-B3"] label').first().click()
    await t.getByRole('heading', { name: 'Giao cho' }).first().waitFor({ timeout: 20000 })
    await t.waitForTimeout(1200)
    await t.getByRole('heading', { name: 'Bài hôm nay' }).first().scrollIntoViewIfNeeded()
    await chup(t, 'gv-bai-hom-nay-ca-lop-1440', true)
    const chip = t.getByRole('group', { name: 'Chọn em theo điểm danh' }).getByRole('button').first()
    await chip.click()
    await t.waitForTimeout(1200)
    await t.getByRole('heading', { name: 'Giao cho' }).first().scrollIntoViewIfNeeded()
    await chup(t, 'gv-bai-hom-nay-theo-diem-danh-1440')
  }],
  // ── ĐƯỜNG ĐI tới "Bài hôm nay" (thầy 06/10: "Tôi không thấy chỗ này"): thanh bên "Chữa trên lớp" → thẻ "Dạy học" → bước "Bài hôm nay" ──
  ['gv-len-bang', [1440, 1750], async (t) => {
    await t.getByRole('tab', { name: 'Dạy học' }).waitFor({ timeout: 30000 })
    await t.waitForTimeout(1500)
    await chup(t, 'gv-duong-di-1-chua-tren-lop-cac-the-1440')
    await t.getByRole('tab', { name: 'Dạy học' }).click()
    await t.getByRole('heading', { name: 'Bài hôm nay' }).first().waitFor({ timeout: 30000 })
    await t.waitForTimeout(1200)
    await chup(t, 'gv-duong-di-2-the-day-hoc-bon-buoc-1440')
    await t.locator('[data-bai="DH-12-C1-B3"] label').first().click()
    await t.getByRole('heading', { name: 'Giao cho' }).first().waitFor({ timeout: 20000 })
    await t.setViewportSize({ width: 1440, height: 2400 }) // đủ cao để thấy nút "Giao Bài … cho …" ở cuối thẻ xác nhận
    await t.waitForTimeout(1500)
    await chup(t, 'gv-duong-di-3-chon-bai-xac-nhan-nut-giao-1440')
    await chupPhan(t, 'section[data-khoi="bai-hom-nay"]', 'gv-duong-di-4-buoc-bai-hom-nay-chi-tiet-1440')
  }],
  // ── Bước "Bài hôm nay" LÀM LẠI (thầy 06/10): ô chọn lớp xếp khối 10 · 11 · 12 (tick nhiều lớp), cây bài đúng thứ tự, giao nhiều lớp một lần ──
  ['gv-bai-nhieu-lop', [1440, 900], async (t) => {
    const vung = 'section[data-khoi="bai-hom-nay"]'
    await t.getByRole('heading', { name: 'Bài hôm nay' }).first().waitFor({ timeout: 30000 })
    await t.locator('[data-bai="DH-12-C3-B8"]').waitFor({ timeout: 30000 })
    await t.waitForTimeout(1200)
    await t.setViewportSize({ width: 1440, height: 2400 })
    await chupVung(t, vung, 'gv-bai-moi-1-mot-lop-cay-dung-thu-tu-1440', 1500)
    await t.getByRole('button', { name: /Chọn lớp/ }).click()
    await t.getByRole('checkbox', { name: /^12 - Tinh Hoa/ }).click()
    await t.getByRole('checkbox', { name: /^12 - Nhóm 10 điểm/ }).click()
    await t.waitForTimeout(600)
    await chupVung(t, vung, 'gv-bai-moi-2-o-chon-lop-xo-xuong-theo-khoi-1440', 700)
    await t.getByRole('button', { name: 'Xong' }).click()
    await t.waitForTimeout(1500)
    await chupVung(t, vung, 'gv-bai-moi-3-ba-lop-chip-gop-1440', 1500)
    await t.locator('[data-bai="DH-12-C2-B6"] label').first().click()
    await t.getByRole('heading', { name: 'Giao cho' }).first().waitFor({ timeout: 20000 })
    await t.waitForTimeout(1800)
    await chupPhan(t, '[data-khoi="xac-nhan-tick"]', 'gv-bai-moi-4-chon-bai-6-xac-nhan-3-lop-1440')
    await t.locator('[data-khoi="xem-theo-lop"] details').first().locator('summary').click()
    await t.waitForTimeout(400)
    await chupPhan(t, '[data-khoi="xem-theo-lop"]', 'gv-bai-moi-5-xem-truoc-theo-lop-mo-chi-tiet-1440')
    await t.emulateMedia({ colorScheme: 'dark' })
    await t.waitForTimeout(500)
    await chupVung(t, vung, 'gv-bai-moi-6-che-do-toi-1440', 1500)
    await t.emulateMedia({ colorScheme: 'light' })
    await t.setViewportSize({ width: 390, height: 844 })
    await t.waitForTimeout(800)
    await chupVung(t, vung, 'gv-bai-moi-7-dien-thoai-390', 1700)
    // Điện thoại: tấm xổ xuống nằm trong luồng, ngay dưới ô (không đè thẻ lớp đã chọn dù ô cao nhiều dòng).
    await t.getByRole('button', { name: /Chọn lớp/ }).click()
    await t.waitForTimeout(500)
    await chupVung(t, '[data-khoi="chon-lop-giao"]', 'gv-bai-moi-8-dien-thoai-o-chon-lop-xo-xuong-390', 1100)
  }],
  // ── Ô "GIAO CHO" ngay dưới ô chọn lớp (thầy 06/10: "chỗ chọn lớp cho thêm mục chọn theo em, giao theo điểm danh"): ba cách Cả lớp · Theo em · Theo điểm danh ──
  ['gv-giao-cho', [1440, 900], async (t) => {
    const vung = '.bhn-lop'
    await t.getByRole('heading', { name: 'Giao cho' }).first().waitFor({ timeout: 30000 })
    await t.waitForTimeout(1200)
    await t.setViewportSize({ width: 1440, height: 1800 })
    await chupVung(t, vung, 'gv-giao-cho-1-ca-lop-1440', 520)
    await t.getByRole('radio', { name: /^Theo em/ }).click()
    await t.waitForTimeout(500)
    await chupVung(t, vung, 'gv-giao-cho-2-theo-em-1440', 640)
    await t.getByRole('radio', { name: /^Theo điểm danh/ }).click()
    await t.waitForTimeout(500)
    await chupVung(t, vung, 'gv-giao-cho-3-theo-diem-danh-1440', 560)
    await t.getByRole('group', { name: 'Chọn em theo điểm danh' }).getByRole('button').first().click()
    await t.waitForTimeout(500)
    await chupVung(t, vung, 'gv-giao-cho-4-chon-buoi-diem-danh-1440', 560)
    await t.emulateMedia({ colorScheme: 'dark' })
    await t.waitForTimeout(400)
    await chupVung(t, vung, 'gv-giao-cho-5-che-do-toi-1440', 560)
    await t.emulateMedia({ colorScheme: 'light' })
    await t.setViewportSize({ width: 390, height: 844 })
    await t.waitForTimeout(700)
    await chupVung(t, vung, 'gv-giao-cho-6-dien-thoai-390', 1100)
    await t.getByRole('radio', { name: /^Cả lớp/ }).click()
    await t.waitForTimeout(400)
    await chupVung(t, vung, 'gv-giao-cho-7-dien-thoai-ca-lop-390', 900)
  }],
  // ── Bài đứng TRƯỚC bài đã chọn/giao hiện "Đã dạy" (thầy 06/10, ảnh app thật: Bài 8 Amine là Bài hôm nay mà mọi bài trước vẫn "Chưa dạy") ──
  ['gv-bai-da-day-truoc', [1440, 900], async (t) => {
    const vung = 'section[data-khoi="bai-hom-nay"]'
    await t.getByRole('heading', { name: 'Bài hôm nay' }).first().waitFor({ timeout: 30000 })
    await t.locator('[data-bai="DH-12-C3-B8"]').waitFor({ timeout: 30000 })
    await t.waitForTimeout(1200)
    await t.setViewportSize({ width: 1440, height: 2400 })
    await chupVung(t, vung, 'gv-bai-truoc-1-chua-chon-bai-1440', 1500)
    await t.locator('[data-bai="DH-12-C3-B8"] label').first().click()
    await t.waitForTimeout(1500)
    await chupVung(t, vung, 'gv-bai-truoc-2-chon-bai-8-bai-truoc-da-day-1440', 1500)
    await t.setViewportSize({ width: 390, height: 844 })
    await t.waitForTimeout(800)
    await chupVung(t, '[data-khoi="cay-bai"]', 'gv-bai-truoc-3-dien-thoai-390', 1500)
  }],
  // ── Bước "Bài hôm nay" XOAY NGANG + MÁY TÍNH (thầy 06/10): hai cột (cây bài trái, thẻ xác nhận dính phải), cây chia cột, gọn chiều cao khi nằm ngang ──
  ['gv-bai-ngang-may-tinh', [1440, 900], async (t) => {
    const tieuDe = t.getByRole('heading', { name: 'Bài hôm nay' }).first()
    const toiDauBuoc = async () => {
      await tieuDe.evaluate((e) => e.scrollIntoView({ block: 'start' }))
      await t.evaluate(() => window.scrollBy(0, -24))
      await t.waitForTimeout(500)
    }
    await tieuDe.waitFor({ timeout: 30000 })
    await t.locator('[data-bai="DH-12-C3-B8"]').waitFor({ timeout: 30000 })
    await t.waitForTimeout(1200)
    await t.getByRole('button', { name: /Chọn lớp/ }).click()
    await t.getByRole('checkbox', { name: /^12 - Tinh Hoa/ }).click()
    await t.getByRole('checkbox', { name: /^12 - Nhóm 10 điểm/ }).click()
    await t.getByRole('button', { name: 'Xong' }).click()
    await t.waitForTimeout(1200)
    // 1 · máy tính xách tay 1440×900, chưa chọn bài: ô chờ ở cột phải
    await toiDauBuoc()
    await chup(t, 'gv-bai-ngang-1-may-tinh-1440x900-chua-chon-bai')
    // 2 · chọn Bài 6: thẻ xác nhận hiện NGAY cột phải (không phải cuộn xuống cuối cây)
    await t.locator('[data-bai="DH-12-C2-B6"] label').first().click()
    await t.getByRole('heading', { name: 'Giao cho' }).first().waitFor({ timeout: 20000 })
    await t.waitForTimeout(1500)
    await chup(t, 'gv-bai-ngang-2-may-tinh-1440x900-chon-bai-6-the-ben-phai')
    // 3 · cuộn xuống: thẻ xác nhận DÍNH theo, nút Giao luôn thấy
    await t.evaluate(() => window.scrollBy(0, 640))
    await t.waitForTimeout(600)
    await chup(t, 'gv-bai-ngang-3-may-tinh-cuon-xuong-the-van-dinh')
    // 4 · màn lớn 1920×1080
    await t.setViewportSize({ width: 1920, height: 1080 })
    await toiDauBuoc()
    await chup(t, 'gv-bai-ngang-4-man-lon-1920x1080')
    // 5 · máy tính bảng nằm ngang 1024×768: xếp dọc, cây chia 2 cột; thẻ xác nhận nằm dưới
    await t.setViewportSize({ width: 1024, height: 768 })
    await toiDauBuoc()
    await chup(t, 'gv-bai-ngang-5-may-tinh-bang-ngang-1024x768')
    // 6 · điện thoại nằm ngang 844×390: gọn chiều cao, cây chia 2 cột
    await t.setViewportSize({ width: 844, height: 390 })
    await toiDauBuoc()
    await chup(t, 'gv-bai-ngang-6-dien-thoai-ngang-844x390')
    await t.evaluate(() => window.scrollBy(0, 260))
    await t.waitForTimeout(500)
    await chup(t, 'gv-bai-ngang-7-dien-thoai-ngang-cuon-giua-cay')
    // 7 · điện thoại ngang: chọn một bài khác ⇒ thẻ xác nhận nằm dưới cây ⇒ trang tự cuộn mượt tới đầu thẻ
    await t.locator('[data-bai="DH-12-C3-B8"] label').first().click()
    await t.getByRole('heading', { name: 'Giao cho' }).first().waitFor({ timeout: 20000 })
    await t.waitForTimeout(1800)
    await chup(t, 'gv-bai-ngang-8-dien-thoai-ngang-tu-cuon-toi-the-xac-nhan')
  }],
  ['gv-chien-dich', [1440, 900], async (t) => {
    await t.getByRole('heading', { name: 'Chiến dịch luyện' }).first().waitFor({ timeout: 30000 })
    await t.getByRole('button', { name: /Giao theo bài/ }).first().waitFor({ timeout: 20000 })
    await t.waitForTimeout(800)
    await chup(t, 'gv-duong-di-5-chien-dich-luyen-nut-giao-theo-bai-1440')
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

const khongCon = CHON.filter(c => !MAN.some(([ten]) => ten === c))
if (khongCon.length) {
  await trinh.close()
  may.close()
  throw Error('Không còn cảnh chụp: ' + khongCon.join(', '))
}

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
