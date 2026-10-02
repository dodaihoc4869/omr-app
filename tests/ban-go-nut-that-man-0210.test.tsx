// BÀN GỠ NÚT THẮT — màn thầy (src/screens/BanGoNutThatScreen.tsx): vẽ thẻ theo thứ tự máy chủ, khối Kèm riêng ở đầu, không lộ mã nội bộ,
// bấm "Gỡ ngắn" gửi đúng lệnh; "Dạy trên lớp" chọn buổi học đang mở.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { KetQuaDsNut } from '../src/lib/nut-that-api'

const api = vi.hoisted(() => ({ gvDsNutThat: vi.fn(), gvGoNutThat: vi.fn(), buoiDangMo: vi.fn() }))
vi.mock('../src/lib/nut-that-api', () => ({ gvDsNutThat: api.gvDsNutThat, gvGoNutThat: api.gvGoNutThat }))
vi.mock('../src/lib/buoi-hoc-api', () => ({ buoiDangMo: api.buoiDangMo }))

import BanGoNutThatScreen from '../src/screens/BanGoNutThatScreen'

const DS: KetQuaDsNut = {
  ok: true,
  nhom: [
    {
      khoa: 'BAM1|2', bam: 'BAM1', buoc: 2, qidMau: '12-THU-I-6', so: 'Câu 6', de: '<p>Cho m gam Fe tác dụng với HNO3 loãng dư…</p>',
      chuBuoc: 'Bảo toàn electron: 3x = 0,4', nhanNen: 'Bảo toàn electron', cauKiemHoi: 'Số mol electron nhận là bao nhiêu?', soEm: 2,
      em: [
        { sbd: 'E1', hoTen: 'Nguyễn An', dapAnChon: 'D', kiem: [{ traLoi: '0,3', dung: false, luc: 'x' }], viet: 'Em không hiểu vì sao nhân 3', soLanThu: 2, guiLuc: 'x' },
        { sbd: 'E2', hoTen: 'Trần Bình', dapAnChon: '', kiem: [], viet: '', soLanThu: 3, guiLuc: 'y' },
      ],
      soCauCungChuyenDe: 0, hanGanNhat: '2026-10-05', diem: 2, nhieuEmVuong: true,
    },
    {
      khoa: 'BAM2|1', bam: 'BAM2', buoc: 1, qidMau: 'Q2', so: 'Câu 3', de: '', chuBuoc: 'Lập hệ', nhanNen: '', cauKiemHoi: '', soEm: 1,
      em: [{ sbd: 'E3', hoTen: 'Lê Chi', dapAnChon: 'B', kiem: [], viet: '', soLanThu: 2, guiLuc: 'z' }],
      soCauCungChuyenDe: 0, hanGanNhat: null, diem: 1, nhieuEmVuong: false,
    },
  ],
  cungNen: [{ nen: 'Bảo toàn electron', soEm: 12, soCau: 5, khoa: ['BAM1|2'] }],
  kemRieng: [{ sbd: 'E9', hoTen: 'Phạm Dũng', qid: 'Q7', buoc: 1, so: 'Câu 7', chuBuoc: 'Đổi đơn vị' }],
  tong: { soThe: 3, soNhom: 2, theNgayDongNhat: 16, quaTai: true },
}

beforeEach(() => {
  api.gvDsNutThat.mockReset().mockResolvedValue(DS)
  api.gvGoNutThat.mockReset().mockResolvedValue({ ok: true, soThe: 2 })
  api.buoiDangMo.mockReset().mockResolvedValue({ ok: true, du: [{ id: 'B1', ten: 'Buổi tối thứ Ba', lop: '', moLuc: 'x', hetHan: 'y', dongLuc: null, dangMo: true }] })
})
afterEach(cleanup)

