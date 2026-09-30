// THẦY 30/09 (rải đều + Bi-a rải tỉ lệ): trần Bi-a còn ít hơn một bàn đủ (7 bi + Câu chốt) ⇒ Sảnh Bi-a báo rõ "Hôm nay Bi-a còn N câu…",
// nút vào bàn và "Trả lời câu hỏi" VẪN bật (bàn mở với đúng số câu còn, bi thiếu câu là bi trống). Trần đủ ⇒ không có lời báo. Máy chủ giả qua `datBoGoiBia`.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, configure, render, screen } from '@testing-library/react'
import BiaGame from '../src/game/bi-a/BiaGame'
import { datBoGoiBia, docSanhBia } from '../src/game/bi-a/api'

configure({ asyncUtilTimeout: 6000 })
vi.setConfig({ testTimeout: 20000 })
const BAO = 'Hôm nay Bi-a còn 3 câu. Bàn chỉ có 3 câu, các bi còn lại là bi trống (vào lỗ là ăn ngay).'
const sanh = (them: Record<string, unknown>) => ({ ok: true, bat: true, chienDich: { ten: 'Ester – Lipid', hanNop: '2026-10-01', tong: 120 }, theLuc: { con: 9, tong: 10 }, doan: { con: 0 }, dao: { con: 9 }, giaoHuu: { mo: false, con: 2, toiDa: 2 }, ...them })
const datMay = (s: Record<string, unknown>) => datBoGoiBia((async (lenh: string) => (lenh === 'bia-sanh' ? s : { ok: true })) as never)

beforeEach(() => { vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} }) })
afterEach(() => { cleanup(); datBoGoiBia(null); vi.unstubAllGlobals() })

describe('Sảnh Bi-a khi trần còn ít', () => {
  it('đọc tran.conMoi/conOn + thongBao từ máy chủ', () => {
    const s = docSanhBia(sanh({ tran: { con: 3, tong: 4, tranMoi: 4, tranOn: 0, conMoi: 3, conOn: 0 }, thongBao: BAO }))
    expect(s.tran).toEqual({ con: 3, tong: 4, conMoi: 3, conOn: 0 })
    expect(s.thongBao).toBe(BAO)
    expect(docSanhBia(sanh({ tran: { con: 12, tong: 16 } })).thongBao).toBe('')
  })
  it('còn 3/4 câu ⇒ hiện lời báo, nút Đấu đơn với A.I và Trả lời câu hỏi vẫn bật', async () => {
    datMay(sanh({ tran: { con: 3, tong: 4, conMoi: 3, conOn: 0 }, thongBao: BAO }))
    render(<BiaGame token="tk" hoTen="Khánh Linh" onVe={() => {}} />)
    expect(await screen.findByText('còn 3/4 câu')).toBeTruthy()
    expect(screen.getByText(BAO)).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Đấu đơn với A.I' }) as HTMLButtonElement).disabled).toBe(false)
    expect((screen.getByRole('button', { name: /Trả lời câu hỏi/ }) as HTMLButtonElement).disabled).toBe(false)
  })
  it('trần đủ ⇒ không có lời báo', async () => {
    datMay(sanh({ tran: { con: 15, tong: 15, conMoi: 6, conOn: 9 } }))
    render(<BiaGame token="tk" hoTen="Khánh Linh" onVe={() => {}} />)
    expect(await screen.findByText('còn 15/15 câu')).toBeTruthy()
    expect(screen.queryByText(/Hôm nay Bi-a còn/)).toBeNull()
  })
})
