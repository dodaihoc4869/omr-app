// ĐẢO 2.0 · HOẠT CẢNH BẮN CHƯỞNG (thầy 28/09): đúng ⇒ chưởng bay về phía quái; sai ⇒ quái phản đòn về thần thú; reduced-motion ⇒ bản giản lược.
// Hoạt cảnh chỉ đọc kết quả máy chủ đã chấm (ketQua) — không có đáp án trong props.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, act, fireEvent } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import TrongAi, { CanhRung } from '../src/game/than-thu-v2/dao2/TrongAi'
import type { PhanHoi2 } from '../src/game/than-thu-v2/dao2/TrongAi'
import type { CauDao2 } from '../src/game/than-thu-v2/dao2/dao2-core'
import ChuongTranDau, { donChuong, MOC_CHUONG } from '../src/game/than-thu-v2/dao2/ChuongTranDau'
import type { DaoProfile } from '../src/game/than-thu-v2/dao/kieu'
import type { BattleAnswer } from '../src/game/than-thu-v2/learning-battle'

const goc = window.matchMedia
afterEach(() => { cleanup(); window.matchMedia = goc; vi.restoreAllMocks() })
const giam = (bat: boolean) => { window.matchMedia = ((q: string) => ({ matches: bat && q.includes('reduced-motion'), media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as typeof window.matchMedia }
const hoSo: DaoProfile = { nickname: 'Đỗ Đại Học', pet: 'bieton_huou', choice: false, cap: 7, exp: 0, wallet: 0, mastery: [] }
const kq = (...d: boolean[]): BattleAnswer[] => d.map((correct, i) => ({ qid: `q${i}`, correct }))
const canh = (k: BattleAnswer[]) => render(<div className="dao dao2"><CanhRung profile={hoSo} ketQua={k} tong={12} suKien={k.length} chuong /></div>).container

describe('Đảo 2.0 · bắn chưởng theo kết quả chấm', () => {
  it('ĐÚNG ⇒ chưởng từ thần thú về phía quái, số máu và thanh máu quái tụt từ mức cũ', () => {
    giam(false)
    const c = canh(kq(true))
    const lop = c.querySelector('.d2c')!
    expect(lop.getAttribute('data-kieu')).toBe('dung')
    expect(lop.querySelector('.d2c-cau')).toBeTruthy()
    expect(lop.querySelector('.d2c-no .d2c-song')).toBeTruthy()
    expect(lop.querySelector('.d2c-do')).toBeNull()
    const sec = c.querySelector('.dao2-canh') as HTMLElement
    expect(sec.getAttribute('data-chuong')).toBe('dung')
    expect(Number(sec.style.getPropertyValue('--d2c-quai-tu'))).toBeCloseTo(100 / 91)
    expect(c.querySelector('.dao2-so')?.getAttribute('data-phia')).toBe('quai')
  })
  it('SAI ⇒ quái phản đòn: cục sương bay về thần thú, thần thú chớp đỏ', () => {
    giam(false)
    const c = canh(kq(true, false))
    const lop = c.querySelector('.d2c')!
    expect(lop.getAttribute('data-kieu')).toBe('sai')
    expect(lop.querySelector('.d2c-do')).toBeTruthy()
    expect(c.querySelector('.dao2-canh')!.getAttribute('data-chuong')).toBe('sai')
    expect(c.querySelector('.dao2-so')?.getAttribute('data-phia')).toBe('thu')
    const css = readFileSync('src/game/than-thu-v2/dao2/chuong.css', 'utf8')
    expect(css).toMatch(/\.d2c\[data-kieu="sai"\]\{--xa:var\(--xq\);--ya:var\(--yq\);--xb:var\(--xt\)/)
  })
  it('3 câu đúng liền ⇒ Cuồng nộ, chữ "Combo x3", cầu to hơn', () => {
    giam(false)
    const c = canh(kq(false, true, true, true))
    const lop = c.querySelector('.d2c') as HTMLElement
    expect(lop.hasAttribute('data-cuong-no')).toBe(true)
    expect(lop.textContent).toContain('Combo x3')
    expect(Number(lop.style.getPropertyValue('--d2c-co'))).toBeGreaterThan(1.5)
    expect(donChuong(kq(true, true), 12, 2)).toMatchObject({ dung: true, combo: 2, cuongNo: false })
  })
  it('prefers-reduced-motion ⇒ bản giản lược: chỉ một nháy sáng, không cầu bay', () => {
    giam(true)
    const lop = canh(kq(true)).querySelector('.d2c')!
    expect(lop.hasAttribute('data-gian-luoc')).toBe(true)
    expect(lop.querySelector('.d2c-nhay')).toBeTruthy()
    expect(lop.querySelector('.d2c-cau')).toBeNull()
    const css = readFileSync('src/game/than-thu-v2/dao2/chuong.css', 'utf8')
    // mọi chuyển động nằm trong khối no-preference; ngoài khối chỉ có nháy sáng
    const ngoai = css.split('@media (prefers-reduced-motion:no-preference)')[0]!
    expect(ngoai).not.toMatch(/d2c-(ngang|vong|lui|giat|rung)/)
  })
  it('chưa chấm câu nào ⇒ không có hoạt cảnh; tự gỡ sau khi xong; không chặn bấm', () => {
    giam(false)
    expect(canh([]).querySelector('.d2c')).toBeNull()
    cleanup()
    vi.useFakeTimers()
    const { container, rerender } = render(<ChuongTranDau thu={6} ketQua={kq(true)} tong={12} suKien={1} />)
    expect(container.querySelector('.d2c')).toBeTruthy()
    act(() => { vi.advanceTimersByTime((MOC_CHUONG.het + 0.4) * 1000) })
    rerender(<ChuongTranDau thu={6} ketQua={kq(true)} tong={12} suKien={1} />)
    expect(container.querySelector('.d2c')).toBeNull()
    vi.useRealTimers()
    expect(readFileSync('src/game/than-thu-v2/dao2/chuong.css', 'utf8')).toMatch(/\.d2c\{position:absolute;inset:0;container-type:size;pointer-events:none/)
    expect(MOC_CHUONG.het).toBeLessThanOrEqual(1.3)
  })

  it('cảnh dựng lại không có cờ chuong (sang câu sau, mở lại chuyến) ⇒ không chiếu chưởng lần hai', () => {
    giam(false)
    const c = render(<div className="dao dao2"><CanhRung profile={hoSo} ketQua={kq(true)} tong={12} suKien={1} /></div>).container
    expect(c.querySelector('.d2c')).toBeNull()
    expect(c.querySelector('.dao2-canh')!.hasAttribute('data-chuong')).toBe(false)
  })
})

// Thầy 28/09: "cho chưởng chạy ngay lúc em chốt đáp án" — mọi hướng màn, kể cả điện thoại dọc 390×844.
const CAU = [0, 1, 2].map((i): CauDao2 => ({ qid: `q${i}`, maDe: 'DE', version: '1', group: `g${i}`, phan: 'I', text: `Câu ${i + 1}`, choices: ['Một', 'Hai', 'Ba', 'Bốn'], ideas: [], hinhAnh: [], dang: 'D', tenDang: 'Glucose', mucDo: 'biet', sao: 1, kienThuc: [], vai: 'moi' }))
const PH: PhanHoi2 = { correct: true, answer: 'B', traLoi: 'B', solution: { chot: 'Glucose có nhóm –CHO.' }, solutionImages: [], reward: 5, lyDo: { moc: 0, exp: 0, chu: 'Đúng.' } }
const ai = (viTri: number, k: BattleAnswer[], ph: PhanHoi2 | null) => <div className="dao dao2"><TrongAi profile={hoSo} cau={CAU} viTri={viTri} ketQua={k} traLoi="B" assisted={false} phanHoi={ph}
  onTraLoi={() => {}} onAssisted={() => {}} onNop={() => {}} onTiep={() => {}} onRoi={() => {}} /></div>
describe('Đảo 2.0 · chưởng chạy ngay lúc chốt, trước lời giải (dọc 390×844)', () => {
  it('máy chủ trả kết quả ⇒ cảnh trận + chưởng hiện trước, ~1,1 s sau mới mở lời giải; sang câu sau không chiếu lại', () => {
    giam(false); vi.useFakeTimers()
    Object.defineProperty(window, 'innerWidth', { value: 390, configurable: true }); Object.defineProperty(window, 'innerHeight', { value: 844, configurable: true })
    const { container: c, rerender } = render(ai(0, [], null))
    expect(c.querySelector('.d2c')).toBeNull()
    rerender(ai(0, kq(true), PH))
    expect(c.querySelector('.dao2-canh .d2c[data-kieu="dung"]')).toBeTruthy()
    expect(c.querySelector('.dao2-the-giai')).toBeNull()
    expect(c.querySelector('.dao2-ket-qua')).toBeNull()
    expect(c.querySelector('.dao2-nut-chot')).toBeNull() // không chốt lại được giữa hoạt cảnh
    act(() => { vi.advanceTimersByTime(1150) })
    expect(c.querySelector('.dao2-the-giai')).toBeTruthy()
    expect(c.querySelector('.dao2-canh')).toBeNull() // dọc: lời giải thay chỗ cảnh trận như cũ
    rerender(ai(1, kq(true), null)) // sang ải 2: cảnh dựng lại
    expect(c.querySelector('.dao2-canh')).toBeTruthy()
    expect(c.querySelector('.d2c')).toBeNull()
    vi.useRealTimers()
  })
  it('em bấm vào màn ⇒ bỏ qua hoạt cảnh, mở lời giải ngay', () => {
    giam(false)
    const { container: c, rerender } = render(ai(0, [], null))
    rerender(ai(0, kq(false), { ...PH, correct: false }))
    expect(c.querySelector('.d2c[data-kieu="sai"]')).toBeTruthy()
    fireEvent.click(c.querySelector('.dao2-canh')!)
    expect(c.querySelector('.dao2-the-giai')).toBeTruthy()
  })
  it('giảm chuyển động ⇒ nháy sáng rồi mở lời giải sau 0,45 s', () => {
    giam(true); vi.useFakeTimers()
    const { container: c, rerender } = render(ai(0, [], null))
    rerender(ai(0, kq(true), PH))
    expect(c.querySelector('.d2c[data-gian-luoc] .d2c-nhay')).toBeTruthy()
    expect(c.querySelector('.dao2-the-giai')).toBeNull()
    act(() => { vi.advanceTimersByTime(500) })
    expect(c.querySelector('.dao2-the-giai')).toBeTruthy()
    vi.useRealTimers()
  })
  it('mở lại chuyến đang có lời giải (phanHoi có sẵn lúc dựng) ⇒ lời giải hiện ngay, không chưởng', () => {
    giam(false)
    const c = render(ai(0, kq(true), PH)).container
    expect(c.querySelector('.dao2-the-giai')).toBeTruthy()
    expect(c.querySelector('.d2c')).toBeNull()
  })
})
