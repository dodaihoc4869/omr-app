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
const veNet = async (p, x0, y0) => { await p.mouse.move(x0, y0); await p.mouse.down(); for (let i = 1; i <= 14; i++) await p.mouse.move(x0 + i * 16, y0 + Math.round(Math.sin(i / 2) * 18)); await p.mouse.up() }

// mực trên máy em: đếm điểm ảnh sáng ở nửa trái / nửa phải của màn (ảnh chụp thật) — nét của thầy phải tới đúng chỗ, đủ cả hai nửa
const mucEm = async (p) => { const anh = (await p.screenshot({ type: 'png' })).toString('base64'); return p.evaluate(async (b64) => { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let t = 0, ph = 0; for (let k = 0; k < d.length; k += 4) if (d[k] > 130 && d[k + 1] > 130 && d[k + 2] > 130) { if (((k / 4) % c.width) < c.width / 2) t++; else ph++ } return { t, ph } }, anh) }
/** Mực trong MỘT VÙNG của màn (tỉ lệ 0..1) — kiểm đúng chỗ một nét, không lẫn chữ chờ / thanh bút / viên Live. */
const mucVung = async (p, x0, y0, x1, y1) => { const anh = (await p.screenshot({ type: 'png' })).toString('base64'); return p.evaluate(async ([b64, x0, y0, x1, y1]) => { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); const X0 = Math.round(x0 * c.width), Y0 = Math.round(y0 * c.height), W = Math.max(1, Math.round((x1 - x0) * c.width)), H = Math.max(1, Math.round((y1 - y0) * c.height)); const d = x.getImageData(X0, Y0, W, H).data; let n = 0; for (let k = 0; k < d.length; k += 4) if (d[k] > 130 && d[k + 1] > 130 && d[k + 2] > 130) n++; return n }, [anh, x0, y0, x1, y1]) }
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
await veNet(gv, 260, 200); await ngu(1500)
const aGv0 = await mucVung(gv, ...netA.gv), aEm0 = await mucVung(em1, ...netA.em)
kiem('3e nét A trên bảng trắng: có trên máy thầy và tới máy em', aGv0 > 60 && aEm0 > 30, JSON.stringify({ thay: aGv0, em: aEm0 }))
await lk('hoc'); await ngu(800)
kiem('3f «Học» khi mới có bảng trắng: bảng chọn hiện, phòng CHƯA đổi chế độ', await gv.locator('.lkt-chon .bcc-hd-the').first().isVisible() && st()?.live?.khoi?.che === 'bang')
await gv.locator('.lkt-chon .bcc-hd-the').nth(1).click(); await ngu(2200)
kiem('3g chọn hoạt động «Kiểm tra đầu giờ»: tấm hoạt động hiện TRÊN tờ; phòng CHƯA đổi chế độ, máy em ở nguyên bảng (chưa có câu nào được chiếu)', await gv.evaluate(() => !!document.elementFromPoint(innerWidth * 0.4, innerHeight * 0.4)?.closest('.thd')) && st()?.live?.khoi?.che === 'bang' && (await mucVung(em1, ...netA.em)) > 30, `che ${st()?.live?.khoi?.che}`)
await chup(gv, '3-hoat-dong')
kiem('3g2 tấm nằm trên bảng trắng ⇒ có nút nổi «Về màn chiếu» ở đáy (không đè đầu tấm)', await gv.evaluate(() => { const n = document.querySelector('.lkt-ve-noi'), d = document.querySelector('.thd-dau'); if (!n || !d) return false; const a = n.getBoundingClientRect(), b = d.getBoundingClientRect(); return a.top > b.bottom + 100 && a.width > 60 }))
await gv.locator('.lkt-ve-noi').click(); await ngu(500)
kiem('3g3 bấm «Về màn chiếu» trên tấm: bảng trắng lên lại, nét A còn nguyên, tấm vẫn mở bên dưới', (await trenCung(gv)) === 'to' && (await mucVung(gv, ...netA.gv)) > 60 && (await gv.locator('.thd').count()) === 1, await trenCung(gv))
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
kiem('3j7 đang ở tấm hoạt động bấm «Bảng»: bảng trắng lên trên, nét A còn nguyên, tấm không bị đóng', (await trenHd(gv)) === 'to' && (await mucVung(gv, ...netA.gv)) > 60 && (await gv.locator('.thd').count()) === 1 && st()?.live?.khoi?.che === 'bang', await trenHd(gv))
await lkApp('hoc'); await ngu(900)
kiem('3j8 «Học» lại: về ĐÚNG tấm hoạt động đang dở (không ra bảng chọn), phòng sang «hoc»', (await trenHd(gv)) === 'thd' && (await gv.locator('.lkt-chon').count()) === 0 && st()?.live?.khoi?.che === 'hoc', `${await trenHd(gv)} · chọn ${await gv.locator('.lkt-chon').count()} · ${st()?.live?.khoi?.che}`)
// ── 3T. (thầy 12/11 «khi chuyển qua lại hai chế độ thì bị lỗi tọa độ bút» · «chuyển qua lại phải cực kì mượt mà chuẩn xác, lưu lại mọi thứ … một phím tắt»)
//        ĐÚNG CẢNH THẦY GẶP: tấm «Chữa câu khó» + TỜ RIÊNG THẬT của nó đang chiếu, bảng trắng cũ còn sống bên dưới. Đổi Học ⇄ Bảng nhiều lần bằng phím Tab,
//        viết bút ở từng chế độ, so chỗ nét trên máy thầy với máy em.
await gv.evaluate(() => window.__chieuToRiengThat()); await ngu(4200)
const toT = gv.frameLocator('.lop-xem-phieu[aria-label="Chữa câu khó · tờ chiếu thật"] iframe')
const soTo = () => gv.evaluate(() => [...document.querySelectorAll('.lop-xem-phieu')].map((k) => `${k.getAttribute('aria-label')}${getComputedStyle(k).visibility === 'hidden' ? ' (ẩn)' : ''}`))
kiem('3T1 tờ riêng thật của tấm đang chiếu ở «Học»; máy em nhận đề của câu', (await toT.locator('body.mc-lk').count()) === 1 && st()?.live?.khoi?.che === 'hoc' && !(await toT.locator('body.mc-che-bang').count()), JSON.stringify(await soTo()))
// Thầy kẻ MỘT NÉT NGANG từ 20 % tới 80 % bề ngang bảng, ở `fy` chiều cao bảng. Máy em: tìm mực sáng trong khung bảng ⇒ nét phải (1) DÀI ≈ 60 % bề ngang ô bảng
// của em (không «bé xíu ở góc»), (2) bắt đầu ≈ 20 % bề ngang, (3) cao đúng tỉ lệ `fy` của ô bảng. Ô bảng máy em = ô của thầy co theo bề ngang khung (Học) /
// co vừa khung (Bảng) ⇒ tính từ tỉ lệ ô của thầy.
// (ô bảng tính trong khung tờ ⇒ cộng chỗ đứng của khung tờ trên trang: tờ riêng của tấm có dải đầu phía trên)
const oBangThay = async () => { const k = await gv.locator('.lop-xem-phieu[aria-label="Chữa câu khó · tờ chiếu thật"] iframe').boundingBox(); const c = await toT.locator('body').evaluate(() => { const c = window.__mcDot().querySelector('.mc-cot-lam-bai').getBoundingClientRect(); return { x: c.left, y: c.top, w: c.width, h: c.height } }); return { x: c.x + k.x, y: c.y + k.y, w: c.w, h: c.h } }
const veNgang = async (o, fy) => { const y = o.y + o.h * fy; await gv.mouse.move(o.x + o.w * 0.2, y); await gv.mouse.down(); for (let i = 1; i <= 12; i++) await gv.mouse.move(o.x + o.w * (0.2 + 0.05 * i), y); await gv.mouse.up() }
/** Các dải mực ngang trong khung bảng máy em: mỗi dải = hàng điểm ảnh liền nhau có ≥ 12 điểm sáng ⇒ { y (tỉ lệ theo Ô BẢNG của em), x0, x1 (tỉ lệ bề ngang ô) }. */
const netEm = async (p, tiLeO, vua) => { const anh = (await p.screenshot({ type: 'png' })).toString('base64'); return p.evaluate(async ([b64, tiLeO, vua]) => { const r = document.querySelector('.lv-bang').getBoundingClientRect(); const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); const X0 = Math.round(r.left) + 3, Y0 = Math.round(r.top) + 3, W = Math.round(r.width) - 6, H = Math.round(r.height) - 6, d = x.getImageData(X0, Y0, W, H).data; const s = vua ? Math.min(r.width, r.height / tiLeO) : r.width, oW = s, oH = s * tiLeO, oX = (r.width - oW) / 2; const ra = []; let dang = null; for (let y = 0; y < H; y++) { let n = 0, a = W, b = 0; for (let xx = 0; xx < W; xx++) { const k = (y * W + xx) * 4; if (d[k] + d[k + 1] + d[k + 2] > 230) { n++; if (xx < a) a = xx; if (xx > b) b = xx } } if (n >= 12) { if (!dang) { dang = { y0: y, y1: y, a, b }; ra.push(dang) } else { dang.y1 = y; dang.a = Math.min(dang.a, a); dang.b = Math.max(dang.b, b) } } else dang = null } return ra.map((g) => ({ y: Math.round(100 * ((g.y0 + g.y1) / 2 + 3) / oH) / 100, x0: Math.round(100 * (g.a + 3 - oX) / oW) / 100, x1: Math.round(100 * (g.b + 3 - oX) / oW) / 100 })) }, [anh, tiLeO, vua]) }
const coNet = (ds, fy) => ds.some((g) => Math.abs(g.y - fy) < 0.05 && Math.abs(g.x0 - 0.2) < 0.06 && Math.abs(g.x1 - 0.8) < 0.06)
await toT.locator('body').evaluate(() => window.__mcBut.bat(true)); await ngu(300)
let oB = await oBangThay()
const tiLeHoc = oB.h / oB.w
await veNgang(oB, 0.3); await ngu(1300)
const n1 = await netEm(em1, tiLeHoc, false)
kiem('3T2 «Học»: thầy kẻ nét ngang 20–80 % bề ngang ở 30 % chiều cao bảng ⇒ máy em thấy ĐÚNG nét ấy: dài 60 % ô bảng, đúng chỗ (không lệch, không bé xíu ở góc)', coNet(n1, 0.3) && n1.length === 1, JSON.stringify(n1))
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
kiem('3T7 Tab sang «Bảng» lần nữa: mọi nét cũ của «Bảng» CÒN NGUYÊN ĐÚNG CHỖ, nét vừa viết ở «Học» không lẫn sang', st()?.live?.khoi?.che === 'bang' && JSON.stringify(nBang2) === JSON.stringify(nBang1), JSON.stringify({ truoc: nBang1, sau: nBang2 }))
// đổi thật nhanh 6 lần liên tiếp (thầy bấm Tab liên tục) ⇒ kết thúc đúng chế độ, nét hai phía vẫn đúng
for (let i = 0; i < 6; i++) { await toT.locator('body').press('Tab'); await ngu(140) }
await ngu(2800)
const nBang3 = await netEm(em1, tiLeBang, true)
kiem('3T7b bấm Tab 6 lần liên tiếp: tờ và phòng dừng ở cùng một chế độ («bang»), nét trên máy em vẫn nguyên, đúng chỗ', st()?.live?.khoi?.che === 'bang' && (await toT.locator('body.mc-che-bang').count()) === 1 && JSON.stringify(nBang3) === JSON.stringify(nBang1), JSON.stringify({ che: st()?.live?.khoi?.che, sau: nBang3 }))
kiem('3T7c tờ riêng đang chiếu: nút nổi «Về màn chiếu» của tấm KHÔNG đè lên thanh đáy của tờ', await gv.evaluate(() => { const n = document.querySelector('.lkt-ve-noi'); return !n || getComputedStyle(n).display === 'none' }))

