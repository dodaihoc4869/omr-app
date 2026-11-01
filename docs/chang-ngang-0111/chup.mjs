#!/usr/bin/env node
// CHẶNG NGANG 01/11 — chụp màn làm chặng (ManLamBaiTap nhánh Duo, component THẬT, máy chủ GIẢ scripts/chup-v2/gia/lam-bai-1210d.ts `lam=chang-ngang`)
// ở 5 khổ ngang + 1 khổ dọc, đủ 4 kiểu câu + phản hồi + lời giải; in số đo bố cục (trang có phải cuộn không, nút chính có trong màn không, cột đề cuộn
// riêng, số ký tự mỗi dòng đề). Thầy 01/11: «Phần chặng của học sinh tối ưu thêm cho màn xoay ngang và máy tính … đề dài nhớ có thanh cuộn».
//   npx vite build --config scripts/chup-v2/vite.config.mjs --outDir <dist>
//   node docs/chang-ngang-0111/chup.mjs <dist> <thư mục ảnh> <tiền tố: truoc|sau> [toi]
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.argv[2] ?? 'dist-chup-v2')
const ANH = resolve(process.argv[3] ?? 'docs/chang-ngang-0111')
const TIEN = process.argv[4] ?? 'sau'
const CHI = process.env.CHI ? process.env.CHI.split(',') : null // CHI=844x390,1440x900 ⇒ chỉ chụp các khổ này
const PNG = process.env.PNG === '1' // PNG=1: ảnh PNG + giảm chuyển động (so điểm ảnh trước / sau — chứng minh khổ dọc không đổi)
mkdirSync(ANH, { recursive: true })
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const PUB = resolve(import.meta.dirname, '../../public')
const may = createServer((req, res) => {
  const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = join(DIST, duong), pub = join(PUB, duong)
  const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-v2/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' })
  res.end(readFileSync(tep))
}).listen(0)
const goc = `http://127.0.0.1:${may.address().port}`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })

const KHO = [
  { ten: 'dt-ngang-844x390', w: 844, h: 390, dt: true },
  { ten: 'dt-ngang-932x430', w: 932, h: 430, dt: true },
  { ten: 'mtb-ngang-1180x820', w: 1180, h: 820, dt: true, bang: true },
  { ten: 'may-tinh-1440x900', w: 1440, h: 900 },
  { ten: 'may-tinh-1920x1080', w: 1920, h: 1080 },
  { ten: 'dt-doc-390x844', w: 390, h: 844, dt: true, doc: true },
].filter((k) => !CHI || CHI.includes(`${k.w}x${k.h}`))
const cho = (ms) => new Promise((r) => setTimeout(r, ms))

/** Số đo bố cục của khung hiện tại. */
async function doBoCuc(t) {
  return t.evaluate(() => {
    const vw = innerWidth, vh = innerHeight
    const khung = document.querySelector('.fixed.inset-0.overflow-y-auto')
    const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height), b: Math.round(b.bottom) } }
    const nut = [...document.querySelectorAll('.duo-day .duo-nut')].pop()
    const cot = document.querySelector('.duo-cot-de')
    const cs = cot ? getComputedStyle(cot) : null
    const de = document.querySelector('.duo .ht2-lam-de-chu')
    let kyTu = null
    if (de) {
      const f = getComputedStyle(de), c = document.createElement('canvas').getContext('2d')
      c.font = `${f.fontWeight} ${f.fontSize} ${f.fontFamily}`
      const mau = 'Một nhóm học sinh tiến hành như sau: hoà tan hoàn toàn 2,00 gam mẫu viên thuốc bổ sung sắt trong dung dịch'
      kyTu = Math.round(de.getBoundingClientRect().width / (c.measureText(mau).width / mau.length))
    }
    return {
      vw, vh,
      trangCuon: khung ? khung.scrollHeight - khung.clientHeight : null,
      nutChinh: nut ? { ...r(nut), trongMan: nut.getBoundingClientRect().bottom <= vh && nut.getBoundingClientRect().top >= 0, chu: nut.textContent } : null,
      cotDe: cot ? { ...r(cot), cuonRieng: cs.overflowY === 'auto' || cs.overflowY === 'scroll', du: cot.scrollHeight - cot.clientHeight } : null,
      de: r(de), kyTuMoiDong: kyTu,
      tren: r(document.querySelector('.duo-tren')),
    }
  })
}

