// G4 · CA THI (app giáo viên M3, 21/09). Đổi phần NHÌN của màn theo dõi ca: khung hai cột, thẻ Thời gian, tab lọc + bảng học sinh.
// LUỒNG THI THẬT không đổi: mọi nút, câu cảnh báo, thứ tự thao tác giữ nguyên — test này khoá cả hai vế (cái mới CÓ và cái cũ CÒN).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import ExamMonitorScreen from '../src/screens/ExamMonitorScreen'
import KhoiThoiGianCa from '../src/components/KhoiThoiGianCa'
import ThanhTabCa from '../src/components/ThanhTabCa'
import { conLaiCa, demCauDaLam, dinhDangDongHo, tongSoCauCa } from '../src/lib/con-lai-ca'

const m = vi.hoisted(() => ({
  detail: vi.fn(),
  gio: { ms: Date.parse('2026-09-21T01:00:00Z') },
}))
vi.mock('../src/store/appStore', () => ({
  useAppStore: (select: (s: unknown) => unknown) =>
    select({ maCaTheoDoi: 'C1', classList: [{ sbd: '12007', hoTen: 'Trần Thu Hà' }], setScreen: vi.fn(), showToast: vi.fn() }),
}))
vi.mock('../src/lib/exam-db', async (original) => ({
  ...(await original<typeof import('../src/lib/exam-db')>()),
  loadScriptUrl: async () => 'https://local.test',
  loadTeacherSecret: async () => 'test-only',
  loadSessionTeacherBank: async () => null,
  docSoCauCa: async () => ({ I: 18, II: 4, III: 6 }),
  docDeRiengCa: async () => undefined,
  docCheDoDeRieng: async () => false,
}))
vi.mock('../src/lib/exam-api', async (original) => ({
  ...(await original<typeof import('../src/lib/exam-api')>()),
  chiTietCa: m.detail,
  danhSachCa: async () => [],
}))
vi.mock('../src/lib/gio-may-chu', () => ({ gioMayChu: () => m.gio.ms, dongBoGioMayChu: () => {}, daDongBoGio: () => true }))

const ISO = (ms: number) => new Date(ms).toISOString()
const BAY_GIO = Date.parse('2026-09-21T01:00:00Z')

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.clearAllMocks()
})

// ---------------------------------------------------------------- số liệu thuần
describe('con-lai-ca: chỉ có đồng hồ khi ca có MỘT giờ hết chung', () => {
  const ca = { trangThai: 'mo' as const, phongCho: true, batDauThiLuc: ISO(BAY_GIO - 19 * 60000), dongBoGio: true, thoiGianPhut: 50 }
  it('ca mở + đã bắt đầu + đồng bộ giờ: còn lại = bắt đầu + phút − bây giờ', () => {
    const r = conLaiCa(ca, BAY_GIO)
    expect(r?.conLaiMs).toBe(31 * 60000)
    expect(r?.hetLuc).toBe(ISO(BAY_GIO + 31 * 60000))
  })
  it('quá giờ thì 0, không âm', () => {
    expect(conLaiCa(ca, BAY_GIO + 3 * 3600000)?.conLaiMs).toBe(0)
  })
  it.each([
    ['tính giờ riêng từng em', { ...ca, dongBoGio: false }],
    ['chưa bấm Bắt đầu thi', { ...ca, batDauThiLuc: '' }],
    ['không bật phòng chờ', { ...ca, phongCho: false }],
    ['ca đã đóng', { ...ca, trangThai: 'dong' as const }],
    ['số phút không hợp lệ', { ...ca, thoiGianPhut: 0 }],
  ])('%s → null (không bịa đồng hồ)', (_ten, c) => {
    expect(conLaiCa(c, BAY_GIO)).toBeNull()
  })
  it('định dạng mm:ss và h:mm:ss', () => {
    expect(dinhDangDongHo(31 * 60000 + 46000)).toBe('31:46')
    expect(dinhDangDongHo(5000)).toBe('00:05')
    expect(dinhDangDongHo(3600000 + 5 * 60000 + 9000)).toBe('1:05:09')
    expect(dinhDangDongHo(-10)).toBe('00:00')
  })
})

