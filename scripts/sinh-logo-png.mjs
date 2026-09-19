// SINH TÀI NGUYÊN LOGO TỪ BỘ VECTOR ĐÃ CHỐT (docs/logo-1909/, thầy chốt 19/09/2026) → public/.
//
//   node scripts/sinh-logo-png.mjs           ghi lại mọi tệp
//   node scripts/sinh-logo-png.mjs --kiem    KHÔNG ghi; thoát mã 1 nếu tệp trong public/ khác bản sinh lại
//
// Công cụ: Chromium của Playwright (đã là devDependency; KHÔNG thêm phụ thuộc). Vẽ SVG qua <img> — đúng đường mà app dùng
// để hiện logo — rồi chụp phần tử, nền trong suốt. Cùng máy + cùng bản Chromium thì ra cùng từng byte (`--kiem` dựa vào đó).
//
// BẢN NÀO DÙNG Ở ĐÂU (docs/logo-1909/DOC-TRUOC.md):
//   logo-<vai>-v3.svg         thường  — trong app, cỡ > 40 px, màn đăng nhập
//   logo-<vai>-nho-v3.svg     nét đậm — cỡ ≤ 40 px (thanh trên, thông báo), favicon
//   logo-<vai>-{180,192,512}-v3.png   từ bản TRÀN NỀN (-day) — icon cài máy (manifest, apple-touch-icon, mobileconfig)
//   logo-<vai>-64-v3.png      từ bản nét đậm (-nho), nền trong suốt — favicon PNG dự phòng, biểu tượng thông báo nhỏ
//   logo-<vai>-512-maskable-v3.png   tràn nền THU NHỎ 90% trên đúng màu nền — bản `-day` (hình khối đã thu 84%) vẫn để góc
//                             hình vuông bo / ngôi nhà chạm ngoài VÒNG AN TOÀN maskable (bán kính 40% cạnh, đo được 42–44%);
//                             thu thêm 90% thì mọi điểm của hình nằm trong vòng (đo lại bằng Chromium, xem sổ việc)
//   apple-touch-icon.png · icon-192.png · icon-512.png   = bản tràn nền của GIÁO VIÊN;  icon-512-maskable.png = bản maskable GV
//   favicon.svg               = bản nét đậm của GIÁO VIÊN (tự chứa, không còn <image> trỏ sang PNG)
// Tên có hậu tố `-v3` để phá cache service worker / trình duyệt của bản `-v2` cũ.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const GOC = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DOC = 'docs/logo-1909'
const VAI = ['gv', 'hs', 'ph']
const CHI_KIEM = process.argv.includes('--kiem')

/** [nguồn, đích] — chép nguyên byte. */
export const BAN_CHEP = [
  ...VAI.flatMap((v) => [
    [`${DOC}/logo-${v}.svg`, `public/logo-${v}-v3.svg`],
    [`${DOC}/logo-${v}-nho.svg`, `public/logo-${v}-nho-v3.svg`],
  ]),
  [`${DOC}/logo-gv-nho.svg`, 'public/favicon.svg'],
]

/** { nguồn svg, cỡ (px vuông), đích, thuNho? } — vẽ từ SVG. `thuNho` (0–1): vẽ hình nhỏ lại giữa tấm phủ đúng màu nền của bản tràn nền. */
export const BAN_PNG = [
  ...VAI.flatMap((v) => [
    { tu: `${DOC}/logo-${v}-day.svg`, co: 180, den: `public/logo-${v}-180-v3.png` },
    { tu: `${DOC}/logo-${v}-day.svg`, co: 192, den: `public/logo-${v}-192-v3.png` },
    { tu: `${DOC}/logo-${v}-day.svg`, co: 512, den: `public/logo-${v}-512-v3.png` },
    { tu: `${DOC}/logo-${v}-nho.svg`, co: 64, den: `public/logo-${v}-64-v3.png` },
    { tu: `${DOC}/logo-${v}-day.svg`, co: 512, den: `public/logo-${v}-512-maskable-v3.png`, thuNho: 0.9 },
  ]),
  { tu: `${DOC}/logo-gv-day.svg`, co: 180, den: 'public/apple-touch-icon.png' },
  { tu: `${DOC}/logo-gv-day.svg`, co: 192, den: 'public/icon-192.png' },
  { tu: `${DOC}/logo-gv-day.svg`, co: 512, den: 'public/icon-512.png' },
  { tu: `${DOC}/logo-gv-day.svg`, co: 512, den: 'public/icon-512-maskable.png', thuNho: 0.9 },
]

