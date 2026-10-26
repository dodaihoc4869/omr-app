#!/usr/bin/env node
// CHỤP + ĐO LÀN B ĐỢT 16 — mọi màn làm bài của học sinh ở 3 khung: điện thoại dọc 390×844, điện thoại xoay ngang 844×390, máy tính 1440×900.
//   npx vite build --config scripts/chup-trong-lam-bai/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-trong-lam-bai/chup.mjs <thư mục tạm> <thư mục ảnh> [cảnh,cảnh…]
// Mỗi ảnh kèm số đo: cuộn ngang (trang + khung cuộn), đích chạm < 44 px trong khung nhìn, nút chính (Nộp…) nằm trong khung nhìn hay không.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.argv[2] ?? 'dist-chup-lan-b')
const ANH = resolve(process.argv[3] ?? 'anh-lan-b')
const CHON = (process.argv[4] ?? '').split(',').filter(Boolean)
mkdirSync(ANH, { recursive: true })
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const PUB = resolve(import.meta.dirname, '../../public')
const may = createServer((req, res) => {
  const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = join(DIST, duong), pub = join(PUB, duong)
  const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-trong-lam-bai/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' })
  res.end(readFileSync(tep))
}).listen(0)
const goc = `http://127.0.0.1:${may.address().port}`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })

