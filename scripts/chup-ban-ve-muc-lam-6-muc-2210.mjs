#!/usr/bin/env node
// CHỤP BẢN VẼ "MỨC LÀM 6 MỨC" (22/10, Code app 2) bằng Chromium THẬT (/opt/pw-browsers/chromium, không tải trình duyệt).
//   node scripts/dung-ban-ve-muc-lam-6-muc-2210.mjs && node scripts/chup-ban-ve-muc-lam-6-muc-2210.mjs [thư mục ra = docs/ban-ve-muc-lam-6-muc-2210/anh]
// Bảng điểm danh: 390×844 · 844×390 · 1440×900, sáng + tối (toàn trang). Tờ chiếu (chỉ nền tối): 1920×1080 · 1280×720 · 1024×768.
// Soát mỗi ảnh: lỗi trang · tràn ngang · đích chạm < 44 px · chữ < 12 px · tương phản chữ < 4,5:1 (chữ ≥ 18,66 px đậm / 24 px: 3:1) · tờ chiếu: thẻ bị cắt / tên bị "…" · chữ "Cố tình" trên tờ chiếu.
// JPG tự hạ chất lượng tới khi ≤ 150 KB.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const GOC_REPO = resolve(import.meta.dirname, '..')
const RA = resolve(process.argv[2] ?? 'docs/ban-ve-muc-lam-6-muc-2210/anh')
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html; charset=utf-8', '.css': 'text/css' }
const may = createServer((req, res) => {
  const p = join(GOC_REPO, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (!p.startsWith(GOC_REPO) || !existsSync(p) || !statSync(p).isFile()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': LOAI[extname(p)] ?? 'application/octet-stream' }); res.end(readFileSync(p))
}).listen(0)
await new Promise((r) => may.once('listening', r))
const goc = `http://127.0.0.1:${may.address().port}/docs/ban-ve-muc-lam-6-muc-2210`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })
const soat = []

/** Soát chung trong trang (chạy trong trình duyệt). */
const SOAT_TRANG = (laChieu) => {
  const hien = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
  const rgb = (s) => { const m = s.match(/[\d.]+/g); if (!m) return null; const v = m.slice(0, 4).map(Number); return s.startsWith('color(') ? [v[0] * 255, v[1] * 255, v[2] * 255, v[3]] : v }
  const sang = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  const nenCua = (el) => { for (let x = el; x; x = x.parentElement) { const c = rgb(getComputedStyle(x).backgroundColor); const bi = getComputedStyle(x).backgroundImage; if (bi && bi !== 'none') return null; if (c && (c[3] === undefined || c[3] > 0.85)) return c } return [255, 255, 255] }
  const goc = document.querySelector('.kh:not([hidden])')
  const tran = document.documentElement.scrollWidth > innerWidth + 1
  const nho = [...goc.querySelectorAll('button')].filter(hien).filter((b) => { const r = b.getBoundingClientRect(); return r.height < 44 || (r.width < 44 && !b.closest('.dd-dong')) }).length
  let chuNho = 0, tuongPhan = []
  for (const el of goc.querySelectorAll('*')) {
    if (!hien(el) || el.closest('[aria-hidden="true"]')) continue
    const coChu = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
    if (!coChu) continue
    const s = getComputedStyle(el)
    const co = parseFloat(s.fontSize)
    if (co < 11.5) chuNho++
    const nen = nenCua(el); const c = rgb(s.color)
    if (!nen || !c || Number(s.opacity) < 1 || el.closest('.giu')) continue
    const L1 = sang(c), L2 = sang(nen); const tl = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
    const lon = co >= 24 || (co >= 18.66 && Number(s.fontWeight) >= 700)
    if (tl < (lon ? 3 : 4.5)) tuongPhan.push(`${el.className || el.tagName}「${el.textContent.trim().slice(0, 14)}」:${tl.toFixed(2)}`)
  }
  const cat = laChieu ? [...goc.querySelectorAll('.the-ai, .ai')].filter((x) => x.scrollHeight > x.clientHeight + 1).map((x) => `${x.className.split(' ')[0]} ${x.scrollHeight}>${x.clientHeight}`) : []
  const bachan = laChieu ? [...goc.querySelectorAll('.pl b')].filter((b) => b.scrollWidth > b.clientWidth + 1).length : 0
  const coTinh = laChieu && /Cố tình/i.test(goc.innerText)
  return { tran, nho, chuNho, tuongPhan: [...new Set(tuongPhan)].slice(0, 6), cat, bachan, coTinh }
}

