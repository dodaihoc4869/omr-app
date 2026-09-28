// @vitest-environment node
// SẢNH 3D SÁNG / TỐI THEO MÁY (thầy 28/09: "sảnh của học sinh cũng theo chế độ của hệ thống, nếu là sáng thì sảnh hoàng hôn nếu tối thì sảnh tối").
// Khoá: (1) nguồn — khối tối @media và khối ép [data-giao-dien='toi'] giống hệt nhau, CanhSanh3D có nhóm đêm (sao + trăng);
// (2) Chromium thật với emulateMedia({colorScheme}) — sáng: mặt trời hiện, nhóm đêm ẩn, kính trắng chữ tối; tối: trăng + sao hiện, mặt trời ẩn,
// trời/biển đêm, kính tối chữ sáng; tương phản chữ/kính ≥ 4.5:1 ở CẢ HAI chế độ; đổi chế độ lúc đang mở là đổi ngay (không tải lại).
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const CSS = doc('src/components/hoa2/sanh-ban-do.css')
const CANH = doc('src/components/hoa2/CanhSanh3D.tsx')

describe('Sảnh 3D sáng/tối — nguồn', () => {
  it('hai khối tối (theo máy + ép Tối) giống hệt nhau, khối theo máy nhường khi ép Sáng', () => {
    const m = /@media \(prefers-color-scheme: dark\) \{\n([\s\S]*?)\n\}\n/.exec(CSS.slice(CSS.indexOf('BẢN ĐÊM — máy ở chế độ TỐI')))
    expect(m).not.toBeNull()
    const theoMay = m![1]!.split('\n').map((l) => l.replace(/^ {2}/, '')).join('\n').replaceAll(":root:not([data-giao-dien='sang']) ", '')
    const epToi = CSS.slice(CSS.indexOf(m![0]) + m![0].length).split('@media (prefers-reduced-motion')[0]!.trim().replaceAll(":root[data-giao-dien='toi'] ", '')
    expect(theoMay.trim()).toBe(epToi)
    expect(theoMay).toMatch(/\.h2-sanh \.h2c-dem \{\s*display: inline;/)
    expect(theoMay).toMatch(/\.h2-sanh \.h2c-mat-troi, \.h2-sanh \.h2c-hao-troi, \.h2-sanh \.h2c-tia-troi \{\s*display: none;/)
  })
  it('CanhSanh3D có nhóm đêm: sao (sinh cố định) + trăng + quầng trăng; mặt trời mang lớp để ẩn khi tối', () => {
    expect(CANH).toMatch(/<g className="h2c-dem">/)
    expect(CANH).toMatch(/className="h2c-trang"/)
    expect(CANH).toMatch(/fill="url\(#h2c-hao-trang\)"/)
    expect(CANH).toMatch(/className="h2c-mat-troi"/)
    expect(CANH).toMatch(/const SAO_DEM/)
    expect(CANH).not.toMatch(/Math\.random\(\)[^\n]*SAO_DEM/)
  })
})

const trang = `<!doctype html><html lang="vi"><head><style>html,body{margin:0}${CSS}</style></head><body>
<div class="h2-sanh"><div class="h2-ban-do" style="position:relative;width:390px;height:400px">
<svg class="h2c-canh" viewBox="-12 -14 424 522" width="390" height="400">
 <defs><linearGradient id="h2c-troi"><stop offset="0" stop-color="rgb(128 132 236)"/><stop offset=".45" stop-color="rgb(206 150 226)"/><stop offset=".75" stop-color="rgb(255 164 180)"/><stop offset="1" stop-color="rgb(255 206 150)"/></linearGradient>
 <linearGradient id="h2c-bien"><stop offset="0" stop-color="rgb(255 214 190)"/><stop offset=".08" stop-color="rgb(170 226 232)"/><stop offset=".45" stop-color="rgb(92 206 214)"/><stop offset="1" stop-color="rgb(28 150 186)"/></linearGradient></defs>
 <circle class="h2c-mat-troi" cx="64" cy="12" r="22"/><g class="h2c-dem"><circle class="h2c-trang" cx="70" cy="-2" r="15"/><circle class="h2c-sao-dem" cx="10" cy="-8" r="1"/></g>
</svg></div>
<p class="h2-kinh" id="kinh" style="background:var(--h2-kinh-nen);color:var(--h2-chu);padding:8px">Đảo Hoá hữu cơ · 40% đã khai phá</p></div></body></html>`

let browser: Browser | null = null
beforeAll(async () => {
  try {
    browser = await chromium.launch({ headless: true })
  } catch {
    // máy chỉ có bản Chromium khác số hiệu (vd. /opt/pw-browsers/chromium) ⇒ thử đường dẫn đó; không có thì bỏ qua phần trình duyệt
    try {
      browser = fs.existsSync('/opt/pw-browsers/chromium') ? await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium' }) : null
    } catch {
      browser = null
    }
  }
})
afterAll(async () => {
  await browser?.close()
})

type Rgba = [number, number, number, number]
const doc_ = (s: string): Rgba => {
  const so = s.match(/[\d.]+/g)!.map(Number)
  return [so[0]!, so[1]!, so[2]!, so[3] ?? 1]
}
const L = ([r, g, b]: Rgba) => {
  const f = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const tron = (tren: Rgba, duoi: Rgba): Rgba => [0, 1, 2].map((i) => tren[i]! * tren[3] + duoi[i]! * (1 - tren[3])).concat(1) as Rgba
const tuongPhan = (a: Rgba, b: Rgba) => {
  const [x, y] = [L(a), L(b)].sort((m, n) => n - m)
  return (x! + 0.05) / (y! + 0.05)
}

const doCheDo = async (page: import('playwright').Page) =>
  page.evaluate(() => {
    const cs = (q: string) => getComputedStyle(document.querySelector(q)!)
    const k = cs('#kinh')
    return {
      matTroi: cs('.h2c-mat-troi').display,
      dem: cs('.h2c-dem').display,
      troiDau: cs('#h2c-troi stop').stopColor,
      bienCuoi: cs('#h2c-bien stop:nth-child(4)').stopColor,
      nenBanDo: cs('.h2-ban-do').backgroundColor,
      chu: k.color,
      kinh: k.backgroundColor,
    }
  })

describe('Sảnh 3D sáng/tối — Chromium thật (emulateMedia)', () => {
  it('SÁNG = hoàng hôn (mặt trời, kính trắng chữ tối); TỐI = đêm (trăng + sao, trời/biển đêm, kính tối chữ sáng); đổi chế độ lúc đang mở là đổi ngay', async (ctx) => {
    if (!browser) return ctx.skip()
    const page = await browser.newPage({ viewport: { width: 390, height: 600 } })
    await page.emulateMedia({ colorScheme: 'light' })
    await page.setContent(trang)
    const sang = await doCheDo(page)
    expect(sang.matTroi).not.toBe('none')
    expect(sang.dem).toBe('none')
    expect(sang.troiDau).toBe('rgb(128, 132, 236)')
    const nenSang = doc_(sang.nenBanDo)
    expect(tuongPhan(doc_(sang.chu), tron(doc_(sang.kinh), nenSang))).toBeGreaterThanOrEqual(4.5)
    expect(L(doc_(sang.chu))).toBeLessThan(0.1) // chữ tối

    await page.emulateMedia({ colorScheme: 'dark' }) // KHÔNG tải lại trang
    const toi = await doCheDo(page)
    expect(toi.matTroi).toBe('none')
    expect(toi.dem).not.toBe('none')
    expect(L(doc_(toi.troiDau))).toBeLessThan(0.02) // trời tím sẫm
    expect(L(doc_(toi.bienCuoi))).toBeLessThan(0.02) // biển xanh đêm
    const nenToi = doc_(toi.nenBanDo)
    expect(L(nenToi)).toBeLessThan(0.05)
    expect(tuongPhan(doc_(toi.chu), tron(doc_(toi.kinh), nenToi))).toBeGreaterThanOrEqual(4.5)
    expect(L(doc_(toi.chu))).toBeGreaterThan(0.6) // chữ sáng

    // ép Sáng trên máy tối ⇒ vẫn hoàng hôn
    await page.evaluate(() => document.documentElement.setAttribute('data-giao-dien', 'sang'))
    expect((await doCheDo(page)).dem).toBe('none')
    await page.close()
  })
})
