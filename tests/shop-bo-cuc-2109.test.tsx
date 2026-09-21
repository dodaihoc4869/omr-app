// @vitest-environment node
// CỬA HÀNG PHỤ KIỆN · B1 — BỐ CỤC trên Chromium THẬT + shop.css THẬT + markup của các màn thật (renderToStaticMarkup), ở 320/360/390 × sáng + tối × cả 4 màn × TÊN MÓN DÀI.
// (1) 0 tràn ngang, 0 phần tử ra ngoài thẻ, đích chạm ≥ 44 px · (2) chuyển trạng thái (chọn món, có/không có nút phụ, lời báo, số vàng, lỗi) KHÔNG làm đổi vị trí thẻ/nút
// (đo getBoundingClientRect trước/sau như test Đoàn) · (3) ≤ 3 chuyển động cùng lúc, giảm chuyển động = 0, sau tấm phủ tạm dừng · (4) cách ly khỏi `.spirit-game button` của game.css
// · ĐỐI CHỨNG: năm bản CỐ Ý làm hỏng CSS đều bị bắt (không thì bộ thử trên vô nghĩa).
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser, type Page } from 'playwright'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'
import fs from 'node:fs'
import path from 'node:path'
import { DANH_MUC_PHU_KIEN } from '../src/lib/phu-kien-danh-muc'
import type { MonPhuKien } from '../src/lib/phu-kien-danh-muc'
import CuaHang from '../src/game/than-thu-v2/shop/CuaHang'
import ThuDo from '../src/game/than-thu-v2/shop/ThuDo'
import TuDo from '../src/game/than-thu-v2/shop/TuDo'
import TamChao from '../src/game/than-thu-v2/shop/TamChao'
import XacNhanMua from '../src/game/than-thu-v2/shop/XacNhanMua'
import { ShopApiGia } from '../src/game/than-thu-v2/shop/du-lieu-mau'
import type { TuyChonGia } from '../src/game/than-thu-v2/shop/du-lieu-mau'
import type { MonShop, ViSoMo } from '../src/game/than-thu-v2/shop/kieu'
import { ghepDanhMuc, oSapMo } from '../src/game/than-thu-v2/shop/logic-shop'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const boImport = (s: string) => s.replace(/@import[^;]*;/g, '')
const CSS = ['src/styles/tokens.css', 'src/game/than-thu-v2/shop/shop.css'].map((f) => boImport(doc(f))).join('\n')
const GAME_CSS = boImport(doc('src/game/than-thu-v2/game.css'))
const noop = () => {}

type CH = Parameters<typeof CuaHang>[0]
type TD = Parameters<typeof ThuDo>[0]
type TU = Parameters<typeof TuDo>[0]

/** Tên món DÀI: nhiều từ, và một từ liền không dấu cách (bắt lỗi thiếu overflow-wrap). */
const TEN_DAI: Record<string, string> = {
  'HQ-01': 'Supercalifragilisticexpialidocious',
  'VD-04': 'Đuôi Lửa Tím Siêu Dài Của Cả Đoàn Hộ Tống Mùa Một',
  'KT-03': 'Khung Ô Nguyên Tố Của Em Học Sinh Lớp Mười Hai Tinh Hoa',
  'KT-08': 'Khung Vàng Chín Chín Chín Huyền Thoại Của Thầy Đỗ Đại Học',
  'HQ-05': 'Vòng Sáng Neon Đỏ Cam Rực Rỡ Toả Sáng Cả Đêm Dài',
  'HQ-07': 'Dải Cực Quang Xanh Lục Tím Uốn Lượn Sau Lưng Thần Thú',
}
const danhMucDai = (): MonPhuKien[] => DANH_MUC_PHU_KIEN.map((m) => ({ ...m, ten: TEN_DAI[m.ma] ?? m.ten }))
const TEN_THU_DAI = 'Bé Mây Có Tên Rất Dài Của Một Em Học Sinh Lớp Mười Hai'

async function duLieu(t: TuyChonGia = {}, danhMuc?: readonly MonPhuKien[]) {
  const api = new ShopApiGia(t)
  const vi = (await api.vangXem()) as ViSoMo
  const ds = await api.shopDanhSach()
  return { vi, vang: ds.vang, em: ds.emCo, mon: ghepDanhMuc(ds.mon, danhMuc), dangMac: ds.dangMac }
}
type DL = Awaited<ReturnType<typeof duLieu>>
const doiMon = (mon: readonly MonShop[], ma: string, sua: Partial<MonShop>): MonShop[] => mon.map((m) => (m.ma === ma ? { ...m, ...sua } : m))

