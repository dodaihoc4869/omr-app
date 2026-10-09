// CỬA VÀO TỪ SẢNH BẢN ĐỒ 2.0: `game-v2:man-dau`='tui-do' (hoặc prop manDau="tui-do") ⇒ game mở thẳng TÚI ĐỒ trong Đảo thần thú
// (khoá đọc một lần rồi xoá, như 'doan' / 'shop'). Không có khoá ⇒ mở màn Đảo như cũ.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, waitFor, configure } from '@testing-library/react'
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'http://may-chu.thu' }))
vi.mock('../src/game/than-thu-v2/EscortRoom', () => ({ default: () => null }))
vi.mock('../src/game/than-thu-v2/DoanHoTong', () => ({ default: () => <div data-testid="doan-ho-tong" /> }))
vi.mock('../src/game/than-thu-v2/ProgressChart', () => ({ default: () => null }))
vi.mock('../src/game/than-thu-v2/LearningBattle', () => ({ default: () => null, SpellPreview: () => null }))
import Game, { KHOA_MAN_DAU } from '../src/game/than-thu-v2/Game'
import DaoThanThu from '../src/game/than-thu-v2/dao/DaoThanThu'
import type { DaoKetQua, DaoProfile } from '../src/game/than-thu-v2/dao/kieu'

configure({ asyncUtilTimeout: 8000 })
beforeEach(() => { sessionStorage.clear(); localStorage.clear() })
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
const hoSo = { nickname: 'Lửa Nhỏ', pet: 'lua_phuong', choice: false, cap: 5, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null }
function mayChu(cheDo2: boolean) {
  const goi: string[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const lenh = String(url).split('/').pop() ?? ''; goi.push(lenh)
    const them = lenh === 'hoa2-sanh' ? (cheDo2 ? { cheDo2: true, ngay: '2026-09-30', chienDich: null, dao: { con: 0 }, doan: { con: 0 }, khoaDao: false } : { cheDo2: false }) : { profile: hoSo, revision: 1, tasks: [], suggestions: [], doanMo: true }
    return { json: async () => ({ ok: true, ...them }) }
  }))
  return goi
}
const mucDangMo = () => document.querySelector('.dao-nav button[aria-current="page"]')?.textContent ?? ''

describe('Cửa vào Túi đồ (game-v2:man-dau = tui-do)', () => {
  it('khoá sessionStorage tui-do ⇒ Đảo mở thẳng Túi đồ, khoá bị xoá sau khi đọc; không mở Đoàn — cả cờ tắt lẫn chế độ 2.0', async () => {
    for (const co of [false, true]) {
      mayChu(co); sessionStorage.setItem(KHOA_MAN_DAU, 'tui-do')
      render(<Game sbd="S1" token="t" onDong={() => {}} />)
      await waitFor(() => expect(mucDangMo()).toBe('Túi đồ'))
      expect(sessionStorage.getItem(KHOA_MAN_DAU)).toBeNull()
      expect(screen.queryByTestId('doan-ho-tong')).toBeNull()
      // thanh dưới Đảo: 2.0 bỏ mục Đoàn; cờ tắt giữ mục Đoàn
      expect([...document.querySelectorAll('.dao-nav button')].map(b => b.textContent)).toEqual(co ? ['Đảo', 'Thần thú', 'Sổ tay', 'Túi đồ'] : ['Đảo', 'Đoàn Hộ Tống', 'Sổ tay', 'Túi đồ']) // BẢN DUYỆT V2 (09/10): 2.0 thêm mục Thần thú (màn 06)
      cleanup(); vi.unstubAllGlobals()
    }
  })

  it('prop manDau="tui-do" cũng mở Túi đồ; không khoá ⇒ mở màn Đảo như cũ', async () => {
    mayChu(false); render(<Game sbd="S1" token="t" manDau="tui-do" onDong={() => {}} />)
    await waitFor(() => expect(mucDangMo()).toBe('Túi đồ'))
    cleanup(); vi.unstubAllGlobals()
    const call = vi.fn(async (): Promise<DaoKetQua> => ({ ok: true }))
    const hs: DaoProfile = { nickname: 'Lửa Nhỏ', pet: 'lua_phuong', choice: false, cap: 5, exp: 0, wallet: 0, mastery: [] }
    render(<DaoThanThu sbd="S1" profile={hs} doanMo={false} call={call} onMoDoan={() => {}} onDong={() => {}} />)
    await waitFor(() => expect(mucDangMo()).toBe('Đảo'))
  })
})
