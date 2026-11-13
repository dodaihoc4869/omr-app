#!/usr/bin/env node
// BỘ THỬ LIVE THEO KHỐI TRÊN ĐƯỜNG MÃ APP THẦY THẬT (12/11, sau khi thầy thử bản sống báo «lẫn lộn hết», «không bấm được gì»): trang ?vai=gv chạy ĐÚNG
// gan-gv (bảng Bình Phản Ứng thật) + thay-khoi (lớp nổi) + tờ dựng bằng chieuCau / chieuBangTrang + phần live máy thầy; hai máy em thật (một NGANG, một
// DỌC để kiểm ép ngang); phòng THẬT chạy trong Node. Bộ thử trước (thu-khoi-1211.mjs) thiếu bảng thật nên lọt lỗi.
//   npx vite build --config scripts/thu-live-1011/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/thu-live-1011/thu-gv-that-1211.mjs <thư mục tạm> [thư mục ảnh]
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
const mo = async (duong, w, h, dienThoai = false) => {
  // `dienThoai`: máy chạm thật (pointer: coarse) — chỉ điện thoại mới bị xoay hình khi cầm dọc; cửa sổ dọc trên máy tính thì KHÔNG (chieu-xoay.ts)
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, permissions: ['microphone'], ...(dienThoai ? { hasTouch: true, isMobile: true } : {}) })
  await ctx.route((u) => !u.href.startsWith(may.goc), (r) => r.abort())
  const p = await ctx.newPage()
  // đếm mọi lời gọi khoá xoay của hệ điều hành (thầy 12/11 lần 3: máy em không được khoá xoay)
  await p.addInitScript(() => { window.__khoaXoay = 0; try { const o = screen.orientation; if (o) o.lock = function () { window.__khoaXoay++; return Promise.resolve() } } catch { /* trình duyệt không cho gán */ } })
  p.on('pageerror', (e) => loiTrang.push(`${duong}: ${e.message.slice(0, 160)}`))
  await p.goto(`${may.goc}/scripts/thu-live-1011/trang.html?${duong}`)
  return p
}
const chup = async (p, ten) => { let q = 76, buf; do { buf = await p.screenshot({ type: 'jpeg', quality: q }); q -= 8 } while (buf.length > 150 * 1024 && q > 24); writeFileSync(join(ANH, `that2-${ten}.jpg`), buf) }
const st = () => may.trangThai()
/** Thứ đang nằm trên cùng ở giữa màn máy thầy (kiểm «không lộ Hôm nay / không lộ bảng điểm danh»). */
const trenCung = (p, x = 0.4, y = 0.45) => p.evaluate(([x, y]) => { const e = document.elementFromPoint(innerWidth * x, innerHeight * y); if (!e) return 'không'; if (e.closest('#hom-nay')) return 'hom-nay'; if (e.closest('.bpu-bang')) return 'bang-bpu'; if (e.closest('.lkt-cho.sanh')) return 'sanh'; if (e.closest('.lkt-cho')) return 'phong-cho'; if (e.closest('.lkt-chon')) return 'chon-bai'; if (e.closest('.lop-xem-phieu')) return 'to'; if (e.closest('[data-live-khoi-nen]')) return 'nen'; return e.tagName + '.' + e.className }, [x, y])
const bangBpu = (p) => p.evaluate(() => { const k = document.querySelector('[data-bpu-bang]'); return k ? getComputedStyle(k).visibility : 'không có' })
/** Máy thầy có cột tin nhắn cố định ⇒ phần chiếu thu đều hệ số s về góc trên-trái: toạ độ / vùng đo «trên tờ» của các bước cũ (viết cho tờ kín cửa sổ) nhân s. */
const sGv = (p) => p.evaluate(() => parseFloat(document.documentElement.style.getPropertyValue('--lkc-s')) || 1)
const veNetGv = async (p, x0, y0) => { const s = await sGv(p); await p.mouse.move(x0 * s, y0 * s); await p.mouse.down(); for (let i = 1; i <= 14; i++) await p.mouse.move((x0 + i * 16) * s, (y0 + Math.round(Math.sin(i / 2) * 18)) * s); await p.mouse.up(); await p.mouse.move(1300, 300, { steps: 2 }); await ngu(700) } // 13/11: rời tờ sau nét (chấm laze không lọt vào ảnh đo)
const veNet = async (p, x0, y0) => { await p.mouse.move(x0, y0); await p.mouse.down(); for (let i = 1; i <= 14; i++) await p.mouse.move(x0 + i * 16, y0 + Math.round(Math.sin(i / 2) * 18)); await p.mouse.up() }

// mực trên máy em: đếm điểm ảnh sáng ở nửa trái / nửa phải của màn (ảnh chụp thật) — nét của thầy phải tới đúng chỗ, đủ cả hai nửa
const mucEm = async (p) => { const anh = (await p.screenshot({ type: 'png' })).toString('base64'); return p.evaluate(async (b64) => { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let t = 0, ph = 0; for (let k = 0; k < d.length; k += 4) if (d[k] > 130 && d[k + 1] > 130 && d[k + 2] > 130) { if (((k / 4) % c.width) < c.width / 2) t++; else ph++ } return { t, ph } }, anh) }
/** Mực trong MỘT VÙNG của màn (tỉ lệ 0..1) — kiểm đúng chỗ một nét, không lẫn chữ chờ / thanh bút / viên Live. */
const mucVung = async (p, x0, y0, x1, y1) => { const anh = (await p.screenshot({ type: 'png' })).toString('base64'); return p.evaluate(async ([b64, x0, y0, x1, y1]) => { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); const X0 = Math.round(x0 * c.width), Y0 = Math.round(y0 * c.height), W = Math.max(1, Math.round((x1 - x0) * c.width)), H = Math.max(1, Math.round((y1 - y0) * c.height)); const d = x.getImageData(X0, Y0, W, H).data; let n = 0; for (let k = 0; k < d.length; k += 4) if (d[k] > 130 && d[k + 1] > 130 && d[k + 2] > 130) n++; return n }, [anh, x0, y0, x1, y1]) }
const mucVungGv = async (p, x0, y0, x1, y1) => { const s = await sGv(p); return mucVung(p, x0 * s, y0 * s, x1 * s, y1 * s) }
/** Nét A viết trên bảng trắng ở (260..484, 182..218) của máy thầy 1366 × 768; trên máy em 844 × 390 bảng co vừa màn ⇒ quanh (195, 115). */
const netA = { gv: [0.18, 0.21, 0.37, 0.31], em: [0.17, 0.2, 0.42, 0.4] }
const gv = await mo('vai=gv', 1366, 768)
/** Bấm một nút của buổi live (thầy 12/11: cụm Học | Bảng · Lớp · Chọn bài · Tin nhắn nằm TRONG khay nút bốn ô của tờ; lúc bảng đua hiện thì còn cụm nổi của app). */
const lk = async (v) => {
  const f = gv.frameLocator('.lop-xem-phieu iframe')
  if ((await f.locator('#mc-them').getAttribute('aria-expanded')) !== 'true') { await f.locator('#mc-them').click(); await ngu(300) }
  await f.locator(`.mc-khay-lk [data-lk="${v}"]`).click()
}
const em1 = await mo('vai=em&sbd=S1', 844, 390)
const em2 = await mo('vai=em&sbd=S2', 390, 844, true) // em cầm DỌC, điện thoại
const em3 = await mo('vai=em&sbd=S3', 500, 800) // cửa sổ DỌC trên máy tính (chuột)
await gv.waitForFunction(() => window.__sanSang); await ngu(400)
// (thầy 12/11 «màn giáo viên không cần full màn hình») đếm mọi lời xin toàn màn hình của máy thầy suốt buổi thử
await gv.evaluate(() => { window.__fs = 0; Element.prototype.requestFullscreen = function () { window.__fs++; return Promise.resolve() } })
const veMan = gv.locator('.lkt-cho.sanh .lkt-ve.chinh')

// ── 1. Mở phòng chờ ──
await gv.evaluate(() => { void window.__moLive() }); await ngu(250)
kiem('1a bấm mở: lớp live hiện NGAY (không lộ Hôm nay, không lộ bảng điểm danh)', !['hom-nay', 'bang-bpu'].includes(await trenCung(gv)), await trenCung(gv))
await ngu(2600)
kiem('1b phòng chờ: phòng mang cờ khối, máy thầy ở phòng chờ', st()?.live?.khoi?.gd === 'cho' && (await trenCung(gv, 0.8, 0.5)) === 'phong-cho')
kiem('1c bảng Bình Phản Ứng có gắn (giữ nối phòng) nhưng ẨN', (await bangBpu(gv)) === 'hidden', await bangBpu(gv))
kiem('1d máy em: trò Giữ Lửa', await em1.locator('.lke.cho .gl canvas').first().isVisible())
await chup(gv, '1-phong-cho')

// ── 2. Bắt đầu live ⇒ sảnh cả hai phía, tiếng tự bật ──
await gv.locator('.lkt-bat-dau').click(); await ngu(3200)
kiem('2a máy thầy: SẢNH danh sách', (await trenCung(gv)) === 'sanh' && (await gv.locator('.lkt-cho.sanh .lkt-doi li:not(.rong)').count()) === 8)
kiem('2b live TỰ BẬT, không cần tờ, không bấm nút Live', st()?.live?.bat === true && (await gv.locator('.lop-xem-phieu').count()) === 0)
kiem('2c phòng: chế độ «sanh»; máy em ở bảng danh sách bốn đội', st()?.live?.khoi?.che === 'sanh' && (await em1.locator('.lke .bd').count()) === 1)
kiem('2d2 cửa sổ dọc trên MÁY TÍNH không bị xoay hình (thầy 12/11 «vẫn bị ép xoay ngang»)', await em3.evaluate(() => !document.querySelector('[data-xoay]')))
kiem('2d3 (thầy 12/11 lần 3 «ép ngang nhưng không khoá xoay») máy em KHÔNG gọi khoá xoay của hệ điều hành', await em2.evaluate(() => (window.__khoaXoay ?? 0) === 0), String(await em2.evaluate(() => window.__khoaXoay)))
kiem('2d em cầm DỌC bị ép ngang (xoay hình)', await em2.evaluate(() => !!document.querySelector('.lke[data-xoay]')))
await chup(gv, '2-sanh'); await chup(em1, '2-em-danh-sach'); await chup(em2, '2-em-doc-ep-ngang')

// ── 3. Ở sảnh bấm «Học» ⇒ bảng chọn bài; Esc lùi về sảnh; máy em vẫn ở danh sách ──
await gv.locator('.lkt-che-to').nth(0).click(); await ngu(900)
kiem('3a sảnh → «Học»: bảng chọn bài hiện', (await trenCung(gv)) === 'chon-bai' && await gv.locator('.lkt-chon .bcc-hd').isVisible())
kiem('3b máy em chưa đổi (thầy chưa chọn xong bài)', st()?.live?.khoi?.che === 'sanh' && (await em1.locator('.lke .bd').count()) === 1)
await chup(gv, '3-chon-bai')
await gv.keyboard.press('Escape'); await ngu(500)
kiem('3c Esc: lùi MỘT màn về sảnh (không ra Hôm nay)', (await trenCung(gv)) === 'sanh')
kiem('3c2 sảnh chưa có gì đang chiếu ⇒ KHÔNG có nút «Về màn chiếu»', (await veMan.count()) === 0)
// (thầy 12/11 «nút học phải bấm 2 lần mới chọn được bài») từ sảnh: «Học» MỘT lần ⇒ bảng chọn; chọn hoạt động ⇒ tấm hiện NGAY (không bị sảnh che dù phòng còn «sanh»)
const laThd = (p) => p.evaluate(() => !!document.elementFromPoint(innerWidth * 0.4, innerHeight * 0.4)?.closest('.thd'))
await gv.locator('.lkt-che-to').nth(0).click(); await ngu(700)
await gv.locator('.lkt-chon .bcc-hd-the').nth(2).click(); await ngu(2200)
kiem('3c3 từ sảnh: «Học» một lần → chọn «Chữa câu khó» ⇒ tấm hoạt động hiện ngay; máy em vẫn ở danh sách', (await laThd(gv)) && st()?.live?.khoi?.che === 'sanh' && (await em1.locator('.lke .bd').count()) === 1, await trenCung(gv))
kiem('3c4 không còn cụm nút nổi đè lên đầu tấm hoạt động', (await gv.locator('.lkt-vien, .lkt-che').count()) === 0)
await chup(gv, '3-hoat-dong-tu-sanh')
await gv.keyboard.press('Escape'); await ngu(500)
kiem('3c5 Esc ở tấm hoạt động: LÙI về sảnh, tấm KHÔNG bị đóng; sảnh có nút «Về màn chiếu»', (await trenCung(gv)) === 'sanh' && (await gv.locator('.thd').count()) === 1 && await veMan.isVisible(), await trenCung(gv))
await chup(gv, '3-sanh-co-ve-man-chieu')
await veMan.click(); await ngu(400)
kiem('3c6 «Về màn chiếu»: về đúng tấm đang mở, tức thì', await laThd(gv))
await gv.locator('.thd-ve').click(); await ngu(600)
kiem('3c7 đóng tấm bằng nút của tấm khi chưa có tờ nào ⇒ về sảnh (không kẹt màn trống, không ra Hôm nay)', (await gv.locator('.thd').count()) === 0 && (await trenCung(gv)) === 'sanh' && (await veMan.count()) === 0, await trenCung(gv))

// ── 3B. (thầy 12/11 «chọn sang học mà không chọn được bài», «chuyển đi chuyển lại phải lưu trước đó») «Bảng» TRƯỚC khi có bài ⇒ bảng trắng, viết;
//        «Học» ⇒ bảng chọn; chọn một HOẠT ĐỘNG ⇒ tấm hoạt động hiện TRÊN tờ; Esc đóng tấm ⇒ về bảng chọn (không kẹt màn trống) ──
await gv.locator('.lkt-che-to').nth(1).click(); await ngu(3500)
kiem('3d sảnh → «Bảng» khi chưa có bài: bảng trắng kín màn', st()?.live?.khoi?.che === 'bang' && (await trenCung(gv)) === 'to')
await veNetGv(gv, 260, 200); await ngu(1500)
const aGv0 = await mucVungGv(gv, ...netA.gv), aEm0 = await mucVung(em1, ...netA.em)
kiem('3e nét A trên bảng trắng: có trên máy thầy và tới máy em', aGv0 > 60 && aEm0 > 30, JSON.stringify({ thay: aGv0, em: aEm0 }))
await lk('hoc'); await ngu(800)
kiem('3f «Học» khi mới có bảng trắng: bảng chọn hiện, phòng CHƯA đổi chế độ', await gv.locator('.lkt-chon .bcc-hd-the').first().isVisible() && st()?.live?.khoi?.che === 'bang')
await gv.locator('.lkt-chon .bcc-hd-the').nth(1).click(); await ngu(2200)
kiem('3g chọn hoạt động «Kiểm tra đầu giờ»: tấm hoạt động hiện TRÊN tờ; phòng CHƯA đổi chế độ, máy em ở nguyên bảng (chưa có câu nào được chiếu)', await gv.evaluate(() => !!document.elementFromPoint(innerWidth * 0.4, innerHeight * 0.4)?.closest('.thd')) && st()?.live?.khoi?.che === 'bang' && (await mucVung(em1, ...netA.em)) > 30, `che ${st()?.live?.khoi?.che}`)
await chup(gv, '3-hoat-dong')
kiem('3g2 tấm nằm trên bảng trắng ⇒ có nút nổi «Về màn chiếu» ở đáy (không đè đầu tấm)', await gv.evaluate(() => { const n = document.querySelector('.lkt-ve-noi'), d = document.querySelector('.thd-dau'); if (!n || !d) return false; const a = n.getBoundingClientRect(), b = d.getBoundingClientRect(); return a.top > b.bottom + 100 && a.width > 60 }))
await gv.locator('.lkt-ve-noi').click(); await ngu(500)
kiem('3g3 bấm «Về màn chiếu» trên tấm: bảng trắng lên lại, nét A còn nguyên, tấm vẫn mở bên dưới', (await trenCung(gv)) === 'to' && (await mucVungGv(gv, ...netA.gv)) > 60 && (await gv.locator('.thd').count()) === 1, await trenCung(gv))
await gv.keyboard.press('Escape'); await ngu(500)
kiem('3g4 Esc ở màn chiếu (tấm còn bên dưới): lùi về tấm', await laThd(gv))
await gv.keyboard.press('Escape'); await ngu(500)
kiem('3g5 Esc lần nữa: lùi về sảnh; tấm và bảng KHÔNG bị đóng', (await trenCung(gv)) === 'sanh' && (await gv.locator('.thd').count()) === 1 && (await gv.locator('.lop-xem-phieu').count()) === 1)
await veMan.click(); await ngu(400)
await gv.locator('.thd-ve').click(); await ngu(800)
kiem('3h đóng tấm bằng nút của tấm ⇒ về bảng đang dạy, không kẹt màn trống', (await gv.locator('.thd').count()) === 0 && (await trenCung(gv)) === 'to' && st()?.live?.khoi?.che === 'bang', await trenCung(gv))

