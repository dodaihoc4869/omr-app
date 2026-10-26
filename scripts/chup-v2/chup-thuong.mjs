#!/usr/bin/env node
// ═══ THƯỞNG PHẠT 26/10 — CHỤP + ĐO giao diện học sinh hệ thưởng phạt (cảnh `?man=tp&v=…` của trang.tsx, khối gia/thuong.tsx) bằng Chromium THẬT.
//   npx vite build --config scripts/chup-v2/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-v2/chup-thuong.mjs <thư mục tạm> <thư mục ảnh> [cảnh1,cảnh2…] [--cham]
// Mỗi cảnh × 3 khổ (390×844 dọc · 844×390 ngang · 1440×900 máy tính) × sáng/tối. Đo HAI lúc: GIỮA hiệu ứng (≈450 ms và ≈1100 ms sau khi hiện) và
// SAU hiệu ứng (2,8 s): tràn ngang (trang + trong màn phủ) · chồng chữ (khối chữ khác nhau đè nhau) · đích bấm < 44 px. Ảnh JPG ≤ 150 KB (lúc cuối;
// cảnh có hiệu ứng lớn lưu thêm ảnh «-giua»). `--cham` = CPU chậm 4× (đo tỉ lệ khung rơi trong 2 s đầu, ngưỡng < 20%). Thoát mã 1 nếu có lỗi.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.argv[2] ?? 'dist-chup-v2')
const RA = resolve(process.argv[3] ?? 'anh-thuong')
const CHON = (process.argv[4] && !process.argv[4].startsWith('--') ? process.argv[4] : '').split(',').filter(Boolean)
const CHAM = process.argv.includes('--cham')
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const PUB = resolve(import.meta.dirname, '../../public')
const may = createServer((req, res) => {
  const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = join(DIST, duong), pub = join(PUB, duong)
  const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-v2/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' })
  res.end(readFileSync(tep))
}).listen(0)
const trangGoc = `http://127.0.0.1:${may.address().port}/scripts/chup-v2/trang.html`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const trinh = await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })

// [cảnh, chữ chờ, lưu ảnh giữa hiệu ứng?]
const CANH = [
  ['tren', /Lộ trình hôm nay/], ['tat', /Lộ trình hôm nay/], ['cau-dung', /Chính xác!/, 1], ['cau-day', /Phản ứng dây chuyền/, 1], ['cau-kho', /Câu khó/], ['khong-tinh', /chưa được tính/, 1],
  ['ket', /Xong bài!/, 1], ['ket-hh', /Hoàn hảo!/, 1], ['chuoi', /ngày liền/, 1], ['cuu', /vừa tắt/], ['cuu-xong', /sống lại/, 1], ['giai', /Luật giải tuần/, 1],
  ['cuoi-len', /Lên Giải Vàng/, 1], ['cuoi-giu', /Giữ Giải Bạc/], ['cuoi-roi', /Xuống Giải Đồng/, 1], ['nv', /Nhiệm vụ hôm nay/], ['nv-mo', /Rương đã mở/, 1], ['cua-hang', /Cách kiếm tinh thể/],
  ['thang-hoa', /đã thăng hoa/, 1], ['kc-moi', /Thử thách Kim cương/, 1], ['kc-lam', /Câu 7\/10/], ['kc-truot', /Chưa qua lần này/], ['kc-dat', /Đạt Kim cương/, 1], ['huy-hieu', /Bài hoàn hảo/],
  ['ban', /Luật học cùng/, 1], ['moi-ban', /Nguyễn Thu Hà/], ['loi-moi', /mời em học cùng/], ['moc-doi', /Chuỗi đôi 7 ngày/, 1], ['binh', /bình giữ chuỗi đã đỡ/, 1], ['phep', /vắng có phép/],
  ['moc-chuoi', /Chuỗi 7 ngày!/, 1], ['cuoc-thua', /chưa thành/, 1], ['go-cua', /gõ cửa/],
]
const KHO = [[390, 844, 'doc'], [844, 390, 'ngang'], [1440, 900, 'may-tinh']]
const loi = [], tran = [], chong = [], nho = [], khung = []

