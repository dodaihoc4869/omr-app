// Đợt 20 · Kiểm tra ôn tập theo bản vẽ docs/ban-ve-dot20 (thầy duyệt 13/10: "Chốt bản vẽ làm đi nhé").
// Khoá: thẻ đủ 5 trạng thái thật (không bịa số máy chủ chưa gửi) · lộ trình chặng (chặng đang chạy khoá chặng khác + khoá nộp toàn bài) ·
// nộp tay còn câu trống ⇒ hộp app hỏi lại, hết giờ thì không hỏi · đồng hồ đỏ khi còn dưới 1 phút · kết quả có lọc câu.
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import TheKiemTra from '../src/components/hoc-tap/TheKiemTraCaNhan'
import ManKiemTra from '../src/components/hoc-tap/ManKiemTraCaNhan'
import type { TomTatKiemTra } from '../src/lib/kiem-tra-ca-nhan'
import { conLai, gioHan, soNgayToi, thuNgay } from '../src/components/hoc-tap/kiem-tra-chu'

const api = vi.hoisted(() => vi.fn())
vi.mock('../src/components/hoa2/api', async (goc) => ({ ...(await goc<Record<string, unknown>>()), goiHoa2: api }))
// 17/10/2026 là Thứ Bảy; cửa sổ 00:00 → 24:00 giờ Việt Nam.
const now = Date.parse('2026-10-17T03:00:00Z')
const kt: TomTatKiemTra = { id: 'kt-S1', ngay: '2026-10-17', moLuc: Date.parse('2026-10-16T17:00:00Z'), hanLuc: Date.parse('2026-10-17T17:00:00Z'), serverNow: now, trangThai: 'can_lam', homNay: true, tong: 18, daTra: 0, con: 18, soChang: 3, phut: 40, soBai: 3, tongKienThuc: 60, phuDe: 42, nguonDayDu: true, lyDo: 'Kiểm chứng những phần em đang luyện thêm', thieuNguon: 0, diem: null, nopLuc: null }
const cau = (qid: string) => ({ qid, maDe: 'd', version: 'v1', group: qid, phan: 'I', text: `Câu ${qid}`, choices: ['Một', 'Hai', 'Ba', 'Bốn'], ideas: [], hinhAnh: [], dang: null, tenDang: '', mucDo: 'NB', sao: 0, kienThuc: [] })
const noop = () => {}
afterEach(() => { cleanup(); api.mockReset(); localStorage.clear(); vi.useRealTimers() })

it('chữ ngày giờ: Thứ Bảy 17/10, hạn 24:00 cùng ngày, còn N ngày, còn giờ phút', () => {
  expect(thuNgay('2026-10-17')).toBe('Thứ Bảy 17/10')
  expect(gioHan(kt.hanLuc, kt.ngay)).toBe('24:00')
  expect(soNgayToi('2026-10-17', Date.parse('2026-10-13T05:00:00Z'))).toBe(4)
  expect(conLai(9 * 3600_000 + 18 * 60_000 + 30_000)).toBe('9 giờ 18 phút')
  expect(conLai(20_000)).toBe('dưới 1 phút')
})

it('đang chuẩn bị: thẻ mỏng có thanh "phần kiến thức đã có câu" đúng số máy chủ, không nút', () => {
  render(<TheKiemTra du={{ ...kt, homNay: false, trangThai: 'cho_nguon' }} onMo={noop} />)
  const the = screen.getByRole('region', { name: 'Kiểm tra theo lịch riêng' })
  expect(the.textContent).toContain('Đang chuẩn bị')
  expect(the.textContent).toContain('42/60')
  expect(screen.getByRole('img', { name: '42 trên 60 phần kiến thức đã có câu' })).toBeTruthy()
  expect(within(the).queryByRole('button')).toBeNull()
})

it('sắp đến: tờ lịch Thứ Bảy 17/10 · còn 4 ngày, 3 ô số có nhãn, không đồng hồ đếm giây', () => {
  render(<TheKiemTra du={{ ...kt, homNay: false, trangThai: 'sap_den', serverNow: Date.parse('2026-10-13T05:00:00Z') }} onMo={noop} />)
  const the = screen.getByRole('region', { name: 'Kiểm tra theo lịch riêng' })
  expect(the.textContent).toContain('Thứ Bảy 17/10 · còn 4 ngày')
  for (const s of ['18câu', '40phút', '3bài đã học']) expect(the.textContent!.replace(/\s/g, '')).toContain(s.replace(/\s/g, ''))
  expect(the.textContent).not.toMatch(/\d+:\d\d:\d\d/)
})

