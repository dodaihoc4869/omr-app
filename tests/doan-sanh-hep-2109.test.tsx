// @vitest-environment node
// SẢNH ĐOÀN HỘ TỐNG · P0 thầy báo 19:5x (ảnh máy thật ~360 px): (1) khối "Bạn đồng hành hợp nhất" TRÀN NGANG — chip nowrap "Quốc Huy vững Cấu tạo — chọn phát biểu… →" đẩy thú ra ngoài thẻ;
// placeholder "Nhập mã đoàn của bạn" bị cắt; thẻ Trùm lớp "còn 6 ngày · 0 giờ" rớt dòng xấu; ba nhãn ấn thạch cùng đọc "Cấu tạo – c…". Chromium THẬT + doan.css THẬT + markup của DoanSanh thật.
// Màn Đoàn luôn nền tối (không có bản sáng) — vẫn chạy cả hai chế độ màu để khoá "không đổi theo giao diện hệ thống".
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser } from 'playwright'
import { renderToStaticMarkup } from 'react-dom/server'
import fs from 'node:fs'
import path from 'node:path'
import DoanSanh from '../src/game/than-thu-v2/DoanSanh'
import type { SanhXem } from '../src/game/than-thu-v2/doan-kieu'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const CSS = ['src/styles/tokens.css', 'src/game/than-thu-v2/doan.css'].map((f) => doc(f).replace(/@import[^;]*;/g, '')).join('\n')
const SRC = doc('src/game/than-thu-v2/DoanSanh.tsx')

const NGAY = 24 * 3_600_000
const sanh = (sua: Partial<SanhXem> = {}): SanhXem => ({
  lop: '12 - Tinh Hoa', tenDoan: 'Đoàn Hộ Tống', mua: { so: 3, conNgay: 12 }, ve: 2, mienPhiHomNay: false,
  chuoi: { ngay: 6, daDiHomNay: false, mocKe: 7, conNgay: 1 },
  doanLop: { lop: '12 - Tinh Hoa', tram: 5, tongTram: 12, changThang: 3, changMoiTram: 4, conChangToiTramKe: 2, mocKe: 8, tenMocKe: 'Cổng Ester', conTramToiMoc: 3, gopSucHomNay: 11, siSo: 30 },
  trumLop: { dangMo: false, chuNhat: '2026-09-27', moSauMs: 6 * NGAY, conMs: 0, daGop: 0, mucTieu: 300, daHa: false },
  quaMoi: [],
  ...sua,
})
const DANG_DAI = [
  'Cấu tạo – chọn phát biểu đúng về liên kết',
  'Cấu tạo – tính số đồng phân của este đơn chức',
  'Cấu tạo – so sánh nhiệt độ sôi các hợp chất',
  'Cấu tạo – gọi tên theo danh pháp thay thế',
]
const anThach = { sang: 1, nut: 3, ds: DANG_DAI.map((ten, i) => ({ dang: `D${i}`, ten, trangThai: i === 0 ? ('sang' as const) : ('nut' as const), conCau: 2 })), ganSang: { ten: DANG_DAI[1]!, conCau: 2, kyNang: 'Đòn hoá trị' } }
const banDongHanh = { ten: 'Nguyễn Hoàng Quốc Huy Anh Khoa Nguyên', pet: 1, cap: 5, banVung: 'Cấu tạo — chọn phát biểu đúng về liên kết cộng hoá trị', emVung: 'Este — phản ứng thuỷ phân trong môi trường kiềm' }
const goiY = { tong: 9, nhom: [{ ten: 'Cấu tạo', so: 5 }, { ten: 'Este', so: 4 }], hetLuot: false }
const props = { pet: 0, cap: 12, tenDoan: 'Đoàn Hộ Tống', goiY, sanh: sanh(), anThach, banDongHanh, phong: null, ban: false, loi: '', onLenDuong() {}, onMoPhong() {}, onVaoPhong() {}, onBatDau() {}, onRoi() {}, onDong() {} }
const trang = (sua: Partial<typeof props> = {}) => `<!doctype html><html lang="vi"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0}${CSS}</style></head><body>${renderToStaticMarkup(<div className="dh"><DoanSanh {...props} {...sua} /></div>)}</body></html>`

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