// ── 3C. (thầy 12/11 «bấm lên bảng thì lại quay ra đây không vào màn chiếu») chiếu câu TỪ tấm hoạt động ⇒ màn chiếu lên TRÊN tấm, máy em vào nhận đề;
//        Esc ⇒ quay lại tấm hoạt động (chọn câu kế); Esc lần nữa ⇒ đóng tấm ──
const trenHd = (p) => p.evaluate(() => { const e = document.elementFromPoint(innerWidth * 0.4, innerHeight * 0.45); return !e ? 'không' : e.closest('.thd') ? 'thd' : e.closest('.bpu-bang') ? 'bang-bpu' : e.closest('.lop-xem-phieu') ? 'to' : e.closest('[data-live-khoi-thay]') ? 'lop-noi' : 'khác' })
await lk('hoc'); await ngu(800)
await gv.locator('.lkt-chon .bcc-hd-the').nth(2).click(); await ngu(2200)
kiem('3i mở «Chữa câu khó» từ bảng trắng: tấm hoạt động ở trên', (await trenHd(gv)) === 'thd', await trenHd(gv))
// (thầy 12/11 lần 2 «bấm chiếu lên bảng xong bấm lên bảng không vào màn chiếu») tấm hoạt động THẬT tự mở tờ riêng (không qua bảng) ⇒ tờ đó phải nằm TRÊN tấm
await gv.evaluate(() => window.__chieuToRieng()); await ngu(1200)
const trenRieng = await gv.evaluate(() => { const e = document.elementFromPoint(innerWidth * 0.4, innerHeight * 0.45); const k = e?.closest('.lop-xem-phieu'); return k ? `to:${k.getAttribute('aria-label')}` : e?.closest('.thd') ? 'thd' : 'khác' })
kiem('3j tấm hoạt động tự mở tờ riêng («Chiếu lên bảng»): tờ nằm TRÊN tấm, có nút đóng để quay lại', trenRieng === 'to:Chữa câu khó · tờ chiếu' && await gv.locator('.lop-xem-phieu[aria-label="Chữa câu khó · tờ chiếu"] .khung-phieu-thanh, .lop-xem-phieu[aria-label="Chữa câu khó · tờ chiếu"] .nut-dong-phieu').first().isVisible(), trenRieng)
await chup(gv, '3-to-rieng-tren-tam')
// (thầy 12/11 «bấm đạt với chưa đạt thì lại out ra màn chọn đề chiếu lên bảng») đúng trạng thái thật: em đang lên bảng (bảng đã thu `data-an`), tờ báo chấm
const toRiengTren = () => gv.evaluate(() => { const e = document.elementFromPoint(innerWidth * 0.4, innerHeight * 0.45); return e?.closest('.lop-xem-phieu')?.getAttribute('aria-label') === 'Chữa câu khó · tờ chiếu' && !document.documentElement.hasAttribute('data-bpu-che-to') })
await gv.evaluate(() => { document.querySelector('[data-bpu-bang]')?.setAttribute('data-an', ''); window.postMessage({ nguon: 'to-chieu', loai: 'bpu-cham', dat: true }, '*') }); await ngu(900)
kiem('3j3 bấm ĐẠT trên tờ: VẪN ở màn chiếu (tờ không bị che, không văng ra tấm chọn đề)', await toRiengTren(), await trenHd(gv))
await gv.evaluate(() => { document.querySelector('[data-bpu-bang]')?.setAttribute('data-an', ''); window.postMessage({ nguon: 'to-chieu', loai: 'bpu-cham', dat: false }, '*') }); await ngu(900)
kiem('3j4 bấm CHƯA ĐẠT trên tờ: cũng vẫn ở màn chiếu', await toRiengTren(), await trenHd(gv))
await gv.keyboard.press('Escape'); await ngu(500)
kiem('3j5 Esc ở màn chiếu của tấm: lùi về sảnh, tờ KHÔNG bị đóng; có «Về màn chiếu»', (await trenCung(gv)) === 'sanh' && (await gv.locator('.lop-xem-phieu[aria-label="Chữa câu khó · tờ chiếu"]').count()) === 1 && await veMan.isVisible(), await trenCung(gv))
await veMan.click(); await ngu(400)
kiem('3j6 «Về màn chiếu»: đúng tờ cũ còn nguyên (không dựng lại), tức thì', (await toRiengTren()) && await gv.frameLocator('.lop-xem-phieu[aria-label="Chữa câu khó · tờ chiếu"] iframe').locator('#to-rieng').isVisible())
await gv.evaluate(() => window.__dongToRieng()); await ngu(400)
kiem('3j2 đóng tờ riêng ⇒ về tấm hoạt động', (await trenHd(gv)) === 'thd', await trenHd(gv))
// (thầy 12/11 «chuyển chế độ học và bảng thì từ bảng sang học lại chuyển sang màn chọn không lưu màn học tức thì») màn Học đang dở là TẤM hoạt động:
// «Bảng» (khay) ⇒ bảng trắng lên trên, nét A còn; «Học» (khay) ⇒ về đúng tấm ấy, KHÔNG ra bảng chọn
const lkApp = (v) => gv.evaluate((v) => { window.dispatchEvent(new CustomEvent('ddh-lkt', { detail: v })) }, v)
await lkApp('bang'); await ngu(900)
kiem('3j7 đang ở tấm hoạt động bấm «Bảng»: bảng trắng lên trên, nét A còn nguyên, tấm không bị đóng', (await trenHd(gv)) === 'to' && (await mucVungGv(gv, ...netA.gv)) > 60 && (await gv.locator('.thd').count()) === 1 && st()?.live?.khoi?.che === 'bang', await trenHd(gv))
await lkApp('hoc'); await ngu(900)
kiem('3j8 «Học» lại: về ĐÚNG tấm hoạt động đang dở (không ra bảng chọn), phòng sang «hoc»', (await trenHd(gv)) === 'thd' && (await gv.locator('.lkt-chon').count()) === 0 && st()?.live?.khoi?.che === 'hoc', `${await trenHd(gv)} · chọn ${await gv.locator('.lkt-chon').count()} · ${st()?.live?.khoi?.che}`)
// ── 3T. (thầy 12/11 «khi chuyển qua lại hai chế độ thì bị lỗi tọa độ bút» · «chuyển qua lại phải cực kì mượt mà chuẩn xác, lưu lại mọi thứ … một phím tắt»)
//        ĐÚNG CẢNH THẦY GẶP: tấm «Chữa câu khó» + TỜ RIÊNG THẬT của nó đang chiếu, bảng trắng cũ còn sống bên dưới. Đổi Học ⇄ Bảng nhiều lần bằng phím Tab,
//        viết bút ở từng chế độ, so chỗ nét trên máy thầy với máy em.
await gv.evaluate(() => window.__chieuToRiengThat()); await ngu(4200)
const toT = gv.frameLocator('.lop-xem-phieu[aria-label="Chữa câu khó · tờ chiếu thật"] iframe')
const soTo = () => gv.evaluate(() => [...document.querySelectorAll('.lop-xem-phieu')].map((k) => `${k.getAttribute('aria-label')}${getComputedStyle(k).visibility === 'hidden' ? ' (ẩn)' : ''}`))
kiem('3T1 tờ riêng thật của tấm đang chiếu ở «Học»; máy em nhận đề của câu', (await toT.locator('body.mc-lk').count()) === 1 && st()?.live?.khoi?.che === 'hoc' && !(await toT.locator('body.mc-che-bang').count()), JSON.stringify(await soTo()))
const maTo = await toT.locator('.mc-dot[data-qid]').evaluateAll((ds) => [...new Set(ds.map((d) => d.getAttribute('data-qid')))])
const napCuoi = may.dsNap().at(-1) ?? []
kiem('3T1b NẠP SẴN (13/11 «chuyển đề tức thì»): tờ vừa mở ⇒ app gửi máy chủ ĐỦ mã câu của tờ để phòng nạp trước', maTo.length > 0 && maTo.every((q) => napCuoi.includes(q)), JSON.stringify({ maTo, napCuoi, soLan: may.dsNap().length }))
// Thầy kẻ MỘT NÉT NGANG từ 20 % tới 80 % bề ngang bảng, ở `fy` chiều cao bảng. Máy em: tìm mực sáng trong khung bảng ⇒ nét phải (1) DÀI ≈ 60 % bề ngang ô bảng
// của em (không «bé xíu ở góc»), (2) bắt đầu ≈ 20 % bề ngang, (3) cao đúng tỉ lệ `fy` của ô bảng. Ô bảng máy em = ô của thầy co theo bề ngang khung (Học) /
// co vừa khung (Bảng) ⇒ tính từ tỉ lệ ô của thầy.
// (ô bảng tính trong khung tờ ⇒ cộng chỗ đứng của khung tờ trên trang: tờ riêng của tấm có dải đầu phía trên)
const oBangThay = async () => { const k = await gv.locator('.lop-xem-phieu[aria-label="Chữa câu khó · tờ chiếu thật"] iframe').boundingBox(); const c = await toT.locator('body').evaluate(() => { const c = window.__mcDot().querySelector('.mc-cot-lam-bai').getBoundingClientRect(); return { x: c.left, y: c.top, w: c.width, h: c.height } }); const s = await sGv(gv); return { x: c.x * s + k.x, y: c.y * s + k.y, w: c.w * s, h: c.h * s } } // tờ thu đều nhường cột tin nhắn ⇒ nhân hệ số thu
const veNgang = async (o, fy) => { const y = o.y + o.h * fy; await gv.mouse.move(o.x + o.w * 0.2, y); await gv.mouse.down(); for (let i = 1; i <= 12; i++) await gv.mouse.move(o.x + o.w * (0.2 + 0.05 * i), y); await gv.mouse.up(); await gv.mouse.move(1300, 300, { steps: 2 }); await ngu(700) } // 13/11: đưa chuột ra khỏi tờ (cột tin nhắn) — bút lơ lửng nay là chấm laze luôn hiện, để lại sẽ lọt vào ảnh đo mực
/** Các dải mực ngang trong khung bảng máy em: mỗi dải = hàng điểm ảnh liền nhau có ≥ 12 điểm sáng ⇒ { y (tỉ lệ theo Ô BẢNG của em), x0, x1 (tỉ lệ bề ngang ô) }. */
const netEm = async (p, tiLeO, vua) => { const anh = (await p.screenshot({ type: 'png' })).toString('base64'); return p.evaluate(async ([b64, tiLeO, vua]) => { const r = document.querySelector('.lv-bang').getBoundingClientRect(); const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); const X0 = Math.round(r.left) + 3, Y0 = Math.round(r.top) + 3, W = Math.round(r.width) - 6, H = Math.round(r.height) - 6, d = x.getImageData(X0, Y0, W, H).data; const s = vua ? Math.min(r.width, r.height / tiLeO) : r.width, oW = s, oH = s * tiLeO, oX = (r.width - oW) / 2; const ra = []; let dang = null; for (let y = 0; y < H; y++) { let n = 0, a = W, b = 0; for (let xx = 0; xx < W; xx++) { const k = (y * W + xx) * 4; if (d[k] + d[k + 1] + d[k + 2] > 230) { n++; if (xx < a) a = xx; if (xx > b) b = xx } } if (n >= 12) { if (!dang) { dang = { y0: y, y1: y, a, b }; ra.push(dang) } else { dang.y1 = y; dang.a = Math.min(dang.a, a); dang.b = Math.max(dang.b, b) } } else dang = null } return ra.map((g) => ({ y: Math.round(100 * ((g.y0 + g.y1) / 2 + 3) / oH) / 100, x0: Math.round(100 * (g.a + 3 - oX) / oW) / 100, x1: Math.round(100 * (g.b + 3 - oX) / oW) / 100 })) }, [anh, tiLeO, vua]) }
const coNet = (ds, fy) => ds.some((g) => Math.abs(g.y - fy) < 0.05 && Math.abs(g.x0 - 0.2) < 0.06 && Math.abs(g.x1 - 0.8) < 0.06)
await toT.locator('body').evaluate(() => window.__mcBut.bat(true)); await ngu(300)
let oB = await oBangThay()
const tiLeHoc = oB.h / oB.w
await veNgang(oB, 0.3); await ngu(1300)
const n1 = await netEm(em1, tiLeHoc, false)
kiem('3T2 «Học»: thầy kẻ nét ngang 20–80 % bề ngang ở 30 % chiều cao bảng ⇒ máy em thấy ĐÚNG nét ấy: dài 60 % ô bảng, đúng chỗ (không lệch, không bé xíu ở góc)', coNet(n1, 0.3) && n1.length === 1, JSON.stringify(n1))
{ // (thầy 13/11 lần 2 «Giữ nguyên độ nét cho hs»): ô bảng co theo BỀ NGANG khung như cũ — nét giữ cỡ; phần dưới bảng thì máy em tự trôi theo bút
  //   (bước CD7 của thu-cuon-de-1311.mjs đo thầy viết sát đáy bảng)
  const coNgang = (p) => p.evaluate(() => { const b = document.querySelector('.lv-bang'), c = b?.querySelector('.lv-cuon'), x = document.querySelector('.lv')?.getAttribute('data-xoay') != null; return b && c ? [Math.round(b.offsetWidth), Math.round(c.getBoundingClientRect()[x ? 'height' : 'width'])] : null })
  const kb = [await coNgang(em1), await coNgang(em2), await coNgang(em3)]
  kiem('BT1 «Học»: ô bảng máy em co theo bề ngang khung như trước (giữ cỡ nét cho học sinh), không thu nhỏ để vừa chiều cao', kb.every((k) => !!k && Math.abs(k[0] - k[1]) <= 3), JSON.stringify(kb))
}
if (process.env.DO_3T) { await chup(gv, '3T-gv-hoc'); await chup(em1, '3T-em-hoc'); process.exit(3) }
// Tab ⇒ Bảng: CHÍNH tờ ấy sang chế độ Bảng tức thì (không dựng tờ thứ hai), phòng sang «bang»
const soToTruoc = (await soTo()).length
await toT.locator('body').press('Tab')
const ngay = await toT.locator('body').evaluate(() => document.body.classList.contains('mc-che-bang') && window.__mcBut.trang() === 'bl')
await ngu(1700)
kiem('3T3 phím Tab: tờ đang chiếu sang «Bảng» NGAY trong cùng nhịp bấm (trang bút riêng), không dựng thêm tờ; phòng sang «bang»', ngay && st()?.live?.khoi?.che === 'bang' && (await soTo()).length === soToTruoc, JSON.stringify({ ngay, che: st()?.live?.khoi?.che, to: await soTo() }))
oB = await oBangThay()
const tiLeBang = oB.h / oB.w
const nBang0 = await netEm(em1, tiLeBang, true)
await veNgang(oB, 0.7); await ngu(1500)
const nBang1 = await netEm(em1, tiLeBang, true)
kiem('3T4 «Bảng»: nét của «Học» KHÔNG lẫn sang; thầy kẻ ở 70 % chiều cao ⇒ máy em thấy đúng nét ấy (dài 60 %, đúng chỗ); nét cũ của bảng (nét A) còn', !coNet(nBang0, 0.3) && coNet(nBang1, 0.7) && nBang1.length === nBang0.length + 1, JSON.stringify({ truoc: nBang0, sau: nBang1 }))
await chup(em1, '3T-em-bang'); await chup(gv, '3T-gv-bang')
// Tab ⇒ Học: về đúng tờ, nét cũ của «Học» còn nguyên đúng chỗ, nét của «Bảng» không lẫn
await toT.locator('body').press('Tab')
const ngay2 = await toT.locator('body').evaluate(() => !document.body.classList.contains('mc-che-bang') && window.__mcBut.trang() !== 'bl')
await ngu(1700)
const n2 = await netEm(em1, tiLeHoc, false)
kiem('3T5 Tab về «Học» NGAY trong nhịp bấm: phòng «hoc», không ra bảng chọn; trên máy em nét cũ của «Học» CÒN NGUYÊN ĐÚNG CHỖ, nét của «Bảng» không lẫn sang', ngay2 && st()?.live?.khoi?.che === 'hoc' && (await gv.locator('.lkt-chon').count()) === 0 && coNet(n2, 0.3) && n2.length === 1, JSON.stringify({ ngay2, che: st()?.live?.khoi?.che, net: n2 }))
await chup(em1, '3T-em-hoc-lai')
oB = await oBangThay()
await veNgang(oB, 0.5); await ngu(1300)
const n3 = await netEm(em1, tiLeHoc, false)
kiem('3T6 viết tiếp ở «Học» sau khi đổi qua lại: nét mới tới máy em ĐÚNG CHỖ (50 % chiều cao), nét cũ vẫn đúng chỗ', coNet(n3, 0.5) && coNet(n3, 0.3) && n3.length === 2, JSON.stringify(n3))
await toT.locator('body').press('Tab'); await ngu(1700)
const nBang2 = await netEm(em1, tiLeBang, true)
// so hai lần đo nét có dung sai 1,5 % ô bảng: từ 13/11 con trỏ lơ lửng của thầy là CHẤM LAZE đỏ (có quầng) nằm cạnh đầu nét lúc chụp ⇒ mép dải mực lệch tới 1 %
const netGiong = (a, b) => a.length === b.length && a.every((g, i) => Math.abs(g.y - b[i].y) <= 0.015 && Math.abs(g.x0 - b[i].x0) <= 0.015 && Math.abs(g.x1 - b[i].x1) <= 0.015)
kiem('3T7 Tab sang «Bảng» lần nữa: mọi nét cũ của «Bảng» CÒN NGUYÊN ĐÚNG CHỖ, nét vừa viết ở «Học» không lẫn sang', st()?.live?.khoi?.che === 'bang' && netGiong(nBang2, nBang1), JSON.stringify({ truoc: nBang1, sau: nBang2 }))
// đổi thật nhanh 6 lần liên tiếp (thầy bấm Tab liên tục) ⇒ kết thúc đúng chế độ, nét hai phía vẫn đúng
for (let i = 0; i < 6; i++) { await toT.locator('body').press('Tab'); await ngu(140) }
await ngu(2800)
const nBang3 = await netEm(em1, tiLeBang, true)
kiem('3T7b bấm Tab 6 lần liên tiếp: tờ và phòng dừng ở cùng một chế độ («bang»), nét trên máy em vẫn nguyên, đúng chỗ', st()?.live?.khoi?.che === 'bang' && (await toT.locator('body.mc-che-bang').count()) === 1 && netGiong(nBang3, nBang1), JSON.stringify({ che: st()?.live?.khoi?.che, sau: nBang3 }))
kiem('3T7c tờ riêng đang chiếu: nút nổi «Về màn chiếu» của tấm KHÔNG đè lên thanh đáy của tờ', await gv.evaluate(() => { const n = document.querySelector('.lkt-ve-noi'); return !n || getComputedStyle(n).display === 'none' }))

