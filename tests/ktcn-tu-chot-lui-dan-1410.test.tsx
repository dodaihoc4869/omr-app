// Hết giờ và lỗi mạng nhanh: không gọi dồn; vẫn nộp tay ngay, giữ nháp và dừng khi đổi phiên.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import ManKiemTra from '../src/components/hoc-tap/ManKiemTraCaNhan'
const api = vi.hoisted(() => vi.fn())
vi.mock('../src/components/hoa2/api', async goc => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: api }))
const now = Date.parse('2026-10-17T02:00:00Z')
const kt = { id: 'kt1', ngay: '2026-10-17', moLuc: Date.parse('2026-10-16T17:00:00Z'), hanLuc: Date.parse('2026-10-17T17:00:00Z'), trangThai: 'can_lam', homNay: true, tong: 1, daTra: 1, con: 0, soChang: 1, phut: 1, soBai: 1, tongKienThuc: 1, phuDe: 1, nguonDayDu: true, lyDo: 'Kiểm tra kiến thức', thieuNguon: 0, diem: null, nopLuc: null }
const cau = { qid: 'q1', maDe: 'd', version: 'v1', group: 'g1', phan: 'I', text: 'Câu kiểm tra đang lưu', choices: ['Một', 'Hai', 'Ba', 'Bốn'], ideas: [], hinhAnh: [], dang: null, tenDang: '', mucDo: 'NB', sao: 0, kienThuc: [] }
const noop = () => {}
const soChot = () => api.mock.calls.filter(c => c[0] === 'hoc-tap-ktcn-chot-chang')
const tomTat = (id = 'kt1') => ({ ...kt, id, serverNow: Date.now() })
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(now); localStorage.clear() })
afterEach(() => { cleanup(); vi.useRealTimers(); api.mockReset(); localStorage.clear() })
async function mo(chot: (payload: Record<string, unknown>) => Promise<unknown>) {
  api.mockImplementation((action, _token, payload) => {
    if (action === 'hoc-tap-ktcn-chot-chang') return chot(payload)
    if (action === 'hoc-tap-ktcn-trang-thai') return Promise.resolve({ ok: true, kiemTra: tomTat(payload.id), chang: [{ stt: 0, soCau: 1, giay: 1, han: null, daChot: false }] })
    return Promise.resolve({ ok: true, kiemTra: tomTat(payload.id), revision: 7, hanChang: now + 1000, daChot: false, questions: [cau], tra: { q1: 'A' } })
  })
  const ui = render(<ManKiemTra token="token1" sbd="S1" id="kt1" onVe={noop} onCapNhat={noop} />)
  await act(async () => {})
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Làm chặng 1' })) })
  return ui
}
const hong = () => {
  // Giữ lượt thứ tư để bản lỗi không làm vòng React vô hạn trong bộ kiểm.
  return soChot().length <= 3 ? new Promise((_resolve, reject) => setTimeout(() => reject(new Error('Mạng đang gián đoạn')), 1)) : new Promise(() => {})
}
async function hetGio() {
  await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
  await act(async () => { await vi.advanceTimersByTimeAsync(1) })
}
it('máy chủ từ chối tức thì vẫn chỉ có một lượt tự chốt trong giây đầu', async () => {
  await mo(hong)
  await hetGio()
  for (let i = 0; i < 10; i++) await act(async () => { await vi.advanceTimersByTimeAsync(100) })
  expect(soChot()).toHaveLength(1)
  expect(screen.getByRole('alert').textContent).toContain('Mạng đang gián đoạn')
})
it('lỗi liên tiếp đợi 2 rồi 4 giây, giữ nháp và revision; câu hết giờ vẫn khóa', async () => {
  localStorage.setItem('ktcn:nhap:S1:kt1:0', JSON.stringify({ han: now + 1000, tra: { q1: 'A' } }))
  await mo(hong)
  await hetGio()
  expect(soChot()).toHaveLength(1)
  await act(async () => { await vi.advanceTimersByTimeAsync(1999) })
  expect(soChot()).toHaveLength(1)
  await act(async () => { await vi.advanceTimersByTimeAsync(1) })
  expect(soChot()).toHaveLength(2)
  await act(async () => { await vi.advanceTimersByTimeAsync(1) })
  fireEvent.click(screen.getByText('B.').closest('.pa-hang')!)
  await act(async () => { await vi.advanceTimersByTimeAsync(3999) })
  expect(soChot()).toHaveLength(2)
  await act(async () => { await vi.advanceTimersByTimeAsync(1) })
  expect(soChot()).toHaveLength(3)
  for (const c of soChot()) expect(c[2]).toEqual({ id: 'kt1', chang: 0, tra: { q1: 'A' }, revision: 7 })
  expect(JSON.parse(localStorage.getItem('ktcn:nhap:S1:kt1:0')!).tra).toEqual({ q1: 'A' })
})
it.each(['Nộp chặng 1', 'Tải lại'])('bấm %s trong lúc đang đợi thì thử ngay và bỏ lượt tự thử cũ', async nhan => {
  await mo(payload => soChot().length === 1 ? hong() : Promise.resolve({ ok: true, kiemTra: tomTat(), revision: Number(payload.revision) + 1, daLuu: true }))
  await hetGio()
  expect(soChot()).toHaveLength(1)
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: nhan })) })
  expect(soChot()).toHaveLength(2)
  expect(soChot()[1][2]).toEqual({ id: 'kt1', chang: 0, tra: { q1: 'A' }, revision: 7 })
  await act(async () => { await vi.advanceTimersByTimeAsync(30_000) })
  expect(soChot()).toHaveLength(2)
})
it.each(['dong-man', 'doi-phien'])('%s hủy lượt tự thử đang hẹn, không gọi bằng phiên cũ', async viec => {
  const ui = await mo(hong)
  await hetGio()
  expect(soChot()).toHaveLength(1)
  if (viec === 'dong-man') ui.unmount()
  else await act(async () => { ui.rerender(<ManKiemTra token="token2" sbd="S2" id="kt2" onVe={noop} onCapNhat={noop} />) })
  await act(async () => { await vi.advanceTimersByTimeAsync(30_000) })
  expect(soChot()).toHaveLength(1)
  if (viec === 'doi-phien') expect(screen.queryByText('Câu kiểm tra đang lưu')).toBeNull()
})
it('đổi phiên khi lượt lưu còn chờ bỏ lượt chốt cũ đang xếp hàng và không xóa nháp cũ', async () => {
  const ui = await mo(hong)
  const goiGoc = api.getMockImplementation()!
  let traLuu!: (v: unknown) => void
  api.mockImplementation((action, token, payload) => action === 'hoc-tap-ktcn-luu'
    ? new Promise(resolve => { traLuu = resolve })
    : goiGoc(action, token, payload))
  fireEvent.click(screen.getByText('B.').closest('.pa-hang')!)
  await act(async () => { await vi.advanceTimersByTimeAsync(400) })
  expect(api.mock.calls.at(-1)?.[0]).toBe('hoc-tap-ktcn-luu')
  await act(async () => { await vi.advanceTimersByTimeAsync(600) })
  expect(soChot()).toHaveLength(0)
  await act(async () => { ui.rerender(<ManKiemTra token="token2" sbd="S2" id="kt2" onVe={noop} onCapNhat={noop} />) })
  await act(async () => { traLuu({ ok: true, kiemTra: tomTat(), revision: 99, daLuu: true }) })
  await act(async () => { await vi.advanceTimersByTimeAsync(30_000) })
  expect(soChot()).toHaveLength(0)
  expect(screen.queryByText('Câu kiểm tra đang lưu')).toBeNull()
  expect(JSON.parse(localStorage.getItem('ktcn:nhap:S1:kt1:0')!).tra).toEqual({ q1: 'B' })
})
