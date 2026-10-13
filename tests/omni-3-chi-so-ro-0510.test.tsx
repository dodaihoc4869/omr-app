// CHỈ SỐ HOÁ HỌC VẼ RÕ (điều phối 05/10 — thầy hỏi "Lời giải hiển thị đúng chuẩn chưa?"): chỉ số Unicode của kho (C₆H₁₂O₆, Fe³⁺, 10⁻³) phải
// vẽ bằng <sub>/<sup> CÙNG phông (luật thầy 28/09, "Câu đã làm" đã làm) ở MỌI chỗ game Hoá 2.0 hiện đề, phương án, ý, lời giải: thẻ câu Đảo 2.0 khi làm,
// khối LỜI GIẢI (kiến thức cốt lõi + từng phương án), Đoàn (đề, phương án, ý, lời giải câu vừa làm), xem lại chuẩn Đoàn. Chỉ đổi cách vẽ.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { chiSoRo, chiSoRoSau } from '../src/lib/chi-so-ro'

const UNICODE = /[₀-₉⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]/
afterEach(() => cleanup())

describe('chiSoRo / chiSoRoSau (thuần)', () => {
  it('đổi chỉ số dưới, chỉ số trên, ion, luỹ thừa; chuỗi không có chỉ số giữ nguyên', () => {
    expect(chiSoRo('C₆H₁₂O₆')).toBe('C_{6}H_{12}O_{6}')
    expect(chiSoRo('Fe³⁺ + 3OH⁻')).toBe('Fe^{3+} + 3OH^{-}')
    expect(chiSoRo('[H⁺] = 10⁻³ M')).toBe('[H^{+}] = 10^{-3} M')
    expect(chiSoRo('SO₄²⁻')).toBe('SO_{4}^{2-}')
    const thuong = 'Hiệu suất 50%, 25 °C, ΔfH°298'
    expect(chiSoRo(thuong)).toBe(thuong)
  })
  it('chiSoRoSau: mọi chuỗi lá của lời giải, giữ cấu trúc / boolean / số', () => {
    const lg = { chot: 'n(CO₂) = 0,1 mol', buoc: ['m = 0,1 · 44 = 4,4 gam', 'CaCO₃ → CaO + CO₂'], tungPa: { A: { dung: true, viSao: 'Ca²⁺' } }, so: 3 }
    expect(chiSoRoSau(lg)).toEqual({ chot: 'n(CO_{2}) = 0,1 mol', buoc: ['m = 0,1 · 44 = 4,4 gam', 'CaCO_{3} → CaO + CO_{2}'], tungPa: { A: { dung: true, viSao: 'Ca^{2+}' } }, so: 3 })
    expect(chiSoRoSau(null)).toBeNull()
  })
})

const cau = (phan: 'I' | 'II' = 'I'): CauDao2 =>
  ({ qid: 'Q1', maDe: 'DH', version: '1', group: 'g', phan, text: 'Đun nóng 6 gam CH₃COOH với C₂H₅OH dư (xúc tác H₂SO₄ đặc), thu được 4,4 gam CH₃COOC₂H₅. Hiệu suất là',
    choices: phan === 'I' ? ['25%', '50%', '62,5%', 'Fe³⁺'] : [], ideas: phan === 'II' ? ['Ester có M = 88 g/mol.', 'H₂SO₄ là chất xúc tác.', 'Sản phẩm có CO₂.', 'Có ion Na⁺.'] : [],
    hinhAnh: [], dang: 'D', tenDang: 'Hiệu suất phản ứng ester hoá', mucDo: 'van_dung', sao: 2, kienThuc: [] }) as unknown as CauDao2