// ── MT. MÁY TÍNH «Đỗ Đại Học FX4869» (thầy 12/11, bản vẽ 31–34): nút trên thanh đáy của tờ ⇒ máy tính nổi, bấm được, kéo được, máy em thấy y hệt ──
const mtGv = gv.locator('.mtx-lop .mtx'), mtEm = (p) => p.locator('.mtx-lop-em .mtx')
const bamMt = async (...ds) => { for (const d of ds) { await gv.locator(`.mtx-lop .mtx-p[aria-label="${d}"]`).click(); await ngu(40) } }
const kqMt = (l) => l.locator('.mtx-kq').innerText().then((t) => t.replace(/\s+/g, ''))
const tamMt = (p, l) => l.boundingBox().then(async (b) => { const v = await p.evaluate(() => { const g = document.documentElement, c = parseFloat(g.style.getPropertyValue('--lkc-w')) || 0, s = parseFloat(g.style.getPropertyValue('--lkc-s')) || 1; return { width: innerWidth - c, height: innerHeight * (c ? s : 1) } }); /* vùng PHẦN CHIẾU: máy thầy có cột cố định thì nhỏ hơn cửa sổ */ return b ? { x: (b.x + b.width / 2) / v.width, y: (b.y + b.height / 2) / v.height, w: b.width / v.width, trong: b.x >= -1 && b.y >= -1 && b.x + b.width <= v.width + 1 && b.y + b.height <= v.height + 1 } : null })
kiem('MT1 thanh đáy của tờ có nút máy tính, đứng trước nút bốn ô; chưa bấm thì chưa có máy tính', await toT.locator('#mc-mt').isVisible() && await toT.locator('body').evaluate(() => { const m = document.getElementById('mc-mt'), t = document.getElementById('mc-them'); return !!m && !!t && m.getBoundingClientRect().right <= t.getBoundingClientRect().left + 1 && m.getAttribute('aria-pressed') === 'false' }) && (await mtGv.count()) === 0 && (await mtEm(em1).count()) === 0)
await toT.locator('#mc-mt').click(); await ngu(900)
kiem('MT2 bấm nút ⇒ máy tính nổi TRÊN tờ chiếu (máy thầy), nút sáng; máy em hiện máy tính chỉ-xem', await mtGv.isVisible() && (await toT.locator('#mc-mt').getAttribute('aria-pressed')) === 'true' && await gv.evaluate(() => { const m = document.querySelector('.mtx-lop .mtx').getBoundingClientRect(); return !!document.elementFromPoint(m.left + m.width / 2, m.top + m.height / 2)?.closest('.mtx') }) && await mtEm(em1).isVisible())
await bamMt('5', ',', '6', '▫/▫', '5', '6'); await gv.locator('.mtx-dpad button[data-h="R"]').click(); await bamMt('×', '2', '4', ',', '7', '9', '='); await ngu(900)
kiem('MT2b máy tính không che thanh đáy của tờ (nút máy tính vẫn bấm được); bề cao thật ≈ MT_CAO', await gv.evaluate(() => { const m = document.querySelector('.mtx-lop .mtx'), r = m.getBoundingClientRect(), u = parseFloat(m.style.getPropertyValue('--u')); window.__mtCao = Math.round(r.height / u); return r.bottom <= innerHeight - 56 && r.top >= 0 && Math.abs(window.__mtCao - 538) <= 6 }), String(await gv.evaluate(() => window.__mtCao)))
kiem('MT2c nút tròn điều hướng đủ BỐN mũi tên', (await gv.evaluate(() => [...document.querySelectorAll('.mtx-lop .mtx-dpad s')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2 && getComputedStyle(e).display !== 'none' }).length)) === 4)
kiem('MT3 thầy bấm 5,6/56 × 24,79 = ⇒ màn máy thầy ra 2,479', (await kqMt(mtGv)) === '2,479', await kqMt(mtGv))
kiem('MT4 máy em hiện ĐÚNG phép tính và kết quả thầy vừa bấm', (await kqMt(mtEm(em1))) === '2,479' && (await mtEm(em1).locator('.mtx-bt .mtx-ps').count()) === 1, await kqMt(mtEm(em1)))
kiem('MT5 máy tính trên máy em KHÔNG bắt chạm (em vẫn kéo đề / chọn đáp án được)', await em1.evaluate(() => { const m = document.querySelector('.mtx-lop-em .mtx').getBoundingClientRect(); return !document.elementFromPoint(m.left + m.width / 2, m.top + m.height / 2)?.closest('.mtx') }))
const mtA = await tamMt(gv, mtGv), mtAe = await tamMt(em1, mtEm(em1)), mtDoc = await tamMt(em2, mtEm(em2))
kiem('MT6 máy em: cùng vị trí tương đối với máy thầy, nằm gọn trong màn (cả máy cầm dọc)', !!mtA && !!mtAe && mtAe.trong && Math.abs(mtAe.x - mtA.x) < 0.2 && !!mtDoc && mtDoc.trong, JSON.stringify({ thay: mtA, em: mtAe, emDoc: mtDoc }))
await chup(gv, 'mt-1-thay'); await chup(em1, 'mt-2-em'); await chup(em2, 'mt-3-em-doc')
{ const k = await gv.locator('.mtx-lop .mtx-keo').boundingBox(); await gv.mouse.move(k.x + k.width / 2, k.y + k.height / 2); await gv.mouse.down(); for (let i = 1; i <= 10; i++) await gv.mouse.move(k.x + k.width / 2 - i * 52, k.y + k.height / 2 + i * 6); await gv.mouse.up(); await ngu(900) }
const mtB = await tamMt(gv, mtGv), mtBe = await tamMt(em1, mtEm(em1))
kiem('MT7 nắm thanh trên cùng kéo sang trái ⇒ máy tính dời theo (vẫn trong màn), máy em dời theo cùng chiều', !!mtB && mtB.trong && mtA.x - mtB.x > 0.25 && mtAe.x - mtBe.x > 0.15 && mtBe.trong, JSON.stringify({ truoc: mtA, sau: mtB, emTruoc: mtAe, emSau: mtBe }))
await chup(gv, 'mt-4-thay-keo')
await bamMt('MENU'); await ngu(500)
kiem('MT8 MENU: máy thầy và máy em cùng hiện danh sách 6 mục', (await mtGv.locator('.mtx-ds li').count()) === 6 && (await mtEm(em1).locator('.mtx-ds li').count()) === 6)
await bamMt('2', '2', '1', '=', '(−)', '3', '=', '2', '='); await ngu(600)
kiem('MT9 giải x² − 3x + 2 = 0 ngay trên máy: x₁ = 2 (máy em thấy như thầy)', (await kqMt(mtGv)) === '2' && (await mtGv.locator('.mtx-bt .nh').innerText()) === 'x₁ =' && (await kqMt(mtEm(em1))) === '2', `${await mtGv.locator('.mtx-bt').innerText()} ${await kqMt(mtGv)}`)
await chup(gv, 'mt-5-thay-pt')
await bamMt('MENU', '1', '1', '÷', '3', '='); await ngu(500)
kiem('MT10 về Tính toán: 1 ÷ 3 = ra phân số 1/3 kiểu sách', (await mtGv.locator('.mtx-kq .mtx-ps').count()) === 1 && (await kqMt(mtGv)) === '13')
await toT.locator('#mc-mt').click(); await ngu(900)
kiem('MT11 bấm nút lần nữa ⇒ máy tính ẩn ở máy thầy VÀ máy em, nút tắt sáng', (await mtGv.count()) === 0 && (await mtEm(em1).count()) === 0 && (await mtEm(em2).count()) === 0 && (await toT.locator('#mc-mt').getAttribute('aria-pressed')) === 'false')
await toT.locator('#mc-mt').click(); await ngu(900)
const mtC = await tamMt(gv, mtGv)
kiem('MT12 hiện lại: phép tính dở và vị trí còn nguyên', (await mtGv.locator('.mtx-kq .mtx-ps').count()) === 1 && !!mtC && Math.abs(mtC.x - mtB.x) < 0.02, JSON.stringify({ truoc: mtB, sau: mtC }))
await toT.locator('#mc-mt').click(); await ngu(900)
kiem('MT13 cất máy tính lần cuối: máy thầy và máy em đều sạch, tờ chiếu vẫn ở trên cùng', (await mtGv.count()) === 0 && (await mtEm(em1).count()) === 0 && await toT.locator('#mc-mt').isVisible() && (await toT.locator('#mc-mt').getAttribute('aria-pressed')) === 'false')
// ── NV. Máy tính học sinh (dùng chuột): tay nắm vàng mép phải phải THẤY và BẤM được (thầy 12/11 tối: «không có nút vàng bên phải để bấm») ──
const nv = await em1.evaluate(() => { const c = document.querySelector('.lv-kg-cuon'), n = document.querySelector('.lv .lv-nam, .lv-phu .lv-nam'), i = n?.querySelector('i'); if (!c || !n || !i) return { thieu: `${!!c}/${!!n}/${!!i}` }; const r = i.getBoundingClientRect(), tren = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { cuon: c.offsetWidth - c.clientWidth, rong: Math.round(r.width), cao: Math.round(r.height), mo: +getComputedStyle(i).opacity, trenCung: !!tren?.closest('.lv-nam'), sat: Math.round(innerWidth - r.right) } })
kiem('NV1 bảng live trên máy em KHÔNG còn thanh cuộn chiếm mép phải; tay nắm to (8 × 64), rõ, nằm trên cùng, sát mép phải', nv.cuon === 0 && nv.rong >= 8 && nv.cao >= 60 && nv.mo >= 0.9 && nv.trenCung && nv.sat <= 6, JSON.stringify(nv))
await em1.locator('.lv .lv-nam, .lv-phu .lv-nam').first().click(); await ngu(500)
kiem('NV2 bấm tay nắm bằng chuột ⇒ khay điều khiển mở', (await em1.locator('.lv-nam[aria-expanded="true"]').count()) === 1 && await em1.locator('.lv-khay').first().isVisible())
await chup(em1, 'nv-1-em-khay')
await em1.locator('.lv .lv-nam, .lv-phu .lv-nam').first().click(); await ngu(400)
// ── HH. PHÍM / «Hiểu chưa?» (thầy 12/11 tối, bản vẽ 38–41): máy em hai phím 1 · 2 giữa phần bảng 1/3 bên phải, chọn xong tự ẩn; máy thầy đếm + đốm sáng ──
const hhSo = () => gv.evaluate(() => [...document.querySelectorAll('.hh-lop .hh-so')].map((e) => e.textContent).join('/'))
kiem('HH0 chưa bấm / thì máy thầy và máy em chưa có gì', (await gv.locator('.hh-lop').count()) === 0 && (await em1.locator('.hh-em').count()) === 0)
await toT.locator('body').press('/'); await ngu(900)
const hhEm = await em1.evaluate(() => { const t = document.querySelector('.hh-the'); if (!t) return null; const r = t.getBoundingClientRect(); return { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight, trai: r.left / innerWidth, trong: r.top >= 0 && r.bottom <= innerHeight && r.right <= innerWidth, nut: [...t.querySelectorAll('.hh-nut')].map((n) => n.textContent) } })
kiem('HH1 thầy bấm / trong tờ ⇒ máy thầy hiện «bầu trời» ở 1/3 bên phải; máy em hiện hai phím 1 Hiểu · 2 Chưa hiểu ở CHÍNH GIỮA phần bảng 1/3 bên phải', await gv.locator('.hh-troi').isVisible() && (await gv.evaluate(() => { const ds = document.querySelectorAll('.lop-xem-phieu'), o = ds[ds.length - 1].getBoundingClientRect(); return (document.querySelector('.hh-troi').getBoundingClientRect().left - o.left) / o.width })) > 0.64 && !!hhEm && hhEm.trai >= 0.655 && Math.abs(hhEm.x - 0.83) < 0.03 && Math.abs(hhEm.y - 0.5) < 0.04 && hhEm.trong && hhEm.nut.join('|') === '1Hiểu|2Chưa hiểu', JSON.stringify(hhEm))
kiem('HH1b máy em cầm DỌC (hình xoay) và cửa sổ dọc trên máy tính cũng có hai phím, nằm gọn trong màn', await em2.locator('.hh-the').isVisible() && await em3.locator('.hh-the').isVisible() && await em2.evaluate(() => { const r = document.querySelector('.hh-the').getBoundingClientRect(); return r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight }))
kiem('HH1c (thầy 13/11 «ẩn chữ hiểu chưa và các em đang trả lời đi, dịch 1 0 xuống phía dưới») máy thầy: dòng tựa ẩn, hai số nằm thấp hơn chỗ thẻ tên', await gv.evaluate(() => { const h = document.querySelector('.hh-troi h3'), c = document.querySelector('.hh-troi .hh-cot'), t = document.querySelector('.hh-troi'); return !!h && getComputedStyle(h).display === 'none' && !!c && c.getBoundingClientRect().top - t.getBoundingClientRect().top >= 60 }))
await chup(gv, 'hh-1c-gv-khong-tua')
await chup(em1, 'hh-1-em'); await chup(em2, 'hh-2-em-doc')
await em1.locator('.hh-nut').first().click(); await ngu(250)
kiem('HH2 em chạm «1 Hiểu» ⇒ hai phím TỰ ẨN NGAY, thoáng «Đã gửi thầy»; hơn 1 giây sau sạch hẳn', (await em1.locator('.hh-the').count()) === 0 && (await em1.locator('.hh-da').count()) === 1)
await em2.locator('.hh-nut.k2').click(); await em3.keyboard.press('1'); await ngu(1500)
kiem('HH3 ba em trả lời (chạm 1 · chạm 2 trên máy xoay dọc · bấm phím 1 trên máy tính) ⇒ máy thầy đếm 2 hiểu / 1 chưa hiểu, ba đốm sáng, ghi đúng TÊN em chưa hiểu', (await hhSo()) === '2/1' && (await gv.locator('.hh-dom.a').count()) === 2 && (await gv.locator('.hh-dom.b').count()) === 1 && (await gv.locator('.hh-ten span').count()) === 1 && (await em1.locator('.hh-em').count()) === 0, `${await hhSo()} · ${await gv.locator('.hh-ten').innerText()} · ${await gv.locator('.hh-vong p').innerText()}`)
kiem('HH3b bảng kết quả không bắt chạm (thầy vẫn viết bảng được) và không lộ sang máy em', await gv.evaluate(() => { const r = document.querySelector('.hh-troi').getBoundingClientRect(); return !document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('.hh-lop') }) && (await em1.locator('.hh-troi, .hh-ten').count()) === 0)
await chup(gv, 'hh-3-thay')
await ngu(4500)
kiem('HH4 máy thầy nhắc lại «đang hỏi» mỗi 4 giây: em đã trả lời KHÔNG bị hỏi lại', (await em1.locator('.hh-the').count()) === 0 && (await em2.locator('.hh-the').count()) === 0)
await toT.locator('body').press('/'); await ngu(700)
kiem('HH5 bấm / lần nữa ⇒ đóng ở máy thầy', (await gv.locator('.hh-lop').count()) === 0)
await toT.locator('body').press('/'); await ngu(900)
kiem('HH6 hỏi lượt MỚI ⇒ máy em hiện lại hai phím, máy thầy đếm lại từ 0', await em1.locator('.hh-the').isVisible() && (await hhSo()) === '0/0')
await toT.locator('body').press('/'); await ngu(900)
kiem('HH7 thầy đóng khi em chưa trả lời ⇒ hai phím trên máy em tự cất', (await em1.locator('.hh-the').count()) === 0 && (await em2.locator('.hh-em').count()) === 0)
// ── LR. LUẬT «RỜI MÀN N LẦN ⇒ BỊ MỜI RA» (thầy chốt build 13/11, bản vẽ 48–54) ──
const emRoi = (p) => p.evaluate(() => { Object.defineProperty(document, 'hidden', { get: () => true, configurable: true }); Object.defineProperty(document, 'visibilityState', { get: () => 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')) })
const emVe = async (p) => { await p.evaluate(() => { delete document.hidden; delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('focus')) }); await p.mouse.click(70, 70); await ngu(300); await p.getByRole('button', { name: 'Quay lại lượt đang làm' }).click({ timeout: 1500 }).catch(() => {}); await ngu(600) } // em bấm «Quay lại lượt đang làm» như thật (bị mời ra thì màn phủ che nút ⇒ bỏ qua)
const roiVe = async (p) => { await emRoi(p); await ngu(500); await emVe(p) }
const luatPhong = () => st()?.live?.luat ?? null
/** Mở / đóng khay nút bốn ô của tờ cho đúng trạng thái mong muốn (khay có thể đang mở sẵn từ bước trước). */
const khay = async (mo) => { const dang = await toT.locator('body').evaluate(() => document.body.classList.contains('mc-khay-mo')); if (dang !== mo) { await toT.locator('#mc-them').click(); await ngu(400) } }
await khay(true)
kiem('LR0 đang dạy bằng TỜ RIÊNG của tấm hoạt động (có dải trắng trên đầu): cột tin nhắn cố định VẪN hiện, phần chiếu thu đều (thầy 13/11 «chưa thấy cột nhắn tin trên app thầy»)', (await gv.locator('.lkt-cot').count()) === 1 && await gv.evaluate(() => document.documentElement.hasAttribute('data-lk-cot') && !!document.querySelector('.lop-xem-phieu:not([aria-label="Tờ chiếu Bình Phản Ứng"])')))
kiem('LR1 nút bốn ô có hàng «Luật của buổi»: công tắc đang tắt, số lần 3; bấm + ra 4, bấm − về 3', await toT.locator('.mc-khay-luat .mc-luat').isVisible() && (await toT.locator('.mc-luat-cong').getAttribute('aria-checked')) === 'false' && (await toT.locator('.mc-luat-buoc output').innerText()) === '3 lần' && await (async () => { await toT.locator('[data-lu="+"]').click(); const a = await toT.locator('.mc-luat-buoc output').innerText(); await toT.locator('[data-lu="-"]').click(); return a === '4 lần' && (await toT.locator('.mc-luat-buoc output').innerText()) === '3 lần' })() && luatPhong() === null)
await toT.locator('.mc-luat-cong').click(); await ngu(900)
kiem('LR2 bật công tắc ⇒ phòng ghi luật 3 lần, công tắc sáng; MỌI máy em hiện thẻ «Thầy vừa bật luật rời màn hình»', luatPhong()?.n === 3 && (await toT.locator('.mc-luat-cong').getAttribute('aria-checked')) === 'true' && /Thầy vừa bật luật rời màn hình.*rời app 3 lần sẽ bị mời ra khỏi lớp và Thầy báo phụ huynh/.test(await em1.locator('[data-luat-roi="bat"]').innerText().then((t) => t.replace(/\s+/g, ' '))) && await em2.locator('[data-luat-roi="bat"]').isVisible(), JSON.stringify(luatPhong()))
await chup(gv, 'lr-1-thay-bat-luat'); await chup(em1, 'lr-2-em-thong-bao')
await khay(false)
await roiVe(em1)
kiem('LR3 em rời rồi quay lại ⇒ phòng đếm 1; máy em nhắc «lần 1 … rời thêm 2 lần nữa»; máy thầy ghi «đang bị nhắc 1/3»', luatPhong()?.dem?.S1 === 1 && /Em vừa rời màn hình lần 1.*Rời thêm 2 lần nữa, em sẽ bị mời ra khỏi lớp và Thầy báo phụ huynh/.test(await em1.locator('[data-luat-roi="lan"]').innerText().then((t) => t.replace(/\s+/g, ' '))) && /1\/3/.test(await gv.locator('.lr-thay .lr-nhac').innerText()), `${JSON.stringify(luatPhong()?.dem)} · ${await em1.locator('[data-luat-roi]').count()}`)
await chup(em1, 'lr-3-em-lan-1')
await roiVe(em1); await roiVe(em1)
const phu = await em1.locator('[data-luat-roi="ra"]').innerText().then((t) => t.replace(/\s+/g, ' ')).catch(() => '')
kiem('LR4 rời đủ 3 lần ⇒ em BỊ MỜI RA: màn phủ có dòng «Đã gửi thông báo cho phụ huynh» + nút «Xin vào lại»; phòng thôi cho em xem live', !!luatPhong()?.ra?.S1 && /Em đã bị mời ra khỏi lớp/.test(phu) && /Đã gửi thông báo cho phụ huynh\./.test(phu) && await em1.getByRole('button', { name: 'Xin vào lại' }).isVisible() && (await em2.locator('[data-luat-roi="ra"]').count()) === 0, phu)
await chup(em1, 'lr-4-em-bi-moi-ra')
kiem('LR5 máy thầy: thẻ «Xin vào lại» có tên em, «chưa xin vào lại», nút Duyệt + Từ chối đều bấm được ngay; KHÔNG còn nút chép tin báo văn phòng (văn phòng tự đọc sổ)', /chưa xin vào lại/.test(await gv.locator('.lr-thay .lr-dong').innerText()) && await gv.locator('.lr-thay button.ok').isVisible() && await gv.locator('.lr-thay button.tu').isEnabled() && (await gv.locator('.lr-thay button.chep').count()) === 0 && !/Chép tin/.test(await gv.locator('.lr-thay').innerText()), await gv.locator('.lr-thay').innerText().then((t) => t.replace(/\s+/g, ' ')))
await em1.getByRole('button', { name: 'Xin vào lại' }).click(); await ngu(800)
kiem('LR6 em bấm «Xin vào lại» ⇒ máy em «Đang chờ Thầy duyệt», máy thầy «đang xin vào lại»', /Đang chờ Thầy duyệt/.test(await em1.locator('[data-luat-roi="ra"]').innerText()) && /đang xin vào lại/.test(await gv.locator('.lr-thay .lr-dong').innerText()))
await chup(gv, 'lr-5-thay-duyet')
await gv.locator('.lr-thay button.ok').click(); await ngu(1500)
kiem('LR7 thầy «Duyệt» ⇒ em vào lại lớp (màn phủ mất, lại xem được live), đếm lại từ đầu; sổ mời ra vẫn giữ để báo văn phòng', (await em1.locator('[data-luat-roi="ra"]').count()) === 0 && !luatPhong()?.ra?.S1 && !luatPhong()?.dem?.S1 && luatPhong()?.so?.length === 1 && await em1.locator('.lv').first().isVisible() && (await em1.getByRole('button', { name: 'Quay lại lượt đang làm' }).count()) === 0, `${JSON.stringify(luatPhong())} · lv ${await em1.locator('.lv').count()} · nút quay lại ${await em1.getByRole('button', { name: 'Quay lại lượt đang làm' }).count()}`)
// «Từ chối» = CẤM tới hết buổi (thầy 13/11): em ra hẳn màn Hôm nay, không xin lại được
await roiVe(em1); await roiVe(em1); await roiVe(em1)
const truocCam = { noi: await em1.locator('[data-live-khoi-em]').count(), bpu: await em1.locator('.bpu-hs').count(), phu: await em1.locator('[data-luat-roi="ra"]').count() }
await gv.locator('.lr-thay .lr-dong button.tu').click(); await ngu(1200)
const bao = await em1.locator('[data-luat-roi="cam"]').innerText().then((t) => t.replace(/\s+/g, ' ')).catch(() => '')
const sauCam = { noi: await em1.locator('[data-live-khoi-em]').count(), bpu: await em1.locator('.bpu-hs').count(), phu: await em1.locator('[data-luat-roi="ra"]').count() }
kiem('LR8 em bị mời ra lần hai, CHƯA xin, thầy «Từ chối» ⇒ phòng ghi cấm; máy em: màn phủ mất, lớp nổi live gỡ, màn Bình Phản Ứng ẩn (em về màn Hôm nay), có dòng báo «Thầy không duyệt cho em vào lại»', truocCam.phu === 1 && truocCam.noi === 1 && !!st()?.live?.camLive?.S1 && sauCam.noi === 0 && sauCam.bpu === 0 && sauCam.phu === 0 && /Thầy không duyệt cho em vào lại\. Em không vào được buổi live này nữa\. Đã gửi thông báo cho phụ huynh\./.test(bao), `${JSON.stringify(truocCam)} → ${JSON.stringify(sauCam)} · ${bao}`)
await chup(em1, 'lr-6-em-bi-tu-choi'); await chup(gv, 'lr-7-thay-da-tu-choi')
const dongCam = await gv.locator('.lr-thay .lr-dong.cam').innerText().then((t) => t.replace(/\s+/g, ' ')).catch(() => '')
kiem('LR9 máy thầy: dòng em «đã từ chối … không vào lại được tới hết buổi» + nút «Cho vào lại»', /đã từ chối lúc \d\d:\d\d · không vào lại được tới hết buổi/.test(dongCam) && /Cho vào lại/.test(dongCam), dongCam)
await ngu(6500)
kiem('LR10 sau 6 giây dòng báo tự cất; em vẫn ở ngoài (không lớp nổi, không màn phủ, không nút xin); bài mới của thầy không kéo em vào lại', (await em1.locator('[data-luat-roi="cam"]').count()) === 0 && (await em1.locator('[data-live-khoi-em]').count()) === 0 && (await em1.locator('.bpu-hs').count()) === 0 && (await em1.getByRole('button', { name: 'Xin vào lại' }).count()) === 0)
await chup(em1, 'lr-8-em-ve-hom-nay')
await khay(true); await toT.locator('.mc-luat-cong').click(); await ngu(800); await khay(false)
kiem('LR11 tắt công tắc ⇒ phòng gỡ luật; em bị từ chối VẪN bị cấm, thẻ máy thầy còn dòng em đó', luatPhong() === null && !!st()?.live?.camLive?.S1 && (await gv.locator('.lr-thay .lr-dong.cam').count()) === 1 && (await em1.locator('[data-live-khoi-em]').count()) === 0)
await gv.locator('.lr-thay .lr-dong.cam button').click(); await ngu(1800)
kiem('LR12 thầy đổi ý bấm «Cho vào lại» ⇒ em vào lại lớp (lớp nổi + màn làm bài hiện lại), thẻ luật trên máy thầy mất', !st()?.live?.camLive?.S1 && (await em1.locator('[data-live-khoi-em]').count()) === 1 && (await em1.locator('.bpu-hs').count()) === truocCam.bpu && await em1.locator('.lv').first().isVisible() && (await gv.locator('.lr-thay').count()) === 0, `nổi ${await em1.locator('[data-live-khoi-em]').count()} · bpu ${await em1.locator('.bpu-hs').count()}/${truocCam.bpu}`)
await toT.locator('body').press('Tab'); await ngu(1200)
await gv.evaluate(() => window.__dongToRiengThat()); await ngu(600)
kiem('3T8 đóng tờ riêng ⇒ về tấm hoạt động, phòng «hoc»', (await trenHd(gv)) === 'thd' && st()?.live?.khoi?.che === 'hoc', `${await trenHd(gv)} · ${st()?.live?.khoi?.che}`)
const loiHd = await gv.evaluate(() => window.__chieuCauGia()); await ngu(3500)
kiem('3k chiếu câu TỪ tấm hoạt động: tấm KHÔNG còn che màn chiếu; phòng sang «hoc»', loiHd === '' && ['bang-bpu', 'to'].includes(await trenHd(gv)) && st()?.live?.khoi?.che === 'hoc', `${await trenHd(gv)} · che ${st()?.live?.khoi?.che}`)
kiem('3l máy em vào nhận đề (không còn ở bảng danh sách / bảng trắng)', (await em1.locator('.lke .bd').count()) === 0 && await em1.locator('.bpu-hs').isVisible())
await chup(gv, '3-chieu-tu-hoat-dong')
await gv.keyboard.press('Escape'); await ngu(800)
kiem('3m Esc: quay lại tấm hoạt động để chọn câu kế', (await trenHd(gv)) === 'thd', await trenHd(gv))
kiem('3m2 tấm ở trên tờ bài ⇒ có nút nổi «Về màn chiếu»', await gv.locator('.lkt-ve-noi').isVisible())
await gv.locator('.lkt-ve-noi').click(); await ngu(500)
kiem('3m3 «Về màn chiếu»: tờ bài lên lại, máy em vẫn ở màn nhận đề', (await trenHd(gv)) === 'to' && await em1.locator('.lv-bang').isVisible(), await trenHd(gv))
await gv.keyboard.press('Escape'); await ngu(500)
await gv.locator('.thd-ve').click(); await ngu(800)
kiem('3n đóng tấm bằng nút của tấm: về bài đang dạy (không ra sảnh, không kẹt)', (await gv.locator('.thd').count()) === 0 && (await trenHd(gv)) === 'to', await trenHd(gv))

// ── 4. Chọn bài (chiếu bằng hàm thật) rồi «Học» ⇒ tờ giảng + bảng đua như buổi trên lớp; máy em vào câu ──
const loiChieu = await gv.evaluate(() => window.__chieuCauGia()); await ngu(3500)
kiem('4a chiếu được bài', loiChieu === '', loiChieu)
kiem('4b câu được CHIẾU ⇒ phòng tự sang «hoc» (lượt mới), live vẫn bật', st()?.live?.khoi?.che === 'hoc' && !!st()?.luot && st()?.live?.bat === true, JSON.stringify({ che: st()?.live?.khoi?.che, luot: st()?.luot?.so }))
kiem('4c «Học» KHÔNG còn màn đua (thầy 12/11 «bỏ hẳn bình phản ứng đi, tất cả làm việc trên màn chiếu»): bảng Bình Phản Ứng ẩn, câu hiện trên màn chiếu', (await bangBpu(gv)) === 'hidden' && (await trenCung(gv)) === 'to', `${await bangBpu(gv)} · ${await trenCung(gv)}`)
kiem('4d không còn cụm nổi của app; mọi nút nằm trong khay nút bốn ô của tờ', (await gv.locator('.lkt-vien').count()) === 0 && await gv.frameLocator('.lop-xem-phieu iframe').locator('#mc-them').isVisible())
// (thầy 12/11, bản vẽ 15–18 đã duyệt) máy em KHÔNG đổi sang màn câu hỏi: vẫn ở màn chiếu, tấm chọn đáp án hiện ngay trên bảng
// (thầy 12/11, bản vẽ 23–25 đã duyệt) dải chọn đáp án nằm NGAY TRÊN ĐỀ (đáy khung giấy), bảng đen không còn tấm chọn
const tamTra = (p) => p.evaluate(() => { const t = document.querySelector('.lv-giay .lv-tra'), b = document.querySelector('.lv-giay'); if (!t || !b) return null; const a = t.getBoundingClientRect(), c = b.getBoundingClientRect(), tren = document.elementFromPoint(a.left + a.width / 2, a.top + a.height / 2); return { rong: Math.round(a.width), khongTran: t.scrollWidth <= t.clientWidth + 1 && [...t.querySelectorAll('button, .lv-tra-dau')].every((x) => { const r = x.getBoundingClientRect(); return r.width === 0 || (r.left >= a.left - 1 && r.right <= a.right + 1 && x.scrollWidth <= x.clientWidth + 1) }), trongBang: a.left >= c.left - 1 && a.right <= c.right + 1 && a.bottom <= c.bottom + 1 && a.top >= c.top - 1, nut: t.querySelectorAll('.lv-tra-tn .lv-tra-nut').length, hang: t.querySelectorAll('.lv-tra-hang').length, motHang: new Set([...t.querySelectorAll('.lv-tra-hang')].map((x) => Math.round(x.getBoundingClientRect().top))).size <= 1, cao: Math.round(a.height), phim: t.querySelectorAll('.lv-tra-phim .lv-tra-nut').length, gui: !t.querySelector('.lv-tra-gui')?.disabled, chamDuoc: !!tren?.closest('.lv-tra'), bangSach: !document.querySelector('.lv-bang .lv-tra'), deKhongBiChe: (document.querySelector('.lv-kg-cuon')?.getBoundingClientRect().bottom ?? 1e9) <= a.top + 6, giay: Math.round(100 * c.width / document.querySelector('.lv').getBoundingClientRect().width) } })
// (thầy 12/11 tối, bản vẽ 28–30) dải chọn THU VỀ THANH XÁM ở mép dưới đề; chạm thanh ⇒ dải hiện
const moDai = async (p) => { const n = p.locator('.lv-tra-nam[aria-expanded="false"]'); if (await n.count()) { await n.click(); await ngu(350) } }
const daiThu = (p) => p.evaluate(() => { const t = document.querySelector('.lv-giay .lv-tra-thu'), n = t?.querySelector('.lv-tra-nam i'), g = document.querySelector('.lv-giay'), c = document.querySelector('.lv-kg-cuon'); if (!t || !n || !g || !c) return null; const a = n.getBoundingClientRect(), b = g.getBoundingClientRect(), d = c.getBoundingClientRect(); return { thanh: [Math.round(a.width), Math.round(a.height)], giua: Math.abs((a.left + a.right) / 2 - (b.left + b.right) / 2) < 6, satDay: b.bottom - a.bottom < 26, deCao: Math.round(100 * d.height / b.height), nhac: t.querySelector('.lv-tra-nhac')?.textContent ?? '', cham: t.querySelector('.lv-tra-nam').hasAttribute('data-do'), coDai: !!document.querySelector('.lv-tra') } })
const thu4 = await daiThu(em1)
kiem('4d2 câu mới: dải chọn THU về thanh xám nhỏ ở giữa mép dưới đề, vùng đọc đề ≥ 85 % khung giấy (điện thoại ngang 390 px: 87 %), chưa hiện dải', !!thu4 && !thu4.coDai && thu4.giua && thu4.satDay && thu4.thanh[0] >= 60 && thu4.thanh[1] <= 10 && thu4.deCao >= 85, JSON.stringify(thu4))
await chup(em1, '4-em-thanh-xam')
await moDai(em1)
const tt4 = await tamTra(em1)
kiem('4e máy em: bảng danh sách đóng, VẪN ở màn chiếu (giấy đề + bảng); dải chọn A B C D nằm NGAY TRÊN ĐỀ (đáy khung giấy, không che vùng đọc đề), bảng đen không còn tấm chọn, đề rộng ≥ 70 % màn; chưa chọn thì chưa gửi được', tt4?.bangSach && tt4?.deKhongBiChe && tt4?.giay >= 70 && (await em1.locator('.lke .bd').count()) === 0 && !!tt4 && tt4.trongBang && tt4.rong >= 240 && tt4.khongTran && tt4.nut === 4 && !tt4.gui && tt4.chamDuoc && await em1.evaluate(() => { const g = document.querySelector('.lv-giay')?.getBoundingClientRect(); return !!g && g.width > 100 }), JSON.stringify(tt4))
kiem('4f điện thoại cầm dọc: màn chiếu xoay ngang, cũng có tấm chọn', await em2.evaluate(() => !!document.querySelector('.lv[data-xoay]') && !!document.querySelector('.lv-giay .lv-tra-thu, .lv-giay .lv-tra') && !document.querySelector('.lv-bang .lv-tra')))
await chup(em1, '4-em-chon-trac-nghiem'); await chup(em2, '4-em-doc-chon-trac-nghiem')
await em1.locator('.lv-tra-tn .lv-tra-nut').nth(1).click(); await ngu(250)
kiem('4g em chọn B: nút gửi sáng «Gửi đáp án B»', await em1.locator('.lv-tra-gui').isEnabled() && /B/.test(await em1.locator('.lv-tra-gui').innerText()))
await em1.locator('.lv-tra-gui').click(); await ngu(900)
kiem('4h gửi xong: tấm chọn TỰ ẨN, phòng nhận đáp án của em; máy em vẫn ở màn chiếu', (await em1.locator('.lv-tra, .lv-tra-thu').count()) === 0 && !!st()?.luot?.tra?.S1 && await em1.locator('.lv-bang').isVisible(), JSON.stringify(st()?.luot?.tra?.S1 ?? null))
await chup(gv, '4-hoc-bang-dua'); await chup(em1, '4-em-cau-hoi'); await chup(em2, '4-em-doc-cau-hoi')
// (thầy 12/11 «cỡ chữ đề trên máy học sinh to hơn … chữ hiện tại nhỏ quá») buổi live: tờ mặc định «Chữ rất lớn» (1,2), máy em soi theo ⇒ chữ to theo;
// thầy đổi cỡ trong Cài đặt của tờ ⇒ máy em theo ngay; nhớ riêng cho live, không đụng cỡ chữ buổi trên lớp
const toHoc = gv.frameLocator('.lop-xem-phieu iframe')
const coTo = () => toHoc.locator('body').evaluate(() => ({ chon: document.getElementById('mc-size')?.value, bien: document.documentElement.style.getPropertyValue('--mc-scale'), de: parseFloat(getComputedStyle(document.querySelector('.mc-vung-de .mc-de')).fontSize), lop: localStorage.getItem('mc-projector-scale'), live: localStorage.getItem('mc-lk-scale') }))
const chuEm = (p) => p.evaluate(() => { const g = document.querySelector('.lv-gt'), c = g?.querySelector('.lv-gt-chu'); if (!g || !c) return null; const k = g.getBoundingClientRect().width / (g.offsetWidth || 1); return { khop: g.hasAttribute('data-khop'), px: Math.round(parseFloat(getComputedStyle(c).fontSize) * k * 10) / 10 } })
const co1 = await coTo(), chu1 = await chuEm(em1)
kiem('4i buổi live: tờ của thầy tự để «Chữ rất lớn» (1,2); cỡ chữ buổi trên lớp không bị ghi đè', co1.chon === '1.2' && co1.bien === '1.2' && co1.lop !== '1.2', JSON.stringify(co1))
kiem('4j máy em soi khớp giấy thầy, chữ đề to theo', !!chu1 && chu1.khop && chu1.px > 0, JSON.stringify(chu1))
await toHoc.locator('body').evaluate(() => { const s = document.getElementById('mc-size'); s.value = '1.4'; s.dispatchEvent(new Event('change', { bubbles: true })) }); await ngu(2600)
const co2 = await coTo(), chu2 = await chuEm(em1)
kiem('4k thầy chọn «Chữ cực lớn» trên tờ ⇒ máy em to theo ngay (≈ ×1,17), vẫn khớp; nhớ riêng cho live', co2.live === '1.4' && co2.lop === co1.lop && co2.de > co1.de * 1.1 && !!chu2 && chu2.khop && chu2.px > chu1.px * 1.1, JSON.stringify({ to: [co1.de, co2.de], em: [chu1, chu2], nho: [co2.lop, co2.live] }))
await chup(em1, '4-em-chu-cuc-lon')
await toHoc.locator('body').evaluate(() => { const s = document.getElementById('mc-size'); s.value = '1.2'; s.dispatchEvent(new Event('change', { bubbles: true })); localStorage.removeItem('mc-lk-scale') }); await ngu(2600)
console.log('   cỡ chữ đề (px): tờ thầy', co1.de, '· máy em 844×390', chu1?.px, '· «cực lớn»', chu2?.px)
// (thầy 12/11, bản vẽ 19–22 đã duyệt) NÚT ỐNG NGHIỆM «Ai đã nộp» cạnh nút bốn ô: đếm em đã gửi, tia xoắn ốc khi có em gửi, bấm ⇒ danh sách chỉ phủ phía bảng đen
const ong = toHoc.locator('#mc-nop')
const viTriOng = await toHoc.locator('body').evaluate(() => { const o = document.getElementById('mc-nop'), t = document.getElementById('mc-them'); if (!o || !t) return null; const a = o.getBoundingClientRect(), b = t.getBoundingClientRect(), s = t.querySelector('.mc-td-vien').getBoundingClientRect(); return { chu: o.querySelector('b').textContent, canh: a.right <= b.left + 1 && b.left - a.right < 24, cungHang: Math.abs((a.top + a.bottom) / 2 - (b.top + b.bottom) / 2) < 4, bonO: [Math.round(s.width), Math.round(b.width)] } })
kiem('4s nút ống nghiệm hiện NGAY CẠNH nút bốn ô, ghi «1/8» (S1 đã gửi); nút bốn ô nay là viên nhỏ gọn (≤ 2/3 vùng bấm, vùng bấm vẫn ≥ 40 px)', (await ong.isVisible()) && !!viTriOng && viTriOng.chu === '1/8' && viTriOng.canh && viTriOng.cungHang && viTriOng.bonO[0] <= viTriOng.bonO[1] * 0.67 && viTriOng.bonO[1] >= 40, JSON.stringify(viTriOng))
await chup(gv, '4-ong-nghiem-nut')
await moDai(em2); await em2.locator('.lv-tra-tn .lv-tra-nut').nth(0).click(); await ngu(200); await em2.locator('.lv-tra-gui').click(); await ngu(450)
const vua = await toHoc.locator('body').evaluate(() => { const o = document.getElementById('mc-nop'); return { lop: o.classList.contains('mc-nop-vua'), bao: o.querySelector('.mc-nop-bao')?.textContent ?? '', chu: o.querySelector('b').textContent, tia: !!o.querySelector('canvas.mc-nop-tia') } })
kiem('4t em khác vừa gửi ⇒ nút đếm «2/8», nháy sáng + tia xoắn ốc, dòng «… vừa gửi · giây»', vua.chu === '2/8' && vua.lop && vua.tia && /vừa gửi · \d+:\d\d/.test(vua.bao), JSON.stringify(vua))
await chup(gv, '4-ong-nghiem-em-vua-gui')
await ong.click(); await ngu(500)
const tamNop = await toHoc.locator('body').evaluate(() => { const t = document.getElementById('mc-nop-tam'), c = window.__mcDot().querySelector('.mc-cot-lam-bai'), g = window.__mcDot().querySelector('.mc-vung-de'); if (!t || t.hidden || !c || !g) return null; const a = t.getBoundingClientRect(), b = c.getBoundingClientRect(), d = g.getBoundingClientRect(), th = document.querySelector('.mc-thanh').getBoundingClientRect(); const em = [...t.querySelectorAll('.mc-nop-em')].map((x) => [x.dataset.sbd, x.querySelector('.mc-nop-chon')?.textContent ?? '', x.querySelector('.mc-nop-kq.d') ? 'dung' : x.querySelector('.mc-nop-kq.s') ? 'sai' : '', x.querySelector('.mc-nop-gio').textContent]); return { em, chua: t.querySelectorAll('.mc-nop-chua span').length, so: t.querySelector('.mc-nop-so').textContent, trongBang: a.left >= b.left - 2 && a.right <= b.right + 2, khongDeGiay: a.left >= d.right - 2, trenThanh: a.bottom <= th.top + 1, tran: t.scrollWidth > t.clientWidth + 1 } })
kiem('4u bấm ống nghiệm ⇒ tấm «Ai đã nộp» CHỈ phủ phía bảng đen (không đè giấy đề, không đè thanh đáy): S1 nhanh nhất · B · đúng, S2 · A · sai, 6 em chưa nộp', !!tamNop && tamNop.trongBang && tamNop.khongDeGiay && tamNop.trenThanh && !tamNop.tran && tamNop.so === '2/8' && tamNop.chua === 6 && tamNop.em.length === 2 && tamNop.em[0][0] === 'S1' && tamNop.em[0][1] === 'B' && tamNop.em[0][2] === 'dung' && tamNop.em[1][0] === 'S2' && tamNop.em[1][1] === 'A' && tamNop.em[1][2] === 'sai', JSON.stringify(tamNop))
await chup(gv, '4-ong-nghiem-danh-sach')
kiem('4v máy em KHÔNG nhận danh sách đúng / sai của bạn (tấm chỉ nằm trong tờ của thầy)', (await em1.evaluate(() => document.body.innerText.includes('Ai đã nộp'))) === false && (await em3.evaluate(() => document.body.innerText.includes('Ai đã nộp'))) === false)
await ong.click(); await ngu(300)
kiem('4w bấm ống nghiệm lần nữa ⇒ tấm đóng', await toHoc.locator('#mc-nop-tam').isHidden())
// (thầy 12/11 «lên bảng máy hs chưa hiện thông báo, bấm đạt không đạt cũng chưa hiện») ĐÚNG ĐƯỜNG THẬT: bấm nút «Lên bảng» và chấm NGAY TRÊN TỜ THẬT
// (a) tờ bài chọn từ kho — chưa có em xếp sẵn: nút «Lên bảng» phải bấm được ⇒ bảng (đang ẩn) chọn em ⇒ phòng nhận lệnh gọi ⇒ máy em hiện «… lên bảng»
await toHoc.locator('body').evaluate(() => { window.__fsTo = 0; Element.prototype.requestFullscreen = function () { window.__fsTo++; return Promise.resolve() } })
await toHoc.locator('body').press('f'); await ngu(300)
kiem('4l buổi live: phím F trên tờ KHÔNG bật toàn màn hình; cửa sổ app chặn toàn màn hình tại gốc', (await toHoc.locator('body').evaluate(() => window.__fsTo)) === 0 && await gv.evaluate(() => Object.prototype.hasOwnProperty.call(document.documentElement, 'requestFullscreen') && !document.fullscreenElement))
const nutLen = toHoc.locator('#mc-len-bang')
kiem('4m tờ chưa có em: nút «Lên bảng» hiện và bấm được', await nutLen.isVisible() && await nutLen.isEnabled() && (await nutLen.innerText()).trim() === 'Lên bảng', await nutLen.innerText().catch(() => '?'))
await nutLen.click(); await ngu(3200)
const goiA = st()?.luot?.goi
const baoEm = (p) => p.evaluate(() => !!document.querySelector('.lv-lb-tam, .lv-lb-the'))
kiem('4n bấm «Lên bảng» trên tờ ⇒ PHÒNG nhận lệnh gọi; mọi máy em hiện thông báo «… lên bảng», tấm chọn của em chưa gửi tự ẩn; tờ hiện thẻ tên em', !!goiA?.sbd && (await baoEm(em1)) && (await baoEm(em2)) && (await em2.locator('.lv-tra').count()) === 0 && await toHoc.locator('.mc-em[id] .mc-sbd').first().evaluate((e, s) => e.textContent.trim() === s, goiA?.sbd ?? ''), JSON.stringify(goiA ?? null))
await chup(em1, '4-em-len-bang-that'); await chup(gv, '4-gv-len-bang-that')
await ngu(2500)
// ── CV. CỔ VŨ BẰNG TINH THỂ LỬA (thầy 13/11: «tinh thể lửa theo màu đội … bay vào thẻ tên của bạn gọi lên bảng, màn thầy và màn học sinh thấy tổng hợp»;
//        «mỗi lần cổ vũ chỉ có 12 lần bấm»; «thẻ tên … dùng bản có sẵn»). Em KHÔNG lên bảng bấm nút sẵn có trên dải lượt.
{
  const mayEm = [['S1', em1], ['S3', em3], ['S2', em2]].filter(([s]) => s !== goiA?.sbd)
  const [sbdBam, pBam] = mayEm[0], pXem = mayEm[1][1]
  const mauBam = `var(${['--p-cam', '--p-tim-2', '--p-xanh', '--p-do'][st()?.ds?.find((e) => e.sbd === sbdBam)?.doi ?? 0]})`
  // tinh thể đang bay trên một máy: số lượng, màu, điểm ĐẾN (khung hình cuối) và tâm thẻ tên có sẵn — cùng hệ toạ độ của lớp phủ
  const doTT = (p) => p.evaluate(() => {
    const l = document.querySelector('[data-tinh-the]'); if (!l) return null
    const tt = [...l.children].filter((e) => e.tagName === 'DIV'), kf = tt[0]?.getAnimations?.()[0]?.effect?.getKeyframes?.() ?? []
    const m = /translate3d\(([-\d.]+)px, ?([-\d.]+)px/.exec(kf.at(-1)?.transform ?? '')
    let the = null
    const o = l.getBoundingClientRect(), e = document.querySelector('.lv-lb-the')
    if (e && !document.querySelector('.lv[data-xoay]')) { const r = e.getBoundingClientRect(); the = [r.left + r.width / 2 - o.left, r.top + r.height / 2 - o.top] }
    const ds = document.querySelectorAll('.lop-xem-phieu iframe'), kh = ds[ds.length - 1]
    const tr = kh ? [...kh.contentDocument.querySelectorAll('.mc-em')].find((x) => !x.hidden && x.getClientRects().length) : null
    if (kh && tr) { const k = kh.getBoundingClientRect(), r = tr.getBoundingClientRect(), z = k.width / kh.clientWidth; the = [k.left + (r.left + r.width / 2) * z, k.top + (r.top + r.height / 2) * z] }
    return { n: tt.length, mau: tt[0]?.style.color ?? '', den: m ? [Number(m[1]), Number(m[2])] : null, the, tong: l.children.length }
  })
  const trung = (d) => !!d?.den && !!d.the && Math.abs(d.den[0] - d.the[0]) < 3 && Math.abs(d.den[1] - d.the[1]) < 3
  const nut = pBam.locator('.lv-luot button.tiep')
  kiem('CV0 em không lên bảng có nút cổ vũ SẴN CÓ trên dải lượt, đếm 0/12; chưa ai bấm thì chưa có tinh thể nào', /· 0\/12$/.test((await nut.innerText()).trim()) && (await doTT(pBam))?.tong === 0 && (await doTT(gv))?.tong === 0, await nut.innerText().catch(() => '?'))
  for (let i = 0; i < 3; i++) { await nut.click(); await ngu(90) }
  await ngu(380)
  const [ttBam, ttXem, ttGv] = [await doTT(pBam), await doTT(pXem), await doTT(gv)]
  await chup(pBam, 'cv-1-em-tinh-the'); await chup(gv, 'cv-1-gv-tinh-the')
  kiem('CV1 em bấm 3 lần ⇒ tinh thể MÀU ĐỘI của em bay trên máy em, máy bạn khác và máy thầy; phòng đếm 3', st()?.luot?.goi?.tiep?.[sbdBam] === 3 && ttBam?.n >= 1 && ttXem?.n >= 1 && ttGv?.n >= 1 && ttBam.mau === mauBam && ttXem.mau === mauBam && ttGv.mau === mauBam, JSON.stringify({ phong: st()?.luot?.goi?.tiep, mauBam, ttBam, ttXem, ttGv }))
  kiem('CV2 điểm đến của tinh thể = tâm THẺ TÊN CÓ SẴN: thẻ trên khung bảng (máy em), thẻ tên trong tờ chiếu (máy thầy, tờ đang thu nhường cột tin nhắn)', (pBam === em2 || trung(ttBam)) && trung(ttGv), JSON.stringify({ em: ttBam, gv: ttGv }))
  for (let i = 0; i < 9; i++) { await nut.click({ force: true }).catch(() => {}); await ngu(70) }
  await ngu(500)
  const chu12 = (await nut.innerText()).trim()
  await nut.click({ force: true }).catch(() => {}); await ngu(300)
  kiem('CV3 mỗi em tối đa 12 lần một lượt gọi: nút hiện 12/12 và khoá, bấm thêm phòng không đếm', /· 12\/12$/.test(chu12) && await nut.isDisabled() && st()?.luot?.goi?.tiep?.[sbdBam] === 12, JSON.stringify({ chu12, phong: st()?.luot?.goi?.tiep }))
  await ngu(2600)
  const xong = [await doTT(pBam), await doTT(pXem), await doTT(gv)]
  kiem('CV4 bay xong tự gỡ sạch (không để lại phần tử nào trên ba máy); lớp tinh thể không chặn chạm', xong.every((d) => d?.tong === 0) && await gv.evaluate(() => getComputedStyle(document.querySelector('[data-tinh-the]')).pointerEvents === 'none'), JSON.stringify(xong.map((d) => d?.tong)))
}
await toHoc.locator('body').press('d'); await ngu(1200)
const dauA = await em2.evaluate(() => document.querySelector('.lv-dau-dat')?.firstChild?.textContent ?? null)
const dauThayA = await toHoc.locator('body').evaluate(() => { const d = document.getElementById('mc-lv-dau'); if (!d) return null; const a = d.getBoundingClientRect(); return { chu: d.firstChild.textContent, ten: d.querySelector('small')?.textContent ?? '', giua: Math.abs((a.left + a.right) / 2 - innerWidth / 2) < innerWidth * 0.08, deGiay: a.left < document.querySelector('.mc-vung-de').getBoundingClientRect().right } })
kiem('4o bấm Đạt (phím D) trên tờ ⇒ phòng ghi Đạt; máy em hiện con dấu «ĐẠT»; máy thầy vẫn ở màn chiếu', st()?.luot?.goi?.dat === true && dauA === 'ĐẠT' && (await trenCung(gv)) === 'to', JSON.stringify({ dat: st()?.luot?.goi?.dat, dau: dauA, tren: await trenCung(gv) }))
kiem('4o2 (thầy 12/11, bản vẽ 27) MÁY THẦY cũng hiện con dấu «ĐẠT» giữa màn chiếu, đè sang giấy đề, có tên em', !!dauThayA && dauThayA.chu === 'ĐẠT' && dauThayA.giua && dauThayA.deGiay && /lên bảng/.test(dauThayA.ten), JSON.stringify(dauThayA))
await chup(gv, '4-gv-con-dau-dat')
await chup(em2, '4-em-dau-dat-that')
// (b) tờ có em XẾP SẴN (như «Chữa câu khó»): sang câu 2 (lượt mới mở theo tờ), đặt thẻ tên em S2 như tờ xếp sẵn, bấm «Lên bảng» rồi Chưa đạt
await ngu(2400)
if (process.env.DO_CHUYEN) { // ĐO CHUYỂN ĐỀ (thầy 13/11 «tốc độ chuyển đề trên máy học sinh bị chậm quá»): thầy bấm → ⇒ mốc từng chặng trên máy em
  const doEm = (p) => p.evaluate(() => { const t = (document.querySelector('.lv-gt, .lv-de, .lv-giay')?.textContent ?? '') + (document.querySelector('.bpu-hs')?.textContent ?? ''); return { phenol: /Phenol/.test(t), khop: !!document.querySelector('.lv-gt[data-khop]'), soi: !!document.querySelector('.lv[data-soi]') } })
  const cpu = Number(process.env.DO_CHUYEN) || 1
  if (cpu > 1) for (const p of [em1, em2]) { const c = await p.context().newCDPSession(p); await c.send('Emulation.setCPUThrottlingRate', { rate: cpu }) }
  const t0 = Date.now(), moc = { phong: null, em1: null, em1Khop: null, em2: null, em2Khop: null }
  await toHoc.locator('body').press('ArrowRight')
  while (Date.now() - t0 < 8000) {
    if (moc.phong == null && st()?.luot?.qid === 'Q2') moc.phong = Date.now() - t0
    for (const [k, p] of [['em1', em1], ['em2', em2]]) { const d = await doEm(p); if (moc[k] == null && d.phenol) moc[k] = Date.now() - t0; if (moc[k + 'Khop'] == null && d.phenol && d.khop) moc[k + 'Khop'] = Date.now() - t0 }
    if (Object.values(moc).every((v) => v != null)) break
    await ngu(25)
  }
  console.log('CHUYEN cpu×' + cpu + (process.env.TRE_D1 ? ' · D1 chậm ' + process.env.TRE_D1 + ' ms' : '') + (process.env.KHONG_NAP ? ' · KHÔNG nạp sẵn' : ' · có nạp sẵn'), JSON.stringify(moc)); await chup(em1, 'chuyen-em1'); process.exit(3)
}
await toHoc.locator('body').press('ArrowRight'); await ngu(3500)
kiem('4p tờ sang câu 2 ⇒ phòng mở lượt mới của câu 2', st()?.luot?.qid === 'Q2' && !st()?.luot?.goi, JSON.stringify({ qid: st()?.luot?.qid, pha: st()?.luot?.pha }))
await toHoc.locator('body').evaluate(() => { const d = window.__mcDot(), n = d.querySelector('.mc-nua') || d; const h = document.createElement('header'); h.className = 'mc-em'; h.id = 'em-xep-san'; h.hidden = true; h.innerHTML = '<div class="mc-em-trai"><div class="mc-em-hang1"><div class="mc-ten-hang"><span class="mc-ten">Em xếp sẵn</span><span class="mc-dau-kq" hidden></span></div><div class="mc-phu"><span class="mc-sbd">S2</span></div></div></div>'; n.insertBefore(h, n.firstChild); window.__mcVaoLai() }); await ngu(500)
await nutLen.click(); await ngu(1500)
kiem('4q tờ có em xếp sẵn: bấm «Lên bảng» ⇒ phòng gọi ĐÚNG em trên thẻ (S2); máy em S2 và máy bạn đều hiện thông báo', st()?.luot?.goi?.sbd === 'S2' && (await baoEm(em2)) && (await baoEm(em1)), JSON.stringify(st()?.luot?.goi ?? null))
{ // (thầy 13/11 «thẻ tên cho nhỏ nhất có thể, bo, chữ hiện ở giữa, tối ưu không gian viết»)
  await ngu(2600) // chờ thẻ tên bay từ giữa màn về chỗ
  let tt = null
  for (const f of gv.frames()) { const d = await f.evaluate(() => { const t = [...document.querySelectorAll('.mc-em')].find((e) => !e.hidden && e.getClientRects().length && e.getBoundingClientRect().left >= 0); if (!t || !document.body.classList.contains('mc-lk')) return null; const r = t.getBoundingClientRect(), c = ((t.closest('.mc-dot') || document).querySelector('.mc-cot-lam-bai') || t.parentElement).getBoundingClientRect(), an = [...t.querySelectorAll('.mc-phu, .mc-xem-ct, .mc-thu, .mc-ls')].every((e) => getComputedStyle(e).display === 'none'), ten = t.querySelector('.mc-ten'); return { cao: Math.round(r.height), rong: Math.round(r.width), lechGiua: Math.round(Math.abs(r.left + r.width / 2 - (c.left + c.width / 2))), an, chu: parseFloat(getComputedStyle(ten).fontSize), bo: getComputedStyle(t).borderTopLeftRadius, ten: ten.textContent } }).catch(() => null); if (d) tt = d }
  // mỗi cột bảng đúng MỘT thẻ đang thấy (bộ thử vừa chèn thẻ «Em xếp sẵn» cạnh thẻ «Cả lớp» của đợt — tờ phải chỉ hiện thẻ đầu, không chồng hai thẻ)
  let soThe = []
  for (const f of gv.frames()) { const d = await f.evaluate(() => document.body.classList.contains('mc-lk') ? [...document.querySelectorAll('.mc-nua')].map((n) => [...n.children].filter((e) => e.classList.contains('mc-em') && !e.hidden && getComputedStyle(e).display !== 'none' && e.getClientRects().length && e.getBoundingClientRect().right > 0 && e.getBoundingClientRect().left < innerWidth).map((e) => e.querySelector('.mc-ten')?.textContent.trim())).filter((x) => x.length) : null).catch(() => null); if (d) soThe = soThe.concat(d) }
  kiem('TT1 thẻ tên em lên bảng trong buổi live: một viên nhỏ bo tròn chỉ còn TÊN, đứng giữa đầu cột bảng (cao ≤ 40 px ở màn 1366); «Chi tiết», số báo danh, nhãn dự kiến ẩn; mỗi cột đúng MỘT thẻ, là thẻ mang tên em được gọi', !!tt && tt.cao <= 40 && tt.an && tt.lechGiua <= 3 && tt.chu <= 24 && parseFloat(tt.bo) >= 16 && soThe.length >= 1 && soThe.every((c) => c.length === 1) && soThe.flat().includes('Em xếp sẵn'), JSON.stringify({ tt, soThe }))
  await chup(gv, 'tt-1-gv-the-ten-gon')
  if (process.env.DO_THE) { for (const f of gv.frames()) { const h = await f.evaluate(() => (document.body.classList.contains('mc-lk') ? JSON.stringify([...document.querySelectorAll('.mc-em')].map((e) => { const r = e.getBoundingClientRect(), k = getComputedStyle(e); return [e.id, e.hidden, k.display, k.position, k.opacity, Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height), e.parentElement.className, (e.closest('.mc-dot') || {}).className, e.textContent.trim().slice(0, 20)] })) : null)).catch(() => null); if (h) console.log('THE', h) } process.exit(3) } // chỉ soi thẻ tên rồi dừng
}
await ngu(4500)
await toHoc.locator('body').press('k'); await ngu(1200)
const dauB = await em1.evaluate(() => { const d = document.querySelector('.lv-dau-dat'); if (!d) return null; const a = d.getBoundingClientRect(), g = document.querySelector('.lv-giay').getBoundingClientRect(), m = document.querySelector('.lv').getBoundingClientRect(); return { chu: d.firstChild.textContent, giuaMan: Math.abs((a.left + a.right) / 2 - (m.left + m.right) / 2) < m.width * 0.08, deSangDe: a.left < g.right - 20, ten: d.querySelector('small')?.textContent ?? '' } })
const dauThayB = await toHoc.locator('#mc-lv-dau').evaluate((d) => d.firstChild.textContent).catch(() => null)
kiem('4r bấm Chưa đạt (phím K) trên tờ ⇒ phòng ghi; máy em đóng con dấu «KHÔNG ĐẠT» GIỮA CẢ MÀN, đè sang phần đề, có tên em; máy thầy cũng hiện con dấu và vẫn ở màn chiếu', st()?.luot?.goi?.dat === false && dauB?.chu === 'KHÔNG ĐẠT' && dauB.giuaMan && dauB.deSangDe && /lên bảng/.test(dauB.ten) && dauThayB === 'KHÔNG ĐẠT' && (await trenCung(gv)) === 'to', JSON.stringify({ dat: st()?.luot?.goi?.dat, dau: dauB, thay: dauThayB }))
await chup(em1, '4-em-con-dau-de-ca-man')
const daiSau = await em1.evaluate(() => document.querySelector('.lv-luot')?.innerText ?? '')
kiem('4r2 dải dưới máy em KHÔNG còn thẻ «Đạt / Chưa đạt» (thầy 12/11 «bỏ thẻ chưa đạt ở dưới đi») — chỉ còn kết quả của chính em', !/đạt/i.test(daiSau), daiSau)
await chup(em1, '4-em-dau-khong-dat-that')
await ngu(3200)

// ── 5. Esc ở «Học» ⇒ về sảnh; «Quay lại bài» ──
await gv.keyboard.press('Escape'); await ngu(500)
kiem('5a Esc: lùi về sảnh', (await trenCung(gv)) === 'sanh')
await gv.locator('.lkt-cho.sanh .lkt-ve').last().click(); await ngu(500)
kiem('5b «Về màn chiếu»: về màn chiếu đang dạy', (await trenCung(gv)) === 'to')
// đang có bài: Esc → sảnh → «Học» MỘT lần ⇒ bảng chọn bài (đổi bài); Esc → sảnh → «Về màn chiếu» ⇒ bài cũ còn nguyên, phòng vẫn «hoc»
await gv.keyboard.press('Escape'); await ngu(400)
await gv.locator('.lkt-che-to').nth(0).click(); await ngu(700)
kiem('5c đang có bài: ở sảnh bấm «Học» MỘT lần ⇒ bảng chọn bài hiện', (await trenCung(gv)) === 'chon-bai')
const veChon = gv.locator('.lkt-chon .lkt-ve.chinh')
kiem('5c2 bảng chọn «Hôm nay làm gì?» có nút «Về màn chiếu» (thầy 12/11 «cái bảng chọn kia không có nút về màn chiếu»)', await veChon.isVisible())
await chup(gv, '5-chon-co-ve-man-chieu')
await veChon.click(); await ngu(400)
kiem('5d «Về màn chiếu» từ bảng chọn: về ĐÚNG màn lúc rời đi, tức thì — bài cũ còn nguyên, phòng vẫn «hoc», lượt không đổi', (await trenCung(gv)) === 'to' && (await gv.locator('.lkt-chon').count()) === 0 && st()?.live?.khoi?.che === 'hoc' && !!st()?.luot)

// ── 6. Sang «Bảng» ⇒ bảng xanh than kín màn cả hai phía, viết được ở MỌI chỗ ──
await lk('bang'); await ngu(2200)
const to = gv.frameLocator('.lop-xem-phieu iframe')
const vung = await to.locator('body').evaluate(() => { const r = (q) => { const e = document.querySelector(q); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)] }; return { cot: r('.mc-cot-lam-bai'), de: r('.mc-vung-de'), W: innerWidth, cheBang: document.body.classList.contains('mc-che-bang'), but: document.body.classList.contains('mc-co-but'), nutLive: getComputedStyle(document.querySelector('.mc-lv-nut') ?? document.body).display } })
kiem('6a phòng «bang»; bảng Bình Phản Ứng ẩn, tờ lộ ra', st()?.live?.khoi?.che === 'bang' && (await bangBpu(gv)) === 'hidden' && (await trenCung(gv)) === 'to')
kiem('6b tờ: giấy đề ẩn, cột bảng phủ gần kín bề ngang, bút bật sẵn', vung.cheBang && vung.but && (!vung.de || vung.de[0] === 0) && !!vung.cot && vung.cot[0] > vung.W * 0.9, JSON.stringify(vung))
const aGv1 = await mucVungGv(gv, ...netA.gv), aEm1 = await mucVung(em1, ...netA.em)
kiem('6x BẢNG GIỮ NÉT: nét A viết trên bảng trắng (trước khi chọn bài) còn nguyên trên máy thầy và máy em', aGv1 > 60 && aEm1 > 30, JSON.stringify({ thay: [aGv0, aGv1], em: [aEm0, aEm1] }))
const khayLk = await to.locator('body').evaluate(() => { const t = document.getElementById('mc-them'), tr = t?.getBoundingClientRect(); t?.click(); const g = document.querySelector('.mc-khay-lk'), ds = [...(g?.querySelectorAll('[data-lk]') ?? [])].filter((x) => !x.hidden && x.getBoundingClientRect().width > 0).map((x) => `${x.textContent}${x.getAttribute('aria-pressed') === 'true' ? '*' : ''}`); const em = document.querySelector('.mc-em'); t?.click(); return { nut: !!tr && tr.width > 20, ds, theTen: em ? getComputedStyle(em).display : 'không có' } })
kiem('6y ở tờ KHÔNG còn cụm nổi của app; khay nút bốn ô có nhóm «Buổi live»: Học · Bảng (đang chọn) · Lớp · Nghỉ · Tin nhắn', (await gv.locator('.lkt-vien').count()) === 0 && khayLk.nut && khayLk.ds.join('|') === 'Học|Bảng*|Lớp|Nghỉ|Tin nhắn', JSON.stringify(khayLk))
kiem('6z2 chế độ Bảng: nút ống nghiệm ẨN (chỉ có ở Học)', await gv.frameLocator('.lop-xem-phieu iframe').locator('#mc-nop').isHidden())
kiem('6z chế độ Bảng: thẻ tên trên bảng ẩn', khayLk.theTen === 'none' || khayLk.theTen === 'không có', khayLk.theTen)
kiem('6c máy em: bảng live phủ kín', await em1.evaluate(() => { const b = document.querySelector('.lv-bang'), r = b?.getBoundingClientRect(); return !!r && r.width > innerWidth * 0.85 }))
await chup(em1, '6-em-bang-truoc-viet')
const muc0 = await mucEm(em1)
await veNetGv(gv, 220, 360); await ngu(400); await veNetGv(gv, 1000, 560); await ngu(1500)
const muc1 = await mucEm(em1), muc2 = await mucEm(em2)
kiem('6d viết ở nửa TRÁI và nửa PHẢI (gần đáy): máy em hiện ĐỦ hai nét, đúng nửa', muc1.t > 40 && muc1.ph > 40 && muc1.t !== muc0.t && muc1.ph !== muc0.ph, // trước khi viết màn có dòng chữ chờ «Bảng đen · Thầy viết gì…» nên so KHÁC, không so hơn
  JSON.stringify({ truoc: muc0, sau: muc1 }))
kiem('6e em cầm dọc cũng thấy đủ hai nét', muc2.t + muc2.ph > 80, JSON.stringify(muc2))
await chup(gv, '6-bang'); await chup(em1, '6-em-bang'); await chup(em2, '6-em-doc-bang')

// ── 7. Về «Học» ⇒ quay lại đúng bài đang dạy (không phải chọn lại) ──
await lk('hoc'); await ngu(1800)
kiem('7 về «Học»: phòng «hoc», vẫn ở màn chiếu (không màn đua), không mở chọn bài', st()?.live?.khoi?.che === 'hoc' && (await trenCung(gv)) === 'to' && (await bangBpu(gv)) === 'hidden' && (await gv.locator('.lkt-chon').count()) === 0)

// 7d. (thầy 12/11, ảnh màn Đúng–sai khổ ngang) câu ĐÚNG–SAI trên máy em: cột phải hiện ĐỦ chữ từng ý + nút Đúng | Sai bên cạnh (giống chặng), không rút gọn «…»
await may.moLuot({ qid: 'DS1', maDe: 'm', version: '1', group: 'g', phan: 'II', text: 'Peptide X có cấu trúc như sau: H₂N–CH(CH₃)–CO–NH–CH(CH₂CH₂COOH)–CO–NH–CH₂–COOH. Mỗi phát biểu sau đây là đúng hay sai?', choices: [], ideas: ['X là một tetrapeptide.', 'Trong phân tử peptide X có chứa 3 liên kết peptide.', 'Tên viết tắt của peptide X là Ala-Val-Gly.', 'Trong cấu tạo của X, amino acid đầu N là alanine và amino acid đầu C là glycine.'], hinhAnh: [], dang: null, tenDang: 'Peptide', mucDo: 'hieu', sao: 2, kienThuc: [] }, 'SSSĐ'); await ngu(2500)
const thu7 = await daiThu(em1)
kiem('7c2 câu mới: thanh xám + dòng nhắc «Chạm thanh xám để chọn đáp án»', !!thu7 && !thu7.coDai && thu7.nhac === 'Chạm thanh xám để chọn đáp án', JSON.stringify(thu7))
await chup(em1, '7-em-thanh-xam-nhac')
await ngu(5300)
const thu7b = await daiThu(em1)
kiem('7c3 sau 5 giây dòng nhắc TỰ ẨN, thanh xám vẫn còn', !!thu7b && thu7b.nhac === '' && !thu7b.coDai, JSON.stringify(thu7b))
await moDai(em1)
await em1.locator('.lv-tra-hang').nth(0).locator('.lv-tra-nut').nth(1).click(); await ngu(120)
await ngu(6500)
const thu7c = await daiThu(em1)
kiem('7c4 dải đang hiện mà 6 giây không chạm ⇒ TỰ THU về thanh xám; lựa chọn dở vẫn giữ (chấm nhắc cạnh thanh)', !!thu7c && !thu7c.coDai && thu7c.cham, JSON.stringify(thu7c))
await moDai(em1)
kiem('7c5 chạm thanh xám ⇒ dải hiện lại, ý a vẫn đang chọn «Sai»', (await em1.locator('.lv-tra-hang').nth(0).locator('.lv-tra-nut[data-v="S"]').getAttribute('aria-pressed')) === 'true')
const tt7 = await tamTra(em1)
kiem('7d Đúng–sai: dải bốn nhóm a–d (Đúng | Sai) ngay trên đề — điện thoại ngang gọn MỘT hàng, bảng đen trống', !!tt7 && tt7.bangSach && tt7.deKhongBiChe && tt7.motHang && tt7.trongBang && tt7.rong >= 240 && tt7.khongTran && tt7.hang === 4 && !tt7.gui, JSON.stringify(tt7))
for (let i = 0; i < 4; i++) { await em1.locator('.lv-tra-hang').nth(i).locator('.lv-tra-nut').nth(i === 3 ? 0 : 1).click(); await ngu(80) }
kiem('7e chọn đủ 4 ý ⇒ gửi được', await em1.locator('.lv-tra-gui').isEnabled())
await chup(em1, '7-em-dung-sai'); await chup(em2, '7-em-doc-dung-sai')
await em1.locator('.lv-tra-gui').click(); await ngu(900)
kiem('7f gửi Đúng–sai: phòng nhận «SSSD», tấm tự ẩn', st()?.luot?.tra?.S1?.chon === 'SSSD' && (await em1.locator('.lv-tra, .lv-tra-thu').count()) === 0, JSON.stringify(st()?.luot?.tra?.S1 ?? null))
// thầy bấm «Lên bảng» (gọi một em) ⇒ tấm chọn của em CHƯA gửi (em2) tự ẩn; thầy chấm ⇒ con dấu giữa bảng mọi máy em trong 3 giây
const WsNode = (await import('node:module')).createRequire(import.meta.url)('ws')
const gvWs = new WsNode(may.goc.replace('http', 'ws') + '/bpu/phong?ve=gv'); await new Promise((r) => gvWs.once('open', r))
kiem('7g em chưa gửi (điện thoại) đang có thanh xám / dải chọn', (await em2.locator('.lv-tra, .lv-tra-thu').count()) === 1)
gvWs.send(JSON.stringify({ t: 'goi', sbd: 'S1', lyDo: [] })); await ngu(1200)
kiem('7h thầy gọi lên bảng ⇒ tấm chọn của em chưa gửi TỰ ẨN', (await em2.locator('.lv-tra, .lv-tra-thu').count()) === 0 && !!st()?.luot?.goi, JSON.stringify(st()?.luot?.goi ?? null))
gvWs.send(JSON.stringify({ t: 'dat', v: true })); await ngu(700)
const dau = await em1.evaluate(() => { const d = document.querySelector('.lv-dau-dat'), b = document.querySelector('.lv'); if (!d || !b) return null; const a = d.getBoundingClientRect(), c = b.getBoundingClientRect(); return { chu: d.firstChild.textContent, giua: Math.abs((a.left + a.right) / 2 - (c.left + c.right) / 2) < c.width * 0.12 && Math.abs((a.top + a.bottom) / 2 - (c.top + c.bottom) / 2) < c.height * 0.15 } })
kiem('7i thầy bấm Đạt ⇒ con dấu «ĐẠT» giữa CẢ MÀN máy em (cả máy em khác)', !!dau && dau.chu === 'ĐẠT' && dau.giua && (await em2.locator('.lv-dau-dat').count()) === 1, JSON.stringify(dau))
await chup(em1, '7-em-dau-dat')
await ngu(3200)
kiem('7k sau 3 giây con dấu tự mất', (await em1.locator('.lv-dau-dat').count()) === 0)
gvWs.close()
const trangHoc = await gv.frameLocator('.lop-xem-phieu iframe').locator('body').evaluate(() => ({ trang: window.__mcBut.trang(), net: window.__mcBut.xuat().net.length }))
await lk('bang'); await ngu(1800)
const mucB2 = await mucEm(em1), aGv2 = await mucVungGv(gv, ...netA.gv), aEm2 = await mucVung(em1, ...netA.em)
kiem('7b Học → Bảng lần nữa: đủ nét cũ (nét A + hai nét sau) ở cả hai phía', aGv2 > 60 && aEm2 > 30 && mucB2.t >= muc1.t - 8 && mucB2.ph >= muc1.ph - 20 /* 13/11: lần đo trước có chấm laze đỏ của thầy (≈ 10–15 điểm sáng) nằm trong vùng phải */, JSON.stringify({ A: { thay: aGv2, em: aEm2 }, truoc: muc1, sau: mucB2, cot: await gv.evaluate(() => ({ co: document.documentElement.hasAttribute('data-lk-cot'), to: [...document.querySelectorAll('.lop-xem-phieu')].map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), getComputedStyle(e).visibility] }) })) }))
await chup(gv, '7b-gv-bang-lan-hai')
kiem('7c nét của Bảng KHÔNG lẫn sang bảng của bài ở «Học» (bảng của câu là trang riêng, đang sạch)', trangHoc.trang !== 'bl' && trangHoc.net === 0, JSON.stringify(trangHoc))
await lk('hoc'); await ngu(1500)

