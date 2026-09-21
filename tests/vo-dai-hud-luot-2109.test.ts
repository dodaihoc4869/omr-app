// @vitest-environment node
// VÕ ĐÀI (EscortRoom) · GHIM dòng "Lượt n/12 · còn N giây" (đề xuất ở sổ 21/09 "ghim riêng dòng giờ + lượt, không ghim bản đồ 7×5 ~250 px chiếm 1/3 màn"; Boss xếp việc kế sau P7):
// cuộn xuống câu Hoá / hành động thì em vẫn thấy lượt và đồng hồ. CHỈ dòng lượt dính (sticky, nền đặc, mép trên 8 px); dòng đầu phòng (mã phòng, tỉ số, Tải lại / Rời phòng) và bản đồ vẫn cuộn.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const CSS = ['src/styles/tokens.css', 'src/index.css', 'src/game/than-thu-v2/game.css', 'src/game/than-thu-v2/escort.css'].map((f) => doc(f).replace(/@import[^;]*;/g, '')).join('\n')
const ESCORT = doc('src/game/than-thu-v2/EscortRoom.tsx')
// Chính tệp đo đầu trang (thuần DOM) chạy trong Chromium, không viết lại bản khác.
const DTC = `(function(){var exports={};${ts.transpileModule(doc('src/game/than-thu-v2/dau-trang-cao.ts'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText};window.DTC=exports})()`

