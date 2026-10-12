// @vitest-environment jsdom
// Kiểm đường vào màn Hành trình thật: không thay HanhTrinhV2 hoặc BangGoi7 bằng bản giả.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { goiLenh } from '../src/lib/goi-lenh-thay'
import { useSoDemGv } from '../src/lib/so-dem-gv'
import ChienDichScreen from '../src/screens/ChienDichScreen'

vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: vi.fn() }))
vi.mock('../src/components/chien-dich/TheBaiDaDay', () => ({ default: () => <p>Bài đã dạy</p> }))

const du = {
  bat: true, nguonDayDu: true, goiId: 'g1', canChua: 1, soEm: 1, soCau: 127,
  goi: [{ id: 'g1', ten: 'Ester', lop: '12A1', han: '2026-10-16' }],
  cau: [{ qid: 'q1', maDe: 'de1', version: 'v1', group: 'q1', maTo: 'to1', soCau: 1, phan: 'III', hopLe: true, kho: true, tinhToan: true, kyNang: [], lyDo: ['Câu tính toán'], daChua: false, loiGo: '', daDo: 0, sai: 0, chuaGap: [{ sbd: 's1', ten: 'An' }], canKiem: [{ sbd: 's1', ten: 'An' }] }],
  em: [{ sbd: 's1', ten: 'An', tong: 127, daGap: 19, tuLam: 12, con: 108, kyNang: { tong: 10, dat: 7, tyLe: 70 }, diem: [] }],
}

// TRÙNG TU 12/10 (thầy: "trùng tu lại toàn bộ … khoa học đầy đủ và đẹp nhất trực quan") — SỬA CÓ CHỦ ĐÍCH:
//   · dòng tóm tắt "1 học sinh · 127 câu · 1 câu cần chữa" ⇒ hàng ô số có nhãn (Học sinh nhận bài · Câu của bài · Câu cần chữa …);
//   · ô chọn xổ xuống "Bài của lớp" ⇒ thẻ chọn bài (role=radio, tên đọc được "12A1 · Ester · hạn nộp 16/10 · …");
//   · <details> "Tiến độ N học sinh" ⇒ thẻ con "Tiến độ học sinh" (tablist bên trong ⇒ lấy tabpanel ĐẦU là thẻ Hành trình).
const oSo = (bang: HTMLElement, nhan: string) => within(bang).getByText(nhan).parentElement?.querySelector('.g7-o-gt')?.textContent
const daTai = () => screen.findByText('Câu cần chữa')

beforeEach(() => {
  useSoDemGv.setState({ giaoTuCa: null, moHanhTrinh: null, canThayChua: null })
  vi.mocked(goiLenh).mockResolvedValue({ ok: true, du })
})
afterEach(() => { cleanup(); vi.resetAllMocks() })

it('Hành trình hiện hành có tab bài 7 ngày; mở tab mới đọc gói và tiến độ thật', async () => {
  render(<ChienDichScreen />)
  await screen.findByText('Bài đã dạy')
  expect(goiLenh).not.toHaveBeenCalled()
  const tab = screen.getByRole('tab', { name: 'Bài mới trong 7 ngày' })
  fireEvent.click(tab)
  const bang = await screen.findByRole('region', { name: 'Bài mới trong 7 ngày' })
  await within(bang).findByText('Câu cần chữa')
  expect([oSo(bang, 'Học sinh nhận bài'), oSo(bang, 'Câu của bài'), oSo(bang, 'Câu cần chữa')]).toEqual(['1', '127', '1'])
  expect(tab.getAttribute('aria-selected')).toBe('true')
  expect(screen.getAllByRole('tabpanel')[0]!.getAttribute('aria-labelledby')).toBe(tab.id)
  expect(goiLenh).toHaveBeenCalledWith('/gv/goi-bai-7', { lop: '', goiId: '' }, expect.any(String))
  expect(within(bang).getByRole('radio', { name: /^12A1 · Ester · hạn nộp 16\/10/ }).getAttribute('aria-checked')).toBe('true')
  expect(within(bang).getByRole('button', { name: 'Mở câu và chữa' })).toBeTruthy()
  fireEvent.click(within(bang).getByRole('tab', { name: /Tiến độ học sinh/ }))
  expect(within(bang).getByText('19/127 câu · còn 108')).toBeTruthy()
})

it('yêu cầu mở thẳng từ màn khác vào đúng tab và được tiêu thụ một lần', async () => {
  useSoDemGv.getState().datMoHanhTrinh({ the: 'goi-7' })
  render(<ChienDichScreen />)
  expect(screen.getByRole('tab', { name: 'Bài mới trong 7 ngày' }).getAttribute('aria-selected')).toBe('true')
  await daTai()
  expect(useSoDemGv.getState().moHanhTrinh).toBeNull()
})

it('đang tải có trạng thái rõ, không biến thành màn trống', async () => {
  let xong!: (value: Awaited<ReturnType<typeof goiLenh>>) => void
  vi.mocked(goiLenh).mockImplementation(() => new Promise(resolve => { xong = resolve }))
  useSoDemGv.getState().datMoHanhTrinh({ the: 'goi-7' })
  render(<ChienDichScreen />)
  await screen.findByText('Đang đọc bài mới và tiến độ học sinh…')
  expect(screen.getByRole('button', { name: 'Cập nhật' }).hasAttribute('disabled')).toBe(true)
  xong({ ok: true, du })
  await daTai()
})

it('chưa chọn bài có hướng dẫn và không hiển thị số undefined', async () => {
  vi.mocked(goiLenh).mockResolvedValue({ ok: true, du: { bat: true, goi: [], cau: [], em: [] } })
  useSoDemGv.getState().datMoHanhTrinh({ the: 'goi-7' })
  render(<ChienDichScreen />)
  await screen.findByText(/Chưa có bài mới trong 7 ngày\. Thầy chọn bài/)
  expect(screen.queryByText(/undefined/)).toBeNull()
  expect(screen.queryByRole('combobox')).toBeNull()
  expect(screen.queryByRole('radiogroup', { name: 'Bài của lớp' })).toBeNull()
})

it('mạng lỗi hiện đúng lý do và cập nhật lại được ngay trên tab', async () => {
  vi.mocked(goiLenh).mockResolvedValueOnce({ ok: false, loai: 'mang', chu: 'Không nối được máy chủ.' }).mockResolvedValueOnce({ ok: true, du })
  useSoDemGv.getState().datMoHanhTrinh({ the: 'goi-7' })
  render(<ChienDichScreen />)
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Không nối được máy chủ.')
  await waitFor(() => expect(screen.getByRole('button', { name: 'Cập nhật' }).hasAttribute('disabled')).toBe(false))
  fireEvent.click(screen.getByRole('button', { name: 'Cập nhật' }))
  await daTai()
  expect(screen.queryByRole('alert')).toBeNull()
})
