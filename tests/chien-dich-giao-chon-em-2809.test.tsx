// Giao chiến dịch (thầy 28/09): "chỗ chọn đề luyện chưa hiển thị đầy đủ đề kho đề, chọn lớp cho tôi chọn khối, chọn lớp tick theo em, số câu ở thanh đỏ chưa đồng bộ".
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

const { goi } = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => goi(duong, body) }))
const cauI = (ma: string, n: number) => Array.from({ length: n }, (_, i) => ({ id: `${ma}-I-${i + 1}`, text: `Câu ${ma} ${i + 1}`, choices: ['a', 'b', 'c', 'd'] }))
vi.mock('../src/lib/exam-db', () => ({
  loadExamSources: async () => [
    // DE-A có 2 phần ⇒ tách thành DE-A-TN, DE-A-DS như màn Mở ca. DE-B TRÙNG HẾT câu phần I của DE-A ⇒ trước đây bị khử trùng mất khỏi cây.
    { maDe: 'DE-A', nhom: 'C2', phanI: cauI('A', 3), phanII: [{ id: 'A-II-1', text: 'Đúng sai A', ideas: ['a', 'b', 'c', 'd'] }], phanIII: [] },
    { maDe: 'DE-B', nhom: 'C2', phanI: cauI('A', 3), phanII: [], phanIII: [] },
  ],
}))

import GiaoChienDich from '../src/components/chien-dich/GiaoChienDich'
import { khoiCuaLop } from '../src/components/chien-dich/ChonEmGiao'
import { useAppStore } from '../src/store/appStore'

const NOW = Date.UTC(2026, 8, 27, 3, 0, 0)
const lenh = (action: string) => goi.mock.calls.filter(([, b]) => b.action === action).map(([, b]) => b as Record<string, unknown>)
const EM = [
  { sbd: '1101', hoTen: 'An', lop: '11A1', sdt: '', namSinh: '' },
  { sbd: '1102', hoTen: 'Bình', lop: '11A1', sdt: '', namSinh: '' },
  { sbd: '1103', hoTen: 'Chi', lop: '11A2', sdt: '', namSinh: '' },
  { sbd: '1201', hoTen: 'Dũng', lop: '12A1', sdt: '', namSinh: '' },
]

beforeEach(() => {
  goi.mockReset()
  goi.mockImplementation(async (_d: string, b: Record<string, unknown>) => {
    if (b.action === 'suc-chua') {
      const sbd = (b.sbd as string[] | undefined) ?? []
      return { ok: true, du: { ok: true, soCau: 170, soCauTheoTo: { 'DE-A-TN': 120, 'DE-A-DS': 50 }, soEm: sbd.length || 91, D: 8, sucChua: 320, khoiLuongTrungVi: 340, tachGiua: { cauMoi: 170, luotOn: 0 }, tiLe: 1.0625, muc: 'do', soEmQuaTai: sbd.length || 91, goiY: null } }
    }
    return { ok: false, loai: 'tu_choi', chu: 'lệnh lạ' }
  })
  useAppStore.setState({ classList: EM } as never)
})
afterEach(() => {
  cleanup()
  useAppStore.setState({ classList: [] } as never)
})

const EM_MAY_CHU = [
  { sbd: '1101', hoTen: 'An', khoi: '11', tenLop: '11' },
  { sbd: '1102', hoTen: 'Bình', khoi: '11', tenLop: '11' },
  { sbd: '1201', hoTen: 'Dũng', khoi: '12', tenLop: '12 - Tinh Hoa' },
  { sbd: '1202', hoTen: 'Hà', khoi: '12', tenLop: '12 - Tinh Hoa' },
  { sbd: '1203', hoTen: 'Giang', khoi: '12', tenLop: '12 - Lớp Thường' },
]
const coMayChu = () => {
  const cu = goi.getMockImplementation()!
  goi.mockImplementation(async (d: string, b: Record<string, unknown>) => (b.action === 'ds-em' ? { ok: true, du: { ok: true, em: EM_MAY_CHU } } : cu(d, b)))
}
const cuoi = () => lenh('suc-chua').at(-1) as Record<string, unknown>