// ── 8. Chế độ Bảng: máy em KHOÁ ở bảng, nút nhắn tin + bốn đội nằm trong khay thanh vàng; cửa nhắn tin cao 1/3 sát mép phải ──
await lk('bang'); await ngu(1500)
kiem('8a chế độ Bảng: máy em không còn cụm nút nổi, không có dòng «Chạm hai lần…»', (await em1.locator('.lke-mep').count()) === 0 && (await em1.getByText('Chạm hai lần').count()) === 0)
await em1.mouse.dblclick(300, 200); await ngu(500)
kiem('8b chạm hai lần: em vẫn ở bảng kín màn (khoá cứng)', await em1.evaluate(() => { const b = document.querySelector('.lv-bang'), r = b?.getBoundingClientRect(); return !!r && r.width > innerWidth * 0.85 && !document.querySelector('.lv-giay')?.getBoundingClientRect().width }) || await em1.evaluate(() => { const g = document.querySelector('.lv-giay')?.getBoundingClientRect(); return !g || g.right <= 0 || g.left >= innerWidth }))
await em1.locator('.lv-nam').first().click(); await ngu(500)
kiem('8c khay thanh vàng có «Nhắn cả lớp» và «Bốn đội»', await em1.getByRole('button', { name: /Nhắn cả lớp/ }).isVisible() && await em1.getByRole('button', { name: /Bốn đội/ }).isVisible())
await chup(em1, '8-em-khay')
await em1.getByRole('button', { name: /Nhắn cả lớp/ }).click(); await ngu(900) // ngăn trượt vào 0,22 giây; máy thử đang bận thì chậm hơn
kiem('8d bấm «Nhắn cả lớp» trong khay ⇒ ngăn «Tin nhắn lớp» mở sát mép phải, cao kín màn (cùng một ngăn với lúc vuốt)', await em1.evaluate(() => { const c = document.querySelector('.lke .lc-ngan'), r = c?.getBoundingClientRect(); return !!r && Math.abs(r.right - innerWidth) <= 1 && Math.abs(r.height - innerHeight) <= 1 && r.width <= innerWidth * 0.45 }), await em1.evaluate(() => { const r = document.querySelector('.lke .lc-ngan')?.getBoundingClientRect(); return r ? `${Math.round(r.width)}×${Math.round(r.height)} @${Math.round(r.left)},${Math.round(r.top)}` : 'không có ngăn' }))
const o = em1.locator('.lke input').first(); await o.fill('Thầy ơi CH3COONa là muối gì ạ?'); await o.press('Enter'); await ngu(700)
const tinCot = await gv.evaluate(() => { const c = document.querySelector('.lkt-cot'), d = [...document.querySelectorAll('.lkt-cot .lc-g')].pop(); if (!c || !d) return null; const t = d.querySelector('.lc-g-ten > span'), n = d.querySelector('.lc-g-chu'), r = c.getBoundingClientRect(), to = document.querySelector('.lop-xem-phieu').getBoundingClientRect(); return { ten: t.textContent, mauDoi: d.style.getPropertyValue('--lc-doi'), mauTen: getComputedStyle(t.parentElement).color, dam: getComputedStyle(t.parentElement).fontWeight, coTen: parseFloat(getComputedStyle(t.parentElement).fontSize), coChu: parseFloat(getComputedStyle(n).fontSize), hoi: !!d.querySelector('.lc-g-ten > em'), sub: n.querySelectorAll('sub').length, tenO: t.getBoundingClientRect().bottom <= n.getBoundingClientRect().top + 1, cot: [Math.round(r.left), Math.round(r.width), Math.round(r.height)], to: [Math.round(to.left), Math.round(to.right), Math.round(to.bottom)], W: innerWidth, H: innerHeight } })
kiem('8e CỘT TIN NHẮN CỐ ĐỊNH máy thầy: tin em hiện NGAY, dòng trên họ tên đầy đủ in đậm màu theo đội + nhãn «Câu hỏi», dòng dưới nội dung chữ nhỏ hơn (công thức có chỉ số dưới); cột sát mép phải, phần chiếu nằm trọn bên trái cột', !!tinCot && /\S+ \S+/.test(tinCot.ten) && /^var\(--p-/.test(tinCot.mauDoi) && Number(tinCot.dam) >= 700 && tinCot.coTen > tinCot.coChu && tinCot.hoi && tinCot.sub >= 1 && tinCot.tenO && tinCot.cot[0] + tinCot.cot[1] === tinCot.W && tinCot.cot[2] === tinCot.H && Math.abs(tinCot.to[1] - tinCot.cot[0]) <= 1, JSON.stringify(tinCot))
await chup(gv, '8-gv-cot-tin-nhan')
await chup(em1, '8-em-chat'); await em1.keyboard.press('Escape')
// 8f. thầy nhắn ⇒ bong bóng trên máy em gọn ở góc trên-phải (trong phần bảng), chữ nằm ngang
await em1.getByRole('button', { name: 'Đóng tin nhắn' }).click().catch(() => {}); await ngu(300)
// cột cố định luôn hiện: thầy gõ thẳng vào ô «Nhắn cả lớp…» của cột
const oGv = gv.locator('.lkt-cot input').first(); await oGv.fill('Thầy chào cả lớp nhé'); await oGv.press('Enter'); await ngu(700)
const bong = await em1.evaluate(() => { const b = document.querySelector('.lke-bong .lc-bong-noi'), r = b?.getBoundingClientRect(); return r ? { w: Math.round(r.width), h: Math.round(r.height), l: Math.round(r.left), t: Math.round(r.top), W: innerWidth, H: innerHeight } : null })
kiem('8f thầy nhắn: bong bóng máy em nằm ngang, gọn ở góc trên-phải', !!bong && bong.w > 90 && bong.h < 90 && bong.l > bong.W * 0.55 && bong.t < bong.H * 0.3, JSON.stringify(bong))
await chup(em1, '8-em-bong-tin')
// mở khay nút bốn ô ⇒ cột cố định KHÔNG thu (khay nằm trong phần chiếu, không bị cột đè)
await gv.frameLocator('.lop-xem-phieu iframe').locator('#mc-them').click(); await ngu(500)
kiem('8f2 mở khay nút bốn ô ⇒ cột tin nhắn cố định vẫn hiện, khay bấm được, có đủ hai tin (em + thầy)', (await gv.locator('.lkt-cot').count()) === 1 && (await gv.locator('.lkt-chat').count()) === 0 && (await gv.locator('.lkt-cot .lc-g').count()) >= 2 && (await gv.locator('.lkt-cot .lc-g[data-thay]').count()) >= 1 && await gv.frameLocator('.lop-xem-phieu iframe').locator('.mc-khay-lk [data-lk="lop"]').isVisible())
await chup(gv, '8-gv-khay')
await gv.frameLocator('.lop-xem-phieu iframe').locator('#mc-them').click(); await ngu(300)

// ── CK. KHUNG CHAT CỐ ĐỊNH (thầy duyệt bản vẽ 55–59 ngày 13/11): phần chiếu thu ĐỀU, tỉ lệ bảng gửi máy em KHÔNG đổi; phím M cất / hiện ──
const doCk = () => gv.evaluate(() => { const g = document.documentElement, to = document.querySelector('.lop-xem-phieu'), r = to.getBoundingClientRect(), f = to.querySelector('iframe'), d = document.querySelector('.lkt-dai')?.getBoundingClientRect(); return { co: g.hasAttribute('data-lk-cot'), to: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], khung: [f.clientWidth, f.clientHeight], dai: d ? [Math.round(d.left), Math.round(d.top), Math.round(d.width), Math.round(d.height)] : null, W: innerWidth, H: innerHeight } })
const tiLeTo = () => gv.frameLocator('.lop-xem-phieu iframe').locator('body').evaluate(() => window.__mcBut.xuat().tiLe)
const ck1 = await doCk(), tl1 = await tiLeTo(), emBang1 = await em1.locator('.lv-bang').first().boundingBox()
kiem('CK1 có cột: phần chiếu thu đều (cùng tỉ lệ cửa sổ), sát góc trên-trái, khung tờ bên trong vẫn nguyên cỡ cửa sổ; dải «Chỉ thầy thấy» lấp đúng phần dư bên dưới', ck1.co && ck1.to[0] === 0 && ck1.to[1] === 0 && Math.abs(ck1.to[2] / ck1.to[3] - ck1.W / ck1.H) < 0.01 && ck1.khung[0] === ck1.W && !!ck1.dai && Math.abs(ck1.dai[1] - ck1.to[3]) <= 1 && Math.abs(ck1.dai[2] - ck1.to[2]) <= 1 && ck1.dai[1] + ck1.dai[3] === ck1.H, JSON.stringify(ck1))
await gv.locator('.lkt-dai').click({ position: { x: 5, y: 40 } }); await gv.keyboard.press('m'); await ngu(700)
const ck2 = await doCk(), tl2 = await tiLeTo(), emBang2 = await em1.locator('.lv-bang').first().boundingBox()
kiem('CK2 phím M cất cột ⇒ phần chiếu về kín cửa sổ; TỈ LỆ BẢNG tờ gửi máy em và khung bảng trên máy em KHÔNG đổi (bố cục phần chiếu cho học sinh không bị ảnh hưởng)', !ck2.co && ck2.to[2] === ck2.W && ck2.to[3] === ck2.H && (await gv.locator('.lkt-cot').count()) === 0 && Math.abs(tl1 - tl2) < 1e-6 && !!emBang1 && !!emBang2 && Math.abs(emBang1.width - emBang2.width) <= 1 && Math.abs(emBang1.height - emBang2.height) <= 1, JSON.stringify({ tiLe: [tl1, tl2], em: [emBang1, emBang2], to: ck2.to }))
await gv.keyboard.press('m'); await ngu(700)
kiem('CK3 phím M lần nữa ⇒ cột hiện lại với đủ tin cũ, phần chiếu thu lại như trước', (await doCk()).co && (await gv.locator('.lkt-cot .lc-g').count()) >= 2 && JSON.stringify((await doCk()).to) === JSON.stringify(ck1.to))
{ // (thầy 13/11 «ẩn tất cả thanh cuộn trên app gv và hs nhưng vẫn cuộn được»)
  const quet = () => { const ds = [...document.querySelectorAll('*')].filter((e) => { const k = getComputedStyle(e); return /(auto|scroll)/.test(k.overflowY + ' ' + k.overflowX) }); const xau = ds.filter((e) => getComputedStyle(e).scrollbarWidth !== 'none' || e.offsetWidth - e.clientWidth > 2 * parseFloat(getComputedStyle(e).borderLeftWidth || '0') + 1); return { n: ds.length, xau: xau.slice(0, 4).map((e) => e.className || e.tagName) } }
  const sc = { gv: await gv.evaluate(quet), em1: await em1.evaluate(quet), em2: await em2.evaluate(quet), to: [] }
  for (const f of gv.frames()) if (f !== gv.mainFrame()) { const d = await f.evaluate(quet).catch(() => null); if (d) sc.to.push(d) }
  kiem('SC1 suốt buổi live không còn thanh cuộn nào hiện: máy thầy (app + mọi tờ chiếu), máy em ngang, máy em cầm dọc — các khung cuộn vẫn là khung cuộn', [sc.gv, sc.em1, sc.em2, ...sc.to].every((d) => d.xau.length === 0) && sc.to.some((d) => d.n > 0), JSON.stringify(sc))
}
{ // (thầy 13/11 «cho tôi điều chỉnh kích thước được của thẻ đen chỉ thầy thấy ở dưới»)
  const doDai = () => gv.evaluate(() => { const g = document.documentElement.style; return { h: parseFloat(g.getPropertyValue('--lkc-h')), w: parseFloat(g.getPropertyValue('--lkc-w')), s: parseFloat(g.getPropertyValue('--lkc-s')), nho: localStorage.getItem('ddh.lk.cotRong'), dai: Math.round(document.querySelector('.lkt-dai').getBoundingClientRect().height) } })
  const d0 = await doDai(), tk = await gv.locator('.lkt-keo.ngang').boundingBox()
  await gv.mouse.move(tk.x + tk.width / 2, tk.y + 5); await gv.mouse.down(); await gv.mouse.move(tk.x + tk.width / 2, tk.y + 45, { steps: 6 }); await gv.mouse.up(); await ngu(350)
  const d1 = await doDai()
  await chup(gv, 'ck-4-gv-dai-thap')
  kiem('CK4 kéo mép trên dải «Chỉ thầy thấy» xuống 40 px ⇒ dải thấp đi ≈ 40 px, cột tin nhắn hẹp lại, phần chiếu to ra (vẫn thu đều); máy nhớ cỡ mới', Math.abs(d0.h - d1.h - 40) <= 4 && d1.dai === d1.h && d1.w < d0.w && d1.s > d0.s && Number(d1.nho) === d1.w, JSON.stringify({ d0, d1 }))
  const tc = await gv.locator('.lkt-keo.doc').boundingBox()
  await gv.mouse.move(tc.x + 5, 300); await gv.mouse.down(); await gv.mouse.move(tc.x + 5 - 60, 300, { steps: 6 }); await gv.mouse.up(); await ngu(350)
  const d15 = await doDai()
  await gv.locator('.lkt-keo.ngang').dblclick(); await ngu(350)
  const d2 = await doDai()
  kiem('CK5 kéo mép trái cột sang trái 60 px ⇒ cột rộng thêm ≈ 60 px, dải cao lên theo; bấm hai lần tay kéo ⇒ về cỡ mặc định, máy quên cỡ đã nhớ', Math.abs(d15.w - d1.w - 60) <= 4 && d15.h > d1.h && d2.h === d0.h && d2.w === d0.w && d2.nho === null, JSON.stringify({ d15, d2 }))
}

