// Bảng trong đề ở màn thi / kiểm tra kiểu Duo (thầy 27/10): khung (mảnh nạp lười) chỉ gắn thuộc tính trình bày lên bảng sẵn có — bảng hai hàng quá rộng
// ⇒ table[data-doc] + --n (xoay dọc); bảng lớn ⇒ .cau-bang[data-mep] (bóng mép); bảng màn luyện (.bang-de) bỏ qua; KHÔNG đổi chữ trong bảng.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { useRef } from 'react'
import { useBangKt } from '../src/components/kiem-tra-duo/KhungKiemTra'

afterEach(cleanup)
const dat = (e: Element, w: number, c: number) => {
  Object.defineProperty(e, 'scrollWidth', { configurable: true, get: () => w })
  Object.defineProperty(e, 'clientWidth', { configurable: true, get: () => c })
  Object.defineProperty(e, 'offsetParent', { configurable: true, get: () => document.body })
}
function Khung({ children, truoc }: { children: React.ReactNode; truoc?: (g: HTMLElement) => void }) {
  const g = useRef<HTMLDivElement>(null)
  useBangKt({ get current() { if (g.current && truoc) truoc(g.current); return g.current } })
  return <div ref={g}>{children}</div>
}
const bang = (hang: string[][], lop = '') => <div className={lop}><div className="cau-bang"><table><tbody>{hang.map((h, i) => <tr key={i}>{h.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table></div></div>

describe('useBangKt', () => {
  it('bảng 2 hàng × 4 cột rộng hơn khung ⇒ xoay dọc (data-doc, --n = 4), chữ giữ nguyên', () => {
    const { container } = render(<Khung truoc={(g) => g.querySelectorAll('.cau-bang').forEach((k) => dat(k, 520, 300))}>{bang([['Chất', 'Ammonia', 'Methylamine', 'Ethylamine'], ['Nhiệt độ sôi (°C)', '−33,3', '−6,4', '16,6']])}</Khung>)
    const t = container.querySelector('table')!
    expect(t.hasAttribute('data-doc')).toBe(true)
    expect(t.style.getPropertyValue('--n')).toBe('4')
    expect(t.textContent).toBe('ChấtAmmoniaMethylamineEthylamineNhiệt độ sôi (°C)−33,3−6,416,6')
  })
  it('bảng lớn 3 hàng tràn ⇒ không xoay, bóng mép phải; bảng màn luyện (.bang-de) bỏ qua', () => {
    const lon = [['a', 'b', 'c', 'd'], ['1', '2', '3', '4'], ['5', '6', '7', '8']]
    const { container } = render(<Khung truoc={(g) => g.querySelectorAll('.cau-bang').forEach((k) => dat(k, 600, 300))}>{bang(lon)}{bang(lon.slice(0, 2), 'bang-de')}</Khung>)
    const [k1, k2] = container.querySelectorAll<HTMLElement>('.cau-bang')
    expect(k1!.getAttribute('data-mep')).toBe('phai')
    expect(k1!.querySelector('table')!.hasAttribute('data-doc')).toBe(false)
    expect(k2!.querySelector('table')!.hasAttribute('data-doc')).toBe(false)
    expect(k2!.hasAttribute('data-mep')).toBe(false)
  })
})
