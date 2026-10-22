#!/usr/bin/env node
// CHỤP BẢN VẼ «HỒ SƠ HỌC SINH Ở BA GÓC NHÌN» — ĐỢT 2 Mức làm 6 mức (22/10) bằng Chromium THẬT (/opt/pw-browsers/chromium). Bước 2 quy trình 4 bước.
//   node scripts/chup-ban-ve-ho-so-em-2210.mjs            ⇒ chụp cả hai phần
//   node scripts/chup-ban-ve-ho-so-em-2210.mjs hien-trang ⇒ chỉ HIỆN TRẠNG (linh kiện thật qua vite dev, dữ liệu giả) → docs/ban-ve-ho-so-em-2210/hien-trang/
//   node scripts/chup-ban-ve-ho-so-em-2210.mjs ban-ve     ⇒ chỉ BẢN VẼ MỚI (HTML tĩnh ho-so-em.html, CSS thật của app) → docs/ban-ve-ho-so-em-2210/anh/
//   node scripts/chup-ban-ve-ho-so-em-2210.mjs that       ⇒ (bước 4) MÀN BUILD THẬT 6 mức (linh kiện thật, dữ liệu giả 6 mức) → docs/ban-ve-ho-so-em-2210/that-anh/
//     soát như bản vẽ (0 vấn đề, sai ⇒ mã thoát 1) + chip đầu tấm không chồng nút Đóng.
// Sáng/tối = colorScheme; reducedMotion; mọi yêu cầu ra ngoài 127.0.0.1 bị chặn. JPG tự hạ chất lượng tới ≤ 150 KB.
// SOÁT mỗi ảnh: lỗi trang · tràn ngang (bỏ chữ ẩn cho trình đọc) · đích chạm < 44 px · (bản vẽ) chữ < 12 px · tương phản chữ < 4,5:1 (chữ lớn < 3:1)
//   · (bản vẽ, app học sinh / phụ huynh) LỘ MỨC 6: chữ + title + aria-label không được chứa "Cố tình", "Mức làm 6", "co_tinh".
//   · (bản vẽ) CSS riêng của bản vẽ không có mã màu thô (ngoài @font-face).
// Hiện trạng chỉ BÁO (không chặn); bản vẽ mới phải 0 vấn đề, sai ⇒ mã thoát 1.
import { createServer as taoMayTinh } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const GOC = resolve(import.meta.dirname, '..')
const THU_MUC = join(GOC, 'docs/ban-ve-ho-so-em-2210')
const PHAN = process.argv[2] ?? 'ca-hai'
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })

// ------------------------------------------------------------ đo trong trang (dùng chung hai phần)
function doTrongTrang({ goc, kiemLo, kiemChu }) {
  const vung = document.querySelector(goc) ?? document.body
  const anChu = (e) => !!e.closest('.gvv2-an-chu, .sr-only')
  const tran = document.documentElement.scrollWidth > innerWidth + 1
    || [...vung.querySelectorAll('*')].some((e) => !anChu(e) && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().width > 1 && e.getBoundingClientRect().right > innerWidth + 1)
  const nho = [...vung.querySelectorAll('button, a[href], summary, [role="tab"], input, select')]
    .filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' && !anChu(e) && (r.height < 44 - 0.5 || r.width < 44 - 0.5) })
    .map((e) => `${(e.getAttribute('aria-label') || e.textContent || e.tagName).trim().slice(0, 24)}:${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`)
  let nhoChu = 0
  const tp = []
  if (kiemChu) {
    const doc = (c) => { let m = c.match(/^rgba?\(([^)]+)\)/); if (m) { const v = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [v[0], v[1], v[2], v[3] ?? 1] }
      m = c.match(/^color\(srgb ([^)]+)\)/); if (m) { const v = m[1].split(/[\s/]+/).filter(Boolean).map(Number); return [v[0] * 255, v[1] * 255, v[2] * 255, v[3] ?? 1] } return null }
    const tron = (tren, duoi) => [0, 1, 2].map((i) => tren[i] * tren[3] + duoi[i] * (1 - tren[3]))
    const nen = (e) => { const lop = []; for (let n = e; n; n = n.parentElement) { const c = doc(getComputedStyle(n).backgroundColor); if (c && c[3] > 0) { lop.push(c); if (c[3] >= 1) break } }
      return lop.reverse().reduce((d, c) => tron(c, d), [255, 255, 255]) }
    const sang = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
    for (const e of vung.querySelectorAll('*')) {
      if (anChu(e) || ![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue
      const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue
      const s = getComputedStyle(e)
      if (s.visibility === 'hidden' || Number(s.opacity) === 0) continue
      if (parseFloat(s.fontSize) < 12) nhoChu++
      const chu = doc(s.color); if (!chu) continue
      const b = nen(e), c = tron(chu, b), L1 = sang(c), L2 = sang(b), ti = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
      const lon = parseFloat(s.fontSize) >= 24 || (parseFloat(s.fontSize) >= 18.66 && Number(s.fontWeight) >= 700)
      if (ti < (lon ? 3 : 4.5)) tp.push(`${(e.textContent || '').trim().slice(0, 18)} ${ti.toFixed(2)}`)
    }
  }
  let lo = []
  if (kiemLo) {
    const chu = [document.body.innerText, ...[...document.querySelectorAll('[title],[aria-label]')].map((e) => `${e.getAttribute('title') ?? ''} ${e.getAttribute('aria-label') ?? ''}`)].join('\n')
    lo = ['Cố tình', 'cố tình', 'Mức làm 6', 'co_tinh', 'Mức 6'].filter((t) => chu.includes(t))
    if (document.querySelector('[data-m="6"], [data-t="6"]')) lo.push('phần tử mức 6')
  }
  return { tran, nho, nhoChu, tp: tp.slice(0, 5), lo }
}

