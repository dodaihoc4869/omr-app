// NÚT NỔI "VÀO THI" NHƯỜNG NÚT CHÍNH (Boss báo 21/09: ở 390 nút nổi che nút "Làm …" của thẻ LÀM NGAY).
// Luật: nút nổi mờ đi + không bấm trúng khi đè lên `.bnv-nut-chinh`; hết đè (cuộn/đổi cỡ) thì hiện lại; bàn phím vẫn tới được.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import NutVaoThi, { haiOChongNhau } from '../src/components/bang-nhiem-vu/NutVaoThi'

const o = (l: number, t: number, r: number, b: number) => ({ left: l, top: t, right: r, bottom: b, width: r - l, height: b - t, x: l, y: t, toJSON: () => ({}) }) as DOMRect

describe('haiOChongNhau', () => {
  it('đè thật ⇒ true; xa nhau / chạm cạnh ⇒ false', () => {
    expect(haiOChongNhau(o(252, 580, 374, 636), o(36, 495, 354, 543))).toBe(false) // nút chính cao hơn nút nổi
    expect(haiOChongNhau(o(252, 500, 374, 556), o(36, 495, 354, 543))).toBe(true)
    expect(haiOChongNhau(o(354, 500, 400, 556), o(36, 495, 354, 543))).toBe(false) // chạm cạnh phải
    expect(haiOChongNhau(o(36, 543, 100, 600), o(36, 495, 354, 543))).toBe(false) // chạm cạnh dưới
    expect(haiOChongNhau(o(100, 500, 200, 520), o(36, 495, 354, 543))).toBe(true) // nằm gọn trong
    expect(haiOChongNhau(o(0, 500, 36, 556), o(36, 495, 354, 543))).toBe(false) // chạm cạnh trái
    expect(haiOChongNhau(o(100, 440, 200, 495), o(36, 495, 354, 543))).toBe(false) // chạm cạnh trên
  })
  it('ô rỗng (0×0) ⇒ không đè', () => {
    expect(haiOChongNhau(o(0, 0, 0, 0), o(0, 0, 0, 0))).toBe(false)
    expect(haiOChongNhau(o(10, 10, 10, 50), o(0, 0, 100, 100))).toBe(false)
    expect(haiOChongNhau(o(0, 0, 100, 100), o(10, 10, 10, 50))).toBe(false) // ô thứ hai rỗng
    expect(haiOChongNhau(o(0, 0, 100, 100), o(10, 10, 50, 10))).toBe(false)
  })
})

describe('NutVaoThi · nhường nút chính', () => {
  let cho: Array<() => void> = []
  beforeEach(() => {
    cho = []
    vi.stubGlobal('requestAnimationFrame', (f: () => void) => { cho.push(f); return cho.length })
    vi.stubGlobal('cancelAnimationFrame', () => {})
  })
  afterEach(() => { cleanup(); vi.unstubAllGlobals() })
  const chay = () => act(() => { const ds = cho; cho = []; ds.forEach((f) => f()) })

  function dung(hopFab: DOMRect, hopNut: DOMRect | null) {
    let fab = hopFab
    let chinh = hopNut
    const v = render(
      <div className="bnv">
        {chinh && <button className="bnv-nut-chinh">Làm chặng 1</button>}
        <NutVaoThi onVaoThi={() => {}} />
      </div>,
    )
    const nutFab = v.container.querySelector('.bnv-fab') as HTMLButtonElement
    nutFab.getBoundingClientRect = () => fab
    const nutChinh = v.container.querySelector('.bnv-nut-chinh') as HTMLButtonElement | null
    if (nutChinh) nutChinh.getBoundingClientRect = () => chinh!
    return { v, nutFab, datFab: (r: DOMRect) => { fab = r }, datChinh: (r: DOMRect) => { chinh = r } }
  }

  it('không có nút chính (vd phụ huynh / không có việc) ⇒ không nhường', () => {
    const { nutFab } = dung(o(252, 500, 374, 556), null)
    chay()
    expect(nutFab.dataset.nhuong).toBe('false')
  })
  it('đè lên nút chính ⇒ nhường (sau khi có sự kiện đo lại); cuộn khỏi chỗ đè ⇒ hiện lại', () => {
    const { nutFab, datFab } = dung(o(252, 580, 374, 636), o(36, 495, 354, 543))
    fireEvent.scroll(window); chay()
    expect(nutFab.dataset.nhuong).toBe('false')
    datFab(o(252, 500, 374, 556)) // điện thoại thấp hơn: nút nổi lên đúng chỗ nút chính
    fireEvent.scroll(window); chay()
    expect(nutFab.dataset.nhuong).toBe('true')
    datFab(o(252, 600, 374, 656))
    fireEvent(window, new Event('resize')); chay()
    expect(nutFab.dataset.nhuong).toBe('false')
  })
  it('nút chính xuất hiện SAU khi nút nổi đã dựng (dữ liệu tải xong) ⇒ vẫn đo lại', async () => {
    const { v, nutFab } = dung(o(252, 500, 374, 556), null)
    chay()
    expect(nutFab.dataset.nhuong).toBe('false')
    const goc = v.container.querySelector('.bnv')!
    const moi = document.createElement('button')
    moi.className = 'bnv-nut-chinh'
    moi.getBoundingClientRect = () => o(36, 495, 354, 543)
    goc.appendChild(moi)
    await act(async () => { await Promise.resolve() }) // MutationObserver báo qua vi tác vụ
    chay()
    expect(nutFab.dataset.nhuong).toBe('true')
  })
  it('nhiều sự kiện cuộn liên tiếp chỉ xếp MỘT lần đo trong một khung hình', () => {
    dung(o(0, 0, 10, 10), null)
    cho = []
    fireEvent.scroll(window); fireEvent.scroll(window); fireEvent.scroll(window)
    expect(cho).toHaveLength(1)
    chay()
    fireEvent.scroll(window)
    expect(cho).toHaveLength(1) // xong khung thì xếp được lần mới
  })
  it('gỡ màn ⇒ không còn nghe cuộn / đổi cỡ (không rò)', () => {
    const them = vi.spyOn(window, 'addEventListener'), bo = vi.spyOn(window, 'removeEventListener')
    const { v } = dung(o(0, 0, 10, 10), null)
    const nghe = them.mock.calls.filter((c) => c[0] === 'scroll' || c[0] === 'resize').length
    expect(nghe).toBe(2)
    const ngat = vi.spyOn(MutationObserver.prototype, 'disconnect')
    v.unmount()
    expect(ngat).toHaveBeenCalled()
    ngat.mockRestore()
    expect(bo.mock.calls.filter((c) => c[0] === 'scroll' || c[0] === 'resize').length).toBe(2)
    them.mockRestore(); bo.mockRestore()
  })
})

describe('CSS nhường — hợp đồng', () => {
  const css = fs.readFileSync(path.join(process.cwd(), 'src/components/bang-nhiem-vu/bang-nhiem-vu.css'), 'utf8')
  it("nhường ⇒ mờ + không bấm trúng; focus bàn phím ⇒ hiện lại; giảm chuyển động ⇒ không hiệu ứng", () => {
    expect(css).toMatch(/\.bnv-fab\[data-nhuong='true'\]\s*\{[^}]*opacity:\s*0;[^}]*pointer-events:\s*none;/)
    expect(css).toMatch(/\.bnv-fab\[data-nhuong='true'\]:focus-visible\s*\{[^}]*opacity:\s*1;/)
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{\s*\.bnv-fab \{\s*transition: none;/)
    expect(css).toMatch(/\.bnv-fab \{\s*transition: opacity 0\.2s/)
  })
})
