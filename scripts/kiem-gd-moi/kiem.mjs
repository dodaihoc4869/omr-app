#!/usr/bin/env node
// KIỂM ĐỊNH GIAO DIỆN MỚI (thầy 26/10: «kiểm tra kĩ giao diện mới, đảm bảo ko lỗi đè chữ hay tràn trang gì nhé»). Bổ sung cho scripts/soat-chu-chen
// (9 loại a–j): đo những thứ bộ kia không đo, trên các cảnh chup-v2 của giao diện mới (làm chặng kiểu Duolingo, phụ huynh «Chỉ đọc»):
//   h* tràn ngang GIỮA chuyển động — dừng mọi hoạt ảnh CSS ở 0 · 80 · 160 · 320 ms rồi đo trang + khung cuộn + mép phải phần tử
//   k  chữ nhỏ hơn 12px · l tương phản dưới ngưỡng (4,5:1; chữ lớn 3:1) · i đích bấm < 44px · m nút chính («Kiểm tra»/«Tiếp tục») bị che hoặc ngoài khung
//   n  trang cuộn ngang (scrollWidth > innerWidth) ở trạng thái nghỉ
//   npx vite build --config scripts/chup-v2/vite.config.mjs --outDir <dist>
//   node scripts/kiem-gd-moi/kiem.mjs <dist> <thư mục ra> [--chon kgd-,duo-,60-ph-doc] [--kho 390x844,…] [--nen light,dark] [--song-song 4]
// Ra: <thư mục ra>/kiem.json + tóm tắt in ra màn hình. Thoát mã 1 nếu còn lỗi.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const thamSo = process.argv.slice(2)
const lay = (ten, mac) => { const i = thamSo.indexOf(ten); return i >= 0 ? thamSo[i + 1] : mac }
const [DIST_ARG, RA_ARG] = thamSo.filter((x, i) => !x.startsWith('--') && !thamSo[i - 1]?.startsWith('--'))
const DIST = resolve(DIST_ARG ?? 'dist-kgd')
const RA = resolve(RA_ARG ?? 'kgd-ra')
const CHON = lay('--chon', 'kgd-,duo-,60-ph-doc,61-ph-doc,63-ph-doc').split(',').filter(Boolean)
const KHO_MAC = '360x640,375x667,390x844,412x915,740x360,844x390,768x1024,1024x768,1366x768,1440x900,1920x1080,312x675,390x390'
const KHO = lay('--kho', KHO_MAC).split(',').map((k) => k.split('x').map(Number))
const NEN = lay('--nen', 'light,dark').split(',')
const SONG = Number(lay('--song-song', '4'))
mkdirSync(RA, { recursive: true })

// ── cảnh: DS + khối thao tác của chup.mjs (cùng cách cắt như scripts/soat-chu-chen/soat.mjs) — cảnh mới ở chup.mjs tự vào bộ kiểm
const GOC = resolve(import.meta.dirname, '../..')
const nguon = readFileSync(join(GOC, 'scripts/chup-v2/chup.mjs'), 'utf8')
const iDs = nguon.indexOf('const DS_HS12'), iHetDs = nguon.indexOf('const loiTrang = []')
const iTry = nguon.indexOf("  try {\n    if (viec?.startsWith('nut:'))"), iCatch = nguon.indexOf('\n  } catch (e) {', iTry)
if (iDs < 0 || iHetDs < 0 || iTry < 0 || iCatch < 0) throw Error('chup.mjs đổi cấu trúc — sửa mốc cắt trong kiem.mjs')
const DS = new Function(nguon.slice(iDs, iHetDs) + '\nreturn DS')()
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor
const thaoTac = new AsyncFunction('t', 'viec', 'ten', 'loiTrang', 'tran', 'tuongPhanThap', nguon.slice(iTry + '  try {'.length, iCatch))
const boKho = (ten) => ten.replace(/-(doc640|doc700|doc|ngang740|ngang|may-tinh-1920|may-tinh|dien-thoai|bang|sang|toi)(?=-|$)/g, '').replace(/-\d+x\d+$/, '')
const CANH = new Map()
for (const [ten, man, , , , , cho, viec] of DS) {
  if (/trong=tat/.test(man)) continue // giao diện cũ (tắt «Trong») — ngoài phạm vi
  if (!CHON.some((p) => ten.startsWith(p))) continue
  const k = `${man}|${viec ?? ''}`
  if (!CANH.has(k)) CANH.set(k, { ten: boKho(ten), man, cho, viec })
}
const canh = [...CANH.values()]
const viec = canh.flatMap((c) => KHO.flatMap(([w, h]) => NEN.map((nen) => ({ ...c, w, h, nen }))))
console.log(`${canh.length} cảnh × ${KHO.length} khổ × ${NEN.length} nền = ${viec.length} lượt`)

