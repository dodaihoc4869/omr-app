// @vitest-environment node
// PHỤ KIỆN THẦN THÚ · M1 — Chromium THẬT trên trang xem thử (src/components/xem-thu/phu-kien.html, dữ liệu giả): mọi món đã có hình × 8 loài × sáng/tối × 1280 và 360 px.
// Khoá: khung tên NẰM DƯỚI chân thú (không che mặt), hào quang / vệt nằm SAU thú (z-index thấp hơn), vệt ở PHÍA SAU (ngược hướng nhìn), không tràn ngang, một thú ≤ 3 chuyển động,
// bản tĩnh và "giảm chuyển động" ⇒ 0 chuyển động, không lỗi trang.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser, type Page } from 'playwright'
import { createServer, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import type { AddressInfo } from 'node:net'
import { MON_DOT_1 } from '../src/game/than-thu-v2/phu-kien/phu-kien-mon'
import { coHinhSvg } from '../src/game/than-thu-v2/phu-kien/nap-hinh'

let may: ViteDevServer
let tr: Browser
let goc = ''
beforeAll(async () => {
  may = await createServer({
    configFile: false,
    root: process.cwd(),
    plugins: [react()],
    define: { __PHIEN_BAN__: JSON.stringify('thu'), __SW_BUILT_AT__: 0 },
    server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
    logLevel: 'error',
    optimizeDeps: { entries: ['src/components/xem-thu/phu-kien.html'] },
  })
  await may.listen()
  goc = `http://127.0.0.1:${(may.httpServer!.address() as AddressInfo).port}`
  tr = await chromium.launch({ headless: true })
}, 180_000)
afterAll(async () => {
  await tr?.close()
  await may?.close()
})

const CO_HINH = MON_DOT_1.filter((m) => m.o === 'khung' || coHinhSvg(m.ma))
const SO_SVG = MON_DOT_1.filter((m) => m.o !== 'khung' && coHinhSvg(m.ma)).length * 8

async function mo(rong: number, gd: 'sang' | 'toi', tham = '', giam = false, soSvg = SO_SVG) {
  const ctx = await tr.newContext({ viewport: { width: rong, height: 900 }, colorScheme: gd === 'toi' ? 'dark' : 'light', reducedMotion: giam ? 'reduce' : 'no-preference' })
  const p = await ctx.newPage()
  const loi: string[] = []
  p.on('pageerror', (e) => loi.push(e.message))
  p.on('console', (m) => { if (m.type() === 'error') loi.push(m.text().slice(0, 160)) })
  await p.goto(`${goc}/src/components/xem-thu/phu-kien.html?gd=${gd}${tham}`, { waitUntil: 'networkidle' })
  await p.waitForFunction((n) => document.querySelectorAll('.pk-lop svg').length >= n, soSvg, { timeout: 30_000 })
  await p.waitForTimeout(400)
  return { ctx, p, loi }
}
const dem = (p: Page) => p.evaluate(() => document.getAnimations().length)

describe('phụ kiện thần thú trong Chromium thật', () => {
  for (const rong of [1280, 360] as const) {
    for (const gd of ['sang', 'toi'] as const) {
      it(`${rong} px · ${gd}: khung tên dưới chân, hào quang / vệt sau thú, vệt ngược hướng nhìn, không tràn ngang, không lỗi`, async () => {
        const { ctx, p, loi } = await mo(rong, gd, '&tinh=1')
        expect(loi, loi.join('\n')).toEqual([])
        const r = await p.evaluate(() => {
          const xa = (a: DOMRect, b: DOMRect) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1
          const ra = { cell: 0, chamMat: [] as string[], zSai: [] as string[], vetSai: [] as string[], ngoai: [] as string[] }
          const z = (e: Element) => Number(getComputedStyle(e).zIndex)
          for (const c of Array.from(document.querySelectorAll('[data-thu]'))) {
            ra.cell++
            const mon = c.closest('[data-mon]')!.getAttribute('data-mon')!
            const thuEl = c.querySelector('.pk-thu > .dh-thu') as HTMLElement
            const thu = thuEl.getBoundingClientRect()
            const mat = new DOMRect(thu.left + thu.width * 0.15, thu.top, thu.width * 0.7, thu.height * 0.55) // hộp mặt: nửa trên, giữa
            const khung = c.querySelector('.pk-khung') as HTMLElement | null
            if (khung) {
              const k = khung.getBoundingClientRect()
              if (xa(k, mat)) ra.chamMat.push(mon)
              if (k.top < thu.bottom - 1) ra.chamMat.push(`${mon}: khung nằm trên đáy thú`)
              if (k.right > innerWidth + 1 || k.left < -1) ra.ngoai.push(`${mon} khung ${Math.round(k.left)}..${Math.round(k.right)}`)
            }
            const hq = c.querySelector('.pk-hq'), vet = c.querySelector('.pk-vet')
            for (const l of [hq, vet]) if (l && !(z(l) < z(thuEl))) ra.zSai.push(`${mon}: lớp ${l.className} không sau thú`)
            if (khung && !(z(c.querySelector('.pk-khung-cho')!) > z(thuEl))) ra.zSai.push(`${mon}: khung không trước thú`)
            if (vet) {
              const v = vet.getBoundingClientRect()
              const huong = c.querySelector('.pk-thu')!.getAttribute('data-huong')
              const tam = thu.left + thu.width / 2
              if (huong === 'phai' ? !(v.left < thu.left && v.right <= tam + thu.width * 0.15) : !(v.right > thu.right && v.left >= tam - thu.width * 0.15)) ra.vetSai.push(`${mon} ${huong}`)
            }
          }
          return { ...ra, tran: (document.scrollingElement as HTMLElement).scrollWidth - innerWidth }
        })
        expect(r.cell).toBe(CO_HINH.length * 8)
        expect(r.chamMat, 'khung che mặt thú').toEqual([])
        expect(r.zSai, 'thứ tự lớp sai').toEqual([])
        expect(r.vetSai, 'vệt không nằm phía sau').toEqual([])
        expect(r.ngoai, 'khung ra ngoài màn').toEqual([])
        expect(r.tran, 'trang tràn ngang').toBeLessThanOrEqual(0)
        await ctx.close()
      }, 90_000)
    }
  }
  it('thú nhìn sang TRÁI (?trai=1): vệt lật sang bên PHẢI thú', async () => {
    const { ctx, p } = await mo(1280, 'toi', '&tinh=1&trai=1&mon=VD-04', false, 8)
    const r = await p.evaluate(() => Array.from(document.querySelectorAll('[data-thu]')).map((c) => {
      const t = (c.querySelector('.pk-thu > .dh-thu') as HTMLElement).getBoundingClientRect()
      const v = (c.querySelector('.pk-vet') as HTMLElement).getBoundingClientRect()
      return v.right > t.right && v.left >= t.left + t.width * 0.3
    }))
    expect(r).toHaveLength(8)
    expect(r.every(Boolean)).toBe(true)
    await ctx.close()
  }, 90_000)
  it('chuyển động: bản động ≤ 3 chuyển động trên MỖI thú; bản tĩnh (?tinh=1) = 0; giảm chuyển động của máy = 0', async () => {
    const dong = await mo(1280, 'toi', '&mon=HQ-05', false, 8)
    const moiThu = await dong.p.evaluate(() => Array.from(document.querySelectorAll('.pk-thu')).map((t) => t.getAnimations({ subtree: true }).length))
    expect(moiThu).toHaveLength(8)
    expect(Math.max(...moiThu)).toBeGreaterThan(0) // món có chuyển động thật
    expect(Math.max(...moiThu)).toBeLessThanOrEqual(3)
    await dong.ctx.close()
    const kep = await mo(1280, 'toi', '&mon=KT-08,HQ-03,VD-04', false, 16) // ba ô cùng lúc trên các thú khác nhau; mỗi thú chỉ mặc MỘT món ở trang này ⇒ ≤ 1
    expect(Math.max(...(await kep.p.evaluate(() => Array.from(document.querySelectorAll('.pk-thu')).map((t) => t.getAnimations({ subtree: true }).length))))).toBeLessThanOrEqual(3)
    await kep.ctx.close()
    const tinh = await mo(1280, 'toi', '&tinh=1')
    expect(await dem(tinh.p)).toBe(0)
    await tinh.ctx.close()
    const giam = await mo(1280, 'toi', '', true)
    expect(await dem(giam.p)).toBe(0)
    await giam.ctx.close()
  }, 120_000)
})
