// NÚT "CHO VÀO BẰNG MÁY KHÁC" + THÔNG BÁO SAU "CHO THI LẠI" (Code 1, 21/09/2026).
//
// Sau "Cho thi lại" em chỉ vào được ĐÚNG MÁY CŨ (`choThiLai` khoá `id_thiet_bi`). Máy cũ hỏng / mất thì thầy cần đường ra: nút này gọi
// lệnh `moKhoa` SẴN CÓ của máy chủ (gỡ id máy của lượt `duoc_duyet_lai`, lượt vẫn chờ thi lại, đề mới giữ nguyên) sau MỘT lần xác nhận,
// và nói ĐÚNG kết quả theo `goKhoaMay` máy chủ báo — không mặc định là đã gỡ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import fs from 'node:fs'
import ExamMonitorScreen from '../src/screens/ExamMonitorScreen'

const m = vi.hoisted(() => ({
  detail: vi.fn(),
  moKhoa: vi.fn(),
  thiLai: vi.fn(),
  toast: vi.fn(),
}))
vi.mock('../src/store/appStore', () => ({
  useAppStore: (select: (s: unknown) => unknown) => select({ maCaTheoDoi: 'C1', classList: [], setScreen: vi.fn(), showToast: m.toast }),
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
  moKhoa: (...a: unknown[]) => m.moKhoa(...a),
}))
vi.mock('../src/lib/thi-lai', async (original) => ({
  ...(await original<typeof import('../src/lib/thi-lai')>()),
  choEmThiLai: (...a: unknown[]) => m.thiLai(...a),
}))
vi.mock('../src/lib/gio-may-chu', () => ({ gioMayChu: () => Date.parse('2026-09-21T01:00:00Z'), dongBoGioMayChu: () => {}, daDongBoGio: () => true }))

const BAY_GIO = Date.parse('2026-09-21T01:00:00Z')
const ISO = (ms: number) => new Date(ms).toISOString()
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
  dapAn: null,
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
const DS = () => [
  luot('12001', 'Nguyễn Minh Khôi', 'dang_lam'),
  luot('12002', 'Lê Hoàng Nam', 'duoc_duyet_lai', { khoaMay: true, lanThu: 2 }),
  luot('12003', 'Vũ Đức Anh', 'duoc_duyet_lai', { khoaMay: false, lanThu: 2 }),
  luot('12004', 'Hoàng Mai Chi', 'duoc_duyet_lai', { lanThu: 2 }), // máy chủ chưa trả `khoaMay`
  luot('12005', 'Đinh Bảo An', 'da_nop', { tong: 7.5, diemI: 3, diemII: 2.5, diemIII: 2 }),
]

beforeEach(() => {
  m.detail.mockReset()
  m.detail.mockImplementation(async () => ({ ca: { ...CA }, luot: DS(), dsCho: [], biChan: [] }))
  m.moKhoa.mockReset()
  m.moKhoa.mockResolvedValue({ soDong: 1, goKhoaMay: true })
  m.thiLai.mockReset()
  m.toast.mockReset()
})
afterEach(() => cleanup())

const mo = async () => {
  const r = render(<ExamMonitorScreen />)
  await screen.findByRole('tablist', { name: 'Lọc học sinh theo trạng thái' })
  return r
}
const hangCua = (c: HTMLElement, ten: string) => Array.from(c.querySelectorAll('.ca-hang')).find((h) => h.textContent?.includes(ten)) as HTMLElement
const NUT = 'Cho vào bằng máy khác'