const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const PUB = join(GOC, 'public')
const may = createServer((req, res) => {
  const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = join(DIST, duong), pub = join(PUB, duong)
  const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-v2/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' })
  res.end(readFileSync(tep))
}).listen(0)
const goc = `http://127.0.0.1:${may.address().port}`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const trinh = await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })

/** Tràn ngang ở trạng thái hiện tại: trang · khung cuộn dọc toàn màn · phần tử vượt mép phải/trái (bỏ phần tử nằm trong khung cắt/cuộn ngang). */
function doTran() {
  const W = innerWidth
  const ra = []
  const tr = document.documentElement.scrollWidth - document.documentElement.clientWidth
  if (tr > 0) ra.push(`trang rộng hơn khung ${tr}px`)
  for (const e of document.querySelectorAll('body *')) {
    const s = getComputedStyle(e)
    if (/(auto|scroll)/.test(s.overflowY) && e.clientWidth >= W - 20 && e.scrollWidth > e.clientWidth + 1 && !/(auto|scroll)/.test(s.overflowX)) ra.push(`khung cuộn ${e.className.toString().slice(0, 40)} tràn ngang ${e.scrollWidth - e.clientWidth}px`)
  }
  const catNgang = (el) => { for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) { const s = getComputedStyle(e); if (s.overflowX !== 'visible' && e.getBoundingClientRect().right <= W + 1) return true } return false }
  let max = 0, mau = ''
  for (const e of document.querySelectorAll('body *')) {
    const r = e.getBoundingClientRect()
    if (!r.width || !r.height) continue
    const vuot = Math.max(r.right - W, -r.left)
    if (vuot > 1 && vuot > max && !catNgang(e)) { max = vuot; mau = `${e.tagName.toLowerCase()}.${e.className.toString().split(' ')[0]}` }
  }
  if (max > 1) ra.push(`phần tử vượt mép ${Math.round(max)}px (${mau})`)
  return ra
}
/** Chữ < 12px, tương phản thấp, đích bấm < 44px, nút chính bị che. */
function doChu() {
  const ra = []
  const doc = (s) => {
    let m = /^rgba?\(([^)]+)\)$/.exec(s)
    if (m) { const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1] }
    m = /^color\(srgb ([^)]+)\)$/.exec(s)
    if (m) { const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1] }
    return null
  }
  const tron = (a, b) => [0, 1, 2].map((i) => a[i] * a[3] + b[i] * (1 - a[3])).concat(1)
  const nen = (el) => {
    const lop = []
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e)
      if (s.backgroundImage !== 'none' && !/gradient/.test(s.backgroundImage)) return null // nền ảnh: không đo được
      if (/gradient/.test(s.backgroundImage)) return null
      const c = doc(s.backgroundColor)
      if (c && c[3] > 0) { lop.push(c); if (c[3] >= 1) break }
    }
    const goc = doc(getComputedStyle(document.body).backgroundColor) ?? [255, 255, 255, 1]
    return lop.reverse().reduce((d, c) => tron(c, d), goc[3] >= 1 ? goc : [255, 255, 255, 1])
  }
  const L = (c) => c.slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0)
  const tyLe = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
  const chiDoc = (el) => { for (let e = el, i = 0; e && i < 6; e = e.parentElement, i++) { const s = getComputedStyle(e), r = e.getBoundingClientRect(); if ((s.clip && s.clip !== 'auto') || ((r.width <= 2 || r.height <= 2) && s.overflow !== 'visible')) return true } return false }
  const thay = (el) => el.checkVisibility ? el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) : true
  const daXet = new Set()
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const el = n.parentElement
    if (!el || !n.textContent.trim() || daXet.has(el) || /^(SCRIPT|STYLE)$/.test(el.tagName)) continue
    daXet.add(el)
    if (!thay(el) || chiDoc(el) || el.closest('[aria-hidden="true"] svg, button:disabled, [disabled]')) continue
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height || r.bottom < 0 || r.top > document.documentElement.scrollHeight + 2000) continue
    const s = getComputedStyle(el)
    const co = parseFloat(s.fontSize)
    const mau = n.textContent.trim().slice(0, 30)
    // chỉ số dưới/trên của công thức hoá học nhỏ theo chữ chứa nó — không tính
    if (co < 11.95 && !el.closest('sub, sup')) ra.push({ loai: 'k', ghi: `chữ ${co}px «${mau}»` })
    const c = doc(s.color), bg = nen(el)
    if (!c || !bg) continue
    let op = 1
    for (let e = el; e; e = e.parentElement) op *= Number(getComputedStyle(e).opacity)
    const k = tyLe(tron([c[0], c[1], c[2], c[3] * op], bg), bg)
    const nguong = co >= 24 || (co >= 18.66 && Number(s.fontWeight) >= 700) ? 3 : 4.5
    if (k < nguong - 0.01) ra.push({ loai: 'l', ghi: `tương phản ${k.toFixed(2)} < ${nguong} «${mau}»` })
  }
  for (const e of document.querySelectorAll('button, a[href], [role="button"], [role="radio"]')) {
    const r = e.getBoundingClientRect(), s = getComputedStyle(e)
    if (!r.width || !r.height || s.visibility === 'hidden' || chiDoc(e)) continue
    if (r.width < 43.5 || r.height < 43.5) ra.push({ loai: 'i', ghi: `đích ${Math.round(r.width)}×${Math.round(r.height)} «${(e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 30)}»` })
  }
  // nút chính của màn mới: phải nằm trong khung và không bị phần tử khác che (giữa nút)
  for (const e of document.querySelectorAll('.duo-nut')) {
    const r = e.getBoundingClientRect()
    if (!r.width) continue
    if (r.bottom > innerHeight + 1 && getComputedStyle(e.closest('.duo-day') ?? e).position === 'sticky') ra.push({ loai: 'm', ghi: `nút «${e.textContent.trim()}» ghim nhưng ra ngoài khung (${Math.round(r.bottom)}/${innerHeight})` })
    if (r.top >= 0 && r.bottom <= innerHeight) {
      const tren = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      if (tren && !e.contains(tren)) ra.push({ loai: 'm', ghi: `nút «${e.textContent.trim()}» bị che bởi ${tren.tagName.toLowerCase()}.${tren.className.toString().split(' ')[0]}` })
    }
  }
  return ra
}

