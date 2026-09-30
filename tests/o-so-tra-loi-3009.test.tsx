// Ô TRẢ LỜI SỐ `OSoTraLoi` (thầy 30/09, ảnh iPhone: câu "số oxi hoá của N trong ammonia", đáp án -3, em trả lời "3"):
// hai nút "±" (đổi dấu âm) và "," (dấu phẩy thập phân) NẰM TRONG ô, mép phải, ở MỌI máy — không còn đoán máy theo userAgent.
// jsdom: hành vi + chuỗi gửi đi; TheCau (luồng thi thật) ở mọi máy; khoá nguồn: mọi màn có ô đáp số dùng thành phần này.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import fs from 'node:fs'
import path from 'node:path'
import OSoTraLoi, { guiSo, hienThiSo } from '../src/components/OSoTraLoi'
import TheCau from '../src/components/TheCau'

afterEach(() => { cleanup(); vi.restoreAllMocks() })

/** Cha giữ trạng thái như mọi nơi dùng; `#gui` là CHUỖI GỬI ĐI (giá trị cha giữ), ô chỉ là phần hiển thị. */
function Cha({ dau = '', ...rest }: { dau?: string } & Partial<React.ComponentProps<typeof OSoTraLoi>>) {
  const [v, setV] = useState(dau)
  return <div><OSoTraLoi id="o" value={v} onChange={setV} ariaLabel="Đáp số" {...rest} /><output id="gui">{v}</output></div>
}
const o = () => screen.getByLabelText('Đáp số') as HTMLInputElement
const gui = () => document.getElementById('gui')!.textContent
const nutDau = () => screen.getByRole('button', { name: 'Đổi dấu âm' }) as HTMLButtonElement
const nutPhay = () => screen.getByRole('button', { name: 'Thêm dấu phẩy' }) as HTMLButtonElement
const go = (v: string) => fireEvent.change(o(), { target: { value: v } })

