// MỞ LẠI APP (đã đăng nhập) KHÔNG TREO SUSPENSE (tối ưu vòng 2, 06/10): vỏ app học sinh chờ mảnh cổng về RỒI mới dựng React (main.tsx hỏi `sanSangVeDau`); lượt dựng đầu vẽ THẲNG cổng
// (không `lazy` ⇒ không màn chờ trống + 300 ms giữ màn chờ của React 19). Máy chưa đăng nhập không chờ gì.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu.test' }))
vi.mock('../src/screens/StudentPortalScreen', async () => {
  await Promise.resolve()
  return { default: () => <div data-testid="cong">cổng</div> }
})

const KHOA = 'omr_student_portal_auth'

describe('AppHocSinh — mở lại không treo Suspense', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
    window.history.replaceState(null, '', '/hs')
  })
  afterEach(() => {
    cleanup()
    localStorage.clear()
    window.history.replaceState(null, '', '/')
  })

  it('máy ĐÃ đăng nhập: sanSangVeDau() là lời hứa; xong rồi thì lượt dựng ĐẦU đã có cổng (không màn chờ, không findBy)', async () => {
    localStorage.setItem(KHOA, JSON.stringify({ sbd: '99001', hoTen: 'Em', lop: '12A', namSinh: '2008', token: 'tk1' }))
    const vo = await import('../src/AppHocSinh')
    const cho = vo.sanSangVeDau()
    expect(cho).toBeInstanceOf(Promise)
    await cho
    const { default: AppHocSinh } = vo
    render(<AppHocSinh />)
    expect(screen.queryByTestId('cong')).not.toBeNull() // đồng bộ ngay lượt dựng đầu
  })

  it('máy CHƯA đăng nhập: không chờ gì (null) — màn đăng nhập dựng ngay', async () => {
    const vo = await import('../src/AppHocSinh')
    expect(vo.sanSangVeDau()).toBeNull()
  })
})
