// Chỉ đổi giới hạn tải đề; metadata lượt, qid và lần khôi phục giữ nguyên.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { vaoThi } from '../src/lib/exam-api'
const m = vi.hoisted(() => ({ vao: vi.fn(), anh: vi.fn() }))
vi.mock('../src/lib/may-chu-moi', async goc => ({ ...await goc<typeof import('../src/lib/may-chu-moi')>(), xongNapDiaChi: async () => {}, layCauHinhMayChu: async () => ({ URL: 'https://worker.test', BAT: true }), vaoThiMoi: (...a: unknown[]) => m.vao(...a) }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://worker.test' }))
vi.mock('../src/lib/anh-len-may-chu', async goc => ({ ...await goc<typeof import('../src/lib/anh-len-may-chu')>(), taiSanAnhDe: (...a: unknown[]) => m.anh(...a) }))
const metadata = { ok: true, cach: 'moi', deUrl: '/de/ca1', lanThu: 3, khoaLuot: 'ca1:S1:3', vaoLuc: '2026-10-17T02:00:00Z', hetGioLuc: '2026-10-17T02:45:00Z', thoiGianPhut: 45, congBo: 'khong', lop: '12', boTheoEm: { bo: { S1: ['q1'] }, lap: { S1: ['q1'] }, dem: { S1: { q1: 2 } } } }
const de = { phanI: [{ id: 'q1', text: 'Câu công khai', choices: ['Một', 'Hai', 'Ba', 'Bốn'] }], phanII: [], phanIII: [], soCau: { I: 1, II: 0, III: 0 } }
const vao = () => vaoThi('https://worker.test', 'ca1', 'S1', 'thiet-bi-thu', true)
beforeEach(() => { vi.useFakeTimers(); m.vao.mockResolvedValue(metadata) })
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); m.vao.mockReset(); m.anh.mockReset() })
it('fetch treo không có header: 25 giây báo thử lại và abort', async () => {
  let signal!: AbortSignal, loi: Error | undefined
  vi.stubGlobal('fetch', vi.fn((_url, init) => { signal = init.signal; return new Promise(() => {}) }))
  const p = vao().catch(e => { loi = e })
  await vi.advanceTimersByTimeAsync(24_999)
  expect(loi).toBeUndefined()
  await vi.advanceTimersByTimeAsync(1)
  await p
  expect(loi?.message).toMatch(/Vào thi lại/)
  expect(signal.aborted).toBe(true)
  expect(m.anh).not.toHaveBeenCalled()
})
it('header tới nhưng JSON treo: hạn vẫn tính từ lúc tải, hủy body; JSON về muộn không phát đề/ảnh', async () => {
  let signal!: AbortSignal, traJson!: (v: unknown) => void, loi: Error | undefined
  const cancel = vi.fn(async () => {}), json = vi.fn(() => new Promise(resolve => { traJson = resolve }))
  vi.stubGlobal('fetch', vi.fn((_url, init) => { signal = init.signal; return new Promise(resolve => setTimeout(() => resolve({ ok: true, json, body: { cancel } }), 1000)) }))
  const p = vao().catch(e => { loi = e })
  await vi.advanceTimersByTimeAsync(1000)
  expect(json).toHaveBeenCalledOnce()
  await vi.advanceTimersByTimeAsync(23_999)
  expect(loi).toBeUndefined()
  await vi.advanceTimersByTimeAsync(1)
  await p
  expect(loi?.message).toMatch(/Vào thi lại/)
  expect(signal.aborted).toBe(true); expect(cancel).toHaveBeenCalledOnce()
  traJson(de); await Promise.resolve(); await Promise.resolve()
  expect(m.anh).not.toHaveBeenCalled()
})
it('mất mạng giữ lời báo kiểm tra mạng và dừng timer', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
  await expect(vao()).rejects.toThrow(/kiểm tra mạng rồi bấm Vào thi lại/)
  expect(vi.getTimerCount()).toBe(0)
})
it('JSON lỗi vẫn báo gói hỏng, body cancel lỗi không thay lỗi gốc', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => { throw new SyntaxError('JSON lỗi') }, body: { cancel: async () => { throw new TypeError('reader khóa') } } })))
  await expect(vao()).rejects.toThrow(/Gói đề tải về bị hỏng/)
  expect(vi.getTimerCount()).toBe(0)
})
it('đọc JSON thành công dừng hạn, giữ nguyên đề và metadata lượt', async () => {
  let signal!: AbortSignal
  vi.stubGlobal('fetch', vi.fn(async (_url, init) => { signal = init.signal; return { ok: true, json: () => new Promise(resolve => setTimeout(() => resolve(de), 2000)) } }))
  const p = vao()
  await vi.advanceTimersByTimeAsync(2000)
  expect(await p).toMatchObject({ ok: true, cach: 'moi', bank: de, lanThu: 3, khoaLuot: metadata.khoaLuot, vaoLuc: metadata.vaoLuc, hetGioLuc: metadata.hetGioLuc, boCuaEm: ['q1'] })
  await vi.advanceTimersByTimeAsync(30_000)
  expect(signal.aborted).toBe(false)
  expect(m.anh).toHaveBeenCalledOnce()
})
it('tải hỏng rồi Vào thi lại khôi phục cùng lượt, không đổi mốc giờ/khoá/qid', async () => {
  vi.stubGlobal('fetch', vi.fn().mockImplementationOnce(async () => ({ ok: true, json: () => new Promise(() => {}) })).mockImplementation(async () => ({ ok: true, json: async () => de })))
  const p = vao().catch(e => e)
  await vi.advanceTimersByTimeAsync(25_000)
  expect(await p).toBeInstanceOf(Error)
  m.vao.mockResolvedValue({ ...metadata, cach: 'khoi_phuc' })
  const k = await vao()
  expect(k).toMatchObject({ ok: true, cach: 'khoi_phuc', bank: de, lanThu: 3, khoaLuot: metadata.khoaLuot, vaoLuc: metadata.vaoLuc, hetGioLuc: metadata.hetGioLuc, boCuaEm: ['q1'] })
  expect(fetch).toHaveBeenCalledTimes(2)
})
