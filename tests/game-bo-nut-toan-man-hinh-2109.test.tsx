// THẦY LỆNH 21/09 (kèm ảnh nút "Thoát toàn màn hình" nổi trên màn game): "Bỏ cái nút toàn màn hình ở màn game vì có nút về app học sinh rồi".
// Gỡ HẲN khung bật/thoát toàn màn hình của game + mã requestFullscreen/exitFullscreen liên quan; GIỮ nút "Về app học sinh".
// (Toàn màn hình của MÀN THI, tờ chiếu, xem ảnh phóng to là việc khác — không đụng.)
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import DaoThanThu from '../src/game/than-thu-v2/dao/DaoThanThu'
import type { DaoKetQua, DaoProfile } from '../src/game/than-thu-v2/dao/kieu'

afterEach(cleanup)
const goc = process.cwd()
const doc = (p: string) => readFileSync(resolve(goc, p), 'utf8')
const tep = (d: string) => readdirSync(resolve(goc, d)).filter((f) => /\.(tsx?|css)$/.test(f)).map((f) => join(d, f))

describe('Game: không còn nút / mã toàn màn hình', () => {
  it('khung KhungThanThuToanManHinh đã xoá; cổng học sinh không còn nhắc tới', () => {
    expect(existsSync(resolve(goc, 'src/components/KhungThanThuToanManHinh.tsx'))).toBe(false)
    expect(doc('src/screens/StudentPortalScreen.tsx')).not.toMatch(/KhungThanThuToanManHinh|requestFullscreen|exitFullscreen/)
  })
  it('không tệp nào trong game (Đảo, Đoàn, Võ đài) còn requestFullscreen / exitFullscreen / biểu tượng Maximize-Minimize / "Toàn màn hình" như nút', () => {
    for (const t of [...tep('src/game/than-thu-v2'), ...tep('src/game/than-thu-v2/dao')]) {
      const nguon = doc(t)
      expect(nguon, t).not.toMatch(/requestFullscreen|exitFullscreen|fullscreenElement|data-than-thu-fullscreen/)
      expect(nguon, t).not.toMatch(/\b(Maximize|Minimize)\b/)
      expect(nguon, t).not.toMatch(/['">]\s*(Thoát toàn màn hình|Toàn màn hình)\s*['"<]/)
    }
  })
  it('không tệp nào khác dựng nút "Thoát toàn màn hình" / "Toàn màn hình" cho game (chỉ còn ở màn thi, tờ chiếu, ảnh phóng to)', () => {
    expect(doc('src/screens/StudentPortalScreen.tsx')).not.toMatch(/Thoát toàn màn hình|Toàn màn hình'/)
  })
})

describe('Game TỰ vào toàn màn hình (thầy lệnh 21/09) — vẫn KHÔNG có nút, chỉ có mã tự xin', () => {
  it('mã tự xin nằm ở lib + hook của cổng (không trong tệp game), không JSX/nút; cổng dùng hook + moGame', () => {
    const lib = doc('src/lib/toan-man-hinh-game.ts')
    expect(lib).toContain('requestFullscreen')
    expect(lib).not.toMatch(/<button|<\/|React|onClick/)
    expect(doc('src/components/useToanManHinhGame.ts')).not.toMatch(/<button|<\/[a-z]/i)
    const cong = doc('src/screens/StudentPortalScreen.tsx')
    expect(cong).toContain("useToanManHinhGame(tab === 'thanthu')")
    expect(cong).toContain("xinToanManHinh('cu-cham-vao')")
    // toàn bộ khoá hành vi (xin trong cú chạm, một lần/lượt, từ chối im lặng, em thoát không ép lại, Về app thoát): tests/toan-man-hinh-game-2109.test.tsx
  })
})

describe('Vỏ Đảo thần thú: chỉ còn nút "Về app học sinh" ở góc, không nút nổi toàn màn hình', () => {
  const hoSo: DaoProfile = { nickname: 'Lửa Nhỏ', pet: 'lua_phuong', choice: false, cap: 34, exp: 10, wallet: 0, mastery: [] }
  it('render thật: có "Về app học sinh" (gọi onDong), KHÔNG nút nào tên chứa "toàn màn hình"', async () => {
    const onDong = vi.fn()
    const call = async (): Promise<DaoKetQua> => ({ ok: true })
    const { container } = render(<DaoThanThu sbd="12121212" profile={hoSo} doanMo={false} call={call as never} onMoDoan={() => {}} onDong={onDong} />)
    await screen.findByRole('button', { name: 'Về app học sinh' })
    screen.getByRole('button', { name: 'Về app học sinh' }).click()
    expect(onDong).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: /toàn màn hình/i })).toBeNull()
    expect(container.querySelector('[aria-pressed][class*="fullscreen"], [data-than-thu-fullscreen]')).toBeNull()
  })
})
