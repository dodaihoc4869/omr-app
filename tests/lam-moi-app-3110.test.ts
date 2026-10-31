// @vitest-environment jsdom
// LÀM MỚI APP (thầy 31/10: «nút reset app trong hồ sơ hs, bấm nút này nếu app bị đơ … reset đăng xuất và nhập lại đăng nhập»; src/lib/lam-moi-app.ts).
// Xoá phần nhớ tạm + đăng xuất; GIỮ bài chưa gửi, cài đặt em chọn, khoá app thầy / phụ huynh; mất mạng ⇒ không xoá gì.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { giuLai, lamMoiApp, xoaKhoaTam } from '../src/lib/lam-moi-app'

const TAM = ['omr_student_portal_auth', 'omr_hoa2_sanh_dem:10044', 'omr_goi_ngay_10044', 'omr_chang_dang_lam_10044', 'omr_sua_ngay_10044', 'omr_tu_sua_hom_nay_10044', 'ddh.khung-tinh-hs', 'ddh.mayChuHs', 'omr_goi_de_10044', 'ktcn:goi:10044:B1']
const GIU = ['omr_hang_doi_nop_v1', 'omr_sua_cho_10044', 'ktcn:nhap:10044:B1:0', 'ktcn:lam:10044', 'omr_mom_draft_10044_M1', 'ddh.btvn.draft.10044', 'ddh.tuluyen.dang.10044', 'ddh.am', 'ddh.rung', 'ddh.trong', 'mc-projector-scale', 'omr_ph_pass']

afterEach(() => { localStorage.clear(); vi.restoreAllMocks() })

describe('làm mới app', () => {
  it('xoá phần nhớ tạm (cả phiên đăng nhập), giữ bài chưa gửi / cài đặt / khoá app thầy – phụ huynh', () => {
    for (const k of [...TAM, ...GIU]) localStorage.setItem(k, 'x')
    expect(xoaKhoaTam(localStorage)).toBe(TAM.length)
    for (const k of TAM) expect(localStorage.getItem(k), k).toBeNull()
    for (const k of GIU) expect(localStorage.getItem(k), k).toBe('x')
    expect(giuLai('omr_student_portal_auth')).toBe(false)
  })
  it('mất mạng ⇒ không xoá gì, trả false', async () => {
    localStorage.setItem('omr_student_portal_auth', 'x')
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    expect(await lamMoiApp()).toBe(false)
    expect(localStorage.getItem('omr_student_portal_auth')).toBe('x')
  })
})
