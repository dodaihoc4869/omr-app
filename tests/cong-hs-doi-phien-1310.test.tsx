// @vitest-environment jsdom
// Máy dùng chung: phiên mới không nhận bảng bài tập hoặc phản hồi đang tải của phiên trước.
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import StudentPortalScreen, { chuanHoaBaiMom } from '../src/screens/StudentPortalScreen'
const api = vi.hoisted(() => ({ btvn: vi.fn(), lichSu: vi.fn(), mom: vi.fn() }))
vi.mock('../src/components/hoc-tap/HocTapHomNay', () => ({ default: (p: { ten: string; soBaiTap: number; onDangXuat: () => void; onBaiTap: () => void; onGiaDinh: () => void; onKetQua: () => void }) => <div>
  <h1>{p.ten}</h1><output data-testid="so-bai">{p.soBaiTap}</output>
  <button type="button" onClick={p.onDangXuat}>Đăng xuất thử</button><button type="button" onClick={p.onBaiTap}>Mở bài thử</button><button type="button" onClick={p.onGiaDinh}>Mở gia đình thử</button><button type="button" onClick={p.onKetQua}>Mở kết quả thử</button>
</div> }))
vi.mock('../src/screens/DangNhapHocSinh', () => ({ default: ({ onDangNhap }: { onDangNhap: (v: unknown) => void }) => <button type="button" onClick={() => onDangNhap({ sbd: 'S2', hoTen: 'Em mới', lop: '12A1', token: 'token-moi' })}>Vào em mới</button> }))
vi.mock('../src/components/HopThoaiCong', () => ({ useHopThoai: () => ({ hoi: async () => true, bao: vi.fn(), hop: null }) }))
vi.mock('../src/components/m3', async (goc) => ({ ...await goc<typeof import('../src/components/m3')>(), dungM3: () => true }))
vi.mock('../src/components/diem-danh/TheDiemDanhHs', () => ({ default: () => null }))
vi.mock('../src/components/ThongBaoHocSinh', () => ({ default: () => null, noticeApi: vi.fn() }))
vi.mock('../src/components/bang-nhiem-vu/BtvnM3', () => ({ default: () => <div>Bảng bài thử</div> }))
vi.mock('../src/components/bang-nhiem-vu/MomM3', () => ({ MomDanhSachM3: ({ ds, onBatDau, onXemKetQua }: { ds: { tieuDe: string; trangThai: string }[]; onBatDau: (b: unknown) => void; onXemKetQua: (b: unknown) => void }) => <div data-testid="mom-list">{ds.map(b => <button key={b.tieuDe} type="button" onClick={() => b.trangThai === 'da_nop' ? onXemKetQua(b) : onBatDau(b)}>{b.tieuDe}</button>)}</div>, MomLamBaiM3: ({ traLoi, datTraLoi, onNop }: { traLoi: Record<string, string>; datTraLoi: (qid: string, v: string) => void; onNop: () => void }) => <div><output data-testid="mom-tra">{JSON.stringify(traLoi)}</output><button type="button" onClick={() => datTraLoi('q1', 'B')}>Chọn B thử</button><button type="button" onClick={() => datTraLoi('q1', 'C')}>Chọn C thử</button><button type="button" onClick={onNop}>Nộp Mom thử</button></div> }))
vi.mock('../src/components/KhungXemPhieu', () => ({ default: ({ html }: { html: string }) => <div data-testid="phieu">{html}</div> }))
vi.mock('../src/components/hoa2/api', () => ({ canThanTuSanh: () => false, useSanhHoa2: () => ({ cheDo2: false, ketQua: null, dangTai: false, loi: '', taiLai: vi.fn() }) }))
vi.mock('../src/components/bang-nhiem-vu/may-chu', () => ({ useBanNho: () => null, useCaDangMo: () => null, useLamMoiKhiDong: () => 0, useKeHoachNgay: () => ({ keHoach: null, cu: true, daXong: true, dangLamMoi: false }) }))
vi.mock('../src/game/than-thu-v2/academic-sync', () => ({ syncStudentExp: vi.fn() }))
vi.mock('../src/lib/exam-db', async (goc) => ({ ...await goc<typeof import('../src/lib/exam-db')>(), loadScriptUrlHoacMacDinh: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (goc) => ({ ...await goc<typeof import('../src/lib/exam-api')>(), hsLichSuCaApi: (...a: unknown[]) => api.lichSu(...a), hsBtvnApi: (...a: unknown[]) => api.btvn(...a) }))
vi.mock('../src/lib/mom-api', () => ({ momApi: (...a: unknown[]) => api.mom(...a), momReviewHtml: vi.fn() }))
beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: 'S1', hoTen: 'Em cũ', lop: '12A1', token: 'token-cu' }))
  api.mom.mockResolvedValue({ ok: true, items: [] })
  api.lichSu.mockResolvedValue({ ok: true, items: [] })
  api.btvn.mockImplementation(async (_url: string, sbd: string) => sbd === 'S1' ? { ok: true, items: [{ maBtvn: 'cu', tenCa: 'Bài em cũ', daNop: false }] } : new Promise(() => {}))
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); api.btvn.mockReset(); api.lichSu.mockReset(); api.mom.mockReset(); localStorage.clear() })
it('trình duyệt chặn lưu phiên vẫn đăng nhập bằng phiên mới trong bộ nhớ', async () => {
  localStorage.clear()
  const luu = Storage.prototype.setItem
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, value) {
    if (key === 'omr_student_portal_auth') throw new DOMException('Không cho lưu phiên', 'SecurityError')
    luu.call(this, key, value)
  })
  render(<StudentPortalScreen />)
  fireEvent.click(screen.getByRole('button', { name: 'Vào em mới' }))
  expect(await screen.findByRole('heading', { name: 'Em mới' })).toBeTruthy()
  expect(localStorage.getItem('omr_student_portal_auth')).toBeNull()
  await waitFor(() => expect(api.btvn).toHaveBeenCalledWith('/test', 'S2'))
})
it('chặn xóa phiên vẫn đăng xuất và dựng cổng sạch cho em mới, không hồi lại em cũ khi vẽ lại', async () => {
  const xoa = Storage.prototype.removeItem
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (key) {
    if (key === 'omr_student_portal_auth') throw new DOMException('Không cho xóa phiên', 'SecurityError')
    xoa.call(this, key)
  })
  const ui = render(<StudentPortalScreen />)
  fireEvent.click(screen.getByRole('button', { name: 'Mở bài thử' }))
  await screen.findByText('Bảng bài thử')
  fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất thử', hidden: true }))
  await screen.findByRole('button', { name: 'Vào em mới' })
  expect(localStorage.getItem('omr_student_portal_auth')).toBe('')
  ui.rerender(<StudentPortalScreen />)
  expect(screen.queryByRole('heading', { name: 'Em cũ' })).toBeNull()
  expect(screen.queryByText('Bảng bài thử')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Vào em mới' }))
  await screen.findByRole('heading', { name: 'Em mới' })
  expect(screen.getByTestId('so-bai').textContent).toBe('0')
})
it('đăng xuất ngay cả khi trình duyệt chưa trả về đăng ký thông báo', async () => {
  const cu = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker')
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: { getRegistration: () => new Promise(() => {}) } })
  try {
    render(<StudentPortalScreen />)
    fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất thử' }))
    expect(await screen.findByRole('button', { name: 'Vào em mới' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Em cũ' })).toBeNull()
  } finally { if (cu) Object.defineProperty(navigator, 'serviceWorker', cu); else Reflect.deleteProperty(navigator, 'serviceWorker') }
})
it('với Lịch sử 300 ms và BTVN 100 ms, hai yêu cầu bắt đầu cùng lúc và BTVN hiện ở 100 ms', async () => {
  vi.useFakeTimers()
  const batDau = Date.now(), moc: Record<string, number> = {}
  api.lichSu.mockImplementation(() => { moc.lichSu = Date.now(); return new Promise(resolve => setTimeout(() => resolve({ ok: true, items: [] }), 300)) })
  api.btvn.mockImplementation(() => { moc.btvn = Date.now(); return new Promise(resolve => setTimeout(() => resolve({ ok: true, items: [{ maBtvn: 'bt1', daNop: false }] }), 100)) })
  await act(async () => { render(<StudentPortalScreen />) })
  expect(moc).toEqual({ lichSu: batDau, btvn: batDau })
  await act(async () => { await vi.advanceTimersByTimeAsync(100) })
  expect(screen.getByTestId('so-bai').textContent).toBe('1')
  await act(async () => { await vi.advanceTimersByTimeAsync(200) })
})
it('BTVN bắt đầu tải khi Lịch sử ca còn chờ, và hiện ngay khi lượt riêng của nó xong', async () => {
  let traLichSu!: (v: unknown) => void
  api.lichSu.mockImplementation(() => new Promise(resolve => { traLichSu = resolve }))
  render(<StudentPortalScreen />)
  await waitFor(() => expect(api.btvn).toHaveBeenCalledWith('/test', 'S1'))
  expect(api.lichSu).toHaveBeenCalledWith('/test', 'S1')
  expect(screen.getByTestId('so-bai').textContent).toBe('1')
  await act(async () => { traLichSu({ ok: true, items: [] }) })
})
it('Lịch sử ca lỗi mạng vẫn tải và hiện BTVN, không ném lỗi nền', async () => {
  api.lichSu.mockRejectedValue(new Error('Lịch sử đang mất mạng'))
  render(<StudentPortalScreen />)
  await waitFor(() => expect(screen.getByTestId('so-bai').textContent).toBe('1'))
})
it('BTVN lỗi mạng vẫn kết thúc tải và giữ được Lịch sử ca đã về', async () => {
  api.btvn.mockRejectedValue(new Error('Bài tập đang mất mạng'))
  api.lichSu.mockResolvedValue({ ok: true, items: [{ maCa: 'ca1', tenCa: 'Ca vẫn xem được', diem: 8 }] })
  render(<StudentPortalScreen />)
  await waitFor(() => expect(api.lichSu).toHaveBeenCalledWith('/test', 'S1'))
  fireEvent.click(screen.getByRole('button', { name: 'Mở kết quả thử' }))
  expect(await screen.findByText('Ca vẫn xem được')).toBeTruthy()
  expect(screen.getByTestId('so-bai').textContent).toBe('0')
})
async function doiEm() {
  fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất thử', hidden: true }))
  fireEvent.click(await screen.findByRole('button', { name: 'Vào em mới' }))
  await screen.findByRole('heading', { name: 'Em mới', hidden: true })
}
it('em mới đang tải không thấy số bài còn giao của em trước', async () => {
  render(<StudentPortalScreen />)
  await waitFor(() => expect(screen.getByTestId('so-bai').textContent).toBe('1'))
  await doiEm()
  expect(screen.getByTestId('so-bai').textContent).toBe('0')
})
it('đăng xuất khi đang mở bài thì em mới vào Hôm nay, không giữ lớp phủ của em trước', async () => {
  render(<StudentPortalScreen />)
  fireEvent.click(screen.getByRole('button', { name: 'Mở bài thử' }))
  await screen.findByText('Bảng bài thử')
  await doiEm()
  expect(screen.queryByText('Bảng bài thử')).toBeNull()
})
it('phản hồi BTVN trễ của em cũ không cập nhật số bài của em mới', async () => {
  let traCu!: (v: unknown) => void
  api.btvn.mockImplementation((_url: string, sbd: string) => sbd === 'S1' ? new Promise(resolve => { traCu = resolve }) : Promise.resolve({ ok: true, items: [] }))
  render(<StudentPortalScreen />)
  await waitFor(() => expect(api.btvn).toHaveBeenCalledWith('/test', 'S1'))
  fireEvent.click(screen.getByRole('button', { name: 'Mở bài thử' }))
  await doiEm()
  await act(async () => { traCu({ ok: true, items: [{ maBtvn: 'muon', daNop: false }] }) })
  expect(screen.getByTestId('so-bai').textContent).toBe('0')
})
const baiMom = { id: 'mom1', tieuDe: 'Bài Mom thử', trangThai: 'dang_lam', soCau: 1, batDauLuc: new Date().toISOString(), dsCau: [{ id: 'q1', phan: 'I', text: 'Chất nào là muối?', choices: ['HCl', 'NaCl', 'NaOH', 'H2O'] }] }
it('câu Mom công khai thiếu đáp án không bị tự gán đáp án A', () => {
  const cau = chuanHoaBaiMom(baiMom).dsCau[0]
  expect(cau.dapAn).toBe('')
  expect(cau.dapAnDung).toBe('')
})
async function moMom() {
  render(<StudentPortalScreen />)
  fireEvent.click(screen.getByRole('button', { name: 'Mở gia đình thử' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Bài Mom thử' }))
  await screen.findByTestId('mom-tra')
}
it('mở Mom trên máy mới lấy câu trả lời đã lưu trên máy chủ trước khi lưu tiếp', async () => {
  api.mom.mockImplementation(async (action: string) => action === 'list' ? { ok: true, items: [baiMom] } : { ok: true, item: { ...baiMom, dapAnDaNop: { q1: 'B' } } })
  await moMom()
  expect(screen.getByTestId('mom-tra').textContent).toBe('{"q1":"B"}')
})
it('nháp local cũ không đè đáp án đã lưu trên máy khác; chỉ bù câu máy chủ còn trống', async () => {
  const bai = { ...baiMom, soCau: 2, dsCau: [...baiMom.dsCau, { ...baiMom.dsCau[0], id: 'q2' }] }
  localStorage.setItem('omr_mom_draft_S1_mom1', JSON.stringify({ q1: 'A', q2: 'C', ngoai: 'D' }))
  api.mom.mockImplementation(async (action: string) => action === 'list' ? { ok: true, items: [bai] } : { ok: true, item: { ...bai, dapAnDaNop: { q1: 'B', q2: '' } } })
  await moMom()
  expect(JSON.parse(screen.getByTestId('mom-tra').textContent!)).toEqual({ q1: 'B', q2: 'C' })
})
it('nháp offline còn nguyên khi máy chủ chưa có câu trả lời', async () => {
  localStorage.setItem('omr_mom_draft_S1_mom1', JSON.stringify({ q1: 'B' }))
  api.mom.mockImplementation(async (action: string) => action === 'list' ? { ok: true, items: [baiMom] } : { ok: true, item: { ...baiMom, dapAnDaNop: { q1: '' } } })
  await moMom()
  expect(screen.getByTestId('mom-tra').textContent).toBe('{"q1":"B"}')
})
it('nháp mới chưa ACK vẫn còn khi đổi đáp án rồi rời trước 600 ms và mở lại', async () => {
  api.mom.mockImplementation(async (action: string) => action === 'list' ? { ok: true, items: [baiMom] } : { ok: true, item: { ...baiMom, dapAnDaNop: { q1: 'A' } } })
  await moMom()
  fireEvent.click(screen.getByRole('button', { name: 'Chọn B thử' }))
  cleanup()
  await moMom()
  expect(screen.getByTestId('mom-tra').textContent).toBe('{"q1":"B"}')
})
it('ACK của đáp án cũ đang gửi không xóa nháp mới hơn của cùng câu', async () => {
  let traAck!: (v: unknown) => void
  api.mom.mockImplementation(async (action: string) => action === 'list' ? { ok: true, items: [baiMom] } : action === 'save' ? new Promise(resolve => { traAck = resolve }) : { ok: true, item: { ...baiMom, dapAnDaNop: { q1: 'A' } } })
  await moMom()
  fireEvent.click(screen.getByRole('button', { name: 'Chọn B thử' }))
  await waitFor(() => expect(api.mom).toHaveBeenCalledWith('save', expect.objectContaining({ answers: { q1: 'B' } })))
  fireEvent.click(screen.getByRole('button', { name: 'Chọn C thử' }))
  await act(async () => { traAck({ ok: true }) })
  cleanup()
  await moMom()
  expect(screen.getByTestId('mom-tra').textContent).toBe('{"q1":"C"}')
})
it('nháp đã ACK không đè câu trả lời mới được lưu trên máy khác', async () => {
  let daLuu = 'A'
  api.mom.mockImplementation(async (action: string) => action === 'list' ? { ok: true, items: [baiMom] } : action === 'save' ? { ok: true } : { ok: true, item: { ...baiMom, dapAnDaNop: { q1: daLuu } } })
  await moMom()
  fireEvent.click(screen.getByRole('button', { name: 'Chọn B thử' }))
  await waitFor(() => expect(api.mom).toHaveBeenCalledWith('save', expect.objectContaining({ answers: { q1: 'B' } })))
  cleanup(); daLuu = 'C'
  await moMom()
  expect(screen.getByTestId('mom-tra').textContent).toBe('{"q1":"C"}')
})
it('kết quả Mom dùng đáp án sau nộp từ máy chủ, không lưu phiếu tự đoán đáp án A', async () => {
  const daNop = { ...baiMom, trangThai: 'da_nop', nopLuc: new Date().toISOString(), diem: 10, soCauDung: 1, dapAnDaNop: { q1: 'B' } }
  api.mom.mockImplementation(async (action: string) => action === 'list' ? { ok: true, items: [baiMom] } : action === 'submit' ? { ok: true, item: daNop } : action === 'review' ? { ok: true, item: { ...daNop, dsCau: [{ ...baiMom.dsCau[0], dapAn: 'B', loiGiai: 'Phần chữa thật' }] } } : { ok: true, item: baiMom })
  const { momReviewHtml } = await import('../src/lib/mom-api')
  vi.mocked(momReviewHtml).mockResolvedValue('Phiếu chữa thật · đáp án B')
  await moMom()
  fireEvent.click(screen.getByRole('button', { name: 'Chọn B thử' }))
  fireEvent.click(screen.getByRole('button', { name: 'Nộp Mom thử' }))
  const button = await screen.findByRole('button', { name: 'Bài Mom thử' })
  fireEvent.click(button)
  await waitFor(() => expect(api.mom).toHaveBeenCalledWith('review', { token: 'token-cu', id: 'mom1' }))
  expect(vi.mocked(momReviewHtml).mock.calls.at(-1)?.[0].dsCau[0].dapAn).toBe('B')
  expect(screen.getByTestId('phieu').textContent).toBe('Phiếu chữa thật · đáp án B')
})
it('phiếu Mom cũ trong máy có đáp án A sai vẫn hỏi lại máy chủ để xem đáp án B đã xác nhận', async () => {
  const cu = { ...baiMom, trangThai: 'da_nop', diem: 10, htmlKetQua: 'PHIẾU CŨ · đáp án A' }
  localStorage.setItem('omr_mom_btvn_S1', JSON.stringify([cu]))
  api.mom.mockImplementation(async (action: string) => action === 'list' ? { ok: true, items: [] } : { ok: true, item: { ...cu, dsCau: [{ ...baiMom.dsCau[0], dapAn: 'B' }], dapAnDaNop: { q1: 'B' } } })
  const { momReviewHtml } = await import('../src/lib/mom-api')
  vi.mocked(momReviewHtml).mockResolvedValue('Phiếu chữa đã xác nhận · đáp án B')
  render(<StudentPortalScreen />)
  fireEvent.click(screen.getByRole('button', { name: 'Mở gia đình thử' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Bài Mom thử' }))
  await waitFor(() => expect(api.mom).toHaveBeenCalledWith('review', { token: 'token-cu', id: 'mom1' }))
  expect(screen.getByTestId('phieu').textContent).toBe('Phiếu chữa đã xác nhận · đáp án B')
  expect(screen.queryByText('PHIẾU CŨ · đáp án A')).toBeNull()
})
it('mất mạng không mở phiếu Mom cũ chưa có bằng chứng đáp án máy chủ', async () => {
  localStorage.setItem('omr_mom_btvn_S1', JSON.stringify([{ ...baiMom, trangThai: 'da_nop', diem: 10, htmlBaoCao: 'PHIẾU CŨ · đáp án A' }]))
  api.mom.mockImplementation(async (action: string) => { if (action === 'list') return { ok: true, items: [] }; throw new Error('Mạng đang gián đoạn') })
  render(<StudentPortalScreen />)
  fireEvent.click(screen.getByRole('button', { name: 'Mở gia đình thử' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Bài Mom thử' }))
  await waitFor(() => expect(api.mom).toHaveBeenCalledWith('review', { token: 'token-cu', id: 'mom1' }))
  expect(screen.queryByTestId('phieu')).toBeNull()
})
