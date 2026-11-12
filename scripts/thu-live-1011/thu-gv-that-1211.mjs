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
const mo = async (duong, w, h) => {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, permissions: ['microphone'] })
  await ctx.route((u) => !u.href.startsWith(may.goc), (r) => r.abort())
  const p = await ctx.newPage()
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

const gv = await mo('vai=gv', 1366, 768)
const em1 = await mo('vai=em&sbd=S1', 844, 390)
const em2 = await mo('vai=em&sbd=S2', 390, 844) // em cầm DỌC
await gv.waitForFunction(() => window.__sanSang); await ngu(400)

// ── 1. Mở phòng chờ ──
await gv.evaluate(() => { void window.__moLive() }); await ngu(250)
kiem('1a bấm mở: lớp live hiện NGAY (không lộ Hôm nay, không lộ bảng điểm danh)', !['hom-nay', 'bang-bpu'].includes(await trenCung(gv)), await trenCung(gv))
await ngu(2600)
kiem('1b phòng chờ: phòng mang cờ khối, máy thầy ở phòng chờ', st()?.live?.khoi?.gd === 'cho' && (await trenCung(gv, 0.8, 0.5)) === 'phong-cho')
kiem('1c bảng Bình Phản Ứng có gắn (giữ nối phòng) nhưng ẨN', (await bangBpu(gv)) === 'hidden', await bangBpu(gv))
kiem('1d máy em: trò Giữ Lửa', await em1.locator('.lke.cho .gl canvas').isVisible())
await chup(gv, '1-phong-cho')

// ── 2. Bắt đầu live ⇒ sảnh cả hai phía, tiếng tự bật ──
await gv.locator('.lkt-bat-dau').click(); await ngu(3200)
kiem('2a máy thầy: SẢNH danh sách', (await trenCung(gv)) === 'sanh' && (await gv.locator('.lkt-cho.sanh .lkt-doi li:not(.rong)').count()) === 8)
kiem('2b live TỰ BẬT, không cần tờ, không bấm nút Live', st()?.live?.bat === true && (await gv.locator('.lop-xem-phieu').count()) === 0)
kiem('2c phòng: chế độ «sanh»; máy em ở bảng danh sách bốn đội', st()?.live?.khoi?.che === 'sanh' && (await em1.locator('.lke .bd').count()) === 1)
kiem('2d em cầm DỌC bị ép ngang (xoay hình)', await em2.evaluate(() => !!document.querySelector('.lke[data-xoay]')))
await chup(gv, '2-sanh'); await chup(em1, '2-em-danh-sach'); await chup(em2, '2-em-doc-ep-ngang')

// ── 3. Ở sảnh bấm «Học» ⇒ bảng chọn bài; Esc lùi về sảnh; máy em vẫn ở danh sách ──
await gv.locator('.lkt-che-to').nth(0).click(); await ngu(900)
kiem('3a sảnh → «Học»: bảng chọn bài hiện', (await trenCung(gv)) === 'chon-bai' && await gv.locator('.lkt-chon .bcc-hd').isVisible())
kiem('3b máy em chưa đổi (thầy chưa chọn xong bài)', st()?.live?.khoi?.che === 'sanh' && (await em1.locator('.lke .bd').count()) === 1)
await chup(gv, '3-chon-bai')
await gv.keyboard.press('Escape'); await ngu(500)
kiem('3c Esc: lùi MỘT màn về sảnh (không ra Hôm nay)', (await trenCung(gv)) === 'sanh')

// ── 4. Chọn bài (chiếu bằng hàm thật) rồi «Học» ⇒ tờ giảng + bảng đua như buổi trên lớp; máy em vào câu ──
const loiChieu = await gv.evaluate(() => window.__chieuCauGia()); await ngu(600)
await gv.locator('.lkt-che-to').nth(0).click(); await ngu(3500)
kiem('4a chiếu được bài', loiChieu === '', loiChieu)
kiem('4b phòng sang «hoc», có lượt câu, live vẫn bật', st()?.live?.khoi?.che === 'hoc' && !!st()?.luot && st()?.live?.bat === true, JSON.stringify({ che: st()?.live?.khoi?.che, luot: st()?.luot?.so }))
kiem('4c máy thầy: bảng Bình Phản Ứng HIỆN (màn đua như bên Lên bảng)', (await bangBpu(gv)) === 'visible' && (await trenCung(gv)) === 'bang-bpu', `${await bangBpu(gv)} · ${await trenCung(gv)}`)
kiem('4d cụm Học | Bảng · Lớp · Tin nhắn nằm trên cùng, bấm được', await gv.locator('.lkt-che button').count() === 2 && await gv.evaluate(() => { const b = document.querySelector('.lkt-che button'); const r = b.getBoundingClientRect(); return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === b }))
kiem('4e máy em: bảng danh sách đóng, vào câu hỏi; nút nhắn tin ẨN lúc làm câu', (await em1.locator('.lke .bd').count()) === 0 && (await em1.locator('.lke-mep').count()) === 0 && await em1.locator('.bpu-hs').isVisible())
kiem('4f em cầm dọc: màn câu hỏi vẫn ép ngang', await em2.evaluate(() => !!document.querySelector('.bpu-hs[data-xoay]')))
await chup(gv, '4-hoc-bang-dua'); await chup(em1, '4-em-cau-hoi'); await chup(em2, '4-em-doc-cau-hoi')

