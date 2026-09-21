// @vitest-environment node
// BẢNG TIN KIỂU SÀN GIAO DỊCH · khoá CHỒNG CHỮ trong Chromium THẬT (Boss 21/09: ảnh d-1280-vo-toi.jpg còn nhãn 3D "Khối 10"/"Khối 11" đè nhau, chip "Tiến bộ" đè hàng 5 của Dẫn đầu,
// hai hàng cuối bản đồ nhiệt dính nhau) — jsdom không đo được bố cục, nên dựng ĐÚNG màn trong vỏ app thầy (ThanhBenTrai + đúng CSS) bằng Vite + Chromium (WebGL giả lập bằng SwiftShader),
// ở 1280×800 và 1366×768 (cỡ máy thầy hay dùng) + 1440×900, sáng + tối, lấy mẫu 3 lần (camera 3D xoay ⇒ nhãn di chuyển): 0 cặp hộp chữ giao nhau, 0 chữ bị cắt, không cuộn dọc ở chế độ MỘT MÀN.
// Chữ DOM đo bằng Range; chữ canvas (bản đồ nhiệt, nến) đo bằng chặn fillText. Trang thử: tests/_trinh-duyet-bts/.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser } from 'playwright'
import { createServer, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import type { AddressInfo } from 'node:net'
import { caiBatChuCanvas, doChongChu, type KetQuaDo } from './_trinh-duyet-bts/do-chong-chu'

let may: ViteDevServer
let trinhDuyet: Browser
let goc = ''

beforeAll(async () => {
  may = await createServer({
    configFile: false, // KHÔNG dùng vite.config.ts (nó ghi public/sw-version.json mỗi lần khởi động)
    root: process.cwd(),
    plugins: [react()],
    define: { __PHIEN_BAN__: JSON.stringify('thu'), __SW_BUILT_AT__: 0 },
    server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
    logLevel: 'error',
    optimizeDeps: { entries: ['tests/_trinh-duyet-bts/bts.html'] },
  })
  await may.listen()
  goc = `http://127.0.0.1:${(may.httpServer!.address() as AddressInfo).port}`
  trinhDuyet = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
}, 180_000)
afterAll(async () => {
  await trinhDuyet?.close()
  await may?.close()
})

async function chup(rong: number, cao: number, gd: 'sang' | 'toi'): Promise<{ lan: KetQuaDo[]; kieu: string | null; loi: string[] }> {
  const ctx = await trinhDuyet.newContext({ viewport: { width: rong, height: cao }, colorScheme: gd === 'toi' ? 'dark' : 'light', deviceScaleFactor: 1 })
  const trang = await ctx.newPage()
  const loi: string[] = []
  trang.on('pageerror', (e) => loi.push(e.message))
  trang.on('console', (m) => { if (m.type() === 'error' && !/403|Failed to load resource/.test(m.text())) loi.push(m.text().slice(0, 160)) })
  await trang.addInitScript('window.__name = window.__name || ((f) => f)')
  await trang.addInitScript(caiBatChuCanvas)
  await trang.goto(`${goc}/tests/_trinh-duyet-bts/bts.html?gd=${gd}`, { waitUntil: 'networkidle' })
  await trang.waitForSelector('[data-khoi="bang-tin-san"]')
  await trang.waitForFunction(() => document.querySelector('[data-kieu]')?.getAttribute('data-kieu') !== 'cho', undefined, { timeout: 60_000 })
  await trang.waitForTimeout(1200)
  const lan: KetQuaDo[] = []
  for (let k = 0; k < 3; k++) {
    lan.push(await trang.evaluate(doChongChu))
    await trang.waitForTimeout(900) // camera 3D xoay ⇒ nhãn đổi chỗ
  }
  const kieu = await trang.evaluate(() => document.querySelector('[data-kieu]')?.getAttribute('data-kieu') ?? null)
  await ctx.close()
  return { lan, kieu, loi }
}

const CO: Array<[number, number]> = [[1280, 800], [1366, 768], [1440, 900]]
describe('Bảng tin sàn trong Chromium thật — không chồng chữ, không cắt chữ', () => {
  for (const [rong, cao] of CO) {
    for (const gd of ['sang', 'toi'] as const) {
      it(`${rong}×${cao} trong vỏ app, giao diện ${gd}: 0 cặp chữ giao nhau, 0 chữ bị cắt, không cuộn dọc`, async () => {
        const { lan, kieu, loi } = await chup(rong, cao, gd)
        expect(loi, loi.join('\n')).toEqual([])
        expect(kieu === 'webgl' || kieu === 'iso').toBe(true)
        const loiDo: string[] = []
        for (const [i, k] of lan.entries()) {
          expect(k.soChuDom, `lần ${i + 1}: đo chữ DOM`).toBeGreaterThan(60) // chống đo rỗng
          expect(k.soChuCanvas, `lần ${i + 1}: đo chữ canvas`).toBeGreaterThan(8)
          for (const g of k.giao) loiDo.push(`[lần ${i + 1}] GIAO NHAU ${g}`)
          for (const c of k.cat) loiDo.push(`[lần ${i + 1}] BỊ CẮT ${c}`)
          if (k.cuonDoc) loiDo.push(`[lần ${i + 1}] CUỘN DỌC (màn cao hơn cửa sổ)`)
        }
        expect([...new Set(loiDo.map((x) => x.replace(/^\[lần \d\] /, '')))], loiDo.join('\n')).toEqual([])
      }, 120_000)
    }
  }
})

// ── LƯỚI NẾN + TOKEN TỐI khi thầy ép bằng nút (thầy báo 21/09: máy sáng + bấm Tối mà vạch lưới nến vẫn SÁNG, đè lên nến trên điện thoại) ──
import fs from 'node:fs'
const TOKEN_TOI = (() => {
  const css = fs.readFileSync('src/styles/tokens.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  const m = /:root\[data-giao-dien='toi'\]\s*\{([^}]*)\}/.exec(css)!
  return Object.fromEntries([...m[1]!.matchAll(/(--bts-[a-z0-9-]+)\s*:\s*([^;]+);/g)].map((x) => [x[1]!, x[2]!.trim()]))
})()
const LUOI_SANG = '#eaeef3'
const LUOI_TOI = TOKEN_TOI['--bts-luoi']!

async function mo(rong: number, cao: number, os: 'light' | 'dark') {
  const ctx = await trinhDuyet.newContext({ viewport: { width: rong, height: cao }, colorScheme: os, deviceScaleFactor: 1 })
  const trang = await ctx.newPage()
  await trang.addInitScript('window.__name = window.__name || ((f) => f)')
  await trang.addInitScript(() => {
    const w = window as unknown as { __net: string[] }
    w.__net = []
    const stroke = CanvasRenderingContext2D.prototype.stroke
    CanvasRenderingContext2D.prototype.stroke = function (this: CanvasRenderingContext2D) {
      if (this.canvas.closest('[data-khoi="nen"]')) w.__net.push(String(this.strokeStyle))
      return stroke.apply(this)
    } as typeof stroke
  })
  await trang.goto(`${goc}/tests/_trinh-duyet-bts/bts.html?vo=0`, { waitUntil: 'networkidle' })
  await trang.waitForSelector('[data-khoi="nen"] canvas')
  await trang.waitForTimeout(700)
  const netSauKhi = async () => {
    await trang.evaluate(() => { (window as unknown as { __net: string[] }).__net = [] })
    await trang.waitForTimeout(600)
    return trang.evaluate(() => [...new Set((window as unknown as { __net: string[] }).__net)])
  }
  const token = (k: string) => trang.evaluate((t) => getComputedStyle(document.querySelector('.bts-san')!).getPropertyValue(t).trim(), k)
  return { ctx, trang, netSauKhi, token }
}

describe('nến + token khi thầy ÉP Tối trên máy SÁNG', () => {
  it('máy sáng, "theo máy" ⇒ lưới vẽ màu SÁNG; đặt data-giao-dien="toi" KHÔNG qua viết lại media ⇒ MỌI token --bts-* thành bản tối ngay và lưới đổi sang màu tối (không còn vạch sáng)', async () => {
    const t = await mo(1280, 800, 'light')
    expect(await t.token('--bts-luoi')).toBe(LUOI_SANG)
    expect(await t.netSauKhi()).toContain(LUOI_SANG)
    await t.trang.evaluate(() => document.documentElement.setAttribute('data-giao-dien', 'toi')) // cố ý KHÔNG gọi datGiaoDien: không viết lại @media
    await t.trang.waitForTimeout(300)
    for (const [k, v] of Object.entries(TOKEN_TOI)) expect(await t.token(k), k).toBe(v)
    const net = await t.netSauKhi()
    expect(net).toContain(LUOI_TOI)
    expect(net).not.toContain(LUOI_SANG)
    await t.ctx.close()
  }, 120_000)
  it('bấm nút "Tối" thật (máy sáng) ở màn rộng ⇒ lưới vẫn CÓ nhưng MỜ đúng token tối; ép Sáng khi máy tối ⇒ lưới sáng', async () => {
    const t = await mo(1280, 800, 'light')
    await t.trang.getByRole('button', { name: 'Tối' }).click()
    await t.trang.waitForTimeout(300)
    expect(await t.token('--bts-luoi')).toBe(LUOI_TOI)
    const net = await t.netSauKhi()
    expect(net).toContain(LUOI_TOI)
    expect(net).not.toContain(LUOI_SANG)
    await t.ctx.close()
    const s = await mo(1280, 800, 'dark')
    await s.trang.getByRole('button', { name: 'Sáng' }).click()
    await s.trang.waitForTimeout(300)
    expect(await s.token('--bts-luoi')).toBe(LUOI_SANG)
    const netS = await s.netSauKhi()
    expect(netS).toContain(LUOI_SANG)
    expect(netS).not.toContain(LUOI_TOI)
    await s.ctx.close()
  }, 120_000)
  it('ĐIỆN THOẠI (390 px): nến KHÔNG vẽ lưới ngang / dọc — ở cả sáng lẫn tối, kể cả máy sáng + bấm Tối; nhãn trục % và giờ vẫn có', async () => {
    for (const os of ['light', 'dark'] as const) {
      const t = await mo(390, 844, os)
      expect(await t.trang.evaluate(() => document.querySelector('[data-khoi="nen"]')!.getBoundingClientRect().width)).toBeLessThan(640)
      let net = await t.netSauKhi()
      expect(net, `${os}: có nét vẽ lưới`).not.toContain(LUOI_SANG)
      expect(net).not.toContain(LUOI_TOI)
      await t.trang.getByRole('button', { name: 'Tối' }).click()
      await t.trang.waitForTimeout(300)
      net = await t.netSauKhi()
      expect(net, `${os} + bấm Tối: có nét vẽ lưới`).not.toContain(LUOI_SANG)
      expect(net).not.toContain(LUOI_TOI)
      expect(await t.trang.evaluate(() => (document.querySelector('[data-khoi="nen"]') as HTMLElement).innerText)).toMatch(/Nhịp học trực tiếp/)
      await t.ctx.close()
    }
  }, 120_000)
})
