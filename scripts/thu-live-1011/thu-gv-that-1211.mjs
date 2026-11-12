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

// mực trên máy em: đếm điểm ảnh sáng ở nửa trái / nửa phải của màn (ảnh chụp thật) — nét của thầy phải tới đúng chỗ, đủ cả hai nửa
const mucEm = async (p) => { const anh = (await p.screenshot({ type: 'png' })).toString('base64'); return p.evaluate(async (b64) => { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let t = 0, ph = 0; for (let k = 0; k < d.length; k += 4) if (d[k] > 130 && d[k + 1] > 130 && d[k + 2] > 130) { if (((k / 4) % c.width) < c.width / 2) t++; else ph++ } return { t, ph } }, anh) }
/** Mực trong MỘT VÙNG của màn (tỉ lệ 0..1) — kiểm đúng chỗ một nét, không lẫn chữ chờ / thanh bút / viên Live. */
const mucVung = async (p, x0, y0, x1, y1) => { const anh = (await p.screenshot({ type: 'png' })).toString('base64'); return p.evaluate(async ([b64, x0, y0, x1, y1]) => { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); const X0 = Math.round(x0 * c.width), Y0 = Math.round(y0 * c.height), W = Math.max(1, Math.round((x1 - x0) * c.width)), H = Math.max(1, Math.round((y1 - y0) * c.height)); const d = x.getImageData(X0, Y0, W, H).data; let n = 0; for (let k = 0; k < d.length; k += 4) if (d[k] > 130 && d[k + 1] > 130 && d[k + 2] > 130) n++; return n }, [anh, x0, y0, x1, y1]) }
/** Nét A viết trên bảng trắng ở (260..484, 182..218) của máy thầy 1366 × 768; trên máy em 844 × 390 bảng co vừa màn ⇒ quanh (195, 115). */
const netA = { gv: [0.18, 0.21, 0.37, 0.31], em: [0.17, 0.2, 0.42, 0.4] }
const gv = await mo('vai=gv', 1366, 768)
/** Bấm một nút của buổi live (thầy 12/11: cụm Học | Bảng · Lớp · Chọn bài · Tin nhắn nằm TRONG khay nút bốn ô của tờ; lúc bảng đua hiện thì còn cụm nổi của app). */
const lk = async (v) => {
  if (await gv.locator('.lkt-vien').count()) { if (v === 'hoc' || v === 'bang') await gv.locator('.lkt-che button').nth(v === 'hoc' ? 0 : 1).click(); else await gv.locator('.lkt-nut-chat').last().click(); return }
  const f = gv.frameLocator('.lop-xem-phieu iframe')
  if ((await f.locator('#mc-them').getAttribute('aria-expanded')) !== 'true') { await f.locator('#mc-them').click(); await ngu(300) }
  await f.locator(`.mc-khay-lk [data-lk="${v}"]`).click()
}
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
await gv.keyboard.press('Escape'); await ngu(800)
kiem('3h Esc: đóng tấm hoạt động ⇒ về bảng đang dạy, không kẹt màn trống', (await gv.locator('.thd').count()) === 0 && (await trenCung(gv)) === 'to' && st()?.live?.khoi?.che === 'bang', await trenCung(gv))

