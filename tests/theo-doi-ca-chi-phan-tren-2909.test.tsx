// MÀN THEO DÕI CA ĐANG MỞ CHỈ CÒN KHU TRÊN (thầy 29/09: "bỏ từ cái phần 12:17 chỉ để lại phần trên. Còn thiếu nút nào thì chuyển lên phần trên").
// Ca đang mở: KHÔNG còn thẻ Thời gian, thông tin ca, bảng từng em (hai cột dưới). Những gì chưa có ở khu trên đã cắm vào khu trên:
// Thêm 5 phút + Xoá ca (Việc nhanh), cửa vào ca + phòng chờ (dòng phụ đầu màn), Chép link xem điểm (cạnh Chép link), Câu em sai buổi trước (Cần thầy xử lý),
// việc với từng em (Cho thi lại, Cho vào bằng máy khác, Mở khoá) trong hồ sơ em. Các hộp hỏi lại Đóng cửa / Kết thúc ca thành tấm phủ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import fs from 'node:fs'
import ExamMonitorScreen from '../src/screens/ExamMonitorScreen'

const m = vi.hoisted(() => ({ detail: vi.fn(), moKhoa: vi.fn(), toast: vi.fn() }))
vi.mock('../src/store/appStore', () => ({
  useAppStore: (select: (s: unknown) => unknown) => select({ maCaTheoDoi: 'C1', classList: [], setScreen: vi.fn(), showToast: m.toast }),
}))
vi.mock('../src/lib/exam-db', async (original) => ({
  ...(await original<typeof import('../src/lib/exam-db')>()),
  loadScriptUrl: async () => 'https://local.test',
  loadTeacherSecret: async () => 'test-only',
  loadSessionTeacherBank: async () => null,
  docSoCauCa: async () => ({ I: 10, II: 2, III: 2 }),
  docDeRiengCa: async () => undefined,
  docCheDoDeRieng: async () => true,
}))
vi.mock('../src/lib/exam-api', async (original) => ({
  ...(await original<typeof import('../src/lib/exam-api')>()),
  chiTietCa: m.detail,
  danhSachCa: async () => [],
  moKhoa: (...a: unknown[]) => m.moKhoa(...a),
}))
vi.mock('../src/lib/gio-may-chu', () => ({ gioMayChu: () => Date.parse('2026-09-21T01:00:00Z'), dongBoGioMayChu: () => {}, daDongBoGio: () => true }))

const BAY_GIO = Date.parse('2026-09-21T01:00:00Z')
const ISO = (ms: number) => new Date(ms).toISOString()
const luot = (sbd: string, hoTen: string, trangThai: string, o: Record<string, unknown> = {}) => ({
  sbd, hoTen, lanThu: 1, trangThai,
  vaoLuc: ISO(BAY_GIO - 8 * 60000), hetGioLuc: ISO(BAY_GIO + 12 * 60000), nopLuc: trangThai === 'da_nop' ? ISO(BAY_GIO - 60000) : '',
  soLanRoiMan: 0, tongGiayRoiMan: 0, diemI: null, diemII: null, diemIII: null, tong: null, duyetBoi: '', duyetLuc: '', ghiChu: '',
  dapAn: null, integrity: null, giayCau: null, ...o,
})
const CA = {
  maCa: 'C1', tenCa: 'Kiểm tra 20 phút', loai: 'thi', lop: '12A1', phongCho: true, batDauThiLuc: ISO(BAY_GIO - 8 * 60000), dongBoGio: true,
  thoiGianPhut: 20, trangThai: 'mo', phamVi: 'tu_do', congBo: 'khong', hetHanVao: ISO(BAY_GIO + 5 * 60000), batDau: ISO(BAY_GIO - 10 * 60000),
  moLuc: ISO(BAY_GIO - 10 * 60000), deRieng: true, themPhutTong: 0,
}
const DS = () => [
  luot('12001', 'Nguyễn Minh Khôi', 'dang_lam'),
  luot('12002', 'Lê Hoàng Nam', 'khoa', { soLanRoiMan: 3, tongGiayRoiMan: 40 }),
  luot('12005', 'Đinh Bảo An', 'da_nop', { tong: 7.5 }),
]

beforeEach(() => {
  m.detail.mockReset()
  m.detail.mockImplementation(async () => ({ ca: { ...CA }, luot: DS(), dsCho: [], biChan: [], themPhutTong: 0 }))
  m.moKhoa.mockReset()
  m.moKhoa.mockResolvedValue({ soDong: 1 })
  m.toast.mockReset()
})
afterEach(() => cleanup())

const mo = async () => {
  const r = render(<ExamMonitorScreen />)
  const dau = (await waitFor(() => {
    const d = r.container.querySelector('[data-vung="theo-doi-ca"]')
    expect(d).toBeTruthy()
    return d
  })) as HTMLElement
  return { ...r, dau }
}

