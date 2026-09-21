// @vitest-environment node
// HOTFIX P0 21/09 (ảnh của thầy trên Samsung Internet: bảng "Mọi thứ về con" tràn ngang, đầu trang bị đẩy sang phải, lưới 4 số thành một cột): GỐC là VA CHẠM TÊN LỚP — `.mt` và `.mt-tren` là lớp của MŨI TÊN PHẢN ỨNG
// HOÁ HỌC ở src/index.css (`.mt { display: inline-grid; margin: 0 4px; text-align: center }`, `.mt-tren { white-space: nowrap … }`), trùng tiền tố `mt-` của bản vẽ ⇒ gốc app thành inline-grid co theo nội dung, đầu trang dính nowrap.
// Ảnh tự kiểm cũ chụp trang tạm KHÔNG nạp index.css nên không thấy. Khoá: (1) KHÔNG lớp nào của app PH mới trùng bộ chọn ở CSS khác; (2) Chromium THẬT với ĐÚNG index.css: `scrollWidth <= innerWidth` ở 320/360/390/412 (cỡ chữ 100 % và 115 %),
// cả màn chính lẫn bảng, bộ dữ liệu ĐỦ và bộ THIẾU khối.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser } from 'playwright'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import fs from 'node:fs'
import path from 'node:path'
import ManChinh from '../src/components/ph-moi/ManChinh'
import BangMoiThu from '../src/components/ph-moi/BangMoiThu'
import { docTatCaVeCon } from '../src/lib/ph-moi/du-lieu'
import { H, PH_OK } from './_ph-moi/du-lieu-mau'
import { PH_APPLE, PH_APPLE_CHUA_HOC, PH_APPLE_NO, PH_APPLE_THUA } from './_ph-moi/du-lieu-mau-apple'

const goc = process.cwd()
const doc = (p: string) => fs.readFileSync(path.join(goc, p), 'utf8')
function duyetCss(dir: string, ra: string[] = []): string[] {
  for (const e of fs.readdirSync(path.join(goc, dir), { withFileTypes: true })) {
    const p = `${dir}/${e.name}`
    if (e.isDirectory()) {
      if (e.name !== 'node_modules' && e.name !== 'graphify-out') duyetCss(p, ra)
    } else if (e.name.endsWith('.css')) ra.push(p)
  }
  return ra
}
const CSS_KHAC = duyetCss('src').filter((p) => !p.startsWith('src/components/ph-moi/'))
const CSS_PH_MOI = duyetCss('src/components/ph-moi')
const tsxPhMoi = (d = 'src/components/ph-moi'): string[] => fs.readdirSync(path.join(goc, d), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tsxPhMoi(`${d}/${e.name}`) : e.name.endsWith('.tsx') ? [`${d}/${e.name}`] : []))
const lopTrongTsx = (src: string): string[] => {
  const ra = new Set<string>()
  for (const m of src.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) for (const t of (m[1] ?? m[2] ?? '').replace(/\$\{[^}]*\}/g, ' ').split(/\s+/)) if (t && /^[A-Za-z][\w-]*$/.test(t)) ra.add(t)
  return [...ra]
}

