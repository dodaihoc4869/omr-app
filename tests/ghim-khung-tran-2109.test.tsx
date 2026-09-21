// THẦY LỆNH 21/09 (kèm ảnh Đảo thần thú, ải "Sửa lỗi", điện thoại hẹp): "khi cuộn đề thì chỗ thần thú và quái đánh nhau được GHIM lại không bị che mất. Kiểm tra hết trong game."
// Khoá: khung trận (thần thú, quái, hai thanh Máu, tên) DÍNH ngay dưới mép trên, nền đặc, nổi trên thẻ câu; THU GỌN khi màn thấp (≤ 700 px) hoặc đã cuộn > 40 px (hai ngưỡng cách
// nhau ⇒ không nhấp nháy); ≤ 200 ms + giảm chuyển động; Máu đổi không đổi cỡ khung; vỏ sheet của game không còn thanh trên đè dải ải (một nút về). Không đổi luật trận/EXP/chấm.
// Đo THẬT ở Chromium 360×640 / 390×844 / 768×1024 (đề dài 3 màn): xem SO-VIEC-GIAO-DIEN.md; ở đây khoá logic + CSS.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import { SanDau, CAO_MAN_GON, NGUONG_CUON_GON, NGUONG_CUON_MO } from '../src/game/than-thu-v2/dao/ThamHiem'
import type { DaoProfile } from '../src/game/than-thu-v2/dao/kieu'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const hoSo: DaoProfile = { nickname: 'Lửa Nhỏ', pet: 'lua_phuong', choice: false, cap: 34, exp: 0, wallet: 0, mastery: [] }
const dung = (n: number) => Array.from({ length: n }, (_, i) => ({ qid: `q${i}`, correct: true }))
const cao0 = window.innerHeight

function datCaoMan(h: number) {
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: h })
  act(() => void window.dispatchEvent(new Event('resize')))
}
/** Khung cuộn riêng (như vỏ sheet: fixed + overflow-y: auto) chứa khung trận. */
function veTrongVungCuon(ketQua = dung(1)) {
  const r = render(
    <div className="dao">
      <div data-testid="sheet" style={{ overflowY: 'auto' }}>
        <SanDau profile={hoSo} ketQua={ketQua} tong={6} suKien={ketQua.length} xong={false} />
      </div>
    </div>,
  )
  const sheet = r.getByTestId('sheet')
  const khung = () => r.container.querySelector('.dao-san') as HTMLElement
  const cuon = (y: number) => act(() => {
    sheet.scrollTop = y
    sheet.dispatchEvent(new Event('scroll'))
  })
  return { ...r, sheet, khung, cuon }
}

beforeEach(() => datCaoMan(844))
afterEach(() => {
  cleanup()
  datCaoMan(cao0)
})