async function luuAnh(t, duong, soat, ten, toanBo = false) {
  // Ảnh "toàn bộ" cao ⇒ cắt thành từng phần cao ≤ 1800 px (mỗi phần ≤ 150 KB mà chữ vẫn nét), tên ...-phan-1, -phan-2…
  if (toanBo) {
    const cao = await t.evaluate(() => document.documentElement.scrollHeight)
    const rong = t.viewportSize().width
    const so = Math.ceil(cao / 1800)
    for (let i = 0; i < so; i++) {
      const clip = { x: 0, y: i * 1800, width: rong, height: Math.min(1800, cao - i * 1800) }
      let q = 82, buf
      for (;;) { buf = await t.screenshot({ type: 'jpeg', quality: q, fullPage: true, clip }); if (buf.length <= 150_000 || q <= 34) break; q -= 6 }
      if (buf.length > 150_000) soat.push(`${ten}-phan-${i + 1}: ảnh ${Math.round(buf.length / 1024)} KB > 150 KB`)
      writeFileSync(duong.replace(/\.jpg$/, `-phan-${i + 1}.jpg`), buf)
      console.log(`${ten}-phan-${i + 1}.jpg ${Math.round(buf.length / 1024)} KB (q${q})`)
    }
    return
  }
  let q = 82, buf
  for (;;) { buf = await t.screenshot({ type: 'jpeg', quality: q }); if (buf.length <= 150_000 || q <= 34) break; q -= 6 }
  if (buf.length > 150_000) soat.push(`${ten}: ảnh ${Math.round(buf.length / 1024)} KB > 150 KB`)
  writeFileSync(duong, buf)
  console.log(`${ten}.jpg ${Math.round(buf.length / 1024)} KB (q${q})`)
}

