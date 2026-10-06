// NÚT "CHẮC / CHƯA CHẮC" màn Đoàn (thầy 06/10: "Nút chưa chắc với chắc đổi màu dễ nhìn hơn nhé, và bấm nó chưa phản hồi").
// Khoá: (1) hai nút Chắc (mặc định) / Chưa chắc, `aria-pressed` đúng; (2) hợp đồng cũ — "Chưa chắc" vẫn là `button.dh-xin[data-vung="chua-chac"]`, bấm lần nữa ⇒ tắt, `onChuaChac` chỉ gọi khi ĐỔI trạng thái;
// (3) PHẢN HỒI ngay khi bấm: bóng báo "Đã chọn: …" (role status) ~2,2 giây rồi mất, bấm lại hẹn giờ lại, rung ngắn khi máy có `navigator.vibrate`, không lỗi khi máy không có;
// (4) CSS: màu CHỈ qua biến (thẻ giấy --muc/--the/--the-2/--vien-dam, game --dh-vang/--dh-xanh), bật = nền đặc, độ ưu tiên cao hơn lớp bát-linh và bản sáng/tối của `.dh2 .dh-xin`.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import NutTuTin, { BONG_TU_TIN_MS } from '../src/game/than-thu-v2/NutTuTin'
import { BONG_CHAC, BONG_CHUA_CHAC, CHIP_CHAC, CHIP_CHUA_CHAC, GOI_Y_CHIP_CHUA_CHAC, HOI_CHAC } from '../src/lib/omni-chu'

/** Nơi gọi giả: giữ cờ `chuaChac` như `DoanHoTong` rồi đưa xuống nút. */
function NoiGoi({ dau = false, onDoi }: { dau?: boolean; onDoi: (v: boolean) => void }) {
  const [v, setV] = useState(dau)
  return <NutTuTin chuaChac={v} onChuaChac={(x) => { onDoi(x); setV(x) }} />
}
const chac = () => screen.getByRole('button', { name: CHIP_CHAC })
const chuaChac = () => screen.getByRole('button', { name: CHIP_CHUA_CHAC })
const bong = () => document.querySelector('[data-vung="tu-tin-bong"]') as HTMLElement | null

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  cleanup()
  Reflect.deleteProperty(navigator, 'vibrate')
})

describe('hai nút Chắc / Chưa chắc', () => {
  it('mặc định Chắc được chọn, Chưa chắc tắt; nhóm có câu hỏi cho đọc màn hình; "Chưa chắc" giữ lớp cũ + dấu hiệu cũ (hợp đồng chỉ-thêm)', () => {
    render(<NoiGoi onDoi={() => {}} />)
    expect(screen.getByRole('group', { name: HOI_CHAC })).toBeTruthy()
    expect(chac().getAttribute('aria-pressed')).toBe('true')
    expect(chuaChac().getAttribute('aria-pressed')).toBe('false')
    expect(chuaChac().className).toBe('dh-xin') // test cũ của màn Đoàn khoá đúng lớp này
    expect(chuaChac().getAttribute('data-vung')).toBe('chua-chac')
    expect(chuaChac().getAttribute('title')).toBe(GOI_Y_CHIP_CHUA_CHAC)
    expect(chac().getAttribute('data-vung')).toBe('chac')
    expect(bong()).toBeNull() // chưa bấm ⇒ chưa có bóng
  })

  it('bấm Chưa chắc ⇒ đổi trạng thái NGAY, gọi onChuaChac(true) một lần, bóng báo; bấm Chắc ⇒ về Chắc; bấm Chưa chắc hai lần ⇒ bật rồi tắt (như chip cũ)', () => {
    const onDoi = vi.fn()
    render(<NoiGoi onDoi={onDoi} />)
    fireEvent.click(chuaChac())
    expect(onDoi).toHaveBeenCalledTimes(1)
    expect(onDoi).toHaveBeenLastCalledWith(true)
    expect(chuaChac().getAttribute('aria-pressed')).toBe('true')
    expect(chac().getAttribute('aria-pressed')).toBe('false')
    expect(bong()?.textContent).toBe(BONG_CHUA_CHAC)
    expect(bong()?.getAttribute('role')).toBe('status')
    fireEvent.click(chac())
    expect(onDoi).toHaveBeenLastCalledWith(false)
    expect(chac().getAttribute('aria-pressed')).toBe('true')
    expect(bong()?.textContent).toBe(BONG_CHAC)
    fireEvent.click(chuaChac())
    fireEvent.click(chuaChac()) // bấm lần nữa ⇒ tắt
    expect(onDoi.mock.calls.map((c) => c[0])).toEqual([true, false, true, false])
    expect(chuaChac().getAttribute('aria-pressed')).toBe('false')
  })

  it('bấm đúng nút ĐANG chọn (Chắc khi đang Chắc) ⇒ không gọi onChuaChac (không đổi gì) nhưng VẪN có bóng báo — em thấy máy nhận lệnh', () => {
    const onDoi = vi.fn()
    render(<NoiGoi onDoi={onDoi} />)
    fireEvent.click(chac())
    expect(onDoi).not.toHaveBeenCalled()
    expect(bong()?.textContent).toBe(BONG_CHAC)
  })

  it('bóng báo mất sau 2,2 giây; bấm lại giữa chừng ⇒ hẹn giờ chạy lại từ đầu', () => {
    render(<NoiGoi onDoi={() => {}} />)
    fireEvent.click(chuaChac())
    expect(bong()).not.toBeNull()
    act(() => { vi.advanceTimersByTime(BONG_TU_TIN_MS - 200) })
    expect(bong()).not.toBeNull()
    fireEvent.click(chac()) // bấm lại ở giây 2,0 ⇒ giờ mới
    act(() => { vi.advanceTimersByTime(BONG_TU_TIN_MS - 200) })
    expect(bong()?.textContent).toBe(BONG_CHAC)
    act(() => { vi.advanceTimersByTime(300) })
    expect(bong()).toBeNull()
  })

  it('rung ngắn khi máy có navigator.vibrate (Chưa chắc hai nhịp, Chắc một nhịp); bấm nút đang chọn không rung; máy không có / bị chặn ⇒ không lỗi', () => {
    const rung = vi.fn()
    Object.defineProperty(navigator, 'vibrate', { value: rung, configurable: true, writable: true })
    render(<NoiGoi onDoi={() => {}} />)
    fireEvent.click(chuaChac())
    expect(rung).toHaveBeenLastCalledWith([14, 40, 14])
    fireEvent.click(chac())
    expect(rung).toHaveBeenLastCalledWith(10)
    rung.mockClear()
    fireEvent.click(chac()) // đang Chắc rồi
    expect(rung).not.toHaveBeenCalled()
    Object.defineProperty(navigator, 'vibrate', { value: () => { throw new Error('bị chặn') }, configurable: true, writable: true })
    expect(() => fireEvent.click(chuaChac())).not.toThrow()
    expect(chuaChac().getAttribute('aria-pressed')).toBe('true')
    Reflect.deleteProperty(navigator, 'vibrate')
    expect(() => fireEvent.click(chac())).not.toThrow()
  })

  it('đã bật Chưa chắc từ cha (câu quay lại / giữ trạng thái) ⇒ hiện đúng nút đang chọn, chưa có bóng', () => {
    render(<NoiGoi dau onDoi={() => {}} />)
    expect(chuaChac().getAttribute('aria-pressed')).toBe('true')
    expect(chac().getAttribute('aria-pressed')).toBe('false')
    expect(bong()).toBeNull()
  })
})