const cuaHang = (d: DL, sua: Partial<CH> = {}): CH => ({ dangTai: false, vi: d.vi, vang: d.vang, em: d.em, mon: d.mon, dangThu: {}, loc: 'tat-ca', sapMo: (o) => oSapMo(o, d.mon), soExp: 0, baoDoi: '', onLoc: noop, onSoExp: noop, onDoi: noop, onThu: noop, onTuDo: noop, onVe: noop, ...sua })
const thuDo = (d: DL, sua: Partial<TD> = {}): TD => ({
  vang: d.vang, vi: d.vi, em: d.em, mon: d.mon, dangMac: d.dangMac, dangThu: { 'hao-quang': 'HQ-05', vet: 'VD-04', khung: 'KT-08' }, tieuDiem: 'HQ-05', pet: 2, cap: 34, tenThu: TEN_THU_DAI, bao: '', loiMac: null, dangGuiMac: false,
  onTieuDiem: noop, onVe: noop, onToiCuaHang: noop, onToiDoi: noop, onMua: noop, onMac: noop, onBoThu: noop, ...sua,
})
const tuDo = (d: DL, sua: Partial<TU> = {}): TU => ({ mon: d.mon, dangTai: false, loiTai: '', dong: false, sapMo: (o) => oSapMo(o, d.mon), bao: '', loiMac: null, dangGui: null, onMac: noop, onCoi: noop, onVe: noop, onToiCuaHang: noop, onThuLai: noop, ...sua })

const trang = (noiDung: ReactElement, css = CSS, phu: ReactElement | null = null) =>
  `<!doctype html><html lang="vi"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0}${css}</style></head><body>${renderToStaticMarkup(
    <div className="ps" data-co-phu={phu ? '1' : '0'}>
      <div className="ps-man">{noiDung}</div>
      {phu}
    </div>,
  )}</body></html>`

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

/** Đo một trang: tràn ngang, phần tử ra ngoài khung, đích chạm nhỏ. Chạy TRONG trình duyệt (tự chứa). */
const doTrang = () => {
  const ps = document.querySelector('.ps') as HTMLElement
  const rr = ps.getBoundingClientRect()
  const tranRoot: string[] = []
  const ra: string[] = []
  const nho: string[] = []
  const cat: string[] = []
  const ten = (e: Element) => `${e.tagName.toLowerCase()}.${(e as HTMLElement).className || ''} «${(e.textContent || '').slice(0, 24)}»`
  for (const e of ps.querySelectorAll<HTMLElement>('*')) {
    if (e.closest('.ps-doc, .ps-loc, .ps-san')) continue
    const c = e.getBoundingClientRect()
    if (c.width === 0 && c.height === 0) continue
    if (c.left < rr.left - 0.75 || c.right > rr.right + 0.75) tranRoot.push(`${ten(e)} [${Math.round(c.left)},${Math.round(c.right)}] ngoài khung [${Math.round(rr.left)},${Math.round(rr.right)}]`)
  }
  for (const t of ps.querySelectorAll<HTMLElement>('.ps-the, .ps-kinh, .ps-chi-tiet, .ps-to, .ps-thu-hang, .ps-tu-hang, .ps-san')) {
    const r = t.getBoundingClientRect()
    for (const e of t.querySelectorAll<HTMLElement>('*')) {
      if (e.closest('.ps-doc, .ps-the-tranh')) continue
      if (t.classList.contains('ps-san') && e.closest('.ps-gc-hq, .ps-gc-vet, .ps-san-be, .ps-san-trang, .dh-thu')) continue
      const c = e.getBoundingClientRect()
      if (c.width === 0 && c.height === 0) continue
      if (c.left < r.left - 0.75 || c.right > r.right + 0.75 || c.top < r.top - 0.75 || c.bottom > r.bottom + 0.75) ra.push(`${ten(e)} ngoài ${ten(t)}`)
    }
  }
  for (const e of ps.querySelectorAll<HTMLElement>('*')) {
    if (e.closest('.ps-doc, .ps-loc, .ps-san, svg') || e instanceof HTMLInputElement || e.classList.contains('ps-man')) continue
    if (e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0) cat.push(`${ten(e)} scrollWidth ${e.scrollWidth} > ${e.clientWidth}`)
  }
  for (const b of ps.querySelectorAll<HTMLElement>('button, input[type=range], input[type=number]')) {
    const c = b.getBoundingClientRect()
    if (c.width === 0 && c.height === 0) continue
    if (c.height < 44 - 0.5 || c.width < 44 - 0.5) nho.push(`${ten(b)} ${Math.round(c.width)}×${Math.round(c.height)}`)
  }
  return { tranNgang: document.documentElement.scrollWidth > document.documentElement.clientWidth, tranRoot, ra, nho, cat }
}

