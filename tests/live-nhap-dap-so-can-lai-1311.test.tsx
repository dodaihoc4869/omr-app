// @vitest-environment jsdom
// Thầy 13/11: «Phần nhập đáp án của trả lời ngắn trong chế độ học phần số hơi bé, trong khi trên vẫn thừa chỗ, cân đối lại phần nhập cho đẹp mắt rộng rãi
// mà không tăng kích thước phần nhập». Đo thật bằng Chromium ở mọi bề ngang 300–800 px (ghi trong đặc tả mục 46): bề cao không tăng, phím số to gần gấp đôi.
// Tệp này khoá các chốt trong mã để phiên sau không gỡ nhầm.
import { readFileSync } from 'node:fs'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { TamTra } from '../src/components/live/TamTra'

afterEach(cleanup)
const css = readFileSync('src/components/live/live-em.css', 'utf8')
const mo = () => { const n = document.querySelector<HTMLElement>('.lv-tra-nam'); if (n && !document.querySelector('.lv-tra')) fireEvent.click(n) }

describe('nhập đáp số (trả lời ngắn) — cân lại bố cục', () => {
  it('chỉ dải của câu trả lời ngắn mang lớp «nhap-so»; đủ ô đáp số, Xoá, 12 phím, nút gửi', () => {
    const r = render(<TamTra so={3} phan="III" tuLuan={false} soPa={4} tra={{ chon: '2,48', dat: () => {}, phim: () => {} }} onGui={() => {}} />)
    mo()
    expect(document.querySelector('.lv-tra')!.classList.contains('nhap-so')).toBe(true)
    expect(document.querySelectorAll('.lv-tra-phim .lv-tra-nut')).toHaveLength(12)
    expect(document.querySelector('.lv-tra-so output')).not.toBeNull()
    expect(document.querySelector('.lv-tra-gui')!.textContent).toBe('Gửi đáp số')
    r.unmount()
    render(<TamTra so={1} phan="I" tuLuan={false} soPa={4} tra={{ chon: '', dat: () => {}, phim: () => {} }} />)
    mo()
    expect(document.querySelector('.lv-tra')!.classList.contains('nhap-so')).toBe(false)
  })
  it('CSS: tính theo bề ngang khung giấy; khung vừa = cột trái (ô + Xoá / Gửi) + phím 6 × 2; khung hẹp = hàng trên + phím 6 × 2; khung rộng giữ một hàng', () => {
    expect(css).toContain('.lv-duoi { container-type: inline-size; container-name: lv-duoi; }')
    expect(css).toContain('@container lv-duoi (max-width: 633px) {\n  .lv-tra.nhap-so .lv-tra-phim { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 5px; }')
    expect(css).toContain('@container lv-duoi (min-width: 420px) and (max-width: 633px) {')
    expect(css).toContain('grid-template-areas: "nam nam" "dau dau" "so phim" "gui phim";')
    expect(css).toContain('.lv-duoi[data-thap] .lv-tra.nhap-so { grid-template-areas: "nam nam" "so phim" "gui phim"; }')
    expect(css).toContain('@container lv-duoi (max-width: 419px) {')
    // không đụng luật chung của các loại câu khác, không tăng bề cao phím
    expect(css).toContain('.lv-tra .lv-tra-nut { flex: 1 1 0; min-width: 0; min-height: 44px;')
    expect(css).toContain('.lv-duoi[data-thap] .lv-tra .lv-tra-nut, .lv-duoi[data-thap] .lv-tra .lv-tra-gui { min-height: 38px; }')
  })
})
