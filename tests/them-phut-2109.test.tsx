// "THÊM 5 PHÚT" + "CHIẾU MÃ VÀO THI" trên màn theo dõi ca của thầy (thầy duyệt 21/09, docs/hop-dong-them-phut-2109.md mục 3).
// Luồng thi thật: không đụng nút/cảnh báo sẵn có — test này khoá cả cái mới lẫn cái cũ còn nguyên.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import KhoiThoiGianCa from '../src/components/KhoiThoiGianCa'
import TamPhuChieuMa from '../src/components/TamPhuChieuMa'
import ExamMonitorScreen from '../src/screens/ExamMonitorScreen'
import { cauKetQuaThemPhut, dinhDangMa } from '../src/lib/them-phut-api'

const m = vi.hoisted(() => ({ detail: vi.fn(), them: vi.fn(), toast: vi.fn(), gio: { ms: Date.parse('2026-09-21T01:00:00Z') } }))
vi.mock('../src/store/appStore', () => ({
  useAppStore: (sel: (s: unknown) => unknown) => sel({ maCaTheoDoi: 'C1', classList: [], setScreen: vi.fn(), showToast: m.toast }),
}))
vi.mock('../src/lib/exam-db', async (goc) => ({
  ...(await goc<typeof import('../src/lib/exam-db')>()),
  loadScriptUrl: async () => 'https://local.test',
  loadTeacherSecret: async () => 'mat-thu',
  loadSessionTeacherBank: async () => null,
  docSoCauCa: async () => undefined,
  docDeRiengCa: async () => undefined,
  docCheDoDeRieng: async () => false,
}))
vi.mock('../src/lib/exam-api', async (goc) => ({ ...(await goc<typeof import('../src/lib/exam-api')>()), chiTietCa: m.detail, danhSachCa: async () => [] }))
vi.mock('../src/lib/gio-may-chu', () => ({ gioMayChu: () => m.gio.ms, dongBoGioMayChu: () => {}, daDongBoGio: () => true }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }) }))
vi.mock('../src/lib/them-phut-api', async (goc) => ({ ...(await goc<typeof import('../src/lib/them-phut-api')>()), themPhutCa: (...a: unknown[]) => m.them(...a) }))

const ISO = (ms: number) => new Date(ms).toISOString()
const BAY_GIO = m.gio.ms
const CA = {
  maCa: '784817',
  tenCa: 'Kiểm tra Chương 1',
  loai: 'thi',
  lop: '12A1',
  phongCho: true,
  batDauThiLuc: ISO(BAY_GIO - 19 * 60000),
  dongBoGio: true,
  thoiGianPhut: 50,
  trangThai: 'mo' as const,
  phamVi: 'tu_do',
  congBo: 'khong',
  hetHanVao: ISO(BAY_GIO + 30 * 60000),
  batDau: ISO(BAY_GIO - 19 * 60000),
  moLuc: ISO(BAY_GIO - 19 * 60000),
  danhSachMoi: '',
  nguoiTao: '',
}
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