// ── NG. NÚT «NGHỈ» (thầy duyệt bản vẽ 67–70 ngày 13/11): cả lớp về màn chờ chơi trò; «Học tiếp» ⇒ vào lại ĐÚNG chỗ đang dạy ──
const truocNghi = { che: st()?.live?.khoi?.che, net: await gv.frameLocator('.lop-xem-phieu iframe').locator('body').evaluate(() => window.__mcBut.xuat().net.length), emBang: await em1.locator('.lv-bang').first().isVisible() }
await lk('nghi'); await ngu(1500)
const ng1 = await gv.evaluate(() => { const c = document.querySelector('.lkt-cho[data-nghi]'); return c ? { chu: c.querySelector('header').innerText.replace(/\s+/g, ' '), nut: c.querySelector('.lkt-bat-dau')?.textContent, chan: c.querySelector('footer p')?.textContent, cot: !!document.querySelector('.lkt-cot') } : null })
kiem('NG1 thầy bấm «Nghỉ» trong khay ⇒ phòng ghi giờ nghỉ + live tạm dừng, chế độ giữ nguyên; máy thầy sang màn nghỉ: «Đang nghỉ · Khối», «Nghỉ được m:ss», nút «Học tiếp», lời nhắc vào lại đúng chế độ', st()?.live?.khoi?.giaiLao > 0 && st()?.live?.nghi === true && st()?.live?.khoi?.che === truocNghi.che && !!ng1 && /Đang nghỉ · Khối \d+/.test(ng1.chu) && /Nghỉ được \d\d:\d\d/.test(ng1.chu) && ng1.nut === 'Học tiếp' && /vào lại đúng chỗ đang dạy: chế độ (Bảng|Học)/.test(ng1.chan) && !ng1.cot, JSON.stringify(ng1))
await chup(gv, 'ng-1-thay-man-nghi')
const ng2 = await em1.evaluate(() => { const l = document.querySelector('.lke'), b = document.querySelector('.lke-nghi'); return { cho: !!l?.classList.contains('cho'), bang: b ? b.innerText.replace(/\s+/g, ' ') : '', tro: !!document.querySelector('.lke canvas, .lke .st'), roi: !!document.querySelector('.lke-roi'), ngan: !!document.querySelector('.lc-ngan') } })
kiem('NG2 máy em về màn chơi trò, có băng «Nghỉ giải lao · Thầy gọi Học tiếp là em vào lại bài · m:ss»; không có nút «Rời phòng chờ»', ng2.cho && /Nghỉ giải lao Thầy gọi Học tiếp là em vào lại bài \d\d:\d\d/.test(ng2.bang) && !ng2.roi && (await em2.locator('.lke-nghi').count()) === 1, JSON.stringify(ng2))
await chup(em1, 'ng-2-em-nghi')
{ const kj0 = st()?.ds?.find((e) => e.sbd === 'S1')?.kj, roi0 = st()?.ds?.find((e) => e.sbd === 'S1')?.roi
  await roiVe(em1)
  kiem('NG3 đang nghỉ: em rời app rồi quay lại KHÔNG bị trừ kJ, không bị ghi rời màn', st()?.ds?.find((e) => e.sbd === 'S1')?.kj === kj0 && st()?.ds?.find((e) => e.sbd === 'S1')?.roi === roi0 && (await gv.locator('.bpu-roi-gon').count()) === 0, `${kj0} → ${st()?.ds?.find((e) => e.sbd === 'S1')?.kj}`) }