describe('màn Bàn gỡ nút thắt', () => {
  it('vẽ thẻ theo thứ tự, kèm riêng ở đầu, số nào cũng có nhãn, không hiện mã nội bộ', async () => {
    render(<BanGoNutThatScreen />)
    const the = await screen.findAllByTestId('the-nut-that')
    expect(the).toHaveLength(2)
    expect(within(the[0]!).getByText('Câu 6')).toBeTruthy()
    expect(within(the[0]!).getByText('Vướng bước 2')).toBeTruthy()
    expect(within(the[0]!).getByText('2 em')).toBeTruthy()
    expect(within(the[0]!).getByText('Kiến thức nền: Bảo toàn electron')).toBeTruthy()
    expect(within(the[0]!).getByText('Nhiều em vướng — nên sửa lời giải')).toBeTruthy()
    expect(within(the[0]!).getByText(/Hạn nộp chiến dịch: Thứ Hai 05\/10\/2026/)).toBeTruthy()
    expect(within(the[0]!).getByText(/Em viết: “Em không hiểu vì sao nhân 3”/)).toBeTruthy()
    expect(the[0]!.textContent).toContain('Đáp án đã chọn: D')
    expect(the[0]!.textContent).toContain('Trả lời câu kiểm: 0,3 (sai)')
    expect(the[0]!.textContent).toContain('Bảo toàn electron: 3x = 0,4')
    expect(within(the[1]!).getByText('Câu 3')).toBeTruthy()
    expect(screen.getByText(/Kèm riêng trên lớp · 1 em/)).toBeTruthy()
    expect(screen.getByText('Phạm Dũng')).toBeTruthy()
    expect(document.body.textContent).toContain('12 em vướng Bảo toàn electron ở 5 câu')
    expect(document.body.textContent).not.toMatch(/BAM1|BAM2|12-THU-I-6|E1\b/)
  })

  it('bấm Gỡ ngắn, gõ lời gỡ ⇒ gọi đúng lệnh với (câu, bước) của thẻ rồi tải lại', async () => {
    render(<BanGoNutThatScreen />)
    const the = await screen.findAllByTestId('the-nut-that')
    fireEvent.click(within(the[0]!).getByRole('button', { name: 'Gỡ ngắn' }))
    const gui = within(the[0]!).getByRole('button', { name: 'Gửi lời gỡ cho 2 em' }) as HTMLButtonElement
    expect(gui.disabled).toBe(true)
    fireEvent.change(within(the[0]!).getByLabelText(/Lời gỡ ngắn gửi 2 em/), { target: { value: '  Fe nhường 3 electron.  ' } })
    fireEvent.click(gui)
    await waitFor(() => expect(api.gvGoNutThat).toHaveBeenCalledWith({ bam: 'BAM1', buoc: 2, kieu: 'ngan', noiDung: 'Fe nhường 3 electron.' }))
    await screen.findByText(/Đã gửi lời gỡ Câu 6, bước 2 cho 2 em/)
    expect(api.gvDsNutThat).toHaveBeenCalledTimes(2)
  })

  it('Dạy trên lớp: chọn buổi học đang mở ⇒ gửi kèm buổi, báo em cần gọi lên bảng', async () => {
    api.gvGoNutThat.mockResolvedValue({ ok: true, soThe: 1, tenBuoi: 'Buổi tối thứ Ba', emCanGoi: [{ sbd: 'E3', hoTen: 'Lê Chi' }] })
    render(<BanGoNutThatScreen />)
    const the = await screen.findAllByTestId('the-nut-that')
    fireEvent.click(within(the[1]!).getByRole('button', { name: 'Dạy trên lớp' }))
    const chon = await within(the[1]!).findByLabelText('Buổi học sẽ dạy')
    fireEvent.change(chon, { target: { value: 'B1' } })
    fireEvent.click(within(the[1]!).getByRole('button', { name: 'Ghi dạy trên lớp' }))
    await waitFor(() => expect(api.gvGoNutThat).toHaveBeenCalledWith({ bam: 'BAM2', buoc: 1, kieu: 'lop', noiDung: '', buoiHoc: 'B1' }))
    await screen.findByText(/Em cần gọi lên bảng: Lê Chi/)
  })

  it('trống ⇒ nói vì sao; lỗi ⇒ lý do + Thử lại', async () => {
    api.gvDsNutThat.mockResolvedValueOnce({ ok: true, nhom: [], cungNen: [], kemRieng: [], tong: { soThe: 0, soNhom: 0, theNgayDongNhat: 0, quaTai: false } })
    render(<BanGoNutThatScreen />)
    await screen.findByText(/Chưa có thẻ nào đang chờ/)
    cleanup()
    api.gvDsNutThat.mockResolvedValueOnce({ ok: false, error: 'Sai mã bí mật' })
    render(<BanGoNutThatScreen />)
    await screen.findByText(/Sai mã bí mật/)
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    await screen.findAllByTestId('the-nut-that')
  })
})
