// PHÔNG TRÒN APP HỌC SINH (thầy 27/10: «sửa lại font chữ siêu đẹp siêu hợp», Nunito «chưa chuẩn dolingo») — M PLUS Rounded 1c 700 + 800,
// tự chứa trong src/styles/phong-tron, hai mảnh latin + vietnamese, font-display swap, tổng byte không vượt phông Nunito cũ (52 224 B).
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const GOC = resolve(__dirname, '..')
const doc = (p: string) => readFileSync(resolve(GOC, p), 'utf8')
const HS = doc('src/styles/trong-hs.css')
const THU_MUC = resolve(GOC, 'src/styles/phong-tron')
const mat = [...HS.matchAll(/@font-face \{([^}]*)\}/g)].map((m) => m[1])

describe('phông tròn app học sinh 27/10', () => {
  it('bốn mặt M PLUS Rounded 1c: 700/800 × latin/vietnamese, swap, có unicode-range', () => {
    expect(mat).toHaveLength(4)
    for (const m of mat) {
      expect(m).toContain("font-family: 'M PLUS Rounded 1c'")
      expect(m).toContain('font-display: swap')
      expect(m).toMatch(/unicode-range: U\+/)
      expect(m).toMatch(/url\('\.\/phong-tron\/m-plus-rounded-1c-(latin|vietnamese)-(700|800)-normal\.woff2'\)/)
    }
    expect(mat.filter((m) => m.includes('font-weight: 700'))).toHaveLength(2)
    expect(mat.filter((m) => m.includes('font-weight: 800'))).toHaveLength(2)
    // mảnh vietnamese phủ dấu chồng (ặ U+1EB7, ổ U+1ED5, ữ U+1EEF, Ở U+1EDE nằm trong U+1EA0-1EF9)
    expect(mat.filter((m) => m.includes('U+1EA0-1EF9'))).toHaveLength(2)
  })

  it('tệp phông tự host, tổng byte ≤ Nunito cũ, không còn Nunito', () => {
    const moi = readdirSync(THU_MUC).filter((t) => t.endsWith('.woff2')).sort()
    // #439 (27/10, «l» như «I»): thêm phông con MỘT chữ «l» (chu-l-duoi-700/800, U+006C) — chỉ tờ nạp lười trong-lam-bai.css dùng, Vite nhúng thẳng
    // (< 1 KB mỗi tệp) ⇒ không thuộc bộ phông nạp trước; bộ M PLUS vẫn đúng 4 tệp và vẫn ≤ byte Nunito cũ.
    const tep = moi.filter((t) => t.startsWith('m-plus-rounded-1c-'))
    expect(moi.filter((t) => !tep.includes(t))).toEqual(['chu-l-duoi-700.woff2', 'chu-l-duoi-800.woff2'])
    for (const t of ['chu-l-duoi-700.woff2', 'chu-l-duoi-800.woff2']) expect(statSync(resolve(THU_MUC, t)).size).toBeLessThanOrEqual(1024)
    expect(HS).not.toContain('chu-l-duoi')
    expect(tep).toEqual(['latin-700', 'latin-800', 'vietnamese-700', 'vietnamese-800'].map((x) => `m-plus-rounded-1c-${x}-normal.woff2`))
    const tong = tep.reduce((s, t) => s + statSync(resolve(THU_MUC, t)).size, 0)
    expect(tong).toBeLessThanOrEqual(52224)
    expect(HS).not.toMatch(/Nunito'/)
    expect(HS).not.toContain('phong-nunito')
  })

  it('chỉ app học sinh dùng; --sans/--serif/--tp-f trỏ M PLUS Rounded 1c; thân 700, tiêu đề 800', () => {
    expect(HS).toMatch(/:root\[data-trong='hs'\]:has\(\.ht2\) \{ --sans: 'M PLUS Rounded 1c'[^;]*; --serif: 'M PLUS Rounded 1c'/)
    expect(HS).toContain(":root[data-trong='hs']:has(.ht2) body { font-weight: 700; }")
    expect(HS).toMatch(/:where\(h1, h2, h3, button, b, strong, th, dd\) \{ font-weight: 800; \}/)
    expect(doc('src/styles/trong-thuong-gon.css')).toMatch(/--tp-f: 'M PLUS Rounded 1c'/)
  })

  it('dấu chồng: tiêu đề xuống hàng được giãn dòng ≥ 1,3 (đo mực: 1,25 còn chạm «gậy / Ỗ Ổ»)', () => {
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
    expect(hep).toContain('.da-o .h { width: 48px; height: 48px; }')
  })

  it('vite: nạp trước (phongHs) và bỏ khỏi precache đúng tên tệp mới', () => {
    const vite = doc('vite.config.ts')
    const m = /phongHs = [\s\S]*?\.test\(f\)/.exec(vite)
    expect(m).not.toBeNull()
    const nguon = m![0].slice(m![0].indexOf('/^assets') + 1, m![0].lastIndexOf('$/.test') + 1)
    const re = new RegExp(nguon)
    expect(re.test('assets/m-plus-rounded-1c-latin-800-normal-AbCd1234.woff2')).toBe(true)
    expect(re.test('assets/m-plus-rounded-1c-vietnamese-700-normal-AbCd_234.woff2')).toBe(true)
    expect(vite).toContain("'**/m-plus-rounded-1c-*-normal-*.woff2'")
    expect(vite).not.toContain('nunito-')
  })
})