// ------------------------------------------------------------ PHẦN 1 · HIỆN TRẠNG (linh kiện thật)
async function hienTrang() {
  const { createServer } = await import('vite')
  const react = (await import('@vitejs/plugin-react')).default
  const THAT = join(THU_MUC, 'that')
  const GIA = join(THAT, 'goi-lenh-thay-gia.ts')
  const THAT_GOI = resolve(GOC, 'src/lib/goi-lenh-thay.ts')
  const giaThay = {
    name: 'gia-thay-2210',
    enforce: 'pre',
    async resolveId(source, importer, opts) {
      if (!importer || importer.startsWith(THAT) || !/goi-lenh-thay/.test(source)) return null
      const r = await this.resolve(source, importer, { ...opts, skipSelf: true })
      return r && r.id === THAT_GOI ? GIA : null
    },
  }
  const vite = await createServer({
    configFile: false, root: GOC, logLevel: 'error', plugins: [giaThay, react()],
    define: { __PHIEN_BAN__: JSON.stringify('chup-ho-so-2210'), __SW_BUILT_AT__: 0 },
    server: { port: 0, host: '127.0.0.1', watch: null, hmr: false },
    // Quét phụ thuộc NGAY từ trang chụp (không chờ phát hiện giữa chừng ⇒ không nạp lại, không hai bản React).
    optimizeDeps: { entries: ['docs/ban-ve-ho-so-em-2210/that/trang.tsx'] },
  })
  await vite.listen()
  const goc = vite.resolvedUrls.local[0].replace(/\/$/, '')
  const RA = join(THU_MUC, 'hien-trang')
  mkdirSync(RA, { recursive: true })
  const soat = []
  // [tên, truy vấn, rộng, cao, tối?, cuộn tới (bộ chọn) | null]
  const KHUNG = []
  for (const [k, che] of [['thay', 'thay'], ['hs', 'hoc-sinh'], ['ph', 'phu-huynh']]) {
    KHUNG.push([`${k}-390-sang-dau`, `man=ho-so&che=${che}`, 390, 844, false, null])
    KHUNG.push([`${k}-390-sang-cach-lam`, `man=ho-so&che=${che}`, 390, 844, false, '.hslc-cl'])
    KHUNG.push([`${k}-390-toi-lich-su`, `man=ho-so&che=${che}`, 390, 844, true, 'ls'])
    KHUNG.push([`${k}-1440-sang-dau`, `man=ho-so&che=${che}`, 1440, 900, false, null])
    KHUNG.push([`${k}-1440-toi-cach-lam`, `man=ho-so&che=${che}`, 1440, 900, true, '.hslc-cl'])
  }
  KHUNG.push(['thay-toan-canh-390-sang', 'man=toan-canh', 390, 844, false, null])
  KHUNG.push(['thay-toan-canh-1440-sang', 'man=toan-canh', 1440, 900, false, null])
  KHUNG.push(['thay-toan-canh-1440-toi', 'man=toan-canh', 1440, 900, true, null])
  for (const [ten, qs, w, h, toi, cuon] of KHUNG) {
    const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: toi ? 'dark' : 'light', reducedMotion: 'reduce', locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', hasTouch: w < 900, isMobile: w < 500 })
    await ctx.route((u) => !u.href.startsWith('http://127.0.0.1'), (r) => r.abort())
    const t = await ctx.newPage()
    t.setDefaultTimeout(20000)
    t.on('pageerror', (e) => soat.push(`${ten}: lỗi trang ${e.message}`))
    await t.goto(`${goc}/docs/ban-ve-ho-so-em-2210/that/index.html?${qs}`)
    if (qs.includes('toan-canh')) await t.locator('.tc-luoi, .hn2-ghi-chu').first().waitFor()
    else await t.locator('.hslc-cl').first().waitFor()
    await t.evaluate(() => document.fonts.ready)
    if (cuon === 'ls') { await t.getByRole('tab', { name: /^Toàn bộ lịch sử/ }).click(); await t.waitForTimeout(150) }
    if (cuon) {
      await t.evaluate((s) => {
        const el = document.querySelector(s === 'ls' ? '.gvv2-hs-ls' : s)
        const than = el?.closest('.gvv2-hs-than')
        if (el && than) than.scrollTop += el.getBoundingClientRect().top - than.getBoundingClientRect().top - 12
      }, cuon)
    }
    await t.waitForTimeout(250)
    const kq = await t.evaluate(doTrongTrang, { goc: qs.includes('toan-canh') ? '.tc' : '.gvv2-hs', kiemLo: false, kiemChu: false })
    if (kq.tran) soat.push(`${ten}: TRÀN NGANG`)
    if (kq.nho.length) soat.push(`${ten}: đích chạm nhỏ ${[...new Set(kq.nho)].slice(0, 4).join(' | ')}`)
    // Dấu "minh hoạ" ngay trên ảnh (góc dưới trái, không che nội dung chính).
    await t.addStyleTag({ content: '#minh-hoa{position:fixed;left:8px;bottom:8px;z-index:99999;padding:4px 10px;border-radius:999px;font:700 12px/1.4 system-ui,sans-serif;background:var(--gvm-chu);color:var(--gvm-mat);opacity:.9;pointer-events:none}' })
    await t.evaluate(() => { const d = document.createElement('div'); d.id = 'minh-hoa'; d.textContent = 'HIỆN TRẠNG · số liệu minh hoạ'; document.body.append(d) })
    await luuAnh(t, join(RA, `${ten}.jpg`), soat, ten)
    await ctx.close()
  }
  await vite.close()
  console.log(soat.length ? `HIỆN TRẠNG (chỉ báo, không chặn): ${soat.length} vấn đề\n- ${soat.join('\n- ')}` : `HIỆN TRẠNG ${KHUNG.length} ảnh: 0 lỗi trang · 0 tràn ngang · 0 đích chạm nhỏ`)
}

