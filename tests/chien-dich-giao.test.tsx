// GAME HÓA 2.0 · GIAO CHIẾN DỊCH (bản vẽ GV-GiaoChienDich): điền sẵn tờ đề + lớp của ca, hạn nộp +7 ngày 23:59, thể lực 40,
// Huyết Chiến tới 80. Đổi đầu vào ⇒ gọi lại `suc-chua`; gợi ý gọi lại với tham số mới; nút chính ⇒ `tao` (kèm `rutCon`).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

const { goi } = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => goi(duong, body) }))
vi.mock('../src/lib/exam-db', () => ({
  loadExamSources: async () => [
    { maDe: 'DE-A', phanI: Array.from({ length: 40 }, (_, i) => ({ id: `DE-A-I-${i + 1}` })), phanII: [], phanIII: [] },
    { maDe: 'DE-B', phanI: Array.from({ length: 40 }, (_, i) => ({ id: `DE-B-I-${i + 1}` })), phanII: [], phanIII: [] },
  ],
}))

import GiaoChienDich from '../src/components/chien-dich/GiaoChienDich'

// 10:00 giờ Việt Nam Chủ Nhật 27/09/2026 ⇒ hạn nộp mặc định Chủ Nhật 04/10/2026
const NOW = Date.UTC(2026, 8, 27, 3, 0, 0)

const lenh = (action: string) => goi.mock.calls.filter(([, b]) => b.action === action).map(([, b]) => b as Record<string, unknown>)

beforeEach(() => {
  goi.mockReset()
  goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
    expect(duong).toBe('/gv/chien-dich')
    if (b.action === 'suc-chua') {
      const lui = b.hanNop === '2026-10-06'
      const rut = b.rutCon === 101
      return {
        ok: true,
        du: {
          ok: true,
          soCau: 120,
          soEm: 33,
          D: lui ? 10 : 8,
          sucChua: lui ? 400 : 320,
          khoiLuongTrungVi: 272,
          tiLe: lui ? 0.68 : 0.85,
          muc: lui ? 'xanh' : 'vang',
          soEmQuaTai: lui ? 0 : 4,
          goiY: lui || rut ? null : { rutCon: { soCau: 101, tiLe: 0.7 }, luiHan: { hanNop: '2026-10-06', tiLe: 0.64 } },
        },
      }
    }
    if (b.action === 'tao') return { ok: true, du: { ok: true, id: 'cd-1', soCau: 101, soEm: 33 } }
    if (b.action === 'huy') return { ok: true, du: { ok: true } }
    return { ok: false, loai: 'tu_choi', chu: 'lệnh lạ' }
  })
})
afterEach(cleanup)

describe('giao chiến dịch — điền sẵn và gọi đúng lệnh', () => {
  it('điền sẵn tờ đề của ca, lớp, hạn nộp +7 ngày, thể lực 40, Huyết Chiến bật ⇒ gọi `suc-chua` đúng đầu vào', async () => {
    render(<GiaoChienDich maCa="CA-1" lop="12A1" maDeCa={['DE-A']} tenGoiY="Ester – Lipid" nowMs={NOW} />)
    expect(screen.getByText('BƯỚC TIẾP THEO')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Giao chiến dịch luyện: Ester – Lipid' })).toBeTruthy()
    expect((screen.getByRole('checkbox', { name: /Đề vừa kiểm tra · DE-A/ }) as HTMLInputElement).checked).toBe(true)
    expect((screen.getByLabelText(/Hạn nộp/) as HTMLInputElement).value).toBe('2026-10-04')
    expect(screen.getByText('23:59 · Chủ Nhật 04/10/2026')).toBeTruthy()
    expect((screen.getByLabelText(/Thể lực mỗi ngày/) as HTMLInputElement).value).toBe('40')
    expect((screen.getByRole('checkbox', { name: /Huyết Chiến tới 80 câu\/ngày/ }) as HTMLInputElement).checked).toBe(true)

    await waitFor(() => expect(lenh('suc-chua').length).toBeGreaterThan(0))
    expect(lenh('suc-chua').at(-1)).toMatchObject({ action: 'suc-chua', lop: '12A1', maDe: ['DE-A'], hanNop: '2026-10-04', theLucNgay: 40 })
    await screen.findByText('85%')
    expect(await screen.findByRole('button', { name: 'Giao chiến dịch cho 33 em' })).toBeTruthy()
  })

  it('đổi đầu vào ⇒ gọi lại; "Lùi hạn nộp" gọi lại với hạn mới; "Rút còn" gọi lại với rutCon', async () => {
    render(<GiaoChienDich maCa="CA-1" lop="12A1" maDeCa={['DE-A']} nowMs={NOW} />)
    await screen.findByRole('button', { name: 'Lùi hạn nộp tới Thứ Ba 06/10 → 64%' })
    fireEvent.change(screen.getByLabelText(/Thể lực mỗi ngày/), { target: { value: '50' } })
    await waitFor(() => expect(lenh('suc-chua').some((b) => b.theLucNgay === 50)).toBe(true))

    fireEvent.click(await screen.findByRole('button', { name: /Lùi hạn nộp tới Thứ Ba 06\/10/ }))
    await waitFor(() => expect(lenh('suc-chua').some((b) => b.hanNop === '2026-10-06')).toBe(true))
    await screen.findByText('68%')
    expect((screen.getByLabelText(/Hạn nộp/) as HTMLInputElement).value).toBe('2026-10-06')
  })

  it('chọn "Rút còn 101 câu" rồi bấm nút chính ⇒ `tao` kèm rutCon, maCa, huyetChien; xong thì cho huỷ giao', async () => {
    render(<GiaoChienDich maCa="CA-1" lop="12A1" maDeCa={['DE-A']} tenGoiY="Ester – Lipid" nowMs={NOW} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Rút còn 101 câu → 70%' }))
    await waitFor(() => expect(lenh('suc-chua').some((b) => b.rutCon === 101)).toBe(true))
    const nut = await screen.findByRole('button', { name: 'Giao chiến dịch cho 33 em' })
    await waitFor(() => expect((nut as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(nut)
    await waitFor(() => expect(lenh('tao')).toHaveLength(1))
    expect(lenh('tao')[0]).toEqual({
      action: 'tao',
      ten: 'Ester – Lipid',
      lop: '12A1',
      maDe: ['DE-A'],
      hanNop: '2026-10-04',
      theLucNgay: 40,
      huyetChien: true,
      maCa: 'CA-1',
      rutCon: 101,
    })
    expect(await screen.findByText('ĐÃ GIAO CHIẾN DỊCH')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Huỷ giao' }))
    await waitFor(() => expect(lenh('huy')).toEqual([{ action: 'huy', id: 'cd-1' }]))
  })

  it('bỏ tích hết tờ đề ⇒ không gọi máy chủ, nút chính tắt; thêm tờ từ Ngân hàng đề ⇒ tờ mới vào đầu vào', async () => {
    render(<GiaoChienDich maCa="CA-1" lop="12A1" maDeCa={['DE-A']} nowMs={NOW} />)
    await waitFor(() => expect(lenh('suc-chua').length).toBe(1))
    fireEvent.click(screen.getByRole('checkbox', { name: /Đề vừa kiểm tra · DE-A/ }))
    await new Promise((r) => setTimeout(r, 450))
    expect(lenh('suc-chua').length).toBe(1)
    expect((screen.getByRole('button', { name: /Giao chiến dịch cho/ }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText('Chọn tờ đề, lớp và hạn nộp để tính sức chứa.')).toBeTruthy()
  })
})
