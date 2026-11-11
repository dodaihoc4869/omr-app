#!/usr/bin/env node
// BỘ THỬ THẺ «ĐANG NÓI» TRONG KHAY CỦA NÚT «THÊM» (thầy 11/11 tối: «bảng này ẩn thì không biết mở ở đâu, cho nó ẩn luôn vào cái biểu tượng các nút để tôi
// bật chủ động nhé»). Chromium THẬT, tờ chiếu THẬT có cầu nối (trang thử ?vai=thay&noi=1) + phòng THẬT chạy trong Node (may-chu.mjs). Dữ liệu giả.
//   npx vite build --config scripts/thu-live-1011/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/thu-live-1011/thu-dang-noi-1111.mjs <thư mục tạm> [thư mục ảnh = docs/ban-ve-live-1011] [tệp số đo = <thư mục ảnh>/so-do-dang-noi-1111.json]
// Bật live bằng giao diện thật rồi bơm trạng thái «có em nói» (phòng thử không có máy chủ tiếng ⇒ không có em nói thật) và kiểm:
//   thẻ KHÔNG tự hiện · nút «thêm» có dấu đỏ góc trái · khay có dải «Đang nói · <tên>» + phím N + «Thu mic» (hai chạm) · dải KHÔNG làm khay nở, nằm trọn
//   trong màn, không đè khay · bấm mục ⇒ thẻ mở đầy đủ · Esc thu mà bút vẫn bật · N mở · chạm ra ngoài thu.
// Ảnh 1366: that-6-dang-noi-khay-dong / khay-mo / the-mo / tay-khay-dong (JPG ≤ 150 KB).
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { moMayChu } from './may-chu.mjs'

const GOC = resolve(import.meta.dirname, '../..')
const DIST = resolve(process.argv[2] ?? 'dist-thu-live')
const ANH = resolve(process.argv[3] ?? join(GOC, 'docs/ban-ve-live-1011'))
const SO_DO = resolve(process.argv[4] ?? join(ANH, 'so-do-dang-noi-1111.json'))
mkdirSync(ANH, { recursive: true })
const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
const ket = [], loiTrang = [], soDo = {}
const kiem = (ten, dat, them = '') => { ket.push({ ten, dat: !!dat, them }); console.log(`${dat ? '✓' : '✗'} ${ten}${them ? ' — ' + them : ''}`) }

const KHO = [[1180, 820, false], [1366, 768, true], [1920, 1080, false]]
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })
const MINH_ANH = { sbd: 'S1', ten: 'Nguyễn Minh Anh', ky: 'MA', doi: 'Đội Natri', mau: '' }
const TAY = [{ sbd: 'S2', ten: 'Lê Gia Huy', ky: 'LH', doi: 'Đội Kali', mau: '', luc: 1 }, { sbd: 'S3', ten: 'Trần Thu Hà', ky: 'TH', doi: 'Đội Natri', mau: '', luc: 2 }]
const tt = (them) => ({ co: true, pha: 'live', tu: Date.now() - 425_000, xem: 38, tong: 40, lop: '12A1', coTieng: true, khongTieng: false, micIm: false, noiLai: false, mayKhac: false, bang: true, noi: [], ngheEm: false, chuaGui: 0, the: null, roi: [], tay: [], moi: null, micLoi: '', nghi: false, dot2: true, nghe: 36, ghi: 'dang-ghi', ...them })