// ---------------------------------------------------------------- lệnh máy chủ
describe('themPhutCa — không giả thành công', () => {
  const goi = vi.fn()
  const stub = (res: () => Promise<unknown>) =>
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      goi(url, init)
      return res()
    })
  beforeEach(() => goi.mockClear())
  const chay = async () => (await vi.importActual<typeof import('../src/lib/them-phut-api')>('../src/lib/them-phut-api')).themPhutCa('784817', 5)

  it('POST /ca/them-phut {maCa, phut} kèm x-ma-bi-mat; trả đúng số máy chủ trả', async () => {
    stub(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, phut: 5, soLuotCong: 8, thoiGianPhut: 55, themPhutTong: 5 }) }))
    const kq = await chay()
    expect(goi.mock.calls[0][0]).toBe('https://may.test/ca/them-phut')
    expect(JSON.parse(String(goi.mock.calls[0][1].body))).toEqual({ maCa: '784817', phut: 5 })
    expect(goi.mock.calls[0][1].headers['x-ma-bi-mat']).toBe('mat-thu')
    expect(kq).toEqual({ phut: 5, soLuotCong: 8, thoiGianPhut: 55, themPhutTong: 5 })
  })

  it('máy chủ CHƯA CÓ lệnh (404) → ném lỗi thật, không thành công giả', async () => {
    stub(async () => ({ ok: false, status: 404, json: async () => ({}) }))
    await expect(chay()).rejects.toThrow('Máy chủ chưa có lệnh Thêm phút — chưa cộng giờ cho em nào.')
  })

  it('máy chủ từ chối → nguyên văn lý do của máy chủ (vượt trần 30 phút, ca đã đóng…)', async () => {
    stub(async () => ({ ok: true, status: 200, json: async () => ({ ok: false, error: 'Ca này đã thêm 30 phút, không thêm được nữa.' }) }))
    await expect(chay()).rejects.toThrow('Ca này đã thêm 30 phút, không thêm được nữa.')
  })

  it('mất mạng / quá 15 s bị huỷ → CHƯA CHẮC đã cộng (không nói "chưa cộng"); trả lời không đọc được → nói CHƯA CHẮC đã cộng, bảo bấm Làm mới', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('Failed to fetch')
    })
    await expect(chay()).rejects.toThrow('Không nối được máy chủ — CHƯA CHẮC đã cộng, bấm Làm mới để xem giờ rồi hãy quyết định bấm lại.')
    vi.stubGlobal('fetch', async () => {
      throw Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })
    })
    await expect(chay()).rejects.toThrow('Máy chủ trả lời chậm — CHƯA CHẮC đã cộng, bấm Làm mới để xem giờ rồi hãy quyết định bấm lại.')
    await expect(chay()).rejects.not.toThrow(/chưa cộng giờ cho em nào/) // bị huỷ vì quá 15 s: không được nói chắc "chưa cộng"
    stub(async () => ({ ok: true, status: 200, json: async () => Promise.reject(new SyntaxError('x')) }))
    await expect(chay()).rejects.toThrow(/chưa chắc đã cộng giờ/)
  })

  it('câu báo kết quả và định dạng mã', () => {
    expect(cauKetQuaThemPhut({ phut: 5, soLuotCong: 8, thoiGianPhut: 55, themPhutTong: 5 })).toBe('Đã cộng 5 phút cho 8 em đang làm')
    expect(cauKetQuaThemPhut({ phut: 5, soLuotCong: 0, thoiGianPhut: 55, themPhutTong: 5 })).toBe('Đã cộng 5 phút cho ca — hiện chưa có em nào đang làm')
    expect(dinhDangMa('784817')).toBe('784 817')
    expect(dinhDangMa('1234567')).toBe('123 456 7')
    expect(dinhDangMa('12')).toBe('12')
  })
})

