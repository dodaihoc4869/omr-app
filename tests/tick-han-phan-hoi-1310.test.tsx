// @vitest-environment jsdom
// Khóa phản ánh thật 13/10: chờ nhiều lệnh, lưu làm co bảng/nhảy màn, cần sửa hạn nhiều lớp.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
const { goi } = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (...a: unknown[]) => goi(...a) }))
vi.mock('../src/lib/exam-db', async goc => ({ ...await goc<typeof import('../src/lib/exam-db')>(), loadExamSources: async () => [], loadTeacherSecret: async () => 'mat' }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))
import BangBaiDangGiao from '../src/components/chien-dich/BangBaiDangGiao'
import TheBaiDaDay from '../src/components/chien-dich/TheBaiDaDay'
const GOI = [
  { id: 'g1', ten: 'Bài 8. Amine', lop: '12 - Lớp Thường', han: '2026-10-16', bat_dau: '2026-10-10' },
  { id: 'g2', ten: 'Bài 8. Amine', lop: '12 - Tinh Hoa', han: '2026-10-17', bat_dau: '2026-10-11' },
  { id: 'g3', ten: 'Bài 6. Nitrogen', lop: '11', han: '2026-10-09', bat_dau: '2026-10-03' },
]
const bang = (caCu = false) => ({ ok: true, du: { bat: true, goi: GOI, thongKe: Object.fromEntries(GOI.filter(g => caCu || g.id !== 'g3').map(g => [g.id, { soEm: 10, pGap: 40, pTuLam: 30 }])) } })
const xacNhan = (b: Record<string, unknown>) => ({ ok: true, du: { goiId: b.goiId, han: b.han } })
const doi = <T,>() => { let tra!: (x: T) => void; const cho = new Promise<T>(r => { tra = r }); return { cho, tra } }
const sua = async (lop = '12 - Tinh Hoa') => {
  fireEvent.click(await screen.findByRole('button', { name: `Sửa hạn Bài 8. Amine · ${lop}` }))
  const o = screen.getByLabelText(`Hạn mới của Bài 8. Amine · ${lop}`)
  fireEvent.change(o, { target: { value: '2026-10-20' } })
  return o as HTMLInputElement
}
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(Date.parse('2026-10-13T10:00:00Z'))
  goi.mockReset(); goi.mockImplementation(async (_d, b) => b.action === 'tong_hop' ? bang(b.caCu === true) : xacNhan(b))
})
afterEach(() => { cleanup(); vi.useRealTimers(); localStorage.clear() })

