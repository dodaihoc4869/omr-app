// THẦY 14/10 (ảnh thẻ "Lịch dành riêng cho em · Kiểm tra ôn tập · Thứ Bảy 17/10 · còn 3 ngày"): "Bỏ nút xem lịch kiểm tra, khi nào tới lịch kiểm tra thì hiển
// bảng đó lên đầu và mở nút bắt đầu kiểm tra nhé". Khoá: (1) thẻ sắp đến KHÔNG còn nút "Xem lịch kiểm tra"; (2) ngày kiểm tra (kể cả có kế hoạch học nhẹ)
// thẻ kiểm tra đứng TRƯỚC khối học hôm nay, có nút "Làm bài kiểm tra"; (3) ngày khác thẻ vẫn nằm SAU khối học; (4) kết quả bài đã qua vẫn có "Xem kết quả".
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import HocTapHomNay from '../src/components/hoc-tap/HocTapHomNay'
import TheKiemTra from '../src/components/hoc-tap/TheKiemTraCaNhan'
import { docSanh } from '../src/components/hoa2/api'
import type { TomTatKiemTra } from '../src/lib/kiem-tra-ca-nhan'
vi.mock('../src/lib/tu-sua-loi', () => ({ useSoCauCanSua: () => 0 }))
vi.mock('../src/components/hoa2/api', async (importOriginal) => ({ ...await importOriginal(), goiHoa2: vi.fn() }))
afterEach(() => { cleanup(); localStorage.clear() })
const noop = () => {}
const now = Date.parse('2026-10-14T02:00:00Z')
const sapDen: TomTatKiemTra = { id: 'kt-S1', ngay: '2026-10-17', moLuc: Date.parse('2026-10-16T17:00:00Z'), hanLuc: Date.parse('2026-10-17T17:00:00Z'), serverNow: now, trangThai: 'sap_den', homNay: false, tong: 28, daTra: 0, con: 28, soChang: 5, phut: 50, soBai: 9, tongKienThuc: 28, phuDe: 28, nguonDayDu: true, lyDo: '', thieuNguon: 0, diem: null, nopLuc: null, baiNgayToiThieu: 12 }
const homNay: TomTatKiemTra = { ...sapDen, ngay: '2026-10-14', moLuc: Date.parse('2026-10-13T17:00:00Z'), hanLuc: Date.parse('2026-10-14T17:00:00Z'), trangThai: 'can_lam', homNay: true }
const man = (kt: TomTatKiemTra, onKiemTra = vi.fn()) => render(<HocTapHomNay ten="An" lop="12A1" ketQua={docSanh({ cheDo2: true, ngay: kt.ngay, kiemTraCaNhan: kt, theLuc: { tong: 12, con: 12 } })!} dangTai={false} loi="" onHoc={noop} onXemLai={noop} onChua={noop} onThi={noop} onTuLuyen={noop} onLichSu={noop} onBaiTap={noop} onGiaDinh={noop} onTaiLai={noop} onDangXuat={noop} coCa={false} onKiemTra={onKiemTra} />)

it('thẻ sắp đến: không còn nút "Xem lịch kiểm tra", vẫn đủ ngày, số câu, số phút', () => {
  render(<TheKiemTra du={sapDen} onMo={vi.fn()} />)
  expect(screen.queryByRole('button', { name: /Xem lịch kiểm tra/ })).toBeNull()
  expect(screen.queryAllByRole('button')).toHaveLength(0)
  expect(screen.getByText('28')).toBeTruthy(); expect(screen.getByText('50')).toBeTruthy()
})

it('ngày kiểm tra có kế hoạch học nhẹ: thẻ kiểm tra lên ĐẦU (trước khối học), nút "Làm bài kiểm tra" mở bài', async () => {
  const kiem = vi.fn()
  man(homNay, kiem)
  const nut = await screen.findByRole('button', { name: /Làm bài kiểm tra/ })
  const the = nut.closest('[aria-label="Kiểm tra theo lịch riêng"]')!
  const hoc = await screen.findByText(/Hôm nay ·/)
  expect(the.compareDocumentPosition(hoc) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy() // khối học đứng SAU thẻ kiểm tra
  fireEvent.click(nut); expect(kiem).toHaveBeenCalledOnce()
})

it('ngày khác (sắp đến): thẻ kiểm tra nằm SAU khối học, không nút nào trên thẻ', async () => {
  man(sapDen)
  const hoc = await screen.findByText(/Hôm nay ·/)
  const the = (await screen.findByText('Kiểm tra ôn tập')).closest('[aria-label="Kiểm tra theo lịch riêng"]')!
  expect(hoc.compareDocumentPosition(the) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(the.querySelectorAll('button')).toHaveLength(0)
})

it('bài đã nộp (ngày khác) vẫn có "Xem kết quả"', () => {
  render(<TheKiemTra du={{ ...sapDen, ngay: '2026-10-10', trangThai: 'da_nop', nopLuc: Date.parse('2026-10-10T03:00:00Z'), diem: 8, daTra: 28 }} onMo={vi.fn()} />)
  expect(screen.getByRole('button', { name: /Xem kết quả/ })).toBeTruthy()
})
