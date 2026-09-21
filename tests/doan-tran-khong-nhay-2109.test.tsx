// @vitest-environment node
// ĐOÀN HỘ TỐNG · P0 "đáp án bị nhảy" (thầy 19:24) — PHẦN BỐ CỤC: bấm chọn đáp án KHÔNG được làm phần tử nào của vùng đáp án đổi vị trí / kích thước (ngón tay đang trên nút khác thì bấm trúng hàng khác);
// đội / tín hiệu / thẻ tiếp sức / lỗi đổi trạng thái giữa lúc em đọc đề cũng KHÔNG đẩy vùng đáp án. Chromium THẬT + doan.css THẬT + markup của DoanTran thật, ở 320/360/390.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser, type Page } from 'playwright'
import { renderToStaticMarkup } from 'react-dom/server'
import fs from 'node:fs'
import path from 'node:path'
import DoanTran from '../src/game/than-thu-v2/DoanTran'
import type { DoanXem } from '../src/game/than-thu-v2/doan-kieu'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const CSS = ['src/styles/tokens.css', 'src/game/than-thu-v2/doan.css'].map((f) => doc(f).replace(/@import[^;]*;/g, '')).join('\n')
const TRAN_SRC = doc('src/game/than-thu-v2/DoanTran.tsx')

const ghe = (tt: string[] = ['dang_lam', 'dang_lam', 'dang_lam', 'dang_lam'], tin: (string | null)[] = [null, null, null, null]): DoanXem['ghe'] => [
  { ghe: 0, ten: 'Nguyễn Minh Khôi', pet: 2, cap: 32, laMay: false, roi: false, laEm: true, trangThai: tt[0] as never, tinHieu: tin[0] as never },
  { ghe: 1, ten: 'Trần Thu Hà An', pet: 1, cap: 30, laMay: false, roi: false, laEm: false, trangThai: tt[1] as never, tinHieu: tin[1] as never },
  { ghe: 2, ten: 'Lê Hoàng Nam', pet: 3, cap: 12, laMay: false, roi: false, laEm: false, trangThai: tt[2] as never, tinHieu: tin[2] as never },
  { ghe: 3, ten: 'Bạn máy', pet: 0, cap: 8, laMay: true, roi: false, laEm: false, trangThai: tt[3] as never, tinHieu: tin[3] as never },
]
const tran = (o: Record<string, unknown> = {}) => ({ tenChang: 'Vượt Đầm Bùn Acid', hiep: 3, soHiep: 8, laTrum: false, ketThuc: false, thang: null, linhTam: { hp: 80, toiDa: 100 }, quai: [{ ma: 5, loai: 'bun_acid', hp: 9 }], trumVoGiap: [],
  nangLuong: 2, daNhanTiepSuc: 0, giay: 40, moSauMs: 0, conMs: 27000, tenQuai: ['Bùn Acid', 'Khói Oxi Hoá'], loaiQuai: ['bun_acid', 'khoi_oxi_hoa'], tenTrum: ['Chúa tể Kết Tủa', 'Bá chủ Ăn Mòn'], loaiTrum: ['chua_te_ket_tua', 'ba_chu_an_mon'], ...o }) as DoanXem['tran']
const cauI = { qid: 'Q1', maDe: 'D', version: 'v', group: 'g', phan: 'I' as const, text: 'Thuỷ phân ethyl acetate trong môi trường axit thu được', choices: ['ancol etylic và axit axetic', 'natri axetat và ancol etylic', 'axit axetic và natri hiđroxit', 'ancol metylic và natri fomat'], ideas: [], hinhAnh: [], dang: 'ES', tenDang: 'Ester', mucDo: 'hieu', sao: 2, kienThuc: [] }
const cauII = { ...cauI, qid: 'Q2', phan: 'II' as const, text: 'Cho ester X có công thức C4H8O2', choices: [], ideas: ['X có hai đồng phân este mạch hở', 'X phản ứng được với dung dịch NaOH đun nóng', 'X làm mất màu nước brom ở điều kiện thường', 'X có nhiệt độ sôi cao hơn axit cùng số C'] }
const cauTrum = { ...cauII, qid: 'T1' }

const xemCau = (de: object, o: Partial<DoanXem> = {}): DoanXem => ({ ma: 'DH1', revision: 5, laChu: true, batDau: true, ghe: ghe(), gioMayChu: 0, tran: tran(), cau: { qid: 'Q1', nhan: 'toi_han_on', de } as never,
  tiepSuc: { conLuotNhan: 2, daXin: false, theNhan: null, banCan: [], daGiup: false, lienKichSanSang: false } as never, ...o })
const xemTrum = (o: Partial<DoanXem> = {}): DoanXem => ({ ma: 'DH1', revision: 5, laChu: true, batDau: true, ghe: ghe(), gioMayChu: 0, tran: tran({ laTrum: true, hiep: 4 }),
  trum: { coCau: true, giaoY: [0, 1, 2, 3], yCuaEm: [0, 1], yDaChot: [false, false, false, false], qid: 'T1', tenDang: 'Ester', de: cauTrum as never }, ...o })

