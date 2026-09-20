// ĐOÀN HỘ TỐNG — CỜ MỞ GAME ở phía giao diện: máy chủ báo `doanMo:false` ⇒ game Y HỆT trước khi có Đoàn; `doanMo:true` ⇒ giao diện mới.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor, configure } from '@testing-library/react'
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'http://may-chu.thu' }))
vi.mock('../src/game/than-thu-v2/EscortRoom', () => ({ default: () => <div data-testid="vo-dai-cu" /> }))
const dem = vi.hoisted(() => ({ dungDoan: 0 }))
vi.mock('../src/game/than-thu-v2/DoanHoTong', () => ({ default: () => { dem.dungDoan++; return <div data-testid="doan-ho-tong" /> } }))
// Vỏ Đảo thần thú của Code 6 (có test riêng tests/dao-than-thu-vo.test.tsx): ở đây chỉ soi PROP Game.tsx truyền vào và các lối ra của vỏ.
vi.mock('../src/game/than-thu-v2/dao/DaoThanThu', () => ({ default: (p: any) => <div data-testid="vo-dao" data-doan-mo={String(p.doanMo)} data-moi-doan={String(!!p.moiDoan)} data-chua-chon={String(p.profile.choice)}><button onClick={p.onMoDoan}>vỏ: mở Đoàn</button><button onClick={p.onMoVoDai}>vỏ: mở Võ đài</button><button onClick={p.onMoTienBo}>vỏ: mở Tiến bộ</button></div> }))
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