const KHUNG_DU = [
  { ten: 'doc', w: 390, h: 844, cham: true },
  { ten: 'ngang', w: 844, h: 390, cham: true },
  { ten: 'may-tinh', w: 1440, h: 900, cham: false },
]
KHUNG_DU.push({ ten: 'bang-doc', w: 1024, h: 1366, cham: true }) // chỉ chụp khi KHO=bang-doc
const KHUNG = process.env.KHO ? KHUNG_DU.filter((k) => process.env.KHO.split(',').includes(k.ten)) : KHUNG_DU.slice(0, 3)
/** Cảnh: đường dẫn, chờ gì, thao tác trước khi chụp, chữ của nút chính phải thấy. */
const CANH = [
  { ten: 'lam-tn', url: '?man=lam13', cho: (t) => t.getByRole('heading', { name: /Câu 1\/6/ }).waitFor(), lam: async (t) => { await t.getByRole('radio').nth(1).click() }, nut: /Nộp câu/ },
  { ten: 'lam-ds', url: '?man=lam13&lam=ds-dau', cho: (t) => t.getByRole('heading', { name: /Câu 1\/3/ }).waitFor(), lam: async (t) => { await t.getByRole('button', { name: /^Đúng/ }).first().click() }, nut: /ý chưa chọn|Nộp câu/ },
  { ten: 'lam-tln', url: '?man=lam13&lam=ds-dau', cho: (t) => t.getByRole('heading', { name: /Câu 1\/3/ }).waitFor(), lam: async (t) => {
      for (const [i, v] of ['Đúng', 'Đúng', 'Đúng', 'Sai'].entries()) await t.getByRole('button', { name: new RegExp(`^${v}`) }).nth(i).click()
      await t.getByRole('button', { name: /^Nộp câu/ }).click(); await t.getByRole('button', { name: /Câu tiếp theo/ }).click()
      await t.getByRole('radio').nth(1).click(); await t.getByRole('button', { name: /^Nộp câu/ }).click(); await t.getByRole('button', { name: /Câu tiếp theo/ }).click()
      await t.getByRole('heading', { name: /Câu 3\/3/ }).waitFor(); await t.keyboard.type('1,2')
    }, nut: /Nộp câu/ },
  { ten: 'lam-ds-ket', url: '?man=lam13&lam=ds-dau', cho: (t) => t.getByRole('heading', { name: /Câu 1\/3/ }).waitFor(), lam: async (t) => {
      for (const [i, v] of ['Đúng', 'Đúng', 'Đúng', 'Đúng'].entries()) await t.getByRole('button', { name: new RegExp(`^${v}`) }).nth(i).click()
      await t.getByRole('button', { name: /^Nộp câu/ }).click(); await t.getByRole('button', { name: /Xem lời giải đầy đủ/ }).click()
    }, nut: /Câu tiếp theo/ },
  { ten: 'lam-sai', url: '?man=lam13', cho: (t) => t.getByRole('heading', { name: /Câu 1\/6/ }).waitFor(), lam: async (t) => { await t.getByRole('radio').nth(2).click(); await t.getByRole('button', { name: /^Nộp câu/ }).click(); await t.getByRole('button', { name: /Câu tiếp theo/ }).waitFor() }, nut: /Câu tiếp theo/ },
  // 26/10 kiểu Duolingo: làm hết chặng (sai câu 5) ⇒ "Làm lại câu sai" ⇒ câu cùng dạng đã làm đúng ⇒ (ket-chang) kết chặng có ô số.
  { ten: 'lam-lai', url: '?man=lam13&lam=lam-lai', cho: (t) => t.getByRole('heading', { name: /Câu 1\/6/ }).waitFor(), lam: (t) => lamHetChang(t, false), nut: /Kết thúc chặng/ },
  { ten: 'ket-chang', url: '?man=lam13&lam=lam-lai', cho: (t) => t.getByRole('heading', { name: /Câu 1\/6/ }).waitFor(), lam: (t) => lamHetChang(t, true), nut: /Học tiếp/ },
  { ten: 'cau-on', url: '?man=cauon', cho: (t) => t.getByRole('heading', { name: 'Câu 1' }).waitFor(), nut: /^(Nộp|Kiểm tra)/ },
  { ten: 'luyen-de', url: '?man=luyende', cho: async (t) => { await t.getByText('Em đã học xong toàn bộ chương trình.').click(); await t.getByRole('button', { name: /Bắt đầu \/ Tiếp tục/ }).click(); await t.getByText('PHẦN I', { exact: true }).waitFor() }, nut: /^Nộp bài$/ },
  { ten: 'ldct', url: '?man=ldct', cho: async (t) => { await t.getByRole('button', { name: /Bắt đầu đề mới|Làm tiếp/ }).click(); await t.locator('#ldct-cau-q1, [id^="ldct-cau"]').first().waitFor() }, nut: /^Nộp bài/ },
  { ten: 'tu-luyen', url: '?man=tuluyen-lam', cho: (t) => t.getByText(/Thuỷ phân hoàn toàn 8,8 gam/).first().waitFor(), nut: /^Nộp/ },
  { ten: 'cdl', url: '?man=cdl', cho: (t) => t.getByRole('heading', { name: 'Câu đã làm' }).waitFor(), nut: null },
  { ten: 'chua', url: '?man=chua', cho: (t) => t.getByText(/Em tự làm lại câu này/).first().waitFor(), lam: async (t) => { await t.getByRole('button', { name: /8,2 gam/ }).first().click() }, nut: /^Kiểm tra/ },
  { ten: 'chua-xong', url: '?man=chua', cho: (t) => t.getByText(/Em tự làm lại câu này/).first().waitFor(), lam: async (t) => { await t.getByRole('button', { name: /8,2 gam/ }).first().click(); await t.getByRole('button', { name: /^Kiểm tra/ }).click(); await t.getByText(/Em đã tự sửa xong câu này/).first().waitFor() }, nut: null },
  { ten: 'ktcn', url: '?man=ktcn', cho: (t) => t.getByText(/Chặng 2/).first().waitFor(), nut: null },
  { ten: 'ktcn-ket', url: '?man=ktcn-ket', cho: (t) => t.getByText(/8,25|Ester – Lipid/).first().waitFor(), nut: null },
  { ten: 'kq', url: '?man=kq', cho: (t) => t.getByText('Ba phần của bài').waitFor(), nut: /Xem báo cáo/ },
  { ten: 'kq-cho', url: '?man=kq-cho', cho: (t) => t.getByText(/Em đã nộp bài/).first().waitFor(), nut: null },
  { ten: 'thi-ds', url: '?man=thi', cho: (t) => t.locator('#cau-5').waitFor({ timeout: 20000 }), lam: async (t) => { await t.locator('#cau-5').scrollIntoViewIfNeeded(); await t.evaluate(() => document.getElementById('cau-5').scrollIntoView({ block: 'start' })); await t.waitForTimeout(400) }, nut: /^Nộp bài/ },
  { ten: 'thi-tln', url: '?man=thi', cho: (t) => t.locator('#cau-7').waitFor({ timeout: 20000 }), lam: async (t) => { await t.evaluate(() => document.getElementById('cau-7').scrollIntoView({ block: 'start' })); await t.waitForTimeout(400) }, nut: /^Nộp bài/ },
  { ten: 'thi-luoi', url: '?man=thi', cho: (t) => t.locator('#cau-1').waitFor({ timeout: 20000 }), lam: async (t) => { await t.getByRole('button', { name: 'Danh sách câu' }).first().click(); await t.waitForTimeout(300) }, nut: null },
  { ten: 'thi-nop', url: '?man=thi', cho: (t) => t.locator('#cau-1').waitFor({ timeout: 20000 }), lam: async (t) => { await t.getByRole('button', { name: /^Nộp bài$/ }).first().click(); await t.waitForTimeout(300) }, nut: null },
  { ten: 'thi', url: '?man=thi', cho: (t) => t.locator('#cau-1').waitFor({ timeout: 20000 }), lam: async (t) => { await t.waitForTimeout(600) }, nut: /^Nộp bài/ },
]