describe('con-lai-ca: tiến độ = số câu đã trả lời / tổng số câu của đề', () => {
  it('đếm phần I có chọn, phần II có ít nhất một ý, phần III có gõ chữ', () => {
    expect(
      demCauDaLam({ phanI: { a: 'A', b: 'C' }, phanII: { c: ['D', null, null, null], d: [null, null, null, null] }, phanIII: { e: '0,5', f: '  ' } }),
    ).toBe(4)
    expect(demCauDaLam(null)).toBe(0)
  })
  it('tổng số câu chỉ có khi máy biết mẫu số — không đoán', () => {
    expect(tongSoCauCa({ I: 18, II: 4, III: 6 })).toBe(28)
    expect(tongSoCauCa(undefined)).toBeNull()
    expect(tongSoCauCa({ I: 0, II: 0, III: 0 })).toBeNull()
  })
})

// ---------------------------------------------------------------- thẻ Thời gian
describe('KhoiThoiGianCa', () => {
  const ca = { trangThai: 'mo' as const, phongCho: true, batDauThiLuc: ISO(BAY_GIO - 19 * 60000), dongBoGio: true, thoiGianPhut: 50, hetHanVao: ISO(BAY_GIO + 30 * 60000) }

  it('đồng bộ giờ: hiện 31:00 còn lại · 50 phút và ĐẾM NGƯỢC mỗi giây theo giờ máy chủ', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    m.gio.ms = BAY_GIO
    render(<KhoiThoiGianCa ca={ca} />)
    expect(screen.getByRole('timer').textContent).toBe('31:00')
    expect(screen.getByText('còn lại · 50 phút')).toBeTruthy()
    m.gio.ms = BAY_GIO + 2000
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByRole('timer').textContent).toBe('30:58')
  })

  it('tính giờ riêng từng em: KHÔNG có đồng hồ chung, nói thẳng như vậy', () => {
    m.gio.ms = BAY_GIO
    const { container } = render(<KhoiThoiGianCa ca={{ ...ca, dongBoGio: false }} />)
    expect(container.querySelector('[data-co-chung="khong"]')).toBeTruthy()
    expect(screen.getByRole('timer').textContent).toBe('50 phút')
    expect(container.textContent).toContain('mỗi em tính giờ riêng')
  })

  it('chưa bấm Bắt đầu thi: nói em đang ở phòng chờ; ca đóng: nói ca đã đóng', () => {
    const { container, rerender } = render(<KhoiThoiGianCa ca={{ ...ca, batDauThiLuc: '' }} />)
    expect(container.textContent).toContain('chưa bắt đầu · em đang ở phòng chờ')
    rerender(<KhoiThoiGianCa ca={{ ...ca, trangThai: 'dong' }} />)
    expect(container.textContent).toContain('ca đã đóng')
  })
})

