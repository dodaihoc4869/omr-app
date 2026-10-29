// @vitest-environment jsdom
// MỞ CÂU KHÔNG KHỰNG (thầy 29/10, video 11:00 «Vẫn bị khựng chỗ mở câu», src/components/hoc-tap/LamCau.tsx `BanPhimSo`): bàn phím số vừa dựng ⇒ đo + cuộn vừa đủ để thấy ô đáp án + bàn phím +
// «Kiểm tra» ngay TRONG lượt layout (trước lần vẽ đầu), TỨC THÌ (`auto`) — trước đây đo sau hai khung vẽ rồi cuộn MƯỢT ~0,35 s nên câu vừa hiện đã trượt lên trước mắt em.
// Bố cục chưa có (cao 0) ⇒ đo lại sau khung vẽ, vẫn tức thì. Câu không trong khung Duo ⇒ không cuộn.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { BanPhimSo } from '../src/components/hoc-tap/LamCau'

const rect = (top: number, bottom: number) => ({ x: 0, y: top, top, bottom, left: 0, right: 340, width: 340, height: bottom - top, toJSON: () => ({}) }) as DOMRect
let cuon: ReturnType<typeof vi.fn>
beforeEach(() => {
  cuon = vi.fn()
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 700 })
  Object.defineProperty(document.documentElement, 'scrollBy', { configurable: true, value: cuon })
  Object.defineProperty(document, 'scrollingElement', { configurable: true, value: document.documentElement })
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

/** Giả số đo: bàn phím cao 300–640, hàng ô 200–260, thanh đáy dính từ 560 (⇒ phải cuộn 88 px, nhưng ô không được cuộn mất: tối đa 200 − 8 = 192). */
function giaSoDo(cao: boolean) {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    if (!cao) return rect(0, 0)
    if (this.classList.contains('ht2-lam-phim')) return rect(300, 640)
    if (this.classList.contains('ht2-lam-o-hang')) return rect(200, 260)
    if (this.classList.contains('duo-day')) return rect(560, 700)
    return rect(0, 0)
  })
}
const man = (trongDuo = true) => render(
  <div className={trongDuo ? 'duo' : ''}>
    <div className="ht2-lam-o-hang" />
    <BanPhimSo value="" onPhim={() => {}} khoa={false} />
    <div className="duo-day" style={{ position: 'sticky' }}><button className="duo-nut" type="button">Kiểm tra</button></div>
  </div>,
)

it('bố cục đã có ⇒ cuộn NGAY khi dựng (đồng bộ, trước lần vẽ đầu), tức thì (auto), vừa đủ 88 px', () => {
  giaSoDo(true)
  man()
  expect(cuon).toHaveBeenCalledTimes(1)
  expect(cuon).toHaveBeenCalledWith({ top: 88, behavior: 'auto' })
})

it('bố cục chưa có (cao 0) ⇒ chưa cuộn lúc dựng; đo lại sau khung vẽ, vẫn tức thì', async () => {
  giaSoDo(false)
  man()
  expect(cuon).not.toHaveBeenCalled()
  vi.restoreAllMocks(); giaSoDo(true)
  await new Promise((r) => setTimeout(r, 80)) // hai khung vẽ
  expect(cuon).toHaveBeenCalledWith({ top: 88, behavior: 'auto' })
})

it('không nằm trong khung Duo ⇒ không đo, không cuộn', () => {
  giaSoDo(true)
  man(false)
  expect(cuon).not.toHaveBeenCalled()
})
