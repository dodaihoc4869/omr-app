#!/usr/bin/env node
// CHỤP THẺ «EM VÀ CÂU NÀY» BẢN THẬT (21/10, nghiệm thu mục 7 của docs/ban-ve-hoi-thay-em-2110/DAC-TA.md): linh kiện thật qua vite dev
// (docs/ban-ve-hoi-thay-1310/that/ — NutHoiThay → HopHoiThay → TheEmVaCau), Chromium thật; mạng /hs/hoi-thay, /hs/hoi-tro-ly chặn bằng Playwright,
// trả dữ liệu mẫu ĐÚNG KHUÔN máy chủ (`tomTatEmVaCau`). Soát: lỗi trang · tràn ngang · đích chạm < 44 px (thẻ mới < 48) · ô nhắn + nút Gửi thấy trọn.
//   node scripts/chup-the-em-va-cau-that-2110.mjs [thư mục ra = docs/ban-ve-hoi-thay-em-2110/anh-that]
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createServer } from 'vite'
import { chromium } from 'playwright'

const GOC = resolve(import.meta.dirname, '..')
const RA = resolve(process.argv[2] ?? join(GOC, 'docs/ban-ve-hoi-thay-em-2110/anh-that'))
mkdirSync(RA, { recursive: true })
const CAU = { qid: 'Q', so: 'Câu 33', chuong: 'Hợp chất chứa nitrogen', de: '<p>Ứng với công thức phân tử C<sub>4</sub>H<sub>11</sub>N có bao nhiêu amine bậc một tác dụng với HNO<sub>2</sub> ở nhiệt độ thường, giải phóng khí N<sub>2</sub>?</p>', y: {} }
const MOC = '2026-10-20T17:00:00.000Z'
const ngay = (d, h = 7) => new Date(Date.UTC(2026, 9, d, h, 5)).toISOString()
const kt = [
  { ten: 'Bậc amine', muc: 'luyen_them', tuLam: 4, ngay: 3, trongCau: true },
  { ten: 'Đếm đồng phân amine', muc: 'vung', tuLam: 7, ngay: 5, trongCau: true },
  { ten: 'Amine gặp HNO2', muc: 'chua_du', tuLam: 1, ngay: 1, trongCau: true },
  { ten: 'Gọi tên amine theo danh pháp thay thế', muc: 'vung', tuLam: 5, ngay: 4, trongCau: false },
  { ten: 'So sánh lực base của amine, ammonia và aniline trong dung dịch nước', muc: 'luyen_them', tuLam: 3, ngay: 2, trongCau: false },
]
const EM = {
  co: { cauNay: { tuLam: 3, tuLamDung: 1, coTroGiup: 1, lan: [{ ketQua: 0, troGiup: false, luc: ngay(16) }, { ketQua: 1, troGiup: false, luc: ngay(18) }, { ketQua: 1, troGiup: true, luc: ngay(20) }, { ketQua: 0, troGiup: false, luc: ngay(21) }] }, kienThuc: kt, hoiNhanh: ['Bậc amine', 'Amine gặp HNO2'], mocKienThuc: MOC },
  dl: { cauNay: { soLan: 4 }, kienThuc: kt.slice(0, 3), hoiNhanh: ['Bậc amine', 'Amine gặp HNO2'], mocKienThuc: MOC },
  moi: { kienThuc: [], hoiNhanh: [] },
}
// [tên, mẫu, rộng, cao, tối?, mở thẻ?, đang làm?]
const KHUNG = [
  ['01-gap-390-sang', 'co', 390, 844, false, false, false],
  ['02-gap-390-toi', 'co', 390, 844, true, false, false],
  ['03-mo-390-sang', 'co', 390, 844, false, true, false],
  ['04-mo-390-toi', 'co', 390, 844, true, true, false],
  ['05-mo-360-sang', 'co', 360, 740, false, true, false],
  ['06-dang-lam-390-toi', 'dl', 390, 844, true, true, true],
  ['07-lan-dau-390-sang', 'moi', 390, 844, false, false, false],
  ['08-ngang-844-toi-mo', 'co', 844, 390, true, true, false],
  ['09-ngang-844-sang-gap', 'co', 844, 390, false, false, false],
  ['10-may-tinh-1440-sang-mo', 'co', 1440, 900, false, true, false],
  ['11-may-tinh-1440-toi-mo', 'co', 1440, 900, true, true, false],
]
const vite = await createServer({ root: GOC, logLevel: 'error', server: { port: 0, host: '127.0.0.1', watch: null, hmr: false } })
await vite.listen()
const goc = vite.resolvedUrls.local[0]
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })
const soat = []
for (const [ten, mau, w, h, toi, moThe, dangLam] of KHUNG) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w > 1000 ? 1 : 2, colorScheme: toi ? 'dark' : 'light', reducedMotion: 'reduce', locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' })
  await ctx.addInitScript(() => localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: 'tok-thu' })))
  await ctx.route('**/hs/hoi-thay', (r) => r.fulfill({ json: dangLam ? { ok: true, chiHoi: true, cau: CAU, hoiThem: true, emVaCau: EM[mau] } : { ok: true, coLoiGiai: true, cau: CAU, hoSo: { qid: 'Q', bam: 'b', dang: 'tln', ten: 'T', co: [] }, hoiThem: true, emVaCau: EM[mau] } }))
  const t = await ctx.newPage()
  t.on('pageerror', (e) => soat.push(`${ten}: lỗi trang ${e.message}`))
  await t.goto(`${goc}docs/ban-ve-hoi-thay-1310/that/index.html?dangLam=${dangLam ? 1 : 0}`)
  await t.getByRole('button', { name: 'Hỏi thầy' }).click()
  await t.getByRole('dialog', { name: 'Hỏi Thầy' }).waitFor()
  await t.locator(mau === 'moi' ? '.lg-ev--moi' : 'details.lg-ev').waitFor()
  if (moThe) await t.locator('details.lg-ev > summary').click()
  await t.evaluate(() => document.fonts.ready)
  await t.waitForTimeout(250)
  const kq = await t.evaluate(() => {
    const hop = document.querySelector('.lg-hh')
    const tran = [...hop.querySelectorAll('*')].filter((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX === 'visible' && e.clientWidth > 0).map((e) => e.className || e.tagName)
    if (document.documentElement.scrollWidth > innerWidth + 1) tran.push('trang')
    const nho = [...hop.querySelectorAll('button, summary')].filter((e) => { const r = e.getBoundingClientRect(); const can = e.closest('.lg-ev') ? 48 : 44; return r.width > 0 && r.height > 0 && (r.height < can - 0.5 || r.width < 44) }).map((e) => `${e.className || e.tagName}:${Math.round(e.getBoundingClientRect().height)}`)
    const gui = document.querySelector('.lg-nh-gui').getBoundingClientRect(), hh = hop.getBoundingClientRect()
    return { tran, nho, guiKhuat: gui.bottom > Math.min(hh.bottom, innerHeight) + 0.5 || gui.top < hh.top }
  })
  if (kq.tran.length) soat.push(`${ten}: TRÀN NGANG ${kq.tran.join(' | ')}`)
  if (kq.nho.length) soat.push(`${ten}: đích chạm nhỏ ${kq.nho.join(' | ')}`)
  if (kq.guiKhuat) soat.push(`${ten}: nút Gửi bị cắt`)
  let q = 82, buf
  for (;;) { buf = await t.screenshot({ type: 'jpeg', quality: q }); if (buf.length <= 150_000 || q <= 40) break; q -= 6 }
  writeFileSync(join(RA, `${ten}.jpg`), buf)
  console.log(`${ten}.jpg ${Math.round(buf.length / 1024)} KB (q${q})`)
  await ctx.close()
}
await trinh.close(); await vite.close()
console.log(soat.length ? `SOÁT: ${soat.length} vấn đề\n- ${soat.join('\n- ')}` : 'SOÁT: 0 lỗi trang · 0 tràn ngang · 0 đích chạm nhỏ · nút Gửi luôn thấy trọn')
