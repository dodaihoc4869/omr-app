// ĐOÀN HỘ TỐNG — CỜ MỞ GAME ở phía giao diện: máy chủ báo `doanMo:false` ⇒ game Y HỆT trước khi có Đoàn; `doanMo:true` ⇒ giao diện mới.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor, configure } from '@testing-library/react'
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'http://may-chu.thu' }))
vi.mock('../src/game/than-thu-v2/EscortRoom', () => ({ default: () => <div data-testid="vo-dai-cu" /> }))
const dem = vi.hoisted(() => ({ dungDoan: 0 }))
vi.mock('../src/game/than-thu-v2/DoanHoTong', () => ({ default: () => { dem.dungDoan++; return <div data-testid="doan-ho-tong" /> } }))
vi.mock('../src/game/than-thu-v2/ProgressChart', () => ({ default: () => null }))
vi.mock('../src/game/than-thu-v2/LearningBattle', () => ({ default: () => null, SpellPreview: () => null }))
vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => null }))
vi.mock('../src/game/than-thu-v2/SpiritArt', () => ({ default: () => null }))
vi.mock('../src/game/than-thu-v2/ImmortalShield', () => ({ default: () => null }))
import Game, { cuaGame, KHOA_MAN_DAU } from '../src/game/than-thu-v2/Game'

const THU_HAI = Date.parse('2026-09-21T09:00:00+07:00'), THU_BAY = Date.parse('2026-09-26T09:00:00+07:00')
function mayChu(doanMo: boolean | undefined, choice = false) {
  const hoSo = { pet: 'lua_phuong', choice, cap: 5, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null }
  vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => ({ ok: true, profile: hoSo, revision: 1, tasks: [], suggestions: [], ...(doanMo === undefined ? {} : { doanMo }) }) })))
}
const muc = () => [...document.querySelectorAll('.spirit-nav button')].map(b => b.textContent)
// Chạy chung với cả bộ 5000+ test thì máy rất nặng: nới hạn chờ của findBy/waitFor để không đỏ oan vì chậm (không đo thời gian ở đây).
configure({ asyncUtilTimeout: 8000 })
beforeEach(() => { sessionStorage.clear(); localStorage.clear(); dem.dungDoan = 0 })
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers() })

describe('Đoàn Hộ Tống · cờ mở game · giao diện', () => {
  it('cờ TẮT (hoặc máy chủ cũ không trả cờ): mục game y hệt cũ, không có chữ Đoàn, Võ đài cũ mở MỌI ngày với tên cũ', async () => {
    for (const co of [false, undefined]) {
      vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(THU_HAI); mayChu(co)
      render(<Game sbd="S1" token="t" onDong={() => {}} />)
      await waitFor(() => expect(muc()).toEqual(['Đảo thần thú', 'Hộ Tống Linh Tâm', 'Tiến bộ của em', 'Game mới · Sắp ra mắt']))
      expect(document.body.textContent).not.toMatch(/Đoàn Hộ Tống|Võ đài thứ Bảy/)
      fireEvent.click(screen.getByRole('button', { name: 'Hộ Tống Linh Tâm' })); expect(screen.getByTestId('vo-dai-cu').parentElement!.hidden).toBe(false)
      cleanup(); vi.useRealTimers()
    }
  })
  it('cờ TẮT mà cửa ngoài xin mở thẳng Đoàn → về Đảo thần thú, không màn trống, không lớp phủ Đoàn', async () => {
    // Nạp sẵn gói Đoàn (như em vừa chơi xong thì thầy tắt cờ): lần dựng sau React có thể vẽ lớp phủ NGAY trong khung hình đầu nếu thiếu chốt cờ.
    mayChu(true); render(<Game sbd="S1" token="t" manDau="doan" onDong={() => {}} />); await screen.findByTestId('doan-ho-tong'); cleanup(); dem.dungDoan = 0
    mayChu(false); sessionStorage.setItem(KHOA_MAN_DAU, 'doan')
    render(<Game sbd="S1" token="t" onDong={() => {}} />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Đảo thần thú' }).getAttribute('aria-current')).toBe('page'))
    expect(screen.queryByTestId('doan-ho-tong')).toBeNull()
    await new Promise(r => setTimeout(r, 30)); expect(dem.dungDoan).toBe(0) // lớp phủ Đoàn KHÔNG được dựng dù chỉ một khung hình (nó sẽ gọi lệnh doan-* lên máy chủ)
  })
  it('cờ BẬT: có tab Đoàn Hộ Tống; mở từ ngoài bằng khoá sessionStorage (đọc một lần rồi tự xoá) hoặc prop manDau', async () => {
    mayChu(true); sessionStorage.setItem(KHOA_MAN_DAU, 'doan')
    render(<Game sbd="S1" token="t" onDong={() => {}} />)
    expect(await screen.findByTestId('doan-ho-tong')).toBeTruthy(); expect(sessionStorage.getItem(KHOA_MAN_DAU)).toBeNull()
    expect(muc()).toEqual(['Đảo thần thú', 'Đoàn Hộ Tống', 'Võ đài thứ Bảy', 'Tiến bộ của em', 'Game mới · Sắp ra mắt'])
    cleanup(); mayChu(true); render(<Game sbd="S1" token="t" manDau="doan" onDong={() => {}} />); expect(await screen.findByTestId('doan-ho-tong')).toBeTruthy()
    cleanup(); mayChu(true); render(<Game sbd="S1" token="t" onDong={() => {}} />); await waitFor(() => expect(muc()).toHaveLength(5)); expect(screen.queryByTestId('doan-ho-tong')).toBeNull() // mặc định vẫn về Đảo
  })
  it('cờ BẬT + chưa chọn thần thú (mọi em sau reset 21/09): lời MỜI phía trên màn chọn thú, không phải thông báo lỗi', async () => {
    mayChu(true, true); render(<Game sbd="S1" token="t" manDau="doan" onDong={() => {}} />)
    expect(await screen.findByText(/Đoàn Hộ Tống đang chờ em/)).toBeTruthy(); expect(screen.getByText('Chọn bạn đồng hành')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull(); expect(screen.queryByTestId('doan-ho-tong')).toBeNull()
  })
  it('cờ BẬT: Võ đài cũ chỉ mở thứ Bảy (giờ VN); ngày khác là thẻ mời sang Đoàn', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(THU_HAI); mayChu(true)
    render(<Game sbd="S1" token="t" onDong={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Võ đài thứ Bảy' }))
    expect(screen.queryByTestId('vo-dai-cu')).toBeNull(); fireEvent.click(screen.getByRole('button', { name: 'Vào Đoàn Hộ Tống' })); expect(await screen.findByTestId('doan-ho-tong')).toBeTruthy()
    cleanup(); vi.setSystemTime(THU_BAY); mayChu(true); render(<Game sbd="S1" token="t" onDong={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Võ đài thứ Bảy' })); expect(screen.getByTestId('vo-dai-cu').parentElement!.hidden).toBe(false)
  })
  it('hàm cuaGame: hai bộ mục tách bạch', () => {
    expect(cuaGame(false, THU_HAI)).toEqual({ nav: [['home', 'Đảo thần thú'], ['arena', 'Hộ Tống Linh Tâm'], ['progress', 'Tiến bộ của em'], ['coming', 'Game mới · Sắp ra mắt']], voDaiMo: true })
    expect(cuaGame(true, THU_HAI).voDaiMo).toBe(false); expect(cuaGame(true, THU_BAY).voDaiMo).toBe(true); expect(cuaGame(true, THU_HAI).nav.map(x => x[0])).toContain('doan')
  })
})