describe('Đoàn Hộ Tống · cờ mở game · giao diện (Đảo thần thú bản mới là MỘT vỏ)', () => {
  it('cờ TẮT (hoặc máy chủ cũ không trả cờ): vỏ Đảo nhận doanMo=false, ở tab Đảo KHÔNG có đầu trang/thanh mục cũ; ra Võ đài thì mục y hệt cũ, không chữ Đoàn, Võ đài mở MỌI ngày với tên cũ', async () => {
    for (const co of [false, undefined]) {
      vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(THU_HAI); mayChu(co)
      render(<Game sbd="S1" token="t" onDong={() => {}} />)
      const vo = await screen.findByTestId('vo-dao'); expect(vo.dataset.doanMo).toBe('false'); expect(muc()).toEqual([]); expect(document.querySelector('.spirit-header')).toBeNull(); expect(document.querySelector('.spirit-game-dao')).toBeTruthy()
      fireEvent.click(screen.getByRole('button', { name: 'vỏ: mở Võ đài' }))
      await waitFor(() => expect(muc()).toEqual(['Đảo thần thú', 'Hộ Tống Linh Tâm', 'Tiến bộ của em', 'Game mới · Sắp ra mắt']))
      expect(screen.getByTestId('vo-dai-cu').parentElement!.hidden).toBe(false); expect(document.body.textContent).not.toMatch(/Đoàn Hộ Tống|Võ đài thứ Bảy/); expect(screen.queryByTestId('vo-dao')).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: 'Đảo thần thú' })); expect(await screen.findByTestId('vo-dao')).toBeTruthy() // về lại đảo
      cleanup(); vi.useRealTimers()
    }
  })
  it('cờ TẮT mà cửa ngoài xin mở thẳng Đoàn → về Đảo thần thú, không màn trống, lớp phủ Đoàn KHÔNG được dựng dù một khung hình', async () => {
    // Nạp sẵn gói Đoàn (như em vừa chơi xong thì thầy tắt cờ): lần dựng sau React có thể vẽ lớp phủ NGAY trong khung hình đầu nếu thiếu chốt cờ.
    mayChu(true); render(<Game sbd="S1" token="t" manDau="doan" onDong={() => {}} />); await screen.findByTestId('doan-ho-tong'); cleanup(); dem.dungDoan = 0
    mayChu(false); sessionStorage.setItem(KHOA_MAN_DAU, 'doan')
    render(<Game sbd="S1" token="t" onDong={() => {}} />)
    expect((await screen.findByTestId('vo-dao')).dataset.doanMo).toBe('false'); expect(screen.queryByTestId('doan-ho-tong')).toBeNull()
    await new Promise(r => setTimeout(r, 30)); expect(dem.dungDoan).toBe(0)
  })
  it('cờ BẬT: vỏ nhận doanMo=true, mục Đoàn của vỏ mở lớp phủ Đoàn; mở từ ngoài bằng khoá sessionStorage (đọc một lần rồi tự xoá) hoặc prop manDau; mặc định vẫn về Đảo', async () => {
    mayChu(true); sessionStorage.setItem(KHOA_MAN_DAU, 'doan')
    render(<Game sbd="S1" token="t" onDong={() => {}} />)
    expect(await screen.findByTestId('doan-ho-tong')).toBeTruthy(); expect(sessionStorage.getItem(KHOA_MAN_DAU)).toBeNull()
    expect(muc()).toEqual(['Đảo thần thú', 'Đoàn Hộ Tống', 'Võ đài thứ Bảy', 'Tiến bộ của em', 'Game mới · Sắp ra mắt'])
    cleanup(); mayChu(true); render(<Game sbd="S1" token="t" manDau="doan" onDong={() => {}} />); expect(await screen.findByTestId('doan-ho-tong')).toBeTruthy()
    cleanup(); mayChu(true); render(<Game sbd="S1" token="t" onDong={() => {}} />)
    const vo = await screen.findByTestId('vo-dao'); await waitFor(() => expect(vo.dataset.doanMo).toBe('true')); expect(screen.queryByTestId('doan-ho-tong')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'vỏ: mở Đoàn' })); expect(await screen.findByTestId('doan-ho-tong')).toBeTruthy()
  })
  it('cờ BẬT + chưa chọn thần thú (mọi em sau reset): vỏ hiện màn chọn thú kèm lời MỜI (moiDoan), không thông báo lỗi, chưa dựng lớp phủ Đoàn', async () => {
    mayChu(true, true); render(<Game sbd="S1" token="t" manDau="doan" onDong={() => {}} />)
    const vo = await screen.findByTestId('vo-dao'); await waitFor(() => expect(vo.dataset.moiDoan).toBe('true')); expect(vo.dataset.chuaChon).toBe('true')
    expect(screen.queryByRole('alert')).toBeNull(); expect(screen.queryByTestId('doan-ho-tong')).toBeNull(); expect(muc()).toEqual([])
    cleanup(); mayChu(false, true); render(<Game sbd="S1" token="t" manDau="doan" onDong={() => {}} />); expect((await screen.findByTestId('vo-dao')).dataset.moiDoan).toBe('false') // cờ tắt thì không mời
  })
  it('cờ BẬT: Võ đài cũ chỉ mở thứ Bảy (giờ VN); ngày khác là thẻ mời sang Đoàn', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(THU_HAI); mayChu(true)
    render(<Game sbd="S1" token="t" onDong={() => {}} />)
    const vo = await screen.findByTestId('vo-dao'); await waitFor(() => expect(vo.dataset.doanMo).toBe('true')); fireEvent.click(screen.getByRole('button', { name: 'vỏ: mở Võ đài' }))
    expect(screen.queryByTestId('vo-dai-cu')).toBeNull(); fireEvent.click(await screen.findByRole('button', { name: 'Vào Đoàn Hộ Tống' })); expect(await screen.findByTestId('doan-ho-tong')).toBeTruthy()
    cleanup(); vi.setSystemTime(THU_BAY); mayChu(true); render(<Game sbd="S1" token="t" onDong={() => {}} />)
    const vo2 = await screen.findByTestId('vo-dao'); await waitFor(() => expect(vo2.dataset.doanMo).toBe('true')); fireEvent.click(screen.getByRole('button', { name: 'vỏ: mở Võ đài' })); expect(screen.getByTestId('vo-dai-cu').parentElement!.hidden).toBe(false)
  })
  it('hàm cuaGame: hai bộ mục tách bạch', () => {
    expect(cuaGame(false, THU_HAI)).toEqual({ nav: [['home', 'Đảo thần thú'], ['arena', 'Hộ Tống Linh Tâm'], ['progress', 'Tiến bộ của em'], ['coming', 'Game mới · Sắp ra mắt']], voDaiMo: true })
    expect(cuaGame(true, THU_HAI).voDaiMo).toBe(false); expect(cuaGame(true, THU_BAY).voDaiMo).toBe(true); expect(cuaGame(true, THU_HAI).nav.map(x => x[0])).toContain('doan')
  })
})
