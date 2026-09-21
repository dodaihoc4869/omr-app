// @vitest-environment node
// VÕ ĐÀI (EscortRoom) · GHIM dòng "Lượt n/12 · còn N giây" (đề xuất ở sổ 21/09 "ghim riêng dòng giờ + lượt, không ghim bản đồ 7×5 ~250 px chiếm 1/3 màn"; Boss xếp việc kế sau P7):
// cuộn xuống câu Hoá / hành động thì em vẫn thấy lượt và đồng hồ. CHỈ dòng lượt dính (sticky, nền đặc, mép trên 8 px); dòng đầu phòng (mã phòng, tỉ số, Tải lại / Rời phòng) và bản đồ vẫn cuộn.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const CSS = ['src/styles/tokens.css', 'src/index.css', 'src/game/than-thu-v2/game.css', 'src/game/than-thu-v2/escort.css'].map((f) => doc(f).replace(/@import[^;]*;/g, '')).join('\n')
const ESCORT = doc('src/game/than-thu-v2/EscortRoom.tsx')

describe('khoá nguồn', () => {
  it('CHỈ dòng "Lượt {room.round}/12" mang lớp ghim escort-hud-luot; dòng đầu phòng KHÔNG ghim; bản đồ KHÔNG ghim', () => {
    expect(ESCORT).toMatch(/<div className="escort-hud escort-hud-luot" data-vung="hud-luot"><strong>Lượt \{room\.round\}\/12<\/strong>/)
    expect((ESCORT.match(/escort-hud-luot/g) ?? []).length).toBe(1)
    expect(ESCORT).toMatch(/<div className="escort-hud"><strong>\{room\.mode==='duel'/) // dòng đầu phòng giữ nguyên
    const css = doc('src/game/than-thu-v2/escort.css')
    const hud = /\.escort-hud-luot\{([^}]*)\}/.exec(css)![1]!
    expect(hud).toMatch(/position:sticky/)
    expect(hud).toMatch(/top:max\(8px,env\(safe-area-inset-top,0px\)\)/)
    expect(hud).toMatch(/z-index:8/)
    expect(hud).toMatch(/background:var\(--the\)/) // nền ĐẶC
    expect(css).not.toMatch(/\.escort-map\{[^}]*position:sticky/)
    expect(css.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/#[0-9a-fA-F]{3,8}\b[^;}]*(?=[^}]*escort-hud-luot)/)
  })
})

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

// Vỏ ĐÚNG như StudentPortalScreen (fixed inset-0 · overflow-y auto · animate-google-fade) chứa `.spirit-game` → `.escort-shell` như Game.tsx / EscortRoom.tsx thật.
const trang = `<!doctype html><html lang="vi"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0}${CSS}</style></head><body>
<div id="vo" class="animate-google-fade" style="position:fixed;inset:0;overflow-y:auto;display:flex;flex-direction:column;z-index:50;background:#fff">
 <section class="spirit-game"><div class="escort-shell">
  <header class="escort-title"><div><small>TỰ LUYỆN VÀ ĐỒNG ĐỘI</small><h2>Hộ tống Linh Tâm</h2></div></header>
  <div class="escort-hud" id="dau-phong"><strong>2 đấu 2 · Phòng ABC</strong><span>Đội Lam 0 : 1 Đội Hồng</span><button>Tải lại phòng</button><button>Rời phòng</button></div>
  <div class="escort-hud escort-hud-luot" id="hud" data-vung="hud-luot"><strong>Lượt 3/12</strong><span>còn 45 giây · Làm câu Hoá để mở hành động</span></div>
  <div class="escort-map" id="ban-do" style="height:250px">bản đồ 7×5</div>
  <div id="cau" style="height:1600px">câu Hoá dài</div>
  <div id="cuoi" style="height:80px">hành động</div>
 </div></section></div></body></html>`

for (const [w, h] of [[390, 700], [360, 640]] as const)
  it(`Chromium thật ${w}×${h}: cuộn xuống câu ⇒ dòng "Lượt n/12 · còn N giây" DÍNH mép trên (8 px), nền đặc; dòng đầu phòng + bản đồ cuộn đi; chưa cuộn thì nằm đúng chỗ trong dòng chảy`, async () => {
    if (!browser) return
    const page = await browser.newPage({ viewport: { width: w, height: h } })
    await page.setContent(trang)
    await page.waitForTimeout(450)
    const o = await page.evaluate(() => {
      const v = document.getElementById('vo')!
      const r = (id: string) => document.getElementById(id)!.getBoundingClientRect()
      const dau = { hud: Math.round(r('hud').top), banDo: Math.round(r('ban-do').top) }
      const bg = getComputedStyle(document.getElementById('hud')!).backgroundColor
      v.scrollTop = 900
      const giua = { hud: Math.round(r('hud').top), hudDay: Math.round(r('hud').bottom), banDo: Math.round(r('ban-do').bottom), dauPhong: Math.round(r('dau-phong').bottom) }
      v.scrollTop = v.scrollHeight
      const cuoi = { hud: Math.round(r('hud').top), hudDay: Math.round(r('hud').bottom), cuoi: Math.round(r('cuoi').bottom), ih: innerHeight }
      return { dau, giua, cuoi, bg }
    })
    await page.close()
    expect(o.dau.hud).toBeGreaterThan(8) // đầu trang: chưa dính, còn nằm sau tiêu đề + dòng đầu phòng
    expect(o.dau.banDo).toBeGreaterThan(o.dau.hud) // bản đồ nằm dưới dòng lượt
    expect(o.giua.hud).toBe(8) // cuộn 900 px (quá bản đồ): dòng lượt dính đúng mép trên
    expect(o.giua.hudDay).toBeLessThan(80) // dòng thấp (1–2 hàng chữ), không phải khối cao
    expect(o.giua.banDo).toBeLessThan(0) // bản đồ đã cuộn khỏi màn — KHÔNG ghim
    expect(o.giua.dauPhong).toBeLessThan(0) // dòng đầu phòng cũng cuộn đi
    expect(o.cuoi.hud).toBe(8) // cuối trang vẫn dính
    expect(o.cuoi.cuoi).toBeLessThanOrEqual(o.cuoi.ih) // nội dung cuối vẫn cuộn tới hết
    const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(o.bg)!
    expect(m[4] === undefined || Number(m[4]) === 1, `nền phải đặc: ${o.bg}`).toBe(true)
  }, 30000)

it('ĐỐI CHỨNG: bỏ position:sticky thì dòng lượt TRÔI theo nội dung (test này phải thấy lỗi để khoá trên có nghĩa)', async () => {
  if (!browser) return
  const cu = trang.replace('.escort-hud-luot{position:sticky;', '.escort-hud-luot{position:relative;')
  expect(cu).not.toBe(trang)
  const page = await browser.newPage({ viewport: { width: 390, height: 700 } })
  await page.setContent(cu)
  await page.waitForTimeout(450)
  const top = await page.evaluate(() => {
    const v = document.getElementById('vo')!
    v.scrollTop = 900
    return Math.round(document.getElementById('hud')!.getBoundingClientRect().top)
  })
  await page.close()
  expect(top).toBeLessThan(0)
}, 30000)
