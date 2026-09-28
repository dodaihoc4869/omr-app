// CA THI 28/09 (bản vẽ docs/ban-ve-ca-thi-2809) trên màn Theo dõi ca THẬT: (b) đầu màn mới khi ca mở, (c) màn Kết thúc ca khi ca đóng (+ Công bố điểm),
// (d) Báo cáo chi tiết MỘT phong cách (thay khối gập BaoCaoCaLop + trang BaoCaoMotEm cũ — test tests/bao-cao-ca-lop-luoi-2109 và bao-cao-mot-em-man-2109 đã GỠ vì khoá giao diện cũ).
// Tính lười giữ nguyên: ca mở ⇒ không dựng bảng chấm (taoChiTietCau 0 lần), ca đóng ⇒ một lượt.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import ExamMonitorScreen from '../src/screens/ExamMonitorScreen'

const m = vi.hoisted(() => ({ lenh: vi.fn(), detail: vi.fn(), tao: vi.fn(), gio: { ms: Date.parse('2026-09-21T01:00:00Z') }, bankMuon: { bat: false } }))
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
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: m.lenh }))
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
  m.lenh.mockReset()
  m.lenh.mockImplementation(async () => ({ ok: false, loai: 'chua_co_lenh', chu: 'chưa có lệnh' }))
})
afterEach(() => {
  cleanup()
  document.body.classList.remove('ct-dang-in')
})

const mo = async (trangThai: 'mo' | 'dong', congBo = 'khong') => {
  m.detail.mockImplementation(async () => ({ ca: { ...CA(trangThai), congBo }, luot: DS.map((l) => ({ ...l })), dsCho: [], biChan: [] }))
  const r = render(<ExamMonitorScreen />)
  await screen.findByRole('tablist', { name: 'Lọc học sinh theo trạng thái' })
  return r
}

describe('(b) Theo dõi ca — đầu màn mới', () => {
  it('ca ĐANG MỞ: 4 thẻ số, thanh cả lớp, lưới em có lọc, Cần thầy xử lý, Việc nhanh; KHÔNG tính báo cáo (taoChiTietCau 0 lần), không gọi /gv/bao-cao-ca', async () => {
    const { container } = await mo('mo')
    const dau = await waitFor(() => container.querySelector('[data-vung="theo-doi-ca"]') as HTMLElement)
    for (const t of ['Đang làm', 'Đã nộp', 'Chưa vào', 'Cảnh báo', 'Cần thầy xử lý', 'Việc nhanh', 'Chép link', 'Kết thúc ca ngay']) expect(dau.textContent).toContain(t)
    expect(within(dau).getByRole('group', { name: 'Lọc em' })).toBeTruthy()
    fireEvent.click(within(dau).getByRole('button', { name: /^Đã nộp 3/ }))
    expect(dau.querySelectorAll('.ct-em')).toHaveLength(3)
    expect(m.tao).not.toHaveBeenCalled()
    expect(m.lenh).not.toHaveBeenCalledWith('/gv/bao-cao-ca', expect.anything(), expect.anything())
  })
  it('Kết thúc ca HỎI LẠI (hộp xác nhận nêu số em đang làm), không khoá ngay', async () => {
    const { container } = await mo('mo')
    const dau = await waitFor(() => container.querySelector('[data-vung="theo-doi-ca"]') as HTMLElement)
    fireEvent.click(within(dau).getByRole('button', { name: /Kết thúc ca ngay/ }))
    expect(await screen.findByText(/em đang làm bài sẽ bị nộp bài ngay/)).toBeTruthy()
  })
})