const chupVung = (dsChon: string[]) =>
  dsChon.map((s) => [...document.querySelectorAll(s)].map((e) => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height].map((n) => Math.round(n * 10) / 10) }))

const CO = [[320, 640], [360, 740], [390, 844]] as const
async function mo(w: number, h: number, html: string, mau: 'light' | 'dark' = 'light') {
  const ctx = await browser!.newContext({ viewport: { width: w, height: h }, colorScheme: mau })
  const page = await ctx.newPage()
  await page.setContent(html)
  await page.waitForTimeout(40)
  return { page, dong: () => ctx.close() }
}
async function do1(w: number, h: number, html: string, mau: 'light' | 'dark' = 'light') {
  const { page, dong } = await mo(w, h, html, mau)
  const o = await page.evaluate(doTrang)
  await dong()
  return o
}
/** Chụp vị trí các vùng ở hai trang, trong CÙNG một ngữ cảnh. */
async function so2(w: number, h: number, a: string, b: string, chon: string[]) {
  const ctx = await browser!.newContext({ viewport: { width: w, height: h } })
  const page: Page = await ctx.newPage()
  await page.setContent(a)
  await page.waitForTimeout(30)
  const x = await page.evaluate(chupVung, chon)
  await page.setContent(b)
  await page.waitForTimeout(30)
  const y = await page.evaluate(chupVung, chon)
  await ctx.close()
  const khac: string[] = []
  chon.forEach((sel, i) => {
    if (JSON.stringify(x[i]) !== JSON.stringify(y[i])) khac.push(`${sel}: ${JSON.stringify(x[i])} → ${JSON.stringify(y[i])}`)
  })
  return { x, y, giong: khac.length === 0, khac }
}
const ok = (o: Awaited<ReturnType<typeof do1>>) => {
  expect(o.tranNgang).toBe(false)
  expect(o.tranRoot, o.tranRoot.join('\n')).toEqual([])
  expect(o.ra, o.ra.join('\n')).toEqual([])
  expect(o.nho, o.nho.join('\n')).toEqual([])
  expect(o.cat, o.cat.join('\n')).toEqual([]) // chữ tràn ra khỏi khung của chính nó
}

