#!/usr/bin/env node
// CHỤP APP THẬT · HỆ KÍNH (thầy 02/11 «Build xong hết chụp ảnh app thật ở mọi lớp cho tôi xem»): component THẬT + máy chủ GIẢ (trang.tsx), Chromium thật.
//   npx vite build --config scripts/chup-v2/vite.config.mjs --outDir <dist>
//   node scripts/chup-v2/chup-kinh.mjs <dist> <thư mục ảnh> [lọc tên,…]   (KHO=doc,ngang,fold,fold-gap,may-tinh · NEN=sang,toi)
// Mỗi ảnh: JPG ≤ 150 KB. In mỗi ảnh: lỗi trang · tràn ngang · đích chạm < 44 px · chữ kém tương phản (≥ 4,5 chữ thường, ≥ 3 chữ to/đậm trên nút) — đo trên nền đặc.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.argv[2] ?? 'dist-chup'), RA = resolve(process.argv[3] ?? 'anh-kinh')
const LOC = (process.argv[4] ?? '').split(',').filter(Boolean)
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const PUB = resolve(import.meta.dirname, '../../public')
const may = createServer((req, res) => {
  const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = join(DIST, duong), pub = join(PUB, duong)
  const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-v2/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' }); res.end(readFileSync(tep))
}).listen(0)
const goc = `http://127.0.0.1:${may.address().port}/scripts/chup-v2/trang.html`
const KHO = [['doc', 390, 844], ['ngang', 844, 390], ['fold', 904, 690], ['fold-gap', 360, 800], ['may-tinh', 1440, 900]]
const chonKho = (process.env.KHO ?? '').split(',').filter(Boolean), chonNen = (process.env.NEN ?? 'sang,toi').split(',')
// [tên, tham số trang, các bước (ngăn bằng « » »): tn:<regex> chọn phương án · nut:<regex> bấm nút · ds:a=Đúng,b=Sai · phim:<kí tự> · bam:<css> · cho:<ms>, dài (chụp cả trang)]
const DQ1 = 'tn:^D » nut:^Kiểm tra$ » nut:^Tiếp tục', DQ3 = `${DQ1} » tn:^A » nut:^Kiểm tra$ » nut:^Tiếp tục`, DQ4 = `${DQ3} » ds:a=Đúng,b=Đúng,c=Đúng,d=Đúng » nut:^Kiểm tra$ » nut:^Tiếp tục`
const _DK_LUOI = 'bam:.duo-kt-luoi-nut, [aria-label*="Danh sách câu"]'
export const CANH = [
  ['hom-nay', 'man=hs-mot&dd=khong', '', true],
  ['hom-nay-diem-danh', 'man=hs-mot&dd=mo', '', true],
  ['hom-nay-du', 'man=hs-mot&tt=du&dd=khong', '', true],
  ['hom-nay-ca', 'man=hs-mot&tt=ca&dd=khong', '', true],
  ['hom-nay-kiem-tra', 'man=hs-mot&kt=khoa&dd=khong', '', true],
  ['them', 'man=hs-mot&dd=mo', 'bam:.kb-thanh .tr-menu-cham » cho:400', false],
  ['luyen-tap', 'man=hs-mot&dd=khong', 'nut:^Luyện tập$', true],
  ['thanh-tich', 'man=hs-mot&tp=1&dd=khong', 'nut:^Thành tích$', true],
  ['lam-1-cau', 'man=lam13&lam=duo', 'cho:900', false],
  ['lam-2-chon', 'man=lam13&lam=duo', 'tn:^D', false],
  ['lam-3-dung', 'man=lam13&lam=duo', 'tn:^D » nut:^Kiểm tra$', false],
  ['lam-4-sai', 'man=lam13&lam=duo', 'tn:^B » nut:^Kiểm tra$', false],
  ['lam-5-loi-giai', 'man=lam13&lam=duo', 'tn:^B » nut:^Kiểm tra$ » nut:^Lời giải từng bước', false],
  ['lam-6-dung-sai', 'man=lam13&lam=duo', `${DQ3} » ds:a=Đúng,b=Đúng,c=Đúng,d=Đúng » nut:^Kiểm tra$`, false],
  ['lam-7-tln', 'man=lam13&lam=duo', `${DQ4} » phim:8,2`, false],
  ['lam-8-xong', 'man=lam13&lam=duo', `${DQ4} » phim:8,2 » nut:^Kiểm tra$ » nut:^Tiếp tục » tn:^B » nut:^Kiểm tra$ » nut:^Tiếp tục`, false],
  ['tu-sua-loi', 'man=hs12-tu-chua', '', true],
  ['tu-sua-viec', 'man=hs12-tu-chua&sua=nay', 'cho:900', true], // Tự sửa lỗi CÓ «Việc hôm nay» (như bản sống của thầy 02/11)
  ['chua-cau-sai', 'man=duo-sua&de=1', 'cho:900', false], // luồng sửa câu app ĐANG DÙNG (ChuaGonDuo) — luồng «Đường tự gỡ» cũ không còn là lối vào
  ['tu-luyen', 'man=hs12-tu-luyen', '', true],
  ['tu-luyen-lam', 'man=hs12-tu-luyen-lam', '', false],
  ['ktcn-cau', 'man=duo-kt&v=ktcn', 'nut:^Làm tiếp chặng 2', false],
  ['ktcn-ket', 'man=duo-kt&v=ket', '', true],
  ['thi-cau', 'man=duo-kt&v=thi&vai=hocsinh', 'cho:600', false],
  ['thi-chon', 'man=duo-kt&v=thi&vai=hocsinh', 'nut:^B\\.', false],
  ['thi-kq', 'man=duo-kt&v=kq&vai=hocsinh', '', true],
  // màn thưởng THẬT (MotTrangHs → Thành tích → bấm mục ⇒ ManThuong trong khung «thuong» của app, không qua khung giả gia/thuong.tsx)
  ['tpt-chuoi', 'man=hs-mot&tp=1&dd=khong', 'nut:^Thành tích$ » nut:^Chuỗi ngày » cho:900', true],
  ['tpt-giai', 'man=hs-mot&tp=1&dd=khong', 'nut:^Thành tích$ » nut:^Giải tuần » cho:900', true],
  ['tpt-huy-hieu', 'man=hs-mot&tp=1&dd=khong', 'nut:^Thành tích$ » nut:^Huy hiệu » cho:900', true],
  ['tpt-ban', 'man=hs-mot&tp=1&dd=khong', 'nut:^Thành tích$ » nut:^Học cùng bạn » cho:900', true],
  ['tpt-cua-hang', 'man=hs-mot&tp=1&dd=khong', 'nut:^Thành tích$ » nut:^Cửa hàng » cho:900', true],
  ['tpt-nhiem-vu', 'man=hs-mot&tp=1&dd=khong', 'bam:.kb-chip[data-k=nt] » cho:900', true],
  ['tp-chuoi', 'man=tp&v=chuoi', '', true],
  ['tp-giai', 'man=tp&v=giai', '', true],
  ['tp-nhiem-vu', 'man=tp&v=nv', '', true],
  ['tp-cua-hang', 'man=tp&v=cua-hang', '', true],
  ['tp-huy-hieu', 'man=tp&v=huy-hieu', '', true],
  ['tp-ban', 'man=tp&v=ban', '', true],
  ['tp-ket', 'man=tp&v=ket', '', true],
  ['khac-phuc', 'man=hs-sheet&tam=khac-phuc', 'cho:900', false], // tấm phủ kín «Luyện lại từ bài kiểm tra» (lớp sau không được lộ qua)
  ['dang-nhap', 'man=hs-dang-nhap', '', false],
  ['ai', 'man=hs-ng&v=ai', 'cho:600', false],
]
const exe = existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined
const trinh = await chromium.launch({ executablePath: exe })
const tong = { loi: 0, tran: 0, nho: 0, kem: 0, anh: 0 }
const viecCan = []
for (const [ten, ts, viec, dai] of CANH) {
  if (LOC.length && !LOC.some((l) => ten === l || ten.startsWith(l + '-') || ten.startsWith(l))) continue
  for (const [k, w, h] of KHO) {
    if (chonKho.length && !chonKho.includes(k)) continue
    for (const nen of ['sang', 'toi']) if (chonNen.includes(nen)) viecCan.push({ ten, ts, viec, dai, k, w, h, nen })
  }
}
const SONG = Number(process.env.SONG ?? 6)
let tro = 0
async function mot({ ten, ts, viec, dai, k, w, h, nen }) {
      const p = await trinh.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: w > 1000 ? 1 : 2, colorScheme: nen === 'toi' ? 'dark' : 'light' })
  const loi = []
  p.on('pageerror', (e) => loi.push(String(e).slice(0, 120)))
  await p.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort())
  await p.goto(`${goc}?${ts}`)
  await p.waitForTimeout(1600)
  for (const buoc of viec.split(' » ').filter(Boolean)) {
    const [lenh, ...x] = buoc.split(':'), v = x.join(':')
    try {
      if (lenh === 'tn') await p.getByRole('radio', { name: new RegExp(v) }).first().click({ timeout: 6000 })
      else if (lenh === 'nut') await p.getByRole('button', { name: new RegExp(v) }).first().click({ timeout: 6000 })
      else if (lenh === 'ds') for (const cap of v.split(',')) { const [y, gt] = cap.split('='); await p.getByRole('group', { name: `Chọn cho ý ${y}` }).getByRole('button', { name: gt, exact: true }).click({ timeout: 6000 }) }
      else if (lenh === 'phim') for (const c of v) await p.keyboard.press(c)
      else if (lenh === 'bam') await p.locator(v).first().click({ timeout: 6000 })
      else if (lenh === 'cho') await p.waitForTimeout(Number(v))
    } catch (e) { loi.push(`bước hỏng «${buoc}» ${String(e).slice(0, 50)}`) }
    await p.waitForTimeout(250)
  }
  await p.waitForTimeout(500)
  const kq = await p.evaluate(() => {
    const hien = (e) => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05 }
    const tran = document.documentElement.scrollWidth - document.documentElement.clientWidth
    const nho = [...document.querySelectorAll('button, a[href], [role=button], [role=switch], input:not([type=hidden])')]
      .filter((e) => hien(e) && !e.closest('[aria-hidden=true],[inert]') && (e.getBoundingClientRect().height < 43.5 || e.getBoundingClientRect().width < 43.5))
      .map((e) => (e.getAttribute('aria-label') || e.textContent || e.className).trim().slice(0, 28))
    const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true })
    const rgba = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = 'rgba(0,0,0,0)'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
    const tron = (a, b) => [0, 1, 2].map((i) => a[i] * a[3] + b[i] * (1 - a[3])).concat(1)
    const nen = (e) => { const ds = []; for (let x = e; x; x = x.parentElement) { const c = rgba(getComputedStyle(x).backgroundColor); if (c[3] > 0) ds.push(c); if (c[3] >= 0.99) break }
      let n = ds.length && ds[ds.length - 1][3] >= 0.99 ? ds.pop() : rgba(getComputedStyle(document.body).backgroundColor); for (let i = ds.length - 1; i >= 0; i--) n = tron(ds[i], n); return n }
    const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }, L = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2])
    const tp = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
    const mo = (e) => { let o = 1; for (let x = e; x; x = x.parentElement) o *= +getComputedStyle(x).opacity; return o }
    const kem = []
    for (const e of document.querySelectorAll('body *')) {
      if (!hien(e) || e.closest('svg, [aria-hidden=true], [disabled], .sr-only, [inert]') || ![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue
      const r = e.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight * 3) continue
      const cs = getComputedStyle(e), b = nen(e), c = rgba(cs.color); c[3] *= mo(e)
      const px = parseFloat(cs.fontSize), dam = +cs.fontWeight >= 700, to = px >= 24 || (px >= 18.66 && dam) || (!!e.closest('button, [role=button], .chip, [class*=dem], [class*=cham]') && dam)
      const t = tp(tron(c, b), b)
      if (t < (to ? 3 : 4.5) - 0.01) kem.push(`${e.textContent.trim().slice(0, 22)}=${t.toFixed(2)}`)
    }
    // CHỮ CHẠM / TRÀN MÉP THẺ (thầy 02/11 «để ý xem chữ có tràn khung không»): mỗi dòng chữ so với thẻ gần nhất (nền ≥ 30 % + bo ≥ 12 px, hẹp hơn khung nhìn)
    const sat = [], laThe = (x) => { const c = getComputedStyle(x), a = rgba(c.backgroundColor)[3]; const r = x.getBoundingClientRect()
      return (a >= 0.3 || c.backgroundImage !== 'none') && parseFloat(c.borderTopLeftRadius) >= 12 && r.width < innerWidth - 4 && r.width > 60 }
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      const e = n.parentElement; if (!n.textContent.trim() || !e || !hien(e) || e.closest('svg, [aria-hidden=true], .sr-only, .ht2-an, [inert], input, textarea')) continue
      { const c = getComputedStyle(e); if (c.clip !== 'auto' || c.clipPath !== 'none' || c.textOverflow === 'ellipsis') continue } // chữ ẩn cho trình đọc màn hình / cắt «…» có chủ ý
      let the = e; while (the && the !== document.body && !laThe(the)) the = the.parentElement
      if (!the || the === document.body) continue
      const rt = the.getBoundingClientRect(), rg = document.createRange(); rg.selectNodeContents(n)
      for (const r of rg.getClientRects()) if (r.width > 2 && (r.left < rt.left + 6 || r.right > rt.right + 0.5 - 6)) { sat.push(`${n.textContent.trim().slice(0, 18)}|${(String(the.className.baseVal ?? the.className)).split(' ')[0]}`); break }
      if (sat.length > 12) break
    }
    // NÚT DÀI (thầy 02/11 «nút quá dài không tinh tế»): nút hành động rộng > 440 px khi khung nhìn ≥ 800 px
    const dai = innerWidth >= 800 ? [...document.querySelectorAll('.duo-nut, .ht-nut-chinh, .ht-nut-phu, .ht2-nut-lon, .tp-nut, .tp-nut-lon, .m3-nut-chinh, .m3-nut-tonal, .m3-nut-vien, .btn-google-primary, .kb-cta')]
      .filter((e) => hien(e) && !e.closest('[aria-hidden=true],[inert]') && e.getBoundingClientRect().width > 440).map((e) => `${(e.textContent || '').trim().slice(0, 20)}=${Math.round(e.getBoundingClientRect().width)}`) : []
    // NỀN TRẮNG (thầy 02/11 «còn nền trắng mờ»): khối nền gần trắng, đặc (≥ 0,9), rộng > 60 % khung nhìn — lạc giữa hệ kính (trừ khung màn con cố định)
    const trang = [...document.querySelectorAll('body *')].filter((e) => { if (!hien(e) || e.closest('[aria-hidden=true],[inert]') || e.matches('.fixed.inset-0')) return false
      const r = e.getBoundingClientRect(); if (r.width < innerWidth * 0.6 || r.height < 40 || r.top > innerHeight * 2) return false
      const c = rgba(getComputedStyle(e).backgroundColor); return c[3] >= 0.9 && c[0] > 235 && c[1] > 235 && c[2] > 235 })
      .map((e) => `${e.tagName}.${String(e.className).split(' ')[0]}`).slice(0, 4)
    return { tran, nho, kem, sat, dai, trang, cao: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) }
  })
  // chụp cả trang trên khổ dọc: thanh nổi (fixed) chuyển xuống ĐÁY trang để không nằm giữa ảnh; khổ rộng chụp đúng khung nhìn (ray trái cố định)
  const dai2 = dai && w < 700
  if (dai2) await p.addStyleTag({ content: 'body{position:relative} html[data-trong] .tr-menu-ray.kb-thanh{position:absolute!important;bottom:14px!important;top:auto!important}' })
  const ra = join(RA, `${ten}-${k}-${nen}.jpg`)
  let q = 72
  const chup = () => p.screenshot({ path: ra, type: 'jpeg', quality: q, fullPage: dai2 })
  await chup()
  while (statSync(ra).size > 150 * 1024 && q > 34) { q -= 8; await chup() }
  tong.anh++; tong.loi += loi.length; tong.tran += kq.tran > 1 ? 1 : 0; tong.nho += kq.nho.length; tong.kem += kq.kem.length; tong.sat = (tong.sat ?? 0) + kq.sat.length; tong.dai = (tong.dai ?? 0) + kq.dai.length; tong.trang = (tong.trang ?? 0) + kq.trang.length
  const ok = !loi.length && kq.tran <= 1 && !kq.nho.length && !kq.kem.length && !kq.sat.length
  console.log(`${ok ? '✓' : '✗'} ${ten}-${k}-${nen} · lỗi ${loi.length}${loi.length ? ' ' + loi[0] : ''} · tràn ${kq.tran} · nhỏ ${kq.nho.length}${kq.nho.length ? ' ' + JSON.stringify(kq.nho.slice(0, 3)) : ''} · kém ${kq.kem.length}${kq.kem.length ? ' ' + JSON.stringify(kq.kem.slice(0, 3)) : ''} · ${Math.round(statSync(ra).size / 1024)} KB`)
  if (kq.dai.length) console.log(`    nút dài ${kq.dai.length}: ${JSON.stringify(kq.dai.slice(0, 4))}`)
  if (kq.trang.length) console.log(`    nền trắng: ${JSON.stringify(kq.trang)}`)
  if (kq.sat.length) console.log(`    sát mép thẻ ${kq.sat.length}: ${JSON.stringify(kq.sat.slice(0, 4))}`)
  await p.close()
}
await Promise.all(Array.from({ length: SONG }, async () => { while (tro < viecCan.length) { const v = viecCan[tro++]; try { await mot(v) } catch (e) { console.log(`✗ ${v.ten}-${v.k}-${v.nen} · HỎNG ${String(e).slice(0, 80)}`); tong.loi++ } } }))
console.log('TỔNG', JSON.stringify(tong))
await trinh.close(); may.close()
