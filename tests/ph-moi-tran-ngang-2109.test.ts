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
const lopTrongTsx = (src: string): string[] => {
  const ra = new Set<string>()
  for (const m of src.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) for (const t of (m[1] ?? m[2] ?? '').replace(/\$\{[^}]*\}/g, ' ').split(/\s+/)) if (t && /^[A-Za-z][\w-]*$/.test(t)) ra.add(t)
  return [...ra]
}

describe('không va chạm tên lớp với CSS khác', () => {
  it('mọi lớp `phm-*` / `phm` của app PH mới CHỈ được định nghĩa trong src/components/ph-moi/; không tệp CSS nào khác có bộ chọn trùng; nguồn không còn tiền tố `mt-` của mũi tên hoá học', () => {
    const tsx = ['src/components/ph-moi/ManChinh.tsx', 'src/components/ph-moi/BangMoiThu.tsx', 'src/components/ph-moi/ThanhDay.tsx'].map(doc)
    const lop = [...new Set(tsx.flatMap(lopTrongTsx))].filter((t) => t === 'phm' || t.startsWith('phm-'))
    expect(lop.length).toBeGreaterThan(40)
    for (const p of CSS_KHAC) {
      const css = doc(p).replace(/\/\*[\s\S]*?\*\//g, '')
      for (const t of lop) expect(new RegExp(`\\.${t}(?![\\w-])`).test(css), `${p} có .${t}`).toBe(false)
    }
    for (const p of CSS_PH_MOI) expect(doc(p).replace(/\/\*[\s\S]*?\*\//g, ''), p).not.toMatch(/\.mt(?![\w])|\.mt-/)
    for (const f of ['src/components/ph-moi/ManChinh.tsx', 'src/components/ph-moi/BangMoiThu.tsx', 'src/components/ph-moi/ThanhDay.tsx']) expect(lopTrongTsx(doc(f)).filter((t) => t === 'mt' || t.startsWith('mt-')), f).toEqual([])
  })
  it('chốt phòng thủ: gốc `.phm` là khối thường không co theo nội dung, có min-width 0 và overflow-x: clip (khi hỗ trợ)', () => {
    const css = doc('src/components/ph-moi/ph-moi-them.css')
    expect(css).toMatch(/\.phm \{[^}]*display: block[^}]*min-width: 0/)
    expect(css).toMatch(/@supports \(overflow: clip\) \{ \.phm \{ overflow-x: clip; \} \}/)
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
const giaoThem = { san: true, dangTai: false, conLai: 3, goiGanNhat: null, the: null, dangGui: false, giao: () => {} }
const html = (raw: unknown, man: 'chinh' | 'bang'): string => {
  const pm = docTatCaVeCon(raw)!
  const cay =
    man === 'chinh'
      ? createElement(ManChinh, { v: { trangThai: 'ok', pm, chuLoi: '', dangLamMoi: false, thuLai: () => {} }, tenCon: pm.hoTen, lop: '12 - Tinh Hoa', now: Date.UTC(2026, 8, 21, 14, 0), canhBao: [], onCanhBaoDaXem: () => {}, giaoThem: giaoThem as never, onMoBang: () => {}, onDoiSbd: () => {} })
      : createElement(BangMoiThu, { pm, sbd: '1', lop: '12 - Tinh Hoa', giaoThem: giaoThem as never, onVe: () => {} })
  return renderToStaticMarkup(cay)
}
// Trình duyệt thật + CSS thật: index.css (mũi tên hoá học `.mt`, Tailwind bỏ @import), tokens, m3-theme, m3, ph-moi. Bỏ dòng @import (Chromium không nạp được trong setContent).
const css = ['src/styles/tokens.css', 'src/components/bang-nhiem-vu/m3-theme.css', 'src/components/m3/m3.css', 'src/index.css', 'src/components/bang-nhiem-vu/bang-nhiem-vu.css', 'src/components/bang-nhiem-vu/canh-bao-thay.css', ...CSS_PH_MOI]
  .filter((p) => fs.existsSync(path.join(goc, p)))
  .map((p) => doc(p).replace(/@import[^;]*;/g, ''))
  .join('\n')
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

for (const [ten, raw] of [['ĐỦ khối', PH_OK], ['THIẾU khối (tài khoản thử)', THIEU]] as const)
  for (const man of ['chinh', 'bang'] as const)
    for (const w of [320, 360, 390, 412])
      for (const cs of [100, 115])
        it(`${man === 'chinh' ? 'màn chính' : 'bảng'} · ${ten} · ${w}px · chữ ${cs} %: KHÔNG tràn ngang (scrollWidth ≤ innerWidth)`, async () => {
          if (!browser) return // máy không có Chromium: bỏ qua (test khoá tên lớp ở trên vẫn chạy)
          const page = await browser.newPage({ viewport: { width: w, height: 800 } })
          await page.setContent(`<!doctype html><html lang="vi" style="font-size:${cs}%"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"><div class="m3"><div class="min-h-screen flex flex-col" style="display:flex;flex-direction:column;min-height:100vh">${html(raw, man)}</div></div></div></body></html>`)
          const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth, goc: getComputedStyle(document.querySelector('.phm')!).display }))
          await page.close()
          expect(r.goc).not.toBe('inline-grid')
          expect(r.sw).toBeLessThanOrEqual(r.iw)
        }, 30000)