// ───────────────────────── (1) không tràn, đích chạm ─────────────────────────
for (const [w, h] of CO)
  for (const mau of ['light', 'dark'] as const)
    describe(`Chromium thật ${w}×${h} · ${mau}: 4 màn + tấm phủ, tên món DÀI`, () => {
      it('Cửa hàng (24 thẻ, tên dài, món khoá 2 điều kiện, lời chỉ đường, đã chọn 3 món): 0 tràn ngang, 0 ra ngoài thẻ, đích chạm ≥ 44', async () => {
        if (!browser) return
        const d = await duLieu({}, danhMucDai())
        const dangThu = { 'hao-quang': 'HQ-05', vet: 'VD-04', khung: 'KT-08' } as const
        ok(await do1(w, h, trang(<CuaHang {...cuaHang(d, { dangThu, soExp: 420, baoDoi: 'Đã đổi xong. Em có 5.000 vàng, thần thú vẫn đủ 1 ngày ăn.' })} />), mau))
        ok(await do1(w, h, trang(<CuaHang {...cuaHang(d, { dangTai: true })} />), mau)) // khung xám giữ chỗ cũng vậy
        ok(await do1(w, h, trang(<CuaHang {...cuaHang(await duLieu({ ongNghiem: 180, vang: 64210 }, danhMucDai()))} />), mau)) // hết EXP thừa + ví lớn
      }, 60000)

      it('Thử đồ (sân khấu + tên thú dài + 3 món thử; đủ mọi trạng thái của món đang xem): 0 tràn ngang, 0 ra ngoài khung, đích chạm ≥ 44', async () => {
        if (!browser) return
        const d = await duLieu({}, danhMucDai())
        for (const ma of ['HQ-05', 'VD-04', 'KT-08']) ok(await do1(w, h, trang(<ThuDo {...thuDo(d, { tieuDiem: ma })} />), mau))
        // các trạng thái còn lại của cùng một món
        const bien: Partial<MonShop>[] = [{ daCo: true }, { daCo: true, dangMac: true }, { suatTong: 10, suatCon: 0 }, { moKhoa: false, thieu: 'Cần chuỗi 7 ngày' }]
        for (const b of bien) ok(await do1(w, h, trang(<ThuDo {...thuDo({ ...d, mon: doiMon(d.mon, 'HQ-05', b) })} />), mau))
        ok(await do1(w, h, trang(<ThuDo {...thuDo(d, { dangThu: {}, tieuDiem: null, bao: 'Hợp quá! Khung Vàng Chín Chín Chín Huyền Thoại Của Thầy Đỗ Đại Học đã là của em. Em còn 220 vàng. Em vẫn đủ vàng cho Vòng Lửa Vàng, giá 150 vàng.' })} />), mau))
        ok(await do1(w, h, trang(<ThuDo {...thuDo(d, { loiMac: { loi: 'Em chưa có món này nên chưa mặc được.', thuLai: noop } })} />), mau))
      }, 60000)

      it('Xác nhận mua / đổi + tấm chào: 0 tràn, nút ≥ 44; nút bấm được cả khi có lỗi dài', async () => {
        if (!browser) return
        const d = await duLieu({}, danhMucDai())
        const vd04 = d.mon.find((m) => m.ma === 'VD-04')!
        const loiDai = 'Thần thú cần giữ lại 200 EXP để ăn. Em đổi được tối đa 420 EXP.'
        for (const viec of [{ loai: 'mua', mon: vd04, vang: 340 }, { loai: 'doi', soExp: 420, ongNghiem: 620, giuLai: 200 }] as const)
          for (const loi of ['', loiDai]) ok(await do1(w, h, trang(<div />, CSS, <XacNhanMua viec={viec} dangGui={false} loi={loi} onXacNhan={noop} onDeSau={noop} />), mau))
        ok(await do1(w, h, trang(<div />, CSS, <TamChao onXong={noop} />), mau))
      }, 60000)

      it('Tủ đồ (tên dài, đủ 5 chỗ đeo, lỗi, trống, đang tải, cửa hàng đóng): 0 tràn, đích chạm ≥ 44', async () => {
        if (!browser) return
        const d = await duLieu({ soHuu: ['HQ-01', 'VD-04', 'KT-03', 'KT-08', 'HQ-05', 'HQ-07'], dangMac: { 'hao-quang': 'HQ-01', khung: 'KT-03' } }, danhMucDai())
        ok(await do1(w, h, trang(<TuDo {...tuDo(d, { bao: 'Đã mặc Khung Ô Nguyên Tố Của Em Học Sinh Lớp Mười Hai Tinh Hoa.', loiMac: { loi: 'Em chưa có món này nên chưa mặc được.', thuLai: noop } })} />), mau))
        const rong = await duLieu({ soHuu: [], dangMac: {} })
        ok(await do1(w, h, trang(<TuDo {...tuDo(rong)} />), mau))
        ok(await do1(w, h, trang(<TuDo {...tuDo(d, { mon: null, dangTai: true })} />), mau))
        ok(await do1(w, h, trang(<TuDo {...tuDo(d, { mon: null, loiTai: 'Mất mạng rồi. Có mạng lại mới mua được, em vẫn xem được Tủ đồ.' })} />), mau))
        ok(await do1(w, h, trang(<TuDo {...tuDo(d, { mon: null, dong: true, loiTai: 'Cửa hàng đang tạm đóng. Đồ em đã mua vẫn còn nguyên.' })} />), mau))
      }, 60000)
    })

