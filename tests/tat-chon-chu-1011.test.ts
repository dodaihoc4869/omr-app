// @vitest-environment node
// TẮT BÔI ĐEN / COPY CHỮ cả 3 app (thầy 10/11 «Tắt bôi đen chữ, coppy chư trên toàn app hs gv và ph cho chuyên nghiệp nhé»).
// Khoá: tờ gốc dùng chung (src/index.css, main.tsx nạp cho /hs /gv /ph) đặt body không chọn chữ + không menu giữ-chạm; ô nhập / vùng soạn mở lại
// (iPhone: thiếu khai lại thì ô nhập không gõ được). Đã kiểm Chromium thật: kéo chuột / Ctrl+A bôi 0 ký tự (bản cũ 19–119), ô nhập vẫn chọn được.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const css = readFileSync('src/index.css', 'utf8')
const khoi = (bo: string) => css.match(new RegExp(`(?:^|\\n)${bo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{([^}]*)\\}`))?.[1] ?? ''

describe('tắt bôi đen chữ toàn app', () => {
  it('body: không chọn chữ, không menu giữ-chạm', () => {
    const b = khoi('body')
    expect(b).toMatch(/\buser-select: none;/)
    expect(b).toMatch(/-webkit-user-select: none;/)
    expect(b).toMatch(/-webkit-touch-callout: none;/)
  })
  it('ô nhập / vùng soạn vẫn chọn, sửa chữ được', () => {
    const o = khoi('input, textarea, [contenteditable]')
    expect(o).toMatch(/\buser-select: text;/)
    expect(o).toMatch(/-webkit-user-select: text;/)
  })
  it('tờ gốc nạp ở đường vào chung của cả 3 app', () => {
    expect(readFileSync('src/main.tsx', 'utf8')).toMatch(/import '\.\/index\.css'/)
  })
})
