// @vitest-environment jsdom
// Thêm/Bớt em Gói7: phản hồi thật, giữ nháp và CAS; không đổi màn/submit cha.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
const { goi, mat } = vi.hoisted(() => ({ goi: vi.fn(), mat: { value: 'mat' } }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (...a: unknown[]) => goi(...a) }))
vi.mock('../src/lib/exam-db', () => ({ loadTeacherSecret: async () => mat.value }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))
import SuaEmNhanBai from '../src/components/chien-dich/SuaEmNhanBai'
import BangBaiDangGiao, { ChanLoiDanhSach } from '../src/components/chien-dich/BangBaiDangGiao'
import { batLoiThieuManh } from '../src/lib/nap-manh'
import { docAckEmNhanBai, docEmNhanBai } from '../src/components/chien-dich/api-goi7-em'
const EM = [
  { sbd: 'S1', hoTen: 'Nguyễn An', khoi: '12', tenLop: '12 - Tinh Hoa', duocThem: true },
  { sbd: 'S2', hoTen: 'Đặng Bảo', khoi: '12', tenLop: '12 - Tinh Hoa', duocThem: true },
  { sbd: 'S3', hoTen: 'Lê Châu đang khóa', khoi: '12', tenLop: '12 - Tinh Hoa', duocThem: false },
]
const DU = { goiId: 'g1', tickId: 't1', lop: '12 - Tinh Hoa', ten: 'Bài 8. Amine', revision: '1'.repeat(64), serverNow: Date.parse('2026-10-14T00:00:00Z'), em: EM, nhan: ['S1'] }
const ack = (b: Record<string, unknown>, sua = {}) => ({ goiId: 'g1', requestId: b.requestId, revision: '2'.repeat(64), them: b.them, bot: b.bot, nhan: ['S1', 'S2'], serverNow: DU.serverNow, ...sua })
const lan = (a: string) => goi.mock.calls.filter(([, b]) => b.action === a).map(([, b]) => b)
const doi = <T,>() => { let tra!: (x: T) => void; const cho = new Promise<T>(r => { tra = r }); return { cho, tra } }
const mo = (props = {}) => render(<SuaEmNhanBai goiId="g1" lop={DU.lop} ten={DU.ten} onDong={vi.fn()} onDaLuu={vi.fn()} {...props} />)
async function themBao() {
  fireEvent.click(await screen.findByRole('button', { name: 'Chọn em' }))
  fireEvent.change(screen.getByRole('searchbox', { name: 'Tìm em' }), { target: { value: 'dang bao' } })
  fireEvent.click(screen.getByRole('checkbox', { name: /Đặng Bảo/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Xong' }))
}
beforeEach(() => {
  mat.value = 'mat'; goi.mockReset()
  goi.mockImplementation(async (_: string, b: Record<string, unknown>) => ({ ok: true, du: b.action === 'doc_em' ? DU : ack(b) }))
})
afterEach(cleanup)

it('mở tấm tức thì có xương; chỉ đọc đúng gói một lần', async () => {
  const d = doi<unknown>(); goi.mockReturnValue(d.cho); mo()
  expect(screen.getByRole('dialog', { name: 'Em nhận Bài 8. Amine' })).toBeTruthy()
  expect(screen.getByLabelText('Đang đọc danh sách nhận bài')).toBeTruthy()
  expect((screen.getByRole('button', { name: 'Lưu danh sách' }) as HTMLButtonElement).disabled).toBe(true)
  await waitFor(() => expect(lan('doc_em')).toEqual([{ action: 'doc_em', goiId: 'g1' }]))
  await act(async () => d.tra({ ok: true, du: DU }))
  expect(await screen.findByText('Đã chọn 1/2 em')).toBeTruthy()
})
it('tìm không dấu, chọn hết chỉ em khớp; em khóa không thể được thêm', async () => {
  mo(); await themBao()
  expect(screen.getByText('Đã chọn 2/2 em')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Chọn em' }))
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'bao' } })
  fireEvent.click(screen.getByRole('button', { name: 'Bỏ chọn hết' }))
  expect(screen.getByText('Đã chọn 1/2 em')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Chọn hết' }))
  expect(screen.getByText('Đã chọn 2/2 em')).toBeTruthy()
  expect(screen.queryByRole('checkbox', { name: /Châu/ })).toBeNull()
})
it('bấm lặp một ghi; chỉ ACK đầy đủ hiện Đã lưu, tấm và form cha giữ nguyên', async () => {
  const luu = vi.fn(), nop = vi.fn(), cho = doi<unknown>()
  render(<form onSubmit={e => { e.preventDefault(); nop() }}><SuaEmNhanBai goiId="g1" lop={DU.lop} ten={DU.ten} onDong={vi.fn()} onDaLuu={luu} /></form>)
  await themBao(); goi.mockImplementationOnce(() => cho.cho)
  fireEvent.click(screen.getByRole('button', { name: 'Lưu danh sách' })); fireEvent.click(screen.getByRole('button', { name: 'Đang lưu…' }))
  await waitFor(() => expect(lan('sua_em')).toHaveLength(1))
  const b = lan('sua_em')[0]
  expect(b).toMatchObject({ revision: '1'.repeat(64), them: ['S2'], bot: [] }); expect(typeof b.requestId).toBe('string')
  await act(async () => cho.tra({ ok: true, du: ack(b) }))
  expect(await screen.findByText('Đã lưu danh sách')).toBeTruthy(); expect(luu).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('dialog', { name: /Em nhận/ })).toBeTruthy(); expect(nop).not.toHaveBeenCalled()
})
it.each([
  ['thiếu tập', { nhan: ['S1'] }], ['trùng', { nhan: ['S1', 'S2', 'S2'] }], ['nhầm gói', { goiId: 'g2' }], ['phiên cũ', { revision: '1'.repeat(64) }], ['thiếu thêm', { them: [] }], ['nhầm mã', { requestId: 'khac' }], ['phiên sai dạng', { revision: 'invalid' }],
])('ACK %s không hiện Đã lưu, thử lại cùng mã và payload', async (_, sua) => {
  const daLuu = vi.fn(); mo({ onDaLuu: daLuu }); await themBao()
  goi.mockImplementationOnce(async (_: string, b: Record<string, unknown>) => ({ ok: true, du: ack(b, sua) }))
  fireEvent.click(screen.getByRole('button', { name: 'Lưu danh sách' }))
  const thu = await screen.findByRole('button', { name: 'Thử lưu lại' })
  expect(screen.queryByText('Đã lưu danh sách')).toBeNull(); expect(daLuu).not.toHaveBeenCalled()
  fireEvent.click(thu); await screen.findByText('Đã lưu danh sách')
  expect(lan('sua_em')[0]).toEqual(lan('sua_em')[1])
})
it('mất mạng giữ nháp và mã; khóa thay đổi khi chưa biết lượt lưu đã áp dụng', async () => {
  mo(); await themBao(); goi.mockResolvedValueOnce({ ok: false, loai: 'mang', chu: 'Mất mạng' })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu danh sách' })); await screen.findByText('Mất mạng')
  expect(document.querySelector('fieldset')?.disabled).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'Thử lưu lại' })); await screen.findByText('Đã lưu danh sách')
  expect(lan('sua_em')[0]).toEqual(lan('sua_em')[1])
})
it('xung đột đọc mới giữ nháp; chỉ rebase sau bấm rõ ràng và không tự ghi', async () => {
  mo(); await themBao()
  goi.mockResolvedValueOnce({ ok: false, loai: 'tu_choi', code: 'xung_dot', chu: 'Danh sách vừa thay đổi' })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu danh sách' })); await screen.findByText('Danh sách vừa thay đổi')
  goi.mockResolvedValueOnce({ ok: true, du: { ...DU, revision: '3'.repeat(64), nhan: [] } })
  fireEvent.click(screen.getByRole('button', { name: 'Đọc danh sách mới' }))
  const ap = await screen.findByRole('button', { name: 'Áp dụng nháp vào danh sách mới' })
  expect(screen.getByText('Đã chọn 2/2 em')).toBeTruthy(); expect(lan('sua_em')).toHaveLength(1)
  fireEvent.click(ap); expect(screen.getByText('Đã chọn 1/2 em')).toBeTruthy(); expect(lan('sua_em')).toHaveLength(1)
  goi.mockImplementationOnce(async (_: string, b: Record<string, unknown>) => ({ ok: true, du: ack(b, { revision: '4'.repeat(64), nhan: ['S2'] }) }))
  fireEvent.click(screen.getByRole('button', { name: 'Lưu danh sách' })); await screen.findByText('Đã lưu danh sách')
  expect(lan('sua_em')[1]).toMatchObject({ revision: '3'.repeat(64), them: ['S2'], bot: [] })
  expect(lan('sua_em')[1].requestId).not.toBe(lan('sua_em')[0].requestId)
})
it('em chuyển lớp khi xung đột được báo tên, không rebase thêm sang lớp khác', async () => {
  mo(); await themBao(); goi.mockResolvedValueOnce({ ok: false, loai: 'tu_choi', code: 'xung_dot', chu: 'Em chuyển lớp' })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu danh sách' })); await screen.findByText('Em chuyển lớp')
  goi.mockResolvedValueOnce({ ok: true, du: { ...DU, revision: '4'.repeat(64), em: [EM[0]], emChuyenLop: [{ sbd: 'S2', hoTen: 'Đặng Bảo', tenLop: '12A2' }] } })
  fireEvent.click(screen.getByRole('button', { name: 'Đọc danh sách mới' }))
  const ap = await screen.findByRole('button', { name: 'Áp dụng nháp vào danh sách mới' })
  expect((ap as HTMLButtonElement).disabled).toBe(true)
  expect(screen.getByText(/Không thể thêm.*Đặng Bảo/)).toBeTruthy()
})
it('Esc bộ chọn chỉ đóng bộ chọn; Esc tấm hỏi nháp và trả focus khi đóng', async () => {
  const dong = vi.fn(); mo({ onDong: dong }); await themBao()
  fireEvent.click(screen.getByRole('button', { name: 'Chọn em' })); fireEvent.keyDown(document, { key: 'Escape' })
  expect(screen.queryByRole('searchbox')).toBeNull(); expect(screen.queryByRole('alertdialog')).toBeNull()
  fireEvent.keyDown(document, { key: 'Escape' }); expect(screen.getByRole('alertdialog')).toBeTruthy(); expect(dong).not.toHaveBeenCalled()
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Giữ nháp, tiếp tục sửa' }))
  fireEvent.click(screen.getByRole('button', { name: 'Giữ nháp, tiếp tục sửa' })); expect(screen.queryByRole('alertdialog')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Hủy' })); fireEvent.click(screen.getByRole('button', { name: 'Bỏ nháp và đóng' })); expect(dong).toHaveBeenCalledTimes(1)
})
it('Tab nhốt trong tấm; Enter ô tìm không nộp cha; danh sách rỗng vẫn thêm được', async () => {
  goi.mockResolvedValueOnce({ ok: true, du: { ...DU, nhan: [] } }); mo()
  fireEvent.click(await screen.findByRole('button', { name: 'Chọn em' }))
  const tim = screen.getByRole('searchbox'); fireEvent.keyDown(tim, { key: 'Enter' })
  expect(lan('sua_em')).toHaveLength(0)
  fireEvent.click(screen.getByRole('button', { name: 'Xong' }))
  const dong = screen.getByRole('button', { name: 'Đóng tấm Em nhận bài' }); dong.focus(); fireEvent.keyDown(dong, { key: 'Tab', shiftKey: true })
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Hủy' }))
  expect(screen.getByText(/Chưa em nào nhận bài/)).toBeTruthy()
})
it('API cũ không giả danh sách; không đủ ứng viên cho biết kiểm danh sách lớp', async () => {
  goi.mockResolvedValueOnce({ ok: true, du: { bat: true, goi: [] } }); const a = mo()
  expect(await screen.findByRole('button', { name: 'Thử đọc lại' })).toBeTruthy(); expect(screen.queryByRole('button', { name: 'Chọn em' })).toBeNull()
  a.unmount(); goi.mockResolvedValueOnce({ ok: true, du: { ...DU, em: [], nhan: [] } }); mo()
  expect(await screen.findByText(/Không có em hợp lệ trong lớp/)).toBeTruthy()
})
it('đổi mã bí mật lúc chờ ACK giữ nháp; không báo thành công phiên cũ', async () => {
  const daLuu = vi.fn(), cho = doi<unknown>(); mo({ onDaLuu: daLuu }); await themBao(); goi.mockReturnValueOnce(cho.cho)
  fireEvent.click(screen.getByRole('button', { name: 'Lưu danh sách' })); await waitFor(() => expect(lan('sua_em')).toHaveLength(1))
  mat.value = 'moi'; await act(async () => cho.tra({ ok: true, du: ack(lan('sua_em')[0]) }))
  expect(await screen.findByText(/Kết nối vừa thay đổi/)).toBeTruthy(); expect(daLuu).not.toHaveBeenCalled()
})
it('unmount không nhận ACK muộn, callback đổi không làm đọc lại đè ACK', async () => {
  const daLuu = vi.fn(), cho = doi<unknown>(); const a = mo({ onDaLuu: daLuu }); await themBao(); goi.mockReturnValueOnce(cho.cho)
  fireEvent.click(screen.getByRole('button', { name: 'Lưu danh sách' })); await waitFor(() => expect(lan('sua_em')).toHaveLength(1))
  a.unmount(); await act(async () => cho.tra({ ok: true, du: ack(lan('sua_em')[0]) })); expect(daLuu).not.toHaveBeenCalled()
  const b = mo(); await screen.findByRole('button', { name: 'Chọn em' })
  const doc = lan('doc_em').length
  b.rerender(<SuaEmNhanBai goiId="g1" lop={DU.lop} ten={DU.ten} onDong={() => {}} onDaLuu={() => {}} />)
  expect(lan('doc_em')).toHaveLength(doc)
})
it('bảng cập nhật đúng sĩ số bằng ACK, giữ tấm và không lấy dữ liệu tổng hợp cũ đè ACK', async () => {
  const tong = { bat: true, serverNow: DU.serverNow, goi: [{ id: 'g1', ten: DU.ten, lop: DU.lop, han: '2026-10-20' }], thongKe: { g1: { soEm: 1, pGap: 30, pTuLam: 20 } } }
  const docCu = doi<unknown>(); let soDoc = 0
  goi.mockImplementation(async (_: string, b: Record<string, unknown>) => {
    if (b.action === 'tong_hop') { ++soDoc; if (soDoc === 2) return docCu.cho; return { ok: true, du: soDoc === 1 ? tong : { ...tong, thongKe: { g1: { soEm: 2, pGap: 15, pTuLam: 10 } } } } }
    return { ok: true, du: b.action === 'doc_em' ? DU : ack(b) }
  })
  render(<BangBaiDangGiao />)
  fireEvent.click(await screen.findByRole('button', { name: `Thêm / Bớt em ${DU.ten} · ${DU.lop}` }))
  await themBao(); fireEvent.click(screen.getByRole('button', { name: 'Cập nhật' })); await waitFor(() => expect(soDoc).toBe(2))
  fireEvent.click(screen.getByRole('button', { name: 'Lưu danh sách' })); await screen.findByText('Đã lưu danh sách')
  expect(document.querySelector('[data-khoi="dong-giao"]')?.getAttribute('data-so-em')).toBe('2')
  await act(async () => docCu.tra({ ok: true, du: tong }))
  expect(document.querySelector('[data-khoi="dong-giao"]')?.getAttribute('data-so-em')).toBe('2')
  expect(lan('doc_em')).toHaveLength(1)
})
it('bộ đọc từ chối ứng viên lớp khác và membership trùng/khóa; ACK phải đủ tập', () => {
  expect(docEmNhanBai({ ...DU, em: [{ ...EM[0], tenLop: '12A2' }] }, 'g1', DU.lop)).toBeNull()
  expect(docEmNhanBai({ ...DU, nhan: ['S1', 'S1'] }, 'g1', DU.lop)).toBeNull()
  expect(docEmNhanBai({ ...DU, nhan: ['S3'] }, 'g1', DU.lop)).toBeNull()
  const gui = { action: 'sua_em' as const, goiId: 'g1', requestId: 'r', revision: '1'.repeat(64), them: ['S2'], bot: [] }
  expect(docAckEmNhanBai(ack(gui), gui, ['S2', 'S1'])).not.toBeNull()
})

it('lỗi render mảnh chỉ hiện thông báo tại bảng, có thử lại và đóng', () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {}), thu = vi.fn(), dong = vi.fn()
  function Loi() { throw new Error('Failed to fetch dynamically imported module: /SuaEmNhanBai-old.js') }
  try {
    render(<><h3>Bài đang giao còn nguyên</h3><ChanLoiDanhSach onThu={thu} onDong={dong}><Loi /></ChanLoiDanhSach></>)
    expect(screen.getByText('Bài đang giao còn nguyên')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Thử mở danh sách lại' })); expect(thu).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Đóng thông báo' })); expect(dong).toHaveBeenCalledTimes(1)
  } finally { log.mockRestore() }
})