describe('khoá nguồn', () => {
  it('CHỈ dòng "Lượt {room.round}/12" mang lớp ghim escort-hud-luot; dòng đầu phòng KHÔNG ghim; bản đồ KHÔNG ghim', () => {
    expect(ESCORT).toMatch(/<div className="escort-hud escort-hud-luot" data-vung="hud-luot"><strong>Lượt \{room\.round\}\/12<\/strong>/)
    expect((ESCORT.match(/escort-hud-luot/g) ?? []).length).toBe(1)
    expect(ESCORT).toMatch(/<div className="escort-hud"><strong>\{room\.mode==='duel'/) // dòng đầu phòng giữ nguyên
    const css = doc('src/game/than-thu-v2/escort.css')
    const hud = /\.escort-hud-luot\{([^}]*)\}/.exec(css)![1]!
    expect(hud).toMatch(/position:sticky/)
    expect(hud).toMatch(/top:calc\(var\(--spirit-dau-cao,env\(safe-area-inset-top,0px\)\) \+ 8px\)/) // NGAY DƯỚI đầu trang game cũ (Boss 18:0x: top:8px chui dưới đầu trang z-index 40)
    expect(hud).toMatch(/z-index:8/) // < 40 của đầu trang: KHÔNG được đè nút "Về app học sinh"
    expect(hud).toMatch(/background:var\(--the\)/) // nền ĐẶC
    // đầu trang game cũ: KHÔNG đổi (nút rào "Về app học sinh")
    const game = doc('src/game/than-thu-v2/game.css')
    expect(/\.spirit-game>\.spirit-header\{([^}]*)\}/.exec(game)![1]).toMatch(/position:sticky;top:0;z-index:40/)
    // dây nối: vỏ Võ đài đo đầu trang thật
    expect(ESCORT).toMatch(/import \{ganDauTrangCao\} from '\.\/dau-trang-cao'/)
    expect(ESCORT).toMatch(/useEffect\(\(\)=>ganDauTrangCao\(vo\.current\),\[active\]\)/)
    expect((ESCORT.match(/ref=\{vo\} className=\{`escort-shell /g) ?? []).length).toBe(1)
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

// Vỏ ĐÚNG như app thật: StudentPortalScreen (fixed inset-0 · overflow-y auto · animate-google-fade) chứa `section.spirit-game` với ĐẦU TRANG game cũ + thanh mục (Game.tsx:85,90 — tab Võ đài KHÔNG phải vỏ Đảo) rồi `div > .escort-shell` như EscortRoom.tsx; game.css/escort.css THẬT.
const trang = (gan: boolean) => `<!doctype html><html lang="vi"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0}${CSS}</style></head><body>
<div id="vo" class="animate-google-fade" style="position:fixed;inset:0;overflow-y:auto;display:flex;flex-direction:column;z-index:50;background:#fff">
 <section class="spirit-game" aria-label="Thần Thú Hoá Học">
  <header class="spirit-header"><div><small>HỌC HOÁ · NUÔI THẦN THÚ</small><h1>Bát Linh Đảo</h1></div><button id="ve-app" onclick="window.__bam=(window.__bam||0)+1">Về app học sinh</button></header>
  <nav class="spirit-nav" aria-label="Mục game"><button>Học</button><button>Đảo</button><button aria-current="page">Võ đài</button><button>Đoàn</button></nav>
  <div><div class="escort-shell" id="shell">
   <header class="escort-title"><div><small>TỰ LUYỆN VÀ ĐỒNG ĐỘI</small><h2>Hộ tống Linh Tâm</h2></div></header>
   <div class="escort-hud" id="dau-phong"><strong>2 đấu 2 · Phòng ABC</strong><span>Đội Lam 0 : 1 Đội Hồng</span><button>Tải lại phòng</button><button>Rời phòng</button></div>
   <div class="escort-hud escort-hud-luot" id="hud" data-vung="hud-luot"><strong>Lượt 3/12</strong><span>còn 45 giây · Làm câu Hoá để mở hành động</span></div>
   <div class="escort-map" id="ban-do" style="height:250px">bản đồ 7×5</div>
   <div id="cau" style="height:1600px">câu Hoá dài</div>
   <div id="cuoi" style="height:80px">hành động</div>
  </div></div>
 </section></div>${gan ? `<script>${DTC};window.__go = window.DTC.ganDauTrangCao(document.getElementById('shell'))</script>` : ''}</body></html>`

const doTrang = () => {
  const r = (id: string) => document.getElementById(id)!.getBoundingClientRect()
  const dau = document.querySelector('.spirit-header')!.getBoundingClientRect()
  const hud = r('hud')
  const tam = (b: DOMRect) => document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2)
  const nut = r('ve-app')
  const gaoNhau = hud.left < dau.right && hud.right > dau.left && hud.top < dau.bottom && hud.bottom > dau.top
  return {
    dauTop: Math.round(dau.top), dauDay: Math.round(dau.bottom), hudTop: Math.round(hud.top), hudDay: Math.round(hud.bottom),
    gaoNhau,
    tamHud: !!tam(hud)?.closest('#hud'), tamNut: tam(nut)?.id === 've-app',
    cao: getComputedStyle(document.getElementById('shell')!).getPropertyValue('--spirit-dau-cao').trim(),
    bg: getComputedStyle(document.getElementById('hud')!).backgroundColor,
    banDoDay: Math.round(r('ban-do').bottom), dauPhongDay: Math.round(r('dau-phong').bottom),
  }
}

for (const [w, h] of [[390, 700], [360, 640], [320, 568]] as const)
  it(`Chromium thật ${w}×${h}, ĐỦ VỎ Game.tsx (đầu trang sticky z 40 + thanh mục): cuộn 900 px ⇒ dòng "Lượt n/12 · còn N giây" dính NGAY DƯỚI đầu trang (cách 8 px), KHÔNG giao nhau, bấm giữa dòng trúng chính nó, nút "Về app học sinh" vẫn bấm được; nền đặc; chưa cuộn thì nằm đúng chỗ trong dòng chảy`, async () => {
    if (!browser) return
    const page = await browser.newPage({ viewport: { width: w, height: h } })
    await page.setContent(trang(true))
    await page.waitForTimeout(450)
    const dau = await page.evaluate(doTrang)
    await page.evaluate(() => { document.getElementById('vo')!.scrollTop = 900 })
    const giua = await page.evaluate(doTrang)
    await page.click('#ve-app')
    const bam = await page.evaluate(() => (window as unknown as { __bam?: number }).__bam)
    await page.evaluate(() => { const v = document.getElementById('vo')!; v.scrollTop = v.scrollHeight })
    const cuoi = await page.evaluate(doTrang)
    const cuoiNd = await page.evaluate(() => ({ cuoi: Math.round(document.getElementById('cuoi')!.getBoundingClientRect().bottom), ih: innerHeight }))
    await page.close()
    expect(dau.hudTop).toBeGreaterThan(dau.dauDay) // chưa cuộn: nằm sau tiêu đề + dòng đầu phòng
    expect(giua.cao).toBe(`${giua.dauDay}px`) // biến = chiều cao THẬT của đầu trang (làm tròn lên)
    expect(giua.dauTop).toBe(0) // đầu trang dính mép trên
    expect(giua.hudTop).toBe(giua.dauDay + 8) // dòng lượt NGAY DƯỚI đầu trang, cách 8 px
    expect(giua.gaoNhau).toBe(false)
    expect(giua.tamHud, 'tâm dòng lượt phải trúng chính dòng lượt (không bị đầu trang đè)').toBe(true)
    expect(giua.tamNut, 'nút Về app học sinh phải bấm được').toBe(true)
    expect(bam).toBe(1)
    expect(giua.hudDay - giua.hudTop).toBeLessThan(80) // dòng thấp
    expect(giua.banDoDay).toBeLessThan(giua.dauDay) // bản đồ đã cuộn khỏi màn — KHÔNG ghim
    expect(giua.dauPhongDay).toBeLessThan(giua.dauDay) // dòng đầu phòng cũng cuộn đi
    expect(cuoi.hudTop).toBe(cuoi.dauDay + 8) // cuối trang vẫn dính dưới đầu trang
    expect(cuoi.gaoNhau).toBe(false)
    expect(cuoiNd.cuoi).toBeLessThanOrEqual(cuoiNd.ih) // nội dung cuối vẫn cuộn tới hết
    const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(giua.bg)!
    expect(m[4] === undefined || Number(m[4]) === 1, `nền phải đặc: ${giua.bg}`).toBe(true)
  }, 30000)

it('ĐẦU TRANG ĐỔI CỠ (cửa sổ hẹp lại ⇒ chữ xuống dòng; đổi cỡ chữ đầu trang): biến đo lại theo, dòng lượt vẫn dưới đầu trang, không giao nhau', async () => {
  if (!browser) return
  const page = await browser.newPage({ viewport: { width: 390, height: 700 } })
  await page.setContent(trang(true))
  await page.waitForTimeout(300)
  await page.evaluate(() => { document.getElementById('vo')!.scrollTop = 900 })
  const a = await page.evaluate(doTrang)
  // đầu trang cao hơn (tiêu đề dài xuống dòng + cỡ chữ lớn) — không đổi cỡ cửa sổ, chỉ ResizeObserver mới biết
  await page.evaluate(() => { const h = document.querySelector('.spirit-header h1') as HTMLElement; h.textContent = 'Bát Linh Đảo — Đại Hội Hoá Học Thần Thú Toàn Trường'; h.style.fontSize = '40px' })
  await page.waitForTimeout(250)
  const b = await page.evaluate(doTrang)
  await page.close()
  expect(b.dauDay).toBeGreaterThan(a.dauDay + 20)
  expect(b.cao).toBe(`${b.dauDay}px`)
  expect(b.hudTop).toBe(b.dauDay + 8)
  expect(b.gaoNhau).toBe(false)
  expect(b.tamHud).toBe(true)
}, 30000)

it('GỠ + KHÔNG CÓ ĐẦU TRANG: hàm gỡ trả biến về rỗng; đầu trang biến mất (vỏ Đảo / trang thử) rồi cửa sổ đổi cỡ ⇒ biến được GỠ (CSS lùi về vùng an toàn); truyền rỗng ⇒ không làm gì', async () => {
  if (!browser) return
  type W = { DTC: { ganDauTrangCao: (e: HTMLElement | null) => () => void }; __go: () => void }
  const dat = () => (document.getElementById('shell') as HTMLElement).style.getPropertyValue('--spirit-dau-cao')
  const page = await browser.newPage({ viewport: { width: 390, height: 700 } })
  await page.setContent(trang(true))
  await page.waitForTimeout(200)
  const co = await page.evaluate(dat)
  await page.evaluate(() => (window as unknown as W).__go()) // gỡ
  const sau = await page.evaluate(dat)
  // ngoài đường gỡ: dựng lại có đầu trang, rồi đầu trang mất + cửa sổ đổi cỡ
  await page.setContent(trang(true))
  await page.waitForTimeout(200)
  const lai = await page.evaluate(dat)
  await page.evaluate(() => { document.querySelector('.spirit-header')!.remove(); window.dispatchEvent(new Event('resize')) })
  const khong = await page.evaluate(dat)
  const nullOk = await page.evaluate(() => typeof (window as unknown as W).DTC.ganDauTrangCao(null))
  await page.close()
  expect(co).toMatch(/^\d+px$/)
  expect(sau).toBe('')
  expect(lai).toMatch(/^\d+px$/)
  expect(khong).toBe('')
  expect(nullOk).toBe('function')
}, 30000)

it('ĐỐI CHỨNG 1 — lỗi Boss bắt (18:0x): KHÔNG đo đầu trang (top cũ 8 px) thì dòng lượt CHUI DƯỚI đầu trang: giao nhau và tâm dòng trúng đầu trang (test trên phải thấy lỗi này thì khoá mới có nghĩa)', async () => {
  if (!browser) return
  const page = await browser.newPage({ viewport: { width: 390, height: 700 } })
  await page.setContent(trang(false).replace(/top:calc\(var\(--spirit-dau-cao,env\(safe-area-inset-top,0px\)\) \+ 8px\)/, 'top:8px'))
  await page.waitForTimeout(450)
  await page.evaluate(() => { document.getElementById('vo')!.scrollTop = 900 })
  const o = await page.evaluate(doTrang)
  await page.close()
  expect(o.hudTop).toBe(8)
  expect(o.gaoNhau).toBe(true)
  expect(o.tamHud).toBe(false)
}, 30000)

it('ĐỐI CHỨNG 2: bỏ position:sticky thì dòng lượt TRÔI theo nội dung', async () => {
  if (!browser) return
  const cu = trang(true).replace('.escort-hud-luot{position:sticky;', '.escort-hud-luot{position:relative;')
  expect(cu).not.toBe(trang(true))
  const page = await browser.newPage({ viewport: { width: 390, height: 700 } })
  await page.setContent(cu)
  await page.waitForTimeout(450)
  const top = await page.evaluate(() => {
    document.getElementById('vo')!.scrollTop = 900
    return Math.round(document.getElementById('hud')!.getBoundingClientRect().top)
  })
  await page.close()
  expect(top).toBeLessThan(0)
}, 30000)
