// @vitest-environment node
// PHỤ KIỆN THẦN THÚ · M3 — Chromium THẬT trên trang xem thử (src/components/xem-thu/phu-kien.html?dot=2, dữ liệu giả): 16 món đợt 2 (Trên đầu · Trên lưng) × 8 loài × 6 giai đoạn tiến hoá
// (cấp 1/10/30/50/70/100 — KHÔNG chỉ cấp 100) × thú nhìn phải / nhìn trái (`quayTrai`).
// Khoá: hộp món ĐÚNG điểm neo (tâm; đầu: đỉnh đầu ở 70% hộp; lật ngang khi quay trái, hình cũng lật), món TRƯỚC thú (mũ, khăn, áo, ba lô) KHÔNG che mắt / mặt, cánh + áo choàng nằm SAU thú,
// trên đầu nằm trên cùng, không tràn ngang; chuyển động: mỗi món ≤ 1, Thường = 0, Sử thi / Huyền thoại ≥ 1, mặc đủ 5 ô ⇒ một thú ≤ 3, bản tĩnh / giảm chuyển động = 0.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser, type Page } from 'playwright'
import { createServer, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import type { AddressInfo } from 'node:net'
import { MON_DOT_2 } from '../src/game/than-thu-v2/phu-kien/phu-kien-mon'
import { neoCua } from '../src/game/than-thu-v2/phu-kien/phu-kien-neo'

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

const CO = 180
async function mo(tham: string, soSvg: number, giam = false) {
  const ctx = await tr.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark', reducedMotion: giam ? 'reduce' : 'no-preference' })
  const p = await ctx.newPage()
  const loi: string[] = []
  p.on('pageerror', (e) => loi.push(e.message))
  p.on('console', (m) => { if (m.type() === 'error') loi.push(m.text().slice(0, 160)) })
  await p.goto(`${goc}/src/components/xem-thu/phu-kien.html?gd=toi&co=${CO}${tham}`, { waitUntil: 'networkidle' })
  await p.waitForFunction((n) => document.querySelectorAll('.pk-lop svg').length >= n, soSvg, { timeout: 60_000 })
  await p.waitForTimeout(500)
  return { ctx, p, loi }
}
const dem = (p: Page) => p.evaluate(() => document.getAnimations().length)
const CAP = [1, 10, 30, 50, 70, 100] as const

describe('món đợt 2 trong Chromium thật — mọi giai đoạn tiến hoá, nhìn phải và nhìn trái', () => {
  for (const cap of CAP) {
    for (const trai of [false, true]) {
      it(`cấp ${cap} · nhìn ${trai ? 'TRÁI' : 'phải'}: 16 món × 8 loài đúng điểm neo, món trước thú không che mắt / mặt, cánh + áo choàng sau thú, trên đầu trên cùng, không tràn ngang`, async () => {
        const { ctx, p, loi } = await mo(`&dot=2&tinh=1&cap=${cap}${trai ? '&trai=1' : ''}`, 16 * 8)
        expect(loi, loi.join('\n')).toEqual([])
        const neo = Array.from({ length: 8 }, (_, pet) => neoCua(pet, cap, trai))
        const ban = Object.fromEntries(MON_DOT_2.map((m) => [m.ma, { neo: m.neo, lop: m.lop }]))
        const r = await p.evaluate(({ neo, ban, trai }) => {
          const ra = { o: 0, lechViTri: [] as string[], cheMat: [] as string[], zSai: [] as string[], khongLat: [] as string[], ngoai: [] as string[] }
          const z = (e: Element) => Number(getComputedStyle(e).zIndex)
          for (const c of Array.from(document.querySelectorAll('[data-thu]'))) {
            const pet = Number(c.getAttribute('data-thu'))
            const ma = c.closest('[data-mon]')!.getAttribute('data-mon')!
            const ten = `loài ${pet} ${ma}`
            const hop = (c.querySelector('.pk-thu') as HTMLElement).getBoundingClientRect()
            const thu = c.querySelector('.pk-thu > .dh-thu') as HTMLElement
            const e = c.querySelector('.pk-neo') as HTMLElement | null
            if (!e) { ra.lechViTri.push(`${ten}: không có hộp món`); continue }
            ra.o++
            const info = ban[ma]!, n = neo[pet]!
            const d = n[info.neo as 'dau' | 'co' | 'lung']
            const rc = e.getBoundingClientRect()
            const gocY = info.neo === 'dau' ? rc.top + 0.7 * rc.height : rc.top + 0.5 * rc.height
            const ex = hop.left + d.x * hop.width, ey = hop.top + d.y * hop.height
            if (Math.abs(rc.left + rc.width / 2 - ex) > 1.5 || Math.abs(gocY - ey) > 1.5) ra.lechViTri.push(`${ten}: tâm (${Math.round(rc.left + rc.width / 2)},${Math.round(gocY)}) ≠ neo (${Math.round(ex)},${Math.round(ey)})`)
            const he = { dau: 1.25, co: 2.9, lung: 1.25 }[info.neo as 'dau' | 'co' | 'lung']
            if (Math.abs(rc.width - d.r * he * hop.width) > 1.5) ra.lechViTri.push(`${ten}: rộng ${rc.width.toFixed(1)} ≠ ${(d.r * he * hop.width).toFixed(1)}`)
            // hình lật theo hướng nhìn
            const m = new DOMMatrix(getComputedStyle(e.querySelector('svg')!).transform === 'none' ? undefined : getComputedStyle(e.querySelector('svg')!).transform)
            if (trai ? m.a >= 0 : m.a <= 0) ra.khongLat.push(`${ten}: a=${m.a}`)
            // thứ tự lớp
            const zt = z(thu), ze = z(e)
            if (info.lop === 'sau' ? !(ze < zt) : !(ze > zt)) ra.zSai.push(`${ten}: lớp ${info.lop} z ${ze} thú ${zt}`)
            if (info.neo === 'dau') {
              // trên đầu: trên cùng (trên cả khung tên nếu có)
              const k = c.querySelector('.pk-khung-cho') as HTMLElement | null
              if (k && !(ze > z(k))) ra.zSai.push(`${ten}: trên đầu không trên cùng`)
            }
            // món TRƯỚC thú không được che mắt: hộp mặt quanh điểm giữa hai mắt (rộng ±0,30 · đầu, cao ±0,09 · đầu); xét từng hình con
            if (info.lop === 'truoc') {
              const rong = 0.3 * n.dau.r * hop.width, cao = 0.09 * n.dau.r * hop.width
              const f = { l: hop.left + n.mat.x * hop.width - rong, r: hop.left + n.mat.x * hop.width + rong, t: hop.top + n.mat.y * hop.height - cao, b: hop.top + n.mat.y * hop.height + cao }
              for (const sh of Array.from(e.querySelectorAll('path,circle,rect,ellipse')).filter((x) => !x.closest('defs,clipPath'))) {
                const s = sh.getBoundingClientRect()
                if (Math.min(s.right, f.r) - Math.max(s.left, f.l) > 2 && Math.min(s.bottom, f.b) - Math.max(s.top, f.t) > 2) { ra.cheMat.push(`${ten}: ${sh.tagName} ${sh.getAttribute('class') ?? ''}`); break }
              }
            }
            if (rc.left < -1 || rc.right > innerWidth + 1) ra.ngoai.push(`${ten}: ${Math.round(rc.left)}..${Math.round(rc.right)}`)
          }
          return { ...ra, tran: (document.scrollingElement as HTMLElement).scrollWidth - innerWidth }
        }, { neo, ban, trai })
        expect(r.o, 'đủ 16 món × 8 loài').toBe(16 * 8)
        expect(r.lechViTri, 'món lệch điểm neo').toEqual([])
        expect(r.cheMat, 'món che mắt / mặt thú').toEqual([])
        expect(r.zSai, 'thứ tự lớp sai').toEqual([])
        expect(r.khongLat, 'hình không lật theo hướng nhìn').toEqual([])
        expect(r.ngoai, 'món ra ngoài màn').toEqual([])
        expect(r.tran, 'trang tràn ngang').toBeLessThanOrEqual(0)
        await ctx.close()
      }, 180_000)
    }
  }

  it('chuyển động: MỖI thú ≤ 1 chuyển động khi mặc MỘT món đợt 2; Thường = 0; Sử thi / Huyền thoại ≥ 1', async () => {
    const dong = await mo('&dot=2', 16 * 8)
    const theoMon = await dong.p.evaluate(() => Object.fromEntries(Array.from(document.querySelectorAll('section[data-mon]')).map((s) => [s.getAttribute('data-mon')!, Math.max(...Array.from(s.querySelectorAll('.pk-thu')).map((t) => t.getAnimations({ subtree: true }).length))])))
    expect(Object.keys(theoMon)).toHaveLength(16)
    for (const m of MON_DOT_2) {
      expect(theoMon[m.ma]!, m.ma).toBeLessThanOrEqual(1)
      if (m.bac === 1) expect(theoMon[m.ma], `${m.ma} bậc Thường không chuyển động`).toBe(0)
      if (m.bac >= 4) expect(theoMon[m.ma]!, `${m.ma} bậc ${m.bac} có chuyển động riêng`).toBeGreaterThanOrEqual(1)
    }
    await dong.ctx.close()
  }, 180_000)

  it('MẶC ĐỦ 5 ô bậc Huyền thoại: mỗi thú ≤ 3 chuyển động, 2 món đứng yên; bản tĩnh và giảm chuyển động của máy = 0', async () => {
    const bo = '&bo=HQ-08,VD-08,KT-08,DA-08,CL-08'
    const dong = await mo(bo, 32)
    const r = await dong.p.evaluate(() => Array.from(document.querySelectorAll('.pk-thu')).map((t) => ({ dong: t.getAnimations({ subtree: true }).length, dung: t.querySelectorAll('.pk-dung').length, lop: t.querySelectorAll('[data-mon]').length })))
    expect(r).toHaveLength(8)
    for (const x of r) {
      expect(x.lop).toBe(5)
      expect(x.dong).toBeLessThanOrEqual(3)
      expect(x.dong).toBeGreaterThanOrEqual(1)
      expect(x.dung).toBe(2)
    }
    await dong.ctx.close()
    const tinh = await mo(`${bo}&tinh=1`, 32)
    expect(await dem(tinh.p)).toBe(0)
    await tinh.ctx.close()
    const giam = await mo(`&dot=2`, 16 * 8, true)
    expect(await dem(giam.p)).toBe(0)
    await giam.ctx.close()
  }, 240_000)
})
