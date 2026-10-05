// THẺ "CHẤT LƯỢNG SỬA LỖI · 14 NGÀY" (Tổng quan app thầy, 05/10): dữ liệu giả ⇒ đủ 6 dòng có nhãn + số mẫu, "Chưa đủ dữ liệu" khi n nhỏ,
// đổi lớp; máy chủ lỗi / chưa có lệnh / trả lời lạ ⇒ thẻ KHÔNG hiện (màn Tổng quan không vỡ).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

const m = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => m.goi(duong, body) }))

import TheChatLuongLoi from '../src/components/chat-luong/TheChatLuongLoi'
import { docChatLuong } from '../src/components/chat-luong/api'

const tl = (dat: number, n: number) => ({ tiLe: n ? dat / n : null, dat, n, du: n >= 10 })
const ketQua = (tenLop: string, o: Record<string, unknown> = {}) => ({
  tenLop, khoi: '12', soEm: tenLop === '11B' ? 30 : 44, tuNgay: '2026-09-22', denNgay: '2026-10-05', soNgay: 14, nToiThieu: 10,
  lamLaiDau: tl(31, 48), saiLaiDuyTri: [{ moc: 14, ...tl(4, 22) }, { moc: 30, ...tl(1, 3) }],
  ngayToiDong: { trungVi: 4.5, n: 31, du: true }, cauLaCungDang: tl(28, 40), lapNguyenVan: tl(12, 48), boKhacKhoi: 3, soEmCoLuot: 40, ...o,
})
const LOP = [{ tenLop: '12A1', khoi: '12', soEm: 44 }, { tenLop: '11B', khoi: '11', soEm: 30 }]
const tra = (tenLop = '12A1', o: Record<string, unknown> = {}) => ({ ok: true, du: { ok: true, homNay: '2026-10-05', soNgay: 14, nToiThieu: 10, lop: LOP, chon: tenLop, ketQua: ketQua(tenLop, o) } })
const choXong = () => act(async () => { for (let i = 0; i < 5; i++) await Promise.resolve() })

afterEach(() => {
  cleanup()
  m.goi.mockReset()
  localStorage.clear()
})

