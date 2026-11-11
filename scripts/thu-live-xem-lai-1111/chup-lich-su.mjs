#!/usr/bin/env node
// CHỤP MÀN «LỊCH SỬ LIVE» CỦA THẦY (11/11) trên BẢN BUILD THẬT (`dist`, đường /gv) trong Chromium thật — dữ liệu giả cục bộ, KHÔNG chạm máy chủ thật.
//   npm run build && node scripts/thu-live-xem-lai-1111/chup-lich-su.mjs [dist] [thư mục ảnh = docs/ban-ve-live-xem-lai-1011]
// Trạng thái: nút Live ở Hôm nay (chip đang xử lý) · có buổi · đang xử lý + dựng lỗi · chọn nhiều · xác nhận xoá · đổi tên · rỗng — khổ 1366 và 390, sáng / tối.
// Kèm soát: lỗi trang, tràn ngang, đích bấm nhỏ hơn 44 px trong màn. Cách mở khoá app thầy trên máy thử: dùng lại `prepare` của scripts/kiem-runtime-c3-1410.mjs.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const GOC = resolve(import.meta.dirname, '../..')
const DIST = resolve(process.argv[2] ?? join(GOC, 'dist'))
const ANH = resolve(process.argv[3] ?? join(GOC, 'docs/ban-ve-live-xem-lai-1011'))
if (!existsSync(join(DIST, 'index.html'))) throw new Error('Chưa có dist/index.html. Chạy trước: npm run build')
mkdirSync(ANH, { recursive: true })
const fixtureHost = 'https://live-xem-lai-thu.example.com', fixtures = { now: Date.now() }
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.wasm': 'application/wasm' }
const may = createServer((req, res) => {
  const path = new URL(req.url, 'http://x').pathname
  if (path === '/__seed') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end('<!doctype html><html><body>Dữ liệu thử cục bộ</body></html>') }
  if (path === '/cau-hinh.json') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ mayChuMoi: fixtureHost })) }
  const tep = resolve(DIST, `.${decodeURIComponent(path)}`), co = tep.startsWith(`${DIST}/`) && existsSync(tep) && statSync(tep).isFile()
  if (!co && extname(path)) { res.writeHead(404); return res.end('thiếu tệp') }
  const chon = co ? tep : join(DIST, 'index.html')
  res.writeHead(200, { 'content-type': mime[extname(chon)] || 'application/octet-stream', 'cache-control': 'no-cache' }); res.end(readFileSync(chon))
})
await new Promise((r) => may.listen(0, '127.0.0.1', r))
const base = `http://127.0.0.1:${may.address().port}`
// Mở khoá app thầy bằng đúng bộ gieo dữ liệu thử đã có (không chép lại mã mã hoá khoá).
const nguon = readFileSync(join(GOC, 'scripts/kiem-runtime-c3-1410.mjs'), 'utf8')
const m = /async function prepare\(page,role\)\{[\s\S]*?\n\}\n/.exec(nguon)
if (!m) throw new Error('Không tìm thấy hàm prepare trong scripts/kiem-runtime-c3-1410.mjs')
const prepare = new Function('base', 'fixtureHost', 'fixtures', `${m[0]}; return prepare`)(base, fixtureHost, fixtures)

