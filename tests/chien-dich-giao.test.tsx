// GAME HÓA 2.0 · GIAO CHIẾN DỊCH (bản vẽ GV-GiaoChienDich): điền sẵn tờ đề + lớp của ca, hạn nộp +7 ngày 23:59, thể lực 40,
// Quá tải hôm nay tới 80 (tên cũ Huyết Chiến). Đổi đầu vào ⇒ gọi lại `suc-chua`; nút chính ⇒ `tao`. Thầy 28/09: thể lực gõ số bất kì + nút gạt Tự động; bỏ rút câu / lùi hạn.
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
          theLucDeXuat: 47,
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
    expect((screen.getByLabelText(/Hạn nộp \(hết lúc/) as HTMLInputElement).value).toBe('2026-10-04')
    expect(screen.getAllByText('23:59 · Chủ Nhật 04/10/2026')).toHaveLength(2) // bước 3 + cột tóm tắt
    expect((screen.getByLabelText(/Số lượt câu mỗi ngày/) as HTMLInputElement).value).toBe('40')
    expect((screen.getByRole('checkbox', { name: /làm tới 80 câu\/ngày \(Quá tải hôm nay/ }) as HTMLInputElement).checked).toBe(true)

    await waitFor(() => expect(lenh('suc-chua').length).toBeGreaterThan(0))
    expect(lenh('suc-chua').at(-1)).toMatchObject({ action: 'suc-chua', lop: '12A1', maDe: ['DE-A'], hanNop: '2026-10-04', theLucNgay: 40 })
    await screen.findByText('85%')
    expect(await screen.findByRole('button', { name: 'Giao chiến dịch cho 33 em' })).toBeTruthy()
  })

  it('Tự động (mặc định bật): thể lực nhận số máy chủ đề xuất, ô bị khoá; gạt tắt ⇒ gõ số bất kì (kể cả > 80) và gọi lại với số đó', async () => {
    render(<GiaoChienDich maCa="CA-1" lop="12A1" maDeCa={['DE-A']} nowMs={NOW} />)
    const o = screen.getByLabelText(/Số lượt câu mỗi ngày/) as HTMLInputElement
    expect((screen.getByRole('switch', { name: /Tự tính/ }) as HTMLInputElement).checked).toBe(true)
    await waitFor(() => expect(o.value).toBe('47'))
    expect(o.disabled).toBe(true)
    await waitFor(() => expect(lenh('suc-chua').some((b) => b.theLucNgay === 47)).toBe(true))
    expect(screen.getByText(/A.I Đỗ Đại Học đề xuất 47 lượt\/ngày/)).toBeTruthy()
    expect(screen.getByRole('checkbox', { name: /làm tới 94 câu\/ngày/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Rút còn|Lùi hạn nộp/ })).toBeNull()

    fireEvent.click(screen.getByRole('switch', { name: /Tự tính/ }))
    expect(o.disabled).toBe(false)
    fireEvent.change(o, { target: { value: '135' } })
    await waitFor(() => expect(lenh('suc-chua').some((b) => b.theLucNgay === 135)).toBe(true))
    expect(o.value).toBe('135')
  })

  it('bấm nút chính ⇒ `tao` với thể lực đang dùng, maCa, huyetChien, KHÔNG có rutCon; xong thì cho huỷ giao', async () => {
    render(<GiaoChienDich maCa="CA-1" lop="12A1" maDeCa={['DE-A']} tenGoiY="Ester – Lipid" nowMs={NOW} />)
    await waitFor(() => expect((screen.getByLabelText(/Số lượt câu mỗi ngày/) as HTMLInputElement).value).toBe('47'))
    const nut = await screen.findByRole('button', { name: 'Giao chiến dịch cho 33 em' })
    await waitFor(() => expect((nut as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(nut)
    await waitFor(() => expect(lenh('tao')).toHaveLength(1))
    expect(lenh('tao')[0]).toEqual({ action: 'tao', ten: 'Ester – Lipid', lop: '12A1', maDe: ['DE-A'], hanNop: '2026-10-04', theLucNgay: 47, huyetChien: true, maCa: 'CA-1' })
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
    expect(screen.getByText('Chọn tờ đề, em và hạn nộp để tính khối lượng.')).toBeTruthy()
  })
})