async function chup(t, ten, toanTrang) {
  let q = 82, buf
  for (;;) { buf = await t.screenshot({ type: 'jpeg', quality: q, fullPage: toanTrang }); if (buf.length <= 150_000 || q <= 30) break; q -= 6 }
  writeFileSync(join(RA, `${ten}.jpg`), buf)
  console.log(`${ten}.jpg ${Math.round(buf.length / 1024)} KB (q${q})`)
}

const KHUNG_DD = [['du', '01-diem-danh-6-muc'], ['ngay-dau', '02-ngay-dau-chua-do-treo'], ['loc-treo', '03-loc-treo-may'], ['trang-thai', '04-dang-do-va-loi']]
const KHO_DD = [['doc', 390, 844, 2], ['ngang', 844, 390, 1.5], ['may-tinh', 1440, 900, 1]]
for (const [k, ten] of KHUNG_DD) for (const [tk, w, h, dpr] of KHO_DD) for (const toi of [0, 1]) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr > 1 ? 1.25 : 1, colorScheme: toi ? 'dark' : 'light', reducedMotion: 'reduce', locale: 'vi-VN' })
  const t = await ctx.newPage()
  const nhan = `${ten}-${tk}-${toi ? 'toi' : 'sang'}`
  t.on('pageerror', (x) => soat.push(`${nhan}: lỗi trang ${x.message}`))
  t.on('requestfailed', (x) => soat.push(`${nhan}: tải hỏng ${x.url()}`))
  await t.goto(`${goc}/diem-danh.html#k=${k}${toi ? '&toi=1' : ''}`)
  await t.evaluate(() => document.fonts.ready)
  await t.waitForTimeout(150)
  const kq = await t.evaluate(SOAT_TRANG, false)
  if (kq.tran) soat.push(`${nhan}: TRÀN NGANG`)
  if (kq.nho) soat.push(`${nhan}: ${kq.nho} đích chạm < 44 px`)
  if (kq.chuNho) soat.push(`${nhan}: ${kq.chuNho} chữ < 12 px`)
  if (kq.tuongPhan.length) soat.push(`${nhan}: tương phản thấp ${kq.tuongPhan.join(', ')}`)
  await chup(t, nhan, true)
  await ctx.close()
}

const KHUNG_C = [['ai-sai', '11-ai-sai-co-treo-may'], ['ai-sai-dong', '12-ai-sai-ca-lop-dong'], ['ai-sai-ngay-dau', '13-ai-sai-chua-do-treo']]
const KHO_C = [['1920', 1920, 1080], ['1280', 1280, 720], ['1024', 1024, 768]]
for (const [k, ten] of KHUNG_C) for (const [tk, w, h] of KHO_C) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: 'dark', reducedMotion: 'reduce', locale: 'vi-VN' })
  const t = await ctx.newPage()
  const nhan = `${ten}-${tk}`
  t.on('pageerror', (x) => soat.push(`${nhan}: lỗi trang ${x.message}`))
  await t.goto(`${goc}/chieu.html#k=${k}`)
  await t.evaluate(() => document.fonts.ready)
  await t.waitForTimeout(200)
  const kq = await t.evaluate(SOAT_TRANG, true)
  if (kq.tran) soat.push(`${nhan}: TRÀN NGANG`)
  if (kq.nho) soat.push(`${nhan}: ${kq.nho} đích chạm < 44 px`)
  if (kq.cat.length) soat.push(`${nhan}: BỊ CẮT ${kq.cat.join(' | ')}`)
  if (kq.bachan) soat.push(`${nhan}: ${kq.bachan} tên bị "…" dù đã viết tắt`)
  if (kq.coTinh) soat.push(`${nhan}: LỘ chữ "Cố tình" trên tờ chiếu`)
  if (kq.tuongPhan.length) soat.push(`${nhan}: tương phản thấp ${kq.tuongPhan.join(', ')}`)
  await chup(t, nhan, false)
  await ctx.close()
}
await trinh.close(); may.close()
console.log(soat.length ? `SOÁT: ${soat.length} vấn đề\n- ${soat.join('\n- ')}` : 'SOÁT: 0 lỗi trang · 0 tràn ngang · 0 đích chạm < 44 px · 0 chữ < 12 px · 0 tương phản thấp · 0 thẻ chiếu bị cắt · 0 tên "…" · 0 chữ Cố tình trên tờ chiếu')