describe('ca đang mở: chỉ còn khu trên', () => {
  it('không còn thẻ THỜI GIAN, thẻ thông tin ca, bảng từng em', async () => {
    const { container } = await mo()
    expect(container.querySelector('.ca-luoi')).toBeNull()
    expect(container.querySelector('.ca-gio')).toBeNull()
    expect(container.querySelector('.gv-monitor-students')).toBeNull()
    expect(screen.queryByRole('tablist', { name: 'Lọc học sinh theo trạng thái' })).toBeNull()
    expect(container.textContent).not.toContain('THỜI GIAN')
  })

  it('những gì khu trên chưa có đã dời lên: Thêm 5 phút, Xoá ca, Chép link xem điểm, cửa vào ca, phòng chờ, câu em sai buổi trước — mỗi thứ MỘT chỗ', async () => {
    const { dau } = await mo()
    for (const ten of [/^Thêm 5 phút$/, /Xoá ca này/, /Chép link xem điểm/, /^Chép link$/, /Kết thúc ca ngay/, /Đóng cửa vào/, /Chiếu mã lên bảng/]) {
      expect(within(dau).getAllByRole('button', { name: ten }), String(ten)).toHaveLength(1)
    }
    expect(dau.textContent).toContain('Cửa vào ca: ĐANG MỞ')
    expect(dau.textContent).toContain('Phòng chờ đã mở lúc')
    expect(dau.textContent).toContain('Câu em sai buổi trước')
    // Đồng hồ: chỉ còn vòng "phút còn lại" ở đầu màn (12 phút theo hetGioLuc).
    expect(within(dau).getByRole('img', { name: /Còn 12 phút/ })).toBeTruthy()
  })

  it('Kết thúc ca hỏi lại ở TẤM PHỦ (không cần cuộn xuống)', async () => {
    const { dau } = await mo()
    fireEvent.click(within(dau).getByRole('button', { name: /Kết thúc ca ngay/ }))
    const hop = await screen.findByRole('dialog')
    expect(hop.textContent).toContain('em đang làm bài sẽ bị nộp bài ngay')
  })

  it('Mở khoá ở "Cần thầy xử lý" mở hồ sơ em với câu hỏi lại; Đồng ý mới gọi máy chủ', async () => {
    const { dau } = await mo()
    fireEvent.click(within(dau).getByRole('button', { name: 'Mở khoá cho em' }))
    const dong = await screen.findByRole('button', { name: 'Đồng ý mở khoá' })
    expect(m.moKhoa).not.toHaveBeenCalled()
    fireEvent.click(dong)
    await waitFor(() => expect(m.moKhoa).toHaveBeenCalledTimes(1))
    expect(m.moKhoa.mock.calls[0].slice(0, 4)).toEqual(['https://local.test', 'test-only', 'C1', '12002'])
  })

  it('chạm thẻ em đã nộp ⇒ hồ sơ em có "Việc với em này" với Cho thi lại (vẫn hỏi lại trước khi xoá)', async () => {
    const { dau } = await mo()
    const the = Array.from(dau.querySelectorAll('.ct-em')).find((x) => x.textContent?.includes('Đinh Bảo An')) as HTMLElement
    fireEvent.click(the)
    const khoi = await screen.findByLabelText('Việc với em này')
    fireEvent.click(within(khoi).getByRole('button', { name: 'Cho thi lại' }))
    expect(within(khoi).getByRole('button', { name: 'Xoá lượt cũ và cho thi lại' })).toBeTruthy()
  })
})

// Thầy 29/09: "phần này [BƯỚC TIẾP THEO · Giao chiến dịch luyện] có một nút bật lên thì mới giao chiến dịch, còn mặc định là tắt".
describe('công tắc Giao chiến dịch luyện', () => {
  const src = fs.readFileSync('src/screens/ExamMonitorScreen.tsx', 'utf8')
  it('mặc định TẮT, đổi ca thì tắt lại; tắt ⇒ không vẽ khối GiaoChienDich', () => {
    expect(src).toContain('const [moGiao, setMoGiao] = useState(false)')
    expect(src).toContain('setMoGiao(false) // công tắc Giao chiến dịch: mỗi lần mở ca đều TẮT')
    expect(src).toContain('return !moGiao ? null : (')
    expect(src).not.toContain('thuGonGiao')
  })
  it('là MỘT công tắc (role switch, aria-checked) ở thanh đầu màn, chỉ khi ca đủ điều kiện giao', () => {
    expect(src).toMatch(/\{coGiaoChienDich && \(\s*<button type="button" role="switch" aria-checked=\{moGiao\}/)
    expect(src.match(/Giao chiến dịch luyện từ ca này/g)).toHaveLength(1)
  })
})
