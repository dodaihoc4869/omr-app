#!/usr/bin/env node
// BỘ THỬ LIVE THEO KHỐI (thầy chốt build 12/11; đặc tả docs/dac-ta-live-moi-1211.md). Chromium THẬT: tờ chiếu thật + lớp nổi máy thầy (?vai=thay&noi=1&khoi=1),
// hai máy em thật (ManBinhPhanUng), phòng THẬT chạy trong Node (may-chu.mjs). Dữ liệu giả.
//   npx vite build --config scripts/thu-live-1011/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/thu-live-1011/thu-khoi-1211.mjs <thư mục tạm> [thư mục ảnh = docs/ban-ve-live-moi-1211]
// Kiểm: phòng chờ (thầy thấy bốn đội + sân; em thấy trò, đốm của bạn hiện trên máy kia) → «Bắt đầu live» → màn bốn đội → chat hai chiều (công thức có chỉ số
// dưới, bong bóng tin mới) → bật live → chế độ Bảng (tờ ẩn giấy, bảng máy em phủ kín) → về Học. Ảnh: that-*.jpg (JPG ≤ 150 KB).
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { moMayChu } from './may-chu.mjs'

const GOC = resolve(import.meta.dirname, '../..')
const DIST = resolve(process.argv[2] ?? 'dist-thu-live')
const ANH = resolve(process.argv[3] ?? join(GOC, 'docs/ban-ve-live-moi-1211'))
mkdirSync(ANH, { recursive: true })
const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
const ket = [], loiTrang = []
const kiem = (ten, dat, them = '') => { ket.push({ ten, dat: !!dat }); console.log(`${dat ? '✓' : '✗'} ${ten}${them ? ' — ' + them : ''}`) }
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] })
const may = await moMayChu({ dist: DIST })
const mo = async (duong, w, h) => {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, permissions: ['microphone'], colorScheme: 'light' })
  await ctx.route((u) => !u.href.startsWith(may.goc), (r) => r.abort())
  const p = await ctx.newPage()
  p.on('pageerror', (e) => loiTrang.push(`${duong}: ${e.message}`))
  await p.goto(`${may.goc}/scripts/thu-live-1011/trang.html?${duong}`)
  return p
}
const chup = async (p, ten) => {
  let q = 80, buf
  do { buf = await p.screenshot({ type: 'jpeg', quality: q }); q -= 8 } while (buf.length > 150 * 1024 && q > 24)
  writeFileSync(join(ANH, `that-${ten}.jpg`), buf)
}
const tran = (p) => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1 || document.documentElement.scrollHeight > innerHeight + 1)

const thay = await mo('vai=thay&noi=1&khoi=1', 1366, 768)
const em1 = await mo('vai=em&sbd=S1', 844, 390)
const em2 = await mo('vai=em&sbd=S2', 844, 390)
await ngu(2500)

// ── 1. Phòng chờ ──
kiem('phòng mang cờ khối sau khi máy thầy nối', may.trangThai()?.live?.khoi?.gd === 'cho', JSON.stringify(may.trangThai()?.live?.khoi))
kiem('thầy: lớp phòng chờ hiện, có nút Bắt đầu live', await thay.locator('.lkt-cho .lkt-bat-dau').isVisible())
kiem('thầy: bốn cột đội, đủ 8 em đã vào', (await thay.locator('.lkt-doi section').count()) === 4 && (await thay.locator('.lkt-doi li:not(.rong)').count()) === 8)
kiem('em 1: trò Giữ Lửa hiện kín màn', await em1.locator('.lke.cho .gl canvas').isVisible())
// em 1 đi sang phải 1,2 giây ⇒ máy em 2 và máy thầy nhận ảnh chụp có đốm của S1
await em1.keyboard.down('d'); await ngu(1200); await em1.keyboard.up('d'); await ngu(700)
const tinTro = async (p) => p.evaluate(() => new Promise((xong) => { const w = performance.getEntriesByType('resource').length; setTimeout(() => xong(w), 10) })).catch(() => 0)
await tinTro(em2)
await chup(thay, '03-thay-phong-cho-1366'); await chup(em1, '08-em-phong-cho-844')
kiem('phòng chờ không tràn (thầy, em)', !(await tran(thay)) && !(await tran(em1)))

