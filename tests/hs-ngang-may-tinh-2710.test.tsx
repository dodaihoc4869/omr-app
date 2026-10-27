// APP HỌC SINH NGANG + MÁY TÍNH (thầy 27/10 «Tối ưu tất cả các màn app hs xoay ngang và máy tính chưa»): thanh bên trái máy tính, dải kết quả ngang
// gọn một hàng trải bề ngang ≤ 30% chiều cao, phương án / bàn phím vừa khung 844×390, hai cột cho câu bàn phím ở 1024, đổi mục về đầu trang. Ảnh: khối «NGANG DUO 27/10».
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { createRef } from 'react'
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))
vi.mock('../src/lib/phan-hoi', () => ({ phanHoi: vi.fn() }))
import { MenuDocTrong } from '../src/components/hoc-tap/TrongHs'

const doc = (p: string) => readFileSync(p, 'utf8')
const khoi = (css: string, media: string) => { const i = css.indexOf(`@media ${media}`); expect(i).toBeGreaterThan(-1); return css.slice(i, css.indexOf('\n}', i)) }

describe('app HS ngang + máy tính 27/10', () => {
  afterEach(cleanup)
  it('tờ bố cục nạp SAU tờ gốc: TrongHs nhập trong-hs-ngang.css ngay sau trong-hs.css; trong-lam-bai.css @import trong-lam-ngang.css', () => {
    const tsx = doc('src/components/hoc-tap/TrongHs.tsx')
    expect(tsx.indexOf("import '../../styles/trong-hs-ngang.css'")).toBeGreaterThan(tsx.indexOf("import '../../styles/trong-hs.css'"))
    expect(doc('src/styles/trong-lam-bai.css')).toContain("@import './trong-lam-ngang.css';")
  })
  it('máy tính ≥ 1024 × 600: menu thành thanh bên trái cố định, vạch mép phải + lớp mờ ẩn, nội dung dời đúng bề thanh', () => {
    const k = khoi(doc('src/styles/trong-hs-ngang.css'), '(min-width: 1024px) and (min-height: 600px)')
    expect(k).toMatch(/\.ht2\[data-mot\] \.tr-menu \{[^}]*inset: 0 auto 0 0;[^}]*width: var\(--hs-ben\);[^}]*visibility: visible; opacity: 1;/)
    expect(k).toContain(':is(.tr-menu-cham, .tr-menu-phu) { display: none; }')
    expect(k).toContain('.ht2[data-mot] { padding-left: var(--hs-ben); }')
  })
  it('điện thoại ngang: dải kết quả GỌN MỘT HÀNG ghim đáy trải hết bề ngang, tối đa 30% chiều cao, hai cột chừa đáy cuộn bằng dải', () => {
    const k = khoi(doc('src/styles/trong-lam-ngang.css'), '(orientation: landscape) and (max-height: 500px)')
    expect(k).toMatch(/\.duo-day\.duo-ket \{[^}]*position: fixed; left: 0; right: 0; bottom: 0;[^}]*max-height: 30dvh;/)
    expect(k).toContain(':has(.duo-ket) :is(.duo-cot-de, .duo-cot-tra) { padding-bottom: calc(30dvh + 8px); }')
    // một hàng: chỉ tiêu đề + «Lời giải» (và «Gợi ý» của màn sửa câu) hiện; phần chữ khác ẩn khỏi mắt, vẫn còn cho trình đọc màn hình (không display: none)
    expect(k).toMatch(/\.duo-kq-chu > :not\(\.duo-ct-dau, \.duo-sua-goi-y\) \{[^}]*position: absolute;[^}]*clip-path: inset\(50%\);/)
    // bàn phím số: ô 48 + phím 44 (≥ 44px vùng chạm) — ô nhập không còn bị đẩy khuất dưới thanh trên
    expect(k).toContain('.ht2-lam-phim button { height: 44px; }')
  })
  it('không thêm màu: hai tờ mới chỉ có bố cục (không hex, không var màu mới)', () => {
    for (const p of ['src/styles/trong-hs-ngang.css', 'src/styles/trong-lam-ngang.css']) {
      const css = doc(p)
      expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i)
      expect(css).not.toMatch(/(?:^|[;{\s])(?:color|background(?:-color)?|fill|stroke)\s*:/m)
    }
  })
  it('đổi mục menu (Lộ trình → Thành tích) ⇒ về đầu trang; về Lộ trình thì không đụng (Lộ trình tự cuộn tới chặng)', () => {
    const cuon = vi.fn()
    Object.defineProperty(document, 'scrollingElement', { configurable: true, value: { scrollTo: cuon } })
    const p = { ds: [], onMuc: () => {}, coCa: false, onThi: () => {}, dangTai: false, onTaiLai: () => {}, chuDau: 'MA', moCuaEm: false, onCuaEm: () => {}, nutCuaEm: createRef<HTMLButtonElement>(), moDiemDanh: false }
    const { rerender } = render(<MenuDocTrong muc="hom-nay" {...p} />)
    expect(cuon).not.toHaveBeenCalled()
    rerender(<MenuDocTrong muc="ket-qua" {...p} />)
    expect(cuon).toHaveBeenCalledWith(0, 0)
    rerender(<MenuDocTrong muc="hom-nay" {...p} />)
    expect(cuon).toHaveBeenCalledTimes(1)
  })
})
