// @vitest-environment node
// BẢNG TIN SÀN · token màu --bts-* phải ĐÚNG ở cả ba đường vào nền tối (thầy báo 21/09: máy sáng + bấm nút Tối mà vạch lưới nến vẫn SÁNG):
//  1. @media (prefers-color-scheme: dark) khi app "theo máy" (loại trừ ép Sáng) · 2. :root[data-giao-dien='toi'] khi thầy ép Tối bằng nút (không phụ thuộc điều kiện media được viết lại đúng lúc) ·
//  3. :root[data-giao-dien='sang'] giữ bản sáng khi thầy ép Sáng dù máy tối. Khối tối trong @media và khối [data-giao-dien='toi'] PHẢI giống hệt nhau; mọi token có đủ hai bản.
// Đường chạy THẬT (Chromium, máy sáng, đặt thuộc tính KHÔNG qua viết lại media) khoá ở tests/bang-tin-san-chong-chu-trinh-duyet-2109.test.ts.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const css = readFileSync('src/styles/tokens.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const khoi = (re: RegExp): Record<string, string> => {
  const m = re.exec(css)
  expect(m, String(re)).toBeTruthy()
  return Object.fromEntries([...m![1]!.matchAll(/(--bts-[a-z0-9-]+)\s*:\s*([^;]+);/g)].map((x) => [x[1]!, x[2]!.trim()]))
}
const SANG = khoi(/:root,\s*:root\[data-giao-dien='sang'\]\s*\{([^}]*--bts-nen[^}]*)\}/)
const TOI_MEDIA = khoi(/@media \(prefers-color-scheme: dark\)\s*\{\s*:root:not\(\[data-giao-dien='sang'\]\)\s*\{([^}]*--bts-nen[^}]*)\}\s*\}/)
const TOI_NUT = khoi(/:root\[data-giao-dien='toi'\]\s*\{([^}]*--bts-nen[^}]*)\}/)

describe('token --bts-* : ba đường vào sáng / tối', () => {
  it('khối tối trong @media và khối [data-giao-dien="toi"] GIỐNG HỆT nhau (đủ token, đúng giá trị)', () => {
    expect(Object.keys(TOI_NUT).length).toBeGreaterThan(20)
    expect(TOI_NUT).toEqual(TOI_MEDIA)
  })
  it('mọi token sáng đều có bản tối và ngược lại; không định nghĩa trùng ngoài ba khối này', () => {
    // token tối ⊆ token sáng; phần sáng có mà tối không nêu lại = các màu CỐ ĐỊNH của cột A.I (nền tối ở cả hai giao diện) — không token nào khác được thiếu bản tối
    const chiSang = Object.keys(SANG).filter((k) => !(k in TOI_NUT)).sort()
    expect(Object.keys(TOI_NUT).every((k) => k in SANG)).toBe(true)
    expect(chiSang).toEqual(['--bts-ai-chu', '--bts-ai-do', '--bts-ai-duong', '--bts-ai-la', '--bts-ai-phu'])
    const dinhNghia = [...css.matchAll(/--bts-nen\s*:/g)].length
    expect(dinhNghia).toBe(3) // sáng + tối @media + tối nút — không khối thứ tư (vd. một bản tối lạc trong tệp khác)
  })
  it('--bts-luoi (vạch lưới nến): sáng gần trắng, tối tối hơn nền thẻ tối một chút — KHÁC nhau; các màu nền/chữ/vạch cũng khác giữa hai bản', () => {
    expect(SANG['--bts-luoi']).not.toBe(TOI_NUT['--bts-luoi'])
    for (const k of ['--bts-nen', '--bts-mat', '--bts-chu', '--bts-vien', '--bts-luoi', '--bts-xam-o']) expect(SANG[k], k).not.toBe(TOI_NUT[k])
  })
  it('khối media loại trừ ép Sáng (không để tối của máy đè lên lựa chọn Sáng của thầy); tệp CSS khác KHÔNG định nghĩa lại --bts-*', () => {
    expect(readFileSync('src/styles/tokens.css', 'utf8')).toMatch(/:root:not\(\[data-giao-dien='sang'\]\)/)
    for (const f of ['src/components/bang-tin-san/bang-tin-san.css', 'src/index.css', 'src/styles/teacher-layout.css', 'src/styles/vo-thay.css']) {
      const dinhNghia = [...readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(--bts-[a-z0-9-]+)\s*:/g)].map((m) => m[1]!)
      expect(dinhNghia.filter((k) => k in SANG), `${f} định nghĩa lại token màu`).toEqual([]) // --bts-fm / --bts-em / --bts-cao-hang (không phải màu) được phép
    }
  })
})