await gv.locator('.lkt-cho[data-nghi] .lkt-bat-dau').click(); await ngu(600)
const ng4 = await em1.evaluate(() => { const v = document.querySelector('.lke-vao-lai'); return v ? v.innerText.replace(/\s+/g, ' ') : '' })
kiem('NG4 thầy bấm «Học tiếp» ⇒ phòng gỡ cờ nghỉ, live chạy lại; máy em hiện «Thầy gọi học tiếp» đếm 3 giây (vẫn trên sân trò)', !st()?.live?.khoi?.giaiLao && st()?.live?.nghi === false && /hết giờ nghỉ thầy gọi học tiếp em vào lại đúng chỗ thầy đang dạy\. [123]/i.test(ng4), ng4)
await chup(em1, 'ng-3-em-thay-goi-hoc-tiep')
await ngu(3600)
const sauNghi = { che: st()?.live?.khoi?.che, net: await gv.frameLocator('.lop-xem-phieu iframe').locator('body').evaluate(() => window.__mcBut.xuat().net.length), emBang: await em1.locator('.lv-bang').first().isVisible(), emCho: await em1.evaluate(() => !!document.querySelector('.lke.cho, .lke-vao-lai, .lke-nghi')), gvTo: await trenCung(gv), cot: await gv.locator('.lkt-cot').count() }
kiem('NG5 sau 3 giây cả lớp vào lại ĐÚNG chỗ: cùng chế độ, bảng của thầy còn nguyên số nét, máy em thấy lại bảng, máy thầy về tờ chiếu + cột tin nhắn', sauNghi.che === truocNghi.che && sauNghi.net === truocNghi.net && sauNghi.emBang === truocNghi.emBang && !sauNghi.emCho && sauNghi.gvTo === 'to' && sauNghi.cot === 1, JSON.stringify({ truoc: truocNghi, sau: sauNghi }))

