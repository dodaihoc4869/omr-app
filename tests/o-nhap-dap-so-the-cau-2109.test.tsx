// THẺ CÂU THI (TheCau) dùng ONhapDapSo — ĐÂY LÀ LUỒNG THI THẬT (ExamTakeScreen dựng TheCau) nên khoá kỹ: bố cục cũ (− , rồi ô), nhãn cũ, và GÓI GỬI LÊN không đổi một byte ngoài giá trị ô.
// So với bản cũ (chép nguyên hai hàm cũ dưới đây làm CHUẨN): với mọi giá trị đang có, bấm "−" gọi onChange đúng chuỗi cũ `doiDau`, bấm "," gọi đúng `themPhay` (hoặc khoá như cũ khi đã có dấu thập phân); gõ tay gọi đúng `e.target.value`.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import TheCau from '../src/components/TheCau'
import { chuanDauGo } from '../src/lib/nhap-dap-so'

afterEach(cleanup)

// ── CHUẨN: hai hàm của bản TheCau trước 21/09 (chép nguyên) ──
const cuLaAm = (v: string | null | undefined) => String(v ?? '').trimStart().startsWith('-')
const cuDoiDau = (v: string) => {
  const s = String(v ?? '')
  const dau = s.match(/^\s*/)?.[0] ?? ''
  const than = s.slice(dau.length)
  return than.startsWith('-') ? dau + than.slice(1) : dau + '-' + than
}

const GIA_TRI = ['', '5', '-5', '12,5', '-12,5', '0.54', ' 92,4', ' -92,4', '-', ',', '5 mol', '1,,5', '--3', '−5']
const theCau = (selected: string, onChange = vi.fn()) => {
  const r = render(<TheCau kieu="sa" id="c1" stt={1} text="Tính ΔH" selected={selected} onChange={onChange} />)
  return { ...r, doi: onChange }
}

// 28/09 (thầy): "Bỏ nút xoá ở ô điền đáp án, nếu dấu phẩy và dấu âm đã có trong bàn phím ảo nảy lên thì bỏ luôn cho đẹp."
// ⇒ Ô gọn: KHÔNG nút "," và KHÔNG nút xoá ở mọi máy; nút "−" nhỏ NẰM TRONG ô, CHỈ ở iPhone/iPad (bàn phím thập phân iOS thiếu dấu trừ).
const UA_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const UA_IPAD_GIA_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15'
const UA_ANDROID = 'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36'
const UA_MAY_TINH = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const giaMay = (ua: string, cham = 0) => {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ua)
  // jsdom không có `maxTouchPoints` ⇒ định nghĩa thẳng (có thể ghi đè lại).
  Object.defineProperty(navigator, 'maxTouchPoints', { value: cham, configurable: true })
}
afterEach(() => vi.restoreAllMocks())

describe('ô gọn theo máy', () => {
  it('iPhone ⇒ chỉ có nút "−" (nằm trong ô, sau ô nhập); không "," không nút xoá; bàn phím số', () => {
    giaMay(UA_IPHONE, 5)
    const { container } = theCau('')
    const khoi = container.querySelector('.ond')!
    const nut = [...khoi.querySelectorAll('button')]
    expect(nut.map((b) => b.textContent)).toEqual(['−'])
    expect(nut[0].classList.contains('ond-nut-trong')).toBe(true)
    expect(khoi.firstElementChild!.tagName).toBe('INPUT')
    expect(khoi.hasAttribute('data-co-nut-am')).toBe(true)
    const o = container.querySelector('input')!
    expect(o.getAttribute('placeholder')).toBe('Nhập đáp án')
    expect(o.getAttribute('inputmode')).toBe('decimal')
  })
  it('iPad khai "Macintosh" (maxTouchPoints > 1) ⇒ vẫn có nút "−"; Mac thật (0 điểm chạm) ⇒ không', () => {
    giaMay(UA_IPAD_GIA_MAC, 5)
    expect(theCau('').container.querySelectorAll('.ond button')).toHaveLength(1)
    cleanup()
    giaMay(UA_IPAD_GIA_MAC, 0)
    expect(theCau('').container.querySelectorAll('.ond button')).toHaveLength(0)
  })
  it('Android (bàn phím số decimal có "-") và máy tính ⇒ KHÔNG nút nào', () => {
    for (const [ua, cham] of [[UA_ANDROID, 5], [UA_MAY_TINH, 0]] as const) {
      giaMay(ua, cham)
      const { container } = theCau('12,5')
      expect(container.querySelectorAll('.ond button')).toHaveLength(0)
      expect(container.querySelector('.ond')!.hasAttribute('data-co-nut-am')).toBe(false)
      cleanup()
    }
  })
})