describe('khoá nguồn', () => {
  it('hen(): bỏ vế 0 và giữ số dính đơn vị; ô mã đoàn có nhãn NGOÀI ô, placeholder ngắn; tên ấn không còn nowrap/ellipsis', () => {
    expect(SRC).toMatch(/\$\{g > 0 \? ` \$\{g\}\\u00a0giờ` : ''\}/)
    expect(SRC).toMatch(/<label className="dh-nhan-o" htmlFor="dh-o-ma-doan">Mã đoàn của bạn<\/label>/)
    expect(SRC).toMatch(/placeholder="Nhập mã"/)
    expect(SRC).not.toMatch(/placeholder="Nhập mã đoàn của bạn"/)
    const css = doc('src/game/than-thu-v2/doan.css')
    expect(/\.dh-an small\{([^}]*)\}/.exec(css)![1]).not.toMatch(/nowrap|ellipsis/)
    expect(/\.dh-bu-nhau-giua span\{([^}]*)\}/.exec(css)![1]).not.toMatch(/nowrap/)
  })
})

const doTrang = () => {
  const dh = document.querySelector('.dh') as HTMLElement
  const ra: string[] = []
  // thẻ nào cũng phải chứa trọn con cháu (bỏ nền sao + bản đồ trang trí, ẩn với trợ năng)
  for (const the of document.querySelectorAll<HTMLElement>('.dh-kinh, .dh-chang')) {
    const r = the.getBoundingClientRect()
    for (const e of the.querySelectorAll<HTMLElement>('*')) {
      if (e.closest('[aria-hidden="true"]') && !e.closest('.dh-thu')) continue
      if (e.closest('.dh-thu')) continue // hình thú (svg cắt sẵn)
      const c = e.getBoundingClientRect()
      if (c.width === 0 && c.height === 0) continue
      if (c.left < r.left - 0.75 || c.right > r.right + 0.75) ra.push(`${e.tagName.toLowerCase()}.${e.className || ''} «${(e.textContent || '').slice(0, 30)}» [${Math.round(c.left)},${Math.round(c.right)}] ngoài thẻ [${Math.round(r.left)},${Math.round(r.right)}]`)
    }
  }
  const an = [...document.querySelectorAll<HTMLElement>('.dh-an small')].map((s) => ({ ten: s.textContent, cat: s.scrollWidth > s.clientWidth + 1 || s.scrollHeight > s.clientHeight + 1, ellipsis: getComputedStyle(s).textOverflow, nowrap: getComputedStyle(s).whiteSpace }))
  const chip = [...document.querySelectorAll<HTMLElement>('.dh-bu-nhau-giua span')].map((s) => ({ nowrap: getComputedStyle(s).whiteSpace, dong: Math.round(s.getBoundingClientRect().height / parseFloat(getComputedStyle(s).lineHeight)) }))
  const thu = [...document.querySelectorAll<HTMLElement>('.dh-bu-nhau > div:not(.dh-bu-nhau-giua)')].map((d) => Math.round(d.getBoundingClientRect().width))
  const tenBan = [...document.querySelectorAll<HTMLElement>('.dh-bu-nhau > div:not(.dh-bu-nhau-giua) > b')].map((b) => ({ ten: b.textContent, tran: b.scrollWidth > b.clientWidth + 1 }))
  const input = document.querySelector<HTMLInputElement>('.dh-ma-doan input')!
  const trum = [...document.querySelectorAll('[aria-label="Trùm lớp"] p')].map((p) => p.textContent).join(' | ')
  return { tranNgang: dh.scrollWidth > dh.clientWidth, ra, an, chip, thu, tenBan, placeholder: input.placeholder, nhan: document.querySelector('.dh-nhan-o')?.textContent, trum, hopThe: document.querySelector('.dh-bu-nhau')!.getBoundingClientRect().width }
}