// ── VC. NGĂN «TIN NHẮN LỚP» MÁY EM (thầy duyệt bản vẽ 60–66 ngày 13/11; 13/11 lần 2 BỎ vuốt): bấm thanh vàng rồi chọn; máy tính ghim cột ──
const doNgan = (p) => p.evaluate(() => { const n = document.querySelector('.lc-ngan'); if (!n) return null; const r = n.getBoundingClientRect(); return { lo: Math.round(innerWidth - r.left), trai: Math.round(r.left), rong: Math.round(r.width), cao: Math.round(r.height), keo: n.hasAttribute('data-keo'), ghim: n.classList.contains('lc-ghim'), khay: !!document.querySelector('.lv-khay[data-mo]'), dong: n.querySelectorAll('.lc-g').length, toi: n.querySelectorAll('.lc-g[data-toi] .lc-g-ten > em.toi').length, nhanh: [...n.querySelectorAll('.lc-nhanh button')].map((b) => b.textContent), W: innerWidth, H: innerHeight } })
// Thầy 13/11 lần 2: «vuốt để ra bảng tin nhắn rất khó, bạn bỏ vuốt đi để hs bấm vào thanh vàng rồi chọn … khung chat của hs giữ nguyên như hiện tại»
{ const hop = await em1.locator('.lv-nam').first().boundingBox(), x0 = hop.x + hop.width - 6, y0 = hop.y + hop.height / 2
  await em1.mouse.move(x0, y0); await em1.mouse.down(); for (let i = 1; i <= 20; i++) await em1.mouse.move(x0 - i * 10, y0); await em1.mouse.up(); await ngu(600)
  kiem('VC1 KÉO thanh vàng sang trái KHÔNG còn mở ngăn chat (đã bỏ vuốt): chỉ mở khay điều khiển như cũ; không còn dải vuốt mép phải', (await em1.locator('.lc-ngan').count()) === 0 && (await em1.locator('.lv-vuot').count()) === 0 && await em1.locator('.lv-khay[data-mo]').first().isVisible()) }
