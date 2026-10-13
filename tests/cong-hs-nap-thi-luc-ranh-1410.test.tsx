// Cổng đăng nhập không tải màn thi; đã đăng nhập chỉ hẹn lúc rảnh, bấm Vào thi tải ngay.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import StudentPortalScreen from '../src/screens/StudentPortalScreen'
const doLuong = vi.hoisted(() => ({ nap: vi.fn() }))
vi.mock('../src/screens/ExamTakeScreen', () => { doLuong.nap(); return { default: () => <div>Màn thi đã tải</div> } })
vi.mock('../src/components/hoc-tap/HocTapHomNay', () => ({ default: ({ onThi }: { onThi: () => void }) => <button onClick={onThi}>Vào thi thử</button> }))
vi.mock('../src/screens/DangNhapHocSinh', () => ({ default: ({ onDangNhap }: { onDangNhap: (v: unknown) => void }) => <button onClick={() => onDangNhap({ sbd: 'S1', hoTen: 'Em thử', token: 'token' })}>Đăng nhập thử</button> }))
vi.mock('../src/components/HopThoaiCong', () => ({ useHopThoai: () => ({ hoi: async () => true, bao: vi.fn(), hop: null }) }))
vi.mock('../src/components/diem-danh/TheDiemDanhHs', () => ({ default: () => null }))
vi.mock('../src/components/ThongBaoHocSinh', () => ({ default: () => null, noticeApi: vi.fn() }))
vi.mock('../src/components/hoa2/api', () => ({ canThanTuSanh: () => false, useSanhHoa2: () => ({ cheDo2: false, ketQua: null, dangTai: false, loi: '', taiLai: vi.fn() }) }))
vi.mock('../src/components/bang-nhiem-vu/may-chu', () => ({ useBanNho: () => null, useCaDangMo: () => null, useLamMoiKhiDong: () => 0, useKeHoachNgay: () => ({ keHoach: null, cu: true, daXong: true, dangLamMoi: false }) }))
vi.mock('../src/game/than-thu-v2/academic-sync', () => ({ syncStudentExp: vi.fn() }))
vi.mock('../src/lib/exam-db', async goc => ({ ...await goc<typeof import('../src/lib/exam-db')>(), loadScriptUrlHoacMacDinh: async () => '/test' }))
vi.mock('../src/lib/exam-api', async goc => ({ ...await goc<typeof import('../src/lib/exam-api')>(), hsLichSuCaApi: async () => ({ ok: true, items: [] }), hsBtvnApi: async () => ({ ok: true, items: [] }) }))
vi.mock('../src/lib/mom-api', () => ({ momApi: async () => ({ ok: true, items: [] }), momReviewHtml: vi.fn() }))
afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear() })
it('chờ xác thực và giờ rảnh; tiết kiệm dữ liệu vẫn cho em chủ động mở thi ngay', async () => {
  localStorage.clear()
  const hen = vi.fn(), huy = vi.fn()
  vi.stubGlobal('requestIdleCallback', hen.mockReturnValue(42))
  vi.stubGlobal('cancelIdleCallback', huy)
  render(<StudentPortalScreen />)
  expect(hen).not.toHaveBeenCalled()
  expect(doLuong.nap).not.toHaveBeenCalled()
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập thử' })) })
  expect(hen).toHaveBeenCalledOnce()
  expect(doLuong.nap).not.toHaveBeenCalled()
  cleanup()
  expect(huy).toHaveBeenCalledWith(42)
  // Callback cũ dù trình duyệt gọi muộn sau khi đóng cũng không tải gì.
  await act(async () => { hen.mock.calls[0][0]() })
  expect(doLuong.nap).not.toHaveBeenCalled()
  Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true } })
  try {
    render(<StudentPortalScreen />)
    expect(hen).toHaveBeenCalledOnce()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Vào thi thử' })) })
    expect(doLuong.nap).toHaveBeenCalledOnce()
  } finally { Reflect.deleteProperty(navigator, 'connection') }
})
