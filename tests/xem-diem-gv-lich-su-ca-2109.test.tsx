// XEM ĐIỂM BẢN 2 · GV-3 Lịch sử ca (bản vẽ docs/ban-ve-xem-diem-2109/gv-3-lich-su-ca.html; Boss duyệt build 21/09): thêm (1) chip LUẬT CÔNG BỐ điểm ở từng dòng ca, (2) bộ lọc trạng thái Tất cả / Đang mở / Đã đóng.
// Chỉ đổi phần nhìn: mọi chức năng cũ (tìm, lọc lớp, tích chọn xoá, thùng rác) nằm ở test cũ. Trường máy chủ chưa trả (điểm trung bình lớp) ⇒ KHÔNG vẽ, không bịa.
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, fireEvent, waitFor, within } from '@testing-library/react'
import type { CaTomTat } from '../src/lib/exam-api'

const danhSachCa = vi.fn()
vi.mock('../src/lib/exam-api', () => ({ danhSachCa: (...a: unknown[]) => danhSachCa(...a), xoaNhieuCa: vi.fn(), khoiPhucCa: vi.fn(), xoaVinhVienCa: vi.fn() }))
vi.mock('../src/lib/exam-db', () => ({ loadScriptUrl: async () => 'https://gia/exec', loadTeacherSecret: async () => 'mat' }))
vi.mock('../src/lib/gio-may-chu', () => ({ gioMayChu: () => new Date('2026-09-02T15:00:00Z').getTime() }))
vi.mock('../src/store/appStore', () => ({ useAppStore: (sel: (s: Record<string, unknown>) => unknown) => sel({ setScreen: vi.fn(), moChiTietCa: vi.fn(), showToast: vi.fn() }) }))

const { default: LichSuCaScreen } = await import('../src/screens/LichSuCaScreen')

const ca = (maCa: string, o: Partial<CaTomTat>): CaTomTat =>
  ({ maCa, tenCa: `Ca ${maCa}`, lop: '12 - Tinh Hoa', thoiGianPhut: 45, moLuc: '2026-09-02T14:00:00Z', batDau: '2026-09-02T14:00:00Z', hetHanVao: '2026-09-02T16:00:00Z', trangThai: 'mo', daVao: 10, daNop: 4, canhBao: 0, ...o }) as CaTomTat

async function moMan(ds: CaTomTat[]) {
  danhSachCa.mockResolvedValue(ds)
  const r = render(<LichSuCaScreen />)
  await waitFor(() => expect(r.getByText('Ca 111111')).toBeTruthy())
  return r
}

beforeEach(() => danhSachCa.mockReset())

const BON_CA = [
  ca('111111', { congBo: 'ngay', trangThai: 'mo' }),
  ca('222222', { congBo: 'ca_lop_xong', trangThai: 'dong', daNop: 10 }),
  ca('333333', { congBo: 'khong', trangThai: 'dong', daNop: 9 }),
  ca('444444', { trangThai: 'dong', congBo: undefined as unknown as CaTomTat['congBo'] }),
]

describe('GV-3 · chip luật công bố ở từng dòng ca', () => {
  it('mỗi ca nói bằng lời điểm hiện khi nào; ca cũ không có `congBo` ⇒ không vẽ chip (không đoán)', async () => {
    const r = await moMan(BON_CA)
    const dong = (ma: string) => r.getByText(`Ca ${ma}`).closest('.ls-ca') as HTMLElement
    expect(within(dong('111111')).getByText('Điểm hiện ngay khi học sinh nộp')).toBeTruthy()
    expect(within(dong('222222')).getByText('Điểm hiện khi cả lớp nộp xong')).toBeTruthy()
    expect(within(dong('333333')).getByText('Điểm chưa công bố cho học sinh')).toBeTruthy()
    expect(dong('444444').textContent).not.toMatch(/Điểm (hiện|chưa công bố)/)
  })

  it('không bịa điểm trung bình lớp (máy chủ chưa trả trong danh sách ca)', async () => {
    const r = await moMan(BON_CA)
    expect(r.container.textContent).not.toMatch(/trung bình lớp|điểm trung bình/i)
  })
})

describe('GV-3 · lọc theo trạng thái ca', () => {
  it('ba nút có SỐ; bấm "Đang mở" chỉ còn ca mở, "Đã đóng" chỉ còn ca đóng, "Tất cả" trả đủ', async () => {
    const r = await moMan(BON_CA)
    const nhom = r.getByRole('group', { name: 'Lọc theo trạng thái ca' })
    expect([...nhom.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Tất cả 4', 'Đang mở 1', 'Đã đóng 3'])
    fireEvent.click(within(nhom).getByRole('button', { name: 'Đang mở 1' }))
    expect(r.queryByText('Ca 222222')).toBeNull()
    expect(r.getByText('Ca 111111')).toBeTruthy()
    expect(within(nhom).getByRole('button', { name: 'Đang mở 1' }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(within(nhom).getByRole('button', { name: 'Đã đóng 3' }))
    expect(r.queryByText('Ca 111111')).toBeNull()
    expect(['222222', '333333', '444444'].every((m) => r.queryByText(`Ca ${m}`))).toBe(true)
    fireEvent.click(within(nhom).getByRole('button', { name: 'Tất cả 4' }))
    expect(r.getByText('Ca 111111')).toBeTruthy()
  })

  it('bộ lọc kết hợp với ô tìm; thùng rác (ca đã xoá) không có nút lọc trạng thái', async () => {
    const r = await moMan(BON_CA)
    fireEvent.click(r.getByRole('button', { name: 'Đã đóng 3' }))
    fireEvent.change(r.getByLabelText('Tìm ca'), { target: { value: '3333' } })
    expect(r.getByText('Ca 333333')).toBeTruthy()
    expect(r.queryByText('Ca 222222')).toBeNull()
    fireEvent.change(r.getByLabelText('Tìm ca'), { target: { value: '' } }) // ô tìm là của người dùng, vẫn giữ khi sang thùng rác — xoá để thấy ca đã xoá
    danhSachCa.mockResolvedValue([ca('555555', { trangThai: 'da_xoa' })])
    fireEvent.click(r.getByLabelText('Xem ca đã xoá'))
    await waitFor(() => expect(r.getByText('Ca 555555')).toBeTruthy())
    expect(r.queryByRole('group', { name: 'Lọc theo trạng thái ca' })).toBeNull()
  })
})