// ---------------------------------------------------------------- tab
describe('ThanhTabCa', () => {
  const muc = [
    { ma: 'a', nhan: 'Tất cả', so: 8 },
    { ma: 'b', nhan: 'Đang làm', so: 5 },
    { ma: 'c', nhan: 'Đã nộp', so: 3 },
  ]
  it('tablist: chỉ tab đang chọn nhận tab-index 0, aria-selected đúng, có số đếm', () => {
    render(<ThanhTabCa muc={muc} dangChon="b" doi={vi.fn()} idBang="bang" />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false'])
    expect(tabs.map((t) => t.getAttribute('tabindex'))).toEqual(['-1', '0', '-1'])
    expect(tabs[1].textContent).toBe('Đang làm · 5')
    expect(tabs[1].getAttribute('aria-controls')).toBe('bang')
  })
  it('phím mũi tên / Home / End chuyển tab (vòng tròn)', () => {
    const doi = vi.fn()
    render(<ThanhTabCa muc={muc} dangChon="c" doi={doi} idBang="bang" />)
    const tabC = screen.getByRole('tab', { name: /Đã nộp/ })
    fireEvent.keyDown(tabC, { key: 'ArrowRight' })
    expect(doi).toHaveBeenLastCalledWith('a')
    fireEvent.keyDown(tabC, { key: 'ArrowLeft' })
    expect(doi).toHaveBeenLastCalledWith('b')
    fireEvent.keyDown(tabC, { key: 'Home' })
    expect(doi).toHaveBeenLastCalledWith('a')
    fireEvent.keyDown(tabC, { key: 'End' })
    expect(doi).toHaveBeenLastCalledWith('c')
  })
})

// ---------------------------------------------------------------- màn thật
const luot = (sbd: string, hoTen: string, trangThai: string, o: Record<string, unknown> = {}) => ({
  sbd,
  hoTen,
  lanThu: 1,
  trangThai,
  vaoLuc: ISO(BAY_GIO - 18 * 60000),
  hetGioLuc: ISO(BAY_GIO + 32 * 60000),
  nopLuc: trangThai === 'da_nop' ? ISO(BAY_GIO - 4 * 60000) : '',
  soLanRoiMan: 0,
  tongGiayRoiMan: 0,
  diemI: null,
  diemII: null,
  diemIII: null,
  tong: null,
  duyetBoi: '',
  duyetLuc: '',
  ghiChu: '',
  dapAn: { phanI: { q1: 'A', q2: 'B', q3: 'C' }, phanII: {}, phanIII: {} },
  integrity: null,
  giayCau: null,
  ...o,
})
const CA = {
  maCa: 'C1',
  tenCa: 'Kiểm tra Chương 1',
  loai: 'thi',
  lop: '12A1',
  phongCho: true,
  batDauThiLuc: ISO(BAY_GIO - 19 * 60000),
  dongBoGio: true,
  thoiGianPhut: 50,
  trangThai: 'mo',
  phamVi: 'tu_do',
  congBo: 'khong',
  hetHanVao: ISO(BAY_GIO + 30 * 60000),
  batDau: ISO(BAY_GIO - 19 * 60000),
  moLuc: ISO(BAY_GIO - 19 * 60000),
  danhSachMoi: '',
  nguoiTao: '',
}
const DS = [
  luot('12001', 'Nguyễn Minh Khôi', 'dang_lam'),
  luot('12002', 'Lê Hoàng Nam', 'khoa', { soLanRoiMan: 3, tongGiayRoiMan: 41, integrity: { leaveCount: 3, totalHiddenMs: 41000, events: [], blocked: true } }),
  luot('12003', 'Vũ Đức Anh', 'dang_lam', { soLanRoiMan: 1, tongGiayRoiMan: 9 }),
  luot('12004', 'Hoàng Mai Chi', 'da_nop', { diemI: 2.25, diemII: 2.5, diemIII: 1.5, tong: 6.25 }),
]

describe('ExamMonitorScreen: khung + tab + bảng (chỉ đổi phần nhìn)', () => {
  beforeEach(() => {
    m.gio.ms = BAY_GIO
    m.detail.mockImplementation(async () => ({ ca: { ...CA }, luot: DS.map((l) => ({ ...l })), dsCho: [{ sbd: '12007', hoTen: '', vaoLuc: ISO(BAY_GIO - 60000) }], biChan: [] }))
  })
  const mo = async () => {
    const r = render(<ExamMonitorScreen />)
    await screen.findByRole('tablist', { name: 'Lọc học sinh theo trạng thái' })
    return r
  }
  const hang = (c: HTMLElement) => Array.from(c.querySelectorAll('.ca-hang')).map((h) => h.getAttribute('data-trang-thai'))

  it('hai cột: cột phải có thẻ Thời gian ĐẾM NGƯỢC, cột trái có bảng học sinh', async () => {
    const { container } = await mo()
    const phai = container.querySelector('.ca-cot-phai') as HTMLElement
    const trai = container.querySelector('.ca-cot-trai') as HTMLElement
    expect(within(phai).getByRole('timer').textContent).toBe('31:00')
    expect(phai.querySelector('.gv-monitor-overview')).toBeTruthy()
    expect(trai.querySelector('.gv-monitor-students')).toBeTruthy()
    expect(trai.querySelector('#ca-bang-em')).toBeTruthy()
  })

  it('mặc định tab TẤT CẢ: đủ mọi em (không ẩn ai lúc mới mở); số đếm ở tab khớp dữ liệu', async () => {
    const { container } = await mo()
    const tabs = screen.getAllByRole('tab').map((t) => t.textContent)
    expect(tabs).toEqual(['Tất cả · 4', 'Đang làm · 2', 'Phòng chờ · 1', 'Đã nộp · 2'])
    expect(screen.getByRole('tab', { name: /Tất cả/ }).getAttribute('aria-selected')).toBe('true')
    expect(hang(container).sort()).toEqual(['Bị khoá', 'Đang làm', 'Rời màn 1 lần', 'Đã nộp'].sort())
  })

  it('tab Đang làm chỉ hiện em đang làm; tab Đã nộp hiện em nộp + em bị khoá; quay lại Tất cả thì đủ', async () => {
    const { container } = await mo()
    fireEvent.click(screen.getByRole('tab', { name: /Đang làm/ }))
    expect(hang(container).sort()).toEqual(['Rời màn 1 lần', 'Đang làm'].sort())
    fireEvent.click(screen.getByRole('tab', { name: /Đã nộp/ }))
    expect(hang(container).sort()).toEqual(['Bị khoá', 'Đã nộp'].sort())
    fireEvent.click(screen.getByRole('tab', { name: /Tất cả/ }))
    expect(hang(container)).toHaveLength(4)
  })

  it('tab Phòng chờ: hiện em đứng chờ (chưa có lượt), không có nút thao tác', async () => {
    const { container } = await mo()
    fireEvent.click(screen.getByRole('tab', { name: /Phòng chờ/ }))
    expect(hang(container)).toEqual(['Đang chờ'])
    const h = container.querySelector('.ca-hang') as HTMLElement
    expect(h.textContent).toContain('SBD 12007')
    expect(h.querySelector('button')).toBeNull()
  })

  it('ca không mời theo danh sách chọn ⇒ KHÔNG có tab "Chưa vào" (máy không biết sĩ số — không bịa)', async () => {
    await mo()
    expect(screen.queryByRole('tab', { name: /Chưa vào/ })).toBeNull()
  })

  it('ca "chọn từng em": có tab Chưa vào, liệt kê em được mời mà chưa có lượt', async () => {
    m.detail.mockImplementation(async () => ({ ca: { ...CA, phamVi: 'chon', danhSachMoi: ['12001', '12007', '12099'] }, luot: DS.map((l) => ({ ...l })), dsCho: [], biChan: [] }))
    const { container } = await mo()
    const tab = screen.getByRole('tab', { name: /Chưa vào/ })
    expect(tab.textContent).toBe('Chưa vào · 2')
    fireEvent.click(tab)
    expect(hang(container)).toEqual(['Chưa vào', 'Chưa vào'])
    expect(container.textContent).toContain('Trần Thu Hà') // tên tra từ danh sách lớp
    expect(container.textContent).toContain('SBD 12099')
  })

  it('cột: trạng thái · tiến độ x/28 · chống gian lận · điểm — số lấy từ bài đang lưu và mẫu số của ca', async () => {
    const { container } = await mo()
    const khoi = Array.from(container.querySelectorAll('.ca-hang')).find((h) => h.textContent?.includes('Nguyễn Minh Khôi')) as HTMLElement
    expect(khoi.querySelector('.ca-o-tien')?.textContent).toContain('3/28')
    expect(khoi.querySelector('.ca-o-gian')?.textContent).toBe('—')
    const nam = Array.from(container.querySelectorAll('.ca-hang')).find((h) => h.textContent?.includes('Lê Hoàng Nam')) as HTMLElement
    expect(nam.querySelector('.ca-o-gian')?.textContent).toContain('rời màn 3 lần / 41s') // chuỗi cảnh báo GIỮ NGUYÊN
    const chi = Array.from(container.querySelectorAll('.ca-hang')).find((h) => h.textContent?.includes('Hoàng Mai Chi')) as HTMLElement
    expect(chi.querySelector('.ca-o-diem')?.textContent).toContain('6.25')
    const anh = Array.from(container.querySelectorAll('.ca-hang')).find((h) => h.textContent?.includes('Vũ Đức Anh')) as HTMLElement
    expect(anh.querySelector('.ca-o-gian')?.textContent).toContain('9s ngoài màn')
  })

  it('MỌI NÚT THAO TÁC CŨ CÒN: Báo phụ huynh · Mở khoá · Cho thi lại — và luồng xác nhận vẫn hai bước', async () => {
    const { container } = await mo()
    const nam = Array.from(container.querySelectorAll('.ca-hang')).find((h) => h.textContent?.includes('Lê Hoàng Nam')) as HTMLElement
    expect(within(nam).getByRole('button', { name: 'Báo phụ huynh' })).toBeTruthy()
    fireEvent.click(within(nam).getByRole('button', { name: 'Mở khoá' }))
    expect(within(nam).getByRole('button', { name: 'Đồng ý mở khoá' })).toBeTruthy() // chưa mở cho tới khi thầy bấm Đồng ý
    fireEvent.click(within(nam).getByRole('button', { name: 'Huỷ' }))
    fireEvent.click(within(nam).getByRole('button', { name: 'Cho thi lại' }))
    expect(nam.textContent).toContain('Xoá hẳn điểm và bài làm lượt này của em, rút đề mới, và em chỉ vào lại được ở đúng máy cũ. Không khôi phục được.')
    expect(within(nam).getByRole('button', { name: 'Xoá lượt cũ và cho thi lại' })).toBeTruthy()
  })

  it('chạm tên em vẫn mở hồ sơ (nút tên nằm trong ô Học sinh)', async () => {
    const { container } = await mo()
    const khoi = Array.from(container.querySelectorAll('.ca-hang')).find((h) => h.textContent?.includes('Nguyễn Minh Khôi')) as HTMLElement
    expect(khoi.querySelector('.ca-o-em button')?.textContent).toContain('Nguyễn Minh Khôi')
  })

  it('thẻ thông tin ca còn nguyên các khối thao tác của luồng thi thật (Mở ca · Khoá ca · link · Xoá ca)', async () => {
    const { container } = await mo()
    const phai = container.querySelector('.ca-cot-phai') as HTMLElement
    for (const ten of [/Mở ca/, /Khoá ca/, /Link vào thi/, /Link xem điểm/, /Xoá ca này/]) expect(within(phai).getAllByRole('button', { name: ten }).length).toBeGreaterThan(0)
  })

  it('dữ liệu tab lọc là ĐỔI CÁI HIỆN — không gọi thêm lệnh máy chủ nào khi đổi tab', async () => {
    await mo()
    const truoc = m.detail.mock.calls.length
    fireEvent.click(screen.getByRole('tab', { name: /Đã nộp/ }))
    fireEvent.click(screen.getByRole('tab', { name: /Tất cả/ }))
    await waitFor(() => expect(m.detail.mock.calls.length).toBe(truoc))
  })
})

// ---------------------------------------------------------------- nguồn: cấm quay lại lối cũ
describe('nguồn màn theo dõi ca', () => {
  const src = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamMonitorScreen.tsx'), 'utf8')
  const css = fs.readFileSync(path.join(process.cwd(), 'src/screens/ca-thi-m3.css'), 'utf8')
  it('màn nhập css riêng và dùng thẻ Thời gian + thanh tab', () => {
    expect(src).toContain("import './ca-thi-m3.css'")
    expect(src).toMatch(/<KhoiThoiGianCa\s+ca=\{chiTiet\.ca\}/) // nay có thêm prop themPhut (thầy duyệt 21/09)
    expect(src).toContain('<ThanhTabCa ')
  })
  it('các câu cảnh báo của luồng thi thật còn nguyên trong nguồn', () => {
    for (const cau of [
      'Khoá ca: em đang làm bị nộp ngay theo phần đã làm, em chưa vào thì không vào được nữa.',
      'Mở ca lại được, nhưng em đã bị nộp thì phải duyệt thi lại từng em.',
      'rời màn {l.soLanRoiMan} lần / {l.tongGiayRoiMan}s',
      'Đồng ý mở khoá',
      'Xoá lượt cũ và cho thi lại',
    ])
      expect(src).toContain(cau)
  })
  it('css M3: không mã màu hex, không !important, bảng đổi cột theo bề rộng cột trái (container query)', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(css).not.toContain('!important')
    expect(css).toContain('@container ca-trai (min-width: 600px)')
  })
})
