#!/usr/bin/env node
// BẢN VẼ THẺ «NỢ CÂU» (tên đợt: làm bù) (thầy 11/11: «hiện thẻ làm bù … cộng dồn … trả tối thiểu như ngân hàng … tối đa 3 ngày … Vẽ tôi xem rồi build»).
// Chụp bằng Chromium THẬT trên chính màn Hôm nay của app (component thật, dữ liệu GIẢ của scripts/chup-v2); thẻ «Làm bù» là PHẦN VẼ THÊM bằng HTML + CSS
// chèn vào trang (chưa có mã thật — chưa duyệt thì chưa build). Màu chỉ dùng biến sẵn có của app học sinh.
//   npx vite build --config scripts/chup-v2/vite.config.mjs --outDir <thư mục tạm>
//   node docs/ban-ve-lam-bu-1111/chup.mjs <thư mục tạm>
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
const DIST = resolve(process.argv[2] ?? 'dist-chup-v2'), RA = import.meta.dirname, PUB = resolve(RA, '../../public')
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const may = createServer((req, res) => {
  const d = decodeURIComponent(new URL(req.url, 'http://x').pathname), p = join(DIST, d), pub = join(PUB, d)
  const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-v2/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' }); res.end(readFileSync(tep))
}).listen(0)
await new Promise((r) => may.once('listening', r))
const URL0 = `http://127.0.0.1:${may.address().port}/scripts/chup-v2/trang.html?man=hs-mot&tp=1&ns=1&dd=khong`