async function chay(v) {
  const ctx = await trinh.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 1, colorScheme: v.nen, hasTouch: v.w < 900, isMobile: v.w < 500 })
  await ctx.route((u) => !u.href.startsWith(goc), (r) => r.abort())
  const t = await ctx.newPage()
  t.setDefaultTimeout(8000)
  const loiTrang = []
  t.on('pageerror', (e) => loiTrang.push(`pageerror ${e.message.slice(0, 160)}`))
  const kq = { canh: v.ten, man: v.man, viec: v.viec ?? '', w: v.w, h: v.h, nen: v.nen, loi: [], loiTrang }
  try {
    await t.goto(`${goc}/scripts/chup-v2/trang.html?man=${v.man}`)
    try { await t.getByText(v.cho).first().waitFor({ timeout: 20000 }) } catch { loiTrang.push(`không thấy chữ ${v.cho}`) }
    await thaoTac(t, v.viec, v.ten, loiTrang, [], []).catch((e) => loiTrang.push(`thao tác ${v.viec} hỏng — ${String(e).slice(0, 200)}`))
    await t.waitForTimeout(700)
    // (n) nghỉ + (h*) giữa chuyển động: phát lại mọi hoạt ảnh (tấm kết quả trượt, thanh tiến độ, hiệu ứng) và dừng ở từng mốc
    for (const l of await t.evaluate(doTran)) kq.loi.push({ loai: 'n', ghi: l })
    const coHoatAnh = await t.evaluate(() => {
      const ds = document.getAnimations()
      for (const a of ds) { a.cancel(); a.pause() }
      return ds.length
    })
    if (coHoatAnh) for (const ms of [0, 80, 160, 320]) {
      const ra = await t.evaluate((ms) => { for (const a of document.getAnimations()) { a.pause(); a.currentTime = ms } return null }, ms)
      void ra
      for (const l of await t.evaluate(doTran)) kq.loi.push({ loai: 'h*', ghi: `${ms}ms: ${l}` })
    }
    await t.evaluate(() => { for (const a of document.getAnimations()) a.finish?.() })
    await t.waitForTimeout(100)
    for (const l of await t.evaluate(doChu)) kq.loi.push(l)
    // cuộn tới đáy rồi đo lại nút chính (đáy ghim / tấm kết quả)
    await t.evaluate(() => { for (const e of [document.scrollingElement, ...document.querySelectorAll('body *')]) { if (e && e.scrollHeight > e.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(e).overflowY) || e === document.scrollingElement) e.scrollTop = e.scrollHeight } })
    await t.waitForTimeout(200)
    for (const l of (await t.evaluate(doChu)).filter((x) => x.loai === 'm')) kq.loi.push({ ...l, ghi: `${l.ghi} · cuộn tới đáy` })
  } catch (e) { loiTrang.push(`lượt hỏng — ${String(e).slice(0, 200)}`) }
  await ctx.close()
  return kq
}

