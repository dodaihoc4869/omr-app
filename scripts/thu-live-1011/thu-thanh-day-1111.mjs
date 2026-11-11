#!/usr/bin/env node
// BỘ THỬ THANH ĐÁY GỌN CỦA MÀN CHIẾU (thầy 11/11: «Phần nút ở dưới chưa gọn, làm cho gọn lại tinh tế đẹp»). Chromium THẬT, tờ chiếu THẬT có cầu nối
// (trang thử ?vai=thay&noi=1) + phòng THẬT chạy trong Node (may-chu.mjs). Dữ liệu giả, không chạm máy chủ thật.
//   npx vite build --config scripts/thu-live-1011/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/thu-live-1011/thu-thanh-day-1111.mjs <thư mục tạm> [thư mục ảnh = docs/ban-ve-live-1011] [tệp số đo = docs/ban-ve-live-1011/so-do-thanh-day-1111.json]
// Mỗi khổ (1024 iPad đời cũ · 1180 iPad ngang · 1224 khung của ảnh thầy gửi · 1280 · 1366 · 1920) đi đủ: chưa live (khay đóng / xoè) ⇒ chọn bằng khay, phím tắt lúc khay đóng,
// Esc / bấm ra ngoài ⇒ thu ⇒ bút bật (chấm trên nút «thêm») ⇒ gọi em lên bảng (thanh có «Đạt» / «Không đạt») ⇒ bật live (khay đóng / xoè) ⇒ viên Live
// RỘNG NHẤT (đủ ngăn xem · nghe · mic · đang ghi) cùng lúc với «Đạt» / «Không đạt». Ở MỌI trạng thái: không nút nào tràn mép thanh, không nút nào đè nhau
// (thanh chật thì tờ tự gọn dần — «mức gọn» 0 → 4 ghi trong tệp số đo).
// Ảnh: that-3-thanh-<trạng thái>-<khổ>.jpg (JPG ≤ 150 KB) cho ba khổ 1180 / 1366 / 1920.
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { moMayChu } from './may-chu.mjs'

const GOC = resolve(import.meta.dirname, '../..')
const DIST = resolve(process.argv[2] ?? 'dist-thu-live')
const ANH = resolve(process.argv[3] ?? join(GOC, 'docs/ban-ve-live-1011'))
const SO_DO = resolve(process.argv[4] ?? join(ANH, 'so-do-thanh-day-1111.json'))
mkdirSync(ANH, { recursive: true })
const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
const ket = [], loiTrang = [], soDo = {}
const kiem = (ten, dat, them = '') => { ket.push({ ten, dat: !!dat, them }); console.log(`${dat ? '✓' : '✗'} ${ten}${them ? ' — ' + them : ''}`) }

const KHO = [[1024, 768, false], [1180, 820, true], [1224, 875, false], [1280, 720, false], [1366, 768, true], [1920, 1080, true]]
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })

