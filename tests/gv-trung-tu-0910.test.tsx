// TRUNG TU GIAO DIỆN APP THẦY (thầy duyệt bản vẽ HeThong · GV-HomNay · GV-HocSinh · GV-MoCa ngày 09/10, "build luôn") — chế độ Game Hóa 2.0:
//   · lỗi tải nói bằng câu dễ hiểu (không "Cannot read properties…");
//   · MỘT bảng lam: bảng ngọc của teacher-modern.css chỉ áp khi cờ 2.0 TẮT; thẻ hiện ra 200ms cho cả hai họ thẻ; nhãn thanh đáy ≥ 12px;
//   · "Cần thầy chữa" một màu (hổ phách) ở thanh bên và Hôm nay;
//   · Học sinh 2.0: một thanh lọc (ô tìm + Khối/Lớp/Học phí), bảng "SBD 1201", chia trang 25 em, nút ⋯ gom thao tác, không lặp lọc học phí.
import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { laLoiKyThuat, loiDeHieu, lyDoDeHieu } from '../src/lib/loi-de-hieu'

const m = vi.hoisted(() => ({ goi: vi.fn(), moHoSoEm: vi.fn(), toast: vi.fn(), reset: vi.fn(), ds: { v: [] as unknown[] }, loiDs: { v: '' } }))
vi.mock('../src/store/appStore', () => ({
  useAppStore: (sel: (s: Record<string, unknown>) => unknown) =>
    sel({ sbdDangXem: '', moHoSoEm: m.moHoSoEm, showToast: m.toast, setScreen: vi.fn(), moChiTietCa: vi.fn(), datSbdGiaoRieng: vi.fn(), screen: 'hocsinh' }),
}))
vi.mock('../src/lib/exam-db', () => ({ loadScriptUrl: async () => 'https://x', loadTeacherSecret: async () => 'mat' }))
vi.mock('../src/lib/exam-api', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  danhSachEm: async () => {
    if (m.loiDs.v) throw new TypeError(m.loiDs.v)
    return m.ds.v
  },
  resetMatKhauHsApi: (...a: unknown[]) => m.reset(...a),
}))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => m.goi(duong, body) }))
vi.mock('../src/lib/hoc-phi', async (goc) => {
  const g = await goc<typeof import('../src/lib/hoc-phi')>()
  return {
    ...g,
    taiHocPhi: async () => new Map(Array.from({ length: 30 }, (_, i) => [String(1200 + i), { sbd: String(1200 + i), phaiNop: 4_500_000, daNop: i % 2 ? 0 : 4_500_000, ghiChu: '', soLan: 0 }])),
  }
})
vi.mock('../src/components/NutDongBoDanhSach', () => ({ default: ({ kieu }: { kieu?: string }) => <button type="button" data-kieu={kieu}>Dán link danh sách</button> }))
vi.mock('../src/components/NutThemHocSinh', () => ({ default: ({ kieu }: { kieu?: string }) => <button type="button" data-kieu={kieu}>Thêm học sinh</button> }))

const { useCoHoa2 } = await import('../src/components/chien-dich/co-hoa2')
const { soDemMuc } = await import('../src/components/ThanhBenTrai')
const { default: HocSinhScreen } = await import('../src/screens/HocSinhScreen')
const { chuDau, SO_EM_MOT_TRANG } = await import('../src/screens/HocSinhDanhSachV2')

const doc = (f: string) => fs.readFileSync(path.join(process.cwd(), f), 'utf8')

const emGia = (i: number) => ({ sbd: String(1200 + i), hoTen: `Nguyễn Văn Em ${i}`, namSinh: '2009', lop: '12A1', trangThai: 'trong_danh_sach', soCa: 2, diemGanNhat: i === 0 ? 8 : null, caGanNhat: '', nopGanNhat: '' })