describe('nút "Cho vào bằng máy khác" — chỉ ở lượt chờ thi lại còn khoá máy', () => {
  it('có ở lượt `duoc_duyet_lai` ĐANG khoá máy và ở lượt chưa biết (máy chủ chưa trả `khoaMay`); KHÔNG có ở lượt đã biết là không khoá máy, đang làm, đã nộp', async () => {
    const { container } = await mo()
    expect(within(hangCua(container, 'Lê Hoàng Nam')).getByRole('button', { name: NUT })).toBeTruthy()
    expect(within(hangCua(container, 'Hoàng Mai Chi')).getByRole('button', { name: NUT })).toBeTruthy()
    for (const ten of ['Vũ Đức Anh', 'Nguyễn Minh Khôi', 'Đinh Bảo An']) expect(within(hangCua(container, ten)).queryByRole('button', { name: NUT }), ten).toBeNull()
  })

  it('MỘT lần xác nhận: bấm nút chưa gọi máy chủ; câu giải thích nói chỉ gỡ khoá máy (không xoá gì, giữ đề mới); Huỷ thì không gọi', async () => {
    const { container } = await mo()
    const nam = hangCua(container, 'Lê Hoàng Nam')
    fireEvent.click(within(nam).getByRole('button', { name: NUT }))
    expect(m.moKhoa).not.toHaveBeenCalled()
    expect(nam.textContent).toContain('Em sẽ vào được bằng MÁY KHÁC')
    expect(nam.textContent).toContain('Đề mới giữ nguyên')
    fireEvent.click(within(nam).getByRole('button', { name: 'Huỷ' }))
    expect(m.moKhoa).not.toHaveBeenCalled()
    expect(within(nam).getByRole('button', { name: NUT })).toBeTruthy() // nút gốc trở lại
  })

  it('Đồng ý ⇒ gọi `moKhoa` ĐÚNG MỘT lần với (url, mật khẩu, mã ca, sbd); máy chủ báo đã gỡ ⇒ thông báo "đã gỡ khoá máy" (thành công) và tải lại ca', async () => {
    const { container } = await mo()
    fireEvent.click(within(hangCua(container, 'Lê Hoàng Nam')).getByRole('button', { name: NUT }))
    const truoc = m.detail.mock.calls.length
    fireEvent.click(within(hangCua(container, 'Lê Hoàng Nam')).getByRole('button', { name: 'Đồng ý cho vào bằng máy khác' }))
    await waitFor(() => expect(m.moKhoa).toHaveBeenCalledTimes(1))
    expect(m.moKhoa.mock.calls[0].slice(0, 4)).toEqual(['https://local.test', 'test-only', 'C1', '12002'])
    await waitFor(() => expect(m.toast).toHaveBeenCalled())
    const [chu, loai] = m.toast.mock.calls[0]
    expect(chu).toContain('Đã gỡ khoá máy')
    expect(chu).toContain('MÁY KHÁC')
    expect(loai).toBe('success')
    await waitFor(() => expect(m.detail.mock.calls.length).toBeGreaterThan(truoc))
  })

  it('máy chủ báo KHÔNG có khoá máy để gỡ (`goKhoaMay:false`) ⇒ nói thật, không báo "đã gỡ" (cảnh báo)', async () => {
    m.moKhoa.mockResolvedValue({ soDong: 0, goKhoaMay: false })
    const { container } = await mo()
    fireEvent.click(within(hangCua(container, 'Hoàng Mai Chi')).getByRole('button', { name: NUT }))
    fireEvent.click(within(hangCua(container, 'Hoàng Mai Chi')).getByRole('button', { name: 'Đồng ý cho vào bằng máy khác' }))
    await waitFor(() => expect(m.toast).toHaveBeenCalled())
    const [chu, loai] = m.toast.mock.calls[0]
    expect(chu).toContain('không còn khoá máy')
    expect(chu).not.toContain('Đã gỡ khoá máy')
    expect(loai).toBe('warn')
  })

  it('máy chủ đời cũ KHÔNG báo `goKhoaMay` ⇒ không khẳng định gì: nói chưa biết và nhờ thử vào máy khác (cảnh báo)', async () => {
    m.moKhoa.mockResolvedValue({})
    const { container } = await mo()
    fireEvent.click(within(hangCua(container, 'Lê Hoàng Nam')).getByRole('button', { name: NUT }))
    fireEvent.click(within(hangCua(container, 'Lê Hoàng Nam')).getByRole('button', { name: 'Đồng ý cho vào bằng máy khác' }))
    await waitFor(() => expect(m.toast).toHaveBeenCalled())
    const [chu, loai] = m.toast.mock.calls[0]
    expect(chu).toContain('chưa báo có gỡ khoá máy hay không')
    expect(chu).not.toContain('Đã gỡ khoá máy')
    expect(loai).toBe('warn')
  })

  it('máy chủ từ chối ⇒ báo lỗi kèm lý do (đỏ), không giả vờ đã gỡ', async () => {
    m.moKhoa.mockRejectedValue(new Error('Sai mã bí mật'))
    const { container } = await mo()
    fireEvent.click(within(hangCua(container, 'Lê Hoàng Nam')).getByRole('button', { name: NUT }))
    fireEvent.click(within(hangCua(container, 'Lê Hoàng Nam')).getByRole('button', { name: 'Đồng ý cho vào bằng máy khác' }))
    await waitFor(() => expect(m.toast).toHaveBeenCalled())
    expect(m.toast.mock.calls[0]).toEqual(['Không gỡ được khoá máy: Sai mã bí mật', 'error'])
  })

  it('nút "Mở khoá" cũ (lượt bị khoá vì rời màn) KHÔNG đổi chữ và vẫn hiện ở lượt `khoa`', async () => {
    m.detail.mockImplementation(async () => ({ ca: { ...CA }, luot: [luot('12009', 'Phạm Khoá', 'khoa', { soLanRoiMan: 3 })], dsCho: [], biChan: [] }))
    const { container } = await mo()
    const h = hangCua(container, 'Phạm Khoá')
    expect(within(h).getByRole('button', { name: 'Mở khoá' })).toBeTruthy()
    expect(within(h).queryByRole('button', { name: NUT })).toBeNull()
  })
})