await em1.getByRole('button', { name: /Nhắn cả lớp/ }).click(); await ngu(700)
const vc2 = await doNgan(em1)
kiem('VC2 bấm thanh vàng ⇒ chọn «Nhắn cả lớp» ⇒ ngăn mở sát mép phải (rộng 44 % màn, tối đa 380 px, cao kín màn); dòng tin hai dòng như cột của thầy, tin của chính em có nhãn «Em»; ba câu nhắn nhanh bằng chữ', !!vc2 && vc2.trai + vc2.rong === vc2.W && vc2.rong === Math.min(380, Math.round(vc2.W * 0.44)) && vc2.cao === vc2.H && vc2.dong >= 2 && vc2.toi >= 1 && JSON.stringify(vc2.nhanh) === JSON.stringify(['Em hiểu rồi ạ', 'Thầy giảng lại ạ', 'Em chưa rõ ạ']), JSON.stringify(vc2))
await chup(em1, 'vc-2-em-ngan-mo')
await em1.locator('.lc-ngan .lc-nhanh button').nth(2).click(); await ngu(900)
kiem('VC3 bấm «Em chưa rõ ạ» ⇒ tin hiện trong ngăn của em và trong cột của thầy (họ tên đầy đủ, màu đội)', (await em1.locator('.lc-ngan .lc-g').last().innerText()).includes('Em chưa rõ ạ') && (await gv.locator('.lkt-cot .lc-g').last().innerText()).includes('Em chưa rõ ạ'), await gv.locator('.lkt-cot .lc-g').last().innerText().then((t) => t.replace(/\s+/g, ' ')))
await em1.mouse.click(120, 200); await ngu(500)
kiem('VC4 chạm vào bảng (ngoài ngăn) ⇒ ngăn đóng', (await em1.locator('.lc-ngan').count()) === 0)
await em1.locator('.lv-nam').first().click(); await ngu(500)
kiem('VC5 chạm thanh vàng mở khay điều khiển, không tự mở ngăn chat', await em1.locator('.lv-khay[data-mo]').first().isVisible() && (await em1.locator('.lc-ngan').count()) === 0)
await em1.locator('.lv-nam').first().click(); await ngu(400)
{ await em2.locator('.lv-nam').first().click(); await ngu(500)
  await em2.getByRole('button', { name: /Nhắn cả lớp/ }).click(); await ngu(700)
  kiem('VC6 điện thoại cầm dọc (hình xoay): bấm thanh vàng ⇒ «Nhắn cả lớp» ⇒ ngăn mở; không có dải vuốt', (await em2.locator('.lc-ngan').count()) === 1 && (await em2.locator('.lv-vuot').count()) === 0)
  await chup(em2, 'vc-3-em-doc-ngan-mo')
  await em2.getByRole('button', { name: 'Đóng tin nhắn' }).click().catch(() => {}); await ngu(400) }
// MÁY TÍNH: phóng cửa sổ em3 (chuột) lên 1366 × 768 ⇒ cột ghim sẵn bên phải, màn live co sang trái
await em3.setViewportSize({ width: 1366, height: 768 }); await ngu(1200)
const doCotEm = () => em3.evaluate(() => { const n = document.querySelector('.lc-ngan'), r = n?.getBoundingClientRect(), hs = document.querySelector('.bpu-hs')?.getBoundingClientRect(); return { ghim: !!n?.classList.contains('lc-ghim'), cot: r ? [Math.round(r.left), Math.round(r.width), Math.round(r.height)] : null, hs: hs ? Math.round(hs.right) : null, bang: Math.round(Math.max(0, ...[...document.querySelectorAll('.lv-bang, .lv-giay, .lv-ke')].map((e) => e.getBoundingClientRect().right))), co: document.documentElement.hasAttribute('data-lke-cot'), go: document.activeElement === n?.querySelector('input'), nho: localStorage.getItem('ddh.lk.chatGhim') } })
const vc7 = await doCotEm()
kiem('VC7 máy tính: cột «Tin nhắn lớp» GHIM SẴN bên phải (300 px, cao kín màn), màn live co sang trái sát cột, BẢNG nằm trọn bên trái cột (không bị che)', vc7.ghim && vc7.co && JSON.stringify(vc7.cot) === JSON.stringify([1066, 300, 768]) && vc7.hs === 1066 && vc7.bang > 600 && vc7.bang <= 1066, JSON.stringify(vc7))
await chup(em3, 'vc-4-em-may-tinh-cot-ghim')
await em3.mouse.click(300, 300); await em3.keyboard.press('Enter'); await ngu(300)
const vc8a = await doCotEm()
await em3.keyboard.type('Em chào thầy ạ'); await em3.keyboard.press('Enter'); await ngu(900); await em3.keyboard.press('Escape'); await ngu(300)
const vc8b = await doCotEm()
kiem('VC8 máy tính: Enter ⇒ con trỏ vào ô nhập, gõ + Enter gửi (tin của em có nhãn «Em»); Esc rời ô nhập, cột vẫn ghim', vc8a.go && (await em3.locator('.lc-ngan .lc-g[data-toi]').last().innerText()).includes('Em chào thầy ạ') && !vc8b.go && vc8b.ghim, JSON.stringify({ truoc: vc8a.go, sau: vc8b.go }))
await em3.getByRole('button', { name: 'Cất cột tin nhắn' }).click(); await ngu(600)
const vc9 = await doCotEm()
await em3.mouse.click(300, 300); await em3.keyboard.press('Enter'); await ngu(600)
const vc9b = await doCotEm()
kiem('VC9 máy tính: «Cất cột» ⇒ cột mất, màn live về kín cửa sổ, máy nhớ lựa chọn; Enter ⇒ ngăn trượt mở lại (không ghim), gõ được ngay', vc9.cot === null && !vc9.co && vc9.hs === 1366 && vc9.bang > 1066 && vc9.nho === '0' && !!vc9b.cot && !vc9b.ghim && vc9b.go, JSON.stringify({ cat: vc9, enter: vc9b }))
await em3.keyboard.press('Escape'); await ngu(300)
await em3.evaluate(() => localStorage.removeItem('ddh.lk.chatGhim')); await em3.setViewportSize({ width: 500, height: 800 }); await ngu(900)
kiem('VC10 thu cửa sổ về cỡ nhỏ ⇒ không còn cột ghim, màn live kín cửa sổ', (await em3.locator('.lc-ngan').count()) === 0 && (await em3.evaluate(() => !document.documentElement.hasAttribute('data-lke-cot'))))

// ── 8M. MIC CỦA EM (thầy 12/11 «cài mic của hs vào»): em giơ tay trong khay thanh vàng ⇒ máy thầy hiện hàng giơ tay ⇒ «Mời nói» ⇒ máy em có tấm mời ──
await em1.locator('.lv-nam').first().click(); await ngu(500)
kiem('8g khay máy em có «Giơ tay» và «Mic của em» (đang tắt)', await em1.locator('.lv-khay .lv-tay').first().isVisible() && await em1.locator('.lv-khay .lv-vua.mic').first().isVisible())
await chup(em1, '8-em-khay-mic')
await em1.locator('.lv-khay .lv-tay').first().click(); await ngu(900)
kiem('8h em giơ tay: phòng ghi hàng tay, máy thầy hiện thẻ «1 em giơ tay» NẰM TRONG DẢI dưới phần chiếu (không đè lên bảng)', st()?.live?.tay?.length === 1 && await gv.locator('.lkt-tay li').first().isVisible() && await gv.evaluate(() => { const t = document.querySelector('.lkt-dai .lkt-tay')?.getBoundingClientRect(), to = document.querySelector('.lop-xem-phieu').getBoundingClientRect(); return !!t && t.top >= to.bottom - 1 && t.bottom <= innerHeight + 1 }), JSON.stringify(st()?.live?.tay))
await chup(gv, '8-gv-gio-tay')
await gv.locator('.lkt-tay li button').first().click(); await ngu(1200)
kiem('8i thầy «Mời nói»: phòng ghi lời mời, máy thầy báo «đã mời», máy em hiện tấm «Thầy mời em nói»', !!st()?.live?.moi && await gv.locator('.lkt-tay-noi.cho').isVisible() && await em1.locator('.lv-moi').first().isVisible(), JSON.stringify({ moi: st()?.live?.moi, em: await em1.locator('.lv-moi').count() }))
await chup(em1, '8-em-moi-noi')
await gv.locator('.lkt-tay-noi.cho button').click(); await ngu(700)
kiem('8k thầy «Thôi»: lời mời hết, thẻ máy thầy tự ẩn', !st()?.live?.moi && (await gv.locator('.lkt-tay').count()) === 0)

// ── 9. Esc ra tới Hôm nay ⇒ nút «Kết thúc buổi» + viên «Vào lại»; vào lại đúng chỗ ──
await gv.keyboard.press('Escape'); await ngu(400)
kiem('9a Esc (đang ở Bảng) ⇒ sảnh', (await trenCung(gv)) === 'sanh')
await gv.keyboard.press('Escape'); await ngu(900)
kiem('9b Esc ở sảnh ⇒ ra Hôm nay, live vẫn chạy', (await trenCung(gv)) === 'hom-nay' && st()?.live?.bat === true && !st()?.ketThuc)
kiem('9c ở Hôm nay có viên «Đang live · Vào lại»', await gv.locator('[data-live-khoi-ngoai] button').isVisible())
await chup(gv, '9-ra-hom-nay')
await gv.locator('[data-live-khoi-ngoai] button').click(); await ngu(900)
kiem('9d «Vào lại»: về đúng buổi live (sảnh / bài), không lộ điểm danh', ['sanh', 'to'].includes(await trenCung(gv)), await trenCung(gv))

kiem('9z suốt buổi live máy thầy KHÔNG lần nào tự xin toàn màn hình (giữ nguyên cỡ cửa sổ trình duyệt)', (await gv.evaluate(() => window.__fs)) === 0, String(await gv.evaluate(() => window.__fs)))

// ── 10. Kết thúc ⇒ máy thầy ra Hôm nay sạch, máy em vinh danh ──
if ((await trenCung(gv)) !== 'sanh') { await gv.keyboard.press('Escape'); await ngu(400) }
await gv.locator('.lkt-cho.sanh .lkt-dong').click(); await ngu(1800)
kiem('10z hết buổi live: trả lại quyền toàn màn hình cho buổi dạy trên lớp', await gv.evaluate(() => !Object.prototype.hasOwnProperty.call(document.documentElement, 'requestFullscreen')))
kiem('10a kết thúc: phòng kết thúc, máy thầy về Hôm nay, không còn lớp live / viên nổi', st()?.ketThuc === true && (await trenCung(gv)) === 'hom-nay' && (await gv.locator('[data-live-khoi-thay], [data-live-khoi-ngoai], [data-live-khoi-nen]').count()) === 0)
kiem('10b máy em: vinh danh đội thắng', await em1.locator('.lke .vd h2').isVisible())
await chup(em1, '10-em-vinh-danh')

kiem('0 lỗi trang', loiTrang.length === 0, loiTrang.slice(0, 4).join(' | '))
await trinh.close(); await may.dong()
const hong = ket.filter((k) => !k.dat)
console.log(`\n${ket.length - hong.length}/${ket.length} đạt`)
process.exit(hong.length ? 1 : 0)
