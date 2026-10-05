// CHỈ SỐ HOÁ HỌC VẼ RÕ (điều phối 05/10 — thầy hỏi "Lời giải hiển thị đúng chuẩn chưa?"): chỉ số Unicode của kho (C₆H₁₂O₆, Fe³⁺, 10⁻³) phải
// vẽ bằng <sub>/<sup> CÙNG phông (luật thầy 28/09, "Câu đã làm" đã làm) ở MỌI chỗ game Hoá 2.0 hiện đề, phương án, ý, lời giải: thẻ câu Đảo 2.0 khi làm,
// khối LỜI GIẢI (kiến thức cốt lõi + từng phương án), Đoàn (đề, phương án, ý, lời giải câu vừa làm), xem lại chuẩn Đoàn. Chỉ đổi cách vẽ.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { chiSoRo, chiSoRoSau } from '../src/lib/chi-so-ro'
import { KhoiLoiGiai, TheCauAi } from '../src/game/than-thu-v2/dao2/TrongAi'
import XemLaiChuan from '../src/game/than-thu-v2/doan2/XemLaiChuan'
import type { CauDao2 } from '../src/game/than-thu-v2/dao2/dao2-core'

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

describe('game Hoá 2.0 — vẽ chỉ số thật', () => {
  it('Đảo · thẻ câu khi làm bài: đề + phương án có <sub>/<sup>, không còn ký tự chỉ số Unicode', () => {
    const { container } = render(<TheCauAi cau={cau()} stt={1} traLoi="" khoa={false} onTraLoi={() => {}} onZoom={() => {}} />)
    expect(container.querySelectorAll('sub').length).toBeGreaterThanOrEqual(6)
    expect([...container.querySelectorAll('sup')].map((x) => x.textContent)).toContain('3+')
    expect(UNICODE.test(container.textContent ?? '')).toBe(false)
  })

  it('Đảo · khối LỜI GIẢI: kiến thức cốt lõi + các bước + vì sao từng phương án đều vẽ chỉ số thật', () => {
    const solution = {
      chot: 'H = lượng thực tế : lượng lí thuyết × 100%.',
      buoc: ['n(CH₃COOH) = 6 : 60 = 0,1 mol', 'm(CH₃COOC₂H₅) lí thuyết = 0,1 · 88 = 8,8 gam', 'H = 4,4 : 8,8 × 100% = 50%'],
      tungPa: { A: { dung: false, viSao: 'Nhầm lấy 4,4 : 17,6.' }, B: { dung: true, viSao: 'Đúng: H = 4,4 : 8,8 × 100% (CH₃COOC₂H₅).' }, C: { dung: false, viSao: 'Sai tỉ lệ mol.' }, D: { dung: false, viSao: 'Fe³⁺ không liên quan.' } },
    }
    const { container } = render(
      <KhoiLoiGiai cau={cau()} stt={1} phanHoi={{ correct: true, answer: 'B', traLoi: 'B', solution } as never} traLoiMay="B" onZoom={() => {}} tuCuon={false} />,
    )
    // Chuẩn khối LỜI GIẢI Phần I: Kiến thức cốt lõi + ✓/✗ vì sao từng phương án (các bước chỉ hiện ở Phần III).
    const giai = container.querySelector('.loi-giai')!
    expect((giai.textContent ?? '').replace(/\s+/g, ' ')).toContain('Kiến thức cốt lõi')
    expect(giai.querySelectorAll('sub').length).toBeGreaterThanOrEqual(3) // CH3COOC2H5 trong lý do phương án B
    expect(UNICODE.test(container.textContent ?? '')).toBe(false)
  })

  it('Đoàn · xem lại chuẩn (Phần II): đề + ý + lời giải vẽ chỉ số thật', () => {
    const { container } = render(
      <XemLaiChuan q={cau('II') as never} chon="DSDS" dapAn="DSDS" solution={{ chot: 'Xúc tác H₂SO₄ đặc.', tungY: { a: { dung: true, viSao: 'M(CH₃COOC₂H₅) = 88.' } } }} stt={1} onZoom={() => {}} />,
    )
    expect(container.querySelectorAll('sub').length).toBeGreaterThanOrEqual(6)
    expect(UNICODE.test(container.textContent ?? '')).toBe(false)
  })
})
