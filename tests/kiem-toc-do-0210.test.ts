// @vitest-environment node
// Trang đo tốc độ (thầy 02/10: "mọi app mọi chỗ đều mất 10 giây"): phải đi thẳng ra mạng (SW không chặn, không precache) và chỉ đo, không ghi.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const GOC = path.resolve(__dirname, '..')
const trang = fs.readFileSync(path.join(GOC, 'public/cai-kiem-toc-do.html'), 'utf8')

describe('public/cai-kiem-toc-do.html', () => {
  it('tên "cai-" ⇒ service worker không trả index.html thay trang này', () => {
    expect(fs.readFileSync(path.join(GOC, 'src/sw.ts'), 'utf8')).toContain('/^\\/cai-/')
  })
  it('không nằm trong precache', () => {
    expect(fs.readFileSync(path.join(GOC, 'vite.config.ts'), 'utf8')).toContain("'**/cai-kiem-toc-do.html'")
  })
  it('đo đủ 5 chặng; chỉ gọi lệnh không ghi dữ liệu; không gửi kết quả đi đâu', () => {
    for (const s of ['DNS', 'Pages: tệp nhỏ', 'Pages: tệp mã chính', 'Máy chủ Worker', 'Mở app học sinh']) expect(trang).toContain(s)
    const goi = [...trang.matchAll(/MAY_CHU \+ '([^']+)'/g)].map((m) => m[1])
    expect(goi).toEqual(['/hs/hoi-thay'])
    expect(trang).not.toMatch(/sendBeacon|XMLHttpRequest/)
  })
})
