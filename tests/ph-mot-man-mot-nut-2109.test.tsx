// APP PHỤ HUYNH — MỘT MÀN, MỘT NÚT (thầy lệnh 21/09; Nhật ký 97f3abe; Boss: "trên cây màn PH chỉ còn ĐÚNG MỘT nút hành động chính"): menu ba chấm, tab Xem điểm/Khắc phục/Bảng tin, giao nhanh, giao bài cũ (parent-news,
// KhoiKhacPhuc, hộp khắc phục), Bộ não/thư tuần đều ĐÃ GỠ. Còn: lời chào + tiến độ + dải cảnh báo của thầy (thụ động) + thẻ ca gần nhất (mở báo cáo đúng ca) + việc hôm nay (chỉ xem) + MỘT nút "Giao thêm bài cho con"
// + chân màn "Đổi số báo danh" và số bản. Khoá: chuỗi cấm không còn trên cây màn, đúng MỘT `.bnv-nut-chinh`, không gọi /parent-news, hộp báo cáo chỉ-xem, nguồn không còn mã của luồng cũ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import ParentPortalScreen from '../src/screens/ParentPortalScreen'
import BaoCaoCaThiPhuHuynhModal from '../src/components/BaoCaoCaThiPhuHuynhModal'
import { chuBanApp } from '../src/lib/cap-nhat-app'

const goi: string[] = []
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => null }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrl: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({
  ...(await original<any>()),
  tenTheoSbd: async () => ({ sbd: '12121212', hoTen: 'Đỗ Minh', lop: '12A1', tenCa: '' }),
  hsLichSuCaApi: async () => ({ ok: true, items: [{ maCa: 'CA-ANCOL', tenCa: 'Ca Ancol 15/09', tong: 6, tongCau: 28, soCauDung: 20, soCauSai: 8, nopLuc: '2026-09-15T10:00:00Z' }] }),
  hsCauSaiApi: async () => ({ ok: true, items: [{ qid: 'q1', phan: 'I', maCa: 'CA-ANCOL', text: 'Câu sai 1', dapAnDung: 'A', choices: { A: 'a', B: 'b', C: 'c', D: 'd' }, mucDo: 'hieu' }] }),
  hsBtvnApi: async () => ({ ok: true, items: [] }),
}))
vi.mock('../src/lib/mom-api', async (original) => ({ ...(await original<any>()), migrateMom: async () => {}, momApi: async () => ({ ok: true, items: [] }) }))
const CANH_BAO = { id: 'cb-1', maBtvn: 'BT-1', tenBtvn: 'BTVN Este', guiLuc: '2026-09-21T01:00:00Z', hanNop: '2026-09-22T05:00:00Z', loi: 'Thầy nhắc con nộp bài trước 12:00.', trangThaiEm: 'chua_mo', chang: null, daXem: false }
vi.mock('../src/lib/bo-nao-lay-loi-ph', () => ({ taiThongTinPhuHuynh: async () => ({ boNao: { ngay: '2026-09-21', loiNhan: 'Lời Bộ não CHO PH', thuTuan: 'Thư tuần CHO PH', tuanTu: '2026-09-14' }, canhBao: [CANH_BAO] }) }))

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
// Chuỗi của MỌI tính năng đã gỡ: không một chuỗi nào được còn trên cây màn PH.
const CAM_CU = [/Báo cáo điểm các ca/i, /Giao bài khắc phục/i, /Bảng tin của con/i, /Giao nhanh/i, /Khắc phục lỗi sai/i, /Luyện đề \(4 lựa chọn\)/i, /Nhắn Thầy/, /Giao bài cho con/, /Tạo bài luyện khắc phục/i, /Xem tất cả về con/, /Lời Bộ não CHO PH/, /Thư tuần CHO PH/, /Mở menu/, /Đóng toàn màn hình/, /Quay lại Bảng tin/]

beforeEach(() => {
  goi.length = 0
  window.history.replaceState(null, '', '/?vai=phuhuynh')
  localStorage.setItem('omr_ph_sbd', '12121212')
  vi.stubGlobal('fetch', vi.fn(async (url: string, o?: any) => {
    goi.push(`${String(url).replace('https://may.test', '')} ${o?.body ?? ''}`)
    if (String(url).endsWith('/ph/giao-them')) {
      const t = { ok: true, conLaiHomNay: 3 }
      return { ok: true, status: 200, json: async () => t, text: async () => JSON.stringify(t) }
    }
    return { ok: true, status: 200, json: async () => ({ ok: true, items: [], winners: [] }), text: async () => '{}' }
  }))
})
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
  window.history.replaceState(null, '', '/')
})

