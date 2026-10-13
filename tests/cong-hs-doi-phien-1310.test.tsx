// @vitest-environment jsdom
// Máy dùng chung: phiên mới không nhận bảng bài tập hoặc phản hồi đang tải của phiên trước.
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import StudentPortalScreen, { chuanHoaBaiMom } from '../src/screens/StudentPortalScreen'
const api = vi.hoisted(() => ({ btvn: vi.fn(), mom: vi.fn() }))
vi.mock('../src/components/hoc-tap/HocTapHomNay', () => ({ default: (p: { ten: string; soBaiTap: number; onDangXuat: () => void; onBaiTap: () => void; onGiaDinh: () => void }) => <div>
  <h1>{p.ten}</h1><output data-testid="so-bai">{p.soBaiTap}</output>
  <button type="button" onClick={p.onDangXuat}>Đăng xuất thử</button><button type="button" onClick={p.onBaiTap}>Mở bài thử</button><button type="button" onClick={p.onGiaDinh}>Mở gia đình thử</button>
</div> }))
vi.mock('../src/screens/DangNhapHocSinh', () => ({ default: ({ onDangNhap }: { onDangNhap: (v: unknown) => void }) => <button type="button" onClick={() => onDangNhap({ sbd: 'S2', hoTen: 'Em mới', lop: '12A1', token: 'token-moi' })}>Vào em mới</button> }))
vi.mock('../src/components/HopThoaiCong', () => ({ useHopThoai: () => ({ hoi: async () => true, bao: vi.fn(), hop: null }) }))
vi.mock('../src/components/m3', async (goc) => ({ ...await goc<typeof import('../src/components/m3')>(), dungM3: () => true }))
vi.mock('../src/components/diem-danh/TheDiemDanhHs', () => ({ default: () => null }))
vi.mock('../src/components/ThongBaoHocSinh', () => ({ default: () => null, noticeApi: vi.fn() }))
vi.mock('../src/components/bang-nhiem-vu/BtvnM3', () => ({ default: () => <div>Bảng bài thử</div> }))
vi.mock('../src/components/bang-nhiem-vu/MomM3', () => ({ MomDanhSachM3: ({ ds, onBatDau, onXemKetQua }: { ds: { tieuDe: string; trangThai: string }[]; onBatDau: (b: unknown) => void; onXemKetQua: (b: unknown) => void }) => <div data-testid="mom-list">{ds.map(b => <button key={b.tieuDe} type="button" onClick={() => b.trangThai === 'da_nop' ? onXemKetQua(b) : onBatDau(b)}>{b.tieuDe}</button>)}</div>, MomLamBaiM3: ({ traLoi, datTraLoi, onNop }: { traLoi: Record<string, string>; datTraLoi: (qid: string, v: string) => void; onNop: () => void }) => <div><output data-testid="mom-tra">{JSON.stringify(traLoi)}</output><button type="button" onClick={() => datTraLoi('q1', 'B')}>Chọn B thử</button><button type="button" onClick={onNop}>Nộp Mom thử</button></div> }))
vi.mock('../src/components/KhungXemPhieu', () => ({ default: ({ html }: { html: string }) => <div data-testid="phieu">{html}</div> }))
vi.mock('../src/components/hoa2/api', () => ({ canThanTuSanh: () => false, useSanhHoa2: () => ({ cheDo2: false, ketQua: null, dangTai: false, loi: '', taiLai: vi.fn() }) }))
vi.mock('../src/components/bang-nhiem-vu/may-chu', () => ({ useBanNho: () => null, useCaDangMo: () => null, useLamMoiKhiDong: () => 0, useKeHoachNgay: () => ({ keHoach: null, cu: true, daXong: true, dangLamMoi: false }) }))
vi.mock('../src/game/than-thu-v2/academic-sync', () => ({ syncStudentExp: vi.fn() }))
vi.mock('../src/lib/exam-db', async (goc) => ({ ...await goc<typeof import('../src/lib/exam-db')>(), loadScriptUrlHoacMacDinh: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (goc) => ({ ...await goc<typeof import('../src/lib/exam-api')>(), hsLichSuCaApi: async () => ({ ok: true, items: [] }), hsBtvnApi: (...a: unknown[]) => api.btvn(...a) }))
vi.mock('../src/lib/mom-api', () => ({ momApi: (...a: unknown[]) => api.mom(...a), momReviewHtml: vi.fn() }))
beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: 'S1', hoTen: 'Em cũ', lop: '12A1', token: 'token-cu' }))
  api.mom.mockResolvedValue({ ok: true, items: [] })
  api.btvn.mockImplementation(async (_url: string, sbd: string) => sbd === 'S1' ? { ok: true, items: [{ maBtvn: 'cu', tenCa: 'Bài em cũ', daNop: false }] } : new Promise(() => {}))
})
afterEach(() => { cleanup(); api.btvn.mockReset(); api.mom.mockReset(); localStorage.clear() })
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
