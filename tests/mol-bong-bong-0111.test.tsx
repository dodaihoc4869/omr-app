// BONG BÓNG LỜI TRÊN ĐẦU MOL (Lộ trình) — Boss soát PR 733: bong bóng che nút chặng ⇒ KHÔNG BAO GIỜ chặn chạm (pointer-events: none), TỰ MỜ sau ~6 giây,
// chạm Mol ⇒ hiện lại lời gần nhất, né nút chặng / nhãn (thu hẹp hoặc nâng lên), giảm chuyển động ⇒ không hiệu ứng.
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))
vi.mock('../src/lib/phan-hoi', () => ({ phanHoi: vi.fn() }))
import { MotTrangHs, type PropsMotTrang } from '../src/components/hoc-tap/TrongHs'

const noop = () => {}
const goc = (them: Partial<PropsMotTrang> = {}): PropsMotTrang => ({
  so: { daLam: 12, muc: 30, chang: 3, soChang: 5 } as PropsMotTrang['so'], dangTai: false, tenBai: 'Ester – Lipid', viec: 'Hiểu · Chặng 3/5',
  onHoc: noop, khoaHoc: false, hetCau: false, coCa: false, onThi: noop, soSua: 5, onChua: noop, ngayKiem: false, soBaiTap: 1, coBaiTap: true, onBaiTap: noop, ghi: [], ...them,
})
afterEach(() => { cleanup(); vi.useRealTimers(); localStorage.clear() })

describe('bong bóng trên đầu Mol (Lộ trình)', () => {
  it('lời Mol ở MỘT thẻ lời (có Mol) phía trên «Việc hôm nay», không nằm trong danh sách; nhắc một lần rồi tự thu (~4,7 s) và gỡ', () => {
    // hệ Kính 02/11 (bản vẽ v2 thầy duyệt): con đường + Mol đứng cạnh đường đã bỏ ⇒ lời Mol ở THẺ LỜI riêng phía trên «Việc hôm nay» — không thể đè nút nào,
    // nên logic né nút / thu thành «Mol nhắn» của chỗ neo trên đầu Mol không còn dùng. Kiểm hành vi của thẻ lời thay cho chỗ neo.
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 9, 31, 3, 0)) // 10:00 giờ VN
    const { container } = render(<MotTrangHs {...goc()} />)
    expect(container.querySelector('.da-lv-loi-o')).toBeNull()
    expect(container.querySelectorAll('.bi-loi-bong').length).toBe(1) // đúng một bong bóng lời
    const boc = container.querySelector('.bi-loi-boc')!
    expect(boc.querySelector('.bi-loi .bi')).not.toBeNull() // Mol đứng trong thẻ lời
    expect(boc.closest('.kb-viec-ds')).toBeNull() // không chen vào danh sách việc
    expect(boc.querySelector('.bi-loi-bong')!.textContent).toContain('Học tiếp nhé!')
    act(() => { vi.advanceTimersByTime(4600) })
    expect(container.querySelector('.bi-loi-boc:not([data-thu])')).not.toBeNull() // chưa tới 4,7 s: vẫn hiện
    act(() => { vi.advanceTimersByTime(200) })
    expect(container.querySelector('.bi-loi-boc[data-thu]')).not.toBeNull() // thu gọn
    act(() => { vi.advanceTimersByTime(500) })
    expect(container.querySelector('.bi-loi-boc')).toBeNull() // gỡ hẳn
    vi.useRealTimers()
  })
  it('không chặn chạm: chỗ neo + mọi con pointer-events none; Mol (không giám thị) chạm được', () => {
    const css = readFileSync('src/styles/trong-hs.css', 'utf8')
    expect(css).toContain("[data-trong='hs'] .da-lv-loi-o, [data-trong='hs'] .da-lv-loi-o * { pointer-events: none; }")
    expect(css).toContain("[data-trong='hs'] .da-linh-vat[data-lv='bi'] > .bi { pointer-events: auto; cursor: pointer; }")
    // giảm chuyển động ⇒ mờ / đổi màu / đập viền đều tắt
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{ \[data-trong\] \.bi-loi-boc \{ transition: none; \} \}/)
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{ \[data-trong='hs'\] \.bi-loi-bong\[data-cx\] \{ animation: none !important; transition: none; \} \}/)
  })
  it('né nút chặng / nhãn: nâng lên (--nang) rồi thu hẹp về phía trống, đuôi vẫn chỉ Mol — 02/11: hết cách thì dưới / cạnh Mol / nút nhỏ (bong-bong-khong-de-nut-0211)', () => {
    const tsx = readFileSync('src/components/hoc-tap/TrongHs.tsx', 'utf8'), css = readFileSync('src/styles/trong-hs.css', 'utf8'), lib = readFileSync('src/lib/bong-bong-mol.ts', 'utf8')
    expect(tsx).toContain(`d.querySelectorAll('button, [role="button"], a[href], .da-vong, .da-bong, .da-dem')`)
    expect(lib).toMatch(/return rong >= RONG_TOI_THIEU \?/) // = 130 px
    expect(lib).toContain('export const RONG_TOI_THIEU = 130')
    expect(tsx).toContain("['--nang', c.nang]")
    expect(css).toContain('bottom: calc(54px + var(--nang, 0px))'); expect(css).toContain('bottom: calc(70px + var(--nang, 0px))')
  })
})
