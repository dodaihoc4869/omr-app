// Việc C · C9 (Code 4): cổng phụ huynh — phần CŨ ngoài Bảng nhiệm vụ: màn đăng nhập bằng SBD + khung sheet toàn màn (thanh trên, nút Đóng).
// ParentPortalScreen chỉ phụ huynh dùng nên mặc M3 vô điều kiện; Bảng nhiệm vụ (.bnv, của Code 2) nằm TRONG gốc `m3` nhưng không đổi.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import ParentPortalScreen from '../src/screens/ParentPortalScreen'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => null }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrl: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({
  ...(await original<any>()),
  tenTheoSbd: async () => ({ sbd: '12121212', hoTen: 'Đỗ Minh', lop: '12A1', tenCa: '' }),
  hsLichSuCaApi: async () => ({ ok: true, items: [{ maCa: 'CA-ANCOL', tenCa: 'Ca Ancol 15/09', tong: 9.5, tongCau: 28, soCauDung: 26, soCauSai: 2, nopLuc: '2026-09-15T10:00:00Z' }] }),
  hsCauSaiApi: async () => ({ ok: true, items: [] }),
  hsBtvnApi: async () => ({ ok: true, items: [] }),
}))
vi.mock('../src/lib/mom-api', async (original) => ({ ...(await original<any>()), migrateMom: async () => {}, momApi: async () => ({ ok: true, items: [] }) }))

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
beforeEach(() => {
  window.history.replaceState(null, '', '/?vai=phuhuynh')
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, items: [], winners: [] }) })))
})
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
  window.history.replaceState(null, '', '/')
})

describe('ParentPortalScreen — màn đăng nhập (chưa có SBD)', () => {
  it('gốc `m3`; nút vào là nút chính M3, khoá tới khi có SBD; nhập SBD rồi bấm → vào Bảng nhiệm vụ', async () => {
    const { container } = render(<ParentPortalScreen />)
    expect(container.firstElementChild!.classList.contains('m3')).toBe(true)
    const vao = await screen.findByRole('button', { name: 'Vào xem kết quả của con' })
    expect(vao.className).toContain('m3-nut-chinh')
    expect((vao as HTMLButtonElement).disabled).toBe(true)
    fireEvent.change(screen.getByPlaceholderText(/Ví dụ: 12001/), { target: { value: '12121212' } })
    expect((vao as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(vao)
    await waitFor(() => expect(container.querySelector('.bnv')).toBeTruthy())
    expect(localStorage.getItem('omr_ph_sbd')).toBe('12121212')
    expect(container.firstElementChild!.classList.contains('m3')).toBe(true)
  })
})

describe('ParentPortalScreen — đã đăng nhập: khung sheet toàn màn', () => {
  it('Bảng nhiệm vụ nằm trong gốc `m3`; mở sheet Báo cáo điểm: thanh trên có nút Đóng ≥ 48 px ngang, bấm đóng thì về Bảng nhiệm vụ', async () => {
    localStorage.setItem('omr_ph_sbd', '12121212')
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('.bnv')).toBeTruthy())
    expect(container.firstElementChild!.classList.contains('m3')).toBe(true)
    expect(container.querySelector('.bnv')!.closest('.m3')).toBeTruthy()
    fireEvent.click(await screen.findByRole('button', { name: 'Mở menu' }))
    fireEvent.click(await screen.findByText('Báo cáo điểm các ca thi'))
    const dong = await screen.findByTitle('Đóng toàn màn hình')
    expect(dong.className).toContain('min-w-[48px]')
    expect(screen.getByText('Ca Ancol 15/09')).toBeTruthy()
    fireEvent.click(dong)
    await waitFor(() => expect(container.querySelector('.bnv')).toBeTruthy())
    expect(screen.queryByTitle('Đóng toàn màn hình')).toBeNull()
  })
})

describe('hai lỗi nhỏ ghi tồn — sửa ở chỗ dùng (0.Planer 19/09)', () => {
  it('(ii) tiêu đề sheet không còn bị chặn 200 px: ở màn hẹp xuống hàng riêng full bề rộng, cắt (truncate) chỉ khi thật sự hết chỗ', async () => {
    localStorage.setItem('omr_ph_sbd', '12121212')
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('.bnv')).toBeTruthy())
    fireEvent.click(await screen.findByRole('button', { name: 'Mở menu' }))
    fireEvent.click(await screen.findByText('Báo cáo điểm các ca thi'))
    const tieuDe = (await screen.findByText('Báo Cáo Điểm Tất Cả Các Ca Thi')) as HTMLElement
    expect(tieuDe.className).toContain('truncate')
    const khung = tieuDe.parentElement!
    expect(khung.className).toContain('basis-full')
    expect(khung.className).toContain('order-last')
    expect(khung.className).not.toContain('max-w-[200px]')
    expect(khung.parentElement!.className).toContain('flex-wrap')
  })

  it('(i) thanh trên màn đăng nhập chừa tối thiểu 10 px phía trên (env() rỗng ở máy không tai thỏ làm chữ ĐỖ ĐẠI HỌC bị cắt mép); LogoApp.tsx KHÔNG bị sửa', () => {
    const t = doc('src/screens/ParentPortalScreen.tsx')
    expect(t).toContain("paddingTop: 'max(10px, env(safe-area-inset-top))'")
    expect(t).not.toContain("paddingTop: 'env(safe-area-inset-top, 10px)'")
    expect(doc('src/components/LogoApp.tsx')).not.toContain('safe-area')
  })
})

describe('ParentPortalScreen.tsx: không mã màu cứng, phạm vi bộ sinh', () => {
  it('không #hex, không import hay sửa gì ngoài lớp m3; nằm trong phạm vi bộ sinh lớp tương thích', () => {
    const t = doc('src/screens/ParentPortalScreen.tsx')
    expect(t).not.toMatch(/#[0-9a-fA-F]{6}\b/)
    expect(t).toContain("import '../components/m3'")
    expect(doc('scripts/sinh-m3-tuong-thich.mjs')).toContain("'src/screens/ParentPortalScreen.tsx'")
  })
})