// ───────────────────────── (2) không nhảy khi đổi trạng thái ─────────────────────────
const VUNG_CUA_HANG = ['.ps-dau button', '.ps-vi', '.ps-doi', '.ps-doi input', '.ps-doi button', '.ps-loc button', '.ps-chu-giai', '.ps-luoi', '.ps-the']
for (const [w, h] of CO)
  describe(`Chromium thật ${w}×${h}: KHÔNG nhảy`, () => {
    it('Cửa hàng: chọn một / ba món, kéo thanh, lời báo sau đổi, ví lớn, món đã có / đang mặc ⇒ mọi thẻ, khối, nút đứng NGUYÊN vị trí và kích thước', async () => {
      if (!browser) return
      const d = await duLieu()
      const goc = trang(<CuaHang {...cuaHang(d)} />)
      const chon = { 'hao-quang': 'HQ-05', vet: 'VD-04', khung: 'KT-08' } as const
      const bien: Record<string, CH> = {
        'chọn một món': cuaHang(d, { dangThu: { vet: 'VD-04' } }),
        'chọn ba món': cuaHang(d, { dangThu: chon }),
        'kéo thanh 180': cuaHang(d, { soExp: 180 }),
        'kéo thanh hết cỡ': cuaHang(d, { soExp: 420 }),
        'lời báo sau khi đổi': cuaHang(d, { baoDoi: 'Đã đổi xong. Em có 520 vàng, thần thú vẫn đủ 2 ngày ăn.' }),
        'VD-04 đã có': cuaHang({ ...d, mon: doiMon(d.mon, 'VD-04', { daCo: true }) }),
        'VD-04 đang mặc': cuaHang({ ...d, mon: doiMon(d.mon, 'VD-04', { daCo: true, dangMac: true }) }),
      }
      for (const [ten, p] of Object.entries(bien)) {
        const r = await so2(w, h, goc, trang(<CuaHang {...p} />), VUNG_CUA_HANG)
        expect(r.khac.join('\n'), ten).toBe('')
      }
      // ví lớn: khối ví + mọi thứ phía dưới không đổi
      const lon = await duLieu({ vang: 64210 }) // trọn bộ 40 món = 64.210 vàng: số lớn nhất có nghĩa
      const r = await so2(w, h, goc, trang(<CuaHang {...cuaHang(lon)} />), ['.ps-vi', '.ps-doi', '.ps-loc button', '.ps-luoi'])
      expect(r.giong).toBe(true)
    }, 120000)

    it('Cửa hàng ĐANG TẢI: ví, khối đổi, thanh lọc đúng kích thước như khi có dữ liệu; thẻ xám đúng cỡ thẻ tối thiểu', async () => {
      if (!browser) return
      const d = await duLieu()
      const co = trang(<CuaHang {...cuaHang(d)} />)
      const xam = trang(<CuaHang {...cuaHang(d, { dangTai: true })} />)
      const vung = ['.ps-vi', '.ps-doi', '.ps-loc', '.ps-chu-giai']
      const r = await so2(w, h, co, xam, vung)
      expect(r.khac.join('\n')).toBe('')
      const ctx = await browser.newContext({ viewport: { width: w, height: h } })
      const page = await ctx.newPage()
      await page.setContent(xam)
      const cao = await page.evaluate(() => [...document.querySelectorAll('.ps-the')].map((e) => Math.round(e.getBoundingClientRect().height * 10) / 10))
      await page.setContent(co)
      const thuc = await page.evaluate(() => [...document.querySelectorAll('.ps-the')].map((e) => Math.round(e.getBoundingClientRect().height * 10) / 10))
      await ctx.close()
      expect(cao).toHaveLength(6)
      expect(new Set(cao).size).toBe(1) // 6 thẻ xám cùng cỡ
      expect(cao[0]).toBe(Math.min(...thuc)) // = cỡ thẻ nhỏ nhất (món không khoá, không giới hạn): bố cục thật không nhảy quá 1 thẻ khi tải xong
    }, 60000)

    it('Thử đồ: CÙNG một món ở sáu trạng thái (khoá · thiếu vàng · đủ vàng · đã có · đang mặc · hết) ⇒ sân khấu, danh sách đang thử, khung chi tiết, nút chính + nút phụ đứng NGUYÊN', async () => {
      if (!browser) return
      const d = await duLieu({ chuoiNgay: 3 })
      const cua = (sua: Partial<MonShop>, vang = d.vang) => trang(<ThuDo {...thuDo({ ...d, vang, mon: doiMon(d.mon, 'HQ-07', sua) }, { tieuDiem: 'HQ-07', dangThu: { 'hao-quang': 'HQ-07', vet: 'VD-04', khung: 'KT-03' } })} />)
      const vung = ['.ps-san', '.ps-ban-be', '.ps-thu-ds', '.ps-thu-hang', '.ps-chi-tiet', '.ps-chi-tiet .ps-ct-dong', '.ps-chi-duong', '.ps-hanh-dong', '[data-viec="bo-thu"]']
      const goc = cua({ moKhoa: false, thieu: 'Cần chuỗi 7 ngày' }) // đang khoá (em chuỗi 3 ngày)
      const bien = [cua({ moKhoa: true, thieu: null }), cua({ moKhoa: true, thieu: null }, 5000), cua({ moKhoa: true, daCo: true }), cua({ moKhoa: true, daCo: true, dangMac: true }), cua({ moKhoa: true, suatTong: 9, suatCon: 0 })]
      for (const [i, b] of bien.entries()) {
        const r = await so2(w, h, goc, b, vung)
        expect(r.khac.join('\n'), `trạng thái ${i}`).toBe('')
      }
    }, 120000)

    it('Thử đồ: đổi món đang xem / lời báo dưới sân khấu / lỗi ⇒ sân khấu, danh sách đang thử và nút KHÔNG dịch (nút cách đáy khung chi tiết đúng như nhau)', async () => {
      if (!browser) return
      const d = await duLieu()
      const goc = trang(<ThuDo {...thuDo(d)} />)
      const vung = ['.ps-san', '.ps-ban-be', '.ps-thu-ds', '.ps-thu-hang']
      for (const sua of [{ bao: 'Hợp quá! Đuôi Lửa Tím đã là của em. Em còn 220 vàng. Em vẫn đủ vàng cho Thảm Tinh Thể Xanh, giá 220 vàng.' }, { tieuDiem: 'VD-04' }, { tieuDiem: 'KT-08' }, { dangGuiMac: true }] as Partial<TD>[]) {
        const r = await so2(w, h, goc, trang(<ThuDo {...thuDo(d, sua)} />), vung)
        expect(r.khac.join('\n'), JSON.stringify(sua)).toBe('')
      }
      // hai nút của khung chi tiết luôn nằm cách đáy khung như nhau, bất kể món (Bật mí dài ngắn khác nhau)
      const ctx = await browser.newContext({ viewport: { width: w, height: h } })
      const page = await ctx.newPage()
      const cach: string[] = []
      for (const ma of ['HQ-05', 'VD-04', 'KT-08']) {
        await page.setContent(trang(<ThuDo {...thuDo(d, { tieuDiem: ma })} />))
        cach.push(await page.evaluate(() => { const c = document.querySelector('.ps-chi-tiet')!.getBoundingClientRect(); return [...document.querySelectorAll('.ps-chi-tiet button')].map((b) => Math.round((c.bottom - b.getBoundingClientRect().bottom) * 10) / 10).join(',') }))
      }
      await ctx.close()
      expect(new Set(cach).size, cach.join(' | ')).toBe(1)
    }, 120000)

    it('Tủ đồ: Mặc ngay ↔ Cởi ra và lời báo ⇒ mọi hàng, nút đứng NGUYÊN', async () => {
      if (!browser) return
      const d = await duLieu({ soHuu: ['VD-01', 'VD-04', 'KT-03'], dangMac: { vet: 'VD-01', khung: 'KT-03' } })
      const goc = trang(<TuDo {...tuDo(d)} />)
      const vung = ['.ps-tu-o', '.ps-tu-hang', '.ps-tu-hang button']
      for (const sua of [{ mon: doiMon(d.mon, 'VD-04', { dangMac: true }) }, { bao: 'Đã mặc Đuôi Lửa Tím.' }, { dangGui: 'VD-04' }] as Partial<TU>[]) {
        const r = await so2(w, h, goc, trang(<TuDo {...tuDo(d, sua)} />), vung)
        // hàng đầu vùng (lời báo) chiếm chỗ sẵn: vị trí các hàng không đổi
        expect(r.y, JSON.stringify(Object.keys(sua))).toEqual(r.x)
      }
    }, 60000)

    it('Hộp xác nhận: lỗi hiện / không hiện, nhãn nút chính "Mua · N vàng" ↔ "Thử lại", đang gửi ⇒ tấm phủ và HAI nút đứng nguyên', async () => {
      if (!browser) return
      const d = await duLieu()
      const vd04 = d.mon.find((m) => m.ma === 'VD-04')!
      const phu = (loi: string, dangGui = false) => trang(<div />, CSS, <XacNhanMua viec={{ loai: 'mua', mon: vd04, vang: 340 }} dangGui={dangGui} loi={loi} onXacNhan={noop} onDeSau={noop} />)
      const vung = ['.ps-to', '.ps-to button', '.ps-to-chu']
      for (const b of [phu('Chưa đủ vàng — còn thiếu 260 vàng.'), phu('Mất mạng rồi. Có mạng lại mới mua được, em vẫn xem được Tủ đồ.'), phu('', true), phu('Giá vừa thay đổi, em xem lại rồi mua nhé.', true)]) {
        const r = await so2(w, h, phu(''), b, vung)
        expect(r.khac.join('\n')).toBe('')
      }
      // hộp Đổi vàng: cũng vậy
      const doi = (loi: string) => trang(<div />, CSS, <XacNhanMua viec={{ loai: 'doi', soExp: 180, ongNghiem: 620, giuLai: 200 }} dangGui={false} loi={loi} onXacNhan={noop} onDeSau={noop} />)
      const r2 = await so2(w, h, doi(''), doi('Thần thú cần giữ lại 200 EXP để ăn. Em đổi được tối đa 420 EXP.'), vung)
      expect(r2.khac.join('\n')).toBe('')
    }, 60000)
  })

