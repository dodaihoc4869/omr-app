// SOI THẬT BẰNG CHROMIUM mục "Bài tập về nhà đã giao" thiết kế lại (Code 1, 21/09/2026; đề §4 + §6.3): 0 tràn ngang, 0 chồng chữ ở 1280 · 1440 · 390, sáng + tối, năm cảnh giả.
// Chạy: `npm run dev` (cổng 5173) rồi `node scripts/soi-btvn-da-giao.mjs [--anh]`. `--anh` chụp ảnh bằng chứng JPG ≤ 150 KB vào docs/anh-btvn-da-giao-2109/. Thoát mã 1 nếu có tràn / chồng chữ.
import { chromium } from 'playwright'
import { mkdirSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const GOC = process.env.GOC_XEM_THU || 'http://localhost:5173'
const TRANG = (canh, extra = '') => `${GOC}/src/components/xem-thu/btvn-da-giao.html?canh=${canh}&vo=1${extra}`
const CANH = ['binh-thuong', 'cham', 'khong-chang', 'qua-han', 'may-cu']
const MAN = [{ ten: '1280', w: 1280, h: 800 }, { ten: '1440', w: 1440, h: 900 }, { ten: '390', w: 390, h: 844 }]
const chup = process.argv.includes('--anh')
const RA = 'docs/anh-btvn-da-giao-2109'
if (chup) mkdirSync(RA, { recursive: true })

/** Chạy TRONG trang: tràn ngang + chồng chữ (khung dòng chữ thật của các nút văn bản khác cha, giao nhau > 3 px). */
function kiemTra() {
  const ra = { tran: [], chong: [], nho: [] }
  const vw = document.documentElement.clientWidth
  if (document.documentElement.scrollWidth > vw + 1) ra.tran.push(`trang rộng ${document.documentElement.scrollWidth} > ${vw}`)
  const goc = document.querySelector('.btg')
  if (!goc) { ra.tran.push('không có .btg'); return ra }
  for (const e of goc.querySelectorAll('*')) {
    const r = e.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) continue
    const cs = getComputedStyle(e)
    if (cs.position === 'fixed') continue
    if (r.right > vw + 1 && !e.closest('.btg-tab-hang')) ra.tran.push(`${e.className || e.tagName} phải ${Math.round(r.right)} > ${vw}`)
  }
  const dong = []
  const walker = document.createTreeWalker(goc, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = (n.textContent || '').trim()
    if (!t) continue
    const cha = n.parentElement
    if (!cha || getComputedStyle(cha).visibility === 'hidden' || cha.closest('.btg-an-chu')) continue
    const range = document.createRange()
    range.selectNodeContents(n)
    for (const q of range.getClientRects()) if (q.width > 2 && q.height > 2) dong.push({ cha, t: t.slice(0, 24), q })
  }
  for (let i = 0; i < dong.length; i++) for (let j = i + 1; j < dong.length; j++) {
    const a = dong[i], b = dong[j]
    if (a.cha === b.cha || a.cha.contains(b.cha) || b.cha.contains(a.cha)) continue
    const x = Math.min(a.q.right, b.q.right) - Math.max(a.q.left, b.q.left)
    const y = Math.min(a.q.bottom, b.q.bottom) - Math.max(a.q.top, b.q.top)
    if (x > 3 && y > 3) ra.chong.push(`“${a.t}” × “${b.t}” (${Math.round(x)}×${Math.round(y)})`)
  }
  for (const e of goc.querySelectorAll('button, input, [role="menuitem"]')) {
    const r = e.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    if (e.classList.contains('btg-doan')) continue // đoạn thanh nhóm: đã có mục chú giải cùng việc ở đích ≥ 44 px
    if (Math.min(r.width, r.height) < 43.5) ra.nho.push(`${e.className || e.tagName} ${Math.round(r.width)}×${Math.round(r.height)}`)
  }
  return ra
}

const trinhDuyet = await chromium.launch({ headless: true })
let loi = 0
for (const sang of ['light', 'dark']) {
  for (const m of MAN) {
    const ngu = await trinhDuyet.newContext({ viewport: { width: m.w, height: m.h }, colorScheme: sang, deviceScaleFactor: 1, hasTouch: m.w < 600, isMobile: false })
    const p = await ngu.newPage()
    for (const canh of CANH) {
      await p.goto(TRANG(canh), { waitUntil: 'networkidle' })
      await p.waitForSelector('.btg article', { timeout: 15000 })
      await p.addStyleTag({ content: '*{animation:none!important;transition:none!important}' })
      const r = await p.evaluate(kiemTra)
      const dong = (k, ds) => ds.length ? (loi++, console.log(`✗ ${sang} ${m.ten} ${canh} ${k}: ${ds.slice(0, 4).join(' | ')}`)) : 0
      dong('TRÀN', r.tran); dong('CHỒNG CHỮ', r.chong); dong('ĐÍCH < 44', r.nho)
    }
    await ngu.close()
  }
}
if (chup) {
  const luu = async (p, ten) => {
    const png = `${RA}/${ten}.png`, jpg = `${RA}/${ten}.jpg`
    await p.screenshot({ path: png })
    // JPG ≤ 150 KB (luật ảnh bằng chứng): hạ chất lượng dần tới khi đủ nhỏ.
    for (const q of [72, 62, 52, 42, 34]) {
      execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', String(q), png, '--out', jpg], { stdio: 'ignore' })
      if (statSync(jpg).size <= 148 * 1024) break
    }
    execFileSync('rm', ['-f', png])
    console.log('ảnh', jpg)
  }
  const mo = async (sang, w, h, canh, extra = '') => {
    const ngu = await trinhDuyet.newContext({ viewport: { width: w, height: h }, colorScheme: sang, deviceScaleFactor: 1 })
    const p = await ngu.newPage()
    await p.goto(TRANG(canh, extra), { waitUntil: 'networkidle' })
    await p.waitForSelector('.btg article')
    await p.addStyleTag({ content: '*{animation:none!important;transition:none!important}' })
    return { p, ngu }
  }
  for (const sang of ['light', 'dark']) { const { p, ngu } = await mo(sang, 1280, 800, 'binh-thuong'); await luu(p, `1280-${sang === 'light' ? 'sang' : 'toi'}`); await ngu.close() }
  { const { p, ngu } = await mo('light', 390, 844, 'binh-thuong'); await luu(p, '390-sang'); await ngu.close() }
  { const { p, ngu } = await mo('light', 1280, 800, 'binh-thuong'); await p.getByRole('button', { name: /Xem \d+ em này/ }).first().click(); await luu(p, 'ngan-danh-sach-em-1280'); await ngu.close() }
  { const { p, ngu } = await mo('light', 1280, 800, 'binh-thuong'); await p.getByRole('button', { name: /Thêm thao tác/ }).first().click(); await p.getByRole('menuitem', { name: 'Đổi hạn nộp' }).click(); await luu(p, 'hop-doi-han-nop-1280'); await ngu.close() }
  { const { p, ngu } = await mo('light', 1280, 800, 'binh-thuong'); await p.getByRole('button', { name: /Thêm thao tác/ }).first().click(); await p.getByRole('menuitem', { name: 'Thu hồi' }).click(); await luu(p, 'hop-xac-nhan-thu-hoi-1280'); await ngu.close() }
}
await trinhDuyet.close()
console.log(loi === 0 ? 'ĐẠT: 0 tràn ngang, 0 chồng chữ, đích ≥ 44 px ở 3 cỡ × sáng/tối × 5 cảnh' : `CÓ ${loi} lỗi`)
process.exit(loi === 0 ? 0 : 1)
