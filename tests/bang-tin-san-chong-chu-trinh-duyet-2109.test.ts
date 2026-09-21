// @vitest-environment node
// BẢNG TIN KIỂU SÀN GIAO DỊCH · khoá CHỒNG CHỮ trong Chromium THẬT (Boss 21/09: ảnh d-1280-vo-toi.jpg còn nhãn 3D "Khối 10"/"Khối 11" đè nhau, chip "Tiến bộ" đè hàng 5 của Dẫn đầu,
// hai hàng cuối bản đồ nhiệt dính nhau) — jsdom không đo được bố cục, nên dựng ĐÚNG màn trong vỏ app thầy (ThanhBenTrai + đúng CSS) bằng Vite + Chromium (WebGL giả lập bằng SwiftShader),
// ở 1280×800 và 1366×768 (cỡ máy thầy hay dùng) + 1440×900, sáng + tối, lấy mẫu 3 lần (camera 3D xoay ⇒ nhãn di chuyển): 0 cặp hộp chữ giao nhau, 0 chữ bị cắt, không cuộn dọc ở chế độ MỘT MÀN.
// Chữ DOM đo bằng Range; chữ canvas (bản đồ nhiệt, nến) đo bằng chặn fillText. Trang thử: tests/_trinh-duyet-bts/.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { chromium, type Browser } from 'playwright'
import { createServer, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import type { AddressInfo } from 'node:net'
import { caiBatChuCanvas, doChongChu, type KetQuaDo } from './_trinh-duyet-bts/do-chong-chu'
import worker from '../server/src/index'
import { xoaDemBangTinSong } from '../server/src/gv-bang-tin-song'
import { goiWorker, taoD1That } from './_d1-that'
import { docSan } from '../src/lib/bang-tin-san/doc-san'

vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }) }))
vi.mock('../src/lib/exam-db', () => ({ loadTeacherSecret: async () => 'mat-thu' }))

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
  await trang.goto(`${goc}/tests/_trinh-duyet-bts/bts.html?gd=${gd}&may=ban`, { waitUntil: 'networkidle' }) // có chip "Máy chủ: đang bận" (chữ dài nhất) ở thanh trên
  await trang.waitForSelector('[data-khoi="bang-tin-san"]')
  await trang.waitForFunction(() => document.querySelector('[data-kieu]')?.getAttribute('data-kieu') !== 'cho', undefined, { timeout: 60_000 })
  await trang.waitForTimeout(1200)
  const coChip = await trang.evaluate(() => document.querySelector('[data-khoi="suc-khoe-may"]')?.textContent ?? null)
  if (coChip !== 'Máy chủ: đang bận') loi.push(`không thấy chip Máy chủ (${coChip})`)
  const lan: KetQuaDo[] = []
  for (let k = 0; k < 3; k++) {
    lan.push(await trang.evaluate(doChongChu))
    await trang.waitForTimeout(900) // camera 3D xoay ⇒ nhãn đổi chỗ
  }
  const kieu = await trang.evaluate(() => document.querySelector('[data-kieu]')?.getAttribute('data-kieu') ?? null)
  await ctx.close()
  return { lan, kieu, loi }
}

const CO: Array<[number, number]> = [[1280, 800], [1366, 768], [1440, 900], [390, 844], [360, 800]]
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
          if (k.cuonDoc && rong >= 980 && cao >= 700) loiDo.push(`[lần ${i + 1}] CUỘN DỌC (màn cao hơn cửa sổ ở chế độ MỘT MÀN)`) // điện thoại (một cột) được cuộn
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

// ── THÂN THẬT (thầy nhờ Boss 21/09: "soi lại Bảng tin sàn 360/390 tối bằng thân thật") ──
// Không dùng dữ liệu mẫu: dựng 264 em (tên DÀI, có chữ "Mẫu" cho rõ là giả, 6 lớp kể cả em chưa xếp lớp) trên D1 giả bằng SQLite thật, gọi ĐÚNG lệnh `/gv/bang-tin-song` của máy chủ, đọc bằng `docSan`, dựng màn trong Chromium.
// Dữ liệu thật có dao động giá rộng (đầu ngày ít câu) và chip chênh dài hơn mẫu — hai lỗi chỉ lộ ở đây: nhãn trục % đè nhau, chữ "10 phút qua" bị tia nhỏ đè (360/390 px).
const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Vũ', 'Đặng', 'Bùi', 'Đỗ']
const DEM = ['Thị Thanh', 'Văn Minh', 'Hoàng Bảo', 'Ngọc Khánh', 'Đức Anh', 'Thị Ngọc', 'Gia', 'Quốc', 'Thị Hồng', 'Xuân']
const TEN = ['Thảo', 'Nguyên', 'Phương', 'Khôi', 'Trang', 'Quỳnh', 'Hiếu', 'Vy', 'Linh', 'An', 'Khánh Linh', 'Bảo Ngọc']
const LOP = ['12 - Tinh Hoa', '12 - Lớp Thường', '12 - Nhóm 10 điểm', 'Khối 10', 'Khối 11', null]
const VN = (t: string): number => Date.parse(`${t}+07:00`)