describe('OSoTraLoi — hành vi', () => {
  it('bàn phím số (inputMode decimal); hai nút "±" và "," NẰM TRONG khối ô, sau ô nhập; nhãn aria đúng', () => {
    const { container } = render(<Cha />)
    expect(o().getAttribute('inputmode')).toBe('decimal')
    expect(o().type).toBe('text')
    expect(nutDau().textContent).toBe('±')
    expect(nutPhay().textContent).toBe(',')
    const khoi = container.querySelector('.osl')!
    expect(khoi.contains(nutDau()) && khoi.contains(nutPhay())).toBe(true)
    expect(o().compareDocumentPosition(nutDau()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    for (const b of [nutDau(), nutPhay()]) expect(b.type).toBe('button')
  })
  it('đổi dấu: 3 → -3 → 3; gửi dấu trừ ASCII "-", ô HIỂN THỊ "−"; aria-pressed theo dấu', () => {
    render(<Cha dau="3" />)
    expect(nutDau().getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(nutDau())
    expect(gui()).toBe('-3')
    expect(o().value).toBe('−3')
    expect(nutDau().getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(nutDau())
    expect(gui()).toBe('3')
    expect(o().value).toBe('3')
  })
  it('"-0,5": ô trống → ± → gõ 0 → , → gõ 5 ⇒ gửi "-0,5"; bấm ± lần nữa ⇒ "0,5"', () => {
    render(<Cha />)
    fireEvent.click(nutDau())
    expect(gui()).toBe('-')
    go('−0') // ô đang hiện "−", em gõ thêm 0
    expect(gui()).toBe('-0')
    fireEvent.click(nutPhay())
    expect(gui()).toBe('-0,')
    go('−0,5')
    expect(gui()).toBe('-0,5')
    expect(o().value).toBe('−0,5')
    expect(nutPhay().disabled).toBe(true) // đã có dấu thập phân
    fireEvent.click(nutDau())
    expect(gui()).toBe('0,5')
  })
  it('"," chèn TẠI CON TRỎ khi ô có tiêu điểm, con trỏ đứng sau dấu', () => {
    render(<Cha dau="15" />)
    o().focus()
    o().setSelectionRange(1, 1)
    fireEvent.click(nutPhay())
    expect(gui()).toBe('1,5')
    expect(o().selectionStart).toBe(2)
    expect(o().selectionEnd).toBe(2)
  })
  it('"," với số âm: con trỏ giữa "−125" ⇒ "-1,25" (hiển thị "−" không làm lệch con trỏ)', () => {
    render(<Cha dau="-125" />)
    o().focus()
    o().setSelectionRange(2, 2)
    fireEvent.click(nutPhay())
    expect(gui()).toBe('-1,25')
    expect(o().selectionStart).toBe(3)
  })
  it('KHÔNG chèn hai dấu phẩy: đã có "," hoặc "." ⇒ nút khoá, bấm cũng không đổi', () => {
    render(<Cha dau="1,5" />)
    expect(nutPhay().disabled).toBe(true)
    fireEvent.click(nutPhay())
    expect(gui()).toBe('1,5')
    cleanup()
    render(<Cha dau="0.54" />)
    expect(nutPhay().disabled).toBe(true)
  })
  it('"±" khi con trỏ ở giữa: dấu vào ĐẦU số, con trỏ đứng cùng chữ số cũ', () => {
    render(<Cha dau="153" />)
    o().focus()
    o().setSelectionRange(2, 2)
    fireEvent.click(nutDau())
    expect(gui()).toBe('-153')
    expect(o().selectionStart).toBe(3)
  })
  it('KHÔNG mất tiêu điểm: pointerdown/mousedown trên hai nút bị preventDefault; ô vẫn giữ tiêu điểm sau khi bấm', () => {
    render(<Cha dau="15" />)
    o().focus()
    for (const nut of [nutDau(), nutPhay()]) {
      const pd = new Event('pointerdown', { bubbles: true, cancelable: true })
      const md = new Event('mousedown', { bubbles: true, cancelable: true })
      nut.dispatchEvent(pd)
      nut.dispatchEvent(md)
      expect(pd.defaultPrevented && md.defaultPrevented).toBe(true)
    }
    fireEvent.click(nutPhay())
    expect(document.activeElement).toBe(o())
    fireEvent.click(nutDau())
    expect(document.activeElement).toBe(o())
  })
  it('ô KHÔNG có tiêu điểm ⇒ "," chèn ở CUỐI và không tự giành tiêu điểm', () => {
    render(<Cha dau="15" />)
    o().blur()
    fireEvent.click(nutPhay())
    expect(gui()).toBe('15,')
    expect(document.activeElement).not.toBe(o())
  })
  it('không chặn bàn phím máy tính: gõ gì gửi nấy (chỉ dấu "−" ĐẦU số về "-")', () => {
    const doi = vi.fn()
    render(<OSoTraLoi value="" onChange={doi} ariaLabel="Đáp số" />)
    for (const [v, mong] of [['5 mol', '5 mol'], ['1,,5', '1,,5'], ['-3', '-3'], ['0.54', '0.54'], ['−5', '-5'], ['1e-3', '1e-3'], ['abc', 'abc']]) {
      fireEvent.change(o(), { target: { value: v } })
      expect(doi).toHaveBeenLastCalledWith(mong)
    }
  })
  it('chuanViet (màn thi): "." ⇒ ",", mọi gạch Unicode ⇒ "-", một dấu thập phân', () => {
    const doi = vi.fn()
    render(<OSoTraLoi value="" onChange={doi} ariaLabel="Đáp số" chuanViet />)
    for (const [v, mong] of [['-0.5', '-0,5'], ['−7', '-7'], ['12.3', '12,3'], ['1,2,3', '1,23']]) {
      fireEvent.change(o(), { target: { value: v } })
      expect(doi).toHaveBeenLastCalledWith(mong)
    }
  })
  it('maxLength: hết chỗ ⇒ "," khoá, "±" (thêm) không đổi; bỏ dấu luôn được', () => {
    render(<Cha dau="12345" maxLength={5} />)
    expect(nutPhay().disabled).toBe(true)
    fireEvent.click(nutDau())
    expect(gui()).toBe('12345')
  })
  it('khoá (disabled / đã chấm): khoá ô lẫn hai nút; bấm không gọi onChange', () => {
    const doi = vi.fn()
    render(<OSoTraLoi value="5" onChange={doi} disabled ariaLabel="Đáp số" />)
    expect(o().disabled && nutDau().disabled && nutPhay().disabled).toBe(true)
    fireEvent.click(nutDau())
    fireEvent.click(nutPhay())
    expect(doi).not.toHaveBeenCalled()
  })
  it('không tự gọi onChange khi vẽ / lấy / mất tiêu điểm', () => {
    const doi = vi.fn()
    render(<OSoTraLoi value="-3" onChange={doi} ariaLabel="Đáp số" />)
    o().focus()
    o().blur()
    expect(doi).not.toHaveBeenCalled()
  })
  it('bấm chữ nhãn <label> KHÔNG kích nút (nút không nằm trong label)', () => {
    render(<div><label htmlFor="o">Đáp án</label><Cha /></div>)
    fireEvent.click(screen.getByText('Đáp án'))
    expect(gui()).toBe('')
  })
  it('hienThiSo / guiSo: chỉ đổi dấu ĐẦU số, giữ độ dài', () => {
    for (const [a, b] of [['-3', '−3'], ['  -3', '  −3'], ['3', '3'], ['C2H5-OH', 'C2H5-OH'], ['', '']]) {
      expect(hienThiSo(a)).toBe(b)
      expect(hienThiSo(a).length).toBe(a.length)
      expect(guiSo(b)).toBe(a)
    }
  })
})

describe('TheCau (luồng thi thật, cũng là Đảo / Đảo 2 / Bi-a / Tu luyện / Luyện đề) — hai nút ở MỌI máy', () => {
  const UA = {
    iPhone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    'iPad giả Mac': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
    Android: 'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36',
    'máy tính': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  }
  for (const [ten, ua] of Object.entries(UA))
    it(`${ten}: có "±" và "," trong ô; bấm "±" với "3" ⇒ onChange("-3")`, () => {
      vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ua)
      const doi = vi.fn()
      const { container } = render(<TheCau kieu="sa" id="c1" stt={1} text="Số oxi hoá của N trong ammonia" selected="3" onChange={doi} />)
      const khoi = container.querySelector('.osl')!
      expect(khoi.querySelector('input')!.getAttribute('inputmode')).toBe('decimal')
      expect(khoi.querySelector('[aria-label="Đổi dấu âm"]')).toBeTruthy()
      expect(khoi.querySelector('[aria-label="Thêm dấu phẩy"]')).toBeTruthy()
      fireEvent.click(khoi.querySelector('[aria-label="Đổi dấu âm"]')!)
      expect(doi).toHaveBeenLastCalledWith('-3')
    })
  it('khoaO ⇒ ô và hai nút khoá', () => {
    const { container } = render(<TheCau kieu="sa" id="c1" stt={1} text="x" selected="3" khoaO onChange={() => {}} />)
    expect([...container.querySelectorAll('.osl input, .osl button')].every((e) => (e as HTMLInputElement).disabled)).toBe(true)
  })
  it('xem lại (đã chấm): không có ô nhập nên không có nút', () => {
    const { container } = render(<TheCau kieu="sa" id="c1" stt={1} text="x" selected="-3" correct="-3" cheDo="xem_lai" onChange={() => {}} />)
    expect(container.querySelector('.osl')).toBeNull()
  })
})

describe('khoá nguồn: mọi màn có ô đáp số dùng OSoTraLoi', () => {
  const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
  it('các nơi dựng ô đáp số nhập và dựng <OSoTraLoi>', () => {
    const NOI = [
      'src/components/TheCau.tsx', // màn thi dọc, Đảo, Đảo 2, Bi-a (TraLoiCau + câu trong ván), Tu luyện, Luyện đề cấu trúc
      'src/screens/ExamTakeScreen.tsx', // màn thi ngang (LamBaiNgangGon nhận ô qua oDapSo)
      'src/game/than-thu-v2/DoanCau.tsx', // Đoàn Hộ Tống
      'src/components/bang-nhiem-vu/LamCauOn.tsx', // ôn câu (BTVN / lịch ôn)
      'src/components/bang-nhiem-vu/MomM3.tsx', // bài Mẹ giao (M3)
      'src/screens/StudentPortalScreen.tsx', // cổng học sinh (bài Mẹ giao cũ)
    ]
    for (const n of NOI) {
      const s = doc(n)
      expect(s, n).toMatch(/import OSoTraLoi from/)
      expect(s, n).toMatch(/<OSoTraLoi[\s\n]/)
    }
  })
  it('các màn game / tu luyện / bi-a đi qua TheCau (không tự dựng ô số riêng)', () => {
    for (const n of ['src/game/than-thu-v2/dao/ThamHiem.tsx', 'src/game/than-thu-v2/EscortQuestion.tsx', 'src/game/than-thu-v2/dao2/TrongAi.tsx', 'src/components/tu-luyen/ManTuLuyen.tsx']) {
      expect(doc(n), n).toMatch(/import TheCau from/)
    }
    for (const n of ['src/game/bi-a/TraLoiCau.tsx', 'src/game/bi-a/TamCauBia.tsx']) expect(doc(n), n).toMatch(/TheCauAi/)
    expect(doc('src/game/than-thu-v2/dao2/TrongAi.tsx')).toMatch(/phan:'III',selected:traLoi,khoaO:khoa/)
  })
  it('thành phần cũ ONhapDapSo đã gỡ; không còn lớp .ond ở CSS/TSX', () => {
    expect(fs.existsSync(path.join(process.cwd(), 'src/components/ONhapDapSo.tsx'))).toBe(false)
    const s = ['src/screens/lam-bai-ngang.css', 'src/game/than-thu-v2/doan.css', 'src/components/bang-nhiem-vu/lam-cau-on.css', 'src/components/bang-nhiem-vu/mom-m3.css', 'src/screens/LamBaiNgangGon.tsx'].map(doc).join('\n')
    expect(s).not.toMatch(/\.ond\b|--ond-/)
  })
  it('nút giữ tiêu điểm (onPointerDown + onMouseDown preventDefault), type=button; CSS không hex, không lookbehind', () => {
    const tsx = doc('src/components/OSoTraLoi.tsx')
    expect(tsx.match(/onPointerDown=\{giuTieuDiem\}/g)).toHaveLength(2)
    expect(tsx.match(/onMouseDown=\{giuTieuDiem\}/g)).toHaveLength(2)
    expect(tsx).not.toMatch(/\(\?<[=!]/)
    expect(doc('src/components/o-so-tra-loi.css')).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })
})
