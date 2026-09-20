// SỬA LỖI (Code 4, rà cuối M3 ở nền tối): `.btn-google-primary` = nền --gg-xanh + chữ --giay. Nền tối đổi --gg-xanh thành xanh NHẠT (#8ab4f8)
// còn --giay là trắng CỐ ĐỊNH → chữ trắng trên xanh nhạt: 2,11:1 (đo Chromium ở nút "Đăng nhập" của cổng học sinh, nền tối). Tính lại từ
// chính token trong tokens.css để khoá: sáng giữ chữ trắng (đạt), tối dùng --gg-xanh-nen (đạt).
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const TOKENS = doc('src/styles/tokens.css')
const CSS = doc('src/index.css')
const hex = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16))
const lum = ([r, g, b]: number[]) => {
  const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const tuongPhan = (a: string, b: string) => {
  const [x, y] = [lum(hex(a)), lum(hex(b))].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
/** Giá trị token: bản đầu (`:root`, sáng) hoặc bản trong khối `@media (prefers-color-scheme: dark)` đầu tiên. */
const token = (ten: string, toi: boolean) => {
  const vung = toi ? TOKENS.slice(TOKENS.indexOf('@media (prefers-color-scheme: dark)')) : TOKENS
  return new RegExp(`--${ten}:\\s*(#[0-9a-fA-F]{6})`).exec(vung)![1]
}

describe('.btn-google-primary: chữ đạt 4,5:1 ở cả nền sáng lẫn nền tối', () => {
  it('nền sáng: chữ --giay trên --gg-xanh ≥ 4,5:1 (giữ chữ trắng, không đổi)', () => {
    expect(tuongPhan(token('giay', false), token('gg-xanh', false))).toBeGreaterThanOrEqual(4.5)
  })

  it('nền tối: chữ trắng cũ chỉ ~2:1 (đó là lỗi); chữ --gg-xanh-nen mới ≥ 4,5:1', () => {
    expect(tuongPhan(token('giay', false), token('gg-xanh', true))).toBeLessThan(3) // bằng chứng lỗi cũ
    expect(tuongPhan(token('gg-xanh-nen', true), token('gg-xanh', true))).toBeGreaterThanOrEqual(4.5)
  })

  it('index.css có luật nền tối `.btn-google-primary { color: var(--gg-xanh-nen) }`; luật nền sáng vẫn `color: var(--giay)`', () => {
    expect(CSS).toMatch(/@media \(prefers-color-scheme: dark\) \{\s*\.btn-google-primary:not\(\[class\*='!bg-'\]\) \{\s*color: var\(--gg-xanh-nen\);\s*\}\s*\}/)
    expect(CSS).toMatch(/\.btn-google-primary \{[^}]*color: var\(--giay\);/)
  })
})

describe('nút tự đặt nền khác (!bg-*) KHÔNG bị đổi chữ (game, cổng học sinh)', () => {
  it('mọi nơi dùng `btn-google-primary` cùng `!bg-` đều nằm ngoài luật (bộ chọn :not([class*="!bg-"]))', () => {
    const c = (p: string) => doc(p)
    const dong = [...c('src/screens/StudentPortalScreen.tsx').matchAll(/className="[^"]*btn-google-primary[^"]*"/g), ...c('src/components/ThanThuHoaHocGame.tsx').matchAll(/className="[^"]*btn-google-primary[^"]*"/g)].map((m) => m[0])
    const rieng = dong.filter((d) => d.includes('!bg-'))
    expect(rieng.length).toBeGreaterThanOrEqual(6) // rose ×3, purple ×2, amber, emerald… : còn giữ nền riêng
    for (const d of rieng) expect(d.includes("!bg-")).toBe(true)
    expect(CSS).toContain(":not([class*='!bg-'])")
  })
})
