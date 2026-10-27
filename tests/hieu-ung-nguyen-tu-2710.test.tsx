// LÀM LẠI HIỆU ỨNG NGUYÊN TỬ + COMBO (thầy 27/10): số lăn, viên thưởng cạnh bộ đếm (không nổi giữa nội dung), băng mốc trong thanh trên dính, sét / lắc.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { SoLan } from '../src/components/hoc-tap/SoLan'
import { TamThuong } from '../src/components/thuong/TamThuong'
import { chayThuong } from '../src/components/hoc-tap/hieu-ung-duo'

afterEach(() => { cleanup(); vi.useRealTimers() })

describe('số lăn kiểu đồng hồ cơ', () => {
  it('mỗi chữ số một cột dải 0–9 ×2; thêm chữ số mới ở trái, hàng đơn vị vẫn là cột cuối', () => {
    const { container, rerender } = render(<SoLan v={7} />)
    expect(container.querySelectorAll('.so-lan-cot')).toHaveLength(1)
    expect(container.querySelectorAll('.so-lan-cot i')).toHaveLength(20)
    rerender(<SoLan v={12} />)
    expect(container.querySelectorAll('.so-lan-cot')).toHaveLength(2)
    expect(container.querySelector('.so-lan')!.getAttribute('aria-hidden')).toBe('true')
  })
})

describe('viên thưởng chỉ ở bộ đếm', () => {
  it('TamThuong ở màn làm chặng (demLen): không có «+N» bay nổi giữa nội dung; tên đọc màn hình giữ số cuối', () => {
    const { container } = render(<TamThuong thuong={{ tinh: true, nguyenTu: 12, dong: [{ nhan: 'Đúng', so: 10 }, { nhan: 'Chuỗi đúng 3', so: 2 }], chuoiDung: 3, cauKho: false }} demLen />)
    expect(container.querySelector('.tp-bay-so')).toBeNull()
    expect(container.querySelector('[aria-label="+12 nguyên tử"]')).not.toBeNull()
  })
  it('giảm chuyển động: đổi số ngay một lần, không dựng hạt / sét', () => {
    const onSo = vi.fn()
    const huy = chayThuong({ goc: null, dem: null, bi: null, N: 12, phu: 2, moc: 0, chuoi: 1, onSo }, true)
    expect(onSo).toHaveBeenCalledWith(12)
    expect(document.querySelector('.duo-set, .duo-hat, .duo-vien')).toBeNull()
    huy()
  })
  it('bình thường: viên «+10» xanh + viên cam «+2» cạnh bộ đếm, số cộng đủ N', () => {
    vi.useFakeTimers()
    const dem = document.createElement('span'); dem.innerHTML = '<svg></svg>'; document.body.append(dem)
    const onSo = vi.fn()
    const huy = chayThuong({ goc: null, dem, bi: null, N: 12, phu: 2, moc: 0, chuoi: 1, onSo }, false)
    vi.advanceTimersByTime(300)
    const v = [...dem.querySelectorAll('.duo-vien')].map((e) => [e.textContent, e.hasAttribute('data-cam')])
    expect(v).toEqual([['+10', false], ['+2', true]])
    expect(onSo).toHaveBeenCalledWith(12)
    huy(); dem.remove()
    expect(dem.querySelector('.duo-vien')).toBeNull()
  })
})

describe('CSS', () => {
  const css = readFileSync('src/styles/trong-lam-bai.css', 'utf8')
  it('thanh trên màn làm chặng DÍNH, nền đặc; băng mốc nằm trong thanh trên; sét không chặn bấm', () => {
    expect(css).toMatch(/\.duo:not\(\[data-xong\]\) > \.duo-tren \{ position: sticky; top: 0;[^}]*background: var\(--tr-mat\)/)
    expect(css).toMatch(/\.duo-tren > \.duo-moc \{ position: absolute;/)
    expect(css).toMatch(/\.duo-set \{[^}]*pointer-events: none/)
  })
})
