// XEM ĐIỂM BẢN 2 · GV-2 — trang "Báo cáo một em" nối vào màn Theo dõi ca THẬT: chạm tên em ⇒ mở trang (thay hộp báo cáo cũ ở đường của thầy),
// tính đúng MỘT lượt khi mở, hai nút việc tiếp gọi đúng hành động của app thầy, quay lại/Esc đóng, em chưa nộp ⇒ "Chưa có báo cáo".
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import ExamMonitorScreen from '../src/screens/ExamMonitorScreen'

const m = vi.hoisted(() => ({ setScreen: vi.fn(), moToanCanh: vi.fn(), datSbdGiaoRieng: vi.fn(), detail: vi.fn(), tao: vi.fn(), gio: { ms: Date.parse('2026-09-21T01:00:00Z') }, bankMuon: { bat: false } }))
vi.mock('../src/store/appStore', () => ({
  useAppStore: (select: (s: unknown) => unknown) => select({ maCaTheoDoi: 'C1', classList: [], setScreen: m.setScreen, showToast: vi.fn(), moToanCanh: m.moToanCanh, datSbdGiaoRieng: m.datSbdGiaoRieng }),
}))
const NGAN_HANG = [
  {
    maDe: 'C1',
    phanI: [1, 2, 3].map((i) => ({ id: `q${i}`, text: `Câu ${i}`, choices: ['a', 'b', 'c', 'd'], correct: 'A', chuyenDe: 'CD:Glycerol', mucDo: 'nb' })),
    phanII: [],
    phanIII: [],
  },
]
vi.mock('../src/lib/exam-db', async (original) => ({
  ...(await original<typeof import('../src/lib/exam-db')>()),
  loadScriptUrl: async () => 'https://local.test',
  loadTeacherSecret: async () => 'test-only',
  loadSessionTeacherBank: async () => (m.bankMuon.bat ? null : NGAN_HANG),
  saveSessionTeacherBank: async () => {
    await new Promise((r) => setTimeout(r, 30)) // để màn vẽ MỘT lần với chi tiết ca nhưng chưa có ngân hàng
  },
  docSoCauCa: async () => (m.bankMuon.bat ? undefined : { I: 3, II: 0, III: 0 }),
  docDeRiengCa: async () => undefined,
  docCheDoDeRieng: async () => false,
}))
vi.mock('../src/lib/exam-api', async (original) => ({
  ...(await original<typeof import('../src/lib/exam-api')>()),
  chiTietCa: m.detail,
  danhSachCa: async () => [],
}))
vi.mock('../src/lib/gio-may-chu', () => ({ gioMayChu: () => m.gio.ms, dongBoGioMayChu: () => {}, daDongBoGio: () => true }))
vi.mock('../src/lib/chi-tiet-cau', async (original) => {
  const a = await original<typeof import('../src/lib/chi-tiet-cau')>()
  m.tao.mockImplementation(a.taoChiTietCau as never)
  return { ...a, taoChiTietCau: m.tao }
})

const BAY_GIO = m.gio.ms
const ISO = (ms: number) => new Date(ms).toISOString()
const luot = (sbd: string, hoTen: string, trangThai: string, chon: Record<string, string>) => ({
  sbd, hoTen, lanThu: 1, trangThai,
  vaoLuc: ISO(BAY_GIO - 18 * 60000), hetGioLuc: ISO(BAY_GIO + 32 * 60000), nopLuc: trangThai === 'da_nop' ? ISO(BAY_GIO - 4 * 60000) : '',
  soLanRoiMan: 0, tongGiayRoiMan: 0, diemI: null, diemII: null, diemIII: null, tong: null, duyetBoi: '', duyetLuc: '', ghiChu: '',
  dapAn: { phanI: chon, phanII: {}, phanIII: {} }, integrity: null, giayCau: null,
})
const DS = [
  luot('12001', 'Nguyễn Minh Khôi', 'da_nop', { q1: 'A', q2: 'A', q3: 'A' }),
  luot('12002', 'Lê Hoàng Nam', 'da_nop', { q1: 'B', q2: 'A', q3: 'C' }),
  luot('12003', 'Vũ Đức Anh', 'da_nop', { q1: 'A', q2: 'B', q3: 'B' }),
  luot('12004', 'Hoàng Mai Chi', 'dang_lam', { q1: 'A' }),
  { ...luot('12005', 'Cao Minh Tuệ', 'khoa', {}), soLanRoiMan: 4, tongGiayRoiMan: 130, dapAn: null }, // bị khoá, chưa có bài để chấm
]
const CA = (trangThai: 'mo' | 'dong') => ({
  maCa: 'C1', tenCa: 'Kiểm tra Chương 1', loai: 'thi', lop: '12A1', phongCho: false, batDauThiLuc: '', dongBoGio: false, thoiGianPhut: 50, trangThai,
  phamVi: 'tu_do', congBo: 'khong', hetHanVao: ISO(BAY_GIO + 30 * 60000), batDau: ISO(BAY_GIO - 19 * 60000), moLuc: ISO(BAY_GIO - 19 * 60000), danhSachMoi: '', nguoiTao: '',
})
const SO_EM_NOP = 3

beforeEach(() => {
  m.bankMuon.bat = false
  m.tao.mockClear()
  m.setScreen.mockClear()
  m.moToanCanh.mockClear()
  m.datSbdGiaoRieng.mockClear()
  m.detail.mockReset()
})
afterEach(() => cleanup())