// ── 5. Esc ở «Học» ⇒ về sảnh; «Quay lại bài» ──
await gv.keyboard.press('Escape'); await ngu(500)
kiem('5a Esc: lùi về sảnh', (await trenCung(gv)) === 'sanh')
await gv.locator('.lkt-cho.sanh .lkt-ve').last().click(); await ngu(500)
kiem('5b «Quay lại bài»: về màn đang dạy', (await trenCung(gv)) === 'bang-bpu')

// ── 6. Sang «Bảng» ⇒ bảng xanh than kín màn cả hai phía, viết được ở MỌI chỗ ──
await gv.locator('.lkt-che button').nth(1).click(); await ngu(2200)
const to = gv.frameLocator('.lop-xem-phieu iframe')
const vung = await to.locator('body').evaluate(() => { const r = (q) => { const e = document.querySelector(q); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)] }; return { cot: r('.mc-cot-lam-bai'), de: r('.mc-vung-de'), W: innerWidth, cheBang: document.body.classList.contains('mc-che-bang'), but: document.body.classList.contains('mc-co-but'), nutLive: getComputedStyle(document.querySelector('.mc-lv-nut') ?? document.body).display } })
kiem('6a phòng «bang»; bảng Bình Phản Ứng ẩn, tờ lộ ra', st()?.live?.khoi?.che === 'bang' && (await bangBpu(gv)) === 'hidden' && (await trenCung(gv)) === 'to')
kiem('6b tờ: giấy đề ẩn, cột bảng phủ gần kín bề ngang, bút bật sẵn', vung.cheBang && vung.but && (!vung.de || vung.de[0] === 0) && !!vung.cot && vung.cot[0] > vung.W * 0.9, JSON.stringify(vung))
kiem('6c máy em: bảng live phủ kín', await em1.evaluate(() => { const b = document.querySelector('.lv-bang'), r = b?.getBoundingClientRect(); return !!r && r.width > innerWidth * 0.85 }))
// mực trên máy em: đếm điểm ảnh sáng ở nửa trái / nửa phải của màn (ảnh chụp thật) — nét của thầy phải tới đúng chỗ, đủ cả hai nửa
const mucEm = async (p) => { const anh = (await p.screenshot({ type: 'png' })).toString('base64'); return p.evaluate(async (b64) => { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let t = 0, ph = 0; for (let k = 0; k < d.length; k += 4) if (d[k] > 130 && d[k + 1] > 130 && d[k + 2] > 130) { if (((k / 4) % c.width) < c.width / 2) t++; else ph++ } return { t, ph } }, anh) }
await chup(em1, '6-em-bang-truoc-viet')
const muc0 = await mucEm(em1)
await veNet(gv, 220, 260); await ngu(400); await veNet(gv, 900, 560); await ngu(1500)
const muc1 = await mucEm(em1), muc2 = await mucEm(em2)
kiem('6d viết ở nửa TRÁI và nửa PHẢI (gần đáy): máy em hiện ĐỦ hai nét, đúng nửa', muc1.t > 40 && muc1.ph > 40 && muc1.t !== muc0.t && muc1.ph !== muc0.ph, // trước khi viết màn có dòng chữ chờ «Bảng đen · Thầy viết gì…» nên so KHÁC, không so hơn
  JSON.stringify({ truoc: muc0, sau: muc1 }))
kiem('6e em cầm dọc cũng thấy đủ hai nét', muc2.t + muc2.ph > 80, JSON.stringify(muc2))
await chup(gv, '6-bang'); await chup(em1, '6-em-bang'); await chup(em2, '6-em-doc-bang')

// ── 7. Về «Học» ⇒ quay lại đúng bài đang dạy (không phải chọn lại) ──
await gv.locator('.lkt-che button').nth(0).click(); await ngu(1800)
kiem('7 về «Học»: phòng «hoc», bảng đua hiện lại, không mở chọn bài', st()?.live?.khoi?.che === 'hoc' && (await trenCung(gv)) === 'bang-bpu' && (await gv.locator('.lkt-chon').count()) === 0)

