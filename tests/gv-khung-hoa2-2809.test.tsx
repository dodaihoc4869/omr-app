// KHUNG APP THẦY GAME HÓA 2.0 (bản vẽ thầy chốt 28/09 · docs/ban-ve-gv-2809): thanh bên có số đếm, Tổng quan (số có nhãn +
// đơn vị + mẫu số, ca đang mở, chiến dịch đang chạy, việc cần làm), Ca kiểm tra dạng bảng + trạng thái trống MỘT dòng chữ,
// phép tính thuần `tong-quan-gv`. Cờ tắt ⇒ Ca kiểm tra y như cũ (khoá ở tests/lich-su-ca-*).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { CaTomTat } from '../src/lib/exam-api'

const m = vi.hoisted(() => ({ danhSachCa: vi.fn(), goi: vi.fn() }))
vi.mock('../src/lib/exam-api', () => ({
  danhSachCa: (...a: unknown[]) => m.danhSachCa(...a),
  xoaNhieuCa: vi.fn(),
  khoiPhucCa: vi.fn(),
  xoaVinhVienCa: vi.fn(),
}))
vi.mock('../src/lib/exam-db', () => ({
  loadScriptUrl: async () => 'https://gia/exec',
  loadTeacherSecret: async () => 'mat',
  loadExamSources: async () => [],
}))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => m.goi(duong, body) }))
vi.mock('../src/lib/gio-may-chu', () => ({ gioMayChu: () => new Date('2026-09-28T12:30:00Z').getTime() }))

import ThanhBenTrai from '../src/components/ThanhBenTrai'
import { useCoHoa2 } from '../src/components/chien-dich/co-hoa2'
import { useSoDemGv } from '../src/lib/so-dem-gv'
import { useAppStore } from '../src/store/appStore'
import { baiNopTheoNgay, dongChienDich, mucCanHomNay, thongKeThang } from '../src/lib/tong-quan-gv'
import type { BangChienDich, ChienDichTom } from '../src/components/chien-dich/api'
const { default: TongQuanScreen } = await import('../src/screens/TongQuanScreen')
const { default: LichSuCaScreen, CHU_CA_TRONG_HOA2 } = await import('../src/screens/LichSuCaScreen')

const ca = (maCa: string, o: Partial<CaTomTat> = {}): CaTomTat =>
  ({
    maCa,
    tenCa: `Kiểm tra ${maCa}`,
    lop: '12A1',
    thoiGianPhut: 45,
    moLuc: '2026-09-28T12:15:00Z',
    batDau: '2026-09-28T12:15:00Z',
    hetHanVao: '2026-09-28T13:30:00Z',
    trangThai: 'mo',
    phamVi: 'tu_do',
    congBo: 'ca_lop_xong',
    loai: 'thi',
    hanNop: '',
    lenBang: true,
    daVao: 3,
    daNop: 1,
    canhBao: 2,
    ...o,
  }) as CaTomTat

const cd = (id: string, o: Partial<ChienDichTom> = {}): ChienDichTom => ({
  id,
  ten: `Chiến dịch ${id}`,
  lop: '12A1',
  maDe: [],
  hanNop: '2026-10-08',
  theLucNgay: 40,
  huyetChien: false,
  maCa: null,
  taoLuc: '2026-09-24T00:00:00Z',
  trangThai: 'dang_chay',
  soCau: 20,
  soEm: 3,
  hetHan: false,
  ...o,
})

const bang = (c: ChienDichTom, thanhThao: number): BangChienDich => ({
  chienDich: c,
  homNay: '2026-09-28',
  hetHan: false,
  lop: { coXat: 0.8, thanhThao, huyetChien: 0, canDayLaiCau: 4, canDayLaiLuot: 9 },
  dang: ['Ester', 'Lipid'],
  em: [
    { sbd: '1', ten: 'An', coXat: 10, thanhThao: 5, canDayLai: 1, treNhip: 0, huyetChien: false, theoDang: { Ester: 0.6, Lipid: 0.2 } },
    { sbd: '2', ten: 'Bình', coXat: 8, thanhThao: 4, canDayLai: 0, treNhip: 3, huyetChien: false, theoDang: { Ester: 0.5, Lipid: 0.1 } },
    { sbd: '3', ten: 'Chi', coXat: 0, thanhThao: 0, canDayLai: 0, treNhip: null, huyetChien: false, theoDang: { Ester: null, Lipid: null } },
  ],
  canDayLai: [],
})

beforeEach(() => {
  useCoHoa2.getState().dat({ bat: true, lop: [], sbd: [] })
  useSoDemGv.setState({ caMo: null, chienDichChay: null, canDayLai: null, giaoTuCa: null })
  useAppStore.getState().setScreen('tongquan')
})
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  useCoHoa2.getState().dat(null)
  localStorage.clear()
})