// ── MT. MÁY TÍNH «Đỗ Đại Học FX4869» (thầy 12/11, bản vẽ 31–34): nút trên thanh đáy của tờ ⇒ máy tính nổi, bấm được, kéo được, máy em thấy y hệt ──
const mtGv = gv.locator('.mtx-lop .mtx'), mtEm = (p) => p.locator('.mtx-lop-em .mtx')
const bamMt = async (...ds) => { for (const d of ds) { await gv.locator(`.mtx-lop .mtx-p[aria-label="${d}"]`).click(); await ngu(40) } }
const kqMt = (l) => l.locator('.mtx-kq').innerText().then((t) => t.replace(/\s+/g, ''))
const tamMt = (p, l) => l.boundingBox().then(async (b) => { const v = p.viewportSize(); return b ? { x: (b.x + b.width / 2) / v.width, y: (b.y + b.height / 2) / v.height, w: b.width / v.width, trong: b.x >= -1 && b.y >= -1 && b.x + b.width <= v.width + 1 && b.y + b.height <= v.height + 1 } : null })
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
await toHoc.locator('body').press('d'); await ngu(1200)
const dauA = await em2.evaluate(() => document.querySelector('.lv-dau-dat')?.firstChild?.textContent ?? null)
const dauThayA = await toHoc.locator('body').evaluate(() => { const d = document.getElementById('mc-lv-dau'); if (!d) return null; const a = d.getBoundingClientRect(); return { chu: d.firstChild.textContent, ten: d.querySelector('small')?.textContent ?? '', giua: Math.abs((a.left + a.right) / 2 - innerWidth / 2) < innerWidth * 0.08, deGiay: a.left < document.querySelector('.mc-vung-de').getBoundingClientRect().right } })
kiem('4o bấm Đạt (phím D) trên tờ ⇒ phòng ghi Đạt; máy em hiện con dấu «ĐẠT»; máy thầy vẫn ở màn chiếu', st()?.luot?.goi?.dat === true && dauA === 'ĐẠT' && (await trenCung(gv)) === 'to', JSON.stringify({ dat: st()?.luot?.goi?.dat, dau: dauA, tren: await trenCung(gv) }))
kiem('4o2 (thầy 12/11, bản vẽ 27) MÁY THẦY cũng hiện con dấu «ĐẠT» giữa màn chiếu, đè sang giấy đề, có tên em', !!dauThayA && dauThayA.chu === 'ĐẠT' && dauThayA.giua && dauThayA.deGiay && /lên bảng/.test(dauThayA.ten), JSON.stringify(dauThayA))
await chup(gv, '4-gv-con-dau-dat')
await chup(em2, '4-em-dau-dat-that')
// (b) tờ có em XẾP SẴN (như «Chữa câu khó»): sang câu 2 (lượt mới mở theo tờ), đặt thẻ tên em S2 như tờ xếp sẵn, bấm «Lên bảng» rồi Chưa đạt
await ngu(2400)
await toHoc.locator('body').press('ArrowRight'); await ngu(3500)
kiem('4p tờ sang câu 2 ⇒ phòng mở lượt mới của câu 2', st()?.luot?.qid === 'Q2' && !st()?.luot?.goi, JSON.stringify({ qid: st()?.luot?.qid, pha: st()?.luot?.pha }))
await toHoc.locator('body').evaluate(() => { const d = window.__mcDot(), n = d.querySelector('.mc-nua') || d; const h = document.createElement('header'); h.className = 'mc-em'; h.id = 'em-xep-san'; h.hidden = true; h.innerHTML = '<div class="mc-em-trai"><div class="mc-em-hang1"><div class="mc-ten-hang"><span class="mc-ten">Em xếp sẵn</span><span class="mc-dau-kq" hidden></span></div><div class="mc-phu"><span class="mc-sbd">S2</span></div></div></div>'; n.insertBefore(h, n.firstChild); window.__mcVaoLai() }); await ngu(500)
await nutLen.click(); await ngu(1500)
kiem('4q tờ có em xếp sẵn: bấm «Lên bảng» ⇒ phòng gọi ĐÚNG em trên thẻ (S2); máy em S2 và máy bạn đều hiện thông báo', st()?.luot?.goi?.sbd === 'S2' && (await baoEm(em2)) && (await baoEm(em1)), JSON.stringify(st()?.luot?.goi ?? null))
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
const aGv1 = await mucVung(gv, ...netA.gv), aEm1 = await mucVung(em1, ...netA.em)
kiem('6x BẢNG GIỮ NÉT: nét A viết trên bảng trắng (trước khi chọn bài) còn nguyên trên máy thầy và máy em', aGv1 > 60 && aEm1 > 30, JSON.stringify({ thay: [aGv0, aGv1], em: [aEm0, aEm1] }))
const khayLk = await to.locator('body').evaluate(() => { const t = document.getElementById('mc-them'), tr = t?.getBoundingClientRect(); t?.click(); const g = document.querySelector('.mc-khay-lk'), ds = [...(g?.querySelectorAll('[data-lk]') ?? [])].filter((x) => !x.hidden && x.getBoundingClientRect().width > 0).map((x) => `${x.textContent}${x.getAttribute('aria-pressed') === 'true' ? '*' : ''}`); const em = document.querySelector('.mc-em'); t?.click(); return { nut: !!tr && tr.width > 20, ds, theTen: em ? getComputedStyle(em).display : 'không có' } })
kiem('6y ở tờ KHÔNG còn cụm nổi của app; khay nút bốn ô có nhóm «Buổi live»: Học · Bảng (đang chọn) · Lớp · Tin nhắn', (await gv.locator('.lkt-vien').count()) === 0 && khayLk.nut && khayLk.ds.join('|') === 'Học|Bảng*|Lớp|Tin nhắn', JSON.stringify(khayLk))
kiem('6z2 chế độ Bảng: nút ống nghiệm ẨN (chỉ có ở Học)', await gv.frameLocator('.lop-xem-phieu iframe').locator('#mc-nop').isHidden())
kiem('6z chế độ Bảng: thẻ tên trên bảng ẩn', khayLk.theTen === 'none' || khayLk.theTen === 'không có', khayLk.theTen)
kiem('6c máy em: bảng live phủ kín', await em1.evaluate(() => { const b = document.querySelector('.lv-bang'), r = b?.getBoundingClientRect(); return !!r && r.width > innerWidth * 0.85 }))
await chup(em1, '6-em-bang-truoc-viet')
const muc0 = await mucEm(em1)
await veNet(gv, 220, 360); await ngu(400); await veNet(gv, 1000, 560); await ngu(1500)
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
const mucB2 = await mucEm(em1), aGv2 = await mucVung(gv, ...netA.gv), aEm2 = await mucVung(em1, ...netA.em)
kiem('7b Học → Bảng lần nữa: đủ nét cũ (nét A + hai nét sau) ở cả hai phía', aGv2 > 60 && aEm2 > 30 && mucB2.t >= muc1.t - 8 && mucB2.ph >= muc1.ph - 8, JSON.stringify({ A: { thay: aGv2, em: aEm2 }, truoc: muc1, sau: mucB2 }))
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
await em1.getByRole('button', { name: /Nhắn cả lớp/ }).click(); await ngu(500)
kiem('8d cửa nhắn tin máy em cao ≤ 45% màn, sát mép phải', await em1.evaluate(() => { const c = document.querySelector('.lke .lc-cua'), r = c?.getBoundingClientRect(); return !!r && r.height <= innerHeight * 0.45 + 60 && r.right > innerWidth - 70 }), await em1.evaluate(() => { const r = document.querySelector('.lke .lc-cua')?.getBoundingClientRect(); return r ? `${Math.round(r.width)}×${Math.round(r.height)} @${Math.round(r.left)},${Math.round(r.top)}` : 'không có cửa' }))
const o = em1.locator('.lke input').first(); await o.fill('Thầy ơi CH3COONa là muối gì ạ?'); await o.press('Enter'); await ngu(700)
const baoTin = await gv.frameLocator('.lop-xem-phieu iframe').locator('body').evaluate(() => ({ chu: document.querySelector('.mc-khay-lk [data-lk="chat"]')?.textContent ?? '', cham: document.getElementById('mc-them')?.hasAttribute('data-bat') }))
kiem('8e máy thầy: nút bốn ô có chấm báo, dòng «Tin nhắn · 1 mới» trong khay', baoTin.cham === true && /1 mới/.test(baoTin.chu), JSON.stringify(baoTin))
await chup(em1, '8-em-chat'); await em1.keyboard.press('Escape')
// 8f. thầy nhắn ⇒ bong bóng trên máy em gọn ở góc trên-phải (trong phần bảng), chữ nằm ngang
await em1.locator('.lke .lc-cua button[aria-label*="Đóng"], .lke .lc-cua .lc-dong').first().click().catch(() => {}); await ngu(300)
await lk('chat'); await ngu(600)
const oGv = gv.locator('.lkt-chat input, .lkt-chat textarea').first(); await oGv.fill('Thầy chào cả lớp nhé'); await oGv.press('Enter'); await ngu(700)
const bong = await em1.evaluate(() => { const b = document.querySelector('.lke-bong .lc-bong-noi'), r = b?.getBoundingClientRect(); return r ? { w: Math.round(r.width), h: Math.round(r.height), l: Math.round(r.left), t: Math.round(r.top), W: innerWidth, H: innerHeight } : null })
kiem('8f thầy nhắn: bong bóng máy em nằm ngang, gọn ở góc trên-phải', !!bong && bong.w > 90 && bong.h < 90 && bong.l > bong.W * 0.55 && bong.t < bong.H * 0.3, JSON.stringify(bong))
await chup(em1, '8-em-bong-tin')
// mở khay nút bốn ô lúc cột tin nhắn đang mở ⇒ cột tự thu (khay nằm đúng chỗ đó, không bị đè)
await gv.frameLocator('.lop-xem-phieu iframe').locator('#mc-them').click(); await ngu(500)
kiem('8f2 mở khay nút bốn ô ⇒ cột tin nhắn máy thầy tự thu, khay bấm được', (await gv.locator('.lkt-chat').count()) === 0 && await gv.frameLocator('.lop-xem-phieu iframe').locator('.mc-khay-lk [data-lk="lop"]').isVisible())
await chup(gv, '8-gv-khay')
await gv.frameLocator('.lop-xem-phieu iframe').locator('#mc-them').click(); await ngu(300)

// ── 8M. MIC CỦA EM (thầy 12/11 «cài mic của hs vào»): em giơ tay trong khay thanh vàng ⇒ máy thầy hiện hàng giơ tay ⇒ «Mời nói» ⇒ máy em có tấm mời ──
await em1.locator('.lv-nam').first().click(); await ngu(500)
kiem('8g khay máy em có «Giơ tay» và «Mic của em» (đang tắt)', await em1.locator('.lv-khay .lv-tay').first().isVisible() && await em1.locator('.lv-khay .lv-vua.mic').first().isVisible())
await chup(em1, '8-em-khay-mic')
await em1.locator('.lv-khay .lv-tay').first().click(); await ngu(900)
kiem('8h em giơ tay: phòng ghi hàng tay, máy thầy hiện thẻ «1 em giơ tay»', st()?.live?.tay?.length === 1 && await gv.locator('.lkt-tay li').first().isVisible(), JSON.stringify(st()?.live?.tay))
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