describe('CSS (doan2.css, dao2.css): màu dễ nhìn, chỉ qua biến', () => {
  const doc = (tep: string) => readFileSync(resolve(process.cwd(), tep), 'utf8')
  const doan = doc('src/game/than-thu-v2/doan2/doan2.css')
  const khoi = doan.slice(doan.indexOf('OMNI 3 · NÚT CHẮC / CHƯA CHẮC'))
  it('khối riêng của nút trên thẻ giấy: mực + viền, BẬT = nền đặc (Chưa chắc vàng game, Chắc / Soát lại xanh game), thắng lớp bát-linh và bản sáng/tối', () => {
    expect(khoi.length).toBeGreaterThan(500)
    expect(khoi).toMatch(/\.dh \.dh-cuoi-tin\{display:contents\}/)
    expect(khoi).toMatch(/button\.dh-xin\[type=button\]\{[^}]*background:var\(--the-2\)[^}]*color:var\(--muc\)/)
    expect(khoi).toMatch(/\[data-vung=chua-chac\]\[aria-pressed=true\]\{background:var\(--dh-vang\)[^}]*color:var\(--muc\)/)
    expect(khoi).toMatch(/:is\(\[data-vung=chac\],\[data-vung=soat-lai\]\)\[aria-pressed=true\]\{background:var\(--dh-xanh\)[^}]*color:var\(--muc\)/)
    // độ ưu tiên: `html:root … button.dh-xin[type=button]` > `html:root body[data-bat-linh] .dh2 .dh-xin` (0,4,2) và `:root:not([…]) .dh2 .dh-xin` (0,4,0)
    expect(khoi).toMatch(/html:root \.dh \.dh-cuoi-tin button\.dh-xin\[type=button\]/)
    expect(khoi).toMatch(/\.dh-chac-bong\{[^}]*pointer-events:none/) // bóng không chặn chạm vào phương án bên dưới
    expect(khoi).toMatch(/prefers-reduced-motion:reduce/)
  })
  it('khối mới KHÔNG có màu thô (rgb/rgba/hex/tên màu): đúng luật kiem:mau-giu — chỉ biến + color-mix', () => {
    expect(khoi).not.toMatch(/rgba?\(|hsla?\(|#[0-9a-fA-F]{3,8}\b/)
    expect(khoi).toMatch(/color-mix\(in srgb,var\(--dh-vang\)/)
  })
  it('lớp cũ `.dh2 .dh-xin` (nút "Cần tiếp sức" trên nền tối) KHÔNG đổi', () => {
    expect(doan).toMatch(/\.dh2 \.dh-xin\{background:rgba\(255,92,138,\.14\);box-shadow:inset 0 0 0 1px rgba\(255,179,200,\.55\);color:rgb\(255,208,220\);min-height:44px\}/)
  })
  it('Đảo: công tắc "Chưa chắc" BẬT ⇒ hổ phách (khác "Trợ giúp" ngọc), nút gạt hổ phách, bấm xuống thu nhỏ; chỉ biến --d2-*', () => {
    const dao = doc('src/game/than-thu-v2/dao2/dao2.css')
    const k = dao.slice(dao.indexOf('OMNI 3 · công tắc "Chưa chắc"'))
    expect(k).toMatch(/\[data-khoi="chua-chac"\]\[data-bat\]\{background:color-mix\(in srgb,var\(--d2-cam\) 22%,transparent\);box-shadow:inset 0 0 0 2px var\(--d2-cam\);color:var\(--d2-am-chu\)\}/)
    expect(k).toMatch(/\.dao2-tro-gat:checked\{background:var\(--d2-vang-chu\)\}/)
    expect(k).toMatch(/\[data-khoi="chua-chac"\]:active\{transform:scale\(\.96\)\}/)
    expect(k).not.toMatch(/rgba?\(|#[0-9a-fA-F]{3,8}\b/)
  })
})
