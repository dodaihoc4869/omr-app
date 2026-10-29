// @vitest-environment jsdom
// HÀNG Ô TRẢ LỜI NGẮN PHẢI THẤY ĐƯỢC KHI EM GÕ (việc văn phòng a254c6118c6b lần 2, sau lệnh thầy 15/10 ~10:25 "hiển thị đúng số ô cần điền"):
// đo Chromium thật ở 340×760, câu amine 6 dòng: đáy hàng ô 481 px, thanh đáy (bàn phím số, sticky bottom) bắt đầu 447 px ⇒ em bấm "2" "4" mà hai ô
// bị cắt nửa. Luật: em bấm phím (bàn phím số của app hoặc phím máy tính) mà đáy hàng ô nằm dưới (đỉnh thanh đáy − 12 px) ⇒ cuộn khung cuộn đúng
// `đáy hàng ô − đỉnh thanh đáy + 12` px (smooth; prefers-reduced-motion ⇒ auto). Lúc MỞ câu không cuộn (em đọc đề trước). Màn rộng / xoay ngang:
// thanh đáy là cột phải (không chồng ngang hàng ô) hoặc hàng ô nằm trong thanh ⇒ 0, không cuộn.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import { goiHoa2 } from '../src/components/hoa2/api'
import { cuonDeThayO } from '../src/components/hoc-tap/lam-bai-man'
import { MQ_LAM_RONG } from '../src/components/hoc-tap/LamCau'
import { publicQuestion, type PrivateQuestion } from '../src/game/than-thu-v2/core'
vi.mock('../src/components/hoa2/api', async (goc) => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: vi.fn() }))
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.mocked(goiHoa2).mockReset(); localStorage.clear(); delete (window as { matchMedia?: unknown }).matchMedia })

type Khung = { top: number; bottom: number; left: number; right: number; width?: number; height?: number }
const k = (top: number, bottom: number, left: number, right: number): Khung => ({ top, bottom, left, right, width: right - left, height: bottom - top })

describe('cuonDeThayO (phép thuần)', () => {
  it('340×760 câu amine: đáy hàng ô 481, thanh đáy 447 ⇒ cuộn 481 − 447 + 12 = 46 px', () => {
    expect(cuonDeThayO(k(423, 481, 141, 199), k(447, 760, 0, 340))).toBe(46)
  })
  it('hàng ô đã thấy trọn, cách thanh ≥ 12 px ⇒ 0; sát thanh dưới 12 px ⇒ đẩy cho đủ 12 px', () => {
    expect(cuonDeThayO(k(300, 358, 141, 199), k(447, 760, 0, 340))).toBe(0)
    expect(cuonDeThayO(k(377, 435, 141, 199), k(447, 760, 0, 340))).toBe(0)
    expect(cuonDeThayO(k(380, 440, 141, 199), k(447, 760, 0, 340))).toBe(5)
  })
  it('hàng ô khuất hẳn sau thanh ⇒ cuộn đủ để cả hàng lên trên thanh; khoảng cách tuỳ chọn', () => {
    expect(cuonDeThayO(k(500, 558, 141, 199), k(447, 760, 0, 340))).toBe(123)
    expect(cuonDeThayO(k(423, 481, 141, 199), k(447, 760, 0, 340), 20)).toBe(54)
  })
  it('màn rộng / xoay ngang: thanh là cột phải (không chồng ngang hàng ô) ⇒ 0 dù đáy hàng ô thấp hơn đỉnh thanh', () => {
    expect(cuonDeThayO(k(520, 578, 300, 600), k(100, 640, 820, 1220))).toBe(0)
    expect(cuonDeThayO(k(300, 358, 200, 400), k(76, 380, 664, 984))).toBe(0)
  })
  it('chưa đo được (khung rỗng 0×0, ẩn) ⇒ 0', () => {
    expect(cuonDeThayO(k(0, 0, 0, 0), k(447, 760, 0, 340))).toBe(0)
    expect(cuonDeThayO(k(423, 481, 141, 199), k(0, 0, 0, 0))).toBe(0)
  })
})

const DE_AMINE = 'Cho các chất sau: (1) ammonia, (2) methylamine, (3) aniline, (4) dimethylamine. Liệt kê các chất theo số thứ tự tăng dần có lực base mạnh hơn ammonia?'
const cauIII = (qid: string, correct: string, text = 'Tính kết quả.'): PrivateQuestion => ({
  qid, maDe: 'DE-SO-O', version: 'v1', group: 'g', phan: 'III', text, choices: [], ideas: [], hinhAnh: [], dang: null, tenDang: 'Amine', mucDo: 'hieu', sao: 0, kienThuc: [],
  correct, solution: 'Lời giải', reviewed: true,
})

