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
