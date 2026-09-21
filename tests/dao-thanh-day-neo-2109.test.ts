// @vitest-environment node
// P0 THẦY BÁO 21/09 16:3x — thanh đáy game Đảo (Đảo / Đoàn Hộ Tống / Sổ tay / Túi đồ) "bị cố định che mất nội dung": viên thuốc nổi đè lên thẻ "Chuyến thám hiểm hôm nay", nội dung lộ cả trên lẫn dưới thanh.
// GỐC (đo bằng Chromium thật): vỏ sheet của game có `animate-google-fade` với fill `forwards` ⇒ SAU KHI CHẠY XONG Chromium vẫn giữ computed `transform: matrix(1,0,0,1,0,0)` (không phải `none`, kể cả khi keyframe cuối là `none`)
// ⇒ vỏ thành khung chứa của mọi con `position: fixed`; vỏ lại là hộp `overflow-y: auto` nên thanh `fixed` bám vào NỘI DUNG CUỘN chứ không bám màn: trôi lên theo nội dung và đè thẻ (cuộn 700 px ⇒ thanh lên 700 px).
// Sửa: (1) `animate-google-fade/pop` dùng fill `backwards` (trạng thái cuối = trạng thái tự nhiên nên không đổi hình); (2) thanh thành thanh ĐÁY NEO nền ĐẶC phủ hết đáy (kể cả vùng an toàn) có vạch trên; (3) vùng cuộn chừa ≥ 64 + 24 + vùng an toàn.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const INDEX = doc('src/index.css')
const DAO = doc('src/game/than-thu-v2/dao/dao.css')

describe('khoá nguồn', () => {
  it('nút "Về app học sinh" (dính góc trên trái, cuộn qua nội dung) có nền ĐẶC — chữ và nút không bị nội dung phía sau lọt qua', () => {
    const nut = /\.dao button\.dao-ve-app\{([^}]*)\}/.exec(DAO)![1]!
    expect(nut).toMatch(/position:fixed/)
    expect(nut).toMatch(/background:rgb\(9,13,40\)/)
    expect(nut).not.toMatch(/background:rgba/)
  })
  it('hai lớp animation của vỏ sheet dùng fill `backwards` (KHÔNG `forwards`): không để lại ma trận đơn vị làm khung chứa cho phần tử fixed; trạng thái cuối keyframe = trạng thái tự nhiên', () => {
    expect(INDEX).toMatch(/\.animate-google-fade \{\s*animation: google-fade-in-up [^;]*backwards;/)
    expect(INDEX).toMatch(/\.animate-google-pop \{\s*animation: google-pop [^;]*backwards;/)
    expect(INDEX).not.toMatch(/\.animate-google-(fade|pop) \{\s*animation:[^;]*forwards/)
    const fade = /@keyframes google-fade-in-up \{[\s\S]*?\n\}/.exec(INDEX)![0]
    expect(fade).toMatch(/to \{[^}]*opacity: 1;[^}]*transform: none/)
  })
  it('thanh đáy neo: dính đáy trái–phải, nền ĐẶC (không trong suốt, không blur), có vạch trên, chừa vùng an toàn; vùng cuộn chừa ≥ 64 + 24 + vùng an toàn', () => {
    const nav = /\.dao \.dao-nav\{([^}]*)\}/.exec(DAO)![1]!
    expect(nav).toMatch(/position:fixed/)
    expect(nav).toMatch(/left:0;right:0;bottom:0/)
    expect(nav).not.toMatch(/border-radius|translateX|backdrop-filter/)
    expect(nav).toMatch(/background:rgb\(14,20,52\)/) // đặc: không alpha
    expect(nav).toMatch(/height:calc\(64px \+ env\(safe-area-inset-bottom,0px\)\)/)
    expect(nav).toMatch(/padding:[^;]*env\(safe-area-inset-bottom,0px\)/)
    expect(nav).toMatch(/box-shadow:0 -1px 0/)
    const vo = /\.dao-vo\{[^}]*padding-bottom:calc\((\d+)px \+ env\(safe-area-inset-bottom,0px\)\)/.exec(DAO)
    expect(Number(vo![1])).toBeGreaterThanOrEqual(64 + 24)
  })
})