it('cả bảng chỉ một lệnh; mở bài quá hạn lọc ngay và đọc thêm đúng một bản tổng hợp có giới hạn', async () => {
  const { container } = render(<BangBaiDangGiao />)
  await screen.findByRole('button', { name: 'Sửa hạn Bài 8. Amine · 12 - Tinh Hoa' })
  expect(container.querySelectorAll('[data-khoi="dong-giao"]')).toHaveLength(2)
  fireEvent.click(screen.getByRole('checkbox', { name: 'Hiện cả bài đã quá hạn để sửa' }))
  expect(container.querySelectorAll('[data-khoi="dong-giao"]')).toHaveLength(3)
  expect(goi.mock.calls.map(([, b]) => b)).toEqual([{ action: 'tong_hop' }, { action: 'tong_hop', caCu: true }])
  await waitFor(() => expect(screen.queryByText('Đang tải số liệu của bài này…')).toBeNull())
})
it('Cập nhật giữ bảng/thanh; bấm liên tiếp không nhân yêu cầu; lỗi vẫn giữ dữ liệu và thử lại được', async () => {
  const { container } = render(<BangBaiDangGiao />)
  await screen.findByRole('button', { name: 'Cập nhật' })
  const table = container.querySelector('table'), cho = doi<unknown>()
  goi.mockImplementationOnce(() => cho.cho)
  const nut = screen.getByRole('button', { name: 'Cập nhật' })
  fireEvent.click(nut); fireEvent.click(nut)
  expect(screen.getByRole('button', { name: 'Đang cập nhật…' }).hasAttribute('disabled')).toBe(true)
  expect(container.querySelector('table')).toBe(table)
  expect(screen.queryByLabelText('Đang tải bài đang giao')).toBeNull()
  expect(goi).toHaveBeenCalledTimes(2)
  await act(async () => { cho.tra({ ok: false, chu: 'Không nối được máy chủ.' }) })
  expect((await screen.findByRole('alert')).textContent).toContain('Chưa cập nhật được')
  expect(container.querySelector('table')).toBe(table)
  fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
  await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
  expect(container.querySelector('table')).toBe(table)
})
it('trong bước Dạy học thật và form cha: lưu/Enter không submit hoặc chuyển màn, giữ editor + bảng và báo tại dòng sau ACK', async () => {
  const chuyen = vi.fn(), submit = vi.fn(), bamCha = vi.fn(), cho = doi<unknown>()
  goi.mockImplementation(async (d, b) => {
    if (d === '/gv/goi-bai-7') return b.action === 'tong_hop' ? bang(b.caCu === true) : cho.cho
    if (d === '/gv/lop') return { ok: true, du: { lop: [] } }
    if (d === '/gv/buoi-hoc') return { ok: true, du: { buoi: [] } }
    if (d === '/gv/omni') return { ok: true, du: { co: { bat: false, lop: [], sbd: [] } } }
    return { ok: false, chu: 'Chưa có dữ liệu.' }
  })
  const { container } = render(<div onClick={bamCha}><form onSubmit={e => { e.preventDefault(); submit() }}><TheBaiDaDay onMoChuaBai={chuyen} /></form></div>)
  const o = await sua(), table = container.querySelector('table')
  bamCha.mockClear()
  fireEvent.keyDown(o, { key: 'Enter' })
  expect(submit).not.toHaveBeenCalled(); expect(bamCha).not.toHaveBeenCalled(); expect(chuyen).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: 'Đang lưu…' }).hasAttribute('disabled')).toBe(true)
  expect(screen.queryByText(/Đã lưu hạn mới/)).toBeNull()
  await act(async () => { cho.tra(xacNhan({ goiId: 'g2', han: '2026-10-20' })) })
  expect(await screen.findByText(/Đã lưu hạn mới/)).toBeTruthy()
  expect(container.querySelector('table')).toBe(table)
  expect(o.isConnected).toBe(true); expect(o.value).toBe('2026-10-20')
  expect(goi.mock.calls.filter(([d, b]) => d === '/gv/goi-bai-7' && b.action === 'tong_hop')).toHaveLength(1)
  expect(submit).not.toHaveBeenCalled(); expect(chuyen).not.toHaveBeenCalled()
  fireEvent.change(o, { target: { value: '2026-10-21' } })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu hạn' }))
  expect(bamCha).not.toHaveBeenCalled(); expect(submit).not.toHaveBeenCalled()
  await screen.findByRole('alert') // Drain ACK ngày cũ của bộ giả sau lượt lưu thứ hai.
})
it('đọc cũ về sau lưu không đè hạn mới; lần sửa tiếp gửi hạn vừa được ACK', async () => {
  const { container } = render(<BangBaiDangGiao />)
  await screen.findByRole('button', { name: 'Cập nhật' })
  const cho = doi<unknown>()
  goi.mockImplementationOnce(() => cho.cho)
  fireEvent.click(screen.getByRole('button', { name: 'Cập nhật' }))
  const o = await sua()
  fireEvent.click(screen.getByRole('button', { name: 'Lưu hạn' }))
  await screen.findByText(/Đã lưu hạn mới/)
  await act(async () => { cho.tra(bang()) })
  expect(o.value).toBe('2026-10-20')
  const dong = container.querySelectorAll('[data-khoi="dong-giao"]')[1]!
  fireEvent.click(within(dong as HTMLElement).getByRole('button', { name: 'Đóng' }))
  expect(dong.textContent).toContain('T3 20/10')
  await sua()
  fireEvent.change(screen.getByLabelText('Hạn mới của Bài 8. Amine · 12 - Tinh Hoa'), { target: { value: '2026-10-21' } })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu hạn' }))
  await screen.findByText(/Đã lưu hạn mới/)
  expect(goi.mock.calls.filter(([, b]) => b.action === 'sua_han').at(-1)![1]).toEqual({ action: 'sua_han', goiId: 'g2', hanCu: '2026-10-20', han: '2026-10-21' })
})
it('sửa hàng loạt chỉ gửi bài/lớp được chọn; giữ bảng/panel và báo từng dòng sau đủ ACK', async () => {
  goi.mockImplementation(async (_d, b) => b.action === 'tong_hop' ? bang(b.caCu === true) : { ok: true, du: { ketQua: b.goi.map((g: { goiId: string }) => ({ goiId: g.goiId, han: b.han, ok: true })) } })
  const { container } = render(<BangBaiDangGiao />)
  fireEvent.click(await screen.findByRole('button', { name: 'Sửa hạn hàng loạt' }))
  const panel = screen.getByRole('group', { name: /Sửa hạn hàng loạt/ }), table = container.querySelector('table')
  fireEvent.click(screen.getByRole('checkbox', { name: 'Chọn Bài 8. Amine · 12 - Lớp Thường' }))
  fireEvent.change(screen.getByLabelText('Hạn mới chung · 23:59 giờ Việt Nam'), { target: { value: '2026-10-22' } })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu hạn các lớp' }))
  await screen.findByText(/Đã lưu hạn mới cho 1 bài/)
  expect(goi.mock.calls.at(-1)![1]).toEqual({ action: 'sua_han_hang_loat', goi: [{ goiId: 'g2', hanCu: '2026-10-17' }], han: '2026-10-22' })
  expect(panel.isConnected).toBe(true); expect(container.querySelector('table')).toBe(table)
  const rows = container.querySelectorAll('[data-khoi="dong-giao"]')
  expect(rows[0]!.textContent).toContain('T6 16/10'); expect(rows[1]!.textContent).toContain('T5 22/10')
  expect(rows[1]!.textContent).toContain('Đã lưu hạn mới')
  expect(goi).toHaveBeenCalledTimes(2)
})
it('ACK hàng loạt thiếu/nhân trùng/ngày sai hoặc stale không báo thành công; giữ lựa chọn để sửa', async () => {
  render(<BangBaiDangGiao />)
  fireEvent.click(await screen.findByRole('button', { name: 'Sửa hạn hàng loạt' }))
  const o = screen.getByLabelText('Hạn mới chung · 23:59 giờ Việt Nam') as HTMLInputElement
  fireEvent.change(o, { target: { value: '2026-10-22' } })
  const sai = [
    { ok: true, du: { ketQua: [{ goiId: 'g1', han: '2026-10-22', ok: true }] } },
    { ok: true, du: { ketQua: Array.from({ length: 2 }, () => ({ goiId: 'g1', han: '2026-10-22', ok: true })) } },
    { ok: true, du: { ketQua: GOI.slice(0, 2).map(g => ({ goiId: g.id, han: '2026-10-21', ok: true })) } },
    { ok: false, chu: 'Hạn đã thay đổi ở máy khác. Thầy cập nhật rồi thử lại.' },
  ]
  for (const r of sai) {
    goi.mockResolvedValueOnce(r)
    fireEvent.click(screen.getByRole('button', { name: 'Lưu hạn các lớp' }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(screen.queryByText(/Đã lưu hạn mới/)).toBeNull()
    expect(o.value).toBe('2026-10-22')
    expect(screen.getByRole('checkbox', { name: 'Chọn Bài 8. Amine · 12 - Tinh Hoa' }).hasAttribute('checked')).toBe(true)
  }
})
it('mỗi lần mở bảng đọc lại phiên hiện tại; không dùng số liệu nhớ của lần đăng nhập trước', async () => {
  const a = render(<BangBaiDangGiao />)
  await screen.findByRole('button', { name: 'Sửa hạn hàng loạt' }); a.unmount()
  goi.mockResolvedValueOnce({ ok: true, du: { bat: true, goi: [], thongKe: {} } })
  render(<BangBaiDangGiao />)
  expect(await screen.findByText(/Chưa lớp nào đang có bài giao/)).toBeTruthy()
  expect(screen.queryByText('Bài 8. Amine')).toBeNull()
  expect(goi.mock.calls.filter(([, b]) => b.action === 'tong_hop')).toHaveLength(2)
})

it.each([false, true])('hai máy cùng sửa: Cập nhật giữ ngày nháp/chọn lớp và Lưu lại dùng hạn hiện tại, hàng loạt=%s', async nhieu => {
  let han = '2026-10-17', luotLuu = 0
  goi.mockImplementation(async (_d, b) => {
    if (b.action === 'tong_hop') { const d = bang(); return { ...d, du: { ...d.du, goi: d.du.goi.map(g => g.id === 'g2' ? { ...g, han } : g) } } }
    ++luotLuu
    if (luotLuu === 1) return { ok: false, chu: 'Hạn đã thay đổi ở máy khác. Thầy cập nhật rồi thử lại.' }
    return nhieu ? { ok: true, du: { ketQua: b.goi.map((g: { goiId: string }) => ({ ok: true, goiId: g.goiId, han: b.han })) } } : xacNhan(b)
  })
  render(<BangBaiDangGiao />)
  fireEvent.click(await screen.findByRole('button', { name: nhieu ? 'Sửa hạn hàng loạt' : 'Sửa hạn Bài 8. Amine · 12 - Tinh Hoa' }))
  if (nhieu) fireEvent.click(screen.getByRole('checkbox', { name: 'Chọn Bài 8. Amine · 12 - Lớp Thường' }))
  const o = screen.getByLabelText(nhieu ? 'Hạn mới chung · 23:59 giờ Việt Nam' : 'Hạn mới của Bài 8. Amine · 12 - Tinh Hoa') as HTMLInputElement
  fireEvent.change(o, { target: { value: '2026-10-22' } })
  const bam = () => fireEvent.click(screen.getByRole('button', { name: nhieu ? 'Lưu hạn các lớp' : 'Lưu hạn' }))
  bam(); await screen.findByRole('alert')
  han = '2026-10-20'
  fireEvent.click(screen.getByRole('button', { name: 'Cập nhật' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Cập nhật' }).hasAttribute('disabled')).toBe(false))
  expect(o.isConnected).toBe(true); expect(o.value).toBe('2026-10-22')
  if (nhieu) expect((screen.getByRole('checkbox', { name: 'Chọn Bài 8. Amine · 12 - Lớp Thường' }) as HTMLInputElement).checked).toBe(false)
  bam()
  await screen.findByText(nhieu ? 'Đã lưu hạn mới cho 1 bài' : 'Đã lưu hạn mới')
  const b = goi.mock.calls.filter(([, b]) => b.action !== 'tong_hop').at(-1)![1]
  expect(nhieu ? b.goi : [{ goiId: b.goiId, hanCu: b.hanCu }]).toEqual([{ goiId: 'g2', hanCu: '2026-10-20' }])
})
it.each([false, true])('bài đã bỏ tick trên máy khác không được lưu bằng lựa chọn cũ sau Cập nhật, hàng loạt=%s', async nhieu => {
  let boTick = false
  goi.mockImplementation(async (_d, b) => {
    if (b.action !== 'tong_hop') return xacNhan(b)
    const d = bang(); return { ...d, du: { ...d.du, goi: d.du.goi.filter(g => !boTick || g.id !== 'g2') } }
  })
  render(<BangBaiDangGiao />)
  fireEvent.click(await screen.findByRole('button', { name: nhieu ? 'Sửa hạn hàng loạt' : 'Sửa hạn Bài 8. Amine · 12 - Tinh Hoa' }))
  if (nhieu) fireEvent.click(screen.getByRole('checkbox', { name: 'Chọn Bài 8. Amine · 12 - Lớp Thường' }))
  boTick = true
  fireEvent.click(screen.getByRole('button', { name: 'Cập nhật' }))
  await waitFor(() => expect(screen.queryByLabelText('Hạn mới của Bài 8. Amine · 12 - Tinh Hoa')).toBeNull())
  await waitFor(() => expect(screen.getByRole('button', { name: 'Cập nhật' }).hasAttribute('disabled')).toBe(false))
  if (nhieu) {
    expect(screen.queryByRole('checkbox', { name: 'Chọn Bài 8. Amine · 12 - Tinh Hoa' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Lưu hạn các lớp' }))
    expect((await screen.findByRole('alert')).textContent).toContain('chọn ít nhất một lớp')
  } else expect(screen.queryByRole('button', { name: 'Lưu hạn' })).toBeNull()
  expect(goi.mock.calls.filter(([, b]) => b.action !== 'tong_hop')).toHaveLength(0)
})
