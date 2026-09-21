// XEM ĐIỂM BẢN 2 · GV-1 — TÍNH LƯỜI của khối "Báo cáo cả lớp" trên màn Theo dõi ca THẬT (Boss soát 21/09: màn tự làm mới suốt giờ kiểm tra,
// 44 em × 28 câu không được gom lại mỗi lần). Spy vào `taoChiTietCau`: ca mở + khối gập ⇒ 0 lần; mở khối ⇒ đúng một lượt (1 lần/em nộp);
// làm mới màn với dữ liệu y hệt ⇒ không tính lại; ca đã đóng ⇒ tính một lượt lúc dựng.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ExamMonitorScreen from '../src/screens/ExamMonitorScreen'

const m = vi.hoisted(() => ({ detail: vi.fn(), tao: vi.fn(), gio: { ms: Date.parse('2026-09-21T01:00:00Z') }, bankMuon: { bat: false } }))
vi.mock('../src/store/appStore', () => ({
  useAppStore: (select: (s: unknown) => unknown) => select({ maCaTheoDoi: 'C1', classList: [], setScreen: vi.fn(), showToast: vi.fn() }),
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
]
const CA = (trangThai: 'mo' | 'dong') => ({
  maCa: 'C1', tenCa: 'Kiểm tra Chương 1', loai: 'thi', lop: '12A1', phongCho: false, batDauThiLuc: '', dongBoGio: false, thoiGianPhut: 50, trangThai,
  phamVi: 'tu_do', congBo: 'khong', hetHanVao: ISO(BAY_GIO + 30 * 60000), batDau: ISO(BAY_GIO - 19 * 60000), moLuc: ISO(BAY_GIO - 19 * 60000), danhSachMoi: '', nguoiTao: '',
})
const SO_EM_NOP = 3

beforeEach(() => {
  m.bankMuon.bat = false
  m.tao.mockClear()
  m.detail.mockReset()
})
afterEach(() => cleanup())

const mo = async (trangThai: 'mo' | 'dong') => {
  m.detail.mockImplementation(async () => ({ ca: CA(trangThai), luot: DS.map((l) => ({ ...l })), dsCho: [], biChan: [] }))
  const r = render(<ExamMonitorScreen />)
  await screen.findByRole('tablist', { name: 'Lọc học sinh theo trạng thái' })
  return r
}
const khoi = (c: HTMLElement) => c.querySelector('[data-khoi="bao-cao-ca-lop"]') as HTMLElement | null

describe('GV-1 · tính lười trên màn Theo dõi ca thật', () => {
  it('ca ĐANG MỞ: khối gập, dòng tóm tắt có số, và taoChiTietCau KHÔNG được gọi lần nào', async () => {
    const { container } = await mo('mo')
    await waitFor(() => expect(khoi(container)).toBeTruthy())
    const nut = khoi(container)!.querySelector('button.gv-bc-nut') as HTMLButtonElement
    expect(nut.getAttribute('aria-expanded')).toBe('false')
    expect(nut.textContent).toMatch(/Điểm trung bình .* · 3 em đã nộp/)
    expect(m.tao).not.toHaveBeenCalled()
  })

  it('bấm mở khối ⇒ taoChiTietCau chạy đúng MỘT lượt (mỗi em đã nộp một lần) và khối có số câu sai nhiều', async () => {
    const { container } = await mo('mo')
    await waitFor(() => expect(khoi(container)).toBeTruthy())
    fireEvent.click(khoi(container)!.querySelector('button.gv-bc-nut') as HTMLButtonElement)
    await waitFor(() => expect(khoi(container)!.textContent).toContain('Câu cả lớp sai nhiều nhất'))
    expect(m.tao).toHaveBeenCalledTimes(SO_EM_NOP)
  })

  it('màn làm mới với dữ liệu Y HỆT khi khối đang mở ⇒ KHÔNG tính lại', async () => {
    const { container } = await mo('mo')
    await waitFor(() => expect(khoi(container)).toBeTruthy())
    fireEvent.click(khoi(container)!.querySelector('button.gv-bc-nut') as HTMLButtonElement)
    await waitFor(() => expect(m.tao).toHaveBeenCalledTimes(SO_EM_NOP))
    const truoc = m.detail.mock.calls.length
    fireEvent.click(screen.getByRole('button', { name: /Làm mới/ }))
    await waitFor(() => expect(m.detail.mock.calls.length).toBeGreaterThan(truoc))
    await new Promise((r) => setTimeout(r, 50))
    expect(m.tao).toHaveBeenCalledTimes(SO_EM_NOP)
  })

  it('ca ĐÃ ĐÓNG: mở sẵn, tính một lượt lúc dựng', async () => {
    const { container } = await mo('dong')
    await waitFor(() => expect(khoi(container)!.textContent).toContain('Câu cả lớp sai nhiều nhất'))
    expect(khoi(container)!.querySelector('button.gv-bc-nut')!.getAttribute('aria-expanded')).toBe('true')
    expect(m.tao).toHaveBeenCalledTimes(SO_EM_NOP)
  })

  // Khoá nhớ phải đổi đúng khi SỐ đổi: có em nộp thêm, điểm một em đổi (chấm lại), số lần rời màn đổi — nếu không, báo cáo đứng yên sai.
  const lamMoiVoiDuLieuMoi = async (sua: (ds: typeof DS) => typeof DS) => {
    const { container } = await mo('mo')
    await waitFor(() => expect(khoi(container)).toBeTruthy())
    fireEvent.click(khoi(container)!.querySelector('button.gv-bc-nut') as HTMLButtonElement)
    await waitFor(() => expect(m.tao).toHaveBeenCalledTimes(SO_EM_NOP))
    const moi = sua(DS.map((l) => JSON.parse(JSON.stringify(l))))
    m.detail.mockImplementation(async () => ({ ca: CA('mo'), luot: moi, dsCho: [], biChan: [] }))
    fireEvent.click(screen.getByRole('button', { name: /Làm mới/ }))
    return moi
  }

  it('có THÊM một em nộp ⇒ tính lại đúng một lượt (nay 4 em nộp)', async () => {
    await lamMoiVoiDuLieuMoi((ds) => {
      ds[3].trangThai = 'da_nop'
      ds[3].nopLuc = ISO(BAY_GIO - 60000)
      ds[3].dapAn = { phanI: { q1: 'B', q2: 'B', q3: 'B' }, phanII: {}, phanIII: {} } // sai hết ⇒ 0 điểm: tổng điểm cả lớp KHÔNG đổi, chỉ số bài nộp đổi
      return ds
    })
    await waitFor(() => expect(m.tao).toHaveBeenCalledTimes(SO_EM_NOP + SO_EM_NOP + 1))
  })

  it('điểm của một em đổi (chấm lại) mà số bài nộp không đổi ⇒ vẫn tính lại', async () => {
    await lamMoiVoiDuLieuMoi((ds) => {
      ds[0].dapAn = { phanI: { q1: 'B', q2: 'B', q3: 'B' }, phanII: {}, phanIII: {} }
      return ds
    })
    await waitFor(() => expect(m.tao).toHaveBeenCalledTimes(SO_EM_NOP * 2))
  })

  it('số lần rời màn của một em đổi ⇒ tính lại (danh sách "em cần để ý" không được đứng yên)', async () => {
    await lamMoiVoiDuLieuMoi((ds) => {
      ds[1].soLanRoiMan = 4
      return ds
    })
    await waitFor(() => expect(m.tao).toHaveBeenCalledTimes(SO_EM_NOP * 2))
  })

  it('ngân hàng đáp án về MUỘN sau chi tiết ca (ca đóng mở sẵn): lần đầu chưa có đáp án, khi có phải tính lại — không đứng ở "Chưa tính được"', async () => {
    m.bankMuon.bat = true // máy chưa có ngân hàng ⇒ lấy từ gói máy chủ (keyBank) rồi mới đặt
    m.detail.mockImplementation(async () => ({ ca: CA('dong'), luot: DS.map((l) => ({ ...l })), dsCho: [], biChan: [], keyBank: { ...NGAN_HANG[0] } }))
    const { container } = render(<ExamMonitorScreen />)
    await screen.findByRole('tablist', { name: 'Lọc học sinh theo trạng thái' })
    await waitFor(() => expect(khoi(container)!.textContent).toContain('Câu cả lớp sai nhiều nhất'))
    expect(m.tao).toHaveBeenCalled()
  })
})