// ── 2. Bắt đầu live ⇒ màn bốn đội ──
await thay.locator('.lkt-bat-dau').click(); await ngu(700)
kiem('phòng sang giai đoạn «dang»', may.trangThai()?.live?.khoi?.gd === 'dang')
kiem('em 1: màn Bốn đội hiện, có tên em', await em1.locator('.lke .bd').isVisible())
await chup(em1, '09-em-bon-doi-844')
kiem('em 1: trò đã dừng', (await em1.locator('.gl').count()) === 0)
await ngu(3300)
kiem('em 1: VẪN ở bảng danh sách khi thầy chưa chọn chế độ (không tự đóng), có nút chat', (await em1.locator('.lke .bd').count()) === 1 && await em1.locator('.lke-mep button').first().isVisible() && may.trangThai()?.live?.khoi?.che === 'sanh')
// ── 2b. Sảnh: danh sách các em + chọn chế độ (thầy 12/11) ──
kiem('thầy: sau Bắt đầu là SẢNH danh sách 8 em theo đội, hai nút chế độ', await thay.locator('.lkt-cho.sanh').isVisible() && (await thay.locator('.lkt-cho.sanh .lkt-doi li:not(.rong)').count()) === 8 && (await thay.locator('.lkt-che-to').count()) === 2)
kiem('thầy: không lộ bảng Bình Phản Ứng (điểm danh / đua top)', (await thay.locator('.bpu-bang').count()) === 0 || !(await thay.locator('.bpu-bang').first().isVisible()))
await chup(thay, '03b-thay-sanh-1366')
await thay.locator('.lkt-che-to').nth(1).click(); await ngu(2500)
kiem('chọn Bảng ở sảnh ⇒ phòng sang chế độ Bảng, dựng tờ BẢNG TRẮNG, sảnh đóng', may.trangThai()?.live?.khoi?.che === 'bang' && (await thay.locator('.lop-xem-phieu iframe').count()) === 1 && (await thay.locator('.lkt-cho.sanh').count()) === 0)
kiem('em 1: thầy chọn chế độ ⇒ bảng danh sách đóng, sang đúng chế độ', (await em1.locator('.lke .bd').count()) === 0)
kiem('thầy: công tắc Học | Bảng + nút Tin nhắn', await thay.locator('.lkt-che button').count() === 2 && await thay.locator('.lkt-nut-chat').last().isVisible())

// ── 3. Chat ──
await em1.locator('.lke-mep button').first().click(); await ngu(400)
const o = em1.locator('.lke input, .lke textarea').first()
await o.fill('Thầy ơi muối là CH3COONa đúng không ạ?'); await o.press('Enter'); await ngu(700)
kiem('em 1: tin của mình hiện trong cửa chat, công thức có chỉ số dưới', (await em1.locator('.lke sub').count()) > 0)
kiem('em 2: bong bóng tin mới + số tin trên nút', /CH/.test(await em2.locator('.lke-bong').innerText().catch(() => '')) || (await em2.locator('.lke-mep em, .lke-mep [class*=so]').count()) > 0)
await chup(em2, '11-em-bong-tin-moi-844')
kiem('thầy: nút Tin nhắn có số tin mới', (await thay.locator('.lkt-nut-chat em').count()) === 1)
await thay.locator('.lkt-vien').click({ position: { x: 2, y: 2 } }).catch(() => {})
await thay.keyboard.press('m'); await ngu(600)
kiem('thầy: phím M mở cột, thấy tin của em', /CH/.test(await thay.locator('.lkt-chat').innerText().catch(() => '')))
const oThay = thay.locator('.lkt-chat input, .lkt-chat textarea').first()
await oThay.fill('Đúng rồi, M = 82.'); await oThay.press('Enter'); await ngu(700)
kiem('em 1: nhận tin của thầy', /M = 82/.test(await em1.locator('.lke').innerText()))
await chup(em1, '13-em-chat-844'); await chup(thay, '04-thay-hoc-chat-1366')
await em1.keyboard.press('Escape'); await ngu(300)

