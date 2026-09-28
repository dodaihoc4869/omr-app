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

describe('giao chiến dịch — chọn khối → lớp → từng em', () => {
  it('khối đọc từ đầu tên lớp', () => {
    expect(khoiCuaLop('12A1')).toBe('12')
    expect(khoiCuaLop('11')).toBe('11')
    expect(khoiCuaLop('10CL')).toBe('10')
    expect(khoiCuaLop('Ôn thi')).toBe('Khác')
  })
  it('chọn khối 11, tích lớp 11A1 + 11A2, bỏ tích Bình ⇒ suc-chua nhận đúng SBD đã tích và nhãn lớp', async () => {
    render(<GiaoChienDich maDeCa={['DE-A-TN']} nowMs={NOW} />)
    fireEvent.click(screen.getByRole('button', { name: 'Khối 11' }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Lớp 11A1 · 2 em/ }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Lớp 11A2 · 1 em/ }))
    expect(screen.queryByRole('checkbox', { name: /Lớp 12A1/ })).toBeNull()
    fireEvent.click(screen.getByRole('checkbox', { name: /Bình/ }))
    expect(screen.getByText('Đã chọn 2/3 em · lớp 11A1, 11A2')).toBeTruthy()
    await waitFor(() => expect(lenh('suc-chua').some((b) => JSON.stringify(b.sbd) === JSON.stringify(['1101', '1103']))).toBe(true))
    expect(lenh('suc-chua').at(-1)).toMatchObject({ lop: '11A1, 11A2', sbd: ['1101', '1103'], maDe: ['DE-A-TN'] })
    expect(await screen.findByRole('button', { name: 'Giao chiến dịch cho 2 em' })).toBeTruthy()
  })
  it('lớp của ca tích sẵn và mở đúng khối; "Bỏ hết" ⇒ 0 em ⇒ không gọi máy chủ, nút giao tắt', async () => {
    render(<GiaoChienDich maDeCa={['DE-A-TN']} lop="12A1" nowMs={NOW} />)
    expect((screen.getByRole('checkbox', { name: /Lớp 12A1 · 1 em/ }) as HTMLInputElement).checked).toBe(true)
    await waitFor(() => expect(lenh('suc-chua').length).toBe(1))
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ hết' }))
    await new Promise((r) => setTimeout(r, 450))
    expect(lenh('suc-chua').length).toBe(1)
    expect((screen.getByRole('button', { name: /Giao chiến dịch cho/ }) as HTMLButtonElement).disabled).toBe(true)
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