// ───────────────────────── (3) chuyển động ─────────────────────────
describe('chuyển động', () => {
  const chay = () => document.getAnimations().filter((a) => a.playState === 'running' && (a.effect as KeyframeEffect).getComputedTiming().iterations === Infinity).length
  it('tối đa 3 chuyển động lặp cùng lúc ở mỗi màn; giảm chuyển động ⇒ 0; sau tấm phủ mọi chuyển động phía sau tạm dừng', async () => {
    if (!browser) return
    const d = await duLieu()
    const cuaHangCoNutVang = trang(<CuaHang {...cuaHang(d, { soExp: 180 })} />)
    const thuDoDuVang = trang(<ThuDo {...thuDo(d, { tieuDiem: 'VD-04' })} />) // nút vàng + bệ thở + thú nổi
    const vd04 = d.mon.find((m) => m.ma === 'VD-04')!
    const sauPhu = trang(<ThuDo {...thuDo(d, { tieuDiem: 'VD-04' })} />, CSS, <XacNhanMua viec={{ loai: 'mua', mon: vd04, vang: 340 }} dangGui={false} loi="" onXacNhan={noop} onDeSau={noop} />)
    const dem = async (html: string, giam = false) => {
      const ctx = await browser!.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: giam ? 'reduce' : 'no-preference' })
      const page = await ctx.newPage()
      await page.setContent(html)
      await page.waitForTimeout(150)
      const n = await page.evaluate(chay)
      await ctx.close()
      return n
    }
    expect(await dem(cuaHangCoNutVang)).toBeLessThanOrEqual(3)
    expect(await dem(cuaHangCoNutVang)).toBeGreaterThanOrEqual(1) // bộ đếm có thấy chuyển động (nút vàng), không thì phép thử vô nghĩa
    const n = await dem(thuDoDuVang)
    expect(n).toBeLessThanOrEqual(3)
    expect(n).toBe(3)
    expect(await dem(cuaHangCoNutVang, true)).toBe(0)
    expect(await dem(thuDoDuVang, true)).toBe(0)
    // sau tấm phủ: chuyển động của màn phía sau dừng; còn lại chỉ nút vàng của tấm phủ (≤ 1)
    expect(await dem(sauPhu)).toBeLessThanOrEqual(1)
  }, 60000)
})