async function thanThat() {
  xoaDemBangTinSong()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(VN('2026-09-22T10:00:00'))
  try {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('bang_tin_tu',?,'x')").run('2026-09-21T05:00:00.000Z')
    const ins = d.sql.prepare('INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    let n = 0
    for (let i = 0; i < 264; i++) {
      const sbd = `E${1000 + i}`
      const lop = LOP[i % 6]
      d.sql.prepare('INSERT OR REPLACE INTO hoc_sinh(sbd,ho_ten,lop,ten_lop,trang_thai,mat_khau,cap_nhat_luc) VALUES(?,?,?,?,NULL,?,?)')
        .run(sbd, `${HO[i % 10]} ${DEM[(i * 3) % 10]} Mẫu ${TEN[(i * 7) % 12]}`, lop ? (lop.startsWith('Khối') ? lop.slice(5) : '12') : '', lop && !lop.startsWith('Khối') ? lop : null, 'mk', 'x')
      if (i % 5 === 0) {
        for (let k = 0; k < 6 + (i % 25); k++) {
          n++
          const luc = VN('2026-09-22T09:00:00') + (i * 37 + k * 90) * 1000
          ins.run(`k${n}`, sbd, `Q${n}`, 'on_lai', 'm', 1, (i + k) % 4 ? 1 : 0, 30, new Date(luc).toISOString(), '2026-09-22', k % 3 ? 'D.AMIN' : 'D.ESTE')
        }
      }
    }
    const r = (await goiWorker(worker, d.env, '/gv/bang-tin-song', {}, true)) as Record<string, unknown>
    const du = docSan(r, Date.now())
    expect(du, 'bộ đọc từ chối thân thật của máy chủ').not.toBeNull()
    return du!
  } finally {
    vi.useRealTimers()
  }
}

describe('Bảng tin sàn bằng THÂN THẬT của máy chủ (264 em, tên dài) — 360 / 390 / 1280, máy sáng + bấm Tối', () => {
  for (const [rong, cao] of [[360, 800], [390, 844], [1280, 800]] as const) {
    it(`${rong}×${cao}: 0 cặp chữ giao nhau (kể cả chữ × tia nhỏ), 0 chữ bị cắt`, async () => {
      const du = await thanThat()
      const ctx = await trinhDuyet.newContext({ viewport: { width: rong, height: cao }, colorScheme: 'light' })
      const trang = await ctx.newPage()
      await trang.addInitScript('window.__name = window.__name || ((f) => f)')
      await trang.addInitScript(caiBatChuCanvas)
      await trang.addInitScript((x) => { (window as unknown as { __DU: unknown }).__DU = x }, du)
      await trang.goto(`${goc}/tests/_trinh-duyet-bts/bts.html?vo=0`, { waitUntil: 'networkidle' })
      await trang.waitForFunction(() => document.querySelector('[data-kieu]')?.getAttribute('data-kieu') !== 'cho', undefined, { timeout: 60_000 })
      await trang.getByRole('button', { name: 'Tối' }).click()
      await trang.waitForTimeout(1500)
      const k = await trang.evaluate(doChongChu)
      expect(k.soChuDom).toBeGreaterThan(60)
      expect(k.soChuCanvas).toBeGreaterThan(8)
      const loi = [...new Set([...k.giao.map((x) => `GIAO NHAU ${x}`), ...k.cat.map((x) => `BỊ CẮT ${x}`)])]
      expect(loi, loi.join('\n')).toEqual([])
      // chip chênh dài nhất có thể (hàng chục điểm %) cũng không đè tia nhỏ
      await trang.evaluate(() => { document.querySelectorAll('.bts-lech').forEach((e) => { const t = e.textContent ?? ''; if (t.includes('%') || t.includes('điểm')) e.textContent = '+12,7 điểm %' }) })
      await trang.waitForTimeout(200)
      const dai = await trang.evaluate(doChongChu)
      const loiDai = [...new Set(dai.giao.filter((x) => x.startsWith('TIA')))]
      expect(loiDai, `chip dài: ${loiDai.join('\n')}`).toEqual([])
      await ctx.close()
    }, 180_000)
  }
})
