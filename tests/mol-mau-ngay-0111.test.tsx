// @vitest-environment jsdom
// MOL — 3 BỘ MÀU ĐỔI MỖI NGÀY + BONG BÓNG TRÊN ĐẦU MOL (thầy 01/11 tối: «Chốt bình cầu, chọn cả 3 bộ màu thay đổi mỗi ngày»; «chữ hiện bong bóng trên đầu Mol,
// bong bóng có hiệu ứng đổi màu theo cảm xúc»). Khoá: chọn bộ theo NGÀY VIỆT NAM (thuần, tất định, biên 23:59 / 00:00 giờ VN); Mol mang data-mol-mau;
// CSS ba bộ chỉ token; ảnh tĩnh bộ màu ngày khác bị bỏ; Lộ trình đưa lời lên bong bóng trên đầu Mol ở mọi hướng màn, màu theo cảm xúc, chân ngôn nghiêng.
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { boMauMol } from '../src/lib/mau-mol-ngay'
import { _resetGioMayChu, dongBoGioMayChu } from '../src/lib/gio-may-chu'
import { taoLua } from '../src/components/linh-vat/mol-dong'

const vn = (y: number, mo: number, d: number, h: number, mi = 0, s = 0) => Date.UTC(y, mo - 1, d, h - 7, mi, s) // giờ Việt Nam ⇒ ms
afterEach(() => { _resetGioMayChu(); document.body.innerHTML = '' })

describe('bộ màu theo ngày Việt Nam', () => {
  it('cả ngày VN cùng một bộ; qua 00:00 giờ VN đổi bộ (biên 23:59:59 / 00:00:00)', () => {
    const sang = boMauMol(vn(2026, 11, 1, 0, 0, 0)), trua = boMauMol(vn(2026, 11, 1, 12)), khuya = boMauMol(vn(2026, 11, 1, 23, 59, 59))
    expect(trua).toBe(sang); expect(khuya).toBe(sang)
    const mai = boMauMol(vn(2026, 11, 2, 0, 0, 0))
    expect(mai).not.toBe(khuya)
    expect(mai).toBe((sang + 1) % 3)
    // 07:00 sáng giờ VN = 00:00 UTC — đổi theo ngày VN, KHÔNG theo ngày UTC
    expect(boMauMol(Date.UTC(2026, 10, 1, 16, 59, 59))).toBe(boMauMol(Date.UTC(2026, 10, 1, 0, 0, 0)))
  })
  it('ba ngày liền ⇒ đủ ba bộ 0 · 1 · 2; tất định', () => {
    const ba = [1, 2, 3].map((d) => boMauMol(vn(2026, 11, d, 9)))
    expect(new Set(ba).size).toBe(3)
    for (const b of ba) expect([0, 1, 2]).toContain(b)
    expect(boMauMol(vn(2026, 11, 5, 9))).toBe(boMauMol(vn(2026, 11, 5, 9)))
  })
  it('Mol vẽ ra mang data-mol-mau của ngày theo GIỜ MÁY CHỦ (máy lệch giờ vẫn cùng màu cả lớp)', () => {
    dongBoGioMayChu(vn(2026, 11, 2, 10))
    const s = document.createElement('span'); document.body.appendChild(s)
    const l = taoLua(s, { trangThai: 'vui' })
    expect(l.svg.getAttribute('data-mol-mau')).toBe(String(boMauMol(vn(2026, 11, 2, 10))))
    l.huy()
  })
  it('CSS ba bộ: bộ 0 mặc định, bộ 1 ngọc lam + hồng, bộ 2 chàm nhạt + cam — chỉ token; giận đỏ sẫm dùng chung', () => {
    const css = readFileSync('src/styles/mol.css', 'utf8')
    const bo = (n: number) => css.slice(css.indexOf(`.mol-svg[data-mol-mau='${n}'] {`), css.indexOf('}', css.indexOf(`.mol-svg[data-mol-mau='${n}'] {`)))
    expect(bo(1)).toContain('--mol-x: var(--tr-tin)'); expect(bo(1)).toContain('--mol-nuoc: var(--tr-tim)')
    expect(bo(2)).toContain('--mol-x: var(--tr-hs)'); expect(bo(2)).toContain('--mol-nuoc: var(--tr-chu-y)')
    for (const n of [1, 2]) expect(bo(n)).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i)
    expect(css).toContain('.mol-svg .mol-g4 {'); expect(css).toContain('.mol-svg .mol-g5 {')
  })
  it('ảnh tĩnh giữ chỗ của bộ màu ngày khác bị bỏ (Bi.tsx): ảnh điểm so theo ngày chụp, ảnh SVG đọc data-mol-mau', () => {
    const bi = readFileSync('src/components/linh-vat/Bi.tsx', 'utf8')
    expect(bi).toMatch(/a\.ngay \? boMauMol\(Date\.parse\(a\.ngay\)\) === bo : a\.src\.includes\(`data-mol-mau='\$\{bo\}'`\)/)
    expect(readFileSync('src/lib/khung-tinh-hs.ts', 'utf8')).toMatch(/\['stop-color', 'rgb\(0, 0, 0\)'\], \['stop-opacity', '1'\]/)
  })
})

describe('bong bóng lời trên đầu Mol (Lộ trình)', () => {
  const tsx = readFileSync('src/components/hoc-tap/TrongHs.tsx', 'utf8'), css = readFileSync('src/styles/trong-hs.css', 'utf8')
  it('mọi hướng màn: có Mol cạnh đường + có lời ⇒ bong bóng trên đầu Mol (không còn điều kiện điện thoại ngang thấp)', () => {
    expect(tsx).toContain('const benLua = coBiBen && loiLuaBi ? luaO : null')
    expect(tsx).toContain('onLuaO={datLuaO}')
    expect(tsx).not.toMatch(/thapNgang/)
  })
  it('tự căn không tràn mép (rộng ≤ 280, --trai / --duoi đo một lần), màu theo cảm xúc qua data-cx, chân ngôn data-chan-ngon', () => {
    expect(tsx).toMatch(/Math\.min\(280, r\.width - 16\)/)
    expect(tsx).toMatch(/setProperty\('--trai'/); expect(tsx).toMatch(/setProperty\('--duoi'/)
    expect(tsx).toMatch(/data-cx=\{cx\} data-chan-ngon=\{laChanNgon \|\| undefined\}/)
    expect(css).toContain("left: var(--trai, -60px)"); expect(css).toContain('left: var(--duoi, 53px)')
    for (const cx of ['vui', 'khen', 'chao', 'buon', 'doi', 'buc', 'cau', 'ratCau']) expect(css, cx).toContain(`.bi-loi-bong[data-cx='${cx}']`)
    expect(css).toContain("[data-cx='nghi'], [data-cx='ngu']")
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{ \[data-trong='hs'\] \.bi-loi-bong\[data-cx\] \{ animation: none !important; transition: none; \} \}/)
    expect(css).toContain('.bi-loi-bong[data-chan-ngon] { font-style: italic;')
  })
  it('kho câu giận nhớ theo lượt (không lặp liền, câu đứng yên khi vẽ lại) — localStorage ddh.loi-mol', () => {
    expect(tsx).toContain("const KHOA_LOI_MOL = 'ddh.loi-mol'")
    expect(tsx).toMatch(/loiTruoc: nhoLoi\.l === luotLoi \? nhoLoi\.t : nhoLoi\.c/)
  })
})
