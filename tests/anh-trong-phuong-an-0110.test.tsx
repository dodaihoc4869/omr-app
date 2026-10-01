import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import TheCau from '../src/components/TheCau'
import { chuPhuongAn, laChuGiuCho } from '../src/lib/anh-phuong-an'

// Thầy 01/10 (ảnh câu acid béo omega-3): "gắn thẳng ảnh vào đáp án cho cân đối, bỏ dòng chữ xem hình A".
describe('chữ giữ chỗ ô phương án', () => {
  it.each(['(xem hình phương án A)', '(xem hình)', '(xem hình D)', '.', '', ' (Xem hình phương án b) '])('"%s" là giữ chỗ', (s) => expect(laChuGiuCho(s)).toBe(true))
  it.each(['CH₃COOH', 'Hình 1 và 2 đều đúng', 'Liên kết của nhóm CO với nhóm NH', '2'])('"%s" là chữ thật', (s) => expect(laChuGiuCho(s)).toBe(false))
  it('chỉ bỏ chữ khi ô có ảnh', () => {
    expect(chuPhuongAn('(xem hình phương án A)', true)).toBe('')
    expect(chuPhuongAn('(xem hình phương án A)', false)).toBe('(xem hình phương án A)')
    expect(chuPhuongAn('CH₃COOH', true)).toBe('CH₃COOH')
  })
})

describe('TheCau: ảnh vào TRONG nút phương án', () => {
  const props = {
    cheDo: 'lam_bai' as const, stt: 1, id: 'c1', text: 'Chất nào là omega-3?', phan: 'I' as const,
    choices: ['(xem hình phương án A)', '(xem hình phương án B)', '(xem hình phương án C)', 'Chữ thật D'] as [string, string, string, string],
    choicePerm: [0, 1, 2, 3], selected: null, onSelect: () => {},
    hinhAnh: [{ src: '/a.png', viTri: 'sau_pa_A' as const }, { src: '/b.png', viTri: 'sau_pa_B' as const }, { src: '/c.png', viTri: 'sau_pa_C' as const }, { src: '/d.png', viTri: 'sau_pa_D' as const }],
  }
  const html = renderToStaticMarkup(<TheCau {...(props as never)} />)
  it('không còn dòng chữ giữ chỗ', () => expect(html).not.toContain('xem hình'))
  it('ảnh A nằm trong nút phương án A', () => {
    expect(html.match(/src="\/a\.png"/g)?.length).toBe(1)
    expect(html).toMatch(/class="pa-anh"[^>]*src="\/a\.png"|src="\/a\.png"[^>]*class="pa-anh"/)
  })
  it('ô có chữ thật giữ chữ, ảnh vẫn đặt sau như cũ', () => {
    expect(html).toContain('Chữ thật D')
    expect(html).not.toMatch(/class="pa-anh"[^>]*src="\/d\.png"|src="\/d\.png"[^>]*class="pa-anh"/)
    expect(html).toContain('/d.png')
  })
})