const noop = () => {}
type Props = Parameters<typeof DoanTran>[0]
const goc = (xem: DoanXem, de: object | undefined, sua: Partial<Props> = {}): Props => ({ xem, de: de as never, deTrum: xem.trum ? (cauTrum as never) : undefined, conGiay: 27, moSauGiay: 0, chon: '', onChon: noop, hanhDong: 'danh', onHanhDong: noop, yChon: {}, onYChon: noop, onChot: noop, onChotY: noop,
  onTinHieu: noop, onRoi: noop, onZoom: noop, ban: false, loi: '', onXinTiepSuc: noop, onMoTiepSuc: noop, ...sua })
const trang = (p: Props) => `<!doctype html><html lang="vi"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0}${CSS}</style></head><body>${renderToStaticMarkup(<div className="dh dh-tran"><DoanTran {...p} /></div>)}</body></html>`

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

/** Toạ độ + kích thước của mọi nút trong vùng đáp án (lưới A-D / các hàng Đúng-Sai / hàng ý của trùm) và của thẻ câu. */
const chup = (page: Page) =>
  page.evaluate(() => {
    const r = (e: Element) => { const b = e.getBoundingClientRect(); return [Math.round(b.left * 10) / 10, Math.round(b.top * 10) / 10, Math.round(b.width * 10) / 10, Math.round(b.height * 10) / 10] }
    const the = document.querySelector('.dh-giay')!
    const nut = [...the.querySelectorAll('.dh-pa button, .dh-y > div, .dh-y button, input.dh-so')].map((e) => r(e))
    return { the: r(the), nut, dh: r(document.querySelector('.dh-khung')!), tranNgang: (document.querySelector('.dh') as HTMLElement).scrollWidth > (document.querySelector('.dh') as HTMLElement).clientWidth }
  })

const KICH_THUOC = [[320, 640], [360, 740], [390, 844]] as const
async function soSanh(w: number, h: number, truoc: Props, sau: Props) {
  const ctx = await browser!.newContext({ viewport: { width: w, height: h } })
  const page = await ctx.newPage()
  await page.setContent(trang(truoc))
  await page.waitForTimeout(80)
  const a = await chup(page)
  await page.setContent(trang(sau))
  await page.waitForTimeout(80)
  const b = await chup(page)
  await ctx.close()
  return { a, b }
}

