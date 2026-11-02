// @vitest-environment jsdom
// TẢI NGẦM KHO MẢNH APP HỌC SINH (thầy 02/11 «Hiệu ứng ko tải sẵn xuống máy hs à mà chậm»): lúc rảnh đọc kho-hs.json, tải đúng mảnh máy chưa có;
// không chạy khi không có service worker / tiết kiệm dữ liệu / 2G; danh sách chỉ nhận đường mảnh hợp lệ. Plugin build ghi danh sách: gốc chọn tay có đủ hiệu ứng,
// Mol, giám thị; bỏ thư viện lớn; không vào precache (globPatterns không có json).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'

const ma = readFileSync('vite.config.ts', 'utf8')

describe('plugin kho-hs.json', () => {
  it('gốc có hiệu ứng ăn mừng, Mol, giám thị, «Trong», thưởng phạt; bỏ thư viện lớn; json không vào precache', () => {
    const goc = ma.match(/const KHO_HS_GOC = (.+)\n/)![1]!
    for (const t of ['hieu-ung-an-mung', 'mol-dong', 'GiamThi', 'giam-thi', 'TrongHs', 'ManThuong', 'thuong-gon', 'ManLamBaiTap', 'ChuaGonDuo', 'ThiDuo']) expect(goc, t).toContain(t)
    expect(ma).toMatch(/const KHO_HS_BO = \/\^assets\\\/\(\?:ban-do-3d-three\|jspdf\|html2canvas/)
    expect(ma).toMatch(/globPatterns: \['\*\*\/\*\.\{js,css,html,ico,png,svg,wasm,data,woff2\}'\]/)
    expect(ma).toContain('khoNapTruocHs(),\n    VitePWA(')
  })
})

describe('tải ngầm phía máy em', () => {
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.resetModules() })
  const datMoiTruong = (o: { sw?: boolean; saveData?: boolean; loai?: string; coSan?: string[] }) => {
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: o.sw === false ? undefined : { controller: {} } })
    Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: !!o.saveData, effectiveType: o.loai ?? '4g' } })
    const coSan = new Set(o.coSan ?? [])
    Object.defineProperty(window, 'caches', { configurable: true, value: { match: vi.fn(async (u: string) => (coSan.has(u) ? new Response('') : undefined)) } })
    const goi: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (u: string) => {
      goi.push(u)
      if (u.endsWith('kho-hs.json')) return new Response(JSON.stringify({ ds: ['assets/a-12345678.js', 'assets/b-12345678.css', '../la.js', 'assets/c-12345678.js'] }))
      return new Response('x')
    }))
    return goi
  }
  it('đọc danh sách, chỉ tải mảnh chưa có, bỏ đường lạ', async () => {
    vi.useFakeTimers()
    const goi = datMoiTruong({ coSan: ['/assets/b-12345678.css'] })
    const { napTruocKhoHs } = await import('../src/lib/nap-truoc-kho-hs')
    napTruocKhoHs(); napTruocKhoHs() // gọi hai lần ⇒ chạy một lượt
    await vi.runAllTimersAsync()
    expect(goi).toEqual(['/kho-hs.json', '/assets/a-12345678.js', '/assets/c-12345678.js'])
  })
  it('không chạy khi không có service worker / tiết kiệm dữ liệu / 2G', async () => {
    const { nenTaiNgam } = await import('../src/lib/nap-truoc-kho-hs')
    datMoiTruong({ sw: false }); expect(nenTaiNgam()).toBe(false)
    datMoiTruong({ saveData: true }); expect(nenTaiNgam()).toBe(false)
    datMoiTruong({ loai: 'slow-2g' }); expect(nenTaiNgam()).toBe(false)
    datMoiTruong({ loai: '2g' }); expect(nenTaiNgam()).toBe(false)
    datMoiTruong({ loai: '3g' }); expect(nenTaiNgam()).toBe(true)
  })
})