describe('GÓI GỬI LÊN: "−" đổi dấu như cũ; gõ tay chỉ chuẩn dấu Việt', () => {
  it('iPhone: bấm "−" ⇒ onChange(doiDau cũ) với mọi giá trị; nhãn Thêm/Bỏ dấu âm theo giá trị', () => {
    giaMay(UA_IPHONE, 5)
    for (const v of GIA_TRI) {
      const { container, doi } = theCau(v)
      const nut = container.querySelector('button[aria-label$="dấu âm"]')!
      expect(nut.getAttribute('aria-label')).toBe(cuLaAm(v) ? 'Bỏ dấu âm' : 'Thêm dấu âm')
      fireEvent.click(nut)
      const mong = cuDoiDau(v)
      if (mong === v) expect(doi).not.toHaveBeenCalled()
      else expect(doi, JSON.stringify(v)).toHaveBeenCalledExactlyOnceWith(mong)
      cleanup()
    }
  })
  // Hàm chấm vốn coi hai dạng như nhau (tests/lam-bai-ngang-2809.test.tsx chứng minh) ⇒ không đổi điểm.
  it('gõ tay (máy tính/Android gõ "-" và "." trực tiếp) ⇒ onChange chuỗi đã chuẩn: "." ⇒ ",", "−" ⇒ "-", không lọc gì khác', () => {
    for (const [v, mong] of [['12,5', '12,5'], ['-3', '-3'], ['-0.5', '-0,5'], ['5 mol', '5 mol'], ['0.54', '0,54'], ['−7', '-7'], ['abc', 'abc'], ['', '']]) {
      const { container, doi } = theCau('x')
      const o = container.querySelector('input') as HTMLInputElement
      fireEvent.change(o, { target: { value: v } })
      expect(doi).toHaveBeenLastCalledWith(mong)
      expect(chuanDauGo(v)).toBe(mong)
      cleanup()
    }
  })
  it('KHÔNG tự gọi onChange khi vẽ hoặc khi lấy/mất tiêu điểm', () => {
    giaMay(UA_IPHONE, 5)
    const { container, doi } = theCau('12,5')
    const o = container.querySelector('input') as HTMLInputElement
    o.focus()
    o.blur()
    expect(doi).not.toHaveBeenCalled()
  })
  it('nút "−" KHÔNG lấy tiêu điểm khỏi ô (pointerdown/mousedown bị chặn) — bàn phím điện thoại không đóng', () => {
    giaMay(UA_IPHONE, 5)
    const { container } = theCau('15')
    const o = container.querySelector('input') as HTMLInputElement
    o.focus()
    const nut = container.querySelector('.ond-nut')!
    const pd = new Event('pointerdown', { bubbles: true, cancelable: true })
    const md = new Event('mousedown', { bubbles: true, cancelable: true })
    nut.dispatchEvent(pd)
    nut.dispatchEvent(md)
    expect(pd.defaultPrevented && md.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(o)
  })
})

describe('chế độ xem lại / không có ô nhập', () => {
  it('xem lại (đã nộp): không có ô nhập nên không có hai nút', () => {
    const { container } = render(<TheCau kieu="sa" id="c1" stt={1} text="Tính ΔH" selected="12" correct="12" cheDo="xem_lai" onChange={() => {}} />)
    expect(container.querySelector('.ond')).toBeNull()
    expect(container.querySelector('input')).toBeNull()
  })
})
