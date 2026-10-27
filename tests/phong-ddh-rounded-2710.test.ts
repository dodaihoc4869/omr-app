// PHÔNG RIÊNG APP HỌC SINH «ĐĐH Rounded» (thầy 27/10: «tự tạo font riêng», đẹp như chữ Duolingo) — dẫn xuất OFL từ M PLUS Rounded 1c
// (scripts/tao-phong-ddh-rounded.py): Đề (chữ đề / thân, gốc 500 — «Đề cho nét thanh hơn», 100–599) + Nhấn (chữ chạm được, 600–749) + Đậm
// (tiêu đề / nút / số, 750–1000), tự chứa trong src/styles/phong-ddh,
// hai mảnh latin + vietnamese, font-display swap, tổng byte không vượt bộ M PLUS cũ (52 080 B) + phông con «l» (872 B) đã gộp vào.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const GOC = resolve(__dirname, '..')
const doc = (p: string) => readFileSync(resolve(GOC, p), 'utf8')
const HS = doc('src/styles/trong-hs.css')
const THU_MUC = resolve(GOC, 'src/styles/phong-ddh')
const mat = [...HS.matchAll(/@font-face \{([^}]*)\}/g)].map((m) => m[1])

describe('phông riêng ĐĐH Rounded app học sinh 27/10', () => {
  it('sáu mặt DDH Rounded: Đề 100–599 / Nhấn 600–749 / Đậm 750–1000 × latin/vietnamese, swap, có unicode-range', () => {
    expect(mat).toHaveLength(6)
    for (const m of mat) {
      expect(m).toContain("font-family: 'DDH Rounded'")
      expect(m).toContain('font-display: swap')
      expect(m).toMatch(/unicode-range: U\+/)
      expect(m).toMatch(/url\('\.\/phong-ddh\/ddh-rounded-(de|nhan|dam)-(latin|vietnamese)\.woff2'\)/)
    }
    expect(mat.filter((m) => m.includes('font-weight: 100 599') && m.includes('ddh-rounded-de-'))).toHaveLength(2)
    expect(mat.filter((m) => m.includes('font-weight: 600 749') && m.includes('ddh-rounded-nhan-'))).toHaveLength(2)
    expect(mat.filter((m) => m.includes('font-weight: 750 1000') && m.includes('ddh-rounded-dam-'))).toHaveLength(2)
    // mảnh vietnamese phủ dấu chồng (ặ U+1EB7, ổ U+1ED5, ữ U+1EEF, Ở U+1EDE nằm trong U+1EA0-1EF9)
    expect(mat.filter((m) => m.includes('U+1EA0-1EF9') && m.includes('-vietnamese.woff2'))).toHaveLength(3)
    // mảnh latin phủ kí hiệu Hoá: chỉ số trên / dưới, → ← ↑ ↓, ⇄ ⇌, °C (Latin-1), −
    for (const m of mat.filter((x) => x.includes('-latin.woff2'))) {
      for (const r of ['U+0000-00FF', 'U+2070-208F', 'U+2190-2193', 'U+21C4', 'U+21CC', 'U+2212']) expect(m).toContain(r)
    }
  })

  it('tệp phông tự host, tổng byte ≤ bộ cũ, không còn M PLUS / phông con «l», có giấy phép OFL + ghi công', () => {
    const tep = readdirSync(THU_MUC).filter((t) => t.endsWith('.woff2')).sort()
    expect(tep).toEqual(['dam-latin', 'dam-vietnamese', 'de-latin', 'de-vietnamese', 'nhan-latin', 'nhan-vietnamese'].map((x) => `ddh-rounded-${x}.woff2`))
    const tong = tep.reduce((s, t) => s + statSync(resolve(THU_MUC, t)).size, 0)
    expect(tong).toBeLessThanOrEqual(52080 + 872)
    expect(HS).not.toContain("'M PLUS Rounded 1c'")
    expect(HS).not.toContain('phong-tron')
    const lam = doc('src/styles/trong-lam-bai.css')
    expect(lam).not.toContain('chu-l-duoi')
    expect(lam).toContain("[data-trong='hs'] .ct-l { font-feature-settings: 'ss01'; }")
    const ofl = doc('src/styles/phong-ddh/OFL.txt')
    expect(ofl).toContain('Copyright 2016 The Rounded M+ Project Authors')
    expect(ofl).toContain('SIL OPEN FONT LICENSE Version 1.1')
    expect(doc('src/styles/phong-ddh/README.md')).toContain('ĐĐH Rounded dẫn xuất từ M PLUS Rounded 1c (SIL Open Font License 1.1), © 2016 The Rounded M+ Project Authors')
  })

  it('chỉ app học sinh dùng; --sans/--serif/--tp-f trỏ DDH Rounded; thân 500 (Đề), chữ chạm 700 (Nhấn), tiêu đề 800 (Đậm)', () => {
    expect(HS).toMatch(/:root\[data-trong='hs'\]:has\(\.ht2\) \{ --sans: 'DDH Rounded'[^;]*; --serif: 'DDH Rounded'/)
    expect(HS).toContain(":root[data-trong='hs']:has(.ht2) body { font-weight: 500; }")
    expect(HS).toContain(":root[data-trong='hs']:has(.ht2) .duo :is(.ht2-lam-de-chu, .ht2-lam-pa) { font-weight: 500; }")
    expect(HS).toContain(":root[data-trong='hs']:has(.ht2) .duo .ht2-lam-de-chu { color: var(--tr-chu); }")
    expect(HS).toContain(":root[data-trong='hs']:has(.ht2) .gyc-v.gyc-cham { font-weight: 700; }")
    expect(HS).toContain(":root[data-trong='hs']:has(.ht2) .duo .duo-tra[data-so] .ht2-lam-pa { font-weight: 800; }")
    expect(HS).toMatch(/:where\(h1, h2, h3, button, b, strong, th, dd\) \{ font-weight: 800; \}/)
    expect(doc('src/styles/trong-thuong-gon.css')).toMatch(/--tp-f: 'DDH Rounded'/)
  })

  it('dấu chồng: tiêu đề xuống hàng được giãn dòng ≥ 1,3', () => {
    const m = /:root\[data-trong='hs'\]:has\(\.ht2\) :is\(([^)]*)\) \{ line-height: ([\d.]+); \}/.exec(HS)
    expect(m).not.toBeNull()
    expect(Number(m![2])).toBeGreaterThanOrEqual(1.3)
    for (const chon of ['.duo-xong h1', '.tp-man h1', '.tp-tieu', '.da-bai b', '.ht2-mo-dau h1', '.tp-combo']) expect(m![1]).toContain(chon)
  })

  it('360 px: nhãn ngắn không bẻ dòng xấu — cân dòng + bớt khoảng ở điện thoại hẹp', () => {
    expect(HS).toMatch(/:is\(\.tp-nv \.giua > b, \.da-o b, \.da-o \.mo, \.ktcn-dong-so li > span, \.tp-lua-lon \.giua p, \.tp-nut, \.tp-nut-lon\) \{ text-wrap: balance; \}/)
    const hep = HS.slice(HS.indexOf('@media (max-width: 380px) {\n  :root[data-trong=\'hs\']:has(.ht2) .ktcn-dong-so li'))
    expect(hep).toContain('.ktcn-dong-so li { gap: 6px; font-size: 14px; }')
    expect(hep).toContain('.tp-nv { gap: 10px; padding: 12px; }')
  })

  it('vite: nạp trước (phongHs) và bỏ khỏi precache đúng tên tệp mới', () => {
    const vite = doc('vite.config.ts')
    const m = /phongHs = [\s\S]*?\.test\(f\)/.exec(vite)
    expect(m).not.toBeNull()
    const nguon = m![0].slice(m![0].indexOf('/^assets') + 1, m![0].lastIndexOf('$/.test') + 1)
    const re = new RegExp(nguon)
    expect(re.test('assets/ddh-rounded-dam-latin-AbCd1234.woff2')).toBe(true)
    expect(re.test('assets/ddh-rounded-nhan-latin-AbCd1234.woff2')).toBe(true)
    expect(re.test('assets/ddh-rounded-de-vietnamese-AbCd_234.woff2')).toBe(true)
    expect(re.test('assets/baloo-2-latin-800-normal-AbCd1234.woff2')).toBe(true)
    expect(re.test('assets/m-plus-rounded-1c-latin-800-normal-AbCd1234.woff2')).toBe(false)
    expect(vite).toContain("'**/ddh-rounded-*.woff2'")
    expect(vite).not.toContain('m-plus-rounded-1c')
  })
})