// ── Dữ liệu giả sát bản vẽ ──
const ngay = (lui) => new Date(Date.now() + 7 * 3600e3 - lui * 86400e3).toISOString().slice(0, 10)
const B = (id, lui, lop, ten, phut, cau, mb, gio, them = {}) => ({ id, ngay: ngay(lui), lop, batLuc: `${ngay(lui)}T${gio}:00.000Z`, tenTuDong: ten, tenThay: null, soCau: cau, soDoan: cau, giayLive: phut * 60, giayDoan: phut * 36, trangThai: 'xong', tienDo: 100, ban: 1, byte: Math.round(mb * 1048576), quyen: 'lop', ve: 've-thu', ...them })
const DS_DAY = [
  B('b1', 1, '12A1', 'Bài 8. Amine', 48, 5, 19, '12:34'), B('b2', 2, '11A2', 'Bài 8. Sulfuric acid và muối sulfate', 41, 5, 16, '10:32'), B('b3', 4, '12A1', 'Bài 7. Ôn tập chương 2', 52, 6, 20, '12:31'),
  B('b4', 5, '10A1', 'Bài 10. Quy tắc octet', 35, 4, 13, '10:35'), B('b5', 8, '12A1', 'Bài 6. Tinh bột và cellulose', 37, 4, 14, '12:36'), B('b6', 11, '12A1', 'Bài 5. Saccharose và maltose', 44, 5, 17, '12:33'),
  B('b7', 130, '12A1', 'Bài 4. Giới thiệu về carbohydrate. Glucose và fructose', 58, 7, 22, '12:30'),
]
let kich = 'day'
const dsHienTai = () => {
  if (kich === 'rong') return []
  if (kich === 'xu-ly') return [B('b0', 0, '12A1', '', 0, 0, 0, '12:30', { trangThai: 'dang_xu_ly', tienDo: 62, ve: null }), B('bl', 3, '11A2', 'Bài 7. Sulfur và sulfur dioxide', 0, 0, 0.4, '10:30', { trangThai: 'loi', tienDo: 0, ve: null }), ...DS_DAY.slice(1)]
  return DS_DAY
}
const traLenh = (p) => {
  if (p === '/gv/live-ds') { const buoi = dsHienTai(); return { ok: true, buoi, tongByte: buoi.reduce((s, b) => s + b.byte, 0) } }
  if (p === '/gv/lop') return { ok: true, soEm: 262, lop: [] }
  if (p === '/gv/buoi-hoc') return { ok: true, buoi: [] }
  return { ok: false, error: 'Dữ liệu thử: lệnh này không có trong bài chụp.' }
}

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined, args: ['--no-sandbox'] })
const loiTrang = [], soat = []
async function mo(rong, cao, mau) {
  const ctx = await trinh.newContext({ viewport: { width: rong, height: cao }, deviceScaleFactor: rong < 500 ? 2 : 1, colorScheme: mau, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', reducedMotion: 'reduce', serviceWorkers: 'block' })
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort())
  await ctx.route(`${fixtureHost}/**`, (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(traLenh(new URL(r.request().url()).pathname)) }))
  const t = await ctx.newPage()
  t.on('pageerror', (e) => loiTrang.push(`${rong} ${mau}: ${e.message}`))
  await prepare(t, 'gv')
  await t.goto(`${base}/gv`, { waitUntil: 'networkidle' })
  await t.locator('.gvhn-dau').waitFor({ timeout: 20000 })
  await t.evaluate(() => document.fonts.ready)
  return { ctx, t }
}
async function chup(t, ten) {
  let q = 84, buf
  do { buf = await t.screenshot({ type: 'jpeg', quality: q }); q -= 6 } while (buf.length > 150 * 1024 && q > 30)
  writeFileSync(join(ANH, `that-gv-${ten}.jpg`), buf)
  // soát: tràn ngang + đích bấm nhỏ trong màn Lịch sử Live / hộp thoại
  const s = await t.evaluate(() => {
    const tran = document.documentElement.scrollWidth > window.innerWidth + 1
    const nho = [...document.querySelectorAll('.lsl button, .lsl .gvv2-tim, .lsl-o, .hxn-hop button, .hxn-hop input')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 43.5 || r.width < 43.5) && !e.closest('.lsl-o') && !e.classList.contains('hxn-man') }).map((e) => `${e.className || e.tagName}:${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`)
    return { tran, nho }
  })
  soat.push({ ten, kb: Math.round(buf.length / 1024), ...s })
  console.log(`  that-gv-${ten}.jpg ${Math.round(buf.length / 1024)} KB${s.tran ? ' · TRÀN NGANG' : ''}${s.nho.length ? ` · đích nhỏ: ${s.nho.join(', ')}` : ''}`)
}
const moLichSu = async (t) => { await t.getByRole('button', { name: /^Live/ }).first().click(); await t.locator('.lsl').waitFor({ timeout: 10000 }); await t.waitForTimeout(400) }