describe('thẻ Chất lượng sửa lỗi', () => {
  it('đủ 6 dòng: nhãn đời thường + số + số mẫu; n nhỏ ⇒ "Chưa đủ dữ liệu"; chú thích khối; đổi lớp gọi đúng lớp và nhớ lớp', async () => {
    m.goi.mockImplementation(async (_d: string, b: Record<string, unknown>) => tra(String(b.lop ?? '12A1')))
    render(<TheChatLuongLoi />)
    const the = await screen.findByRole('region', { name: 'Chất lượng sửa lỗi · 14 ngày' })
    expect(m.goi).toHaveBeenCalledWith('/gv/chat-luong-loi', { soNgay: 14 })
    expect(the.textContent).toContain('Lớp 12A1 · 44 em · 22/09–05/10')
    const dong = [...the.querySelectorAll('.clg-dong')].map((x) => [x.querySelector('dt')?.textContent, x.querySelector('dd')?.textContent])
    expect(dong).toEqual([
      ['Làm lại câu đã sai: đúng ngay lần đầu', '65%trên 48 lượt làm lại'], // 31/48
      ['Đã khắc phục, kiểm lại sau 14 ngày: sai lại', '18%trên 22 lượt kiểm'], // 4/22
      ['Đã khắc phục, kiểm lại sau 30 ngày: sai lại', 'Chưa đủ dữ liệumới 3 lượt kiểm, cần từ 10'],
      ['Từ lần sai cuối tới khi khắc phục (trung vị)', '4,5 ngày31 lỗi đã khắc phục'],
      ['Câu lạ cùng dạng câu đã sai: làm đúng', '70%trên 40 lượt · câu em chưa từng gặp'], // 28/40
      ['Lượt làm lại phải lặp nguyên văn câu đã sai', '12 lượttrên 48 lượt làm lại · 25%'],
    ])
    expect(the.textContent).toContain('Chỉ tính lượt tự làm (không trợ giúp, không xem lời giải 12 giờ trước) và câu đúng khối của lớp — đã bỏ 3 câu khác khối.')
    // Không mã nội bộ trên thẻ.
    expect(the.textContent).not.toMatch(/qid|tc =|nv =|xt =|~ss|sbd/i)
    const nhom = within(the).getByRole('group', { name: 'Chọn lớp' })
    expect(within(nhom).getByRole('button', { name: '12A1' }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(within(nhom).getByRole('button', { name: '11B' }))
    expect(m.goi).toHaveBeenLastCalledWith('/gv/chat-luong-loi', { lop: '11B', soNgay: 14 })
    await waitFor(() => expect(the.textContent).toContain('Lớp 11B · 30 em'))
    expect(within(nhom).getByRole('button', { name: '11B' }).getAttribute('aria-pressed')).toBe('true')
    // Lần mở sau: nhớ lớp thầy xem gần nhất.
    cleanup()
    render(<TheChatLuongLoi />)
    await screen.findByRole('region', { name: 'Chất lượng sửa lỗi · 14 ngày' })
    expect(m.goi).toHaveBeenLastCalledWith('/gv/chat-luong-loi', { lop: '11B', soNgay: 14 })
  })

  it('lớp chưa có mẫu nào ⇒ MỘT dòng nói vì sao trống, không dòng số', async () => {
    const khong = tl(0, 0)
    m.goi.mockResolvedValue(tra('12A1', { lamLaiDau: khong, saiLaiDuyTri: [{ moc: 14, ...khong }, { moc: 30, ...khong }], ngayToiDong: { trungVi: null, n: 0, du: false }, cauLaCungDang: khong, lapNguyenVan: khong, boKhacKhoi: 0 }))
    render(<TheChatLuongLoi />)
    const the = await screen.findByRole('region', { name: 'Chất lượng sửa lỗi · 14 ngày' })
    expect(the.textContent).toContain('Chưa có lượt làm lại câu sai nào trong 14 ngày qua — số liệu hiện khi các em làm lại câu đã sai.')
    expect(the.querySelectorAll('.clg-dong')).toHaveLength(0)
    expect(the.textContent).not.toContain('câu khác khối')
  })

  it('máy chủ lỗi / chưa có lệnh / trả lời lạ / ném lỗi ⇒ thẻ KHÔNG hiện', async () => {
    const cach = [
      async () => ({ ok: false, loai: 'chua_co_lenh', chu: 'Máy chủ chưa có lệnh' }),
      async () => ({ ok: false, loai: 'tu_choi', chu: 'Sai mã bí mật' }),
      async () => ({ ok: true, du: { ok: true, homNay: '2026-09-28', chienDich: [] } }), // câu trả lời của lệnh khác
      async () => ({ ok: true, du: { ...tra().du, ketQua: { ...ketQua('12A1'), lamLaiDau: { tiLe: 2, dat: 60, n: 48, du: true } } } }), // dat > n
      async () => { throw new Error('mạng') },
    ]
    for (const f of cach) {
      m.goi.mockImplementation(f)
      const { container } = render(<TheChatLuongLoi />)
      await waitFor(() => expect(m.goi).toHaveBeenCalled())
      await choXong()
      expect(container.innerHTML).toBe('')
      cleanup()
      m.goi.mockReset()
    }
  })

  it('đổi lớp: đang tính ⇒ số cũ giữ chỗ (thẻ không co, màn không nhảy); lỗi ⇒ báo ngay trong thẻ + Thử lại (không mất thẻ)', async () => {
    let xong: (v: unknown) => void = () => {}
    m.goi.mockResolvedValueOnce(tra('12A1')).mockImplementationOnce(() => new Promise((r) => { xong = r })).mockResolvedValueOnce(tra('11B'))
    render(<TheChatLuongLoi />)
    const the = await screen.findByRole('region', { name: 'Chất lượng sửa lỗi · 14 ngày' })
    fireEvent.click(within(the).getByRole('button', { name: '11B' }))
    expect(the.textContent).toContain('Đang tính số liệu lớp 11B…')
    expect(the.querySelectorAll('.clg-dong')).toHaveLength(6)
    expect(the.querySelector('.clg-than')?.hasAttribute('data-dang-tai')).toBe(true)
    expect(within(the).getByRole('button', { name: '12A1' }).hasAttribute('disabled')).toBe(true)
    await act(async () => { xong({ ok: false, loai: 'mang', chu: 'Không nối được máy chủ.' }) })
    const loi = await within(the).findByRole('alert')
    expect(the.querySelector('.clg-than')?.hasAttribute('data-dang-tai')).toBe(false)
    expect(loi.textContent).toContain('Chưa tính được số liệu lớp 11B: Không nối được máy chủ.')
    fireEvent.click(within(loi).getByRole('button', { name: 'Thử lại' }))
    await waitFor(() => expect(the.textContent).toContain('Lớp 11B · 30 em'))
    expect(m.goi).toHaveBeenCalledTimes(3)
  })

  it('đọc câu trả lời: sai dạng ở bất kỳ chỗ nào ⇒ null; lớp chưa có ⇒ ketQua null', () => {
    expect(docChatLuong(tra().du)?.ketQua?.lamLaiDau).toEqual({ tiLe: 31 / 48, dat: 31, n: 48, du: true })
    expect(docChatLuong({ ...tra().du, ketQua: null })).toMatchObject({ lop: [{ tenLop: '12A1', soEm: 44 }, { tenLop: '11B', soEm: 30 }], ketQua: null })
    expect(docChatLuong({ ...tra().du, lop: [{ tenLop: '' }] })).toBeNull()
    expect(docChatLuong({ ...tra().du, ketQua: { ...ketQua('12A1'), saiLaiDuyTri: [{ moc: 0, ...tl(1, 2) }] } })).toBeNull()
    expect(docChatLuong({ ...tra().du, ketQua: { ...ketQua('12A1'), tuNgay: '22/09' } })).toBeNull()
    expect(docChatLuong({ ...tra().du, ketQua: { ...ketQua('12A1'), ngayToiDong: { n: 3 } } })).toBeNull()
  })
})