/** Hồ sơ cấu hình iPhone nhúng biểu tượng 180 px (khoá Icon) — sinh lại cho khớp `logo-<vai>-180-v3.png`. */
export const BAN_MOBILECONFIG = [
  { tep: 'public/hs.mobileconfig', png: 'public/logo-hs-180-v3.png' },
  { tep: 'public/ph.mobileconfig', png: 'public/logo-ph-180-v3.png' },
]

const doc = (p) => readFileSync(resolve(GOC, p))

async function ve(page, svg, co, thuNho = 1) {
  await page.setViewportSize({ width: co, height: co })
  const nen = thuNho < 1 ? /<rect width="512" height="512" fill="(#[0-9a-fA-F]{6})"\/>/.exec(svg.toString('utf8'))?.[1] : null
  if (thuNho < 1 && !nen) throw new Error('bản tràn nền không có <rect> nền phẳng để thu nhỏ trên đó')
  const canh = Math.round((co * thuNho) / 2) * 2 // chẵn, để hình nằm giữa chính xác
  await page.setContent(
    `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:${nen ?? 'transparent'}}` +
      `body{width:${co}px;height:${co}px;display:flex;align-items:center;justify-content:center}img{display:block}</style>` +
      `<img id="i" width="${canh}" height="${canh}" src="data:image/svg+xml;base64,${svg.toString('base64')}">`,
  )
  await page.evaluate(() => document.getElementById('i').decode())
  return page.screenshot({ type: 'png', omitBackground: true, clip: { x: 0, y: 0, width: co, height: co } })
}

/** Thay khối <data> của khoá Icon, giữ đúng khuôn cũ: mỗi dòng 52 ký tự, ba dấu tab đầu dòng. */
export function thayIcon(plist, png) {
  const b64 = png.toString('base64').match(/.{1,52}/g).map((d) => `\t\t\t${d}`).join('\n')
  const re = /(<key>Icon<\/key>\s*<data>)[\s\S]*?(<\/data>)/
  if (!re.test(plist)) throw new Error('mobileconfig không có khoá Icon')
  return plist.replace(re, `$1\n${b64}\n\t\t\t$2`)
}

async function main() {
  const dau = { chep: 0, png: 0, plist: 0 }
  const khac = []
  const ghi = (den, noiDung) => {
    const co = existsSync(resolve(GOC, den)) ? readFileSync(resolve(GOC, den)) : null
    const giong = co && Buffer.compare(co, Buffer.from(noiDung)) === 0
    if (!giong) khac.push(den)
    if (!CHI_KIEM && !giong) writeFileSync(resolve(GOC, den), noiDung)
  }
  for (const [tu, den] of BAN_CHEP) {
    ghi(den, doc(tu))
    dau.chep++
  }
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await (await browser.newContext({ deviceScaleFactor: 1 })).newPage()
    const nho = new Map() // cùng (nguồn, cỡ) chỉ vẽ một lần
    const pngRa = new Map()
    for (const { tu, co, den, thuNho } of BAN_PNG) {
      const k = `${tu}@${co}@${thuNho ?? 1}`
      if (!nho.has(k)) nho.set(k, await ve(page, doc(tu), co, thuNho))
      pngRa.set(den, nho.get(k))
      ghi(den, nho.get(k))
      dau.png++
    }
    for (const { tep, png } of BAN_MOBILECONFIG) {
      ghi(tep, thayIcon(doc(tep).toString('utf8'), pngRa.get(png)))
      dau.plist++
    }
  } finally {
    await browser.close()
  }
  const tong = `${dau.chep} tệp chép · ${dau.png} PNG · ${dau.plist} mobileconfig`
  if (CHI_KIEM) {
    if (khac.length) {
      console.error(`❌ ${khac.length} tệp KHÁC bản sinh lại (${tong}):\n` + khac.join('\n'))
      process.exit(1)
    }
    console.log(`✅ Mọi tệp logo trong public/ khớp bản sinh lại — ${tong}`)
  } else {
    console.log(`✅ Đã sinh (${tong}); đổi ${khac.length} tệp` + (khac.length ? ':\n' + khac.join('\n') : ''))
  }
}

// chỉ chạy khi gọi thẳng (test import được BAN_* mà không mở Chromium)
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