describe('lỗi dễ hiểu (một luật cho mọi màn thầy)', () => {
  it('lỗi kỹ thuật thô ⇒ "Mạng có thể đang chập chờn."; câu tiếng Việt viết sẵn ⇒ giữ', () => {
    expect(laLoiKyThuat("Cannot read properties of undefined (reading 'map')")).toBe(true)
    expect(laLoiKyThuat('Failed to fetch')).toBe(true)
    expect(laLoiKyThuat('Unexpected token < in JSON at position 0')).toBe(true)
    expect(laLoiKyThuat('HTTP 502')).toBe(true)
    expect(laLoiKyThuat('')).toBe(true)
    expect(laLoiKyThuat('Hết thời gian chờ máy chủ')).toBe(false)
    expect(lyDoDeHieu(new Error('Chưa kết nối máy chủ — vào Cài đặt › Kết nối máy chủ'))).toBe('Chưa kết nối máy chủ — vào Cài đặt › Kết nối máy chủ.')
    expect(lyDoDeHieu(new TypeError('danh sách hỏng'))).toBe('Mạng có thể đang chập chờn.')
    expect(lyDoDeHieu("Cannot read properties of undefined (reading 'map')")).toBe('Mạng có thể đang chập chờn.')
    expect(loiDeHieu(new Error('Máy chủ trả lời chậm — thầy thử lại.'), 'học phí')).toBe('Chưa tải được học phí. Máy chủ trả lời chậm — thầy thử lại.')
  })
})

