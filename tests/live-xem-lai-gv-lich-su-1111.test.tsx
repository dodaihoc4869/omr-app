// @vitest-environment jsdom
// XEM LẠI LIVE — LỊCH SỬ LIVE CỦA THẦY sau lỗi thật 11/11 (thầy trên bản sống: «kết thúc live chưa thấy có bản ghi»):
//   · buổi đã live mà chưa có đoạn nào VẪN có dòng, kèm lý do bằng chữ thường ngay trên dòng; thầy xoá được, không có «Mở»;
//   · vừa tắt live / đóng màn chiếu ⇒ nút «Live» ở Hôm nay và màn Lịch sử Live tự hỏi lại (đang xử lý → xong), không cần tải lại trang.
import { act, cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { BuoiGv } from '../src/screens/live-xem-lai/gv/lich-su-live-api'

let dsMay: BuoiGv[] = []
let soLanGoi = 0
vi.mock('../src/lib/goi-lenh-thay', () => ({
  goiLenh: vi.fn(async (duong: string) => {
    if (duong === '/gv/live-ds') { soLanGoi += 1; return { ok: true, du: { ok: true, buoi: dsMay, tongByte: dsMay.reduce((s, b) => s + b.byte, 0) } } }
    return { ok: true, du: { ok: true } }
  }),
}))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu.thu' }))

import LichSuLive from '../src/screens/live-xem-lai/gv/LichSuLive'
import { theoDoiDangXuLy } from '../src/screens/live-xem-lai/gv/lich-su-live-api'

const buoi = (id: string, o: Partial<BuoiGv> = {}): BuoiGv => ({
  id, ngay: '2026-11-11', lop: '12A1', batLuc: '2026-11-11T12:05:00.000Z', tenTuDong: 'Bài 8. Amine', tenThay: null, soCau: 5, soDoan: 4, giayLive: 2880, giayDoan: 900,
  trangThai: 'xong', tienDo: 100, ban: 1, byte: 19_000_000, quyen: 'lop', ve: 've-thay', ...o,
} as BuoiGv)
const khongDoan = (id: string, o: Partial<BuoiGv>): BuoiGv => buoi(id, { soDoan: 0, giayDoan: 0, byte: 0, ban: 0, ve: null, tenTuDong: 'Buổi live 12A1', ...o })
const phatPhien = (detail: unknown): void => { window.dispatchEvent(new CustomEvent('bpu-phien', { detail })) }
const troi = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms) })

beforeEach(() => { dsMay = []; soLanGoi = 0; vi.useFakeTimers() })
afterEach(() => { cleanup(); vi.useRealTimers() })

