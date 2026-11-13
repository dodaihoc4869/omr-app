// XEM LẠI LIVE — MẶT MÁY TÍNH CHỈ-XEM trong trình phát (13/11): `MayTinhXem` (tách từ `MayTinhEm` của bảng live) nhận gói tại giờ đang phát và vẽ đúng
// màn hình, đúng chỗ, nháy viền phím thầy vừa bấm; thầy cất ⇒ biến mất. Kèm chốt mã: trình phát nạp LƯỜI mặt máy, kiểu nút của trình phát không đè phím máy tính.
import { readFileSync } from 'node:fs'
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MayTinhXem } from '../src/components/may-tinh/MayTinhEm'
import { MT_RONG } from '../src/components/may-tinh/MatMay'
import { bam, manHinh, taoMay } from '../src/lib/may-tinh/may'
import { chiSoMayTinh, mayTinhTai } from '../src/lib/live/xem-lai-kieu'
import { mayTinhGia } from './_live-xem-lai-hs-gia'

const W = 1000, H = 600
let cu: PropertyDescriptor | undefined, cuH: PropertyDescriptor | undefined
beforeEach(() => {
  // jsdom không dàn trang: cho khung lớp máy tính một khổ thật
  cu = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth'); cuH = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight')
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return W } })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get() { return H } })
  vi.useFakeTimers()
})
afterEach(() => {
  cleanup(); vi.useRealTimers()
  if (cu) Object.defineProperty(HTMLElement.prototype, 'clientWidth', cu); if (cuH) Object.defineProperty(HTMLElement.prototype, 'clientHeight', cuH)
})

describe('máy tính chỉ-xem trong trình phát xem lại', () => {
  it('vẽ đúng màn hình + đúng chỗ tại giờ đang phát; phím vừa bấm nháy viền một lần; thầy cất ⇒ biến mất', () => {
    const ds = mayTinhGia(100_000) // mở lúc 100 s, bấm 9,3 ÷ 93 = từ 101,5 s (0,6 giây một phím), dời lúc 112 s, cất lúc 140 s
    const tai = (t: number) => mayTinhTai(ds, chiSoMayTinh(ds, t))
    const r = render(<MayTinhXem tin={tai(99_000)} />)
    const may = () => r.container.querySelector<HTMLElement>('.mtx')
    expect(may()).toBeNull() // chưa mở
    r.rerender(<MayTinhXem tin={tai(103_500)} />) // đã bấm 9 , 3 ÷
    expect(may()).not.toBeNull()
    expect(may()!.getAttribute('data-xem')).toBe('') // chỉ xem: không bắt chạm
    expect(may()!.getAttribute('role')).toBe('img')
    expect(r.container.querySelector('.mtx-bt')!.textContent).toContain('9,3')
    expect(r.container.querySelector('[data-sang]')?.getAttribute('aria-label')).toBe('÷') // phím vừa bấm nháy viền
    act(() => { vi.advanceTimersByTime(400) })
    expect(r.container.querySelector('[data-sang]')).toBeNull()
    // cùng tỉ lệ bề ngang với màn thầy (24 %) và tâm ở 78 % bề ngang
    const u = (0.24 * W) / MT_RONG
    expect(parseFloat(may()!.style.getPropertyValue('--u'))).toBeCloseTo(u, 3)
    expect(parseFloat(may()!.style.left) + (MT_RONG * u) / 2).toBeCloseTo(0.78 * W, 0)
    r.rerender(<MayTinhXem tin={tai(120_000)} />) // đã có kết quả, thầy đã dời sang trái
    expect(r.container.querySelector('.mtx-kq')!.textContent).toBe('0,1')
    expect(parseFloat(may()!.style.left) + (MT_RONG * u) / 2).toBeCloseTo(0.3 * W, 0)
    r.rerender(<MayTinhXem tin={tai(141_000)} />)
    expect(may()).toBeNull()
  })
  it('gói tự dựng (không qua buổi giả): màn danh sách / lỗi cũng vẽ được', () => {
    let tt = taoMay()
    for (const p of ['1', 'chia', '0', 'bang']) tt = bam(tt, p)
    const r = render(<MayTinhXem tin={{ mo: true, x: 0.5, y: 0.5, w: 0.3, mh: manHinh(tt), p: 'bang', n: 4 }} />)
    expect(r.container.querySelector('.mtx-kq')!.getAttribute('data-loi')).toBe('')
  })
})

describe('chốt trong mã', () => {
  const doc = (p: string): string => readFileSync(p, 'utf8')
  it('trình phát nạp LƯỜI mặt máy tính và chỉ dựng khi buổi có `mayTinh`; tra máy tính trong vòng khung hình, chỉ báo React khi sang mốc khác', () => {
    const tp = doc('src/screens/live-xem-lai/hs/TrinhPhat.tsx')
    expect(tp).toMatch(/lazy\(\(\) => import\('\.\.\/\.\.\/\.\.\/components\/may-tinh\/MayTinhEm'\)/)
    expect(tp).not.toMatch(/^import .*may-tinh\/(?:MayTinhEm|MatMay)/m) // không nhập tĩnh ⇒ không kéo mặt máy vào mảnh trình phát
    expect(tp).toContain('buoi.mayTinh?.length ? <Suspense')
    expect(tp).toMatch(/chiSoMayTinh\(buoi\.mayTinh, t\); if \(k !== S\.current\.mt\)/)
  })
  it('kiểu nút chung của trình phát KHÔNG đè phím máy tính (cỡ chữ + nền của `.mtx-p`)', () => {
    expect(doc('src/screens/live-xem-lai/hs/phat.css')).toContain('.xp button:where(:not(.mtx *)) {')
  })
  it('phòng ghi máy tính ngay trên đường nhận tin của THẦY, không chờ storage / D1; nhật ký có mảnh riêng, dọn cùng buổi', () => {
    const p = doc('server/src/phong-binh-phan-ung.ts'), xl = doc('server/src/live-xem-lai.ts')
    expect(p).toMatch(/j\.t === 'lop' && j\.k === 'mt' && a\.v === 'gv'\) \{ try \{ this\.xl\.mayTinh\(st, j\.x, nay\) \}/)
    const ham = xl.slice(xl.indexOf('  mayTinh(st: TrangThaiPhong'), xl.indexOf('  /** Tin `live-ghi` của máy ghi'))
    expect(ham).not.toMatch(/await|\.d1\(|kho\.(get|put)/)
    expect(xl).toContain('`xl:mt:${i}`'); expect(xl).toMatch(/for \(let i = 0; i < \(m\.mt \?\? 0\); i\+\+\) await this\.kho\.delete\(`xl:mt:\$\{i\}`\)/)
  })
})
