#!/usr/bin/env node
// ẢNH CHROMIUM THẬT «CHIẾU CHỮA BÀI · GỌI LÊN BẢNG» (thầy 01/11 tối). Dữ liệu GIẢ (to-chieu.ts), tờ dựng bằng đúng mã app.
//   node docs/chieu-chua-goi-0111/chup.mjs
// Ảnh JPG tự hạ chất lượng tới khi ≤ 150 KB, ghi vào docs/chieu-chua-goi-0111/anh/.
// SOÁT (in cuối): lỗi trang · chữ `\frac` thô · TRÀN NGANG khỏi tấm giấy (câu Kc ở 1024/1280/1920 × cỡ chữ mặc định và lớn nhất, cả lúc mở lời giải)
//   · phím L gọi đúng em làm đúng · «Gọi bạn khác» đổi em · tránh em vừa gọi ở câu trước · Esc đóng · câu không ai đúng ⇒ «Thầy chữa» · phím H vẫn thu gọn.
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { createRequire } from 'node:module'

const GOC = resolve(import.meta.dirname, '../..')
const VE = resolve(import.meta.dirname)
const RA = join(VE, 'anh')
const TAM = join(tmpdir(), 'chieu-chua-goi-0111')
mkdirSync(RA, { recursive: true }); mkdirSync(TAM, { recursive: true })
const { chromium } = createRequire(join(GOC, 'package.json'))('playwright')

execFileSync(join(GOC, 'node_modules/.bin/esbuild'), [join(VE, 'to-chieu.ts'), '--bundle', '--platform=node', '--format=esm', `--outfile=${join(TAM, 'to.mjs')}`, '--log-level=warning', '--loader:.css=empty'])
execFileSync('node', [join(TAM, 'to.mjs'), TAM])

const trinh = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const soat = []
const ghi = (x) => { soat.push(x); console.log('  ✗', x) }

async function chup(t, ten) {
  let q = 84, buf
  for (;;) { buf = await t.screenshot({ type: 'jpeg', quality: q }); if (buf.length <= 150_000 || q <= 30) break; q -= 6 }
  writeFileSync(join(RA, `${ten}.jpg`), buf)
  console.log(`${ten}.jpg ${Math.round(buf.length / 1024)} KB`)
}

async function moTo(w, h, { nen = '', co = '' } = {}) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', locale: 'vi-VN' })
  const t = await ctx.newPage()
  t.on('pageerror', (e) => ghi(`${w}×${h}: lỗi trang ${e.message}`))
  await t.goto(`file://${join(TAM, 'to.html')}`)
  await t.waitForSelector('.mc-st'); await t.evaluate(() => document.fonts.ready); await t.waitForTimeout(900)
  const dat = async (id, v) => { await t.evaluate(([i, x]) => { const s = document.getElementById(i); s.value = x; s.dispatchEvent(new Event('change', { bubbles: true })) }, [id, v]); await t.waitForTimeout(500) }
  if (nen) await dat('mc-palette', nen)
  if (co) await dat('mc-size', co)
  return { ctx, t }
}
const toiCau = async (t, n) => { await t.evaluate((k) => window.__mcLenh && window.__mcLenh('H'), 0); await t.waitForTimeout(200); for (let i = 1; i < n; i++) { await t.click('#mc-sau'); await t.waitForTimeout(300) } }

/** Đo tràn ngang của câu đang chiếu: vùng đề + mọi phần tử con không vượt mép trong của tấm giấy. */
async function doTran(t) {
  return t.evaluate(() => {
    const i = window.__mcTrangThai().dot
    const v = document.querySelectorAll('#mc-ray > .mc-dot')[i].querySelector('.mc-vung-de')
    const r = v.getBoundingClientRect(), cs = getComputedStyle(v)
    const phai = r.right - parseFloat(cs.paddingRight) + 1, trai = r.left + parseFloat(cs.paddingLeft) - 1
    const thoRa = [...v.querySelectorAll('.mc-than *, .mc-giai:not([hidden]) *')].filter((e) => { const q = e.getBoundingClientRect(); return q.width > 0 && (q.right > phai || q.left < trai) }).map((e) => `${e.className || e.tagName}+${Math.round(e.getBoundingClientRect().right - phai)}px`)
    return { sw: v.scrollWidth, cw: v.clientWidth, thoRa: thoRa.slice(0, 4), tho: /\\(?:d|t)?frac|\\sqrt|\\dfrac/.test(v.innerText), ngat: v.querySelectorAll('.mc-ngat').length, ps: v.querySelectorAll('.lt-ps').length }
  })
}