for (const [rong, cao, mau] of [[1366, 860, 'light'], [1366, 860, 'dark'], [390, 844, 'light'], [390, 844, 'dark']]) {
  const duoi = `${rong}-${mau === 'dark' ? 'toi' : 'sang'}`
  console.log(`Khổ ${rong}, ${mau === 'dark' ? 'tối' : 'sáng'}`)
  // 1. Nút Live ở Hôm nay, có chip «1 đang xử lý»
  kich = 'xu-ly'
  let { ctx, t } = await mo(rong, cao, mau)
  await t.locator('.gvv2-chip', { hasText: 'đang xử lý' }).waitFor({ timeout: 15000 }).catch(() => {})
  await chup(t, `hom-nay-nut-live-${duoi}`)
  // 2. Đang xử lý buổi vừa xong + một buổi dựng lỗi
  await moLichSu(t)
  await chup(t, `dang-xu-ly-${duoi}`)
  await ctx.close()
  // 3. Có buổi
  kich = 'day'
  ;({ ctx, t } = await mo(rong, cao, mau))
  await moLichSu(t)
  await chup(t, `lich-su-${duoi}`)
  // 4. Chọn nhiều (3 buổi cũ nhất) — bấm «Chọn buổi cũ hơn 120 ngày» rồi tích thêm hai buổi
  await t.getByRole('button', { name: /Chọn buổi cũ hơn 120 ngày/ }).click()
  for (const ten of ['Bài 5. Saccharose và maltose', 'Bài 6. Tinh bột và cellulose']) await t.getByRole('checkbox', { name: `Chọn buổi ${ten}` }).check()
  await t.waitForTimeout(200)
  await chup(t, `chon-nhieu-${duoi}`)
  // 5. Xác nhận xoá
  await t.getByRole('button', { name: /^Xoá 3 buổi$/ }).click()
  await t.getByRole('alertdialog').waitFor()
  await chup(t, `xac-nhan-xoa-${duoi}`)
  await t.getByRole('button', { name: 'Giữ lại' }).click()
  await t.getByRole('button', { name: 'Bỏ chọn' }).click()
  // 6. Đổi tên có xem trước
  await t.getByRole('button', { name: 'Đổi tên buổi Bài 8. Amine' }).click()
  await t.getByRole('dialog').waitFor()
  await t.getByRole('dialog').getByRole('textbox').fill('Bài 8. Amine · chữa bài tính khối lượng muối')
  await t.waitForTimeout(150)
  await chup(t, `doi-ten-${duoi}`)
  await ctx.close()
  // 7. Rỗng
  kich = 'rong'
  ;({ ctx, t } = await mo(rong, cao, mau))
  await moLichSu(t)
  await chup(t, `rong-${duoi}`)
  await ctx.close()
}
await trinh.close(); may.close()
const tran = soat.filter((s) => s.tran).length, nho = soat.reduce((s, x) => s + x.nho.length, 0), to = soat.filter((s) => s.kb > 150).length
writeFileSync(join(ANH, 'that-gv-soat.json'), JSON.stringify({ luc: new Date().toISOString(), soAnh: soat.length, loiTrang, tranNgang: tran, dichBamNho: nho, anhQua150KB: to, anh: soat }, null, 1))
console.log(`\n${soat.length} ảnh · lỗi trang ${loiTrang.length} · tràn ngang ${tran} · đích bấm nhỏ ${nho} · ảnh quá 150 KB ${to}`)
if (loiTrang.length) console.log(loiTrang.join('\n'))
process.exit(loiTrang.length || tran || nho || to ? 1 : 0)