describe('Lịch sử Live — buổi chưa có đoạn xem lại (11/11)', () => {
  it('dòng 0 đoạn hiện lý do bằng chữ ngay trên dòng, thời lượng có nhãn, không có «Mở» / đổi tên, xoá được; buổi thường không đổi', async () => {
    dsMay = [
      khongDoan('n1', { lyDo: 'ngan', giayLive: 9, soCau: 0 }),
      khongDoan('n2', { lyDo: 'khong-cau', giayLive: 40, soCau: 0 }),
      khongDoan('n3', { lyDo: 'khong-tieng-net', giayLive: 75, soCau: 1 }),
      khongDoan('n4', { lyDo: 'khong-doan', giayLive: 200, soCau: 2 }),
      khongDoan('n5', { giayLive: 30, soCau: 1 }), // máy chủ bản cũ không gửi lý do
      buoi('b1'),
    ]
    render(<LichSuLive onDong={() => {}} />)
    await troi(50)
    const hang = (id: string): HTMLElement => [...document.querySelectorAll<HTMLElement>('.lsl-hang[data-tt]')][dsMay.findIndex((b) => b.id === id)]!
    expect(within(hang('n1')).getByText(/^Chưa có đoạn xem lại · live dưới 15 giây/)).toBeTruthy()
    expect(within(hang('n2')).getByText(/^Chưa có đoạn xem lại · chưa câu nào được chữa/)).toBeTruthy()
    expect(within(hang('n3')).getByText(/^Chưa có đoạn xem lại · không thu được tiếng và không có nét/)).toBeTruthy()
    expect(within(hang('n4')).getByText(/^Chưa có đoạn xem lại · phần chữa quá ngắn/)).toBeTruthy()
    expect(within(hang('n5')).getByText(/^Chưa có đoạn xem lại · phần chữa quá ngắn/)).toBeTruthy()
    // con số có nhãn: live ngắn hiện giây, không làm tròn thành «1 phút»
    expect(within(hang('n1')).getByText('9 giây')).toBeTruthy(); expect(within(hang('n2')).getByText('40 giây')).toBeTruthy(); expect(within(hang('n3')).getByText('1 phút')).toBeTruthy()
    expect(hang('n2').textContent).toContain('live từ 19:05')
    for (const id of ['n1', 'n2', 'n3', 'n4', 'n5']) {
      expect(within(hang(id)).queryByRole('button', { name: /^Mở buổi/ })).toBeNull()
      expect(within(hang(id)).queryByRole('button', { name: /^Đổi tên buổi/ })).toBeNull()
      expect(within(hang(id)).getByRole('button', { name: /^Xoá buổi/ })).toBeTruthy()
      expect((within(hang(id)).getByRole('checkbox') as HTMLInputElement).disabled).toBe(false)
    }
    // buổi có đoạn: như cũ
    expect(hang('b1').textContent).not.toContain('Chưa có đoạn xem lại')
    expect(within(hang('b1')).getByText('48 phút')).toBeTruthy()
    expect(within(hang('b1')).getByRole('button', { name: /^Đổi tên buổi/ })).toBeTruthy()
  })

  it('vừa đóng màn chiếu (sự kiện `bpu-phien`) ⇒ màn tự tải lại: dòng «đang xử lý» hiện ngay, 4 giây sau thành dòng xong — không cần tải lại trang', async () => {
    render(<LichSuLive onDong={() => {}} />)
    await troi(50)
    expect(screen.getByText('Chưa có buổi live nào')).toBeTruthy()
    const truoc = soLanGoi
    dsMay = [buoi('b1', { trangThai: 'dang_xu_ly', tienDo: 5, soDoan: 0, ve: null })]
    phatPhien(null) // thầy kết thúc buổi / đóng bảng
    await troi(1400); expect(soLanGoi).toBe(truoc)
    await troi(200)
    expect(soLanGoi).toBe(truoc + 1)
    expect(screen.getByText(/Đang xử lý buổi vừa xong/)).toBeTruthy()
    dsMay = [khongDoan('b1', { lyDo: 'khong-cau', giayLive: 40, soCau: 0 })]
    await troi(4100)
    expect(screen.getByText(/^Chưa có đoạn xem lại · chưa câu nào được chữa/)).toBeTruthy()
    // hết buổi đang xử lý ⇒ thôi hỏi
    const xong = soLanGoi
    await troi(20_000); expect(soLanGoi).toBe(xong)
  })
})

describe('Nút «Live» ở Hôm nay — theo dõi buổi đang xử lý (11/11)', () => {
  it('hỏi lúc gắn; màn chiếu vừa MỞ ⇒ không hỏi; vừa đóng / tạm ẩn ⇒ 1,5 giây sau hỏi lại; đang xử lý ⇒ 15 giây một lần tới khi xong rồi dừng', async () => {
    const thay: number[] = []
    const dung = theoDoiDangXuLy((n) => thay.push(n))
    await troi(10)
    expect(soLanGoi).toBe(1); expect(thay).toEqual([0])
    phatPhien({ buoiId: 'b1', tamAn: false }) // thầy mở bảng điểm danh
    await troi(3000); expect(soLanGoi).toBe(1)
    dsMay = [buoi('b1', { trangThai: 'dang_xu_ly', tienDo: 5, soDoan: 0, ve: null })]
    phatPhien({ buoiId: 'b1', tamAn: true }) // Esc ra Hôm nay sau khi tắt live
    await troi(1600)
    expect(soLanGoi).toBe(2); expect(thay).toEqual([0, 1])
    await troi(15_000); expect(soLanGoi).toBe(3); expect(thay).toEqual([0, 1, 1])
    dsMay = [buoi('b1')]
    await troi(15_000); expect(thay).toEqual([0, 1, 1, 0])
    const xong = soLanGoi
    await troi(60_000); expect(soLanGoi).toBe(xong) // xong ⇒ dừng nhịp
    // gỡ ⇒ không nghe nữa
    dung(); phatPhien(null); await troi(5000); expect(soLanGoi).toBe(xong)
  })
})