// ───────────────────────── (4) cách ly khỏi game.css ─────────────────────────
describe('cách ly khỏi `.spirit-game button` (game.css): nút, thẻ, chip giữ nguyên kiểu; hover không đổi kiểu', () => {
  for (const mau of ['light', 'dark'] as const)
    it(`${mau}: mọi nút trong .ps có cùng nền / bóng / bo góc / cỡ như khi đứng ngoài .spirit-game; rê chuột lên thẻ không đổi kiểu`, async () => {
      if (!browser) return
      const d = await duLieu()
      const noiDung = <CuaHang {...cuaHang(d, { soExp: 180, dangThu: { vet: 'VD-04' } })} />
      const rieng = trang(noiDung)
      const trongGame = `<!doctype html><html lang="vi"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0}${CSS}\n${GAME_CSS}</style></head><body><section class="spirit-game" style="padding:0;border-radius:0">${renderToStaticMarkup(
        <div className="ps">
          <div className="ps-man">{noiDung}</div>
        </div>,
      )}</section></body></html>`
      const kieu = () =>
        [...document.querySelectorAll('.ps button')].map((b) => {
          const s = getComputedStyle(b)
          const r = b.getBoundingClientRect()
          return [s.backgroundImage.slice(0, 80), s.backgroundColor, s.boxShadow.slice(0, 60), s.borderRadius, s.transform, s.color, Math.round(r.width), Math.round(r.height)].join('|')
        })
      const { page: p1, dong: d1 } = await mo(390, 844, rieng, mau)
      const a = await p1.evaluate(kieu)
      await d1()
      const { page: p2, dong: d2 } = await mo(390, 844, trongGame, mau)
      const b = await p2.evaluate(kieu)
      const truoc = await p2.evaluate(() => { const t = document.querySelector('.ps-the[data-ma="HQ-05"]')!; const s = getComputedStyle(t); return `${s.backgroundImage.slice(0, 60)}|${s.boxShadow}|${s.transform}` })
      await p2.hover('.ps-the[data-ma="HQ-05"]')
      const sau = await p2.evaluate(() => { const t = document.querySelector('.ps-the[data-ma="HQ-05"]')!; const s = getComputedStyle(t); return `${s.backgroundImage.slice(0, 60)}|${s.boxShadow}|${s.transform}` })
      await d2()
      expect(a.length).toBeGreaterThan(20)
      expect(b).toEqual(a)
      expect(sau).toBe(truoc)
    }, 60000)
})