const so = {}
async function chupKho(k, toi) {
  const ctx = await trinh.newContext({ viewport: { width: k.w, height: k.h }, deviceScaleFactor: k.dt && !k.bang ? 2 : 1, hasTouch: !!k.dt, isMobile: !!k.dt && !k.bang, colorScheme: toi ? 'dark' : 'light', reducedMotion: PNG ? 'reduce' : 'no-preference' })
  await ctx.route((u) => !u.href.startsWith(goc), (r) => r.abort())
  const t = await ctx.newPage()
  t.setDefaultTimeout(15000)
  const loi = []
  t.on('pageerror', (e) => loi.push(e.message))
  await t.goto(`${goc}/scripts/chup-v2/trang.html?man=lam13&lam=chang-ngang&tp=1${PNG ? '&gtloi=1' : ''}`)
  const ten = `${TIEN}-${k.ten}${toi ? '-toi' : ''}`
  const anh = async (kieu) => {
    await cho(700)
    await t.screenshot(PNG ? { path: join(ANH, `${ten}-${kieu}.png`), type: 'png' } : { path: join(ANH, `${ten}-${kieu}.jpg`), type: 'jpeg', quality: k.dt && !k.bang ? 56 : 62 })
    so[`${ten}-${kieu}`] = await doBoCuc(t)
  }
  const kiemTra = async () => { await t.locator('.duo-day:not(.duo-ket) .duo-nut').click(); await t.locator('.duo-ket:not([data-tt=cho])').waitFor() }
  const tiep = async () => { await t.locator('.duo-ket .duo-hang-nut .duo-nut').click(); await cho(900) }
  await t.locator('.duo .ht2-lam-de').first().waitFor()
  await cho(1200)
  if (!toi) await anh('1-tn-ngan')
  // câu 1: chọn D (đúng) ⇒ Kiểm tra ⇒ Tiếp tục
  await t.locator('.ht2-lam-tn [role=radio]').nth(3).click(); await kiemTra(); await tiep()
  // câu 2: ĐỀ DÀI
  await t.getByText('Thuốc tím', { exact: false }).first().waitFor(); await cho(600)
  await anh('2-de-dai')
  if (!toi) {
    await t.locator('.ht2-lam-tn [role=radio]').nth(1).click()
    await anh('3-de-dai-da-chon')
  } else await t.locator('.ht2-lam-tn [role=radio]').nth(1).click()
  await kiemTra(); await cho(400)
  await anh('4-phan-hoi')
  if (toi) { await ctx.close(); return loi }
  await t.locator('.duo-ct-lg').click(); await t.locator('.duo-lg').waitFor(); await cho(500)
  await anh('5-loi-giai')
  await t.locator('.duo-lg .duo-dong').click(); await cho(300)
  await tiep()
  // câu 3: đúng–sai 4 ý
  await t.locator('.ht2-lam-ds').first().waitFor(); await cho(400)
  await anh('6-dung-sai')
  for (const [i, v] of [[0, 0], [1, 0], [2, 0], [3, 1]]) await t.locator('.ht2-lam-y-nut').nth(i).locator('button').nth(v).click()
  await kiemTra(); await tiep()
  // câu 4: trả lời ngắn — gõ 8,2 bằng bàn phím số của app
  await t.locator('.ht2-lam-phim').first().waitFor(); await cho(400)
  for (const p of ['8', ',', '2']) await t.locator('.ht2-lam-phim button', { hasText: new RegExp(`^${p === ',' ? ',' : p}$`) }).first().click()
  await anh('7-tra-loi-ngan')
  await ctx.close()
  return loi
}

const toiCung = process.argv[5] === 'toi'
for (const k of KHO) {
  const loi = await chupKho(k, false)
  if (loi.length) console.log(`LỖI TRANG ${k.ten}:`, loi.slice(0, 3).join(' | '))
  if (toiCung && !k.doc && (k.w === 844 || k.w === 1440)) await chupKho(k, true)
}
writeFileSync(join(ANH, `so-do-${TIEN}.json`), JSON.stringify(so, null, 1))
for (const [ten, s] of Object.entries(so)) console.log(ten.padEnd(44), `cuộn trang ${String(s.trangCuon).padStart(4)}px · nút ${s.nutChinh ? (s.nutChinh.trongMan ? 'TRONG' : `NGOÀI(b=${s.nutChinh.b})`) : '—'} · cột đề ${s.cotDe ? `${s.cotDe.w}×${s.cotDe.h} ${s.cotDe.cuonRieng ? 'cuộn riêng' : 'không cuộn'} dư ${s.cotDe.du}` : '—'} · ${s.kyTuMoiDong ?? '—'} kt/dòng`)
await trinh.close(); may.close()