// ---------------------------------------------------------------- nút trong thẻ Thời gian
describe('KhoiThoiGianCa · Thêm 5 phút', () => {
  const dung = (o: Partial<typeof CA> = {}, ...rest: [Parameters<typeof KhoiThoiGianCa>[0]['themPhut']?]) =>
    render(<KhoiThoiGianCa ca={{ ...CA, ...o }} themPhut={rest.length ? rest[0] : { tong: 0, chay: m.them }} />)

  it('chỉ hiện khi ca ĐANG MỞ và không phải bài tập về nhà; không truyền themPhut thì không có nút', () => {
    dung()
    expect(screen.getByRole('button', { name: 'Thêm 5 phút' })).toBeTruthy()
    cleanup()
    dung({ trangThai: 'dong' })
    expect(screen.queryByRole('button', { name: 'Thêm 5 phút' })).toBeNull()
    cleanup()
    dung({ loai: 'baitap' })
    expect(screen.queryByRole('button', { name: 'Thêm 5 phút' })).toBeNull()
    cleanup()
    dung({}, undefined)
    expect(screen.queryByRole('button', { name: 'Thêm 5 phút' })).toBeNull()
  })

  it('MỘT bước xác nhận nói thật; bấm Thêm chưa gọi máy chủ; Huỷ thì thôi', () => {
    dung()
    fireEvent.click(screen.getByRole('button', { name: 'Thêm 5 phút' }))
    expect(screen.getByText('Cả phòng thêm 5 phút. Em đang làm nhận giờ mới trong khoảng 10 giây; em mất mạng sẽ không nhận được.')).toBeTruthy()
    expect(m.them).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Huỷ' }))
    expect(m.them).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Thêm 5 phút' })).toBeTruthy()
  })

  it('Đồng ý → gọi ĐÚNG MỘT lần; báo đúng số máy chủ trả; gọi onXong; hiện "Đã thêm X phút"', async () => {
    m.them.mockResolvedValue({ phut: 5, soLuotCong: 8, thoiGianPhut: 55, themPhutTong: 5 })
    const onXong = vi.fn()
    dung({}, { tong: 0, chay: m.them, onXong })
    fireEvent.click(screen.getByRole('button', { name: 'Thêm 5 phút' }))
    fireEvent.click(screen.getByRole('button', { name: 'Đồng ý thêm 5 phút' }))
    expect(await screen.findByText('Đã cộng 5 phút cho 8 em đang làm')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toBe('Đã cộng 5 phút cho 8 em đang làm')
    expect(m.them).toHaveBeenCalledTimes(1)
    expect(onXong).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Đã thêm 5 phút')).toBeTruthy()
  })

  it('máy chủ lỗi/từ chối → hiện ĐÚNG lý do (role=alert), KHÔNG onXong, KHÔNG "Đã thêm"', async () => {
    m.them.mockRejectedValue(new Error('Máy chủ chưa có lệnh Thêm phút — chưa cộng giờ cho em nào.'))
    const onXong = vi.fn()
    dung({}, { tong: 0, chay: m.them, onXong })
    fireEvent.click(screen.getByRole('button', { name: 'Thêm 5 phút' }))
    fireEvent.click(screen.getByRole('button', { name: 'Đồng ý thêm 5 phút' }))
    expect((await screen.findByRole('alert')).textContent).toBe('Máy chủ chưa có lệnh Thêm phút — chưa cộng giờ cho em nào.')
    expect(onXong).not.toHaveBeenCalled()
    expect(screen.queryByText(/Đã thêm/)).toBeNull()
  })

  it('máy chủ đã báo tổng đã thêm (themPhutTong > 0) thì hiện "Đã thêm X phút" ngay khi mở màn', () => {
    dung({}, { tong: 10, chay: m.them })
    expect(screen.getByText('Đã thêm 10 phút')).toBeTruthy()
  })
})

// ---------------------------------------------------------------- tấm phủ chiếu mã
describe('TamPhuChieuMa', () => {
  it('mã tách nhóm 3 số cỡ lớn, tên ca, địa chỉ; số em chờ chỉ khi được truyền; KHÔNG tên em / điểm', () => {
    const { container } = render(<TamPhuChieuMa maCa="784817" tenCa="Kiểm tra Chương 1" diaChi="omr.test/t/784817" soEmCho={3} onDong={() => {}} />)
    expect(screen.getByRole('dialog', { name: 'Chiếu mã vào thi' }).getAttribute('aria-modal')).toBe('true')
    expect(container.querySelector('.ca-chieu-ma')?.textContent).toBe('784 817')
    expect(screen.getByText('Kiểm tra Chương 1')).toBeTruthy()
    expect(container.textContent).toContain('omr.test/t/784817')
    expect(screen.getByText('3 em đã vào phòng chờ')).toBeTruthy()
    cleanup()
    const r2 = render(<TamPhuChieuMa maCa="784817" tenCa="" diaChi="x" soEmCho={null} onDong={() => {}} />)
    expect(r2.container.querySelector('.ca-chieu-cho')).toBeNull()
    expect(r2.container.querySelector('.ca-chieu-ten')).toBeNull()
  })

  it('đóng bằng Esc và bằng nút Đóng; nút Đóng nhận tiêu điểm lúc mở', () => {
    const dong = vi.fn()
    render(<TamPhuChieuMa maCa="784817" tenCa="x" diaChi="x" soEmCho={null} onDong={dong} />)
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Đóng/ }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(dong).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: /Đóng/ }))
    expect(dong).toHaveBeenCalledTimes(2)
  })
})