// ── 4. Chọn bài (chiếu bằng hàm thật) rồi «Học» ⇒ tờ giảng + bảng đua như buổi trên lớp; máy em vào câu ──
const loiChieu = await gv.evaluate(() => window.__chieuCauGia()); await ngu(3500)
kiem('4a chiếu được bài', loiChieu === '', loiChieu)
kiem('4b câu được CHIẾU ⇒ phòng tự sang «hoc» (lượt mới), live vẫn bật', st()?.live?.khoi?.che === 'hoc' && !!st()?.luot && st()?.live?.bat === true, JSON.stringify({ che: st()?.live?.khoi?.che, luot: st()?.luot?.so }))
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
await lk('bang'); await ngu(2200)
const to = gv.frameLocator('.lop-xem-phieu iframe')
const vung = await to.locator('body').evaluate(() => { const r = (q) => { const e = document.querySelector(q); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)] }; return { cot: r('.mc-cot-lam-bai'), de: r('.mc-vung-de'), W: innerWidth, cheBang: document.body.classList.contains('mc-che-bang'), but: document.body.classList.contains('mc-co-but'), nutLive: getComputedStyle(document.querySelector('.mc-lv-nut') ?? document.body).display } })
kiem('6a phòng «bang»; bảng Bình Phản Ứng ẩn, tờ lộ ra', st()?.live?.khoi?.che === 'bang' && (await bangBpu(gv)) === 'hidden' && (await trenCung(gv)) === 'to')
kiem('6b tờ: giấy đề ẩn, cột bảng phủ gần kín bề ngang, bút bật sẵn', vung.cheBang && vung.but && (!vung.de || vung.de[0] === 0) && !!vung.cot && vung.cot[0] > vung.W * 0.9, JSON.stringify(vung))
const aGv1 = await mucVung(gv, ...netA.gv), aEm1 = await mucVung(em1, ...netA.em)
kiem('6x BẢNG GIỮ NÉT: nét A viết trên bảng trắng (trước khi chọn bài) còn nguyên trên máy thầy và máy em', aGv1 > 60 && aEm1 > 30, JSON.stringify({ thay: [aGv0, aGv1], em: [aEm0, aEm1] }))
const khayLk = await to.locator('body').evaluate(() => { const t = document.getElementById('mc-them'), tr = t?.getBoundingClientRect(); t?.click(); const g = document.querySelector('.mc-khay-lk'), ds = [...(g?.querySelectorAll('[data-lk]') ?? [])].filter((x) => !x.hidden && x.getBoundingClientRect().width > 0).map((x) => `${x.textContent}${x.getAttribute('aria-pressed') === 'true' ? '*' : ''}`); const em = document.querySelector('.mc-em'); t?.click(); return { nut: !!tr && tr.width > 20, ds, theTen: em ? getComputedStyle(em).display : 'không có' } })
kiem('6y ở tờ KHÔNG còn cụm nổi của app; khay nút bốn ô có nhóm «Buổi live»: Học · Bảng (đang chọn) · Lớp · Tin nhắn', (await gv.locator('.lkt-vien').count()) === 0 && khayLk.nut && khayLk.ds.join('|') === 'Học|Bảng*|Lớp|Tin nhắn', JSON.stringify(khayLk))
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
kiem('7 về «Học»: phòng «hoc», bảng đua hiện lại, không mở chọn bài', st()?.live?.khoi?.che === 'hoc' && (await trenCung(gv)) === 'bang-bpu' && (await gv.locator('.lkt-chon').count()) === 0)

// 7d. (thầy 12/11, ảnh màn Đúng–sai khổ ngang) câu ĐÚNG–SAI trên máy em: cột phải hiện ĐỦ chữ từng ý + nút Đúng | Sai bên cạnh (giống chặng), không rút gọn «…»
await may.moLuot({ qid: 'DS1', maDe: 'm', version: '1', group: 'g', phan: 'II', text: 'Peptide X có cấu trúc như sau: H₂N–CH(CH₃)–CO–NH–CH(CH₂CH₂COOH)–CO–NH–CH₂–COOH. Mỗi phát biểu sau đây là đúng hay sai?', choices: [], ideas: ['X là một tetrapeptide.', 'Trong phân tử peptide X có chứa 3 liên kết peptide.', 'Tên viết tắt của peptide X là Ala-Val-Gly.', 'Trong cấu tạo của X, amino acid đầu N là alanine và amino acid đầu C là glycine.'], hinhAnh: [], dang: null, tenDang: 'Peptide', mucDo: 'hieu', sao: 2, kienThuc: [] }, 'SSSĐ'); await ngu(2500)
for (const [ten, p] of [['ngang', em1], ['dọc ép ngang', em2]]) {
  const ds = await p.evaluate(() => { const y = [...document.querySelectorAll('.bpu-tra .ht2-lam-y')]; return { gon: !!document.querySelector('.bpu-cau[data-gon]'), n: y.length, cat: y.filter((e) => { const c = e.querySelector('.ht2-lam-y-chu'); return !c || c.scrollHeight > c.clientHeight + 1 || c.scrollWidth > c.clientWidth + 1 }).length, canh: y.filter((e) => { const c = e.querySelector('.ht2-lam-y-chu'), n = e.querySelector('.ht2-lam-y-nut'); if (!c || !n) return false; const oc = c.closest('.ht2-lam-y-dau') ?? c; return n.offsetLeft >= oc.offsetLeft + oc.offsetWidth - 4 && n.offsetTop < oc.offsetTop + oc.offsetHeight && c.offsetWidth > 60 }).length, lap: document.querySelector('.bpu-y-de') ? getComputedStyle(document.querySelector('.bpu-y-de')).display : 'không có' } })
  kiem(`7d Đúng–sai máy em (${ten}): đủ 4 ý, KHÔNG cắt chữ, nút Đúng | Sai đứng cạnh ý, không lặp danh sách ý bên cột đề`, !ds.gon && ds.n === 4 && ds.cat === 0 && ds.canh === 4 && (ds.lap === 'none' || ds.lap === 'không có'), JSON.stringify(ds))
}
await chup(em1, '7-em-dung-sai'); await chup(em2, '7-em-doc-dung-sai')
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
await lk('chat'); await ngu(300)

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