it('ngày kiểm tra đã làm dở: vòng "đã trả lời", nút "Làm tiếp · còn N câu", hạn 24:00', () => {
  const mo = vi.fn()
  render(<TheKiemTra du={{ ...kt, daTra: 5, con: 13 }} onMo={mo} />)
  expect(screen.getByRole('img', { name: 'Đã trả lời 5 trên 18 câu' })).toBeTruthy()
  expect(screen.getByText('Hôm nay em chỉ cần làm bài kiểm tra này.')).toBeTruthy()
  expect(screen.getByText('24:00')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Làm tiếp · còn 13 câu' }))
  expect(mo).toHaveBeenCalledOnce()
})

it('hết hạn: chip "Đã hết hạn", điểm kiểu Việt Nam, số câu đã trả lời; không bịa số câu đúng', () => {
  render(<TheKiemTra du={{ ...kt, trangThai: 'het_han', nopLuc: kt.hanLuc, diem: 3.9, daTra: 7, con: 11 }} onMo={noop} />)
  const the = screen.getByRole('region', { name: 'Kiểm tra theo lịch riêng' })
  expect(the.textContent).toContain('Đã hết hạn')
  expect(the.textContent).toContain('3,9')
  expect(the.textContent).toContain('7/18 câu đã trả lời')
  expect(the.textContent).not.toContain('câu đúng')
})

const TRANG = (chang: unknown[], t: Partial<TomTatKiemTra> = {}) => ({ ok: true, kiemTra: { ...kt, ...t }, chang })

it('trang bài: chặng đang chạy ⇒ "Làm tiếp", chặng khác khoá kèm lý do, nộp toàn bài khoá; số đã trả lời từng chặng', async () => {
  api.mockImplementation(async () => TRANG([
    { stt: 0, soCau: 6, giay: 780, han: Date.parse('2026-10-17T02:50:00Z'), daChot: true, daTra: 6 },
    { stt: 1, soCau: 6, giay: 780, han: now + 462_000, daChot: false, daTra: 2 },
    { stt: 2, soCau: 6, giay: 840, han: null, daChot: false, daTra: 0 },
  ], { daTra: 8, con: 10 }))
  render(<ManKiemTra token="t" sbd="S1" id="kt-S1" onVe={noop} onCapNhat={noop} />)
  const ds = await screen.findByRole('list', { name: 'Các chặng' })
  expect(ds.textContent).toContain('Đã chốt')
  expect(ds.textContent).toContain('đã trả lời 2/6')
  expect(screen.getByRole('button', { name: /Làm tiếp chặng 2/ })).toBeTruthy()
  expect((screen.getByRole('button', { name: /Làm chặng 3/ }) as HTMLButtonElement).disabled).toBe(true)
  expect(ds.textContent).toContain('Nộp chặng 2 rồi mới mở chặng này.')
  expect((screen.getByRole('button', { name: 'Nộp toàn bài' }) as HTMLButtonElement).disabled).toBe(true)
  expect(screen.getByText('Hạn nộp 24:00')).toBeTruthy()
  expect(screen.getByText('Giờ riêng từng chặng')).toBeTruthy()
})

it('nộp chặng còn câu trống ⇒ hộp app hỏi lại (Làm tiếp không gửi); đồng ý mới chốt', async () => {
  const han = now + 30_000
  vi.spyOn(Date, 'now').mockReturnValue(now)
  api.mockImplementation(async (action: string) => action === 'hoc-tap-ktcn-trang-thai'
    ? TRANG([{ stt: 0, soCau: 2, giay: 60, han: null, daChot: false }])
    : action === 'hoc-tap-ktcn-start' ? { ...TRANG([]), revision: 0, hanChang: han, daChot: false, questions: [cau('q1'), cau('q2')], tra: { q1: 'A', q2: '' } }
      : { ...TRANG([]), revision: 1, daLuu: true })
  render(<div className="m3"><ManKiemTra token="t" sbd="S1" id="kt-S1" onVe={noop} onCapNhat={noop} /></div>)
  fireEvent.click(await screen.findByRole('button', { name: /Làm chặng 1/ }))
  // (đề "Câu q1" bị bộ hiển thị công thức tách chỉ số dưới ⇒ chờ nút câu thay vì chữ đề)
  fireEvent.click((await screen.findAllByRole('button', { name: 'Câu 2' }))[0]!)
  fireEvent.click(await screen.findByRole('button', { name: 'Nộp chặng 1' }))
  const hop = await screen.findByRole('alertdialog', { name: 'Nộp chặng 1?' })
  expect(hop.textContent).toContain('còn 1 câu chưa trả lời (câu 2)')
  fireEvent.click(within(hop).getByRole('button', { name: 'Làm tiếp' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(api.mock.calls.some((c) => c[0] === 'hoc-tap-ktcn-chot-chang')).toBe(false)
  fireEvent.click(screen.getByRole('button', { name: 'Nộp chặng 1' }))
  fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Nộp chặng 1' }))
  await waitFor(() => expect(api.mock.calls.filter((c) => c[0] === 'hoc-tap-ktcn-chot-chang')).toHaveLength(1))
})

it('đồng hồ chặng chuyển đỏ khi còn dưới 1 phút; hết giờ tự chốt KHÔNG hỏi lại', async () => {
  let t = now
  vi.spyOn(Date, 'now').mockImplementation(() => t)
  api.mockImplementation(async (action: string) => action === 'hoc-tap-ktcn-trang-thai'
    ? TRANG([{ stt: 0, soCau: 1, giay: 120, han: null, daChot: false }])
    : action === 'hoc-tap-ktcn-start' ? { ...TRANG([]), revision: 0, hanChang: now + 50_000, daChot: false, questions: [cau('q1')], tra: { q1: '' } }
      : { ...TRANG([]), revision: 1, daLuu: false })
  render(<ManKiemTra token="t" sbd="S1" id="kt-S1" onVe={noop} onCapNhat={noop} />)
  fireEvent.click(await screen.findByRole('button', { name: /Làm chặng 1/ }))
  const gio = await screen.findByLabelText('Thời gian chặng còn lại')
  expect(gio.closest('.ktcn-dh')!.hasAttribute('data-gap')).toBe(true)
  t = now + 51_000
  await waitFor(() => expect(api.mock.calls.filter((c) => c[0] === 'hoc-tap-ktcn-chot-chang')).toHaveLength(1), { timeout: 3000 })
  expect(screen.queryByRole('alertdialog')).toBeNull()
})

it('kết quả: điểm, số câu đúng đếm từ máy chủ, lọc "Cần ôn lại" chỉ còn câu sai', async () => {
  const ketQua = { bai: [{ ten: 'Bài 8. Amine', tong: 4, daKiem: 4, dungLanNay: 3 }], chu: 'Kết quả kiểm tra',
    cau: [{ de: cau('q1'), tra: 'A', dung: true, dapAn: 'A', loiGiai: null }, { de: cau('q2'), tra: 'B', dung: false, dapAn: 'C', loiGiai: null }, { de: cau('q3'), tra: '', dung: false, dapAn: 'D', loiGiai: null }] }
  api.mockImplementation(async (action: string) => action === 'hoc-tap-ktcn-trang-thai'
    ? TRANG([], { trangThai: 'da_nop', nopLuc: now, diem: 3.33, daTra: 2, con: 16 })
    : { ...TRANG([], { trangThai: 'da_nop', nopLuc: now, diem: 3.33, daTra: 2, con: 16 }), ketQua })
  render(<ManKiemTra token="t" sbd="S1" id="kt-S1" onVe={noop} onCapNhat={noop} />)
  expect(await screen.findByRole('img', { name: 'Điểm 3,33 trên 10' })).toBeTruthy()
  expect(screen.getByText('1/3')).toBeTruthy()
  expect(screen.getByText('3/4 mục')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Cần ôn lại · 1' }))
  const ds = document.querySelector('.ktcn-ds-cau')!
  expect(ds.querySelectorAll('details')).toHaveLength(1)
  expect(ds.textContent).toContain('Câu 2')
  expect(screen.getByRole('button', { name: 'Chưa trả lời · 1' })).toBeTruthy()
})