describe('thanh bên 2.0 · số đếm cạnh mục', () => {
  it('chưa biết số ⇒ không vẽ; có số ⇒ "1 mở", số chiến dịch, số câu cần dạy lại', () => {
    const { container, rerender } = render(<ThanhBenTrai />)
    expect(container.querySelectorAll('.ben-trai-dem')).toHaveLength(0)
    useSoDemGv.getState().datSo({ caMo: 1, chienDichChay: 4, canDayLai: 9 })
    rerender(<ThanhBenTrai />)
    const dem = [...container.querySelectorAll('.ben-trai-dem')].map((e) => e.textContent)
    expect(dem).toEqual(['1 mở', '4', '9'])
    expect(screen.getByRole('button', { name: 'Tổng quan' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('button', { name: 'Ca kiểm tra' }).getAttribute('title')).toBe('Ca kiểm tra · 1 ca đang mở')
  })
})

describe('Tổng quan', () => {
  it('thẻ số có nhãn + đơn vị; ca đang mở; chiến dịch đang chạy; việc cần làm; ghi số cho thanh bên', async () => {
    const c1 = cd('A')
    m.danhSachCa.mockResolvedValue([ca('DH-12-C2-B6'), ca('DH-12-C1-A1', { trangThai: 'dong', batDau: '2026-09-26T12:00:00Z', moLuc: '2026-09-26T12:00:00Z', daNop: 30, daVao: 30 })])
    m.goi.mockImplementation(async (_d: string, b: Record<string, unknown>) => {
      if (b.action === 'danh-sach') return { ok: true, du: { homNay: '2026-09-28', chienDich: [c1, cd('B', { trangThai: 'da_dong' })] } }
      if (b.action === 'bang') return { ok: true, du: bang(c1, 0.2) }
      return { ok: false, loai: 'tu_choi', chu: 'lạ' }
    })
    render(<TongQuanScreen />)
    expect(await screen.findByRole('heading', { name: 'Chiến dịch luyện đang chạy' })).toBeTruthy()
    const kpi = screen.getByRole('region', { name: 'Số liệu chính' })
    expect(kpi.textContent).toContain('Em được giao chiến dịch')
    expect(kpi.textContent).toContain('Thành thạo trung bình20 % câu')
    expect(kpi.textContent).toMatch(/mức cần hôm nay \d+%/)
    expect(kpi.textContent).toContain('Em trễ nhịp từ 2 ngày1 em')
    expect(kpi.textContent).toContain('Câu cần thầy dạy lại4 câu')
    // chỉ chiến dịch đang chạy (B đã kết thúc)
    expect(screen.getByRole('button', { name: 'Chiến dịch A' })).toBeTruthy()
    expect(screen.queryByText('Chiến dịch B')).toBeNull()
    expect(document.querySelector('.gv2-chip')?.textContent).toBe('Chậm nhịp')
    // ca đang mở + nút Theo dõi ca
    const theCa = screen.getByRole('region', { name: 'Ca đang mở' })
    expect(within(theCa).getByText('Kiểm tra DH-12-C2-B6')).toBeTruthy()
    expect(theCa.textContent).toContain('Rời màn2 lần')
    expect(within(theCa).getByRole('button', { name: 'Theo dõi ca' })).toBeTruthy()
    // việc cần làm: câu dạy lại, em trễ nhịp, ca chưa có chiến dịch
    const viec = screen.getByRole('region', { name: 'Việc cần làm' })
    expect(viec.textContent).toContain('4 câu cần thầy dạy lại')
    expect(viec.textContent).toContain('1 em trễ nhịp từ 2 ngày')
    expect(viec.textContent).toContain('Ca 26/09 chưa có chiến dịch')
    await waitFor(() => expect(useSoDemGv.getState()).toMatchObject({ caMo: 1, chienDichChay: 1, canDayLai: 4 }))
    // "Giao" ở ca chưa có chiến dịch ⇒ màn Chiến dịch luyện, khung giao mở sẵn cho ca ấy
    fireEvent.click(within(viec).getByRole('button', { name: /^Giao: Ca 26\/09/ }))
    expect(useAppStore.getState().screen).toBe('chiendich')
    expect(useSoDemGv.getState().giaoTuCa?.maCa).toBe('DH-12-C1-A1')
  })

  it('không có ca mở, không có chiến dịch ⇒ mỗi khối một dòng chữ, không số giả', async () => {
    m.danhSachCa.mockResolvedValue([])
    m.goi.mockResolvedValue({ ok: true, du: { homNay: '2026-09-28', chienDich: [] } })
    render(<TongQuanScreen />)
    expect(await screen.findByText('Không có ca nào đang mở.')).toBeTruthy()
    expect(screen.getByText('Chưa có chiến dịch nào đang chạy. Giao chiến dịch ở mục Chiến dịch luyện.')).toBeTruthy()
    expect(screen.getByText('Không có việc cần làm ngay.')).toBeTruthy()
    expect(screen.getByText('Chưa có bài nộp nào trong 14 ngày qua.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Theo dõi ca' })).toBeNull()
  })
})

describe('Ca kiểm tra 2.0', () => {
  it('trống ⇒ MỘT dòng chữ; không nút "Mở ca kiểm tra đầu tiên", không khối "Đồng bộ lại phiếu mọi ca", không phụ đề', async () => {
    m.danhSachCa.mockResolvedValue([])
    const { container } = render(<LichSuCaScreen />)
    expect(await screen.findByText(CHU_CA_TRONG_HOA2)).toBeTruthy()
    expect(CHU_CA_TRONG_HOA2).toBe('Chưa có ca kiểm tra nào. Mở ca bằng nút Mở ca kiểm tra ở thanh bên.')
    expect(screen.queryByRole('button', { name: 'Mở ca kiểm tra đầu tiên' })).toBeNull()
    expect(container.textContent).not.toContain('Đồng bộ lại phiếu')
    expect(container.textContent).not.toContain('Quản lý, tìm kiếm và chi tiết các ca kiểm tra')
    expect(container.textContent).not.toContain('Giao chiến dịch mới')
    expect(container.querySelector('img')).toBeNull()
  })

  it('bảng gọn: tên ca + mã ca dòng phụ, đã nộp / vào, công bố điểm, trạng thái; ca bài tập về nhà (cũ) ẩn tới khi lọc', async () => {
    m.danhSachCa.mockResolvedValue([ca('DH-12-C2-B6'), ca('BT-1', { loai: 'baitap', tenCa: 'Bài tập tuần' })])
    render(<LichSuCaScreen />)
    const bang = await screen.findByRole('table')
    const cot = [...bang.querySelectorAll('thead th')].map((t) => t.textContent)
    expect(cot).toEqual(['Tên ca', 'Lớp', 'Bắt đầu', 'Đã vào / mời', 'Đã nộp / vào', 'Rời màn', 'Công bố điểm', 'Trạng thái'])
    expect(bang.querySelectorAll('tbody tr')).toHaveLength(1)
    const dong = bang.querySelector('tbody tr') as HTMLElement
    expect(within(dong).getByRole('button', { name: 'Kiểm tra DH-12-C2-B6' })).toBeTruthy()
    expect(dong.textContent).toContain('Mã ca DH-12-C2-B6')
    expect(dong.textContent).toContain('Khi cả lớp nộp xong')
    expect(dong.textContent).toContain('Đang mở')
    expect(screen.getByRole('region', { name: 'Số liệu tháng này' }).textContent).toContain('Ca trong tháng 91 ca')
    fireEvent.click(screen.getByRole('button', { name: 'Loại: Bài tập về nhà (cũ)' }))
    expect(bang.querySelectorAll('tbody tr')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Chọn để xoá' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Ca đã xoá' })).toBeTruthy()
  })
})

