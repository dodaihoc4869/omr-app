// DẢI CÀI APP PHẢI NÓI ĐÚNG APP NÓ SẮP CÀI.
//
// Lỗi thầy quay video: dải ghi "Cài ĐĐH Học sinh" nhưng bấm vào lại cài ra app
// "ĐỖ ĐẠI HỌC" chung, vì máy còn giữ bản HTML cũ nên thẻ <link rel="manifest">
// vẫn trỏ manifest chung. Dải nay đọc tên thẳng từ manifest đang được trỏ tới,
// lệch thì đổi thành nút "Tải lại" chứ không cho cài nhầm.
import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DaiCaiApp from '../src/components/DaiCaiApp'
import { CHO_SU_KIEN_CAI_MS, laCocCoc, moBangChrome, tenAppCuaVai, tenAppSeCai, trongTrinhDuyetTrongApp } from '../src/lib/pwa-install'

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

// TRÌNH DUYỆT TRONG ỨNG DỤNG (Zalo, Facebook, Messenger) — nguyên nhân thật của
// "cài mãi không ra đúng app": các webview này bỏ qua manifest, lệnh "Thêm vào
// màn hình chính" chỉ tạo lối tắt mang TIÊU ĐỀ TRANG và FAVICON. Đúng những gì
// video của thầy cho thấy: biểu tượng chữ "A" và tên "ĐỖ ĐẠI HỌC".
describe('trongTrinhDuyetTrongApp', () => {
  const CHAN = {
    Zalo: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36 Zalo/2.4.1',
    'Facebook Android': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/450.0]',
    'Facebook iOS': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 [FBAN/FBIOS;FBAV/450.0]',
    Instagram: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36 Instagram 300.0',
    Line: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36 Line/13.0.0',
    'webview iOS lạ': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
  }
  const CHO_QUA = {
    'Chrome Android': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36',
    'Safari iPhone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
    'Chrome iPhone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/120 Mobile/15E148 Safari/604.1',
    'Chrome máy tính': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36',
  }

  it('nhận ra webview của Zalo, Facebook, Instagram, Line', () => {
    for (const [ten, ua] of Object.entries(CHAN)) {
      expect(trongTrinhDuyetTrongApp(ua), ten).toBe(true)
    }
  })

  it('KHÔNG chặn nhầm trình duyệt thật', () => {
    for (const [ten, ua] of Object.entries(CHO_QUA)) {
      expect(trongTrinhDuyetTrongApp(ua), ten).toBe(false)
    }
  })
})

describe('moBangChrome', () => {
  it('Android trả link intent sang Chrome', () => {
    const l = moBangChrome('Mozilla/5.0 (Linux; Android 13) Chrome/120 Mobile Safari/537.36')
    expect(l).toContain('intent://')
    expect(l).toContain('package=com.android.chrome')
    expect(l).toContain('scheme=https')
  })

  it('iOS không có cách tương đương — trả null, không vẽ nút chết', () => {
    expect(moBangChrome('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1')).toBe(null)
  })
})

describe('DaiCaiApp trong Zalo', () => {
  const UA_ZALO = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36 Zalo/2.4.1'

  it('KHÔNG hiện nút Cài đặt, chỉ hướng dẫn mở bằng trình duyệt', async () => {
    vi.stubGlobal('navigator', { ...navigator, userAgent: UA_ZALO, clipboard: { writeText: vi.fn() } })
    datManifest({ short_name: 'ĐĐH Học sinh' })
    render(<DaiCaiApp vai="hs" />)
    expect(screen.getByText('Mở bằng Chrome để cài app')).toBeTruthy()
    expect(screen.getByText(/Đang mở trong Zalo/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Cài đặt' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Sao chép link' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Thử mở trong Chrome' })).toBeTruthy()
  })

  it('iPhone trong Facebook: có sao chép link, KHÔNG có nút Chrome', () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 [FBAN/FBIOS;FBAV/450.0]',
      clipboard: { writeText: vi.fn() },
    })
    datManifest({ short_name: 'ĐĐH Phụ huynh' })
    render(<DaiCaiApp vai="ph" />)
    expect(screen.getByRole('button', { name: 'Sao chép link' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Thử mở trong Chrome' })).toBeNull()
  })
})

// TRÌNH DUYỆT KHÔNG CÀI ĐƯỢC PWA (Cốc Cốc và mọi trình duyệt khác cùng cảnh).
// Video thứ hai của thầy: menu trình duyệt KHÔNG có "Thêm vào Màn hình chính",
// bấm Cài đặt chỉ ra tấm hướng dẫn chỉ vào một mục không tồn tại. Nên không
// đoán theo tên trình duyệt nữa mà dò khả năng thật: chờ beforeinstallprompt,
// im lặng thì kết luận không cài được.
describe('Trình duyệt không hỗ trợ cài (Cốc Cốc)', () => {
  const UA_COCCOC =
    'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36 coc_coc_browser/120.0.0'

  it('laCocCoc nhận đúng, không nhận nhầm Chrome', () => {
    expect(laCocCoc(UA_COCCOC)).toBe(true)
    expect(laCocCoc('Mozilla/5.0 (Linux; Android 13) Chrome/120 Mobile Safari/537.36')).toBe(false)
  })

  it('chờ hết giờ mà không có beforeinstallprompt → bỏ nút Cài đặt, chỉ đường sang Chrome', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('navigator', { ...navigator, userAgent: UA_COCCOC, clipboard: { writeText: vi.fn() } })
    datManifest({ short_name: 'ĐĐH Học sinh' })
    render(<DaiCaiApp vai="hs" />)
    // Trước khi hết giờ chờ: vẫn mời cài, không kết luận vội.
    expect(screen.queryByText('Mở bằng Chrome để cài app')).toBeNull()
    await act(async () => {
      vi.advanceTimersByTime(CHO_SU_KIEN_CAI_MS + 10)
    })
    expect(screen.getByText('Mở bằng Chrome để cài app')).toBeTruthy()
    expect(screen.getByText(/Cốc Cốc không cài được/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Cài đặt' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Sao chép link' })).toBeTruthy()
    vi.useRealTimers()
  })

  it('iPhone Safari KHÔNG bị kết luận là không cài được — cài tay vẫn được', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('navigator', {
      ...navigator,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
      clipboard: { writeText: vi.fn() },
    })
    datManifest({ short_name: 'ĐĐH Học sinh' })
    render(<DaiCaiApp vai="hs" />)
    await act(async () => {
      vi.advanceTimersByTime(CHO_SU_KIEN_CAI_MS + 10)
    })
    expect(screen.getByRole('button', { name: 'Cài đặt' })).toBeTruthy()
    expect(screen.queryByText('Mở bằng Chrome để cài app')).toBeNull()
    vi.useRealTimers()
  })
})
