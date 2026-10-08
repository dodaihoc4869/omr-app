// ĐẢO THẦN THÚ V2 · màn 1 "Chọn bạn đồng hành": thấy đủ Bát Linh, một chạm là chọn,
// tên được chuẩn hoá TRƯỚC khi gọi máy chủ và toàn bộ tranh đều là bản nhẹ.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import ChonBanDongHanh, { TEN_GOI_Y, theMoDau } from '../src/game/than-thu-v2/dao/ChonBanDongHanh'
import { PETS } from '../src/game/than-thu-v2/core'
import { normalizePetName } from '../src/game/than-thu-v2/pet-name'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })
const tranh = (c: HTMLElement) => [...c.querySelectorAll('img')].map(i => i.getAttribute('src'))

describe('Chọn bạn đồng hành', () => {
  it('một chạm vào nút vàng là chọn đúng thú đang ở giữa, không tên ⇒ tên rỗng', () => {
    const onChon = vi.fn()
    render(<ChonBanDongHanh batDau={2} onChon={onChon} />)
    fireEvent.click(screen.getByRole('button', { name: 'CHỌN VIÊM SƯ' }))
    expect(onChon).toHaveBeenCalledTimes(1)
    expect(onChon).toHaveBeenCalledWith('lua_phuong', '')
  })
  it('tên được chuẩn hoá như máy chủ; tên sai luật ⇒ báo lỗi, KHÔNG gọi chọn', () => {
    const onChon = vi.fn()
    render(<ChonBanDongHanh batDau={1} onChon={onChon} />)
    const o = screen.getByLabelText('Đặt tên cho thần thú')
    fireEvent.change(o, { target: { value: '  Sóng   Nhỏ ' } })
    fireEvent.click(screen.getByRole('button', { name: 'CHỌN THUỶ LONG' }))
    expect(onChon).toHaveBeenLastCalledWith('nuoc_long', 'Sóng Nhỏ')
    fireEvent.change(o, { target: { value: '@@@' } })
    fireEvent.click(screen.getByRole('button', { name: 'CHỌN THUỶ LONG' }))
    expect(onChon).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('alert').textContent).toMatch(/1–16/)
  })
  it('mọi tên gợi ý đều hợp lệ; nút gợi ý điền tên của đúng thú đang ở giữa và xoay vòng', () => {
    expect(TEN_GOI_Y.length).toBe(PETS.length)
    for (const ds of TEN_GOI_Y) for (const t of ds) expect(normalizePetName(t)).toBe(t)
    render(<ChonBanDongHanh batDau={2} onChon={() => {}} />)
    const o = screen.getByLabelText('Đặt tên cho thần thú') as HTMLInputElement
    fireEvent.click(screen.getByRole('button', { name: 'Gợi ý một cái tên' }))
    expect(o.value).toBe(TEN_GOI_Y[2]![0])
    fireEvent.click(screen.getByRole('button', { name: 'Gợi ý một cái tên' }))
    expect(o.value).toBe(TEN_GOI_Y[2]![1])
  })
  it('hiện đủ Bát Linh trong cùng đội hình; chỉ dùng ảnh nhẹ trong nho/', () => {
    const { container } = render(<ChonBanDongHanh batDau={2} onChon={() => {}} />)
    const ds = screen.getByRole('listbox', { name: 'Toàn bộ tám thần thú' })
    expect(ds.querySelectorAll('[role="option"]')).toHaveLength(8)
    expect(screen.getAllByRole('option').filter(o => o.getAttribute('aria-selected') === 'true')).toHaveLength(1)
    expect(screen.getByRole('option', { name: /Viêm Sư/ }).getAttribute('aria-selected')).toBe('true')
    expect(tranh(container)).toHaveLength(9)
    expect(tranh(container).every(s => s!.startsWith('/than-thu-v2/nho/'))).toBe(true)
  })
  it('chạm thú khác ⇒ hero, trạng thái chọn và nút vàng đổi ngay', () => {
    const { container } = render(<ChonBanDongHanh batDau={2} onChon={() => {}} />)
    fireEvent.click(screen.getByRole('option', { name: /Ái Hồ/ }))
    expect(screen.getByRole('button', { name: 'CHỌN ÁI HỒ' })).toBeTruthy()
    expect(screen.getByRole('option', { name: /Ái Hồ/ }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByAltText(/Ái Hồ, hệ/).getAttribute('src')).toContain('/than-thu-v2/nho/')
    expect(container.querySelectorAll('[data-chon]')).toHaveLength(1)
  })
  it('đang gửi ⇒ nút vàng khoá; lỗi máy chủ hiện bằng role=alert; có dòng mời khi vào từ cửa Đoàn', () => {
    render(<ChonBanDongHanh batDau={2} busy loi="Hồ sơ đã chọn thần thú." moiDoan onChon={() => {}} />)
    expect((screen.getByRole('button', { name: /ĐANG ĐÓN/ }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByRole('alert').textContent).toBe('Hồ sơ đã chọn thần thú.')
    expect(screen.getByText(/Đoàn Hộ Tống đang chờ em/)).toBeTruthy()
  })
  it('không hứa điều máy chủ không cho: chọn thú chỉ MỘT lần ⇒ màn không có chữ "đổi thần thú"', () => {
    const { container } = render(<ChonBanDongHanh onChon={() => {}} />)
    expect(container.textContent).not.toMatch(/đổi thần thú/i)
  })
  it('thẻ mở đầu theo SBD: tất định, luôn trong 1..6 (có thẻ ló hai bên)', () => {
    for (const sbd of ['12121212', '20260001', '', 'abc']) { const i = theMoDau(sbd); expect(i).toBe(theMoDau(sbd)); expect(i).toBeGreaterThanOrEqual(1); expect(i).toBeLessThanOrEqual(6) }
  })
})