// ---------------------------------------------------------------- trên màn thật
describe('ExamMonitorScreen', () => {
  beforeEach(() => {
    m.detail.mockImplementation(async () => ({
      ca: { ...CA },
      luot: [{ sbd: '12001', hoTen: 'Nguyễn Minh Khôi', lanThu: 1, trangThai: 'dang_lam', vaoLuc: ISO(BAY_GIO - 60000), hetGioLuc: ISO(BAY_GIO + 60000), nopLuc: '', soLanRoiMan: 0, tongGiayRoiMan: 0, diemI: null, diemII: null, diemIII: null, tong: null, duyetBoi: '', duyetLuc: '', ghiChu: '', dapAn: null, integrity: null, giayCau: null }],
      dsCho: [{ sbd: '12007', hoTen: 'Trần Thu Hà', vaoLuc: ISO(BAY_GIO) }],
      biChan: [],
      themPhutTong: 5,
    }))
  })
  const mo = async () => {
    const r = render(<ExamMonitorScreen />)
    await screen.findByRole('button', { name: 'Chiếu mã vào thi' })
    return r
  }

  it('"Chiếu mã vào thi" ở đầu màn mở tấm phủ mã ca, Esc đóng; KHÔNG lộ tên em', async () => {
    await mo()
    fireEvent.click(screen.getByRole('button', { name: 'Chiếu mã vào thi' }))
    const hop = screen.getByRole('dialog', { name: 'Chiếu mã vào thi' })
    expect(hop.textContent).toContain('784 817')
    expect(hop.textContent).not.toContain('Nguyễn Minh Khôi')
    expect(hop.textContent).not.toContain('Trần Thu Hà')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Chiếu mã vào thi' })).toBeNull()
  })

  it('Thêm 5 phút trên màn: Đồng ý → gọi lệnh với đúng mã ca, báo toast đúng số, TẢI LẠI ca; "Đã thêm 5 phút" từ máy chủ', async () => {
    m.them.mockResolvedValue({ phut: 5, soLuotCong: 1, thoiGianPhut: 55, themPhutTong: 10 })
    await mo()
    expect(screen.getByText('Đã thêm 5 phút')).toBeTruthy()
    const truoc = m.detail.mock.calls.length
    fireEvent.click(screen.getByRole('button', { name: 'Thêm 5 phút' }))
    fireEvent.click(screen.getByRole('button', { name: 'Đồng ý thêm 5 phút' }))
    await waitFor(() => expect(m.them).toHaveBeenCalledTimes(1))
    expect(m.them.mock.calls[0][0]).toBe('784817')
    await waitFor(() => expect(m.toast).toHaveBeenCalledWith('Đã cộng 5 phút cho 1 em đang làm', 'success'))
    await waitFor(() => expect(m.detail.mock.calls.length).toBeGreaterThan(truoc)) // tải lại ca → giờ hết chung mới
  })

  it('máy chủ chưa có lệnh: lỗi thật hiện ở thẻ Thời gian, KHÔNG toast thành công, KHÔNG tải lại', async () => {
    m.them.mockRejectedValue(new Error('Máy chủ chưa có lệnh Thêm phút — chưa cộng giờ cho em nào.'))
    await mo()
    const truoc = m.detail.mock.calls.length
    fireEvent.click(screen.getByRole('button', { name: 'Thêm 5 phút' }))
    fireEvent.click(screen.getByRole('button', { name: 'Đồng ý thêm 5 phút' }))
    expect((await screen.findByRole('alert')).textContent).toContain('Máy chủ chưa có lệnh Thêm phút')
    expect(m.toast).not.toHaveBeenCalledWith(expect.stringContaining('Đã cộng'), 'success')
    expect(m.detail.mock.calls.length).toBe(truoc)
  })

  it('luồng thi thật còn nguyên: Mở ca · Khoá ca · Link vào thi · Link xem điểm · Xoá ca này · Lịch sử ca', async () => {
    await mo()
    for (const ten of [/Mở ca/, /Khoá ca/, /Link vào thi/, /Link xem điểm/, /Xoá ca này/, /Quay lại Lịch sử ca/]) expect(screen.getAllByRole('button', { name: ten }).length).toBeGreaterThan(0)
  })
})

describe('nguồn', () => {
  const doc = (f: string) => fs.readFileSync(path.join(process.cwd(), f), 'utf8')
  it('màn nối đúng: themPhutCa(maCa) rồi tải lại ca; tấm phủ nhận mã + địa chỉ /t/<mã>; ChiTietCa có themPhutTong', () => {
    const src = doc('src/screens/ExamMonitorScreen.tsx')
    expect(src).toContain('chay: () => themPhutCa(chiTiet.ca.maCa)')
    expect(src).toContain('void tai(chiTiet.ca.maCa, true)')
    expect(src).toContain('import.meta.env.BASE_URL}t/${chiTiet.ca.maCa}')
    expect(doc('src/lib/exam-api.ts')).toContain('themPhutTong?: number')
  })
  it('css: không hex, không !important; tấm phủ cao hơn thanh đáy (z-index 60)', () => {
    const css = doc('src/screens/ca-thi-m3.css')
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(css).not.toContain('!important')
    expect(css).toMatch(/\.ca-chieu \{[^}]*z-index: 60/)
  })
  it('mã ca luôn qua dinhDangMa — không in mã trần cỡ nhỏ', () => {
    expect(doc('src/components/TamPhuChieuMa.tsx')).toContain('dinhDangMa(maCa)')
  })
})