// ───────────────────────── ĐỐI CHỨNG: bản CỐ Ý làm hỏng phải bị bắt ─────────────────────────
describe('ĐỐI CHỨNG: năm bản CSS cố ý làm hỏng đều bị bộ thử bắt (không thì bộ thử vô nghĩa)', () => {
  const sua = (tim: string | RegExp, thay: string) => {
    const moi = CSS.replace(tim, thay)
    expect(moi, `CSS không còn chứa ${String(tim)} — cập nhật đối chứng`).not.toBe(CSS)
    return moi
  }
  it('1. chọn thẻ mà dịch chuyển (kiểu mẫu phác cũ: translateY) ⇒ thẻ đã chọn NHẢY', async () => {
    if (!browser) return
    const d = await duLieu()
    const hong = CSS + "\n.ps .ps-the[aria-pressed='true']{transform:translateY(-2px)}"
    const html = (p: CH) => trang(<CuaHang {...p} />, hong)
    const r = await so2(360, 740, html(cuaHang(d)), html(cuaHang(d, { dangThu: { vet: 'VD-04' } })), VUNG_CUA_HANG)
    expect(r.giong).toBe(false)
  }, 60000)
  it('2. bỏ chỗ chừa cho lời báo sau khi đổi ⇒ lưới thẻ bị ĐẨY XUỐNG khi lời báo hiện', async () => {
    if (!browser) return
    const d = await duLieu()
    const hong = sua(/\.ps \.ps-cho-2 \{\s*min-height: [\d.]+em;/, '.ps .ps-cho-2 {\n  min-height: 0;')
    const html = (p: CH) => trang(<CuaHang {...p} />, hong)
    const r = await so2(360, 740, html(cuaHang(d)), html(cuaHang(d, { baoDoi: 'Đã đổi xong. Em có 520 vàng, thần thú vẫn đủ 2 ngày ăn.' })), VUNG_CUA_HANG)
    expect(r.giong).toBe(false)
  }, 60000)
  it('3. bỏ overflow-wrap ⇒ tên món liền không dấu cách TRÀN khỏi thẻ ở 320 px', async () => {
    if (!browser) return
    const d = await duLieu({}, danhMucDai())
    const hong = sua(/overflow-wrap: anywhere;/g, '')
    const o = await do1(320, 640, trang(<CuaHang {...cuaHang(d)} />, hong))
    expect(o.ra.length + o.tranRoot.length + o.cat.length + (o.tranNgang ? 1 : 0)).toBeGreaterThan(0)
  }, 60000)
  it('4. bỏ chỗ chừa lời chỉ đường ⇒ nút chính DỊCH khi món đổi từ "khoá" sang "đủ vàng"', async () => {
    if (!browser) return
    const d = await duLieu({ chuoiNgay: 3 })
    const hong = sua(/min-height: calc\(4 \* 1\.4em \+ 24px\);/, 'min-height: 0;')
    const cua = (s: Partial<MonShop>) => trang(<ThuDo {...thuDo({ ...d, mon: doiMon(d.mon, 'HQ-07', s) }, { tieuDiem: 'HQ-07', dangThu: { 'hao-quang': 'HQ-07' } })} />, hong)
    const r = await so2(360, 740, cua({ moKhoa: false, thieu: 'Cần chuỗi 7 ngày' }), cua({ moKhoa: true, thieu: null, daCo: true }), ['.ps-hanh-dong', '[data-viec="bo-thu"]'])
    expect(r.giong).toBe(false)
  }, 60000)
  it('5. bỏ chỗ chừa lỗi trong hộp xác nhận ⇒ hai nút DỊCH khi lỗi hiện', async () => {
    if (!browser) return
    const d = await duLieu()
    const vd04 = d.mon.find((m) => m.ma === 'VD-04')!
    const hong = sua(/\.ps \.ps-to-loi \{\s*min-height: [\d.]+em;/, '.ps .ps-to-loi {\n  min-height: 0;')
    const phu = (loi: string) => trang(<div />, hong, <XacNhanMua viec={{ loai: 'mua', mon: vd04, vang: 340 }} dangGui={false} loi={loi} onXacNhan={noop} onDeSau={noop} />)
    const r = await so2(360, 740, phu(''), phu('Thần thú cần giữ lại 200 EXP để ăn. Em đổi được tối đa 420 EXP.'), ['.ps-to', '.ps-to-chu', '.ps-to button'])
    expect(r.giong).toBe(false)
  }, 60000)
})
