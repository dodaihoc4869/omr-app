// "GIAO THÊM BÀI CHO CON" — MÀN phụ huynh (thầy lệnh 21/09; hợp đồng docs/hop-dong-ph-giao-them-2109.md mục 5–6; hàm thuần của Code 1 + máy chủ của Code 3 ở test khác).
// Khoá: đọc chặt thân máy chủ; chữ xác nhận/từ chối có số THẬT và chủ ngữ "A.I Đỗ Đại Học"; "Anh/chị chưa mất lượt nào" khi từ chối; hết 3 lượt ⇒ nút mờ; chống bấm đúp;
// máy chủ chưa có lệnh ⇒ giữ đường cũ (Pages đi trước Worker được); menu chỉ bỏ các mục giao KHI lệnh mới sẵn sàng; không game.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, configure, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import ParentPortalScreen from '../src/screens/ParentPortalScreen'
import './_ph-nap-trang-cu' // trang cũ nạp lười (26/10): chờ mảnh về trước các test

configure({ asyncUtilTimeout: 8000 })
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrl: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({
  ...(await original<any>()),
  tenTheoSbd: async () => ({ sbd: '12121212', hoTen: 'Đỗ Minh', lop: '12A1', tenCa: '' }),
  hsLichSuCaApi: async () => ({ ok: true, items: [] }),
  hsCauSaiApi: async () => ({ ok: true, items: [] }),
  hsBtvnApi: async () => ({ ok: true, items: [] }),
}))
vi.mock('../src/lib/mom-api', async (original) => ({ ...(await original<any>()), migrateMom: async () => {}, momApi: async () => ({ ok: true, items: [] }) }))
const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})

// ĐÃ GỠ 28/09: describe "Cổng phụ huynh thật — MỘT màn, MỘT nút" (4 test trên ParentPortalScreen). Thầy lệnh 28/09: "app phụ huynh không có giao bài cho con nữa
// chỉ xem được báo cáo mọi thứ về con" ⇒ cổng phụ huynh không còn nút "Giao thêm bài cho con" và không gọi /ph/giao-them (khoá ở tests/ph-v3-app-2809.test.tsx).
// 27/10: các mảnh còn lại (lớp đọc giao-them-hien-thi, API giao-them-api, hook use-giao-them, màn GiaoThemChoCon) đã gỡ khỏi src/ vì không màn nào dùng ⇒ các phép kiểm của chúng bỏ theo.
describe('cổng phụ huynh thật (28/09): KHÔNG còn nút giao bài', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/?vai=phuhuynh')
    localStorage.setItem('omr_ph_sbd', '12121212')
  })
  afterEach(() => window.history.replaceState(null, '', '/'))
  it('đã đăng nhập: không nút "Giao thêm bài cho con", không vùng giao-them, không gọi /ph/giao-them', async () => {
    const goi: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      goi.push(String(url))
      return { ok: true, status: 200, json: async () => ({ ok: true, serverNow: Date.UTC(2026, 8, 28, 13), hoTen: 'Đỗ Minh' }), text: async () => '{}' }
    }))
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="man-chinh-ph"]')).toBeTruthy())
    await new Promise((r) => setTimeout(r, 30))
    expect(screen.queryByRole('button', { name: 'Giao thêm bài cho con' })).toBeNull()
    expect(container.querySelector('[data-vung="giao-them"]')).toBeNull()
    expect(goi.some((u) => u.endsWith('/ph/giao-them'))).toBe(false)
  }, 20000)
})

describe('khoá nguồn', () => {
  it('BangNhiemVu: nút CHỈ ở phụ huynh và LUÔN hiện khi có giaoThem (không còn ô cũ); màn phụ huynh truyền SBD cho hook', () => {
    // 28/09: màn phụ huynh KHÔNG còn nối hook giao thêm (thầy: không giao bài cho con nữa).
    const p = doc('src/screens/ParentPortalScreen.tsx').replace(/\/\/.*$/gm, '')
    expect(p).not.toContain('useGiaoThem')
    expect(p).not.toContain('giaoThem')
    expect(p).not.toContain('mucMenuPhuHuynh')
  })
})