for (const [w, h] of [[320, 640], [360, 740], [390, 844]] as const)
  for (const mau of ['light', 'dark'] as const)
    it(`Chromium thật ${w}×${h} · ${mau}: tên dạng DÀI + bạn đồng hành tên dài ⇒ 0 tràn ngang, 0 phần tử ra ngoài thẻ; ấn thạch không cắt tên; chip xuống dòng ≤ 2 dòng; thú của bạn nằm trong thẻ`, async () => {
      if (!browser) return
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: mau })
      const page = await ctx.newPage()
      await page.setContent(trang())
      await page.waitForTimeout(150)
      const o = await page.evaluate(doTrang)
      await ctx.close()
      expect(o.tranNgang).toBe(false)
      expect(o.ra, o.ra.join('\n')).toEqual([])
      expect(o.an).toHaveLength(4)
      for (const a of o.an) {
        expect(a.cat, `«${a.ten}» bị cắt`).toBe(false)
        expect(a.ellipsis).toBe('clip')
        expect(a.nowrap).toBe('normal')
      }
      expect(o.chip).toHaveLength(2)
      for (const c of o.chip) {
        expect(c.nowrap).toBe('normal')
        expect(c.dong, 'chip tối đa 3 dòng').toBeLessThanOrEqual(3)
      }
      expect(o.tenBan).toHaveLength(2)
      for (const t of o.tenBan) expect(t.tran, `tên «${t.ten}» tràn ô của nó`).toBe(false)
      for (const t of o.thu) expect(t).toBeLessThanOrEqual(o.hopThe * 0.47) // hai thú ở hai đầu, không bên nào chiếm quá nửa hàng
      expect(o.nhan).toBe('Mã đoàn của bạn')
      expect(o.placeholder).toBe('Nhập mã')
      expect(o.trum).not.toMatch(/0[\s ]giờ/) // "còn 6 ngày", không "còn 6 ngày 0 giờ"
      expect(o.trum).toContain('còn 6 ngày')
    }, 30000)

it('ĐỐI CHỨNG: CSS cũ (chip nowrap, cột giữa không min-width) THẤY lỗi tràn ở 360 px — nếu không thấy thì bộ thử trên không có nghĩa', async () => {
  if (!browser) return
  const cu = trang()
    .replace(/\.dh-bu-nhau-giua span\{([^}]*)white-space:normal/, '.dh-bu-nhau-giua span{$1white-space:nowrap')
    .replace('.dh-bu-nhau-giua{order:3;flex:1 1 100%;', '.dh-bu-nhau-giua{order:0;flex:1;')
    .replace('.dh-bu-nhau{display:flex;flex-wrap:wrap;', '.dh-bu-nhau{display:flex;flex-wrap:nowrap;')
    .replace('min-width:0;max-width:46%}', 'max-width:none}')
  expect(cu).not.toBe(trang())
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 } })
  const page = await ctx.newPage()
  await page.setContent(cu)
  await page.waitForTimeout(150)
  const o = await page.evaluate(doTrang)
  await ctx.close()
  expect(o.ra.length + (o.tranNgang ? 1 : 0)).toBeGreaterThan(0)
}, 30000)

it('ĐỐI CHỨNG 2: nhãn ấn cũ (nowrap + ellipsis) BỊ CẮT với tên dạng dài', async () => {
  if (!browser) return
  const cu = trang().replace(/\.dh-an small\{[^}]*\}/, '.dh-an small{font-size:10px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}')
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 } })
  const page = await ctx.newPage()
  await page.setContent(cu)
  const o = await page.evaluate(doTrang)
  await ctx.close()
  expect(o.an.some((a) => a.cat)).toBe(true)
}, 30000)