/** Đo trong trang: tràn ngang, chồng chữ, đích bấm nhỏ. */
const DO = () => {
  const ra = { tran: 0, tranTrong: 0, chong: [], nho: [] }
  ra.tran = document.documentElement.scrollWidth - document.documentElement.clientWidth
  ra.thu = []
  for (const t of document.querySelectorAll('.tp-toan, .tp-vo, .tp-man, .duo-than')) {
    const d = t.scrollWidth - t.clientWidth
    if (d > ra.tranTrong) { ra.tranTrong = d; const r = t.getBoundingClientRect(); ra.thu = [...t.querySelectorAll('*')].filter((e) => e.getBoundingClientRect().right > r.right + 1 || e.getBoundingClientRect().left < r.left - 1).slice(0, 3).map((e) => `${e.tagName}.${String(e.className?.baseVal ?? e.className).slice(0, 30)}`) }
  }
  const hien = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) { const s = getComputedStyle(e); if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) < 0.05) return false } return true }
  const BO = '.tp-lop, .tp-lat-cu, .tp-bay-so, .tp-an'
  const LOP = '.tp-day, .duo-day, .da-tren, .tp-toan-tren, .tp-toast'
  const khoi = []
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const el = n.parentElement
    if (!n.textContent.trim() || !el || el.closest(BO) || el.closest('svg') || !hien(el)) continue
    const r = document.createRange(); r.selectNodeContents(n)
    for (const q of r.getClientRects()) if (q.width > 1 && q.height > 1 && q.bottom > 0 && q.top < innerHeight * 3) khoi.push({ el, q, lop: el.closest(LOP), chu: n.textContent.trim().slice(0, 24) })
  }
  for (let i = 0; i < khoi.length; i++) for (let j = i + 1; j < khoi.length; j++) {
    const a = khoi[i], b = khoi[j]
    if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el) || a.lop !== b.lop) continue
    const x = Math.min(a.q.right, b.q.right) - Math.max(a.q.left, b.q.left), y = Math.min(a.q.bottom, b.q.bottom) - Math.max(a.q.top, b.q.top)
    if (!(x > 2 && y > 3)) continue
    // bị CHE (hàng đặc nằm trên, vd. hàng của em trượt qua trong FLIP) thì không phải chồng chữ: xét chồng phần tử tại tâm vùng giao
    const cx = Math.max(a.q.left, b.q.left) + x / 2, cy = Math.max(a.q.top, b.q.top) + y / 2
    const st = document.elementsFromPoint(cx, cy), ia = st.indexOf(a.el), ib = st.indexOf(b.el)
    const tren = Math.min(ia < 0 ? 1e9 : ia, ib < 0 ? 1e9 : ib), duoi = Math.max(ia, ib), thap = duoi === ia ? a.el : b.el
    // nền đặc: rgb()/rgba() hoặc color(srgb r g b [/ a]) — màu trộn `color-mix(…)` (vd. hàng của em ở Giải tuần) trình duyệt trả dạng color(srgb …)
    const dac = (e) => {
      const c = getComputedStyle(e).backgroundColor
      const m = /rgba?\(([^)]+)\)/.exec(c)
      if (m) { const p = m[1].split(',').map(Number); return (p[3] ?? 1) >= 0.99 }
      const k = /color\(srgb\s+[\d.e-]+\s+[\d.e-]+\s+[\d.e-]+(?:\s*\/\s*([\d.e-]+))?\)/.exec(c)
      return !!k && Number(k[1] ?? 1) >= 0.99
    }
    if (ia < 0 || ib < 0 || st.slice(tren + 1, duoi).some((e) => !e.contains(thap) && dac(e))) continue
    if (x > 2 && y > 3) ra.chong.push(`«${a.chu}» × «${b.chu}» (${Math.round(x)}×${Math.round(y)})`)
  }
  for (const e of document.querySelectorAll('button, a[href], [role="button"], input:not([type="hidden"])')) {
    const q = e.getBoundingClientRect()
    if (q.width > 0 && q.height > 0 && hien(e) && (q.width < 44 || q.height < 44)) ra.nho.push(`${(e.getAttribute('aria-label') || e.textContent || e.tagName).trim().slice(0, 30)} ${Math.round(q.width)}×${Math.round(q.height)}`)
  }
  ra.chong = [...new Set(ra.chong)].slice(0, 6)
  return ra
}

