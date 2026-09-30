// RẢI ĐỀU CÂU MỚI THEO NGÀY (thầy chốt 30/09) — giao diện thầy:
// Giao chiến dịch: công tắc mặc định BẬT + dòng giải thích; `suc-chua` và `tao` gửi `raiDeu`; gạt tắt ⇒ `raiDeu:false`.
// Chiến dịch đã giao: thẻ đang chạy có công tắc nhãn Bật/Tắt ⇒ gọi `rai-deu {id, bat}` rồi tải lại; máy chủ cũ không gửi ⇒ Bật; đã kết thúc / chờ chữa ⇒ không công tắc.
// Đồng hồ sức chứa: có raiDeu + cauMoiMoiNgay ⇒ dòng "≈ N câu mới mỗi ngày".
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

const { goi } = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => goi(duong, body) }))
vi.mock('../src/lib/exam-db', () => ({
  loadExamSources: async () => [{ maDe: 'DE-A', phanI: Array.from({ length: 40 }, (_, i) => ({ id: `DE-A-I-${i + 1}` })), phanII: [], phanIII: [] }],
}))

import GiaoChienDich from '../src/components/chien-dich/GiaoChienDich'
import DsChienDichDaGiao from '../src/components/chien-dich/DsChienDichDaGiao'
import DongHoSucChua from '../src/components/chien-dich/DongHoSucChua'
import type { SucChua } from '../src/components/chien-dich/api'

const NOW = Date.UTC(2026, 8, 27, 3, 0, 0)
const lenh = (action: string) => goi.mock.calls.filter(([, b]) => b.action === action).map(([, b]) => b as Record<string, unknown>)
const SC = { ok: true, soCau: 120, soEm: 33, D: 8, sucChua: 320, khoiLuongTrungVi: 272, tiLe: 0.85, muc: 'vang', soEmQuaTai: 4, theLucDeXuat: 47, goiY: null, tachGiua: { cauMoi: 120, luotOn: 32 } }

beforeEach(() => {
  goi.mockReset()
  goi.mockImplementation(async (_d: string, b: Record<string, unknown>) => {
    if (b.action === 'suc-chua') return { ok: true, du: { ...SC, raiDeu: b.raiDeu !== false, cauMoiMoiNgay: 24 } }
    if (b.action === 'tao') return { ok: true, du: { ok: true, id: 'cd-1', soCau: 120, soEm: 33 } }
    return { ok: false, loai: 'tu_choi', chu: 'lệnh lạ' }
  })
  sessionStorage.clear()
})
afterEach(cleanup)

