// Chụp bản vẽ Mol «kẹo dẻo» (01/11): node docs/ban-ve-mol-keo-deo-0111/chup.cjs ⇒ anh/*.jpg (mỗi ảnh ≤ 150 KB).
// Cần playwright (node_modules của repo) + Chromium /opt/pw-browsers/chromium (như docs/ban-ve-mol-0111/chup.cjs).
// Ảnh «cu-moi»: chụp bản ống nghiệm CŨ (bị chê) thẳng từ nhánh origin/claude/mol-v2-0111 (git show ⇒ thư mục tạm) rồi chèn cạnh bản mới.
const { chromium } = require('playwright')
const path = require('path'), fs = require('fs'), os = require('os'), { execFileSync } = require('child_process')
const RA = path.join(__dirname, 'anh'); fs.mkdirSync(RA, { recursive: true })
const TEP = 'file://' + path.join(__dirname, 'mol-keo-deo.html')
const TRAN = 148 * 1000 // ≤ 150 KB theo cả hai cách tính
async function luu(chup, ten) { // hạ chất lượng tới khi ≤ 150 KB
  for (let q = 88; ; q -= 6) {
    const buf = await chup({ type: 'jpeg', quality: q })
    if (buf.length <= TRAN || q <= 34) { fs.writeFileSync(path.join(RA, ten), buf); return `${ten} ${Math.round(buf.length / 1000)} KB q${q}` }
  }
}
/** Bản cũ: lấy mol-v2.html từ nhánh cũ, sửa đường dẫn phông, chụp 4 mặt (to + 64 px) ⇒ data URI PNG. */
async function anhCu(b) {
  const goc = path.resolve(__dirname, '../..')
  let html
  try { html = execFileSync('git', ['show', 'origin/claude/mol-v2-0111:docs/ban-ve-mol-v2-0111/mol-v2.html'], { cwd: goc, encoding: 'utf8' }) } catch { console.log('Không lấy được bản cũ (thiếu nhánh origin/claude/mol-v2-0111) ⇒ bỏ ảnh cũ'); return null }
  html = html.replaceAll('url(../../src/styles/phong-ddh/', `url(file://${path.join(goc, 'src/styles/phong-ddh')}/`)
  const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'mol-cu-')), tep = path.join(tam, 'mol-v2.html')
  fs.writeFileSync(tep, html)
  const p = await b.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 2, reducedMotion: 'reduce' })
  await p.goto('file://' + tep); await p.evaluate(() => document.fonts.ready)
  await p.evaluate(() => { // eslint-disable-next-line no-undef
    document.body.innerHTML = `<div id="x" style="display:flex;gap:20px;padding:30px 20px 10px">${['vui', 'khen', 'buon', 'cau'].map((m) => sv('A', m, 124, 143)).join('')}</div><div id="y" style="display:flex;gap:20px;padding:10px 20px">${['vui', 'khen', 'buon', 'cau'].map((m) => sv('A', m, 64, 74)).join('')}</div>`
  })
  await p.waitForTimeout(150)
  const chup = async (sel) => { const ds = []; for (const el of await p.locator(sel).all()) ds.push('data:image/png;base64,' + (await el.screenshot({ omitBackground: true })).toString('base64')); return ds }
  const kq = { lon: await chup('#x svg'), nho: await chup('#y svg') }
  await p.close(); fs.rmSync(tam, { recursive: true, force: true })
  return kq
}
;(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  const mo = async (hoi, w, h, dsf) => {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dsf, reducedMotion: 'reduce' })
    const loi = []; p.on('pageerror', (e) => loi.push(String(e)))
    await p.goto(TEP + hoi); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150)
    const tran = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    if (loi.length || tran > 0) console.log('LỖI', hoi, loi, 'tràn ngang', tran)
    return p
  }
  const kq = []
  const cu = await anhCu(b)
  const sang = await mo('', 1240, 900, 1.5)
  if (cu) { await sang.evaluate(([l, n]) => window.chenCu(l, n), [cu.lon, cu.nho]); await sang.waitForTimeout(150) }
  kq.push(await luu((o) => sang.locator('#cu-moi').screenshot(o), 'cu-moi.jpg'))
  kq.push(await luu((o) => sang.locator('#cam-xuc').screenshot(o), 'cam-xuc-sang.jpg'))
  kq.push(await luu((o) => sang.locator('#mau-thu').screenshot(o), 'mau-thu.jpg'))
  await sang.close()
  const nho = await mo('', 1240, 900, 2) // cỡ nhỏ: 2× để thầy soi đúng độ nét 28/40/64 px trên máy thật
  kq.push(await luu((o) => nho.locator('#co-nho').screenshot(o), 'co-nho.jpg'))
  await nho.close()
  const toi = await mo('?toi', 1240, 900, 1.5)
  kq.push(await luu((o) => toi.locator('#cam-xuc').screenshot(o), 'cam-xuc-toi.jpg'))
  await toi.close()
  const dt = await mo('?lo-trinh&toi', 390, 844, 2)
  kq.push(await luu((o) => dt.locator('#dt').screenshot(o), 'lo-trinh-toi.jpg'))
  await dt.close()
  console.log(kq.join('\n'))
  await b.close()
})()