describe('MỘT màn, MỘT nút — cây màn phụ huynh thật', () => {
  it('đúng MỘT nút hành động chính ("Giao thêm bài cho con"); không chuỗi nào của tính năng đã gỡ; không menu / sheet / tab', async () => {
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="giao-them"]')).toBeTruthy())
    await waitFor(() => expect(container.textContent).toContain('Hôm nay còn 3 lượt giao'))
    const chinh = container.querySelectorAll('.bnv-nut-chinh')
    expect(chinh).toHaveLength(1)
    expect(chinh[0]!.textContent).toContain('Giao thêm bài cho con')
    const ten = (e: Element) => `${e.textContent} ${e.getAttribute('aria-label') ?? ''} ${e.getAttribute('title') ?? ''}`
    const chu = [container.textContent ?? '', ...[...container.querySelectorAll('button,[role],[title],[aria-label],a')].map(ten)].join('\n')
    for (const cam of CAM_CU) expect(chu, String(cam)).not.toMatch(cam)
    expect(container.querySelector('[role="menu"], .bnv-menu, [role="tablist"]')).toBeNull()
    expect(document.querySelector('.fixed.inset-0')).toBeNull() // không sheet toàn màn
  })

  it('MỌI nút bấm được trên màn (trừ thẻ ca gần nhất, "Đã xem", "Đổi số báo danh", "Giao thêm bài cho con") — không có; danh sách nút là hữu hạn và có tên', async () => {
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="giao-them"]')).toBeTruthy())
    await waitFor(() => expect(container.querySelector('[data-vung="the-ca-gan-nhat"] button')).toBeTruthy())
    const ten = [...container.querySelectorAll('button')].map((b) => (b.getAttribute('aria-label') || b.textContent || '').replace(/\s+/g, ' ').trim())
    for (const t of ten) {
      expect(t, t).toMatch(/^(Ca kiểm tra gần nhất của con: .*Xem báo cáo ca này\.|Đã xem|Giao thêm bài cho con|Đổi số báo danh)$/)
    }
    expect(ten.filter((t) => t === 'Giao thêm bài cho con')).toHaveLength(1)
    expect(ten.filter((t) => t === 'Đổi số báo danh')).toHaveLength(1)
  })

  it('dải cảnh báo của thầy vẫn còn (thụ động: chỉ đọc + "Đã xem"); lời Bộ não / thư tuần KHÔNG hiện dù máy chủ có trả', async () => {
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.textContent).toContain('Thầy nhắc con nộp bài trước 12:00.'))
    expect(container.textContent).not.toMatch(/Lời Bộ não CHO PH|Thư tuần CHO PH/)
    expect(screen.queryByRole('button', { name: 'Làm ngay' })).toBeNull()
  })

  it('chân màn: "Đổi số báo danh" (đích ≥ 48 px theo CSS) + số bản app; bấm ⇒ về màn đăng nhập, xoá SBD nhớ', async () => {
    const { container } = render(<ParentPortalScreen />)
    const chan = await waitFor(() => {
      const e = container.querySelector('[data-vung="chan-ph"]')
      expect(e).toBeTruthy()
      return e as HTMLElement
    })
    expect(chan.querySelector('.bnv-chan-ph-ban')!.textContent).toBe(chuBanApp())
    expect(doc('src/components/bang-nhiem-vu/bang-nhiem-vu.css')).toMatch(/\.bnv-chan-ph-nut \{[^}]*min-height: 48px/)
    fireEvent.click(screen.getByRole('button', { name: 'Đổi số báo danh' }))
    await screen.findByRole('button', { name: 'Vào xem kết quả của con' })
    expect(localStorage.getItem('omr_ph_sbd')).toBeNull()
  })

  it('không gọi /parent-news (giao bài cũ) và không gọi lệnh của luồng khắc phục; chỉ /ph/giao-them chiXem khi vào', async () => {
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.textContent).toContain('Hôm nay còn 3 lượt giao'))
    expect(goi.filter((g) => /parent-news|mom\/create|mom\/review/.test(g))).toEqual([])
    expect(goi.filter((g) => g.startsWith('/ph/giao-them'))).toEqual(['/ph/giao-them {"sbd":"12121212","chiXem":true}'])
  })

  it('thẻ ca gần nhất mở hộp báo cáo CHỈ XEM: không nút "Tạo bài luyện khắc phục", không hộp khắc phục; đóng được', async () => {
    const { container } = render(<ParentPortalScreen />)
    const the = await waitFor(() => {
      const e = container.querySelector('[data-vung="the-ca-gan-nhat"] button')
      expect(e).toBeTruthy()
      return e as HTMLElement
    })
    fireEvent.click(the)
    await waitFor(() => expect(document.body.textContent).toContain('Ca Ancol 15/09'))
    await waitFor(() => expect(document.body.textContent).toMatch(/Câu sai cần chữa|câu con làm sai/i))
    expect(screen.queryByText(/Tạo bài luyện khắc phục cho con/)).toBeNull()
    expect(screen.queryByText(/Bấm nút "Tạo bài luyện khắc phục/)).toBeNull()
    expect(document.body.textContent).not.toMatch(/Khắc phục lỗi sai|Luyện đề \(4 lựa chọn\)/)
    fireEvent.click(screen.getAllByRole('button', { name: 'Đóng' })[0]!)
    await waitFor(() => expect(container.querySelector('[data-vung="giao-them"]')).toBeTruthy())
  })
})