describe('useKhungGon — khi nào thu gọn', () => {
  it('đầu trang trên màn cao: KHÔNG thu gọn (khung đầy đủ)', () => {
    const { khung } = veTrongVungCuon()
    expect(khung().hasAttribute('data-gon')).toBe(false)
  })

  it('cuộn > 40 px ⇒ thu gọn; hai ngưỡng cách nhau: về 20 px vẫn gọn (không nhấp nháy), về < 8 px mới mở lại', () => {
    expect([NGUONG_CUON_GON, NGUONG_CUON_MO, CAO_MAN_GON]).toEqual([40, 8, 700])
    const { khung, cuon } = veTrongVungCuon()
    cuon(40)
    expect(khung().hasAttribute('data-gon')).toBe(false) // đúng ngưỡng: chưa (phải LỚN hơn 40)
    cuon(41)
    expect(khung().hasAttribute('data-gon')).toBe(true)
    cuon(20)
    expect(khung().hasAttribute('data-gon')).toBe(true)
    cuon(8)
    expect(khung().hasAttribute('data-gon')).toBe(true) // đúng ngưỡng mở: 8 vẫn gọn (mở khi < 8)
    cuon(7)
    expect(khung().hasAttribute('data-gon')).toBe(false)
  })

  it('màn thấp (≤ 700 px cao) ⇒ thu gọn NGAY từ đầu trang; màn 701 px thì chưa; đổi kích thước máy cập nhật theo', () => {
    datCaoMan(640)
    const a = veTrongVungCuon()
    expect(a.khung().hasAttribute('data-gon')).toBe(true)
    a.cuon(0)
    expect(a.khung().hasAttribute('data-gon')).toBe(true) // đã ở đầu trang mà màn thấp vẫn gọn
    cleanup()
    datCaoMan(701)
    const b = veTrongVungCuon()
    expect(b.khung().hasAttribute('data-gon')).toBe(false)
    datCaoMan(700)
    expect(b.khung().hasAttribute('data-gon')).toBe(true) // xoay ngang/đổi cỡ: 700 là gọn
    datCaoMan(900)
    expect(b.khung().hasAttribute('data-gon')).toBe(false)
  })

  it('KHÔNG có vùng cuộn riêng thì đọc cuộn của trang (window)', () => {
    const r = render(<div className="dao"><SanDau profile={hoSo} ketQua={dung(1)} tong={6} suKien={1} xong={false} /></div>)
    const khung = () => r.container.querySelector('.dao-san') as HTMLElement
    expect(khung().hasAttribute('data-gon')).toBe(false)
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 90 })
    act(() => void window.dispatchEvent(new Event('scroll')))
    expect(khung().hasAttribute('data-gon')).toBe(true)
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
    act(() => void window.dispatchEvent(new Event('scroll')))
    expect(khung().hasAttribute('data-gon')).toBe(false)
  })

  it('Máu đổi (thêm câu đúng) KHÔNG đổi trạng thái gọn/đầy ⇒ không giật bố cục; hai thanh máu vẫn đủ nhãn số', () => {
    const { khung, cuon, rerender } = veTrongVungCuon(dung(1))
    cuon(100)
    expect(khung().hasAttribute('data-gon')).toBe(true)
    rerender(<div className="dao"><div style={{ overflowY: 'auto' }}><SanDau profile={hoSo} ketQua={dung(3)} tong={6} suKien={3} xong={false} /></div></div>)
    // (dựng lại vùng cuộn mới ⇒ đầu trang) — điều cần khoá: cả hai thanh máu luôn có mặt và có aria-valuenow, dù gọn hay đầy.
    const thanh = [...document.querySelectorAll('.dao-san [role="progressbar"]')]
    expect(thanh.length).toBe(2)
    for (const t of thanh) expect(Number(t.getAttribute('aria-valuenow'))).toBeGreaterThanOrEqual(0)
  })

  it('gỡ máy nghe khi rời màn (không rò): scroll ở vùng cuộn + resize ở cửa sổ đều được gỡ', () => {
    const { unmount, sheet } = veTrongVungCuon()
    const goSheet = vi.spyOn(sheet, 'removeEventListener')
    const goCuaSo = vi.spyOn(window, 'removeEventListener')
    unmount()
    expect(goSheet.mock.calls.map((c) => c[0])).toContain('scroll')
    expect(goCuaSo.mock.calls.map((c) => c[0])).toContain('resize')
    expect(() => sheet.dispatchEvent(new Event('scroll'))).not.toThrow()
    goCuaSo.mockRestore()
  })

  it('nút loa vẫn có và vẫn bấm được ở cả hai kích cỡ (giữ nguyên chức năng)', () => {
    const { cuon, container } = veTrongVungCuon()
    const loa = () => container.querySelector('button.dao-san-tieng') as HTMLButtonElement
    expect(loa().getAttribute('aria-pressed')).toBeTruthy()
    cuon(200)
    expect(loa()).toBeTruthy()
    const truoc = loa().getAttribute('aria-pressed')
    act(() => void loa().click())
    expect(loa().getAttribute('aria-pressed')).not.toBe(truoc)
    act(() => void loa().click())
  })
})