for (const [W, H, coAnh] of KHO) {
  const may = await moMayChu({ dist: DIST })
  const ctx = await trinh.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, permissions: ['microphone'] })
  await ctx.route((u) => !u.href.startsWith(may.goc), (r) => r.abort())
  const thay = await ctx.newPage()
  thay.on('pageerror', (e) => loiTrang.push(`${W}: ${e.message}`))
  const N = `${W}×${H}`
  const chup = async (ten) => {
    if (!coAnh) return
    let q = 84, buf
    do { buf = await thay.screenshot({ type: 'jpeg', quality: q }); q -= 6 } while (buf.length > 150 * 1024 && q > 30)
    writeFileSync(join(ANH, `that-6-dang-noi-${ten}-${W}.jpg`), buf)
    console.log(`  ảnh that-6-dang-noi-${ten}-${W}.jpg ${Math.round(buf.length / 1024)} KB`)
  }
  const to = thay.frameLocator('iframe')
  const guiTo = (tin) => thay.evaluate((m) => document.querySelector('iframe').contentWindow.postMessage(m, '*'), tin)
  const bom = async (them) => { await guiTo({ nguon: 'bpu-bang', lenh: 'live-tt', tt: tt(them) }); await ngu(300) }
  const phim = (k) => to.locator('body').press(k)
  const dangMo = () => to.locator('body').evaluate((b) => b.classList.contains('mc-khay-mo'))
  const moKhay = async () => { await to.locator('#mc-them').click(); await ngu(260) }
  const theHien = () => to.locator('body').evaluate(() => { const e = document.querySelector('.mc-lv-roi .mc-lv-noi:not(.mc-lv-ghi-nhac)'); return !!e && e.getClientRects().length > 0 })
  /** Khay + dải: hộp, khay có nở không, dải trọn trong màn, không đè khay, ô chạm. */
  const doKhay = () => to.locator('#mc-khay').evaluate((k) => {
    const R = k.getBoundingClientRect(), d = k.querySelector('.mc-khay-noi'), D = d && !d.hidden ? d.getBoundingClientRect() : null
    const nut = d ? [...d.querySelectorAll('button')].map((b) => ({ chu: b.innerText.replace(/\s+/g, ' ').trim(), cao: Math.round(b.getBoundingClientRect().height) })) : []
    return { w: Math.round(R.width), h: Math.round(R.height), top: Math.round(R.top), hien: getComputedStyle(k).visibility === 'visible', dai: D ? { l: Math.round(D.left), r: Math.round(D.right), t: Math.round(D.top), b: Math.round(D.bottom), w: Math.round(D.width) } : null, nut, trongMan: !D || (D.left >= 0 && D.top >= 0 && D.right <= innerWidth + 0.6) }
  })
  const dau = () => to.locator('#mc-them').evaluate((e) => { const s = getComputedStyle(e, '::before'), r = e.getBoundingClientRect(); return { noi: e.getAttribute('data-noi'), nhan: e.getAttribute('aria-label'), hien: s.display === 'block', trai: Math.round(parseFloat(s.left)), nen: s.backgroundColor, w: Math.round(r.width) } })

  await thay.goto(`${may.goc}/scripts/thu-live-1011/trang.html?vai=thay&noi=1`)
  await to.locator('body[data-bo-cuc="xong"]').waitFor({ timeout: 20000 })
  await to.locator('.mc-lv-nut').waitFor({ state: 'visible', timeout: 15000 })
  await guiTo({ type: 'ddh-mc-ket-noi', maPhien: 'thu1111' })
  await to.locator('body.mc-noi').waitFor({ timeout: 6000 })
  await ngu(500)
  await to.locator('.mc-lv-nut').click()
  await to.locator('.mc-lv-the').waitFor({ state: 'visible', timeout: 8000 })
  await ngu(400)
  await to.locator('.mc-lv-the [data-lv="bat-dau"]').click().catch(() => to.locator('.mc-lv-the [data-lv="khong-tieng"]').click())
  await to.locator('.mc-lv-cum b#mc-lv-dh').waitFor({ timeout: 10000 })
  await ngu(700)
  await thay.evaluate(() => { window.__tinTo = []; window.addEventListener('message', (e) => { if (e.data && e.data.nguon === 'to-chieu' && e.data.loai === 'live') window.__tinTo.push(e.data) }) })

  // ── khay KHÔNG có em nói: bề rộng gốc của khay ──
  await bom({})
  await moKhay()
  const goc = await doKhay()
  await phim('Escape'); await ngu(220)

  // ── có em nói + 2 em giơ tay: thẻ đóng, dấu đỏ trên nút «thêm» ──
  await bom({ noi: [MINH_ANH], tay: TAY })
  const d1 = await dau()
  soDo[`${W}_dau`] = d1
  kiem(`${N} · có em nói: thẻ «Đang nói» KHÔNG tự hiện, góc phải dưới trống`, !(await theHien()) && await to.locator('.mc-lv-roi').evaluate((e) => e.hidden))
  kiem(`${N} · nút «thêm» có dấu đỏ ở góc trái (data-noi = noi), nhãn đọc tên em`, d1.noi === 'noi' && d1.hien && d1.trai <= 4 && /Minh Anh đang nói, 2 em giơ tay/.test(d1.nhan), `${d1.nen} · ${d1.nhan}`)
  await to.locator('body').evaluate(() => { if (document.activeElement) document.activeElement.blur() }) // ảnh sạch: bỏ viền tiêu điểm Esc vừa trả về nút «thêm»
  await chup('khay-dong')
  // ── khay xoè: dải «Đang nói» trên ba nhóm ──
  await moKhay()
  const k = await doKhay()
  soDo[`${W}_khay`] = { goc: { w: goc.w, h: goc.h }, coDai: { w: k.w, h: k.h }, dai: k.dai, nut: k.nut }
  kiem(`${N} · dải KHÔNG làm khay nở: khay giữ đúng bề rộng / bề cao như lúc không có em nói`, Math.abs(k.w - goc.w) <= 1 && Math.abs(k.h - goc.h) <= 1, `khay ${goc.w}×${goc.h} ⇒ ${k.w}×${k.h}`)
  kiem(`${N} · dải nằm trọn trong màn, ngay trên khay (không đè), rộng ít nhất bằng khay`, k.hien && !!k.dai && k.trongMan && k.dai.b <= k.top && k.top - k.dai.b <= 14 && k.dai.w >= k.w - 1, JSON.stringify(k.dai))
  kiem(`${N} · dải có mục «Đang nói · Minh Anh» + dòng «2 em giơ tay» + ô phím N và nút «Thu mic»; mỗi nút ≥ 40 px`, k.nut.length === 2 && /^Đang nói · Minh Anh 2 em giơ tay N$/.test(k.nut[0].chu) && k.nut[1].chu === 'Thu mic' && k.nut.every((x) => x.cao >= 40), k.nut.map((x) => `${x.chu} ${x.cao}px`).join(' | '))
  await chup('khay-mo')
  // ── «Thu mic» khẩn: hai chạm (mở khay ⇒ «Thu mic») ──
  await to.locator('#mc-khay .mc-khay-noi [data-thu]').click(); await ngu(250)
  const tin = await thay.evaluate(() => window.__tinTo.filter((m) => m.viec === 'thu-mic'))
  kiem(`${N} · hai chạm: «Thu mic» trong khay ⇒ gửi app thu mic đúng em, khay thu`, tin.length === 1 && tin[0].sbd === 'S1' && !(await dangMo()), JSON.stringify(tin))
  // ── bấm mục ⇒ thẻ mở đầy đủ ──
  await bom({ noi: [MINH_ANH], tay: TAY })
  await moKhay()
  await to.locator('#mc-khay .mc-khay-noi-mo').click(); await ngu(300)
  const chuThe = await to.locator('.mc-lv-roi').innerText()
  kiem(`${N} · bấm mục «Đang nói» ⇒ khay thu, thẻ mở đầy đủ (Thu mic · Phát tiếng em ra loa lớp · Tắt mic tất cả · 2 em giơ tay), dấu trên nút «thêm» tắt`,
    !(await dangMo()) && await theHien() && ['Đang nói', 'Thu mic', 'Phát tiếng em ra loa lớp', 'Tắt mic tất cả', '2 em giơ tay'].every((c) => chuThe.includes(c)) && !(await dau()).hien, chuThe.replace(/\s+/g, ' ').slice(0, 160))
  await chup('the-mo')
  // ── Esc thu thẻ mà bút vẫn bật (live bật bút sẵn) ──
  const butTruoc = await to.locator('body').evaluate((b) => b.classList.contains('mc-co-but'))
  await phim('Escape'); await ngu(200)
  kiem(`${N} · Esc thu thẻ, bút vẫn bật`, !(await theHien()) && butTruoc && await to.locator('body').evaluate((b) => b.classList.contains('mc-co-but')))
  // ── phím N mở; chạm ra ngoài (bảng đen) thu ──
  await phim('n'); await ngu(200)
  const moN = await theHien()
  await thay.mouse.click(Math.round(W * 0.35), Math.round(H * 0.4)); await ngu(250)
  kiem(`${N} · phím N mở thẻ; chạm ra ngoài thu`, moN && !(await theHien()))
  // ── chỉ có em giơ tay: dấu vòng, mục «2 em giơ tay» không có «Thu mic» ──
  await bom({ tay: TAY })
  const d2 = await dau()
  kiem(`${N} · chỉ có em giơ tay: dấu dạng vòng (data-noi = tay), thẻ không tự hiện`, d2.noi === 'tay' && d2.hien && !(await theHien()), d2.nhan)
  if (W === 1366) await chup('tay-khay-dong')
  // ── hết em: dải + dấu mất ──
  await bom({})
  const d3 = await dau()
  kiem(`${N} · hết em nói / giơ tay: dấu mất, dải rỗng`, !d3.hien && !d3.noi && await to.locator('#mc-khay .mc-khay-noi').evaluate((e) => e.hidden && !e.querySelector('button')))
  await ctx.close(); await may.dong()
}

kiem('Không lỗi JavaScript trên trang nào', loiTrang.length === 0, loiTrang.slice(0, 3).join(' | '))
const hong = ket.filter((x) => !x.dat)
writeFileSync(SO_DO, JSON.stringify({ luc: new Date().toISOString(), ghiChu: 'Chromium thật, tờ chiếu thật có cầu nối, phòng thật trong Node, dữ liệu giả (trạng thái «có em nói» bơm từ trang thử).', soDo, kiem: ket }, null, 2) + '\n')
console.log(`\n${ket.length - hong.length}/${ket.length} phép kiểm đạt`)
await trinh.close()
process.exit(hong.length ? 1 : 0)