/** Làm 6 câu chặng lam-lai (sai câu 5 — chọn A, đáp án B), vào vòng Làm lại, làm đúng câu cùng dạng; `ket` ⇒ bấm Kết thúc chặng. */
async function lamHetChang(t, ket) {
  for (let i = 1; i <= 6; i++) {
    await t.getByRole('heading', { name: new RegExp(`Câu ${i}/6`) }).waitFor()
    const tu = t.getByRole('button', { name: 'Tự làm câu này' })
    if (await tu.count()) await tu.click()
    if (i === 4) { for (const [j, v] of ['Đúng', 'Đúng', 'Đúng', 'Sai'].entries()) await t.getByRole('button', { name: new RegExp(`^${v}`) }).nth(j).click() }
    else if (i === 6) await t.keyboard.type('1,2')
    else await t.getByRole('radio').nth(i === 5 ? 0 : i === 2 ? 1 : i === 3 ? 1 : 0).click()
    await t.getByRole('button', { name: /^Nộp câu/ }).click()
    await t.getByRole('button', { name: i < 6 ? /Câu tiếp theo/ : /Làm lại câu sai/ }).click()
  }
  await t.getByRole('heading', { name: /Làm lại · Câu 1\/1/ }).waitFor()
  await t.getByRole('radio').nth(2).click()
  await t.getByRole('button', { name: /^Nộp câu/ }).click()
  await t.getByText('Làm lại đúng').first().waitFor()
  if (ket) { await t.getByRole('button', { name: /Kết thúc chặng/ }).click(); await t.getByText('Đúng liên tiếp dài nhất').waitFor() }
  await t.evaluate(() => document.querySelector('.ht2-lam')?.scrollIntoView({ block: 'start' }))
}

