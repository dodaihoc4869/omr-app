// ĐẢO THẦN THÚ bản mới · màn 1 "Chọn bạn đồng hành": một chạm là chọn, tên được chuẩn hoá TRƯỚC khi gọi máy chủ,
// tranh Cuồng nộ chỉ nạp khi em lật thẻ, chỉ nạp tranh thẻ giữa + hai thẻ kề.
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
    const o = screen.getByLabelText('Đặt tên cho bạn ấy')
    fireEvent.change(o, { target: { value: '  Sóng   Nhỏ ' } })
    fireEvent.click(screen.getByRole('button', { name: 'CHỌN THUỶ LONG' }))
    expect(onChon).toHaveBeenLastCalledWith('nuoc_long', 'Sóng Nhỏ')
    fireEvent.change(o, { target: { value: '@@@' } })
    fireEvent.click(screen.getByRole('button', { name: 'CHỌN THUỶ LONG' }))
    expect(onChon).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('alert').textContent).toMatch(/1–24/)
  })
  it('mọi tên gợi ý đều hợp lệ; nút gợi ý điền tên của đúng thú đang ở giữa và xoay vòng', () => {
    expect(TEN_GOI_Y.length).toBe(PETS.length)
    for (const ds of TEN_GOI_Y) for (const t of ds) expect(normalizePetName(t)).toBe(t)
    render(<ChonBanDongHanh batDau={2} onChon={() => {}} />)
    const o = screen.getByLabelText('Đặt tên cho bạn ấy') as HTMLInputElement
    fireEvent.click(screen.getByRole('button', { name: 'Gợi ý một cái tên' }))
    expect(o.value).toBe(TEN_GOI_Y[2]![0])
    fireEvent.click(screen.getByRole('button', { name: 'Gợi ý một cái tên' }))
    expect(o.value).toBe(TEN_GOI_Y[2]![1])
  })
  it('chỉ nạp tranh thẻ giữa + hai thẻ kề; tranh Cuồng nộ chỉ nạp khi lật thẻ giữa; chỉ dùng ảnh nhẹ trong nho/', () => {
    const { container } = render(<ChonBanDongHanh batDau={2} onChon={() => {}} />)
    expect(tranh(container).sort()).toEqual([1, 2, 3].map(i => `/than-thu-v2/nho/the-${i}-binh-thuong.webp`))
    const giua = container.querySelector<HTMLElement>('.dao-chon-the[aria-current]')!
    fireEvent.click(giua)
    expect(giua.hasAttribute('data-lat')).toBe(true)
    expect(tranh(container)).toContain('/than-thu-v2/nho/the-2-cuong-no.webp')
    expect(giua.textContent).toContain('CUỒNG NỘ')
    fireEvent.click(giua)
    expect(giua.hasAttribute('data-lat')).toBe(false)
    expect(tranh(container).every(s => s!.startsWith('/than-thu-v2/nho/'))).toBe(true)
  })
  it('vuốt sang thẻ khác ⇒ nút vàng đổi tên thú, thẻ lật trở về mặt thường, tranh thẻ mới được nạp', () => {
    // KHÔNG đợi giờ thật: khung hình chạy ngay trong lúc bắn sự kiện cuộn (máy tải nặng thì rAF + waitFor 1 giây từng đỏ oan)
    vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => { f(0); return 0 })
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const { container } = render(<ChonBanDongHanh batDau={2} onChon={() => {}} />)
    const bang = container.querySelector<HTMLElement>('.dao-chon-bang')!
    fireEvent.click(container.querySelector<HTMLElement>('.dao-chon-the[aria-current]')!)
    // jsdom không có bố cục: bước = 1 px ⇒ scrollLeft = số thứ tự thẻ
    bang.scrollLeft = 5
    fireEvent.scroll(bang)
    expect(screen.getByRole('button', { name: 'CHỌN ÁI HỒ' })).toBeTruthy()
    expect(container.querySelector('[data-lat]')).toBeNull()
    expect(tranh(container)).toContain('/than-thu-v2/nho/the-6-binh-thuong.webp')
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
