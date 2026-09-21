// APP PHỤ HUYNH — MỘT MÀN, MỘT NÚT (thầy lệnh 21/09; Nhật ký 97f3abe; Boss: "trên cây màn PH chỉ còn ĐÚNG MỘT nút hành động chính"): menu ba chấm, tab Xem điểm/Khắc phục/Bảng tin, giao nhanh, giao bài cũ (parent-news,
// KhoiKhacPhuc, hộp khắc phục), Bộ não/thư tuần, Vinh danh, việc hôm nay dạng Bảng nhiệm vụ ĐÃ GỠ. Nay (app phụ huynh MỚI, thầy chốt mẫu 14:37): màn chính + bảng "Mọi thứ về con" (tests/ph-moi-*.test.*) — tệp này giữ CHỐT CHẶN.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import ParentPortalScreen from '../src/screens/ParentPortalScreen'
import BaoCaoCaThiPhuHuynhModal from '../src/components/BaoCaoCaThiPhuHuynhModal'
import { chuBanApp } from '../src/lib/cap-nhat-app'
import { PH_OK } from './_ph-moi/du-lieu-mau'

const goi: string[] = []
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrl: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({
  ...(await original<any>()),
  tenTheoSbd: async () => ({ sbd: '12121212', hoTen: 'Đỗ Minh', lop: '12A1', tenCa: '' }),
  hsCauSaiApi: async () => ({ ok: true, items: [{ qid: 'q1', phan: 'I', maCa: 'CA-ANCOL', text: 'Câu sai 1', dapAnDung: 'A', choices: { A: 'a', B: 'b', C: 'c', D: 'd' }, mucDo: 'hieu' }] }),
}))
const CANH_BAO = { id: 'cb-1', maBtvn: 'BT-1', tenBtvn: 'BTVN Este', guiLuc: '2026-09-21T01:00:00Z', hanNop: '2026-09-22T05:00:00Z', loi: 'Thầy nhắc con nộp bài trước 12:00.', trangThaiEm: 'chua_mo', chang: null, daXem: false }
vi.mock('../src/lib/bo-nao-lay-loi-ph', () => ({ taiThongTinPhuHuynh: async () => ({ boNao: { ngay: '2026-09-21', loiNhan: 'Lời Bộ não CHO PH', thuTuan: 'Thư tuần CHO PH', tuanTu: '2026-09-14' }, canhBao: [CANH_BAO] }) }))

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
// Chuỗi của MỌI tính năng đã gỡ: không một chuỗi nào được còn trên cây màn PH.
const CAM_CU = [/Báo cáo điểm các ca/i, /Giao bài khắc phục/i, /Bảng tin của con/i, /Giao nhanh/i, /Khắc phục lỗi sai/i, /Luyện đề \(4 lựa chọn\)/i, /Nhắn Thầy/, /Giao bài cho con/, /Tạo bài luyện khắc phục/i, /Xem tất cả về con/, /Lời Bộ não CHO PH/, /Thư tuần CHO PH/, /Mở menu/, /Đóng toàn màn hình/, /Quay lại Bảng tin/, /Vinh danh/]

