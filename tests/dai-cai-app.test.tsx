// DẢI CÀI APP PHẢI NÓI ĐÚNG APP NÓ SẮP CÀI.
//
// Lỗi thầy quay video: dải ghi "Cài ĐĐH Học sinh" nhưng bấm vào lại cài ra app
// "ĐỖ ĐẠI HỌC" chung, vì máy còn giữ bản HTML cũ nên thẻ <link rel="manifest">
// vẫn trỏ manifest chung. Dải nay đọc tên thẳng từ manifest đang được trỏ tới,
// lệch thì đổi thành nút "Tải lại" chứ không cho cài nhầm.
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DaiCaiApp from '../src/components/DaiCaiApp'
import { tenAppCuaVai, tenAppSeCai } from '../src/lib/pwa-install'

function datManifest(noiDung: object | null) {
  document.head.querySelectorAll('link[rel="manifest"]').forEach((l) => l.remove())
  if (!noiDung) return
  const l = document.createElement('link')
  l.rel = 'manifest'
  l.href = 'https://vi.du/omr-app/manifest.json'
  document.head.appendChild(l)
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => noiDung }))
}

beforeEach(() => {
  localStorage.clear()
  // Chưa cài thì mới hiện dải.
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: q.includes('browser'),
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.head.querySelectorAll('link[rel="manifest"]').forEach((l) => l.remove())
})

describe('tenAppCuaVai — khớp short_name trong manifest', async () => {
  const hs = (await import('../public/manifest-hs.json')).default
  const ph = (await import('../public/manifest-ph.json')).default

  it('tên trong code và trong file manifest không được lệch nhau', () => {
    expect(tenAppCuaVai('hs')).toBe(hs.short_name)
    expect(tenAppCuaVai('ph')).toBe(ph.short_name)
  })
})

describe('tenAppSeCai', () => {
  it('đọc short_name từ đúng manifest đang được trỏ tới', async () => {
    datManifest({ short_name: 'ĐĐH Học sinh', name: 'ĐỖ ĐẠI HỌC — Học sinh' })
    expect(await tenAppSeCai()).toBe('ĐĐH Học sinh')
  })

  it('không có thẻ manifest thì trả rỗng, không ném lỗi', async () => {
    datManifest(null)
    expect(await tenAppSeCai()).toBe('')
  })
})

describe('DaiCaiApp', () => {
  it('manifest ĐÚNG vai → mời cài, ghi đúng tên app', async () => {
    datManifest({ short_name: 'ĐĐH Học sinh' })
    render(<DaiCaiApp vai="hs" />)
    await waitFor(() => expect(screen.getByText('Cài ĐĐH Học sinh ra màn hình')).toBeTruthy())
    expect(screen.getByRole('button', { name: 'Cài đặt' })).toBeTruthy()
  })

  it('manifest LỆCH (máy còn bản cũ) → KHÔNG cho cài, đổi thành Tải lại', async () => {
    datManifest({ short_name: 'ĐỖ ĐẠI HỌC' })
    render(<DaiCaiApp vai="hs" />)
    await waitFor(() => expect(screen.getByText('Máy còn giữ bản cũ')).toBeTruthy())
    expect(screen.getByRole('button', { name: 'Tải lại' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Cài đặt' })).toBeNull()
    // Nói rõ nó sẽ cài nhầm ra app nào, để thầy đọc là biết chuyện gì xảy ra.
    expect(screen.getByText(/ĐỖ ĐẠI HỌC/)).toBeTruthy()
  })

  it('vai phụ huynh cũng vậy', async () => {
    datManifest({ short_name: 'ĐĐH Phụ huynh' })
    render(<DaiCaiApp vai="ph" />)
    await waitFor(() => expect(screen.getByText('Cài ĐĐH Phụ huynh ra màn hình')).toBeTruthy())
  })

  it('đọc manifest hỏng thì vẫn mời cài bình thường, không chặn oan', async () => {
    document.head.querySelectorAll('link[rel="manifest"]').forEach((l) => l.remove())
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('mất mạng')))
    render(<DaiCaiApp vai="hs" />)
    await waitFor(() => expect(screen.getByText('Cài ĐĐH Học sinh ra màn hình')).toBeTruthy())
  })
})
