// @vitest-environment jsdom
// HIỆN KẾT QUẢ KHÔNG KHỰNG (thầy 29/10 «bấm kiểm tra vẫn lag khựng 1 chút», src/components/hoc-tap/BungDung.tsx): bọt + hạt chỉ dựng SAU lần vẽ đầu của dải kết quả
// (effect của sự kiện bấm chạy trước khi vẽ ⇒ dựng ngay làm dải hiện chậm); dải gỡ trước khi tới lượt ⇒ không dựng gì, không để rác trong body.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { BungDung } from '../src/components/hoc-tap/BungDung'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout'] })
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) })
  Object.defineProperty(Element.prototype, 'animate', { configurable: true, value: () => ({ cancel() {} }) })
})
afterEach(() => { cleanup(); vi.useRealTimers(); document.body.innerHTML = '' })

const dai = (loai: 'dung' | 'sai' | 'trung' = 'dung') => render(<div className="duo-ket" data-tt={loai}><BungDung loai={loai} /></div>)

it('dựng xong dải mà CHƯA có mây / hạt; sau khung vẽ + một lượt hẹn mới có', () => {
  const { container } = dai('dung')
  expect(container.querySelector('.duo-may')).toBeNull()
  expect(document.querySelectorAll('.duo-vuong')).toHaveLength(0)
  vi.advanceTimersByTime(40)
  expect(container.querySelector('.duo-may')).not.toBeNull()
  expect(document.querySelectorAll('.duo-vuong').length).toBe(16)
})

it('dải gỡ trước khi tới lượt ⇒ không dựng gì', () => {
  const { container, unmount } = dai('sai')
  unmount()
  vi.advanceTimersByTime(100)
  expect(container.querySelector('.duo-may')).toBeNull()
  expect(document.querySelectorAll('.duo-tron')).toHaveLength(0)
})

it('dải gỡ SAU khi đã nổ ⇒ dọn sạch hạt trong body', () => {
  const { unmount } = dai('dung')
  vi.advanceTimersByTime(40)
  expect(document.querySelectorAll('.duo-vuong').length).toBe(16)
  unmount()
  expect(document.querySelectorAll('.duo-vuong')).toHaveLength(0)
})