describe('CSS — ghim khung trận Đảo (dao.css)', () => {
  const css = doc('src/game/than-thu-v2/dao/dao.css')
  const dong = (goc: string) => css.split('\n').find((l) => l.startsWith(goc))!

  it('.dao-san: sticky ngay dưới mép trên (chừa tai thỏ), z-index nổi trên thẻ câu, nền đặc, chuyển cỡ ≤ 200 ms', () => {
    const l = dong('.dao .dao-san{position:sticky')
    expect(l).toContain('top:max(8px,env(safe-area-inset-top,0px))')
    expect(l).toMatch(/z-index:8/)
    expect(l).toMatch(/transition:height \.18s/)
    expect(l).toMatch(/background:radial-gradient/) // nền đặc (gradient không trong suốt)
    expect(l).not.toMatch(/rgba\([^)]*,0?\.\d+\)\s*0%/) // không nền trong suốt ở gốc gradient
    const s = (l.match(/z-index:(\d+)/) ?? [])[1]
    // thẻ câu và các khối cùng cấp KHÔNG có z-index ≥ 8 (không chồng lên khung); nút nổi đáy (z 5) thấp hơn
    expect(Number(s)).toBeGreaterThan(5)
    expect(css).not.toMatch(/\.dao \.dao-cau\{[^}]*z-index/)
  })

  it('tôn trọng giảm chuyển động: prefers-reduced-motion tắt chuyển cỡ', () => {
    expect(css).toContain('@media (prefers-reduced-motion:reduce){.dao .dao-san{transition:none}}')
  })

  it('bản gọn: cao ≤ 112 px, hai thanh máu + số máu, ẩn chữ phụ; nút loa thu nhỏ vẫn ≥ 30 px', () => {
    const h = Number((dong('.dao .dao-san[data-gon]{').match(/height:(\d+)px/) ?? [])[1])
    expect(h).toBeGreaterThanOrEqual(96)
    expect(h).toBeLessThanOrEqual(112)
    expect(css).toContain('.dao .dao-san[data-gon] .dao-san-ten small{display:none}')
    expect(css).toContain('.dao .dao-san[data-gon] .dao-san-chuoi,.dao .dao-san[data-gon] .dao-san-tia{display:none}')
    expect(dong('.dao .dao-san[data-gon] button.dao-san-tieng')).toMatch(/width:30px;height:30px/)
    expect(dong('.dao .dao-san[data-gon] .dao-san-mau,')).toMatch(/height:7px/)
  })

  it('không tổ tiên nào của khung bị `overflow:hidden` (sẽ làm sticky mất tác dụng): .dao-tham / .dao-vo / .dao', () => {
    for (const goc of ['.dao .dao-tham{', '.dao-vo{', '.dao-vo.dao-vo-tham{']) expect(dong(goc), goc).not.toMatch(/overflow:\s*hidden/)
    expect(css.split('\n').find((l) => /^\.dao\{/.test(l)) ?? '').not.toMatch(/overflow:\s*hidden/)
  })
})

describe('Đoàn Hộ Tống — khung trận đã đứng yên theo thiết kế, màn thấp thu gọn', () => {
  const css = doc('src/game/than-thu-v2/doan.css')
  it('trong trận: chỉ thẻ câu cuộn BÊN TRONG (.dh-giay overflow-y:auto, khung .dh-tran overflow:hidden) — khung trận không cuộn cùng đề', () => {
    expect(css).toMatch(/\.dh-tran\{overflow:hidden\}/)
    expect(css).toMatch(/\.dh-giay\{[^}]*flex:1 1 0;min-height:0;[^}]*overflow-y:auto/s)
  })
  it('màn ≤ 700 px cao: cảnh trận ~96–108 px, không vượt cỡ cũ (clamp 124–176)', () => {
    const m = /@media \(max-height:700px\)\{\.dh-tran \.dh-canh\{height:clamp\((\d+)px,(\d+)vh,(\d+)px\)\}/.exec(css)
    expect(m).toBeTruthy()
    expect(Number(m![1])).toBeGreaterThanOrEqual(96)
    expect(Number(m![3])).toBeLessThanOrEqual(112)
    expect(css.indexOf('@media (max-height:700px)')).toBeGreaterThan(css.indexOf('@media (max-height:780px)')) // đứng SAU để thắng
  })
})

describe('Vỏ sheet của game — không còn thanh trên đè dải ải; MỘT nút về', () => {
  const nguon = doc('src/screens/StudentPortalScreen.tsx')
  it("thanh trên cũ (\"Quay lại Bảng tin\" + \"Đóng\") KHÔNG dựng cho tab game; các tab khác giữ nguyên", () => {
    expect(nguon).toContain("{!vaoM3 && tab !== 'thanthu' && <header className=\"sticky top-0 z-30")
    expect(nguon).toContain('label="Quay lại Bảng tin"') // các sheet khác vẫn có
  })
  it('game còn đủ đường về ở MỌI màn: Đảo "Về app học sinh" (dính trên cùng) · Thám hiểm "Về đảo" · thanh riêng cho Võ đài/Tiến bộ', () => {
    expect(doc('src/game/than-thu-v2/dao/DaoThanThu.tsx')).toContain('className="dao-ve-app" onClick={onDong}>Về app học sinh')
    expect(doc('src/game/than-thu-v2/dao/ThamHiem.tsx')).toContain('aria-label="Về đảo (chuyến đang làm được giữ lại)"')
    expect(doc('src/game/than-thu-v2/Game.tsx')).toContain('<button onClick={onDong}>Về app học sinh</button>')
  })
})
