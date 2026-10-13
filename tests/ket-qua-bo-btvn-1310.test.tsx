// @vitest-environment jsdom
// Thầy 13/10 (ảnh tab Kết quả của app học sinh: Ca kiểm tra · Kết quả bài đã nộp · Bài tập về nhà): "Bỏ phần btvn ở đây".
// Khoá: tab Kết quả KHÔNG còn thẻ "Bài tập về nhà"; Hôm nay vẫn hiện "Bài tập về nhà · Thầy đang giao" khi thầy đang giao bài (đường vào duy nhất còn lại).
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import HocTapHomNay from '../src/components/hoc-tap/HocTapHomNay'
import { docSanh } from '../src/components/hoa2/api'
vi.mock('../src/components/hoa2/api', async (goc) => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: vi.fn(async () => ({ ok: false })) }))
afterEach(() => { cleanup(); vi.clearAllMocks(); localStorage.clear() })

it('tab Kết quả không còn Bài tập về nhà; Hôm nay vẫn có khi thầy đang giao', () => {
  const sanh = docSanh({ cheDo2: true, theLuc: { con: 18, tong: 24 }, hanhTrinh: { tang: 1, toiThieu: 24, daLam: 6, daXep: 24, conThieu: 0, soChang: 4, changHienTai: 2, cauTrongChang: 6 } })
  const onBaiTap = vi.fn()
  render(<HocTapHomNay ten="An" lop="12A1" ketQua={sanh} dangTai={false} loi="" coCa={false} soBaiTap={2} onHoc={vi.fn()} onXemLai={vi.fn()} onChua={vi.fn()} onThi={vi.fn()} onTuLuyen={vi.fn()} onLichSu={vi.fn()} onBaiTap={onBaiTap} onGiaDinh={vi.fn()} onTaiLai={vi.fn()} onDangXuat={vi.fn()} />)
  const onSua = screen.getByRole('region', { name: 'Ôn và sửa' })
  fireEvent.click(within(onSua).getByText('Bài tập về nhà'))
  expect(onBaiTap).toHaveBeenCalledOnce()
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Điều hướng học sinh' })).getByText('Kết quả'))
  const kq = screen.getByRole('region', { name: 'Kết quả' })
  expect(within(kq).getByText('Ca kiểm tra')).toBeTruthy()
  expect(within(kq).queryByText('Bài tập về nhà')).toBeNull()
  expect(screen.queryByText('Bài tập về nhà')).toBeNull()
})
