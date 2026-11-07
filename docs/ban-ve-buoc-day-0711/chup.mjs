#!/usr/bin/env node
// CHỤP BẢN VẼ CÁC BƯỚC BUỔI DẠY (07/11, app thầy) bằng Chromium THẬT (không tải trình duyệt).
//   node docs/ban-ve-buoc-day-0711/chup.mjs
// 6 màn × 3 khổ (điện thoại 390×844 ×1,5 · máy tính bảng 1024×768 ×1 · máy tính 1440×900 ×1) × sáng + tối ⇒ anh/*.jpg (tự hạ chất lượng tới ≤ 150 KB),
// cộng ảnh ghép anh/tong-quan.jpg (6 màn khổ máy tính, sáng). Soát mỗi khung: lỗi trang · tràn ngang · đích chạm < 44 px.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const THU_MUC = import.meta.dirname
const GOC_REPO = resolve(THU_MUC, '..', '..')
const RA = join(THU_MUC, 'anh')
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html; charset=utf-8', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const may = createServer((req, res) => {
  const p = join(GOC_REPO, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (!p.startsWith(GOC_REPO) || !existsSync(p) || !statSync(p).isFile()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': LOAI[extname(p)] ?? 'application/octet-stream' }); res.end(readFileSync(p))
}).listen(0)
await new Promise((r) => may.once('listening', r))
const GOC = `http://127.0.0.1:${may.address().port}`
const URL_VE = `${GOC}/docs/ban-ve-buoc-day-0711/nguyen-mau.html`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })
const soat = []

const MAN = [[1, 'diem-danh'], [2, 'chon-hoat-dong'], [3, 'chon-cau'], [4, 'dang-chieu'], [5, 'man-chieu'], [6, 'ket-thuc-buoi']]
const KHO = [['dien-thoai', 390, 844, 1.5], ['may-tinh-bang', 1024, 768, 1], ['may-tinh', 1440, 900, 1]]
const jpg = async (t, opt) => { let q = 80, buf; for (;;) { buf = await t.screenshot({ type: 'jpeg', quality: q, ...opt }); if (buf.length <= 150_000 || q <= 24) break; q -= 4 } return { buf, q } }

for (const [so, ten0] of MAN) {
  for (const [tenKho, w, h, dpr] of KHO) {
    for (const toi of [false, true]) {
      const ten = `${String(so).padStart(2, '0')}-${ten0}-${tenKho}-${toi ? 'toi' : 'sang'}`
      const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, colorScheme: toi ? 'dark' : 'light', reducedMotion: 'reduce', locale: 'vi-VN' })
      const t = await ctx.newPage()
      t.on('pageerror', (e) => soat.push(`${ten}: lỗi trang ${e.message}`))
      await t.goto(`${URL_VE}?man=${so}${toi ? '&toi=1' : ''}`)
      await t.evaluate(() => document.fonts.ready)
      await t.waitForTimeout(200)
      const kq = await t.evaluate(() => {
        const tran = document.documentElement.scrollWidth > innerWidth + 1
        const nho = [...document.querySelectorAll('button')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 44 || r.width < 44) }).map((e) => `${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 24)} ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`)
        return { tran, nho }
      })
      if (kq.tran) soat.push(`${ten}: TRÀN NGANG`)
      if (kq.nho.length) soat.push(`${ten}: đích chạm nhỏ ${kq.nho.join(' | ')}`)
      const { buf, q } = await jpg(t, { fullPage: so !== 6 })
      writeFileSync(join(RA, `${ten}.jpg`), buf)
      console.log(`${ten}.jpg ${Math.round(buf.length / 1024)} KB (q${q})`)
      await ctx.close()
    }
  }
}

// Ảnh ghép tổng quan: 6 màn khổ máy tính sáng, mỗi màn một khung nhìn 1440×900 (không cuộn) thu nhỏ, kèm nhãn.
{
  const ctx = await trinh.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
  const t = await ctx.newPage()
  const anh = []
  for (const [so] of MAN) {
    await t.goto(`${URL_VE}?man=${so}`)
    await t.evaluate(() => document.fonts.ready)
    await t.waitForTimeout(150)
    anh.push((await t.screenshot({ type: 'jpeg', quality: 85 })).toString('base64'))
  }
  const NHAN = ['1 · Điểm danh → «Xong điểm danh»', '2 · Hôm nay làm gì? (4 hoạt động)', '3 · Chọn câu → «Chiếu lên bảng»', '4 · Đang chiếu: chỉ cần «Câu tiếp»', '5 · Màn chiếu: tự gửi, đồng hồ tự tính', '6 · Kết thúc buổi học (một chỗ duy nhất)']
  await t.setViewportSize({ width: 2200, height: 1000 })
  await t.setContent(`<body style="margin:0;background:#eef1fa;font-family:sans-serif;padding:24px;display:grid;grid-template-columns:repeat(3,1fr);gap:22px">${anh.map((b, i) => `<figure style="margin:0"><img style="width:100%;display:block;border-radius:12px;box-shadow:0 4px 18px rgb(30 40 80/.15)" src="data:image/jpeg;base64,${b}"><figcaption style="font:700 22px sans-serif;color:#1a1c24;margin-top:10px">${NHAN[i]}</figcaption></figure>`).join('')}</body>`)
  await t.waitForTimeout(200)
  const { buf, q } = await jpg(t, { fullPage: true })
  writeFileSync(join(RA, 'tong-quan.jpg'), buf)
  console.log(`tong-quan.jpg ${Math.round(buf.length / 1024)} KB (q${q})`)
  await ctx.close()
}
await trinh.close(); may.close()
console.log(soat.length ? `SOÁT: ${soat.length} vấn đề\n- ${soat.join('\n- ')}` : 'SOÁT: 0 lỗi trang · 0 tràn ngang · 0 đích chạm nhỏ')