// 1) Câu Kc (câu 1/4 sau khi xếp) — 1920 sáng + tối, 1280; soát tràn ở 1024/1280/1920 × cỡ mặc định / lớn nhất, đóng và mở lời giải.
for (const [w, h] of [[1024, 768], [1280, 720], [1920, 1080]]) {
  for (const co of ['', '1.4']) {
    const { ctx, t } = await moTo(w, h, { co })
    for (const giai of [false, true]) {
      if (giai) { await t.keyboard.press('g'); await t.waitForTimeout(500) }
      const d = await doTran(t)
      const nhan = `Kc ${w}×${h} cỡ ${co || 'mặc định'}${giai ? ' + lời giải' : ''}`
      console.log(`${nhan}: phân số ${d.ps} · rộng ${d.sw}/${d.cw} · khối được ngắt ${d.ngat}`)
      if (d.tho) ghi(`${nhan}: còn chữ \\frac thô`)
      if (d.ps < 4) ghi(`${nhan}: chỉ ${d.ps} phân số`)
      if (d.sw > d.cw + 1 || d.thoRa.length) ghi(`${nhan}: TRÀN NGANG ${d.sw}/${d.cw} ${d.thoRa.join(' ')}`)
      if (!giai && !co && w === 1280) await chup(t, '02-cau-kc-1280-mac-dinh')
      if (!giai && co && w === 1280) await chup(t, '03-cau-kc-1280-chu-cuc-lon')
      if (giai && !co && w === 1920) {
        for (let k = 0; k < 3; k++) { await t.keyboard.press(' '); await t.waitForTimeout(350) } // hiện hết mục lời giải (Space), cuộn tới phân số của lời giải
        await chup(t, '04-cau-kc-1920-loi-giai')
      }
    }
    await ctx.close()
  }
}
// 1b) Câu THỬ TRÀN (4/4: phương án là phương trình dài một dòng) — mọi khổ × cỡ chữ: không thò khỏi tấm giấy, tự xuống dòng.
for (const [w, h] of [[1024, 768], [1280, 720], [1920, 1080]]) {
  for (const co of ['', '1.4']) {
    const { ctx, t } = await moTo(w, h, { co })
    await toiCau(t, 4); await t.waitForTimeout(700)
    const d = await doTran(t)
    const nhan = `phương trình dài ${w}×${h} cỡ ${co || 'mặc định'}`
    console.log(`${nhan}: rộng ${d.sw}/${d.cw} · khối được ngắt ${d.ngat}`)
    if (d.sw > d.cw + 1 || d.thoRa.length) ghi(`${nhan}: TRÀN NGANG ${d.sw}/${d.cw} ${d.thoRa.join(' ')}`)
    if (co && w === 1280) await chup(t, '10-phuong-trinh-dai-1280-chu-cuc-lon')
    await ctx.close()
  }
}
for (const [nen, ten] of [['', '01-cau-kc-1920-sang'], ['dark', '01-cau-kc-1920-toi']]) {
  const { ctx, t } = await moTo(1920, 1080, { nen })
  await chup(t, ten)
  await ctx.close()
}

// 2) Thẻ tên đông (22 em, có giây) — câu 3/4, 1920 tối dịu; và thu gọn bằng H.
{
  const { ctx, t } = await moTo(1920, 1080, { nen: 'matte-dark' })
  await toiCau(t, 3); await t.waitForTimeout(700)
  const giay = await t.evaluate(() => [...document.querySelectorAll('#mc-ray > .mc-dot')[window.__mcTrangThai().dot].querySelectorAll('.mc-st-ds .mc-st-giay')].map((x) => x.textContent))
  const so = giay.map((x) => parseInt(x, 10)).filter((x) => Number.isFinite(x))
  if (so.some((x, i) => i > 0 && x < so[i - 1])) ghi(`thẻ tên chưa xếp ngắn nhất trước: ${giay.join(' ')}`)
  await chup(t, '05-the-ten-22-em-co-giay-1920')
  await t.keyboard.press('h'); await t.waitForTimeout(250)
  if (!(await t.evaluate(() => document.body.classList.contains('mc-st-gon')))) ghi('phím H không thu gọn thẻ tên')
  await ctx.close()
}

