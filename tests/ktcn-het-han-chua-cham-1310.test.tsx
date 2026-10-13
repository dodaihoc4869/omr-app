// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import TheKiemTra from '../src/components/hoc-tap/TheKiemTraCaNhan'
import ManKiemTra from '../src/components/hoc-tap/ManKiemTraCaNhan'
import { goiHoa2 } from '../src/components/hoa2/api'
import type { TomTatKiemTra } from '../src/lib/kiem-tra-ca-nhan'
vi.mock('../src/components/hoa2/api', async (goc) => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: vi.fn() }))
afterEach(() => { cleanup(); vi.mocked(goiHoa2).mockReset() })
const kt: TomTatKiemTra = { id: 'kt-s1', ngay: '2026-10-12', moLuc: Date.parse('2026-10-11T17:00:00Z'), hanLuc: Date.parse('2026-10-12T17:00:00Z'), serverNow: Date.parse('2026-10-13T01:00:00Z'), trangThai: 'het_han', homNay: false, tong: 28, daTra: 20, con: 8, soChang: 3, phut: 50, soBai: 6, tongKienThuc: 40, phuDe: 28, nguonDayDu: true, lyDo: '', thieuNguon: 0, diem: null, nopLuc: null }
it('lịch cũ đã hết hạn, chưa tự chấm: hiện đã hết hạn và lối xem kết quả, không thành lịch sắp đến', () => {
  const mo = vi.fn()
  render(<TheKiemTra du={kt} onMo={mo} />)
  expect(screen.getByText('Đã hết hạn')).toBeTruthy()
  expect(screen.getByText('Đang chấm')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Xem kết quả' })).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Xem lịch kiểm tra' })).toBeNull()
})
it('mở lịch hết hạn chưa chấm gọi kết quả để máy chủ chốt bản đã lưu, không kẹt ở lịch cũ', async () => {
  vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, kiemTra: kt, chang: [] }).mockResolvedValueOnce({ ok: true, kiemTra: { ...kt, nopLuc: kt.hanLuc, diem: 7.25 }, ketQua: { bai: [], cau: [], chu: 'Đã chốt bài hết hạn' } })
  render(<ManKiemTra token="t" sbd="s1" id="kt-s1" onVe={vi.fn()} onCapNhat={vi.fn()} />)
  await screen.findByRole('img', { name: 'Điểm 7,25 trên 10' })
  await waitFor(() => expect(goiHoa2).toHaveBeenCalledTimes(2))
  expect(goiHoa2).toHaveBeenLastCalledWith('hoc-tap-ktcn-ket-qua', 't', { id: 'kt-s1' })
})
