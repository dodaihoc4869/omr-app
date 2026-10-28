import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { laLoiThieuManh, napDong, taiLaiMotLan } from '../src/lib/nap-manh'

/** Kho giả, để test không đụng sessionStorage thật của môi trường chạy. */
function khoGia(): Storage {
  const m = new Map<string, string>()
  return {
    get length() {
      return m.size
    },
    clear: () => m.clear(),
    getItem: (k: string) => m.get(k) ?? null,
    key: (i: number) => [...m.keys()][i] ?? null,
    removeItem: (k: string) => void m.delete(k),
    setItem: (k: string, v: string) => void m.set(k, v),
  } as Storage
}

describe('laLoiThieuManh', () => {
  it('nhận ra lỗi của cả ba trình duyệt', () => {
    expect(laLoiThieuManh(new TypeError('Failed to fetch dynamically imported module: https://x/assets/a-ChU46igK.js'))).toBe(true)
    expect(laLoiThieuManh(new Error('error loading dynamically imported module'))).toBe(true)
    expect(laLoiThieuManh(new Error('Importing a module script failed.'))).toBe(true)
  })

  it('KHÔNG nhận nhầm lỗi khác — nhận nhầm là app tự tải lại vô cớ giữa buổi dạy', () => {
    expect(laLoiThieuManh(new Error('Chưa cấu hình link Apps Script'))).toBe(false)
    expect(laLoiThieuManh(new Error('NetworkError when attempting to fetch resource'))).toBe(false)
    expect(laLoiThieuManh(null)).toBe(false)
  })
})

describe('taiLaiMotLan', () => {
  // Chặn jsdom kêu "Not implemented: navigation" mỗi lần gọi reload thật.
  beforeEach(() => vi.stubGlobal('location', { href: 'https://x/hs', reload: () => {}, replace: () => {} }))
  afterEach(() => vi.unstubAllGlobals())

  it('lần đầu thì tải lại và ghi mốc thời gian', () => {
    const kho = khoGia()
    expect(taiLaiMotLan(1_000_000, kho)).toBe(true)
    expect(kho.getItem('napLaiVìThieuManh')).toBe('1000000')
  })

  it('lỗi lại ngay sau đó thì KHÔNG tải lại nữa — chặn vòng lặp vô hạn', () => {
    const kho = khoGia()
    taiLaiMotLan(1_000_000, kho)
    expect(taiLaiMotLan(1_005_000, kho)).toBe(false)
    expect(taiLaiMotLan(1_029_999, kho)).toBe(false)
  })

  it('quá 30 giây coi như lần hỏng mới, được tải lại tiếp', () => {
    const kho = khoGia()
    taiLaiMotLan(1_000_000, kho)
    expect(taiLaiMotLan(1_031_000, kho)).toBe(true)
  })

  it('máy chặn lưu trữ thì không nổ, chỉ là mất cái chặn vòng lặp', () => {
    expect(taiLaiMotLan(1, null)).toBe(false)
  })
})

describe('napDong', () => {
  it('nạp được thì trả nguyên kết quả', async () => {
    await expect(napDong(async () => ({ a: 1 }))).resolves.toEqual({ a: 1 })
  })

  it('lỗi KHÁC thì ném nguyên, không nuốt mất nguyên nhân thật', async () => {
    const loi = new Error('Hết dung lượng')
    await expect(napDong(() => Promise.reject(loi))).rejects.toBe(loi)
  })

  it('thiếu mảnh thì đổi thành câu tiếng Việt nói đúng việc phải làm', async () => {
    const noi = vi.fn()
    vi.stubGlobal('sessionStorage', khoGia())
    vi.stubGlobal('location', { href: 'https://x/hs', replace: noi })
    await expect(napDong(() => Promise.reject(new TypeError('Failed to fetch dynamically imported module: /x.js')))).rejects.toThrow(/bản cũ/i)
    expect(noi).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })
})

describe('thiếu mảnh sau khi phát hành: tải lại NGAY (thầy 28/10: màn «Đang tải bản mới» đứng kèm chữ lỗi)', () => {
  function datMoiTruong(dangKy: Record<string, unknown>) {
    const nghe: Record<string, () => void> = {}
    const sw = { addEventListener: (t: string, f: () => void) => { nghe[t] = f }, getRegistration: async () => dangKy }
    const cuNav = Object.getOwnPropertyDescriptor(globalThis.navigator, 'serviceWorker')
    Object.defineProperty(globalThis.navigator, 'serviceWorker', { value: sw, configurable: true })
    const replace = vi.fn()
    const cuLoc = globalThis.location
    Object.defineProperty(globalThis, 'location', { value: { ...cuLoc, replace }, configurable: true })
    const tra = () => {
      Object.defineProperty(globalThis, 'location', { value: cuLoc, configurable: true })
      if (cuNav) Object.defineProperty(globalThis.navigator, 'serviceWorker', cuNav)
    }
    return { nghe, replace, tra }
  }
  it('không có bản SW nằm chờ ⇒ tải lại ngay (đường `_moi` đi thẳng ra mạng), vẫn xin kiểm bản mới', async () => {
    const { taiLaiKhiCoBanMoi } = await import('../src/lib/nap-manh')
    const update = vi.fn(async () => {})
    const mt = datMoiTruong({ update, waiting: null })
    vi.useFakeTimers()
    try {
      taiLaiKhiCoBanMoi('https://x/?_moi=1')
      await Promise.resolve(); await Promise.resolve(); await Promise.resolve()
      expect(update).toHaveBeenCalled()
      expect(mt.replace).toHaveBeenCalledTimes(1)
      expect(mt.replace).toHaveBeenCalledWith('https://x/?_moi=1')
      vi.advanceTimersByTime(9000)
      expect(mt.replace).toHaveBeenCalledTimes(1)
    } finally { vi.useRealTimers(); mt.tra() }
  })
  it('bản SW mới đang nằm chờ ⇒ nhắn SKIP_WAITING, nhận quyền thì tải lại đúng một lần', async () => {
    const { taiLaiKhiCoBanMoi } = await import('../src/lib/nap-manh')
    const postMessage = vi.fn()
    const mt = datMoiTruong({ update: async () => {}, waiting: { postMessage } })
    vi.useFakeTimers()
    try {
      taiLaiKhiCoBanMoi('https://x/')
      await Promise.resolve(); await Promise.resolve(); await Promise.resolve()
      expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
      expect(mt.replace).not.toHaveBeenCalled()
      mt.nghe.controllerchange!()
      expect(mt.replace).toHaveBeenCalledTimes(1)
      vi.advanceTimersByTime(5000)
      expect(mt.replace).toHaveBeenCalledTimes(1)
    } finally { vi.useRealTimers(); mt.tra() }
  })
  it('bản nằm chờ không nhận quyền ⇒ tối đa 1,5 giây vẫn tải lại', async () => {
    const { taiLaiKhiCoBanMoi } = await import('../src/lib/nap-manh')
    const mt = datMoiTruong({ update: async () => {}, waiting: { postMessage: () => {} } })
    vi.useFakeTimers()
    try {
      taiLaiKhiCoBanMoi('https://x/')
      await Promise.resolve(); await Promise.resolve()
      vi.advanceTimersByTime(1499)
      expect(mt.replace).not.toHaveBeenCalled()
      vi.advanceTimersByTime(2)
      expect(mt.replace).toHaveBeenCalledTimes(1)
    } finally { vi.useRealTimers(); mt.tra() }
  })
})