// ------------------------------------------------------------ PHẦN 3 · MÀN BUILD THẬT 6 MỨC (bước 4 quy trình: so với bản vẽ đã duyệt)
async function manThat() {
  const { createServer } = await import('vite')
  const react = (await import('@vitejs/plugin-react')).default
  const vite = await createServer({
    configFile: false, root: GOC, logLevel: 'error', plugins: [react()],
    define: { __PHIEN_BAN__: JSON.stringify('chup-ho-so-2210'), __SW_BUILT_AT__: 0 },
    server: { port: 0, host: '127.0.0.1', watch: null, hmr: false },
    optimizeDeps: { entries: ['docs/ban-ve-ho-so-em-2210/that/trang.tsx'] },
  })
  await vite.listen()
  const goc = vite.resolvedUrls.local[0].replace(/\/$/, '')
  const RA = join(THU_MUC, 'that-anh')
  mkdirSync(RA, { recursive: true })
  const soat = []
  const KHO = [['390', 390, 844], ['844-ngang', 844, 390], ['1440', 1440, 900]]
  // [tên, che, trạng thái t, khổ, tối, cuộn tới lượt treo?]
  const CANH = []
  for (const [k, che] of [['thay', 'thay'], ['hs', 'hoc-sinh'], ['ph', 'phu-huynh']])
    for (const ki of [0, 1, 2]) for (const toi of [false, true]) CANH.push([`${k}-${KHO[ki][0]}-${toi ? 'toi' : 'sang'}`, che, 'dl', ki, toi, false])
  CANH.push(['thay-luot-treo-390-sang', 'thay', 'dl', 0, false, true], ['hs-luot-treo-390-toi', 'hoc-sinh', 'dl', 0, true, true], ['ph-luot-treo-390-sang', 'phu-huynh', 'dl', 0, false, true])
  CANH.push(['thay-dang-tai-390-sang', 'thay', 'tai', 0, false, false], ['hs-rong-390-toi', 'hoc-sinh', 'rong', 0, true, false], ['ph-loi-390-sang', 'phu-huynh', 'loi', 0, false, false])
  CANH.push(['thay-mat-mang-1440-toi', 'thay', 'mang', 2, true, false], ['thay-chua-do-treo-390-sang', 'thay', 'cu', 0, false, false], ['thay-chua-do-treo-1440-sang', 'thay', 'cu', 2, false, false])
  for (const [ten, che, tt, ki, toi, cuonTreo] of CANH) {
    const [, w, h] = KHO[ki]
    const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w > 1000 ? 1 : 2, colorScheme: toi ? 'dark' : 'light', reducedMotion: 'reduce', locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', hasTouch: w < 900, isMobile: w < 500 })
    await ctx.route((u) => !u.href.startsWith('http://127.0.0.1'), (r) => r.abort())
    const t = await ctx.newPage()
    t.setDefaultTimeout(20000)
    t.on('pageerror', (e) => soat.push(`${ten}: lỗi trang ${e.message}`))
    await t.goto(`${goc}/docs/ban-ve-ho-so-em-2210/that/index.html?man=ho-so&che=${che}&du=6muc&t=${tt}`)
    await t.locator(tt === 'tai' ? '.hsv-xuong' : tt === 'loi' ? '.hsv-loi' : tt === 'rong' ? '.hsv-trong' : tt === 'mang' ? '.hsv-mang' : '#hsv-lan').first().waitFor()
    await t.evaluate(() => document.fonts.ready)
    await t.waitForTimeout(300)
    if (cuonTreo) {
      await t.evaluate(() => {
        const el = document.querySelector('.hslc-lan[data-treo]')
        const than = el?.closest('.gvv2-hs-than')
        if (el && than) than.scrollTop += el.getBoundingClientRect().top - than.getBoundingClientRect().top - 80
      })
      await t.waitForTimeout(150)
    }
    const kq = await t.evaluate(doTrongTrang, { goc: '.gvv2-hs', kiemLo: che !== 'thay', kiemChu: true })
    // chip đầu tấm (thầy) không chồng nút Đóng
    const chong = await t.evaluate(() => {
      const d = document.querySelector('.gvv2-hs-dong')?.getBoundingClientRect()
      if (!d) return []
      return [...document.querySelectorAll('.hsv-chip-dau')].filter((c) => { const r = c.getBoundingClientRect(); return r.left < d.right && r.right > d.left && r.top < d.bottom && r.bottom > d.top }).map((c) => c.textContent)
    })
    if (kq.tran) soat.push(`${ten}: TRÀN NGANG`)
    if (kq.nho.length) soat.push(`${ten}: đích chạm nhỏ ${[...new Set(kq.nho)].slice(0, 4).join(' | ')}`)
    if (kq.nhoChu) soat.push(`${ten}: ${kq.nhoChu} chữ < 12 px`)
    if (kq.tp.length) soat.push(`${ten}: tương phản thấp ${kq.tp.join(' | ')}`)
    if (kq.lo.length) soat.push(`${ten}: LỘ MỨC 6 ở app học sinh/phụ huynh: ${kq.lo.join(', ')}`)
    if (chong.length) soat.push(`${ten}: chip đầu tấm chồng nút Đóng: ${chong.join(' | ')}`)
    await t.addStyleTag({ content: '#minh-hoa{position:fixed;left:8px;bottom:8px;z-index:99999;padding:4px 10px;border-radius:999px;font:700 12px/1.4 system-ui,sans-serif;background:var(--gvm-chu);color:var(--gvm-mat);opacity:.9;pointer-events:none}' })
    await t.evaluate(() => { const d = document.createElement('div'); d.id = 'minh-hoa'; d.textContent = 'MÀN THẬT · số liệu minh hoạ'; document.body.append(d) })
    await luuAnh(t, join(RA, `${ten}.jpg`), soat, ten)
    await ctx.close()
  }
  await vite.close()
  console.log(soat.length ? `MÀN THẬT: ${soat.length} vấn đề\n- ${soat.join('\n- ')}` : `MÀN THẬT ${CANH.length} ảnh: 0 lỗi trang · 0 tràn ngang · 0 đích chạm < 44 px · 0 chữ < 12 px · 0 tương phản thấp · 0 lộ Mức 6 ở app học sinh/phụ huynh · 0 chip chồng nút Đóng`)
  return soat.length
}

