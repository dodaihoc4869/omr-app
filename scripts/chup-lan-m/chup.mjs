#!/usr/bin/env node
// CHỤP ẢNH ĐỢT 19 · LÀN M bằng Chromium THẬT (Playwright), dữ liệu GIẢ (trang.tsx + gia.ts). Mỗi ảnh JPG tự hạ chất lượng tới khi ≤ 150 KB.
//   npx vite build --config scripts/chup-lan-m/vite.config.mjs --outDir <tạm> && node scripts/chup-lan-m/chup.mjs <tạm> docs/anh-dot19
// Ảnh: bo-huy-hieu (12 huy hiệu × 20/32/72 px × nền sáng/tối, MỘT ảnh) · tam-12-bac-doc (390×844, bậc 3) · tam-12-bac-may-tinh (1440×900 tối, bậc 11)
//      · man-chieu-huy-hieu · ds-theo-bac-may-tinh (1440×900) · ds-theo-bac-doc (390×844).
// SOÁT (không lưu ảnh): mỗi tấm × 390×844 · 844×390 · 1440×900 × sáng/tối — lỗi trang, tràn ngang, tấm nằm trong khung nhìn, tiêu điểm ở nút Đóng,
// đích chạm < 44 px (chip bậc, ô dải đếm, nút Đóng, thẻ em), Esc đóng + trả tiêu điểm. Thoát mã 1 nếu có vấn đề.
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { ghepDoc, moMay } from './phuc-vu.mjs'

const DIST = resolve(process.argv[2] ?? 'dist-chup-lan-m')
const RA = resolve(process.argv[3] ?? 'docs/anh-dot19')
mkdirSync(RA, { recursive: true })
const { goc, trinh, dong } = await moMay(DIST)
const loi = []

async function moTrang(q, w, hgt, nen, tl = 1) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: hgt }, deviceScaleFactor: tl, colorScheme: nen, reducedMotion: 'reduce', locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' })
  const t = await ctx.newPage()
  t.on('pageerror', (e) => loi.push(`${q} ${w}×${hgt} ${nen}: lỗi trang ${e.message}`))
  await t.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort())
  await t.goto(`${goc}?${q}`)
  await t.evaluate(() => document.fonts.ready)
  return { ctx, t }
}

async function luuJpg(t, ten, opt = {}) {
  for (const q of [80, 72, 62, 52, 44, 36, 28]) {
    const buf = await t.screenshot({ type: 'jpeg', quality: q, ...opt })
    if (buf.length <= 150 * 1024 || q === 28) {
      writeFileSync(join(RA, `${ten}.jpg`), buf)
      console.log(`${ten}.jpg ${(buf.length / 1024).toFixed(0)} KB (q${q})`)
      return
    }
  }
}

/** Mở tấm: hs/ph bấm chip bậc; gv bấm ô dải đếm (bậc từ `tuBac` trở lên) có nhiều em nhất. */
async function moTam(t, canh, tuBac = 1) {
  if (canh === 'gv') {
    await t.locator('.bcc-dem-nut').first().waitFor({ timeout: 20000 })
    const bac = await t.evaluate((tuBac) => {
      const ds = [...document.querySelectorAll('.bcc-dem-o[data-nut]')].map((o) => ({ bac: Number(o.getAttribute('data-bac')), n: Number(o.querySelector('b')?.textContent?.replace(/\D/g, '') ?? 0) })).filter((x) => x.bac >= tuBac)
      return ds.reduce((a, b) => (b.n > a.n ? b : a)).bac
    }, tuBac)
    const nut = t.locator(`.bcc-dem-o[data-bac="${bac}"] .bcc-dem-nut`)
    await nut.scrollIntoViewIfNeeded()
    await nut.click()
  } else {
    const nut = t.locator('.bcc-nut').first()
    await nut.waitFor({ timeout: 20000 })
    await nut.scrollIntoViewIfNeeded()
    await nut.click()
  }
  await t.locator('.bcc-tam').waitFor({ timeout: 20000 })
  await t.waitForTimeout(350)
}