const bao = []
for (const c of CANH) {
  if (CHON.length && !CHON.includes(c.ten)) continue
  for (const k of KHUNG) {
    for (const toi of process.env.TOI === 'chi' ? [true] : [false, ...(process.env.TOI ? [true] : [])]) {
      const ctx = await trinh.newContext({ viewport: { width: k.w, height: k.h }, deviceScaleFactor: 1, hasTouch: k.cham, isMobile: k.cham, colorScheme: toi ? 'dark' : 'light' })
      await ctx.route((u) => !u.href.startsWith(goc), (r) => r.abort())
      const t = await ctx.newPage()
      t.setDefaultTimeout(12000)
      const loi = []
      t.on('pageerror', (e) => loi.push(e.message))
      const ten = `${c.ten}-${k.ten}${toi ? '-toi' : ''}`
      try {
        await t.goto(`${goc}/scripts/chup-trong-lam-bai/trang.html${c.url}&vai=hocsinh${toi ? '&toi=1' : ''}${process.env.TAT ? '&trong=tat' : ''}`)
        await c.cho(t)
        if (c.lam) await c.lam(t)
        await t.waitForTimeout(500)
        const so = await t.evaluate((nutRe) => {
          const W = innerWidth, H = innerHeight
          const ngang = []
          if (document.documentElement.scrollWidth > W + 1) ngang.push(`trang ${document.documentElement.scrollWidth}`)
          for (const el of document.querySelectorAll('.fixed.inset-0, .overflow-y-auto, [class*="cuon"]')) {
            const cs = getComputedStyle(el)
            if (/(auto|scroll)/.test(cs.overflowY) && el.scrollWidth > el.clientWidth + 1 && cs.overflowX !== 'hidden') ngang.push(`${el.className.toString().slice(0, 40)} ${el.scrollWidth}>${el.clientWidth}`)
          }
          const nho = []
          for (const el of document.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea, [role=radio], [role=checkbox], label')) {
            const r = el.getBoundingClientRect()
            if (!r.width || !r.height || r.bottom < 0 || r.top > H || r.right < 0 || r.left > W) continue
            if (el.tagName === 'INPUT' && (el.type === 'radio' || el.type === 'checkbox') && getComputedStyle(el).opacity === '0') continue
            if (el.tagName === 'LABEL' && !el.querySelector('input')) continue
            if (getComputedStyle(el).visibility === 'hidden') continue
            if (r.height < 43.5 || r.width < 43.5) nho.push(`${(el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 24)} ${Math.round(r.width)}×${Math.round(r.height)}`)
          }
          let nut = 'không cần'
          if (nutRe) {
            const re = new RegExp(nutRe)
            const b = [...document.querySelectorAll('button')].find((x) => re.test((x.textContent || '').trim()))
            if (!b) nut = 'KHÔNG THẤY NÚT'
            else { const r = b.getBoundingClientRect(); nut = r.top >= 0 && r.bottom <= H && r.left >= 0 && r.right <= W ? `trong khung (${Math.round(r.top)}–${Math.round(r.bottom)})` : `NGOÀI khung (${Math.round(r.top)}–${Math.round(r.bottom)})` }
          }
          return { ngang, nho: [...new Set(nho)], nut }
        }, c.nut ? c.nut.source : null)
        await t.screenshot({ path: join(ANH, `${ten}${process.env.TAT ? '-tat' : ''}.jpg`), type: 'jpeg', quality: 62, fullPage: !!process.env.CA_TRANG })
        bao.push(`${ten}: cuộn ngang ${so.ngang.length ? so.ngang.join(' | ') : '0'} · nút chính ${so.nut} · đích nhỏ ${so.nho.length}${so.nho.length ? ' [' + so.nho.slice(0, 8).join('; ') + ']' : ''}${loi.length ? ' · LỖI TRANG ' + loi.join(' / ').slice(0, 160) : ''}`)
      } catch (e) {
        await t.screenshot({ path: join(ANH, `${ten}-HONG.jpg`), type: 'jpeg', quality: 50 }).catch(() => {})
        bao.push(`${ten}: HỎNG ${String(e.message).split('\n')[0].slice(0, 200)}${loi.length ? ' · LỖI TRANG ' + loi.join(' / ').slice(0, 200) : ''}`)
      }
      await ctx.close()
    }
  }
}
writeFileSync(join(ANH, 'bao-cao.txt'), bao.join('\n') + '\n')
console.log(bao.join('\n'))
await trinh.close()
may.close()