describe('phép tính Tổng quan', () => {
  const now = new Date('2026-09-28T12:30:00Z').getTime()
  it('mức cần hôm nay = phần thời gian đã trôi từ lúc giao tới 23:59 hạn nộp', () => {
    expect(mucCanHomNay('2026-09-28T12:30:00Z', '2026-10-08', now)).toBe(0)
    expect(mucCanHomNay('2026-09-20T00:00:00Z', '2026-09-27', now)).toBe(1)
    const x = mucCanHomNay('2026-09-24T00:00:00Z', '2026-10-08', now)
    expect(x).toBeGreaterThan(0.2)
    expect(x).toBeLessThan(0.4)
  })
  it('nhịp: dưới mức cần ⇒ Chậm nhịp; hết hạn ⇒ Chờ buổi chữa; dạng yếu nhất theo trung bình em', () => {
    const c = cd('A')
    expect(dongChienDich(c, bang(c, 0.2), now).nhip).toBe('cham')
    expect(dongChienDich(c, bang(c, 0.9), now).nhip).toBe('dung')
    expect(dongChienDich(cd('B', { hetHan: true }), null, now).nhip).toBe('cho_chua')
    const d = dongChienDich(c, bang(c, 0.5), now)
    expect(d.dangYeu?.ten).toBe('Lipid')
    expect(d.treNhip).toBe(1)
  })
  it('thống kê tháng + bài nộp 14 ngày bỏ ca bài tập về nhà (cũ)', () => {
    const ds = [ca('a', { daNop: 5, daVao: 6, canhBao: 1 }), ca('b', { loai: 'baitap', daNop: 9 }), ca('c', { batDau: '2026-08-30T00:00:00Z', daNop: 7 })]
    expect(thongKeThang(ds, now)).toMatchObject({ thang: 9, soCa: 1, daNop: 5, daVao: 6, roiMan: 1, soCaRoiMan: 1 })
    const bd = baiNopTheoNgay(ds, now)
    expect(bd).toHaveLength(14)
    expect(bd[13]).toEqual({ ngay: '2026-09-28', so: 5 })
  })
})