describe('hộp báo cáo PH — chế độ khongGiaoBai', () => {
  const baiThi = { maCa: 'CA-1', tenCa: 'Ca 1', ngayNop: '2026-09-15T10:00:00Z', diem: 6, tong: 6, tongSoCau: 28, soCauDung: 20, soCauSai: 8 }
  const ve = (khong: boolean) => render(<BaoCaoCaThiPhuHuynhModal baiThi={baiThi as any} hoTenCon="Minh" sbd="12121212" scriptUrl="/test" onClose={() => {}} khongGiaoBai={khong} onGiaoBaiChoCon={() => {}} onNhanTinChoThay={() => {}} />)
  it('bật ⇒ lời khuyên không chỉ tới nút đã gỡ; tắt (mặc định cũ) ⇒ nút "Tạo bài luyện khắc phục" vẫn có ở chỗ khác dùng hộp này', async () => {
    const a = ve(true)
    await waitFor(() => expect(a.container.textContent).toMatch(/Điểm ca này/))
    expect(a.container.textContent).not.toMatch(/Tạo bài luyện khắc phục|Tạo bài tập 10-15 câu/)
    expect(a.container.textContent).toContain('Giao thêm bài cho con')
    a.unmount()
    const b = ve(false)
    await waitFor(() => expect(b.container.textContent).toMatch(/Tạo bài (luyện khắc phục|tập 10-15 câu)/))
  })
})

describe('khoá nguồn — mã của các tính năng đã gỡ không còn ở màn phụ huynh', () => {
  it('ParentPortalScreen: không tab/sheet/menu/handler giao cũ; không import các thành phần đã gỡ; SBD trần đi cùng hook', () => {
    const p = doc('src/screens/ParentPortalScreen.tsx').replace(/\/\/.*$/gm, '')
    for (const cam of ['tabPh', 'setTabPh', 'cheDoKhacPhuc', 'mucMenuPhuHuynh', 'KhoiKhacPhuc3CheDo', 'ModalKhacPhucCauSai', 'BangTinPhuHuynh', 'parentNewsApi', 'giaoHangNgay', 'napDeXuat', 'xuLyGiaoBai', 'xuLyTaoBaiCuaMom', 'momReviewHtml', 'guiTinNhan', 'KhungXemPhieu', 'NutQuayLai', 'boNaoPh', 'giaoBai=', 'onGiaoBai', 'useHopThoai'])
      expect(p, cam).not.toContain(cam)
    expect(p).toContain('canhBaoPh={canhBaoPh}')
    expect(p).toContain('onDoiSbd={dangXuat}')
    expect(p).toContain('khongGiaoBai')
  })
  it('BangNhiemVu: không còn prop/ô giao bài cũ; muc-menu không còn menu phụ huynh', () => {
    const b = doc('src/components/bang-nhiem-vu/BangNhiemVu.tsx')
    for (const cam of ['onGiaoBai', 'onGiaoHangNgay', 'giaoBai', 'onNhanThay', 'bnv-giao-bai', 'GiaoBaiHangNgay']) expect(b, cam).not.toContain(cam)
    expect(doc('src/components/bang-nhiem-vu/muc-menu.tsx')).not.toContain('mucMenuPhuHuynh')
  })
})
