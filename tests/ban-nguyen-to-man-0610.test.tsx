// Màn chờ KHÔNG được phụ thuộc game: game lỗi tải thì vẫn có dự phòng và dòng chờ Thầy.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'

afterEach(() => { cleanup(); vi.resetModules(); vi.restoreAllMocks() })

describe('PhongChoGame với game Bắn nguyên tố', () => {
  it('hiện game, dòng chờ Thầy và lời nhắn điểm chơi', async () => {
    const { default: PhongChoGame } = await import('../src/components/PhongChoGame')
    const a = render(<PhongChoGame />)
    expect(await a.findByRole('heading', { name: 'Bắn nguyên tố' })).toBeTruthy()
    const chu = a.container.textContent || ''
    for (const s of ['Đang chờ Thầy bấm bắt đầu', 'Điểm chơi chỉ để vui trong lúc chờ.', 'Sẵn sàng?', 'Chơi']) expect(chu, s).toContain(s)
    expect(a.getByLabelText('Dời tàu sang trái').getAttribute('type')).toBe('button')
  })
  it('thiếu Canvas thì hiện ô dự phòng, màn chờ vẫn nguyên', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const { default: PhongChoGame } = await import('../src/components/PhongChoGame')
    const a = render(<PhongChoGame />)
    expect(await a.findByText('Một chút thư giãn trước giờ học')).toBeTruthy()
    expect(a.container.textContent).toContain('Đang chờ Thầy bấm bắt đầu')
  })
  it('mảnh game lỗi tải thì thay bằng dự phòng, không kéo sập màn chờ', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.doMock('../src/components/phong-cho/BanNguyenTo', () => ({ default: () => { throw new Error('lỗi tải') } }))
    const { default: PhongChoGame } = await import('../src/components/PhongChoGame')
    const a = render(<PhongChoGame />)
    expect(await a.findByText(/Mini-game chưa tải được/)).toBeTruthy()
    expect(a.container.textContent).toContain('Đang chờ Thầy bấm bắt đầu')
    vi.doUnmock('../src/components/phong-cho/BanNguyenTo')
  })
})
