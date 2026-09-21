// Đảo có thêm mục "Cửa hàng" (5 mục khi Đoàn đang mở): thanh dưới KHÔNG tràn ngang, mọi nút ≥ 44 px, chữ không bị cắt — Chromium THẬT + dao.css THẬT + markup của DaoThanThu THẬT
// (dựng bằng jsdom rồi đưa HTML sang Chromium). 320 / 360 / 390 px, sáng + tối.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import { chromium, type Browser } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import DaoThanThu from '../src/game/than-thu-v2/dao/DaoThanThu'
import type { DaoKetQua, DaoProfile } from '../src/game/than-thu-v2/dao/kieu'
import { chuCuaHang } from '../src/game/than-thu-v2/shop/chu-shop'

vi.mock('../src/game/than-thu-v2/dao/ManShopThat', () => ({ default: () => null }))

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const CSS = ['src/styles/tokens.css', 'src/game/than-thu-v2/dao/dao.css'].map((f) => doc(f).replace(/@import[^;]*;/g, '')).join('\n')
const hoSo = { nickname: 'Lửa Nhỏ', pet: 'lua_phuong', choice: false, cap: 34, exp: 10, wallet: 0, mastery: [], shields: { used: 0, activeUntil: 0 } } as unknown as DaoProfile

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

const dungHtml = async (doanMo: boolean): Promise<string> => {
  const call = vi.fn(async (action: string): Promise<DaoKetQua> => ({ ok: true, ...(action === 'recommendations' ? { suggestions: [], shopBat: true } : {}) }))
  const v = render(<DaoThanThu sbd="1" token="tok" profile={hoSo} doanMo={doanMo} call={call} onMoDoan={() => {}} onDong={() => {}} />)
  await waitFor(() => expect([...v.container.querySelectorAll('.dao-nav button')].map((b) => b.textContent)).toContain(chuCuaHang))
  const html = v.container.innerHTML
  cleanup()
  return html
}

for (const doanMo of [false, true])
  for (const [w, h] of [[320, 640], [360, 740], [390, 844]] as const)
    for (const mau of ['light', 'dark'] as const)
      it(`Chromium thật ${w}×${h} · ${mau} · Đoàn ${doanMo ? 'mở (5 mục)' : 'đóng (4 mục)'}: thanh dưới không tràn, nút ≥ 44 px, chữ không bị cắt`, async () => {
        if (!browser) return
        const html = await dungHtml(doanMo)
        const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: mau })
        const page = await ctx.newPage()
        await page.setContent(`<!doctype html><html lang="vi"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0}${CSS}</style></head><body>${html}</body></html>`)
        await page.waitForTimeout(100)
        const o = await page.evaluate(() => {
          const nav = document.querySelector('.dao-nav') as HTMLElement
          const r = nav.getBoundingClientRect()
          const nut = [...nav.querySelectorAll<HTMLElement>('button')].map((b) => {
            const c = b.getBoundingClientRect()
            const chu = [...b.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('')
            return { ten: b.textContent, rong: Math.round(c.width), cao: Math.round(c.height), trai: c.left, phai: c.right, tran: b.scrollWidth > b.clientWidth + 1, chu }
          })
          return { navTrai: r.left, navPhai: r.right, tranNgang: document.documentElement.scrollWidth > document.documentElement.clientWidth, nut }
        })
        await ctx.close()
        expect(o.tranNgang).toBe(false)
        expect(o.nut.length).toBe(doanMo ? 5 : 4)
        for (const n of o.nut) {
          expect(n.rong, `«${n.ten}» hẹp`).toBeGreaterThanOrEqual(44)
          expect(n.cao).toBeGreaterThanOrEqual(44)
          expect(n.trai).toBeGreaterThanOrEqual(o.navTrai - 0.5)
          expect(n.phai).toBeLessThanOrEqual(o.navPhai + 0.5)
          expect(n.tran, `«${n.ten}» chữ tràn khỏi nút`).toBe(false)
        }
      }, 30000)
