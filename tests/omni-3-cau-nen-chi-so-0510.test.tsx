// OMNI 3 (điều phối 05/10) — hộp câu nền (`HopLuyenNen`, Trạm hồi phục + thang tự gỡ) vẽ công thức ĐÚNG CHUẨN: chỉ số Unicode của câu nền
// (CO₂, Fe³⁺, 10⁻³ — câu thầy nạp lẫn câu A.I Đỗ Đại Học tự sinh) đi qua ChemText thành <sub>/<sup> cùng phông, không còn ký tự ₀–₉ ⁰–⁹ ⁺⁻
// (thầy nhắc 28/09: phông Be Vietnam Pro không có các glyph đó ⇒ phông dự phòng, chữ bé, lệch dòng). Áp cho đề, phương án, đáp án, các bước, mẹo.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('../src/lib/loi-giai-api', async (goc) => ({
  ...(await goc<typeof import('../src/lib/loi-giai-api')>()),
  luyenNen: vi.fn(async () => ({
    ok: true,
    ten: 'Đổi khối lượng ra số mol',
    cau: [
      { id: 'sinh.doi_mol_khoi_luong.1', muc: 1, kieu: 'so', de: 'Tính số mol của 4,4 gam CO₂ (C = 12, O = 16).' },
      { id: 'sinh.ph_nong_do_ion.2', muc: 2, kieu: 'tn', de: 'Dung dịch có [H⁺] = 10⁻³ M thì pH bằng', pa: { A: '3', B: '11', C: '−3', D: '0,001' } },
    ],
  })),
  nopLuyenNen: vi.fn(async () => ({ ok: true, dung: true, dapAn: '0,1', giai: ['n(CO₂) = 4,4 : 44 = 0,1 mol'], meo: 'n = m : M; M(CO₂) = 44.' })),
}))
import { HopLuyenNen } from '../src/components/loi-giai/ThanhThangGo'

const KY_TU_CHI_SO = /[₀-₉⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]/

afterEach(() => cleanup())

describe('hộp câu nền — công thức vẽ bằng chỉ số thật', () => {
  it('đề, đáp án, các bước, mẹo: <sub> thật, không còn ký tự chỉ số Unicode', async () => {
    const { container } = render(<HopLuyenNen nhan="doi_mol_khoi_luong" ten="Đổi khối lượng ra số mol" qid="Q1" onDong={() => {}} />)
    await screen.findByText('Câu 1/2')
    const de = container.querySelector('.lg-nen-cau')!
    expect(de.querySelector('sub')?.textContent).toBe('2')
    expect(KY_TU_CHI_SO.test(de.textContent ?? '')).toBe(false)
    expect((de.textContent ?? '').replace(/\s+/g, ' ')).toContain('4,4 gam CO2')

    fireEvent.change(container.querySelector('input')!, { target: { value: '0,1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Nộp câu này' }))
    await waitFor(() => expect(container.querySelector('.lg-kq')).toBeTruthy())
    const kq = container.querySelector('.lg-kq')!
    expect(kq.querySelectorAll('sub').length).toBeGreaterThanOrEqual(2) // bước giải + mẹo
    expect(KY_TU_CHI_SO.test(kq.textContent ?? '')).toBe(false)
  })

  it('phương án trắc nghiệm và chỉ số trên (ion, luỹ thừa): <sup> thật', async () => {
    const { container } = render(<HopLuyenNen nhan="ph_nong_do_ion" ten="pH" qid="Q1" onDong={() => {}} />)
    await screen.findByText('Câu 1/2')
    fireEvent.change(container.querySelector('input')!, { target: { value: '0,1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Nộp câu này' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Câu tiếp' }))
    await screen.findByText('Câu 2/2')
    const cau = container.querySelector('.lg-nen-cau')!
    const sup = [...cau.querySelectorAll('sup')].map((x) => x.textContent)
    expect(sup).toContain('+')
    expect(sup).toContain('-3')
    expect(KY_TU_CHI_SO.test(cau.textContent ?? '')).toBe(false)
  })
})
