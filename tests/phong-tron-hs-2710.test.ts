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
    const tep = readdirSync(THU_MUC).filter((t) => t.endsWith('.woff2')).sort()
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