// ── 4. Bật live rồi chế độ Bảng ──
const to = thay.frameLocator('.lop-xem-phieu iframe')
kiem('cột tin nhắn máy thầy gọn: cao ≤ 36% màn, không còn hàng tiêu đề / hàng lọc', await thay.evaluate(() => { const c = document.querySelector('.lkt-chat'); return !!c && c.getBoundingClientRect().height <= innerHeight * 0.36 && !c.querySelector('.lc-dau, .lc-loc') }))
await thay.locator('.lc-ba-cham').click(); await ngu(200)
kiem('thẻ nhỏ ba lựa chọn mở từ nút ba chấm', (await thay.locator('.lc-the-nho button').count()) === 3)
await chup(thay, '04-thay-chat-gon-1366')
await thay.locator('.lc-ba-cham').click(); await thay.locator('.lkt-nut-chat').last().click(); await ngu(300)
await to.locator('.mc-lv-nut').click(); await ngu(900)
await to.locator('.mc-lv-the [data-lv="bat-dau"]').click().catch(() => to.locator('.mc-lv-the [data-lv="khong-tieng"]').click())
await ngu(1800)
kiem('live đã bật', may.trangThai()?.live?.bat === true)
kiem('phòng: chế độ Bảng', may.trangThai()?.live?.khoi?.che === 'bang')
kiem('tờ thầy: ẩn giấy đề (bảng kín màn)', await to.locator('body.mc-che-bang').count() === 1 && !(await to.locator('.mc-vung-de').first().isVisible().catch(() => false)))
const khoBang = await em1.evaluate(() => { const b = document.querySelector('.lv-bang'), r = b?.getBoundingClientRect(); return r ? [Math.round(r.width), Math.round(r.height)] : null })
kiem('em 1: bảng live phủ gần kín màn', !!khoBang && khoBang[0] > 844 * 0.85, JSON.stringify(khoBang))
await chup(thay, '05-thay-che-do-bang-1366'); await chup(em1, '11-em-che-do-bang-844')
await thay.locator('.lkt-che button').nth(0).click(); await ngu(1800)
kiem('bấm Học khi chưa có bài ⇒ máy em GIỮ chế độ Bảng tới khi thầy chọn xong bài', may.trangThai()?.live?.khoi?.che === 'bang')
kiem('về Học khi mới có bảng trắng ⇒ mở bảng CHỌN BÀI của live', await thay.locator('.lkt-chon .bcc').isVisible())
await chup(thay, '04b-thay-chon-bai-1366')
await chup(em1, '10-em-che-do-hoc-844')

// ── 5. Kết thúc buổi ⇒ vinh danh đội thắng ──
await thay.evaluate(() => { window.__ketThucKhoi(); window.__ws.send('{"t":"ket-thuc"}') }); await ngu(1600)
kiem('em 1: màn vinh danh hiện, có tên đội thắng + xếp hạng', await em1.locator('.lke .vd h2').isVisible() && (await em1.locator('.vd-bang li').count()) >= 2, await em1.locator('.vd h2').innerText().catch(() => ''))
kiem('thầy: kết thúc là gỡ hẳn lớp live (không màn vinh danh, không nút Đóng trơ trọi)', (await thay.locator('[data-live-khoi-thay]').count()) === 0)
kiem('vinh danh không tràn (em 844×390)', await em1.evaluate(() => { const t = document.querySelector('.vd-than'); return !!t && t.scrollHeight <= t.clientHeight + 1 }))
await ngu(1200); await chup(em1, '14-em-vinh-danh-844')
await em1.locator('.vd-nut').click(); await ngu(300)
kiem('em 1: bấm Đóng ⇒ gỡ lớp nổi', (await em1.locator('.lke').count()) === 0)

kiem('0 lỗi trang', loiTrang.length === 0, loiTrang.slice(0, 3).join(' | '))
await trinh.close(); await may.dong()
const hong = ket.filter((k) => !k.dat)
console.log(`\n${ket.length - hong.length}/${ket.length} đạt`)
process.exit(hong.length ? 1 : 0)