// ── 8. Chế độ Bảng: máy em KHOÁ ở bảng, nút nhắn tin + bốn đội nằm trong khay thanh vàng; cửa nhắn tin cao 1/3 sát mép phải ──
await gv.locator('.lkt-che button').nth(1).click(); await ngu(1500)
kiem('8a chế độ Bảng: máy em không còn cụm nút nổi, không có dòng «Chạm hai lần…»', (await em1.locator('.lke-mep').count()) === 0 && (await em1.getByText('Chạm hai lần').count()) === 0)
await em1.mouse.dblclick(300, 200); await ngu(500)
kiem('8b chạm hai lần: em vẫn ở bảng kín màn (khoá cứng)', await em1.evaluate(() => { const b = document.querySelector('.lv-bang'), r = b?.getBoundingClientRect(); return !!r && r.width > innerWidth * 0.85 && !document.querySelector('.lv-giay')?.getBoundingClientRect().width }) || await em1.evaluate(() => { const g = document.querySelector('.lv-giay')?.getBoundingClientRect(); return !g || g.right <= 0 || g.left >= innerWidth }))
await em1.locator('.lv-nam').first().click(); await ngu(500)
kiem('8c khay thanh vàng có «Nhắn cả lớp» và «Bốn đội»', await em1.getByRole('button', { name: /Nhắn cả lớp/ }).isVisible() && await em1.getByRole('button', { name: /Bốn đội/ }).isVisible())
await chup(em1, '8-em-khay')
await em1.getByRole('button', { name: /Nhắn cả lớp/ }).click(); await ngu(500)
kiem('8d cửa nhắn tin máy em cao ≤ 45% màn, sát mép phải', await em1.evaluate(() => { const c = document.querySelector('.lke .lc-cua'), r = c?.getBoundingClientRect(); return !!r && r.height <= innerHeight * 0.45 + 60 && r.right > innerWidth - 70 }), await em1.evaluate(() => { const r = document.querySelector('.lke .lc-cua')?.getBoundingClientRect(); return r ? `${Math.round(r.width)}×${Math.round(r.height)} @${Math.round(r.left)},${Math.round(r.top)}` : 'không có cửa' }))
const o = em1.locator('.lke input').first(); await o.fill('Thầy ơi CH3COONa là muối gì ạ?'); await o.press('Enter'); await ngu(700)
kiem('8e máy thầy: nút Tin nhắn báo tin mới', (await gv.locator('.lkt-nut-chat em').count()) === 1)
await chup(em1, '8-em-chat'); await em1.keyboard.press('Escape')

// ── 9. Esc ra tới Hôm nay ⇒ nút «Kết thúc buổi» + viên «Vào lại»; vào lại đúng chỗ ──
await gv.keyboard.press('Escape'); await ngu(400)
kiem('9a Esc (đang ở Bảng) ⇒ sảnh', (await trenCung(gv)) === 'sanh')
await gv.keyboard.press('Escape'); await ngu(900)
kiem('9b Esc ở sảnh ⇒ ra Hôm nay, live vẫn chạy', (await trenCung(gv)) === 'hom-nay' && st()?.live?.bat === true && !st()?.ketThuc)
kiem('9c ở Hôm nay có viên «Đang live · Vào lại»', await gv.locator('[data-live-khoi-ngoai] button').isVisible())
await chup(gv, '9-ra-hom-nay')
await gv.locator('[data-live-khoi-ngoai] button').click(); await ngu(900)
kiem('9d «Vào lại»: về đúng buổi live (sảnh / bài), không lộ điểm danh', ['sanh', 'to'].includes(await trenCung(gv)), await trenCung(gv))

// ── 10. Kết thúc ⇒ máy thầy ra Hôm nay sạch, máy em vinh danh ──
if ((await trenCung(gv)) !== 'sanh') { await gv.keyboard.press('Escape'); await ngu(400) }
await gv.locator('.lkt-cho.sanh .lkt-dong').click(); await ngu(1800)
kiem('10a kết thúc: phòng kết thúc, máy thầy về Hôm nay, không còn lớp live / viên nổi', st()?.ketThuc === true && (await trenCung(gv)) === 'hom-nay' && (await gv.locator('[data-live-khoi-thay], [data-live-khoi-ngoai], [data-live-khoi-nen]').count()) === 0)
kiem('10b máy em: vinh danh đội thắng', await em1.locator('.lke .vd h2').isVisible())
await chup(em1, '10-em-vinh-danh')

kiem('0 lỗi trang', loiTrang.length === 0, loiTrang.slice(0, 4).join(' | '))
await trinh.close(); await may.dong()
const hong = ket.filter((k) => !k.dat)
console.log(`\n${ket.length - hong.length}/${ket.length} đạt`)
process.exit(hong.length ? 1 : 0)
