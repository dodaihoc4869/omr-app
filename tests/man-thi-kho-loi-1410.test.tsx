// Luồng màn thi thật: lỗi đọc kho không mở lượt rỗng; lỗi lưu nộp giữ snapshot để thử lại.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import ExamTakeScreen from '../src/screens/ExamTakeScreen'
import { emptyIntegrityLog, LoiKhoThi } from '../src/lib/exam-db'
const m = vi.hoisted(() => ({ load: vi.fn(), luu: vi.fn(), vao: vi.fn(), nop: vi.fn() }))
vi.mock('../src/lib/exam-db', async goc => ({ ...await goc<typeof import('../src/lib/exam-db')>(), loadAttempt: (...a: unknown[]) => m.load(...a), saveAttempt: (...a: unknown[]) => m.luu(...a), loadCachedSession: async () => undefined, cacheSession: async () => {}, listPendingAttempts: async () => [], loadScriptUrlHoacMacDinh: async () => 'https://worker.test' }))
vi.mock('../src/lib/exam-api', async goc => ({ ...await goc<typeof import('../src/lib/exam-api')>(), vaoThi: (...a: unknown[]) => m.vao(...a), submitAnswers: (...a: unknown[]) => m.nop(...a), pushExamStatus: async () => {}, luuTam: async () => true }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://worker.test' }))
vi.mock('../src/lib/may-chu-moi', async goc => ({ ...await goc<typeof import('../src/lib/may-chu-moi')>(), layCauHinhMayChu: async () => ({ URL: 'https://worker.test' }) }))
vi.mock('../src/lib/nhip-gui-lai', async goc => ({ ...await goc<typeof import('../src/lib/nhip-gui-lai')>(), gianVaoThi: () => 0, gianNopTuDong: () => 0 }))
const now = Date.parse('2026-10-17T02:00:00Z')
const bank = { maDe: 'D', phanI: [{ id: 'q1', text: 'Câu thi đang làm', choices: ['Một', 'Hai', 'Ba', 'Bốn'], chuyenDe: 'Hoá học' }], phanII: [], phanIII: [], soCau: { I: 1, II: 0, III: 0 } }
const tuCong = { maCa: '123456', sbd: 'S1', hoTen: 'Em thử', namSinh: '2008', scriptUrl: 'https://worker.test' }
const phanHoiVao = (de = bank) => ({ ok: true, cach: 'moi', lop: '12', thoiGianPhut: 45, congBo: 'khong', lanThu: 1, vaoLuc: new Date(now).toISOString(), hetGioLuc: new Date(now + 45 * 60_000).toISOString(), bank: de, nguongLan: 99, nguongGiay: 99999, loai: 'thi', hanNop: '', tenCa: 'Ca thử', giuDeDoc: false, anHanGiay: 0, khoaLuot: '123456:S1:1' })
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(now)
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }))
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} unobserve() {} })
  vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ ok: true, items: [] })))
  m.load.mockResolvedValue(undefined); m.luu.mockResolvedValue(undefined)
  m.vao.mockResolvedValue(phanHoiVao())
  m.nop.mockResolvedValue({ keyBank: null, congBo: 'khong' })
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.clearAllMocks(); localStorage.clear() })
async function ve() { await act(async () => { render(<ExamTakeScreen tuCong={tuCong} />) }); await act(async () => { await vi.advanceTimersByTimeAsync(1) }) }
it('đọc nháp lỗi hiện Thử lại và không gọi vào thi/ghi lượt rỗng; kho hồi phục dùng đúng pending draft', async () => {
  m.load.mockRejectedValueOnce(new LoiKhoThi('doc'))
  await ve()
  expect(screen.getByRole('button', { name: 'Thử lại' })).toBeTruthy()
  expect(m.vao).not.toHaveBeenCalled(); expect(m.luu).not.toHaveBeenCalled()
  const cu = { key: '123456:S1', maCa: '123456', sbd: 'S1', maDe: 'D', startedAt: new Date(now).toISOString(), durationMinutes: 45, lanThu: 1, submitted: true, submittedAt: new Date(now).toISOString(), pendingSubmit: true, integrity: emptyIntegrityLog(), answers: { phanI: { q1: 'B' }, phanII: {}, phanIII: {} } }
  m.load.mockResolvedValue(cu); m.vao.mockResolvedValue({ ok: true, cach: 'khoi_phuc', bank, lop: '12', thoiGianPhut: 45, congBo: 'khong', lanThu: 1, vaoLuc: new Date(now).toISOString(), hetGioLuc: new Date(now + 2700_000).toISOString() })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Thử lại' })) })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Bắt đầu|Vào thi/ })) })
  expect(m.nop.mock.calls[0]?.[4]).toEqual(cu.answers)
})
it('lưu lúc nộp lỗi giữ snapshot, thử lại không đổi giờ/payload; ACK server vẫn là thành công dù ghi ACK local lỗi', async () => {
  await ve()
  expect(screen.getByText('Câu thi đang làm')).toBeTruthy()
  const cuLuu = m.luu.mock.calls.length
  m.luu.mockImplementation(async a => { if (a.submitted) throw new LoiKhoThi('ghi') })
  await act(async () => { fireEvent.click(screen.getAllByRole('button', { name: /Nộp bài/ })[0]) })
  await act(async () => { fireEvent.click(screen.getAllByRole('button', { name: /^Nộp bài$/ }).at(-1)!) })
  expect(screen.getByRole('button', { name: 'Thử lưu và nộp lại' })).toBeTruthy()
  expect(m.nop).not.toHaveBeenCalled()
  const snapshot = structuredClone(m.luu.mock.calls.slice(cuLuu).find(c => c[0].submitted)?.[0])
  await act(async () => { await vi.advanceTimersByTimeAsync(10_000) })
  m.luu.mockImplementation(async a => { if (!a.pendingSubmit) throw new LoiKhoThi('ghi') })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Thử lưu và nộp lại' })) })
  const thuLai = m.luu.mock.calls.findLast(c => c[0].pendingSubmit)?.[0]
  expect(thuLai).toEqual(snapshot)
  expect(m.nop).toHaveBeenCalledOnce()
  expect(m.nop.mock.calls[0]?.[4]).toEqual(snapshot.answers)
  expect(screen.queryByText(/Đang gửi lên hệ thống/)).toBeNull()
  expect(screen.queryByRole('button', { name: 'Thử lưu và nộp lại' })).toBeNull()
})
it('nháp còn pending không hiện đã lưu; ACK cũ không xóa lỗi của nháp mới hơn', async () => {
  await ve()
  let ackCu!: () => void, hongMoi!: (e: Error) => void
  m.luu.mockImplementationOnce(() => new Promise<void>(resolve => { ackCu = resolve }))
    .mockImplementationOnce(() => new Promise<void>((_resolve, reject) => { hongMoi = reject }))
  await act(async () => { fireEvent.click(screen.getByText('A.').closest('.pa-hang')!) })
  expect(m.luu).toHaveBeenCalledTimes(2)
  expect(m.luu.mock.calls[1][0].answers.phanI).toHaveProperty('q1')
  await act(async () => { await vi.advanceTimersByTimeAsync(800) })
  expect(screen.getByLabelText('đang lưu…')).toBeTruthy()
  await act(async () => { fireEvent.click(screen.getByText('B.').closest('.pa-hang')!) })
  await act(async () => { hongMoi(new LoiKhoThi('ghi')) })
  expect(screen.getByLabelText('chưa lưu được trên máy')).toBeTruthy()
  await act(async () => { ackCu() })
  expect(screen.getByLabelText('chưa lưu được trên máy')).toBeTruthy()
})
it('hai click liền ở hai câu lưu mỗi đáp án một lần và nháp cuối giữ cả hai câu', async () => {
  m.vao.mockResolvedValue(phanHoiVao({ ...bank, phanI: [...bank.phanI, { ...bank.phanI[0], id: 'q2', text: 'Câu thi thứ hai' }], soCau: { I: 2, II: 0, III: 0 } }))
  await ve()
  const cu = m.luu.mock.calls.length, pa = screen.getAllByText('A.')
  await act(async () => { fireEvent.click(pa[0].closest('.pa-hang')!); fireEvent.click(pa[1].closest('.pa-hang')!) })
  const moi = m.luu.mock.calls.slice(cu)
  expect(moi).toHaveLength(2)
  expect(Object.keys(moi[0][0].answers.phanI)).toHaveLength(1)
  expect(Object.keys(moi[1][0].answers.phanI).sort()).toEqual(['q1', 'q2'])
})