// ── Chromium thật: vỏ sheet ĐÚNG như StudentPortalScreen (fixed inset-0 · overflow-y auto · animate-google-fade) với CSS thật của app ──
const css = [INDEX, DAO].map((c) => c.replace(/@import[^;]*;/g, '')).join('\n')
const trang = (indexCss: string) => `<!doctype html><html lang="vi"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0}${indexCss}${DAO.replace(/@import[^;]*;/g, '')}</style></head><body>
<div id="vo" class="animate-google-fade" style="position:fixed;inset:0;overflow-y:auto;display:flex;flex-direction:column;z-index:50;background:#fff">
  <section class="spirit-game spirit-game-dao"><div class="dao dao-vo" data-thu="0"><div id="noi-dung" style="height:1800px"><h2>Chuyến thám hiểm hôm nay</h2></div><div id="cuoi" style="height:120px;background:#c00">LÊN ĐƯỜNG</div>
    <nav class="dao-nav" aria-label="Mục của đảo"><button>Đảo</button><button>Đoàn Hộ Tống</button><button>Sổ tay</button><button>Túi đồ</button></nav></div></section>
</div></body></html>`
let browser: Browser | null = null
beforeAll(async () => {
  try {
    browser = await chromium.launch({ headless: true })
  } catch {
    browser = null
  }
})
afterAll(async () => {
  await browser?.close()
})

const do_ = async (html: string, w: number, h: number) => {
  const page = await browser!.newPage({ viewport: { width: w, height: h } })
  await page.setContent(html)
  await page.waitForTimeout(450) // animation 240 ms + dư
  const dau = await page.evaluate(() => {
    const nav = document.querySelector('.dao-nav')!.getBoundingClientRect()
    return { transform: getComputedStyle(document.getElementById('vo')!).transform, navDay: Math.round(nav.bottom), navTrai: Math.round(nav.left), navRong: Math.round(nav.width), navCao: Math.round(nav.height), ih: innerHeight, iw: innerWidth }
  })
  await page.evaluate(() => { const v = document.getElementById('vo')!; v.scrollTop = 700 })
  const giua = await page.evaluate(() => Math.round(document.querySelector('.dao-nav')!.getBoundingClientRect().bottom))
  await page.evaluate(() => { const v = document.getElementById('vo')!; v.scrollTop = v.scrollHeight })
  const cuoi = await page.evaluate(() => ({ nav: Math.round(document.querySelector('.dao-nav')!.getBoundingClientRect().top), navDay: Math.round(document.querySelector('.dao-nav')!.getBoundingClientRect().bottom), dayNoiDung: Math.round(document.getElementById('cuoi')!.getBoundingClientRect().bottom) }))
  await page.close()
  return { dau, giua, cuoi }
}

for (const [w, h] of [[390, 700], [360, 640]] as const)
  it(`Chromium thật ${w}×${h}: sau khi animation của vỏ chạy xong vỏ KHÔNG còn transform; thanh dính ĐÁY màn ở đầu / giữa / cuối cuộn, phủ trọn bề ngang; nội dung cuối cuộn ra cách thanh ≥ 24 px`, async () => {
    if (!browser) return
    const r = await do_(trang(INDEX.replace(/@import[^;]*;/g, '')), w, h)
    expect(r.dau.transform).toBe('none') // sau animation vỏ trở về không transform ⇒ không là khung chứa của con fixed
    expect(r.dau.navDay).toBe(r.dau.ih)
    expect(r.giua).toBe(r.dau.ih) // giữa lúc cuộn: KHÔNG trôi lên theo nội dung
    expect(r.dau.navTrai).toBe(0)
    expect(r.dau.navRong).toBe(r.dau.iw)
    expect(r.dau.navCao).toBeGreaterThanOrEqual(64)
    expect(r.cuoi.navDay).toBe(h)
    expect(r.cuoi.dayNoiDung).toBeLessThanOrEqual(r.cuoi.nav - 24) // nút cuối (LÊN ĐƯỜNG) cuộn ra khỏi thanh, cách ≥ 24 px
  }, 30000)

it('ĐỐI CHỨNG lỗi cũ: trả fill `forwards` thì vỏ còn transform (ma trận đơn vị) và thanh TRÔI theo nội dung (test này phải thấy lỗi, để khoá ở trên có nghĩa)', async () => {
  if (!browser) return
  const cu = INDEX.replace(/@import[^;]*;/g, '').replace(/(\.animate-google-fade \{\s*animation: google-fade-in-up [^;]*?)backwards;/, '$1forwards;')
  expect(cu).not.toBe(INDEX.replace(/@import[^;]*;/g, ''))
  const r = await do_(trang(cu), 390, 700)
  expect(r.dau.transform).not.toBe('none')
  expect(r.giua).toBeLessThan(r.dau.ih) // thanh trôi lên theo nội dung khi cuộn
}, 30000)