describe('Giao chiến dịch — công tắc rải đều', () => {
  it('(a) mặc định BẬT, có dòng giải thích; suc-chua và tao gửi raiDeu:true; gạt tắt ⇒ tính lại với raiDeu:false và tao gửi false', async () => {
    render(<GiaoChienDich maCa="CA-1" lop="12A1" maDeCa={['DE-A']} tenGoiY="Ester – Lipid" nowMs={NOW} />)
    const gat = (await screen.findByRole('switch', { name: 'Rải đều câu mới theo ngày' })) as HTMLInputElement
    expect(gat.checked).toBe(true)
    expect(screen.getByText(/Câu mới chia đều theo số ngày/)).toBeTruthy()
    await waitFor(() => expect(lenh('suc-chua').length).toBeGreaterThan(0))
    expect(lenh('suc-chua').at(-1)).toMatchObject({ raiDeu: true })
    expect(await screen.findByText(/Rải đều: khoảng 24 câu mới mỗi ngày trong 5 ngày đầu/)).toBeTruthy()

    fireEvent.click(gat)
    expect(gat.checked).toBe(false)
    await waitFor(() => expect(lenh('suc-chua').at(-1)).toMatchObject({ raiDeu: false }))
    await waitFor(() => expect(screen.queryByText(/Rải đều: khoảng/)).toBeNull())

    const nut = await screen.findByRole('button', { name: /Giao chiến dịch cho/ })
    await waitFor(() => expect((nut as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(nut)
    await waitFor(() => expect(lenh('tao')).toHaveLength(1))
    expect(lenh('tao')[0]).toMatchObject({ raiDeu: false, huyetChien: true })
  })
})

describe('Chiến dịch đã giao — công tắc trên thẻ đang chạy', () => {
  const CD = { id: 'cd-1', ten: 'Chiến dịch luyện', lop: '12A1', maDe: ['DE'], hanNop: '2026-10-05', theLucNgay: 49, huyetChien: true, maCa: null, taoLuc: 'x', trangThai: 'dang_chay', soCau: 120, soEm: 93, hetHan: false }
  it('(b) đang chạy: công tắc nhãn Bật (máy chủ cũ không gửi raiDeu ⇒ Bật); gạt ⇒ gọi rai-deu {id, bat:false} rồi tải lại danh sách; tắt ⇒ nhãn Tắt', async () => {
    let raiDeu: boolean | undefined
    goi.mockImplementation(async (_d: string, b: Record<string, unknown>) => {
      if (b.action === 'danh-sach') return { ok: true, du: { ok: true, homNay: '2026-09-30', chienDich: [{ ...CD, ...(raiDeu === undefined ? {} : { raiDeu }) }] } }
      if (b.action === 'rai-deu') { raiDeu = b.bat as boolean; return { ok: true, du: { ok: true, id: b.id, raiDeu } } }
      return { ok: false, loai: 'tu_choi', chu: 'lạ' }
    })
    render(<DsChienDichDaGiao />)
    const hang = (await screen.findByText('Chiến dịch luyện')).closest('tr') as HTMLElement
    const gat = within(hang).getByRole('switch', { name: 'Rải đều câu mới · Chiến dịch luyện' }) as HTMLInputElement
    expect(gat.checked).toBe(true)
    expect(hang.textContent).toContain('Rải đều câu mới: Bật')
    fireEvent.click(gat)
    await waitFor(() => expect(lenh('rai-deu')).toEqual([{ action: 'rai-deu', id: 'cd-1', bat: false }]))
    await waitFor(() => expect(lenh('danh-sach').length).toBe(2))
    await waitFor(() => expect(hang.textContent).toContain('Rải đều câu mới: Tắt'))
    expect((within(hang).getByRole('switch', { name: 'Rải đều câu mới · Chiến dịch luyện' }) as HTMLInputElement).checked).toBe(false)
  })
  it('(b2) chiến dịch Đã kết thúc / Chờ buổi chữa ⇒ không có công tắc; tắt sẵn ⇒ chỉ chữ nhỏ trạng thái', async () => {
    goi.mockImplementation(async (_d: string, b: Record<string, unknown>) => {
      if (b.action === 'danh-sach') return { ok: true, du: { ok: true, homNay: '2026-09-30', chienDich: [
        { ...CD, id: 'a', ten: 'Đã xong', trangThai: 'da_dong', hanNop: '2026-09-18', hetHan: true, raiDeu: false },
        { ...CD, id: 'b', ten: 'Chờ chữa', hanNop: '2026-09-26', hetHan: true },
      ] } }
      return { ok: false, loai: 'tu_choi', chu: 'lạ' }
    })
    render(<DsChienDichDaGiao />)
    const a = (await screen.findByText('Đã xong')).closest('tr') as HTMLElement
    const b = (await screen.findByText('Chờ chữa')).closest('tr') as HTMLElement
    expect(within(a).queryByRole('switch')).toBeNull()
    expect(within(b).queryByRole('switch')).toBeNull()
    expect(a.textContent).toContain('Câu mới đổ theo sức')
    expect(b.textContent).not.toContain('Câu mới đổ theo sức')
  })
})

describe('Đồng hồ sức chứa — dòng rải đều', () => {
  const sc: SucChua = { ...SC, muc: 'vang', goiY: null } as SucChua
  it('(c) có raiDeu + cauMoiMoiNgay ⇒ hiện dòng câu mới/ngày; tắt hoặc máy chủ cũ ⇒ không hiện', () => {
    const { rerender } = render(<DongHoSucChua sc={{ ...sc, raiDeu: true, cauMoiMoiNgay: 24 }} dangTinh={false} loi="" theLuc={40} onTinhLai={vi.fn()} />)
    expect(screen.getByText('Rải đều: khoảng 24 câu mới mỗi ngày trong 5 ngày đầu, 3 ngày cuối để ôn.')).toBeTruthy()
    rerender(<DongHoSucChua sc={{ ...sc, raiDeu: false, cauMoiMoiNgay: 24 }} dangTinh={false} loi="" theLuc={40} onTinhLai={vi.fn()} />)
    expect(screen.queryByText(/Rải đều: khoảng/)).toBeNull()
    rerender(<DongHoSucChua sc={sc} dangTinh={false} loi="" theLuc={40} onTinhLai={vi.fn()} />)
    expect(screen.queryByText(/Rải đều: khoảng/)).toBeNull()
  })
})