it('preload đã xử lý cục bộ không tự tải lại; lỗi chưa nhận vẫn giữ đường cứu cũ', () => {
  const cua = new EventTarget(), replace = vi.fn(), kho = new Map<string, string>()
  vi.stubGlobal('sessionStorage', { getItem: (k: string) => kho.get(k) ?? null, setItem: (k: string, v: string) => kho.set(k, v) })
  vi.stubGlobal('location', { href: 'https://app/', replace })
  try {
    batLoiThieuManh(cua as unknown as Window)
    const daNhan = new Event('vite:preloadError', { cancelable: true }); daNhan.preventDefault(); cua.dispatchEvent(daNhan)
    expect(replace).not.toHaveBeenCalled(); expect(kho.size).toBe(0)
    cua.dispatchEvent(new Event('vite:preloadError', { cancelable: true }))
    expect(replace).toHaveBeenCalledTimes(1); expect(kho.size).toBe(1)
  } finally { vi.unstubAllGlobals() }
})

it('khi hỏi bỏ nháp khóa bộ chọn phía sau, không để chuột làm đổi danh sách', async () => {
  mo(); await themBao(); fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))
  expect(document.querySelector('fieldset')?.disabled).toBe(true)
  expect((screen.getByRole('button', { name: 'Hủy' }) as HTMLButtonElement).disabled).toBe(true)
})

it('StrictMode đọc lại khi mount đôi, phản hồi lượt cũ không đè danh sách đang sửa', async () => {
  const cu = doi<unknown>(); let n = 0
  goi.mockImplementation(async () => ++n === 1 ? cu.cho : { ok: true, du: DU })
  render(<StrictMode><SuaEmNhanBai goiId="g1" lop={DU.lop} ten={DU.ten} onDong={vi.fn()} onDaLuu={vi.fn()} /></StrictMode>)
  await themBao(); expect(screen.getByText('Đã chọn 2/2 em')).toBeTruthy()
  await act(async () => cu.tra({ ok: true, du: { ...DU, nhan: [] } }))
  expect(screen.getByText('Đã chọn 2/2 em')).toBeTruthy()
})