describe('màn làm bài thật: hàng ô tự vào tầm nhìn khi em gõ', () => {
  /** Mở màn trong khung cuộn như cổng học sinh (`fixed inset-0 overflow-y-auto`); giả số đo: hàng ô và thanh đáy theo `do`. */
  const moMan = (doHang: Khung, doThanh: Khung, giamChuyenDong = false, rong = false) => {
    vi.mocked(goiHoa2).mockImplementation(async (lenh: string) => {
      if (lenh === 'hoc-tap-start') return { ok: true, id: 'p1', questions: [publicQuestion(cauIII('12-C3-B8-D2-III-7', '24', DE_AMINE))] }
      if (lenh === 'answer') return { ok: true, solution: 'x', correct: true, answer: '24' }
      return { ok: true }
    })
    window.matchMedia = ((q: string) => ({ matches: (giamChuyenDong && q.includes('prefers-reduced-motion')) || (rong && q === MQ_LAM_RONG), media: q, addEventListener: () => {}, removeEventListener: () => {} })) as unknown as typeof window.matchMedia
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const d = this.classList.contains('ht2-lam-o-hang') ? doHang : this.classList.contains('ht2-lam-day') ? doThanh : k(0, 0, 0, 0)
      return { x: d.left, y: d.top, width: d.right - d.left, height: d.bottom - d.top, ...d, toJSON: () => d } as DOMRect
    })
    const ra = render(<div data-khung-cuon style={{ overflowY: 'auto' }}><ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={null} /></div>)
    const khung = ra.container.querySelector('[data-khung-cuon]') as HTMLDivElement
    Object.defineProperty(khung, 'scrollHeight', { configurable: true, value: 1400 })
    Object.defineProperty(khung, 'clientHeight', { configurable: true, value: 760 })
    const cuon = vi.fn()
    khung.scrollBy = cuon as unknown as typeof khung.scrollBy
    const cuonCuaSo = vi.spyOn(window, 'scrollBy').mockImplementation(() => {})
    return { cuon, cuonCuaSo }
  }

  it('340×760: mở câu KHÔNG cuộn; bấm "2" trên bàn phím số ⇒ khung cuộn 46 px (smooth), hàng ô lên trên thanh cách 12 px', async () => {
    const { cuon, cuonCuaSo } = moMan(k(423, 481, 141, 199), k(447, 760, 0, 340))
    const phim = within(await screen.findByRole('group', { name: 'Bàn phím số' }))
    expect(cuon).not.toHaveBeenCalled()
    fireEvent.click(phim.getByRole('button', { name: '2' }))
    expect(cuon).toHaveBeenCalledTimes(1)
    expect(cuon).toHaveBeenCalledWith({ top: 46, behavior: 'smooth' })
    expect(cuonCuaSo).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /^Nộp câu · 2$/ })).toBeTruthy()
  })
  it('phím máy tính cùng hành vi; em giảm chuyển động ⇒ cuộn tức thì (auto)', async () => {
    const { cuon } = moMan(k(423, 481, 141, 199), k(447, 760, 0, 340), true)
    await screen.findByRole('group', { name: 'Bàn phím số' })
    fireEvent.keyDown(window, { key: '2' })
    expect(cuon).toHaveBeenCalledWith({ top: 46, behavior: 'auto' })
    expect(screen.getByRole('button', { name: /^Nộp câu · 2$/ })).toBeTruthy()
  })
  it('hàng ô đã thấy trọn ⇒ bấm phím không cuộn', async () => {
    const { cuon, cuonCuaSo } = moMan(k(300, 358, 141, 199), k(447, 760, 0, 340))
    const phim = within(await screen.findByRole('group', { name: 'Bàn phím số' }))
    fireEvent.click(phim.getByRole('button', { name: '2' })); fireEvent.click(phim.getByRole('button', { name: '4' }))
    fireEvent.keyDown(window, { key: 'Backspace' })
    expect(cuon).not.toHaveBeenCalled(); expect(cuonCuaSo).not.toHaveBeenCalled()
  })
  it('màn rộng (thanh đáy là cột phải): bấm phím không cuộn', async () => {
    const { cuon, cuonCuaSo } = moMan(k(520, 578, 300, 600), k(100, 640, 820, 1220))
    const phim = within(await screen.findByRole('group', { name: 'Bàn phím số' }))
    fireEvent.click(phim.getByRole('button', { name: '2' }))
    fireEvent.keyDown(window, { key: '4' })
    expect(cuon).not.toHaveBeenCalled(); expect(cuonCuaSo).not.toHaveBeenCalled()
  })
  it('máy tính 1280 (bố cục rộng thật): hàng ô nằm TRONG cột phải ⇒ không cuộn dù số đo chồng nhau', async () => {
    const { cuon, cuonCuaSo } = moMan(k(300, 358, 900, 1180), k(100, 640, 860, 1220), false, true)
    const phim = within(await screen.findByRole('group', { name: 'Bàn phím số' }))
    expect(document.querySelector('.ht2-lam-day .ht2-lam-o-hang')).toBeTruthy()
    fireEvent.click(phim.getByRole('button', { name: '2' }))
    fireEvent.keyDown(window, { key: '4' })
    expect(cuon).not.toHaveBeenCalled(); expect(cuonCuaSo).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /^Nộp câu · 24$/ })).toBeTruthy()
  })
})