describe('một bảng lam · thang chung (nguồn CSS)', () => {
  it('teacher-modern.css: bảng ngọc (--m3-*) và khối tối của nó CHỈ khi cờ 2.0 tắt — 2.0 theo --gvm-* (gv-mau.css)', () => {
    const css = doc('src/styles/teacher-modern.css')
    const khoi = [...css.matchAll(/([^{}]+)\{([^{}]*--m3-primary:[^{}]*)\}/g)]
    expect(khoi.length).toBe(2)
    for (const k of khoi) expect(k[1]).toContain('.m3.vo-thay:not([data-hoa2])')
    expect(doc('src/styles/gv-mau.css')).toMatch(/\.m3\.vo-thay \{\s*--m3-primary: var\(--gvm-xd\);/)
  })

  it('gv-mau.css: thẻ hiện ra 200ms theo thang chung, cho CẢ HAI họ thẻ (gv2-the · gvv2-the); không còn 0.5s', () => {
    const css = doc('src/styles/gv-mau.css')
    const k = /prefers-reduced-motion: no-preference\)\s*\{([\s\S]*?)\n\}/.exec(css)![1]!
    expect(k).toContain('.vo-thay .gv2-the,')
    expect(k).toContain('.vo-thay .gvv2-the')
    expect(k).toMatch(/animation: gvm-len var\(--cd-doi-muc, 200ms\)/)
    expect(css).not.toMatch(/gvm-len 0\.5s/)
  })

  it('thanh đáy 2.0: nhãn không dưới 12px; giảm chuyển động tắt hover phóng/trượt; mọi màn 2.0 cùng bề rộng 1320', () => {
    const css = doc('src/components/thanh-ben-gv2.css')
    const co = [...css.matchAll(/\.day-thay-muc \{[^}]*font-size: ([\d.]+)px/g)].map((x) => Number(x[1]))
    expect(co.length).toBeGreaterThan(0)
    for (const c of co) expect(c).toBeGreaterThanOrEqual(12)
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.vo-thay :is\(\[class\*='hover:scale'\]/)
    expect(css).toMatch(/\.vo-thay\[data-hoa2\] \.giua-noi-dung \{\s*max-width: 1320px;/)
    expect(css).not.toContain('max-width: 1400px')
  })

  it('"Cần thầy chữa": cùng màu hổ phách ở số cạnh Hành trình (thanh bên) và dòng việc Hôm nay', () => {
    expect(soDemMuc('chiendich', { caMo: null, canThayChua: 4 })).toEqual({ chu: '4', nhan: 'Cần thầy chữa: 4 chỗ', tone: 'vang' })
    expect(doc('src/styles/gv-mau.css')).toMatch(/\.ben-trai-dem\[data-tone='vang'\] \{\s*background: var\(--gvm-hp-nen\);/)
    expect(doc('src/screens/GvHomNayScreen.tsx')).toMatch(/key: 'can-chua', mau: 'hp'/)
  })
})

describe('Học sinh 2.0 (bản vẽ GV-HocSinh)', () => {
  beforeEach(() => {
    useCoHoa2.getState().dat({ bat: true, lop: [], sbd: [] })
    m.ds.v = Array.from({ length: 30 }, (_, i) => emGia(i))
    m.loiDs.v = ''
    m.goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
      if (duong === '/gv/chien-dich' && b.action === 'danh-sach')
        return { ok: true, du: { homNay: '2026-10-09', chienDich: [{ id: 'ht-12', ten: 'Hành trình · Khối 12', lop: 'Khối 12', maDe: [], hanNop: '9999-12-31', theLucNgay: 30, huyetChien: false, maCa: null, taoLuc: '', trangThai: 'dang_chay', soCau: 0, soEm: 2, hetHan: false, hanhTrinh: true }] } }
      if (duong === '/gv/chien-dich' && b.action === 'bang')
        return { ok: true, du: { hanhTrinhNgay: { em: [{ sbd: '1200', ten: 'Em 0', tang: 2, toiThieu: 30, daLam: 12, daXep: 30, conThieu: 0 }, { sbd: '1201', ten: 'Em 1', tang: 1, toiThieu: 24, daLam: 0, daXep: 24, conThieu: 0 }] } } }
      return { ok: false, loai: 'chua_co_lenh', chu: 'Máy chủ chưa có lệnh.' }
    })
  })
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    useCoHoa2.getState().dat(null)
    localStorage.clear()
  })

  it('đầu màn: tiêu đề + "Dán link danh sách" (viền) + "Thêm học sinh" (chính); MỘT thanh lọc thay 3 hàng chip; không lặp lọc học phí', async () => {
    const { container } = render(<HocSinhScreen />)
    expect(await screen.findByRole('heading', { level: 1, name: 'Học sinh' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Dán link danh sách' }).getAttribute('data-kieu')).toBe('vien')
    expect(screen.getByRole('button', { name: 'Thêm học sinh' }).getAttribute('data-kieu')).toBe('chinh')
    const loc = screen.getByRole('search')
    expect(within(loc).getByRole('searchbox', { name: 'Tìm học sinh' })).toBeTruthy()
    expect(within(loc).getAllByRole('combobox').map((c) => c.getAttribute('aria-label'))).toEqual(['Lọc theo khối', 'Lọc theo lớp', 'Lọc theo học phí'])
    // không còn hàng chip lọc nào (khối / lớp / học phí) — kể cả hàng chip trong bảng tổng Học phí
    expect(screen.queryByRole('group', { name: 'Lọc theo khối' })).toBeNull()
    expect(screen.queryByRole('group', { name: 'Lọc theo học phí' })).toBeNull()
    await waitFor(() => expect(container.querySelector('[data-khoi="tong-hoc-phi"] .hp-tong-so')).toBeTruthy())
    expect(screen.queryByRole('group', { name: 'Lọc học sinh theo học phí' })).toBeNull()
  })

  it('bảng: chữ đầu + tên + "SBD 1200" (không "#1200"); Hôm nay a/b câu từ Hành trình; Ca gần nhất a/10 điểm; nhãn học phí; chia trang 25 em', async () => {
    const { container } = render(<HocSinhScreen />)
    const bang = await screen.findByRole('table')
    expect(screen.getAllByRole('columnheader').map((c) => c.textContent)).toEqual(['Em', 'Lớp', 'Hôm nay', 'Ca gần nhất', 'Học phí', 'Thao tác'])
    expect(bang.querySelectorAll('tbody tr')).toHaveLength(SO_EM_MOT_TRANG)
    const dau = bang.querySelector('tbody tr')!
    expect(dau.textContent).toContain('SBD 1200')
    expect(container.textContent).not.toMatch(/#1200/)
    expect(dau.querySelector('.gvv2-avatar')?.textContent).toBe('E0')
    expect(dau.textContent).toContain('8,0/10 điểm')
    await waitFor(() => expect(dau.textContent).toContain('12/30 câu'))
    await waitFor(() => expect(within(dau as HTMLElement).getByRole('button', { name: /^Học phí của Nguyễn Văn Em 0: Đã nộp đủ/ })).toBeTruthy())
    expect(bang.querySelectorAll('tbody tr')[1]!.textContent).toContain('0/24 câu')
    expect(bang.querySelectorAll('tbody tr')[2]!.textContent).toContain('Chưa xếp')
    expect(bang.querySelectorAll('tbody tr')[2]!.textContent).toContain('Chưa có ca')
    const trang = screen.getByRole('navigation', { name: 'Chia trang danh sách học sinh' })
    expect(trang.textContent).toContain('Em 1–25 trên 30')
    expect((within(trang).getByRole('button', { name: 'Trang trước' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(within(trang).getByRole('button', { name: 'Trang sau' }))
    expect(trang.textContent).toContain('Em 26–30 trên 30')
    expect(screen.getByRole('table').querySelectorAll('tbody tr')).toHaveLength(5)
    // lọc học phí ⇒ về trang đầu, chỉ em chưa nộp
    await waitFor(() => expect((screen.getByRole('combobox', { name: 'Lọc theo học phí' }) as HTMLSelectElement).disabled).toBe(false))
    fireEvent.change(screen.getByRole('combobox', { name: 'Lọc theo học phí' }), { target: { value: 'chua_nop' } })
    expect(screen.getByRole('table').querySelectorAll('tbody tr')).toHaveLength(15)
    expect(screen.queryByRole('navigation', { name: 'Chia trang danh sách học sinh' })).toBeNull()
  })

  it('nút ⋯: thực đơn gom thao tác của một em (đúng hàm cũ); Esc đóng và trả focus', async () => {
    render(<HocSinhScreen />)
    const nut = await screen.findByRole('button', { name: 'Thao tác cho em Nguyễn Văn Em 0' })
    expect(nut.getAttribute('aria-haspopup')).toBe('menu')
    fireEvent.click(nut)
    const td = screen.getByRole('menu', { name: 'Thao tác cho em Nguyễn Văn Em 0' })
    expect(within(td).getAllByRole('menuitem').map((x) => x.textContent?.replace(/ · .*/, ''))).toEqual(['Mở hồ sơ', 'Báo cáo ca gần nhất', 'Lịch sử ca (2)', 'Học phí', 'Đặt lại mật khẩu'])
    fireEvent.click(within(td).getByRole('menuitem', { name: 'Mở hồ sơ' }))
    expect(m.moHoSoEm).toHaveBeenCalledWith('1200')
    expect(screen.queryByRole('menu')).toBeNull()
    fireEvent.click(nut)
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()
    expect(document.activeElement).toBe(nut)
    fireEvent.click(nut)
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Đặt lại mật khẩu' }))
    // cùng hộp xác nhận cũ (nói thật hậu quả) — chưa gọi lệnh khi thầy chưa xác nhận
    expect(await screen.findByText(/sẽ về mật khẩu mặc định/)).toBeTruthy()
    expect(m.reset).not.toHaveBeenCalled()
  })

  it('lỗi tải danh sách: câu dễ hiểu + Thử lại, KHÔNG in "Cannot read properties…"; chờ tải là khung xương', async () => {
    m.loiDs.v = "Cannot read properties of undefined (reading 'map')"
    const { container } = render(<HocSinhScreen />)
    expect(screen.getByRole('status', { name: 'Đang tải danh sách học sinh' }).querySelectorAll('.tt-xuong').length).toBeGreaterThan(4)
    const loi = await screen.findByRole('alert')
    expect(loi.textContent).toContain('Chưa tải được danh sách học sinh. Mạng có thể đang chập chờn.')
    expect(within(loi).getByRole('button', { name: 'Thử lại' })).toBeTruthy()
    expect(container.textContent).not.toMatch(/Cannot read|undefined/)
  })

  // 09/10 tối: thẻ Nhịp hôm nay rời Hành trình ⇒ Hôm nay › "Xem danh sách" / dòng khối mở màn này, lọc sẵn khối (đọc một lần rồi xoá).
  it('Hôm nay bấm khối ⇒ ô Khối lọc sẵn khối ấy, yêu cầu xoá sau khi đọc; lần mở sau về "Tất cả"', async () => {
    const { useSoDemGv } = await import('../src/lib/so-dem-gv')
    useSoDemGv.getState().datKhoiHocSinh(12)
    const lan1 = render(<HocSinhScreen />)
    const khoi = (await screen.findByRole('combobox', { name: 'Lọc theo khối' })) as HTMLSelectElement
    expect(khoi.value).toBe('12')
    await waitFor(() => expect(useSoDemGv.getState().khoiHocSinh).toBeNull())
    lan1.unmount()
    render(<HocSinhScreen />)
    expect(((await screen.findByRole('combobox', { name: 'Lọc theo khối' })) as HTMLSelectElement).value).toBe('')
  })

  it('chữ đầu trong ô tròn: hai từ cuối của tên; chưa có tên ⇒ hai số cuối SBD', () => {
    expect(chuDau('Nguyễn Minh Anh', '1201')).toBe('MA')
    expect(chuDau('  Đặng   ánh ', '1')).toBe('ĐÁ')
    expect(chuDau('', '11017')).toBe('17')
  })

  it('cờ TẮT ⇒ danh sách cũ giữ nguyên (ba hàng chip, "#SBD")', async () => {
    useCoHoa2.getState().dat(null)
    const { container } = render(<HocSinhScreen />)
    await waitFor(() => expect(container.textContent).toContain('#1200'))
    expect(screen.getByRole('group', { name: 'Lọc theo khối' })).toBeTruthy()
    expect(screen.queryByRole('search')).toBeNull()
  })
})
