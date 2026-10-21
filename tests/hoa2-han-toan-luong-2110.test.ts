// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { goiHoa2 } from '../src/components/hoa2/api'
import { layDiaChiMayChu } from '../src/lib/dia-chi-may-chu'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: vi.fn() }))
vi.mock('../src/lib/hoi-som', () => ({ layHoiSom: () => null, danhDauDaNhan: vi.fn(), xemHoiSomDaVe: () => null }))
beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal('fetch', vi.fn()); vi.mocked(layDiaChiMayChu).mockReset() })
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

it('lấy địa chỉ máy chủ kẹt vẫn báo hết giờ, không để màn tải vô hạn', async () => {
  vi.mocked(layDiaChiMayChu).mockReturnValue(new Promise(() => {}))
  let ma = ''
  const p = goiHoa2('hoc-tap-start', 'token-gia', {}, 1).catch(e => { ma = e.ma })
  await vi.advanceTimersByTimeAsync(1000)
  expect(ma).toBe('het_gio')
  expect(fetch).not.toHaveBeenCalled()
  await p
})

it('đọc thân phản hồi kẹt cũng hết giờ; địa chỉ trả muộn không phát thêm yêu cầu', async () => {
  vi.mocked(layDiaChiMayChu).mockResolvedValue('https://may-gia.test')
  vi.mocked(fetch).mockResolvedValue({ json: () => new Promise(() => {}) } as unknown as Response)
  let ma = ''
  const p = goiHoa2('hoc-tap-ktcn-start', 'token-gia', {}, 1).catch(e => { ma = e.ma })
  await vi.advanceTimersByTimeAsync(1000)
  expect(ma).toBe('het_gio')
  await p
})

it('địa chỉ trả sau hạn không gửi lệnh muộn; thành công giữ nguyên kết quả và bỏ bộ hẹn', async () => {
  let tra!: (url: string) => void
  vi.mocked(layDiaChiMayChu).mockReturnValueOnce(new Promise(ok => { tra = ok }))
  const p = goiHoa2('hoc-tap-start', 'token-gia', {}, 1).catch(e => e.ma)
  await vi.advanceTimersByTimeAsync(1000)
  tra('https://may-gia.test')
  expect(await p).toBe('het_gio')
  expect(fetch).not.toHaveBeenCalled()
  vi.mocked(layDiaChiMayChu).mockResolvedValue('https://may-gia.test')
  vi.mocked(fetch).mockResolvedValue({ json: async () => ({ ok: true, questions: [] }) } as Response)
  expect(await goiHoa2('hoc-tap-start', 'token-gia', {}, 1)).toEqual({ ok: true, questions: [] })
  expect(vi.getTimerCount()).toBe(0)
})
