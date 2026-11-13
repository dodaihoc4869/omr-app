// SINH TỒN ĐỢT 4 · MÀN (jsdom): thẻ sảnh phòng chờ ca nạp dữ liệu LƯỜI sau khi hiện (lượt vẽ đầu vẫn MỘT nút «Chơi», 0 mạng), rồi hiện đội cả kỳ + danh hiệu +
// thi đua tuần + nút «Tủ đồ»; thầy bắt đầu trước khi nạp xong ⇒ không đọc. Tủ đồ: ô khoá có dòng tiến độ, bấm ô khoá không chọn được; «Mặc đồ đã chọn» gửi bộ đồ.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MAC_TRONG } from '../src/lib/live-khoi/tu-do'
import type { DuLieuTuDo } from '../src/components/phong-cho/tu-do-api'

const api = vi.hoisted(() => ({ tai: 0, mac: [] as unknown[] }))
const DU: DuLieuTuDo = {
  cap: 14, chuoi: 12, mo: ['mu-tot-nghiep', 'tai-nghe', 'ao-ke-o-li'], mac: { ...MAC_TRONG, mu: 'mu-tot-nghiep' },
  thanhTich: { ha: 52, chuoiMax: 4, thuKhoa: 1, haThay: 0, van: 30 }, huyHieu: ['ha-10', 'ha-50', 'lien-3', 'tk-1'], doiKy: 1, danhHieu: ['tho-san'],
  thiDua: { chuTuan: '09/11 – 15/11', doi: [388, 412, 301, 276] },
}
vi.mock('../src/components/phong-cho/tu-do-api', () => ({
  taiTuDo: async () => { api.tai++; return DU },
  macDo: async (_xt: unknown, mac: unknown) => { api.mac.push(mac); return { ok: true, mac } },
}))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ BAT: true, URL: 'https://may-chu.test' }) }))
import SanhSinhTon from '../src/components/phong-cho/SanhSinhTon'
import TuDoBeMa from '../src/components/phong-cho/TuDoBeMa'

afterEach(() => { cleanup(); vi.useRealTimers(); api.tai = 0; api.mac = [] })

describe('thẻ sảnh + tủ đồ (đợt 4)', () => {
  it('lượt vẽ đầu: một nút «Chơi», chưa đọc; sau khi hiện ⇒ đội cả kỳ, danh hiệu, 4 vạch xếp cao → thấp, nút «Tủ đồ»', async () => {
    vi.useFakeTimers()
    render(<SanhSinhTon maCa="123456" veDau="ve-ky" />)
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(api.tai).toBe(0)
    await act(async () => { vi.advanceTimersByTime(500); await vi.runAllTimersAsync() })
    vi.useRealTimers()
    await screen.findByRole('button', { name: 'Tủ đồ' })
    expect(api.tai).toBe(1)
    expect(screen.getByText('Đội Kali')).toBeTruthy()
    expect(screen.getByText('Thợ săn tuần')).toBeTruthy()
    const vach = [...document.querySelectorAll('.sst-td li')].map((li) => li.textContent)
    expect(vach).toEqual(['Kali412', 'Natri388', 'Đồng301', 'Canxi276'])
    expect(screen.getByRole('button', { name: 'Chơi' })).toBeTruthy()
  })
  it('thầy đã bắt đầu ⇒ không đọc dữ liệu thẻ', async () => {
    vi.useFakeTimers()
    render(<SanhSinhTon maCa="123456" veDau="ve-ky" batDau />)
    await act(async () => { await vi.runAllTimersAsync() })
    expect(api.tai).toBe(0)
  })
  it('tủ đồ: ô khoá ghi tiến độ có nhãn, bấm ô khoá không chọn; chọn ô đã mở rồi «Mặc đồ đã chọn» ⇒ gửi đúng bộ đồ', async () => {
    const dong = vi.fn()
    render(<TuDoBeMa du={DU} xt={{ ve: 'v' }} onDong={dong} />)
    expect(screen.getByText('Cấp 20 · em đang cấp 14')).toBeTruthy()
    expect(screen.getByText('Chuỗi 30 ngày · em đang Chuỗi 12 ngày')).toBeTruthy()
    expect(screen.getByText(/không làm súng mạnh hơn/)).toBeTruthy()
    const luu = screen.getByRole('button', { name: 'Mặc đồ đã chọn' }) as HTMLButtonElement
    expect(luu.disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /^Mũ phù thuỷ/ }))
    expect(luu.disabled).toBe(true)
    expect(screen.getByRole('status').textContent).toMatch(/chưa mở/)
    fireEvent.click(screen.getByRole('button', { name: /^Áo kẻ ô li/ }))
    expect(luu.disabled).toBe(false)
    await act(async () => { fireEvent.click(luu) })
    expect(api.mac).toEqual([{ mu: 'mu-tot-nghiep', ao: 'ao-ke-o-li', dan: null, ha: null }])
    expect(screen.getByText('Lượt hạ')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }))
    expect(dong).toHaveBeenCalled()
  })
})