describe('thông báo sau "Cho thi lại" — nói ĐÚNG theo máy chủ (soLuotXoa · daDoiDe · khoaMay)', () => {
  const choThiLai = async (kq: Record<string, unknown>) => {
    m.thiLai.mockResolvedValue({ soLuotXoa: 1, soCauXoa: 20, khoaMay: true, daDoiDe: true, soCauKhac: 12, soCauMoi: 28, ...kq })
    const { container } = await mo()
    const h = hangCua(container, 'Đinh Bảo An')
    fireEvent.click(within(h).getByRole('button', { name: 'Cho thi lại' }))
    fireEvent.click(within(hangCua(container, 'Đinh Bảo An')).getByRole('button', { name: 'Xoá lượt cũ và cho thi lại' }))
    await waitFor(() => expect(m.toast).toHaveBeenCalled())
    return m.toast.mock.calls[0] as [string, string]
  }

  it('đổi được đề + khoá được máy ⇒ thành công, nêu số lượt xoá, đề mới khác bao nhiêu câu, và đường ra khi máy cũ hỏng', async () => {
    const [chu, loai] = await choThiLai({})
    expect(chu).toBe('Đã cho thi lại: xoá 1 lượt cũ · đề mới 12/28 câu khác đề cũ · chỉ vào được ở máy cũ (máy cũ hỏng thì bấm "Cho vào bằng máy khác").')
    expect(loai).toBe('success')
  })

  it('KHÔNG khoá được máy (lượt cũ không ghi máy) ⇒ cảnh báo, và KHÔNG nhắc nút gỡ khoá máy (không có gì để gỡ)', async () => {
    const [chu, loai] = await choThiLai({ khoaMay: false })
    expect(chu).toContain('lượt cũ không ghi máy nên KHÔNG khoá được máy')
    expect(chu).not.toContain('Cho vào bằng máy khác')
    expect(loai).toBe('warn')
  })

  it('KHÔNG đổi được đề (kho hẹp) ⇒ cảnh báo "GIỮ ĐỀ CŨ"', async () => {
    const [chu, loai] = await choThiLai({ daDoiDe: false })
    expect(chu).toContain('GIỮ ĐỀ CŨ')
    expect(loai).toBe('warn')
  })
})

describe('khoá nguồn', () => {
  const man = fs.readFileSync('src/screens/ExamMonitorScreen.tsx', 'utf8')
  it('nút chỉ hiện với `duoc_duyet_lai` và khi khoaMay !== false; dùng lệnh `moKhoa` sẵn có (không lệnh mới); chỉ gọi sau xác nhận', () => {
    expect(man).toContain("l.trangThai === 'duoc_duyet_lai' &&\n                            l.khoaMay !== false &&")
    const i = man.indexOf('const handleChoVaoMayKhac')
    expect(man.slice(i, i + 700)).toContain('await moKhoa(scriptUrl.trim(), secret.trim(), chiTiet.ca.maCa, sbd)')
    expect(man).toContain('onClick={() => setXacNhanMayKhac(e.sbd)}')
    expect(man).toContain('onClick={() => handleChoVaoMayKhac(e.sbd)}')
  })
  it('`moKhoa` ở exam-api trả `goKhoaMay` chỉ khi máy chủ báo boolean thật', () => {
    const api = fs.readFileSync('src/lib/exam-api.ts', 'utf8')
    expect(api).toContain("goKhoaMay: typeof r.goKhoaMay === 'boolean' ? r.goKhoaMay : undefined")
  })
})