// 3) Gọi lên bảng — câu Kc: L ⇒ em làm đúng; Gọi bạn khác đổi em; Esc đóng; sang câu khác tránh em vừa gọi.
{
  const { ctx, t } = await moTo(1920, 1080)
  const dsDung = async () => t.evaluate(() => [...document.querySelectorAll('#mc-ray > .mc-dot')[window.__mcTrangThai().dot].querySelectorAll('.mc-st-dung li')].map((x) => x.textContent))
  const dung = await dsDung()
  await t.keyboard.press('l'); await t.waitForTimeout(350)
  const ten1 = await t.textContent('#mc-goi-ten')
  if (!dung.includes(ten1)) ghi(`L gọi «${ten1}» không nằm trong danh sách em làm đúng`)
  const ke = await t.textContent('#mc-goi-ke'); const giay = await t.textContent('#mc-goi-giay')
  console.log(`Gọi: ${ke} · ${ten1} · ${giay}`)
  await chup(t, '06-goi-len-bang-1920')
  await t.click('#mc-goi-khac'); await t.waitForTimeout(300)
  const ten2 = await t.textContent('#mc-goi-ten')
  if (ten2 === ten1 || !dung.includes(ten2)) ghi(`«Gọi bạn khác» không đổi sang em đúng khác (${ten1} → ${ten2})`)
  await t.keyboard.press('Escape'); await t.waitForTimeout(200)
  if (!(await t.evaluate(() => document.getElementById('mc-goi').hidden))) ghi('Esc không đóng tấm gọi')
  if ((await t.textContent('#mc-pha')) !== 'CHỮA BÀI') ghi('pha đổi khỏi CHỮA BÀI sau khi gọi')
  // Sang câu 3 (pH): em vừa gọi ở câu Kc không bị gọi lại khi còn em khác (thử 12 lần, mỗi lần gọi lại từ đầu ở câu 1).
  let trung = 0
  for (let k = 0; k < 12; k++) {
    await toiCau(t, 1); await t.keyboard.press('l'); await t.waitForTimeout(80)
    const a = await t.textContent('#mc-goi-ten'); await t.keyboard.press('Escape')
    await toiCau(t, 3); await t.keyboard.press('l'); await t.waitForTimeout(80)
    const b = await t.textContent('#mc-goi-ten'); await t.keyboard.press('Escape')
    if (a === b) trung++
  }
  if (trung) ghi(`gọi lại em vừa gọi ở câu trước ${trung}/12 lần dù còn em khác`)
  await ctx.close()
}

// 4) Câu không em nào đúng ⇒ «Thầy chữa» (câu 2/4), nền tối.
{
  const { ctx, t } = await moTo(1920, 1080, { nen: 'dark' })
  await toiCau(t, 2); await t.waitForTimeout(700)
  await t.click('#mc-goi-nut'); await t.waitForTimeout(350)
  const ten = await t.textContent('#mc-goi-ten'), moi = await t.textContent('#mc-goi-moi')
  if (ten !== 'Thầy chữa' || !/Chưa em nào làm đúng/.test(moi)) ghi(`câu không ai đúng: «${moi} · ${ten}»`)
  if (await t.isVisible('#mc-goi-khac')) ghi('tấm Thầy chữa vẫn có nút Gọi bạn khác')
  await chup(t, '07-thay-chua-1920-toi')
  await ctx.close()
}
{ // 5) Tấm gọi ở 1280 (máy chiếu nhỏ).
  const { ctx, t } = await moTo(1280, 720)
  await t.keyboard.press('l'); await t.waitForTimeout(350)
  await chup(t, '08-goi-len-bang-1280')
  await ctx.close()
}

// 6) Phiếu in (cùng chuHtml): câu Kc + lời giải, sáng / tối.
for (const toi of [false, true]) {
  const ctx = await trinh.newContext({ viewport: { width: 900, height: 1100 }, colorScheme: toi ? 'dark' : 'light', reducedMotion: 'reduce', locale: 'vi-VN' })
  const t = await ctx.newPage()
  t.on('pageerror', (e) => ghi(`phiếu: lỗi trang ${e.message}`))
  await t.goto(`file://${join(TAM, 'phieu.html')}`)
  await t.waitForTimeout(600)
  const kq = await t.evaluate(() => ({ tho: /\\(?:d|t)?frac/.test(document.body.innerText), ps: document.querySelectorAll('.lt-ps').length, tran: document.documentElement.scrollWidth > innerWidth + 1 }))
  if (kq.tho) ghi('phiếu còn chữ \\frac thô')
  if (kq.tran) ghi('phiếu tràn ngang')
  console.log(`phiếu ${toi ? 'tối' : 'sáng'}: ${kq.ps} phân số`)
  await t.evaluate(() => { const c = [...document.querySelectorAll('.q-text')].find((x) => /hằng số cân bằng/.test(x.textContent)); c?.closest('.q-card, .the-cau, section, article')?.scrollIntoView({ block: 'start' }) })
  await t.waitForTimeout(200)
  await chup(t, `09-phieu-cau-kc-${toi ? 'toi' : 'sang'}`)
  await ctx.close()
}

await trinh.close()
console.log(soat.length ? `SOÁT: ${soat.length} vấn đề\n- ${soat.join('\n- ')}` : 'SOÁT: 0 lỗi trang · 0 \\frac thô · 0 tràn ngang · gọi lên bảng / Thầy chữa / H đúng')
process.exitCode = soat.length ? 1 : 0
