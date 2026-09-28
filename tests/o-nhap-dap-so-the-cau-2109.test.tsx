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
const cuCoPhay = (v: string | null | undefined) => { const s = String(v ?? ''); return s.includes(',') || s.includes('.') }
const cuThemPhay = (v: string) => { const s = String(v ?? ''); return s.includes(',') || s.includes('.') ? s : s + ',' }

const GIA_TRI = ['', '5', '-5', '12,5', '-12,5', '0.54', ' 92,4', ' -92,4', '-', ',', '5 mol', '1,,5', '--3', '−5']
const theCau = (selected: string, onChange = vi.fn()) => {
  const r = render(<TheCau kieu="sa" id="c1" stt={1} text="Tính ΔH" selected={selected} onChange={onChange} />)
  return { ...r, doi: onChange }
}

describe('bố cục + nhãn cũ giữ nguyên', () => {
  it('thứ tự trong khối: "−", ",", rồi ô nhập (như cũ), rồi "⌫" (thêm 28/09); placeholder "Nhập đáp án"; bàn phím số; aria-label cũ', () => {
    const { container } = theCau('')
    const khoi = container.querySelector('.ond')!
    const [a, b, c, d] = [...khoi.children]
    expect(a!.tagName).toBe('BUTTON')
    expect(a!.getAttribute('aria-label')).toBe('Thêm dấu âm')
    expect(a!.textContent).toBe('−')
    expect(b!.tagName).toBe('BUTTON')
    expect(b!.getAttribute('aria-label')).toBe('Thêm dấu phẩy')
    expect(b!.textContent).toBe(',')
    expect(c!.tagName).toBe('INPUT')
    expect(c!.getAttribute('placeholder')).toBe('Nhập đáp án')
    expect(c!.getAttribute('inputmode')).toBe('decimal')
    expect(d!.tagName).toBe('BUTTON')
    expect(d!.getAttribute('aria-label')).toBe('Xoá một ký tự')
    expect(khoi.children).toHaveLength(4)
  })
  it('nhãn nút "−" đổi Thêm/Bỏ dấu âm theo giá trị như cũ; nút có lớp tap-target; ô có lớp tap-target', () => {
    for (const v of GIA_TRI) {
      const { container } = theCau(v)
      expect(container.querySelector('button[aria-label$="dấu âm"]')!.getAttribute('aria-label')).toBe(cuLaAm(v) ? 'Bỏ dấu âm' : 'Thêm dấu âm')
      cleanup()
    }
    const { container } = theCau('')
    for (const e of container.querySelectorAll('.ond > *')) expect(e.classList.contains('tap-target')).toBe(true)
  })
})

describe('GÓI GỬI LÊN không đổi: onChange nhận đúng chuỗi của bản cũ', () => {
  it('bấm "−" ⇒ onChange(doiDau cũ) với mọi giá trị', () => {
    for (const v of GIA_TRI) {
      const { container, doi } = theCau(v)
      fireEvent.click(container.querySelector('button[aria-label$="dấu âm"]')!)
      const mong = cuDoiDau(v)
      if (mong === v) expect(doi).not.toHaveBeenCalled()
      else expect(doi, JSON.stringify(v)).toHaveBeenCalledExactlyOnceWith(mong)
      cleanup()
    }
  })
  it('bấm "," ⇒ onChange(themPhay cũ); đã có dấu thập phân ⇒ nút khoá như cũ và KHÔNG gọi onChange', () => {
    for (const v of GIA_TRI) {
      const { container, doi } = theCau(v)
      const nut = container.querySelector('button[aria-label="Thêm dấu phẩy"]') as HTMLButtonElement
      expect(nut.disabled, JSON.stringify(v)).toBe(cuCoPhay(v))
      fireEvent.click(nut)
      if (cuCoPhay(v)) expect(doi).not.toHaveBeenCalled()
      else expect(doi, JSON.stringify(v)).toHaveBeenCalledExactlyOnceWith(cuThemPhay(v))
      cleanup()
    }
  })
  // 28/09 (thầy, ảnh phiếu Phần III có "12.3"): màn thi đổi "." ⇒ "," và dấu trừ Unicode ⇒ "-" ngay khi gõ; ngoài ra không lọc gì.
  // Hàm chấm vốn coi hai dạng như nhau (tests/lam-bai-ngang-2809.test.tsx chứng minh) ⇒ không đổi điểm.
  it('gõ tay ⇒ onChange đúng chuỗi trong ô, chỉ chuẩn dấu Việt ("." ⇒ ",", "−" ⇒ "-"), không lọc gì khác', () => {
    for (const [v, mong] of [['12,5', '12,5'], ['-3', '-3'], ['5 mol', '5 mol'], ['0.54', '0,54'], ['−7', '-7'], ['abc', 'abc'], ['', '']]) {
      const { container, doi } = theCau('x')
      const o = container.querySelector('input') as HTMLInputElement
      fireEvent.change(o, { target: { value: v } })
      expect(doi).toHaveBeenLastCalledWith(mong)
      expect(chuanDauGo(v)).toBe(mong)
      cleanup()
    }
  })
  it('KHÔNG có nút nào tự gọi onChange khi vẽ hoặc khi lấy/mất tiêu điểm', () => {
    const { container, doi } = theCau('12,5')
    const o = container.querySelector('input') as HTMLInputElement
    o.focus()
    o.blur()
    expect(doi).not.toHaveBeenCalled()
  })
  it('KHÔNG lấy tiêu điểm khỏi ô khi bấm nút (pointerdown/mousedown bị chặn) — bàn phím điện thoại không đóng giữa lúc làm bài', () => {
    const { container } = theCau('15')
    const o = container.querySelector('input') as HTMLInputElement
    o.focus()
    for (const nut of container.querySelectorAll('.ond-nut')) {
      const pd = new Event('pointerdown', { bubbles: true, cancelable: true })
      const md = new Event('mousedown', { bubbles: true, cancelable: true })
      nut.dispatchEvent(pd)
      nut.dispatchEvent(md)
      expect(pd.defaultPrevented && md.defaultPrevented).toBe(true)
    }
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