// ------------------------------------------------------------ PHẦN 2 · BẢN VẼ MỚI (HTML tĩnh, CSS thật)
async function banVe() {
  const LOAI = { '.html': 'text/html; charset=utf-8', '.woff2': 'font/woff2', '.css': 'text/css', '.svg': 'image/svg+xml' }
  const may = taoMayTinh((req, res) => {
    const p = join(GOC, decodeURIComponent(new URL(req.url, 'http://x').pathname))
    if (!p.startsWith(GOC) || !existsSync(p) || !statSync(p).isFile()) { res.writeHead(404); res.end(); return }
    res.writeHead(200, { 'content-type': LOAI[extname(p)] ?? 'application/octet-stream' }); res.end(readFileSync(p))
  }).listen(0)
  await new Promise((r) => may.once('listening', r))
  const URL_VE = `http://127.0.0.1:${may.address().port}/docs/ban-ve-ho-so-em-2210/ho-so-em.html`
  const RA = join(THU_MUC, 'anh')
  mkdirSync(RA, { recursive: true })
  const soat = []
  // CSS riêng của bản vẽ: không mã màu thô (ngoài @font-face).
  const html = readFileSync(join(THU_MUC, 'ho-so-em.html'), 'utf8')
  const css = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n').replace(/@font-face\{[^}]*\}/g, '')
  const tho = css.match(/#[0-9a-fA-F]{3,8}\b|\brgba?\(\s*\d/g)
  if (tho) soat.push(`CSS bản vẽ có màu thô: ${[...new Set(tho)].slice(0, 5).join(', ')}`)
  const KHO = [['390', 390, 844], ['844-ngang', 844, 390], ['1440', 1440, 900]]
  // [tên, truy vấn, khổ (chỉ số KHO) | null = cả ba, tối: null = cả hai, toàn bộ?]
  const CANH = [
    ['thay', 'app=thay', null, null, false],
    ['thay-toan-bo', 'app=thay', [0], [false, true], true],
    ['hs', 'app=hs', null, null, false],
    ['hs-toan-bo', 'app=hs', [0], [false, true], true],
    ['ph', 'app=ph', null, null, false],
    ['ph-toan-bo', 'app=ph', [0], [false, true], true],
    ['thay-luot-treo', 'app=thay&mo=luot', [0, 2], [false, true], false],
    ['hs-luot-treo', 'app=hs&mo=luot', [0], [false, true], false],
    ['thay-dang-tai', 'app=thay&t=tai', [0], [false], false],
    ['hs-rong', 'app=hs&t=rong', [0], [true], false],
    ['ph-loi', 'app=ph&t=loi', [0], [false], false],
    ['thay-mat-mang', 'app=thay&t=mang', [2], [true], false],
    ['thay-chua-do-treo', 'app=thay&t=cu', [0, 2], [false], false],
  ]
  let soAnh = 0
  for (const [ten0, qs, khoChon, toiChon, toanBo] of CANH) {
    for (const ki of khoChon ?? [0, 1, 2]) {
      for (const toi of toiChon ?? [false, true]) {
        const [kten, w, h] = KHO[ki]
        const ten = `${ten0}-${kten}-${toi ? 'toi' : 'sang'}`
        const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w > 1000 ? 1 : toanBo ? 1 : 2, colorScheme: toi ? 'dark' : 'light', reducedMotion: 'reduce', locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', hasTouch: w < 900, isMobile: w < 500 })
        await ctx.route((u) => !u.href.startsWith('http://127.0.0.1'), (r) => r.abort())
        const t = await ctx.newPage()
        t.on('pageerror', (e) => soat.push(`${ten}: lỗi trang ${e.message}`))
        t.on('response', (r) => { if (r.status() >= 400) soat.push(`${ten}: ${r.status()} ${r.url()}`) })
        await t.goto(`${URL_VE}?${qs}${toanBo ? '&toan=1' : ''}`)
        await t.evaluate(() => document.fonts.ready)
        await t.waitForTimeout(200)
        if (qs.includes('mo=luot')) await t.evaluate(() => document.querySelector('[data-treo]')?.scrollIntoView({ block: 'center' }))
        const kq = await t.evaluate(doTrongTrang, { goc: '.hsv', kiemLo: /app=(hs|ph)/.test(qs), kiemChu: true })
        if (kq.tran) soat.push(`${ten}: TRÀN NGANG`)
        if (kq.nho.length) soat.push(`${ten}: đích chạm nhỏ ${[...new Set(kq.nho)].slice(0, 4).join(' | ')}`)
        if (kq.nhoChu) soat.push(`${ten}: ${kq.nhoChu} chữ < 12 px`)
        if (kq.tp.length) soat.push(`${ten}: tương phản thấp ${kq.tp.join(' | ')}`)
        if (kq.lo.length) soat.push(`${ten}: LỘ MỨC 6 ở app học sinh/phụ huynh: ${kq.lo.join(', ')}`)
        await luuAnh(t, join(RA, `${ten}.jpg`), soat, ten, toanBo)
        soAnh++
        await ctx.close()
      }
    }
  }
  may.close()
  console.log(soat.length ? `BẢN VẼ: ${soat.length} vấn đề\n- ${soat.join('\n- ')}` : `BẢN VẼ ${soAnh} ảnh: 0 lỗi trang · 0 tràn ngang · 0 đích chạm < 44 px · 0 chữ < 12 px · 0 tương phản thấp · 0 lộ Mức 6 ở app học sinh/phụ huynh · 0 màu thô`)
  return soat.length
}

let loi = 0
if (PHAN === 'that') loi = await manThat()
else {
  if (PHAN !== 'ban-ve') await hienTrang()
  if (PHAN !== 'hien-trang') loi = await banVe()
}
await trinh.close()
process.exit(loi ? 1 : 0)