/** Mọi thứ ĐANG HIỆN trên thanh (con trực tiếp + nút theo ngữ cảnh của nhóm phím; không tính khay): có tràn mép trong của thanh không, có đè nhau không. */
const doThanh = (to) => to.locator('#mc-thanh').evaluate((thanh) => {
  const R = thanh.getBoundingClientRect(), cs = getComputedStyle(thanh)
  const trai = R.left + parseFloat(cs.paddingLeft) - 0.6, phai = R.right - parseFloat(cs.paddingRight) + 0.6
  const hien = (e) => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0.5 && r.height > 0.5 && s.visibility !== 'hidden' && s.display !== 'none' }
  const ten = (e) => (e.id ? '#' + e.id : e.getAttribute('data-k') ? '[' + e.getAttribute('data-k') + ']' : '.' + String(e.className).split(' ')[0]) + ' «' + (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 18) + '»'
  const ds = [...thanh.children].flatMap((e) => (e.id === 'mc-phim-nhom' ? [...e.children].filter((x) => !x.classList.contains('mc-khay')) : [e])).filter(hien)
  const o = ds.map((e) => { const r = e.getBoundingClientRect(); return { ten: ten(e), l: r.left, r: r.right, t: r.top, b: r.bottom, h: r.height } }).sort((a, b) => a.l - b.l)
  const tran = o.filter((x) => x.l < trai || x.r > phai || x.t < R.top - 0.6 || x.b > R.bottom + 0.6).map((x) => `${x.ten} ${Math.round(x.l)}–${Math.round(x.r)}`)
  const chong = []
  for (let i = 1; i < o.length; i++) if (o[i].l < o[i - 1].r - 0.6) chong.push(`${o[i - 1].ten} ⟂ ${o[i].ten}`)
  const them = document.getElementById('mc-them').getBoundingClientRect()
  return { n: o.length, ds: o.map((x) => x.ten), tran, chong, cuon: thanh.scrollWidth - thanh.clientWidth, du: Math.round(phai - Math.max(...o.filter((x) => !x.ten.startsWith('#mc-them')).map((x) => x.r))), them: Math.round(Math.min(them.width, them.height)), rong: Math.round(R.width), gon: thanh.getAttribute('data-gon') || '0' }
})
/** Khay đang xoè: nằm trọn trong khung nhìn, mọi dòng ≥ 40 px, có NHÃN CHỮ nhìn thấy + phím tắt, tên nhóm. */
const doKhay = (to) => to.locator('#mc-khay').evaluate((khay) => {
  const R = khay.getBoundingClientRect(), s = getComputedStyle(khay)
  const dong = [...khay.querySelectorAll('button')].filter((b) => b.getClientRects().length > 0).map((b) => {
    const c = b.querySelector('.mc-nut-chu'), k = b.querySelector('kbd'), r = b.getBoundingClientRect()
    return { nhan: (c ? (getComputedStyle(c).display === 'none' ? '' : c.textContent) : b.textContent || '').trim(), phim: k ? (k.textContent || '').trim() : '', cao: Math.round(r.height), bat: b.classList.contains('mc-bat'), trong: r.left >= R.left && r.right <= R.right + 0.6 && r.top >= R.top && r.bottom <= R.bottom + 0.6 }
  })
  return { hien: s.visibility === 'visible' && +s.opacity > 0.99, trongMan: R.left >= 0 && R.top >= 0 && R.right <= innerWidth + 0.6 && R.bottom <= innerHeight + 0.6, w: Math.round(R.width), h: Math.round(R.height),
    nhom: [...khay.querySelectorAll('.mc-khay-nhom')].filter((g) => !g.hidden).map((g) => g.querySelector('.mc-khay-ten').textContent), dong, giay: s.transitionDuration, thuoc: s.transitionProperty }
})