for (const [v, cho, luuGiua] of CANH) {
  if (CHON.length && !CHON.includes(v)) continue
  for (const [w, hh, k] of KHO) for (const nen of ['light', 'dark']) {
    const ten = `tp-${v}-${k}${nen === 'dark' ? '-toi' : ''}`
    const ctx = await trinh.newContext({ viewport: { width: w, height: hh }, deviceScaleFactor: 1, colorScheme: nen, hasTouch: w < 900, isMobile: w < 500 })
    await ctx.route((u) => !u.href.startsWith(`http://127.0.0.1:${may.address().port}`), (r) => r.abort())
    const t = await ctx.newPage()
    t.on('pageerror', (e) => loi.push(`${ten}: ${e.message}`))
    t.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) loi.push(`${ten}: console ${m.text().slice(0, 160)}`) })
    let cdp = null
    if (CHAM) { cdp = await ctx.newCDPSession(t); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }) }
    await t.goto(`${trangGoc}?man=tp&v=${v}`)
    try { await t.getByText(cho).first().waitFor({ timeout: 20000 }) } catch { loi.push(`${ten}: không thấy chữ ${cho}`) }
    if (CHAM) {
      // đếm khung trong 2 s đầu (hiệu ứng chạy): khung > 34 ms tính là rơi
      const r = await t.evaluate(() => new Promise((xong) => { let n = 0, roi = 0, t0 = performance.now(), cu = t0; const f = (x) => { n++; if (x - cu > 34) roi += Math.round((x - cu) / 16.7) - 1; cu = x; if (x - t0 < 2000) requestAnimationFrame(f); else xong({ n, roi }) }; requestAnimationFrame(f) }))
      const tiLe = r.roi / (r.n + r.roi)
      khung.push(`${ten}: ${(tiLe * 100).toFixed(1)}% khung rơi (${r.n} khung vẽ)`)
      if (tiLe >= 0.2) loi.push(`${ten}: rơi khung ${(tiLe * 100).toFixed(1)}% ≥ 20% (CPU chậm 4×)`)
    }
    const doLuc = async (luc) => {
      const d = await t.evaluate(DO)
      if (d.tran > 0 || d.tranTrong > 0) tran.push(`${ten} (${luc}): trang ${d.tran}px · trong ${d.tranTrong}px ${d.thu.join(' ')}`)
      if (d.chong.length) chong.push(`${ten} (${luc}): ${d.chong.join(' | ')}`)
      if (d.nho.length && luc === 'cuối') nho.push(`${ten}: ${d.nho.join(' | ')}`)
    }
    await t.waitForTimeout(450); await doLuc('450ms')
    if (luuGiua && !CHAM) { const b = await t.screenshot({ type: 'jpeg', quality: 50 }); writeFileSync(join(RA, `${ten}-giua.jpg`), b) }
    await t.waitForTimeout(650); await doLuc('1100ms')
    await t.waitForTimeout(1700); await doLuc('cuối')
    if (!CHAM) for (const q of [72, 60, 50, 40, 32, 25, 20]) {
      const buf = await t.screenshot({ type: 'jpeg', quality: q, fullPage: k === 'doc' && !['cuu', 'cuu-xong', 'thang-hoa', 'binh', 'phep', 'loi-moi', 'moc-doi', 'moc-chuoi', 'cuoc-thua', 'moi-ban'].includes(v) && !v.startsWith('cuoi') && !v.startsWith('kc') && !v.startsWith('cau') && v !== 'khong-tinh' })
      if (buf.length <= 150 * 1024 || q === 20) { writeFileSync(join(RA, `${ten}.jpg`), buf); break }
    }
    console.log(`${ten} ✓`)
    await ctx.close()
  }
}
await trinh.close()
may.close()
const in_ = (ten, ds) => { console.log(`\n${ten}: ${ds.length}`); for (const l of ds) console.log('  ' + l) }
in_('Lỗi trang', loi); in_('Tràn ngang', tran); in_('Chồng chữ', chong); in_('Đích bấm < 44px', nho)
if (CHAM) in_('Khung hình (CPU chậm 4×)', khung)
process.exit(loi.length || tran.length || chong.length || nho.length ? 1 : 0)