describe('khoá nguồn', () => {
  it('lưới đáp án khoá theo dangChot/daChot (KHÔNG theo ban); trùm: Đúng/Sai không disabled theo ban, "Chốt ý này" luôn dựng', () => {
    expect(TRAN_SRC).toMatch(/khoa=\{!!p\.dangChot \|\| !!cau\?\.daChot\}/)
    expect(TRAN_SRC).not.toMatch(/khoa=\{p\.ban/)
    expect(TRAN_SRC).not.toMatch(/disabled=\{p\.ban\} aria-pressed=\{p\.yChon/)
    expect(TRAN_SRC).toMatch(/className="dh-chot-y" disabled=\{p\.ban \|\| !p\.yChon\[i\]\}/)
    expect(TRAN_SRC).not.toMatch(/\{p\.yChon\[i\] && <button/)
  })
})

for (const [w, h] of KICH_THUOC) {
  describe(`Chromium thật ${w}×${h}`, () => {
    it('Phần I: chọn A / D / đổi đòn (Chắn, Kỹ năng) ⇒ CẢ BỐN nút đáp án + thẻ câu đứng NGUYÊN vị trí và kích thước (CLS vùng đáp án = 0); không tràn ngang', async () => {
      if (!browser) return
      const x = xemCau(cauI)
      for (const sau of [goc(x, cauI, { chon: 'A' }), goc(x, cauI, { chon: 'D' }), goc(x, cauI, { chon: 'B', hanhDong: 'chan' }), goc(x, cauI, { chon: 'C', hanhDong: 'ky_nang' })]) {
        const { a, b } = await soSanh(w, h, goc(x, cauI), sau)
        expect(a.nut).toHaveLength(4)
        expect(b.nut).toEqual(a.nut)
        expect(b.the).toEqual(a.the)
        expect(b.tranNgang).toBe(false)
      }
    }, 60000)
    it('Phần II: chọn từng ý Đúng/Sai ⇒ các hàng ý đứng nguyên', async () => {
      if (!browser) return
      const x = xemCau(cauII, { cau: { qid: 'Q2', nhan: 'toi_han_on', de: cauII } as never })
      for (const chon of ['D---', 'DS--', 'DSDS', '-S-D']) {
        const { a, b } = await soSanh(w, h, goc(x, cauII), goc(x, cauII, { chon }))
        expect(a.nut.length).toBeGreaterThanOrEqual(4)
        expect(b.nut).toEqual(a.nut)
        expect(b.the).toEqual(a.the)
      }
    }, 60000)
    it('TRÙM: chọn Đúng/Sai ở ý của em (nút "Chốt ý này" có sẵn) ⇒ MỌI hàng ý đứng nguyên — trước đây nút chốt xuất hiện sau khi chọn làm hàng nở ra', async () => {
      if (!browser) return
      const x = xemTrum()
      for (const yChon of [{ 0: 'D' }, { 0: 'S', 1: 'D' }, { 1: 'S' }] as const) {
        const { a, b } = await soSanh(w, h, goc(x, undefined), goc(x, undefined, { yChon: yChon as never }))
        expect(a.nut.length).toBe(4 + 2 * 3) // 4 hàng ý + 2 ý của em × (Đúng, Sai, Chốt ý này)
        expect(b.nut).toEqual(a.nut)
        expect(b.the).toEqual(a.the)
      }
    }, 60000)
    it('đội đổi trạng thái (đang làm → đã chốt → cần tiếp sức) + tín hiệu + tên dài + lỗi hiện ra ⇒ thẻ câu và lưới đáp án KHÔNG dịch', async () => {
      if (!browser) return
      const goc0 = xemCau(cauI)
      const bien: Partial<DoanXem>[] = [
        { ghe: ghe(['dang_lam', 'da_chot', 'dang_lam', 'da_chot']) },
        { ghe: ghe(['dang_lam', 'da_chot', 'da_chot', 'da_chot'], [null, null, 'can_tiep_suc', null]) },
        { ghe: ghe(['dang_lam', 'dang_lam', 'dang_lam', 'dang_lam'], [null, 'chac_y', 'doi_ti', null]) },
      ]
      // Thẻ câu co giãn theo khối dưới nó (cao hơn/thấp hơn) là chủ ý; điều KHÔNG được đổi là VỊ TRÍ thẻ (trái/trên/rộng) và MỌI nút đáp án.
      const viTri = (t: number[]) => t.slice(0, 3)
      const a = await soSanh(w, h, goc(goc0, cauI), goc(goc0, cauI))
      for (const b of bien) {
        const r = await soSanh(w, h, goc(goc0, cauI), goc(xemCau(cauI, b), cauI))
        expect(viTri(r.b.the), JSON.stringify(b)).toEqual(viTri(a.a.the))
        expect(r.b.nut).toEqual(a.a.nut)
      }
      const l = await soSanh(w, h, goc(goc0, cauI), goc(goc0, cauI, { loi: 'Mạng chập chờn, em thử lại nhé.' }))
      expect(viTri(l.b.the)).toEqual(viTri(l.a.the))
      expect(l.b.nut).toEqual(l.a.nut)
    }, 60000)
    it('bạn TIẾP SỨC gửi thẻ giữa lúc em đọc đề ⇒ vùng đáp án KHÔNG bị đẩy xuống (thẻ nằm DƯỚI câu, không phải trên)', async () => {
      if (!browser) return
      const x = xemCau(cauI)
      const co = xemCau(cauI, { tiepSuc: { conLuotNhan: 1, daXin: false, theNhan: { tuTen: 'Trần Thu Hà An', tuLaMay: false, loai: 'nhac_cong_thuc', tieuDe: 'Nhắc công thức', noiDung: 'Este + H2O ⇌ axit + ancol (H+, to). Thuỷ phân trong kiềm là phản ứng một chiều.' }, banCan: [], daGiup: false, lienKichSanSang: true } as never })
      const { a, b } = await soSanh(w, h, goc(x, cauI), goc(co, cauI))
      expect(b.nut).toEqual(a.nut)
      expect(b.the.slice(0, 3)).toEqual(a.the.slice(0, 3))
    }, 60000)
  })
}

it('ĐỐI CHỨNG: bản CŨ (nút "Chốt ý này" chỉ hiện sau khi chọn) làm hàng của ý bị NỞ RA ở 360 px — nếu không thấy thì bộ thử trên không có nghĩa', async () => {
  if (!browser) return
  // dựng lại kiểu cũ: bỏ nút chốt khi chưa chọn (như `{p.yChon[i] && <button …>}`)
  const x = xemTrum()
  const html = (p: Props, cu: boolean) => { const t = trang(p); return cu && !Object.keys(p.yChon).length ? t.replace(/<button type="button" class="dh-chot-y"[^>]*>Chốt ý này<\/button>/g, '') : t }
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 } })
  const page = await ctx.newPage()
  await page.setContent(html(goc(x, undefined), true))
  const a = await chup(page)
  await page.setContent(html(goc(x, undefined, { yChon: { 0: 'D', 1: 'S' } as never }), true))
  const b = await chup(page)
  await ctx.close()
  expect(JSON.stringify(b.nut)).not.toBe(JSON.stringify(a.nut))
}, 30000)
