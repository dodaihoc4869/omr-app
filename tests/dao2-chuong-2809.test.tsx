// ĐẢO 2.0 · HOẠT CẢNH BẮN CHƯỞNG (thầy 28/09): đúng ⇒ chưởng bay về phía quái; sai ⇒ quái phản đòn về thần thú; reduced-motion ⇒ bản giản lược.
// Hoạt cảnh chỉ đọc kết quả máy chủ đã chấm (ketQua) — không có đáp án trong props.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, act } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { CanhRung } from '../src/game/than-thu-v2/dao2/TrongAi'
import ChuongTranDau, { donChuong, MOC_CHUONG } from '../src/game/than-thu-v2/dao2/ChuongTranDau'
import type { DaoProfile } from '../src/game/than-thu-v2/dao/kieu'
import type { BattleAnswer } from '../src/game/than-thu-v2/learning-battle'

const goc = window.matchMedia
afterEach(() => { cleanup(); window.matchMedia = goc; vi.restoreAllMocks() })
const giam = (bat: boolean) => { window.matchMedia = ((q: string) => ({ matches: bat && q.includes('reduced-motion'), media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as typeof window.matchMedia }
const hoSo: DaoProfile = { nickname: 'Đỗ Đại Học', pet: 'bieton_huou', choice: false, cap: 7, exp: 0, wallet: 0, mastery: [] }
const kq = (...d: boolean[]): BattleAnswer[] => d.map((correct, i) => ({ qid: `q${i}`, correct }))
const canh = (k: BattleAnswer[]) => render(<div className="dao dao2"><CanhRung profile={hoSo} ketQua={k} tong={12} suKien={k.length} /></div>).container

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
})