for (const [W, H, coAnh] of KHO) {
  const may = await moMayChu({ dist: DIST })
  const ctx = await trinh.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, permissions: ['microphone'], hasTouch: W < 1300 })
  await ctx.route((u) => !u.href.startsWith(may.goc), (r) => r.abort())
  const thay = await ctx.newPage()
  thay.on('pageerror', (e) => loiTrang.push(`${W}: ${e.message}`))
  const chup = async (ten) => {
    if (!coAnh) return
    let q = 84, buf
    do { buf = await thay.screenshot({ type: 'jpeg', quality: q }); q -= 6 } while (buf.length > 150 * 1024 && q > 30)
    writeFileSync(join(ANH, `that-3-thanh-${ten}-${W}.jpg`), buf)
    console.log(`  ảnh that-3-thanh-${ten}-${W}.jpg ${Math.round(buf.length / 1024)} KB`)
  }
  const to = thay.frameLocator('iframe')
  const guiTo = (tin) => thay.evaluate((m) => document.querySelector('iframe').contentWindow.postMessage(m, '*'), tin)
  const N = `${W}×${H}`
  const kiemThanh = async (nhan) => {
    const d = await doThanh(to)
    soDo[`${W}_${nhan}`] = { soNut: d.n, duPhai_px: d.du, mucGon: d.gon, nut: d.ds }
    kiem(`${N} · ${nhan}: không nút nào tràn mép thanh, không đè nhau, thanh không phải cuộn`, d.tran.length === 0 && d.chong.length === 0 && d.cuon <= 0 && d.them >= 40, `${d.n} thứ trên thanh, còn dư ${d.du} px, mức gọn ${d.gon}${d.tran.length ? ' · TRÀN: ' + d.tran.join('; ') : ''}${d.chong.length ? ' · ĐÈ: ' + d.chong.join('; ') : ''}`)
    return d
  }
  const phim = (k) => to.locator('body').press(k)
  const moKhay = async () => { await to.locator('#mc-them').click(); await ngu(260) }
  const dangMo = () => to.locator('body').evaluate((b) => b.classList.contains('mc-khay-mo'))

  await thay.goto(`${may.goc}/scripts/thu-live-1011/trang.html?vai=thay&noi=1`)
  await to.locator('body[data-bo-cuc="xong"]').waitFor({ timeout: 20000 })
  await to.locator('.mc-lv-nut').waitFor({ state: 'visible', timeout: 15000 })
  await guiTo({ type: 'ddh-mc-ket-noi', maPhien: 'thu1111' })
  await to.locator('body.mc-noi').waitFor({ timeout: 6000 })
  await ngu(500)

  // ── CHƯA LIVE · khay đóng ──
  const a = await kiemThanh('chưa live, chờ thầy gọi')
  kiem(`${N} · chưa live: trên thanh chỉ còn Live · đợt · trạng thái · «Lên bảng» · nút theo ngữ cảnh · nút «thêm»`, a.ds.some((x) => x.startsWith('.mc-lv-nut')) && a.ds.some((x) => x.includes('Lên bảng')) && a.ds[a.ds.length - 1].startsWith('#mc-them') && !a.ds.some((x) => /^\[(G|X|T|B|P|Tab|\?)\]/.test(x) || x.startsWith('#mc-cai-btn')), a.ds.join(' · '))
  await chup('chua-live-dong')
  // ── khay xoè ──
  await moKhay()
  let k = await doKhay(to)
  soDo[`${W}_khay`] = { rong: k.w, cao: k.h, dong: k.dong.map((d) => `${d.nhan}${d.phim ? ' [' + d.phim + ']' : ''} ${d.cao}px`) }
  const nhanCan = ['Giải', 'Ai sai', 'Thống kê', 'Bình Phản Ứng', 'Bút', 'Tổng quan', 'Phím tắt', 'Cài đặt']
  kiem(`${N} · khay xoè: nằm trọn trong màn, ba nhóm có tên, đủ ${nhanCan.length} nút kèm NHÃN CHỮ + phím tắt, mỗi dòng ≥ 40 px`,
    k.hien && k.trongMan && k.nhom.join('|') === 'Câu này|Lớp và bảng|Màn chiếu' && nhanCan.every((n) => k.dong.some((d) => d.nhan === n)) && k.dong.every((d) => d.cao >= 40 && d.trong && (d.phim || d.nhan === 'Cài đặt')),
    `${k.w}×${k.h} px · ${k.dong.map((d) => d.nhan + (d.phim ? '[' + d.phim + ']' : '')).join(', ')}`)
  const giay = Math.max(...k.giay.split(',').map((x) => parseFloat(x)))
  kiem(`${N} · chuyển động xoè / thu ≤ 160 ms, chỉ opacity / transform (visibility lật tức thì)`, giay <= 0.16 && k.thuoc.split(',').every((x) => /opacity|transform|visibility/.test(x)), `${k.giay} · ${k.thuoc}`)
  kiem(`${N} · nút «thêm»: aria-expanded = true khi khay xoè, có aria-label`, await to.locator('#mc-them').evaluate((e) => e.getAttribute('aria-expanded') === 'true' && (e.getAttribute('aria-label') || '').startsWith('Thêm nút điều khiển') && e.getAttribute('aria-controls') === 'mc-khay'))
  await chup('chua-live-xoe')
  // ── thu khay: Esc · bấm ra ngoài · chọn xong ──
  await phim('Escape'); await ngu(220)
  kiem(`${N} · Esc ⇒ khay thu`, !(await dangMo()) && await to.locator('#mc-khay').evaluate((e) => getComputedStyle(e).visibility === 'hidden'))
  await moKhay(); await thay.mouse.click(Math.round(W * 0.3), Math.round(H * 0.4)); await ngu(220)
  kiem(`${N} · chạm ra ngoài ⇒ khay thu`, !(await dangMo()))
  await moKhay(); await to.locator('#mc-khay [data-k="G"]').click(); await ngu(260)
  kiem(`${N} · chọn «Giải» trong khay ⇒ lời giải mở, khay tự thu, nút «thêm» có chấm «đang bật: Lời giải»`, !(await dangMo()) && await to.locator('body').evaluate(() => window.__mcLgMo()) && await to.locator('#mc-them').evaluate((e) => e.getAttribute('data-bat') === '1' && /đang bật: Lời giải/.test(e.getAttribute('aria-label')) && getComputedStyle(e, '::after').display === 'block'))
  // ── phím tắt lúc khay đóng ──
  await phim('g'); await ngu(150)
  kiem(`${N} · khay đóng: phím G vẫn đóng lời giải, chấm trên nút «thêm» tắt`, !(await to.locator('body').evaluate(() => window.__mcLgMo())) && await to.locator('#mc-them').evaluate((e) => !e.hasAttribute('data-bat')))
  await phim('Tab'); await ngu(150)
  const luoiMo = await to.locator('.mc-phu-lop.mc-mo').count()
  await phim('Tab'); await ngu(120)
  kiem(`${N} · khay đóng: phím Tab vẫn mở / đóng «Tổng quan»`, luoiMo === 1 && await to.locator('.mc-phu-lop.mc-mo').count() === 0)
  // ── bút bật ──
  await phim('b'); await ngu(450)
  kiem(`${N} · phím B bật bút ⇒ nút «thêm» có chấm «đang bật: Bút»`, await to.locator('body').evaluate((b) => b.classList.contains('mc-co-but')) && await to.locator('#mc-them').evaluate((e) => e.getAttribute('data-bat') === '1' && /đang bật: Bút/.test(e.getAttribute('aria-label'))))
  await kiemThanh('chưa live, bút đang bật')
  await chup('but-bat')
  if (W === 1366) { await moKhay(); k = await doKhay(to); kiem(`${N} · bút bật: dòng «Bút» trong khay tô đặc`, k.dong.some((d) => d.nhan === 'Bút' && d.bat)); await chup('but-bat-xoe'); await phim('Escape'); await ngu(200) }
  await phim('b'); await ngu(250)
  // ── gọi em lên bảng: thanh có «Đạt» / «Không đạt» ──
  await to.locator('#mc-len-bang').click()
  await to.locator('#mc-phim-nhom > [data-k="D"]').waitFor({ state: 'visible', timeout: 15000 })
  await ngu(700)
  await kiemThanh('chưa live, đang chữa (Đạt / Không đạt)')
  if (W === 1366) await chup('dang-chua')

  // ── BẬT LIVE (ở đợt 2: chờ thầy gọi) ──
  await phim('ArrowRight'); await ngu(900)
  await to.locator('.mc-lv-nut').click()
  await to.locator('.mc-lv-the').waitFor({ state: 'visible', timeout: 8000 })
  await ngu(400)
  await to.locator('.mc-lv-the [data-lv="bat-dau"]').click().catch(() => to.locator('.mc-lv-the [data-lv="khong-tieng"]').click())
  await to.locator('.mc-lv-cum b#mc-lv-dh').waitFor({ timeout: 10000 })
  await ngu(700)
  const b = await kiemThanh('đang live, chờ thầy gọi')
  kiem(`${N} · đang live: CÙNG một thanh — viên Live · đợt · trạng thái · «Lên bảng» · nút «thêm» ở mép phải (không còn hai kiểu thanh)`, b.ds.some((x) => x.startsWith('.mc-lv-cum')) && b.ds.some((x) => x.includes('Lên bảng')) && b.ds[b.ds.length - 1].startsWith('#mc-them') && await to.locator('.mc-lv-gon').count() === 1, b.ds.join(' · '))
  await chup('live-dong')
  await moKhay()
  k = await doKhay(to)
  kiem(`${N} · đang live: khay xoè y như lúc chưa live (cùng nhóm, cùng nút), dòng «Bút» tô đặc vì live bật bút sẵn`, k.hien && k.trongMan && k.nhom.length === 3 && nhanCan.every((n) => k.dong.some((d) => d.nhan === n)) && k.dong.some((d) => d.nhan === 'Bút' && d.bat))
  await chup('live-xoe')
  await phim('Escape'); await ngu(220)
  // ── xấu nhất: viên Live đủ ngăn (xem · nghe · mic · đang ghi) + đợt đang chữa có «Đạt» / «Không đạt» ──
  await to.locator('#mc-len-bang').click()
  await to.locator('#mc-phim-nhom > [data-k="D"]').waitFor({ state: 'visible', timeout: 15000 })
  await ngu(700)
  await guiTo({ nguon: 'bpu-bang', lenh: 'live-tt', tt: { co: true, pha: 'live', tu: Date.now() - 3_725_000, xem: 38, tong: 40, lop: '12A1', coTieng: true, khongTieng: false, micIm: false, noiLai: false, mayKhac: false, bang: true, noi: [], ngheEm: false, chuaGui: 0, the: null, roi: [], tay: [], moi: null, micLoi: '', nghi: false, dot2: true, nghe: 36, ghi: 'dang-ghi' } })
  await ngu(350)
  await kiemThanh('đang live, viên Live đủ ngăn + đang chữa (xấu nhất)')
  if (W !== 1920) await chup('live-day-nhat')
  await ctx.close(); await may.dong()
}

kiem('Không lỗi JavaScript trên trang nào', loiTrang.length === 0, loiTrang.slice(0, 3).join(' | '))
const hong = ket.filter((x) => !x.dat)
writeFileSync(SO_DO, JSON.stringify({ luc: new Date().toISOString(), ghiChu: 'Chromium thật, tờ chiếu thật có cầu nối, phòng thật trong Node, dữ liệu giả. Khổ 1224×875 = khung của ảnh thầy gửi 11/11.', soDo, kiem: ket }, null, 2) + '\n')
console.log(`\n${ket.length - hong.length}/${ket.length} phép kiểm đạt`)
await trinh.close()
process.exit(hong.length ? 1 : 0)