beforeEach(() => {
  goi.length = 0
  window.history.replaceState(null, '', '/?vai=phuhuynh')
  localStorage.setItem('omr_ph_sbd', '12121212')
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('fetch', vi.fn(async (url: string, o?: any) => {
    goi.push(`${String(url).replace('https://may.test', '')} ${o?.body ?? ''}`)
    const js = (t: unknown) => ({ ok: true, status: 200, json: async () => t, text: async () => JSON.stringify(t) })
    if (String(url).endsWith('/ph/giao-them')) return js({ ok: true, conLaiHomNay: 3 })
    if (String(url).endsWith('/ph/tat-ca-ve-con')) return js(PH_OK)
    return js({ ok: true, items: [], winners: [] })
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
    await waitFor(() => expect(container.querySelector('[data-vung="hom-nay"]')).toBeTruthy())
    await waitFor(() => expect(container.textContent).toContain('Hôm nay còn 3 lượt giao'))
    const chinh = container.querySelectorAll('.phm-nut--chinh')
    expect(chinh).toHaveLength(1)
    expect(chinh[0]!.textContent).toContain('Giao thêm bài cho con')
    const ten = (e: Element) => `${e.textContent} ${e.getAttribute('aria-label') ?? ''} ${e.getAttribute('title') ?? ''}`
    const chu = [container.textContent ?? '', ...[...container.querySelectorAll('button,[role],[title],[aria-label],a')].map(ten)].join('\n')
    for (const cam of CAM_CU) expect(chu, String(cam)).not.toMatch(cam)
    expect(container.querySelector('[role="menu"], .bnv-menu, .bnv, [role="tablist"]')).toBeNull()
    expect(document.querySelector('.fixed.inset-0')).toBeNull() // không sheet toàn màn
  })

  it('MỌI nút bấm được trên màn chính khớp danh sách hữu hạn: thẻ Hôm nay của con · thẻ Ca kiểm tra gần nhất · "Đã xem" · "Giao thêm bài cho con" · "Đổi số báo danh"', async () => {
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="ca-gan-nhat"]')).toBeTruthy())
    const ten = [...container.querySelectorAll('button')].map((b) => (b.getAttribute('aria-label') || b.textContent || '').replace(/\s+/g, ' ').trim())
    for (const t of ten) expect(t, t).toMatch(/^(Hôm nay của con: .*Xem mọi thứ về con|Ca kiểm tra gần nhất của con: .*Xem trong bảng|Đã xem|Giao thêm bài cho con|Đổi số báo danh)$/)
    expect(ten.filter((t) => t === 'Giao thêm bài cho con')).toHaveLength(1)
    expect(ten.filter((t) => t === 'Đổi số báo danh')).toHaveLength(1)
  })

  it('lời Bộ não / thư tuần KHÔNG hiện dù lệnh /ph/ke-hoach có trả; dải cảnh báo của thầy vẫn còn (thụ động)', async () => {
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
    expect(chan.querySelector('span')!.textContent).toBe(chuBanApp())
    expect(doc('src/components/ph-moi/ph-moi-them.css')).toMatch(/\.phm-chan__nut \{[^}]*min-height: 48px/)
    fireEvent.click(screen.getByRole('button', { name: 'Đổi số báo danh' }))
    await screen.findByRole('button', { name: 'Vào xem kết quả của con' })
    expect(localStorage.getItem('omr_ph_sbd')).toBeNull()
  })

  it('không gọi /parent-news, /mom/*, /hs/lich-su, /hs/ke-hoach-ngay, /hs/btvn (luồng cũ); chỉ /ph/tat-ca-ve-con + /ph/giao-them chiXem (+ /ph/ke-hoach cho cảnh báo)', async () => {
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.textContent).toContain('Hôm nay còn 3 lượt giao'))
    expect(goi.filter((g) => /parent-news|\/mom\/|hs\/lich-su|hs\/ke-hoach|hs\/btvn|hs\/cau-sai/.test(g))).toEqual([])
    expect(goi.filter((g) => g.startsWith('/ph/giao-them'))).toEqual(['/ph/giao-them {"sbd":"12121212","chiXem":true}'])
    expect(goi.filter((g) => g.startsWith('/ph/tat-ca-ve-con'))).toEqual(['/ph/tat-ca-ve-con {"sbd":"12121212"}'])
  })
})

describe('hộp báo cáo PH — chế độ khongGiaoBai (còn dùng nếu nơi khác mở hộp này)', () => {
  const baiThi = { maCa: 'CA-1', tenCa: 'Ca 1', ngayNop: '2026-09-15T10:00:00Z', diem: 6, tong: 6, tongSoCau: 28, soCauDung: 20, soCauSai: 8 }
  const ve = (khong: boolean) => render(<BaoCaoCaThiPhuHuynhModal baiThi={baiThi as any} hoTenCon="Minh" sbd="12121212" scriptUrl="/test" onClose={() => {}} khongGiaoBai={khong} onGiaoBaiChoCon={() => {}} onNhanTinChoThay={() => {}} />)
  it('bật ⇒ lời khuyên không chỉ tới nút đã gỡ; tắt (mặc định cũ) ⇒ nút "Tạo bài luyện khắc phục" vẫn có', async () => {
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
  it('ParentPortalScreen: không tab/sheet/menu/handler giao cũ; không import các thành phần đã gỡ; SBD trần đi cùng hook; dải cảnh báo qua ManChinh', () => {
    const p = doc('src/screens/ParentPortalScreen.tsx').replace(/\/\/.*$/gm, '')
    for (const cam of ['tabPh', 'setTabPh', 'cheDoKhacPhuc', 'mucMenuPhuHuynh', 'KhoiKhacPhuc3CheDo', 'ModalKhacPhucCauSai', 'BangTinPhuHuynh', 'parentNewsApi', 'giaoHangNgay', 'napDeXuat', 'xuLyGiaoBai', 'xuLyTaoBaiCuaMom', 'momReviewHtml', 'guiTinNhan', 'KhungXemPhieu', 'NutQuayLai', 'boNaoPh', 'giaoBai=', 'onGiaoBai', 'useHopThoai', 'BangNhiemVu', 'BaoCaoCaThiPhuHuynhModal', 'TheVinhDanh', 'useKeHoachNgay', 'hsLichSuCaApi', 'hsBtvnApi'])
      expect(p, cam).not.toContain(cam)
    expect(p).toContain('canhBao={canhBaoPh}')
    expect(p).toContain('onDoiSbd={dangXuat}')
    expect(p).toContain('const giaoThem = useGiaoThem(!!sbdHienTai, undefined, sbdHienTai ?? undefined)')
  })
  it('BangNhiemVu: không còn prop/ô giao bài cũ; muc-menu không còn menu phụ huynh', () => {
    const b = doc('src/components/bang-nhiem-vu/BangNhiemVu.tsx')
    for (const cam of ['onGiaoBai', 'onGiaoHangNgay', 'giaoBai', 'onNhanThay', 'bnv-giao-bai', 'GiaoBaiHangNgay']) expect(b, cam).not.toContain(cam)
    expect(doc('src/components/bang-nhiem-vu/muc-menu.tsx')).not.toContain('mucMenuPhuHuynh')
  })
})