const CSS = `
.lb-the{margin:0;padding:14px 16px 14px;border-radius:26px;background:var(--tr-chu-y-nhat);box-shadow:inset 0 0 0 2px color-mix(in oklab,var(--tr-chu-y) 45%,transparent);color:var(--tr-chu);display:flex;flex-direction:column;gap:8px}
.lb-the[data-muc='het']{background:var(--tr-sai-nhat);box-shadow:inset 0 0 0 2px color-mix(in oklab,var(--tr-sai) 45%,transparent)}
.lb-the[data-muc='gon']{background:var(--tr-mat-2);box-shadow:inset 0 0 0 2px var(--tr-vien);flex-direction:row;align-items:center;gap:12px;padding:12px 14px 12px 18px}
.lb-dau{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.lb-nhan{font-size:13.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--tr-chu-y-chu)}
.lb-the[data-muc='het'] .lb-nhan{color:var(--tr-sai-chu)}
.lb-chip{font-size:12.5px;font-weight:800;padding:4px 10px;border-radius:999px;background:var(--tr-mat);color:var(--tr-chu-y-chu);box-shadow:inset 0 0 0 1.5px color-mix(in oklab,var(--tr-chu-y) 45%,transparent)}
.lb-the[data-muc='het'] .lb-chip{color:var(--tr-sai-chu);box-shadow:inset 0 0 0 1.5px color-mix(in oklab,var(--tr-sai) 45%,transparent)}
.lb-so{font-size:40px;font-weight:800;line-height:1;letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.lb-so small{font-size:.4em;font-weight:750;letter-spacing:0;color:var(--tr-chu-2);margin-left:6px}
.lb-loai{margin:-2px 0 0;font-size:14px;font-weight:650;color:var(--tr-chu-2)}
.lb-chon{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:2px}
.lb-nut{min-height:56px;padding:8px 14px;border:0;border-radius:18px;background:var(--tr-mat);color:var(--tr-chu);font:inherit;text-align:left;display:flex;flex-direction:column;gap:2px;justify-content:center;box-shadow:inset 0 0 0 2px var(--tr-vien);cursor:pointer}
.lb-nut b{font-size:15.5px;font-weight:800}
.lb-nut span{font-size:13px;font-weight:650;color:var(--tr-chu-3)}
.lb-nut[aria-pressed='true']{box-shadow:inset 0 0 0 3px var(--tr-chu-y-nut)}
.lb-nut[aria-pressed='true'] b{color:var(--tr-chu-y-chu)}
.lb-the[data-muc='het'] .lb-nut[aria-pressed='true']{box-shadow:inset 0 0 0 3px var(--tr-sai)}
.lb-the[data-muc='het'] .lb-nut[aria-pressed='true'] b{color:var(--tr-sai-chu)}
.lb-ghi{margin:0;font-size:13px;font-weight:600;line-height:1.4;color:var(--tr-chu-2)}
.lb-gon-chu{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.lb-gon-chu b{font-size:15.5px;font-weight:800}
.lb-gon-chu span{font-size:13px;font-weight:650;color:var(--tr-chu-3)}
.lb-them{min-height:44px;padding:0 14px;border:0;border-radius:14px;background:var(--tr-mat);color:var(--tr-chu-y-chu);font:inherit;font-size:14px;font-weight:800;box-shadow:inset 0 0 0 2px color-mix(in oklab,var(--tr-chu-y) 45%,transparent);cursor:pointer;white-space:nowrap}
`
const nut = (chon, ten, phu) => `<button type="button" class="lb-nut" aria-pressed="${chon}"><b>${ten}</b><span>${phu}</span></button>`
/** Bốn trạng thái của thẻ. `cta` = [nhãn nhỏ, tiêu đề, dòng phụ, sắc] của nút chính (vẫn CHỈ MỘT nút chính trên Hôm nay). */
const CANH = {
  // Ngày 1 có nợ: 42 câu (nghỉ 1,5 ngày). Tối thiểu kiểu ngân hàng = 25 % số nợ, làm tròn lên, sàn 6 câu: ⌈42 × 25 %⌉ = 11.
  toi_thieu: { the: `<section class="lb-the" aria-label="Nợ câu"><div class="lb-dau"><span class="lb-nhan">Nợ câu</span><span class="lb-chip">Trả tối thiểu: lần 1/3</span></div>
    <div class="lb-so">42<small>câu đang nợ</small></div><p class="lb-loai">Câu mới 20 · Câu sửa 14 · Câu ôn 8</p>
    <div class="lb-chon" role="group" aria-label="Chọn cách trả">${nut(true, 'Trả tối thiểu', '11 câu')}${nut(false, 'Trả hết', '42 câu')}</div>
    <p class="lb-ghi">Tối thiểu = 25 % số nợ, ít nhất 6 câu. Sau 3 lần trả tối thiểu phải trả hết.</p></section>`,
    cta: ['Trả nợ câu trước', 'Trả tối thiểu', '11 câu · khoảng 17 phút', 'chu-y'], dong: 'Trả nợ 11 câu trước, rồi tới 28 câu hôm nay.' },
  tra_het: { the: `<section class="lb-the" aria-label="Nợ câu"><div class="lb-dau"><span class="lb-nhan">Nợ câu</span><span class="lb-chip">Trả tối thiểu: lần 1/3</span></div>
    <div class="lb-so">42<small>câu đang nợ</small></div><p class="lb-loai">Câu mới 20 · Câu sửa 14 · Câu ôn 8</p>
    <div class="lb-chon" role="group" aria-label="Chọn cách trả">${nut(false, 'Trả tối thiểu', '11 câu')}${nut(true, 'Trả hết', '42 câu')}</div>
    <p class="lb-ghi">Trả hết thì hết nợ câu, số lần trả tối thiểu tính lại từ đầu.</p></section>`,
    cta: ['Trả nợ câu trước', 'Trả hết', '42 câu · khoảng 63 phút', 'chu-y'], dong: 'Trả hết 42 câu nợ trước, rồi tới 28 câu hôm nay.' },
  // Đã trả tối thiểu hôm nay ⇒ thẻ thu gọn, bài hôm nay mở.
  da_tra: { the: `<section class="lb-the" data-muc="gon" aria-label="Nợ câu"><div class="lb-gon-chu"><b>Còn nợ 31 câu</b><span>Hôm nay đã trả 11 câu · còn 2 lần trả tối thiểu</span></div><button type="button" class="lb-them">Trả thêm</button></section>`,
    cta: null, dong: null },
  // Ngày thứ tư: hết quyền trả tối thiểu.
  phai_het: { the: `<section class="lb-the" data-muc="het" aria-label="Nợ câu"><div class="lb-dau"><span class="lb-nhan">Nợ câu</span><span class="lb-chip">Hết 3 lần trả tối thiểu</span></div>
    <div class="lb-so">17<small>câu đang nợ</small></div><p class="lb-loai">Câu sửa 9 · Câu ôn 8</p>
    <div class="lb-chon" role="group" aria-label="Chọn cách trả" style="grid-template-columns:1fr">${nut(true, 'Trả hết', '17 câu')}</div>
    <p class="lb-ghi">Em đã trả tối thiểu 3 lần. Hôm nay trả hết nợ câu rồi mới làm bài mới.</p></section>`,
    cta: ['Trả nợ câu trước', 'Trả hết', '17 câu · khoảng 26 phút', 'sai'], dong: 'Trả hết 17 câu nợ, rồi tới 28 câu hôm nay.' },
}
const KHUNG = [
  ['dt-sang-1-tra-toi-thieu', 'toi_thieu', 390, 844, 'light'], ['dt-sang-2-chon-tra-het', 'tra_het', 390, 844, 'light'], ['dt-sang-3-da-tra-toi-thieu', 'da_tra', 390, 844, 'light'],
  ['dt-sang-4-ngay-thu-tu-phai-tra-het', 'phai_het', 390, 844, 'light'], ['dt-toi-1-tra-toi-thieu', 'toi_thieu', 390, 844, 'dark'], ['dt-toi-4-ngay-thu-tu-phai-tra-het', 'phai_het', 390, 844, 'dark'],
  ['mb-sang-1-tra-toi-thieu', 'toi_thieu', 820, 1180, 'light'], ['mt-sang-1-tra-toi-thieu', 'toi_thieu', 1366, 900, 'light'], ['mt-toi-1-tra-toi-thieu', 'toi_thieu', 1366, 900, 'dark'],
]
const CHON = (process.argv[3] ?? '').split(',').filter(Boolean)
const trinh = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
for (const [ten, canh, w, h, nen] of KHUNG) {
  if (CHON.length && !CHON.includes(ten)) continue
  const loi = []
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w > 1000 ? 1.5 : 2, colorScheme: nen, hasTouch: w < 900, locale: 'vi-VN', reducedMotion: 'reduce' })
  const t = await ctx.newPage(); t.on('pageerror', (e) => loi.push(String(e).slice(0, 120)))
  await t.goto(URL0); await t.waitForSelector('.kb-cta', { timeout: 20000 }); await t.evaluate(() => document.fonts.ready)
  const kq = await t.evaluate(({ css, c }) => {
    document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`)
    const hero = document.querySelector('.kb-hero'), cta = document.querySelector('.kb-cta')
    // dữ liệu giả cho khớp chuyện: hôm nay là ngày Học mới, chưa làm câu nào
    hero.setAttribute('data-loai', 'moi'); hero.querySelector('.kb-nhan').textContent = 'Ngày học mới'
    hero.querySelector('.kb-so').innerHTML = '0<small>/28 câu</small>'
    hero.querySelector('.kb-dong-hero').textContent = c.dong ?? 'Còn 28 câu nữa là dung dịch đổi màu.'
    const loi = hero.querySelector('.kb-mol-loi, [class*="loi"] p, [class*="bong"]'); if (loi && c.mol) loi.textContent = c.mol
    // THỨ TỰ KHI CÓ NỢ: lời chào → thẻ «Làm bù» → nút chính → thẻ mức hôm nay (nút chính luôn nằm trong màn đầu của điện thoại 844 px).
    // Đã trả tối thiểu (thẻ gọn): thẻ mức về chỗ cũ ở trên, nút chính là bài hôm nay, thẻ gọn nằm ngay dưới nút chính.
    if (c.cta) { hero.insertAdjacentHTML('beforebegin', c.the); document.querySelector('.lb-the').after(cta); cta.style.margin = '14px 0 18px' }
    else { cta.insertAdjacentHTML('afterend', c.the); document.querySelector('.lb-the').style.marginTop = '14px' } // thẻ gọn nằm DƯỚI nút chính ⇒ nút chính đứng yên chỗ cũ
    const g = cta.querySelector('.kb-giua'), la = [...g.querySelectorAll('*')].filter((e) => !e.children.length && e.textContent.trim())
    // dòng tên dạng của dữ liệu giả (ngày Sửa) không thuộc bản vẽ này
    const di = document.createTreeWalker(g, NodeFilter.SHOW_TEXT); for (let n = di.nextNode(); n; n = di.nextNode()) if (/Khối lượng muối|Sửa nhóm/.test(n.nodeValue)) n.nodeValue = c.cta ? '' : 'Bài 8. Amine'
    if (c.cta) { cta.setAttribute('data-sac', c.cta[3]); la[0].textContent = c.cta[0]; la[1].textContent = c.cta[1]; la[la.length - 1].textContent = c.cta[2] }
    else { cta.setAttribute('data-sac', 'hs'); la[0].textContent = 'Bắt đầu'; la[1].textContent = 'Chặng 1'; la[la.length - 1].textContent = '6 câu · khoảng 9 phút' }
    const tran = document.documentElement.scrollWidth > innerWidth
    const nho = [...document.querySelectorAll('.lb-the button, .kb-cta')].filter((b) => { const r = b.getBoundingClientRect(); return r.width && r.height && (r.width < 44 || r.height < 44) }).map((b) => b.textContent.trim().slice(0, 20))
    scrollTo(0, 0); document.querySelector('.dm-khung')?.scrollTo?.(0, 0)
    return { tran, nho, ctaChu: [...document.querySelector('.kb-cta .kb-giua').querySelectorAll('*')].filter((e) => !e.children.length).map((e) => e.textContent) }
  }, { css: CSS, c: CANH[canh] })
  await t.waitForTimeout(300)
  let q = 84, buf
  do { buf = await t.screenshot({ type: 'jpeg', quality: q }); q -= 8 } while (buf.length > 150_000 && q > 30)
  writeFileSync(join(RA, `${ten}.jpg`), buf)
  console.log(`${ten}.jpg ${Math.round(buf.length / 1024)} KB · lỗi trang ${loi.length} · tràn ngang ${kq.tran ? 'CÓ' : 'không'} · đích bấm < 44 px: ${kq.nho.length} · nút chính: ${kq.ctaChu.join(' | ')}`)
  await ctx.close()
}
await trinh.close(); may.close()