describe('không va chạm tên lớp với CSS khác', () => {
  it('mọi lớp `phm-*` / `phm` của app PH mới CHỈ được định nghĩa trong src/components/ph-moi/; không tệp CSS nào khác có bộ chọn trùng; nguồn không còn tiền tố `mt-` của mũi tên hoá học', () => {
    const tsx = tsxPhMoi().map(doc)
    const lop = [...new Set(tsx.flatMap(lopTrongTsx))].filter((t) => t === 'phm' || t.startsWith('phm-'))
    expect(lop.length).toBeGreaterThan(40)
    for (const p of CSS_KHAC) {
      const css = doc(p).replace(/\/\*[\s\S]*?\*\//g, '')
      for (const t of lop) expect(new RegExp(`\\.${t}(?![\\w-])`).test(css), `${p} có .${t}`).toBe(false)
    }
    for (const p of CSS_PH_MOI) expect(doc(p).replace(/\/\*[\s\S]*?\*\//g, ''), p).not.toMatch(/\.mt(?![\w])|\.mt-/)
    for (const f of tsxPhMoi()) expect(lopTrongTsx(doc(f)).filter((t) => t === 'mt' || t.startsWith('mt-')), f).toEqual([])
  })
  it('chốt phòng thủ: gốc màn chính `.phm-ap` là khối thường không co theo nội dung, có min-width 0 và overflow-x: clip (khi hỗ trợ); vỏ bảng mang CẢ `phm-goc` và `phm-ap` nên hưởng cùng chốt', () => {
    const ap = doc('src/components/ph-moi/ph-apple.css')
    expect(ap).toMatch(/\.phm-ap \{ display: block; min-width: 0; max-width: 100%; \}/)
    expect(ap).toMatch(/@supports \(overflow: clip\) \{ \.phm-ap \{ overflow-x: clip; \} \}/)
    expect(doc('src/components/ph-moi/bang/VoBang.tsx')).toMatch(/className="m3 phm-goc phm-ap"/)
    expect(doc('src/components/ph-moi/ManChinh.tsx')).toMatch(/className="m3 phm-ap"/)
  })
})

// ── Chromium thật với ĐÚNG src/index.css ────────────────────────────────────────────────────────
const THIEU = {
  ok: true,
  serverNow: Date.UTC(2026, 8, 21, 14, 0),
  hoTen: 'Đỗ Đại Học',
  homNay: {
    tongQuan: { soCau: 9, soDung: 5, phutHoc: 14, datNhiemVu: false, chuoiNgayHoc: 1, soVoiHomQua: { soCau: 40, tiLeDung: 0.5 } },
    dongThoiGian: [1, 2, 3, 4, 5, 6].map((i) => ({ batDau: H(8 + i, 5 * i), nguon: 'luyen_dang_vap', soCau: i === 1 ? 4 : 1, soDung: i === 1 ? 3 : 0, phut: 2 })),
  },
  manhYeu: {
    lamTot: [{ tenDang: 'Tính chất hoá học của hợp chất hữu cơ có nhóm chức', dung: 3, tong: 4, bac: 'hieu' }],
    conVap: [{ tenDang: 'Bài toán hỗn hợp ester – phản ứng thuỷ phân trong môi trường kiềm', dung: 1, tong: 5, bac: 'biet' }],
    lenBacHomNay: [],
  },
  giaoThem: { conLaiHomNay: 3 },
}
const VIEC = (() => {
  const o = JSON.parse(JSON.stringify(PH_OK))
  o.homNay.tongQuan.viecXong = 3
  o.homNay.tongQuan.viecTong = 4
  return o
})()
const CHUA_HOC = { ok: true, serverNow: Date.UTC(2026, 8, 21, 14, 0), hoTen: 'Đỗ Đại Học', giaoThem: { conLaiHomNay: 3 } }
// Tên rất dài + số rất lớn + ca chưa công bố: ép mọi ô co giãn tới giới hạn.
const DAI = (() => {
  const o = JSON.parse(JSON.stringify(PH_OK))
  o.hoTen = 'Nguyễn Hoàng Bảo Khánh An Nhiên Thuỵ Vy'
  o.homNay.tongQuan = { soCau: 1234, soDung: 700, phutHoc: 1875, datNhiemVu: true, chuoiNgayHoc: 100, viecXong: 12, viecTong: 12 }
  o.caGanNhat.congBo = { congBo: 'ca_lop_xong', daCongBo: false, soEmDaNop: 27, soEmDaVao: 32 }
  delete o.caGanNhat.ketQua
  return o
})()
const giaoThem = { san: true, dangTai: false, conLai: 3, goiGanNhat: null, the: null, dangGui: false, giao: () => {} }
const html = (raw: unknown, man: 'chinh' | 'bang'): string => {
  const pm = docTatCaVeCon(raw)!
  const cay =
    man === 'chinh'
      ? createElement(ManChinh, { v: { trangThai: 'ok', pm, chuLoi: '', dangLamMoi: false, thuLai: () => {} }, tenCon: pm.hoTen, lop: '12 - Tinh Hoa', sbd: '12121212', now: Date.UTC(2026, 8, 21, 14, 0), canhBao: [], onCanhBaoDaXem: () => {}, giaoThem: giaoThem as never, onMoBang: () => {}, onDoiSbd: () => {} })
      : createElement(BangMoiThu, { pm, sbd: '1', lop: '12 - Tinh Hoa', giaoThem: giaoThem as never, onVe: () => {} })
  return renderToStaticMarkup(cay)
}
// Trình duyệt thật + CSS thật: index.css (mũi tên hoá học `.mt`, Tailwind bỏ @import), tokens, m3-theme, m3, ph-moi. Bỏ dòng @import (Chromium không nạp được trong setContent).
const css = ['src/styles/tokens.css', 'src/components/bang-nhiem-vu/m3-theme.css', 'src/components/m3/m3.css', 'src/index.css', 'src/components/bang-nhiem-vu/bang-nhiem-vu.css', 'src/components/bang-nhiem-vu/canh-bao-thay.css', ...CSS_PH_MOI]
  .filter((p) => fs.existsSync(path.join(goc, p)))
  .map((p) => doc(p).replace(/@import[^;]*;/g, ''))
  .join('\n')
// Máy Android không có phông Apple ⇒ ra Inter: nhúng đúng hai tệp woff2 của app (base64) và đè chồng phông về Inter để đo bề rộng THẬT của phông sẽ chạy trên máy phụ huynh.
const b64 = (f: string) => fs.readFileSync(path.join(goc, 'src/components/ph-moi/phong', f)).toString('base64')
const INTER = `@font-face{font-family:"Inter";font-weight:100 900;src:url(data:font/woff2;base64,${b64('inter-vietnamese-wght-normal.woff2')}) format("woff2");unicode-range:U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB}@font-face{font-family:"Inter";font-weight:100 900;src:url(data:font/woff2;base64,${b64('inter-latin-wght-normal.woff2')}) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}.phm-ap{--phm-ap-phong:"Inter",sans-serif!important}`
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

const BO_CHINH = [['ĐỦ khối', PH_OK], ['ĐỦ khối + vòng N/M việc', VIEC], ['THIẾU khối (tài khoản thử)', THIEU], ['CHƯA HỌC hôm nay', CHUA_HOC], ['TÊN DÀI + số lớn + ca chưa công bố', DAI]] as const
// Tên rất dài + số rất lớn + ca chưa công bố + việc A.I dài: ép mọi khối của bảng co giãn tới giới hạn.
const DAI_B = (() => {
  const o = JSON.parse(JSON.stringify(PH_APPLE))
  o.hoTen = 'Nguyễn Hoàng Bảo Khánh An Nhiên Thuỵ Vy'
  Object.assign(o.homNay.tongQuan, { soCau: 1234, soDung: 700, phutHoc: 1875, chuoiNgayHoc: 100, soLanHoc: 48 })
  o.caGanNhat.congBo = { congBo: 'ca_lop_xong', daCongBo: false, soEmDaNop: 27, soEmDaVao: 32 }
  delete o.caGanNhat.ketQua
  // câu có các ý (a)…(e) dồn trong 200 ký tự (thầy lệnh ngắt dòng 21/09): tách dòng không được làm tràn ngang
  const c0 = o.homNay.cau.find((c: { che?: string }) => !c.che)
  c0.deRutGon = 'Cho các phát biểu sau về triolein: (a) Triolein là chất béo không no. (b) Triolein làm mất màu nước bromine. (c) Thuỷ phân triolein thu được C3H5(OH)3. (d) Triolein không tan trong nước. (e) Xà phòng hoá là phản ứng thuận nghịch. Số phát biểu không đúng là'.slice(0, 200)
  o.baiTapVeNha.dangChay[0].ten = 'Bài tập về nhà cực dài về hợp chất hữu cơ có nhóm chức ester lipid carbohydrate amine amino acid polime'
  return o
})()
const BO_BANG = [['ĐỦ khối (trường mới của Code 4)', PH_APPLE], ['ĐỦ khối, bộ cũ chưa có trường mới', PH_OK], ['CÓ NỢ Dồn về đích', PH_APPLE_NO], ['THIẾU khối (tài khoản thử)', THIEU], ['THƯA (con mới học 4 ngày)', PH_APPLE_THUA], ['CHƯA HỌC hôm nay', PH_APPLE_CHUA_HOC], ['TÊN DÀI + số lớn + ca chưa công bố', DAI_B]] as const
for (const man of ['chinh', 'bang'] as const)
  for (const [ten, raw] of man === 'chinh' ? BO_CHINH : BO_BANG)
    for (const w of [320, 360, 390, 412])
      for (const cs of [100, 115])
        it(`${man === 'chinh' ? 'màn chính (phông Inter)' : 'bảng (phông Inter)'} · ${ten} · ${w}px · chữ ${cs} %: KHÔNG tràn ngang (scrollWidth ≤ innerWidth)`, async () => {
          if (!browser) return // máy không có Chromium: bỏ qua (test khoá tên lớp ở trên vẫn chạy)
          const page = await browser.newPage({ viewport: { width: w, height: 800 } })
          await page.setContent(`<!doctype html><html lang="vi" style="font-size:${cs}%"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><style>${INTER}</style></head><body><div id="root"><div class="m3"><div class="min-h-screen flex flex-col" style="display:flex;flex-direction:column;min-height:100vh">${html(raw, man)}</div></div></div></body></html>`)
          await page.evaluate(() => document.fonts.ready)
          const r = await page.evaluate((g) => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth, deTach: (() => { const e = document.querySelector('.phm-cau__de'); return e ? getComputedStyle(e).whiteSpace : 'pre-line' })(), goc: getComputedStyle(document.querySelector(g)!).display, phong: getComputedStyle(document.querySelector(g)!).fontFamily }), man === 'chinh' ? '.phm-ap' : '.phm-goc')
          await page.close()
          expect(r.goc).not.toBe('inline-grid')
          expect(r.phong).toMatch(/^Inter\b/)
          expect(r.sw).toBeLessThanOrEqual(r.iw)
          expect(r.deTach).toBe('pre-line') // đề hiện từng dòng theo ý (tachDongTheoY) — không dồn cục
        }, 30000)