async function soatTam(t, nhan, canh) {
  const r = await t.evaluate((canh) => {
    const vw = document.documentElement.clientWidth, vh = window.innerHeight
    const tam = document.querySelector('.bcc-tam')
    const hop = tam?.getBoundingClientRect()
    const nho = [...document.querySelectorAll('.bcc-tam-dong, .bcc-ds-em, .bcc-nut, .bcc-dem-nut')]
      .map((b) => b.getBoundingClientRect()).filter((x) => x.width > 0 && x.height > 0 && (x.height < 44 || x.width < 44)).length
    const tran = [...(tam?.querySelectorAll('*') ?? [])].filter((x) => x.getBoundingClientRect().right > vw + 1).length
    return {
      tranNgang: document.documentElement.scrollWidth - vw,
      ngoai: hop ? hop.left < -1 || hop.right > vw + 1 || hop.top < -1 || hop.bottom > vh + 1 : true,
      tieuDiem: document.activeElement?.classList.contains('bcc-tam-dong') ?? false,
      dialog: !!document.querySelector('[role="dialog"][aria-modal="true"]'),
      nho, tran,
      dong: canh === 'gv' ? document.querySelectorAll('.bcc-ds-o').length : document.querySelectorAll('.bcc-tam-bac').length,
    }
  }, canh)
  if (r.tranNgang > 0) loi.push(`${nhan}: tràn ngang ${r.tranNgang}px`)
  if (r.ngoai) loi.push(`${nhan}: tấm ra ngoài khung nhìn`)
  if (!r.tieuDiem) loi.push(`${nhan}: tiêu điểm không ở nút Đóng`)
  if (!r.dialog) loi.push(`${nhan}: thiếu role=dialog aria-modal`)
  if (r.nho) loi.push(`${nhan}: ${r.nho} nút dưới 44 px`)
  if (r.tran) loi.push(`${nhan}: ${r.tran} phần tử trong tấm vượt mép phải`)
  if (canh !== 'gv' && r.dong !== 12) loi.push(`${nhan}: tấm có ${r.dong} dòng bậc (cần 12)`)
  if (canh === 'gv' && r.dong < 1) loi.push(`${nhan}: danh sách em trống`)
  // Esc đóng + trả tiêu điểm về nút đã bấm
  await t.keyboard.press('Escape')
  await t.waitForTimeout(150)
  const sau = await t.evaluate(() => ({ con: !!document.querySelector('.bcc-tam'), ve: !!document.activeElement?.matches('.bcc-nut, .bcc-dem-nut') }))
  if (sau.con) loi.push(`${nhan}: Esc không đóng tấm`)
  if (!sau.ve) loi.push(`${nhan}: đóng tấm không trả tiêu điểm về nút`)
}

// 1 · bộ huy hiệu (sáng + tối ghép một ảnh)
{
  const anh = []
  for (const nen of ['light', 'dark']) {
    const { ctx, t } = await moTrang('man=bo', 1100, 400, nen, 1)
    await t.locator('#bo').waitFor()
    anh.push(await t.locator('#bo').screenshot({ type: 'png' }))
    await ctx.close()
  }
  const png = await ghepDoc(trinh, anh)
  const ctx = await trinh.newContext({ viewport: { width: 1200, height: 600 } })
  const t = await ctx.newPage()
  await t.setContent(`<body style="margin:0"><img id="a" style="display:block" src="data:image/png;base64,${png.toString('base64')}"></body>`)
  await t.waitForFunction(() => document.images[0]?.complete)
  const hop = await t.locator('#a').boundingBox()
  await t.setViewportSize({ width: Math.ceil(hop.width), height: Math.ceil(hop.height) })
  await luuJpg(t, 'bo-huy-hieu')
  await ctx.close()
}

// 2 · ảnh các tấm + màn chiếu
const ANH = [
  ['tam-12-bac-doc', 'man=hs&bac=3', 'hs', 390, 844, 'light'],
  ['tam-12-bac-may-tinh', 'man=hs&bac=11', 'hs', 1440, 900, 'dark'],
  ['ds-theo-bac-may-tinh', 'man=gv', 'gv', 1440, 900, 'light', 8],
  ['ds-theo-bac-doc', 'man=gv', 'gv', 390, 844, 'light', 9],
]
for (const [ten, q, canh, w, hgt, nen, tuBac] of ANH) {
  const { ctx, t } = await moTrang(q, w, hgt, nen)
  await moTam(t, canh, tuBac)
  await luuJpg(t, ten)
  await ctx.close()
}
{
  const { ctx, t } = await moTrang('man=chieu', 1440, 900, 'light')
  await t.locator('.ddc-bac .bcc-dem').first().waitFor({ timeout: 20000 })
  await t.waitForTimeout(500)
  const emoji = await t.evaluate(() => /\p{Extended_Pictographic}/u.test([...document.querySelectorAll('.bcc-chip, .bcc-dem')].map((x) => x.textContent).join('')))
  if (emoji) loi.push('màn chiếu: còn emoji trong chip / dải đếm')
  await luuJpg(t, 'man-chieu-huy-hieu')
  await ctx.close()
}

// 3 · SOÁT: 3 tấm (hs bậc 3, ph bậc 11, gv) × 3 khổ × sáng/tối
let soLan = 0
for (const [q, canh] of [['man=hs&bac=3', 'hs'], ['man=ph&bac=11', 'ph'], ['man=gv', 'gv']])
  for (const [w, hgt] of [[390, 844], [844, 390], [1440, 900]])
    for (const nen of ['light', 'dark']) {
      const { ctx, t } = await moTrang(q, w, hgt, nen)
      const nhan = `${canh} ${w}×${hgt} ${nen}`
      try {
        await moTam(t, canh)
        await soatTam(t, nhan, canh)
      } catch (e) {
        loi.push(`${nhan}: ${e.message.split('\n')[0]}`)
      }
      soLan++
      await ctx.close()
    }

await dong()
console.log(`\nĐã soát ${soLan} lượt (3 tấm × 3 khổ × sáng/tối). Vấn đề: ${loi.length}`)
for (const l of loi) console.log('  ' + l)
process.exit(loi.length ? 1 : 0)
