// NGÀY BẮT ĐẦU CHIẾN DỊCH (thầy 28/09) — giao diện: ô "Ngày bắt đầu" ở màn Giao, hộp Chỉnh sửa (khoá khi đã bắt đầu),
// nhãn "Sắp bắt đầu · Thứ Tư 01/10" ở danh sách, Sảnh HS đọc `sapBatDau`.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

const { goi } = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => goi(duong, body) }))
vi.mock('../src/lib/exam-db', () => ({
  loadExamSources: async () => [{ maDe: 'DE-A', phanI: Array.from({ length: 4 }, (_, i) => ({ id: `DE-A-I-${i + 1}` })), phanII: [], phanIII: [] }],
}))

import SuaChienDich from '../src/components/chien-dich/SuaChienDich'
import { docSanh } from '../src/components/hoa2/api'

const CD = { id: 'cd-1', ten: 'Chiến dịch luyện', lop: '12A1', maDe: ['DE1'], hanNop: '2026-10-05', theLucNgay: 12, huyetChien: true, maCa: null, taoLuc: 'x', trangThai: 'dang_chay', soCau: 6, soEm: 2, hetHan: false }
let docCd: Record<string, unknown> = {}

beforeEach(() => {
  goi.mockReset()
  docCd = { ...CD, sbd: ['S1', 'S2'], batDau: '2026-10-01', daBatDau: false }
  goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
    if (duong === '/gv/chien-dich') {
      if (b.action === 'danh-sach')
        return { ok: true, du: { ok: true, homNay: '2026-09-30', chienDich: [{ ...CD, batDau: '2026-10-01', sapBatDau: true }, { ...CD, id: 'cd-2', ten: 'Đang làm', batDau: '2026-09-28', sapBatDau: false }] } }
      if (b.action === 'ds-em') return { ok: true, du: { ok: true, em: [] } }
    }
    if (duong === '/gv/chien-dich/sua') {
      if (b.action === 'doc') return { ok: true, du: { ok: true, homNay: '2026-09-30', chienDich: docCd, nhatKy: [] } }
      if (b.action === 'xem-truoc')
        return { ok: true, du: { ok: true, tomTat: 'x', themMaDe: [], toKhongCoCauMoi: [], soCauTheoTo: {}, soCauCu: 6, soCauThem: 0, soCauSau: 6, themSbd: [], botSbd: [], soEmSau: 2, hanCu: '2026-10-05', hanNop: '2026-10-05', moLai: false, theLucCu: 12, theLucNgay: 12 } }
    }
    return { ok: false, loai: 'tu_choi', chu: 'lạ' }
  })
})
afterEach(cleanup)
const lenh = (action: string) => goi.mock.calls.filter(([, b]) => b.action === action).map(([, b]) => b as Record<string, unknown>)

describe('hộp Chỉnh sửa: ngày bắt đầu', () => {
  const moHop = async () => {
    render(<SuaChienDich id="cd-1" ten="Chiến dịch luyện" onDong={vi.fn()} onDaLuu={vi.fn()} />)
    return waitFor(() => {
      const o = document.querySelector('[data-khoi="sua-chien-dich"] [data-khoi="ngay-bat-dau"] input') as HTMLInputElement | null
      if (!o) throw new Error('chưa có ô ngày bắt đầu')
      return o
    })
  }
  it('chưa bắt đầu ⇒ đổi được, tóm tắt "bắt đầu 01/10 → 02/10", gửi batDau', async () => {
    const o = await moHop()
    expect(o.disabled).toBe(false)
    fireEvent.change(o, { target: { value: '2026-10-02' } })
    expect(await screen.findByText('bắt đầu 01/10 → 02/10')).toBeTruthy()
    await waitFor(() => expect(lenh('xem-truoc').at(-1)).toMatchObject({ batDau: '2026-10-02' }))
  })
  it('đã bắt đầu ⇒ ô khoá kèm chú thích', async () => {
    docCd = { ...docCd, batDau: '2026-09-28', daBatDau: true }
    const o = await moHop()
    expect(o.disabled).toBe(true)
    expect(screen.getByText('Đã bắt đầu Thứ Hai 28/09/2026 — không đổi được ngày bắt đầu')).toBeTruthy()
  })
})

describe('Sảnh HS: chiến dịch sắp bắt đầu', () => {
  it('đọc `sapBatDau` (tên + ngày); máy chủ cũ không gửi ⇒ null', () => {
    const goc = { cheDo2: true, ngay: '2026-09-30', chienDich: null, theLuc: { con: 0, tong: 0 }, ruong: {} }
    const r = docSanh({ ...goc, sapBatDau: { id: 'x', ten: 'Ester', batDau: '2026-10-01', hanNop: '2026-10-05' } })
    expect(r && 'sanh' in r ? r.sanh.sapBatDau : undefined).toEqual({ ten: 'Ester', batDau: '2026-10-01' })
    const cu = docSanh(goc)
    expect(cu && 'sanh' in cu ? cu.sanh.sapBatDau : undefined).toBeNull()
  })
})
