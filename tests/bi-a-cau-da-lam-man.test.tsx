// BI-A · màn "Câu đã làm" (src/components/hoa2/CauDaLam.tsx) với câu em làm trong Bi-a (thầy 28/09): nhóm "Câu sai trong ca kiểm tra"
// hiện trong ô chọn chiến dịch (chiến dịch thật vẫn mặc định); lần làm mang nguồn ⇒ "Lần gần nhất: Đúng 28/09 · Luyện tập trước đây".
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import CauDaLam from '../src/components/hoa2/CauDaLam'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))

const DS = {
  ok: true,
  chienDich: [
    { id: 'cd1', ten: 'Ester – Lipid', hanNop: '2026-12-30', tong: 80 },
    { id: 'cau-sai-ca-kiem-tra', ten: 'Câu sai trong ca kiểm tra', hanNop: '', tong: 2 },
  ],
  cau: [
    { qid: 'Q12', chienDichId: 'cd1', stt: 12, phan: 'I', mucDo: 'TH', tenDang: 'Thuỷ phân ester', trangThai: 'dang_on', lanCuoiDung: true, henOn: '2026-10-01', lichSu: [{ ngay: '2026-09-28', dung: true, coGoiY: false, nguon: 'bia' }] },
    { qid: 'X5', chienDichId: 'cau-sai-ca-kiem-tra', stt: 1, phan: 'I', mucDo: 'TH', tenDang: 'Chất béo', trangThai: 'dang_on', lanCuoiDung: true, henOn: '2026-10-01', lichSu: [{ ngay: '2026-09-27', dung: false, coGoiY: false, nguon: 'thi' }, { ngay: '2026-09-28', dung: true, coGoiY: false, nguon: 'bia' }] },
    { qid: 'X1', chienDichId: 'cau-sai-ca-kiem-tra', stt: 2, phan: 'I', mucDo: 'NB', tenDang: 'Glucose', trangThai: 'dang_on', lanCuoiDung: false, henOn: '2026-09-29', lichSu: [{ ngay: '2026-09-27', dung: false, coGoiY: false, nguon: 'thi' }] },
  ],
}
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => ({ ok: true, status: 200, json: async () => (new URL(String(url)).pathname === '/game-v2/hoa2-cau-da-lam' ? DS : { ok: true, cau: [] }) })))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('Câu đã làm hiện câu làm trong Bi-a', () => {
  it('chiến dịch thật mặc định; câu Bi-a ghi "· Luyện tập trước đây"; chọn nhóm "Câu sai trong ca kiểm tra" thấy câu ôn ngoài chiến dịch, lịch sử ghi nguồn', async () => {
    render(<CauDaLam token="tk" hoTen="Nguyễn An" sbd="S1" onVe={() => {}} />)
    expect(await screen.findByText('Lần gần nhất: Đúng 28/09 · Luyện tập trước đây')).toBeTruthy()
    const chon = screen.getByRole('combobox', { name: 'Chiến dịch' }) as HTMLSelectElement
    expect(chon.value).toBe('cd1')
    expect([...chon.options].map((o) => o.textContent)).toEqual(['Ester – Lipid · 80 câu', 'Câu sai trong ca kiểm tra · 2 câu'])
    fireEvent.change(chon, { target: { value: 'cau-sai-ca-kiem-tra' } })
    expect(await screen.findByText('Lần gần nhất: Sai 27/09 · Ca kiểm tra')).toBeTruthy()
    expect(screen.getAllByText('Lần gần nhất: Đúng 28/09 · Luyện tập trước đây')).toHaveLength(1)
  })
})