describe('(c) Kết thúc ca + (d) Báo cáo chi tiết', () => {
  it('ca ĐÃ ĐÓNG, "thầy công bố sau": màn Kết thúc ca có TB to, phổ điểm, dải Công bố điểm; máy chủ chưa có lệnh ⇒ tính ở máy MỘT lượt', async () => {
    const { container } = await mo('dong')
    const kt = await waitFor(() => container.querySelector('[data-vung="ket-thuc-ca"]') as HTMLElement)
    await waitFor(() => expect(kt.textContent).toContain('Điểm trung bình cả lớp'))
    for (const t of ['Ca đã kết thúc', 'Phổ điểm', 'Câu cả lớp sai nhiều nhất', 'Em cần thầy để ý', 'Điểm chưa hiện cho học sinh.']) expect(kt.textContent).toContain(t)
    expect(within(kt).getByRole('button', { name: /Công bố điểm cho 3 em/ })).toBeTruthy()
    await waitFor(() => expect(m.tao).toHaveBeenCalledTimes(SO_EM_NOP))
  })
  it('ca đã công bố ⇒ KHÔNG có dải Công bố điểm; bấm Công bố gọi /gv/cong-bo-ca đúng mã ca', async () => {
    const { container } = await mo('dong', 'ngay')
    const kt = await waitFor(() => container.querySelector('[data-vung="ket-thuc-ca"]') as HTMLElement)
    expect(kt.textContent).not.toContain('Điểm chưa hiện cho học sinh.')
    cleanup()
    const r2 = await mo('dong', 'khong')
    const kt2 = await waitFor(() => r2.container.querySelector('[data-vung="ket-thuc-ca"]') as HTMLElement)
    m.lenh.mockImplementation(async () => ({ ok: true, du: { ok: true } }))
    fireEvent.click(await within(kt2).findByRole('button', { name: /Công bố điểm cho/ }))
    await waitFor(() => expect(m.lenh).toHaveBeenCalledWith('/gv/cong-bo-ca', { maCa: 'C1' }, expect.any(String)))
  })
  it('Xem báo cáo chi tiết ⇒ MỘT phong cách: tab Cả lớp / Từng em, bảng điểm + bản đồ từ máy chủ, bấm tên ⇒ báo cáo em; In / Lưu PDF gọi window.print với lớp in', async () => {
    m.lenh.mockImplementation(async (duong: string) =>
      duong === '/gv/bao-cao-ca'
        ? {
            ok: true,
            du: {
              ok: true, tongQuan: { soEm: 3, tb: 6.67, cao: 10, thap: 3.33, phoDiem: [], tbCaTruoc: 6, caTruoc: { tenCa: 'Ca 21/09', ngay: '2026-09-21' } },
              hocSinh: [{ sbd: '12001', hoTen: 'Nguyễn Minh Khôi', tong: 10, doi: 1 }, { sbd: '12003', hoTen: 'Vũ Đức Anh', tong: 3.33 }, { sbd: '12002', hoTen: 'Lê Hoàng Nam', tong: 3.33 }],
              maTran: { cot: [{ phan: 'I', soCau: 1 }, { phan: 'I', soCau: 2 }, { phan: 'I', soCau: 3 }], em: [{ sbd: '12001', kq: 'DDD' }, { sbd: '12003', kq: 'DSS' }, { sbd: '12002', kq: 'SDS' }] },
              congBo: { congBo: 'khong', daCongBo: false, soEmDaNop: 3, soEmDaVao: 4 },
            },
          }
        : { ok: false, loai: 'chua_co_lenh', chu: 'x' },
    )
    const { container } = await mo('dong')
    const kt = await waitFor(() => container.querySelector('[data-vung="ket-thuc-ca"]') as HTMLElement)
    fireEvent.click(within(kt).getByRole('button', { name: 'Xem báo cáo chi tiết' }))
    const bc = await screen.findByRole('dialog', { name: 'Báo cáo chi tiết' })
    expect(within(bc).getByRole('tab', { name: 'Cả lớp' }).getAttribute('aria-selected')).toBe('true')
    expect(bc.textContent).toContain('So với ca trước')
    expect(bc.textContent).toContain('+0,67')
    expect(within(bc).getByRole('table', { name: 'Bản đồ đúng sai em theo câu' }).querySelectorAll('td.o-S')).toHaveLength(4)
    const inRa = vi.spyOn(window, 'print').mockImplementation(() => {
      expect(document.body.classList.contains('ct-dang-in')).toBe(true)
    })
    fireEvent.click(within(bc).getByRole('button', { name: /In \/ Lưu PDF/ }))
    expect(inRa).toHaveBeenCalledTimes(1)
    fireEvent.click(within(bc).getByRole('button', { name: 'Mở báo cáo của Vũ Đức Anh' }))
    await waitFor(() => expect(within(bc).getByRole('tab', { name: 'Từng em' }).getAttribute('aria-selected')).toBe('true'))
    expect(await within(bc).findByRole('heading', { name: 'Vũ Đức Anh' })).toBeTruthy()
    expect(bc.textContent).toContain('Nhận xét của thầy')
    fireEvent.click(within(bc).getByRole('button', { name: /Đóng/ }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Báo cáo chi tiết' })).toBeNull())
  })
})