const ketQua = []
let xong = 0
const hang = [...viec]
await Promise.all(Array.from({ length: SONG }, async () => {
  for (let v = hang.shift(); v; v = hang.shift()) {
    ketQua.push(await chay(v))
    if (++xong % 50 === 0) console.log(`${xong}/${viec.length}`)
  }
}))
writeFileSync(join(RA, 'kiem.json'), JSON.stringify(ketQua))
await trinh.close()
may.close()
// tóm tắt: gộp theo (loại, ghi) → các cảnh·khổ gặp
const gop = new Map()
for (const k of ketQua) for (const l of k.loi) {
  const khoa = `${l.loai} ${l.ghi.replace(/\d+(\.\d+)?px/g, 'Npx').replace(/\(\d+\/\d+\)/, '')}`
  if (!gop.has(khoa)) gop.set(khoa, [])
  gop.get(khoa).push(`${k.canh}@${k.w}x${k.h}${k.nen === 'dark' ? '-toi' : ''}`)
}
const dem = {}
for (const k of ketQua) for (const l of k.loi) dem[l.loai] = (dem[l.loai] ?? 0) + 1
console.log('Lỗi theo loại:', JSON.stringify(dem))
for (const [khoa, ds] of [...gop].sort((a, b) => b[1].length - a[1].length)) console.log(`  [${ds.length}] ${khoa}\n      ${ds.slice(0, 6).join(' · ')}${ds.length > 6 ? ' …' : ''}`)
const hong = ketQua.filter((k) => k.loiTrang.length)
console.log(`Lượt có lỗi trang: ${hong.length}`)
for (const k of hong.slice(0, 12)) console.log(`  ${k.canh}@${k.w}x${k.h}: ${k.loiTrang.join(' | ').slice(0, 260)}`)
process.exit(Object.keys(dem).length || hong.length ? 1 : 0)
