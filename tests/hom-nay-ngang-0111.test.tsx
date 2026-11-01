// HÔM NAY XOAY NGANG + THU GỌN THANH BÊN (thầy 01/11: «Xoay ngang đt tôi muốn màn hôm nay hiển thị 4 ô như máy tính, trên máy tính thanh bên trái có
// thể thu nhỏ vào đc, tối ưu xoay ngang trên đt và máy tính cho phần hôm nay nhé.»). Ảnh Chromium thật: docs/hom-nay-ngang-0111/.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'

vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: async () => ({ ok: false, loai: 'mang', chu: '' }) }))

import ThanhBenTrai, { KHOA_BEN_THU } from '../src/components/ThanhBenTrai'
import { useCoHoa2 } from '../src/components/chien-dich/co-hoa2'

const goc = document.documentElement
afterEach(() => {
  cleanup()
  useCoHoa2.getState().dat(null)
  localStorage.clear()
  delete goc.dataset.trong
  goc.removeAttribute('data-ben-thu')
})
const nut = () => screen.queryByRole('button', { name: /thanh bên$/ })

describe('thu gọn thanh bên (máy tính)', () => {
  it('«Trong»: nút cuối thanh, aria-expanded + nhãn đổi theo trạng thái; dấu <html data-ben-thu>; nhớ trong máy', () => {
    goc.dataset.trong = 'gv'
    useCoHoa2.getState().dat({ bat: true, lop: [], sbd: [] })
    const { container } = render(<ThanhBenTrai />)
    const n = nut()!
    expect(n.getAttribute('aria-label')).toBe('Thu gọn thanh bên')
    expect(n.getAttribute('aria-expanded')).toBe('true')
    expect(n.getAttribute('aria-current')).toBeNull() // không phải đích điều hướng
    expect(container.querySelector('nav')!.lastElementChild).toBe(n)
    expect(goc.hasAttribute('data-ben-thu')).toBe(false)
    fireEvent.click(n)
    expect(n.getAttribute('aria-label')).toBe('Mở rộng thanh bên')
    expect(n.getAttribute('aria-expanded')).toBe('false')
    expect(goc.hasAttribute('data-ben-thu')).toBe(true)
    expect(localStorage.getItem(KHOA_BEN_THU)).toBe('1')
    fireEvent.click(n)
    expect(goc.hasAttribute('data-ben-thu')).toBe(false)
    expect(localStorage.getItem(KHOA_BEN_THU)).toBe('0')
  })

  it('đã thu lần trước ⇒ mở app là dải biểu tượng ngay (đọc localStorage trước lần vẽ đầu); bộ menu cũ cũng có nút', () => {
    goc.dataset.trong = 'gv'
    localStorage.setItem(KHOA_BEN_THU, '1')
    render(<ThanhBenTrai />)
    expect(goc.hasAttribute('data-ben-thu')).toBe(true)
    expect(nut()!.getAttribute('aria-expanded')).toBe('false')
  })

  it('localStorage bị chặn ⇒ vẫn chạy (mở rộng như cũ), bấm không ném lỗi', () => {
    goc.dataset.trong = 'gv'
    const doc = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('chặn') })
    const ghi = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('chặn') })
    render(<ThanhBenTrai />)
    expect(nut()!.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(nut()!)
    expect(goc.hasAttribute('data-ben-thu')).toBe(true)
    doc.mockRestore()
    ghi.mockRestore()
  })

  it('tắt «Trong» (vỏ cũ) ⇒ không có nút', () => {
    render(<ThanhBenTrai />)
    expect(nut()).toBeNull()
  })

  it('CSS: chỉ ≥ 1100 hiện nút; thu ⇒ dải 76 px dùng lại luật 880–1099 (luật ngăn kéo gắn :not([data-ben-thu])), số đếm vẫn hiện, nội dung nới 1480', () => {
    const css = readFileSync('src/styles/trong-gv.css', 'utf8')
    expect(css).toContain("[data-trong='gv'] .m3.vo-thay .ben-trai .ben-trai-thu { display: none; }")
    const tu1100 = css.slice(css.indexOf('@media (min-width: 1100px)'))
    expect(tu1100).toContain("[data-trong='gv']:not([data-ben-thu]) .m3.vo-thay { grid-template-columns: 248px minmax(0, 1fr); }")
    expect(tu1100).toContain("[data-trong='gv'] .m3.vo-thay .ben-trai .ben-trai-thu { display: flex; }")
    expect(tu1100).toContain("[data-trong='gv'][data-ben-thu] .m3.vo-thay .ben-trai .ben-trai-dem { position: absolute; }")
    expect(tu1100).toContain("[data-trong='gv'][data-ben-thu] .m3.vo-thay .giua-noi-dung { max-width: 1480px; }")
  })
})

describe('Hôm nay xoay ngang', () => {
  it('máy NGANG từ 640 px ⇒ 4 bảng 2×2 (đè luật một cột < 1100), luật nằm SAU luật một cột; máy dọc giữ ô chọn bảng', () => {
    const css = readFileSync('src/components/hom-nay-thay/bon-bang.css', 'utf8')
    const motCot = css.indexOf('@media (max-width: 1100px) {\n  [data-trong=\'gv\'] .bb-bon { grid-template-columns: minmax(0, 1fr); }')
    const ngang = css.indexOf("@media (orientation: landscape) and (min-width: 640px) {\n  [data-trong='gv'] .bb-bon { grid-template-columns: repeat(2, minmax(0, 1fr)); }")
    expect(motCot).toBeGreaterThan(0)
    expect(ngang).toBeGreaterThan(motCot)
    expect(css).toContain("@media (max-width: 600px) {\n  [data-trong='gv'] .bb-chon { display: grid;")
    // máy thấp: dòng ≥ 44 px (đích bấm), chữ ≥ 13 px
    const thap = css.slice(css.indexOf('@media (orientation: landscape) and (max-height: 600px)'))
    expect(thap).toContain('.bb-dong { min-height: 48px;')
    expect(thap).toContain('font-size: 13px')
  })

  it('đầu màn máy thấp nằm ngang: tiêu đề + hai nút hiện lại (Việc cần thầy nay ở cuối màn), không còn ẩn tiêu đề', () => {
    const css = readFileSync('src/styles/trong-gv-hom-nay.css', 'utf8')
    expect(css).not.toContain('.gvhn-1210 .gvhn-dau[data-co-ca] { position: absolute;')
    const ngang = css.slice(css.indexOf('@media (orientation: landscape) and (max-height: 600px)'))
    expect(ngang).toContain("[data-trong='gv'] .gvhn-1210 .gvhn-dau > .gvhn-nut-phu { display: inline-flex; }")
    expect(ngang).toContain("[data-trong='gv'] .gvhn-1210 .gvhn-dau .nht-chi-hep { display: inline; }")
  })
})

describe('bù byte (luật tốc độ)', () => {
  it('cửa mã bí mật nạp lười, ngoài precache', () => {
    expect(readFileSync('src/App.tsx', 'utf8')).toContain("const KhoaMayThayScreen = lazy(() => import('./screens/KhoaMayThayScreen'))")
    expect(readFileSync('vite.config.ts', 'utf8')).toContain("'**/KhoaMayThayScreen-*.{js,css}'")
  })
})