const mo = async (trangThai: 'mo' | 'dong' = 'mo') => {
  m.detail.mockImplementation(async () => ({ ca: CA(trangThai), luot: DS.map((l) => ({ ...l })), dsCho: [], biChan: [] }))
  const r = render(<ExamMonitorScreen />)
  await screen.findByRole('tablist', { name: 'Lọc học sinh theo trạng thái' })
  return r
}
const chamTen = (ten: string) => fireEvent.click(screen.getByRole('button', { name: new RegExp(ten) }))
const trang = () => document.querySelector('.gv2-trang') as HTMLElement | null

describe('GV-2 · trang báo cáo một em trên màn Theo dõi ca thật', () => {
  it('chưa chạm em nào ⇒ chưa có trang và chưa tính gì cho trang', async () => {
    await mo()
    expect(trang()).toBeNull()
    expect(m.tao).not.toHaveBeenCalled() // khối lớp còn gập, trang chưa mở
  })

  it('chạm tên em đã nộp ⇒ mở trang có tên em, so với lớp, ba phần, câu cần xem lại; tính đúng MỘT lượt (mỗi em nộp một lần); hộp báo cáo cũ không còn dựng', async () => {
    await mo()
    chamTen('Lê Hoàng Nam')
    await waitFor(() => expect(trang()).toBeTruthy())
    const t = within(trang()!)
    expect(t.getByRole('heading', { level: 1 }).textContent).toBe('Báo cáo · Lê Hoàng Nam')
    expect(trang()!.textContent).toContain('Kiểm tra Chương 1 · 12A1 · SBD 12002 · 50 phút') // tên ca, lớp, SBD, số phút
    expect(trang()!.textContent).toContain('Nộp lúc 07:56 · Thứ Hai 21/09/2026') // giờ nộp của CHÍNH em ấy (giờ Việt Nam)
    for (const muc of ['So với cả lớp', 'Ba phần của bài', 'Câu cần xem lại']) expect(t.getByRole('heading', { name: muc })).toBeTruthy()
    expect(m.tao).toHaveBeenCalledTimes(SO_EM_NOP)
    expect(document.querySelector('.fixed.inset-0')).toBeNull() // khung hộp báo cáo cũ (portal) không có mặt
  })

  it('Quay lại ca và phím Esc đều đóng trang; cuộn nền trả lại', async () => {
    await mo()
    chamTen('Lê Hoàng Nam')
    await waitFor(() => expect(trang()).toBeTruthy())
    fireEvent.click(within(trang()!).getByRole('button', { name: 'Quay lại ca' }))
    await waitFor(() => expect(trang()).toBeNull())
    chamTen('Vũ Đức Anh')
    await waitFor(() => expect(trang()).toBeTruthy())
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(trang()).toBeNull())
    expect(document.body.style.overflow).not.toBe('hidden')
  })

  it('"Xem toàn cảnh em này" ⇒ moToanCanh(sbd); "Giao bài riêng cho em này" ⇒ đặt em chọn sẵn rồi sang màn Giao bài', async () => {
    await mo()
    chamTen('Vũ Đức Anh')
    await waitFor(() => expect(trang()).toBeTruthy())
    fireEvent.click(within(trang()!).getByRole('button', { name: 'Xem toàn cảnh em này' }))
    expect(m.moToanCanh).toHaveBeenCalledWith('12003')
    fireEvent.click(within(trang()!).getByRole('button', { name: 'Giao bài riêng cho em này' }))
    expect(m.datSbdGiaoRieng).toHaveBeenCalledWith('12003')
    expect(m.setScreen).toHaveBeenCalledWith('giaobtvn')
    expect(m.datSbdGiaoRieng.mock.invocationCallOrder[0]).toBeLessThan(m.setScreen.mock.invocationCallOrder[0]) // đặt em TRƯỚC khi sang màn
  })

  it('chạm em ĐANG LÀM ⇒ "Chưa có báo cáo", không mục lục, vẫn có hai nút việc tiếp', async () => {
    await mo()
    chamTen('Hoàng Mai Chi')
    await waitFor(() => expect(trang()).toBeTruthy())
    const t = within(trang()!)
    expect(t.getByText('Chưa có báo cáo')).toBeTruthy()
    expect(trang()!.textContent).toContain('Em ấy đang làm bài — báo cáo sẽ có sau khi em ấy nộp.') // trạng thái thật của lượt
    expect(trang()!.textContent).not.toContain('Rời màn')
    expect(trang()!.querySelector('.xd-muc-luc')).toBeNull()
    expect(t.getByRole('button', { name: 'Giao bài riêng cho em này' })).toBeTruthy()
  })

  it('chạm em BỊ KHOÁ chưa có điểm ⇒ nêu số lần rời màn và tổng thời gian của CHÍNH em ấy', async () => {
    await mo()
    chamTen('Cao Minh Tuệ')
    await waitFor(() => expect(trang()).toBeTruthy())
    expect(trang()!.textContent).toContain('Bài của em ấy chưa có điểm — chưa có gì để báo cáo.')
    expect(trang()!.textContent).toContain('Rời màn làm bài 4 lần, tổng 2 phút 10 giây.')
  })

  it('bấm "Em cần thầy để ý" ở khối lớp ⇒ cũng mở đúng trang của em đó', async () => {
    const { container } = await mo('dong') // ca đóng: khối lớp mở sẵn
    await waitFor(() => expect(container.querySelector('[data-khoi="bao-cao-ca-lop"]')!.textContent).toContain('Em cần thầy để ý'))
    const khoi = within(container.querySelector('[data-khoi="bao-cao-ca-lop"]') as HTMLElement)
    fireEvent.click(khoi.getAllByRole('button').find((b) => /Báo cáo/.test(b.textContent || '') && b.className.includes('gv-em-can'))!)
    await waitFor(() => expect(trang()).toBeTruthy())
    expect(trang()!.getAttribute('aria-label')).toMatch(/^Báo cáo của /)
  })
})