describe('giao chiến dịch — ba cách tích: toàn khối · theo lớp · từng em (danh sách từ máy chủ, có lớp đã phân)', () => {
  it('khối đọc từ đầu tên lớp', () => {
    expect(khoiCuaLop('12A1')).toBe('12')
    expect(khoiCuaLop('11')).toBe('11')
    expect(khoiCuaLop('10CL')).toBe('10')
    expect(khoiCuaLop('Ôn thi')).toBe('Khác')
  })
  it('tích "Khối 12" ⇒ chọn cả 3 em khối 12, nhãn "Khối 12"; bỏ tích ⇒ 0 em, nút giao tắt', async () => {
    useAppStore.setState({ classList: [] } as never)
    coMayChu()
    render(<GiaoChienDich maDeCa={['DE-A-TN']} nowMs={NOW} />)
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Khối 12 · 3 em' }))
    await waitFor(() => expect(cuoi()).toMatchObject({ lop: 'Khối 12', sbd: ['1201', '1202', '1203'] }))
    expect(screen.getByText(/Đã chọn 3\/5 em/)).toBeTruthy()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Khối 12 · 3 em' }))
    expect(screen.getByText('Chưa chọn em nào')).toBeTruthy()
    await waitFor(() => expect((screen.getByRole('button', { name: /Giao chiến dịch cho/ }) as HTMLButtonElement).disabled).toBe(true))
  })
  it('tích lớp đã phân "12 - Tinh Hoa" ⇒ đúng 2 em; ô Khối 12 hiện "2/3" (một phần)', async () => {
    useAppStore.setState({ classList: [] } as never)
    coMayChu()
    render(<GiaoChienDich maDeCa={['DE-A-TN']} nowMs={NOW} />)
    fireEvent.click(await screen.findByRole('checkbox', { name: '12 - Tinh Hoa · 2 em' }))
    await waitFor(() => expect(cuoi()).toMatchObject({ lop: '12 - Tinh Hoa', sbd: ['1201', '1202'] }))
    const khoi12 = screen.getByRole('checkbox', { name: 'Khối 12 · 2/3 em' }) as HTMLInputElement
    expect(khoi12.checked).toBe(false)
    expect(khoi12.indeterminate).toBe(true)
  })
  it('từng em: lọc Khối 11 rồi "Tích tất cả" ⇒ chỉ thêm em khối 11; bỏ tích một em; "Bỏ hết" chỉ bỏ em đang hiện', async () => {
    useAppStore.setState({ classList: [] } as never)
    coMayChu()
    render(<GiaoChienDich maDeCa={['DE-A-TN']} nowMs={NOW} />)
    fireEvent.click(await screen.findByRole('checkbox', { name: '12 - Lớp Thường · 1 em' }))
    fireEvent.click(screen.getByRole('button', { name: 'Khối 11' }))
    expect(screen.queryByRole('checkbox', { name: /Giang/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Tích tất cả' }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Bình/ }))
    await waitFor(() => expect(cuoi()).toMatchObject({ sbd: ['1101', '1203'] }))
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ hết' }))
    await waitFor(() => expect(cuoi()).toMatchObject({ sbd: ['1203'] }))
  })
  it('ca vừa kiểm tra lớp "12" ⇒ tích sẵn cả khối 12', async () => {
    useAppStore.setState({ classList: [] } as never)
    coMayChu()
    render(<GiaoChienDich maDeCa={['DE-A-TN']} lop="12" nowMs={NOW} />)
    await waitFor(() => expect((screen.getByRole('checkbox', { name: 'Khối 12 · 3 em' }) as HTMLInputElement).checked).toBe(true))
    await waitFor(() => expect(cuoi()).toMatchObject({ lop: 'Khối 12', sbd: ['1201', '1202', '1203'] }))
  })
  it('máy chủ không trả danh sách ⇒ dùng danh sách trên máy (lớp của classList)', async () => {
    render(<GiaoChienDich maDeCa={['DE-A-TN']} nowMs={NOW} />)
    fireEvent.click(screen.getByRole('checkbox', { name: '11A1 · 2 em' }))
    await waitFor(() => expect(cuoi()).toMatchObject({ lop: '11A1', sbd: ['1101', '1102'] }))
  })
})

describe('giao chiến dịch — kho đề đủ và số câu đồng bộ', () => {
  it('hộp "Thêm tờ đề" hiện ĐỦ tờ, kể cả tờ trùng hết câu với tờ khác, và tách theo phần như màn Mở ca', async () => {
    render(<GiaoChienDich nowMs={NOW} />)
    fireEvent.click(screen.getByRole('button', { name: '+ Thêm tờ đề từ Ngân hàng đề' }))
    const hop = await screen.findByRole('dialog')
    // Mở hết các nhánh của cây (cây gập sẵn) rồi mới đọc.
    await waitFor(() => expect(within(hop).queryAllByRole('button', { name: /^Mở / }).length).toBeGreaterThan(0))
    for (let i = 0; i < 10; i++) {
      const nut = within(hop).queryAllByRole('button', { name: /^Mở / })
      if (!nut.length) break
      nut.forEach((b) => fireEvent.click(b))
    }
    expect(hop.textContent).toContain('DE-B')
    expect(hop.textContent).toMatch(/DE-A-TN|Trắc nghiệm/)
    expect(hop.textContent).toMatch(/DE-A-DS|Đúng sai/)
    expect(within(hop).queryByText(/chưa có Ngân hàng đề/)).toBeNull()
  })
  it('số câu cạnh từng tờ lấy từ máy chủ (cộng = tổng); thanh đỏ ghi rõ câu mới × 2 lượt, lượt/ngày, x/y em quá tải', async () => {
    useAppStore.setState({ classList: [] } as never)
    render(<GiaoChienDich maDeCa={['DE-A-TN', 'DE-A-DS']} lop="11" nowMs={NOW} />)
    await screen.findByText('106%')
    expect(screen.getByRole('checkbox', { name: /DE-A-TN · 120 câu/ })).toBeTruthy()
    expect(screen.getByRole('checkbox', { name: /DE-A-DS · 50 câu/ })).toBeTruthy()
    expect(screen.getByText(/Tổng 170 câu/)).toBeTruthy()
    const dh = document.querySelector('[data-khoi="dong-ho-suc-chua"]')!
    expect(dh.textContent).toContain('Em ở giữa lớp cần khoảng 340 lượt (170 câu mới × 2 lượt) · sức chứa 8 ngày × 40 lượt/ngày = 320 lượt.')
    expect(dh.textContent).toContain('91/91 em quá tải.')
    expect(lenh('suc-chua').at(-1)).toMatchObject({ lop: '11' })
    expect(lenh('suc-chua').at(-1)!.sbd).toBeUndefined()
  })
})
